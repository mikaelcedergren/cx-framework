# Component rules

Every rule carries its component name so `rg 'COMPONENT: buttons'` returns the applicable rules directly. Exact user-facing wording belongs in `04-copy-and-microcopy.md`.

## Banners

RULE-ID: banners.earned SCOPE: component COMPONENT: banners TYPE: should TOPIC: feedback RULE: Reserve banners for important time-sensitive information. DESCRIPTION: Use quieter inline or page-level treatment when the message does not need broad immediate attention.

RULE-ID: banners.position SCOPE: component COMPONENT: banners TYPE: should TOPIC: layout RULE: Place a banner at the top of the affected surface. DESCRIPTION: Its position should make scope and urgency apparent without covering unrelated navigation.

RULE-ID: banners.no-obstruction SCOPE: component COMPONENT: banners TYPE: must TOPIC: accessibility RULE: Keep banner content from obstructing essential controls or page content. DESCRIPTION: Whether a banner is dismissible must not decide whether important functionality becomes unreachable.

RULE-ID: banners.dismissal SCOPE: component COMPONENT: banners TYPE: should TOPIC: interaction RULE: Let users dismiss transient banners and acknowledge persistent ones. DESCRIPTION: A genuinely unresolved critical state may remain visible, but it still needs a clear action or acknowledgement path.

## Utility bars

RULE-ID: utility-bars.internal-only SCOPE: component COMPONENT: utility-bars TYPE: must TOPIC: components RULE: Use utility bars only for explicit internal prototype, administration, or operator tooling. DESCRIPTION: They must never appear in public-facing interfaces or be visible to ordinary users.

## Buttons

RULE-ID: buttons.primary SCOPE: component COMPONENT: buttons TYPE: should TOPIC: interaction RULE: Reserve primary treatment for the main forward action in one action region. DESCRIPTION: Separate regions may have separate local hierarchies; peer actions in one region must not compete as primary.

RULE-ID: buttons.destructive SCOPE: component COMPONENT: buttons TYPE: must TOPIC: interaction RULE: Give destructive actions treatment and friction proportional to consequence. DESCRIPTION: Irreversible or costly actions need stronger intent than reversible low-risk changes.

RULE-ID: buttons.reachable-validation SCOPE: component COMPONENT: buttons TYPE: should TOPIC: feedback RULE: Keep a button reachable when pressing it is how the user receives recovery guidance. DESCRIPTION: Do not replace useful submit-time validation with an unexplained disabled state.

RULE-ID: buttons.loading SCOPE: component COMPONENT: buttons TYPE: must TOPIC: feedback RULE: Prevent duplicate activation while a button action is processing. DESCRIPTION: Show truthful local progress or activity without changing the action into a fabricated completion state.

RULE-ID: buttons.order SCOPE: component COMPONENT: buttons TYPE: should TOPIC: consistency RULE: Keep repeated action groups in a consistent order. DESCRIPTION: Stable ordering supports scanning and motor memory while allowing locale-aware layout.

## Context menus

RULE-ID: context-menus.relevant SCOPE: component COMPONENT: context-menus TYPE: should TOPIC: state RULE: Show actions relevant to the current object and user. DESCRIPTION: Hide actions that never apply or cannot be influenced in the current context.

RULE-ID: context-menus.temporary SCOPE: component COMPONENT: context-menus TYPE: should TOPIC: state RULE: Disable only temporarily blocked actions the user can understand or resolve. DESCRIPTION: Pair the unavailable state with an explanation when the reason is not obvious.

RULE-ID: context-menus.opposites SCOPE: component COMPONENT: context-menus TYPE: must TOPIC: interaction RULE: Show the next available action for a two-state command. DESCRIPTION: Present Enable when disabled and Disable when enabled rather than showing both with one unavailable.

