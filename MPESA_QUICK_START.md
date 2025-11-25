# M-Pesa Testing Quick Start

## 🚀 Start Testing Payments in 2 Minutes (No API Keys Needed!)

### Step 1: Update Backend .env

```bash
cd backend
```

Add these lines to your `.env` file:
```env
MPESA_USE_MOCK=true
MPESA_AUTO_CALLBACK=true
NODE_ENV=development
```

### Step 2: Start Backend

```bash
npm run dev
```

You should see: `🧪 Using MOCK M-Pesa service (no real API calls)`

### Step 3: Start Frontend

```bash
cd ../kodisha-pwa
npm start
```

### Step 4: Test Payment Flow

1. **Log in** to your account

2. **Create a listing:**
   - Go to: http://localhost:3000/list
   - Choose any category (Land, Service, Agrovet, Product)
   - Fill out the form
   - Select a **paid plan** (not free)
   - Enter phone number: `254712345678`
   - Submit the listing

3. **Open Payment Test Panel:**
   - Go to: http://localhost:3000/payment-test
   - You'll see your pending transaction

4. **Simulate Payment:**
   - Click **"✓ Success"** button
   - Wait 1 second
   - Click **"Refresh Transactions"**
   - Status changes to `success` ✅
   - Your listing is now `active` 🎉

### Step 5: Test Failure Scenarios

Create another listing, then in the test panel:
- Click **"✗ Fail"** → Simulates insufficient funds
- Click **"✗ Cancel"** → Simulates user canceling STK push
- Observe how your app handles errors

---

## Test Scenarios Reference

| Button | Simulates | Result |
|--------|-----------|--------|
| ✓ Success | User enters PIN and completes payment | Listing goes live |
| ✗ Fail | User has insufficient funds | Payment fails, listing stays pending |
| ✗ Cancel | User declines STK push | Payment cancelled |

---

## Auto-Callback Mode (Optional)

Want automatic payment simulation? Already enabled!

With `MPESA_AUTO_CALLBACK=true`, payments automatically succeed after 5 seconds:

1. Create listing with paid plan
2. Wait 5 seconds ⏱️
3. Payment automatically completes ✅
4. Listing goes live automatically 🚀

No need to click buttons!

---

## Troubleshooting

### Issue: "Transaction not found"
**Fix:** Restart backend with `MPESA_USE_MOCK=true`

### Issue: Can't access /payment-test
**Fix:** Make sure you're logged in

### Issue: Payment stuck in pending
**Fix:** Click "Refresh Transactions" or restart backend

---

## Next Steps

When ready for real testing:
1. Read `MPESA_DEVELOPMENT_GUIDE.md` for full details
2. Sign up at https://developer.safaricom.co.ke/
3. Get sandbox credentials
4. Switch to sandbox mode

---

**That's it!** You can now test the entire payment flow without any M-Pesa credentials. 🎉

For detailed documentation, see: `MPESA_DEVELOPMENT_GUIDE.md`
