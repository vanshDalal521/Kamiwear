# KamiWear - Vercel Deployment Guide

## ✅ Configuration Files Added

Your project is now configured for Vercel deployment with:

1. **vercel.json** - Vercel configuration for static + backend deployment
2. **.vercelignore** - Excludes unnecessary files from deployment
3. **package.json** - Updated with Vercel-compatible build scripts

## 🚀 How to Deploy on Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `vanshDalal521/Kamiwear`
4. Vercel will auto-detect the configuration
5. Click **"Deploy"**

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 📁 Project Structure

```
Kamiwear/
├── structure/          # Static HTML pages
│   ├── index.html     # Homepage
│   ├── shop.html      # Shop page
│   ├── cart.html      # Cart page
│   ├── checkout.html  # Checkout page
│   └── ...
├── server.js          # Backend API (Express)
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies & scripts
└── .vercelignore      # Files to exclude
```

## 🔧 What Was Fixed

The error `react-scripts: command not found` occurred because:
- Your project is **NOT a React app**
- It's a **static HTML/CSS/JS** site with Node.js backend
- Vercel was trying to run React build scripts

**Solution:**
- Added `vercel.json` to tell Vercel this is a static site
- Removed React build step
- Configured proper routing for HTML files

## 🌐 Routes Configuration

- `/` → Serves `structure/index.html`
- `/shop.html` → Serves `structure/shop.html`
- `/api/*` → Routes to `server.js` (backend)
- All other routes → Serves from `structure/` folder

## 📝 Notes

- Frontend is deployed as **static files** (no build needed)
- Backend API runs on **Vercel Serverless Functions**
- All HTML pages are accessible directly
- No React/build tools required

## 🎯 After Deployment

Your site will be available at:
- **Production**: `https://kamiwear.vercel.app` (or your custom domain)
- **Preview**: Auto-generated for each git push

## 🐛 Troubleshooting

If you still get errors:

1. **Clear Vercel cache**: Go to Vercel Dashboard → Settings → General → Clear Build Cache
2. **Check vercel.json**: Ensure it matches the configuration in this repo
3. **Verify file paths**: All HTML files must be in `structure/` folder

## 📞 Support

If you need help, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Static Deployments](https://vercel.com/docs/deployments/static-deployments)
