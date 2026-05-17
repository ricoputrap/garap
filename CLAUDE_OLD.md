# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (lockfile present, `onlyBuiltDependencies: [sharp]`).

- `pnpm dev` — Vite dev server.
- `pnpm build` — `tsc -b && vite build` (typecheck then bundle).
- `pnpm lint` — ESLint over the repo (flat config in `eslint.config.js`).
- `pnpm test` — Vitest run-once (jsdom env, setup at `src/test/setup.ts`).
- `pnpm test:watch` — Vitest watch.
- Run single test: `pnpm vitest run src/store.test.ts` (or `-t "name"` to filter).
- `pnpm generate-pwa-assets` — regenerate PWA icons from `pwa-assets.config.ts`.

Vitest config lives **inside `vite.config.ts`** (single `defineConfig` from `vitest/config`), not a separate file.

## Architecture

Single-page React 19 + TypeScript + Vite PWA. **All state is client-side**; persistence is `localStorage`. No backend.

### State model (`src/store.ts`)

Single Zustand store, `useStore`. Two domain entities in `src/types.ts`:

- `Card` — column on the board (`id`, `title`, `color?`, `order`).
- `Task` — belongs to a card (`cardId`, `text`, `completed`, `todayFlag`, `weekFlag`, `order`).

Every mutating action calls `after()` → `persist(get)` which writes `cards` and `tasks` arrays to `localStorage` via `src/lib/storage.ts`. Read this pattern before adding new actions — forgetting `after()` silently breaks persistence.

`order` is a per-list integer reindexed on reorder; `reorderTasks` / `reorderCards` / `moveTaskBetweenCards` rewrite the `order` field, they don't rely on array position alone.

### Daily/weekly flag reset (`src/lib/flagReset.ts`, `src/lib/date.ts`)

On store init (`initialLoad`), `runFlagReset` compares stored `KEY_TODAY_RESET` / `KEY_WEEK_RESET` against `todayKey(now)` / `weekKey(now)`. If the key changed, the corresponding flag (`todayFlag` / `weekFlag`) on every task is cleared and the new key is written. This is the only mechanism that clears these flags automatically — UI just toggles them.

### Drag-and-drop (`src/components/Board.tsx`)

Uses `@dnd-kit/core` + `@dnd-kit/sortable`. Two draggable types coexist in one `DndContext`:
- `type: 'card'` — sorted via `SortableContext` with `rectSortingStrategy`. Disabled while a task is being dragged (`activeType === 'task'`).
- `type: 'task'` — drop targets are either `type: 'card-drop'` (empty card / end-of-list) or `type: 'task'` (another task, with `cardId` in data). `onDragEnd` branches on these `data.current.type` values to decide between `reorderTasks` (same card) and `moveTaskBetweenCards` (cross-card).

When extending DnD, preserve the `data.current` shape — Board reads `type` and `cardId` off `active`/`over`.

### UI layout (`src/App.tsx`)

Responsive split. Desktop (`md:`) shows `Board` + `SidePanel` side-by-side. Mobile shows one of three tabs (`board` / `today` / `week`) driven by `currentTab` in the store, with `BottomNavbar` for navigation and `TaskListView` rendering filtered task lists. Tailwind v4 via `@tailwindcss/vite`.

### PWA

`vite-plugin-pwa` configured in `vite.config.ts` with `registerType: 'prompt'`. `src/components/PWAPrompts.tsx` exposes `UpdatePrompt` and `InstallButton`. Workbox config is empty (defaults).

### Tests

Co-located `*.test.ts(x)` next to source (e.g. `src/store.test.ts`, `src/lib/flagReset.test.ts`, `src/App.test.tsx`). `@testing-library/react` + jest-dom matchers loaded in `src/test/setup.ts`.

## Conventions

- IDs: `src/lib/id.ts` `uid()` — use this, not ad-hoc randoms.
- Storage keys: only via the exported `KEY_*` constants in `src/lib/storage.ts`.
- TypeScript project refs: `tsconfig.app.json` (app) + `tsconfig.node.json` (config files). `tsc -b` builds both.
