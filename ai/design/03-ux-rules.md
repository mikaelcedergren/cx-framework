# UX rules

Portable cross-cutting rules. Search by `RULE-ID:`, `SCOPE:`, `TYPE:`, `TOPIC:`, or keyword. User-facing language rules live only in `05-copy-and-microcopy.md`; component-specific behavior lives only in `04-component-rules.md`.

> **Normative language:** `TYPE: MUST` is mandatory; `TYPE: SHOULD` is the default unless a concrete product reason justifies departure; `TYPE: MAY` is optional. `DESCRIPTION` is `[NOTE]`; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. See `00-start-here.md` for the canonical definitions, precedence, and conflict handling.

## System and component ownership

RULE-ID: system.mental-model SCOPE: global TYPE: MUST TOPIC: system RULE: Organize the experience around the user's mental model. DESCRIPTION: Product structure, naming, grouping, and sequence must not expose internal ownership or backend shape.

RULE-ID: system.semantic-coherence SCOPE: global TYPE: MUST TOPIC: system RULE: Make the interface's purpose, visible structure, and behavior form one coherent model. DESCRIPTION: A locally plausible element is still wrong when its name, contents, grouping, scope, persistence, or consequence contradicts the user's task or the surrounding surface. Treat interface choices inherited from a request, prototype, or component inventory as hypotheses unless product truth or an explicit owner decision fixes them under the precedence in 00-start-here.md; their presence is not evidence of user value.

RULE-ID: system.use-existing SCOPE: design-system TYPE: MUST TOPIC: system RULE: Start with the consuming product's established tokens, components, patterns, and documented behavior. DESCRIPTION: Inspect the local system before choosing an implementation; familiar supported pieces reduce drift and transfer learned behavior across the product.

RULE-ID: system.default-first SCOPE: design-system TYPE: MUST TOPIC: system RULE: Begin with the chosen local component's defaults and the minimum supported configuration needed. DESCRIPTION: Change a default only when it fails to express a clear requirement in the current context; when several choices work, keep the default. The existence of another option or example is not a reason to use it.

RULE-ID: system.component-terms SCOPE: design-system TYPE: MUST TOPIC: components RULE: Treat component-family terms as semantic roles rather than implementation names. DESCRIPTION: A term such as button, dialog, tabs, or icon button describes the user-facing capability and behavior to find in the consuming product; it never prescribes a selector, import, property name, class, platform primitive, or internal structure.

RULE-ID: system.component-resolution SCOPE: design-system TYPE: MUST TOPIC: components RULE: Resolve every component role through the consuming product's established design system before creating custom UI. DESCRIPTION: Inspect local instructions, design-system documentation, dependencies, supported components, and nearby established use; follow this order without skipping a stage: (1) choose the closest existing component, (2) use a supported configuration, (3) use a supported composition, (4) adapt the design to the system's available capabilities, and (5) create the smallest custom solution only as a last resort while preserving local tokens, states, interaction behavior, accessibility, and visual character.

RULE-ID: system.shared-owner SCOPE: design-system TYPE: MUST TOPIC: components RULE: Put repeatable behavior in the nearest available shared owner when the accepted scope permits it. DESCRIPTION: Prefer improving the consuming product's owning component or pattern over creating a private feature substitute; when that owner is unavailable or outside scope, surface the gap and continue only through the fallback order in `RULE-ID: system.component-resolution`.

RULE-ID: system.one-task-one-owner SCOPE: design-system TYPE: SHOULD TOPIC: reuse RULE: Reuse one shared task owner across entry points, with common content, behavior, validation, state transitions, loading and error states, outcomes, and canonical state. Vary the surrounding title, supporting copy, actions, placement, size, or dismissal behavior only to fit the local mental model; create a task variant only when intent, consequence, permissions, or required behavior differs. DESCRIPTION: Create and edit can share a form while keeping distinct headings and completion actions; a table header, filter panel, and active-filter tag can share one filter editor; a page, dialog, and detail panel can present the same entity task. A different location or container alone does not justify a fork.

RULE-ID: system.sealed-components SCOPE: design-system TYPE: MUST TOPIC: components RULE: Keep component internals sealed from consumers. DESCRIPTION: Consumers control placement and composition, not internal templates, styles, padding, or state logic.

RULE-ID: system.no-external-patches SCOPE: design-system TYPE: MUST TOPIC: components RULE: Do not repair a component through consumer overrides. DESCRIPTION: Deep selectors, inline visual fixes, specificity battles, duplicated token values, and wrapper hacks hide the owning defect.

RULE-ID: system.no-rechroming SCOPE: design-system TYPE: MUST TOPIC: components RULE: Express a component's appearance only through its public API, documented variants, and published customization hooks. DESCRIPTION: This binds every consumer, including a pattern composing another component. Never paint substitute chrome around or over a healthy control — no consumer-built backing surface, background, border, blur, padding shell, or partial rebuild beside it. Containers own placement, size, and visibility; the component owns everything painted inside it. When no supported option produces the needed appearance, the owning component grows the capability — surface the gap instead of dressing the control locally.

RULE-ID: system.component-role-first SCOPE: design-system-component TYPE: MUST TOPIC: components RULE: Define a shared component's user-facing role before adding public options. DESCRIPTION: Supported options should expose meaningful variation inside a clear role rather than accumulate styling knobs.

