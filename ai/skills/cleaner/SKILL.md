---
name: cleaner
description: Use automatically when explicitly invoked as Cleaner or when asked to clean, optimize, simplify, maintain, or perform a repository-wide sanity check. Inspect and improve either the current repository or every active repository in the current workspace, reducing architectural entropy, deleting proven dead or duplicated work, correcting ownership and dependency drift, verifying changes, and reporting upstream issues. Run the complete lifecycle autonomously; do not offer quick, deep, audit-only, or implementation modes.
---

# Cleaner

Run the complete cleanup lifecycle when invoked: discover, inspect, plan, clean, verify, report, and finish. Do not present mode choices and do not stop after the plan.

## Authority granted by invocation

Treat invocation as permission to make local, reversible repository changes and evidence-backed deletions inside the automatically detected scope.

Do not treat it as permission to:

- change Git history, stage, commit, push, merge, switch branches, or discard user work
- install a new dependency
- deploy, restart services, alter live systems, send messages, or make external changes
- use secrets, administrator access, or destructive data operations
- modify an off-limits or upstream owner merely because a downstream symptom exists

Ask one precise question only when one of those boundaries or an unknowable ownership decision genuinely blocks safe progress. Otherwise continue autonomously.

## Required guidance

Before auditing, read these files completely:

- `references/cleanup-standard.md` for priorities, ownership, deletion evidence, and safety
- `references/audit-catalogue.md` for the complete inspection surface and issue classification

Before creating or resuming the working ledger, read `references/ledger-and-reporting.md` completely.

When the cleanup scope includes user-facing UI, also read `../../design/00-start-here.md` and the smallest relevant rule sections. Apply `RULE-ID: system.component-terms` and `RULE-ID: system.component-resolution`: component-family terms describe semantic roles and expected behavior, not exact component names or APIs.

## 1. Discover the scope

Run `scripts/discover_workspace.py` from the invocation location and inspect its JSON output.

- When invoked inside one repository, clean that repository.
- When invoked at a workspace containing multiple repositories, clean every active repository in that workspace.
- When a workspace contains source, packaged, consumer, operations, retired, or excluded repositories, classify them before planning changes.
- Respect explicit exclusions and protected ownership declared by local instructions or workspace documentation.
- Never scan dependency stores, generated build directories, vendored code, archives, or retired repositories as active source unless the local contract explicitly includes them.

Read the applicable instruction chain before touching each area: workspace `AGENTS.md`, repository `AGENTS.md`, then the nearest scoped `AGENTS.md`. Read project memory when its canonical location is explicit. Treat ambiguous memory-looking files as evidence, not authority.

Read `AGENTS.md` and project memory; do not rewrite either during ordinary Cleaner use. Update permanent instructions only when the user explicitly asks for an instruction change.

Inspect every repository's working tree before editing. Preserve all unrelated existing changes and do not assume a dirty file belongs to Cleaner.

## 2. Resume or establish working memory

Use exactly one ledger at `<scope-root>/temp/CLEANUP.md`.

If it already exists:

1. Read it completely.
2. Compare its recorded state with the current files and Git diffs.
3. Resume the first incomplete item only after confirming that the ledger is still truthful.

If it does not exist, create it from the template in `references/ledger-and-reporting.md` after scope and authority are known. The ledger is temporary operational state, never documentation and never a commit candidate.

## 3. Establish the baseline

Before changing source:

1. Map repository roles, dependency direction, public boundaries, generated sources, deliberate exceptions, and verification commands. When UI is in scope, discover each product's local system from its instructions, design-system documentation, dependencies, public APIs, imports, and established nearby usage.
2. Capture relevant build, test, typecheck, lint, package-manager, and runtime state.
3. Distinguish existing failures from failures introduced later.
4. Audit the complete scope using `references/audit-catalogue.md`.
5. Record every supported finding, classify it, prioritize it, and build the complete cleanup plan.

Do not change source until the complete plan exists. Do not ask the user to approve the plan; invocation already authorizes in-scope cleanup.

## 4. Execute atomic cleanup items

An atomic cleanup item is one evidence-backed finding, one decision, one coherent change set, and proportional verification.

For every item:

1. Read `temp/CLEANUP.md`.
2. Reconfirm the evidence and owning layer.
3. Execute exactly one cleanup item.
4. Verify the affected behavior and an adjacent risk.
5. Update findings, decisions, intentional breakages, progress, and verification in the ledger.
6. Read the ledger again before continuing.

Never execute multiple cleanup items simultaneously. Read-only discovery may be parallelized when it cannot obscure ownership or evidence.

Prefer deletion and direct simplification over preserving obsolete behavior. Remove dead code, duplication, compatibility shims, aliases, wrappers, redirects, stale routes, abandoned assets, misleading commands, redundant documentation, and local workarounds when evidence proves they are unnecessary.

Do not replace one workaround with another. For a semantic component role, apply the complete order in `RULE-ID: system.component-resolution` using the local evidence captured at baseline. Never transfer an exact component name or API from another platform without local evidence.

When resolution reaches a repeatable need in an in-scope, editable shared owner, fix that owner. When the owner is off limits or external, leave the consumer honest, record the issue under **🚨 Upstream action required**, and follow local authority. A custom solution is not automatically debt when the resolution rule legitimately reaches its fallback; preserve or create it only as that rule and local authority permit.

Maintain one canonical implementation. Add a shared abstraction only when it simplifies the current system now.

## 5. Protect deliberate product truth

Compatibility is not a goal for stale internal implementation. External contracts, user data, migrations, security boundaries, public URLs, SEO behavior, integrations, and deliberate UX require evidence and explicit impact accounting before breakage.

Cleaner is not a redesign skill. Do not normalize a deliberate visual identity merely because another repository uses a shared UI system. When cleanup affects rendered UI, interaction, responsiveness, or accessibility, verify the actual experience rather than relying only on source inspection or a passing build.

## 6. Verify the completed scope

Use the repository's pinned toolchain and canonical commands. Match verification to risk:

- references and ownership searches for deletion claims
- tests for behavior
- typechecks and builds for integration
- rendered browser checks for uncertain UI, interaction, responsive, or accessibility changes
- frozen or equivalent dependency installs when manifests or lockfiles changed
- final Git diffs and status for unintended files or generated drift

Do not silence, skip, downgrade, or route around failures. Fix verified in-scope causes. Record pre-existing failures and real external blockers honestly.

## 7. Finish

Complete every planned item or explicitly report why it remains. Produce the final report described in `references/ledger-and-reporting.md`.

Delete `temp/CLEANUP.md` only when:

- all in-scope items are complete or explicitly reported
- final verification has finished
- no temporary cleanup artifact remains

If blocked by missing authority or an external state change, keep the ledger so the next invocation resumes automatically. State the exact blocker and the smallest action needed from the user.
