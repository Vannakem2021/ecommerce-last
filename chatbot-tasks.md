# 🤖 Chatbot Implementation Tasks - Dynamic FAQ Widget

## Overview
Simple FAQ-based chatbot with full admin control panel and English/Khmer language support.

**Type:** Static FAQ with dynamic admin management  
**Languages:** English (en-US) + Khmer (kh)  
**Complexity:** Moderate  
**Estimated Time:** 2-3 days  

---

## Phase 1: Database & Backend (4-6 hours)

### Task 1.1: Create Database Model
**File:** `lib/db/models/chatbot-faq.model.ts`

**Requirements:**
- [ ] Create FAQ schema with:
  - `category` (string) - e.g., "Shipping", "Returns", "Products"
  - `question` (object) - { en: string, kh: string }
  - `answer` (object) - { en: string, kh: string }
  - `order` (number) - for sorting
  - `active` (boolean) - show/hide FAQ
  - `keywords` (array of strings) - for search matching
  - `createdAt`, `updatedAt` timestamps
  - `createdBy` (ref to User)

**Schema Example:**
```typescript
{
  category: "Shipping",
  question: {
    en: "How long does shipping take?",
    kh: "ការដឹកជញ្ជូនត្រូវការពេលប៉ុន្មាន?"
  },
  answer: {
    en: "Standard shipping takes 3-5 business days...",
    kh: "ការដឹកជញ្ជូនស្តង់ដារត្រូវការពី 3-5 ថ្ងៃធ្វើការ..."
  },
  keywords: ["shipping", "delivery", "time", "days"],
  order: 1,
  active: true
}
```

**Time:** 1 hour

---

### Task 1.2: Create Server Actions
**File:** `lib/actions/chatbot-faq.actions.ts`

**Requirements:**
- [ ] `getFAQs(locale?: string)` - Get all active FAQs (optionally filtered by locale)
- [ ] `getFAQById(id: string)` - Get single FAQ for editing
- [ ] `createFAQ(data)` - Create new FAQ (admin only)
- [ ] `updateFAQ(id, data)` - Update existing FAQ (admin only)
- [ ] `deleteFAQ(id)` - Delete FAQ (admin only)
- [ ] `reorderFAQs(items)` - Update order of FAQs
- [ ] `searchFAQs(query, locale)` - Search FAQs by keywords
- [ ] `getFAQCategories()` - Get list of unique categories

**Permissions:**
- Read: All users
- Create/Update/Delete: Admin only

**Time:** 2-3 hours

---

### Task 1.3: Create API Routes
**File:** `app/api/chatbot/faqs/route.ts`

**Requirements:**
- [ ] GET `/api/chatbot/faqs` - List all FAQs
  - Query params: `locale`, `category`, `active`
- [ ] POST `/api/chatbot/faqs` - Create new FAQ (admin only)

**File:** `app/api/chatbot/faqs/[id]/route.ts`

- [ ] GET `/api/chatbot/faqs/[id]` - Get single FAQ
- [ ] PATCH `/api/chatbot/faqs/[id]` - Update FAQ (admin only)
- [ ] DELETE `/api/chatbot/faqs/[id]` - Delete FAQ (admin only)

**File:** `app/api/chatbot/search/route.ts`

- [ ] POST `/api/chatbot/search` - Search FAQs by query
  - Body: `{ query: string, locale: string }`

**Time:** 1-2 hours

---

## Phase 2: Frontend Chatbot Widget (4-6 hours)

### Task 2.1: Chat Widget UI Components
**Directory:** `components/shared/chatbot/`

**Components to Create:**

#### 2.1.1: `chat-button.tsx`
**Requirements:**
- [ ] Floating button (bottom right corner)
- [ ] Chat icon with optional badge (e.g., "Help")
- [ ] Click to toggle chat window
- [ ] Smooth animations
- [ ] z-index handling

**Time:** 30 min

---

#### 2.1.2: `chat-window.tsx`
**Requirements:**
- [ ] Chat window container (350px x 500px)
- [ ] Header with title "Help Center" / "មជ្ឈមណ្ឌលជំនួយ"
- [ ] Language toggle (EN/KH)
- [ ] Close button
- [ ] Message area
- [ ] Input area (for search)
- [ ] Responsive on mobile (full screen)

**Time:** 1 hour

