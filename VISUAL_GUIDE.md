# Non-Payment Features - Visual Integration Guide

## 🗺️ Complete File Structure

```
kodisha/
├── backend/
│   └── src/
│       ├── models/
│       │   ├── Conversation.ts        ✅ NEW (80 lines)
│       │   ├── Review.ts              ✅ NEW (100 lines)
│       │   ├── Wishlist.ts            ✅ NEW (50 lines)
│       │   ├── Notification.ts        ✅ NEW (120 lines)
│       │   └── [existing models...]
│       │
│       ├── services/
│       │   ├── ConversationService.ts ✅ NEW (115 lines)
│       │   ├── ReviewService.ts       ✅ NEW (90 lines)
│       │   ├── WishlistService.ts     ✅ NEW (85 lines)
│       │   ├── NotificationService.ts ✅ NEW (110 lines)
│       │   └── [existing services...]
│       │
│       ├── routes/
│       │   ├── conversations.ts       ✅ NEW (125 lines)
│       │   ├── reviews.ts             ✅ NEW (115 lines)
│       │   ├── wishlist.ts            ✅ NEW (110 lines)
│       │   ├── notifications.ts       ✅ NEW (150 lines)
│       │   └── [existing routes...]
│       │
│       └── app.ts                     ⏳ NEEDS UPDATE (add route registrations)
│
├── src/
│   ├── components/
│   │   ├── ConversationDetail.tsx     ✅ NEW (110 lines)
│   │   ├── ReviewForm.tsx             ✅ NEW (140 lines)
│   │   ├── WishlistPage.tsx           ✅ NEW (150 lines)
│   │   ├── NotificationBell.tsx       ✅ NEW (130 lines)
│   │   └── [existing components...]
│   │
│   └── [existing structure...]
│
├── IMPLEMENTATION_COMPLETE.md         ✅ NEW (complete summary)
├── NON_PAYMENT_FEATURES_GUIDE.md      ✅ NEW (technical guide)
├── INTEGRATION_CHECKLIST.md           ✅ NEW (step-by-step)
├── FEATURES_SUMMARY.md                ✅ NEW (quick reference)
├── TESTING_GUIDE.md                   ✅ NEW (testing commands)
└── [existing files...]
```

---

## 🔄 Data Flow Diagram

### 1. Messaging Flow
```
User A (Buyer)              Conversation DB             User B (Seller)
      │                          │                             │
      │─ Start conversation ──→  │  ←─ Creates conv ──────────│
      │                          │                             │
      │─ Send message ─────────→ │  ── Creates notification ─→ │
      │                          │                             │
      │ ← Get conversation ──────│                             │
      │                          │                             │
      │ ← Show message ──────────│                             │
      │                          │  ← Read message ───────────→ │
```

### 2. Review Flow
```
User A (Reviewer)           Review DB              User B (Reviewed)
      │                        │                          │
      │─ Submit review ──────→ │                          │
      │                        │  ─ Create notification ─→ │
      │ ← Success ─────────────│                          │
      │                        │ ← View review ───────────→ │
      │─ Mark helpful ────────→ │                          │
      │                        │                          │
```

### 3. Wishlist Flow
```
User (Buyer)               Wishlist DB            Listing DB
      │                        │                      │
      │─ Add to wishlist ────→ │                      │
      │─ Populate listing ────→ │ ←─ Get details ────→ │
      │ ← Wishlist updated ────│                      │
      │─ Update notes ────────→ │                      │
      │─ Remove ──────────────→ │                      │
```

### 4. Notification Flow
```
System Event          Notification Service     Notification DB     User
      │                      │                        │              │
      ├─ Message sent ──────→ │                       │              │
      │                      │─ Create notification ─→ │              │
      │                      │                        │─ Get notif ─→ │
      │                      │                        │              │
      │                      │                        │ ← Mark read ──│
      │                      │                        │ ← Delete ────→ │
```

---

## 🔌 Integration Points

### Backend Integration

