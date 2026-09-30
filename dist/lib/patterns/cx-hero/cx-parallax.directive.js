import { Directive, ElementRef, NgZone, afterNextRender, booleanAttribute, effect, inject, input, signal, } from "@angular/core";
import * as i0 from "@angular/core";
/** Gentle motion for a decorative media layer inside a stationary clipping parent.
 * Size the layer to its parent; a 1.14 scale covers the full -6% to +6% travel.
 * Owns the layer's transform animation; foreground content stays outside it.
 */
export class CxParallaxDirective {
    cxParallax = input(false, { ...(ngDevMode ? { debugName: "cxParallax" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    host = inject(ElementRef);
    zone = inject(NgZone);
    browserReady = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "browserReady" }] : /* istanbul ignore next */ []));
    constructor() {
        afterNextRender(() => this.browserReady.set(true));
        effect((onCleanup) => {
            if (!this.browserReady() || !this.cxParallax())
                return;
            const layer = this.host.nativeElement;
            const frame = layer.parentElement;
            const win = layer.ownerDocument.defaultView;
            this.zone.runOutsideAngular(() => {
                const preference = win.matchMedia("(prefers-reduced-motion: reduce)");
                let visible = false;
                let listening = false;
                let animation = 0;
                let motion;
                const update = () => {
                    animation = 0;
                    const rect = frame.getBoundingClientRect();
                    // Match the portfolio pace over the complete viewport passage.
                    const progress = Math.max(0, Math.min(1, (win.innerHeight - rect.top) / (win.innerHeight + rect.height)));
                    motion.currentTime = progress * 1000;
                };
                const schedule = () => {
                    if (!animation)
                        animation = win.requestAnimationFrame(update);
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
                            motion = layer.animate([
                                { transform: "translateY(-6%) scale(1.14)" },
                                { transform: "translateY(6%) scale(1.14)" },
                            ], {
                                duration: 1000,
                                easing: "cubic-bezier(0.25, 0.2, 0.75, 0.8)",
                                fill: "both",
                            });
                            // Scroll owns time; the animation never plays on its own.
                            motion.pause();
                            layer.style.willChange = "transform";
                            listening = true;
                        }
                        schedule();
                    }
                    else {
                        stop();
                    }
                };
                const intersection = new IntersectionObserver(([entry]) => {
                    visible = entry.isIntersecting;
                    sync();
                });
                const resize = new ResizeObserver(() => {
                    if (listening)
                        schedule();
                });
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxParallaxDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "22.0.8", type: CxParallaxDirective, isStandalone: true, selector: "[cxParallax]", inputs: { cxParallax: { classPropertyName: "cxParallax", publicName: "cxParallax", isSignal: true, isRequired: false, transformFunction: null } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxParallaxDirective, decorators: [{
            type: Directive,
            args: [{ selector: "[cxParallax]" }]
        }], ctorParameters: () => [], propDecorators: { cxParallax: [{ type: i0.Input, args: [{ isSignal: true, alias: "cxParallax", required: false }] }] } });
