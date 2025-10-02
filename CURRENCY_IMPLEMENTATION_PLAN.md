# Khmer Riel (KHR) Currency Implementation Plan

## Overview
Enable functional currency switching between USD and KHR with exchange rate conversion.

---

## Option 1: Manual Exchange Rate ⭐ RECOMMENDED

### Pros
- ✅ Simple implementation
- ✅ No API costs
- ✅ No external dependencies
- ✅ Admin controls rates
- ✅ Predictable pricing

### Cons
- ❌ Requires manual updates
- ❌ May not reflect real-time rates

### Implementation Steps

#### 1. Update Database Schema (Already exists!)
```typescript
// lib/db/models/setting.model.ts
availableCurrencies: [
  {
    name: "United States Dollar",
    code: "USD",
    symbol: "$",
    convertRate: 1
  },
  {
    name: "Khmer Riel",
    code: "KHR",
    symbol: "៛",
    convertRate: 4100  // Example: 1 USD = 4100 KHR
  }
]
```

#### 2. Update Admin Currency Form
- Remove `disabled` attributes
- Allow editing convertRate for KHR
- Add validation (convertRate > 0)
- Add last updated timestamp

#### 3. Update Store Management
```typescript
// hooks/use-setting-store.ts
- Remove hardcoded USD logic
- Add setCurrency(code: string) method
- Store selected currency in cookie/localStorage
- Load user's preference on mount
```

#### 4. Update Currency Switcher
```typescript
// components/shared/header/currency-switcher.tsx
- Add onClick handlers
- Update current currency on selection
- Persist to cookie
- Show visual feedback for active currency
```

#### 5. Price Conversion Logic (Already exists!)
```typescript
// components/shared/product/product-price.tsx
const convertedPrice = round2(currency.convertRate * priceInUSD)
// If USD selected: 1 * 100 = $100
// If KHR selected: 4100 * 100 = ៛410,000
```

---

## Option 2: Automatic Exchange Rate API 🔄 ADVANCED

### Pros
- ✅ Always up-to-date rates
- ✅ No manual intervention
- ✅ Professional solution

### Cons
- ❌ API costs (some free tiers exist)
- ❌ External dependency
- ❌ Requires error handling
- ❌ Rate limits

### Recommended APIs

#### A) ExchangeRate-API (FREE tier available)
- URL: https://www.exchangerate-api.com
- Free: 1,500 requests/month
- Supports USD → KHR conversion
- Easy integration

```typescript
// Example API call
const response = await fetch('https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD')
const data = await response.json()
const khrRate = data.conversion_rates.KHR // ~4100
```

#### B) Fixer.io
- More comprehensive
- Free tier: 100 requests/month
- Better for multiple currencies

#### C) Open Exchange Rates
- Very reliable
- Free: 1,000 requests/month
- Good documentation

### Implementation with API

```typescript
// lib/actions/exchange-rate.actions.ts
'use server'

export async function updateExchangeRates() {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`
    )
    const data = await response.json()

    // Update database with new KHR rate
    await updateSetting({
      'availableCurrencies.1.convertRate': data.conversion_rates.KHR,
      'availableCurrencies.1.lastUpdated': new Date()
    })

    return { success: true, rate: data.conversion_rates.KHR }
  } catch (error) {
    return { success: false, error: 'Failed to fetch rates' }
  }
}
```

#### Cron Job Setup
```typescript
// Option A: Vercel Cron (if using Vercel)
// vercel.json
{
  "crons": [{
    "path": "/api/cron/update-exchange-rates",
    "schedule": "0 0 * * *"  // Daily at midnight
  }]
}

// Option B: Node-cron
import cron from 'node-cron'
// Run every day at 6 AM
cron.schedule('0 6 * * *', updateExchangeRates)

