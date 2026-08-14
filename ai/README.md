# AI package

This folder contains the portable AI layer for products on any implementation platform.

- `design/` contains the ordered AI contract: start-here routing, design philosophy, design-system use, UX rules, semantic component-role rules, copy rules, and fallback copy.
- `skills/` contains portable agent roles that apply the design package during product work.
- `profile/` contains the lead-designer profile: a non-normative reasoning reference that agents load whole when a task requires the designer's judgment rather than a rule lookup.

The design docs are the canonical long-lived rule source and have no parallel human-documentation authority. The skills are behavior contracts that retrieve only the rules needed for the current task. The profile carries the lowest authority and never overrides the design contract, a skill contract, or product truth.

`design/00-start-here.md` defines precedence, rule grammar, and task-local lookup. `design/02-design-system.md` owns the platform-neutral contract for discovering and using the consuming product's design system. Stable rule IDs keep one behavior in one owner and make drift detectable.

Component-family words in this package describe semantic roles, not selectors, imports, property names, or required code structure. The consuming product's own system supplies the concrete implementation. Product-specific component catalogs, runtime rules, deployment details, personal preferences, and local safety rules belong in that product's own instructions and documentation.
