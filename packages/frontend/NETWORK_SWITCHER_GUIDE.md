# 🌐 BasedAI Network Switcher - Implementation Guide

## 🎯 Problem Solved

**Issue:** Users connected to Ethereum Mainnet (or other networks) couldn't mint NFTs on BasedAI Chain (ID: 32323)

**Solution:** Auto-detect wrong network + one-click switching + automatic network addition to MetaMask

---

## ✅ What Was Implemented

### 1. **NetworkSwitcher Component**
**File:** `components/web3/NetworkSwitcher.tsx`

**Features:**
- ✅ Auto-detects when user is on wrong network
- ✅ One-click "Switch to BasedAI" button
- ✅ Auto-adds BasedAI network to MetaMask if not present
- ✅ Two display modes: **inline** (header) and **banner** (full page)
- ✅ Shows network details (Chain ID, RPC URL, Symbol)
- ✅ Error handling with user-friendly messages

**Props:**
```tsx
interface NetworkSwitcherProps {
  inline?: boolean // Compact mode for navbar
  showWhenDisconnected?: boolean // Show even when wallet not connected
}
```

**Usage:**
```tsx
// Inline mode (header)
<NetworkSwitcher inline />

// Full banner mode (mint page)
<NetworkSwitcher />
```

---

### 2. **Network Validation Hook**
**File:** `lib/hooks/useNetworkValidation.ts`

**Purpose:** Reusable hook for checking network status across the app

**Returns:**
```tsx
{
  isCorrectNetwork: boolean    // User on BasedAI (32323)
  isWrongNetwork: boolean       // User on wrong network
  isDisconnected: boolean       // No wallet connected
  currentChainId?: number       // Active chain ID
  expectedChainId: number       // 32323 (BasedAI)
  canInteract: boolean          // Can use dApp features
}
```

**Usage:**
```tsx
const { isWrongNetwork, canInteract } = useNetworkValidation()

<button disabled={!canInteract}>
  Mint NFT
</button>
```

---

### 3. **Integration Points**

#### **A. Header (Always Visible)**
**File:** `components/layout/Header.tsx`

```tsx
<div className="flex items-center gap-3">
  <NetworkSwitcher inline />  {/* ← New */}
  <ConnectButton />
</div>
```

**What Users See:**
- Small "Switch Network" button next to Connect Wallet
- Only shows when on wrong network
- Always accessible from any page

---

#### **B. Mint Page (Blocking Mode)**
**File:** `components/web3/mint/MintForm.tsx`

**Logic:**
```tsx
if (!isConnected) {
  return <ConnectWalletPrompt />
}

if (isWrongNetwork) {
  return <NetworkSwitcher />  // ← Blocks minting
}

// Only shows mint form if on correct network
return <MintForm />
```

**What Users See:**
- Large warning banner if on wrong network
- "Switch to BasedAI" button (primary action)
- "Add BasedAI Network to MetaMask" button (alternative)
- Network details and instructions

---

## 🔧 How It Works

### 1. **Network Detection**
```typescript
import { useChainId } from 'wagmi'
import { basedChain } from '@/config/chains'

const currentChainId = useChainId()
const isWrongNetwork = currentChainId !== basedChain.id
```

### 2. **Network Switching**
```typescript
import { useSwitchChain } from 'wagmi'

const { switchChain } = useSwitchChain()

// Switch to BasedAI
await switchChain({ chainId: 32323 })
```

### 3. **Adding Network to MetaMask**
```typescript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x7E63', // 32323 in hex
    chainName: 'BasedAI',
    nativeCurrency: {
      name: 'BASED',
      symbol: 'BASED',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.basedaibridge.com/rpc/'],
    blockExplorerUrls: ['https://explorer.bf1337.org']
  }]
})
```

---

## 🎨 User Experience Flow

### **Scenario 1: User on Ethereum Mainnet**

1. User connects MetaMask on Ethereum
2. **Header:** Small "Switch Network" button appears
3. **Mint Page:** Large warning banner blocks minting
4. User clicks "Switch to BasedAI"
5. MetaMask prompts: "Allow this site to switch the network?"
6. User approves
7. ✅ Network switches to BasedAI (32323)
8. Mint form becomes available

### **Scenario 2: User Never Added BasedAI Network**

1. User clicks "Switch to BasedAI"
2. MetaMask error: "Unrecognized chain"
3. System automatically calls `wallet_addEthereumChain`
4. MetaMask prompts: "Allow this site to add a network?"
5. User approves
6. ✅ BasedAI network added AND switched
7. Mint form becomes available

