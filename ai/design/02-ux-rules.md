# UX rules

RULE: Prioritize clarity over speed when rules conflict. TYPE: must TOPIC: system DESCRIPTION: When rules conflict, choose the clearest option.

---

RULE: Never change data silently; always show intent and outcome. TYPE: must TOPIC: trust DESCRIPTION: Preserve the user's mental model by surfacing intent and outcome of any data change.

---

RULE: Always make system status and action outcomes clear through feedback or visual state. TYPE: must TOPIC: feedback DESCRIPTION: Never leave users in limbo about status or outcomes.

---

RULE: Preserve user context after an action: filters, sorting, scroll position, and view state. TYPE: must TOPIC: state DESCRIPTION: Never destroy filters, sorting, scroll, or view state after an action.

---

RULE: Make navigation reversible so Back returns the user to the view state they left. TYPE: must TOPIC: navigation DESCRIPTION: Back must restore the same view state.

---

RULE: Use progressive disclosure: show relevant info now, hide or tone down irrelevant info. TYPE: must TOPIC: complexity DESCRIPTION: Show what is relevant and actionable now.

---

RULE: Prefer one primary action per view. TYPE: must TOPIC: interaction DESCRIPTION: At most one primary action per view; some views may have none. EXCEPTION: Some views may have no primary action.

---

RULE: Use existing components and tokens instead of inventing new patterns. TYPE: must TOPIC: consistency DESCRIPTION: Do not invent new patterns when an existing one fits.

---

RULE: Use semantic tokens for color, spacing, typography, radius, and motion. TYPE: must TOPIC: tokens DESCRIPTION: Style via semantic tokens, not raw values.

---

RULE: Follow the 4px spacing rhythm defined in the tokens. TYPE: must TOPIC: tokens DESCRIPTION: Use the token-defined 4px spacing rhythm. EXCEPTION: Unless explicitly asked to make an exception.

---

RULE: Use only defined z-index stack layers; do not add one-off z-index values. TYPE: must TOPIC: layout DESCRIPTION: Stick to the defined z-index stack.

---

RULE: Use european sentence case, American English, and simple, concise, scannable, correct copy. TYPE: must TOPIC: copy DESCRIPTION: Copy must be concise, scannable, and grammatically correct.

---

RULE: Never use American title case; capitalize only the first word and proper nouns. TYPE: must TOPIC: copy DESCRIPTION: No title case in headings, titles, labels, or document names.

---

RULE: Use consistent terminology for the same concept across views. TYPE: must TOPIC: consistency DESCRIPTION: Same concept, same term everywhere.

---

RULE: Do not rely on color alone to communicate state, severity, or importance. TYPE: must TOPIC: accessibility DESCRIPTION: Color must not be the sole signal.

---

RULE: Make error messages actionable: state what is wrong and how to fix it. TYPE: must TOPIC: errors DESCRIPTION: Errors explain problem and remedy.

---

RULE: Avoid horizontal scrolling in standard layouts. TYPE: must TOPIC: layout DESCRIPTION: No horizontal scroll in standard layouts. EXCEPTION: Allowed for dense data tables.

---

RULE: Avoid vertical scrolling when possible. TYPE: must TOPIC: layout DESCRIPTION: Minimize vertical scrolling.

---

RULE: Do not optimize below 960px viewport width. TYPE: must TOPIC: layout DESCRIPTION: 960px is the minimum supported width.

---

RULE: Order information by user importance, not backend structure. TYPE: must TOPIC: data-display DESCRIPTION: Primary signal first, supporting context later.

---

RULE: Do not show more information than the primary task needs. TYPE: must TOPIC: complexity DESCRIPTION: Keep affordance low; more text does not aid understanding.

---

RULE: Show explicit empty states only when absence is meaningful; otherwise hide the block. TYPE: must TOPIC: state DESCRIPTION: Use None/No results/Pending/N/A only when meaningful, and communicate absence not error.

---

RULE: Use relative time only for events under 7 days; use absolute dates for 7+ days and always in logs, reports, and detail views. TYPE: must TOPIC: data-display DESCRIPTION: Relative time under 7 days; absolute date otherwise and always in logs/reports/details.

---

RULE: Minimize accidental actions across all UI. TYPE: must TOPIC: interaction DESCRIPTION: Not just high-risk actions.

---

RULE: Hide unavailable actions unless temporarily blocked by a fixable condition. TYPE: must TOPIC: state DESCRIPTION: If temporarily blocked, show disabled and explain why. EXCEPTION: If temporarily blocked by a fixable condition, show disabled with explanation.

---

RULE: Require deliberate interaction for secondary and destructive actions. TYPE: must TOPIC: interaction DESCRIPTION: Secondary and destructive actions need intent.

---

RULE: Require explicit intent for destructive or irreversible actions; never execute them silently. TYPE: must TOPIC: interaction DESCRIPTION: Destructive actions must not fire silently.

---

RULE: Add extra friction to high-risk actions to prevent misclicks. TYPE: must TOPIC: interaction DESCRIPTION: High-risk actions need added friction.

---

RULE: Make buttons describe actions, not states; the only allowed in-button state is a processing spinner. TYPE: must TOPIC: components DESCRIPTION: Button labels are verbs, not states.

---

RULE: Validate forms inline and on submit. TYPE: must TOPIC: validation DESCRIPTION: Both inline and submit-time validation required.

---

RULE: Keep submit buttons enabled so users can trigger validation feedback. TYPE: must TOPIC: forms DESCRIPTION: Never disable submit to gate validation.

---

RULE: Show system status while waiting: spinner for unknown duration, progress bar for measurable progress. TYPE: must TOPIC: feedback DESCRIPTION: Match waiting indicator to whether progress is measurable.

---

RULE: Keep the UI visually stable during loading or updates; do not shift existing content unexpectedly. TYPE: must TOPIC: feedback DESCRIPTION: No unexpected content shifts during load.

---

RULE: Show in-element spinners only after a ~300ms delay to avoid flicker. TYPE: must TOPIC: feedback DESCRIPTION: Delay spinners ~300ms.

---

RULE: Place checkbox, switch, and radio labels to the right of the control, describing what it does. TYPE: must TOPIC: forms DESCRIPTION: A separate label exists only for a group, never for a single standalone control. EXCEPTION: A separate group label is allowed for a group of controls.

---

RULE: Place destructive actions last in context menus and make them visually distinct. TYPE: must TOPIC: components DESCRIPTION: Destructive context-menu items are last and distinct.

---

RULE: Prefer context menus or dedicated action triggers over inline clickable clutter when many actions exist. TYPE: must TOPIC: interaction DESCRIPTION: Avoid inline action clutter.

---

RULE: Keep tooltips short clarification only; never put detailed instructions or core understanding in them. TYPE: must TOPIC: microcopy DESCRIPTION: Tooltips are optional clarification, not load-bearing.

---

RULE: Show tooltips with a ~1s hover delay to confirm intent. TYPE: must TOPIC: feedback DESCRIPTION: Delay tooltips ~1s.

---

RULE: Use tabs to organize information, not to split a single create/edit flow. TYPE: must TOPIC: navigation DESCRIPTION: Tabs organize, not fragment a flow.

---

RULE: Use wizard dialogs for creation flows only, not editing flows. TYPE: must TOPIC: components DESCRIPTION: Wizards are for creation.

---

RULE: Perform editing in modal dialogs and reuse the same form patterns across create and edit. TYPE: must TOPIC: forms DESCRIPTION: Edit in modals; share create/edit form patterns.

---

RULE: Open the details panel on table row click; interactive elements inside a row trigger their own action. TYPE: must TOPIC: data-display DESCRIPTION: Row opens details; inner controls act independently.

---

RULE: Show bulk action bars only when at least one item is selected, floating centered at the bottom. TYPE: must TOPIC: components DESCRIPTION: Bulk bar appears on selection, centered bottom.

---

RULE: Use a labeled-row layout to align form inputs. TYPE: should TOPIC: forms DESCRIPTION: Align inputs with labeled rows.

---

RULE: Use radio buttons for fewer than five single-select options and a dropdown for five or more. TYPE: should TOPIC: forms DESCRIPTION: Radios under five options, dropdown otherwise.

---

RULE: Avoid hint text for checkboxes and radios when the label carries the meaning clearly. TYPE: should TOPIC: forms DESCRIPTION: Skip redundant hint text.

---

