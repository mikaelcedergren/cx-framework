import { AfterViewInit, OnDestroy } from '@angular/core';
import type { AgChartOptions } from 'ag-charts-community';
import * as i0 from "@angular/core";
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
export declare class CxChartComponent implements AfterViewInit, OnDestroy {
    private static agModulePromise;
    private static agModulesRegistered;
    private readonly host;
    private readonly chartState;
    private chartInstance;
    private renderVersion;
    private chartContainer;
    constructor();
    set chart(value: CxChart | null | undefined);
    protected readonly chart$: import("@angular/core").Signal<CxResolvedChart>;
    protected readonly hasData$: import("@angular/core").Signal<boolean>;
    protected readonly emptyText$: import("@angular/core").Signal<string>;
    protected readonly ariaLabel$: import("@angular/core").Signal<string>;
    protected readonly chartReady$: import("@angular/core").WritableSignal<boolean>;
    protected readonly heightStyle$: import("@angular/core").Signal<string | null>;
    protected readonly options$: import("@angular/core").Signal<AgChartOptions>;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    private normalizeChart;
    private buildOptions;
    private buildCartesianOptions;
    private buildCircularOptions;
    private buildCartesianData;
    private buildAxes;
    private buildLegend;
    private buildTooltip;
    private buildTheme;
    private colorsForChart;
    private colorFor;
    private hasRenderableData;
    private normalizeType;
    private normalizeHeight;
    private valueOf;
    private token;
    private renderChart;
    private destroyChart;
    private static loadAgCharts;
    private static registerAgModules;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxChartComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxChartComponent, "cx-chart", never, { "chart": { "alias": "chart"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-chart.component.d.ts.map