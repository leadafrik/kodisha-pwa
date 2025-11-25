# M-Pesa Integration Development Guide

## Table of Contents
1. [Testing Without API Keys](#testing-without-api-keys)
2. [Getting Sandbox Credentials](#getting-sandbox-credentials)
3. [Testing with Sandbox](#testing-with-sandbox)
4. [Production Setup](#production-setup)
5. [Troubleshooting](#troubleshooting)

---

## Testing Without API Keys

### Mock M-Pesa Service

We've built a complete mock M-Pesa service that lets you develop and test the full payment flow **without any API credentials**. This is perfect for:

- Local development
- CI/CD testing
- Frontend development
- Understanding the payment flow before getting credentials

### Quick Start (No Credentials Needed)

1. **Backend Setup:**
   ```bash
   cd backend
   # Add to your .env file:
   MPESA_USE_MOCK=true
   MPESA_AUTO_CALLBACK=true
   NODE_ENV=development
   ```

2. **Start the Backend:**
   ```bash
   npm run dev
   ```

3. **Access the Test Panel:**
   - Navigate to: `http://localhost:3000/payment-test`
   - This panel lets you:
     - View all payment transactions
     - Manually trigger payment callbacks
     - Test success/failure scenarios
     - Clear test data

### How Mock Mode Works

1. **STK Push Simulation:**
   - When you initiate a payment, the mock service generates fake transaction IDs
   - No real API calls are made to Safaricom
   - Returns a successful STK push response immediately

2. **Auto-Callback (Optional):**
   - If `MPESA_AUTO_CALLBACK=true`, the system automatically triggers a success callback after 5 seconds
   - This simulates the user entering their PIN and completing payment

3. **Manual Callback Testing:**
   - Use the Payment Test Panel to manually trigger different scenarios:
     - ✅ **Success**: Payment completed
     - ❌ **Insufficient Funds**: User has no money
     - ❌ **Cancelled**: User declined the STK push
     - ❌ **Timeout**: No response from user
     - ❌ **Invalid**: Bad request

### Test Phone Numbers

Use these special phone numbers to trigger different scenarios:

```typescript
SUCCESS:             254712345678  // Always succeeds
INSUFFICIENT_FUNDS:  254712345679  // Simulates no money
CANCELLED:           254712345680  // User cancelled
TIMEOUT:             254712345681  // Request timeout
INVALID:             254712345682  // Invalid request
```

### Testing Workflow

1. **Create a Listing:**
   - Go to `/list` and create a land/service/agrovet listing
   - Select a paid plan
   - Enter phone number: `254712345678`

2. **View the Transaction:**
   - Go to `/payment-test` panel
   - See the transaction in "pending" status

3. **Simulate Payment:**
   - Click "✓ Success" button to simulate successful payment
   - The listing status will update from `pending_payment` → `active`
   - Payment status changes from `pending` → `success`

4. **Test Failures:**
   - Click "✗ Fail" to simulate insufficient funds
   - Click "✗ Cancel" to simulate user cancellation
   - Observe how the system handles errors

---

## Getting Sandbox Credentials

### Step 1: Create Daraja Account

1. Go to [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)
2. Click "Sign Up" (top right)
3. Fill in your details:
   - Email address
   - Password
   - Phone number (for verification)
4. Verify your email
5. Log in to your account

### Step 2: Create a Test App

1. Navigate to **"My Apps"** in the dashboard
2. Click **"Create App"**
3. Fill in the form:
   - **App Name**: `Kodisha Test` (or your preference)
   - **Description**: Testing M-Pesa integration for Kodisha platform
   - **Select APIs**: Check **"Lipa Na M-Pesa Online"**
4. Click **"Create App"**

### Step 3: Get Your Credentials

1. Click on your newly created app
2. You'll see:
   - **Consumer Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Consumer Secret**: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
3. Copy these values

### Step 4: Get Shortcode and Passkey

**For Sandbox Testing:**
- **Shortcode**: `174379` (Safaricom Test Shortcode)
- **Passkey**: Request from Daraja portal or check documentation

To get the passkey:
1. In your app details, look for "Test Credentials"
2. Or check the [Lipa Na M-Pesa Online documentation](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)

---

## Testing with Sandbox

### Environment Configuration

Update your `backend/.env`:

```env
# M-Pesa Configuration
MPESA_USE_MOCK=false              # Disable mock mode
MPESA_USE_SANDBOX=true            # Enable sandbox mode
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379            # Safaricom test shortcode
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://your-backend-url.com/api/payments/stk/callback
MPESA_AUTO_CALLBACK=false         # Real callbacks will come from Safaricom
```

### Callback URL Setup

**For Local Development:**

You need a public URL for callbacks. Options:

1. **ngrok** (Recommended):
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start your backend
   npm run dev
   
   # In another terminal, expose it
   ngrok http 5000
   
   # Copy the https URL (e.g., https://abc123.ngrok.io)
   # Update .env:
   MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/stk/callback
   ```

2. **LocalTunnel**:
   ```bash
   npx localtunnel --port 5000
   ```

3. **Deploy to Staging**:
   - Deploy backend to Render/Heroku
   - Use that URL for callbacks

### Sandbox Test Phone Numbers

Safaricom provides special test numbers for sandbox:

```
254708374149  - Success scenario
254719XXXXXX  - Check Daraja docs for other test numbers
```

### Testing Flow

1. **Initiate Payment:**
   ```bash
   # Test the payment endpoint
   curl -X POST http://localhost:5000/api/payments/stk/initiate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "targetType": "land",
       "targetId": "your-listing-id",
       "amount": 99,
       "phone": "254708374149",
       "accountReference": "TEST001",
       "description": "Test payment"
     }'
   ```

2. **Check Response:**
   ```json
   {
     "success": true,
     "message": "STK push initiated",
     "data": {
       "MerchantRequestID": "...",
       "CheckoutRequestID": "...",
       "ResponseCode": "0",
       "ResponseDescription": "Success. Request accepted for processing"
     }
   }
   ```

3. **Wait for Callback:**
   - Safaricom will send a callback to your `MPESA_CALLBACK_URL`
   - Check your backend logs to see the callback received
   - Transaction status will update automatically

### Common Sandbox Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `401` | Invalid credentials | Check consumer key/secret |
| `400` | Bad request | Verify phone format (254...) |
| `500` | Internal error | Check passkey, shortcode |
| `404` | Invalid endpoint | Verify callback URL is accessible |

---

## Production Setup

### Prerequisites

1. **Go Live on Daraja:**
   - Submit your app for production approval
   - Wait for Safaricom to review (can take 1-2 weeks)
   - Provide:
     - Business registration documents
     - Paybill/Till number
     - Use case description

2. **Paybill Account:**
   - You need an active M-Pesa Paybill or Till number
   - Contact Safaricom Business to set this up
   - Costs vary (KSh 2,500+ one-time + monthly fees)

### Production Environment Variables

```env
# Production M-Pesa Configuration
NODE_ENV=production
MPESA_USE_MOCK=false              # Disable mock
MPESA_USE_SANDBOX=false           # Disable sandbox
MPESA_CONSUMER_KEY=prod_consumer_key
MPESA_CONSUMER_SECRET=prod_consumer_secret
MPESA_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_prod_passkey
MPESA_CALLBACK_URL=https://kodisha-backend.com/api/payments/stk/callback
API_BASE_URL=https://kodisha-backend.com/api
```

### Security Checklist

- [ ] Use HTTPS for callback URL
- [ ] Store credentials in environment variables (never in code)
- [ ] Enable rate limiting on payment endpoints (already implemented)
- [ ] Set up Sentry error tracking (already implemented)
- [ ] Monitor transaction logs
- [ ] Set up alerts for failed payments
- [ ] Regular reconciliation with M-Pesa statement

### Production Testing

Before going fully live:

1. **Soft Launch:**
   - Enable for 10-20 test users
   - Monitor closely for 1 week
   - Check callback success rate

2. **Monitoring:**
   - Use `/api/metrics/dashboard` to track payment metrics
   - Set up alerts for:
     - Callback failures
     - High error rates
     - Unusual transaction patterns

3. **Reconciliation:**
   - Daily: Check M-Pesa statement vs. database
   - Use `PaymentTransaction` collection
   - Match `mpesaReceiptNumber` with statement

---

## Troubleshooting

### Issue: "MPesa configuration is missing in environment"

**Solution:**
```bash
# Verify all required variables are set:
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_PASSKEY
```

### Issue: STK Push Not Received on Phone

**Possible Causes:**
1. Phone number format wrong (must be `254XXXXXXXXX`)
2. User's phone is off/out of coverage
3. Sandbox test number not working
4. Production: User hasn't registered for M-Pesa

**Solution:**
- Test with mock mode first
- Verify phone format in logs
- Try different test numbers
- Check user's SIM card has M-Pesa active

### Issue: Callback Never Received

**Possible Causes:**
1. Callback URL not accessible
2. Firewall blocking Safaricom IPs
3. SSL certificate issues

**Solution:**
```bash
# Test if your callback URL is accessible:
curl -X POST https://your-backend.com/api/payments/stk/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "callback"}'

# Should return HTTP 200 or 400 (not 404/500)
```

### Issue: "Transaction not found" in Callback

**Possible Causes:**
- CheckoutRequestID mismatch
- Database connection issue
- Transaction expired

**Solution:**
- Check database for transaction with matching `checkoutRequestID`
- Verify MongoDB is connected
- Check transaction was created successfully in first place

### Debug Mode

Enable verbose logging:

```env
# In backend/.env
DEBUG=mpesa:*
LOG_LEVEL=debug
```

Then check logs:
```bash
# Backend logs will show:
# 🧪 [MOCK M-PESA] STK Push initiated: {...}
# Or real M-Pesa API calls with full request/response
```

---

## Development Workflow Summary

### Phase 1: Local Development (Now)
```bash
MPESA_USE_MOCK=true
MPESA_AUTO_CALLBACK=true
```
- Use mock service
- Test all scenarios in Payment Test Panel
- No credentials needed
- Fast iteration

### Phase 2: Sandbox Testing (When Ready)
```bash
MPESA_USE_MOCK=false
MPESA_USE_SANDBOX=true
MPESA_CONSUMER_KEY=sandbox_key
MPESA_PASSKEY=sandbox_passkey
```
- Use real Safaricom sandbox API
- Test with sandbox phone numbers
- Verify callback handling works
- Use ngrok for local callbacks

### Phase 3: Production (After Approval)
```bash
MPESA_USE_MOCK=false
MPESA_USE_SANDBOX=false
MPESA_CONSUMER_KEY=prod_key
MPESA_SHORTCODE=your_paybill
MPESA_PASSKEY=prod_passkey
```
- Real money transactions
- Monitor closely
- Have rollback plan ready

---

## Quick Reference

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/stk/initiate` | POST | Initiate STK push |
| `/api/payments/stk/callback` | POST | Receive M-Pesa callback |
| `/api/payments-dev/transactions` | GET | View test transactions (dev only) |
| `/api/payments-dev/simulate-callback` | POST | Trigger test callback (dev only) |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MPESA_USE_MOCK` | No | Use mock service (true/false) |
| `MPESA_USE_SANDBOX` | No | Use sandbox API (true/false) |
| `MPESA_CONSUMER_KEY` | Yes* | Daraja API consumer key |
| `MPESA_CONSUMER_SECRET` | Yes* | Daraja API consumer secret |
| `MPESA_SHORTCODE` | Yes* | Paybill/Till number |
| `MPESA_PASSKEY` | Yes* | Lipa Na M-Pesa passkey |
| `MPESA_CALLBACK_URL` | No | Callback endpoint URL |
| `MPESA_AUTO_CALLBACK` | No | Auto-trigger callbacks in mock mode |

*Required unless using mock mode

### Support Resources

- **Daraja Portal**: https://developer.safaricom.co.ke/
- **API Documentation**: https://developer.safaricom.co.ke/APIs
- **Daraja Support**: DarajaAPI@safaricom.co.ke
- **Community**: Daraja API Slack/WhatsApp groups

---

## Next Steps

1. ✅ **You're currently here**: Testing with mock service
2. ⏭️ **Next**: Sign up for Daraja and get sandbox credentials
3. ⏭️ **Then**: Test with sandbox API
4. ⏭️ **Finally**: Apply for production approval

**Estimated Timeline:**
- Sandbox setup: 1 hour
- Sandbox testing: 1-2 days
- Production approval: 1-2 weeks
- Go live: After thorough testing

Good luck! 🚀