// Option C: Manual admin button
// Add "Update Rates" button in admin settings
```

---

## Option 3: Hybrid Approach 🎯 BEST BALANCE

Combine manual control with API assistance.

### How it works
1. API fetches current rate daily
2. Admin reviews and approves rate changes
3. Fallback to manual if API fails
4. Rate history tracking

### Implementation
```typescript
interface CurrencyRate {
  code: string
  symbol: string
  convertRate: number
  suggestedRate?: number  // From API
  lastApiUpdate?: Date
  lastManualUpdate?: Date
  autoUpdate: boolean     // Admin can disable auto-updates
}
```

---

## Recommended Implementation Plan

### Phase 1: Basic Manual (Week 1) ⭐
1. Enable currency switcher with state management
2. Add cookie persistence
3. Update admin form to allow rate editing
4. Test USD ↔ KHR conversion

### Phase 2: Enhanced UX (Week 2)
1. Add currency symbol to prices
2. Show conversion info tooltip
3. Add "Prices in USD" notice when showing KHR
4. Format KHR properly (no decimals for Riel)

### Phase 3: API Integration (Week 3) - Optional
1. Integrate ExchangeRate-API
2. Add daily cron job
3. Show "last updated" timestamp
4. Admin notification for large rate changes

---

## Current Exchange Rate (Reference)
- **1 USD = ~4,100 KHR** (as of 2024)
- Cambodia often uses both currencies
- Common to show prices in both USD and KHR

---

## Code Files to Modify

### Must Change (Phase 1)
- [ ] `hooks/use-setting-store.ts` - Remove hardcoded USD
- [ ] `components/shared/header/currency-switcher.tsx` - Add onClick handlers
- [ ] `app/[locale]/admin/settings/currency-form.tsx` - Enable editing
- [ ] `lib/data.ts` - Add KHR to default settings

### Should Change (Phase 2)
- [ ] `components/shared/product/product-price.tsx` - Better KHR formatting
- [ ] `lib/utils.ts` - Currency formatter improvements
- [ ] Add currency indicator to cart/checkout

### Optional (Phase 3)
- [ ] Create `lib/actions/exchange-rate.actions.ts`
- [ ] Create `app/api/cron/update-rates/route.ts`
- [ ] Add rate history tracking

---

## KHR-Specific Considerations

### Display Format
```typescript
// USD: $1,299.99
// KHR: ៛5,329,959 (no decimals, whole numbers only)

function formatKHR(amount: number) {
  return new Intl.NumberFormat('km-KH', {
    style: 'currency',
    currency: 'KHR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
```

### Rounding Rules
- KHR typically rounds to nearest 100 or 500
- Example: 5,329,959 KHR → 5,330,000 KHR

### Dual Pricing (Common in Cambodia)
Many Cambodian businesses show both:
```
$1,299.99 / ៛5,330,000
```

---

## Testing Checklist

- [ ] Currency switcher changes active currency
- [ ] Selection persists across page reloads
- [ ] Prices convert correctly (USD → KHR)
- [ ] Prices convert correctly (KHR → USD)
- [ ] Cart totals calculate in selected currency
- [ ] Checkout shows correct currency
- [ ] Admin can update exchange rates
- [ ] Mobile responsive currency switcher

---

## Security Considerations

1. **Payment Processing**
   - Process payments in USD (convert KHR to USD at checkout)
   - Store original price in USD in database
   - Log exchange rate used at time of purchase

2. **Rate Manipulation**
   - Validate convertRate > 0
   - Admin-only rate updates
   - Rate change audit log

3. **API Security**
   - Store API key in environment variables
   - Handle API failures gracefully
   - Cache rates to reduce API calls

---

## Estimated Development Time

| Phase | Time | Effort |
|-------|------|--------|
| Phase 1: Manual | 8-12 hours | Medium |
| Phase 2: Enhanced UX | 4-6 hours | Low |
| Phase 3: API Integration | 6-8 hours | Medium |
| **Total** | **18-26 hours** | - |

---

## My Recommendation: Start with Phase 1

1. **Quick Win**: Get currency switching working in 1-2 days
2. **Low Risk**: No external dependencies
3. **User Value**: Customers can see prices in KHR immediately
4. **Future-Proof**: Easy to add API later if needed

Exchange rate of ~4,100 KHR per USD is stable enough for manual updates every few weeks.

---

## Next Steps

Would you like me to implement:
- **A)** Phase 1: Manual currency switching (recommended to start)
- **B)** Full implementation with API (all phases)
- **C)** Just show me the code changes needed