RULE: Keep visual noise low without reducing usability. TYPE: should TOPIC: complexity DESCRIPTION: Reduce noise, preserve usability.

---

RULE: Keep important actions always visible, optionally dimmed by default and fully visible on hover. TYPE: should TOPIC: interaction DESCRIPTION: Important actions stay visible; may use lower default opacity.

---

RULE: Use one primary button per context and keep secondary actions default unless a risk mood is needed. TYPE: should TOPIC: interaction DESCRIPTION: One primary button per context. EXCEPTION: Use risk mood when needed.

---

RULE: Prefer explicit Cancel plus action buttons in dialogs over close-icon dismissal. TYPE: should TOPIC: components DESCRIPTION: Explicit dialog buttons over close icon.

---

RULE: Use explicit verbs for dialog actions, not Yes/No. TYPE: should TOPIC: microcopy DESCRIPTION: Label dialog buttons like Cancel/Delete.

---

RULE: Default consequential dialogs to modal behavior. TYPE: should TOPIC: components DESCRIPTION: Consequential dialogs are modal.

---

RULE: Use non-modal dialogs only for very low-consequence actions. TYPE: should TOPIC: components DESCRIPTION: Non-modal dialogs are rarely acceptable. EXCEPTION: Only for very low-consequence actions.

---

RULE: Keep passive content non-clickable unless interaction is its clear primary purpose. TYPE: should TOPIC: interaction DESCRIPTION: Don't make passive content clickable.

---

RULE: Tone down secondary information instead of fully hiding it when context is still useful. TYPE: may TOPIC: complexity DESCRIPTION: Dim rather than hide useful secondary info.

---

RULE: Use concise helper text when it prevents errors or removes ambiguity. TYPE: may TOPIC: microcopy DESCRIPTION: Helper text allowed to prevent errors.

---

RULE: Read this document before changing tokens, primitives, patterns, component APIs, reference controls, or page-level UI. TYPE: must TOPIC: system DESCRIPTION: Required reading before any design-system change.

---

RULE: Update the live component reference whenever a public prop, slot, variant, or state changes. TYPE: must TOPIC: components DESCRIPTION: Reference must reflect current public API.

---

RULE: Follow the chain purpose -> role -> information -> component -> token for anything user-facing. TYPE: must TOPIC: system DESCRIPTION: No user-facing work should skip the product chain.

---

RULE: Use the fewest visible elements needed to make the structure understandable. TYPE: should TOPIC: complexity DESCRIPTION: Density is fine; clutter is not.

---

RULE: Redesign UI that is technically correct but mentally awkward to match how the user thinks. TYPE: should TOPIC: layout DESCRIPTION: Structure and grouping should match the user's mental model.

---

RULE: Check for an existing component, pattern, prop, variant, slot, token, or rule before building a custom fix. TYPE: must TOPIC: system DESCRIPTION: System-first; extend the system when it lacks what is needed.

---

RULE: Keep interactive elements looking reachable and keep location, selected, focus, and destructive states obvious. TYPE: must TOPIC: interaction DESCRIPTION: Calm must not hide affordance.

---

RULE: Use foundation palette colors directly only when the hue itself is the user-facing meaning. TYPE: should TOPIC: color DESCRIPTION: Tags, chart series, swatches, or hue-as-data; otherwise use a semantic color. EXCEPTION: When the hue is the user's choice or the data being shown.

---

RULE: Use the mood prop for semantic intent, not decoration. TYPE: must TOPIC: color DESCRIPTION: danger=risk, success=completion, warning=caution, info=neutral information.

---

RULE: Show no more than one primary action in the same area of a page. TYPE: must TOPIC: interaction DESCRIPTION: primary is the single main forward action per area.

---

RULE: Use accent rarely as supporting emphasis with an explicit reason, never as a second primary. TYPE: should TOPIC: color DESCRIPTION: accent is supporting emphasis only.

---

RULE: Reserve emphasis for the strongest contrast moment only. TYPE: should TOPIC: color DESCRIPTION: emphasis is the strongest high-contrast action surface.

---

RULE: Name a semantic-color prop mood, not color. TYPE: must TOPIC: color DESCRIPTION: Options like default/success/warning/danger/info belong to mood.

---

RULE: Use color for a prop only when the hue is the user's choice or the data shown. TYPE: should TOPIC: color DESCRIPTION: Avatars, tags, chart series, color picker swatches.

---

RULE: Use none only when something is absent, and keep default distinct from none. TYPE: must TOPIC: state DESCRIPTION: default means normal non-semantic; none means absent.

---

RULE: Do not stack surfaces to fake depth. TYPE: must TOPIC: surfaces DESCRIPTION: Surface levels mark page-relative position, not elevation.

---

RULE: Give floating elements depth via border and shadow, not a higher surface. TYPE: must TOPIC: surfaces DESCRIPTION: Popovers, dropdowns, dialogs, tooltips use border and shadow.

---

RULE: Start ordinary copy at opacity-high and promote to ink only when the text is what the user should act on. TYPE: should TOPIC: color DESCRIPTION: Default text should not automatically be ink.

---

RULE: Do not use opacity-low for readable text except intentional placeholder ghost content. TYPE: should TOPIC: color DESCRIPTION: opacity-low should almost disappear. EXCEPTION: Placeholder ghost content where legibility is intentionally reduced.

---

RULE: Never let meaning rely on color alone; pair it with label, icon, shape, position, or weight. TYPE: must TOPIC: accessibility DESCRIPTION: Color-only meaning is prohibited.

---

RULE: Use large colored fills carefully because they change the mood of the whole screen. TYPE: should TOPIC: color DESCRIPTION: A large colored area must earn its place.

---

RULE: Write components against semantic tokens so theme changes need no local rewrites. TYPE: must TOPIC: tokens DESCRIPTION: Literal colors make a component not theme-ready.

---

RULE: Follow the 4px factor for spacing and sizing. TYPE: should TOPIC: density DESCRIPTION: Other 4px multiples are allowed for exact geometry. EXCEPTION: Typography is exempt from the 4px factor.

---

RULE: Use 8px for close relationships, 16px for separate groups, and 24px+ only for major page pauses. TYPE: should TOPIC: density DESCRIPTION: Default gap scale by relationship and weight.

---

RULE: Avoid large airy marketing-style gaps in operational screens. TYPE: should TOPIC: density DESCRIPTION: Bigger pauses should clarify the page, not feel like a landing page.

---

RULE: Default controls to size default, not small. TYPE: should TOPIC: components DESCRIPTION: Default size is the product baseline. EXCEPTION: Use small only for genuinely secondary, compact, metadata-like, or densely repeated components.

---

RULE: Use large rarely for deliberately prominent controls, editor surfaces, or roomy inputs. TYPE: should TOPIC: components DESCRIPTION: large carries meaning through larger target or type.

---

RULE: Use icon-only controls at default size unless the surrounding component is explicitly compact or densely repeated. TYPE: should TOPIC: components DESCRIPTION: Includes kebab menus.

---

RULE: Use headings for real hierarchy, not to make text louder, and do not add decorative letter spacing. TYPE: must TOPIC: typography DESCRIPTION: Typography should describe document structure.

---

RULE: Use font-size-body as the default for most component text, not font-size-body-sm. TYPE: should TOPIC: typography DESCRIPTION: body-sm is for labels, helper text, metadata, captions.

---

RULE: Use font-size-body-xs only for badges, shortcut keys, chart ticks, and similar micro-content. TYPE: should TOPIC: typography DESCRIPTION: xs is tiny micro-content only.

---

RULE: Use line-height-body and line-height-small tokens rather than raw line-height values. TYPE: should TOPIC: typography DESCRIPTION: Avoid raw line-heights. EXCEPTION: When the component does precise icon/SVG geometry.

---

RULE: Avoid stacking border, tinted background, nested card, heavy type, and shadow on the same unit. TYPE: should TOPIC: surfaces DESCRIPTION: One thing gets one box; visual weight must earn its place.

---

RULE: Reserve larger soft radii for chips, avatars, and pill buttons; keep general containers disciplined. TYPE: should TOPIC: surfaces DESCRIPTION: Use named radius tokens.

---

RULE: Use shadow only for floating elements or real elevation. TYPE: should TOPIC: surfaces DESCRIPTION: Grounded zones use surface, opacity, spacing, and borders.

---

RULE: Never animate the page out from under the user while they are reading. TYPE: must TOPIC: motion DESCRIPTION: Motion should clarify state change, not everything must animate.

