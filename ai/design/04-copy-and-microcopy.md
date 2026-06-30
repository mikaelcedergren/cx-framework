# Copy and microcopy

Copy should reduce uncertainty. It should tell the user what something is, what happened, what they can do, or what will happen next.

Use concise, specific language. Avoid cleverness, apology, filler, blame, shame, and vague system language.

## Voice by surface

Operational surfaces should be concise and professional:

- buttons
- labels
- field help
- validation
- alerts
- status
- navigation
- table values

Learning surfaces can be warmer:

- onboarding
- first-time empty states
- setup guidance
- explanatory panels
- product education

Warmth should feel plain, kind, and useful. It should not become cute, fluffy, jokey, or chatty.

When unsure, use concise.

## General rules

RULE: Use plain, specific language. TYPE: must TOPIC: copy DESCRIPTION: The user should understand the sentence without decoding product, technical, or business jargon.

RULE: Use one name for one concept. TYPE: must TOPIC: terminology DESCRIPTION: Do not switch between synonyms such as workspace, project, and account unless they mean different things.

RULE: Prefer sentence case for interface copy. TYPE: should TOPIC: copy DESCRIPTION: Sentence case is easier to scan and feels calmer than title case in dense product UI.

RULE: Keep operational copy short. TYPE: should TOPIC: copy DESCRIPTION: Labels, buttons, field help, statuses, and errors should work at a glance.

RULE: Put the user's action or next step in the sentence. TYPE: must TOPIC: microcopy DESCRIPTION: Copy should help the user move, not merely describe that the system has a problem.

RULE: Avoid filler words. TYPE: should TOPIC: copy DESCRIPTION: Words such as simply, just, easily, please, oops, and sorry usually add tone without adding clarity.

RULE: Do not blame the user. TYPE: must TOPIC: trust DESCRIPTION: Frame problems as state, constraint, or next action rather than personal failure.

## Buttons

RULE: Label a button with the action it performs. TYPE: must TOPIC: buttons DESCRIPTION: Button text should name what clicking does.

RULE: Name the object of the action when possible. TYPE: must TOPIC: buttons DESCRIPTION: Use `Delete file`, `Send invitation`, or `Save changes` instead of vague labels like `OK`, `Submit`, or `Confirm`.

RULE: Make destructive buttons explicit. TYPE: must TOPIC: buttons DESCRIPTION: A destructive confirmation button should name the destructive action, such as `Delete file`.

RULE: Do not use button copy to describe current state. TYPE: must TOPIC: buttons DESCRIPTION: State belongs in status text, selected state, toggle state, or supporting UI; a button names the action.

RULE: Keep paired actions visibly distinct. TYPE: should TOPIC: buttons DESCRIPTION: Use clear opposites such as `Cancel` and `Archive project`, not `No` and `Yes`.

## Labels and help text

RULE: Labels name the thing the user is providing or choosing. TYPE: must TOPIC: forms DESCRIPTION: A label should make the field understandable even when the field is empty.

RULE: Do not rely on placeholder text as the only label. TYPE: must TOPIC: forms DESCRIPTION: Placeholder text disappears once the user types and does not provide stable context.

RULE: Use helper text only when it changes the user's behavior. TYPE: should TOPIC: microcopy DESCRIPTION: Do not add help text that repeats the label or explains the obvious.

RULE: Put important constraints near the field before the user fails. TYPE: should TOPIC: validation DESCRIPTION: Format, range, length, and irreversible consequences should appear early enough to prevent avoidable errors.

## Validation and errors

RULE: Error messages must name the problem and the fix. TYPE: must TOPIC: errors DESCRIPTION: The user should know what went wrong and what to do next.

RULE: Put field-specific errors under the relevant field. TYPE: must TOPIC: validation DESCRIPTION: The message should appear where the user's attention and next action belong.

RULE: Use form-level alerts for problems that are not tied to one field. TYPE: must TOPIC: validation DESCRIPTION: Request failures, permission issues, timeouts, conflicts, and service outages belong at form or page level.

RULE: Preserve entered data after validation errors. TYPE: must TOPIC: trust DESCRIPTION: Users should not lose work because a field failed validation.

RULE: Avoid generic error labels. TYPE: must TOPIC: errors DESCRIPTION: `Error`, `Invalid`, `Something went wrong`, and similar copy are not enough on their own.

RULE: Keep validation copy calm and direct. TYPE: should TOPIC: errors DESCRIPTION: Use short sentences that describe the condition and action without apology or drama.

RULE: Use fallback copy only when no tailored message exists. TYPE: should TOPIC: microcopy DESCRIPTION: Fallbacks are a safety net, not a replacement for context-aware writing.

## Empty states

RULE: Explain why the area is empty. TYPE: must TOPIC: empty-states DESCRIPTION: The user should know whether nothing exists, nothing matches, something is unavailable, or something is still loading.

RULE: Give a clear next step when one exists. TYPE: must TOPIC: empty-states DESCRIPTION: Empty states should help the user continue rather than simply announce absence.

RULE: Avoid bare empty-state copy such as `No results`. TYPE: should TOPIC: empty-states DESCRIPTION: A useful empty state explains what was not found and how to broaden, reset, create, or wait.

RULE: Keep first-use empty states welcoming but practical. TYPE: should TOPIC: empty-states DESCRIPTION: A first empty screen should reduce hesitation and guide setup without becoming decorative.

## Status and feedback

RULE: Confirm meaningful success. TYPE: should TOPIC: feedback DESCRIPTION: Use short confirmation copy when the user needs confidence that an action completed.

RULE: Label long-running work. TYPE: must TOPIC: feedback DESCRIPTION: Loading, saving, syncing, importing, exporting, and deleting should say what is happening.

RULE: Make failure actionable. TYPE: must TOPIC: feedback DESCRIPTION: If recovery is possible, tell the user how to recover; if it is not, say what state the system is in.
