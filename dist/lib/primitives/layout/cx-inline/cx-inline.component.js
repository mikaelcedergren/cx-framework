import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxInlineComponent {
    gap = 'sm';
    gapMobile;
    align = 'center';
    justify = 'start';
    wrap = false;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxInlineComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxInlineComponent, isStandalone: true, selector: "cx-inline", inputs: { gap: "gap", gapMobile: "gapMobile", align: "align", justify: "justify", wrap: "wrap" }, host: { properties: { "attr.data-gap": "gap", "attr.data-gap-mobile": "gapMobile", "attr.data-align": "align", "attr.data-justify": "justify", "attr.data-wrap": "wrap ? 'wrap' : 'nowrap'" } }, ngImport: i0, template: "<div class=\"cx-inline\">\n  <ng-content />\n</div>\n", styles: [":host{display:block;width:100%}.cx-inline{display:flex;width:100%;min-width:0;box-sizing:border-box}.cx-inline:empty{display:none}:host([data-gap=\"2xs\"])>.cx-inline{gap:var(--space-2xs)}:host([data-gap=xs])>.cx-inline{gap:var(--space-xs)}:host([data-gap=sm])>.cx-inline{gap:var(--space-sm)}:host([data-gap=md])>.cx-inline{gap:var(--space-md)}:host([data-gap=lg])>.cx-inline{gap:var(--space-lg)}:host([data-gap=xl])>.cx-inline{gap:var(--space-xl)}:host([data-gap=\"2xl\"])>.cx-inline{gap:var(--space-2xl)}@media(max-width: 719px){:host([data-gap-mobile=\"2xs\"])>.cx-inline{gap:var(--space-2xs)}:host([data-gap-mobile=xs])>.cx-inline{gap:var(--space-xs)}:host([data-gap-mobile=sm])>.cx-inline{gap:var(--space-sm)}:host([data-gap-mobile=md])>.cx-inline{gap:var(--space-md)}:host([data-gap-mobile=lg])>.cx-inline{gap:var(--space-lg)}:host([data-gap-mobile=xl])>.cx-inline{gap:var(--space-xl)}:host([data-gap-mobile=\"2xl\"])>.cx-inline{gap:var(--space-2xl)}}:host([data-align=start])>.cx-inline{align-items:flex-start}:host([data-align=center])>.cx-inline{align-items:center}:host([data-align=end])>.cx-inline{align-items:flex-end}:host([data-align=stretch])>.cx-inline{align-items:stretch}:host([data-justify=start])>.cx-inline{justify-content:flex-start}:host([data-justify=center])>.cx-inline{justify-content:center}:host([data-justify=end])>.cx-inline{justify-content:flex-end}:host([data-justify=between])>.cx-inline{justify-content:space-between}:host([data-wrap=wrap])>.cx-inline{flex-wrap:wrap}:host([data-wrap=nowrap])>.cx-inline{flex-wrap:nowrap}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxInlineComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-inline', host: {
                        '[attr.data-gap]': 'gap',
                        '[attr.data-gap-mobile]': 'gapMobile',
                        '[attr.data-align]': 'align',
                        '[attr.data-justify]': 'justify',
                        '[attr.data-wrap]': "wrap ? 'wrap' : 'nowrap'",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-inline\">\n  <ng-content />\n</div>\n", styles: [":host{display:block;width:100%}.cx-inline{display:flex;width:100%;min-width:0;box-sizing:border-box}.cx-inline:empty{display:none}:host([data-gap=\"2xs\"])>.cx-inline{gap:var(--space-2xs)}:host([data-gap=xs])>.cx-inline{gap:var(--space-xs)}:host([data-gap=sm])>.cx-inline{gap:var(--space-sm)}:host([data-gap=md])>.cx-inline{gap:var(--space-md)}:host([data-gap=lg])>.cx-inline{gap:var(--space-lg)}:host([data-gap=xl])>.cx-inline{gap:var(--space-xl)}:host([data-gap=\"2xl\"])>.cx-inline{gap:var(--space-2xl)}@media(max-width: 719px){:host([data-gap-mobile=\"2xs\"])>.cx-inline{gap:var(--space-2xs)}:host([data-gap-mobile=xs])>.cx-inline{gap:var(--space-xs)}:host([data-gap-mobile=sm])>.cx-inline{gap:var(--space-sm)}:host([data-gap-mobile=md])>.cx-inline{gap:var(--space-md)}:host([data-gap-mobile=lg])>.cx-inline{gap:var(--space-lg)}:host([data-gap-mobile=xl])>.cx-inline{gap:var(--space-xl)}:host([data-gap-mobile=\"2xl\"])>.cx-inline{gap:var(--space-2xl)}}:host([data-align=start])>.cx-inline{align-items:flex-start}:host([data-align=center])>.cx-inline{align-items:center}:host([data-align=end])>.cx-inline{align-items:flex-end}:host([data-align=stretch])>.cx-inline{align-items:stretch}:host([data-justify=start])>.cx-inline{justify-content:flex-start}:host([data-justify=center])>.cx-inline{justify-content:center}:host([data-justify=end])>.cx-inline{justify-content:flex-end}:host([data-justify=between])>.cx-inline{justify-content:space-between}:host([data-wrap=wrap])>.cx-inline{flex-wrap:wrap}:host([data-wrap=nowrap])>.cx-inline{flex-wrap:nowrap}"] }]
        }], propDecorators: { gap: [{
                type: Input
            }], gapMobile: [{
                type: Input
            }], align: [{
                type: Input
            }], justify: [{
                type: Input
            }], wrap: [{
                type: Input
            }] } });
