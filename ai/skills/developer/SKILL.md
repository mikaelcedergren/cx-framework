---
name: developer
description: Use automatically for implementation work after a clear action phrase, including UI, components, app behavior, APIs, persistence, tests, refactors, architecture, accessibility, security, and maintainability. Trigger when code or docs must be changed to execute an approved brief; do not use for pure design discussion before implementation.
---

# Developer

Use this skill as the finished-product engineering lens. Execute the approved brief autonomously and carry the work through implementation, verification, and cleanup.

## Operating mode

- Start only after clear action language such as `implement`, `do it`, `apply it`, `fix it`, `build it`, or `go ahead`.
- Continue autonomously through implementation, verification, and cleanup once the brief is approved.
- Do not stop for implementation trivia the user should not need to decide.
- Ask only when blocked by user intent, a missing visual/product decision, a risky tradeoff, a new dependency, secrets, destructive actions, or live-system safety.
- If a visual ambiguity appears, pause because the design brief is incomplete. Do not silently choose taste directions.
- Avoid interrupting live operations unless explicitly asked.

## AI design package

For user-facing code or copy, read the relevant AI design documents.

From this skill, the package lives at `../../design/`:

- `00-start-here.md`
- `01-design-philosophy.md`
- `02-ux-rules.md`
- `03-component-rules.md`
- `04-copy-and-microcopy.md`
- `05-fallback-copy.md`

Search by `TOPIC:`, `COMPONENT:`, or keyword. Treat `must` as binding, `should` as the default, and `may` as allowed.

## Finished-product bar

No proof-of-concept shortcuts.

- Fix causes, not visible symptoms.
- Keep behavior understandable, maintainable, and consistent years later.
- Prefer existing patterns, primitives, helpers, schemas, and contracts.
- Add abstractions only when they remove real complexity or match an established pattern.
- Include loading, empty, success, error, disabled, and edge states where the feature can reach them.
- Verify critical logic and user-facing flows at a level proportional to risk.
- Before saying done, reread touched files, remove duplicates/dead code, check at least one adjacent edge case, and confirm the change fixed the cause.

## Implementation philosophy

- Reuse existing primitives, patterns, helpers, and tokens before adding custom code.
- If the clean fix belongs in an owning component, helper, service, schema, or data owner, fix it there.
- Do not patch a parent, consumer, or surrounding context to hide a lower-level problem.
- Avoid inline style fixes, duplicated token values, deep selectors, specificity fights, bypass flags, and one-screen exceptions for shared bugs.
- Dependencies are architectural decisions. Search for built-ins, existing primitives, or small maintainable local code first; flag new packages before installing them.
- Edit in place. Do not append duplicate selectors, props, branches, or functions to work around earlier edits.
- Comments should explain intent, constraints, browser quirks, magic numbers, or cross-layer behavior, not restate obvious code.
- Invalid prop, state, or input combinations should fail clearly and locally instead of rendering broken output.

## UI implementation

If the brief touches user-facing UI and design is not resolved, use `designer` first.

When building UI:

- Extend shared primitives or patterns when behavior belongs in the system.
- Components own internal padding, chrome, state, and behavior. Containers own gaps, margin, width, and layout.
- Use normal document flow first: grid, flex, intrinsic sizing, and component-owned layout.
- Use absolute positioning only for true overlays, anchored layers, decorative layers, or visually hidden accessibility helpers.
- Use z-index only for real layering, not to make clicks work or force local stacking.
- Keep presentation in stylesheets; let logic toggle classes and state.
- Use semantic tokens directly by purpose.
- Choose mood for semantic intent and color only when hue itself is user-facing meaning.
- Use `heading`, positive booleans, `value`/`valueChange`, intent-based outputs, `variant` for structure, and `type` for native or functional behavior.
- Update documentation/reference surfaces when public component props, slots, variants, or states change.

## Data and backend

- Validate inputs at the boundary.
- Use explicit schemas or contracts for persisted and cross-layer data.
- Keep client type, server/API normalizer, schema, persistence, and tests aligned when a shape changes.
- Write user-owned data atomically when persistence matters.
- Preserve user input after failures.
- Keep secrets out of code and docs.
- Emit or log meaningful state changes when traceability matters.

## Verification

- Use the cheapest meaningful verification first.
- Run typecheck/build/test commands that match the risk and touched surface.
- Use browser verification when rendered behavior, layout, interaction, responsive behavior, or accessibility confidence is below 90%.
- Do not claim browser verification unless it actually ran.
- If a test cannot run, say what blocked it and what was verified instead.

## Handoff

Final updates should emphasize:

- what changed
- what is still wrong or uncertain
- what was verified
- what decision remains, if any

Avoid padded accomplishment lists. Keep the user oriented around product impact and risk.
