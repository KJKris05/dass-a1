# 🎯 Simple Vercel Deployment Guide (Works With Your Current Code!)

## Why This Works
Your frontend will be deployed separately from backend, so we just need to:
1. Deploy backend to get a URL
2. Create a proxy in Vercel to redirect `/api/*` calls to your backend
3. Deploy frontend to Vercel

---

## Part 1: Deploy Backend to Render (10 minutes)

### Step 1: Sign Up & Create Service

1. Go to **https://render.com**
2. Click "Get Started" → Sign up with GitHub
3. Click "New +" button → Select "Web Service"
4. Click "Connect account" if needed, then find your `dass-a1` repository
5. Click "Connect"

### Step 2: Configure Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `dass-event-backend` (or any name) |
| **Root Directory** | `src/backend` |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

### Step 3: Add Environment Variables

Click on "Environment" or "Advanced" section and add these:

```
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secret_key_at_least_32_characters_long_random_string
NODE_ENV=production
PORT=5000
```

**Where to get MONGO_URI:**
- Go to MongoDB Atlas (cloud.mongodb.com)
- Click "Connect" → "Connect your application"
- Copy the connection string
- Replace `<password>` with your actual password
- Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/felicity?retryWrites=true&w=majority`

**JWT_SECRET:**
- Any long random string (32+ characters)
- Example: `mySuper$ecretKey123ForJWT TokensInProduction!`

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Once deployed, you'll see a green "Live" badge
4. **COPY YOUR URL** - it will look like: `https://dass-event-backend.onrender.com`

### Step 5: Test Backend

Open your backend URL in browser. You should see:
```
Feliciy Event Management App is running!
```

---

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Method A: Using Vercel Dashboard (Easiest)

1. Go to **https://vercel.com**
2. Click "Sign Up" → Continue with GitHub
3. Click "Add New..." → "Project"
4. Find and select your `dass-a1` repository → Click "Import"

### ⚠️ CRITICAL CONFIGURATION:

5. **Framework Preset**: Create React App (should auto-detect)
6. **Root Directory**: Click "Edit" → Enter `src/frontend` → ✅ This is CRUCIAL!
7. **Build Command**: `npm run build` (auto-detected)
8. **Output Directory**: `build` (auto-detected)

9. **Environment Variables** - Click "Add" and enter:
   ```
   Name: REACT_APP_API_URL
   Value: https://dass-event-backend.onrender.com
   ```
   (Use your actual backend URL from Part 1 Step 4)

10. Make sure to select **All** (Production, Preview, Development)

11. Click **"Deploy"**

12. Wait 3-5 minutes. You'll get a URL like: `https://dass-a1-xyz123.vercel.app`

---

## Part 3: Update Backend CORS (2 minutes)

Now that you have your Vercel URL, update backend to accept requests:

### Option A: Via Render Dashboard (Easiest)

1. Go back to Render dashboard
2. Click on your `dass-event-backend` service
3. Click "Environment" tab
4. Add new environment variable:
   ```
   Name: FRONTEND_URL
   Value: https://dass-a1-xyz123.vercel.app
   ```
   (Use your actual Vercel URL)
5. Service will auto-redeploy

### Option B: Update Code (If Option A doesn't work)

The code has already been updated to accept `FRONTEND_URL` environment variable.

---

## Part 4: Test Your Deployment! 🎉

1. Open your Vercel URL: `https://dass-a1-xyz123.vercel.app`

2. Try these features:
   - ✅ Register a new account
   - ✅ Login
   - ✅ Create an event (as organizer)
   - ✅ Register for an event
   - ✅ Post in forum
   - ✅ Submit feedback

---

## Troubleshooting

### Problem: "Network Error" or API calls fail

**Solution 1**: Check if backend is awake
- Render free tier sleeps after 15 min inactivity
- First request takes 30-60 seconds to wake up
- Just wait and try again

**Solution 2**: Check CORS
- Make sure you added your Vercel URL to `FRONTEND_URL` in Render
- Make sure there's no trailing slash: ❌ `https://app.vercel.app/` ✅ `https://app.vercel.app`

### Problem: MongoDB connection fails

**Solution**:
- Go to MongoDB Atlas → Network Access
- Click "Add IP Address" → "Allow Access from Anywhere" → `0.0.0.0/0`
- Confirm

### Problem: API endpoints still use localhost

This is expected! The environment variable `REACT_APP_API_URL` will override it in production.

However, if it doesn't work, we need to update the code. Let me know and I'll help.

### Problem: "Application error" on Render

**Solution**:
- Click on your service in Render
- Go to "Logs" tab
- Check for errors
- Usually missing environment variables or MongoDB connection issues

---

## Your Submission URLs

After successful deployment:

📱 **Frontend (Vercel)**: `https://dass-a1-xyz123.vercel.app`
🔧 **Backend API (Render)**: `https://dass-event-backend.onrender.com`

---

## Important Notes

1. **Free Tier Limitations**:
   - Render: Service sleeps after 15 min inactivity (first request slow)
   - Vercel: 100GB bandwidth/month, 100 deployments/day
   - MongoDB Atlas: 512MB storage free tier

2. **Automatic Deployments**:
   - Every push to `main` branch will auto-deploy to Vercel
   - Render also auto-deploys on push

3. **Environment Variables**:
   - Never commit `.env` files to GitHub
   - Always set them in platform dashboards

4. **Custom Domain** (Optional):
   - Both Vercel and Render support custom domains
   - Add in respective dashboards under "Domains" section

---

## Next Steps

1. ✅ Test all features thoroughly
2. ✅ Share the URLs with your team/instructor
3. ✅ Monitor the Render logs for any errors
4. ✅ Check Vercel Analytics for usage
5. Optional: Set up a custom domain

---

## Need Help?

If something doesn't work:
1. Check Vercel deployment logs (in Vercel dashboard)
2. Check Render service logs (in Render dashboard → Logs tab)
3. Verify all environment variables are set correctly
4. Make sure MongoDB Atlas allows connections from anywhere
5. Try the API URL directly in browser to confirm backend is running

---

## Deployment Checklist

Backend (Render):
- [ ] Service created with correct root directory (`src/backend`)
- [ ] Environment variables set (MONGO_URI, JWT_SECRET, NODE_ENV)
- [ ] Service deployed successfully (green "Live" badge)
- [ ] Backend URL copied
- [ ] Backend URL tested in browser

Frontend (Vercel):
- [ ] Project imported from GitHub
- [ ] Root directory set to `src/frontend`
- [ ] Environment variable `REACT_APP_API_URL` added with backend URL
- [ ] Deployment successful
- [ ] Frontend URL copied

Final:
- [ ] FRONTEND_URL environment variable added to Render backend
- [ ] Backend redeployed
- [ ] Full app tested (register, login, create event, etc.)
- [ ] URLs ready to submit

Good luck! 🚀
