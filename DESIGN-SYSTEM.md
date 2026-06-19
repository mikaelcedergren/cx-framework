# Cortex Design System

This is the home document for the Cortex design system.

Cortex has one visual voice. The assistants decide what matters; the design system decides how that information reaches the user. Every visible surface should feel calm, focused, legible, and consistent, whether it is the dashboard, Luma, Paper Cuts, settings, messages, or the component reference.

The design system is not decoration. It is how Cortex stays trustworthy.

Read this document before changing tokens, primitives, patterns, component APIs, component reference controls, or page-level UI styling. It describes the thinking behind the system, not only the current files.

## Source Of Truth

The design system lives in this package.

- `tokens/` contains color, spacing, type, radius, shadow, motion, borders, sizes, breakpoints, and stacking.
- `icons/` contains raw icon assets and the generated icon manifest.
- `primitives/` contains low-level reusable `cx-*` components.
- `patterns/` contains composed UX building blocks.
- `tooling/` contains framework-internal reference and inspection tools.
- `support/` contains metadata, rules, and prompts used to reason about the framework.

The live component reference is the product-facing documentation surface. When a public component prop, slot, variant, or state changes, the reference must show it.

This document is the agent-facing design-system reference. It should explain why the system works the way it does so future changes do not drift back into one-off local taste.

Broader design judgment comes from:

- `docs/PURPOSE.md` for the chain: purpose -> role -> information -> component -> token.
- `docs/DESIGN-CODE-PHILOSOPHY.md` for taste, clarity, naming, and collaboration rules.
- The compiled `ux-foundation/.ai/compiled/` files for shared UX rules and fallback microcopy.

## North Star

Cortex should make life calmer, more focused, and richer.

The UI should:

- reduce noise instead of displaying everything with equal importance
- make the next useful thing obvious
- preserve attention by staying visually quiet until something matters
- feel consistent enough that the user trusts the information before inspecting it
- use warmth only where warmth helps, not where precision is needed

## Product Chain

Nothing user-facing should skip the chain:

```text
purpose -> role -> information -> component -> token
```

First decide why the thing exists. Then decide which role owns it. Then shape the information. Then choose or extend a component. Only then touch tokens.

If a screen starts from a layout idea, a favorite style, or a local workaround, it is already drifting.

## Design Philosophy

Clarity wins.

Use the fewest visible elements needed to make the structure understandable. Density is fine; clutter is not.

Mental fit matters.

Structure, naming, grouping, and hierarchy should match how the user thinks about the work. If the UI is technically correct but mentally awkward, redesign it.

The system comes first.

Before reaching for a custom fix, check whether the system already has the answer: a component, pattern, prop, variant, slot, token, or support rule. When the system lacks what a feature needs, extend the system in the same task and then use what was added.

Affordance must stay visible.

Calm does not mean hidden. Interactive things need to look reachable. Current location, selected state, focus, and destructive actions should not be subtle guesses.

## Color Architecture

Cortex color is layered:

```text
foundation palette -> semantic colors -> surfaces, ink, opacity, and components
```

Tokens are semantic. They name a role, not a color.

### Foundation Palette

The foundation palette contains raw named colors:

- `--blue`
- `--cyan`
- `--lime`
- `--green`
- `--yellow`
- `--orange`
- `--tangerine`
- `--red`
- `--pink`
- `--purple`
- `--violet`

Each palette color has:

- a base color
- an `-alt` color for darker, lighter, hover, active, or stronger contrast needs
- an `-opacity` color for quiet fills, status backgrounds, and subtle colored surfaces

Use the palette directly only when the color itself is the user-facing meaning: user-picked tag colors, chart series, color swatches, or a component where hue is the data.

For everything else, use a semantic color.

### Semantic Colors

Semantic colors are primarily used through component props such as `mood`.

Canonical `mood` values:

- `default`
- `primary`
- `accent`
- `success`
- `warning`
- `danger`
- `info`

`default` is a real neutral state. It means "normal, non-semantic, no special mood." It is not the same as `none`.

Use `none` only when something is absent: no icon, no action, no badge, no selected value, no preview width. If a control shows both `default` and `none`, each must mean a different thing.

Current semantic mappings:

- `default` uses neutral surface, ink, and opacity tokens rather than a colored mood
- `--primary` uses `--violet`
- `--accent` uses `--cyan`
- `--info` uses `--blue`
- `--success` uses `--green`
- `--warning` uses `--orange`
- `--danger` uses `--red`
- `--emphasis` is the strongest high-contrast action surface, but it is not a standard `mood` value unless a component explicitly documents it

Semantic colors also expose opacity and alternate forms where applicable, such as `--primary-opacity` and `--primary-alt`.

Use semantic colors for intent, not decoration. `danger` means risk or destruction. `success` means completion or health. `warning` means caution. `info` means neutral information.

`primary` means the one main forward action in one area of the page. Do not show more than one primary action in the same area.

`accent` is supporting emphasis only. It should be rare, and every use should have an explicit reason. Do not use `accent` as a second primary action.

`emphasis` is reserved for the strongest contrast moment.

Use `mood` for semantic intent. Use `color` only when the hue itself is the user's choice or the data being shown, such as avatars, tags, chart series, and color picker swatches.

Do not name a semantic prop `color`. If the options are `default`, `success`, `warning`, `danger`, or `info`, the prop should be `mood`.

### Surfaces

Surfaces are solid colors that content sits on.

- `--surface-mid` is the default app background.
- `--surface-low` is for areas perceived as lower or behind the main content, such as side navigation.
- `--surface-high` is for stronger surface contrast when a grounded zone needs to read above the default surface.

Do not stack surfaces to fake depth. Surface levels mark page-relative position. Floating elements such as popovers, dropdowns, dialogs, and tooltips use border and shadow, not a higher surface.

### Ink And Opacity

Ink tokens are for content, hierarchy, and quiet structure.

- `--opacity-high` is the default readable text color for most body copy, descriptions, hints, secondary labels, and subdued icons.
- `--ink` is for prominent text, active values, key labels, headings, selected state, and actionable icons.
- `--on-ink` is text or icon color placed on an ink-colored or dark solid fill.
- `--on-emphasis` is text or icon color placed on an emphasis fill.
- `--opacity-mid` is for lines, borders, separators, and medium-strength structure.
- `--opacity-low` is for very discreet backgrounds and quiet hierarchy on the same surface.
- `--opacity-darken` is for subtle pressed or shaded effects.
- `--opacity-disabled` controls disabled visibility.
- `--overlay-backdrop` is for modal or overlay backdrops.

Opacity tokens are theme-aware. They adapt across light, dark, night, and high-contrast themes so the same component can keep its role on different surfaces.

Default text should not automatically be `ink`. Start with `opacity-high` for ordinary copy, then promote to `ink` only when the text is the thing the user should act on or anchor on.

`opacity-mid` should feel intentionally quiet. It is good for placeholder-like content, subtle placeholder components, borders, table header text, and secondary controls that should not compete with the main content.

`opacity-low` should almost disappear. Use it for soft fills, hover rows, and quiet structure; do not use it for readable text except placeholder ghost content where legibility is intentionally reduced.

### Color Use

Color impact depends on surface area. A small splash reads as detail; a large field reads as mood.

Neutral surfaces are the default. Most operational UI should stay on surfaces, with semantic color used for action, state, and meaning.

Use large colored fills carefully. A large colored area must earn its place because it changes the mood of the whole screen.

Meaning must never rely on color alone. Pair color with label, icon, shape, position, or weight.

## Themes

The token model is designed to pivot across themes.

Current theme layers include:

- light
- dark
- night
- high contrast

Components should be written against semantic tokens so theme changes do not require local rewrites. If a component only works because it picked a literal color, the component is not theme-ready.

## Spacing And Size

Spacing and sizing follow a 4px factor.

Named spacing tokens:

- `--space-2xs`: 2px
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 64px

Other 4px multiples can appear when a component needs exact geometry or alignment, such as 12px, 20px, or 28px. They should still feel like part of the same scale, not arbitrary one-off spacing.

Spacing has three jobs:

- components own internal padding
- containers own gaps between children
- pages own the big spacing between sections

Default gaps:

