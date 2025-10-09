# 🌱 Production Database Seeding Guide

Complete guide to seeding your production database on Vercel.

---

## ⚠️ IMPORTANT WARNINGS

**DANGER ZONE:**
- This will **DELETE ALL** existing data in your database
- All users, products, orders, reviews will be removed
- This action **CANNOT BE UNDONE**
- Only run this on fresh deployments or when you want to reset everything

**When to use:**
- ✅ Initial deployment (empty database)
- ✅ Development/Staging environment reset
- ✅ Demo environment refresh
- ❌ NEVER on production with real user data

---

## 📋 Prerequisites

Before seeding, ensure you have:

1. **Admin Account Created**
   - Either manually create an admin user
   - Or use the credentials from seed data

2. **Environment Variable Set**
   ```bash
   SEED_SECRET=your-secret-here-change-this
   ```
   Add this to Vercel environment variables

3. **Database Access**
   - MongoDB connection is working
   - Network access is configured

---

## Method 1: Using Node.js Script (Easiest) ⭐

### Step 1: Add SEED_SECRET to Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add new variable:
   ```
   Key: SEED_SECRET
   Value: my-super-secret-seed-key-12345
   ```
3. Select: ✅ Production
4. Click Save
5. Redeploy your application

### Step 2: Run the Script

```bash
# From your local project directory
node scripts/seed-production.js
```

Follow the prompts:
```
Enter your Vercel URL: https://your-app.vercel.app
Enter admin email: admin@example.com
Enter admin password: your-admin-password
Enter SEED_SECRET: my-super-secret-seed-key-12345
Type "DELETE_ALL_DATA" to confirm: DELETE_ALL_DATA
```

---

## Method 2: Using cURL

### Step 1: Login and Get Session Cookie

```bash
# Replace with your URL and credentials
curl -i -X POST https://your-app.vercel.app/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

**Copy the `set-cookie` value from response headers**

### Step 2: Call Seed Endpoint

```bash
# Replace SESSION_COOKIE with the cookie from step 1
# Replace SEED_SECRET with your secret

curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION_COOKIE" \
  -H "x-seed-secret: your-seed-secret-here" \
  -d '{"confirm":"DELETE_ALL_DATA"}'
```

**Example:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=abc123..." \
  -H "x-seed-secret: my-super-secret-seed-key-12345" \
  -d '{"confirm":"DELETE_ALL_DATA"}'
```

---

## Method 3: Using Postman

### Step 1: Login

1. Create new **POST** request
2. URL: `https://your-app.vercel.app/api/auth/callback/credentials`
3. Headers:
   ```
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "your-password"
   }
   ```
5. Click **Send**
6. Go to **Cookies** tab and copy the session cookie

### Step 2: Seed Database

1. Create new **POST** request
2. URL: `https://your-app.vercel.app/api/admin/seed`
3. Headers:
   ```
   Content-Type: application/json
   x-seed-secret: your-seed-secret-here
   ```
4. Cookies:
   - Paste the session cookie from Step 1
5. Body (raw JSON):
   ```json
   {
     "confirm": "DELETE_ALL_DATA"
   }
   ```
6. Click **Send**

### Expected Response:

```json
{
  "success": true,
  "message": "Database seeded successfully",
  "stats": {
    "users": 10,
    "products": 50,
    "reviews": 20,
    "orders": 5,
    "brands": 15,
    "categories": 8
  },
  "credentials": {
    "email": "admin@gmail.com",
    "password": "generated-password-here",
    "warning": "Save these credentials securely!"
  }
}
```

---

## Method 4: Using Browser (Simple but Manual)

### Step 1: Login to Admin Panel

1. Go to: `https://your-app.vercel.app/sign-in`
2. Login with admin credentials
3. Navigate to admin dashboard

### Step 2: Open Browser Console

1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Go to **Console** tab

### Step 3: Run Seed Command

```javascript
// Replace with your SEED_SECRET
const SEED_SECRET = 'your-seed-secret-here'

fetch('/api/admin/seed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-seed-secret': SEED_SECRET
  },
  body: JSON.stringify({ confirm: 'DELETE_ALL_DATA' })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Seeding Result:', data)
  if (data.credentials) {
    console.log('🔐 Admin Password:', data.credentials.password)
  }
})
.catch(err => console.error('❌ Error:', err))
```

---

## Method 5: Create One-Time Seed Page (For Easy Access)

Create a simple admin page:

```tsx
// app/[locale]/admin/seed/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [secret, setSecret] = useState('')

  const handleSeed = async () => {
    if (!confirm('⚠️ This will DELETE ALL data! Are you sure?')) return
    if (!secret) {
      alert('Please enter SEED_SECRET')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-seed-secret': secret
        },
        body: JSON.stringify({ confirm: 'DELETE_ALL_DATA' })
      })
      const data = await res.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">🌱 Seed Database</h1>
        
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <p className="text-red-800 font-semibold">⚠️ DANGER ZONE</p>
          <p className="text-red-600 text-sm">
            This will DELETE ALL existing data and cannot be undone!
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              SEED_SECRET
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter seed secret"
            />
          </div>

          <Button
            onClick={handleSeed}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? '⏳ Seeding...' : '🌱 Seed Database'}
          </Button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  )
}
```

