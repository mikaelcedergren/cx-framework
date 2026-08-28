import { Directive, ElementRef, inject } from '@angular/core';
import * as i0 from "@angular/core";
export class CxMenuTriggerDirective {
    host = inject(ElementRef);
    nativeButton() {
        const host = this.host.nativeElement;
        if (host instanceof HTMLButtonElement) {
            return host;
        }
        const supportedHosts = new Set(['CX-BUTTON', 'CX-ICON-BUTTON']);
        if (!supportedHosts.has(host.tagName)) {
            throw new Error(`[cx-menu] cxMenuTrigger belongs on a native button, cx-button, or cx-icon-button; found ${host.tagName.toLowerCase()}.`);
        }
        const buttons = Array.from(host.querySelectorAll('button'));
        if (buttons.length !== 1) {
            throw new Error(`[cx-menu] cxMenuTrigger must resolve to exactly one native button; found ${buttons.length}.`);
        }
        return buttons[0];
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMenuTriggerDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "22.0.8", type: CxMenuTriggerDirective, isStandalone: true, selector: "[cxMenuTrigger]", ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMenuTriggerDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cxMenuTrigger]',
                }]
        }] });
