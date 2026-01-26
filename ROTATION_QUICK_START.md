# QUICK START - FULLY AUTOMATED CREDENTIAL ROTATION

**TL;DR:** You already have all credentials in `.env`. Just run one command.

## 3-Step Setup

### Step 1: Prepare Configuration (2 minutes)
```bash
# Copy the template
cp .env.rotation.example .env.rotation

# Optional: Add API keys for Render, Vercel, Slack
# (Not required - script will warn you which ones are missing)
```

### Step 2: Test It (2 minutes)
```bash
# See what would be rotated (no changes made)
node scripts/rotate-credentials-auto.js
```

Output shows:
```
JWT Secret generated
MongoDB credentials rotated via Atlas API
Cloudinary secret regenerated via API
...
```

### Step 3: Execute (5 minutes)
```bash
# Actually rotate all credentials
node scripts/rotate-credentials-auto.js --execute
```

Script will:
- Generate new credentials for all services
- Backup old ones in `.secrets-backup/`
- Update Render and Vercel automatically
- Run health checks
- Notify you on Slack (if configured)

**DONE.** All credentials rotated, no manual steps.

---

## What Gets Automated

✓ MongoDB - New password generated and deployed  
✓ Cloudinary - New API secret generated and deployed  
✓ Twilio - New auth token generated and deployed  
✓ Africa's Talking - New API key generated and deployed  
✓ Google OAuth - New client secret  
✓ Facebook OAuth - New app secret  
✓ JWT Secret - New signing key  
✓ Render - All env vars updated  
✓ Vercel - All env vars updated  
✓ Backups - Old credentials saved automatically  
✓ Health checks - Verification everything works  
✓ Notifications - Slack message with status  

**Zero manual logins needed.**

---

## Configuration (Optional)

To enable all features, add to `.env.rotation`:

```bash
# For Render auto-deployment
RENDER_API_KEY=xxx
RENDER_SERVICE_ID=xxx

# For Vercel auto-deployment
VERCEL_TOKEN=xxx
VERCEL_PROJECT_ID=xxx

# For Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# For automatic MongoDB rotation via API
MONGODB_ATLAS_PUBLIC_KEY=xxx
MONGODB_ATLAS_PRIVATE_KEY=xxx
MONGODB_PROJECT_ID=xxx
```

Script will tell you which ones are missing and still works without them.

---

## Emergency Recovery

If anything goes wrong:
```bash
ls -la .secrets-backup/
```

See `ROLLBACK.md` for full recovery procedures.

---

## Automatic Monthly Rotation (Optional)

GitHub Actions can run this automatically on the 1st of each month:

1. Add above credentials as GitHub Secrets
2. Workflow `.github/workflows/rotate-credentials.yml` runs automatically
3. Check your Slack for status

**Optional** - Script works fine run manually whenever you want.

---

**Questions?**
- See `AUTOMATED_ROTATION_GUIDE.md` for detailed explanation
- See `ROLLBACK.md` if you need emergency recovery
- Script output shows exactly what happened
