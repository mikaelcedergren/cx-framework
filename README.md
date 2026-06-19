# cx-framework

This package is the shared source of truth for Cortex design-system foundations.

For the design-system overview, read [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

It is organized into:

- `tokens`: SCSS design tokens and theme primitives
- `icons`: raw icon assets and icon manifest
- `primitives`: reusable low-level Cortex UI components
- `patterns`: composed Cortex UX building blocks
- `tooling`: framework-internal reference and inspection helpers
- `support`: metadata, rules, and prompt aids Cortex uses to reason about the framework

Applications should consume this package from GitHub instead of defining design-system source files ad hoc inside app folders.

The token layer is intentionally reduced to the high-level foundations Cortex needs
without carrying over a large legacy variable surface.

## Extending the framework

When an app feature reaches for behavior that logically belongs to a primitive or pattern, extend the framework component rather than inlining one-off logic in the page. Add the prop/API to the `cx-*` component, keep sibling components consistent (e.g., the same prop name/semantics across `cx-input` and `cx-textarea`), and consume it from the page. Only deviate when the feature genuinely does not belong in a shared component/pattern.

## Component discipline

- Components are sealed: a component owns its template, styles, and rules. Consumers should not reach into internals with deep selectors, parent stylesheet patches, inline overrides, or specificity battles.
- Fix behavior at the deepest piece that owns it. If a page needs behavior from a primitive, grow the primitive API first and then consume it from the page.
- Stylesheets own visual presentation. Component logic should toggle classes and state, not compose ad hoc styles inline.
- Components own padding and internal chrome. Containers own gaps, margins, width, and layout.
- Conditional content should vanish from the DOM when empty. Do not leave empty wrappers, labels, headings, or slots behind.
- Invalid prop combinations should fail clearly in a component-scoped way instead of silently rendering broken chrome.

## Tokens and visual weight

- Use semantic tokens directly by purpose. Do not hardcode token values, and do not rename tokens into local aliases unless the custom property carries a real runtime or boundary value.
- Treat surfaces as paper and text/icons/borders/fills as ink. Use semantic mood and opacity intentionally instead of inventing one-off color roles.
- Use moods for semantic intent: `default`, `primary`, `accent`, `success`, `warning`, `danger`, and `info`. Use raw color choices only when hue itself is the user-facing meaning.
- Start visually light and earn every extra border, background, container, shadow, and type weight.
- One thing should usually get one box. Avoid stacking border, tinted background, and nested card unless elevation genuinely requires border plus shadow.
- Motion and elevation should come from named tokens, not raw durations, easings, or shadow stacks.

## API naming

- Prefer existing props and data shapes before adding new ones.
- Use `heading`, not `title`, for component-facing heading text unless the data model genuinely uses title as content.
- Boolean props should read as positive capabilities or states, such as `dismissible`, `optional`, or `disabled`; avoid negated correction props such as `noBorder` or `hideLabel`.
- Avoid companion booleans. If two props only make sense together, model the single concept instead.
- Interactive components should use `value` and `valueChange` unless there is a stronger existing sibling convention.
- Outputs should describe user intent, such as `dismiss`, `select`, `submit`, or `clear`, not DOM mechanics like `clicked`.
- Component sizes are `small`, `default`, and `large`; numeric sizes belong to measurement primitives.
- Use `variant` for structural chrome and `type` for native or functional behavior.
- Destructive actions use the `danger` mood. Do not invent a separate destructive vocabulary.

## Component reference

The component reference page is live documentation. When adding or changing a public prop or slot, expose it there with a visible control. The plain default state should appear first, optional props should start inactive or empty, and each control should reveal the prop type: switches for booleans, sliders or number fields for bounded numbers, button groups for small option sets, and selects for larger sets.


## Install

This is a personal framework package: public for easy GitHub installs, but designed only for Mikael's own apps. It is allowed to change quickly when another app exposes something wrong.

```json
{
  "dependencies": {
    "@mikaelcedergren/cx-framework": "github:mikaelcedergren/cx-framework#main"
  }
}
```

Import Angular components from `@mikaelcedergren/cx-framework`.

For SCSS, either import package subpaths directly:

```scss
@use '@mikaelcedergren/cx-framework/tokens';
@use '@mikaelcedergren/cx-framework/styles/markdown';
```

Or add `node_modules/@mikaelcedergren/cx-framework` to the app's Sass include paths and keep imports such as:

```scss
@use 'tokens';
@use 'styles/markdown';
```
