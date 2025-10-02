# Home Page UI Improvement Tasks

## Overview
This document outlines the implementation plan for improving the home page user experience with new sections and enhanced features while maintaining consistent styling, theme, and responsive design.

## Design Principles
- **Consistent Styling**: Use existing Tailwind theme with CSS variables (hsl-based colors)
- **Component Library**: Leverage shadcn/ui components (Card, Badge, Button, etc.)
- **Responsive Design**: Mobile-first approach with md: and lg: breakpoints
- **Performance**: Optimize images, lazy loading, and minimize re-renders
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Sections to Implement

### Current Structure:
1. ✅ Hero Carousel (Keep as-is)
2. 🔄 Flash Deals (Enhance with countdown timer)
3. 🔄 Shop by Category (Add product counts)
4. ✨ Shop by Brand (NEW)
5. ✨ Featured Collections (NEW)
6. 🔄 New Arrivals (Add badges and dates)
7. 🔄 Best Sellers (Add rankings and sales counts)
8. ✅ Browsing History (Keep as-is)

---

## Phase 1: Flash Deals & Category Enhancement (High Priority)

### Task 1.1: Enhance Flash Deals Section
**Component**: `components/shared/home/flash-deals.tsx` (new)

**Features**:
- Real-time countdown timer showing hours:minutes:seconds
- Display products in horizontal scrollable carousel
- Show discount percentage badge (e.g., "-40% 🔥")
- Highlight savings prominently
- Responsive: 2 items on mobile, 4-5 on tablet, 6-7 on desktop

**Technical Details**:
```typescript
// Data fetching
- Use existing getTodaysDeals() from product.actions.ts
- Calculate end time (24 hours from deal start)

// Countdown logic
- Client component with useEffect + setInterval
- Format: "Ends in 05:23:15"
- Update every second
- Show "Expired" when time runs out

// Styling
- Use Card with border-2 border-destructive for urgency
- Badge variant="destructive" for discount percentage
- Use ProductSlider pattern for carousel
```

**Files to Create/Modify**:
- ✨ Create: `components/shared/home/flash-deals.tsx`
- ✨ Create: `components/shared/countdown-timer.tsx` (reusable)
- 🔄 Modify: `app/[locale]/(home)/page.tsx` - Replace Today's Deals section

---

### Task 1.2: Add Product Counts to Categories
**Component**: `components/shared/home/home-card.tsx` (modify)

**Features**:
- Display product count under each category name
- Format: "(234)" or "234 items"
- Update category data fetching to include counts

**Technical Details**:
```typescript
// Data fetching enhancement
- Modify getAllCategories() to return counts
- Add Product.countDocuments({ category: categoryName })
- Return array of { name: string, count: number, image: string }

// UI Update
- Add count display in home-card.tsx
- Style: text-xs text-muted-foreground
- Position: Below category name
```

**Files to Modify**:
- 🔄 `lib/actions/product.actions.ts` - Update getAllCategories()
- 🔄 `components/shared/home/home-card.tsx` - Add count display
- 🔄 `app/[locale]/(home)/page.tsx` - Update data structure

---

## Phase 2: New Sections - Brand & Collections (Medium Priority)

### Task 2.1: Shop by Brand Section
**Component**: `components/shared/home/brand-grid.tsx` (new)

**Features**:
- Display 10-12 brand logos in grid layout
- Clickable brand cards linking to filtered search
- "View All" button at the end
- Hover effects for interactivity

**Technical Details**:
```typescript
// Data fetching
- Use getAllActiveBrands() from brand.actions.ts
- Limit to 11 brands (10 + View All)
- Include: name, logo, slug

// Layout
- Grid: grid-cols-2 md:grid-cols-4 lg:grid-cols-6
- Square cards with brand logos
- Aspect ratio 1:1
- Center logo with padding
- Link to: /search?brand={brandName}

// Styling
- Card with hover:shadow-lg transition
- Border: border-border
- Background: bg-card
- Logo: max-width 80%, centered
```

**Files to Create/Modify**:
- ✨ Create: `components/shared/home/brand-grid.tsx`
- 🔄 Modify: `app/[locale]/(home)/page.tsx` - Add brand section

---

### Task 2.2: Featured Collections Section
**Component**: `components/shared/home/featured-collections.tsx` (new)

**Features**:
- 2 large collection cards side-by-side (stacked on mobile)
- Image background with overlay text
- Collection title and "Explore Collection" CTA
- Configurable from admin (future: use database, for now hardcoded)

