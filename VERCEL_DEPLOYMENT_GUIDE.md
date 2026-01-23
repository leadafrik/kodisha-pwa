# Vercel Deployment Environment Configuration Guide

## Overview
This guide explains how to configure environment variables in Vercel for the Agrisoko platform to enable OAuth login and other features.

## Required Environment Variables

### Frontend Environment Variables (Vercel Project Settings)

Navigate to your Vercel project → Settings → Environment Variables and add:

```
REACT_APP_API_URL = https://kodisha-backend.onrender.com/api
REACT_APP_SOCKET_URL = https://kodisha-backend.onrender.com

REACT_APP_GOOGLE_CLIENT_ID = YOUR_GOOGLE_CLIENT_ID_HERE

REACT_APP_FACEBOOK_APP_ID = YOUR_FACEBOOK_APP_ID_HERE
```

### Important Notes

1. **REACT_APP_ Prefix**: All frontend variables MUST start with `REACT_APP_` to be accessible in React code
2. **Production URL**: Use `https://kodisha-backend.onrender.com/api` for production (not localhost)
3. **Development**: Use `.env.local` for local development with `http://localhost:5000/api`

## Step-by-Step Setup

### Step 1: Access Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (e.g., `kodisha-pwa`)
3. Click **Settings**
4. Click **Environment Variables** in the left sidebar

### Step 2: Add Google OAuth Credentials

1. Click **Add New**
2. **Name**: `REACT_APP_GOOGLE_CLIENT_ID`
3. **Value**: Your Google OAuth Client ID (from Google Cloud Console)
4. **Environments**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

### Step 3: Add Facebook OAuth Credentials

1. Click **Add New**
2. **Name**: `REACT_APP_FACEBOOK_APP_ID`
3. **Value**: Your Facebook App ID (from Facebook Developer Console)
4. **Environments**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

### Step 4: Add API URL

1. Click **Add New**
2. **Name**: `REACT_APP_API_URL`
3. **Value**: `https://kodisha-backend.onrender.com/api`
4. **Environments**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

### Step 5: Add Socket URL

1. Click **Add New**
2. **Name**: `REACT_APP_SOCKET_URL`
3. **Value**: `https://kodisha-backend.onrender.com`
4. **Environments**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

## Redeploy After Changes

After adding environment variables:

1. Go to **Deployments** tab
2. Click the three-dot menu on the latest deployment
3. Select **Redeploy**
4. Confirm the redeploy

OR simply push a new commit to trigger an automatic redeploy.

## Verification

After redeployment, check the browser console (F12) for:

- ✅ No "Google Client ID not configured" errors
- ✅ No "Facebook App ID not configured" errors
- ✅ OAuth buttons should work without errors

## Troubleshooting

### "Google Client ID not configured"
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is set in Vercel
- Verify it starts with `REACT_APP_`
- Redeploy the project
- Clear browser cache (Ctrl+Shift+Delete)

### "Facebook App ID not configured"
- Check that `REACT_APP_FACEBOOK_APP_ID` is set in Vercel
- Verify it starts with `REACT_APP_`
- Redeploy the project
- Clear browser cache

### OAuth buttons still fail after configuration
1. Check browser console for actual error message
2. Verify credentials are correct in Vercel
3. Check that Facebook/Google OAuth apps are properly configured
4. For Facebook: Ensure domain is whitelisted in Facebook App Settings → Valid OAuth Redirect URIs

## Backend Environment Variables

The backend (on Render) also needs these environment variables:

```
FACEBOOK_APP_ID = YOUR_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET = YOUR_FACEBOOK_APP_SECRET
GOOGLE_CLIENT_ID = YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = YOUR_GOOGLE_CLIENT_SECRET
```

Configure these in your Render service dashboard under **Environment**.

## Local Development

For local development, use `.env.local`:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
REACT_APP_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID
```

Then:
```bash
npm start
```

The `.env.local` file is ignored by git and won't be committed.