---

RULE: Use system library icons for controls, navigation, state, and scanability instead of one-off page icons. TYPE: must TOPIC: components DESCRIPTION: Do not draw one-off icons when a library icon exists.

---

RULE: Pair a non-obvious icon-only control with a tooltip or accessible label. TYPE: should TOPIC: accessibility DESCRIPTION: Icons should support meaning, not decorate.

---

RULE: Sync the full upstream icon set when updating icons, not only missing files. TYPE: should TOPIC: system DESCRIPTION: Upstream repairs should reach the product too.

---

RULE: Do not hand-edit icon manifest entries that are produced by tooling. TYPE: must TOPIC: tokens DESCRIPTION: The manifest is the lookup surface.

---

RULE: Do not use tooling components in app workflows. TYPE: must TOPIC: components DESCRIPTION: Tooling is framework reference, not product UI. EXCEPTION: When the app itself documents or inspects the design system.

---

RULE: Extend a shared primitive or pattern instead of building a private page-level version. TYPE: must TOPIC: components DESCRIPTION: Consume the shared piece from the page.

---

RULE: Let a component own its template, styles, padding, chrome, state, and rules. TYPE: must TOPIC: components DESCRIPTION: Pages own placement, width, and surrounding gap.

---

RULE: Do not fix component behavior from outside via deep selectors, parent patches, inline styles, duplicated tokens, or specificity fights. TYPE: must TOPIC: consistency DESCRIPTION: Fix behavior at the deepest piece that owns it.

---

RULE: Prefer normal document flow; use absolute positioning and z-index only when layering is genuinely needed. TYPE: should TOPIC: layout DESCRIPTION: Hit area should come from the interactive element's natural box.

---

RULE: Remove conditional content from the DOM when empty. TYPE: must TOPIC: components DESCRIPTION: No empty wrappers, headings, labels, or slots.

---

RULE: Make invalid prop combinations fail clearly in the component instead of rendering broken chrome. TYPE: must TOPIC: components DESCRIPTION: Fail loudly, not quietly broken.

---

RULE: Make two elements that look similar behave similarly. TYPE: must TOPIC: consistency DESCRIPTION: Visual consistency is a behavioral contract.

---

RULE: Define a component's role before its props. TYPE: should TOPIC: components DESCRIPTION: Props expose meaningful variation inside a clear role.

---

RULE: Prefer opinionated components that make the good path obvious and the wrong path hard. TYPE: should TOPIC: components DESCRIPTION: Components need not support every technically possible version.

---

RULE: Make the default state the version that should appear most often, not a maximal demo. TYPE: should TOPIC: components DESCRIPTION: Intrusive components stay rare; quiet ones stay quiet.

---

RULE: Expose every public prop in the workbench, named exactly as in the API, with the right input type. TYPE: must TOPIC: components DESCRIPTION: The workbench is a trust surface.

---

RULE: Keep fake controls, scenario toggles, and non-public helpers out of the workbench right column. TYPE: must TOPIC: components DESCRIPTION: Right column shows only public props.

---

RULE: Use variants to show believable in-context product examples, not just prop permutations. TYPE: should TOPIC: components DESCRIPTION: A good variant teaches when the component is useful.

---

RULE: Write usage guidance from a UX point of view covering when to use, when not, and what misuse harms. TYPE: should TOPIC: components DESCRIPTION: Usage guidance is part of the documentation.

---

RULE: Stress-test edge cases before calling a component done. TYPE: must TOPIC: components DESCRIPTION: Long text, empty/max values, missing props, all moods, all states, narrow widths.

---

RULE: Add a prop only when pages have a real, repeatable need to vary something. TYPE: should TOPIC: components DESCRIPTION: Pages should not decorate components.

---

RULE: Name props after the user-facing concept they control, not the CSS detail. TYPE: must TOPIC: components DESCRIPTION: Prefer mood/density/emphasis over backgroundColor/hasBorder.

---

RULE: Use positive booleans like dismissible, optional, disabled, and loading. TYPE: should TOPIC: components DESCRIPTION: Prop naming convention.

---

RULE: Keep variant and mood separate, with variant for structure and mood for semantic intent. TYPE: must TOPIC: components DESCRIPTION: Do not put mood into variant or structure into mood.

---

RULE: Avoid negated correction props, companion-only booleans, DOM-mechanic output names, and new words for existing concepts. TYPE: should TOPIC: components DESCRIPTION: Such as noBorder, hideLabel, clicked.

---

RULE: Give something with more than two meaningful faces a named option instead of several booleans. TYPE: should TOPIC: components DESCRIPTION: Booleans are true on/off capabilities or states.

---

RULE: Use slots rarely, only when different content truly needs to sit inside the component. TYPE: should TOPIC: components DESCRIPTION: Slots are not for styling freedom and still need limits.

---

RULE: Use the spelling dismissible, not dismissable. TYPE: must TOPIC: components DESCRIPTION: Consistent prop spelling.

---

RULE: Match default prop values to the actual default state shown in the reference. TYPE: must TOPIC: components DESCRIPTION: No-icon default means icon prop none; neutral mood default means mood default.

---

RULE: Account for every state a component can actually reach. TYPE: must TOPIC: state DESCRIPTION: default, hover, focus, active/selected, disabled, loading, empty, success, warning, error.

---

RULE: Put hover effects only on interactive elements. TYPE: must TOPIC: interaction DESCRIPTION: Non-interactive elements should not have hover effects.

---

RULE: Keep actions reachable and explain what is missing rather than stranding the user with a disabled control. TYPE: should TOPIC: state DESCRIPTION: Hide things that are permanently unavailable or irrelevant. EXCEPTION: If something is permanently unavailable or irrelevant, hide it.

---

RULE: Use a spinner for unknown duration, progress for measurable work, and skeletons when content shape is known. TYPE: should TOPIC: feedback DESCRIPTION: Loading should reduce uncertainty; skeletons when content shape is known.

---

RULE: Give empty states a short explanation and a useful next step. TYPE: must TOPIC: state DESCRIPTION: Use the shared empty-state pattern's faces, not local components.

---

RULE: Do not cap authenticated pages with local max-widths; take the full canvas width by default. TYPE: must TOPIC: layout DESCRIPTION: Cap an inner text block only if it needs a readable measure. EXCEPTION: Cap an inner element when a specific text block needs a readable measure.

---

RULE: Do not put custom page padding on each page root. TYPE: must TOPIC: layout DESCRIPTION: Adjust local content layout, not the top-level page rhythm.

---

RULE: Make active navigation state obvious, not merely slightly tinted. TYPE: must TOPIC: navigation DESCRIPTION: Navigation should mirror the user's mental model.

---

RULE: Do not move navigation casually. TYPE: should TOPIC: navigation DESCRIPTION: Users remember positions before labels.

---

RULE: Use breadcrumbs only when the product has real depth, and send Back where the user came from. TYPE: should TOPIC: navigation DESCRIPTION: Not a generic previous-route guess.

---

RULE: Name what happened in one short sentence for success messages. TYPE: should TOPIC: feedback DESCRIPTION: Concise confirmation.

---

RULE: Explain what the user can do next in failure messages. TYPE: must TOPIC: errors DESCRIPTION: Failures should guide the next step.

---

RULE: Interrupt with notifications only when the interruption is earned. TYPE: should TOPIC: feedback DESCRIPTION: Reserve interruptions.

---

RULE: Use banners only for critical messages requiring user action before continuing. TYPE: should TOPIC: feedback DESCRIPTION: Banners block on required action.

---

RULE: Keep operational surfaces concise and keep warmth out of errors. TYPE: should TOPIC: voice DESCRIPTION: Warmth belongs in onboarding, empty states, and sidebar guidance.

---

RULE: Validate on blur, not on every keystroke. TYPE: should TOPIC: validation DESCRIPTION: Reduce noise during typing. EXCEPTION: Unless the control has no meaningful blur moment.

---

RULE: On submit, validate everything and show every error in one pass, scrolling to the first error when needed. TYPE: must TOPIC: validation DESCRIPTION: Single-pass submit validation.

---

RULE: Show field-specific errors at the field, not in a banner. TYPE: must TOPIC: validation DESCRIPTION: Errors live next to their field.

---

RULE: Write errors that guide rather than blame. TYPE: should TOPIC: errors DESCRIPTION: 'Enter a valid email address', not 'Invalid email'.

