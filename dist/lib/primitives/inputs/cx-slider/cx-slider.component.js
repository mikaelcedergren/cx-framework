import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxSliderComponent {
    static nextId = 0;
    static TOOLTIP_LINGER_MS = 1000;
    static TOOLTIP_FADE_MS = 180;
    tooltipHideDelayTimeout = null;
    tooltipTeardownTimeout = null;
    tooltipRenderedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tooltipRenderedState" }] : /* istanbul ignore next */ []));
    tooltipOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tooltipOpenState" }] : /* istanbul ignore next */ []));
    minState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minState" }] : /* istanbul ignore next */ []));
    maxState = signal(100, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxState" }] : /* istanbul ignore next */ []));
    stepState = signal(1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stepState" }] : /* istanbul ignore next */ []));
    valueState = signal(40, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    rangeState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangeState" }] : /* istanbul ignore next */ []));
    rangeValueState = signal([25, 75], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rangeValueState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    showTooltipOnDragState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showTooltipOnDragState" }] : /* istanbul ignore next */ []));
    valueFormatterState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueFormatterState" }] : /* istanbul ignore next */ []));
    activeThumbState = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeThumbState" }] : /* istanbul ignore next */ []));
    draggingThumbState = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draggingThumbState" }] : /* istanbul ignore next */ []));
    removePointerReleaseListeners = null;
    labelId = `cx-slider-label-${CxSliderComponent.nextId}`;
    messagesId = `cx-slider-messages-${CxSliderComponent.nextId++}`;
    label = 'Threshold';
    hint;
    disabled = false;
    optional = false;
    showValue = true;
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set range(value) {
        this.rangeState.set(Boolean(value));
    }
    set showTooltipOnDrag(value) {
        this.showTooltipOnDragState.set(Boolean(value));
    }
    set min(value) {
        const nextMin = Number.isFinite(value) ? value : 0;
        this.minState.set(nextMin);
        if (this.maxState() < nextMin) {
            this.maxState.set(nextMin);
        }
        this.syncValueWithinBounds();
        this.syncRangeWithinBounds();
    }
    set max(value) {
        const nextMax = Number.isFinite(value) ? value : this.minState();
        this.maxState.set(Math.max(this.minState(), nextMax));
        this.syncValueWithinBounds();
        this.syncRangeWithinBounds();
    }
    set step(value) {
        if (!Number.isFinite(value) || value <= 0) {
            this.stepState.set(1);
        }
        else {
            this.stepState.set(value);
        }
        this.syncValueWithinBounds();
        this.syncRangeWithinBounds();
    }
    set value(value) {
        this.valueState.set(this.normalizeValue(value));
    }
    set rangeValue(value) {
        if (!value || value.length < 2) {
            this.syncRangeWithinBounds();
            return;
        }
        this.rangeValueState.set(this.normalizeRangePair(Number(value[0]), Number(value[1])));
    }
    set valueFormatter(fn) {
        this.valueFormatterState.set(fn);
    }
    valueChange = new EventEmitter();
    rangeValueChange = new EventEmitter();
    min$ = this.minState.asReadonly();
    max$ = this.maxState.asReadonly();
    step$ = this.stepState.asReadonly();
    value$ = this.valueState.asReadonly();
    range$ = this.rangeState.asReadonly();
    lowerValue$ = computed(() => this.rangeValueState()[0], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "lowerValue$" }] : /* istanbul ignore next */ []));
    upperValue$ = computed(() => this.rangeValueState()[1], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "upperValue$" }] : /* istanbul ignore next */ []));
    valuePercent$ = computed(() => this.toPercent(this.valueState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valuePercent$" }] : /* istanbul ignore next */ []));
    lowerPercent$ = computed(() => this.toPercent(this.lowerValue$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "lowerPercent$" }] : /* istanbul ignore next */ []));
    upperPercent$ = computed(() => this.toPercent(this.upperValue$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "upperPercent$" }] : /* istanbul ignore next */ []));
    fillOffsetPercent$ = computed(() => (this.rangeState() ? this.lowerPercent$() : 0), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fillOffsetPercent$" }] : /* istanbul ignore next */ []));
    fillWidthPercent$ = computed(() => {
        if (this.rangeState()) {
            return Math.max(this.upperPercent$() - this.lowerPercent$(), 0);
        }
        return this.valuePercent$();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fillWidthPercent$" }] : /* istanbul ignore next */ []));
    valueLabel$ = computed(() => {
        const format = this.formatValue.bind(this);
        if (this.rangeState()) {
            return `${format(this.lowerValue$())} – ${format(this.upperValue$())}`;
        }
        return format(this.valueState());
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueLabel$" }] : /* istanbul ignore next */ []));
    validationMessages$ = () => this.disabled
        ? []
        : normalizeCxValidation(this.validationState());
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
    showTooltipOnDrag$ = this.showTooltipOnDragState.asReadonly();
    tooltipRendered$ = computed(() => this.tooltipRenderedState() && this.activeThumbState() !== null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tooltipRendered$" }] : /* istanbul ignore next */ []));
    tooltipOpen$ = this.tooltipOpenState.asReadonly();
    tooltipLabel$ = computed(() => {
        switch (this.activeThumbState()) {
            case 'start':
                return this.formatValue(this.lowerValue$());
            case 'end':
                return this.formatValue(this.upperValue$());
            case 'single':
            default:
                return this.formatValue(this.valueState());
        }
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tooltipLabel$" }] : /* istanbul ignore next */ []));
    tooltipPercent$ = computed(() => {
        switch (this.activeThumbState()) {
            case 'start':
                return this.lowerPercent$();
            case 'end':
                return this.upperPercent$();
            case 'single':
            default:
                return this.valuePercent$();
        }
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tooltipPercent$" }] : /* istanbul ignore next */ []));
    get resolvedSliderAriaLabel() {
        if (this.label.trim()) {
            return undefined;
        }
        return 'Slider';
    }
    get resolvedSliderAriaLabelledBy() {
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedSliderAriaDescribedBy() {
        const ids = [];
        if (this.showHint$() || this.validationMessages$().length > 0) {
            ids.push(this.messagesId);
        }
        return ids.length > 0 ? ids.join(' ') : undefined;
    }
    get resolvedMinThumbAriaLabel() {
        if (this.label.trim()) {
            return undefined;
        }
        return 'Minimum value';
    }
    get resolvedMaxThumbAriaLabel() {
        if (this.label.trim()) {
            return undefined;
        }
        return 'Maximum value';
    }
    ngOnDestroy() {
        this.clearTooltipTimers();
        this.detachPointerReleaseListeners();
    }
    onSingleInput(event) {
        if (this.disabled) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const nextValue = this.normalizeValue(target.valueAsNumber);
        this.valueState.set(nextValue);
        this.valueChange.emit(nextValue);
        this.showTooltipForThumb('single', this.draggingThumbState() === 'single');
    }
    onRangeInput(event, thumb) {
        if (this.disabled) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const current = this.rangeValueState();
        const nextValue = this.normalizeValue(target.valueAsNumber);
        const nextRange = thumb === 'start'
            ? [Math.min(nextValue, current[1]), current[1]]
            : [current[0], Math.max(nextValue, current[0])];
        this.rangeValueState.set(nextRange);
        this.rangeValueChange.emit(nextRange);
        this.showTooltipForThumb(thumb, this.draggingThumbState() === thumb);
    }
    onThumbFocus(thumb) {
        if (!this.showTooltipOnDragState() || this.disabled) {
            return;
        }
        this.showTooltipForThumb(thumb, this.draggingThumbState() === thumb);
    }
    onThumbPointerDown(thumb) {
        if (!this.showTooltipOnDragState() || this.disabled) {
            return;
        }
        this.draggingThumbState.set(thumb);
        this.attachPointerReleaseListeners();
        this.showTooltipForThumb(thumb, true);
    }
    onThumbBlur() {
        if (this.draggingThumbState() !== null) {
            return;
        }
        this.scheduleTooltipHide();
    }
    onThumbPointerRelease() {
        if (this.draggingThumbState() === null) {
            return;
        }
        this.draggingThumbState.set(null);
        this.detachPointerReleaseListeners();
        this.scheduleTooltipHide();
    }
    showTooltipForThumb(thumb, persistWhileDragging = false) {
        if (!this.showTooltipOnDragState() || this.disabled) {
            return;
        }
        this.clearTooltipTimers();
        this.activeThumbState.set(thumb);
        this.tooltipRenderedState.set(true);
        this.tooltipOpenState.set(false);
        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                this.tooltipOpenState.set(true);
            });
        }
        else {
            this.tooltipOpenState.set(true);
        }
        if (!persistWhileDragging) {
            this.scheduleTooltipHide();
        }
    }
    scheduleTooltipHide() {
        this.clearTooltipTimers();
        this.tooltipHideDelayTimeout = setTimeout(() => {
            this.tooltipOpenState.set(false);
            this.tooltipTeardownTimeout = setTimeout(() => {
                this.tooltipRenderedState.set(false);
                this.activeThumbState.set(null);
                this.tooltipTeardownTimeout = null;
            }, CxSliderComponent.TOOLTIP_FADE_MS);
            this.tooltipHideDelayTimeout = null;
        }, CxSliderComponent.TOOLTIP_LINGER_MS);
    }
    clearTooltipTimers() {
        if (this.tooltipHideDelayTimeout !== null) {
            clearTimeout(this.tooltipHideDelayTimeout);
            this.tooltipHideDelayTimeout = null;
        }
        if (this.tooltipTeardownTimeout !== null) {
            clearTimeout(this.tooltipTeardownTimeout);
            this.tooltipTeardownTimeout = null;
        }
    }
    attachPointerReleaseListeners() {
        if (this.removePointerReleaseListeners || typeof window === 'undefined') {
            return;
        }
        const handleRelease = () => this.onThumbPointerRelease();
        window.addEventListener('pointerup', handleRelease);
        window.addEventListener('pointercancel', handleRelease);
        this.removePointerReleaseListeners = () => {
            window.removeEventListener('pointerup', handleRelease);
            window.removeEventListener('pointercancel', handleRelease);
            this.removePointerReleaseListeners = null;
        };
    }
    detachPointerReleaseListeners() {
        this.removePointerReleaseListeners?.();
    }
    syncValueWithinBounds() {
        this.valueState.set(this.normalizeValue(this.valueState()));
    }
    syncRangeWithinBounds() {
        const current = this.rangeValueState();
        this.rangeValueState.set(this.normalizeRangePair(current[0], current[1]));
    }
    formatValue(value) {
        const formatter = this.valueFormatterState();
        return formatter ? formatter(value) : `${value}`;
    }
    normalizeRangePair(start, end) {
        let nextStart = this.normalizeValue(start);
        let nextEnd = this.normalizeValue(end);
        if (nextStart > nextEnd) {
            [nextStart, nextEnd] = [nextEnd, nextStart];
        }
        return [nextStart, nextEnd];
    }
    normalizeValue(value) {
        const min = this.minState();
        const max = this.maxState();
        const step = this.stepState();
        const candidate = Number.isFinite(value) ? value : min;
        const clamped = Math.min(Math.max(candidate, min), max);
        const rounded = Math.round((clamped - min) / step) * step + min;
        const precision = this.getStepPrecision(step);
        const normalized = Number(rounded.toFixed(precision));
        return Math.min(Math.max(normalized, min), max);
    }
    toPercent(value) {
        const min = this.minState();
        const max = this.maxState();
        if (max <= min) {
            return 0;
        }
        return ((value - min) / (max - min)) * 100;
    }
    getStepPrecision(step) {
        const stepText = `${step}`;
        const decimalIndex = stepText.indexOf('.');
        return decimalIndex >= 0 ? stepText.length - decimalIndex - 1 : 0;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSliderComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSliderComponent, isStandalone: true, selector: "cx-slider", inputs: { label: "label", hint: "hint", disabled: "disabled", optional: "optional", showValue: "showValue", validation: "validation", range: "range", showTooltipOnDrag: "showTooltipOnDrag", min: "min", max: "max", step: "step", value: "value", rangeValue: "rangeValue", valueFormatter: "valueFormatter" }, outputs: { valueChange: "valueChange", rangeValueChange: "rangeValueChange" }, ngImport: i0, template: "<div class=\"cx-slider\" [class.cx-slider--disabled]=\"disabled\" [class.cx-slider--invalid]=\"hasError$()\">\n  @if (label.trim() || optional || showValue) {\n    <div class=\"cx-slider__header\">\n      @if (label.trim()) {\n        <div class=\"cx-slider__label-row\">\n          <div class=\"cx-slider__label\" [id]=\"labelId\">{{ label }}</div>\n          @if (optional) {\n            <div class=\"cx-slider__optional\">Optional</div>\n          }\n        </div>\n      } @else if (optional) {\n        <div class=\"cx-slider__optional\">Optional</div>\n      }\n\n      @if (showValue) {\n        <div class=\"cx-slider__value\">{{ valueLabel$() }}</div>\n      }\n    </div>\n  }\n\n  <div class=\"cx-slider__control\" [class.cx-slider__control--with-tooltips]=\"showTooltipOnDrag$()\">\n    @if (tooltipRendered$()) {\n      <div\n        class=\"cx-slider__tooltip\"\n        [class.cx-slider__tooltip--open]=\"tooltipOpen$()\"\n        [style.left.%]=\"tooltipPercent$()\"\n      >\n        {{ tooltipLabel$() }}\n      </div>\n    }\n\n    <div class=\"cx-slider__track\" aria-hidden=\"true\"></div>\n    <div\n      class=\"cx-slider__fill\"\n      aria-hidden=\"true\"\n      [style.left.%]=\"fillOffsetPercent$()\"\n      [style.width.%]=\"fillWidthPercent$()\"\n    ></div>\n\n    @if (range$()) {\n      <input\n        class=\"cx-slider__field cx-slider__field--range cx-slider__field--start\"\n        type=\"range\"\n        [min]=\"min$()\"\n        [max]=\"max$()\"\n        [step]=\"step$()\"\n        [value]=\"lowerValue$()\"\n        [disabled]=\"disabled\"\n        [attr.aria-label]=\"resolvedMinThumbAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedSliderAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedSliderAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        (input)=\"onRangeInput($event, 'start')\"\n        (pointerdown)=\"onThumbPointerDown('start')\"\n        (focus)=\"onThumbFocus('start')\"\n        (blur)=\"onThumbBlur()\"\n      />\n\n      <input\n        class=\"cx-slider__field cx-slider__field--range cx-slider__field--end\"\n        type=\"range\"\n        [min]=\"min$()\"\n        [max]=\"max$()\"\n        [step]=\"step$()\"\n        [value]=\"upperValue$()\"\n        [disabled]=\"disabled\"\n        [attr.aria-label]=\"resolvedMaxThumbAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedSliderAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedSliderAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        (input)=\"onRangeInput($event, 'end')\"\n        (pointerdown)=\"onThumbPointerDown('end')\"\n        (focus)=\"onThumbFocus('end')\"\n        (blur)=\"onThumbBlur()\"\n      />\n    } @else {\n      <input\n        class=\"cx-slider__field\"\n        type=\"range\"\n        [min]=\"min$()\"\n        [max]=\"max$()\"\n        [step]=\"step$()\"\n        [value]=\"value$()\"\n        [disabled]=\"disabled\"\n        [attr.aria-label]=\"resolvedSliderAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedSliderAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedSliderAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        (input)=\"onSingleInput($event)\"\n        (pointerdown)=\"onThumbPointerDown('single')\"\n        (focus)=\"onThumbFocus('single')\"\n        (blur)=\"onThumbBlur()\"\n      />\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-slider__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-slider__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%;--cx-slider-thumb-size: calc(var(--space-md) - var(--space-2xs));--cx-slider-track-top: calc(var(--space-sm) + var(--space-2xs));--cx-slider-tooltip-track-top: calc(var(--space-xl) + var(--space-sm) - var(--space-2xs));--cx-slider-thumb-offset: calc(var(--space-2xs) - var(--space-sm))}.cx-slider{display:flex;width:100%;flex-direction:column;gap:var(--space-xs)}.cx-slider--disabled{opacity:var(--opacity-disabled)}.cx-slider__header{display:flex;width:100%;align-items:baseline;justify-content:space-between;gap:var(--space-md)}.cx-slider__label-row{display:flex;align-items:baseline;gap:var(--space-sm)}.cx-slider__label,.cx-slider__value{font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-slider__label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-slider__value{color:var(--opacity-high);font-weight:var(--font-weight-medium)}.cx-slider__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-slider__control{position:relative;width:100%;min-height:var(--space-lg);box-sizing:border-box}.cx-slider__control--with-tooltips{min-height:48px}.cx-slider__tooltip{position:absolute;top:0;min-width:calc(var(--space-xl) + var(--space-md));height:var(--space-xl);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-low);color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:1;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-4px);transition:opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}.cx-slider__tooltip--open{opacity:1;transform:translateX(-50%) translateY(0)}.cx-slider__track,.cx-slider__fill{position:absolute;top:var(--cx-slider-track-top);height:var(--space-2xs);border-radius:var(--radius-pill);corner-shape:round}.cx-slider__control--with-tooltips .cx-slider__track,.cx-slider__control--with-tooltips .cx-slider__fill{top:var(--cx-slider-tooltip-track-top)}.cx-slider__track{left:0;right:0;background:var(--opacity-low)}.cx-slider__fill{background:var(--primary)}.cx-slider--invalid .cx-slider__fill{background:var(--danger)}.cx-slider__field{position:absolute;top:0;left:0;width:100%;height:20px;margin:0;background:rgba(0,0,0,0);cursor:pointer;-webkit-appearance:none;appearance:none}.cx-slider__control--with-tooltips .cx-slider__field{top:30px}.cx-slider__field:disabled{cursor:default}.cx-slider__field--range{pointer-events:none}.cx-slider__field--start{z-index:2}.cx-slider__field--end{z-index:3}.cx-slider__field:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-slider__field::-webkit-slider-runnable-track{height:var(--space-2xs);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0)}.cx-slider__field::-webkit-slider-thumb{width:var(--cx-slider-thumb-size);height:var(--cx-slider-thumb-size);margin-top:var(--cx-slider-thumb-offset);border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--primary);box-shadow:var(--shadow-low);pointer-events:auto;-webkit-appearance:none;appearance:none;transition:transform var(--motion-fast) ease,box-shadow var(--motion-fast) ease}.cx-slider--invalid .cx-slider__field::-webkit-slider-thumb{background:var(--danger)}.cx-slider__field:focus-visible::-webkit-slider-thumb{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset);box-shadow:var(--shadow-low)}.cx-slider__field:not(:disabled):hover::-webkit-slider-thumb{transform:scale(1.04)}.cx-slider__field::-moz-range-track{height:var(--space-2xs);border:0;border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0)}.cx-slider__field::-moz-range-progress{background:rgba(0,0,0,0)}.cx-slider__field::-moz-range-thumb{width:var(--cx-slider-thumb-size);height:var(--cx-slider-thumb-size);border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--primary);box-shadow:var(--shadow-low);pointer-events:auto;transition:transform var(--motion-fast) ease,box-shadow var(--motion-fast) ease}.cx-slider--invalid .cx-slider__field::-moz-range-thumb{background:var(--danger)}.cx-slider__field:focus-visible::-moz-range-thumb{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset);box-shadow:var(--shadow-low)}.cx-slider__field:not(:disabled):hover::-moz-range-thumb{transform:scale(1.04)}.cx-slider__messages{display:flex;width:100%;flex-direction:column;gap:var(--space-xs)}.cx-slider__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSliderComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-slider', imports: [CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-slider\" [class.cx-slider--disabled]=\"disabled\" [class.cx-slider--invalid]=\"hasError$()\">\n  @if (label.trim() || optional || showValue) {\n    <div class=\"cx-slider__header\">\n      @if (label.trim()) {\n        <div class=\"cx-slider__label-row\">\n          <div class=\"cx-slider__label\" [id]=\"labelId\">{{ label }}</div>\n          @if (optional) {\n            <div class=\"cx-slider__optional\">Optional</div>\n          }\n        </div>\n      } @else if (optional) {\n        <div class=\"cx-slider__optional\">Optional</div>\n      }\n\n      @if (showValue) {\n        <div class=\"cx-slider__value\">{{ valueLabel$() }}</div>\n      }\n    </div>\n  }\n\n  <div class=\"cx-slider__control\" [class.cx-slider__control--with-tooltips]=\"showTooltipOnDrag$()\">\n    @if (tooltipRendered$()) {\n      <div\n        class=\"cx-slider__tooltip\"\n        [class.cx-slider__tooltip--open]=\"tooltipOpen$()\"\n        [style.left.%]=\"tooltipPercent$()\"\n      >\n        {{ tooltipLabel$() }}\n      </div>\n    }\n\n    <div class=\"cx-slider__track\" aria-hidden=\"true\"></div>\n    <div\n      class=\"cx-slider__fill\"\n      aria-hidden=\"true\"\n      [style.left.%]=\"fillOffsetPercent$()\"\n      [style.width.%]=\"fillWidthPercent$()\"\n    ></div>\n\n    @if (range$()) {\n      <input\n        class=\"cx-slider__field cx-slider__field--range cx-slider__field--start\"\n        type=\"range\"\n        [min]=\"min$()\"\n        [max]=\"max$()\"\n        [step]=\"step$()\"\n        [value]=\"lowerValue$()\"\n        [disabled]=\"disabled\"\n        [attr.aria-label]=\"resolvedMinThumbAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedSliderAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedSliderAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        (input)=\"onRangeInput($event, 'start')\"\n        (pointerdown)=\"onThumbPointerDown('start')\"\n        (focus)=\"onThumbFocus('start')\"\n        (blur)=\"onThumbBlur()\"\n      />\n\n      <input\n        class=\"cx-slider__field cx-slider__field--range cx-slider__field--end\"\n        type=\"range\"\n        [min]=\"min$()\"\n        [max]=\"max$()\"\n        [step]=\"step$()\"\n        [value]=\"upperValue$()\"\n        [disabled]=\"disabled\"\n        [attr.aria-label]=\"resolvedMaxThumbAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedSliderAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedSliderAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        (input)=\"onRangeInput($event, 'end')\"\n        (pointerdown)=\"onThumbPointerDown('end')\"\n        (focus)=\"onThumbFocus('end')\"\n        (blur)=\"onThumbBlur()\"\n      />\n    } @else {\n      <input\n        class=\"cx-slider__field\"\n        type=\"range\"\n        [min]=\"min$()\"\n        [max]=\"max$()\"\n        [step]=\"step$()\"\n        [value]=\"value$()\"\n        [disabled]=\"disabled\"\n        [attr.aria-label]=\"resolvedSliderAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedSliderAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedSliderAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        (input)=\"onSingleInput($event)\"\n        (pointerdown)=\"onThumbPointerDown('single')\"\n        (focus)=\"onThumbFocus('single')\"\n        (blur)=\"onThumbBlur()\"\n      />\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-slider__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-slider__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%;--cx-slider-thumb-size: calc(var(--space-md) - var(--space-2xs));--cx-slider-track-top: calc(var(--space-sm) + var(--space-2xs));--cx-slider-tooltip-track-top: calc(var(--space-xl) + var(--space-sm) - var(--space-2xs));--cx-slider-thumb-offset: calc(var(--space-2xs) - var(--space-sm))}.cx-slider{display:flex;width:100%;flex-direction:column;gap:var(--space-xs)}.cx-slider--disabled{opacity:var(--opacity-disabled)}.cx-slider__header{display:flex;width:100%;align-items:baseline;justify-content:space-between;gap:var(--space-md)}.cx-slider__label-row{display:flex;align-items:baseline;gap:var(--space-sm)}.cx-slider__label,.cx-slider__value{font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-slider__label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-slider__value{color:var(--opacity-high);font-weight:var(--font-weight-medium)}.cx-slider__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-slider__control{position:relative;width:100%;min-height:var(--space-lg);box-sizing:border-box}.cx-slider__control--with-tooltips{min-height:48px}.cx-slider__tooltip{position:absolute;top:0;min-width:calc(var(--space-xl) + var(--space-md));height:var(--space-xl);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-low);color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:1;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-4px);transition:opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}.cx-slider__tooltip--open{opacity:1;transform:translateX(-50%) translateY(0)}.cx-slider__track,.cx-slider__fill{position:absolute;top:var(--cx-slider-track-top);height:var(--space-2xs);border-radius:var(--radius-pill);corner-shape:round}.cx-slider__control--with-tooltips .cx-slider__track,.cx-slider__control--with-tooltips .cx-slider__fill{top:var(--cx-slider-tooltip-track-top)}.cx-slider__track{left:0;right:0;background:var(--opacity-low)}.cx-slider__fill{background:var(--primary)}.cx-slider--invalid .cx-slider__fill{background:var(--danger)}.cx-slider__field{position:absolute;top:0;left:0;width:100%;height:20px;margin:0;background:rgba(0,0,0,0);cursor:pointer;-webkit-appearance:none;appearance:none}.cx-slider__control--with-tooltips .cx-slider__field{top:30px}.cx-slider__field:disabled{cursor:default}.cx-slider__field--range{pointer-events:none}.cx-slider__field--start{z-index:2}.cx-slider__field--end{z-index:3}.cx-slider__field:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-slider__field::-webkit-slider-runnable-track{height:var(--space-2xs);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0)}.cx-slider__field::-webkit-slider-thumb{width:var(--cx-slider-thumb-size);height:var(--cx-slider-thumb-size);margin-top:var(--cx-slider-thumb-offset);border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--primary);box-shadow:var(--shadow-low);pointer-events:auto;-webkit-appearance:none;appearance:none;transition:transform var(--motion-fast) ease,box-shadow var(--motion-fast) ease}.cx-slider--invalid .cx-slider__field::-webkit-slider-thumb{background:var(--danger)}.cx-slider__field:focus-visible::-webkit-slider-thumb{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset);box-shadow:var(--shadow-low)}.cx-slider__field:not(:disabled):hover::-webkit-slider-thumb{transform:scale(1.04)}.cx-slider__field::-moz-range-track{height:var(--space-2xs);border:0;border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0)}.cx-slider__field::-moz-range-progress{background:rgba(0,0,0,0)}.cx-slider__field::-moz-range-thumb{width:var(--cx-slider-thumb-size);height:var(--cx-slider-thumb-size);border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--primary);box-shadow:var(--shadow-low);pointer-events:auto;transition:transform var(--motion-fast) ease,box-shadow var(--motion-fast) ease}.cx-slider--invalid .cx-slider__field::-moz-range-thumb{background:var(--danger)}.cx-slider__field:focus-visible::-moz-range-thumb{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset);box-shadow:var(--shadow-low)}.cx-slider__field:not(:disabled):hover::-moz-range-thumb{transform:scale(1.04)}.cx-slider__messages{display:flex;width:100%;flex-direction:column;gap:var(--space-xs)}.cx-slider__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], hint: [{
                type: Input
            }], disabled: [{
                type: Input
            }], optional: [{
                type: Input
            }], showValue: [{
                type: Input
            }], validation: [{
                type: Input
            }], range: [{
                type: Input
            }], showTooltipOnDrag: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], step: [{
                type: Input
            }], value: [{
                type: Input
            }], rangeValue: [{
                type: Input
            }], valueFormatter: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], rangeValueChange: [{
                type: Output
            }] } });
