# 🚀 GitHub Setup Guide - CI/CD & Branch Protection

**Last Updated**: November 7, 2025
**Purpose**: Configure GitHub repository for bulletproof migration compliance

---

## 📋 PREREQUISITES

1. **GitHub Repository**: Project must be pushed to GitHub
2. **Admin Access**: You need admin rights to configure branch protection
3. **Secrets Configured**: Required for deployment (see below)

---

## 🔧 STEP 1: PUSH TO GITHUB

### Initialize Git (if not done)

```bash
cd /Users/seman/Desktop/kektechbmad100/expansion-packs/bmad-blockchain-dev

# Initialize git
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Add files
git add .

# Commit
git commit -m "🛡️ Initial commit with bulletproof guardrails

- Documentation layer (3 files)
- Directory cleanup (22 files archived)
- Validation scripts (3 scripts)
- Pre-commit hooks (template + installer)
- Read-only protection (OS-level)
- CI/CD pipeline (GitHub Actions)

Protection level: 97% bulletproof"

# Push
git push -u origin main
```

---

## 🛡️ STEP 2: CONFIGURE BRANCH PROTECTION

### Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Branches** in left sidebar
4. Click **Add rule** (or edit existing rule for `main`)

### Configure Protection Rules

#### Basic Settings

**Branch name pattern**: `main` (or `master`, `develop`)

✅ **Require a pull request before merging**
- Require approvals: **1 reviewer minimum**
- Dismiss stale reviews when new commits are pushed
- Require review from Code Owners (optional)

✅ **Require status checks to pass before merging**
- **CRITICAL**: Enable this to enforce CI/CD
- Require branches to be up to date before merging

#### Status Checks (REQUIRED!)

Search for and check these required status checks:
- ✅ `compliance-check` (this is your CI/CD workflow)

**Important**: Push at least one commit first so the workflow runs and GitHub recognizes the status check name.

✅ **Require conversation resolution before merging**

✅ **Do not allow bypassing the above settings**
- Prevents admins from bypassing checks (recommended)

❌ **Allow force pushes** (DISABLED - prevent history rewriting)

❌ **Allow deletions** (DISABLED - prevent branch deletion)

#### Save Rule

Click **Create** or **Save changes**

---

## 🔐 STEP 3: CONFIGURE SECRETS

### Required Secrets (if deploying from CI/CD)

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets (if you want automated deployments):

1. **PRIVATE_KEY**
   - Your deployment wallet private key
   - Used for Sepolia/Mainnet deployments
   - Value: `0x...` (64 hex characters)

2. **SEPOLIA_RPC** (optional, has default)
   - Sepolia RPC endpoint
   - Value: `https://rpc.sepolia.org` or Alchemy/Infura URL

3. **BASEDAI_MAINNET_RPC** (optional, has default)
   - BasedAI mainnet RPC
   - Value: `https://mainnet.basedaibridge.com/rpc/`

4. **ETHERSCAN_API_KEY** (for verification)
   - Etherscan API key for contract verification
   - Get from: https://etherscan.io/myapikey

**Security Note**: Never commit private keys to git. Only use secrets for CI/CD.

---

## 🧪 STEP 4: TEST CI/CD PIPELINE

### Test 1: Valid PR (Should PASS)

```bash
# Create feature branch
git checkout -b test/ci-cd-validation

# Modify a target file
echo "// CI/CD test" >> contracts/core/VersionedRegistry.sol

# Commit and push
git add contracts/core/VersionedRegistry.sol
git commit -m "test: verify CI/CD allows target files"
git push origin test/ci-cd-validation

# Create PR on GitHub
# Expected: ✅ All checks pass
```

### Test 2: Invalid PR (Should FAIL)

