# Second-Hand Products Implementation Plan

## Overview
Add a dedicated Second-Hand product feature to the e-commerce application with filtering, display sections, and search integration.

---

## Phase 1: Database Schema Update

### 1.1 Update Product Model
**File**: `lib/db/models/product.model.ts`

- [ ] Add `secondHand` field to `IProduct` interface
  ```typescript
  secondHand?: boolean
  ```

- [ ] Add schema definition for `secondHand` field
  ```typescript
  secondHand: {
    type: Boolean,
    required: false,
    default: false,
  }
  ```

- [ ] Add optional condition/quality fields (optional enhancement)
  ```typescript
  condition?: string // 'Like New', 'Good', 'Fair', 'Poor'
  ```

**Estimated Time**: 15 minutes

---

### 1.2 Update Product Validator
**File**: `lib/validator.ts`

- [ ] Add `secondHand` field to `ProductInputSchema`
  ```typescript
  secondHand: z.boolean().optional().default(false)
  ```

- [ ] Add `secondHand` to `ProductUpdateSchema`

- [ ] Add optional `condition` field validation (if implementing)
  ```typescript
  condition: z.enum(['Like New', 'Good', 'Fair', 'Poor']).optional()
  ```

**Estimated Time**: 10 minutes

---

### 1.3 Update Sample Data
**File**: `lib/data.ts`

- [ ] Add `secondHand: true` to 6-8 selected products
  - Choose products from different categories (Smartphones, Laptops, Tablets)
  - Ensure variety in brands and price points
  - Example products:
    - Apple iPhone 15 (Good condition)
    - Samsung Galaxy S24 FE (Like New)
    - MacBook Air 13-inch M3 (Good condition)
    - iPad Pro 12.9-inch M4 (Like New)
    - Oppo Find X8 (Fair condition)
    - Samsung Galaxy Z Flip6 (Good condition)

- [ ] Optionally add `condition` field to second-hand products

**Estimated Time**: 15 minutes

---

## Phase 2: Backend Functions

### 2.1 Create Second-Hand Product Functions
**File**: `lib/actions/product.actions.ts`

- [ ] Add `getSecondHandProducts()` function
  ```typescript
  export async function getSecondHandProducts({
    limit = 10,
  }: {
    limit?: number
  } = {}) {
    await connectToDatabase()
    
    void Brand
    void Category
    
    const products = await Product.find({
      isPublished: true,
      secondHand: true,
    })
      .populate('brand', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    
    return JSON.parse(JSON.stringify(products)) as IProduct[]
  }
  ```

- [ ] Add `getSecondHandProductsForCard()` function (for home page section)
  ```typescript
  // Returns 6 products for home page display
  limit = 6 by default
  ```

**Estimated Time**: 20 minutes

---

### 2.2 Update Search/Filter Functions
**File**: `lib/actions/product.actions.ts`

- [ ] Update `getAllProducts()` to support `secondHand` filter parameter
  ```typescript
  export async function getAllProducts({
    query,
    limit,
    page,
    category,
    tag,
    price,
    rating,
    sort,
    secondHand, // NEW parameter
  }: {
    // ...existing params
    secondHand?: string // 'true', 'false', or 'all'
  })
  ```

- [ ] Add secondHand filter logic
  ```typescript
  const secondHandFilter = 
    secondHand && secondHand === 'true'
      ? { secondHand: true }
      : secondHand === 'false'
        ? { secondHand: { $ne: true } }
        : {}
  ```

- [ ] Apply filter in query:
  ```typescript
  const products = await Product.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
    ...secondHandFilter, // NEW
  })
  ```

**Estimated Time**: 25 minutes

---

## Phase 3: UI Components

### 3.1 Create Second-Hand Section Component (Optional - Can Reuse)
**Option A**: Reuse existing `CategorySection` component
- No new component needed
- Just pass second-hand products and appropriate props

**Option B**: Create dedicated `SecondHandSection` component
**File**: `components/shared/home/second-hand-section.tsx`

- [ ] Similar structure to `CategorySection`
- [ ] Display "Second Hand" or "Pre-Owned" title
- [ ] Show 6 products in 5-column grid
- [ ] Use existing `ProductCard` component
- [ ] Add "View All" link to `/search?secondHand=true`
- [ ] Optional: Add badge/indicator for condition

**Estimated Time**: 30 minutes (if creating new component), 5 minutes (if reusing)

---

### 3.2 Update Home Page
**File**: `app/[locale]/(home)/page.tsx`

- [ ] Import second-hand product function
  ```typescript
  import { getSecondHandProductsForCard } from '@/lib/actions/product.actions'
  ```

