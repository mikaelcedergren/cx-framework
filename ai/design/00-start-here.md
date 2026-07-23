# Start here

This folder is the canonical portable design reference for AI agents. Use it for user-facing product, UX, component, interaction, accessibility, and copy decisions.

Do not load the whole package by default. Identify the decision in front of you, then read only the smallest relevant section or matching rule lines.

## Precedence

Apply guidance in this order:

1. The user's current request and explicit constraints.
2. The consuming product's local instructions, product truth, design-system contract, and public component API.
3. The portable rules in this folder.
4. Fallback copy, only when known product behavior cannot support more specific wording.

A more specific applicable rule wins over a general rule at the same authority. `must` does not override a higher-authority product contract. When two binding rules at the same authority still conflict, surface the conflict instead of silently choosing one.

## Task-local retrieval

Start with the task, not the documents:

- Any user-facing decision: read `RULE-ID: system.default-first` and `RULE-ID: surfaces.light-first` in `02-ux-rules.md` before considering non-default or additive options.
- Product direction, hierarchy, flow, or visual judgment: read the relevant section of `01-design-philosophy.md`, then search `02-ux-rules.md`.
- Cross-cutting behavior, accessibility, layout, feedback, forms, navigation, or tokens: search `02-ux-rules.md` by `TOPIC:`, `SCOPE:`, or keyword.
- A named component: search `03-component-rules.md` by `COMPONENT:`. Every returned rule carries its component name.
- Labels, buttons, guidance, validation, errors, empty states, dates, or tone: search `04-copy-and-microcopy.md`.
- Generic validation or request-failure wording: use `05-fallback-copy.md` only after product-specific copy is impossible.

Useful searches:

```sh
rg 'TOPIC: (accessibility|interaction|layout)' ai/design/02-ux-rules.md
rg 'COMPONENT: buttons' ai/design/03-component-rules.md
rg 'TOPIC: (validation|errors)' ai/design/04-copy-and-microcopy.md
rg 'RULE-ID: copy\.buttons' ai/design
```

## Rule grammar

Cross-cutting and copy rules use one self-contained line:

```text
RULE-ID: <stable-id> SCOPE: <applicability> TYPE: must|should|may TOPIC: <topic> RULE: <imperative> DESCRIPTION: <why or application detail>
```

Component rules also include:

```text
COMPONENT: <component-name>
```

An optional `EXCEPT:` field may narrow a rule. Exceptions must be explicit; do not infer one because a rule is inconvenient.

- `must` is a portable invariant inside its stated scope.
- `should` is the default when the local product has no stronger reason to differ.
- `may` is an allowed option, not a recommendation.

Stable `RULE-ID` values make duplicates and drift detectable. A rule belongs in one file only; other documents link to its ID instead of restating it.

## File ownership

- `01-design-philosophy.md`: judgment and taste, not operational rule duplication.
- `02-ux-rules.md`: portable cross-cutting behavior; no product workflow or copy catalog.
- `03-component-rules.md`: component-specific behavior; every rule is directly searchable by component.
- `04-copy-and-microcopy.md`: all portable user-facing language rules.
- `05-fallback-copy.md`: parameterized wording patterns that never invent product policy.

Consuming products keep deployment details, local safety rules, personal collaboration preferences, routes, framework reference-surface contracts, and runtime behavior in their own instructions.

## Non-negotiable outcomes

- Preserve the user's mental model over internal structure.
- Keep existing product truth and terminology intact.
- Use the existing system before inventing a new pattern.
- Make state, feedback, affordance, and consequences perceivable.
- Prevent accidental harm and preserve user work.
- Keep interaction keyboard reachable and meaning independent of color alone.
- Extend the shared owner instead of patching one consumer.
- Treat confusion as a design problem, not a user failure.
