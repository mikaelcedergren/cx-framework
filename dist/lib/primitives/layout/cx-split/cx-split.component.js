import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxSplitComponent {
    gap = 'md';
    gapMobile;
    align = 'center';
    startWidth = 'auto';
    /**
     * Let the end group drop to its own line when it no longer fits beside the
     * start group.
     *
     * Off by default, because a split's whole point is two ends of one line. Turn
     * it on for a header whose end group is controls rather than a button or two:
     * squeezing a search field and a dropdown into the space left over is worse
     * than giving them a row of their own on a narrow screen.
     */
    wrap = false;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSplitComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxSplitComponent, isStandalone: true, selector: "cx-split", inputs: { gap: "gap", gapMobile: "gapMobile", align: "align", startWidth: "startWidth", wrap: "wrap" }, host: { properties: { "attr.data-gap": "gap", "attr.data-gap-mobile": "gapMobile", "attr.data-align": "align", "attr.data-start-width": "startWidth", "attr.data-wrap": "wrap ? 'wrap' : 'nowrap'" } }, ngImport: i0, template: "<div class=\"cx-split\">\n  <div class=\"cx-split__start\">\n    <ng-content select=\"[start]\" />\n  </div>\n  <div class=\"cx-split__end\">\n    <ng-content select=\"[end]\" />\n  </div>\n</div>\n", styles: [":host{display:block;width:100%}.cx-split{display:flex;width:100%;min-width:0;justify-content:space-between;box-sizing:border-box}.cx-split:not(:has(.cx-split__start>*,.cx-split__end>*)),.cx-split__start:empty,.cx-split__end:empty{display:none}.cx-split__start{display:flex;min-width:0;flex:1 1 auto;align-items:inherit;gap:inherit}.cx-split__end{display:inline-flex;flex:0 0 auto;align-items:inherit}:host([data-gap=\"2xs\"])>.cx-split{gap:var(--space-2xs)}:host([data-gap=xs])>.cx-split{gap:var(--space-xs)}:host([data-gap=sm])>.cx-split{gap:var(--space-sm)}:host([data-gap=md])>.cx-split{gap:var(--space-md)}:host([data-gap=lg])>.cx-split{gap:var(--space-lg)}:host([data-gap=xl])>.cx-split{gap:var(--space-xl)}:host([data-gap=\"2xl\"])>.cx-split{gap:var(--space-2xl)}@media(max-width: 719px){:host([data-gap-mobile=\"2xs\"])>.cx-split{gap:var(--space-2xs)}:host([data-gap-mobile=xs])>.cx-split{gap:var(--space-xs)}:host([data-gap-mobile=sm])>.cx-split{gap:var(--space-sm)}:host([data-gap-mobile=md])>.cx-split{gap:var(--space-md)}:host([data-gap-mobile=lg])>.cx-split{gap:var(--space-lg)}:host([data-gap-mobile=xl])>.cx-split{gap:var(--space-xl)}:host([data-gap-mobile=\"2xl\"])>.cx-split{gap:var(--space-2xl)}}:host([data-align=start])>.cx-split{align-items:flex-start}:host([data-align=center])>.cx-split{align-items:center}:host([data-align=end])>.cx-split{align-items:flex-end}:host([data-align=stretch])>.cx-split{align-items:stretch}:host([data-wrap=wrap])>.cx-split{flex-wrap:wrap}:host([data-wrap=nowrap])>.cx-split{flex-wrap:nowrap}:host([data-start-width=sm]) .cx-split__start{flex:0 0 min(280px,32%);max-width:min(280px,32%)}:host([data-start-width=md]) .cx-split__start{flex:0 0 min(360px,40%);max-width:min(360px,40%)}:host([data-start-width=lg]) .cx-split__start{flex:0 0 min(440px,48%);max-width:min(440px,48%)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSplitComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-split', host: {
                        '[attr.data-gap]': 'gap',
                        '[attr.data-gap-mobile]': 'gapMobile',
                        '[attr.data-align]': 'align',
                        '[attr.data-start-width]': 'startWidth',
                        '[attr.data-wrap]': "wrap ? 'wrap' : 'nowrap'",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-split\">\n  <div class=\"cx-split__start\">\n    <ng-content select=\"[start]\" />\n  </div>\n  <div class=\"cx-split__end\">\n    <ng-content select=\"[end]\" />\n  </div>\n</div>\n", styles: [":host{display:block;width:100%}.cx-split{display:flex;width:100%;min-width:0;justify-content:space-between;box-sizing:border-box}.cx-split:not(:has(.cx-split__start>*,.cx-split__end>*)),.cx-split__start:empty,.cx-split__end:empty{display:none}.cx-split__start{display:flex;min-width:0;flex:1 1 auto;align-items:inherit;gap:inherit}.cx-split__end{display:inline-flex;flex:0 0 auto;align-items:inherit}:host([data-gap=\"2xs\"])>.cx-split{gap:var(--space-2xs)}:host([data-gap=xs])>.cx-split{gap:var(--space-xs)}:host([data-gap=sm])>.cx-split{gap:var(--space-sm)}:host([data-gap=md])>.cx-split{gap:var(--space-md)}:host([data-gap=lg])>.cx-split{gap:var(--space-lg)}:host([data-gap=xl])>.cx-split{gap:var(--space-xl)}:host([data-gap=\"2xl\"])>.cx-split{gap:var(--space-2xl)}@media(max-width: 719px){:host([data-gap-mobile=\"2xs\"])>.cx-split{gap:var(--space-2xs)}:host([data-gap-mobile=xs])>.cx-split{gap:var(--space-xs)}:host([data-gap-mobile=sm])>.cx-split{gap:var(--space-sm)}:host([data-gap-mobile=md])>.cx-split{gap:var(--space-md)}:host([data-gap-mobile=lg])>.cx-split{gap:var(--space-lg)}:host([data-gap-mobile=xl])>.cx-split{gap:var(--space-xl)}:host([data-gap-mobile=\"2xl\"])>.cx-split{gap:var(--space-2xl)}}:host([data-align=start])>.cx-split{align-items:flex-start}:host([data-align=center])>.cx-split{align-items:center}:host([data-align=end])>.cx-split{align-items:flex-end}:host([data-align=stretch])>.cx-split{align-items:stretch}:host([data-wrap=wrap])>.cx-split{flex-wrap:wrap}:host([data-wrap=nowrap])>.cx-split{flex-wrap:nowrap}:host([data-start-width=sm]) .cx-split__start{flex:0 0 min(280px,32%);max-width:min(280px,32%)}:host([data-start-width=md]) .cx-split__start{flex:0 0 min(360px,40%);max-width:min(360px,40%)}:host([data-start-width=lg]) .cx-split__start{flex:0 0 min(440px,48%);max-width:min(440px,48%)}"] }]
        }], propDecorators: { gap: [{
                type: Input
            }], gapMobile: [{
                type: Input
            }], align: [{
                type: Input
            }], startWidth: [{
                type: Input
            }], wrap: [{
                type: Input
            }] } });
