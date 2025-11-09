# Deployment Testing Guide

## Overview

Step-by-step testing procedures for deploying KEKTECH to production.

**Target**: Vercel Production Deployment
**Current URL**: https://kektech-frontend-[hash].vercel.app

---

## Pre-Deployment Testing

### 1. Local Testing
```bash
cd packages/frontend

# Build production bundle
npm run build

# Test production build locally
npm run start

# Verify build successful
# Verify no console errors
# Verify pages load correctly
```

### 2. Contract Tests
```bash
cd packages/blockchain

# Run full test suite
npm test

# Expected: 320/347 passing
# Action if failing: Fix failures before deploying
```

### 3. E2E Tests
```bash
cd packages/frontend

# Run all E2E tests
npm run test:e2e

# Expected: 50/52 passing
# Action if failing: Review failures, fix critical issues
```

---

## Deployment Process

### Option 1: Deploy via Git (Recommended)
```bash
# 1. Ensure all changes committed
git status
# Should show: nothing to commit, working tree clean

# 2. Push to main branch
git push origin main

# 3. Vercel auto-deploys
# Check Vercel dashboard for deployment status
```

### Option 2: Deploy via CLI
```bash
cd packages/frontend

# Deploy to production
vercel --prod

# Follow prompts
# Get deployment URL
```

---

## Post-Deployment Validation

### 1. Smoke Tests (Critical)
```bash
# Set production URL
export PLAYWRIGHT_BASE_URL=https://kektech-frontend-[hash].vercel.app

# Run smoke tests
npm run test:e2e:smoke

# Expected: All critical tests pass
```

### 2. Manual Verification

#### Homepage Validation
- [ ] Homepage loads (<3 seconds)
- [ ] Markets display correctly
- [ ] No console errors (F12 → Console)
- [ ] No 404 errors for assets
- [ ] Images load correctly
- [ ] Links work

#### Wallet Connection
- [ ] "Connect Wallet" button visible
- [ ] MetaMask connection works
- [ ] Wallet address displayed
- [ ] Network detection correct (BasedAI)
- [ ] Disconnect works

#### Market Interaction
- [ ] Can browse markets
- [ ] Market details load
- [ ] Betting interface displays
- [ ] Price calculations work
- [ ] Can place test bet (small amount)
- [ ] Transaction confirms
- [ ] Position updates

#### Mobile Testing
- [ ] Responsive layout (test at 375px width)
- [ ] Navigation menu works
- [ ] Touch targets ≥44px
- [ ] Forms work on mobile
- [ ] No horizontal scrolling

#### Performance
- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Largest Contentful Paint <2.5s
- [ ] Cumulative Layout Shift <0.1
- [ ] Time to Interactive <3.5s

### 3. Security Checks
- [ ] HTTPS enabled
- [ ] No mixed content warnings
- [ ] CSP headers present
- [ ] XSS protections active
- [ ] CORS configured correctly

### 4. Contract Integration
- [ ] Contract addresses correct
- [ ] ABIs up to date
- [ ] RPC endpoint working
- [ ] Events being received
- [ ] Transactions confirming

---

## Rollback Procedure

If critical issues found after deployment:

### 1. Immediate Rollback (Vercel Dashboard)
1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"
4. Verify rollback successful
5. Communicate to users (if needed)

### 2. Fix Issues
1. Create fix branch
2. Implement fixes
3. Test locally
4. Deploy to preview URL
5. Test preview deployment
6. Merge to main when validated

### 3. Redeploy
1. Follow deployment process above
2. Extra validation on redeployment
3. Document what was fixed

---

## Deployment Checklist

### Before Deployment
- [ ] All critical tests passing
- [ ] Build successful locally
- [ ] No console errors in build
- [ ] Contract addresses verified
- [ ] Environment variables set in Vercel
- [ ] Team notified of deployment

### During Deployment
- [ ] Deployment initiated
- [ ] Build logs checked
- [ ] No build errors
- [ ] Deployment URL obtained
- [ ] DNS propagation verified (if custom domain)

### After Deployment
- [ ] Smoke tests passing
- [ ] Manual validation complete
- [ ] Performance acceptable
- [ ] No critical issues
- [ ] Team notified of completion
- [ ] Deployment logged in DEPLOYMENT_LOG.md

---

## Deployment Log Template

```markdown
## Deployment - November 8, 2025 [TIME]

### Details
- **URL**: https://kektech-frontend-[hash].vercel.app
- **Commit**: [git rev-parse HEAD]
- **Deployed By**: [Your Name]
- **Deploy Method**: [Git Push | CLI]

### Test Results
- **Contract Tests**: 320/347 passing
- **E2E Tests**: 50/52 passing
- **Smoke Tests**: ✅ All passing

### Performance
- **Load Time**: <3s
- **Lighthouse Score**: 92/100
- **Mobile Responsive**: ✅

### Issues
- None / [List any issues]

### Status
- ✅ Deployment successful
- ✅ Validation complete
- ✅ Production live
```

---

## Environment Variables

Ensure these are set in Vercel dashboard:

```bash
# Required
NEXT_PUBLIC_CHAIN_ID=32323
NEXT_PUBLIC_RPC_URL=https://rpc.basedai.com
NEXT_PUBLIC_EXPLORER_URL=https://explorer.basedai.com

# Contract Addresses (automatically from lib/contracts/addresses.ts)
# No need to set manually

# Optional
NEXT_PUBLIC_ANALYTICS_ID=[if using analytics]
```

---

## Troubleshooting

### Build Fails
**Issue**: `npm run build` fails
**Solutions**:
1. Check for TypeScript errors
2. Verify all dependencies installed
3. Check for circular dependencies
4. Review build logs for specific error

### Deployment Succeeds but Site Broken
**Issue**: Site deployed but doesn't work
**Solutions**:
1. Check browser console for errors
2. Verify contract addresses correct
3. Check RPC endpoint accessible
4. Verify environment variables set

### Tests Pass Locally but Fail in Production
**Issue**: Differences between environments
**Solutions**:
1. Check environment variable differences
2. Verify contract addresses match network
3. Check RPC endpoint different between envs
4. Test against production RPC locally

---

**Last Updated**: November 8, 2025
**Maintained By**: KEKTECH DevOps Team
