# Add to Favorites — Implementation Plan

This document outlines a comprehensive plan to add a fully featured Favorites system that lets authenticated users save products, see and manage them, and enjoy responsive, consistent UI behavior across the app.

The plan follows the existing architecture and patterns in this repo (Next.js App Router + NextAuth + MongoDB/Mongoose + server actions + shadcn/ui + next-themes + next-intl).

## 1) Codebase Analysis Summary

- Database: MongoDB with Mongoose models under `lib/db/models/*`.
  - Key models: `User`, `Product`, `Review`, `Order`, etc.
  - DB connection via `lib/db/index.ts` with cached Mongoose connection.
- Server Actions: colocated in `lib/actions/*` using `'use server'` and `connectToDatabase()`.
  - Admin actions guard with RBAC via `requirePermission` (`lib/rbac.ts`).
  - User-specific actions (e.g., reviews) check `auth()` and return structured `{ success, message, ... }` responses.
- AuthN/AuthZ: NextAuth (JWT, `MongoDBAdapter`) in `auth.ts` with enhanced session typing.
  - Middleware (`middleware.ts`) protects `/account`, `/admin`, `/checkout` and lets public routes through i18n.
  - RBAC defined in `lib/constants.ts` and helpers in `lib/rbac-utils.ts` and `lib/rbac.ts`.
- UI & Styling: shadcn/ui components under `components/ui/*`, Tailwind with `darkMode: 'class'`, theming via `next-themes` (`ThemeProvider`), and color provider.
- i18n: `next-intl` with locale-based routing under `app/[locale]/*` and messages in `messages/*.json`.
- Patterns to follow:
  - Data validation via Zod in `lib/validator.ts`.
  - Server actions revalidate via `revalidatePath` when needed.
  - Client toasts via `useToast()` and `<Toaster />` in `ClientProviders`.
  - Product listing uses `ProductCard`; product detail page includes several client widgets.

## 2) Feature Requirements Mapping

- Add/remove favorites via a heart icon on product cards and product detail page.
- Favorites are persisted server-side for authenticated users and visible across sessions.
- A protected Favorites page shows the user’s saved products with pagination.
- Real-time, optimistic UI updates on toggle; show toasts for feedback.
- Proper auth checks: unauthenticated users are prompted to sign in (with callback to return).

## 3) Technical Implementation Plan

### 3.1 Database Schema

- New Mongoose model: `Favorite` in `lib/db/models/favorite.model.ts`.
  - Fields:
    - `user`: `ObjectId` ref 'User' (required)
    - `product`: `ObjectId` ref 'Product' (required)
    - `createdAt`/`updatedAt` timestamps
  - Indexes:
    - Unique compound index on `{ user: 1, product: 1 }` to avoid duplicates
    - Secondary index on `{ user: 1, createdAt: -1 }` for efficient pagination

Notes:
- We fetch product details at read time (populate) to reuse `ProductCard`. No product snapshot needed.

### 3.2 Validation

- Add Zod schemas in `lib/validator.ts` (or a dedicated section) for request validation:
  - `FavoriteToggleSchema = z.object({ productId: MongoId })`
  - `FavoriteListQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).optional() })`

### 3.3 Server Actions (`lib/actions/favorite.actions.ts`)

Implement using existing patterns (`'use server'`, `auth()`, `connectToDatabase()`, `formatError`).

- `addFavorite(productId: string)`
  - Auth required; insert `{ user: session.user.id, product: productId }` (ignore duplicate via unique index handling).
  - Return `{ success, message }`.

- `removeFavorite(productId: string)`
  - Auth required; delete one by `{ user: session.user.id, product: productId }`.
  - Return `{ success, message }`.

- `toggleFavorite(productId: string)`
  - Checks if record exists; calls add or remove accordingly.
  - Return `{ success, message, isFavorite }`.

- `getMyFavoriteIds()`
  - Auth required; returns `string[]` of product IDs favorited by current user.

- `getMyFavorites({ page, limit })`
  - Auth required; find by `user`, populate `product` (brand/category minimal fields), sort `createdAt: -1`, paginate.
  - Return `{ data: IProduct[], totalPages }` (shape consistent with product actions).

Notes:
- For performance, select only fields needed by `ProductCard` (name, slug, images, brand, category, price, listPrice, tags, avgRating, numReviews, countInStock). Consider `.lean()`.

### 3.4 API Endpoints (optional but useful)

Provide fetchable endpoints for client hooks and potential prefetching. Follow existing API patterns.

