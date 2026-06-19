---
id_prefix: ARCH
domain: architecture
priority: critical
scope: all-tasks
applies_to: [backend, frontend, fullstack]
keywords: [architecture, arch, boundary, system]
---

# Architecture Boundary

## ARCH-001: Execution Rules
1. Rely on ESLint/Linters for structural enforcement.
2. Require README.md and docs/doc-index.md.
3. Run `npm run validate` to enforce architecture invariants.
4. Do not invent custom crypto, custom state management, or custom routing. Use standard libraries.

## ARCH-005: Rules as Guardian (Cross-Session Consistency)
1. Session handoff must include active architecture contract summary.
2. Detect drift before changing runtime choices, topology, public contracts, or core patterns.
3. Direction changes require explicit user confirmation before applying changes.

## ARCH-006: Invisible State Management with Explain-on-Demand
1. Default responses must avoid unnecessary state-file internals.
2. State internals are exposed only on explicit user request.
3. Diagnostic mode explains relevant state decisions when needed.

## ARCH-007: Single Source of Truth and Lazy Rule Loading
1. Canonical rule source is AGENTS.md.
2. Load global domain rules lazily based on touched scope.
3. Do not create or load stack-specific governance adapters as the baseline.

## ARCH-008: AI-Optimized Code Style (Simplicity, Modularity, Elegance)
1. No Clever Hacks: Do not use code golfing, deeply nested ternaries, or tricky functional chains that destroy readability.
2. No Premature Abstraction: Avoid over-engineering (excessive helper functions, layers, or abstraction classes) when a direct procedural flow is easier for an LLM to comprehend.
3. Explicit Variable Naming: Use descriptive and functional variable names. Avoid cryptic abbreviations.
4. Natural Implementation Pass: Keep the main flow traceable, use early returns to reduce nesting, and avoid abstraction chains unless a real duplication pattern exists.

