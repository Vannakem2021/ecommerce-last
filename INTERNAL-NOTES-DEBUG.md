# Internal Notes Debugging Guide

## Quick Checklist:

### 1. Verify You're Logged in as Admin
- Check if you're logged in with an Admin account
- Go to `/admin/orders` - if you can access it, you're an admin

### 2. Hard Refresh the Browser
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 3. Check Browser Console
- Press F12 to open Developer Tools
- Go to Console tab
- Look for any errors related to "OrderInternalNotes"

### 4. Verify Component Location
The Internal Notes section should appear in the LEFT COLUMN of the order details page, AFTER:
- Customer Details card
- Shipping Address card
- Payment Information card
- Order Timeline card

And BEFORE:
- ABA PayWay Payment Status (if applicable)

### 5. Visual Check
The section should look like this:

```
┌─────────────────────────────────────────────┐
│ Order Notes & History        [📝 0 notes]  │
│ ───────────────────────────────────────     │
│                                             │
│ 🟢 Order Created - Dec 1, 2:30 PM          │
│    Order placed by customer                 │
│                                             │
│ [+ Add Internal Note]                       │
│                                             │
│ Note: Internal notes are only visible...   │
└─────────────────────────────────────────────┘
```

### 6. Test Add Note
- Click "+ Add Internal Note"
- Type a test message
- Click "Add Note"
- Should show success toast
- Note should appear in the timeline

## If Still Not Showing:

### Check 1: Verify Admin Status
Run in browser console:
```javascript
// Check session
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```
Should show: `role: "Admin"`

### Check 2: Check Order Data
In browser console, look for the order object and verify:
- Does it have an `_id`?
- Does it have `createdAt`?
- Does it have `internalNotes` (can be empty array)?

### Check 3: React DevTools
- Install React Developer Tools extension
- Go to Components tab
- Search for "OrderInternalNotes"
- Check if it's rendered and what props it receives

## Common Issues:

### Issue 1: Not an Admin
**Solution:** Login with an admin account

### Issue 2: Browser Cache
**Solution:** Hard refresh or clear cache

### Issue 3: Dev Server Not Restarted
**Solution:**
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Issue 4: TypeScript Build Error
**Solution:**
```bash
# Check for errors
npx tsc --noEmit
```

### Issue 5: Component Not Imported
Check `components/shared/order/order-details-form.tsx`:
- Should have: `import OrderInternalNotes from "./order-internal-notes"`
- Should render in left column

## Still Not Working?

1. Check browser Network tab for API errors
2. Check server terminal for error logs
3. Verify the component file exists:
   `components/shared/order/order-internal-notes.tsx`
4. Try a different browser
5. Check if JavaScript is enabled
