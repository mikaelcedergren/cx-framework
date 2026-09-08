# Web platform contract

This folder is the machine-readable web-product contract authored by Cortex and delivered through
`@mikaelcedergren/cx-framework`.

- `cx-product.schema.json` defines product capabilities. A product manifest describes what the
  product is allowed to need; it does not duplicate ports, domains, service labels, or backup paths
  from the Mac mini operational registries.
- `frontend.designSystem` names the implementation source. `frontend.visualSystem` separately
  records whether the product presents the shared visual language or an approved product skin;
  Faunapoolen is the sole current product-skin exception and still consumes cx-framework.
- `web-standard.json` owns mutable toolchain, canonical-command, and pnpm workspace-policy facts.
- `cx-platform-check` validates a repository against both files.
- `cx-platform-check` also runs the [style token check](#style-token-check) on owned source.
- `server/product-manifest` loads the sealed runtime copy of `cx-product.json`, validates this full
  schema and its compatibility rules without a dependency, and returns a deeply frozen typed
  value for each web or worker process.

Product manifests live at `<repo>/cx-product.json`. The schema path may point into the installed
package for editor support, but validation is always local and makes no network request.

## Style token check

`cx-style-token-check` enforces the mechanically detectable part of `tokens.direct-global` in
[the shared token rules](../ai/design/03-ux-rules.md#tokens-and-color). It is dependency-free and
ships with the package. `cx-platform-check` runs it automatically; it is also available directly:

```sh
pnpm exec cx-style-token-check
pnpm exec cx-style-token-check --base <change-start-commit>
pnpm exec cx-style-token-check --all
```

The default compares the working tree, including staged and untracked source, with `HEAD`.
Use `--base` for a task spanning commits or the pull request's base commit in CI. An unavailable
base fails the check. `--all` audits existing source; a product without Git or before its first commit also receives a full
audit. Unchanged findings in a change check remain violations, not approved exceptions. Their
migration needs its own scope; do not use them as examples for new work.

The optional repository-root `style-token-policy.json` declares exact `sourceRoots` and
`globalTokenFiles` paths. Without it, the checker examines the repository and recognises the
installed package's global tokens. It excludes dependencies, generated output, private data,
tests, and fixtures. List every owned UI source root, including inline styles, examples, and
runtime styling; this is an ownership declaration, never a per-file suppression list.

```json
{
  "sourceRoots": ["src"],
  "globalTokenFiles": ["src/styles/tokens.css"]
}
```

Only root/theme declarations in approved global token files introduce recognised global names.
The checker rejects local declarations (including literal and calculated values), non-global
`var()` references, custom-property bindings, and common runtime writes. A component variable in
an unapproved `:root` still fails. Approved global semantic aliases pass. New global names and
changes to the ownership declaration still require review and the approval in `tokens.new-global`.

This is static source analysis, not a CSS evaluator. Review generated or dynamically assembled
styles and indirect runtime writes explicitly. It does not decide token purpose, colour similarity,
accessibility, or whether the user approved a change. Passing it never replaces those judgments.

## Hermetic E2E modules

`e2e-runner-public.mjs` is the only packaged runtime facade. It exposes the product-facing runner,
environment constructors, Playwright helpers, exact-origin fetch wrapper, and runtime validator.
The implementation stays split by ownership so lifecycle changes remain reviewable:

- `e2e-runner.mjs` orchestrates one run, owns the product-facing configuration contract, and puts a
  private launcher for the integrity-pinned pnpm CLI first in the child `PATH` so nested package
  scripts remain hermetic. Every framework-owned Playwright, controller, and controller-created
  child environment also pins the exact lowercase
  `pnpm_config_verify_deps_before_run=error` setting. Product configuration cannot replace or add
  pnpm/npm configuration; only the two `/dev/null` `NPM_CONFIG_*CONFIG` fences required by a
  reviewed nested build are accepted.
- `e2e-runtime-ownership-internal.mjs` owns private roots, markers, proxy receipts, and the lease.
- `e2e-process-ownership-internal.mjs` owns exact child environments, process-group receipts,
  authenticated teardown, and death proof.
- `e2e-network-orchestration-internal.mjs` owns dynamic listeners, the exact-origin proxy (including
  an exact-authority-only HTTP `CONNECT` tunnel for managed Playwright API requests), bounded
  listener closure, readiness, and fetch-origin enforcement.
- `e2e-source-policy-internal.mjs` audits the complete local Playwright config/test source graph
  before any controller or browser process starts.
- `e2e-network-guard.mjs` is the inherited Node preload. Dependency-created Angular build workers
  retain that preload and may carry only Angular's packaged render hook, its localhost host fence,
  source maps, and a Node compile-cache directory inside the owned runtime root.
  `e2e-health-probe.mjs` is the bounded ownership-aware readiness probe.

Every `*-internal.mjs` subpath, the preload, the probe, and direct implementation filenames are
blocked by an exact package-export allowlist with no platform wildcard. This also prevents encoded
or query-suffixed subpaths from reaching private modules. Consumers import only
`platform/e2e-runner`; Cortex imports the source facade because it produces the package.

The permanent rationale and architecture live in the development root
`WEB-ARCHITECTURE.md`. Mac mini operations remain in `server-ops` and the root server documents.
