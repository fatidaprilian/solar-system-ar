# DESIGN

## 1. Design Intent and Product Personality

The product is a marker-based Web AR learning experience for the solar system. The interface must prioritize camera stability, marker clarity, and fast AR entry, while the landing page should now feel like a polished mission entry rather than a plain launch card.

## 2. Audience and Use-Context Signals

Primary usage is on smartphones in classrooms or quick demos. Users open the app, tap Start AR, point to a Hiro marker, then inspect planets.

## 3. Visual Direction and Distinctive Moves

Conceptual anchor: observatory mission console paired with a handheld optical finder. The landing page uses an actual planet GLB preview and Hiro marker asset as product signals, while the scanner keeps a dark camera-first surface with compact floating controls and minimal visual noise.

## 4. Color Science and Semantic Roles

Black camera background is the base layer. Cool-blue and green accents communicate actionable AR readiness, warm amber marks the mission-entry hierarchy, green state indicates marker detection, and red remains reserved for failure states.

## 5. Typographic Engineering and Hierarchy

Large typography is used only on the landing headline with fixed responsive steps, not viewport-width scaling. Scanner HUD uses compact 12-14px labels for readability without blocking the camera feed.

## 6. Spacing, Layout Rhythm, and Density Strategy

Landing recomposes from a two-column mission entry on desktop to a single-column touch-first entry on mobile. Scanner overlays use safe-area aware offsets and fixed positioning. Spacing is tight in HUD rows and moderate in bottom-sheet details.
Layer stack is fixed: camera video at `z-index: 0`, AR canvas/scene at `z-index: 1`, scanner HUD at `z-index: 30`, and modal/toast at `z-index: 50+`.

## 7. Token Architecture and Alias Strategy

CSS variables in `:root` remain the source for semantic roles (`--accent`, `--text-*`, `--line`, `--danger`). Component styles consume semantic tokens instead of hardcoded one-off values.

## 8. Responsive Strategy and Cross-Viewport Adaptation Matrix

- Mobile: landing stacks copy, actions, GLB preview, and marker preview; scanner remains fixed with compact HUD, bottom hint, and bottom-sheet detail panel.
- Tablet: landing keeps a balanced single-column or compact two-column rhythm; scanner keeps full-viewport camera with wider info panel.
- Desktop: landing uses side-by-side copy and visual preview; scanner uses larger panel width and unchanged camera-first composition.

## 9. Interaction, Motion, and Feedback Rules

Motion is utilitarian and product-specific: short button hover transitions, slow orbit-ring drift on landing, immediate detail-panel state changes, and a camera-switch cover while target stream is verified. No fullscreen transition, AR detail zoom, or orientation forcing is allowed.

## 10. Component Language, Morphology, and Shared Patterns

- Landing entry: actual Earth GLB preview, Hiro marker thumbnail, and concise readiness signals; no `Tentang Tata Surya` modal/button.
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

Do not force fullscreen, do not rotate-lock orientation, do not block the camera with oversized overlays, do not reintroduce the removed `Tentang Tata Surya` landing flow, and do not use decorative layers that reduce marker visibility.

## 14. Implementation Notes for Future UI Tasks

When planet tap calibration drifts, tune `hitZonePosition` and `hitZoneRadius` in `src/data/planets.ts` only for the fallback sphere row. Primary `solar_system.glb` selection is resolved in `src/main.ts` from planet mesh/material metadata plus touch-coordinate raycast.
Current baseline: base scales live in `src/ar/scene.ts` (`SOLAR_SYSTEM_MODEL_SCALE`, `SOLAR_FALLBACK_SCALE`) with an aggressive smartphone multiplier in `src/main.ts` (`getSolarScaleMultiplier`) for Infinix-class mobile testing. The loaded `solar_system.glb` is tidied at runtime by hiding decorative asteroid/dwarf clutter, shrinking the Sun node, and centering the fitted model over the Hiro marker. Detail panel preview uses the selected planet's `modelPath` and `previewScale` from `src/data/planets.ts`; no CSS-drawn planet fallback should sit behind the GLB preview.
Close/reopen stability depends on the `visualViewport`-driven `--app-height` path, repeated post-close AR artifact cleanup, explicit landing/scanner pointer-event restoration, cleared embedded preview scenes, clean landing shell remount after scanner close, and a mobile-only page reload fallback in `src/main.ts`.
Camera switching depends on verifying the requested `facingMode` stream before rebuilding the AR scene, then covering the preview during rebuild so AR.js default-camera frames are not shown to the user.
