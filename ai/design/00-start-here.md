# Start here

This folder is the **framework spec**: the canonical AI design reference authored in Cortex and distributed with `cx-framework`. It defines the design philosophy, design-system contract, UX behavior, component use, accessibility, and product language.

## Normative language

The framework spec uses four explicit levels:

- `[MUST]` is mandatory inside its stated scope. If compliance is impossible or conflicts with another `[MUST]` at the same authority, surface the conflict instead of improvising.
- `[SHOULD]` is the strong default. Depart only when a concrete product reason makes the default worse, and state the reason.
- `[MAY]` is explicitly permitted and entirely optional. It is not a recommendation or a weaker obligation.
- `[NOTE]` provides context, rationale, navigation, or examples. It is non-normative and cannot override a rule.

Structured `RULE-ID` entries express the normative levels as `TYPE: MUST`, `TYPE: SHOULD`, or `TYPE: MAY`; they do not use `TYPE: NOTE`, because non-normative context belongs in `DESCRIPTION`. Prose directives use the bracketed labels. A prose marker governs only the remainder of its paragraph or list item. If that clause directly introduces a list, table, or code block, the marker also governs each unmarked entry in that one child block. It never crosses a paragraph or heading boundary, and an explicit child marker overrides inherited force for that entry. Unlabelled prose with no inherited marker is `[NOTE]`. Only these uppercase keywords have normative meaning; ordinary lowercase words such as “must” or “should” inside explanations do not create another rule.

[MUST] Resolve authority and applicability before normative force. Discard rules outside their stated scope, then let a higher-authority source outrank a lower one regardless of level. At the same authority, `[MUST]` outranks `[SHOULD]`, which outranks `[MAY]`; `[NOTE]` has no normative force. Use specificity to refine compatible rules of equal force, but never let an implied exception or a more specific passage silently override a `[MUST]`. Surface conflicting `[MUST]` rules at the same authority.

[MUST] On first encounter, read this file, `01-design-philosophy.md`, and `02-design-system.md`. This establishes the judgment layer and the real framework contract.

[MUST] After that bootstrap, identify the decision in front of you and retrieve only the smallest relevant rules or component guidance; do not load the whole corpus for every task.

## Precedence

[MUST] Apply guidance in this order:

1. The user's current goal, intended outcome, and explicitly fixed constraints. A proposed interface choice is not a constraint merely because it appears in a request or prototype, even when described declaratively; treat it as a candidate unless the user expressly makes it non-negotiable.
2. The consuming product's local instructions, product truth, design-system contract, and public component API.
3. The design-system facts and public component contract in `02-design-system.md`.
4. The portable UX, component, and copy rules in the framework spec.
5. Fallback copy, only when known product behavior cannot support more specific wording.

[MUST] Treat the order above as authoritative. A framework-spec `[MUST]` does not override a higher-authority product contract.

## Task-local retrieval

[MUST] Start with the task, not the documents:

- Any user-facing decision: read `RULE-ID: system.semantic-coherence`, `RULE-ID: system.default-first`, `RULE-ID: surfaces.light-first`, `RULE-ID: content.scannable`, and `RULE-ID: layout.breathing-room` in `03-ux-rules.md` before making or judging the result.
- Product direction, hierarchy, flow, or visual judgment: read the relevant section of `01-design-philosophy.md`, then search `03-ux-rules.md`.
- Tokens, public APIs, ownership, workbenches, source discovery, or framework layout: read the matching section of `02-design-system.md`.
- Cross-cutting behavior, accessibility, layout, feedback, forms, navigation, or state: search `03-ux-rules.md` by `TOPIC:`, `SCOPE:`, or keyword.
- A named component: resolve its public selector in `../../support/components/registry.json`, read its canonical record in `../../support/components/guidance.json`, then search `04-component-rules.md` by `COMPONENT:` for applicable component-pattern rules.
- Labels, buttons, guidance, validation, errors, empty states, dates, or tone: search `05-copy-and-microcopy.md`.
- Generic validation or request-failure wording: use `06-fallback-copy.md` only after product-specific copy is impossible.

[NOTE] Useful searches to run from this directory:

```sh
rg 'TOPIC: (accessibility|interaction|layout)' 03-ux-rules.md
rg 'COMPONENT: buttons' 04-component-rules.md
rg 'TOPIC: (validation|errors)' 05-copy-and-microcopy.md
rg 'RULE-ID: copy\.buttons' .
```

## Rule grammar

[MUST] Encode every cross-cutting and copy rule as one self-contained line:

```text
RULE-ID: <stable-id> SCOPE: <applicability> TYPE: MUST|SHOULD|MAY TOPIC: <topic> RULE: <imperative> DESCRIPTION: <why or application detail>
```

[MUST] Include the component field in component rules:

```text
COMPONENT: <component-name>
```

[MAY] Add an `EXCEPT:` field to narrow a rule.

[MUST] Keep every exception explicit; do not infer one because a rule is inconvenient.

[MUST] Give every structured rule a stable `RULE-ID` so duplicates and drift remain detectable.

[MUST] Keep each rule in one owning file; other documents link to its ID instead of restating it.

## File ownership

- [MUST] `01-design-philosophy.md` owns judgment and taste, not operational rule duplication.
- [MUST] `02-design-system.md` owns Cortex and packaged `cx-framework` facts, tokens, ownership, public APIs, workbenches, and source discovery.
- [MUST] `03-ux-rules.md` owns portable cross-cutting behavior; it contains no product workflow or copy catalog.
- [MUST] `04-component-rules.md` owns component-pattern behavior; exact public-component guidance comes from the structured component record.
- [MUST] `05-copy-and-microcopy.md` owns all portable user-facing language rules.
- [MUST] `06-fallback-copy.md` owns parameterized wording patterns that never invent product policy.

[MUST] Keep consuming-product deployment details, local safety rules, personal collaboration preferences, routes, framework reference-surface contracts, and runtime behavior in the consuming product's own instructions.

## Outcome index

[NOTE] These bootstrap outcomes route to their canonical rules; the named `RULE-ID` owns each requirement's exact force, scope, and exceptions:

- user mental model: `system.mental-model`
- coherent surface promise and behavior: `system.semantic-coherence`
- scannability and earned explanation: `content.scannable`, `surfaces.light-first`
- product truth and terminology: `copy.truth`, `copy.terminology`
- existing-system and shared ownership: `system.use-existing`, `system.shared-owner`, `system.no-external-patches`
- perceivable state, feedback, affordance, and consequence: `interaction.visible-response`, `interaction.consequence`, `accessibility.focus`
- harm prevention and preserved work: `interaction.destructive-intent`, `interaction.preserve-work`, `interaction.unsaved-warning`
- keyboard and color-independent meaning: `accessibility.keyboard`, `accessibility.color-independent`
- confusion without user blame: `copy.no-blame`
