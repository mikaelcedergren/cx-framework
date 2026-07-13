# Audit catalogue

Use every relevant category during planning. Absence of evidence is not evidence of a defect.

## 1. Architecture and ownership

- reversed dependency direction or direct imports from a protected source
- consumer-specific behavior inside a shared owner
- responsibilities split across the wrong layers
- multiple sources of truth
- local workarounds for shared problems
- unnecessary wrappers, adapters, aliases, compatibility layers, and forks
- cycles, hidden coupling, leaky boundaries, and confused package ownership

## 2. Code and implementation

- dead, unreachable, obsolete, commented-out, deprecated, or duplicated code
- parallel implementations of the same responsibility
- abstractions that add indirection without removing complexity
- helpers used once when direct code is clearer
- no-op branches, misleading fallbacks, impossible states, and swallowed errors
- verified correctness, validation, concurrency, lifecycle, cleanup, and error-handling problems
- naming that hides ownership or gives one concept several terms

## 3. Dependencies and toolchain

- unused, duplicated, abandoned, incompatible, or locally substituted dependencies
- dependency features recreated locally
- inconsistent runtime, package-manager, compiler, or framework versions
- stale lockfiles and unapproved build scripts
- package scripts that fail by construction, duplicate one another, or advertise nonexistent capability
- build caches or native tooling that reduce stability

Prefer the stable, consistent toolchain over marginal build speed.

## 4. Configuration, automation, and operations

- stale routes, redirects, aliases, environment flags, schedulers, workflows, jobs, and deployment paths
- duplicated configuration and facts copied from a canonical owner
- obsolete build steps, generators, post-processing, and compatibility transforms
- services exposed too broadly, unreliable restart behavior, invisible health state, or unmanaged runtime noise
- differences from workspace standards that are neither intentional nor documented

Do not alter live services or production configuration without explicit authority.

## 5. Tests and verification

- tests that cannot fail, test nothing meaningful, depend on removed behavior, or never run
- commands with no matching tests
- duplicated fixtures and stale snapshots
- missing verification at important public or ownership boundaries
- tests that encode compatibility debt instead of the canonical contract
- CI and local commands that verify different products

Do not add speculative tests solely to increase counts. Add or repair tests when they protect a real current contract.

## 6. UI, UX, accessibility, and shared systems

- one-off UI that duplicates an existing primitive or pattern
- consumer overrides of shared-component internals
- duplicated tokens, fonts, assets, icons, or component behavior
- broken hierarchy, affordance, responsive behavior, keyboard access, focus, contrast, semantics, or reachable states
- stale UI routes and unreachable screens
- accidental visual drift versus deliberate product identity

Cleaner may correct verified implementation defects and system drift. It must not invent a redesign or blindly convert an intentional visual exception.

## 7. Data, security, and external contracts

- secrets, credentials, personal data, runtime state, backups, logs, or certificates in source control
- unsafe input boundaries, permissions, persistence, deletion, or recovery
- untracked schema drift and abandoned migrations
- public APIs, URLs, feeds, integrations, SEO, analytics, or automation that would break silently

Treat uncertain data and external-contract cleanup as high risk. Stop when authority or impact cannot be established.

## 8. Documentation and repository hygiene

- duplicate, conflicting, misleading, obsolete, or ownerless documentation
- copied shared facts that should link to their canonical owner
- stale examples, setup steps, commands, paths, screenshots, and architectural diagrams
- generated artifacts, caches, archives, logs, temporary files, and abandoned assets
- inconsistent ignore rules and accidental tracked output

Read instructions and project memory as authority when explicitly canonical. Do not rewrite them as a side effect of cleanup.

## Finding classification

Classify each supported finding by ownership and disposition:

- **Fix:** verified, in scope, and safe to correct.
- **Delete:** proven unnecessary and safe to remove.
- **Migrate:** stale consumer usage must move to the canonical contract.
- **Upstream:** durable fix belongs to an off-limits or external owner.
- **Report:** important but insufficiently proven, unsafe, or outside authority.
- **Intentional:** deliberate exception with a clear owner and reason.

Prioritize in this order:

1. Data loss, security, broken ownership, and misleading success
2. Architectural drift, duplicated truth, and compatibility debt
3. Verified bugs and failing canonical workflows
4. Dead code, unnecessary dependencies, stale automation, and documentation drift
5. Local clarity and low-risk polish

Group symptoms under one root finding. Do not inflate the plan with repeated manifestations of the same cause.