RULE-ID: structure.category-integrity SCOPE: named-surface TYPE: MUST TOPIC: hierarchy RULE: Make every named group or surface fulfill the promise created by its label and pattern. DESCRIPTION: Include the relevant peer capabilities inside its task boundary, place deliberately separate peers somewhere predictable, or narrow or remove the wrapper when only one function remains; never fill the category with unrelated behavior or expose every possible option merely because it exists.

RULE-ID: system.public-api-minimal SCOPE: design-system-component TYPE: MUST TOPIC: components RULE: Add public behavior only for a real repeatable need. DESCRIPTION: Defaults belong to the system; features should not decorate components through one-off options.

RULE-ID: system.default-normal SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Make the default state represent normal product use. DESCRIPTION: Defaults should not be maximal demos or unusually intrusive examples.

RULE-ID: system.reachable-states SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Define every state the component can actually reach. DESCRIPTION: Account for relevant default, hover, focus, active, selected, disabled, loading, empty, success, warning, and error behavior without inventing impossible states. Handling a state does not require a separate visible surface; success may return to the ordinary usable state when its outcome is already clear.

RULE-ID: system.component-state-contract SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Use each component's supported state presentation as a complete contract. DESCRIPTION: Activate documented loading, selected, on or off, disabled, success, error, and other states without consumer-authored changes to the component's label, icons, structure, feedback, or state treatment, and do not narrate or duplicate state the component already communicates; if a required state is missing, surface the gap to the owning design system instead of improvising a local substitute.

RULE-ID: system.no-empty-chrome SCOPE: global TYPE: MUST TOPIC: state RULE: No user-facing element may render empty or without enough visible content or an explicit visible state to explain its purpose. DESCRIPTION: This includes every control, overlay, container, surface, and optional wrapper. Accessible naming alone is insufficient: each interactive control needs visible text, an icon, or another perceivable signifier. An empty optional wrapper does not render. A dialog, dropdown, popover, or similar surface without meaningful content either shows a meaningful empty, loading, or error state or does not render.

RULE-ID: system.invalid-combinations SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Make invalid supported-option combinations fail clearly at the owning component. DESCRIPTION: Do not silently render broken or misleading chrome.

RULE-ID: system.visual-behavior-contract SCOPE: global TYPE: MUST TOPIC: consistency RULE: Make elements that look alike behave alike. DESCRIPTION: Visual similarity teaches a behavioral expectation that must transfer across the product.

RULE-ID: system.task-value SCOPE: product-interface TYPE: SHOULD TOPIC: system RULE: Evaluate each control, message, field, and visual element against the user's current task: establish what it helps the user understand, decide, or do, whether its wording and appearance predict its behavior, and what useful information or ability would be lost without it. Keep useful elements, revise misleading ones, remove unnecessary ones, and surface unknown product behavior instead of inventing a justification. DESCRIPTION: Apply this review to the complete interface, including elements inherited from a request or an earlier design; `system.semantic-coherence` and `surfaces.light-first` own the binding requirements for coherence and visible additions.

## Completion review

RULE-ID: delivery.custodian-review SCOPE: feature-completion TYPE: MUST TOPIC: quality RULE: Automatically obtain Custodian review of the current finished output after implementation and verification, and require Pass before an unqualified feature-completion claim. DESCRIPTION: This review is automatic after implementation and verification; no separate user request is needed. Review the current delivered result and relevant evidence, including rendered UI and observed interactions when the feature has an interface. A plan, self-assessment, passing build, or test suite alone is not completion approval. Resolve findings through the owning skill and re-review affected output; a material change invalidates its earlier verdict. Missing required evidence leaves the feature unverified, not done.

## Accessibility and perception

RULE-ID: accessibility.usability-precedence SCOPE: global TYPE: MUST TOPIC: accessibility RULE: When an assistive-technology accommodation genuinely conflicts with core usability for the product's primary users, usability wins. DESCRIPTION: These products serve an advanced expert audience. Provide accessibility wherever it coexists with the best interaction — which is nearly always — but do not degrade pointer precision, interaction speed, or direct manipulation to preserve an accommodation such as screen-reader or screen-magnification support. Dropping an accommodation is a deliberate, recorded decision at the owning component, never a shortcut taken silently; the accessibility rules below continue to apply wherever no such conflict exists.

RULE-ID: accessibility.keyboard SCOPE: interactive TYPE: MUST TOPIC: accessibility RULE: Make every interactive element keyboard reachable. DESCRIPTION: Links, controls, menus, dialogs, and composite widgets must support appropriate keyboard operation.

RULE-ID: accessibility.focus SCOPE: interactive TYPE: MUST TOPIC: accessibility RULE: Keep keyboard focus clearly visible. DESCRIPTION: The focused element and current position must be perceivable without relying on pointer hover.

RULE-ID: accessibility.logical-order SCOPE: interactive TYPE: MUST TOPIC: accessibility RULE: Keep focus order aligned with the visual and task sequence. DESCRIPTION: Keyboard navigation must not jump unpredictably or enter hidden content.

RULE-ID: accessibility.color-independent SCOPE: global TYPE: MUST TOPIC: accessibility RULE: Encode meaning through more than color alone. DESCRIPTION: Pair hue with text, icon, shape, position, pattern, or another perceivable signal.

