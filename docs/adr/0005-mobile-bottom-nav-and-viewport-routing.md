# ADR 0005: Mobile Bottom Nav and Viewport-Scoped Routing

- **Status:** Accepted
- **Date:** 2026-05-18
- **Deciders:** Rico Putra Pradana

## Context

Garap was desktop-only. The shell renders a 70/30 split — main column on the left, persistent Today/Week panel on the right — and viewports `<768px` are blocked outright by a `TooSmallScreen` placeholder.

The user wants to use Garap on a phone. On a narrow viewport, two side-by-side panels do not fit; the screen should show one thing at a time, and a bottom navigation should switch between Board, Today, and Week.

Constraints:

- Existing routing is TanStack Router file-based (`/`, `/board/$boardId`, `/history`).
- Reactivity model unchanged (`useLiveQuery`, no global UI state store).
- Layer rules unchanged: `routes → components → hooks → services → lib`.
- Local-first / IndexedDB persistence (ADR-0001).
- No SSR — Vite SPA — so client-side viewport branching is acceptable.

## Decision

### Breakpoint

- `<768px` (mobile): single-pane layout, bottom navigation.
- `≥768px` (tablet + desktop): existing two-pane split (main + persistent Today/Week aside).

The Tailwind `md:` breakpoint (`768px`) is the single switching point. The `lg:` breakpoint previously gating the split is moved down to `md:` so tablet portrait gets the split too.

`TooSmallScreen` and `useViewportTooSmall` are deleted. No viewport is blocked.

### Bottom navigation as routes (not state)

Three bottom-nav targets are **real routes**, not local state:

- Board section: `/` (index) and `/board/$boardId` both highlight the Board tab.
- Today: new `/today` route.
- Week: new `/week` route.

Rationale: matches existing routing model, gives deep links, makes browser back predictable, avoids a new state machine.

### Board tab is a section with stack memory

The Board tab is a section covering two existing routes:

- From a non-board route, tapping Board returns to the last visited board route (`/board/$id` if the user had opened a board; otherwise `/`). Last board id is held in `sessionStorage` under `garap:last-board-route`.
- Tapping the Board tab **while already on a board route** resets to `/` (iOS-style "tap active tab pops to root").

### Viewport-scoped routes

`/today` and `/week` are mobile-only. On `≥768px` they redirect to `/`, where the user already sees Today/Week in the right-hand aside. Implemented via a `useEffect` + `matchMedia` listener in each route component so the redirect also fires on resize from `<768` to `≥768`.

The bottom navigation itself is hidden on `≥768px` via CSS (`md:hidden`), so the only way a desktop user reaches `/today` or `/week` is a deep link — that one path is what the redirect protects.

### Shell: single AppShell, CSS-only responsive

`AppShell` stays one file. No JS branching, no `useViewportIs*` hook for layout.

- Top bar: always rendered, compact on mobile (`px-4 py-3`, subtitle hidden) and original on `md:`.
- Aside (right panel): `hidden md:block`.
- Bottom nav: `md:hidden`.
- Main: `pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-10` so the fixed bottom nav does not cover content.

### Component extraction

`TodayWeekPanel` is split:

- `panel/today-list.tsx` and `panel/week-list.tsx` — bare grouped-by-card list bodies, plus a small "Clear done" header per list.
- `panel/today-week-panel.tsx` — desktop composition: header + Tabs + the two lists.

Both `/today` and `/week` mobile routes render the bare list components directly. No tab chrome on those routes (the bottom nav is the section switcher).

### Testing

- New Playwright project `mobile` (device: `iPhone 14`).
- New spec `e2e/mobile-nav.spec.ts` covering: bottom nav visible `<768`, tap each tab, board section preserves last board, tap-active-tab resets, redirect on resize.

## Consequences

### Positive

- Garap is usable on a phone.
- One source of truth for layout switching: `md:` in Tailwind. No matchMedia inside the shell.
- Routes-based navigation: deep links, browser back, refresh-stable.
- Mobile-only routes are protected from accidental desktop access by a single redirect rule.

### Negative

- `/today` and `/week` exist but are unreachable from the desktop UI — discoverable only via the bottom nav on mobile. A future contributor may not realise they are viewport-scoped without reading this ADR.
- Two ways to reach Today/Week now — aside on desktop, route on mobile — both backed by the same hooks. Cost is the small extraction (`today-list.tsx`, `week-list.tsx`).
- `sessionStorage` for last-board-route is per-tab. Acceptable for navigation hint state; not durable across tabs/closes.

### Revisit Triggers

- If the desktop layout ever gains a "panel collapsed" mode, the redirect rule on `/today` and `/week` may want to relax — at that point those routes become legitimate desktop URLs.
- If a non-trivial number of routes go mobile-only, factor the matchMedia redirect into a shared `redirectIfDesktop()` route guard instead of duplicating in each route component.
- If multi-tab last-board hint becomes important, move from `sessionStorage` to a Dexie-backed setting in `services/settings`.
