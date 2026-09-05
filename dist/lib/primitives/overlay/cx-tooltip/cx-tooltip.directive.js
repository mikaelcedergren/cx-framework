import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, HostListener, Injectable, PLATFORM_ID, ViewContainerRef, booleanAttribute, effect, inject, input, signal, } from '@angular/core';
import { Overlay, } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CxOverlayStateService } from '../overlay-state.js';
import { CxTooltipSurfaceComponent } from './cx-tooltip-surface.component.js';
import * as i0 from "@angular/core";
let cxTooltipId = 0;
const CX_TOOLTIP_DEFAULT_DELAY_MS = 500;
const CX_TOOLTIP_CLOSE_GRACE_MS = 120;
const CX_TOOLTIP_OVERFLOW_ATTRIBUTE = 'data-cx-tooltip-overflow';
const CX_TOOLTIP_OVERFLOW_TARGET = `[${CX_TOOLTIP_OVERFLOW_ATTRIBUTE}]`;
const CX_TOOLTIP_OVERFLOW_TEXT_ATTRIBUTE = 'data-cx-tooltip-text';
// State hook, not a treatment: it marks the targets this trigger measured as
// clipped, so the disclosure is inspectable and testable. Clipped text gets its
// ellipsis from the component's own `text-overflow`, which the browser draws
// only while the text really does not fit — never from this class.
const CX_TOOLTIP_OVERFLOW_CLIPPED_CLASS = 'cx-overflow-clipped';
const CX_TOOLTIP_FOCUS_OWNER = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    'audio[controls]',
    'video[controls]',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');
/**
 * Shares one resize observer and one document mutation observer across every
 * overflow-aware tooltip. This keeps large tables bounded while still
 * rechecking text, visibility, direction, and layout changes.
 */
class CxTooltipOverflowObserver {
    document = inject(DOCUMENT);
    registrations = new Map();
    resizeObserver;
    mutationObserver;
    measurementFrame;
    observe(element, callback) {
        let callbacks = this.registrations.get(element);
        if (!callbacks) {
            callbacks = new Set();
            this.registrations.set(element, callbacks);
            this.ensureObservers();
            this.resizeObserver?.observe(element);
        }
        callbacks.add(callback);
        this.scheduleMeasurements();
        let active = true;
        return () => {
            if (!active) {
                return;
            }
            active = false;
            const registeredCallbacks = this.registrations.get(element);
            registeredCallbacks?.delete(callback);
            if (registeredCallbacks?.size) {
                return;
            }
            this.registrations.delete(element);
            this.resizeObserver?.unobserve(element);
            if (this.registrations.size === 0) {
                this.disconnectObservers();
            }
        };
    }
    ensureObservers() {
        const view = this.document.defaultView;
        if (!view) {
            return;
        }
        if (!this.resizeObserver && typeof view.ResizeObserver !== 'undefined') {
            this.resizeObserver = new view.ResizeObserver(() => this.scheduleMeasurements());
        }
        if (!this.mutationObserver && typeof view.MutationObserver !== 'undefined') {
            this.mutationObserver = new view.MutationObserver(() => this.scheduleMeasurements());
            this.mutationObserver.observe(this.document.documentElement, {
                subtree: true,
                childList: true,
                characterData: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'style',
                    'hidden',
                    'dir',
                    CX_TOOLTIP_OVERFLOW_ATTRIBUTE,
                    CX_TOOLTIP_OVERFLOW_TEXT_ATTRIBUTE,
                ],
            });
        }
    }
    scheduleMeasurements() {
        const view = this.document.defaultView;
        if (!view ||
            typeof view.requestAnimationFrame !== 'function' ||
            this.measurementFrame !== undefined) {
            return;
        }
        this.measurementFrame = view.requestAnimationFrame(() => {
            this.measurementFrame = undefined;
            const callbacks = new Set([...this.registrations.values()].flatMap(registration => [...registration]));
            for (const callback of callbacks) {
                callback();
            }
        });
    }
    disconnectObservers() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.mutationObserver?.disconnect();
        this.mutationObserver = undefined;
        const view = this.document.defaultView;
        if (view &&
            typeof view.cancelAnimationFrame === 'function' &&
            this.measurementFrame !== undefined) {
            view.cancelAnimationFrame(this.measurementFrame);
        }
        this.measurementFrame = undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipOverflowObserver, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipOverflowObserver, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipOverflowObserver, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
