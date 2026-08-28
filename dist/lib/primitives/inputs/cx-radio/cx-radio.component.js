import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxRadioComponent {
    static nextId = 0;
    baseId = `cx-radio-${++CxRadioComponent.nextId}`;
    selectedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    text = '';
    hint;
    disabled = false;
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set selected(value) {
        this.selectedState.set(value);
    }
    selectedChange = new EventEmitter();
    selected$ = this.selectedState.asReadonly();
    validationMessages$ = () => this.disabled
        ? []
        : normalizeCxValidation(this.validationState());
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
    hasText$ = () => !!this.text.trim();
    hintId = `${this.baseId}-hint`;
    messagesId = `${this.baseId}-messages`;
    describedBy$ = () => {
        if (this.showHint$()) {
            return this.hintId;
        }
        if (this.validationMessages$().length > 0) {
            return this.messagesId;
        }
        return null;
    };
    activate() {
        if (this.disabled || this.selectedState()) {
            return;
        }
        this.selectedState.set(true);
        this.selectedChange.emit(true);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxRadioComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxRadioComponent, isStandalone: true, selector: "cx-radio", inputs: { text: "text", hint: "hint", disabled: "disabled", validation: "validation", selected: "selected" }, outputs: { selectedChange: "selectedChange" }, ngImport: i0, template: "<div class=\"cx-radio-field\">\n  <label\n    class=\"cx-radio\"\n    [class.cx-radio--selected]=\"selected$()\"\n    [class.cx-radio--disabled]=\"disabled\"\n    [class.cx-radio--error]=\"hasError$()\"\n    data-shortcut-ignore=\" \"\n  >\n    <input\n      class=\"cx-radio__input\"\n      type=\"radio\"\n      [checked]=\"selected$()\"\n      [disabled]=\"disabled\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      [attr.aria-describedby]=\"describedBy$()\"\n      (change)=\"activate()\"\n    />\n\n    <span class=\"cx-radio__control\" aria-hidden=\"true\">\n      @if (selected$()) {\n        <span class=\"cx-radio__dot\"></span>\n      }\n    </span>\n    @if (hasText$() || hint?.trim()) {\n      <span class=\"cx-radio__content\">\n        @if (hasText$()) {\n          <span class=\"cx-radio__label\">{{ text }}</span>\n        }\n        @if (showHint$()) {\n          <span [id]=\"hintId\" class=\"cx-radio__hint\">{{ hint!.trim() }}</span>\n        }\n      </span>\n    }\n  </label>\n\n  @if (validationMessages$().length > 0) {\n    <cx-validation-message\n      [id]=\"messagesId\"\n      class=\"cx-radio-field__error\"\n      [messages]=\"validationMessages$()\"\n    />\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}.cx-radio-field{display:inline-flex;flex-direction:column;align-items:flex-start;gap:var(--space-xs)}.cx-radio{display:inline-grid;grid-template-columns:var(--choice-control-size);box-sizing:border-box;align-items:flex-start;border:0;background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;min-height:var(--choice-control-size);line-height:1;margin:0;outline:none;padding:0;text-align:left}.cx-radio:has(.cx-radio__content){grid-template-columns:var(--choice-control-size) minmax(0, auto);column-gap:var(--space-sm)}.cx-radio--disabled{opacity:.4;cursor:default;pointer-events:none;user-select:none}.cx-radio__input{grid-column:1;grid-row:1;width:var(--choice-control-size);height:var(--choice-control-size);padding:0;border:0;margin:0;appearance:none;cursor:inherit;opacity:0}.cx-radio__control{display:inline-flex;grid-column:1;grid-row:1;box-sizing:border-box;width:var(--choice-control-size);height:var(--choice-control-size);flex:0 0 auto;align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);line-height:0;pointer-events:none;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-radio:has(.cx-radio__label) .cx-radio__control{transform:translateY(var(--space-2xs))}.cx-radio__input:focus-visible+.cx-radio__control{border-color:var(--primary);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-radio:hover:not(.cx-radio--selected) .cx-radio__control{border-color:var(--opacity-mid);background:var(--opacity-mid)}.cx-radio--selected .cx-radio__control{border-color:var(--choice-control-selected);background:var(--choice-control-selected)}.cx-radio--selected .cx-radio__dot{transform:scale(1);opacity:1}.cx-radio--error .cx-radio__control,.cx-radio--error:hover:not(.cx-radio--selected) .cx-radio__control{border-color:var(--danger)}.cx-radio:active:not(.cx-radio--disabled) .cx-radio__control{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-radio__dot{display:block;width:calc(var(--space-xs) + var(--space-2xs));height:calc(var(--space-xs) + var(--space-2xs));border-radius:var(--radius-pill);corner-shape:round;background:var(--on-choice-control);transform:scale(0);opacity:0;transition:transform var(--motion-fast) var(--ease-out),opacity var(--motion-fast) var(--ease-out)}.cx-radio__label{display:block;color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);padding-top:var(--space-2xs)}.cx-radio__content{display:flex;grid-column:2;grid-row:1;flex-direction:column;min-width:0;gap:var(--space-2xs)}.cx-radio__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-radio-field__error{width:calc(100% - var(--choice-control-size) - var(--space-sm));margin-left:calc(var(--choice-control-size) + var(--space-sm))}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxRadioComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-radio', imports: [CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-radio-field\">\n  <label\n    class=\"cx-radio\"\n    [class.cx-radio--selected]=\"selected$()\"\n    [class.cx-radio--disabled]=\"disabled\"\n    [class.cx-radio--error]=\"hasError$()\"\n    data-shortcut-ignore=\" \"\n  >\n    <input\n      class=\"cx-radio__input\"\n      type=\"radio\"\n      [checked]=\"selected$()\"\n      [disabled]=\"disabled\"\n      [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n      [attr.aria-describedby]=\"describedBy$()\"\n      (change)=\"activate()\"\n    />\n\n    <span class=\"cx-radio__control\" aria-hidden=\"true\">\n      @if (selected$()) {\n        <span class=\"cx-radio__dot\"></span>\n      }\n    </span>\n    @if (hasText$() || hint?.trim()) {\n      <span class=\"cx-radio__content\">\n        @if (hasText$()) {\n          <span class=\"cx-radio__label\">{{ text }}</span>\n        }\n        @if (showHint$()) {\n          <span [id]=\"hintId\" class=\"cx-radio__hint\">{{ hint!.trim() }}</span>\n        }\n      </span>\n    }\n  </label>\n\n  @if (validationMessages$().length > 0) {\n    <cx-validation-message\n      [id]=\"messagesId\"\n      class=\"cx-radio-field__error\"\n      [messages]=\"validationMessages$()\"\n    />\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}.cx-radio-field{display:inline-flex;flex-direction:column;align-items:flex-start;gap:var(--space-xs)}.cx-radio{display:inline-grid;grid-template-columns:var(--choice-control-size);box-sizing:border-box;align-items:flex-start;border:0;background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;min-height:var(--choice-control-size);line-height:1;margin:0;outline:none;padding:0;text-align:left}.cx-radio:has(.cx-radio__content){grid-template-columns:var(--choice-control-size) minmax(0, auto);column-gap:var(--space-sm)}.cx-radio--disabled{opacity:.4;cursor:default;pointer-events:none;user-select:none}.cx-radio__input{grid-column:1;grid-row:1;width:var(--choice-control-size);height:var(--choice-control-size);padding:0;border:0;margin:0;appearance:none;cursor:inherit;opacity:0}.cx-radio__control{display:inline-flex;grid-column:1;grid-row:1;box-sizing:border-box;width:var(--choice-control-size);height:var(--choice-control-size);flex:0 0 auto;align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);line-height:0;pointer-events:none;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-radio:has(.cx-radio__label) .cx-radio__control{transform:translateY(var(--space-2xs))}.cx-radio__input:focus-visible+.cx-radio__control{border-color:var(--primary);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-radio:hover:not(.cx-radio--selected) .cx-radio__control{border-color:var(--opacity-mid);background:var(--opacity-mid)}.cx-radio--selected .cx-radio__control{border-color:var(--choice-control-selected);background:var(--choice-control-selected)}.cx-radio--selected .cx-radio__dot{transform:scale(1);opacity:1}.cx-radio--error .cx-radio__control,.cx-radio--error:hover:not(.cx-radio--selected) .cx-radio__control{border-color:var(--danger)}.cx-radio:active:not(.cx-radio--disabled) .cx-radio__control{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-radio__dot{display:block;width:calc(var(--space-xs) + var(--space-2xs));height:calc(var(--space-xs) + var(--space-2xs));border-radius:var(--radius-pill);corner-shape:round;background:var(--on-choice-control);transform:scale(0);opacity:0;transition:transform var(--motion-fast) var(--ease-out),opacity var(--motion-fast) var(--ease-out)}.cx-radio__label{display:block;color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);padding-top:var(--space-2xs)}.cx-radio__content{display:flex;grid-column:2;grid-row:1;flex-direction:column;min-width:0;gap:var(--space-2xs)}.cx-radio__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-radio-field__error{width:calc(100% - var(--choice-control-size) - var(--space-sm));margin-left:calc(var(--choice-control-size) + var(--space-sm))}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], hint: [{
                type: Input
            }], disabled: [{
                type: Input
            }], validation: [{
                type: Input
            }], selected: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }] } });
