# Start here

This folder is the canonical AI design reference authored in Cortex and distributed with `cx-framework`. Use it to understand the design philosophy, design-system contract, UX behavior, component use, accessibility, and product language.

On first encounter, read this file, `01-design-philosophy.md`, and `02-design-system.md`. This establishes the judgment layer and the real framework contract. After that bootstrap, identify the decision in front of you and retrieve only the smallest relevant rules or component guidance; do not load the whole corpus for every task.

## Precedence

Apply guidance in this order:

1. The user's current request and explicit constraints.
2. The consuming product's local instructions, product truth, design-system contract, and public component API.
3. The design-system facts and public component contract in `02-design-system.md`.
4. The portable UX, component, and copy rules in this folder.
5. Fallback copy, only when known product behavior cannot support more specific wording.

A more specific applicable rule wins over a general rule at the same authority. `must` does not override a higher-authority product contract. When two binding rules at the same authority still conflict, surface the conflict instead of silently choosing one.

## Task-local retrieval

Start with the task, not the documents:

- Any user-facing decision: read `RULE-ID: system.default-first`, `RULE-ID: surfaces.light-first`, and `RULE-ID: layout.breathing-room` in `03-ux-rules.md` before making or judging the result.
- Product direction, hierarchy, flow, or visual judgment: read the relevant section of `01-design-philosophy.md`, then search `03-ux-rules.md`.
- Tokens, public APIs, ownership, workbenches, source discovery, or framework layout: read the matching section of `02-design-system.md`.
- Cross-cutting behavior, accessibility, layout, feedback, forms, navigation, or state: search `03-ux-rules.md` by `TOPIC:`, `SCOPE:`, or keyword.
- A named component: resolve its public selector in `../../support/components/registry.json`, read its canonical record in `../../support/components/guidance.json`, then search `04-component-rules.md` by `COMPONENT:` for applicable component-pattern rules.
- Labels, buttons, guidance, validation, errors, empty states, dates, or tone: search `05-copy-and-microcopy.md`.
- Generic validation or request-failure wording: use `06-fallback-copy.md` only after product-specific copy is impossible.

Useful searches to run from this directory:

```sh
rg 'TOPIC: (accessibility|interaction|layout)' 03-ux-rules.md
rg 'COMPONENT: buttons' 04-component-rules.md
rg 'TOPIC: (validation|errors)' 05-copy-and-microcopy.md
rg 'RULE-ID: copy\.buttons' .
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
- `02-design-system.md`: Cortex and packaged `cx-framework` facts, tokens, ownership, public APIs, workbenches, and source discovery.
- `03-ux-rules.md`: portable cross-cutting behavior; no product workflow or copy catalog.
- `04-component-rules.md`: component-pattern behavior; exact public-component guidance comes from the structured component record.
- `05-copy-and-microcopy.md`: all portable user-facing language rules.
- `06-fallback-copy.md`: parameterized wording patterns that never invent product policy.

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