RULE-ID: context-menus.groups SCOPE: component COMPONENT: context-menus TYPE: should TOPIC: layout RULE: Group related commands and keep separators rare. DESCRIPTION: A separator marks a real conceptual boundary, not every individual item.

RULE-ID: context-menus.destructive-last SCOPE: component COMPONENT: context-menus TYPE: must TOPIC: interaction RULE: Put destructive commands last in a distinct group. DESCRIPTION: Position and danger treatment should make consequence visible before activation.

RULE-ID: context-menus.invocation SCOPE: component COMPONENT: context-menus TYPE: must TOPIC: interaction RULE: Open a context menu without activating its object. DESCRIPTION: Right-click, Menu, and Shift+F10 reveal the same actions without triggering row navigation, selection, or another object command.

## Menus

RULE-ID: menus.declared-meaning SCOPE: component COMPONENT: menus TYPE: must TOPIC: state RULE: Declare whether every menu item is an action or a choice. DESCRIPTION: Actions never acquire selected state; single and multiple choices expose their chosen state with the matching menu semantics.

RULE-ID: menus.real-trigger SCOPE: component COMPONENT: menus TYPE: must TOPIC: accessibility RULE: Put trigger behavior and menu state on the real button. DESCRIPTION: The actual focusable control owns disabled state, popup relationships, activation, and focus restoration rather than a generic wrapper.

## Dialogs

RULE-ID: dialogs.contained-task SCOPE: component COMPONENT: dialogs TYPE: should TOPIC: components RULE: Use a dialog for a contained decision or task that benefits from keeping background context. DESCRIPTION: A large multi-destination workflow belongs on a page rather than inside an oversized interruption.

RULE-ID: dialogs.explicit-outcomes SCOPE: component COMPONENT: dialogs TYPE: must TOPIC: interaction RULE: Provide explicit completion and cancellation paths. DESCRIPTION: The user must understand whether closing applies, discards, or preserves their changes.

RULE-ID: dialogs.dismissal-risk SCOPE: component COMPONENT: dialogs TYPE: should TOPIC: interaction RULE: Match outside-click and Escape dismissal to consequence. DESCRIPTION: Prevent accidental dismissal when work or a consequential decision could be lost; allow it for safe transient dialogs.

RULE-ID: dialogs.focus SCOPE: component COMPONENT: dialogs TYPE: must TOPIC: accessibility RULE: Move focus into an opened modal and return it to the invoking control on close. DESCRIPTION: Modal focus must remain within the active dialog while it is open.

RULE-ID: dialogs.viewport SCOPE: component COMPONENT: dialogs TYPE: must TOPIC: layout RULE: Keep dialog content and actions reachable within the viewport. DESCRIPTION: Preserve edge space and provide an intentional inner scroll region when content is taller than the available area.

## Detail panels

RULE-ID: detail-panels.placement SCOPE: component COMPONENT: detail-panels TYPE: must TOPIC: layout RULE: Declare whether the panel belongs to a positioned content container or the viewport. DESCRIPTION: The detail-panel component owns its overlay position, edge, height, responsive full-screen treatment, and stacking role; consumers provide width and surrounding composition without recreating drawer positioning.

RULE-ID: detail-panels.overlay-ownership SCOPE: component COMPONENT: detail-panels TYPE: must TOPIC: interaction RULE: Let the topmost child overlay handle dismissal before the detail panel. DESCRIPTION: Menus, pickers, popovers, and dialogs opened from the panel own Escape and outside interaction until they close; consumers never inspect child selectors to guard the panel.

## Empty states

RULE-ID: empty-states.whole-region SCOPE: component COMPONENT: empty-states TYPE: must TOPIC: state RULE: Use an empty state only when an expected content region is empty or unavailable. DESCRIPTION: A missing cell or individual value needs an inline state, not a takeover of the whole region.

RULE-ID: empty-states.faces SCOPE: component COMPONENT: empty-states TYPE: should TOPIC: components RULE: Model related empty-region states as faces of one shared component. DESCRIPTION: No data, no results, unavailable, scheduled, success, and failure can share structure while preserving distinct meaning.