---

#### 2.1.3: `faq-list.tsx`
**Requirements:**
- [ ] Display FAQ categories
- [ ] Accordion/collapsible FAQ items
- [ ] Show question in selected language
- [ ] Expand to show answer
- [ ] Search/filter functionality
- [ ] Loading states
- [ ] Empty state when no FAQs

**Time:** 1.5 hours

---

#### 2.1.4: `chat-search.tsx`
**Requirements:**
- [ ] Search input field
- [ ] Real-time search (debounced)
- [ ] Highlight matching keywords
- [ ] Show "No results" when empty
- [ ] Clear search button

**Time:** 1 hour

---

### Task 2.2: Chat State Management
**File:** `components/shared/chatbot/use-chatbot.ts`

**Requirements:**
- [ ] Custom hook for chatbot state
- [ ] Track open/closed state
- [ ] Current locale
- [ ] Search query
- [ ] Selected category
- [ ] Fetch FAQs from API

**Time:** 1 hour

---

### Task 2.3: Integrate to Layout
**File:** `app/[locale]/layout.tsx` or `components/shared/header/index.tsx`

**Requirements:**
- [ ] Add `<ChatWidget />` to main layout
- [ ] Only show on customer-facing pages (not in /admin)
- [ ] Ensure proper z-index stacking

**Time:** 30 min

---

## Phase 3: Admin Management Panel (6-8 hours)

### Task 3.1: FAQ List Page
**File:** `app/[locale]/admin/chatbot/page.tsx`

**Requirements:**
- [ ] Data table showing all FAQs
- [ ] Columns: Category, Question (EN), Question (KH), Status, Actions
- [ ] Search/filter by category
- [ ] Toggle active/inactive
- [ ] Drag-and-drop reordering
- [ ] Delete button (with confirmation)
- [ ] "Create New FAQ" button

**Features:**
- [ ] Pagination or infinite scroll
- [ ] Bulk actions (activate/deactivate multiple)
- [ ] Sort by category, order, or date

**Time:** 2-3 hours

---

### Task 3.2: Create/Edit FAQ Form
**File:** `app/[locale]/admin/chatbot/[id]/page.tsx`

**Requirements:**

**Form Fields:**
- [ ] Category (dropdown or text input)
- [ ] Question (English) - textarea
- [ ] Question (Khmer) - textarea  
- [ ] Answer (English) - rich text editor or textarea
- [ ] Answer (Khmer) - rich text editor or textarea
- [ ] Keywords (tag input) - comma-separated
- [ ] Active status (checkbox)
- [ ] Order number (number input)

**Actions:**
- [ ] Save button
- [ ] Cancel button
- [ ] Delete button (edit mode only)
- [ ] Preview button (show how it looks in chatbot)

**Validation:**
- [ ] Required: At least one language for question/answer
- [ ] Category must not be empty
- [ ] Keywords must be valid

**Time:** 2-3 hours

---

### Task 3.3: FAQ Preview Component
**File:** `app/[locale]/admin/chatbot/preview/[id]/page.tsx`

**Requirements:**
- [ ] Show FAQ in actual chatbot UI
- [ ] Switch between EN/KH
- [ ] "Back to Edit" button

**Time:** 1 hour

---

### Task 3.4: Settings Page (Optional)
**File:** `app/[locale]/admin/settings` - Add chatbot section

**Requirements:**
- [ ] Enable/disable chatbot globally
- [ ] Default language
- [ ] Chat window position (left/right)
- [ ] Custom greeting message
- [ ] Chat button color/style

**Time:** 1-2 hours (optional)

---

## Phase 4: Multi-Language Support (2-3 hours)

### Task 4.1: Translation Files
**Files:** `messages/en-US.json` and `messages/kh.json`

**Requirements:**
- [ ] Add chatbot-related translations:
  - "Help Center" / "មជ្ឈមណ្ឌលជំនួយ"
  - "Search questions..." / "ស្វែងរកសំណួរ..."
  - "No questions found" / "រកមិនឃើញសំណួរ"
  - "Ask a question" / "សួរសំណួរ"
  - Admin labels: "Create FAQ", "Edit FAQ", etc.

**Time:** 1 hour

---

### Task 4.2: Language Switching Logic
**File:** `components/shared/chatbot/language-toggle.tsx`

