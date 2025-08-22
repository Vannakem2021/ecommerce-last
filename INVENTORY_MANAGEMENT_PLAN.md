# Inventory Management System - Implementation Plan

## 📊 **Current State Analysis**

### **Existing Stock Management**
- ✅ **`countInStock` field exists** in Product model (required, number, non-negative)
- ✅ **Stock validation** implemented in cart system (prevents overselling)
- ✅ **Stock deduction** happens when orders are marked as paid
- ✅ **Stock checking** in add-to-cart functionality
- ✅ **Product form** includes countInStock input field

### **Current Stock Workflow**
1. **Product Creation**: Admin sets initial stock via `countInStock` field
2. **Cart Validation**: System checks available stock before adding items
3. **Order Processing**: Stock remains unchanged until payment
4. **Payment Confirmation**: Stock is decremented when order is marked as paid
5. **Stock Display**: Shows available quantity in product pages and cart

### **Missing Functionality**
- ❌ **No SKU system** - products identified only by MongoDB ObjectId
- ❌ **No dedicated inventory management interface**
- ❌ **No stock adjustment tracking** (reasons, history, audit trail)
- ❌ **No bulk stock operations**
- ❌ **No low stock alerts or reporting**

## 🎯 **Implementation Strategy & Key Decisions**

### **1. SKU Implementation Decision: YES, ADD SKUs**

**Reasoning:**
- **Inventory Management**: SKUs provide human-readable product identifiers
- **Operational Efficiency**: Easier for staff to manage inventory with SKUs vs ObjectIds
- **Scalability**: Essential for larger catalogs and warehouse operations
- **Integration**: Future integrations with external systems expect SKUs
- **User Experience**: Better for admin users to reference products

**SKU Strategy:**
- **Auto-generation**: `BRAND-CATEGORY-SEQUENCE` format (e.g., `NIKE-TSHIRT-001`)
- **Manual Override**: Allow admins to set custom SKUs
- **Uniqueness**: Enforce unique constraint in database
- **Backward Compatibility**: Generate SKUs for existing products

### **2. Stock Field Management Decision: HYBRID APPROACH**

**Reasoning:**
- **Keep `countInStock` in Product Model**: Maintains existing cart/order functionality
- **Add Inventory Management Interface**: Provides dedicated stock management tools
- **Dual Entry Points**: Product creation AND inventory management can modify stock
- **Consistency**: Both interfaces update the same `countInStock` field

### **3. Stock Management Strategy: AUDIT TRAIL APPROACH**

**Create separate `StockMovement` model to track all stock changes:**
- **Transparency**: Full audit trail of stock changes
- **Accountability**: Track who made changes and why
- **Reporting**: Enable stock movement reports and analytics
- **Debugging**: Easier to troubleshoot stock discrepancies

## 📋 **Implementation Plan**

### **Phase 1: Database Schema Updates**

#### **1.1 Add SKU to Product Model**
```typescript
// Add to Product schema
sku: {
  type: String,
  required: true,
  unique: true,
  uppercase: true,
}
```

#### **1.2 Create StockMovement Model**
```typescript
interface IStockMovement {
  _id: string
  product: ObjectId // Reference to Product
  sku: string // Denormalized for quick lookup
  type: 'SET' | 'ADJUST' | 'SALE' | 'RETURN' | 'CORRECTION'
  quantity: number // Positive for increase, negative for decrease
  previousStock: number
  newStock: number
  reason: string
  notes?: string
  createdBy: ObjectId // Reference to User
  createdAt: Date
}
```

#### **1.3 Update Validation Schemas**
- Add SKU validation to ProductInputSchema
- Create StockMovementInputSchema
- Create InventoryUpdateSchema

### **Phase 2: SKU Generation & Migration**

#### **2.1 SKU Generation Logic**
```typescript
// Auto-generate SKU format: BRAND-CATEGORY-SEQUENCE
// Example: NIKE-TSHIRT-001, ADIDAS-SHOES-002
function generateSKU(brand: string, category: string): string
```

#### **2.2 Migration Script**
- Generate SKUs for all existing products
- Ensure uniqueness across existing data
- Create initial stock movement records for existing stock

### **Phase 3: Inventory Management Interface**

#### **3.1 Navigation Integration**
- Add "Inventory" to admin sidebar navigation
- Use Package icon for consistency

#### **3.2 Inventory List Page (`/admin/inventory`)**
```typescript
// Columns: SKU, Product Name, Brand, Category, Current Stock, Price, Status, Actions
// Features: Search by SKU/name, filter by brand/category, pagination, sorting
```

#### **3.3 Stock Management Actions**
```typescript
// Set Stock: Absolute quantity setting
interface SetStockAction {
  productId: string
  newQuantity: number
  reason: string
  notes?: string
}

// Adjust Stock: Relative quantity change
interface AdjustStockAction {
  productId: string
  adjustment: number // +10, -5, etc.
  reason: string
  notes?: string
}
```

