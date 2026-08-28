import * as i0 from "@angular/core";
/**
 * Keeps the component reference literal without constructing every inactive
 * workbench and its document listeners, observers, or portaled overlays.
 */
export declare class CxActiveWorkbenchDirective {
    private readonly template;
    private readonly container;
    private rendered;
    set cxActiveWorkbench(active: boolean);
    static ɵfac: i0.ɵɵFactoryDeclaration<CxActiveWorkbenchDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CxActiveWorkbenchDirective, "[cxActiveWorkbench]", never, { "cxActiveWorkbench": { "alias": "cxActiveWorkbench"; "required": false; }; }, {}, never, never, true, never>;
    static ngAcceptInputType_cxActiveWorkbench: unknown;
}
//# sourceMappingURL=cx-active-workbench.directive.d.ts.map