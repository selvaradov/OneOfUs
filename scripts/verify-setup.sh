#!/bin/bash

# Quick Database Setup Verification
# Checks that everything is configured correctly

echo "🔍 Verifying Database Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES=0

# Check 1: .env.local exists
echo "1. Checking .env.local file..."
if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✓${NC} .env.local exists"

    # Check if POSTGRES_URL is set
    if grep -q "POSTGRES_URL=postgresql://" .env.local; then
        echo -e "   ${GREEN}✓${NC} POSTGRES_URL is configured"
    else
        echo -e "   ${RED}✗${NC} POSTGRES_URL is not set in .env.local"
        echo -e "   ${YELLOW}→${NC} Run: vercel env pull .env.local"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "   ${RED}✗${NC} .env.local not found"
    echo -e "   ${YELLOW}→${NC} Run: vercel env pull .env.local"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 2: Anthropic API key
echo "2. Checking Anthropic API key..."
if [ -f ".env.local" ] && grep -q "ANTHROPIC_API_KEY=sk-ant-" .env.local; then
    echo -e "   ${GREEN}✓${NC} Anthropic API key is set"
else
    echo -e "   ${RED}✗${NC} Anthropic API key not found"
    echo -e "   ${YELLOW}→${NC} Add ANTHROPIC_API_KEY to .env.local"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 3: Database files exist
echo "3. Checking database files..."
if [ -f "lib/db.ts" ]; then
    echo -e "   ${GREEN}✓${NC} lib/db.ts exists"
else
    echo -e "   ${RED}✗${NC} lib/db.ts not found"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "db/schema.sql" ]; then
    echo -e "   ${GREEN}✓${NC} db/schema.sql exists"
else
    echo -e "   ${RED}✗${NC} db/schema.sql not found"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 4: API endpoints exist
echo "4. Checking API endpoints..."
ENDPOINTS=(
    "app/api/user/route.ts"
    "app/api/grade/route.ts"
    "app/api/history/route.ts"
    "app/api/stats/route.ts"
    "app/api/init-db/route.ts"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo -e "   ${GREEN}✓${NC} $endpoint"
    else
        echo -e "   ${RED}✗${NC} $endpoint not found"
        ISSUES=$((ISSUES + 1))
    fi
done
echo ""

# Check 5: Dev server running
echo "5. Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Dev server is running at http://localhost:3000"
else
    echo -e "   ${YELLOW}⚠${NC}  Dev server is not running"
    echo -e "   ${YELLOW}→${NC} Start with: npm run dev"
fi
echo ""

# Check 6: Database initialization
if [ $ISSUES -eq 0 ]; then
    echo "6. Testing database connection..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/init-db 2>/dev/null)

    if [ "$RESPONSE" = "200" ]; then
        echo -e "   ${GREEN}✓${NC} Database is initialized and connected"
    elif [ "$RESPONSE" = "401" ]; then
        echo -e "   ${GREEN}✓${NC} Database endpoint is protected (production mode)"
    elif [ -z "$RESPONSE" ]; then
        echo -e "   ${YELLOW}⚠${NC}  Cannot test - dev server not running"
        echo -e "   ${YELLOW}→${NC} Start server: npm run dev"
    else
        echo -e "   ${RED}✗${NC} Database connection issue (HTTP $RESPONSE)"
        echo -e "   ${YELLOW}→${NC} Run: curl -X POST http://localhost:3000/api/init-db"
        ISSUES=$((ISSUES + 1))
    fi
    echo ""
fi

# Summary
echo "============================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ Setup looks good!${NC}"
    echo ""
    echo "Ready to test:"
    echo "  ./scripts/test-database.sh"
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Fix the issues above, then run:"
    echo "  ./scripts/verify-setup.sh"
fi
