import * as i0 from "@angular/core";
/** Gentle motion for a decorative media layer inside a stationary clipping parent.
 * Size the layer to its parent; a 1.14 scale covers the full -6% to +6% travel.
 * Owns the layer's transform animation; foreground content stays outside it.
 */
export declare class CxParallaxDirective {
    readonly cxParallax: import("@angular/core").InputSignalWithTransform<boolean, unknown>;
    private readonly host;
    private readonly zone;
    private readonly browserReady;
    constructor();
    static ɵfac: i0.ɵɵFactoryDeclaration<CxParallaxDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CxParallaxDirective, "[cxParallax]", never, { "cxParallax": { "alias": "cxParallax"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-parallax.directive.d.ts.map