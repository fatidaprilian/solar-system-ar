---
id_prefix: ERR
domain: error-handling
priority: high
scope: backend
applies_to: [backend, frontend, fullstack]
keywords: [error-handling, errors, exception]
---

# Error Handling Boundary

## ERR-001: Execution Rules
1. Fail fast on invalid input.
2. Do not leak stack traces to clients. Log them securely.
3. Use standardized machine-readable error codes (RFC 9457).
4. Distinguish client errors (4xx) from server errors (5xx).
