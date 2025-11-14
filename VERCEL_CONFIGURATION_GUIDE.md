# 🔧 VERCEL CONFIGURATION GUIDE - Production Fix

**Purpose**: Configure Vercel to fix critical production deployment errors  
**Time Required**: 10 minutes  
**Impact**: Fixes ALL API routes (500 errors) + WebSocket connection issues

---

## 🎯 WHAT WE'RE FIXING

1. ✅ **CSP Policy** - Already fixed in code (pushed to GitHub)
2. ⏳ **Prisma Client Generation** - Needs Vercel dashboard config
3. ⏳ **WebSocket URL** - Needs environment variable added

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Update Build Command** (5 minutes)

This fixes ALL API route 500 errors by ensuring Prisma Client is generated during build.

**Path**: Vercel Dashboard → Your Project → Settings → Build & Development Settings

**Instructions**:
1. Go to: https://vercel.com/dashboard
2. Find project: `frontend` (or `kektech-frontend`)
3. Click: `Settings` (tab at top)
4. Scroll to: `Build & Development Settings`
5. Find field: `Build Command`
6. **Current value**: `npm run build` (default)
7. **Change to**: `npx prisma generate && npm run build`
8. Click: `Save`

**Screenshot Verification**:
```
Build Command: [npx prisma generate && npm run build]  [Save]
                ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                THIS IS THE NEW VALUE YOU ENTER
```

**Why This Fixes API Errors**:
- Prisma Client wasn't being generated during build
- API routes import `@prisma/client` → crashed with 500 errors
- Now: Generate client → THEN build → API routes work! ✅

---

### **STEP 2: Add WebSocket URL Environment Variable** (5 minutes)

This fixes WebSocket connection to correct server.

**Path**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Instructions**:
1. Still in Settings, scroll to: `Environment Variables`
2. Click: `Add New` (button at top right)
3. Fill in form:

   **Name**: `NEXT_PUBLIC_WS_URL`
   
   **Value**: `wss://ws.kektech.xyz/ws`
   
   **Select Environments**:
   - ✅ Production
   - ✅ Preview  
   - ❌ Development (leave unchecked)

4. Click: `Save`

**Screenshot Verification**:
```
Environment Variables
┌─────────────────────────────────────────────────────────┐
│ Name: NEXT_PUBLIC_WS_URL                                │
│ Value: wss://ws.kektech.xyz/ws                          │
│ Environments: ☑ Production  ☑ Preview  ☐ Development   │
└─────────────────────────────────────────────────────────┘
                      [Save]
```

**Why This Fixes WebSocket**:
- Frontend was trying: `wss://ws-temp-zmart.kektech.xyz` (wrong!)
- Now explicitly set to: `wss://ws.kektech.xyz/ws` (correct!)
- WebSocket connection will work! ✅

---

### **STEP 3: Trigger Deployment** (Automatic after saves)

**After saving both changes above, Vercel will automatically trigger a new deployment.**

**Monitor Deployment**:
1. Go to: `Deployments` tab (top of project)
2. You should see: "Building..." with latest commit
3. Wait 3-5 minutes for build to complete
4. Build status will show: "Ready" ✅

**Verify Build Logs** (Optional but recommended):
1. Click on the latest deployment
2. Click: `Building` → View logs
3. Look for: `✓ Generated Prisma Client` (should appear early in build)
4. If you see this → Build command worked! ✅

---

## 🧪 TESTING AFTER DEPLOYMENT

Once deployment shows "Ready", test these:

### Test 1: API Routes
```bash
# Test comments endpoint
curl https://frontend-[your-id]-kektech1.vercel.app/api/comments/top?timeframe=day&limit=1

# ✅ Expected: {"success":true,"data":{...}}
# ❌ Not: {"success":false,"error":"..."} (500)
```

### Test 2: WebSocket Connection
1. Open production URL in browser
2. Open DevTools → Console
3. Look for: No CSP violation errors
4. Open DevTools → Network tab → WS filter
5. Should see: Connection to `wss://ws.kektech.xyz/ws`
6. Status: `101 Switching Protocols` (success!)

### Test 3: Full Flow
1. Navigate to a market page
2. Connect wallet
3. Try to post a comment
4. Should work without 401/500 errors! ✅

---

## ✅ SUCCESS CRITERIA

After completing all steps, you should have:

- ✅ Build command updated: `npx prisma generate && npm run build`
- ✅ Environment variable added: `NEXT_PUBLIC_WS_URL=wss://ws.kektech.xyz/ws`
- ✅ New deployment triggered and completed
- ✅ Build logs show "Generated Prisma Client"
- ✅ API routes return 200/201 (not 500)
- ✅ WebSocket connects successfully
- ✅ No CSP violations in console
- ✅ Comments load on market pages

---

## 🚨 TROUBLESHOOTING

### Issue: Build still failing
**Check**:
- Did you save the build command change?
- Is it exactly: `npx prisma generate && npm run build`?
- No typos?

**Fix**: Re-save build command, trigger manual deploy

---

### Issue: Environment variable not working
**Check**:
- Did you check "Production" and "Preview"?
- Is value exactly: `wss://ws.kektech.xyz/ws` (no spaces!)?
- Did deployment finish after saving?

**Fix**: Edit env var, ensure correct value, redeploy

---

### Issue: API routes still 500
**Check build logs**:
1. Deployments → Latest → View logs
2. Search for: "prisma generate"
3. Should see: "✓ Generated Prisma Client"
4. If missing → Build command didn't save

**Fix**: Verify build command in settings, manually redeploy

---

### Issue: WebSocket still connects to wrong URL
**Check**:
1. Hard refresh browser: Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)
2. Clear browser cache
3. Check deployment finished after env var save

**Fix**: Redeploy manually, hard refresh browser

---

## 📞 NEED HELP?

**If issues persist after following this guide**:

1. **Check Deployment Status**:
   - Vercel Dashboard → Deployments
   - Ensure latest deployment shows "Ready"
   - Click on deployment → View logs

2. **Verify Configuration**:
   - Settings → Build Command: `npx prisma generate && npm run build`
   - Settings → Environment Variables: `NEXT_PUBLIC_WS_URL` exists

3. **Test Locally**:
   ```bash
   # Pull latest code
   git pull origin main
   
   # Verify CSP change
   grep "ws-temp-zmart" next.config.ts
   # Should see: wss://ws-temp-zmart.kektech.xyz in line 94
   
   # Test build locally
   npm run build
   # Should work without errors
   ```

4. **Share Information**:
   - Deployment URL
   - Build logs (copy/paste)
   - Browser console errors (screenshot)
   - Exact error messages

---

## 🎉 COMPLETION CHECKLIST

Once everything works, check off:

- [ ] Build command updated in Vercel
- [ ] Environment variable added
- [ ] Deployment completed successfully
- [ ] Build logs show Prisma generation
- [ ] API routes return proper responses
- [ ] WebSocket connects to correct server
- [ ] No CSP violations
- [ ] Comments load on pages
- [ ] Full authentication flow works

**When all checked: PRODUCTION IS FIXED! 🚀**

---

**Last Updated**: 2025-11-12  
**Author**: Claude Code  
**Status**: Ready for implementation

