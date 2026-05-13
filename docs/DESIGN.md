# DESIGN

## 1. Design Intent and Product Personality

The product is a marker-based Web AR learning experience for the solar system. The interface must prioritize camera stability, marker clarity, and fast AR entry over decorative UI.

## 2. Audience and Use-Context Signals

Primary usage is on smartphones in classrooms or quick demos. Users open the app, tap Start AR, point to a Hiro marker, then inspect planets.

## 3. Visual Direction and Distinctive Moves

Conceptual anchor: handheld optical instrument panel. The UI keeps a dark camera-first surface with compact floating controls and minimal visual noise.

## 4. Color Science and Semantic Roles

Black camera background is the base layer. Cool-blue accents communicate actionable controls and neutral status. Green state indicates marker detection. Warm warning and red error remain reserved for failure states.

## 5. Typographic Engineering and Hierarchy

Large typography is used only on landing headline. Scanner HUD uses compact 12-14px labels for readability without blocking the camera feed.

## 6. Spacing, Layout Rhythm, and Density Strategy

Scanner overlays use safe-area aware offsets and fixed positioning. Spacing is tight in HUD rows and moderate in bottom-sheet details.
Layer stack is fixed: camera video at `z-index: 0`, AR canvas/scene at `z-index: 1`, scanner HUD at `z-index: 30`, and modal/toast at `z-index: 50+`.

## 7. Token Architecture and Alias Strategy

CSS variables in `:root` remain the source for semantic roles (`--accent`, `--text-*`, `--line`, `--danger`). Component styles consume semantic tokens instead of hardcoded one-off values.

## 8. Responsive Strategy and Cross-Viewport Adaptation Matrix

- Mobile: fixed scanner, compact HUD, bottom hint, bottom-sheet detail panel.
- Tablet: scanner keeps full-viewport camera with wider info panel.
- Desktop: larger panel width and unchanged camera-first composition.

## 9. Interaction, Motion, and Feedback Rules

Motion is utilitarian: short button hover transitions and immediate detail-panel state changes. No fullscreen transition, AR detail zoom, or orientation forcing is allowed.

## 10. Component Language, Morphology, and Shared Patterns

- Scanner controls: rounded pill buttons with 44px minimum touch height.
- Marker status: centered capsule at top.
- Planet detail: fixed bottom sheet on smaller viewports, side panel on larger viewports.
- Solar overview: `solar_system.glb` is the primary marker visual; the controlled sphere row is only an error fallback when the GLB cannot load.
- Planet detail preview: embedded GLB preview loads the selected planet's exact `.glb` from `public/assets/models/planets/**`; keep it crisp, centered, and contained below the return button, and do not replace it with CSS-drawn planet art.
- Planet tap targeting: solar-system GLB interaction must resolve from actual planet mesh/material identity first, then use enlarged invisible tap targets and touch-coordinate fallback. Do not map detail selection from decorative orbit paths or a fixed center-screen ray.

## 11. Context Hygiene and Source Boundaries

Design decisions are based on current repo code, current user brief, and AR runtime constraints. No external UI imitation is required.

## 12. Accessibility Non-Negotiables

Minimum touch target 44px, high-contrast text over camera feed, and reduced-motion media query support are mandatory.

## 13. Anti-Patterns to Avoid

Do not force fullscreen, do not rotate-lock orientation, do not block the camera with oversized overlays, and do not use decorative layers that reduce marker visibility.

## 14. Implementation Notes for Future UI Tasks

When planet tap calibration drifts, tune `hitZonePosition` and `hitZoneRadius` in `src/data/planets.ts` only for the fallback sphere row. Primary `solar_system.glb` selection is resolved in `src/main.ts` from planet mesh/material metadata plus touch-coordinate raycast.
Current baseline: base scales live in `src/ar/scene.ts` (`SOLAR_SYSTEM_MODEL_SCALE`, `SOLAR_FALLBACK_SCALE`) with an aggressive smartphone multiplier in `src/main.ts` (`getSolarScaleMultiplier`) for Infinix-class mobile testing. The loaded `solar_system.glb` is tidied at runtime by hiding decorative asteroid/dwarf clutter, shrinking the Sun node, and centering the fitted model over the Hiro marker. Detail panel preview uses the selected planet's `modelPath` and `previewScale` from `src/data/planets.ts`; no CSS-drawn planet fallback should sit behind the GLB preview.
Close/reopen stability depends on the `visualViewport`-driven `--app-height` path, repeated post-close AR artifact cleanup, explicit landing/scanner pointer-event restoration, cleared embedded preview scenes, clean landing shell remount after scanner close, and a mobile-only page reload fallback in `src/main.ts`.