---

RULE: Remove errors the moment they are no longer true and never reset the form on error. TYPE: must TOPIC: validation DESCRIPTION: Preserve user input on error.

---

RULE: Be forgiving with input formats and convert internally. TYPE: should TOPIC: forms DESCRIPTION: Accept reasonable date, phone, and typed formats.

---

RULE: Use plain sentence case for copy. TYPE: should TOPIC: copy DESCRIPTION: Sentence case throughout.

---

RULE: Name the action in button labels, not the state, avoiding vague labels. TYPE: should TOPIC: microcopy DESCRIPTION: Avoid Confirm, Submit, OK, Yes when the action can be named.

---

RULE: Match button verbs to dialog nouns. TYPE: should TOPIC: microcopy DESCRIPTION: A delete dialog gets 'Delete file', not 'Confirm'.

---

RULE: Use contextual words for missing values: None, Pending, N/A, or a dash. TYPE: should TOPIC: microcopy DESCRIPTION: None=no data, Pending=being collected, N/A=not applicable, '-'=visual placeholder.

---

RULE: Prefer user-facing domain language over implementation names. TYPE: should TOPIC: copy DESCRIPTION: Avoid implementation names in copy.

---

RULE: Make every interactive element keyboard reachable with visible focus. TYPE: must TOPIC: accessibility DESCRIPTION: Keyboard reachability and visible focus are required.

---

RULE: Ensure contrast survives real screens and lighting and encode meaning beyond color. TYPE: must TOPIC: accessibility DESCRIPTION: Perceivable meaning beyond hue.

---

RULE: Show the plain default state first in the component reference and start optional props inactive or empty. TYPE: must TOPIC: components DESCRIPTION: Default-first documentation.

---

RULE: Reveal each prop's type with the matching reference control. TYPE: must TOPIC: components DESCRIPTION: Switches for booleans, text for strings, number fields for numbers, sliders for bounded ranges, button groups for small sets, selects for larger sets.

---

RULE: Remove or deliberately flag reference props that are not represented, rather than keeping technically-possible props. TYPE: should TOPIC: components DESCRIPTION: Reference shows the public API that belongs to the component.

---

RULE: Keep shared workbench controls in the workbench and component-specific controls in the component section. TYPE: must TOPIC: components DESCRIPTION: Preview width, min size, alignment belong to the workbench.

---

RULE: Fix the owning component or token when something looks wrong on the moodboard, not with local styling patches. TYPE: must TOPIC: consistency DESCRIPTION: The moodboard must expose, not hide, component problems.

---

RULE: Prefer clear, simple, intentional UI and language over cleverness, decoration, or exhaustive explanation. TYPE: should TOPIC: complexity DESCRIPTION: Clarity wins over cleverness or decoration.

---

RULE: Explain technical work in plain, human language without jargon or performative technical phrasing. TYPE: should TOPIC: voice DESCRIPTION: Talk to a designer in plain language, not jargon.

---

RULE: Use a casual, smart-coworker tone: short, direct, knowledgeable, and kind. TYPE: should TOPIC: voice DESCRIPTION: Communication tone is concise and friendly.

---

RULE: Ask one tight question at a time when blocked, with a clear recommendation. TYPE: should TOPIC: interaction DESCRIPTION: One focused question with a lean when blocked.

---

RULE: Fix the change at the owning component, helper, assistant, or data source rather than patching the consumer or parent. TYPE: must TOPIC: system DESCRIPTION: Fix root causes at the owning layer, not the consumer. EXCEPTION: Stop and surface when the root cause is off-limits or unclear.

---

RULE: Do not patch the consumer, parent, or surrounding context to hide a problem. TYPE: must TOPIC: system DESCRIPTION: No consumer-side workarounds to mask a root cause.

---

RULE: Grow components with an API that fits their existing naming and behavior, fixing the owning component first if needed. TYPE: should TOPIC: components DESCRIPTION: Extend components cleanly; fix the owner component first.

---

RULE: Search for a built-in, existing primitive, or small local implementation before adding a dependency, and flag new packages before installing them. TYPE: must TOPIC: system DESCRIPTION: Dependencies are architectural; flag before installing.

---

RULE: Avoid hacks, temporary fixes, and local optimizations that create long-term debt. TYPE: must TOPIC: system DESCRIPTION: Quality over speed; no debt-creating shortcuts.

---

RULE: Add comments explaining what and why for non-obvious blocks, magic numbers, browser quirks, conditional classes, and cross-layer behavior. TYPE: should TOPIC: consistency DESCRIPTION: Comment non-obvious code with intent.

---

RULE: Edit in place rather than appending duplicate selectors, props, branches, or functions. TYPE: must TOPIC: consistency DESCRIPTION: No duplicate constructs that work around earlier edits.

---

RULE: Make invalid prop or state combinations fail visibly in a component-scoped way instead of silently rendering broken chrome. TYPE: must TOPIC: errors DESCRIPTION: Invalid combinations fail loudly and locally, not silently.

---

RULE: Before saying done, reread touched files, check for duplicates or dead code, test one adjacent edge case, and confirm the cause was fixed. TYPE: must TOPIC: consistency DESCRIPTION: Verify and clean up before declaring work complete.

---

RULE: Give components a stable layout model first and layer polish on top, not on fragile overlap, magic offsets, or hidden layers. TYPE: should TOPIC: layout DESCRIPTION: Stable layout model first; polish does not depend on fragile tricks.

---

RULE: Build components to absorb future changes in spacing, size, copy length, density, or styling. TYPE: should TOPIC: components DESCRIPTION: Components should adapt to reasonable future design changes.

---

RULE: Use normal document flow first: grid, flex, intrinsic sizing, and component-owned layout. TYPE: should TOPIC: layout DESCRIPTION: Default to normal flow before absolute positioning.

---

RULE: Reach for position:absolute only when an element genuinely needs to leave the flow. TYPE: should TOPIC: layout DESCRIPTION: Absolute positioning only for overlays, anchored, decorative, or a11y-hidden layers. EXCEPTION: Overlays, anchored layers, decorative layers, or visually hidden accessibility helpers.

---

RULE: Use z-index only for real layering, not to make clicks work or force local stacking. TYPE: must TOPIC: layout DESCRIPTION: z-index is for genuine layering only.

---

RULE: Keep visual presentation in stylesheets; let logic only toggle classes and state, not compose inline styles. TYPE: must TOPIC: surfaces DESCRIPTION: Stylesheets own presentation; logic toggles classes.

---

RULE: Let components own padding and containers own gaps, margin, width, and layout. TYPE: must TOPIC: layout DESCRIPTION: Components own inner padding, never outside spacing.

---

RULE: Treat color as paper and ink: surfaces are paper; text, icons, borders, and fills are ink. TYPE: should TOPIC: color DESCRIPTION: Use opacity and semantic weight intentionally on a paper/ink model.

---

RULE: Start visually light and earn every bit of weight, avoiding unnecessary borders, backgrounds, containers, heavier type, and nested boxes. TYPE: should TOPIC: surfaces DESCRIPTION: Default to light; justify added visual weight.

---

RULE: Source motion and elevation from named tokens, not raw durations, easings, or shadow stacks. TYPE: must TOPIC: motion DESCRIPTION: Motion and elevation come from named tokens.

---

RULE: Use value and valueChange for interactive components. TYPE: should TOPIC: components DESCRIPTION: Standard two-way binding prop names. EXCEPTION: Unless there is a stronger existing sibling convention.

---

RULE: Name outputs after user intent such as dismiss, select, submit, or clear, not DOM mechanics like clicked. TYPE: should TOPIC: components DESCRIPTION: Events describe intent, not DOM mechanics.

---

RULE: Use small, default, and large for component sizes; reserve numeric sizes for measurement primitives. TYPE: should TOPIC: components DESCRIPTION: Named t-shirt sizes for components.

---

RULE: Use variant for structural chrome and type for native or functional behavior. TYPE: should TOPIC: components DESCRIPTION: Distinguish variant from type by role.

---

RULE: Use the danger mood for destructive actions instead of a separate destructive vocabulary. TYPE: must TOPIC: components DESCRIPTION: Destructive actions reuse the danger mood.

---

RULE: Do not use placeholders as labels or as pre-filled-looking text; default fields empty with clear labels. TYPE: must TOPIC: forms DESCRIPTION: Placeholders are not labels. EXCEPTION: Unless a placeholder is genuinely needed.

