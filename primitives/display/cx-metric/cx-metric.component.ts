import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxMetricSize = 'small' | 'default' | 'large';

@Component({
  selector: 'cx-metric',
  templateUrl: './cx-metric.component.html',
  styleUrl: './cx-metric.component.scss',
  host: {
    '[class.cx-metric--small]': 'size === "small"',
    '[class.cx-metric--default]': 'size === "default"',
    '[class.cx-metric--large]': 'size === "large"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMetricComponent {
  @Input() label = 'Metric';
  @Input() value = '0';
  @Input() size: CxMetricSize = 'default';
}
