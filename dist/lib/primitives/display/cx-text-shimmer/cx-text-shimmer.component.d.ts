import * as i0 from "@angular/core";
/**
 * A short text label with a light sweeping across it, used to signal active
 * generation or background work (streaming, "thinking", loading). It rests at a
 * readable strength and sweeps a brighter highlight across using the system
 * color tokens. A static base paint always remains underneath the highlight,
 * and reduced-motion removes the highlight entirely.
 */
export declare class CxTextShimmerComponent {
    /** The label to shimmer. */
    text: string;
    /** Whether the highlight sweeps. When false the readable base label remains still. */
    active: boolean;
    protected visibleText$(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTextShimmerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTextShimmerComponent, "cx-text-shimmer", never, { "text": { "alias": "text"; "required": false; }; "active": { "alias": "active"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-text-shimmer.component.d.ts.map