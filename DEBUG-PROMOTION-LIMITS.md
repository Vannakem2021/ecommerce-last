# Debug Promotion Usage Limits Issue

## Issue
Total Usage Limit and Per-User Limit are not working - same code can be used multiple times by same user.

## How to Debug

### Step 1: Check Promotion in Database

Open MongoDB and check your promotion document:

```javascript
db.promotions.findOne({ code: "YOUR_CODE" })
```

Look for:
- `usageLimit`: Should be 1
- `userUsageLimit`: Should be 1  
- `usedCount`: Should increment after each order (starts at 0)

**Expected behavior:**
- After 1st order: `usedCount: 1`
- After 2nd order: Should reject (but check `usedCount` value)

---

### Step 2: Check PromotionUsage Records

Check if usage records are being created:

```javascript
db.promotionusages.find({ promotion: ObjectId("YOUR_PROMOTION_ID") })
```

**Expected behavior:**
- After 1st order: 1 document
- After 2nd order: 2 documents (if issue exists)
- Should have: `{ promotion, user, order, discountAmount, usedAt }`

---

### Step 3: Test Validation vs Order Creation

**CRITICAL**: Understand the difference between:

1. **Applying code to cart** (calls `validatePromotionCode`)
   - Checks current `usedCount` 
   - Checks current PromotionUsage count
   - Does NOT increment anything
   
2. **Placing order** (calls `createOrder` → `recordPromotionUsage`)
   - Increments `usedCount`
   - Creates PromotionUsage record
   - This is where limits are enforced for NEXT use

**Test properly:**
```
1. Apply code to cart → ✅ Should work (usedCount: 0)
2. Place order (COMPLETE IT) → Order created (usedCount: 1)
3. Apply SAME code to NEW cart → ❌ Should FAIL
```

**Common mistake:**
```
1. Apply code to cart → Works
2. Remove code from cart
3. Apply code to cart again → Still works (no order placed!)
```

---

### Step 4: Check Order Creation Flow

When you "place order", verify:

1. Order is actually created in database:
```javascript
db.orders.find({ user: ObjectId("YOUR_USER_ID") }).sort({ createdAt: -1 })
```

2. Check if order has `appliedPromotion` field:
```javascript
{
  appliedPromotion: {
    code: "YOUR_CODE",
    promotionId: ObjectId("..."),
    discountAmount: 10,
    ...
  }
}
```

If order doesn't have this field → promotion usage NOT being recorded!

---

### Step 5: Check Console Logs

Add debug logging in `recordPromotionUsage`:

**File:** `lib/actions/promotion.actions.ts` (line ~491)

```typescript
export async function recordPromotionUsage(
  data: IPromotionUsageInput,
  session?: mongoose.ClientSession
) {
  try {
    console.log('🔍 Recording promotion usage:', data) // ADD THIS
    const usage = PromotionUsageInputSchema.parse(data)
    
    // ... rest of code
    
    console.log('✅ Promotion usage recorded successfully') // ADD THIS
    
    return {
      success: true,
      message: 'Promotion usage recorded'
    }
  } catch (error) {
    console.error('❌ Failed to record promotion usage:', error) // ADD THIS
    return {
      success: false,
      message: formatError(error)
    }
  }
}
```

**Watch server console when placing order** - should see these logs.

---

## Possible Issues & Solutions

### Issue 1: Orders Not Completing
**Symptom:** Code can be applied multiple times without placing orders

**Cause:** User is testing by applying/removing code without completing orders

**Solution:** Complete full order flow:
1. Add items to cart
2. Apply promotion code
3. Go to checkout
4. Fill shipping address
5. Select payment method
6. **Click "Place Order"**
7. Wait for success message
8. Try using code again (should fail)

---

### Issue 2: Transaction Rollback
**Symptom:** Order created but usedCount not incremented

**Check:** Database transaction logs

**Cause:** Transaction might be rolling back due to error

**Solution:** Check order.actions.ts line ~186:
```typescript
} catch {
  // Rollback and fallback for non-replica or other tx issues
  try {
    await session.abortTransaction() // Transaction failed!
  } catch {}
  
  // Fallback: create without transaction
  const createdOrder = await Order.create(order)
  if (cart.appliedPromotion) {
    try {
      await recordPromotionUsage({...}) // Check if this runs
    } catch (error) {
      console.error('Failed to record promotion usage (non-tx):', error)
    }
  }
}
```

Add logs to see which path is being taken.

---

### Issue 3: Session/User ID Mismatch
**Symptom:** Per-user limit not working but total limit works

**Cause:** userId might be undefined or different between calls

**Check:** In `validatePromotionCode`, verify userId:
```typescript
// Check user usage limit
if (userId && promo.userUsageLimit > 0) {
  console.log('🔍 Checking user usage for:', userId) // ADD THIS
  const userUsageCount = await PromotionUsage.countDocuments({
    promotion: promo._id,
    user: userId
  })
  console.log('📊 User usage count:', userUsageCount) // ADD THIS
  if (userUsageCount >= promo.userUsageLimit) {
    return { success: false, error: 'You have reached the usage limit for this promotion' }
  }
}
```

