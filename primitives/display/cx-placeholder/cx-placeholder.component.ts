import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxPlaceholderSize = 'small' | 'default' | 'large';

@Component({
  selector: 'cx-placeholder',
  templateUrl: './cx-placeholder.component.html',
  styleUrl: './cx-placeholder.component.scss',
  host: {
    '[class.cx-placeholder-host--small]': 'size === "small"',
    '[class.cx-placeholder-host--large]': 'size === "large"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPlaceholderComponent {
  @Input() text = 'Design placeholder';
  @Input() size: CxPlaceholderSize = 'default';

  protected visibleText$(): string {
    return this.text.trim();
  }

}
