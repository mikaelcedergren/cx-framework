import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, input, signal, } from "@angular/core";
import * as i0 from "@angular/core";
let nextScrollRegionId = 0;
/** Internal presentation for the popover's native scrolling surface. */
export class CxPopoverScrollbarComponent {
    viewport = input.required(/* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewport" }] : /* istanbul ignore next */ []));
    host = inject(ElementRef);
    regionId = `cx-popover-scroll-${++nextScrollRegionId}`;
    metrics = signal({
        maximum: 0,
        position: 0,
        height: 0,
        top: 0,
        travel: 0,
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "metrics" }] : /* istanbul ignore next */ []));
    scrolling = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "scrolling" }] : /* istanbul ignore next */ []));
    dragging = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dragging" }] : /* istanbul ignore next */ []));
    drag;
    constructor() {
        afterRenderEffect((cleanup) => {
            const viewport = this.viewport();
            const host = this.host.nativeElement;
            const window = viewport.ownerDocument.defaultView;
            if (!window)
                return;
            const previousId = viewport.id;
            if (!previousId)
                viewport.id = this.regionId;
            let frame;
            let idle;
            const measure = () => {
                frame = undefined;
                const maximum = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
                const trackHeight = host.clientHeight;
                const minimumThumb = Number.parseFloat(getComputedStyle(host).getPropertyValue("--controller-size-small"));
                const height = Math.min(trackHeight, Math.max(minimumThumb, (trackHeight * viewport.clientHeight) /
                    Math.max(1, viewport.scrollHeight)));
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
                if (frame === undefined)
                    frame = window.requestAnimationFrame(measure);
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
                if (frame !== undefined)
                    window.cancelAnimationFrame(frame);
                window.clearTimeout(idle);
                if (!previousId && viewport.id === this.regionId)
                    viewport.removeAttribute("id");
                this.drag = undefined;
                this.dragging.set(false);
                this.scrolling.set(false);
            });
        });
    }
    startDrag(event) {
        if (event.button !== 0)
            return;
        event.preventDefault();
        event.stopPropagation();
        const thumb = event.currentTarget;
        thumb.focus({ preventScroll: true });
        thumb.setPointerCapture(event.pointerId);
        this.drag = {
            pointerId: event.pointerId,
            y: event.clientY,
            position: this.viewport().scrollTop,
        };
        this.dragging.set(true);
    }
    moveDrag(event) {
        if (!this.drag || this.drag.pointerId !== event.pointerId)
            return;
        const { maximum, travel } = this.metrics();
        if (travel)
            this.viewport().scrollTop =
                this.drag.position + ((event.clientY - this.drag.y) * maximum) / travel;
    }
    endDrag(event) {
        if (this.drag?.pointerId !== event.pointerId)
            return;
        this.drag = undefined;
        this.dragging.set(false);
        const thumb = event.currentTarget;
        if (thumb.hasPointerCapture(event.pointerId))
            thumb.releasePointerCapture(event.pointerId);
    }
    onKeydown(event) {
        const viewport = this.viewport();
        const step = Number.parseFloat(getComputedStyle(viewport).getPropertyValue("--controller-size"));
        let next;
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
    onWheel(event) {
        if (!event.deltaY)
            return;
        event.preventDefault();
        event.stopPropagation();
        const viewport = this.viewport();
        const unit = event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? viewport.clientHeight
            : event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? Number.parseFloat(getComputedStyle(viewport).lineHeight)
                : 1;
        viewport.scrollTop += event.deltaY * unit;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverScrollbarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxPopoverScrollbarComponent, isStandalone: true, selector: "cx-popover-scrollbar", inputs: { viewport: { classPropertyName: "viewport", publicName: "viewport", isSignal: true, isRequired: true, transformFunction: null } }, ngImport: i0, template: "@if (metrics().maximum > 0 && metrics().height > 0) {\n  <div\n    class=\"cx-popover-scrollbar__thumb\"\n    role=\"scrollbar\"\n    tabindex=\"0\"\n    aria-label=\"Scroll popover\"\n    aria-orientation=\"vertical\"\n    aria-valuemin=\"0\"\n    [attr.aria-controls]=\"viewport().id\"\n    [attr.aria-valuemax]=\"metrics().maximum\"\n    [attr.aria-valuenow]=\"metrics().position\"\n    [class.cx-popover-scrollbar__thumb--active]=\"scrolling() || dragging()\"\n    [style.height.px]=\"metrics().height\"\n    [style.top.px]=\"metrics().top\"\n    (pointerdown)=\"startDrag($event)\"\n    (pointermove)=\"moveDrag($event)\"\n    (pointerup)=\"endDrag($event)\"\n    (pointercancel)=\"endDrag($event)\"\n    (lostpointercapture)=\"endDrag($event)\"\n    (keydown)=\"onKeydown($event)\"\n    (wheel)=\"onWheel($event)\"\n    (click)=\"$event.stopPropagation()\"\n  ></div>\n}\n", styles: [":host{position:absolute;inset-block:calc(var(--surface-separation) + var(--space-xs));inset-inline-end:var(--surface-separation);width:var(--space-md);pointer-events:none}.cx-popover-scrollbar__thumb{position:absolute;inset-inline:0;border-radius:var(--radius-pill);opacity:0;pointer-events:none;touch-action:none;user-select:none;transition:opacity var(--motion-fast) var(--ease-out)}.cx-popover-scrollbar__thumb::after{content:\"\";position:absolute;inset-block:0;inset-inline-end:var(--space-xs);width:var(--space-xs);border-radius:inherit;background:var(--opacity-high)}:host-context(.cx-popover:hover) .cx-popover-scrollbar__thumb,.cx-popover-scrollbar__thumb:focus-visible,.cx-popover-scrollbar__thumb--active{opacity:1;pointer-events:auto}.cx-popover-scrollbar__thumb:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-popover-scrollbar__thumb{transition:none}}@media(forced-colors: active){.cx-popover-scrollbar__thumb::after{background:CanvasText}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPopoverScrollbarComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-popover-scrollbar", changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (metrics().maximum > 0 && metrics().height > 0) {\n  <div\n    class=\"cx-popover-scrollbar__thumb\"\n    role=\"scrollbar\"\n    tabindex=\"0\"\n    aria-label=\"Scroll popover\"\n    aria-orientation=\"vertical\"\n    aria-valuemin=\"0\"\n    [attr.aria-controls]=\"viewport().id\"\n    [attr.aria-valuemax]=\"metrics().maximum\"\n    [attr.aria-valuenow]=\"metrics().position\"\n    [class.cx-popover-scrollbar__thumb--active]=\"scrolling() || dragging()\"\n    [style.height.px]=\"metrics().height\"\n    [style.top.px]=\"metrics().top\"\n    (pointerdown)=\"startDrag($event)\"\n    (pointermove)=\"moveDrag($event)\"\n    (pointerup)=\"endDrag($event)\"\n    (pointercancel)=\"endDrag($event)\"\n    (lostpointercapture)=\"endDrag($event)\"\n    (keydown)=\"onKeydown($event)\"\n    (wheel)=\"onWheel($event)\"\n    (click)=\"$event.stopPropagation()\"\n  ></div>\n}\n", styles: [":host{position:absolute;inset-block:calc(var(--surface-separation) + var(--space-xs));inset-inline-end:var(--surface-separation);width:var(--space-md);pointer-events:none}.cx-popover-scrollbar__thumb{position:absolute;inset-inline:0;border-radius:var(--radius-pill);opacity:0;pointer-events:none;touch-action:none;user-select:none;transition:opacity var(--motion-fast) var(--ease-out)}.cx-popover-scrollbar__thumb::after{content:\"\";position:absolute;inset-block:0;inset-inline-end:var(--space-xs);width:var(--space-xs);border-radius:inherit;background:var(--opacity-high)}:host-context(.cx-popover:hover) .cx-popover-scrollbar__thumb,.cx-popover-scrollbar__thumb:focus-visible,.cx-popover-scrollbar__thumb--active{opacity:1;pointer-events:auto}.cx-popover-scrollbar__thumb:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-popover-scrollbar__thumb{transition:none}}@media(forced-colors: active){.cx-popover-scrollbar__thumb::after{background:CanvasText}}"] }]
        }], ctorParameters: () => [], propDecorators: { viewport: [{ type: i0.Input, args: [{ isSignal: true, alias: "viewport", required: true }] }] } });
