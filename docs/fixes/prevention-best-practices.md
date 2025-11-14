# Prevention Best Practices - Web3 Dashboard Development

**Purpose**: Prevent similar null safety and wallet connection issues in future development
**Last Updated**: October 13, 2025

---

## 🎯 Core Principles

### 1. Never Trust External Data

```typescript
// ❌ BAD: Direct property access
const address = nft.token.address_hash.toLowerCase()

// ✅ GOOD: Defensive access
const address = nft?.token?.address_hash
if (!address) return null
return address.toLowerCase()

// ✅ BETTER: Type guard
function hasValidAddress(nft: any): nft is NFT & { token: { address_hash: string } } {
  return (
    nft?.token?.address_hash &&
    typeof nft.token.address_hash === 'string' &&
    nft.token.address_hash.length > 0
  )
}

const validNFTs = nfts.filter(hasValidAddress)
```

### 2. Validate at Boundaries

External data enters your app through:
- API responses
- Blockchain queries
- User inputs
- Wallet connections

**Always validate at these entry points:**

```typescript
// API Route Handler
export async function GET(request: Request) {
  const data = await fetchFromBlockchain()

  // Validate before using
  if (!isValidNFTResponse(data)) {
    return NextResponse.json(
      { error: 'Invalid NFT data' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

// Validation function
function isValidNFTResponse(data: unknown): data is NFT[] {
  return (
    Array.isArray(data) &&
    data.every(nft =>
      nft &&
      typeof nft === 'object' &&
      'token' in nft &&
      typeof nft.token?.address_hash === 'string'
    )
  )
}
```

### 3. Use TypeScript Strictly

Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

This catches many issues at compile time!

---

## 🛡️ Defensive Coding Patterns

### Pattern 1: Optional Chaining with Fallback

```typescript
// Accessing nested properties
const name = nft?.metadata?.name ?? 'Unknown NFT'
const image = nft?.metadata?.image_url ?? nft?.image_url ?? '/placeholder.png'

// Calling methods safely
const displayName = connector?.name?.toLowerCase() ?? connector?.id ?? 'Unknown'
```

### Pattern 2: Early Returns

```typescript
// ❌ BAD: Nested if statements
function processNFT(nft: NFT) {
  if (nft) {
    if (nft.token) {
      if (nft.token.address_hash) {
        return nft.token.address_hash.toLowerCase()
      }
    }
  }
  return null
}

// ✅ GOOD: Early returns
function processNFT(nft: NFT | null | undefined): string | null {
  if (!nft) return null
  if (!nft.token) return null
  if (!nft.token.address_hash) return null

  return nft.token.address_hash.toLowerCase()
}

// ✅ BETTER: One-liner with optional chaining
function processNFT(nft: NFT | null | undefined): string | null {
  return nft?.token?.address_hash?.toLowerCase() ?? null
}
```

### Pattern 3: Array Operations Safety

```typescript
// ❌ BAD: Assume array items are valid
const addresses = nfts.map(nft => nft.token.address_hash.toLowerCase())

// ✅ GOOD: Filter then map
const addresses = nfts
  .filter(nft => nft?.token?.address_hash)
  .map(nft => nft.token.address_hash.toLowerCase())

// ✅ BETTER: Compact map
const addresses = nfts
  .map(nft => nft?.token?.address_hash?.toLowerCase())
  .filter((addr): addr is string => typeof addr === 'string')
```

### Pattern 4: Safe Comparisons

```typescript
// ❌ BAD: Direct comparison
if (nft.token.address_hash.toLowerCase() === targetAddress.toLowerCase()) {
  // ...
}

// ✅ GOOD: Utility function
function addressEquals(addr1?: string, addr2?: string): boolean {
  if (!addr1 || !addr2) return false
  return addr1.toLowerCase() === addr2.toLowerCase()
}

if (addressEquals(nft?.token?.address_hash, targetAddress)) {
  // ...
}
```

---

## 🔧 Reusable Utilities

