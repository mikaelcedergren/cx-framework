export type CxFloatingSurfacePlacement = 'bottom' | 'top';
export type CxFloatingSurfaceAlign = 'start' | 'end';
export interface CxFloatingSurfaceInput {
    triggerRect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>;
    viewportWidth: number;
    viewportHeight: number;
    width: number;
    estimatedHeight: number;
    minWidth?: number;
    align?: CxFloatingSurfaceAlign;
    viewportPadding?: number;
    gap?: number;
    /**
     * Keep the surface on this side instead of re-deciding. Placement is chosen
     * once when a surface opens; re-measures while it stays open pass the locked
     * side so content growth can never flip an open surface — it scrolls within
     * the side's max-height instead.
     */
    lockedPlacement?: CxFloatingSurfacePlacement;
}
export interface CxFloatingSurfaceMetrics {
    width: number;
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
    placement: CxFloatingSurfacePlacement;
}
export declare function measureCxFloatingSurface(input: CxFloatingSurfaceInput): CxFloatingSurfaceMetrics;
//# sourceMappingURL=floating-surface.d.ts.map