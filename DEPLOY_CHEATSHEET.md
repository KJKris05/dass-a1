# 🚀 Quick Deployment Cheat Sheet

## ✅ What's Done
- Configuration files created
- Deployment guides written
- CORS updated in backend
- Changes pushed to GitHub

## 🎯 Your Next Steps (In Order)

### 1️⃣ Deploy Backend (10 min)
```
🌐 Go to: https://render.com
👤 Sign up with GitHub
➕ New + → Web Service → Connect dass-a1 repo

⚙️ Settings:
   Root Directory: src/backend
   Build: npm install
   Start: node server.js

🔑 Environment Variables:
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_32char_secret
   NODE_ENV=production

🚀 Deploy → Copy backend URL
```

### 2️⃣ Deploy Frontend (5 min)
```
🌐 Go to: https://vercel.com
👤 Sign up with GitHub
➕ Import dass-a1 repo

⚙️ Settings:
   Root Directory: src/frontend ⚠️ IMPORTANT!
   Framework: Create React App

🔑 Environment Variable:
   REACT_APP_API_URL=https://your-backend.onrender.com

🚀 Deploy → Copy frontend URL
```

### 3️⃣ Update CORS (2 min)
```
Go back to Render dashboard
→ Environment tab
→ Add: FRONTEND_URL=https://your-frontend.vercel.app
→ Auto-redeploys
```

### 4️⃣ Test (5 min)
```
Visit your Vercel URL
Test: Register → Login → Create Event → Register for Event
```

## 📋 URLs to Submit
- Frontend: `https://__________.vercel.app`
- Backend: `https://__________.onrender.com`

## 📚 Detailed Guides Available
- `VERCEL_DEPLOY.md` - Step-by-step with screenshots descriptions
- `DEPLOYMENT_GUIDE.md` - Complete guide with all platforms
- `QUICK_DEPLOY.md` - Alternative approaches

## 🆘 Common Issues

**Backend won't start?**
→ Check MONGO_URI is correct in Render environment variables
→ Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

**Frontend can't connect to backend?**
→ Wait 60 seconds (Render free tier wakes up slowly)
→ Check REACT_APP_API_URL is set in Vercel
→ Check FRONTEND_URL is set in Render

**API calls still use localhost?**
→ Make sure REACT_APP_API_URL environment variable is set in Vercel
→ Redeploy frontend after adding environment variable

## ⏱️ Total Time: ~20 minutes
## ☕ Difficulty: Easy

Good luck! Follow VERCEL_DEPLOY.md for detailed steps.
