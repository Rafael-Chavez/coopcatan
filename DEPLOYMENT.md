# Deployment Guide for CoopCatan

This guide explains how to deploy your CoopCatan game to Vercel and other platforms.

## Architecture Overview

CoopCatan has two components:
1. **Client** (Vite React app) - Frontend UI
2. **Server** (Express + Socket.io) - Real-time game server

## Important Note about Socket.io on Vercel

**Socket.io does NOT work well on Vercel's serverless infrastructure** because:
- Serverless functions are stateless and short-lived
- WebSocket connections require persistent processes
- Vercel's Edge Network doesn't support long-lived connections

### Recommended Deployment Strategy

**Option 1: Hybrid Deployment (Recommended)**
- Deploy the **client** to Vercel (fast, free, excellent CDN)
- Deploy the **server** to Railway, Render, or Heroku (supports WebSockets)

**Option 2: All-in-One Platform**
- Deploy both client and server to Railway or Render

## Option 1: Hybrid Deployment

### Step 1: Deploy Server to Railway

1. Go to [Railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure the service:
   - **Root Directory**: `catan-engine/server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: Railway will auto-detect port 3001 (or use $PORT)

5. Add environment variable (if needed):
   ```
   PORT=3001
   ```

6. Deploy and copy your Railway URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Client to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Root Directory**: Leave as `.` (root)
   - **Framework Preset**: Vite
   - The `vercel.json` in the root handles the build configuration

5. Add environment variable:
   ```
   VITE_SERVER_URL=https://your-app.railway.app
   ```
   (Replace with your Railway URL from Step 1)

6. Deploy!

### Step 3: Update Server CORS (if needed)

Update `catan-engine/server/src/index.ts` to allow your Vercel domain:

```typescript
const io = new SocketServer(httpServer, {
  cors: {
    origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
    credentials: true
  },
});
```

## Option 2: Deploy Everything to Railway

1. Go to [Railway.app](https://railway.app)
2. Create **two services**:

**Service 1: Server**
- Root Directory: `catan-engine/server`
- Build: `npm install && npm run build`
- Start: `npm start`

**Service 2: Client**
- Root Directory: `catan-engine/client`
- Build: `npm install && npm run build`
- Start: `npm run preview` (or use a static server like `serve`)
- Add environment variable:
  ```
  VITE_SERVER_URL=https://[your-server-service].railway.app
  ```

## Option 3: Render.com

Similar to Railway, but using [Render.com](https://render.com):

1. Create **Web Service** for server:
   - Build Command: `cd catan-engine/server && npm install && npm run build`
   - Start Command: `cd catan-engine/server && npm start`

2. Create **Static Site** for client:
   - Build Command: `cd catan-engine/client && npm install && npm run build`
   - Publish Directory: `catan-engine/client/dist`
   - Add environment variable: `VITE_SERVER_URL=https://your-server.onrender.com`

## Local Development

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

The client will connect to `http://localhost:3001` by default.

## Environment Variables Summary

### Client (.env)
```bash
VITE_SERVER_URL=https://your-server-url.com
```

### Server
```bash
PORT=3001  # Optional, defaults to 3001
```

## Troubleshooting

### Socket.io connection fails
- Check that `VITE_SERVER_URL` is set correctly
- Verify CORS settings in server allow your client domain
- Check browser console for connection errors

### Build fails on Vercel
- Ensure `vercel.json` exists in root directory
- Check that all dependencies are in `package.json`
- Review Vercel build logs for specific errors

### Server won't start on Railway/Render
- Verify `package.json` has correct `start` script
- Check that `PORT` environment variable is respected
- Review platform logs for errors

## Production Checklist

- [ ] Server deployed to Railway/Render/Heroku
- [ ] Client deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated with production domains
- [ ] Test Socket.io connection in production
- [ ] Test game creation and joining
- [ ] Monitor server logs for errors