#### Step 1: Register Routes in app.ts
```typescript
// File: backend/src/app.ts

import conversationRoutes from './routes/conversations';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import notificationRoutes from './routes/notifications';

// ... other imports and setup ...

// Add these lines after other route registrations
app.use('/api/conversations', conversationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);

// ... rest of app setup ...
```

#### Step 2: Ensure Models are Exported
Models are auto-loaded by Mongoose when used in services/routes, but ensure they're properly exported.

### Frontend Integration

#### Step 1: Add Routes to React Router
```typescript
// File: src/App.tsx or src/routes.tsx

import ConversationDetail from './components/ConversationDetail';
import WishlistPage from './components/WishlistPage';

// Add to your route configuration
{
  path: '/conversations/:id',
  element: <ConversationDetail />,
  protected: true,
},
{
  path: '/wishlist',
  element: <WishlistPage />,
  protected: true,
},
```

#### Step 2: Add Notification Bell to Header
```typescript
// File: src/components/Header.tsx (or Navigation.tsx)

import NotificationBell from './NotificationBell';

export const Header = () => {
  return (
    <header>
      {/* Other header content */}
      <div className="flex items-center gap-4">
        {/* Other items */}
        <NotificationBell />
      </div>
    </header>
  );
};
```

---

## 📱 User Interface Flow

### Messaging (Desktop & Mobile)
```
┌─ Conversations List ──────────────┐
│ • John Smith          3 min ago   │
│   "Are you available to meet?"    │
│ • Sarah Jones         1 day ago   │  ← Click to open
│   "Is this still available?"      │
│ • Ahmed Ali           1 week ago  │
│   "Thanks for the great deal"     │
└───────────────────────────────────┘
        ↓
┌─ Conversation Detail ─────────────┐
│                                   │
│ John Smith ⭐4.8 (95 reviews)     │
│ Selling: iPhone 13 Pro            │
│                                   │
│  You: "When can we meet?"  10:30 AM
│  John: "Tomorrow at 2pm?"   10:35 AM
│  You: "Perfect, see you!"   10:40 AM
│                                   │
│ [Type message...] [Send]          │
└───────────────────────────────────┘
```

### Reviews (After Purchase)
```
┌─ Leave Review ────────────────────┐
│ John Smith - iPhone 13 Pro        │
│                                   │
│ Overall Rating: ★★★★★            │
│                                   │
│ Communication:    ★★★★★           │
│ Accuracy:         ★★★★★           │
│ Reliability:      ★★★★★           │
│                                   │
│ Your Review:                      │
│ [Great seller, fast delivery...] │
│                                   │
│           [Submit Review]         │
└───────────────────────────────────┘

        ↓

┌─ Seller Profile ──────────────────┐
│ John Smith ⭐ 4.8                  │
│ (95 verified reviews)             │
│                                   │
│ ⭐⭐⭐⭐⭐ (84%)                      │
│ ⭐⭐⭐⭐☆ (10%)                      │
│ ⭐⭐⭐☆☆ (4%)                       │
│ ⭐⭐☆☆☆ (1%)                       │
│ ⭐☆☆☆☆ (1%)                       │
│                                   │
│ Recent Reviews:                   │
│ • "Excellent!" - Sarah            │
│ • "Fast delivery" - Ahmed         │
└───────────────────────────────────┘
```

### Wishlist
```
┌─ My Wishlist (5 items) ───────────┐
│                                   │
│ ┌─ iPhone 13 Pro ────────────────┐│
│ │ 🖼 [Image]                    ││
│ │ KES 45,000                    ││
│ │ Electronics > Phones           ││
│ │ ⭐ 4.8 (95 reviews)            ││
│ │ 📝 "Check price next week"    ││
│ │ [View Details] [Message]      ││
│ └───────────────────────────────┘│
│                                   │
│ ┌─ Samsung TV 55" ───────────────┐│
│ │ 🖼 [Image]                    ││
│ │ KES 25,000                    ││
│ │ Electronics > TVs              ││
│ │ ⭐ 4.5 (52 reviews)            ││
│ │ 📝 "Good price, safe seller"  ││
│ │ [View Details] [Message]      ││
│ └───────────────────────────────┘│
└───────────────────────────────────┘
```

