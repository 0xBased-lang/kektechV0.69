# 🎯 VERCEL DASHBOARD CONFIGURATION - Final Step

**Status**: Code fixes ✅ PUSHED | Dashboard update ⏳ YOUR ACTION NEEDED  
**Time**: 2 minutes  
**Impact**: Will fix build failure + WebSocket issues

---

## What Was Fixed in Code (Already Done ✅)

**Commit fa2081a - Just pushed to GitHub**:

1. ✅ `vercel.json`: Restored `"installCommand": "cd ../.. && npm install"`
2. ✅ `next.config.ts`: Removed `wss://ws-temp-zmart.kektech.xyz` from CSP

---

## What YOU Need To Do (2 minutes)

### Step 1: Update Vercel Dashboard Install Command

**WHY**: Vercel dashboard settings can override vercel.json  
**CRITICAL**: Must match the new vercel.json configuration

**Go to**: https://vercel.com/kektech1/kektech-frontend/settings

**Navigate to**: "Build & Development Settings" section

**Find**: "Install Command" field

**Current setting**: `cd ../ && npm install` (WRONG - goes to packages/)

**Change to**: `cd ../.. && npm install` (CORRECT - goes to monorepo root)

**Visual guide**:
```
Install Command:  [cd ../.. && npm install]  Override: [ON]
                   ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                   Two dots! (../..)
```

**Steps**:
1. Click the "Edit" button (or toggle Override to ON)
2. Clear current value
3. Type exactly: `cd ../.. && npm install`
4. Click "Save"

---

### Step 2: Redeploy

**After saving the install command**:

1. Go to: https://vercel.com/kektech1/kektech-frontend
2. Click on: "Deployments" tab
3. Find: Latest deployment (commit fa2081a)
4. Click: "..." menu → "Redeploy"
5. Confirm: Click "Redeploy" in modal
6. Wait: 3-5 minutes for build to complete

---

## How to Verify Success

### Check Build Logs

**During deployment, monitor build logs**:

**Should see** ✅:
```
Running "install" command: `cd ../.. && npm install`...
npm info using npm@10.x.x
npm info using node@v20.x.x
added 1875 packages in 15s
Creating an optimized production build...
✓ Compiled successfully
```

**Should NOT see** ❌:
```
Module not found: Can't resolve 'siwe'
Build failed because of webpack errors
```

---

### Test Production Site

**After deployment shows "Ready"**:

1. **Open**: https://kektech-frontend.vercel.app
2. **Check console** (F12): No errors
3. **Network tab → WS filter**: Should connect to `wss://ws.kektech.xyz/ws`
4. **Test SIWE**: Connect wallet → Sign message → Should work!
5. **No CSP violations**: Console should be clean

---

## What Each Fix Does

### Fix #1: Install Command (vercel.json + Dashboard)

**Before**: `npm install` (broken)
```
Working dir: /vercel/packages/frontend
Run: npm install
Result: Installs only frontend dependencies
Problem: NPM workspace hoists 'siwe' to ROOT, not found here!
```

**After**: `cd ../.. && npm install` (working)
```
Working dir: /vercel/packages/frontend
Run: cd ../..  (goes to /vercel - monorepo root)
Run: npm install (installs ALL workspace dependencies)
Result: 'siwe' installed at root, available to frontend!
```

---

### Fix #2: WebSocket CSP (next.config.ts)

**Before**:
```typescript
"connect-src ... wss://ws.kektech.xyz wss://ws-temp-zmart.kektech.xyz ..."
                 ↑ Correct              ↑ Wrong (removed!)
```

**After**:
```typescript
"connect-src ... wss://ws.kektech.xyz ..."
                 ↑ Only correct URL
```

**Impact**:
- ✅ Removes security vulnerability (external domain)
- ✅ App uses correct WebSocket URL from env vars
- ✅ No more CSP violations

---

## Troubleshooting

### If Build Still Fails

**Check dashboard install command again**:
- Must be exactly: `cd ../.. && npm install`
- Must have Override toggle: ON
- Must click Save after changing

**Try clearing build cache**:
1. Go to: Settings → General
2. Find: "Clear Build Cache"  
3. Click: "Clear Cache"
4. Redeploy

---

### If WebSocket Still Wrong

**Check environment variable**:
1. Go to: Settings → Environment Variables
2. Find: `NEXT_PUBLIC_WS_URL`
3. Value should be: `wss://ws.kektech.xyz/ws`
4. If different, update and redeploy

---

## Success Checklist

After dashboard update + redeploy:

- [ ] Build logs show: `cd ../.. && npm install`
- [ ] Build logs show: `added 1875 packages`
- [ ] Build logs show: `✓ Compiled successfully`
- [ ] NO "Module not found: siwe" error
- [ ] Production site loads without errors
- [ ] WebSocket connects to correct server
- [ ] SIWE authentication works
- [ ] No CSP violations in console

**When all checked**: ✅ PRODUCTION FULLY FIXED!

---

## Why This Matters

**Before**: 
- ❌ Builds failing (siwe not found)
- ❌ Security issue (external domain in CSP)
- ❌ Wrong WebSocket server
- ❌ Users can't authenticate

**After**:
- ✅ Builds succeed (workspace resolution working)
- ✅ Security improved (CSP clean)
- ✅ Correct WebSocket server
- ✅ Users can authenticate with SIWE

---

**DO THIS NOW**: Update the Vercel dashboard Install Command, then redeploy! 🚀

---

**Questions?** Check if:
1. Install command has TWO dots: `cd ../..`  (not one: `cd ../`)
2. Override toggle is ON
3. You clicked Save
4. You redeployed after saving

