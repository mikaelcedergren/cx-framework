import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxEmailFieldComponent {
    static nextId = 0;
    valueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    labelId = `cx-email-field-label-${CxEmailFieldComponent.nextId}`;
    messagesId = `cx-email-field-messages-${CxEmailFieldComponent.nextId++}`;
    fieldRef;
    label = 'Email';
    ariaLabel;
    optional = false;
    disabled = false;
    size = 'default';
    loading = false;
    clearable = false;
    hint;
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set value(value) {
        this.valueState.set(value ?? '');
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    clear = new EventEmitter();
    value$ = this.valueState.asReadonly();
    isFocused$ = computed(() => this.focusedState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isFocused$" }] : /* istanbul ignore next */ []));
    validationMessages$ = () => this.disabled
        ? []
        : normalizeCxValidation(this.validationState());
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
    hasClear$ = () => this.clearable && !!this.valueState() && !this.disabled && !this.loading;
    get resolvedAriaDescribedBy() {
        return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
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
    onClear(event) {
        if (this.disabled || this.loading) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.valueState.set('');
        this.valueChange.emit('');
        this.clear.emit();
        queueMicrotask(() => this.fieldRef?.nativeElement.focus());
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxEmailFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxEmailFieldComponent, isStandalone: true, selector: "cx-email-field", inputs: { label: "label", ariaLabel: "ariaLabel", optional: "optional", disabled: "disabled", size: "size", loading: "loading", clearable: "clearable", hint: "hint", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", clear: "clear" }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-email-field\"\n  [class.cx-email-field--small]=\"size === 'small'\"\n  [class.cx-email-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-email-field__header\">\n      <div class=\"cx-email-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-email-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-email-field__field-shell\"\n    [class.cx-email-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-email-field__field-shell--disabled]=\"disabled\"\n    [class.cx-email-field__field-shell--loading]=\"loading\"\n    [class.cx-email-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n  >\n    <input\n      #field\n      type=\"email\"\n      inputmode=\"email\"\n      autocapitalize=\"none\"\n      spellcheck=\"false\"\n      class=\"cx-email-field__field\"\n      name=\"email\"\n      autocomplete=\"email\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (loading) {\n      <span class=\"cx-email-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-email-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-email-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-email-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-email-field{width:100%}.cx-email-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-email-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-email-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-email-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-email-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-email-field__field-shell:hover:not(.cx-email-field__field-shell--disabled):not(.cx-email-field__field-shell--error){border-color:var(--border-hover)}.cx-email-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-email-field__field-shell:has(.cx-email-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-email-field__field-shell--error,.cx-email-field__field-shell--error:hover:not(.cx-email-field__field-shell--disabled){border-color:var(--danger)}.cx-email-field__field-shell--disabled{opacity:.55;cursor:default}.cx-email-field__field-shell--loading{cursor:progress}.cx-email-field__field-shell:hover:not(.cx-email-field__field-shell--disabled):not(.cx-email-field__field-shell--error),.cx-email-field__field-shell:focus-within:not(.cx-email-field__field-shell--disabled):not(.cx-email-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-email-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-email-field--small .cx-email-field__field-shell{min-height:var(--controller-size-small)}.cx-email-field--small .cx-email-field__field{font-size:var(--font-size-body-sm)}.cx-email-field--large .cx-email-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-email-field--large .cx-email-field__field{font-size:var(--font-size-body-lg)}.cx-email-field__field:focus-visible{outline:0}.cx-email-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-email-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-email-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-email-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-email-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxEmailFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-email-field', imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-email-field\"\n  [class.cx-email-field--small]=\"size === 'small'\"\n  [class.cx-email-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-email-field__header\">\n      <div class=\"cx-email-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-email-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-email-field__field-shell\"\n    [class.cx-email-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-email-field__field-shell--disabled]=\"disabled\"\n    [class.cx-email-field__field-shell--loading]=\"loading\"\n    [class.cx-email-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n  >\n    <input\n      #field\n      type=\"email\"\n      inputmode=\"email\"\n      autocapitalize=\"none\"\n      spellcheck=\"false\"\n      class=\"cx-email-field__field\"\n      name=\"email\"\n      autocomplete=\"email\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (loading) {\n      <span class=\"cx-email-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-email-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-email-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-email-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-email-field{width:100%}.cx-email-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-email-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-email-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-email-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-email-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-email-field__field-shell:hover:not(.cx-email-field__field-shell--disabled):not(.cx-email-field__field-shell--error){border-color:var(--border-hover)}.cx-email-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-email-field__field-shell:has(.cx-email-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-email-field__field-shell--error,.cx-email-field__field-shell--error:hover:not(.cx-email-field__field-shell--disabled){border-color:var(--danger)}.cx-email-field__field-shell--disabled{opacity:.55;cursor:default}.cx-email-field__field-shell--loading{cursor:progress}.cx-email-field__field-shell:hover:not(.cx-email-field__field-shell--disabled):not(.cx-email-field__field-shell--error),.cx-email-field__field-shell:focus-within:not(.cx-email-field__field-shell--disabled):not(.cx-email-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-email-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-email-field--small .cx-email-field__field-shell{min-height:var(--controller-size-small)}.cx-email-field--small .cx-email-field__field{font-size:var(--font-size-body-sm)}.cx-email-field--large .cx-email-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-email-field--large .cx-email-field__field{font-size:var(--font-size-body-lg)}.cx-email-field__field:focus-visible{outline:0}.cx-email-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-email-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-email-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-email-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-email-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"] }]
        }], propDecorators: { fieldRef: [{
                type: ViewChild,
                args: ['field', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], optional: [{
                type: Input
            }], disabled: [{
                type: Input
            }], size: [{
                type: Input
            }], loading: [{
                type: Input
            }], clearable: [{
                type: Input
            }], hint: [{
                type: Input
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], clear: [{
                type: Output
            }] } });
