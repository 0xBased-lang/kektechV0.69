#!/bin/bash
# KEKTECH 3.0 - Bulk Add Environment Variables to Vercel
# This script adds all environment variables from .env.local to Vercel

echo "🚀 Adding environment variables to Vercel..."
echo ""

# Function to add environment variable to all environments
add_env_var() {
  local name=$1
  local value=$2
  local envs=$3  # "production preview development" or "production preview"

  echo "Adding: $name"

  # Use printf to handle multi-line input for vercel env add
  printf "%s\n%s\n" "$value" "$envs" | vercel env add "$name"

  if [ $? -eq 0 ]; then
    echo "✅ Added $name"
  else
    echo "❌ Failed to add $name"
  fi
  echo ""
}

# Database URL (Production + Preview only - not development)
add_env_var "DATABASE_URL" \
  "postgresql://postgres:EzFYnauy1X44kXJW@db.cvablivsycsejtmlbheo.supabase.co:5432/postgres" \
  "production preview"

# Supabase Configuration (All environments)
add_env_var "NEXT_PUBLIC_SUPABASE_URL" \
  "https://cvablivsycsejtmlbheo.supabase.co" \
  "production preview development"

add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2YWJsaXZzeWNzZWp0bWxiaGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc4NTAsImV4cCI6MjA3ODI4Mzg1MH0.bREvRYMDfRLgQbDkyG1-bvO8d30m3SMzAvS6KSyH8_c" \
  "production preview development"

# Network Configuration (All environments)
add_env_var "NEXT_PUBLIC_CHAIN_ID" \
  "32323" \
  "production preview development"

add_env_var "NEXT_PUBLIC_RPC_URL" \
  "https://rpc.basedai.com" \
  "production preview development"

# Smart Contract Addresses (All environments)
add_env_var "NEXT_PUBLIC_VERSIONED_REGISTRY" \
  "0x67F8F023f6cFAe44353d797D6e0B157F2579301A" \
  "production preview development"

add_env_var "NEXT_PUBLIC_MARKET_FACTORY" \
  "0x3eaF643482Fe35d13DB812946E14F5345eb60d62" \
  "production preview development"

add_env_var "NEXT_PUBLIC_PARAMETER_STORAGE" \
  "0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8" \
  "production preview development"

add_env_var "NEXT_PUBLIC_ACCESS_CONTROL_MANAGER" \
  "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A" \
  "production preview development"

add_env_var "NEXT_PUBLIC_RESOLUTION_MANAGER" \
  "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0" \
  "production preview development"

add_env_var "NEXT_PUBLIC_REWARD_DISTRIBUTOR" \
  "0x3D274362423847B53E43a27b9E835d668754C96B" \
  "production preview development"

add_env_var "NEXT_PUBLIC_CURVE_REGISTRY" \
  "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70" \
  "production preview development"

add_env_var "NEXT_PUBLIC_PREDICTION_MARKET_TEMPLATE" \
  "0x1064f1FCeE5aA859468559eB9dC9564F0ef20111" \
  "production preview development"

add_env_var "NEXT_PUBLIC_MARKET_TEMPLATE_REGISTRY" \
  "0x420687494Dad8da9d058e9399cD401Deca17f6bd" \
  "production preview development"

# Explorer URL (All environments)
add_env_var "NEXT_PUBLIC_EXPLORER_URL" \
  "https://explorer.basedai.network" \
  "production preview development"

echo ""
echo "✅ All environment variables added to Vercel!"
echo ""
echo "Next step: Run 'vercel --prod' to deploy"
