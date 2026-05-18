# ADR 0004: Drag-and-Drop Task Ordering

- **Status:** Accepted
- **Date:** 2026-05-18
- **Deciders:** Rico Putra Pradana

## Context

Until now, task items inside a card rendered in `createdAt` order (active first, completed last by `completedAt`). The Today/Week panel rendered groups by card, ordered by ref `addedAt`. The user has no way to express priority within a list other than re-creating tasks in a different order.

The user wants drag-and-drop reordering of task items in three contexts:

1. Inside a card on a board.
2. Inside a card-group inside the Today panel.
3. Inside a card-group inside the Week panel.

Cross-card drag is explicitly **out of scope**.

Constraints:

- Local-first / IndexedDB persistence (ADR-0001).
- Reactive UI via `useLiveQuery`.
- Layering rules unchanged: `routes → components → hooks → services → lib`.
- Desktop-only app (≥768px viewport); no touch sensor needed.
- Must survive completion toggling (a stray checkbox tap should not lose arrangement).
- Must round-trip through import/export (ADR-0001 disaster recovery).

## Decision

### Per-context order

Three independent order fields, one per context:

- `Item.order: number` — position of the item inside its card.
- `TodayRef.order: number` — position inside the Today panel's card-group.
- `WeekRef.order: number` — position inside the Week panel's card-group.

Reordering inside the Today panel does **not** mutate the card view, and vice versa. The same item can have three different positions in three different contexts. Matches user intent: dragging in Today reshuffles "today's plan," not the card itself.

### Encoding: sparse float

Order values are floats inserted at the midpoint of their neighbours, with a leading gap of `1000`. Insert math:

```
midpoint(prev, next) = (prev + next) / 2
appendAfter(last)    = last + 1000
prependBefore(first) = first - 1000
```

One write per drop. No renumbering of siblings in the common case.

### Lazy rebalance

When two neighbours' gap collapses below `1e-4`, the affected sibling set (one card or one panel card-group) is renumbered to `1000, 2000, 3000…` in the same transaction as the write. Threshold-triggered, scoped, rare.

### Schema migration (Dexie v3)

```
items:      'id, cardId, completed, createdAt, completedAt, order'
todayRefs:  'itemId, addedAt, order'
weekRefs:   'itemId, addedAt, order'
```

Upgrade backfills `order` on every existing row:

- `Item.order` ← rank in `createdAt` ASC within each `cardId`, scaled by `1000`.
- `TodayRef.order` / `WeekRef.order` ← rank in `addedAt` ASC within each `cardId` group, scaled by `1000`.

Backfill grouped by card so positions are valid for the per-card-group sortable contexts.

### Sort rules

- **Card view (`listItemsForCard`):** active items sorted by `order` ASC; completed items appended, sorted by `completedAt` ASC. Drag scope is the active sub-list only.
- **Today/Week panel (`loadTodayPanel` / `loadWeekPanel`):** items grouped by card; within each group, active sorted by ref `order` ASC, completed sorted by `completedAt` ASC. Drag scope is the active sub-list of each group.

`order` is **sticky** across completion toggling — checking and unchecking an item returns it to its prior active-zone slot, no write needed.

### New items

Appended to the active tail: `order = max(siblings.order) + 1000`, or `1000` if empty.

### Service layout

- **Pure helper:** `src/lib/ordering.ts` exposes `midpoint`, `appendAfter`, `prependBefore`, `needsRebalance`, `rebalanced`. Fully unit-tested.
- **DB writes:**
  - `reorderItem(itemId, beforeId, afterId)` in `services/db/items.ts`.
  - `reorderTodayRef(itemId, beforeId, afterId)` in `services/list-refs/today.ts`.
  - `reorderWeekRef(itemId, beforeId, afterId)` in `services/list-refs/week.ts`.

Each computes the new `order` via the pure helper, checks the rebalance threshold, and writes inside a single Dexie transaction.

### UI

- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` added as dependencies. Industry-standard React DnD library, accessible (keyboard sensor), tree-shakeable, actively maintained.
- Each card's active item list is wrapped in `<DndContext><SortableContext>`. Same for each `PanelGroup`.
- Each draggable row exposes a dedicated grip-icon handle (hover-revealed on desktop). `useSortable` attaches listeners to the handle only — clicks on the row body (inline-edit, checkbox, side icons) are not consumed by the drag system.
- Completed rows are not sortable; their grip handle is hidden.

### Import/export

Schema versions 1 and 2 are still accepted. The `order` field on `Item`, `TodayRef`, and `WeekRef` is **optional** in the zod schema. On import, if missing, it is backfilled with the same per-card / per-card-group rank logic as the Dexie migration. New exports include `order`. Export `version` stays at `2` because the shape is additive and backward-compatible; bumping it would force-reject older clients reading newer files, which is the opposite of what we want.

## Consequences

### Positive

- Users can express priority directly.
- Per-context order matches user mental model — Today is a plan view, not a re-edit of the source card.
- Sparse-float math means a drag = one row write, not N.
- Pure ordering helper is trivially unit-testable; DB ops are thin.
- Sticky `order` across completion means tap-correction does not lose arrangement.

### Negative

- Three places store position information that all encode "where does this item show up." Future changes must keep them in sync conceptually. Mitigated by per-context isolation: nothing reads `Item.order` while rendering Today.
- Float precision degrades with deep midpoint chains. Mitigated by lazy rebalance + tests.
- New library dependency (`@dnd-kit/*`). Acceptable: small bundle, well-maintained, no realistic alternative for accessible React sortable lists.
- E2E coverage of drag is more brittle than direct API tests. Mitigated by also unit-testing each `reorderX` service.

### Revisit Triggers

- If cross-card drag is ever wanted, the per-context model still works — drop handler computes the new container's neighbour ids and writes accordingly.
- If multi-user sync ever lands, sparse floats are a known weak primitive under concurrent edits — switch to a CRDT-friendly fractional-index string (e.g. `fractional-indexing` / LexoRank) at that point.
- If rebalance ever fires frequently in real usage, drop float for fractional-index strings.
