# Vercel Deployment Checklist

## ❌ Currently Getting 404 Error

This means your Vercel settings are incorrect. Follow this checklist:

---

## ✅ Fix Checklist

### 1. Check Root Directory Setting

**Where**: Vercel Dashboard → Your Project → Settings → General

**What it should be**: `catan-engine/client`

**What it probably is now**: `.` (root) ← This is the problem!

**How to fix**:
1. Go to https://vercel.com/dashboard
2. Click your project name
3. Click "Settings" tab
4. Scroll to "Root Directory"
5. Click "Edit"
6. Change to: `catan-engine/client`
7. Click "Save"

---

### 2. Verify Build Settings

While you're in Settings, verify these:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite (or Other) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

### 3. Add Environment Variable

**Where**: Settings → Environment Variables

**What to add**:
- **Name**: `VITE_SERVER_URL`
- **Value**: `https://your-railway-server.railway.app`
- **Environments**: Production, Preview, Development (select all)

⚠️ Replace with your actual Railway URL (or use `http://localhost:3001` for now)

---

### 4. Redeploy

After saving settings:

1. Click "Deployments" tab
2. Find the latest deployment
3. Click the "..." menu
4. Click "Redeploy"
5. Wait for build to complete (should take 1-2 minutes)

---

### 5. Verify Deployment

After redeployment:

1. Visit your Vercel URL
2. ✅ You should see the CoopCatan game interface
3. ✅ No more 404 error
4. ⚠️ You might see "Disconnected" status (normal - server not deployed yet)

---

## 🐛 Still Getting 404?

### Double-check Root Directory

1. Go to Settings → General
2. Look at "Root Directory" - does it say `catan-engine/client`?
3. If not, edit it again
4. Make sure there are NO extra spaces or slashes

### Check Build Logs

1. Go to Deployments
2. Click on the latest deployment
3. Click "View Build Logs"
4. Look for errors mentioning:
   - "Cannot find package.json"
   - "No such file or directory"

If you see these, your Root Directory is still wrong.

### Try These Values

If `catan-engine/client` doesn't work, try:
- `./catan-engine/client` (with dot-slash)
- Check for typos: `catan-engine/client` (no 's' on engine)

---

## 📸 Visual Guide

Your Vercel settings should look like this:

```
┌─────────────────────────────────────┐
│ Root Directory                      │
│ ┌─────────────────────────────────┐ │
│ │ catan-engine/client             │ │
│ └─────────────────────────────────┘ │
│                              [Edit] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Build & Development Settings       │
│                                     │
│ Framework Preset:  Vite             │
│ Build Command:     npm run build    │
│ Output Directory:  dist             │
│ Install Command:   npm install      │
└─────────────────────────────────────┘
```

---

## 🎯 Quick Test

Once deployed, open browser console on your Vercel URL:

```
✅ Good: You see the app UI
✅ Good: Console shows "Connected: false" or Socket.io messages
❌ Bad: 404 page
❌ Bad: Blank screen with no console errors
```

---

## Need More Help?

See:
- [VERCEL_FIX.md](./VERCEL_FIX.md) - Detailed troubleshooting
- [QUICKSTART.md](./QUICKSTART.md) - Full deployment guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Alternative platforms

The Root Directory setting is the #1 issue - make sure it's set correctly! 🎯
