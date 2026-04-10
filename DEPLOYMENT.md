<div align="center">

# 🚀 Deployment Guide
**Professional Stock Portfolio & Market Analysis Dashboard**

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

*A comprehensive guide to deploying your professional stock trading dashboard to production.*

</div>

---

## 📑 Table of Contents

- [🛠️ Prerequisites](#️-prerequisites)
- [1️⃣ GitHub Repository Setup](#1️⃣-github-repository-setup)
- [2️⃣ Database Setup (Supabase)](#2️⃣-database-setup-supabase)
- [3️⃣ Vercel Deployment](#3️⃣-vercel-deployment)
- [⚙️ Post-Deployment Configuration](#️-post-deployment-configuration)
- [🆘 Troubleshooting](#-troubleshooting)

---

## �️ Prerequisites

Before you begin, ensure you have the following accounts set up:

- [x] **GitHub Account** (for version control)
- [x] **Vercel Account** (free tier is sufficient for hosting)
- [x] **Supabase Account** (for PostgreSQL database & backend)

---

## 1️⃣ GitHub Repository Setup

First, let's get your code pushed to GitHub so Vercel can access it.

> [!TIP]
> If you've already pushed your code to GitHub, you can skip this step!

```bash
# Initialize Git Repository
git init
git add .
git commit -m "🚀 Initial commit: Stock Portfolio App with Options Player"

# Link to GitHub and Push
git remote add origin https://github.com/Girjesh2025/vp.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ Database Setup (Supabase)

Your application relies on Supabase for real-time portfolio data and authentication.

### 🌐 Create a Project
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Save your **Project URL** and **anon public key** (you'll need these later).

### 🗄️ Initialize the Database
1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Copy the contents of `supabase-schema-secure.sql` (recommended for RLS policies) or `supabase-schema-simple.sql`.
3. Run the query to set up your tables.

---

## 3️⃣ Vercel Deployment

Vercel provides seamless integration with Vite and GitHub for instant deployments.

### 🔌 Connect & Configure

1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your repository: `Girjesh2025/vp`.
3. Vercel should automatically detect **Vite**. Ensure the settings match:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 🔐 Environment Variables

> [!IMPORTANT]
> You must add these variables in the Vercel deployment settings before clicking deploy!

| Variable Name | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_CLERK_PUBLISHABLE_KEY` | *(Optional)* Your Clerk Auth key |
| `VITE_API_BASE_URL` | E.g., `https://your-app-name.vercel.app` |

Once configured, click **Deploy**! 🚀

---

## ⚙️ Post-Deployment Configuration

After a successful deployment, there are a few final touches:

1. **Update CORS Settings:**
   - Add your new Vercel domain (`https://your-app-name.vercel.app`) to your Supabase **Authentication -> URL Configuration** allowed origins.
2. **Test Live Features:**
   - ✅ Real-time Market Data & Options Player
   - ✅ FII/DII Proxy Data Loading
   - ✅ Portfolio CRUD Operations
   - ✅ Browser Notifications
   - ✅ Breakout Beacon & Swing Player Accuracy

---

## 🆘 Troubleshooting

Encountering issues? Here are the most common fixes:

> [!WARNING]
> **Build Fails (`npm run build`)**
> - Check your Vercel deployment logs for TypeScript errors.
> - Ensure all dependencies in `package.json` are properly installed.

> [!NOTE]
> **API / Database Errors**
> - Verify that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exactly correct in Vercel.
> - Check the browser's Network tab for CORS or 403 Forbidden errors.

> [!CAUTION]
> **NSE API Proxy Failing in Production**
> - The local Node proxy (`proxy-server.cjs`) bypasses NSE API protections locally. Since Vercel React deployments are static, ensure your proxy is either deployed correctly as a Vercel Serverless Function, or hosted on a persistent backend service like Render/Railway.

---

<div align="center">

**Happy Deploying! 🎉**

*Built with ❤️ for professional traders.*

</div>