Create these utility functions in your project:

### File: `lib/utils/safe-operations.ts`

```typescript
/**
 * Safely compare two addresses (case-insensitive)
 */
export function safeAddressCompare(
  addr1: string | null | undefined,
  addr2: string | null | undefined
): boolean {
  if (!addr1 || !addr2) return false
  if (typeof addr1 !== 'string' || typeof addr2 !== 'string') return false

  try {
    return addr1.toLowerCase() === addr2.toLowerCase()
  } catch {
    return false
  }
}

/**
 * Safely get a property from a nested object
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue
    }
    current = current[key]
  }

  return current ?? defaultValue
}

// Usage
const address = safeGet(nft, 'token.address_hash', '')

/**
 * Type guard for valid NFT
 */
export function isValidNFT(nft: unknown): nft is ValidNFT {
  return (
    typeof nft === 'object' &&
    nft !== null &&
    'token' in nft &&
    typeof (nft as any).token === 'object' &&
    (nft as any).token !== null &&
    'address_hash' in (nft as any).token &&
    typeof (nft as any).token.address_hash === 'string'
  )
}

/**
 * Safe array filter with type narrowing
 */
export function filterValid<T>(
  array: (T | null | undefined)[],
  validator: (item: T) => boolean
): T[] {
  return array.filter((item): item is T =>
    item != null && validator(item)
  )
}
```

---

## 🧪 Testing Strategies

### Unit Test Examples

```typescript
// tests/utils/safe-operations.test.ts
import { safeAddressCompare, isValidNFT } from '@/lib/utils/safe-operations'

describe('safeAddressCompare', () => {
  it('should compare valid addresses case-insensitively', () => {
    expect(safeAddressCompare('0xABC', '0xabc')).toBe(true)
    expect(safeAddressCompare('0xABC', '0xDEF')).toBe(false)
  })

  it('should handle null/undefined safely', () => {
    expect(safeAddressCompare(null, '0xABC')).toBe(false)
    expect(safeAddressCompare(undefined, '0xABC')).toBe(false)
    expect(safeAddressCompare('0xABC', null)).toBe(false)
    expect(safeAddressCompare(null, null)).toBe(false)
  })

  it('should handle non-string values', () => {
    expect(safeAddressCompare(123 as any, '0xABC')).toBe(false)
    expect(safeAddressCompare('0xABC', {} as any)).toBe(false)
  })
})

describe('isValidNFT', () => {
  it('should validate complete NFT objects', () => {
    const validNFT = {
      id: '1',
      token: {
        address_hash: '0xABC123',
        name: 'Test NFT'
      }
    }
    expect(isValidNFT(validNFT)).toBe(true)
  })

  it('should reject invalid NFT objects', () => {
    expect(isValidNFT(null)).toBe(false)
    expect(isValidNFT(undefined)).toBe(false)
    expect(isValidNFT({})).toBe(false)
    expect(isValidNFT({ token: null })).toBe(false)
    expect(isValidNFT({ token: {} })).toBe(false)
    expect(isValidNFT({ token: { address_hash: null } })).toBe(false)
  })
})
```

---

## 🚨 Wallet Connection Specific Issues

### Issue 1: Multiple Wallet Extensions

**Problem**: Multiple browser wallet extensions (MetaMask, Phantom, Coinbase, XDEFI) compete to inject `window.ethereum`

**Solution**: Use provider detection with fallbacks

```typescript
// config/web3-provider-fix.ts (already implemented)

export function initializeEthereumProvider() {
  if (typeof window === 'undefined') return

  // Check if property is configurable
  const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum')
  if (descriptor && !descriptor.configurable) {
    console.warn('Window.ethereum is not configurable')
    return
  }

  // Create safe proxy to handle multiple providers
  const providerProxy = new Proxy({}, {
    get(_target, prop) {
      // Try multiple provider sources
      const providers = [
        window.__SAFE_ETHEREUM_PROVIDER,
        window.ethereum,
        window.web3?.currentProvider,
      ].filter(Boolean)

      for (const provider of providers) {
        if (provider && prop in provider) {
          return provider[prop]
        }
      }
      return undefined
    }
  })

  // Safely define ethereum property
  try {
    Object.defineProperty(window, 'ethereum', {
      get() { return providerProxy },
      configurable: true,
      enumerable: true
    })
  } catch (error) {
    console.warn('Could not define window.ethereum:', error)
  }
}
```

