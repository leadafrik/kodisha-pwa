# EMAIL CONFIGURATION UPDATE GUIDE

**Document Version**: 1.0  
**Last Updated**: December 17, 2025  
**Status**: Action Required

---

## CURRENT SITUATION

### Current Setup
```
EMAIL_FROM="Agrisoko <kodisha.254.ke@gmail.com>"
EMAIL_HOST=smtp.gmail.com
EMAIL_PASS=apceygkbwfxifzzn
EMAIL_PORT=587
EMAIL_USER=kodisha.254.ke@gmail.com
```

### Problem
- Email sends from `kodisha.254.ke@gmail.com` (old/legacy Gmail)
- Need to send from `info@agrisoko254ke.com` (professional email)
- Cannot use this Gmail account to send as a different email address

---

## THREE OPTIONS TO FIX THIS

### OPTION 1: SendGrid (RECOMMENDED FOR OTP/TRANSACTIONAL) ⭐

**Best for**: OTP verification, transactional emails, scale

**Steps**:
1. Sign up at https://sendgrid.com (free tier available: 100 emails/day)
2. Verify domain: `agrisoko254ke.com`
3. Generate API key
4. Update `.env`:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=Agrisoko <info@agrisoko254ke.com>
EMAIL_FROM_ADDRESS=info@agrisoko254ke.com
EMAIL_HOST=sendgrid
```

5. Update backend code to use SendGrid:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: userEmail,
  from: 'info@agrisoko254ke.com',
  subject: 'Your Agrisoko OTP',
  html: otpTemplate,
};

await sgMail.send(msg);
```

**Pros**:
- Professional infrastructure
- High delivery rates
- Built for transactional emails
- Better for OTP/security emails
- Analytics and reporting
- Automatic DKIM/SPF setup

**Cons**:
- Requires domain verification (5-10 min setup)
- Free tier: 100 emails/day max

---

### OPTION 2: Create New Gmail Account for info@agrisoko254ke.com

**Best for**: Quick temporary solution

**Steps**:
1. Create Gmail account: `agrisoko254ke@gmail.com` (or similar available name)
2. Go to: https://myaccount.google.com/apppasswords
3. Select: Mail + Windows Computer
4. Generate app password (16-character)
5. Update `.env`:

```env
EMAIL_FROM="Agrisoko <agrisoko254ke@gmail.com>"
EMAIL_HOST=smtp.gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_PORT=587
EMAIL_USER=agrisoko254ke@gmail.com
```

**Pros**:
- No new signup required
- Works immediately
- Simple setup

**Cons**:
- Cannot actually send FROM `info@agrisoko254ke.com` (will show different sender)
- Gmail limits: ~500 emails/day max
- Not professional for business
- Recipient sees `agrisoko254ke@gmail.com` not `info@agrisoko254ke.com`

---

### OPTION 3: Domain Email (BEST LONG-TERM) ✅

**Best for**: Professional, scalable, custom domain

**Steps**:

**Step 1: Register Domain Email**
- Use hosting provider (Bluehost, Namecheap, GoDaddy, etc.)
- Create: `info@agrisoko254ke.com`
- Get SMTP credentials from provider

**Step 2: Update `.env`:**
```env
EMAIL_FROM="Agrisoko <info@agrisoko254ke.com>"
EMAIL_HOST=smtp.yourhostingprovider.com
EMAIL_PASS=your_email_password
EMAIL_PORT=587
EMAIL_USER=info@agrisoko254ke.com
```

**Common Hosting Providers SMTP Settings**:

**Bluehost:**
```env
EMAIL_HOST=mail.agrisoko254ke.com
EMAIL_PORT=465
EMAIL_USER=info@agrisoko254ke.com
```

**Namecheap (Private Email):**
```env
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=587
EMAIL_USER=info@agrisoko254ke.com
```

**GoDaddy:**
```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_USER=info@agrisoko254ke.com
```

**Pros**:
- Looks completely professional
- Full control
- Better deliverability
- Custom branding
- Long-term solution

**Cons**:
- Requires domain hosting ($15-30/year)
- Initial setup (10-15 min)
- May have rate limits depending on provider

---

## RECOMMENDATION: HYBRID APPROACH

Use **both** SendGrid + Domain Email:

1. **SendGrid** for transactional emails (OTP, receipts, confirmations)
   - Configured in `.env` as primary
   - Better delivery rates for critical emails

2. **Domain Email** for general support inquiries
   - Configured as fallback
   - Professional customer-facing emails

### Hybrid `.env` Configuration:

```env
# Primary: SendGrid for OTP/Transactional
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=Agrisoko <info@agrisoko254ke.com>
EMAIL_HOST=sendgrid
SENDGRID_ENABLED=true

# Fallback: Domain Email for Support
SUPPORT_EMAIL=info@agrisoko254ke.com
SUPPORT_EMAIL_HOST=mail.agrisoko254ke.com
SUPPORT_EMAIL_USER=info@agrisoko254ke.com
SUPPORT_EMAIL_PASS=your_domain_email_password
SUPPORT_EMAIL_PORT=587
SENDGRID_ENABLED=true
```

---

## IMPLEMENTATION STEPS (QUICK PATH)

### Step 1: Use SendGrid (Fastest - 10 minutes)

1. Go to https://sendgrid.com/signup (free)
2. Create account
3. Get API key from Settings → API Keys
4. Update `.env` in `backend/`:

```env
# Remove old Gmail config
# EMAIL_FROM="Agrisoko <kodisha.254.ke@gmail.com>"
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PASS=apceygkbwfxifzzn
# EMAIL_PORT=587
# EMAIL_USER=kodisha.254.ke@gmail.com

# New SendGrid config
SENDGRID_API_KEY=SG.your_actual_api_key_here
EMAIL_FROM=Agrisoko <info@agrisoko254ke.com>
EMAIL_HOST=sendgrid
```

5. Update `backend/src/services/emailService.ts` or wherever emails are sent:

```typescript
import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Send OTP
  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM || 'info@agrisoko254ke.com',
    subject: 'Your Agrisoko Verification Code',
    html: otpEmailTemplate(otp),
  });
} else {
  // Fallback to old Gmail (temporary)
  // Use existing nodemailer setup
}
```

6. Commit and push:
```bash
git add backend/.env
git commit -m "Update: Switch email from kodisha.254.ke@gmail.com to SendGrid with info@agrisoko254ke.com"
git push origin main
```

### Step 2: Verify Domain in SendGrid (Optional but recommended)

1. In SendGrid Dashboard: Settings → Sender Authentication
2. Authenticate Domain: `agrisoko254ke.com`
3. Add DNS records to your domain registrar
4. Verify (takes 24-48 hours)

This makes emails look even more professional and improves deliverability.

---

## WHAT WILL BREAK IF NOT CHANGED

❌ **OTP emails** may not send from correct address  
❌ **User verification** emails will show old address  
❌ **Transactional emails** will appear unprofessional  
❌ **Support inquiries** won't route correctly  
❌ **Customer trust** - inconsistent email addresses  

---

## TESTING CHECKLIST

After implementation, test:

- [ ] OTP email sends successfully
- [ ] Email shows from: `Agrisoko <info@agrisoko254ke.com>`
- [ ] All headers show correct sender
- [ ] Email lands in inbox (not spam)
- [ ] Links in email work
- [ ] Mobile rendering looks good
- [ ] Test with different email providers (Gmail, Outlook, etc.)

---

## DECISION MATRIX

| Option | Setup Time | Cost | Professionalism | Scalability | Recommended |
|--------|-----------|------|-----------------|-------------|------------|
| **Gmail (Kodisha)** | 5 min | Free | Low | Low | ❌ No |
| **New Gmail** | 10 min | Free | Medium | Low | ⚠️ Temporary |
| **SendGrid** | 15 min | Free-$10/mo | High | High | ✅ **YES** |
| **Domain Email** | 20 min | $15-30/yr | Very High | High | ✅ **YES** |
| **Both (Hybrid)** | 30 min | Free-$45/yr | Very High | Very High | ✅ **BEST** |

---

## FINAL RECOMMENDATION

**Do this now:**
1. Sign up for SendGrid (2 min)
2. Update `.env` with SendGrid API key (5 min)
3. Update code to use SendGrid (5 min)
4. Test OTP flow (5 min)
5. Commit and push (2 min)

**Later (Week 2):**
- Register domain if not already done
- Authenticate domain in SendGrid
- Set up support email routing

---

## FILES TO UPDATE

```
c:/Users/gordo/kodisha/backend/.env
├─ Remove: EMAIL_FROM, EMAIL_HOST, EMAIL_PASS, EMAIL_PORT, EMAIL_USER
└─ Add: SENDGRID_API_KEY, EMAIL_FROM (new)

c:/Users/gordo/kodisha/backend/src/services/emailService.ts (or similar)
├─ Import SendGrid
├─ Migrate from nodemailer (Gmail SMTP)
└─ Use SendGrid send method

c:/Users/gordo/kodisha/backend/src/routes/auth.ts (or OTP route)
├─ Verify OTP email uses new config
└─ Test with new sender address
```

---

**Ready to proceed?** Which option would you like to implement?