---

RULE: Require friction for destructive actions and make them look dangerous wherever they appear. TYPE: must TOPIC: interaction DESCRIPTION: Destructive actions need friction and danger styling.

---

RULE: Write page and section descriptions as one-liners that state purpose, not implementation or usage instructions. TYPE: should TOPIC: microcopy DESCRIPTION: Descriptions state purpose, not how-to.

---

RULE: Do not rely on native title tooltips to convey meaning. TYPE: must TOPIC: accessibility DESCRIPTION: Native title tooltips must not carry meaning.

---

RULE: Wait for an explicit go-ahead before changing files; exploratory questions are not permission to edit. TYPE: must TOPIC: interaction DESCRIPTION: Don't edit on questions alone; wait for go-ahead.

---

RULE: Push back on code quality, correctness, and maintainability, but defer to the user on visual judgment. TYPE: should TOPIC: voice DESCRIPTION: Challenge code; defer on perceptual calls.

---

RULE: Base all spacing, padding, and sizing on multiples of four pixels. TYPE: must TOPIC: system DESCRIPTION: A 4px base unit governs every non-type dimension so elements align across the product. EXCEPTION: Typography is exempt: type is fitted to feel visually right rather than landing on the 4px grid.

---

RULE: Use sizes from the 4px scale such as 4, 8, 12, 16, 20, 24, and 32. TYPE: should TOPIC: tokens DESCRIPTION: The 4px base divides cleanly into the size steps the product actually uses.

---

RULE: Snap elements onto the 4px grid to keep edges crisp. TYPE: should TOPIC: layout DESCRIPTION: Forcing positions onto the 4px grid avoids sub-pixel fuzziness so lines and surfaces render sharp.

---

RULE: Fit type to look visually correct rather than to a grid line. TYPE: should TOPIC: typography DESCRIPTION: Type does not behave like other elements, so size text to feel right across typefaces instead of snapping it to the grid.

---

RULE: Encode meaning through more than one perceptual channel. TYPE: must TOPIC: accessibility DESCRIPTION: Redundant channels (text, icon, shape, weight) keep meaning intact when one fails for a user.

---

RULE: Make every interactive element reachable from the keyboard. TYPE: must TOPIC: accessibility DESCRIPTION: All links, buttons, and inputs must be operable without a mouse.

---

RULE: Give tab order a logical sequence through links, buttons, and inputs. TYPE: must TOPIC: navigation DESCRIPTION: Tabbing should hit every interactive element in a sensible order.

---

RULE: Show a visible focus indicator on the currently focused element. TYPE: must TOPIC: state DESCRIPTION: A halo or outline must mark which element has keyboard focus.

---

RULE: Choose contrast that survives glare and poor real-world screens. TYPE: must TOPIC: color DESCRIPTION: Contrast must hold up in sunlight, bright cafes, and bad color profiles, not just a dark studio.

---

RULE: Avoid flashing animations that can trigger migraines. TYPE: must TOPIC: motion DESCRIPTION: Flashing motion can harm users; do not use it.

---

RULE: Design for tired, distracted, rushed, and impaired users from the start. TYPE: should TOPIC: accessibility DESCRIPTION: Treat accessibility as part of the core work, not a separate end-stage checklist.

---

RULE: Never let the page itself scroll horizontally. TYPE: must TOPIC: layout DESCRIPTION: Page-level horizontal scroll breaks user expectations and accessibility; the page must never scroll sideways. EXCEPTION: Allowed when the user triggered it themselves (e.g. adding columns to a table that naturally fit) or inside a component clearly meant for horizontal scrolling, like a carousel.

---

RULE: Reflow content to fit within the viewport instead of scrolling sideways. TYPE: must TOPIC: layout DESCRIPTION: WCAG reflow requires content to rearrange within the viewport so users do not scroll horizontally to read it.

---

RULE: Wrap or stack columns when a layout overflows on a normal-sized screen. TYPE: should TOPIC: layout DESCRIPTION: If a layout forces sideways scroll on a normal screen, the layout is wrong; wrap the content or stack the columns instead.

---

RULE: Never bake specific colors into components, screens, or borders. TYPE: must TOPIC: tokens DESCRIPTION: Hard-coded colors force a full rewrite on any rebrand; the system should make a rebrand cost nothing.

---

RULE: Keep components describing only shape and behavior, not appearance. TYPE: must TOPIC: components DESCRIPTION: A button is a button and a card is a card; visual identity must not live in the component.

---

RULE: Pick tokens by what they mean, not by what they look like. TYPE: must TOPIC: tokens DESCRIPTION: Reach for primary because the thing is the signal, success because it is a positive outcome, danger because it signals trouble — not because of a desired hue.

---

RULE: Never start from a color when choosing a token. TYPE: must TOPIC: tokens DESCRIPTION: Semantic tokens hold the system together; ask what the thing means, then pick the role that means that. EXCEPTION: When the color itself is the meaning, reach into the palette directly.

---

RULE: Reach into the palette directly only when the color itself is the meaning. TYPE: may TOPIC: color DESCRIPTION: Chart series legends, status tags where red means critical, and user-picked tag colors communicate with color directly; these cases are rare.

---

RULE: Let themes decide what each semantic role resolves to. TYPE: should TOPIC: system DESCRIPTION: Themes map roles like primary to an actual color so the value can change without the component knowing.

---

RULE: Use surface low, mid, and high to create steps of depth between backgrounds. TYPE: should TOPIC: surfaces DESCRIPTION: Three background levels give the eye a small depth step so it can tell where one thing ends and another begins.

---

RULE: Use ink for foreground content users read, and on-ink when a color sits on top of another color. TYPE: must TOPIC: color DESCRIPTION: On-ink keeps text legible on colored backgrounds; ink alone would shift text dark on a color and become hard to read.

---

RULE: Use high opacity for discreet body text, mid opacity for borders, and low opacity for backgrounds. TYPE: should TOPIC: tokens DESCRIPTION: Opacity tiers carry meaning and let greyscale roles adapt cleanly across light and dark modes.

---

RULE: Reach for the -alt variant only when intentional, not as a default. TYPE: should TOPIC: tokens DESCRIPTION: Use -alt when the base needs more legibility in context or a secondary visual role needs the same family at a different weight. EXCEPTION: Hover and pressed states are a common application of -alt but not its definition.

---

RULE: Use the -opacity variant for soft tints that pick up the background color. TYPE: may TOPIC: tokens DESCRIPTION: The low-opacity variant suits faint alert backgrounds, hover rows, and subtle highlights that tie to the mood without demanding attention.

---

RULE: Use discreet colors to signal that no real choice has been made and a more prominent tier to signal a choice. TYPE: should TOPIC: feedback DESCRIPTION: Opacity-mid/high reads as calm and neutral, ink signals a choice exists, and primary signals movement toward the user's goal.

---

RULE: Keep each component sealed, owning its own template, stylesheet, and rules. TYPE: must TOPIC: components DESCRIPTION: A component owns its template, stylesheet, and class rules; nothing outside reaches in to fix it.

---

RULE: Never fix a component from outside via global rules, inline styles, specificity bumps, or wrappers that mutate internals. TYPE: must TOPIC: components DESCRIPTION: External overrides crack the system and make component behavior untraceable over time.

---

RULE: When a component needs a new ability, expand the piece itself with a new prop, variant, or slot that fits existing logic and naming. TYPE: should TOPIC: components DESCRIPTION: Grow capability inside the sealed component rather than patching it from outside, when there is a viable reason. EXCEPTION: Only expand the piece if there is a viable reason to do so.

---

RULE: A component must not push its neighbors around or use margin to demand surrounding space. TYPE: must TOPIC: layout DESCRIPTION: Margin lets a component decide spacing for layouts it cannot know about, forcing fights from outside.

---

RULE: Use an 8 pixel gap between things that read as text such as labels, paragraphs, and list items. TYPE: should TOPIC: layout DESCRIPTION: 8px is the default container gap for textual elements. EXCEPTION: Anything outside the two default gaps is the exception.

---

RULE: Use a 16 pixel gap between things that take input or carry visual weight such as fields, sections, and blocks of UI. TYPE: should TOPIC: layout DESCRIPTION: 16px is the default container gap for input or weighty UI elements. EXCEPTION: Anything outside the two default gaps is the exception.

---

