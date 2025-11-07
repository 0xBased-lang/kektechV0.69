# 🔒 Security Setup Guide - KekTech Next.js Application

## Environment Variables Setup

### Current Status ✅
- `.gitignore` properly configured to exclude all `.env*` files
- No sensitive data found in Git history
- Vercel project linked: `kektech1/kektech-nextjs`

---

## 1. Vercel Environment Variables Configuration

### Required Variables for Production

Run these commands to set up your environment variables securely:

```bash
# Navigate to project directory
cd /Users/seman/Desktop/kektech-nextjs

# Set Production Environment Variables
vercel env add NEXT_PUBLIC_REOWN_PROJECT_ID production
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS production
vercel env add NEXT_PUBLIC_CHAIN_ID production
vercel env add NEXT_PUBLIC_RPC_URL production
vercel env add NEXT_PUBLIC_EXPLORER_URL production
vercel env add NEXT_PUBLIC_METADATA_API production
vercel env add NEXT_PUBLIC_RANKING_API production

# Set Preview Environment Variables (optional, for staging)
vercel env add NEXT_PUBLIC_REOWN_PROJECT_ID preview
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS preview
vercel env add NEXT_PUBLIC_CHAIN_ID preview
vercel env add NEXT_PUBLIC_RPC_URL preview
vercel env add NEXT_PUBLIC_EXPLORER_URL preview
vercel env add NEXT_PUBLIC_METADATA_API preview
vercel env add NEXT_PUBLIC_RANKING_API preview

# Development Environment (keep in .env.local for local development)
# These are already in your .env.local - keep them there, they're safe
```

### Current Environment Variables (.env.local)

```bash
# ✅ These are SAFE in .env.local (not committed to Git)
NEXT_PUBLIC_REOWN_PROJECT_ID=dc5e6470d109f31f1d271b149fed3d98
NEXT_PUBLIC_CONTRACT_ADDRESS=0x40B6184b901334C0A88f528c1A0a1de7a77490f1
NEXT_PUBLIC_CHAIN_ID=32323
NEXT_PUBLIC_RPC_URL=https://mainnet.basedaibridge.com/rpc/
NEXT_PUBLIC_EXPLORER_URL=https://explorer.bf1337.org
NEXT_PUBLIC_METADATA_API=https://kektech.xyz/api/metadata
NEXT_PUBLIC_RANKING_API=https://api.kektech.xyz
```

**Note:** All your current variables are `NEXT_PUBLIC_*` which means they're exposed to the browser. This is correct for frontend applications. No sensitive backend keys detected.

---

## 2. Security Best Practices

### ✅ What You're Doing Right

1. **No Private Keys in Frontend Code** - All wallet operations use WalletConnect/wagmi
2. **Proper Git Configuration** - `.env*` files properly ignored
3. **Clean Git History** - No sensitive data committed
4. **Public Variables** - All frontend variables correctly prefixed with `NEXT_PUBLIC_`

### ⚠️ Important Security Rules

#### Rule 1: Never Commit Private Keys
```bash
# ❌ NEVER do this:
ADMIN_PRIVATE_KEY=0x123...
WALLET_PRIVATE_KEY=0x456...
SECRET_KEY=abc123...

# ✅ If you need backend secrets, use Vercel Environment Variables:
vercel env add ADMIN_PRIVATE_KEY production
# Then access in API routes (server-side only):
# const privateKey = process.env.ADMIN_PRIVATE_KEY;
```

#### Rule 2: Use Different Values for Different Environments
```bash
# Production
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS production
# Enter: 0x_PRODUCTION_ADDRESS_

# Preview/Staging
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS preview
# Enter: 0x_TESTNET_ADDRESS_

# Development (.env.local)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_LOCAL_DEV_ADDRESS_
```

#### Rule 3: Protect API Keys with Server-Side Proxying
If you add external API keys (Alchemy, Infura, etc.), never expose them in `NEXT_PUBLIC_*`:

