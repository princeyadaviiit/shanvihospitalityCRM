# Working Rules
## Travel CRM Platform — Build Agent Guidelines

**Document version:** 1.0
**Applies to:** any agent (human or AI) building this system, phase by phase
**Companion documents:** phases.md, security.md, auth.md, TRD.md

These are the operating rules for how this project gets built. They apply on top of the phase plan in `phases.md`, not instead of it.

---

## 1. Source of Truth Hierarchy

When documents disagree, resolve the conflict in this order, most authoritative first:

1. `security.md` and `auth.md` — security and access control are never relaxed to make another document's requirement easier to satisfy.
2. `phases.md` — what to build, and in what order, this session.
3. `TRD.md` and `architecture.md` — how to build it, technically.
4. `PRD.md` — what the feature is supposed to do for the user.
5. `rules.md` (this document) — how to work while building it.

If two documents seem to genuinely conflict (not just under-specify), do not silently pick one — log it in `memory.md` under Decisions Log, note the interpretation taken, and continue. Do not stall waiting for clarification unless the ambiguity blocks all forward progress.

---

## 2. Working Phase by Phase

- Work strictly in the order defined in `phases.md`. Do not start work on a later phase's features because they seem easy or related, even if the current phase is nearly done.
- A phase is not "done" until its acceptance criteria are met and its Test & Fix Loop has been run and passed — not when the code merely compiles or the happy path works once.
- Do not silently expand a phase's scope. If something outside the current phase's listed scope turns out to be necessary to make the phase work at all, note that in `memory.md` and proceed with the minimum needed — don't build the full future-phase feature early.

---

## 3. Code Standards

- TypeScript throughout, strict mode on. No `any` used to avoid solving a typing problem.
- Business logic lives in the API layer, not in frontend components — this is a hard architectural rule (see `TRD.md` §7), not a style preference, because the same backend needs to serve a future native client without duplication.
- Naming stays consistent with the entity names already defined in `TRD.md` §3 (`Lead`, `Itinerary`, `Booking`, `LedgerEntry`, and so on) — don't introduce a parallel naming scheme for the same concept.
- Every new API endpoint follows the enforcement pattern in `auth.md` §6 (session → user lookup → role check → tenant scope → audit log where applicable). This is not something to reinvent per-route.
- Input validation (e.g. via Zod) is required on every new endpoint, no exceptions for "internal" or "trusted" endpoints.
- Linting and formatting (ESLint + Prettier, or the project's configured equivalents) must pass before a phase is marked done.

---

## 4. Dependency Management

- Before adding a new package, check whether an already-installed dependency covers the need.
- Avoid adding a package for something that's a few lines of code to implement directly, especially for anything security-sensitive (never pull in a random npm package for auth, hashing, or token handling — Supabase Auth already covers that ground).
- Run a vulnerability check (`npm audit` or equivalent) whenever a new dependency is added, not just at phase-end.

---

## 5. Testing Expectations

- Every phase's acceptance criteria (as written in `phases.md`) must be manually or automatically verified — "the code looks right" is not verification.
- RBAC and tenant-isolation checks are adversarial by design: try the action as the wrong role, and try reading another company's data, and confirm both are rejected. Don't only test that the correct role succeeds.
- Regression check: before marking a phase done, re-verify the previous phase's core flow still works. A new phase that breaks an old one is not done.

---

## 6. Handling Ambiguity

- If something in the docs is genuinely ambiguous or missing, make the most reasonable judgment call rather than stalling, and log both the ambiguity and the decision taken in `memory.md`'s Decisions Log.
- Reserve actually stopping and asking for input for cases where a wrong guess would be expensive to reverse — for example, a schema decision that's hard to migrate away from later, or anything touching payment/security behavior where `security.md` doesn't already give a clear answer.
- Never resolve an ambiguity by quietly weakening a security or RBAC requirement. If the ambiguity is security-adjacent, the conservative interpretation wins by default, and it still gets logged.

---

## 7. Documentation

- Code and documentation are owned together — a phase is not complete if the README doesn't reflect what was actually built.
- Comments explain *why*, not *what* — the code should already say what it does.
- `memory.md` is not optional documentation; it is the operational record the next session depends on. See §8.

---

## 8. Memory Log Protocol

`memory.md` is the single continuity mechanism across sessions. It must exist at the project root and follow this structure:

```markdown
# Project Memory

## Project State
(One current paragraph: what phase is active, what's built, what isn't yet.)

## Phase Log
### Phase 0 — DONE (2026-09-18)
- What was built
- What was tested, and the result
- What needs the product owner's input before moving on, if anything

### Phase 1 — IN PROGRESS
- ...

## Decisions Log
- [2026-09-18] Chose X over Y because Z. (Reference the doc/section this resolves, if any.)

## Active Blockers
- [2026-09-18] Waiting on: payment gateway sandbox credentials.
```

Rules for maintaining it:

- **Read `memory.md` in full before doing anything else**, at the start of every session. If it doesn't exist yet, create it from the template above before starting work.
- Update it after every completed task, not just at the end of a phase — a session that ends mid-phase should leave `memory.md` accurate enough that the next session can resume without re-deriving context from the code.
- Mark a phase `DONE` in `memory.md` only after its Test & Fix Loop has actually passed — not preemptively.
- Never delete history from `memory.md`. Superseded decisions are marked as superseded, not erased — the log is a record, not just a current-state snapshot.
- Treat `memory.md` as more current than any other document when it comes to *what has actually been built so far* — the PRD/TRD/phases docs describe intent, `memory.md` describes reality.

---

## 9. Communication Discipline

- At the end of each phase, summarize plainly what was built, what was tested (and the result), and anything that needs a decision or credentials from the product owner before the next phase can proceed.
- Don't bury a real blocker in a wall of status text — flag it clearly, and also record it under Active Blockers in `memory.md`.
