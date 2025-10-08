# Promotion Code Display Strategies for E-commerce

## Overview
This document outlines how to effectively display promotion/coupon codes to customers in a real-world e-commerce application.

---

## 🎯 Your Current Implementation

### **What You Have:**
1. ✅ **PromotionBanner Component** - Displays active promotions with codes
2. ✅ **PromotionBadge Component** - Shows promotion badges on products
3. ✅ **CouponInput Component** - Allows customers to enter codes at checkout
4. ✅ **getActivePromotions API** - Fetches currently valid promotions

---

## 🌟 10 Best Ways to Display Promotion Codes to Customers

### **1. Homepage Banner (Highest Visibility)** ⭐⭐⭐

**Where:** Top of homepage, above hero section  
**When:** Always show active promotions  
**Current Status:** ✅ Can use `PromotionBanner` component

**Example Implementation:**
```tsx
// app/[locale]/(root)/page.tsx
import PromotionBanner from '@/components/shared/promotion/promotion-banner'

export default function HomePage() {
  return (
    <div>
      {/* Promotion Banner at Top */}
      <PromotionBanner limit={3} showDismiss={true} className="mb-6" />
      
      {/* Rest of homepage content */}
      <Hero />
      <FeaturedProducts />
    </div>
  )
}
```

**Benefits:**
- Maximum visibility
- Encourages immediate action
- Shows multiple promotions
- Dismissible (better UX)

---

### **2. Product Card Badges** ⭐⭐⭐

**Where:** On product cards in listings/grids  
**When:** Show if product is eligible for promotion  
**Current Status:** ✅ Can use `PromotionBadge` component

**Example:**
```tsx
// components/shared/product/product-card.tsx
<ProductCard>
  <ProductImage />
  <PromotionBadge 
    productId={product._id} 
    categoryId={product.category}
    size="sm"
    context="product"
  />
  <ProductDetails />
</ProductCard>
```

**Shows:**
- "20% OFF" badge
- "FREE SHIP" badge
- "$10 OFF" badge

---

### **3. Sticky Top Bar Announcement** ⭐⭐⭐

**Where:** Fixed bar at very top of all pages  
**When:** For site-wide promotions  
**Current Status:** 🟡 Need to create

**Create:** `components/shared/promotion/sticky-promo-bar.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Tag } from 'lucide-react'
import { getActivePromotions } from '@/lib/actions/promotion.actions'

export default function StickyPromoBar() {
  const [promo, setPromo] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Load the highest priority site-wide promotion
    getActivePromotions().then(promos => {
      const siteWide = promos.find(p => p.appliesTo === 'all')
      if (siteWide) setPromo(siteWide)
    })
  }, [])

  if (!promo || dismissed) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center justify-center gap-2">
        <Tag className="h-4 w-4" />
        <span>
          🎉 Use code <strong className="font-mono mx-1 px-2 py-0.5 bg-white/20 rounded">{promo.code}</strong> 
          for {promo.type === 'percentage' ? `${promo.value}% OFF` : `$${promo.value} OFF`}!
        </span>
        <button 
          onClick={() => setDismissed(true)}
          className="ml-4 hover:bg-white/20 rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

**Add to root layout:**
```tsx
// app/[locale]/layout.tsx
<body>
  <StickyPromoBar />
  <Header />
  {children}
</body>
```

---

### **4. Cart Page Promotion Suggestions** ⭐⭐⭐

**Where:** On cart page, above cart items  
**When:** Show applicable promotions based on cart contents  
**Current Status:** 🟡 Need to create

**Create:** `components/shared/promotion/cart-promo-suggestions.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Tag, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getActivePromotions } from '@/lib/actions/promotion.actions'
import useUserCart from '@/hooks/use-user-cart'

