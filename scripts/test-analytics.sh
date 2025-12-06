#!/bin/bash

# Test script for Admin Analytics API (including Match Analytics)
# Run this after starting the dev server with: npm run dev
#
# This tests the admin analytics endpoint: GET /api/admin/analytics
# The endpoint returns both general analytics and match analytics
#
# Usage: ./scripts/test-match-analytics.sh [base_url]
# Example: ./scripts/test-match-analytics.sh http://localhost:3000

set -e

BASE_URL="${1:-http://localhost:3000}"

# Load admin password from .env.local
if [ -f ".env.local" ]; then
    ADMIN_DASHBOARD_PASSWORD=$(grep '^ADMIN_DASHBOARD_PASSWORD=' .env.local | cut -d '=' -f2- | tr -d '\r')
fi

echo "Testing Analytics API at: $BASE_URL"
echo "=========================================="
echo ""

# Function to get auth token
get_auth_token() {
    local password="$1"
    local response=$(curl -s -X POST "$BASE_URL/api/admin/auth" \
        -H "Content-Type: application/json" \
        -d "{\"password\": \"$password\"}")
    
    local success=$(echo "$response" | jq -r '.success' 2>/dev/null)
    if [ "$success" = "true" ]; then
        echo "$response" | jq -r '.token'
    else
        echo ""
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    local auth_header="$5"

    echo -e "${BLUE}Testing: $name${NC}"

    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $auth_header")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED=$((FAILED + 1))
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Helper to extract value from JSON
extract_json() {
    echo "$1" | jq -r "$2" 2>/dev/null
}

# Helper to validate analytics structure
validate_analytics_structure() {
    local response="$1"
    local errors=0
    
    # Check top-level fields
    fields=(
        "success"
        "matchAnalytics"
    )
    
    for field in "${fields[@]}"; do
        if ! echo "$response" | jq -e ".$field" > /dev/null 2>&1; then
            echo -e "${RED}✗${NC} Missing field: $field"
            errors=$((errors + 1))
        fi
    done
    
    # Check matchAnalytics fields
    analytics_fields=(
        "totalMatches"
        "completedMatches"
        "pendingMatches"
        "expiredMatches"
        "completionRate"
        "participationRate"
        "avgScoreDifference"
        "avgScoreGap"
        "statusDistribution"
        "scoreDistributionByRole"
        "topCreators"
    )
    
    for field in "${analytics_fields[@]}"; do
        if ! echo "$response" | jq -e ".matchAnalytics.$field" > /dev/null 2>&1; then
            echo -e "${RED}✗${NC} Missing field: matchAnalytics.$field"
            errors=$((errors + 1))
        fi
    done
    
    # Check statusDistribution structure
    if ! echo "$response" | jq -e '.matchAnalytics.statusDistribution | length > 0' > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} statusDistribution is empty (may be valid if no matches exist)"
    elif ! echo "$response" | jq -e '.matchAnalytics.statusDistribution[0] | has("status", "count", "percentage")' > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} statusDistribution items may have incorrect structure"
    fi
    
    # Check scoreDistributionByRole structure
    if echo "$response" | jq -e '.matchAnalytics.scoreDistributionByRole | has("creators", "opponents")' > /dev/null 2>&1; then
        # Check that both have 10 bins (0-9, 10-19, ... 90-100)
        creators_count=$(echo "$response" | jq '.matchAnalytics.scoreDistributionByRole.creators | length')
        opponents_count=$(echo "$response" | jq '.matchAnalytics.scoreDistributionByRole.opponents | length')
        
        if [ "$creators_count" != "10" ]; then
            echo -e "${RED}✗${NC} creators distribution has $creators_count bins (expected 10)"
            errors=$((errors + 1))
        fi
        
        if [ "$opponents_count" != "10" ]; then
            echo -e "${RED}✗${NC} opponents distribution has $opponents_count bins (expected 10)"
            errors=$((errors + 1))
        fi
    else
        echo -e "${RED}✗${NC} scoreDistributionByRole missing creators or opponents"
        errors=$((errors + 1))
    fi
    
    # Check topCreators structure
    if ! echo "$response" | jq -e '.matchAnalytics.topCreators | type == "array"' > /dev/null 2>&1; then
        echo -e "${RED}✗${NC} topCreators is not an array"
        errors=$((errors + 1))
    else
        top_creators_count=$(echo "$response" | jq '.matchAnalytics.topCreators | length')
        
        if [ "$top_creators_count" -gt 0 ]; then
            if ! echo "$response" | jq -e '.matchAnalytics.topCreators[0] | has("userId", "matchesCreated", "completedMatches", "wins", "winRate")' > /dev/null 2>&1; then
                echo -e "${RED}✗${NC} topCreators items have incorrect structure"
                errors=$((errors + 1))
            fi
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✓ Structure validation passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Structure validation failed with $errors errors${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

if [ -z "$ADMIN_DASHBOARD_PASSWORD" ]; then
    echo -e "${RED}✗ No admin password found in .env.local${NC}"
    echo ""
    echo "Please ensure ADMIN_DASHBOARD_PASSWORD is set in your .env.local file:"
    echo "  ADMIN_DASHBOARD_PASSWORD=your_password_here"
    echo ""
    echo "You can still run tests without authentication (they should fail with 401):"
    read -p "Continue without authentication? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Loaded ADMIN_DASHBOARD_PASSWORD from .env.local${NC}"
    echo -e "${BLUE}Getting authentication token...${NC}"
    
    # First check if the server is running
    if ! curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
        echo -e "${RED}✗ Cannot connect to dev server at $BASE_URL${NC}"
        echo ""
        echo "Please start the dev server with: npm run dev"
        echo ""
        exit 1
    fi
    
    AUTH_TOKEN=$(get_auth_token "$ADMIN_DASHBOARD_PASSWORD")
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}✗ Failed to get authentication token${NC}"
        echo "Please check your password in .env.local"
        echo ""
        echo "You can still run tests without authentication (they should fail with 401):"
        read -p "Continue without authentication? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Successfully obtained auth token${NC}"
    fi
