import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'cx-divider',
  template: '',
  styleUrl: './cx-divider.component.scss',
  host: {
    '[class.cx-divider--discreet]': 'discreet',
    '[class.cx-divider--thick]': 'thick',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDividerComponent {
  @Input() discreet = false;
  @Input() thick = false;
}
