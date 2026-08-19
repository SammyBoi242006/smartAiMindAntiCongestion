# Agent Instructions — Next-Gen Commuter & Transit Intelligence

Paste this whole file to your OpenAI coding agent inside WebStorm as its operating brief. It should follow it phase by phase, in order, without skipping ahead. Each phase has a **Definition of Done** — do not start the next phase until it's met.

---

## 0. Role & Ground Rules

You are acting as the lead backend engineer for a same-day hackathon project called **Next-Gen Commuter & Transit Intelligence**. The theme: reduce traffic and pollution and fix real daily-commuter pain points across public and private transport.

Non-negotiable constraints:
- **Language/runtime:** Node.js + Express. This project is being built and run from WebStorm.
- **AI provider:** OpenAI Node SDK only (`openai` npm package). No other paid third-party APIs — the deadline doesn't allow for extra API-key setup or rate-limit surprises.
- **Data:** In-memory store only. No database setup — there isn't time, and it isn't needed for a live demo.
- **Every OpenAI call must have a fallback.** If `OPENAI_API_KEY` is missing or a call fails/times out, the endpoint must still return a valid, clearly-labeled response (e.g. `source: "fallback-rule-based"`) instead of throwing. **The demo must never hard-crash because of the AI layer.**
- **Work incrementally and commit after every phase.** If time runs out, whatever is committed must still run and demo cleanly on its own.
- **Existing repo reality:** `https://github.com/SammyBoi242006/smartAiMindAntiCongestion.git` currently contains only `scroll/index.html`, a scroll-driven hero animation with no backend and no app UI. Treat it as the landing page only — build the real product alongside it, don't overwrite it.

Work through the phases below **in order**. After finishing each phase, print a short status: what was built, what file(s) changed, and confirm the Definition of Done before moving on.

---

## Phase 0 — Environment & Scaffolding (15 min)

1. Create `backend/` at the repo root with:
   ```
   backend/
     package.json
     .env.example
     .env            (gitignored)
     src/
       server.js
       config/
       services/
       routes/
       store/
       sockets/
   ```
2. `npm init -y`, then install: `express cors dotenv socket.io openai nanoid`, plus `nodemon` as a dev dependency.
3. `.env.example` should list `OPENAI_API_KEY=` and `PORT=4000`. Load via `dotenv`.
4. In `src/server.js`, stand up Express + an HTTP server (needed for Socket.IO later) + `GET /api/health` returning `{ status: "ok", openaiConfigured: boolean }`.
5. Add `npm start` (`node src/server.js`) and `npm run dev` (`nodemon src/server.js`) scripts.

**Definition of Done:** `npm run dev` boots without errors; `curl http://localhost:4000/api/health` returns 200 with the correct `openaiConfigured` flag based on whether `.env` has a key.

---

## Phase 1 — City Graph & Live Data Simulator (30 min)

1. In `src/config/`, define a small static graph: 8–12 nodes (junctions/stations, each with `id`, `name`, `lat`, `lng`) and 15–20 edges (segments, each with `id`, `fromId`, `toId`, `mode: "road"|"bus"|"metro"`, `baseSpeedKph`, `capacity`).
2. In `src/services/simulator.js`, write a tick function (`setInterval`, every 3–5s) that, for each segment, updates a live `speedKph` and `occupancyRatio` with realistic drift (not pure random noise — bias toward rush-hour-like waves, small random jitter on top).
3. In `src/store/dataStore.js`, hold: current segment state, and a rolling history array per segment (cap it, e.g. last 200 ticks) for later prediction.
4. Wire the simulator to update the store on every tick.

**Definition of Done:** Running the server and logging the store shows segment values changing every tick; history arrays are growing and capped correctly.

---

## Phase 2 — Congestion Scoring & Prediction Engine (30 min)

1. In `src/services/scoring.js`, write a pure function `computeACI(segment)` → integer 0–100. Base it on: how far live speed is below `baseSpeedKph` (bigger gap = higher score), `occupancyRatio`, and a weighted bump for any active incident on that segment (incidents come in Phase 4). Keep the formula simple and explainable — you need to be able to describe it out loud to judges in one sentence.
2. In `src/services/predictor.js`, write `predictSegment(segmentId)` → `{ plus15: number, plus30: number }` using a simple trend method (linear regression or exponential smoothing) over the segment's rolling history. No ML training pipeline — this must run instantly, in-process.
3. Have the store (or a scoring pass triggered right after each simulator tick) attach a live `aci` value to every segment.

**Definition of Done:** Every segment has a current `aci` (0–100) after each tick; `predictSegment()` returns sane numbers that move in the same general direction as recent history. Manually spike a segment's occupancy and confirm ACI rises.

---

