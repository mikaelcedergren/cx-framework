export interface CxLocalDateParts {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
}
export interface CxCalendarDay {
    key: string;
    year: number;
    month: number;
    day: number;
    isoDate: string;
    inCurrentMonth: boolean;
    isToday: boolean;
}
export type CxCalendarWeekStart = 'mon' | 'sun';
export declare const CX_WEEKDAY_LABELS: readonly ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export declare const CX_WEEKDAY_LABELS_SUNDAY_START: readonly ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export declare const CX_MONTH_OPTIONS: {
    value: number;
    label: string;
}[];
export declare function parseCxDateValue(value: string | undefined | null): CxLocalDateParts | null;
export declare function formatCxDateValue(parts: CxLocalDateParts, includeTime?: boolean): string;
export declare function formatCxDateDisplay(value: string | undefined | null, includeTime?: boolean): string | undefined;
export declare function formatCxDateSpanDisplay(startValue: string | undefined | null, endValue: string | undefined | null, includeTime?: boolean): string | undefined;
export declare function getCxWeekdayLabels(weekStart: CxCalendarWeekStart): readonly string[];
export declare function buildCxCalendarDays(year: number, month: number, weekStart?: CxCalendarWeekStart): CxCalendarDay[];
export declare function getCxTodayParts(): CxLocalDateParts;
export declare function getCxYearOptions(viewYear: number, radius?: number): number[];
export declare function addCxMonths(year: number, month: number, delta: number): {
    year: number;
    month: number;
};
export declare function compareCxDays(a: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>, b: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): number;
export declare function isSameCxDay(a: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined, b: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined): boolean;
export declare function isCxDayBetween(target: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>, start: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined, end: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined): boolean;
export declare function getCxDaysInMonth(year: number, month: number): number;
//# sourceMappingURL=cx-date.utils.d.ts.map