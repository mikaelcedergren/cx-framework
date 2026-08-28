import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, NgZone, Output, ViewChild, computed, effect, inject, signal, } from '@angular/core';
import { CxTooltipComponent } from '../../overlay/cx-tooltip/index.js';
import { CxButtonComponent } from '../cx-button/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { eventMatchesShortcut, isTypingTarget, normalizeShortcutParts } from '../shared/shortcuts.js';
import * as i0 from "@angular/core";
const CX_ACTION_AREA_REVEAL_DELAY_MS = 300;
const CX_ACTION_AREA_INFO_ACTION = {
    id: 'info',
    text: 'Info',
    icon: 'info',
    ariaLabel: 'Show info',
    shortcutParts: ['shift', 'i'],
    disabled: false,
    key: 'feature-info',
};
const CX_ACTION_AREA_AI_ACTION = {
    id: 'ai',
    text: 'Ask AI',
    icon: 'ai',
    shortcutParts: ['shift', 'a'],
    disabled: false,
    key: 'feature-ai',
};
const CX_ACTION_AREA_SUPPORT_ACTION = {
    id: 'support',
    text: 'Support',
    icon: 'support',
    ariaLabel: 'Get support',
    shortcutParts: ['shift', 's'],
    disabled: false,
    key: 'feature-support',
};
const CX_ACTION_AREA_EDIT_ACTION = {
    id: 'edit',
    text: 'Edit',
    icon: 'edit',
    shortcutParts: ['shift', 'e'],
    disabled: false,
    key: 'feature-edit',
};
export class CxActionAreaComponent {
    static activeInstance;
    host = inject((ElementRef));
    changeDetector = inject(ChangeDetectorRef);
    zone = inject(NgZone);
    actionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "actionsState" }] : /* istanbul ignore next */ []));
    infoState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "infoState" }] : /* istanbul ignore next */ []));
    askAiState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "askAiState" }] : /* istanbul ignore next */ []));
    supportState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "supportState" }] : /* istanbul ignore next */ []));
    editableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "editableState" }] : /* istanbul ignore next */ []));
    ariaLabelState = signal('Action area', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabelState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    shortcutsEnabledState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "shortcutsEnabledState" }] : /* istanbul ignore next */ []));
    hoveringState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hoveringState" }] : /* istanbul ignore next */ []));
    focusWithinState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusWithinState" }] : /* istanbul ignore next */ []));
    visualActiveState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visualActiveState" }] : /* istanbul ignore next */ []));
    fitModeState = signal('full', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fitModeState" }] : /* istanbul ignore next */ []));
    actionsRail;
    resizeObserver;
    measurementFrame;
    activeRevealTimer;
    measuring = false;
    set actions(value) {
        const actions = this.normalizeActions(value);
        this.actionsState.set(actions);
        if (actions.length === 0 && !this.infoState() && !this.askAiState() && !this.supportState() && !this.editableState()) {
            this.hideActiveVisual();
        }
    }
    set info(value) {
        this.infoState.set(Boolean(value));
    }
    set askAi(value) {
        this.askAiState.set(Boolean(value));
    }
    set support(value) {
        this.supportState.set(Boolean(value));
    }
    set editable(value) {
        this.editableState.set(Boolean(value));
    }
    set ariaLabel(value) {
        this.ariaLabelState.set(value?.trim() || 'Action area');
    }
    set disabled(value) {
        const disabled = Boolean(value);
        this.disabledState.set(disabled);
        if (disabled) {
            this.hideActiveVisual();
        }
    }
    set shortcutsEnabled(value) {
        this.shortcutsEnabledState.set(Boolean(value));
    }
    actionSelect = new EventEmitter();
    allActions$ = computed(() => {
        const actions = [];
        if (this.infoState()) {
            actions.push(CX_ACTION_AREA_INFO_ACTION);
        }
        if (this.askAiState()) {
            actions.push(CX_ACTION_AREA_AI_ACTION);
        }
        if (this.supportState()) {
            actions.push(CX_ACTION_AREA_SUPPORT_ACTION);
        }
        actions.push(...this.actionsState());
        if (this.editableState()) {
            actions.push(CX_ACTION_AREA_EDIT_ACTION);
        }
        return actions;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "allActions$" }] : /* istanbul ignore next */ []));
    visibleActions$ = this.allActions$;
    isInteractive$ = computed(() => !this.disabledState() && this.allActions$().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isInteractive$" }] : /* istanbul ignore next */ []));
    hasInteractionIntent$ = computed(() => this.isInteractive$() && (this.hoveringState() || this.focusWithinState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasInteractionIntent$" }] : /* istanbul ignore next */ []));
    isActive$ = computed(() => this.isInteractive$() && this.visualActiveState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isActive$" }] : /* istanbul ignore next */ []));
    fitMeasurementEffect = effect(() => {
        this.allActions$();
        this.shortcutsEnabledState();
        this.isInteractive$();
        this.scheduleFitMeasurement();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fitMeasurementEffect" }] : /* istanbul ignore next */ []));
    set actionsRailRef(value) {
        this.actionsRail = value?.nativeElement;
        this.observeActionAreaSize();
        this.scheduleFitMeasurement();
    }
    get interactiveClass() {
        return this.isInteractive$();
    }
    get activeClass() {
        return this.isActive$();
    }
    get disabledClass() {
        return this.disabledState();
    }
    get compactClass() {
        return this.fitModeState() === 'compact';
    }
    get iconClass() {
        return this.fitModeState() === 'icon';
    }
    get hostRole() {
        return this.isInteractive$() ? 'group' : null;
    }
    get hostAriaLabel() {
        return this.isInteractive$() ? this.ariaLabelState() : null;
    }
    get hostTabIndex() {
        return this.isInteractive$() ? 0 : null;
    }
    ngOnDestroy() {
        this.releaseActiveInstance();
        this.fitMeasurementEffect.destroy();
        this.resizeObserver?.disconnect();
        this.clearActiveRevealTimer();
        if (this.measurementFrame !== undefined && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.measurementFrame);
        }
    }
    onPointerEnter() {
        if (!this.isInteractive$()) {
            return;
        }
        this.hoveringState.set(true);
        this.claimActiveInstance();
        this.scheduleActiveReveal();
    }
    onPointerLeave() {
        this.hoveringState.set(false);
        if (this.focusWithinState()) {
            this.claimActiveInstance();
            this.scheduleActiveReveal();
            return;
        }
        this.releaseActiveInstance();
        this.hideActiveVisual();
    }
    onFocusIn() {
        if (!this.isInteractive$()) {
            return;
        }
        this.focusWithinState.set(true);
        this.claimActiveInstance();
        this.scheduleActiveReveal();
    }
    onFocus() {
        this.onFocusIn();
    }
    onFocusOut(event) {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget)) {
            return;
        }
        this.focusWithinState.set(false);
        if (this.hoveringState()) {
            this.claimActiveInstance();
            this.scheduleActiveReveal();
            return;
        }
        this.releaseActiveInstance();
        this.hideActiveVisual();
    }
    onBlur(event) {
        this.onFocusOut(event);
    }
    onDocumentKeydown(event) {
        const hasDomFocus = this.hasDomFocus();
        if (!isHostVisible(this.host.nativeElement) ||
            (CxActionAreaComponent.activeInstance !== this && !hasDomFocus) ||
            (!this.hasInteractionIntent$() && !hasDomFocus) ||
            !this.shortcutsEnabledState() ||
            event.repeat ||
            event.isComposing ||
            isTypingTarget(event.target) ||
            isTypingTarget(typeof document === 'undefined' ? null : document.activeElement)) {
            return;
        }
        const action = this.allActions$().find(item => !item.disabled && item.shortcutParts && eventMatchesShortcut(item.shortcutParts, event));
        if (!action) {
            return;
        }
        if (hasDomFocus) {
            this.claimActiveInstance();
        }
        event.preventDefault();
        event.stopPropagation();
        this.emitAction(action, 'shortcut');
    }
    hasShortcut(action) {
        return this.shortcutsEnabledState() && (action.shortcutParts?.length ?? 0) > 0;
    }
    actionText(action) {
        return this.fitModeState() === 'icon' && action.icon ? '' : action.text;
    }
    actionShortcutParts(action) {
        return this.fitModeState() === 'full' && this.hasShortcut(action) ? action.shortcutParts : undefined;
    }
    actionTooltipText(action) {
        return this.fitModeState() === 'icon' && action.icon ? action.text : undefined;
    }
    actionAriaLabel(action) {
        const label = action.ariaLabel?.trim();
        if (label) {
            return label;
        }
        const shortcut = this.shortcutsEnabledState() ? this.shortcutLabel(action.shortcutParts) : '';
        return shortcut ? `${action.text} (${shortcut})` : action.text;
    }
    onActionPointerDown(event) {
        event.stopPropagation();
    }
    onActionClick(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    onActionPressed(action) {
        if (action.disabled) {
            return;
        }
        this.emitAction(action, 'button');
    }
    claimActiveInstance() {
        if (!this.isInteractive$()) {
            return;
        }
        CxActionAreaComponent.activeInstance = this;
    }
    releaseActiveInstance() {
        if (CxActionAreaComponent.activeInstance === this) {
            CxActionAreaComponent.activeInstance = undefined;
        }
    }
    scheduleActiveReveal() {
        if (!this.hasInteractionIntent$()) {
            this.hideActiveVisual();
            return;
        }
        if (this.visualActiveState() || this.activeRevealTimer !== undefined) {
            return;
        }
        if (typeof window === 'undefined') {
            this.showActiveVisual();
            return;
        }
        this.zone.runOutsideAngular(() => {
            this.activeRevealTimer = window.setTimeout(() => {
                this.activeRevealTimer = undefined;
                this.zone.run(() => this.showActiveVisual());
            }, CX_ACTION_AREA_REVEAL_DELAY_MS);
        });
    }
    showActiveVisual() {
        if (!this.hasInteractionIntent$() || this.visualActiveState()) {
            return;
        }
        this.visualActiveState.set(true);
        this.changeDetector.detectChanges();
    }
    hideActiveVisual() {
        this.clearActiveRevealTimer();
        if (!this.visualActiveState()) {
            return;
        }
        this.visualActiveState.set(false);
        this.changeDetector.detectChanges();
    }
    clearActiveRevealTimer() {
        if (this.activeRevealTimer === undefined || typeof window === 'undefined') {
            this.activeRevealTimer = undefined;
            return;
        }
        window.clearTimeout(this.activeRevealTimer);
        this.activeRevealTimer = undefined;
    }
    emitAction(action, source) {
        const { key: _key, ...publicAction } = action;
        this.actionSelect.emit({
            id: action.id,
            action: publicAction,
            source,
        });
    }
    observeActionAreaSize() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        const rail = this.actionsRail;
        if (!rail || typeof ResizeObserver === 'undefined') {
            return;
        }
        this.zone.runOutsideAngular(() => {
            this.resizeObserver = new ResizeObserver(() => this.scheduleFitMeasurement());
            this.resizeObserver.observe(this.host.nativeElement);
            this.resizeObserver.observe(rail);
        });
    }
    scheduleFitMeasurement() {
        if (typeof requestAnimationFrame === 'undefined' || this.measurementFrame !== undefined) {
            return;
        }
        this.zone.runOutsideAngular(() => {
            this.measurementFrame = requestAnimationFrame(() => {
                this.measurementFrame = undefined;
                this.measureFitMode();
            });
        });
    }
    measureFitMode() {
        const rail = this.actionsRail;
        if (!rail || !this.isInteractive$()) {
            this.setFitMode('full');
            return;
        }
        if (this.measuring) {
            return;
        }
        this.measuring = true;
        try {
            this.setFitMode('full');
            if (!this.actionRailOverflows(rail)) {
                return;
            }
            this.setFitMode('compact');
            if (!this.actionRailOverflows(rail)) {
                return;
            }
            this.setFitMode('icon');
        }
        finally {
            this.measuring = false;
        }
    }
    setFitMode(mode) {
        if (this.fitModeState() === mode) {
            return;
        }
        this.zone.run(() => {
            this.fitModeState.set(mode);
            this.changeDetector.detectChanges();
        });
    }
    actionRailOverflows(rail) {
        const buttons = Array.from(rail.querySelectorAll('.cx-action-area__action'));
        if (buttons.length === 0) {
            return false;
        }
        const railRect = rail.getBoundingClientRect();
        const buttonRects = buttons.map(button => button.getBoundingClientRect());
        const contentLeft = Math.min(...buttonRects.map(rect => rect.left));
        const contentRight = Math.max(...buttonRects.map(rect => rect.right));
        const style = getComputedStyle(rail);
        const inlinePadding = Number.parseFloat(style.paddingInlineStart || style.paddingLeft || '0') +
            Number.parseFloat(style.paddingInlineEnd || style.paddingRight || '0');
        return contentRight - contentLeft + inlinePadding > railRect.width + 1;
    }
    normalizeActions(value) {
        return (value ?? [])
            .filter(action => action && typeof action.id === 'string')
            .map((action, index) => {
            const id = action.id.trim();
            const text = action.text?.trim() || this.humanizeActionId(id);
            const shortcutParts = normalizeShortcutParts(action.shortcutParts);
            return {
                ...action,
                id,
                text,
                icon: action.icon,
                ariaLabel: action.ariaLabel?.trim() || undefined,
                shortcutParts: shortcutParts.length > 0 ? shortcutParts : undefined,
                disabled: action.disabled === true,
                key: `${id || 'action'}-${index}`,
            };
        })
            .filter(action => action.id.length > 0);
    }
    humanizeActionId(id) {
        return id
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || 'Action';
    }
    hasDomFocus() {
        const activeElement = typeof document === 'undefined' ? null : document.activeElement;
        return activeElement instanceof Node && this.host.nativeElement.contains(activeElement);
    }
    shortcutLabel(parts) {
        return normalizeShortcutParts(parts).join('+');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxActionAreaComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxActionAreaComponent, isStandalone: true, selector: "cx-action-area", inputs: { actions: "actions", info: "info", askAi: "askAi", support: "support", editable: "editable", ariaLabel: "ariaLabel", disabled: "disabled", shortcutsEnabled: "shortcutsEnabled" }, outputs: { actionSelect: "actionSelect" }, host: { listeners: { "pointerenter": "onPointerEnter()", "pointerleave": "onPointerLeave()", "focusin": "onFocusIn()", "focus": "onFocus()", "focusout": "onFocusOut($event)", "blur": "onBlur($event)", "document:keydown": "onDocumentKeydown($event)" }, properties: { "class.cx-action-area-host--interactive": "this.interactiveClass", "class.cx-action-area-host--active": "this.activeClass", "class.cx-action-area-host--disabled": "this.disabledClass", "class.cx-action-area-host--compact": "this.compactClass", "class.cx-action-area-host--icon": "this.iconClass", "attr.role": "this.hostRole", "attr.aria-label": "this.hostAriaLabel", "attr.tabindex": "this.hostTabIndex" } }, viewQueries: [{ propertyName: "actionsRailRef", first: true, predicate: ["actionsRail"], descendants: true }], ngImport: i0, template: "<ng-content />\n\n@if (isInteractive$()) {\n  <div #actionsRail class=\"cx-action-area__actions\" role=\"group\" aria-label=\"Actions\">\n    @for (action of visibleActions$(); track action.key) {\n      <cx-tooltip\n        class=\"cx-action-area__action-tooltip\"\n        position=\"top\"\n        [text]=\"actionTooltipText(action)\"\n        [disabled]=\"!actionTooltipText(action)\"\n      >\n        <cx-button\n          class=\"cx-action-area__action\"\n          size=\"small\"\n          [text]=\"actionText(action)\"\n          [icon]=\"action.icon\"\n          [shortcutParts]=\"actionShortcutParts(action)\"\n          [ariaLabel]=\"actionAriaLabel(action)\"\n          [disabled]=\"action.disabled === true\"\n          (pointerdown)=\"onActionPointerDown($event)\"\n          (click)=\"onActionClick($event)\"\n          (pressed)=\"onActionPressed(action)\"\n        />\n      </cx-tooltip>\n    }\n  </div>\n}\n", styles: [":host{--cx-action-area-reveal-duration: 300ms;display:block;position:relative;min-width:0;border-radius:var(--radius-md);box-sizing:border-box;outline:2px solid rgba(0,0,0,0);outline-offset:2px;transition:outline-color var(--cx-action-area-reveal-duration) var(--ease-out)}:host(.cx-action-area-host--active){outline-color:var(--primary)}:host(.cx-action-area-host--disabled){outline-color:rgba(0,0,0,0)}.cx-action-area__actions{position:absolute;inset-block-start:var(--space-sm);inset-inline-end:var(--space-sm);display:flex;width:max-content;max-width:calc(100% - var(--space-md));flex-wrap:nowrap;align-items:center;justify-content:flex-end;gap:var(--space-xs);padding:var(--space-xs);border:var(--line-discreet);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-low);opacity:0;pointer-events:none;transform:translateY(calc(var(--space-xs) * -1));transition:opacity var(--cx-action-area-reveal-duration) var(--ease-out),transform var(--cx-action-area-reveal-duration) var(--ease-out)}:host(.cx-action-area-host--active) .cx-action-area__actions{opacity:1;pointer-events:auto;transform:translateY(0)}.cx-action-area__action{flex:0 0 auto}.cx-action-area__action-tooltip{flex:0 0 auto}@media(prefers-reduced-motion: reduce){:host,.cx-action-area__actions{transition:none}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxTooltipComponent, selector: "cx-tooltip", inputs: ["text", "delay", "disabled", "position", "onlyWhenTruncated"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxActionAreaComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-action-area', imports: [CxButtonComponent, CxTooltipComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<ng-content />\n\n@if (isInteractive$()) {\n  <div #actionsRail class=\"cx-action-area__actions\" role=\"group\" aria-label=\"Actions\">\n    @for (action of visibleActions$(); track action.key) {\n      <cx-tooltip\n        class=\"cx-action-area__action-tooltip\"\n        position=\"top\"\n        [text]=\"actionTooltipText(action)\"\n        [disabled]=\"!actionTooltipText(action)\"\n      >\n        <cx-button\n          class=\"cx-action-area__action\"\n          size=\"small\"\n          [text]=\"actionText(action)\"\n          [icon]=\"action.icon\"\n          [shortcutParts]=\"actionShortcutParts(action)\"\n          [ariaLabel]=\"actionAriaLabel(action)\"\n          [disabled]=\"action.disabled === true\"\n          (pointerdown)=\"onActionPointerDown($event)\"\n          (click)=\"onActionClick($event)\"\n          (pressed)=\"onActionPressed(action)\"\n        />\n      </cx-tooltip>\n    }\n  </div>\n}\n", styles: [":host{--cx-action-area-reveal-duration: 300ms;display:block;position:relative;min-width:0;border-radius:var(--radius-md);box-sizing:border-box;outline:2px solid rgba(0,0,0,0);outline-offset:2px;transition:outline-color var(--cx-action-area-reveal-duration) var(--ease-out)}:host(.cx-action-area-host--active){outline-color:var(--primary)}:host(.cx-action-area-host--disabled){outline-color:rgba(0,0,0,0)}.cx-action-area__actions{position:absolute;inset-block-start:var(--space-sm);inset-inline-end:var(--space-sm);display:flex;width:max-content;max-width:calc(100% - var(--space-md));flex-wrap:nowrap;align-items:center;justify-content:flex-end;gap:var(--space-xs);padding:var(--space-xs);border:var(--line-discreet);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-low);opacity:0;pointer-events:none;transform:translateY(calc(var(--space-xs) * -1));transition:opacity var(--cx-action-area-reveal-duration) var(--ease-out),transform var(--cx-action-area-reveal-duration) var(--ease-out)}:host(.cx-action-area-host--active) .cx-action-area__actions{opacity:1;pointer-events:auto;transform:translateY(0)}.cx-action-area__action{flex:0 0 auto}.cx-action-area__action-tooltip{flex:0 0 auto}@media(prefers-reduced-motion: reduce){:host,.cx-action-area__actions{transition:none}}"] }]
        }], propDecorators: { actions: [{
                type: Input
            }], info: [{
                type: Input
            }], askAi: [{
                type: Input
            }], support: [{
                type: Input
            }], editable: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], shortcutsEnabled: [{
                type: Input
            }], actionSelect: [{
                type: Output
            }], actionsRailRef: [{
                type: ViewChild,
                args: ['actionsRail']
            }], interactiveClass: [{
                type: HostBinding,
                args: ['class.cx-action-area-host--interactive']
            }], activeClass: [{
                type: HostBinding,
                args: ['class.cx-action-area-host--active']
            }], disabledClass: [{
                type: HostBinding,
                args: ['class.cx-action-area-host--disabled']
            }], compactClass: [{
                type: HostBinding,
                args: ['class.cx-action-area-host--compact']
            }], iconClass: [{
                type: HostBinding,
                args: ['class.cx-action-area-host--icon']
            }], hostRole: [{
                type: HostBinding,
                args: ['attr.role']
            }], hostAriaLabel: [{
                type: HostBinding,
                args: ['attr.aria-label']
            }], hostTabIndex: [{
                type: HostBinding,
                args: ['attr.tabindex']
            }], onPointerEnter: [{
                type: HostListener,
                args: ['pointerenter']
            }], onPointerLeave: [{
                type: HostListener,
                args: ['pointerleave']
            }], onFocusIn: [{
                type: HostListener,
                args: ['focusin']
            }], onFocus: [{
                type: HostListener,
                args: ['focus']
            }], onFocusOut: [{
                type: HostListener,
                args: ['focusout', ['$event']]
            }], onBlur: [{
                type: HostListener,
                args: ['blur', ['$event']]
            }], onDocumentKeydown: [{
                type: HostListener,
                args: ['document:keydown', ['$event']]
            }] } });
