import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Injector, Output, ViewChild, afterNextRender, computed, contentChildren, inject, signal, } from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxShortcutKeyComponent } from '../../primitives/display/cx-shortcut-key/index.js';
import { CxDismissRequest } from '../../primitives/overlay/dismiss-request.js';
import { CxOverlayStateService } from '../../primitives/overlay/overlay-state.js';
import { isHostVisible } from '../../primitives/shared/host-visibility.js';
import { CxStateMessageComponent } from '../cx-state-message/index.js';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxWizardDialogStepDirective } from './cx-wizard-dialog-step.directive.js';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/a11y";
let cxWizardDialogId = 0;
const EMPTY_WIZARD = {
    steps: [],
    index: 0,
    size: 'default',
    dismissible: true,
};
export class CxWizardDialogComponent {
    document = inject(DOCUMENT);
    injector = inject(Injector);
    overlayState = inject(CxOverlayStateService);
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    wizardState = signal(EMPTY_WIZARD, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "wizardState" }] : /* istanbul ignore next */ []));
    stepTemplates = contentChildren(CxWizardDialogStepDirective, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stepTemplates" }] : /* istanbul ignore next */ []));
    overlayHandle;
    requestedOpen = false;
    feedbackContent;
    dialogBackdrop;
    stepContent;
    stepInfoContent;
    stepHeading;
    titleId = `cx-wizard-dialog-title-${++cxWizardDialogId}`;
    isOpen$ = this.openState.asReadonly();
    wizard$ = this.wizardState.asReadonly();
    steps$ = computed(() => this.wizard$().steps, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "steps$" }] : /* istanbul ignore next */ []));
    currentStepIndex$ = computed(() => this.clampIndex(this.wizard$().index ?? 0), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentStepIndex$" }] : /* istanbul ignore next */ []));
    currentStep$ = computed(() => this.steps$()[this.currentStepIndex$()], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentStep$" }] : /* istanbul ignore next */ []));
    activeTemplate$ = computed(() => {
        const activeStepId = this.currentStep$()?.id;
        if (!activeStepId) {
            return null;
        }
        return this.stepTemplates().find(template => template.stepId === activeStepId)?.templateRef ?? null;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeTemplate$" }] : /* istanbul ignore next */ []));
    loadingActionId$ = computed(() => this.wizard$().loadingActionId, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingActionId$" }] : /* istanbul ignore next */ []));
    isLoading$ = computed(() => this.loading || !!this.loadingActionId$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isLoading$" }] : /* istanbul ignore next */ []));
    isFirstStep$ = computed(() => this.steps$().length === 0 || this.currentStepIndex$() === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isFirstStep$" }] : /* istanbul ignore next */ []));
    isLastStep$ = computed(() => this.steps$().length === 0 || this.currentStepIndex$() === this.steps$().length - 1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isLastStep$" }] : /* istanbul ignore next */ []));
    showFeedback$ = computed(() => this.wizard$().feedbackVisible === true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showFeedback$" }] : /* istanbul ignore next */ []));
    isLarge$ = computed(() => this.wizard$().size === 'large', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isLarge$" }] : /* istanbul ignore next */ []));
    dismissible$ = computed(() => this.wizard$().dismissible !== false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dismissible$" }] : /* istanbul ignore next */ []));
    primaryLabel$ = computed(() => {
        if (this.isLastStep$()) {
            const override = this.confirmLabel.trim();
            return override || 'Confirm';
        }
        return 'Continue';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "primaryLabel$" }] : /* istanbul ignore next */ []));
    secondaryLabel$ = computed(() => (this.isFirstStep$() ? 'Cancel' : 'Back'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "secondaryLabel$" }] : /* istanbul ignore next */ []));
    currentHeading$ = computed(() => this.currentStep$()?.heading.trim() || this.currentStep$()?.name || 'Step', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentHeading$" }] : /* istanbul ignore next */ []));
    currentInfoHeading$ = computed(() => this.currentStep$()?.infoHeading.trim() || this.currentStep$()?.name || 'Step guidance', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentInfoHeading$" }] : /* istanbul ignore next */ []));
    currentInfoDescription$ = computed(() => this.currentStep$()?.infoDescription.trim() || undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentInfoDescription$" }] : /* istanbul ignore next */ []));
    loading = false;
    confirmLabel = '';
    set wizard(value) {
        const previousStepId = this.currentStep$()?.id;
        const activeElement = this.document.activeElement;
        const focusedInOutgoingStep = this.openState()
            && !!previousStepId
            && activeElement instanceof HTMLElement
            && (!!this.stepContent?.nativeElement.contains(activeElement)
                || !!this.stepInfoContent?.nativeElement.contains(activeElement));
        const nextWizard = this.normalizeWizard(value);
        const nextStepId = nextWizard.steps[nextWizard.index ?? 0]?.id;
        this.wizardState.set(nextWizard);
        if (focusedInOutgoingStep && nextStepId && nextStepId !== previousStepId) {
            this.focusStepAfterRender(nextStepId);
        }
    }
    set open(value) {
        this.requestedOpen = Boolean(value);
        this.syncOpen(this.requestedOpen);
    }
    get open() {
        return this.requestedOpen;
    }
    openChange = new EventEmitter();
    /** Synchronous request emitted before a user dismissal would close this wizard. */
    dismissRequest = new EventEmitter();
    action = new EventEmitter();
    ngOnChanges(_changes) {
        this.syncOpen(this.requestedOpen);
    }
    ngAfterContentChecked() {
        if (this.isOpen$()) {
            this.assertStepTemplates();
        }
    }
    ngOnDestroy() {
        this.releaseOverlay();
    }
    isActiveStep(index) {
        return index === this.currentStepIndex$();
    }
    isCompletedStep(step, index) {
        return step.status === 'success' || index < this.currentStepIndex$();
    }
    isConnectorComplete(index) {
        return this.currentStepIndex$() > index;
    }
    onBackdropClick(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    onDialogKeydown(event) {
        if (event.isComposing || this.isLoading$()) {
            return;
        }
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            this.onPrimaryAction();
        }
    }
    onDismiss() {
        if (this.isLoading$()) {
            return;
        }
        if (!this.requestDismiss('dismiss')) {
            return;
        }
        this.action.emit('dismiss');
        this.closeFromUser();
    }
    onFeedbackClose() {
        if (this.isLoading$()) {
            return;
        }
        this.action.emit('close');
        this.closeFromUser();
    }
    onSecondaryAction() {
        if (this.isLoading$()) {
            return;
        }
        if (this.isFirstStep$()) {
            if (!this.requestDismiss('cancel')) {
                return;
            }
            this.action.emit('cancel');
            this.closeFromUser();
            return;
        }
        this.action.emit('back');
    }
    onPrimaryAction() {
        if (this.isLoading$()) {
            return;
        }
        if (this.isLastStep$()) {
            this.action.emit('confirm');
            return;
        }
        this.action.emit('continue');
    }
    closeFromUser() {
        this.requestedOpen = false;
        this.syncOpen(false);
        this.openChange.emit(false);
    }
    requestDismiss(reason) {
        const request = new CxDismissRequest(reason);
        this.dismissRequest.emit(request);
        return !request.defaultPrevented;
    }
    syncOpen(nextOpen) {
        if (this.openState() === nextOpen) {
            return;
        }
        if (nextOpen) {
            this.overlayHandle = this.overlayState.capture({
                surface: () => this.dialogBackdrop?.nativeElement,
                isActive: () => this.openState() && isHostVisible(this.dialogBackdrop?.nativeElement),
                onEscape: () => this.onSecondaryAction(),
            });
        }
        else {
            this.releaseOverlay();
        }
        this.openState.set(nextOpen);
    }
    focusStepAfterRender(expectedStepId) {
        afterNextRender(() => {
            if (!this.openState()
                || !this.overlayState.isTopmost(this.overlayHandle)
                || this.currentStep$()?.id !== expectedStepId) {
                return;
            }
            this.stepHeading?.nativeElement.focus({ preventScroll: true });
        }, { injector: this.injector });
    }
    releaseOverlay() {
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    assertStepTemplates() {
        const templateIds = new Set();
        this.stepTemplates().forEach((template, index) => {
            const id = template.stepId.trim();
            if (!id) {
                throw new Error(`[cx-wizard-dialog] step template at index ${index} requires a non-empty id.`);
            }
            if (templateIds.has(id)) {
                throw new Error(`[cx-wizard-dialog] step template id "${id}" must be unique.`);
            }
            templateIds.add(id);
        });
        for (const step of this.steps$()) {
            if (!templateIds.has(step.id)) {
                throw new Error(`[cx-wizard-dialog] step "${step.id}" requires a matching cxWizardDialogStep template.`);
            }
        }
    }
    clampIndex(index) {
        const maxIndex = this.steps$().length - 1;
        if (maxIndex < 0) {
            return 0;
        }
        const normalizedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
        return Math.max(0, Math.min(normalizedIndex, maxIndex));
    }
    normalizeWizard(value) {
        if (!value) {
            return EMPTY_WIZARD;
        }
        if (!Array.isArray(value.steps)) {
            throw new Error('[cx-wizard-dialog] wizard.steps must be an array.');
        }
        const ids = new Set();
        const names = new Set();
        const steps = value.steps.map((step, index) => {
            const id = typeof step?.id === 'string' ? step.id.trim() : '';
            if (!id) {
                throw new Error(`[cx-wizard-dialog] step at index ${index} requires a non-empty id.`);
            }
            if (ids.has(id)) {
                throw new Error(`[cx-wizard-dialog] step id "${id}" must be unique.`);
            }
            ids.add(id);
            const name = typeof step?.name === 'string' ? step.name.trim() : '';
            const nameKey = name.toLowerCase();
            if (names.has(nameKey)) {
                throw new Error(`[cx-wizard-dialog] step name "${name}" must be unique.`);
            }
            names.add(nameKey);
            const heading = typeof step?.heading === 'string' ? step.heading.trim() : '';
            const infoHeading = typeof step?.infoHeading === 'string' ? step.infoHeading.trim() : '';
            const infoDescription = typeof step?.infoDescription === 'string' ? step.infoDescription.trim() : '';
            if (step.infoCustom !== true) {
            }
            return {
                id,
                name,
                heading,
                infoHeading,
                infoDescription,
                icon: step.icon,
                infoCustom: step.infoCustom === true,
                status: step.status === 'success' ? 'success' : 'default',
            };
        });
        const index = Math.max(0, Math.min(Math.trunc(value.index ?? 0), Math.max(steps.length - 1, 0)));
        return {
            ...value,
            steps,
            index,
            size: value.size === 'large' ? 'large' : 'default',
            dismissible: value.dismissible !== false,
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxWizardDialogComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxWizardDialogComponent, isStandalone: true, selector: "cx-wizard-dialog", inputs: { loading: "loading", confirmLabel: "confirmLabel", wizard: "wizard", open: "open" }, outputs: { openChange: "openChange", dismissRequest: "dismissRequest", action: "action" }, queries: [{ propertyName: "stepTemplates", predicate: CxWizardDialogStepDirective, isSignal: true }], viewQueries: [{ propertyName: "feedbackContent", first: true, predicate: ["feedbackContent"], descendants: true, read: ElementRef }, { propertyName: "dialogBackdrop", first: true, predicate: ["dialogBackdrop"], descendants: true, read: ElementRef }, { propertyName: "stepContent", first: true, predicate: ["stepContent"], descendants: true, read: ElementRef }, { propertyName: "stepInfoContent", first: true, predicate: ["stepInfoContent"], descendants: true, read: ElementRef }, { propertyName: "stepHeading", first: true, predicate: ["stepHeading"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "@if (isOpen$()) {\n  <div\n    #dialogBackdrop\n    class=\"cx-wizard-dialog-backdrop\"\n    role=\"presentation\"\n    (click)=\"onBackdropClick($event)\"\n  >\n    <section\n      class=\"cx-wizard-dialog\"\n      [class.cx-wizard-dialog--large]=\"isLarge$()\"\n      [class.cx-wizard-dialog--feedback]=\"showFeedback$()\"\n      cdkTrapFocus\n      [cdkTrapFocusAutoCapture]=\"true\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      [attr.aria-labelledby]=\"showFeedback$() ? null : titleId\"\n      (click)=\"$event.stopPropagation()\"\n      (keydown)=\"onDialogKeydown($event)\"\n    >\n      @if (showFeedback$()) {\n        <div class=\"cx-wizard-dialog__feedback\">\n          <div #feedbackContent class=\"cx-wizard-dialog__feedback-content\">\n            <ng-content select=\"[cxWizardDialogFeedback], [slot=feedback]\" />\n          </div>\n\n          <div class=\"cx-wizard-dialog__feedback-actions\">\n            <cx-button text=\"Close\" mood=\"primary\" [loading]=\"isLoading$()\" (pressed)=\"onFeedbackClose()\" />\n          </div>\n        </div>\n      } @else {\n        <div class=\"cx-wizard-dialog__main\">\n          <header class=\"cx-wizard-dialog__steps-header\">\n            <ol class=\"cx-wizard-dialog__steps\" aria-label=\"Steps\">\n              @for (step of steps$(); track step.id; let index = $index) {\n                <li\n                  class=\"cx-wizard-dialog__step\"\n                  [class.cx-wizard-dialog__step--active]=\"isActiveStep(index)\"\n                  [class.cx-wizard-dialog__step--complete]=\"isCompletedStep(step, index)\"\n                  [attr.aria-current]=\"isActiveStep(index) ? 'step' : null\"\n                >\n                  <span class=\"cx-wizard-dialog__step-marker\">\n                    @if (isCompletedStep(step, index)) {\n                      <cx-icon icon=\"check\" [size]=\"12\" />\n                    } @else {\n                      {{ index + 1 }}\n                    }\n                  </span>\n                  <span class=\"cx-wizard-dialog__step-label\">{{ step.name }}</span>\n                  @if (index < steps$().length - 1) {\n                    <span\n                      class=\"cx-wizard-dialog__step-separator\"\n                      [class.cx-wizard-dialog__step-separator--complete]=\"isConnectorComplete(index)\"\n                      aria-hidden=\"true\"\n                    ></span>\n                  }\n                </li>\n              }\n            </ol>\n          </header>\n\n          <div class=\"cx-wizard-dialog__content-shell\">\n            <section class=\"cx-wizard-dialog__content-card\">\n              <div class=\"cx-wizard-dialog__content-title\">\n                <h2 #stepHeading [id]=\"titleId\" tabindex=\"-1\">{{ currentHeading$() }}</h2>\n                <div class=\"cx-wizard-dialog__content-divider\" aria-hidden=\"true\"></div>\n              </div>\n\n              <div #stepContent class=\"cx-wizard-dialog__content-body\">\n                @if (activeTemplate$(); as activeTemplate) {\n                  <ng-container [ngTemplateOutlet]=\"activeTemplate\" />\n                } @else {\n                  <cx-state-message\n                    icon=\"document\"\n                    heading=\"Add a step template\"\n                    description=\"Use ng-template with cxWizardDialogStep so each step has a real body.\"\n                  />\n                }\n              </div>\n            </section>\n          </div>\n\n          <footer class=\"cx-wizard-dialog__footer\">\n            <div class=\"cx-wizard-dialog__footer-action cx-wizard-dialog__footer-action--start\">\n              <cx-button\n                [text]=\"secondaryLabel$()\"\n                mood=\"default\"\n                [icon]=\"isFirstStep$() ? undefined : 'arrow-left'\"\n                [loading]=\"loadingActionId$() === 'cancel'\"\n                [disabled]=\"isLoading$()\"\n                (pressed)=\"onSecondaryAction()\"\n              />\n\n              <div class=\"cx-wizard-dialog__footer-shortcut\" aria-hidden=\"true\">\n                <cx-shortcut-key [parts]=\"['Esc']\" />\n              </div>\n            </div>\n\n            <div class=\"cx-wizard-dialog__footer-action cx-wizard-dialog__footer-action--end\">\n              <div class=\"cx-wizard-dialog__footer-shortcut cx-wizard-dialog__footer-shortcut--combo\" aria-hidden=\"true\">\n                <cx-shortcut-key [parts]=\"['Mod', 'Enter']\" />\n              </div>\n\n              <ng-content select=\"[cxWizardDialogSecondaryAction], [slot=secondary-action]\" />\n\n              <cx-button\n                [text]=\"primaryLabel$()\"\n                mood=\"primary\"\n                [appendIcon]=\"isLastStep$() ? undefined : 'arrow-right'\"\n                [loading]=\"loadingActionId$() === 'confirm'\"\n                [disabled]=\"isLoading$()\"\n                (pressed)=\"onPrimaryAction()\"\n              />\n            </div>\n          </footer>\n        </div>\n\n        <aside class=\"cx-wizard-dialog__sidebar\" aria-label=\"Step guidance\">\n          @if (dismissible$()) {\n            <cx-icon-button\n              class=\"cx-wizard-dialog__close\"\n              icon=\"remove\"\n              ariaLabel=\"Close wizard\" variant=\"transparent\"\n              [disabled]=\"isLoading$()\"\n              (pressed)=\"onDismiss()\"\n            />\n          }\n\n          <div class=\"cx-wizard-dialog__sidebar-content\">\n            @if (currentStep$()?.icon; as sidebarIcon) {\n              <cx-icon class=\"cx-wizard-dialog__sidebar-icon\" [icon]=\"sidebarIcon\" [size]=\"32\" />\n            }\n\n            <div #stepInfoContent class=\"cx-wizard-dialog__sidebar-copy\">\n              <h3 class=\"cx-wizard-dialog__sidebar-heading\">{{ currentInfoHeading$() }}</h3>\n\n              @if (currentStep$()?.infoCustom) {\n                <ng-content select=\"[cxWizardDialogInfo], [slot=info]\" />\n              } @else if (currentInfoDescription$(); as infoDescription) {\n                <p class=\"cx-wizard-dialog__sidebar-description\">{{ infoDescription }}</p>\n              }\n            </div>\n          </div>\n        </aside>\n      }\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-wizard-dialog-backdrop{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:center;justify-content:center;padding:var(--space-lg);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-wizard-dialog-backdrop--invalid{display:none}.cx-wizard-dialog{position:relative;display:grid;width:min(1280px,100vw - var(--space-lg)*2);height:min(820px,100vh - var(--space-lg)*2);min-height:560px;grid-template-columns:minmax(0, 1fr) minmax(280px, 320px);overflow:hidden;border:var(--line);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-high);color:var(--ink);animation:cx-wizard-dialog-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-wizard-dialog--large{width:min(90vw,100vw - var(--space-lg)*2);height:min(95vh,100vh - var(--space-lg)*2)}.cx-wizard-dialog--feedback{display:flex;min-height:min(520px,100vh - var(--space-lg)*2);align-items:center;justify-content:center;padding:var(--space-xl)}.cx-wizard-dialog__feedback{display:flex;width:min(100%,640px);flex:1 1 auto;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-lg);text-align:center}.cx-wizard-dialog__feedback-content{display:flex;width:100%;flex-direction:column;align-items:center;gap:var(--space-md)}.cx-wizard-dialog__feedback-content:empty{display:none}.cx-wizard-dialog__feedback-actions{display:flex;justify-content:center}.cx-wizard-dialog__main{display:grid;min-height:0;grid-template-rows:auto minmax(0, 1fr) auto;gap:var(--space-lg);padding:var(--space-lg);box-sizing:border-box}.cx-wizard-dialog__steps-header{display:flex;min-width:0;min-height:24px;align-items:center;padding-right:calc(var(--space-xl)*2)}.cx-wizard-dialog__steps{display:flex;min-width:0;flex-wrap:wrap;align-items:center;gap:0;margin:0;padding:0;list-style:none}.cx-wizard-dialog__step{display:flex;align-items:center;gap:var(--space-xs);min-width:0}.cx-wizard-dialog__step-marker{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;flex:0 0 auto;border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-bold);line-height:1}.cx-wizard-dialog__step-label{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.2}.cx-wizard-dialog__step--active .cx-wizard-dialog__step-marker{background:var(--primary);color:var(--on-ink)}.cx-wizard-dialog__step--complete .cx-wizard-dialog__step-marker{background:var(--success);color:var(--surface)}.cx-wizard-dialog__step--active .cx-wizard-dialog__step-label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-wizard-dialog__step--complete .cx-wizard-dialog__step-label{color:var(--ink)}.cx-wizard-dialog__step-separator{display:block;width:56px;height:1px;flex:0 0 auto;margin-inline:var(--space-sm);background:var(--opacity-mid)}.cx-wizard-dialog__content-shell{min-height:0;box-sizing:border-box}.cx-wizard-dialog__content-card{display:grid;height:100%;min-height:0;grid-template-rows:auto minmax(0, 1fr);gap:var(--space-lg);padding:var(--space-xl);border:var(--line);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-wizard-dialog__content-title{display:flex;flex-direction:column;gap:var(--space-md)}.cx-wizard-dialog__content-title h2{margin:0;color:var(--ink);font-size:var(--font-size-title-1);font-weight:var(--font-weight-bold);line-height:1.1}.cx-wizard-dialog__content-divider{height:1px;background:var(--opacity-low)}.cx-wizard-dialog__content-body{min-height:0;overflow:auto}.cx-wizard-dialog__footer{display:flex;align-items:center;justify-content:space-between;gap:var(--space-md)}.cx-wizard-dialog__footer-action{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-wizard-dialog__footer-shortcut{display:inline-flex;align-items:center;gap:var(--space-xs);opacity:0;transform:translateY(2px);transition:opacity var(--motion-fast) ease,transform var(--motion-fast) ease;pointer-events:none}.cx-wizard-dialog__footer:hover .cx-wizard-dialog__footer-shortcut,.cx-wizard-dialog__footer:focus-within .cx-wizard-dialog__footer-shortcut{opacity:1;transform:translateY(0)}.cx-wizard-dialog__sidebar{position:relative;min-width:0;border-left:var(--line-discreet);background:var(--surface-alt);box-sizing:border-box}.cx-wizard-dialog__sidebar-content{display:flex;height:100%;flex-direction:column;gap:var(--space-lg);justify-content:flex-start;padding:calc(var(--space-lg)*2 + 24px) var(--space-xl) var(--space-xl);box-sizing:border-box}.cx-wizard-dialog__sidebar-icon{color:var(--accent)}.cx-wizard-dialog__sidebar-copy{display:flex;flex-direction:column;gap:var(--space-md)}.cx-wizard-dialog__sidebar-heading{margin:0;color:var(--accent);font-size:var(--font-size-title-2);font-weight:var(--font-weight-regular);line-height:1.1}.cx-wizard-dialog__sidebar-description{margin:0;color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body-relaxed)}.cx-wizard-dialog__close{position:absolute;top:var(--space-md);right:var(--space-md)}@keyframes cx-wizard-dialog-enter{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}@media(prefers-reduced-motion: reduce){.cx-wizard-dialog{animation:none}}"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i2.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxShortcutKeyComponent, selector: "cx-shortcut-key", inputs: ["parts"] }, { kind: "component", type: CxStateMessageComponent, selector: "cx-state-message", inputs: ["heading", "description", "action", "secondaryAction", "state", "visual", "layout", "icon"], outputs: ["action", "secondaryAction"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxWizardDialogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-wizard-dialog', imports: [
                        CommonModule,
                        A11yModule,
                        CxButtonComponent,
                        CxShortcutKeyComponent,
                        CxStateMessageComponent,
                        CxIconButtonComponent,
                        CxIconComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isOpen$()) {\n  <div\n    #dialogBackdrop\n    class=\"cx-wizard-dialog-backdrop\"\n    role=\"presentation\"\n    (click)=\"onBackdropClick($event)\"\n  >\n    <section\n      class=\"cx-wizard-dialog\"\n      [class.cx-wizard-dialog--large]=\"isLarge$()\"\n      [class.cx-wizard-dialog--feedback]=\"showFeedback$()\"\n      cdkTrapFocus\n      [cdkTrapFocusAutoCapture]=\"true\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      [attr.aria-labelledby]=\"showFeedback$() ? null : titleId\"\n      (click)=\"$event.stopPropagation()\"\n      (keydown)=\"onDialogKeydown($event)\"\n    >\n      @if (showFeedback$()) {\n        <div class=\"cx-wizard-dialog__feedback\">\n          <div #feedbackContent class=\"cx-wizard-dialog__feedback-content\">\n            <ng-content select=\"[cxWizardDialogFeedback], [slot=feedback]\" />\n          </div>\n\n          <div class=\"cx-wizard-dialog__feedback-actions\">\n            <cx-button text=\"Close\" mood=\"primary\" [loading]=\"isLoading$()\" (pressed)=\"onFeedbackClose()\" />\n          </div>\n        </div>\n      } @else {\n        <div class=\"cx-wizard-dialog__main\">\n          <header class=\"cx-wizard-dialog__steps-header\">\n            <ol class=\"cx-wizard-dialog__steps\" aria-label=\"Steps\">\n              @for (step of steps$(); track step.id; let index = $index) {\n                <li\n                  class=\"cx-wizard-dialog__step\"\n                  [class.cx-wizard-dialog__step--active]=\"isActiveStep(index)\"\n                  [class.cx-wizard-dialog__step--complete]=\"isCompletedStep(step, index)\"\n                  [attr.aria-current]=\"isActiveStep(index) ? 'step' : null\"\n                >\n                  <span class=\"cx-wizard-dialog__step-marker\">\n                    @if (isCompletedStep(step, index)) {\n                      <cx-icon icon=\"check\" [size]=\"12\" />\n                    } @else {\n                      {{ index + 1 }}\n                    }\n                  </span>\n                  <span class=\"cx-wizard-dialog__step-label\">{{ step.name }}</span>\n                  @if (index < steps$().length - 1) {\n                    <span\n                      class=\"cx-wizard-dialog__step-separator\"\n                      [class.cx-wizard-dialog__step-separator--complete]=\"isConnectorComplete(index)\"\n                      aria-hidden=\"true\"\n                    ></span>\n                  }\n                </li>\n              }\n            </ol>\n          </header>\n\n          <div class=\"cx-wizard-dialog__content-shell\">\n            <section class=\"cx-wizard-dialog__content-card\">\n              <div class=\"cx-wizard-dialog__content-title\">\n                <h2 #stepHeading [id]=\"titleId\" tabindex=\"-1\">{{ currentHeading$() }}</h2>\n                <div class=\"cx-wizard-dialog__content-divider\" aria-hidden=\"true\"></div>\n              </div>\n\n              <div #stepContent class=\"cx-wizard-dialog__content-body\">\n                @if (activeTemplate$(); as activeTemplate) {\n                  <ng-container [ngTemplateOutlet]=\"activeTemplate\" />\n                } @else {\n                  <cx-state-message\n                    icon=\"document\"\n                    heading=\"Add a step template\"\n                    description=\"Use ng-template with cxWizardDialogStep so each step has a real body.\"\n                  />\n                }\n              </div>\n            </section>\n          </div>\n\n          <footer class=\"cx-wizard-dialog__footer\">\n            <div class=\"cx-wizard-dialog__footer-action cx-wizard-dialog__footer-action--start\">\n              <cx-button\n                [text]=\"secondaryLabel$()\"\n                mood=\"default\"\n                [icon]=\"isFirstStep$() ? undefined : 'arrow-left'\"\n                [loading]=\"loadingActionId$() === 'cancel'\"\n                [disabled]=\"isLoading$()\"\n                (pressed)=\"onSecondaryAction()\"\n              />\n\n              <div class=\"cx-wizard-dialog__footer-shortcut\" aria-hidden=\"true\">\n                <cx-shortcut-key [parts]=\"['Esc']\" />\n              </div>\n            </div>\n\n            <div class=\"cx-wizard-dialog__footer-action cx-wizard-dialog__footer-action--end\">\n              <div class=\"cx-wizard-dialog__footer-shortcut cx-wizard-dialog__footer-shortcut--combo\" aria-hidden=\"true\">\n                <cx-shortcut-key [parts]=\"['Mod', 'Enter']\" />\n              </div>\n\n              <ng-content select=\"[cxWizardDialogSecondaryAction], [slot=secondary-action]\" />\n\n              <cx-button\n                [text]=\"primaryLabel$()\"\n                mood=\"primary\"\n                [appendIcon]=\"isLastStep$() ? undefined : 'arrow-right'\"\n                [loading]=\"loadingActionId$() === 'confirm'\"\n                [disabled]=\"isLoading$()\"\n                (pressed)=\"onPrimaryAction()\"\n              />\n            </div>\n          </footer>\n        </div>\n\n        <aside class=\"cx-wizard-dialog__sidebar\" aria-label=\"Step guidance\">\n          @if (dismissible$()) {\n            <cx-icon-button\n              class=\"cx-wizard-dialog__close\"\n              icon=\"remove\"\n              ariaLabel=\"Close wizard\" variant=\"transparent\"\n              [disabled]=\"isLoading$()\"\n              (pressed)=\"onDismiss()\"\n            />\n          }\n\n          <div class=\"cx-wizard-dialog__sidebar-content\">\n            @if (currentStep$()?.icon; as sidebarIcon) {\n              <cx-icon class=\"cx-wizard-dialog__sidebar-icon\" [icon]=\"sidebarIcon\" [size]=\"32\" />\n            }\n\n            <div #stepInfoContent class=\"cx-wizard-dialog__sidebar-copy\">\n              <h3 class=\"cx-wizard-dialog__sidebar-heading\">{{ currentInfoHeading$() }}</h3>\n\n              @if (currentStep$()?.infoCustom) {\n                <ng-content select=\"[cxWizardDialogInfo], [slot=info]\" />\n              } @else if (currentInfoDescription$(); as infoDescription) {\n                <p class=\"cx-wizard-dialog__sidebar-description\">{{ infoDescription }}</p>\n              }\n            </div>\n          </div>\n        </aside>\n      }\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-wizard-dialog-backdrop{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:center;justify-content:center;padding:var(--space-lg);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-wizard-dialog-backdrop--invalid{display:none}.cx-wizard-dialog{position:relative;display:grid;width:min(1280px,100vw - var(--space-lg)*2);height:min(820px,100vh - var(--space-lg)*2);min-height:560px;grid-template-columns:minmax(0, 1fr) minmax(280px, 320px);overflow:hidden;border:var(--line);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-high);color:var(--ink);animation:cx-wizard-dialog-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-wizard-dialog--large{width:min(90vw,100vw - var(--space-lg)*2);height:min(95vh,100vh - var(--space-lg)*2)}.cx-wizard-dialog--feedback{display:flex;min-height:min(520px,100vh - var(--space-lg)*2);align-items:center;justify-content:center;padding:var(--space-xl)}.cx-wizard-dialog__feedback{display:flex;width:min(100%,640px);flex:1 1 auto;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-lg);text-align:center}.cx-wizard-dialog__feedback-content{display:flex;width:100%;flex-direction:column;align-items:center;gap:var(--space-md)}.cx-wizard-dialog__feedback-content:empty{display:none}.cx-wizard-dialog__feedback-actions{display:flex;justify-content:center}.cx-wizard-dialog__main{display:grid;min-height:0;grid-template-rows:auto minmax(0, 1fr) auto;gap:var(--space-lg);padding:var(--space-lg);box-sizing:border-box}.cx-wizard-dialog__steps-header{display:flex;min-width:0;min-height:24px;align-items:center;padding-right:calc(var(--space-xl)*2)}.cx-wizard-dialog__steps{display:flex;min-width:0;flex-wrap:wrap;align-items:center;gap:0;margin:0;padding:0;list-style:none}.cx-wizard-dialog__step{display:flex;align-items:center;gap:var(--space-xs);min-width:0}.cx-wizard-dialog__step-marker{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;flex:0 0 auto;border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-bold);line-height:1}.cx-wizard-dialog__step-label{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.2}.cx-wizard-dialog__step--active .cx-wizard-dialog__step-marker{background:var(--primary);color:var(--on-ink)}.cx-wizard-dialog__step--complete .cx-wizard-dialog__step-marker{background:var(--success);color:var(--surface)}.cx-wizard-dialog__step--active .cx-wizard-dialog__step-label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-wizard-dialog__step--complete .cx-wizard-dialog__step-label{color:var(--ink)}.cx-wizard-dialog__step-separator{display:block;width:56px;height:1px;flex:0 0 auto;margin-inline:var(--space-sm);background:var(--opacity-mid)}.cx-wizard-dialog__content-shell{min-height:0;box-sizing:border-box}.cx-wizard-dialog__content-card{display:grid;height:100%;min-height:0;grid-template-rows:auto minmax(0, 1fr);gap:var(--space-lg);padding:var(--space-xl);border:var(--line);border-radius:var(--radius-lg);background:var(--surface);box-sizing:border-box}.cx-wizard-dialog__content-title{display:flex;flex-direction:column;gap:var(--space-md)}.cx-wizard-dialog__content-title h2{margin:0;color:var(--ink);font-size:var(--font-size-title-1);font-weight:var(--font-weight-bold);line-height:1.1}.cx-wizard-dialog__content-divider{height:1px;background:var(--opacity-low)}.cx-wizard-dialog__content-body{min-height:0;overflow:auto}.cx-wizard-dialog__footer{display:flex;align-items:center;justify-content:space-between;gap:var(--space-md)}.cx-wizard-dialog__footer-action{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-wizard-dialog__footer-shortcut{display:inline-flex;align-items:center;gap:var(--space-xs);opacity:0;transform:translateY(2px);transition:opacity var(--motion-fast) ease,transform var(--motion-fast) ease;pointer-events:none}.cx-wizard-dialog__footer:hover .cx-wizard-dialog__footer-shortcut,.cx-wizard-dialog__footer:focus-within .cx-wizard-dialog__footer-shortcut{opacity:1;transform:translateY(0)}.cx-wizard-dialog__sidebar{position:relative;min-width:0;border-left:var(--line-discreet);background:var(--surface-alt);box-sizing:border-box}.cx-wizard-dialog__sidebar-content{display:flex;height:100%;flex-direction:column;gap:var(--space-lg);justify-content:flex-start;padding:calc(var(--space-lg)*2 + 24px) var(--space-xl) var(--space-xl);box-sizing:border-box}.cx-wizard-dialog__sidebar-icon{color:var(--accent)}.cx-wizard-dialog__sidebar-copy{display:flex;flex-direction:column;gap:var(--space-md)}.cx-wizard-dialog__sidebar-heading{margin:0;color:var(--accent);font-size:var(--font-size-title-2);font-weight:var(--font-weight-regular);line-height:1.1}.cx-wizard-dialog__sidebar-description{margin:0;color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body-relaxed)}.cx-wizard-dialog__close{position:absolute;top:var(--space-md);right:var(--space-md)}@keyframes cx-wizard-dialog-enter{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}@media(prefers-reduced-motion: reduce){.cx-wizard-dialog{animation:none}}"] }]
        }], propDecorators: { stepTemplates: [{ type: i0.ContentChildren, args: [i0.forwardRef(() => CxWizardDialogStepDirective), { isSignal: true }] }], feedbackContent: [{
                type: ViewChild,
                args: ['feedbackContent', { read: ElementRef }]
            }], dialogBackdrop: [{
                type: ViewChild,
                args: ['dialogBackdrop', { read: ElementRef }]
            }], stepContent: [{
                type: ViewChild,
                args: ['stepContent', { read: ElementRef }]
            }], stepInfoContent: [{
                type: ViewChild,
                args: ['stepInfoContent', { read: ElementRef }]
            }], stepHeading: [{
                type: ViewChild,
                args: ['stepHeading', { read: ElementRef }]
            }], loading: [{
                type: Input
            }], confirmLabel: [{
                type: Input
            }], wizard: [{
                type: Input
            }], open: [{
                type: Input
            }], openChange: [{
                type: Output
            }], dismissRequest: [{
                type: Output
            }], action: [{
                type: Output
            }] } });
