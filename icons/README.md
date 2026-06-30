# Cortex icons

Cortex is the source of truth for the icon library. Icons are authored here and flow outward into the `cx-icon` primitive and the packaged framework output. Nothing copies back into this folder.

## Layout

- `svg/` — the canonical source SVGs (one file per icon, kebab-case).
- `manifest.ts` — generated `cx-icon` lookup (`CxIconName`, `cxIcons`, `getCxIcon`). Do not hand-edit.
- `index.html` — generated visual QA page (open in a browser after `icons:index`).
- `changelog.md` — record additions, removals, renames, and meaning changes.

## The icon contract

Every source SVG must be a clean outline icon:

- 24×24 canvas: root `<svg>` with `width="24"`, `height="24"`, `viewBox="0 0 24 24"`.
- Root `id="icon"` and `fill="none"`. The `id` is the shared `<use>` reference contract the packaged icon system depends on.
- One `<path>` carrying all geometry — Portal-compatible path data. It may contain several subpaths, but it must be a single `<path d="">`.
- `stroke="currentColor"`, `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- No `fill` on geometry, no masks, `defs`, gradients, clip paths, groups, non-path shapes, inline `style`, `transform`, or `stroke-dasharray`.
- If an icon must emulate fill, use repeated strokes and tune the read at 32px; otherwise optimize ordinary outline icons for clarity at 16px. Keep `stroke-width="1.5"` even when an icon looks heavy — adjust geometry, spacing, or faux-fill density, not the stroke width.
- Names are purpose-based, kebab-case, stable, no spaces. Choose by meaning, not visual similarity. Don't introduce external icon sets, and don't invent a new icon when an existing one fits.

The design source is the owner's design tooling (Figma where applicable); `svg/` holds the clean exports used for implementation and review.

## Workflow

After adding or changing an icon in `svg/`:

```sh
pnpm --filter @mikaelcedergren/cx-framework icons:check   # validate the contract — exits non-zero on any issue
pnpm --filter @mikaelcedergren/cx-framework icons:index   # rebuild index.html, then open it to review visually
pnpm --filter @mikaelcedergren/cx-framework icons         # rebuild manifest.ts (the cx-icon lookup)
```

Record the change in `changelog.md`. A visual refinement keeps the same name; a meaning change needs a new or renamed icon and a changelog note.

`icons:check` validates the full contract and flags exact and visual (normalized-geometry) duplicates. `icons:index` bakes the source SVGs into a self-contained review page with per-icon diagnostics and size/aspect/paint previews.

## Pushing downstream

This library is upstream. To move an icon outward, package the framework from Cortex so the package output receives the source SVGs. Never wire an automatic sync that lets another repo overwrite `svg/`.
