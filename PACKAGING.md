# Packaging cx-framework

This file is for maintainers of the source framework.

The package is exported to the GitHub package repo `mikaelcedergren/cx-framework`, published for
personal app installs as `@mikaelcedergren/cx-framework`. It delivers Cortex's Angular UI,
portable AI guidance, product manifest tooling, and Node 26 web-runtime contracts together.

## Improvement loop

Cortex is the source. `cx-framework` is the package. Repositories consume only the applicable
shared UI, portable AI guidance, Node runtime, or platform-check entrypoints from
`@mikaelcedergren/cx-framework`. They retain independent ownership and release boundaries, and no
downstream repo references Cortex implementation directly.

When a consuming project exposes a reusable framework gap, fix it in Cortex under `framework/`, package it here, obtain the user's explicit push authorisation under the shared Git policy, push the package repo to GitHub `main`, then update the consuming app. A good package export should make the current app better and leave all future apps stronger.

Cortex defines the contract and `cx-framework` delivers it. If that contract changes, every
consumer must migrate to the new selector, prop, token, default, or behavior. Never add a
compatibility shim, legacy alias, deprecated prop, fallback, or restored behavior to Cortex merely
because a consumer still uses the old contract.

## Source of truth

Make framework changes in the source app first. New components, patterns, tokens, icons, AI docs, AI skills, support files, and scripts should live under `framework/`.

Public Angular APIs must be exported from `public-api.ts`. If raw icon assets change, regenerate the icon manifest before exporting. After any public component source or template change, regenerate `support/components/authority.json` with `pnpm --filter @mikaelcedergren/cx-framework components:authority`; it is derived package evidence and is never edited by hand.

Angular code has one package entrypoint: `@mikaelcedergren/cx-framework`. Exact component tooling resolves the packed, self-contained authority through the explicit `@mikaelcedergren/cx-framework/support/components/authority.json` export; it exposes selector/class identity, typed public bindings, projection selectors, defaults/transforms, and path-free source/template/style digests without exposing the source files themselves. Component, pattern,
tooling, and Node TypeScript remain in the generated repository solely as rebuild-CI input; packed
and Git dependency installs exclude those raw source folders. Installed public resource subpaths
are limited to `ai`, `fonts`, `icons`, the three explicit platform resources (`README.md`,
`cx-product.schema.json`, and `web-standard.json`), `styles`, `support`, and `tokens`. The
`platform/e2e-contract` and `platform/e2e-runner` are explicit Node-only entrypoints. Platform has
no wildcard export: the runner's implementation modules, private network preload, and bounded
health probe cannot be exposed through an alternate encoded or query-suffixed subpath. The
lightweight contract owns the inclusive
`E2E_DYNAMIC_PORT_RANGE` (`49152..65535`) without loading runner/process code. The server-wide port
registry must keep every active or prepared product listener outside that E2E-owned range. Fixed
product E2E ports are not supported, so one range-level registry invariant covers every suite. The
runner also owns Playwright launch and context proxy settings, QUIC/WebRTC escape restrictions,
service-worker blocking, managed manual contexts, and a prelaunch audit that rejects test-owned
network controls, unmanaged browser/context creation, and test-owned process/worker escapes. Its
exact-origin proxy accepts `CONNECT` only for the same owned authority so Playwright's managed API
transport works without gaining another destination. Angular dependency workers retain the guard
with only the packaged render hook, localhost host fence, source maps, and an owned runtime-root
Node compile cache admitted through their worker options. Its
containment boundary assumes trusted repository source and ordinary dependencies; it does not claim
to sandbox deliberately malicious same-user/in-process code or native non-Node subprocesses. The three
installed executable scripts are package commands, and
`scripts/workspace-contract.mjs` is their private shared parser helper. None is an importable public
package subpath.

For E2E, containment begins at the first instruction of `scripts/run-e2e.mjs`. Calling that file
with the resolved absolute Node executable is the canonical harness boundary; a package-manager
script is only its convenience bootstrap and cannot sanitize code already executed by the invoking
shell or `NODE_OPTIONS`. From that boundary onward the runner resolves trusted local executables,
constructs exact child environments, installs a private per-run `pnpm` launcher bound to the
integrity-pinned CLI, owns dynamic ports and its private `/tmp` root, and proves
listener/process-group death before removing that root. Because pnpm correctly isolates workspace
dependencies, the root package that owns `scripts/run-e2e.mjs` declares cx-framework directly even
when browser and server child workspaces already do.

## Runtime dependencies

The published package has no automatic production dependencies. Its Angular surface instead has
one complete optional peer contract, owned by these component families:

- `marked` — markdown rendering in `cx-markdown` and the `cx-text-area` markdown preview.
- `ag-charts-community` — charting in `cx-chart`.
- `prosemirror-*` (state, view, model, transform, markdown, inputrules, keymap, commands, history,
  schema-list) — the editing engine behind `cx-markdown-editor`. The component stores plain
  markdown strings; ProseMirror provides the inline rich-text editing surface, markdown input
  rules, and undo history.
