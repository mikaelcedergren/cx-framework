import {
  Directive,
  ElementRef,
  NgZone,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";

/** Gentle motion for a decorative media layer inside a stationary clipping parent.
 * The hero reserves a 1.14 scale in CSS to cover the full -6% to +6% travel.
 * Owns translation only, so initialization and pauses never change the crop.
 */
@Directive({ selector: "[cxParallax]" })
export class CxParallaxDirective {
  readonly cxParallax = input(false, { transform: booleanAttribute });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly browserReady = signal(false);

  constructor() {
    afterNextRender(() => this.browserReady.set(true));
    effect((onCleanup) => {
      if (!this.browserReady() || !this.cxParallax()) return;
      const layer = this.host.nativeElement;
      const frame = layer.parentElement!;
      const win = layer.ownerDocument.defaultView!;
      this.zone.runOutsideAngular(() => {
        const preference = win.matchMedia("(prefers-reduced-motion: reduce)");
        const bounds = frame.getBoundingClientRect();
        let visible =
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.bottom > 0 &&
          bounds.top < win.innerHeight;
        let listening = false;
        let animation = 0;
        let motion: Animation | undefined;
        const update = () => {
          animation = 0;
          const rect = frame.getBoundingClientRect();
          // Match the portfolio pace over the complete viewport passage.
          const progress = Math.max(
            0,
            Math.min(
              1,
              (win.innerHeight - rect.top) / (win.innerHeight + rect.height),
            ),
          );
          motion!.currentTime = progress * 1000;
        };
        const schedule = () => {
          if (!animation) animation = win.requestAnimationFrame(update);
        };
        const stop = () => {
          win.removeEventListener("scroll", schedule, true);
          win.removeEventListener("resize", schedule);
          win.cancelAnimationFrame(animation);
          animation = 0;
          listening = false;
          motion?.cancel();
          motion = undefined;
          layer.style.removeProperty("will-change");
        };
        const sync = () => {
          if (visible && !preference.matches) {
            if (!listening) {
              win.addEventListener("scroll", schedule, {
                passive: true,
                capture: true,
              });
              win.addEventListener("resize", schedule, { passive: true });
              motion = layer.animate(
                [{ translate: "0 -6%" }, { translate: "0 6%" }],
                {
                  duration: 1000,
                  easing: "cubic-bezier(0.25, 0.2, 0.75, 0.8)",
                  fill: "both",
                },
              );
              // Scroll owns time; the animation never plays on its own.
              motion.pause();
              layer.style.willChange = "translate";
              listening = true;
              // Set the scroll position before the new animation can paint.
              update();
            }
            schedule();
          } else {
            stop();
          }
        };
        const intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          sync();
        });
        const resize = new ResizeObserver(() => {
          if (listening) schedule();
        });
        sync();
        intersection.observe(frame);
        resize.observe(frame);
        preference.addEventListener("change", sync);
        onCleanup(() => {
          stop();
          intersection.disconnect();
          resize.disconnect();
          preference.removeEventListener("change", sync);
        });
      });
    });
  }
}
