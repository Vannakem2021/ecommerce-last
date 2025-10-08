# Configuration-Based Variants - Phase 1 Complete

## ✅ Completed: Schema & Validation Layer

### **1. Product Model Updates** (`lib/db/models/product.model.ts`)

**New TypeScript Interface**:
```typescript
export interface IProductConfiguration {
  sku: string                    // Unique SKU for this configuration
  name: string                   // Display name (e.g., "256GB")
  price: number                  // Fixed price (NOT modifier)
  stock: number                  // Stock for THIS config
  isDefault: boolean             // Default selection
  attributes: {
    storage?: string
    ram?: string
    color?: string
    [key: string]: string | undefined
  }
  images?: string[]              // Optional config-specific images
  disabled?: boolean             // Sold out or discontinued
}
```

**Updated IProduct Interface**:
- ✅ Added `hasConfigurations?: boolean`
- ✅ Added `configurations?: IProductConfiguration[]`
- ✅ Kept legacy `variants` field for backward compatibility

**Database Schema**:
- ✅ Added `hasConfigurations` field (Boolean, default: false)
- ✅ Added `configurations` array with embedded schema:
  - `sku` (String, required, unique per config)
  - `name` (String, required)
  - `price` (Number, required) - **Fixed price, not modifier**
  - `stock` (Number, required, default: 0)
  - `isDefault` (Boolean, required)
  - `attributes` (Mixed type for flexibility)
  - `images` (Array of strings, optional)
  - `disabled` (Boolean, optional)

### **2. Validator Schemas** (`lib/validator.ts`)

**New Configuration Schema**:
```typescript
export const ProductConfigurationSchema = z.object({
  sku: z.string().min(3).toUpperCase(),
  name: z.string().min(1),
  price: Price("Configuration price"),
  stock: z.coerce.number().int().nonnegative(),
  isDefault: z.boolean(),
  attributes: z.record(z.string(), z.string().optional()),
  images: z.array(z.string()).optional(),
  disabled: z.boolean().optional().default(false),
});
```

**Updated ProductBaseSchema**:
- ✅ Added `hasConfigurations` field
- ✅ Added `configurations` array (validated against ProductConfigurationSchema)

**Custom Validation Rules** (applied to both Input and Update schemas):
1. ✅ **At least one default**: If configurations exist, at least one must be marked as default
2. ✅ **Unique SKUs**: Configuration SKUs must be unique within product
3. ✅ **Only one default**: Only one configuration can be marked as default

**Validation Examples**:
```typescript
// ❌ INVALID: No default configuration
configurations: [
  { sku: "...", isDefault: false, ... },
  { sku: "...", isDefault: false, ... }
]
// Error: "At least one configuration must be marked as default"

// ❌ INVALID: Duplicate SKUs
configurations: [
  { sku: "IPHO15-128GB", isDefault: true, ... },
  { sku: "IPHO15-128GB", isDefault: false, ... }
]
// Error: "Configuration SKUs must be unique"

// ❌ INVALID: Multiple defaults
configurations: [
  { sku: "IPHO15-128GB", isDefault: true, ... },
  { sku: "IPHO15-256GB", isDefault: true, ... }
]
// Error: "Only one configuration can be marked as default"

// ✅ VALID
configurations: [
  { sku: "IPHO15-128GB", isDefault: true, price: 999, ... },
  { sku: "IPHO15-256GB", isDefault: false, price: 1099, ... },
  { sku: "IPHO15-512GB", isDefault: false, price: 1299, ... }
]
```

---

## 🔄 Backward Compatibility

**How it works**:
- Products WITHOUT `hasConfigurations=true` use legacy variant system (additive pricing)
- Products WITH `hasConfigurations=true` use new configuration system (fixed pricing)
- Both systems can coexist during migration period

**Detecting which system to use**:
```typescript
if (product.hasConfigurations && product.configurations?.length > 0) {
  // Use configuration-based pricing
  const defaultConfig = product.configurations.find(c => c.isDefault)
  const price = defaultConfig.price
} else if (product.variants) {
  // Use legacy additive pricing
  const price = product.price + ramModifier + storageModifier
} else {
  // Simple product without variants
  const price = product.price
}
```

---

## 📊 Data Model Comparison

### **Old System (Additive Pricing)**
```json
{
  "name": "iPhone 15 Pro",
  "price": 999,
  "variants": {
    "storage": [
      { "value": "128GB", "priceModifier": 0 },
      { "value": "256GB", "priceModifier": 100 }
    ]
  }
}
```
**Calculation**: $999 + $100 = $1,099 ✅
**Problem**: Doesn't match real-world SKUs, no per-variant stock

