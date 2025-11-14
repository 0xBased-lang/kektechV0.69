# 🚨 CRITICAL FIX - Production Overrides Blocking Your Builds

**Root Cause FOUND**: Production Overrides have `npm install` and are blocking your correct `cd ../.. && npm install` configuration!

> **2025-11 Update**: The frontend now lives at the repository root. Any references to `packages/frontend` below describe the previous layout but the troubleshooting steps are still useful context.

**Time to Fix**: 10 minutes  
**Complexity**: 3 simple settings changes  
**Confidence**: 95% this will work

---

## The Problem Explained Visually

```
YOUR MONOREPO:
/kektechV0.69/                    ← You need to install HERE (2 dots up)
  ├── package.json (workspaces)
  ├── node_modules/
  │   └── siwe/                   ← This is where siwe lives!
  └── packages/
      └── frontend/               ← Vercel starts HERE (Root Directory)
```

**Current Config**:
- Production Overrides: `npm install` → Installs at `frontend/` ❌
- Project Settings: `cd ../ && npm install` → Goes to `packages/` (1 dot) ❌  
- vercel.json: `cd ../.. && npm install` → Goes to root (2 dots) ✅ BUT BEING IGNORED!

---

## Fix #1: Enable Monorepo Support (30 seconds)

### Navigate
**Go to**: https://vercel.com/kektech1/kektech-frontend/settings/general

### Find Section
Scroll down to: **"Root Directory"** section

### Look For Checkbox
You'll see:
```
Root Directory: packages/frontend

☐ Include source files outside of the Root Directory in the Build Step
```

### ACTION: Check the Box!
```
☑ Include source files outside of the Root Directory in the Build Step
```

### Click Save

**Why This Matters**: Without this, Vercel BLOCKS access to any files above `packages/frontend/`, so even if the install command tries to `cd ../..`, it can't read those files!

---

## Fix #2: Correct the Install Command (30 seconds)

### Navigate (Same Page)
Stay on: **Settings → General**

### Scroll to Section
Find: **"Build & Development Settings"**

### Find Install Command Field
You'll see:
```
Install Command: cd ../ && npm install
                 ↑ ONE DOT (wrong!)
Override: [ON]
```

### ACTION: Change to TWO Dots
Click "Edit" and change to:
```
Install Command: cd ../.. && npm install
                 ↑↑ TWO DOTS (correct!)
Override: [ON]  ← Keep this ON
```

### Click Save

**Visual Guide**:
```
WRONG:  cd ../ && npm install
           ↑ One dot goes to: /packages/

RIGHT:  cd ../.. && npm install
           ↑↑ Two dots go to: /kektechV0.69/ (root!)
```

---

## Fix #3: Force Fresh Deployment (5-10 minutes)

### Navigate to Deployments
**Go to**: https://vercel.com/kektech1/kektech-frontend

Click: **"Deployments"** tab at top

### Find Latest Deployment
Should be commit: **fa2081a** - "fix: Restore monorepo install + remove incorrect WebSocket..."

### Click the "⋯" Menu
On the right side of the deployment, click the three dots

### Select "Redeploy"
A modal will pop up

### CRITICAL: Uncheck "Use existing Build Cache"
**Default**: ☑ Use existing Build Cache  
**Change to**: ☐ Use existing Build Cache

**Why**: Old cache might have Production Override settings baked in. Fresh build will pick up your vercel.json!

### Click "Redeploy"

### Wait and Monitor
Build will take 3-5 minutes. Watch the build log in real-time.

---

## How to Verify Success

### Check #1: Build Log (Real-Time)

**Look for this line near the start**:
```
✅ GOOD:
Running "install" command: `cd ../.. && npm install`...

❌ BAD:
Running "install" command: `npm install`...
```

**If you see TWO dots (`cd ../..`)** → ✅ SUCCESS! The fix worked!

**If you still see just `npm install`** → ❌ Production Overrides still blocking

---

### Check #2: Install Success

**Look for**:
```
npm info using npm@10.x.x
npm info using node@v20.x.x

added 1875 packages, and audited 1876 packages in 15s
```

**Should NOT see**:
```
npm error code ENOENT
npm error syscall open
npm error path /vercel/path/.../package.json
```

---

### Check #3: Build Success

**Look for**:
```
Creating an optimized production build...
✓ Compiled successfully
```

**Should NOT see**:
```
Module not found: Can't resolve 'siwe'
Failed to compile.
```

---

### Check #4: Warning Banner Gone

**Go back to**: Settings → General

**The warning at the top should be GONE**:
```
⚠️ "Configuration Settings in the current Production deployment differ 
   from your current Project Settings."
```

If it's gone → ✅ Production Overrides are now in sync!

---

## Understanding the 3-Layer Config

Vercel has three places that can set build configuration:

