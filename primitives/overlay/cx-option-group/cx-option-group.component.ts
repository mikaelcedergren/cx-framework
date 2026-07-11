import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'cx-option-group',
  templateUrl: './cx-option-group.component.html',
  styleUrl: './cx-option-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxOptionGroupComponent {
  @Input() label = 'Group';
  @Input() description: string | undefined;
}
