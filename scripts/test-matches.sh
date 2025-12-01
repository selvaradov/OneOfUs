#!/bin/bash

# Test script for 1v1 Match Mode API
# Run this after starting the dev server with: npm run dev
#
# Usage: ./scripts/test-matches.sh [base_url]
# Example: ./scripts/test-matches.sh http://localhost:3000

set -e

BASE_URL="${1:-http://localhost:3000}"
echo "Testing Match Mode API at: $BASE_URL"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
PASSED=0
FAILED=0

# Helper function to run a test
run_test() {
    local name="$1"
    local expected_status="$2"
    local method="$3"
    local endpoint="$4"
    local data="$5"

    echo -n "Testing: $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $status_code)"
        PASSED=$((PASSED + 1))
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED=$((FAILED + 1))
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Helper to extract value from JSON
extract_json() {
    echo "$1" | jq -r "$2" 2>/dev/null
}

echo ""
echo "Step 0: Initialize database (if needed)"
echo "-----------------------------------------"
curl -s -X POST "$BASE_URL/api/init-db" | jq .
echo ""

echo ""
echo "Step 1: Create test users and sessions"
echo "-----------------------------------------"

# Create User A (the challenger)
echo "Creating User A..."
USER_A_RESPONSE=$(curl -s -X POST "$BASE_URL/api/user" \
    -H "Content-Type: application/json" \
    -d '{"politicalAlignment": 3, "ageRange": "25-34", "country": "UK"}')
USER_A_ID=$(extract_json "$USER_A_RESPONSE" ".userId")
echo "User A ID: $USER_A_ID"

# Create User B (the opponent)
echo "Creating User B..."
USER_B_RESPONSE=$(curl -s -X POST "$BASE_URL/api/user" \
    -H "Content-Type: application/json" \
    -d '{"politicalAlignment": 4, "ageRange": "35-44", "country": "UK"}')
USER_B_ID=$(extract_json "$USER_B_RESPONSE" ".userId")
echo "User B ID: $USER_B_ID"

# Create a game session for User A (simulating a completed game)
# Using uk-nhs-tweet-1 which has positions: ["left", "centre", "right"]
echo ""
echo "Creating a game session for User A via /api/grade..."
GRADE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/grade" \
    -H "Content-Type: application/json" \
    -d "{
        \"promptId\": \"uk-nhs-tweet-1\",
        \"position\": \"left\",
        \"userResponse\": \"This is a test response from User A for the 1v1 match test. The NHS needs proper funding and staff support.\",
        \"userId\": \"$USER_A_ID\"
    }")
SESSION_A_ID=$(extract_json "$GRADE_RESPONSE" ".sessionId")
PROMPT_ID=$(extract_json "$GRADE_RESPONSE" ".result.promptId" 2>/dev/null || echo "uk-nhs-tweet-1")
echo "User A Session ID: $SESSION_A_ID"
echo "Grade Response:"
echo "$GRADE_RESPONSE" | jq .
echo ""

echo ""
echo "Step 2: Test Match Creation"
echo "-----------------------------------------"

# Test: Create match with valid session
echo "Creating a match from User A's session..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/match/create" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_A_ID\", \"userId\": \"$USER_A_ID\"}")
echo "$CREATE_RESPONSE" | jq .

MATCH_ID=$(extract_json "$CREATE_RESPONSE" ".matchId")
MATCH_CODE=$(extract_json "$CREATE_RESPONSE" ".matchCode")
echo ""
echo -e "${GREEN}Match created!${NC}"
echo "Match ID: $MATCH_ID"
echo "Match Code: $MATCH_CODE"
echo ""

# Test: Create match again (should return existing)
run_test "Create duplicate match (should return existing)" "200" "POST" "/api/match/create" \
    "{\"sessionId\": \"$SESSION_A_ID\", \"userId\": \"$USER_A_ID\"}"

# Test: Create match without sessionId
run_test "Create match without sessionId" "400" "POST" "/api/match/create" \
    "{\"userId\": \"$USER_A_ID\"}"

# Test: Create match with invalid session
run_test "Create match with invalid session" "404" "POST" "/api/match/create" \
    "{\"sessionId\": \"00000000-0000-0000-0000-000000000000\", \"userId\": \"$USER_A_ID\"}"

echo ""
echo "Step 3: Test Match Details (GET /api/match/[code])"
echo "-----------------------------------------"

# Test: Get match by code
run_test "Get match by valid code" "200" "GET" "/api/match/$MATCH_CODE"

# Test: Get match by invalid code
run_test "Get match by invalid code" "404" "GET" "/api/match/INVALID1"

echo ""
echo "Step 4: Test Match Join"
echo "-----------------------------------------"

# Test: Creator tries to join own match (should fail)
run_test "Creator joins own match (should fail)" "403" "POST" "/api/match/join" \
    "{\"matchCode\": \"$MATCH_CODE\", \"userId\": \"$USER_A_ID\"}"

