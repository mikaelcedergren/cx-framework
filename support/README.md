# Framework discovery metadata

This folder is the machine-readable map of the framework.

- `components/registry.json`: every component and directive reachable from `public-api.ts`, with selector and source path; exported tooling is marked as `area: tooling`, `category: reference`
- `components/guidance.json`: complete exact-component guidance shared by the component reference and packaged AI consumers
- `validation/composition.rules.json`: composition constraints
- `validation/placement.rules.json`: placement constraints
- `validation/visibility.rules.json`: visibility constraints

Do not create empty placeholder catalogs. A discovery file must be populated and consumed, or it should not exist.

Before inventing UI, query the registry and inspect the public source API. After adding, removing, or renaming a public component or directive, update the discovery metadata and run:

```sh
pnpm framework:ai:check
```

The validator follows the public export graph, requires guidance for every discovered entry, and rejects private implementation selectors. Discovery therefore cannot silently drift from the component API or teach consumers to use internal pieces.
