import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'KEKTECH NFT Collection | $BASED Chain',
  description:
    'Mint your KEKTECH NFT on the $BASED Chain (32323). Join the community and own a piece of the future.',
  keywords: ['KEKTECH', 'NFT', 'BASED', 'Blockchain', 'Web3', 'Crypto'],
  authors: [{ name: 'KEKTECH Team' }],
  openGraph: {
    title: 'KEKTECH NFT Collection',
    description: 'Mint your KEKTECH NFT on the $BASED Chain',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEKTECH NFT Collection',
    description: 'Mint your KEKTECH NFT on the $BASED Chain',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
// Single project deployment test
