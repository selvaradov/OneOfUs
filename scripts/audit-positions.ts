#!/usr/bin/env tsx
/**
 * Audit game sessions for invalid position values
 *
 * Identifies game sessions that use position values not in the current VALID_POSITIONS list.
 * Useful for finding outdated positions like 'nationalist-conservative' that need to be migrated.
 *
 * Usage:
 *   # Check local database (uses .env.local by default)
 *   npx tsx scripts/audit-positions.ts
 *
 *   # Check production database
 *   npx tsx scripts/audit-positions.ts --db-url <postgres-url>
 *
 *   # Show detailed examples of invalid sessions
 *   npx tsx scripts/audit-positions.ts --verbose
 *
 *   # Export invalid sessions to JSON
 *   npx tsx scripts/audit-positions.ts --export invalid-sessions.json
 */

import { createPool } from '@vercel/postgres';
import { VALID_POSITIONS } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

interface AuditOptions {
  verbose?: boolean;
  export?: string;
  dbUrl?: string;
}

interface InvalidPositionSummary {
  position: string;
  count: number;
  sessionIds: string[];
}

async function auditPositions(options: AuditOptions): Promise<void> {
  const { verbose, export: exportPath, dbUrl: providedDbUrl } = options;

  try {
    console.log('🔍 Connecting to database...');

    // Load environment from .env.local if not provided via CLI
    let dbUrl = providedDbUrl;
    if (!dbUrl) {
      // Try loading from .env.local first, then .env
      config({ path: path.resolve(process.cwd(), '.env.local') });
      config({ path: path.resolve(process.cwd(), '.env') });

      dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    }

    if (!dbUrl) {
      console.error('❌ Error: Database URL not found');
      console.error('   Set POSTGRES_URL in .env.local or use --db-url flag');
      process.exit(1);
    }

    // Show which database we're connected to (hide credentials)
    const urlObj = new URL(dbUrl);
    console.log(`✅ Connected to: ${urlObj.host}`);
    console.log();

    // Create connection pool with the specified URL
    const db = createPool({ connectionString: dbUrl });

    // Get all distinct positions from the database
    console.log('📊 Analyzing position values in game_sessions...\n');

    const positionsResult = await db.sql`
      SELECT
        position_assigned,
        COUNT(*) as count,
        ARRAY_AGG(id::text ORDER BY created_at DESC) as session_ids
      FROM game_sessions
      GROUP BY position_assigned
      ORDER BY count DESC
    `;

    const validPositionSet = new Set(VALID_POSITIONS);
    const invalidPositions: InvalidPositionSummary[] = [];
    const validPositions: InvalidPositionSummary[] = [];

    console.log('Current valid positions:', VALID_POSITIONS.join(', '));
    console.log('─'.repeat(80));

    // Categorize positions
    for (const row of positionsResult.rows) {
      const position = row.position_assigned;
      const count = parseInt(row.count);
      const sessionIds = row.session_ids || [];

      const summary: InvalidPositionSummary = {
        position,
        count,
        sessionIds,
      };

      if (validPositionSet.has(position)) {
        validPositions.push(summary);
      } else {
        invalidPositions.push(summary);
      }
    }

    // Report valid positions
    console.log('\n✅ Valid positions found:');
    if (validPositions.length === 0) {
      console.log('   (none)');
    } else {
      for (const { position, count } of validPositions) {
        console.log(`   ${position.padEnd(25)} ${count.toString().padStart(6)} sessions`);
      }
    }

    // Report invalid positions
    console.log('\n❌ Invalid/outdated positions found:');
    if (invalidPositions.length === 0) {
      console.log('   (none) ✨ All positions are valid!');
    } else {
      for (const { position, count } of invalidPositions) {
        console.log(`   ${position.padEnd(25)} ${count.toString().padStart(6)} sessions`);
      }

      // Summary statistics
      const totalInvalid = invalidPositions.reduce((sum, p) => sum + p.count, 0);
      const totalAll = [...validPositions, ...invalidPositions].reduce(
        (sum, p) => sum + p.count,
        0
      );
      const percentInvalid = ((totalInvalid / totalAll) * 100).toFixed(2);

      console.log('\n📈 Summary:');
      console.log(`   Total sessions: ${totalAll}`);
      console.log(`   Invalid sessions: ${totalInvalid} (${percentInvalid}%)`);
      console.log(`   Invalid position types: ${invalidPositions.length}`);
    }

    // Verbose mode: Show sample sessions for each invalid position
    if (verbose && invalidPositions.length > 0) {
      console.log('\n📋 Sample sessions with invalid positions:\n');

      for (const { position, count } of invalidPositions) {
        console.log(`\n━━ Position: "${position}" ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Get details for up to 5 sample sessions by position
        const samplesResult = await db.sql`
          SELECT
            id, user_id, position_assigned, prompt_id,
            created_at, score
          FROM game_sessions
          WHERE position_assigned = ${position}
          ORDER BY created_at DESC
          LIMIT 5
        `;

        for (const session of samplesResult.rows) {
          console.log(`  Session: ${session.id}`);
          console.log(`    User: ${session.user_id}`);
          console.log(`    Prompt: ${session.prompt_id}`);
          console.log(`    Score: ${session.score || 'N/A'}`);
          console.log(`    Created: ${new Date(session.created_at).toISOString()}`);
          console.log();
        }

        if (count > 5) {
          console.log(`  ... and ${count - 5} more sessions`);
        }
      }
    }

    // Export mode: Save invalid sessions to JSON
    if (exportPath && invalidPositions.length > 0) {
      console.log(`\n💾 Exporting invalid sessions to ${exportPath}...`);

      // Query all invalid sessions by position (query each position separately and combine)
      const allSessions: unknown[] = [];
      for (const { position } of invalidPositions) {
        const result = await db.sql`
          SELECT
            id, user_id, position_assigned, prompt_id, prompt_scenario,
            created_at, completed_at, score, detected,
            rubric_understanding, rubric_authenticity, rubric_execution
          FROM game_sessions
          WHERE position_assigned = ${position}
          ORDER BY created_at DESC
        `;
        allSessions.push(...result.rows);
      }

      // Sort all sessions by created_at
      const invalidSessionsResult = {
        rows: allSessions.sort((a, b) => {
          const aDate = (a as { created_at: string }).created_at;
          const bDate = (b as { created_at: string }).created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }),
      };

      const exportData = {
        exportedAt: new Date().toISOString(),
        database: new URL(dbUrl).host,
        summary: {
          totalInvalidSessions: invalidSessionsResult.rows.length,
          invalidPositions: invalidPositions.map((p) => ({
            position: p.position,
            count: p.count,
          })),
        },
        sessions: invalidSessionsResult.rows,
      };

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`✅ Exported ${invalidSessionsResult.rows.length} invalid sessions`);
    }

    // Suggest next steps if invalid positions found
    if (invalidPositions.length > 0) {
      console.log('\n💡 Suggested next steps:');
      console.log('   1. Review the invalid positions above');
      console.log('   2. Decide on migration strategy:');
      console.log('      - Map to current positions (e.g., "nationalist-conservative" → "right")');
      console.log('      - Delete sessions with invalid positions');
      console.log('      - Add old positions back to VALID_POSITIONS if needed');
      console.log('   3. Create a migration script to update position_assigned values');
      console.log('\n   Example migration:');
      console.log('   UPDATE game_sessions');
      console.log("   SET position_assigned = 'right'");
      console.log("   WHERE position_assigned = 'nationalist-conservative';");
    }
  } catch (error) {
    console.error('\n❌ Error auditing positions:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs(): AuditOptions {
  const args = process.argv.slice(2);
  const options: AuditOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--export':
      case '-e':
        options.export = args[++i];
        break;
      case '--db-url':
        options.dbUrl = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: npx tsx scripts/audit-positions.ts [options]

Audit game sessions for invalid position values that don't match VALID_POSITIONS.

Options:
  --verbose, -v           Show sample sessions for each invalid position
  --export <file>, -e     Export invalid sessions to JSON file
  --db-url <url>          Database connection string (defaults to .env.local)
  --help, -h              Show this help message

Examples:
  # Check local database (uses .env.local)
  npx tsx scripts/audit-positions.ts

  # Check with verbose output
  npx tsx scripts/audit-positions.ts --verbose

  # Check production database
  npx tsx scripts/audit-positions.ts --db-url "postgres://user:pass@host/db"

  # Check production and export results
  npx tsx scripts/audit-positions.ts --db-url <prod-url> --export invalid.json
        `);
        process.exit(0);
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
  await auditPositions(options);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