RULE: Avoid reaching past the 8 and 16 pixel defaults into the rest of the 4 pixel scale unless genuinely needed. TYPE: should TOPIC: layout DESCRIPTION: The 4px scale is available but the two default gaps should cover most cases.

---

RULE: Compose sealed components into patterns, then compose patterns into the product. TYPE: should TOPIC: system DESCRIPTION: The structure is pieces, then patterns, then the whole product.

---

RULE: Make the same action look and behave the same way everywhere in the product. TYPE: must TOPIC: consistency DESCRIPTION: Identical actions must have identical appearance and behavior across all screens.

---

RULE: Keep a destructive action's color and placement identical across every menu. TYPE: must TOPIC: consistency DESCRIPTION: If delete is red and at the bottom in one menu, it must be red and at the bottom in every menu.

---

RULE: Keep interaction behaviors identical across every instance of the same element. TYPE: must TOPIC: interaction DESCRIPTION: If a dropdown closes on outside-click in one place, it must close on outside-click everywhere.

---

RULE: Use consistent menu labels for the same destination. TYPE: must TOPIC: navigation DESCRIPTION: Do not label the same settings page Account in one place and Profile in another, since users will think they are different pages.

---

RULE: Fix shared issues at the source rather than patching screen by screen. TYPE: should TOPIC: system DESCRIPTION: Accessibility, contrast, theme, or standard updates should be fixed once at the source and carried through the product.

---

RULE: If you require an unfamiliar interaction pattern, signpost and guide users through it. TYPE: must TOPIC: navigation DESCRIPTION: When breaking an established expectation, provide clear cues and guidance so users are not left guessing. EXCEPTION: Allowed only when the new pattern is paired with proper signage and guidance.

---

RULE: Avoid all-numeric date formats that can be misread. TYPE: must TOPIC: data-display DESCRIPTION: Formats like "2024-06-05" are ambiguous (June 5 vs May 6) and break user confidence.

---

RULE: Write absolute dates with the month spelled out, as in "6 May 2024". TYPE: should TOPIC: data-display DESCRIPTION: Day, spelled-out month, and year is universal, scannable, and impossible to flip.

---

RULE: Pair absolute dates with a time stamp when switching over from relative. TYPE: should TOPIC: data-display DESCRIPTION: After about seven days, show the absolute date most often with a time stamp for an exact reference.

---

RULE: Always show an absolute date with a time stamp in precision contexts. TYPE: must TOPIC: data-display DESCRIPTION: Logs, reports, and detail panels are read for a moment in time, so never force translation from relative dates. EXCEPTION: Applies specifically to precision-focused contexts like logs, reports, and detail panels.

---

RULE: Accept any reasonable date format the user types into a date input. TYPE: must TOPIC: forms DESCRIPTION: Accept dashes, slashes, dots, and spaces; the product converts the format internally so the user never learns the database format.

---

RULE: Build screens by composing existing components, not by drawing them from scratch. TYPE: must TOPIC: components DESCRIPTION: Assemble screens from reusable pieces (button, card, field, menu) rather than bespoke layouts.

---

RULE: Teach new behavior to the component, not the screen. TYPE: must TOPIC: components DESCRIPTION: When a piece must do something new, extend the component so every screen benefits.

---

RULE: Change a component at its source, never by hand-editing the piece inside a screen. TYPE: must TOPIC: consistency DESCRIPTION: Edits at the source propagate to every screen using the piece.

---

RULE: Keep component naming and props consistent so the same change is made the same way everywhere. TYPE: should TOPIC: consistency DESCRIPTION: Uniform naming/props let any color or value change follow the same pattern across components.

---

RULE: When the system lacks something, extend the system in the same task before continuing the feature. TYPE: must TOPIC: system DESCRIPTION: Stop and add the missing prop, variant, token, or slot now, then use it; do not defer it to a follow-up.

---

RULE: Do not bend a shared piece with inline tweaks or private copies that override it. TYPE: must TOPIC: consistency DESCRIPTION: Inline overrides and private copies break when the original component changes and erode trust.

---

RULE: Keep the same action in the same place with the same word, icon, and color across the product. TYPE: should TOPIC: consistency DESCRIPTION: Stable patterns let users transfer what they learn from one part to the rest.

---

RULE: Build a little ahead when a coming variant or slot is clearly foreseeable. TYPE: may TOPIC: system DESCRIPTION: Adding an anticipated variant or slot now is cheaper than fitting it in later.

---

RULE: Do not write vague messages like "Something went wrong" or "Invalid". TYPE: must TOPIC: copy DESCRIPTION: Generic, non-specific error text fails to tell the user the real problem.

---

RULE: Do not repeat that something went wrong; the red color and icon already say that. TYPE: should TOPIC: errors DESCRIPTION: Visual error signals already communicate failure, so the copy should not waste words restating it.

---

RULE: Do not be cute or use jokes in error messages. TYPE: must TOPIC: voice DESCRIPTION: Errors are a high-stress moment where personality and humor are unwelcome. EXCEPTION: Personality is appropriate in empty states and onboarding, where the user has time and headspace.

---

RULE: Save personality for empty states and onboarding. TYPE: should TOPIC: voice DESCRIPTION: Reserve playful or personable tone for low-pressure contexts where users have time and headspace.

---

RULE: Use the fallback library of pre-written messages when there is no time for custom copy. TYPE: should TOPIC: microcopy DESCRIPTION: A catalog of always-at-least-OK fallback messages prevents vague or sloppy copy from shipping.

---

RULE: Respond visibly and immediately to every user action. TYPE: must TOPIC: feedback DESCRIPTION: The basic interface contract is that the user acts and the product reacts, or the action feels broken.

---

RULE: Change a button's state on click unless the action is very quick. TYPE: should TOPIC: feedback DESCRIPTION: A momentary state change acknowledges the click so users do not think nothing happened. EXCEPTION: Skip when the action completes very quickly.

---

RULE: Acknowledge a form submission with a visible response. TYPE: should TOPIC: feedback DESCRIPTION: Something should confirm the submission was received.

---

RULE: Show a progress indicator or message before the user has time to wonder when triggering a long process. TYPE: should TOPIC: feedback DESCRIPTION: Early feedback on long operations prevents users from imagining failure.

---

RULE: Give loading states context with a label naming what is coming. TYPE: should TOPIC: feedback DESCRIPTION: A descriptive label turns an opaque wait into a clear interlude.

---

RULE: Show progress for multi-step processes, long uploads, and backend jobs. TYPE: should TOPIC: feedback DESCRIPTION: A progress bar, even an imprecise one, reduces anxiety and increases completion.

---

RULE: Acknowledge meaningful moments and milestones the user completes. TYPE: should TOPIC: feedback DESCRIPTION: A small confirmation, animation, or sentence recognizes significant work instead of silently advancing.

---

RULE: Scroll to the first error automatically. TYPE: should TOPIC: feedback DESCRIPTION: After submit, bring the first error into view in case it sits outside the viewport.

---

RULE: Do not disable the submit button. TYPE: should TOPIC: interaction DESCRIPTION: A button that always submits and then shows errors gives feedback and never leaves the user stuck; disabling removes the path forward without explanation. EXCEPTION: Disabling makes sense in rare cases.

---

RULE: Skip filler like "please" and "sorry" in error messages. TYPE: should TOPIC: copy DESCRIPTION: Politeness adds no clarity in validation; be direct and specific. EXCEPTION: Politeness is fine in casual surfaces.

---

RULE: Accept forgiving input formats and convert internally. TYPE: should TOPIC: forms DESCRIPTION: Accept dates with slashes or phone numbers with spaces; let people write naturally instead of matching an arbitrary pattern.

---

RULE: Pair color-based error signals with text or an icon. TYPE: must TOPIC: accessibility DESCRIPTION: A red border alone doesn't reach colorblind users; the user must be able to tell something is wrong.

---

RULE: Never leave an empty field with no indication of its state. TYPE: must TOPIC: feedback DESCRIPTION: Don't leave users guessing whether data failed to load, was forgotten, or is broken.

---

RULE: Show a matching placeholder or loading skeleton instead of a broken-image box for unloaded images. TYPE: should TOPIC: feedback DESCRIPTION: A broken-image icon tells the user nothing useful; use a design-matched placeholder or a skeleton signalling load.

---

RULE: Use 'None' when the field exists but no data has been provided. TYPE: should TOPIC: microcopy DESCRIPTION: Reserve 'None' for an existing field with no provided data.

