# AI package

This folder contains the portable AI layer for products that use this framework.

- `design/` contains durable design philosophy, UX rules, component rules, copy rules, and fallback copy.
- `skills/` contains portable agent roles that apply the design package during product work.

The design docs are the canonical long-lived rule source. They are maintained directly; they are not bulk-generated from editorial articles. The skills are behavior contracts that retrieve only the rules needed for the current task.

`design/00-start-here.md` defines precedence, rule grammar, and task-local lookup. Stable rule IDs keep one behavior in one owner and make drift detectable.

Product-specific runtime rules, deployment details, personal preferences, and local safety rules belong in the consuming product's own agent instructions.
