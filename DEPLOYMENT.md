# 🚀 Deployment Guide - Stock Portfolio App

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project (for database)

## 📋 Step-by-Step Deployment Instructions

### 1. GitHub Repository Setup

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Stock Portfolio App with notifications"
   ```

2. **Add GitHub Remote**:
   ```bash
   git remote add origin https://github.com/Girjesh2025/vp.git
   git branch -M main
   git push -u origin main
   ```

### 2. Vercel Deployment

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository: `Girjesh2025/vp`

2. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables Setup**:
   Add these environment variables in Vercel dashboard:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key (optional)
   VITE_API_BASE_URL=https://your-app-name.vercel.app
   ```

### 3. Database Setup (Supabase)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down your project URL and anon key

2. **Run Database Schema**:
   - Use one of the provided schema files:
     - `supabase-schema-simple.sql` (basic setup)
     - `supabase-schema-secure.sql` (with RLS policies)
   - Run in Supabase SQL editor

### 4. Post-Deployment Configuration

1. **Update CORS Settings**:
   - Add your Vercel domain to any API CORS configurations
   - Update Supabase allowed origins if needed

2. **Test Deployment**:
   - Visit your Vercel URL
   - Test all features:
     - Stock portfolio management
     - Real-time price updates
     - Notifications system
     - Market news panel

## 🔧 Configuration Files

### `vercel.json`
- Handles SPA routing
- Environment variable mapping
- Build configuration

### `.env.production`
- Template for production environment variables
- Copy values to Vercel dashboard

## 🚨 Important Notes

1. **API Keys**: Never commit real API keys to GitHub
2. **Environment Variables**: Set all required variables in Vercel dashboard
3. **Database**: Ensure Supabase RLS policies are properly configured
4. **HTTPS**: Vercel automatically provides HTTPS
5. **Custom Domain**: Can be configured in Vercel dashboard

## 📱 Features Included in Deployment

- ✅ Stock Portfolio Management
- ✅ Real-time Price Updates
- ✅ Performance Charts
- ✅ Transaction History
- ✅ Browser Notifications
- ✅ Market News Panel
- ✅ Settings & Preferences
- ✅ Responsive Design
- ✅ PWA Ready

## 🔄 Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch triggers automatic deployment
- Preview deployments for pull requests
- Rollback capability through Vercel dashboard

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Check environment variables

2. **API Errors**:
   - Verify Supabase URL and keys
   - Check CORS settings
   - Ensure database schema is applied

3. **Notifications Not Working**:
   - Check browser permissions
   - Verify HTTPS is enabled (required for notifications)
   - Test in different browsers

### Support:
- Check Vercel deployment logs
- Review browser console for errors
- Verify all environment variables are set

## 🎯 Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure analytics
3. Set up monitoring
4. Add real stock API integration
5. Implement user authentication
6. Add more notification features

---

**Happy Deploying! 🚀**