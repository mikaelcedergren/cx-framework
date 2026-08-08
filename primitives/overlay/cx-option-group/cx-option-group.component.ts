import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxTooltipDirective } from '../cx-tooltip';

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
}
