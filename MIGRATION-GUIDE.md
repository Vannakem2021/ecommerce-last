# Brand/Category ObjectId Migration Guide

This guide explains the migration from embedded string brand/category fields to ObjectId references in the Product model.

## Overview

The migration converts:
- `product.brand` from `string` to `ObjectId` (referencing Brand collection)
- `product.category` from `string` to `ObjectId` (referencing Category collection)

## Migration Steps

### 1. Pre-Migration Backup
```bash
# Create a backup of your database before running the migration
mongodump --uri="your-mongodb-uri" --out=backup-before-migration
```

### 2. Run the Migration
```bash
# Option 1: Run the migration script directly
npx ts-node lib/db/migrate-brand-category.ts

# Option 2: Use the helper script
node scripts/migrate-brand-category.js
```

### 3. Test the Migration
```bash
# Verify the migration worked correctly
npx ts-node scripts/test-migration.ts
```

### 4. Rollback (if needed)
```bash
# If something goes wrong, you can rollback
npx ts-node lib/db/rollback-brand-category.ts
```

## What the Migration Does

1. **Creates Brand/Category Collections**: Extracts unique brand and category names from existing products and creates corresponding documents
2. **Updates Product References**: Converts string brand/category fields to ObjectId references
3. **Maintains Data Integrity**: Ensures all existing brand/category values are preserved

## Code Changes Made

### 1. Schema Updates
- Updated `Product` model to use ObjectId references
- Added population support for brand/category queries

### 2. Validation Updates
- Updated Zod schemas to accept ObjectId values
- Added legacy schema support for transition period

### 3. Query Updates
- Added `.populate('brand', 'name').populate('category', 'name')` to all product queries
- Updated filtering logic to handle both string and ObjectId values during transition

### 4. UI Updates
- Updated product display components to handle populated objects
- Modified product forms to use ObjectId values in dropdowns

## Backward Compatibility

During the transition period, the code supports both formats:
- Legacy string values (for existing data)
- New ObjectId references (for new data)

Components check the type and handle both cases:
```typescript
// Example: Handle both string and populated object
const brandName = typeof product.brand === 'object' ? product.brand.name : product.brand
```

## Testing

After migration, verify:
1. ✅ All products have ObjectId brand/category references
2. ✅ Product queries return populated brand/category objects
3. ✅ Product forms work with ObjectId dropdowns
4. ✅ Search and filtering still work correctly
5. ✅ Product display shows correct brand/category names

## Troubleshooting

### Migration Fails
- Check database connection
- Ensure Brand/Category models are properly imported
- Verify no duplicate brand/category names exist

### Products Show [object Object]
- Ensure UI components are updated to handle populated objects
- Check that queries include proper population

### Form Dropdowns Don't Work
- Verify forms are using ObjectId values instead of names
- Check that brand/category data is loaded correctly

## Files Modified

### Core Files
- `lib/db/models/product.model.ts` - Updated schema
- `lib/validator.ts` - Updated validation schemas
- `types/index.ts` - Added new type definitions

### Migration Files
- `lib/db/migrate-brand-category.ts` - Migration script
- `lib/db/rollback-brand-category.ts` - Rollback script
- `scripts/test-migration.ts` - Test script

### Query Files
- `lib/actions/product.actions.ts` - Updated queries
- `lib/actions/inventory.actions.ts` - Updated inventory queries

### UI Files
- `app/[locale]/admin/products/product-form.tsx` - Updated form
- `components/shared/product/product-card.tsx` - Updated display
- `app/[locale]/(root)/product/[slug]/page.tsx` - Updated product page

### Seed Data
- `lib/db/seed.ts` - Updated to create brands/categories first

## Performance Considerations

- Population adds slight overhead to queries
- Consider adding indexes on brand/category fields if needed
- Monitor query performance after migration

## Next Steps

After successful migration:
1. Remove legacy schema support
2. Clean up transition code
3. Add proper indexes if needed
4. Update documentation
