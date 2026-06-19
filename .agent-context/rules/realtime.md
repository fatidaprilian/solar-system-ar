---
id_prefix: RT
domain: realtime
priority: medium
scope: backend
applies_to: [backend, fullstack]
keywords: [realtime, websockets, sse]
---

# Realtime Boundary

## RT-001: Execution Rules
1. Use SSE for one-way server-to-client streams. Use WebSockets only for true bi-directional.
2. Realtime connections must gracefully degrade to polling if blocked.
3. Implement ping/pong heartbeats to drop dead connections.
4. Scale pub/sub via Redis or dedicated brokers.
