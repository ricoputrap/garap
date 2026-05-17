# ADR 0001: Client-Only, Local-First Architecture

- **Status:** Accepted
- **Date:** 2026-05-17
- **Deciders:** Rico Putra Pradana

## Context

Garap is a single-user personal task manager. The author runs it on a wide-monitor desktop at home. Requirements (see `docs/PRD.md`) explicitly exclude multi-device sync, authentication, mobile support, and any server-side component. All data is personal task content the user has no interest in exposing to third parties.

Three architectures were considered:

1. **Flat Client SPA** — React + Dexie + IndexedDB, no backend.
2. **Client SPA + Optional Cloud Sync (CRDT)** — local-first with pluggable sync adapter.
3. **PWA + File System Access API** — JSON on disk as source of truth, IndexedDB as cache.

## Decision

Adopt **Option 1: Flat Client SPA**.

- Stack: React 19 + TypeScript + Vite, TanStack Router, Dexie.js wrapping IndexedDB, `dexie-react-hooks` for reactive reads, shadcn/ui primitives.
- No backend, no auth, no sync.
- Persistence: IndexedDB for domain data; localStorage for UI prefs and auto-clear timestamps.
- Disaster recovery: manual JSON export/import only.
- Deployment: Netlify static SPA, auto-deploy on push.
- Error reporting: Sentry (production only), strict PII scrubbing, no traces/replays.

Business logic is organized into deep modules (`db`, `list-refs`, `completion-sync`, `auto-clear`, `import-export`, `settings`) behind narrow interfaces. UI components stay dumb; logic does not leak into React.

## Consequences

### Positive

- Ship fast. Solo dev, days not weeks.
- Zero infra cost, zero auth surface.
- Offline by default.
- Privacy by construction — task content never leaves the device (Sentry breadcrumbs scrubbed).
- Module boundaries leave a clear path to swap `modules/db` later for a sync-capable impl without touching UI.

### Negative

- Browser data wipe = total loss unless user exported recently.
- No cross-device access. Acceptable per PRD scope.
- `auto-clear` date math is the highest-bug-risk surface with no server safety net — mitigated by exhaustive pure-function tests.

### Revisit Triggers

- Browser data loss bites in practice.
- A second device becomes a real need.
- Author wants to share boards with another person.

At that point, replace `modules/db` with either a File System Access persister (Option 3) or a CRDT sync adapter (Option 2). UI layer should require no changes.
