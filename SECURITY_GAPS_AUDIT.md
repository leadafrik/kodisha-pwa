# 🔍 Security Gaps & Secrets Audit

**Date:** January 26, 2026  
**Status:** Comprehensive audit of all secrets, credentials, and rotation gaps

---

## 📊 Summary

| Category | Total Secrets | Rotating | Gaps |
|----------|---------------|----------|------|
| Backend | 23 | 2 | 21 ❌ |
| Frontend | 7+ | 0 | 7+ ❌ |
| **Total** | **30+** | **2** | **28+ ❌** |

---

## 🔴 CRITICAL GAPS

### Backend Secrets (Backend/.env) - 23 Total, Only 2 Rotating

#### ✅ ROTATING (2)
- `JWT_SECRET` - Rotates monthly
- `MONGODB_URI` (password embedded) - Rotates monthly

#### ❌ NOT ROTATING (21)

**Email Service (3)**
- `EMAIL_FROM` - Static email address
- `EMAIL_HOST` - smtp.gmail.com
- `EMAIL_PASS` - **⚠️ CRITICAL: Gmail password** - NEVER ROTATES
- `EMAIL_USER` - info@leadAfrik.com
- `EMAIL_PORT` - 587

**Twilio (4)**
- `TWILIO_ACCOUNT_SID` - Account identifier
- `TWILIO_AUTH_TOKEN` - **⚠️ CRITICAL: Auth token** - NEVER ROTATES
- `TWILIO_PHONE_NUMBER` - Service phone number
- `TWILIO_VERIFY_SERVICE_SID` - Verification service ID

**Cloud Services (2)**
- `CLOUDINARY_API_KEY` - **⚠️ HIGH: Image storage key** - NEVER ROTATES
- `CLOUDINARY_API_SECRET` - **⚠️ HIGH: Image storage secret** - NEVER ROTATES
- `CLOUDINARY_CLOUD_NAME` - Cloud name

**SMS/Telecom (2)**
- `AFRICAS_TALKING_API_KEY` - **⚠️ HIGH: SMS API key** - NEVER ROTATES
- `AFRICAS_TALKING_USERNAME` - Service username

**OAuth (4)**
- `GOOGLE_CLIENT_ID` - Public (safe)
- `GOOGLE_CLIENT_SECRET` - **⚠️ MEDIUM: Should rotate** - NEVER ROTATES
- `FACEBOOK_APP_ID` - Public (safe)
- `FACEBOOK_APP_SECRET` - **⚠️ MEDIUM: Should rotate** - NEVER ROTATES

**Monitoring (1)**
- `SENTRY_DSN` - Error tracking key (low sensitivity)

---

### Frontend Secrets (Vercel) - 7+ Total, 0 Rotating

#### ❌ NOT ROTATING (7+)

**OAuth Frontend (2)**
- `REACT_APP_GOOGLE_CLIENT_ID` - Configured, static
- `REACT_APP_FACEBOOK_APP_ID` - Configured, static

**Services (5+)**
- `REACT_APP_API_URL` - API endpoint
- `REACT_APP_SOCKET_URL` - WebSocket endpoint
- `REACT_APP_SENTRY_DSN` - Error tracking
- `REACT_APP_VAPID_PUBLIC_KEY` - Push notifications (public)
- `REACT_APP_GOOGLE_MAPS_API_KEY` - Maps API key
- `REACT_APP_VERSION` - App version
- `REACT_APP_SALE_LISTINGS_PAUSED` - Feature flag

---

## 🎯 Risk Assessment

### 🔴 CRITICAL (Immediate Action)
1. **EMAIL_PASS** - Gmail account compromise
   - Risk: Email spoofing, account takeover
   - Impact: Users can't receive emails, password resets broken
   - Recommendation: **Rotate immediately, add to monthly rotation**

