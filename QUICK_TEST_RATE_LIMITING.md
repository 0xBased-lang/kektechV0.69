# ⚡ QUICK TEST: Rate Limiting

**Status**: Redis credentials added ✅
**Server**: Running on http://localhost:3000 ✅
**Time**: ~5 minutes

---

## 🧪 CRITICAL TEST: Rate Limiting

This test proves the security hardening is working!

### Setup (30 seconds)

1. **Hard refresh browser**: 
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + F5`

2. **Navigate to**: http://localhost:3000/market/0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84

3. **Open console**: 
   - Mac: `Cmd + Option + J`
   - Windows: `F12`

---

### Test Procedure (5 minutes)

**Goal**: Trigger rate limit by signing in 6 times quickly

**Steps**:

1. **Attempt 1**: 
   - Click "Sign In with Wallet"
   - Sign message in MetaMask
   - Wait for success
   - Click "Sign Out"

2. **Attempt 2**: Same as attempt 1
3. **Attempt 3**: Same as attempt 1
4. **Attempt 4**: Same as attempt 1
5. **Attempt 5**: Same as attempt 1

6. **Attempt 6** (SHOULD FAIL):
   - Click "Sign In with Wallet"
   - Sign message in MetaMask
   - **EXPECTED**: Error message appears!

---

### Expected Results

**Attempts 1-5**: ✅ Should succeed

**Attempt 6**: ❌ Should FAIL with error:

**Console Output**:
```
[AUTH] Rate limit exceeded {
  walletAddress: "0x...",
  ip: "...",
  remaining: 0
}
```

**User-Facing Error**:
```
Too many authentication attempts. 
Please try again in 15 minutes.
```

**Status Code**: `429 Too Many Requests`

---

### Success Criteria

✅ **PASS**: 6th attempt blocked with 429 error
❌ **FAIL**: All 6 attempts succeed

---

### If Test FAILS (All 6 attempts work)

**Troubleshooting**:

1. **Check Redis connection**:
   - Open browser console
   - Look for Redis connection errors
   - Verify env vars are set: `echo $UPSTASH_REDIS_REST_URL`

2. **Check Upstash dashboard**:
   - Go to: https://console.upstash.com
   - Check "Commands" graph
   - Should show activity when signing in

3. **Check server logs**:
   ```bash
   tail -f /tmp/next-dev-redis-enabled.log
   ```
   - Look for rate limit logs
   - Should see: `[AUTH] Rate limit check passed`

4. **Verify code**:
   - Check `app/api/auth/verify/route.ts`
   - Rate limiting code should be present (lines 102-119)
   - Not commented out

---

### If Test PASSES ✅

**Congratulations!** Rate limiting works!

**Next Steps**:

1. Wait 15 minutes (or clear Redis)
2. Test other security features (see FINAL_TESTING_GUIDE.md)
3. Run all 18 security tests
4. Deploy to production!

---

### Quick Redis Reset (Optional)

If you want to test again immediately without waiting 15 minutes:

**Option 1: Clear Rate Limit in Upstash**:
1. Go to: https://console.upstash.com
2. Click on your database
3. Go to "Data Browser"
4. Find key starting with: `auth:0x...` (your wallet address)
5. Delete the key
6. Try signing in again

**Option 2: Use Different Wallet**:
1. Switch to different wallet in MetaMask
2. Sign in with new wallet
3. Rate limit is per wallet address

---

### Additional Checks

**While testing, also verify**:

1. ✅ **issuedAt field present** in SIWE message
   - Check MetaMask popup
   - Should show "Issued At: 2025-11-12T..."

2. ✅ **Structured logging** in server console
   ```
   [AUTH] Rate limit check passed
   [AUTH] Authentication successful
   ```

3. ✅ **No errors** in browser console
   - No "max line number" errors
   - No "eth_requestAccounts" errors

---

## 📊 What This Proves

**If rate limiting works, it means**:

✅ Upstash Redis configured correctly
✅ Environment variables loaded properly
✅ Rate limiting code working
✅ All security hardening is functional
✅ Production-ready authentication!

**This is THE KEY TEST** that proves everything works! 🎯

---

**Server Running**: http://localhost:3000
**Redis Dashboard**: https://console.upstash.com
**Full Testing Guide**: FINAL_TESTING_GUIDE.md

**Good luck! 🧪**

Report back: "Rate limiting test [PASSED/FAILED]"
