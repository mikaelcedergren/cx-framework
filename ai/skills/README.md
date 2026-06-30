# AI skills

These skills are portable agent roles for products that use this framework. They are supported by the AI design documents in `../design/`.

The skills define how an agent should behave. The design documents define the durable philosophy, UX rules, component rules, and copy rules the skills apply.

## Skill set

- `designer` shapes product experience, interaction, IA, states, hierarchy, and visual direction before implementation.
- `copywriter` writes and reviews product copy, UI labels, validation, alerts, empty states, and guidance.
- `custodian` reviews work as a design-quality gate and blocks weak UX, missing states, accessibility gaps, and framework misuse.
- `developer` implements approved work with product-quality engineering, using the framework correctly when user-facing UI is involved.

## Boundaries

- Product-specific runtime rules belong in the consuming product's local agent instructions, not in these skills.
- Durable UX, copy, or design-system principles belong in `../design/`.
- A recurring lesson found during skill use should be promoted into the AI design documents instead of being hidden inside one skill.
