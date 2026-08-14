# Packaging cx-framework

This file is for maintainers of the source framework.

The package is exported to the GitHub package repo `mikaelcedergren/cx-framework`, published for personal app installs as `@mikaelcedergren/cx-framework`.

## Improvement loop

Cortex is the source. `cx-framework` is the package. Every product using the shared UI consumes `@mikaelcedergren/cx-framework`; content and operations repos stay independent, and no downstream repo references Cortex implementation directly.

When a consuming project exposes a reusable framework gap, fix it in Cortex under `framework/`, package it here, obtain the user's explicit push authorisation under the shared Git policy, push the package repo to GitHub `main`, then update the consuming app. A good package export should make the current app better and leave all future apps stronger.

Cortex defines the contract and `cx-framework` delivers it. If that contract changes, every
consumer must migrate to the new selector, prop, token, default, or behavior. Never add a
compatibility shim, legacy alias, deprecated prop, fallback, or restored behavior to Cortex merely
because a consumer still uses the old contract.

## Source of truth

Make framework changes in the source app first. New components, patterns, tokens, icons, AI docs, AI skills, support files, and scripts should live under `framework/`.

Public Angular APIs must be exported from `public-api.ts`. If raw icon assets change, regenerate the icon manifest before exporting.

Angular code has one package entrypoint: `@mikaelcedergren/cx-framework`. Component, pattern, and tooling source folders are packaged for reference and build input but are not importable subpaths. Asset and maintainer subpaths are explicitly limited to `ai`, `fonts`, `icons`, `scripts`, `styles`, `support`, and `tokens`.

## Runtime dependencies

The package carries a deliberately small set of runtime dependencies, each owned by a specific component family:

- `marked` — markdown rendering in `cx-markdown` and the `cx-text-area` markdown preview.
- `ag-charts-community` — charting in `cx-chart`.
- `prosemirror-*` (state, view, model, transform, markdown, inputrules, keymap, commands, history, schema-list) — the editing engine behind `cx-markdown-editor`. The component stores plain markdown strings; ProseMirror provides the inline rich-text editing surface, markdown input rules, and undo history.

A new runtime dependency is an architectural decision: it ships to every consumer of the package, so it needs an owning component and explicit approval before it is added.

Validate the platform-neutral AI contract, the separate exact `cx-*` component metadata, and skill bridges before every dry run or apply:

```sh
pnpm framework:ai:check
```

The package scripts run this automatically. Do not package a stale component registry or malformed rule set.

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

Use `--bump minor`, `--bump major`, or `--version x.y.z` when the default patch bump is not right:

```sh
pnpm framework:package -- --apply --bump minor
pnpm framework:package -- --apply --version 0.2.0
```

By default the target is `../cx-framework`. For another checkout, use `CX_FRAMEWORK_REPO=/path/to/cx-framework` or pass `--target /path/to/cx-framework`.

## What the package includes

The package should include:

- `README.md`
- `PACKAGING.md`
- `tokens/`
- `styles/`
- `fonts/`
- `icons/`
- `primitives/`
- `patterns/`
- `ai/` — the self-contained, platform-neutral design guidance and skills
- `support/` — exact technical metadata for this Angular component library; not part of the portable AI contract
- `scripts/`
- `public-api.ts`
- `tsconfig.lib.json`
- `package.json`
- built `dist/` from the prepare/build step

The package exports `@mikaelcedergren/cx-framework/ai` as the AI entry point for `ai/design/00-start-here.md`; the complete `ai/*` tree remains available for task-local retrieval and skill-relative references. The portable design-system application contract lives at `ai/design/02-design-system.md`, never as a second root-level copy. Component-family terms in this tree are semantic roles: an agent inspects the consuming product's own design system and public APIs, then uses the best available component, configuration, or composition. The portable tree never maps those roles to `cx-*` names or depends on `support/` metadata.

Codex discovers repository skills only under `.agents/skills`, not inside installed dependencies. The package therefore exposes the dependency-free `cx-framework-skills` command. From a consuming repository root, `pnpm exec cx-framework-skills` creates symlinked discovery folders that point to the installed package's `ai/skills/*`. If the dependency belongs to a nested workspace, invoke that package's command with `--root` pointing to the repository root. The command exposes the complete portable set, preserves unrelated skills, and refuses to overwrite any existing local skill.

It should not include generated or local junk such as `node_modules/`, `out-tsc/`, `.DS_Store`,
`.framework-build.status.json`, interrupted `.framework-build-publish-*` directories, or empty junk
folders.

## After export

The package command validates every file in the explicit portable `ai/` allowlist for platform neutrality and AI-local references, validates the exact component registry separately, checks package-path relocation and the public export allowlist, verifies the complete portable skill/resource graph, exercises consumer skill discovery in a clean fixture, bumps `framework/package.json`, exports the package repo, refreshes package dependencies, builds the Angular library, verifies root TypeScript and Sass consumption while rejecting private code subpaths, and runs `npm pack --dry-run` so the packed file list is visible before commit/push.

After the package repo is committed and pushed, consuming apps using:

```json
{
  "dependencies": {
    "@mikaelcedergren/cx-framework": "github:mikaelcedergren/cx-framework#main"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "@mikaelcedergren/cx-framework"
    ]
  }
}
```

must refresh their install or lockfile so the GitHub dependency points at the new commit. Because
the GitHub source dependency builds `dist/lib` during `prepare`, every pnpm consumer must retain the
package in `pnpm.onlyBuiltDependencies`; a previously prepared pnpm store entry is not proof that a
clean install is reproducible.

If a consuming app exposes something wrong, fix the source framework and re-export rather than patching the app locally.
