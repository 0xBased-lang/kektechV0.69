import { createPublicClient, http, formatEther } from 'viem'
import { basedChain } from '../config/chains'
import { KEKTECH_MAIN } from '../config/contracts'

const client = createPublicClient({
  chain: basedChain,
  transport: http(),
})

async function checkPrice() {
  try {
    const price = await client.readContract({
      address: KEKTECH_MAIN.address,
      abi: KEKTECH_MAIN.abi,
      functionName: 'tokenPrice',
    })

    console.log('📊 Contract Price Check:')
    console.log('  Wei:', price.toString())
    console.log('  BASED:', formatEther(price))
    console.log('\n🔧 Current hardcoded price:')
    console.log('  Wei:', KEKTECH_MAIN.referenceMintPrice.toString())
    console.log('  BASED:', formatEther(KEKTECH_MAIN.referenceMintPrice))
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkPrice()
