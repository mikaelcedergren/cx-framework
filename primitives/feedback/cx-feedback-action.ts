import { type CxButtonMood } from '../actions/cx-button';
import { type CxIconName } from '../../icons/manifest';

export interface CxFeedbackAction {
  readonly text: string;
  readonly mood?: CxButtonMood;
  readonly icon?: CxIconName;
  readonly appendIcon?: CxIconName;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly ariaLabel?: string;
  readonly transparent?: boolean;
}

/** An action renders only when a person can perceive it; otherwise it vanishes. */
export function visibleCxFeedbackAction<T extends CxFeedbackAction>(action: T | undefined): T | undefined {
  return action && Boolean(action.text?.trim() || action.icon || action.appendIcon) ? action : undefined;
}
