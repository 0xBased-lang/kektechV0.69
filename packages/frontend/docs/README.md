# KEKTECH NFT Collection - Documentation

**Project**: KEKTECH NFT Collection on BasedAI Network
**Tech Stack**: Next.js 15, React, Wagmi, TypeScript, TailwindCSS
**Blockchain**: BasedAI Network (Chain ID: 32323)

---

## 📚 Documentation Structure

```
docs/
├── README.md                       # This file - Documentation index
└── fixes/                          # Bug fixes and incident reports
    ├── 2025-10-13-wallet-connection-crash-fix.md
    ├── code-changes-detail.md
    └── prevention-best-practices.md
```

---

## 🚨 Recent Fixes

### October 13, 2025 - Wallet Connection Dashboard Crash

**Status**: ✅ Fixed
**Severity**: Critical
**Commit**: `cf9ee44`

**Quick Summary**:
Dashboard was crashing with `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` due to unsafe property access in NFT filtering logic.

**Files Changed**:
- `components/wallet/NFTDashboard.tsx` - Added null safety to NFT filtering
- `components/web3/ConnectButton.tsx` - Added null safety to connector name check

**Documentation**:
- 📄 [Full Incident Report](./fixes/2025-10-13-wallet-connection-crash-fix.md)
- 🔧 [Code Changes Detail](./fixes/code-changes-detail.md)
- 🛡️ [Prevention Best Practices](./fixes/prevention-best-practices.md)

---

## 🏗️ Project Architecture

### Core Components

#### Web3 Integration
- **Wagmi Configuration**: `config/wagmi.ts`
  - Multi-wallet support (MetaMask, WalletConnect, Coinbase)
  - BasedAI network configuration
  - Safe provider initialization

- **Provider Fix**: `config/web3-provider-fix.ts`
  - Handles multiple wallet extension conflicts
  - Safe `window.ethereum` initialization
  - Provider fallback logic

- **Connect Button**: `components/web3/ConnectButton.tsx`
  - User-friendly wallet connection UI
  - Auto-detection of available wallets
  - Error handling and user feedback

#### Dashboard & Portfolio
- **Main Dashboard**: `app/dashboard/page.tsx`
  - Comprehensive portfolio view
  - TECH tokens, NFTs, and vouchers
  - Force dynamic rendering for Web3 hooks

- **Comprehensive Dashboard**: `components/dashboard/ComprehensiveDashboard.tsx`
  - Multi-asset portfolio display
  - Real-time balance updates
  - Interactive charts and statistics

- **NFT Dashboard**: `components/wallet/NFTDashboard.tsx`
  - NFT collection display
  - KEKTECH vs other NFTs separation
  - Gallery view with metadata

#### Data Hooks
- **Portfolio Data**: `lib/hooks/usePortfolioData.ts`
  - Aggregates all portfolio data
  - TECH balance, NFTs, vouchers
  - Safe filtering and validation ✅

- **Tech Balance**: `lib/hooks/useTechBalance.ts`
  - ERC-20 token balance queries
  - Real-time balance updates

- **Voucher Balance**: `lib/hooks/useVoucherBalance.ts`
  - ERC-1155 voucher tracking
  - Multi-token support

- **Wallet NFTs**: `lib/hooks/useWalletNFTs.ts`
  - NFT collection fetching
  - BlockScout API integration
  - Error handling and retry logic

---

## 🔧 Configuration Files

### Next.js Configuration (`next.config.mjs`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'explorer.bf1337.org' },
      // ... other domains
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
```

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "strictNullChecks": true,
    // ... other options
  }
}
```

### Environment Variables

Required in `.env.local`:
```bash
# Wallet Configuration
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id

# Network Configuration
NEXT_PUBLIC_BASED_RPC_URL=https://rpc.bf1337.org
NEXT_PUBLIC_BASED_CHAIN_ID=32323

# App URLs
NEXT_PUBLIC_APP_URL=https://kektech-nextjs.vercel.app
```

---

## 🧪 Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Testing Before Deployment
1. ✅ Run `npm run build` successfully
2. ✅ Check for TypeScript errors
3. ✅ Test wallet connection flow
4. ✅ Verify NFT display
5. ✅ Check console for errors
6. ✅ Test on different wallets

