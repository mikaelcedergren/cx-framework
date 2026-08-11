import { signal } from '@angular/core';
import {
  measureCxFloatingSurface,
  type CxFloatingSurfaceAlign,
  type CxFloatingSurfacePlacement,
} from './floating-surface';

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

export type CxFloatingSurfaceMeasure = (
  triggerRect: DOMRect,
  viewport: CxFloatingSurfaceViewport,
) => CxFloatingSurfaceRequest | undefined;

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
export class CxFloatingSurfaceController {
  private readonly widthState = signal<number | undefined>(undefined);
  private readonly minWidthState = signal<number | undefined>(undefined);
  private readonly maxHeightState = signal<number | undefined>(undefined);
  private readonly leftState = signal<number | undefined>(undefined);
  private readonly topState = signal<number | undefined>(undefined);
  private readonly bottomState = signal<number | undefined>(undefined);
  private readonly placementState = signal<CxFloatingSurfacePlacement>('bottom');
  private triggerElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private measurePassFrame?: number;
  private lockedPlacement?: CxFloatingSurfacePlacement;

  readonly width$ = this.widthState.asReadonly();
  readonly minWidth$ = this.minWidthState.asReadonly();
  readonly maxHeight$ = this.maxHeightState.asReadonly();
  readonly left$ = this.leftState.asReadonly();
  readonly top$ = this.topState.asReadonly();
  readonly bottom$ = this.bottomState.asReadonly();
  readonly placement$ = this.placementState.asReadonly();

  constructor(
    private readonly measure: CxFloatingSurfaceMeasure,
    private readonly surface?: () => HTMLElement | undefined,
  ) {}

  get trigger(): HTMLElement | undefined {
    return this.triggerElement;
  }

  setTrigger(element: HTMLElement | undefined): void {
    if (element) {
      this.triggerElement = element;
    }
  }

  /**
   * Re-measure against the current (or newly provided) trigger and publish
   * the resulting metrics. Safe to call in any environment; no-ops without
   * a trigger or a window.
   */
  sync(trigger?: HTMLElement): void {
    this.setTrigger(trigger);
    const activeTrigger = this.triggerElement;
    if (!activeTrigger || typeof window === 'undefined') {
      return;
    }
    const viewport: CxFloatingSurfaceViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const request = this.measure(activeTrigger.getBoundingClientRect(), viewport);
    if (!request) {
      return;
    }
    const measuredWidth = this.measureSurfaceWidth();
    const surface = measureCxFloatingSurface({
      triggerRect: activeTrigger.getBoundingClientRect(),
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      width: measuredWidth ?? request.width,
      minWidth: request.minWidth,
      estimatedHeight: request.estimatedHeight,
      align: request.align,
      viewportPadding: request.viewportPadding,
      gap: request.gap,
      lockedPlacement: this.lockedPlacement,
    });
    // First sync of a session decides the side; every later sync keeps it so
    // an open surface can never flip. resetMeasurement() ends the session.
    this.lockedPlacement = surface.placement;

    if (this.surface) {
      // Content-sized mode: width$ publishes only real measurements, locking
      // the rendered width for the session. Until the surface exists, keep
      // width unset (the surface auto-sizes) and schedule one post-render pass.
      if (measuredWidth !== undefined) {
        this.widthState.set(surface.width);
      } else {
        this.scheduleMeasurePass();
      }
    } else {
      this.widthState.set(surface.width);
    }
    this.minWidthState.set(request.minWidth);
    this.maxHeightState.set(
      request.maxHeightCap !== undefined ? Math.min(surface.maxHeight, request.maxHeightCap) : surface.maxHeight,
    );
    this.leftState.set(surface.left);
    this.topState.set(surface.top);
    this.bottomState.set(surface.bottom);
    this.placementState.set(surface.placement);
  }

  /**
   * Forget the locked surface width so the next sync re-measures the content.
   * Call when the content changes materially while the surface stays open;
   * the placement lock survives so the surface cannot flip mid-interaction.
   */
  resetMeasurement(): void {
    this.widthState.set(undefined);
    this.cancelMeasurePass();
  }

  /**
   * End the open session: forget the locked width AND the locked placement so
   * the next open re-measures the content and re-picks a side. Call when the
   * surface closes (or right before a fresh open).
   */
  endSession(): void {
    this.resetMeasurement();
    this.lockedPlacement = undefined;
  }

  private measureSurfaceWidth(): number | undefined {
    const surfaceElement = this.surface?.();
    if (!surfaceElement) {
      return undefined;
    }
    const width = surfaceElement.getBoundingClientRect().width;
    return Number.isFinite(width) && width > 0 ? Math.ceil(width) : undefined;
  }

  private scheduleMeasurePass(): void {
    if (typeof window === 'undefined' || this.measurePassFrame !== undefined) {
      return;
    }
    this.measurePassFrame = window.requestAnimationFrame(() => {
      this.measurePassFrame = undefined;
      if (this.surface?.()) {
        this.sync();
      }
    });
  }

  private cancelMeasurePass(): void {
    if (typeof window !== 'undefined' && this.measurePassFrame !== undefined) {
      window.cancelAnimationFrame(this.measurePassFrame);
      this.measurePassFrame = undefined;
    }
  }

  /**
   * Observe the trigger for size changes. `onResize` defaults to a plain
   * sync; pass a callback when the component needs extra work per resize.
   */
  observeTrigger(element: HTMLElement | undefined, onResize: () => void = () => this.sync()): void {
    this.setTrigger(element);
    const activeTrigger = this.triggerElement;
    if (!activeTrigger || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(onResize);
    this.resizeObserver.observe(activeTrigger);
  }

  stopObservingTrigger(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  destroy(): void {
    this.stopObservingTrigger();
    this.cancelMeasurePass();
  }
}
