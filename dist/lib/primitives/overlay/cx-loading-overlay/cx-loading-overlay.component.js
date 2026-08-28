import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, Input, Output, ViewChild, computed, inject, signal, } from '@angular/core';
import { CxTextShimmerComponent } from '../../display/cx-text-shimmer/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { CxOverlayStateService } from '../overlay-state.js';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
/**
 * Shortest time a status stays on screen before the next one may replace it.
 * Real progress events arrive in bursts — several stages can fire inside a few
 * hundred milliseconds — and without a floor the label flickers through states
 * nobody can read.
 */
const MIN_DWELL_MS = 700;
/**
 * A modal wait: a scrim, a compact surface, a spinner, and the live status of
 * the work underneath it.
 *
 * `status` is the current stage only — the component never owns a plan, an
 * index, or a timer that advances on its own, so the label can only ever say
 * what the host actually knows.
 *
 * It deliberately cannot be dismissed. There is no close control, Escape is
 * swallowed rather than passed down, and the backdrop ignores clicks — the
 * dialog closes only when the host sets `open` to false, which should be when
 * the work actually finishes.
 */
export class CxLoadingOverlayComponent {
    overlayState = inject(CxOverlayStateService);
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    overlayHandle;
    overlayBackdrop;
    displayedState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayedState" }] : /* istanbul ignore next */ []));
    revisionState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "revisionState" }] : /* istanbul ignore next */ []));
    /** The most recent value the host set, which may not be on screen yet. */
    latest = '';
    /** A status waiting out the current dwell. Only the newest one survives. */
    queued = null;
    dwellTimer;
    displayedAt = 0;
    isOpen$ = this.openState.asReadonly();
    displayed$ = this.displayedState.asReadonly();
    constructor() {
        inject(DestroyRef).onDestroy(() => this.clearDwellTimer());
    }
    /** Whether the wait is showing. Two-way bindable; the host closes it when the work finishes. */
    set open(value) {
        this.syncOpen(Boolean(value));
    }
    get open() {
        return this.openState();
    }
    /**
     * What the work is doing right now. Empty shows the spinner alone.
     *
     * Set it again whenever the work moves on; the overlay holds each value on
     * screen long enough to read before accepting the next.
     */
    set status(value) {
        this.accept(value?.trim() ?? '');
    }
    get status() {
        return this.latest;
    }
    /**
     * Accessible name for the overlay. Kept stable on purpose — naming it from the
     * changing status would rename the overlay on every stage.
     */
    ariaLabel = 'Working';
    openChange = new EventEmitter();
    ngOnDestroy() {
        this.releaseOverlay();
    }
    get resolvedAriaLabel() {
        return this.ariaLabel.trim() || 'Working';
    }
    hasStatus$ = computed(() => this.displayedState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasStatus$" }] : /* istanbul ignore next */ []));
    entries$ = computed(() => {
        const text = this.displayedState();
        return text ? [{ key: this.revisionState(), text }] : [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "entries$" }] : /* istanbul ignore next */ []));
    /**
     * The wait holds no controls, so there is nowhere for Tab to go. Swallowing it
     * keeps focus on the surface instead of letting it reach the page behind,
     * which the user is not allowed to touch while the work runs.
     */
    onKeydown(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
        }
    }
    /**
     * Pressing the scrim would otherwise blur the surface onto the document body,
     * which then lets the next Tab walk into the page behind the wait. Cancelling
     * the default on the scrim itself keeps focus where the trap put it, while
     * anything inside the surface still behaves normally.
     */
    onBackdropMousedown(event) {
        if (event.target === event.currentTarget) {
            event.preventDefault();
        }
    }
    syncOpen(next) {
        if (this.openState() === next) {
            return;
        }
        if (next) {
            this.openState.set(true);
            this.overlayHandle = this.overlayState.capture({
                kind: 'modal',
                surface: () => this.overlayBackdrop?.nativeElement,
                isActive: () => this.openState() && isHostVisible(this.overlayBackdrop?.nativeElement),
            });
            return;
        }
        this.releaseOverlay();
        this.openState.set(false);
    }
    releaseOverlay() {
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    accept(next) {
        if (next === this.latest) {
            return;
        }
        this.latest = next;
        // Clearing is immediate: a lone spinner must never keep narrating work that
        // is no longer happening.
        if (next === '') {
            this.clearDwellTimer();
            this.queued = null;
            this.display('');
            return;
        }
        const elapsed = Date.now() - this.displayedAt;
        if (!this.hasStatus$() || elapsed >= MIN_DWELL_MS) {
            this.clearDwellTimer();
            this.queued = null;
            this.display(next);
            return;
        }
        // Coalesce rather than queue, so the readout is never more than one dwell
        // behind the work. Draining every burst in order would leave the label
        // describing a stage the system had already finished.
        this.queued = next;
        if (this.dwellTimer === undefined) {
            this.dwellTimer = globalThis.setTimeout(() => this.flush(), MIN_DWELL_MS - elapsed);
        }
    }
    flush() {
        this.dwellTimer = undefined;
        const next = this.queued;
        this.queued = null;
        if (next !== null) {
            this.display(next);
        }
    }
    display(text) {
        this.displayedAt = Date.now();
        this.displayedState.set(text);
        this.revisionState.update(revision => revision + 1);
    }
    clearDwellTimer() {
        if (this.dwellTimer === undefined) {
            return;
        }
        globalThis.clearTimeout(this.dwellTimer);
        this.dwellTimer = undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLoadingOverlayComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLoadingOverlayComponent, isStandalone: true, selector: "cx-loading-overlay", inputs: { open: "open", status: "status", ariaLabel: "ariaLabel" }, outputs: { openChange: "openChange" }, host: { classAttribute: "cx-loading-overlay-host" }, viewQueries: [{ propertyName: "overlayBackdrop", first: true, predicate: ["overlayBackdrop"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (isOpen$()) {\n  <!-- No click handler: the backdrop of a blocking wait is a scrim, not an exit.\n       The trap lives here rather than on the surface so the surface itself is\n       inside the trapped region and can be the initial focus target. -->\n  <div\n    #overlayBackdrop\n    class=\"cx-loading-overlay-backdrop\"\n    role=\"presentation\"\n    cdkTrapFocus\n    [cdkTrapFocusAutoCapture]=\"true\"\n    (keydown)=\"onKeydown($event)\"\n    (mousedown)=\"onBackdropMousedown($event)\"\n  >\n    <section\n      class=\"cx-loading-overlay\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      tabindex=\"-1\"\n      cdkFocusInitial\n    >\n      <!-- The spinner keeps its own \"Loading\" announcement only while no status\n           speaks for it; with a status the live region below is the narrator. -->\n      <cx-spinner size=\"large\" mood=\"primary\" [attr.aria-hidden]=\"hasStatus$() ? 'true' : null\" />\n\n      @for (entry of entries$(); track entry.key) {\n        <cx-text-shimmer class=\"cx-loading-overlay__status\" [text]=\"entry.text\" aria-hidden=\"true\" />\n      }\n\n      <!-- Always rendered, never conditional: a live region has to exist before\n           its content changes for screen readers to announce the change. -->\n      <span class=\"cx-loading-overlay__live\" role=\"status\">{{ displayed$() }}</span>\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-loading-overlay-backdrop{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:center;justify-content:center;padding:var(--space-md);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-loading-overlay{display:flex;min-width:min(95vw,var(--controller-size)*8);max-width:min(95vw,var(--controller-size)*12);box-sizing:border-box;flex-direction:column;align-items:center;gap:var(--space-sm);padding:var(--space-xl);border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-high);color:var(--opacity-high);font-size:var(--font-size-body);line-height:var(--line-height-body);animation:cx-loading-overlay-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-loading-overlay:focus,.cx-loading-overlay:focus-visible{outline:none}.cx-loading-overlay__status{max-width:100%;min-width:0;text-align:center;animation:cx-loading-overlay-status-enter var(--motion-base) var(--ease-out) both}@keyframes cx-loading-overlay-enter{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:none}}@keyframes cx-loading-overlay-status-enter{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion: reduce){.cx-loading-overlay,.cx-loading-overlay__status{animation:none}}.cx-loading-overlay__live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "component", type: CxTextShimmerComponent, selector: "cx-text-shimmer", inputs: ["text", "active"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLoadingOverlayComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-loading-overlay', imports: [A11yModule, CxSpinnerComponent, CxTextShimmerComponent], host: {
                        class: 'cx-loading-overlay-host',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isOpen$()) {\n  <!-- No click handler: the backdrop of a blocking wait is a scrim, not an exit.\n       The trap lives here rather than on the surface so the surface itself is\n       inside the trapped region and can be the initial focus target. -->\n  <div\n    #overlayBackdrop\n    class=\"cx-loading-overlay-backdrop\"\n    role=\"presentation\"\n    cdkTrapFocus\n    [cdkTrapFocusAutoCapture]=\"true\"\n    (keydown)=\"onKeydown($event)\"\n    (mousedown)=\"onBackdropMousedown($event)\"\n  >\n    <section\n      class=\"cx-loading-overlay\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      [attr.aria-label]=\"resolvedAriaLabel\"\n      tabindex=\"-1\"\n      cdkFocusInitial\n    >\n      <!-- The spinner keeps its own \"Loading\" announcement only while no status\n           speaks for it; with a status the live region below is the narrator. -->\n      <cx-spinner size=\"large\" mood=\"primary\" [attr.aria-hidden]=\"hasStatus$() ? 'true' : null\" />\n\n      @for (entry of entries$(); track entry.key) {\n        <cx-text-shimmer class=\"cx-loading-overlay__status\" [text]=\"entry.text\" aria-hidden=\"true\" />\n      }\n\n      <!-- Always rendered, never conditional: a live region has to exist before\n           its content changes for screen readers to announce the change. -->\n      <span class=\"cx-loading-overlay__live\" role=\"status\">{{ displayed$() }}</span>\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-loading-overlay-backdrop{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:center;justify-content:center;padding:var(--space-md);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-loading-overlay{display:flex;min-width:min(95vw,var(--controller-size)*8);max-width:min(95vw,var(--controller-size)*12);box-sizing:border-box;flex-direction:column;align-items:center;gap:var(--space-sm);padding:var(--space-xl);border:var(--floating-surface-border);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-high);color:var(--opacity-high);font-size:var(--font-size-body);line-height:var(--line-height-body);animation:cx-loading-overlay-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-loading-overlay:focus,.cx-loading-overlay:focus-visible{outline:none}.cx-loading-overlay__status{max-width:100%;min-width:0;text-align:center;animation:cx-loading-overlay-status-enter var(--motion-base) var(--ease-out) both}@keyframes cx-loading-overlay-enter{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:none}}@keyframes cx-loading-overlay-status-enter{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion: reduce){.cx-loading-overlay,.cx-loading-overlay__status{animation:none}}.cx-loading-overlay__live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}"] }]
        }], ctorParameters: () => [], propDecorators: { overlayBackdrop: [{
                type: ViewChild,
                args: ['overlayBackdrop', { read: ElementRef }]
            }], open: [{
                type: Input
            }], status: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], openChange: [{
                type: Output
            }] } });