**Technical Details**:
```typescript
// Data structure
type Collection = {
  id: string
  title: string
  image: string
  description?: string
  link: string  // e.g., /search?tag=work-from-home
}

// Layout
- Grid: grid-cols-1 lg:grid-cols-2 gap-4
- Each card: aspect-[16/9] or aspect-[4/3]
- Image as background with overlay gradient
- Text overlay: absolute positioning, bottom-left

// Styling
- Dark gradient overlay for text readability
- Button: primary variant
- Hover: scale-105 transition
- Responsive text sizing
```

**Files to Create/Modify**:
- ✨ Create: `components/shared/home/featured-collections.tsx`
- ✨ Create: `lib/constants/collections.ts` - Hardcoded collections data
- 🔄 Modify: `app/[locale]/(home)/page.tsx` - Add collections section

---

## Phase 3: Enhance Existing Sections (Medium Priority)

### Task 3.1: Add Badges to New Arrivals
**Component**: Enhance existing product display

**Features**:
- "NEW" badge on products less than 30 days old
- Relative date display (e.g., "Just added", "3 days ago", "1 week ago")
- Badge styling consistent with theme

**Technical Details**:
```typescript
// Data enhancement
- Add createdAt field to product queries
- Calculate days since creation
- Pass badge info to ProductCard

// Badge logic
- 0-1 days: "Just added"
- 2-7 days: "X days ago"
- 8-30 days: "X weeks ago"
- >30 days: No badge

// Component update
- Add badge prop to ProductCard
- Position: top-left or top-right corner
- Badge variant="secondary" with custom color
```

**Files to Modify**:
- 🔄 `lib/actions/product.actions.ts` - Include createdAt in queries
- 🔄 `components/shared/product/product-card.tsx` - Add badge display
- 🔄 `app/[locale]/(home)/page.tsx` - Pass badge data

---

### Task 3.2: Enhance Best Sellers Section
**Component**: Enhance existing product display

**Features**:
- "#1 BEST SELLER" badge for top product
- Sales count display (e.g., "3.4k sold")
- Star rating display (if available)
- Highlight top 3 products differently

**Technical Details**:
```typescript
// Data requirements
- getBestSellersForCard() should return totalSold count
- Add rating/review count if available
- Sort by sales descending

// Badge system
- Rank 1: "🏆 #1 BEST SELLER" - gold/yellow badge
- Rank 2-3: "#2" or "#3" badge - silver
- All: Show "X.Xk sold" below product

// Styling
- Use Badge component with custom colors
- Position sales count: below price
- Text: text-sm text-muted-foreground
```

**Files to Modify**:
- 🔄 `lib/actions/product.actions.ts` - Return sales count
- 🔄 `components/shared/product/product-card.tsx` - Add ranking badge
- 🔄 `app/[locale]/(home)/page.tsx` - Pass ranking data

---

## Phase 4: Testing, Optimization & Polish (High Priority)

### Task 4.1: Responsive Testing
**Checklist**:
- [ ] Test on mobile (320px, 375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1280px, 1440px, 1920px)
- [ ] Verify all sections stack properly on mobile
- [ ] Check touch targets (minimum 44x44px)
- [ ] Test horizontal scrolling on carousels

**Devices to Test**:
- iPhone SE / 12 / 14 Pro Max
- iPad / iPad Pro
- Desktop browsers (Chrome, Firefox, Safari, Edge)

---

### Task 4.2: Performance Optimization
**Checklist**:
- [ ] Implement lazy loading for images
- [ ] Add loading skeletons for async sections
- [ ] Optimize image sizes (use Next.js Image)
- [ ] Minimize layout shifts (CLS)
- [ ] Test Lighthouse scores (aim for 90+)
- [ ] Verify countdown timer doesn't cause re-renders

**Tools**:
- Lighthouse CI
- WebPageTest
- React DevTools Profiler

---

### Task 4.3: Accessibility Testing
**Checklist**:
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators visible and clear
- [ ] ARIA labels for carousels and dynamic content
- [ ] Alt text for all images
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader testing (NVDA / VoiceOver)

---

### Task 4.4: Cross-browser Testing
**Checklist**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Phase 5: Internationalization & Content (Optional)

### Task 5.1: Translation Keys
**Files to Update**:
- 🔄 `messages/*.json` - Add new translation keys

**New Keys Needed**:
```json
{
  "Home": {
    "Flash Deals": "Flash Deals",
    "Ends in": "Ends in",
    "Shop by Brand": "Shop by Brand",
    "Featured Collections": "Featured Collections",
    "Explore Collection": "Explore Collection",
    "Just added": "Just added",
    "days ago": "days ago",
    "weeks ago": "weeks ago",
    "Best Seller": "#1 Best Seller",
    "sold": "sold"
  }
}
```

