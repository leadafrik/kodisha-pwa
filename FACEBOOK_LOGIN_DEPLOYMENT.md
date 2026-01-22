# Facebook Login - Deployment & Launch Guide

## Pre-Deployment Checklist

### Phase 1: Preparation (Day 1)

- [ ] **Create Facebook App**
  - Go to https://developers.facebook.com
  - Create new app (Consumer type)
  - Name: "Kodisha" or your app name
  - Complete setup process

- [ ] **Get Credentials**
  - Copy App ID from Settings → Basic
  - Copy App Secret (keep secure!)
  - Note the redirect URLs you'll use

- [ ] **Set Environment Variables**
  ```bash
  # .env.local (frontend)
  REACT_APP_FACEBOOK_APP_ID=YOUR_APP_ID
  
  # .env (backend)
  FACEBOOK_APP_ID=YOUR_APP_ID
  FACEBOOK_APP_SECRET=YOUR_APP_SECRET
  BACKEND_URL=https://yourdomain.com
  NODE_ENV=production
  ```

- [ ] **Verify .gitignore**
  ```
  .env
  .env.local
  .env.production
  # Should exclude these files!
  ```

### Phase 2: Configuration (Day 1-2)

- [ ] **Facebook App Settings**
  1. Settings → Basic
     - Add domains: localhost, yourdomain.com
     - Save
  
  2. Settings → Basic → Data Deletion
     - Set callback: `https://yourdomain.com/api/auth/facebook/delete-data`
     - Save
  
  3. Products → Facebook Login (Add if not present)
     - Go to Settings
     - Valid OAuth Redirect URIs:
       - `http://localhost:3000/`
       - `http://localhost:3001/`
       - `https://yourdomain.com/`
       - `https://yourdomain.com/login`
     - Save

- [ ] **App Roles → Test Users**
  - Create 2-3 test users for testing
  - Name them: test_1, test_2, test_3
  - Test with each before launch

- [ ] **Review Permissions**
  - Current: `public_profile`, `email` (✅ NO review needed)
  - If adding more: Submit for app review (3-7 days)

### Phase 3: Testing (Day 2-3)

- [ ] **Local Testing**
  ```bash
  npm start
  # Navigate to login page
  # Click "Login with Facebook"
  # Test with each test user
  # Verify redirect works
  # Check console for errors
  ```

- [ ] **Test Deletion**
  ```bash
  # Create test account
  curl -X POST http://localhost:5000/api/auth/facebook/delete-data \
    -H "Content-Type: application/json" \
    -d '{"signed_request":"test"}'
  
  # Check status
  curl http://localhost:5000/api/auth/facebook/deletion-status/test_id
  ```

- [ ] **Test Token Verification**
  - Check logs for: "[Facebook Login] Token verified"
  - Verify no errors in console
  - Test with invalid token (should fail)

- [ ] **Database Verification**
  ```bash
  # Check user was created
  db.users.findOne({ facebookId: "123456" })
  
  # Should show:
  # - email: user email
  # - fullName: Facebook name
  # - facebookId: Facebook ID
  # - verification.emailVerified: true
  ```

### Phase 4: Staging Deploy (Day 3-4)

- [ ] **Deploy to Staging**
  ```bash
  # Update staging .env files
  FACEBOOK_APP_ID=your_staging_id
  FACEBOOK_APP_SECRET=your_staging_secret
  BACKEND_URL=https://staging.yourdomain.com
  ```

- [ ] **Add Staging Domain to Facebook App**
  - Settings → Basic → App Domains
  - Add: staging.yourdomain.com
  - Settings → Facebook Login → Redirect URIs
  - Add: https://staging.yourdomain.com/

- [ ] **Test on Staging**
  - Full end-to-end test
  - Test with real test users
  - Monitor logs for errors
  - Check database entries

- [ ] **Load Testing** (optional)
  ```bash
  # Test endpoint under load
  ab -n 100 -c 10 https://staging.yourdomain.com/api/auth/facebook/login
  ```

