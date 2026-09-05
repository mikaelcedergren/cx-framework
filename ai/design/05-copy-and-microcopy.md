# Copy and microcopy

This file owns portable user-facing language rules. Search by `RULE-ID:`, `SCOPE:`, `TYPE:`, `TOPIC:`, or keyword. Product truth, local terminology, and known behavior always outrank a portable wording default.

> **Normative language:** `TYPE: MUST` is mandatory; `TYPE: SHOULD` is the default unless a concrete product reason justifies departure; `TYPE: MAY` is optional. `DESCRIPTION` is `[NOTE]`; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. See `00-start-here.md` for the canonical definitions, precedence, and conflict handling.

## Truth, voice, and terminology

RULE-ID: copy.truth SCOPE: copy TYPE: MUST TOPIC: trust RULE: Preserve known product behavior and consequence in the words. DESCRIPTION: Never invent capability, guarantee, policy, terminology, recovery, or outcome to make copy sound complete.

RULE-ID: copy.unknown-behavior SCOPE: copy TYPE: MUST TOPIC: trust RULE: Treat unknown behavior as a product question. DESCRIPTION: Do not hide unresolved meaning behind generic or confident wording.

RULE-ID: copy.terminology SCOPE: copy TYPE: MUST TOPIC: copy RULE: Use one established term for one concept. DESCRIPTION: Prefer the consuming product's domain language and do not switch synonyms unless they represent different things.

RULE-ID: copy.plain-language SCOPE: copy TYPE: SHOULD TOPIC: copy RULE: Use the plainest accurate words. DESCRIPTION: Remove business jargon, technical leakage, marketing gloss, and decorative phrasing.

RULE-ID: copy.reader-language SCOPE: copy TYPE: MUST TOPIC: copy RULE: Write for the reader instead of mirroring the underlying data model. DESCRIPTION: Convert field names, enum values, status tokens, and key-value structures into natural language. EXCEPT: Preserve structured representation when the surface intentionally presents data in that form.

RULE-ID: copy.component-guidance.reader-language SCOPE: component-usage-guidance TYPE: MUST TOPIC: guidance RULE: Explain when and how to use a component in plain language. DESCRIPTION: Write for a designer or product author choosing a component. Describe its purpose, suitable situations, and important user-facing behavior without selectors, properties, events, code structure, or implementation instructions; keep technical contracts in the API reference.

RULE-ID: copy.sentence-case SCOPE: copy TYPE: MUST TOPIC: copy RULE: Use sentence case for interface text. DESCRIPTION: Capitalize the first word and proper nouns unless a product name or local language convention requires otherwise.

RULE-ID: copy.concise SCOPE: operational-copy TYPE: SHOULD TOPIC: voice RULE: Keep operational copy short and scannable as accuracy allows. DESCRIPTION: Lead with the point and use the fewest words that preserve meaning, consequence, constraint, recovery, and the next useful action; a reading surface may remain long when reading is the task.

RULE-ID: copy.warmth SCOPE: learning-copy TYPE: MAY TOPIC: voice RULE: Use restrained warmth on learning and first-use surfaces. DESCRIPTION: Onboarding, setup guidance, and first-use empty states may be kind and conversational without becoming cute, jokey, or vague.

RULE-ID: copy.no-blame SCOPE: copy TYPE: MUST TOPIC: trust RULE: Describe the state or required action without blaming the user. DESCRIPTION: Confusion and invalid state are product conditions, not evidence of personal failure.

RULE-ID: copy.opt-out-neutral SCOPE: opt-out-copy TYPE: MUST TOPIC: trust RULE: Keep refusal and opt-out wording neutral. DESCRIPTION: Never shame, guilt, threaten, or coerce someone into staying, consenting, subscribing, or enabling a feature.

RULE-ID: copy.no-filler SCOPE: operational-copy TYPE: SHOULD TOPIC: voice RULE: Remove filler, apology, and performative politeness. DESCRIPTION: Words such as `just`, `simply`, `easily`, `please`, `oops`, and `sorry` rarely improve operational clarity.

RULE-ID: copy.minimal-first SCOPE: copy TYPE: MUST TOPIC: copy RULE: Start every piece of interface text from the fewest words that stay unambiguous; extra words are an explicit product decision, never a default. DESCRIPTION: Applies to all UI copy — menu items, buttons, calls to action, dialog primaries, labels, headings, hints, and empty states. Add a noun, qualifier, or explanation only when the product owner decides the extra information earns its place; never speculatively or out of habit.