- [ ] Fetch second-hand products
  ```typescript
  const secondHandProducts = await getSecondHandProductsForCard({ limit: 6 })
  ```

- [ ] Add Second-Hand section below Tablets section
  ```tsx
  {/* Second-Hand Section */}
  <div className='bg-secondary/30'>
    <Container className='py-4 md:py-6'>
      <CategorySection
        title={t('Second Hand')}
        products={secondHandProducts}
        categorySlug='second-hand'
      />
    </Container>
  </div>
  ```

**Estimated Time**: 15 minutes

---

### 3.3 Update Search Page
**File**: `app/[locale]/(root)/search/page.tsx`

- [ ] Add `secondHand` to search params extraction
  ```typescript
  const secondHand = searchParams.secondHand || 'all'
  ```

- [ ] Pass `secondHand` to `getAllProducts()` function
  ```typescript
  const data = await getAllProducts({
    category,
    query,
    price,
    rating,
    sort,
    page: Number(page),
    secondHand, // NEW
  })
  ```

- [ ] Add second-hand filter UI (optional - can be added in Phase 4)

**Estimated Time**: 15 minutes

---

### 3.4 Add Product Card Badge/Indicator
**File**: `components/shared/product/product-card.tsx`

- [ ] Add "Second Hand" badge on product cards
  ```tsx
  {product.secondHand && (
    <Badge 
      variant='secondary'
      className='absolute top-2 right-2 bg-orange-500 text-white'
    >
      Second Hand
    </Badge>
  )}
  ```

- [ ] Optional: Add condition badge if implementing condition field
  ```tsx
  {product.condition && (
    <span className='text-xs text-muted-foreground'>
      Condition: {product.condition}
    </span>
  )}
  ```

**Estimated Time**: 20 minutes

---

### 3.5 Update Horizontal Product Card
**File**: `components/shared/product/product-card-horizontal.tsx`

- [ ] Add "Second Hand" badge for horizontal cards
- [ ] Similar implementation as regular product card

**Estimated Time**: 10 minutes

---

## Phase 4: Filters & Search Integration

