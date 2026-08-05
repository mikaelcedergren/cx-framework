# Framework primitives

Low-level reusable `cx-*` components live here. Do not infer the available API from folder names or this README; use the validated machine-readable discovery files:

- `../support/components/registry.json`: every public selector, area, category, and source path derived from the export graph
- `../support/components/guidance.json`: required exact-component guidance

Useful searches:

```sh
jq -r '.components[] | select(.area == "primitive") | [.name, .category, .path] | @tsv' support/components/registry.json
rg '"name": "cx-text-field"' support/components/registry.json
rg '"cx-text-field"' support/components/guidance.json
```

Areas:

- `actions`: buttons and direct actions
- `inputs`: typed, choice, range, date, and upload controls
- `navigation`: tabs, breadcrumbs, and pagination
- `overlay`: dialogs, popovers, menus, tooltips, and lightboxes
- `feedback`: alerts, banners, toasts, loading, progress, and validation feedback
- `display`: cards, tags, badges, metrics, text, code, and status presentation
- `data`: tables, lists, trees, charts, and query controls
- `layout`: stack, inline, grid, and split composition
- `media`: icons and images
- `shared`: framework internals; never product primitives

When a primitive needs repeatable behavior, change its owning public API within the accepted scope and update its workbench, metadata, and tests together. Consumers must not reach into primitive internals.
