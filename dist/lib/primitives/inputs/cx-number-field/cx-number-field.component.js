import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxNumberFieldComponent {
    static nextId = 0;
    valueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    draftState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draftState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    loadingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingState" }] : /* istanbul ignore next */ []));
    sizeState = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sizeState" }] : /* istanbul ignore next */ []));
    minState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minState" }] : /* istanbul ignore next */ []));
    maxState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxState" }] : /* istanbul ignore next */ []));
    stepState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stepState" }] : /* istanbul ignore next */ []));
    clearableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "clearableState" }] : /* istanbul ignore next */ []));
    steppersState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "steppersState" }] : /* istanbul ignore next */ []));
    prependTextState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "prependTextState" }] : /* istanbul ignore next */ []));
    appendTextState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "appendTextState" }] : /* istanbul ignore next */ []));
    hintState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hintState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    labelId = `cx-number-field-label-${CxNumberFieldComponent.nextId}`;
    messagesId = `cx-number-field-messages-${CxNumberFieldComponent.nextId++}`;
    fieldRef;
    label = 'Number';
    ariaLabel;
    optional = false;
    set value(value) {
        const normalized = this.normalizeOptionalNumber(value);
        this.valueState.set(normalized);
        this.draftState.set(this.formatValue(normalized));
    }
    set disabled(value) {
        this.disabledState.set(!!value);
    }
    set loading(value) {
        this.loadingState.set(!!value);
    }
    set min(value) {
        this.minState.set(this.normalizeOptionalNumber(value));
    }
    set max(value) {
        this.maxState.set(this.normalizeOptionalNumber(value));
    }
    set step(value) {
        this.stepState.set(this.normalizeOptionalNumber(value));
    }
    set size(value) {
        this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
    }
    set clearable(value) {
        this.clearableState.set(!!value);
    }
    set steppers(value) {
        this.steppersState.set(!!value);
    }
    set prependText(value) {
        this.prependTextState.set(value?.trim() || undefined);
    }
    set appendText(value) {
        this.appendTextState.set(value?.trim() || undefined);
    }
    set hint(value) {
        this.hintState.set(value);
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    clear = new EventEmitter();
    value$ = this.valueState.asReadonly();
    draft$ = this.draftState.asReadonly();
    disabled$ = this.disabledState.asReadonly();
    loading$ = this.loadingState.asReadonly();
    size$ = this.sizeState.asReadonly();
    min$ = this.minState.asReadonly();
    max$ = this.maxState.asReadonly();
    step$ = this.stepState.asReadonly();
    prependText$ = this.prependTextState.asReadonly();
    appendText$ = this.appendTextState.asReadonly();
    isLocked$ = computed(() => this.disabledState() || this.loadingState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isLocked$" }] : /* istanbul ignore next */ []));
    isInteractive$ = computed(() => !this.disabledState() && !this.loadingState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isInteractive$" }] : /* istanbul ignore next */ []));
    hasClear$ = computed(() => this.clearableState() && this.valueState() !== undefined && this.isInteractive$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasClear$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => {
        if (this.disabledState()) {
            return [];
        }
        return normalizeCxValidation(this.validationState());
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    hint$ = computed(() => this.hintState()?.trim() || undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hint$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => !!this.hint$() && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    shellFocused$ = computed(() => this.focusedState() && !this.isLocked$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "shellFocused$" }] : /* istanbul ignore next */ []));
    steppers$ = this.steppersState.asReadonly();
    stepAmount$ = computed(() => {
        const step = this.stepState();
        return step && step > 0 ? step : 1;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stepAmount$" }] : /* istanbul ignore next */ []));
    canDecrement$ = computed(() => {
        if (!this.isInteractive$()) {
            return false;
        }
        const min = this.minState();
        return min === undefined || this.currentForStep() > min;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canDecrement$" }] : /* istanbul ignore next */ []));
    canIncrement$ = computed(() => {
        if (!this.isInteractive$()) {
            return false;
        }
        const max = this.maxState();
        return max === undefined || this.currentForStep() < max;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canIncrement$" }] : /* istanbul ignore next */ []));
    get resolvedAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        if (!this.label.trim()) {
            return 'Number';
        }
        return undefined;
    }
    get resolvedAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedAriaDescribedBy() {
        const ids = [];
        if (this.showHint$() || this.validationMessages$().length > 0) {
            ids.push(this.messagesId);
        }
        return ids.length > 0 ? ids.join(' ') : undefined;
    }
    focus() {
        this.fieldRef?.nativeElement.focus();
    }
    onInput(event) {
        if (!this.isInteractive$()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        this.draftState.set(target.value);
        this.commit(target.value);
    }
    onFocus() {
        if (this.isLocked$()) {
            return;
        }
        this.focusedState.set(true);
        this.focusChange.emit(true);
    }
    onBlur() {
        this.focusedState.set(false);
        this.focusChange.emit(false);
        this.settleToBounds();
    }
    onCommitOnEnter(event) {
        if (!this.isInteractive$()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        this.commit(target.value);
        this.settleToBounds();
    }
    onEscapeKey() {
        this.fieldRef?.nativeElement.blur();
    }
    onClear(event) {
        if (!this.isInteractive$()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (this.valueState() === undefined) {
            return;
        }
        this.valueState.set(undefined);
        this.draftState.set('');
        this.valueChange.emit(undefined);
        this.clear.emit();
        queueMicrotask(() => this.fieldRef?.nativeElement.focus());
    }
    onStep(direction) {
        if (!this.isInteractive$()) {
            return;
        }
        const next = this.clampToBounds(this.currentForStep() + direction * this.stepAmount$());
        if (next === this.valueState()) {
            return;
        }
        this.valueState.set(next);
        this.draftState.set(this.formatValue(next));
        this.valueChange.emit(next);
        queueMicrotask(() => this.fieldRef?.nativeElement.focus());
    }
    currentForStep() {
        const value = this.valueState();
        if (value !== undefined) {
            return value;
        }
        return this.minState() ?? 0;
    }
    // Typed values are left free while editing so multi-digit entry isn't
    // interrupted; bounds settle when the edit ends (blur or Enter).
    settleToBounds() {
        const value = this.valueState();
        if (value === undefined || !this.isInteractive$()) {
            return;
        }
        const clamped = this.clampToBounds(value);
        this.draftState.set(this.formatValue(clamped));
        this.emitValue(clamped);
    }
    clampToBounds(value) {
        const min = this.minState();
        const max = this.maxState();
        let next = value;
        if (min !== undefined) {
            next = Math.max(min, next);
        }
        if (max !== undefined) {
            next = Math.min(max, next);
        }
        return next;
    }
    commit(raw) {
        if (!this.isInteractive$()) {
            return;
        }
        const trimmed = raw.trim();
        if (!trimmed) {
            this.emitValue(undefined);
            this.draftState.set('');
            return;
        }
        const next = Number(trimmed);
        if (!Number.isFinite(next)) {
            return;
        }
        this.emitValue(next);
        this.draftState.set(trimmed);
    }
    emitValue(value) {
        if (value === this.valueState()) {
            return;
        }
        this.valueState.set(value);
        this.valueChange.emit(value);
    }
    normalizeOptionalNumber(value) {
        return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
    }
    formatValue(value) {
        return value === undefined ? '' : String(value);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNumberFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxNumberFieldComponent, isStandalone: true, selector: "cx-number-field", inputs: { label: "label", ariaLabel: "ariaLabel", optional: "optional", value: "value", disabled: "disabled", loading: "loading", min: "min", max: "max", step: "step", size: "size", clearable: "clearable", steppers: "steppers", prependText: "prependText", appendText: "appendText", hint: "hint", validation: "validation" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", clear: "clear" }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div class=\"cx-number-field\" [class.cx-number-field--small]=\"size$() === 'small'\" [class.cx-number-field--large]=\"size$() === 'large'\">\n  @if (label.trim() || optional) {\n    <div class=\"cx-number-field__header\">\n      @if (label.trim()) {\n        <div class=\"cx-number-field__label\" [id]=\"labelId\">{{ label }}</div>\n      }\n\n      @if (optional && label.trim()) {\n        <div class=\"cx-number-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-number-field__field-shell\"\n    [class.cx-number-field__field-shell--focused]=\"shellFocused$()\"\n    [class.cx-number-field__field-shell--disabled]=\"disabled$()\"\n    [class.cx-number-field__field-shell--loading]=\"loading$()\"\n    [class.cx-number-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n  >\n    @if (steppers$()) {\n      <button\n        type=\"button\"\n        class=\"cx-number-field__stepper cx-number-field__stepper--decrement\"\n        aria-label=\"Decrease\"\n        [disabled]=\"!canDecrement$()\"\n        (click)=\"onStep(-1)\"\n      >\n        <cx-icon icon=\"minus\" [size]=\"16\" />\n      </button>\n    }\n\n    @if (prependText$(); as prependText) {\n      <span class=\"cx-number-field__affix cx-number-field__affix--prepend\">{{ prependText }}</span>\n    }\n\n    <input\n      #field\n      type=\"number\"\n      inputmode=\"decimal\"\n      class=\"cx-number-field__field\"\n      [class.cx-number-field__field--stepper]=\"steppers$()\"\n      [value]=\"draft$()\"\n      [disabled]=\"isLocked$()\"\n      [attr.min]=\"min$() ?? null\"\n      [attr.max]=\"max$() ?? null\"\n      [attr.step]=\"step$() ?? null\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.enter)=\"onCommitOnEnter($event)\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (appendText$(); as appendText) {\n      <span class=\"cx-number-field__affix cx-number-field__affix--append\">{{ appendText }}</span>\n    }\n\n    @if (loading$()) {\n      <span class=\"cx-number-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-number-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n\n    @if (steppers$()) {\n      <button\n        type=\"button\"\n        class=\"cx-number-field__stepper cx-number-field__stepper--increment\"\n        aria-label=\"Increase\"\n        [disabled]=\"!canIncrement$()\"\n        (click)=\"onStep(1)\"\n      >\n        <cx-icon icon=\"plus\" [size]=\"16\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-number-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-number-field__hint\">{{ hint$() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-number-field{width:100%}.cx-number-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-number-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-number-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-number-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink)}.cx-number-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-number-field__field-shell:hover:not(.cx-number-field__field-shell--disabled):not(.cx-number-field__field-shell--error){border-color:var(--border-hover)}.cx-number-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-number-field__field-shell:has(.cx-number-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-number-field__field-shell--error,.cx-number-field__field-shell--error:hover:not(.cx-number-field__field-shell--disabled){border-color:var(--danger)}.cx-number-field__field-shell--disabled{opacity:.55;cursor:default}.cx-number-field__field-shell--loading{cursor:default}.cx-number-field--small .cx-number-field__field-shell{min-height:var(--controller-size-small)}.cx-number-field--large .cx-number-field__field-shell{min-height:40px}.cx-number-field__affix,.cx-number-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-number-field__affix{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);white-space:nowrap}.cx-number-field--small .cx-number-field__affix,.cx-number-field--small .cx-number-field__field{font-size:var(--font-size-body-sm)}.cx-number-field--large .cx-number-field__affix,.cx-number-field--large .cx-number-field__field{font-size:var(--font-size-body-lg)}.cx-number-field__field{flex:1 1 auto;width:100%;min-width:0;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);appearance:textfield}.cx-number-field__field::-webkit-outer-spin-button,.cx-number-field__field::-webkit-inner-spin-button{margin:0;appearance:none}.cx-number-field__field::placeholder{color:var(--placeholder)}.cx-number-field__field:focus-visible{outline:0}.cx-number-field__clear{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-number-field__clear:hover{background:var(--opacity-darken);color:var(--ink)}.cx-number-field__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-number-field__stepper{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-number-field__stepper:hover:not(:disabled){background:var(--opacity-darken);color:var(--ink)}.cx-number-field__stepper:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-number-field__stepper:disabled{opacity:var(--opacity-disabled);cursor:default}.cx-number-field__field--stepper{text-align:center}.cx-number-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-number-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-number-field__validation{display:inline-flex;align-items:flex-start;gap:var(--space-xs);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body-relaxed)}.cx-number-field__validation--info{color:var(--info)}.cx-number-field__validation--success{color:var(--success)}.cx-number-field__validation--warning{color:var(--warning)}.cx-number-field__validation--error{color:var(--danger)}.cx-number-field__validation-icon{flex:0 0 auto;margin-top:2px}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNumberFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-number-field', imports: [CxIconComponent, CxSpinnerComponent, CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-number-field\" [class.cx-number-field--small]=\"size$() === 'small'\" [class.cx-number-field--large]=\"size$() === 'large'\">\n  @if (label.trim() || optional) {\n    <div class=\"cx-number-field__header\">\n      @if (label.trim()) {\n        <div class=\"cx-number-field__label\" [id]=\"labelId\">{{ label }}</div>\n      }\n\n      @if (optional && label.trim()) {\n        <div class=\"cx-number-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-number-field__field-shell\"\n    [class.cx-number-field__field-shell--focused]=\"shellFocused$()\"\n    [class.cx-number-field__field-shell--disabled]=\"disabled$()\"\n    [class.cx-number-field__field-shell--loading]=\"loading$()\"\n    [class.cx-number-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n  >\n    @if (steppers$()) {\n      <button\n        type=\"button\"\n        class=\"cx-number-field__stepper cx-number-field__stepper--decrement\"\n        aria-label=\"Decrease\"\n        [disabled]=\"!canDecrement$()\"\n        (click)=\"onStep(-1)\"\n      >\n        <cx-icon icon=\"minus\" [size]=\"16\" />\n      </button>\n    }\n\n    @if (prependText$(); as prependText) {\n      <span class=\"cx-number-field__affix cx-number-field__affix--prepend\">{{ prependText }}</span>\n    }\n\n    <input\n      #field\n      type=\"number\"\n      inputmode=\"decimal\"\n      class=\"cx-number-field__field\"\n      [class.cx-number-field__field--stepper]=\"steppers$()\"\n      [value]=\"draft$()\"\n      [disabled]=\"isLocked$()\"\n      [attr.min]=\"min$() ?? null\"\n      [attr.max]=\"max$() ?? null\"\n      [attr.step]=\"step$() ?? null\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.enter)=\"onCommitOnEnter($event)\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (appendText$(); as appendText) {\n      <span class=\"cx-number-field__affix cx-number-field__affix--append\">{{ appendText }}</span>\n    }\n\n    @if (loading$()) {\n      <span class=\"cx-number-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-number-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n\n    @if (steppers$()) {\n      <button\n        type=\"button\"\n        class=\"cx-number-field__stepper cx-number-field__stepper--increment\"\n        aria-label=\"Increase\"\n        [disabled]=\"!canIncrement$()\"\n        (click)=\"onStep(1)\"\n      >\n        <cx-icon icon=\"plus\" [size]=\"16\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-number-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-number-field__hint\">{{ hint$() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-number-field{width:100%}.cx-number-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-number-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-number-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-number-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink)}.cx-number-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-number-field__field-shell:hover:not(.cx-number-field__field-shell--disabled):not(.cx-number-field__field-shell--error){border-color:var(--border-hover)}.cx-number-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-number-field__field-shell:has(.cx-number-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-number-field__field-shell--error,.cx-number-field__field-shell--error:hover:not(.cx-number-field__field-shell--disabled){border-color:var(--danger)}.cx-number-field__field-shell--disabled{opacity:.55;cursor:default}.cx-number-field__field-shell--loading{cursor:default}.cx-number-field--small .cx-number-field__field-shell{min-height:var(--controller-size-small)}.cx-number-field--large .cx-number-field__field-shell{min-height:40px}.cx-number-field__affix,.cx-number-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-number-field__affix{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);white-space:nowrap}.cx-number-field--small .cx-number-field__affix,.cx-number-field--small .cx-number-field__field{font-size:var(--font-size-body-sm)}.cx-number-field--large .cx-number-field__affix,.cx-number-field--large .cx-number-field__field{font-size:var(--font-size-body-lg)}.cx-number-field__field{flex:1 1 auto;width:100%;min-width:0;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);appearance:textfield}.cx-number-field__field::-webkit-outer-spin-button,.cx-number-field__field::-webkit-inner-spin-button{margin:0;appearance:none}.cx-number-field__field::placeholder{color:var(--placeholder)}.cx-number-field__field:focus-visible{outline:0}.cx-number-field__clear{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-number-field__clear:hover{background:var(--opacity-darken);color:var(--ink)}.cx-number-field__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-number-field__stepper{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-number-field__stepper:hover:not(:disabled){background:var(--opacity-darken);color:var(--ink)}.cx-number-field__stepper:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-number-field__stepper:disabled{opacity:var(--opacity-disabled);cursor:default}.cx-number-field__field--stepper{text-align:center}.cx-number-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-number-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-number-field__validation{display:inline-flex;align-items:flex-start;gap:var(--space-xs);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body-relaxed)}.cx-number-field__validation--info{color:var(--info)}.cx-number-field__validation--success{color:var(--success)}.cx-number-field__validation--warning{color:var(--warning)}.cx-number-field__validation--error{color:var(--danger)}.cx-number-field__validation-icon{flex:0 0 auto;margin-top:2px}"] }]
        }], propDecorators: { fieldRef: [{
                type: ViewChild,
                args: ['field', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], optional: [{
                type: Input
            }], value: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], step: [{
                type: Input
            }], size: [{
                type: Input
            }], clearable: [{
                type: Input
            }], steppers: [{
                type: Input
            }], prependText: [{
                type: Input
            }], appendText: [{
                type: Input
            }], hint: [{
                type: Input
            }], validation: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], clear: [{
                type: Output
            }] } });
