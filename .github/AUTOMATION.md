# 🤖 NFT Metadata Automation System

Automated metadata regeneration system for KEKTECH NFT collection.

## 📋 Overview

**Purpose:** Keep static metadata file synchronized with newly minted NFTs without manual intervention.

**Schedule:** Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)

**Technology:** GitHub Actions + Vercel Auto-Deploy

---

## 🔄 How It Works

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (Every 6 hours)                             │
├─────────────────────────────────────────────────────────────┤
│  1. Checkout repository                                     │
│  2. Validate current metadata file                          │
│  3. Run generation script (fetch from blockchain API)       │
│  4. Comprehensive validation (7 safety checks)              │
│  5. Commit changes (only if valid)                          │
│  6. Push to GitHub                                          │
│  7. Trigger Vercel deployment automatically                 │
└─────────────────────────────────────────────────────────────┘
```

### Safety Mechanisms

The workflow includes **7 bulletproof validation checks**:

1. **File Existence:** Ensures metadata file exists after generation
2. **JSON Validity:** Validates file is parseable JSON
3. **Required Fields:** Checks for `generated`, `totalSupply`, `nfts`, `traitStats`
4. **Data Integrity:** Ensures `totalSupply` matches `nfts.length`
5. **Blockchain Consistency:** NFT count never decreases (blockchain is append-only)
6. **File Size Sanity:** Validates file is 1-10 MB (prevents corruption)
7. **NFT Structure:** Validates all NFTs have required fields (tokenId, name, rank, etc.)

### Error Handling

- **Timeout Protection:** 15-minute timeout prevents infinite hangs
- **Retry Logic:** 3 attempts to push changes before failing
- **Automatic Rollback:** Reverts uncommitted changes on failure
- **Concurrency Control:** Only one workflow runs at a time
- **Detailed Logging:** Every step is logged for debugging

---

## 📊 Monitoring

### View Workflow Status

1. Go to GitHub repository
2. Click **"Actions"** tab
3. Select **"Update NFT Metadata"** workflow
4. View run history and logs

### Check Latest Run

```bash
# Via GitHub CLI
gh run list --workflow=update-metadata.yml --limit 1

# Via web
https://github.com/YOUR_USERNAME/kektech-nextjs/actions
```

### Workflow Summary

Each run generates a summary showing:
- ✅ Success/Failure status
- 📊 Before/After statistics
- 🆕 Number of new mints
- 💾 File size changes

---

## 🎯 Manual Execution

### Trigger Immediate Update

**Option 1: GitHub UI**
1. Go to Actions tab
2. Select "Update NFT Metadata"
3. Click "Run workflow"
4. (Optional) Enable "Force update even if no changes"
5. Click "Run workflow"

**Option 2: GitHub CLI**
```bash
# Standard run
gh workflow run update-metadata.yml

# Force update
gh workflow run update-metadata.yml -f force_update=true
```

**Option 3: Local Script**
```bash
# Run locally for testing
cd ~/Desktop/kektech-nextjs
node scripts/generate-metadata.js

# Commit manually
git add public/data/minted-metadata.json
git commit -m "chore: manual metadata update"
git push
```

---

## ⚙️ Configuration

### Change Schedule

Edit `.github/workflows/update-metadata.yml`:

```yaml
schedule:
  # Current: Every 6 hours
  - cron: '0 */6 * * *'

  # Every 4 hours
  - cron: '0 */4 * * *'

  # Every 12 hours
  - cron: '0 */12 * * *'

  # Daily at midnight UTC
  - cron: '0 0 * * *'
```

### Disable Automation

**Temporary:** Disable workflow in GitHub Actions UI

**Permanent:** Delete or rename workflow file

---

## 🔍 Troubleshooting

### Workflow Failing?

**Check logs:**
1. Go to Actions tab
2. Click failed run
3. Expand failed step
4. Review error message

**Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Metadata generation timed out" | Backend API slow/down | Wait and retry manually |
| "NFT count decreased" | Blockchain data inconsistency | Check backend API health |
| "File too small" | Generation script failed | Review script logs |
| "Push failed" | Git conflicts | Manually pull and resolve |
| "Invalid JSON" | Script error | Check generation script |

### Manual Recovery

If automation fails multiple times:

```bash
# 1. Generate locally
node scripts/generate-metadata.js

# 2. Validate output
jq empty public/data/minted-metadata.json

# 3. Check file size
ls -lh public/data/minted-metadata.json

# 4. Commit and push
git add public/data/minted-metadata.json
git commit -m "fix: manual metadata recovery"
git push
```

---

## 📈 Performance Metrics

### Expected Behavior

- **Generation Time:** 60-90 seconds
- **File Size:** ~2-3 MB (grows with new mints)
- **NFT Count:** Increases only (never decreases)
- **Attribute Coverage:** >95% of NFTs have traits

### Performance Tracking

```bash
# View generation history
git log --all --grep="metadata" --oneline

# Check file size over time
git log --all -- public/data/minted-metadata.json --pretty=format:"%h %ad %s" --date=short

# Count new mints from commits
git log --all --grep="metadata" --pretty=format:"%s" | grep -oP '\+\K\d+'
```

---

## 🛡️ Security

### Workflow Permissions

- **Read:** Repository contents
- **Write:** Commit metadata updates only
- **Secrets:** Uses GitHub's built-in `GITHUB_TOKEN` (automatically rotated)

### No Sensitive Data

- No API keys in workflow
- No private keys exposed
- Public blockchain data only
- All operations are transparent

---

## 📝 Maintenance

### Regular Checks (Monthly)

- [ ] Review workflow runs for failures
- [ ] Verify file size growth is reasonable
- [ ] Check attribute coverage percentage
- [ ] Confirm Vercel deployments succeed

### Updates

**When to update workflow:**
- API endpoint changes
- New validation requirements
- Performance optimizations
- Schedule adjustments

**How to update:**
1. Edit `.github/workflows/update-metadata.yml`
2. Test locally if possible
3. Commit and push
4. Monitor next scheduled run

---

## 🎉 Benefits

✅ **Automatic Updates:** No manual intervention needed
✅ **Reliability:** 7 validation checks ensure data integrity
✅ **Transparency:** Full logs and history in GitHub Actions
✅ **Efficiency:** Only commits when changes detected
✅ **Safety:** Automatic rollback on failures
✅ **Performance:** Static file serves 99%+ of requests instantly
✅ **Fallback:** API handles edge cases (newest mints)

---

## 📞 Support

**Issues with automation?**
- Check GitHub Actions logs
- Review this documentation
- Test manual generation locally
- Create GitHub issue if persistent

**Need to change schedule?**
- Edit cron expression in workflow file
- Commit and push changes
- Next run uses new schedule