- 8px for close relationships, such as labels, text, metadata, and small inline groups
- 16px for separate groups, form fields, filled controls, panels, and other visually heavier elements
- 24px or more only for major page pauses or clear mental shifts

Typography is exempt from the 4px factor. Type is fitted for perception, not forced onto the grid.

Spacing follows relationship first, then visual weight. Heavier elements need more room around them. A line of text can sit close to another line of text; a form field usually needs more space because the field itself has more visual weight.

Avoid large airy marketing-style gaps. Cortex is an operational product, so bigger pauses should clarify the page, not make it feel like a landing page.

### Component Size Defaults

Default size is the product baseline.

Controls should default to:

- `size="default"`
- `--controller-size`: 32px
- `--font-size-body`: 14px
- `--font-weight-regular`: 450, or `--font-weight-medium`: 550 for action labels

Use `small` only when the component is genuinely secondary, compact, metadata-like, or inside a dense repeated structure. Do not use `small` as the default just because it looks tidy in isolation.

Use `large` rarely, for deliberately prominent controls, editor surfaces, or roomy inputs where the larger touch target or type size carries meaning.

If a component has no size prop, it should still feel like the default size unless the component's role clearly says otherwise.

## Type

Typography should describe document structure, not merely visual strength.

Use headings for actual hierarchy. Do not use a heading only to make text louder. Do not add letter spacing as decoration.

Type should help the user scan:

- larger type for real page and section hierarchy
- body type for operational content
- smaller type for labels, metadata, helper text, and compact details
- weight only when it improves scanning or state recognition

Current type scale:

- `--font-size-title-1`: 24px
- `--font-size-title-2`: 18px
- `--font-size-title-3`: 16px
- `--font-size-body-lg`: 16px
- `--font-size-body`: 14px
- `--font-size-body-sm`: 12px
- `--font-size-body-xs`: 10px

Current weights:

- `--font-weight-regular`: 450
- `--font-weight-medium`: 550
- `--font-weight-bold`: 700

Most component text should be `--font-size-body`, not `--font-size-body-sm`.

`--font-size-body-sm` is for labels, helper text, metadata, compact table header text, captions, and secondary detail. It should not be the default font size for buttons, inputs, menu options, or main values.

`--font-size-body-xs` is tiny. Use it only for badges, shortcut keys, chart tick labels, dense counters, and similar micro-content.

Use `--line-height-body` for readable body text and `--line-height-small` for small/tiny text or tight control labels. Avoid raw line-height values unless the component is doing precise icon/SVG geometry.

## Radius, Shadow, Motion, And Depth

One thing gets one box.

Avoid stacking border, tinted background, nested card, heavy type, and shadow on the same unit. Visual weight has to earn its place.

Use named radius tokens. Larger soft radii are reserved for chips, avatars, and pill buttons. General containers should stay disciplined.

Use shadow only for floating elements or real elevation. Grounded page zones should use surface, opacity, spacing, and borders.

Motion should clarify state change. Not everything needs to animate. Never animate the page out from under the user while they are reading.

## Icons

Cortex uses its own icon library through `icons/`.

Use system icons for controls, navigation, state, and scanability. Do not draw one-off icons in a page when a library icon exists.

Icons should support meaning, not decorate the surface. When an icon-only control is not obvious, pair it with a tooltip or accessible label.

### Icon Pipeline

Icon source assets are handed off from `ux-foundation/icons/src` into `icons/svg/`.

Sync the full upstream icon set when updating icons, not only missing files. Existing SVGs may have been repaired upstream, and Cortex should receive those fixes too.

After syncing, regenerate the manifest with:

```sh
pnpm --filter @mikaelcedergren/cx-framework icons
```

The generated manifest is the Cortex lookup surface. Do not hand-edit generated icon entries.

## Components And Patterns

The design system has three framework layers:

- primitives: low-level reusable `cx-*` components
- patterns: composed UX building blocks
- tooling: reference and inspection surfaces used to understand the system

Use primitives for direct UI parts:

- actions
- inputs
- navigation
- overlays
- feedback
- display
- data
- layout
- media

Use patterns for recurring product shapes:

- page headers
- side navigation
- top bars
- detail panels
- action bars
- empty states
- filter bars
- table views
- wizard dialogs

