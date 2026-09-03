# Icons changelog

This is a historical change record, not the source of current icon availability.
The SVG source set and generated manifest define what exists now.

Record additions, removals, renames, and meaning changes to the icon source set
in `svg/`.

Use this shape for new entries:

```markdown
## YYYY-MM-DD

- Added `icon-name.svg` — short purpose.
- Renamed `old-name.svg` to `new-name.svg` — reason.
- Removed `icon-name.svg` — reason or replacement.
- Changed `icon-name.svg` — what changed and whether the meaning changed.
```

Keep entries short. The important part is whether an icon's purpose, name, or availability changed.

## 2026-09-01

- Changed `folder.svg` — lifted the artwork by 0.5px for optical vertical alignment; meaning unchanged.

## 2026-08-16

- Added `aqua-mode.svg` — theme icon for the Aqua appearance, alongside `light-mode`, `dark-mode`, and `night-mode`. A water droplet: the theme is a light theme on green-tinted paper, with blue actions and sea-green emphasis.

## 2026-06-27

- Restored `chevrons-right.svg` — double chevron used by `cx-tabs`. Its source SVG was missing while the generated `manifest.ts` still carried a stale entry for it; recreated from the manifest's path data so the source set, the manifest, and `cx-tabs` are consistent again.
