#!/bin/bash

# Reset matches database tables for development/testing
# This script clears all match-related data while preserving other data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load .env.local and export variables (if present)
if [ -f ".env.local" ]; then
  set -a              # automatically export all variables
  . .env.local        # or: source .env.local
  set +a
fi


echo -e "${YELLOW}⚠️  This will delete all match data from the database!${NC}"
echo ""
echo "Tables to be cleared:"
echo "  - match_participants (all rows)"
echo "  - matches (all rows)"
echo "  - game_sessions.match_id (set to NULL)"
echo ""
read -r -p "Are you sure you want to continue? (y/N) " REPLY
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi


# Check for required environment variables
if [ -z "$POSTGRES_URL" ]; then
    echo -e "${RED}Error: POSTGRES_URL environment variable not set${NC}"
    echo "Make sure you have your .env.local file sourced or set POSTGRES_URL"
    exit 1
fi

echo ""
echo -e "${YELLOW}Resetting match data...${NC}"

# Run the SQL commands
psql "$POSTGRES_URL" << EOF
-- Clear match_id from game_sessions first (foreign key)
UPDATE game_sessions SET match_id = NULL WHERE match_id IS NOT NULL;

-- Delete all match participants
DELETE FROM match_participants;

-- Delete all matches
DELETE FROM matches;

-- Show counts
SELECT 'matches' as table_name, COUNT(*) as remaining FROM matches
UNION ALL
SELECT 'match_participants', COUNT(*) FROM match_participants
UNION ALL
SELECT 'game_sessions with match_id', COUNT(*) FROM game_sessions WHERE match_id IS NOT NULL;
EOF

echo ""
echo -e "${GREEN}✓ Match data reset complete!${NC}"
