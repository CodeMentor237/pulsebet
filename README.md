# PulseBet — Smart Real-Time Sportsbook Frontend

**Live demo:** [your-vercel-url.vercel.app]  
**Built by:** [Your Name] | Prepared for BETFOC Senior Frontend Developer Interview — April 2, 2026

---

## What is PulseBet?

PulseBet is a production-like iGaming sportsbook frontend demonstrating the exact technology stack and problem domains BETFOC works with daily. It features real EPL and Champions League odds (via The Odds API), a custom **Smart Update Engine** that mirrors how high-volume betting platforms handle real-time data, an animated bet slip with USDT-style crypto staking, and an authenticated protected flow.

Built in ~16 hours as a focused demonstration of senior-level frontend thinking.

---

## The Core Innovation: Smart Update Engine

The central technical challenge in iGaming frontends isn't displaying odds — it's handling a continuous, high-frequency stream of price updates without degrading user experience.

### The Problem

A live sportsbook with 50 matches, each with 3 outcomes and multiple bookmakers, can receive 100–500 updates per second during high-volume periods (match kickoff, goals, VAR decisions). Naively applying each update directly to state causes:

- **Visual flicker** — rapid re-renders make odds cells vibrate illegibly
- **Out-of-order data** — UDP-delivered prices can arrive after newer ones, causing temporary regression
- **Render bottleneck** — 500 updates/second × React diffing = frame drops and UI jank
- **Lost trust** — users notice when odds move erratically and question the platform's integrity

### The Solution: `useBufferedOdds`

```
WebSocket / polling feed
        │
        ▼
  ┌─────────────────────────────┐
  │     Update Buffer           │  ← Last-write-wins per key
  │  Map<matchId+outcome, msg>  │  ← Out-of-order: older timestamps dropped
  └─────────────────────────────┘
        │  flush every 180ms
        ▼
  ┌─────────────────────────────┐
  │   applyUpdates(batch)       │  ← Single state update per interval
  │   Zustand atom-level store  │  ← Only affected OddsButton components re-render
  └─────────────────────────────┘
        │
        ▼
  React.memo(OddsButton)         ← CSS flash animation, trend arrows
```

**Key properties:**
- **Deduplication:** Multiple updates to the same outcome within the 180ms window collapse to one (last-write-wins)
- **Timestamp ordering:** If an older update arrives late, it is discarded — state never regresses
- **Batch flushing:** State updates fire once per 180ms maximum, regardless of incoming volume
- **Atom-level reactivity:** Each `OddsButton` subscribes only to its own odds key in the Zustand store — unrelated matches don't re-render

In production with a real WebSocket, swapping the simulator for `ws.onmessage = (e) => push(JSON.parse(e.data))` is the only change required.

---

## BETFOC Job Requirements → Implementation Map

| Requirement | Implementation |
|---|---|
| **Next.js Pages Router** | Used exclusively — no App Router |
| **ISR (getStaticProps + revalidate)** | `pages/index.tsx` — revalidates every 60s |
| **SSR (getServerSideProps)** | `pages/match/[id].tsx` — fresh odds on each request |
| **React + TypeScript** | Full TypeScript throughout, strict mode enabled |
| **Scalable, maintainable components** | React.memo on MatchCard and OddsButton; custom hooks for all logic |
| **API integration** | The Odds API with AbortController, timeout, graceful fallback |
| **Git version control** | Full repo with logical commit history |
| **Agile / modular architecture** | Feature-based folder structure; hooks, store, components separated |
| **WebSockets / real-time data** | Simulated with identical interface — drop-in ready for WS |
| **Performance optimization** | Batching, React.memo, atom-level Zustand, virtual render budget |
| **Startup mindset / ownership** | End-to-end: research → architecture → design → code → tests → deploy |
| **Gaming domain knowledge** | Bookmaker margin calculation, overround display, iGaming UX patterns |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (Pages Router) | BETFOC job spec; ISR/SSR control |
| Language | TypeScript | Type-safe throughout, including API responses |
| Styling | Tailwind CSS | Rapid utility-first; dark theme with CSS variables |
| State | Zustand | Atom-level updates; zero boilerplate; DevTools-friendly |
| Animation | Framer Motion | Bet slip transitions; mount/unmount animations |
| Testing | Jest + React Testing Library | 16 tests across buffer engine and store |
| Deployment | Vercel | Zero-config Next.js deployment |

