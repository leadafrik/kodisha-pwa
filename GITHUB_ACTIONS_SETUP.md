# AUTOMATED MONTHLY CREDENTIAL ROTATION - GitHub Actions Setup

**Status:** Ready to deploy ✓

Your credentials are now ready for automatic monthly rotation via GitHub Actions. Here's how to set it up:

## 3-Step Setup (5 minutes)

### Step 1: Authenticate with GitHub CLI

GitHub CLI needs to be installed on your machine. If you don't have it:
- **Windows (Chocolatey):** `choco install gh`
- **Windows (Scoop):** `scoop install gh`
- **Download:** https://cli.github.com

Check if installed:
```bash
gh --version
```

### Step 2: Run Setup Script

Run this PowerShell script:
```bash
.\setup-github-actions.ps1
```

It will:
1. Ask you to authenticate with GitHub (opens browser)
2. Automatically add your Render & Vercel credentials as GitHub Secrets
3. Optionally add MongoDB & Slack credentials

Takes **60 seconds**.

### Step 3: Verify in GitHub

1. Go to your repo on GitHub
2. Settings → **Secrets and variables** → **Actions**
3. You should see:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`
   - `VERCEL_TOKEN`
   - `VERCEL_PROJECT_ID`

**DONE!** Automatic rotation is now active.

---

## What Happens Automatically

**Every 1st of the month at 2 AM UTC:**
1. GitHub Actions triggers the workflow
2. Runs `node scripts/rotate-credentials-auto.js --execute`
3. All 7 credentials rotate:
   - JWT Secret
   - MongoDB password
   - Cloudinary secret
   - Twilio token
   - Africa's Talking key
   - Google OAuth secret
   - Facebook OAuth secret
4. Backups created in `.secrets-backup/`
5. Slack notification sent (if configured)
6. Logs stored in GitHub Actions

**You don't need to do anything.** Zero manual effort, zero human error.

---

## Manual Triggering

Want to rotate credentials outside the monthly schedule?

1. Go to your GitHub repo
2. **Actions** tab
3. **Rotate Credentials** workflow
4. **Run workflow** button
5. Choose dry-run or execute

Done in seconds.

---

## What Each Secret Does

| Secret | Purpose | Where It's Used |
|--------|---------|-----------------|
| `RENDER_API_KEY` | Updates backend env vars | Script calls Render API |
| `RENDER_SERVICE_ID` | Identifies which Render service | Script targets correct service |
| `VERCEL_TOKEN` | Updates frontend env vars | Script calls Vercel API |
| `VERCEL_PROJECT_ID` | Identifies which Vercel project | Script targets correct project |
| `MONGODB_ATLAS_PUBLIC_KEY` | Authenticates with MongoDB API | Optional: auto-rotate MongoDB |
| `SLACK_WEBHOOK_URL` | Sends status notifications | Optional: get updates on Slack |

---

## Security Notes

✓ **Secrets are encrypted** in GitHub (you can't see them after adding)  
✓ **Only used in Actions workflows** (not accessible from your machine)  
✓ **Rotation logs are private** (stored in your repo's Actions)  
✓ **Old credentials backed up** in `.secrets-backup/` before deletion  

---

## Troubleshooting

### Setup script won't run
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try again.

### "gh: command not found"
Install GitHub CLI: https://cli.github.com

### Workflow doesn't appear in Actions tab
Push your changes to GitHub:
```bash
git add .github/workflows/rotate-credentials.yml
git commit -m "Enable automatic credential rotation"
git push
```

### Want to test the workflow?
Go to **Actions** → **Rotate Credentials** → **Run workflow** → **dry_run: true**

---

## Next: Git History Sanitization

Your GitHub Actions is now set up! 

**Recommendation:** Before automating everything, sanitize your git history to remove the exposed credentials from all past commits. See `GIT_HISTORY_SANITIZATION.md` for details.

**Status:** ✓ Automatic rotation ready  
**Setup Time:** 5 minutes  
**Monthly Effort:** 0 minutes (fully automated)
