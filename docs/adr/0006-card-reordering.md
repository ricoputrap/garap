# ADR 0006: Card Reordering (Board + Panel)

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** Rico Putra Pradana

## Context

ADR-0004 introduced drag-and-drop ordering for **items** in three contexts (card, Today panel, Week panel). Cards themselves remained sorted by `createdAt`. There is no way to express priority between cards.

The user wants drag-and-drop reordering of **cards** in two contexts:

1. Inside a board (the card grid).
2. Inside the Today panel and inside the Week panel — the card-groups that group panel items by their parent card.

Cross-board card drag, and dragging individual items between groups in the panel, are explicitly **out of scope**.

Constraints:

- Local-first / IndexedDB (ADR-0001).
- Reactive UI via `useLiveQuery` (`dexie-react-hooks`).
- Layering rules unchanged: `routes → components → hooks → services → lib`.
- Touch-capable (the app ships a mobile bottom-nav layout — ADR-0005).
- Must round-trip through import/export (additive, optional fields).

## Decision

### Per-context order

Three new locations for "card position," each independent:

- `Card.order: number` — position of the card inside its board.
- `todayCardOrders` store — `{ cardId, order }` — position of the card-group inside the Today panel.
- `weekCardOrders` store — `{ cardId, order }` — position of the card-group inside the Week panel.

Reordering a card on the board does not move its group in Today, and vice versa. Same model as ADR-0004 for items: per-context order matches the user's mental model — Today is a plan view, not an edit of the source board.

### Encoding & math

Reuses the existing sparse-float helper (`src/lib/ordering.ts`): `orderBetween`, `appendAfter`, `needsRebalance`, `rebalanced`. One write per drop in the common case; lazy renumber when neighbour gap drops below `1e-4`.

### Schema migration (Dexie v4)

```
cards:            'id, boardId, createdAt, order'
todayCardOrders:  'cardId, order'
weekCardOrders:   'cardId, order'
```

Upgrade backfills:

- `Card.order` ← rank in `createdAt` ASC within each `boardId`, scaled by `1000`.
- `todayCardOrders` ← for each card that has at least one `todayRefs` entry, rank by first-appearance in `todayRefs.order` ASC, scaled by `1000`. Same for `weekCardOrders`.

### Group-order lifecycle

A card's panel-order row exists exactly when the card has ≥1 ref in that panel.

- **Add ref** (`addToToday` / `addToWeek`): if the card has no entry, append at end (`max + 1000`). Done inside the same transaction as the ref insert.
- **Remove ref** (`removeFromToday`, `removeFromWeek`, `clearCompletedToday`, `clearCompletedWeek`, `deleteItem`, `deleteCard`, `snapshotAndClearToday`, `snapshotAndClearWeek`): after the delete, prune any `*CardOrders` row whose card has zero remaining refs in that panel. Done in the same transaction.

A single helper (`pruneEmptyTodayCardOrders` / `pruneEmptyWeekCardOrders`) runs after every ref removal.

### Sort rules

- **Board (`listCards`):** sort by `order` ASC. Newly created card appends (`max + 1000`).
- **Today / Week panel (`loadTodayPanel` / `loadWeekPanel`):** group items by card; group order driven by `todayCardOrders` / `weekCardOrders` (asc). A card without an explicit entry (transient — only between insert and prune) falls back to end of list, ordered by ref `addedAt` for stability.

### Service layout

- `services/db/cards.ts` adds `reorderCard(cardId, beforeId, afterId)`; `createCard` appends.
- `services/list-refs/today.ts` and `…/week.ts` add `reorderTodayCardGroup(cardId, beforeId, afterId)` / `reorderWeekCardGroup(...)`, plus a `pruneEmptyXCardOrders` helper called from every remove path.
- `services/history/snapshot.ts` calls the prune helper at the end of its transaction.
- `services/db/cards.ts#deleteCard` already cascades refs; it now also drops both card-order entries.

### UI

Reuses `@dnd-kit/core` + `@dnd-kit/sortable` (already a dep per ADR-0004).

- **Board grid:** `BoardGrid` wraps `BoardCard`s in `<DndContext><SortableContext strategy={rectSortingStrategy}>`. Each `BoardCard` gets a dedicated grip-icon handle in the header — clicks elsewhere (rename, item input, menu) are not draggable.
- **Panel:** `PanelList` wraps the card-group sections in its own `<DndContext><SortableContext strategy={verticalListSortingStrategy}>`. The group `<header>` gets a grip-icon handle to its left.
- Sensors: `PointerSensor` (4px distance) + `TouchSensor` (200ms delay, 5px tolerance) + `KeyboardSensor` — full parity with the item-row DnD setup.

### Import/export

Schema versions 1, 2, 3 still accepted. `Card.order` is **optional** in the zod schema; missing values are backfilled per the same per-board rank logic as the Dexie migration. Panel card-order tables are derived state — they are **not** exported. On import they are reconstructed by the prune/append logic as refs are re-inserted, or rebuilt by the migration upgrade hook if a legacy export is imported into a fresh DB.

## Consequences

### Positive

- Users can express priority on the board and within each panel independently.
- Per-context model is symmetric with ADR-0004 — same mental model, same primitive (`ordering.ts`).
- Card-group order is decoupled from item-ref order, so reordering a group does not perturb item positions inside it.
- Sparse-float math means a drag = one row write in the common case.
- Lifecycle rule ("entry exists iff card has refs in panel") keeps the new tables self-cleaning and import-safe.

### Negative

- Two new tables, each a Dexie store + new TS type + new index. Schema surface grows.
- Every ref-removal path now also runs the prune helper. New invariant to maintain — easy to forget. Mitigated by colocating the prune call inside each service function and by service-level tests.
- `loadJoined` (panel query) now joins one more table. Tiny perf cost on a single-user local DB; not material.

### Revisit Triggers

- If cross-board card drag is wanted: `reorderCard` already takes neighbour ids; the boardId reassignment + ref-revalidation would be a separate, additive change.
- If multi-user sync ever lands, the sparse-float weakness flagged in ADR-0004 applies here too — switch to a CRDT-friendly fractional-index string at that point.
- If users want a single "card order" shared between board and panels, collapse to `Card.order` and delete the panel tables.