---

## Implementation Order Summary

### Week 1: Foundation
1. ✅ Create this task document
2. Task 1.1: Flash Deals with countdown
3. Task 1.2: Category product counts

### Week 2: New Features
4. Task 2.1: Shop by Brand section
5. Task 2.2: Featured Collections section

### Week 3: Enhancements
6. Task 3.1: New Arrivals badges
7. Task 3.2: Best Sellers rankings

### Week 4: Quality Assurance
8. Task 4.1: Responsive testing
9. Task 4.2: Performance optimization
10. Task 4.3: Accessibility testing
11. Task 4.4: Cross-browser testing

---

## Styling Guidelines

### Color Palette (from Tailwind config)
- **Background**: `bg-background` - Main page background
- **Card**: `bg-card` - Card backgrounds
- **Border**: `border-border` - All borders
- **Primary**: `bg-primary text-primary-foreground` - CTA buttons
- **Secondary**: `bg-secondary/30` - Section dividers
- **Destructive**: `border-destructive` - Urgent/flash deals
- **Muted**: `text-muted-foreground` - Secondary text

### Typography
- **Section Titles**: `h2-bold mb-4 md:mb-5`
- **Card Titles**: `text-xl font-bold mb-4`
- **Body Text**: `text-sm md:text-base`
- **Secondary Text**: `text-xs md:text-sm text-muted-foreground`

### Spacing
- **Section Padding**: `py-4 md:py-6`
- **Card Padding**: `p-4`
- **Grid Gaps**: `gap-3 md:gap-4`
- **Stack Spacing**: `space-y-4 md:space-y-6`

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px (md:)
- **Desktop**: 1024px+ (lg:)

### Component Patterns
```tsx
// Section wrapper
<div className="bg-background">
  <Container className="py-4 md:py-6">
    {/* content */}
  </Container>
</div>

// Card pattern
<Card className="rounded-none bg-card border-border">
  <CardContent className="p-4">
    {/* content */}
  </CardContent>
</Card>

// Grid pattern
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* items */}
</div>
```

---

## Database Schema Updates (if needed)

### Products Collection
```typescript
// Add if not present
{
  createdAt: Date,      // For "NEW" badges
  totalSold: Number,    // For best seller rankings
  viewCount: Number     // For trending (future)
}
```

### Collections Collection (Future Enhancement)
```typescript
{
  _id: ObjectId,
  title: string,
  description: string,
  image: string,
  link: string,
  active: boolean,
  order: number,
  createdAt: Date
}
```

---

## Success Metrics

### User Engagement
- [ ] Increase average time on home page by 30%
- [ ] Increase click-through rate to product pages by 25%
- [ ] Reduce bounce rate by 15%

### Performance
- [ ] Lighthouse Performance Score: 90+
- [ ] First Contentful Paint: < 1.5s
- [ ] Largest Contentful Paint: < 2.5s
- [ ] Cumulative Layout Shift: < 0.1

### Conversion
- [ ] Increase add-to-cart rate from home page by 20%
- [ ] Increase product discovery (unique products viewed) by 40%

---

## Notes

### Current Home Page Flow
```
Hero Carousel
  ↓
Promotion Banners
  ↓
Categories (4 cards) | New Arrivals | Best Sellers | Featured
  ↓
Today's Deals (slider)
  ↓
Browsing History (related + history)
```

### New Home Page Flow
```
Hero Carousel
  ↓
⚡ Flash Deals (with countdown)
  ↓
📁 Shop by Category (with counts)
  ↓
🏷️ Shop by Brand
  ↓
🎨 Featured Collections
  ↓
✨ New Arrivals (with badges)
  ↓
🏆 Best Sellers (with rankings)
  ↓
👁️ Browsing History
```

---

## Common Pitfalls to Avoid

1. **Inconsistent Spacing**: Always use the defined spacing scale
2. **Breaking Responsive Layout**: Test every change on mobile first
3. **Performance Issues**: Avoid unnecessary re-renders, especially with countdown timer
4. **Accessibility**: Don't forget ARIA labels and keyboard navigation
5. **Hardcoded Strings**: Use translation keys for all user-facing text
6. **Image Optimization**: Always use Next.js Image component with proper sizes
7. **Layout Shift**: Reserve space for dynamic content (skeletons/placeholders)

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Last Updated**: January 2025
**Status**: Ready for Implementation
**Estimated Duration**: 4 weeks
