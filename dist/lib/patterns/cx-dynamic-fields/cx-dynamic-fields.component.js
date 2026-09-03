import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal, } from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxPasswordFieldComponent } from '../../primitives/inputs/cx-password-field/index.js';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field/index.js';
import * as i0 from "@angular/core";
export class CxDynamicFieldsComponent {
    optionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionsState" }] : /* istanbul ignore next */ []));
    fieldsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fieldsState" }] : /* istanbul ignore next */ []));
    disabled = false;
    set options(value) {
        const ids = new Set();
        const options = (value ?? []).map(option => {
            const id = option.id?.trim();
            const label = option.label?.trim();
            if (!id || !label) {
                throw new Error('[cx-dynamic-fields] every option requires a visible label and non-empty id.');
            }
            if (ids.has(id)) {
                throw new Error(`[cx-dynamic-fields] option ids must be unique; received "${id}" more than once.`);
            }
            ids.add(id);
            return { ...option, id, label };
        });
        this.optionsState.set(options);
    }
    set fields(value) {
        const ids = new Set();
        const fields = (value ?? []).map(field => {
            const id = field.id?.trim();
            if (!id) {
                throw new Error('[cx-dynamic-fields] every field requires a non-empty id.');
            }
            if (ids.has(id)) {
                throw new Error(`[cx-dynamic-fields] field ids must be unique; received "${id}" more than once.`);
            }
            ids.add(id);
            return { id, value: field.value ?? '' };
        });
        this.fieldsState.set(fields);
    }
    fieldsChange = new EventEmitter();
    resolvedFields$ = computed(() => {
        const optionsById = new Map(this.optionsState().map(option => [
            option.id,
            {
                label: option.label,
                hint: option.hint?.trim() || '',
                masked: option.masked === true,
            },
        ]));
        return this.fieldsState()
            .map(field => {
            const option = optionsById.get(field.id);
            if (!option) {
                throw new Error(`[cx-dynamic-fields] field "${field.id}" has no matching visible option.`);
            }
            return {
                ...field,
                ...option,
            };
        });
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resolvedFields$" }] : /* istanbul ignore next */ []));
    addableOptions$ = computed(() => {
        const activeIds = new Set(this.fieldsState().map(field => field.id));
        return this.optionsState().filter(option => !activeIds.has(option.id));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "addableOptions$" }] : /* istanbul ignore next */ []));
    onFieldValueChange(fieldId, value) {
        const nextFields = this.fieldsState().map(field => (field.id === fieldId ? { ...field, value } : field));
        this.fieldsState.set(nextFields);
        this.fieldsChange.emit(nextFields);
    }
    onRemoveField(fieldId) {
        if (this.disabled) {
            return;
        }
        const nextFields = this.fieldsState().filter(field => field.id !== fieldId);
        this.fieldsState.set(nextFields);
        this.fieldsChange.emit(nextFields);
    }
    onAddField(fieldId) {
        if (this.disabled || this.fieldsState().some(field => field.id === fieldId)) {
            return;
        }
        const nextFields = [...this.fieldsState(), { id: fieldId, value: '' }];
        this.fieldsState.set(nextFields);
        this.fieldsChange.emit(nextFields);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDynamicFieldsComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDynamicFieldsComponent, isStandalone: true, selector: "cx-dynamic-fields", inputs: { disabled: "disabled", options: "options", fields: "fields" }, outputs: { fieldsChange: "fieldsChange" }, ngImport: i0, template: "@if (resolvedFields$().length > 0 || addableOptions$().length > 0) {\n<div class=\"cx-dynamic-fields\">\n  @if (resolvedFields$().length > 0) {\n    <div class=\"cx-dynamic-fields__list\">\n      @for (field of resolvedFields$(); track field.id) {\n        <div class=\"cx-dynamic-fields__row\" [attr.data-field-id]=\"field.id\">\n          <div class=\"cx-dynamic-fields__label\">{{ field.label }}</div>\n\n          @if (field.masked) {\n            <cx-password-field\n              class=\"cx-dynamic-fields__input\"\n              [label]=\"''\"\n              [ariaLabel]=\"field.label\"\n              [hint]=\"field.hint\"\n              [disabled]=\"disabled\"\n              [value]=\"field.value\"\n              (valueChange)=\"onFieldValueChange(field.id, $event)\"\n            />\n          } @else {\n            <cx-text-field\n              class=\"cx-dynamic-fields__input\"\n              [label]=\"''\"\n              [ariaLabel]=\"field.label\"\n              [hint]=\"field.hint\"\n              [disabled]=\"disabled\"\n              [value]=\"field.value\"\n              (valueChange)=\"onFieldValueChange(field.id, $event)\"\n            />\n          }\n\n          <cx-icon-button\n            class=\"cx-dynamic-fields__remove\"\n            icon=\"delete\" variant=\"transparent\"\n            ariaLabel=\"Remove field\"\n            size=\"small\"\n            [disabled]=\"disabled\"\n            (pressed)=\"onRemoveField(field.id)\"\n          />\n        </div>\n      }\n    </div>\n  }\n\n  @if (addableOptions$().length > 0) {\n    <div class=\"cx-dynamic-fields__add\">\n      @for (option of addableOptions$(); track option.id) {\n        <cx-button\n          icon=\"plus\" [transparent]=\"true\"\n          size=\"small\"\n          [text]=\"option.label\"\n          [disabled]=\"disabled\"\n          (pressed)=\"onAddField(option.id)\"\n        />\n      }\n    </div>\n  }\n</div>\n}\n", styles: [":host{display:block;width:100%}.cx-dynamic-fields{display:flex;width:100%;flex-direction:column;gap:var(--space-md)}.cx-dynamic-fields__list{display:flex;width:100%;flex-direction:column;gap:var(--space-sm)}.cx-dynamic-fields__row{display:grid;align-items:center;grid-template-columns:calc(var(--controller-size)*5) minmax(0, 1fr) auto;column-gap:var(--space-sm)}.cx-dynamic-fields__label{min-width:0;overflow-wrap:anywhere;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-dynamic-fields__input{min-width:0}.cx-dynamic-fields__remove{flex:0 0 auto;margin-top:0}.cx-dynamic-fields__add{display:flex;flex-wrap:wrap;gap:var(--space-sm)}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxPasswordFieldComponent, selector: "cx-password-field", inputs: ["label", "ariaLabel", "name", "autocomplete", "hint", "optional", "disabled", "loading", "clearable", "size", "revealSeconds", "value", "validation"], outputs: ["valueChange", "focusChange", "revealedChange"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDynamicFieldsComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-dynamic-fields', imports: [
                        CxButtonComponent,
                        CxIconButtonComponent,
                        CxPasswordFieldComponent,
                        CxTextFieldComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (resolvedFields$().length > 0 || addableOptions$().length > 0) {\n<div class=\"cx-dynamic-fields\">\n  @if (resolvedFields$().length > 0) {\n    <div class=\"cx-dynamic-fields__list\">\n      @for (field of resolvedFields$(); track field.id) {\n        <div class=\"cx-dynamic-fields__row\" [attr.data-field-id]=\"field.id\">\n          <div class=\"cx-dynamic-fields__label\">{{ field.label }}</div>\n\n          @if (field.masked) {\n            <cx-password-field\n              class=\"cx-dynamic-fields__input\"\n              [label]=\"''\"\n              [ariaLabel]=\"field.label\"\n              [hint]=\"field.hint\"\n              [disabled]=\"disabled\"\n              [value]=\"field.value\"\n              (valueChange)=\"onFieldValueChange(field.id, $event)\"\n            />\n          } @else {\n            <cx-text-field\n              class=\"cx-dynamic-fields__input\"\n              [label]=\"''\"\n              [ariaLabel]=\"field.label\"\n              [hint]=\"field.hint\"\n              [disabled]=\"disabled\"\n              [value]=\"field.value\"\n              (valueChange)=\"onFieldValueChange(field.id, $event)\"\n            />\n          }\n\n          <cx-icon-button\n            class=\"cx-dynamic-fields__remove\"\n            icon=\"delete\" variant=\"transparent\"\n            ariaLabel=\"Remove field\"\n            size=\"small\"\n            [disabled]=\"disabled\"\n            (pressed)=\"onRemoveField(field.id)\"\n          />\n        </div>\n      }\n    </div>\n  }\n\n  @if (addableOptions$().length > 0) {\n    <div class=\"cx-dynamic-fields__add\">\n      @for (option of addableOptions$(); track option.id) {\n        <cx-button\n          icon=\"plus\" [transparent]=\"true\"\n          size=\"small\"\n          [text]=\"option.label\"\n          [disabled]=\"disabled\"\n          (pressed)=\"onAddField(option.id)\"\n        />\n      }\n    </div>\n  }\n</div>\n}\n", styles: [":host{display:block;width:100%}.cx-dynamic-fields{display:flex;width:100%;flex-direction:column;gap:var(--space-md)}.cx-dynamic-fields__list{display:flex;width:100%;flex-direction:column;gap:var(--space-sm)}.cx-dynamic-fields__row{display:grid;align-items:center;grid-template-columns:calc(var(--controller-size)*5) minmax(0, 1fr) auto;column-gap:var(--space-sm)}.cx-dynamic-fields__label{min-width:0;overflow-wrap:anywhere;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-dynamic-fields__input{min-width:0}.cx-dynamic-fields__remove{flex:0 0 auto;margin-top:0}.cx-dynamic-fields__add{display:flex;flex-wrap:wrap;gap:var(--space-sm)}"] }]
        }], propDecorators: { disabled: [{
                type: Input
            }], options: [{
                type: Input
            }], fields: [{
                type: Input
            }], fieldsChange: [{
                type: Output
            }] } });
