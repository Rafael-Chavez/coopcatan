# Fix Vercel 404 Error

Getting a **404: NOT_FOUND** error on Vercel? This happens because Vercel is trying to deploy from the wrong directory.

## 🔧 The Fix

### If You Haven't Deployed Yet:

When setting up your project on Vercel:

1. After importing your repository, **BEFORE clicking Deploy**
2. Look for **"Root Directory"** setting
3. Click **"Edit"** next to Root Directory
4. Change from `.` to `catan-engine/client`
5. Click **"Continue"** then **"Deploy"**

### If You Already Deployed (Getting 404):

1. Go to your Vercel dashboard
2. Open your project
3. Click **"Settings"**
4. Scroll to **"General"** section
5. Find **"Root Directory"**
6. Click **"Edit"**
7. Change to: `catan-engine/client`
8. Click **"Save"**
9. Go to **"Deployments"** tab
10. Click the **"..."** menu on the latest deployment
11. Click **"Redeploy"**

## Why This Happens

Your project structure is:
```
coopcatan/
├── catan-engine/
│   ├── client/        ← This is what we want to deploy
│   │   ├── src/
│   │   ├── package.json
│   │   └── dist/
│   └── server/        ← NOT this (goes to Railway)
├── vercel.json
└── README.md
```

Vercel needs to know to look inside `catan-engine/client/` instead of the root directory.

## Verify It Worked

After redeploying:
1. Visit your Vercel URL
2. You should see the CoopCatan game interface
3. Check browser console - should say "Connected: false" (normal until server is deployed)

## Still Getting 404?

Check these:

1. **Root Directory is set correctly**: `catan-engine/client` (not `catan-engine` or `/client`)
2. **Build Command**: Should be `npm run build` or leave as default
3. **Output Directory**: Should be `dist` or leave as default
4. **Framework**: Should detect as "Vite" automatically

## Environment Variables

Don't forget to add in Vercel → Settings → Environment Variables:
```
VITE_SERVER_URL=https://your-server.railway.app
```

Replace with your actual Railway server URL.

## Alternative: Deploy Client Separately

If you keep having issues, you can:

1. Create a new repo with JUST the `catan-engine/client` folder
2. Deploy that repo to Vercel (no root directory config needed)

But the Root Directory method above should work! 🎯
