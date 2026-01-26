# ⚡ CRITICAL ACTIONS - NEXT 24 HOURS

## 🔴 DO THESE NOW (2 Hours Maximum)

### Step 1: Check Git History (15 minutes)
```bash
cd c:\Users\gordo\kodisha
git log --all --full-history -- ".env"
```

**Result:**
- If NOTHING appears → ✅ You're safe, skip Step 4
- If commits appear → ⚠️ You MUST do Step 4 (sanitize git history)

---

### Step 2: Rotate All Credentials (60 minutes)

Go to each service and generate NEW credentials:

| Service | URL | Action | Done? |
|---------|-----|--------|-------|
| MongoDB | https://cloud.mongodb.com | Cluster → Database Users → Edit kodisha_admin → Generate Password | ☐ |
| Cloudinary | https://cloudinary.com/console | Settings → API Keys → Regenerate Secret | ☐ |
| Gmail | https://myaccount.google.com/apppasswords | Create new App Password for agrisoko@gmail.com | ☐ |
| Twilio | https://console.twilio.com/account | Account → API Keys → Generate Auth Token | ☐ |
| Africa's Talking | https://africastalking.com/auth/register | Dashboard → API Keys → Regenerate | ☐ |
| Google OAuth | https://console.cloud.google.com/apis/credentials | Regenerate Client Secret | ☐ |
| Facebook OAuth | https://developers.facebook.com/apps | Settings → Basic → Regenerate Secret | ☐ |

**Each takes 2-5 minutes. Copy new values before leaving each page.**

---

### Step 3: Update .env with New Credentials (15 minutes)

Open `backend/.env` and replace ALL values from Step 2:

```bash
# After rotating each credential, update:
MONGODB_URI=mongodb+srv://kodisha_admin:NEW_PASSWORD@...
JWT_SECRET=NEW_JWT_SECRET_HERE
CLOUDINARY_API_SECRET=NEW_SECRET
EMAIL_PASS=NEW_GMAIL_APP_PASSWORD
TWILIO_AUTH_TOKEN=NEW_TOKEN
AFRICAS_TALKING_API_KEY=NEW_KEY
GOOGLE_CLIENT_SECRET=NEW_SECRET
FACEBOOK_APP_SECRET=NEW_SECRET
```

Test the backend starts:
```bash
cd backend
npm run dev
# Should connect to MongoDB without errors
```

---

### Step 4: Sanitize Git History (ONLY IF .env in git)

**ONLY DO THIS IF Step 1 showed commits with .env**

```bash
cd c:\Users\gordo\kodisha

# Option A: Simple method (if repo not shared yet)
git filter-branch --tree-filter 'rm -f .env .env.* 2>/dev/null' HEAD

# Option B: Force everyone to re-clone
git push origin --force --all
```

**⚠️ This is a NUCLEAR option - use only if absolutely necessary.**

---

### Step 5: Verify & Test (15 minutes)

```bash
# Test backend API
curl http://localhost:5000/api/auth/health

# Test database connection
npm run check-indexes

# Test email sending
npm run test-env-vars
```

All should show ✅ without revealing credentials.

---

## 🟡 DO THESE THIS WEEK (6-8 Hours)

### High Priority Code Changes

**1. Remove Console Logs (2 hours)**
```bash
# Find all console logs
grep -r "console\." backend/src --include="*.ts" | head -20

# Replace with proper logging
# Example: remove from auth.ts (30+ lines)
```

**2. Fix JWT Expiration (1 hour)**
- Change `expiresIn: "30d"` → `expiresIn: "15m"`
- Add refresh token logic
- Update frontend to handle token refresh

**3. Fix Error Messages (2 hours)**
- Remove stack traces from user-facing errors
- Never log: passwords, tokens, emails, phone numbers
- Use ErrorService for consistent responses

**4. Add HTTPS Redirect (1 hour)**
- Verify `httpsRedirect` middleware is enabled
- Test: HTTP requests redirect to HTTPS

**5. Fix Email Service (2 hours)**
- Implement retry logic for failed emails
- Add email templates
- Test email delivery

---

## 📋 CHECKLIST FOR NEXT WEEK

### Security Hardening
- [ ] All credentials rotated and .env updated
- [ ] Git history sanitized (if needed)
- [ ] All console.log statements removed
- [ ] Error messages sanitized
- [ ] HTTPS enforced in production
- [ ] JWT tokens expire in 15 minutes

### Data Protection
- [ ] Input validation on all routes
- [ ] Rate limiting on SMS/Email sends
- [ ] CORS whitelisting configured
- [ ] Request size limits set
- [ ] Socket.IO authentication secured

### Quality & Monitoring
- [ ] Database indexes verified
- [ ] Email service working with retries
- [ ] Error tracking filters in Sentry
- [ ] Performance monitoring alerts active
- [ ] No errors in production logs

---

## 🆘 IF SOMETHING GOES WRONG

**Backend won't start?**
```bash
cd backend
# Check logs
npm run dev 2>&1 | head -50
# Most likely: Wrong MongoDB credentials
```

**Users can't log in?**
- Old JWT tokens are still valid for 30 days
- Users need to clear localStorage and re-login
- Or regenerate new tokens

**Email not sending?**
- Check Gmail credentials are correct
- Verify "Less secure app access" is enabled
- Check Sentry for error details

**Need to revert?**
```bash
git reset --hard HEAD~1  # Only if you haven't pushed yet!
```

---

## 🎯 SUCCESS INDICATORS

After completing all steps, you should see:

✅ Backend starts without errors
✅ All API endpoints respond
✅ Database connects successfully
✅ No credentials visible in logs
✅ Emails are being sent
✅ No console.log spam in Sentry
✅ HTTPS enforced in production
✅ Rate limiting working on sensitive endpoints

---

## 📞 QUICK LINKS

- [Full Audit Report](APP_AUDIT_REPORT.md) - Complete details on all issues
- [Security Audit Report](SECURITY_AUDIT_REPORT.md) - Original security findings
- [Backend Error Handler](backend/src/middleware/errorHandler.ts) - Fix error logging
- [Auth Routes](backend/src/routes/auth.ts) - Fix console logs and JWT
- [Email Service](backend/src/services/emailService.ts) - Fix email functionality

---

**Estimated Time: 2 hours critical actions + 6 hours this week = 8 hours total for critical security fixes**
