#!/bin/bash

# install-hooks.sh
# Automated installation of git hooks
# Usage: ./scripts/hooks/install-hooks.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${GREEN}🪝 Git Hooks Installation${NC}"
echo ""

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ ERROR: No .git directory found${NC}"
    echo ""
    echo "This project is not a git repository."
    echo ""
    echo "Initialize git first:"
    echo "  git init"
    echo "  git remote add origin <your-repo-url>"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Git repository detected${NC}"
echo ""

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
echo -e "${YELLOW}Installing pre-commit hook...${NC}"

if [ -f ".git/hooks/pre-commit" ]; then
    echo -e "${YELLOW}⚠️  Pre-commit hook already exists${NC}"
    echo ""
    read -p "Overwrite? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping pre-commit hook installation${NC}"
        exit 0
    fi
fi

# Copy hook
cp scripts/hooks/pre-commit .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

echo -e "${GREEN}✅ Pre-commit hook installed${NC}"
echo ""

# Verify installation
if [ -x ".git/hooks/pre-commit" ]; then
    echo -e "${GREEN}✅ Hook is executable${NC}"
    echo ""
    echo "Hook installed at: .git/hooks/pre-commit"
    echo ""
    echo -e "${YELLOW}Test the hook:${NC}"
    echo "  1. Modify a file: echo '// test' >> contracts/core/VersionedRegistry.sol"
    echo "  2. Stage changes: git add contracts/core/VersionedRegistry.sol"
    echo "  3. Try commit: git commit -m 'test'"
    echo "  4. Expected: Hook runs and shows validation results"
    echo ""
    echo -e "${GREEN}Installation complete!${NC}"
    echo ""
else
    echo -e "${RED}❌ ERROR: Hook is not executable${NC}"
    echo ""
    echo "Manually fix:"
    echo "  chmod +x .git/hooks/pre-commit"
    echo ""
    exit 1
fi

exit 0
