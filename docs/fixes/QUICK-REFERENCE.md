# Quick Reference Card - Wallet Connection Fix

**Date**: October 13, 2025
**Severity**: 🔴 Critical
**Status**: ✅ Fixed
**Commit**: `cf9ee44`

---

## 🎯 Problem (TL;DR)

Dashboard crashed with: `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`

**Root Cause**: Unsafe property access without null checks

---

## ✅ Solution (Copy-Paste Safe Patterns)

### Pattern 1: Safe NFT Filtering
```typescript
// ❌ BEFORE (Crashes)
const filtered = nfts.filter(
  (nft) => nft.token.address_hash.toLowerCase() === target
)

// ✅ AFTER (Safe)
const filtered = nfts.filter((nft) => {
  const address = nft?.token?.address_hash
  if (!address) return false
  return address.toLowerCase() === target.toLowerCase()
})
```

### Pattern 2: Safe Property Check
```typescript
// ❌ BEFORE (Crashes)
if (connector.name.toLowerCase().includes('metamask')) { }

// ✅ AFTER (Safe)
if (connector.name && connector.name.toLowerCase().includes('metamask')) { }
```

### Pattern 3: Safe Comparison Utility
```typescript
// Create this utility function
function safeCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false
  return a.toLowerCase() === b.toLowerCase()
}

// Use it everywhere
if (safeCompare(nft?.token?.address_hash, targetAddress)) {
  // Safe!
}
```

---

## 🚀 Files Changed

| File | Line | Change Type |
|------|------|-------------|
| `components/wallet/NFTDashboard.tsx` | 24-34 | Null safety |
| `components/web3/ConnectButton.tsx` | 78 | Null safety |

---

## 🧪 Test Cases

```typescript
// Test with these edge cases:
const testCases = [
  { token: { address_hash: '0xABC' } },     // ✅ Valid
  { token: { address_hash: null } },         // ✅ Handled
  { token: null },                           // ✅ Handled
  {},                                        // ✅ Handled
  null,                                      // ✅ Handled
]

testCases.forEach(nft => {
  const address = nft?.token?.address_hash
  if (address) {
    console.log(address.toLowerCase()) // ✅ No crash
  }
})
```

---

## 📋 Pre-Commit Checklist

- [ ] Used optional chaining (`?.`)
- [ ] Validated before `.toLowerCase()`
- [ ] Ran `npm run build`
- [ ] Tested with empty data
- [ ] Checked console for errors

---

## 🔗 Full Documentation

- 📄 [Complete Incident Report](./2025-10-13-wallet-connection-crash-fix.md)
- 🔧 [Detailed Code Changes](./code-changes-detail.md)
- 🛡️ [Best Practices Guide](./prevention-best-practices.md)

---

## ⚡ Emergency Fix Template

When you see `TypeError: Cannot read properties of undefined`:

1. **Find the line** - Check the error stack trace
2. **Add optional chaining** - Use `?.` for nested access
3. **Validate before operations** - Check for null/undefined
4. **Test edge cases** - Empty, null, undefined data
5. **Build and deploy** - `npm run build && git push`

---

## 💡 Remember

> "Never trust external data. Always validate at the boundary."

**One-liner rule**: If it comes from outside your code (API, blockchain, user), check it's not null/undefined before using it!

---

**Need Help?** Check the full documentation in `/docs/`
