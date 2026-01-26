# GitHub Actions Secret Setup Script (PowerShell)
# Adds your credentials to GitHub Secrets for automatic rotation

Write-Host "GitHub Actions Automation Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if gh CLI is installed
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Host "ERROR: GitHub CLI (gh) is not installed" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com" -ForegroundColor Yellow
    exit 1
}

# Check if already authenticated
try {
    gh auth status *> $null
} catch {
    Write-Host "Please authenticate with GitHub:" -ForegroundColor Yellow
    gh auth login
}

Write-Host "Adding secrets to your GitHub repository..." -ForegroundColor Cyan
Write-Host ""

# Add Render credentials
Write-Host "Adding RENDER_API_KEY..." -ForegroundColor Yellow
"rnd_3tWOXI4iy4KQ9e58W0lM2D0QqdrA" | gh secret set RENDER_API_KEY

Write-Host "Adding RENDER_SERVICE_ID..." -ForegroundColor Yellow
"srv-d4b9dler433s7397ov1g" | gh secret set RENDER_SERVICE_ID

# Add Vercel credentials
Write-Host "Adding VERCEL_TOKEN..." -ForegroundColor Yellow
$vercelToken = Read-Host "Enter your VERCEL_TOKEN (get from https://vercel.com/account/tokens)"
$vercelToken | gh secret set VERCEL_TOKEN

Write-Host "Adding VERCEL_PROJECT_ID..." -ForegroundColor Yellow
$vercelProjectId = Read-Host "Enter your VERCEL_PROJECT_ID (get from Vercel project settings)"
$vercelProjectId | gh secret set VERCEL_PROJECT_ID

Write-Host ""
Write-Host "Optional: Would you like to add optional secrets? (y/n)" -ForegroundColor Cyan
$addOptional = Read-Host

if ($addOptional -eq "y" -or $addOptional -eq "Y") {
    Write-Host "Adding SLACK_WEBHOOK_URL (optional)..." -ForegroundColor Yellow
    $slackHook = Read-Host "Enter your Slack Webhook URL (or press Enter to skip)"
    if ($slackHook) {
        $slackHook | gh secret set SLACK_WEBHOOK_URL
    }
}

Write-Host ""
Write-Host "Secrets added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository"
Write-Host "2. Settings -> Secrets and variables -> Actions"
Write-Host "3. Verify all secrets are there"
Write-Host "4. The workflow will automatically run on the 1st of each month at 2 AM UTC"
Write-Host ""
Write-Host "To manually trigger rotation:" -ForegroundColor Yellow
Write-Host "  Go to Actions -> Rotate Credentials -> Run workflow"
