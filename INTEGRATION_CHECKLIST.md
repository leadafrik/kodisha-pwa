# Integration Checklist for Non-Payment Features

## ✅ Completed Components

### Backend
- [x] Conversation model - `backend/src/models/Conversation.ts`
- [x] Review model - `backend/src/models/Review.ts`
- [x] Wishlist model - `backend/src/models/Wishlist.ts`
- [x] Notification model - `backend/src/models/Notification.ts`
- [x] ConversationService - `backend/src/services/ConversationService.ts`
- [x] ReviewService - `backend/src/services/ReviewService.ts`
- [x] WishlistService - `backend/src/services/WishlistService.ts`
- [x] NotificationService - `backend/src/services/NotificationService.ts`
- [x] Conversations routes - `backend/src/routes/conversations.ts`
- [x] Reviews routes - `backend/src/routes/reviews.ts`
- [x] Wishlist routes - `backend/src/routes/wishlist.ts`
- [x] Notifications routes - `backend/src/routes/notifications.ts`

### Frontend
- [x] ConversationDetail component
- [x] ReviewForm component
- [x] WishlistPage component
- [x] NotificationBell component

### Documentation
- [x] NON_PAYMENT_FEATURES_GUIDE.md - Complete API & implementation guide

## 📋 Next Steps to Integrate

### Step 1: Register Models in MongoDB Connection
**File:** `backend/src/models/index.ts` or where models are exported

```typescript
import Conversation from './Conversation';
import Review from './Review';
import Wishlist from './Wishlist';
import Notification from './Notification';

export {
  Conversation,
  Review,
  Wishlist,
  Notification,
};
```

### Step 2: Register Routes in Express App
**File:** `backend/src/app.ts`

```typescript
import conversationRoutes from './routes/conversations';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import notificationRoutes from './routes/notifications';

// Add these after other route registrations
app.use('/api/conversations', conversationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
```

### Step 3: Create Frontend Components Directory
If not already exists:
```bash
mkdir -p src/components/messaging
mkdir -p src/components/reviews
mkdir -p src/components/wishlist
mkdir -p src/components/notifications
```

Move created components to appropriate directories:
```bash
# Move to subdirectories
mv src/components/ConversationDetail.tsx src/components/messaging/
mv src/components/ReviewForm.tsx src/components/reviews/
mv src/components/WishlistPage.tsx src/components/wishlist/
mv src/components/NotificationBell.tsx src/components/notifications/
```

### Step 4: Add Notification Bell to Header/Navigation
**File:** `src/components/Header.tsx` or `src/components/Navigation.tsx`

```typescript
import NotificationBell from './notifications/NotificationBell';

export const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between p-4">
        {/* Logo and navigation items */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Other header items */}
          <NotificationBell />
          {/* User menu */}
        </div>
      </div>
    </header>
  );
};
```

### Step 5: Add Routes to React Router
**File:** `src/routes/AppRoutes.tsx` or similar

```typescript
import ConversationDetail from '../components/messaging/ConversationDetail';
import WishlistPage from '../components/wishlist/WishlistPage';
import ReviewForm from '../components/reviews/ReviewForm';

export const routes = [
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
  // Add review routes based on your structure
];
```

### Step 6: Create Conversation List Component (not yet created)
**File:** `src/components/messaging/ConversationList.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MessageCircle } from 'lucide-react';

const ConversationList: React.FC = () => {
  const { data: convoData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await axios.get('/api/conversations');
      return response.data.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const conversations = convoData?.conversations || [];

  return (
    <div className="space-y-2">
      {conversations.map((convo: any) => (
        <div
          key={convo._id}
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">
                {convo.buyer._id === currentUserId
                  ? convo.seller.name
                  : convo.buyer.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {convo.lastMessage?.text}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(convo.lastMessageAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
```

### Step 7: Create Review Display Component (not yet created)
**File:** `src/components/reviews/ReviewList.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Star } from 'lucide-react';

const ReviewList: React.FC<{ sellerId: string }> = ({ sellerId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', sellerId],
    queryFn: async () => {
      const response = await axios.get(`/api/reviews/${sellerId}`);
      return response.data.data;
    },
  });

  if (isLoading) return <div>Loading reviews...</div>;

  const { reviews, stats } = data;

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Seller Reviews</h3>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-3xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Based on {stats.totalReviews} verified reviews
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review._id} className="border-b pb-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold">{review.reviewer.name}</h4>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={`${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-700 mb-2">{review.comment}</p>
            <p className="text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
```

### Step 8: Add Wishlist Button to Listing Detail
**File:** `src/components/ListingDetail.tsx` or similar

```typescript
import WishlistButton from './wishlist/WishlistButton';

// Inside listing detail JSX
<div className="flex gap-2">
  <button className="flex-1 bg-blue-500 text-white py-2 rounded">
    Message Seller
  </button>
  <WishlistButton listingId={listingId} />
</div>
```

**File:** `src/components/wishlist/WishlistButton.tsx` (new)

```typescript
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Heart } from 'lucide-react';

const WishlistButton: React.FC<{ listingId: string }> = ({ listingId }) => {
  const { data: existsData } = useQuery({
    queryKey: ['wishlist', listingId],
    queryFn: async () => {
      const response = await axios.get(`/api/wishlist/${listingId}/exists`);
      return response.data.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/wishlist', { listingId });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/wishlist/${listingId}`);
    },
  });

  const inWishlist = existsData?.inWishlist;

  return (
    <button
      onClick={() =>
        inWishlist ? removeMutation.mutate() : addMutation.mutate()
      }
      className="p-2 border rounded hover:bg-gray-50"
    >
      <Heart
        size={24}
        className={inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}
      />
    </button>
  );
};