### Issue 2: Connector Name Availability

**Problem**: Not all wallet connectors define a `name` property

**Solution**: Check existence before accessing

```typescript
// Always check before accessing connector properties
const connector = connectors.find(c => {
  // ID-based checks (always available)
  if (c.id === 'metaMask' || c.id === 'injected') return true

  // Name-based checks (check existence first)
  if (c.name && c.name.toLowerCase().includes('metamask')) return true

  return false
})
```

---

## 📋 Pre-Deployment Checklist

Before pushing to production:

### Code Quality
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` with no errors
- [ ] TypeScript compilation passes
- [ ] No console errors in development mode

### Testing
- [ ] Test with empty wallet (no NFTs)
- [ ] Test with NFTs from different collections
- [ ] Test with multiple wallet extensions installed
- [ ] Test wallet connection/disconnection flow
- [ ] Test on different networks (if applicable)

### Error Handling
- [ ] All API calls have try-catch blocks
- [ ] All external data has validation
- [ ] Error messages are user-friendly
- [ ] Loading states are shown appropriately
- [ ] Empty states are handled gracefully

### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists use virtualization
- [ ] Images have loading states
- [ ] API calls are cached when appropriate

### Security
- [ ] No private keys in code
- [ ] No sensitive data in console logs
- [ ] Input validation on all user inputs
- [ ] XSS protection in place

---

## 🔍 Code Review Guidelines

When reviewing Web3 code, check for:

### 1. Null Safety
```typescript
// Flag this in review
const result = data.items.map(item => item.value.toLowerCase())

// Suggest this instead
const result = data?.items
  ?.map(item => item?.value)
  ?.filter((val): val is string => typeof val === 'string')
  ?.map(val => val.toLowerCase()) ?? []
```

### 2. Array Operations
```typescript
// Flag this in review
const total = nfts.reduce((sum, nft) => sum + nft.metadata.price, 0)

// Suggest this instead
const total = nfts.reduce((sum, nft) => {
  const price = nft?.metadata?.price
  return sum + (typeof price === 'number' ? price : 0)
}, 0)
```

### 3. Type Assertions
```typescript
// Flag this in review
const address = wallet as string

// Suggest this instead
if (typeof wallet !== 'string') {
  throw new Error('Invalid wallet address')
}
const address = wallet
```

---

## 📚 Resources

### TypeScript
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Optional Chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [Nullish Coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)

### Web3 Development
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [MetaMask Best Practices](https://docs.metamask.io/wallet/concepts/sdk-best-practices/)

### Testing
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest](https://vitest.dev/)

---

## ✅ Success Metrics

A well-protected codebase should have:

- **Zero** `TypeError` crashes in production
- **100%** TypeScript strict mode compliance
- **80%+** test coverage on critical paths
- **Clear** error messages for users
- **Graceful** degradation when services fail

---

## 🎓 Training Points

When onboarding new developers:

1. **Show real examples** from this incident
2. **Live code review** existing safe patterns
3. **Practice** writing type guards
4. **Review** common pitfalls in Web3 development
5. **Test** defensive coding with edge cases

---

## 📞 Questions?

If you encounter similar issues:

1. Check this documentation first
2. Review the incident report: `2025-10-13-wallet-connection-crash-fix.md`
3. Look at safe patterns in `lib/hooks/usePortfolioData.ts`
4. Add tests to prevent regression
5. Document new patterns learned

**Remember**: An ounce of prevention is worth a pound of cure! 🛡️