RULE-ID: accessibility.contrast SCOPE: global TYPE: MUST TOPIC: accessibility RULE: Preserve readable contrast in real viewing conditions. DESCRIPTION: Text, icons, focus, boundaries, and state indicators must remain perceivable beyond an ideal display.

RULE-ID: accessibility.semantic-structure SCOPE: global TYPE: MUST TOPIC: accessibility RULE: Match semantic structure to visual structure. DESCRIPTION: Headings, labels, landmarks, tables, and controls must expose the relationships users can see.

RULE-ID: accessibility.control-name SCOPE: interactive TYPE: MUST TOPIC: accessibility RULE: Give every interactive control a specific accessible name. DESCRIPTION: Prefer visible action text when an unfamiliar control needs explanation; icon-only controls still need a programmatic name.

RULE-ID: accessibility.target SCOPE: interactive TYPE: SHOULD TOPIC: accessibility RULE: Give interactive elements a forgiving natural target. DESCRIPTION: Increase the control's own hit area instead of placing invisible overlays above nearby content.

RULE-ID: accessibility.motion-preference SCOPE: motion TYPE: MUST TOPIC: accessibility RULE: Respect reduced-motion preferences. DESCRIPTION: Remove or simplify non-essential movement without hiding state change.

RULE-ID: accessibility.no-flashing SCOPE: motion TYPE: MUST TOPIC: accessibility RULE: Do not use flashing animation. DESCRIPTION: Flashing can harm users and is never required to communicate ordinary product state.

## Interaction, trust, and state

RULE-ID: interaction.visible-response SCOPE: interactive TYPE: MUST TOPIC: feedback RULE: Give every user action a perceivable response without duplicating an outcome already communicated. DESCRIPTION: Immediate state, progress, navigation, resulting content, or reliable browser or operating-system feedback can provide the response; apply `RULE-ID: feedback.sufficient` before adding a message.

RULE-ID: interaction.data-change SCOPE: data-change TYPE: MUST TOPIC: trust RULE: Make the intent and outcome of every data change visible. DESCRIPTION: Before an edit, move, toggle, or automated choice acts, users must understand what will change; afterward, show the resulting state.

RULE-ID: interaction.control-semantics SCOPE: interactive TYPE: MUST TOPIC: trust RULE: Make a control's visible category match the kind, scope, and lifetime of change it performs. DESCRIPTION: Users must be able to predict from its label, placement, appearance, and convention whether it refines a view, changes selection, edits an entity, saves a preference, or affects persistent system behavior; a view-refinement control may preserve view state but must never silently mutate the entities shown.

RULE-ID: interaction.truthful-state SCOPE: global TYPE: MUST TOPIC: trust RULE: Show only state and progress the system actually knows. DESCRIPTION: Never fabricate completion, capability, certainty, or measured progress for reassurance.

RULE-ID: interaction.preserve-work SCOPE: forms TYPE: MUST TOPIC: trust RULE: Preserve user-entered work after validation and request failures. DESCRIPTION: A recoverable failure must not clear unrelated input or force the user to start over.

RULE-ID: interaction.unsaved-warning SCOPE: unsaved-work TYPE: MUST TOPIC: trust RULE: Warn before navigation or closure can discard unsaved work. DESCRIPTION: Preserve platform-native protection and add product-level guards when changed content would otherwise be lost.

RULE-ID: interaction.preserve-context SCOPE: navigation TYPE: SHOULD TOPIC: state RULE: Preserve useful view context after local actions. DESCRIPTION: Keep relevant filters, sorting, selection, scroll position, and view mode when the task continues in the same place.

RULE-ID: interaction.destructive-intent SCOPE: destructive-action TYPE: MUST TOPIC: trust RULE: Require deliberate intent before destructive or irreversible action. DESCRIPTION: Friction and consequence should scale with risk and reversibility.

RULE-ID: interaction.consequence SCOPE: destructive-action TYPE: MUST TOPIC: trust RULE: Make destructive consequence clear before commitment. DESCRIPTION: The user must understand what changes, what remains, and whether recovery is possible.

RULE-ID: interaction.undo SCOPE: reversible-action TYPE: SHOULD TOPIC: trust RULE: Prefer undo for actions that can be safely reversed. DESCRIPTION: Recovery is often calmer and faster than confirmation for low-risk reversible changes.

RULE-ID: interaction.exit-parity SCOPE: opt-out TYPE: MUST TOPIC: trust RULE: Make leaving no harder than joining. DESCRIPTION: Unsubscribing, deleting an account, downgrading, and disabling a feature must not gain obstructive steps beyond safety checks required by the consequence.

RULE-ID: interaction.data-transparency SCOPE: data-collection TYPE: MUST TOPIC: trust RULE: Make data collection and its purpose plainly discoverable. DESCRIPTION: State what is collected and why without burying the explanation in deep settings or an unreadable policy.

RULE-ID: interaction.expectation-warning SCOPE: unfamiliar-behavior TYPE: MUST TOPIC: trust RULE: Warn before behavior must depart from an established expectation. DESCRIPTION: Signpost the difference before the user acts instead of explaining a surprising outcome afterward.

RULE-ID: interaction.unavailable SCOPE: interactive TYPE: MUST TOPIC: state RULE: Hide irrelevant actions and explain temporarily unavailable ones. DESCRIPTION: A disabled action is useful only when the user can understand and potentially resolve its blocker.

