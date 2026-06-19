---
id_prefix: SVC
domain: microservices
priority: medium
scope: backend
applies_to: [backend, fullstack]
keywords: [microservices, monolith]
---

# Microservices Boundary

## SVC-001: Execution Rules
1. Default to modular monoliths unless scale explicitly dictates microservices.
2. Independent services must own their data. NO shared databases.
3. Cross-service calls must have timeouts and retries.
4. Prefer async choreographies over distributed two-phase commits.
