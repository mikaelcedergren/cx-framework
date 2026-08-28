import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * A short text label with a light sweeping across it, used to signal active
 * generation or background work (streaming, "thinking", loading). It rests at a
 * readable strength and sweeps a brighter highlight across using the system
 * color tokens. A static base paint always remains underneath the highlight,
 * and reduced-motion removes the highlight entirely.
 */
export class CxTextShimmerComponent {
    /** The label to shimmer. */
    text = '';
    /** Whether the highlight sweeps. When false the readable base label remains still. */
    active = true;
    visibleText$() {
        return this.text.trim();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTextShimmerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxTextShimmerComponent, isStandalone: true, selector: "cx-text-shimmer", inputs: { text: "text", active: "active" }, host: { attributes: { "role": "status" }, properties: { "class.cx-text-shimmer--active": "active", "attr.aria-label": "visibleText$() || null" } }, ngImport: i0, template: "  <span class=\"cx-text-shimmer__text\">\n    <span class=\"cx-text-shimmer__paint\">{{ visibleText$() }}</span>\n  </span>\n", styles: [":host{display:inline-block;max-width:100%;min-width:0;font-size:inherit;font-weight:inherit;line-height:var(--line-height-body)}.cx-text-shimmer__text{display:inline-block;max-width:100%;min-width:0}.cx-text-shimmer__paint{display:inline-block;max-width:100%;min-width:0;color:var(--opacity-high);overflow-wrap:anywhere}@supports(background-clip: text) or (-webkit-background-clip: text){:host(.cx-text-shimmer--active) .cx-text-shimmer__paint{background-image:linear-gradient(100deg, transparent 42%, var(--ink) 50%, transparent 58%),linear-gradient(var(--opacity-high), var(--opacity-high));background-position:120% 0,0 0;background-repeat:no-repeat,no-repeat;background-size:200% 100%,100% 100%;background-clip:text;-webkit-background-clip:text;color:rgba(0,0,0,0);animation:cx-text-shimmer-sweep 1.8s linear infinite}}@keyframes cx-text-shimmer-sweep{from{background-position:120% 0,0 0}to{background-position:-20% 0,0 0}}@media(prefers-reduced-motion: reduce){:host(.cx-text-shimmer--active) .cx-text-shimmer__paint{background:none;color:var(--opacity-high);animation:none}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTextShimmerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-text-shimmer', host: {
                        role: 'status',
                        '[class.cx-text-shimmer--active]': 'active',
                        '[attr.aria-label]': 'visibleText$() || null',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "  <span class=\"cx-text-shimmer__text\">\n    <span class=\"cx-text-shimmer__paint\">{{ visibleText$() }}</span>\n  </span>\n", styles: [":host{display:inline-block;max-width:100%;min-width:0;font-size:inherit;font-weight:inherit;line-height:var(--line-height-body)}.cx-text-shimmer__text{display:inline-block;max-width:100%;min-width:0}.cx-text-shimmer__paint{display:inline-block;max-width:100%;min-width:0;color:var(--opacity-high);overflow-wrap:anywhere}@supports(background-clip: text) or (-webkit-background-clip: text){:host(.cx-text-shimmer--active) .cx-text-shimmer__paint{background-image:linear-gradient(100deg, transparent 42%, var(--ink) 50%, transparent 58%),linear-gradient(var(--opacity-high), var(--opacity-high));background-position:120% 0,0 0;background-repeat:no-repeat,no-repeat;background-size:200% 100%,100% 100%;background-clip:text;-webkit-background-clip:text;color:rgba(0,0,0,0);animation:cx-text-shimmer-sweep 1.8s linear infinite}}@keyframes cx-text-shimmer-sweep{from{background-position:120% 0,0 0}to{background-position:-20% 0,0 0}}@media(prefers-reduced-motion: reduce){:host(.cx-text-shimmer--active) .cx-text-shimmer__paint{background:none;color:var(--opacity-high);animation:none}}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], active: [{
                type: Input
            }] } });
