# Non-Payment Features Implementation Guide

## Overview
Implemented 4 core features that don't touch payment processing:
1. **Messaging System** - Buyer-seller conversations
2. **Reviews & Ratings** - Trust building through verified reviews
3. **Wishlist** - Save/bookmark listings
4. **Notifications** - Event-driven user alerts

## Architecture

### Data Layer (Models)
All models are in `backend/src/models/`:

#### Conversation.ts
```
Conversation
├── buyer: ObjectId (required)
├── seller: ObjectId (required)
├── listing: ObjectId (optional, for context)
├── messages: [Message] (embedded)
│   ├── sender: ObjectId
│   ├── text: string
│   ├── timestamp: Date
│   └── read: boolean
├── status: 'active|archived|closed'
├── lastMessage: Message (denormalized)
├── lastMessageAt: Date
├── buyerDeletedAt: Date (soft-delete)
└── sellerDeletedAt: Date (soft-delete)
```

**Indexes:**
- `(buyer, seller, listing)` unique - prevents duplicate conversations
- `(buyer, status, lastMessageAt)` - efficient inbox queries
- `(seller, status, lastMessageAt)` - seller inbox

**Key Features:**
- Soft-delete maintains audit trail
- Message threading in single document (efficient)
- `lastMessage` denormalization for quick inbox display
- Pre-save middleware auto-updates lastMessageAt

#### Review.ts
```
Review
├── reviewer: ObjectId (required)
├── reviewed: ObjectId (required)
├── listing: ObjectId (required)
├── rating: 1-5 (required)
├── comment: string (min 10 chars)
├── categories: {
│   ├── communication: 1-5
│   ├── accuracy: 1-5
│   └── reliability: 1-5
├── verified: boolean (true only after transaction)
├── helpful: number (default 0)
├── unhelpful: number (default 0)
├── flagged: boolean (for moderation)
├── flagReason: string
└── createdAt: Date
```

**Indexes:**
- `(reviewed, verified, createdAt)` - seller profile reviews
- `(listing, createdAt)` - listing reviews
- `(reviewer, createdAt)` - user's own reviews

**Key Features:**
- Verified flag ensures only real transactions count
- Category ratings for detailed trust signals
- Helpful/unhelpful voting (useful for sorting)
- Moderation workflow support (flagged reviews)

#### Wishlist.ts
```
Wishlist
├── user: ObjectId (required, unique)
└── items: [WishlistItem] (embedded)
    ├── listing: ObjectId
    ├── addedAt: Date
    └── notes: string (optional)
```

**Index:**
- `(user)` unique - one wishlist per user
- `(user, items.addedAt)` - sorted queries

**Key Features:**
- Embedded items structure (efficient bulk operations)
- User notes on each saved listing
- Timestamps for "recently saved" sorting

#### Notification.ts
```
Notification
├── user: ObjectId (required)
├── type: enum (8 types)
├── title: string
├── message: string
├── priority: 'normal|high|urgent'
├── read: boolean (default false)
├── readAt: Date
├── relatedUser: ObjectId (who triggered notification)
├── listing: ObjectId (if listing-related)
├── conversation: ObjectId (if message-related)
├── review: ObjectId (if review-related)
├── actionType: string (view_message, view_review, etc.)
├── actionUrl: string (deep link)
├── expiresAt: Date (TTL)
└── createdAt: Date
```

**Indexes:**
- `(user, read, createdAt)` - notification inbox
- `(user, priority, createdAt)` - high-priority filtering
- `expiresAt` TTL index - auto-cleanup after expiration

**Types:**
- `new_inquiry` - buyer inquired about listing
- `new_message` - received message
- `listing_inquiry_response` - seller replied to inquiry
- `review_received` - someone left a review
- `listing_sold` - listing was sold
- `listing_expiring` - listing expiring soon
- `seller_verified` - verification status updated
- `admin_notice` - admin announcement

### Business Logic Layer (Services)
All services are in `backend/src/services/`:

#### ConversationService
Key methods:
- `getOrCreateConversation(buyerId, sellerId, listingId?)` - Get or create
- `sendMessage(conversationId, senderId, text)` - Send message + notify
- `getUserConversations(userId, role, limit, skip)` - List conversations
- `markAsRead(conversationId, userId)` - Mark messages as read
- `archiveConversation(conversationId, userId)` - Soft-delete
- `getUnreadCount(userId)` - Count unread conversations

#### ReviewService
Key methods:
- `createReview(reviewerId, reviewedId, listingId, rating, comment, categories)` - Create + notify
- `getSellerReviews(sellerId, limit, skip)` - Get reviews with stats
- `markHelpful(reviewId)` - Increment helpful counter
- `markUnhelpful(reviewId)` - Increment unhelpful counter
- `flagReview(reviewId, reason)` - Flag for moderation

