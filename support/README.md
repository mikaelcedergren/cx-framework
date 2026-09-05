# Framework discovery metadata

This folder is the machine-readable technical map of the concrete Angular `cx-*` library. It supports Cortex's component reference, source validation, and package tooling; it is intentionally implementation-specific.

The portable design guidance and skills under `../ai/` do not read this metadata or map semantic roles such as “button” and “dialog” to these component names. They discover and use the consuming product's own components, public APIs, configurations, and supported compositions. A consumer may still inspect this folder when `cx-framework` itself is its local component library, but the portable AI contract never assumes that relationship.

- `components/registry.json`: every component and directive reachable from `public-api.ts`, with selector and source path; exported tooling is marked as `area: tooling`, `category: reference`
- `components/authority.json`: generated, self-contained public contract for every registry entry, including selector and class identity, input/output bindings and types, content-projection selectors, defaults/transforms, and exact source/template/style digests
- `components/guidance.json`: complete, substantive exact-component guidance for people choosing and using the Cortex components; every key must resolve through the registry
- `components/locks.json`: a sorted list of registry components the user has locked as read-only source; only the workbench Lock switch writes it, and Cortex's source-side lock guard fails closed when this authority cannot be trusted
- `UPGRADES.md`: version-by-version record of public API, default, and behaviour changes for agents upgrading a consuming product; usage only, never internals or visual refinement
- `validation/visibility.rules.json`: the executable, framework-wide critical contract that no user-facing element renders without visible purpose

Do not create empty placeholder catalogs. A discovery file must be populated and consumed, or it should not exist. Do not edit `components/authority.json` by hand. Generate it from the public export graph, registry, Angular declarations, and templates:

Write component guidance in plain English for a designer or product author. Explain what the component is for, when it fits, and the user-facing behavior that matters. Keep selectors, properties, events, code structure, and other technical contracts in the API reference. `RULE-ID: copy.component-guidance.reader-language` owns this standard.

```sh
pnpm --dir framework components:authority
```

The strict `components:authority:check` path compares the expected bytes without writing. It runs before every framework build and through `framework:ai:check`, so a selector, binding, projection slot, template, or owning source change cannot leave stale package evidence behind.

Packed consumers resolve the catalog at
`@mikaelcedergren/cx-framework/support/components/authority.json` through an explicit package
export. The catalog carries the derived contract and byte digests itself without source or
absolute filesystem paths; installed packages deliberately omit raw `patterns/`, `primitives/`,
and `tooling/` source.

## Generated authority contract

Schema version 1 has one sorted `components` array and a `catalogSha256` over its canonical JSON.
Every component entry contains:

- registry-owned `name`, `area`, `category`, and exact Angular `selectors`
- declaration `kind` and the root-entrypoint class `publicApi.symbol`
- sorted `publicApi.inputs`, each with template binding name, class member, post-transform public
  value type, required state, transform expression, default expression, and
  decorator/signal/model origin
- sorted `publicApi.outputs`, where `type` is the emitted payload rather than the emitter wrapper
- template-order `contentProjection`; `selector: "*"` is the default unnamed `ng-content` slot
- path-free `evidence` with lowercase SHA-256 digests for the owning TypeScript declaration,
  template, and ordinal styles; external, inline, or absent resource kinds are explicit

The generator sorts identity and binding collections, performs a second full input attestation
before checking or activating output, and writes atomically. Unsupported dynamic metadata fails
instead of being guessed. Schema version 1 is bounded to 2 MiB, 512 components, 32 selectors, 256
inputs, 256 outputs, 64 projection slots, and 16 styles per component, with aggregate limits of
8,192 inputs, 4,096 outputs, and 4,096 slots. Identifier, selector, and source-expression lengths
are bounded too. The usable selector, API, slot, default, and transform facts are already in the
catalog, while public named TypeScript declarations remain available in compiled `dist/lib`
declarations.

Before inventing UI, query the generated authority and current guidance. After changing a public component or directive, update the handwritten registry or guidance when their facts changed, regenerate the authority, and run:

```sh
pnpm framework:ai:check
```

The validator follows the public export graph, requires guidance for every discovered entry, rejects private implementation selectors, and checks the generated authority byte-for-byte. Package validation separately proves the authority is publicly resolvable and complete in a packed install while raw component source stays absent. Discovery therefore cannot silently drift from the component API or teach consumers to use internal pieces.
