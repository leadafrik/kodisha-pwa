# 🚨 Emergency Rollback Guide

**If something goes wrong during credential rotation, follow these steps IMMEDIATELY.**

---

## Quick Facts

- **Time to rollback:** 5-10 minutes
- **User impact:** Temporary (backend will be down briefly)
- **Data loss:** NONE - We have backups

---

## Scenario 1: Backend Won't Start After Rotation

**Symptoms:**
- Backend keeps crashing with "connection refused" errors
- Logs show "Authentication failed" for MongoDB
- Frontend can't reach API

**Solution - 5 minutes:**

### Step 1: Use Backup Credentials (2 minutes)

We save old credentials in `.secrets-backup/` directory (encrypted locally).

```bash
# List available backups
ls -la .secrets-backup/

# Find the most recent backup BEFORE rotation
# File format: rotation-1234567890.json

# Open the file and extract old credentials
cat .secrets-backup/rotation-TIMESTAMP.json
```

### Step 2: Restore Old MongoDB Password (2 minutes)

```bash
# 1. Go to MongoDB Atlas: https://cloud.mongodb.com
# 2. Cluster → Database Users → Edit kodisha_admin
# 3. Paste OLD password from backup file
# 4. Click Update User
```

### Step 3: Update Render Environment (1 minute)

```bash
# 1. Go to Render dashboard: https://render.com/dashboard
# 2. Select your service
# 3. Settings → Environment Variables
# 4. Update these with OLD values:
#    - MONGODB_URI
#    - JWT_SECRET
# 5. Click Deploy
```

### Step 4: Verify Backend Health (30 seconds)

```bash
curl https://your-backend.onrender.com/api/auth/health
# Should return: { "success": true, "message": "Backend is alive" }
```

**If this works:** You've successfully rolled back! ✅

---

## Scenario 2: GitHub Actions Workflow Failed

**Symptoms:**
- Rotation script gave an error
- Rotation didn't complete
- Slack showed ❌ failure

**Solution:**

### Check the Error:

```bash
# 1. Go to GitHub repo → Actions tab
# 2. Click on the failed "Monthly Credential Rotation" run
# 3. Expand the step that failed
# 4. Read the error message carefully
```

### Common Errors & Fixes:

#### Error: "Unauthorized" (MongoDB API)

**Problem:** MongoDB API credentials are wrong

**Fix:**
```bash
# 1. Go to https://cloud.mongodb.com
# 2. Organization → Access Manager → API Keys
# 3. Check if your API key is still valid
# 4. If expired/wrong:
#    - Create NEW API key
#    - Update GitHub secret: MONGODB_PRIVATE_KEY
#    - Try rotation again
```

#### Error: "Service not found" (Render API)

**Problem:** Render service ID is wrong

**Fix:**
```bash
# 1. Go to https://render.com/dashboard
# 2. Click on your backend service
# 3. Copy the SERVICE ID from URL: /services/XXXXX
# 4. Update GitHub secret: RENDER_SERVICE_ID
# 5. Try again
```

#### Error: "Connection timeout"

**Problem:** Network issue (temporary)

**Fix:**
```bash
# Just re-run the workflow:
# 1. Go to GitHub → Actions → Rotation Workflow
# 2. Click "Run workflow" button
# 3. Select "main" branch
# 4. Click "Run workflow"
```

---

## Scenario 3: Credentials Rotated but Backend Still Works

**Good news!** This means rotation was successful!

### Verify Everything:

```bash
# 1. Check backend is responding
curl https://your-backend.onrender.com/api/auth/health

# 2. Try login (test account)
curl -X POST https://your-backend.onrender.com/api/auth/login-otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+254712345678"}'

# 3. Check Sentry for errors
# https://sentry.io → Select project → Check last 24h for new errors

# 4. Watch logs for 1 hour
# Render dashboard → Service → Logs
```

---

## Scenario 4: Database Corruption After Rotation

**Symptoms:**
- Error: "E11000 duplicate key"
- Users can't register/login
- Database is locked

**Solution - 10 minutes:**

