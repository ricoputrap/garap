# ADR 0002: Rename `src/modules/` to `src/services/`

- **Status:** Accepted
- **Date:** 2026-05-17
- **Deciders:** Rico Putra Pradana

## Context

`src/modules/` houses domain logic (`db`, `list-refs`, `completion-sync`, `auto-clear`, `import-export`, `settings`). The name "modules" collides with the JavaScript/ES Modules concept — every file in the codebase is technically a module. The directory name describes *technical packaging*, not *intent*.

The directory's actual purpose: stateless domain service functions that wrap persistence and pure logic, consumed by hooks. Conventions considered:

1. **`modules/`** — status quo. Ambiguous with ES modules.
2. **`domain/`** — DDD vocabulary. Accurate but heavier than the project warrants.
3. **`services/`** — emphasizes stateless service functions called by hooks. Matches how the code is actually structured (function-per-operation, no classes, no state).
4. **`core/`** — neutral. Doesn't describe role.

This is a directory rename + layer-rule rewrite. Per CLAUDE.md, module-boundary changes require an ADR.

## Decision

Rename `src/modules/` → `src/services/`.

- All subdirectories keep their names (`db`, `list-refs`, `completion-sync`, `auto-clear`, `import-export`, `settings`).
- Layer rules updated: `routes → components → hooks → services → lib`.
- `hooks/` imports from `services/*` (was `modules/*`).
- `components/` may not import from `services/db` (was `modules/db`).
- Test placement rule updated: `src/services/*/__tests__/`.
- CLAUDE.md updated in the same commit.

No code yet exists under `src/modules/`, so the rename is documentation-only at this point. Future scaffolding lands directly under `src/services/`.

## Consequences

### Positive

- Name describes intent (stateless domain services), not packaging.
- Removes collision with the ES module concept — easier onboarding, clearer agent prompts.
- One-time cost: applied before any module code is written.

### Negative

- ADR-0001 retains the phrase "deep modules" in its narrative. Left as-is — historical context, the structural claim still holds under the new name.
- The word "service" can imply networked services in other ecosystems. Acceptable: this app has no backend (ADR-0001), so the term cannot be confused locally.

### Revisit Triggers

- A future ADR introduces a server component or networked service layer — at that point reconsider whether `services/` still reads cleanly, or split into `domain/` + `api/`.
