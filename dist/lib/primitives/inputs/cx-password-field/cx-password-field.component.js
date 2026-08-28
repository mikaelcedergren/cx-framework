import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxPasswordFieldComponent {
    static nextId = 0;
    valueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    revealedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "revealedState" }] : /* istanbul ignore next */ []));
    revealStepState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "revealStepState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    revealSecondsValue = 6;
    firstStepTimer;
    stepTimer;
    hideTimer;
    labelId = `cx-password-field-label-${CxPasswordFieldComponent.nextId}`;
    messagesId = `cx-password-field-messages-${CxPasswordFieldComponent.nextId++}`;
    fieldRef;
    label = 'Password';
    ariaLabel;
    name;
    autocomplete = 'current-password';
    hint;
    optional = false;
    disabled = false;
    loading = false;
    clearable = false;
    size = 'default';
    /**
     * Seconds the password stays revealed before it auto-hides. Defaults to 6.
     */
    set revealSeconds(value) {
        this.revealSecondsValue =
            Number.isFinite(value) && value >= 1 ? Math.floor(value) : 6;
    }
    get revealSeconds() {
        return this.revealSecondsValue;
    }
    set value(value) {
        this.valueState.set(value ?? '');
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    revealedChange = new EventEmitter();
    value$ = this.valueState.asReadonly();
    isFocused$ = computed(() => this.focusedState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isFocused$" }] : /* istanbul ignore next */ []));
    revealed$ = this.revealedState.asReadonly();
    validationMessages$ = () => this.disabled
        ? []
        : normalizeCxValidation(this.validationState());
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
    hasClear$ = () => this.clearable && !!this.valueState() && !this.disabled && !this.loading;
    ngOnDestroy() {
        this.stopCountdown();
    }
    get resolvedAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        const label = this.label.trim();
        return label || undefined;
    }
    get resolvedAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedAriaDescribedBy() {
        return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
    }
    get resolvedName() {
        return this.name?.trim() || null;
    }
    get resolvedAutocomplete() {
        return this.autocomplete?.trim() || null;
    }
    focus() {
        this.fieldRef?.nativeElement.focus();
    }
    onInput(event) {
        if (this.disabled || this.loading) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        this.valueState.set(target.value);
        this.valueChange.emit(target.value);
    }
    onFocus() {
        if (this.disabled || this.loading) {
            return;
        }
        this.focusedState.set(true);
        this.focusChange.emit(true);
    }
    onBlur() {
        this.focusedState.set(false);
        this.focusChange.emit(false);
    }
    onEscapeKey() {
        this.fieldRef?.nativeElement.blur();
    }
    onToggle() {
        if (this.disabled || this.loading) {
            return;
        }
        if (this.revealedState()) {
            this.hide();
        }
        else {
            this.reveal();
        }
    }
    onClear(event) {
        if (this.disabled || this.loading) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.valueState.set('');
        this.valueChange.emit('');
        queueMicrotask(() => this.fieldRef?.nativeElement.focus());
    }
    reveal() {
        this.stopCountdown();
        this.revealStepState.set(0);
        this.revealedState.set(true);
        this.revealedChange.emit(true);
        this.firstStepTimer = setTimeout(() => {
            this.setRevealStep(1);
        }, 30);
        this.stepTimer = setInterval(() => {
            this.setRevealStep(this.revealStepState() + 1);
        }, 1000);
        this.hideTimer = setTimeout(() => {
            this.hide();
        }, this.revealSecondsValue * 1000);
    }
    hide() {
        this.stopCountdown();
        if (this.revealedState()) {
            this.revealedState.set(false);
            this.revealedChange.emit(false);
        }
    }
    stopCountdown() {
        this.stopStepTimers();
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = undefined;
        }
    }
    stopStepTimers() {
        if (this.firstStepTimer) {
            clearTimeout(this.firstStepTimer);
            this.firstStepTimer = undefined;
        }
        if (this.stepTimer) {
            clearInterval(this.stepTimer);
            this.stepTimer = undefined;
        }
    }
    setRevealStep(step) {
        const nextStep = Math.min(Math.max(step, 0), this.revealSecondsValue);
        this.revealStepState.set(nextStep);
        if (nextStep >= this.revealSecondsValue) {
            this.stopStepTimers();
        }
    }
    revealOffsetStyle() {
        return String(-(this.revealStepState() / this.revealSecondsValue));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPasswordFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxPasswordFieldComponent, isStandalone: true, selector: "cx-password-field", inputs: { label: "label", ariaLabel: "ariaLabel", name: "name", autocomplete: "autocomplete", hint: "hint", optional: "optional", disabled: "disabled", loading: "loading", clearable: "clearable", size: "size", revealSeconds: "revealSeconds", value: "value", validation: "validation" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", revealedChange: "revealedChange" }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-password-field\"\n  [class.cx-password-field--small]=\"size === 'small'\"\n  [class.cx-password-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-password-field__header\">\n      <div class=\"cx-password-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-password-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-password-field__field-shell\"\n    [class.cx-password-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-password-field__field-shell--disabled]=\"disabled\"\n    [class.cx-password-field__field-shell--loading]=\"loading\"\n    [class.cx-password-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n  >\n    <input\n      #field\n      [type]=\"revealed$() ? 'text' : 'password'\"\n      class=\"cx-password-field__field\"\n      [attr.name]=\"resolvedName\"\n      [attr.autocomplete]=\"resolvedAutocomplete\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (loading) {\n      <span class=\"cx-password-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-password-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n\n    <button\n      type=\"button\"\n      class=\"cx-password-field__toggle\"\n      [class.cx-password-field__toggle--active]=\"revealed$()\"\n      [attr.aria-label]=\"revealed$() ? 'Hide password' : 'Show password'\"\n      [attr.aria-pressed]=\"revealed$()\"\n      [disabled]=\"disabled || loading\"\n      (click)=\"onToggle()\"\n    >\n      @if (revealed$()) {\n        <span class=\"cx-password-field__reveal\" aria-hidden=\"true\">\n          <svg class=\"cx-password-field__reveal-ring\" viewBox=\"0 0 24 24\" fill=\"none\" focusable=\"false\">\n            <g transform=\"rotate(-90 12 12)\">\n              <circle\n                class=\"cx-password-field__reveal-progress\"\n                cx=\"12\"\n                cy=\"12\"\n                r=\"8.25\"\n                pathLength=\"1\"\n                [style.stroke-dashoffset]=\"revealOffsetStyle()\"\n              />\n            </g>\n          </svg>\n        </span>\n      } @else {\n        <cx-icon icon=\"watch\" [size]=\"16\" />\n      }\n    </button>\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-password-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-password-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-password-field{width:100%}.cx-password-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-password-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-password-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-password-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-password-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-password-field__field-shell:hover:not(.cx-password-field__field-shell--disabled):not(.cx-password-field__field-shell--error){border-color:var(--border-hover)}.cx-password-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-password-field__field-shell:has(.cx-password-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-password-field__field-shell--error,.cx-password-field__field-shell--error:hover:not(.cx-password-field__field-shell--disabled){border-color:var(--danger)}.cx-password-field__field-shell--disabled{opacity:.55;cursor:default}.cx-password-field__field-shell--loading{cursor:progress}.cx-password-field__field-shell:hover:not(.cx-password-field__field-shell--disabled):not(.cx-password-field__field-shell--error),.cx-password-field__field-shell:focus-within:not(.cx-password-field__field-shell--disabled):not(.cx-password-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-password-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-password-field--small .cx-password-field__field-shell{min-height:var(--controller-size-small)}.cx-password-field--small .cx-password-field__field{font-size:var(--font-size-body-sm)}.cx-password-field--large .cx-password-field__field-shell{min-height:var(--controller-size-large)}.cx-password-field--large .cx-password-field__field{font-size:var(--font-size-body-lg)}.cx-password-field__field:focus-visible{outline:0}.cx-password-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-password-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-password-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-password-field__toggle{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;outline:none;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-password-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-password-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-password-field__toggle:hover:not(:disabled):not(.cx-password-field__toggle--active){background:var(--opacity-low);color:var(--ink)}.cx-password-field__toggle:disabled{cursor:not-allowed;opacity:.5}.cx-password-field__toggle:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-password-field__toggle--active{cursor:pointer;color:var(--primary)}.cx-password-field__reveal{position:relative;display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center}.cx-password-field__reveal-ring{position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none}.cx-password-field__reveal-progress{stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;transition:stroke-dashoffset calc(var(--motion-slow)*1.35) cubic-bezier(0.16, 1, 0.3, 1)}@media(prefers-reduced-motion: reduce){.cx-password-field__reveal-progress{transition:none;opacity:.72}}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPasswordFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-password-field', imports: [CxValidationMessageComponent, CxSpinnerComponent, CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-password-field\"\n  [class.cx-password-field--small]=\"size === 'small'\"\n  [class.cx-password-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-password-field__header\">\n      <div class=\"cx-password-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-password-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-password-field__field-shell\"\n    [class.cx-password-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-password-field__field-shell--disabled]=\"disabled\"\n    [class.cx-password-field__field-shell--loading]=\"loading\"\n    [class.cx-password-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n  >\n    <input\n      #field\n      [type]=\"revealed$() ? 'text' : 'password'\"\n      class=\"cx-password-field__field\"\n      [attr.name]=\"resolvedName\"\n      [attr.autocomplete]=\"resolvedAutocomplete\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (loading) {\n      <span class=\"cx-password-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-password-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n\n    <button\n      type=\"button\"\n      class=\"cx-password-field__toggle\"\n      [class.cx-password-field__toggle--active]=\"revealed$()\"\n      [attr.aria-label]=\"revealed$() ? 'Hide password' : 'Show password'\"\n      [attr.aria-pressed]=\"revealed$()\"\n      [disabled]=\"disabled || loading\"\n      (click)=\"onToggle()\"\n    >\n      @if (revealed$()) {\n        <span class=\"cx-password-field__reveal\" aria-hidden=\"true\">\n          <svg class=\"cx-password-field__reveal-ring\" viewBox=\"0 0 24 24\" fill=\"none\" focusable=\"false\">\n            <g transform=\"rotate(-90 12 12)\">\n              <circle\n                class=\"cx-password-field__reveal-progress\"\n                cx=\"12\"\n                cy=\"12\"\n                r=\"8.25\"\n                pathLength=\"1\"\n                [style.stroke-dashoffset]=\"revealOffsetStyle()\"\n              />\n            </g>\n          </svg>\n        </span>\n      } @else {\n        <cx-icon icon=\"watch\" [size]=\"16\" />\n      }\n    </button>\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-password-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-password-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-password-field{width:100%}.cx-password-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-password-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-password-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-password-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-password-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-password-field__field-shell:hover:not(.cx-password-field__field-shell--disabled):not(.cx-password-field__field-shell--error){border-color:var(--border-hover)}.cx-password-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-password-field__field-shell:has(.cx-password-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-password-field__field-shell--error,.cx-password-field__field-shell--error:hover:not(.cx-password-field__field-shell--disabled){border-color:var(--danger)}.cx-password-field__field-shell--disabled{opacity:.55;cursor:default}.cx-password-field__field-shell--loading{cursor:progress}.cx-password-field__field-shell:hover:not(.cx-password-field__field-shell--disabled):not(.cx-password-field__field-shell--error),.cx-password-field__field-shell:focus-within:not(.cx-password-field__field-shell--disabled):not(.cx-password-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-password-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-password-field--small .cx-password-field__field-shell{min-height:var(--controller-size-small)}.cx-password-field--small .cx-password-field__field{font-size:var(--font-size-body-sm)}.cx-password-field--large .cx-password-field__field-shell{min-height:var(--controller-size-large)}.cx-password-field--large .cx-password-field__field{font-size:var(--font-size-body-lg)}.cx-password-field__field:focus-visible{outline:0}.cx-password-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-password-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-password-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-password-field__toggle{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;outline:none;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-password-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-password-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-password-field__toggle:hover:not(:disabled):not(.cx-password-field__toggle--active){background:var(--opacity-low);color:var(--ink)}.cx-password-field__toggle:disabled{cursor:not-allowed;opacity:.5}.cx-password-field__toggle:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-password-field__toggle--active{cursor:pointer;color:var(--primary)}.cx-password-field__reveal{position:relative;display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center}.cx-password-field__reveal-ring{position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none}.cx-password-field__reveal-progress{stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;transition:stroke-dashoffset calc(var(--motion-slow)*1.35) cubic-bezier(0.16, 1, 0.3, 1)}@media(prefers-reduced-motion: reduce){.cx-password-field__reveal-progress{transition:none;opacity:.72}}"] }]
        }], propDecorators: { fieldRef: [{
                type: ViewChild,
                args: ['field', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], name: [{
                type: Input
            }], autocomplete: [{
                type: Input
            }], hint: [{
                type: Input
            }], optional: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], clearable: [{
                type: Input
            }], size: [{
                type: Input
            }], revealSeconds: [{
                type: Input
            }], value: [{
                type: Input
            }], validation: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], revealedChange: [{
                type: Output
            }] } });
