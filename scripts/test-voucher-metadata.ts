/**
 * Test script to fetch voucher metadata from contract
 *
 * Usage: npx tsx scripts/test-voucher-metadata.ts [tokenId]
 * Example: npx tsx scripts/test-voucher-metadata.ts 0
 */

import { createPublicClient, http } from 'viem'
import { KEKTECH_VOUCHERS } from '../config/contracts/kektech-vouchers'

// BasedAI Chain configuration
const basedAIChain = {
  id: 32323,
  name: 'BasedAI',
  nativeCurrency: { name: 'BASED', symbol: 'BASED', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.basedaibridge.com/rpc'] },
    public: { http: ['https://mainnet.basedaibridge.com/rpc'] },
  },
  blockExplorers: {
    default: { name: 'BasedAI Explorer', url: 'https://explorer.bf1337.org' },
  },
}

async function testVoucherMetadata(tokenId: number) {
  console.log(`\n🔍 Testing Voucher Metadata for Token ID: ${tokenId}`)
  console.log('━'.repeat(60))

  // Create public client
  const client = createPublicClient({
    chain: basedAIChain as any,
    transport: http(),
  })

  try {
    // Step 1: Call contract's uri() function
    console.log(`\n1️⃣  Fetching URI from contract...`)
    const uri = await client.readContract({
      address: KEKTECH_VOUCHERS.address,
      abi: KEKTECH_VOUCHERS.abi,
      functionName: 'uri',
      args: [BigInt(tokenId)],
    })

    console.log(`✅ URI: ${uri}`)

    if (!uri || typeof uri !== 'string') {
      throw new Error('No URI returned from contract')
    }

    // Step 2: Convert IPFS URL if needed
    console.log(`\n2️⃣  Converting URL...`)
    const metadataUrl = convertIpfsUrl(uri as string)
    console.log(`✅ Metadata URL: ${metadataUrl}`)

    // Step 3: Fetch metadata JSON
    console.log(`\n3️⃣  Fetching metadata JSON...`)
    const response = await fetch(metadataUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const metadata = await response.json()
    console.log(`✅ Metadata fetched successfully`)

    // Step 4: Display metadata details
    console.log(`\n4️⃣  Metadata Details:`)
    console.log(`━`.repeat(60))
    console.log(`Name: ${metadata.name || 'N/A'}`)
    console.log(`Description: ${metadata.description || 'N/A'}`)
    console.log(`\nImage URL: ${metadata.image || 'N/A'}`)
    console.log(`Animation URL: ${metadata.animation_url || 'N/A'}`)

    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      console.log(`\nAttributes:`)
      metadata.attributes.forEach((attr: any) => {
        console.log(`  - ${attr.trait_type}: ${attr.value}`)
      })
    }

    // Step 5: Check if image/animation is GIF
    console.log(`\n5️⃣  Media Type Analysis:`)
    console.log(`━`.repeat(60))

    const imageUrl = metadata.image
    const animationUrl = metadata.animation_url

    if (animationUrl) {
      console.log(`📹 Animation URL found: ${animationUrl}`)
      const isGif = animationUrl.toLowerCase().endsWith('.gif')
      const isIpfs = animationUrl.includes('ipfs')
      console.log(`   - Format: ${isGif ? 'GIF ✅' : 'Other format'}`)
      console.log(`   - Storage: ${isIpfs ? 'IPFS' : 'HTTP Server'}`)
      console.log(`   - Converted URL: ${convertIpfsUrl(animationUrl)}`)
    }

    if (imageUrl) {
      console.log(`🖼️  Image URL found: ${imageUrl}`)
      const isGif = imageUrl.toLowerCase().endsWith('.gif')
      const isIpfs = imageUrl.includes('ipfs')
      console.log(`   - Format: ${isGif ? 'GIF ✅' : 'Other format'}`)
      console.log(`   - Storage: ${isIpfs ? 'IPFS' : 'HTTP Server'}`)
      console.log(`   - Converted URL: ${convertIpfsUrl(imageUrl)}`)
    }

    console.log(`\n✨ Test completed successfully!`)
    console.log(`━`.repeat(60))

  } catch (error) {
    console.error(`\n❌ Error:`, error)
    process.exit(1)
  }
}

function convertIpfsUrl(url: string): string {
  if (!url) return url

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${hash}`
  }

  if (url.startsWith('/ipfs/')) {
    return `https://ipfs.io${url}`
  }

  if (url.match(/^Qm[a-zA-Z0-9]{44}/) || url.match(/^ba[a-zA-Z0-9]{57}/)) {
    return `https://ipfs.io/ipfs/${url}`
  }

  return url
}

// Parse command line arguments
const tokenId = process.argv[2] ? parseInt(process.argv[2]) : 0

if (isNaN(tokenId) || tokenId < 0) {
  console.error('❌ Invalid token ID. Please provide a valid number.')
  console.log('Usage: npx tsx scripts/test-voucher-metadata.ts [tokenId]')
  console.log('Example: npx tsx scripts/test-voucher-metadata.ts 0')
  process.exit(1)
}

// Run the test
testVoucherMetadata(tokenId)
