# Vercel Environment Variables - Quick Setup Guide

Copy and paste these into your Vercel Dashboard:
**Dashboard URL**: https://vercel.com/kektech1/kektech-frontend/settings/environment-variables

---

## Instructions

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click "Add New" for each variable below
3. Copy the **Name** and **Value** exactly as shown
4. Select environments as specified
5. Click "Save"

---

## Variables to Add (21 total)

### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `[REDACTED - Get from secure storage or team lead]`
- **Environments**: ✅ Production, ✅ Preview, ❌ Development

---

### 2. NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://[your-project-id].supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `[Your Supabase anon key - safe to expose with RLS]`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 4. NEXT_PUBLIC_CHAIN_ID
- **Name**: `NEXT_PUBLIC_CHAIN_ID`
- **Value**: `32323`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 5. NEXT_PUBLIC_RPC_URL
- **Name**: `NEXT_PUBLIC_RPC_URL`
- **Value**: `https://rpc.basedai.com`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 6. NEXT_PUBLIC_VERSIONED_REGISTRY
- **Name**: `NEXT_PUBLIC_VERSIONED_REGISTRY`
- **Value**: `0x67F8F023f6cFAe44353d797D6e0B157F2579301A`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 7. NEXT_PUBLIC_MARKET_FACTORY
- **Name**: `NEXT_PUBLIC_MARKET_FACTORY`
- **Value**: `0x3eaF643482Fe35d13DB812946E14F5345eb60d62`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 8. NEXT_PUBLIC_PARAMETER_STORAGE
- **Name**: `NEXT_PUBLIC_PARAMETER_STORAGE`
- **Value**: `0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 9. NEXT_PUBLIC_ACCESS_CONTROL_MANAGER
- **Name**: `NEXT_PUBLIC_ACCESS_CONTROL_MANAGER`
- **Value**: `0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 10. NEXT_PUBLIC_RESOLUTION_MANAGER
- **Name**: `NEXT_PUBLIC_RESOLUTION_MANAGER`
- **Value**: `0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 11. NEXT_PUBLIC_REWARD_DISTRIBUTOR
- **Name**: `NEXT_PUBLIC_REWARD_DISTRIBUTOR`
- **Value**: `0x3D274362423847B53E43a27b9E835d668754C96B`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 12. NEXT_PUBLIC_CURVE_REGISTRY
- **Name**: `NEXT_PUBLIC_CURVE_REGISTRY`
- **Value**: `0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 13. NEXT_PUBLIC_PREDICTION_MARKET_TEMPLATE
- **Name**: `NEXT_PUBLIC_PREDICTION_MARKET_TEMPLATE`
- **Value**: `0x1064f1FCeE5aA859468559eB9dC9564F0ef20111`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 14. NEXT_PUBLIC_MARKET_TEMPLATE_REGISTRY
- **Name**: `NEXT_PUBLIC_MARKET_TEMPLATE_REGISTRY`
- **Value**: `0x420687494Dad8da9d058e9399cD401Deca17f6bd`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 15. NEXT_PUBLIC_EXPLORER_URL
- **Name**: `NEXT_PUBLIC_EXPLORER_URL`
- **Value**: `https://explorer.basedai.network`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 16. NEXT_PUBLIC_WS_URL
- **Name**: `NEXT_PUBLIC_WS_URL`
- **Value**: `wss://ws.kektech.xyz/ws`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- **Purpose**: WebSocket connection for real-time market updates

---

### 17. NEXT_PUBLIC_METADATA_API
- **Name**: `NEXT_PUBLIC_METADATA_API`
- **Value**: `https://kektech.xyz/api/metadata`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 18. NEXT_PUBLIC_RANKING_API
- **Name**: `NEXT_PUBLIC_RANKING_API`
- **Value**: `https://api.kektech.xyz`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 19. NEXT_PUBLIC_CONTRACT_ADDRESS
- **Name**: `NEXT_PUBLIC_CONTRACT_ADDRESS`
- **Value**: `0x40B6184b901334C0A88f528c1A0a1de7a77490f1`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 20. NEXT_PUBLIC_APP_URL
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://kektech-frontend.vercel.app` (Production) / `http://localhost:3000` (Development)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 21. NEXT_PUBLIC_REOWN_PROJECT_ID
- **Name**: `NEXT_PUBLIC_REOWN_PROJECT_ID`
- **Value**: `[Your Reown / WalletConnect Cloud project ID]`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## Server-side Only Variables

Add these to Vercel with _Server_ exposure only (Default permission). They must never be exposed to the client.

### SUPABASE_SERVICE_KEY
- **Name**: `SUPABASE_SERVICE_KEY`
- **Value**: `[Supabase service_role key from Settings → API]`
- **Environments**: ✅ Production, ✅ Preview, ❌ Development
- **Purpose**: Required for SIWE auth and admin actions.

---

### UPSTASH_REDIS_REST_URL
- **Name**: `UPSTASH_REDIS_REST_URL`
- **Value**: `[Your Upstash REST endpoint URL]`
- **Environments**: ✅ Production, ✅ Preview, (optional) ✅ Development
- **Purpose**: Enables global rate limiting. Leave blank to fallback to in-memory limits while developing.

---

### UPSTASH_REDIS_REST_TOKEN
- **Name**: `UPSTASH_REDIS_REST_TOKEN`
- **Value**: `[Matching Upstash REST token]`
- **Environments**: ✅ Production, ✅ Preview, (optional) ✅ Development

---

## Verification

After adding all variables, run:
```bash
vercel env ls
```

You should see all 21 public variables listed (plus the server-only entries if you added them).

---

## Next Steps

Once all variables are added:
```bash
vercel --prod
```

This will deploy to production with all environment variables configured!