- Angular, Angular CDK, RxJS, and `tslib` — the compiled standalone component runtime.

`cx-qr-code` uses its framework-owned encoder and adds no QR-code package. A product that imports
`qrcode` for its own behavior still owns that separate dependency.

Every Angular browser workspace declares the complete peer set directly in its production
dependencies, even when its current pages use only part of the component library. The single root
Angular entrypoint re-exports the complete public surface, so declaring only the peers visible in
today's templates would make an ordinary root import dependent on bundler accident. Cortex keeps
the same libraries in `devDependencies` to build the source. Its authoring workspace also declares
the app's `zone.js` runtime so pnpm resolves one Angular peer identity while the Cortex app compiles
framework source directly; `zone.js` is not promoted to a framework peer because Angular itself
keeps that runtime optional. All framework peers are optional only at package installation time,
which lets a Node-only workspace install a server subpath with no UI closure; the platform checker
enforces the browser side of this boundary.

A new runtime dependency is an architectural decision. Decide whether it belongs to the browser
peer contract, a consumer-owned server adapter, or a genuinely portable Node primitive before
adding it; never make every server artifact carry a UI library.

The Node runtime adds no framework-owned production dependency. Express, compression, SQLite
drivers, and product adapters remain injected by consumers. `@types/node` is a direct development
dependency used to compile the strict Node 26 source and package fixtures; it contributes no
runtime JavaScript. Node exports use explicit nested `node` conditions and ESM imports so they fail
closed through CommonJS and browser resolution. The listener subpath awaits the consumer's injected
Express-compatible application and turns both synchronous listen failures and asynchronous bind
callback errors into one rejected startup promise. The server-identity subpath validates immutable
release metadata, pins it at process startup, and exposes that same payload at `/cx-server.json`;
activation, restart, retention, and rollback remain operational concerns outside the package.
The private-environment subpath provides the POSIX owner/mode-0600, no-follow, bounded fatal-UTF-8,
NUL-free, allowlist-before-merge primitive shared by web and worker startup; products still own the
role filename, role key policy, cross-role isolation, and downstream configuration.
The static-site subpath likewise requires an explicit absolute `manifestFile` and the executing
module's `entrypointUrl` so product identity and web-process role come from the same sealed server
artifact, while its separate `repoRoot` continues to own operational browser-release state. It
never falls back to a mutable working-directory manifest. Production and release validation both
require the exact release identity and prove the sealed web entrypoint before browser or
application resources; ordinary production also requires a validated browser snapshot.
The peer boundary above keeps every UI library out of a Node-only install. Angular products own
their browser runtime directly; server workspaces do not redeclare those peers.

### Workspace peer isolation

