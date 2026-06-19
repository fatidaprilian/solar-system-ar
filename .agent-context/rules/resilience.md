---
id_prefix: RES
domain: resilience
priority: critical
scope: backend
applies_to: [backend, fullstack]
keywords: [resilience, timeout, retry]
---

# Resilience Boundary

## RES-001: Execution Rules
1. Every outbound network call MUST have a strict timeout.
2. Retries MUST use exponential backoff with jitter and max attempt limits.
3. Only retry idempotent operations.
4. Fail fast using Circuit Breakers / Load Shedding on unhealthy dependencies.
5. Provide graceful degradation on non-critical dependency failures.
6. Enforce backpressure on bounded consumers.
