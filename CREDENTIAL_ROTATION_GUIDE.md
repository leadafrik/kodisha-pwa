# CREDENTIAL ROTATION PROCEDURES - Step by Step

## 📋 Pre-Rotation Checklist

- [ ] Read this entire guide first
- [ ] Have admin access to all services
- [ ] Have a secure place to store new credentials
- [ ] Notify team: "Maintenance - forced re-login required in 1 hour"
- [ ] Keep backend running (will go down briefly when JWT secret changes)
- [ ] Block time: 60-90 minutes for complete rotation

---

## 1️⃣ MongoDB Atlas Password Rotation (5 minutes)

### Why This Is Critical
Database contains all user listings, conversations, verification records. Old password allows full read/write access.

### Steps

**1. Create Backup (Optional but Recommended)**
```bash
# Local backup of current data
mongodump --uri="mongodb+srv://kodisha_admin:CURRENT_PASSWORD@kodisha-cluster.mongodb.net/" \
  --out=/backup/mongo_$(date +%Y%m%d_%H%M%S)
```

**2. Go to MongoDB Atlas Console**
- URL: https://cloud.mongodb.com
- Login with your account email
- Navigate to: **Database Access**

**3. Edit User `kodisha_admin`**
- Find user: `kodisha_admin`
- Click "Edit"
- Scroll to "Password"
- Click "Edit Password"
- Choose "Auto-Generate Secure Password"
- Copy the new password (🔒 SAVE IT SECURELY)

**4. Update .env Locally**
```bash
# File: backend/.env
MONGODB_URI=mongodb+srv://kodisha_admin:NEW_PASSWORD_HERE@kodisha-cluster.mongodb.net/kodisha?retryWrites=true&w=majority
```

**5. Test Connection**
```bash
# Test connection works
mongosh "mongodb+srv://kodisha_admin:NEW_PASSWORD_HERE@kodisha-cluster.mongodb.net/kodisha"

# Should show: admin>
# Type: exit to quit

# If error: "Authentication failed"
# → Wrong password
# → Check MongoDB console for correct password
# → Wait 1-2 minutes for change to propagate
```

**6. Update Render Environment Variable**
- Go to: https://dashboard.render.com
- Find: Your backend service
- Settings → Environment
- Update: `MONGODB_URI`
- Paste new connection string
- Click "Save"
- Service will auto-redeploy

---

## 2️⃣ JWT Secret Rotation (5 minutes)

### Why This Is Critical
JWT secret signs all authentication tokens. Old secret allows forging fake tokens as any user.

⚠️ **WARNING:** Changing this invalidates all user sessions. Users must log back in.

### Steps

**1. Generate New JWT Secret**
```bash
# Generate 256-bit hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output will look like:
# abc123def456abc123def456abc123def456abc123def456abc123def456abc1

# Copy this value (🔒 SAVE IT SECURELY)
```

**2. Update .env Locally**
```bash
# File: backend/.env
# OLD: JWT_SECRET=fe4c25d7f92a73d65e05b5b096f11b4ace8fc3215879aea67d23414ab840990ff4e4e7e62fb543622b60f730b45fc633c2da3c4200990c34b9c5059506f0cd2b
# NEW:
JWT_SECRET=YOUR_NEW_SECRET_HERE
```

**3. Update Render Environment Variable**
- Go to: https://dashboard.render.com
- Find: Your backend service
- Settings → Environment
- Update: `JWT_SECRET`
- Paste new value
- Click "Save"
- Service will auto-redeploy

**4. Send User Notification**
- Users will see error: "Unauthorized" or "Invalid token"
- Show notification: "Security update - please log in again"
- Users click "Log in" → enter email/password → new token issued

**5. Verify**
```bash
# Test token generation with new secret
node -e "
const jwt = require('jsonwebtoken');
const newSecret = 'YOUR_NEW_SECRET_HERE';
const token = jwt.sign({userId: 'test'}, newSecret);
const decoded = jwt.verify(token, newSecret);
console.log('✓ JWT secret working:', decoded);
"
```

---

## 3️⃣ Cloudinary Credentials Rotation (5 minutes)

### Why This Is Critical
Cloudinary stores all product images. Old credentials allow uploading/deleting images.

### Steps

**1. Go to Cloudinary Console**
- URL: https://cloudinary.com/console
- Login with account
- Navigate to: **Settings → API Keys**

**2. Note Current API Key**
- Find: `api_key` (visible in dashboard)
- Keep it safe for rollback

**3. Regenerate API Secret**
- Current API Secret: (hidden, click to reveal)
- Click "Regenerate" button
- ⚠️ This immediately invalidates old secret
- Copy new secret (🔒 SAVE IT SECURELY)

**4. Copy Your Cloud Name**
- Top of page shows: `Cloud name`
- Should be something like: `your-cloud-name`
- Copy it (🔒 SAVE IT)

**5. Update .env Locally**
```bash
# File: backend/.env
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=YOUR_API_KEY_HERE
CLOUDINARY_API_SECRET=YOUR_NEW_SECRET_HERE
```

