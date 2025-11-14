import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Strict mode: Show all ESLint errors during builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Strict mode: Show all TypeScript errors during builds
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'explorer.bf1337.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kektech.xyz',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.kektech.xyz',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
    ],
    unoptimized: false,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbopack: {
      root: process.cwd(),
    },
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://verify.walletconnect.com https://verify.walletconnect.org",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.bridge.walletconnect.org https://rpc.basedai.com https://api.web3modal.org https://mainnet.basedaibridge.com https://explorer.bf1337.org https://kektech.xyz https://api.kektech.xyz wss://ws.kektech.xyz https://eth.merkle.io https://*.merkle.io https://*.ipfs.nftstorage.link https://*.ipfs.w3s.link https://ipfs.io https://cca-lite.coinbase.com https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
