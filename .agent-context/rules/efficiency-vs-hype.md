# Dependency and Tooling Boundary

## Latest-Compatible-First Rule

The LLM may choose modern libraries and tooling when they fit the project. This rule does not prefer "no library", "always add a library", or any fixed dependency set.

New dependencies are allowed when they create a better practical tradeoff than custom implementation. The decision should be based on whether the dependency meaningfully improves efficiency, shortens delivery time, improves correctness, reduces maintenance burden, unlocks a stronger user experience, or avoids unnecessary in-house code.

Do not treat dependency avoidance as an engineering virtue by itself. A small, maintained, well-scoped library can be the simpler and safer choice than custom code, especially for accessibility primitives, animation, gestures, data visualization, parsing, protocol handling, security-sensitive helpers, or browser/runtime capabilities with tricky edge cases.

Before adding or recommending a dependency:
- check current official docs, release notes, and setup guidance when the ecosystem decision matters
- choose the latest stable compatible dependency version unless a project constraint blocks it
- use the official scaffolder or setup command when it creates the current supported project shape
- Only step down to an older dependency version after documenting the exact compatibility, runtime, platform, or ecosystem reason.
- explain why the dependency is a better tradeoff than local implementation for the current task
- avoid packages that are stale, thinly maintained, too heavy for the job, or added only because they are popular
- keep dependency boundaries replaceable when the library would spread through many files
- do not reject a dependency only because it adds a package; reject it only when the project-fit, security, maintenance, compatibility, bundle/runtime, or ownership tradeoff is worse than the alternative

Reject offline dependency decisions, outdated tutorial versions, trend choices, dependency avoidance choices, and performance-fear choices that are not grounded in the current repo, brief, and delivery tradeoffs.
