---
id_prefix: API
domain: api-docs
priority: high
scope: backend
applies_to: [backend, fullstack]
keywords: [api-docs, api, contract, documentation]
---

# API Contract Boundary

## API-001: Execution Rules
1. Sync docs in the same commit when changing API, CLI, or schema.
2. Root README.md is mandatory. Keep it overview-level. No secrets.
3. Keep `docs/doc-index.md` as the routing map.
4. Use OpenAPI 3.1 for HTTP APIs by default.
5. Idempotency is mandatory for side-effect mutations (POST/PUT/PATCH).
6. Use Mermaid.js natively for all diagrams. No PlantUML/D2.

## API-002: Human Writing & Anti-Slop (Mandatory)
1. NO EMOJI in any formal documentation, code, or review summaries. This is absolute.
2. Use plain English and avoid generic AI cliches ("AI slop") in generated docs.
3. Keep code clean and efficient. Do not write convoluted/long code if a shorter, efficient solution exists without losing functionality.
4. Keep documentation short, clear, and directly actionable.
