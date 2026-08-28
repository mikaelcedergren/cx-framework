import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio/index.js';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch/index.js';
import * as i0 from "@angular/core";
export class CxNullControllerComponent {
    optionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionsState" }] : /* istanbul ignore next */ []));
    enabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "enabledState" }] : /* istanbul ignore next */ []));
    selectedIdState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdState" }] : /* istanbul ignore next */ []));
    label = '';
    description;
    switchLabel = 'Override';
    disabled = false;
    set options(value) {
        const nextOptions = [];
        const ids = new Set();
        for (const option of value ?? []) {
            const id = option.id?.trim();
            const label = option.label?.trim();
            if (!id || !label) {
                throw new Error('[cx-null-controller] every option requires a visible label and non-empty id.');
            }
            if (ids.has(id)) {
                throw new Error(`[cx-null-controller] option ids must be unique; received "${id}" more than once.`);
            }
            ids.add(id);
            nextOptions.push({
                id,
                label,
                hint: option.hint?.trim() || undefined,
            });
        }
        this.optionsState.set(nextOptions);
        this.ensureValidSelection();
    }
    set enabled(value) {
        this.enabledState.set(Boolean(value));
    }
    set selectedId(value) {
        this.selectedIdState.set(value?.trim() || '');
        this.ensureValidSelection();
    }
    enabledChange = new EventEmitter();
    selectedIdChange = new EventEmitter();
    options$ = this.optionsState.asReadonly();
    enabled$ = this.enabledState.asReadonly();
    hasLabel$ = computed(() => this.label.trim().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasLabel$" }] : /* istanbul ignore next */ []));
    hasDescription$ = computed(() => (this.description?.trim().length ?? 0) > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasDescription$" }] : /* istanbul ignore next */ []));
    radiosDisabled$ = computed(() => this.disabled || !this.enabledState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "radiosDisabled$" }] : /* istanbul ignore next */ []));
    isSelected(optionId) {
        return this.enabledState() && this.selectedIdState() === optionId;
    }
    onEnabledChange(value) {
        if (this.disabled) {
            return;
        }
        this.enabledState.set(value);
        this.enabledChange.emit(value);
    }
    onOptionCheckedChange(optionId, checked) {
        if (!checked || this.radiosDisabled$() || this.selectedIdState() === optionId) {
            return;
        }
        this.selectedIdState.set(optionId);
        this.selectedIdChange.emit(optionId);
    }
    ensureValidSelection() {
        const selectedId = this.selectedIdState();
        if (!selectedId) {
            return;
        }
        if (this.optionsState().some(option => option.id === selectedId)) {
            return;
        }
        this.selectedIdState.set(this.optionsState()[0]?.id ?? '');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNullControllerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxNullControllerComponent, isStandalone: true, selector: "cx-null-controller", inputs: { label: "label", description: "description", switchLabel: "switchLabel", disabled: "disabled", options: "options", enabled: "enabled", selectedId: "selectedId" }, outputs: { enabledChange: "enabledChange", selectedIdChange: "selectedIdChange" }, ngImport: i0, template: "<div class=\"cx-null-controller\">\n  <div class=\"cx-null-controller__header\">\n    @if (hasLabel$()) {\n      <div class=\"cx-null-controller__label\">{{ label.trim() }}</div>\n    }\n\n    <cx-switch\n      [text]=\"switchLabel.trim() || 'Override'\"\n      [selected]=\"enabled$()\"\n      [disabled]=\"disabled\"\n      (selectedChange)=\"onEnabledChange($event)\"\n    />\n  </div>\n\n  @if (hasDescription$()) {\n    <p class=\"cx-null-controller__description\">{{ description!.trim() }}</p>\n  }\n\n  @if (options$().length > 0) {\n  <div class=\"cx-null-controller__options\">\n    @for (option of options$(); track option.id) {\n      <cx-radio\n        [text]=\"option.label\"\n        [hint]=\"option.hint\"\n        [selected]=\"isSelected(option.id)\"\n        [disabled]=\"radiosDisabled$()\"\n        (selectedChange)=\"onOptionCheckedChange(option.id, $event)\"\n      />\n    }\n  </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-null-controller{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-null-controller__header{display:flex;width:100%;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-lg)}.cx-null-controller__label{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-null-controller__description{margin:0;color:var(--opacity-mid);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-null-controller__options{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}"], dependencies: [{ kind: "component", type: CxSwitchComponent, selector: "cx-switch", inputs: ["text", "ariaLabel", "hint", "size", "disabled", "validation", "selected"], outputs: ["selectedChange", "focusChange"] }, { kind: "component", type: CxRadioComponent, selector: "cx-radio", inputs: ["text", "hint", "disabled", "validation", "selected"], outputs: ["selectedChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNullControllerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-null-controller', imports: [CxSwitchComponent, CxRadioComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-null-controller\">\n  <div class=\"cx-null-controller__header\">\n    @if (hasLabel$()) {\n      <div class=\"cx-null-controller__label\">{{ label.trim() }}</div>\n    }\n\n    <cx-switch\n      [text]=\"switchLabel.trim() || 'Override'\"\n      [selected]=\"enabled$()\"\n      [disabled]=\"disabled\"\n      (selectedChange)=\"onEnabledChange($event)\"\n    />\n  </div>\n\n  @if (hasDescription$()) {\n    <p class=\"cx-null-controller__description\">{{ description!.trim() }}</p>\n  }\n\n  @if (options$().length > 0) {\n  <div class=\"cx-null-controller__options\">\n    @for (option of options$(); track option.id) {\n      <cx-radio\n        [text]=\"option.label\"\n        [hint]=\"option.hint\"\n        [selected]=\"isSelected(option.id)\"\n        [disabled]=\"radiosDisabled$()\"\n        (selectedChange)=\"onOptionCheckedChange(option.id, $event)\"\n      />\n    }\n  </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-null-controller{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-null-controller__header{display:flex;width:100%;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-lg)}.cx-null-controller__label{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-null-controller__description{margin:0;color:var(--opacity-mid);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-null-controller__options{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm)}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], description: [{
                type: Input
            }], switchLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], options: [{
                type: Input
            }], enabled: [{
                type: Input
            }], selectedId: [{
                type: Input
            }], enabledChange: [{
                type: Output
            }], selectedIdChange: [{
                type: Output
            }] } });
