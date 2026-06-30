# Icons changelog

Record changes to the icon source set in `svg/`.

Use this shape for new entries:

```markdown
## YYYY-MM-DD

- Added `icon-name.svg` — short purpose.
- Renamed `old-name.svg` to `new-name.svg` — reason.
- Removed `icon-name.svg` — reason or replacement.
- Changed `icon-name.svg` — what changed and whether the meaning changed.
```

Keep entries short. The important part is whether an icon's purpose, name, or availability changed.

## 2026-06-27

- Restored `chevrons-right.svg` — double chevron used by `cx-tabs`. Its source SVG was missing while the generated `manifest.ts` still carried a stale entry for it; recreated from the manifest's path data so the source set, the manifest, and `cx-tabs` are consistent again.
