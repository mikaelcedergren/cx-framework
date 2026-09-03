import { booleanAttribute, ChangeDetectionStrategy, Component, ContentChildren, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, ViewChild, inject, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxMenuComponent, CxMenuTriggerDirective } from '../../primitives/overlay/cx-menu/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import { CxDismissRequest } from '../../primitives/overlay/dismiss-request.js';
import { CxOverlayStateService } from '../../primitives/overlay/overlay-state.js';
import { CxTabsComponent } from '../../primitives/navigation/cx-tabs/index.js';
import { isHostVisible } from '../../primitives/shared/host-visibility.js';
import { CxDetailPanelSectionComponent } from './cx-detail-panel-section.component.js';
import * as i0 from "@angular/core";
const DETAIL_PANEL_DISMISS_FALLBACK_BUFFER_MS = 50;
const DETAIL_PANEL_RESIZE_STEP = 8;
const DETAIL_PANEL_RESIZE_LARGE_STEP = 32;
export class CxDetailPanelComponent {
    static nextId = 0;
    host = inject((ElementRef));
    overlayState = inject(CxOverlayStateService);
    overlayHandle;
    dismissMeasureFrame;
    dismissFallbackTimer;
    restoreFocusOnDismiss = true;
    dismissCompleted = false;
    selectedTabIdValue;
    menuItemsValue;
    tabsValue = [];
    instanceId = CxDetailPanelComponent.nextId++;
    contentSections;
    contentViewport;
    panelSurface;
    icon;
    /** Colors the header icon; every other part of the header stays ink. */
    mood = 'default';
    heading = '';
    variant = 'floating';
    set menuItems(value) {
        this.menuItemsValue = validateDetailPanelMenuItems(value);
    }
    get menuItems() {
        return this.menuItemsValue;
    }
    menuAriaLabel;
    set tabs(value) {
        this.tabsValue = validateDetailPanelTabs(value);
    }
    get tabs() {
        return this.tabsValue;
    }
    tabsAriaLabel;
    /** Optional width / min-width overrides (any CSS length) for the panel host. */
    set width(value) {
        this.widthValue = value;
        // A programmatic width supersedes any user drag that came before it.
        this.resizedWidth$.set(null);
    }
    get width() {
        return this.widthValue;
    }
    widthValue = null;
    minWidth = null;
    /** Lets the user drag the panel's start edge to change its width. */
    resizable = true;
    /**
     * Renders the footer bar and its close button. Turning it off removes the
     * panel's only pointer-reachable exit; Escape and an enabled outside click
     * remain the dismissal paths.
     */
    footer = true;
    /**
     * Also dismiss on a click outside the panel after any owned overlay closes.
     * A successful dismissal lets that pointer action continue to its outside
     * target and does not restore focus to the panel's invoker.
     */
    dismissOnClickOutside = false;
    dismissed = new EventEmitter();
    /** Synchronous request emitted before a user dismissal would close this panel. */
    dismissRequest = new EventEmitter();
    menuItemSelect = new EventEmitter();
    selectedTabIdChange = new EventEmitter();
    /** Emits the rendered width as a px length after a user resize settles. */
    widthChange = new EventEmitter();
    closing$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "closing$" }] : /* istanbul ignore next */ []));
    resizing$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resizing$" }] : /* istanbul ignore next */ []));
    resizedWidth$ = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resizedWidth$" }] : /* istanbul ignore next */ []));
    activeResizeSession;
    headingId = `cx-detail-panel-heading-${this.instanceId}`;
    tabPanelId = `cx-detail-panel-tab-panel-${this.instanceId}`;
    constructor() {
        this.overlayHandle = this.overlayState.capture({
            kind: 'transient',
            restoreFocus: true,
            surface: () => this.panelSurface?.nativeElement,
            layerSurfaces: () => [this.host.nativeElement],
            isActive: () => isHostVisible(this.host.nativeElement),
            onEscape: () => {
                if (!this.closing$()) {
                    this.dismiss();
                }
            },
        });
    }
    set selectedTabId(value) {
        const nextValue = value?.trim() || undefined;
        if (nextValue !== this.selectedTabIdValue) {
            this.selectedTabIdValue = nextValue;
            this.resetContentScroll();
        }
    }
    get selectedTabId() {
        return this.selectedTabIdValue;
    }
    ngAfterViewChecked() {
    }
    // Exposed as custom properties so the responsive width rules can replace
    // them cleanly without competing with inline width declarations.
    get widthVar() {
        return this.resizedWidth$() ?? this.width;
    }
    get minWidthVar() {
        return this.minWidth;
    }
    get floatingHostClass() {
        return this.variant === 'floating';
    }
    get isFixed() {
        return this.variant === 'fixed';
    }
    get hasTabs() {
        return this.tabs.some(tab => tab.id?.trim());
    }
    get normalizedHeading() {
        return this.heading.trim();
    }
    get hasMenuItems() {
        return (this.menuItems?.length ?? 0) > 0;
    }
    get resolvedMenuAriaLabel() {
        const label = this.menuAriaLabel?.trim();
        if (label) {
            return label;
        }
        return this.normalizedHeading ? `Actions for ${this.normalizedHeading}` : 'Detail panel actions';
    }
    get resolvedTabsAriaLabel() {
        const label = this.tabsAriaLabel?.trim();
        if (label) {
            return label;
        }
        return this.normalizedHeading ? `${this.normalizedHeading} sections` : 'Detail sections';
    }
    get resolvedCloseAriaLabel() {
        return this.normalizedHeading ? `Close ${this.normalizedHeading}` : 'Close detail panel';
    }
    get resolvedResizeAriaLabel() {
        return this.normalizedHeading ? `Resize ${this.normalizedHeading}` : 'Resize detail panel';
    }
    get renderedWidthPx() {
        return Math.round(this.host.nativeElement.getBoundingClientRect().width);
    }
    onResizePointerDown(event) {
        if (!this.resizable || !event.isPrimary || event.button !== 0 || this.closing$()) {
            return;
        }
        event.preventDefault();
        const handle = event.currentTarget;
        this.stopResizeSession();
        this.activeResizeSession = {
            pointerId: event.pointerId,
            handle,
            startX: event.clientX,
            startWidth: this.host.nativeElement.getBoundingClientRect().width,
            rtl: window.getComputedStyle(this.host.nativeElement).direction === 'rtl',
        };
        this.resizing$.set(true);
        handle.setPointerCapture(event.pointerId);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }
    onResizePointerMove(event) {
        const session = this.activeResizeSession;
        if (!session || event.pointerId !== session.pointerId) {
            return;
        }
        // The panel's end edge is anchored, so dragging the start edge outward
        // widens it. CSS clamps the raw value between the min-width floor and the
        // available frame.
        const delta = (session.startX - event.clientX) * (session.rtl ? -1 : 1);
        this.resizedWidth$.set(`${Math.round(session.startWidth + delta)}px`);
    }
    onResizePointerUp(event) {
        if (this.activeResizeSession?.pointerId === event.pointerId) {
            this.finishResizeSession();
        }
    }
    onResizePointerCancel(event) {
        if (this.activeResizeSession?.pointerId === event.pointerId) {
            this.finishResizeSession();
        }
    }
    onResizeLostPointerCapture(event) {
        if (this.activeResizeSession?.pointerId === event.pointerId) {
            this.finishResizeSession();
        }
    }
    onResizeKeydown(event) {
        if (!this.resizable) {
            return;
        }
        const rtl = window.getComputedStyle(this.host.nativeElement).direction === 'rtl';
        const step = event.shiftKey ? DETAIL_PANEL_RESIZE_LARGE_STEP : DETAIL_PANEL_RESIZE_STEP;
        const current = this.host.nativeElement.getBoundingClientRect().width;
        const outwardKey = rtl ? 'ArrowRight' : 'ArrowLeft';
        const inwardKey = rtl ? 'ArrowLeft' : 'ArrowRight';
        let next;
        switch (event.key) {
            case outwardKey:
                next = current + step;
                break;
            case inwardKey:
                next = current - step;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = Number.MAX_SAFE_INTEGER;
                break;
            default:
                return;
        }
        event.preventDefault();
        this.resizedWidth$.set(`${Math.min(Math.max(Math.round(next), 0), 100000)}px`);
        this.emitRenderedWidthAfterLayout();
    }
    onResizeDoubleClick(event) {
        if (!this.resizable) {
            return;
        }
        event.preventDefault();
        this.stopResizeSession();
        this.resizedWidth$.set(null);
        this.emitRenderedWidthAfterLayout();
    }
    finishResizeSession() {
        this.stopResizeSession();
        this.widthChange.emit(`${this.renderedWidthPx}px`);
    }
    stopResizeSession() {
        const session = this.activeResizeSession;
        this.activeResizeSession = undefined;
        if (session && session.handle.hasPointerCapture(session.pointerId)) {
            session.handle.releasePointerCapture(session.pointerId);
        }
        this.resizing$.set(false);
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
    }
    emitRenderedWidthAfterLayout() {
        // The new width lands on the host during the next change detection pass,
        // so measuring is deferred one macrotask.
        window.setTimeout(() => this.widthChange.emit(`${this.renderedWidthPx}px`));
    }
    get selectedTabButtonId() {
        const normalizedTabs = this.tabs.filter(tab => tab.id?.trim());
        const selectedIndex = normalizedTabs.findIndex(tab => tab.id.trim() === this.selectedTabId && !tab.disabled);
        const resolvedIndex = selectedIndex >= 0 ? selectedIndex : normalizedTabs.findIndex(tab => !tab.disabled);
        return resolvedIndex >= 0 ? `${this.tabPanelId}-tab-${resolvedIndex}` : null;
    }
    onDocumentMousedown(event) {
        if (!this.dismissOnClickOutside || this.closing$()) {
            return;
        }
        const target = event.target;
        if (!target)
            return;
        if (!isHostVisible(this.host.nativeElement))
            return;
        if (!this.overlayState.isTopmost(this.overlayHandle))
            return;
        if (this.host.nativeElement.contains(target))
            return;
        if (!this.dismiss(false)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    dismiss(restoreFocus = true) {
        if (this.closing$()) {
            return false;
        }
        const request = new CxDismissRequest('dismiss');
        this.dismissRequest.emit(request);
        if (request.defaultPrevented) {
            return false;
        }
        const activeElement = document.activeElement;
        // Blur only panel-owned focus so in-progress field edits commit without
        // perturbing a control that already owns focus elsewhere.
        if (activeElement instanceof HTMLElement && this.host.nativeElement.contains(activeElement)) {
            activeElement.blur();
        }
        this.restoreFocusOnDismiss = restoreFocus;
        this.stopResizeSession();
        this.closing$.set(true);
        this.scheduleDismissFallback();
        return true;
    }
    onDismissAnimationEnd(event) {
        if (event.target === this.panelSurface?.nativeElement) {
            this.completeDismiss();
        }
    }
    ngOnDestroy() {
        this.stopResizeSession();
        this.clearDismissSchedule();
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    onMenuItemSelect(id) {
        this.menuItemSelect.emit(id);
    }
    onTabSelect(id) {
        this.selectedTabIdValue = id;
        this.resetContentScroll();
        this.selectedTabIdChange.emit(id);
    }
    resetContentScroll() {
        if (this.contentViewport) {
            this.contentViewport.nativeElement.scrollTop = 0;
            this.contentViewport.nativeElement.scrollLeft = 0;
        }
    }
    scheduleDismissFallback() {
        this.dismissMeasureFrame = window.requestAnimationFrame(() => {
            this.dismissMeasureFrame = undefined;
            const surface = this.panelSurface?.nativeElement;
            const animationMs = surface
                ? maximumAnimationTimeMs(window.getComputedStyle(surface))
                : 0;
            this.dismissFallbackTimer = window.setTimeout(() => this.completeDismiss(), animationMs + DETAIL_PANEL_DISMISS_FALLBACK_BUFFER_MS);
        });
    }
    completeDismiss() {
        if (!this.closing$() || this.dismissCompleted) {
            return;
        }
        this.dismissCompleted = true;
        this.clearDismissSchedule();
        if (this.overlayHandle && !this.restoreFocusOnDismiss) {
            this.overlayHandle.restoreFocus = false;
        }
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
        this.dismissed.emit();
    }
    clearDismissSchedule() {
        if (this.dismissMeasureFrame !== undefined) {
            window.cancelAnimationFrame(this.dismissMeasureFrame);
            this.dismissMeasureFrame = undefined;
        }
        if (this.dismissFallbackTimer !== undefined) {
            window.clearTimeout(this.dismissFallbackTimer);
            this.dismissFallbackTimer = undefined;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDetailPanelComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDetailPanelComponent, isStandalone: true, selector: "cx-detail-panel", inputs: { icon: "icon", mood: "mood", heading: "heading", variant: "variant", menuItems: "menuItems", menuAriaLabel: "menuAriaLabel", tabs: "tabs", tabsAriaLabel: "tabsAriaLabel", width: "width", minWidth: "minWidth", resizable: ["resizable", "resizable", booleanAttribute], footer: ["footer", "footer", booleanAttribute], dismissOnClickOutside: "dismissOnClickOutside", selectedTabId: "selectedTabId" }, outputs: { dismissed: "dismissed", dismissRequest: "dismissRequest", menuItemSelect: "menuItemSelect", selectedTabIdChange: "selectedTabIdChange", widthChange: "widthChange" }, host: { listeners: { "document:mousedown": "onDocumentMousedown($event)" }, properties: { "style.--cx-detail-panel-width": "this.widthVar", "style.--cx-detail-panel-min-width": "this.minWidthVar", "class.cx-detail-panel-host--floating": "this.floatingHostClass" } }, queries: [{ propertyName: "contentSections", predicate: CxDetailPanelSectionComponent, read: ElementRef }], viewQueries: [{ propertyName: "contentViewport", first: true, predicate: ["contentViewport"], descendants: true, read: ElementRef }, { propertyName: "panelSurface", first: true, predicate: ["panelSurface"], descendants: true, read: ElementRef }], ngImport: i0, template: "<aside\n  #panelSurface\n  class=\"cx-detail-panel\"\n  [class.cx-detail-panel--closing]=\"closing$()\"\n  [class.cx-detail-panel--fixed]=\"isFixed\"\n  [attr.aria-labelledby]=\"normalizedHeading ? headingId : null\"\n  [attr.aria-label]=\"normalizedHeading ? null : 'Detail panel'\"\n  [attr.aria-hidden]=\"closing$() ? 'true' : null\"\n  [attr.inert]=\"closing$() ? '' : null\"\n  (animationend)=\"onDismissAnimationEnd($event)\"\n>\n  @if (resizable) {\n    <div\n      class=\"cx-detail-panel__resize-handle\"\n      [class.cx-detail-panel__resize-handle--active]=\"resizing$()\"\n      role=\"separator\"\n      tabindex=\"0\"\n      aria-orientation=\"vertical\"\n      [attr.aria-label]=\"resolvedResizeAriaLabel\"\n      [attr.aria-valuenow]=\"renderedWidthPx\"\n      [attr.aria-valuetext]=\"renderedWidthPx + ' pixels'\"\n      (pointerdown)=\"onResizePointerDown($event)\"\n      (pointermove)=\"onResizePointerMove($event)\"\n      (pointerup)=\"onResizePointerUp($event)\"\n      (pointercancel)=\"onResizePointerCancel($event)\"\n      (lostpointercapture)=\"onResizeLostPointerCapture($event)\"\n      (keydown)=\"onResizeKeydown($event)\"\n      (dblclick)=\"onResizeDoubleClick($event)\"\n    ></div>\n  }\n\n  <header class=\"cx-detail-panel__header\">\n    @if (icon || normalizedHeading) {\n      <div\n        class=\"cx-detail-panel__heading-group\"\n        [cxTooltip]=\"normalizedHeading\"\n        [cxTooltipOverflow]=\"true\"\n      >\n        @if (icon; as iconName) {\n          <cx-icon class=\"cx-detail-panel__heading-icon\" [icon]=\"iconName\" [size]=\"24\" [mood]=\"mood\" />\n        }\n        @if (normalizedHeading) {\n          <h2 class=\"cx-detail-panel__heading\" [id]=\"headingId\" data-cx-tooltip-overflow>{{ normalizedHeading }}</h2>\n        }\n      </div>\n    }\n\n    <div class=\"cx-detail-panel__header-actions\">\n      <ng-content select=\"cx-status-tag[detail-panel-status]\" />\n\n      @if (hasMenuItems) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          [items]=\"menuItems ?? []\"\n          [ariaLabel]=\"resolvedMenuAriaLabel\"\n          align=\"end\"\n          (itemSelect)=\"onMenuItemSelect($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            [ariaLabel]=\"resolvedMenuAriaLabel\"\n            variant=\"transparent\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </header>\n\n  @if (hasTabs) {\n    <cx-tabs\n      class=\"cx-detail-panel__tabs\"\n      [items]=\"tabs\"\n      [selectedId]=\"selectedTabId\"\n      [ariaLabel]=\"resolvedTabsAriaLabel\"\n      [controlsId]=\"tabPanelId\"\n      [transparent]=\"true\"\n      [divided]=\"false\"\n      (selectedIdChange)=\"onTabSelect($event)\"\n    />\n  }\n\n  <div\n    #contentViewport\n    class=\"cx-detail-panel__content-viewport\"\n    [attr.id]=\"hasTabs ? tabPanelId : null\"\n    [attr.role]=\"hasTabs ? 'tabpanel' : null\"\n    [attr.aria-labelledby]=\"hasTabs ? selectedTabButtonId : null\"\n    [attr.aria-label]=\"hasTabs && !selectedTabButtonId ? resolvedTabsAriaLabel : null\"\n    [attr.tabindex]=\"hasTabs ? '0' : null\"\n  >\n    <div class=\"cx-detail-panel__content\">\n      <ng-content />\n    </div>\n  </div>\n\n  @if (footer) {\n    <footer class=\"cx-detail-panel__footer\">\n      <div class=\"cx-detail-panel__footer-slot\">\n        <ng-content select=\"[detail-panel-footer]\" />\n      </div>\n\n      <cx-icon-button\n        class=\"cx-detail-panel__footer-close\"\n        icon=\"arrow-right\"\n        [ariaLabel]=\"resolvedCloseAriaLabel\"\n        mood=\"default\"\n        (pressed)=\"dismiss()\"\n      />\n    </footer>\n  }\n</aside>\n", styles: [":root{--breakpoint-mobile: 720px}:host{display:block;position:absolute;z-index:var(--z-index-detail);inset-block:0;inset-inline-end:0;width:var(--cx-detail-panel-width, min(450px, 100%));min-width:min(max(380px,var(--cx-detail-panel-min-width, 0px)),100%);max-width:100%;height:100%;min-height:0;color:var(--ink);pointer-events:auto}@media(min-width: 720px){:host(.cx-detail-panel-host--floating){height:calc(100% - var(--space-xs) - var(--space-xs));margin-block:var(--space-xs);margin-inline-end:var(--space-xs)}}.cx-detail-panel{--cx-detail-panel-frame-padding: var(--surface-separation);--cx-detail-panel-island-radius: var(--radius-lg);display:flex;position:relative;width:100%;height:100%;min-height:0;max-width:100%;flex-direction:column;overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-low);box-sizing:border-box;gap:var(--cx-detail-panel-frame-padding);padding:var(--cx-detail-panel-frame-padding);animation:cx-detail-panel-enter var(--motion-slow) var(--ease-out) both;will-change:transform}.cx-detail-panel--fixed{--cx-detail-panel-island-radius: var(--radius-md);border:0;border-radius:0;box-shadow:none}.cx-detail-panel--closing{pointer-events:none;animation:cx-detail-panel-exit var(--motion-slow) var(--ease-in) both}@media(max-width: 719px){:host{inset:0;width:100%;min-width:0}}.cx-detail-panel__resize-handle{position:absolute;top:0;inset-inline-start:0;z-index:1;width:12px;height:100%;cursor:col-resize;touch-action:none}.cx-detail-panel__resize-handle::after{position:absolute;top:50%;inset-inline-start:50%;width:3px;height:calc(100% - var(--cx-detail-panel-frame-padding)*2);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);content:\"\";transform:translate(-50%, -50%);transition:background-color var(--motion-fast) ease}.cx-detail-panel__resize-handle:hover::after,.cx-detail-panel__resize-handle:focus-visible::after,.cx-detail-panel__resize-handle--active::after{background:var(--info)}.cx-detail-panel__resize-handle:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}@media(max-width: 719px){.cx-detail-panel__resize-handle{display:none}}.cx-detail-panel__header{display:flex;min-height:var(--controller-size);min-width:0;flex:0 0 auto;align-items:center;justify-content:space-between;gap:var(--space-md);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--cx-detail-panel-island-radius);background:var(--surface);box-sizing:border-box}.cx-detail-panel__header:not(:has(.cx-detail-panel__heading-group,.cx-detail-panel__header-actions>*)){display:none}.cx-detail-panel__heading-group{display:flex;min-width:0;flex:1 1 auto;align-items:center;gap:var(--space-sm);color:var(--ink)}.cx-detail-panel__heading-icon{flex:0 0 auto;color:var(--ink)}.cx-detail-panel__heading{min-width:0;margin:0;overflow:hidden;color:var(--ink);font-size:var(--font-size-title-3);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);text-overflow:ellipsis;white-space:nowrap}.cx-detail-panel__header-actions,.cx-detail-panel__footer-slot{display:inline-flex;min-width:0;flex:0 0 auto;align-items:center;gap:var(--space-sm)}.cx-detail-panel__header-actions:empty,.cx-detail-panel__footer-slot:empty{display:none}.cx-detail-panel__tabs{min-width:0;flex:0 0 auto}.cx-detail-panel__content-viewport{min-width:0;min-height:0;flex:1 1 auto;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}.cx-detail-panel__content-viewport:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}.cx-detail-panel__content{display:flex;width:100%;max-width:100%;min-width:0;min-height:100%;flex-direction:column;gap:var(--cx-detail-panel-frame-padding);box-sizing:border-box}.cx-detail-panel__footer{display:flex;min-height:var(--controller-size);min-width:0;flex-shrink:0;align-items:center;justify-content:space-between;gap:var(--space-md);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--cx-detail-panel-island-radius);background:var(--surface);box-sizing:border-box}.cx-detail-panel__footer-slot{margin-inline-end:0}.cx-detail-panel__footer-close{flex:0 0 auto;margin-inline-start:auto}@keyframes cx-detail-panel-enter{from{transform:translateX(calc(100% + var(--space-xs)))}to{transform:translateX(0)}}@keyframes cx-detail-panel-exit{from{transform:translateX(0)}to{transform:translateX(calc(100% + var(--space-xs)))}}@media(prefers-reduced-motion: reduce){.cx-detail-panel{animation:none}}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxTabsComponent, selector: "cx-tabs", inputs: ["ariaLabel", "controlsId", "items", "selectedId", "transparent", "divided", "equalWidth"], outputs: ["selectedIdChange"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDetailPanelComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-detail-panel', imports: [
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxTabsComponent,
                        CxTooltipDirective,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<aside\n  #panelSurface\n  class=\"cx-detail-panel\"\n  [class.cx-detail-panel--closing]=\"closing$()\"\n  [class.cx-detail-panel--fixed]=\"isFixed\"\n  [attr.aria-labelledby]=\"normalizedHeading ? headingId : null\"\n  [attr.aria-label]=\"normalizedHeading ? null : 'Detail panel'\"\n  [attr.aria-hidden]=\"closing$() ? 'true' : null\"\n  [attr.inert]=\"closing$() ? '' : null\"\n  (animationend)=\"onDismissAnimationEnd($event)\"\n>\n  @if (resizable) {\n    <div\n      class=\"cx-detail-panel__resize-handle\"\n      [class.cx-detail-panel__resize-handle--active]=\"resizing$()\"\n      role=\"separator\"\n      tabindex=\"0\"\n      aria-orientation=\"vertical\"\n      [attr.aria-label]=\"resolvedResizeAriaLabel\"\n      [attr.aria-valuenow]=\"renderedWidthPx\"\n      [attr.aria-valuetext]=\"renderedWidthPx + ' pixels'\"\n      (pointerdown)=\"onResizePointerDown($event)\"\n      (pointermove)=\"onResizePointerMove($event)\"\n      (pointerup)=\"onResizePointerUp($event)\"\n      (pointercancel)=\"onResizePointerCancel($event)\"\n      (lostpointercapture)=\"onResizeLostPointerCapture($event)\"\n      (keydown)=\"onResizeKeydown($event)\"\n      (dblclick)=\"onResizeDoubleClick($event)\"\n    ></div>\n  }\n\n  <header class=\"cx-detail-panel__header\">\n    @if (icon || normalizedHeading) {\n      <div\n        class=\"cx-detail-panel__heading-group\"\n        [cxTooltip]=\"normalizedHeading\"\n        [cxTooltipOverflow]=\"true\"\n      >\n        @if (icon; as iconName) {\n          <cx-icon class=\"cx-detail-panel__heading-icon\" [icon]=\"iconName\" [size]=\"24\" [mood]=\"mood\" />\n        }\n        @if (normalizedHeading) {\n          <h2 class=\"cx-detail-panel__heading\" [id]=\"headingId\" data-cx-tooltip-overflow>{{ normalizedHeading }}</h2>\n        }\n      </div>\n    }\n\n    <div class=\"cx-detail-panel__header-actions\">\n      <ng-content select=\"cx-status-tag[detail-panel-status]\" />\n\n      @if (hasMenuItems) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          [items]=\"menuItems ?? []\"\n          [ariaLabel]=\"resolvedMenuAriaLabel\"\n          align=\"end\"\n          (itemSelect)=\"onMenuItemSelect($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            [ariaLabel]=\"resolvedMenuAriaLabel\"\n            variant=\"transparent\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </header>\n\n  @if (hasTabs) {\n    <cx-tabs\n      class=\"cx-detail-panel__tabs\"\n      [items]=\"tabs\"\n      [selectedId]=\"selectedTabId\"\n      [ariaLabel]=\"resolvedTabsAriaLabel\"\n      [controlsId]=\"tabPanelId\"\n      [transparent]=\"true\"\n      [divided]=\"false\"\n      (selectedIdChange)=\"onTabSelect($event)\"\n    />\n  }\n\n  <div\n    #contentViewport\n    class=\"cx-detail-panel__content-viewport\"\n    [attr.id]=\"hasTabs ? tabPanelId : null\"\n    [attr.role]=\"hasTabs ? 'tabpanel' : null\"\n    [attr.aria-labelledby]=\"hasTabs ? selectedTabButtonId : null\"\n    [attr.aria-label]=\"hasTabs && !selectedTabButtonId ? resolvedTabsAriaLabel : null\"\n    [attr.tabindex]=\"hasTabs ? '0' : null\"\n  >\n    <div class=\"cx-detail-panel__content\">\n      <ng-content />\n    </div>\n  </div>\n\n  @if (footer) {\n    <footer class=\"cx-detail-panel__footer\">\n      <div class=\"cx-detail-panel__footer-slot\">\n        <ng-content select=\"[detail-panel-footer]\" />\n      </div>\n\n      <cx-icon-button\n        class=\"cx-detail-panel__footer-close\"\n        icon=\"arrow-right\"\n        [ariaLabel]=\"resolvedCloseAriaLabel\"\n        mood=\"default\"\n        (pressed)=\"dismiss()\"\n      />\n    </footer>\n  }\n</aside>\n", styles: [":root{--breakpoint-mobile: 720px}:host{display:block;position:absolute;z-index:var(--z-index-detail);inset-block:0;inset-inline-end:0;width:var(--cx-detail-panel-width, min(450px, 100%));min-width:min(max(380px,var(--cx-detail-panel-min-width, 0px)),100%);max-width:100%;height:100%;min-height:0;color:var(--ink);pointer-events:auto}@media(min-width: 720px){:host(.cx-detail-panel-host--floating){height:calc(100% - var(--space-xs) - var(--space-xs));margin-block:var(--space-xs);margin-inline-end:var(--space-xs)}}.cx-detail-panel{--cx-detail-panel-frame-padding: var(--surface-separation);--cx-detail-panel-island-radius: var(--radius-lg);display:flex;position:relative;width:100%;height:100%;min-height:0;max-width:100%;flex-direction:column;overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-low);box-sizing:border-box;gap:var(--cx-detail-panel-frame-padding);padding:var(--cx-detail-panel-frame-padding);animation:cx-detail-panel-enter var(--motion-slow) var(--ease-out) both;will-change:transform}.cx-detail-panel--fixed{--cx-detail-panel-island-radius: var(--radius-md);border:0;border-radius:0;box-shadow:none}.cx-detail-panel--closing{pointer-events:none;animation:cx-detail-panel-exit var(--motion-slow) var(--ease-in) both}@media(max-width: 719px){:host{inset:0;width:100%;min-width:0}}.cx-detail-panel__resize-handle{position:absolute;top:0;inset-inline-start:0;z-index:1;width:12px;height:100%;cursor:col-resize;touch-action:none}.cx-detail-panel__resize-handle::after{position:absolute;top:50%;inset-inline-start:50%;width:3px;height:calc(100% - var(--cx-detail-panel-frame-padding)*2);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);content:\"\";transform:translate(-50%, -50%);transition:background-color var(--motion-fast) ease}.cx-detail-panel__resize-handle:hover::after,.cx-detail-panel__resize-handle:focus-visible::after,.cx-detail-panel__resize-handle--active::after{background:var(--info)}.cx-detail-panel__resize-handle:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}@media(max-width: 719px){.cx-detail-panel__resize-handle{display:none}}.cx-detail-panel__header{display:flex;min-height:var(--controller-size);min-width:0;flex:0 0 auto;align-items:center;justify-content:space-between;gap:var(--space-md);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--cx-detail-panel-island-radius);background:var(--surface);box-sizing:border-box}.cx-detail-panel__header:not(:has(.cx-detail-panel__heading-group,.cx-detail-panel__header-actions>*)){display:none}.cx-detail-panel__heading-group{display:flex;min-width:0;flex:1 1 auto;align-items:center;gap:var(--space-sm);color:var(--ink)}.cx-detail-panel__heading-icon{flex:0 0 auto;color:var(--ink)}.cx-detail-panel__heading{min-width:0;margin:0;overflow:hidden;color:var(--ink);font-size:var(--font-size-title-3);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);text-overflow:ellipsis;white-space:nowrap}.cx-detail-panel__header-actions,.cx-detail-panel__footer-slot{display:inline-flex;min-width:0;flex:0 0 auto;align-items:center;gap:var(--space-sm)}.cx-detail-panel__header-actions:empty,.cx-detail-panel__footer-slot:empty{display:none}.cx-detail-panel__tabs{min-width:0;flex:0 0 auto}.cx-detail-panel__content-viewport{min-width:0;min-height:0;flex:1 1 auto;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}.cx-detail-panel__content-viewport:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}.cx-detail-panel__content{display:flex;width:100%;max-width:100%;min-width:0;min-height:100%;flex-direction:column;gap:var(--cx-detail-panel-frame-padding);box-sizing:border-box}.cx-detail-panel__footer{display:flex;min-height:var(--controller-size);min-width:0;flex-shrink:0;align-items:center;justify-content:space-between;gap:var(--space-md);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--cx-detail-panel-island-radius);background:var(--surface);box-sizing:border-box}.cx-detail-panel__footer-slot{margin-inline-end:0}.cx-detail-panel__footer-close{flex:0 0 auto;margin-inline-start:auto}@keyframes cx-detail-panel-enter{from{transform:translateX(calc(100% + var(--space-xs)))}to{transform:translateX(0)}}@keyframes cx-detail-panel-exit{from{transform:translateX(0)}to{transform:translateX(calc(100% + var(--space-xs)))}}@media(prefers-reduced-motion: reduce){.cx-detail-panel{animation:none}}"] }]
        }], ctorParameters: () => [], propDecorators: { contentSections: [{
                type: ContentChildren,
                args: [CxDetailPanelSectionComponent, { read: ElementRef }]
            }], contentViewport: [{
                type: ViewChild,
                args: ['contentViewport', { read: ElementRef }]
            }], panelSurface: [{
                type: ViewChild,
                args: ['panelSurface', { read: ElementRef }]
            }], icon: [{
                type: Input
            }], mood: [{
                type: Input
            }], heading: [{
                type: Input
            }], variant: [{
                type: Input
            }], menuItems: [{
                type: Input
            }], menuAriaLabel: [{
                type: Input
            }], tabs: [{
                type: Input
            }], tabsAriaLabel: [{
                type: Input
            }], width: [{
                type: Input
            }], minWidth: [{
                type: Input
            }], resizable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], footer: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], dismissOnClickOutside: [{
                type: Input
            }], dismissed: [{
                type: Output
            }], dismissRequest: [{
                type: Output
            }], menuItemSelect: [{
                type: Output
            }], selectedTabIdChange: [{
                type: Output
            }], widthChange: [{
                type: Output
            }], selectedTabId: [{
                type: Input
            }], widthVar: [{
                type: HostBinding,
                args: ['style.--cx-detail-panel-width']
            }], minWidthVar: [{
                type: HostBinding,
                args: ['style.--cx-detail-panel-min-width']
            }], floatingHostClass: [{
                type: HostBinding,
                args: ['class.cx-detail-panel-host--floating']
            }], onDocumentMousedown: [{
                type: HostListener,
                args: ['document:mousedown', ['$event']]
            }] } });