**6. Update Render**
- Go to: https://dashboard.render.com
- Settings → Environment
- Update: `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Click "Save"

**7. Test Image Upload**
```bash
# Test Cloudinary connection
curl -X POST "https://api.cloudinary.com/v1_1/your-cloud-name/image/upload" \
  -F "file=@test.jpg" \
  -F "api_key=YOUR_API_KEY" \
  -u "api_key:YOUR_NEW_SECRET"
  
# Should return: image URL (✓ working) or error with api key (need to update)
```

---

## 4️⃣ Gmail App Password (10 minutes)

### Why This Is Critical
Gmail password sends all verification emails and notifications. Old password allows sending emails as your app.

### Steps

**1. Ensure 2FA Enabled**
- Go to: https://myaccount.google.com/security
- Look for: "2-Step Verification"
- Status should be: "ON"
- ⚠️ If OFF: Enable it first (required for app passwords)

**2. Go to App Passwords**
- URL: https://myaccount.google.com/apppasswords
- You'll be re-prompted for password (security)
- Select: Device type: "Windows Computer" (or your device)
- Select: App: "Mail"
- Click "Generate"
- You'll see: 16-character app password

**3. Copy the Password**
- Example: `abcd efgh ijkl mnop`
- Remove spaces: `abcdefghijklmnop`
- Copy (🔒 SAVE IT SECURELY)

**4. Delete Old App Password**
- Go to: https://myaccount.google.com/apppasswords
- Find the old password entry (created date visible)
- Click "Delete" (trash icon)
- Confirm deletion

**5. Update .env Locally**
```bash
# File: backend/.env
EMAIL_USER=agrisoko@gmail.com
EMAIL_PASSWORD=NEW_APP_PASSWORD_HERE
```

**6. Update Render**
- Settings → Environment
- Update: `EMAIL_USER`, `EMAIL_PASSWORD`
- Click "Save"

**7. Test Email Sending**
```bash
# Test email connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'agrisoko@gmail.com',
    pass: 'NEW_APP_PASSWORD_HERE'
  }
});
transporter.verify((err, success) => {
  if (err) console.log('❌ Error:', err);
  else console.log('✓ Gmail authentication working');
});
"
```

---

## 5️⃣ Twilio Credentials (5 minutes)

### Why This Is Critical
Twilio sends OTP verification messages. Old credentials allow sending SMS as your service.

### Steps

**1. Go to Twilio Console**
- URL: https://console.twilio.com
- Login with account

**2. Find API Keys**
- Navigate to: **Account → API keys & tokens**

**3. Regenerate Auth Token**
- Current: "Account SID" (keep this)
- Current: "Auth Token" (this will change)
- Click "Regenerate Auth Token"
- Copy new token (🔒 SAVE IT SECURELY)
- ⚠️ Old token immediately invalid

**4. Find Verify Service SID**
- Navigate to: **Verify → Services**
- Find service: "Kodisha Verification" (or similar)
- Copy the "Service SID" (looks like: `VA...`)
- (🔒 SAVE IT SECURELY)

**5. Update .env Locally**
```bash
# File: backend/.env
TWILIO_ACCOUNT_SID=AC... (your account SID - usually doesn't change)
TWILIO_AUTH_TOKEN=NEW_TOKEN_HERE
TWILIO_VERIFY_SERVICE_SID=VA... (service SID - shouldn't change)
```

**6. Update Render**
- Settings → Environment
- Update: `TWILIO_AUTH_TOKEN`
- Click "Save"

**7. Test SMS Sending**
```bash
# Test Twilio connection
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID" \
  -u "YOUR_ACCOUNT_SID:NEW_TOKEN"
  
# Should return: Account details (✓ working)
```

---

## 6️⃣ Africa's Talking API Key (5 minutes)

### Why This Is Critical
Africa's Talking sends SMS messages. Old API key allows sending SMS.

### Steps

**1. Go to Africa's Talking Dashboard**
- URL: https://africastalking.com
- Login with your account

**2. Navigate to API Keys**
- Go to: **Dashboard → Settings → API Keys**

**3. Regenerate Key**
- Current API Key visible
- Click "Regenerate" or "New API Key"
- Copy new key (🔒 SAVE IT SECURELY)
- Old key becomes invalid

**4. Update .env Locally**
```bash
# File: backend/.env
AFRICAS_TALKING_API_KEY=atsk_NEW_KEY_HERE
```

**5. Update Render**
- Settings → Environment
- Update: `AFRICAS_TALKING_API_KEY`
- Click "Save"

**6. Test Connection**
```bash
# Test Africa's Talking API
curl -X GET "https://api.sandbox.africastalking.com/version/contacts" \
  -H "Accept: application/json" \
  -H "apiKey: atsk_NEW_KEY_HERE"
  
# Should return: Contact list or success (✓ working)
```

---

## 7️⃣ Sentry DSN (5 minutes)

### Why This Is Critical
Sentry logs error messages which may contain sensitive data. Old DSN allows accessing error logs.

### Steps

**1. Go to Sentry**
- URL: https://sentry.io
- Login with account

**2. Navigate to Project Settings**
- Select: "kodisha" project (or your project)
- Settings → Client Keys (DSN)

**3. Regenerate Auth Token**
- Current DSN visible
- Click "Create new key"
- A new DSN will be generated
- Copy new DSN (🔒 SAVE IT SECURELY)
- Looks like: `https://key@sentry.io/project-id`

**4. Delete Old Key**
- Find old key in list
- Click "Delete" button
- Confirm deletion

**5. Update .env Locally**
```bash
# File: backend/.env
SENTRY_DSN=https://NEW_KEY@sentry.io/YOUR_PROJECT_ID
```

**6. Update Render**
- Settings → Environment
- Update: `SENTRY_DSN`
- Click "Save"

**7. Test Sentry**
```bash
# Trigger a test error in Sentry
node -e "
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://NEW_KEY@sentry.io/YOUR_PROJECT_ID' });
Sentry.captureMessage('Test message from credential rotation');
setTimeout(() => process.exit(), 1000);
"
```

---

## 🔄 Post-Rotation Validation

### Checklist
- [ ] All 7 services have new credentials
- [ ] .env file updated locally
- [ ] All Render environment variables updated
- [ ] Each service tested (see test commands above)
- [ ] No errors in application logs
- [ ] Users notified about forced re-login

### Rollback Plan (If Something Breaks)

**If database is down:**
```bash
# Revert MongoDB password in Atlas console
# OR restore from backup:
mongorestore --uri="mongodb+srv://kodisha_admin:BACKUP_PASSWORD@..." /backup/mongo_20240115
```

**If emails not sending:**
```bash
# Check Gmail app password was generated correctly
# Verify 2FA is enabled
# Test with simpler password first
```

**If SMS not working:**
```bash
# Verify Twilio/Africa's Talking API keys in dashboard
# Check service SID is correct
# Test with test phone number
```

**If images not uploading:**
```bash
# Verify Cloudinary API key and secret
# Check cloud name is correct
# Test upload via Cloudinary dashboard
```

---

## 📝 Credential Storage Instructions

### Secure Storage Method 1: Password Manager
- Use: 1Password, LastPass, Bitwarden, or similar
- Store: Service name, username, password, URL
- Access: Only team leads
- Backup: Enable 2FA on password manager

### Secure Storage Method 2: Secrets Manager (Best for Production)
- Use: Render Secrets (what you use now), AWS Secrets Manager, HashiCorp Vault
- Store: Only in environment variables, never in code
- Access: Via CI/CD pipeline
- Audit: Automatic logging of access

### Secure Storage Method 3: Encrypted File
```bash
# Create encrypted credentials file
# Store locally (not in git)

# Encrypt
gpg --symmetric credentials.txt
# → creates credentials.txt.gpg

# Decrypt
gpg --decrypt credentials.txt.gpg

# Add to .gitignore
echo "credentials.txt" >> .gitignore
echo "credentials.txt.gpg" >> .gitignore
```

---

## ⏱️ Timeline & Notifications

### Before (30 minutes before)
```
"Maintenance Alert: Security update in 30 minutes. 
You'll need to log in again. 
No service interruption expected."
```

### During (During rotation)
```
"🔄 Security maintenance in progress.
Estimated time: 30-60 minutes.
Services may be temporarily unavailable."
```

### After (After rotation complete)
```
"✅ Security update complete.
If you get an 'Unauthorized' error, please log in again.
Thank you for your patience."
```

---

## 🚨 Emergency Contacts

If something breaks:

**Database Down:**
- Contact: MongoDB support
- Dashboard: https://cloud.mongodb.com/status

**Email Not Working:**
- Contact: Google Workspace support
- Verify: 2FA enabled at https://myaccount.google.com/security

**SMS Not Working:**
- Contact: Twilio support / Africa's Talking support
- Check: API key in their dashboards

**Images Not Uploading:**
- Contact: Cloudinary support
- Dashboard: https://cloudinary.com/console

---

## ✅ Sign-Off Checklist

When complete, sign off:

```markdown
## Credential Rotation Sign-Off

**Date:** [Date]
**Rotated By:** [Name]
**Verified By:** [Name]

### Services Rotated
- [x] MongoDB Atlas
- [x] JWT Secret
- [x] Cloudinary
- [x] Gmail App Password
- [x] Twilio
- [x] Africa's Talking
- [x] Sentry

### Verification Results
- [x] Database connection tested
- [x] Emails sending correctly
- [x] SMS working properly
- [x] Images uploading successfully
- [x] Error logging in Sentry working
- [x] All other services functioning

### Team Notifications
- [x] Users notified of forced re-login
- [x] Dev team briefed on changes
- [x] Support team prepared for questions

### Documentation
- [x] Old credentials stored securely
- [x] New credentials in password manager
- [x] Emergency access documented
- [x] Rotation log updated

**Status: ✅ COMPLETE**
```

---

**Start with MongoDB (Step 1), then proceed in order. Total time: ~60 minutes.**
