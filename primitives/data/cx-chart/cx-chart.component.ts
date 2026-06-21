import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import type {
  AgChartInstance,
  AgChartOptions,
  AgChartTheme,
} from 'ag-charts-community';

export type CxChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut';

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
  readonly xAxisLabel?: string;
  readonly yAxisLabel?: string;
  readonly showAxes?: boolean;
  readonly showLegend?: boolean;
  readonly showTooltip?: boolean;
  readonly height?: number;
}

type CxChartDatum = Record<string, number | string>;
type CxAgChartsModule = typeof import('ag-charts-community');

type CxResolvedChart = {
  readonly type: CxChartType;
  readonly labels: readonly string[];
  readonly series: readonly CxChartSeries[];
  readonly ariaLabel: string;
  readonly emptyText: string;
  readonly xAxisLabel?: string;
  readonly yAxisLabel?: string;
  readonly showAxes: boolean;
  readonly showLegend: boolean;
  readonly showTooltip: boolean;
  readonly height?: number;
};

const CX_CHART_SERIES_KEY_PREFIX = 'series_';
const CX_CHART_MIN_HEIGHT = 120;
const CX_CHART_MAX_HEIGHT = 720;
const CX_CHART_PALETTE = [
  '--violet',
  '--blue',
  '--cyan',
  '--green',
  '--yellow',
  '--orange',
  '--red',
  '--pink',
  '--purple',
] as const;

const CX_CHART_COLOR_FALLBACKS: Record<string, string> = {
  '--violet': '#3057f2',
  '--blue': '#057dff',
  '--cyan': '#00ccc5',
  '--green': '#37c45b',
  '--yellow': '#edc31c',
  '--orange': '#ff980a',
  '--red': '#ff4043',
  '--pink': '#f2559c',
  '--purple': '#ae4ede',
  '--primary': '#057dff',
  '--accent': '#00ccc5',
  '--success': '#37c45b',
  '--warning': '#ff980a',
  '--danger': '#ff4043',
  '--info': '#057dff',
  '--ink': '#1f1f1f',
  '--opacity-high': 'rgb(22 24 29 / 62%)',
  '--opacity-mid': 'rgb(22 24 29 / 10%)',
  '--surface-mid': '#ffffff',
  '--line': 'rgb(22 24 29 / 10%)',
};