fi

echo ""
echo "Test 1: Unauthorized Access (No Auth Header)"
echo "--------------------------------------------"
run_test "Access without authentication" "401" "GET" "/api/admin/analytics" ""

echo ""
echo "Test 2: Unauthorized Access (Invalid Auth)"
echo "--------------------------------------------"
run_test "Access with invalid token" "401" "GET" "/api/admin/analytics" "invalid_token"

if [ -n "$AUTH_TOKEN" ]; then
    echo ""
    echo "Test 3: Authorized Access (Valid Auth)"
    echo "--------------------------------------------"
    
    analytics_response=$(curl -s "$BASE_URL/api/admin/analytics" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    status=$(echo "$analytics_response" | jq -r '.success')
    
    if [ "$status" = "true" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Retrieved admin analytics"
        PASSED=$((PASSED + 1))
        
        # Check that both analytics and matchAnalytics are present
        if ! echo "$analytics_response" | jq -e '.analytics' > /dev/null 2>&1; then
            echo -e "${RED}✗${NC} Missing general analytics"
            FAILED=$((FAILED + 1))
        fi
        
        if ! echo "$analytics_response" | jq -e '.matchAnalytics' > /dev/null 2>&1; then
            echo -e "${RED}✗${NC} Missing match analytics"
            FAILED=$((FAILED + 1))
        fi
        echo ""
        
        # Validate structure
        validate_analytics_structure "$analytics_response"
                
    else
        echo -e "${RED}✗ FAILED${NC} - Failed to retrieve admin analytics"
        FAILED=$((FAILED + 1))
        echo "$analytics_response" | jq .
        echo ""
    fi
    
else
    echo ""
    echo -e "${YELLOW}Skipping authenticated tests (no auth token)${NC}"
    echo ""
fi

echo ""
echo "================================================================"
echo "TEST SUMMARY"
echo "================================================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