Use tooling for framework-only reference surfaces:

- workbenches
- variant comparison surfaces
- catalog inspection helpers

Tooling may be exported for the component reference, but it is not product UI. Do not use tooling components in app workflows unless the app is itself documenting or inspecting the design system.

If a feature needs behavior that belongs in a shared primitive or pattern, extend the system there and consume it from the page. Do not build a private page-level version of an existing component.

## Component Discipline

Components are sealed.

A component owns its template, styles, padding, chrome, state, and rules. Pages and containers own where the component sits, how wide it is, and the gap around it.

Do not fix component behavior from the outside with deep selectors, parent stylesheet patches, inline styles, duplicated token values, or specificity fights.

Fix behavior at the deepest piece that owns it. If the clean fix belongs in a primitive, grow the primitive API first.

Each component should make clear what it controls and what the page is allowed to control. A button controls its own padding, color, radius, and states. The page controls where the button appears and the space around it.

Conditional content should vanish from the DOM when empty. No empty wrappers, headings, labels, or slots.

Invalid prop combinations should fail clearly in the component's own surface instead of quietly rendering broken chrome.

Two elements that look similar must behave similarly. Visual consistency is a behavioral contract.

## Component APIs

Prefer existing props and data shapes before adding new ones.

Expose fewer props by default. Add a prop only when pages have a real, repeatable need to vary something. The design system should decide defaults; pages should not decorate components.

Name props after the user-facing concept they control, not the CSS detail they happen to change. Prefer names like `mood`, `density`, or `emphasis` over names like `backgroundColor` or `hasBorder`.

Use:

- `heading`, not `title`, for component-facing heading text unless the data model genuinely uses title as content
- positive booleans such as `dismissible`, `optional`, `disabled`, and `loading`
- `prependIcon` and `appendIcon` for icons before or after text
- `value` and `valueChange` for interactive components unless a sibling convention is stronger
- intent-based outputs such as `dismiss`, `select`, `submit`, or `clear`
- `variant` for structural chrome
- `type` for native or functional behavior
- `mood` for semantic color intent
- `color` only for direct user/data hue choices
- `density` for information density such as `compact` or `comfortable`
- `placement` or `align` for position/alignment choices

Keep `variant` and `mood` separate. `variant` changes structure or chrome. `mood` changes semantic intent. Do not put mood values into `variant`, and do not put structural choices into `mood`.

Common distinctions:

- `mood`: semantic intent, such as `default`, `success`, `warning`, `danger`, or `info`
- `color`: direct palette choice, such as `cyan`, `violet`, or user-picked tag color
- `variant`: structural chrome, such as `default`, `ghost`, `solid`, `outline`, or `flat`
- `size`: component scale, usually `small`, `default`, `large`
- `density`: information density, usually `compact` or `comfortable`
- `dismissible`: the user can dismiss it; use this spelling, not `dismissable`
- `disabled`: unavailable
- `loading`: work is happening
- `selected`: currently selected

Avoid:

- negated correction props such as `noBorder` or `hideLabel`
- companion booleans that only make sense together
- outputs named after DOM mechanics, such as `clicked`
- new words for existing concepts

Booleans should be true on/off capabilities or states. If something has more than two meaningful faces, give it a named option instead of several booleans.

Use slots rarely. A slot is for cases where different content really needs to sit inside the component. It is not for styling freedom, and it should still have clear limits.

Component sizes are `small`, `default`, and `large`. Numeric sizes belong to measurement primitives or component internals.

Default prop values should match the actual default state shown in the component reference. If the default state has no icon, the icon prop should be `none`, not `default`. If the default state has a neutral mood, the mood prop should be `default`, not `none`.

## States

Every visible component must account for the states it can actually reach:

- default
- hover
- focus
- active or selected
- disabled
- loading
- empty
- success
- warning
- error

Hover effects belong only on interactive elements.

Disabled controls should not strand the user. Prefer keeping actions reachable and explaining what is missing when the user tries. If something is permanently unavailable or irrelevant, hide it.

Loading should reduce uncertainty. Use a spinner for unknown duration, progress for measurable work, and skeletons when content shape is known.

Empty states need a short explanation and a useful next step. The empty-state pattern should carry multiple faces rather than spawning separate local empty components.

