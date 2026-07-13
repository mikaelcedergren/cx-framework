# Cleanup standard

## Priority order

Apply these priorities in order when they conflict:

1. Applicable instructions, protected ownership, data safety, security, and explicit user boundaries
2. Honest source-of-truth and dependency direction
3. Long-term architectural health and one canonical implementation
4. Verified correctness and deliberate product truth
5. Simplicity, consistency, deletion, and reduced maintenance surface
6. Compatibility with stale internal implementation

Do not use “architecture” to justify crossing an explicit scope boundary. Surface the correct owner instead.

## Core philosophy

- Optimize for repository health five years from now, not for making today's command green.
- Prefer deletion over accommodation when evidence supports removal.
- Prefer the smallest system with the fewest concepts, paths, dependencies, and exceptions.
- Keep one implementation for one responsibility.
- Fix causes at the layer that owns them.
- Never make an upstream or shared source behave differently for one stale consumer.
- Migrate consumers forward instead of adding compatibility shims, aliases, wrappers, redirects, bypass flags, or restored behavior.
- Treat existing workarounds as debt to remove, not code to improve.
- Create abstractions only when they remove present complexity.
- Treat breakage as information, but account for its real impact.
- Use evidence over assumptions. Report uncertainty instead of inventing confidence.

## Ownership model

Classify repositories and important subsystems before editing:

- **Source:** authoritative implementation that produces shared behavior or artifacts.
- **Package:** generated, staged, or published delivery of a source.
- **Consumer:** adapts to the published contract and must not pressure upstream to preserve stale behavior.
- **Operations:** deployment, server, infrastructure, automation, or shared runtime tooling.
- **Standalone:** owns its own implementation and public contract.
- **Retired or archived:** evidence only unless explicitly included.
- **Excluded or protected:** read only for the current run.

Infer roles from instructions, workspace maps, dependency manifests, packaging scripts, and imports. Do not infer authority merely from folder names.

When a consumer exposes an upstream weakness:

1. Prove the weakness belongs upstream independently of the consumer's stale usage.
2. Fix it only if the upstream owner is in scope and local instructions allow the change.
3. Otherwise record the issue under **🚨 Upstream action required**.
4. Never recreate missing shared functionality locally.

## Evidence required for deletion

Use more than an apparent lack of imports when the item could be reached dynamically.

Relevant evidence includes:

- static references, imports, exports, selectors, routes, templates, and registrations
- dynamic lookup, reflection, convention-based loading, globbing, content discovery, and generated entry points
- package scripts, build configuration, deployment configuration, scheduled jobs, and runtime start commands
- public APIs, URLs, integrations, analytics, SEO, migrations, persisted data, and documentation promises
- version control context when it clarifies intent without overriding current authority
- passing focused verification after removal

If evidence remains insufficient, keep the item and report it as unverified.

## Behaviour and product truth

Do not optimize for preserving obsolete internal behavior. Do protect:

- user-owned or persisted data
- migrations and restore paths
- authentication, authorization, privacy, and security boundaries
- externally consumed APIs, integrations, feeds, routes, and public URLs
- deliberate product behavior and visual identity
- legal, accessibility, and operational obligations

These may still change, but only with explicit impact accounting and adequate authority.

## Working-tree safety

- Preserve unrelated changes, including untracked files.
- Never reset, checkout, clean, stash, stage, commit, or rewrite history unless explicitly requested.
- Avoid broad formatting or generated rewrites that obscure the cleanup diff.
- Inspect overlapping dirty files before editing and work around user-owned changes only when the ownership boundary is clear.
- Do not claim existing failures were caused by Cleaner or that unrun checks passed.