@Component({
  selector: 'cx-chart',
  templateUrl: './cx-chart.component.html',
  styleUrl: './cx-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxChartComponent implements AfterViewInit, OnDestroy {
  private static agModulePromise: Promise<CxAgChartsModule> | undefined;
  private static agModulesRegistered = false;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly chartState = signal<CxChart | undefined>(undefined);
  private chartInstance: AgChartInstance | undefined;
  private renderVersion = 0;

  @ViewChild('chartContainer', { read: ElementRef })
  private chartContainer: ElementRef<HTMLElement> | undefined;

  constructor() {
    effect(() => {
      const options = this.options$();
      const isReady = this.chartReady$();
      const hasData = this.hasData$();
      if (!isReady) {
        return;
      }
      if (!hasData) {
        this.destroyChart();
        return;
      }
      void this.renderChart(options);
    });
  }

  @Input()
  public set chart(value: CxChart | null | undefined) {
    this.chartState.set(value ?? undefined);
  }

  protected readonly chart$ = computed<CxResolvedChart>(() => this.normalizeChart(this.chartState()));
  protected readonly hasData$ = computed(() => this.hasRenderableData(this.chart$()));
  protected readonly emptyText$ = computed(() => this.chart$().emptyText);
  protected readonly ariaLabel$ = computed(() => this.chart$().ariaLabel);
  protected readonly chartReady$ = signal(false);
  protected readonly heightStyle$ = computed(() => {
    const height = this.chart$().height;
    return height === undefined ? null : `${height}px`;
  });
  protected readonly options$ = computed<AgChartOptions>(() => this.buildOptions(this.chart$()));

  public ngAfterViewInit(): void {
    this.chartReady$.set(true);
  }

  public ngOnDestroy(): void {
    this.destroyChart();
  }

  private normalizeChart(chart: CxChart | undefined): CxResolvedChart {
    return {
      type: this.normalizeType(chart?.type),
      labels: chart?.labels ?? [],
      series: chart?.series ?? [],
      ariaLabel: chart?.ariaLabel?.trim() || 'Chart',
      emptyText: chart?.emptyText?.trim() || 'No chart data.',
      xAxisLabel: chart?.xAxisLabel?.trim() || undefined,
      yAxisLabel: chart?.yAxisLabel?.trim() || undefined,
      showAxes: chart?.showAxes ?? true,
      showLegend: chart?.showLegend ?? true,
      showTooltip: chart?.showTooltip ?? true,
      height: this.normalizeHeight(chart?.height),
    };
  }

  private buildOptions(chart: CxResolvedChart): AgChartOptions {
    if (chart.type === 'pie' || chart.type === 'doughnut') {
      return this.buildCircularOptions(chart);
    }
    return this.buildCartesianOptions(chart);
  }

  private buildCartesianOptions(chart: CxResolvedChart): AgChartOptions {
    const colors = this.colorsForChart();
    const data = this.buildCartesianData(chart);
    const series = chart.series.map((entry, index) => {
      const key = `${CX_CHART_SERIES_KEY_PREFIX}${index}`;
      const color = this.colorFor(index, entry.color, colors);
      const base = {
        type: chart.type,
        xKey: 'label',
        yKey: key,
        yName: entry.label,
        legendItemName: entry.label,
      };

      if (chart.type === 'bar') {
        return {
          ...base,
          type: 'bar' as const,
          direction: 'vertical' as const,
          fill: color,
          stroke: color,
          cornerRadius: 3,
        };
      }

      if (chart.type === 'area') {
        return {
          ...base,
          type: 'area' as const,
          fill: color,
          fillOpacity: 0.18,
          stroke: color,
          marker: {
            enabled: true,
            fill: color,
            stroke: color,
            size: 5,
          },
        };
      }

      return {
        ...base,
        type: 'line' as const,
        stroke: color,
        marker: {
          enabled: true,
          fill: color,
          stroke: color,
          size: 5,
        },
      };
    });

    return {
      data,
      series,
      background: { visible: false },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      theme: this.buildTheme(colors),
      axes: this.buildAxes(chart),
      legend: this.buildLegend(chart),
      tooltip: this.buildTooltip(chart, true),
    } as AgChartOptions;
  }

  private buildCircularOptions(chart: CxResolvedChart): AgChartOptions {
    const colors = this.colorsForChart();
    const firstSeries = chart.series[0];
    const data = chart.labels.map((label, index) => ({
      label,
      value: Math.max(0, this.valueOf(firstSeries?.data[index])),
    }));

    return {
      data,
      series: [
        {
          type: chart.type === 'doughnut' ? 'donut' : 'pie',
          angleKey: 'value',
          calloutLabelKey: 'label',
          legendItemKey: 'label',
          angleName: firstSeries?.label ?? 'Value',
          fills: colors,
          strokes: colors,
          strokeWidth: 0,
          sectorSpacing: 2,
          cornerRadius: 4,
          calloutLabel: {
            enabled: chart.showAxes,
          },
        },
      ],
      background: { visible: false },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      theme: this.buildTheme(colors),
      legend: this.buildLegend(chart),
      tooltip: this.buildTooltip(chart, false),
    } as AgChartOptions;
  }

  private buildCartesianData(chart: CxResolvedChart): CxChartDatum[] {
    return chart.labels.map((label, labelIndex) => {
      const item: CxChartDatum = { label };
      chart.series.forEach((entry, seriesIndex) => {
        item[`${CX_CHART_SERIES_KEY_PREFIX}${seriesIndex}`] = this.valueOf(entry.data[labelIndex]);
      });
      return item;
    });
  }

  private buildAxes(chart: CxResolvedChart): NonNullable<Extract<AgChartOptions, { axes?: unknown }>['axes']> {
    const textColor = this.token('--opacity-high');
    const lineColor = this.token('--opacity-mid');
    const axisBase = {
      line: { enabled: chart.showAxes, stroke: lineColor },
      tick: { enabled: chart.showAxes, stroke: lineColor },
      label: {
        enabled: chart.showAxes,
        color: textColor,
        fontFamily: this.token('--font-family-base', "'Inter', sans-serif"),
        fontSize: 12,
      },
    };

    return {
      x: {
        ...axisBase,
        type: 'category',
        position: 'bottom',
        gridLine: { enabled: false },
        title: {
          enabled: chart.showAxes && !!chart.xAxisLabel,
          text: chart.xAxisLabel,
          color: textColor,
          fontFamily: this.token('--font-family-base', "'Inter', sans-serif"),
          fontSize: 12,
        },
      },
      y: {
        ...axisBase,
        type: 'number',
        position: 'left',
        gridLine: {
          enabled: chart.showAxes,
          style: [{ stroke: lineColor, lineDash: [4, 4] }],
        },
        title: {
          enabled: chart.showAxes && !!chart.yAxisLabel,
          text: chart.yAxisLabel,
          color: textColor,
          fontFamily: this.token('--font-family-base', "'Inter', sans-serif"),
          fontSize: 12,
        },
      },
    };
  }

  private buildLegend(chart: CxResolvedChart): AgChartOptions['legend'] {
    return {
      enabled: chart.showLegend,
      position: 'bottom',
      item: {
        marker: {
          size: 8,
          shape: 'circle',
        },
        label: {
          color: this.token('--opacity-high'),
          fontFamily: this.token('--font-family-base', "'Inter', sans-serif"),
          fontSize: 12,
        },
        paddingX: 12,
        paddingY: 6,
      },
    };
  }

  private buildTooltip(chart: CxResolvedChart, shared: boolean): AgChartOptions['tooltip'] {
    return {
      enabled: chart.showTooltip,
      mode: shared ? 'shared' : 'single',
      showArrow: false,
      delay: 0,
    };
  }

  private buildTheme(colors: readonly string[]): AgChartTheme {
    return {
      baseTheme: 'ag-default',
      palette: {
        fills: [...colors],
        strokes: [...colors],
      },
      params: {
        backgroundColor: 'transparent',
        chartBackgroundColor: 'transparent',
        fontFamily: this.token('--font-family-base', "'Inter', sans-serif"),
        fontSize: 12,
        foregroundColor: this.token('--ink'),
        textColor: this.token('--opacity-high'),
        subtleTextColor: this.token('--opacity-high'),
        axisColor: this.token('--opacity-mid'),
        tooltipBackgroundColor: this.token('--surface-mid'),
        tooltipTextColor: this.token('--ink'),
        tooltipSubtleTextColor: this.token('--opacity-high'),
        tooltipBorder: true,
      },
    };
  }

  private colorsForChart(): string[] {
    const palette = CX_CHART_PALETTE.map(tokenName => this.token(tokenName));
    return palette;
  }

  private colorFor(index: number, explicit: string | undefined, colors: readonly string[]): string {
    const explicitColor = explicit?.trim();
    if (explicitColor?.startsWith('--')) {
      return this.token(explicitColor);
    }
    return explicitColor || colors[index % colors.length] || CX_CHART_COLOR_FALLBACKS['--primary'];
  }

  private hasRenderableData(chart: CxResolvedChart): boolean {
    if (!chart.labels.length || !chart.series.length) {
      return false;
    }
    return chart.series.some(series => series.data.length > 0);
  }

  private normalizeType(value: CxChartType | undefined): CxChartType {
    return value === 'line' || value === 'area' || value === 'pie' || value === 'doughnut' ? value : 'bar';
  }

  private normalizeHeight(value: number | undefined): number | undefined {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return Math.min(CX_CHART_MAX_HEIGHT, Math.max(CX_CHART_MIN_HEIGHT, Number(value)));
  }

  private valueOf(value: number | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private token(name: string, fallback = CX_CHART_COLOR_FALLBACKS[name] ?? ''): string {
    if (typeof getComputedStyle !== 'function') {
      return fallback;
    }
    return getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim() || fallback;
  }

  private async renderChart(options: AgChartOptions): Promise<void> {
    const container = this.chartContainer?.nativeElement;
    if (!container) {
      return;
    }

    const renderVersion = ++this.renderVersion;
    const agCharts = await CxChartComponent.loadAgCharts();
    if (renderVersion !== this.renderVersion) {
      return;
    }

    const nextOptions = { ...options, container } as AgChartOptions;
    if (!this.chartInstance) {
      this.chartInstance = agCharts.AgCharts.create(nextOptions);
      return;
    }

    await this.chartInstance.update(nextOptions);
  }

  private destroyChart(): void {
    this.renderVersion += 1;
    this.chartInstance?.destroy();
    this.chartInstance = undefined;
  }

  private static async loadAgCharts(): Promise<CxAgChartsModule> {
    const agCharts = await (CxChartComponent.agModulePromise ??= import('ag-charts-community'));
    CxChartComponent.registerAgModules(agCharts);
    return agCharts;
  }

  private static registerAgModules(agCharts: CxAgChartsModule): void {
    if (CxChartComponent.agModulesRegistered) {
      return;
    }
    agCharts.ModuleRegistry.registerModules([agCharts.AllCommunityModule]);
    CxChartComponent.agModulesRegistered = true;
  }
}
