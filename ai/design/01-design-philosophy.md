# Design philosophy for AI

[MUST] Use this document when a task requires judgment rather than a direct rule lookup.

[NOTE] It explains the product instincts behind the portable rules without repeating them.

> **Normative language:** `[MUST]` is mandatory; `[SHOULD]` is the default unless a concrete product reason justifies departure; `[MAY]` is optional; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. This philosophy is intentionally explanatory; operational requirements live in the marked rules and contracts. See `00-start-here.md` for precedence and conflict handling.

## Mental fit before mechanical logic

People experience software through perception, expectation, hesitation, confidence, and trust. They do not experience its database, route tree, or internal ownership model.

`RULE-ID: system.mental-model` owns the operational requirement. The design rationale is that a technically neat structure still fails when it makes the user stop and decode the product. A mentally awkward flow is evidence that the flow, rather than its explanation, needs attention.

## Patterns are promises

`RULE-ID: system.semantic-coherence` owns the whole-surface requirement. Names, placement, appearance, and grouping teach people what a surface contains and what its controls will do. A locally plausible element can still break that promise when its contents, scope, persistence, or consequence contradict the task or surrounding surface.

`RULE-ID: structure.category-integrity` owns named task boundaries. A coherent category contains its relevant peer functions, leaves deliberately separate functions somewhere predictable, and narrows or disappears when only one function remains. Exposing every possible option merely because the system can weakens that boundary.

## Discipline protects attention

A design system deliberately settles recurring decisions: spacing, token roles, component shape, interaction behavior, state treatment, and language patterns. That discipline saves judgment for the few decisions that genuinely depend on context and perception.

`RULE-ID: system.use-existing`, `RULE-ID: system.default-first`, and `RULE-ID: system.shared-owner` own the operational behavior. Starting from the system transfers learned behavior and settled decisions into the feature. A missing repeatable need points back to the shared owner so later features can inherit the improvement.

## Components are sealed pieces

A component owns its template, presentation, internal spacing, states, and behavior. Containers own placement, width, surrounding gap, and page composition.

`RULE-ID: system.sealed-components` and `RULE-ID: system.no-external-patches` own the boundary. Deep selectors, inline visual patches, specificity battles, and wrapper tricks break component ownership. A clean fix outside the task's scope remains a visible boundary rather than a reason for a local disguise.

Opinionated components are useful because their public APIs can express meaningful product variation without exposing every technically possible styling knob. Normal use is a stronger default than a maximal demonstration.

## Tokens carry meaning

`RULE-ID: tokens.semantic` and `RULE-ID: color.semantic-intent` own token choice. `primary` describes the main forward action; `danger` describes destructive or risky intent; surfaces describe planes; opacity describes hierarchy. A theme decides how those stable roles look.

`RULE-ID: color.raw-hue` permits raw hue when hue itself is data or a user choice, such as a chart series, swatch, or chosen tag color. `RULE-ID: accessibility.color-independent` keeps meaning available through another perceptual channel.

## Calm requires visible affordance

`RULE-ID: surfaces.light-first` owns the low-noise baseline without permitting hidden interaction. Chrome earns its place by clarifying structure, action, state, or priority, while current location, selected state, keyboard focus, destructive intent, and recovery remain visibly reachable.

Dense information can remain dense because the goal is to reduce interface chrome around it. Alignment, spacing, typography, and semantic weight usually establish hierarchy before another box, border, fill, icon, or label is needed.

`RULE-ID: content.scannable` owns the operational requirement. People scan operational interfaces before they read them closely, so the point, grouping, and decision-relevant detail carry more value than exhaustive explanation. Optional information without demonstrated value adds attention cost without earning it.

## One unit gets one boundary

`RULE-ID: surfaces.one-boundary` owns the operational default. Visual hierarchy weakens when every unit receives a border, tint, radius, shadow, and nested container. The lightest signal that keeps a unit legible is usually enough; floating elements can combine a surface with shadow because elevation is their meaning, while grounded content usually does not need it.

## Consistency is learned behavior

`RULE-ID: system.visual-behavior-contract` owns the consistency requirement. Every repeated interaction teaches the user what labels mean, where actions live, what color signals, and how a control behaves. Similarity lets that learning transfer.

Consistency is not sameness without context. The concept and behavior can remain stable while the surrounding layout adapts to the task.

## Feedback protects trust

`RULE-ID: interaction.visible-response` and `RULE-ID: interaction.truthful-state` own feedback integrity. Visible, local feedback reduces more uncertainty than a silent speed improvement. Activity fits unknown progress, determinate progress fits measured work, and clear words fit failure or recovery.

Manufactured progress, certainty, capability, or outcome may make an interface feel reassuring briefly, but it breaks the truthful state on which trust depends.

## Safety follows consequence

`RULE-ID: interaction.destructive-intent`, `RULE-ID: interaction.preserve-work`, and `RULE-ID: interaction.unsaved-warning` own the safety requirements. Reversible actions can be easy, while destructive, costly, or irreversible actions need clearer consequence and more deliberate intent. Undo, when the product can support it, reduces the cost of human error.

A product that absorbs accidental human behavior preserves more trust than one that punishes it.

## Accessibility is perception

Accessibility is the same design under real human variation: keyboard use, poor lighting, reduced vision, distraction, fatigue, motor constraints, color-vision differences, and motion sensitivity.

`RULE-ID: accessibility.color-independent`, `RULE-ID: accessibility.keyboard`, `RULE-ID: accessibility.focus`, and `RULE-ID: accessibility.contrast` own these requirements. Building them into the component contract treats accessibility as the design itself rather than release polish.

## Voice follows the surface

`RULE-ID: copy.concise`, `RULE-ID: copy.plain-language`, and `RULE-ID: copy.warmth` own the language defaults. Operational surfaces benefit from concise, specific language, while learning surfaces can carry more warmth. Useful warmth is plain and kind rather than cute, apologetic, or vague.

`RULE-ID: copy.truth` and `RULE-ID: copy.unknown-behavior` own product truth. Unknown behavior, consequence, or terminology is a product question rather than a copy opportunity.

## Expertise proposes; evidence refines

Established design knowledge, product context, and perceptual judgment can form a strong default without treating every decision as an uninformed guess. Decisions whose uncertainty or consequence matters are then refined through relevant people, behavior, accessibility evidence, or product data.

Validation sharpens the design; it does not replace design responsibility. Visible assumptions preserve the distinction between observation and preference, and evidence can reveal when the current pattern does not work as intended.

## Finished-product judgment

[SHOULD] Before handoff, ask:

- Does the structure match how the user thinks?
- Do the surface's name, contents, and behavior make the same promise?
- Is the primary task obvious without decoding?
- Can the user scan the interface and grasp the point before reading detail?
- Is every reachable state understandable and recoverable?
- Is the system being used or strengthened at the owning layer?
- Can anything be removed without reducing understanding?
- Are the claims, progress, consequences, and words truthful?

[SHOULD] Treat a technically correct but mentally awkward output as unfinished.