RULE-ID: interaction.passive SCOPE: global TYPE: MUST TOPIC: interaction RULE: Keep passive content non-interactive. DESCRIPTION: Clickability should reflect a clear action or navigation role rather than decorative hover behavior.

RULE-ID: interaction.hover SCOPE: interactive TYPE: MUST TOPIC: interaction RULE: Apply hover treatment only to interactive elements. DESCRIPTION: Hover on passive content creates a false affordance.

RULE-ID: interaction.cursor SCOPE: pointer-interface TYPE: MUST TOPIC: interaction RULE: Use only a hand cursor for elements that allow interaction and the normal arrow cursor for elements that do not; do not use any other cursor shape. DESCRIPTION: Apply the same distinction to text fields, drag handles, resize controls, and unavailable elements. Text-selection, grab, resize, busy, and prohibited cursor shapes are excluded; communicate those roles and states through the element's visible presentation and behavior.

RULE-ID: interaction.primary-region SCOPE: action-region TYPE: MUST TOPIC: interaction RULE: Use at most one primary forward action in one action region. DESCRIPTION: A page may contain distinct regions with their own local action hierarchy; unrelated actions must not compete as peers.

RULE-ID: interaction.secondary-utilities-overflow SCOPE: secondary-action TYPE: MUST TOPIC: hierarchy RULE: Put occasional utility actions such as copy or export inside the overflow menu instead of presenting them as persistent buttons beside it. DESCRIPTION: Keep visible action space for the current primary task; expose a secondary utility directly only when the product explicitly identifies it as a frequent primary task.

RULE-ID: interaction.automation-control SCOPE: automated-action TYPE: MUST TOPIC: trust RULE: Let users inspect, adjust, or reverse meaningful automated choices. DESCRIPTION: Automation should reduce work without making consequential decisions mysterious.

RULE-ID: interaction.repeat-action SCOPE: interactive TYPE: MUST TOPIC: interaction RULE: Reuse an available, understandable original control for repeating or retrying the same action. DESCRIPTION: Add a separate action only when it serves a distinct outcome, scope, or necessary recovery path; another location or a new success message alone does not justify a duplicate control.

## Layout, density, and surfaces

RULE-ID: layout.relationships SCOPE: layout TYPE: MUST TOPIC: layout RULE: Keep information, controls, and actions together according to what they affect. DESCRIPTION: Use proximity and alignment to make the relationship visible; preserve the group when space requires wrapping, and do not separate related parts merely because they are different component types.

RULE-ID: layout.normal-flow SCOPE: layout TYPE: SHOULD TOPIC: layout RULE: Use normal document flow before manual layering. DESCRIPTION: Grid, flex, intrinsic sizing, and component-owned layout adapt more reliably than magic offsets.

RULE-ID: layout.absolute-layer SCOPE: layout TYPE: MUST TOPIC: layout RULE: Use absolute positioning only for genuine out-of-flow layers. DESCRIPTION: Overlays, anchored surfaces, decoration, and visually hidden accessibility helpers are valid uses; ordinary alignment is not.

RULE-ID: layout.z-index SCOPE: layout TYPE: MUST TOPIC: layout RULE: Use defined stacking roles for real layering. DESCRIPTION: Do not add arbitrary z-index values to repair click targets or local overlap.

RULE-ID: layout.component-spacing SCOPE: design-system TYPE: MUST TOPIC: layout RULE: Let components own internal padding and containers own surrounding layout. DESCRIPTION: Containers control gaps, margins, width, placement, and page composition.

RULE-ID: layout.start-alignment SCOPE: layout TYPE: SHOULD TOPIC: layout RULE: Align ordinary content to the block start and direction-aware inline start by default. DESCRIPTION: A shared starting edge gives related elements a stable visual origin for scanning, comparison, and wrapping; choose center, end, baseline, or distributed alignment only when it materially improves the content's meaning, comparison, or operation, because available space or visual symmetry alone does not justify the departure.

RULE-ID: layout.complete-arrangement SCOPE: layout TYPE: SHOULD TOPIC: layout RULE: Review the complete arrangement: align related fields, size repeated controls consistently, and make visually connected elements form a continuous structure. DESCRIPTION: Judge relationships across the whole group rather than each element in isolation; preserve the separation and internal insets required by `layout.breathing-room`.

RULE-ID: layout.breathing-room SCOPE: layout TYPE: MUST TOPIC: density RULE: Preserve visible breathing room between distinct adjacent elements. DESCRIPTION: Choose a tokenized gap by relationship and visual weight; a declared gap does not satisfy this rule when independently perceivable elements still render as touching or near-touching. EXCEPT: Parts may meet only when contact itself communicates a documented connected composite or an intentional continuous structure such as a table grid, chart, or full-bleed surface; text and controls within that structure still require deliberate internal insets.

RULE-ID: layout.spacing-rhythm SCOPE: layout TYPE: SHOULD TOPIC: density RULE: Follow the product's tokenized spacing rhythm. DESCRIPTION: Use close spacing for related text-like content and more space for visually heavier groups. EXCEPT: Typography follows its own fitted scale.

RULE-ID: layout.default-gaps SCOPE: layout TYPE: SHOULD TOPIC: density RULE: Start with 8px for close relationships and 16px for separate or weighty groups. DESCRIPTION: Larger pauses should correspond to a real mental or page-level shift.