### Phase 5: Production Deploy (Day 4-5)

- [ ] **Final Pre-Production Check**
  - All tests passing on staging
  - No errors in logs
  - Data deletion working
  - Token verification working

- [ ] **Backup Database**
  ```bash
  mongodump --uri="mongodb://..." --out backup_$(date +%s)
  ```

- [ ] **Update Production .env**
  ```env
  FACEBOOK_APP_ID=your_production_id
  FACEBOOK_APP_SECRET=your_production_secret
  BACKEND_URL=https://yourdomain.com
  NODE_ENV=production
  ```

- [ ] **Deploy Code**
  ```bash
  git pull origin main
  npm ci
  npm run build
  # Deploy frontend and backend
  ```

- [ ] **Update Facebook App**
  - Settings → Basic → App Domains
  - Add: yourdomain.com
  - Settings → Facebook Login → Redirect URIs
  - Add: https://yourdomain.com/

- [ ] **Verify Production**
  - Test login: https://yourdomain.com/login
  - Click "Login with Facebook"
  - Complete authentication
  - Verify redirect to dashboard
  - Check database for new user
  - Monitor logs for errors

- [ ] **Smoke Tests**
  ```bash
  # Test endpoints
  curl -X POST https://yourdomain.com/api/auth/facebook/login
  
  # Should return error (missing params) but endpoint works
  # Should NOT return 404
  ```

### Phase 6: Post-Launch (Day 5+)

- [ ] **Monitor Logs**
  ```bash
  # Watch for Facebook login errors
  tail -f logs/app.log | grep FACEBOOK
  ```

- [ ] **User Feedback**
  - Monitor support requests
  - Track login success rate
  - Fix any issues quickly

- [ ] **Analytics**
  - Track Facebook login adoption
  - Compare with email/phone logins
  - Monitor completion rates

- [ ] **Documentation**
  - Update internal docs with Facebook login
  - Train support team
  - Update user help docs

---

## Deployment Script (Example)

```bash
#!/bin/bash
# deploy.sh - One-command deployment

set -e

echo "🚀 Starting Facebook Login Deployment..."

# 1. Backup Database
echo "📦 Backing up database..."
mongodump --uri="mongodb://..." --out backup_$(date +%s)

# 2. Pull Latest Code
echo "📥 Pulling latest code..."
git pull origin main

# 3. Install Dependencies
echo "📚 Installing dependencies..."
npm ci

# 4. Build Frontend
echo "🔨 Building frontend..."
npm run build

# 5. Run Tests
echo "✅ Running tests..."
npm test -- --watch=false

# 6. Deploy Frontend
echo "🌐 Deploying frontend..."
# Your deployment command here
# e.g., aws s3 sync build/ s3://bucket/

# 7. Deploy Backend
echo "🔌 Deploying backend..."
# Your deployment command here
# e.g., docker push myapp:latest && restart-service myapp

# 8. Verify Deployment
echo "🔍 Verifying deployment..."
curl -f https://yourdomain.com/api/auth/facebook/login || exit 1

# 9. Monitor
echo "📊 Checking logs..."
tail -n 50 logs/app.log | grep -i facebook || echo "No Facebook errors found ✅"

echo "✨ Deployment complete!"
echo "📱 Test at: https://yourdomain.com/login"
```

---

## Rollback Plan

If something goes wrong:

```bash
#!/bin/bash
# rollback.sh - Quick rollback

echo "⚠️ Rolling back Facebook Login deployment..."

# 1. Restore Previous Code
git revert HEAD --no-edit
git push origin main

# 2. Restart Services
systemctl restart myapp

# 3. Verify
curl https://yourdomain.com/api/health

echo "✅ Rollback complete"
echo "Check logs: tail -f logs/app.log"
```

---

## Monitoring Checklist

Post-deployment, monitor these metrics:

### Performance
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] No 5xx errors
- [ ] CPU/Memory normal

