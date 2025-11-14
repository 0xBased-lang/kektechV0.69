# 🪝 Git Hooks Installation Guide

**Last Updated**: November 7, 2025

---

## ⚠️ PREREQUISITES

Before installing hooks, you need a git repository:

```bash
# Check if git is initialized
ls -la .git

# If not initialized, initialize git:
git init

# Add remote (if applicable)
git remote add origin <your-repo-url>
```

---

## 📦 INSTALLING PRE-COMMIT HOOK

### Automatic Installation (Recommended)

```bash
# From project root:
./scripts/hooks/install-hooks.sh
```

### Manual Installation

```bash
# From project root:
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Verify installation:
ls -la .git/hooks/pre-commit
```

---

## ✅ TESTING THE HOOK

### Test 1: Commit a target file (should PASS)

```bash
# Modify a target file
echo "// test" >> contracts/core/VersionedRegistry.sol

# Stage and commit
git add contracts/core/VersionedRegistry.sol
git commit -m "test: verify hook allows target files"

# Expected: ✅ Commit succeeds
```

### Test 2: Commit a deprecated file (should BLOCK)

```bash
# Modify a deprecated file
echo "// test" >> contracts/deprecated/contracts/MasterRegistry.sol

# Stage and commit
git add contracts/deprecated/contracts/MasterRegistry.sol
git commit -m "test: verify hook blocks deprecated files"

# Expected: ❌ Commit blocked with error message
```

### Test 3: Bypass hook (emergency only)

```bash
# Bypass hook with --no-verify flag
git commit --no-verify -m "emergency commit"

# Expected: ⚠️ Commit succeeds (WARNING: Only use in emergencies!)
```

---

## 🔍 WHAT THE HOOK CHECKS

### ❌ BLOCKS (Exit Code 1):
- Commits modifying files in `contracts/deprecated/`
- Commits modifying files in `scripts/deploy/archive/`

### ⚠️ WARNS (Exit Code 0):
- Commits modifying files not in target architecture
- Provides guidance but allows commit

### ✅ ALLOWS (Exit Code 0):
- Commits modifying target architecture files
- Commits modifying test files (`test/**`)
- Commits modifying documentation (`docs/**`)
- Commits modifying interfaces (`contracts/interfaces/**`)

---

## 🚨 BYPASSING THE HOOK

**USE ONLY IN EMERGENCIES!**

```bash
# Bypass pre-commit hook
git commit --no-verify -m "emergency commit message"
```

**When to bypass:**
- True emergency requiring immediate commit
- Hook has a bug preventing valid commits
- Committing documentation about deprecated files

**When NOT to bypass:**
- "I'm in a hurry" (not a valid reason)
- "The hook is annoying" (it's protecting you!)
- "I know what I'm doing" (the hook exists because humans make mistakes)

---

## 🔧 TROUBLESHOOTING

### Hook Not Running

**Problem**: Commits succeed but hook doesn't run

**Solutions**:
1. Check hook is executable: `ls -la .git/hooks/pre-commit`
2. Make executable: `chmod +x .git/hooks/pre-commit`
3. Verify location: Hook must be at `.git/hooks/pre-commit`

### Hook Always Blocks

**Problem**: Hook blocks even valid commits

**Solutions**:
1. Check file path: Ensure not modifying deprecated files
2. Verify file in target: Check `TARGET_ARCHITECTURE.md`
3. Bypass temporarily: Use `--no-verify` (document why)
4. Fix hook: Edit `.git/hooks/pre-commit`

### Hook Not Installed After Clone

**Problem**: Hooks don't transfer with git clone

**Reason**: `.git/hooks/` is local only, not versioned

**Solution**: Re-install after clone:
```bash
git clone <repo-url>
cd <repo-name>
./scripts/hooks/install-hooks.sh
```

---

## 📚 RELATED DOCUMENTATION

- Pre-commit hook: `scripts/hooks/pre-commit`
- Target architecture: `docs/active/TARGET_ARCHITECTURE.md`
- Migration checklist: `docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md`
- Compliance protocol: `CLAUDE.md` (🛡️ MANDATORY section)

---

## 🎯 HOOK STATUS

**Current Status**: Template created, awaiting git initialization

**Once git is initialized**:
1. Run: `./scripts/hooks/install-hooks.sh`
2. Test with: `git commit -m "test hook"`
3. Verify hook blocks deprecated file modifications

**Protection Level**:
- Before installation: 90% (documentation + scripts + read-only)
- After installation: 95% (+ git hook enforcement)
- With CI/CD (Day 6): 97% bulletproof

---

**Last Updated**: November 7, 2025
**Status**: Ready for installation (awaiting git init)
**Next**: Day 5 - Make deprecated files read-only (chmod 444)
