# PRD: Garap — Personal Todo List Manager

## Problem Statement

I have many concurrent responsibilities across my life: work tasks, family responsibilities as a dad, personal plans and targets, and software engineering learning/projects. Today I manage this on plain paper: I brainstorm freely, then for each category (e.g. "Project XYZ") I write out a list of tasks with checkboxes and tick them off as I complete them. Alongside these category sheets, I maintain two derived lists — "Today" (what I want to do today) and "Week" (what I want to do this week).

I want to digitize this workflow. My setup at home includes a big monitor where I want to see all my lists at once, replicating the spatial experience of paper. The current paper workflow has clear shortcomings: items get scattered, completed tasks clutter, and there is no easy way to keep "Today" and "Week" in sync with the category lists.

## Solution

A single-user, browser-based web app that mirrors the paper workflow. The screen is split 70/30: the left 70% shows a board of cards (each card is a category with a checklist of task items); the right 30% shows the global "Today" or "Week" list, switchable via tabs. Users can have multiple boards (one per area of life or major initiative), navigated via a board index page. Items added to "Today" or "Week" remain linked to their originating card — completing them anywhere updates the single underlying task. The app is fully client-side: all data lives in the browser's IndexedDB. No authentication, no API calls, no sync across devices in v1.

## User Stories

### Boards

1. As a user, I want to see a board index page when I open the app, so that I can pick which area of my life to work on.
2. As a user, I want to create a new board with a name, so that I can start tracking a new area of life.
3. As a user, I want to rename a board inline, so that I can correct or refine its name without friction.
4. As a user, I want to delete a board (with a confirmation prompt), so that I can permanently remove an area I no longer care about, knowing it will also remove its cards and items.
5. As a user, I want each board to have its own URL, so that I can bookmark a board or navigate to it directly.
6. As a user, I want to see an empty-state CTA inviting me to create my first board when I have none, so that I know how to get started.

### Cards and Items

7. As a user, I want to add a new card on a board with a title, so that I can group related task items together.
8. As a user, I want to edit a card's title inline, so that I can rename a category quickly.
9. As a user, I want to delete a card (with a confirmation prompt), so that I can permanently remove a category and its items.
10. As a user, I want to add a new task item to a card by typing and pressing Enter, so that I can capture tasks as fast as I think of them.
11. As a user, I want to edit a task item's name inline, so that I can refine wording without friction.
12. As a user, I want to delete a task item instantly with a single click (no confirmation), so that pruning is fast and cheap.
13. As a user, I want to check off a task item to mark it completed, so that I can record progress.
14. As a user, I want completed items to move to the bottom of the card with strikethrough styling, so that active items stay visually prominent while I keep a sense of progress.
15. As a user, I want a "clear completed" button on each card, so that I can wipe completed items in bulk when I want a clean slate.

### Today / Week Panel

16. As a user, I want the Today/Week panel to be visible at all times (board index and board view), so that my daily/weekly priorities are always in sight.
17. As a user, I want to switch between the Today and Week tabs, so that I can focus on the relevant horizon.
18. As a user, I want my last selected tab (Today or Week) to be remembered across sessions, so that the app respects my recent intent.
19. As a user, I want to add any task item to Today via a small icon button on the item, so that I can plan my day without drag-and-drop.
20. As a user, I want to add any task item to Week via a separate small icon button on the item, so that I can plan my week independently.
21. As a user, I want to add the same item to both Today and Week independently, so that I can express both planning horizons for the same task.
22. As a user, I want to remove an item from Today or Week (without deleting the underlying item), so that I can re-prioritize.
23. As a user, I want items in Today/Week grouped by their originating card, so that I retain category context.
24. As a user, I want each group in Today/Week to show a small badge with its board name, so that I know which life area an item belongs to when multiple boards contribute items.
25. As a user, I want checking off an item in Today/Week to also mark it completed in its card, so that I have one source of truth.
26. As a user, I want checking off an item in its card to also reflect as completed in Today/Week, so that the state is symmetric.
27. As a user, I want completed items in Today/Week to be auto-cleared at midnight local time (Today) and at Monday 00:00 local time (Week), so that my planning lists self-prune.
28. As a user, I want uncompleted items in Today/Week to remain across the boundary, so that unfinished work isn't silently lost.
29. As a user, I want a manual "clear completed" button on Today and Week, so that I can prune at any time.
30. As a user, I want the auto-clear to run even if the app was closed at the boundary moment (i.e. on next open), so that I get a clean list regardless of usage pattern.

### Layout and Navigation

31. As a user, I want the screen split 70/30 (board area / Today-Week panel) at all times, so that the layout matches my paper-on-monitor mental model.
32. As a user, I want cards laid out in a responsive grid (fixed card width ~320px, max card height 350px with internal scroll on overflow), so that I can see many cards at once on a big monitor.
33. As a user, I want a friendly "use a bigger screen" message on viewports under 768px, so that I'm not confused by a broken layout on phones.
34. As a user, I want the app to respect my system's dark-mode preference automatically, so that it's comfortable on my eyes whether I'm in light or dark surroundings.

### Data Management

