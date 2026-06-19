---
id_prefix: MIG
domain: migrations
priority: high
scope: data
applies_to: [backend, fullstack]
keywords: [migrations, schema, database]
---

# Migrations Boundary

## MIG-001: Execution Rules
1. Schema changes MUST have a versioned migration.
2. Migrations must be reversible (down-migrations) or have a recovery plan.
3. Never modify past migrations once merged. Create a new one.
4. Use concurrent index builds in production.