RULE-ID: empty-states.recovery SCOPE: component COMPONENT: empty-states TYPE: must TOPIC: feedback RULE: Pair an actionable empty state with the next useful path. DESCRIPTION: Creation, reset, broader search, retry, or waiting guidance should match the real cause of absence.

## Notifications

RULE-ID: notifications.earned SCOPE: component COMPONENT: notifications TYPE: should TOPIC: feedback RULE: Send a notification only when the interruption is worth its attention cost. DESCRIPTION: Prefer a quiet status surface for predictable or non-urgent information.

RULE-ID: notifications.severity SCOPE: component COMPONENT: notifications TYPE: must TOPIC: state RULE: Match notification severity to consequence and required response. DESCRIPTION: Information, success, warning, and error must not be inflated into the same urgency.

RULE-ID: notifications.dismissible SCOPE: component COMPONENT: notifications TYPE: should TOPIC: interaction RULE: Make transient notifications dismissible. DESCRIPTION: An unresolved persistent state may remain, but it needs a direct action, acknowledgement, or explanation of why it cannot disappear.

RULE-ID: notifications.no-repeat SCOPE: component COMPONENT: notifications TYPE: must TOPIC: trust RULE: Do not repeat a dismissed notification unless the underlying state meaningfully changes. DESCRIPTION: A dismissal records that the current instance no longer deserves attention.

RULE-ID: notifications.action SCOPE: component COMPONENT: notifications TYPE: should TOPIC: interaction RULE: Put the required recovery action in or next to the notification. DESCRIPTION: Do not force the user to search the product for the state that interrupted them.

RULE-ID: notifications.actionable-persistent SCOPE: component COMPONENT: notifications TYPE: must TOPIC: accessibility RULE: Keep actionable notifications visible until the user dismisses them. DESCRIPTION: An action must never disappear on a timer while the user is reading or reaching it.

RULE-ID: notifications.timeout SCOPE: component COMPONENT: notifications TYPE: should TOPIC: accessibility RULE: Keep auto-dismissing notifications available long enough to perceive and pause. DESCRIPTION: Pause the exact remaining lifetime while pointer or focus is inside; important information must not vanish before a slow reader or keyboard user can reach it.

## Spinners and progress bars

RULE-ID: progress.unknown SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: should TOPIC: feedback RULE: Use a spinner or activity state when completion cannot be measured. DESCRIPTION: Activity feedback communicates ongoing work without claiming a percentage.

RULE-ID: progress.known SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: must TOPIC: feedback RULE: Use a determinate progress bar only for measured progress toward a known endpoint. DESCRIPTION: The displayed amount must reflect real completed work.

RULE-ID: progress.no-fabrication SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: must TOPIC: trust RULE: Never invent a head start or movement in a determinate progress bar. DESCRIPTION: Perceived speed must not come from false system state; use an indeterminate activity treatment when measurement is unavailable.

RULE-ID: progress.delay SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: should TOPIC: motion RULE: Delay a short-lived spinner enough to avoid flicker. DESCRIPTION: Fast actions may complete through direct state change without flashing an activity indicator.

RULE-ID: progress.location SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: should TOPIC: layout RULE: Put progress near the action or content it explains. DESCRIPTION: The user's attention should not move elsewhere to learn whether local work started.

RULE-ID: progress.skeleton SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: should TOPIC: feedback RULE: Prefer a stable skeleton when the shape of incoming content is known. DESCRIPTION: Skeletons should represent structure, not pretend that data already exists.

RULE-ID: progress.named SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: must TOPIC: accessibility RULE: Give every progress indicator an accessible purpose. DESCRIPTION: A visible label names the indicator; an intentionally label-less indicator needs an explicit accessible name and any visible hint must be associated.