- `GET /api/favorites`
  - Returns current user favorites. Support `?ids=true` to return only product IDs, else product documents.
  - Validates `page`, `limit` via `FavoriteListQuerySchema`.

- `POST /api/favorites`
  - Body `{ productId }` (validate via `FavoriteToggleSchema`), adds favorite.

- `DELETE /api/favorites/[productId]`
  - Removes favorite.

These endpoints wrap server actions and share validation.

### 3.5 Frontend Components

New:
- `components/shared/product/favorite-button.tsx` (client)
  - Props: `{ productId: string; className?: string; size?: 'sm'|'md'|'lg'; initialIsFavorite?: boolean }`
  - Uses `useAuthSession()` to detect auth state.
  - Uses new `useFavorites()` hook (see below) for state and toggling.
  - Renders a heart icon (lucide `Heart`) filled/highlighted if favorited.
  - On unauthenticated click: redirect to `/sign-in?callbackUrl=<current>`.
  - Shows toasts on add/remove using existing `useToast` pattern.

- `hooks/use-favorites.ts` (client, Zustand)
  - State: `{ ids: Set<string>, loaded: boolean, loading: boolean }` keyed per current user (similar to `useUserCart` initialization pattern).
  - Methods:
    - `initializeForUser(userId)` — clears or fetches from `/api/favorites?ids=true` once per session change.
    - `isFavorite(id)`, `add(id)`, `remove(id)`, `toggle(id)` — optimistic updates then call server action; revert on error.

Updated:
- `components/shared/product/product-card.tsx`
  - Add a top-right absolute `FavoriteButton` overlay inside product image container.
  - Maintain layout and keep action density low; ensure tap targets are friendly on mobile.

- `app/[locale]/(root)/product/[slug]/page.tsx`
  - Add a `FavoriteButton` near the title or price area.

- `components/shared/header/user-button.tsx`
  - Add a “Your favorites” link for authenticated users: `/favorites` or `/account/favorites` (see routing below).

### 3.6 Favorites Page (Protected)

- Route: `app/[locale]/(root)/favorites/page.tsx` (protected by middleware since not in public list).
- Server component that calls `getMyFavorites({ page })` and renders a grid of `ProductCard`s.
- Include pagination using existing `components/shared/pagination`.
- Empty state: friendly message and link to explore products.

Alternative placement:
- Could also be under account: `app/[locale]/(root)/account/favorites/page.tsx`. Use whichever matches IA preference. The middleware protects both.

### 3.7 Authentication & Middleware

- No RBAC permission needed; this is user-owned content.
- Server actions use `auth()` to derive `user.id` and throw or redirect appropriately.
- Favorites page path is protected by existing `middleware.ts` rule (non-public routes require auth and redirect to sign-in).

### 3.8 UI/UX & Theming

- Use shadcn button variants and Tailwind utilities that already respect theme tokens (`bg-background`, `text-foreground`, `muted`, etc.).
- Heart icon contrast: use `text-primary` when active, `text-muted-foreground` when inactive; add `hover:text-primary`.
- Accessibility: add `aria-pressed` state and `aria-label` (“Add to favorites” / “Remove from favorites”).
- Toast messages and inline feedback consistent with existing patterns.
- Keep consistent spacing, font styles, and grid layouts.

### 3.9 i18n

- Add keys to `messages/en-US.json` and `messages/kh.json`:
  - Header: `"Your favorites"`
  - Favorites page: `"Favorites"`, `"Your Favorites"`, `"No favorites yet"`, `"Go explore products"`
  - Button: `"Add to Favorites"`, `"Remove from Favorites"`, toasts: `"Added to Favorites"`, `"Removed from Favorites"`

### 3.10 Performance Considerations

- Indexes on `Favorite` ensure quick lookups and deduplication.
- Paginate favorites for large lists and avoid over-fetching.
- On listing/search pages, favor client-side ID checks for heart state (fetch once per session) to avoid N+1 calls.
- Use `.lean()` queries and select only `ProductCard`-needed fields.

## 4) Step-by-Step Tasks

1. Models & Validation
   - Create `lib/db/models/favorite.model.ts` with schema, refs, and indexes.
   - Add Zod schemas in `lib/validator.ts` (FavoriteToggleSchema & FavoriteListQuerySchema).

2. Server Actions
   - Add `lib/actions/favorite.actions.ts` with: `addFavorite`, `removeFavorite`, `toggleFavorite`, `getMyFavoriteIds`, `getMyFavorites`.
   - Unit-test locally in isolation (manual or jest if available) for idempotency and auth.

