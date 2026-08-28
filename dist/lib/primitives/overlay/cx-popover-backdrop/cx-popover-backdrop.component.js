import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, NgZone, Output, inject, } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
export class CxPopoverBackdropComponent {
    document = inject(DOCUMENT);
    host = inject(ElementRef);
    ngZone = inject(NgZone);
    cleanupCallbacks = [];
    lastTouchY = null;
    pressed = new EventEmitter();
    ngOnInit() {
        if (typeof window === 'undefined' || !this.document) {
            return;
        }
        this.ngZone.runOutsideAngular(() => {
            const onWheel = (event) => {
                if (!this.isTopmostBackdrop()) {
                    return;
                }
                this.applyScrollDelta(event.target, event.deltaY);
                event.preventDefault();
            };
            const onTouchStart = (event) => {
                if (!this.isTopmostBackdrop()) {
                    return;
                }
                this.lastTouchY = event.touches[0]?.clientY ?? null;
            };
            const onTouchMove = (event) => {
                if (!this.isTopmostBackdrop()) {
                    return;
                }
                const nextTouchY = event.touches[0]?.clientY ?? this.lastTouchY;
                const deltaY = this.lastTouchY !== null && nextTouchY !== null ? this.lastTouchY - nextTouchY : 0;
                this.lastTouchY = nextTouchY;
                this.applyScrollDelta(event.target, deltaY);
                event.preventDefault();
            };
            const onTouchEnd = () => {
                this.lastTouchY = null;
            };
            this.document.addEventListener('wheel', onWheel, { capture: true, passive: false });
            this.document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
            this.document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
            this.document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
            this.document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });
            this.cleanupCallbacks.push(() => this.document.removeEventListener('wheel', onWheel, { capture: true }));
            this.cleanupCallbacks.push(() => this.document.removeEventListener('touchstart', onTouchStart, { capture: true }));
            this.cleanupCallbacks.push(() => this.document.removeEventListener('touchmove', onTouchMove, { capture: true }));
            this.cleanupCallbacks.push(() => this.document.removeEventListener('touchend', onTouchEnd, { capture: true }));
            this.cleanupCallbacks.push(() => this.document.removeEventListener('touchcancel', onTouchEnd, { capture: true }));
        });
    }
    ngOnDestroy() {
        for (const cleanup of this.cleanupCallbacks.splice(0)) {
            cleanup();
        }
    }
    onPointerDown(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    onClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.pressed.emit();
    }
    onWheel(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    onTouchMove(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    applyScrollDelta(target, deltaY) {
        if (deltaY === 0) {
            return;
        }
        const scrollContainer = this.resolveScrollContainer(target);
        if (!scrollContainer) {
            return;
        }
        const nextScrollTop = Math.min(Math.max(scrollContainer.scrollTop + deltaY, 0), Math.max(scrollContainer.scrollHeight - scrollContainer.clientHeight, 0));
        scrollContainer.scrollTop = nextScrollTop;
    }
    resolveScrollContainer(target) {
        const origin = target instanceof Element
            ? target
            : target instanceof Node
                ? target.parentElement
                : null;
        if (!origin) {
            return null;
        }
        const surface = origin.closest('[data-cx-popover-surface]');
        if (!surface) {
            return null;
        }
        return this.findScrollableAncestor(origin, surface) ?? this.findPreferredScrollContainer(surface);
    }
    findScrollableAncestor(origin, surface) {
        let current = origin;
        while (current) {
            if (current instanceof HTMLElement && this.isScrollable(current)) {
                return current;
            }
            if (current === surface) {
                break;
            }
            current = current.parentElement;
        }
        return null;
    }
    findPreferredScrollContainer(surface) {
        const explicitContainer = surface.querySelector('[data-cx-popover-scroll-container]');
        if (explicitContainer && this.isScrollable(explicitContainer)) {
            return explicitContainer;
        }
        return this.isScrollable(surface) ? surface : null;
    }
    isScrollable(element) {
        if (element.scrollHeight <= element.clientHeight + 1) {
            return false;
        }
        const overflowY = window.getComputedStyle(element).overflowY;
        return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    }
    isTopmostBackdrop() {
        const openBackdrops = this.document.querySelectorAll('cx-popover-backdrop');
        return openBackdrops.item(openBackdrops.length - 1) === this.host.nativeElement;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverBackdropComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxPopoverBackdropComponent, isStandalone: true, selector: "cx-popover-backdrop", outputs: { pressed: "pressed" }, ngImport: i0, template: `
    <div
      class="cx-popover-backdrop__surface"
      aria-hidden="true"
      (pointerdown)="onPointerDown($event)"
      (click)="onClick($event)"
      (wheel)="onWheel($event)"
      (touchmove)="onTouchMove($event)"
    ></div>
  `, isInline: true, styles: [":host{display:contents}.cx-popover-backdrop__surface{display:block;position:fixed;inset:0;z-index:var(--z-index-popover-backdrop);background:rgba(0,0,0,0);pointer-events:auto;touch-action:none;cursor:default}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverBackdropComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-popover-backdrop', template: `
    <div
      class="cx-popover-backdrop__surface"
      aria-hidden="true"
      (pointerdown)="onPointerDown($event)"
      (click)="onClick($event)"
      (wheel)="onWheel($event)"
      (touchmove)="onTouchMove($event)"
    ></div>
  `, changeDetection: ChangeDetectionStrategy.OnPush, styles: [":host{display:contents}.cx-popover-backdrop__surface{display:block;position:fixed;inset:0;z-index:var(--z-index-popover-backdrop);background:rgba(0,0,0,0);pointer-events:auto;touch-action:none;cursor:default}"] }]
        }], propDecorators: { pressed: [{
                type: Output
            }] } });
