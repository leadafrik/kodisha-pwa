# 🔐 SAFE CREDENTIAL ROTATION - Step-by-Step Guide

**Follow these steps EXACTLY in order. Go slowly and read each instruction.**

---

## ⏱️ Total Time: ~90 minutes

- Preparation: 10 min
- Credential rotation: 60 min
- Testing & verification: 20 min

---

## PHASE 1: Preparation (10 minutes)

### Step 1.1: Verify Git Status ✅

Open your terminal and run:

```bash
cd c:\Users\gordo\kodisha

# Make sure you have no uncommitted changes
git status

# Expected output:
# On branch main
# nothing to commit, working tree clean
```

**If you have uncommitted changes:**
```bash
git stash  # Save them for later
```

### Step 1.2: Verify .env is NOT in Git History ✅

```bash
# Run this command
git log --all --full-history -- ".env"

# Expected output:
# (nothing - no commits found)

# If you see commits, STOP HERE and let me know!
```

### Step 1.3: Create Rotation Folder ✅

```bash
# Create a safe folder for rotation credentials
mkdir -p C:\Users\gordo\rotation-workspace
cd C:\Users\gordo\rotation-workspace

# Create a text file to save new credentials
echo. > credentials-NEW.txt
```

**Keep this file open on your desktop - you'll paste new credentials here as you create them.**

---

## PHASE 2: Rotate Credentials (60 minutes)

### Step 2.1: MongoDB Atlas Password 🍃

**Time: 5 minutes**

1. Open browser → https://cloud.mongodb.com
2. Login with your MongoDB account
3. Left sidebar → Click your organization name → "Access Manager" → "API Keys"
4. Look for the key named "Kodisha Admin" or similar
5. Click the 3-dot menu → "Edit"

**Or if that key is different:**
6. Click your organization → "Clusters"
7. Click your cluster "kodisha-cluster"
8. Click "Database Access" tab
9. Find user "kodisha_admin"
10. Click the 3-dot menu → "Edit"

11. Click "Auto-generate Secure Password" button
12. **COPY the new password immediately**
13. Paste it in your `credentials-NEW.txt` file
14. **KEEP THIS TAB OPEN** - Don't click anything else
15. Click "Update User" button at the bottom
16. Wait for the green checkmark ✅

**Save in credentials-NEW.txt:**
```
MONGODB_NEW_PASSWORD=<paste-here>
```

---

### Step 2.2: JWT Secret 🔐

**Time: 5 minutes**

Generate a new JWT secret:

1. Open PowerShell
2. Run this command:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Copy the output (long hex string)
4. Paste it in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
JWT_SECRET_NEW=<paste-here>
```

---

### Step 2.3: Cloudinary API Secret ☁️

**Time: 5 minutes**

1. Open browser → https://cloudinary.com
2. Login with your Cloudinary account
3. Top right → Click settings icon → "Settings"
4. Click "Access keys" in left sidebar
5. Look for "API Secret"
6. Click the eye icon to reveal it temporarily
7. Click the refresh icon (🔄) next to the secret
8. Click "Regenerate" in the popup
9. **COPY the new secret**
10. Paste in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
CLOUDINARY_API_SECRET_NEW=<paste-here>
```

---

### Step 2.4: Gmail App Password ✉️

**Time: 10 minutes**

1. Open browser → https://myaccount.google.com
2. Login with agrisoko@gmail.com account
3. Left sidebar → "Security"
4. Scroll down → "App passwords"
5. If you don't see this option:
   - You need 2FA enabled first
   - Click "2-Step Verification"
   - Follow the prompts (use your phone)
   - Then come back to "App passwords"

6. Select: Device: "Mail" | OS: "Windows"
7. Click "Generate"
8. Google will show a 16-character password
9. **COPY this password**
10. Paste in your `credentials-NEW.txt` file
11. Click "Done"
12. **DELETE the old Gmail app password** if it still exists (optional step)

**Save in credentials-NEW.txt:**
```
GMAIL_APP_PASSWORD_NEW=<paste-here>
```

---

### Step 2.5: Twilio Auth Token 📞

**Time: 5 minutes**

1. Open browser → https://console.twilio.com
2. Login with your Twilio account
3. Right side → Click your account name → "Account Settings"
4. Scroll down → "Auth Tokens"
5. You should see your current Auth Token
6. Click the refresh icon (🔄) next to it
7. Confirm you want to regenerate
8. **COPY the new Auth Token**
9. Paste in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
TWILIO_AUTH_TOKEN_NEW=<paste-here>
```

---

### Step 2.6: Africa's Talking API Key 🌍

**Time: 5 minutes**

1. Open browser → https://africastalking.com
2. Login with your account
3. Dashboard → Click your username → "Settings"
4. Left sidebar → "API Keys"
5. Click "Regenerate API Key"
6. Confirm the action
7. **COPY the new API Key**
8. Paste in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
AFRICAS_TALKING_API_KEY_NEW=<paste-here>
```

---

### Step 2.7: Twilio Verify Service SID 🔐

**Time: 2 minutes**

You need to keep this the same - it's not a secret. Just verify it exists:

1. https://console.twilio.com
2. Left sidebar → "Verify" → "Services"
3. Find "Agrisoko" or your service
4. Copy the "Service SID" (starts with VA...)
5. Note it down (paste in `credentials-NEW.txt` under KEEP_SAME)

**No changes needed - this stays the same.**

---

### Step 2.8: Google OAuth Secret 🔵

**Time: 5 minutes**

1. Open browser → https://console.cloud.google.com
2. Login with your Google account
3. Top left → Click project dropdown → Select "Kodisha" project
4. Left sidebar → "APIs & Services" → "Credentials"
5. Find "Web application" credential named "Kodisha"
6. Click on it
7. Bottom → Click "Regenerate Secret"
8. Click "Regenerate"
9. **COPY the new Client Secret**
10. Paste in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
GOOGLE_CLIENT_SECRET_NEW=<paste-here>
```

---

### Step 2.9: Facebook App Secret 👔

**Time: 5 minutes**

1. Open browser → https://developers.facebook.com
2. Login with your Facebook account
3. Top right → Your Apps → Select "Agrisoko" app
4. Left sidebar → Settings → Basic
5. Find "App Secret"
6. Click "Show" button
7. You'll need to confirm your password
8. Once revealed, click the refresh icon (🔄)
9. Click "Regenerate"
10. **COPY the new secret**
11. Paste in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
FACEBOOK_APP_SECRET_NEW=<paste-here>
```

---

### Step 2.10: Sentry DSN 🚨

**Time: 2 minutes**

1. Open browser → https://sentry.io
2. Login with your account
3. Click your organization
4. Click "Settings" → "Auth Tokens"
5. Click "Create New Token"
6. Name it: "Kodisha Rotation"
7. Give it full access
8. Click "Create"
9. **COPY the token**
10. Paste in your `credentials-NEW.txt` file

**Save in credentials-NEW.txt:**
```
SENTRY_DSN_NEW=<paste-here>
```

---

## PHASE 3: Update Render.com Environment (15 minutes)

### Step 3.1: Update Environment Variables

Now you have all new credentials. Time to update them in Render:

1. Open browser → https://render.com/dashboard
2. Click your backend service (should be "agrisoko-backend" or similar)
3. Click "Settings" tab
4. Scroll down → "Environment Variables"
5. Update these variables one by one:

| Old Variable | New Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://kodisha_admin:<NEW_PASSWORD>@kodisha-cluster.mongodb.net/agrisoko?retryWrites=true&w=majority` |
| `JWT_SECRET` | Paste your new JWT secret |
| `CLOUDINARY_API_SECRET` | Paste new Cloudinary secret |
| `EMAIL_PASS` | Paste new Gmail app password |
| `TWILIO_AUTH_TOKEN` | Paste new Twilio token |
| `AFRICAS_TALKING_API_KEY` | Paste new Africa's Talking key |
| `GOOGLE_CLIENT_SECRET` | Paste new Google secret |
| `FACEBOOK_APP_SECRET` | Paste new Facebook secret |

