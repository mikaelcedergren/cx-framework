import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, ViewChild, signal, } from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button/index.js';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch/index.js';
import { CxOptionComponent } from '../../primitives/overlay/cx-option/index.js';
import { CxOptionGroupComponent } from '../../primitives/overlay/cx-option-group/index.js';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover/index.js';
import { CxFloatingSurfaceController, } from '../../primitives/overlay/floating-surface-controller.js';
import { CX_THEMES } from '../../theme.js';
import * as i0 from "@angular/core";
const CX_POPOVER_DEMO_ROW_HEIGHT = 32;
const CX_POPOVER_DEMO_FRAME_HEIGHT = 8;
const CX_POPOVER_DEMO_MENU_WIDTH = 320;
const CX_POPOVER_DEMO_MENU_HEIGHT = 356;
const CX_POPOVER_DEMO_SUBMENU_WIDTH = 264;
const CX_POPOVER_DEMO_SUBMENU_GAP = 8;
const CX_POPOVER_DEMO_VIEWPORT_PADDING = 8;
const CX_POPOVER_DEMO_SUBMENU_LABELS = {
    theme: 'Theme',
};
const CX_POPOVER_DEMO_SUBMENU_ITEMS = {
    theme: CX_THEMES.map(theme => ({
        id: theme.id,
        label: theme.label,
        prependIcon: theme.icon,
    })),
};
function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}
function measureSubmenu(anchorRect, itemCount) {
    const viewportWidth = typeof window === 'undefined' ? CX_POPOVER_DEMO_SUBMENU_WIDTH : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 480 : window.innerHeight;
    const width = Math.min(CX_POPOVER_DEMO_SUBMENU_WIDTH, Math.max(viewportWidth - CX_POPOVER_DEMO_VIEWPORT_PADDING * 2, 0));
    const estimatedHeight = Math.min(Math.max(itemCount, 1) * 40 + 8, 320);
    const spaceRight = viewportWidth - anchorRect.right - CX_POPOVER_DEMO_VIEWPORT_PADDING - CX_POPOVER_DEMO_SUBMENU_GAP;
    const spaceLeft = anchorRect.left - CX_POPOVER_DEMO_VIEWPORT_PADDING - CX_POPOVER_DEMO_SUBMENU_GAP;
    const openToRight = spaceRight >= width || spaceRight >= spaceLeft;
    const leftBase = openToRight
        ? anchorRect.right + CX_POPOVER_DEMO_SUBMENU_GAP
        : anchorRect.left - width - CX_POPOVER_DEMO_SUBMENU_GAP;
    const left = Math.floor(clamp(leftBase, CX_POPOVER_DEMO_VIEWPORT_PADDING, viewportWidth - width - CX_POPOVER_DEMO_VIEWPORT_PADDING));
    const maxTop = Math.max(viewportHeight - Math.min(estimatedHeight, viewportHeight - CX_POPOVER_DEMO_VIEWPORT_PADDING * 2) - CX_POPOVER_DEMO_VIEWPORT_PADDING, CX_POPOVER_DEMO_VIEWPORT_PADDING);
    const top = Math.floor(clamp(anchorRect.top, CX_POPOVER_DEMO_VIEWPORT_PADDING, maxTop));
    return {
        left,
        top,
        maxHeight: Math.max(viewportHeight - top - CX_POPOVER_DEMO_VIEWPORT_PADDING, 0),
    };
}
/**
 * Workbench-only host that anchors a real cx-popover to a real trigger, so
 * variants exercise the production sizing and positioning contract instead of
 * a styled stand-in. Not a product component.
 */
