# Metadata & SEO Checklist for Deployment

Complete checklist to review and update metadata, SEO, and branding before deploying to production.

---

## ✅ Critical Items to Update

### 1. **Application Metadata** 

#### `.env.local` / Environment Variables

Current values that need updating:

```env
# ❌ NEEDS UPDATE - Currently set to "Amazona"
NEXT_PUBLIC_APP_NAME=BCS

# ❌ NEEDS UPDATE - Generic description
NEXT_PUBLIC_APP_DESCRIPTION=Your premier destination for the latest electronics and cutting-edge technology

# ✅ UPDATE for production
NEXT_PUBLIC_SERVER_URL=https://your-actual-domain.com
```

**Location**: `.env.local` (lines 3-5)
**Action**: Update before deployment

---

### 2. **Root Layout Metadata**

#### File: `app/[locale]/layout.tsx`

**Current Implementation**: ✅ **GOOD** - Dynamically loads from database settings

```typescript
export async function generateMetadata() {
  const {
    site: { name, description, url },
  } = await getSetting();
  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${description}`,
    },
    description: description,
    metadataBase: new URL(url),
  };
}
```

**Status**: ✅ Pulls from database settings (configurable via admin panel)
**Action**: Update via Admin Panel → Settings after deployment

---

### 3. **Database Settings** (Configure via Admin Panel)

After deployment, login to admin and update:

**Path**: `/admin/settings`

#### Site Information Tab:
- **Site Name**: `BCS` or your actual business name
- **Description**: Your actual business description
- **URL**: `https://yourdomain.com`
- **Logo**: Upload your actual logo
- **Email**: `support@yourdomain.com`
- **Phone**: Your actual phone number
- **Address**: Your actual business address
- **Copyright**: Update year and company name

**Current Defaults** (from `lib/data.ts`):
```typescript
site: {
  name: "BCS",
  description: "BCS is your premier destination for the latest electronics...",
  url: "https://bcs.vercel.app",  // ❌ UPDATE THIS
  logo: "/icons/logo.webp",
  copyright: "2000-2024, BCS.com, Inc. or its affiliates",
  email: "admin@bcs.com",  // ❌ UPDATE THIS
  address: "1234 Tech Street, Silicon Valley, CA, Zip 12345",  // ❌ UPDATE THIS
  phone: "+1 (123) 456-7890",  // ❌ UPDATE THIS
}
```

---

### 4. **Page-Specific Metadata**

All pages use proper metadata. Here's a summary:

#### ✅ **Auth Pages** (Properly configured)
- `/sign-in` → Title: "Sign In"
- `/sign-up` → Title: "Sign Up"
- `/verify-email` → Title: "Verify Email" + description
- `/forgot-password` → Title: "Forgot Password" + description
- `/reset-password` → Title: "Reset Password" + description

#### ✅ **Customer Pages** (Properly configured)
- `/checkout` → Title: "Checkout"
- `/checkout/[id]` → Title: "Payment"
- `/product/[slug]` → Dynamic metadata (SEO optimized)
- `/search` → Dynamic metadata with search terms

#### ✅ **Admin Pages** (Properly configured)
- `/admin/settings` → Title: "Setting"
- `/admin/users` → Proper titles
- `/admin/products` → Proper titles
- All admin CRUD pages have appropriate titles

---

### 5. **SEO & Social Media Tags**

#### Missing (Recommended to Add):

**Open Graph Tags** - For social media sharing
**Twitter Card Tags** - For Twitter sharing

**Recommended Addition** to `app/[locale]/layout.tsx`:

