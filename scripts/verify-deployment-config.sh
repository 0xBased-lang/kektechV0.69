#!/bin/bash
set -e

CORRECT_PROJECT_ID="prj_xYbdi0E0eJ1amYm3DAPknR1gWUxR"
CORRECT_ORG_ID="team_zqPDYGyB2bI1MwE8G5zfVOGB"
CORRECT_PROJECT_NAME="kektech-frontend"

echo "🔍 Verifying Vercel deployment configuration..."
echo ""

# Verify root .vercel config
echo "1️⃣ Checking .vercel/project.json..."
if [ -f ".vercel/project.json" ]; then
    ROOT_PROJECT_ID=$(grep -o 'prj_[^"]*' .vercel/project.json)
    ROOT_PROJECT_NAME=$(grep -o '"projectName":"[^"]*"' .vercel/project.json | cut -d'"' -f4)

    if [ "$ROOT_PROJECT_ID" != "$CORRECT_PROJECT_ID" ]; then
        echo "   ❌ ERROR: .vercel/project.json has wrong project ID!"
        echo "   Found: $ROOT_PROJECT_ID"
        echo "   Expected: $CORRECT_PROJECT_ID"
        exit 1
    fi

    if [ "$ROOT_PROJECT_NAME" != "$CORRECT_PROJECT_NAME" ]; then
        echo "   ⚠️  WARNING: .vercel/project.json has unexpected project name"
        echo "   Found: $ROOT_PROJECT_NAME"
        echo "   Expected: $CORRECT_PROJECT_NAME"
    fi

    echo "   ✅ Config correct: $ROOT_PROJECT_NAME ($ROOT_PROJECT_ID)"
else
    echo "   ❌ ERROR: .vercel/project.json not found!"
    echo "   Run 'vercel link' from the repository root to create it."
    exit 1
fi
echo ""

echo "✅ ✅ ✅  All deployment configuration verified successfully!"
echo ""
echo "📍 You will deploy to:"
echo "   Project: $CORRECT_PROJECT_NAME"
echo "   Project ID: $CORRECT_PROJECT_ID"
echo ""
exit 0