export default function CartPromoSuggestions() {
  const { cart } = useUserCart()
  const [promos, setPromos] = useState<any[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [cart.items])

  const loadSuggestions = async () => {
    const activePromos = await getActivePromotions()
    
    // Filter promotions applicable to cart
    const applicable = activePromos.filter(promo => {
      // Check if cart meets minimum order value
      if (promo.minOrderValue > 0 && cart.itemsPrice < promo.minOrderValue) {
        return false
      }
      
      // Site-wide promos always applicable
      if (promo.appliesTo === 'all') return true
      
      // Check product/category specific
      // ... filtering logic
      
      return false
    })
    
    setPromos(applicable)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (promos.length === 0) return null

  return (
    <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900 dark:text-green-100">
          💰 Available Discounts
        </h3>
      </div>
      
      <div className="space-y-2">
        {promos.map(promo => (
          <div key={promo._id} className="flex items-center justify-between">
            <div>
              <span className="font-mono font-bold text-sm">{promo.code}</span>
              <span className="text-sm ml-2">
                - {promo.type === 'percentage' ? `${promo.value}% OFF` : `$${promo.value} OFF`}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyCode(promo.code)}
            >
              {copiedCode === promo.code ? (
                <><Check className="h-4 w-4 mr-1" /> Copied</>
              ) : (
                <><Copy className="h-4 w-4 mr-1" /> Copy</>
              )}
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        ℹ️ Apply code at checkout to save money!
      </p>
    </Card>
  )
}
```

**Add to cart page:**
```tsx
// app/[locale]/(root)/cart/page.tsx
<CartPage>
  <CartPromoSuggestions />  {/* Add this */}
  <CartItems />
  <CartSummary />
</CartPage>
```

---

### **5. Checkout Page - Auto-Apply Best Discount** ⭐⭐⭐

**Where:** Checkout page  
**When:** Automatically show and apply best available discount  
**Current Status:** 🟡 Need to enhance

**Enhancement to `CouponInput` component:**

```tsx
// Add auto-suggestion feature
export default function CouponInput() {
  const [suggestedPromo, setSuggestedPromo] = useState<any>(null)
  
  useEffect(() => {
    // Find best applicable promotion
    const findBestPromo = async () => {
      const activePromos = await getActivePromotions()
      // Filter and sort by discount value
      const applicable = activePromos
        .filter(p => /* check if applicable to cart */)
        .sort((a, b) => calculateDiscount(b) - calculateDiscount(a))
      
      if (applicable.length > 0) {
        setSuggestedPromo(applicable[0])
      }
    }
    findBestPromo()
  }, [cart])

  return (
    <div>
      {suggestedPromo && !cart.appliedPromotion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
          <p className="text-sm font-medium text-yellow-800">
            💡 Try code <strong>{suggestedPromo.code}</strong> to save {' '}
            {suggestedPromo.type === 'percentage' 
              ? `${suggestedPromo.value}%` 
              : `$${suggestedPromo.value}`}
          </p>
          <Button 
            size="sm" 
            onClick={() => applyPromotion(suggestedPromo.code)}
            className="mt-2"
          >
            Apply Now
          </Button>
        </div>
      )}
      
      {/* Existing coupon input */}
      <CouponInputField />
    </div>
  )
}
```

---

### **6. Email Marketing** ⭐⭐⭐

**Where:** Email newsletters, abandoned cart emails  
**When:** Regular campaigns or triggered emails  
**Current Status:** 🔴 Not implemented (requires email service)

**Strategies:**
- **Welcome Email**: Send 10% OFF code to new subscribers
- **Birthday Email**: Special discount on customer's birthday
- **Abandoned Cart**: Send reminder with 5% discount code
- **Win-back Campaign**: 20% OFF for inactive customers
- **VIP Exclusive**: Special codes for loyal customers

**Example Email Template:**
```html
Subject: 🎉 Your Exclusive 20% OFF Code Inside!

Hi {{customerName}},

Here's your exclusive discount code:

┌─────────────────────┐
│  Code: SAVE20       │
│  20% OFF Everything │
│  Valid until Dec 31 │
└─────────────────────┘

[Shop Now →]
```

---

### **7. Dedicated Promotions Page** ⭐⭐

**Where:** `/promotions` or `/deals` page  
**When:** Show all active promotions  
**Current Status:** 🔴 Not implemented

**Create:** `app/[locale]/(root)/promotions/page.tsx`

```tsx
import { getActivePromotions } from '@/lib/actions/promotion.actions'
import { Card } from '@/components/ui/card'
import { Tag, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PromotionsPage() {
  const promotions = await getActivePromotions()

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-8">
        <Tag className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl font-bold mb-2">Current Promotions</h1>
        <p className="text-muted-foreground">
          Save big with our active discount codes
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promo => (
          <Card key={promo._id} className="p-6">
            <div className="text-center">
              <div className="inline-block bg-primary/10 rounded-full p-4 mb-4">
                {promo.type === 'percentage' && (
                  <span className="text-4xl font-bold text-primary">
                    {promo.value}%
                  </span>
                )}
                {promo.type === 'fixed' && (
                  <span className="text-4xl font-bold text-primary">
                    ${promo.value}
                  </span>
                )}
                {promo.type === 'free_shipping' && (
                  <span className="text-2xl font-bold text-primary">
                    FREE SHIPPING
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{promo.name}</h3>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 mb-4">
                <code className="text-2xl font-mono font-bold">
                  {promo.code}
                </code>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {promo.description}
              </p>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                {promo.minOrderValue > 0 && (
                  <p>📦 Min. order: ${promo.minOrderValue}</p>
                )}
                <p>⏰ Valid until: {new Date(promo.endDate).toLocaleDateString()}</p>
                {promo.usageLimit > 0 && (
                  <p>🔢 {promo.usageLimit - promo.usedCount} uses remaining</p>
                )}
              </div>
              
              <Button className="w-full mt-4">
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**Add to navigation:**
```tsx
<NavLink href="/promotions">🏷️ Deals</NavLink>
```

---

### **8. Exit Intent Popup** ⭐⭐

**Where:** Modal popup when user tries to leave  
**When:** User moves mouse to close tab/browser  
**Current Status:** 🔴 Not implemented

**Create:** `components/shared/promotion/exit-intent-popup.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Tag } from 'lucide-react'

export default function ExitIntentPopup() {
  const [showPopup, setShowPopup] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect() => {
    // Check if already shown in this session
    if (sessionStorage.getItem('exitPopupShown')) {
      setHasShown(true)
      return
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // If mouse leaves from top of page
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true)
        setHasShown(true)
        sessionStorage.setItem('exitPopupShown', 'true')
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [hasShown])

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center">
          <Tag className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Wait! Don't Go!</h2>
          <p className="text-muted-foreground mb-4">
            Here's an exclusive 10% OFF code just for you
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 mb-4">
            <code className="text-3xl font-mono font-bold">SAVE10</code>
            <p className="text-sm text-muted-foreground mt-2">
              Valid for the next 24 hours
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => {
              navigator.clipboard.writeText('SAVE10')
              setShowPopup(false)
            }}>
              Copy Code & Shop
            </Button>
            <Button variant="outline" onClick={() => setShowPopup(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Add to root layout:**
```tsx
<body>
  {children}
  <ExitIntentPopup />
</body>
```

---

### **9. Social Media** ⭐⭐

**Where:** Facebook, Instagram, Twitter posts  
**When:** Regular campaigns or special events  
**Current Status:** 🔴 Manual process

**Best Practices:**
- **Flash Sales**: "⚡ 24-Hour Flash Sale! Use code FLASH24 for 30% OFF"
- **Holiday Specials**: "🎄 Christmas Special: XMAS25 for 25% OFF"
- **New Followers**: "Welcome! Use WELCOME10 for 10% OFF your first order"
- **Engagement**: "Like & Comment to win a 50% OFF code!"

**Example Post Template:**
```
🎉 EXCLUSIVE OFFER FOR OUR FOLLOWERS! 🎉

Save BIG with code: SOCIAL20
✨ 20% OFF Everything
🚚 + FREE Shipping
⏰ Valid this week only!

Shop now: [link]

#Discount #Sale #Shopping #Deals
```

---

### **10. Product Detail Page Banner** ⭐⭐

**Where:** On individual product pages  
**When:** If promotion applies to that product  
**Current Status:** 🟡 Can use `PromotionBadge`

**Enhancement:**
```tsx
// app/[locale]/(root)/product/[slug]/page.tsx
<ProductDetailPage>
  {/* Show applicable promotions for this product */}
  <div className="mb-4">
    <PromotionBadge 
      productId={product._id}
      categoryId={product.category}
      size="lg"
      context="product"
    />
  </div>
  
  {/* Show promotion banner if applicable */}
  {hasApplicablePromo && (
    <Card className="bg-green-50 border-green-200 p-4 mb-4">
      <p className="text-green-800 font-medium">
        🎉 This product is eligible for <strong>{promo.value}% OFF</strong>!
        Use code <code className="font-mono bg-green-100 px-2 py-1 rounded">{promo.code}</code> at checkout.
      </p>
    </Card>
  )}
  
  <ProductImages />
  <ProductInfo />
</ProductDetailPage>
```

---

## 📊 Implementation Priority

### **Quick Wins (Implement First):**
1. ✅ **Homepage Banner** - Already have component, just add to homepage
2. ✅ **Product Badges** - Already have component, add to product cards
3. 🟡 **Sticky Top Bar** - Easy to implement, high visibility

### **Medium Priority:**
4. 🟡 **Cart Suggestions** - Helps conversion
5. 🟡 **Checkout Auto-Apply** - Reduces friction
6. 🟡 **Promotions Page** - SEO benefit

### **Long Term:**
7. 🔴 **Email Marketing** - Requires email service setup
8. 🔴 **Exit Intent Popup** - Can be annoying if overused
9. 🔴 **Social Media** - Manual process, needs marketing team
10. 🟡 **Product Page Banner** - Nice to have

---

## 🎨 Design Best Practices

### **Visual Hierarchy:**
1. **Use attention-grabbing colors** - Red, green, yellow for savings
2. **Make codes prominent** - Large, monospace font
3. **Add urgency** - "Limited time", "Only X uses left"
4. **Use icons** - Tag, percent, dollar, truck icons

### **Copy Tips:**
- **Be clear**: "20% OFF" not "Discount available"
- **Add value**: "Save $50!" not just "Use code"
- **Create urgency**: "Ends tonight!" or "Only 10 uses left"
- **Show benefits**: "FREE Shipping on orders $50+"

### **Mobile Optimization:**
- Codes should be **tap to copy**
- Banners should be **dismissible** (don't block content)
- Use **bottom sheets** instead of top bars on mobile
- Keep text **short and scannable**

---

## 💡 Advanced Features

### **Gamification:**
- **Spin-the-Wheel**: Win random discount codes
- **Scratch Cards**: Reveal hidden codes
- **Quiz Rewards**: Answer questions to unlock codes

### **Personalization:**
- **Birthday Codes**: Automatic on user's birthday
- **Loyalty Tiers**: VIP customers get better codes
- **Abandoned Cart**: Send unique code after 24 hours
- **First Purchase**: Welcome discount for new customers

### **Smart Recommendations:**
- **AI-Powered**: Suggest best code based on cart
- **Multi-Code Support**: Apply multiple compatible codes
- **Auto-Apply**: Automatically apply best discount
- **Price Drop Alerts**: Notify when items go on sale

---

## 🚀 Implementation Checklist

### **Phase 1: Essential (Week 1)**
- [ ] Add `PromotionBanner` to homepage
- [ ] Add `PromotionBadge` to product cards
- [ ] Create sticky top bar component
- [ ] Test on mobile devices

### **Phase 2: Conversion Optimization (Week 2)**
- [ ] Add cart page promo suggestions
- [ ] Enhance checkout with auto-apply
- [ ] Create dedicated promotions page
- [ ] Add to main navigation

### **Phase 3: Advanced (Week 3-4)**
- [ ] Implement exit intent popup
- [ ] Set up email marketing templates
- [ ] Add social media integration
- [ ] Create analytics dashboard

---

## 📈 Success Metrics

### **Track These KPIs:**
1. **Promotion Usage Rate** - How many customers use codes
2. **Average Discount Per Order** - Impact on revenue
3. **Conversion Rate** - Before/after showing promotions
4. **Cart Abandonment** - Does showing codes reduce abandonment
5. **Customer Acquisition Cost** - ROI of promotion campaigns

### **A/B Testing Ideas:**
- Banner placement (top vs sidebar)
- Code visibility (always shown vs hidden until cart)
- Urgency messaging ("Limited time" vs "While supplies last")
- Discount types (percentage vs fixed amount)

---

## 🔒 Security Considerations

1. **Rate Limiting**: Prevent code guessing attacks
2. **One-Time Codes**: Generate unique codes for email campaigns
3. **User Limits**: Enforce per-user usage limits
4. **Expiry Checks**: Server-side validation of dates
5. **Fraud Detection**: Monitor unusual usage patterns

---

## 📝 Next Steps

1. **Review current implementation** - Test existing components
2. **Choose priority features** - Based on business goals
3. **Design mockups** - Create visual designs
4. **Implement in phases** - Start with quick wins
5. **Monitor and optimize** - Track metrics and iterate

---

**Remember**: The goal is to make promotions visible enough to drive conversions, but not so aggressive that they annoy customers or train them to always wait for discounts!