RULE-ID: layout.trailing-control-cluster SCOPE: secondary-controls TYPE: MUST TOPIC: layout RULE: Group secondary and contextual controls in one compact cluster aligned to the trailing edge. DESCRIPTION: Keep peer selectors, utilities, and overflow actions together with deliberate gaps; never distribute them across the full row or create empty space merely to fill available width. EXCEPT: Separate a leading control only when the product explicitly gives it a distinct navigation, scope-setting, or primary-task role.

RULE-ID: layout.no-page-horizontal-scroll SCOPE: page-layout TYPE: MUST TOPIC: layout RULE: Keep ordinary page content within the viewport. DESCRIPTION: Reflow or stack content rather than forcing page-level horizontal reading. EXCEPT: A bounded component may scroll horizontally when its role clearly requires it, such as a wide data table or carousel.

RULE-ID: layout.supported-viewports SCOPE: page-layout TYPE: MUST TOPIC: layout RULE: Support the consuming product's documented viewport range. DESCRIPTION: Do not invent a new minimum width or responsive tier inside a feature.

RULE-ID: layout.desktop-target SCOPE: desktop-layout TYPE: SHOULD TOPIC: layout RULE: Optimize desktop layouts for a 1920 × 1080 display, accounting for the usable application area after browser or operating-system chrome and display scaling. DESCRIPTION: Use 1080p as the desktop design target, not a fixed page size or minimum viewport; `layout.supported-viewports` still governs adaptation to other sizes, and `typography.size-ladder` governs text and control sizing.

RULE-ID: layout.stability SCOPE: dynamic-layout TYPE: SHOULD TOPIC: layout RULE: Keep existing content visually stable during loading and updates. DESCRIPTION: Reserve known space and avoid unexpected shifts around the user's reading position.

RULE-ID: density.data-not-chrome SCOPE: data-display TYPE: SHOULD TOPIC: density RULE: Separate information density from interface density. DESCRIPTION: Dense data can remain readable without giving every value a box, icon, tag, or tooltip.

RULE-ID: content.scannable SCOPE: product-interface TYPE: MUST TOPIC: hierarchy RULE: Make operational interfaces scannable before they are exhaustive; retain optional text, feedback, controls, and containers only when removing them would harm successful use or necessary understanding. DESCRIPTION: Lead with the point, group related information, keep labels and text blocks brief, and reveal supporting detail only when it helps the task, consequence, recovery, or accessibility; when additional explanation has no demonstrated value, omit it. Before retaining optional text, feedback, a control, or a container, identify the uncertainty it resolves or task it enables; remove it when its absence changes neither successful use nor necessary understanding.

RULE-ID: content.body-is-primary SCOPE: product-interface TYPE: MUST TOPIC: hierarchy RULE: Treat body content as primary content, never as supporting text to de-emphasize. DESCRIPTION: The content a surface exists to show keeps the default type size and the prominent text color. Supporting data means metadata in a footer, a side note, or a hint, and is signalled by the muted color and by placement, not by shrinking it; body text under a heading is content, not supporting data.

RULE-ID: surfaces.one-boundary SCOPE: visual-group TYPE: SHOULD TOPIC: surfaces RULE: Keep each visual group to one primary boundary; do not put a card, box, or bordered container inside another. DESCRIPTION: Flatten the composition with spacing, typography, dividers, or one shared surface instead of stacking borders, fills, shadows, and containers. EXCEPT: Nest a surface only when the user or product contract explicitly requires a distinct semantic plane.

RULE-ID: surfaces.floating-depth SCOPE: floating-surface TYPE: SHOULD TOPIC: surfaces RULE: Reserve shadow for floating elements and real elevation. DESCRIPTION: Grounded regions should rely on surfaces, spacing, opacity, and restrained borders.

RULE-ID: surfaces.light-first SCOPE: global TYPE: MUST TOPIC: affordance RULE: Start with the quietest complete interface; every visible addition must earn its place through clear user value. DESCRIPTION: Add a label, icon, badge, divider, container, border, fill, shadow, helper, or persistent control only when it materially improves understanding, task completion, discoverability, state perception, error prevention, or accessibility. If its value is uncertain, omit it until a demonstrated or explicitly requested need exists; never compromise necessary hierarchy, actions, state, consequences, form labels, accessible names, visible focus, readable contrast, or meaning beyond color.

## Tokens and color

RULE-ID: tokens.semantic SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Establish the baseline with existing global tokens used for their documented purposes. DESCRIPTION: Choose an equivalent or sufficiently close token within the intended role before using a direct value; tiny visual differences do not justify another value or token. Direct values are a last resort when no suitable equivalent or close token exists. Only an explicit instruction from the user permits departing from a token's documented purpose; the agent never invents that exception.

RULE-ID: tokens.direct-global SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Consume global tokens directly; intermediate styling variables are forbidden. DESCRIPTION: The ban applies everywhere, including components, wrappers, pages, and other local scopes, whether the intermediate holds a token reference, a literal, a derived calculation, or a changing runtime value. Customisation, reuse, variants, and runtime behaviour do not create exceptions. Set changing properties directly. Global semantic aliases within the shared token vocabulary are allowed; moving a component-specific variable into a global declaration does not make it a global token. Existing violations and documented styling hooks are not permission to introduce or reuse intermediates; surface an out-of-scope owner instead of adding a workaround.

