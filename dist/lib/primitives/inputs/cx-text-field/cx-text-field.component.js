import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxTextFieldComponent {
    static nextId = 0;
    valueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    labelId = `cx-text-field-label-${CxTextFieldComponent.nextId}`;
    messagesId = `cx-text-field-messages-${CxTextFieldComponent.nextId++}`;
    fieldRef;
    label = 'Label';
    ariaLabel;
    placeholder;
    name;
    autocomplete;
    inlineEdit = false;
    optional = false;
    disabled = false;
    size = 'default';
    loading = false;
    clearable = false;
    prependIcon;
    appendIcon;
    prependText;
    appendText;
    hint;
    combobox;
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
    onEnterKey(event) {
        if (this.inlineEdit) {
            event.preventDefault();
            this.fieldRef?.nativeElement.blur();
        }
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTextFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTextFieldComponent, isStandalone: true, selector: "cx-text-field", inputs: { label: "label", ariaLabel: "ariaLabel", placeholder: "placeholder", name: "name", autocomplete: "autocomplete", inlineEdit: "inlineEdit", optional: "optional", disabled: "disabled", size: "size", loading: "loading", clearable: "clearable", prependIcon: "prependIcon", appendIcon: "appendIcon", prependText: "prependText", appendText: "appendText", hint: "hint", combobox: "combobox", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", clear: "clear" }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-text-field\"\n  [class.cx-text-field--small]=\"size === 'small'\"\n  [class.cx-text-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-text-field__header\">\n      <div class=\"cx-text-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-text-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-text-field__field-shell\"\n    [class.cx-text-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-text-field__field-shell--disabled]=\"disabled\"\n    [class.cx-text-field__field-shell--loading]=\"loading\"\n    [class.cx-text-field__field-shell--error]=\"hasError$()\"\n    [class.cx-text-field__field-shell--inline-edit]=\"inlineEdit\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n  >\n    @if (prependIcon; as iconName) {\n      <span class=\"cx-text-field__prepend\" aria-hidden=\"true\">\n        <cx-icon [icon]=\"iconName\" [size]=\"16\" />\n      </span>\n    }\n    @if (prependText) {\n      <span class=\"cx-text-field__affix cx-text-field__affix--prepend\">{{ prependText }}</span>\n    }\n    <input\n      #field\n      type=\"text\"\n      [attr.role]=\"combobox ? 'combobox' : null\"\n      [attr.aria-autocomplete]=\"combobox ? 'list' : null\"\n      [attr.aria-controls]=\"combobox?.controls || null\"\n      [attr.aria-expanded]=\"combobox ? combobox.expanded : null\"\n      [attr.aria-activedescendant]=\"combobox?.expanded ? combobox.activeDescendant || null : null\"\n      class=\"cx-text-field__field\"\n      [attr.name]=\"resolvedName\"\n      [attr.autocomplete]=\"resolvedAutocomplete\"\n      [attr.placeholder]=\"placeholder\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.enter)=\"onEnterKey($event)\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n    @if (appendText) {\n      <span class=\"cx-text-field__affix cx-text-field__affix--append\">{{ appendText }}</span>\n    }\n    @if (loading) {\n      <span class=\"cx-text-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-text-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n    @if (appendIcon; as iconName) {\n      <span class=\"cx-text-field__append\" aria-hidden=\"true\">\n        <cx-icon [icon]=\"iconName\" [size]=\"16\" />\n      </span>\n    }\n    <ng-content select=\"[cxTrailing]\" />\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-text-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-text-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-text-field{width:100%}.cx-text-field--small{--cx-text-field-font-size: var(--font-size-body-sm)}.cx-text-field--large{--cx-text-field-font-size: var(--font-size-body-lg)}.cx-text-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-text-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-text-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-text-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-text-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-text-field__field-shell:hover:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error){border-color:var(--border-hover)}.cx-text-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-text-field__field-shell:has(.cx-text-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-text-field__field-shell--error,.cx-text-field__field-shell--error:hover:not(.cx-text-field__field-shell--disabled){border-color:var(--danger)}.cx-text-field__field-shell--disabled{opacity:.55;cursor:default}.cx-text-field__field-shell--loading{cursor:progress}.cx-text-field__field-shell:hover:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error),.cx-text-field__field-shell:focus-within:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-text-field--small .cx-text-field__field-shell{min-height:var(--controller-size-small)}.cx-text-field--large .cx-text-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-text-field__prepend{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}.cx-text-field__append{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}.cx-text-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-text-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-text-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-text-field__affix{display:inline-flex;flex:0 0 auto;align-items:center;color:var(--opacity-high);font-size:var(--cx-text-field-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control);white-space:nowrap}.cx-text-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--cx-text-field-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-text-field__field::placeholder{color:var(--placeholder)}.cx-text-field__field:focus-visible{outline:0}.cx-text-field__field-shell--inline-edit{border-color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.cx-text-field__field-shell--inline-edit:hover:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error),.cx-text-field__field-shell--inline-edit.cx-text-field__field-shell--focused:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error),.cx-text-field__field-shell--inline-edit:has(.cx-text-field__field:focus-visible):not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error){border-color:var(--border-hover);background:var(--opacity-darken)}.cx-text-field__field-shell--inline-edit.cx-text-field__field-shell--error,.cx-text-field__field-shell--inline-edit.cx-text-field__field-shell--error:hover:not(.cx-text-field__field-shell--disabled){border-color:var(--danger)}.cx-text-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-text-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTextFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-text-field', imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-text-field\"\n  [class.cx-text-field--small]=\"size === 'small'\"\n  [class.cx-text-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-text-field__header\">\n      <div class=\"cx-text-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-text-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-text-field__field-shell\"\n    [class.cx-text-field__field-shell--focused]=\"isFocused$()\"\n    [class.cx-text-field__field-shell--disabled]=\"disabled\"\n    [class.cx-text-field__field-shell--loading]=\"loading\"\n    [class.cx-text-field__field-shell--error]=\"hasError$()\"\n    [class.cx-text-field__field-shell--inline-edit]=\"inlineEdit\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n  >\n    @if (prependIcon; as iconName) {\n      <span class=\"cx-text-field__prepend\" aria-hidden=\"true\">\n        <cx-icon [icon]=\"iconName\" [size]=\"16\" />\n      </span>\n    }\n    @if (prependText) {\n      <span class=\"cx-text-field__affix cx-text-field__affix--prepend\">{{ prependText }}</span>\n    }\n    <input\n      #field\n      type=\"text\"\n      [attr.role]=\"combobox ? 'combobox' : null\"\n      [attr.aria-autocomplete]=\"combobox ? 'list' : null\"\n      [attr.aria-controls]=\"combobox?.controls || null\"\n      [attr.aria-expanded]=\"combobox ? combobox.expanded : null\"\n      [attr.aria-activedescendant]=\"combobox?.expanded ? combobox.activeDescendant || null : null\"\n      class=\"cx-text-field__field\"\n      [attr.name]=\"resolvedName\"\n      [attr.autocomplete]=\"resolvedAutocomplete\"\n      [attr.placeholder]=\"placeholder\"\n      [disabled]=\"disabled || loading\"\n      [value]=\"value$()\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n      [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      (input)=\"onInput($event)\"\n      (focus)=\"onFocus()\"\n      (blur)=\"onBlur()\"\n      (keydown.enter)=\"onEnterKey($event)\"\n      (keydown.escape)=\"onEscapeKey()\"\n    />\n    @if (appendText) {\n      <span class=\"cx-text-field__affix cx-text-field__affix--append\">{{ appendText }}</span>\n    }\n    @if (loading) {\n      <span class=\"cx-text-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-text-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n    @if (appendIcon; as iconName) {\n      <span class=\"cx-text-field__append\" aria-hidden=\"true\">\n        <cx-icon [icon]=\"iconName\" [size]=\"16\" />\n      </span>\n    }\n    <ng-content select=\"[cxTrailing]\" />\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-text-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-text-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-text-field{width:100%}.cx-text-field--small{--cx-text-field-font-size: var(--font-size-body-sm)}.cx-text-field--large{--cx-text-field-font-size: var(--font-size-body-lg)}.cx-text-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-text-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-text-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-text-field__field-shell{box-sizing:border-box;display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-text-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-text-field__field-shell:hover:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error){border-color:var(--border-hover)}.cx-text-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-text-field__field-shell:has(.cx-text-field__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-text-field__field-shell--error,.cx-text-field__field-shell--error:hover:not(.cx-text-field__field-shell--disabled){border-color:var(--danger)}.cx-text-field__field-shell--disabled{opacity:.55;cursor:default}.cx-text-field__field-shell--loading{cursor:progress}.cx-text-field__field-shell:hover:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error),.cx-text-field__field-shell:focus-within:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-text-field--small .cx-text-field__field-shell{min-height:var(--controller-size-small)}.cx-text-field--large .cx-text-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-text-field__prepend{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}.cx-text-field__append{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}.cx-text-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-text-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-text-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-text-field__affix{display:inline-flex;flex:0 0 auto;align-items:center;color:var(--opacity-high);font-size:var(--cx-text-field-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control);white-space:nowrap}.cx-text-field__field{flex:1 1 auto;min-width:0;width:100%;height:100%;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--cx-text-field-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-text-field__field::placeholder{color:var(--placeholder)}.cx-text-field__field:focus-visible{outline:0}.cx-text-field__field-shell--inline-edit{border-color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.cx-text-field__field-shell--inline-edit:hover:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error),.cx-text-field__field-shell--inline-edit.cx-text-field__field-shell--focused:not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error),.cx-text-field__field-shell--inline-edit:has(.cx-text-field__field:focus-visible):not(.cx-text-field__field-shell--disabled):not(.cx-text-field__field-shell--error){border-color:var(--border-hover);background:var(--opacity-darken)}.cx-text-field__field-shell--inline-edit.cx-text-field__field-shell--error,.cx-text-field__field-shell--inline-edit.cx-text-field__field-shell--error:hover:not(.cx-text-field__field-shell--disabled){border-color:var(--danger)}.cx-text-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-text-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"] }]
        }], propDecorators: { fieldRef: [{
                type: ViewChild,
                args: ['field', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], name: [{
                type: Input
            }], autocomplete: [{
                type: Input
            }], inlineEdit: [{
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
            }], prependIcon: [{
                type: Input
            }], appendIcon: [{
                type: Input
            }], prependText: [{
                type: Input
            }], appendText: [{
                type: Input
            }], hint: [{
                type: Input
            }], combobox: [{
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
