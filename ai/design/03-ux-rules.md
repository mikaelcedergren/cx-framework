# UX rules

Portable cross-cutting rules. Search by `RULE-ID:`, `SCOPE:`, `TYPE:`, `TOPIC:`, or keyword. User-facing language rules live only in `05-copy-and-microcopy.md`; component-specific behavior lives only in `04-component-rules.md`.

> **Normative language:** `TYPE: MUST` is mandatory; `TYPE: SHOULD` is the default unless a concrete product reason justifies departure; `TYPE: MAY` is optional. `DESCRIPTION` is `[NOTE]`; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. See `00-start-here.md` for the canonical definitions, precedence, and conflict handling.

## System and component ownership

RULE-ID: system.mental-model SCOPE: global TYPE: MUST TOPIC: system RULE: Organize the experience around the user's mental model. DESCRIPTION: Product structure, naming, grouping, and sequence must not expose internal ownership or backend shape.

RULE-ID: system.semantic-coherence SCOPE: global TYPE: MUST TOPIC: system RULE: Make the interface's purpose, visible structure, and behavior form one coherent model. DESCRIPTION: A locally plausible element is still wrong when its name, contents, grouping, scope, persistence, or consequence contradicts the user's task or the surrounding surface. Treat interface choices inherited from a request, prototype, or component inventory as hypotheses unless product truth explicitly fixes them; their presence is not evidence of user value.

RULE-ID: system.use-existing SCOPE: design-system TYPE: MUST TOPIC: system RULE: Start with the consuming product's established tokens, components, patterns, and documented behavior. DESCRIPTION: Inspect the local system before choosing an implementation; familiar supported pieces reduce drift and transfer learned behavior across the product.

RULE-ID: system.default-first SCOPE: design-system TYPE: MUST TOPIC: system RULE: Begin with the chosen local component's defaults and the minimum supported configuration needed. DESCRIPTION: Change a default only when it fails to express a clear requirement in the current context; when several choices work, keep the default. The existence of another option or example is not a reason to use it.

RULE-ID: system.component-terms SCOPE: design-system TYPE: MUST TOPIC: components RULE: Treat component-family terms as semantic roles rather than implementation names. DESCRIPTION: A term such as button, dialog, tabs, or icon button describes the user-facing capability and behavior to find in the consuming product; it never prescribes a selector, import, property name, class, platform primitive, or internal structure.

RULE-ID: system.component-resolution SCOPE: design-system TYPE: MUST TOPIC: components RULE: Resolve every component role through the consuming product's established design system before creating custom UI. DESCRIPTION: Inspect local instructions, design-system documentation, dependencies, supported components, and nearby established use; follow this order without skipping a stage: (1) choose the closest existing component, (2) use a supported configuration, (3) use a supported composition, (4) adapt the design to the system's available capabilities, and (5) create the smallest custom solution only as a last resort while preserving local tokens, states, interaction behavior, accessibility, and visual character.

RULE-ID: system.shared-owner SCOPE: design-system TYPE: MUST TOPIC: components RULE: Put repeatable behavior in the nearest available shared owner when the accepted scope permits it. DESCRIPTION: Prefer improving the consuming product's owning component or pattern over creating a private feature substitute; when that owner is unavailable or outside scope, surface the gap and continue only through the fallback order in `RULE-ID: system.component-resolution`.

RULE-ID: system.sealed-components SCOPE: design-system TYPE: MUST TOPIC: components RULE: Keep component internals sealed from consumers. DESCRIPTION: Consumers control placement and composition, not internal templates, styles, padding, or state logic.

RULE-ID: system.no-external-patches SCOPE: design-system TYPE: MUST TOPIC: components RULE: Do not repair a component through consumer overrides. DESCRIPTION: Deep selectors, inline visual fixes, specificity battles, duplicated token values, and wrapper hacks hide the owning defect.

