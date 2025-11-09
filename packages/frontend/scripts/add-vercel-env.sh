#!/bin/bash
# Add environment variables to Vercel via CLI
# This script automates the interactive prompts

set -e

echo "🚀 Adding environment variables to Vercel..."
echo ""

# Function to add env var
add_env() {
    local name=$1
    local value=$2
    local envs=$3  # "Production Preview Development" or "Production Preview"

    echo "Adding: $name"

    # Use expect-style input with printf
    printf "%s\n%s\n" "$value" "$envs" | vercel env add "$name" 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Added $name"
    else
        echo "⚠️  $name may already exist or failed"
    fi
    echo ""
}

# 1. DATABASE_URL (Production + Preview only)
add_env "DATABASE_URL" \
    "postgresql://postgres:EzFYnauy1X44kXJW@db.cvablivsycsejtmlbheo.supabase.co:5432/postgres" \
    "Production Preview"

# 2. NEXT_PUBLIC_SUPABASE_URL (All)
add_env "NEXT_PUBLIC_SUPABASE_URL" \
    "https://cvablivsycsejtmlbheo.supabase.co" \
    "Production Preview Development"

# 3. NEXT_PUBLIC_SUPABASE_ANON_KEY (All)
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2YWJsaXZzeWNzZWp0bWxiaGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc4NTAsImV4cCI6MjA3ODI4Mzg1MH0.bREvRYMDfRLgQbDkyG1-bvO8d30m3SMzAvS6KSyH8_c" \
    "Production Preview Development"

# 4. NEXT_PUBLIC_CHAIN_ID (All)
add_env "NEXT_PUBLIC_CHAIN_ID" \
    "32323" \
    "Production Preview Development"

# 5. NEXT_PUBLIC_RPC_URL (All)
add_env "NEXT_PUBLIC_RPC_URL" \
    "https://rpc.basedai.com" \
    "Production Preview Development"

# 6-14. Contract addresses (All)
add_env "NEXT_PUBLIC_VERSIONED_REGISTRY" \
    "0x67F8F023f6cFAe44353d797D6e0B157F2579301A" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_MARKET_FACTORY" \
    "0x3eaF643482Fe35d13DB812946E14F5345eb60d62" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_PARAMETER_STORAGE" \
    "0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_ACCESS_CONTROL_MANAGER" \
    "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_RESOLUTION_MANAGER" \
    "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_REWARD_DISTRIBUTOR" \
    "0x3D274362423847B53E43a27b9E835d668754C96B" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_CURVE_REGISTRY" \
    "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_PREDICTION_MARKET_TEMPLATE" \
    "0x1064f1FCeE5aA859468559eB9dC9564F0ef20111" \
    "Production Preview Development"

add_env "NEXT_PUBLIC_MARKET_TEMPLATE_REGISTRY" \
    "0x420687494Dad8da9d058e9399cD401Deca17f6bd" \
    "Production Preview Development"

# 15. Explorer URL (All)
add_env "NEXT_PUBLIC_EXPLORER_URL" \
    "https://explorer.basedai.network" \
    "Production Preview Development"

echo ""
echo "✅ All environment variables added!"
echo ""
echo "Verifying..."
vercel env ls
echo ""
echo "Next: Vercel will auto-redeploy. Monitor with: vercel logs --follow"
