# Tokens and themes

This is the concrete token contract for the Cortex Angular component library. It documents the real `cx-framework` token names and theme behavior; it is not part of the platform-neutral AI design contract in `../ai/`.

## Ownership

- [`_core.scss`](_core.scss) owns every approved token and its default value, grouped by purpose. It also owns the shared keyboard-navigation and responsive-gutter treatments.
- [`_themes.scss`](_themes.scss) owns named theme overrides and the optional square-corner profile. It may override existing core tokens, never introduce new ones.
- [`index.scss`](index.scss) is the public Sass entry point. Cortex loads it once from its global application stylesheet; the published framework uses the same entry point. It loads core first and themes second.
- `_spacing-scale.scss` and `_breakpoints-scale.scss` are CSS-free build helpers. The spacing map references core tokens; the breakpoint helper supplies the shared media-query value mirrored by `--breakpoint-mobile`. Components import helpers for build-time needs and consume core CSS tokens directly.
- Components consume semantic roles and never branch on a theme class.
- A consuming product may select or define a theme profile, but it must not patch individual component internals to imitate one.

Before styling, apply `RULE-ID: tokens.direct-global`, `RULE-ID: tokens.semantic`, and `RULE-ID: tokens.new-global` in [the shared token rules](../ai/design/03-ux-rules.md#tokens-and-color). This document owns the concrete token purposes below; the shared rules own direct use, value selection, and approval for new tokens.

For example, use `color: var(--opacity-high)` for supporting text, `border-color: var(--opacity-mid)` for a separator, and `background: var(--opacity-low)` for a quiet fill. These three tokens resolve to colours, not numeric opacity values. Global semantic mappings such as `--primary: var(--blue)` remain part of the shared vocabulary.

The automated source check reads the approved definition files listed in the repository's `style-token-policy.json`. Declaring a variable in `:root` elsewhere does not make it approved. Adding a new token or changing those ownership declarations requires the approval described by the shared rules; the check cannot establish semantic purpose or user approval.

## Core-token working model

A core token expresses a shared design choice that a designer should recognise directly in a component: colour, type, spacing, shape, layout, depth, motion or a deliberately shared treatment. The complete inventory below is the approved global vocabulary.

Apply `tokens.direct-global` through the explicit vocabulary below. Components use these core tokens directly in their final style properties. Do not introduce component- or state-specific aliases to rename a core value, even at global scope. For example, the field interaction outline uses `outline: 2px solid var(--opacity-low)` directly instead of `var(--outline-field-interaction)`. This is a property declaration, not permission to introduce an intermediate variable or patch a component from outside.

Intentional shared mappings and treatments remain core: semantic colours may reference palette colours; corner softness follows the base radius; `--line`, `--line-discreet`, `--floating-surface-border`, `--outline-tab`, and `--outline-tab-offset` retain their shared purposes. Named radii use explicit pixel values. A core token does not have to be a literal scalar. `--emphasis` and `--on-emphasis` are semantic colours. Page gutters, the breakpoint and surface separation are core as well.

Review one token or coherent family at a time with the user. Show every exact name, its current definition and resolved value where useful, purpose, real consumers, and theme or interaction changes. When presenting a full inventory, expand every token name; do not hide members behind wildcards. Agree on retention, naming, value or replacement before implementation. Keep proposed additions distinct from confirmed core choices, and follow `tokens.new-global` before adding a token.

Every token declaration, including theme overrides, carries an inline comment explaining its purpose. Group comments explain the design thinking. Keep those comments, the complete inventory and actual values aligned whenever tokens change. Component-owned icon dimensions, exceptional control sizes and disabled treatments are not global tokens. Do not reintroduce them as aliases.

The Cortex authoring check (`pnpm framework:ai:check` in the Cortex source repository) checks inventory membership, exact default values, purpose comments and direct use across all owned source files. This makes undocumented additions and stale references fail even when the consuming file was not edited. The check cannot approve a new design decision: new shared roles still require the user's agreement. Defaults must live in `_core.scss`; theme overrides must live in `_themes.scss`. Do not split the vocabulary into new definition files or use a theme to introduce a token.

### Choosing a value

1. Read the inventory and choose an existing core token for its documented purpose. Consume it directly in the final property; a similar value from an unrelated role is not a substitute.
2. If no suitable core token exists, use a direct value in the owning component where the shared rules permit it. Icon dimensions and component-specific disabled opacity are examples. Repetition does not justify an alias, and this does not permit hard-coded theme colours or consumer overrides of component internals.
3. If a genuinely shared role is missing, follow `tokens.new-global`: show its exact proposed name, purpose, value, theme effects and closest existing alternatives, then wait for explicit approval before adding or using it. After approval, update the definition, inline purpose comment, inventory and consumers together.

A general implementation or cleanup request does not approve new tokens. Adding a row to this inventory or changing the definition-file policy does not approve one either. An explicitly approved token plan already covers its named changes; do not ask for that approval again. Existing semantic-to-palette mappings and shared treatments listed here remain approved core tokens; they are not permission to create component aliases.

## Semantic colour

The shared component API uses these `mood` values: `default`, `primary`, `accent`, `success`, `warning`, `danger`, and `info`. `default` is a real neutral state; `none` means absence and is not interchangeable with it.

- `primary` is the main forward action in one action region.
- `accent` is rare supporting emphasis, never a second primary.
- `success` communicates completion or health.
- `warning` communicates caution.
- `danger` communicates destructive or risky intent.
- `info` communicates neutral information.
- `--admin` is the deliberately distinct fill for admin, internal and prototype controls; `--on-admin` is its paired foreground. They signal that these controls sit outside the ordinary product experience. They do not add an `admin` mood or grant access.
- `--emphasis` is the strong emphasis fill; `--on-emphasis` is its paired foreground. These are semantic colour tokens, not additional `mood` values.

Use `mood` for semantic intent. Use `color` only when hue itself is user-facing data or choice, such as a chart series, swatch, avatar, or tag colour. Components consume semantic roles rather than palette names.

Semantic base, alternate and opacity roles reference the matching palette entries whenever that palette supplies the intended colours. A theme may use custom hex colours where it deliberately needs a different result; Estuary status colours are one example.

The built-in theme defaults map `--primary` to blue in Light and Aqua and violet in Dark and
Night. Aqua is a dark ocean profile: deep blue-green surfaces, white text, blue actions,
and soft lime accents. Its alternate surface is slightly darker than the main surface.
Its full palette is tuned for dark surfaces, with lighter
alternate shades and dark text on filled controls. Success uses leaf green, distinct from the
lime accent. Other themes retain their own palette and semantic mappings.

Surface and ink roles are:

- `--surface`: default application plane
- `--surface-alt`: quiet alternate plane for recessed, framing, or grouped regions
- `--ink`: prominent, selected, active, or actionable content
- `--on-ink`: content on an ink-coloured fill
- `--opacity-high`: ordinary readable supporting text and subdued icons
- `--opacity-mid`: borders, separators, and medium structure
- `--opacity-low`: quiet fills and near-background hierarchy, never readable body text
- `--opacity-darken`: subtle pressed or shaded effects
- `--overlay-backdrop`: dimming backdrop for modal and navigation overlays

Ordinary text links inherit their surrounding text colour in every theme. An underline identifies
them as links, including their visited, hover, and active states. Component controls retain their
own semantic styles.

Do not stack surfaces to fake depth. Floating surfaces use deliberate contrast and elevation; grounded regions use spacing, opacity, and restrained boundaries.

## Spacing and type

Page content uses `--content-width-xl` (1180px), with `--gutter-page` providing a
minimum 24px inset on desktop and 16px on phones. `cx-container` centres that
content frame. Heroes use the same frame inside their available region while
cover backgrounds remain full bleed. Do not add a second width or gutter wrapper
around a hero to align it with ordinary page sections.

`cx-editorial` fills its container without imposing a maximum width. The containing
layout owns reading width and placement; use a measure on that container when the
composition calls for a narrower column, such as `--content-width-md` (640px).
Hero headlines and introductions retain their own shorter line lengths.
`--content-width-sm` (360px) and `--content-width-lg` (960px) support smaller content groups.

For a section that breaks out of a viewport-centred column, `cx-full-bleed` uses
`--gutter-centered` to return its content to the same page edges. This helper is
viewport-relative; embedded regions use their own available width instead.

The spacing scale follows a 4px rhythm; see the [complete spacing values](#spacing).

Start with `--space-sm` for close text-like relationships and `--space-md` for separate or visually heavier groups. Larger gaps need a real page pause. Typography is fitted perceptually rather than forced onto the spacing grid.

The [complete type sizes](#type-sizes) list the base application and editorial scales.

`--font-size-hero: clamp(40px, 5vw, 72px)` grows at 5% of the viewport width, never smaller than 40px or larger than 72px. It stays 40px up to an 800px viewport, reaches 60px at 1200px, and stops at 72px from 1440px. This size and `--line-height-display` belong to the primary headline of a marketing or editorial hero. Ordinary page titles, section headings, dialogs, and application UI use the fixed title scale. Body text is the default component text; smaller sizes are reserved for labels, help, metadata, captions, badges, shortcuts, and other genuinely secondary information.

Editorial typography is a separate shared reading system:

`--typeface-editorial` uses Literata, the default for `--font-family-heading`.
Its self-hosted variable face supplies weights 200–900 and optical sizes 7–72.

See [type sizes](#type-sizes), [type weights](#type-weights) and [line heights](#line-heights) for the editorial values.

These roles belong only to the shared editorial mode. Application UI, components, controls, dialogs, assistant answers, and operational data keep the fixed product scale above. Consumers opt into editorial typography as one system; they do not select these tokens element by element.

## Theme character

A theme is a complete visual profile. Components keep the same roles, states, behavior, target sizes, and content hierarchy while the profile resolves shared tokens differently.

- `--corner-shape` selects the curve family; the modern profile uses `squircle` and conventional rounded corners use `round`.
- `--corner-softness` follows `--radius-xs` and informs proportional component geometry. Named radius tokens have their own explicit pixel values; changing softness does not recalculate them.
- `--surface-separation` controls the inset and seam between separate surfaces in framed composites. It does not replace content padding or layout gaps.
- `--floating-surface-border` owns elevated-surface boundaries; grounded structure continues to use `--line` or `--line-discreet`.
- `--frost-softness` controls backdrop blur. A flat theme may set it to zero.
- `--shadow-low`, `--shadow-mid`, and `--shadow-high` keep their semantic elevation roles while a profile may render them softly, crisply, or flat.

For a square site, add `cx-corners-square` to the document root alongside its
theme class. This optional profile explicitly sets every rectangular radius to `0px`; `--corner-softness` also follows `--radius-xs` to zero. Proportional
avatars and inset composite surfaces become square as well. Keep the override on the root so the
radius tokens and portaled overlays share it. Omit the class to retain the theme’s rounded
defaults. Components with an explicit radius can opt out individually using
`none`. Card's existing numeric radius also accepts zero; an explicit positive
Card radius or Image `round` still expresses that deliberate shape.

Semantic circles and pills stay round regardless of the rectangular corner profile. `--radius-none` is 0 and `--radius-full` is 999px in every profile. `--corner-softness` remains `var(--radius-xs)`, while each named radius below is an explicit pixel value. These values preserve the existing appearance of every built-in theme and the square-corner profile.

| Token | Default / other themes | Estuary | Legacy | Square corners |
| --- | --- | --- | --- | --- |
| `--radius-xs` | `4px` | `2px` | `1px` | `0px` |
| `--radius-sm` | `8px` | `4px` | `2px` | `0px` |
| `--radius-md` | `12px` | `6px` | `3px` | `0px` |
| `--radius-lg` | `16px` | `8px` | `4px` | `0px` |
| `--radius-media-lg` | `24px` | `12px` | `6px` | `0px` |
| `--radius-xl` | `32px` | `16px` | `8px` | `0px` |
| `--radius-2xl` | `64px` | `32px` | `16px` | `0px` |

When defining a custom corner profile, set the intended named radii explicitly as well as the base radius. Overriding only `--radius-xs` or `--corner-softness` no longer changes the larger named radii. The responsive `--font-size-hero` clamp and `--gutter-centered` calculation remain unchanged.

Choose from this scale using `tokens.radius-perception` in [the shared token rules](../ai/design/03-ux-rules.md#tokens-and-color). For example, the 16px checkbox uses `--radius-xs` (4px by default), capped at one quarter of its size. An 8px conventional radius would turn that square into a circle. The square profile still resolves its corners to zero. Check the conventional rounded fallback as well as `squircle`; browser support must not change a control's recognisable shape.

Use named shadows only for real elevation: low for raised controls, mid for menus and popovers, and high for dialogs and strong overlays. Motion uses named tokens, clarifies change, and never moves the page around someone who is reading.

Motion durations range from `--motion-fast` (120ms), through `--motion-base`
(180ms) and `--motion-slow` (240ms), to `--motion-slower` (400ms). Use
`--motion-slower` for deliberate spatial transitions whose movement should be
easy to perceive, such as a card lifting from the page. Keep immediate control
feedback on the shorter durations. Pair durations with the shared cubic Bézier
easing tokens; do not use linear easing for interface transitions. Respect
reduced-motion preferences when moving content.

Legacy is the final theme in every theme selector. It inherits Light's palette, semantic colours, type, density, control sizes, and motion, then changes only visual character: conventional round corners at 1px softness, 1px surface separation, visible floating boundaries, zero frost, and crisp shadows. It is a transition profile, never a component variant.

## Estuary

Estuary is a light coastal profile: `--surface` is `#F2F6F6`, `--surface-alt`
is navy `#102F42`, which also anchors text. Pastel green `#A4E2C6` supplies
primary actions, with pastel tangerine `#F3C6B0` as the supporting accent. It uses
the existing elegant sans-serif heading face, restrained round corners, and subtle shadows. Its pastel palette uses
navy `--ink` for readable content on hue fills. Success, warning, danger, and info
use Light's explicit colour values, including their alternate shades and opacity
tints, independently of the pastel palette. Alternate hue shades remain pastel for hover states. Use
`cx-text-ink` on authored text that sits on a pastel fill. `--on-ink` resolves to
the same navy as `--ink`, so controls that consume it have dark labels.

Select `estuary` through the existing shared theme registry. It uses the same
document-level theme mechanism as the other appearances.
Component structure, page layout and overlay behaviour do not change. The navy
alternate plane requires deliberate light foregrounds in authored compositions;
components that pair `--surface-alt` with `--ink` are not automatically inverted.

Pastel hues are intended as fills, not text on the pale main surface. Components
retain their existing foreground bindings; those using `--surface` for a label
do not follow `--on-ink`. Ordinary links retain the dark ink role.

## Complete core inventory

Every approved token is listed by its exact name, default/Light definition and purpose. Theme and keyboard overrides still apply. Definitions retain `var(...)` relationships so their intent stays visible. Eight-digit hex includes transparency; rounding alpha to a byte is intentional. The former blue-tinted opacity mixes are now fixed theme colours and no longer recalculate when a consumer changes the blue palette.

Notable overrides: Legacy sets `--radius-xs` and surface separation to 1px; Estuary uses a 2px base radius; square corners use 0px. `--corner-softness` follows that base, and each profile explicitly defines its larger named radii. Floating borders use `--line` in Aqua and Estuary and `--line-discreet` in Legacy. The admin fill follows each theme's yellow. Its foreground follows on-emphasis except Wireframe and Estuary, which use ink. See [`_themes.scss`](_themes.scss) for exact overrides.

### Palette

| Token                                 | Default/Light definition | Purpose                                                                    |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| [`--blue`](_core.scss)              | `#057dff`                | Blue palette hue for colour as data, user choice or semantic mapping.      |
| [`--blue-alt`](_core.scss)          | `#0358b2`                | Alternate blue shade for hover or stronger hue treatment.                  |
| [`--blue-opacity`](_core.scss)      | `#057dff1a`              | Translucent blue fill that retains the underlying surface.                 |
| [`--cyan`](_core.scss)              | `#00ccc5`                | Cyan palette hue for colour as data, user choice or semantic mapping.      |
| [`--cyan-alt`](_core.scss)          | `#018a86`                | Alternate cyan shade for hover or stronger hue treatment.                  |
| [`--cyan-opacity`](_core.scss)      | `#00ccc51a`              | Translucent cyan fill that retains the underlying surface.                 |
| [`--lime`](_core.scss)              | `#88d33d`                | Lime palette hue for colour as data, user choice or semantic mapping.      |
| [`--lime-alt`](_core.scss)          | `#6da82f`                | Alternate lime shade for hover or stronger hue treatment.                  |
| [`--lime-opacity`](_core.scss)      | `#88d33d1a`              | Translucent lime fill that retains the underlying surface.                 |
| [`--green`](_core.scss)             | `#37c45b`                | Green palette hue for colour as data, user choice or semantic mapping.     |
| [`--green-alt`](_core.scss)         | `#299143`                | Alternate green shade for hover or stronger hue treatment.                 |
| [`--green-opacity`](_core.scss)     | `#37c45b1a`              | Translucent green fill that retains the underlying surface.                |
| [`--yellow`](_core.scss)            | `#edc31c`                | Yellow palette hue for colour as data, user choice or semantic mapping.    |
| [`--yellow-alt`](_core.scss)        | `#a68712`                | Alternate yellow shade for hover or stronger hue treatment.                |
| [`--yellow-opacity`](_core.scss)    | `#edc31c1a`              | Translucent yellow fill that retains the underlying surface.               |
| [`--orange`](_core.scss)            | `#ff980a`                | Orange palette hue for colour as data, user choice or semantic mapping.    |
| [`--orange-alt`](_core.scss)        | `#b26b05`                | Alternate orange shade for hover or stronger hue treatment.                |
| [`--orange-opacity`](_core.scss)    | `#ff980a1a`              | Translucent orange fill that retains the underlying surface.               |
| [`--tangerine`](_core.scss)         | `#ff6c2e`                | Tangerine palette hue for colour as data, user choice or semantic mapping. |
| [`--tangerine-alt`](_core.scss)     | `#b24b20`                | Alternate tangerine shade for hover or stronger hue treatment.             |
| [`--tangerine-opacity`](_core.scss) | `#ff6c2e1a`              | Translucent tangerine fill that retains the underlying surface.            |
| [`--red`](_core.scss)               | `#ff4043`                | Red palette hue for colour as data, user choice or semantic mapping.       |
| [`--red-alt`](_core.scss)           | `#992629`                | Alternate red shade for hover or stronger hue treatment.                   |
| [`--red-opacity`](_core.scss)       | `#ff40431a`              | Translucent red fill that retains the underlying surface.                  |
| [`--pink`](_core.scss)              | `#f2559c`                | Pink palette hue for colour as data, user choice or semantic mapping.      |
| [`--pink-alt`](_core.scss)          | `#a83d6d`                | Alternate pink shade for hover or stronger hue treatment.                  |
| [`--pink-opacity`](_core.scss)      | `#f2559c1a`              | Translucent pink fill that retains the underlying surface.                 |
| [`--purple`](_core.scss)            | `#ae4ede`                | Purple palette hue for colour as data, user choice or semantic mapping.    |
| [`--purple-alt`](_core.scss)        | `#7a3d99`                | Alternate purple shade for hover or stronger hue treatment.                |
| [`--purple-opacity`](_core.scss)    | `#ae4ede1a`              | Translucent purple fill that retains the underlying surface.               |
| [`--violet`](_core.scss)            | `#3057f2`                | Violet palette hue for colour as data, user choice or semantic mapping.    |
| [`--violet-alt`](_core.scss)        | `#223da8`                | Alternate violet shade for hover or stronger hue treatment.                |
| [`--violet-opacity`](_core.scss)    | `#3057f21a`              | Translucent violet fill that retains the underlying surface.               |

### Semantic colours

| Token                              | Default/Light definition | Purpose                                                                          |
| ---------------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| [`--primary`](_core.scss)         | `var(--blue)`            | Main forward action and selected choice controls.                                |
| [`--primary-opacity`](_core.scss) | `var(--blue-opacity)`    | Quiet translucent fill carrying primary meaning.                                 |
| [`--primary-alt`](_core.scss)     | `var(--blue-alt)`        | Alternate primary shade, normally the matching palette alternate.                |
| [`--accent`](_core.scss)          | `var(--cyan)`            | Rare supporting emphasis, subordinate to the primary action.                     |
| [`--accent-opacity`](_core.scss)  | `var(--cyan-opacity)`    | Quiet translucent fill carrying accent meaning.                                  |
| [`--accent-alt`](_core.scss)      | `var(--cyan-alt)`        | Alternate accent shade, normally the matching palette alternate.                 |
| [`--success`](_core.scss)         | `var(--green)`           | Completion or healthy status.                                                    |
| [`--success-opacity`](_core.scss) | `var(--green-opacity)`   | Quiet translucent fill carrying success meaning.                                 |
| [`--success-alt`](_core.scss)     | `var(--green-alt)`       | Alternate success shade, normally the matching palette alternate.                |
| [`--warning`](_core.scss)         | `var(--orange)`          | Caution that needs attention.                                                    |
| [`--warning-opacity`](_core.scss) | `var(--orange-opacity)`  | Quiet translucent fill carrying warning meaning.                                 |
| [`--warning-alt`](_core.scss)     | `var(--orange-alt)`      | Alternate warning shade, normally the matching palette alternate.                |
| [`--danger`](_core.scss)          | `var(--red)`             | Destructive action, risk or failure.                                             |
| [`--danger-opacity`](_core.scss)  | `var(--red-opacity)`     | Quiet translucent fill carrying danger meaning.                                  |
| [`--danger-alt`](_core.scss)      | `var(--red-alt)`         | Alternate danger shade, normally the matching palette alternate.                 |
| [`--info`](_core.scss)            | `var(--blue)`            | Neutral information or guidance.                                                 |
| [`--info-opacity`](_core.scss)    | `var(--blue-opacity)`    | Quiet translucent fill carrying info meaning.                                    |
| [`--info-alt`](_core.scss)        | `var(--blue-alt)`        | Alternate info shade, normally the matching palette alternate.                   |
| [`--emphasis`](_core.scss)        | `#fff`                   | Strong contrasting fill for emphasised content.                                  |
| [`--on-emphasis`](_core.scss)     | `#171717`                | Readable foreground on the emphasis fill.                                        |
| [`--admin`](_core.scss)           | `var(--yellow)`          | Distinct fill for admin, internal and prototype controls outside the product UI. |
| [`--on-admin`](_core.scss)        | `var(--on-emphasis)`     | Readable foreground on the admin fill, including the utility bar.                |

### Surfaces and content

| Token                          | Default/Light definition | Purpose                                                                         |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------- |
| [`--surface`](_core.scss)     | `#ffffff`                | Main application plane.                                                         |
| [`--surface-alt`](_core.scss) | `#f8f8f8`                | Alternate plane for recessed or framed groups; pair with a readable foreground. |
| [`--ink`](_core.scss)         | `#1f1f1f`                | Prominent, selected or actionable content.                                      |
| [`--on-ink`](_core.scss)      | `#ffffff`                | Foreground for ink and filled controls; themes choose a legible colour.         |
| [`--link`](_core.scss)        | `var(--blue)`            | Standalone navigation or brand link colour; ordinary text links may inherit.    |
| [`--placeholder`](_core.scss) | `#1a1a1a66`              | Example or empty-state text inside fields; never replaces a label.              |

### Visual hierarchy

| Token                             | Default/Light definition | Purpose                                                                    |
| --------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| [`--opacity-high`](_core.scss)   | `#15202f9e`              | Readable supporting text and subdued icons; a colour, not numeric opacity. |
| [`--opacity-mid`](_core.scss)    | `#15202f14`              | Borders, separators and medium-strength structure.                         |
| [`--opacity-low`](_core.scss)    | `#15202f08`              | Quiet fills and the soft field-interaction outline.                        |
| [`--opacity-darken`](_core.scss) | `#16181d04`              | Subtle shading layered over an existing surface.                           |

### Spacing

| Token                          | Default/Light definition | Purpose                                                       |
| ------------------------------ | ------------------------ | ------------------------------------------------------------- |
| [`--space-2xs`](_core.scss) | `2px`                    | Fine separation within tightly related details.               |
| [`--space-xs`](_core.scss)  | `4px`                    | Small inset or closely related detail spacing.                |
| [`--space-sm`](_core.scss)  | `8px`                    | Default gap between close, text-like relationships.           |
| [`--space-md`](_core.scss)  | `16px`                   | Default gap between separate or visually heavier groups.      |
| [`--space-lg`](_core.scss)  | `24px`                   | Larger group separation and desktop page-edge breathing room. |
| [`--space-xl`](_core.scss)  | `32px`                   | A clear pause between substantial groups.                     |
| [`--space-2xl`](_core.scss) | `64px`                   | Major separation between page sections.                       |

### Surface framing and borders

| Token                                       | Default/Light definition                       | Purpose                                                           |
| ------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| [`--surface-separation`](_core.scss)     | `var(--space-xs)`                              | Inset and seams between framed surfaces; not content padding.     |
| [`--border-width`](_core.scss)            | `1px`                                          | Shared thickness for ordinary structural lines.                   |
| [`--line`](_core.scss)                    | `var(--border-width) solid var(--opacity-mid)` | Standard structural border, including medium-contrast separators. |
| [`--line-discreet`](_core.scss)           | `var(--border-width) solid var(--opacity-low)` | Quiet structural border for low-emphasis boundaries.              |
| [`--floating-surface-border`](_core.scss) | `0 solid transparent`                          | Theme-controlled edge on elevated panels, menus and popovers.     |

### Corners

| Token                               | Default/Light definition            | Purpose                                                                             |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| [`--corner-shape`](_core.scss)    | `squircle`                          | Curve technique for rectangular corners: squircle or conventional round.            |
| [`--corner-softness`](_core.scss) | `var(--radius-xs)`                  | Theme rounding intensity; follows radius-xs for proportional component geometry.   |
| [`--radius-none`](_core.scss)     | `0`                                 | Deliberately square corners.                                                        |
| [`--radius-xs`](_core.scss)       | `4px`                               | Base small radius; keeps tiny controls recognisably rectangular.                    |
| [`--radius-sm`](_core.scss)       | `8px`                              | Small rounded elements.                                                            |
| [`--radius-md`](_core.scss)       | `12px`                             | Medium rounded elements.                                                           |
| [`--radius-lg`](_core.scss)       | `16px`                             | Larger rounded elements and surfaces.                                               |
| [`--radius-media-lg`](_core.scss) | `24px`                             | Roomier corner radius for large media.                                              |
| [`--radius-xl`](_core.scss)       | `32px`                             | Broad rounding on large surfaces.                                                   |
| [`--radius-2xl`](_core.scss)      | `64px`                             | Most generous rectangular rounding on large compositions.                           |
| [`--radius-full`](_core.scss)     | `999px`                             | Fully rounded shape, including circles and capsules, independent of corner profile. |

### Control sizes

| Token                                   | Default/Light definition | Purpose                                                             |
| --------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| [`--controller-size`](_core.scss)       | `32px`                   | Standard control height for everyday product UI.                    |
| [`--controller-size-small`](_core.scss) | `24px`                   | Compact control height where the context warrants smaller controls. |

### Typefaces

| Token                                       | Default/Light definition          | Purpose                                                     |
| ------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| [`--font-family-base`](_core.scss)    | `"Inter", sans-serif`             | Shared application and body-text face.                      |
| [`--font-family-mono`](_core.scss)    | `"Roboto Mono", monospace`        | Code, identifiers and other monospaced content.             |
| [`--typeface-editorial`](_core.scss)  | `"Literata", serif`               | Literary serif voice for headings.                          |
| [`--typeface-friendly`](_core.scss)   | `"Raleway", sans-serif`           | Open, friendly sans-serif heading voice.                    |
| [`--typeface-elegant`](_core.scss)    | `"Plus Jakarta Sans", sans-serif` | Refined sans-serif heading voice.                           |
| [`--typeface-condensed`](_core.scss)  | `"Archivo Narrow", sans-serif`    | Narrow heading voice when width is part of the identity.    |
| [`--typeface-slab`](_core.scss)       | `"Zilla Slab", serif`             | Slab-serif heading voice with a more constructed character. |
| [`--font-family-heading`](_core.scss) | `var(--typeface-editorial)`       | Active heading voice; selects one of the shared typefaces.  |

### Type sizes

| Token                                            | Default/Light definition | Purpose                                                                      |
| ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------- |
| [`--font-size-hero`](_core.scss)           | `clamp(40px, 5vw, 72px)` | Hero headline: fluid at 5% of viewport width, bounded between 40px and 72px. |
| [`--font-size-title-1`](_core.scss)        | `24px`                   | Primary application page heading.                                            |
| [`--font-size-title-2`](_core.scss)        | `20px`                   | Section heading below the page title.                                        |
| [`--font-size-title-3`](_core.scss)        | `18px`                   | Smaller section or group heading.                                            |
| [`--font-size-body-lg`](_core.scss)        | `16px`                   | Larger application body text when hierarchy calls for it.                    |
| [`--font-size-body`](_core.scss)           | `14px`                   | Default application and component text.                                      |
| [`--font-size-body-sm`](_core.scss)        | `12px`                   | Secondary labels, hints and metadata.                                        |
| [`--font-size-body-xs`](_core.scss)        | `10px`                   | Smallest secondary details, such as compact badges or shortcuts.             |
| [`--font-size-editorial-body`](_core.scss) | `18px`                   | Body text within the shared article and marketing reading mode.              |
| [`--font-size-editorial-lead`](_core.scss) | `22px`                   | Introductory text within the shared editorial reading mode.                  |

### Type weights

| Token                                                 | Default/Light definition | Purpose                                                  |
| ----------------------------------------------------- | ------------------------ | -------------------------------------------------------- |
| [`--font-weight-regular`](_core.scss)           | `450`                    | Normal reading weight.                                   |
| [`--font-weight-medium`](_core.scss)            | `550`                    | Moderate emphasis for labels and hierarchy.              |
| [`--font-weight-bold`](_core.scss)              | `700`                    | Strong emphasis in application typography.               |
| [`--font-weight-editorial-heading`](_core.scss) | `700`                    | Heading weight within the shared editorial reading mode. |

### Line heights

| Token                                       | Default/Light definition | Purpose                                                  |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------- |
| [`--line-height-display`](_core.scss) | `1.05`                   | Compact rhythm for large hero headlines.                 |
| [`--line-height-control`](_core.scss) | `1.1`                    | Compact single-line rhythm inside controls.              |
| [`--line-height-tight`](_core.scss)   | `1.2`                    | Tight rhythm shared by headings and small text.          |
| [`--line-height-body`](_core.scss)    | `1.3`                    | Default application text rhythm.                         |
| [`--line-height-relaxed`](_core.scss) | `1.5`                    | Airier multiline rhythm for reading, hints and messages. |

### Page layout and breakpoints

| Token                                      | Default/Light definition                                                 | Purpose                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`--content-width-sm`](_core.scss)         | `360px`                                                                  | Maximum width for a compact content group or narrow column.             |
| [`--content-width-md`](_core.scss)         | `640px`                                                                  | Maximum width for a readable text column or focused form.               |
| [`--content-width-lg`](_core.scss)         | `960px`                                                                  | Maximum width for a broader content section.                            |
| [`--content-width-xl`](_core.scss)         | `1180px`                                                                 | Maximum width of the main centred page content.                         |
| [`--gutter-page`](_core.scss)              | `var(--space-lg)`                                                        | Minimum horizontal breathing room at the page edges; smaller on phones. |
| [`--gutter-centered`](_core.scss)          | `max( var(--gutter-page), calc((100vw - var(--content-width-xl)) / 2) )` | Aligns full-bleed section content with the centred page column.         |
| [`--breakpoint-mobile`](_core.scss) | `#{scale.$mobile}`                                                       | Phone-layout threshold: 720px, shared with Sass media queries.          |

### Elevation and blur

| Token                              | Default/Light definition                                                                                      | Purpose                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`--frost-softness`](_core.scss) | `2px`                                                                                                         | Backdrop blur for translucent surfaces; zero creates a flat treatment. |
| [`--shadow-low`](_core.scss)     | `0 1px 1px #0000000e, 0 2px 2px #00000009, 0 4px 4px #00000005`                                               | Low elevation for raised controls and small surfaces.                  |
| [`--shadow-mid`](_core.scss)     | `0 1px 1px #0000000f, 0 2px 2px #0000000b, 0 4px 4px #00000009, 0 8px 8px #00000006, 0 16px 16px #00000005`   | Floating elevation for menus and popovers.                             |
| [`--shadow-high`](_core.scss)    | `0 1px 1px #00000011, 0 3px 3px #0000000d, 0 8px 8px #0000000a, 0 16px 16px #00000008, 0 32px 32px #00000006` | Strong elevation for dialogs and prominent overlays.                   |

### Motion

| Token                               | Default/Light definition       | Purpose                                              |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------- |
| [`--motion-fast`](_core.scss)     | `120ms`                        | Immediate control feedback.                          |
| [`--motion-base`](_core.scss)     | `180ms`                        | Standard interface transition.                       |
| [`--motion-slow`](_core.scss)     | `240ms`                        | More visible state or surface transition.            |
| [`--motion-slower`](_core.scss)   | `400ms`                        | Deliberate spatial movement, such as lifting a card. |
| [`--ease-out`](_core.scss)        | `cubic-bezier(0, .3, .3, 1)`   | Standard transition that settles gently.             |
| [`--ease-out-strong`](_core.scss) | `cubic-bezier(.22, 1, .36, 1)` | Pronounced deceleration for arriving surfaces.       |
| [`--ease-out-in`](_core.scss)     | `cubic-bezier(.4, 0, .15, 1)`  | Smooth change between interface states.              |
| [`--ease-in`](_core.scss)         | `cubic-bezier(0, .4, .15, 1)`  | Acceleration for departure or withdrawal.            |

### Layer order

| Token                                             | Default/Light definition | Purpose                                          |
| ------------------------------------------------- | ------------------------ | ------------------------------------------------ |
| [`--z-index-sticky`](_core.scss)               | `80`                     | Sticky content above the normal page plane.      |
| [`--z-index-nav-overlay-backdrop`](_core.scss) | `90`                     | Dimming plane behind overlay navigation.         |
| [`--z-index-nav-overlay`](_core.scss)          | `95`                     | Overlay navigation above its backdrop.           |
| [`--z-index-detail`](_core.scss)               | `100`                    | Detail panels above ordinary navigation.         |
| [`--z-index-dialog`](_core.scss)               | `1200`                   | Dialogs above the application layers.            |
| [`--z-index-popover-backdrop`](_core.scss)     | `1250`                   | Dismissal or dimming plane behind popovers.      |
| [`--z-index-popover`](_core.scss)              | `1300`                   | Popover surfaces above dialogs.                  |
| [`--z-index-tooltip`](_core.scss)              | `1400`                   | Tooltips above controls and popovers.            |
| [`--z-index-toast`](_core.scss)                | `1500`                   | Transient notifications above ordinary overlays. |
| [`--z-index-debug`](_core.scss)                | `9999`                   | Internal debugging surfaces above the interface. |

### Backdrop and keyboard focus

| Token                                  | Default/Light definition | Purpose                                                             |
| -------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| [`--overlay-backdrop`](_core.scss)    | `#000000cc`              | Dims the underlying screen while an overlay holds attention.        |
| [`--outline-tab`](_core.scss)        | `none`                   | Keyboard-navigation ring; appears only in keyboard-navigation mode. |
| [`--outline-tab-offset`](_core.scss) | `-2px`                   | Insets the keyboard ring so it follows the control boundary.        |
