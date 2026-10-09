import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxMenuComponent, CxMenuTriggerDirective } from '../../primitives/overlay/cx-menu/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxAvatarComponent } from '../../primitives/display/cx-avatar/index.js';
import * as i0 from "@angular/core";
const ACCOUNT_CONTROL_MENU_ITEMS = [
    {
        id: 'logout',
        label: 'Log out',
        prependIcon: 'log-out',
        danger: true,
    },
];
export class CxAccountControlComponent {
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    menuItemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuItemsState" }] : /* istanbul ignore next */ []));
    username = 'Wolfie';
    disabled = false;
    /**
     * Avatar-only presentation: the control owns its compact width and the
     * username moves into an instant tooltip. Also bind this to a navigation
     * rail's collapsed state; the same account menu remains available.
     */
    collapsed = false;
    set menuItems(value) {
        this.menuItemsState.set(value ?? []);
    }
    logout = new EventEmitter();
    itemSelect = new EventEmitter();
    open$ = this.openState.asReadonly();
    resolvedMenuItems$ = computed(() => {
        const menuItems = this.menuItemsState();
        return menuItems.length > 0 ? menuItems : ACCOUNT_CONTROL_MENU_ITEMS;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resolvedMenuItems$" }] : /* istanbul ignore next */ []));
    onOpenChange(open) {
        this.openState.set(open);
    }
    onItemSelect(itemId) {
        if (itemId === 'logout') {
            this.logout.emit();
            return;
        }
        this.itemSelect.emit(itemId);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxAccountControlComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxAccountControlComponent, isStandalone: true, selector: "cx-account-control", inputs: { username: "username", disabled: "disabled", collapsed: "collapsed", menuItems: "menuItems" }, outputs: { logout: "logout", itemSelect: "itemSelect" }, host: { properties: { "class.cx-account-control-host--collapsed": "collapsed" } }, ngImport: i0, template: "<cx-menu\n  [presentation]=\"{ kind: 'trigger' }\"\n  [items]=\"resolvedMenuItems$()\"\n  [open]=\"open$()\"\n  [disabled]=\"disabled\"\n  [width]=\"208\"\n  align=\"start\"\n  layout=\"fill\"\n  (openChange)=\"onOpenChange($event)\"\n  (itemSelect)=\"onItemSelect($event)\"\n>\n  <button\n    cxMenuTrigger\n    class=\"cx-account-control\"\n    [class.cx-account-control--open]=\"open$()\"\n    [class.cx-account-control--collapsed]=\"collapsed\"\n    type=\"button\"\n    [attr.aria-label]=\"'Account actions for ' + username\"\n    [cxTooltip]=\"username\"\n    [cxTooltipOverflow]=\"!collapsed\"\n    [cxTooltipPosition]=\"collapsed ? 'right' : 'top'\"\n    [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n  >\n    <span class=\"cx-account-control__identity\">\n      <cx-avatar\n        class=\"cx-account-control__avatar\"\n        [name]=\"username\"\n        size=\"small\"\n        color=\"cyan\"\n      />\n      @if (!collapsed) {\n        <span class=\"cx-account-control__label\" data-cx-tooltip-overflow>{{ username }}</span>\n      }\n    </span>\n    @if (!collapsed) {\n      <cx-icon class=\"cx-account-control__icon\" icon=\"chevrons-vertical\" [size]=\"16\" />\n    }\n  </button>\n</cx-menu>\n", styles: [":host{display:block;width:100%}:host(.cx-account-control-host--collapsed){width:var(--controller-size)}.cx-account-control{display:flex;width:100%;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;cursor:pointer;box-sizing:border-box;overflow:hidden}.cx-account-control--collapsed{justify-content:center}@media(prefers-reduced-motion: reduce){.cx-account-control__icon{transition:none}}.cx-account-control:hover,.cx-account-control--open{background:var(--opacity-low)}.cx-account-control:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-account-control:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-account-control--open{background:var(--surface-alt)}.cx-account-control:hover .cx-account-control__icon,.cx-account-control--open .cx-account-control__icon{color:var(--ink)}.cx-account-control:disabled{opacity:var(--opacity-disabled);cursor:default}.cx-account-control__identity{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-account-control__avatar{flex:0 0 auto}.cx-account-control__label{min-width:0;color:var(--opacity-high);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.2}.cx-account-control__icon{flex:0 0 auto;color:var(--opacity-high);transition:color var(--motion-fast) ease}"], dependencies: [{ kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxAvatarComponent, selector: "cx-avatar", inputs: ["name", "badge", "src", "size", "color", "ariaLabel"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxAccountControlComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-account-control', imports: [CxMenuComponent, CxMenuTriggerDirective, CxTooltipDirective, CxIconComponent, CxAvatarComponent], host: { '[class.cx-account-control-host--collapsed]': 'collapsed' }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<cx-menu\n  [presentation]=\"{ kind: 'trigger' }\"\n  [items]=\"resolvedMenuItems$()\"\n  [open]=\"open$()\"\n  [disabled]=\"disabled\"\n  [width]=\"208\"\n  align=\"start\"\n  layout=\"fill\"\n  (openChange)=\"onOpenChange($event)\"\n  (itemSelect)=\"onItemSelect($event)\"\n>\n  <button\n    cxMenuTrigger\n    class=\"cx-account-control\"\n    [class.cx-account-control--open]=\"open$()\"\n    [class.cx-account-control--collapsed]=\"collapsed\"\n    type=\"button\"\n    [attr.aria-label]=\"'Account actions for ' + username\"\n    [cxTooltip]=\"username\"\n    [cxTooltipOverflow]=\"!collapsed\"\n    [cxTooltipPosition]=\"collapsed ? 'right' : 'top'\"\n    [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n  >\n    <span class=\"cx-account-control__identity\">\n      <cx-avatar\n        class=\"cx-account-control__avatar\"\n        [name]=\"username\"\n        size=\"small\"\n        color=\"cyan\"\n      />\n      @if (!collapsed) {\n        <span class=\"cx-account-control__label\" data-cx-tooltip-overflow>{{ username }}</span>\n      }\n    </span>\n    @if (!collapsed) {\n      <cx-icon class=\"cx-account-control__icon\" icon=\"chevrons-vertical\" [size]=\"16\" />\n    }\n  </button>\n</cx-menu>\n", styles: [":host{display:block;width:100%}:host(.cx-account-control-host--collapsed){width:var(--controller-size)}.cx-account-control{display:flex;width:100%;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;cursor:pointer;box-sizing:border-box;overflow:hidden}.cx-account-control--collapsed{justify-content:center}@media(prefers-reduced-motion: reduce){.cx-account-control__icon{transition:none}}.cx-account-control:hover,.cx-account-control--open{background:var(--opacity-low)}.cx-account-control:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-account-control:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-account-control--open{background:var(--surface-alt)}.cx-account-control:hover .cx-account-control__icon,.cx-account-control--open .cx-account-control__icon{color:var(--ink)}.cx-account-control:disabled{opacity:var(--opacity-disabled);cursor:default}.cx-account-control__identity{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-account-control__avatar{flex:0 0 auto}.cx-account-control__label{min-width:0;color:var(--opacity-high);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.2}.cx-account-control__icon{flex:0 0 auto;color:var(--opacity-high);transition:color var(--motion-fast) ease}"] }]
        }], propDecorators: { username: [{
                type: Input
            }], disabled: [{
                type: Input
            }], collapsed: [{
                type: Input
            }], menuItems: [{
                type: Input
            }], logout: [{
                type: Output
            }], itemSelect: [{
                type: Output
            }] } });
