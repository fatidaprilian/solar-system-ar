---
id_prefix: SEC
domain: security
priority: critical
scope: all-tasks
applies_to: [backend, frontend, fullstack]
keywords: [security, boundary, zero-trust]
---

# Security Boundary

## SEC-001: Execution Rules
1. Validate and normalize ALL inputs.
2. Parameterize all SQL queries. Never interpolate input into DB or Shell.
3. Hash passwords with Argon2/Bcrypt. NEVER store plain text or use MD5/SHA.
4. NEVER commit secrets, tokens, or credentials.
5. Implement resource-aware authorization (Row-Level), not just Authentication.
6. Verify service-to-service cryptographic identity.