RULE-ID: tokens.new-global SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Suggest a new global token only for an established shared purpose and obtain explicit user approval before creating it. DESCRIPTION: Repeated direct values in many places with the same meaning may justify a rare proposal after checking existing equivalents and close tokens. Define the token's purpose in the owning token documentation. Repetition alone does not justify a token, and a component-specific styling control never becomes a shared purpose merely by being declared globally.

RULE-ID: tokens.theme-ready SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Build components against theme-aware semantic roles. DESCRIPTION: A component must not depend on a literal hue or one theme's surface value to remain usable.

RULE-ID: color.semantic-intent SCOPE: semantic-color TYPE: MUST TOPIC: color RULE: Use semantic color for intent rather than decoration. DESCRIPTION: Success, warning, danger, information, primary action, and neutral state must keep distinct meanings.

RULE-ID: color.raw-hue SCOPE: hue-as-data TYPE: MAY TOPIC: color RULE: Use a raw palette hue when hue itself is data or a user choice. DESCRIPTION: Charts, swatches, and chosen tag colors are valid examples; pair the hue with another signal when meaning matters.

RULE-ID: color.intent-vs-hue SCOPE: design-system TYPE: MUST TOPIC: color RULE: Keep semantic color intent distinct from direct hue as data or choice. DESCRIPTION: Use the consuming product's established vocabulary for semantic intent, direct hue, and structural variation rather than forcing one platform's option names onto another.

RULE-ID: color.large-area SCOPE: visual-group TYPE: SHOULD TOPIC: color RULE: Use large colored areas sparingly. DESCRIPTION: Surface area changes a color from a detail into the mood of the whole screen.

RULE-ID: surfaces.default-plane SCOPE: visual-group TYPE: SHOULD TOPIC: surfaces RULE: Keep the default surface as the main content plane. DESCRIPTION: Use an alternate surface only for a genuine recessed, framing, or grouped relationship.

RULE-ID: typography.structure SCOPE: global TYPE: MUST TOPIC: typography RULE: Use typography to represent real document hierarchy. DESCRIPTION: Do not use heading semantics, weight, or decorative letter spacing merely to make text louder.

RULE-ID: typography.size-ladder SCOPE: global TYPE: MUST TOPIC: typography RULE: Use the default type and component size as the standard; small requires a proper stated reason, and tiny is used only where the product owner has explicitly defined its use. DESCRIPTION: Default is not a starting point to shrink from. Choose a small size only for a specific, nameable reason in that design, never as a habit or to mark text as secondary; an agent never chooses a tiny size on its own. Reusing an existing class or example does not launder its size: check what a copied style resolves to before adopting it.

RULE-ID: typography.editorial-mode SCOPE: page-content TYPE: MUST TOPIC: typography RULE: Use the consuming product's single editorial typography mode for an article, marketing landing page, or public information page whose primary task is reading or persuasion; use ordinary application typography for operational UI. DESCRIPTION: Opt the authored content stream into editorial mode once and write semantic HTML; do not assemble an editorial hierarchy from per-element size or weight utilities, and do not apply editorial treatment inside cards, forms, dialogs, operational tables, assistant answers, or other typical product UI.

## Forms and validation behavior

RULE-ID: forms.interaction-baseline SCOPE: forms TYPE: MUST TOPIC: forms RULE: Use the forms and validation rules as the baseline for every form, and specify any context-required deviation explicitly before implementing it. DESCRIPTION: Guide users when something needs attention and otherwise leave the interaction quiet; an assumed special case is not an exception.

RULE-ID: forms.action-scope SCOPE: forms TYPE: MUST TOPIC: layout RULE: Place an action affecting one field beside that field within the same labeled row; place actions committing or cancelling the whole form after the complete form. DESCRIPTION: Determine placement from the action's scope, not its button type; field-specific actions remain with their field even inside a larger form. Preserve this grouping when a narrow layout requires wrapping, using the consuming product's supported composition.

RULE-ID: forms.horizontal-layout SCOPE: forms TYPE: SHOULD TOPIC: layout RULE: Arrange form controls as horizontal labeled rows by default. DESCRIPTION: Keep labels in one stable leading column with their controls beside them so related fields scan quickly; use the consuming product's established labeled-row pattern when it exists. EXCEPT: Stack a label above its control when the product explicitly requires a vertical form or a documented narrow-layout constraint makes the horizontal row unreadable.

RULE-ID: forms.label SCOPE: form-control TYPE: MUST TOPIC: forms RULE: Give every form control a persistent accessible label. DESCRIPTION: The control must remain understandable when empty, populated, focused, or reporting an error.

RULE-ID: forms.validation-timing SCOPE: forms TYPE: MUST TOPIC: validation RULE: Validate a field when the user leaves it, not while they are typing; keep an existing error visible during correction and validate again when they leave the field. DESCRIPTION: Let the user finish before judging their input. An empty required field follows the same timing as any other invalid value; `forms.submit-validation` governs validation when the user moves the form forward.

RULE-ID: forms.submit-validation SCOPE: forms TYPE: MUST TOPIC: validation RULE: Validate the whole form when the user takes the action that moves it forward, and show every known error subject to `forms.error-priority`; if the first invalid field is offscreen, scroll it into view and focus it. Let users correct errors in any order. DESCRIPTION: Submit-time feedback reveals all areas needing attention without forcing a correction sequence or showing every competing message for one area.

