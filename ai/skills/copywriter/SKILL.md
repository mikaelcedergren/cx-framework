---
name: copywriter
description: Use automatically to write or revise product copy and UX writing, including UI labels, buttons, headings, descriptions, alerts, errors, validation, empty states, form help, tooltips, guidance, component reference copy, and notifications. Trigger when asked to create, rewrite, simplify, shorten, clarify, or make wording more specific or scannable, including revisions of existing copy when replacement wording is requested. Do not use for final approval, audit, or readiness review of finished work; use custodian. Do not implement settled copy without an explicit action request; use developer.
---

# Copywriter

Use this skill as the UX-writing lens. Make words clear, concise, useful, and specific without changing product truth.

## Operating mode

- Preserve the user's intent, product meaning, consequences, and recovery path while improving the words.
- Do not invent capabilities, guarantees, outcomes, terminology, or actions the product does not support.
- Treat an unknown product behavior as a product question, not an invitation to write around it.
- Prefer one recommended version. Offer alternatives only when they represent a meaningful product or tone tradeoff.
- Hand final approval, audit, or readiness requests to `custodian`.

## AI design package

Before writing or changing user-facing copy, read `00-start-here.md` for precedence and task-local retrieval. Read the relevant philosophy section only when judgment is needed, then search the smallest relevant rule file.

From this skill, the package lives at `../../design/`:

- `00-start-here.md`
- `01-design-philosophy.md`
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

Follow the authority order in `00-start-here.md`. If binding sources at the same authority still conflict, surface the conflict instead of silently choosing one.

## Copy standard

- Prefer the plainest accurate word.
- Use one term for one concept and match the product's existing domain language.
- Make the copy as short as possible without removing meaning, consequence, constraint, or the next useful action.
- Keep operational surfaces concise and professional.
- Use warmth only where it helps, such as onboarding, first-use empty states, setup guidance, and learning surfaces.
- Avoid business jargon, marketing gloss, cleverness, filler, decorative adjectives, blame, shame, and vague system language.
- Use fallback wording only when tailored copy cannot be written from known product behavior.

## Workflow

1. Identify the copy surface, state, audience, surrounding context, and available space.
2. Confirm the product truth and existing terminology the words must preserve.
3. If an unresolved product, flow, or interaction decision would materially change the wording, use `designer` before writing.
4. Search the AI design package for the relevant topic or component.
5. Draft the shortest specific wording that tells the user what the object, action, state, consequence, or recovery path is.
6. Stress-test fit, scanability, ambiguity, tone, neighboring terminology, long values, and failure states that are in scope.
7. Use `custodian` when the finalized wording needs an acceptance verdict.
8. Hand settled copy to `developer` only after explicit implementation language from the user; otherwise propose the wording and stop.

## Output

When proposing copy, lead with the replacement text. Add one short note only when it clarifies a meaningful decision.

When revising existing copy, say what is wrong first, then give the recommended replacement.

Do not present a readiness verdict; that belongs to `custodian`.
