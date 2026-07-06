import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconComponent } from '../../primitives/media/cx-icon';

export type CxItemCardVariant = 'default' | 'outline' | 'transparent';

/**
 * A horizontal item row: a leading icon, a title and description, and a trailing
 * slot for one control (a switch, button, or select). Use it for settings rows,
 * device lists, and similar "label + action" collections. The trailing control
 * is projected and keeps its own behaviour; the card only owns the layout.
 */
@Component({
  selector: 'cx-item-card',
  imports: [CxIconComponent],
  templateUrl: './cx-item-card.component.html',
  styleUrl: './cx-item-card.component.scss',
  host: {
    '[class.cx-item-card-host--outline]': "variant === 'outline'",
    '[class.cx-item-card-host--transparent]': "variant === 'transparent'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxItemCardComponent {
  @Input() heading = '';
  @Input() description: string | undefined;
  @Input() icon: CxIconName | undefined;
  @Input() variant: CxItemCardVariant = 'default';

  protected get hasDescription(): boolean {
    return Boolean(this.description?.trim());
  }
}