RULE-ID: system.component-role-first SCOPE: design-system-component TYPE: MUST TOPIC: components RULE: Define a shared component's user-facing role before adding public options. DESCRIPTION: Supported options should expose meaningful variation inside a clear role rather than accumulate styling knobs.

RULE-ID: structure.category-integrity SCOPE: named-surface TYPE: MUST TOPIC: hierarchy RULE: Make every named group or surface fulfill the promise created by its label and pattern. DESCRIPTION: Include the relevant peer capabilities inside its task boundary, place deliberately separate peers somewhere predictable, or narrow or remove the wrapper when only one function remains; never fill the category with unrelated behavior or expose every possible option merely because it exists.

RULE-ID: system.public-api-minimal SCOPE: design-system-component TYPE: MUST TOPIC: components RULE: Add public behavior only for a real repeatable need. DESCRIPTION: Defaults belong to the system; features should not decorate components through one-off options.

RULE-ID: system.default-normal SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Make the default state represent normal product use. DESCRIPTION: Defaults should not be maximal demos or unusually intrusive examples.

RULE-ID: system.reachable-states SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Define every state the component can actually reach. DESCRIPTION: Account for relevant default, hover, focus, active, selected, disabled, loading, empty, success, warning, and error behavior without inventing impossible states.

RULE-ID: system.no-empty-chrome SCOPE: global TYPE: MUST TOPIC: state RULE: No user-facing element may render empty or without enough visible content or an explicit visible state to explain its purpose. DESCRIPTION: This includes every control, overlay, container, surface, and optional wrapper. Accessible naming alone is insufficient: each interactive control needs visible text, an icon, or another perceivable signifier. An empty optional wrapper does not render. A dialog, dropdown, popover, or similar surface without meaningful content either shows a meaningful empty, loading, or error state or does not render.

RULE-ID: system.invalid-combinations SCOPE: design-system-component TYPE: MUST TOPIC: state RULE: Make invalid supported-option combinations fail clearly at the owning component. DESCRIPTION: Do not silently render broken or misleading chrome.

RULE-ID: system.visual-behavior-contract SCOPE: global TYPE: MUST TOPIC: consistency RULE: Make elements that look alike behave alike. DESCRIPTION: Visual similarity teaches a behavioral expectation that must transfer across the product.

## Accessibility and perception

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

RULE-ID: interaction.visible-response SCOPE: interactive TYPE: MUST TOPIC: feedback RULE: Give every user action a perceivable response. DESCRIPTION: Feedback may be immediate state, progress, navigation, or a message, but the product must not feel silent or broken.

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

RULE-ID: interaction.primary-region SCOPE: action-region TYPE: MUST TOPIC: interaction RULE: Use at most one primary forward action in one action region. DESCRIPTION: A page may contain distinct regions with their own local action hierarchy; unrelated actions must not compete as peers.

RULE-ID: interaction.secondary-utilities-overflow SCOPE: secondary-action TYPE: MUST TOPIC: hierarchy RULE: Put occasional utility actions such as copy or export inside the overflow menu instead of presenting them as persistent buttons beside it. DESCRIPTION: Keep visible action space for the current primary task; expose a secondary utility directly only when the product explicitly identifies it as a frequent primary task.

RULE-ID: interaction.automation-control SCOPE: automated-action TYPE: MUST TOPIC: trust RULE: Let users inspect, adjust, or reverse meaningful automated choices. DESCRIPTION: Automation should reduce work without making consequential decisions mysterious.

## Layout, density, and surfaces

RULE-ID: layout.normal-flow SCOPE: layout TYPE: SHOULD TOPIC: layout RULE: Use normal document flow before manual layering. DESCRIPTION: Grid, flex, intrinsic sizing, and component-owned layout adapt more reliably than magic offsets.

RULE-ID: layout.absolute-layer SCOPE: layout TYPE: MUST TOPIC: layout RULE: Use absolute positioning only for genuine out-of-flow layers. DESCRIPTION: Overlays, anchored surfaces, decoration, and visually hidden accessibility helpers are valid uses; ordinary alignment is not.

