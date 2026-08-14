import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxTooltipDirective } from '../cx-tooltip';

export type CxOptionGroupVariant = 'group' | 'heading';

@Component({
  selector: 'cx-option-group',
  imports: [CxTooltipDirective],
  templateUrl: './cx-option-group.component.html',
  styleUrl: './cx-option-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxOptionGroupComponent {
  @Input() label = 'Group';
  @Input() description: string | undefined;
  /**
   * `group` is the quiet label that divides a list of options. `heading` names
   * a whole surface and reads as its title, so it carries full ink and weight.
   */
  @Input() variant: CxOptionGroupVariant = 'group';
}