RULE-ID: copy.no-context-restatement SCOPE: copy TYPE: MUST TOPIC: copy RULE: Do not restate context the surface already establishes. DESCRIPTION: Applies to all UI copy. A row or card menu says `Edit` and `Delete` — the row is the object. A page-level call to action says `New` — the page heading names what is created. A form dialog's primary says `Add` or `Save` — the dialog heading names the entity. Labels, hints, and headings follow the same principle: never repeat what the page, section, or component around them has already said. Words survive only when they add information the surface does not carry: a different object or destination (`Open report`, `Move to pending`), a resulting state (`Create draft`), genuinely mixed targets (a global surface such as a command palette), or the final destructive commit, which copy.buttons.destructive governs. EXCEPT: A field label or picker placeholder naming its own value per copy.labels.object and copy.pickers.placeholder is establishing context, not restating it — a `Reminder` field label inside a `New reminder` dialog is correct.

## Buttons and actions

RULE-ID: copy.buttons.action SCOPE: button-label TYPE: MUST TOPIC: copy RULE: Label a button with the action it performs. DESCRIPTION: Button text names the result of activation rather than the current state or a generic confirmation.

RULE-ID: copy.buttons.object SCOPE: button-label TYPE: SHOULD TOPIC: copy RULE: Name the action's object only when it removes real ambiguity. DESCRIPTION: `Send invitation` earns its noun on a surface that could send several things; where the surface already names the object copy.no-context-restatement applies, and concise conventional actions such as `Cancel`, `Back`, and `Continue` never need invented objects.

RULE-ID: copy.buttons.destructive SCOPE: button-label TYPE: MUST TOPIC: trust RULE: Name destructive action explicitly. DESCRIPTION: The final action must say what will be deleted, removed, discarded, or ended.

RULE-ID: copy.buttons.pairs SCOPE: action-group TYPE: SHOULD TOPIC: copy RULE: Give paired actions distinct outcomes. DESCRIPTION: Use a safe exit plus the real action rather than ambiguous `No` and `Yes` labels.

RULE-ID: copy.buttons.loading SCOPE: button-label TYPE: MUST TOPIC: feedback RULE: Do not author alternate button copy for processing states. DESCRIPTION: Activate the button's supported loading state as-is; its component contract owns whether and how visible text changes.

RULE-ID: copy.confirmation.alignment SCOPE: confirmation-dialog TYPE: MUST TOPIC: trust RULE: Align the confirmation statement with the committing action. DESCRIPTION: State the decision or consequence directly, then label the primary action as its continuation; use a safe exit plus the explicit action instead of a question answered by `Yes`, `No`, `OK`, or `Confirm`.

## Labels, placeholders, and help

RULE-ID: copy.labels.object SCOPE: form-label TYPE: MUST TOPIC: forms RULE: Make a field label name the value or choice. DESCRIPTION: The label must keep the empty control understandable without turning into an instruction sentence.

RULE-ID: copy.typed-fields.no-placeholder SCOPE: typed-field TYPE: MUST TOPIC: forms RULE: Do not use placeholders in typed fields. DESCRIPTION: Text, email, phone, search, number, password, textarea, and editable text controls stay empty with persistent labels; examples and constraints belong in helper text.

RULE-ID: copy.pickers.placeholder SCOPE: picker TYPE: MUST TOPIC: forms RULE: Write an empty picker placeholder as `Select [thing]`. DESCRIPTION: Use the clearest object, such as `Select severity` or `Select language`; use bare `Select` only when no object fits.

RULE-ID: copy.helper.behavior SCOPE: helper-text TYPE: SHOULD TOPIC: microcopy RULE: Add helper text only when it changes successful behavior. DESCRIPTION: Explain a non-obvious constraint, format, consequence, or example instead of repeating the label.

RULE-ID: copy.helper.prevent SCOPE: helper-text TYPE: MUST TOPIC: validation RULE: Put important known constraints before failure. DESCRIPTION: Range, format, length, and irreversible consequence should appear early enough to prevent avoidable errors.

## Validation and errors

RULE-ID: copy.errors.problem-fix SCOPE: error-message TYPE: MUST TOPIC: errors RULE: State the problem and the available recovery. DESCRIPTION: The user should know what failed and what they can do next; omit a recovery only when none exists.

