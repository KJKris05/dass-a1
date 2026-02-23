# Deployment Guide for DASS Event Management System

## Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- Backend deployed first (get the API URL)

## Part 1: Deploy Backend (Choose one platform)

### Option A: Render (Recommended - Free Tier Available)

1. **Sign up at render.com**
   - Go to https://render.com
   - Sign up with your GitHub account

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `dass-a1` repository

3. **Configure the Service**
   - **Name**: `dass-event-backend` (or any name you prefer)
   - **Root Directory**: `src/backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. **Add Environment Variables**
   Click "Environment" tab and add:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_minimum_32_characters
   PORT=5000
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL (e.g., `https://dass-event-backend.onrender.com`)

### Option B: Railway

1. **Sign up at railway.app**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `dass-a1` repository

3. **Configure**
   - **Root Directory**: `/src/backend`
   - **Start Command**: `node server.js`

4. **Add Environment Variables**
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_minimum_32_characters
   PORT=5000
   NODE_ENV=production
   ```

5. **Deploy and copy the generated URL**

### Option C: Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Navigate to backend directory**
   ```bash
   cd src/backend
   ```

3. **Login to Fly**
   ```bash
   fly auth login
   ```

4. **Create fly.toml** (already created if following this guide)

5. **Launch the app**
   ```bash
   fly launch
   ```

6. **Set secrets**
   ```bash
   fly secrets set MONGO_URI="your_mongodb_connection_string"
   fly secrets set JWT_SECRET="your_jwt_secret_key"
   fly secrets set NODE_ENV="production"
   ```

7. **Deploy**
   ```bash
   fly deploy
   ```

## Part 2: Deploy Frontend to Vercel

### Step 1: Update API Configuration

Before deploying, you need to update all API calls to use the environment variable.

**I've already created the configuration files:**
- `src/frontend/.env.example` - Template for environment variables
- `src/frontend/src/config.js` - API URL configuration
- `src/frontend/vercel.json` - Vercel configuration

### Step 2: Push Changes to GitHub

```bash
cd /home/kris-jain/DASS/Assignment/A1/dass-a1
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### Step 3: Deploy to Vercel

1. **Sign up at vercel.com**
   - Go to https://vercel.com
   - Sign up with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your `dass-a1` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Create React App (auto-detected)
   - **Root Directory**: `src/frontend` ⚠️ IMPORTANT
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Add:
     ```
     Name: REACT_APP_API_URL
     Value: https://your-backend-url.onrender.com
     ```
   - Replace with your actual backend URL from Part 1
   - Select all environments (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for build and deployment
   - You'll get a URL like: `https://dass-a1-xxxx.vercel.app`

### Step 4: Update Backend CORS

After deployment, you need to update your backend to allow requests from your Vercel URL.

Update `src/backend/server.js` CORS configuration:

```javascript
const cors = require('cors');
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://your-vercel-url.vercel.app'  // Add your Vercel URL
    ],
    credentials: true
}));
```

Then redeploy your backend.

## Part 3: Test Your Deployment

1. **Visit your Vercel URL**
   - Example: `https://dass-a1-xxxx.vercel.app`

2. **Test key features:**
   - User registration
   - Login
   - Event creation
   - Event registration
   - Forum posting
   - Feedback submission

## Troubleshooting

### Frontend Issues

**Problem**: API calls fail with CORS errors
- **Solution**: Make sure backend CORS includes your Vercel URL

**Problem**: Environment variable not working
- **Solution**: 
  - Ensure variable name starts with `REACT_APP_`
  - Redeploy after changing environment variables
  - Clear browser cache

**Problem**: 404 on page refresh
- **Solution**: The `vercel.json` file handles this (already created)

### Backend Issues

**Problem**: Backend crashes or won't start
- **Solution**: Check environment variables are set correctly

**Problem**: MongoDB connection fails
- **Solution**: 
  - Check MongoDB URI is correct
  - Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
  - Or add Render/Railway IP addresses to whitelist

**Problem**: JWT errors
- **Solution**: Ensure JWT_SECRET is at least 32 characters

## Important Notes

1. **Free Tier Limitations:**
   - Render: App sleeps after 15 min inactivity (first request takes 30-60s)
   - Vercel: 100GB bandwidth/month
   - Railway: $5 free credit per month

2. **MongoDB Atlas:**
   - Make sure you're using MongoDB Atlas (cloud) not local MongoDB
   - Network Access: Allow from anywhere (0.0.0.0/0) for ease

3. **Environment Variables:**
   - Never commit `.env` files
   - Always use environment variables for sensitive data
   - Update variables in deployment platform dashboard

## URLs to Submit

After successful deployment, you'll have:

- **Frontend URL**: `https://your-app-name.vercel.app`
- **Backend API URL**: `https://your-backend.onrender.com` (or railway/fly.io)

## Next Steps After Deployment

1. Test all features thoroughly
2. Monitor error logs in Vercel and Render dashboards
3. Set up custom domain (optional)
4. Enable analytics in Vercel dashboard
5. Set up monitoring/alerts

## Support

If you encounter issues:
- Check Vercel deployment logs
- Check Render/Railway service logs
- Verify all environment variables are set
- Test API endpoints directly using Postman/Thunder Client