35. As a user, I want to export all my data as a JSON file, so that I can back up against browser data loss.
36. As a user, I want to import a previously exported JSON file (with a confirmation that it replaces all current data), so that I can recover from data loss or informally move data to another device.

### Editing UX Details

37. As a user, when editing any inline field, I want pressing Enter to save, Esc to cancel, and clicking elsewhere (blur) to save, so that editing feels fast and predictable.

## Implementation Decisions

### Tech Stack

- React 19 + TypeScript + Vite
- TanStack Router for routing (`/` index, `/board/$boardId` for board view)
- Dexie.js wrapping IndexedDB
- `dexie-react-hooks` (`useLiveQuery`) for reactive data — **no Zustand** (Dexie hooks cover reactivity; UI state stays local or in URL)
- shadcn/ui (Tailwind + Radix primitives) for components (Dialog, Tabs, Tooltip, Button)
- Testing: Vitest + React Testing Library + Playwright (E2E)
- Deploy: Netlify (static SPA, auto-deploy on push)

### Services

Five deep services with simple, stable interfaces, all testable in isolation:

1. **`db`** — Dexie schema definition + CRUD operations with cascade delete (deleting a board cascades to its cards, items, and Today/Week refs; deleting a card cascades to its items and refs; deleting an item cascades to its refs).

2. **`list-refs`** — manages Today and Week reference stores. Operations: `addToToday(itemId)`, `removeFromToday(itemId)`, `isInToday(itemId)`, equivalents for Week. Idempotent adds; dedup on itemId.

3. **`completion-sync`** — toggling an item's `completed` state is the single source of truth. When set true, sets `completedAt` and the item should sort to the bottom of its card. When set false, clears `completedAt`. Completion is symmetric: ticking from Today/Week sets the same flag on the item; ticking from the card view reflects everywhere.

4. **`auto-clear`** — pure date-math: `shouldClearToday(lastClearedAtToday, now)` returns true if the local-midnight boundary has been crossed; `shouldClearWeek(lastClearedAtWeek, now)` returns true if the Monday-00:00 local boundary has been crossed. Cleanup op removes only completed refs from the corresponding ref store and updates `lastClearedAt`. Runtime wrapper: run on app load AND schedule a `setTimeout` until the next boundary while the app is open. Idempotent — safe to run multiple times.

5. **`import-export`** — `exportToJson()` returns a serializable snapshot of all boards, cards, items, and refs. `importFromJson(json)` validates shape, then atomically replaces the entire DB.

Plus a thin **`settings`** wrapper around localStorage for: active tab (Today/Week), `lastClearedAtToday`, `lastClearedAtWeek`. Theme follows system preference, not stored.

### Data Model

```ts
Board   { id, name, createdAt }
Card    { id, boardId, title, createdAt }
Item    { id, cardId, name, completed, completedAt, createdAt }
TodayRef { itemId, addedAt }   // separate store
WeekRef  { itemId, addedAt }
```

- No explicit `order` field in v1 (use `createdAt` for sort; completed items sort to bottom).
- Hard delete only; no soft delete, no Trash.
- Today/Week refs hold only `itemId`; the canonical `completed` flag lives on `Item`.

### Routing

- `/` — board index page (list of boards; create/rename/delete; empty-state CTA).
- `/board/$boardId` — board view (card grid).
- Today/Week panel is part of the persistent layout shell on both routes.

### UX Rules

- **No drag-and-drop anywhere** (per IDEA.md).
- Adding to Today/Week: two small icon buttons per item; click toggles membership; visual state reflects current membership.
- Inline editing everywhere (board name, card title, item name): click to edit, Enter saves, Esc cancels, blur saves.
- New item input lives at the bottom of each card; Enter submits and clears for next entry.
- Completed items move to the bottom of their card with strikethrough.
- Today/Week panel groups items by card; each group header shows a small board-name badge.
- Card max height 350px with internal scroll when overflowing.
- Cards laid out as a responsive grid with ~320px card width.

### Confirmations

- **Confirm:** delete board, delete card, import JSON (replaces all data).
- **No confirm (instant):** delete item, clear completed (per-card, Today, Week), remove from Today/Week.
- Import JSON is replace-only (no merge mode).

### Auto-Clear Behavior

- **Today:** at local midnight, remove only completed refs from the Today store. Uncompleted refs carry over.
- **Week:** at local Monday 00:00, remove only completed refs from the Week store. Uncompleted refs carry over.
- Trigger: load-check (compare `lastClearedAt*` to now) + a scheduled `setTimeout` for the next boundary while the app remains open. Idempotent.
- The underlying Item rows are never deleted by auto-clear — only the refs are.

### State Persistence

- All app data: IndexedDB via Dexie.
- UI preferences (active tab, `lastClearedAt*`): localStorage via the `settings` wrapper.
- No server, no auth, no sync.

### Out-of-Scope Affordances Deliberately Skipped

- No reorder for boards, cards, or items.
- No move-item-between-cards (workaround: delete + recreate).
- No board metadata beyond name (no color/icon/description).
- No card collapse.
- No PWA, no notifications, no calendar integration.
- No search/filter, tags, due dates, priorities, item descriptions, activity log, i18n, analytics.
- No mobile/responsive design — viewports under 768px get a "use a bigger screen" message.
- No undo / Trash / soft delete.

