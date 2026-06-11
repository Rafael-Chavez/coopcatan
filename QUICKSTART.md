# Quick Start - Deploy to Production

## ✅ Status: Ready to Deploy!

Your project is now configured and builds successfully. Follow these steps to deploy:

---

## 🚀 Deploy in 5 Minutes

### Step 1: Deploy Server (Railway)

1. Go to **[Railway.app](https://railway.app)** → Sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `coopcatan` repository
4. Configure:
   - **Root Directory**: `catan-engine/server`
   - Railway auto-detects Node.js and runs `npm start`
5. **Copy your Railway URL** (e.g., `https://coopcatan-server-production.up.railway.app`)

### Step 2: Deploy Client (Vercel)

1. Go to **[Vercel.com](https://vercel.com)** → Sign up with GitHub
2. Click **"Add New"** → **"Project"**
3. Import `coopcatan` repository
4. Vercel auto-detects the configuration from `vercel.json`
5. **Add Environment Variable**:
   ```
   VITE_SERVER_URL=https://your-railway-url.railway.app
   ```
   ⚠️ Replace with your actual Railway URL from Step 1
6. Click **"Deploy"**

### Step 3: Update CORS (Important!)

After deploying to Vercel, update your server CORS settings:

1. Open `catan-engine/server/src/index.ts`
2. Update line 62-64 to include your Vercel domain:

```typescript
const io = new SocketServer(httpServer, {
  cors: {
    origin: [
      'https://your-app.vercel.app',  // Add your Vercel URL
      'http://localhost:5173'
    ],
    credentials: true
  },
});
```

3. Push the change to GitHub
4. Railway will auto-redeploy

---

## 🧪 Test Your Deployment

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Check browser console - should see "Connected" status
3. Click "Join Room" and "Start Game"
4. Open in another tab to test multiplayer

---

## 🛠️ Local Development

Still works as before:

```bash
# Terminal 1 - Server
cd catan-engine/server
npm install
npm run dev

# Terminal 2 - Client
cd catan-engine/client
npm install
npm run dev
```

Visit: http://localhost:5173

---

## 📋 Environment Variables Reference

### Client (`.env.local` for local, Vercel for production)
```bash
VITE_SERVER_URL=https://your-server-url.com
```

### Server (optional)
```bash
PORT=3001  # Railway auto-provides this
```

---

## 🐛 Troubleshooting

### "Cannot connect to server"
- Check `VITE_SERVER_URL` is set in Vercel environment variables
- Verify Railway server is running (check Railway logs)
- Check CORS settings include your Vercel domain

### "Build failed"
- Make sure you're using Node.js 18+ (check Railway settings)
- Check build logs in Railway/Vercel dashboard

### "WebSocket connection failed"
- Ensure server is on Railway/Render (NOT Vercel serverless)
- Check browser console for CORS errors

---

## 🎯 What's Configured

✅ Client builds successfully with Vite
✅ Environment variables set up (`.env.local` for local dev)
✅ Vercel configuration (`vercel.json`) ready
✅ Server ready for Railway deployment
✅ Socket.io configured for real-time connections

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Alternative platforms (Render, Heroku)
- Advanced configuration
- Production best practices
- Detailed troubleshooting