RULE-ID: forms.local-error SCOPE: form-control TYPE: MUST TOPIC: validation RULE: Show a field-specific error directly below its field whenever possible, otherwise in the nearest clearly associated location, and expose that association to screen readers. Put failures affecting the whole form at the top of the form. DESCRIPTION: An empty required field needs the same local correction guidance as another invalid value. Request, permission, conflict, timeout, or service failures belong at form level only when they do not belong to one input; `accessibility.color-independent` and `copy.errors.problem-fix` govern perceivable meaning and recovery wording.

RULE-ID: forms.clear-resolved-error SCOPE: form-control TYPE: MUST TOPIC: validation RULE: Remove an error when validation confirms that its condition is no longer true. DESCRIPTION: Recheck at the moments defined by `forms.validation-timing` and `forms.submit-validation`; do not clear an error merely because typing resumed or leave it visible after a successful recheck.

RULE-ID: forms.error-priority SCOPE: validation-area TYPE: MUST TOPIC: validation RULE: Show only the highest-priority error in one area, then reveal the next relevant error after it is resolved. DESCRIPTION: Give the user one clear correction at a time within an area; errors in different fields remain visible together under `forms.submit-validation`. EXCEPT: Show multiple errors in one area when they identify separate, independently actionable problems the user needs to see together, such as different lines in a code block; connect each message to its specific input location.

RULE-ID: forms.valid-state SCOPE: form-control TYPE: MUST TOPIC: feedback RULE: Leave valid fields in their normal state; do not add success borders, checkmarks, or messages merely to confirm that a value is correct. DESCRIPTION: The normal field state means no correction is needed; extra feedback is reserved for information that needs attention.

RULE-ID: forms.hint-error-priority SCOPE: form-control TYPE: MUST TOPIC: validation RULE: Show supporting hint text only while its field has no error; replace the hint with the error message while invalid and restore it when the error is resolved. DESCRIPTION: Correction guidance takes priority over routine supporting text; retain any information needed to fix the value in the error itself.

RULE-ID: forms.forgiving-input SCOPE: form-control TYPE: MUST TOPIC: forms RULE: Accept and normalize familiar input formats when their meaning is unambiguous; never silently change the user's intended value, and explain what needs correction when interpretation is uncertain. DESCRIPTION: Phone numbers may include spaces, and dates may use familiar separators when the date remains unambiguous. Flexible input does not change the product's date-display or storage contract.

RULE-ID: forms.submit-reachable SCOPE: forms TYPE: MUST TOPIC: forms RULE: Keep the action that moves a form forward available while the form is incomplete so the user can trigger validation and learn what needs fixing. DESCRIPTION: An incomplete or invalid field is a reason to show recovery guidance, not to hide it behind a disabled action. EXCEPT: Prevent a duplicate request while submission is processing, and keep an action unavailable when invoking it would be unsafe beyond ordinary validation failure.

RULE-ID: forms.submitting SCOPE: forms TYPE: MUST TOPIC: feedback RULE: After validation passes and the form is sent, visibly show processing and prevent duplicate submission until the request finishes. DESCRIPTION: Use the action's supported loading state under `system.component-state-contract`; failure recovery preserves entered values under `interaction.preserve-work`.

RULE-ID: forms.selection-pattern SCOPE: choice-control TYPE: MUST TOPIC: forms RULE: Match the control to the selection model. DESCRIPTION: Use checkboxes for multi-select, radios for a short single-select set, and a picker or select for larger sets.

RULE-ID: forms.choice-label-scope SCOPE: checkbox-radio-switch TYPE: MUST TOPIC: accessibility RULE: Give each individual choice its own adjacent label and label a collection separately only when the collection needs a group name. DESCRIPTION: A checkbox, radio option, or switch label explains that control and shares its activation target; a group label names the decision represented by multiple options and must not duplicate a standalone control label.

## Loading and feedback behavior

RULE-ID: feedback.sufficient SCOPE: feedback TYPE: MUST TOPIC: feedback RULE: Count existing control, content, browser, and operating-system feedback; add a message only when that feedback leaves a user need unanswered. DESCRIPTION: Count perceivable feedback already provided by the control, resulting content, browser, or operating system. Do not repeat clear success or add reassurance for hypothetical uncertainty; retain truthful activity, actionable failures, and necessary recovery when existing feedback does not cover them.

RULE-ID: feedback.unknown-progress SCOPE: loading TYPE: SHOULD TOPIC: feedback RULE: Use activity feedback when duration cannot be measured. DESCRIPTION: A spinner or equivalent activity state communicates work without pretending to know completion.

RULE-ID: feedback.measured-progress SCOPE: loading TYPE: MUST TOPIC: feedback RULE: Use determinate progress only when progress is measured. DESCRIPTION: The displayed value must come from real completed work and a known endpoint.

RULE-ID: feedback.content-shape SCOPE: loading TYPE: SHOULD TOPIC: feedback RULE: Use skeletons when the incoming content shape is known. DESCRIPTION: A stable placeholder can preserve layout and set an honest expectation of structure.

RULE-ID: feedback.spinner-delay SCOPE: loading TYPE: SHOULD TOPIC: feedback RULE: Delay transient activity indicators enough to avoid flicker. DESCRIPTION: Very fast actions can complete through direct state change without flashing a spinner.

RULE-ID: feedback.attention SCOPE: feedback TYPE: SHOULD TOPIC: feedback RULE: Place feedback near the action or content it explains. DESCRIPTION: The user should not hunt elsewhere on the page to learn whether local work started or failed.

