# AI skills

These skills are portable agent roles for products that apply the shared design guidance. They do not assume a particular UI framework, component library, selector, import, or API. They are supported by the AI design documents in `../design/`.

The skills define how an agent should behave. The design documents define the durable philosophy, UX rules, component rules, and copy rules the skills apply.

## Skill set

- `designer` shapes or redesigns product experience, resolves ambiguity, and produces a concrete brief.
- `copywriter` writes or revises product copy while preserving product truth and settled terminology.
- `custodian` reviews existing work as an evidence-led quality gate and separates defects from unverified areas.
- `developer` implements an accepted scope without broadening it and verifies claims proportionally to risk.
- `cleaner` autonomously inspects, simplifies, cleans, and verifies a repository or multi-repository workspace.

Route by the user's current verb and the artifact's stage:

- exploration, product direction, UX ambiguity, or a design brief → `designer`
- requested replacement wording → `copywriter`
- review, audit, approval, or readiness verdict → `custodian`
- explicit implementation of a settled outcome → `developer`
- repository or workspace cleanup, optimization, maintenance, or structural sanity check → `cleaner`

Do not run the entire lifecycle automatically for a task that starts at a later settled stage. Switch roles only when unresolved product direction, wording, evidence, or implementation genuinely requires it. Implementation still starts only after explicit action language.

`Blocked` and `Unverified` do not progress to implementation. `Needs changes` progresses only after resolution or explicit user acceptance of the named residual risk; `Polish` and `Pass` may proceed. Rule strength and verdict severity are separate: a violated `must` is binding but becomes `Blocked` only when its user impact makes the next gate unsafe, misleading, inaccessible, or wasteful.

## Boundaries

- Product-specific runtime rules belong in the consuming product's local agent instructions, not in these skills.
- Durable UX, copy, or design-system principles belong in `../design/`.
- A recurring lesson found during skill use should be promoted into the AI design documents instead of being hidden inside one skill.

## Component language and resolution

Apply `RULE-ID: system.component-terms` and `RULE-ID: system.component-resolution` whenever a task names a component family such as a button, dialog, tabs, tooltip, or icon button.

Those rules own the complete resolution and fallback order. Each skill applies that order at its own stage using evidence from the consuming product. This is dynamic local discovery, not a maintained cross-platform adapter; an exact component name or API is binding only when an applicable higher-authority source makes it so.
