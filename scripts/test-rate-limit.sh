#!/bin/bash

# Test script for rate limiting
# This script makes rapid requests to /api/grade to test rate limits

API_URL="${1:-http://localhost:3000}"
ENDPOINT="$API_URL/api/grade"

echo "Testing rate limiting on $ENDPOINT"
echo "=========================================="
echo ""

# Create a sample request payload
PAYLOAD='{
  "promptId": "uk-tweet-healthcare-01",
  "position": "left",
  "userResponse": "Testing rate limiting"
}'

echo "Making 25 requests (should succeed for first 20, then get rate limited)..."
echo ""

for i in {1..25}; do
  echo -n "Request $i: "

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "429" ]; then
    echo "❌ RATE LIMITED (429)"
    ERROR=$(echo "$BODY" | jq -r '.error // "Rate limit exceeded"')
    RETRY_AFTER=$(echo "$BODY" | jq -r '.retryAfter // "unknown"')
    echo "   Error: $ERROR"
    echo "   Retry after: $RETRY_AFTER seconds"
    echo ""
    echo "✅ Rate limiting is working!"
    exit 0
  elif [ "$HTTP_CODE" = "200" ]; then
    SUCCESS=$(echo "$BODY" | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
      echo "✅ SUCCESS (200)"
    else
      ERROR=$(echo "$BODY" | jq -r '.error // "unknown error"')
      echo "⚠️  FAILED: $ERROR"
    fi
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  NOT FOUND (404) - Check if prompt ID exists"
  else
    echo "⚠️  Unexpected status: $HTTP_CODE"
  fi

  # Small delay to avoid overwhelming the server
  sleep 0.2
done

echo ""
echo "❌ Rate limiting did NOT trigger after 25 requests (expected after 20)"
echo "This might indicate rate limiting is not working correctly."
