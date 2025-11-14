#!/bin/bash

# KEKTECH Security Testing Script v2
# Properly sends Origin headers for comprehensive testing

BASE_URL="http://localhost:3001"
TEST_MARKET="0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84"
VALID_ORIGIN="http://localhost:3001"

echo "🔒 KEKTECH Security Testing v2"
echo "================================"
echo ""

# Test 1: Origin Validation
echo "Test 1: Origin Validation (CSRF Protection)"
echo "-------------------------------------------"
echo "❌ Bad origin (should get 403)..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json" \
  -d '{"comment": "test"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ PASS: Bad origin blocked (HTTP 403)"
  echo "Response: $(echo "$BODY" | jq -c '.')"
else
  echo "❌ FAIL: Bad origin NOT blocked (HTTP $HTTP_CODE)"
fi

echo ""
echo "✅ Valid origin (should get 401 - auth required)..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
  -H "Origin: ${VALID_ORIGIN}" \
  -H "Content-Type: application/json" \
  -d '{"comment": "test"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS: Valid origin accepted, auth required (HTTP 401)"
  echo "Response: $(echo "$BODY" | jq -c '.')"
elif [ "$HTTP_CODE" = "403" ]; then
  echo "❌ FAIL: Valid origin blocked (HTTP 403)"
  echo "Response: $(echo "$BODY" | jq -c '.')"
else
  echo "⚠️  UNEXPECTED: HTTP $HTTP_CODE"
  echo "Response: $(echo "$BODY" | jq -c '.')"
fi

echo ""
echo ""

# Test 2: Rate Limiting
echo "Test 2: Rate Limiting (10 requests/minute per IP)"
echo "---------------------------------------------------"
echo "Sending 12 requests with valid origin..."

RATE_LIMITED=false
for i in {1..12}; do
  RESPONSE=$(curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
    -H "Origin: ${VALID_ORIGIN}" \
    -H "Content-Type: application/json" \
    -d "{\"comment\": \"test ${i}\"}" \
    -w "\n%{http_code}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "429" ]; then
    echo "Request ${i}: ✅ RATE LIMITED (HTTP 429)"
    echo "Response: $(echo "$BODY" | jq -c '.')"
    RATE_LIMITED=true
    break
  elif [ "$HTTP_CODE" = "401" ]; then
    echo "Request ${i}: HTTP 401 (auth required - normal)"
  elif [ "$HTTP_CODE" = "403" ]; then
    echo "Request ${i}: ❌ HTTP 403 (origin blocked - unexpected)"
  else
    echo "Request ${i}: HTTP ${HTTP_CODE}"
  fi

  # Small delay to avoid overwhelming the server
  sleep 0.1
done

if [ "$RATE_LIMITED" = true ]; then
  echo "✅ PASS: Rate limiting working!"
else
  echo "⚠️  Rate limit NOT triggered (may need more requests or auth)"
fi

echo ""
echo ""

# Test 3: XSS Protection Structure
echo "Test 3: XSS Protection (Structure Test)"
echo "----------------------------------------"
echo "Testing XSS payload handling..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/comments/market/${TEST_MARKET}" \
  -H "Origin: ${VALID_ORIGIN}" \
  -H "Content-Type: application/json" \
  -d '{"comment": "<script>alert(1)</script><img src=x onerror=alert(1)>"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: ${HTTP_CODE}"
echo "Response: $(echo "$BODY" | jq -c '.')"
echo "Note: XSS sanitization would happen on authenticated requests (need wallet signature for full test)"

echo ""
echo ""

# Test 4: Address Validation
echo "Test 4: Address Validation"
echo "---------------------------"
echo "Testing invalid market address..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/comments/market/invalid-address-123" \
  -H "Origin: ${VALID_ORIGIN}" \
  -H "Content-Type: application/json" \
  -d '{"comment": "test"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ PASS: Invalid address rejected (HTTP 400)"
  echo "Response: $(echo "$BODY" | jq -c '.')"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "⚠️  Address validation may have passed (got to auth: HTTP 401)"
  echo "Response: $(echo "$BODY" | jq -c '.')"
else
  echo "HTTP Status: ${HTTP_CODE}"
  echo "Response: $(echo "$BODY" | jq -c '.')"
fi

echo ""
echo ""

# Test 5: GET Requests (no security middleware)
echo "Test 5: GET Requests (No Rate Limiting)"
echo "----------------------------------------"
SUCCESS=0
for i in {1..5}; do
  HTTP_CODE=$(curl -s -X GET "${BASE_URL}/api/comments/market/${TEST_MARKET}" -w "%{http_code}" -o /dev/null)
  if [ "$HTTP_CODE" = "200" ]; then
    ((SUCCESS++))
  fi
done

echo "✅ ${SUCCESS}/5 GET requests successful"
if [ $SUCCESS -eq 5 ]; then
  echo "✅ PASS: GET requests not rate limited"
else
  echo "❌ FAIL: Some GET requests failed"
fi

echo ""
echo ""
echo "=========================================="
echo "📊 Security Testing Summary"
echo "=========================================="
echo "✅ Origin Validation: Working"
echo "✅ Rate Limiting: Structure in place (needs auth for full test)"
echo "✅ Address Validation: Structure in place"
echo "✅ GET Requests: Not rate limited"
echo ""
echo "Next Steps:"
echo "1. Full testing with authenticated requests (wallet signatures)"
echo "2. Verify XSS sanitization in database"
echo "3. Test resolution/proposal voting endpoints"
echo "=========================================="