---

RULE: Use 'Pending' when the system is still gathering data. TYPE: should TOPIC: microcopy DESCRIPTION: Reserve 'Pending' for data still being collected.

---

RULE: Use 'N/A' when the field does not apply in this context. TYPE: should TOPIC: microcopy DESCRIPTION: Reserve 'N/A' for fields that don't apply to the current context.

---

RULE: Use '-' only when a visual placeholder is preferred over a word. TYPE: may TOPIC: microcopy DESCRIPTION: A dash is permitted solely as a visual placeholder in place of a word. EXCEPTION: Only when a visual placeholder is preferred over a word.

---

RULE: Do not let information density drive interface density. TYPE: must TOPIC: density DESCRIPTION: A dense dataset must not translate into a dense interface; the two are unrelated.

---

RULE: Start with the lightest possible frame and confirm the data still reads before adding chrome. TYPE: should TOPIC: complexity DESCRIPTION: Begin lean and only escalate visual weight if the data fails to read without it.

---

RULE: Lean on tokens, the grid, and opacity for hierarchy instead of adding per-field chrome. TYPE: should TOPIC: data-display DESCRIPTION: Let alignment, spacing, and opacity carry hierarchy rather than borders, chips, or icons on every field.

---

RULE: Avoid wrapping every field in its own border, tag, chip, tooltip, or icon. TYPE: should TOPIC: data-display DESCRIPTION: Individually reasonable adornments stack into noise that forces users to fight the chrome to read data.

---

RULE: When you think a design is done, review it and remove what does not need to be there. TYPE: should TOPIC: complexity DESCRIPTION: Do a final subtractive pass asking what can be taken away.

---

RULE: Give motion a clear purpose; do not add it as mere polish. TYPE: must TOPIC: motion DESCRIPTION: Every animation should serve a function, not exist for decoration.

---

RULE: Use motion to clarify what changed, not to draw attention to itself. TYPE: must TOPIC: motion DESCRIPTION: Motion should make a state change legible rather than performative.

---

RULE: Animate transitions for components rather than letting them appear suddenly. TYPE: should TOPIC: motion DESCRIPTION: A component appearing with no transition feels broken.

---

RULE: Keep animations short enough that the interface does not feel heavy. TYPE: should TOPIC: motion DESCRIPTION: Slow animations make a component drag and feel heavy.

---

RULE: Skip animation for simple state changes that can happen instantly. TYPE: should TOPIC: motion DESCRIPTION: A checkbox flipping and similar simple changes can happen instantly without motion. EXCEPTION: Simple state changes like a checkbox flipping may happen instantly.

---

RULE: Contain transitions within bounded areas and keep the rest of the page still. TYPE: should TOPIC: motion DESCRIPTION: Constrain motion to contained regions so surrounding content stays stable.

---

RULE: Ensure users can always tell where they are, how they got here, and how to go back. TYPE: must TOPIC: navigation DESCRIPTION: These three orientation questions must be answerable without effort or the product feels broken.

---

RULE: Structure navigation around the user's mental model, not the company's internal org. TYPE: must TOPIC: navigation DESCRIPTION: Group destinations by how users think about the product rather than internal team ownership.

---

RULE: Rename navigation items when the internal name is confusing. TYPE: should TOPIC: navigation DESCRIPTION: Use labels that match what users expect rather than internal terminology.

---

RULE: Place frequently used destinations within easy reach. TYPE: should TOPIC: navigation DESCRIPTION: Frequency drives placement; daily-use items should not sit several menus deep.

---

RULE: Make the back button return exactly where the user came from. TYPE: must TOPIC: navigation DESCRIPTION: Back should restore the actual origin (search results, prior screen), not a system-guessed generic parent.

---

RULE: Design an in-product way back instead of relying on the browser back button. TYPE: must TOPIC: navigation DESCRIPTION: Browser back is outside your control and varies by platform; provide your own back and treat browser back as fallback.

---

RULE: Make menu labels clearly hint at their contents. TYPE: must TOPIC: microcopy DESCRIPTION: Vague labels like More or Other cause hesitation; specific labels tell users what they will find.

---

RULE: Place primary navigation at the bottom on mobile. TYPE: should TOPIC: navigation DESCRIPTION: Thumbs reach the bottom of a phone more easily, so reachable navigation belongs there rather than the top.

---

RULE: Order information by importance, not by database structure or technical logic. TYPE: must TOPIC: data-display DESCRIPTION: Sequence content by what the user needs first, not by underlying data schema or technical convenience.

---

RULE: Place the most relevant column first in a table. TYPE: should TOPIC: data-display DESCRIPTION: Tables should lead with the column users primarily look for.

---

RULE: Begin a detail view with the key identifier or current state, then supporting data. TYPE: should TOPIC: data-display DESCRIPTION: Detail views should open with the entity's identity or status before secondary details.

---

RULE: Place the primary signal first when one condition would change the user's behavior right now. TYPE: should TOPIC: data-display DESCRIPTION: If a single urgent signal exists, lead the layout with it to drive action. EXCEPTION: If no single signal demands immediate attention, organize information in logical reading order instead.

---

RULE: When no signal demands immediate attention, order content as entity first, then key attributes, then supporting context. TYPE: should TOPIC: data-display DESCRIPTION: Default reading order is subject, then metrics, then metadata like dates.

---

RULE: Place dates and times at the end of a row or view. TYPE: should TOPIC: data-display DESCRIPTION: Dates describe when, not what, so they belong after the user has understood the content.

---

RULE: Use the same order for similar views. TYPE: must TOPIC: consistency DESCRIPTION: Consistent ordering across like views lets users build habits and scan, compare, and act faster.

---

RULE: Reuse existing UI patterns exactly as they are used everywhere else. TYPE: must TOPIC: consistency DESCRIPTION: If a convention exists, use it conventionally rather than inventing or repurposing it.

---

RULE: Use checkboxes for multi-select. TYPE: must TOPIC: forms DESCRIPTION: A checkbox signals the user can pick more than one option.

---

RULE: Use radio buttons for single-select from a short list. TYPE: must TOPIC: forms DESCRIPTION: A radio button signals only one option may be chosen.

---

RULE: Put a control's explanation in its checkbox or radio label rather than hint text when it fits. TYPE: should TOPIC: microcopy DESCRIPTION: Prefer the label for meaning unless it makes the control feel visually heavy. EXCEPTION: Use hint text when it prevents a mistake, explains a consequence, or carries context the label cannot carry cleanly.

---

RULE: Make link-styled text behave like a link. TYPE: must TOPIC: interaction DESCRIPTION: A blue text fragment that looks like a link should act like one.

---

RULE: Make button-styled elements do something when clicked. TYPE: must TOPIC: interaction DESCRIPTION: If something looks like a button, clicking it should produce an action.

---

RULE: Default to the mid surface for almost all content. TYPE: should TOPIC: surfaces DESCRIPTION: Mid is the standard surface where most of the product lives; use it when unsure. EXCEPTION: Use low to recede a region or high to raise a region a step from the page.

---

RULE: Use the low surface sparingly for recessed, quieter regions. TYPE: should TOPIC: surfaces DESCRIPTION: Low sinks a passive area down a step from the page; reserve it for genuinely recessed zones.

---

RULE: Use the high surface rarely, only for self-contained zones like sidebars and navbars. TYPE: should TOPIC: surfaces DESCRIPTION: High raises a region to feel more present than the page; the system reserves it more than it spends it.

---

RULE: Choose surfaces by their role name (low, mid, high), not by literal color or hex. TYPE: must TOPIC: surfaces DESCRIPTION: Names describe position relative to the page; the theme fills in the actual value per mode.

---

RULE: Use opacity to mark hierarchy on the same surface. TYPE: should TOPIC: surfaces DESCRIPTION: Within a single surface, opacity differentiates levels instead of stacked surfaces.

---

RULE: Use borders to define units. TYPE: should TOPIC: surfaces DESCRIPTION: Borders delineate discrete units on a surface.

---

RULE: Use sentence case for all interface text. TYPE: must TOPIC: typography DESCRIPTION: Sentence case is easier to maintain, localize, and reads with less visual noise than title case.

---

RULE: Prefer plain language over fancy phrasing in copy. TYPE: should TOPIC: voice DESCRIPTION: Strip habitual fancy wording; if you can say it shorter and clearer, do.

---

