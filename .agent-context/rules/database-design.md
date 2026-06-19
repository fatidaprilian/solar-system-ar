---
id_prefix: DATA
domain: database-design
priority: high
scope: data
applies_to: [backend, fullstack]
keywords: [database-design, data, schema]
---

# Data Design Boundary

## DATA-001: Execution Rules
1. Avoid N+1 queries. Use eager loading or batching.
2. Paginate growable datasets.
3. Multi-table mutations must run inside transactions.
4. Monetary amounts must be integer (minor units) or exact decimal. NO floats.
5. Store real-world timestamps in UTC. NO naive timestamps.
6. Use optimistic concurrency tokens (ETag/version) for shared mutable resources.
