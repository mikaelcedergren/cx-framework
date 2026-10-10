# Ledger and reporting

## Working ledger

Create exactly one `<scope-root>/temp/CLEANUP.md` with this structure:

```markdown
# Cleaner working memory

## Objective

## Scope

- Root:
- Mode: single repository | multi-repository workspace
- Included:
- Excluded or protected:

## Authority and ownership

- Applicable instructions:
- Project memory:
- Repository roles:
- Dirty worktrees and preserved user changes:

## Cleanup standard summary

## Baseline

- Runtime and package-manager state:
- Build:
- Tests:
- Typecheck/lint:
- Existing failures:

## Findings

| ID  | Priority | Classification | Owner | Evidence | Decision | Status |
| --- | -------- | -------------- | ----- | -------- | -------- | ------ |

## Cleanup plan

1.

## Checklist

- [ ]

## Current progress

- Active item:
- Last completed item:
- Next item:

## Decisions

## Upstream findings

## Protected contracts and scope limits

## Verification progress

- Workflow, risk, synthetic fixture, command, result, and limits:

## Independent anti-drift audit

- Purpose and ownership re-read:
- Fresh-system findings:
- Superseded names, paths, commands, labels, artifacts, and copied guidance searched:
- New findings resolved or reported:

## Completion state

- Status: planning | executing | verifying | blocked | complete
- Blocker or remaining work:
```

Keep entries concise but specific enough to survive context loss or a later invocation.

## Resume integrity

Treat the ledger as a claim, not unquestioned truth. On resume:

1. Read it completely.
2. Inspect current Git status and diffs.
3. Confirm completed items still exist as recorded.
4. Confirm the active item was not partially changed outside the ledger.
5. Correct stale ledger state before continuing.

Never restart completed work merely because the conversation context is gone.

## Atomic item states

- `pending`: planned, untouched
- `active`: the only item currently being changed
- `verified`: changed and proportionally verified
- `reported`: intentionally left with a named reason
- `blocked`: cannot continue without new authority or external state

Only one item may be `active` at a time.

## Final report

Give a concise summary covering:

1. Issues identified and fixed, with the affected repositories.
2. Refactoring and optimization performed and their demonstrated benefit.
3. Architectural inconsistencies corrected through existing shared contracts.
4. Validation performed, results, and the limits of that evidence.
5. Remaining issues that could not be safely resolved, including uncertain or untested behavior.

Use sections only when they help. Make material blockers prominent. For an **upstream action
required**, state the evidence, owning layer, affected products, smallest durable correction, and
missing authority. Do not add a speculative improvement backlog or claim all functionality works
because builds pass. Distinguish source verification, isolated functional proof, development
delivery, and production publication.

## Cleanup completion

Delete `temp/CLEANUP.md` only after all planned work is verified or explicitly reported, the
independent anti-drift audit is recorded and resolved, and no temporary artifact remains. Delete it
before the final response. If a real blocker prevents completion, keep it for automatic resume and
tell the user exactly what is needed.
