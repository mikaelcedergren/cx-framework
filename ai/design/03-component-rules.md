# Component rules

COMPONENT: banners

RULE: Reserve banners for critical messages the user must act on or for very important communication. TYPE: must TOPIC: feedback DESCRIPTION: Banners are intrusive and cover navigation, so they are only justified for critical, must-act-on or very important messages.
RULE: Position banners at the top of the viewport. TYPE: must TOPIC: layout DESCRIPTION: A banner is always placed at the top of the screen.
RULE: Make non-dismissable banners push the page content down rather than overlay it. TYPE: must TOPIC: layout DESCRIPTION: Non-dismissable banners are meant to be intrusive and must not shut out functionality, so they push content down.
RULE: Make dismissable banners overlay the content so the user must dismiss them to proceed. TYPE: must TOPIC: interaction DESCRIPTION: Dismissable banners overlay content so the user notices the information and dismisses it before continuing.
COMPONENT: buttons

RULE: Label a button with the action it performs, not the current state. TYPE: must TOPIC: microcopy DESCRIPTION: A button names what it does (play/pause), while state is shown elsewhere.
RULE: Always name the object of the action in button copy, not just the verb. TYPE: must TOPIC: microcopy DESCRIPTION: Use 'Delete file' or 'Send invitation' instead of vague 'Confirm' or 'Submit'.
RULE: Reserve the primary button style for the single action that moves the user forward. TYPE: should TOPIC: interaction DESCRIPTION: Most buttons sit at default or secondary level; primary marks the one forward action.
RULE: Avoid more than one primary button in the same area. TYPE: should TOPIC: interaction DESCRIPTION: Two primaries compete for attention and force the user to read both.
RULE: Add a confirmation step before destructive, irreversible actions. TYPE: must TOPIC: interaction DESCRIPTION: Delete, remove, or cancel-subscription need an 'are you sure' step, not one-click.
RULE: Use a clear, named action button on confirmation dialogs instead of an ambiguous label. TYPE: must TOPIC: microcopy DESCRIPTION: Use 'Delete file' on the dialog rather than 'OK'.
RULE: Keep buttons enabled and reveal what is missing on click rather than disabling them. TYPE: should TOPIC: feedback DESCRIPTION: A greyed-out button without explanation confuses; clicking gives guidance when needed.
RULE: Give immediate feedback when a button triggers a long process. TYPE: must TOPIC: feedback DESCRIPTION: A button state change or spinner stops users from clicking again or losing confidence.
RULE: Follow a consistent order for a row of buttons. TYPE: should TOPIC: consistency DESCRIPTION: Consistent ordering builds muscle memory and avoids a chaotic feel.
RULE: Place the primary action on the right and cancel or secondary on the left in western contexts. TYPE: should TOPIC: layout DESCRIPTION: Matches western reading conventions and user muscle memory.
COMPONENT: context-menus

RULE: Show only actions the user can actually perform right now. TYPE: must TOPIC: state DESCRIPTION: Keep the menu honest about what is possible at the current moment.
RULE: When an action has an opposite, show only the state not currently set. TYPE: must TOPIC: state DESCRIPTION: If something is enabled show Disable; if disabled show Enable.
RULE: Do not show both opposing actions with one greyed out. TYPE: must TOPIC: state DESCRIPTION: Present the next state as a single clickable verb that switches it over.
RULE: Hide an action when the user cannot influence why it is unavailable. TYPE: must TOPIC: state DESCRIPTION: No permission ever, action does not apply, or required relationship does not exist.
RULE: Disable an action when it is normally available but temporarily blocked by something the user can fix. TYPE: must TOPIC: state DESCRIPTION: Missing permission now, data loading, or another process in progress lets the user imagine resolving it.
RULE: Group related actions together. TYPE: must TOPIC: layout DESCRIPTION: Status changes, administrative actions, and reporting each belong with their own kind.
RULE: Reserve separators for boundaries between groups and keep them rare. TYPE: must TOPIC: layout DESCRIPTION: Too many separators turn the menu into single-item groups, equivalent to none.
RULE: Place destructive actions at the bottom of the menu in their own cluster. TYPE: must TOPIC: layout DESCRIPTION: Putting Delete, Remove, Discard last gives a moment to register irreversibility.
RULE: Color destructive actions red. TYPE: must TOPIC: color DESCRIPTION: Red signals the consequence before the user clicks.
COMPONENT: dialogs

