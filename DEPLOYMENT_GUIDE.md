# Complete Deployment Guide for Toycker Project

This guide provides detailed step-by-step instructions for deploying the Toycker Medusa e-commerce project with the frontend on Vercel and backend on Railway using their free tiers.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment on Railway](#backend-deployment-on-railway)
4. [Frontend Deployment on Vercel](#frontend-deployment-on-vercel)
5. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Free Tier Limitations and Best Practices](#free-tier-limitations-and-best-practices)

## Project Overview

The Toycker project consists of:
- **Backend**: A Medusa v2 e-commerce backend built with Node.js/TypeScript
- **Frontend**: A Next.js 15 storefront with React and Tailwind CSS
- **Database**: PostgreSQL with Redis for caching and session management

## Prerequisites

Before you begin, ensure you have:
- [Node.js 20+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed and configured
- GitHub account with [SSH keys set up](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Vercel account](https://vercel.com/signup) (free tier)
- [Railway account](https://railway.app/signup) with payment method (for free tier)
- Your project code pushed to GitHub repository

### Setting Up Your GitHub Repository

If you haven't already:
```bash
# Navigate to your project directory
cd toycker

# Initialize Git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Create a new repository on GitHub, then add remote
git remote add origin https://github.com/YOUR_USERNAME/toycker.git

# Push to GitHub
git push -u origin main
```

## Backend Deployment on Railway

Railway offers a free tier with $5 in usage credits for the first 30 days, then $1/month with $1 in non-rollover credits monthly.

### Step 1: Configure Your Medusa Backend

1. Update your `medusa-config.ts` to support worker mode:
```typescript
const projectConfig = {
  // ...existing config,
  worker_mode: process.env.MEDUSA_WORKER_MODE as "worker" | "server",
}
```

2. Create a `railway.toml` file in your backend root directory:
```toml
[build]
builder = "NIXPACKS"

[build.nixpacksPlan.phases.setup]
nixPkgs = ["nodejs", "yarn"]

[build.nixpacksPlan.phases.install]
cmds=["yarn install"]
```

3. Add a predeploy script to your `package.json`:
```json
"scripts": {
  // ...existing scripts,
  "predeploy": "medusa migrations run"
}
```

### Step 2: Deploy to Railway

1. Log into your [Railway dashboard](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `backend` folder of your repository
4. Configure environment variables (see below)
5. Click **"Deploy"**

### Step 3: Configure Environment Variables

In your Railway project settings, add these variables:

```bash
PORT=9000
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your_secure_jwt_secret_here
COOKIE_SECRET=your_secure_cookie_secret_here
MEDUSA_WORKER_MODE=server
STORE_CORS=https://your-frontend-url.vercel.app
ADMIN_CORS=https://your-frontend-url.vercel.app
```

Generate strong secrets for `JWT_SECRET` and `COOKIE_SECRET` using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Set Up Databases

1. In your Railway project, click **"+"** → **"Database"** → **"Add PostgreSQL"**
2. Click **"+"** → **"Database"** → **"Add Redis"**
3. Railway will automatically generate connection URLs referenced in your environment variables

### Step 5: Deploy the Worker Instance

Create a second service for the worker mode:

1. Click **"New"** → **"GitHub Repo"**
2. Select the same repository
3. Configure with the same environment variables, but change:
   ```bash
   MEDUSA_WORKER_MODE=worker
   ```
4. Set the start command to: `medusa start`

### Step 6: Get Your Backend URL

After deployment:
1. Go to your server service in Railway
2. Click **"Settings"** → **"Generate Domain"**
3. Copy the generated URL (e.g., `toycker-api.up.railway.app`)

## Frontend Deployment on Vercel

Vercel's Hobby (free) plan includes:
- 100GB bandwidth/month
- 4 CPU hours/month
- 1M function invocations/month
- Non-commercial use only

### Step 1: Prepare Your Frontend

1. Create or update your `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-railway-backend-url.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here
```

### Step 2: Deploy to Vercel

Option A: Using Vercel Dashboard

1. Log into [Vercel](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository (the frontend folder specifically)
4. Vercel will detect Next.js automatically
5. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
6. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: Your Railway backend URL
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`: Your publishable API key
7. Click **"Deploy"**

Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Run deployment
vercel --prod
```

### Step 3: Get Your Publishable API Key

1. Access your Medusa Admin: `https://your-backend-url.railway.app/app`
2. Go to **Settings** → **Publishable API Keys**
3. Create a new key and copy it
4. Add this key to your Vercel environment variables as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

## Connecting Frontend to Backend

### Step 1: Configure CORS

Ensure your backend Railway environment variables include your frontend URL:
```bash
STORE_CORS=https://your-frontend-domain.vercel.app
ADMIN_CORS=https://your-frontend-domain.vercel.app
```

### Step 2: Update Frontend Configuration

In your frontend code, ensure the Medusa client is initialized correctly:

```typescript
// In lib/medusa.ts or similar
import Medusa from "@medusajs/js-sdk"

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  maxRetries: 3,
})

export default medusa
```

### Step 3: Test the Connection

1. Visit your Vercel-deployed frontend
2. Browse products (should load from Railway backend)
3. Add items to cart
4. Complete checkout flow

## Post-Deployment Configuration

### Create an Admin User

After backend deployment, create your admin user:

```bash
# Using Railway CLI (install first)
railway run npx medusa user --email admin@yourdomain.com --password your_secure_password
```

Or access the admin dashboard directly at `https://your-backend-url.railway.app/app`

### Set Up Custom Domains (Optional)

**For Railway:**
1. Go to your service settings
2. Click **"Custom Domain"**
3. Enter your domain and configure DNS records

**For Vercel:**
1. In project settings, go to **"Domains"**
2. Add your custom domain
3. Configure DNS records as instructed

### Configure Email Providers (Optional)

Add email provider to Railway environment variables:
```bash
# For SendGrid
SENDGRID_API_KEY=your_key_here

# For Resend
RESEND_API_KEY=your_key_here
```

## Troubleshooting

### Common Issues

**Backend Issues:**
- If build fails: Check your `railway.toml` configuration
- If migrations fail: Verify `DATABASE_URL` is correctly set
- For memory errors: Upgrade to Railway Hobby plan ($5/month)

**Frontend Issues:**
- If build fails: Check environment variables in Vercel
- If API calls fail: Verify CORS settings on backend
- For authentication errors: Check `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

**Connection Issues:**
1. Check backend health: `https://your-backend-url.railway.app/health`
2. Verify environment variables match between platforms
3. Ensure both services are in the same region (if applicable)

### Viewing Logs

**Railway:**
- Go to your service → **"Deployments"** → **"View Logs"**

**Vercel:**
- Go to project → **"Logs"** tab for real-time logs

## Free Tier Limitations and Best Practices

### Railway Limitations

Free tier includes:
- $5 initial credits (30 days)
- $1/month with $1 in non-rollover credits after
- Limited to 5 projects initially, 1 project after trial
- 500MB database storage limit
- 0.5GB RAM, 1 vCPU per service
- Services sleep after inactivity

**To minimize costs:**
1. Use Railway's pricing calculator to monitor usage
2. Optimize database queries
3. Implement caching with Redis
4. Consider combining server and worker in one service if possible

### Vercel Limitations

Hobby plan includes:
- 100GB bandwidth/month
- 4 CPU hours/month
- 1M function invocations/month
- Non-commercial use only
- 1 project, 1 team member

**To optimize usage:**
1. Implement static generation where possible
2. Use ISR (Incremental Static Regeneration)
3. Optimize images with Next.js Image component
4. Limit middleware usage to essential routes

### Monitoring Tips

1. Set up alerts in both dashboards
2. Regularly check usage statistics
3. Implement analytics to track frontend performance
4. Monitor Railway's database storage usage

## Alternative Deployment Options

If you encounter limitations with free tiers:

### Medusa Cloud
- Medusa's managed hosting solution
- Handles all infrastructure automatically
- Push-to-deploy from GitHub
- Multiple environments
- Starting at competitive pricing

### Other Platforms
- **Render**: Similar to Railway with potentially better free tier
- **DigitalOcean App Platform**: More control, requires some DevOps knowledge
- **Heroku**: Established platform with free tier (though limited)

## Next Steps After Deployment

1. **Add Products**: Use Medusa Admin or API to populate your store
2. **Configure Payments**: Add Stripe or other payment providers
3. **Set Up Shipping**: Configure shipping regions and methods
4. **Customize Storefront**: Modify the Next.js frontend to match your brand
5. **Set Up Analytics**: Add Google Analytics or similar to track visitors
6. **Implement SEO**: Add meta tags, sitemaps, and structured data

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **API Keys**: Use read-only publishable keys on frontend
3. **HTTPS**: Both platforms provide SSL automatically
4. **CORS**: Configure to only allow your frontend domain
5. **Rate Limiting**: Consider implementing rate limiting on your backend

## Backup Strategy

1. **Database**: Regular exports from Railway PostgreSQL
2. **Media**: Store product images on cloud storage (AWS S3, Cloudinary)
3. **Configuration**: Keep your configuration files in Git
4. **User Data**: Ensure customer data is backed up regularly

---

## Conclusion

By following this guide, you should now have your Toycker e-commerce platform fully deployed with:
- Backend on Railway's free tier ($1/month after trial)
- Frontend on Vercel's free Hobby plan
- Connected services with proper CORS and API configuration
- Basic monitoring and security measures in place

For issues or questions:
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Medusa Documentation](https://docs.medusajs.com/)
- Community support on Discord or GitHub Discussions
