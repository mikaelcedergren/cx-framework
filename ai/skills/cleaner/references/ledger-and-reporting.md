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
| ID | Priority | Classification | Owner | Evidence | Decision | Status |
| --- | --- | --- | --- | --- | --- | --- |

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

## Intentional breakages

## Verification progress

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

Report through these sections, omitting empty detail but never hiding a required issue:

```markdown
## Summary

## Repositories and files changed

## Deletions and simplifications

## Verified bugs fixed

## Intentional breakages

## Verification

## 🚨 Upstream action required

For each upstream issue:
- Issue
- Owning repository or layer
- Why it belongs there
- Proposed durable improvement
- Affected repositories or components
- Evidence

## Unresolved or unverified

## Future improvements
```

Lead with what remains wrong, risky, blocked, or uncertain. If nothing remains wrong, finish with one short, lively confirmation.

## Cleanup completion

Delete `temp/CLEANUP.md` after all planned work is verified or explicitly reported and before the final response. If a real blocker prevents completion, keep it for automatic resume and tell the user exactly what is needed.
