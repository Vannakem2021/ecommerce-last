# Home Page Restructure - Summary

## Changes Made

### ✅ Sections Removed
1. **Categories to explore** - Removed (was showing 4 categories in 2x2 grid)
2. **Featured Products** - Removed (was showing tagged products)

### ✅ Sections Updated
1. **Explore New Arrivals** - Changed from 4 to **3 products**
2. **Discover Best Sellers** - Changed from 4 to **3 products**

### ✅ New Section Added
**"Discover Hot Deals"** (or "Hot Deals")
- Shows 3 products with discounts (listPrice > price)
- Displays products sorted by most recent
- Shows discount badges and pricing
- Link: View All → `/search?sort=price-high-to-low`

---

## New Home Page Structure

```
┌─────────────────────────────────┐
│ Hero Carousel                    │
└─────────────────────────────────┘
          ↓
┌─────────────────────────────────┐
│ ⚡ Flash Deals (if active)       │
│ (10 products, horizontal scroll) │
└─────────────────────────────────┘
          ↓
┌─────────────────────────────────┐
│ 3-Section Grid (1-2-3 columns)  │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 🔥 Discover Hot Deals       │ │
│ │ - Product 1 (horizontal)    │ │
│ │ - Product 2 (horizontal)    │ │
│ │ - Product 3 (horizontal)    │ │
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ ✨ Explore New Arrivals     │ │
│ │ - Product 1 (NEW badge)     │ │
│ │ - Product 2 (NEW badge)     │ │
│ │ - Product 3 (NEW badge)     │ │
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 🏆 Discover Best Sellers    │ │
│ │ - Product 1 (#1 ranking)    │ │
│ │ - Product 2 (#2 ranking)    │ │
│ │ - Product 3 (#3 ranking)    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
          ↓
┌─────────────────────────────────┐
│ 🏷️ Shop by Brand                 │
│ (Brand logos in grid)            │
└─────────────────────────────────┘
          ↓
┌─────────────────────────────────┐
│ 🎨 Featured Collections          │
│ (2 large image cards)            │
└─────────────────────────────────┘
          ↓
┌─────────────────────────────────┐
│ 👁️ Browsing History              │
└─────────────────────────────────┘
```

---

## Technical Implementation

### New Function Added
**File**: `lib/actions/product.actions.ts`

```typescript
export async function getHotDealsForCard({
  limit = 3,
}: {
  limit?: number
} = {}) {
  // Returns products where listPrice > price (has discount)
  // Sorted by most recent
  // Returns full IProduct[] with brand and category populated
}
```

### Translation Keys Added

**English** (`messages/en-US.json`):
- `"Hot Deals": "Hot Deals"`
- `"Discover Hot Deals": "Discover Hot Deals"`

**Khmer** (`messages/kh.json`):
- `"Hot Deals": "ការផ្តល់ជូនពិសេស"`
- `"Discover Hot Deals": "ស្វែងរកការផ្តល់ជូនពិសេស"`

---

## Product Card Layout

All 3 sections now use **horizontal product cards**:

```
┌─────────────────────────────────────────┐
│ [Image]  Brand Name                     │
│  80px    Product Name (2 lines)         │
│          ★★★★☆ (123)                   │
│          $19.99 (cyan badge)            │
│          NEW | #1 | 5.2k sold           │
└─────────────────────────────────────────┘
```

### Features:
- ✅ Image: 80-96px on left
- ✅ Content: Product details on right
- ✅ Badges: NEW (green), Rankings (#1-3), Discount %
- ✅ Price: Cyan badge (like sample image)
- ✅ Sales counts: For best sellers
- ✅ Relative dates: For new arrivals
- ✅ Entire card clickable
- ✅ Hover effects

---

## Section Details

### 1. Discover Hot Deals 🔥
- **Products**: 3 items with discounts (listPrice > price)
- **Sort**: Most recent discounts first
- **Badges**: Discount percentage if available
- **Link**: View All → Price high to low
- **Purpose**: Showcase current promotions and sales

### 2. Explore New Arrivals ✨
- **Products**: 3 newest items
- **Sort**: Most recent (createdAt descending)
- **Badges**: Green "NEW" badge
- **Extra Info**: Relative date ("Just added", "3 days ago")
- **Link**: View All → Latest products
- **Purpose**: Highlight recently added products

### 3. Discover Best Sellers 🏆
- **Products**: 3 top selling items
- **Sort**: Highest sales (numSales descending)
- **Badges**: Gold #1, Silver #2-3
- **Extra Info**: Sales count ("5.2k sold")
- **Link**: View All → Best selling
- **Purpose**: Show popular, proven products

---

## Files Modified

1. ✅ `app/[locale]/(home)/page.tsx`
   - Removed: Categories and Featured sections
   - Added: Hot Deals section
   - Changed: Limits from 4 to 3
   - Removed: Unused imports (toSlug, getAllCategoriesWithCounts, getProductsForCard)

2. ✅ `lib/actions/product.actions.ts`
   - Added: `getHotDealsForCard()` function

3. ✅ `messages/en-US.json`
   - Added: Hot Deals translation keys

4. ✅ `messages/kh.json`
   - Added: Hot Deals Khmer translations

---

## Benefits

1. ✅ **Cleaner Layout**: Only 3 focused sections instead of 4
2. ✅ **More Products**: Hot Deals replaces static categories
3. ✅ **Better Discovery**: All sections show actual products
4. ✅ **Consistent Design**: All use horizontal cards (3 per section)
5. ✅ **Sales Focus**: Hot Deals prominently featured first
6. ✅ **Faster Loading**: Fewer products to fetch (9 vs 16)
7. ✅ **Mobile Friendly**: Horizontal cards better on mobile

---

## Testing

Refresh your browser at `http://localhost:3000/`

### Expected Result:
1. **Hero Carousel** at top
2. **Flash Deals** (if any active sales)
3. **3 Cards Side-by-Side**:
   - Hot Deals (products with discounts)
   - New Arrivals (with NEW badges)
   - Best Sellers (with #1-3 rankings)
4. **Shop by Brand** section
5. **Featured Collections** section
6. **Browsing History** at bottom

### Each Card Section Should Have:
- Section title
- 3 horizontal product cards (stacked)
- "View All" link at bottom
- Proper badges and pricing
- Hover effects working

---

**Status**: ✅ Complete
**Date**: January 2025
