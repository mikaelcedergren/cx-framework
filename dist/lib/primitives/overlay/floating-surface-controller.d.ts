import { type CxFloatingSurfaceAlign, type CxFloatingSurfacePlacement } from './floating-surface';
export interface CxFloatingSurfaceViewport {
    width: number;
    height: number;
}
export interface CxFloatingSurfaceRequest {
    width: number;
    estimatedHeight: number;
    minWidth?: number;
    align?: CxFloatingSurfaceAlign;
    viewportPadding?: number;
    gap?: number;
    /** Clamp the resulting max-height (e.g. to the estimated content height). */
    maxHeightCap?: number;
}
export type CxFloatingSurfaceMeasure = (triggerRect: DOMRect, viewport: CxFloatingSurfaceViewport) => CxFloatingSurfaceRequest | undefined;
/**
 * Owns the floating-surface positioning state shared by every popover-backed
 * trigger component (cx-dropdown, cx-date-picker, cx-date-span-picker,
 * cx-color-picker, cx-tag-field): the position signals bound to cx-popover,
 * the trigger element, the measurement pass, and the trigger ResizeObserver.
 * Components stay in charge of *what* to measure via the `measure` callback;
 * this class is the single owner of *how* metrics flow to the popover.
 *
 * Sizing contract: the content decides the width, the trigger sets the floor,
 * the viewport sets the ceiling. Consumers with content-sized surfaces pass a
 * `surface` accessor: positioning then runs in two passes — an estimate for
 * placement, then a post-render measurement of the real surface that re-clamps
 * the position and locks the width until `resetMeasurement()` (typically on
 * close), so filtering or virtualization can never make an open surface jitter.
 */
export declare class CxFloatingSurfaceController {
    private readonly measure;
    private readonly surface?;
    private readonly widthState;
    private readonly minWidthState;
    private readonly maxHeightState;
    private readonly leftState;
    private readonly topState;
    private readonly bottomState;
    private readonly placementState;
    private triggerElement?;
    private resizeObserver?;
    private measurePassFrame?;
    private lockedPlacement?;
    readonly width$: import("@angular/core").Signal<number | undefined>;
    readonly minWidth$: import("@angular/core").Signal<number | undefined>;
    readonly maxHeight$: import("@angular/core").Signal<number | undefined>;
    readonly left$: import("@angular/core").Signal<number | undefined>;
    readonly top$: import("@angular/core").Signal<number | undefined>;
    readonly bottom$: import("@angular/core").Signal<number | undefined>;
    readonly placement$: import("@angular/core").Signal<CxFloatingSurfacePlacement>;
    constructor(measure: CxFloatingSurfaceMeasure, surface?: (() => HTMLElement | undefined) | undefined);
    get trigger(): HTMLElement | undefined;
    setTrigger(element: HTMLElement | undefined): void;
    /**
     * Re-measure against the current (or newly provided) trigger and publish
     * the resulting metrics. Safe to call in any environment; no-ops without
     * a trigger or a window.
     */
    sync(trigger?: HTMLElement): void;
    /**
     * Forget the locked surface width so the next sync re-measures the content.
     * Call when the content changes materially while the surface stays open;
     * the placement lock survives so the surface cannot flip mid-interaction.
     */
    resetMeasurement(): void;
    /**
     * End the open session: forget the locked width AND the locked placement so
     * the next open re-measures the content and re-picks a side. Call when the
     * surface closes (or right before a fresh open).
     */
    endSession(): void;
    private measureSurfaceWidth;
    private scheduleMeasurePass;
    private cancelMeasurePass;
    /**
     * Observe the trigger for size changes. `onResize` defaults to a plain
     * sync; pass a callback when the component needs extra work per resize.
     */
    observeTrigger(element: HTMLElement | undefined, onResize?: () => void): void;
    stopObservingTrigger(): void;
    destroy(): void;
}
//# sourceMappingURL=floating-surface-controller.d.ts.map