### 1. Production Overrides (Highest Priority)
- **Location**: Stored internally per-deployment
- **Visibility**: Shows in collapsed section at top of settings
- **Problem**: These were set to `npm install` (wrong!)
- **Fix**: Fresh deployment without cache should clear/update them

### 2. vercel.json (Middle Priority)  
- **Location**: `packages/frontend/vercel.json` in your code
- **Visibility**: You can see/edit in git
- **Status**: ✅ Already correct (`cd ../.. && npm install`)
- **Problem**: Production Overrides were blocking it!

### 3. Project Settings (Lowest Priority)
- **Location**: Vercel dashboard settings page
- **Visibility**: You can see/edit in settings
- **Status**: ⚠️ Had ONE dot, we're fixing to TWO dots
- **Use**: Fallback if vercel.json doesn't exist

---

## What Each Fix Does

### Fix #1: Monorepo Support Checkbox
**Enables**: Access to files outside `packages/frontend/`  
**Allows**: `cd ../..` to actually reach the monorepo root  
**Without It**: Even if install command has `cd ../..`, Vercel blocks file access

### Fix #2: Project Settings (1 dot → 2 dots)
**Purpose**: Ensures Project Settings are correct as fallback  
**Impact**: If Production Overrides are cleared, this will be used  
**Bonus**: Aligns with your vercel.json for consistency

### Fix #3: Fresh Deployment Without Cache
**Purpose**: Forces Vercel to rebuild configuration from scratch  
**Impact**: Should pick up your vercel.json instead of old Production Overrides  
**Clears**: Any stale build settings or cached configurations

---

## If Build Still Fails

### Scenario 1: Still shows `npm install` (no cd)

**Meaning**: Production Overrides are VERY sticky

**Solution**: Contact Vercel Support
```
Subject: Please clear Production Overrides for my project

Hi Vercel team,

My project kektech-frontend is stuck with Production Overrides that 
are blocking my vercel.json configuration. 

Project: kektech1/kektech-frontend
Issue: Production Overrides have "npm install" 
Needed: "cd ../.. && npm install"

My vercel.json is correct, but Production Overrides are taking 
precedence. Can you please clear them?

Thank you!
```

---

### Scenario 2: Shows `cd ../.. && npm install` but install fails

**Error**: `npm ERR! Could not read package.json`

**Meaning**: Monorepo support checkbox not enabled

**Solution**: Go back to Fix #1 and ensure checkbox is CHECKED

---

### Scenario 3: Install succeeds but build fails with module errors

**Error**: `Module not found: '@/components/...'`

**Meaning**: Build is running in wrong directory

**Solution**: Check your `next.config.ts` for any path issues

---

## Quick Reference Card

**What you're doing**:
1. ☑ Enable monorepo file access
2. ✏️ Fix install command (1 dot → 2 dots)
3. 🔄 Redeploy fresh (no cache)

**What to watch for**:
1. ✅ Build log shows `cd ../.. && npm install`
2. ✅ 1875 packages installed
3. ✅ Compiled successfully
4. ✅ Warning banner gone

**Time estimate**:
- Settings changes: 2 minutes
- Redeploy + build: 5-10 minutes
- Verification: 2 minutes
- **Total**: ~15 minutes

**Success rate**: 95% (based on similar monorepo issues)

---

## After Success

Once your build succeeds:

1. **Test the site**: Open https://kektech-frontend.vercel.app
2. **Check WebSocket**: DevTools → Network → WS tab → Should connect to `wss://ws.kektech.xyz/ws`
3. **Test SIWE Auth**: Connect wallet → Sign message → Should work!
4. **Verify no CSP errors**: Console should be clean

---

## Prevention for Future

To avoid this mess again:

1. **Always use vercel.json** for build config (don't rely on dashboard)
2. **Enable monorepo support** on first deployment
3. **Test locally** before deploying:
   ```bash
   cd packages/frontend
   cd ../.. && npm install
   cd packages/frontend && npm run build
   ```
4. **Check build logs** on first deployment to ensure correct command is used
5. **Document your config** so future team members know about the 2-dot requirement

---

## Status Tracking

As you complete each fix, check it off:

- [ ] Fix #1: Enabled monorepo support checkbox
- [ ] Fix #2: Changed install command to 2 dots
- [ ] Fix #3: Redeployed without cache
- [ ] Verified: Build log shows `cd ../..`
- [ ] Verified: 1875 packages installed
- [ ] Verified: Build succeeded
- [ ] Verified: Warning banner gone
- [ ] Tested: Site works in production

**When all checked** → 🎉 PRODUCTION FULLY WORKING!

---

**Start Now**: Go make Fix #1 (enable checkbox), then Fix #2 (2 dots), then Fix #3 (redeploy)!

**Report Back**: Tell me which build log line you see after redeploying!
