# Framework patterns

Patterns compose primitives into repeatable product shapes. Search the validated registry before building a page-level composition:

```sh
jq -r '.components[] | select(.area == "pattern") | [.name, .path] | @tsv' framework/support/components/registry.json
rg '"name": "cx-' framework/support/components/registry.json
```

Use a pattern when its product role fits. If a repeatable role is missing, strengthen or add the shared pattern within the accepted scope instead of creating a private screen-level copy.
