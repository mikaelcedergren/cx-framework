# Packaging cx-framework

This file is for maintainers of the source framework.

The package is exported to the GitHub package repo `mikaelcedergren/cx-framework`, published for personal app installs as `@mikaelcedergren/cx-framework`.

## Source of truth

Make framework changes in the source app first. New components, patterns, tokens, icons, AI docs, AI skills, support files, and scripts should live under `framework/`.

Public Angular APIs must be exported from `public-api.ts`. If raw icon assets change, regenerate the icon manifest before exporting.

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
- `DESIGN-SYSTEM.md`
- `tokens/`
- `styles/`
- `fonts/`
- `icons/`
- `primitives/`
- `patterns/`
- `ai/`
- `support/`
- `scripts/`
- `public-api.ts`
- `tsconfig.lib.json`
- `package.json`
- built `dist/` from the prepare/build step

It should not include generated or local junk such as `node_modules/`, `out-tsc/`, `.DS_Store`, `.framework-build.status.json`, or empty junk folders.

## After export

The package command bumps `framework/package.json`, exports the package repo, refreshes package dependencies, builds the Angular library, and runs `npm pack --dry-run` so the packed file list is visible before commit/push.

After the package repo is committed and pushed, consuming apps using:

```json
{
  "dependencies": {
    "@mikaelcedergren/cx-framework": "github:mikaelcedergren/cx-framework#main"
  }
}
```

must refresh their install or lockfile so the GitHub dependency points at the new commit.

If a consuming app exposes something wrong, fix the source framework and re-export rather than patching the app locally.
