import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import * as i0 from "@angular/core";
const CHECKBOX_VALUES = ['deselected', 'selected', 'indeterminate'];
export class CxCheckboxComponent {
    static nextId = 0;
    valueState = signal('deselected', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    hintId = `cx-checkbox-${++CxCheckboxComponent.nextId}-hint`;
    text = '';
    ariaLabel;
    hint;
    disabled = false;
    set selected(value) {
        if (value) {
            this.valueState.set('selected');
        }
        else if (this.valueState() === 'selected') {
            this.valueState.set('deselected');
        }
    }
    set value(value) {
        this.valueState.set(CHECKBOX_VALUES.includes(value) ? value : 'deselected');
    }
    selectedChange = new EventEmitter();
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    value$ = this.valueState.asReadonly();
    selected$ = () => this.valueState() === 'selected';
    indeterminate$ = () => this.valueState() === 'indeterminate';
    visibleText$ = () => this.text.trim();
    visibleHint$ = () => this.hint?.trim();
    hasContent$ = () => this.visibleText$().length > 0;
    resolvedAriaLabel$ = () => this.visibleText$() ? null : this.ariaLabel?.trim() || null;
    onNativeChange(event) {
        if (this.disabled) {
            return;
        }
        const target = event.target;
        const checked = target instanceof HTMLInputElement ? target.checked : !this.selected$();
        const nextValue = checked ? 'selected' : 'deselected';
        this.valueState.set(nextValue);
        this.selectedChange.emit(nextValue === 'selected');
        this.valueChange.emit(nextValue);
    }
    onFocus(focused) {
        this.focusChange.emit(focused);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCheckboxComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxCheckboxComponent, isStandalone: true, selector: "cx-checkbox", inputs: { text: "text", ariaLabel: "ariaLabel", hint: "hint", disabled: "disabled", selected: "selected", value: "value" }, outputs: { selectedChange: "selectedChange", valueChange: "valueChange", focusChange: "focusChange" }, ngImport: i0, template: "<div class=\"cx-checkbox-wrapper\" [class.cx-checkbox-wrapper--disabled]=\"disabled\">\n  <label\n    class=\"cx-checkbox\"\n    [class.cx-checkbox--selected]=\"selected$()\"\n    [class.cx-checkbox--indeterminate]=\"indeterminate$()\"\n    [class.cx-checkbox--has-content]=\"hasContent$()\"\n    data-shortcut-ignore=\" \"\n  >\n    <input\n      class=\"cx-checkbox__input\"\n      type=\"checkbox\"\n      [checked]=\"selected$()\"\n      [indeterminate]=\"indeterminate$()\"\n      [disabled]=\"disabled\"\n      [attr.aria-label]=\"resolvedAriaLabel$()\"\n      [attr.aria-describedby]=\"visibleHint$() ? hintId : null\"\n      (change)=\"onNativeChange($event)\"\n      (focus)=\"onFocus(true)\"\n      (blur)=\"onFocus(false)\"\n    />\n\n    <span\n      class=\"cx-checkbox__icon\"\n      [class.cx-checkbox__icon--selected]=\"selected$()\"\n      [class.cx-checkbox__icon--indeterminate]=\"indeterminate$()\"\n      aria-hidden=\"true\"\n    >\n      <span class=\"cx-checkbox__check\"></span>\n    </span>\n\n    @if (visibleText$()) {\n      <span class=\"cx-checkbox__label\">{{ visibleText$() }}</span>\n    }\n  </label>\n\n  @if (visibleHint$()) {\n    <div class=\"cx-checkbox__hint\" [attr.id]=\"hintId\">{{ visibleHint$() }}</div>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto;line-height:normal;vertical-align:top}.cx-checkbox-wrapper{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-xs);line-height:normal}.cx-checkbox{display:inline-grid;grid-template-columns:var(--choice-control-size);align-items:flex-start;cursor:pointer;outline:none}.cx-checkbox--has-content{grid-template-columns:var(--choice-control-size) minmax(0, auto);column-gap:var(--space-sm)}.cx-checkbox-wrapper--disabled{opacity:var(--opacity-disabled, 0.45);pointer-events:none;user-select:none}.cx-checkbox__input{grid-column:1;grid-row:1;width:var(--choice-control-size);height:var(--choice-control-size);padding:0;border:0;margin:0;appearance:none;cursor:inherit;opacity:0}.cx-checkbox__input:focus-visible+.cx-checkbox__icon{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-checkbox--has-content .cx-checkbox__icon{transform:translateY(3px)}.cx-checkbox__icon{position:relative;display:flex;grid-column:1;grid-row:1;box-sizing:border-box;width:var(--choice-control-size);height:var(--choice-control-size);min-width:var(--choice-control-size);min-height:var(--choice-control-size);align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--on-choice-control);flex:0 0 auto;line-height:0;pointer-events:none;transition:border-color var(--motion-base) ease,background-color var(--motion-base) ease}.cx-checkbox:not(.cx-checkbox--selected):hover .cx-checkbox__icon{background:var(--opacity-mid)}.cx-checkbox--selected .cx-checkbox__icon,.cx-checkbox--indeterminate .cx-checkbox__icon{border-color:var(--choice-control-selected);background:var(--choice-control-selected)}.cx-checkbox--selected:hover .cx-checkbox__icon,.cx-checkbox--indeterminate:hover .cx-checkbox__icon{border-color:var(--choice-control-selected-hover);background:var(--choice-control-selected-hover)}.cx-checkbox__check{position:absolute;top:50%;left:50%;opacity:0;transform:translate(-1.3px, 3.6px) rotate(-135deg) scale(0);transition:transform var(--motion-fast) ease,opacity var(--motion-fast) ease}.cx-checkbox__check::before,.cx-checkbox__check::after{content:\"\";position:absolute;top:50%;left:50%;display:block;border-radius:var(--radius-xs);background:var(--on-choice-control)}.cx-checkbox__check::before{width:1.5px;height:8.5px}.cx-checkbox__check::after{width:5px;height:1.5px}.cx-checkbox--selected .cx-checkbox__check{opacity:1;transform:translate(-1.3px, 3.6px) rotate(-135deg) scale(1)}.cx-checkbox--indeterminate .cx-checkbox__icon::before{content:\"\";position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:var(--radius-xs);background:var(--on-choice-control);transform:translate(-50%, -50%)}.cx-checkbox__label{grid-column:2;grid-row:1;align-self:baseline;padding-top:var(--space-2xs);padding-right:var(--space-sm);color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-checkbox__hint{padding-left:calc(var(--choice-control-size) + var(--space-sm));color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCheckboxComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-checkbox', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-checkbox-wrapper\" [class.cx-checkbox-wrapper--disabled]=\"disabled\">\n  <label\n    class=\"cx-checkbox\"\n    [class.cx-checkbox--selected]=\"selected$()\"\n    [class.cx-checkbox--indeterminate]=\"indeterminate$()\"\n    [class.cx-checkbox--has-content]=\"hasContent$()\"\n    data-shortcut-ignore=\" \"\n  >\n    <input\n      class=\"cx-checkbox__input\"\n      type=\"checkbox\"\n      [checked]=\"selected$()\"\n      [indeterminate]=\"indeterminate$()\"\n      [disabled]=\"disabled\"\n      [attr.aria-label]=\"resolvedAriaLabel$()\"\n      [attr.aria-describedby]=\"visibleHint$() ? hintId : null\"\n      (change)=\"onNativeChange($event)\"\n      (focus)=\"onFocus(true)\"\n      (blur)=\"onFocus(false)\"\n    />\n\n    <span\n      class=\"cx-checkbox__icon\"\n      [class.cx-checkbox__icon--selected]=\"selected$()\"\n      [class.cx-checkbox__icon--indeterminate]=\"indeterminate$()\"\n      aria-hidden=\"true\"\n    >\n      <span class=\"cx-checkbox__check\"></span>\n    </span>\n\n    @if (visibleText$()) {\n      <span class=\"cx-checkbox__label\">{{ visibleText$() }}</span>\n    }\n  </label>\n\n  @if (visibleHint$()) {\n    <div class=\"cx-checkbox__hint\" [attr.id]=\"hintId\">{{ visibleHint$() }}</div>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto;line-height:normal;vertical-align:top}.cx-checkbox-wrapper{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-xs);line-height:normal}.cx-checkbox{display:inline-grid;grid-template-columns:var(--choice-control-size);align-items:flex-start;cursor:pointer;outline:none}.cx-checkbox--has-content{grid-template-columns:var(--choice-control-size) minmax(0, auto);column-gap:var(--space-sm)}.cx-checkbox-wrapper--disabled{opacity:var(--opacity-disabled, 0.45);pointer-events:none;user-select:none}.cx-checkbox__input{grid-column:1;grid-row:1;width:var(--choice-control-size);height:var(--choice-control-size);padding:0;border:0;margin:0;appearance:none;cursor:inherit;opacity:0}.cx-checkbox__input:focus-visible+.cx-checkbox__icon{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-checkbox--has-content .cx-checkbox__icon{transform:translateY(3px)}.cx-checkbox__icon{position:relative;display:flex;grid-column:1;grid-row:1;box-sizing:border-box;width:var(--choice-control-size);height:var(--choice-control-size);min-width:var(--choice-control-size);min-height:var(--choice-control-size);align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--on-choice-control);flex:0 0 auto;line-height:0;pointer-events:none;transition:border-color var(--motion-base) ease,background-color var(--motion-base) ease}.cx-checkbox:not(.cx-checkbox--selected):hover .cx-checkbox__icon{background:var(--opacity-mid)}.cx-checkbox--selected .cx-checkbox__icon,.cx-checkbox--indeterminate .cx-checkbox__icon{border-color:var(--choice-control-selected);background:var(--choice-control-selected)}.cx-checkbox--selected:hover .cx-checkbox__icon,.cx-checkbox--indeterminate:hover .cx-checkbox__icon{border-color:var(--choice-control-selected-hover);background:var(--choice-control-selected-hover)}.cx-checkbox__check{position:absolute;top:50%;left:50%;opacity:0;transform:translate(-1.3px, 3.6px) rotate(-135deg) scale(0);transition:transform var(--motion-fast) ease,opacity var(--motion-fast) ease}.cx-checkbox__check::before,.cx-checkbox__check::after{content:\"\";position:absolute;top:50%;left:50%;display:block;border-radius:var(--radius-xs);background:var(--on-choice-control)}.cx-checkbox__check::before{width:1.5px;height:8.5px}.cx-checkbox__check::after{width:5px;height:1.5px}.cx-checkbox--selected .cx-checkbox__check{opacity:1;transform:translate(-1.3px, 3.6px) rotate(-135deg) scale(1)}.cx-checkbox--indeterminate .cx-checkbox__icon::before{content:\"\";position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:var(--radius-xs);background:var(--on-choice-control);transform:translate(-50%, -50%)}.cx-checkbox__label{grid-column:2;grid-row:1;align-self:baseline;padding-top:var(--space-2xs);padding-right:var(--space-sm);color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-checkbox__hint{padding-left:calc(var(--choice-control-size) + var(--space-sm));color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], hint: [{
                type: Input
            }], disabled: [{
                type: Input
            }], selected: [{
                type: Input
            }], value: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }] } });
