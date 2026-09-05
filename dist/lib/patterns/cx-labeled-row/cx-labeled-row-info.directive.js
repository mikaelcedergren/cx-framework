import { Directive, ElementRef, inject, signal } from '@angular/core';
import * as i0 from "@angular/core";
/** Marks content that cx-labeled-row reveals from its label-side info button. */
export class CxLabeledRowInfoDirective {
    element = inject(ElementRef).nativeElement;
    hasVisibleContentState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasVisibleContentState" }] : /* istanbul ignore next */ []));
    observer;
    hasVisibleContent = this.hasVisibleContentState.asReadonly();
    ngAfterViewInit() {
        this.syncVisibleContent();
        if (typeof MutationObserver === 'undefined') {
            return;
        }
        this.observer = new MutationObserver(() => this.syncVisibleContent());
        this.observer.observe(this.element, {
            childList: true,
            characterData: true,
            subtree: true,
        });
    }
    ngOnDestroy() {
        this.observer?.disconnect();
    }
    syncVisibleContent() {
        this.hasVisibleContentState.set(this.element.childElementCount > 0 || this.element.textContent?.trim().length > 0);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLabeledRowInfoDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "22.0.8", type: CxLabeledRowInfoDirective, isStandalone: true, selector: "[infoContent]", ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLabeledRowInfoDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[infoContent]',
                }]
        }] });
