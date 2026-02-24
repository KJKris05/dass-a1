# Render Deployment Configuration

## ⚠️ CRITICAL: Correct Render Settings

When creating your Web Service on Render, use these EXACT settings:

### Basic Settings:
- **Name**: `dass-event-backend` (or any name you want)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave BLANK or enter `.` 
- **Runtime**: Node

### Build & Deploy:
- **Build Command**: `cd src/backend && npm install`
- **Start Command**: `cd src/backend && node server.js`

### Environment Variables:
```
MONGO_URI=mongodb+srv://kjkris05:exy20aaa@dass-a1.xolyh2j.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=I am a secret that shall remain as is, unknown to the world.
NODE_ENV=production
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=krisjainhzb@gmail.com
EMAIL_PASSWORD=olsypnqscsmiufwl
EMAIL_FROM_NAME=Felicity Event Management
```

## Why This Configuration Works:

1. **Root Directory is blank** - Render starts at the repository root
2. **Build command** - Changes to `src/backend` directory THEN installs dependencies
3. **Start command** - Changes to `src/backend` directory THEN runs the server

## Alternative Configuration (If Above Doesn't Work):

### Settings:
- **Root Directory**: `src/backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

This relies on the `start` script in package.json which we already added.

## To Update Existing Service:

1. Go to Render Dashboard
2. Click on your service
3. Click **Settings** (left sidebar)
4. Scroll to **Build & Deploy** section
5. Update **Build Command** to: `cd src/backend && npm install`
6. Update **Start Command** to: `cd src/backend && node server.js`
7. OR set **Root Directory** to: `src/backend` and use `npm install` and `npm start`
8. Click **Save Changes**
9. Go to **Manual Deploy** → **Deploy latest commit**

Choose ONE approach and stick with it!
