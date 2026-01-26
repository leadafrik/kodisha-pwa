# 🔍 Infinite Loop Risk Analysis

## Pages Analyzed

### 🔴 CRITICAL - Infinite Loop Patterns Found

#### 1. **src/contexts/NotificationsContext.tsx** (UNFIXED)
- **Issue:** Line 74 has circular dependency
```tsx
const fetchNotifications = useCallback(..., [user?.id]);

useEffect(() => {
  // ...
  fetchNotifications();
}, [user?.id, fetchNotifications]); // ← fetchNotifications in dependency but it depends on user?.id
```
- **Risk:** When `user?.id` changes → `fetchNotifications` recreated → `useEffect` triggers → calls `fetchNotifications()` again
- **Pages Affected:** Any page using notifications (Messages, Profile, Admin, etc.)
- **Status:** ❌ NEEDS FIX

---

## Pattern Analysis

### ✅ FIXED
- `src/contexts/AuthContext.tsx` - Fixed: `useEffect(..., [])` instead of `[refreshUser]`

### ❌ UNFIXED - Infinite Loop Risk
1. **NotificationsContext** 
   - `fetchNotifications` in useEffect dependencies (Line 74)
   - Affects: Messages, Profile, Notifications endpoints

---

## Recommended Fixes

### NotificationsContext
```tsx
// CURRENT (BROKEN):
useEffect(() => {
  fetchNotifications();
}, [user?.id, fetchNotifications]); // fetchNotifications changes every time user?.id changes

// SHOULD BE:
useEffect(() => {
  if (!user?.id) return;
  
  const fetchPreferences = async () => { ... };
  const cleanup = initializeMonthlyReminderScheduler(user.id);
  
  fetchPreferences();
  // Call the async function directly, don't depend on fetchNotifications
  (async () => {
    try {
      const data = await getNotifications(50, 0, false);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  })();

  return () => cleanup();
}, [user?.id]); // Only depend on user?.id
```

---

## Pages Potentially Affected by Hangs

| Page | Context | Risk | Status |
|------|---------|------|--------|
| /login | AuthContext | ✅ FIXED | Fixed infinite loop |
| /messages | NotificationsContext | 🔴 CRITICAL | May hang on message page |
| /profile | NotificationsContext | 🔴 CRITICAL | May hang if notifications enabled |
| /admin/* | NotificationsContext | 🔴 CRITICAL | May hang in admin pages |
| /favorites | PropertyContext | ✅ OK | Uses empty [] dependency |
| /browse | PropertyContext | ✅ OK | Uses empty [] dependency |

---

## Action Items

- [ ] Fix NotificationsContext `fetchNotifications` circular dependency
- [ ] Audit all other contexts for similar patterns
- [ ] Test MessageContext for infinite loops
- [ ] Review all useCallback with state dependencies
