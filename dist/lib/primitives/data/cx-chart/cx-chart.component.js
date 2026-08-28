import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, computed, effect, inject, signal, } from '@angular/core';
import * as i0 from "@angular/core";
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
];
const CX_CHART_COLOR_FALLBACKS = {
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
    '--surface': '#ffffff',
    '--line': 'rgb(22 24 29 / 10%)',
};
export class CxChartComponent {
    static agModulePromise;
    static agModulesRegistered = false;
    host = inject(ElementRef);
    chartState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "chartState" }] : /* istanbul ignore next */ []));
    chartInstance;
    renderVersion = 0;
    chartContainer;
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
    set chart(value) {
        this.chartState.set(value ?? undefined);
    }
    chart$ = computed(() => this.normalizeChart(this.chartState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "chart$" }] : /* istanbul ignore next */ []));
    hasData$ = computed(() => this.hasRenderableData(this.chart$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasData$" }] : /* istanbul ignore next */ []));
    emptyText$ = computed(() => this.chart$().emptyText, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "emptyText$" }] : /* istanbul ignore next */ []));
    ariaLabel$ = computed(() => this.chart$().ariaLabel, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabel$" }] : /* istanbul ignore next */ []));
    chartReady$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "chartReady$" }] : /* istanbul ignore next */ []));
    heightStyle$ = computed(() => {
        const height = this.chart$().height;
        return height === undefined ? null : `${height}px`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "heightStyle$" }] : /* istanbul ignore next */ []));
    options$ = computed(() => this.buildOptions(this.chart$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "options$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        this.chartReady$.set(true);
    }
    ngOnDestroy() {
        this.destroyChart();
    }
    normalizeChart(chart) {
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
    buildOptions(chart) {
        if (chart.type === 'pie' || chart.type === 'doughnut') {
            return this.buildCircularOptions(chart);
        }
        return this.buildCartesianOptions(chart);
    }
    buildCartesianOptions(chart) {
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
                    type: 'bar',
                    direction: 'vertical',
                    fill: color,
                    stroke: color,
                    cornerRadius: 3,
                };
            }
            if (chart.type === 'area') {
                return {
                    ...base,
                    type: 'area',
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
                type: 'line',
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
        };
    }
    buildCircularOptions(chart) {
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
        };
    }
    buildCartesianData(chart) {
        return chart.labels.map((label, labelIndex) => {
            const item = { label };
            chart.series.forEach((entry, seriesIndex) => {
                item[`${CX_CHART_SERIES_KEY_PREFIX}${seriesIndex}`] = this.valueOf(entry.data[labelIndex]);
            });
            return item;
        });
    }
    buildAxes(chart) {
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
    buildLegend(chart) {
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
    buildTooltip(chart, shared) {
        return {
            enabled: chart.showTooltip,
            mode: shared ? 'shared' : 'single',
            showArrow: false,
            delay: 0,
        };
    }
    buildTheme(colors) {
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
                tooltipBackgroundColor: this.token('--surface'),
                tooltipTextColor: this.token('--ink'),
                tooltipSubtleTextColor: this.token('--opacity-high'),
                tooltipBorder: true,
            },
        };
    }
    colorsForChart() {
        const palette = CX_CHART_PALETTE.map(tokenName => this.token(tokenName));
        return palette;
    }
    colorFor(index, explicit, colors) {
        const explicitColor = explicit?.trim();
        if (explicitColor?.startsWith('--')) {
            return this.token(explicitColor);
        }
        return explicitColor || colors[index % colors.length] || CX_CHART_COLOR_FALLBACKS['--primary'];
    }
    hasRenderableData(chart) {
        if (!chart.labels.length || !chart.series.length) {
            return false;
        }
        return chart.series.some(series => series.data.length > 0);
    }
    normalizeType(value) {
        return value === 'line' || value === 'area' || value === 'pie' || value === 'doughnut' ? value : 'bar';
    }
    normalizeHeight(value) {
        if (!Number.isFinite(value)) {
            return undefined;
        }
        return Math.min(CX_CHART_MAX_HEIGHT, Math.max(CX_CHART_MIN_HEIGHT, Number(value)));
    }
    valueOf(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    token(name, fallback = CX_CHART_COLOR_FALLBACKS[name] ?? '') {
        if (typeof getComputedStyle !== 'function') {
            return fallback;
        }
        return getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim() || fallback;
    }
    async renderChart(options) {
        const container = this.chartContainer?.nativeElement;
        if (!container) {
            return;
        }
        const renderVersion = ++this.renderVersion;
        const agCharts = await CxChartComponent.loadAgCharts();
        if (renderVersion !== this.renderVersion) {
            return;
        }
        const nextOptions = { ...options, container };
        if (!this.chartInstance) {
            this.chartInstance = agCharts.AgCharts.create(nextOptions);
            return;
        }
        await this.chartInstance.update(nextOptions);
    }
    destroyChart() {
        this.renderVersion += 1;
        this.chartInstance?.destroy();
        this.chartInstance = undefined;
    }
    static async loadAgCharts() {
        const agCharts = await (CxChartComponent.agModulePromise ??= import('ag-charts-community'));
        CxChartComponent.registerAgModules(agCharts);
        return agCharts;
    }
    static registerAgModules(agCharts) {
        if (CxChartComponent.agModulesRegistered) {
            return;
        }
        agCharts.ModuleRegistry.registerModules([agCharts.AllCommunityModule]);
        CxChartComponent.agModulesRegistered = true;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxChartComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxChartComponent, isStandalone: true, selector: "cx-chart", inputs: { chart: "chart" }, viewQueries: [{ propertyName: "chartContainer", first: true, predicate: ["chartContainer"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div class=\"cx-chart\" [style.height]=\"heightStyle$()\" [attr.aria-label]=\"ariaLabel$()\" role=\"img\">\n  <div #chartContainer class=\"cx-chart__renderer\" [class.cx-chart__renderer--hidden]=\"!hasData$()\"></div>\n  @if (!hasData$()) {\n    <div class=\"cx-chart__empty\">{{ emptyText$() }}</div>\n  }\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-chart{display:block;position:relative;width:100%;height:100%;min-width:0;min-height:120px;box-sizing:border-box}.cx-chart__renderer{display:block;width:100%;height:100%;min-width:0;min-height:0}.cx-chart__renderer--hidden{display:none}.cx-chart__empty{display:flex;width:100%;min-height:120px;height:100%;align-items:center;justify-content:center;color:var(--opacity-high);font-family:var(--font-family-base);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-chart\" [style.height]=\"heightStyle$()\" [attr.aria-label]=\"ariaLabel$()\" role=\"img\">\n  <div #chartContainer class=\"cx-chart__renderer\" [class.cx-chart__renderer--hidden]=\"!hasData$()\"></div>\n  @if (!hasData$()) {\n    <div class=\"cx-chart__empty\">{{ emptyText$() }}</div>\n  }\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-chart{display:block;position:relative;width:100%;height:100%;min-width:0;min-height:120px;box-sizing:border-box}.cx-chart__renderer{display:block;width:100%;height:100%;min-width:0;min-height:0}.cx-chart__renderer--hidden{display:none}.cx-chart__empty{display:flex;width:100%;min-height:120px;height:100%;align-items:center;justify-content:center;color:var(--opacity-high);font-family:var(--font-family-base);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}"] }]
        }], ctorParameters: () => [], propDecorators: { chartContainer: [{
                type: ViewChild,
                args: ['chartContainer', { read: ElementRef }]
            }], chart: [{
                type: Input
            }] } });