RULE: Reserve dialogs for moments needing the user's full attention, like editing, adding, or confirming. TYPE: should TOPIC: components DESCRIPTION: Dialogs interrupt, so use them only when the task genuinely demands focus.
RULE: Use dialogs only for contained tasks the user can complete without losing background context. TYPE: should TOPIC: components DESCRIPTION: A dialog should let the user decide and return to the same page they were on.
RULE: Write the dialog message as a statement tied to the action button, not as a question. TYPE: should TOPIC: copy DESCRIPTION: Use "Archive project" rather than "Are you sure you want to archive this project?"
RULE: Make the primary action read as a continuation of the title, not an answer to it. TYPE: should TOPIC: copy DESCRIPTION: The title and primary button should form a coherent action statement.
RULE: Use clear, opposing button labels like "Cancel" and "Archive." TYPE: should TOPIC: microcopy DESCRIPTION: Distinct labels make each outcome unambiguous.
RULE: Avoid generic "Yes" and "No" button labels. TYPE: should TOPIC: microcopy DESCRIPTION: Generic affirmatives don't communicate the action's outcome.
RULE: Rarely include a close icon in the top right of a dialog. TYPE: should TOPIC: components DESCRIPTION: Closing should happen through explicit confirm or cancel actions, not an ambiguous X.
RULE: Provide closing through explicit confirm or cancel actions with defined outcomes. TYPE: should TOPIC: interaction DESCRIPTION: Two clear choices prevent uncertainty about whether changes were saved.
RULE: Default to modal behavior so the user must act before returning to the page. TYPE: should TOPIC: interaction DESCRIPTION: The right call when the dialog represents a decision that needs to be made.
RULE: Prevent dismissing a modal dialog by clicking outside it. TYPE: should TOPIC: interaction DESCRIPTION: The user has to act on the dialog before going back to the page.
RULE: Keep enough margin from the browser edges so the dialog feels balanced and centered. TYPE: should TOPIC: layout DESCRIPTION: Margin signals it is a dialog and not a whole new page.
RULE: Never let a dialog feel cramped against the viewport edge. TYPE: must TOPIC: layout DESCRIPTION: A dialog jammed against the edge feels rushed and can be confused with a new page.
COMPONENT: empty-states

RULE: Treat loading, success, scheduled, danger, and no-data empty states as faces of one component, not separate components. TYPE: must TOPIC: components DESCRIPTION: A single empty-state component takes different faces per situation so copy, spacing, and icons stay aligned.
RULE: When a search returns nothing, explain what wasn't found and give the user a way forward. TYPE: should TOPIC: feedback DESCRIPTION: Suggest broadening the query, removing a filter, or checking spelling instead of leaving the user stuck.
RULE: Avoid a bare 'No results' message that leaves the user stuck. TYPE: should TOPIC: copy DESCRIPTION: The system knows the query, so it can suggest the next move rather than stating only that nothing was found.
RULE: Make first-impression empty states welcoming and clear. TYPE: should TOPIC: copy DESCRIPTION: New-user empty states form fast first impressions, so turn 'what now?' into clear guidance instead of looking cold or broken.
RULE: Use the empty state only when a whole zone of expected content is missing or unavailable. TYPE: must TOPIC: state DESCRIPTION: A single missing cell or row is an inline problem; the empty state takes over only when the whole area is the question.
RULE: Give every empty state a short explanation and a clear next step. TYPE: must TOPIC: copy DESCRIPTION: Say why it's empty, then tell the user what they can do about it.
COMPONENT: notifications

