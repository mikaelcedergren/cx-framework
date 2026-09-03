import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, Input, Output, ViewChild, afterRenderEffect, inject, signal, } from '@angular/core';
import { CxOptionGroupComponent } from '../cx-option-group/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { CxPopoverBackdropComponent } from '../cx-popover-backdrop/cx-popover-backdrop.component.js';
import { CxOverlayStateService } from '../overlay-state.js';
import * as i0 from "@angular/core";
export class CxPopoverComponent {
    document = inject(DOCUMENT);
    overlayState = inject(CxOverlayStateService);
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    showBackdropState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showBackdropState" }] : /* istanbul ignore next */ []));
    overlayHandle;
    portaledSurface = null;
    portaledBackdrop = null;
    surfaceRef;
    contentRef;
    backdropRef;
    constructor() {
        const destroyRef = inject(DestroyRef);
        afterRenderEffect(() => {
            const body = this.document?.body;
            if (!body)
                return;
            const showBackdrop = this.showBackdropState();
            if (!this.openState()) {
                this.releasePortaledNodes();
                return;
            }
            // Order matters: backdrop must come BEFORE surface in the body so the
            // surface paints on top in every engine. Chromium honours the z-index
            // (popover 1110 > backdrop 1100) regardless of DOM order, but WebKit
            // hit-tests the later-painted sibling and swallows clicks on options.
            const backdrop = showBackdrop ? this.backdropRef?.nativeElement ?? null : null;
            this.portaledBackdrop = this.syncPortaledNode(this.portaledBackdrop, backdrop, body);
            const surface = this.surfaceRef?.nativeElement ?? null;
            this.portaledSurface = this.syncPortaledNode(this.portaledSurface, surface, body);
        });
        destroyRef.onDestroy(() => {
            this.prepareFocusRestoration();
            this.releaseOverlayOwnership();
            this.releasePortaledNodes();
        });
    }
    releasePortaledNodes() {
        this.portaledSurface?.remove();
        this.portaledBackdrop?.remove();
        this.portaledSurface = null;
        this.portaledBackdrop = null;
    }
    syncPortaledNode(currentNode, nextNode, body) {
        if (currentNode && currentNode !== nextNode) {
            currentNode.remove();
        }
        if (nextNode && nextNode.parentNode !== body) {
            // Moving a node drops focus held inside it. Consumers may have focused
            // surface content (e.g. a search field) before this pass runs, so
            // restore that focus after the move.
            const activeElement = this.document.activeElement;
            const focusWasInside = activeElement instanceof HTMLElement && nextNode.contains(activeElement);
            body.appendChild(nextNode);
            if (focusWasInside) {
                activeElement.focus();
            }
        }
        return nextNode;
    }
    set open(value) {
        const nextOpen = !!value;
        if (this.openState() === nextOpen) {
            if (!nextOpen) {
                this.releasePortaledNodes();
            }
            return;
        }
        if (nextOpen) {
            this.openState.set(true);
            this.captureOverlayOwnership();
        }
        else {
            // Release while this visible surface still owns the stack, then remove
            // the click-catching body nodes before the following Angular render.
            this.prepareFocusRestoration();
            this.releaseOverlayOwnership();
            this.openState.set(false);
            this.releasePortaledNodes();
        }
    }
    get open() {
        return this.openState();
    }
    set showBackdrop(value) {
        this.showBackdropState.set(!!value);
    }
    get showBackdrop() {
        return this.showBackdropState();
    }
    /** The element that opened this popover. Registered with the overlay state so tooltips anchored to the opener stand down while it owns the surface. */
    set owner(value) {
        this.ownerElement = value;
        this.overlayState.assignOwner(this.overlayHandle, value);
    }
    get owner() {
        return this.ownerElement;
    }
    ownerElement;
    surfaceId;
    role;
    ariaLabel;
    heading;
    left;
    top;
    bottom;
    /** Exact surface width for fixed layouts (calendars, fixed menus). Otherwise the content decides. */
    width;
    /** Width floor — anchored surfaces pass the trigger width so the popover never reads narrower than it. */
    minWidth;
    /** Raises or lowers the compact content cap. Always viewport-clamped. */
    maxWidth;
    maxHeight;
    /** Which side of its anchor the surface sits on — drives the entry animation's origin. */
    placement;
    surfaceVariant = 'default';
    backdropPressed = new EventEmitter();
    surfaceElement() {
        return this.surfaceRef?.nativeElement;
    }
    get resolvedMaxHeight() {
        if (typeof this.maxHeight === 'number' && Number.isFinite(this.maxHeight)) {
            return `min(${Math.max(Math.floor(this.maxHeight), 0)}px, calc(100dvh - (var(--space-md) * 2)))`;
        }
        return 'calc(100dvh - (var(--space-md) * 2))';
    }
    get resolvedMaxWidth() {
        if (typeof this.maxWidth === 'number' && Number.isFinite(this.maxWidth)) {
            return `min(${Math.max(Math.floor(this.maxWidth), 0)}px, calc(100vw - (var(--space-md) * 2)))`;
        }
        if (typeof this.width === 'number' && Number.isFinite(this.width)) {
            // Explicit width wins over the compact content cap; only the viewport clamps it.
            return 'calc(100vw - (var(--space-md) * 2))';
        }
        return null;
    }
    get normalizedTitle() {
        const next = this.heading?.trim();
        return next ? next : undefined;
    }
    captureOverlayOwnership() {
        if (this.overlayHandle) {
            return;
        }
        this.overlayHandle = this.overlayState.capture({
            kind: 'transient',
            restoreFocus: true,
            owner: this.ownerElement,
            surface: () => this.surfaceRef?.nativeElement,
            layerSurfaces: () => {
                const backdropSurface = this.backdropRef?.nativeElement.querySelector('.cx-popover-backdrop__surface');
                return [backdropSurface, this.surfaceRef?.nativeElement].filter((surface) => !!surface);
            },
            isActive: () => this.openState() && isHostVisible(this.surfaceRef?.nativeElement),
            onEscape: () => this.backdropPressed.emit(),
        });
    }
    releaseOverlayOwnership() {
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    prepareFocusRestoration() {
        const activeElement = this.document.activeElement;
        const surface = this.surfaceRef?.nativeElement;
        if (!this.overlayHandle) {
            return;
        }
        this.overlayHandle.restoreFocus = activeElement === this.document.body
            || activeElement === this.document.documentElement
            || (activeElement instanceof HTMLElement && !!surface && surface.contains(activeElement));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxPopoverComponent, isStandalone: true, selector: "cx-popover", inputs: { open: "open", showBackdrop: "showBackdrop", owner: "owner", surfaceId: "surfaceId", role: "role", ariaLabel: "ariaLabel", heading: "heading", left: "left", top: "top", bottom: "bottom", width: "width", minWidth: "minWidth", maxWidth: "maxWidth", maxHeight: "maxHeight", placement: "placement", surfaceVariant: "surfaceVariant" }, outputs: { backdropPressed: "backdropPressed" }, viewQueries: [{ propertyName: "surfaceRef", first: true, predicate: ["surface"], descendants: true, read: ElementRef }, { propertyName: "contentRef", first: true, predicate: ["content"], descendants: true, read: ElementRef }, { propertyName: "backdropRef", first: true, predicate: ["backdrop"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (open) {\n  @if (showBackdrop) {\n    <cx-popover-backdrop #backdrop (pressed)=\"backdropPressed.emit()\" />\n  }\n\n  <div\n    #surface\n    class=\"cx-popover\"\n    data-cx-popover-surface\n    [class.cx-popover--top]=\"placement === 'top'\"\n    [class.cx-popover--bottom]=\"placement === 'bottom'\"\n    [class.cx-popover--left]=\"placement === 'left'\"\n    [class.cx-popover--right]=\"placement === 'right'\"\n    [class.cx-popover--raised]=\"surfaceVariant === 'raised'\"\n    [class.cx-popover--grouped]=\"surfaceVariant === 'grouped'\"\n    [attr.id]=\"surfaceId || null\"\n    [attr.role]=\"role || null\"\n    [attr.aria-label]=\"ariaLabel || null\"\n    [style.width.px]=\"width\"\n    [style.min-width.px]=\"minWidth\"\n    [style.max-width]=\"resolvedMaxWidth\"\n    [style.max-height]=\"resolvedMaxHeight\"\n    [style.left.px]=\"left\"\n    [style.top.px]=\"top\"\n    [style.bottom.px]=\"bottom\"\n  >\n    <div class=\"cx-popover__body\" data-cx-popover-scroll-container>\n      @if (surfaceVariant === 'grouped' && normalizedTitle) {\n        <div class=\"cx-popover__island cx-popover__island--heading\">\n          <ng-container [ngTemplateOutlet]=\"headingRow\" />\n        </div>\n      }\n\n      <div #content class=\"cx-popover__content\" [class.cx-popover__island]=\"surfaceVariant !== 'grouped'\">\n        @if (surfaceVariant !== 'grouped' && normalizedTitle) {\n          <ng-container [ngTemplateOutlet]=\"headingRow\" />\n        }\n\n        <ng-content />\n      </div>\n    </div>\n  </div>\n}\n\n<!--\n  One heading row for both surface variants, so the projected actions have a\n  single destination. Two <ng-content> elements with the same selector would\n  fill only the first, leaving the other variant's heading empty.\n-->\n<ng-template #headingRow>\n  <cx-option-group class=\"cx-popover__heading\" [label]=\"normalizedTitle ?? ''\" variant=\"heading\">\n    <!--\n      ngProjectAs is required. A forwarded <ng-content> carries no attributes\n      of its own, so without it the content matches none of cx-option-group's\n      slots and is silently dropped.\n    -->\n    <ng-content select=\"[actions]\" ngProjectAs=\"[actions]\" />\n  </cx-option-group>\n</ng-template>\n", styles: [":host{display:contents}.cx-popover{--cx-popover-inner-radius: calc(var(--radius-xl) - var(--surface-separation));position:fixed;z-index:var(--z-index-popover);display:flex;width:max-content;min-width:0;max-width:min(320px,100vw - var(--space-md)*2);min-height:0;flex-direction:column;box-sizing:border-box;border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);overflow:hidden;overscroll-behavior:contain;box-shadow:var(--shadow-mid);padding:var(--surface-separation);animation:cx-popover-enter var(--motion-base) var(--ease-out)}.cx-popover--top{transform-origin:bottom center}.cx-popover--bottom{transform-origin:top center}.cx-popover--left{transform-origin:right center}.cx-popover--right{transform-origin:left center}.cx-popover--raised{background:var(--surface-alt)}.cx-popover__body{display:flex;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow-x:hidden;overflow-y:hidden;border-radius:var(--cx-popover-inner-radius);background:var(--surface-alt);padding:0;overscroll-behavior:contain}.cx-popover--grouped .cx-popover__body{overflow-y:auto}.cx-popover__content{display:contents}.cx-popover__island{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow-x:hidden;overflow-y:auto;border-radius:var(--cx-popover-inner-radius);background:var(--surface);overscroll-behavior:contain}.cx-popover__heading,.cx-popover__island--heading{flex:0 0 auto}.cx-popover__island--heading{background:rgba(0,0,0,0);margin-bottom:var(--surface-separation)}@keyframes cx-popover-enter{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion: reduce){.cx-popover{animation:none}}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxOptionGroupComponent, selector: "cx-option-group", inputs: ["label", "description", "variant"] }, { kind: "component", type: CxPopoverBackdropComponent, selector: "cx-popover-backdrop", outputs: ["pressed"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-popover', imports: [NgTemplateOutlet, CxOptionGroupComponent, CxPopoverBackdropComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (open) {\n  @if (showBackdrop) {\n    <cx-popover-backdrop #backdrop (pressed)=\"backdropPressed.emit()\" />\n  }\n\n  <div\n    #surface\n    class=\"cx-popover\"\n    data-cx-popover-surface\n    [class.cx-popover--top]=\"placement === 'top'\"\n    [class.cx-popover--bottom]=\"placement === 'bottom'\"\n    [class.cx-popover--left]=\"placement === 'left'\"\n    [class.cx-popover--right]=\"placement === 'right'\"\n    [class.cx-popover--raised]=\"surfaceVariant === 'raised'\"\n    [class.cx-popover--grouped]=\"surfaceVariant === 'grouped'\"\n    [attr.id]=\"surfaceId || null\"\n    [attr.role]=\"role || null\"\n    [attr.aria-label]=\"ariaLabel || null\"\n    [style.width.px]=\"width\"\n    [style.min-width.px]=\"minWidth\"\n    [style.max-width]=\"resolvedMaxWidth\"\n    [style.max-height]=\"resolvedMaxHeight\"\n    [style.left.px]=\"left\"\n    [style.top.px]=\"top\"\n    [style.bottom.px]=\"bottom\"\n  >\n    <div class=\"cx-popover__body\" data-cx-popover-scroll-container>\n      @if (surfaceVariant === 'grouped' && normalizedTitle) {\n        <div class=\"cx-popover__island cx-popover__island--heading\">\n          <ng-container [ngTemplateOutlet]=\"headingRow\" />\n        </div>\n      }\n\n      <div #content class=\"cx-popover__content\" [class.cx-popover__island]=\"surfaceVariant !== 'grouped'\">\n        @if (surfaceVariant !== 'grouped' && normalizedTitle) {\n          <ng-container [ngTemplateOutlet]=\"headingRow\" />\n        }\n\n        <ng-content />\n      </div>\n    </div>\n  </div>\n}\n\n<!--\n  One heading row for both surface variants, so the projected actions have a\n  single destination. Two <ng-content> elements with the same selector would\n  fill only the first, leaving the other variant's heading empty.\n-->\n<ng-template #headingRow>\n  <cx-option-group class=\"cx-popover__heading\" [label]=\"normalizedTitle ?? ''\" variant=\"heading\">\n    <!--\n      ngProjectAs is required. A forwarded <ng-content> carries no attributes\n      of its own, so without it the content matches none of cx-option-group's\n      slots and is silently dropped.\n    -->\n    <ng-content select=\"[actions]\" ngProjectAs=\"[actions]\" />\n  </cx-option-group>\n</ng-template>\n", styles: [":host{display:contents}.cx-popover{--cx-popover-inner-radius: calc(var(--radius-xl) - var(--surface-separation));position:fixed;z-index:var(--z-index-popover);display:flex;width:max-content;min-width:0;max-width:min(320px,100vw - var(--space-md)*2);min-height:0;flex-direction:column;box-sizing:border-box;border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);overflow:hidden;overscroll-behavior:contain;box-shadow:var(--shadow-mid);padding:var(--surface-separation);animation:cx-popover-enter var(--motion-base) var(--ease-out)}.cx-popover--top{transform-origin:bottom center}.cx-popover--bottom{transform-origin:top center}.cx-popover--left{transform-origin:right center}.cx-popover--right{transform-origin:left center}.cx-popover--raised{background:var(--surface-alt)}.cx-popover__body{display:flex;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow-x:hidden;overflow-y:hidden;border-radius:var(--cx-popover-inner-radius);background:var(--surface-alt);padding:0;overscroll-behavior:contain}.cx-popover--grouped .cx-popover__body{overflow-y:auto}.cx-popover__content{display:contents}.cx-popover__island{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow-x:hidden;overflow-y:auto;border-radius:var(--cx-popover-inner-radius);background:var(--surface);overscroll-behavior:contain}.cx-popover__heading,.cx-popover__island--heading{flex:0 0 auto}.cx-popover__island--heading{background:rgba(0,0,0,0);margin-bottom:var(--surface-separation)}@keyframes cx-popover-enter{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion: reduce){.cx-popover{animation:none}}"] }]
        }], ctorParameters: () => [], propDecorators: { surfaceRef: [{
                type: ViewChild,
                args: ['surface', { read: ElementRef }]
            }], contentRef: [{
                type: ViewChild,
                args: ['content', { read: ElementRef }]
            }], backdropRef: [{
                type: ViewChild,
                args: ['backdrop', { read: ElementRef }]
            }], open: [{
                type: Input
            }], showBackdrop: [{
                type: Input
            }], owner: [{
                type: Input
            }], surfaceId: [{
                type: Input
            }], role: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], heading: [{
                type: Input
            }], left: [{
                type: Input
            }], top: [{
                type: Input
            }], bottom: [{
                type: Input
            }], width: [{
                type: Input
            }], minWidth: [{
                type: Input
            }], maxWidth: [{
                type: Input
            }], maxHeight: [{
                type: Input
            }], placement: [{
                type: Input
            }], surfaceVariant: [{
                type: Input
            }], backdropPressed: [{
                type: Output
            }] } });
