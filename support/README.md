# Framework discovery metadata

This folder is the machine-readable technical map of the concrete Angular `cx-*` library. It supports Cortex's component reference, source validation, and package tooling; it is intentionally implementation-specific.

The portable design guidance and skills under `../ai/` do not read this metadata or map semantic roles such as “button” and “dialog” to these component names. They discover and use the consuming product's own components, public APIs, configurations, and supported compositions. A consumer may still inspect this folder when `cx-framework` itself is its local component library, but the portable AI contract never assumes that relationship.

- `components/registry.json`: every component and directive reachable from `public-api.ts`, with selector and source path; exported tooling is marked as `area: tooling`, `category: reference`
- `components/guidance.json`: complete, substantive exact-component guidance for the Cortex component reference and technical library consumers; every key must resolve through the registry
- `components/locks.json`: a sorted list of registry components the user has locked as read-only source; only the workbench Lock switch writes it, and Cortex's source-side lock guard fails closed when this authority cannot be trusted
- `UPGRADES.md`: version-by-version record of public API, default, and behaviour changes for agents upgrading a consuming product; usage only, never internals or visual refinement
- `validation/visibility.rules.json`: the executable, framework-wide critical contract that no user-facing element renders without visible purpose

Do not create empty placeholder catalogs. A discovery file must be populated and consumed, or it should not exist.

Before inventing UI, query the registry and inspect the public source API. After adding, removing, or renaming a public component or directive, update the discovery metadata and run:

```sh
pnpm framework:ai:check
```

The validator follows the public export graph, requires guidance for every discovered entry, and rejects private implementation selectors. Discovery therefore cannot silently drift from the component API or teach consumers to use internal pieces.