#### WishlistService
Key methods:
- `getWishlist(userId)` - Get or create wishlist
- `addToWishlist(userId, listingId, notes?)` - Add item
- `removeFromWishlist(userId, listingId)` - Remove item
- `updateNotes(userId, listingId, notes)` - Update item notes
- `isInWishlist(userId, listingId)` - Check if exists
- `getWishlistCount(userId)` - Count items

#### NotificationService
Key methods:
- `create(userId, type, title, message, options)` - Create single notification
- `getUserNotifications(userId, limit, skip, options)` - List notifications
- `markAsRead(notificationId, userId)` - Mark read
- `markAllAsRead(userId)` - Mark all as read
- `deleteNotification(notificationId, userId)` - Delete
- `getUnreadCount(userId)` - Count unread
- `batchCreate(notifications)` - Create multiple (for events)

### API Routes Layer
All routes in `backend/src/routes/`:

#### Conversations Routes
```
GET    /api/conversations               - List user's conversations
POST   /api/conversations               - Create/get conversation
GET    /api/conversations/:id           - Get specific conversation
POST   /api/conversations/:id/messages  - Send message
PATCH  /api/conversations/:id/status    - Archive/close
GET    /api/conversations/unread/count  - Get unread count
```

#### Reviews Routes
```
POST   /api/reviews                     - Create review
GET    /api/reviews/:sellerId           - Get seller's reviews + stats
POST   /api/reviews/:id/helpful         - Mark helpful
POST   /api/reviews/:id/unhelpful       - Mark unhelpful
POST   /api/reviews/:id/flag            - Flag for moderation
```

#### Wishlist Routes
```
GET    /api/wishlist                    - Get user's wishlist
POST   /api/wishlist                    - Add item to wishlist
DELETE /api/wishlist/:listingId         - Remove from wishlist
PATCH  /api/wishlist/:listingId         - Update item notes
GET    /api/wishlist/:listingId/exists  - Check if in wishlist
GET    /api/wishlist/count              - Get count
```

#### Notifications Routes
```
GET    /api/notifications               - List notifications
GET    /api/notifications/unread/count  - Get unread count
PATCH  /api/notifications/:id/read      - Mark as read
PATCH  /api/notifications/read-all      - Mark all as read
DELETE /api/notifications/:id           - Delete notification
```

## Frontend Integration

### Components Created

#### ConversationDetail.tsx
Displays single conversation with message history and input.

**Props:**
- `conversationId: string` - Conversation ID
- `currentUserId: string` - Current user ID

**Features:**
- Real-time message display
- Auto-scroll to latest
- Message timestamps
- Unread indicator

#### ReviewForm.tsx
Form to create review with ratings.

**Props:**
- `reviewedId: string` - Person being reviewed
- `listingId: string` - Related listing
- `onSuccess?: () => void` - Success callback

**Features:**
- 5-star rating selector
- Category ratings (communication, accuracy, reliability)
- Comment textarea with char counter
- Form validation

#### WishlistPage.tsx
Full page displaying user's wishlist.

**Features:**
- Grid display of wishlist items
- Quick remove buttons
- Seller trust scores
- Personal notes on items
- "View Details" and "Message Seller" actions

#### NotificationBell.tsx
Bell icon component with dropdown notification list.

**Features:**
- Unread count badge
- Priority color-coding (urgent=red, high=orange, normal=blue)
- Auto-refetch every 30s
- Deep linking via actionUrl
- Mark as read on click

## Integration Steps

### 1. Register Routes in app.ts
```typescript
import conversationRoutes from './routes/conversations';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import notificationRoutes from './routes/notifications';

// Add to express app
app.use('/api/conversations', conversationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
```

### 2. Add Frontend Components to App
```typescript
import ConversationDetail from './components/ConversationDetail';
import ReviewForm from './components/ReviewForm';
import WishlistPage from './components/WishlistPage';
import NotificationBell from './components/NotificationBell';

// Add to navigation/header
<NotificationBell />

// Add pages to router
<Route path="/conversations/:id" element={<ConversationDetail />} />
<Route path="/reviews/:userId" element={<ReviewList />} />
<Route path="/wishlist" element={<WishlistPage />} />
```

### 3. Hook into Existing Events
The services automatically create notifications for:
- New message received
- Review received (with priority based on rating)

### 4. Manual Notification Creation
For other events, use NotificationService.batchCreate():
```typescript
// When listing is sold
await NotificationService.batchCreate([
  {
    userId: seller._id,
    type: 'listing_sold',
    title: 'Listing Sold!',
    message: listing.title,
    priority: 'high',
  },
]);

// When listing expires
await NotificationService.batchCreate([
  {
    userId: seller._id,
    type: 'listing_expiring',
    title: 'Listing Expiring',
    message: 'Your listing will expire in 24 hours',
    priority: 'normal',
  },
]);
```

