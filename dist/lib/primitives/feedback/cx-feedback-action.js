/** An action renders only when a person can perceive it; otherwise it vanishes. */
export function visibleCxFeedbackAction(action) {
    return action && Boolean(action.text?.trim() || action.icon || action.appendIcon) ? action : undefined;
}
