# Font Family Update - Ubuntu

## Changes Made

The entire website font has been changed from **Inter** to **Ubuntu**.

---

## Files Modified

### 1. ✅ `app/[locale]/layout.tsx`
Changed font import and configuration:

**Before:**
```typescript
import { Inter, Kantumruy_Pro } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const fontClass = locale === 'kh' ? 'font-hanuman' : 'font-inter';

className={`min-h-screen ${inter.variable} ${hanuman.variable} antialiased ${fontClass}`}
```

**After:**
```typescript
import { Ubuntu, Kantumruy_Pro } from "next/font/google";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const fontClass = locale === 'kh' ? 'font-hanuman' : 'font-ubuntu';

className={`min-h-screen ${ubuntu.variable} ${hanuman.variable} antialiased ${fontClass}`}
```

### 2. ✅ `tailwind.config.ts`
Updated font family configuration:

**Before:**
```typescript
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', ...],
  inter: ['var(--font-inter)', 'sans-serif'],
  hanuman: ['var(--font-hanuman)', 'serif'],
},
```

**After:**
```typescript
fontFamily: {
  sans: ['Ubuntu', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', ...],
  ubuntu: ['var(--font-ubuntu)', 'sans-serif'],
  hanuman: ['var(--font-hanuman)', 'serif'],
},
```

---

## Font Weights Available

Ubuntu font is loaded with the following weights:
- **300** - Light
- **400** - Regular
- **500** - Medium
- **700** - Bold

---

## Locales

### English (and other Latin-based languages)
- Uses **Ubuntu** font
- Applied via `font-ubuntu` class

### Khmer (kh locale)
- Uses **Kantumruy Pro** (Hanuman) font
- Applied via `font-hanuman` class
- Unchanged from before

---

## How It Works

1. **Google Fonts**: Ubuntu is loaded from Google Fonts CDN
2. **CSS Variable**: Font is registered as `--font-ubuntu`
3. **Tailwind**: The `font-ubuntu` utility class applies the font
4. **Default**: `sans` font family now defaults to Ubuntu first, then falls back to system fonts

---

## Testing

**Refresh your browser** at `http://localhost:3000/`

All text content should now render in **Ubuntu font** (except for Khmer language which uses Kantumruy Pro).

---

## Rollback

If you need to revert to Inter font:

1. Change `Ubuntu` back to `Inter` in `app/[locale]/layout.tsx`
2. Change `ubuntu` back to `inter` everywhere
3. Update tailwind config `ubuntu:` back to `inter:`
4. Update font weights to include `"600"` again

---

**Status**: ✅ Complete
**Date**: January 2025
**Font**: Ubuntu (replacing Inter)
