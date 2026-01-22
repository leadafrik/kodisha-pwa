# Testing Non-Payment Features

## Quick Test Commands

Use these curl commands to test all endpoints. Replace placeholders with real IDs.

### Prerequisites
```bash
# Set your variables
TOKEN="your_jwt_token_here"
USER_ID="buyer_user_id"
SELLER_ID="seller_user_id"
LISTING_ID="listing_id"
CONV_ID="conversation_id"
REVIEW_ID="review_id"

# Base URL
API="http://localhost:5000/api"
```

---

## 📧 Conversation Tests

### 1. Create or Get Conversation
```bash
curl -X POST $API/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "'$SELLER_ID'",
    "listingId": "'$LISTING_ID'"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "_id": "conv_id",
    "buyer": "$USER_ID",
    "seller": "$SELLER_ID",
    "messages": [],
    "status": "active",
    "lastMessageAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### 2. Send Message
```bash
curl -X POST $API/conversations/$CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Is this item still available?"
  }'
```

### 3. Get Conversation
```bash
curl -X GET $API/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. List User Conversations
```bash
# As buyer
curl -X GET "$API/conversations?role=buyer&limit=10&skip=0" \
  -H "Authorization: Bearer $TOKEN"

# As seller
curl -X GET "$API/conversations?role=seller&limit=10&skip=0" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Unread Count
```bash
curl -X GET $API/conversations/unread/count \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

### 6. Archive Conversation
```bash
curl -X PATCH $API/conversations/$CONV_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "archived"
  }'
```

---

## ⭐ Review Tests

### 1. Create Review
```bash
curl -X POST $API/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedId": "'$SELLER_ID'",
    "listingId": "'$LISTING_ID'",
    "rating": 5,
    "comment": "Excellent seller, fast delivery and great communication!",
    "categories": {
      "communication": 5,
      "accuracy": 5,
      "reliability": 5
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "reviewer": "user_id",
    "reviewed": "$SELLER_ID",
    "rating": 5,
    "comment": "Excellent seller...",
    "verified": false,
    "helpful": 0,
    "unhelpful": 0,
    "flagged": false
  }
}
```

### 2. Get Seller Reviews
```bash
curl -X GET "$API/reviews/$SELLER_ID?limit=10&skip=0" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 12,
      "verified": 12,
      "byRating": {
        "5": 8,
        "4": 3,
        "3": 1,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

### 3. Mark Review as Helpful
```bash
curl -X POST $API/reviews/$REVIEW_ID/helpful \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Mark Review as Unhelpful
```bash
curl -X POST $API/reviews/$REVIEW_ID/unhelpful \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Flag Review (Moderation)
```bash
curl -X POST $API/reviews/$REVIEW_ID/flag \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Spam/fake review"
  }'
```

---

## ❤️ Wishlist Tests

### 1. Get Wishlist
```bash
curl -X GET $API/wishlist \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "_id": "wishlist_id",
    "user": "user_id",
    "items": [
      {
        "_id": "item_id",
        "listing": {
          "_id": "listing_id",
          "title": "iPhone 13",
          "price": 45000,
          "category": "Electronics"
        },
        "addedAt": "2024-01-15T10:00:00.000Z",
        "notes": "Check back next week"
      }
    ]
  }
}
```

### 2. Add to Wishlist
```bash
curl -X POST $API/wishlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "'$LISTING_ID'",
    "notes": "Interested, waiting for price drop"
  }'
```

### 3. Remove from Wishlist
```bash
curl -X DELETE $API/wishlist/$LISTING_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update Notes
```bash
curl -X PATCH $API/wishlist/$LISTING_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated notes - good deal!"
  }'
```

### 5. Check if in Wishlist
```bash
curl -X GET $API/wishlist/$LISTING_ID/exists \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "inWishlist": true
  }
}
```

### 6. Get Wishlist Count
```bash
curl -X GET $API/wishlist/count \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## 🔔 Notification Tests

### 1. Get Notifications
```bash
# Get all notifications
curl -X GET "$API/notifications?limit=20&skip=0" \
  -H "Authorization: Bearer $TOKEN"