3. API Routes (optional but recommended)
   - `app/api/favorites/route.ts`: `GET` (list), `POST` (add).
   - `app/api/favorites/[productId]/route.ts`: `DELETE` (remove).
   - Reuse server actions and Zod validation; return normalized JSON.

4. Client State & Hooks
   - Add `hooks/use-favorites.ts` (Zustand): init on user change (use `useAuthSession`) and provide toggle helpers.

5. UI Components
   - Add `components/shared/product/favorite-button.tsx` with optimistic updates and toasts.
   - Update `components/shared/product/product-card.tsx` to include `FavoriteButton` overlay.
   - Update product detail page to include a `FavoriteButton` near title/price.
   - Update `components/shared/header/user-button.tsx` to link to Favorites.

6. Favorites Page
   - Create `app/[locale]/(root)/favorites/page.tsx` with paginated grid of favorites using `ProductCard`.
   - Add metadata and empty state.

7. i18n
   - Update `messages/en-US.json` and `messages/kh.json` with new keys.

8. QA & Testing
   - Manual flows: toggle on product card/detail, sign-in redirect, page list accuracy, pagination.
   - Edge cases: duplicate add, remove non-existing, large lists, unauthenticated toggles.
   - Verify dark/light styles and hover/active states.

## 5) Database Migration Requirements

- This feature introduces a new collection `favorites`.
- Indexes:
  - `{ user: 1, product: 1 }`, unique — prevents duplicates.
  - `{ user: 1, createdAt: -1 }` — speeds up pagination.
- Deployment notes:
  - Mongoose will create indexes if `autoIndex` is enabled; otherwise, run `Favorite.syncIndexes()` in a one-off script or after deployment.
  - No data migration needed; collection starts empty.

## 6) Component Hierarchy & File Structure

- Data
  - `lib/db/models/favorite.model.ts` (new)
  - `lib/actions/favorite.actions.ts` (new)
  - `lib/validator.ts` (add favorites schemas)

- API (optional)
  - `app/api/favorites/route.ts` (new)
  - `app/api/favorites/[productId]/route.ts` (new)

- Hooks
  - `hooks/use-favorites.ts` (new)

- UI
  - `components/shared/product/favorite-button.tsx` (new)
  - `components/shared/product/product-card.tsx` (update)
  - `app/[locale]/(root)/product/[slug]/page.tsx` (update)
  - `components/shared/header/user-button.tsx` (update)
  - `app/[locale]/(root)/favorites/page.tsx` (new)

## 7) Styling Guidelines

- Use existing Tailwind tokens and shadcn variants:
  - Colors: `text-primary` when active, `text-muted-foreground` when inactive.
  - Hover/focus states: `hover:text-primary`, `focus-visible:ring` per shadcn style.
  - Icon button shape: round, small padding, accessible `aria-label`.
  - Respect dark/light modes by relying on semantic tokens, not hard-coded colors.
- Placement:
  - ProductCard: absolute positioned top-right within image area (similar to promotion badge pattern, but enabled).
  - ProductDetail: inline near title/price.

## 8) Error Handling & UX

- Unauthenticated toggle:
  - Client: redirect to `/sign-in?callbackUrl=<current>`.
  - Server: actions throw if no session; return `{ success: false, message }` consistently where applicable.
- Use `formatError` utility for consistent error messages from server actions.
- Show toasts on success and failure.

## 9) Testing Considerations

- Unit (server actions):
  - `addFavorite` creates once; second call should be idempotent (unique index).
  - `removeFavorite` gracefully handles missing doc.
  - `getMyFavoriteIds` and `getMyFavorites` pagination and sorting.

- API (if implemented):
  - 200 responses for happy paths; 401 for unauthenticated; 400 for invalid inputs.

- UI/E2E (manual or automation):
  - Toggle heart from product card and product detail.
  - Favorites page lists items and paginates.
  - Sign-in prompt on unauthenticated click and callback returns to original page.
  - Theme compatibility verified in dark and light modes.

## 10) Pseudocode & Signatures (for reference)

Model: `lib/db/models/favorite.model.ts`
```ts
import { Document, Model, model, models, Schema } from 'mongoose'

export interface IFavorite extends Document {
  _id: string
  user: Schema.Types.ObjectId
  product: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const favoriteSchema = new Schema<IFavorite>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true })

favoriteSchema.index({ user: 1, product: 1 }, { unique: true })
favoriteSchema.index({ user: 1, createdAt: -1 })

export default (models.Favorite as Model<IFavorite>) || model<IFavorite>('Favorite', favoriteSchema)
```

