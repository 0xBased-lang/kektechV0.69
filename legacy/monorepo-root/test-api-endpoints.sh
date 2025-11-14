#!/bin/bash

# KEKTECH API Endpoint Testing Script
# Run this after fixing the DATABASE_URL in Vercel

BASE_URL="https://kektech-frontend.vercel.app"
TEST_MARKET="0x593c6A47d51644A54115e60aCf0Bd8bbd371e449"

echo "🧪 KEKTECH API Endpoint Testing"
echo "====================================="
echo ""

echo "1. Testing Database Health..."
echo "GET /api/health/db"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/health/db")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Database health: PASS"
else
    echo "❌ Database health: FAIL"
    echo "   Cannot proceed with other tests until database is connected"
    exit 1
fi
echo ""

echo "2. Testing Top Comments Endpoints..."
echo "GET /api/comments/top?timeframe=day&limit=1"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/comments/top?timeframe=day&limit=1")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Top comments (day): PASS"
else
    echo "❌ Top comments (day): FAIL"
fi

echo "GET /api/comments/top?timeframe=all&limit=10"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/comments/top?timeframe=all&limit=10")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Top comments (all): PASS"
else
    echo "❌ Top comments (all): FAIL"
fi
echo ""

echo "3. Testing Market Comments Endpoints..."
echo "GET /api/comments/market/${TEST_MARKET}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/comments/market/${TEST_MARKET}")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Market comments (GET): PASS"
else
    echo "❌ Market comments (GET): FAIL"
fi

echo "Testing POST /api/comments/market/[address] (should return 401 Unauthorized without auth)"
HTTP_CODE=$(curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
    -H "Content-Type: application/json" \
    -d '{"comment":"Test comment"}' \
    -w "%{http_code}" -o /dev/null)

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Market comments (POST unauthenticated): PASS (401 as expected)"
elif [ "$HTTP_CODE" = "405" ]; then
    echo "❌ Market comments (POST): FAIL (405 Method Not Allowed - URL format issue)"
else
    echo "⚠️  Market comments (POST): UNEXPECTED ($HTTP_CODE)"
fi
echo ""

echo "4. Testing Proposal Voting Endpoints..."
echo "GET /api/proposals/${TEST_MARKET}/vote"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/proposals/${TEST_MARKET}/vote")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Proposal votes (GET): PASS"
else
    echo "❌ Proposal votes (GET): FAIL"
fi

echo "Testing POST /api/proposals/[marketAddress]/vote (should return 401 without auth)"
HTTP_CODE=$(curl -s -X POST "${BASE_URL}/api/proposals/${TEST_MARKET}/vote" \
    -H "Content-Type: application/json" \
    -d '{"vote":"like"}' \
    -w "%{http_code}" -o /dev/null)

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Proposal votes (POST unauthenticated): PASS (401 as expected)"
else
    echo "⚠️  Proposal votes (POST): UNEXPECTED ($HTTP_CODE)"
fi
echo ""

echo "5. Testing Resolution Voting Endpoints..."
echo "GET /api/resolution/${TEST_MARKET}/vote"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/resolution/${TEST_MARKET}/vote")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Resolution votes (GET): PASS"
else
    echo "❌ Resolution votes (GET): FAIL"
fi

echo "Testing POST /api/resolution/[marketAddress]/vote (should return 401 without auth)"
HTTP_CODE=$(curl -s -X POST "${BASE_URL}/api/resolution/${TEST_MARKET}/vote" \
    -H "Content-Type: application/json" \
    -d '{"vote":"agree","comment":"Test comment"}' \
    -w "%{http_code}" -o /dev/null)

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Resolution votes (POST unauthenticated): PASS (401 as expected)"
else
    echo "⚠️  Resolution votes (POST): UNEXPECTED ($HTTP_CODE)"
fi
echo ""

echo "6. Testing Comment Voting Endpoints..."
# Need a valid comment ID for this test
echo "Note: Comment voting test requires a valid comment ID"
echo "Skipping automated test - manual verification needed"
echo ""

echo "====================================="
echo "🧪 Testing Complete"
echo ""
echo "📋 SUMMARY:"
echo "- If all GET endpoints return success: true, database is working"
echo "- If POST endpoints return 401, authentication is working correctly"
echo "- If any POST returns 405, there's a URL formatting issue to investigate"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. If database tests pass: All 500 errors should be resolved"
echo "2. If 405 errors persist: Investigate frontend URL formatting"
echo "3. Test frontend functionality in browser"
echo "4. Verify console errors are eliminated"