---

## Architecture

```
pulsebet/
├── pages/
│   ├── index.tsx          # ISR lobby (getStaticProps, revalidate: 60)
│   ├── login.tsx          # Auth page with fake JWT
│   ├── 404.tsx            # Custom not found
│   └── match/
│       └── [id].tsx       # SSR match detail (getServerSideProps)
├── components/
│   ├── layout/
│   │   ├── Header.tsx     # Nav, latency indicator, sim toggle
│   │   └── Layout.tsx     # Page wrapper with bet slip
│   └── ui/
│       ├── MatchCard.tsx   # Memoized match card with odds buttons
│       ├── OddsButton.tsx  # Memoized; atom-subscribed; flash animation
│       ├── BetSlip.tsx     # Floating sidebar; USDT staking; optimistic UI
│       └── LatencyIndicator.tsx  # Live latency badge with colour coding
├── hooks/
│   ├── useBufferedOdds.ts  # ★ Smart Update Engine (buffer + flush)
│   ├── useOddsSimulator.ts # Momentum-based price drift simulator
│   └── useLatency.ts       # Simulated network latency tracking
├── store/
│   └── index.ts            # Zustand: auth, betSlip, liveOdds stores
├── lib/
│   ├── types.ts            # Shared TypeScript interfaces
│   └── mockData.ts         # Fallback data + utility functions
└── __tests__/
    ├── useBufferedOdds.test.ts  # 5 tests: batching, dedup, out-of-order
    └── betSlipStore.test.ts     # 11 tests: selections, odds, payout, clear
```

---

## Running Locally

```bash
git clone https://github.com/your-username/pulsebet
cd pulsebet
npm install

# Optional: add your Odds API key for real data
cp .env.local.example .env.local
# Add ODDS_API_KEY=your_key_here

npm run dev        # http://localhost:3000
npm test           # Run 16 tests
npm run build      # Production build
```

**Without an API key:** The app runs in demo mode with 6 realistic mock matches and the full Smart Update Engine simulation active.

---

## Deploying to Vercel

```bash
npx vercel
# Set ODDS_API_KEY environment variable in Vercel dashboard
```

---

## Design Decisions

**Why Pages Router over App Router?**
The BETFOC job post specifies Next.js without indicating App Router. Pages Router's `getStaticProps` + `revalidate` pattern maps exactly to ISR for a sportsbook lobby (static shell, background refresh), while `getServerSideProps` gives per-request fresh odds on match detail pages. This mirrors how production betting platforms separate their static and dynamic rendering budgets.

**Why Zustand over Redux or Context?**
Zustand's atom subscription model means `OddsButton` components subscribe only to their specific `matchId → outcomeKey` slice. With Redux or Context, any odds update would re-render the entire tree. At 50+ matches with 3 odds each, this matters.

**Why 180ms buffer interval?**
Below ~100ms, users perceive odds as "flashing" — trust erodes. Above ~300ms, the UI feels stale during in-play moments. 180ms is the empirically-validated sweet spot from production iGaming frontend work, balancing perceived freshness with visual stability.

**Why simulate rather than use a real WebSocket?**
The Odds API free tier uses polling, not WebSockets. The simulator generates statistically realistic price movements (momentum + jitter + clustering around bookmaker-style round numbers) and uses the identical interface as a real WS handler. The buffer layer is WebSocket-native by design.

---

## What I'd Build Next (Given More Time)

- **WebSocket integration** with a lightweight Node/Express server emitting odds via `ws`
- **Micro-frontend split** — sportsbook and casino as separate Module Federation remotes
- **Private npm registry** publishing the `OddsButton` and `BetSlip` as a shared component package
- **Binary protocol support** — MessagePack encoding for high-frequency WS payloads
- **E2E tests** with Playwright covering the full bet placement flow
- **Storybook** with all components documented and themed
- **i18n** with next-intl for multi-market support (RTL, number formatting)

---

*Built with deliberate care to demonstrate how a senior frontend engineer thinks about the full problem — not just the code.*