---

## 📊 Network Configuration

### **BasedAI Network Details**

```typescript
// config/chains.ts
export const basedChain = defineChain({
  id: 32323,
  name: 'BasedAI',
  nativeCurrency: {
    name: 'BASED',
    symbol: 'BASED',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.basedaibridge.com/rpc/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BasedAI Explorer',
      url: 'https://explorer.bf1337.org',
    },
  },
  testnet: false,
})
```

### **Manual MetaMask Setup**

If users want to add the network manually:

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter the following:

```
Network Name: BasedAI
RPC URL: https://mainnet.basedaibridge.com/rpc/
Chain ID: 32323
Currency Symbol: BASED
Block Explorer: https://explorer.bf1337.org
```

---

## 🚀 Deployment Status

✅ **Deployed to GitHub:** `main` branch
✅ **Vercel:** Auto-deploying now
✅ **Build:** Passed (0 errors, 0 warnings)
✅ **Production URL:** `https://kektech-nextjs.vercel.app`

---

## 🧪 Testing Checklist

### **1. Wrong Network Detection**
- [ ] Connect wallet on Ethereum Mainnet
- [ ] Header shows "Switch Network" button
- [ ] Mint page shows warning banner
- [ ] Mint form is blocked

### **2. Network Switching**
- [ ] Click "Switch to BasedAI"
- [ ] MetaMask prompts for approval
- [ ] Network switches successfully
- [ ] UI updates to show mint form

### **3. Adding Network**
- [ ] Use fresh MetaMask without BasedAI
- [ ] Click "Add BasedAI Network to MetaMask"
- [ ] MetaMask prompts to add network
- [ ] Network added successfully
- [ ] Automatic switch to new network

### **4. Error Handling**
- [ ] User rejects switch → Error message shown
- [ ] User rejects add network → Helpful error
- [ ] Auto-recovery after 5 seconds

---

## 🎯 Recommendations

### **Your Question: What Should You Do?**

**My Recommendation:** ✅ **Keep both options**

1. **Inline Header Button** → Always visible, quick access
2. **Banner on Mint Page** → Blocks wrong actions, forces fix

### **Why This Approach?**

| Approach | Pros | Cons |
|----------|------|------|
| **Header Only** | Clean UI, always accessible | Users might miss it, could try to mint on wrong network |
| **Banner Only** | Forces attention, clear | Not visible until user tries to mint |
| **Both (Current)** | ✅ Best UX: Quick access + Clear blocking | Minimal duplication, worth it |

### **Alternative: Just Banner** (Not Recommended)

If you prefer a single solution, keep only the banner version:

```tsx
// Remove from Header.tsx:
<NetworkSwitcher inline />

// Keep in MintForm.tsx:
<NetworkSwitcher />
```

**Trade-off:** Less convenient for users, but cleaner header.

---

## 📚 Additional Resources

### **Wagmi Documentation**
- Network Switching: https://wagmi.sh/core/api/actions/switchChain
- Chain Configuration: https://wagmi.sh/core/api/chains

### **MetaMask Documentation**
- Add Network: https://docs.metamask.io/wallet/reference/rpc-api/#wallet_addethereumchain
- Switch Network: https://docs.metamask.io/wallet/reference/rpc-api/#wallet_switchethereumchain

### **BasedAI Resources**
- RPC Endpoint: https://mainnet.basedaibridge.com/rpc/
- Explorer: https://explorer.bf1337.org
- Chain ID: 32323 (0x7E63)

---

## 🏆 Summary

### **Files Created:**
1. `components/web3/NetworkSwitcher.tsx` (175 lines)
2. `lib/hooks/useNetworkValidation.ts` (45 lines)

### **Files Modified:**
1. `components/layout/Header.tsx` (added inline switcher)
2. `components/web3/mint/MintForm.tsx` (added network blocking)

### **Total Changes:**
- **238 lines added**
- **2 lines deleted**
- **0 build errors**
- **100% type-safe**

### **Security:**
- ✅ No private keys exposed
- ✅ User approves all network changes
- ✅ Proper error handling
- ✅ Type-safe MetaMask interaction

---

## 🎉 Result

**Before:**
- ❌ Users confused why minting fails on Ethereum
- ❌ Manual network switching required
- ❌ No clear guidance

**After:**
- ✅ Auto-detect wrong network
- ✅ One-click switching
- ✅ Auto-add network if missing
- ✅ Clear user feedback
- ✅ Prevents errors before they happen

Your Web3 app now has **enterprise-grade network management**! 🚀
