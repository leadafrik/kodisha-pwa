# WhatsApp API Setup Guide via Meta Business Platform

## Complete Guide to Setting Up WhatsApp API for OTP

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Create Meta Business Account](#step-1-create-meta-business-account)
3. [Step 2: Set Up WhatsApp Business Account](#step-2-set-up-whatsapp-business-account)
4. [Step 3: Create Business App](#step-3-create-business-app)
5. [Step 4: Get API Credentials](#step-4-get-api-credentials)
6. [Step 5: Configure Webhooks](#step-5-configure-webhooks)
7. [Step 6: Implement OTP](#step-6-implement-otp)
8. [Step 7: Test Your Integration](#step-7-test-your-integration)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, you'll need:

✅ **Meta/Facebook Business Account** (free)
✅ **WhatsApp Business Account** (requires approval from Meta)
✅ **Business Phone Number** (your company's actual phone number)
✅ **Server with HTTPS** (required for webhooks)
✅ **Ngrok or similar** (for testing locally - optional)
✅ **Node.js/Express** backend (you already have this)

---

## Step 1: Create Meta Business Account

### 1.1 Create Account
1. Go to [Meta Business Suite](https://business.facebook.com)
2. Click **Create Account**
3. Enter your business details:
   - Business name
   - Your name
   - Business email
   - Phone number
   - Business website (optional, but recommended)

### 1.2 Verify Your Business
- Meta will send verification to your email
- Click the verification link
- You may need to verify your phone number

### 1.3 Complete Business Setup
- Add your business address
- Confirm timezone and currency
- Set up payment method (even for free tier)

**Time Required:** 5-10 minutes

---

## Step 2: Set Up WhatsApp Business Account

### 2.1 Access WhatsApp Manager
1. Log in to [Meta Business Suite](https://business.facebook.com)
2. Navigate to **All Tools** → **WhatsApp Manager**
3. Click **Get Started**

### 2.2 Create WhatsApp Business Account
1. Click **Create Account**
2. Enter account name (e.g., "Agrisoko OTP")
3. Select your country
4. Accept terms and conditions

### 2.3 Verify Phone Number
1. Click **Add Phone Number**
2. Enter your **business phone number**
   - Must be a real phone number your business owns
   - Can be a landline or mobile
3. Select verification method:
   - **Automatic SMS** (preferred - fastest)
   - **Phone Call** (backup)
4. Enter the verification code received

**Important:** This phone number will be your WhatsApp Business account identifier

---

## Step 3: Create Business App

### 3.1 Create a New App
1. Go to [Meta Developers](https://developers.facebook.com)
2. Log in with your Meta Business Account
3. Click **Create App** (top right)
4. Select **Business Type** → **Business**
5. Fill in app details:
   - **App Name:** "Agrisoko OTP" or similar
   - **App Purpose:** Select "Integrate and manage backend systems and APIs"
   - **App Category:** Choose "Business & Commerce"

### 3.2 Configure App
1. Add **App Roles** for team members (if needed)
2. Configure **App Settings**:
   - App Display Name: "Agrisoko WhatsApp OTP"
   - Add App Icon (optional)
   - App Domains: `yourdomain.com` and `api.yourdomain.com`

### 3.3 Add WhatsApp Product
1. In your app dashboard, click **+ Add Product**
2. Search for **WhatsApp**
3. Click **Set Up** next to "WhatsApp Business Platform"
4. Click **Get Started**

**Time Required:** 10-15 minutes

---

## Step 4: Get API Credentials

### 4.1 Generate Access Token
1. In your app dashboard, go to **Settings** → **Basic**
2. Copy your **App ID** (save this)
3. Copy your **App Secret** (save this securely)

### 4.2 Create System User (for API access)
1. Go to **Settings** → **Users and Roles**
2. Click **Add** under **System Users**
3. Enter system user name: `agrisoko_whatsapp_api`
4. Select role: **Admin**
5. Click **Create System User**

### 4.3 Generate Access Token for System User
1. Click the created system user
2. Click **Generate New Token**
3. Select:
   - **App:** Your WhatsApp app
   - **Valid For:** Select "Never expires"
4. Click **Generate Token**
5. **Copy and save this token immediately** (you won't see it again)

Format:
```
PERMANENT_ACCESS_TOKEN=EAAU...your_token_here
```

### 4.4 Get Your Phone Number ID
1. Go to **WhatsApp Manager** in Business Suite
2. Select your WhatsApp Business Account
3. Go to **Phone Numbers**
4. Click your verified phone number
5. Copy the **Phone Number ID** (starts with numbers like `103...`)

Format:
```
WHATSAPP_PHONE_NUMBER_ID=103...
WHATSAPP_BUSINESS_ACCOUNT_ID=102...
```

### 4.5 Create Webhook Verification Token
Generate a random string for webhook verification:
```
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_secret_string_here
```

**Example:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5: Configure Webhooks

### 5.1 Set Up Webhook URL
1. In your app dashboard, go to **Messenger** → **Settings**
2. Scroll to **Webhooks**
3. Click **Edit**
4. Enter your webhook details:

**Callback URL:** `https://yourdomain.com/api/webhooks/whatsapp`

**Verify Token:** Use the token you created in 4.5

### 5.2 Subscribe to Webhook Events
After saving, click **Subscribe to this object** and select:
- ✅ `messages` - Incoming messages
- ✅ `message_status` - Delivery/read status
- ✅ `message_template_status_update` - Template approval status

### 5.3 Implement Webhook Handler (Backend)

Create webhook endpoint in your Express backend:

```typescript
// backend/src/routes/webhooks/whatsapp.ts

import { Router, Request, Response } from 'express';

const router = Router();

// Webhook verification (GET request from Meta)
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook events (POST request from Meta)
router.post('/whatsapp', async (req: Request, res: Response) => {
  const body = req.body;

  // Acknowledge receipt immediately
  res.status(200).send('EVENT_RECEIVED');

  // Process webhook asynchronously
  if (body.object === 'whatsapp_business_account') {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        // Handle message events
        if (value.messages) {
          await handleIncomingMessage(value.messages[0]);
        }

        // Handle message status (delivery/read)
        if (value.message_status) {
          await handleMessageStatus(value.message_status[0]);
        }

        // Handle message template events
        if (value.message_template_status_update) {
          await handleTemplateStatus(value.message_template_status_update[0]);
        }
      }
    }
  }
});

async function handleIncomingMessage(message: any) {
  const phoneNumber = message.from;
  const messageId = message.id;
  const messageText = message.text?.body || '';

  console.log(`[WhatsApp] Received message from ${phoneNumber}: ${messageText}`);
  
  // Handle OTP confirmation, button clicks, etc.
  // You can verify OTP here if user replies
}

async function handleMessageStatus(status: any) {
  const messageId = status.id;
  const deliveryStatus = status.status; // sent, delivered, read, failed
  
  console.log(`[WhatsApp] Message ${messageId} status: ${deliveryStatus}`);
  
  // Update database with delivery status
  // Useful for tracking OTP delivery
}

async function handleTemplateStatus(template: any) {
  const templateName = template.message_template_name;
  const status = template.event; // APPROVED, REJECTED, etc.
  
  console.log(`[WhatsApp] Template "${templateName}" status: ${status}`);
}

export default router;
```

---

## Step 6: Implement OTP

### 6.1 Create WhatsApp Service

```typescript
// backend/src/services/whatsappService.ts

import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface SendMessageResponse {
  messages: Array<{
    id: string;
    message_status: string;
  }>;
}

/**
 * Send OTP via WhatsApp using template message
 */
export async function sendOTPViaWhatsApp(
  phoneNumber: string,
  otp: string,
  recipientName: string = 'User'
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Format phone number: ensure it's E.164 format (e.g., +254712345678)
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'otp_verification', // Must match your approved template name
          language: {
            code: 'en_US',
          },
          parameters: {
            body: {
              parameters: [
                {
                  type: 'text',
                  text: otp, // The OTP code
                },
                {
                  type: 'text',
                  text: '5', // Validity in minutes
                },
              ],
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const messageId = response.data.messages[0].id;
    console.log(`[WhatsApp] OTP sent successfully to ${formattedPhone}. Message ID: ${messageId}`);

    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending OTP:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to send OTP',
    };
  }
}

/**
 * Send free-form text message
 */
export async function sendTextMessage(
  phoneNumber: string,
  message: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
    };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending text:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to send message',
    };
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with country code, keep it
  if (!cleaned.startsWith('254') && !cleaned.startsWith('+')) {
    // Kenyan number without country code - add it
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }
  }

  // Add + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Get message status
 */
export async function getMessageStatus(messageId: string): Promise<string> {
  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${messageId}`,
      {
        params: {
          fields: 'status',
          access_token: ACCESS_TOKEN,
        },
      }
    );

    return response.data.status;
  } catch (error) {
    console.error('[WhatsApp] Error getting message status:', error);
    return 'unknown';
  }
}
```

### 6.2 Create Message Template

**IMPORTANT:** WhatsApp requires pre-approved templates for OTP messages.

1. Go to **WhatsApp Manager**
2. Click **Message Templates**
3. Click **Create Template**

**Template Details:**

- **Template Name:** `otp_verification`
- **Category:** `OTP`
- **Language:** English (US)

**Template Content:**

```
Your {{1}} verification code is valid for {{2}} minutes.

Do not share this code with anyone.
```

Parameters:
- {{1}} = OTP code (e.g., 123456)
- {{2}} = Validity period in minutes (e.g., 5)

**Template Example Output:**
```
Your 123456 verification code is valid for 5 minutes.

Do not share this code with anyone.
```

4. Click **Submit for Approval**
5. **Wait for Meta approval** (usually 24-48 hours)

### 6.3 Integrate into Auth Service

```typescript
// backend/src/services/authService.ts

import { sendOTPViaWhatsApp } from './whatsappService';

/**
 * Send OTP to phone number (via WhatsApp or SMS fallback)
 */
export async function sendOTPToPhone(
  phoneNumber: string,
  userEmail?: string
): Promise<{
  success: boolean;
  method: 'whatsapp' | 'sms';
  error?: string;
}> {
  try {
    // Generate OTP
    const otp = generateOTP(6); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Send via WhatsApp first
    const whatsappResult = await sendOTPViaWhatsApp(
      phoneNumber,
      otp,
      'User'
    );

    if (whatsappResult.success) {
      // Store OTP in database
      await saveOTP({
        phoneNumber,
        email: userEmail,
        otp,
        expiresAt,
        method: 'whatsapp',
        messageId: whatsappResult.messageId,
      });

      console.log(`[Auth] OTP sent via WhatsApp to ${phoneNumber}`);
      return {
        success: true,
        method: 'whatsapp',
      };
    }

    // Fallback to SMS if WhatsApp fails
    console.log('[Auth] WhatsApp OTP failed, falling back to SMS...');
    const smsResult = await sendOTPViaSMS(phoneNumber, otp); // Your existing SMS service

    if (smsResult.success) {
      await saveOTP({
        phoneNumber,
        email: userEmail,
        otp,
        expiresAt,
        method: 'sms',
      });

      return {
        success: true,
        method: 'sms',
      };
    }

    return {
      success: false,
      method: 'sms',
      error: 'Failed to send OTP via WhatsApp or SMS',
    };
  } catch (error: any) {
    console.error('[Auth] Error sending OTP:', error);
    return {
      success: false,
      method: 'sms',
      error: error.message,
    };
  }
}

function generateOTP(length: number): string {
  return Math.random().toString().substring(2, 2 + length);
}

async function saveOTP(data: any): Promise<void> {
  // Save to database for verification later
  // Example: await OTPModel.create(data)
}
```

---

## Step 7: Test Your Integration

### 7.1 Environment Variables

Add to your `.env` file:

```bash
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=EAAU...your_token_here
WHATSAPP_PHONE_NUMBER_ID=103...your_phone_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_secret_string
WHATSAPP_BUSINESS_ACCOUNT_ID=102...
```

### 7.2 Test OTP Sending

```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "method": "whatsapp",
  "message": "OTP sent via WhatsApp"
}
```

### 7.3 Test OTP Verification

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "otp": "123456"
  }'
```

### 7.4 Manual Testing

1. **Request OTP** from your login page with your own phone number
2. **Check WhatsApp** - You should receive the OTP message
3. **Enter OTP** in your app to verify it works
4. **Check webhook logs** - Ensure webhooks are being received

---

## Production Deployment

### 8.1 Generate New Access Token for Production

1. Go to Meta Developers
2. Create a new System User for production
3. Generate a **never-expires** token for that user
4. Store in Vercel/production environment variables

### 8.2 Update Environment Variables on Vercel

```bash
# In Vercel Dashboard → Settings → Environment Variables

WHATSAPP_ACCESS_TOKEN=EAAU...production_token
WHATSAPP_PHONE_NUMBER_ID=103...
WHATSAPP_BUSINESS_ACCOUNT_ID=102...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secret_token
```

### 8.3 Update Webhook URL

1. In Meta Developers, update webhook URL to your production domain:
   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```

2. Test webhook with Meta's testing tools:
   - Go to **Messenger** → **Settings** → **Webhooks**
   - Click **Test Subscription**

### 8.4 Test in Production

- Send test OTP from production login page
- Verify WhatsApp message delivery
- Check logs for any errors

---

## Troubleshooting

### Issue: "Invalid access token"
**Solution:**
- Verify token hasn't expired
- Generate new token if needed
- Check that system user has correct permissions

### Issue: "Phone number is invalid"
**Solution:**
- Ensure phone number is in E.164 format: `+254712345678`
- Phone must be verified in WhatsApp Business Account
- Try with different formatting

### Issue: "Message template not found"
**Solution:**
- Ensure template name matches exactly: `otp_verification`
- Check template is APPROVED (not pending)
- Refresh page and try again

### Issue: "Webhook not receiving events"
**Solution:**
- Verify webhook URL is HTTPS
- Check webhook verify token matches in code
- Test with Meta's webhook test tool
- Check server logs for incoming requests
- Ensure firewall allows incoming webhooks

### Issue: "Template approval pending/rejected"
**Solution:**
- Check rejection reason in WhatsApp Manager
- Common issues:
  - Template text too similar to marketing message
  - Variables not properly formatted
  - Missing required information
- Resubmit with corrections

### Issue: "Rate limiting (too many messages)"
**Solution:**
- WhatsApp allows ~1000 messages per day on free tier
- For higher volume, contact Meta sales
- Implement rate limiting in your code:

```typescript
// Rate limit to 1 OTP per phone number per hour
const lastOTPTime = await getLastOTPTime(phoneNumber);
const hourAgo = Date.now() - (60 * 60 * 1000);

if (lastOTPTime > hourAgo) {
  throw new Error('Too many OTP requests. Try again later.');
}
```

---

## Security Best Practices

### ✅ Do This:
- Never expose access tokens in client-side code
- Use HTTPS for all webhook URLs
- Validate webhook signatures (optional but recommended)
- Rate limit OTP sending
- Expire OTPs after 5-10 minutes
- Log all OTP attempts for audit trail
- Use strong webhook verification token
- Rotate tokens periodically

### ❌ Don't Do This:
- Hardcode tokens in source code
- Use HTTP for webhook URL
- Trust webhook without verification
- Allow unlimited OTP requests
- Send OTP via insecure channels
- Log sensitive data (full OTP, tokens)
- Use same token for dev and production

---

## Cost Analysis

| Plan | Cost | Details |
|------|------|---------|
| **Free Tier** | Free | Up to 1,000 messages/day |
| **Standard** | $0.0075/msg | After free tier |
| **Business** | Custom | High volume, dedicated support |

**Estimate for Agrisoko:**
- ~500 OTP sends/day = Free tier sufficient
- ~1-2 months free trial from Meta
- Upgrade when exceeding 1,000/day

---

## Next Steps

1. ✅ Create Meta Business Account
2. ✅ Set up WhatsApp Business Account
3. ✅ Create and configure business app
4. ✅ Get API credentials
5. ✅ Set up webhooks
6. ✅ Create and submit OTP template
7. ✅ Implement backend service
8. ✅ Test with your own number
9. ✅ Deploy to production
10. ✅ Monitor and optimize

---

## Useful Resources

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [WhatsApp Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates/management)
- [Webhook Events Reference](https://developers.facebook.com/docs/whatsapp/webhooks/events)
- [API Error Codes](https://developers.facebook.com/docs/whatsapp/api/errors)

---

## Support

If you encounter issues:

1. **Check Meta Docs** - Most answers are there
2. **Review API Logs** - Meta provides detailed error messages
3. **Test with API Tool** - Use cURL or Postman
4. **Contact Meta Support** - Available through Business Suite

---

**Document Version:** 1.0  
**Last Updated:** January 22, 2026  
**For:** Agrisoko OTP Implementation
