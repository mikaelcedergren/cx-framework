import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field/index.js';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio/index.js';
import * as i0 from "@angular/core";
export class CxRadioRevealComponent {
    optionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionsState" }] : /* istanbul ignore next */ []));
    selectedIdState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdState" }] : /* istanbul ignore next */ []));
    revealValueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "revealValueState" }] : /* istanbul ignore next */ []));
    label = '';
    disabled = false;
    set options(value) {
        const nextOptions = [];
        const ids = new Set();
        for (const option of value ?? []) {
            const id = option.id?.trim();
            const label = option.label?.trim();
            if (!id || !label) {
                throw new Error('[cx-radio-reveal] every option requires a visible label and non-empty id.');
            }
            if (ids.has(id)) {
                throw new Error(`[cx-radio-reveal] option ids must be unique; received "${id}" more than once.`);
            }
            ids.add(id);
            nextOptions.push({
                id,
                label,
                hint: option.hint?.trim() || undefined,
                revealHint: option.revealHint?.trim() || undefined,
            });
        }
        this.optionsState.set(nextOptions);
        this.ensureValidSelection();
    }
    set selectedId(value) {
        this.selectedIdState.set(value?.trim() || '');
        this.ensureValidSelection();
    }
    set revealValue(value) {
        this.revealValueState.set(value ?? '');
    }
    selectedIdChange = new EventEmitter();
    revealValueChange = new EventEmitter();
    options$ = this.optionsState.asReadonly();
    selectedId$ = this.selectedIdState.asReadonly();
    selectedRevealOption$ = computed(() => {
        const selectedId = this.selectedIdState();
        if (!selectedId) {
            return undefined;
        }
        return this.optionsState().find(option => option.id === selectedId && !!option.revealHint);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedRevealOption$" }] : /* istanbul ignore next */ []));
    hasLabel$ = computed(() => this.label.trim().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasLabel$" }] : /* istanbul ignore next */ []));
    onOptionCheckedChange(optionId, checked) {
        if (!checked || this.disabled || this.selectedIdState() === optionId) {
            return;
        }
        this.selectedIdState.set(optionId);
        this.selectedIdChange.emit(optionId);
    }
    onRevealValueChange(value) {
        this.revealValueState.set(value);
        this.revealValueChange.emit(value);
    }
    getRevealAriaLabel(option) {
        return option.label;
    }
    ensureValidSelection() {
        const selectedId = this.selectedIdState();
        if (!selectedId) {
            return;
        }
        if (this.optionsState().some(option => option.id === selectedId)) {
            return;
        }
        this.selectedIdState.set('');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxRadioRevealComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxRadioRevealComponent, isStandalone: true, selector: "cx-radio-reveal", inputs: { label: "label", disabled: "disabled", options: "options", selectedId: "selectedId", revealValue: "revealValue" }, outputs: { selectedIdChange: "selectedIdChange", revealValueChange: "revealValueChange" }, ngImport: i0, template: "@if (options$().length > 0) {\n<div\n  class=\"cx-radio-reveal\"\n  [class.cx-radio-reveal--without-label]=\"!hasLabel$()\"\n>\n  @if (hasLabel$()) {\n    <div class=\"cx-radio-reveal__label\">{{ label.trim() }}</div>\n  }\n\n  <div class=\"cx-radio-reveal__content\">\n    @for (option of options$(); track option.id) {\n      <div class=\"cx-radio-reveal__option\">\n        <cx-radio\n          [text]=\"option.label\"\n          [hint]=\"option.hint\"\n          [selected]=\"selectedId$() === option.id\"\n          [disabled]=\"disabled\"\n          (selectedChange)=\"onOptionCheckedChange(option.id, $event)\"\n        />\n\n        @if (selectedRevealOption$()?.id === option.id) {\n          <div class=\"cx-radio-reveal__field\">\n            <cx-text-field\n              [label]=\"''\"\n              [ariaLabel]=\"getRevealAriaLabel(option)\"\n              [hint]=\"option.revealHint\"\n              [disabled]=\"disabled\"\n              [value]=\"revealValueState()\"\n              (valueChange)=\"onRevealValueChange($event)\"\n            />\n          </div>\n        }\n      </div>\n    }\n  </div>\n</div>\n}\n", styles: [":host{display:block;width:100%}.cx-radio-reveal{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-md)}.cx-radio-reveal__label{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-radio-reveal__content{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-radio-reveal__option{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-radio-reveal__field{width:100%;min-width:0;padding-left:var(--space-lg);box-sizing:border-box}"], dependencies: [{ kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "combobox", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxRadioComponent, selector: "cx-radio", inputs: ["text", "hint", "disabled", "validation", "selected"], outputs: ["selectedChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxRadioRevealComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-radio-reveal', imports: [CxTextFieldComponent, CxRadioComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (options$().length > 0) {\n<div\n  class=\"cx-radio-reveal\"\n  [class.cx-radio-reveal--without-label]=\"!hasLabel$()\"\n>\n  @if (hasLabel$()) {\n    <div class=\"cx-radio-reveal__label\">{{ label.trim() }}</div>\n  }\n\n  <div class=\"cx-radio-reveal__content\">\n    @for (option of options$(); track option.id) {\n      <div class=\"cx-radio-reveal__option\">\n        <cx-radio\n          [text]=\"option.label\"\n          [hint]=\"option.hint\"\n          [selected]=\"selectedId$() === option.id\"\n          [disabled]=\"disabled\"\n          (selectedChange)=\"onOptionCheckedChange(option.id, $event)\"\n        />\n\n        @if (selectedRevealOption$()?.id === option.id) {\n          <div class=\"cx-radio-reveal__field\">\n            <cx-text-field\n              [label]=\"''\"\n              [ariaLabel]=\"getRevealAriaLabel(option)\"\n              [hint]=\"option.revealHint\"\n              [disabled]=\"disabled\"\n              [value]=\"revealValueState()\"\n              (valueChange)=\"onRevealValueChange($event)\"\n            />\n          </div>\n        }\n      </div>\n    }\n  </div>\n</div>\n}\n", styles: [":host{display:block;width:100%}.cx-radio-reveal{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-md)}.cx-radio-reveal__label{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-radio-reveal__content{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-radio-reveal__option{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-radio-reveal__field{width:100%;min-width:0;padding-left:var(--space-lg);box-sizing:border-box}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], disabled: [{
                type: Input
            }], options: [{
                type: Input
            }], selectedId: [{
                type: Input
            }], revealValue: [{
                type: Input
            }], selectedIdChange: [{
                type: Output
            }], revealValueChange: [{
                type: Output
            }] } });
