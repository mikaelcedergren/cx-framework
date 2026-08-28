import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export const CX_PHONE_COUNTRY_CODE_OPTIONS = [
    { code: '+46', label: 'SE +46', country: 'Sweden' },
    { code: '+1', label: 'US +1', country: 'United States' },
    { code: '+44', label: 'GB +44', country: 'United Kingdom' },
    { code: '+45', label: 'DK +45', country: 'Denmark' },
    { code: '+47', label: 'NO +47', country: 'Norway' },
    { code: '+358', label: 'FI +358', country: 'Finland' },
    { code: '+49', label: 'DE +49', country: 'Germany' },
    { code: '+31', label: 'NL +31', country: 'Netherlands' },
    { code: '+33', label: 'FR +33', country: 'France' },
    { code: '+34', label: 'ES +34', country: 'Spain' },
    { code: '+39', label: 'IT +39', country: 'Italy' },
    { code: '+351', label: 'PT +351', country: 'Portugal' },
    { code: '+48', label: 'PL +48', country: 'Poland' },
    { code: '+372', label: 'EE +372', country: 'Estonia' },
    { code: '+371', label: 'LV +371', country: 'Latvia' },
    { code: '+370', label: 'LT +370', country: 'Lithuania' },
    { code: '+353', label: 'IE +353', country: 'Ireland' },
    { code: '+41', label: 'CH +41', country: 'Switzerland' },
    { code: '+43', label: 'AT +43', country: 'Austria' },
    { code: '+61', label: 'AU +61', country: 'Australia' },
    { code: '+64', label: 'NZ +64', country: 'New Zealand' },
    { code: '+81', label: 'JP +81', country: 'Japan' },
    { code: '+82', label: 'KR +82', country: 'South Korea' },
    { code: '+91', label: 'IN +91', country: 'India' },
    { code: '+55', label: 'BR +55', country: 'Brazil' },
];
export class CxPhoneFieldComponent {
    static nextId = 0;
    valueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    countryCodeState = signal('+46', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "countryCodeState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    labelId = `cx-phone-field-label-${CxPhoneFieldComponent.nextId}`;
    messagesId = `cx-phone-field-messages-${CxPhoneFieldComponent.nextId++}`;
    fieldRef;
    label = 'Phone number';
    ariaLabel;
    optional = false;
    disabled = false;
    size = 'default';
    loading = false;
    clearable = false;
    hint;
    set countryCode(value) {
        this.countryCodeState.set(this.normalizeCountryCode(value));
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set value(value) {
        this.valueState.set(value ?? '');
    }
    valueChange = new EventEmitter();
    countryCodeChange = new EventEmitter();
    focusChange = new EventEmitter();
    clear = new EventEmitter();
    value$ = this.valueState.asReadonly();
    countryCode$ = this.countryCodeState.asReadonly();
    isFocused$ = computed(() => this.focusedState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isFocused$" }] : /* istanbul ignore next */ []));
    countryCodeOptions$ = computed(() => {
        const countryCode = this.countryCodeState();
        if (CX_PHONE_COUNTRY_CODE_OPTIONS.some(option => option.code === countryCode)) {
            return CX_PHONE_COUNTRY_CODE_OPTIONS;
        }
        return [
            { code: countryCode, label: countryCode, country: 'Custom' },
            ...CX_PHONE_COUNTRY_CODE_OPTIONS,
        ];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "countryCodeOptions$" }] : /* istanbul ignore next */ []));
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
    onCountryCodeChange(event) {
        if (this.disabled || this.loading) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) {
            return;
        }
        const nextCountryCode = this.normalizeCountryCode(target.value);
        this.countryCodeState.set(nextCountryCode);
        this.countryCodeChange.emit(nextCountryCode);
    }
    onFocusIn() {
        if (this.disabled || this.loading || this.focusedState()) {
            return;
        }
        this.focusedState.set(true);
        this.focusChange.emit(true);
    }
    onFocusOut(event) {
        const nextTarget = event.relatedTarget;
        const currentTarget = event.currentTarget;
        if (nextTarget instanceof Node && currentTarget instanceof Node && currentTarget.contains(nextTarget)) {
            return;
        }
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
    normalizeCountryCode(value) {
        const trimmed = value?.trim() || '+46';
        return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPhoneFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxPhoneFieldComponent, isStandalone: true, selector: "cx-phone-field", inputs: { label: "label", ariaLabel: "ariaLabel", optional: "optional", disabled: "disabled", size: "size", loading: "loading", clearable: "clearable", hint: "hint", countryCode: "countryCode", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", countryCodeChange: "countryCodeChange", focusChange: "focusChange", clear: "clear" }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-phone-field\"\n  [class.cx-phone-field--small]=\"size === 'small'\"\n  [class.cx-phone-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-phone-field__header\">\n      <div class=\"cx-phone-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-phone-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-phone-field__field-shell\"\n    [class.cx-phone-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-phone-field__field-shell--disabled]=\"disabled\"\n    [class.cx-phone-field__field-shell--loading]=\"loading\"\n    [class.cx-phone-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    (focusin)=\"onFocusIn()\"\n    (focusout)=\"onFocusOut($event)\"\n  >\n    <span class=\"cx-phone-field__country\">\n      <select\n        class=\"cx-phone-field__country-select\"\n        aria-label=\"Country code\"\n        autocomplete=\"tel-country-code\"\n        name=\"country-code\"\n        [disabled]=\"disabled || loading\"\n        [value]=\"countryCode$()\"\n        (change)=\"onCountryCodeChange($event)\"\n      >\n        @for (option of countryCodeOptions$(); track option.code) {\n          <option [value]=\"option.code\">{{ option.label }}</option>\n        }\n      </select>\n      <cx-icon class=\"cx-phone-field__country-icon\" icon=\"chevron-down\" [size]=\"12\" />\n    </span>\n\n    <span class=\"cx-phone-field__divider\" aria-hidden=\"true\"></span>\n\n    <input\n      #field\n      type=\"tel\"\n      inputmode=\"tel\"\n      class=\"cx-phone-field__field\"\n      name=\"phone\"\n      autocomplete=\"tel-national\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (loading) {\n      <span class=\"cx-phone-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-phone-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-phone-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-phone-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-phone-field{width:100%}.cx-phone-field--small{--cx-phone-field-font-size: var(--font-size-body-sm);--cx-phone-field-country-width: 74px}.cx-phone-field--large{--cx-phone-field-font-size: var(--font-size-body-lg);--cx-phone-field-country-width: 94px}.cx-phone-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-phone-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-phone-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-phone-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-phone-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-phone-field__field-shell:hover:not(.cx-phone-field__field-shell--disabled):not(.cx-phone-field__field-shell--error){border-color:var(--border-hover)}.cx-phone-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-phone-field__field-shell:has(.cx-phone-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-phone-field__field-shell--error,.cx-phone-field__field-shell--error:hover:not(.cx-phone-field__field-shell--disabled){border-color:var(--danger)}.cx-phone-field__field-shell--disabled{opacity:.55;cursor:default}.cx-phone-field__field-shell--loading{cursor:progress}.cx-phone-field--small .cx-phone-field__field-shell{min-height:var(--controller-size-small)}.cx-phone-field--large .cx-phone-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-phone-field__field-shell:has(.cx-phone-field__country-select:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-phone-field__country{position:relative;display:inline-flex;flex:0 0 var(--cx-phone-field-country-width, 84px);min-width:0;align-items:center}.cx-phone-field__country-select{width:100%;min-width:0;padding:0 calc(var(--space-md) + var(--space-xs)) 0 0;border:0;appearance:none;background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;font-size:var(--cx-phone-field-font-size, var(--font-size-body));line-height:var(--line-height-control);outline:0}.cx-phone-field__country-select:disabled{cursor:default}.cx-phone-field__country-icon{position:absolute;right:0;pointer-events:none;color:var(--opacity-high)}.cx-phone-field__divider{align-self:stretch;width:1px;min-height:20px;margin:var(--space-sm) 0;background:var(--opacity-low)}.cx-phone-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--cx-phone-field-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-phone-field__field:focus-visible{outline:0}.cx-phone-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-phone-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-phone-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-phone-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-phone-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPhoneFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-phone-field', imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-phone-field\"\n  [class.cx-phone-field--small]=\"size === 'small'\"\n  [class.cx-phone-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-phone-field__header\">\n      <div class=\"cx-phone-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-phone-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-phone-field__field-shell\"\n    [class.cx-phone-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-phone-field__field-shell--disabled]=\"disabled\"\n    [class.cx-phone-field__field-shell--loading]=\"loading\"\n    [class.cx-phone-field__field-shell--error]=\"hasError$()\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    (focusin)=\"onFocusIn()\"\n    (focusout)=\"onFocusOut($event)\"\n  >\n    <span class=\"cx-phone-field__country\">\n      <select\n        class=\"cx-phone-field__country-select\"\n        aria-label=\"Country code\"\n        autocomplete=\"tel-country-code\"\n        name=\"country-code\"\n        [disabled]=\"disabled || loading\"\n        [value]=\"countryCode$()\"\n        (change)=\"onCountryCodeChange($event)\"\n      >\n        @for (option of countryCodeOptions$(); track option.code) {\n          <option [value]=\"option.code\">{{ option.label }}</option>\n        }\n      </select>\n      <cx-icon class=\"cx-phone-field__country-icon\" icon=\"chevron-down\" [size]=\"12\" />\n    </span>\n\n    <span class=\"cx-phone-field__divider\" aria-hidden=\"true\"></span>\n\n    <input\n      #field\n      type=\"tel\"\n      inputmode=\"tel\"\n      class=\"cx-phone-field__field\"\n      name=\"phone\"\n      autocomplete=\"tel-national\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n\n    @if (loading) {\n      <span class=\"cx-phone-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-phone-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-phone-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-phone-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-phone-field{width:100%}.cx-phone-field--small{--cx-phone-field-font-size: var(--font-size-body-sm);--cx-phone-field-country-width: 74px}.cx-phone-field--large{--cx-phone-field-font-size: var(--font-size-body-lg);--cx-phone-field-country-width: 94px}.cx-phone-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-phone-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-phone-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-phone-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-phone-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-phone-field__field-shell:hover:not(.cx-phone-field__field-shell--disabled):not(.cx-phone-field__field-shell--error){border-color:var(--border-hover)}.cx-phone-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-phone-field__field-shell:has(.cx-phone-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-phone-field__field-shell--error,.cx-phone-field__field-shell--error:hover:not(.cx-phone-field__field-shell--disabled){border-color:var(--danger)}.cx-phone-field__field-shell--disabled{opacity:.55;cursor:default}.cx-phone-field__field-shell--loading{cursor:progress}.cx-phone-field--small .cx-phone-field__field-shell{min-height:var(--controller-size-small)}.cx-phone-field--large .cx-phone-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-phone-field__field-shell:has(.cx-phone-field__country-select:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-phone-field__country{position:relative;display:inline-flex;flex:0 0 var(--cx-phone-field-country-width, 84px);min-width:0;align-items:center}.cx-phone-field__country-select{width:100%;min-width:0;padding:0 calc(var(--space-md) + var(--space-xs)) 0 0;border:0;appearance:none;background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;font-size:var(--cx-phone-field-font-size, var(--font-size-body));line-height:var(--line-height-control);outline:0}.cx-phone-field__country-select:disabled{cursor:default}.cx-phone-field__country-icon{position:absolute;right:0;pointer-events:none;color:var(--opacity-high)}.cx-phone-field__divider{align-self:stretch;width:1px;min-height:20px;margin:var(--space-sm) 0;background:var(--opacity-low)}.cx-phone-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--cx-phone-field-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-phone-field__field:focus-visible{outline:0}.cx-phone-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-phone-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-phone-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-phone-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-phone-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"] }]
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
            }], countryCode: [{
                type: Input
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], countryCodeChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], clear: [{
                type: Output
            }] } });
