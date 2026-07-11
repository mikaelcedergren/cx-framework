# Copy and microcopy

This file owns portable user-facing language rules. Search by `RULE-ID:`, `SCOPE:`, `TYPE:`, `TOPIC:`, or keyword. Product truth, local terminology, and known behavior always outrank a portable wording default.

## Truth, voice, and terminology

RULE-ID: copy.truth SCOPE: copy TYPE: must TOPIC: trust RULE: Preserve known product behavior and consequence in the words. DESCRIPTION: Never invent capability, guarantee, policy, terminology, recovery, or outcome to make copy sound complete.

RULE-ID: copy.unknown-behavior SCOPE: copy TYPE: must TOPIC: trust RULE: Treat unknown behavior as a product question. DESCRIPTION: Do not hide unresolved meaning behind generic or confident wording.

RULE-ID: copy.terminology SCOPE: copy TYPE: must TOPIC: copy RULE: Use one established term for one concept. DESCRIPTION: Prefer the consuming product's domain language and do not switch synonyms unless they represent different things.

RULE-ID: copy.plain-language SCOPE: copy TYPE: should TOPIC: copy RULE: Use the plainest accurate words. DESCRIPTION: Remove business jargon, technical leakage, marketing gloss, and decorative phrasing.

RULE-ID: copy.sentence-case SCOPE: copy TYPE: should TOPIC: copy RULE: Use sentence case for interface text. DESCRIPTION: Capitalize the first word and proper nouns unless a product name or local language convention requires otherwise.

RULE-ID: copy.concise SCOPE: operational-copy TYPE: should TOPIC: voice RULE: Keep operational copy as short as accuracy allows. DESCRIPTION: Do not remove consequence, constraint, recovery, or the next useful action merely to save words.

RULE-ID: copy.warmth SCOPE: learning-copy TYPE: may TOPIC: voice RULE: Use restrained warmth on learning and first-use surfaces. DESCRIPTION: Onboarding, setup guidance, and first-use empty states may be kind and conversational without becoming cute, jokey, or vague.

RULE-ID: copy.no-blame SCOPE: copy TYPE: must TOPIC: trust RULE: Describe the state or required action without blaming the user. DESCRIPTION: Confusion and invalid state are product conditions, not evidence of personal failure.

RULE-ID: copy.opt-out-neutral SCOPE: opt-out-copy TYPE: must TOPIC: trust RULE: Keep refusal and opt-out wording neutral. DESCRIPTION: Never shame, guilt, threaten, or coerce someone into staying, consenting, subscribing, or enabling a feature.

RULE-ID: copy.no-filler SCOPE: operational-copy TYPE: should TOPIC: voice RULE: Remove filler, apology, and performative politeness. DESCRIPTION: Words such as `just`, `simply`, `easily`, `please`, `oops`, and `sorry` rarely improve operational clarity.

## Buttons and actions

RULE-ID: copy.buttons.action SCOPE: button-label TYPE: must TOPIC: copy RULE: Label a button with the action it performs. DESCRIPTION: Button text names the result of activation rather than the current state or a generic confirmation.

RULE-ID: copy.buttons.object SCOPE: button-label TYPE: should TOPIC: copy RULE: Name the action's object when it removes ambiguity. DESCRIPTION: Prefer `Delete file`, `Send invitation`, or `Save changes`; concise conventional actions such as `Cancel`, `Back`, and `Continue` do not need invented objects.

RULE-ID: copy.buttons.destructive SCOPE: button-label TYPE: must TOPIC: trust RULE: Name destructive action explicitly. DESCRIPTION: The final action must say what will be deleted, removed, discarded, or ended.

RULE-ID: copy.buttons.pairs SCOPE: action-group TYPE: should TOPIC: copy RULE: Give paired actions distinct outcomes. DESCRIPTION: Use a safe exit plus the real action rather than ambiguous `No` and `Yes` labels.

RULE-ID: copy.buttons.loading SCOPE: button-label TYPE: should TOPIC: feedback RULE: Keep processing language tied to the original action. DESCRIPTION: The control may show truthful activity while preserving what the user asked it to do.

## Labels, placeholders, and help

RULE-ID: copy.labels.object SCOPE: form-label TYPE: must TOPIC: forms RULE: Make a field label name the value or choice. DESCRIPTION: The label must keep the empty control understandable without turning into an instruction sentence.

RULE-ID: copy.typed-fields.no-placeholder SCOPE: typed-field TYPE: must TOPIC: forms RULE: Do not use placeholders in typed fields. DESCRIPTION: Text, email, phone, search, number, password, textarea, and editable text controls stay empty with persistent labels; examples and constraints belong in helper text.

RULE-ID: copy.pickers.placeholder SCOPE: picker TYPE: must TOPIC: forms RULE: Write an empty picker placeholder as `Select [thing]`. DESCRIPTION: Use the clearest object, such as `Select severity` or `Select language`; use bare `Select` only when no object fits.

