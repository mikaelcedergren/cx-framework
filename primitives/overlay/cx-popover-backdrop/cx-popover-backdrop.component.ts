import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'cx-popover-backdrop',
  template: `
    <div
      class="cx-popover-backdrop__surface"
      aria-hidden="true"
      (pointerdown)="onPointerDown($event)"
      (click)="onClick($event)"
      (wheel)="onWheel($event)"
      (touchmove)="onTouchMove($event)"
    ></div>
  `,
  styleUrl: './cx-popover-backdrop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPopoverBackdropComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly cleanupCallbacks: Array<() => void> = [];
  private lastTouchY: number | null = null;

  @Output() readonly pressed = new EventEmitter<void>();

  public ngOnInit(): void {
    if (typeof window === 'undefined' || !this.document) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const onWheel = (event: WheelEvent) => {
        if (!this.isTopmostBackdrop()) {
          return;
        }
        this.applyScrollDelta(event.target, event.deltaY);
        event.preventDefault();
      };

      const onTouchStart = (event: TouchEvent) => {
        if (!this.isTopmostBackdrop()) {
          return;
        }
        this.lastTouchY = event.touches[0]?.clientY ?? null;
      };

      const onTouchMove = (event: TouchEvent) => {
        if (!this.isTopmostBackdrop()) {
          return;
        }
        const nextTouchY = event.touches[0]?.clientY ?? this.lastTouchY;
        const deltaY =
          this.lastTouchY !== null && nextTouchY !== null ? this.lastTouchY - nextTouchY : 0;
        this.lastTouchY = nextTouchY;
        this.applyScrollDelta(event.target, deltaY);
        event.preventDefault();
      };

      const onTouchEnd = () => {
        this.lastTouchY = null;
      };

      this.document.addEventListener('wheel', onWheel, { capture: true, passive: false });
      this.document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
      this.document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
      this.document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
      this.document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });

      this.cleanupCallbacks.push(() =>
        this.document.removeEventListener('wheel', onWheel, { capture: true }),
      );
      this.cleanupCallbacks.push(() =>
        this.document.removeEventListener('touchstart', onTouchStart, { capture: true }),
      );
      this.cleanupCallbacks.push(() =>
        this.document.removeEventListener('touchmove', onTouchMove, { capture: true }),
      );
      this.cleanupCallbacks.push(() =>
        this.document.removeEventListener('touchend', onTouchEnd, { capture: true }),
      );
      this.cleanupCallbacks.push(() =>
        this.document.removeEventListener('touchcancel', onTouchEnd, { capture: true }),
      );
    });
  }

  public ngOnDestroy(): void {
    for (const cleanup of this.cleanupCallbacks.splice(0)) {
      cleanup();
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.pressed.emit();
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private applyScrollDelta(target: EventTarget | null, deltaY: number): void {
    if (deltaY === 0) {
      return;
    }

    const scrollContainer = this.resolveScrollContainer(target);
    if (!scrollContainer) {
      return;
    }

    const nextScrollTop = Math.min(
      Math.max(scrollContainer.scrollTop + deltaY, 0),
      Math.max(scrollContainer.scrollHeight - scrollContainer.clientHeight, 0),
    );
    scrollContainer.scrollTop = nextScrollTop;
  }

  private resolveScrollContainer(target: EventTarget | null): HTMLElement | null {
    const origin =
      target instanceof Element
        ? target
        : target instanceof Node
          ? target.parentElement
          : null;
    if (!origin) {
      return null;
    }

    const surface = origin.closest<HTMLElement>('[data-cx-popover-surface]');
    if (!surface) {
      return null;
    }

    return this.findScrollableAncestor(origin, surface) ?? this.findPreferredScrollContainer(surface);
  }

  private findScrollableAncestor(origin: Element, surface: HTMLElement): HTMLElement | null {
    let current: Element | null = origin;
    while (current) {
      if (current instanceof HTMLElement && this.isScrollable(current)) {
        return current;
      }
      if (current === surface) {
        break;
      }
      current = current.parentElement;
    }
    return null;
  }

  private findPreferredScrollContainer(surface: HTMLElement): HTMLElement | null {
    const explicitContainer = surface.querySelector<HTMLElement>('[data-cx-popover-scroll-container]');
    if (explicitContainer && this.isScrollable(explicitContainer)) {
      return explicitContainer;
    }
    return this.isScrollable(surface) ? surface : null;
  }

  private isScrollable(element: HTMLElement): boolean {
    if (element.scrollHeight <= element.clientHeight + 1) {
      return false;
    }
    const overflowY = window.getComputedStyle(element).overflowY;
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  }

  private isTopmostBackdrop(): boolean {
    const openBackdrops = this.document.querySelectorAll('cx-popover-backdrop');
    return openBackdrops.item(openBackdrops.length - 1) === this.host.nativeElement;
  }
}
