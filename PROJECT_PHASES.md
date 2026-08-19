# Next-Gen Commuter & Transit Intelligence — Build Plan
**Deadline: 4:00 PM today | Start: ~1:00 PM | Budget: 3 hours (180 min)**

## Reality check on the repo
The repo (`smartAiMindAntiCongestion`) currently contains **only** `scroll/index.html` — a scroll-driven hero image sequence (a truck driving through a landscape). There is **no backend and no app/dashboard UI yet.** This plan builds both, and treats the scroll page as the *landing page* that leads into the real product.

## Core idea (what you're pitching)
An AI-powered congestion intelligence layer that:
1. Continuously scores **live congestion** on roads and transit segments (0–100 "AI-Congestion Index").
2. **Predicts** where congestion is heading in the next 15–30 minutes.
3. **Routes** commuters around it (fastest vs. eco/least-congested).
4. Uses **OpenAI** to turn raw data into human value: a commute assistant chatbot, plain-language proactive alerts, free-text incident reports auto-classified into structured data, and plain-language route explanations that nudge people toward lower-emission choices (public transit vs. private vehicle).
5. Pushes all of this live over WebSockets so the dashboard updates in real time — this is the "wow" for judges.

No real sensor feed exists in a same-day hackathon, so a **realistic simulator** stands in for GPS/camera/AVL data. Everything downstream (scoring, prediction, routing, AI, real-time delivery) is built against that same data shape, so swapping in a real feed later is a one-file change. Say this explicitly during judging — it shows architectural maturity, not a shortcut.

## Tech stack (WebStorm / Node.js friendly)
- **Backend:** Node.js + Express
- **Real-time:** Socket.IO
- **AI:** OpenAI Node SDK (`openai` npm package), model `gpt-4o-mini` (fast + cheap, good for live demo)
- **Data:** In-memory store + rolling history (no DB setup time lost)
- **Frontend:** Existing scroll hero page (`scroll/index.html`) as landing page + a new lightweight dashboard (vanilla JS or a single React file if time allows) consuming the REST/Socket API

---

## Phase 0 — Environment & Scaffolding (15 min)
**Goal:** Everything boots, OpenAI key verified, empty project structure exists.
- Create `backend/` folder: `package.json`, `.env` / `.env.example`, `src/` structure.
- Install: `express`, `socket.io`, `openai`, `cors`, `dotenv`, `nanoid`.
- One `GET /api/health` route confirming server is up and whether `OPENAI_API_KEY` is set.
- **Done when:** `npm start` runs, `/api/health` returns 200, a raw OpenAI test call succeeds in console.

## Phase 1 — City Graph & Live Data Simulator (30 min)
**Goal:** A believable, continuously-updating city transit/road network.
- Define a small graph: 8–12 nodes (junctions/stations), 15–20 edges (road/transit segments), each with base speed, capacity, mode (road/bus/metro).
- Build a simulator tick (every 3–5 sec) that perturbs each segment's live speed/occupancy realistically (rush-hour bias, randomness, gradual drift — not pure noise).
- In-memory store holding current state + rolling history (last ~30–60 min) per segment.
- **Done when:** the store updates automatically and `console.log` shows changing values every tick.

## Phase 2 — Congestion Scoring & Prediction Engine (30 min)
**Goal:** Turn raw simulator data into an explainable, judge-friendly metric.
- `computeACI(segment)` — rule-based 0–100 "AI-Congestion Index" from speed ratio, occupancy, and active incident weight. Rule-based = defensible, no training data needed, and you can explain it live.
- `predict(segmentId)` — short-horizon forecast (+15 min / +30 min) using simple trend/exponential smoothing over the rolling history.
- Keep both as pure, testable functions — decoupled from Express so the agent can unit-test them fast.
- **Done when:** every segment has a live ACI and a 2-point forecast, correct through a few manual sanity checks (e.g., forcing high occupancy → ACI rises).

## Phase 3 — Routing Engine & REST API (30 min)
**Goal:** Give commuters an actionable answer, not just a number.
- Congestion-weighted shortest path (Dijkstra) over the graph, using live ACI as edge weight.
- REST endpoints:
  - `GET /api/locations`
  - `GET /api/segments`
  - `GET /api/segments/:id/history`
  - `GET /api/segments/:id/predict`
  - `GET /api/route?from=&to=&mode=fastest|eco`
- **Done when:** hitting `/api/route` returns a real path with total ACI-weighted cost, tested with Postman/curl or WebStorm's HTTP client.

## Phase 4 — Real-Time Layer + OpenAI Intelligence Layer (30 min)
**Goal:** This is the differentiator — make it feel smart and alive.
- Socket.IO: broadcast `congestion:update` every simulator tick; `alert:new` the moment a segment crosses a "severe" threshold.
- OpenAI service module with **graceful fallback on every call** (never crash the demo if the API hiccups):
  - **Chat assistant** (`POST /api/chat`) — grounded in the *current* live snapshot (inject a compact summary into the system prompt), answers commuter questions ("is the highway bad right now?", "should I take the bus?").
  - **Incident classifier** (`POST /api/incidents`) — free-text citizen report → structured JSON `{type, severity, segmentId}` via OpenAI structured output, which then boosts that segment's live ACI.
  - **Alert narration** — turns a raw threshold breach into a short, readable alert sentence.
  - **Route summary** — explains a computed route in plain language, and where relevant, nudges toward the lower-emission option (public transit vs. private vehicle) — ties straight back to the "pollution" half of the theme.
- **Done when:** a manual incident report visibly raises congestion on that segment, an alert fires and is narrated, and the chat assistant gives a live-data-grounded answer.

## Phase 5 — Dashboard & Frontend Integration (30 min)
**Goal:** Something judges can look at and interact with, plus the existing hero page wired in.
- Keep `scroll/index.html` as the landing page.
- Build one dashboard view (single HTML/JS page is fine) that:
  - Connects via `socket.io-client`, shows live segment list/simple map with ACI color-coding.
  - Has a route planner (from/to dropdown → calls `/api/route`, shows path + AI summary).
  - Has a chat widget hitting `/api/chat`.
  - Has an incident report box hitting `/api/incidents`.
- Add a CTA/link from the scroll hero page into the dashboard.
- **Done when:** you can open the landing page, click through to the dashboard, and watch live numbers change with zero manual refresh.

## Phase 6 — Polish, Test & Demo Prep (15 min)
**Goal:** Nothing breaks on stage.
- Full smoke test: boot fresh, watch a full tick cycle, submit an incident, ask the chatbot, request a route.
- Seed 1–2 dramatic incidents just before judging so the demo has visible "before/after."
- Write a short `README.md`: what it does, why the architecture is built this way, how to run it, what you'd add with more time (real sensor feed, trained prediction model, persistence).
- Prepare a 60–90 second verbal pitch tied to the theme: congestion reduction (routing), pollution reduction (mode-shift nudges), and daily commuter pain (proactive alerts + assistant).
- **Done when:** you could unplug wifi mid-demo and the fallback responses would still keep the app looking alive.

---

## If you're running behind
Cut in this order, latest-value-first: (1) drop the eco-route nuance, keep fastest-route only, (2) drop the alert narration, keep raw alerts, (3) drop the dashboard map styling, keep a plain list, (4) never cut the chat assistant or incident classifier — those are your OpenAI-usage proof points for judging.
