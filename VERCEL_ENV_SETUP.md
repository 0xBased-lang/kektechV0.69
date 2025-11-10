# Vercel Environment Variables - Copy & Paste Guide

**Last Updated**: 2025-11-10 (Single project setup)
**Production URL**: https://kektech-frontend.vercel.app
**Dashboard URL**: https://vercel.com/kektech1/kektech-frontend/settings/environment-variables

**Note**: All environment variables have been configured via CLI. This document serves as reference.

**Instructions**:
1. Go to dashboard URL above
2. Click "Add New" for each variable
3. Copy Name and Value exactly as shown below
4. Select: ✅ Production, ✅ Preview, ❌ Development (except as noted)
5. Click "Save"

---

## 1. DATABASE_URL

**Name**: `DATABASE_URL`

**Value**:
```
postgresql://postgres:EzFYnauy1X44kXJW@db.cvablivsycsejtmlbheo.supabase.co:5432/postgres
```

**Environments**: ✅ Production, ✅ Preview, ❌ Development

---

## 2. NEXT_PUBLIC_SUPABASE_URL

**Name**: `NEXT_PUBLIC_SUPABASE_URL`

**Value**:
```
https://cvablivsycsejtmlbheo.supabase.co
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 3. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Value**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2YWJsaXZzeWNzZWp0bWxiaGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc4NTAsImV4cCI6MjA3ODI4Mzg1MH0.bREvRYMDfRLgQbDkyG1-bvO8d30m3SMzAvS6KSyH8_c
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 4. NEXT_PUBLIC_CHAIN_ID

**Name**: `NEXT_PUBLIC_CHAIN_ID`

**Value**:
```
32323
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 5. NEXT_PUBLIC_RPC_URL

**Name**: `NEXT_PUBLIC_RPC_URL`

**Value**:
```
https://mainnet.basedaibridge.com/rpc/
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 6. NEXT_PUBLIC_VERSIONED_REGISTRY

**Name**: `NEXT_PUBLIC_VERSIONED_REGISTRY`

**Value**:
```
0x67F8F023f6cFAe44353d797D6e0B157F2579301A
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 7. NEXT_PUBLIC_MARKET_FACTORY

**Name**: `NEXT_PUBLIC_MARKET_FACTORY`

**Value**:
```
0x3eaF643482Fe35d13DB812946E14F5345eb60d62
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 8. NEXT_PUBLIC_PARAMETER_STORAGE

**Name**: `NEXT_PUBLIC_PARAMETER_STORAGE`

**Value**:
```
0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 9. NEXT_PUBLIC_ACCESS_CONTROL_MANAGER

**Name**: `NEXT_PUBLIC_ACCESS_CONTROL_MANAGER`

**Value**:
```
0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 10. NEXT_PUBLIC_RESOLUTION_MANAGER

**Name**: `NEXT_PUBLIC_RESOLUTION_MANAGER`

**Value**:
```
0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 11. NEXT_PUBLIC_REWARD_DISTRIBUTOR

**Name**: `NEXT_PUBLIC_REWARD_DISTRIBUTOR`

**Value**:
```
0x3D274362423847B53E43a27b9E835d668754C96B
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 12. NEXT_PUBLIC_CURVE_REGISTRY

**Name**: `NEXT_PUBLIC_CURVE_REGISTRY`

**Value**:
```
0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 13. NEXT_PUBLIC_PREDICTION_MARKET_TEMPLATE

**Name**: `NEXT_PUBLIC_PREDICTION_MARKET_TEMPLATE`

**Value**:
```
0x1064f1FCeE5aA859468559eB9dC9564F0ef20111
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 14. NEXT_PUBLIC_MARKET_TEMPLATE_REGISTRY

**Name**: `NEXT_PUBLIC_MARKET_TEMPLATE_REGISTRY`

**Value**:
```
0x420687494Dad8da9d058e9399cD401Deca17f6bd
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 15. NEXT_PUBLIC_EXPLORER_URL

**Name**: `NEXT_PUBLIC_EXPLORER_URL`

**Value**:
```
https://explorer.basedai.network
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 16. NEXT_PUBLIC_WS_URL

**Name**: `NEXT_PUBLIC_WS_URL`

**Value**:
```
wss://ws.kektech.xyz/ws
```

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## Verification

After adding all 16 variables, run from `packages/frontend/`:

```bash
cd packages/frontend
vercel env ls
```

You should see all 16 environment variables listed.

---

## Next Steps

Once all variables are set, we'll:

1. Test local production build
2. Deploy to Vercel production
3. Test deployed site

---

**Time Required**: ~15 minutes to add all variables
**Status**: Ready to proceed when you complete this step
