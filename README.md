# PulseBet — Smart Real-Time Sportsbook Frontend

**Live demo:** [https://pulsebet-l92q.vercel.app/]  
**Built by:** [Engr. Kiawi Muhna-ah] | Prepared for BETFOC — Updated April 2, 2026

---

## What is PulseBet?

PulseBet is a production-like iGaming sportsbook frontend demonstrating the hardware-accelerated rendering and high-frequency state management required for global betting platforms. It features real EPL and Champions League odds, an **Atomic Batch Update Engine** that eliminates UI jank on low-end devices, and a **High-Performance Mobile Suite** designed for 2012-era hardware compatibility.

Built in ~18 hours as a focused demonstration of architectural thinking and performance-first engineering.

---

## The Core Innovation: Atomic Batch Update Engine

The central technical challenge in iGaming frontends isn't displaying odds — it's handling a continuous, high-frequency stream of price and match state updates without saturated the main thread.

### The Problem: Notification Storms

A live sportsbook with 50+ matches can receive 100+ updates per second. Naively applying each update directly to state causes:

- **Notification Storms** — 100 `set()` calls per second triggers 100 React re-render cycles, blocking the main thread and killing scroll performance.
- **Visual Flicker** — Rapid, uncoordinated updates make UI cells "vibrate" illegibly.
- **Render Bottleneck** — Mobile GPUs struggle with expensive effects like `backdrop-filter` during high-frequency compositing.

### The Solution: Multi-Layer Performance Architecture

```
Incoming Stream (Sim / WS)
        │
        ▼
  ┌─────────────────────────────┐
  │   1. Buffered Odds (500ms)  │  ← useBufferedOdds: Deduplicates & Reorders
  └─────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────┐
  │   2. Atomic Batch Layer     │  ← batchUpdateMatchStates: Single state set()
  │   Zustand store             │  ← Reduces re-render notifications by ~95%
  └─────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────┐
  │   3. Granular Reactivity    │  ← useDeferredValue + Granular Selectors
  │   React rendering engine    │  ← Prioritizes scroll frames over data updates
  └─────────────────────────────┘
        │
        ▼
  MatchCard (memoized)           ← Hardware-accelerated CSS; 0-overhead animations
```

**Key Improvements:**
- **Atomic Batching:** All 20+ match updates are applied in a single Zustand `set()` call per tick.
- **Deduplication:** Multiple updates to the same outcome within a 500ms window are collapsed.
- **Atom-level Reactivity:** Each `OddsButton` subscribes only to its specific slice; unrelated matches never re-render.
- **Scroll Prioritization:** Using `useDeferredValue` ensures the UI remains interactive even during heavy data bursts.

---

## High-Performance Mobile Suite

To ensure a seamless user experience on older hardware (Android 2012+), I implemented a systematic "progressive performance" strategy:

### GPU Layer Promotion
Using `will-change: transform` and `translateZ(0)` on all `MatchCard` and `OddsButton` elements promotes high-frequency components to their own compositor layers. This offloads rendering to the GPU and protects the scroll frame from paint-induced jank.

### Intelligent Compositing
Most iGaming frontends fail on mobile due to `backdrop-filter: blur()`. PulseBet intelligently disables expensive blurs and SVG noise filters on mobile browsers (detected via `@media(hover:hover)`), reverting to high-contrast semi-transparent backgrounds to save millions of GPU cycles.

### Zero-Overhead Animations
Removed Framer Motion from high-frequency components. Odds trend flashes and event badges now use declarative CSS keyframes, which have zero main-thread JS execution cost during runtime.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 | ISR/SSR control and fast TTI |
| State | Zustand | Atom-level updates; Batching; Minimal boilerplate |
| Styling | Tailwind + Vanilla CSS | GPU layer promotion via declarative CSS |
| Language | TypeScript | Full type safety across the simulation and stores |
| Animation | CSS + Framer Motion | CSS for high-frequency (odds); Framer for low-frequency (modals) |
| Testing | Jest + RTL | 17 tests covering buffer engine and bet slip logic |

---

## Architecture

```
pulsebet/
├── pages/
│   ├── index.tsx          # ISR lobby with useDeferredValue
│   ├── login.tsx          # Auth flow
│   └── match/[id].tsx     # SSR detail with getServerSideProps
├── components/
│   ├── layout/
│   │   ├── Header.tsx     # Throttled latency (5s) to save re-renders
│   │   └── Layout.tsx     # GPU-promoted main container
│   └── ui/
│       ├── MatchCard.tsx   # Granularly reactive; CSS-only animations
│       ├── OddsButton.tsx  # Layer-promoted; atom-subscribed
│       ├── BetSlip.tsx     # Optimistic UI; USDT staking
│       └── HeroStats.tsx   # Memoized stats dashboard
├── hooks/
│   ├── useBufferedOdds.ts  # Throttled buffer (500ms)
│   ├── useOddsSimulator.ts # Batched, throttled (2s tick) simulation
│   └── useLatency.ts       # Performance-aware metric tracking
├── store/
│   └── index.ts            # Zustand: includes batchUpdateMatchStates
```

---

## Design Decisions

**Why `batchUpdateMatchStates`?**
Individual `set()` calls in Zustand notify all subscribers. When updating 20 matches per tick, this forces React to run its reconciliation 20 times. Batching collapses this into a single notification, freeing up the CPU for scroll events.

**Why disable `backdrop-filter` on mobile?**
On Mali or Adreno GPUs (common in older Androids), `backdrop-filter` forces a "copy-back" operation on the framebuffer for every frame. With 20+ cards in the scroll list, this is a hardware-level bottleneck that no amount of React optimization can fix.

**Why `useDeferredValue`?**
It allows React to prioritize "Urgent" updates (scrolling, clicking) over "Non-Urgent" updates (updating the list of results). If a massive burst of odds comes in while the user is scrolling, React will pause the data update to keep the scroll at 60FPS.

---

*Built with deliberate care to demonstrate how a senior frontend engineer solves for scale and performance — not just for the demo, but for the end user.*
