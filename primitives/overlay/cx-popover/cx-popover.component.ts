import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  afterRenderEffect,
  inject,
  signal,
} from '@angular/core';
import { CxOptionGroupComponent } from '../cx-option-group';
import { CxPopoverBackdropComponent } from '../cx-popover-backdrop/cx-popover-backdrop.component';

export type CxPopoverMood = 'default' | 'danger';
export type CxPopoverSurfaceVariant = 'default' | 'raised';

@Component({
  selector: 'cx-popover',
  imports: [CxOptionGroupComponent, CxPopoverBackdropComponent],
  templateUrl: './cx-popover.component.html',
  styleUrl: './cx-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPopoverComponent {
  private readonly document = inject(DOCUMENT);
  private readonly openState = signal(false);
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

    destroyRef.onDestroy(() => this.releasePortaledNodes());
  }

  private releasePortaledNodes(): void {
    this.portaledSurface?.remove();
    this.portaledBackdrop?.remove();
    this.portaledSurface = null;
    this.portaledBackdrop = null;
  }

  @Input()
  public set open(value: boolean) {
    this.openState.set(!!value);
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
  @Input() width: number | undefined;
  @Input() maxHeight: number | undefined;
  @Input() placement: 'top' | 'bottom' | undefined;
  @Input() mood: CxPopoverMood = 'default';
  @Input() surfaceVariant: CxPopoverSurfaceVariant = 'default';

  @Output() readonly backdropPressed = new EventEmitter<void>();

  public surfaceElement(): HTMLElement | undefined {
    return this.surfaceRef?.nativeElement;
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.openState()) {
      this.backdropPressed.emit();
    }
  }

  protected get resolvedMaxHeight(): string {
    if (typeof this.maxHeight === 'number' && Number.isFinite(this.maxHeight)) {
      return `min(${Math.max(Math.floor(this.maxHeight), 0)}px, calc(100dvh - (var(--space-md) * 2)))`;
    }
    return 'calc(100dvh - (var(--space-md) * 2))';
  }

  protected get normalizedTitle(): string | undefined {
    const next = this.heading?.trim();
    return next ? next : undefined;
  }

  protected get normalizedTitleDescription(): string | undefined {
    const next = this.description?.trim();
    return next ? next : undefined;
  }
}
