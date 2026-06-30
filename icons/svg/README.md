# Cortex icons — source SVGs

This folder is the **canonical icon source** for Cortex and the packaged framework output. Icons are authored here and copied outward during packaging — never the other way around.

See [`../README.md`](../README.md) for the icon contract, the authoring workflow, and the changelog.

Conventions:

- use kebab-case filenames
- do not use spaces in filenames
- keep each icon a raw SVG source asset: 24×24, one `<path>`, `id="icon"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.5"`, round caps and joins

After adding or changing an icon, validate and regenerate from the framework package:

```sh
pnpm --filter @mikaelcedergren/cx-framework icons:check   # validate the contract (fails on any issue)
pnpm --filter @mikaelcedergren/cx-framework icons:index   # rebuild ../index.html (visual QA)
pnpm --filter @mikaelcedergren/cx-framework icons         # rebuild ../manifest.ts (cx-icon lookup)
```
