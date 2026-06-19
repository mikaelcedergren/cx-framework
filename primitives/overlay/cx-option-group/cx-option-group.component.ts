import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxOptionGroupVariant = 'label' | 'header';

@Component({
  selector: 'cx-option-group',
  templateUrl: './cx-option-group.component.html',
  styleUrl: './cx-option-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxOptionGroupComponent {
  @Input() label = 'Type something';
  @Input() description: string | undefined;
  @Input() variant: CxOptionGroupVariant = 'label';
}
