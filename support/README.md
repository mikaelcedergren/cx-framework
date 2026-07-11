# Framework discovery metadata

This folder is the machine-readable map of the framework.

- `components/registry.json`: every public primitive, pattern, tooling component, and public directive with selector and source path
- `components/guidance.json`: component guidance maintained by the reference surface
- `validation/composition.rules.json`: composition constraints
- `validation/placement.rules.json`: placement constraints
- `validation/visibility.rules.json`: visibility constraints

Do not create empty placeholder catalogs. A discovery file must be populated and consumed, or it should not exist.

Before inventing UI, query the registry and inspect the public source API. After adding, removing, or renaming a public component or directive, update the discovery metadata and run:

```sh
pnpm framework:ai:check
```

The validator compares registry selectors with framework source so discovery cannot silently drift.
