# Promotion Creator Field Fix & Migration Guide

## Problem Solved

The promotion detail page was showing "System" for the "Created by" field instead of showing the actual staff user's name who created the promotion.

## Root Causes Identified

1. **Legacy Data**: Existing promotions in the database were created before proper `createdBy` tracking was implemented
2. **Required Field Conflict**: The schema marked `createdBy` as required, causing issues with old promotions
3. **Missing Migration**: No migration script existed to update legacy promotions

## Changes Made

### 1. Schema Update
**File**: `lib/db/models/promotion.model.ts`

Changed the `createdBy` field from required to optional for backwards compatibility:

```typescript
createdBy: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: false, // Made optional for backwards compatibility
}
```

### 2. Type Definitions
**File**: `types/index.ts`

Updated the type to allow optional/null values:

```typescript
export type IPromotionDetails = IPromotionInput & {
  _id: string
  usedCount: number
  createdAt: Date
  updatedAt: Date
  createdBy?: {
    _id: string
    name: string
  } | string | null  // Now optional and allows null
}
```

### 3. Enhanced Display Logic
**File**: `app/[locale]/admin/promotions/[id]/promotion-details.tsx`

Improved the display to handle all scenarios:

```typescript
{promotion.createdBy ? (
  typeof promotion.createdBy === 'object' && promotion.createdBy?.name 
    ? promotion.createdBy.name 
    : typeof promotion.createdBy === 'string' && promotion.createdBy.length > 0
    ? `User ID: ${promotion.createdBy.substring(0, 8)}...`
    : 'Unknown User'
) : (
  <span className='text-muted-foreground'>Not tracked (legacy promotion)</span>
)}
```

**Display Logic**:
- ✅ Shows staff name if creator exists and is populated
- ✅ Shows truncated User ID if user was deleted
- ✅ Shows "Not tracked (legacy promotion)" for old promotions without creator
- ✅ Shows "Unknown User" as fallback

### 4. Migration Script
**File**: `scripts/migrate-promotion-created-by.ts`

Created a migration script to update legacy promotions.

**Added npm script**: `package.json`
```json
"migrate:promotions": "npx tsx ./scripts/migrate-promotion-created-by.ts"
```

## How to Fix Your Existing Promotions

### Step 1: Check Current State

First, **restart your development server** to ensure the latest code is running:

```bash
# Stop the server (Ctrl+C), then restart
npm run dev
```

Then view a promotion detail page to see what it displays for "Created by":
- ✅ If it shows a staff name → Already working correctly
- ⚠️ If it shows "Not tracked (legacy promotion)" → Run migration (Step 2)
- ⚠️ If it shows "Unknown User" → User account was deleted
- ⚠️ If it shows "System" → You're running old code, restart server

### Step 2: Run Migration Script

Run this command to update all existing promotions:

```bash
npm run migrate:promotions
```

**What the script does:**
1. Connects to your database
2. Finds all promotions without a `createdBy` field
3. Finds the first admin user in your system
4. Updates all legacy promotions to be owned by that admin user
5. Reports the number of promotions updated

**Expected output:**
```
🔄 Starting promotion migration...
✅ Connected to database
📊 Found 5 promotions without creator
👤 Using admin user: John Admin (admin@example.com) as default creator
✅ Migration completed successfully!
   - Promotions updated: 5
   - All promotions now have creator: John Admin
🔌 Database connection closed
🎉 Migration script finished
```

### Step 3: Verify

After running the migration:
1. Refresh the promotion detail page
2. The "Created by" field should now show the admin user's name
3. Newly created promotions will show the actual creator

## Future Behavior

### For New Promotions
All new promotions created after this fix will automatically track the creator:

```typescript
const promotion = {
  ...validatedData,
  createdBy: new mongoose.Types.ObjectId(session.user.id)
}
```

The creator's name will be displayed correctly in:
- ✅ Promotion list view (if needed)
- ✅ Promotion detail view
- ✅ Promotion edit history

### For Deleted Users
If a user who created promotions is later deleted from the system:
- The promotion detail page will show: `User ID: 507f1f77...` (first 8 characters)
- The promotion remains valid and functional
- Other staff can still edit the promotion

## Rollback (If Needed)

If you need to revert the schema change:

1. **Revert schema**:
```typescript
createdBy: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true, // Back to required
}
```

2. **Ensure all promotions have creators** (run migration first)
3. **Restart the application**

## Troubleshooting

### Issue: Migration script fails with "No admin user found"

**Solution**: Create at least one admin user in your system first, then run the migration.

### Issue: Some promotions still show "Not tracked"

**Possible causes**:
1. Migration script didn't run successfully
2. Database connection issues
3. Promotions were created during migration

**Solution**: Run the migration script again - it's safe to run multiple times.

### Issue: Shows "Unknown User" instead of name

**Possible causes**:
1. The user account was deleted
2. Database populate is failing
3. User collection reference issue

**Solution**: Check if the user exists in the database:
```javascript
db.users.findOne({ _id: ObjectId("USER_ID_HERE") })
```

## Testing Checklist

- [ ] View a legacy promotion (should show admin name after migration)
- [ ] Create a new promotion (should show your name)
- [ ] View the new promotion detail page (should show your name)
- [ ] Check promotion list page works correctly
- [ ] Test editing a legacy promotion
- [ ] Test editing a new promotion

## Technical Details

### Database Query for Checking Promotions

To check which promotions don't have creators:

```javascript
db.promotions.find({
  $or: [
    { createdBy: { $exists: false } },
    { createdBy: null }
  ]
}).count()
```

### Database Query for Verification

To verify all promotions now have creators:

```javascript
db.promotions.aggregate([
  {
    $group: {
      _id: "$createdBy",
      count: { $sum: 1 }
    }
  }
])
```

## Support

If you encounter any issues:

1. Check the database connection in `.env.local`
2. Verify admin users exist in the system
3. Check server logs for detailed error messages
4. Run the migration script with verbose logging

---

**Status**: ✅ Fix Complete  
**Migration Required**: Yes (run `npm run migrate:promotions`)  
**Breaking Changes**: None  
**Backward Compatible**: Yes