RULE-ID: progress.passive SCOPE: component COMPONENT: spinners-and-progress-bars TYPE: must TOPIC: state RULE: Do not present passive progress as a disabled control. DESCRIPTION: Progress communicates state and has no interaction to disable.

## Steps

RULE-ID: steps.exact-sequence SCOPE: component COMPONENT: steps TYPE: must TOPIC: navigation RULE: Present and index one exact step sequence. DESCRIPTION: The owner derives conditional branches before rendering; the indicator does not hide steps or reinterpret the index against another array.

RULE-ID: steps.accessible-labels SCOPE: component COMPONENT: steps TYPE: must TOPIC: accessibility RULE: Keep every step name and status available when labels are visually suppressed. DESCRIPTION: Compact presentation may hide words from view but never removes current, completed, upcoming, or needs-attention meaning from the accessibility tree.

RULE-ID: steps.passive SCOPE: component COMPONENT: steps TYPE: must TOPIC: state RULE: Do not disable a passive step indicator. DESCRIPTION: A non-interactive progress sequence describes state; it is not an unavailable control.

## Switches

RULE-ID: switches.label SCOPE: component COMPONENT: switches TYPE: must TOPIC: accessibility RULE: Give every switch a persistent label and one combined activation target. DESCRIPTION: The label explains the setting and should activate the same control.

RULE-ID: switches.state SCOPE: component COMPONENT: switches TYPE: must TOPIC: state RULE: Expose the switch's current on or off state semantically and visually. DESCRIPTION: State must remain understandable without relying on color alone.

RULE-ID: switches.effect SCOPE: component COMPONENT: switches TYPE: should TOPIC: feedback RULE: Make it clear whether a switch applies immediately or waits for a separate save. DESCRIPTION: Do not mix both behaviors without visible feedback.

## Tables

RULE-ID: tables.row-navigation SCOPE: component COMPONENT: tables TYPE: may TOPIC: interaction RULE: Let a row open details when the row has a clear navigation affordance. DESCRIPTION: A row is not automatically clickable merely because detail content exists.

RULE-ID: tables.inner-controls SCOPE: component COMPONENT: tables TYPE: must TOPIC: interaction RULE: Keep controls inside a clickable row independent from row navigation. DESCRIPTION: Buttons, links, form fields, editable content, checkboxes, and menus perform their own action without also opening or highlighting the row.

RULE-ID: tables.consequential-actions SCOPE: component COMPONENT: tables TYPE: should TOPIC: interaction RULE: Put destructive or consequential row commands behind an explicit action control. DESCRIPTION: Do not turn a broad row target into a risky command.

RULE-ID: tables.findability SCOPE: component COMPONENT: tables TYPE: should TOPIC: data-display RULE: Give long tables appropriate search, filtering, or query tools. DESCRIPTION: The control set should match how users locate and compare rows.

RULE-ID: tables.sorting SCOPE: component COMPONENT: tables TYPE: should TOPIC: data-display RULE: Make meaningful columns sortable and choose a useful default order. DESCRIPTION: Preserve the user's chosen sort when the surrounding task continues.

RULE-ID: tables.status SCOPE: component COMPONENT: tables TYPE: must TOPIC: state RULE: Make important row state visible at a glance. DESCRIPTION: Do not bury active, failed, scheduled, or archived state only in details.

RULE-ID: tables.pagination SCOPE: component COMPONENT: tables TYPE: should TOPIC: navigation RULE: Use pagination when position and systematic progress matter. DESCRIPTION: Infinite loading is better suited to casual browsing where exact position is unimportant.

RULE-ID: tables.column-input-parity SCOPE: component COMPONENT: tables TYPE: must TOPIC: accessibility RULE: Make column reorder and resize available from pointer and keyboard. DESCRIPTION: Both input paths obey the same bounds, pinned partitions, cancellation, focus, and truthful commit behavior.

## Tabs