# Test: User B joins the match
echo "User B joining the match..."
JOIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/match/join" \
    -H "Content-Type: application/json" \
    -d "{\"matchCode\": \"$MATCH_CODE\", \"userId\": \"$USER_B_ID\"}")
echo "$JOIN_RESPONSE" | jq .

JOIN_SUCCESS=$(extract_json "$JOIN_RESPONSE" ".success")
if [ "$JOIN_SUCCESS" = "true" ]; then
    echo -e "${GREEN}User B joined successfully!${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}User B join failed!${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test: User B joins again (should return alreadyJoined: true)
run_test "User B joins again (idempotent)" "200" "POST" "/api/match/join" \
    "{\"matchCode\": \"$MATCH_CODE\", \"userId\": \"$USER_B_ID\"}"

# Test: Join with invalid code
run_test "Join with invalid code" "404" "POST" "/api/match/join" \
    "{\"matchCode\": \"INVALID1\", \"userId\": \"$USER_B_ID\"}"

echo ""
echo "Step 5: Test Link Session (simulating User B completing game)"
echo "-----------------------------------------"

# First test: Try to link a session with WRONG PROMPT (should fail validation)
echo "Creating a session with WRONG prompt for validation test..."
WRONG_PROMPT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/grade" \
    -H "Content-Type: application/json" \
    -d "{
        \"promptId\": \"uk-housing-reddit-1\",
        \"position\": \"left\",
        \"userResponse\": \"This is a test with wrong prompt.\",
        \"userId\": \"$USER_B_ID\"
    }")
WRONG_PROMPT_SESSION_ID=$(extract_json "$WRONG_PROMPT_RESPONSE" ".sessionId")
echo "Wrong prompt session ID: $WRONG_PROMPT_SESSION_ID"

run_test "Link session with wrong prompt (should fail)" "400" "POST" "/api/match/link-session" \
    "{\"sessionId\": \"$WRONG_PROMPT_SESSION_ID\", \"matchId\": \"$MATCH_ID\", \"userId\": \"$USER_B_ID\"}"

# Second test: Try to link a session with WRONG POSITION (should fail validation)
echo "Creating a session with WRONG position for validation test..."
WRONG_POSITION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/grade" \
    -H "Content-Type: application/json" \
    -d "{
        \"promptId\": \"uk-nhs-tweet-1\",
        \"position\": \"right\",
        \"userResponse\": \"This is a test with wrong position.\",
        \"userId\": \"$USER_B_ID\"
    }")
WRONG_POSITION_SESSION_ID=$(extract_json "$WRONG_POSITION_RESPONSE" ".sessionId")
echo "Wrong position session ID: $WRONG_POSITION_SESSION_ID"

run_test "Link session with wrong position (should fail)" "400" "POST" "/api/match/link-session" \
    "{\"sessionId\": \"$WRONG_POSITION_SESSION_ID\", \"matchId\": \"$MATCH_ID\", \"userId\": \"$USER_B_ID\"}"

# Now create the CORRECT session for User B (same prompt, same position)
echo "Creating a game session for User B with CORRECT prompt and position..."
GRADE_B_RESPONSE=$(curl -s -X POST "$BASE_URL/api/grade" \
    -H "Content-Type: application/json" \
    -d "{
        \"promptId\": \"uk-nhs-tweet-1\",
        \"position\": \"left\",
        \"userResponse\": \"This is a test response from User B for the 1v1 match. The NHS has been chronically underfunded for years.\",
        \"userId\": \"$USER_B_ID\"
    }")
SESSION_B_ID=$(extract_json "$GRADE_B_RESPONSE" ".sessionId")
echo "User B Session ID: $SESSION_B_ID"
echo ""

# Link User B's session to the match
echo "Linking User B's correct session to the match..."
LINK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/match/link-session" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_B_ID\", \"matchId\": \"$MATCH_ID\", \"userId\": \"$USER_B_ID\"}")
echo "$LINK_RESPONSE" | jq .

MATCH_COMPLETED=$(extract_json "$LINK_RESPONSE" ".matchCompleted")
if [ "$MATCH_COMPLETED" = "true" ]; then
    echo -e "${GREEN}Match completed!${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}Match should be completed but isn't!${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo ""
echo "Step 6: Test Completed Match Results"
echo "-----------------------------------------"

# Get match details (should now include full results)
echo "Getting completed match details..."
run_test "Get completed match results" "200" "GET" "/api/match/$MATCH_CODE"

echo ""
echo "Step 7: Test Match History"
echo "-----------------------------------------"

# Get match history for User A
run_test "Get User A's match history" "200" "GET" "/api/match/history?userId=$USER_A_ID"

# Get match history for User B
run_test "Get User B's match history" "200" "GET" "/api/match/history?userId=$USER_B_ID"

# Test pagination
run_test "Get match history with pagination" "200" "GET" "/api/match/history?userId=$USER_A_ID&limit=5&offset=0"

# Test missing userId
run_test "Get match history without userId" "400" "GET" "/api/match/history"

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