RULE-ID: layout.z-index SCOPE: layout TYPE: MUST TOPIC: layout RULE: Use defined stacking roles for real layering. DESCRIPTION: Do not add arbitrary z-index values to repair click targets or local overlap.

RULE-ID: layout.component-spacing SCOPE: design-system TYPE: MUST TOPIC: layout RULE: Let components own internal padding and containers own surrounding layout. DESCRIPTION: Containers control gaps, margins, width, placement, and page composition.

RULE-ID: layout.breathing-room SCOPE: layout TYPE: MUST TOPIC: density RULE: Preserve visible breathing room between distinct adjacent elements. DESCRIPTION: Choose a tokenized gap by relationship and visual weight; a declared gap does not satisfy this rule when independently perceivable elements still render as touching or near-touching. EXCEPT: Parts may meet only when contact itself communicates a documented connected composite or an intentional continuous structure such as a table grid, chart, or full-bleed surface; text and controls within that structure still require deliberate internal insets.

RULE-ID: layout.spacing-rhythm SCOPE: layout TYPE: SHOULD TOPIC: density RULE: Follow the product's tokenized spacing rhythm. DESCRIPTION: Use close spacing for related text-like content and more space for visually heavier groups. EXCEPT: Typography follows its own fitted scale.

RULE-ID: layout.default-gaps SCOPE: layout TYPE: SHOULD TOPIC: density RULE: Start with 8px for close relationships and 16px for separate or weighty groups. DESCRIPTION: Larger pauses should correspond to a real mental or page-level shift.

RULE-ID: layout.trailing-control-cluster SCOPE: secondary-controls TYPE: MUST TOPIC: layout RULE: Group secondary and contextual controls in one compact cluster aligned to the trailing edge. DESCRIPTION: Keep peer selectors, utilities, and overflow actions together with deliberate gaps; never distribute them across the full row or create empty space merely to fill available width. EXCEPT: Separate a leading control only when the product explicitly gives it a distinct navigation, scope-setting, or primary-task role.

RULE-ID: layout.no-page-horizontal-scroll SCOPE: page-layout TYPE: MUST TOPIC: layout RULE: Keep ordinary page content within the viewport. DESCRIPTION: Reflow or stack content rather than forcing page-level horizontal reading. EXCEPT: A bounded component may scroll horizontally when its role clearly requires it, such as a wide data table or carousel.

RULE-ID: layout.supported-viewports SCOPE: page-layout TYPE: MUST TOPIC: layout RULE: Support the consuming product's documented viewport range. DESCRIPTION: Do not invent a new minimum width or responsive tier inside a feature.

RULE-ID: layout.stability SCOPE: dynamic-layout TYPE: SHOULD TOPIC: layout RULE: Keep existing content visually stable during loading and updates. DESCRIPTION: Reserve known space and avoid unexpected shifts around the user's reading position.

RULE-ID: density.data-not-chrome SCOPE: data-display TYPE: SHOULD TOPIC: density RULE: Separate information density from interface density. DESCRIPTION: Dense data can remain readable without giving every value a box, icon, tag, or tooltip.

RULE-ID: content.scannable SCOPE: product-interface TYPE: MUST TOPIC: hierarchy RULE: Make operational interfaces scannable before they are exhaustive. DESCRIPTION: Lead with the point, group related information, keep labels and text blocks brief, and reveal supporting detail only when it helps the task, consequence, recovery, or accessibility; when additional explanation has no demonstrated value, omit it.

RULE-ID: surfaces.one-boundary SCOPE: visual-group TYPE: SHOULD TOPIC: surfaces RULE: Keep each visual group to one primary boundary; do not put a card, box, or bordered container inside another. DESCRIPTION: Flatten the composition with spacing, typography, dividers, or one shared surface instead of stacking borders, fills, shadows, and containers. EXCEPT: Nest a surface only when the user or product contract explicitly requires a distinct semantic plane.