Then visit: `https://your-app.vercel.app/admin/seed`

---

## 🔍 Check Database Status

You can check current database statistics without seeding:

### Using cURL:
```bash
curl -X GET https://your-app.vercel.app/api/admin/seed \
  -H "Cookie: your-session-cookie"
```

### Using Browser Console:
```javascript
fetch('/api/admin/seed')
  .then(res => res.json())
  .then(data => console.log(data))
```

**Response:**
```json
{
  "success": true,
  "message": "Database statistics",
  "stats": {
    "users": 0,
    "products": 0,
    "orders": 0,
    "categories": 0,
    "brands": 0
  },
  "isEmpty": true
}
```

---

## 🛡️ Security Features

The seed endpoint has multiple security layers:

1. **Authentication Required**
   - Must be logged in with valid session

2. **Admin Role Required**
   - Only users with Admin role can access

3. **Secret Token Required**
   - `SEED_SECRET` environment variable must match

4. **Explicit Confirmation**
   - Must send `{"confirm": "DELETE_ALL_DATA"}` in request body

5. **Production Protection**
   - Extra warnings and confirmations

---

## 🐛 Troubleshooting

### Error: "Authentication required"
**Solution:** Make sure you're logged in. Get a fresh session cookie.

### Error: "Admin access required"
**Solution:** Your account must have Admin role. Check in database.

### Error: "Invalid seed secret"
**Solution:** 
- Make sure `SEED_SECRET` is set in Vercel environment variables
- Match the exact value in your request header
- Redeploy after adding the env variable

### Error: "Confirmation required"
**Solution:** Make sure your request body includes:
```json
{"confirm": "DELETE_ALL_DATA"}
```

### Error: "Database connection failed"
**Solution:**
- Check `MONGODB_URI` is set correctly in Vercel
- Verify MongoDB Atlas network access allows Vercel IPs
- Check database credentials are correct

### Seed completes but admin password not shown
**Solution:** Check Vercel logs:
```bash
vercel logs --prod
```
Look for the password in the logs.

---

## 📊 What Gets Seeded?

The seed process creates:

- ✅ **Users** (including admin account)
- ✅ **Products** (sample products with images)
- ✅ **Categories** (organized product categories)
- ✅ **Brands** (product brands)
- ✅ **Reviews** (sample product reviews)
- ✅ **Orders** (sample order history)
- ✅ **Settings** (site configuration)
- ✅ **Web Pages** (about, contact, help pages)

---

## 🔐 Admin Credentials

After seeding, you'll receive admin credentials:

```json
{
  "credentials": {
    "email": "admin@gmail.com",
    "password": "SecurelyGeneratedPassword123",
    "warning": "Save these credentials securely!"
  }
}
```

**⚠️ IMPORTANT:**
- Save these credentials immediately
- They won't be shown again
- Password is randomly generated each time
- Change the password after first login

---

## 🎯 Best Practices

### For Development:
```bash
# Seed as often as needed
SEED_SECRET=dev-secret-123
```

### For Staging:
```bash
# Use separate secret
SEED_SECRET=staging-secret-456
# Seed weekly to refresh test data
```

### For Production:
```bash
# Use strong secret
SEED_SECRET=$(openssl rand -base64 32)
# Only seed once during initial setup
# NEVER seed if you have real user data!
```

---

## 🚀 Quick Start Checklist

- [ ] Add `SEED_SECRET` to Vercel environment variables
- [ ] Redeploy application
- [ ] Verify admin account exists or note seed credentials
- [ ] Choose seeding method (script, cURL, Postman, browser)
- [ ] Run seed command with confirmation
- [ ] Save admin credentials from response
- [ ] Login with admin credentials
- [ ] Verify data in admin panel
- [ ] Remove or secure `SEED_SECRET` after initial setup

---

## 📝 Example: Complete Flow

```bash
# 1. Add environment variable to Vercel
vercel env add SEED_SECRET production
# Enter: my-super-secret-key-12345

# 2. Redeploy
vercel --prod

# 3. Run seed script
node scripts/seed-production.js

# 4. Follow prompts
# URL: https://my-app.vercel.app
# Email: admin@example.com
# Password: admin123
# Secret: my-super-secret-key-12345
# Confirm: DELETE_ALL_DATA

# 5. Save returned admin credentials
# Email: admin@gmail.com
# Password: XyZ789SecurePass!

# 6. Login and verify
# https://my-app.vercel.app/sign-in
```

---

## ✅ Success Indicators

You'll know seeding succeeded when:
- ✅ Response shows `"success": true`
- ✅ Statistics show data counts
- ✅ Admin credentials are provided
- ✅ Can login with new credentials
- ✅ Products appear in storefront
- ✅ Admin panel shows data

---

## 🔄 Re-seeding

To seed again (resets all data):

1. Simply run the same command again
2. All data will be deleted and recreated
3. New admin password will be generated
4. Save the new credentials

---

**Need help? Check the troubleshooting section or review Vercel logs for detailed error messages.**
