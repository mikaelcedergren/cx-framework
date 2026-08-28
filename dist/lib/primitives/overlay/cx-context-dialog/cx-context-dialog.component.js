import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import { CxOverlayStateService } from '../overlay-state.js';
import * as i0 from "@angular/core";
let cxContextDialogId = 0;
export class CxContextDialogComponent {
    host = inject(ElementRef);
    overlayState = inject(CxOverlayStateService);
    instanceId = ++cxContextDialogId;
    overlayHandle;
    destroying = false;
    constructor() {
        this.overlayHandle = this.overlayState.capture({
            kind: 'transient',
            restoreFocus: true,
            surface: () => this.surfaceElement(),
            isActive: () => this.destroying || isHostVisible(this.surfaceElement()),
            onEscape: () => {
                if (this.hasCancelAction) {
                    this.onCancel();
                }
            },
        });
    }
    ngOnDestroy() {
        this.destroying = true;
        this.prepareFocusRestoration();
        this.overlayState.release(this.overlayHandle);
        this.overlayHandle = undefined;
    }
    heading = 'Confirm action';
    description = 'Review this before continuing.';
    confirmText = 'Confirm';
    cancelText = 'Cancel';
    mood = 'default';
    align = 'bottomLeft';
    dismissible = false;
    confirm = new EventEmitter();
    cancel = new EventEmitter();
    headingId = `cx-context-dialog-heading-${this.instanceId}`;
    descriptionId = `cx-context-dialog-description-${this.instanceId}`;
    get hasHeading() {
        return this.heading.trim().length > 0;
    }
    get hasDescription() {
        return this.description.trim().length > 0;
    }
    get hasConfirmAction() {
        return this.confirmText.trim().length > 0;
    }
    get hasCancelAction() {
        return this.cancelText.trim().length > 0;
    }
    get hasActions() {
        return this.hasConfirmAction || this.hasCancelAction;
    }
    get actionOnlyAccessibleName() {
        if (this.hasHeading || this.hasDescription) {
            return null;
        }
        return this.meaningfulConfirmText || this.meaningfulCancelText || null;
    }
    onCancel() {
        this.cancel.emit();
    }
    onConfirm() {
        this.confirm.emit();
    }
    get meaningfulConfirmText() {
        const text = this.confirmText.trim();
        return text.toLocaleLowerCase() === 'confirm' ? '' : text;
    }
    get meaningfulCancelText() {
        const text = this.cancelText.trim();
        return text.toLocaleLowerCase() === 'cancel' ? '' : text;
    }
    surfaceElement() {
        return this.host.nativeElement.querySelector('.cx-context-dialog') ?? undefined;
    }
    prepareFocusRestoration() {
        const ownerDocument = this.host.nativeElement.ownerDocument;
        const activeElement = ownerDocument.activeElement;
        const surface = this.surfaceElement();
        if (!this.overlayHandle) {
            return;
        }
        this.overlayHandle.restoreFocus = activeElement === ownerDocument.body
            || activeElement === ownerDocument.documentElement
            || (activeElement instanceof HTMLElement && !!surface && surface.contains(activeElement));
    }
    onDocumentClick(event) {
        if (!this.dismissible || !isHostVisible(this.host.nativeElement)) {
            return;
        }
        const target = event.target;
        if (target instanceof Node && this.host.nativeElement.contains(target)) {
            return;
        }
        this.onCancel();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxContextDialogComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxContextDialogComponent, isStandalone: true, selector: "cx-context-dialog", inputs: { heading: "heading", description: "description", confirmText: "confirmText", cancelText: "cancelText", mood: "mood", align: "align", dismissible: "dismissible" }, outputs: { confirm: "confirm", cancel: "cancel" }, host: { listeners: { "document:click": "onDocumentClick($event)" } }, ngImport: i0, template: "<section\n  class=\"cx-context-dialog\"\n  [class.cx-context-dialog--top]=\"align === 'topLeft'\"\n  [class.cx-context-dialog--bottom]=\"align === 'bottomLeft'\"\n  role=\"dialog\"\n  aria-modal=\"false\"\n  [attr.aria-labelledby]=\"hasHeading ? headingId : hasDescription ? descriptionId : null\"\n  [attr.aria-describedby]=\"hasHeading && hasDescription ? descriptionId : null\"\n  [attr.aria-label]=\"actionOnlyAccessibleName\"\n  tabindex=\"-1\"\n>\n  @if (hasHeading) {\n    <div class=\"cx-context-dialog__heading\" [id]=\"headingId\">{{ heading }}</div>\n  }\n  @if (hasDescription) {\n    <p class=\"cx-context-dialog__message\" [id]=\"descriptionId\">{{ description }}</p>\n  }\n  @if (hasActions) {\n    <footer class=\"cx-context-dialog__actions\">\n      @if (hasCancelAction) {\n        <cx-button [text]=\"cancelText\" mood=\"default\" (pressed)=\"onCancel()\" />\n      }\n      @if (hasConfirmAction) {\n        <cx-button [text]=\"confirmText\" [mood]=\"mood\" (pressed)=\"onConfirm()\" />\n      }\n    </footer>\n  }\n</section>\n", styles: [":host{display:inline-flex;width:auto}.cx-context-dialog{--cx-context-dialog-arrow-size: calc(var(--space-md) - var(--space-xs));position:relative;display:flex;width:min(var(--controller-size)*10,100vw - var(--space-xl));flex-direction:column;box-sizing:border-box;border:var(--line);border-radius:var(--radius-md);background:var(--surface);color:var(--ink);box-shadow:var(--shadow-mid);outline:none}.cx-context-dialog::before{content:\"\";position:absolute;z-index:var(--z-index-detail);left:50%;width:var(--cx-context-dialog-arrow-size);height:var(--cx-context-dialog-arrow-size);border:var(--line);background:var(--surface);transform:translateX(-50%) rotate(45deg)}.cx-context-dialog--bottom::before{top:calc(var(--cx-context-dialog-arrow-size)/-2);border-right:0;border-bottom:0}.cx-context-dialog--top::before{bottom:calc(var(--cx-context-dialog-arrow-size)/-2);border-top:0;border-left:0}.cx-context-dialog__heading,.cx-context-dialog__message,.cx-context-dialog__actions{position:relative;z-index:var(--z-index-detail)}.cx-context-dialog__heading{padding:var(--space-md) var(--space-md) 0;color:var(--ink);font-size:var(--font-size-title-2);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading)}.cx-context-dialog__message{margin:0;padding:var(--space-sm) var(--space-md) var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-context-dialog__actions{display:flex;justify-content:flex-end;gap:var(--space-sm);padding:var(--space-sm);border-top:var(--line-discreet);background:var(--opacity-low)}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxContextDialogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-context-dialog', imports: [CxButtonComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<section\n  class=\"cx-context-dialog\"\n  [class.cx-context-dialog--top]=\"align === 'topLeft'\"\n  [class.cx-context-dialog--bottom]=\"align === 'bottomLeft'\"\n  role=\"dialog\"\n  aria-modal=\"false\"\n  [attr.aria-labelledby]=\"hasHeading ? headingId : hasDescription ? descriptionId : null\"\n  [attr.aria-describedby]=\"hasHeading && hasDescription ? descriptionId : null\"\n  [attr.aria-label]=\"actionOnlyAccessibleName\"\n  tabindex=\"-1\"\n>\n  @if (hasHeading) {\n    <div class=\"cx-context-dialog__heading\" [id]=\"headingId\">{{ heading }}</div>\n  }\n  @if (hasDescription) {\n    <p class=\"cx-context-dialog__message\" [id]=\"descriptionId\">{{ description }}</p>\n  }\n  @if (hasActions) {\n    <footer class=\"cx-context-dialog__actions\">\n      @if (hasCancelAction) {\n        <cx-button [text]=\"cancelText\" mood=\"default\" (pressed)=\"onCancel()\" />\n      }\n      @if (hasConfirmAction) {\n        <cx-button [text]=\"confirmText\" [mood]=\"mood\" (pressed)=\"onConfirm()\" />\n      }\n    </footer>\n  }\n</section>\n", styles: [":host{display:inline-flex;width:auto}.cx-context-dialog{--cx-context-dialog-arrow-size: calc(var(--space-md) - var(--space-xs));position:relative;display:flex;width:min(var(--controller-size)*10,100vw - var(--space-xl));flex-direction:column;box-sizing:border-box;border:var(--line);border-radius:var(--radius-md);background:var(--surface);color:var(--ink);box-shadow:var(--shadow-mid);outline:none}.cx-context-dialog::before{content:\"\";position:absolute;z-index:var(--z-index-detail);left:50%;width:var(--cx-context-dialog-arrow-size);height:var(--cx-context-dialog-arrow-size);border:var(--line);background:var(--surface);transform:translateX(-50%) rotate(45deg)}.cx-context-dialog--bottom::before{top:calc(var(--cx-context-dialog-arrow-size)/-2);border-right:0;border-bottom:0}.cx-context-dialog--top::before{bottom:calc(var(--cx-context-dialog-arrow-size)/-2);border-top:0;border-left:0}.cx-context-dialog__heading,.cx-context-dialog__message,.cx-context-dialog__actions{position:relative;z-index:var(--z-index-detail)}.cx-context-dialog__heading{padding:var(--space-md) var(--space-md) 0;color:var(--ink);font-size:var(--font-size-title-2);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading)}.cx-context-dialog__message{margin:0;padding:var(--space-sm) var(--space-md) var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-context-dialog__actions{display:flex;justify-content:flex-end;gap:var(--space-sm);padding:var(--space-sm);border-top:var(--line-discreet);background:var(--opacity-low)}"] }]
        }], ctorParameters: () => [], propDecorators: { heading: [{
                type: Input
            }], description: [{
                type: Input
            }], confirmText: [{
                type: Input
            }], cancelText: [{
                type: Input
            }], mood: [{
                type: Input
            }], align: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], confirm: [{
                type: Output
            }], cancel: [{
                type: Output
            }], onDocumentClick: [{
                type: HostListener,
                args: ['document:click', ['$event']]
            }] } });
