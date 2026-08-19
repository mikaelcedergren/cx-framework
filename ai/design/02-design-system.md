# Design-system use contract

Platform-neutral contract for applying this design thinking through the design system that exists in the consuming product.

> **Normative language:** `[MUST]` is mandatory; `[SHOULD]` is the default unless a concrete product reason justifies departure; `[MAY]` is optional; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. See `00-start-here.md` for the canonical definitions, precedence, and conflict handling.

[MUST] Read the relevant section before selecting, configuring, composing, changing, or replacing a design-system component, pattern, token, theme role, or layout foundation.

[MUST] Keep binding cross-cutting behavior in its owning portable rule; use this document to explain how those rules apply to design-system discovery and use.

## Component words describe roles

[NOTE] Under `RULE-ID: system.component-terms`, a component-family word such as button, icon button, dialog, tabs, menu, tooltip, table, or detail panel describes a semantic role. It does not prescribe a component name, import, property, class, markup shape, rendering technology, or internal implementation.

[NOTE] A product may provide a dedicated icon-button component, configure its ordinary button component for icon-only use, or compose the role from supported button and icon capabilities. Those implementations are equivalent only when they preserve the required role, behavior, state, hierarchy, accessibility, and visual character.

[MUST] Apply `RULE-ID: system.component-terms` and `RULE-ID: system.component-resolution` whenever this corpus names a component family.

## Discover the consuming product's system

[MUST] Establish what the consuming product actually supports before choosing an implementation. Inspect the smallest relevant set of local evidence:

- local product and repository instructions
- local design-system documentation and examples
- installed UI dependencies and shared modules
- exported or otherwise supported components and patterns
- semantic tokens and theme foundations
- nearby established usage that demonstrates the current supported contract

[MUST] Prefer authoritative documentation and supported use over guesses based on names or visual similarity.

[MUST] Do not assume that a familiar component name exists, that two platforms expose the same options, or that a visually similar local example fulfills the same behavioral role.

[MUST] When local evidence conflicts, apply the precedence in `00-start-here.md`; surface unresolved binding conflicts instead of silently blending them.

## Resolve a component role

[MUST] Apply `RULE-ID: system.component-resolution` without skipping from discovery to custom UI, and apply `RULE-ID: system.default-first` at every supported step.

[NOTE] For example, an icon-only button may resolve through a dedicated local component, an ordinary button's supported icon-only configuration, or a supported composition. A different code shape is not a reason to skip the binding resolution process.

[MUST] Apply `RULE-ID: system.shared-owner` and `RULE-ID: system.no-external-patches` when the resolution process exposes a repeatable local-system gap.

## Product chain

[MUST] Nothing user-facing skips this chain:

```text
purpose → role → information → component role → local implementation → semantic token
```

[MUST] Decide why the information exists and who owns it before choosing a component role. [MUST] Resolve the role through the local design system before tuning presentation.

[NOTE] Beginning from a favorite style, a copied implementation, or an assumed component name starts at the wrong layer.

## Ownership and composition

[MUST] A shared component owns its internal structure, presentation, internal spacing, reachable states, and interaction behavior. A container owns placement, width, surrounding gap, and page composition.

[MUST] A shared component is responsible for being correct, complete, and predictable; using it correctly is the consumer's responsibility. A component never adds a defensive branch, tolerated bad input, or absorbing structure so that consumer misuse still looks acceptable. It makes correct use obvious, fails clearly otherwise, and the misuse is fixed at the call site.

[MUST] Use documented component boundaries. Do not reach into internal structure through deep selectors, inline visual patches, specificity escalation, duplicated token values, or wrapper tricks.

[MUST] Keep a focused change within its accepted owner. Using another component's supported behavior does not expand scope; changing that component does.

[MUST] A hidden or inactive component is inert. It does not react to global keyboard shortcuts, Escape, outside interaction, or other document-level behavior while absent from the visible experience. Once dismissal begins, an overlay accepts no further user action and preserves its established interaction boundary until teardown: a modal or otherwise blocking overlay continues to block lower surfaces, while a non-modal overlay preserves its documented outside interaction.

[MUST] When nested overlays are open, visual stacking and interaction ownership follow the same opening order. The topmost visible, active overlay alone owns and consumes Escape. An eligible dismissal follows the same controlled cancel or close path as its visible action; an overlay that cannot dismiss still consumes Escape before it can reach a lower overlay or page handler, and one keypress produces at most one action.