function maximumAnimationTimeMs(style) {
    const durations = parseCssTimes(style.animationDuration);
    const delays = parseCssTimes(style.animationDelay);
    const count = Math.max(durations.length, delays.length);
    let longest = 0;
    for (let index = 0; index < count; index += 1) {
        longest = Math.max(longest, durations[index % durations.length] + delays[index % delays.length]);
    }
    return longest;
}
function parseCssTimes(value) {
    const times = value.split(',').map(part => {
        const normalized = part.trim();
        const numeric = Number.parseFloat(normalized);
        if (!Number.isFinite(numeric)) {
            return 0;
        }
        return normalized.endsWith('ms') ? numeric : numeric * 1000;
    });
    return times.length > 0 ? times : [0];
}
function validateDetailPanelMenuItems(value) {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error('[cx-detail-panel] menuItems must be an array.');
    }
    validateDetailPanelMenuLevel(value, 'menuItems', new Set());
    return [...value];
}
function validateDetailPanelMenuLevel(items, path, ids) {
    const labels = new Set();
    items.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const id = typeof item?.id === 'string' ? item.id.trim() : '';
        if (!id) {
            throw new Error(`[cx-detail-panel] ${itemPath} requires a non-empty id.`);
        }
        if (ids.has(id)) {
            throw new Error(`[cx-detail-panel] menu item id "${id}" must be unique.`);
        }
        ids.add(id);
        const label = typeof item?.label === 'string' ? item.label.trim() : '';
        const labelKey = label.toLowerCase();
        if (labels.has(labelKey)) {
            throw new Error(`[cx-detail-panel] menu item label "${label}" must be unique within ${path}.`);
        }
        labels.add(labelKey);
        if (item.items !== undefined) {
            if (!Array.isArray(item.items)) {
                throw new Error(`[cx-detail-panel] ${itemPath}.items must be an array.`);
            }
            validateDetailPanelMenuLevel(item.items, `${itemPath}.items`, ids);
        }
    });
}
function validateDetailPanelTabs(value) {
    if (!Array.isArray(value)) {
        throw new Error('[cx-detail-panel] tabs must be an array.');
    }
    const ids = new Set();
    const labels = new Set();
    value.forEach((tab, index) => {
        const id = typeof tab?.id === 'string' ? tab.id.trim() : '';
        if (!id) {
            throw new Error(`[cx-detail-panel] tab at index ${index} requires a non-empty id.`);
        }
        if (ids.has(id)) {
            throw new Error(`[cx-detail-panel] tab id "${id}" must be unique.`);
        }
        ids.add(id);
        const label = typeof tab?.label === 'string' ? tab.label.trim() : '';
        const labelKey = label.toLowerCase();
        if (labels.has(labelKey)) {
            throw new Error(`[cx-detail-panel] tab label "${label}" must be unique.`);
        }
        labels.add(labelKey);
    });
    return [...value];
}
