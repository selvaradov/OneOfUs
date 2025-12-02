#!/usr/bin/env tsx
/**
 * Reset game history in the database
 *
 * This script deletes game sessions and optionally cleans up orphaned matches.
 * It can target a specific user or reset all history.
 *
 * Usage:
 *   # Reset all game history
 *   npx tsx scripts/reset-history.ts --all
 *
 *   # Reset history for a specific user
 *   npx tsx scripts/reset-history.ts --user-id <uuid>
 *
 *   # Reset all history and clean up orphaned matches
 *   npx tsx scripts/reset-history.ts --all --clean-matches
 *
 * Safety notes:
 * - game_sessions.user_id has ON DELETE CASCADE, so deleting users deletes their sessions. But this script does not delete users.
 * - match_participants.session_id has ON DELETE SET NULL, so deleting sessions orphans the references
 * - Deleting sessions also triggers stats recalculation for affected users
 */

import { sql } from '@vercel/postgres';

interface ResetOptions {
  userId?: string;
  all?: boolean;
  cleanMatches?: boolean;
  dryRun?: boolean;
}

async function resetGameHistory(options: ResetOptions): Promise<void> {
  const { userId, all, cleanMatches, dryRun } = options;

  if (!userId && !all) {
    console.error('❌ Error: Must specify either --user-id or --all');
    process.exit(1);
  }

  if (userId && all) {
    console.error('❌ Error: Cannot specify both --user-id and --all');
    process.exit(1);
  }

  try {
    console.log('🔍 Connecting to database...');
    await sql`SELECT 1`; // Test connection
    console.log('✅ Connected');

    if (dryRun) {
      console.log('\n🔎 DRY RUN MODE - No changes will be made\n');
    }

    // Step 1: Get count of sessions to be deleted
    let sessionCountResult;
    if (userId) {
      sessionCountResult = await sql`
        SELECT COUNT(*) as count FROM game_sessions WHERE user_id = ${userId}
      `;
      console.log(
        `\n📊 Found ${sessionCountResult.rows[0].count} game sessions for user ${userId}`
      );
    } else {
      sessionCountResult = await sql`
        SELECT COUNT(*) as count FROM game_sessions
      `;
      console.log(`\n📊 Found ${sessionCountResult.rows[0].count} total game sessions`);
    }

    const sessionCount = parseInt(sessionCountResult.rows[0].count);
    if (sessionCount === 0) {
      console.log('✅ No sessions to delete. Exiting.');
      return;
    }

    // Step 2: Delete game sessions
    if (!dryRun) {
      console.log('\n🗑️  Deleting game sessions...');
      if (userId) {
        await sql`DELETE FROM game_sessions WHERE user_id = ${userId}`;
      } else {
        await sql`DELETE FROM game_sessions`;
      }
      console.log(`✅ Deleted ${sessionCount} game sessions`);

      // Update user stats after deleting sessions
      if (userId) {
        console.log('\n📊 Updating user stats...');
        await sql`
          UPDATE users
          SET total_games = 0, avg_score = NULL
          WHERE id = ${userId}
        `;
        console.log('✅ User stats reset');
      } else {
        console.log('\n📊 Updating all user stats...');
        await sql`
          UPDATE users
          SET total_games = 0, avg_score = NULL
        `;
        console.log('✅ All user stats reset');
      }
    } else {
      console.log('\n[DRY RUN] Would delete game sessions and reset user stats');
    }

    // Step 3: Clean up orphaned matches (optional)
    if (cleanMatches) {
      console.log('\n🧹 Checking for orphaned matches...');

      // Find matches with no associated game sessions
      const orphanedMatchesResult = await sql`
        SELECT m.id, m.match_code, m.status
        FROM matches m
        LEFT JOIN game_sessions gs ON m.id = gs.match_id
        GROUP BY m.id
        HAVING COUNT(gs.id) = 0
      `;

      const orphanedCount = orphanedMatchesResult.rows.length;

      if (orphanedCount === 0) {
        console.log('✅ No orphaned matches found');
      } else {
        console.log(`📊 Found ${orphanedCount} orphaned matches`);

        if (!dryRun) {
          // Delete orphaned matches (will cascade to match_participants)
          await sql`
            DELETE FROM matches
            WHERE id IN (
              SELECT m.id
              FROM matches m
              LEFT JOIN game_sessions gs ON m.id = gs.match_id
              GROUP BY m.id
              HAVING COUNT(gs.id) = 0
            )
          `;
          console.log(`✅ Deleted ${orphanedCount} orphaned matches`);
        } else {
          console.log(`[DRY RUN] Would delete ${orphanedCount} orphaned matches`);
        }
      }
    }

    // Step 4: Clean up prompts_analytics if all data was deleted
    if (all && !dryRun) {
      console.log('\n🧹 Clearing prompts analytics...');
      await sql`TRUNCATE prompts_analytics`;
      console.log('✅ Prompts analytics cleared');
    }

    console.log('\n✅ Reset complete!');

    if (dryRun) {
      console.log('\n💡 Run without --dry-run to apply changes');
    }
  } catch (error) {
    console.error('\n❌ Error resetting game history:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs(): ResetOptions {
  const args = process.argv.slice(2);
  const options: ResetOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--user-id':
        options.userId = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--clean-matches':
        options.cleanMatches = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: npx tsx scripts/reset-history.ts [options]

Options:
  --user-id <uuid>    Reset history for a specific user (UUID)
  --all               Reset ALL game history (use with caution!)
  --clean-matches     Also delete orphaned matches with no sessions
  --dry-run           Show what would be deleted without making changes
  --help, -h          Show this help message

Examples:
  # See what would be deleted for a user
  npx tsx scripts/reset-history.ts --user-id abc123... --dry-run

  # Reset history for a specific user
  npx tsx scripts/reset-history.ts --user-id abc123...

  # Reset all history and clean up matches
  npx tsx scripts/reset-history.ts --all --clean-matches

  # Dry run of full reset
  npx tsx scripts/reset-history.ts --all --clean-matches --dry-run
        `);
        process.exit(0);
        break;
      default:
        console.error(`❌ Unknown argument: ${arg}`);
        console.log('Run with --help for usage information');
        process.exit(1);
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();

  // Confirm destructive action
  if (!options.dryRun && (options.all || options.userId)) {
    console.log('⚠️  WARNING: This will permanently delete game history!');

    if (options.all) {
      console.log('⚠️  You are about to delete ALL game sessions in the database!');
    } else {
      console.log(`⚠️  You are about to delete all sessions for user: ${options.userId}`);
    }

    console.log('\n💡 Tip: Run with --dry-run first to preview changes\n');

    // Give user 3 seconds to cancel
    console.log('⏳ Starting in 3 seconds... (Ctrl+C to cancel)');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  await resetGameHistory(options);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
