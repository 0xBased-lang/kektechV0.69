# KEKTECH NFT Collection

A modern NFT minting platform built on the $BASED Chain (32323) using Next.js 15, Wagmi, and Reown (WalletConnect).

## 🚀 Features

- ✅ **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS
- ✅ **Web3 Integration**: Wagmi + Reown for wallet connectivity
- ✅ **Multi-Wallet Support**: WalletConnect, MetaMask, Coinbase Wallet
- ✅ **Type-Safe**: Full TypeScript with strict mode
- ✅ **Responsive Design**: Mobile-first, accessible UI
- ✅ **$BASED Chain**: Chain ID 32323

## 📋 Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- A Web3 wallet (MetaMask recommended)
- Some $BASED tokens for gas fees

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/0xBased-lang/kektech-nextjs.git
   cd kektech-nextjs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   The `.env.local` file should contain:
   ```env
   # Reown/WalletConnect Configuration
   NEXT_PUBLIC_REOWN_PROJECT_ID=ee738e17f6b483db152c5e439167f805

   # Smart Contract Configuration
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x40B6184b901334C0A88f528c1A0a1de7a77490f1
   NEXT_PUBLIC_CHAIN_ID=32323

   # Blockchain Configuration
   NEXT_PUBLIC_RPC_URL=https://mainnet.basedaibridge.com/rpc/
   NEXT_PUBLIC_EXPLORER_URL=https://explorer.bf1337.org

   # API Endpoints
   NEXT_PUBLIC_API_URL=http://157.173.117.77:5000
   NEXT_PUBLIC_METADATA_API_URL=http://157.173.117.77:5000/api/nft
   NEXT_PUBLIC_RANKING_API_URL=http://157.173.117.77:5000/api/leaderboard
   NEXT_PUBLIC_IMAGE_API_URL=http://157.173.117.77:5000/api/nft/image
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
kektech-nextjs/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Homepage
│   ├── providers.tsx        # Web3 providers
│   ├── mint/                # Mint page (Phase 2)
│   └── gallery/             # Gallery page (Phase 2)
├── components/              # React components
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── web3/               # Web3 components
│   │   └── ConnectButton.tsx
│   ├── nft/                # NFT components (Phase 2)
│   └── ui/                 # UI components (Phase 2)
├── config/                  # Configuration files
│   ├── chains.ts           # Chain configuration (Chain ID 32323)
│   ├── constants.ts        # Contract constants
│   ├── wagmi.ts            # Wagmi configuration
│   └── contracts/          # Contract ABIs and configs
│       ├── kektech-main.ts
│       └── index.ts
├── lib/                     # Utility functions
│   ├── hooks/              # Custom React hooks (Phase 2)
│   ├── utils/              # Utility functions
│   │   └── cn.ts           # Tailwind class merger
│   └── api/                # API helpers (Phase 2)
├── types/                   # TypeScript type definitions (Phase 2)
└── public/                  # Static assets
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checker

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js + TypeScript + Prettier configuration
- **Prettier**: Code formatting (run on save)

### Adding the $BASED Chain to MetaMask

1. Open MetaMask
2. Click "Add Network" → "Add Network Manually"
3. Enter the following details:
   - **Network Name**: $BASED Chain
   - **RPC URL**: `https://mainnet.basedaibridge.com/rpc/`
   - **Chain ID**: `32323`
   - **Currency Symbol**: `BASED`
   - **Block Explorer**: `https://explorer.bf1337.org`

## 🌐 Blockchain Details

- **Chain Name**: $BASED Chain
- **Chain ID**: 32323
- **RPC Endpoint**: https://mainnet.basedaibridge.com/rpc/
- **Block Explorer**: https://explorer.bf1337.org
- **Contract Address**: `0x40B6184b901334C0A88f528c1A0a1de7a77490f1`

## 📦 Smart Contract

### KEKTECH Main Collection

- **Address**: `0x40B6184b901334C0A88f528c1A0a1de7a77490f1`
- **Total Supply**: 10,000 NFTs
- **Max Per Transaction**: 5 NFTs
- **Metadata**: Dynamic on-chain metadata
- **Ranking**: On-chain ranking system

## 🚧 Phase 2 (Upcoming)

The following features will be implemented in Phase 2:

- [ ] Mint functionality with transaction handling
- [ ] NFT gallery with filtering and sorting
- [ ] User profile page
- [ ] Transaction history
- [ ] NFT ranking display
- [ ] Image generation API integration
- [ ] Share functionality
- [ ] Mobile-optimized UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 📄 License

This project is proprietary and confidential.

## 🔗 Links

- [GitHub Repository](https://github.com/0xBased-lang/kektech-nextjs)
- [Block Explorer](https://explorer.bf1337.org)
- [RPC Endpoint](https://mainnet.basedaibridge.com/rpc/)

## 💬 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ by the KEKTECH Team**