## Database Considerations

### Indexes
All models have optimized indexes for common queries:
- Conversation: Compound index for inbox queries
- Review: Multiple indexes for different access patterns
- Wishlist: User lookup + sorting
- Notification: User + read status + timestamp

### Soft-Delete Strategy
Conversations use `buyerDeletedAt` and `sellerDeletedAt` to:
- Preserve audit trail
- Allow recovery
- Show user they deleted conversation
- Other user still has their copy

### TTL Indexes
Notifications with `expiresAt` are automatically deleted by MongoDB:
- Reduces storage
- Saves query filtering
- Good for temporary alerts

## Query Optimization Tips

### Conversation Inbox
```typescript
// Good - uses index
Conversation.find({
  buyer: userId,
  buyerDeletedAt: null
}).sort({ lastMessageAt: -1 });

// Better - uses compound index
Conversation.find({
  buyer: userId,
  status: 'active',
  buyerDeletedAt: null
}).sort({ lastMessageAt: -1 });
```

### Review Stats
```typescript
// Get average rating, count, distribution
Review.aggregate([
  { $match: { reviewed: sellerId, verified: true } },
  {
    $group: {
      _id: null,
      averageRating: { $avg: '$rating' },
      totalReviews: { $sum: 1 },
    },
  },
]);
```

### Unread Notifications
```typescript
// Efficient unread count
Notification.countDocuments({
  user: userId,
  read: false
});

// More efficient bulk mark-as-read
Notification.updateMany(
  { user: userId, read: false },
  { read: true, readAt: new Date() }
);
```

## Future Enhancements

### Short-term
- [ ] Conversation search
- [ ] Review moderation dashboard
- [ ] Conversation typing indicators
- [ ] Message read receipts
- [ ] Notification preferences (turn off by type)

### Medium-term
- [ ] Real-time messaging (WebSocket)
- [ ] Review photos
- [ ] Block users from messaging
- [ ] Automatic spam detection
- [ ] Conversation templates (quick replies)

### Long-term
- [ ] AI-powered review summaries
- [ ] Smart notification timing
- [ ] Messaging file uploads
- [ ] Review analytics for sellers
- [ ] Notification recommendations

## Testing Checklist

### Manual Testing
- [ ] Create conversation between two users
- [ ] Send and receive messages
- [ ] Archive conversation
- [ ] View messages as read/unread
- [ ] Create review with valid comment
- [ ] Check review appears in stats
- [ ] Add item to wishlist
- [ ] Remove from wishlist
- [ ] Receive notification on message
- [ ] Mark notification as read
- [ ] Bell icon shows unread count

### Integration Testing
- [ ] Conversation created automatically on first message
- [ ] Messages populate in-memory (no page refresh needed)
- [ ] Reviews don't appear until verified=true
- [ ] Wishlist accessible from listing page
- [ ] Notifications persist across sessions
- [ ] TTL index removes expired notifications
- [ ] Soft-delete maintains data integrity

### Performance Testing
- [ ] Inbox loads in <500ms with 100 conversations
- [ ] Review stats calculated in <100ms
- [ ] Notification list loads in <200ms
- [ ] Message send completes in <100ms

## Error Handling

All services throw `ErrorService` errors:
- `VALIDATION_ERROR` (400) - Invalid input
- `NOT_FOUND` (404) - Resource doesn't exist
- `UNAUTHORIZED` (403) - Access denied
- `CONFLICT` (409) - Duplicate entry

Frontend handles errors gracefully with user messages.

## Security

- All routes require `authenticateToken` middleware
- Soft-delete prevents unauthorized recovery
- Users can only see own conversations/notifications
- Reviews require completion verification (future)
- Moderation flags for spam review cleanup

## Deployment Notes

1. Run migrations to create indexes
2. Seed test data if needed
3. Monitor database disk usage (TTL cleanup)
4. Set up notification email alerts
5. Configure cron job for batch notifications
6. Test in staging before production

## Troubleshooting

**Q: Messages not showing?**
- Check conversation has correct buyer/seller IDs
- Verify timestamps are valid Date objects
- Check message text is not empty

**Q: Review not appearing?**
- Verify `verified` flag is true
- Check listing ID matches review listing
- Confirm user IDs are different (can't review self)

**Q: Wishlist empty?**
- Check user has wishlist document created
- Verify listing IDs exist
- Check items array in wishlist

**Q: Notifications not arriving?**
- Verify user ID in notification matches correct user
- Check notification expiresAt hasn't passed
- Confirm NotificationService.create was called

## Support

For questions or issues:
1. Check MongoDB connection in logs
2. Verify auth middleware is working
3. Test endpoint directly with curl/Postman
4. Check browser console for frontend errors
5. Review service layer error handling
