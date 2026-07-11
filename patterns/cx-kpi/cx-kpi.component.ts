import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconComponent, type CxIconMood } from '../../primitives/media/cx-icon';
import { CxTrendTagComponent, type CxTrendTagFavor } from '../../primitives/display/cx-trend-tag';
import { CxProgressBarComponent, type CxProgressBarMood } from '../../primitives/feedback/cx-progress-bar';

export type CxKpiMood = CxIconMood;

/**
 * A key-performance-indicator card: a headline metric with an optional trend,
 * status-tinted icon, progress, footer note, and a slot for a sparkline
 * (`[cxKpiChart]`). It composes cx-trend-tag and cx-progress-bar.
 */
@Component({
  selector: 'cx-kpi',
  imports: [CxIconComponent, CxTrendTagComponent, CxProgressBarComponent],
  templateUrl: './cx-kpi.component.html',
  styleUrl: './cx-kpi.component.scss',
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

  protected get hasHeading(): boolean {
    return Boolean(this.heading.trim());
  }

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
      case 'accent':
        return 'accent';
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  }
}