### Functionality
- [ ] Login success rate > 95%
- [ ] Data deletion works
- [ ] Token verification passes
- [ ] User creation succeeds

### Security
- [ ] No invalid tokens accepted
- [ ] No SQL injection attempts
- [ ] HTTPS enforced
- [ ] Rate limiting working

### User Experience
- [ ] No login errors reported
- [ ] Fast redirects
- [ ] Clear error messages
- [ ] Mobile friendly

---

## Monitoring Dashboard

Create alerts for:

```
⚠️ ALERT RULES:
- Facebook login endpoint: response time > 1000ms
- Login error rate > 5%
- Deletion failures > 1
- Invalid token attempts > 10/hour
- Database connection lost
- Memory usage > 80%
```

---

## Communication Plan

### Before Launch
- [ ] Notify team
- [ ] Update documentation
- [ ] Train support team
- [ ] Prepare rollback plan

### During Launch
- [ ] Monitor closely
- [ ] Have team on standby
- [ ] Log everything
- [ ] Document issues

### After Launch
- [ ] Gather metrics
- [ ] Collect user feedback
- [ ] Analyze success
- [ ] Plan improvements

---

## Troubleshooting During/After Launch

| Issue | Check | Fix |
|-------|-------|-----|
| High error rate | Logs | Check Facebook App settings |
| Slow response | Metrics | Check database connection |
| Token failures | Verification | Verify App Secret is correct |
| Users not created | Database | Check MongoDB connection |
| Deletion not working | Endpoint | Verify callback URL accessible |

---

## Success Criteria

Launch is successful when:

✅ Users can log in with Facebook
✅ No error rate spikes
✅ Data deletion works
✅ Token verification passes
✅ User feedback is positive
✅ No critical bugs reported

---

## Post-Launch Improvements

After stable launch:

1. **Week 1**
   - Monitor metrics
   - Fix any bugs
   - Gather feedback

2. **Week 2**
   - Optimize performance
   - Add rate limiting
   - Improve error messages

3. **Month 1**
   - Add account linking
   - Implement profile import
   - Add analytics

4. **Month 2+**
   - Advanced features
   - A/B testing
   - Optimization

---

## Resources During Launch

Keep these open:

- [Facebook Status](https://status.fb.com) - Service status
- [API Explorer](https://developers.facebook.com/tools/explorer) - Test endpoints
- [Debugger](https://developers.facebook.com/tools/debug) - Debug issues
- [Docs](https://developers.facebook.com/docs) - Reference
- Your Logs - Monitor app errors

---

## Launch Contacts

Have these ready:

- **Technical Lead**: [Contact]
- **DevOps**: [Contact]
- **Frontend Lead**: [Contact]
- **Backend Lead**: [Contact]
- **Support**: [Contact]

---

## Final Checklist (Before Going Live)

```
CODE:
  [ ] All changes committed
  [ ] No console errors
  [ ] Tests passing
  [ ] Build successful

ENVIRONMENT:
  [ ] .env variables set
  [ ] Secrets not in code
  [ ] HTTPS enabled
  [ ] Database backed up

FACEBOOK APP:
  [ ] App ID configured
  [ ] App Secret secure
  [ ] Domains added
  [ ] Redirect URIs set
  [ ] Data deletion URL set
  [ ] Permissions correct

TESTING:
  [ ] Local testing done
  [ ] Staging tested
  [ ] Test users created
  [ ] Deletion tested
  [ ] Token verification tested

MONITORING:
  [ ] Logs configured
  [ ] Alerts set
  [ ] Dashboard ready
  [ ] On-call team notified

DOCUMENTATION:
  [ ] Docs updated
  [ ] Team trained
  [ ] Rollback plan ready
  [ ] Contacts listed

LAUNCH:
  [ ] Backup taken
  [ ] Team ready
  [ ] Monitoring running
  [ ] Support notified

✨ READY TO LAUNCH! ✨
```

---

Generated: January 22, 2026
Purpose: Guide for successful Facebook Login deployment
Status: Ready for production
