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

To arrange screens — the layout primitives, spacing utilities, responsive model, and page frame — read the [layout guide](primitives/layout/README.md).

The token layer is intentionally reduced to the high-level foundations Cortex needs
without carrying over a large legacy variable surface.

## Extending the framework

When an app feature reaches for behavior that logically belongs to a primitive or pattern, extend the framework component rather than inlining one-off logic in the page. Add the prop/API to the `cx-*` component, keep sibling components consistent (e.g., the same prop name/semantics across `cx-text-field` and `cx-textarea`), and consume it from the page. Only deviate when the feature genuinely does not belong in a shared component/pattern.

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

## Repackaging cx-framework

`framework/` is exported to the separate GitHub package repo `mikaelcedergren/cx-framework`, published for personal app installs as `@mikaelcedergren/cx-framework`.

Make framework changes in Cortex first. New components, patterns, tokens, icons, support files, and scripts should live under this folder, and public Angular APIs must be exported from `public-api.ts`. If raw icon assets change, regenerate the icon manifest before exporting.

Run the package command from the Cortex repo root:

```bash
pnpm framework:package
```

That is a dry run: it reports the next version and checks the export without changing files. When it looks correct, package the new patch version:

```bash
pnpm framework:package -- --apply
```

Use `--bump minor`, `--bump major`, or `--version x.y.z` when the default patch bump is not right:

```bash
pnpm framework:package -- --apply --bump minor
pnpm framework:package -- --apply --version 0.2.0
```

By default the target is `../cx-framework`. For another checkout, use `CX_FRAMEWORK_REPO=/path/to/cx-framework` or pass `--target /path/to/cx-framework`.

The package command bumps `framework/package.json`, exports the package repo, refreshes package dependencies, builds the Angular library, and runs `npm pack --dry-run` so the packed file list is visible before commit/push.

The package should include `DESIGN-SYSTEM.md`, `tokens/`, `styles/`, `icons/`, `primitives/`, `patterns/`, `support/`, `scripts/`, `public-api.ts`, `tsconfig.lib.json`, `README.md`, `package.json`, and built `dist/` from the prepare/build step. It should not include generated or local junk such as `node_modules/`, `out-tsc/`, `.DS_Store`, `.framework-build.status.json`, or empty junk folders.

Keep Cortex and `cx-framework` on the same Angular major. The current baseline is Angular 22 with Node 24.17+ preferred. The package keeps Angular/CDK/RxJS as peer dependencies for consuming apps and as dev dependencies so GitHub installs can run the `prepare` build.

After the package repo is committed and pushed, consuming apps using:

```json
{
  "dependencies": {
    "@mikaelcedergren/cx-framework": "github:mikaelcedergren/cx-framework#main"
  }
}
```

must refresh their lockfile/install so the GitHub dependency points at the new commit. If an app exposes something wrong, fix the source here and re-export rather than patching the app locally.


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
