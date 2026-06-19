---
id_prefix: PERF
domain: performance
priority: medium
scope: backend
applies_to: [backend, frontend, fullstack]
keywords: [performance, perf, optimization]
---

# Performance Boundary

## PERF-001: Execution Rules
1. Optimize DB queries before adding caches.
2. Compress network payloads.
3. Bound memory usage (paginate, stream). No unbounded arrays.
4. Cache aggressively but define explicit cache invalidation.