# Get only unread
curl -X GET "$API/notifications?limit=20&skip=0&unread=true" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notif_id",
        "user": "user_id",
        "type": "new_message",
        "title": "New message from seller",
        "message": "Is this still available?",
        "priority": "high",
        "read": false,
        "actionUrl": "/conversations/conv_id",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 20,
      "skip": 0,
      "hasMore": true
    },
    "unreadCount": 5
  }
}
```

### 2. Get Unread Count
```bash
curl -X GET $API/notifications/unread/count \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### 3. Mark as Read
```bash
curl -X PATCH $API/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Mark All as Read
```bash
curl -X PATCH $API/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Delete Notification
```bash
curl -X DELETE $API/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Integration Test Scenarios

### Scenario 1: Complete Message Flow
```bash
# 1. Create conversation
CONV=$(curl -s -X POST $API/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sellerId":"'$SELLER_ID'","listingId":"'$LISTING_ID'"}' | jq -r '.data._id')

# 2. Send message
curl -X POST $API/conversations/$CONV/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Are you available to meet?"}'

# 3. Get conversation
curl -X GET $API/conversations/$CONV \
  -H "Authorization: Bearer $TOKEN"

# 4. Check unread count
curl -X GET $API/conversations/unread/count \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Complete Review Flow
```bash
# 1. Create review
REVIEW=$(curl -s -X POST $API/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedId":"'$SELLER_ID'",
    "listingId":"'$LISTING_ID'",
    "rating":5,
    "comment":"Excellent experience with this seller!"
  }' | jq -r '.data._id')

# 2. View all seller reviews
curl -X GET $API/reviews/$SELLER_ID \
  -H "Authorization: Bearer $TOKEN"

# 3. Mark helpful
curl -X POST $API/reviews/$REVIEW/helpful \
  -H "Authorization: Bearer $TOKEN"

# 4. Flag review (as different user)
curl -X POST $API/reviews/$REVIEW/flag \
  -H "Authorization: Bearer $OTHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Inappropriate language"}'
```

### Scenario 3: Complete Wishlist Flow
```bash
# 1. Add to wishlist
curl -X POST $API/wishlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"'$LISTING_ID'","notes":"Great deal!"}'

# 2. Check count
curl -X GET $API/wishlist/count \
  -H "Authorization: Bearer $TOKEN"

# 3. View all
curl -X GET $API/wishlist \
  -H "Authorization: Bearer $TOKEN"

# 4. Update notes
curl -X PATCH $API/wishlist/$LISTING_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Seller is verified, safe to buy"}'

# 5. Remove from wishlist
curl -X DELETE $API/wishlist/$LISTING_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Database Verification

### Check Collections Exist
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/kodisha

# List collections
show collections

# Sample queries
db.conversations.find().limit(1).pretty()
db.reviews.find().limit(1).pretty()
db.wishlists.find().limit(1).pretty()
db.notifications.find().limit(1).pretty()
```

### Verify Indexes
```bash
# Check conversation indexes
db.conversations.getIndexes()

# Check review indexes
db.reviews.getIndexes()

# Check notification indexes
db.notifications.getIndexes()
```

### Count Documents
```bash
db.conversations.countDocuments()
db.reviews.countDocuments()
db.wishlists.countDocuments()
db.notifications.countDocuments()
```

---

## ⚠️ Error Test Cases

### 1. Unauthorized (No Token)
```bash
curl -X GET $API/conversations

# Expected: 401 Unauthorized
```

### 2. Validation Error (Missing Field)
```bash
curl -X POST $API/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedId": "'$SELLER_ID'",
    "listingId": "'$LISTING_ID'"
    # Missing: rating, comment
  }'

# Expected: 400 Bad Request
```

### 3. Duplicate Conversation
```bash
# Create once
curl -X POST $API/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sellerId":"'$SELLER_ID'","listingId":"'$LISTING_ID'"}'

# Create again with same params
curl -X POST $API/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sellerId":"'$SELLER_ID'","listingId":"'$LISTING_ID'"}'

# Expected: Returns existing conversation (not error)
```

### 4. Not Found
```bash
curl -X GET $API/conversations/invalid_id \
  -H "Authorization: Bearer $TOKEN"

# Expected: 404 Not Found
```

### 5. Self-Review (Can't review yourself)
```bash
curl -X POST $API/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedId": "'$USER_ID'",  # Same as reviewer
    "listingId": "'$LISTING_ID'",
    "rating": 5,
    "comment": "Great seller!"
  }'

# Expected: 400 Validation Error
```

### 6. Invalid Rating
```bash
curl -X POST $API/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedId": "'$SELLER_ID'",
    "listingId": "'$LISTING_ID'",
    "rating": 10,  # Must be 1-5
    "comment": "Great seller!"
  }'

# Expected: 400 Bad Request
```

---

## 📊 Performance Test

### Load Test with Artillery
```bash
# Install artillery (if not already)
npm install -g artillery

# Create test file artillery.yml
cat > /tmp/api_test.yml << EOF
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"

scenarios:
  - name: "Conversation Flow"
    flow:
      - post:
          url: "/api/conversations"
          headers:
            Authorization: "Bearer YOUR_TOKEN"
          json:
            sellerId: "SELLER_ID"
            listingId: "LISTING_ID"

  - name: "Review Creation"
    flow:
      - post:
          url: "/api/reviews"
          headers:
            Authorization: "Bearer YOUR_TOKEN"
          json:
            reviewedId: "SELLER_ID"
            listingId: "LISTING_ID"
            rating: 5
            comment: "Test review"

  - name: "Notification List"
    flow:
      - get:
          url: "/api/notifications"
          headers:
            Authorization: "Bearer YOUR_TOKEN"
EOF

# Run test
artillery run /tmp/api_test.yml
```

---

## 🎯 Success Criteria

All tests should result in:
- ✅ Status 200/201 for success
- ✅ `success: true` in response
- ✅ Proper data structure returned
- ✅ Collections created in MongoDB
- ✅ Indexes created automatically
- ✅ Notifications generated for user actions
- ✅ Soft-delete working (archived conversations still exist)
- ✅ No console errors in backend logs

---

## 📝 Test Report Template

```markdown
# Test Results - [DATE]

## Conversations
- [ ] Create conversation - PASS/FAIL
- [ ] Send message - PASS/FAIL
- [ ] List conversations - PASS/FAIL
- [ ] Get conversation - PASS/FAIL
- [ ] Archive conversation - PASS/FAIL
- [ ] Unread count - PASS/FAIL

## Reviews
- [ ] Create review - PASS/FAIL
- [ ] Get seller reviews - PASS/FAIL
- [ ] Mark helpful - PASS/FAIL
- [ ] Mark unhelpful - PASS/FAIL
- [ ] Flag review - PASS/FAIL

## Wishlist
- [ ] Get wishlist - PASS/FAIL
- [ ] Add to wishlist - PASS/FAIL
- [ ] Remove from wishlist - PASS/FAIL
- [ ] Update notes - PASS/FAIL
- [ ] Check if exists - PASS/FAIL
- [ ] Get count - PASS/FAIL

## Notifications
- [ ] Get notifications - PASS/FAIL
- [ ] Get unread count - PASS/FAIL
- [ ] Mark as read - PASS/FAIL
- [ ] Mark all as read - PASS/FAIL
- [ ] Delete notification - PASS/FAIL

## Error Cases
- [ ] Unauthorized access - PASS/FAIL
- [ ] Validation errors - PASS/FAIL
- [ ] Not found errors - PASS/FAIL
- [ ] Duplicate handling - PASS/FAIL

## Database
- [ ] Collections created - PASS/FAIL
- [ ] Indexes created - PASS/FAIL
- [ ] Data persists - PASS/FAIL

## Overall
- Status: ✅ READY FOR PRODUCTION / ⚠️ NEEDS FIXES
- Issues: [List any failures]
- Sign-off: [Name, Date]
```
