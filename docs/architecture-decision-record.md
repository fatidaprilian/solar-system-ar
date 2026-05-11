# Architecture Decision Record

## ADR-001: Mobile-Safe Marker-Based WebAR Runtime

Status: Accepted

Date: 2026-05-12

## Context

The project is a Vite and TypeScript WebAR application using A-Frame, AR.js, GSAP, Hiro marker tracking, and local GLB assets. The primary demo target is mobile browsers on Android, iOS, and tablets through Vercel.

The AR scene must keep the camera feed stable, keep the solar-system model small enough for phone screens, allow planet taps for detail information, and return cleanly to the landing page after closing the scanner.

## Decision

Use a controlled marker-anchored mini solar row for the main AR view instead of showing the imported `solar_system.glb` directly on mobile. Keep individual planet GLBs for the detail view, but fit their rendered bounding boxes at runtime to a fixed marker-space target size.

Keep AR lifecycle cleanup centralized in `src/main.ts`, including stream shutdown, A-Frame artifact removal, scanner state reset, and repeated post-close cleanup passes. Use `visualViewport`-derived `--app-height` for mobile viewport stability.

## Rationale

The imported full solar-system GLB can have inconsistent internal scale and layout for phone marker tracking. A controlled mini row gives predictable placement, tap zones, and visual size across devices. Runtime bounding-box fitting prevents individual planet GLBs from covering the camera view when their source asset scale differs.

AR.js can leave video, canvas, and fullscreen classes after scanner teardown, especially during repeated open/close cycles. Repeated cleanup and explicit landing shell restoration reduce stale viewport state.

## Consequences

- Main marker view prioritizes stable educational layout over preserving the exact imported solar-system GLB composition.
- Planet detail still uses GLB assets where practical.
- Hit-zone calibration remains data-driven in `src/data/planets.ts`.
- Final visual confirmation still requires real-device testing on Android Chrome, iOS Safari, and tablet browsers.