RULE-ID: surfaces.floating-depth SCOPE: floating-surface TYPE: SHOULD TOPIC: surfaces RULE: Reserve shadow for floating elements and real elevation. DESCRIPTION: Grounded regions should rely on surfaces, spacing, opacity, and restrained borders.

RULE-ID: surfaces.light-first SCOPE: global TYPE: MUST TOPIC: affordance RULE: Start with the quietest complete interface; every visible addition must earn its place through clear user value. DESCRIPTION: Add a label, icon, badge, divider, container, border, fill, shadow, helper, or persistent control only when it materially improves understanding, task completion, discoverability, state perception, error prevention, or accessibility. If its value is uncertain, omit it until a demonstrated or explicitly requested need exists; never compromise necessary hierarchy, actions, state, consequences, form labels, accessible names, visible focus, readable contrast, or meaning beyond color.

## Tokens and color

RULE-ID: tokens.semantic SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Use semantic tokens instead of raw visual values. DESCRIPTION: Color, spacing, typography, radius, shadow, and motion should express a role that themes can preserve.

RULE-ID: tokens.no-alias-only SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Do not create a local token alias that only renames another token. DESCRIPTION: Keep an alias only when it creates a real consumer boundary, shared derived value, or coordinated runtime variation.

RULE-ID: tokens.theme-ready SCOPE: design-system TYPE: MUST TOPIC: tokens RULE: Build components against theme-aware semantic roles. DESCRIPTION: A component must not depend on a literal hue or one theme's surface value to remain usable.

RULE-ID: color.semantic-intent SCOPE: semantic-color TYPE: MUST TOPIC: color RULE: Use semantic color for intent rather than decoration. DESCRIPTION: Success, warning, danger, information, primary action, and neutral state must keep distinct meanings.

RULE-ID: color.raw-hue SCOPE: hue-as-data TYPE: MAY TOPIC: color RULE: Use a raw palette hue when hue itself is data or a user choice. DESCRIPTION: Charts, swatches, and chosen tag colors are valid examples; pair the hue with another signal when meaning matters.

RULE-ID: color.intent-vs-hue SCOPE: design-system TYPE: MUST TOPIC: color RULE: Keep semantic color intent distinct from direct hue as data or choice. DESCRIPTION: Use the consuming product's established vocabulary for semantic intent, direct hue, and structural variation rather than forcing one platform's option names onto another.

RULE-ID: color.large-area SCOPE: visual-group TYPE: SHOULD TOPIC: color RULE: Use large colored areas sparingly. DESCRIPTION: Surface area changes a color from a detail into the mood of the whole screen.

RULE-ID: surfaces.default-plane SCOPE: visual-group TYPE: SHOULD TOPIC: surfaces RULE: Keep the default surface as the main content plane. DESCRIPTION: Use an alternate surface only for a genuine recessed, framing, or grouped relationship.

RULE-ID: typography.structure SCOPE: global TYPE: MUST TOPIC: typography RULE: Use typography to represent real document hierarchy. DESCRIPTION: Do not use heading semantics, weight, or decorative letter spacing merely to make text louder.

## Forms and validation behavior

RULE-ID: forms.label SCOPE: form-control TYPE: MUST TOPIC: forms RULE: Give every form control a persistent accessible label. DESCRIPTION: The control must remain understandable when empty, populated, focused, or reporting an error.

RULE-ID: forms.validation-timing SCOPE: forms TYPE: SHOULD TOPIC: validation RULE: Validate after meaningful interaction rather than on every keystroke. DESCRIPTION: Blur is a useful default when the control has a natural blur moment.

RULE-ID: forms.submit-validation SCOPE: forms TYPE: MUST TOPIC: validation RULE: Validate all relevant fields on submit. DESCRIPTION: Show the complete current error set and move attention to the first error when necessary.

RULE-ID: forms.local-error SCOPE: form-control TYPE: MUST TOPIC: validation RULE: Keep field-specific validation next to its field. DESCRIPTION: Form-level feedback is for request, permission, conflict, timeout, or service failures that do not belong to one input.