RULE-ID: tabs.information SCOPE: component COMPONENT: tabs TYPE: should TOPIC: navigation RULE: Use tabs to switch between peer information views. DESCRIPTION: They preserve context while changing category, perspective, or subsection.

RULE-ID: tabs.task-flow SCOPE: component COMPONENT: tabs TYPE: should TOPIC: forms RULE: Avoid splitting one dependent form or task across tabs. DESCRIPTION: Hidden required fields and errors break the sense of one continuous action. EXCEPT: Tabs may contain independent self-contained forms with no shared validation.

RULE-ID: tabs.state SCOPE: component COMPONENT: tabs TYPE: must TOPIC: accessibility RULE: Expose selected tab, tablist, and panel relationships semantically. DESCRIPTION: Keyboard behavior and focus movement must follow the established tab pattern.

## Tooltips

RULE-ID: tooltips.clarification SCOPE: component COMPONENT: tooltips TYPE: must TOPIC: feedback RULE: Use a tooltip only for brief optional clarification. DESCRIPTION: Core understanding, instructions, and required state must remain available without it.

RULE-ID: tooltips.trigger SCOPE: component COMPONENT: tooltips TYPE: must TOPIC: accessibility RULE: Make tooltip content available from keyboard focus as well as pointer hover. DESCRIPTION: Hover-only information excludes keyboard and touch interaction.

RULE-ID: tooltips.delay SCOPE: component COMPONENT: tooltips TYPE: should TOPIC: interaction RULE: Use a short intentional delay before showing hover-triggered tooltips. DESCRIPTION: Avoid flashing incidental content while the pointer simply crosses the page.

RULE-ID: tooltips.placement SCOPE: component COMPONENT: tooltips TYPE: should TOPIC: layout RULE: Place the tooltip near its trigger without covering the trigger or required content. DESCRIPTION: Placement may adapt to viewport space rather than obey one fixed side.

## Wizard dialogs

RULE-ID: wizard-dialogs.fit SCOPE: component COMPONENT: wizard-dialogs TYPE: should TOPIC: components RULE: Use a wizard for a genuinely sequential multi-step task. DESCRIPTION: Creation is common, but editing may also qualify when later steps depend on earlier decisions; a short independent form does not need a wizard.

RULE-ID: wizard-dialogs.required-only SCOPE: component COMPONENT: wizard-dialogs TYPE: must TOPIC: complexity RULE: Ask only for information required for the current outcome. DESCRIPTION: Optional detail should not become a step merely to fill the sequence.

RULE-ID: wizard-dialogs.relevant-steps SCOPE: component COMPONENT: wizard-dialogs TYPE: should TOPIC: state RULE: Show only steps relevant to the user's choices. DESCRIPTION: The owner derives the exact presented sequence and explicitly remaps the current step when a branch changes; the dialog never searches hidden steps for a replacement.

RULE-ID: wizard-dialogs.progress SCOPE: component COMPONENT: wizard-dialogs TYPE: should TOPIC: navigation RULE: Show current position and remaining shape. DESCRIPTION: Condense the indicator when every step label would no longer fit or help.

RULE-ID: wizard-dialogs.back SCOPE: component COMPONENT: wizard-dialogs TYPE: must TOPIC: navigation RULE: Let users move back without losing entered information. DESCRIPTION: Revisiting an earlier choice must preserve compatible later input and clearly reset data that no longer applies.

RULE-ID: wizard-dialogs.finish SCOPE: component COMPONENT: wizard-dialogs TYPE: must TOPIC: interaction RULE: Make the final step's outcome explicit before commitment. DESCRIPTION: No additional hidden action should occur after the user completes the visible sequence.

RULE-ID: wizard-dialogs.missing-item SCOPE: component COMPONENT: wizard-dialogs TYPE: may TOPIC: navigation RULE: Create a missing required item in a contained nested flow. DESCRIPTION: Return to the same wizard step with the new item available and the prior wizard data intact.