**How to update each one:**
1. Click the pencil/edit icon (✏️) for the variable
2. Clear the old value
3. Paste the new value from your `credentials-NEW.txt`
4. Click the checkmark to confirm
5. **WATCH FOR GREEN "Updated" MESSAGE**
6. Move to the next variable

### Step 3.2: Trigger Redeploy

After updating all variables:

1. Scroll to top of page
2. Look for a "Manual Deploy" button or "Deploy" button
3. Click it
4. **Wait for the redeploy to complete** (1-2 minutes)
5. You should see a green ✅ success message

---

## PHASE 4: Testing & Verification (20 minutes)

### Step 4.1: Wait for Backend to Start ⏳

```bash
# Wait 2-3 minutes for backend to fully restart
# Go make a coffee ☕
```

### Step 4.2: Test Backend Health

Open PowerShell and run:

```powershell
# Test 1: Health check
curl -Uri "https://your-backend-url.onrender.com/api/auth/health" -Method Get

# Expected response:
# StatusCode        : 200
# Content           : {"success":true,"message":"Backend is alive"}
```

**If this fails:**
- Wait another 30 seconds and try again
- Check Render dashboard logs for errors
- If still failing, see ROLLBACK.md

### Step 4.3: Test Authentication

```powershell
# Test 2: Try to send OTP
curl -Uri "https://your-backend-url.onrender.com/api/auth/login-otp/request" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"+254712345678"}'

# Expected: 200 OK (may have validation error, that's OK)
```

### Step 4.4: Check Sentry for Errors

1. Open browser → https://sentry.io
2. Click your project
3. Look at "Events" tab
4. Any new red/critical errors in last 5 minutes?
5. If YES:
   - Click on the error
   - Read the full error message
   - If it's MongoDB auth error → ROLLBACK (see ROLLBACK.md)
   - If it's something else → Note it and tell me

### Step 4.5: Verify Database Connection

```powershell
# Run in backend terminal/shell
npm run check-indexes

# Should see: ✅ All indexes verified
# If error: E11000, see ROLLBACK.md
```

### Step 4.6: Monitor for 24 Hours

For the next 24 hours:

- Check Sentry once per hour (look for new errors)
- Monitor backend logs on Render dashboard
- Test login works from frontend
- Watch for user complaints

---

## 🎉 SUCCESS CHECKLIST

After all tests pass, check off these:

- [ ] All credentials generated and saved in `credentials-NEW.txt`
- [ ] All variables updated in Render dashboard
- [ ] Render redeploy completed successfully ✅
- [ ] Backend health check passing
- [ ] No new errors in Sentry
- [ ] Database indexes verified
- [ ] Frontend can reach backend

---

## ⚠️ If Anything Goes Wrong

**STOP immediately and:**

1. **Don't panic** - You have backups
2. **Read ROLLBACK.md** - Follow the instructions exactly
3. **Restore old credentials** from `.secrets-backup/` folder
4. **Redeploy** and verify backend is back online
5. **Tell me what went wrong** - I'll help fix it

---

## Next Steps After Success

1. **Delete the text file** with credentials:
   ```bash
   rm C:\Users\gordo\rotation-workspace\credentials-NEW.txt
   ```

2. **Set up automatic rotation** (optional but recommended):
   - Go to GitHub → Your repo → Settings → Secrets
   - Add secrets for GitHub Actions (see `.env.rotation.example`)
   - Then the rotation happens automatically every month

3. **Update your team** with success notification

---

**Questions? Issues? Stuck somewhere?**

**Tell me:**
- What step you're on
- What the error says
- What you've tried
- Screenshot if possible

I'm here to help! 🚀
