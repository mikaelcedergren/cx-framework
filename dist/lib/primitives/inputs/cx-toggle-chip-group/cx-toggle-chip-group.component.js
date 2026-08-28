import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxToggleChipComponent } from '../cx-toggle-chip/index.js';
import * as i0 from "@angular/core";
export class CxToggleChipGroupComponent {
    availableValuesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "availableValuesState" }] : /* istanbul ignore next */ []));
    selectedValuesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedValuesState" }] : /* istanbul ignore next */ []));
    set availableValues(values) {
        this.availableValuesState.set(this.normalizeOptions(values));
        this.selectedValuesState.set(this.normalize(this.selectedValuesState()));
    }
    get availableValues() {
        return this.availableValuesState();
    }
    selection = 'multiple';
    size = 'default';
    disabled = false;
    allowEmpty = false;
    set selectedValues(values) {
        this.selectedValuesState.set(this.normalize(values ?? []));
    }
    selectedValuesChange = new EventEmitter();
    availableValues$ = this.availableValuesState.asReadonly();
    selectedValues$ = this.selectedValuesState.asReadonly();
    role$ = computed(() => (this.selection === 'single' ? 'radiogroup' : 'group'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "role$" }] : /* istanbul ignore next */ []));
    isSelected(id) {
        return this.selectedValuesState().includes(id);
    }
    toggle(option) {
        if (this.disabled || option.disabled) {
            return;
        }
        const selected = this.isSelected(option.id);
        let next;
        if (this.selection === 'single') {
            if (selected && !this.allowEmpty) {
                return;
            }
            next = selected ? [] : [option.id];
        }
        else {
            next = selected
                ? this.selectedValuesState().filter(value => value !== option.id)
                : [...this.selectedValuesState(), option.id];
        }
        this.selectedValuesState.set(this.normalize(next));
        this.selectedValuesChange.emit(this.selectedValuesState());
    }
    normalize(values) {
        const ids = this.availableValuesState().map(option => option.id);
        const normalizedValues = values.map(value => value.trim()).filter(Boolean);
        const known = normalizedValues.filter((value, index) => normalizedValues.indexOf(value) === index && (ids.length === 0 || ids.includes(value)));
        return this.selection === 'single' ? known.slice(0, 1) : known;
    }
    normalizeOptions(values) {
        const ids = new Set();
        return (values ?? []).map((option, index) => {
            const id = option?.id?.trim() ?? '';
            if (!id) {
                throw new Error(`[cx-toggle-chip-group] option at index ${index} requires a non-empty id.`);
            }
            if (ids.has(id)) {
                throw new Error(`[cx-toggle-chip-group] option id "${id}" must be unique.`);
            }
            ids.add(id);
            const label = option?.label?.trim() ?? '';
            return {
                ...option,
                id,
                label,
                ariaLabel: option.ariaLabel?.trim() || undefined,
            };
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxToggleChipGroupComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxToggleChipGroupComponent, isStandalone: true, selector: "cx-toggle-chip-group", inputs: { availableValues: "availableValues", selection: "selection", size: "size", disabled: "disabled", allowEmpty: "allowEmpty", selectedValues: "selectedValues" }, outputs: { selectedValuesChange: "selectedValuesChange" }, ngImport: i0, template: "@if (availableValues$(); as options) {\n  @if (options.length > 0) {\n    <div\n      class=\"cx-toggle-chip-group\"\n      [class.cx-toggle-chip-group--small]=\"size === 'small'\"\n      [class.cx-toggle-chip-group--large]=\"size === 'large'\"\n      [attr.role]=\"role$()\"\n      [attr.aria-disabled]=\"disabled ? 'true' : null\"\n    >\n      @for (option of options; track option.id) {\n        <cx-toggle-chip\n          [text]=\"option.label\"\n          [size]=\"size\"\n          [selected]=\"isSelected(option.id)\"\n          [disabled]=\"disabled || option.disabled === true\"\n          [ariaLabel]=\"option.ariaLabel\"\n          (selectedChange)=\"toggle(option)\"\n        />\n      }\n    </div>\n  }\n}\n", styles: [":host{display:block}.cx-toggle-chip-group{display:flex;flex-wrap:wrap;gap:var(--space-sm)}.cx-toggle-chip-group--small{gap:var(--space-xs)}.cx-toggle-chip-group--large{gap:var(--space-md)}"], dependencies: [{ kind: "component", type: CxToggleChipComponent, selector: "cx-toggle-chip", inputs: ["text", "size", "ariaLabel", "disabled", "selected"], outputs: ["selectedChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxToggleChipGroupComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-toggle-chip-group', imports: [CxToggleChipComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (availableValues$(); as options) {\n  @if (options.length > 0) {\n    <div\n      class=\"cx-toggle-chip-group\"\n      [class.cx-toggle-chip-group--small]=\"size === 'small'\"\n      [class.cx-toggle-chip-group--large]=\"size === 'large'\"\n      [attr.role]=\"role$()\"\n      [attr.aria-disabled]=\"disabled ? 'true' : null\"\n    >\n      @for (option of options; track option.id) {\n        <cx-toggle-chip\n          [text]=\"option.label\"\n          [size]=\"size\"\n          [selected]=\"isSelected(option.id)\"\n          [disabled]=\"disabled || option.disabled === true\"\n          [ariaLabel]=\"option.ariaLabel\"\n          (selectedChange)=\"toggle(option)\"\n        />\n      }\n    </div>\n  }\n}\n", styles: [":host{display:block}.cx-toggle-chip-group{display:flex;flex-wrap:wrap;gap:var(--space-sm)}.cx-toggle-chip-group--small{gap:var(--space-xs)}.cx-toggle-chip-group--large{gap:var(--space-md)}"] }]
        }], propDecorators: { availableValues: [{
                type: Input
            }], selection: [{
                type: Input
            }], size: [{
                type: Input
            }], disabled: [{
                type: Input
            }], allowEmpty: [{
                type: Input
            }], selectedValues: [{
                type: Input
            }], selectedValuesChange: [{
                type: Output
            }] } });
