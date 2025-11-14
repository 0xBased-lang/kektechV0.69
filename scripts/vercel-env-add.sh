#!/bin/bash
# 🚀 Automated Vercel Environment Variables Setup
# Reads .env.local and adds all variables to Vercel production
# Last Updated: 2025-11-12

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env.local"
TOTAL_VARS=0
SUCCESS_COUNT=0
SKIP_COUNT=0
ERROR_COUNT=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🚀 Vercel Environment Variables Setup (Production)       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: .env.local not found at $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found .env.local${NC}"
echo -e "${BLUE}📋 Reading environment variables...${NC}"
echo ""

# Read .env.local and process each variable
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)

    # Skip if key is empty after trimming
    [[ -z "$key" ]] && continue

    # Remove quotes from value
    value=$(echo "$value" | sed 's/^"//' | sed 's/"$//')

    TOTAL_VARS=$((TOTAL_VARS + 1))

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Processing: ${NC}$key"

    # Add to Vercel (production environment)
    if printf "%s" "$value" | vercel env add "$key" production --force 2>&1 | tee /tmp/vercel-env-output.txt | grep -q "Created"; then
        echo -e "${GREEN}✅ Added: $key${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    elif grep -q "already exists" /tmp/vercel-env-output.txt; then
        echo -e "${YELLOW}⏭️  Skipped: $key (already exists)${NC}"
        SKIP_COUNT=$((SKIP_COUNT + 1))
    else
        echo -e "${RED}❌ Error adding: $key${NC}"
        cat /tmp/vercel-env-output.txt
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi

done < "$ENV_FILE"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   📊 Environment Variables Setup Summary                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "   Total Variables: ${BLUE}$TOTAL_VARS${NC}"
echo -e "   ${GREEN}✅ Successfully Added: $SUCCESS_COUNT${NC}"
echo -e "   ${YELLOW}⏭️  Skipped (Existing): $SKIP_COUNT${NC}"
echo -e "   ${RED}❌ Errors: $ERROR_COUNT${NC}"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCCESS! All environment variables processed!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Verify variables: ${YELLOW}vercel env ls${NC}"
    echo -e "  2. Trigger deployment from Vercel dashboard"
    echo -e "  3. Monitor build logs for success"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  WARNING: Some variables failed to add!${NC}"
    echo -e "${YELLOW}Please review errors above and add manually if needed.${NC}"
    echo ""
    exit 1
fi
