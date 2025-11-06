import { createPublicClient, http, parseAbi, keccak256, stringToBytes } from '../kektech-frontend/node_modules/viem/index.js'

async function main() {
  const RPC_URL = 'https://mainnet.basedaibridge.com/rpc'
  const client = createPublicClient({ transport: http(RPC_URL) })

  const masterRegistry = '0x412ab6fbdd342AAbE6145f3e36930E42a2089964'
  const masterAbi = parseAbi([
    'function getContract(bytes32 key) view returns (address)'
  ])

  const keys = [
    'AccessControlManager',
    'ParameterStorage',
    'FlexibleMarketFactory',
    'ResolutionManager',
    'RewardDistributor',
    'MarketTemplateRegistry',
  ]

  const out = {}

  for (const name of keys) {
    const keyHash = keccak256(stringToBytes(name))
    try {
      const address = await client.readContract({
        address: masterRegistry,
        abi: masterAbi,
        functionName: 'getContract',
        args: [keyHash],
      })

      let hasCode = false
      try {
        const code = await client.getBytecode({ address })
        hasCode = !!code && code !== '0x'
      } catch {}

      out[name] = { address, hasCode }
    } catch (e) {
      out[name] = { error: (e?.shortMessage || e?.message || 'error').toString() }
    }
  }

  // If MarketTemplateRegistry exists, probe template state
  if (out.MarketTemplateRegistry && out.MarketTemplateRegistry.address && out.MarketTemplateRegistry.hasCode) {
    const mtrAddr = out.MarketTemplateRegistry.address
    const mtrAbi = parseAbi([
      'function getActiveTemplateCount() view returns (uint256)',
      'function getTemplate(bytes32) view returns (address)',
      'function templateExists(bytes32) view returns (bool)',
      'function isTemplateActive(bytes32) view returns (bool)'
    ])

    try {
      const activeCount = await client.readContract({ address: mtrAddr, abi: mtrAbi, functionName: 'getActiveTemplateCount' })
      const parimutuelId = keccak256(stringToBytes('PARIMUTUEL'))
      const exists = await client.readContract({ address: mtrAddr, abi: mtrAbi, functionName: 'templateExists', args: [parimutuelId] })
      let isActive = null
      try {
        isActive = await client.readContract({ address: mtrAddr, abi: mtrAbi, functionName: 'isTemplateActive', args: [parimutuelId] })
      } catch {}
      let implementation = null
      try {
        implementation = await client.readContract({ address: mtrAddr, abi: mtrAbi, functionName: 'getTemplate', args: [parimutuelId] })
      } catch {}
      out.MarketTemplateRegistry.details = {
        activeTemplateCount: activeCount?.toString?.() || String(activeCount),
        parimutuel: { id: parimutuelId, exists, isActive, implementation }
      }
    } catch (e) {
      out.MarketTemplateRegistry.details = { error: (e?.shortMessage || e?.message || 'error').toString() }
    }
  }

  // Probe factory active market count
  if (out.FlexibleMarketFactory && out.FlexibleMarketFactory.address) {
    const facAddr = out.FlexibleMarketFactory.address
    const facAbi = parseAbi(['function getActiveMarketCount() view returns (uint256)'])
    try {
      const count = await client.readContract({ address: facAddr, abi: facAbi, functionName: 'getActiveMarketCount' })
      out.FlexibleMarketFactory.activeMarketCount = count?.toString?.() || String(count)
    } catch (e) {
      out.FlexibleMarketFactory.activeMarketCountError = (e?.shortMessage || e?.message || 'error').toString()
    }
  }

  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error('RPC check failed:', e)
  process.exit(1)
})