Server actions: `lib/actions/favorite.actions.ts`
```ts
'use server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Favorite from '@/lib/db/models/favorite.model'
import Product from '@/lib/db/models/product.model'
import { formatError } from '@/lib/utils'

export async function toggleFavorite(productId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Authentication required')
    await connectToDatabase()
    const existing = await Favorite.findOne({ user: session.user.id, product: productId })
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id })
      return { success: true, message: 'Removed from Favorites', isFavorite: false }
    }
    await Favorite.create({ user: session.user.id, product: productId })
    return { success: true, message: 'Added to Favorites', isFavorite: true }
  } catch (e) {
    return { success: false, message: formatError(e) }
  }
}

export async function getMyFavoriteIds() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Authentication required')
  await connectToDatabase()
  const docs = await Favorite.find({ user: session.user.id }).select('product').lean()
  return docs.map(d => d.product.toString())
}

export async function getMyFavorites({ page = 1, limit }: { page?: number; limit?: number }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Authentication required')
  await connectToDatabase()
  const q = { user: session.user.id }
  const total = await Favorite.countDocuments(q)
  const docs = await Favorite.find(q)
    .sort({ createdAt: -1 })
    .skip((page - 1) * (limit || 12))
    .limit(limit || 12)
    .populate({
      path: 'product',
      populate: [
        { path: 'brand', select: 'name' },
        { path: 'category', select: 'name' },
      ],
      select: 'name slug images brand category price listPrice tags avgRating numReviews countInStock',
    })
    .lean()
  const products = docs.map(d => d.product)
  return { data: products, totalPages: Math.max(1, Math.ceil(total / (limit || 12))) }
}
```

Hook: `hooks/use-favorites.ts`
```ts
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthSession } from './use-auth-session'
import { toggleFavorite as toggleFavoriteAction, getMyFavoriteIds } from '@/lib/actions/favorite.actions'

type State = { ids: string[]; loaded: boolean; userId: string | null; loading: boolean }
type Actions = { initializeForUser: (userId: string | null) => Promise<void>; isFavorite: (id: string) => boolean; toggle: (id: string) => Promise<{ success: boolean; isFavorite?: boolean; message: string }> }

const useFavoritesStore = create(persist<State & Actions>((set, get) => ({
  ids: [], loaded: false, userId: null, loading: false,
  initializeForUser: async (uid) => {
    const prev = get().userId
    if (prev === uid && get().loaded) return
    set({ userId: uid, ids: [], loaded: false, loading: !!uid })
    if (!uid) { set({ loaded: true, loading: false }); return }
    try { const ids = await getMyFavoriteIds(); set({ ids, loaded: true }) } finally { set({ loading: false }) }
  },
  isFavorite: (id) => get().ids.includes(id),
  toggle: async (id) => {
    const { isAuthenticated } = useAuthSession() as any // or pass down in component
    if (!isAuthenticated) return { success: false, message: 'Authentication required' }
    const current = get().ids
    const isFav = current.includes(id)
    const next = isFav ? current.filter(x => x !== id) : [id, ...current]
    set({ ids: next })
    const res = await toggleFavoriteAction(id)
    if (!res.success) set({ ids: current })
    return res as any
  }
}), { name: 'favorites-store' }))

export default function useFavorites() {
  const auth = useAuthSession()
  const store = useFavoritesStore()
  // initialize on auth changes
  React.useEffect(() => { store.initializeForUser(auth.user?.id || null) }, [auth.user?.id])
  return store
}
```

Favorites Page: `app/[locale]/(root)/favorites/page.tsx`
```tsx
import ProductCard from '@/components/shared/product/product-card'
import { getMyFavorites } from '@/lib/actions/favorite.actions'

export const metadata = { title: 'Your Favorites' }

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page = '1' } = await searchParams
  const { data, totalPages } = await getMyFavorites({ page: Number(page) })
  return (
    <div>
      <h1 className='h1-bold py-4'>Your Favorites</h1>
      {data.length === 0 ? (
        <div>No favorites yet.</div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {data.map((p: any) => (<ProductCard key={p._id} product={p} />))}
        </div>
      )}
      {/* Add Pagination if totalPages > 1 */}
    </div>
  )
}
```

## 11) Rollout Checklist

- [ ] Add model + indexes and deploy.
- [ ] Implement server actions; local sanity test.
- [ ] Implement API endpoints (if chosen) and verify with REST client.
- [ ] Add hook + UI components; wire up to ProductCard and Product page.
- [ ] Create Favorites page; add link in user menu.
- [ ] Add i18n keys in both locales.
- [ ] Validate dark/light theme visuals.
- [ ] Smoke test across major flows and pagination.