A product that keeps its browser application and Node-only server in one pnpm workspace must follow
the canonical
[workspace peer-isolation contract](https://github.com/mikaelcedergren/development-root/blob/main/WEB-ARCHITECTURE.md#workspace-peer-isolation).
It keeps `autoInstallPeers: false`, `resolvePeersFromWorkspaceRoot: false`, and
`dedupePeerDependents: false`: they prevent peer synthesis, control where peers may resolve, and
keep pnpm from merging the distinct peer contexts afterward. They are complementary, not
interchangeable. The linked root architecture owns the exact workspace rule and full rationale;
this package document owns only the consequence for cx-framework: the browser declares the
complete UI peer contract and the server declares none of it.

Validate the platform-neutral AI contract, the separate exact `cx-*` component metadata, generated component authority, and skill bridges before every dry run or apply:

```sh
pnpm framework:ai:check
```

The package scripts run this automatically. The read-only gate regenerates the component authority in memory and requires byte identity; it never repairs drift during validation. Do not package a stale component registry, authority, or malformed rule set.

## Dry run

From the source repo root:

```sh
pnpm framework:package
```

The dry run reports the next version and checks the export without changing the target package repo.

## Apply

When the dry run looks right:

```sh
pnpm framework:package -- --apply
```

`--apply` refuses to package a version that has no `## <version>` section in
`support/UPGRADES.md`, and the dry run reports the same gap before you get there. That file
is how a consuming product's agent learns what it must adapt, so write the section for the
version being cut: every removed or renamed prop, changed default, required markup, and new
behaviour, each with the action to take. When a version changes nothing for a consumer, say
that in the section instead of leaving it out.

Use `--bump minor`, `--bump major`, or `--version x.y.z` when the default patch bump is not right:

```sh
pnpm framework:package -- --apply --bump minor
pnpm framework:package -- --apply --version 0.2.0
```

By default the target is `../cx-framework`. For another checkout, use `CX_FRAMEWORK_REPO=/path/to/cx-framework` or pass `--target /path/to/cx-framework`.

## What the generated repository includes

The generated Git repository retains the build source needed for its independent byte-identity
check:

- `README.md`
- `PACKAGING.md`
- `tokens/`
- `styles/`
- `fonts/`
- `icons/`
- `platform/` — the web-product manifest schema
- `primitives/`
- `patterns/`
- `server/` — strict portable Node source
- `ai/` — the self-contained, platform-neutral design guidance and skills
- `support/` — exact technical metadata for this Angular component library, including the generated public component authority; not part of the portable AI contract
- `scripts/`
- `public-api.ts`
- `tsconfig.lib.json`
- `tsconfig.server.json`
- `package.json`
- `pnpm-lock.yaml` — committed repository toolchain resolution for byte-identical rebuild checks
- immutable built `dist/`, produced in Cortex and committed in the generated package

The installed dependency is deliberately narrower. Its `files` allowlist carries immutable
`dist/`, public AI/assets/styles/tokens/support/platform resources, including the self-contained component authority, the two package documents, and
the three runtime commands (`cx-framework-skills`, `cx-platform-check`, and `cx-server-artifact`)
plus their private, non-exported `workspace-contract.mjs` parser helper. Raw Angular and Node
TypeScript, workbench source, root TypeScript entry files, build scripts, and tsconfigs remain in
the generated repository for CI but never enter a consumer or server artifact. This distinction
applies to both packed installs and Git dependencies.

The package exports `@mikaelcedergren/cx-framework/ai` as the AI entry point for `ai/design/00-start-here.md`; the complete `ai/*` tree remains available for task-local retrieval and skill-relative references. The portable design-system application contract lives at `ai/design/02-design-system.md`, never as a second root-level copy. Component-family terms in this tree are semantic roles: an agent inspects the consuming product's own design system and public APIs, then uses the best available component, configuration, or composition. The portable tree never maps those roles to `cx-*` names or depends on `support/` metadata.

Codex discovers repository skills only under `.agents/skills`, not inside installed dependencies. The package therefore exposes the dependency-free `cx-framework-skills` command. From a consuming repository root, `pnpm exec cx-framework-skills` creates symlinked discovery folders that point to the installed package's `ai/skills/*`. If the dependency belongs to a nested workspace, invoke that package's command with `--root` pointing to the repository root. The command exposes the complete portable set, preserves unrelated skills, and refuses to overwrite any existing local skill.

It should not include generated or local junk such as `node_modules/`, `out-tsc/`, `.DS_Store`,
`.framework-build.status.json`, interrupted `.framework-build-publish-*` directories, or empty junk
folders.

## After export

The package command validates every file in the explicit portable `ai/` allowlist for platform
neutrality and AI-local references, validates the exact component registry and generated component authority separately, checks
package-path relocation and the public export allowlist, verifies the complete portable
skill/resource graph, bumps `framework/package.json`, exports the package repo, refreshes package
dependencies, and builds both the Angular library and Node runtime in Cortex before copying the
output. It validates and imports the copied distribution before rebuilding, then requires the
rebuild to be byte-identical. Generated-package CI additionally requires every `dist/` file to be
tracked and clean both before and after that comparison. The generated repository uses the
`framework-package` CI profile: it invokes its canonical `pnpm check` gate, but deliberately has no
`pnpm e2e` command because it is an immutable package repository, not a runnable browser product.
Framework browser journeys remain owned and exercised by the Cortex source repository. The
validator packs the real artifact,
installs it with pnpm offline and with lifecycle scripts disabled into an isolated clean consumer, proves the public authority subpath resolves there while raw component/tooling source does not exist,
exercises skill discovery, Node ESM/NodeNext imports, root TypeScript, and Sass, and proves that
CommonJS, browser server imports, DOM globals in the Node compiler boundary, and private code
subpaths all fail closed. `npm pack --dry-run` keeps the final shipped file list visible before
commit/push.

After the package repo is committed and pushed, consuming apps using:

```json
{
  "dependencies": {
    "@mikaelcedergren/cx-framework": "github:mikaelcedergren/cx-framework#main"
  }
}
```

must refresh their install or lockfile so the GitHub dependency points at the new commit. Because
the GitHub package now delivers verified `dist/lib` and `dist/server` output directly, consumers
must keep it absent from the pnpm 11 `allowBuilds` map in `pnpm-workspace.yaml`. Package
selectors, version-qualified selectors, Git/tarball identities, and matching globs all count as a
grant. The root workspace must also keep `strictStorePkgContentCheck: true`; a repeatable build may
never disable pnpm's store identity verification. It must keep `enableGlobalVirtualStore: false`,
`strictDepBuilds: true`, `verifyDepsBeforeRun: error`, `verifyStoreIntegrity: true`, and must not
enable `dangerouslyAllowAllBuilds`. Repository scripts stop on a stale dependency projection; they
never trigger pnpm's implicit install path. Package installation runs no lifecycle build;
installing the packed artifact with lifecycle scripts disabled is part of the package contract.

If a consuming app exposes something wrong, fix the source framework and re-export rather than patching the app locally.
