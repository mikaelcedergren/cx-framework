# Cortex design-system contract

AI-facing source of truth for the design system authored in Cortex and distributed through `cx-framework`.

> **Normative language:** `[MUST]` is mandatory; `[SHOULD]` is the default unless a concrete product reason justifies departure; `[MAY]` is optional; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. See `00-start-here.md` for the canonical definitions, precedence, and conflict handling.

[MUST] Read the relevant section before changing or consuming tokens, primitives, patterns, component APIs, workbenches, reference surfaces, or page-shell styling.

This document owns Cortex and `cx-framework` facts. Portable judgment and behavior live in the sibling philosophy, UX, component, and copy files.

[MUST] Link to portable rule IDs instead of duplicating them here.

## Critical contracts

1. [MUST] **Cortex is the source.** Author framework work under `framework/`; package it outward as `@mikaelcedergren/cx-framework`. Cortex never consumes or patches its packaged output.
2. [MUST] **Use the existing system first.** Inspect the registry, public component, sibling API, token, and pattern before adding local UI.
3. [MUST] **Fix the owning layer.** Shared behavior belongs in the shared component or pattern. A consumer does not hide an owning defect with deep selectors, inline visual fixes, duplicated token values, specificity battles, or wrapper hacks.
4. [MUST] **Keep component work focused.** Changing a different component's implementation, API, styling, or behavior requires explicit scope. [MAY] Use another component's public API without expanding scope.
5. [MUST] **Components are sealed.** Components own template, presentation, internal padding, state, and behavior. Containers own placement, width, surrounding gap, and page composition.
6. [MUST] **Workbenches are literal API inspectors.** They tell the truth about the public component contract; the complete rules are below.
7. [MUST] **Hidden components are inert.** A visually hidden instance does not react to document-level interaction.
8. [MUST] **Keyboard focus is distinct from pointer focus.** The primary outline appears for keyboard navigation and leaves when pointer input resumes.
9. [MUST] **Consumers migrate forward.** Cortex defines the component, token, and behavior contract;
   `cx-framework` packages it; consumers adopt it. Never add compatibility shims, legacy aliases,
   deprecated props, or restored behavior to preserve stale consumer usage.
10. [MUST] **Guidance ships with the component.** Every public component has one canonical structured guidance record. Component reference pages and AI retrieval consume that same record so usage advice cannot drift between audiences.

## Workbench contract

The user evaluates components through the workbench, not through source code. A workbench that lies creates bad design direction later.

### Public API fidelity

- [MUST] Expose every public input or prop.
- [MUST] Label every control with the exact public name or prop path, such as `mood`, `dismissible`, or `action.text`.
- [MUST] Do not expose implementation helpers, scenario presets, visual hacks, or workbench-only toggles as component props.
- [MUST] Put outputs and event demonstrations outside the prop-control list.
- [MUST] Project contextual workbench information through `[cxWorkbenchNote]`; the shell places it above the prop controls with a divider, keeping explanatory text out of the preview.
- [MUST] Keep component controls in one vertical stack; never place them side by side.
- [MUST] Make every control fill the full control-column width.
- [MUST] Keep preview width, preview height, alignment, and other shell controls in the shared workbench shell rather than the component's prop section.
- [MUST] Omit an individual shell control through its positive `show*Control` input when changing it cannot reveal meaningful component behavior; leave every applicable control visible.

### Control mapping

[MUST] Controls reveal the public type through this mapping:

- [MUST] boolean → switch
- [MUST] short string → text field
- [MUST] long, markdown, or multiline string → textarea
- [MUST] number → number field
- [MUST] bounded numeric range → slider only when the bound is explicit and exact entry is not primary
- [MUST] small finite union → button group
- [MUST] larger finite union → select
- [MUST] large searchable set, such as icons → searchable select
- [MUST] multi-select prop → multi-select control
- [MUST] optional or nullable prop → its real omitted, empty, or `none` state
- [MUST] object prop → controls for its public fields using exact paths such as `action.text`
- [MUST] array or collection → faithful repeated-item controls, or an explicit API review before the workbench is called complete

