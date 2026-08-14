# Tokens and themes

This is the concrete token contract for the Cortex Angular component library. It documents the real `cx-framework` token names and theme behavior; it is not part of the platform-neutral AI design contract in `../ai/`.

## Ownership

- `index.scss` is the public Sass entry point.
- `_theme.scss` owns complete theme profiles and their coordinated visual character.
- Components consume semantic roles and never branch on a theme class.
- A consuming product may select or define a theme profile, but it must not patch individual component internals to imitate one.

Use a token at the property that consumes it. Do not add a local `--cx-*` alias merely to rename another token. A component custom property is justified only when it carries a runtime value, creates an intentional consumer boundary, centralizes a reused derived calculation, or coordinates a variant across several internal declarations.

## Semantic colour

The shared component API uses these `mood` values: `default`, `primary`, `accent`, `success`, `warning`, `danger`, and `info`. `default` is a real neutral state; `none` means absence and is not interchangeable with it.

- `primary` is the main forward action in one action region.
- `accent` is rare supporting emphasis, never a second primary.
- `success` communicates completion or health.
- `warning` communicates caution.
- `danger` communicates destructive or risky intent.
- `info` communicates neutral information.

Use `mood` for semantic intent. Use `color` only when hue itself is user-facing data or choice, such as a chart series, swatch, avatar, or tag colour. Components consume semantic roles rather than palette names.

The built-in theme defaults map `--primary` to blue in Light and violet in Dark and Night. `--accent` is cyan, `--info` blue, `--success` green, `--warning` orange, and `--danger` red unless a complete active theme overrides the resolved values.

Surface and ink roles are:

- `--surface`: default application plane
- `--surface-alt`: quiet alternate plane for recessed, framing, or grouped regions
- `--ink`: prominent, selected, active, or actionable content
- `--on-ink`: content on an ink-coloured fill
- `--on-emphasis`: content on emphasis
- `--opacity-high`: ordinary readable supporting text and subdued icons
- `--opacity-mid`: borders, separators, and medium structure
- `--opacity-low`: quiet fills and near-background hierarchy, never readable body text
- `--opacity-darken`: subtle pressed or shaded effects
- `--opacity-disabled`: disabled visibility
- `--utility-bar-surface` and `--on-utility-bar`: the utility-bar plane and its content
- `--overlay-backdrop`: dimming backdrop for modal and navigation overlays

Do not stack surfaces to fake depth. Floating surfaces use deliberate contrast and elevation; grounded regions use spacing, opacity, and restrained boundaries.

## Spacing and type

The spacing scale follows a 4px rhythm:

| Token | Value |
| --- | ---: |
| `--space-2xs` | 2px |
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 64px |

Start with `--space-sm` for close text-like relationships and `--space-md` for separate or visually heavier groups. Larger gaps need a real page pause. Typography is fitted perceptually rather than forced onto the spacing grid.

The base type scale is:

| Token | Value |
| --- | ---: |
| `--font-size-display` | fluid 40–72px |
| `--font-size-title-1` | 24px |
| `--font-size-title-2` | 20px |
| `--font-size-title-3` | 18px |
| `--font-size-body-lg` | 16px |
| `--font-size-body` | 14px |
| `--font-size-body-sm` | 12px |
| `--font-size-body-xs` | 10px |

Display type and `--line-height-display` belong to the primary headline of a marketing or editorial hero. Ordinary page titles, section headings, dialogs, and application UI use the fixed title scale. Body text is the default component text; smaller sizes are reserved for labels, help, metadata, captions, badges, shortcuts, and other genuinely secondary information.

## Theme character

A theme is a complete visual profile. Components keep the same roles, states, behavior, target sizes, and content hierarchy while the profile resolves shared tokens differently.

- `--corner-shape` selects the curve family; the modern profile uses `squircle` and conventional rounded corners use `round`.
- `--corner-softness` controls the amount of rounding and drives the named non-pill radius scale.
- `--surface-separation` controls the inset and seam between separate surfaces in framed composites. It does not replace content padding or layout gaps.
- `--floating-surface-border` owns elevated-surface boundaries; grounded structure continues to use `--line` or `--line-discreet`.
- `--frost-softness` controls backdrop blur. A flat theme may set it to zero.
- `--shadow-low`, `--shadow-mid`, and `--shadow-high` keep their semantic elevation roles while a profile may render them softly, crisply, or flat.

Semantic circles and pills stay round regardless of the rectangular corner profile. The default radius scale derives from `--corner-softness: 4px`: `--radius-none` is 0; `xs`, `sm`, `md`, `lg`, `media-lg`, `xl`, and `2xl` are respectively 1×, 2×, 3×, 4×, 6×, 8×, and 16× softness; `--radius-pill` is 999px.

Use named shadows only for real elevation: low for raised controls, mid for menus and popovers, and high for dialogs and strong overlays. Motion uses named tokens, clarifies change, and never moves the page around someone who is reading.

Legacy is the final theme in every theme selector. It inherits Light's palette, semantic colours, type, density, control sizes, and motion, then changes only visual character: conventional round corners at 1px softness, 1px surface separation, visible floating boundaries, zero frost, and crisp shadows. It is a transition profile, never a component variant.
