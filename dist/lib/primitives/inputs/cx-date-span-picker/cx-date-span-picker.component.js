import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, computed, inject, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { CxCalendarComponent } from '../cx-calendar/index.js';
import { CxCheckboxComponent } from '../cx-checkbox/index.js';
import { CxTimeFieldComponent, formatCxTimeValue, parseCxTimeValue, } from '../cx-time-field/index.js';
import { addCxMonths, compareCxDays, formatCxDateDisplay, formatCxDateSpanDisplay, formatCxDateValue, getCxTodayParts, parseCxDateValue, } from '../shared/cx-date.utils.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxDateSpanPickerComponent {
    static nextId = 0;
    host = inject((ElementRef));
    startValueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "startValueState" }] : /* istanbul ignore next */ []));
    endValueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "endValueState" }] : /* istanbul ignore next */ []));
    quickRangesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "quickRangesState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    popoverMaxWidthState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "popoverMaxWidthState" }] : /* istanbul ignore next */ []));
    overlay = new CxFloatingSurfaceController(rect => this.measureOverlay(rect), () => this.popoverRef?.surfaceElement());
    popoverMaxWidth$ = this.popoverMaxWidthState.asReadonly();
    leftViewYearState = signal(getCxTodayParts().year, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "leftViewYearState" }] : /* istanbul ignore next */ []));
    leftViewMonthState = signal(getCxTodayParts().month, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "leftViewMonthState" }] : /* istanbul ignore next */ []));
    rightViewYearState = signal(addCxMonths(getCxTodayParts().year, getCxTodayParts().month, 1).year, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rightViewYearState" }] : /* istanbul ignore next */ []));
    rightViewMonthState = signal(addCxMonths(getCxTodayParts().year, getCxTodayParts().month, 1).month, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rightViewMonthState" }] : /* istanbul ignore next */ []));
    calendarPreviewEndState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "calendarPreviewEndState" }] : /* istanbul ignore next */ []));
    labelId = `cx-date-span-picker-label-${CxDateSpanPickerComponent.nextId}`;
    messagesId = `cx-date-span-picker-messages-${CxDateSpanPickerComponent.nextId}`;
    surfaceId = `cx-date-span-picker-surface-${CxDateSpanPickerComponent.nextId++}`;
    fieldButtonRef;
    popoverRef;
    leftCalendarRef;
    rightCalendarRef;
    dialogFocusFrame;
    label = 'Date span';
    ariaLabel;
    placeholder = 'Select date range';
    hint;
    disabled = false;
    loading = false;
    optional = false;
    size = 'default';
    timeEnabled = false;
    allDayEnabled = true;
    allDayStart = false;
    allDayEnd = false;
    min;
    max;
    maxSpan;
    disabledDates;
    weekStart = 'mon';
    clearable = false;
    closeOnSelect = true;
    set quickRanges(value) {
        this.quickRangesState.set((value ?? []).map(range => ({ ...range })));
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set value(value) {
        this.startValueState.set(value?.start?.trim() ? value.start : undefined);
        this.endValueState.set(value?.end?.trim() ? value.end : undefined);
        this.syncViewToSelection();
    }
    valueChange = new EventEmitter();
    allDayStartChange = new EventEmitter();
    allDayEndChange = new EventEmitter();
    isOpen$ = this.openState.asReadonly();
    quickRanges$ = this.quickRangesState.asReadonly();
    startDate$ = computed(() => parseCxDateValue(this.startValueState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "startDate$" }] : /* istanbul ignore next */ []));
    endDate$ = computed(() => parseCxDateValue(this.endValueState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "endDate$" }] : /* istanbul ignore next */ []));
    calendarRange$ = computed(() => ({
        start: this.toOptionalLocalDate(this.startDate$()),
        end: this.toOptionalLocalDate(this.endDate$()),
    }), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "calendarRange$" }] : /* istanbul ignore next */ []));
    calendarPreviewEnd$ = this.calendarPreviewEndState.asReadonly();
    leftViewDate$ = computed(() => new Date(this.leftViewYearState(), this.leftViewMonthState() - 1, 1, 0, 0, 0, 0), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "leftViewDate$" }] : /* istanbul ignore next */ []));
    rightViewDate$ = computed(() => new Date(this.rightViewYearState(), this.rightViewMonthState() - 1, 1, 0, 0, 0, 0), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rightViewDate$" }] : /* istanbul ignore next */ []));
    calendarDateDisabled = (date) => !this.isDaySelectable({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    });
    displayText$ = computed(() => formatCxDateSpanDisplay(this.startValueState(), this.endValueState()) ?? (this.placeholder.trim() || 'Select date range'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayText$" }] : /* istanbul ignore next */ []));
    showPlaceholder$ = computed(() => !this.startDate$() && !this.endDate$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showPlaceholder$" }] : /* istanbul ignore next */ []));
    startTimeValue$ = computed(() => {
        const startDate = this.startDate$();
        return startDate ? formatCxTimeValue(startDate.hours, startDate.minutes) : '00:00';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "startTimeValue$" }] : /* istanbul ignore next */ []));
    endTimeValue$ = computed(() => {
        const endDate = this.endDate$();
        return endDate ? formatCxTimeValue(endDate.hours, endDate.minutes) : '23:59';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "endTimeValue$" }] : /* istanbul ignore next */ []));
    effectiveAllDayStart$ = computed(() => this.timeEnabled && this.allDayEnabled && this.allDayStart, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "effectiveAllDayStart$" }] : /* istanbul ignore next */ []));
    effectiveAllDayEnd$ = computed(() => this.timeEnabled && this.allDayEnabled && this.allDayEnd, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "effectiveAllDayEnd$" }] : /* istanbul ignore next */ []));
    hasClear$ = computed(() => this.clearable &&
        (!!this.startDate$() || !!this.endDate$()) &&
        !this.disabled &&
        !this.loading, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasClear$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => this.disabled ? [] : normalizeCxValidation(this.validationState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    isLocked$ = () => this.disabled || this.loading;
    isInteractive$ = () => !this.disabled && !this.loading;
    summaryText$ = computed(() => {
        const startText = formatCxDateDisplay(this.startValueState(), this.timeEnabled);
        const endText = formatCxDateDisplay(this.endValueState(), this.timeEnabled);
        if (startText && endText) {
            return `From ${startText} to ${endText}`;
        }
        if (startText) {
            return `From ${startText}`;
        }
        if (endText) {
            return `Until ${endText}`;
        }
        return undefined;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "summaryText$" }] : /* istanbul ignore next */ []));
    get resolvedFieldAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        if (this.label.trim()) {
            return undefined;
        }
        return this.placeholder.trim() || 'Date span';
    }
    get resolvedFieldAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedFieldAriaDescribedBy() {
        return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
    }
    ngAfterViewInit() {
        this.overlay.sync(this.fieldButtonRef?.nativeElement);
        this.overlay.observeTrigger(this.fieldButtonRef?.nativeElement, () => {
            if (this.openState()) {
                this.overlay.sync();
            }
        });
    }
    ngOnDestroy() {
        this.cancelDialogFocus();
        this.overlay.destroy();
    }
    toggleOpen(field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (this.openState()) {
            this.closePopover();
            return;
        }
        this.openState.set(true);
        this.overlay.endSession();
        this.overlay.setTrigger(field);
        this.syncViewToSelection();
        queueMicrotask(() => {
            this.overlay.sync();
        });
        this.scheduleDialogFocus();
    }
    closePopover() {
        if (!this.openState()) {
            return;
        }
        this.cancelDialogFocus();
        this.openState.set(false);
        queueMicrotask(() => {
            const field = this.fieldButtonRef?.nativeElement;
            if (field?.isConnected && !this.isLocked$()) {
                field.focus({ preventScroll: true });
            }
        });
    }
    onFieldKeydown(event, field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggleOpen(field);
            return;
        }
        if (event.key === 'Escape') {
            this.closePopover();
        }
    }
    onCalendarRangeChange(range) {
        if (!this.isInteractive$()) {
            return;
        }
        const currentStart = this.startDate$();
        const currentEnd = this.endDate$();
        const rangeStart = this.toDateParts(range.start);
        const rangeEnd = this.toDateParts(range.end);
        const nextStart = rangeStart ? this.buildBoundaryParts(rangeStart, 'start', currentStart) : undefined;
        const nextEnd = rangeEnd ? this.buildBoundaryParts(rangeEnd, 'end', currentEnd ?? currentStart) : undefined;
        this.commitRange(nextStart, nextEnd);
        if (nextEnd && this.closeOnSelect && !this.timeEnabled) {
            this.closePopover();
        }
    }
    onCalendarRangePreviewEndChange(value) {
        this.calendarPreviewEndState.set(value ? new Date(value.getTime()) : undefined);
    }
    onLeftViewDateChange(value) {
        this.leftViewYearState.set(value.getFullYear());
        this.leftViewMonthState.set(value.getMonth() + 1);
    }
    onRightViewDateChange(value) {
        this.rightViewYearState.set(value.getFullYear());
        this.rightViewMonthState.set(value.getMonth() + 1);
    }
    onQuickRangeSelect(range) {
        if (!this.isInteractive$()) {
            return;
        }
        const start = parseCxDateValue(range.start);
        const end = parseCxDateValue(range.end);
        if (!start || !end) {
            return;
        }
        this.commitRange(start, end);
        if (this.closeOnSelect && !this.timeEnabled) {
            this.closePopover();
        }
    }
    onClear(event) {
        if (!this.hasClear$()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.commitRange(undefined, undefined);
        this.setAllDayStart(false);
        this.setAllDayEnd(false);
    }
    onStartTimeChange(value) {
        if (!this.isInteractive$()) {
            return;
        }
        const startDate = this.startDate$();
        if (!startDate) {
            return;
        }
        const parsedTime = parseCxTimeValue(value);
        if (!parsedTime) {
            return;
        }
        this.commitRange({
            ...startDate,
            hours: parsedTime.hours24,
            minutes: parsedTime.minutes,
        }, this.endDate$() ?? undefined);
    }
    onEndTimeChange(value) {
        if (!this.isInteractive$()) {
            return;
        }
        const endDate = this.endDate$();
        if (!endDate) {
            return;
        }
        const parsedTime = parseCxTimeValue(value);
        if (!parsedTime) {
            return;
        }
        this.commitRange(this.startDate$() ?? undefined, {
            ...endDate,
            hours: parsedTime.hours24,
            minutes: parsedTime.minutes,
        });
    }
    onAllDayStartChange(value) {
        this.setAllDayStart(value);
        if (!value) {
            return;
        }
        const startDate = this.startDate$();
        if (!startDate) {
            return;
        }
        this.commitRange({ ...startDate, hours: 0, minutes: 0 }, this.endDate$() ?? undefined);
    }
    onAllDayEndChange(value) {
        this.setAllDayEnd(value);
        if (!value) {
            return;
        }
        const endDate = this.endDate$();
        if (!endDate) {
            return;
        }
        this.commitRange(this.startDate$() ?? undefined, { ...endDate, hours: 23, minutes: 59 });
    }
    isDaySelectable(day) {
        const today = getCxTodayParts();
        if (typeof this.min === 'number' && compareCxDays(day, this.addDaysToParts(today, Math.trunc(this.min))) < 0) {
            return false;
        }
        if (typeof this.max === 'number' && compareCxDays(day, this.addDaysToParts(today, Math.trunc(this.max))) > 0) {
            return false;
        }
        if (this.disabledDates?.(this.toLocalDate(day))) {
            return false;
        }
        const start = this.startDate$();
        const maxSpan = typeof this.maxSpan === 'number' && this.maxSpan > 0 ? Math.floor(this.maxSpan) : undefined;
        if (maxSpan && start && !this.endDate$() && Math.abs(this.differenceInDays(day, start)) >= maxSpan) {
            return false;
        }
        return true;
    }
    isQuickRangeActive(range) {
        return this.startValueState() === range.start && this.endValueState() === range.end;
    }
    onDocumentPointerDown(event) {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            this.closePopover();
            return;
        }
        if (this.host.nativeElement.contains(target)) {
            return;
        }
        const surface = typeof document !== 'undefined' ? document.getElementById(this.surfaceId) : null;
        if (surface && surface.contains(target)) {
            return;
        }
        if (target instanceof Element && target.closest('[data-cx-popover-surface]')) {
            return;
        }
        this.closePopover();
    }
    onWindowResize() {
        if (this.openState()) {
            this.overlay.sync();
        }
    }
    buildBoundaryParts(date, boundary, fallback) {
        const isAllDay = boundary === 'start' ? this.effectiveAllDayStart$() : this.effectiveAllDayEnd$();
        return {
            year: date.year,
            month: date.month,
            day: date.day,
            hours: isAllDay ? (boundary === 'end' ? 23 : 0) : fallback?.hours ?? (boundary === 'end' && this.timeEnabled ? 23 : 0),
            minutes: isAllDay ? (boundary === 'end' ? 59 : 0) : fallback?.minutes ?? (boundary === 'end' && this.timeEnabled ? 59 : 0),
        };
    }
    commitRange(start, end) {
        const nextValue = {
            start: start ? formatCxDateValue(start, this.timeEnabled) : undefined,
            end: end ? formatCxDateValue(end, this.timeEnabled) : undefined,
        };
        this.startValueState.set(nextValue.start);
        this.endValueState.set(nextValue.end);
        this.calendarPreviewEndState.set(undefined);
        this.valueChange.emit(nextValue);
        this.syncViewToSelection();
    }
    setAllDayStart(value) {
        if (this.allDayStart === value) {
            return;
        }
        this.allDayStart = value;
        this.allDayStartChange.emit(value);
    }
    setAllDayEnd(value) {
        if (this.allDayEnd === value) {
            return;
        }
        this.allDayEnd = value;
        this.allDayEndChange.emit(value);
    }
    syncViewToSelection() {
        const source = this.startDate$() ?? getCxTodayParts();
        const nextRight = addCxMonths(source.year, source.month, 1);
        this.leftViewYearState.set(source.year);
        this.leftViewMonthState.set(source.month);
        this.rightViewYearState.set(nextRight.year);
        this.rightViewMonthState.set(nextRight.month);
    }
    scheduleDialogFocus(attempt = 0) {
        const focusDialog = () => {
            this.dialogFocusFrame = undefined;
            if (!this.openState()) {
                return;
            }
            if (this.leftCalendarRef?.focusActiveDay() || this.rightCalendarRef?.focusActiveDay()) {
                return;
            }
            const fallback = this.popoverRef?.surfaceElement()?.querySelector('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), [tabindex]:not([tabindex="-1"])');
            if (fallback) {
                fallback.focus({ preventScroll: true });
                return;
            }
            if (attempt < 3) {
                this.scheduleDialogFocus(attempt + 1);
            }
        };
        if (typeof window === 'undefined') {
            queueMicrotask(focusDialog);
            return;
        }
        this.cancelDialogFocus();
        this.dialogFocusFrame = window.requestAnimationFrame(focusDialog);
    }
    cancelDialogFocus() {
        if (typeof window !== 'undefined' && this.dialogFocusFrame !== undefined) {
            window.cancelAnimationFrame(this.dialogFocusFrame);
        }
        this.dialogFocusFrame = undefined;
    }
    measureOverlay(_rect) {
        const controllerSize = this.readLengthToken('--controller-size', 32);
        const spaceXs = this.readLengthToken('--space-xs', 4);
        const spaceSm = this.readLengthToken('--space-sm', 8);
        const spaceMd = this.readLengthToken('--space-md', 16);
        const calendarWidth = controllerSize * 8.75;
        const calendarGap = spaceSm + spaceXs;
        const surfacePadding = spaceSm * 2;
        const quickRangeWidth = this.quickRangesState().length > 0 ? controllerSize * 4 + spaceSm + spaceXs + spaceSm : 0;
        const estimatedWidth = calendarWidth * 2 + calendarGap + surfacePadding + spaceSm + quickRangeWidth;
        this.popoverMaxWidthState.set(estimatedWidth);
        return {
            width: estimatedWidth,
            estimatedHeight: this.timeEnabled ? controllerSize * 13 : controllerSize * 10.5,
            align: 'start',
            viewportPadding: spaceMd,
            gap: spaceSm,
        };
    }
    readLengthToken(name, fallback) {
        const rawValue = window.getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim();
        const parsedValue = Number.parseFloat(rawValue);
        return Number.isFinite(parsedValue) ? parsedValue : fallback;
    }
    addDaysToParts(parts, delta) {
        const next = new Date(parts.year, parts.month - 1, parts.day + delta, 12, 0, 0, 0);
        return {
            year: next.getFullYear(),
            month: next.getMonth() + 1,
            day: next.getDate(),
            hours: 0,
            minutes: 0,
        };
    }
    differenceInDays(a, b) {
        const aDate = this.toLocalDate(a);
        const bDate = this.toLocalDate(b);
        return Math.round((aDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    toLocalDate(parts) {
        return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
    }
    toOptionalLocalDate(parts) {
        return parts ? this.toLocalDate(parts) : undefined;
    }
    toDateParts(value) {
        if (!value || Number.isNaN(value.getTime())) {
            return undefined;
        }
        return {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            day: value.getDate(),
            hours: 0,
            minutes: 0,
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDateSpanPickerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDateSpanPickerComponent, isStandalone: true, selector: "cx-date-span-picker", inputs: { label: "label", ariaLabel: "ariaLabel", placeholder: "placeholder", hint: "hint", disabled: "disabled", loading: "loading", optional: "optional", size: "size", timeEnabled: "timeEnabled", allDayEnabled: "allDayEnabled", allDayStart: "allDayStart", allDayEnd: "allDayEnd", min: "min", max: "max", maxSpan: "maxSpan", disabledDates: "disabledDates", weekStart: "weekStart", clearable: "clearable", closeOnSelect: "closeOnSelect", quickRanges: "quickRanges", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", allDayStartChange: "allDayStartChange", allDayEndChange: "allDayEndChange" }, host: { listeners: { "document:pointerdown": "onDocumentPointerDown($event)", "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "fieldButtonRef", first: true, predicate: ["fieldButton"], descendants: true, read: ElementRef }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }, { propertyName: "leftCalendarRef", first: true, predicate: ["leftCalendar"], descendants: true }, { propertyName: "rightCalendarRef", first: true, predicate: ["rightCalendar"], descendants: true }], ngImport: i0, template: "<div class=\"cx-date-span-picker\">\n  @if (label.trim()) {\n    <div class=\"cx-date-span-picker__header\">\n      <div class=\"cx-date-span-picker__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-date-span-picker__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-date-span-picker__field-wrap\"\n    [class.cx-date-span-picker__field-wrap--clearable]=\"hasClear$()\"\n    [class.cx-date-span-picker__field-wrap--small]=\"size === 'small'\"\n    [class.cx-date-span-picker__field-wrap--large]=\"size === 'large'\"\n  >\n    <button\n      #fieldButton\n      type=\"button\"\n      class=\"cx-date-span-picker__field\"\n      [class.cx-date-span-picker__field--open]=\"isOpen$()\"\n      [class.cx-date-span-picker__field--disabled]=\"disabled\"\n      [class.cx-date-span-picker__field--loading]=\"loading\"\n      [class.cx-date-span-picker__field--error]=\"hasError$()\"\n      [disabled]=\"isLocked$()\"\n      [attr.aria-expanded]=\"isOpen$()\"\n      [attr.aria-controls]=\"isOpen$() ? surfaceId : null\"\n      [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n      [attr.aria-label]=\"resolvedFieldAriaLabel\"\n      [attr.aria-busy]=\"loading ? 'true' : null\"\n      aria-haspopup=\"dialog\"\n      [cxTooltip]=\"displayText$()\"\n      [cxTooltipOverflow]=\"true\"\n      (click)=\"toggleOpen(fieldButton)\"\n      (keydown)=\"onFieldKeydown($event, fieldButton)\"\n    >\n      <cx-icon class=\"cx-date-span-picker__field-icon\" icon=\"calendar\" size=\"16\" />\n      <span\n        class=\"cx-date-span-picker__field-text\"\n        [class.cx-date-span-picker__field-text--placeholder]=\"showPlaceholder$()\"\n        data-cx-tooltip-overflow\n      >\n        {{ displayText$() }}\n      </span>\n    </button>\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-date-span-picker__clear\" aria-label=\"Clear date span\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" size=\"16\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-date-span-picker__messages\" [id]=\"messagesId\">\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      } @else if (showHint$()) {\n        <div class=\"cx-date-span-picker__hint\">{{ hint!.trim() }}</div>\n      }\n    </div>\n  }\n\n  @if (isOpen$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"surfaceId\"\n      [width]=\"overlay.width$()\"\n      [maxWidth]=\"popoverMaxWidth$()\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [role]=\"'dialog'\"\n      [ariaLabel]=\"'Choose date span'\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div\n        class=\"cx-date-span-picker__surface-inner\"\n        [class.cx-date-span-picker__surface-inner--with-quick-ranges]=\"quickRanges$().length > 0\"\n      >\n        @if (quickRanges$().length > 0) {\n          <div class=\"cx-date-span-picker__quick-ranges\">\n            @for (range of quickRanges$(); track range.id) {\n              <button\n                type=\"button\"\n                class=\"cx-date-span-picker__quick-range\"\n                [class.cx-date-span-picker__quick-range--active]=\"isQuickRangeActive(range)\"\n                (click)=\"onQuickRangeSelect(range)\"\n              >\n                {{ range.label }}\n              </button>\n            }\n          </div>\n        }\n\n        <div class=\"cx-date-span-picker__main\">\n          <div class=\"cx-date-span-picker__calendars\">\n            <cx-calendar\n              #leftCalendar\n              class=\"cx-date-span-picker__calendar\"\n              variant=\"embedded\"\n              selectionMode=\"range\"\n              [range]=\"calendarRange$()\"\n              [rangePreviewEnd]=\"calendarPreviewEnd$()\"\n              [viewDate]=\"leftViewDate$()\"\n              [weekStart]=\"weekStart\"\n              [yearRange]=\"12\"\n              [disabled]=\"isLocked$()\"\n              [disabledDates]=\"calendarDateDisabled\"\n              (rangeChange)=\"onCalendarRangeChange($event)\"\n              (rangePreviewEndChange)=\"onCalendarRangePreviewEndChange($event)\"\n              (viewDateChange)=\"onLeftViewDateChange($event)\"\n            />\n\n            <cx-calendar\n              #rightCalendar\n              class=\"cx-date-span-picker__calendar\"\n              variant=\"embedded\"\n              selectionMode=\"range\"\n              [range]=\"calendarRange$()\"\n              [rangePreviewEnd]=\"calendarPreviewEnd$()\"\n              [viewDate]=\"rightViewDate$()\"\n              [weekStart]=\"weekStart\"\n              [yearRange]=\"12\"\n              [disabled]=\"isLocked$()\"\n              [disabledDates]=\"calendarDateDisabled\"\n              (rangeChange)=\"onCalendarRangeChange($event)\"\n              (rangePreviewEndChange)=\"onCalendarRangePreviewEndChange($event)\"\n              (viewDateChange)=\"onRightViewDateChange($event)\"\n            />\n          </div>\n\n          @if (timeEnabled) {\n            <div class=\"cx-date-span-picker__time-island\">\n              <div class=\"cx-date-span-picker__time-row\">\n                <div class=\"cx-date-span-picker__time-cell\">\n                  <cx-time-field\n                    class=\"cx-date-span-picker__time\"\n                    label=\"\"\n                    ariaLabel=\"Start time\"\n                    [value]=\"startTimeValue$()\"\n                    [disabled]=\"isLocked$() || !startDate$() || effectiveAllDayStart$()\"\n                    [loading]=\"loading\"\n                    (valueChange)=\"onStartTimeChange($event)\"\n                  />\n                  @if (allDayEnabled) {\n                    <cx-checkbox\n                      text=\"All day\"\n                      [selected]=\"effectiveAllDayStart$()\"\n                      [disabled]=\"loading\"\n                      (selectedChange)=\"onAllDayStartChange($event)\"\n                    />\n                  }\n                </div>\n\n                <div class=\"cx-date-span-picker__time-cell\">\n                  <cx-time-field\n                    class=\"cx-date-span-picker__time\"\n                    label=\"\"\n                    ariaLabel=\"End time\"\n                    [value]=\"endTimeValue$()\"\n                    [disabled]=\"isLocked$() || !endDate$() || effectiveAllDayEnd$()\"\n                    [loading]=\"loading\"\n                    (valueChange)=\"onEndTimeChange($event)\"\n                  />\n                  @if (allDayEnabled) {\n                    <cx-checkbox\n                      text=\"All day\"\n                      [selected]=\"effectiveAllDayEnd$()\"\n                      [disabled]=\"loading\"\n                      (selectedChange)=\"onAllDayEndChange($event)\"\n                    />\n                  }\n                </div>\n              </div>\n            </div>\n          }\n\n          @if (summaryText$(); as summaryText) {\n            <div class=\"cx-date-span-picker__summary\">{{ summaryText }}</div>\n          }\n        </div>\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-block;width:calc(var(--controller-size)*8 + var(--space-lg));max-width:100%}.cx-date-span-picker{display:flex;width:100%;flex-direction:column;gap:var(--space-xs)}.cx-date-span-picker__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-date-span-picker__label,.cx-date-span-picker__optional,.cx-date-span-picker__hint{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-date-span-picker__label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-date-span-picker__optional{color:var(--opacity-high);font-weight:var(--font-weight-regular)}.cx-date-span-picker__field-wrap{position:relative;width:100%}.cx-date-span-picker__field{display:flex;width:100%;height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;box-sizing:border-box;cursor:pointer;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-date-span-picker__field-wrap--clearable .cx-date-span-picker__field{padding-inline-end:calc(var(--space-sm) + var(--controller-size-small))}.cx-date-span-picker__field-wrap--small .cx-date-span-picker__field{height:var(--controller-size-small)}.cx-date-span-picker__field-wrap--large .cx-date-span-picker__field{height:calc(var(--controller-size) + var(--space-md))}.cx-date-span-picker__field:hover:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error),.cx-date-span-picker__field:focus:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error),.cx-date-span-picker__field--open:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error){border-color:var(--opacity-mid);outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-date-span-picker__field:focus:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-span-picker__field--open{border-color:var(--border-open)}.cx-date-span-picker__field--disabled{cursor:default;opacity:var(--opacity-disabled)}.cx-date-span-picker__field--loading{cursor:default}.cx-date-span-picker__field--error{border-color:var(--danger)}.cx-date-span-picker__field-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-date-span-picker__field-text{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-date-span-picker__field-wrap--small .cx-date-span-picker__field-text{font-size:var(--font-size-body-sm)}.cx-date-span-picker__field-wrap--large .cx-date-span-picker__field-text{font-size:var(--font-size-body-lg)}.cx-date-span-picker__field-text--placeholder{color:var(--placeholder)}.cx-date-span-picker__clear{position:absolute;top:50%;right:var(--space-xs);display:flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transform:translateY(-50%);transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-date-span-picker__clear:hover{background:var(--opacity-mid);color:var(--ink)}.cx-date-span-picker__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-span-picker__messages{display:flex;flex-direction:column;gap:var(--space-xs)}.cx-date-span-picker__hint{color:var(--opacity-high);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-date-span-picker__surface-inner{display:flex;flex-flow:row wrap;gap:var(--space-xs);box-sizing:border-box}.cx-date-span-picker__quick-ranges{display:flex;min-width:calc(var(--controller-size)*4 + var(--space-sm) + var(--space-xs));flex-direction:column;gap:var(--space-2xs);padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-date-span-picker__quick-range{display:flex;height:var(--controller-size);align-items:center;padding:0 calc(var(--space-sm) + var(--space-xs));border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-align:left;cursor:pointer;transition:background-color var(--motion-fast) ease}.cx-date-span-picker__quick-range:hover{background:var(--opacity-low)}.cx-date-span-picker__quick-range--active,.cx-date-span-picker__quick-range--active:hover{background:color-mix(in srgb, var(--choice-control-selected) 22%, transparent);color:var(--ink);font-weight:var(--font-weight-bold)}.cx-date-span-picker__main{display:flex;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-date-span-picker__calendars{display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-xs)}.cx-date-span-picker__calendar{display:inline-flex;flex:0 0 auto}.cx-date-span-picker__time-island{padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-date-span-picker__time-row{display:flex;gap:calc(var(--space-sm) + var(--space-xs))}.cx-date-span-picker__time-cell{display:flex;min-width:0;flex:1 1 0;align-items:center;gap:var(--space-sm)}.cx-date-span-picker__time{flex:1 1 0;min-width:0}.cx-date-span-picker__summary{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}"], dependencies: [{ kind: "component", type: CxCalendarComponent, selector: "cx-calendar", inputs: ["variant", "selectionMode", "weekStart", "yearRange", "disabled", "min", "max", "disabledDates", "value", "range", "viewDate", "rangePreviewEnd"], outputs: ["valueChange", "rangeChange", "rangePreviewEndChange", "viewDateChange"] }, { kind: "component", type: CxCheckboxComponent, selector: "cx-checkbox", inputs: ["text", "ariaLabel", "hint", "disabled", "selected", "value"], outputs: ["selectedChange", "valueChange", "focusChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxTimeFieldComponent, selector: "cx-time-field", inputs: ["label", "ariaLabel", "hourAriaLabel", "minuteAriaLabel", "optional", "disabled", "loading", "clearable", "hint", "mode", "size", "minuteStep", "min", "max", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDateSpanPickerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-date-span-picker', imports: [
                        CxCalendarComponent,
                        CxCheckboxComponent,
                        CxIconComponent,
                        CxPopoverComponent,
                        CxTooltipDirective,
                        CxTimeFieldComponent,
                        CxValidationMessageComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-date-span-picker\">\n  @if (label.trim()) {\n    <div class=\"cx-date-span-picker__header\">\n      <div class=\"cx-date-span-picker__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-date-span-picker__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-date-span-picker__field-wrap\"\n    [class.cx-date-span-picker__field-wrap--clearable]=\"hasClear$()\"\n    [class.cx-date-span-picker__field-wrap--small]=\"size === 'small'\"\n    [class.cx-date-span-picker__field-wrap--large]=\"size === 'large'\"\n  >\n    <button\n      #fieldButton\n      type=\"button\"\n      class=\"cx-date-span-picker__field\"\n      [class.cx-date-span-picker__field--open]=\"isOpen$()\"\n      [class.cx-date-span-picker__field--disabled]=\"disabled\"\n      [class.cx-date-span-picker__field--loading]=\"loading\"\n      [class.cx-date-span-picker__field--error]=\"hasError$()\"\n      [disabled]=\"isLocked$()\"\n      [attr.aria-expanded]=\"isOpen$()\"\n      [attr.aria-controls]=\"isOpen$() ? surfaceId : null\"\n      [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n      [attr.aria-label]=\"resolvedFieldAriaLabel\"\n      [attr.aria-busy]=\"loading ? 'true' : null\"\n      aria-haspopup=\"dialog\"\n      [cxTooltip]=\"displayText$()\"\n      [cxTooltipOverflow]=\"true\"\n      (click)=\"toggleOpen(fieldButton)\"\n      (keydown)=\"onFieldKeydown($event, fieldButton)\"\n    >\n      <cx-icon class=\"cx-date-span-picker__field-icon\" icon=\"calendar\" size=\"16\" />\n      <span\n        class=\"cx-date-span-picker__field-text\"\n        [class.cx-date-span-picker__field-text--placeholder]=\"showPlaceholder$()\"\n        data-cx-tooltip-overflow\n      >\n        {{ displayText$() }}\n      </span>\n    </button>\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-date-span-picker__clear\" aria-label=\"Clear date span\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" size=\"16\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-date-span-picker__messages\" [id]=\"messagesId\">\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      } @else if (showHint$()) {\n        <div class=\"cx-date-span-picker__hint\">{{ hint!.trim() }}</div>\n      }\n    </div>\n  }\n\n  @if (isOpen$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"surfaceId\"\n      [width]=\"overlay.width$()\"\n      [maxWidth]=\"popoverMaxWidth$()\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [role]=\"'dialog'\"\n      [ariaLabel]=\"'Choose date span'\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div\n        class=\"cx-date-span-picker__surface-inner\"\n        [class.cx-date-span-picker__surface-inner--with-quick-ranges]=\"quickRanges$().length > 0\"\n      >\n        @if (quickRanges$().length > 0) {\n          <div class=\"cx-date-span-picker__quick-ranges\">\n            @for (range of quickRanges$(); track range.id) {\n              <button\n                type=\"button\"\n                class=\"cx-date-span-picker__quick-range\"\n                [class.cx-date-span-picker__quick-range--active]=\"isQuickRangeActive(range)\"\n                (click)=\"onQuickRangeSelect(range)\"\n              >\n                {{ range.label }}\n              </button>\n            }\n          </div>\n        }\n\n        <div class=\"cx-date-span-picker__main\">\n          <div class=\"cx-date-span-picker__calendars\">\n            <cx-calendar\n              #leftCalendar\n              class=\"cx-date-span-picker__calendar\"\n              variant=\"embedded\"\n              selectionMode=\"range\"\n              [range]=\"calendarRange$()\"\n              [rangePreviewEnd]=\"calendarPreviewEnd$()\"\n              [viewDate]=\"leftViewDate$()\"\n              [weekStart]=\"weekStart\"\n              [yearRange]=\"12\"\n              [disabled]=\"isLocked$()\"\n              [disabledDates]=\"calendarDateDisabled\"\n              (rangeChange)=\"onCalendarRangeChange($event)\"\n              (rangePreviewEndChange)=\"onCalendarRangePreviewEndChange($event)\"\n              (viewDateChange)=\"onLeftViewDateChange($event)\"\n            />\n\n            <cx-calendar\n              #rightCalendar\n              class=\"cx-date-span-picker__calendar\"\n              variant=\"embedded\"\n              selectionMode=\"range\"\n              [range]=\"calendarRange$()\"\n              [rangePreviewEnd]=\"calendarPreviewEnd$()\"\n              [viewDate]=\"rightViewDate$()\"\n              [weekStart]=\"weekStart\"\n              [yearRange]=\"12\"\n              [disabled]=\"isLocked$()\"\n              [disabledDates]=\"calendarDateDisabled\"\n              (rangeChange)=\"onCalendarRangeChange($event)\"\n              (rangePreviewEndChange)=\"onCalendarRangePreviewEndChange($event)\"\n              (viewDateChange)=\"onRightViewDateChange($event)\"\n            />\n          </div>\n\n          @if (timeEnabled) {\n            <div class=\"cx-date-span-picker__time-island\">\n              <div class=\"cx-date-span-picker__time-row\">\n                <div class=\"cx-date-span-picker__time-cell\">\n                  <cx-time-field\n                    class=\"cx-date-span-picker__time\"\n                    label=\"\"\n                    ariaLabel=\"Start time\"\n                    [value]=\"startTimeValue$()\"\n                    [disabled]=\"isLocked$() || !startDate$() || effectiveAllDayStart$()\"\n                    [loading]=\"loading\"\n                    (valueChange)=\"onStartTimeChange($event)\"\n                  />\n                  @if (allDayEnabled) {\n                    <cx-checkbox\n                      text=\"All day\"\n                      [selected]=\"effectiveAllDayStart$()\"\n                      [disabled]=\"loading\"\n                      (selectedChange)=\"onAllDayStartChange($event)\"\n                    />\n                  }\n                </div>\n\n                <div class=\"cx-date-span-picker__time-cell\">\n                  <cx-time-field\n                    class=\"cx-date-span-picker__time\"\n                    label=\"\"\n                    ariaLabel=\"End time\"\n                    [value]=\"endTimeValue$()\"\n                    [disabled]=\"isLocked$() || !endDate$() || effectiveAllDayEnd$()\"\n                    [loading]=\"loading\"\n                    (valueChange)=\"onEndTimeChange($event)\"\n                  />\n                  @if (allDayEnabled) {\n                    <cx-checkbox\n                      text=\"All day\"\n                      [selected]=\"effectiveAllDayEnd$()\"\n                      [disabled]=\"loading\"\n                      (selectedChange)=\"onAllDayEndChange($event)\"\n                    />\n                  }\n                </div>\n              </div>\n            </div>\n          }\n\n          @if (summaryText$(); as summaryText) {\n            <div class=\"cx-date-span-picker__summary\">{{ summaryText }}</div>\n          }\n        </div>\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-block;width:calc(var(--controller-size)*8 + var(--space-lg));max-width:100%}.cx-date-span-picker{display:flex;width:100%;flex-direction:column;gap:var(--space-xs)}.cx-date-span-picker__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-date-span-picker__label,.cx-date-span-picker__optional,.cx-date-span-picker__hint{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-date-span-picker__label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-date-span-picker__optional{color:var(--opacity-high);font-weight:var(--font-weight-regular)}.cx-date-span-picker__field-wrap{position:relative;width:100%}.cx-date-span-picker__field{display:flex;width:100%;height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;box-sizing:border-box;cursor:pointer;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-date-span-picker__field-wrap--clearable .cx-date-span-picker__field{padding-inline-end:calc(var(--space-sm) + var(--controller-size-small))}.cx-date-span-picker__field-wrap--small .cx-date-span-picker__field{height:var(--controller-size-small)}.cx-date-span-picker__field-wrap--large .cx-date-span-picker__field{height:calc(var(--controller-size) + var(--space-md))}.cx-date-span-picker__field:hover:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error),.cx-date-span-picker__field:focus:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error),.cx-date-span-picker__field--open:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error){border-color:var(--opacity-mid);outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-date-span-picker__field:focus:not(.cx-date-span-picker__field--disabled):not(.cx-date-span-picker__field--loading):not(.cx-date-span-picker__field--error){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-span-picker__field--open{border-color:var(--border-open)}.cx-date-span-picker__field--disabled{cursor:default;opacity:var(--opacity-disabled)}.cx-date-span-picker__field--loading{cursor:default}.cx-date-span-picker__field--error{border-color:var(--danger)}.cx-date-span-picker__field-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-date-span-picker__field-text{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-date-span-picker__field-wrap--small .cx-date-span-picker__field-text{font-size:var(--font-size-body-sm)}.cx-date-span-picker__field-wrap--large .cx-date-span-picker__field-text{font-size:var(--font-size-body-lg)}.cx-date-span-picker__field-text--placeholder{color:var(--placeholder)}.cx-date-span-picker__clear{position:absolute;top:50%;right:var(--space-xs);display:flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transform:translateY(-50%);transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-date-span-picker__clear:hover{background:var(--opacity-mid);color:var(--ink)}.cx-date-span-picker__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-span-picker__messages{display:flex;flex-direction:column;gap:var(--space-xs)}.cx-date-span-picker__hint{color:var(--opacity-high);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-date-span-picker__surface-inner{display:flex;flex-flow:row wrap;gap:var(--space-xs);box-sizing:border-box}.cx-date-span-picker__quick-ranges{display:flex;min-width:calc(var(--controller-size)*4 + var(--space-sm) + var(--space-xs));flex-direction:column;gap:var(--space-2xs);padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-date-span-picker__quick-range{display:flex;height:var(--controller-size);align-items:center;padding:0 calc(var(--space-sm) + var(--space-xs));border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-align:left;cursor:pointer;transition:background-color var(--motion-fast) ease}.cx-date-span-picker__quick-range:hover{background:var(--opacity-low)}.cx-date-span-picker__quick-range--active,.cx-date-span-picker__quick-range--active:hover{background:color-mix(in srgb, var(--choice-control-selected) 22%, transparent);color:var(--ink);font-weight:var(--font-weight-bold)}.cx-date-span-picker__main{display:flex;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-date-span-picker__calendars{display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-xs)}.cx-date-span-picker__calendar{display:inline-flex;flex:0 0 auto}.cx-date-span-picker__time-island{padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-date-span-picker__time-row{display:flex;gap:calc(var(--space-sm) + var(--space-xs))}.cx-date-span-picker__time-cell{display:flex;min-width:0;flex:1 1 0;align-items:center;gap:var(--space-sm)}.cx-date-span-picker__time{flex:1 1 0;min-width:0}.cx-date-span-picker__summary{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}"] }]
        }], propDecorators: { fieldButtonRef: [{
                type: ViewChild,
                args: ['fieldButton', { read: ElementRef }]
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], leftCalendarRef: [{
                type: ViewChild,
                args: ['leftCalendar']
            }], rightCalendarRef: [{
                type: ViewChild,
                args: ['rightCalendar']
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], hint: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], optional: [{
                type: Input
            }], size: [{
                type: Input
            }], timeEnabled: [{
                type: Input
            }], allDayEnabled: [{
                type: Input
            }], allDayStart: [{
                type: Input
            }], allDayEnd: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], maxSpan: [{
                type: Input
            }], disabledDates: [{
                type: Input
            }], weekStart: [{
                type: Input
            }], clearable: [{
                type: Input
            }], closeOnSelect: [{
                type: Input
            }], quickRanges: [{
                type: Input
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], allDayStartChange: [{
                type: Output
            }], allDayEndChange: [{
                type: Output
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
