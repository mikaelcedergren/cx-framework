# AI package

This folder contains the portable AI layer for products that use this framework.

- `design/` contains the ordered AI contract: start-here routing, design philosophy, design-system facts, UX rules, component rules, copy rules, and fallback copy.
- `skills/` contains portable agent roles that apply the design package during product work.

The design docs are the canonical long-lived rule source and have no parallel human-documentation authority. The skills are behavior contracts that retrieve only the rules needed for the current task.

`design/00-start-here.md` defines precedence, rule grammar, and task-local lookup. `design/02-design-system.md` owns framework facts and component-reference contracts. Stable rule IDs keep one behavior in one owner and make drift detectable.

Product-specific runtime rules, deployment details, personal preferences, and local safety rules belong in the consuming product's own agent instructions.
