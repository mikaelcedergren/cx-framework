# Cortex Icons

This folder mirrors the icon handoff from `ux-foundation/icons/src`.

When icons are updated upstream, sync the whole source set into this folder, not
only the newly added filenames. Existing icons may have received SVG fixes.

After syncing, regenerate the Cortex icon manifest:

```sh
pnpm --filter @mikaelcedergren/cx-framework icons
```

Conventions:

- use kebab-case filenames
- do not use spaces in filenames
- keep icons as raw SVG source assets