**Requirements:**
- [ ] Button to switch between EN/KH
- [ ] Store preference in localStorage
- [ ] Update FAQ display when language changes
- [ ] Flag icons or text labels

**Time:** 1 hour

---

### Task 4.3: RTL Support for Khmer (if needed)
**Requirements:**
- [ ] Check if Khmer needs RTL (it doesn't usually)
- [ ] Ensure proper font rendering
- [ ] Test Khmer text display

**Time:** 30 min - 1 hour

---

## Phase 5: Seeding & Testing (2-3 hours)

### Task 5.1: Seed Initial FAQs
**File:** `scripts/seed-chatbot-faqs.ts`

**Requirements:**
- [ ] Create seed script with sample FAQs
- [ ] Categories: Shipping, Returns, Products, Payment, Account
- [ ] 5-10 FAQs per category
- [ ] Both EN and KH translations

**Example FAQs:**
```typescript
const seedFAQs = [
  {
    category: "Shipping",
    question: {
      en: "How long does shipping take?",
      kh: "ការដឹកជញ្ជូនត្រូវការពេលប៉ុន្មាន?"
    },
    answer: {
      en: "Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days.",
      kh: "ការដឹកជញ្ជូនស្តង់ដារត្រូវការពី 3-5 ថ្ងៃធ្វើការ។ ការដឹកជញ្ជូនលឿនត្រូវការពី 1-2 ថ្ងៃធ្វើការ។"
    },
    keywords: ["shipping", "delivery", "time", "fast"],
    order: 1,
    active: true
  },
  // ... more FAQs
];
```

**Run Command:**
```bash
npm run seed:faqs
# or
node scripts/seed-chatbot-faqs.js
```

**Time:** 1-2 hours

---

### Task 5.2: Testing
**Requirements:**

**Frontend Testing:**
- [ ] Chat button appears and toggles
- [ ] FAQs load correctly
- [ ] Language switching works
- [ ] Search filters FAQs properly
- [ ] Responsive on mobile
- [ ] Animations are smooth

**Admin Testing:**
- [ ] Create new FAQ
- [ ] Edit existing FAQ
- [ ] Delete FAQ (with confirmation)
- [ ] Reorder FAQs
- [ ] Toggle active/inactive
- [ ] Search and filter

**Multi-language Testing:**
- [ ] Both EN and KH display correctly
- [ ] Switching languages updates content
- [ ] Khmer font renders properly
- [ ] Missing translations show fallback

**Permissions Testing:**
- [ ] Non-admin users can't access admin panel
- [ ] Non-admin users can view chatbot
- [ ] API endpoints enforce permissions

**Time:** 1 hour

---

## Phase 6: Polish & Documentation (1-2 hours)

### Task 6.1: Styling & UX Polish
**Requirements:**
- [ ] Match your app's color scheme
- [ ] Smooth animations (slide in/out)
- [ ] Loading spinners
- [ ] Error states
- [ ] Success toasts after admin actions
- [ ] Hover effects on buttons
- [ ] Focus states for accessibility

**Time:** 1 hour

---

### Task 6.2: Documentation
**File:** `CHATBOT-GUIDE.md`

**Requirements:**
- [ ] How to add new FAQ
- [ ] How to organize categories
- [ ] Best practices for keywords
- [ ] How to translate content
- [ ] Troubleshooting common issues

**Time:** 30 min - 1 hour

---

## 📊 Summary Timeline

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| **Phase 1: Database & Backend** | 3 tasks | 4-6 hours |
| **Phase 2: Frontend Widget** | 3 tasks | 4-6 hours |
| **Phase 3: Admin Panel** | 4 tasks | 6-8 hours |
| **Phase 4: Multi-Language** | 3 tasks | 2-3 hours |
| **Phase 5: Seeding & Testing** | 2 tasks | 2-3 hours |
| **Phase 6: Polish & Docs** | 2 tasks | 1-2 hours |
| **TOTAL** | **17 tasks** | **19-28 hours (~2-3 days)** |

---

## 🎯 Implementation Order (Recommended)

### Day 1: Backend Foundation
- [x] Morning: Phase 1 - Database & Backend (4-6 hours)
- [x] Afternoon: Start Phase 2 - Basic chatbot UI (2-3 hours)

### Day 2: Frontend & Admin
- [x] Morning: Finish Phase 2 - Complete chatbot widget (2-3 hours)
- [x] Afternoon: Phase 3 - Admin panel (6-8 hours)

### Day 3: Multi-Language & Testing
- [x] Morning: Phase 4 - Multi-language support (2-3 hours)
- [x] Afternoon: Phase 5 - Seeding & Testing (2-3 hours)
- [x] Evening: Phase 6 - Polish & docs (1-2 hours)

---

## 🗂️ Files to Create

```
📁 lib/
  📁 db/
    📁 models/
      📄 chatbot-faq.model.ts
  📁 actions/
    📄 chatbot-faq.actions.ts

📁 app/
  📁 api/
    📁 chatbot/
      📁 faqs/
        📄 route.ts
        📁 [id]/
          📄 route.ts
      📁 search/
        📄 route.ts
  📁 [locale]/
    📁 admin/
      📁 chatbot/
        📄 page.tsx (list)
        📁 [id]/
          📄 page.tsx (create/edit)
        📁 preview/
          📁 [id]/
            📄 page.tsx

📁 components/
  📁 shared/
    📁 chatbot/
      📄 chat-button.tsx
      📄 chat-window.tsx
      📄 faq-list.tsx
      📄 chat-search.tsx
      📄 language-toggle.tsx
      📄 use-chatbot.ts
      📄 index.tsx

📁 scripts/
  📄 seed-chatbot-faqs.ts

📁 messages/
  📄 en-US.json (update)
  📄 kh.json (update)

📄 CHATBOT-GUIDE.md
```

**Total:** ~15-20 new files

---

## 🎨 Design Mockup

```
┌─────────────────────────────────────┐
│  Your E-commerce Site               │
│                                     │
│  [Products]  [Cart]  [Account]     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                          ┌────────┐ │
│                          │ 💬     │ │ ← Chat Button
│                          └────────┘ │
└─────────────────────────────────────┘

When clicked ↓

┌─────────────────────────────────────┐
│  Your E-commerce Site               │
│                                     │
│  [Products]  [Cart]  [Account]     │
│                                     │
│                   ┌──────────────┐  │
│                   │ Help Center  │  │
│                   │ EN | KH  [X] │  │
│                   ├──────────────┤  │
│                   │ 🔍 Search... │  │
│                   ├──────────────┤  │
│                   │ 📦 Shipping  │  │
│                   │ ↩️ Returns   │  │
│                   │ 💳 Payment   │  │
│                   │ 📱 Account   │  │
│                   ├──────────────┤  │
│                   │ Powered by   │  │
│                   │ Your Store   │  │
│                   └──────────────┘  │
└─────────────────────────────────────┘
```

---

## 🔧 Tech Stack

- **Database:** MongoDB (existing)
- **Backend:** Next.js App Router + Server Actions
- **Frontend:** React + TypeScript + Tailwind CSS
- **UI Components:** shadcn/ui (accordion, dialog, etc.)
- **Animations:** Framer Motion (optional)
- **Form Handling:** React Hook Form + Zod
- **State:** React hooks (useState, useEffect)
- **i18n:** Next-intl (existing)

---

## ✅ Definition of Done

### For Each Phase:

- [ ] All tasks completed
- [ ] Code tested manually
- [ ] No console errors
- [ ] Works in both EN and KH
- [ ] Responsive on mobile
- [ ] Admin permissions enforced
- [ ] Git committed with descriptive message

### For Full Project:

- [ ] All 17 tasks completed
- [ ] 10+ FAQs seeded in database
- [ ] Admin can CRUD FAQs
- [ ] Chatbot displays on customer pages
- [ ] Both languages work
- [ ] Search functionality works
- [ ] Documentation written
- [ ] No TypeScript errors
- [ ] Tested by admin user
- [ ] Tested by regular user
- [ ] Ready for production

---

## 🚀 Ready to Start?

**Shall I begin implementation?**

If yes, I'll start with:
1. ✅ Phase 1: Database model and backend actions
2. ✅ Phase 2: Basic chatbot widget
3. ✅ Phase 3: Admin panel
4. ✅ Phase 4: Multi-language support
5. ✅ Phase 5: Seeding & testing
6. ✅ Phase 6: Polish & documentation

**Let me know when you're ready to begin!** 🎉
