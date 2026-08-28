import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { visibleCxFeedbackAction } from '../cx-feedback-action.js';
import { prefersReducedMotion } from '../reduced-motion.js';
import * as i0 from "@angular/core";
export class CxBannerComponent {
    renderedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    dismissibleState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dismissibleState" }] : /* istanbul ignore next */ []));
    visibleInput = false;
    requestedOpen = false;
    openFrame;
    mood = 'default';
    heading = '';
    description = '';
    action;
    secondaryAction;
    dismissAriaLabel = 'Dismiss banner';
    set dismissible(value) {
        const dismissible = Boolean(value);
        this.dismissibleState.set(dismissible);
        if (!dismissible) {
            this.cancelOpenFrame();
            if (this.requestedOpen && this.renderedState()) {
                this.openState.set(true);
            }
            else if (!this.requestedOpen) {
                this.renderedState.set(false);
            }
        }
    }
    set visible(value) {
        this.visibleInput = Boolean(value);
        this.setOpen(this.visibleInput);
    }
    actionSelect = new EventEmitter();
    secondaryActionSelect = new EventEmitter();
    visibleChange = new EventEmitter();
    isRendered$ = this.renderedState.asReadonly();
    isOpen$ = this.openState.asReadonly();
    isDismissible$ = this.dismissibleState.asReadonly();
    get resolvedIcon() {
        switch (this.mood) {
            case 'danger':
                return 'error';
            case 'warning':
                return 'warning';
            case 'success':
                return 'check';
            case 'default':
            default:
                return 'info';
        }
    }
    get resolvedRole() {
        if (this.mood === 'danger' || this.mood === 'warning') {
            return 'alert';
        }
        return 'status';
    }
    actionButtonMood(action) {
        if (action.mood !== undefined) {
            return action.mood;
        }
        switch (this.mood) {
            case 'success':
                return 'success';
            case 'danger':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'default':
            default:
                return 'info';
        }
    }
    get visibleAction() {
        return visibleCxFeedbackAction(this.action);
    }
    get visibleSecondaryAction() {
        return visibleCxFeedbackAction(this.secondaryAction);
    }
    get hasCopy() {
        return this.heading.trim().length > 0 || this.description.trim().length > 0;
    }
    hasActions() {
        return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
    }
    ngOnChanges() {
        this.setOpen(this.visibleInput);
    }
    ngOnDestroy() {
        this.cancelOpenFrame();
        this.renderedState.set(false);
        this.openState.set(false);
    }
    onActionSelect(action) {
        this.actionSelect.emit(action);
    }
    onSecondaryActionSelect(action) {
        this.secondaryActionSelect.emit(action);
    }
    onDismissPress() {
        this.visibleInput = false;
        this.setOpen(false);
        this.visibleChange.emit(false);
    }
    onTransitionEnd(event) {
        if (event.target !== event.currentTarget || event.propertyName !== 'transform' || this.requestedOpen) {
            return;
        }
        this.renderedState.set(false);
    }
    setOpen(nextVisible) {
        if (nextVisible === this.requestedOpen) {
            return;
        }
        const wasWaitingToOpen = this.openFrame !== undefined;
        this.requestedOpen = nextVisible;
        this.cancelOpenFrame();
        if (nextVisible) {
            this.renderedState.set(true);
            if (!this.dismissibleState() || prefersReducedMotion()) {
                this.openState.set(true);
                return;
            }
            this.openState.set(false);
            if (typeof window !== 'undefined') {
                this.openFrame = window.requestAnimationFrame(() => {
                    this.openFrame = undefined;
                    if (!this.requestedOpen) {
                        return;
                    }
                    this.openState.set(true);
                });
            }
            else {
                this.openState.set(true);
            }
            return;
        }
        this.openState.set(false);
        if (wasWaitingToOpen || !this.renderedState() || !this.dismissibleState() || prefersReducedMotion()) {
            this.renderedState.set(false);
        }
    }
    cancelOpenFrame() {
        if (this.openFrame === undefined || typeof window === 'undefined') {
            return;
        }
        window.cancelAnimationFrame(this.openFrame);
        this.openFrame = undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBannerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxBannerComponent, isStandalone: true, selector: "cx-banner", inputs: { mood: "mood", heading: "heading", description: "description", action: "action", secondaryAction: "secondaryAction", dismissAriaLabel: "dismissAriaLabel", dismissible: "dismissible", visible: "visible" }, outputs: { actionSelect: "actionSelect", secondaryActionSelect: "secondaryActionSelect", visibleChange: "visibleChange" }, usesOnChanges: true, ngImport: i0, template: "@if (isRendered$()) {\n    <div\n      class=\"cx-banner\"\n      [class.cx-banner--dismissible]=\"isDismissible$()\"\n      [class.cx-banner--persistent]=\"!isDismissible$()\"\n      [class.cx-banner--open]=\"isOpen$()\"\n      [class.cx-banner--closing]=\"!isOpen$() && isDismissible$()\"\n      [class.cx-banner--default]=\"mood === 'default'\"\n      [class.cx-banner--warning]=\"mood === 'warning'\"\n      [class.cx-banner--success]=\"mood === 'success'\"\n      [class.cx-banner--danger]=\"mood === 'danger'\"\n      [attr.role]=\"resolvedRole\"\n      (transitionend)=\"onTransitionEnd($event)\"\n    >\n      @if (hasCopy) {\n        <div class=\"cx-banner__main\">\n          <cx-icon class=\"cx-banner__icon\" [icon]=\"resolvedIcon\" [size]=\"32\" aria-hidden=\"true\" />\n\n          <div class=\"cx-banner__copy\">\n            @if (heading.trim()) {\n              <div class=\"cx-banner__title\">{{ heading }}</div>\n            }\n\n            @if (description.trim()) {\n              <div class=\"cx-banner__description\">{{ description }}</div>\n            }\n          </div>\n        </div>\n      }\n\n      @if (hasActions() || isDismissible$()) {\n        <div class=\"cx-banner__actions\">\n          @if (visibleAction; as action) {\n            <cx-button\n              class=\"cx-banner__action\"\n              [transparent]=\"action.transparent ?? false\"\n              [mood]=\"actionButtonMood(action)\"\n              [text]=\"action.text\"\n              [icon]=\"action.icon\"\n              [appendIcon]=\"action.appendIcon\"\n              [disabled]=\"action.disabled ?? false\"\n              [loading]=\"action.loading ?? false\"\n              [ariaLabel]=\"action.ariaLabel\"\n              (pressed)=\"onActionSelect(action)\"\n            />\n          }\n\n          @if (visibleSecondaryAction; as action) {\n            <cx-button\n              class=\"cx-banner__action\"\n              [transparent]=\"action.transparent ?? false\"\n              [mood]=\"actionButtonMood(action)\"\n              [text]=\"action.text\"\n              [icon]=\"action.icon\"\n              [appendIcon]=\"action.appendIcon\"\n              [disabled]=\"action.disabled ?? false\"\n              [loading]=\"action.loading ?? false\"\n              [ariaLabel]=\"action.ariaLabel\"\n              (pressed)=\"onSecondaryActionSelect(action)\"\n            />\n          }\n\n          @if (isDismissible$()) {\n            <button\n              type=\"button\"\n              class=\"cx-banner__dismiss\"\n              [attr.aria-label]=\"dismissAriaLabel\"\n              (click)=\"onDismissPress()\"\n            >\n              <cx-icon icon=\"remove\" [size]=\"14\" aria-hidden=\"true\" />\n            </button>\n          }\n        </div>\n      }\n    </div>\n}\n", styles: [":host{display:contents}.cx-banner{display:flex;width:100%;align-items:center;justify-content:space-between;gap:var(--space-lg);padding:var(--space-md) var(--space-xl);background:var(--info);color:var(--on-ink);box-sizing:border-box}.cx-banner--dismissible{position:fixed;top:0;left:0;right:0;z-index:var(--z-index-toast);width:100vw;box-shadow:var(--shadow-mid);transform:translateY(calc(-100% - var(--space-sm)));transition:transform 320ms var(--ease-out)}.cx-banner--persistent{position:sticky;top:0;z-index:var(--z-index-toast);padding:var(--space-sm) var(--space-md);box-shadow:none;transform:none;transition:none}.cx-banner--dismissible.cx-banner--open{transform:translateY(0)}.cx-banner--dismissible.cx-banner--closing{transform:translateY(calc(-100% - var(--space-sm)))}.cx-banner--default{background:var(--info);color:var(--on-ink)}.cx-banner--warning{background:var(--warning);color:var(--on-ink)}.cx-banner--success{background:var(--success);color:var(--on-ink)}.cx-banner--danger{background:var(--danger);color:var(--on-ink)}.cx-banner__main{display:flex;min-width:0;flex:1 1 auto;align-items:center;gap:var(--space-md)}.cx-banner__icon{display:inline-flex;flex:0 0 auto;color:currentColor}.cx-banner__copy{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;justify-content:center;gap:2px}.cx-banner__title{color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:1.35}.cx-banner__description{color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.45}.cx-banner__actions{display:inline-flex;flex:0 0 auto;align-items:center;gap:var(--space-sm);margin-left:auto}.cx-banner__action,.cx-banner__dismiss{flex:0 0 auto}.cx-banner__dismiss{display:inline-flex;width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:currentColor;cursor:pointer;outline:none;transition:background-color var(--motion-fast) ease}.cx-banner__dismiss:hover{background:color-mix(in srgb, currentColor 14%, transparent)}.cx-banner__dismiss:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-banner--dismissible{transition:none}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBannerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-banner', imports: [CxButtonComponent, CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isRendered$()) {\n    <div\n      class=\"cx-banner\"\n      [class.cx-banner--dismissible]=\"isDismissible$()\"\n      [class.cx-banner--persistent]=\"!isDismissible$()\"\n      [class.cx-banner--open]=\"isOpen$()\"\n      [class.cx-banner--closing]=\"!isOpen$() && isDismissible$()\"\n      [class.cx-banner--default]=\"mood === 'default'\"\n      [class.cx-banner--warning]=\"mood === 'warning'\"\n      [class.cx-banner--success]=\"mood === 'success'\"\n      [class.cx-banner--danger]=\"mood === 'danger'\"\n      [attr.role]=\"resolvedRole\"\n      (transitionend)=\"onTransitionEnd($event)\"\n    >\n      @if (hasCopy) {\n        <div class=\"cx-banner__main\">\n          <cx-icon class=\"cx-banner__icon\" [icon]=\"resolvedIcon\" [size]=\"32\" aria-hidden=\"true\" />\n\n          <div class=\"cx-banner__copy\">\n            @if (heading.trim()) {\n              <div class=\"cx-banner__title\">{{ heading }}</div>\n            }\n\n            @if (description.trim()) {\n              <div class=\"cx-banner__description\">{{ description }}</div>\n            }\n          </div>\n        </div>\n      }\n\n      @if (hasActions() || isDismissible$()) {\n        <div class=\"cx-banner__actions\">\n          @if (visibleAction; as action) {\n            <cx-button\n              class=\"cx-banner__action\"\n              [transparent]=\"action.transparent ?? false\"\n              [mood]=\"actionButtonMood(action)\"\n              [text]=\"action.text\"\n              [icon]=\"action.icon\"\n              [appendIcon]=\"action.appendIcon\"\n              [disabled]=\"action.disabled ?? false\"\n              [loading]=\"action.loading ?? false\"\n              [ariaLabel]=\"action.ariaLabel\"\n              (pressed)=\"onActionSelect(action)\"\n            />\n          }\n\n          @if (visibleSecondaryAction; as action) {\n            <cx-button\n              class=\"cx-banner__action\"\n              [transparent]=\"action.transparent ?? false\"\n              [mood]=\"actionButtonMood(action)\"\n              [text]=\"action.text\"\n              [icon]=\"action.icon\"\n              [appendIcon]=\"action.appendIcon\"\n              [disabled]=\"action.disabled ?? false\"\n              [loading]=\"action.loading ?? false\"\n              [ariaLabel]=\"action.ariaLabel\"\n              (pressed)=\"onSecondaryActionSelect(action)\"\n            />\n          }\n\n          @if (isDismissible$()) {\n            <button\n              type=\"button\"\n              class=\"cx-banner__dismiss\"\n              [attr.aria-label]=\"dismissAriaLabel\"\n              (click)=\"onDismissPress()\"\n            >\n              <cx-icon icon=\"remove\" [size]=\"14\" aria-hidden=\"true\" />\n            </button>\n          }\n        </div>\n      }\n    </div>\n}\n", styles: [":host{display:contents}.cx-banner{display:flex;width:100%;align-items:center;justify-content:space-between;gap:var(--space-lg);padding:var(--space-md) var(--space-xl);background:var(--info);color:var(--on-ink);box-sizing:border-box}.cx-banner--dismissible{position:fixed;top:0;left:0;right:0;z-index:var(--z-index-toast);width:100vw;box-shadow:var(--shadow-mid);transform:translateY(calc(-100% - var(--space-sm)));transition:transform 320ms var(--ease-out)}.cx-banner--persistent{position:sticky;top:0;z-index:var(--z-index-toast);padding:var(--space-sm) var(--space-md);box-shadow:none;transform:none;transition:none}.cx-banner--dismissible.cx-banner--open{transform:translateY(0)}.cx-banner--dismissible.cx-banner--closing{transform:translateY(calc(-100% - var(--space-sm)))}.cx-banner--default{background:var(--info);color:var(--on-ink)}.cx-banner--warning{background:var(--warning);color:var(--on-ink)}.cx-banner--success{background:var(--success);color:var(--on-ink)}.cx-banner--danger{background:var(--danger);color:var(--on-ink)}.cx-banner__main{display:flex;min-width:0;flex:1 1 auto;align-items:center;gap:var(--space-md)}.cx-banner__icon{display:inline-flex;flex:0 0 auto;color:currentColor}.cx-banner__copy{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;justify-content:center;gap:2px}.cx-banner__title{color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:1.35}.cx-banner__description{color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.45}.cx-banner__actions{display:inline-flex;flex:0 0 auto;align-items:center;gap:var(--space-sm);margin-left:auto}.cx-banner__action,.cx-banner__dismiss{flex:0 0 auto}.cx-banner__dismiss{display:inline-flex;width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:currentColor;cursor:pointer;outline:none;transition:background-color var(--motion-fast) ease}.cx-banner__dismiss:hover{background:color-mix(in srgb, currentColor 14%, transparent)}.cx-banner__dismiss:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-banner--dismissible{transition:none}}"] }]
        }], propDecorators: { mood: [{
                type: Input
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], action: [{
                type: Input
            }], secondaryAction: [{
                type: Input
            }], dismissAriaLabel: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], visible: [{
                type: Input
            }], actionSelect: [{
                type: Output
            }], secondaryActionSelect: [{
                type: Output
            }], visibleChange: [{
                type: Output
            }] } });
