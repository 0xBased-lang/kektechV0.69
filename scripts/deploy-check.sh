#!/bin/bash
# 🔒 100% Bulletproof Vercel Deployment Check
# Ensures we ALWAYS deploy to the correct project

set -e

CORRECT_PROJECT="kektech-frontend"
CORRECT_PROJECT_ID="prj_mvm9I469CQJutmYd7mM7Ep2LqXgA"

echo ""
echo "🔍 Verifying Vercel project link..."
echo ""

# Check if .vercel exists
if [ ! -f ".vercel/project.json" ]; then
  echo "🚨 ERROR: Not linked to Vercel project!"
  echo ""
  echo "Fix: vercel link --project=kektech-frontend --scope=kektech1 --yes"
  echo ""
  exit 1
fi

# Extract project info
CURRENT_PROJECT=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
CURRENT_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)

echo "Current Project: $CURRENT_PROJECT"
echo "Current Project ID: $CURRENT_PROJECT_ID"
echo ""

# Verify correct project name
if [ "$CURRENT_PROJECT" != "$CORRECT_PROJECT" ]; then
  echo "🚨 ERROR: Wrong project linked!"
  echo ""
  echo "Expected: $CORRECT_PROJECT"
  echo "Current:  $CURRENT_PROJECT"
  echo ""
  echo "Fix: rm -rf .vercel && vercel link --project=kektech-frontend --scope=kektech1 --yes"
  echo ""
  exit 1
fi

# Verify correct project ID
if [ "$CURRENT_PROJECT_ID" != "$CORRECT_PROJECT_ID" ]; then
  echo "🚨 ERROR: Wrong project ID!"
  echo ""
  echo "Expected: $CORRECT_PROJECT_ID"
  echo "Current:  $CURRENT_PROJECT_ID"
  echo ""
  echo "Fix: rm -rf .vercel && vercel link --project=kektech-frontend --scope=kektech1 --yes"
  echo ""
  exit 1
fi

echo "✅ Verified: Deploying to $CORRECT_PROJECT"
echo "✅ Project ID: $CORRECT_PROJECT_ID"
echo "✅ Safe to deploy!"
echo ""
exit 0