export default WishlistButton;
```

### Step 9: Add Review Display to Seller Profile
**File:** `src/components/SellerProfile.tsx` or similar

```typescript
import ReviewList from './reviews/ReviewList';

// Inside seller profile component
<section className="my-8">
  <ReviewList sellerId={sellerId} />
</section>
```

### Step 10: Add Review Form Modal
**File:** `src/components/reviews/ReviewModal.tsx` (new)

```typescript
import React, { useState } from 'react';
import ReviewForm from './ReviewForm';

const ReviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reviewedId: string;
  listingId: string;
}> = ({ isOpen, onClose, reviewedId, listingId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <ReviewForm
          reviewedId={reviewedId}
          listingId={listingId}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
};

export default ReviewModal;
```

## 🧪 Testing the Integration

### 1. Backend Test
```bash
# Test conversation creation
curl -X POST http://localhost:5000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sellerId":"SELLER_ID","listingId":"LISTING_ID"}'

# Test sending message
curl -X POST http://localhost:5000/api/conversations/CONV_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello!"}'

# Test creating review
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedId":"SELLER_ID",
    "listingId":"LISTING_ID",
    "rating":5,
    "comment":"Great seller, highly recommended!"
  }'

# Test adding to wishlist
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"LISTING_ID","notes":"Check back next week"}'
```

### 2. Frontend Test
1. Navigate to a listing page
2. Click heart icon to add to wishlist
3. Go to `/wishlist` to see saved listings
4. Click "Message Seller" to start conversation
5. Send a message and see it appear in real-time
6. Click notification bell to see incoming notifications
7. After transaction, leave a review

### 3. Database Test
```bash
# Check conversations created
db.conversations.find().pretty()

# Check reviews created
db.reviews.find().pretty()

# Check wishlists created
db.wishlists.find().pretty()

# Check notifications created
db.notifications.find().pretty()
```

## 📊 Feature Summary

### Messaging
- ✅ Conversation threading
- ✅ Auto-notify on new message
- ✅ Soft-delete support
- ✅ Unread indicators
- ⏳ Typing indicators (future)
- ⏳ Message search (future)

### Reviews
- ✅ 5-star rating system
- ✅ Category ratings
- ✅ Helpful/unhelpful voting
- ✅ Moderation flagging
- ✅ Verified badge
- ⏳ Review photos (future)
- ⏳ Response from seller (future)

### Wishlist
- ✅ Save listings
- ✅ Personal notes
- ✅ Quick remove
- ✅ Browse saved items
- ⏳ Price drop alerts (future)
- ⏳ Export wishlist (future)

### Notifications
- ✅ Real-time event alerts
- ✅ Priority levels
- ✅ Deep linking
- ✅ Auto-expiration
- ✅ Unread count badge
- ⏳ Email notifications (future)
- ⏳ Notification preferences (future)

## ⚠️ Important Notes

1. **Authentication**: All routes require `authenticateToken` middleware
2. **CORS**: Ensure frontend domain is whitelisted
3. **Indexes**: MongoDB will create indexes on first access, but can pre-create:
   ```javascript
   db.conversations.createIndex({ buyer: 1, seller: 1, listing: 1 }, { unique: true })
   db.reviews.createIndex({ reviewed: 1, verified: 1, createdAt: -1 })
   db.wishlists.createIndex({ user: 1 }, { unique: true })
   db.notifications.createIndex({ user: 1, read: 1, createdAt: -1 })
   ```

4. **Soft-Delete Data Integrity**: When querying conversations, always filter:
   ```typescript
   // For buyer
   Conversation.find({ buyer: userId, buyerDeletedAt: null })
   
   // For seller
   Conversation.find({ seller: userId, sellerDeletedAt: null })
   ```

5. **Performance**: Review stats query runs aggregation—consider caching for high-traffic sellers

## 🚀 Deployment Checklist

Before going to production:

- [ ] All 4 models have indexes created
- [ ] Routes registered in main app.ts
- [ ] Frontend components imported in App.tsx
- [ ] NotificationBell added to header
- [ ] Auth middleware verified working
- [ ] Error handling tested
- [ ] Database connection confirmed
- [ ] CORS configured
- [ ] Rate limiting applied (optional)
- [ ] Logging set up for feature usage
- [ ] Monitoring alerts configured

## 📞 Quick Reference

### Key Files
| File | Purpose |
|------|---------|
| `backend/src/models/Conversation.ts` | Conversation schema |
| `backend/src/models/Review.ts` | Review schema |
| `backend/src/models/Wishlist.ts` | Wishlist schema |
| `backend/src/models/Notification.ts` | Notification schema |
| `backend/src/services/*.ts` | Business logic |
| `backend/src/routes/*.ts` | API endpoints |
| `src/components/messaging/*` | Chat UI |
| `src/components/reviews/*` | Review UI |
| `src/components/wishlist/*` | Wishlist UI |
| `src/components/notifications/*` | Notification UI |

### Common Tasks

**Get user's conversations:**
```typescript
const { conversations } = await ConversationService.getUserConversations(userId, 'buyer');
```

**Create review:**
```typescript
const review = await ReviewService.createReview(reviewerId, reviewedId, listingId, 5, 'Great!');
```

**Add to wishlist:**
```typescript
const wishlist = await WishlistService.addToWishlist(userId, listingId, 'notes');
```

**Send notification:**
```typescript
await NotificationService.create(userId, 'new_message', 'New message', 'Hello!');
```

That's it! Your non-payment features are ready to integrate and deploy.