### 4.1 Add Second-Hand Filter to Search Sidebar
**File**: `components/shared/product/filter.tsx` (or create if doesn't exist)

- [ ] Add "Condition" filter section
  ```tsx
  <div className='filter-section'>
    <h3>Condition</h3>
    <label>
      <input type="checkbox" value="new" />
      New
    </label>
    <label>
      <input type="checkbox" value="secondHand" />
      Second Hand
    </label>
  </div>
  ```

- [ ] Wire up filter to update search params

**Estimated Time**: 30 minutes

---

### 4.2 Add Second-Hand to Search Results Header
**File**: `app/[locale]/(root)/search/page.tsx`

- [ ] Display filter indicator when secondHand=true
  ```tsx
  {secondHand === 'true' && (
    <Badge>Second Hand Products</Badge>
  )}
  ```

**Estimated Time**: 10 minutes

---

## Phase 5: Translations

### 5.1 Add Translation Keys
**Files**: 
- `messages/en-US.json`
- `messages/kh.json`

**English** (`en-US.json`):
```json
{
  "Home": {
    "Second Hand": "Second Hand",
    "Pre-Owned": "Pre-Owned",
    "Used Products": "Used Products"
  },
  "Product": {
    "Second Hand": "Second Hand",
    "Condition": "Condition",
    "Like New": "Like New",
    "Good": "Good",
    "Fair": "Fair",
    "Poor": "Poor"
  },
  "Search": {
    "Second Hand Products": "Second Hand Products",
    "Filter by Condition": "Filter by Condition"
  }
}
```

**Khmer** (`kh.json`):
```json
{
  "Home": {
    "Second Hand": "ទំនិញបាន​ប្រើប្រាស់",
    "Pre-Owned": "ភ្លួស​មុន",
    "Used Products": "ផលិតផលបានប្រើ"
  },
  "Product": {
    "Second Hand": "ទំនិញបាន​ប្រើប្រាស់",
    "Condition": "លក្ខខណ្ឌ",
    "Like New": "ដូចថ្មី",
    "Good": "ល្អ",
    "Fair": "ធម្មតា",
    "Poor": "មិនសូវល្អ"
  }
}
```

- [ ] Add all translation keys to both locale files
- [ ] Ensure no BOM characters

**Estimated Time**: 15 minutes

---

## Phase 6: Admin Interface (RECOMMENDED - Essential for Content Management)

### 6.1 Update Admin Product Form ⭐ **RECOMMENDED APPROACH**
**File**: `app/[locale]/admin/products/product-form.tsx`

**Why Checkbox is Best:**
- ✅ Follows existing `isPublished` checkbox pattern
- ✅ Unchecked by default = New product (most common)
- ✅ Simple, clear, no ambiguity
- ✅ Consistent with current admin UI

#### Add Default Value
```typescript
const productDefaultValues: IProductInput = {
  // ... existing fields
  isPublished: false,
  secondHand: false,  // NEW: Default to false (new product)
  // ... other fields
}
```

#### Add Second-Hand Checkbox
**Location**: In the "Settings" card, below the `isPublished` checkbox

```tsx
{/* NEW: Second-Hand checkbox - Add after isPublished */}
<FormField
  control={form.control}
  name='secondHand'
  render={({ field }) => (
    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'>
      <div className="space-y-0.5">
        <FormLabel className='text-sm font-medium flex items-center gap-2'>
          <Package className="h-4 w-4 text-orange-600" />
          Second-Hand Product
        </FormLabel>
        <FormDescription>
          Mark this product as pre-owned or used
        </FormDescription>
      </div>
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

**Visual Design:**
- Orange background tint for visibility
- Package icon for visual indicator
- Clear descriptive text
- Sits naturally below "Publish Product" checkbox

**Estimated Time**: 15 minutes

---

#### Optional Enhancement: Condition Dropdown
**If you want detailed condition tracking:**

```tsx
{/* Show condition dropdown only when secondHand is checked */}
{form.watch('secondHand') && (
  <FormField
    control={form.control}
    name='condition'
    render={({ field }) => (
      <FormItem>
        <FormLabel>Product Condition</FormLabel>
        <Select
          value={field.value}
          onValueChange={field.onChange}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="Like New">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Like New - Minimal signs of use
              </span>
            </SelectItem>
            <SelectItem value="Good">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Good - Normal wear, fully functional
              </span>
            </SelectItem>
            <SelectItem value="Fair">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                Fair - Visible wear, works well
              </span>
            </SelectItem>
            <SelectItem value="Poor">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                Poor - Significant wear, may have issues
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>
          Describe the condition of this second-hand product
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

**Features:**
- Progressive disclosure - only shows when needed
- Color-coded conditions for quick recognition
- Descriptive text for each condition level
- Uses existing Select component

**Additional Time if Adding Condition**: +10 minutes

---

### 6.2 Update Admin Product List
**File**: `app/[locale]/admin/products/product-list.tsx`

- [ ] Add "Second Hand" badge indicator in product list
  ```tsx
  {product.secondHand && (
    <Badge variant="secondary" className="bg-orange-500 text-white">
      Second Hand
    </Badge>
  )}
  ```

- [ ] Optional: Add filter to show only second-hand products in admin list
  ```tsx
  <Button onClick={() => setFilter('secondHand')}>
    Second Hand Only
  </Button>
  ```

- [ ] Optional: Show condition badge if condition field is implemented
  ```tsx
  {product.condition && (
    <Badge variant="outline" className="text-xs">
      {product.condition}
    </Badge>
  )}
  ```

**Estimated Time**: 15 minutes

---

### 6.3 Testing Admin Interface
- [ ] Create new product with secondHand unchecked → Should save as new product
- [ ] Create new product with secondHand checked → Should save as second-hand
- [ ] Edit existing product, toggle secondHand → Should update correctly
- [ ] Verify condition dropdown appears/disappears when checking secondHand (if implemented)
- [ ] Check that badges display correctly in product list
- [ ] Test form validation with secondHand field

**Estimated Time**: 10 minutes

---

**Total Phase 6 Time**: 
- Checkbox only: ~40 minutes
- Checkbox + Condition: ~50 minutes

---

## Phase 7: Testing & Validation

### 7.1 Database Testing
- [ ] Run database seed to populate second-hand products
  ```bash
  npm run db:seed
  ```

- [ ] Verify `secondHand` field is saved correctly
- [ ] Check that products display proper condition values

**Estimated Time**: 10 minutes

---

### 7.2 Frontend Testing

**Home Page:**
- [ ] Verify Second-Hand section appears below Tablets section
- [ ] Check that 6 products display in 5-column grid
- [ ] Ensure "View All" link works correctly
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Verify green horizontal line appears below title

**Search Page:**
- [ ] Click "View All" from home page Second-Hand section
- [ ] Verify URL is `/search?secondHand=true`
- [ ] Confirm only second-hand products are displayed
- [ ] Test filtering by category + secondHand
- [ ] Test sorting with second-hand filter

**Product Cards:**
- [ ] Verify "Second Hand" badge appears on second-hand products
- [ ] Check badge displays on both card styles (vertical & horizontal)
- [ ] Test hover states and interactions

**Estimated Time**: 30 minutes

---

### 7.3 Translation Testing
- [ ] Switch to Khmer locale
- [ ] Verify all second-hand related text is translated
- [ ] Check that section title displays correctly
- [ ] Test product card badges in Khmer

**Estimated Time**: 10 minutes

---

## Phase 8: Documentation & Polish

### 8.1 Update Documentation
- [ ] Document `secondHand` field in product model
- [ ] Add second-hand filter to API documentation
- [ ] Update admin guide for adding second-hand products

**Estimated Time**: 15 minutes

---

### 8.2 Code Review & Cleanup
- [ ] Review all code changes
- [ ] Remove any console.logs or debug code
- [ ] Ensure consistent naming conventions
- [ ] Verify TypeScript types are correct

**Estimated Time**: 15 minutes

---

## Summary of Changes

### Files to Create:
- `components/shared/home/second-hand-section.tsx` (optional, if not reusing CategorySection)

### Files to Modify:
1. `lib/db/models/product.model.ts` - Add secondHand field
2. `lib/validator.ts` - Add secondHand validation
3. `lib/data.ts` - Mark some products as secondHand
4. `lib/actions/product.actions.ts` - Add getSecondHandProducts functions, update getAllProducts
5. `app/[locale]/(home)/page.tsx` - Add Second-Hand section
6. `app/[locale]/(root)/search/page.tsx` - Add secondHand filter support
7. `components/shared/product/product-card.tsx` - Add secondHand badge
8. `components/shared/product/product-card-horizontal.tsx` - Add secondHand badge
9. `messages/en-US.json` - Add translations
10. `messages/kh.json` - Add translations
11. Admin product forms (optional)

---

## Total Estimated Time

| Phase | Time |
|-------|------|
| Phase 1: Database Schema | 40 min |
| Phase 2: Backend Functions | 45 min |
| Phase 3: UI Components | 90 min |
| Phase 4: Filters & Search | 40 min |
| Phase 5: Translations | 15 min |
| Phase 6: Admin Interface (Recommended) | 40-50 min |
| Phase 7: Testing | 50 min |
| Phase 8: Documentation | 30 min |
| **Total** | **~5.5 hours** |

*Note: Time estimates are approximate and may vary based on familiarity with codebase*

---

## Implementation Order Recommendation

### Quick MVP (Minimum Viable Product):
1. **Phase 1** - Database Schema (Required)
2. **Phase 2.1** - Backend Functions (Required)
3. **Phase 3.2** - Home Page Section (Required)
4. **Phase 3.3** - Search Page Integration (Required)
5. **Phase 5** - Translations (Required)
6. **Phase 6.1** - Admin Checkbox (Recommended - for content management)
7. **Phase 7** - Testing (Required)

**MVP Time**: ~3 hours (includes admin interface)
**Without Admin**: ~2.5 hours (can only mark products as second-hand via database)

### Full Featured Implementation:
Complete all phases in order (1-8) including condition dropdown

**Full Time**: ~5.5 hours

### Recommended Implementation:
Phases 1-5, 6.1-6.2 (checkbox only), 7-8

**Recommended Time**: ~5 hours

---

## Future Enhancements (Post-Implementation)

- [ ] Add warranty/return policy for second-hand products
- [ ] Add seller information (if marketplace model)
- [ ] Add product history/provenance
- [ ] Add inspection reports or certifications
- [ ] Add photo gallery showing product condition
- [ ] Add "Why Buy Second Hand?" informational section
- [ ] Add sustainability/environmental impact messaging
- [ ] Implement trade-in program
- [ ] Add comparison tool (new vs second-hand pricing)

---

## Risk & Considerations

### Technical Risks:
- **Database Migration**: Existing products will have `secondHand: false` by default
- **Filter Conflicts**: Ensure secondHand filter works with existing category/tag filters
- **Performance**: Index `secondHand` field if querying large datasets

### Business Considerations:
- **Pricing Strategy**: Second-hand products should be priced lower than new
- **Quality Assurance**: Establish condition grading standards
- **Customer Expectations**: Clear communication about product condition
- **Returns/Refunds**: May need different policy for second-hand items

### UI/UX Considerations:
- **Badge Visibility**: Ensure "Second Hand" badge is prominent but not intrusive
- **Trust Signals**: Consider adding verified seller badges, ratings
- **Product Photos**: Encourage actual product photos for second-hand items

---

## Success Criteria

✅ Second-Hand section displays on home page with 6 products  
✅ "View All" link filters to show only second-hand products  
✅ Product cards display "Second Hand" badge  
✅ Search/filter integration works correctly  
✅ All translations are complete and accurate  
✅ Responsive design works on all screen sizes  
✅ No console errors or warnings  
✅ Database queries are optimized  
✅ Code follows existing patterns and conventions  

---

**Ready to implement? Start with Phase 1! 🚀**
