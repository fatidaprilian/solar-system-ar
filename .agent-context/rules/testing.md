---
id_prefix: TEST
domain: testing
priority: medium
scope: all-tasks
applies_to: [backend, frontend, fullstack]
keywords: [testing, tests, coverage]
---

# Testing Boundary

## TEST-001: Execution Rules
1. Write tests for business logic and boundary failures.
2. Test error states, not just the happy path.
3. Use deterministic mocks for external services.
4. Ensure CI pipelines block on test failures.
