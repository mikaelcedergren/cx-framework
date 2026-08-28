import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, signal, } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { CxDismissRequest } from '../dismiss-request.js';
import { CxOverlayStateService } from '../overlay-state.js';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
export class CxFullscreenDialogComponent {
    static motionDurationMs = 480;
    // The close button starts its pop-in before the canvas finishes settling so
    // both read as one continuous motion instead of two sequential ones.
    static closeButtonRevealMs = 180;
    overlayState = inject(CxOverlayStateService);
    renderedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedState" }] : /* istanbul ignore next */ []));
    closingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "closingState" }] : /* istanbul ignore next */ []));
    closeButtonReadyState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "closeButtonReadyState" }] : /* istanbul ignore next */ []));
    requestedOpen = false;
    closeButtonRevealed = false;
    closeButtonValue = true;
    overlayHandle;
    closeButtonRevealTimer;
    exitFallbackTimer;
    dialogRootRef;
    dialogContentRef;
    ariaLabel = 'Fullscreen dialog';
    set closeButton(value) {
        this.closeButtonValue = value !== false;
        this.closeButtonReadyState.set(this.closeButtonValue && this.closeButtonRevealed && !this.closingState());
    }
    get closeButton() {
        return this.closeButtonValue;
    }
    set open(value) {
        this.syncOpen(Boolean(value));
    }
    openChange = new EventEmitter();
    /** Synchronous request emitted before a user dismissal would close this dialog. */
    dismissRequest = new EventEmitter();
    dismiss = new EventEmitter();
    isRendered$ = this.renderedState.asReadonly();
    isClosing$ = this.closingState.asReadonly();
    isCloseButtonReady$ = this.closeButtonReadyState.asReadonly();
    ngOnDestroy() {
        this.clearMotionTimers();
        this.releaseOverlay();
    }
    resolvedAriaLabel() {
        return this.ariaLabel.trim() || 'Fullscreen dialog';
    }
    onDismiss() {
        if (!this.closeButton || this.closingState()) {
            return;
        }
        const request = new CxDismissRequest('dismiss');
        this.dismissRequest.emit(request);
        if (request.defaultPrevented) {
            return;
        }
        this.dismiss.emit();
        this.closeFromUser();
    }
    onCanvasAnimationEnd(event) {
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.animationName === 'cx-fullscreen-dialog-enter' && this.requestedOpen && !this.closingState()) {
            this.revealCloseButton();
            return;
        }
        if (event.animationName === 'cx-fullscreen-dialog-exit' && this.closingState()) {
            this.finishClose();
        }
    }
    dialogTabIndex() {
        return this.closeButton && this.closeButtonReadyState() ? -1 : 0;
    }
    closeFromUser() {
        this.syncOpen(false);
        this.openChange.emit(false);
    }
    syncOpen(nextOpen) {
        if (this.requestedOpen === nextOpen) {
            return;
        }
        this.requestedOpen = nextOpen;
        if (nextOpen) {
            this.clearMotionTimers();
            if (!this.overlayHandle) {
                this.overlayHandle = this.overlayState.capture({
                    surface: () => this.dialogRootRef?.nativeElement,
                    isActive: () => this.renderedState() && isHostVisible(this.dialogRootRef?.nativeElement),
                    onEscape: () => this.onDismiss(),
                });
            }
            this.closeButtonRevealed = this.prefersReducedMotion();
            this.closingState.set(false);
            this.closeButtonReadyState.set(this.closeButton && this.closeButtonRevealed);
            this.renderedState.set(true);
            if (!this.closeButtonRevealed) {
                this.scheduleCloseButtonReveal();
            }
            return;
        }
        if (!this.renderedState()) {
            this.finishClose();
            return;
        }
        this.closeButtonRevealed = false;
        this.clearCloseButtonReveal();
        this.dialogRootRef?.nativeElement.focus({ preventScroll: true });
        this.closeButtonReadyState.set(false);
        if (this.prefersReducedMotion()) {
            this.finishClose();
            return;
        }
        this.closingState.set(true);
        this.scheduleExitFallback();
    }
    revealCloseButton() {
        if (!this.requestedOpen || this.closingState()) {
            return;
        }
        this.clearCloseButtonReveal();
        this.closeButtonRevealed = true;
        this.closeButtonReadyState.set(this.closeButton);
    }
    finishClose() {
        if (this.requestedOpen) {
            return;
        }
        this.clearMotionTimers();
        this.releaseOverlay();
        this.renderedState.set(false);
        this.closingState.set(false);
        this.closeButtonReadyState.set(false);
    }
    prefersReducedMotion() {
        return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    scheduleCloseButtonReveal() {
        this.clearCloseButtonReveal();
        if (typeof window === 'undefined') {
            this.revealCloseButton();
            return;
        }
        this.closeButtonRevealTimer = window.setTimeout(() => this.revealCloseButton(), CxFullscreenDialogComponent.closeButtonRevealMs);
    }
    scheduleExitFallback() {
        this.clearExitFallback();
        if (typeof window === 'undefined') {
            this.finishClose();
            return;
        }
        this.exitFallbackTimer = window.setTimeout(() => this.finishClose(), CxFullscreenDialogComponent.motionDurationMs + 20);
    }
    clearMotionTimers() {
        this.clearCloseButtonReveal();
        this.clearExitFallback();
    }
    clearCloseButtonReveal() {
        if (typeof window !== 'undefined' && this.closeButtonRevealTimer !== undefined) {
            window.clearTimeout(this.closeButtonRevealTimer);
        }
        this.closeButtonRevealTimer = undefined;
    }
    clearExitFallback() {
        if (typeof window !== 'undefined' && this.exitFallbackTimer !== undefined) {
            window.clearTimeout(this.exitFallbackTimer);
        }
        this.exitFallbackTimer = undefined;
    }
    releaseOverlay() {
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxFullscreenDialogComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxFullscreenDialogComponent, isStandalone: true, selector: "cx-fullscreen-dialog", inputs: { ariaLabel: "ariaLabel", closeButton: "closeButton", open: "open" }, outputs: { openChange: "openChange", dismissRequest: "dismissRequest", dismiss: "dismiss" }, viewQueries: [{ propertyName: "dialogRootRef", first: true, predicate: ["dialogRoot"], descendants: true, read: ElementRef }, { propertyName: "dialogContentRef", first: true, predicate: ["dialogContent"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (isRendered$()) {\n  <div\n    #dialogRoot\n    class=\"cx-fullscreen-dialog__overlay\"\n    [class.cx-fullscreen-dialog__overlay--closing]=\"isClosing$()\"\n    cdkTrapFocus\n    [cdkTrapFocusAutoCapture]=\"true\"\n    role=\"dialog\"\n    aria-modal=\"true\"\n    [attr.aria-label]=\"resolvedAriaLabel()\"\n    [attr.tabindex]=\"dialogTabIndex()\"\n  >\n    @if (closeButton) {\n      <button\n        type=\"button\"\n        class=\"cx-fullscreen-dialog__close\"\n        [class.cx-fullscreen-dialog__close--ready]=\"isCloseButtonReady$()\"\n        aria-label=\"Close fullscreen dialog\"\n        [attr.aria-hidden]=\"isCloseButtonReady$() ? null : 'true'\"\n        [attr.tabindex]=\"isCloseButtonReady$() ? 0 : -1\"\n        (click)=\"onDismiss()\"\n      >\n        <cx-icon icon=\"remove\" size=\"16\" />\n      </button>\n    }\n\n    <section\n      class=\"cx-fullscreen-dialog\"\n      (animationend)=\"onCanvasAnimationEnd($event)\"\n    >\n      <div #dialogContent class=\"cx-fullscreen-dialog__content\">\n        <ng-content />\n      </div>\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-fullscreen-dialog__overlay{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;min-width:0;min-height:0;padding:var(--space-xl) var(--space-xl) 0;background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box;outline:none}.cx-fullscreen-dialog{position:relative;display:grid;flex:1 1 auto;min-width:0;min-height:0;grid-template-rows:minmax(0, 1fr);overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-2xl) var(--radius-2xl) 0 0;background:var(--surface);box-shadow:var(--shadow-high);color:var(--ink);will-change:transform;animation:cx-fullscreen-dialog-enter calc(var(--motion-slow)*2) var(--ease-out-strong) both}.cx-fullscreen-dialog__overlay--closing{animation:cx-fullscreen-dialog-backdrop-exit calc(var(--motion-slow)*2) var(--ease-in) both}.cx-fullscreen-dialog__overlay--closing .cx-fullscreen-dialog{animation:cx-fullscreen-dialog-exit calc(var(--motion-slow)*2) var(--ease-in) both}.cx-fullscreen-dialog__close{position:absolute;top:var(--space-sm);right:var(--space-sm);z-index:calc(var(--z-index-dialog) + 1);display:inline-flex;width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);color:var(--on-ink);cursor:pointer;margin:0;opacity:0;outline:none;pointer-events:none;transform:scale(0.72);transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity 80ms var(--ease-out),transform var(--motion-fast) cubic-bezier(0.2, 1.4, 0.4, 1)}.cx-fullscreen-dialog__close--ready{opacity:1;pointer-events:auto;transform:scale(1)}.cx-fullscreen-dialog__close:hover{background:var(--emphasis);color:var(--ink)}.cx-fullscreen-dialog__close:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-fullscreen-dialog__close:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-fullscreen-dialog__content{min-width:0;min-height:0;overflow:auto}@keyframes cx-fullscreen-dialog-enter{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes cx-fullscreen-dialog-exit{from{transform:translateY(0)}to{transform:translateY(100%)}}@keyframes cx-fullscreen-dialog-backdrop-exit{to{background-color:rgba(0,0,0,0);backdrop-filter:blur(0)}}@media(prefers-reduced-motion: reduce){.cx-fullscreen-dialog,.cx-fullscreen-dialog__overlay--closing,.cx-fullscreen-dialog__overlay--closing .cx-fullscreen-dialog{animation:none}.cx-fullscreen-dialog__close{transition:none}}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxFullscreenDialogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-fullscreen-dialog', imports: [A11yModule, CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isRendered$()) {\n  <div\n    #dialogRoot\n    class=\"cx-fullscreen-dialog__overlay\"\n    [class.cx-fullscreen-dialog__overlay--closing]=\"isClosing$()\"\n    cdkTrapFocus\n    [cdkTrapFocusAutoCapture]=\"true\"\n    role=\"dialog\"\n    aria-modal=\"true\"\n    [attr.aria-label]=\"resolvedAriaLabel()\"\n    [attr.tabindex]=\"dialogTabIndex()\"\n  >\n    @if (closeButton) {\n      <button\n        type=\"button\"\n        class=\"cx-fullscreen-dialog__close\"\n        [class.cx-fullscreen-dialog__close--ready]=\"isCloseButtonReady$()\"\n        aria-label=\"Close fullscreen dialog\"\n        [attr.aria-hidden]=\"isCloseButtonReady$() ? null : 'true'\"\n        [attr.tabindex]=\"isCloseButtonReady$() ? 0 : -1\"\n        (click)=\"onDismiss()\"\n      >\n        <cx-icon icon=\"remove\" size=\"16\" />\n      </button>\n    }\n\n    <section\n      class=\"cx-fullscreen-dialog\"\n      (animationend)=\"onCanvasAnimationEnd($event)\"\n    >\n      <div #dialogContent class=\"cx-fullscreen-dialog__content\">\n        <ng-content />\n      </div>\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-fullscreen-dialog__overlay{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;min-width:0;min-height:0;padding:var(--space-xl) var(--space-xl) 0;background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box;outline:none}.cx-fullscreen-dialog{position:relative;display:grid;flex:1 1 auto;min-width:0;min-height:0;grid-template-rows:minmax(0, 1fr);overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-2xl) var(--radius-2xl) 0 0;background:var(--surface);box-shadow:var(--shadow-high);color:var(--ink);will-change:transform;animation:cx-fullscreen-dialog-enter calc(var(--motion-slow)*2) var(--ease-out-strong) both}.cx-fullscreen-dialog__overlay--closing{animation:cx-fullscreen-dialog-backdrop-exit calc(var(--motion-slow)*2) var(--ease-in) both}.cx-fullscreen-dialog__overlay--closing .cx-fullscreen-dialog{animation:cx-fullscreen-dialog-exit calc(var(--motion-slow)*2) var(--ease-in) both}.cx-fullscreen-dialog__close{position:absolute;top:var(--space-sm);right:var(--space-sm);z-index:calc(var(--z-index-dialog) + 1);display:inline-flex;width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);color:var(--on-ink);cursor:pointer;margin:0;opacity:0;outline:none;pointer-events:none;transform:scale(0.72);transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity 80ms var(--ease-out),transform var(--motion-fast) cubic-bezier(0.2, 1.4, 0.4, 1)}.cx-fullscreen-dialog__close--ready{opacity:1;pointer-events:auto;transform:scale(1)}.cx-fullscreen-dialog__close:hover{background:var(--emphasis);color:var(--ink)}.cx-fullscreen-dialog__close:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-fullscreen-dialog__close:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-fullscreen-dialog__content{min-width:0;min-height:0;overflow:auto}@keyframes cx-fullscreen-dialog-enter{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes cx-fullscreen-dialog-exit{from{transform:translateY(0)}to{transform:translateY(100%)}}@keyframes cx-fullscreen-dialog-backdrop-exit{to{background-color:rgba(0,0,0,0);backdrop-filter:blur(0)}}@media(prefers-reduced-motion: reduce){.cx-fullscreen-dialog,.cx-fullscreen-dialog__overlay--closing,.cx-fullscreen-dialog__overlay--closing .cx-fullscreen-dialog{animation:none}.cx-fullscreen-dialog__close{transition:none}}"] }]
        }], propDecorators: { dialogRootRef: [{
                type: ViewChild,
                args: ['dialogRoot', { read: ElementRef }]
            }], dialogContentRef: [{
                type: ViewChild,
                args: ['dialogContent', { read: ElementRef }]
            }], ariaLabel: [{
                type: Input
            }], closeButton: [{
                type: Input
            }], open: [{
                type: Input
            }], openChange: [{
                type: Output
            }], dismissRequest: [{
                type: Output
            }], dismiss: [{
                type: Output
            }] } });
