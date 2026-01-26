#!/bin/bash

# GitHub Actions Secret Setup Script
# This automates adding your credentials to GitHub Secrets
# So the rotation workflow can run automatically

set -e

echo "GitHub Actions Automation Setup"
echo "================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "ERROR: GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com"
    exit 1
fi

# Check if already authenticated
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub:"
    gh auth login
fi

echo "Adding secrets to your GitHub repository..."
echo ""

# Add Render credentials
echo "Adding RENDER_API_KEY..."
gh secret set RENDER_API_KEY --body "rnd_3tWOXI4iy4KQ9e58W0lM2D0QqdrA"

echo "Adding RENDER_SERVICE_ID..."
gh secret set RENDER_SERVICE_ID --body "srv-d4b9dler433s7397ov1g"

# Add Vercel credentials
echo "Adding VERCEL_TOKEN..."
echo "Enter your VERCEL_TOKEN (get from https://vercel.com/account/tokens):"
read VERCEL_TOKEN
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"

echo "Adding VERCEL_PROJECT_ID..."
echo "Enter your VERCEL_PROJECT_ID (get from Vercel project settings):"
read VERCEL_PROJECT_ID
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"

# Optional: Add optional secrets
echo ""
echo "Optional: Would you like to add optional secrets? (y/n)"
read -r add_optional

if [ "$add_optional" = "y" ] || [ "$add_optional" = "Y" ]; then
    echo "Adding MONGODB_ATLAS_PUBLIC_KEY..."
    read -rp "Enter your MongoDB Atlas Public Key (or press Enter to skip): " mongo_pub
    if [ -n "$mongo_pub" ]; then
        gh secret set MONGODB_ATLAS_PUBLIC_KEY --body "$mongo_pub"
    fi

    echo "Adding MONGODB_ATLAS_PRIVATE_KEY..."
    read -rp "Enter your MongoDB Atlas Private Key (or press Enter to skip): " mongo_priv
    if [ -n "$mongo_priv" ]; then
        gh secret set MONGODB_ATLAS_PRIVATE_KEY --body "$mongo_priv"
    fi

    echo "Adding SLACK_WEBHOOK_URL..."
    read -rp "Enter your Slack Webhook URL (or press Enter to skip): " slack_hook
    if [ -n "$slack_hook" ]; then
        gh secret set SLACK_WEBHOOK_URL --body "$slack_hook"
    fi
fi

echo ""
echo "✓ Secrets added successfully!"
echo ""
echo "Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Verify all secrets are there"
echo "4. The workflow will automatically run on the 1st of each month at 2 AM UTC"
echo ""
echo "To manually trigger rotation:"
echo "  Go to Actions → Rotate Credentials → Run workflow"