RULE: Send a notification only when it earns the interruption. TYPE: must TOPIC: system DESCRIPTION: Only notify when the user actually needs to act soon on something unpredictable, since attention is finite.
RULE: Do not mark everything as urgent. TYPE: must TOPIC: feedback DESCRIPTION: If everything is urgent nothing feels urgent, causing alert fatigue that buries the one notification that matters.
RULE: Differentiate notification types with distinct visual treatments. TYPE: must TOPIC: feedback DESCRIPTION: Information, warning, success, and error must not look identical so the user knows urgency before reading.
RULE: Use information for things the user might want to know. TYPE: should TOPIC: feedback DESCRIPTION: Information type is for awareness, not action.
RULE: Use warning for things the user should look at. TYPE: should TOPIC: feedback DESCRIPTION: Warning type flags something worth the user's attention.
RULE: Use error for things that need action. TYPE: should TOPIC: errors DESCRIPTION: Error type signals the user must do something.
RULE: Keep success notifications brief. TYPE: should TOPIC: feedback DESCRIPTION: Success is a short confirmation, not a lingering message.
RULE: Make every notification dismissible. TYPE: must TOPIC: interaction DESCRIPTION: An undismissable notification offloads the product's problem onto the user; even system-wide messages need an acknowledge action.
RULE: Do not repeat a notification the user has already seen and dismissed. TYPE: must TOPIC: feedback DESCRIPTION: A dismissal is the signal the user does not need it again; re-pinging is harassment.
RULE: Make the required action reachable from the notification itself. TYPE: must TOPIC: interaction DESCRIPTION: Don't force the user to navigate to find the thing; faster resolution lowers the notification's cost.
RULE: Time an auto-dismissing notification to stay long enough to read but short enough not to overstay. TYPE: should TOPIC: motion DESCRIPTION: A toast that vanishes in two seconds is unread; one lingering ten seconds overstays its welcome.
COMPONENT: spinners-&-progress-bars

RULE: Use a spinner when progress cannot be measured. TYPE: should TOPIC: feedback DESCRIPTION: Spinners indicate ongoing activity without a known duration.
RULE: Use a progress bar when the endpoint is known. TYPE: should TOPIC: feedback DESCRIPTION: Progress bars communicate how much work remains when the duration can be measured.
RULE: Delay showing a spinner by around 300 milliseconds. TYPE: should TOPIC: motion DESCRIPTION: A short delay avoids flicker during very quick actions.
RULE: Keep the spinner visible just long enough to make the end transition feel smooth. TYPE: should TOPIC: motion DESCRIPTION: A brief hold on completion smooths the visual transition.
RULE: Place a spinner near where the user's attention already is. TYPE: must TOPIC: layout DESCRIPTION: Position spinners inside the pressed button, beside loading content, or at the head of the incoming section.
RULE: Give a spinner a label when you can. TYPE: should TOPIC: copy DESCRIPTION: A label tells the user what is happening and makes the wait feel intentional; the longer the wait, the more important the label.
RULE: Start a progress bar with a few percent already filled. TYPE: should TOPIC: motion DESCRIPTION: The endowed progress effect makes users more likely to finish when they feel they have already begun.
RULE: Keep progress bars moving subtly rather than still. TYPE: should TOPIC: motion DESCRIPTION: Motion reads as alive and keeps users calm; stillness feels wrong.
RULE: Shape progress motion as a small head start, most movement in the middle, and a quick finish. TYPE: should TOPIC: motion DESCRIPTION: This rhythm feels natural and makes the process seem faster than it is.
RULE: Prefer skeleton screens over spinners when loading content rather than processes. TYPE: should TOPIC: feedback DESCRIPTION: Placeholder shapes showing eventual structure feel faster than a spinner on a blank page.
COMPONENT: switches

