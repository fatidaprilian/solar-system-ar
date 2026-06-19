---
id_prefix: DOCK
domain: docker-runtime
priority: high
scope: infra
applies_to: [backend, frontend, fullstack]
keywords: [docker-runtime, docker, runtime]
---

# Docker Runtime Boundary

## DOCK-001: Execution Rules
1. ALWAYS perform Live Research / Web Search for latest official Docker documentation before writing configuration.
2. Keep Dev and Prod stages separate.
3. Use minimal trusted base images. Avoid running as root in Prod.
4. Never bake secrets into image layers.
5. Define explicit healthchecks in production compose files.