2. **TWILIO_AUTH_TOKEN** - SMS service compromise
   - Risk: Attackers could send SMS as your app
   - Impact: SMS phishing, OTP interception
   - Recommendation: **Rotate immediately, add to monthly rotation**

### 🟠 HIGH (Schedule Rotation)
1. **CLOUDINARY_API_SECRET** - Image service compromise
   - Risk: Attackers could modify/delete user images
   - Impact: Data integrity, user content loss
   - Recommendation: **Rotate quarterly**

2. **AFRICAS_TALKING_API_KEY** - SMS provider compromise
   - Risk: Unauthorized SMS sending
   - Impact: SMS phishing, credential abuse
   - Recommendation: **Rotate quarterly**

### 🟡 MEDIUM (Add to Rotation)
1. **GOOGLE_CLIENT_SECRET** - OAuth compromise
   - Risk: Unauthorized Google login access
   - Impact: Account hijacking
   - Recommendation: **Rotate yearly or on suspicion**

2. **FACEBOOK_APP_SECRET** - OAuth compromise
   - Risk: Unauthorized Facebook login access
   - Impact: Account hijacking
   - Recommendation: **Rotate yearly or on suspicion**

---

## 📋 What's Currently Rotating

```javascript
// scripts/rotate-credentials.js (Monthly)
✅ MongoDB password (embedded in MONGODB_URI)
✅ JWT Secret
❌ Everything else is static
```

---

## 🚀 Recommendations

### Priority 1: Critical Secrets (This Week)
```
1. EMAIL_PASS - Move to GitHub secret, auto-rotate
2. TWILIO_AUTH_TOKEN - Move to GitHub secret, auto-rotate
3. Update rotation script to handle these
```

### Priority 2: High-Risk Secrets (This Month)
```
1. CLOUDINARY_API_SECRET - Add quarterly rotation
2. AFRICAS_TALKING_API_KEY - Add quarterly rotation
3. Implement API integrations for these services
```

### Priority 3: OAuth Secrets (Next Quarter)
```
1. GOOGLE_CLIENT_SECRET - Add yearly rotation
2. FACEBOOK_APP_SECRET - Add yearly rotation
3. Implement Google Cloud & Facebook Graph API integrations
```

---

## 📝 Implementation Plan

### Phase 1: Immediate (1-2 days)
- [ ] Move `EMAIL_PASS` to GitHub Secrets
- [ ] Move `TWILIO_AUTH_TOKEN` to GitHub Secrets
- [ ] Add rotation functions for both
- [ ] Test rotation in dry-run mode
- [ ] Deploy

### Phase 2: High Priority (1 week)
- [ ] Add Cloudinary API integration
- [ ] Add Africa's Talking API integration
- [ ] Implement quarterly rotation
- [ ] Set up separate schedule for non-monthly rotations

### Phase 3: OAuth (2 weeks)
- [ ] Implement Google Cloud OAuth secret rotation
- [ ] Implement Facebook OAuth secret rotation
- [ ] Set up yearly rotation schedule

---

## 🔒 Security Checklist

- [ ] All sensitive secrets in GitHub Actions secrets (not in code)
- [ ] All secrets rotated at least monthly
- [ ] No secrets hardcoded in repository
- [ ] Backup/recovery plan for all rotated secrets
- [ ] Monitoring/alerts for failed rotations
- [ ] Audit log of all rotation events
- [ ] Team notified of rotation schedule
- [ ] Slack notifications on rotation failures

---

## 📞 Questions to Answer

1. When was `EMAIL_PASS` last rotated?
2. When was `TWILIO_AUTH_TOKEN` last rotated?
3. Are these secrets stored securely (not in git)?
4. Do you have recovery procedures if rotation fails?
5. Are there API access tokens for each service to enable auto-rotation?

---

**Status:** ⚠️ **INCOMPLETE** - 21 secrets not rotating, 2 critical secrets at risk  
**Action Required:** Implement Phase 1 improvements immediately