## Layout And Navigation

Components own padding. Containers own gaps. Pages own big spacing between sections.

Show the needed information, but use less UI around it. Dense data is fine; dense chrome is the problem.

Desktop is primary. Below the mobile breakpoint, the shell switches to a phone layout. There is intentionally no separate tablet design tier.

Navigation should mirror the user's mental model, not the code structure. Important destinations should live close to where the cursor naturally lives. Active state should be obvious, not merely slightly tinted.

Do not move navigation casually. Users remember positions before labels.

Use breadcrumbs only when the product has real depth. Back goes where the user came from, not to a generic previous route guess.

## Feedback And Messaging

Feedback should reduce uncertainty more than it reduces wait time.

- Success messages name what happened in one short sentence.
- Failure messages explain what the user can do next.
- Spinners should appear near the user's attention and use words when the wait is meaningful.
- Progress bars are for measurable progress.
- Notifications should interrupt only when the interruption is earned.
- Banners are for critical messages that require user action before continuing.

Operational surfaces should be concise. Warmth belongs in onboarding, empty states, and sidebar guidance.

Errors are not the place for personality.

## Forms And Validation

Validate on blur, not on every keystroke, unless the control has no meaningful blur moment.

On submit, validate everything and show every error in one pass. Scroll to the first error when needed.

Show field-specific errors at the field, not in a banner.

Write errors that guide, not blame:

- good: `Enter a valid email address`
- wrong: `Invalid email`

Remove errors the moment they are no longer true. Never reset the form on error.

Be forgiving with input formats. Accept reasonable date, phone, and typed formats; convert internally.

## Copy

Use plain sentence case.

Buttons name the action, not the state. Avoid vague labels such as `Confirm`, `Submit`, `OK`, or `Yes` when the specific action can be named.

Match button verbs to dialog nouns. A delete dialog gets a `Delete file` action, not `Confirm`.

Missing values should use contextual words:

- `None` when the field exists but has no data
- `Pending` when data is being collected
- `N/A` when the value does not apply
- `-` only as a purely visual placeholder

Prefer user-facing domain language over implementation names.

## Accessibility

Accessibility is perception.

Every interactive element must be keyboard reachable. Focus must be visible. Contrast must survive real screens and real lighting. Meaning must be encoded through more than color.

If the user has to hunt for what is focused, selected, clickable, current, disabled, dangerous, or broken, the design system has failed.

## Component Reference

The component reference is live documentation.

The plain default state should appear first. Optional props should start inactive or empty.

New public behavior should be visible with controls that reveal the prop type:

- switches for booleans
- text fields for strings
- number fields for numeric values
- sliders for bounded ranges
- button groups for small option sets
- selects for larger option sets

The default state matters. It should show the component as it is meant to be used most often, not a maximal demo.

Default-state review wins over historical implementation. If the existing component has props that are not represented in the reference, either remove them or flag them for a deliberate decision.

The reference should not include props just because they are technically possible. It should include the public API that belongs to the component.

Shared workbench controls such as preview width, min size, and alignment belong to the workbench. Component-specific controls belong to the component section.

The moodboard is also a reference surface. It should present real Cortex components and expose visual issues; it should not receive local styling patches that hide component problems. If something looks wrong on the moodboard, fix the owning component or token.

## What Is Wrong

These are design-system smells:

- one-off UI where a `cx-*` primitive or pattern exists
- a page reaching into component internals
- inline styles for layout or visual fixes
- hardcoded token values
- local aliases that rename tokens without adding a real boundary
- nested cards or too many boxes
- stacked surfaces used as fake depth
- large marketing-style gaps in operational screens
- decorative weight that does not improve scanability
- multiple primary actions in the same area
- `accent` used as decoration or as a second primary action
- ambiguous action labels
- props named after CSS details instead of user-facing concepts
- booleans used where a named option would be clearer
- slots used for styling freedom
- color-only meaning
- hidden focus
- hover effects on non-interactive elements
- empty wrappers or headings
- disabled controls with no way to understand what is missing
- local copy that explains implementation instead of user value

When any of these appear, fix the cause in the system rather than polishing the symptom.
