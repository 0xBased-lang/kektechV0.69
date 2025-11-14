/**
 * NFT History Page Route
 * Shows complete trading history for a specific NFT
 * Route: /marketplace/history/[tokenId]
 */

import { NFTHistoryPage } from '@/components/marketplace/NFTHistoryPage'

interface PageProps {
  params: Promise<{
    tokenId: string
  }>
}

export default async function NFTHistoryRoute({ params }: PageProps) {
  const { tokenId: tokenIdStr } = await params
  const tokenId = parseInt(tokenIdStr, 10)

  // Validate tokenId
  if (isNaN(tokenId) || tokenId < 0 || tokenId > 3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Invalid NFT</h1>
          <p className="text-gray-400">Token ID must be between 0 and 3</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <NFTHistoryPage tokenId={tokenId} />
    </div>
  )
}

// Generate static paths for all voucher types (0-3)
export function generateStaticParams() {
  return [{ tokenId: '0' }, { tokenId: '1' }, { tokenId: '2' }, { tokenId: '3' }]
}

// Metadata
export async function generateMetadata({ params }: PageProps) {
  const { tokenId: tokenIdStr } = await params
  const tokenId = parseInt(tokenIdStr, 10)

  const names: Record<number, string> = {
    0: 'Genesis',
    1: 'Silver',
    2: 'Gold',
    3: 'Platinum',
  }

  return {
    title: `𝕂Ǝ𝕂TV #${tokenId} ${names[tokenId]} - Trading History`,
    description: `View complete trading history, statistics, and offer timeline for 𝕂Ǝ𝕂TV #${tokenId} ${names[tokenId]} voucher.`,
  }
}
