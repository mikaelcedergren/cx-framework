import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import * as i0 from "@angular/core";
export class CxChatThreadComponent {
    viewerIdState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewerIdState" }] : /* istanbul ignore next */ []));
    set viewerId(value) {
        this.viewerIdState.set(value ?? '');
    }
    viewerId$ = this.viewerIdState.asReadonly();
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxChatThreadComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxChatThreadComponent, isStandalone: true, selector: "cx-chat-thread", inputs: { viewerId: "viewerId" }, host: { classAttribute: "cx-chat-thread" }, ngImport: i0, template: "<div class=\"cx-chat-thread__messages\" role=\"list\" aria-label=\"Messages\">\n  <ng-content select=\"cx-chat-message\" />\n  <ng-content select=\"[cxChatMessage]\" />\n</div>\n\n<div class=\"cx-chat-thread__footer\">\n  <ng-content select=\"[cxChatThreadFooter]\" />\n  <ng-content select=\"[slot=footer]\" />\n</div>\n", styles: [":host{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-md)}.cx-chat-thread__messages:empty,.cx-chat-thread__footer:empty{display:none}.cx-chat-thread__messages{display:flex;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-chat-thread__footer{display:contents}.cx-chat-thread__footer:has(*){display:block}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxChatThreadComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-chat-thread', host: {
                        class: 'cx-chat-thread',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-chat-thread__messages\" role=\"list\" aria-label=\"Messages\">\n  <ng-content select=\"cx-chat-message\" />\n  <ng-content select=\"[cxChatMessage]\" />\n</div>\n\n<div class=\"cx-chat-thread__footer\">\n  <ng-content select=\"[cxChatThreadFooter]\" />\n  <ng-content select=\"[slot=footer]\" />\n</div>\n", styles: [":host{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-md)}.cx-chat-thread__messages:empty,.cx-chat-thread__footer:empty{display:none}.cx-chat-thread__messages{display:flex;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-chat-thread__footer{display:contents}.cx-chat-thread__footer:has(*){display:block}"] }]
        }], propDecorators: { viewerId: [{
                type: Input
            }] } });
