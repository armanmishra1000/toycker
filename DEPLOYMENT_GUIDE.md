# Complete Deployment Guide: Frontend on Vercel & Backend on Railway

This guide will walk you through deploying your Medusa e-commerce project with frontend on Vercel and backend on Railway using their free tiers.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure Overview](#project-structure)
3. [Backend Deployment on Railway](#backend-deployment)
4. [Frontend Deployment on Vercel](#frontend-deployment)
5. [Connecting Frontend to Backend](#connecting-frontend-backend)
6. [Environment Variables Configuration](#environment-variables)
7. [Free Tier Limitations](#free-tier-limitations)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:
- A GitHub account with your project repository
- Railway account (sign up at [railway.app](https://railway.app))
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Node.js v20+ installed locally
- Medusa backend running locally with configuration complete
- Next.js frontend set up and tested locally

## Project Structure

Your project should have this structure:
```
toycker/
├── backend/          # Medusa backend (Node.js)
├── frontend/         # Next.js frontend
└── README.md
```

## Backend Deployment on Railway

### Step 1: Configure Backend for Production

1. **Add Railway Configuration File**

Create `railway.toml` in the backend root directory:

```toml
[build]
builder = "NIXPACKS"

[build.nixpacksPlan.phases.setup]
nixPkgs = ["nodejs", "npm"]

[build.nixpacksPlan.phases.install]
cmds=["npm install --legacy-peer-deps"]
```

2. **Update medusa-config.ts**

Ensure your `medusa-config.ts` has worker mode configuration:

```ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.NODE_ENV === 'production',
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    worker_mode: process.env.MEDUSA_WORKER_MODE || "worker",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
```

3. **Push Changes to GitHub**

```bash
git add .
git commit -m "Configure backend for Railway deployment"
git push origin main
```

### Step 2: Set Up Railway Project

1. **Create New Project**
   - Go to [railway.app](https://railway.app) and log in
   - Click "New Project" button
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub repositories
   - Select your repository

2. **Create PostgreSQL Database**
   - In your project view, click "New"
   - Select "Provision PostgreSQL"
   - Wait for database creation

3. **Create Redis Database**
   - Click "New" again
   - Select "Database" → "Add Redis"
   - Wait for Redis to be provisioned

### Step 3: Configure Environment Variables

1. **Server Instance Configuration**
   - Click on your backend service
   - Go to "Variables" tab
   - Add these variables:
   
   ```bash
   PORT=9000
   JWT_SECRET=your_random_secret_key_here
   COOKIE_SECRET=another_random_secret_key_here
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   MEDUSA_WORKER_MODE=server
   NODE_ENV=production
   ```

2. **Worker Instance Configuration**
   - Click "New" → "GitHub Repo" → Select same repository
   - Go to "Variables" tab
   - Add same variables but change:
   ```bash
   MEDUSA_WORKER_MODE=worker
   ```

### Step 4: Update Start Commands

1. **For Server Instance**
   - Go to Settings → Deploy section
   - Click "Start Command"
   - Enter: `medusa migrations run && medusa start`

2. **For Worker Instance**
   - Go to Settings → Deploy section  
   - Click "Start Command"
   - Enter: `medusa start`

### Step 5: Deploy Backend

1. Click the "Deploy" button at the top of your project dashboard
2. Wait for deployment to complete (may take 5-10 minutes)
3. Once deployed, note your backend URL from Railway dashboard

### Step 6: Create Admin User

Run this command in your backend directory to create an admin user:

```bash
railway run npx medusa user --email admin@yourdomain.com --password yourpassword
```

## Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Production

1. **Update Next.js Configuration**

Ensure your `next.config.js` is properly configured:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any specific configuration needed
}

module.exports = nextConfig
```

2. **Update Environment Variables Template**

Create or update `.env.template`:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=your_railway_backend_url
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_publishable_key
```

3. **Push to GitHub**

```bash
cd frontend
git add .
git commit -m "Configure frontend for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Create New Project**
   - Go to [vercel.com](https://vercel.com) and log in
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the frontend folder (configure root directory if needed)

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `frontend` (if not already set)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to project Settings → Environment Variables
   - Add these variables:
   
   ```env
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your frontend URL

## Connecting Frontend to Backend

### Step 1: Get Publishable API Key

1. Access your Medusa admin: `https://your-backend-url.railway.app/app`
2. Navigate to Settings → Publishable API Keys
3. Create new key or use existing one
4. Copy the key (starts with `pk_`)

### Step 2: Update CORS Settings

In Railway backend variables, ensure:

```bash
STORE_CORS=https://your-frontend-url.vercel.app
ADMIN_CORS=https://your-backend-url.railway.app
AUTH_CORS=https://your-frontend-url.vercel.app
```

### Step 3: Update Frontend Environment

In Vercel, update your environment variable:

```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_copied_key_here
```

### Step 4: Redeploy Both Services

1. **Backend**: Make a small change and push to trigger Railway redeploy
2. **Frontend**: Push changes to trigger Vercel redeploy

## Environment Variables

### Backend (Railway)

| Variable | Required | Example |
|----------|-----------|---------|
| `DATABASE_URL` | Yes | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | Yes | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | Yes | `random_32_character_string` |
| `COOKIE_SECRET` | Yes | `another_random_32_character_string` |
| `STORE_CORS` | Yes | `https://your-app.vercel.app` |
| `ADMIN_CORS` | Yes | `https://your-backend.railway.app` |
| `AUTH_CORS` | Yes | `https://your-app.vercel.app` |
| `MEDUSA_WORKER_MODE` | Yes | `server` or `worker` |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `9000` |

### Frontend (Vercel)

| Variable | Required | Example |
|----------|-----------|---------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Yes | `https://your-backend.railway.app` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Yes | `pk_your_key_here` |

## Free Tier Limitations

### Railway (2025)

- **Trial Credits**: $5 one-time credit for first 30 days
- **After Trial**: $1 monthly credits
- **Resources**: 0.5 GB RAM, 1 vCPU per service
- **Storage**: 0.5 GB volume storage
- **Bandwidth**: Varies based on usage
- **Projects**: Up to 5 projects
- **Note**: Services may pause if credits exhausted

### Vercel Hobby Plan (2025)

- **Bandwidth**: 100 GB per month
- **Function Invocations**: 1,000,000 per month
- **CPU Time**: 4 hours per month
- **Memory**: 360 GB-hours per month
- **Build Time**: 45 minutes per deployment
- **Projects**: Up to 200 projects
- **Limitation**: Non-commercial use only
- **Note**: No overage option, must wait 30 days if limits exceeded

## Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**
   - Ensure `STORE_CORS` includes your Vercel URL
   - Redeploy backend after changing CORS settings
   - Check for trailing slashes in URLs

2. **Environment Variables Not Working**
   - Verify variable names match exactly
   - Ensure redeployment after adding variables
   - Check Railway/Vercel logs for errors

3. **Build Failures**
   - Check package.json for correct scripts
   - Verify Node.js version compatibility (v20+)
   - Review build logs in Railway/Vercel dashboards

4. **Database Connection Issues**
   - Verify `DATABASE_URL` is properly referenced
   - Check PostgreSQL service is running
   - Run migrations manually if needed

5. **Frontend Can't Connect to Backend**
   - Verify backend URL is correct and accessible
   - Check publishable key is valid
   - Ensure CORS settings include frontend URL

### Useful Commands

**Railway CLI Commands:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Check logs
railway logs

# Run commands on production
railway run <command>
```

**Vercel CLI Commands:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Pull environment variables
vercel env pull
```

## Testing Your Deployment

1. **Backend Testing**
   - Visit: `https://your-backend.railway.app/health`
   - Visit: `https://your-backend.railway.app/store/products`
   - Access admin: `https://your-backend.railway.app/app`

2. **Frontend Testing**
   - Visit: `https://your-app.vercel.app`
   - Check products load from backend
   - Test add to cart functionality

3. **End-to-End Testing**
   - Create test order
   - Verify admin dashboard shows orders
   - Check all features work as expected

## Maintenance Tips

1. **Monitor Usage**: Regularly check Railway and Vercel dashboards
2. **Update Dependencies**: Keep packages up to date
3. **Backup Data**: Regular backups of PostgreSQL database
4. **Security**: Rotate secrets periodically
5. **Performance**: Monitor for slow queries or API calls

## Conclusion

Your Medusa e-commerce application is now deployed with:
- Backend running on Railway with PostgreSQL and Redis
- Frontend running on Vercel with global CDN
- Both services using free tiers (with limitations noted)

Remember to monitor your usage against the free tier limits and upgrade plans as your application grows.

For additional help:
- [Railway Documentation](https://docs.railway.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Medusa Documentation](https://docs.medusajs.com)