[MUST] Resolve any consumer-interceptable user cancellation or dismissal synchronously before the surface emits its established outcome or changes visibility, state, overlay ownership, motion, or focus. When the consumer blocks dismissal, preserve the original surface's rendering, state, open state, and overlay registration, and run no closing focus restoration or fallback. A nested confirmation opened by the handler may then take top interaction and focus ownership. When unblocked, preserve the established close behavior. Programmatic closure, destruction, and task-completion routes bypass user-dismissal interception.

[MUST] Restore focus only after a closing child overlay has torn down and the surviving surface's focus maintenance has settled. A newly opened top overlay takes precedence; otherwise the exact invoking control is the final focus target when it remains connected, visible, and focusable. When it does not, use a deterministic target inside the owning surviving parent surface, never the document body or unrelated content.

## Defaults and supported variation

[MUST] Show normal product use in the default state. Defaults are not maximal demonstrations, unusual scenarios, or invitations to expose every possible option.

[MUST] Prefer the minimum supported configuration. Add variation only when it expresses a meaningful difference in structure, intent, density, size, placement, state, or behavior.

[MUST] Keep the difference between these concepts clear even when the local implementation names them differently:

- semantic intent, such as primary, success, warning, or danger
- direct hue as user-facing data or choice
- structural variation
- functional or platform behavior
- information density
- physical size
- placement or alignment

[SHOULD] Prefer positive, user-concept options and intent-named events when changing a shared component's supported contract. [MUST] Do not require these exact words when the local system has an established alternative vocabulary.

[MUST] Apply `RULE-ID: system.component-state-contract` whenever a chosen component exposes a supported state.

[MUST] Apply `RULE-ID: system.no-empty-chrome` whenever optional content or supported variation can leave a user-facing control, wrapper, overlay, container, or surface without a visible purpose. [MUST] Invalid supported-option combinations fail clearly at the owning component instead of rendering misleading chrome.

## Semantic tokens and themes

[MUST] Use the consuming product's semantic tokens for their documented roles instead of raw visual values. Token names and resolved values may differ by platform; their design meaning remains stable.

[MUST] Keep semantic intent distinct:

- neutral for ordinary content and state
- primary for the main forward action in one action region
- accent for rare supporting emphasis, never a second primary
- success for completion or health
- warning for caution
- danger for destructive or risky intent
- information for neutral explanatory status

[MUST] Use direct hue only when hue itself is data or a user choice, such as a chart series, swatch, avatar, or chosen tag color.

[MUST] Use surface, text, border, overlay, elevation, spacing, typography, radius, and motion tokens according to the roles defined by the consuming product.

[MUST] Themes may change resolved color, typography, density, corner character, borders, frost, depth, and motion. They do not change a component's semantic role, state, behavior, accessible target, content hierarchy, or consequence.

[MUST] Components do not branch on a named theme or expose theme-specific styling controls. They consume stable semantic roles and let the theme resolve their visual character.

[MUST] Apply `RULE-ID: tokens.semantic`, `RULE-ID: tokens.theme-ready`, `RULE-ID: color.semantic-intent`, `RULE-ID: color.intent-vs-hue`, and `RULE-ID: accessibility.color-independent` to token and color choices.

## Spacing, type, radius, and depth

[MUST] Follow the consuming product's tokenized spacing rhythm. [SHOULD] Use closer spacing for strong relationships, more space for separate or visually heavier groups, and the largest pauses only for real mental or page-level shifts.

[SHOULD] When the product does not establish a more specific rhythm, start with 8px for close text-like relationships and 16px for separate or visually heavier groups. [SHOULD] Fit typography perceptually rather than forcing it onto the spacing grid.

[MUST] Use typography to express real hierarchy. Reserve display treatment for a genuine editorial or marketing headline; ordinary product titles, section headings, dialogs, labels, and body content use the product's application type roles.

[SHOULD] Use ordinary body text for most component copy. Reserve smaller roles for labels, helper text, metadata, captions, badges, shortcut keys, chart ticks, and other genuinely secondary content.

[MUST] Use radius and shadow according to their semantic roles. [SHOULD] Reserve stronger depth for floating surfaces; grounded regions rely on surfaces, spacing, opacity, and restrained boundaries.

[MUST] Motion uses the consuming product's named motion roles and clarifies state, orientation, or continuity. It never delays interaction or moves the page around someone who is reading.

## Layout foundations

[MUST] Use the consuming product's documented application shell, layout components, spacing tokens, breakpoints, and supported viewport range.