RULE: Always give a switch a label to its right explaining exactly what it does. TYPE: must TOPIC: forms DESCRIPTION: Each switch needs a right-side label that states the precise action it controls.
RULE: In a horizontal layout, use the left label for grouping and the right label to explain the switch. TYPE: should TOPIC: layout DESCRIPTION: The left label names the group while the right label clarifies the individual switch's purpose.
COMPONENT: tables

RULE: Make tables non-interactive unless the action is behind friction. TYPE: must TOPIC: interaction DESCRIPTION: Avoid direct clickable actions in table rows to prevent unintentional actions.
RULE: Place destructive or consequential row actions behind a sub-menu or deliberate gesture. TYPE: should TOPIC: interaction DESCRIPTION: Routing actions through a sub-menu makes them intentional and reduces misclicks.
RULE: Give long lists a way to search or filter them. TYPE: should TOPIC: data-display DESCRIPTION: Searching or filtering helps users find what they need instead of scrolling hundreds of rows.
RULE: Make columns sortable when the order matters. TYPE: should TOPIC: data-display DESCRIPTION: Let users sort by relevant fields like names, dates, or severities.
RULE: Set the default sort order to whatever makes sense for the page. TYPE: should TOPIC: data-display DESCRIPTION: Use a sensible default like most recent or highest severity first, while letting the user override it.
RULE: Show row status at a glance with a clear visual marker. TYPE: must TOPIC: state DESCRIPTION: States like active, archived, scheduled, or failed should be visible in the row, not buried in a detail view.
RULE: Use pagination when the user needs to track position or work through the list systematically. TYPE: should TOPIC: navigation DESCRIPTION: Pagination suits tables where users return to a specific spot or process the list methodically.
RULE: Use infinite scroll for casual browsing where the user stops once they find one thing. TYPE: may TOPIC: navigation DESCRIPTION: Infinite scroll fits exploratory browsing rather than systematic work.
RULE: Make clickable elements look clickable. TYPE: must TOPIC: interaction DESCRIPTION: Use underline, color, or hover states so interactive elements are recognizable.
RULE: Do not make non-interactive elements look clickable. TYPE: must TOPIC: interaction DESCRIPTION: Elements that look clickable but do nothing erode trust when users try them and nothing happens.
COMPONENT: tabs

RULE: Use tabs for navigating and browsing information, not for completing tasks. TYPE: should TOPIC: navigation DESCRIPTION: Tabs suit exploring or comparing content, not finishing a task.
RULE: Avoid tabs when users are creating or editing content. TYPE: should TOPIC: forms DESCRIPTION: Important fields or errors can be hidden on another tab, breaking the sense of one continuous action.
RULE: Use tabs to split large content into simple browseable categories that preserve context. TYPE: should TOPIC: data-display DESCRIPTION: Tabs help users move between informational sections quickly without losing their place.
RULE: Only use tabs inside a form when each tab is a distinct, self-contained form that shares no validation with the others. TYPE: should TOPIC: forms DESCRIPTION: Editing in tabs is acceptable only when tabs do not share validation, avoiding hidden errors.
COMPONENT: tooltips

RULE: Keep tooltip content to brief clarification, not detailed information. TYPE: must TOPIC: copy DESCRIPTION: Tooltips give a short hint about an element, not detailed content.
RULE: Show the tooltip after a short pause, not the instant the user hovers. TYPE: must TOPIC: interaction DESCRIPTION: A delay before appearing confirms the user actually wants the explanation.
RULE: Use a hover delay of around one second before showing the tooltip. TYPE: should TOPIC: interaction DESCRIPTION: About a second is the typical pause that confirms intent.
RULE: Do not put long descriptions, instructions, data, or documentation-like text in a tooltip. TYPE: must TOPIC: copy DESCRIPTION: Tooltips are for quick hints, not documentation-length content.
RULE: Move information that needs more space than a quick hint into a detail panel, sidebar, or standard in-context text. TYPE: should TOPIC: layout DESCRIPTION: Content too large for a tooltip belongs in a larger surface.
RULE: Position the tooltip close to the element it explains, not somewhere random on screen. TYPE: must TOPIC: layout DESCRIPTION: Keeping the tip near the element avoids forcing the eye to move away and back.
RULE: Default the tooltip position to just above or below the element. TYPE: should TOPIC: layout DESCRIPTION: Above or below is the usual default placement.
RULE: Offset the tooltip enough that the cursor does not cover the text. TYPE: should TOPIC: layout DESCRIPTION: Enough offset keeps the tip readable past the cursor.
RULE: Limit tooltip copy to one or two sentences confirming what the element does. TYPE: should TOPIC: copy DESCRIPTION: A tooltip confirms an element's purpose in one or two sentences.
COMPONENT: wizard-dialogs

