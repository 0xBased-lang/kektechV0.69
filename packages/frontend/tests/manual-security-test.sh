#!/bin/bash

# KEKTECH Security Testing Script
# Tests rate limiting, origin validation, and XSS protection

BASE_URL="http://localhost:3001"
TEST_MARKET="0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84"

echo "🔒 KEKTECH Security Testing"
echo "============================"
echo ""

# Test 1: Origin Validation (CSRF Protection)
echo "Test 1: Origin Validation (CSRF Protection)"
echo "-------------------------------------------"
echo "Testing POST with invalid origin (should get 403)..."
curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json" \
  -d '{"comment": "test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  | head -10

echo ""
echo "Testing POST with valid origin (should proceed to auth check)..."
curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -d '{"comment": "test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  | head -10

echo ""
echo ""

# Test 2: Rate Limiting
echo "Test 2: Rate Limiting (10 requests/minute)"
echo "-------------------------------------------"
echo "Sending 15 rapid requests (should block after 10th)..."
for i in {1..15}; do
  RESPONSE=$(curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
    -H "Content-Type: application/json" \
    -d "{\"comment\": \"test ${i}\"}" \
    -w "\n%{http_code}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "429" ]; then
    echo "Request ${i}: ✅ BLOCKED (HTTP 429) - Rate limit working!"
    echo "Response: ${BODY}" | jq '.' 2>/dev/null || echo "Response: ${BODY}"
    break
  else
    echo "Request ${i}: HTTP ${HTTP_CODE}"
  fi
done

echo ""
echo ""

# Test 3: XSS Protection (requires auth, will test structure)
echo "Test 3: Input Validation & XSS Protection"
echo "------------------------------------------"
echo "Testing with malicious XSS payload..."
curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
  -H "Content-Type: application/json" \
  -d '{"comment": "<script>alert(1)</script><img src=x onerror=alert(1)>"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "Testing with invalid market address format..."
curl -s -X POST "${BASE_URL}/api/comments/market/invalid-address" \
  -H "Content-Type: application/json" \
  -d '{"comment": "test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 4: GET requests (no auth needed)
echo "Test 4: GET Requests (should not be rate limited)"
echo "-------------------------------------------------"
echo "Testing 5 GET requests (should all succeed)..."
for i in {1..5}; do
  RESPONSE=$(curl -s -X GET "${BASE_URL}/api/comments/market/${TEST_MARKET}" -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  echo "GET Request ${i}: HTTP ${HTTP_CODE}"
done

echo ""
echo ""
echo "✅ Security testing complete!"
echo ""
echo "Expected Results:"
echo "- Test 1: Invalid origin blocked with 403"
echo "- Test 2: Rate limit triggered after 10 requests (HTTP 429)"
echo "- Test 3: XSS payloads would be sanitized (auth needed for full test)"
echo "- Test 4: GET requests should all succeed (no rate limit on reads)"
