import { AfterViewInit, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
/** Marks content that cx-labeled-row reveals from its label-side info button. */
export declare class CxLabeledRowInfoDirective implements AfterViewInit, OnDestroy {
    private readonly element;
    private readonly hasVisibleContentState;
    private observer?;
    readonly hasVisibleContent: import("@angular/core").Signal<boolean>;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    private syncVisibleContent;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxLabeledRowInfoDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CxLabeledRowInfoDirective, "[infoContent]", never, {}, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-labeled-row-info.directive.d.ts.map