RULE-ID: copy.helper.behavior SCOPE: helper-text TYPE: should TOPIC: microcopy RULE: Add helper text only when it changes successful behavior. DESCRIPTION: Explain a non-obvious constraint, format, consequence, or example instead of repeating the label.

RULE-ID: copy.helper.prevent SCOPE: helper-text TYPE: should TOPIC: validation RULE: Put important known constraints before failure. DESCRIPTION: Range, format, length, and irreversible consequence should appear early enough to prevent avoidable errors.

## Validation and errors

RULE-ID: copy.errors.problem-fix SCOPE: error-message TYPE: must TOPIC: errors RULE: State the problem and the available recovery. DESCRIPTION: The user should know what failed and what they can do next; omit a recovery only when none exists.

RULE-ID: copy.errors.specific SCOPE: error-message TYPE: must TOPIC: errors RULE: Name the real failed object or condition. DESCRIPTION: `Error`, `Invalid`, and `Something went wrong` are not sufficient on their own.

RULE-ID: copy.errors.field SCOPE: field-error TYPE: should TOPIC: validation RULE: Name the expected field value or correction. DESCRIPTION: Prefer `Enter a valid email address` to a bare judgment such as `Invalid email`.

RULE-ID: copy.errors.request SCOPE: request-error TYPE: must TOPIC: errors RULE: Describe request-level failure without pretending to know its cause. DESCRIPTION: Distinguish known timeout, permission, conflict, unavailable service, and unknown failure only when the product has that evidence.

RULE-ID: copy.errors.calm SCOPE: error-message TYPE: should TOPIC: voice RULE: Keep error copy calm and direct. DESCRIPTION: Errors are not the place for jokes, personality, alarmist prefixes, or apology.

RULE-ID: copy.errors.punctuation SCOPE: error-message TYPE: should TOPIC: copy RULE: End complete validation and alert sentences with a full stop. DESCRIPTION: Button labels, field labels, statuses, and picker placeholders are not sentences and do not inherit this rule.

RULE-ID: copy.errors.fallback SCOPE: error-message TYPE: should TOPIC: errors RULE: Use fallback wording only when tailored copy cannot be written from known behavior. DESCRIPTION: A fallback is a safety net, not permission to invent product policy.

## Empty, missing, and status copy

RULE-ID: copy.empty.cause SCOPE: empty-state TYPE: must TOPIC: empty-states RULE: Explain the actual kind of absence. DESCRIPTION: Distinguish first use, no data, no search results, unavailable content, filtering, and loading.

RULE-ID: copy.empty.next-step SCOPE: empty-state TYPE: must TOPIC: empty-states RULE: Give the next useful action when one exists. DESCRIPTION: The action may create, reset, broaden, retry, wait, or return depending on the real cause.

RULE-ID: copy.empty.no-bare-results SCOPE: empty-state TYPE: should TOPIC: empty-states RULE: Avoid a bare `No results` message. DESCRIPTION: Name what was not found and how the user can broaden, reset, or correct the search when possible.

RULE-ID: copy.missing.none SCOPE: missing-value TYPE: should TOPIC: data-display RULE: Use `None` when a known field has no value. DESCRIPTION: The word communicates deliberate absence rather than loading or failure.

RULE-ID: copy.missing.pending SCOPE: missing-value TYPE: should TOPIC: data-display RULE: Use `Pending` only while the system is still gathering the value. DESCRIPTION: Do not use it for absent, failed, or inapplicable data.

RULE-ID: copy.missing.not-applicable SCOPE: missing-value TYPE: should TOPIC: data-display RULE: Use `N/A` only when the field does not apply. DESCRIPTION: Prefer a contextual word over an unexplained dash.

RULE-ID: copy.status.success SCOPE: status-message TYPE: should TOPIC: feedback RULE: Confirm meaningful success in one short sentence. DESCRIPTION: Confirm what completed when the user needs confidence; do not celebrate routine noise.

RULE-ID: copy.status.waiting SCOPE: status-message TYPE: should TOPIC: feedback RULE: Name long-running work when the wait is meaningful. DESCRIPTION: Use the real activity, such as saving, syncing, importing, or deleting, without promising duration.

## Dates and time

RULE-ID: copy.dates.human-display SCOPE: human-date TYPE: should TOPIC: data-display RULE: Use an unambiguous human-readable absolute date. DESCRIPTION: A spelled-out month such as `6 May 2026` avoids locale-dependent day/month inversion in display copy.

RULE-ID: copy.dates.machine-format SCOPE: machine-date TYPE: may TOPIC: data-display RULE: Use ISO date formats for machine, storage, API, or explicitly technical contexts. DESCRIPTION: `YYYY-MM-DD` is unambiguous when the surface is intentionally technical; do not describe it as a localized human date.

RULE-ID: copy.dates.relative SCOPE: relative-time TYPE: should TOPIC: data-display RULE: Use relative time only when recency is the user's question. DESCRIPTION: Logs, reports, audits, and detail views need an absolute date and time.
