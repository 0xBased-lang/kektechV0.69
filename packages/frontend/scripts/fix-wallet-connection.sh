#!/bin/bash

# Fix Wallet Connection Script
# This script applies all fixes for wallet connection issues

echo "🔧 Applying Wallet Connection Fixes..."

# Backup original files
echo "📦 Creating backups..."
cp config/wagmi.ts config/wagmi.backup.ts 2>/dev/null || true
cp app/providers.tsx app/providers.backup.tsx 2>/dev/null || true
cp components/web3/ConnectButton.tsx components/web3/ConnectButton.backup.tsx 2>/dev/null || true

# Apply fixed versions
echo "✨ Applying fixed configurations..."
cp config/wagmi-fixed.ts config/wagmi.ts
cp app/providers-fixed.tsx app/providers.tsx
cp components/web3/ConnectButton-fixed.tsx components/web3/ConnectButton.tsx

# Update environment variables
echo "🔑 Setting environment variables..."
cat > .env.local << EOL
# Reown/WalletConnect Configuration
NEXT_PUBLIC_REOWN_PROJECT_ID=dc5e6470d109f31f1d271b149fed3d98

# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x40B6184b901334C0A88f528c1A0a1de7a77490f1

# Network Configuration
NEXT_PUBLIC_RPC_URL=https://rpc.kektech.xyz
NEXT_PUBLIC_CHAIN_ID=32323
NEXT_PUBLIC_CHAIN_NAME=BasedAI

# App URLs
NEXT_PUBLIC_APP_URL=https://kektech-nextjs.vercel.app
EOL

# Clear Next.js cache
echo "🧹 Clearing cache..."
rm -rf .next/cache

# Rebuild the project
echo "🏗️ Rebuilding project..."
npm run build

echo "✅ Wallet connection fixes applied!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Update domain alias: vercel alias set [deployment-url] kektech-nextjs.vercel.app"
echo "3. Configure Reown domains at https://cloud.reown.com"
echo ""
echo "🌐 Required domains for Reown allowlist:"
echo "   - https://kektech-nextjs.vercel.app"
echo "   - https://kektech-nextjs-*.vercel.app"
echo "   - https://localhost:3000"
echo "   - https://www.kektech.xyz"