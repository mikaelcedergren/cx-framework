import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxMenuComponent, CxMenuTriggerDirective } from '../../overlay/cx-menu/index.js';
import { createDelayedLoadingState } from '../shared/delayed-loading-state.js';
import * as i0 from "@angular/core";
export class CxSplitButtonComponent {
    delayedLoading = createDelayedLoadingState(0);
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    itemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemsState" }] : /* istanbul ignore next */ []));
    text = '';
    icon;
    ariaLabel;
    type = 'button';
    set items(value) {
        this.itemsState.set(value ?? []);
    }
    menuAriaLabel;
    mood = 'default';
    size = 'default';
    transparent = false;
    rounded = false;
    disabled = false;
    set loading(value) {
        this.delayedLoading.sync(Boolean(value));
    }
    set open(value) {
        this.openState.set(Boolean(value));
    }
    pressed = new EventEmitter();
    itemSelect = new EventEmitter();
    openChange = new EventEmitter();
    loading$ = this.delayedLoading.loading$;
    showSpinner$ = this.delayedLoading.showSpinner$;
    open$ = this.openState.asReadonly();
    items$ = this.itemsState.asReadonly();
    get visibleText() {
        return this.text?.trim() ?? '';
    }
    get nativeType() {
        return this.type === 'submit' || this.type === 'reset' ? this.type : 'button';
    }
    get mainAriaLabel() {
        const label = this.ariaLabel?.trim();
        if (label) {
            return label;
        }
        return this.visibleText ? null : 'Button';
    }
    get resolvedMenuAriaLabel() {
        const label = this.menuAriaLabel?.trim();
        if (label) {
            return label;
        }
        return this.visibleText ? `More actions for ${this.visibleText}` : 'More actions';
    }
    get isDisabled() {
        return this.disabled || this.loading$();
    }
    get iconSize() {
        if (this.size === 'small') {
            return 12;
        }
        if (this.size === 'large') {
            return 18;
        }
        return 16;
    }
    onMainPressed() {
        if (this.isDisabled) {
            return;
        }
        this.pressed.emit();
    }
    onOpenChange(open) {
        this.openState.set(open);
        this.openChange.emit(open);
    }
    onItemSelect(itemId) {
        this.itemSelect.emit(itemId);
    }
    ngOnDestroy() {
        this.delayedLoading.destroy();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSplitButtonComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSplitButtonComponent, isStandalone: true, selector: "cx-split-button", inputs: { text: "text", icon: "icon", ariaLabel: "ariaLabel", type: "type", items: "items", menuAriaLabel: "menuAriaLabel", mood: "mood", size: "size", transparent: "transparent", rounded: "rounded", disabled: "disabled", loading: "loading", open: "open" }, outputs: { pressed: "pressed", itemSelect: "itemSelect", openChange: "openChange" }, ngImport: i0, template: "<span\n  class=\"cx-split-button\"\n  [class.cx-split-button--default]=\"mood === 'default'\"\n  [class.cx-split-button--primary]=\"mood === 'primary'\"\n  [class.cx-split-button--accent]=\"mood === 'accent'\"\n  [class.cx-split-button--info]=\"mood === 'info'\"\n  [class.cx-split-button--success]=\"mood === 'success'\"\n  [class.cx-split-button--warning]=\"mood === 'warning'\"\n  [class.cx-split-button--danger]=\"mood === 'danger'\"\n  [class.cx-split-button--transparent]=\"transparent\"\n  [class.cx-split-button--small]=\"size === 'small'\"\n  [class.cx-split-button--large]=\"size === 'large'\"\n  [class.cx-split-button--rounded]=\"rounded\"\n  [class.cx-split-button--disabled]=\"isDisabled\"\n  [class.cx-split-button--loading]=\"showSpinner$()\"\n  [class.cx-split-button--open]=\"open$()\"\n>\n  <button\n    class=\"cx-split-button__main\"\n    [type]=\"nativeType\"\n    [disabled]=\"isDisabled\"\n    [attr.aria-label]=\"mainAriaLabel\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    (click)=\"onMainPressed()\"\n  >\n    <span\n      class=\"cx-split-button__content\"\n      [class.cx-split-button__content--hidden]=\"showSpinner$()\"\n      [attr.aria-hidden]=\"showSpinner$() ? 'true' : null\"\n    >\n      @if (icon; as iconName) {\n        <cx-icon class=\"cx-split-button__icon\" [icon]=\"iconName\" [size]=\"iconSize\" />\n      }\n      @if (visibleText) {\n        <span class=\"cx-split-button__label\">{{ visibleText }}</span>\n      }\n    </span>\n\n    @if (showSpinner$()) {\n      <span class=\"cx-split-button__spinner-box\" aria-hidden=\"true\">\n        <cx-spinner mood=\"default\" size=\"auto\" />\n      </span>\n    }\n  </button>\n\n  <cx-menu\n    [presentation]=\"{ kind: 'trigger' }\"\n    class=\"cx-split-button__menu\"\n    [items]=\"items$()\"\n    [open]=\"open$()\"\n    [disabled]=\"isDisabled\"\n    [ariaLabel]=\"resolvedMenuAriaLabel\"\n    align=\"end\"\n    (openChange)=\"onOpenChange($event)\"\n    (itemSelect)=\"onItemSelect($event)\"\n  >\n    <button\n      cxMenuTrigger\n      type=\"button\"\n      class=\"cx-split-button__trigger\"\n      [attr.aria-label]=\"resolvedMenuAriaLabel\"\n    >\n      <cx-icon class=\"cx-split-button__chevron\" icon=\"chevron-down\" [size]=\"iconSize\" />\n    </button>\n  </cx-menu>\n</span>\n", styles: [":host{display:inline-flex;width:auto}.cx-split-button{--cx-split-button-background: var(--opacity-low);--cx-split-button-color: var(--ink);--cx-split-button-hover-background: var(--opacity-mid);--cx-split-button-divider: var(--opacity-mid);display:inline-flex;width:auto;min-width:0;min-height:var(--controller-size);align-items:stretch;overflow:hidden;border-radius:var(--radius-sm);background:var(--cx-split-button-background);color:var(--cx-split-button-color);transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease}.cx-split-button--default{--cx-split-button-background: var(--opacity-low);--cx-split-button-color: var(--ink);--cx-split-button-hover-background: var(--opacity-mid);--cx-split-button-divider: var(--opacity-mid)}.cx-split-button--primary{--cx-split-button-background: var(--primary);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--primary-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--accent{--cx-split-button-background: var(--accent);--cx-split-button-color: var(--surface);--cx-split-button-hover-background: var(--accent-alt);--cx-split-button-divider: color-mix(in srgb, var(--surface) 24%, transparent)}.cx-split-button--info{--cx-split-button-background: var(--info);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--info-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--success{--cx-split-button-background: var(--success);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--success-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--warning{--cx-split-button-background: var(--warning);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--warning-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--danger{--cx-split-button-background: var(--danger);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--danger-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--transparent{--cx-split-button-background: transparent;--cx-split-button-color: var(--ink);--cx-split-button-hover-background: var(--opacity-low);--cx-split-button-divider: var(--opacity-mid)}.cx-split-button--transparent.cx-split-button--primary{--cx-split-button-color: var(--primary);--cx-split-button-hover-background: var(--primary-opacity)}.cx-split-button--transparent.cx-split-button--accent{--cx-split-button-color: var(--accent);--cx-split-button-hover-background: var(--accent-opacity)}.cx-split-button--transparent.cx-split-button--info{--cx-split-button-color: var(--info);--cx-split-button-hover-background: var(--info-opacity)}.cx-split-button--transparent.cx-split-button--success{--cx-split-button-color: var(--success);--cx-split-button-hover-background: var(--success-opacity)}.cx-split-button--transparent.cx-split-button--warning{--cx-split-button-color: var(--warning);--cx-split-button-hover-background: var(--warning-opacity)}.cx-split-button--transparent.cx-split-button--danger{--cx-split-button-color: var(--danger);--cx-split-button-hover-background: var(--danger-opacity)}.cx-split-button--small{min-height:var(--controller-size-small)}.cx-split-button--large{min-height:var(--controller-size-large)}.cx-split-button--rounded{border-radius:var(--radius-pill);corner-shape:round}.cx-split-button--disabled{opacity:.2}.cx-split-button__main,.cx-split-button__trigger{display:inline-grid;min-width:0;align-items:center;justify-content:center;border:0;background:rgba(0,0,0,0);color:inherit;cursor:pointer;font:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transition:background-color var(--motion-fast) ease}.cx-split-button__main{grid-template:\"stack\" 1fr/minmax(0, auto);padding:0 var(--space-md)}.cx-split-button__trigger{width:var(--controller-size);border-left:var(--border-width) solid var(--cx-split-button-divider);padding:0}.cx-split-button--small .cx-split-button__main,.cx-split-button--small .cx-split-button__trigger{font-size:var(--font-size-body-sm)}.cx-split-button--small .cx-split-button__main{padding-inline:var(--space-sm)}.cx-split-button--small .cx-split-button__trigger{width:var(--controller-size-small)}.cx-split-button--large .cx-split-button__main,.cx-split-button--large .cx-split-button__trigger{font-size:var(--font-size-body-lg)}.cx-split-button--large .cx-split-button__main{padding-inline:var(--space-lg)}.cx-split-button--large .cx-split-button__trigger{width:var(--controller-size-large)}.cx-split-button__main:is(:hover,:focus-visible):not(:disabled),.cx-split-button__trigger:is(:hover,:focus-visible):not(:disabled),.cx-split-button--open .cx-split-button__trigger{background:var(--cx-split-button-hover-background)}.cx-split-button__main:focus-visible,.cx-split-button__trigger:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-split-button__main:active:not(:disabled),.cx-split-button__trigger:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-split-button__main:disabled,.cx-split-button__trigger:disabled{cursor:default}.cx-split-button__content,.cx-split-button__spinner-box{grid-area:stack}.cx-split-button__content{display:inline-flex;min-width:0;align-items:center;justify-content:center;gap:var(--space-sm)}.cx-split-button--small .cx-split-button__content{gap:var(--space-xs)}.cx-split-button--large .cx-split-button__content{gap:var(--space-md)}.cx-split-button__content--hidden{visibility:hidden}.cx-split-button__icon,.cx-split-button__chevron,.cx-split-button__spinner-box{display:inline-flex;color:currentColor}.cx-split-button__label{display:block;min-width:0;color:currentColor;line-height:1;overflow-wrap:anywhere}.cx-split-button__spinner-box{width:16px;height:16px;place-self:center}.cx-split-button--small .cx-split-button__spinner-box{width:12px;height:12px}.cx-split-button--large .cx-split-button__spinner-box{width:18px;height:18px}.cx-split-button__menu{display:inline-flex}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSplitButtonComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-split-button', imports: [CxIconComponent, CxMenuComponent, CxMenuTriggerDirective, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<span\n  class=\"cx-split-button\"\n  [class.cx-split-button--default]=\"mood === 'default'\"\n  [class.cx-split-button--primary]=\"mood === 'primary'\"\n  [class.cx-split-button--accent]=\"mood === 'accent'\"\n  [class.cx-split-button--info]=\"mood === 'info'\"\n  [class.cx-split-button--success]=\"mood === 'success'\"\n  [class.cx-split-button--warning]=\"mood === 'warning'\"\n  [class.cx-split-button--danger]=\"mood === 'danger'\"\n  [class.cx-split-button--transparent]=\"transparent\"\n  [class.cx-split-button--small]=\"size === 'small'\"\n  [class.cx-split-button--large]=\"size === 'large'\"\n  [class.cx-split-button--rounded]=\"rounded\"\n  [class.cx-split-button--disabled]=\"isDisabled\"\n  [class.cx-split-button--loading]=\"showSpinner$()\"\n  [class.cx-split-button--open]=\"open$()\"\n>\n  <button\n    class=\"cx-split-button__main\"\n    [type]=\"nativeType\"\n    [disabled]=\"isDisabled\"\n    [attr.aria-label]=\"mainAriaLabel\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    (click)=\"onMainPressed()\"\n  >\n    <span\n      class=\"cx-split-button__content\"\n      [class.cx-split-button__content--hidden]=\"showSpinner$()\"\n      [attr.aria-hidden]=\"showSpinner$() ? 'true' : null\"\n    >\n      @if (icon; as iconName) {\n        <cx-icon class=\"cx-split-button__icon\" [icon]=\"iconName\" [size]=\"iconSize\" />\n      }\n      @if (visibleText) {\n        <span class=\"cx-split-button__label\">{{ visibleText }}</span>\n      }\n    </span>\n\n    @if (showSpinner$()) {\n      <span class=\"cx-split-button__spinner-box\" aria-hidden=\"true\">\n        <cx-spinner mood=\"default\" size=\"auto\" />\n      </span>\n    }\n  </button>\n\n  <cx-menu\n    [presentation]=\"{ kind: 'trigger' }\"\n    class=\"cx-split-button__menu\"\n    [items]=\"items$()\"\n    [open]=\"open$()\"\n    [disabled]=\"isDisabled\"\n    [ariaLabel]=\"resolvedMenuAriaLabel\"\n    align=\"end\"\n    (openChange)=\"onOpenChange($event)\"\n    (itemSelect)=\"onItemSelect($event)\"\n  >\n    <button\n      cxMenuTrigger\n      type=\"button\"\n      class=\"cx-split-button__trigger\"\n      [attr.aria-label]=\"resolvedMenuAriaLabel\"\n    >\n      <cx-icon class=\"cx-split-button__chevron\" icon=\"chevron-down\" [size]=\"iconSize\" />\n    </button>\n  </cx-menu>\n</span>\n", styles: [":host{display:inline-flex;width:auto}.cx-split-button{--cx-split-button-background: var(--opacity-low);--cx-split-button-color: var(--ink);--cx-split-button-hover-background: var(--opacity-mid);--cx-split-button-divider: var(--opacity-mid);display:inline-flex;width:auto;min-width:0;min-height:var(--controller-size);align-items:stretch;overflow:hidden;border-radius:var(--radius-sm);background:var(--cx-split-button-background);color:var(--cx-split-button-color);transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease}.cx-split-button--default{--cx-split-button-background: var(--opacity-low);--cx-split-button-color: var(--ink);--cx-split-button-hover-background: var(--opacity-mid);--cx-split-button-divider: var(--opacity-mid)}.cx-split-button--primary{--cx-split-button-background: var(--primary);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--primary-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--accent{--cx-split-button-background: var(--accent);--cx-split-button-color: var(--surface);--cx-split-button-hover-background: var(--accent-alt);--cx-split-button-divider: color-mix(in srgb, var(--surface) 24%, transparent)}.cx-split-button--info{--cx-split-button-background: var(--info);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--info-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--success{--cx-split-button-background: var(--success);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--success-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--warning{--cx-split-button-background: var(--warning);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--warning-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--danger{--cx-split-button-background: var(--danger);--cx-split-button-color: var(--on-ink);--cx-split-button-hover-background: var(--danger-alt);--cx-split-button-divider: color-mix(in srgb, var(--on-ink) 24%, transparent)}.cx-split-button--transparent{--cx-split-button-background: transparent;--cx-split-button-color: var(--ink);--cx-split-button-hover-background: var(--opacity-low);--cx-split-button-divider: var(--opacity-mid)}.cx-split-button--transparent.cx-split-button--primary{--cx-split-button-color: var(--primary);--cx-split-button-hover-background: var(--primary-opacity)}.cx-split-button--transparent.cx-split-button--accent{--cx-split-button-color: var(--accent);--cx-split-button-hover-background: var(--accent-opacity)}.cx-split-button--transparent.cx-split-button--info{--cx-split-button-color: var(--info);--cx-split-button-hover-background: var(--info-opacity)}.cx-split-button--transparent.cx-split-button--success{--cx-split-button-color: var(--success);--cx-split-button-hover-background: var(--success-opacity)}.cx-split-button--transparent.cx-split-button--warning{--cx-split-button-color: var(--warning);--cx-split-button-hover-background: var(--warning-opacity)}.cx-split-button--transparent.cx-split-button--danger{--cx-split-button-color: var(--danger);--cx-split-button-hover-background: var(--danger-opacity)}.cx-split-button--small{min-height:var(--controller-size-small)}.cx-split-button--large{min-height:var(--controller-size-large)}.cx-split-button--rounded{border-radius:var(--radius-pill);corner-shape:round}.cx-split-button--disabled{opacity:.2}.cx-split-button__main,.cx-split-button__trigger{display:inline-grid;min-width:0;align-items:center;justify-content:center;border:0;background:rgba(0,0,0,0);color:inherit;cursor:pointer;font:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transition:background-color var(--motion-fast) ease}.cx-split-button__main{grid-template:\"stack\" 1fr/minmax(0, auto);padding:0 var(--space-md)}.cx-split-button__trigger{width:var(--controller-size);border-left:var(--border-width) solid var(--cx-split-button-divider);padding:0}.cx-split-button--small .cx-split-button__main,.cx-split-button--small .cx-split-button__trigger{font-size:var(--font-size-body-sm)}.cx-split-button--small .cx-split-button__main{padding-inline:var(--space-sm)}.cx-split-button--small .cx-split-button__trigger{width:var(--controller-size-small)}.cx-split-button--large .cx-split-button__main,.cx-split-button--large .cx-split-button__trigger{font-size:var(--font-size-body-lg)}.cx-split-button--large .cx-split-button__main{padding-inline:var(--space-lg)}.cx-split-button--large .cx-split-button__trigger{width:var(--controller-size-large)}.cx-split-button__main:is(:hover,:focus-visible):not(:disabled),.cx-split-button__trigger:is(:hover,:focus-visible):not(:disabled),.cx-split-button--open .cx-split-button__trigger{background:var(--cx-split-button-hover-background)}.cx-split-button__main:focus-visible,.cx-split-button__trigger:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-split-button__main:active:not(:disabled),.cx-split-button__trigger:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-split-button__main:disabled,.cx-split-button__trigger:disabled{cursor:default}.cx-split-button__content,.cx-split-button__spinner-box{grid-area:stack}.cx-split-button__content{display:inline-flex;min-width:0;align-items:center;justify-content:center;gap:var(--space-sm)}.cx-split-button--small .cx-split-button__content{gap:var(--space-xs)}.cx-split-button--large .cx-split-button__content{gap:var(--space-md)}.cx-split-button__content--hidden{visibility:hidden}.cx-split-button__icon,.cx-split-button__chevron,.cx-split-button__spinner-box{display:inline-flex;color:currentColor}.cx-split-button__label{display:block;min-width:0;color:currentColor;line-height:1;overflow-wrap:anywhere}.cx-split-button__spinner-box{width:16px;height:16px;place-self:center}.cx-split-button--small .cx-split-button__spinner-box{width:12px;height:12px}.cx-split-button--large .cx-split-button__spinner-box{width:18px;height:18px}.cx-split-button__menu{display:inline-flex}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], icon: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], type: [{
                type: Input
            }], items: [{
                type: Input
            }], menuAriaLabel: [{
                type: Input
            }], mood: [{
                type: Input
            }], size: [{
                type: Input
            }], transparent: [{
                type: Input
            }], rounded: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], open: [{
                type: Input
            }], pressed: [{
                type: Output
            }], itemSelect: [{
                type: Output
            }], openChange: [{
                type: Output
            }] } });
