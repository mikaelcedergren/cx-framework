import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, } from '@angular/core';
import { CxTextFieldComponent } from '../cx-text-field/index.js';
import * as i0 from "@angular/core";
const SEARCH_FIELD_DEBOUNCE_MS = 300;
export class CxSearchFieldComponent {
    valueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    debounceTimer;
    label = 'Search';
    ariaLabel;
    hint;
    optional = false;
    disabled = false;
    loading = false;
    clearable = false;
    size = 'default';
    validation;
    set value(value) {
        this.clearDebounceTimer();
        this.valueState.set(value ?? '');
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    value$ = this.valueState.asReadonly();
    onValueChange(value) {
        if (this.disabled || this.loading) {
            return;
        }
        this.valueState.set(value);
        this.scheduleValueChange();
    }
    onEscape(event) {
        event.preventDefault();
        this.clearSearch();
    }
    clearSearch() {
        if (this.disabled || this.loading) {
            return;
        }
        this.valueState.set('');
        this.scheduleValueChange();
    }
    onFocusIn() {
        this.focusChange.emit(true);
    }
    onFocusOut(event) {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
            return;
        }
        this.focusChange.emit(false);
    }
    ngOnDestroy() {
        this.clearDebounceTimer();
    }
    scheduleValueChange() {
        this.clearDebounceTimer();
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = undefined;
            if (this.disabled || this.loading) {
                return;
            }
            this.valueChange.emit(this.valueState());
        }, SEARCH_FIELD_DEBOUNCE_MS);
    }
    clearDebounceTimer() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSearchFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxSearchFieldComponent, isStandalone: true, selector: "cx-search-field", inputs: { label: "label", ariaLabel: "ariaLabel", hint: "hint", optional: "optional", disabled: "disabled", loading: "loading", clearable: "clearable", size: "size", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", focusChange: "focusChange" }, host: { attributes: { "role": "search" } }, ngImport: i0, template: "<div\n  class=\"cx-search-field\"\n  (keydown.escape)=\"onEscape($event)\"\n  (focusin)=\"onFocusIn()\"\n  (focusout)=\"onFocusOut($event)\"\n>\n  <cx-text-field\n    [label]=\"label\"\n    [ariaLabel]=\"ariaLabel\"\n    [hint]=\"hint\"\n    [optional]=\"optional\"\n    [disabled]=\"disabled\"\n    [loading]=\"loading\"\n    [clearable]=\"clearable\"\n    [size]=\"size\"\n    prependIcon=\"search\"\n    [value]=\"value$()\"\n    [validation]=\"validation\"\n    (valueChange)=\"onValueChange($event)\"\n  />\n</div>\n", styles: [":host{display:block}.cx-search-field{display:block;width:100%}"], dependencies: [{ kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSearchFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-search-field', imports: [CxTextFieldComponent], host: { role: 'search' }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-search-field\"\n  (keydown.escape)=\"onEscape($event)\"\n  (focusin)=\"onFocusIn()\"\n  (focusout)=\"onFocusOut($event)\"\n>\n  <cx-text-field\n    [label]=\"label\"\n    [ariaLabel]=\"ariaLabel\"\n    [hint]=\"hint\"\n    [optional]=\"optional\"\n    [disabled]=\"disabled\"\n    [loading]=\"loading\"\n    [clearable]=\"clearable\"\n    [size]=\"size\"\n    prependIcon=\"search\"\n    [value]=\"value$()\"\n    [validation]=\"validation\"\n    (valueChange)=\"onValueChange($event)\"\n  />\n</div>\n", styles: [":host{display:block}.cx-search-field{display:block;width:100%}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], ariaLabel: [{
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
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }] } });