[SHOULD] Let ordinary product surfaces use the available canvas. Cap a specific readable text block when needed rather than imposing an arbitrary narrow shell on every page.

[SHOULD] Use the local stack, inline, grid, split, or equivalent layout capabilities for ordinary composition. [SHOULD] Use normal flow before manual positioning.

[MUST] Use defined stacking roles only for genuine layers such as overlays, anchored surfaces, and navigation planes.

[MUST] Apply `RULE-ID: layout.component-spacing`, `RULE-ID: layout.start-alignment`, `RULE-ID: layout.breathing-room`, `RULE-ID: layout.supported-viewports`, and `RULE-ID: layout.no-page-horizontal-scroll` to applicable layout work.

## Utility classes

[NOTE] A utility class is a single-purpose, token-backed helper the product exposes for elements an author writes by hand. Utilities exist for freedom at the edges of the system, not as a parallel styling language.

[MUST] Follow the authoring hierarchy: component first, layout primitive second, utility last. Reach for a utility only when no supported component, pattern, or layout capability expresses the intent.

[MUST] Never use a utility to patch, override, or reach inside a sealed component from outside. A component defect or gap is fixed in the component's owning layer, or logged for its owner.

[MUST] Use only utilities whose values resolve to semantic tokens. Do not introduce raw values, one-off classes, or inline styles to escape the utility set; a missing value is a token or utility gap to surface, not a license to hardcode.

[SHOULD] Treat more than three utilities on one element as a design smell: the composition is trying to be a component or pattern. Stop, use or propose the owning construct, and log the gap where the product tracks them.

[NOTE] A page built mostly from utilities has inverted the hierarchy even if every individual class is legal. The reviewable signal is proportion: utilities should read as occasional annotations on an otherwise component-composed surface.

## Accessibility and reachable state

[MUST] Treat `RULE-ID: system.reachable-states`, `RULE-ID: accessibility.keyboard`, `RULE-ID: accessibility.focus`, `RULE-ID: accessibility.semantic-structure`, `RULE-ID: accessibility.control-name`, `RULE-ID: accessibility.color-independent`, and `RULE-ID: interaction.unavailable` as acceptance criteria for every applicable component role.

[MUST] Keyboard focus remains distinct and visible. Pointer interaction does not permanently suppress the next keyboard focus indication.

[MUST] Account for every state the chosen local implementation can actually reach, including relevant default, hover, focus, active, selected, disabled, loading, empty, success, warning, and error behavior.

[MUST] A composition inherits the accessibility obligations of the semantic role it fulfills. Combining existing pieces does not reduce focus, keyboard, naming, state, or dismissal requirements.

## Icons

[MUST] Use the consuming product's established icon system when it has one. Keep icon style, optical size, stroke or fill character, and alignment consistent with nearby supported use.

[MUST] Treat icons as supporting communication. An unfamiliar or consequential action keeps visible text; an icon-only control still has a specific accessible name and a forgiving target.

[MUST] Do not copy an icon implementation from another platform merely because the semantic icon is similar.

## Verification and documentation

[MUST] When shared behavior changes, update every affected local source of truth together: implementation, documented capabilities, examples or reference surfaces, usage guidance, and relevant tests.

[MUST] Verify the claims that matter to the chosen role. Use tests for behavior, integration checks for supported use, and rendered interaction for layout, focus, keyboard, responsive, or accessibility behavior that cannot be established confidently from inspection.

[MUST] Probe the reachable risks rather than a ceremonial checklist. Relevant probes include empty and missing values, long and unbroken content, narrow and wide layouts, disabled and loading behavior, pointer and keyboard interaction, dismissal, invalid combinations, and nested overlays.

## Smells to stop

[MUST] Stop when you encounter any of these conditions:

- a custom implementation created before inspecting the local design system
- an assumed component name treated as a required implementation
- a copied component from another platform despite an adequate local capability
- a feature-level replacement for an established shared component or pattern
- a consumer reaching into shared-component internals
- a shared component defending itself against consumer misuse instead of the consumer being fixed
- an unexplained departure from local defaults or established usage
- raw visual values where suitable semantic tokens exist
- multiple primary actions in one action region
- color-only meaning, hidden focus, or false hover affordance
- a composition that drops behavior or accessibility required by its semantic role
- a custom fallback that introduces a second visual language

[MUST] Return to `RULE-ID: system.component-resolution`, fix the available owner when scope permits, or surface the ownership boundary. [MUST] Do not polish over the cause.
