import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  afterRenderEffect,
  inject,
  signal,
} from '@angular/core';
import { CxOptionGroupComponent } from '../cx-option-group';
import { CxPopoverBackdropComponent } from '../cx-popover-backdrop/cx-popover-backdrop.component';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

export type CxPopoverSurfaceVariant = 'default' | 'raised' | 'grouped';

@Component({
  selector: 'cx-popover',
  imports: [CxOptionGroupComponent, CxPopoverBackdropComponent],
  templateUrl: './cx-popover.component.html',
  styleUrl: './cx-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPopoverComponent {
  private readonly document = inject(DOCUMENT);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private overlayHandle?: CxOverlayStateHandle;
  private portaledSurface: HTMLElement | null = null;
  private portaledBackdrop: HTMLElement | null = null;

  @ViewChild('surface', { read: ElementRef })
  private surfaceRef?: ElementRef<HTMLElement>;

  @ViewChild('backdrop', { read: ElementRef })
  private backdropRef?: ElementRef<HTMLElement>;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterRenderEffect(() => {
      const body = this.document?.body;
      if (!body) return;
      if (!this.openState()) {
        this.releasePortaledNodes();
        return;
      }
      // Order matters: backdrop must come BEFORE surface in the body so the
      // surface paints on top in every engine. Chromium honours the z-index
      // (popover 1110 > backdrop 1100) regardless of DOM order, but WebKit
      // hit-tests the later-painted sibling and swallows clicks on options.
      const backdrop = this.backdropRef?.nativeElement ?? null;
      if (backdrop && backdrop.parentNode !== body) {
        body.appendChild(backdrop);
      }
      this.portaledBackdrop = backdrop;
      const surface = this.surfaceRef?.nativeElement ?? null;
      if (surface && surface.parentNode !== body) {
        body.appendChild(surface);
      }
      this.portaledSurface = surface;
    });

    destroyRef.onDestroy(() => {
      this.releasePortaledNodes();
      this.releaseOverlayOwnership();
    });
  }

  private releasePortaledNodes(): void {
    this.portaledSurface?.remove();
    this.portaledBackdrop?.remove();
    this.portaledSurface = null;
    this.portaledBackdrop = null;
  }

  @Input()
  public set open(value: boolean) {
    const nextOpen = !!value;
    if (this.openState() === nextOpen) {
      return;
    }
    this.openState.set(nextOpen);
    if (nextOpen) {
      this.captureOverlayOwnership();
    } else {
      this.releaseOverlayOwnership();
    }
  }
  public get open(): boolean {
    return this.openState();
  }
  @Input() showBackdrop = true;
  @Input() surfaceId: string | undefined;
  @Input() role: string | undefined;
  @Input() ariaLabel: string | undefined;
  @Input() heading: string | undefined;
  @Input() description: string | undefined;
  @Input() left: number | undefined;
  @Input() top: number | undefined;
  @Input() bottom: number | undefined;
  /** Exact surface width for fixed layouts (calendars, fixed menus). Otherwise the content decides. */
  @Input() width: number | undefined;
  /** Width floor — anchored surfaces pass the trigger width so the popover never reads narrower than it. */
  @Input() minWidth: number | undefined;
  /** Raises or lowers the compact content cap. Always viewport-clamped. */
  @Input() maxWidth: number | undefined;
  @Input() maxHeight: number | undefined;
  @Input() placement: 'top' | 'bottom' | undefined;
  @Input() surfaceVariant: CxPopoverSurfaceVariant = 'default';

  @Output() readonly backdropPressed = new EventEmitter<void>();

  public surfaceElement(): HTMLElement | undefined {
    return this.surfaceRef?.nativeElement;
  }

  protected get resolvedMaxHeight(): string {
    if (typeof this.maxHeight === 'number' && Number.isFinite(this.maxHeight)) {
      return `min(${Math.max(Math.floor(this.maxHeight), 0)}px, calc(100dvh - (var(--space-md) * 2)))`;
    }
    return 'calc(100dvh - (var(--space-md) * 2))';
  }

  protected get resolvedMaxWidth(): string | null {
    if (typeof this.maxWidth === 'number' && Number.isFinite(this.maxWidth)) {
      return `min(${Math.max(Math.floor(this.maxWidth), 0)}px, calc(100vw - (var(--space-md) * 2)))`;
    }
    if (typeof this.width === 'number' && Number.isFinite(this.width)) {
      // Explicit width wins over the compact content cap; only the viewport clamps it.
      return 'calc(100vw - (var(--space-md) * 2))';
    }
    return null;
  }

  protected get normalizedTitle(): string | undefined {
    const next = this.heading?.trim();
    return next ? next : undefined;
  }

  protected get normalizedTitleDescription(): string | undefined {
    const next = this.description?.trim();
    return next ? next : undefined;
  }

  private captureOverlayOwnership(): void {
    if (this.overlayHandle) {
      return;
    }
    this.overlayHandle = this.overlayState.capture({
      kind: 'transient',
      restoreFocus: false,
      isActive: () => this.openState() && this.backdropPressed.observed,
      onEscape: () => this.backdropPressed.emit(),
    });
  }

  private releaseOverlayOwnership(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }
}
