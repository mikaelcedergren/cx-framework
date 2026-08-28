import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal, } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
export class CxBigRadioComponent {
    selectedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedState" }] : /* istanbul ignore next */ []));
    choiceContentRef;
    heading = '';
    description = '';
    icon;
    iconMood = 'default';
    disabled = false;
    set selected(selected) {
        this.selectedState.set(selected);
    }
    selectedChange = new EventEmitter();
    focusChange = new EventEmitter();
    selected$ = this.selectedState.asReadonly();
    visibleHeading$() {
        return this.heading.trim();
    }
    visibleDescription$() {
        return this.description.trim();
    }
    activate() {
        if (this.disabled || this.selectedState()) {
            return;
        }
        this.selectedState.set(true);
        this.selectedChange.emit(true);
    }
    onFocus(focused) {
        this.focusChange.emit(focused);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBigRadioComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxBigRadioComponent, isStandalone: true, selector: "cx-big-radio", inputs: { heading: "heading", description: "description", icon: "icon", iconMood: "iconMood", disabled: "disabled", selected: "selected" }, outputs: { selectedChange: "selectedChange", focusChange: "focusChange" }, viewQueries: [{ propertyName: "choiceContentRef", first: true, predicate: ["choiceContent"], descendants: true, read: ElementRef }], ngImport: i0, template: "<label\n  class=\"cx-big-radio\"\n  [class.cx-big-radio--selected]=\"selected$()\"\n  [class.cx-big-radio--disabled]=\"disabled\"\n  [class.cx-big-radio--has-icon]=\"!!icon\"\n>\n  <input\n    class=\"cx-big-radio__input\"\n    type=\"radio\"\n    [checked]=\"selected$()\"\n    [disabled]=\"disabled\"\n    [attr.aria-label]=\"heading || description || null\"\n    (change)=\"activate()\"\n    (focus)=\"onFocus(true)\"\n    (blur)=\"onFocus(false)\"\n  />\n\n  <div class=\"cx-big-radio__indicator\" aria-hidden=\"true\">\n    <span class=\"cx-big-radio__control\" [class.cx-big-radio__control--selected]=\"selected$()\">\n      @if (selected$()) {\n        <span class=\"cx-big-radio__dot\"></span>\n      }\n    </span>\n  </div>\n  <div #choiceContent class=\"cx-big-radio__content\">\n      @if (visibleHeading$()) {\n        <div class=\"cx-big-radio__title-row\">\n          <div class=\"cx-big-radio__label\">{{ visibleHeading$() }}</div>\n        </div>\n      }\n      @if (visibleDescription$()) {\n        <div class=\"cx-big-radio__description\">{{ visibleDescription$() }}</div>\n      }\n      <ng-content />\n  </div>\n  @if (icon; as iconName) {\n    <cx-icon\n      class=\"cx-big-radio__icon\"\n      [icon]=\"iconName\"\n      [mood]=\"iconMood\"\n      size=\"24\"\n      shape=\"square-subtle\"\n      aria-hidden=\"true\"\n    />\n  }\n</label>\n", styles: [":host{display:block}.cx-big-radio{display:grid;grid-template-columns:var(--choice-control-size) minmax(0, 1fr);width:100%;box-sizing:border-box;align-items:start;column-gap:var(--space-md);padding:var(--space-md);border:none;border-radius:var(--radius-xl);background-color:var(--opacity-low);color:var(--opacity-high);cursor:pointer;outline:none;transition:background-color var(--motion-base) var(--ease-out),box-shadow var(--motion-fast) ease,color var(--motion-fast) ease}.cx-big-radio--empty,.cx-big-radio__content:empty{display:none}.cx-big-radio--selected{background:var(--surface);box-shadow:var(--shadow-low);color:var(--ink)}.cx-big-radio--selected:hover:not(.cx-big-radio--disabled){background:var(--surface);box-shadow:var(--shadow-low)}.cx-big-radio--has-icon{grid-template-columns:var(--choice-control-size) minmax(0, 1fr) auto}.cx-big-radio--disabled{opacity:.4;cursor:default;pointer-events:none;user-select:none}.cx-big-radio__input{grid-column:1;grid-row:1;align-self:start;justify-self:center;width:var(--choice-control-size);height:var(--choice-control-size);padding:0;border:0;margin:0;margin-top:var(--space-2xs);appearance:none;cursor:inherit;opacity:0}.cx-big-radio:has(.cx-big-radio__input:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-big-radio__indicator{grid-column:1;grid-row:1;display:inline-flex;align-items:center;justify-content:center;padding-top:var(--space-2xs);pointer-events:none}.cx-big-radio__control{display:inline-flex;width:var(--choice-control-size);height:var(--choice-control-size);align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);transition:border-color var(--motion-base) var(--ease-out),background-color var(--motion-base) var(--ease-out)}.cx-big-radio:hover:not(.cx-big-radio--selected):not(.cx-big-radio--disabled) .cx-big-radio__control{border-color:var(--opacity-mid);background:var(--opacity-mid)}.cx-big-radio__control--selected{border-color:var(--choice-control-selected);background:var(--choice-control-selected)}.cx-big-radio__dot{width:calc(var(--space-xs) + var(--space-2xs));height:calc(var(--space-xs) + var(--space-2xs));border-radius:var(--radius-pill);corner-shape:round;background:var(--on-choice-control)}.cx-big-radio__content{grid-column:2;grid-row:1;display:flex;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-big-radio__title-row{display:flex;min-width:0;align-items:center}.cx-big-radio__icon{grid-column:3;grid-row:1;align-self:start;justify-self:end}.cx-big-radio__label{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body)}.cx-big-radio__description{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBigRadioComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-big-radio', imports: [CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<label\n  class=\"cx-big-radio\"\n  [class.cx-big-radio--selected]=\"selected$()\"\n  [class.cx-big-radio--disabled]=\"disabled\"\n  [class.cx-big-radio--has-icon]=\"!!icon\"\n>\n  <input\n    class=\"cx-big-radio__input\"\n    type=\"radio\"\n    [checked]=\"selected$()\"\n    [disabled]=\"disabled\"\n    [attr.aria-label]=\"heading || description || null\"\n    (change)=\"activate()\"\n    (focus)=\"onFocus(true)\"\n    (blur)=\"onFocus(false)\"\n  />\n\n  <div class=\"cx-big-radio__indicator\" aria-hidden=\"true\">\n    <span class=\"cx-big-radio__control\" [class.cx-big-radio__control--selected]=\"selected$()\">\n      @if (selected$()) {\n        <span class=\"cx-big-radio__dot\"></span>\n      }\n    </span>\n  </div>\n  <div #choiceContent class=\"cx-big-radio__content\">\n      @if (visibleHeading$()) {\n        <div class=\"cx-big-radio__title-row\">\n          <div class=\"cx-big-radio__label\">{{ visibleHeading$() }}</div>\n        </div>\n      }\n      @if (visibleDescription$()) {\n        <div class=\"cx-big-radio__description\">{{ visibleDescription$() }}</div>\n      }\n      <ng-content />\n  </div>\n  @if (icon; as iconName) {\n    <cx-icon\n      class=\"cx-big-radio__icon\"\n      [icon]=\"iconName\"\n      [mood]=\"iconMood\"\n      size=\"24\"\n      shape=\"square-subtle\"\n      aria-hidden=\"true\"\n    />\n  }\n</label>\n", styles: [":host{display:block}.cx-big-radio{display:grid;grid-template-columns:var(--choice-control-size) minmax(0, 1fr);width:100%;box-sizing:border-box;align-items:start;column-gap:var(--space-md);padding:var(--space-md);border:none;border-radius:var(--radius-xl);background-color:var(--opacity-low);color:var(--opacity-high);cursor:pointer;outline:none;transition:background-color var(--motion-base) var(--ease-out),box-shadow var(--motion-fast) ease,color var(--motion-fast) ease}.cx-big-radio--empty,.cx-big-radio__content:empty{display:none}.cx-big-radio--selected{background:var(--surface);box-shadow:var(--shadow-low);color:var(--ink)}.cx-big-radio--selected:hover:not(.cx-big-radio--disabled){background:var(--surface);box-shadow:var(--shadow-low)}.cx-big-radio--has-icon{grid-template-columns:var(--choice-control-size) minmax(0, 1fr) auto}.cx-big-radio--disabled{opacity:.4;cursor:default;pointer-events:none;user-select:none}.cx-big-radio__input{grid-column:1;grid-row:1;align-self:start;justify-self:center;width:var(--choice-control-size);height:var(--choice-control-size);padding:0;border:0;margin:0;margin-top:var(--space-2xs);appearance:none;cursor:inherit;opacity:0}.cx-big-radio:has(.cx-big-radio__input:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-big-radio__indicator{grid-column:1;grid-row:1;display:inline-flex;align-items:center;justify-content:center;padding-top:var(--space-2xs);pointer-events:none}.cx-big-radio__control{display:inline-flex;width:var(--choice-control-size);height:var(--choice-control-size);align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);transition:border-color var(--motion-base) var(--ease-out),background-color var(--motion-base) var(--ease-out)}.cx-big-radio:hover:not(.cx-big-radio--selected):not(.cx-big-radio--disabled) .cx-big-radio__control{border-color:var(--opacity-mid);background:var(--opacity-mid)}.cx-big-radio__control--selected{border-color:var(--choice-control-selected);background:var(--choice-control-selected)}.cx-big-radio__dot{width:calc(var(--space-xs) + var(--space-2xs));height:calc(var(--space-xs) + var(--space-2xs));border-radius:var(--radius-pill);corner-shape:round;background:var(--on-choice-control)}.cx-big-radio__content{grid-column:2;grid-row:1;display:flex;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-big-radio__title-row{display:flex;min-width:0;align-items:center}.cx-big-radio__icon{grid-column:3;grid-row:1;align-self:start;justify-self:end}.cx-big-radio__label{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body)}.cx-big-radio__description{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"] }]
        }], propDecorators: { choiceContentRef: [{
                type: ViewChild,
                args: ['choiceContent', { read: ElementRef }]
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], icon: [{
                type: Input
            }], iconMood: [{
                type: Input
            }], disabled: [{
                type: Input
            }], selected: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }] } });
