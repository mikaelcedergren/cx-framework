import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
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
  imports: [NgTemplateOutlet, CxOptionGroupComponent, CxPopoverBackdropComponent],
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
      this.portaledBackdrop = this.syncPortaledNode(this.portaledBackdrop, backdrop, body);
      const surface = this.surfaceRef?.nativeElement ?? null;
      this.portaledSurface = this.syncPortaledNode(this.portaledSurface, surface, body);
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

  private syncPortaledNode(
    currentNode: HTMLElement | null,
    nextNode: HTMLElement | null,
    body: HTMLElement,
  ): HTMLElement | null {
    if (currentNode && currentNode !== nextNode) {
      currentNode.remove();
    }
    if (nextNode && nextNode.parentNode !== body) {
      // Moving a node drops focus held inside it. Consumers may have focused
      // surface content (e.g. a search field) before this pass runs, so
      // restore that focus after the move.
      const activeElement = this.document.activeElement;
      const focusWasInside = activeElement instanceof HTMLElement && nextNode.contains(activeElement);
      body.appendChild(nextNode);
      if (focusWasInside) {
        activeElement.focus();
      }
    }
    return nextNode;
  }

  @Input()
  public set open(value: boolean) {
    const nextOpen = !!value;
    if (!nextOpen) {
      // Remove the click-catching body nodes synchronously. Angular will
      // destroy the view on the following render, but interaction must be
      // restored the moment the owner closes the popover.
      this.releasePortaledNodes();
    }
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
