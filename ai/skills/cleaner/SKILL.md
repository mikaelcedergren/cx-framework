---
name: cleaner
description: Use when invoked as Cleaner or asked to refactor, clean, optimize, simplify, maintain, or audit a codebase with fixes. Conservatively inspect the requested web repository or workspace, fix only demonstrable issues, preserve UI, SEO and intended behavior, and verify real workflows. Native applications and accessibility auditing are excluded unless explicitly requested.
---

# Cleaner

Run the complete lifecycle: discover, inspect, plan, fix, verify, and report. A refactor request means a conservative codebase audit with high-confidence fixes and deep functional verification, not a redesign or a mandate to change sound code. Do not present mode choices or stop after the plan.

## Required styling contract

[MUST] Before auditing or changing styles, read and apply `RULE-ID: tokens.direct-global`, `RULE-ID: tokens.semantic`, and `RULE-ID: tokens.new-global` in [the shared token rules](../../design/03-ux-rules.md#tokens-and-color), then read the consuming product's token purposes. This is required for every styling task, including wrappers, pages, and runtime styling.

[MUST] Identify existing violations as well as newly introduced ones. Use the product's full token audit when auditing CSS-based source. Existing violations remain findings; fix only the authorised, editable owner and never treat an unchanged baseline as approval.

## Authority granted by invocation

Treat invocation as permission to make local, reversible repository changes and evidence-backed deletions inside the automatically detected scope.

Do not treat it as permission to:

- change Git history, stage, commit, push, merge, switch branches, or discard user work
- install a new dependency
- deploy, restart services, alter live systems, send messages, or make external changes beyond authority already granted by the user or applicable local contract
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
- When invoked at a workspace containing multiple repositories, inspect every active web repository and its relevant supporting source tooling.
- Native macOS and iOS applications and accessibility auditing or accessibility focused improvements are excluded unless explicitly requested. Classify excluded repositories without auditing their implementation.
- When a workspace contains source, packaged, consumer, operations, retired, or excluded repositories, classify them before planning changes.
- Respect explicit exclusions and protected ownership declared by local instructions or workspace documentation.
- Never scan dependency stores, generated build directories, vendored code, archives, or retired repositories as active source unless the local contract explicitly includes them.

Read the applicable instruction chain before touching each area: workspace `AGENTS.md`, repository `AGENTS.md`, then the nearest scoped `AGENTS.md`. Read project memory when its canonical location is explicit. Treat ambiguous memory-looking files as evidence, not authority.

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
4. Audit the complete scope using `references/audit-catalogue.md`. Similar implementations in other repositories are references only after their authority and intent have been established.
5. Record every supported finding, classify it, prioritize it, and build the complete cleanup plan.

Do not change source until the complete plan exists. Do not ask the user to approve the plan; invocation already authorizes in-scope cleanup.

## 4. Execute atomic cleanup items

An atomic cleanup item is one evidence-backed finding, one decision, one coherent change set, and proportional verification.

For every item:

1. Read `temp/CLEANUP.md`.
2. Reconfirm the evidence and owning layer.
3. Execute exactly one cleanup item.
4. Verify the affected behavior and an adjacent risk.
5. Update findings, decisions, preserved contracts, progress, and verification in the ledger.
6. Read the ledger again before continuing.

Never execute multiple cleanup items simultaneously. Read-only discovery may be parallelized when it cannot obscure ownership or evidence.

Require a clear, demonstrable benefit to correctness, reliability, maintainability, consistency, or performance. Establish a failing regression before a behavioral fix where practical. Remove dead code or redundancy only when the evidence establishes that it is unnecessary and safe to remove. Do not change code merely because it could be shorter, looks similar elsewhere, or uses a different local name.

Do not replace one workaround with another. For a semantic component role, apply the complete order in `RULE-ID: system.component-resolution` using the local evidence captured at baseline. Never transfer an exact component name or API from another platform without local evidence.

When resolution reaches a repeatable need in an in-scope, editable shared owner, fix that owner. When the owner is off limits or external, leave the consumer honest, record the issue under **🚨 Upstream action required**, and follow local authority. A custom solution is not automatically debt when the resolution rule legitimately reaches its fallback; preserve or create it only as that rule and local authority permit.

Use established shared solutions within their intended ownership boundaries. Do not introduce new dependencies, unnecessary abstractions, competing architecture, broad rewrites, or cosmetic changes. Do not consolidate code across repositories merely because implementations resemble one another.

### Close completed transitions completely

When evidence proves a migration complete, remove superseded source and misleading instructions
within the authorized scope. Follow the deletion evidence in `references/cleanup-standard.md`;
an old name, absent import, or similar replacement alone is insufficient. Scheduled jobs, installed
definitions, retained releases, and recovery targets have operational and data consequences:
report them when their removal is not independently authorized and verified safe.

After deleting a completed transition, search the complete active scope for its old names, paths,
commands, labels, flags, terminology, copied guidance, and retained artifacts. A passing build does
not prove closure if another agent can still discover and follow the old route.

## 5. Protect deliberate product truth

Preserve existing functionality, interfaces, intended behavior, visual identity, UI, SEO, user data, migrations, security boundaries, public URLs, and integrations. Consumer migrations follow current supported framework contracts; they do not justify changing the framework to restore stale behavior.

Cleaner is not a redesign skill. Do not normalize deliberate visual differences. If a proposed change needs a product decision, changes a protected contract, or carries substantial regression risk, leave it unchanged and document the evidence and needed decision. Verify affected rendered behavior rather than relying only on source inspection or a passing build.

## 6. Verify the completed scope

Use the repository's pinned toolchain and canonical commands. Match verification to risk:

- references and ownership searches for deletion claims
- tests for behavior
- typechecks and builds for integration
- isolated browser checks for affected interaction and rendered behavior, preserving UI and SEO
- frozen or equivalent dependency installs when manifests or lockfiles changed
- final Git diffs and status for unintended files or generated drift

Build a risk-based workflow matrix covering the important functions of each audited product.
Exercise the applicable success, empty, failure, retry, concurrency, navigation, and persistence
paths with synthetic data and isolated providers. Prioritize authentication, editing, saving,
deletion, background updates, and external-effect boundaries where the product has them. Verify
both the visible outcome and authoritative state when that is the contract. Use the canonical
hermetic runner; do not operate on real records or send real notifications as automated checks.
Record what ran, what it proved, and what remains unverified. A build or a mocked response does not
prove every workflow or an external provider works.

Run existing required checks even when they include an excluded audit category. Report such
failures without weakening or skipping the gate, and do not expand into the excluded work.

Then perform one independent anti-drift pass after every planned item is complete:

1. Re-read the scope's purpose and canonical ownership map.
2. Ignore the implementation sequence and inspect the result as a fresh system.
3. Search for competing implementations, duplicated truth, superseded terminology, compatibility
   escape hatches, completed transition machinery, and paths that can restore deleted behavior.
4. Add and resolve every new supported finding before calling the cleanup complete.

Do not silence, skip, downgrade, or route around failures. Fix verified in-scope causes. Record pre-existing failures and real external blockers honestly.

## 7. Finish

Complete every planned item or explicitly report why it remains. Produce the final report described in `references/ledger-and-reporting.md`.

Delete `temp/CLEANUP.md` only when:

- all in-scope items are complete or explicitly reported
- final verification has finished
- no temporary cleanup artifact remains

If blocked by missing authority or an external state change, keep the ledger so the next invocation resumes automatically. State the exact blocker and the smallest action needed from the user.