/**
 * Owns document-level interaction needed only by active tooltips. One set of
 * keyboard/pointer listeners serves every open or pending trigger, and one
 * mutation observer keeps active aria-describedby relationships merged with
 * consumer updates.
 */
class CxTooltipInteractionCoordinator {
    document = inject(DOCUMENT);
    escapeCallbacks = new Set();
    pointerRegistrations = new Set();
    descriptionCallbacks = new Map();
    descriptionObserver;
    onDocumentKeydown = (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        for (const callback of [...this.escapeCallbacks]) {
            callback();
        }
    };
    onDocumentPointerMove = (event) => {
        for (const registration of [...this.pointerRegistrations]) {
            registration.move(event.clientX, event.clientY);
        }
    };
    onDocumentPointerDown = () => {
        for (const registration of [...this.pointerRegistrations]) {
            registration.down();
        }
    };
    registerEscape(callback) {
        if (this.escapeCallbacks.size === 0) {
            this.document.addEventListener('keydown', this.onDocumentKeydown);
        }
        this.escapeCallbacks.add(callback);
        let active = true;
        return () => {
            if (!active) {
                return;
            }
            active = false;
            this.escapeCallbacks.delete(callback);
            if (this.escapeCallbacks.size === 0) {
                this.document.removeEventListener('keydown', this.onDocumentKeydown);
            }
        };
    }
    registerPointer(registration) {
        if (this.pointerRegistrations.size === 0) {
            this.document.addEventListener('pointermove', this.onDocumentPointerMove, { passive: true });
            this.document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
        }
        this.pointerRegistrations.add(registration);
        let active = true;
        return () => {
            if (!active) {
                return;
            }
            active = false;
            this.pointerRegistrations.delete(registration);
            if (this.pointerRegistrations.size === 0) {
                this.document.removeEventListener('pointermove', this.onDocumentPointerMove);
                this.document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
            }
        };
    }
    observeDescription(element, callback) {
        let callbacks = this.descriptionCallbacks.get(element);
        if (!callbacks) {
            callbacks = new Set();
            this.descriptionCallbacks.set(element, callbacks);
            this.ensureDescriptionObserver();
        }
        callbacks.add(callback);
        let active = true;
        return () => {
            if (!active) {
                return;
            }
            active = false;
            const registeredCallbacks = this.descriptionCallbacks.get(element);
            registeredCallbacks?.delete(callback);
            if (registeredCallbacks?.size) {
                return;
            }
            this.descriptionCallbacks.delete(element);
            if (this.descriptionCallbacks.size === 0) {
                this.descriptionObserver?.disconnect();
                this.descriptionObserver = undefined;
            }
        };
    }
    ensureDescriptionObserver() {
        const view = this.document.defaultView;
        if (this.descriptionObserver || !view || typeof view.MutationObserver === 'undefined') {
            return;
        }
        this.descriptionObserver = new view.MutationObserver(records => {
            for (const record of records) {
                if (!(record.target instanceof HTMLElement)) {
                    continue;
                }
                const callbacks = this.descriptionCallbacks.get(record.target);
                if (!callbacks) {
                    continue;
                }
                for (const callback of [...callbacks]) {
                    callback();
                }
            }
        });
        this.descriptionObserver.observe(this.document.documentElement, {
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-describedby'],
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipInteractionCoordinator, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipInteractionCoordinator, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipInteractionCoordinator, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
/**
 * Framework tooltip trigger. Attach it directly to the one element being
 * described; `cx-tooltip` remains available when composition needs a wrapper.
 */
export class CxTooltipDirective {
    cxTooltip = input(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "cxTooltip" }] : /* istanbul ignore next */ []));
    cxTooltipPosition = input('top', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "cxTooltipPosition" }] : /* istanbul ignore next */ []));
    cxTooltipDelay = input('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "cxTooltipDelay" }] : /* istanbul ignore next */ []));
    cxTooltipDisabled = input(false, { ...(ngDevMode ? { debugName: "cxTooltipDisabled" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    cxTooltipOverflow = input(false, { ...(ngDevMode ? { debugName: "cxTooltipOverflow" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    host = inject(ElementRef).nativeElement;
    overlay = inject(Overlay);
    viewContainerRef = inject(ViewContainerRef);
    overflowObserver = inject(CxTooltipOverflowObserver);
    interactionCoordinator = inject(CxTooltipInteractionCoordinator);
    overlayState = inject(CxOverlayStateService);
    browser = isPlatformBrowser(inject(PLATFORM_ID));
    viewReady = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewReady" }] : /* istanbul ignore next */ []));
    tooltipId = `cx-tooltip-${++cxTooltipId}`;
    triggerHovered = false;
    triggerFocused = false;
    surfaceHovered = false;
    dismissed = false;
    open = false;
    openTimer;
    closeTimer;
    overflowTargets = [];
    clippedOverflowTargets = new Set();
    hoveredOverflowTarget;
    stopOverflowObservations = [];
    overflowMeasurementCallback = () => this.syncOverflowMeasurement();
    stopEscapeHandling;
    escapeCallback = () => this.onEscapeKey();
    stopPointerHandling;
    pointerRegistration = {
        move: (clientX, clientY) => this.onDocumentPointerMove(clientX, clientY),
        down: () => this.onDocumentPointerDown(),
    };
    descriptionTarget;
    stopDescriptionObservation;
    descriptionMutationCallback = () => this.mergeDescription();
    overlayRef;
    positionStrategy;
    surfaceRef;
    positionSubscription;
    constructor() {
        effect(() => {
            const ready = this.viewReady();
            const overflow = this.cxTooltipOverflow();
            if (!ready) {
                return;
            }
            this.configureOverflow(overflow);
        });
        effect(() => {
            const ready = this.viewReady();
            const baseText = this.messageText();
            const disabled = this.cxTooltipDisabled();
            const overflow = this.cxTooltipOverflow();
            const delay = this.cxTooltipDelay();
            const position = this.cxTooltipPosition();
            if (!ready) {
                return;
            }
            const text = overflow ? this.effectiveMessageText() : baseText;
            if (disabled || !text) {
                this.closeNow();
                return;
            }
            if (this.open) {
                this.syncOpenSurface(position);
                return;
            }
            this.clearOpenTimer();
            if (this.triggerFocused) {
                this.openNow();
            }
            else if (this.triggerHovered) {
                this.requestOpen(delay);
            }
        });
        effect(() => {
            // Read the overlay state first, unconditionally: `open` is a plain
            // boolean, and an effect that short-circuits before its only signal
            // read never registers the dependency and never re-runs.
            const ownerOpenedOverlay = this.overlayState.ownsOpenOverlay(this.host);
            if (ownerOpenedOverlay && this.open) {
                this.closeNow();
            }
        });
    }
    ngAfterViewInit() {
        if (!this.browser) {
            return;
        }
        this.viewReady.set(true);
    }
    ngOnDestroy() {
        this.clearOverflowObservations();
        this.closeNow();
        this.stopEscapeHandling?.();
        this.stopEscapeHandling = undefined;
        this.stopPointerHandling?.();
        this.stopPointerHandling = undefined;
    }
    onTriggerMouseEnter() {
        this.triggerHovered = true;
        this.clearCloseTimer();
        if (this.cxTooltipOverflow()) {
            this.syncOverflowMeasurement(false);
        }
        this.requestOpen(this.cxTooltipDelay());
    }
    onTriggerMouseOver(event) {
        if (!this.cxTooltipOverflow()) {
            return;
        }
        const nextTarget = this.resolveHoveredOverflowTarget(event.target);
        if (nextTarget === this.hoveredOverflowTarget) {
            return;
        }
        this.hoveredOverflowTarget = nextTarget;
        this.clearOpenTimer();
        if (this.triggerFocused) {
            if (this.open) {
                this.syncOpenSurface(this.cxTooltipPosition());
            }
            return;
        }
        if (!nextTarget || !this.clippedOverflowTargets.has(nextTarget)) {
            this.scheduleOverflowTargetClose();
            return;
        }
        if (this.open) {
            this.syncOpenSurface(this.cxTooltipPosition());
        }
        else {
            this.requestOpen(this.cxTooltipDelay());
        }
    }
    onTriggerMouseLeave() {
        this.triggerHovered = false;
        this.clearDismissalWhenIdle();
        if (!this.open) {
            this.hoveredOverflowTarget = undefined;
        }
        this.scheduleClose();
    }
    onTriggerFocusIn(event) {
        if (this.host.matches(CX_TOOLTIP_FOCUS_OWNER) && event.target !== this.host) {
            // Focus belongs to an independent nested action (for example a field's
            // Clear button), not to the host trigger described by this tooltip.
            return;
        }
        if (!this.isKeyboardFocus(event.target)) {
            // Pointer-driven focus must not raise or pin the tooltip: the pointer
            // user already had hover, and click focus regularly precedes the trigger
            // opening its own overlay. Only keyboard focus describes.
            return;
        }
        this.triggerFocused = true;
        this.clearCloseTimer();
        if (this.cxTooltipOverflow()) {
            this.syncOverflowMeasurement(false);
        }
        if (this.open) {
            this.setDescriptionTarget(this.resolveDescriptionTarget(event.target));
            this.syncOpenSurface(this.cxTooltipPosition());
            return;
        }
        this.openNow(event.target);
    }
    onTriggerFocusOut(event) {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.host.contains(nextTarget)) {
            if (event.target === this.host && nextTarget !== this.host) {
                this.triggerFocused = false;
                this.clearDismissalWhenIdle();
                this.scheduleClose();
            }
            return;
        }
        this.triggerFocused = false;
        this.clearDismissalWhenIdle();
        this.scheduleClose();
    }
    isKeyboardFocus(target) {
        if (!(target instanceof Element)) {
            return false;
        }
        try {
            return target.matches(':focus-visible');
        }
        catch {
            // An engine without :focus-visible keeps the older show-on-any-focus behavior.
            return true;
        }
    }
    onEscapeKey() {
        if (!this.open && this.openTimer === undefined) {
            return;
        }
        this.dismissed = true;
        this.clearOpenTimer();
        this.closeNow();
    }
    onDocumentPointerMove(clientX, clientY) {
        if (!this.open) {
            return;
        }
        const hovered = this.pointerWithinTooltip(clientX, clientY);
        if (hovered === this.surfaceHovered) {
            return;
        }
        this.surfaceHovered = hovered;
        if (hovered) {
            this.clearCloseTimer();
        }
        else {
            this.scheduleClose();
        }
    }
    onDocumentPointerDown() {
        if (!this.open && this.openTimer === undefined) {
            return;
        }
        this.dismissed = true;
        this.surfaceHovered = false;
        this.closeNow();
    }
    requestOpen(delay) {
        if (!this.canOpen() || this.open) {
            return;
        }
        if (this.triggerFocused || delay === 'none') {
            this.openNow();
            return;
        }
        if (!this.triggerHovered || this.openTimer !== undefined) {
            return;
        }
        const view = this.host.ownerDocument.defaultView;
        if (!view) {
            return;
        }
        this.startInteractionHandling();
        this.openTimer = view.setTimeout(() => {
            this.openTimer = undefined;
            if (this.triggerHovered) {
                this.openNow();
            }
            else {
                this.stopInteractionHandlingIfIdle();
            }
        }, CX_TOOLTIP_DEFAULT_DELAY_MS);
    }
    openNow(eventTarget) {
        this.clearOpenTimer();
        this.clearCloseTimer();
        if (!this.canOpen()) {
            return;
        }
        const descriptionTarget = this.resolveDescriptionTarget(eventTarget);
        const overlayRef = this.ensureOverlay();
        if (!overlayRef.hasAttached()) {
            this.surfaceRef = overlayRef.attach(new ComponentPortal(CxTooltipSurfaceComponent, this.viewContainerRef));
        }
        // CDK enables pane hit-testing during attach; restore this component's
        // pointer-inert contract after that lifecycle step.
        overlayRef.overlayElement.style.pointerEvents = 'none';
        this.open = true;
        this.startInteractionHandling();
        this.syncOpenSurface(this.cxTooltipPosition());
        this.setDescriptionTarget(descriptionTarget);
    }
    ensureOverlay() {
        if (this.overlayRef) {
            return this.overlayRef;
        }
        const origin = this.tooltipOrigin();
        this.positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(origin)
            .withPositions(this.positions(this.cxTooltipPosition()))
            .withPush(true)
            .withViewportMargin(8)
            .withFlexibleDimensions(false);
        this.positionSubscription = this.positionStrategy.positionChanges.subscribe(event => {
            this.surfaceRef?.setInput('placement', this.resolvePlacement(event.connectionPair));
        });
        this.overlayRef = this.overlay.create({
            positionStrategy: this.positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
        });
        // The CDK pane is the actual hit-test box. Keep both it and the child
        // surface inert; document-level geometry preserves hover without ever
        // swallowing the action already targeted underneath the tooltip.
        this.overlayRef.overlayElement.style.pointerEvents = 'none';
        return this.overlayRef;
    }
    syncOpenSurface(position) {
        this.positionStrategy?.setOrigin(this.tooltipOrigin());
        this.positionStrategy?.withPositions(this.positions(position));
        this.surfaceRef?.setInput('tooltipId', this.tooltipId);
        this.surfaceRef?.setInput('text', this.effectiveMessageText());
        this.surfaceRef?.setInput('placement', position);
        this.surfaceRef?.changeDetectorRef.detectChanges();
        this.overlayRef?.updatePosition();
    }
    /**
     * Pointer-inert tooltips still have to remain available while the pointer
     * crosses the placement gap or rests over the visible surface. The bridge is
     * only the narrow axis-aligned space between origin and surface, not a broad
     * invisible hover layer that could pin the tooltip over unrelated content.
     */
    pointerWithinTooltip(clientX, clientY) {
        const surfaceHost = this.surfaceRef?.location.nativeElement;
        const surface = surfaceHost?.querySelector('.cx-tooltip__surface');
        const origin = this.tooltipOrigin();
        if (!surface?.isConnected || !origin.isConnected) {
            return false;
        }
        const surfaceRect = surface.getBoundingClientRect();
        if (pointInRect(clientX, clientY, surfaceRect)) {
            return true;
        }
        const originRect = origin.getBoundingClientRect();
        const slop = 4;
        if (surfaceRect.bottom <= originRect.top) {
            return clientY >= surfaceRect.bottom - slop
                && clientY <= originRect.top + slop
                && clientX >= Math.min(surfaceRect.left, originRect.left) - slop
                && clientX <= Math.max(surfaceRect.right, originRect.right) + slop;
        }
        if (surfaceRect.top >= originRect.bottom) {
            return clientY >= originRect.bottom - slop
                && clientY <= surfaceRect.top + slop
                && clientX >= Math.min(surfaceRect.left, originRect.left) - slop
                && clientX <= Math.max(surfaceRect.right, originRect.right) + slop;
        }
        if (surfaceRect.right <= originRect.left) {
            return clientX >= surfaceRect.right - slop
                && clientX <= originRect.left + slop
                && clientY >= Math.min(surfaceRect.top, originRect.top) - slop
                && clientY <= Math.max(surfaceRect.bottom, originRect.bottom) + slop;
        }
        if (surfaceRect.left >= originRect.right) {
            return clientX >= originRect.right - slop
                && clientX <= surfaceRect.left + slop
                && clientY >= Math.min(surfaceRect.top, originRect.top) - slop
                && clientY <= Math.max(surfaceRect.bottom, originRect.bottom) + slop;
        }
        return false;
    }
    scheduleClose() {
        this.clearOpenTimer();
        if (this.triggerHovered || this.triggerFocused || this.surfaceHovered) {
            return;
        }
        if (!this.open) {
            return;
        }
        const view = this.host.ownerDocument.defaultView;
        if (!view || this.closeTimer !== undefined) {
            return;
        }
        this.closeTimer = view.setTimeout(() => {
            this.closeTimer = undefined;
            if (!this.triggerHovered && !this.triggerFocused && !this.surfaceHovered) {
                this.closeNow();
            }
        }, CX_TOOLTIP_CLOSE_GRACE_MS);
    }
    scheduleOverflowTargetClose() {
        this.clearOpenTimer();
        if (!this.open || this.triggerFocused || this.surfaceHovered) {
            return;
        }
        const view = this.host.ownerDocument.defaultView;
        if (!view || this.closeTimer !== undefined) {
            return;
        }
        this.closeTimer = view.setTimeout(() => {
            this.closeTimer = undefined;
            if (!this.triggerFocused && !this.surfaceHovered && !this.overflowAllowsOpen()) {
                this.closeNow();
            }
        }, CX_TOOLTIP_CLOSE_GRACE_MS);
    }
    closeNow() {
        this.clearOpenTimer();
        this.clearCloseTimer();
        this.surfaceHovered = false;
        this.clearDismissalWhenIdle();
        this.removeDescription();
        if (!this.open) {
            this.releaseOverlay();
            this.stopInteractionHandlingIfIdle();
            if (!this.triggerHovered) {
                this.hoveredOverflowTarget = undefined;
            }
            return;
        }
        this.open = false;
        this.releaseOverlay();
        this.stopInteractionHandlingIfIdle();
        if (!this.triggerHovered) {
            this.hoveredOverflowTarget = undefined;
        }
    }
    canOpen() {
        return (!this.cxTooltipDisabled() &&
            !!this.effectiveMessageText() &&
            !this.dismissed &&
            !this.overlayState.ownsOpenOverlay(this.host) &&
            this.overflowAllowsOpen() &&
            (this.triggerHovered || this.triggerFocused || this.surfaceHovered));
    }
    clearDismissalWhenIdle() {
        if (!this.triggerHovered && !this.triggerFocused && !this.surfaceHovered) {
            this.dismissed = false;
        }
    }
    configureOverflow(enabled) {
        if (!enabled) {
            this.clearOverflowObservations();
            if (this.cxTooltipDisabled() || !this.messageText()) {
                this.closeNow();
            }
            else if (this.open) {
                this.syncOpenSurface(this.cxTooltipPosition());
            }
            else if (this.triggerFocused) {
                this.openNow();
            }
            else if (this.triggerHovered) {
                this.requestOpen(this.cxTooltipDelay());
            }
            return;
        }
        this.syncOverflowMeasurement();
    }
    syncOverflowMeasurement(reconcile = true) {
        if (!this.browser) {
            return;
        }
        const nextTargets = this.resolveOverflowTargets();
        const targetsChanged = !this.sameTargets(nextTargets, this.overflowTargets);
        if (targetsChanged) {
            const previousHoveredTarget = this.hoveredOverflowTarget;
            this.clearOverflowObservations();
            this.overflowTargets = nextTargets;
            this.stopOverflowObservations = nextTargets.map(target => this.overflowObserver.observe(target, this.overflowMeasurementCallback));
            this.hoveredOverflowTarget =
                previousHoveredTarget && nextTargets.includes(previousHoveredTarget)
                    ? previousHoveredTarget
                    : undefined;
        }
        const nextClippedTargets = new Set();
        for (const target of nextTargets) {
            const clipped = this.isClipped(target);
            if (clipped) {
                nextClippedTargets.add(target);
            }
            // classList only mutates the attribute on a real change, so the shared
            // mutation observer settles instead of re-triggering itself.
            target.classList.toggle(CX_TOOLTIP_OVERFLOW_CLIPPED_CLASS, clipped);
        }
        this.clippedOverflowTargets = nextClippedTargets;
        if (!this.overflowAllowsOpen() || !this.effectiveMessageText()) {
            this.closeNow();
            return;
        }
        if (this.open) {
            this.syncOpenSurface(this.cxTooltipPosition());
        }
        else if (reconcile) {
            this.requestOpen(this.cxTooltipDelay());
        }
    }
    resolveOverflowTargets() {
        const targets = [...this.host.querySelectorAll(CX_TOOLTIP_OVERFLOW_TARGET)];
        return targets.length ? targets : [this.host];
    }
    resolveHoveredOverflowTarget(eventTarget) {
        if (this.overflowTargets.length === 1 && this.overflowTargets[0] === this.host) {
            return this.host;
        }
        if (!(eventTarget instanceof Element)) {
            return undefined;
        }
        const target = eventTarget.closest(CX_TOOLTIP_OVERFLOW_TARGET);
        return target && this.overflowTargets.includes(target) ? target : undefined;
    }
    overflowAllowsOpen() {
        if (!this.cxTooltipOverflow()) {
            return true;
        }
        if (this.triggerFocused) {
            return this.clippedOverflowTargets.size > 0;
        }
        if (this.hoveredOverflowTarget) {
            return this.clippedOverflowTargets.has(this.hoveredOverflowTarget);
        }
        return false;
    }
    tooltipOrigin() {
        if (!this.cxTooltipOverflow() || this.triggerFocused) {
            return this.host;
        }
        return this.hoveredOverflowTarget && this.clippedOverflowTargets.has(this.hoveredOverflowTarget)
            ? this.hoveredOverflowTarget
            : this.host;
    }
    effectiveMessageText() {
        if (!this.cxTooltipOverflow()) {
            return this.messageText();
        }
        if (!this.triggerFocused &&
            this.hoveredOverflowTarget &&
            this.clippedOverflowTargets.has(this.hoveredOverflowTarget)) {
            return this.overflowTargetText(this.hoveredOverflowTarget);
        }
        const messages = [...this.clippedOverflowTargets]
            .map(target => this.overflowTargetText(target))
            .filter((message, index, allMessages) => !!message && allMessages.indexOf(message) === index);
        return messages.length ? messages.join(' · ') : this.messageText();
    }
    overflowTargetText(target) {
        const explicitText = target.getAttribute(CX_TOOLTIP_OVERFLOW_TEXT_ATTRIBUTE)?.trim();
        if (explicitText) {
            return explicitText;
        }
        const targetText = target.textContent?.replace(/\s+/g, ' ').trim();
        return target === this.host
            ? this.messageText() || targetText || ''
            : targetText || this.messageText();
    }
    clearOverflowObservations() {
        for (const stopObserving of this.stopOverflowObservations) {
            stopObserving();
        }
        for (const target of this.overflowTargets) {
            target.classList.remove(CX_TOOLTIP_OVERFLOW_CLIPPED_CLASS);
        }
        this.stopOverflowObservations = [];
        this.overflowTargets = [];
        this.clippedOverflowTargets.clear();
        this.hoveredOverflowTarget = undefined;
    }
    sameTargets(left, right) {
        return left.length === right.length && left.every((target, index) => target === right[index]);
    }
    isClipped(target) {
        if (!target.isConnected || target.getClientRects().length === 0) {
            return false;
        }
        const view = target.ownerDocument.defaultView;
        if (!view) {
            return false;
        }
        const style = view.getComputedStyle(target);
        const clipsInline = style.overflowX === 'hidden' || style.overflowX === 'clip';
        const clipsBlock = style.overflowY === 'hidden' || style.overflowY === 'clip';
        const inlineClipped = clipsInline && target.scrollWidth > target.clientWidth + 1;
        const blockClipped = clipsBlock && target.scrollHeight > target.clientHeight + this.blockTolerance(style);
        return inlineClipped || blockClipped;
    }
    /**
     * How much block overflow to forgive before calling the text clipped.
     *
     * A line box only as tall as the font size — `line-height: 1` — is shorter
     * than the glyphs the face actually draws, so a single fully visible line
     * reports a couple of pixels of block overflow on its own. That is the font's
     * own leading, not hidden text. Real block clipping hides at least part of a
     * line, so half a line is the honest place to draw the boundary.
     */
    blockTolerance(style) {
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) || 0;
        return Math.max(1, lineHeight / 2);
    }
    resolveDescriptionTarget(eventTarget) {
        // A focusable host unequivocally owns the tooltip applied to it. Composite
        // fields may contain independent clear/reveal actions; those descendants
        // keep their own names without making the field tooltip ambiguous.
        if (this.host.matches(CX_TOOLTIP_FOCUS_OWNER)) {
            return this.host;
        }
        const focusOwners = [...this.host.querySelectorAll(CX_TOOLTIP_FOCUS_OWNER)];
        if (focusOwners.length > 1) {
            throw new Error('cxTooltip can describe only one focusable trigger. ' +
                'Attach cxTooltip directly to each native trigger instead of wrapping multiple controls.');
        }
        if (eventTarget instanceof HTMLElement &&
            this.host.contains(eventTarget) &&
            eventTarget.matches(CX_TOOLTIP_FOCUS_OWNER)) {
            return eventTarget;
        }
        return focusOwners[0] ?? this.host;
    }
    setDescriptionTarget(target) {
        if (target !== this.descriptionTarget) {
            this.removeDescription();
            this.descriptionTarget = target;
            this.mergeDescription();
            this.stopDescriptionObservation = this.interactionCoordinator.observeDescription(target, this.descriptionMutationCallback);
            return;
        }
        this.mergeDescription();
    }
    mergeDescription() {
        const target = this.descriptionTarget;
        if (!target) {
            return;
        }
        const descriptions = new Set(this.descriptionTokens(target));
        descriptions.add(this.tooltipId);
        const nextValue = [...descriptions].join(' ');
        if (target.getAttribute('aria-describedby') !== nextValue) {
            target.setAttribute('aria-describedby', nextValue);
        }
    }
    removeDescription() {
        this.stopDescriptionObservation?.();
        this.stopDescriptionObservation = undefined;
        const target = this.descriptionTarget;
        this.descriptionTarget = undefined;
        if (!target) {
            return;
        }
        const descriptions = this.descriptionTokens(target).filter(token => token !== this.tooltipId);
        if (descriptions.length) {
            target.setAttribute('aria-describedby', descriptions.join(' '));
        }
        else {
            target.removeAttribute('aria-describedby');
        }
    }
    descriptionTokens(target) {
        return (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    }
    positions(preferred) {
        const positions = {
            top: {
                originX: 'center',
                originY: 'top',
                overlayX: 'center',
                overlayY: 'bottom',
                offsetY: -8,
            },
            bottom: {
                originX: 'center',
                originY: 'bottom',
                overlayX: 'center',
                overlayY: 'top',
                offsetY: 8,
            },
            right: {
                originX: 'end',
                originY: 'center',
                overlayX: 'start',
                overlayY: 'center',
                offsetX: 8,
            },
            left: {
                originX: 'start',
                originY: 'center',
                overlayX: 'end',
                overlayY: 'center',
                offsetX: -8,
            },
        };
        return [
            positions[preferred],
            ...Object.entries(positions)
                .filter(([position]) => position !== preferred)
                .map(([, position]) => position),
        ];
    }
    resolvePlacement(position) {
        if (position.originY === 'top' && position.overlayY === 'bottom') {
            return 'top';
        }
        if (position.originY === 'bottom' && position.overlayY === 'top') {
            return 'bottom';
        }
        if (position.originX === 'start' && position.overlayX === 'end') {
            return 'left';
        }
        return 'right';
    }
    clearOpenTimer() {
        const view = this.host.ownerDocument.defaultView;
        if (view && this.openTimer !== undefined) {
            view.clearTimeout(this.openTimer);
        }
        this.openTimer = undefined;
        this.stopInteractionHandlingIfIdle();
    }
    clearCloseTimer() {
        const view = this.host.ownerDocument.defaultView;
        if (view && this.closeTimer !== undefined) {
            view.clearTimeout(this.closeTimer);
        }
        this.closeTimer = undefined;
    }
    startInteractionHandling() {
        this.stopEscapeHandling ??= this.interactionCoordinator.registerEscape(this.escapeCallback);
        this.stopPointerHandling ??= this.interactionCoordinator.registerPointer(this.pointerRegistration);
    }
    stopInteractionHandlingIfIdle() {
        if (this.open || this.openTimer !== undefined) {
            return;
        }
        this.stopEscapeHandling?.();
        this.stopEscapeHandling = undefined;
        this.stopPointerHandling?.();
        this.stopPointerHandling = undefined;
    }
    releaseOverlay() {
        this.positionSubscription?.unsubscribe();
        this.positionSubscription = undefined;
        this.overlayRef?.dispose();
        this.overlayRef = undefined;
        this.positionStrategy = undefined;
        this.surfaceRef = undefined;
    }
    messageText() {
        return this.cxTooltip()?.trim() ?? '';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "22.0.8", type: CxTooltipDirective, isStandalone: true, selector: "[cxTooltip]", inputs: { cxTooltip: { classPropertyName: "cxTooltip", publicName: "cxTooltip", isSignal: true, isRequired: false, transformFunction: null }, cxTooltipPosition: { classPropertyName: "cxTooltipPosition", publicName: "cxTooltipPosition", isSignal: true, isRequired: false, transformFunction: null }, cxTooltipDelay: { classPropertyName: "cxTooltipDelay", publicName: "cxTooltipDelay", isSignal: true, isRequired: false, transformFunction: null }, cxTooltipDisabled: { classPropertyName: "cxTooltipDisabled", publicName: "cxTooltipDisabled", isSignal: true, isRequired: false, transformFunction: null }, cxTooltipOverflow: { classPropertyName: "cxTooltipOverflow", publicName: "cxTooltipOverflow", isSignal: true, isRequired: false, transformFunction: null } }, host: { listeners: { "mouseenter": "onTriggerMouseEnter()", "mouseover": "onTriggerMouseOver($event)", "mouseleave": "onTriggerMouseLeave()", "focusin": "onTriggerFocusIn($event)", "focusout": "onTriggerFocusOut($event)" } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cxTooltip]',
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { cxTooltip: [{ type: i0.Input, args: [{ isSignal: true, alias: "cxTooltip", required: false }] }], cxTooltipPosition: [{ type: i0.Input, args: [{ isSignal: true, alias: "cxTooltipPosition", required: false }] }], cxTooltipDelay: [{ type: i0.Input, args: [{ isSignal: true, alias: "cxTooltipDelay", required: false }] }], cxTooltipDisabled: [{ type: i0.Input, args: [{ isSignal: true, alias: "cxTooltipDisabled", required: false }] }], cxTooltipOverflow: [{ type: i0.Input, args: [{ isSignal: true, alias: "cxTooltipOverflow", required: false }] }], onTriggerMouseEnter: [{
                type: HostListener,
                args: ['mouseenter']
            }], onTriggerMouseOver: [{
                type: HostListener,
                args: ['mouseover', ['$event']]
            }], onTriggerMouseLeave: [{
                type: HostListener,
                args: ['mouseleave']
            }], onTriggerFocusIn: [{
                type: HostListener,
                args: ['focusin', ['$event']]
            }], onTriggerFocusOut: [{
                type: HostListener,
                args: ['focusout', ['$event']]
            }] } });
function pointInRect(clientX, clientY, rect) {
    return clientX >= rect.left
        && clientX <= rect.right
        && clientY >= rect.top
        && clientY <= rect.bottom;
}
