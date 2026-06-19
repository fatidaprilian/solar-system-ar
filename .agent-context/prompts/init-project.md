# Project Initialization Prompts

This prompt boots a repository with strict AI coding guidance context.

## System Directives (Auto Execution)

When a new project is created or initialized, the agent must automatically:
1. Read [AGENTS.md](../../AGENTS.md) to understand the canonical bootstrap chain and active entrypoints.
2. Resolve the smallest relevant rule set from [.agent-context/rules/](../rules/) instead of scanning the whole directory by default.
3. Review dynamic runtime signals from [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), repository evidence, task constraints, and live official documentation when runtime or ecosystem facts matter.
4. If Docker or Compose is in scope, load [docker-runtime.md](../rules/docker-runtime.md) and verify the latest official Docker guidance before authoring container assets. Materialize the selected development/production assets rather than stopping at prose.
5. For unresolved framework or package setup, recommend the latest stable compatible dependency set and official framework setup flow from live official documentation before coding unless a documented compatibility constraint blocks it.
6. Do not default fresh web projects to Next.js, Tailwind-only styling, shadcn/ui, Vite, or any framework by habit, and do not avoid them because of this guard when they are the strongest fit. Treat explicit user constraints as constraints; otherwise compare project needs, runtime boundaries, hosting, data flow, team workflow, and official setup guidance before recommending.

## Required Planning Mode

If the user describes a project or feature, the agent must:
1. Before drafting docs from a thin or ambiguous brief, ask the smallest useful set of clarifying questions needed to make delivery goals, edge cases, constraints, must-have capabilities, and non-goals explicit. If the user wants a draft anyway, document assumptions and wait for approval before coding.
2. If the user already named a stack or framework, treat it as an explicit constraint. If not, produce a short evidence-backed recommendation from the brief, repo evidence, and live official documentation before coding. Include at least one plausible alternative when the default-looking option is Next.js, Tailwind-only styling, shadcn/ui, or another familiar web stack.
3. For existing projects, inspect real files first. Do not derive product name, description, runtime, architecture, or design direction from the folder name alone.
4. Draft a high-level structure plan plus the docs/bootstrap artifacts that must exist before coding.
5. Wait for user approval before scaffolding the project.

## Documentation-First Requests

If the user asks to create, complete, fix, or review project docs, documentation, dokumen, `docs/*`, architecture docs, flow docs, API docs, or "lengkapkan docs", treat the request as documentation-first.

The agent must:
1. Materialize or refine required project docs before implementation: root `README.md` for every fresh or existing project; `docs/doc-index.md` whenever `docs/` exists; `docs/project-brief.md`; `docs/architecture-decision-record.md`; `docs/flow-overview.md`; `docs/api-contract.md` when APIs, firmware endpoints, CLI commands, or web application flows exist; `docs/database-schema.md` when persistent data exists; and `docs/DESIGN.md` for UI scope.
2. Write formal project docs in English by default unless the user explicitly asks for another documentation language.
3. Keep `docs/doc-index.md` short. Use it as the read-routing map with document path, purpose, reads-when triggers, status, and last-updated date. Do not duplicate the docs it points to.
4. Keep `README.md` public and developer friendly even for private projects: explain what the project is, who it is for, how to set it up, how to run the core workflow, how to configure it, and where deeper docs live. Do not put internal agent notes, private reasoning, secrets, or governance policy in the README.
5. Keep documentation alive. When project behavior, setup, architecture, public contracts, data shape, deployment, or UI scope changes, update the matching docs in the same change.
6. Avoid documentation sprawl. Add a new docs file only when the topic is stable, long enough to outgrow the README or core docs, or owned by a separate workflow such as hardware setup, deployment, troubleshooting, or testing validation.
7. Add PRD, SRS, technical-design, or separate ERD only when evidence triggers them. Use PRD for product roadmap/user-story ownership, SRS for contractual or multi-stakeholder acceptance criteria, technical-design for non-trivial architecture decisions, and a separate ERD only when `docs/database-schema.md` cannot stay readable with an embedded diagram.
8. Stop after docs when the user only asked for docs. Do not write application, firmware, or UI code until the user explicitly asks for implementation or approves the implementation plan.

## Direct Constraint Mode

If the user specifies a framework, runtime, or architecture constraint, the agent must:
1. Read [AGENTS.md](../../AGENTS.md) for role context.
2. Resolve only the rules required by the explicit constraint and scope. Do not read unrelated backend, frontend, or DevOps rules by habit.
3. Reference [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), [AGENTS.md](../../AGENTS.md), and the relevant `.agent-context/` files for runtime evidence and any explicit constraints already applied to this project.
4. Scaffold the initial project structure only after runtime and architecture decisions are explicit:
   - Create only the directories and files justified by the approved structure.
   - Set up configuration, validation, error handling, observability, health checks, and persistence only when they fit the approved runtime and project scope.
   - Every module must follow [architecture.md](../rules/architecture.md).
   - New code must pass the natural implementation pass in [architecture.md](../rules/architecture.md): start with the simplest correct flow, add complexity only when the requirement or repo evidence needs it, and do not add files or layers for small tasks.
   - Use official framework setup commands or canonical starter flows when they produce newer, better-supported dependency defaults than manual package assembly.
   - Do not assemble a framework project from scratch by habit when official setup commands create the supported structure. Manual assembly is allowed only for tiny prototypes, educational demos, unusual repo constraints, or a documented architecture reason.
   - If containerization is selected, Docker assets must follow [docker-runtime.md](../rules/docker-runtime.md) and the latest official Docker docs instead of stale blog-era patterns. Selected Docker lanes require files and runbooks, not docs-only acknowledgment.

## Runtime and Architecture Reference

See [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), [AGENTS.md](../../AGENTS.md), and the relevant `.agent-context/` files for the latest shipped runtime evidence, explicit constraints, and agent-decision status.

## UI/UX Bootstrap

When a user requests frontend or UI/UX design, the agent must automatically execute the [bootstrap-design.md](./bootstrap-design.md) prompt to synthesize a dynamic markdown design contract (`docs/DESIGN.md`).
Keep UI-only requests context-isolated: load [bootstrap-design.md](./bootstrap-design.md) and [frontend-architecture.md](../rules/frontend-architecture.md) first, and do not eagerly load backend-only rules unless the task explicitly crosses backend boundaries.