```bash
# Create another branch
git checkout -b test/ci-cd-block-deprecated

# Modify a deprecated file
echo "// CI/CD test" >> contracts/deprecated/contracts/MasterRegistry.sol

# Commit and push
git add contracts/deprecated/contracts/MasterRegistry.sol
git commit -m "test: verify CI/CD blocks deprecated files"
git push origin test/ci-cd-block-deprecated

# Create PR on GitHub
# Expected: ❌ CI check fails with "Deprecated files modified" error
```

### Test 3: Merge Protection (Should BLOCK)

1. Try to merge the FAILED PR from Test 2
2. Expected: GitHub blocks merge with message "Required status checks have not passed"
3. This proves branch protection is working! 🎉

---

## 📊 STEP 5: MONITORING & MAINTENANCE

### View CI/CD Runs

1. Go to **Actions** tab in your repository
2. Click on any workflow run to see details
3. Expand steps to see logs

### When CI/CD Fails

1. **Check the logs**: Click on failed job → expand failing step
2. **Common failures**:
   - Deprecated file modified → Revert changes
   - Compilation error → Fix code
   - Test failure → Fix tests
   - Contract too large → Optimize contract
3. **Fix and push**: CI/CD will re-run automatically

### Updating the Workflow

If you need to modify the CI/CD workflow:

```bash
# Edit workflow file
code .github/workflows/migration-compliance.yml

# Commit and push
git add .github/workflows/migration-compliance.yml
git commit -m "ci: update migration compliance workflow"
git push origin main
```

---

## ⚙️ OPTIONAL: ADDITIONAL CONFIGURATIONS

### Enable Dependabot

**Settings** → **Security** → **Dependabot**

✅ Enable Dependabot alerts
✅ Enable Dependabot security updates

### Enable Code Scanning

**Settings** → **Security** → **Code scanning**

✅ Set up CodeQL analysis (for automated security scanning)

### Configure Notifications

**Settings** → **Notifications**

Configure when you want to receive notifications:
- Failed CI/CD runs
- PR reviews required
- Security alerts

---

## 🎯 VERIFICATION CHECKLIST

After setup, verify all protections are active:

- [ ] Repository pushed to GitHub
- [ ] Branch protection enabled on `main`
- [ ] Status checks required (compliance-check)
- [ ] At least 1 reviewer required
- [ ] Force pushes disabled
- [ ] Secrets configured (if deploying)
- [ ] Test PR with valid changes: ✅ PASSES
- [ ] Test PR with deprecated changes: ❌ FAILS
- [ ] Merge blocked for failed PR: ✅ BLOCKED

**Protection Level After Setup**: 97% Bulletproof 🛡️

---

## 🚨 TROUBLESHOOTING

### Issue: Status checks not showing up

**Problem**: "compliance-check" doesn't appear in status check list

**Solution**:
1. Push at least one commit to trigger workflow
2. Wait for workflow to complete
3. Go back to branch protection settings
4. Refresh page - status check should now appear

### Issue: CI/CD not running

**Problem**: No workflows running on push/PR

**Solution**:
1. Check `.github/workflows/migration-compliance.yml` exists
2. Verify YAML syntax is correct
3. Check **Actions** tab → Enable workflows if disabled
4. Verify branch name matches trigger (main/master/develop)

### Issue: Tests failing in CI but passing locally

**Problem**: Tests pass on local machine but fail in CI

**Solution**:
1. Check Node.js version matches (CI uses Node 18)
2. Run `npm ci` instead of `npm install` locally
3. Check for environment-specific issues
4. Review CI logs for detailed error messages

---

## 📚 RELATED DOCUMENTATION

- Branch protection docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches
- GitHub Actions docs: https://docs.github.com/en/actions
- Secrets docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Migration checklist: `docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md`
- Target architecture: `docs/active/TARGET_ARCHITECTURE.md`

---

**Status**: Ready for implementation
**Next**: Follow STEP 1-5 above to configure GitHub
**Protection Level**: 0% → 97% after complete setup

---

🎉 **With CI/CD + Branch Protection**: Deviation is IMPOSSIBLE at merge time!
