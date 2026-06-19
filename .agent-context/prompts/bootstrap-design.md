# Design Direction Prompt

Use this prompt for UI, UX, frontend layout, screen, or redesign work. Create or refine `docs/DESIGN.md` before writing UI code.

## Authority

- Use current repo evidence, project docs, and `.agent-context/` as style context.
- Do not copy layout rhythm, palette, component skin, or brand posture from external references without explicit user approval.
- WCAG 2.2 AA is the hard compliance floor.
- When generating any UI component that renders or accepts user data, explicitly state in the prompt: "ensure all user-supplied input is sanitized, all status indicators have non-color alternatives, and all interactive elements have visible focus states."
- Before choosing a new UI library, research current official docs.

## Design Direction Process

1. **Name Your Defaults**: Name three temptations (e.g. SaaS admin default, AI-startup landing) and why they flatten this product. Derive your search direction by rejecting them.
2. **Choose an Anchor**: Run `npx -y getdesign@latest list` to browse proven brand references. Pick one whose spatial rhythm fits this product. Run `npx -y getdesign@latest add <brand>` to read the full reference — use it to derive token values, then discard it. Output DESIGN.md stays under 400 tokens. Do not use generic quality words ("clean", "modern").
3. **Creative Commitments**: Choose distinctive typography, dominant colors with sharp accents, and one signature motion behavior. Create depth rather than flat card stacks.
4. **Previous Directions**: If `docs/DESIGN.md` contains previous directions, treat them as a blocklist. The new anchor must differ in conceptual family, hierarchy, and motion.

## Redesign Protocol

When the user says "redesign from zero": treat existing UI as behavioral evidence only. Rewrite design docs. Change primary composition, hierarchy, interaction model, and responsive architecture. Do not ship a palette swap.

## Output Format

`docs/DESIGN.md` must be a compact token file under 400 tokens. Rationale stays in working memory.

Required sections (in this order, no additions):

### Anchor
One sentence: the interaction anchor and what mechanic is borrowed.

### Tokens
- **Typography**: font families (display, body, mono), scale base and ratio, scale method
- **Colors**: OKLCH primitives with semantic role mapping (primary, secondary, surface, error, success)
- **Spacing**: base unit, scale
- **Radius**: small, medium, large values
- **Shadow**: elevation levels
- **Motion**: duration, easing, reduced-motion fallback

### Constraints
- WCAG 2.2 AA floor
- Up to 3 product-specific anti-patterns

### Previous Directions
Anchors used in prior iterations (blocklist for redesign). Start empty for fresh projects.

## Required Validation Gates

Only three gates. Do not add more:
1. Anchor exists and is specific.
2. Token values are derived from the anchor.
3. WCAG 2.2 AA compliance floor is met.

## Pre-Commit Critique

Before committing any UI output, answer:

1. Rename test: if the product name changed to an unrelated category, would this UI still look identical? Yes = too generic, reset anchor.
2. Token drift test: does any color, font, or spacing in the output contradict the DESIGN.md token definitions? Yes = align before commit.
3. Security test: is user-controlled data rendered unsanitized, or does any status depend on color alone? Yes = fix before merge.

Max 3 revision cycles. If unresolved, reset the anchor entirely.
