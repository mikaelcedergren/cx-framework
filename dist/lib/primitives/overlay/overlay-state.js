import { InteractivityChecker } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Injector, afterEveryRender, afterNextRender, inject, signal, } from '@angular/core';
import { isHostVisible } from '../shared/host-visibility.js';
import * as i0 from "@angular/core";
export class CxOverlayStateService {
    static activationTargetMaxAgeMs = 1_000;
    document = inject(DOCUMENT);
    injector = inject(Injector);
    interactivityChecker = inject(InteractivityChecker);
    stack = [];
    focusAncestry = new WeakMap();
    stackVersion = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stackVersion" }] : /* istanbul ignore next */ []));
    nextId = 0;
    modalDepth = 0;
    previousBodyOverflow = '';
    activationTarget;
    managedLayerElements = new Set();
    originalLayerStyles = new WeakMap();
    clickListener = (event) => this.onDocumentClick(event);
    keydownListener = (event) => this.onDocumentKeydown(event);
    constructor() {
        this.document.addEventListener('click', this.clickListener, true);
        this.document.addEventListener('keydown', this.keydownListener, true);
        afterEveryRender(() => {
            if (this.stack.length > 0 || this.managedLayerElements.size > 0) {
                this.syncSurfaceLayers();
            }
        }, { injector: this.injector });
        inject(DestroyRef).onDestroy(() => {
            this.document.removeEventListener('click', this.clickListener, true);
            this.document.removeEventListener('keydown', this.keydownListener, true);
            this.restoreManagedLayerElements();
        });
    }
    capture(options = {}) {
        const kind = options.kind ?? 'modal';
        const restoreFocus = options.restoreFocus ?? kind === 'modal';
        const activeElement = this.document.activeElement;
        const activationTarget = restoreFocus ? this.recentActivationTarget() : undefined;
        const focusOrigin = restoreFocus
            ? activationTarget ?? (activeElement instanceof HTMLElement ? activeElement : undefined)
            : undefined;
        if (activationTarget) {
            this.activationTarget = undefined;
        }
        const handle = {
            id: ++this.nextId,
            kind,
            focusedElement: focusOrigin,
            restoreFocus,
            owner: options.owner,
            surface: options.surface,
            layerSurfaces: options.layerSurfaces,
            isActive: options.isActive ?? (() => true),
            onEscape: options.onEscape,
            released: false,
        };
        if (kind === 'modal' && this.modalDepth === 0) {
            this.previousBodyOverflow = this.document.body.style.overflow;
            this.document.body.style.overflow = 'hidden';
        }
        if (kind === 'modal') {
            this.modalDepth += 1;
        }
        this.stack.push(handle);
        this.focusAncestry.set(handle, this.captureFocusAncestry(focusOrigin));
        this.stackVersion.update(version => version + 1);
        return handle;
    }
    /** Attach or correct a capture's owner after the fact; input order between `open` and `owner` bindings is not guaranteed. */
    assignOwner(handle, owner) {
        if (!handle || handle.released || handle.owner === owner) {
            return;
        }
        handle.owner = owner;
        this.stackVersion.update(version => version + 1);
    }
    /**
     * True while an active overlay was opened by this element, by an element
     * inside it, or by an element it sits inside. Descriptions anchored to the
     * opener (tooltips) must stand down for as long as this holds.
     */
    ownsOpenOverlay(element) {
        this.stackVersion();
        return this.stack.some(handle => !handle.released &&
            handle.isActive() &&
            !!handle.owner &&
            (handle.owner === element || handle.owner.contains(element) || element.contains(handle.owner)));
    }
    /** Release a capture and restore its valid invoker, or owning-parent fallback, after teardown settles. */
    release(handle) {
        if (!handle || handle.released) {
            return;
        }
        const wasTop = this.topmostActiveHandle() === handle;
        handle.released = true;
        const index = this.stack.indexOf(handle);
        if (index >= 0) {
            this.stack.splice(index, 1);
        }
        this.stackVersion.update(version => version + 1);
        if (handle.kind === 'modal') {
            this.modalDepth = Math.max(0, this.modalDepth - 1);
        }
        if (handle.kind === 'modal' && this.modalDepth === 0) {
            this.document.body.style.overflow = this.previousBodyOverflow;
            this.previousBodyOverflow = '';
        }
        if (wasTop && handle.restoreFocus) {
            const exposedTop = this.topmostActiveHandle();
            const exposedParent = exposedTop && this.isFocusParent(handle, exposedTop)
                ? exposedTop
                : undefined;
            this.restoreFocusAfterRender(handle, exposedParent, exposedTop);
        }
        else {
            this.focusAncestry.delete(handle);
        }
    }
    isTopmost(handle) {
        return !!handle && !handle.released && this.topmostActiveHandle() === handle;
    }
    onDocumentKeydown(event) {
        if (event.key !== 'Escape'
            || event.isComposing
            || event.altKey
            || event.ctrlKey
            || event.metaKey
            || event.shiftKey) {
            return;
        }
        const owner = this.topmostActiveHandle();
        if (!owner) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        owner.onEscape?.(event);
    }
    onDocumentClick(event) {
        const activationTarget = event.composedPath().find(target => target instanceof HTMLElement
            && target !== this.document.body
            && target !== this.document.documentElement
            && isHostVisible(target)
            && this.interactivityChecker.isFocusable(target));
        if (!(activationTarget instanceof HTMLElement)) {
            return;
        }
        const captured = { element: activationTarget, capturedAt: Date.now() };
        this.activationTarget = captured;
        afterNextRender(() => {
            if (this.activationTarget === captured) {
                this.activationTarget = undefined;
            }
        }, { injector: this.injector });
    }
    recentActivationTarget() {
        const captured = this.activationTarget;
        if (!captured) {
            return undefined;
        }
        if (Date.now() - captured.capturedAt > CxOverlayStateService.activationTargetMaxAgeMs
            || !captured.element.isConnected
            || !isHostVisible(captured.element)
            || !this.interactivityChecker.isFocusable(captured.element)) {
            this.activationTarget = undefined;
            return undefined;
        }
        return captured.element;
    }
    captureFocusAncestry(origin) {
        const ancestry = [];
        let ancestor = origin?.parentElement;
        while (ancestor) {
            ancestry.push(ancestor);
            ancestor = ancestor.parentElement;
        }
        return ancestry;
    }
    restoreFocusAfterRender(releasedHandle, exposedParent, exposedTop) {
        let completed = false;
        let restoreScheduled = false;
        const restore = () => {
            if (completed) {
                return;
            }
            completed = true;
            try {
                if (exposedParent) {
                    if (!this.isTopmost(exposedParent)) {
                        return;
                    }
                }
                else {
                    const currentTop = this.topmostActiveHandle();
                    if (currentTop?.kind === 'modal'
                        || (currentTop && currentTop !== exposedTop)) {
                        return;
                    }
                }
                const invoker = releasedHandle.focusedElement;
                const parentSurface = exposedParent ? this.surfaceFor(exposedParent) : undefined;
                if (this.tryFocus(invoker && (!parentSurface || parentSurface.contains(invoker)) ? invoker : undefined)) {
                    return;
                }
                this.tryFocus(this.resolveFallbackTarget(releasedHandle, exposedParent), true);
            }
            finally {
                this.focusAncestry.delete(releasedHandle);
            }
        };
        const scheduleFinalRestore = () => {
            if (completed || restoreScheduled) {
                return;
            }
            restoreScheduled = true;
            const finalize = () => {
                restoreScheduled = false;
                restore();
            };
            if (typeof MutationObserver === 'undefined') {
                queueMicrotask(finalize);
                return;
            }
            // Existing parent focus observers receive the teardown mutation first.
            // A detached marker gives this coordinator a final observer turn, then a
            // microtask after the complete observer batch makes restoration decisive.
            const marker = this.document.createTextNode('pending');
            const observer = new MutationObserver(() => {
                observer.disconnect();
                queueMicrotask(finalize);
            });
            observer.observe(marker, { characterData: true });
            marker.data = 'ready';
        };
        // Focus maintenance owned by the surviving surface (CDK traps, mutation
        // observers, and step rendering) also settles after render. Enter one final
        // microtask from that boundary so the exact invoker remains the final target.
        afterNextRender(scheduleFinalRestore, { injector: this.injector });
        // A conditionally rendered overlay may release from its destroy hook,
        // after Angular's callback window for that render has already passed.
        // Once its surface is gone, enter the same final scheduling lane even when
        // no later render is scheduled.
        queueMicrotask(() => {
            const releasedSurface = this.surfaceFor(releasedHandle);
            if (!releasedSurface || !releasedSurface.isConnected || !isHostVisible(releasedSurface)) {
                scheduleFinalRestore();
            }
        });
    }
    isFocusParent(releasedHandle, candidate) {
        const candidateSurface = this.surfaceFor(candidate);
        if (!candidateSurface) {
            return false;
        }
        const origin = releasedHandle.focusedElement;
        if (origin && candidateSurface.contains(origin)) {
            return true;
        }
        return (this.focusAncestry.get(releasedHandle) ?? []).some(ancestor => ancestor === candidateSurface || candidateSurface.contains(ancestor));
    }
    resolveFallbackTarget(handle, exposedParent) {
        if (exposedParent) {
            const parentTarget = this.resolveSurfaceFocusTarget(this.surfaceFor(exposedParent));
            if (parentTarget) {
                return parentTarget;
            }
            return this.visibleModalFocusTarget();
        }
        for (const ancestor of this.focusAncestry.get(handle) ?? []) {
            if (ancestor === this.document.body
                || ancestor === this.document.documentElement
                || !isHostVisible(ancestor)) {
                continue;
            }
            const modal = ancestor.closest('[aria-modal="true"]');
            if (modal && isHostVisible(modal)) {
                return this.resolveSurfaceFocusTarget(modal);
            }
            return ancestor.querySelector('h1, h2, h3, h4, h5, h6') ?? ancestor;
        }
        const visibleModalTarget = this.visibleModalFocusTarget();
        if (visibleModalTarget) {
            return visibleModalTarget;
        }
        return this.document.querySelector('main h1, main h2, [role="main"] h1, [role="main"] h2')
            ?? undefined;
    }
    resolveSurfaceFocusTarget(surface) {
        if (!surface || !isHostVisible(surface)) {
            return undefined;
        }
        const focusSurface = surface.matches('[aria-modal="true"], [role="dialog"], [role="alertdialog"]')
            ? surface
            : Array.from(surface.querySelectorAll('[aria-modal="true"], [role="dialog"], [role="alertdialog"]'))
                .find(candidate => isHostVisible(candidate)) ?? surface;
        const labelledByIds = (focusSurface.getAttribute('aria-labelledby') ?? '')
            .split(/\s+/)
            .filter(Boolean);
        for (const id of labelledByIds) {
            const label = this.document.getElementById(id);
            if (label instanceof HTMLElement && focusSurface.contains(label) && isHostVisible(label)) {
                return label;
            }
        }
        return focusSurface.querySelector('h1, h2, h3, h4, h5, h6') ?? focusSurface;
    }
    visibleModalFocusTarget() {
        const visibleModals = Array.from(this.document.querySelectorAll('[aria-modal="true"]'))
            .filter(modal => isHostVisible(modal));
        return this.resolveSurfaceFocusTarget(visibleModals.at(-1));
    }
    syncSurfaceLayers() {
        const entries = this.stack.flatMap((handle, stackIndex) => {
            const layerSurfaces = this.layerSurfacesFor(handle);
            const containmentSurface = this.surfaceFor(handle) ?? layerSurfaces.at(-1);
            return layerSurfaces.length > 0 && containmentSurface
                ? [{ containmentSurface, layerSurfaces, rank: stackIndex + 1 }]
                : [];
        });
        const slotStride = Math.max(2, ...entries.map(entry => entry.layerSurfaces.length + 1));
        const effectiveRanks = entries.map(entry => entry.rank);
        // A child overlay cannot escape an ancestor's stacking context. Lift the
        // ancestor to the newest contained overlay's rank so an intervening body
        // sibling cannot paint above the logically topmost child.
        entries.forEach((ancestor, ancestorIndex) => {
            for (let descendantIndex = ancestorIndex + 1; descendantIndex < entries.length; descendantIndex += 1) {
                const descendant = entries[descendantIndex];
                if (descendant
                    && ancestor.containmentSurface !== descendant.containmentSurface
                    && ancestor.containmentSurface.contains(descendant.containmentSurface)) {
                    effectiveRanks[ancestorIndex] = Math.max(effectiveRanks[ancestorIndex] ?? ancestor.rank, descendant.rank);
                }
            }
        });
        const assignments = new Map();
        entries.forEach((entry, entryIndex) => {
            const rank = effectiveRanks[entryIndex] ?? entry.rank;
            entry.layerSurfaces.forEach((element, surfaceIndex) => {
                const offset = rank * slotStride + surfaceIndex;
                assignments.set(element, Math.max(assignments.get(element) ?? 0, offset));
            });
        });
        const nextManagedElements = new Set(assignments.keys());
        for (const element of this.managedLayerElements) {
            if (!nextManagedElements.has(element)) {
                this.restoreManagedLayerElement(element);
            }
        }
        for (const [element, offset] of assignments) {
            if (!this.originalLayerStyles.has(element)) {
                this.originalLayerStyles.set(element, {
                    value: element.style.getPropertyValue('z-index'),
                    priority: element.style.getPropertyPriority('z-index'),
                });
            }
            element.style.setProperty('z-index', `calc(var(--z-index-dialog) + ${offset})`);
        }
        this.managedLayerElements.clear();
        for (const element of nextManagedElements) {
            this.managedLayerElements.add(element);
        }
    }
    layerSurfacesFor(handle) {
        try {
            const candidates = handle.layerSurfaces?.() ?? [handle.surface?.()];
            return candidates.filter((candidate, index) => candidate instanceof HTMLElement && candidates.indexOf(candidate) === index);
        }
        catch {
            return [];
        }
    }
    restoreManagedLayerElements() {
        for (const element of this.managedLayerElements) {
            this.restoreManagedLayerElement(element);
        }
        this.managedLayerElements.clear();
    }
    restoreManagedLayerElement(element) {
        const original = this.originalLayerStyles.get(element);
        if (!original) {
            return;
        }
        if (original.value) {
            element.style.setProperty('z-index', original.value, original.priority);
        }
        else {
            element.style.removeProperty('z-index');
        }
        this.originalLayerStyles.delete(element);
    }
    surfaceFor(handle) {
        try {
            return handle.surface?.();
        }
        catch {
            return undefined;
        }
    }
    tryFocus(target, allowTemporaryTabIndex = false) {
        if (!target
            || target === this.document.body
            || target === this.document.documentElement
            || !isHostVisible(target)
            || target.closest('[aria-hidden="true"], [hidden], [inert]')) {
            return false;
        }
        const alreadyFocusable = this.interactivityChecker.isFocusable(target);
        if (!alreadyFocusable && !allowTemporaryTabIndex) {
            return false;
        }
        const previousTabIndex = target.getAttribute('tabindex');
        if (!alreadyFocusable) {
            target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
        if (!alreadyFocusable) {
            if (previousTabIndex === null) {
                target.removeAttribute('tabindex');
            }
            else {
                target.setAttribute('tabindex', previousTabIndex);
            }
        }
        return this.document.activeElement === target;
    }
    topmostActiveHandle() {
        for (let index = this.stack.length - 1; index >= 0; index -= 1) {
            const handle = this.stack[index];
            if (handle && !handle.released && handle.isActive()) {
                return handle;
            }
        }
        return undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxOverlayStateService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxOverlayStateService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxOverlayStateService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });
