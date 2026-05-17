# ADR 0003: Task Completion History for Today & Week Lists

- **Status:** Accepted
- **Date:** 2026-05-17
- **Deciders:** Rico Putra Pradana

## Context

The Today and Week lists auto-clear completed items at daily/weekly boundaries (see `src/services/auto-clear/`). Once cleared, completion data is gone — the user has no way to look back at "what did I finish yesterday / last week."

The user wants a persistent record of what was completed, reviewable after the fact. Constraints:

- Must survive deletion of the underlying `Item`, `Card`, or `Board` (a history entry must remain readable even if the user later deletes the card it came from).
- Must not duplicate when the boundary cleaner runs more than once for the same period.
- Must be exportable/importable along with the rest of the user's data (ADR-0001 disaster recovery posture).
- Must not break the existing layering rules (`routes → components → hooks → services → lib`).

Alternatives considered for the snapshot model:

1. **One row per cleared item, flat table.** Easy query, but UI must group by date at read time. No natural idempotency key.
2. **One row per boundary event with denormalized item array.** Natural unit ("what I finished on 2026-05-16"), idempotent via date PK.
3. **Reference-only snapshot (store `itemId` list, resolve at read time).** Smallest payload, but history breaks the moment the user deletes a card or board — exactly the cases where the user would most want the record preserved.

## Decision

Add a **task completion history** feature.

### New service: `src/services/history/`

Stateless service that writes a snapshot of completed items right before they are removed from a Today/Week list. The snapshot lives in IndexedDB and is reactive via `useLiveQuery`.

### Schema (Dexie `version(2)`)

Two new stores, mirroring the existing Today/Week split (ADR-0001 layering, parallel to `todayRefs`/`weekRefs`):

```
todayHistory: 'date, clearedAt'        // date = 'YYYY-MM-DD' (local), PK
weekHistory:  'weekStart, clearedAt'   // weekStart = 'YYYY-MM-DD' Monday, PK
```

Row shape (denormalized — Q3):

```ts
interface HistoryItem {
  itemId: ID
  name: string
  cardId: ID
  cardTitle: string
  boardId: ID
  boardName: string
  completedAt: number
}

interface TodayHistory { date: string;     clearedAt: number; items: HistoryItem[] }
interface WeekHistory  { weekStart: string; clearedAt: number; items: HistoryItem[] }
```

`version(2)` only adds the two new stores. Existing stores are unchanged and need no migration.

### Write path

`runCleanup` in `services/auto-clear/cleanup.ts` orchestrates atomically:

1. `clearCompletedToday` / `clearCompletedWeek` now return `{ count, items: HistoryItem[] }` — bulk-fetching unique `cardId`s and `boardId`s in one pass to build the denormalized payload.
2. `services/history/snapshot.ts` writes the history row before refs are deleted.
3. All within a single `db.transaction('rw', [refs, items, cards, boards, history], ...)` — atomic across the read of names, the write of history, and the delete of refs.

Rules:

- **Skip empty boundaries.** No row is written when `items.length === 0` (Q7).
- **Skip on duplicate PK.** If a row for the same `date`/`weekStart` already exists, the new write is a no-op (Q6). The boundary scheduler already prevents double-firing via `settings.lastClearedToday`; this guard exists for belt-and-suspenders correctness.
- **No auto-prune.** History grows unbounded (Q11). Trivially small (< 1 KB/event, ~365 today rows/year). Revisit when real storage pressure shows up.
- **No cascade delete.** Deleting an `Item`/`Card`/`Board` does **not** touch history — the denormalized snapshot is the whole point.

### Read path

- `hooks/use-today-history.ts` and `hooks/use-week-history.ts` — `useLiveQuery` returning reverse-chronological history rows.
- New route `/history` with Today/Week sub-tabs, collapsible per period (Q14, Q15).
- Read-only — no edit, delete, or restore actions in this iteration (Q16).
- Top-bar entry point.

### Import/export

`services/import-export/` schema bumped to include `todayHistory` and `weekHistory` arrays. Roundtrip-tested. (Q12)

## Consequences

### Positive

- "What did I finish?" question becomes answerable from inside the app.
- History survives item/card/board deletion (denormalization).
- Atomic write — never a state where refs were deleted but history was not recorded.
- Idempotent by construction — re-running the boundary cleaner cannot create duplicates.
- Read path costs the user nothing while not on the history page (`useLiveQuery` only mounts on the route).

### Negative

- Two more Dexie stores to migrate if persistence ever moves to a different backend (revisit triggers in ADR-0001 still apply).
- Denormalized board/card names go stale if the user renames after a snapshot. Acceptable — history is a frozen log of what the names were at the moment of completion.
- `clearCompletedToday`/`clearCompletedWeek` signature changed from `Promise<number>` to `Promise<{ count: number; items: HistoryItem[] }>`. Existing callers (`runCleanup`) updated. Existing tests updated.
- `services/auto-clear` now depends on `services/history` and on the new shape from `services/list-refs`. Direction stays one-way (services → services within the layer).

### Revisit Triggers

- Storage pressure ever observed in practice → add configurable retention.
- Users (plural) ever exist and request restore/delete on history entries → revisit Q16.
- Calendar/heatmap visualization is requested → add as a second view alongside the chronological list.