### Notifications
```
🔔 Notifications (3 unread)

🔴 New message from John Smith (HIGH)
   "Are you available tomorrow?"
   2 minutes ago → [View]

🟠 Review: Sarah left you a review (NORMAL)
   "Great seller, highly recommended!"
   1 hour ago → [View]

🔵 Listing expiring soon (NORMAL)
   "Your iPhone listing expires in 24h"
   3 hours ago → [Renew]

─────────────────────────────────────

[View All]
```

---

## 📊 Database Schema Visual

### Conversation Collection
```json
{
  "_id": ObjectId,
  "buyer": ObjectId → User,
  "seller": ObjectId → User,
  "listing": ObjectId → Listing (optional),
  "messages": [
    {
      "sender": ObjectId → User,
      "text": "Are you available?",
      "timestamp": Date,
      "read": false
    }
  ],
  "status": "active|archived|closed",
  "lastMessage": {...},
  "lastMessageAt": Date,
  "buyerDeletedAt": Date (null),
  "sellerDeletedAt": Date (null),
  "createdAt": Date,
  "updatedAt": Date
}
```

### Review Collection
```json
{
  "_id": ObjectId,
  "reviewer": ObjectId → User,
  "reviewed": ObjectId → User,
  "listing": ObjectId → Listing,
  "rating": 5,
  "comment": "Great seller!",
  "categories": {
    "communication": 5,
    "accuracy": 5,
    "reliability": 5
  },
  "verified": true,
  "helpful": 12,
  "unhelpful": 2,
  "flagged": false,
  "flagReason": null,
  "createdAt": Date,
  "updatedAt": Date
}
```

### Wishlist Collection
```json
{
  "_id": ObjectId,
  "user": ObjectId → User (unique),
  "items": [
    {
      "_id": ObjectId,
      "listing": ObjectId → Listing,
      "addedAt": Date,
      "notes": "Check back next week"
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}
```

### Notification Collection
```json
{
  "_id": ObjectId,
  "user": ObjectId → User,
  "type": "new_message|review_received|...",
  "title": "New message from seller",
  "message": "Is this item available?",
  "priority": "normal|high|urgent",
  "read": false,
  "readAt": null,
  "relatedUser": ObjectId (optional),
  "listing": ObjectId (optional),
  "conversation": ObjectId (optional),
  "review": ObjectId (optional),
  "actionType": "view_message",
  "actionUrl": "/conversations/conv_id",
  "expiresAt": Date (TTL),
  "createdAt": Date
}
```

---

## 🔀 Request/Response Examples

### Create Conversation
```
REQUEST:
POST /api/conversations
{
  "sellerId": "seller123",
  "listingId": "listing456"
}

RESPONSE:
{
  "success": true,
  "data": {
    "_id": "conv789",
    "buyer": {
      "_id": "buyer123",
      "name": "John",
      "email": "john@example.com"
    },
    "seller": {
      "_id": "seller123",
      "name": "Sarah",
      "email": "sarah@example.com"
    },
    "status": "active",
    "lastMessageAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Send Message
```
REQUEST:
POST /api/conversations/conv789/messages
{
  "text": "Is this item still available?"
}

RESPONSE:
{
  "success": true,
  "data": {
    "sender": "buyer123",
    "text": "Is this item still available?",
    "timestamp": "2024-01-15T10:05:00.000Z",
    "read": false
  }
}
```

### Create Review
```
REQUEST:
POST /api/reviews
{
  "reviewedId": "seller123",
  "listingId": "listing456",
  "rating": 5,
  "comment": "Excellent seller, highly recommended!",
  "categories": {
    "communication": 5,
    "accuracy": 5,
    "reliability": 5
  }
}

