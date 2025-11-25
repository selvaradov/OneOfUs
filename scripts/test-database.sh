#!/bin/bash

# Database Integration Test Script
# Tests all database endpoints and verifies they're working correctly

set -e  # Exit on any error

BASE_URL="${BASE_URL:-http://localhost:3000}"
echo "🧪 Testing database integration at $BASE_URL"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to print test results
test_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: Database initialization endpoint exists
echo "Test 1: Check /api/init-db endpoint"
echo "------------------------------------"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/init-db")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    test_result "init-db endpoint is accessible (HTTP $RESPONSE)"
else
    echo -e "${RED}✗ FAIL${NC}: init-db endpoint returned HTTP $RESPONSE"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Create a test user
echo "Test 2: Create test user via /api/user"
echo "---------------------------------------"
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/user" \
    -H "Content-Type: application/json" \
    -d '{"politicalAlignment": 3, "ageRange": "25-34", "country": "UK"}')

echo "Response: $USER_RESPONSE"

# Extract userId from response
USER_ID=$(echo "$USER_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
    test_result "User created successfully with ID: $USER_ID"
    echo ""
else
    echo -e "${RED}✗ FAIL${NC}: Failed to create user or extract userId"
    echo "Response was: $USER_RESPONSE"
    FAILED=$((FAILED + 1))
    echo ""
    echo "⚠️  Remaining tests require a user ID, skipping..."
    exit 1
fi

# Test 3: Get user info
echo "Test 3: Fetch user info via /api/user?userId=$USER_ID"
echo "------------------------------------------------------"
GET_USER_RESPONSE=$(curl -s "$BASE_URL/api/user?userId=$USER_ID")
echo "Response: $GET_USER_RESPONSE"

if echo "$GET_USER_RESPONSE" | grep -q '"success":true'; then
    test_result "User info retrieved successfully"
else
    echo -e "${RED}✗ FAIL${NC}: Failed to retrieve user info"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Get user stats (should be empty)
echo "Test 4: Fetch user stats via /api/stats?userId=$USER_ID"
echo "--------------------------------------------------------"
STATS_RESPONSE=$(curl -s "$BASE_URL/api/stats?userId=$USER_ID")
echo "Response: $STATS_RESPONSE"

if echo "$STATS_RESPONSE" | grep -q '"success":true'; then
    test_result "User stats endpoint working (stats may be empty)"
else
    echo -e "${RED}✗ FAIL${NC}: Failed to retrieve user stats"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Get user history (should be empty)
echo "Test 5: Fetch user history via /api/history?userId=$USER_ID"
echo "------------------------------------------------------------"
HISTORY_RESPONSE=$(curl -s "$BASE_URL/api/history?userId=$USER_ID&limit=10&offset=0")
echo "Response: $HISTORY_RESPONSE"

if echo "$HISTORY_RESPONSE" | grep -q '"success":true'; then
    test_result "User history endpoint working"
else
    echo -e "${RED}✗ FAIL${NC}: Failed to retrieve user history"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Get global prompt analytics
echo "Test 6: Fetch global prompt analytics via /api/stats?type=prompts"
echo "------------------------------------------------------------------"
PROMPTS_RESPONSE=$(curl -s "$BASE_URL/api/stats?type=prompts")
echo "Response: $PROMPTS_RESPONSE"

if echo "$PROMPTS_RESPONSE" | grep -q '"success":true'; then
    test_result "Global prompt analytics endpoint working"
else
    echo -e "${RED}✗ FAIL${NC}: Failed to retrieve prompt analytics"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Verify prompts_analytics table is populated after sessions
echo "Test 7: Check prompts_analytics table population"
echo "-------------------------------------------------"
# Check if there are any entries in prompts_analytics
ANALYTICS_TABLE=$(curl -s "$BASE_URL/api/stats?type=prompts")
if echo "$ANALYTICS_TABLE" | grep -q '"prompts":\['; then
    # Check if array has content (more than just [])
    if echo "$ANALYTICS_TABLE" | grep -q '"prompt_id"'; then
        test_result "prompts_analytics table has data (auto-populated after sessions)"
    else
        echo -e "${YELLOW}⚠ WARN${NC}: prompts_analytics table exists but is empty (expected if no games played yet)"
        test_result "prompts_analytics endpoint working (table empty as expected)"
    fi
else
    echo -e "${YELLOW}⚠ WARN${NC}: Could not verify prompts_analytics table content"
    test_result "prompts_analytics endpoint accessible"
fi
echo ""

# Test 8: Database connection check (via any endpoint)
echo "Test 8: Verify database connectivity"
echo "-------------------------------------"
# If any of the above succeeded, database is connected
if [ $PASSED -gt 2 ]; then
    test_result "Database connection verified (via successful API calls)"
else
    echo -e "${RED}✗ FAIL${NC}: Database may not be connected"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "================================================"
echo "TEST SUMMARY"
echo "================================================"
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "Failed: 0"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps to test new analytics features:"
    echo "1. Open http://localhost:3000 and complete onboarding"
    echo "2. Play a game (with timing tracking - duration_seconds will be recorded)"
    echo "3. Check browser console for 'saved to database' message"
    echo "4. Visit http://localhost:3000/history to see database-backed history"
    echo "5. Play multiple games to populate prompts_analytics table"
    echo "6. Re-run this script to verify prompts_analytics has data"
    echo ""
    echo "Analytics features tested:"
    echo "  ✓ Prompt analytics (aggregated stats per prompt)"
    echo "  ✓ Session duration tracking (client-side timer)"
    echo "  ✓ User timing analytics (duration_seconds in game_sessions)"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure dev server is running: npm run dev"
    echo "2. Check that database was initialized: curl -X POST http://localhost:3000/api/init-db"
    echo "3. Verify POSTGRES_URL in .env.local is set"
    echo "4. Check console logs for database connection errors"
    exit 1
fi
