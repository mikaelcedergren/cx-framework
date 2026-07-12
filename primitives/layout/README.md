# Layout

How to arrange things on screen in the Cortex framework. Four primitive components handle the common arrangements, a small set of utility classes handle one-off spacing, and `.cx-page` is the frame a screen sits in.

The guiding rule: **components own the padding inside themselves; containers own the gaps between things.** A card or button never sets its own outside spacing — the layout container it sits in decides that. That is what lets any component drop cleanly into any layout. So you build screens by *composing these containers*, not by writing `display: flex` or adding margins.

## Pick by what you need

| You want… | Use |
| --- | --- |
| things in a vertical column | `cx-stack` |
| things in a horizontal row | `cx-inline` |
| equal-width columns / a card grid | `cx-grid` |
| two groups pushed to opposite ends (one fills, one hugs) | `cx-split` |
| a little padding on your *own* wrapper element | `cx-p-*` utility classes |
| to show or hide by screen size | `cx-hide-mobile` / `cx-hide-desktop` |
| the outer frame of a page | `.cx-page` |

If you're reaching for a margin or a hand-written `display: flex`, stop — one of the above already does it, with consistent spacing.

## Spacing

Gaps and padding come from a fixed scale, never raw pixels. The steps (the `CxLayoutGap` values) and their sizes:

`2xs` 2 · `xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 · `2xl` 64

Reach for **8 (`sm`)** between text-like things and **16 (`md`)** between weightier blocks (fields, sections, cards) first; anything above `md` is rare. Margin is avoided entirely — use a container's gap instead.

## The primitives

All four are invisible wrappers — no background, border, or colour of their own. They only arrange what you put inside.

### cx-stack — vertical column

Children stacked top to bottom with an even gap.

| prop | type | default |
| --- | --- | --- |
| `gap` | gap step | `md` |
| `gapMobile` | gap step | — |
| `align` | `start \| center \| end \| stretch` | `stretch` |
| `justify` | `start \| center \| end \| between` | `start` |

```html
<cx-stack gap="md">
  <cx-text-field label="Name" />
  <cx-text-field label="Email" />
  <cx-button text="Save" />
</cx-stack>
```

### cx-inline — horizontal row

Children side by side. They stay on one line by default; set `wrap` to `true` when they should wrap as space tightens.

| prop | type | default |
| --- | --- | --- |
| `gap` | gap step | `sm` |
| `gapMobile` | gap step | — |
| `align` | `start \| center \| end \| stretch` | `center` |
| `justify` | `start \| center \| end \| between` | `start` |
| `wrap` | boolean | `false` |

```html
<cx-inline gap="sm" [wrap]="true">
  <cx-tag text="open" />
  <cx-tag text="kev" />
  <cx-tag text="internet-facing" />
</cx-inline>
```

### cx-grid — equal columns

A grid of equal-width columns.

| prop | type | default |
| --- | --- | --- |
| `columns` | number 1–12 | `3` |
| `columnsMobile` | number 1–12 | — |
| `gap` | gap step | `md` |
| `gapMobile` | gap step | — |
| `columnGap` / `rowGap` | gap step | falls back to `gap` |
| `align` | `start \| center \| end \| stretch` | `stretch` |

`columns` and `columnsMobile` are numbers, so bind them: `[columns]="3"`.

```html
<cx-grid [columns]="3" [columnsMobile]="1" gap="md">
  <cx-card>…</cx-card>
  <cx-card>…</cx-card>
  <cx-card>…</cx-card>
</cx-grid>
```

### cx-split — two ends

A start group that fills the space and an end group that hugs its content, pushed to opposite ends. Content goes in the `[start]` and `[end]` slots.

| prop | type | default |
| --- | --- | --- |
| `gap` | gap step | `md` |
| `gapMobile` | gap step | — |
| `align` | `start \| center \| end \| stretch` | `center` |
| `startWidth` | `auto \| sm \| md \| lg` | `auto` |

```html
<cx-split>
  <h1 start>Vulnerabilities</h1>
  <cx-inline end gap="sm">
    <cx-button text="Filter" />
    <cx-button text="Export" />
  </cx-inline>
