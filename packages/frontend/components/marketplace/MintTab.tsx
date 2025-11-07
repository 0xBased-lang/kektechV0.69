import { EnhancedMintForm } from '@/components/web3/mint/EnhancedMintForm'

/**
 * MintTab Component
 *
 * Mint interface tab for the marketplace page
 */
export function MintTab() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Mint Form */}
      <EnhancedMintForm />
    </div>
  )
}