### **New System (Configuration-Based)**
```json
{
  "name": "iPhone 15 Pro",
  "hasConfigurations": true,
  "configurations": [
    {
      "sku": "IPHO15PRO-128GB",
      "name": "128GB",
      "price": 999,
      "stock": 15,
      "isDefault": true,
      "attributes": { "storage": "128GB" }
    },
    {
      "sku": "IPHO15PRO-256GB",
      "name": "256GB",
      "price": 1099,
      "stock": 8,
      "isDefault": false,
      "attributes": { "storage": "256GB" }
    }
  ]
}
```
**Lookup**: Select 256GB → Price: $1,099 ✅
**Benefits**: Real SKUs, per-config stock, fixed pricing

---

## 🎯 Next Steps

### **Phase 2: Admin UI** (In Progress)
- [ ] Create `ConfigurationManager` component
- [ ] Update `product-form.tsx` to show configuration UI
- [ ] Add "Use Configurations" toggle
- [ ] Implement Add/Remove configuration functionality
- [ ] Auto-generate SKUs from base SKU + attributes
- [ ] Quick-fill templates (Phone, Laptop presets)

### **Phase 3: Storefront UI**
- [ ] Create `SelectConfiguration` component
- [ ] Update `ProductDetailClient` to detect configurations
- [ ] Update `ProductCard` to show configuration price ranges
- [ ] Update cart to store configuration SKU

### **Phase 4: Order Processing**
- [ ] Update order validation to support configurations
- [ ] Validate configuration SKU exists
- [ ] Recalculate price from configuration
- [ ] Validate stock at configuration level

### **Phase 5: Migration & Testing**
- [ ] Create migration script
- [ ] Test with real products
- [ ] Gradual rollout (one category at a time)
- [ ] Monitor and fix issues

---

## 🧪 Testing the Schema

**To test the validation** (in Node.js/TypeScript):

```typescript
import { ProductInputSchema } from '@/lib/validator'

// Test valid configuration
const validProduct = {
  name: "iPhone 15 Pro",
  // ... other required fields ...
  hasConfigurations: true,
  configurations: [
    {
      sku: "IPHO15-128GB",
      name: "128GB",
      price: 999,
      stock: 10,
      isDefault: true,
      attributes: { storage: "128GB" }
    }
  ]
}

const result = ProductInputSchema.safeParse(validProduct)
console.log(result.success) // Should be true

// Test invalid configuration (no default)
const invalidProduct = {
  ...validProduct,
  configurations: [
    {
      sku: "IPHO15-128GB",
      name: "128GB",
      price: 999,
      stock: 10,
      isDefault: false, // ❌ No default!
      attributes: { storage: "128GB" }
    }
  ]
}

const result2 = ProductInputSchema.safeParse(invalidProduct)
console.log(result2.success) // Should be false
console.log(result2.error?.issues) // "At least one configuration must be marked as default"
```

---

## 📝 Schema Benefits

1. **Type Safety**: TypeScript interfaces provide compile-time checks
2. **Runtime Validation**: Zod schemas validate data before database insertion
3. **Clear Business Rules**: Validation enforces configuration requirements
4. **Flexible Attributes**: `Schema.Types.Mixed` allows any attribute combination
5. **Future-Proof**: Easy to add new attributes without schema changes

---

## 🔍 Key Design Decisions

### **Why Schema.Types.Mixed for attributes?**
- **Flexibility**: Different products need different attributes
  - Phones: storage, ram, color
  - Laptops: ram, storage, processor
  - Clothing: size, color, material
- **No schema changes**: Add new attributes without migration
- **Simple validation**: Just ensure values are strings

### **Why fixed prices instead of modifiers?**
- **Real-world accuracy**: Matches how products are actually sold
- **No calculation errors**: Direct lookup, no math
- **Warehouse-friendly**: Each config = unique SKU
- **Clear pricing**: No confusion about final price

### **Why single default configuration?**
- **Better UX**: Clear starting point for users
- **Simpler logic**: No ambiguity about initial selection
- **Common pattern**: Industry standard (Amazon, Apple, etc.)

---

## ✅ Phase 1 Status: COMPLETE

**What's Working**:
- ✅ Product model accepts configurations
- ✅ Configuration data validates correctly
- ✅ Unique SKU enforcement
- ✅ Default configuration requirement
- ✅ Backward compatibility maintained
- ✅ TypeScript types fully defined

**Ready for**: Building admin UI components (Phase 2)

---

**Timestamp**: Phase 1 completed
**Files Modified**: 2
- `lib/db/models/product.model.ts` - Schema & interface
- `lib/validator.ts` - Validation rules

**Lines Added**: ~100
**Breaking Changes**: None (fully backward compatible)