</cx-split>
```

## Responsive

One breakpoint: **mobile is below 720px**; desktop is 720px and up (the `--breakpoint-mobile` token). Every responsive feature in the system flips at this same width.

- **Primitives** — give a base value plus a `*Mobile` override: `[columnsMobile]="1"`, `gapMobile="sm"`. The base applies everywhere; the mobile value takes over below 720.
- **Visibility** — `cx-hide-mobile` hides below 720, `cx-hide-desktop` hides at 720 and up. Put these on your own wrapper, not on a component.
- **Page frame** — `.cx-page` tightens its padding and gap one step on mobile automatically.

`align` and `justify` aren't responsive. When a row needs to become a column on mobile, restructure or use a grid with `[columnsMobile]="1"`, which covers most cases.

## Utility classes

Single-purpose helpers for the raw elements and wrappers *you* write — not for patching a component from outside. They live in the low-priority `cx-utilities` cascade layer, so a component's own styles always win: a utility can only style your own elements. Every value is a token reference.

- **Padding** — `cx-p-{step}` (all sides), `cx-px-` / `cx-py-` (axes), `cx-pt-` / `cx-pr-` / `cx-pb-` / `cx-pl-` (one side). Steps are the spacing scale: `cx-p-md`, `cx-px-sm`, …
- **Type size** — `cx-text-{title-1 | title-2 | title-3 | body-lg | body | body-sm | body-xs}`. Sets the font size *and* its matching line-height.
- **Font weight** — `cx-font-{regular | medium | bold}`.
- **Text colour** — `cx-text-{ink | muted | primary | accent | success | warning | danger | info | link}`. `cx-text-muted` is the high-opacity ink for secondary text.
- **Text align** — `cx-text-start` / `-center` / `-end`; `cx-truncate` (one line with an ellipsis).
- **Sizing** — `cx-w-full` (full width), `cx-measure-{sm | md | lg}` (capped + centred content column), `cx-min-h-screen` (full viewport height), `cx-fill` (grow to fill flex/grid space), `cx-center-inline` (centre a block).
- **Visibility** — `cx-hide-mobile`, `cx-hide-desktop`.

There are deliberately **no margin or gap utilities** — gap belongs to the layout primitives above.

## Article

Utilities and primitives are for UI. For a stream of editorial content — an article body, landing copy, markdown or CMS output — wrap it in `.cx-article` (add `.cx-article--lg` for hero scale) and its headings, paragraphs, lists, quotes, and code get a reading-optimised treatment with no per-element classes. It styles plain semantic HTML, so the source doesn't matter; the whole block scales from one custom property, `--cx-article-base`. Articles centre within an open reading canvas by default. Add `.cx-article--start` when the article is embedded beside navigation or another fixed column and must share that content column's start edge. The `cx-markdown` equivalent is `variant="article" align="start"`.

## The page frame

`.cx-page` is the outermost wrapper of a screen: a full-height column that owns the frame. `.cx-page__content` owns the page padding and the gap between content blocks.

```html
<div class="cx-page">
  <div class="cx-page__content">
    <!-- compose primitives here -->
  </div>
</div>
```

| class | role |
| --- | --- |
| `cx-page` | the frame (full-height flex column) |
| `cx-page__content` | the padded, gapped content column |
| `cx-page__content--fill` / `cx-page__fill` | a block that grows to fill the remaining height |
| `cx-page__notice` | full-bleed strip above the content |
| `cx-page__loading` | centred loading area |
| `cx-page--bounded` | clip overflow to the viewport (for inner scroll regions) |

The global `--gutter-page` token keeps page content and shared chrome aligned, while the frame exposes `--cx-page-gap` and `--cx-page-measure` for intentional page-level configuration. Authenticated product pages keep the default full-width measure and cap only an inner reading block. Use `--cx-page-measure` only for a surface whose page-level role is explicitly bounded, rather than as local polish.

## A composed screen

A header, a responsive metric grid, and a stack of cards — all spacing from the system, no custom CSS:

```html
<div class="cx-page">
  <div class="cx-page__content">
    <cx-split>
      <h1 start>Portfolio</h1>
      <cx-inline end gap="sm">
        <cx-button text="Filter" />
        <cx-button text="Add holding" />
      </cx-inline>
    </cx-split>

    <cx-grid [columns]="4" [columnsMobile]="2" gap="md" gapMobile="sm">
      <cx-metric>…</cx-metric>
      <cx-metric>…</cx-metric>
      <cx-metric>…</cx-metric>
      <cx-metric>…</cx-metric>
    </cx-grid>

    <cx-stack gap="md">
      <cx-card>…</cx-card>
      <cx-card>…</cx-card>
    </cx-stack>
  </div>
</div>
```