### Deployment Process
```bash
# Commit changes
git add .
git commit -m "Your message"

# Push to trigger Vercel deployment
git push origin main

# Verify deployment
vercel ls
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Wallet Not Connecting

**Symptoms**: Connect button doesn't work, no wallet popup

**Solutions**:
1. Check browser has wallet extension installed
2. Verify `NEXT_PUBLIC_REOWN_PROJECT_ID` is set
3. Check console for provider initialization errors
4. Try different wallet (MetaMask recommended)

**Reference**: [Provider Fix Documentation](./fixes/2025-10-13-wallet-connection-crash-fix.md#wallet-provider-conflicts)

### Issue 2: NFTs Not Displaying

**Symptoms**: Dashboard shows "No NFTs Found" when you have NFTs

**Solutions**:
1. Verify wallet is connected to BasedAI network (Chain ID: 32323)
2. Check BlockScout API is accessible
3. Review network tab for API errors
4. Check console for filtering errors

**Reference**: [Code Changes Detail](./fixes/code-changes-detail.md#change-1-nftdashboardtsx)

### Issue 3: Build Errors

**Symptoms**: `npm run build` fails with TypeScript errors

**Solutions**:
1. Run `npm install` to update dependencies
2. Check for missing type definitions
3. Verify all imports are correct
4. Review TypeScript strict mode errors

**Reference**: [Prevention Best Practices](./fixes/prevention-best-practices.md#use-typescript-strictly)

---

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` to git
- Use Vercel environment variables for production
- Rotate API keys regularly

### 2. Smart Contract Interaction
- Always validate contract addresses
- Use type-safe contract interfaces
- Handle transaction errors gracefully

### 3. User Data
- Never log private keys or seeds
- Sanitize user inputs
- Validate blockchain addresses

### 4. API Security
- Rate limit API calls
- Validate response data
- Handle API errors gracefully

---

## 📊 Performance Optimization

### Image Optimization
- Use Next.js `Image` component
- Configure `remotePatterns` in next.config
- Implement lazy loading for NFT galleries

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (automatic)
- Lazy load wallet connectors

### Caching Strategy
- React Query for API calls (60s stale time)
- Wagmi automatic caching
- Browser localStorage for preferences

---

## 🔗 External Dependencies

### Core Libraries
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **Wagmi**: Web3 React hooks
- **Viem**: TypeScript Ethereum library
- **TanStack Query**: Data fetching and caching

### Wallet Integrations
- **@wagmi/connectors**: Multi-wallet support
- **WalletConnect**: QR code wallet connection
- **Coinbase Wallet SDK**: Coinbase integration

### UI Components
- **TailwindCSS**: Utility-first CSS
- **Lucide React**: Icon library
- **Recharts**: Charts and graphs

---

## 📈 Monitoring & Analytics

### Build Monitoring
- Vercel deployment logs
- Build time tracking
- Bundle size analysis

### Error Tracking
- Console error monitoring
- User feedback collection
- Crash report analysis

### Performance Metrics
- Core Web Vitals
- API response times
- Wallet connection success rate

---

## 🚀 Future Improvements

### Short Term
- [ ] Add comprehensive error boundaries
- [ ] Implement retry logic for failed API calls
- [ ] Add loading skeletons for better UX
- [ ] Create utility functions for common patterns

### Medium Term
- [ ] Add unit tests for critical components
- [ ] Implement E2E tests with Playwright
- [ ] Add performance monitoring
- [ ] Create component storybook

### Long Term
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Advanced portfolio analytics
- [ ] Social features integration

---

## 📞 Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh/)
- [Viem Docs](https://viem.sh/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

### Community
- GitHub Issues: Report bugs and request features
- Discord: Community support (if available)
- Email: Technical support contact

### Development Team
- **AI Assistant**: Claude Code
- **Repository**: github.com/0xBased-lang/kektech-nextjs
- **Deployment**: Vercel

---

## 📝 Changelog

### October 13, 2025
- ✅ Fixed critical wallet connection crash
- ✅ Added null safety to NFT filtering
- ✅ Improved connector detection logic
- ✅ Created comprehensive documentation

### Previous Updates
- Initial project setup
- BasedAI network integration
- Multi-asset dashboard implementation
- Wallet connection system

---

## 🎯 Quick Links

- [Main Dashboard](../app/dashboard/page.tsx)
- [Wallet Connection](../components/web3/ConnectButton.tsx)
- [NFT Display](../components/wallet/NFTDashboard.tsx)
- [Portfolio Hook](../lib/hooks/usePortfolioData.ts)

---

**Last Updated**: October 13, 2025
**Documentation Version**: 1.0
**Project Version**: Based on commit `cf9ee44`
