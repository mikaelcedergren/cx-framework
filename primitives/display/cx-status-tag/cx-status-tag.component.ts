import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxStatusTagMood = 'default' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cx-status-tag',
  imports: [CxIconComponent],
  templateUrl: './cx-status-tag.component.html',
  styleUrl: './cx-status-tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStatusTagComponent {
  @Input() mood: CxStatusTagMood = 'default';
  @Input() text = 'Status';
  @Input() icon: CxIconName | undefined;

  protected iconName(): CxIconName {
    if (this.icon) {
      return this.icon;
    }
    switch (this.mood) {
      case 'info':
        return 'info';
      case 'success':
        return 'resolved';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'ban';
      case 'default':
      default:
        return 'pending';
    }
  }
}
