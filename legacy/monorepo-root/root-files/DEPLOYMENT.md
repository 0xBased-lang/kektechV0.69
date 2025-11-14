# KEKTECH Deployment Guide

## ✅ Correct Deployment Configuration

**Project**: kektech-frontend
**Project ID**: `prj_xYbdi0E0eJ1amYm3DAPknR1gWUxR`
**Organization ID**: `team_zqPDYGyB2bI1MwE8G5zfVOGB`
**Vercel URL**: TBD after first deployment

---

## 🚀 Local Deployment (Recommended)

### Production Deployment

```bash
cd packages/frontend
npm run deploy
```

This command:
1. ✅ Runs pre-deployment verification
2. ✅ Checks for nested directory issues
3. ✅ Validates project ID configuration
4. ✅ Deploys to production

### Preview Deployment

```bash
cd packages/frontend
npm run deploy:preview
```

---

## 🤖 GitHub Actions Deployment

### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **"Deploy Frontend to Vercel"**
3. Click **"Run workflow"**
4. Select environment:
   - `production` - Deploy to production
   - `preview` - Deploy preview build
5. Click **"Run workflow"**
6. ✅ Workflow will verify configuration before deploying

### GitHub Secrets Required

Ensure these secrets are set in GitHub repository settings:

| Secret | Value | Purpose |
|--------|-------|---------|
| `VERCEL_PROJECT_ID` | `prj_xYbdi0E0eJ1amYm3DAPknR1gWUxR` | Target project |
| `VERCEL_ORG_ID` | `team_zqPDYGyB2bI1MwE8G5zfVOGB` | Organization |
| `VERCEL_TOKEN` | [Your Vercel token] | Authentication |

**To verify secrets**: https://github.com/0xBased-lang/kektechV0.69/settings/secrets/actions

---

## 🔧 Manual Deployment (Advanced)

If you need to deploy manually without scripts:

```bash
# 1. Verify configuration first
./scripts/verify-deployment-config.sh

# 2. Deploy from root directory
vercel deploy --prod --cwd packages/frontend

# OR deploy from frontend directory
cd packages/frontend
vercel deploy --prod
```

---

## ⚠️ Troubleshooting

### Issue: Deployment goes to wrong project

**Symptoms**:
- Deployment goes to "frontend" instead of "kektech-frontend"
- Wrong domain (e.g., tinfoil-terminal.xyz)
- Wrong GitHub repo connection

**Solution**:

```bash
# 1. Run verification
./scripts/verify-deployment-config.sh

# 2. Check for nested directories
find . -type d -name "packages" | grep -v "node_modules" | grep -v "^./packages$"

# 3. If nested directory found, delete it
rm -rf packages/frontend/packages/

# 4. Verify .vercel configs are correct
cat .vercel/project.json
cat packages/frontend/.vercel/project.json

# Both should show: "projectId":"prj_xYbdi0E0eJ1amYm3DAPknR1gWUxR"
```

### Issue: GitHub Actions failing

**Check GitHub Secrets**:
1. Go to: https://github.com/0xBased-lang/kektechV0.69/settings/secrets/actions
2. Verify `VERCEL_PROJECT_ID` = `prj_xYbdi0E0eJ1amYm3DAPknR1gWUxR`
3. Verify `VERCEL_ORG_ID` = `team_zqPDYGyB2bI1MwE8G5zfVOGB`
4. Verify `VERCEL_TOKEN` is valid

**Check Workflow Logs**:
- Pre-deployment verification should show all ✅
- If verification fails, it will prevent deployment

### Issue: Nested directory created

**Prevention**: Never run `vercel link` or `vercel deploy` from inside subdirectories.

**If it happens**:
```bash
rm -rf packages/frontend/packages/
./scripts/verify-deployment-config.sh
```

---

## 🛡️ Safety Measures

### Automated Verification

Every deployment runs through these checks:

1. ✅ No nested `packages/frontend/packages/` directory
2. ✅ Root `.vercel/project.json` has correct project ID
3. ✅ Frontend `.vercel/project.json` has correct project ID
4. ✅ Project name is "kektech-frontend"

### Pre-deployment Hooks

The `npm run deploy` command automatically:
- Runs verification script
- Shows deployment target
- Prevents deployment if verification fails

### GitHub Actions Safety

The workflow includes:
- Configuration verification step
- Safety check before deployment
- Fails deployment if wrong project ID detected

---

## 📝 Deployment Checklist

Before deploying:

- [ ] Run `./scripts/verify-deployment-config.sh` - Should show all ✅
- [ ] Verify no nested directories exist
- [ ] Check GitHub secrets are correct (if using Actions)
- [ ] Ensure all tests pass locally
- [ ] Database migrations applied (if any)
- [ ] Environment variables configured in Vercel

After deploying:

- [ ] Verify deployment URL is correct
- [ ] Check Vercel dashboard shows "kektech-frontend" project
- [ ] Test deployed site functionality
- [ ] Monitor for any errors in Vercel logs

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/kektech1
- **GitHub Repository**: https://github.com/0xBased-lang/kektechV0.69
- **GitHub Secrets**: https://github.com/0xBased-lang/kektechV0.69/settings/secrets/actions
- **Verification Script**: `./scripts/verify-deployment-config.sh`
- **Pre-deploy Script**: `./scripts/pre-deploy.sh`

---

## 🚫 What NOT to Do

❌ **Never deploy from nested directories**:
```bash
# WRONG - This creates wrong .vercel config
cd packages/frontend/packages/frontend
vercel deploy
```

❌ **Never skip verification**:
```bash
# WRONG - Could deploy to wrong project
vercel deploy --prod
```

✅ **Always use the deploy scripts**:
```bash
# CORRECT - Includes verification
cd packages/frontend
npm run deploy
```

---

## 📊 Deployment History

| Date | Environment | Result | Notes |
|------|-------------|--------|-------|
| TBD | Production | Pending | First deployment after fix |

---

**Last Updated**: 2025-11-14
**Maintained By**: KEKTECH Team
**Status**: ✅ Configuration verified and safe