```typescript
export async function generateMetadata() {
  const {
    site: { name, description, url, logo },
  } = await getSetting();
  
  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${description}`,
    },
    description: description,
    metadataBase: new URL(url),
    
    // Open Graph (Facebook, LinkedIn)
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: url,
      title: name,
      description: description,
      siteName: name,
      images: [
        {
          url: `${url}${logo}`,
          width: 1200,
          height: 630,
          alt: `${name} Logo`,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description,
      images: [`${url}${logo}`],
    },
    
    // Additional SEO
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

---

### 6. **Favicon & App Icons**

**Current Location**: `/public/icons/`

**Checklist**:
- [ ] `favicon.ico` - Main favicon (16x16, 32x32)
- [ ] `apple-touch-icon.png` - iOS home screen (180x180)
- [ ] `icon-192.png` - Android icon (192x192)
- [ ] `icon-512.png` - Android splash (512x512)
- [ ] `logo.webp` - Main logo for site

**Status**: ✅ Icons folder exists
**Action**: Verify all icon files are present and branded correctly

---

### 7. **Robots.txt** (Missing - Needs Creation)

**Create**: `app/robots.ts`

```typescript
import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/auth/'],
    },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}
```

**Status**: ❌ Missing
**Action**: Create this file before deployment

---

### 8. **Sitemap** (Missing - Needs Creation)

**Create**: `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/actions/product.actions'
import { getAllCategories } from '@/lib/actions/category.actions'
import { getSetting } from '@/lib/actions/setting.actions'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { site } = await getSetting()
  const baseUrl = site.url

  // Static pages
  const staticPages = [
    '',
    '/search',
    '/about',
    '/contact',
    '/sign-in',
    '/sign-up',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic product pages
  const products = await getAllProducts()
  const productPages = products.data.map((product: any) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Category pages
  const categories = await getAllCategories()
  const categoryPages = categories.map((category: any) => ({
    url: `${baseUrl}/search?category=${encodeURIComponent(category.name)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}
```

**Status**: ❌ Missing
**Action**: Create this file before deployment

---

### 9. **Web App Manifest** (Optional but Recommended)

**Create**: `app/manifest.ts`

```typescript
import { MetadataRoute } from 'next'
import { getSetting } from '@/lib/actions/setting.actions'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { site } = await getSetting()
  
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

**Status**: ❌ Missing
**Action**: Create this file (optional but improves PWA experience)

---

### 10. **Package.json**

**File**: `package.json`

Current values to review:

```json
{
  "name": "nextjs-amazona",  // ❌ Generic name
  "version": "0.1.0",
  "description": "E-commerce platform built with Next.js",  // ❌ Add proper description
  "author": "Your Name",  // ❌ Add your info
  "license": "MIT"  // ✅ Or your chosen license
}
```

**Action**: Update package.json metadata

---

### 11. **Search References to "Amazona"**

Files that may contain "Amazona" references:

1. ✅ `.env.local` - `NEXT_PUBLIC_APP_NAME=Amazona` → Change to `BCS`
2. ✅ `package.json` - `"name": "nextjs-amazona"` → Change if desired
3. Check any hardcoded text in components

**Action**: Search and replace if needed

```bash
# Search for "Amazona" references
grep -r "Amazona" --exclude-dir=node_modules --exclude-dir=.next
```

---

## 📋 Pre-Deployment Checklist

Use this checklist before deploying:

### Environment Variables
- [ ] `NEXT_PUBLIC_APP_NAME` updated to your business name
- [ ] `NEXT_PUBLIC_APP_DESCRIPTION` updated with actual description
- [ ] `NEXT_PUBLIC_SERVER_URL` set to production URL
- [ ] `SENDER_EMAIL` set to your domain email
- [ ] `SENDER_NAME` set to your business name
- [ ] All production credentials configured

### Files to Create
- [ ] `app/robots.ts` - SEO robots file
- [ ] `app/sitemap.ts` - Dynamic sitemap
- [ ] `app/manifest.ts` - PWA manifest (optional)

### Files to Update
- [ ] `package.json` - Update name, description, author
- [ ] `README.md` - Update with actual project info (optional)

### Visual Assets
- [ ] Favicon (`/public/icons/favicon.ico`)
- [ ] Apple Touch Icon (`/public/icons/apple-touch-icon.png`)
- [ ] Android Icons (`/public/icons/icon-192.png`, `/public/icons/icon-512.png`)
- [ ] Logo (`/public/icons/logo.webp`)
- [ ] All product images uploaded

### Admin Panel Configuration (Post-Deployment)
- [ ] Login to `/admin/settings`
- [ ] Update Site Information
  - [ ] Site Name
  - [ ] Description
  - [ ] URL (production domain)
  - [ ] Logo
  - [ ] Contact Email
  - [ ] Phone Number
  - [ ] Physical Address
  - [ ] Copyright notice
- [ ] Configure payment methods
- [ ] Set up shipping options
- [ ] Configure languages/currencies
- [ ] Upload carousel images
- [ ] Test all settings

### SEO Enhancements (Recommended)
- [ ] Add Open Graph tags to root layout
- [ ] Add Twitter Card tags to root layout
- [ ] Verify robots.txt is working
- [ ] Submit sitemap to Google Search Console
- [ ] Verify all meta descriptions are descriptive
- [ ] Check page titles are unique and descriptive

### Social Media
- [ ] Create social media preview image (1200x630px)
- [ ] Test social sharing on Facebook Debugger
- [ ] Test social sharing on Twitter Card Validator
- [ ] Update social media links in footer (if any)

### Final Verification
- [ ] Test all pages load correctly
- [ ] Verify no "Amazona" references remain
- [ ] Check console for errors
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Test on mobile devices
- [ ] Verify email sending works
- [ ] Test payment flow (if applicable)

---

## 🛠️ Quick Commands

### Search for Amazona References
```bash
cd /d D:\ecommerce-test\ecommerce-01
findstr /s /i "Amazona" *.ts *.tsx *.json *.md
```

### Update Environment Variables
```bash
# Edit .env.local
code .env.local
```

### Create Missing SEO Files
```bash
# Create robots.ts
echo "// Create robots.ts file" > app\robots.ts

# Create sitemap.ts  
echo "// Create sitemap.ts file" > app\sitemap.ts

# Create manifest.ts
echo "// Create manifest.ts file" > app\manifest.ts
```

---

## 📊 Current Status Summary

### ✅ **GOOD** - Already Configured
- Dynamic metadata from database
- Page-specific titles
- Proper HTML structure
- Font optimization
- Image optimization configured

### ⚠️ **NEEDS UPDATE** - Before Deployment
- Environment variables (APP_NAME, DESCRIPTION, URL)
- Sender email domain
- Database settings (via admin panel after deployment)

### ❌ **MISSING** - Should Add
- robots.txt
- sitemap.xml
- Open Graph tags
- Twitter Card tags
- Web App Manifest (optional)

---

## 🎯 Priority Actions

### HIGH PRIORITY (Before Deployment)
1. Update `.env.local` with correct values
2. Create `robots.ts` file
3. Create `sitemap.ts` file
4. Verify all icons/favicon are present and correct

### MEDIUM PRIORITY (After Deployment)
1. Configure settings via admin panel
2. Add Open Graph and Twitter Card tags
3. Create web manifest for PWA
4. Test social media sharing

### LOW PRIORITY (Ongoing)
1. Monitor SEO performance
2. Keep sitemap updated
3. Add product schema markup
4. Optimize images further

---

## 📚 Resources

- **Next.js Metadata**: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- **Google Search Console**: https://search.google.com/search-console
- **Open Graph Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **Schema.org**: https://schema.org/ (for structured data)

---

**Last Updated**: 2024
**Version**: 1.0

---

## Notes

- Most metadata is dynamically loaded from database settings ✅
- Update settings via Admin Panel after deployment for easy management
- Consider adding structured data (JSON-LD) for products for better SEO
- Monitor Google Search Console after deployment for indexing issues
