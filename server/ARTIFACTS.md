# Server artifact contract

`cx-server-artifact` is the framework-owned builder for every web product's immutable Node 26
release artifact. `server-ops` owns staging, sealing, isolation, activation, and rollback; this CLI
owns only the portable product build placed in the empty directory it receives.

Every product uses the same nested shape:

```text
artifact/
├── cx-product.json
└── server/
    ├── dist/
    ├── node_modules/
    └── package.json
```

The repository must have one explicitly listed `server/` workspace package and these pnpm settings:

```yaml
packages:
  - server
injectWorkspacePackages: true
autoInstallPeers: false
dedupePeerDependents: false
enableGlobalVirtualStore: false
resolvePeersFromWorkspaceRoot: false
strictDepBuilds: true
strictStorePkgContentCheck: true
verifyDepsBeforeRun: error
verifyStoreIntegrity: true
dangerouslyAllowAllBuilds: false
syncInjectedDepsAfterScripts: []
```

These values are the artifact-facing expression of the canonical
[workspace peer-isolation contract](https://github.com/mikaelcedergren/development-root/blob/main/WEB-ARCHITECTURE.md#workspace-peer-isolation).
`autoInstallPeers: false` prevents pnpm from synthesizing optional UI peers for the Node-only
consumer. `resolvePeersFromWorkspaceRoot: false` prevents it from borrowing those peers from the
browser root. `dedupePeerDependents: false` keeps pnpm from replacing the resulting peerless server
package instance with the browser workspace's peer-filled instance during deployment.
`strictStorePkgContentCheck: true` keeps pnpm's package-name and version verification active for
every cold- and warm-store deployment; repeatability must never come from disabling that check.
`verifyStoreIntegrity: true` keeps file-integrity verification active. `strictDepBuilds: true` and
`dangerouslyAllowAllBuilds: false` require every lifecycle permission to remain explicit.
`enableGlobalVirtualStore: false` keeps each repository's dependency projection inside that
repository instead of sharing one mutable projection across unrelated products.
`verifyDepsBeforeRun: error` makes a stale or absent install stop before any package script; pnpm
must never repair dependencies implicitly while a check, build, E2E controller, or release command
is already running.

The root pins Node `>=26 <27` and the exact integrity-qualified pnpm `11.23.0` package-manager
identity declared by `platform/web-standard.json`. The integrity suffix is part of the contract,
not optional metadata. pnpm 11.23.0 is also the minimum artifact-builder version because it
preserves a local tarball's real package name across repeated shared-lock deployments; older
versions can poison a warm store with a filename-derived identity and fail an unchanged second
build. The server package is named
`<cx-product.id>-server`, is ESM, pins the same Node engine, declares one clean `build` script, and
uses a literal `files` allowlist containing `dist/` plus only the non-data runtime assets it needs.
Its build must clean `dist/` before compiling so normal and release builds have the same stale-output
guarantee. The artifact builder independently removes the exact real `server/dist`, invokes that
build, and then validates the allowlist.

The registered release command calls only the packaged CLI:

```json
{
  "scripts": {
    "build:server:release": "cx-server-artifact --package example-server"
  }
}
```

`server-ops` supplies `SERVER_RELEASE_ARTIFACT_DIR`, `SERVER_RELEASE_ENTRYPOINT`, and
`SERVER_RELEASE_WORKERS`. HTTP and worker entrypoints stay beneath `server/dist/`. The CLI verifies
the exact server package name before using the unambiguous `./server` workspace filter, builds with
the pinned local pnpm, and deploys production dependencies offline with lifecycle scripts disabled
and copy semantics. It copies the root product manifest into the artifact rather than reading it
from the mutable checkout at runtime.

Before returning, the builder removes pnpm path receipts, reduces the deployed package manifest to
runtime ESM metadata, materialises any pnpm hard-linked files as owned copies, and rejects source or
test files, special entries, absolute/dangling/escaping links, generated executable shims, mutable
build-path receipts, missing entrypoints, and anything outside the exact root shape. The installed
`@mikaelcedergren/cx-framework` tree is additionally restricted to the package's declared published
surface, including only its approved resource directories and four shipped runtime scripts. This
fails closed if a Git transport or packaging regression exposes Cortex source, build controls, or
new unreviewed tooling beneath either a direct or pnpm virtual-store package path. A direct
framework-package symlink must resolve to the same exact contained package path in the physical
dependency tree; a similarly named target is rejected. Relative contained executable symlinks are
retained. `server-ops` remains the final authority for artifact ceilings, deterministic sealing,
clean-root startup, health and identity probes, and mutation checks.

Every compiled web entrypoint passes its own `import.meta.url` into the shared or product runtime.
Ordinary production and `CX_RELEASE_VALIDATION=1` startup require the selected immutable
`server-release.json` and prove that URL against its declared web entrypoint before opening browser,
application, database, or listener resources. `NODE_ENV` is absent only for development defaults;
when configured it is exactly `development`, `test`, or `production`.
