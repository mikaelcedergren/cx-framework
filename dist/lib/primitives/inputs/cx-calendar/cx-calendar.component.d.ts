import { EventEmitter } from '@angular/core';
import { type CxDropdownOption } from '../cx-dropdown';
import { type CxCalendarDay, type CxCalendarWeekStart, type CxLocalDateParts } from '../shared/cx-date.utils';
import * as i0 from "@angular/core";
export type CxCalendarVariant = 'default' | 'embedded';
export type CxCalendarSelectionMode = 'single' | 'range';
export type CxCalendarDisabledDates = (date: Date) => boolean;
export interface CxCalendarRange {
    start?: Date;
    end?: Date;
}
export declare class CxCalendarComponent {
    private readonly host;
    private readonly valueState;
    private readonly rangeState;
    private readonly rangePreviewEndState;
    private readonly viewYearState;
    private readonly viewMonthState;
    private readonly focusedDayKeyState;
    private hasControlledView;
    private focusFrame;
    constructor();
    variant: CxCalendarVariant;
    selectionMode: CxCalendarSelectionMode;
    weekStart: CxCalendarWeekStart;
    yearRange: number;
    disabled: boolean;
    min: Date | undefined;
    max: Date | undefined;
    disabledDates: CxCalendarDisabledDates | undefined;
    set value(value: Date | undefined);
    set range(value: CxCalendarRange | undefined);
    set viewDate(value: Date | undefined);
    set rangePreviewEnd(value: Date | undefined);
    readonly valueChange: EventEmitter<Date | undefined>;
    readonly rangeChange: EventEmitter<CxCalendarRange>;
    readonly rangePreviewEndChange: EventEmitter<Date | undefined>;
    readonly viewDateChange: EventEmitter<Date>;
    protected readonly monthOptions: CxDropdownOption[];
    protected readonly viewYearValue$: import("@angular/core").Signal<string>;
    protected readonly viewMonthValue$: import("@angular/core").Signal<string>;
    protected readonly selectedDate$: import("@angular/core").Signal<CxLocalDateParts | null>;
    protected readonly rangeStart$: import("@angular/core").Signal<CxLocalDateParts | null>;
    protected readonly rangeEnd$: import("@angular/core").Signal<CxLocalDateParts | null>;
    protected readonly rangePreviewEnd$: import("@angular/core").Signal<CxLocalDateParts | null>;
    protected readonly yearOptions$: import("@angular/core").Signal<CxDropdownOption[]>;
    protected readonly weekdayLabels$: import("@angular/core").Signal<readonly string[]>;
    protected readonly calendarDays$: import("@angular/core").Signal<CxCalendarDay[]>;
    protected readonly gridAriaLabel$: import("@angular/core").Signal<string>;
    protected readonly tabbableDayKey$: import("@angular/core").Signal<string | undefined>;
    /**
     * Moves focus to the calendar's current roving day.
     * Returns false when the calendar is disabled or every rendered day is unavailable.
     */
    focusActiveDay(): boolean;
    protected onPreviousMonth(): void;
    protected onNextMonth(): void;
    protected onMonthChange(value: string | undefined): void;
    protected onYearChange(value: string | undefined): void;
    protected onDaySelect(day: CxCalendarDay): void;
    protected isSelectedDay(day: CxCalendarDay): boolean;
    protected isRangeStartDay(day: CxCalendarDay): boolean;
    protected isRangeEndDay(day: CxCalendarDay): boolean;
    protected isRangePreviewEnd(day: CxCalendarDay): boolean;
    protected isInRange(day: CxCalendarDay): boolean;
    protected isAriaSelectedDay(day: CxCalendarDay): boolean;
    protected onDayHover(day: CxCalendarDay): void;
    protected onDayLeave(): void;
    protected onDayFocus(day: CxCalendarDay): void;
    protected onDayKeydown(event: KeyboardEvent, day: CxCalendarDay): void;
    protected dayAriaLabel(day: CxCalendarDay): string;
    protected isOutsideRange(day: CxCalendarDay): boolean;
    private setView;
    private syncViewToDate;
    private validDate;
    private clearRangePreview;
    private toDateParts;
    private resolveTabbableDay;
    private moveFocusToDay;
    private scheduleDayFocus;
    private focusDayButton;
    private addDays;
    private dayKey;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxCalendarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxCalendarComponent, "cx-calendar", never, { "variant": { "alias": "variant"; "required": false; }; "selectionMode": { "alias": "selectionMode"; "required": false; }; "weekStart": { "alias": "weekStart"; "required": false; }; "yearRange": { "alias": "yearRange"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "min": { "alias": "min"; "required": false; }; "max": { "alias": "max"; "required": false; }; "disabledDates": { "alias": "disabledDates"; "required": false; }; "value": { "alias": "value"; "required": false; }; "range": { "alias": "range"; "required": false; }; "viewDate": { "alias": "viewDate"; "required": false; }; "rangePreviewEnd": { "alias": "rangePreviewEnd"; "required": false; }; }, { "valueChange": "valueChange"; "rangeChange": "rangeChange"; "rangePreviewEndChange": "rangePreviewEndChange"; "viewDateChange": "viewDateChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-calendar.component.d.ts.map