### Step 1: Check Database Health (2 minutes)

```bash
# In MongoDB Atlas: https://cloud.mongodb.com
# 1. Go to Cluster → Metrics
# 2. Look for red alerts
# 3. Check "Operations" tab for stuck operations
```

### Step 2: Rebuild Indexes (5 minutes)

```bash
# SSH into your backend server OR use Render shell:
# 1. Render dashboard → Service → Shell
# 2. Run:
npm run check-indexes
npm run seed --clear  # Only if absolutely necessary!
```

### Step 3: Restart Backend (3 minutes)

```bash
# Render dashboard → Service → Manual Deploy
# Click "Deploy" to restart with fixed indexes
```

---

## Complete Rollback Instructions (Last Resort)

**If EVERYTHING is broken, do this:**

### Step 1: Restore Old Environment (5 minutes)

```bash
# 1. Open .secrets-backup/rotation-TIMESTAMP.json
# 2. Get all OLD credential values
# 3. Go to Render dashboard → Settings → Environment Variables
# 4. Update ALL these with OLD values:
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_API_SECRET=
EMAIL_PASS=
TWILIO_AUTH_TOKEN=
AFRICAS_TALKING_API_KEY=

# 5. Click "Save and Deploy"
```

### Step 2: Restore MongoDB Password (3 minutes)

```bash
# 1. https://cloud.mongodb.com → Cluster → Database Users
# 2. Edit "kodisha_admin" user
# 3. Paste OLD password from backup
# 4. Click "Update User"
# 5. Wait 30 seconds for MongoDB to apply changes
```

### Step 3: Verify (2 minutes)

```bash
# Backend should be back online
curl https://your-backend.onrender.com/api/auth/health
# Should see: { "success": true }
```

---

## Prevention (For Next Time)

After any rotation, ALWAYS do this:

### ✅ Checklist

- [ ] Backend is responding: `curl /api/auth/health`
- [ ] No errors in Sentry in last 1 hour
- [ ] Users can login (test with test account)
- [ ] Emails are sending
- [ ] No E11000 errors in database
- [ ] Backup file saved in `.secrets-backup/`
- [ ] Slack notification confirms success
- [ ] Team informed of rotation

---

## If You're Still Stuck

**Post-Rollback Action Items:**

1. **Save this information:**
   - What went wrong?
   - When did it happen?
   - What did you try?
   - What's the current status?

2. **Notify the team on Slack:**
   - @channel Rotation FAILED at [TIME]
   - Issue: [DESCRIPTION]
   - Status: [WHAT YOU'VE TRIED]

3. **Check logs:**
   ```bash
   # Render logs
   https://render.com/dashboard → Your service → Logs
   
   # GitHub logs
   https://github.com/YOUR_REPO/actions
   
   # Sentry
   https://sentry.io → Your project
   ```

---

## Understanding Backups

### Where Backups Are Stored:

```
.secrets-backup/
  rotation-1704067200.json  ← Old rotation
  rotation-1704153600.json  ← Newer rotation
  rotation-1704240000.json  ← Latest rotation (use this first!)
```

### What's In a Backup:

```json
{
  "timestamp": "2026-01-26T10:30:00Z",
  "secrets": {
    "mongodbPassword": "OLD_PASSWORD_HERE",
    "jwtSecret": "OLD_JWT_SECRET_HERE"
  },
  "rotatedBy": "github-actions"
}
```

### ⚠️ SECURITY WARNING:

- **NEVER** commit `.secrets-backup/` to git (it's in .gitignore)
- **NEVER** share backup files on Slack/email
- **ONLY** access locally or on secure VPN
- Delete backups older than 30 days

---

## Contact & Support

If rollback doesn't work:

1. **Keep backend down** - Don't try random fixes
2. **Document everything** - Screenshot errors
3. **Contact MongoDB support** - They can help
4. **Contact Render support** - They can help
5. **Contact your team lead** - Escalate immediately

---

**Remember:** The goal is to restore service quickly, not to understand why it failed. Fix first, ask questions later!
