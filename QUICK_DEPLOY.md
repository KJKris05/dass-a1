# Quick Vercel Deployment Steps

## What I've Already Done For You:

1. ✅ Created `src/frontend/.env` - Local environment configuration
2. ✅ Created `src/frontend/.env.example` - Template for others
3. ✅ Created `src/frontend/src/config.js` - API URL configuration utility
4. ✅ Created `src/frontend/vercel.json` - Vercel deployment configuration
5. ✅ Updated `.gitignore` to exclude `.env` file

## What You Need To Do:

### Step 1: Update API Calls (IMPORTANT)

You have two options:

#### Option A: Quick Manual Update (Recommended for now)

I can help you update one file at a time. Let's start with the Login page as an example.

#### Option B: Use Find & Replace in VS Code

1. Open VS Code
2. Press `Ctrl+Shift+H` (Find and Replace in Files)
3. In "files to include": `src/frontend/src/**/*.js`
4. Find: `http://localhost:5000`
5. Replace with: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`
6. Replace all

**Note**: This will require updating template literals. Better to do file by file.

### Step 2: Test Locally

```bash
cd src/frontend
npm start
```

Should still work with localhost.

### Step 3: Deploy Backend First

Choose one platform and deploy your backend:

**Render (Easiest):**
1. Go to https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Connect repo: `dass-a1`
5. Root Directory: `src/backend`
6. Build: `npm install`
7. Start: `node server.js`
8. Add environment variables:
   - `MONGO_URI`: your_mongodb_uri
   - `JWT_SECRET`: any_long_random_string_32chars
   - `NODE_ENV`: production
9. Deploy and copy the URL

### Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Import `dass-a1` repo
4. **ROOT DIRECTORY**: `src/frontend` ⚠️ CRITICAL
5. Environment Variables:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.onrender.com` (from Step 3)
6. Deploy

### Step 5: Update Backend CORS

Add your Vercel URL to backend CORS:

```javascript
// In src/backend/server.js
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://your-app.vercel.app'  // Add this
    ]
}));
```

Redeploy backend.

## Need Help Updating API Calls?

Let me know which approach you prefer:
1. I can update files one by one for you
2. I can create a script to update all at once
3. You can manually use Find & Replace

## Current Status:
- ✅ Configuration files ready
- ⏳ API calls need updating (can work both ways for now)
- ⏳ Backend needs deployment
- ⏳ Frontend needs deployment

Let me know if you want me to start updating the API calls in your files!
