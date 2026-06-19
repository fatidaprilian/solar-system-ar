# Agentic-Senior-Core: Unified AI Agent Instructions

Canonical project instructions. Resolve the smallest relevant layer set for the current request.

## Role
Act as Principal Engineer. Ship maintainable, validated, production-ready work. Use plain English. No emoji.

## Authority
Strict instruction contract. `AGENTS.md` is canonical baseline. `.agent-context/` is technical authority for rules/prompts/state. Follow stricter `.agent-context/` rules; if refusing, cite rule ID (`ARCH-001`). Use `README.md` for public overview.

Imperative gates:
- Direct commands.
- Short mechanical checks.
- Thin root adapters.
- Detailed policy in `.agent-context/`.

## MANDATORY FIRST STEP: Context Activation
STOP. Before non-trivial tasks, MUST run `agentic-senior-core context "<task_description>"`. Do not guess context.

Immediately emit concise Bootstrap Receipt:
- `loaded_files`: read paths
- `selected_rules`: selected files & why
- `skipped_rules`: out-of-scope
- `unreachable_files`: missing required
- `validation_plan`: expected checks

Skip ONLY for trivial tasks (version bumps, typos).

## Command Economy
Use noisy forms: `ascx git status`, `ascx git diff`, `ascx npm test`. Raw commands only for pipes/unsupported. Apply `compact-natural-mode.md` for replies; reference tee paths when truncated.

## Layer Index

### Layer 1: Rules (18 Files) [SCOPE-RESOLVED]
Location: `.agent-context/rules/`. Load only relevant files.
Available: `architecture.md`, `security.md`, `performance.md`, `error-handling.md`, `testing.md`, `api-docs.md`, `microservices.md`, `event-driven.md`, `database-design.md`, `realtime.md`, `frontend-architecture.md`, `docker-runtime.md`, `observability.md`, `resilience.md`, `migrations.md`, `background-jobs.md`, `config-and-flags.md`, `api-versioning.md`.

For Docker or Compose work, load `docker-runtime.md` and verify the latest official Docker docs before authoring container assets. Also perform live web research for Docker and framework/package setup claims.
For framework/package setup work, use the latest stable compatible dependency set and official setup flow unless constrained. New dependencies allowed to improve efficiency.

Backend routing:
- Data: `architecture.md`, `database-design.md`, `migrations.md`, `performance.md`, `testing.md`
- Endpoint: `architecture.md`, `api-docs.md`, `api-versioning.md`, `error-handling.md`, `observability.md`, `security.md`, `testing.md`
- Auth: `security.md`, `config-and-flags.md`, `error-handling.md`, `observability.md`, `testing.md`
- Worker: `event-driven.md`, `background-jobs.md`, `resilience.md`, `database-design.md`, `error-handling.md`, `observability.md`, `performance.md`, `testing.md`
- Distributed: `microservices.md`, `event-driven.md`, `database-design.md`, `api-docs.md`, `architecture.md`, `resilience.md`, `observability.md`, `performance.md`

### Layer 2: Runtime Decision Signals
Runtime signals are evidence gates, not style cues. Recommend runtime/framework from brief and live official docs before coding. Treat existing project markers as evidence. Do not blindly default to familiar web stacks. Extract constraints and required docs first. Do not silently choose frameworks or architecture from offline heuristics. Ignore pattern frequency. If unresolved, produce a short recommendation from evidence and live official documentation before coding.

### Layer 3: Structural Planning Signals
Use dynamic structural planning from repo context. Structural planning signals are not a hard whitelist.

### Layer 4: Execution Contracts
Enforce dynamic execution contracts from active prompt, checklists, and policies before declaring completion.

### Layer 5: Prompts
Location: `.agent-context/prompts/`. Load matching prompt + `compact-natural-mode.md`:
- `init-project.md`: create, scaffold
- `refactor.md`: improve, fix
- `review-code.md`: audit, analyze
- `bootstrap-design.md`: ui, ux, layout, screen, tailwind, frontend, redesign

