---
id_prefix: EVT
domain: event-driven
priority: medium
scope: backend
applies_to: [backend, fullstack]
keywords: [event-driven, events, kafka, rabbitmq]
---

# Event Driven Boundary

## EVT-001: Execution Rules
1. Events must be immutable.
2. Consumers must be idempotent.
3. Handle out-of-order events securely.
4. Always implement Dead Letter Queues (DLQ) for poison messages.
