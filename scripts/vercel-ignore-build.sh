#!/bin/bash

# Vercel Ignore Build Script
# This script determines if Vercel should build/deploy based on the branch

echo "🔍 Checking if build should proceed..."
echo "Branch: $VERCEL_GIT_COMMIT_REF"

# Only build main branch
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  echo "✅ Main branch - proceeding with build"
  exit 1  # Build (exit code 1 = build)
fi

# Ignore all other branches (including claude/* branches)
echo "⏭️  Non-main branch detected - skipping build"
echo "   (Vercel deployments only run on 'main' branch)"
exit 0  # Don't build (exit code 0 = skip)
