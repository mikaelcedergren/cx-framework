import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { visibleCxFeedbackAction } from '../cx-feedback-action.js';
import { prefersReducedMotion } from '../reduced-motion.js';
import * as i0 from "@angular/core";
const TOAST_DURATION_MS = 5000;
export class CxToastComponent {
    hideTimer;
    openFrame;
    timerFrame;
    timerStartedAt;
    remainingTime = TOAST_DURATION_MS;
    openInput = false;
    requestedOpen = false;
    dismissibleValue = false;
    pointerInside = false;
    focusInside = false;
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    renderedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedState" }] : /* istanbul ignore next */ []));
    actionState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "actionState" }] : /* istanbul ignore next */ []));
    secondaryActionState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "secondaryActionState" }] : /* istanbul ignore next */ []));
    timerProgressState = signal(1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "timerProgressState" }] : /* istanbul ignore next */ []));
    timerTransitionState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "timerTransitionState" }] : /* istanbul ignore next */ []));
    heading = 'Notification';
    description;
    mood = 'default';
    set action(value) {
        const wasTimed = this.effectiveTimed;
        this.actionState.set(value);
        this.syncTimingPolicy(wasTimed);
    }
    get action() {
        return this.actionState();
    }
    set secondaryAction(value) {
        const wasTimed = this.effectiveTimed;
        this.secondaryActionState.set(value);
        this.syncTimingPolicy(wasTimed);
    }
    get secondaryAction() {
        return this.secondaryActionState();
    }
    set open(value) {
        this.openInput = Boolean(value);
        this.setOpen(this.openInput);
    }
    set dismissible(value) {
        const wasTimed = this.effectiveTimed;
        const nextDismissible = Boolean(value);
        if (nextDismissible === this.dismissibleValue) {
            return;
        }
        this.dismissibleValue = nextDismissible;
        this.syncTimingPolicy(wasTimed);
    }
    get dismissible() {
        return this.dismissibleValue;
    }
    openChange = new EventEmitter();
    actionEmitter = new EventEmitter();
    secondaryActionEmitter = new EventEmitter();
    dismissed = new EventEmitter();
    isRendered$ = this.renderedState.asReadonly();
    isOpen$ = this.openState.asReadonly();
    timerProgress$ = this.timerProgressState.asReadonly();
    timerTransition$ = this.timerTransitionState.asReadonly();
    get isMultiline() {
        return !!this.description?.trim();
    }
    get effectiveDismissible() {
        return this.dismissible || this.hasActions;
    }
    get effectiveTimed() {
        return !this.effectiveDismissible;
    }
    get hasHeading() {
        return this.heading.trim().length > 0;
    }
    get hasContent() {
        return this.hasHeading || this.isMultiline;
    }
    get visibleAction() {
        return visibleCxFeedbackAction(this.actionState());
    }
    get visibleSecondaryAction() {
        return visibleCxFeedbackAction(this.secondaryActionState());
    }
    get hasActions() {
        return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
    }
    get hasControls() {
        return this.hasActions || this.effectiveDismissible;
    }
    get moodIcon() {
        switch (this.mood) {
            case 'success':
                return 'check';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            case 'danger':
                return 'exclamation';
            default:
                return undefined;
        }
    }
    get actionButtonMood() {
        switch (this.mood) {
            case 'info':
            case 'success':
            case 'warning':
            case 'danger':
                return this.mood;
            case 'default':
            default:
                return 'primary';
        }
    }
    ngOnChanges() {
        this.setOpen(this.openInput);
    }
    ngOnDestroy() {
        this.cancelOpenFrame();
        this.cancelTiming(false);
    }
    dismiss() {
        if (!this.requestedOpen) {
            return;
        }
        this.dismissed.emit();
        this.requestClose();
    }
    onActionPressed(action) {
        this.actionEmitter.emit(action);
    }
    onSecondaryActionPressed(action) {
        this.secondaryActionEmitter.emit(action);
    }
    onPointerEnter() {
        this.pointerInside = true;
        this.pauseTiming();
    }
    onPointerLeave() {
        this.pointerInside = false;
        this.resumeTiming();
    }
    onFocusIn() {
        this.focusInside = true;
        this.pauseTiming();
    }
    onFocusOut(event) {
        const surface = event.currentTarget;
        const nextTarget = event.relatedTarget;
        if (surface instanceof HTMLElement && nextTarget instanceof Node && surface.contains(nextTarget)) {
            return;
        }
        this.focusInside = false;
        this.resumeTiming();
    }
    onTransitionEnd(event) {
        if (event.target !== event.currentTarget ||
            event.propertyName !== 'transform' ||
            this.requestedOpen ||
            this.openState()) {
            return;
        }
        this.renderedState.set(false);
    }
    setOpen(nextOpen) {
        if (nextOpen === this.requestedOpen) {
            return;
        }
        this.cancelOpenFrame();
        if (nextOpen) {
            this.requestedOpen = true;
            this.pointerInside = false;
            this.focusInside = false;
            this.cancelTiming(true);
            this.renderedState.set(true);
            this.openState.set(false);
            if (typeof window !== 'undefined' && !prefersReducedMotion()) {
                this.openFrame = window.requestAnimationFrame(() => {
                    this.openFrame = undefined;
                    if (!this.requestedOpen) {
                        return;
                    }
                    this.openState.set(true);
                    this.resetTimedCycle();
                });
                return;
            }
            this.openState.set(true);
            this.resetTimedCycle();
            return;
        }
        this.pauseTiming();
        this.requestedOpen = false;
        this.pointerInside = false;
        this.focusInside = false;
        this.openState.set(false);
        if (!this.renderedState() || prefersReducedMotion()) {
            this.renderedState.set(false);
        }
    }
    requestClose() {
        if (!this.requestedOpen) {
            return;
        }
        this.openInput = false;
        this.setOpen(false);
        this.openChange.emit(false);
    }
    syncTimingPolicy(wasTimed) {
        if (wasTimed === this.effectiveTimed) {
            return;
        }
        if (!this.effectiveTimed) {
            this.cancelTiming(true);
            return;
        }
        this.resetTimedCycle();
    }
    resetTimedCycle() {
        this.cancelTiming(true);
        this.resumeTiming();
    }
    pauseTiming() {
        if (!this.effectiveTimed) {
            return;
        }
        this.cancelTimerFrame();
        if (this.timerStartedAt !== undefined) {
            const elapsed = Math.max(0, Date.now() - this.timerStartedAt);
            this.remainingTime = Math.max(0, this.remainingTime - elapsed);
            this.timerStartedAt = undefined;
        }
        this.clearHideTimer();
        this.timerTransitionState.set(0);
        this.timerProgressState.set(this.remainingTime / TOAST_DURATION_MS);
    }
    resumeTiming() {
        if (!this.shouldRunTimer() || this.hideTimer !== undefined || this.timerFrame !== undefined) {
            return;
        }
        if (this.remainingTime <= 0) {
            this.requestClose();
            return;
        }
        this.timerTransitionState.set(0);
        this.timerProgressState.set(this.remainingTime / TOAST_DURATION_MS);
        this.timerFrame = window.requestAnimationFrame(() => {
            this.timerFrame = undefined;
            if (!this.shouldRunTimer()) {
                return;
            }
            const duration = this.remainingTime;
            this.timerStartedAt = Date.now();
            this.timerTransitionState.set(duration);
            this.timerProgressState.set(0);
            this.hideTimer = window.setTimeout(() => {
                this.hideTimer = undefined;
                this.timerStartedAt = undefined;
                this.remainingTime = 0;
                this.timerTransitionState.set(0);
                this.timerProgressState.set(0);
                this.requestClose();
            }, duration);
        });
    }
    shouldRunTimer() {
        return (typeof window !== 'undefined' &&
            this.requestedOpen &&
            this.openState() &&
            this.effectiveTimed &&
            !this.pointerInside &&
            !this.focusInside);
    }
    cancelOpenFrame() {
        if (this.openFrame === undefined || typeof window === 'undefined') {
            return;
        }
        window.cancelAnimationFrame(this.openFrame);
        this.openFrame = undefined;
    }
    cancelTimerFrame() {
        if (this.timerFrame === undefined || typeof window === 'undefined') {
            return;
        }
        window.cancelAnimationFrame(this.timerFrame);
        this.timerFrame = undefined;
    }
    clearHideTimer() {
        if (this.hideTimer === undefined) {
            return;
        }
        window.clearTimeout(this.hideTimer);
        this.hideTimer = undefined;
    }
    cancelTiming(resetProgress) {
        this.cancelTimerFrame();
        this.clearHideTimer();
        this.timerStartedAt = undefined;
        this.timerTransitionState.set(0);
        if (resetProgress) {
            this.remainingTime = TOAST_DURATION_MS;
            this.timerProgressState.set(1);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxToastComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxToastComponent, isStandalone: true, selector: "cx-toast", inputs: { heading: "heading", description: "description", mood: "mood", action: "action", secondaryAction: "secondaryAction", open: "open", dismissible: "dismissible" }, outputs: { openChange: "openChange", actionEmitter: "action", secondaryActionEmitter: "secondaryAction", dismissed: "dismissed" }, usesOnChanges: true, ngImport: i0, template: "@if (isRendered$()) {\n  <div\n    class=\"cx-toast\"\n    [class.cx-toast--open]=\"isOpen$()\"\n    [class.cx-toast--closing]=\"!isOpen$()\"\n    [class.cx-toast--default]=\"mood === 'default'\"\n    [class.cx-toast--info]=\"mood === 'info'\"\n    [class.cx-toast--success]=\"mood === 'success'\"\n    [class.cx-toast--warning]=\"mood === 'warning'\"\n    [class.cx-toast--danger]=\"mood === 'danger'\"\n    [class.cx-toast--multiline]=\"isMultiline\"\n    [class.cx-toast--timed]=\"effectiveTimed\"\n    [style.--cx-toast-timer-progress]=\"timerProgress$()\"\n    [style.--cx-toast-timer-duration]=\"timerTransition$() + 'ms'\"\n    role=\"status\"\n    [attr.aria-live]=\"mood === 'danger' ? 'assertive' : 'polite'\"\n    (pointerenter)=\"onPointerEnter()\"\n    (pointerleave)=\"onPointerLeave()\"\n    (focusin)=\"onFocusIn()\"\n    (focusout)=\"onFocusOut($event)\"\n    (transitionend)=\"onTransitionEnd($event)\"\n  >\n    @if (moodIcon; as iconName) {\n      <cx-icon class=\"cx-toast__mood-icon\" [icon]=\"iconName\" [mood]=\"mood\" shape=\"circle-outline\" size=\"24\" />\n    }\n\n    @if (hasContent) {\n      <div class=\"cx-toast__content\">\n        @if (hasHeading) {\n          <div class=\"cx-toast__heading\">{{ heading }}</div>\n        }\n        @if (description?.trim()) {\n          <div class=\"cx-toast__description\">{{ description }}</div>\n        }\n      </div>\n    }\n\n    @if (hasControls) {\n      <div class=\"cx-toast__controls\">\n        @if (visibleSecondaryAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [transparent]=\"action.transparent ?? true\"\n            [mood]=\"action.mood ?? 'default'\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onSecondaryActionPressed(action)\"\n          />\n        }\n\n        @if (visibleAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [transparent]=\"action.transparent ?? false\"\n            [mood]=\"action.mood ?? actionButtonMood\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onActionPressed(action)\"\n          />\n        }\n\n        @if (effectiveDismissible) {\n          <cx-icon-button\n            class=\"cx-toast__dismiss\"\n            icon=\"remove\"\n            ariaLabel=\"Dismiss notification\" variant=\"transparent\"\n            (pressed)=\"dismiss()\"\n          />\n        }\n      </div>\n    }\n\n    @if (effectiveTimed) {\n      <span class=\"cx-toast__timer\" aria-hidden=\"true\"></span>\n    }\n  </div>\n}\n", styles: [":host{display:contents}.cx-toast{position:fixed;left:50%;bottom:var(--space-md);z-index:var(--z-index-toast);box-sizing:border-box;display:flex;width:fit-content;max-width:min(var(--controller-size)*15,100vw - var(--space-xl));min-height:calc(var(--controller-size) + var(--space-md) + var(--space-2xs));align-items:center;gap:var(--space-sm);overflow:hidden;padding:var(--space-sm);border:var(--line);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-mid);color:var(--ink);line-height:var(--line-height-body-relaxed);transform:translate(-50%, calc(100% + var(--space-xl)));transition:transform var(--motion-slow) var(--ease-out);backdrop-filter:blur(calc(var(--frost-softness) * 4))}.cx-toast--open{transform:translate(-50%, 0)}.cx-toast--closing{transform:translate(-50%, calc(100% + var(--space-xl)))}.cx-toast--default{padding-left:var(--space-md)}.cx-toast--success{border-color:var(--success-opacity);background:var(--success-opacity)}.cx-toast--info{border-color:var(--info-opacity);background:var(--info-opacity)}.cx-toast--warning{border-color:var(--warning-opacity);background:var(--warning-opacity)}.cx-toast--danger{border-color:var(--danger-opacity);background:var(--danger-opacity)}.cx-toast__mood-icon{flex:0 0 auto}.cx-toast__content{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--space-2xs)}.cx-toast__heading{overflow-wrap:anywhere;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold)}.cx-toast__description{overflow-wrap:anywhere;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular)}.cx-toast__controls{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-sm);padding-left:var(--space-md)}.cx-toast__timer{position:absolute;right:0;bottom:0;left:0;height:var(--space-2xs);background:var(--primary);transform-origin:left center;transform:scaleX(var(--cx-toast-timer-progress, 1));transition:transform var(--cx-toast-timer-duration, 0ms) linear}.cx-toast--success .cx-toast__timer{background:var(--success)}.cx-toast--info .cx-toast__timer{background:var(--info)}.cx-toast--warning .cx-toast__timer{background:var(--warning)}.cx-toast--danger .cx-toast__timer{background:var(--danger)}@media(prefers-reduced-motion: reduce){.cx-toast{transition:none}.cx-toast__timer{transform:scaleX(1);transition:none}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxToastComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-toast', imports: [CxButtonComponent, CxIconComponent, CxIconButtonComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isRendered$()) {\n  <div\n    class=\"cx-toast\"\n    [class.cx-toast--open]=\"isOpen$()\"\n    [class.cx-toast--closing]=\"!isOpen$()\"\n    [class.cx-toast--default]=\"mood === 'default'\"\n    [class.cx-toast--info]=\"mood === 'info'\"\n    [class.cx-toast--success]=\"mood === 'success'\"\n    [class.cx-toast--warning]=\"mood === 'warning'\"\n    [class.cx-toast--danger]=\"mood === 'danger'\"\n    [class.cx-toast--multiline]=\"isMultiline\"\n    [class.cx-toast--timed]=\"effectiveTimed\"\n    [style.--cx-toast-timer-progress]=\"timerProgress$()\"\n    [style.--cx-toast-timer-duration]=\"timerTransition$() + 'ms'\"\n    role=\"status\"\n    [attr.aria-live]=\"mood === 'danger' ? 'assertive' : 'polite'\"\n    (pointerenter)=\"onPointerEnter()\"\n    (pointerleave)=\"onPointerLeave()\"\n    (focusin)=\"onFocusIn()\"\n    (focusout)=\"onFocusOut($event)\"\n    (transitionend)=\"onTransitionEnd($event)\"\n  >\n    @if (moodIcon; as iconName) {\n      <cx-icon class=\"cx-toast__mood-icon\" [icon]=\"iconName\" [mood]=\"mood\" shape=\"circle-outline\" size=\"24\" />\n    }\n\n    @if (hasContent) {\n      <div class=\"cx-toast__content\">\n        @if (hasHeading) {\n          <div class=\"cx-toast__heading\">{{ heading }}</div>\n        }\n        @if (description?.trim()) {\n          <div class=\"cx-toast__description\">{{ description }}</div>\n        }\n      </div>\n    }\n\n    @if (hasControls) {\n      <div class=\"cx-toast__controls\">\n        @if (visibleSecondaryAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [transparent]=\"action.transparent ?? true\"\n            [mood]=\"action.mood ?? 'default'\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onSecondaryActionPressed(action)\"\n          />\n        }\n\n        @if (visibleAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [transparent]=\"action.transparent ?? false\"\n            [mood]=\"action.mood ?? actionButtonMood\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onActionPressed(action)\"\n          />\n        }\n\n        @if (effectiveDismissible) {\n          <cx-icon-button\n            class=\"cx-toast__dismiss\"\n            icon=\"remove\"\n            ariaLabel=\"Dismiss notification\" variant=\"transparent\"\n            (pressed)=\"dismiss()\"\n          />\n        }\n      </div>\n    }\n\n    @if (effectiveTimed) {\n      <span class=\"cx-toast__timer\" aria-hidden=\"true\"></span>\n    }\n  </div>\n}\n", styles: [":host{display:contents}.cx-toast{position:fixed;left:50%;bottom:var(--space-md);z-index:var(--z-index-toast);box-sizing:border-box;display:flex;width:fit-content;max-width:min(var(--controller-size)*15,100vw - var(--space-xl));min-height:calc(var(--controller-size) + var(--space-md) + var(--space-2xs));align-items:center;gap:var(--space-sm);overflow:hidden;padding:var(--space-sm);border:var(--line);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-mid);color:var(--ink);line-height:var(--line-height-body-relaxed);transform:translate(-50%, calc(100% + var(--space-xl)));transition:transform var(--motion-slow) var(--ease-out);backdrop-filter:blur(calc(var(--frost-softness) * 4))}.cx-toast--open{transform:translate(-50%, 0)}.cx-toast--closing{transform:translate(-50%, calc(100% + var(--space-xl)))}.cx-toast--default{padding-left:var(--space-md)}.cx-toast--success{border-color:var(--success-opacity);background:var(--success-opacity)}.cx-toast--info{border-color:var(--info-opacity);background:var(--info-opacity)}.cx-toast--warning{border-color:var(--warning-opacity);background:var(--warning-opacity)}.cx-toast--danger{border-color:var(--danger-opacity);background:var(--danger-opacity)}.cx-toast__mood-icon{flex:0 0 auto}.cx-toast__content{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--space-2xs)}.cx-toast__heading{overflow-wrap:anywhere;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold)}.cx-toast__description{overflow-wrap:anywhere;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular)}.cx-toast__controls{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-sm);padding-left:var(--space-md)}.cx-toast__timer{position:absolute;right:0;bottom:0;left:0;height:var(--space-2xs);background:var(--primary);transform-origin:left center;transform:scaleX(var(--cx-toast-timer-progress, 1));transition:transform var(--cx-toast-timer-duration, 0ms) linear}.cx-toast--success .cx-toast__timer{background:var(--success)}.cx-toast--info .cx-toast__timer{background:var(--info)}.cx-toast--warning .cx-toast__timer{background:var(--warning)}.cx-toast--danger .cx-toast__timer{background:var(--danger)}@media(prefers-reduced-motion: reduce){.cx-toast{transition:none}.cx-toast__timer{transform:scaleX(1);transition:none}}"] }]
        }], propDecorators: { heading: [{
                type: Input
            }], description: [{
                type: Input
            }], mood: [{
                type: Input
            }], action: [{
                type: Input
            }], secondaryAction: [{
                type: Input
            }], open: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], openChange: [{
                type: Output
            }], actionEmitter: [{
                type: Output,
                args: ['action']
            }], secondaryActionEmitter: [{
                type: Output,
                args: ['secondaryAction']
            }], dismissed: [{
                type: Output
            }] } });
