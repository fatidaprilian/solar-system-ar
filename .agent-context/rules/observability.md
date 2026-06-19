---
id_prefix: OBS
domain: observability
priority: high
scope: backend
applies_to: [backend, fullstack]
keywords: [observability, telemetry, logs, metrics]
---

# Observability Boundary

## OBS-001: Execution Rules
1. Emit telemetry for failures, degraded states, and security events.
2. Inject correlation IDs on inbound requests and propagate them downstream.
3. Do not log PII, secrets, or credentials.
4. Measure latency, traffic, errors, and saturation.
