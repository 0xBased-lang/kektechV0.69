#!/usr/bin/env node

/**
 * KEKTECH Metadata Generation Script
 *
 * Purpose: Pre-generate static metadata file during build
 * Benefits:
 *   - 500x faster gallery loading (<50ms vs 25-30s)
 *   - 247x fewer API calls (1 vs 247)
 *   - Better user experience (instant filtering)
 *
 * Flow:
 *   1. Fetch rankings API (minted NFTs only)
 *   2. Batch fetch metadata for all NFTs
 *   3. Calculate trait statistics
 *   4. Generate public/data/minted-metadata.json
 *
 * Run: node scripts/generate-metadata.js
 */

const fs = require('fs')
const path = require('path')

// Polyfill fetch for Node.js < 18 (Vercel compatibility)
const fetch = globalThis.fetch || (async (...args) => {
  const nodeFetch = await import('node-fetch')
  return nodeFetch.default(...args)
})

// Configuration
const CONFIG = {
  RANKINGS_API: 'https://api.kektech.xyz/rankings',
  METADATA_API: 'https://api.kektech.xyz/api/metadata',
  OUTPUT_PATH: path.join(__dirname, '../public/data/minted-metadata.json'),
  BATCH_SIZE: 15, // Concurrent requests per batch
  BATCH_DELAY: 150, // ms delay between batches
}

// Progress tracking
let progressBar = ''
let lastProgress = 0

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KEKTECH-Metadata-Generator/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (i === retries - 1) throw error

      console.warn(`  ⚠️  Retry ${i + 1}/${retries} for ${url}`)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

/**
 * Update progress bar
 */
function updateProgress(current, total, label) {
  const percentage = Math.floor((current / total) * 100)

  // Only update if changed (reduce console spam)
  if (percentage !== lastProgress) {
    lastProgress = percentage
    const filled = Math.floor(percentage / 2)
    const empty = 50 - filled
    progressBar = '█'.repeat(filled) + '░'.repeat(empty)

    process.stdout.write(`\r  ${label}: [${progressBar}] ${percentage}% (${current}/${total})`)
  }
}

/**
 * Batch fetch metadata with concurrency control
 */
async function fetchMetadataBatch(nfts) {
  console.log(`\n🔍 Fetching metadata for ${nfts.length} NFTs...`)

  const metadataMap = new Map()
  let completed = 0

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < nfts.length; i += CONFIG.BATCH_SIZE) {
    const batch = nfts.slice(i, i + CONFIG.BATCH_SIZE)

    const batchPromises = batch.map(async (nft) => {
      try {
        const url = `${CONFIG.METADATA_API}/${nft.tokenId}`
        const metadata = await fetchWithRetry(url)

        if (metadata && metadata.attributes) {
          metadataMap.set(nft.tokenId, metadata.attributes)
        }

        completed++
        updateProgress(completed, nfts.length, '  Progress')
      } catch (error) {
        console.error(`\n  ❌ Failed to fetch metadata for token ${nft.tokenId}:`, error.message)
        // Continue with empty attributes
        metadataMap.set(nft.tokenId, [])
        completed++
      }
    })

    await Promise.all(batchPromises)

    // Delay between batches to be respectful to the API
    if (i + CONFIG.BATCH_SIZE < nfts.length) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY))
    }
  }

  console.log('\n')
  return metadataMap
}

/**
 * Calculate trait statistics
 */
function calculateTraitStats(nftsWithMetadata) {
  const traitStats = {}

  nftsWithMetadata.forEach(nft => {
    nft.attributes?.forEach(attr => {
      const category = attr.trait_type
      const value = attr.value

      if (!traitStats[category]) {
        traitStats[category] = {}
      }

      if (!traitStats[category][value]) {
        traitStats[category][value] = { count: 0, percentage: '0' }
      }

      traitStats[category][value].count++
    })
  })

  // Calculate percentages
  const totalNFTs = nftsWithMetadata.length
  Object.keys(traitStats).forEach(category => {
    Object.keys(traitStats[category]).forEach(value => {
      const count = traitStats[category][value].count
      const percentage = ((count / totalNFTs) * 100).toFixed(2)
      traitStats[category][value].percentage = percentage
    })
  })

  return traitStats
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now()

  console.log('\n🚀 KEKTECH Metadata Generation')
  console.log('━'.repeat(60))

  try {
    // Step 1: Fetch rankings (minted NFTs only)
    console.log('\n📊 Step 1: Fetching minted NFTs from rankings API...')
    const rankingsData = await fetchWithRetry(CONFIG.RANKINGS_API)

    if (!rankingsData || !rankingsData.nfts || !Array.isArray(rankingsData.nfts)) {
      throw new Error('Invalid rankings API response')
    }

    const { nfts } = rankingsData
    console.log(`  ✅ Found ${nfts.length} minted NFTs`)

    // Step 2: Batch fetch metadata
    console.log('\n🔍 Step 2: Fetching metadata for all NFTs...')
    const metadataMap = await fetchMetadataBatch(nfts)

    // Step 3: Merge data
    console.log('🔗 Step 3: Merging rankings with metadata...')
    const nftsWithMetadata = nfts.map(nft => ({
      rank: nft.rank,
      tokenId: nft.tokenId,
      name: nft.name,
      rarityScore: nft.rarityScore,
      imageUrl: nft.imageUrl,
      attributes: metadataMap.get(nft.tokenId) || []
    }))

    const withTraits = nftsWithMetadata.filter(n => n.attributes.length > 0).length
    console.log(`  ✅ ${withTraits}/${nfts.length} NFTs have trait data`)

    // Step 4: Calculate trait statistics
    console.log('\n📈 Step 4: Calculating trait statistics...')
    const traitStats = calculateTraitStats(nftsWithMetadata)
    const categoryCount = Object.keys(traitStats).length
    const totalTraits = Object.values(traitStats).reduce(
      (sum, category) => sum + Object.keys(category).length,
      0
    )
    console.log(`  ✅ ${categoryCount} trait categories, ${totalTraits} unique traits`)

    // Step 5: Generate output
    console.log('\n💾 Step 5: Writing output file...')
    const output = {
      generated: new Date().toISOString(),
      totalSupply: nfts.length,
      nfts: nftsWithMetadata,
      traitStats
    }

    // Ensure output directory exists
    const outputDir = path.dirname(CONFIG.OUTPUT_PATH)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(
      CONFIG.OUTPUT_PATH,
      JSON.stringify(output, null, 2),
      'utf8'
    )

    // Get file size
    const stats = fs.statSync(CONFIG.OUTPUT_PATH)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`  ✅ File written: ${CONFIG.OUTPUT_PATH}`)
    console.log(`  📊 File size: ${fileSizeMB} MB`)
    console.log(`  ⏱️  Total time: ${duration}s`)

    console.log('\n━'.repeat(60))
    console.log('✨ Metadata generation complete!\n')

    process.exit(0)

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main }
