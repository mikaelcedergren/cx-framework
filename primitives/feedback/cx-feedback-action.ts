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

/** An action renders only when it has visible text; otherwise it vanishes. */
export function visibleCxFeedbackAction<T extends CxFeedbackAction>(action: T | undefined): T | undefined {
  return action?.text.trim() ? action : undefined;
}