```typescript
// ❌ BAD - Exposed to client
NEXT_PUBLIC_ALCHEMY_KEY=abc123...

// ✅ GOOD - Server-side only
ALCHEMY_API_KEY=abc123...

// Then create an API route:
// app/api/rpc/route.ts
export async function POST(request: Request) {
  const response = await fetch(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    { /* ... */ }
  );
  return Response.json(response);
}
```

---

## 3. Vercel Deployment Checklist

### Before Deploying:

- [ ] All environment variables set in Vercel dashboard or CLI
- [ ] `.env.local` exists locally for development (not committed)
- [ ] `.gitignore` includes `.env*`
- [ ] No hardcoded secrets in code
- [ ] API routes created for any sensitive backend operations

### Verify Environment Variables:

```bash
# List all environment variables in Vercel
vercel env ls

# Pull environment variables to local .env (for reference only)
vercel env pull

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 4. Wallet Security Verification

### ✅ Your Current Implementation is Secure

**Why your wallet integration is safe:**

1. **User Custody**: Users maintain control of their private keys in their own wallets (MetaMask, WalletConnect, etc.)
2. **No Server-Side Keys**: Your application never stores or handles user private keys
3. **Transaction Signing**: All transactions require user approval and signature
4. **Standard Libraries**: Using battle-tested libraries (wagmi, viem, @reown/appkit)

**Wallet Connection Flow:**
```
User → Opens Wallet (MetaMask/etc)
     → Signs Connection Request
     → Approves Transaction
     → Private Keys NEVER leave user's wallet
```

---

## 5. Additional Security Recommendations

### Immediate (Optional but Recommended):

1. **Enable Vercel Analytics** for monitoring
```bash
npm install @vercel/analytics
```

2. **Add Security Headers** (see next section)

3. **Set up Dependabot** for automated security updates:
```bash
# Create .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Medium-Term:

1. **Implement Rate Limiting** for API routes
2. **Add Input Validation** for all user inputs
3. **Set up Error Monitoring** (Sentry, LogRocket)
4. **Regular Security Audits** (monthly npm audit)

---

## 6. Emergency Response Plan

### If Private Key is Exposed:

1. **Immediately Rotate the Key**
   ```bash
   # Generate new wallet
   # Transfer ownership of contracts to new wallet
   # Revoke permissions from old wallet
   ```

2. **Remove from Git History**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Update All Services**
   - Vercel environment variables
   - Contract ownership
   - Admin wallets

### If API Key is Exposed:

1. **Regenerate API key** in provider dashboard (Alchemy, Infura, etc.)
2. **Update Vercel environment variables**
3. **Redeploy application**
4. **Monitor for unusual activity**

---

## 7. Monitoring Checklist

### Weekly:
- [ ] Check Vercel deployment logs for errors
- [ ] Review transaction history for unusual activity
- [ ] Monitor npm audit for new vulnerabilities

### Monthly:
- [ ] Run full security audit (`npm audit`)
- [ ] Review and update dependencies
- [ ] Check Vercel analytics for suspicious patterns
- [ ] Verify all environment variables are correct

### Quarterly:
- [ ] Full codebase security review
- [ ] Smart contract audit (if updated)
- [ ] Penetration testing
- [ ] Disaster recovery drill

---

## 8. Support & Resources

### Vercel Documentation:
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Security Best Practices](https://vercel.com/docs/security)

### Web3 Security:
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/security)
- [WalletConnect Security](https://docs.walletconnect.com/web3wallet/security)
- [Ethereum Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

---

## Current Status Summary

✅ **SECURE**: Your application currently has no critical vulnerabilities related to environment variables or wallet security.

**What's Already Protected:**
- No private keys in code or Git history
- Proper `.gitignore` configuration
- Clean environment variable separation
- Secure wallet integration (user custody model)

**Next Steps:**
1. Set up Vercel environment variables for production
2. Run npm audit fix (next task)
3. Add security headers (covered in separate guide)
4. Implement rate limiting (future enhancement)

---

**Generated:** January 2025
**Last Updated:** January 2025
**Version:** 1.0.0
