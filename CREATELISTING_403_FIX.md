## CreateListing 403 Error - Root Cause Analysis

**Date:** January 26, 2026  
**Issue:** Create Listing button returns 403 Forbidden  
**Location:** `backend/src/routes/products.ts` - Lines 73-76

---

## Root Cause

The API requires both ID verification AND Selfie verification before allowing product listings:

```typescript
// Line 73-76 in products.ts
if ((!hasId || !hasSelfie) && !hasIdDocs) {
  return res.status(403).json({
    success: false,
    message: "Upload ID front/back and selfie before listing products.",
  });
}
```

**The verification checks:**
- `hasId` = `userDoc.verification?.idVerified` (boolean)
- `hasSelfie` = `userDoc.verification?.selfieVerified` (boolean)  
- `hasIdDocs` = Has ID front/back/selfie files uploaded

**403 Error means:** Either:
1. User's verification flags are NOT set in the database (even though frontend shows "Verified")
2. The verification documents are not properly linked to the user record
3. The JWT token might not have the correct user ID

---

## Quick Fixes to Implement

### Fix 1: Add Better Error Messages in Frontend
**File:** `src/pages/CreateListing.tsx` (Line 330-335)

Show more details about what's failing:

```tsx
if (!response.ok || !result.success) {
  const errorMsg = result.message || "Failed to create listing";
  
  // Parse 403 errors specifically
  if (response.status === 403) {
    setError("Verification required: Please ensure your ID and selfie are verified before listing. Go to Profile > Verification");
  } else {
    setError(errorMsg);
  }
  setUploading(false);
  return;
}
```

### Fix 2: Add Verification Status Check in Frontend
**File:** `src/pages/CreateListing.tsx` (Near line 95)

Before allowing form submission, check if user is actually verified:

```tsx
const canCreateListing = () => {
  const hasIdVerified = user?.verification?.idVerified === true;
  const hasSelfieVerified = user?.verification?.selfieVerified === true;
  
  if (!hasIdVerified || !hasSelfieVerified) {
    return false;
  }
  return true;
};

// Then in your submit handler, check this first:
if (!canCreateListing()) {
  setError("Please verify your ID and take a selfie before creating listings");
  return;
}
```

### Fix 3: Debug Token & User Context
**File:** `src/contexts/AuthContext.tsx`

Add logging to verify the user record is loaded correctly:

```tsx
useEffect(() => {
  if (user) {
    console.log('User Verification Status:', {
      userId: user._id,
      idVerified: user.verification?.idVerified,
      selfieVerified: user.verification?.selfieVerified,
      idDocs: {
        idFront: !!user.idData?.idFront,
        idBack: !!user.idData?.idBack,
        selfie: !!user.idData?.selfie
      }
    });
  }
}, [user]);
```

---

## How to Diagnose the Real Issue

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab → Look for the user mapping log:

```
User mapping - role: admin userType: buyer mapped type: admin
```

Check if verification flags appear in the logs.

### Step 2: Check User Record in MongoDB
```bash
# SSH into backend or use MongoDB Compass
db.users.findOne({ _id: ObjectId("USER_ID_HERE") })

# Look for:
{
  verification: {
    idVerified: true/false,
    selfieVerified: true/false
  },
  idData: {
    idFront: URL or undefined,
    idBack: URL or undefined,
    selfie: URL or undefined
  }
}
```

### Step 3: Check Verification Service
The verification might be pending or failed. Look at:
- `backend/src/routes/verification.ts`
- `backend/src/models/User.ts` - verification field schema

---

## Recommended Solution Path

### 1. Frontend Changes (Quick Win - 30 min)
- Add verification status check before submit
- Improve error messages for 403 errors
- Add debug logging for verification status

### 2. Backend Changes (If needed - 1 hour)
- Review verification status logic
- Add logging to verify that checks are working
- Consider adding endpoint to check verification status

### 3. Database Changes (If needed - 30 min)
- Verify user records have correct flags set
- Run migration if flags are missing

### 4. Testing (30 min)
- Go through create listing flow
- Verify that actual verification is required
- Test with both verified and unverified users

---

## Implementation Priority

| Task | Time | Priority | Impact |
|------|------|----------|--------|
| Better error messages | 15 min | 🔴 High | User knows what to do |
| Frontend verification check | 15 min | 🔴 High | Prevent failed submissions |
| Debug logging | 10 min | 🟡 Medium | Understand the issue |
| Backend review | 30 min | 🟡 Medium | Ensure correctness |
| DB verification | 30 min | 🟢 Low | Only if needed |

---

## Files to Modify

1. **src/pages/CreateListing.tsx**
   - Add verification status check (line ~95)
   - Improve error message for 403 (line ~334)
   - Add debug logging

2. **src/contexts/AuthContext.tsx**
   - Add verification logging in useEffect

3. **backend/src/routes/products.ts** (if needed)
   - Add logging to debug check logic
   - Consider returning detailed error response

---

## Next Steps

1. Implement frontend error message improvement
2. Run the app and check browser console
3. Review user record in MongoDB
4. If verification flags are missing, check verification.ts to see why they weren't set
