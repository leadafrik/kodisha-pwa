#!/bin/bash

# Pre-commit Hook: Prevent Accidental Credential Commits
# Install: cp pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# Test: git commit -m "test" --allow-empty (should pass)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Credentials to check for
FORBIDDEN_PATTERNS=(
    "mongodb.*@"           # MongoDB connection strings
    "jwt['\"]?:['\"]"      # JWT secrets
    "api[_-]?secret"       # API secrets
    "api[_-]?key['\"]"     # API keys  
    "password['\"]?:['\"]" # Password assignments
    "auth[_-]?token"       # Auth tokens
    "secret[_-]?key"       # Secret keys
    "private[_-]?key"      # Private keys
)

# Files that should never be committed
FORBIDDEN_FILES=(
    "\.env$"
    "\.env\.[a-z]+$"
    "secrets\.json"
    "config/secrets"
    "credentials\.txt"
)

echo "🔒 Running pre-commit security checks..."

# Check if .env files are being committed
echo "Checking for .env files..."
if git diff --cached --name-only | grep -E "\.env|secrets\.json|credentials" > /dev/null; then
    echo ""
    echo -e "${RED}❌ ERROR: Secret files should not be committed${NC}"
    echo ""
    echo "Files that would be committed:"
    git diff --cached --name-only | grep -E "\.env|secrets\.json|credentials" | sed 's/^/  /'
    echo ""
    echo "These files should be in .gitignore:"
    echo "  .env"
    echo "  .env.*"
    echo "  secrets.json"
    echo "  credentials.txt"
    echo ""
    echo "To fix:"
    echo "  1. git reset HEAD .env .env.* secrets.json"
    echo "  2. Add these patterns to .gitignore"
    echo "  3. git commit (try again)"
    echo ""
    exit 1
fi

# Check for exposed credentials in the actual code
echo "Checking for exposed credentials in code..."
FOUND_CREDENTIALS=0

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    if git diff --cached | grep -iE "$pattern" > /dev/null; then
        echo -e "${RED}⚠️  Pattern detected: $pattern${NC}"
        
        # Show the lines with context
        echo "Matches found:"
        git diff --cached | grep -iEB 2 "$pattern" | head -20
        
        FOUND_CREDENTIALS=1
    fi
done

if [ $FOUND_CREDENTIALS -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ ERROR: Possible credentials detected${NC}"
    echo ""
    echo "You are about to commit code containing sensitive information!"
    echo ""
    echo "If this is a false positive:"
    echo "  1. Review the code - is it really a secret?"
    echo "  2. If not: Update the patterns in pre-commit-hook.sh"
    echo "  3. If yes: Remove the secret and use environment variables"
    echo ""
    echo "To override (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

# Check for large files that shouldn't be committed
echo "Checking file sizes..."
LARGE_FILES=$(git diff --cached --name-only | while read file; do
    size=$(git diff --cached "$file" | wc -c)
    if [ $size -gt 5242880 ]; then # 5MB
        echo "  $file ($(($size / 1024 / 1024))MB)"
    fi
done)

if [ ! -z "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Large files detected:${NC}"
    echo "$LARGE_FILES"
    echo ""
    echo "These files may slow down the repository."
    echo "Consider using: git lfs (Large File Storage)"
    echo ""
fi

# Success
echo -e "${GREEN}✓ Pre-commit checks passed${NC}"
echo ""
exit 0