#### **3.4 Stock Movement History**
- View stock movement history per product
- Filter by date range, movement type, user
- Export capabilities for reporting

### **Phase 4: Enhanced Product Management**

#### **4.1 Update Product Form**
- Add SKU field with auto-generation option
- Keep existing countInStock field
- Add "Manage Inventory" link to existing products

#### **4.2 Product List Enhancements**
- Display SKU in product list
- Add stock level indicators (low stock warnings)
- Quick stock adjustment actions

### **Phase 5: Server Actions & API**

#### **5.1 Inventory Actions**
```typescript
// lib/actions/inventory.actions.ts
export async function setProductStock(data: SetStockAction)
export async function adjustProductStock(data: AdjustStockAction)
export async function getStockMovements(productId: string)
export async function getAllProductsForInventory(filters: InventoryFilters)
export async function generateSKU(brand: string, category: string)
```

#### **5.2 Integration with Existing Order System**
- Update order payment confirmation to create stock movement records
- Maintain existing stock deduction logic
- Add stock movement tracking for sales

## 🗂️ **Files to Create/Modify**

### **New Files**
```
lib/db/models/stock-movement.model.ts
lib/actions/inventory.actions.ts
app/[locale]/admin/inventory/page.tsx
app/[locale]/admin/inventory/inventory-list.tsx
app/[locale]/admin/inventory/stock-adjustment-dialog.tsx
app/[locale]/admin/inventory/stock-history-dialog.tsx
lib/utils/sku-generator.ts
lib/db/migrate-add-skus.ts
```

### **Modified Files**
```
lib/db/models/product.model.ts (add SKU field)
lib/validator.ts (add inventory schemas)
types/index.ts (add inventory types)
app/[locale]/admin/admin-nav.tsx (add inventory nav)
app/[locale]/admin/products/product-form.tsx (add SKU field)
app/[locale]/admin/products/product-list.tsx (display SKU)
lib/actions/order.actions.ts (add stock movement tracking)
messages/en-US.json (add translations)
```

## 🎨 **UI/UX Design Patterns**

### **Consistent with Existing Admin Interface**
- ✅ Same table layout as brands/categories pages
- ✅ Same card-based design for forms
- ✅ Same button styles and spacing
- ✅ Same responsive breakpoints
- ✅ Same toast notifications for actions
- ✅ Same modal/dialog patterns

### **Inventory-Specific UI Elements**
- **Stock Level Indicators**: Color-coded badges (green: good, yellow: low, red: out)
- **Quick Actions**: Inline buttons for common stock adjustments
- **Bulk Operations**: Checkbox selection for bulk stock updates
- **Stock History**: Timeline view of stock movements

## 🔧 **Technical Implementation Details**

### **SKU Generation Algorithm**
```typescript
// Format: BRAND-CATEGORY-SEQUENCE
// 1. Normalize brand/category (uppercase, remove spaces/special chars)
// 2. Find highest sequence number for brand-category combination
// 3. Increment and format with leading zeros
// Example: "Nike T-Shirts" → "NIKE-TSHIRTS-001"
```

### **Stock Movement Tracking**
```typescript
// Every stock change creates a movement record
// Types: SET (absolute), ADJUST (relative), SALE (order), RETURN, CORRECTION
// Maintains full audit trail with user attribution
```

### **Performance Considerations**
- **Indexing**: Add indexes on SKU, product references in StockMovement
- **Pagination**: Implement efficient pagination for large inventories
- **Caching**: Cache frequently accessed stock levels
- **Batch Operations**: Support bulk stock updates for efficiency

## 📊 **Success Metrics**

### **Functional Requirements Met**
- ✅ Dedicated inventory management interface
- ✅ SKU system for product identification
- ✅ Stock adjustment with audit trail
- ✅ Integration with existing product workflow
- ✅ Consistent UI/UX with admin interface

### **Technical Requirements Met**
- ✅ Server actions instead of API routes
- ✅ Existing UI component usage
- ✅ Responsive design
- ✅ Theme compatibility
- ✅ Proper validation and error handling

## 🚀 **Implementation Timeline**

1. **Phase 1**: Database schema (1-2 hours)
2. **Phase 2**: SKU generation & migration (2-3 hours)
3. **Phase 3**: Inventory interface (4-5 hours)
4. **Phase 4**: Product form updates (1-2 hours)
5. **Phase 5**: Server actions & integration (2-3 hours)

**Total Estimated Time**: 10-15 hours

## 🎯 **Next Steps**

1. **Review and approve this plan**
2. **Begin with Phase 1: Database schema updates**
3. **Implement SKU generation and migration**
4. **Build inventory management interface**
5. **Test integration with existing workflows**
6. **Deploy and validate functionality**

This plan provides a comprehensive, practical inventory management solution that integrates seamlessly with the existing ecommerce system while adding powerful new capabilities for stock management and tracking.
