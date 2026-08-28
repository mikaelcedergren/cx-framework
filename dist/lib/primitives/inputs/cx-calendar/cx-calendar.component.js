import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, Input, Output, computed, inject, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxDropdownComponent } from '../cx-dropdown/index.js';
import { CX_MONTH_OPTIONS, addCxMonths, buildCxCalendarDays, compareCxDays, getCxDaysInMonth, getCxWeekdayLabels, getCxTodayParts, getCxYearOptions, isCxDayBetween, isSameCxDay, } from '../shared/cx-date.utils.js';
import * as i0 from "@angular/core";
const calendarDayLabelFormatter = new Intl.DateTimeFormat('en-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});
const calendarGridLabelFormatter = new Intl.DateTimeFormat('en-SE', {
    month: 'long',
    year: 'numeric',
});
export class CxCalendarComponent {
    host = inject((ElementRef));
    valueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    rangeState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangeState" }] : /* istanbul ignore next */ []));
    rangePreviewEndState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangePreviewEndState" }] : /* istanbul ignore next */ []));
    viewYearState = signal(getCxTodayParts().year, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewYearState" }] : /* istanbul ignore next */ []));
    viewMonthState = signal(getCxTodayParts().month, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewMonthState" }] : /* istanbul ignore next */ []));
    focusedDayKeyState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedDayKeyState" }] : /* istanbul ignore next */ []));
    hasControlledView = false;
    focusFrame;
    constructor() {
        inject(DestroyRef).onDestroy(() => {
            if (typeof window !== 'undefined' && this.focusFrame !== undefined) {
                window.cancelAnimationFrame(this.focusFrame);
            }
        });
    }
    variant = 'default';
    selectionMode = 'single';
    weekStart = 'mon';
    yearRange = 12;
    disabled = false;
    min;
    max;
    disabledDates;
    set value(value) {
        const nextValue = this.validDate(value);
        this.valueState.set(nextValue);
        if (!this.hasControlledView) {
            this.syncViewToDate(nextValue);
        }
    }
    set range(value) {
        const nextRange = {
            start: this.validDate(value?.start),
            end: this.validDate(value?.end),
        };
        this.rangeState.set(nextRange);
        if (!this.hasControlledView) {
            this.syncViewToDate(nextRange.start);
        }
    }
    set viewDate(value) {
        const nextView = this.validDate(value);
        this.hasControlledView = !!nextView;
        this.syncViewToDate(nextView ?? this.valueState() ?? this.rangeState().start);
    }
    set rangePreviewEnd(value) {
        this.rangePreviewEndState.set(this.validDate(value));
    }
    valueChange = new EventEmitter();
    rangeChange = new EventEmitter();
    rangePreviewEndChange = new EventEmitter();
    viewDateChange = new EventEmitter();
    monthOptions = CX_MONTH_OPTIONS.map(option => ({
        id: String(option.value),
        label: option.label,
    }));
    viewYearValue$ = computed(() => `${this.viewYearState()}`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewYearValue$" }] : /* istanbul ignore next */ []));
    viewMonthValue$ = computed(() => `${this.viewMonthState()}`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewMonthValue$" }] : /* istanbul ignore next */ []));
    selectedDate$ = computed(() => this.toDateParts(this.valueState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedDate$" }] : /* istanbul ignore next */ []));
    rangeStart$ = computed(() => this.toDateParts(this.rangeState().start), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangeStart$" }] : /* istanbul ignore next */ []));
    rangeEnd$ = computed(() => this.toDateParts(this.rangeState().end), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangeEnd$" }] : /* istanbul ignore next */ []));
    rangePreviewEnd$ = computed(() => this.toDateParts(this.rangePreviewEndState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangePreviewEnd$" }] : /* istanbul ignore next */ []));
    yearOptions$ = computed(() => getCxYearOptions(this.viewYearState(), this.yearRange).map(year => ({
        id: String(year),
        label: String(year),
    })), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "yearOptions$" }] : /* istanbul ignore next */ []));
    weekdayLabels$ = computed(() => getCxWeekdayLabels(this.weekStart), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "weekdayLabels$" }] : /* istanbul ignore next */ []));
    calendarDays$ = computed(() => buildCxCalendarDays(this.viewYearState(), this.viewMonthState(), this.weekStart), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "calendarDays$" }] : /* istanbul ignore next */ []));
    gridAriaLabel$ = computed(() => calendarGridLabelFormatter.format(new Date(this.viewYearState(), this.viewMonthState() - 1, 1, 12, 0, 0, 0)), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "gridAriaLabel$" }] : /* istanbul ignore next */ []));
    tabbableDayKey$ = computed(() => this.resolveTabbableDay()?.key, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tabbableDayKey$" }] : /* istanbul ignore next */ []));
    /**
     * Moves focus to the calendar's current roving day.
     * Returns false when the calendar is disabled or every rendered day is unavailable.
     */
    focusActiveDay() {
        if (this.disabled) {
            return false;
        }
        const day = this.resolveTabbableDay();
        if (!day) {
            return false;
        }
        this.focusedDayKeyState.set(day.key);
        if (!this.focusDayButton(day.key)) {
            this.scheduleDayFocus(day.key);
        }
        return true;
    }
    onPreviousMonth() {
        const next = addCxMonths(this.viewYearState(), this.viewMonthState(), -1);
        this.setView(next.year, next.month);
    }
    onNextMonth() {
        const next = addCxMonths(this.viewYearState(), this.viewMonthState(), 1);
        this.setView(next.year, next.month);
    }
    onMonthChange(value) {
        const month = Number.parseInt(value ?? '', 10);
        if (Number.isFinite(month) && month >= 1 && month <= 12) {
            this.setView(this.viewYearState(), month);
        }
    }
    onYearChange(value) {
        const year = Number.parseInt(value ?? '', 10);
        if (Number.isFinite(year)) {
            this.setView(year, this.viewMonthState());
        }
    }
    onDaySelect(day) {
        if (this.disabled || this.isOutsideRange(day)) {
            return;
        }
        this.focusedDayKeyState.set(day.key);
        const nextValue = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);
        if (this.selectionMode === 'range') {
            const currentRange = this.rangeState();
            const currentStart = this.toDateParts(currentRange.start);
            const currentEnd = this.toDateParts(currentRange.end);
            let nextRange;
            if (!currentStart || currentEnd) {
                nextRange = { start: nextValue };
            }
            else if (compareCxDays(day, currentStart) < 0) {
                nextRange = { start: nextValue, end: currentRange.start };
            }
            else {
                nextRange = { start: currentRange.start, end: nextValue };
            }
            this.rangeState.set(nextRange);
            this.clearRangePreview();
            this.setView(day.year, day.month);
            this.rangeChange.emit(nextRange);
            return;
        }
        this.valueState.set(nextValue);
        this.setView(day.year, day.month);
        this.valueChange.emit(nextValue);
    }
    isSelectedDay(day) {
        return this.selectionMode === 'single' && isSameCxDay(this.selectedDate$(), day);
    }
    isRangeStartDay(day) {
        return this.selectionMode === 'range' && isSameCxDay(this.rangeStart$(), day);
    }
    isRangeEndDay(day) {
        return this.selectionMode === 'range' && isSameCxDay(this.rangeEnd$(), day);
    }
    isRangePreviewEnd(day) {
        const start = this.rangeStart$();
        const end = this.rangeEnd$();
        const hover = this.rangePreviewEnd$();
        return this.selectionMode === 'range' && !!start && !end && !!hover && isSameCxDay(day, hover) && !isSameCxDay(day, start);
    }
    isInRange(day) {
        if (this.selectionMode !== 'range' || this.isRangeStartDay(day) || this.isRangeEndDay(day)) {
            return false;
        }
        const start = this.rangeStart$();
        const end = this.rangeEnd$();
        if (end) {
            return isCxDayBetween(day, start, end);
        }
        const hover = this.rangePreviewEnd$();
        if (!start || !hover || isSameCxDay(day, hover)) {
            return false;
        }
        return compareCxDays(hover, start) < 0
            ? isCxDayBetween(day, hover, start)
            : isCxDayBetween(day, start, hover);
    }
    isAriaSelectedDay(day) {
        return this.isSelectedDay(day) || this.isRangeStartDay(day) || this.isRangeEndDay(day) || this.isInRange(day);
    }
    onDayHover(day) {
        if (this.selectionMode !== 'range' || this.isOutsideRange(day)) {
            return;
        }
        const nextPreview = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);
        this.rangePreviewEndState.set(nextPreview);
        this.rangePreviewEndChange.emit(nextPreview);
    }
    onDayLeave() {
        this.clearRangePreview();
    }
    onDayFocus(day) {
        if (!this.disabled && !this.isOutsideRange(day)) {
            this.focusedDayKeyState.set(day.key);
        }
    }
    onDayKeydown(event, day) {
        if (this.disabled || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const days = this.calendarDays$();
            const dayIndex = days.findIndex(candidate => candidate.key === day.key);
            if (dayIndex < 0) {
                return;
            }
            const rowStart = Math.floor(dayIndex / 7) * 7;
            const week = days.slice(rowStart, rowStart + 7);
            const orderedWeek = event.key === 'Home' ? week : [...week].reverse();
            const target = orderedWeek.find(candidate => !this.isOutsideRange(candidate));
            if (target) {
                this.moveFocusToDay(target);
            }
            return;
        }
        let dayDelta;
        if (event.key === 'ArrowLeft') {
            dayDelta = -1;
        }
        else if (event.key === 'ArrowRight') {
            dayDelta = 1;
        }
        else if (event.key === 'ArrowUp') {
            dayDelta = -7;
        }
        else if (event.key === 'ArrowDown') {
            dayDelta = 7;
        }
        if (dayDelta !== undefined) {
            event.preventDefault();
            const target = this.addDays(day, dayDelta);
            if (!this.isOutsideRange(target)) {
                this.moveFocusToDay(target);
            }
            return;
        }
        if (event.key !== 'PageUp' && event.key !== 'PageDown') {
            return;
        }
        const monthDelta = (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1);
        const nextMonth = addCxMonths(day.year, day.month, monthDelta);
        const targetDay = Math.min(day.day, getCxDaysInMonth(nextMonth.year, nextMonth.month));
        const target = {
            key: this.dayKey(nextMonth.year, nextMonth.month, targetDay),
            year: nextMonth.year,
            month: nextMonth.month,
            day: targetDay,
            isoDate: '',
            inCurrentMonth: true,
            isToday: false,
        };
        event.preventDefault();
        if (!this.isOutsideRange(target)) {
            this.moveFocusToDay(target);
        }
    }
    dayAriaLabel(day) {
        return calendarDayLabelFormatter.format(new Date(day.year, day.month - 1, day.day, 12, 0, 0, 0));
    }
    isOutsideRange(day) {
        const target = { year: day.year, month: day.month, day: day.day, hours: 0, minutes: 0 };
        const min = this.toDateParts(this.min);
        const max = this.toDateParts(this.max);
        return ((min !== null && compareCxDays(target, min) < 0) ||
            (max !== null && compareCxDays(target, max) > 0) ||
            !!this.disabledDates?.(new Date(day.year, day.month - 1, day.day, 12, 0, 0, 0)));
    }
    setView(year, month) {
        this.viewYearState.set(year);
        this.viewMonthState.set(month);
        this.viewDateChange.emit(new Date(year, month - 1, 1, 0, 0, 0, 0));
    }
    syncViewToDate(value) {
        const source = this.toDateParts(value) ?? getCxTodayParts();
        this.viewYearState.set(source.year);
        this.viewMonthState.set(source.month);
    }
    validDate(value) {
        return value && !Number.isNaN(value.getTime()) ? new Date(value.getTime()) : undefined;
    }
    clearRangePreview() {
        if (!this.rangePreviewEndState()) {
            return;
        }
        this.rangePreviewEndState.set(undefined);
        this.rangePreviewEndChange.emit(undefined);
    }
    toDateParts(value) {
        if (!value || Number.isNaN(value.getTime())) {
            return null;
        }
        return {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            day: value.getDate(),
            hours: value.getHours(),
            minutes: value.getMinutes(),
        };
    }
    resolveTabbableDay() {
        const days = this.calendarDays$();
        const isAvailable = (day) => !!day && !this.isOutsideRange(day);
        const focusedDay = days.find(day => day.key === this.focusedDayKeyState());
        if (isAvailable(focusedDay)) {
            return focusedDay;
        }
        const selectedDates = [
            this.selectedDate$(),
            this.rangeStart$(),
            this.rangeEnd$(),
        ];
        for (const preferredDate of selectedDates) {
            const preferredDay = days.find(day => isSameCxDay(day, preferredDate));
            if (isAvailable(preferredDay)) {
                return preferredDay;
            }
        }
        const today = getCxTodayParts();
        const todayDay = days.find(day => day.inCurrentMonth && isSameCxDay(day, today));
        if (isAvailable(todayDay)) {
            return todayDay;
        }
        return (days.find(day => day.inCurrentMonth && isAvailable(day)) ??
            days.find(day => isAvailable(day)));
    }
    moveFocusToDay(day) {
        this.focusedDayKeyState.set(day.key);
        if (day.year !== this.viewYearState() || day.month !== this.viewMonthState()) {
            this.setView(day.year, day.month);
        }
        this.scheduleDayFocus(day.key);
    }
    scheduleDayFocus(dayKey) {
        if (typeof window === 'undefined') {
            queueMicrotask(() => this.focusDayButton(dayKey));
            return;
        }
        if (this.focusFrame !== undefined) {
            window.cancelAnimationFrame(this.focusFrame);
        }
        this.focusFrame = window.requestAnimationFrame(() => {
            this.focusFrame = undefined;
            this.focusDayButton(dayKey);
        });
    }
    focusDayButton(dayKey) {
        const button = this.host.nativeElement.querySelector(`[data-cx-calendar-day="${dayKey}"]`);
        if (!button || button.disabled) {
            return false;
        }
        button.focus({ preventScroll: true });
        return true;
    }
    addDays(day, delta) {
        const date = new Date(day.year, day.month - 1, day.day + delta, 12, 0, 0, 0);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const dayOfMonth = date.getDate();
        return {
            key: this.dayKey(year, month, dayOfMonth),
            year,
            month,
            day: dayOfMonth,
            isoDate: '',
            inCurrentMonth: month === this.viewMonthState() && year === this.viewYearState(),
            isToday: false,
        };
    }
    dayKey(year, month, day) {
        return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCalendarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxCalendarComponent, isStandalone: true, selector: "cx-calendar", inputs: { variant: "variant", selectionMode: "selectionMode", weekStart: "weekStart", yearRange: "yearRange", disabled: "disabled", min: "min", max: "max", disabledDates: "disabledDates", value: "value", range: "range", viewDate: "viewDate", rangePreviewEnd: "rangePreviewEnd" }, outputs: { valueChange: "valueChange", rangeChange: "rangeChange", rangePreviewEndChange: "rangePreviewEndChange", viewDateChange: "viewDateChange" }, ngImport: i0, template: "<div\n  class=\"cx-calendar\"\n  [class.cx-calendar--disabled]=\"disabled\"\n  [class.cx-calendar--embedded]=\"variant === 'embedded'\"\n  [class.cx-calendar--range]=\"selectionMode === 'range'\"\n>\n  <div class=\"cx-calendar__header\">\n    <cx-icon-button icon=\"arrow-left\" variant=\"transparent\" size=\"small\" ariaLabel=\"Previous month\" [disabled]=\"disabled\" (pressed)=\"onPreviousMonth()\" />\n    <div class=\"cx-calendar__controls\">\n      <cx-dropdown class=\"cx-calendar__select cx-calendar__select--month\" label=\"\" ariaLabel=\"Month\" size=\"small\" [availableValues]=\"monthOptions\" [value]=\"viewMonthValue$()\" [disabled]=\"disabled\" (valueChange)=\"onMonthChange($event)\" />\n      <cx-dropdown class=\"cx-calendar__select cx-calendar__select--year\" label=\"\" ariaLabel=\"Year\" size=\"small\" [availableValues]=\"yearOptions$()\" [value]=\"viewYearValue$()\" [disabled]=\"disabled\" (valueChange)=\"onYearChange($event)\" />\n    </div>\n    <cx-icon-button icon=\"arrow-right\" variant=\"transparent\" size=\"small\" ariaLabel=\"Next month\" [disabled]=\"disabled\" (pressed)=\"onNextMonth()\" />\n  </div>\n\n  <div class=\"cx-calendar__content\">\n    <div class=\"cx-calendar__weekdays\">\n      @for (weekday of weekdayLabels$(); track weekday) {\n        <div class=\"cx-calendar__weekday\">{{ weekday }}</div>\n      }\n    </div>\n\n    <div class=\"cx-calendar__grid\" role=\"grid\" [attr.aria-label]=\"gridAriaLabel$()\" (mouseleave)=\"onDayLeave()\">\n      @for (day of calendarDays$(); track day.key) {\n        <button\n          type=\"button\"\n          class=\"cx-calendar__day\"\n          [class.cx-calendar__day--outside]=\"!day.inCurrentMonth\"\n          [class.cx-calendar__day--today]=\"day.isToday\"\n          [class.cx-calendar__day--selected]=\"isSelectedDay(day)\"\n          [class.cx-calendar__day--range]=\"isInRange(day)\"\n          [class.cx-calendar__day--range-start]=\"isRangeStartDay(day)\"\n          [class.cx-calendar__day--range-end]=\"isRangeEndDay(day)\"\n          [class.cx-calendar__day--range-preview-end]=\"isRangePreviewEnd(day)\"\n          [disabled]=\"disabled || isOutsideRange(day)\"\n          [attr.tabindex]=\"day.key === tabbableDayKey$() ? 0 : -1\"\n          [attr.data-cx-calendar-day]=\"day.key\"\n          [attr.aria-label]=\"dayAriaLabel(day)\"\n          [attr.aria-pressed]=\"isAriaSelectedDay(day)\"\n          [attr.aria-current]=\"day.isToday ? 'date' : null\"\n          (click)=\"onDaySelect(day)\"\n          (focus)=\"onDayFocus(day)\"\n          (keydown)=\"onDayKeydown($event, day)\"\n          (mouseenter)=\"onDayHover(day)\"\n        >\n          {{ day.day }}\n        </button>\n      }\n    </div>\n  </div>\n</div>\n", styles: [":host{display:inline-flex}.cx-calendar{display:inline-flex;width:max-content;flex-direction:column;gap:var(--surface-separation);overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-mid);box-sizing:border-box;padding:var(--surface-separation)}.cx-calendar--embedded{padding:0;border:0;border-radius:0;background:rgba(0,0,0,0);box-shadow:none}.cx-calendar__header,.cx-calendar__controls{display:flex;align-items:center;gap:var(--space-sm)}.cx-calendar__header{display:grid;grid-template-columns:auto minmax(0, 1fr) auto;align-items:center;gap:var(--space-xs);background:var(--surface-alt)}.cx-calendar--embedded .cx-calendar__header{background:rgba(0,0,0,0)}.cx-calendar__controls{min-width:0;display:grid;width:100%;grid-template-columns:minmax(96px, 1fr) 88px;gap:var(--space-xs)}.cx-calendar__select{display:block;width:100%;min-width:0}.cx-calendar__select--month{display:flex;justify-content:flex-end}.cx-calendar__content{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-calendar__weekdays,.cx-calendar__grid{display:grid;grid-template-columns:repeat(7, 32px);justify-content:center;gap:var(--space-xs)}.cx-calendar--range .cx-calendar__weekdays,.cx-calendar--range .cx-calendar__grid{column-gap:0;row-gap:var(--space-xs)}.cx-calendar__weekday{display:flex;height:24px;align-items:center;justify-content:center;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-small)}.cx-calendar__day{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;appearance:none;border:1px solid rgba(0,0,0,0);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);cursor:default;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,border-color var(--motion-fast) ease}.cx-calendar__day:not(:disabled){cursor:pointer}.cx-calendar__day:hover:not(:disabled){background:var(--opacity-mid)}.cx-calendar__day--outside{color:var(--opacity-mid)}.cx-calendar__day--today:not(:disabled){border-color:var(--opacity-mid)}.cx-calendar__day--selected{border-color:var(--choice-control-selected);background:var(--choice-control-selected);color:var(--on-choice-control)}.cx-calendar__day--selected:hover:not(:disabled){background:var(--choice-control-selected-hover)}.cx-calendar__day--range{border-radius:0;background:color-mix(in srgb, var(--choice-control-selected) 22%, transparent)}.cx-calendar__day--range:hover:not(:disabled){background:color-mix(in srgb, var(--choice-control-selected) 38%, transparent)}.cx-calendar__day--range-start,.cx-calendar__day--range-end{border-color:var(--choice-control-selected);border-radius:var(--radius-sm);background:var(--choice-control-selected);color:var(--on-choice-control)}.cx-calendar__day--range-start:hover:not(:disabled),.cx-calendar__day--range-end:hover:not(:disabled){background:var(--choice-control-selected-hover)}.cx-calendar__day--range-preview-end{border-color:var(--choice-control-selected);border-radius:var(--radius-sm)}.cx-calendar__day:disabled,.cx-calendar--disabled{opacity:var(--opacity-disabled, 0.55)}.cx-calendar__day:disabled{color:var(--opacity-mid);-webkit-text-fill-color:var(--opacity-mid)}.cx-calendar--disabled,.cx-calendar--disabled .cx-calendar__day{cursor:default}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxDropdownComponent, selector: "cx-dropdown", inputs: ["label", "ariaLabel", "name", "transparent", "translations", "placeholder", "size", "optional", "disabled", "loading", "loadingMore", "hasMore", "clearable", "selection", "filterMode", "searchable", "creatable", "hint", "validation", "availableValues", "value", "values"], outputs: ["valueChange", "valuesChange", "create", "focusChange", "clear", "openChange", "queryChange", "loadMore"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCalendarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-calendar', imports: [CxIconButtonComponent, CxDropdownComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-calendar\"\n  [class.cx-calendar--disabled]=\"disabled\"\n  [class.cx-calendar--embedded]=\"variant === 'embedded'\"\n  [class.cx-calendar--range]=\"selectionMode === 'range'\"\n>\n  <div class=\"cx-calendar__header\">\n    <cx-icon-button icon=\"arrow-left\" variant=\"transparent\" size=\"small\" ariaLabel=\"Previous month\" [disabled]=\"disabled\" (pressed)=\"onPreviousMonth()\" />\n    <div class=\"cx-calendar__controls\">\n      <cx-dropdown class=\"cx-calendar__select cx-calendar__select--month\" label=\"\" ariaLabel=\"Month\" size=\"small\" [availableValues]=\"monthOptions\" [value]=\"viewMonthValue$()\" [disabled]=\"disabled\" (valueChange)=\"onMonthChange($event)\" />\n      <cx-dropdown class=\"cx-calendar__select cx-calendar__select--year\" label=\"\" ariaLabel=\"Year\" size=\"small\" [availableValues]=\"yearOptions$()\" [value]=\"viewYearValue$()\" [disabled]=\"disabled\" (valueChange)=\"onYearChange($event)\" />\n    </div>\n    <cx-icon-button icon=\"arrow-right\" variant=\"transparent\" size=\"small\" ariaLabel=\"Next month\" [disabled]=\"disabled\" (pressed)=\"onNextMonth()\" />\n  </div>\n\n  <div class=\"cx-calendar__content\">\n    <div class=\"cx-calendar__weekdays\">\n      @for (weekday of weekdayLabels$(); track weekday) {\n        <div class=\"cx-calendar__weekday\">{{ weekday }}</div>\n      }\n    </div>\n\n    <div class=\"cx-calendar__grid\" role=\"grid\" [attr.aria-label]=\"gridAriaLabel$()\" (mouseleave)=\"onDayLeave()\">\n      @for (day of calendarDays$(); track day.key) {\n        <button\n          type=\"button\"\n          class=\"cx-calendar__day\"\n          [class.cx-calendar__day--outside]=\"!day.inCurrentMonth\"\n          [class.cx-calendar__day--today]=\"day.isToday\"\n          [class.cx-calendar__day--selected]=\"isSelectedDay(day)\"\n          [class.cx-calendar__day--range]=\"isInRange(day)\"\n          [class.cx-calendar__day--range-start]=\"isRangeStartDay(day)\"\n          [class.cx-calendar__day--range-end]=\"isRangeEndDay(day)\"\n          [class.cx-calendar__day--range-preview-end]=\"isRangePreviewEnd(day)\"\n          [disabled]=\"disabled || isOutsideRange(day)\"\n          [attr.tabindex]=\"day.key === tabbableDayKey$() ? 0 : -1\"\n          [attr.data-cx-calendar-day]=\"day.key\"\n          [attr.aria-label]=\"dayAriaLabel(day)\"\n          [attr.aria-pressed]=\"isAriaSelectedDay(day)\"\n          [attr.aria-current]=\"day.isToday ? 'date' : null\"\n          (click)=\"onDaySelect(day)\"\n          (focus)=\"onDayFocus(day)\"\n          (keydown)=\"onDayKeydown($event, day)\"\n          (mouseenter)=\"onDayHover(day)\"\n        >\n          {{ day.day }}\n        </button>\n      }\n    </div>\n  </div>\n</div>\n", styles: [":host{display:inline-flex}.cx-calendar{display:inline-flex;width:max-content;flex-direction:column;gap:var(--surface-separation);overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-mid);box-sizing:border-box;padding:var(--surface-separation)}.cx-calendar--embedded{padding:0;border:0;border-radius:0;background:rgba(0,0,0,0);box-shadow:none}.cx-calendar__header,.cx-calendar__controls{display:flex;align-items:center;gap:var(--space-sm)}.cx-calendar__header{display:grid;grid-template-columns:auto minmax(0, 1fr) auto;align-items:center;gap:var(--space-xs);background:var(--surface-alt)}.cx-calendar--embedded .cx-calendar__header{background:rgba(0,0,0,0)}.cx-calendar__controls{min-width:0;display:grid;width:100%;grid-template-columns:minmax(96px, 1fr) 88px;gap:var(--space-xs)}.cx-calendar__select{display:block;width:100%;min-width:0}.cx-calendar__select--month{display:flex;justify-content:flex-end}.cx-calendar__content{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-calendar__weekdays,.cx-calendar__grid{display:grid;grid-template-columns:repeat(7, 32px);justify-content:center;gap:var(--space-xs)}.cx-calendar--range .cx-calendar__weekdays,.cx-calendar--range .cx-calendar__grid{column-gap:0;row-gap:var(--space-xs)}.cx-calendar__weekday{display:flex;height:24px;align-items:center;justify-content:center;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-small)}.cx-calendar__day{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;appearance:none;border:1px solid rgba(0,0,0,0);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);cursor:default;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,border-color var(--motion-fast) ease}.cx-calendar__day:not(:disabled){cursor:pointer}.cx-calendar__day:hover:not(:disabled){background:var(--opacity-mid)}.cx-calendar__day--outside{color:var(--opacity-mid)}.cx-calendar__day--today:not(:disabled){border-color:var(--opacity-mid)}.cx-calendar__day--selected{border-color:var(--choice-control-selected);background:var(--choice-control-selected);color:var(--on-choice-control)}.cx-calendar__day--selected:hover:not(:disabled){background:var(--choice-control-selected-hover)}.cx-calendar__day--range{border-radius:0;background:color-mix(in srgb, var(--choice-control-selected) 22%, transparent)}.cx-calendar__day--range:hover:not(:disabled){background:color-mix(in srgb, var(--choice-control-selected) 38%, transparent)}.cx-calendar__day--range-start,.cx-calendar__day--range-end{border-color:var(--choice-control-selected);border-radius:var(--radius-sm);background:var(--choice-control-selected);color:var(--on-choice-control)}.cx-calendar__day--range-start:hover:not(:disabled),.cx-calendar__day--range-end:hover:not(:disabled){background:var(--choice-control-selected-hover)}.cx-calendar__day--range-preview-end{border-color:var(--choice-control-selected);border-radius:var(--radius-sm)}.cx-calendar__day:disabled,.cx-calendar--disabled{opacity:var(--opacity-disabled, 0.55)}.cx-calendar__day:disabled{color:var(--opacity-mid);-webkit-text-fill-color:var(--opacity-mid)}.cx-calendar--disabled,.cx-calendar--disabled .cx-calendar__day{cursor:default}"] }]
        }], ctorParameters: () => [], propDecorators: { variant: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], weekStart: [{
                type: Input
            }], yearRange: [{
                type: Input
            }], disabled: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], disabledDates: [{
                type: Input
            }], value: [{
                type: Input
            }], range: [{
                type: Input
            }], viewDate: [{
                type: Input
            }], rangePreviewEnd: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], rangeChange: [{
                type: Output
            }], rangePreviewEndChange: [{
                type: Output
            }], viewDateChange: [{
                type: Output
            }] } });