RESPONSE:
{
  "success": true,
  "data": {
    "_id": "review789",
    "reviewer": "buyer123",
    "reviewed": "seller123",
    "rating": 5,
    "comment": "Excellent seller, highly recommended!",
    "verified": true,
    "helpful": 0,
    "unhelpful": 0
  }
}
```

### Get Notifications
```
REQUEST:
GET /api/notifications?limit=10&unread=true

RESPONSE:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notif123",
        "type": "new_message",
        "title": "New message from Sarah",
        "message": "When can we meet?",
        "priority": "high",
        "read": false,
        "actionUrl": "/conversations/conv789",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "total": 25,
      "hasMore": true
    }
  }
}
```

---

## ⚙️ Service Method Quick Reference

### ConversationService
```typescript
getOrCreateConversation(buyerId, sellerId, listingId?)
sendMessage(conversationId, senderId, text)
getUserConversations(userId, role, limit, skip)
markAsRead(conversationId, userId)
archiveConversation(conversationId, userId)
getUnreadCount(userId)
```

### ReviewService
```typescript
createReview(reviewerId, reviewedId, listingId, rating, comment, categories)
getSellerReviews(sellerId, limit, skip)
markHelpful(reviewId)
markUnhelpful(reviewId)
flagReview(reviewId, reason)
```

### WishlistService
```typescript
getWishlist(userId)
addToWishlist(userId, listingId, notes?)
removeFromWishlist(userId, listingId)
updateNotes(userId, listingId, notes)
isInWishlist(userId, listingId)
getWishlistCount(userId)
```

### NotificationService
```typescript
create(userId, type, title, message, options)
getUserNotifications(userId, limit, skip, options)
markAsRead(notificationId, userId)
markAllAsRead(userId)
deleteNotification(notificationId, userId)
getUnreadCount(userId)
batchCreate(notifications)
```

---

## 🧪 Quick Test Checklist

```
Conversations:
☐ Create conversation
☐ Send message
☐ Get conversation with messages
☐ Archive conversation
☐ Get unread count

Reviews:
☐ Create review
☐ Get seller reviews + stats
☐ Mark helpful
☐ Flag review

Wishlist:
☐ Add to wishlist
☐ Get wishlist
☐ Update notes
☐ Remove from wishlist
☐ Get count

Notifications:
☐ Notification created on new message
☐ Notification created on review
☐ Get notifications
☐ Mark as read
☐ Delete notification
```

---

## 🎯 Implementation Checklist

### Backend Setup (1 hour)
- [ ] Copy 4 model files to `backend/src/models/`
- [ ] Copy 4 service files to `backend/src/services/`
- [ ] Copy 4 route files to `backend/src/routes/`
- [ ] Update `backend/src/app.ts` with route registrations
- [ ] Test: `npm run dev` - server starts
- [ ] Test: POST to /api/conversations - 201 response

### Frontend Setup (1 hour)
- [ ] Copy 4 component files to `src/components/`
- [ ] Add routes to App.tsx
- [ ] Add NotificationBell to Header
- [ ] Test: npm start - app loads without errors
- [ ] Test: Click notification bell - dropdown appears

### Integration Testing (30 min)
- [ ] Run curl test for conversation creation
- [ ] Run curl test for review creation
- [ ] Run curl test for wishlist add
- [ ] Run curl test for notification get
- [ ] Check MongoDB - documents created

### Final Verification (30 min)
- [ ] Test complete message flow (create → send → read)
- [ ] Test complete review flow (create → view stats)
- [ ] Test complete wishlist flow (add → view → remove)
- [ ] Test notification bell (shows count, marks read)
- [ ] Check responsive design on mobile

**Total Time: 3 hours**

---

## 🚀 Deployment Ready!

Once you complete the integration checklist above, you're ready to:
1. Deploy to staging
2. Run user acceptance tests
3. Deploy to production
4. Monitor usage
5. Collect feedback for future enhancements

---

**You now have everything needed to build out these 4 features! 🎉**