---

### Issue 4: Guest Checkout
**Symptom:** Per-user limit not working for guest users

**Cause:** Guest users might not have consistent userId

**Check:** Are you testing with authenticated user or guest?

**Solution:** Per-user limit requires authentication. Test with logged-in user.

---

### Issue 5: Code Applied But Order Failed
**Symptom:** Code works multiple times, but no orders in database

**Cause:** Payment or order creation failing after promotion applied

**Check:** 
1. Look for error messages after clicking "Place Order"
2. Check browser console for errors
3. Check server logs for failures

---

## Step-by-Step Test Protocol

### Test 1: Total Usage Limit (usageLimit = 1)

**Setup:**
```
1. Create promotion:
   - Code: TEST01
   - Type: Fixed $10
   - usageLimit: 1
   - userUsageLimit: 0 (unlimited per user)
```

**Test:**
```
1. Login as User A
2. Add item to cart ($50)
3. Apply code TEST01 → Should work ($40 total)
4. Place order → Should succeed
5. Check DB: usedCount should be 1
6. Create new cart with items
7. Try to apply TEST01 again → Should FAIL
   Error: "Promotion usage limit reached"

8. Login as User B
9. Try to apply TEST01 → Should FAIL (total limit reached)
```

---

### Test 2: Per-User Limit (userUsageLimit = 1)

**Setup:**
```
1. Create promotion:
   - Code: WELCOME10
   - Type: Percentage 10%
   - usageLimit: 0 (unlimited total)
   - userUsageLimit: 1
```

**Test:**
```
1. Login as User A
2. Place order with WELCOME10 → Should work
3. Try to use WELCOME10 again → Should FAIL
   Error: "You have reached the usage limit for this promotion"

4. Login as User B
5. Use WELCOME10 → Should work (different user)
6. Try again as User B → Should FAIL
```

---

### Test 3: Combined Limits

**Setup:**
```
1. Create promotion:
   - Code: FLASH50
   - Type: Fixed $50
   - usageLimit: 3 (only 3 total uses)
   - userUsageLimit: 1 (each user can use once)
```

**Test:**
```
1. User A uses code → Works (total: 1/3, user A: 1/1)
2. User A tries again → FAILS (user limit)
3. User B uses code → Works (total: 2/3, user B: 1/1)
4. User C uses code → Works (total: 3/3, user C: 1/1)
5. User D tries to use → FAILS (total limit reached)
```

---

## Quick Diagnostic Queries

### Check Promotion State
```javascript
db.promotions.findOne(
  { code: "YOUR_CODE" },
  { code: 1, usageLimit: 1, usedCount: 1, userUsageLimit: 1 }
)
```

### Check Who Used It
```javascript
db.promotionusages.aggregate([
  { $match: { promotion: ObjectId("YOUR_PROMOTION_ID") } },
  { $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userInfo"
  }},
  { $project: {
      userName: { $arrayElemAt: ["$userInfo.name", 0] },
      userEmail: { $arrayElemAt: ["$userInfo.email", 0] },
      discountAmount: 1,
      usedAt: 1,
      orderId: "$order"
  }}
])
```

### Check User's Usage Count
```javascript
db.promotionusages.countDocuments({
  promotion: ObjectId("YOUR_PROMOTION_ID"),
  user: ObjectId("YOUR_USER_ID")
})
```

---

## Expected vs Actual

Fill this in after testing:

**Promotion Code:** ________________
**usageLimit:** _____ 
**userUsageLimit:** _____

### Order 1:
- User: ________________
- Order ID: ________________
- usedCount after: _____ (expected: 1)
- PromotionUsage created: Yes / No

### Order 2 (same user):
- Validation result: ________________
- Expected: "You have reached the usage limit"
- Actual: ________________
- usedCount: _____ (should still be 1 if rejected)

---

## What to Report

If issue persists, provide:

1. **Promotion details:**
   ```
   Code: 
   usageLimit:
   userUsageLimit:
   usedCount (current):
   ```

2. **PromotionUsage records:**
   ```
   Count: 
   Users who used it:
   ```

3. **Test flow:**
   ```
   What you did:
   1.
   2.
   3.
   
   What happened:
   
   What should have happened:
   ```

4. **Console logs:** (if you added debug logs)

5. **Browser console errors:** (if any)

---

## Most Likely Cause

Based on similar issues, the most common cause is:

**❌ NOT COMPLETING ORDERS**

Users test by:
1. Apply code → Works
2. Remove code
3. Apply code again → Still works (no order placed!)

The limits only enforce AFTER an order is successfully created.

**✅ PROPER TEST:**
1. Apply code → Works
2. **PLACE ORDER** (complete payment/checkout)
3. Start new cart
4. Apply same code → Should FAIL

Make sure you're completing the full order flow for each test!