RULE-ID: forms.clear-resolved-error SCOPE: form-control TYPE: MUST TOPIC: validation RULE: Remove an error when its condition is no longer true. DESCRIPTION: Stale errors make corrected input look broken.

RULE-ID: forms.forgiving-input SCOPE: form-control TYPE: SHOULD TOPIC: forms RULE: Accept reasonable human input formats and normalize internally. DESCRIPTION: Do not force users to reproduce storage formatting when the intended value is unambiguous.

RULE-ID: forms.submit-reachable SCOPE: forms TYPE: MUST TOPIC: forms RULE: Keep submission reachable when submit-time feedback is the recovery path. DESCRIPTION: Do not strand the user behind an unexplained disabled button. EXCEPT: Disable submission while a duplicate request is already processing or when action would be unsafe.

RULE-ID: forms.selection-pattern SCOPE: choice-control TYPE: MUST TOPIC: forms RULE: Match the control to the selection model. DESCRIPTION: Use checkboxes for multi-select, radios for a short single-select set, and a picker or select for larger sets.

RULE-ID: forms.choice-label-scope SCOPE: checkbox-radio-switch TYPE: MUST TOPIC: accessibility RULE: Give each individual choice its own adjacent label and label a collection separately only when the collection needs a group name. DESCRIPTION: A checkbox, radio option, or switch label explains that control and shares its activation target; a group label names the decision represented by multiple options and must not duplicate a standalone control label.

## Loading and feedback behavior

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

RULE-ID: content.truncation SCOPE: content-display TYPE: MAY TOPIC: hierarchy RULE: Allow intentional truncation for secondary or supporting text. DESCRIPTION: Treat truncation as a defect only when it hides task-primary information, an action, state, consequence, required recovery, or otherwise harms task success or accessibility.

RULE-ID: data.consistent-order SCOPE: data-display TYPE: SHOULD TOPIC: data-display RULE: Keep comparable views in the same information order. DESCRIPTION: Stable ordering improves scanning, comparison, and learned behavior.

RULE-ID: data.missing-state SCOPE: data-display TYPE: MUST TOPIC: state RULE: Distinguish absent, pending, unavailable, and failed data. DESCRIPTION: Empty space or a broken placeholder must not force the user to guess which state occurred.

RULE-ID: data.meaningful-absence SCOPE: data-display TYPE: MUST TOPIC: state RULE: Show absence when it answers a user question or confirms that the system completed its work. DESCRIPTION: No results, no activity, an empty expected region, and a known field with no value are meaningful states; use the correct state and copy rather than leaving unexplained space.

RULE-ID: data.irrelevant-absence SCOPE: data-display TYPE: MUST TOPIC: state RULE: Omit an absent field or block when it does not apply and its absence conveys no useful state. DESCRIPTION: Do not expose inaccessible features, irrelevant relationships, or inapplicable optional facts as empty chrome that implies forgotten or lost data.

RULE-ID: data.media-fallback SCOPE: media-display TYPE: MUST TOPIC: state RULE: Replace unavailable or failed media with an intentional non-broken fallback. DESCRIPTION: Use a stable placeholder or concise unavailable state that fits the surrounding design; use a skeleton only while media is genuinely loading and never leave the platform's default broken-media treatment as the explanation.

## Motion

RULE-ID: motion.purpose SCOPE: motion TYPE: SHOULD TOPIC: motion RULE: Give motion a state, orientation, or continuity purpose. DESCRIPTION: Do not animate merely to decorate a completed layout.

RULE-ID: motion.bounded SCOPE: motion TYPE: SHOULD TOPIC: motion RULE: Keep transitions bounded to the changing region. DESCRIPTION: Do not move the page around a user who is reading elsewhere.

RULE-ID: motion.duration SCOPE: motion TYPE: MUST TOPIC: motion RULE: Keep motion short enough that interaction never waits for decoration. DESCRIPTION: The user should not have to watch an animation before continuing.
