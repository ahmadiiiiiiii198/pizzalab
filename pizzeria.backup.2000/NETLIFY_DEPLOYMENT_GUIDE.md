# 🚀 Netlify Deployment Guide

This guide will help you deploy the Pizzeria website to Netlify successfully.

## ✅ Prerequisites

Before deploying, make sure you have:
- A GitHub account with this repository
- A Netlify account (free tier is sufficient)
- Supabase project set up (for database)
- Environment variables ready

## 🔧 Step-by-Step Deployment

### 1. Connect Repository to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"New site from Git"**
3. Choose **GitHub** as your Git provider
4. Select the repository: `ahmadiiiiiiii198/salah-pizzeria-`
5. Click **"Deploy site"**

### 2. Configure Build Settings

Netlify should automatically detect the settings from `netlify.toml`, but verify:

```
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 3. Set Environment Variables

In your Netlify site dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_APP_NAME=Pizzeria Regina 2000 Torino
NODE_ENV=production
```

### 4. Deploy

1. Click **"Deploy site"** 
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be available at: `https://your-site-name.netlify.app`

## 🔍 Troubleshooting

### Build Fails

If the build fails, check:

1. **Node Version**: Ensure Node 18+ is being used
2. **Environment Variables**: All required variables are set
3. **Dependencies**: All packages are properly installed

### Site Loads but Shows Errors

1. **Check Console**: Open browser dev tools for JavaScript errors
2. **Environment Variables**: Verify all variables are correctly set
3. **Supabase Connection**: Test database connection

### Routing Issues

The `netlify.toml` file includes redirects for SPA routing. If pages don't load:

1. Verify `netlify.toml` is in the root directory
2. Check that redirects are properly configured

## 📝 Configuration Files

The repository includes these Netlify-specific files:

- `netlify.toml` - Build settings and redirects
- `.env.example` - Template for environment variables
- `postcss.config.js` - PostCSS configuration for Tailwind

## 🎯 Performance Optimization

The build is optimized for production with:

- **Code Splitting**: Separate bundles for vendors, UI components
- **Asset Optimization**: Compressed images and assets
- **Caching Headers**: Long-term caching for static assets
- **Security Headers**: XSS protection and security policies

## 🔄 Continuous Deployment

Once connected, Netlify will automatically:

1. **Deploy on Push**: Every push to `master` branch triggers a new deployment
2. **Preview Deployments**: Pull requests get preview URLs
3. **Rollback**: Easy rollback to previous deployments

## 📞 Support

If you encounter issues:

1. Check Netlify build logs for specific errors
2. Verify all environment variables are set correctly
3. Test the build locally with `npm run build`
4. Contact support if needed

---

**Happy Deploying!** 🎉
