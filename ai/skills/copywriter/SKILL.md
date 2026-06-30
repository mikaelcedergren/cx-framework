---
name: copywriter
description: Use automatically for product copy and UX writing work: UI labels, button text, headings, descriptions, alerts, errors, validation, empty states, form help, tooltips, usage guidance, component reference copy, notification text, and rewrites that need to become simpler, clearer, shorter, more scannable, less fluffy, or less business-jargony.
---

# Copywriter

Use this skill as the UX-writing lens. Make words simple, clear, concise, useful, and specific.

## AI design package

Before writing or changing user-facing copy, search the AI design package.

From this skill, the package lives at `../../design/`:

- `02-ux-rules.md`
- `03-component-rules.md`
- `04-copy-and-microcopy.md`
- `05-fallback-copy.md`

Useful searches:

- `rg "TOPIC: copy" ../../design`
- `rg "TOPIC: microcopy" ../../design`
- `rg "TOPIC: errors|TOPIC: validation" ../../design`
- `rg "COMPONENT: buttons|COMPONENT: dialogs|COMPONENT: tabs" ../../design/03-component-rules.md`

Treat `must` as binding, `should` as the default, and `may` as allowed.

## Voice

- Prefer the plainest accurate word.
- Use sentence case.
- Keep one term for one concept.
- Prefer user-facing domain language over implementation names.
- Avoid business jargon, marketing gloss, cleverness, filler, decorative adjectives, blame, shame, and vague system language.
- Keep operational surfaces concise and professional.
- Use warmth only where it helps: onboarding, first-use empty states, setup guidance, and learning surfaces.
- Keep page and section descriptions to one purposeful line when possible.

## Microcopy rules

- Buttons name the action and, when useful, the object: `Delete file`, not `Confirm`; `Send invitation`, not `Submit`.
- Labels name the thing, not the instruction.
- Helper text explains what is needed only when the control is not self-evident.
- Tooltips are brief clarification, not documentation.
- Empty states say what happened and give the next useful step.
- Error copy says what is wrong and how to fix it.
- Validation copy sits close to the field when the issue belongs to one field.
- Form-level alerts are for request, permission, conflict, timeout, or service failures.
- Do not start fallback copy with `Please`.
- Never use `Invalid` alone.
- Keep fallback messages short unless the rule itself needs more.

## Workflow

1. Identify the copy surface: button, field, heading, description, alert, error, empty state, notification, guidance, or documentation.
2. Clarify the user's intent: what the user needs to understand or do next.
3. Search the AI design package for the relevant topic or component.
4. Draft the shortest copy that remains specific.
5. Stress-test the words in context: fit, scanability, ambiguity, tone, neighboring terminology, and failure states.
6. If copy depends on UX structure or product meaning, use `designer` first.
7. If copy must be implemented, hand it to `developer` after wording is settled.

## Output

When proposing copy, lead with the replacement text. If useful, add one short note about what changed.

When reviewing copy, say what is wrong first, then give a cleaner version.
