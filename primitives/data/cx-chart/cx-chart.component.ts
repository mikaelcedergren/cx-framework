import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type CxChartType = 'bar' | 'line' | 'pie' | 'doughnut';

export interface CxChartSeries {
  readonly id?: string;
  readonly label: string;
  readonly data: readonly number[];
  readonly color?: string;
}

export interface CxChart {
  readonly type: CxChartType;
  readonly labels: readonly string[];
  readonly series: readonly CxChartSeries[];
  readonly ariaLabel?: string;
  readonly emptyText?: string;
}

interface CxChartLegendItem {
  readonly id: string;
  readonly label: string;
  readonly value?: number;
  readonly color: string;
}

interface CxChartBar {
  readonly id: string;
  readonly label: string;
  readonly seriesLabel: string;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
}

interface CxChartLine {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly points: string;
}

interface CxChartTick {
  readonly value: number;
  readonly y: number;
}

const CX_CHART_PLOT_LEFT = 18;
const CX_CHART_PLOT_RIGHT = 96;
const CX_CHART_PLOT_TOP = 6;
const CX_CHART_PLOT_BOTTOM = 52;
const CX_CHART_TICK_COUNT = 5;

const CX_CHART_COLORS = [
  'var(--primary)',
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--danger)',
  'var(--info)',
] as const;

@Component({
  selector: 'cx-chart',
  templateUrl: './cx-chart.component.html',
  styleUrl: './cx-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxChartComponent {
  private readonly chartState = signal<CxChart | undefined>(undefined);

  @Input()
  public set chart(value: CxChart | null | undefined) {
    this.chartState.set(value ?? undefined);
  }

  protected readonly type$ = computed(() => this.chartState()?.type ?? 'bar');
  protected readonly labels$ = computed(() => this.chartState()?.labels ?? []);
  protected readonly series$ = computed(() => this.chartState()?.series ?? []);
  protected readonly emptyText$ = computed(() => this.chartState()?.emptyText ?? 'No chart data.');
  protected readonly ariaLabel$ = computed(() => this.chartState()?.ariaLabel ?? 'Chart');
  protected readonly hasData$ = computed(() =>
    this.labels$().length > 0 &&
    this.series$().some(series => series.data.some(value => this.valueOf(value) > 0)),
  );
  protected readonly bars$ = computed<CxChartBar[]>(() => this.buildBars());
  protected readonly lines$ = computed<CxChartLine[]>(() => this.buildLines());
  protected readonly ticks$ = computed<CxChartTick[]>(() => this.buildTicks());
  protected readonly legendItems$ = computed<CxChartLegendItem[]>(() => this.buildLegendItems());
  protected readonly pieGradient$ = computed(() => this.buildPieGradient());
  protected readonly isCircular$ = computed(() => this.type$() === 'pie' || this.type$() === 'doughnut');

  private buildBars(): CxChartBar[] {
    const labels = this.labels$();
    const series = this.series$();
    if (!labels.length || !series.length) {
      return [];
    }

    const max = this.axisMax();
    const plotWidth = CX_CHART_PLOT_RIGHT - CX_CHART_PLOT_LEFT;
    const plotHeight = CX_CHART_PLOT_BOTTOM - CX_CHART_PLOT_TOP;
    const groupWidth = plotWidth / labels.length;
    const gap = 1;
    const width = Math.max(1.5, Math.min(8, (groupWidth - gap * Math.max(0, series.length - 1)) / (series.length + 0.8)));

    return labels.flatMap((label, labelIndex) => {
      const totalWidth = series.length * width + Math.max(0, series.length - 1) * gap;
      const startX = CX_CHART_PLOT_LEFT + labelIndex * groupWidth + (groupWidth - totalWidth) / 2;
      return series.map((entry, seriesIndex) => {
        const value = this.valueOf(entry.data[labelIndex]);
        const height = max > 0 ? (value / max) * plotHeight : 0;
        return {
          id: `${entry.id ?? entry.label}-${label}-${seriesIndex}`,
          label,
          seriesLabel: entry.label,
          value,
          x: startX + seriesIndex * (width + gap),
          y: CX_CHART_PLOT_BOTTOM - height,
          width,
          height,
          color: this.colorFor(seriesIndex, entry.color),
        };
      });
    });
  }

  private buildLines(): CxChartLine[] {
    const labels = this.labels$();
    const series = this.series$();
    if (!labels.length || !series.length) {
      return [];
    }

    const max = this.axisMax();
    const step = labels.length > 1 ? (CX_CHART_PLOT_RIGHT - CX_CHART_PLOT_LEFT) / (labels.length - 1) : 0;
    return series.map((entry, seriesIndex) => ({
      id: entry.id ?? entry.label,
      label: entry.label,
      color: this.colorFor(seriesIndex, entry.color),
      points: labels.map((_, labelIndex) => {
        const value = this.valueOf(entry.data[labelIndex]);
        const x = labels.length > 1 ? CX_CHART_PLOT_LEFT + labelIndex * step : 50;
        const y = max > 0
          ? CX_CHART_PLOT_BOTTOM - (value / max) * (CX_CHART_PLOT_BOTTOM - CX_CHART_PLOT_TOP)
          : CX_CHART_PLOT_BOTTOM;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' '),
    }));
  }

  private buildTicks(): CxChartTick[] {
    const max = this.axisMax();
    const step = max / CX_CHART_TICK_COUNT;
    return Array.from({ length: CX_CHART_TICK_COUNT + 1 }, (_, index) => {
      const value = Math.round(step * index);
      const ratio = max > 0 ? value / max : 0;
      return {
        value,
        y: CX_CHART_PLOT_BOTTOM - ratio * (CX_CHART_PLOT_BOTTOM - CX_CHART_PLOT_TOP),
      };
    }).reverse();
  }

  private buildLegendItems(): CxChartLegendItem[] {
    if (this.isCircular$()) {
      const firstSeries = this.series$()[0];
      return this.labels$().map((label, index) => ({
        id: label,
        label,
        value: this.valueOf(firstSeries?.data[index]),
        color: this.colorFor(index),
      }));
    }

    return this.series$().map((series, index) => ({
      id: series.id ?? series.label,
      label: series.label,
      color: this.colorFor(index, series.color),
    }));
  }

  private buildPieGradient(): string {
    const firstSeries = this.series$()[0];
    const labels = this.labels$();
    const values = labels.map((_, index) => this.valueOf(firstSeries?.data[index]));
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return 'conic-gradient(var(--opacity-low) 0deg 360deg)';
    }

    let start = 0;
    const stops = values.map((value, index) => {
      const end = start + (value / total) * 360;
      const segment = `${this.colorFor(index)} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
      start = end;
      return segment;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }

  private maxValue(): number {
    const values = this.series$().flatMap(series => series.data.map(value => this.valueOf(value)));
    return Math.max(0, ...values);
  }

  private axisMax(): number {
    const max = this.maxValue();
    if (max <= 0) {
      return CX_CHART_TICK_COUNT;
    }
    const roughStep = max / CX_CHART_TICK_COUNT;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / magnitude;
    const niceStep = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
    return niceStep * magnitude * CX_CHART_TICK_COUNT;
  }

  private valueOf(value: number | undefined): number {
    return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
  }

  private colorFor(index: number, explicit?: string): string {
    return explicit?.trim() || CX_CHART_COLORS[index % CX_CHART_COLORS.length];
  }
}