## Testing Decisions

A good test verifies **external behavior** of a service — its public interface — and remains stable when the implementation changes. Tests should not assert on internal state, private helpers, or component DOM structure beyond what users perceive.

### Unit / Integration Tests (Vitest + RTL)

All five deep services are tested:

1. **`db`** — cascade correctness:
   - Deleting a board removes all its cards, items, and Today/Week refs.
   - Deleting a card removes its items and refs but leaves siblings untouched.
   - Deleting an item removes its refs but leaves siblings untouched.
   - Reads return data in expected order (createdAt ascending for active, completed at bottom).

2. **`list-refs`** — dedup and lifecycle:
   - Adding the same itemId twice produces a single ref (idempotent).
   - Removing a non-existent ref is a no-op.
   - `isInToday`/`isInWeek` return correct membership.
   - Today and Week are independent stores (adding to one does not affect the other).

3. **`completion-sync`** — symmetric truth:
   - Setting `completed=true` updates the item, sets `completedAt`, and the item sorts to the bottom of its card.
   - Setting `completed=false` clears `completedAt`.
   - Toggling completion from any context (card / Today / Week) yields the same end state.

4. **`auto-clear`** — date math is bug-prone, test thoroughly:
   - `shouldClearToday` returns false within the same local day.
   - `shouldClearToday` returns true after crossing local midnight.
   - `shouldClearWeek` returns false within the same local Mon–Sun span.
   - `shouldClearWeek` returns true after crossing Monday 00:00 local.
   - Cleanup removes only completed refs (uncompleted carry over).
   - Cleanup is idempotent (calling twice has no extra effect).
   - DST and timezone boundaries handled correctly (use local time, not UTC).
   - Underlying `Item` rows are never deleted.

5. **`import-export`** — validation and atomicity:
   - `exportToJson` produces a JSON string that round-trips through `importFromJson` to an equivalent DB state.
   - `importFromJson` rejects malformed JSON.
   - `importFromJson` rejects valid JSON with wrong shape.
   - `importFromJson` replaces all existing data (no merge artifacts).

### E2E Tests (Playwright)

Smoke-level coverage of the golden paths:

- Create a board, create a card, add items, check items off.
- Add item to Today; check it in Today; verify card view shows it completed.
- Add item to Week; remove it from Week; verify item remains in card.
- Add same item to Today and Week; verify both lists show it.
- Export JSON, clear data via import of a different snapshot, verify replacement.
- Tab persistence across reload.
- Empty-state CTA visible on fresh load.

### Prior Art

None — greenfield repo. Tests will set the convention.

## Out of Scope

- Multi-device sync, cloud backend, authentication.
- Mobile and tablet support (any viewport under 768px).
- Drag-and-drop in any form.
- Reordering of boards, cards, or items.
- Moving items between cards.
- Board metadata beyond name.
- Tags, labels, due dates, priorities, item descriptions/notes.
- Search and filter.
- Notifications, calendar sync, PWA install, offline-first beyond what IndexedDB already provides.
- Undo, Trash, soft delete, activity log.
- Internationalization, usage analytics.
- Sample data, onboarding tour, demo content.

## Error Reporting (Sentry)

Sentry is the sole telemetry channel. Errors only — no usage analytics, no performance traces, no session replay.

- **Scope:** unhandled exceptions + `console.error`/`console.warn` (via `captureConsoleIntegration`).
- **Environments:** production builds only. Dev and test never initialize Sentry.
- **Plan:** Sentry Free Developer tier (5K errors/mo). Single-user app won't approach quota.
- **PII posture:** strict.
  - `sendDefaultPii: false`.
  - `tracesSampleRate: 0`, `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0`.
  - `beforeSend` hook redacts breadcrumb `message` fields (task and board names are user content and must not leave the device in clear text).
- **DSN:** injected via `VITE_SENTRY_DSN` env var on Netlify. Never committed.
- **Compliance impact:** none. No PII collected; scrubbing keeps task/board text out of events.

## Further Notes

- The app is built primarily for the author's personal use on a wide-monitor desktop. Scope decisions favor speed-to-ship and ergonomics for that single user over generality.
- IndexedDB is the only persistence layer. Browser data clearing wipes everything; the manual JSON export/import is the sole disaster-recovery mechanism.
- Auto-clear is the only "magical" behavior; everything else is explicit user action. Treat the date-math in `auto-clear` as the highest-bug-risk surface.
- shadcn/ui components are copy-pasted (not a runtime dependency); pick only the components actually used (Dialog, Tabs, Tooltip, Button at minimum).
- TanStack Router file-based routing is sufficient — no need for code-based route definitions.
- Keep dependencies minimal: React, TanStack Router, Dexie, dexie-react-hooks, Tailwind, shadcn primitives, Vitest, RTL, Playwright. No Zustand, no Redux, no date library (use `Intl` and native `Date` for the local-time boundary math; if it becomes painful, reach for `date-fns`).
