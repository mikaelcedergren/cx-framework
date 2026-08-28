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
     * Rail presentation: only the avatar stays visible and the username moves
     * into an instant tooltip on the right. Bind it to the surrounding
     * navigation's collapsed state; the menu keeps working from the avatar.
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxAccountControlComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxAccountControlComponent, isStandalone: true, selector: "cx-account-control", inputs: { username: "username", disabled: "disabled", collapsed: "collapsed", menuItems: "menuItems" }, outputs: { logout: "logout", itemSelect: "itemSelect" }, ngImport: i0, template: "<cx-menu\n  [presentation]=\"{ kind: 'trigger' }\"\n  [items]=\"resolvedMenuItems$()\"\n  [open]=\"open$()\"\n  [disabled]=\"disabled\"\n  [width]=\"208\"\n  align=\"start\"\n  layout=\"fill\"\n  (openChange)=\"onOpenChange($event)\"\n  (itemSelect)=\"onItemSelect($event)\"\n>\n  <button\n    cxMenuTrigger\n    class=\"cx-account-control\"\n    [class.cx-account-control--open]=\"open$()\"\n    [class.cx-account-control--collapsed]=\"collapsed\"\n    type=\"button\"\n    [attr.aria-label]=\"'Account actions for ' + username\"\n    [cxTooltip]=\"username\"\n    [cxTooltipOverflow]=\"!collapsed\"\n    [cxTooltipPosition]=\"collapsed ? 'right' : 'top'\"\n    [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n  >\n    <span class=\"cx-account-control__identity\">\n      <cx-avatar\n        class=\"cx-account-control__avatar\"\n        [name]=\"username\"\n        size=\"small\"\n        color=\"cyan\"\n      />\n      <span class=\"cx-account-control__label\" data-cx-tooltip-overflow>{{ username }}</span>\n    </span>\n    <cx-icon class=\"cx-account-control__icon\" icon=\"chevrons-vertical\" [size]=\"16\" />\n  </button>\n</cx-menu>\n", styles: [":host{display:block;width:100%}.cx-account-control{display:flex;width:100%;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-sm);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;cursor:pointer;box-sizing:border-box;overflow:hidden;transition:padding var(--motion-slow) var(--ease-out-strong)}.cx-account-control--collapsed{padding:0 var(--space-xs)}.cx-account-control--collapsed .cx-account-control__label,.cx-account-control--collapsed .cx-account-control__icon{opacity:0;transition-delay:0s}@media(prefers-reduced-motion: reduce){.cx-account-control,.cx-account-control__label,.cx-account-control__icon{transition:none}}.cx-account-control:hover,.cx-account-control--open{background:var(--opacity-low)}.cx-account-control:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-account-control:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-account-control--open{background:var(--surface-alt)}.cx-account-control:hover .cx-account-control__icon,.cx-account-control--open .cx-account-control__icon{color:var(--ink)}.cx-account-control:disabled{opacity:.5;cursor:default}.cx-account-control__identity{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-account-control__avatar{flex:0 0 auto}.cx-account-control__label{min-width:0;color:var(--opacity-high);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.2;transition:opacity var(--motion-base) ease var(--motion-fast)}.cx-account-control__icon{flex:0 0 auto;color:var(--opacity-mid);transition:color var(--motion-fast) ease,opacity var(--motion-base) ease var(--motion-fast)}"], dependencies: [{ kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxAvatarComponent, selector: "cx-avatar", inputs: ["name", "badge", "src", "size", "color", "ariaLabel"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxAccountControlComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-account-control', imports: [CxMenuComponent, CxMenuTriggerDirective, CxTooltipDirective, CxIconComponent, CxAvatarComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<cx-menu\n  [presentation]=\"{ kind: 'trigger' }\"\n  [items]=\"resolvedMenuItems$()\"\n  [open]=\"open$()\"\n  [disabled]=\"disabled\"\n  [width]=\"208\"\n  align=\"start\"\n  layout=\"fill\"\n  (openChange)=\"onOpenChange($event)\"\n  (itemSelect)=\"onItemSelect($event)\"\n>\n  <button\n    cxMenuTrigger\n    class=\"cx-account-control\"\n    [class.cx-account-control--open]=\"open$()\"\n    [class.cx-account-control--collapsed]=\"collapsed\"\n    type=\"button\"\n    [attr.aria-label]=\"'Account actions for ' + username\"\n    [cxTooltip]=\"username\"\n    [cxTooltipOverflow]=\"!collapsed\"\n    [cxTooltipPosition]=\"collapsed ? 'right' : 'top'\"\n    [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n  >\n    <span class=\"cx-account-control__identity\">\n      <cx-avatar\n        class=\"cx-account-control__avatar\"\n        [name]=\"username\"\n        size=\"small\"\n        color=\"cyan\"\n      />\n      <span class=\"cx-account-control__label\" data-cx-tooltip-overflow>{{ username }}</span>\n    </span>\n    <cx-icon class=\"cx-account-control__icon\" icon=\"chevrons-vertical\" [size]=\"16\" />\n  </button>\n</cx-menu>\n", styles: [":host{display:block;width:100%}.cx-account-control{display:flex;width:100%;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-sm);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;cursor:pointer;box-sizing:border-box;overflow:hidden;transition:padding var(--motion-slow) var(--ease-out-strong)}.cx-account-control--collapsed{padding:0 var(--space-xs)}.cx-account-control--collapsed .cx-account-control__label,.cx-account-control--collapsed .cx-account-control__icon{opacity:0;transition-delay:0s}@media(prefers-reduced-motion: reduce){.cx-account-control,.cx-account-control__label,.cx-account-control__icon{transition:none}}.cx-account-control:hover,.cx-account-control--open{background:var(--opacity-low)}.cx-account-control:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-account-control:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-account-control--open{background:var(--surface-alt)}.cx-account-control:hover .cx-account-control__icon,.cx-account-control--open .cx-account-control__icon{color:var(--ink)}.cx-account-control:disabled{opacity:.5;cursor:default}.cx-account-control__identity{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-account-control__avatar{flex:0 0 auto}.cx-account-control__label{min-width:0;color:var(--opacity-high);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.2;transition:opacity var(--motion-base) ease var(--motion-fast)}.cx-account-control__icon{flex:0 0 auto;color:var(--opacity-mid);transition:color var(--motion-fast) ease,opacity var(--motion-base) ease var(--motion-fast)}"] }]
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