export class CxPopoverDemoComponent {
    triggerText = 'Open popover';
    /** Stages narrow or wide triggers to stress the width contract. */
    triggerWidth;
    scenario = 'options';
    heading;
    /** Rendered into the popover's heading-row slot as a link, not as an input. */
    description;
    text;
    showCheckboxes = false;
    maxWidth;
    align = 'start';
    // Normalized: variant hosts (ngComponentOutlet) reset absent inputs to
    // undefined when the selected variant changes.
    optionsValue = [];
    set options(value) {
        this.optionsValue = value ?? [];
    }
    get options() {
        return this.optionsValue;
    }
    triggerRef;
    popoverRef;
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    selectedIdsState = signal(new Set(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdsState" }] : /* istanbul ignore next */ []));
    activeSubmenuState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeSubmenuState" }] : /* istanbul ignore next */ []));
    themeSelectionState = signal('night', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "themeSelectionState" }] : /* istanbul ignore next */ []));
    submenuFocusFrame;
    suppressNextSubmenuFocusOpen = false;
    digestEnabled$ = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "digestEnabled$" }] : /* istanbul ignore next */ []));
    isOpen$ = this.openState.asReadonly();
    activeSubmenu$ = this.activeSubmenuState.asReadonly();
    submenuWidth = CX_POPOVER_DEMO_SUBMENU_WIDTH;
    overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport), () => this.popoverRef?.surfaceElement());
    ngOnDestroy() {
        this.overlay.destroy();
        this.cancelSubmenuFocus();
    }
    toggleOpen() {
        if (this.openState()) {
            this.close();
            return;
        }
        this.closeSubmenu();
        this.openState.set(true);
        queueMicrotask(() => {
            this.overlay.sync(this.triggerRef?.nativeElement);
        });
    }
    close() {
        this.openState.set(false);
        this.closeSubmenu();
        this.overlay.resetMeasurement();
    }
    onOptionClick(option) {
        if (!this.showCheckboxes) {
            this.close();
            return;
        }
        const next = new Set(this.selectedIdsState());
        if (next.has(option.id)) {
            next.delete(option.id);
        }
        else {
            next.add(option.id);
        }
        this.selectedIdsState.set(next);
    }
    isSelected(optionId) {
        return this.selectedIdsState().has(optionId);
    }
    submenuState(submenuId) {
        return this.activeSubmenuState()?.id === submenuId ? 'open' : 'closed';
    }
    openSubmenu(submenuId, anchor) {
        if (!this.openState() || this.scenario !== 'workspace-menu') {
            return;
        }
        this.activeSubmenuState.set({
            id: submenuId,
            ...measureSubmenu(anchor.getBoundingClientRect(), CX_POPOVER_DEMO_SUBMENU_ITEMS[submenuId].length),
        });
    }
    openSubmenuFromFocus(submenuId, anchor) {
        if (this.suppressNextSubmenuFocusOpen) {
            this.suppressNextSubmenuFocusOpen = false;
            return;
        }
        this.openSubmenu(submenuId, anchor);
    }
    openSubmenuFromClick(submenuId, anchor, event) {
        event.preventDefault();
        event.stopPropagation();
        this.openSubmenu(submenuId, anchor);
    }
    openSubmenuFromKeyboard(submenuId, anchor, event) {
        if (event.key !== 'ArrowRight') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.openSubmenu(submenuId, anchor);
        this.focusFirstSubmenuItem(submenuId);
    }
    closeSubmenu() {
        this.cancelSubmenuFocus();
        this.activeSubmenuState.set(undefined);
    }
    closeSubmenuFromEscape() {
        this.suppressNextSubmenuFocusOpen = true;
        this.closeSubmenu();
    }
    submenuItems(submenuId) {
        return CX_POPOVER_DEMO_SUBMENU_ITEMS[submenuId];
    }
    submenuAriaLabel(submenuId) {
        return `${CX_POPOVER_DEMO_SUBMENU_LABELS[submenuId]} submenu`;
    }
    submenuSurfaceId(submenuId) {
        return `cx-popover-demo-${submenuId}-submenu`;
    }
    isSubmenuItemSelected(submenuId, itemId) {
        return this.themeSelectionState() === itemId;
    }
    selectSubmenuItem(submenuId, itemId) {
        this.themeSelectionState.set(itemId);
        this.close();
    }
    onWindowResize() {
        if (this.openState()) {
            this.overlay.sync();
            this.closeSubmenu();
        }
    }
    focusFirstSubmenuItem(submenuId) {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }
        this.cancelSubmenuFocus();
        this.submenuFocusFrame = window.requestAnimationFrame(() => {
            this.submenuFocusFrame = undefined;
            const surface = document.getElementById(this.submenuSurfaceId(submenuId));
            surface?.querySelector('.cx-option:not(:disabled)')?.focus();
        });
    }
    cancelSubmenuFocus() {
        if (typeof window !== 'undefined' && this.submenuFocusFrame !== undefined) {
            window.cancelAnimationFrame(this.submenuFocusFrame);
        }
        this.submenuFocusFrame = undefined;
    }
    measureOverlay(rect, viewport) {
        if (this.scenario === 'workspace-menu') {
            const viewportWidth = Math.max(viewport.width - 16, rect.width);
            const menuWidth = Math.min(CX_POPOVER_DEMO_MENU_WIDTH, viewportWidth);
            const estimatedHeight = CX_POPOVER_DEMO_MENU_HEIGHT + CX_POPOVER_DEMO_FRAME_HEIGHT;
            return {
                width: menuWidth,
                minWidth: menuWidth,
                estimatedHeight,
                align: this.align,
                maxHeightCap: estimatedHeight,
            };
        }
        // The heading row exists only when there is a heading; the slot rides in it.
        const headerHeight = this.heading ? CX_POPOVER_DEMO_ROW_HEIGHT : 0;
        const textHeight = this.text ? 96 : 0;
        const estimatedContentHeight = Math.min(headerHeight + textHeight + this.options.length * CX_POPOVER_DEMO_ROW_HEIGHT, 360);
        const estimatedHeight = estimatedContentHeight + CX_POPOVER_DEMO_FRAME_HEIGHT;
        return {
            width: rect.width,
            minWidth: rect.width,
            estimatedHeight: Math.max(estimatedHeight, CX_POPOVER_DEMO_ROW_HEIGHT + CX_POPOVER_DEMO_FRAME_HEIGHT),
            align: this.align,
            maxHeightCap: Math.max(estimatedHeight, CX_POPOVER_DEMO_ROW_HEIGHT + CX_POPOVER_DEMO_FRAME_HEIGHT),
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverDemoComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxPopoverDemoComponent, isStandalone: true, selector: "cx-popover-demo", inputs: { triggerText: "triggerText", triggerWidth: "triggerWidth", scenario: "scenario", heading: "heading", description: "description", text: "text", showCheckboxes: "showCheckboxes", maxWidth: "maxWidth", align: "align", options: "options" }, host: { listeners: { "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "triggerRef", first: true, predicate: ["trigger"], descendants: true, read: ElementRef }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }], ngImport: i0, template: "<cx-button\n  #trigger\n  [text]=\"triggerText\"\n  appendIcon=\"chevron-down\"\n  [style.--cx-button-width]=\"triggerWidth ? triggerWidth + 'px' : null\"\n  (click)=\"toggleOpen()\"\n/>\n\n@if (isOpen$()) {\n  <cx-popover\n    #popover\n    [open]=\"true\"\n    [showBackdrop]=\"true\"\n    [heading]=\"heading\"\n    [width]=\"overlay.width$()\"\n    [minWidth]=\"overlay.minWidth$()\"\n    [maxWidth]=\"maxWidth\"\n    [maxHeight]=\"overlay.maxHeight$()\"\n    [left]=\"overlay.left$()\"\n    [top]=\"overlay.top$()\"\n    [bottom]=\"overlay.bottom$()\"\n    [placement]=\"overlay.placement$()\"\n    [surfaceVariant]=\"scenario === 'workspace-menu' ? 'grouped' : 'default'\"\n    [role]=\"scenario === 'workspace-menu' ? 'menu' : undefined\"\n    [ariaLabel]=\"scenario === 'workspace-menu' ? 'Workspace menu' : undefined\"\n    (backdropPressed)=\"close()\"\n  >\n    @if (description) {\n      <!-- Stages the heading-row slot: a real link is what this slot is for. -->\n      <a actions class=\"cx-popover-demo__heading-link\" href=\"#\" (click)=\"$event.preventDefault()\">\n        {{ description }}\n      </a>\n    }\n\n    @if (scenario === 'workspace-menu') {\n      <div class=\"cx-popover-demo__groups\">\n        <div class=\"cx-popover-demo__group\">\n          <cx-option label=\"Daily digest\" [clickable]=\"false\" (pointerenter)=\"closeSubmenu()\">\n            <cx-switch\n              control\n              ariaLabel=\"Daily digest\"\n              size=\"small\"\n              [selected]=\"digestEnabled$()\"\n              (selectedChange)=\"digestEnabled$.set($event)\"\n            />\n          </cx-option>\n        </div>\n\n        <div class=\"cx-popover-demo__group\">\n          <cx-option\n            [role]=\"'menuitem'\"\n            label=\"Theme\"\n            [submenu]=\"submenuState('theme')\"\n            (pointerenter)=\"openSubmenu('theme', $any($event.currentTarget))\"\n            (focusin)=\"openSubmenuFromFocus('theme', $any($event.currentTarget))\"\n            (click)=\"openSubmenuFromClick('theme', $any($event.currentTarget), $event)\"\n            (keydown)=\"openSubmenuFromKeyboard('theme', $any($event.currentTarget), $event)\"\n          />\n        </div>\n\n        <div class=\"cx-popover-demo__group\">\n          <cx-option [role]=\"'menuitem'\" label=\"Open\" prependIcon=\"open-new\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Members\" prependIcon=\"users\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Invite people\" prependIcon=\"plus\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Copy link\" prependIcon=\"copy\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Settings\" prependIcon=\"settings\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n        </div>\n\n        <div class=\"cx-popover-demo__group\">\n          <cx-option-group label=\"Internal\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Archive\" prependIcon=\"archive\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Delete\" prependIcon=\"delete\" mood=\"danger\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n        </div>\n      </div>\n    } @else {\n      @if (text) {\n        <p class=\"cx-popover-demo__text\">{{ text }}</p>\n      }\n\n      @for (option of options; track option.id) {\n        <cx-option\n          [label]=\"option.label\"\n          [description]=\"option.description\"\n          [prependIcon]=\"option.prependIcon\"\n          [showCheckbox]=\"showCheckboxes\"\n          [selected]=\"isSelected(option.id)\"\n          (click)=\"onOptionClick(option)\"\n        />\n      }\n    }\n  </cx-popover>\n}\n\n@if (activeSubmenu$(); as submenu) {\n  <cx-popover\n    [open]=\"true\"\n    [showBackdrop]=\"false\"\n    [surfaceId]=\"submenuSurfaceId(submenu.id)\"\n    [role]=\"'menu'\"\n    [ariaLabel]=\"submenuAriaLabel(submenu.id)\"\n    [width]=\"submenuWidth\"\n    [maxHeight]=\"submenu.maxHeight\"\n    [left]=\"submenu.left\"\n    [top]=\"submenu.top\"\n    surfaceVariant=\"grouped\"\n    (backdropPressed)=\"closeSubmenuFromEscape()\"\n  >\n    <div class=\"cx-popover-demo__groups\">\n      <div class=\"cx-popover-demo__group\">\n        @for (item of submenuItems(submenu.id); track item.id) {\n          <cx-option\n            [role]=\"'menuitemradio'\"\n            [label]=\"item.label\"\n            [prependIcon]=\"item.prependIcon\"\n            [selected]=\"isSubmenuItemSelected(submenu.id, item.id)\"\n            (click)=\"selectSubmenuItem(submenu.id, item.id)\"\n          />\n        }\n      </div>\n    </div>\n  </cx-popover>\n}\n", styles: [":host {\n  display: inline-flex;\n}\n\n.cx-popover-demo__heading-link {\n  color: var(--primary);\n  font-size: var(--font-size-body-sm);\n  line-height: 1;\n  white-space: nowrap;\n}\n\n.cx-popover-demo__groups {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  flex: 1 1 auto;\n  flex-direction: column;\n  gap: var(--space-xs);\n}\n\n.cx-popover-demo__group {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  overflow: hidden;\n  border-radius: var(--radius-md);\n  background: var(--surface);\n}\n\n.cx-popover-demo__text {\n  margin: 0;\n  padding: var(--space-sm) var(--space-md);\n  color: var(--opacity-high);\n  font-size: var(--font-size-body-sm);\n  line-height: var(--line-height-body);\n}\n"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "tooltip", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxOptionGroupComponent, selector: "cx-option-group", inputs: ["label", "description", "variant"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxSwitchComponent, selector: "cx-switch", inputs: ["text", "ariaLabel", "hint", "size", "disabled", "validation", "selected"], outputs: ["selectedChange", "focusChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverDemoComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-popover-demo', imports: [CxButtonComponent, CxOptionComponent, CxOptionGroupComponent, CxPopoverComponent, CxSwitchComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<cx-button\n  #trigger\n  [text]=\"triggerText\"\n  appendIcon=\"chevron-down\"\n  [style.--cx-button-width]=\"triggerWidth ? triggerWidth + 'px' : null\"\n  (click)=\"toggleOpen()\"\n/>\n\n@if (isOpen$()) {\n  <cx-popover\n    #popover\n    [open]=\"true\"\n    [showBackdrop]=\"true\"\n    [heading]=\"heading\"\n    [width]=\"overlay.width$()\"\n    [minWidth]=\"overlay.minWidth$()\"\n    [maxWidth]=\"maxWidth\"\n    [maxHeight]=\"overlay.maxHeight$()\"\n    [left]=\"overlay.left$()\"\n    [top]=\"overlay.top$()\"\n    [bottom]=\"overlay.bottom$()\"\n    [placement]=\"overlay.placement$()\"\n    [surfaceVariant]=\"scenario === 'workspace-menu' ? 'grouped' : 'default'\"\n    [role]=\"scenario === 'workspace-menu' ? 'menu' : undefined\"\n    [ariaLabel]=\"scenario === 'workspace-menu' ? 'Workspace menu' : undefined\"\n    (backdropPressed)=\"close()\"\n  >\n    @if (description) {\n      <!-- Stages the heading-row slot: a real link is what this slot is for. -->\n      <a actions class=\"cx-popover-demo__heading-link\" href=\"#\" (click)=\"$event.preventDefault()\">\n        {{ description }}\n      </a>\n    }\n\n    @if (scenario === 'workspace-menu') {\n      <div class=\"cx-popover-demo__groups\">\n        <div class=\"cx-popover-demo__group\">\n          <cx-option label=\"Daily digest\" [clickable]=\"false\" (pointerenter)=\"closeSubmenu()\">\n            <cx-switch\n              control\n              ariaLabel=\"Daily digest\"\n              size=\"small\"\n              [selected]=\"digestEnabled$()\"\n              (selectedChange)=\"digestEnabled$.set($event)\"\n            />\n          </cx-option>\n        </div>\n\n        <div class=\"cx-popover-demo__group\">\n          <cx-option\n            [role]=\"'menuitem'\"\n            label=\"Theme\"\n            [submenu]=\"submenuState('theme')\"\n            (pointerenter)=\"openSubmenu('theme', $any($event.currentTarget))\"\n            (focusin)=\"openSubmenuFromFocus('theme', $any($event.currentTarget))\"\n            (click)=\"openSubmenuFromClick('theme', $any($event.currentTarget), $event)\"\n            (keydown)=\"openSubmenuFromKeyboard('theme', $any($event.currentTarget), $event)\"\n          />\n        </div>\n\n        <div class=\"cx-popover-demo__group\">\n          <cx-option [role]=\"'menuitem'\" label=\"Open\" prependIcon=\"open-new\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Members\" prependIcon=\"users\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Invite people\" prependIcon=\"plus\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Copy link\" prependIcon=\"copy\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Settings\" prependIcon=\"settings\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n        </div>\n\n        <div class=\"cx-popover-demo__group\">\n          <cx-option-group label=\"Internal\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Archive\" prependIcon=\"archive\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n          <cx-option [role]=\"'menuitem'\" label=\"Delete\" prependIcon=\"delete\" mood=\"danger\" (pointerenter)=\"closeSubmenu()\" (click)=\"close()\" />\n        </div>\n      </div>\n    } @else {\n      @if (text) {\n        <p class=\"cx-popover-demo__text\">{{ text }}</p>\n      }\n\n      @for (option of options; track option.id) {\n        <cx-option\n          [label]=\"option.label\"\n          [description]=\"option.description\"\n          [prependIcon]=\"option.prependIcon\"\n          [showCheckbox]=\"showCheckboxes\"\n          [selected]=\"isSelected(option.id)\"\n          (click)=\"onOptionClick(option)\"\n        />\n      }\n    }\n  </cx-popover>\n}\n\n@if (activeSubmenu$(); as submenu) {\n  <cx-popover\n    [open]=\"true\"\n    [showBackdrop]=\"false\"\n    [surfaceId]=\"submenuSurfaceId(submenu.id)\"\n    [role]=\"'menu'\"\n    [ariaLabel]=\"submenuAriaLabel(submenu.id)\"\n    [width]=\"submenuWidth\"\n    [maxHeight]=\"submenu.maxHeight\"\n    [left]=\"submenu.left\"\n    [top]=\"submenu.top\"\n    surfaceVariant=\"grouped\"\n    (backdropPressed)=\"closeSubmenuFromEscape()\"\n  >\n    <div class=\"cx-popover-demo__groups\">\n      <div class=\"cx-popover-demo__group\">\n        @for (item of submenuItems(submenu.id); track item.id) {\n          <cx-option\n            [role]=\"'menuitemradio'\"\n            [label]=\"item.label\"\n            [prependIcon]=\"item.prependIcon\"\n            [selected]=\"isSubmenuItemSelected(submenu.id, item.id)\"\n            (click)=\"selectSubmenuItem(submenu.id, item.id)\"\n          />\n        }\n      </div>\n    </div>\n  </cx-popover>\n}\n", styles: [":host {\n  display: inline-flex;\n}\n\n.cx-popover-demo__heading-link {\n  color: var(--primary);\n  font-size: var(--font-size-body-sm);\n  line-height: 1;\n  white-space: nowrap;\n}\n\n.cx-popover-demo__groups {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  flex: 1 1 auto;\n  flex-direction: column;\n  gap: var(--space-xs);\n}\n\n.cx-popover-demo__group {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  overflow: hidden;\n  border-radius: var(--radius-md);\n  background: var(--surface);\n}\n\n.cx-popover-demo__text {\n  margin: 0;\n  padding: var(--space-sm) var(--space-md);\n  color: var(--opacity-high);\n  font-size: var(--font-size-body-sm);\n  line-height: var(--line-height-body);\n}\n"] }]
        }], propDecorators: { triggerText: [{
                type: Input
            }], triggerWidth: [{
                type: Input
            }], scenario: [{
                type: Input
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], text: [{
                type: Input
            }], showCheckboxes: [{
                type: Input
            }], maxWidth: [{
                type: Input
            }], align: [{
                type: Input
            }], options: [{
                type: Input
            }], triggerRef: [{
                type: ViewChild,
                args: ['trigger', { read: ElementRef }]
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
