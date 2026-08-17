# Start here

This folder is the **portable design spec** for products on any implementation platform. It defines the design philosophy, design-system use, UX behavior, semantic component roles, accessibility, and product language.

## Normative language

The portable design spec uses four explicit levels:

- `[MUST]` is mandatory inside its stated scope. If compliance is impossible or conflicts with another `[MUST]` at the same authority, surface the conflict instead of improvising.
- `[SHOULD]` is the strong default. Depart only when a concrete product reason makes the default worse, and state the reason.
- `[MAY]` is explicitly permitted and entirely optional. It is not a recommendation or a weaker obligation.
- `[NOTE]` provides context, rationale, navigation, or examples. It is non-normative and cannot override a rule.

Structured `RULE-ID` entries express the normative levels as `TYPE: MUST`, `TYPE: SHOULD`, or `TYPE: MAY`; they do not use `TYPE: NOTE`, because non-normative context belongs in `DESCRIPTION`. Prose directives use the bracketed labels. A prose marker governs only the remainder of its paragraph or list item. If that clause directly introduces a list, table, or code block, the marker also governs each unmarked entry in that one child block. It never crosses a paragraph or heading boundary, and an explicit child marker overrides inherited force for that entry. Unlabelled prose with no inherited marker is `[NOTE]`. Only these uppercase keywords have normative meaning; ordinary lowercase words such as “must” or “should” inside explanations do not create another rule.

[MUST] Resolve authority and applicability before normative force. Discard rules outside their stated scope, then let a higher-authority source outrank a lower one regardless of level. At the same authority, `[MUST]` outranks `[SHOULD]`, which outranks `[MAY]`; `[NOTE]` has no normative force. Use specificity to refine compatible rules of equal force, but never let an implied exception or a more specific passage silently override a `[MUST]`. Surface conflicting `[MUST]` rules at the same authority.

[MUST] On first encounter, read this file, `01-design-philosophy.md`, and `02-design-system.md`. This establishes the judgment layer and the contract for applying the consuming product's design system.

[MUST] After that bootstrap, identify the decision in front of you and retrieve only the smallest relevant rules or component guidance; do not load the whole corpus for every task.

## Precedence

[MUST] Apply guidance in this order:

1. The user's current goal, intended outcome, and explicitly fixed constraints. A proposed interface choice is not a constraint merely because it appears in a request or prototype, even when described declaratively; treat it as a candidate unless the user expressly makes it non-negotiable.
2. The consuming product's local instructions, product truth, design-system contract, and documented component capabilities.
3. The platform-neutral design-system use contract in `02-design-system.md`.
4. The portable UX, component-role, and copy rules in this spec.
5. Fallback copy, only when known product behavior cannot support more specific wording.

[MUST] Treat the order above as authoritative. A portable-spec `[MUST]` does not override a higher-authority product contract.

## Task-local retrieval

[MUST] Start with the task, not the documents:

- Any user-facing decision: read `RULE-ID: system.semantic-coherence`, `RULE-ID: system.no-empty-chrome`, `RULE-ID: system.default-first`, `RULE-ID: surfaces.light-first`, `RULE-ID: content.scannable`, and `RULE-ID: layout.breathing-room` in `03-ux-rules.md` before making or judging the result.
- Product direction, hierarchy, flow, or visual judgment: read the relevant section of `01-design-philosophy.md`, then search `03-ux-rules.md`.
- Any component choice, mention, or implementation: read `RULE-ID: system.component-terms`, `RULE-ID: system.component-resolution`, `RULE-ID: system.use-existing`, `RULE-ID: system.default-first`, and `RULE-ID: system.shared-owner` in `03-ux-rules.md`, then inspect the consuming product's own design system before choosing an implementation.
- Design-system discovery, tokens, ownership, supported configuration, composition, theming, or layout foundations: read the matching section of `02-design-system.md`.
- Cross-cutting behavior, accessibility, layout, feedback, forms, navigation, or state: search `03-ux-rules.md` by `TOPIC:`, `SCOPE:`, or keyword.
- A named component family such as buttons, dialogs, or tabs: treat the name as a semantic role, inspect the consuming product's local components and established usage, then search `04-component-rules.md` by `COMPONENT:` for applicable role behavior. Never infer a selector, import, property name, or code structure from the portable term.
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
- [MUST] `02-design-system.md` owns platform-neutral design-system discovery, application context, ownership, tokens, themes, and foundations.
- [MUST] `03-ux-rules.md` owns portable cross-cutting behavior, including the binding component-resolution order; it contains no product workflow or copy catalog.
- [MUST] `04-component-rules.md` owns semantic component-role behavior; it never prescribes an implementation name or framework mechanic.
- [MUST] `05-copy-and-microcopy.md` owns all portable user-facing language rules.
- [MUST] `06-fallback-copy.md` owns parameterized wording patterns that never invent product policy.

[MUST] Keep concrete component catalogs, selectors, imports, property names, source paths, platform mechanics, deployment details, local safety rules, personal collaboration preferences, routes, reference-surface contracts, and runtime behavior in the consuming product's own instructions and documentation.

## Outcome index

[NOTE] These bootstrap outcomes route to their canonical rules; the named `RULE-ID` owns each requirement's exact force, scope, and exceptions:

- user mental model: `system.mental-model`
- coherent surface promise and behavior: `system.semantic-coherence`
- scannability and earned explanation: `content.scannable`, `surfaces.light-first`
- product truth and terminology: `copy.truth`, `copy.terminology`
- existing-system and shared ownership: `system.use-existing`, `system.shared-owner`, `system.no-external-patches`
- semantic component language and local resolution: `system.component-terms`, `system.component-resolution`
- perceivable state, feedback, affordance, and consequence: `interaction.visible-response`, `interaction.consequence`, `accessibility.focus`
- harm prevention and preserved work: `interaction.destructive-intent`, `interaction.preserve-work`, `interaction.unsaved-warning`
- keyboard and color-independent meaning: `accessibility.keyboard`, `accessibility.color-independent`
- confusion without user blame: `copy.no-blame`
