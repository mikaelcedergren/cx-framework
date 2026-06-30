# AI package

This folder contains the portable AI layer for products that use this framework.

- `design/` contains durable design philosophy, UX rules, component rules, copy rules, and fallback copy.
- `skills/` contains portable agent roles that apply the design package during product work.

The design docs are the long-lived rule source. The skills are behavior contracts for agents. When a recurring lesson becomes durable design knowledge, promote it into `design/` instead of hiding it inside a skill.

Product-specific runtime rules, deployment details, personal preferences, and local safety rules belong in the consuming product's own agent instructions.