RULE-ID: feedback.interruption SCOPE: interruption TYPE: MUST TOPIC: feedback RULE: Interrupt only when the information earns immediate attention. DESCRIPTION: Prefer quiet inline or persistent state for information that can wait.

## Navigation and information order

RULE-ID: navigation.user-model SCOPE: navigation TYPE: MUST TOPIC: navigation RULE: Structure navigation around user goals and concepts. DESCRIPTION: Internal teams, services, routes, and database entities are not a navigation model.

RULE-ID: navigation.current-location SCOPE: navigation TYPE: MUST TOPIC: navigation RULE: Make current location obvious. DESCRIPTION: Active navigation must be perceivable through more than a tiny color shift.

RULE-ID: navigation.back-origin SCOPE: navigation TYPE: MUST TOPIC: navigation RULE: Return Back to the origin and context the user actually left. DESCRIPTION: Restore relevant query, selection, and view state instead of guessing a generic parent.

RULE-ID: navigation.position-stability SCOPE: navigation TYPE: SHOULD TOPIC: navigation RULE: Keep established navigation positions stable. DESCRIPTION: Users remember placement before they reread labels.

RULE-ID: navigation.breadcrumb-depth SCOPE: navigation TYPE: MAY TOPIC: navigation RULE: Use breadcrumbs only for genuine hierarchical depth. DESCRIPTION: Do not add them to flat products or as a substitute for a correct Back action.

RULE-ID: navigation.priority-frequency SCOPE: navigation TYPE: SHOULD TOPIC: navigation RULE: Make important and frequently used destinations easier to reach. DESCRIPTION: Placement and depth should reflect user value and observed task frequency rather than internal hierarchy; infrequent destinations may accept more disclosure without burying essential work.

RULE-ID: navigation.information-scent SCOPE: navigation-label TYPE: MUST TOPIC: navigation RULE: Make a navigation label predict what its destination or menu contains. DESCRIPTION: Use the consuming product's specific concept instead of vague buckets such as `More` or `Other` when the label would otherwise force users to open the destination to learn its meaning.

RULE-ID: data.user-importance SCOPE: data-display TYPE: MUST TOPIC: data-display RULE: Order information by user importance rather than storage order. DESCRIPTION: Lead with the human-recognizable name or label, current state, or signal that changes what the user should do now. Keep opaque internal identifiers secondary unless people genuinely use them for lookup, disambiguation, support, audit, or communication.

RULE-ID: content.truncation SCOPE: content-display TYPE: MAY TOPIC: hierarchy RULE: Choose intentional truncation or wrapping for secondary or supporting text according to the context and what people need to read. DESCRIPTION: content.truncation-disclosure governs the indication and access to full content. Treat truncation as a defect only when it hides task-primary information, an action, state, consequence, required recovery, or otherwise harms task success or accessibility.

RULE-ID: content.truncation-disclosure SCOPE: truncated-content TYPE: MUST TOPIC: hierarchy RULE: Indicate truncated text with an ellipsis and keep the full content accessible through the established disclosure pattern. DESCRIPTION: copy.ellipsis distinguishes this display treatment from authored punctuation; tooltips.overflow governs clipped-text previews when the disclosure uses a tooltip.

RULE-ID: data.consistent-order SCOPE: data-display TYPE: SHOULD TOPIC: data-display RULE: Keep comparable views in the same information order. DESCRIPTION: Stable ordering improves scanning, comparison, and learned behavior.

RULE-ID: data.missing-state SCOPE: data-display TYPE: MUST TOPIC: state RULE: Distinguish absent, pending, unavailable, and failed data. DESCRIPTION: Empty space or a broken placeholder must not force the user to guess which state occurred.

RULE-ID: data.meaningful-absence SCOPE: data-display TYPE: MUST TOPIC: state RULE: Show absence when it answers a user question or confirms that the system completed its work. DESCRIPTION: No results, no activity, an empty expected region, and a known field with no value are meaningful states; use the correct state and copy rather than leaving unexplained space.

RULE-ID: data.irrelevant-absence SCOPE: data-display TYPE: MUST TOPIC: state RULE: Omit an absent field or block when it does not apply and its absence conveys no useful state. DESCRIPTION: Do not expose inaccessible features, irrelevant relationships, or inapplicable optional facts as empty chrome that implies forgotten or lost data.

RULE-ID: data.media-fallback SCOPE: media-display TYPE: MUST TOPIC: state RULE: Replace unavailable or failed media with an intentional non-broken fallback. DESCRIPTION: Use a stable placeholder or concise unavailable state that fits the surrounding design; use a skeleton only while media is genuinely loading and never leave the platform's default broken-media treatment as the explanation.

## Motion

RULE-ID: motion.purpose SCOPE: motion TYPE: SHOULD TOPIC: motion RULE: Give motion a state, orientation, or continuity purpose. DESCRIPTION: Do not animate merely to decorate a completed layout.

RULE-ID: motion.bounded SCOPE: motion TYPE: SHOULD TOPIC: motion RULE: Keep transitions bounded to the changing region. DESCRIPTION: Do not move the page around a user who is reading elsewhere.

RULE-ID: motion.duration SCOPE: motion TYPE: MUST TOPIC: motion RULE: Keep motion short enough that interaction never waits for decoration. DESCRIPTION: The user should not have to watch an animation before continuing.