## Phase 3 — Routing Engine & REST API (30 min)

1. In `src/services/routing.js`, implement Dijkstra's algorithm over the graph, using **live ACI** (not raw distance) as edge weight, so the "shortest path" is really the least-congested/fastest realistic path. Support a `mode` param: `fastest` (raw traversal cost) vs `eco` (extra weight penalty on private-road segments vs. bus/metro segments, to reward public transit).
2. In `src/routes/`, implement:
   - `GET /api/locations` — all nodes
   - `GET /api/segments` — all segments with live `aci`
   - `GET /api/segments/:id/history` — recent readings
   - `GET /api/segments/:id/predict` — output of `predictSegment`
   - `GET /api/route?from=<nodeId>&to=<nodeId>&mode=fastest|eco` — computed path, segment list, total cost
3. Mount all routes under `/api` in `server.js`.

**Definition of Done:** `/api/route?from=A&to=B` (using real node IDs from your graph) returns a valid path and cost for both `mode` values, verified via WebStorm's HTTP client or curl.

---

## Phase 4 — Real-Time Layer + OpenAI Intelligence Layer (30 min)

1. In `src/sockets/`, wire Socket.IO: emit `congestion:update` (full live snapshot) after every simulator tick; emit `alert:new` the moment any segment's ACI crosses a "severe" threshold (e.g. ≥80), with de-duplication so it doesn't spam every tick while a segment stays severe.
2. In `src/services/openaiService.js`, create one module wrapping all OpenAI calls, model `gpt-4o-mini`, **every function wrapped in try/catch with a rule-based fallback return value**:
   - `chatAssistant(userMessage, liveSnapshotSummary)` — system prompt includes a compact live-data summary so answers are grounded, not generic.
   - `classifyIncident(freeText)` — ask for **structured JSON output** (`{ type, severity: "low"|"medium"|"high", segmentHint }`); on success, feed it into the store to boost that segment's ACI.
   - `narrateAlert(rawAlert)` — turn a threshold breach into one short human-readable sentence.
   - `summarizeRoute(routeResult)` — plain-language explanation of the computed route; when `mode=eco` or a bus/metro segment is involved, explicitly mention the lower-emission choice.
3. Add routes: `POST /api/chat { message }`, `POST /api/incidents { text }`, `GET /api/incidents`, `GET /api/alerts`.

**Definition of Done:** Submitting an incident visibly raises that segment's ACI; a severe segment fires and narrates an alert; the chat endpoint gives an answer that reflects current live data, not a generic canned reply. Pull the API key out of `.env` temporarily and confirm every endpoint still returns a valid fallback instead of a 500 error.

---

## Phase 5 — Dashboard & Frontend Integration (30 min)

1. Do not touch/overwrite `scroll/index.html`. Add a new `dashboard/` (or `backend/public/`) with a single-page app (plain HTML/JS + `socket.io-client` is fine — no build step, no time for one) that:
   - Connects to the socket, renders the live segment list with color-coded ACI (green/amber/red).
   - Has a route planner: two dropdowns (from/to) + mode toggle, calls `/api/route`, displays the path and the AI-generated summary.
   - Has a chat widget calling `/api/chat`.
   - Has an incident-report text box calling `/api/incidents`.
2. Add a link/button on the scroll hero page (`scroll/index.html`) pointing to the dashboard, so the two pages are connected in one flow for the demo.

**Definition of Done:** Opening the landing page → clicking through to the dashboard → watching segment values update live with zero manual refresh, end to end.

---

## Phase 6 — Polish, Test & Demo Prep (15 min)

1. Run a full smoke test from a cold boot: server starts → simulator ticks → submit an incident → ask the chatbot a question → request a route both modes → confirm an alert fires and is narrated.
2. Seed 1–2 deliberately severe incidents just before presenting, so there's a visible "before/after" for judges.
3. Write `backend/README.md`: what it does, why it's built around a simulator (swap-in-ready for a real feed — name the exact file to swap), how to run it (`npm install`, `.env`, `npm run dev`), and a short "what we'd add with more time" list (real sensor feed, trained prediction model, persistence layer).
4. Confirm graceful degradation one more time: app must still look alive and demoable with no internet/OpenAI access.

**Definition of Done:** Cold-boot-to-full-demo works without manual intervention beyond `npm run dev`, and the app survives the API key being removed.

---

## Reporting format after each phase

```
### Phase N complete
- Files added/changed: ...
- What it does: ...
- Verified: ...
- Definition of Done met: yes/no (+ why if no)
```

If a phase can't be finished in its time budget, say so explicitly, ship the minimum working version, and move on — do not silently overrun into the next phase's time slot. Time remaining and priority order to cut from is listed in `PROJECT_PHASES.md` under "If you're running behind."