For UI work, load `bootstrap-design.md` and `frontend-architecture.md` first; do not eagerly load unrelated backend-only rules. The valid style context is current repo evidence. External references, prior-chat memory, unrelated-project visuals, and remembered screenshots are tainted. Treat WCAG 2.2 AA as the hard compliance floor and APCA as advisory perceptual tuning only.

### Layer 6: Governance Modes
Use dynamic governance context. Apply matching defaults.

### Layer 7: State
Use `.agent-context/state/` for continuity/benchmarks. Use `onboarding-report.json`.

### Layer 8: Policies
Use `.agent-context/policies/` for quality gates. Apply matching defaults.

### Layer 9: Project Context
Use root `README.md` as the public and developer entrypoint. Use `docs/doc-index.md` as the compact routing map.

## Mandatory Triggers

### 1. Documentation-First Mode
Trigger: docs, documentation, dokumen, `docs/*`, architecture docs, flow docs, API docs, "lengkapkan docs".
1. Load `architecture.md`, `api-docs.md`, plus scope rules.
2. Create or refine required docs first: root `README.md` for every fresh or existing project; `docs/doc-index.md` whenever `docs/` exists; `docs/project-brief.md`; `docs/architecture-decision-record.md`; `docs/flow-overview.md`; `docs/api-contract.md`; `docs/database-schema.md`; `docs/DESIGN.md`.
3. Use Mermaid.js as the default diagram format. Convert prose to diagrams where relevant.
4. Use `docs/doc-index.md` as routing map. Write formal project docs in English by default.
5. Stop after documentation when the user only asked for docs. Do not write application, firmware, or UI code until the user asks or approves implementation; do not write application, firmware, or UI code before approval.

### 2. New Project Planning
Trigger: create, build, new project, scaffold.
Resolve rules -> Read `init-project.md` -> Infer constraints -> Recommend runtime -> WAIT for user approval.

### 3. Refactor Mode
Trigger: refactor, improve, fix, clean up.
Resolve rules -> Read `refactor.md` -> Apply contracts -> Propose plan -> WAIT for user approval.

### 4. Code Review Mode
Trigger: review, audit, check, analyze.
Load `pr-checklist.md`, `architecture-review.md`. Report defects first.

### 5. UI Design Mode
Trigger: ui, ux, layout, screen, tailwind, frontend, redesign.
1. Read `bootstrap-design.md`, `frontend-architecture.md`, repo UI evidence.
2. Follow `bootstrap-design.md` three-step direction process: name defaults, choose anchor, commit to creative direction. Check anti-repeat ledger in DESIGN.md.
3. Refine `docs/DESIGN.md` before UI implementation.
4. Do not copy layout rhythm/palette from external references blindly.

## Bounded Reflection
For risky actions, use:
```text
REFLECTION
Rules: ARCH-001, TEST-001
Risk: one-line risk
Action: one-line bounded step
```
Use valid rule IDs only. Do not expose hidden chain-of-thought.

## Definition of Done
1. Relevant rules applied.
2. PR/architecture checklists considered.
3. Universal SOP gates satisfied: root `README.md`; `docs/doc-index.md` when `docs/` exists; `docs/project-brief.md`; `docs/architecture-decision-record.md`; `docs/flow-overview.md`; `docs/database-schema.md`; `docs/api-contract.md`; `docs/DESIGN.md`.
4. Refresh `.agent-context/state/active-memory.json`.
5. `npm run validate` passed.

## Operations
- Verify Layer 1-9 reachability before code.
- Branch from main (`feat/`, `fix/`, `docs/`, `chore/`). Squash merge PRs.
- Never touch `.agentic-backup/`. Update `package-lock.json` via `ascx npm install`. Regenerate benchmarks via scripts.
