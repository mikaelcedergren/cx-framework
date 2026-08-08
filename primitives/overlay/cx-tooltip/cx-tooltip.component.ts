import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import {
  CxTooltipDirective,
  type CxTooltipDelay,
  type CxTooltipPosition,
} from './cx-tooltip.directive';

/**
 * Composition sugar for templates that need to wrap projected content.
 * Prefer attaching `cxTooltip` directly to the native trigger when possible.
 */
@Component({
  selector: 'cx-tooltip',
  imports: [CxTooltipDirective],
  templateUrl: './cx-tooltip.component.html',
  styleUrl: './cx-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTooltipComponent {
  readonly text = input<string | undefined>(undefined);
  readonly delay = input<CxTooltipDelay>('default');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly position = input<CxTooltipPosition>('top');
  readonly onlyWhenTruncated = input(false, { transform: booleanAttribute });
}
