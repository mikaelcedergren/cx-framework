import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, computed, inject, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { CxOverlayStateService } from '../overlay-state.js';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
export class CxLightboxComponent {
    host = inject((ElementRef));
    overlayState = inject(CxOverlayStateService);
    requestedOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "requestedOpenState" }] : /* istanbul ignore next */ []));
    imagesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imagesState" }] : /* istanbul ignore next */ []));
    indexState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indexState" }] : /* istanbul ignore next */ []));
    overlayHandle;
    ariaLabelState = 'Image lightbox';
    previousAriaLabelState = 'Previous image';
    nextAriaLabelState = 'Next image';
    isOpen$ = computed(() => this.requestedOpenState() && this.imagesState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isOpen$" }] : /* istanbul ignore next */ []));
    currentIndex$ = computed(() => {
        const lastIndex = this.imagesState().length - 1;
        return lastIndex < 0 ? 0 : Math.min(this.indexState(), lastIndex);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentIndex$" }] : /* istanbul ignore next */ []));
    currentImage$ = computed(() => this.imagesState()[this.currentIndex$()], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentImage$" }] : /* istanbul ignore next */ []));
    hasNavigation$ = computed(() => this.imagesState().length > 1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasNavigation$" }] : /* istanbul ignore next */ []));
    canGoPrevious$ = computed(() => this.currentIndex$() > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canGoPrevious$" }] : /* istanbul ignore next */ []));
    canGoNext$ = computed(() => this.currentIndex$() < this.imagesState().length - 1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canGoNext$" }] : /* istanbul ignore next */ []));
    positionText$ = computed(() => `${this.currentIndex$() + 1} / ${this.imagesState().length}`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "positionText$" }] : /* istanbul ignore next */ []));
    positionLabel$ = computed(() => `Image ${this.currentIndex$() + 1} of ${this.imagesState().length}`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "positionLabel$" }] : /* istanbul ignore next */ []));
    set images(value) {
        const images = Array.isArray(value)
            ? value.flatMap(image => {
                const src = typeof image?.src === 'string' ? image.src.trim() : '';
                if (!src) {
                    return [];
                }
                const caption = typeof image.caption === 'string' ? image.caption.trim() : '';
                return [{
                        src,
                        alt: typeof image.alt === 'string' ? image.alt : '',
                        ...(caption ? { caption } : {}),
                    }];
            })
            : [];
        this.imagesState.set(images);
        this.reconcileOverlay();
    }
    get images() {
        return this.imagesState();
    }
    set index(value) {
        this.indexState.set(Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);
    }
    get index() {
        return this.currentIndex$();
    }
    set ariaLabel(value) {
        this.ariaLabelState = value?.trim() || 'Image lightbox';
    }
    get ariaLabel() {
        return this.ariaLabelState;
    }
    set previousAriaLabel(value) {
        this.previousAriaLabelState = value?.trim() || 'Previous image';
    }
    get previousAriaLabel() {
        return this.previousAriaLabelState;
    }
    set nextAriaLabel(value) {
        this.nextAriaLabelState = value?.trim() || 'Next image';
    }
    get nextAriaLabel() {
        return this.nextAriaLabelState;
    }
    set open(value) {
        this.requestedOpenState.set(Boolean(value));
        this.reconcileOverlay();
    }
    get open() {
        return this.requestedOpenState();
    }
    indexChange = new EventEmitter();
    openChange = new EventEmitter();
    ngOnDestroy() {
        this.releaseOverlay();
    }
    onBackdropClick(event) {
        if (event.target !== event.currentTarget || !this.overlayState.isTopmost(this.overlayHandle)) {
            return;
        }
        this.closeFromUser();
    }
    onDialogKeydown(event) {
        if (event.defaultPrevented
            || event.isComposing
            || event.altKey
            || event.ctrlKey
            || event.metaKey
            || event.shiftKey
            || !this.overlayState.isTopmost(this.overlayHandle)) {
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            event.stopPropagation();
            this.showPreviousImage();
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            event.stopPropagation();
            this.showNextImage();
        }
    }
    showPreviousImage() {
        this.navigate(-1);
    }
    showNextImage() {
        this.navigate(1);
    }
    closeFromUser() {
        if (!this.requestedOpenState()) {
            return;
        }
        this.requestedOpenState.set(false);
        this.reconcileOverlay();
        this.openChange.emit(false);
    }
    navigate(direction) {
        if (!this.hasNavigation$() || !this.overlayState.isTopmost(this.overlayHandle)) {
            return;
        }
        const nextIndex = Math.max(0, Math.min(this.currentIndex$() + direction, this.imagesState().length - 1));
        if (nextIndex === this.currentIndex$()) {
            return;
        }
        this.indexState.set(nextIndex);
        this.indexChange.emit(nextIndex);
    }
    reconcileOverlay() {
        if (this.isOpen$()) {
            if (!this.overlayHandle) {
                this.overlayHandle = this.overlayState.capture({
                    surface: () => this.host.nativeElement.querySelector('.cx-lightbox') ?? undefined,
                    isActive: () => isHostVisible(this.host.nativeElement.querySelector('.cx-lightbox')),
                    onEscape: () => this.closeFromUser(),
                });
            }
            return;
        }
        this.releaseOverlay();
    }
    releaseOverlay() {
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLightboxComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLightboxComponent, isStandalone: true, selector: "cx-lightbox", inputs: { images: "images", index: "index", ariaLabel: "ariaLabel", previousAriaLabel: "previousAriaLabel", nextAriaLabel: "nextAriaLabel", open: "open" }, outputs: { indexChange: "indexChange", openChange: "openChange" }, host: { listeners: { "document:keydown": "onDialogKeydown($event)" } }, ngImport: i0, template: "@if (isOpen$()) {\n  @if (currentImage$(); as image) {\n    <div\n      class=\"cx-lightbox\"\n      [class.cx-lightbox--gallery]=\"hasNavigation$()\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      cdkTrapFocus\n      [cdkTrapFocusAutoCapture]=\"true\"\n      [attr.aria-label]=\"ariaLabel\"\n      [attr.aria-keyshortcuts]=\"hasNavigation$() ? 'Escape ArrowLeft ArrowRight' : 'Escape'\"\n      (click)=\"onBackdropClick($event)\"\n    >\n      @if (hasNavigation$()) {\n        <cx-icon-button\n          class=\"cx-lightbox__control cx-lightbox__navigation cx-lightbox__previous\"\n          icon=\"chevron-left\"\n          [rounded]=\"true\"\n          [ariaLabel]=\"previousAriaLabel\"\n          [disabled]=\"!canGoPrevious$()\"\n          (pressed)=\"showPreviousImage()\"\n        />\n      }\n\n      <figure class=\"cx-lightbox__surface\" tabindex=\"-1\" cdkFocusInitial>\n        <img class=\"cx-lightbox__image\" [src]=\"image.src\" [alt]=\"image.alt\" />\n        @if (image.caption || hasNavigation$()) {\n          <figcaption class=\"cx-lightbox__meta\">\n            @if (image.caption) {\n              <span class=\"cx-lightbox__caption\">{{ image.caption }}</span>\n            }\n            @if (hasNavigation$()) {\n              <span\n                class=\"cx-lightbox__position\"\n                role=\"status\"\n                aria-live=\"polite\"\n                aria-atomic=\"true\"\n                [attr.aria-label]=\"positionLabel$()\"\n              >\n                {{ positionText$() }}\n              </span>\n            }\n          </figcaption>\n        }\n      </figure>\n\n      @if (hasNavigation$()) {\n        <cx-icon-button\n          class=\"cx-lightbox__control cx-lightbox__navigation cx-lightbox__next\"\n          icon=\"chevron-right\"\n          [rounded]=\"true\"\n          [ariaLabel]=\"nextAriaLabel\"\n          [disabled]=\"!canGoNext$()\"\n          (pressed)=\"showNextImage()\"\n        />\n      }\n    </div>\n  }\n}\n", styles: [":host{display:contents}.cx-lightbox{position:fixed;inset:0;z-index:var(--z-index-dialog);display:grid;grid-template-columns:minmax(0, 1fr);grid-template-rows:minmax(0, 1fr);align-items:center;gap:var(--space-md);padding:var(--space-xl);overflow:auto;background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-lightbox--gallery{grid-template-columns:var(--controller-size) minmax(0, 1fr) var(--controller-size)}.cx-lightbox__surface{grid-column:1;grid-row:1;display:grid;width:fit-content;min-width:0;max-width:min(100%,1120px);max-height:calc(100dvh - var(--space-xl)*2);gap:var(--space-sm);justify-items:center;justify-self:center;margin:0;outline:none;animation:cx-lightbox-image-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-lightbox--gallery .cx-lightbox__surface{grid-column:2}.cx-lightbox__image{display:block;width:auto;min-width:0;max-width:100%;max-height:calc(100dvh - var(--space-xl)*2 - var(--controller-size));object-fit:contain;border-radius:var(--radius-xl);box-shadow:var(--shadow-mid);background:var(--surface)}.cx-lightbox__meta{display:grid;max-width:min(100%,720px);gap:var(--space-xs);justify-items:center}.cx-lightbox__caption{color:var(--on-ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-body-relaxed);text-align:center}.cx-lightbox__position{color:var(--on-ink);font-size:var(--font-size-body-xs);font-variant-numeric:tabular-nums;line-height:var(--line-height-small);opacity:.64}.cx-lightbox__control{--cx-icon-button-default-background: var(--emphasis);--cx-icon-button-default-color: var(--on-emphasis);--cx-icon-button-default-hover-background: color-mix( in srgb, var(--emphasis) 88%, var(--on-emphasis) 12% );border-radius:var(--radius-pill);corner-shape:round;box-shadow:var(--shadow-low)}.cx-lightbox__navigation{grid-row:1;align-self:center}.cx-lightbox__previous{grid-column:1;justify-self:start}.cx-lightbox__next{grid-column:3;justify-self:end}@keyframes cx-lightbox-image-enter{from{opacity:0;transform:translateY(var(--space-sm)) scale(0.985)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion: reduce){.cx-lightbox__surface{animation:none}}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLightboxComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-lightbox', imports: [A11yModule, CxIconButtonComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isOpen$()) {\n  @if (currentImage$(); as image) {\n    <div\n      class=\"cx-lightbox\"\n      [class.cx-lightbox--gallery]=\"hasNavigation$()\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      cdkTrapFocus\n      [cdkTrapFocusAutoCapture]=\"true\"\n      [attr.aria-label]=\"ariaLabel\"\n      [attr.aria-keyshortcuts]=\"hasNavigation$() ? 'Escape ArrowLeft ArrowRight' : 'Escape'\"\n      (click)=\"onBackdropClick($event)\"\n    >\n      @if (hasNavigation$()) {\n        <cx-icon-button\n          class=\"cx-lightbox__control cx-lightbox__navigation cx-lightbox__previous\"\n          icon=\"chevron-left\"\n          [rounded]=\"true\"\n          [ariaLabel]=\"previousAriaLabel\"\n          [disabled]=\"!canGoPrevious$()\"\n          (pressed)=\"showPreviousImage()\"\n        />\n      }\n\n      <figure class=\"cx-lightbox__surface\" tabindex=\"-1\" cdkFocusInitial>\n        <img class=\"cx-lightbox__image\" [src]=\"image.src\" [alt]=\"image.alt\" />\n        @if (image.caption || hasNavigation$()) {\n          <figcaption class=\"cx-lightbox__meta\">\n            @if (image.caption) {\n              <span class=\"cx-lightbox__caption\">{{ image.caption }}</span>\n            }\n            @if (hasNavigation$()) {\n              <span\n                class=\"cx-lightbox__position\"\n                role=\"status\"\n                aria-live=\"polite\"\n                aria-atomic=\"true\"\n                [attr.aria-label]=\"positionLabel$()\"\n              >\n                {{ positionText$() }}\n              </span>\n            }\n          </figcaption>\n        }\n      </figure>\n\n      @if (hasNavigation$()) {\n        <cx-icon-button\n          class=\"cx-lightbox__control cx-lightbox__navigation cx-lightbox__next\"\n          icon=\"chevron-right\"\n          [rounded]=\"true\"\n          [ariaLabel]=\"nextAriaLabel\"\n          [disabled]=\"!canGoNext$()\"\n          (pressed)=\"showNextImage()\"\n        />\n      }\n    </div>\n  }\n}\n", styles: [":host{display:contents}.cx-lightbox{position:fixed;inset:0;z-index:var(--z-index-dialog);display:grid;grid-template-columns:minmax(0, 1fr);grid-template-rows:minmax(0, 1fr);align-items:center;gap:var(--space-md);padding:var(--space-xl);overflow:auto;background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-lightbox--gallery{grid-template-columns:var(--controller-size) minmax(0, 1fr) var(--controller-size)}.cx-lightbox__surface{grid-column:1;grid-row:1;display:grid;width:fit-content;min-width:0;max-width:min(100%,1120px);max-height:calc(100dvh - var(--space-xl)*2);gap:var(--space-sm);justify-items:center;justify-self:center;margin:0;outline:none;animation:cx-lightbox-image-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-lightbox--gallery .cx-lightbox__surface{grid-column:2}.cx-lightbox__image{display:block;width:auto;min-width:0;max-width:100%;max-height:calc(100dvh - var(--space-xl)*2 - var(--controller-size));object-fit:contain;border-radius:var(--radius-xl);box-shadow:var(--shadow-mid);background:var(--surface)}.cx-lightbox__meta{display:grid;max-width:min(100%,720px);gap:var(--space-xs);justify-items:center}.cx-lightbox__caption{color:var(--on-ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-body-relaxed);text-align:center}.cx-lightbox__position{color:var(--on-ink);font-size:var(--font-size-body-xs);font-variant-numeric:tabular-nums;line-height:var(--line-height-small);opacity:.64}.cx-lightbox__control{--cx-icon-button-default-background: var(--emphasis);--cx-icon-button-default-color: var(--on-emphasis);--cx-icon-button-default-hover-background: color-mix( in srgb, var(--emphasis) 88%, var(--on-emphasis) 12% );border-radius:var(--radius-pill);corner-shape:round;box-shadow:var(--shadow-low)}.cx-lightbox__navigation{grid-row:1;align-self:center}.cx-lightbox__previous{grid-column:1;justify-self:start}.cx-lightbox__next{grid-column:3;justify-self:end}@keyframes cx-lightbox-image-enter{from{opacity:0;transform:translateY(var(--space-sm)) scale(0.985)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion: reduce){.cx-lightbox__surface{animation:none}}"] }]
        }], propDecorators: { images: [{
                type: Input
            }], index: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], previousAriaLabel: [{
                type: Input
            }], nextAriaLabel: [{
                type: Input
            }], open: [{
                type: Input
            }], indexChange: [{
                type: Output
            }], openChange: [{
                type: Output
            }], onDialogKeydown: [{
                type: HostListener,
                args: ['document:keydown', ['$event']]
            }] } });
