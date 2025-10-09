# BCS E-Commerce - Vercel Deployment Guide

Complete guide for deploying your Next.js e-commerce application to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Variables Setup](#environment-variables-setup)
- [Database Configuration](#database-configuration)
- [Third-Party Services Setup](#third-party-services-setup)
- [Vercel Deployment Steps](#vercel-deployment-steps)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Domain Setup](#domain-setup)
- [Testing Your Deployment](#testing-your-deployment)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with your repository
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ MongoDB Atlas account (or other MongoDB hosting)
- ✅ All third-party service accounts set up:
  - Resend (email service)
  - Google Cloud Console (OAuth)
  - UploadThing (file uploads)
  - ABA PayWay (optional - for payments)

---

## Pre-Deployment Checklist

### 1. **Code Preparation**

```bash
# Ensure all dependencies are installed
npm install

# Run type checking
npm run build

# Run linter
npm run lint

# Run tests (if available)
npm test
```

### 2. **Commit All Changes**

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. **Review Configuration Files**

- ✅ `next.config.ts` - Check image domains and other settings
- ✅ `package.json` - Verify Node.js version compatibility
- ✅ `.gitignore` - Ensure sensitive files are excluded
- ✅ `.env.local` - Do NOT commit this file

---

## Environment Variables Setup

### Required Environment Variables

Copy these to Vercel's environment variables section:

#### **1. Application Settings**

```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=BCS
NEXT_PUBLIC_APP_DESCRIPTION=Your premier destination for electronics
NEXT_PUBLIC_SERVER_URL=https://your-domain.vercel.app
NEXT_PUBLIC_USE_TAB_SETTINGS=true
```

#### **2. Database Configuration**

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=<AppName>
```

**Important:** Replace with your actual MongoDB Atlas connection string.

#### **3. Authentication (Auth.js)**

```env
# Generate a new secret with: npx auth secret
NEXTAUTH_SECRET=<generate-new-secret-for-production>
NEXTAUTH_URL=https://your-domain.vercel.app
AUTH_TRUST_HOST=true
```

**⚠️ Security:** Generate a NEW `NEXTAUTH_SECRET` for production:
```bash
npx auth secret
```

#### **4. Google OAuth**

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup:** See [Google OAuth Setup](#google-oauth-setup) section below.

#### **5. Email Service (Resend)**

```env
RESEND_API_KEY=re_your_resend_api_key
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=BCS Support
EMAIL_VERIFICATION_DEV_MODE=false
```

**Important:** Verify your domain with Resend for production emails.

#### **6. File Upload (UploadThing)**

```env
UPLOADTHING_TOKEN=your_uploadthing_token
```

#### **7. Payment Gateway (ABA PayWay) - Optional**

```env
# For production, use live credentials and URL
PAYWAY_BASE_URL=https://checkout.payway.com.kh
PAYWAY_MERCHANT_ID=your_merchant_id
PAYWAY_SECRET_KEY=your_secret_key
PAYWAY_DEFAULT_CURRENCY=USD
PAYWAY_DEFAULT_PAYMENT_OPTIONS=cards
PAYWAY_DEFAULT_LIFETIME=30
PAYWAY_DEFAULT_VIEW_TYPE=checkout
PAYWAY_DEFAULT_RETURN_URL=/payment/success
PAYWAY_DEFAULT_CANCEL_URL=/payment/cancel
PAYWAY_SANDBOX_MODE=false
PAYWAY_ENABLED=true
ABA_PAYWAY_BYPASS_SIGNATURE=false
```

**⚠️ Important:** For production, set `PAYWAY_SANDBOX_MODE=false` and use production credentials.

---

## Database Configuration

### MongoDB Atlas Setup

1. **Create/Configure Database**
   - Log in to [MongoDB Atlas](https://cloud.mongodb.com)
   - Select your cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string

2. **Network Access**
   - Navigate to "Network Access" in Atlas
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Vercel's IP ranges (recommended for security)

3. **Database User**
   - Navigate to "Database Access"
   - Create a user with "Read and write to any database" permissions
   - Save username and password for connection string

4. **Connection String Format**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database-name>?retryWrites=true&w=majority&appName=<AppName>
   ```

### Seed Database (First Deployment)

After deployment, seed your database:

```bash
# Option 1: Use the seed script
npm run seed

# Option 2: Access the seed page (admin only)
# Visit: https://your-domain.vercel.app/admin/seed
```

---

## Third-Party Services Setup

### Google OAuth Setup

1. **Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Navigate to "APIs & Services" → "Credentials"

2. **Create OAuth 2.0 Client**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins:
     ```
     https://your-domain.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     https://your-domain.vercel.app/api/auth/callback/google
     ```

3. **Copy Credentials**
   - Save the Client ID and Client Secret
   - Add to Vercel environment variables

### Resend Email Setup

1. **Get API Key**
   - Sign up at https://resend.com
   - Navigate to "API Keys"
   - Create a new API key
   - Copy and save securely

2. **Verify Domain (Required for Production)**
   - Go to "Domains" in Resend dashboard
   - Click "Add Domain"
   - Add your domain (e.g., `yourdomain.com`)
   - Add DNS records provided by Resend
   - Wait for verification (can take up to 48 hours)

3. **Update Sender Email**
   - Use format: `noreply@yourdomain.com`
   - Must match verified domain

### UploadThing Setup

1. **Create Account**
   - Sign up at https://uploadthing.com
   - Create a new app

2. **Get Token**
   - Navigate to "API Keys"
   - Copy the token
   - Add to environment variables

3. **Configure File Types**
   - Set allowed file types in dashboard
   - Recommended: `image/jpeg, image/png, image/webp`
   - Set max file size (e.g., 5MB)

### ABA PayWay Setup (Optional)

1. **Production Credentials**
   - Contact ABA PayWay for production merchant account
   - Receive merchant ID and secret key
   - Switch from sandbox to production URL

2. **Webhook Configuration**
   - Configure callback URL in ABA dashboard:
     ```
     https://your-domain.vercel.app/api/payment/aba-callback
     ```

---

## Vercel Deployment Steps

### Step 1: Import Project

1. **Login to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"

2. **Import Git Repository**
   - Select "Import Git Repository"
   - Authorize Vercel to access your GitHub
   - Select your e-commerce repository

### Step 2: Configure Project

1. **Project Settings**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (or your project root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

2. **Environment Variables**
   - Click "Environment Variables"
   - Add all variables from [Environment Variables Setup](#environment-variables-setup)
   - For each variable:
     - Enter **Key** (e.g., `MONGODB_URI`)
     - Enter **Value** (the actual value)
     - Select environments: **Production**, **Preview**, **Development**

3. **Build & Development Settings**
   - Node.js Version: **20.x** (recommended)
   - Leave other settings as default

### Step 3: Deploy

1. **Click "Deploy"**
   - Vercel will start building your project
   - Watch the build logs for any errors
   - First build may take 3-5 minutes

2. **Monitor Build**
   - Check build logs for errors
   - Common issues:
     - Missing environment variables
     - Type errors (should be fixed from cleanup)
     - MongoDB connection issues

### Step 4: Verify Deployment

1. **Check Deployment URL**
   - Vercel provides a URL: `your-project.vercel.app`
   - Click to visit your deployed site

2. **Initial Checks**
   - ✅ Homepage loads correctly
   - ✅ Product pages work
   - ✅ Search functionality
   - ✅ Authentication (login/register)
   - ✅ Admin panel access

---

## Post-Deployment Configuration

### 1. Seed Database

**Option A: Admin Panel**
```
Visit: https://your-domain.vercel.app/admin/seed
Login as admin and run seed
```

**Option B: API Endpoint**
```bash
curl -X POST https://your-domain.vercel.app/api/seed
```

### 2. Create Admin Account

If database is not seeded:

1. Register a new account on the site
2. Access MongoDB Atlas
3. Find the user in `users` collection
4. Update `role` field to `"admin"`
5. Re-login to access admin features

### 3. Configure Site Settings

1. Login as admin
2. Navigate to: `/admin/settings`
3. Update:
   - Site information
   - Logo and branding
   - Payment methods
   - Shipping options
   - Languages and currencies

### 4. Test Payment Gateway

If using ABA PayWay:
1. Create a test order
2. Process payment
3. Verify callback/webhook works
4. Check order status updates

### 5. Test Email Functionality

1. Register a new user
2. Verify email is sent
3. Test password reset
4. Test order confirmation emails

---

## Domain Setup

### Option 1: Use Vercel Domain

Your site is automatically available at:
```
https://your-project.vercel.app
```

### Option 2: Add Custom Domain

1. **Purchase Domain**
   - Buy from provider (Namecheap, GoDaddy, etc.)

2. **Add Domain in Vercel**
   - Go to Project Settings → "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., `yourdomain.com`)
   - Follow Vercel's instructions

3. **Configure DNS**
   - Add DNS records at your domain provider:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

4. **Update Environment Variables**
   - Update `NEXT_PUBLIC_SERVER_URL` to your custom domain
   - Update `NEXTAUTH_URL` to your custom domain
   - Redeploy or restart

5. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Wait 24-48 hours for DNS propagation

6. **Update OAuth Redirect URIs**
   - Update Google OAuth authorized URIs
   - Update any other OAuth providers

---

## Testing Your Deployment

### Automated Tests Checklist

**Frontend Tests:**
- [ ] Homepage loads without errors
- [ ] Product listing page works
- [ ] Product detail page displays correctly
- [ ] Search functionality works
- [ ] Cart operations (add, remove, update)
- [ ] Checkout process completes
- [ ] User registration works
- [ ] User login works
- [ ] Profile page accessible
- [ ] Order history displays

**Admin Tests:**
- [ ] Admin dashboard loads
- [ ] Product management (create, edit, delete)
- [ ] Order management
- [ ] User management
- [ ] Settings update correctly
- [ ] Reports and analytics work

**API Tests:**
- [ ] Authentication endpoints work
- [ ] Product API endpoints
- [ ] Order API endpoints
- [ ] Payment webhook receives callbacks

**Integration Tests:**
- [ ] Email delivery works
- [ ] File uploads work
- [ ] Payment processing works
- [ ] Database operations succeed

### Performance Tests

```bash
# Use Lighthouse for performance testing
npm install -g lighthouse

lighthouse https://your-domain.vercel.app --view
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Ensure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: "Environment variable not found"**
- Check Vercel dashboard → Settings → Environment Variables
- Ensure all required variables are set
- Redeploy after adding variables

**Error: "Build exceeded memory limit"**
- Upgrade Vercel plan
- Or optimize build process (reduce bundle size)

### Runtime Errors

**Error: "CORS issues"**
- Update `next.config.ts` with proper domains
- Check API route headers

**Error: "Database connection failed"**
- Verify MongoDB connection string
- Check MongoDB Atlas network access
- Ensure IP allowlist includes Vercel

**Error: "Authentication not working"**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches deployment URL
- Update OAuth redirect URIs

### Email Issues

**Emails not sending:**
- Verify Resend API key
- Check domain verification status
- Review Resend dashboard logs
- Ensure sender email matches verified domain

### Payment Issues

**ABA PayWay not working:**
- Verify production credentials
- Check sandbox mode is disabled
- Verify webhook URL is correct
- Check ABA PayWay dashboard logs

---

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env.local` to Git
- ✅ Use strong secrets for production
- ✅ Rotate secrets periodically
- ✅ Use different secrets for dev/staging/prod

### 2. Authentication

- ✅ Use strong `NEXTAUTH_SECRET`
- ✅ Enable 2FA for admin accounts
- ✅ Implement rate limiting on login
- ✅ Monitor failed login attempts

### 3. Database Security

- ✅ Use strong database passwords
- ✅ Enable MongoDB Atlas network access controls
- ✅ Regular database backups
- ✅ Enable MongoDB audit logs

### 4. API Security

- ✅ Validate all input data
- ✅ Implement rate limiting
- ✅ Use HTTPS only
- ✅ Sanitize user input

### 5. Payment Security

- ✅ Never store credit card details
- ✅ Use HTTPS for all transactions
- ✅ Implement proper webhook validation
- ✅ Log all payment events

### 6. Monitoring

Set up monitoring for:
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (UptimeRobot)
- Security scanning (Snyk)

---

## Vercel-Specific Features

### Analytics

Enable Vercel Analytics:
1. Go to Project Settings → Analytics
2. Enable "Vercel Analytics"
3. View traffic and performance metrics

### Speed Insights

Enable Speed Insights:
1. Go to Project Settings → Speed Insights
2. Enable "Speed Insights"
3. Get real user performance data

### Environment Variables Management

**Per Environment:**
```bash
# Production only
PAYMENT_LIVE_MODE=true

# Preview only
ENABLE_DEBUG=true

# Development only
MOCK_PAYMENTS=true
```

### Preview Deployments

- Every PR creates a preview deployment
- Test changes before merging
- Preview URL: `your-project-git-branch.vercel.app`

### Automatic Deployments

- Push to `main` → Production deployment
- Push to other branches → Preview deployment
- Configure in Project Settings → Git

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check site performance
- Monitor uptime
- Review security alerts

**Monthly:**
- Update dependencies
- Review and rotate secrets
- Backup database
- Review analytics

**Quarterly:**
- Security audit
- Performance optimization
- Dependency major updates
- Review and update documentation

### Updating Your Deployment

```bash
# 1. Make changes locally
git checkout -b feature/my-update

# 2. Test changes
npm run build
npm run lint

# 3. Commit and push
git add .
git commit -m "Description of changes"
git push origin feature/my-update

# 4. Create pull request in GitHub
# 5. Review preview deployment
# 6. Merge to main for production deployment
```

---

## Support Resources

### Official Documentation

- **Next.js:** https://nextjs.org/docs
- **Vercel:** https://vercel.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Auth.js:** https://authjs.dev
- **Resend:** https://resend.com/docs

### Getting Help

- **Vercel Support:** support@vercel.com
- **Community:** https://github.com/vercel/next.js/discussions
- **Stack Overflow:** Tag with `next.js`, `vercel`

---

## Checklist Summary

Before going live, ensure:

- [ ] All environment variables configured
- [ ] Database seeded with initial data
- [ ] Admin account created and tested
- [ ] All third-party integrations working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Email functionality tested
- [ ] Payment processing tested (if applicable)
- [ ] All pages load without errors
- [ ] Mobile responsive design verified
- [ ] Performance scores acceptable
- [ ] Security best practices implemented
- [ ] Monitoring and analytics enabled
- [ ] Backup strategy in place
- [ ] Documentation updated

---

## Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from command line
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

**Congratulations! Your e-commerce application is now live on Vercel! 🎉**

For questions or issues, refer to the troubleshooting section or contact support.

---

*Last Updated: 2024*
*Version: 1.0*