[MUST] Do not invent a fake default to avoid representing absence.

### Default and examples

- [MUST] Show the plain normal default first.
- [MUST] Start optional props inactive or empty.
- [MUST] Make workbench defaults match actual component defaults.
- [SHOULD] Use variants for believable in-context product examples. [MUST] Do not use them as pretend prop controls.
- [MUST] Use slot markers to show slot existence. [SHOULD] Use variants to show realistic slot content.

### Stress tests

[MUST] Before a component is called complete, probe every risk it can actually reach:

- long and unbroken strings
- empty values and omitted optional props
- minimum and maximum numeric values
- every mood, variant, and size
- disabled and loading states
- hover, keyboard focus, active, and selected states
- narrow and wide preview widths
- awkward but valid prop combinations
- invalid combinations that are expected to fail clearly

## Hidden-instance behavior

[MUST] A hidden component is inert. Document-level listeners — Escape, outside click, and global shortcuts — do not react in an instance that is not part of the visible UI, such as a CSS-hidden workbench or tab.

[MUST] Components whose surface renders inside their host gate these listeners on host visibility through `isHostVisible` in `../../primitives/shared/host-visibility.ts`. [MUST] Components that portal a surface to `body` gate listeners on their own open state because the visible surface can outlive the host's visibility.

## Keyboard focus

[MUST] The primary focus outline belongs to keyboard navigation only. Show it after Tab navigation and remove it as soon as the user returns to a mouse, trackpad, pen, or touch; pointer focus keeps the component's quieter active state.

[MUST] Install `provideCxKeyboardFocus()` once in a consuming application's configuration. [MUST] Do not recreate keyboard-modality logic per component.

## Source map and discovery

The same framework tree lives under `framework/` in Cortex and at the package root in the distributed `cx-framework`. From this document, the root is `../../`.

[MUST] Use the following package-root ownership map for source discovery:

- `tokens/`: semantic color, spacing, type, radius, border, shadow, motion, size, breakpoint, and stacking tokens
- `styles/`: global framework styles and utilities
- `fonts/`: packaged font assets
- `icons/`: canonical SVG sources and generated icon manifest
- `primitives/`: low-level reusable `cx-*` components
- `patterns/`: composed product building blocks
- `tooling/`: workbench and inspection components; not product UI
- `support/components/registry.json`: machine-readable public selector and source-path inventory
- `support/components/guidance.json`: canonical structured guidance for every public component, shared by component reference pages and AI retrieval
- `ai/design/`: the framework spec
- `ai/skills/`: portable role contracts that retrieve the smallest relevant part of this corpus

[MUST] Keep registry and guidance completeness aligned with the public export graph. [MUST] Explicitly classify internal and tooling-only selectors and keep them out of public product guidance.

[MUST] Before inventing a component or pattern, search the registry and source. From this document's directory:

```sh
rg '"name": "cx-' ../../support/components/registry.json
rg "selector: 'cx-" ../../primitives ../../patterns
```

Cortex package tooling validates the registry against source before export.

[MUST] The registry never advertises a removed selector or omits an existing public component or directive.

## Cortex → cx-framework → projects

Cortex authors components, tokens, icons, AI guidance, and reusable product standards. Packaging copies this source into the separate `cx-framework` repository.

[MUST] Consuming projects depend on `@mikaelcedergren/cx-framework`; they do not import Cortex, point dependencies at Cortex, copy framework source, or patch shared behavior in app code.

When another project reveals a reusable gap:

1. [MUST] Confirm the need belongs to the shared system.
2. [MUST] Change the owning Cortex framework layer within the accepted scope.
3. [MUST] Update its public API, workbench, guidance, and tests together.
4. [MUST] Package the framework.
5. [MUST] Let the consuming project update from the package.

## Product chain

[MUST] Nothing user-facing skips this chain:

```text
purpose → role → information → component → token
```

[MUST] Decide why the information exists and who owns it before choosing a component. [MUST] Choose or extend the component before tuning tokens.

A screen that begins from a favorite style or local workaround is already at the wrong layer.

## Color and token contract

[MUST] Tokens name roles, not appearances. Use the semantic token at the property that consumes it; do not create a local `--cx-*` alias merely to rename a system token.

[MAY] Keep a component custom property when at least one of these permitted conditions applies:

- it carries a real runtime value
- it creates an intentional consumer boundary
- it centralizes a reused derived calculation
- it coordinates a variant across multiple internal declarations

[MUST] Do not keep a component custom property when none of those conditions applies.

### Moods

[MUST] Use these canonical shared `mood` values:

- `default`
- `primary`
- `accent`
- `success`
- `warning`
- `danger`
- `info`

[MUST] Treat `default` as a real neutral state and `none` as absence; never use them interchangeably.

- [MUST] `primary`: the main forward action in one action region
- [MUST] `accent`: rare supporting emphasis, never a second primary
- [MUST] `success`: completion or health
- [MUST] `warning`: caution
- [MUST] `danger`: destructive or risky intent
- [MUST] `info`: neutral information

[MAY] A component can additionally expose `emphasis` as its strongest high-contrast mood only when that component explicitly owns the meaning.

[MUST] Use `mood` for semantic intent. [MAY] Use `color` only when hue itself is user-facing data or choice, such as a chart series, swatch, avatar, or tag color.

### Semantic mapping

[MUST] Use this semantic mapping for the built-in theme defaults unless the active theme explicitly overrides the resolved values:

- `--primary`: blue in light mode; violet in dark and night modes
- `--accent`: cyan
- `--info`: blue
- `--success`: green
- `--warning`: orange
- `--danger`: red

[MUST] Components use the semantic role, never the mapped palette name.

### Surfaces and ink

[MUST] Use surface and ink tokens according to these roles:

- [MUST] `--surface`: default app plane
- [MUST] `--surface-alt`: quiet alternate plane for recessed, framing, or grouped regions
- [MUST] `--opacity-high`: ordinary readable supporting text and subdued icons
- [MUST] `--ink`: prominent, selected, active, or actionable content
- [MUST] `--on-ink`: content on an ink-colored fill
- [MUST] `--on-emphasis`: content on emphasis
- [MUST] `--utility-bar-surface`: internal utility-bar plane
- [MUST] `--on-utility-bar`: content on the utility-bar plane
- [MUST] `--opacity-mid`: borders, separators, and medium structure
- [MUST] `--opacity-low`: quiet fills and near-background hierarchy; not readable body text
- [MUST] `--opacity-darken`: subtle pressed or shaded effects
- [MUST] `--opacity-disabled`: disabled visibility
- [MUST] `--overlay-backdrop`: dimming backdrop for modal and navigation overlays

[MUST] Do not stack surfaces to fake depth. [SHOULD] Use clear surface contrast and shadow for floating surfaces; use spacing, opacity, and restrained borders for grounded regions.

[MUST] Apply `RULE-ID: accessibility.color-independent` whenever semantic color carries meaning.

## Spacing, type, radius, and depth

[MUST] The base spacing scale follows this 4px rhythm unless the active theme explicitly overrides the resolved values:

- `--space-2xs`: 2px
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 64px

[SHOULD] Start with 8px for close text-like relationships and 16px for separate or visually heavier groups. [SHOULD] Reserve larger gaps for a real page pause. [SHOULD] Fit typography perceptually instead of forcing it onto the spacing grid.

[MUST] The default control size is `default`. [SHOULD] Use `small` for genuinely compact or secondary repeated UI. [SHOULD] Reserve `large` for rare, purposeful cases.

[MUST] Use this base type scale unless the active theme explicitly overrides the resolved values:

