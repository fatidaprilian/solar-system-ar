---
id_prefix: CFG
domain: config-and-flags
priority: high
scope: backend
applies_to: [backend, frontend, fullstack]
keywords: [configuration, feature-flags, environment, secrets]
---

# Configuration Boundary

## CFG-001: Execution Rules
1. Inject secrets via environment variables.
2. Never store secrets in code. Use .env.example for templates.
3. Use feature flags for incremental rollouts.
4. Validate config shapes at startup. Fail fast if invalid.
