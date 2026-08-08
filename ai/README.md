# AI package

This folder contains the portable AI layer for products that use this framework.

- `design/` contains the ordered AI contract: start-here routing, design philosophy, design-system facts, UX rules, component rules, copy rules, and fallback copy.
- `skills/` contains portable agent roles that apply the design package during product work.
- `profile/` contains the lead-designer profile: a non-normative reasoning reference that agents load whole when a task requires the designer's judgment rather than a rule lookup.

The design docs are the canonical long-lived rule source and have no parallel human-documentation authority. The skills are behavior contracts that retrieve only the rules needed for the current task. The profile carries the lowest authority and never overrides the design contract, a skill contract, or product truth.

`design/00-start-here.md` defines precedence, rule grammar, and task-local lookup. `design/02-design-system.md` owns framework facts and component-reference contracts. Stable rule IDs keep one behavior in one owner and make drift detectable.

Product-specific runtime rules, deployment details, personal preferences, and local safety rules belong in the consuming product's own agent instructions.
