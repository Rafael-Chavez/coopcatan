# CoopCatan

## First-time setup

Open two terminals and run:

Terminal 1 — Server
```bash
cd catan-engine/server
npm install
npm run dev        # starts on :3001
```

Terminal 2 — Client
```bash
cd catan-engine/client
npm install
npm run dev        # starts on :5173
```

## Included and working right now

- **Full type system** — `types.ts` on both server and client maps 1:1 to the spec's JSON schema
- **Static board graph** — all 19 tiles, 54 vertices, 72 edges with full adjacency maps baked in as `O(1)` lookups
- **Pure state machine** — `engine.ts` handles `ROLL_DICE`, `BUILD_ROAD`, `CONSTRUCT_SETTLEMENT`, `UPGRADE_CITY`, `ALLIANCE_TRADE_TEAMMATE`, `GUILD_DEPOSIT/WITHDRAW`, and `END_TURN` with all the spec's validation rules
- **Socket.io room system** — create room → get 6-character code → others join → host starts
- **Lobby + Waiting Room UI** — fully functional, shareable room codes, mode selection
- **Debug game screen** — shows live state + Roll/End Turn buttons so you can verify the engine fires correctly before the board is rendered

## 🚀 Deployment

**🔴 GETTING 404 ERROR?** → **[VERCEL_CHECKLIST.md](./VERCEL_CHECKLIST.md)**
Set Root Directory to `catan-engine/client` in Vercel settings, then redeploy.

**Ready to deploy?** See **[QUICKSTART.md](./QUICKSTART.md)** for a 5-minute deployment guide.

For detailed troubleshooting: [VERCEL_FIX.md](./VERCEL_FIX.md) | Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

**TL;DR:**
- ✅ Build works - project is deployment-ready
- Client → Vercel (free, fast CDN)
- Server → Railway (free tier, supports WebSockets)

## Phase 2

The `client/src/components/board/` folder is empty and ready. That's where the SVG hex grid goes — each tile, vertex click target, and edge click target wired to dispatch actions.

> Want me to build that next?
