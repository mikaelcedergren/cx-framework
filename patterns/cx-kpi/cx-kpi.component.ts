import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxMetricComponent } from '../../primitives/display/cx-metric';
import { CxTrendTagComponent, type CxTrendTagFavor } from '../../primitives/display/cx-trend-tag';
import { CxProgressBarComponent, type CxProgressBarMood } from '../../primitives/feedback/cx-progress-bar';

export type CxKpiMood = 'default' | 'success' | 'warning' | 'danger';

/**
 * A key-performance-indicator card: a headline metric with an optional trend,
 * status-tinted icon, progress, footer note, and a slot for a sparkline
 * (`[cxKpiChart]`). It composes cx-metric, cx-trend-tag, and cx-progress-bar.
 */
@Component({
  selector: 'cx-kpi',
  imports: [CxIconComponent, CxMetricComponent, CxTrendTagComponent, CxProgressBarComponent],
  templateUrl: './cx-kpi.component.html',
  styleUrl: './cx-kpi.component.scss',
  host: {
    '[class.cx-kpi-host--success]': "mood === 'success'",
    '[class.cx-kpi-host--warning]': "mood === 'warning'",
    '[class.cx-kpi-host--danger]': "mood === 'danger'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxKpiComponent {
  @Input() heading = '';
  @Input() value = '0';
  @Input() icon: CxIconName | undefined;
  @Input() mood: CxKpiMood = 'default';
  @Input() trendValue: string | undefined;
  @Input() trendFavor: CxTrendTagFavor = 'up';
  @Input() progress: number | undefined;
  @Input() progressMax = 100;
  @Input() progressLabel = 'Progress';
  @Input() footer: string | undefined;

  protected get hasTrend(): boolean {
    return Boolean(this.trendValue?.trim());
  }

  protected get hasProgress(): boolean {
    return this.progress !== undefined && this.progress !== null;
  }

  protected get hasFooter(): boolean {
    return Boolean(this.footer?.trim());
  }

  protected get progressMood(): CxProgressBarMood {
    switch (this.mood) {
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  }
}