RULE: Write microcopy that is scannable, specific, and clear. TYPE: must TOPIC: copy DESCRIPTION: If users must read twice to understand, they lose trust in the interface.

---

RULE: Keep spelling and grammar correct in all interface text. TYPE: must TOPIC: copy DESCRIPTION: A single error, especially in sensitive contexts like payment forms, makes users question the product's quality and safety.

---

RULE: Give a unit exactly one signal that it is its own piece, not several stacked cues. TYPE: must TOPIC: surfaces DESCRIPTION: One unit gets one boxing signal; don't combine border, tint, nesting, and shadow at once. EXCEPTION: Floating elements (popover, dropdown, dialog) carry both a border and a shadow as coordinated cues.

---

RULE: Do not stack boxes inside boxes. TYPE: must TOPIC: surfaces DESCRIPTION: Nested boxing reads as clutter and destroys visual hierarchy.

---

RULE: Pick the lightest signal that still works to separate a unit. TYPE: should TOPIC: surfaces DESCRIPTION: A single border with no fill is usually enough to mark a unit as its own.

---

RULE: Prefer a plain outline over a background tint to mark a unit as separate. TYPE: should TOPIC: surfaces DESCRIPTION: Use a single border with no fill and let the page underneath do the work, rather than tinting.

---

RULE: Use backgrounds and tints sparingly, not as the default separator. TYPE: should TOPIC: surfaces DESCRIPTION: Reserve faint backgrounds for hover states, alert fills, or a discreet section.

---

RULE: Give floating elements both a border and a shadow. TYPE: should TOPIC: surfaces DESCRIPTION: Popovers, dropdowns, and dialogs use the two coordinated cues to signal they sit above the page. EXCEPTION: This is the explicit exception to the single-signal rule, only for elements that float above the page.

---

RULE: Use a small default radius, around 4 pixels. TYPE: should TOPIC: tokens DESCRIPTION: Default corner radius stays small unless the element is meant to feel soft.

---

RULE: Reserve larger radii for things explicitly meant to feel soft. TYPE: should TOPIC: tokens DESCRIPTION: Bigger radii suit chips, avatars, and pill buttons because radius itself signals what something is.

---

RULE: Make the product behave the way the user expects. TYPE: should TOPIC: trust DESCRIPTION: Predictable behavior is how design protects trust.

---

RULE: Tell the user in advance when the product can't behave as expected. TYPE: should TOPIC: feedback DESCRIPTION: Warn ahead when behavior will diverge from expectation.

---

RULE: Add a confirmation step to destructive actions. TYPE: must TOPIC: interaction DESCRIPTION: Irreversible or hard-to-undo actions need an 'are you sure' step, not one click.

---

RULE: Spell out what a destructive action will and will not do in its confirmation. TYPE: must TOPIC: copy DESCRIPTION: The confirmation must clearly state the consequences.

---

RULE: Make reversible actions easy and irreversible actions deliberately harder. TYPE: must TOPIC: interaction DESCRIPTION: The easy path should be the safe path; the dangerous path should require attention.

---

RULE: Do not give destructive and safe actions the same size and color. TYPE: must TOPIC: interaction DESCRIPTION: A 'delete forever' button matching a 'save changes' button designs for accidents.

---

RULE: Make undo possible wherever you can. TYPE: should TOPIC: interaction DESCRIPTION: Treat mis-clicks as normal recoverable events rather than user fault.

---

RULE: Do not make leaving harder than joining. TYPE: must TOPIC: interaction DESCRIPTION: Unsubscribing, deleting an account, downgrading, or disabling a feature should be as easy as opting in.

---

RULE: Avoid copy that shames the user into staying. TYPE: must TOPIC: microcopy DESCRIPTION: Guilt-trip dismiss labels are dark patterns the user remembers.

---

RULE: Make collected data findable without digging through nested settings. TYPE: should TOPIC: trust DESCRIPTION: Privacy buried deep reads as privacy you're hiding.

---

RULE: State plainly what you collect and why. TYPE: should TOPIC: copy DESCRIPTION: A short plain statement builds more trust than a long unread policy.

---

RULE: Warn the user before they lose unsaved work. TYPE: must TOPIC: feedback DESCRIPTION: Prompt before closing or navigating away from typed or changed content.

---

RULE: Do not override the browser's unsaved-work warning. TYPE: must TOPIC: feedback DESCRIPTION: Let the native tab-close prompt do its job rather than suppressing it.

---

RULE: Let the user inspect, adjust, or undo what the product does for them. TYPE: should TOPIC: state DESCRIPTION: Keep the user feeling in control of automated actions.

---

RULE: Show choices the product makes on the user's behalf. TYPE: should TOPIC: feedback DESCRIPTION: The user should never be surprised by their own product.

---

RULE: Match the voice to what the surface is doing, not to a single product-wide tone. TYPE: must TOPIC: voice DESCRIPTION: Voice is chosen per surface by its job, not picked once and applied everywhere. EXCEPTION: When unsure which voice a surface needs, default to concise.

---

RULE: Use a concise, professional voice for operational surfaces. TYPE: should TOPIC: voice DESCRIPTION: Labels, errors, status, table values, and button text should be concise and professional.

---

RULE: Keep operational copy free of filler, please, apology, and personality. TYPE: must TOPIC: copy DESCRIPTION: Operational text gives just the answer in plain language with no padding.

---

RULE: Warm the voice only on learning surfaces like onboarding, guides, and empty states. TYPE: should TOPIC: voice DESCRIPTION: Surfaces where the user is learning rather than completing a task may use a warmer register.

---

RULE: Keep warmth as warm, kind, and plain without fluff or jokes. TYPE: should TOPIC: voice DESCRIPTION: Warmer copy still avoids filler and jokes about the user's situation.

---

RULE: Decide voice by what the surface is for, not by who is reading. TYPE: must TOPIC: voice DESCRIPTION: The reader is the same across surfaces; the surface's purpose determines the register.

---

RULE: Treat concise as the dominant register and warmth as the exception. TYPE: should TOPIC: voice DESCRIPTION: Concise professional voice is the default; warmth is used sparingly.

---

RULE: Prefer the path that feels natural over the one that is merely logical. TYPE: should TOPIC: interaction DESCRIPTION: When a choice feels natural to a human, treat it as correct even if it is illogical.

---

RULE: Treat your own confusion about the product as a real signal that customers will be more confused. TYPE: must TOPIC: complexity DESCRIPTION: If someone with full internal context finds the product confusing, a customer will too, faster and with less patience.

---

RULE: Carry the product's complexity so users can do their work without feeling stupid, lost, or blamed. TYPE: must TOPIC: complexity DESCRIPTION: Do not offload decoding the system onto the user; the product, not the person, must absorb the complexity.

---

RULE: Account for poor eyesight and varied human contexts when designing. TYPE: should TOPIC: accessibility DESCRIPTION: Ground designs in real human limitations like bad eyesight rather than an idealized user.

---

RULE: Ground design decisions in psychological principles, from elements to colors. TYPE: should TOPIC: system DESCRIPTION: Base the work on psychology and human behavior knowledge rather than guesswork.

---

RULE: Test designs with real humans and pivot based on how they respond. TYPE: should TOPIC: system DESCRIPTION: Use user testing to sharpen and refine work, then adjust if needed.

---

RULE: Use user testing to sharpen expert judgment, not to replace it. TYPE: should TOPIC: system DESCRIPTION: Testing applies expertise; it is not the source of the design decision.

---

RULE: Use contractions like can't, don't, isn't. TYPE: should TOPIC: microcopy DESCRIPTION: Contractions keep the tone natural and human.

---

RULE: End the message with a period. TYPE: must TOPIC: microcopy DESCRIPTION: Every message terminates with a full stop.

---

RULE: Do not start a message with Error:. TYPE: must TOPIC: microcopy DESCRIPTION: The prefix is redundant and feels alarming.

---

RULE: Combine related guidance in one message only while it stays easy to scan. TYPE: should TOPIC: microcopy DESCRIPTION: Merge related hints only when the result remains quick to read.

---

RULE: Keep the message under roughly 80 characters unless the requirement needs more detail. TYPE: should TOPIC: microcopy DESCRIPTION: Stay brief unless the requirement itself demands more length.

---

RULE: Use the field name when possible, like Name, URL, or Password. TYPE: should TOPIC: microcopy DESCRIPTION: Name the actual field instead of generic words like field or value.
