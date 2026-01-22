# Facebook Login - Quick Reference

## 🚀 Quick Start (Copy-Paste Ready)

### 1. Get App ID
```
1. https://developers.facebook.com
2. Create App → Consumer
3. Settings → Basic → Copy App ID
```

### 2. Set Environment Variables
```bash
# Frontend .env.local
REACT_APP_FACEBOOK_APP_ID=YOUR_APP_ID

# Backend .env
FACEBOOK_APP_ID=YOUR_APP_ID
FACEBOOK_APP_SECRET=YOUR_APP_SECRET
BACKEND_URL=https://yourdomain.com
```

### 3. Configure Facebook App
```
Settings → Basic:
  - App Domains: localhost, yourdomain.com
  
Settings → Data Deletion:
  - URL: https://yourdomain.com/api/auth/facebook/delete-data
  
Facebook Login → Settings:
  - Valid OAuth URIs: localhost:3000, yourdomain.com
```

### 4. Test
```bash
npm start
# Click "Login with Facebook" on login page
```

---

## 📱 What Users See

```
┌─────────────────────────────────────┐
│  Login to Agrisoko                  │
├─────────────────────────────────────┤
│                                     │
│  [ Login with Facebook ][FB icon]   │
│                                     │
│  ──── Or continue with ────         │
│                                     │
│  Email or Phone: [_____________]    │
│  Password:       [_____________]    │
│  [Login Button]                     │
│                                     │
│  New? Sign up | Forgot password     │
│                                     │
└─────────────────────────────────────┘
```

When clicked:
1. Facebook login dialog appears
2. User authenticates
3. Redirected to dashboard
4. Account created automatically

---

## 🔧 Troubleshooting (Common Issues)

| Problem | Solution |
|---------|----------|
| "App ID not configured" | Check .env.local has REACT_APP_FACEBOOK_APP_ID |
| "SDK failed to load" | Verify localhost in App Domains |
| "Login not working" | Check redirect URIs in Facebook App |
| "User not created" | Check MongoDB connection, logs |
| "Deletion not working" | Verify callback URL is accessible |

---

## 📊 Data Flows

### Login
```
Frontend          Facebook          Backend          Database
   │                 │                 │                │
   ├─login dialog────>│                 │                │
   │                 │<─token returned──┤                │
   ├─token + info────────────────────>│                │
   │                 │                 ├─verify token──>│
   │                 │                 │<─valid────────┤
   │                 │                 ├─create user──>│
   │                 │                 │<─user ID──────┤
   │<────JWT token───────────────────┤                │
   │ (logged in!)                      │                │
```

### Deletion
```
User                Facebook           Backend          Database
 │                     │                 │                │
 ├─delete profile──>│                 │                │
 │                     ├─delete request──>│                │
 │                     │                 ├─mark deleted─>│
 │                     │                 ├─clear data───>│
 │                     │<─confirmation code              │
 │                     │ (deletion complete)              │
```

---

## 🔐 Security Checklist

- ✅ Token verified with Facebook (production)
- ✅ User ID checked against token
- ✅ JWT used for sessions (not access token)
- ✅ Data deletion support
- ✅ GDPR/CCPA compliant
- ⚠️ Rate limiting (recommended)
- ⚠️ CSRF protection (recommended)

---

## 📋 What Gets Stored

**From Facebook:**
- ✅ Email (marked verified)
- ✅ Full name
- ✅ Facebook ID (for unlinking)
- ✅ Profile picture (optional)

**Not Stored:**
- ❌ Access token (discarded)
- ❌ Password (not used)
- ❌ Friends list (unless explicitly requested)

---

## 🧪 Testing Checklist

- [ ] Login works locally
- [ ] User created in database
- [ ] JWT token returned
- [ ] Can access protected pages
- [ ] Profile shows correct info
- [ ] Logout works
- [ ] Re-login works
- [ ] Deletion endpoint responds
- [ ] User marked deleted in DB

---

## 🌐 Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/facebook/login` | Main login |
| POST | `/api/auth/facebook/delete-data` | Delete account |
| GET | `/api/auth/facebook/deletion-status/:id` | Check if deleted |

---

## 💰 Cost
**$0** - Completely free

---

## 📞 Need Help?

1. Check [FACEBOOK_LOGIN_SETUP.md](FACEBOOK_LOGIN_SETUP.md) for detailed guide
2. Review [FACEBOOK_LOGIN_ENHANCEMENTS.md](FACEBOOK_LOGIN_ENHANCEMENTS.md) for architecture
3. Check Facebook [API Docs](https://developers.facebook.com/docs)

---

## ✨ What's Implemented

| Feature | Status |
|---------|--------|
| Basic login | ✅ Done |
| User creation | ✅ Done |
| Account linking | ✅ Done |
| Data deletion | ✅ Done |
| Token verification | ✅ Done |
| GDPR compliance | ✅ Done |
| Error handling | ✅ Done |
| Rate limiting | ⚠️ Recommended |
| CSRF protection | ⚠️ Recommended |

---

## 🎯 Next Steps

1. Get Facebook App ID (5 min)
2. Set environment variables (2 min)
3. Configure Facebook App (10 min)
4. Test login flow (5 min)
5. Deploy (varies)

**Total: ~30 minutes to fully working!**

---

Generated: January 22, 2026
Last Updated: Enhancements v2 (Data Deletion + Advanced Features)
