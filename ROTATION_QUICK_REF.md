# 🎯 QUICK REFERENCE - Credential Rotation

Print this page and keep it next to you while rotating! 

---

## 📋 Credentials to Rotate

| # | Service | Time | Status | New Value |
|---|---------|------|--------|-----------|
| 1 | MongoDB | 5 min | ⬜ | ___________ |
| 2 | JWT Secret | 5 min | ⬜ | ___________ |
| 3 | Cloudinary | 5 min | ⬜ | ___________ |
| 4 | Gmail | 10 min | ⬜ | ___________ |
| 5 | Twilio | 5 min | ⬜ | ___________ |
| 6 | Africa's Talking | 5 min | ⬜ | ___________ |
| 7 | Google OAuth | 5 min | ⬜ | ___________ |
| 8 | Facebook OAuth | 5 min | ⬜ | ___________ |

**Instructions:** As you complete each, write ✅ in Status column

---

## 🔗 Links You'll Need

| Service | Login URL |
|---------|-----------|
| **MongoDB** | https://cloud.mongodb.com |
| **Cloudinary** | https://cloudinary.com/console |
| **Gmail** | https://myaccount.google.com/security |
| **Twilio** | https://console.twilio.com |
| **Africa's Talking** | https://africastalking.com/dashboard |
| **Google Console** | https://console.cloud.google.com |
| **Facebook Dev** | https://developers.facebook.com/apps |
| **Sentry** | https://sentry.io |
| **Render** | https://render.com/dashboard |

---

## ⏱️ Timeline

```
START: ___:___

Step 1-3: 15 min → ___:___
Step 4-8: 35 min → ___:___  
Step 9-10: 10 min → ___:___

UPDATE RENDER: 10 min → ___:___
TESTING: 20 min → ___:___

FINISH: ___:___
TOTAL TIME: ___ minutes
```

---

## 🚨 If Something Breaks

```
Problem: _________________________________

Error message: ____________________________

What I tried: ______________________________

Current status: ____________________________
```

**Then:** Open ROLLBACK.md and follow the steps!

---

## ✅ Verification Checklist

Before declaring success:

```
☐ All 9 credentials rotated
☐ All variables updated in Render
☐ Render redeploy triggered
☐ Backend health check: PASS ✅
☐ Sentry shows no new errors
☐ Database indexes OK
☐ Frontend can reach API
```

---

## 📞 Emergency Contact

If stuck:
1. Check ROLLBACK.md
2. Re-read the relevant step in ROTATION_STEP_BY_STEP.md
3. Ask for help with:
   - Current step number
   - Exact error message
   - Screenshot if possible

---

## Key Commands

**Check health:**
```
curl https://backend-url/api/auth/health
```

**Check indexes:**
```
npm run check-indexes
```

**View Render logs:**
```
https://render.com/dashboard → Service → Logs
```

---

**Start time: ________**  
**Finish time: ________**  
**Total duration: ________**  
**Success? YES ✅ / NO ❌**
