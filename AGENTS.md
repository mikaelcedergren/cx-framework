# cx-framework — packaged output, do not author here

This repository is generated. It is the published output of the Cortex design system, exported by `pnpm framework:package` from the Cortex repo, and consumed by other apps as `@mikaelcedergren/cx-framework` (`github:mikaelcedergren/cx-framework#main`).

**Do not make design or code changes here.** Anything edited directly in this repo is overwritten on the next export. Make framework changes in Cortex — `framework/` for source, `docs/DESIGN-SYSTEM.md` for the reference — then re-run the packaging command.

## Role in the Cortex -> cx-framework -> projects loop

Cortex is the source layer for components, tokens, AI skills, guidelines, and design-system decisions. This repo is only the packaged delivery layer.

Every other project consumes this repo as `@mikaelcedergren/cx-framework` from GitHub `main`. They must never depend on Cortex directly through app imports, package dependencies, local `file:` links, scripts, styles, or copied source.

If a consuming project needs a framework upgrade, make the source fix in Cortex, export this repo again, let the owner push it to GitHub, then reinstall/rebuild the consumer from this package. That is how one small fix becomes a benefit for every project.

Rules that still apply:

- Do not run write-side git here as part of agent work. After Cortex packages a new version, the owner reviews and pushes it to GitHub `main`; only then do consuming apps reinstall.
- Keep framework changes additive so existing consumers do not shift visually.
- `README.md`, `DESIGN-SYSTEM.md`, and `package.json` are generated; the folder contents (`tokens/`, `primitives/`, `patterns/`, …) are copied from Cortex source.
