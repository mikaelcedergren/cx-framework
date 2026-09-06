# cx-framework — packaged output, do not author here

This repository is generated from the authoritative Markdown and framework source in Cortex by
`pnpm framework:package`. It is consumed by other apps as
`@mikaelcedergren/cx-framework` (`github:mikaelcedergren/cx-framework#main`).

**Do not make design or code changes here.** Anything edited directly in this repo is overwritten
on the next package export. Make UI, portable AI-guidance, and Node runtime changes in Cortex, then
run the gated packaging command.

## Role in the Cortex -> cx-framework -> projects loop

Cortex is the source layer for components, tokens, AI skills, guidelines, design-system decisions,
and portable Node runtime primitives. This repo is only the packaged delivery layer. The `ai/`
tree is a platform-neutral design and working-method contract: component-family words describe
semantic roles, and agents resolve those roles through the consuming product's own design system.
Concrete `cx-*` selectors and APIs belong to this package's technical component source and
`support/` metadata, not to the portable AI contract. Explicit `server/*` subpaths are Node-only
and remain separate from browser entrypoints.

Repositories consume only the shared UI, portable AI guidance, Node runtime, or platform-check
entrypoints their role requires from this repo on GitHub `main`. Each repository retains its own
ownership and release boundary, and no downstream repo depends on Cortex directly through app
imports, package dependencies, local `file:` links, scripts, styles, or copied source.

If a consuming project reveals a framework gap during feature work, stop, explain the exact gap and
natural owner, and ask what the user wants to do. Do not change Cortex or create a consumer
workaround automatically. Only after the user explicitly authorises that framework work, make the
source fix in Cortex, package this repo again, obtain explicit push authorisation, push it to
GitHub, then reinstall and rebuild the consumer.

Rules that still apply:

- Verification runs through local package commands. Do not create GitHub Actions workflows or
  other automated CI configuration unless the owner explicitly requests it.

- Follow the shared Git policy in the development-root `AGENTS.md`: work on the current branch,
  never create a branch, pull when relevant, and push only after the user's specific current
  authorisation. Only after this package is pushed to GitHub `main` do consuming apps reinstall.
- Cortex and this current package have authority over consumers. When the contract changes,
  migrate every consumer forward; never add compatibility shims, legacy aliases, deprecated props,
  or restored behavior for stale downstream code.
- `README.md`, `package.json`, and this file are generated. Framework implementation and resource
  folders are copied from Cortex source.
- `.cx-framework-export.json` is the exporter ownership record. Re-export resets only declared
  generated roots, preserves Git/install/lockfile controls, and rejects unknown top-level data
  instead of deleting it.
- `dist/` is immutable built output produced and verified in Cortex, exported with this package,
  and committed here. Never edit it directly. Package installation runs no build lifecycle; local validation
  proves the checked-in output is usable before rebuilding and byte-identical afterward.
- The generated repository retains raw source for that rebuild proof. The installed dependency is
  narrower: `package.json.files` includes immutable output, public resources, and runtime commands,
  never raw Angular/Node TypeScript, workbench source, build scripts, or tsconfigs.
- Every Angular browser workspace owns the package's complete optional UI peer contract directly.
  Node-only workspaces declare none of those peers, so server artifacts do not inherit the browser
  dependency graph.
- Portable Node entrypoints live under explicit `server/*` subpaths and stay dependency-injected
  and browser-free. The source framework owns the product-artifact contract; host activation,
  launchd, nginx, backup, and retention remain outside this package.
- AI agents start at `ai/design/00-start-here.md`, also exposed by the package subpath
  `@mikaelcedergren/cx-framework/ai`. They inspect the consuming product's local components and
  public APIs instead of assuming this Angular library is installed or mapping semantic component
  roles to `cx-*` names.
- Installed dependencies are not Codex skill-discovery roots. From a consuming repository root,
  run `pnpm exec cx-framework-skills` to create non-copying `.agents/skills` bridges into this
  package.
