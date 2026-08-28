import { A11yModule, CdkTrapFocus, InteractivityChecker } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, signal, } from '@angular/core';
import { CxButtonComponent, } from '../../actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts.js';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { CxMenuComponent, CxMenuTriggerDirective } from '../cx-menu/index.js';
import { CxDismissRequest } from '../dismiss-request.js';
import { CxOverlayStateService } from '../overlay-state.js';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
let cxDialogId = 0;
const CX_DIALOG_PRIMARY_SHORTCUT = ['Mod', 'Enter'];
const CX_DIALOG_SECONDARY_SHORTCUT = ['Esc'];
export class CxDialogComponent {
    document = inject(DOCUMENT);
    interactivityChecker = inject(InteractivityChecker);
    overlayState = inject(CxOverlayStateService);
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    menuOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuOpenState" }] : /* istanbul ignore next */ []));
    openInput = false;
    overlayHandle;
    dialogElement;
    focusMutationObserver;
    focusPortalObserver;
    focusCheckQueued = false;
    initialFocusPending = false;
    documentFocusInListener = () => this.queueFocusOwnershipCheck();
    focusTrapDirective;
    set dialogRootRef(value) {
        this.stopFocusOwnership();
        if (!value) {
            return;
        }
        this.dialogElement = value.nativeElement;
        this.startFocusOwnership(value.nativeElement);
    }
    titleId = `cx-dialog-title-${++cxDialogId}`;
    descriptionId = `cx-dialog-description-${cxDialogId}`;
    isOpen$ = this.openState.asReadonly();
    primaryShortcutParts = CX_DIALOG_PRIMARY_SHORTCUT;
    secondaryShortcutParts = CX_DIALOG_SECONDARY_SHORTCUT;
    primaryShortcutAria = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
        ? 'Meta+Enter'
        : 'Control+Enter';
    variant = 'info';
    size = 'default';
    dismissible = false;
    dismissOnClickOutside = false;
    heading = '';
    description = '';
    primaryText = '';
    primaryDisabled = false;
    primaryLoading = false;
    mood = 'primary';
    secondaryText = '';
    closeOnPrimary = true;
    closeOnSecondary = true;
    menuItems;
    menuAriaLabel;
    set open(value) {
        this.openInput = Boolean(value);
        this.syncOpen(this.openInput);
    }
    openChange = new EventEmitter();
    /** Synchronous request emitted before a user dismissal would close this dialog. */
    dismissRequest = new EventEmitter();
    primary = new EventEmitter();
    secondary = new EventEmitter();
    dismiss = new EventEmitter();
    menuItemSelect = new EventEmitter();
    ngOnChanges() {
        this.syncOpen(this.openInput);
    }
    ngOnDestroy() {
        this.stopFocusOwnership();
        this.releaseOverlay();
    }
    isModal() {
        return this.variant === 'confirm';
    }
    dialogRole() {
        return this.isModal() ? 'alertdialog' : 'dialog';
    }
    resolvedPrimaryText() {
        const trimmedLabel = this.primaryText.trim();
        if (trimmedLabel.length > 0) {
            return trimmedLabel;
        }
        return this.variant === 'info' ? 'Close' : 'Confirm';
    }
    resolvedSecondaryText() {
        if (this.variant !== 'confirm') {
            return undefined;
        }
        const trimmedLabel = this.secondaryText.trim();
        return trimmedLabel.length > 0 ? trimmedLabel : 'Cancel';
    }
    showPrimaryShortcut() {
        return !this.primaryDisabled && !this.primaryLoading;
    }
    dialogShortcutAria() {
        const shortcuts = [];
        if (this.variant === 'confirm' || this.canDismiss()) {
            shortcuts.push('Escape');
        }
        if (this.showPrimaryShortcut()) {
            shortcuts.push(this.primaryShortcutAria);
        }
        return shortcuts.length > 0 ? shortcuts.join(' ') : null;
    }
    hasDescription() {
        return this.description.trim().length > 0;
    }
    hasHeading() {
        return this.heading.trim().length > 0;
    }
    hasMenuItems() {
        return (this.menuItems?.length ?? 0) > 0;
    }
    canDismiss() {
        return this.dismissible;
    }
    hasHeaderActions() {
        return this.hasMenuItems() || this.canDismiss();
    }
    resolvedMenuAriaLabel() {
        const label = this.menuAriaLabel?.trim();
        if (label) {
            return label;
        }
        const heading = this.heading.trim();
        return heading ? `${heading} actions` : 'Dialog actions';
    }
    onBackdropClick() {
        if (!this.dismissOnClickOutside) {
            return;
        }
        this.dismissFromUser();
    }
    onBackdropMousedown(event) {
        if (event.target === event.currentTarget) {
            event.preventDefault();
        }
    }
    onDismiss() {
        if (!this.canDismiss()) {
            return;
        }
        this.dismissFromUser();
    }
    dismissFromUser() {
        if (!this.requestDismiss('dismiss')) {
            return;
        }
        this.dismiss.emit();
        this.closeFromUser();
    }
    onPrimary() {
        if (this.primaryDisabled || this.primaryLoading) {
            return;
        }
        this.primary.emit();
        if (this.closeOnPrimary) {
            this.closeFromUser();
        }
    }
    onSecondary() {
        if (this.closeOnSecondary && !this.requestDismiss('cancel')) {
            return;
        }
        this.secondary.emit();
        if (this.closeOnSecondary) {
            this.closeFromUser();
        }
    }
    onMenuOpenChange(open) {
        this.menuOpenState.set(open);
    }
    onMenuItemSelect(itemId) {
        this.menuItemSelect.emit(itemId);
    }
    onDialogKeydown(event) {
        if (event.key === 'Tab'
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey
            && this.document.activeElement === this.dialogElement) {
            event.preventDefault();
            event.stopPropagation();
            const focusTrap = this.focusTrapDirective?.focusTrap;
            const moved = event.shiftKey
                ? focusTrap?.focusLastTabbableElement({ preventScroll: true })
                : focusTrap?.focusFirstTabbableElement({ preventScroll: true });
            if (!moved) {
                this.focusDialogFallback();
            }
            return;
        }
        if (event.isComposing || this.menuOpenState()) {
            return;
        }
        if (eventMatchesShortcut(CX_DIALOG_PRIMARY_SHORTCUT, event)) {
            event.preventDefault();
            event.stopPropagation();
            this.onPrimary();
        }
    }
    closeFromUser() {
        this.openInput = false;
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
                surface: () => this.dialogElement?.parentElement ?? undefined,
                isActive: () => this.openState() && isHostVisible(this.dialogElement),
                onEscape: () => this.onEscape(),
            });
        }
        else {
            this.releaseOverlay();
        }
        this.openState.set(nextOpen);
    }
    onEscape() {
        if (this.menuOpenState()) {
            return;
        }
        if (this.variant === 'confirm') {
            this.onSecondary();
            return;
        }
        if (this.canDismiss()) {
            this.onDismiss();
        }
    }
    startFocusOwnership(dialogElement) {
        this.initialFocusPending = true;
        this.document.addEventListener('focusin', this.documentFocusInListener, true);
        if (typeof MutationObserver !== 'undefined') {
            this.focusMutationObserver = new MutationObserver(() => this.queueFocusOwnershipCheck());
            this.focusMutationObserver.observe(dialogElement, {
                attributes: true,
                attributeFilter: [
                    'aria-disabled',
                    'aria-expanded',
                    'aria-hidden',
                    'class',
                    'contenteditable',
                    'disabled',
                    'hidden',
                    'href',
                    'inert',
                    'style',
                    'tabindex',
                    'type',
                ],
                childList: true,
                subtree: true,
            });
            // Framework popovers are direct body portals. Removing their focused
            // surface does not necessarily emit focusin or mutate the dialog tree.
            this.focusPortalObserver = new MutationObserver(() => this.queueFocusOwnershipCheck());
            this.focusPortalObserver.observe(this.document.body, { childList: true });
        }
        queueMicrotask(() => this.focusInitialTarget(dialogElement));
    }
    stopFocusOwnership() {
        this.focusMutationObserver?.disconnect();
        this.focusMutationObserver = undefined;
        this.focusPortalObserver?.disconnect();
        this.focusPortalObserver = undefined;
        this.document.removeEventListener('focusin', this.documentFocusInListener, true);
        this.dialogElement = undefined;
        this.focusCheckQueued = false;
        this.initialFocusPending = false;
    }
    focusInitialTarget(dialogElement) {
        if (this.dialogElement !== dialogElement) {
            return;
        }
        this.initialFocusPending = false;
        if (!this.canOwnFocus(dialogElement)) {
            return;
        }
        if (!this.hasValidOwnedFocus(dialogElement)) {
            this.rehomeFocus();
        }
    }
    queueFocusOwnershipCheck() {
        if (this.focusCheckQueued) {
            return;
        }
        this.focusCheckQueued = true;
        queueMicrotask(() => {
            this.focusCheckQueued = false;
            if (!this.initialFocusPending) {
                this.ensureFocusOwnership();
            }
        });
    }
    ensureFocusOwnership() {
        const dialogElement = this.dialogElement;
        if (!dialogElement
            || !this.canOwnFocus(dialogElement)
            || this.hasValidOwnedFocus(dialogElement)) {
            return;
        }
        this.rehomeFocus();
    }
    rehomeFocus() {
        const dialogElement = this.dialogElement;
        if (!dialogElement || !this.canOwnFocus(dialogElement)) {
            return;
        }
        const focusTrap = this.focusTrapDirective?.focusTrap;
        const moved = focusTrap?.focusInitialElement({ preventScroll: true });
        if (!moved || !this.hasValidOwnedFocus(dialogElement)) {
            this.focusDialogFallback();
        }
    }
    focusDialogFallback() {
        this.dialogElement?.focus({ preventScroll: true });
    }
    canOwnFocus(dialogElement) {
        return (this.openState()
            && this.overlayState.isTopmost(this.overlayHandle)
            && isHostVisible(dialogElement));
    }
    hasValidOwnedFocus(dialogElement) {
        const activeElement = this.document.activeElement;
        if (typeof HTMLElement === 'undefined'
            || !(activeElement instanceof HTMLElement)
            || !dialogElement.contains(activeElement)) {
            return false;
        }
        if (activeElement.matches(':disabled')
            || activeElement.closest('[aria-disabled="true"], [aria-hidden="true"], [hidden], [inert]')) {
            return false;
        }
        return this.interactivityChecker.isFocusable(activeElement);
    }
    releaseOverlay() {
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDialogComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDialogComponent, isStandalone: true, selector: "cx-dialog", inputs: { variant: "variant", size: "size", dismissible: "dismissible", dismissOnClickOutside: "dismissOnClickOutside", heading: "heading", description: "description", primaryText: "primaryText", primaryDisabled: "primaryDisabled", primaryLoading: "primaryLoading", mood: "mood", secondaryText: "secondaryText", closeOnPrimary: "closeOnPrimary", closeOnSecondary: "closeOnSecondary", menuItems: "menuItems", menuAriaLabel: "menuAriaLabel", open: "open" }, outputs: { openChange: "openChange", dismissRequest: "dismissRequest", primary: "primary", secondary: "secondary", dismiss: "dismiss", menuItemSelect: "menuItemSelect" }, viewQueries: [{ propertyName: "focusTrapDirective", first: true, predicate: CdkTrapFocus, descendants: true }, { propertyName: "dialogRootRef", first: true, predicate: ["dialogRoot"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "@if (isOpen$()) {\n  <div\n    class=\"cx-dialog-backdrop\"\n    role=\"presentation\"\n    (click)=\"onBackdropClick()\"\n    (mousedown)=\"onBackdropMousedown($event)\"\n  >\n    <section\n      #dialogRoot\n      class=\"cx-dialog\"\n      cdkTrapFocus\n      tabindex=\"-1\"\n      [class.cx-dialog--confirm]=\"variant === 'confirm'\"\n      [class.cx-dialog--info]=\"variant === 'info'\"\n      [class.cx-dialog--small]=\"size === 'small'\"\n      [class.cx-dialog--large]=\"size === 'large'\"\n      [class.cx-dialog--dismissible]=\"canDismiss()\"\n      [attr.role]=\"dialogRole()\"\n      aria-modal=\"true\"\n      [attr.aria-labelledby]=\"hasHeading() ? titleId : descriptionId\"\n      [attr.aria-describedby]=\"hasHeading() && hasDescription() ? descriptionId : null\"\n      [attr.aria-keyshortcuts]=\"dialogShortcutAria()\"\n      (click)=\"$event.stopPropagation()\"\n      (keydown)=\"onDialogKeydown($event)\"\n    >\n      <div class=\"cx-dialog__content\">\n        @if (hasHeading() || hasHeaderActions()) {\n        <header class=\"cx-dialog__header\">\n          @if (hasHeading()) {\n            <h2 class=\"cx-dialog__title\" [id]=\"titleId\" tabindex=\"-1\">{{ heading }}</h2>\n          }\n\n          @if (hasHeaderActions()) {\n            <div class=\"cx-dialog__header-actions\">\n              @if (hasMenuItems()) {\n                <cx-menu\n                  [presentation]=\"{ kind: 'trigger' }\"\n                  class=\"cx-dialog__menu\"\n                  [items]=\"menuItems ?? []\"\n                  [ariaLabel]=\"resolvedMenuAriaLabel()\"\n                  align=\"end\"\n                  (openChange)=\"onMenuOpenChange($event)\"\n                  (itemSelect)=\"onMenuItemSelect($event)\"\n                >\n                  <cx-icon-button\n                    cxMenuTrigger\n                    icon=\"menu-vertical\"\n                    variant=\"transparent\"\n                    [ariaLabel]=\"resolvedMenuAriaLabel()\"\n                  />\n                </cx-menu>\n              }\n\n              @if (canDismiss()) {\n                <cx-icon-button\n                  icon=\"remove\"\n                  ariaLabel=\"Dismiss dialog\"\n                  variant=\"transparent\"\n                  (pressed)=\"onDismiss()\"\n                />\n              }\n            </div>\n          }\n        </header>\n        }\n\n        <div class=\"cx-dialog__body\">\n          @if (hasDescription()) {\n            <p class=\"cx-dialog__description\" [id]=\"descriptionId\">{{ description }}</p>\n          }\n\n          <ng-content select=\"[body]\" />\n        </div>\n      </div>\n\n      <footer\n        class=\"cx-dialog__footer\"\n        [class.cx-dialog__footer--single]=\"!resolvedSecondaryText()\"\n      >\n        @if (resolvedSecondaryText(); as secondaryText) {\n          <div class=\"cx-dialog__footer-action cx-dialog__footer-action--start\">\n            <cx-button\n              [text]=\"secondaryText\"\n              mood=\"default\"\n              [attr.cdkFocusInitial]=\"showPrimaryShortcut() ? null : ''\"\n              (pressed)=\"onSecondary()\"\n            />\n\n            <div class=\"cx-dialog__footer-shortcut\" aria-hidden=\"true\">\n              <cx-shortcut-key [parts]=\"secondaryShortcutParts\" />\n            </div>\n          </div>\n        }\n\n        <div class=\"cx-dialog__footer-action cx-dialog__footer-action--end\">\n          @if (showPrimaryShortcut()) {\n            <div class=\"cx-dialog__footer-shortcut cx-dialog__footer-shortcut--combo\" aria-hidden=\"true\">\n              <cx-shortcut-key [parts]=\"primaryShortcutParts\" />\n            </div>\n          }\n\n          <cx-button\n            [text]=\"resolvedPrimaryText()\"\n            [mood]=\"mood\"\n            [disabled]=\"primaryDisabled\"\n            [loading]=\"primaryLoading\"\n            [attr.cdkFocusInitial]=\"showPrimaryShortcut() ? '' : null\"\n            (pressed)=\"onPrimary()\"\n          />\n        </div>\n      </footer>\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-dialog-backdrop{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:center;justify-content:center;padding:var(--space-md);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-dialog{position:relative;top:0;display:flex;width:auto;min-width:min(95vw,var(--controller-size)*12.5);max-width:min(95vw,var(--controller-size)*20);max-height:min(75vh,100vh - var(--space-md)*2);flex-direction:column;gap:var(--surface-separation);overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-lg);background:var(--surface-alt);box-shadow:var(--shadow-high);box-sizing:border-box;color:var(--ink);opacity:1;padding:var(--surface-separation);animation:cx-dialog-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-dialog--confirm{min-width:min(95vw,var(--controller-size)*12.5)}.cx-dialog--small{min-width:min(95vw,var(--controller-size)*11.25);max-width:min(95vw,var(--controller-size)*12.5)}.cx-dialog--large{width:min(95vw,var(--controller-size)*24);min-width:min(95vw,var(--controller-size)*20);max-height:min(86vh,100vh - var(--space-md)*2)}.cx-dialog__content{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-lg);background:var(--surface)}.cx-dialog__header{display:flex;min-width:0;flex:0 0 auto;align-items:center;gap:var(--space-md);padding:var(--space-md) var(--space-md) 0;box-sizing:border-box}.cx-dialog__title{min-width:0;flex:1 1 auto;margin:0;color:currentColor;font-size:var(--font-size-title-1);font-weight:var(--font-weight-bold);line-height:1.15;overflow-wrap:anywhere}.cx-dialog__header-actions{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:var(--space-xs)}.cx-dialog__menu{display:inline-flex}.cx-dialog__body{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;gap:var(--space-md);padding:var(--space-md);overflow:auto;line-height:var(--line-height-body)}.cx-dialog__description{max-width:65ch;margin:0;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-dialog__footer{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:var(--space-md);padding:var(--space-sm);background:var(--surface-alt)}.cx-dialog__footer--single{justify-content:flex-end}.cx-dialog__footer-action{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-dialog__footer-action--end{justify-content:flex-end}.cx-dialog__footer-shortcut{display:inline-flex;flex:0 0 auto;align-items:center;opacity:0;pointer-events:none;transform:translateY(2px);transition:opacity calc(var(--motion-base) + var(--motion-fast)) ease,transform calc(var(--motion-base) + var(--motion-fast)) ease;transition-delay:0s}.cx-dialog__footer:hover .cx-dialog__footer-shortcut{opacity:1;transform:translateY(0);transition-delay:1s}@keyframes cx-dialog-enter{from{top:1rem;opacity:0}to{top:0;opacity:1}}@media(prefers-reduced-motion: reduce){.cx-dialog{animation:none}.cx-dialog__footer-shortcut{transition:opacity 0s linear,transform 0s linear}}@media(hover: none),(max-width: 480px){.cx-dialog__footer-shortcut{display:none}}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxShortcutKeyComponent, selector: "cx-shortcut-key", inputs: ["parts"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDialogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-dialog', imports: [
                        A11yModule,
                        CxButtonComponent,
                        CxIconButtonComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxShortcutKeyComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isOpen$()) {\n  <div\n    class=\"cx-dialog-backdrop\"\n    role=\"presentation\"\n    (click)=\"onBackdropClick()\"\n    (mousedown)=\"onBackdropMousedown($event)\"\n  >\n    <section\n      #dialogRoot\n      class=\"cx-dialog\"\n      cdkTrapFocus\n      tabindex=\"-1\"\n      [class.cx-dialog--confirm]=\"variant === 'confirm'\"\n      [class.cx-dialog--info]=\"variant === 'info'\"\n      [class.cx-dialog--small]=\"size === 'small'\"\n      [class.cx-dialog--large]=\"size === 'large'\"\n      [class.cx-dialog--dismissible]=\"canDismiss()\"\n      [attr.role]=\"dialogRole()\"\n      aria-modal=\"true\"\n      [attr.aria-labelledby]=\"hasHeading() ? titleId : descriptionId\"\n      [attr.aria-describedby]=\"hasHeading() && hasDescription() ? descriptionId : null\"\n      [attr.aria-keyshortcuts]=\"dialogShortcutAria()\"\n      (click)=\"$event.stopPropagation()\"\n      (keydown)=\"onDialogKeydown($event)\"\n    >\n      <div class=\"cx-dialog__content\">\n        @if (hasHeading() || hasHeaderActions()) {\n        <header class=\"cx-dialog__header\">\n          @if (hasHeading()) {\n            <h2 class=\"cx-dialog__title\" [id]=\"titleId\" tabindex=\"-1\">{{ heading }}</h2>\n          }\n\n          @if (hasHeaderActions()) {\n            <div class=\"cx-dialog__header-actions\">\n              @if (hasMenuItems()) {\n                <cx-menu\n                  [presentation]=\"{ kind: 'trigger' }\"\n                  class=\"cx-dialog__menu\"\n                  [items]=\"menuItems ?? []\"\n                  [ariaLabel]=\"resolvedMenuAriaLabel()\"\n                  align=\"end\"\n                  (openChange)=\"onMenuOpenChange($event)\"\n                  (itemSelect)=\"onMenuItemSelect($event)\"\n                >\n                  <cx-icon-button\n                    cxMenuTrigger\n                    icon=\"menu-vertical\"\n                    variant=\"transparent\"\n                    [ariaLabel]=\"resolvedMenuAriaLabel()\"\n                  />\n                </cx-menu>\n              }\n\n              @if (canDismiss()) {\n                <cx-icon-button\n                  icon=\"remove\"\n                  ariaLabel=\"Dismiss dialog\"\n                  variant=\"transparent\"\n                  (pressed)=\"onDismiss()\"\n                />\n              }\n            </div>\n          }\n        </header>\n        }\n\n        <div class=\"cx-dialog__body\">\n          @if (hasDescription()) {\n            <p class=\"cx-dialog__description\" [id]=\"descriptionId\">{{ description }}</p>\n          }\n\n          <ng-content select=\"[body]\" />\n        </div>\n      </div>\n\n      <footer\n        class=\"cx-dialog__footer\"\n        [class.cx-dialog__footer--single]=\"!resolvedSecondaryText()\"\n      >\n        @if (resolvedSecondaryText(); as secondaryText) {\n          <div class=\"cx-dialog__footer-action cx-dialog__footer-action--start\">\n            <cx-button\n              [text]=\"secondaryText\"\n              mood=\"default\"\n              [attr.cdkFocusInitial]=\"showPrimaryShortcut() ? null : ''\"\n              (pressed)=\"onSecondary()\"\n            />\n\n            <div class=\"cx-dialog__footer-shortcut\" aria-hidden=\"true\">\n              <cx-shortcut-key [parts]=\"secondaryShortcutParts\" />\n            </div>\n          </div>\n        }\n\n        <div class=\"cx-dialog__footer-action cx-dialog__footer-action--end\">\n          @if (showPrimaryShortcut()) {\n            <div class=\"cx-dialog__footer-shortcut cx-dialog__footer-shortcut--combo\" aria-hidden=\"true\">\n              <cx-shortcut-key [parts]=\"primaryShortcutParts\" />\n            </div>\n          }\n\n          <cx-button\n            [text]=\"resolvedPrimaryText()\"\n            [mood]=\"mood\"\n            [disabled]=\"primaryDisabled\"\n            [loading]=\"primaryLoading\"\n            [attr.cdkFocusInitial]=\"showPrimaryShortcut() ? '' : null\"\n            (pressed)=\"onPrimary()\"\n          />\n        </div>\n      </footer>\n    </section>\n  </div>\n}\n", styles: [":host{display:contents}.cx-dialog-backdrop{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:center;justify-content:center;padding:var(--space-md);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));box-sizing:border-box}.cx-dialog{position:relative;top:0;display:flex;width:auto;min-width:min(95vw,var(--controller-size)*12.5);max-width:min(95vw,var(--controller-size)*20);max-height:min(75vh,100vh - var(--space-md)*2);flex-direction:column;gap:var(--surface-separation);overflow:hidden;border:var(--floating-surface-border);border-radius:var(--radius-lg);background:var(--surface-alt);box-shadow:var(--shadow-high);box-sizing:border-box;color:var(--ink);opacity:1;padding:var(--surface-separation);animation:cx-dialog-enter calc(var(--motion-slow)*2) var(--ease-out-strong)}.cx-dialog--confirm{min-width:min(95vw,var(--controller-size)*12.5)}.cx-dialog--small{min-width:min(95vw,var(--controller-size)*11.25);max-width:min(95vw,var(--controller-size)*12.5)}.cx-dialog--large{width:min(95vw,var(--controller-size)*24);min-width:min(95vw,var(--controller-size)*20);max-height:min(86vh,100vh - var(--space-md)*2)}.cx-dialog__content{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-lg);background:var(--surface)}.cx-dialog__header{display:flex;min-width:0;flex:0 0 auto;align-items:center;gap:var(--space-md);padding:var(--space-md) var(--space-md) 0;box-sizing:border-box}.cx-dialog__title{min-width:0;flex:1 1 auto;margin:0;color:currentColor;font-size:var(--font-size-title-1);font-weight:var(--font-weight-bold);line-height:1.15;overflow-wrap:anywhere}.cx-dialog__header-actions{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:var(--space-xs)}.cx-dialog__menu{display:inline-flex}.cx-dialog__body{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;gap:var(--space-md);padding:var(--space-md);overflow:auto;line-height:var(--line-height-body)}.cx-dialog__description{max-width:65ch;margin:0;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-dialog__footer{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:var(--space-md);padding:var(--space-sm);background:var(--surface-alt)}.cx-dialog__footer--single{justify-content:flex-end}.cx-dialog__footer-action{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-dialog__footer-action--end{justify-content:flex-end}.cx-dialog__footer-shortcut{display:inline-flex;flex:0 0 auto;align-items:center;opacity:0;pointer-events:none;transform:translateY(2px);transition:opacity calc(var(--motion-base) + var(--motion-fast)) ease,transform calc(var(--motion-base) + var(--motion-fast)) ease;transition-delay:0s}.cx-dialog__footer:hover .cx-dialog__footer-shortcut{opacity:1;transform:translateY(0);transition-delay:1s}@keyframes cx-dialog-enter{from{top:1rem;opacity:0}to{top:0;opacity:1}}@media(prefers-reduced-motion: reduce){.cx-dialog{animation:none}.cx-dialog__footer-shortcut{transition:opacity 0s linear,transform 0s linear}}@media(hover: none),(max-width: 480px){.cx-dialog__footer-shortcut{display:none}}"] }]
        }], propDecorators: { focusTrapDirective: [{
                type: ViewChild,
                args: [CdkTrapFocus]
            }], dialogRootRef: [{
                type: ViewChild,
                args: ['dialogRoot', { read: ElementRef }]
            }], variant: [{
                type: Input
            }], size: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], dismissOnClickOutside: [{
                type: Input
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], primaryText: [{
                type: Input
            }], primaryDisabled: [{
                type: Input
            }], primaryLoading: [{
                type: Input
            }], mood: [{
                type: Input
            }], secondaryText: [{
                type: Input
            }], closeOnPrimary: [{
                type: Input
            }], closeOnSecondary: [{
                type: Input
            }], menuItems: [{
                type: Input
            }], menuAriaLabel: [{
                type: Input
            }], open: [{
                type: Input
            }], openChange: [{
                type: Output
            }], dismissRequest: [{
                type: Output
            }], primary: [{
                type: Output
            }], secondary: [{
                type: Output
            }], dismiss: [{
                type: Output
            }], menuItemSelect: [{
                type: Output
            }] } });
