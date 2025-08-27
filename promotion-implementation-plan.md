# Comprehensive Promotion System Implementation Plan

## Project Analysis Summary

### Current Architecture Overview
- **Framework**: Next.js 15 with React 19
- **Database**: MongoDB with Mongoose ODM
- **UI**: Tailwind CSS + Shadcn/ui components
- **Authentication**: NextAuth.js with RBAC system
- **State Management**: Zustand for cart management
- **Form Handling**: React Hook Form + Zod validation
- **Styling**: Dark/Light theme support with CSS variables

### Key Findings from Codebase Analysis

#### Product Pricing Structure
- Products have both `price` (current selling price) and `listPrice` (MSRP)
- Promotions should apply to the `price` field (current selling price)
- Cart calculations use `item.price * item.quantity`

#### Cart and Order Flow
- Cart managed via Zustand store (`hooks/use-cart-store.ts`)
- Price calculations in `calcDeliveryDateAndPrice()` function
- Order creation through `createOrder()` server action
- Cart schema includes: `itemsPrice`, `shippingPrice`, `taxPrice`, `totalPrice`

#### Admin Interface Patterns
- Fixed sidebar layout with scrollable content area
- Permission-based navigation using RBAC system
- Consistent form patterns with validation
- Table-based list views with CRUD operations

#### RBAC System
- Permissions: `create`, `read`, `update`, `delete` for each resource
- Role hierarchy: admin > manager > seller > user
- Need to add promotion permissions to the system

## Implementation Plan

### Phase 1: Database Schema Design

#### 1.1 Promotion Model (`lib/db/models/promotion.model.ts`)
```typescript
interface IPromotion {
  code: string              // Unique coupon code (uppercase)
  name: string             // Display name for admin
  description?: string     // Optional description
  
  // Discount configuration
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number            // Percentage (1-100) or fixed amount
  
  // Validity period
  startDate: Date
  endDate: Date
  active: boolean
  
  // Usage controls
  minOrderValue: number    // Minimum cart total required
  usageLimit: number       // 0 = unlimited
  usedCount: number        // Track usage
  userUsageLimit: number   // Per-user limit (0 = unlimited)
  
  // Scope configuration
  appliesTo: 'all' | 'products' | 'categories'
  applicableProducts: ObjectId[]    // Product references
  applicableCategories: ObjectId[]  // Category references
  
  // Metadata
  createdBy: ObjectId      // Admin who created it
  createdAt: Date
  updatedAt: Date
}
```

#### 1.2 Promotion Usage Tracking Model
```typescript
interface IPromotionUsage {
  promotion: ObjectId
  user: ObjectId
  order: ObjectId
  usedAt: Date
  discountAmount: number
}
```

### Phase 2: RBAC Integration

#### 2.1 Add Promotion Permissions
Update `lib/constants.ts` to include:
- `promotions.create`
- `promotions.read` 
- `promotions.update`
- `promotions.delete`

#### 2.2 Role Permission Assignment
- **Admin**: Full CRUD access
- **Manager**: Read and update only
- **Seller**: Read only
- **User**: No direct access (only through checkout)

### Phase 3: Server Actions Implementation

#### 3.1 Core Promotion Actions (`lib/actions/promotion.actions.ts`)
- `createPromotion(data: IPromotionInput)`
- `updatePromotion(data: IPromotionUpdate)`
- `deletePromotion(id: string)`
- `getAllPromotions(filters: PromotionFilters)`
- `getPromotionById(id: string)`
- `getActivePromotions()`

#### 3.2 Validation Logic
- `validatePromotionCode(code: string, cart: Cart, userId?: string)`
- `calculateDiscount(promotion: IPromotion, cart: Cart)`
- `checkPromotionEligibility(promotion: IPromotion, cart: Cart, user?: IUser)`

#### 3.3 Integration Points
- Extend cart schema to include promotion fields
- Update order schema to track applied promotions
- Modify `calcDeliveryDateAndPrice()` to handle discounts

### Phase 4: Admin Interface Development

#### 4.1 Admin Navigation Update
Add "Promotions" link to admin sidebar with appropriate permissions

#### 4.2 Promotion Management Pages
- `/admin/promotions` - List all promotions
- `/admin/promotions/create` - Create new promotion
- `/admin/promotions/[id]` - Edit existing promotion
- `/admin/promotions/[id]/usage` - View usage statistics

#### 4.3 UI Components
- `PromotionForm` - Create/edit promotion form
- `PromotionList` - Table view with filters
- `PromotionCard` - Display promotion details
- `ProductSelector` - Multi-select for applicable products
- `CategorySelector` - Multi-select for applicable categories

### Phase 5: Customer Interface Integration

#### 5.1 Checkout Integration
- Add coupon code input field to checkout form
- Real-time validation and discount calculation
- Display applied discount in order summary

#### 5.2 Promotion Display
- Show active site-wide promotions on homepage
- Display applicable promotions on product pages
- Promotion banners/badges on category pages