- `--font-size-display`: fluid 40–72px
- `--font-size-title-1`: 24px
- `--font-size-title-2`: 20px
- `--font-size-title-3`: 18px
- `--font-size-body-lg`: 16px
- `--font-size-body`: 14px
- `--font-size-body-sm`: 12px
- `--font-size-body-xs`: 10px

[MUST] Reserve display type for the primary headline in a marketing or editorial hero. Use
`--line-height-display` (1.05) with it. Ordinary page titles, section headings, dialogs, and other
application UI remain on the fixed title scale.

[SHOULD] Use body, not body-sm, for most component text. [SHOULD] Reserve small and extra-small type for labels, helper text, metadata, captions, badges, shortcut keys, chart ticks, and other genuinely secondary content.

### Theme visual character

[MUST] Themes own visual character through one shared token contract. Components never branch on a theme
class and never expose theme-specific styling props. A designer changes the theme profile; every
sealed component resolves the same semantic tokens differently.

- [MUST] `--corner-shape` controls the curve family. The modern profile uses `squircle`; conventional
  rounded corners use `round`.
- [MUST] `--corner-softness` controls the amount of rounding. The named non-pill radius scale derives from
  this one unit so a theme stays proportionate instead of redefining every component radius.
- [MUST] `--surface-separation` controls the visible inset and seam around and between separate surfaces in
  framed composites such as popovers, menus, dialogs, calendars, cards, and detail panels. It does
  not replace content spacing, control padding, or layout gaps.
- [MUST] `--floating-surface-border` controls the boundary used by elevated surfaces that otherwise rely on
  shadow. Other grounded and structural boundaries continue to use `--line` or `--line-discreet`.
- [MUST] `--frost-softness` controls backdrop blur intensity. [MAY] Components can derive stronger frost from the
  base unit. [MAY] A flat theme can set the unit to zero.
- [MUST] `--shadow-low`, `--shadow-mid`, and `--shadow-high` keep their semantic elevation roles. [MAY] Each
  theme can choose a soft, crisp, or flat depth profile.

[MAY] A theme can override the existing palette, semantic colour, border, spacing, size,
typography, and motion tokens. [MUST] Keep the token meanings stable: changing a theme does not change a
component's role, state, behavior, accessible target, or content hierarchy. [MUST] Semantic circles and
pills remain round regardless of the rectangular corner profile.

[MUST] Legacy is the final theme in every theme selector. It inherits Light's palette, semantic colours,
type, density, control sizes, and motion, then changes only visual character: conventional round
corners at 1px softness, 1px surface separation, visible floating boundaries, zero frost, and crisp
shadows. It is a transition profile, never a component variant.

[MUST] The default radius scale derives from `--corner-softness: 4px`:

- [MUST] `--radius-none`: 0
- [MUST] `--radius-xs`: 1 × corner softness
- [MUST] `--radius-sm`: 2 × corner softness
- [MUST] `--radius-md`: 3 × corner softness
- [MUST] `--radius-lg`: 4 × corner softness
- [MUST] `--radius-media-lg`: 6 × corner softness for large media corners
- [MUST] `--radius-xl`: 8 × corner softness
- [MUST] `--radius-2xl`: 16 × corner softness
- [MUST] `--radius-pill`: 999px

[MUST] Use named shadows only for real elevation:

- [MUST] `--shadow-low`: raised controls and small lifted elements
- [MUST] `--shadow-mid`: menus, dropdowns, popovers, and toasts
- [MUST] `--shadow-high`: dialogs and strong overlays

[MUST] Motion uses named tokens and clarifies change. It never moves the page around someone who is reading.

## Component API contract

[MUST] When a public API exposes one of these concepts, use the corresponding shared shape:

