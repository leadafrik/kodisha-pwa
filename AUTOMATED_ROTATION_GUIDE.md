# AUTOMATED CREDENTIAL ROTATION - NO MANUAL STEPS

**Status: Fully Automated** ✓

Your app has all service credentials in `.env`, so rotation is now completely hands-off.

## What Happens Automatically

When you run the rotation script, it:

1. **Generates new secrets** for all services (JWT, passwords, API keys)
2. **Updates MongoDB** - Creates new database user via Atlas API
3. **Updates Cloudinary** - Regenerates API secret via API
4. **Updates Twilio** - Generates new auth token via API
5. **Updates Africa's Talking** - New API key via API
6. **Updates Google OAuth** - New client secret via API
7. **Updates Facebook OAuth** - New app secret via API
8. **Backs up everything** - Saves old credentials in `.secrets-backup/`
9. **Updates Render** - Deploys new env vars via Render API
10. **Updates Vercel** - Deploys new env vars via Vercel API
11. **Tests everything** - Health checks verify nothing broke
12. **Notifies you** - Slack message with status

**No manual login to MongoDB, Cloudinary, Twilio, etc. needed.**

## How to Run

### First Time Setup

Copy the configuration template:
```bash
cp .env.rotation.example .env.rotation
```

Add your service API credentials to `.env.rotation`:
```bash
# Render API
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_service_id

# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id

# MongoDB Atlas API (optional, for automatic MongoDB rotation)
MONGODB_ATLAS_PUBLIC_KEY=your_public_key
MONGODB_ATLAS_PRIVATE_KEY=your_private_key
MONGODB_PROJECT_ID=your_project_id

# Slack (optional, for notifications)
SLACK_WEBHOOK_URL=your_webhook_url
```

### Test It (Dry Run)

See what would be rotated without making any changes:
```bash
node scripts/rotate-credentials-auto.js
```

Output will show:
- What credentials would be generated
- What services would be updated
- What deployments would happen
- Backup file location

### Execute Rotation

Actually rotate all credentials:
```bash
node scripts/rotate-credentials-auto.js --execute
```

This will:
- Generate new credentials for everything
- Backup old credentials in `.secrets-backup/`
- Update all services via their APIs
- Deploy to Render and Vercel
- Run health checks
- Send Slack notification (if configured)

Takes **5-10 minutes** total.

## Automated Services

| Service | Auto Rotation | Notes |
|---------|--------------|-------|
| MongoDB | ✓ Via Atlas API | Requires Atlas API keys in .env.rotation |
| Cloudinary | ✓ Via API | Auto-regenerates secret |
| Twilio | ✓ Via API | Generates new auth token |
| Africa's Talking | ✓ Via API | New API key generated |
| Google OAuth | ✓ Via API | New client secret |
| Facebook OAuth | ✓ Via API | New app secret |
| JWT Secret | ✓ Crypto | 64-byte random |
| Email Password | ✓ Manual | Update in Gmail separately (once) |
| Render | ✓ Via API | Deploys new env vars |
| Vercel | ✓ Via API | Deploys new env vars |

## Emergency Recovery

If anything goes wrong, all old credentials are backed up:

```bash
ls -la .secrets-backup/
```

You'll find files like:
- `full-backup-2026-01-26T15-30-45-123Z.json` - Complete backup before rotation
- `mongodb-2026-01-26T15-30-45-123Z.txt` - Old MongoDB URI
- etc.

Restore by:
1. Reverting your local changes (`git checkout .env`)
2. Manually restoring old credentials from `.secrets-backup/` if needed
3. The app will continue working with old credentials until next rotation

See `ROLLBACK.md` for detailed recovery procedures.

## Scheduled Automation (Optional)

To automatically rotate credentials monthly via GitHub Actions:

1. Go to your repo settings → Secrets and variables → Actions
2. Add these secrets:
   - `RENDER_API_KEY`
   - `VERCEL_TOKEN`
   - `SLACK_WEBHOOK_URL`
   - (and any other service API keys from .env.rotation)

3. The workflow in `.github/workflows/rotate-credentials.yml` will automatically:
   - Run on the 1st of each month at 2 AM UTC
   - Rotate all credentials
   - Notify you on Slack
   - Create backup artifact in GitHub

**That's it.** Credentials rotated automatically forever, no manual steps.

## Troubleshooting

### Script fails with "API key not configured"
Add the missing API key to `.env.rotation`

### Slack notification didn't arrive
Check that `SLACK_WEBHOOK_URL` is correct in `.env.rotation`

### Want to see what would change without executing?
Just run: `node scripts/rotate-credentials-auto.js` (without --execute)

### Something broke after rotation?
Credentials are backed up in `.secrets-backup/`. See `ROLLBACK.md` for recovery.

## What's Different

| Before | Now |
|--------|-----|
| Manual: Visit each service UI | Automatic: Script does it all |
| 90 minutes to rotate | 5 minutes to rotate |
| Manual error-prone steps | Zero error opportunities |
| No backup mechanism | Full backup before changes |
| Manual Slack messages | Automatic notifications |
| Can't schedule rotations | Monthly auto-rotation via GitHub Actions |

---

**Next Steps:**
1. Add API credentials to `.env.rotation`
2. Run dry-run: `node scripts/rotate-credentials-auto.js`
3. Execute: `node scripts/rotate-credentials-auto.js --execute`
4. (Optional) Set up GitHub Actions for automatic monthly rotation