RULE-ID: copy.errors.specific SCOPE: error-message TYPE: MUST TOPIC: errors RULE: Name the real failed object or condition. DESCRIPTION: `Error`, `Invalid`, and `Something went wrong` are not sufficient on their own.

RULE-ID: copy.errors.field SCOPE: field-error TYPE: SHOULD TOPIC: validation RULE: Name the expected field value or correction. DESCRIPTION: Prefer `Enter a valid email address` to a bare judgment such as `Invalid email`.

RULE-ID: copy.errors.request SCOPE: request-error TYPE: MUST TOPIC: errors RULE: Describe request-level failure without pretending to know its cause. DESCRIPTION: Distinguish known timeout, permission, conflict, unavailable service, and unknown failure only when the product has that evidence.

RULE-ID: copy.errors.calm SCOPE: error-message TYPE: SHOULD TOPIC: voice RULE: Keep error copy calm and direct. DESCRIPTION: Errors are not the place for jokes, personality, alarmist prefixes, or apology.

RULE-ID: copy.errors.punctuation SCOPE: error-message TYPE: SHOULD TOPIC: copy RULE: End complete validation and alert sentences with a full stop. DESCRIPTION: Button labels, field labels, statuses, and picker placeholders are not sentences and do not inherit this rule.

RULE-ID: copy.errors.fallback SCOPE: error-message TYPE: MUST TOPIC: errors RULE: Use fallback wording only when tailored copy cannot be written from known behavior. DESCRIPTION: A fallback is a safety net, not permission to invent product policy.

## Empty, missing, and status copy

RULE-ID: copy.empty.cause SCOPE: empty-state TYPE: MUST TOPIC: empty-states RULE: Explain the actual kind of absence. DESCRIPTION: Distinguish first use, no data, no search results, unavailable content, filtering, and loading.

RULE-ID: copy.empty.next-step SCOPE: empty-state TYPE: MUST TOPIC: empty-states RULE: Give the next useful action when one exists. DESCRIPTION: The action may create, reset, broaden, retry, wait, or return depending on the real cause.

RULE-ID: copy.empty.no-bare-results SCOPE: empty-state TYPE: SHOULD TOPIC: empty-states RULE: Avoid a bare `No results` message. DESCRIPTION: Name what was not found and how the user can broaden, reset, or correct the search when possible.

RULE-ID: copy.missing.none SCOPE: missing-value TYPE: SHOULD TOPIC: data-display RULE: Use `None` when a known field has no value. DESCRIPTION: The word communicates deliberate absence rather than loading or failure.

RULE-ID: copy.missing.pending SCOPE: missing-value TYPE: MUST TOPIC: data-display RULE: Use `Pending` only while the system is still gathering the value. DESCRIPTION: Do not use it for absent, failed, or inapplicable data.

RULE-ID: copy.missing.not-applicable SCOPE: missing-value TYPE: MUST TOPIC: data-display RULE: Use `N/A` only when the field does not apply. DESCRIPTION: Prefer a contextual word over an unexplained dash.

RULE-ID: copy.status.success SCOPE: status-message TYPE: SHOULD TOPIC: feedback RULE: Confirm meaningful success in one short sentence. DESCRIPTION: Confirm what completed when the user needs confidence; do not celebrate routine noise.

RULE-ID: copy.status.waiting SCOPE: status-message TYPE: SHOULD TOPIC: feedback RULE: Name long-running work when the wait is meaningful. DESCRIPTION: Use the real activity, such as saving, syncing, importing, or deleting, without promising duration.

## Dates and time

RULE-ID: copy.dates.human-display SCOPE: human-date TYPE: SHOULD TOPIC: data-display RULE: Use an unambiguous human-readable absolute date. DESCRIPTION: A spelled-out month such as `6 May 2026` avoids locale-dependent day/month inversion in display copy.

RULE-ID: copy.dates.machine-format SCOPE: machine-date TYPE: MAY TOPIC: data-display RULE: Use ISO date formats for machine, storage, API, or explicitly technical contexts. DESCRIPTION: `YYYY-MM-DD` is unambiguous when the surface is intentionally technical; do not describe it as a localized human date.

RULE-ID: copy.dates.relative SCOPE: relative-time TYPE: SHOULD TOPIC: data-display RULE: Use relative time only when recency is the user's question. DESCRIPTION: Logs, reports, audits, and detail views need an absolute date and time.
