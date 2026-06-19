---
id_prefix: FE
domain: frontend-architecture
priority: high
scope: ui
last_validated: 2026-05-17
applies_to: [frontend, fullstack]
keywords: [frontend-architecture, fe, ui, engineering]
---

# Frontend Engineering Invariants (Tier 2)

Load this rule for UI-facing engineering work. This file contains strict engineering constraints.

## FE-009: Accessibility
1. WCAG 2.2 AA is the hard floor. APCA is advisory perceptual tuning only.
2. Hard checks: focus visibility, target size, keyboard access, color-only meaning.

## FE-010: CSS Production Hardening
1. Plan overflow, wrapping, truncation, empty, loading, and error behavior.
2. Prefer logical composition primitives (container queries, subgrid).

## FE-011: Implementation Boundaries
1. Follow the shipped project stack and current repo patterns.
2. Do not hardcode framework-specific state management or data fetching libraries, or rigid component doctrines.

## FE-012: Data State Surface
1. Explicitly handle empty, loading, error, and offline states.
2. Reject "spinner everywhere".

## FE-013: Background and Wallpaper Discipline
1. Decorative geometry are invalid as wallpaper.
2. Use grids/lines only for specific functional roles (alignment, map, crop).

## FE-014: Production Content Policy
1. No visible testing, demo, sample, placeholder, lorem, or TODO labels in production UI.

## FE-015: Motion Implementation Budget
1. Keep reduced-motion, keyboard, loading, performance, and mobile fallbacks explicit.

## FE-016: Library and Design-Intent Discipline
1. Use component kits or headless primitives for behavior and accessibility when they fit.

## FE-017: Interactivity Priority
1. The interactive boundary must be drawn deliberately. Keep client-side state boundaries small.
2. Measure responsiveness through Interaction to Next Paint (INP).

## FE-018: Internationalization as Layout
1. Direction-sensitive spacing, alignment, and positioning must use CSS logical properties (e.g., `margin-inline-start`).
2. Plan a documented text-expansion budget for target locales.

## FE-019: Theme as Context
1. A theme switch is a change in lighting and surface model, not a color inversion. Re-derive tokens per theme.
2. Brand colors carried across themes must be individually verified against the active theme's contrast floor.
