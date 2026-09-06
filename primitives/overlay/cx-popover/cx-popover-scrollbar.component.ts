import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  signal,
} from "@angular/core";

let nextScrollRegionId = 0;

/** Internal presentation for the popover's native scrolling surface. */
@Component({
  selector: "cx-popover-scrollbar",
  templateUrl: "./cx-popover-scrollbar.component.html",
  styleUrl: "./cx-popover-scrollbar.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPopoverScrollbarComponent {
  readonly viewport = input.required<HTMLElement>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly regionId = `cx-popover-scroll-${++nextScrollRegionId}`;
  protected readonly metrics = signal({
    maximum: 0,
    position: 0,
    height: 0,
    top: 0,
    travel: 0,
  });
  protected readonly scrolling = signal(false);
  protected readonly dragging = signal(false);
  private drag?: { pointerId: number; y: number; position: number };

  constructor() {
    afterRenderEffect((cleanup) => {
      const viewport = this.viewport();
      const host = this.host.nativeElement;
      const window = viewport.ownerDocument.defaultView;
      if (!window) return;
      const previousId = viewport.id;
      if (!previousId) viewport.id = this.regionId;
      let frame: number | undefined;
      let idle: number | undefined;

      const measure = () => {
        frame = undefined;
        const maximum = Math.max(
          0,
          viewport.scrollHeight - viewport.clientHeight,
        );
        const trackHeight = host.clientHeight;
        const minimumThumb = Number.parseFloat(
          getComputedStyle(host).getPropertyValue("--controller-size-small"),
        );
        const height = Math.min(
          trackHeight,
          Math.max(
            minimumThumb,
            (trackHeight * viewport.clientHeight) /
              Math.max(1, viewport.scrollHeight),
          ),
        );
        const travel = Math.max(0, trackHeight - height);
        const position = Math.max(0, Math.min(maximum, viewport.scrollTop));
        this.metrics.set({
          maximum,
          position,
          height,
          travel,
          top: maximum ? (position / maximum) * travel : 0,
        });
      };
      const schedule = () => {
        if (frame === undefined) frame = window.requestAnimationFrame(measure);
      };
      const onScroll = () => {
        schedule();
        this.scrolling.set(true);
        window.clearTimeout(idle);
        idle = window.setTimeout(() => this.scrolling.set(false), 900);
      };
      const resize = new ResizeObserver(schedule);
      const observeSizes = () => {
        resize.disconnect();
        resize.observe(host);
        resize.observe(viewport);
        // Projected content can grow without changing the viewport's size.
        for (const child of viewport.querySelectorAll("*"))
          resize.observe(child);
        schedule();
      };
      const mutations = new MutationObserver(observeSizes);
      mutations.observe(viewport, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
      viewport.addEventListener("scroll", onScroll, { passive: true });
      observeSizes();

      cleanup(() => {
        resize.disconnect();
        mutations.disconnect();
        viewport.removeEventListener("scroll", onScroll);
        if (frame !== undefined) window.cancelAnimationFrame(frame);
        window.clearTimeout(idle);
        if (!previousId && viewport.id === this.regionId)
          viewport.removeAttribute("id");
        this.drag = undefined;
        this.dragging.set(false);
        this.scrolling.set(false);
      });
    });
  }

  protected startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const thumb = event.currentTarget as HTMLElement;
    thumb.focus({ preventScroll: true });
    thumb.setPointerCapture(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      y: event.clientY,
      position: this.viewport().scrollTop,
    };
    this.dragging.set(true);
  }

  protected moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    const { maximum, travel } = this.metrics();
    if (travel)
      this.viewport().scrollTop =
        this.drag.position + ((event.clientY - this.drag.y) * maximum) / travel;
  }

  protected endDrag(event: PointerEvent): void {
    if (this.drag?.pointerId !== event.pointerId) return;
    this.drag = undefined;
    this.dragging.set(false);
    const thumb = event.currentTarget as HTMLElement;
    if (thumb.hasPointerCapture(event.pointerId))
      thumb.releasePointerCapture(event.pointerId);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const viewport = this.viewport();
    const step = Number.parseFloat(
      getComputedStyle(viewport).getPropertyValue("--controller-size"),
    );
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = viewport.scrollTop + step;
        break;
      case "ArrowUp":
        next = viewport.scrollTop - step;
        break;
      case "PageDown":
        next = viewport.scrollTop + viewport.clientHeight;
        break;
      case "PageUp":
        next = viewport.scrollTop - viewport.clientHeight;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = this.metrics().maximum;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    viewport.scrollTop = next;
  }

  protected onWheel(event: WheelEvent): void {
    if (!event.deltaY) return;
    event.preventDefault();
    event.stopPropagation();
    const viewport = this.viewport();
    const unit =
      event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? viewport.clientHeight
        : event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? Number.parseFloat(getComputedStyle(viewport).lineHeight)
          : 1;
    viewport.scrollTop += event.deltaY * unit;
  }
}
