import { Directive, Input, TemplateRef, ViewContainerRef, booleanAttribute, inject, } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Keeps the component reference literal without constructing every inactive
 * workbench and its document listeners, observers, or portaled overlays.
 */
export class CxActiveWorkbenchDirective {
    template = inject((TemplateRef));
    container = inject(ViewContainerRef);
    rendered = false;
    set cxActiveWorkbench(active) {
        const nextRendered = Boolean(active);
        if (nextRendered === this.rendered) {
            return;
        }
        this.rendered = nextRendered;
        if (nextRendered) {
            this.container.createEmbeddedView(this.template);
            return;
        }
        this.container.clear();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxActiveWorkbenchDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "22.0.8", type: CxActiveWorkbenchDirective, isStandalone: true, selector: "[cxActiveWorkbench]", inputs: { cxActiveWorkbench: ["cxActiveWorkbench", "cxActiveWorkbench", booleanAttribute] }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxActiveWorkbenchDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cxActiveWorkbench]',
                }]
        }], propDecorators: { cxActiveWorkbench: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }] } });