RULE: Use a wizard only for creating something new. TYPE: must TOPIC: components DESCRIPTION: Editing, managing, or single configuration tasks are dialogs, not wizards.
RULE: Collect only what is needed to complete the setup. TYPE: must TOPIC: complexity DESCRIPTION: A wizard gathers exactly the required inputs, nothing more.
RULE: Leave no hidden actions after the final step. TYPE: must TOPIC: trust DESCRIPTION: Each step leads toward a clear, complete result with nothing concealed after Finish.
RULE: Split long forms into a series of short, focused steps. TYPE: should TOPIC: complexity DESCRIPTION: People perceive several short forms as easier than one long form with identical total work.
RULE: Show a progress indicator so users know where they are. TYPE: should TOPIC: navigation DESCRIPTION: Knowing position in the process reduces anxiety and helps users see how close they are to the end.
RULE: Show only the steps relevant to the user's choices. TYPE: should TOPIC: state DESCRIPTION: The wizard is dynamic and adapts to the user's input.
RULE: Never expose branching logic or decision trees. TYPE: must TOPIC: navigation DESCRIPTION: The user should always feel they follow one clear, uninterrupted path even as the system adapts.
RULE: Make each step self-contained. TYPE: must TOPIC: layout DESCRIPTION: The user should not need to remember information from earlier steps to complete the current one.
RULE: Condense the progress indicator when a wizard has more than seven steps. TYPE: should TOPIC: navigation DESCRIPTION: The condensed indicator fits the layout for wizards over seven steps.
RULE: Keep step labels short and direct. TYPE: should TOPIC: microcopy DESCRIPTION: Labels are made for quick recognition rather than explanation.
RULE: Open a dedicated dialog to create a missing required item without breaking flow. TYPE: should TOPIC: navigation DESCRIPTION: When a step needs an entity that does not exist yet, a dialog creates it, then closes and returns to the wizard with the new item available.
RULE: Reuse the same form components in wizards and edit dialogs. TYPE: should TOPIC: consistency DESCRIPTION: Identical form components, interaction, and behavior appear in both wrappers.
RULE: Show Cancel and Continue on the first step. TYPE: must TOPIC: navigation DESCRIPTION: The first step focuses on safe entry: exit or begin without risk.
RULE: Show Back and Continue on middle steps. TYPE: must TOPIC: navigation DESCRIPTION: Users move freely between steps without losing data.
RULE: Show Back and Finish on the last step. TYPE: must TOPIC: navigation DESCRIPTION: Finish applies the result and ends the process.
RULE: Adapt the Finish label to the context. TYPE: should TOPIC: microcopy DESCRIPTION: Use contextual labels like 'Create schedule' or 'Start scan'.
RULE: Group default values in a dedicated box inside the wizard. TYPE: should TOPIC: layout DESCRIPTION: A dedicated box signals defaults belong to their own configuration layer.
RULE: Open a separate dialog to edit defaults. TYPE: should TOPIC: navigation DESCRIPTION: The deliberate distance communicates that the user probably does not need to touch these.
RULE: Do not move something to defaults just because it is optional. TYPE: must TOPIC: complexity DESCRIPTION: Optional and default are not the same thing.
