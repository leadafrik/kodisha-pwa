# 🚀 OAuth & Vercel Setup Instructions

## CRITICAL: Complete These Steps to Enable OAuth Login

You now have a professional login page, but OAuth won't work until environment variables are configured in Vercel.

### ⚠️ The Issue

When you click "Sign in with Google" or "Sign in with Facebook", you get errors like:
```
Google Client ID not configured
Facebook App ID not configured
```

**Why?** The environment variables are set locally in `.env.local` but NOT in Vercel. Vercel deployment needs them explicitly configured.

---

## ✅ SOLUTION: Configure Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Find project `kodisha-pwa`
3. Click **Settings**
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Google OAuth
Click **Add New** and fill in:
- **Name**: `REACT_APP_GOOGLE_CLIENT_ID`
- **Value**: `767949895175-9vkjdu9cg6qro3ps38umdnbuio6fkeed.apps.googleusercontent.com`
- **Environments**: Check `Production`, `Preview`, `Development`
- Click **Save**

### Step 3: Add Facebook OAuth
Click **Add New** and fill in:
- **Name**: `REACT_APP_FACEBOOK_APP_ID`
- **Value**: `1041691904834986`
- **Environments**: Check `Production`, `Preview`, `Development`
- Click **Save**

### Step 4: Add API URLs
Click **Add New** and fill in:
- **Name**: `REACT_APP_API_URL`
- **Value**: `https://kodisha-backend.onrender.com/api`
- **Environments**: Check all
- Click **Save**

Then add:
- **Name**: `REACT_APP_SOCKET_URL`
- **Value**: `https://kodisha-backend.onrender.com`
- **Environments**: Check all
- Click **Save**

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click the three-dot menu on latest deployment
3. Select **Redeploy**
4. Wait for build to complete

**OR** simply push a new commit to auto-trigger redeploy.

---

## 📋 Checklist After Setup

After configuration and redeploy, verify:
- [ ] No "Google Client ID not configured" in console
- [ ] No "Facebook App ID not configured" in console
- [ ] "Sign in with Google" button works
- [ ] "Sign in with Facebook" button works
- [ ] Email signup form works
- [ ] "Phone verification coming soon" message appears

---

## 🎯 Login Flow Now Available

Users can now:

✅ **Sign in with Google**
- Click "Continue with Google" button
- Uses Google OAuth
- Auto-creates account if new user

✅ **Sign in with Facebook**
- Click "Continue with Facebook" button
- Uses Facebook OAuth
- Auto-creates account if new user

✅ **Sign up with Email**
- Click "Sign up" tab
- Enter email (no phone needed yet)
- Set password, role, county
- Creates account
- Shows "Phone verification coming soon" note

✅ **Sign in with Email**
- Use email/password
- Simple login flow

---

## 📱 Phone Verification Status

**Current Status**: Coming Soon
- The signup form shows: "📱 Phone verification will be coming soon"
- Users can sign up with email for now
- Phone verification will be added in next phase

**Why?** To keep the flow simple while OAuth is being set up.

---

## 🔗 Important Links

- **Google OAuth Setup**: https://console.cloud.google.com/
- **Facebook OAuth Setup**: https://developers.facebook.com/apps
- **Backend Render**: https://render.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## ❓ Troubleshooting

### Still Getting "Client ID not configured" After Setup?

1. **Check Vercel** - Verify variables are there
2. **Redeploy** - Push new commit or use three-dot redeploy
3. **Clear Cache** - Press Ctrl+Shift+Delete in browser
4. **Check Console** - F12 → Console tab for actual error messages
5. **Wait** - Sometimes takes 1-2 minutes after redeploy

### OAuth buttons don't work even with variables set?

1. Check browser console (F12) for specific error
2. For Google: Verify OAuth app has correct redirect URIs
3. For Facebook: Check Facebook App Settings → Valid OAuth Redirect URIs
4. Ensure domains are whitelisted in OAuth app settings

### Email signup form shows errors?

- Verify backend is running (https://kodisha-backend.onrender.com/api/health)
- Check backend has database connection
- Look for error in browser console

---

## 📝 Summary

| Feature | Status | Action |
|---------|--------|--------|
| Google Login | Ready | Configure in Vercel ✅ |
| Facebook Login | Ready | Configure in Vercel ✅ |
| Email Signup | Ready | Working now ✅ |
| Phone Verification | Coming Soon | Will be added next |
| Professional UI | Done | Live now ✅ |
| ESLint Errors | Fixed | All cleared ✅ |

**Next Build Deployment**: Environment variables MUST be in Vercel or login won't work!