- [MUST] `heading`, not `title`, for component heading copy unless `title` is genuinely domain content
- [MUST] positive booleans such as `dismissible`, `optional`, `disabled`, and `loading`
- [MUST] `dismissible`, never `dismissable`
- [MUST] `prependIcon` and `appendIcon` for before/after icons
- [MUST] `value` and `valueChange` for interactive value components unless a stronger sibling convention exists
- [MUST] intent outputs such as `dismiss`, `select`, `submit`, or `clear`, not DOM mechanics such as `clicked`
- [MUST] `variant` for structural chrome
- [MUST] `type` for native or functional behavior
- [MUST] `mood` for semantic intent
- [MUST] `color` for hue-as-data
- [MUST] `size`: `small`, `default`, `large`
- [MUST] `density`: information density such as `compact` or `comfortable`
- [MUST] `placement` or `align` for position choices

[SHOULD] Avoid negated correction props, companion booleans that only make sense together, styling slots, and new vocabulary for an existing concept.

[MUST] Conditional content leaves the DOM when empty. [MUST] Invalid prop combinations fail clearly in the component surface instead of silently rendering broken chrome.

## Page and layout contract

[SHOULD] Treat desktop as the primary Cortex layout. [MUST] The shared mobile breakpoint is below 720px; there is no separate tablet tier.

[MUST] Authenticated pages use the shared page rhythm:

- [MUST] root: `cx-page`
- [MUST] first direct child: `cx-top-bar`, not a locally wrapped header
- [MUST] normal content: `cx-page__content`
- [MUST] bounded board/editor: `cx-page--bounded` with `cx-page__fill`
- [MUST] desktop padding: `--space-lg`
- [MUST] narrow padding: `--space-md`
- [MUST] page padding: global `--gutter-page`
- [MUST] top-bar inner padding: `--space-md`

[SHOULD] Let pages take the full canvas width by default. [SHOULD] Cap a specific readable text block, not the page shell. [MUST] Do not add custom padding to individual page roots.

[SHOULD] Use layout primitives for ordinary composition:

- [SHOULD] `cx-stack`: vertical flow
- [SHOULD] `cx-inline`: horizontal flow; wrapping is explicit
- [SHOULD] `cx-grid`: columns
- [SHOULD] `cx-split`: start/end groups

[SHOULD] Use normal flow before absolute positioning. [MUST] Use z-index only for genuine layering.

## Accessibility and state

[MUST] Treat `RULE-ID: system.reachable-states`, `RULE-ID: accessibility.keyboard`, `RULE-ID: accessibility.semantic-structure`, `RULE-ID: accessibility.color-independent`, and `RULE-ID: interaction.unavailable` as acceptance criteria for every applicable framework component and public contract.

## Icons

[MUST] Canonical SVG sources live in `../../icons/svg/`; `../../icons/manifest.ts` and `../../icons/index.html` are generated. Do not hand-edit manifest entries. Cortex authors run the owning icon validation and generation workflow documented in `../../icons/README.md`; downstream consumers use the packaged result and do not regenerate it.

## Verification and documentation

[MUST] When public behavior changes, update every affected item together:

- [MUST] component implementation and public API
- [MUST] workbench controls and defaults
- [MUST] realistic variants and slot markers
- [MUST] usage guidance
- [MUST] canonical structured guidance and the public component registry
- [MUST] relevant tests

[MAY] Use source inspection alone for predictable token-only changes. [MUST] Use rendered browser verification when layout, interaction, responsive behavior, accessibility, or Chrome behavior is not at least 90% predictable from source.

## Smells to stop

[MUST] Stop when you encounter any of these conditions:

- page-level replacement for an existing `cx-*` primitive or pattern
- consumer reaching into component internals
- local token aliases that add no boundary
- inline visual fixes or raw token values
- violations of portable `RULE-ID: surfaces.one-boundary` in `03-ux-rules.md`
- violations of portable `RULE-ID: surfaces.light-first` in `03-ux-rules.md`
- multiple primary actions in one action region
- color-only meaning
- hidden focus or false hover affordance
- workbench controls that do not map exactly to public props
- missing workbench states or fake workbench-only props
- component registry entries that disagree with source
- app code importing Cortex instead of the packaged framework

[MUST] Fix the owner or surface the scope boundary. [MUST] Do not polish over the cause.
