# cx-framework — packaged output, do not author here

This repository is generated. It is the published output of the Cortex design system, exported by `pnpm framework:package` from the Cortex repo, and consumed by other apps as `@mikaelcedergren/cx-framework` (`github:mikaelcedergren/cx-framework#main`).

**Do not make design or code changes here.** Anything edited directly in this repo is overwritten on the next export. Make framework changes in Cortex — `framework/` for source, `docs/DESIGN-SYSTEM.md` for the reference — then re-run the packaging command.

## Role in the Cortex -> cx-framework -> projects loop

Cortex is the source layer for components, tokens, AI skills, guidelines, and design-system decisions. This repo is only the packaged delivery layer.

Every product using the shared UI consumes this repo as `@mikaelcedergren/cx-framework` from GitHub `main`. Content and operations repos stay independent, and no downstream repo depends on Cortex directly through app imports, package dependencies, local `file:` links, scripts, styles, or copied source.

If a consuming project needs a framework upgrade, make the source fix in Cortex, export this repo again, obtain the user's explicit push authorisation under the shared Git policy, push it to GitHub, then reinstall/rebuild the consumer from this package. That is how one small fix becomes a benefit for every project.

Rules that still apply:

- Follow the shared Git policy in the development-root `AGENTS.md`: work on the current branch, never create a branch, pull when relevant, and push only after the user's specific current authorisation. Only after the package is pushed to GitHub `main` do consuming apps reinstall.
- Cortex and this current package have authority over consumers. When the contract changes, migrate every consumer forward; never add compatibility shims, legacy aliases, deprecated props, or restored behavior for stale downstream code.
- `README.md`, `DESIGN-SYSTEM.md`, and `package.json` are generated; the folder contents (`tokens/`, `primitives/`, `patterns/`, …) are copied from Cortex source.
