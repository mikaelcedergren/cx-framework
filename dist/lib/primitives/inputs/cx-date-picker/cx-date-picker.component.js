import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, computed, inject, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { CxCalendarComponent } from '../cx-calendar/index.js';
import { CxCheckboxComponent } from '../cx-checkbox/index.js';
import { CxTimeFieldComponent, formatCxTimeValue, parseCxTimeValue, } from '../cx-time-field/index.js';
import { compareCxDays, formatCxDateDisplay, formatCxDateValue, parseCxDateValue, } from '../shared/cx-date.utils.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxDatePickerComponent {
    static nextId = 0;
    host = inject((ElementRef));
    valueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    overlay = new CxFloatingSurfaceController(rect => this.measureOverlay(rect));
    labelId = `cx-date-picker-label-${CxDatePickerComponent.nextId}`;
    messagesId = `cx-date-picker-messages-${CxDatePickerComponent.nextId}`;
    surfaceId = `cx-date-picker-surface-${CxDatePickerComponent.nextId++}`;
    fieldRef;
    label = 'Date';
    hint;
    optional = false;
    ariaLabel;
    placeholder = 'Select date';
    size = 'default';
    weekStart = 'mon';
    yearRange = 50;
    min;
    max;
    timeEnabled = false;
    allDayEnabled = false;
    allDay = false;
    disabled = false;
    loading = false;
    clearable = false;
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set value(value) {
        this.valueState.set(value?.trim() ? value : undefined);
    }
    valueChange = new EventEmitter();
    clear = new EventEmitter();
    focusChange = new EventEmitter();
    isOpen$ = this.openState.asReadonly();
    focused$ = this.focusedState.asReadonly();
    selectedDate$ = computed(() => parseCxDateValue(this.valueState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedDate$" }] : /* istanbul ignore next */ []));
    minDate$ = computed(() => parseCxDateValue(this.min), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minDate$" }] : /* istanbul ignore next */ []));
    maxDate$ = computed(() => parseCxDateValue(this.max), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxDate$" }] : /* istanbul ignore next */ []));
    calendarValue$ = computed(() => this.toLocalDate(this.selectedDate$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "calendarValue$" }] : /* istanbul ignore next */ []));
    calendarMin$ = computed(() => this.toLocalDate(this.minDate$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "calendarMin$" }] : /* istanbul ignore next */ []));
    calendarMax$ = computed(() => this.toLocalDate(this.maxDate$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "calendarMax$" }] : /* istanbul ignore next */ []));
    effectiveAllDay$ = computed(() => this.timeEnabled && this.allDayEnabled && this.allDay, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "effectiveAllDay$" }] : /* istanbul ignore next */ []));
    displayText$ = computed(() => formatCxDateDisplay(this.valueState(), this.timeEnabled && !this.effectiveAllDay$()) ??
        (this.placeholder.trim() || 'Select date'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayText$" }] : /* istanbul ignore next */ []));
    showPlaceholder$ = computed(() => !this.selectedDate$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showPlaceholder$" }] : /* istanbul ignore next */ []));
    selectedTimeValue$ = computed(() => {
        const selectedDate = this.selectedDate$();
        if (!selectedDate) {
            return '00:00';
        }
        return formatCxTimeValue(selectedDate.hours, selectedDate.minutes);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedTimeValue$" }] : /* istanbul ignore next */ []));
    hasClear$ = computed(() => this.clearable && !!this.selectedDate$() && !this.disabled && !this.loading, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasClear$" }] : /* istanbul ignore next */ []));
    outOfRange$ = computed(() => {
        const selectedDate = this.selectedDate$();
        if (!selectedDate) {
            return false;
        }
        return this.isOutsideRange(selectedDate);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "outOfRange$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => {
        if (this.disabled) {
            return [];
        }
        const explicitValidation = normalizeCxValidation(this.validationState());
        if (explicitValidation.length > 0) {
            return explicitValidation;
        }
        if (this.outOfRange$()) {
            return [{
                    id: 'error:Date must be within the allowed range.',
                    type: 'error',
                    message: 'Date must be within the allowed range.',
                }];
        }
        return [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    isLocked$ = () => this.disabled || this.loading;
    isInteractive$ = () => !this.disabled && !this.loading;
    get resolvedFieldAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        if (this.label.trim()) {
            return undefined;
        }
        return 'Date';
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
        this.overlay.sync(this.fieldRef?.nativeElement);
        this.overlay.observeTrigger(this.fieldRef?.nativeElement, () => {
            if (this.openState()) {
                this.overlay.sync();
            }
        });
    }
    ngOnDestroy() {
        this.overlay.destroy();
    }
    toggleOpen(field) {
        if (!this.isInteractive$()) {
            return;
        }
        const nextOpen = !this.openState();
        this.openState.set(nextOpen);
        if (!nextOpen) {
            return;
        }
        this.overlay.endSession();
        this.overlay.setTrigger(field);
        queueMicrotask(() => {
            this.overlay.sync();
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
            this.openState.set(false);
        }
    }
    onFieldFocus(focused) {
        if (this.disabled || this.loading || this.focusedState() === focused) {
            return;
        }
        this.focusedState.set(focused);
        this.focusChange.emit(focused);
    }
    onClear(event) {
        if (!this.hasClear$()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.valueState.set(undefined);
        this.openState.set(false);
        this.valueChange.emit(undefined);
        this.clear.emit();
    }
    onCalendarValueChange(value) {
        if (!this.isInteractive$() || !value) {
            return;
        }
        const currentValue = this.selectedDate$();
        const nextValue = {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            day: value.getDate(),
            hours: currentValue?.hours ?? 0,
            minutes: currentValue?.minutes ?? 0,
        };
        if (this.isOutsideRange(nextValue)) {
            return;
        }
        this.commitValue(nextValue);
        if (!this.timeEnabled) {
            this.openState.set(false);
        }
    }
    onTimeValueChange(value) {
        if (!this.isInteractive$()) {
            return;
        }
        const selectedDate = this.selectedDate$();
        if (!selectedDate) {
            return;
        }
        const parsedTime = parseCxTimeValue(value);
        if (!parsedTime) {
            return;
        }
        this.commitValue({
            ...selectedDate,
            hours: parsedTime.hours24,
            minutes: parsedTime.minutes,
        });
    }
    onAllDayChange(allDay) {
        if (!this.isInteractive$()) {
            return;
        }
        this.allDay = allDay;
        const selectedDate = this.selectedDate$();
        if (selectedDate) {
            this.commitValue(selectedDate);
        }
    }
    isOutsideRange(day) {
        const target = { year: day.year, month: day.month, day: day.day, hours: 0, minutes: 0 };
        const min = this.minDate$();
        const max = this.maxDate$();
        return (min !== null && compareCxDays(target, min) < 0) || (max !== null && compareCxDays(target, max) > 0);
    }
    onDocumentPointerDown(event) {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            this.openState.set(false);
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
        this.openState.set(false);
    }
    onWindowResize() {
        if (this.openState()) {
            this.overlay.sync();
        }
    }
    commitValue(parts) {
        const nextValue = formatCxDateValue(parts, this.timeEnabled && !this.effectiveAllDay$());
        this.valueState.set(nextValue);
        this.valueChange.emit(nextValue);
    }
    measureOverlay(_rect) {
        const controllerSize = this.readLengthToken('--controller-size', 32);
        const viewportPadding = this.readLengthToken('--space-md', 16);
        const gap = this.readLengthToken('--space-sm', 8);
        return {
            width: controllerSize * 9.25,
            estimatedHeight: this.timeEnabled ? controllerSize * 12.25 : controllerSize * 9.5,
            align: 'start',
            viewportPadding,
            gap,
        };
    }
    readLengthToken(name, fallback) {
        const rawValue = window.getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim();
        const parsedValue = Number.parseFloat(rawValue);
        return Number.isFinite(parsedValue) ? parsedValue : fallback;
    }
    toLocalDate(parts) {
        return parts ? new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) : undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDatePickerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDatePickerComponent, isStandalone: true, selector: "cx-date-picker", inputs: { label: "label", hint: "hint", optional: "optional", ariaLabel: "ariaLabel", placeholder: "placeholder", size: "size", weekStart: "weekStart", yearRange: "yearRange", min: "min", max: "max", timeEnabled: "timeEnabled", allDayEnabled: "allDayEnabled", allDay: "allDay", disabled: "disabled", loading: "loading", clearable: "clearable", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", clear: "clear", focusChange: "focusChange" }, host: { listeners: { "document:pointerdown": "onDocumentPointerDown($event)", "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div class=\"cx-date-picker\">\n  @if (label.trim()) {\n    <div class=\"cx-date-picker__header\">\n      <div class=\"cx-date-picker__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-date-picker__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    #field\n    class=\"cx-date-picker__field\"\n    [class.cx-date-picker__field--small]=\"size === 'small'\"\n    [class.cx-date-picker__field--large]=\"size === 'large'\"\n    [class.cx-date-picker__field--open]=\"isOpen$()\"\n    [class.cx-date-picker__field--focused]=\"focused$()\"\n    [class.cx-date-picker__field--disabled]=\"disabled\"\n    [class.cx-date-picker__field--loading]=\"loading\"\n    [class.cx-date-picker__field--error]=\"hasError$()\"\n    [class.cx-date-picker__field--empty]=\"showPlaceholder$()\"\n    role=\"combobox\"\n    [attr.tabindex]=\"isLocked$() ? -1 : 0\"\n    [attr.aria-disabled]=\"isLocked$() ? 'true' : null\"\n    [attr.aria-expanded]=\"isOpen$()\"\n    [attr.aria-controls]=\"isOpen$() ? surfaceId : null\"\n    [attr.aria-haspopup]=\"'dialog'\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    [attr.aria-label]=\"resolvedFieldAriaLabel\"\n    [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n    [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n    [cxTooltip]=\"displayText$()\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggleOpen(field)\"\n    (keydown)=\"onFieldKeydown($event, field)\"\n    (focus)=\"onFieldFocus(true)\"\n    (blur)=\"onFieldFocus(false)\"\n  >\n    <cx-icon class=\"cx-date-picker__field-icon\" icon=\"calendar\" size=\"16\" />\n    <span\n      class=\"cx-date-picker__field-text\"\n      [class.cx-date-picker__field-text--placeholder]=\"showPlaceholder$()\"\n      data-cx-tooltip-overflow\n    >\n      {{ displayText$() }}\n    </span>\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-date-picker__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" size=\"16\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-date-picker__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-date-picker__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n  @if (isOpen$()) {\n    <cx-popover\n      [open]=\"true\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"surfaceId\"\n      [width]=\"overlay.width$()\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [role]=\"'dialog'\"\n      [ariaLabel]=\"'Choose date'\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"toggleOpen()\"\n    >\n      <div class=\"cx-date-picker__surface-inner\">\n        <cx-calendar\n          class=\"cx-date-picker__calendar\"\n          variant=\"embedded\"\n          [value]=\"calendarValue$()\"\n          [min]=\"calendarMin$()\"\n          [max]=\"calendarMax$()\"\n          [weekStart]=\"weekStart\"\n          [yearRange]=\"yearRange\"\n          [disabled]=\"isLocked$()\"\n          (valueChange)=\"onCalendarValueChange($event)\"\n        />\n\n        @if (timeEnabled) {\n          <div class=\"cx-date-picker__time-island\">\n            <div class=\"cx-date-picker__time-row\">\n              <cx-time-field\n                class=\"cx-date-picker__time\"\n                label=\"\"\n                ariaLabel=\"Time\"\n                [value]=\"selectedTimeValue$()\"\n                [disabled]=\"isLocked$() || !selectedDate$() || effectiveAllDay$()\"\n                [loading]=\"loading\"\n                (valueChange)=\"onTimeValueChange($event)\"\n              />\n\n              @if (allDayEnabled) {\n                <cx-checkbox\n                  text=\"All day\"\n                  [selected]=\"effectiveAllDay$()\"\n                  [disabled]=\"disabled\"\n                  (selectedChange)=\"onAllDayChange($event)\"\n                />\n              }\n            </div>\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-flex;max-width:100%}.cx-date-picker{display:inline-flex;max-width:100%;flex-direction:column;gap:var(--space-xs)}.cx-date-picker__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:0}.cx-date-picker__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-date-picker__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-date-picker__field{display:inline-flex;width:calc(var(--controller-size)*8);max-width:100%;height:var(--controller-size);align-items:center;gap:var(--space-xs);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;box-sizing:border-box;cursor:pointer;transition:border-color var(--motion-base) ease,background-color var(--motion-base) ease}.cx-date-picker__field:hover:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error),.cx-date-picker__field:focus:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error),.cx-date-picker__field--open:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error){border-color:var(--opacity-high);outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-date-picker__field:focus:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-picker__field--small{height:var(--controller-size-small)}.cx-date-picker__field--large{height:calc(var(--controller-size) + var(--space-md))}.cx-date-picker__field--large .cx-date-picker__field-text{font-size:var(--font-size-title-3)}.cx-date-picker__field--open{border-color:var(--border-open)}.cx-date-picker__field--disabled{cursor:default;opacity:var(--opacity-disabled);pointer-events:none}.cx-date-picker__field--loading{cursor:default;pointer-events:none}.cx-date-picker__field--error{border-color:var(--danger)}.cx-date-picker__field-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-date-picker__field-text{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-date-picker__field--small .cx-date-picker__field-text{font-size:var(--font-size-body-sm)}.cx-date-picker__field-text--placeholder{color:var(--placeholder)}.cx-date-picker__clear{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 auto;align-items:center;justify-content:center;padding:0;border:none;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-date-picker__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-date-picker__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-picker__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:0}.cx-date-picker__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-date-picker__surface-inner{display:flex;flex-direction:column;gap:var(--space-xs);box-sizing:border-box}.cx-date-picker__calendar{display:inline-flex}.cx-date-picker__time-island{padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-date-picker__time-row{display:flex;align-items:center;gap:var(--space-sm)}.cx-date-picker__time{flex:1 1 auto;min-width:0}"], dependencies: [{ kind: "component", type: CxCalendarComponent, selector: "cx-calendar", inputs: ["variant", "selectionMode", "weekStart", "yearRange", "disabled", "min", "max", "disabledDates", "value", "range", "viewDate", "rangePreviewEnd"], outputs: ["valueChange", "rangeChange", "rangePreviewEndChange", "viewDateChange"] }, { kind: "component", type: CxCheckboxComponent, selector: "cx-checkbox", inputs: ["text", "ariaLabel", "hint", "disabled", "selected", "value"], outputs: ["selectedChange", "valueChange", "focusChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxTimeFieldComponent, selector: "cx-time-field", inputs: ["label", "ariaLabel", "hourAriaLabel", "minuteAriaLabel", "optional", "disabled", "loading", "clearable", "hint", "mode", "size", "minuteStep", "min", "max", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDatePickerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-date-picker', imports: [
                        CxCalendarComponent,
                        CxCheckboxComponent,
                        CxIconComponent,
                        CxPopoverComponent,
                        CxTooltipDirective,
                        CxTimeFieldComponent,
                        CxValidationMessageComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-date-picker\">\n  @if (label.trim()) {\n    <div class=\"cx-date-picker__header\">\n      <div class=\"cx-date-picker__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-date-picker__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    #field\n    class=\"cx-date-picker__field\"\n    [class.cx-date-picker__field--small]=\"size === 'small'\"\n    [class.cx-date-picker__field--large]=\"size === 'large'\"\n    [class.cx-date-picker__field--open]=\"isOpen$()\"\n    [class.cx-date-picker__field--focused]=\"focused$()\"\n    [class.cx-date-picker__field--disabled]=\"disabled\"\n    [class.cx-date-picker__field--loading]=\"loading\"\n    [class.cx-date-picker__field--error]=\"hasError$()\"\n    [class.cx-date-picker__field--empty]=\"showPlaceholder$()\"\n    role=\"combobox\"\n    [attr.tabindex]=\"isLocked$() ? -1 : 0\"\n    [attr.aria-disabled]=\"isLocked$() ? 'true' : null\"\n    [attr.aria-expanded]=\"isOpen$()\"\n    [attr.aria-controls]=\"isOpen$() ? surfaceId : null\"\n    [attr.aria-haspopup]=\"'dialog'\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    [attr.aria-label]=\"resolvedFieldAriaLabel\"\n    [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n    [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n    [cxTooltip]=\"displayText$()\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggleOpen(field)\"\n    (keydown)=\"onFieldKeydown($event, field)\"\n    (focus)=\"onFieldFocus(true)\"\n    (blur)=\"onFieldFocus(false)\"\n  >\n    <cx-icon class=\"cx-date-picker__field-icon\" icon=\"calendar\" size=\"16\" />\n    <span\n      class=\"cx-date-picker__field-text\"\n      [class.cx-date-picker__field-text--placeholder]=\"showPlaceholder$()\"\n      data-cx-tooltip-overflow\n    >\n      {{ displayText$() }}\n    </span>\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-date-picker__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" size=\"16\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-date-picker__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-date-picker__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n  @if (isOpen$()) {\n    <cx-popover\n      [open]=\"true\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"surfaceId\"\n      [width]=\"overlay.width$()\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [role]=\"'dialog'\"\n      [ariaLabel]=\"'Choose date'\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"toggleOpen()\"\n    >\n      <div class=\"cx-date-picker__surface-inner\">\n        <cx-calendar\n          class=\"cx-date-picker__calendar\"\n          variant=\"embedded\"\n          [value]=\"calendarValue$()\"\n          [min]=\"calendarMin$()\"\n          [max]=\"calendarMax$()\"\n          [weekStart]=\"weekStart\"\n          [yearRange]=\"yearRange\"\n          [disabled]=\"isLocked$()\"\n          (valueChange)=\"onCalendarValueChange($event)\"\n        />\n\n        @if (timeEnabled) {\n          <div class=\"cx-date-picker__time-island\">\n            <div class=\"cx-date-picker__time-row\">\n              <cx-time-field\n                class=\"cx-date-picker__time\"\n                label=\"\"\n                ariaLabel=\"Time\"\n                [value]=\"selectedTimeValue$()\"\n                [disabled]=\"isLocked$() || !selectedDate$() || effectiveAllDay$()\"\n                [loading]=\"loading\"\n                (valueChange)=\"onTimeValueChange($event)\"\n              />\n\n              @if (allDayEnabled) {\n                <cx-checkbox\n                  text=\"All day\"\n                  [selected]=\"effectiveAllDay$()\"\n                  [disabled]=\"disabled\"\n                  (selectedChange)=\"onAllDayChange($event)\"\n                />\n              }\n            </div>\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-flex;max-width:100%}.cx-date-picker{display:inline-flex;max-width:100%;flex-direction:column;gap:var(--space-xs)}.cx-date-picker__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:0}.cx-date-picker__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-date-picker__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-date-picker__field{display:inline-flex;width:calc(var(--controller-size)*8);max-width:100%;height:var(--controller-size);align-items:center;gap:var(--space-xs);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;box-sizing:border-box;cursor:pointer;transition:border-color var(--motion-base) ease,background-color var(--motion-base) ease}.cx-date-picker__field:hover:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error),.cx-date-picker__field:focus:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error),.cx-date-picker__field--open:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error){border-color:var(--opacity-high);outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-date-picker__field:focus:not(.cx-date-picker__field--disabled):not(.cx-date-picker__field--loading):not(.cx-date-picker__field--error){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-picker__field--small{height:var(--controller-size-small)}.cx-date-picker__field--large{height:calc(var(--controller-size) + var(--space-md))}.cx-date-picker__field--large .cx-date-picker__field-text{font-size:var(--font-size-title-3)}.cx-date-picker__field--open{border-color:var(--border-open)}.cx-date-picker__field--disabled{cursor:default;opacity:var(--opacity-disabled);pointer-events:none}.cx-date-picker__field--loading{cursor:default;pointer-events:none}.cx-date-picker__field--error{border-color:var(--danger)}.cx-date-picker__field-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-date-picker__field-text{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-date-picker__field--small .cx-date-picker__field-text{font-size:var(--font-size-body-sm)}.cx-date-picker__field-text--placeholder{color:var(--placeholder)}.cx-date-picker__clear{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 auto;align-items:center;justify-content:center;padding:0;border:none;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-date-picker__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-date-picker__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-date-picker__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:0}.cx-date-picker__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-date-picker__surface-inner{display:flex;flex-direction:column;gap:var(--space-xs);box-sizing:border-box}.cx-date-picker__calendar{display:inline-flex}.cx-date-picker__time-island{padding:var(--space-sm);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-date-picker__time-row{display:flex;align-items:center;gap:var(--space-sm)}.cx-date-picker__time{flex:1 1 auto;min-width:0}"] }]
        }], propDecorators: { fieldRef: [{
                type: ViewChild,
                args: ['field', { read: ElementRef }]
            }], label: [{
                type: Input
            }], hint: [{
                type: Input
            }], optional: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], size: [{
                type: Input
            }], weekStart: [{
                type: Input
            }], yearRange: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], timeEnabled: [{
                type: Input
            }], allDayEnabled: [{
                type: Input
            }], allDay: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], clearable: [{
                type: Input
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], clear: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
