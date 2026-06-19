---
id_prefix: JOB
domain: background-jobs
priority: medium
scope: backend
applies_to: [backend, fullstack]
keywords: [background-jobs, worker, cron, queue]
---

# Background Jobs Boundary

## JOB-001: Execution Rules
1. All jobs must be idempotent.
2. Offload heavy processing (>500ms) to background queues.
3. Use dead-letter queues (DLQ) for failed jobs.
4. Emit telemetry on job failure/success.
5. Jobs must have timeouts and retry limits.