#### 5.3 Cart Updates
- Extend cart store to handle promotion state
- Update cart calculations to include discounts
- Show discount breakdown in cart summary

### Phase 6: Cart and Order Processing

#### 6.1 Cart Schema Extensions
```typescript
interface Cart {
  // ... existing fields
  appliedPromotion?: {
    code: string
    discountAmount: number
    promotionId: string
  }
  discountAmount?: number
}
```

#### 6.2 Order Schema Extensions
```typescript
interface IOrder {
  // ... existing fields
  appliedPromotion?: {
    code: string
    promotionId: ObjectId
    discountAmount: number
    originalTotal: number
  }
  discountAmount: number
}
```

#### 6.3 Price Calculation Updates
- Modify `calcDeliveryDateAndPrice()` to handle promotions
- Update order creation to track promotion usage
- Ensure proper validation during checkout

## Technical Implementation Details

### Validation Schema (`lib/validator.ts`)
```typescript
export const PromotionInputSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number().min(0),
  startDate: z.date(),
  endDate: z.date(),
  active: z.boolean().default(true),
  minOrderValue: z.number().min(0).default(0),
  usageLimit: z.number().min(0).default(0),
  userUsageLimit: z.number().min(0).default(0),
  appliesTo: z.enum(["all", "products", "categories"]),
  applicableProducts: z.array(MongoId).default([]),
  applicableCategories: z.array(MongoId).default([])
})
```

### Key Integration Points

1. **Cart Store Updates**: Extend Zustand store to handle promotion state
2. **Checkout Flow**: Add promotion validation before order creation
3. **Price Display**: Update all price components to show discounts
4. **Admin Dashboard**: Add promotion metrics to overview page
5. **Email Templates**: Include promotion details in order confirmations

### Security Considerations

1. **Server-side Validation**: All promotion logic on server side
2. **Usage Tracking**: Prevent duplicate usage and abuse
3. **Permission Checks**: Proper RBAC for all admin operations
4. **Input Sanitization**: Validate all user inputs
5. **Rate Limiting**: Prevent promotion code brute force attempts

### Performance Optimizations

1. **Caching**: Cache active promotions for quick lookup
2. **Indexing**: Database indexes on promotion codes and dates
3. **Lazy Loading**: Load promotion details only when needed
4. **Batch Operations**: Efficient bulk operations for admin

## Detailed File Structure

### New Files to Create
```
lib/db/models/
├── promotion.model.ts
└── promotion-usage.model.ts

lib/actions/
└── promotion.actions.ts

lib/validator.ts (extend existing)
lib/constants.ts (extend existing)
types/index.ts (extend existing)

app/[locale]/admin/promotions/
├── page.tsx
├── create/page.tsx
├── [id]/page.tsx
├── promotion-list.tsx
├── promotion-form.tsx
└── components/
    ├── product-selector.tsx
    ├── category-selector.tsx
    └── promotion-usage-stats.tsx

components/shared/promotion/
├── coupon-input.tsx
├── promotion-banner.tsx
├── discount-summary.tsx
└── promotion-badge.tsx

hooks/
└── use-promotion-store.ts (optional)
```

### Database Migration Considerations
- Add promotion fields to existing order schema
- Create indexes for performance optimization
- Consider data migration for existing orders

### API Endpoints (Server Actions)
```typescript
// Admin operations
POST /api/promotions/create
PUT /api/promotions/[id]/update
DELETE /api/promotions/[id]/delete
GET /api/promotions/list
GET /api/promotions/[id]

// Customer operations
POST /api/promotions/validate
GET /api/promotions/active
```

### Testing Strategy
1. **Unit Tests**: Validation logic, discount calculations
2. **Integration Tests**: Cart integration, order processing
3. **E2E Tests**: Complete promotion workflow
4. **Performance Tests**: Large catalog with many promotions
5. **Security Tests**: Permission validation, input sanitization

### Deployment Considerations
1. **Environment Variables**: Add promotion-related configs
2. **Database Indexes**: Ensure proper indexing for performance
3. **Monitoring**: Track promotion usage and performance
4. **Rollback Plan**: Safe deployment with feature flags

## Implementation Priority

### Phase 1 (Core Foundation) - Week 1
- Database models and validation schemas
- RBAC permission updates
- Basic server actions (CRUD operations)

### Phase 2 (Admin Interface) - Week 2
- Admin navigation updates
- Promotion list and form components
- Product/category selectors

### Phase 3 (Customer Integration) - Week 3
- Cart store extensions
- Checkout coupon input
- Price calculation updates

### Phase 4 (Polish & Testing) - Week 4
- Promotion display components
- Comprehensive testing
- Performance optimization
- Documentation

## Success Metrics
- Admin can create and manage promotions efficiently
- Customers can apply coupon codes during checkout
- Discount calculations are accurate and performant
- System handles edge cases gracefully
- No impact on existing functionality

This comprehensive plan ensures a robust, scalable promotion system that integrates seamlessly with the existing e-commerce platform while maintaining code quality and user experience standards.
