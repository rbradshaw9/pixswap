# PixSwap Deployment Guide - Vercel + Railway

This guide walks you through deploying PixSwap with the recommended hybrid architecture:
- **Frontend**: Vercel (free)
- **Backend**: Railway (~$5/month)
- **Database**: Railway MongoDB Plugin

## Prerequisites

- GitHub account with your code pushed
- Vercel account (free tier works)
- Railway account (free to start)
- Cloudinary account (free tier)

## 🚀 Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `pixswap` repository
5. Railway will detect the Node.js app automatically

### Step 2: Add MongoDB Service

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MongoDB"**
3. Railway will provision a MongoDB instance
4. Copy the connection string (format: `mongodb://...`)

### Step 3: Add Redis Service (Optional but Recommended)

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Copy the Redis URL

### Step 4: Configure Environment Variables

In your Railway backend service settings, add these variables:

```bash
# Required
NODE_ENV=production
PORT=3000
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=<generate-with: openssl rand -base64 32>
CLIENT_URL=<your-vercel-url>

# Cloudinary (get from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional
REDIS_URL=${{Redis.REDIS_URL}}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Pro tip**: Railway auto-injects service URLs with the `${{ServiceName.VARIABLE}}` syntax.

### Step 5: Deploy Backend

1. Railway will auto-deploy when you push to GitHub
2. Get your backend URL: `https://your-app.up.railway.app`
3. Test it: `curl https://your-app.up.railway.app/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 6: Configure Custom Domain (Optional)

1. In Railway settings, click **"Networking"**
2. Click **"Generate Domain"** or add custom domain
3. Update `CLIENT_URL` to match your domain

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Navigate to client directory
cd client

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel --prod
```

Or use Vercel's web interface:
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your `pixswap` repository
4. Set **Root Directory** to `client`
5. Click **"Deploy"**

### Step 2: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```bash
VITE_API_URL=https://your-app.up.railway.app/api
VITE_SOCKET_URL=https://your-app.up.railway.app
```

**Important**: After adding environment variables, redeploy:
```bash
vercel --prod
```

### Step 3: Update Backend CORS

Go back to Railway and update your backend's `CLIENT_URL`:

```bash
CLIENT_URL=https://your-app.vercel.app
```

Railway will auto-redeploy.

## ✅ Verification

### 1. Test Backend
```bash
# Health check
curl https://your-app.up.railway.app/health

# Database check
curl https://your-app.up.railway.app/health/db
```

### 2. Test Frontend
Visit `https://your-app.vercel.app` and:
- Check the signup page loads
- Check browser console for CORS errors (should be none)
- Try creating an account

### 3. Test Real-time Features
- Open browser dev tools → Network → WS tab
- You should see Socket.IO connection established
- Try sending a test message

## 🔧 Troubleshooting

### CORS Errors
**Symptom**: Frontend can't reach backend
**Fix**: Ensure `CLIENT_URL` in Railway matches your Vercel URL exactly (including https://)

### Socket.IO Connection Failed
**Symptom**: Real-time features don't work
**Fix**: 
1. Check `VITE_SOCKET_URL` includes the protocol (`https://`)
2. Verify Railway allows WebSocket connections (it does by default)

### Database Connection Failed
**Symptom**: 500 errors on API calls
**Fix**:
1. Check MongoDB service is running in Railway
2. Verify `MONGODB_URI` is correctly set
3. Check Railway logs: `railway logs`

### Build Failures
**Symptom**: Deployment fails
**Fix**:
1. Check Railway build logs
2. Ensure `package.json` has `build` script
3. Verify Node version compatibility

## 📊 Monitoring

### Railway Dashboard
- View logs: Click your service → **"Deployments"** → **"View Logs"**
- Monitor metrics: **"Metrics"** tab shows CPU, memory, network
- Check health: Railway pings your `/health` endpoint

### Vercel Dashboard
- View deployments: **"Deployments"** tab
- Check build logs: Click any deployment
- Monitor analytics: **"Analytics"** tab (paid feature)

## 💰 Cost Estimate

### Free Tier (for testing)
- Vercel: Free
- Railway: $5 free credit/month
- MongoDB on Railway: Counts toward Railway credit
- **Total**: Free for light usage

### Production Tier
- Vercel: Free (or $20/month for Pro)
- Railway: ~$5-10/month (usage-based)
- MongoDB on Railway: Included in Railway cost
- Cloudinary: Free tier (25GB storage, 25GB bandwidth)
- **Total**: ~$5-10/month

## 🚀 Continuous Deployment

Both platforms auto-deploy on git push:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main

# Vercel and Railway will automatically:
# 1. Pull latest code
# 2. Run build
# 3. Deploy to production
# 4. Run health checks
```

### Branch Deployments
- **Vercel**: Auto-creates preview URLs for PRs
- **Railway**: Can set up PR environments in settings

## 📈 Scaling

### When You Grow

**Railway Scaling Options:**
- Vertical: Increase RAM/CPU in service settings
- Horizontal: Add more service replicas (requires Redis for session sharing)
- Database: Upgrade MongoDB to dedicated cluster

**Vercel Scaling:**
- Automatically scales (serverless)
- No configuration needed
- Just pay for bandwidth

## 🔐 Security Checklist

- [ ] Generate strong JWT secret: `openssl rand -base64 32`
- [ ] Add custom domain with HTTPS
- [ ] Enable Railway's private networking (paid tier)
- [ ] Set up Cloudinary signed uploads
- [ ] Configure rate limiting
- [ ] Enable MongoDB authentication (Railway does this by default)
- [ ] Review CORS settings (don't use `*` in production)

## 📝 Quick Deploy Checklist

Backend (Railway):
- [ ] Connect GitHub repository
- [ ] Add MongoDB service
- [ ] Configure environment variables
- [ ] Deploy and test `/health`
- [ ] Note the Railway URL

Frontend (Vercel):
- [ ] Import repository (set root to `client`)
- [ ] Add environment variables (Railway URL)
- [ ] Deploy
- [ ] Update Railway's `CLIENT_URL` with Vercel URL

Final:
- [ ] Test signup/login
- [ ] Test media upload
- [ ] Test real-time chat
- [ ] Monitor Railway logs for errors

## 🆘 Getting Help

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: [GitHub Issues](https://github.com/rbradshaw9/pixswap/issues)

---

**You're all set!** 🎉 Your app is now running on production infrastructure with auto-deployment.