# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoFlow is an AI-powered algorithm visualizer. Users write Python or JavaScript code in a Monaco Editor; the backend sends it to Google Gemini AI which returns a node/edge graph that React Flow renders as an interactive flowchart. A Mem0-backed chatbot provides a persistent AI tutor.

Live: https://algo-flow-roan.vercel.app — Frontend on Vercel, backend on Render.

---

## Repository Structure

This is a **two-app monorepo** — the frontend and backend are entirely separate Node projects with no shared packages:

```
AlgoFlow/
├── algo-client/   # React 19 + Vite SPA (deployed to Vercel)
└── server/        # Express 5 API (deployed to Render)
```

---

## Commands

All commands must be run from the appropriate subdirectory.

### Backend (`server/`)

```bash
cd server
npm install
npm start          # node index.js — runs on http://localhost:4000
```

Requires `server/.env`:
```
PORT=4000
MEM0_API_KEY=...
COOKIE_SECRET=any-long-random-string
CLIENT_URL=http://localhost:5173   # set to Vercel URL in production
NODE_ENV=development               # set to production on Render
```

`GEMINI_API_KEY` is no longer used — users supply their own key via the BYOK flow.

### Frontend (`algo-client/`)

```bash
cd algo-client
npm install
npm run dev        # Vite dev server on http://localhost:5173 (auto-opens browser)
npm run build      # Production build → dist/
npm run preview    # Serve the production build locally
npm run lint       # ESLint
```

Optionally create `algo-client/.env`:
```
VITE_API_URL=http://localhost:4000
```

There is **no test suite** in either package.

---

## Architecture

### Data Flow

```
User types code → Monaco Editor (PurpleHazeEditor)
  → POST /api/generate (server/routes/generate.js)
    → Gemini AI returns { nodes, edges, meta } JSON
      → CodeFlowChartViewer renders with React Flow
```

```
User sends message → DraggableSideChat
  → POST /api/chat (server/routes/chat.js)
    → Mem0 searches past memories by userId
      → Gemini generates contextual reply
        → Mem0 stores the new interaction
```

### Backend (`server/`) — CommonJS modules

- `index.js` — Express app entry; mounts routes, CORS, JSON middleware
- `config/index.js` — Single config object from `process.env`; Gemini model is hardcoded to `"gemini-2.5-flash-lite"` here
- `services/ai.js` — Initializes `GoogleGenerativeAI` and `MemoryClient`; both imported by routes
- `routes/generate.js` — Forces `responseMimeType: "application/json"` on Gemini so the response is directly parseable
- `routes/chat.js` — Retrieves top-3 Mem0 memories + last 3 conversation messages to keep context compact
- `prompts/flowchart.js` — Strict schema prompt: node types are `input` (start only), `output` (return/print), `decision` (if/loop), `default` (everything else)
- `prompts/chat.js` — System prompt for the AI tutor persona

### Frontend (`algo-client/`) — ES modules

**Pages:**
- `/` → `LandingPage` — marketing page with GSAP/Framer Motion animations
- `/learn-space` → `LearnSpace` — the main workspace (no auth guard currently; ProtectedRoute exists but is unused in App.jsx after auth was removed for the hackathon)

**Key Components:**
- `PurpleHazeEditor` — Monaco Editor with custom "purple-haze" dark theme. Persists code to `localStorage('algoflow_code')`. Loads Pyodide from CDN (`cdn.jsdelivr.net/pyodide/v0.24.1`) for in-browser Python execution with interactive `input()` support. Polls `GET /api/health` on mount with retry logic (up to 12 attempts) because the Render free tier cold-starts in ~30s.
- `CodeFlowChartViewer` — Renders the flowchart using the **v11 `reactflow` package** (not `@xyflow/react` v12, even though both are in package.json). Reads code from `localStorage` via `setInterval(500ms)` to show a floating code panel. Uses BFS to calculate node positions, branching decision nodes left/right.
- `DraggableSideChat` — Resizable side panel; sends `userId` from `localStorage('algoflow_user_id')` for Mem0 memory scoping.
- `ProtectedRoute` — Checks `localStorage('algoflow_user_id')`; currently unused in routing.

**localStorage keys used by the app:**
- `algoflow_code` — persists editor code across sessions
- `algoflow_flowchart_data` — caches last generated flowchart
- `algoflow_last_visualized_code` — tracks which code the cached flowchart was generated from
- `algoflow_user_id` — used as Mem0 `userId`; also the auth sentinel for ProtectedRoute

**sessionStorage keys:**
- `algoflow_output` — Pyodide run output; cleared on page close

### Flowchart JSON Schema

The Gemini prompt enforces this exact shape. When modifying flowchart logic, both the prompt (`server/prompts/flowchart.js`) and the renderer (`CodeFlowChartViewer`) must agree on node types:

```json
{
  "nodes": [{ "id": "1", "type": "input|output|decision|default", "data": { "label": "..." } }],
  "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "True|False|''" }],
  "meta": { "timeComplexity": "O(n)", "spaceComplexity": "O(1)", "explanation": "..." }
}
```

### Deployment Notes

- **Vercel** serves `algo-client/`; `vercel.json` rewrites all routes to `index.html` for SPA routing.
- **Render free tier** spins down after 15 min of inactivity — the health-check polling in `PurpleHazeEditor` handles this with exponential backoff.
- CORS in `server/index.js` uses `origin: config.clientUrl` with `credentials: true` for the HttpOnly cookie. In production set `CLIENT_URL` to the Vercel domain on Render.
- The backend uses CommonJS (`require`/`module.exports`). Do not use `import`/`export` in `server/`.

### BYOK Key Flow

Users bring their own Gemini API key. The key is encrypted (`AES-256-GCM`) and stored as an HttpOnly cookie; it never touches the client as plain text after submission.

- `POST /api/key` — validates key via `countTokens` (free call), encrypts it, sets cookie
- `GET /api/key/status` — returns `{ valid: true/false }` without exposing the key
- `DELETE /api/key` — clears the cookie
- `server/middleware/keyAuth.js` — `requireKey` middleware decrypts the cookie and attaches `req.geminiKey`; all AI routes use this middleware
- `server/services/ai.js` — `createGenAI(apiKey)` is a factory (not a singleton) so each request uses the user's own key
- Cookie options: `httpOnly: true`, `secure` + `sameSite: 'none'` in production (required for cross-origin Vercel→Render), `sameSite: 'lax'` in dev
- All frontend `fetch` calls to the backend include `credentials: 'include'`
- 429 errors are differentiated: `rate_limit` (RPM exceeded, retry in seconds) vs `quota_exceeded` (billing limit hit)
