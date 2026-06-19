import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxCardSize = 'default' | 'legacy' | 'small' | 'medium';
export type CxCardMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cx-card',
  imports: [CxIconComponent],
  templateUrl: './cx-card.component.html',
  styleUrl: './cx-card.component.scss',
  host: {
    '[class.cx-card-host--legacy]': 'size === "legacy"',
    '[class.cx-card-host--small]': 'size === "small"',
    '[class.cx-card-host--medium]': 'size === "medium"',
    '[class.cx-card-host--mood-primary]': 'mood === "primary"',
    '[class.cx-card-host--mood-accent]': 'mood === "accent"',
    '[class.cx-card-host--mood-info]': 'mood === "info"',
    '[class.cx-card-host--mood-success]': 'mood === "success"',
    '[class.cx-card-host--mood-warning]': 'mood === "warning"',
    '[class.cx-card-host--mood-danger]': 'mood === "danger"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCardComponent {
  @Input() size: CxCardSize = 'default';
  @Input() mood: CxCardMood = 'default';
  @Input() heading: string | undefined;
  @Input() icon: CxIconName | undefined;

  protected hasHeading(): boolean {
    return !!this.heading?.trim();
  }
}
