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
