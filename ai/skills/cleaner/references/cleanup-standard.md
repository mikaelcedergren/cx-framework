# Cleanup standard

## Priority order

Apply these priorities in order when they conflict:

1. Applicable instructions, protected ownership, data safety, security, and explicit user boundaries
2. Verified correctness, reliability, and preserved product contracts
3. Honest source-of-truth, dependency direction, and established architecture
4. Demonstrable simplification, consistency, and performance improvements

Do not use “architecture” to justify crossing an explicit scope boundary. Surface the correct owner instead.

## Core philosophy

- Optimize for repository health five years from now, not for making today's command green.
- Leave sound code unchanged when no objectively meaningful improvement is established.
- Prefer direct simplification and proven redundancy removal within the existing architecture.
- Respect repository boundaries and intentional reuse strategies; similarity alone does not justify consolidation.
- Fix causes at the layer that owns them.
- Never make an upstream or shared source behave differently for one stale consumer.
- Migrate consumers forward instead of adding compatibility shims, aliases, wrappers, redirects, bypass flags, or restored behavior.
- Verify ownership and intent before classifying a local implementation as a workaround.
- Avoid stylistic preferences, speculative problems, new dependencies, unnecessary abstractions, and refactoring for its own sake.
- Preserve UI, SEO, interfaces, and intended behavior. A product decision or substantial regression risk is a reason to report, not to improvise.
- Use evidence over assumptions. Report uncertainty instead of inventing confidence.

## Forward-only transition closure

Prove a migration complete before removing its superseded source or instructions. Check static
and dynamic callers, public promises, persisted data, operational selection, and recovery needs.
Remove only what is both unnecessary and within current authority. An unused import or old name
does not establish that a route, migration, operator, or rollback target is obsolete.

Keep authoritative data, schema history required to open it, supported external contracts,
backups, and required recovery/deployment safeguards. Changing scheduled jobs, installed services,
or retained releases requires its own operational authority. Git history is historical evidence;
current documentation should identify the supported path and its owner.

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
4. Do not recreate missing shared functionality locally unless the consuming product's authority explicitly permits a documented fallback after supported options are exhausted.

## Local UI-system resolution

Component-family terms such as button, dialog, tabs, tooltip, or icon button describe semantic roles and expected behavior. They do not prescribe a selector, import, prop, component name, or implementation structure from another platform.

When user-facing UI is in scope, apply `RULE-ID: system.component-terms`, `RULE-ID: system.component-resolution`, and `RULE-ID: system.shared-owner` from the portable design rules. Those rules own the resolution order. Cleaner supplies the evidence: discover the consuming product's local instructions, design-system documentation, dependencies, public APIs, imports, and established nearby usage before classifying an implementation.

The absence of a component with the same name as one used on another platform is not a defect. A custom implementation is a finding only when local evidence shows that the canonical resolution order should have produced a different result.

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

Preserve:

- user-owned or persisted data
- migrations and restore paths
- authentication, authorization, privacy, and security boundaries
- externally consumed APIs, integrations, feeds, routes, and public URLs
- deliberate product behavior and visual identity
- legal and operational obligations

Accessibility auditing and improvements are excluded by default, but existing required checks
and obligations remain intact. Uncertain behavior or changes to protected contracts require a
separate decision; report them rather than silently expanding a conservative refactor.

## Working-tree safety

- Preserve unrelated changes, including untracked files.
- Never reset, checkout, clean, stash, stage, commit, or rewrite history unless explicitly requested.
- Avoid broad formatting or generated rewrites that obscure the cleanup diff.
- Inspect overlapping dirty files before editing and work around user-owned changes only when the ownership boundary is clear.
- Do not claim existing failures were caused by Cleaner or that unrun checks passed.
