# Contextual design decisions

Read the case matching the decision, not the whole file by default. These are reasoning examples, not additional rules or a component catalog. The first three preserve explicit owner corrections; the last two illustrate documented design and copy decisions. Their rationale is an interpretation supported by the stated context, not a claim of measured user behavior. Changed-context probes are hypothetical.

Authority and exceptions remain in [00-start-here.md](../../../design/00-start-here.md). Rule IDs below refer to [UX rules](../../../design/03-ux-rules.md) or [copy rules](../../../design/05-copy-and-microcopy.md). Transfer the reasoning, not the exact arrangement.

## Grouping without another heading

**Context and decision:** In a note sidebar, the owner removed the pinned-group heading and requested extra separation below the shortcuts. Pinning remains available in each note's menu; the shortcuts remain at the top.

**Reasoning:** In this familiar workflow, placement and spacing can establish the group without another repeated label. The rejected heading adds a competing scan target without enabling another action. This applies `layout.relationships`, `surfaces.light-first`, and the explicit correction's precedence. It does not remove the controls or their accessible names.

**When to choose differently:** A mixed navigation surface whose groups have different meanings may need headings. Do not silently restore the removed heading because headings are conventional; establish whether new context changes the problem and respect the settled decision's scope.

**Transfer probe:** A new navigation design mixes team-owned shortcuts with personally pinned items. Is spacing enough to distinguish ownership, or is a short group label now necessary? Explain the uncertainty it resolves.

## Feedback that earns attention

**Context and decision:** After proofreading a note, the owner replaced an inline alert with a dismissible toast offering Undo. The result appears in the document, and the message supplies a useful reversal action without taking over the writing surface.

**Reasoning:** Undo adds capability beyond merely repeating that proofreading finished. This is a specific choice for reversible content changes under `feedback.sufficient` and `interaction.preserve-work`, not a requirement to toast every successful operation. The inspected implementation made Undo available only while it can restore the preceding text without overwriting later edits.

**When to choose differently:** A successful download may already be clear from the browser, requiring no extra message or duplicate Download action. A failed save leaves work at risk and needs visible, actionable feedback even in a quiet editor. Do not use temporary success treatment for an unresolved failure or promise recovery the product cannot perform.

**Transfer probe:** Proofreading finishes after the user has typed more text. Identify what can safely be undone before designing the action; changing its label cannot solve the data conflict.

## Preserve a deliberate full-width document

**Context and decision:** A markdown reading view was narrower than its editor. The owner explicitly removed the editorial component's maximum width so it fills its container.

**Reasoning:** A generic reading-measure preference did not justify a hidden width constraint inside this component. Container ownership and the explicit decision determine composition; the typography mode does not own page width. Keep the decision under `layout.component-spacing` and the local component contract rather than imposing a conventional reading limit again.

**When to choose differently:** In a separate sustained-reading design without that constraint, a container may legitimately limit a text block's measure using supported layout capabilities. That does not change the full-width component contract. Never patch its internals from a page to simulate the desired width.

**Transfer probe:** A document includes a wide table beside short prose. Decide which container, if any, benefits from a limit, and verify actual wrapping and overflow instead of applying one width to all content.

## Labels that establish versus repeat context

**Documented decision:** A row menu can say `Edit` or `Delete` when the row establishes the target. A global command surface with mixed targets needs more specific wording. A field label such as `Reminder` still establishes the empty field's value inside a `New reminder` dialog; it is not redundant just because the heading contains the noun.

**Reasoning:** `copy.no-context-restatement`, `copy.labels.object`, and `copy.buttons.destructive` distinguish actual ambiguity from repeated nouns. A final destructive button can still say `Delete` when its target is unmistakable; necessary consequences remain visible nearby. Neither shortest-label absolutism nor always naming the object captures that relationship.

**Transfer probe:** Selection changes the operation from one row to 14 items across several folders. Show the actual affected scope before commitment, preserving the concise action label only where the surrounding interface carries that scope clearly.

## Structure before explanatory copy

**Documented decision:** The relationship and attention check in [the system contract](../../../design/02-design-system.md#required-relationship-and-attention-check) groups a field with the action affecting it, aligns the action to the input, and attaches hints to their field. An explanatory sentence is not a substitute for that composition.

**Reasoning:** `layout.relationships`, `forms.action-scope`, and `copy.no-convention-explanation` address the cause of interpretation effort. The field label identifies the value; a hint earns space when it conveys an unfamiliar requirement or a known limit. Existing primitives own layout mechanics, and the field owns its hint and validation presentation.

**Transfer probe:** On a narrow supported screen, a long validation message appears below the field. Preserve the field/action relationship and readable recovery through wrapping; verify the rendered alignment rather than shrinking the text or adding instructions about which button to press.

## Using corrections in future work

Before reusing a case, compare its audience, task, state, consequence, and governing contract with the present situation. Keep an explicit decision's scope intact; distinguish an observed correction from your inferred rationale. If materially different context reverses the choice, state why. Leaving an already clear interface alone is a valid result.

When assessing changes to this skill, try a case and an unfamiliar variation before reading its preferred outcome. Record the proposed decision, evidence, user consequence, governing principle, and uncertainty. Include both restraint and necessary explicitness. A written walkthrough can reveal contradictions and missing guidance; it does not establish rendered usability or guarantee future agent behavior.
