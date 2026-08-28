import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxStackComponent {
    gap = 'md';
    gapMobile;
    align = 'stretch';
    justify = 'start';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStackComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxStackComponent, isStandalone: true, selector: "cx-stack", inputs: { gap: "gap", gapMobile: "gapMobile", align: "align", justify: "justify" }, host: { properties: { "attr.data-gap": "gap", "attr.data-gap-mobile": "gapMobile", "attr.data-align": "align", "attr.data-justify": "justify" } }, ngImport: i0, template: "<div class=\"cx-stack\">\n  <ng-content />\n</div>\n", styles: [":host{display:block;width:100%}.cx-stack{display:flex;width:100%;flex-direction:column;min-width:0;box-sizing:border-box}.cx-stack:empty{display:none}:host([data-gap=\"2xs\"])>.cx-stack{gap:var(--space-2xs)}:host([data-gap=xs])>.cx-stack{gap:var(--space-xs)}:host([data-gap=sm])>.cx-stack{gap:var(--space-sm)}:host([data-gap=md])>.cx-stack{gap:var(--space-md)}:host([data-gap=lg])>.cx-stack{gap:var(--space-lg)}:host([data-gap=xl])>.cx-stack{gap:var(--space-xl)}:host([data-gap=\"2xl\"])>.cx-stack{gap:var(--space-2xl)}@media(max-width: 719px){:host([data-gap-mobile=\"2xs\"])>.cx-stack{gap:var(--space-2xs)}:host([data-gap-mobile=xs])>.cx-stack{gap:var(--space-xs)}:host([data-gap-mobile=sm])>.cx-stack{gap:var(--space-sm)}:host([data-gap-mobile=md])>.cx-stack{gap:var(--space-md)}:host([data-gap-mobile=lg])>.cx-stack{gap:var(--space-lg)}:host([data-gap-mobile=xl])>.cx-stack{gap:var(--space-xl)}:host([data-gap-mobile=\"2xl\"])>.cx-stack{gap:var(--space-2xl)}}:host([data-align=start])>.cx-stack{align-items:flex-start}:host([data-align=center])>.cx-stack{align-items:center}:host([data-align=end])>.cx-stack{align-items:flex-end}:host([data-align=stretch])>.cx-stack{align-items:stretch}:host([data-justify=start])>.cx-stack{justify-content:flex-start}:host([data-justify=center])>.cx-stack{justify-content:center}:host([data-justify=end])>.cx-stack{justify-content:flex-end}:host([data-justify=between])>.cx-stack{justify-content:space-between}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStackComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-stack', host: {
                        '[attr.data-gap]': 'gap',
                        '[attr.data-gap-mobile]': 'gapMobile',
                        '[attr.data-align]': 'align',
                        '[attr.data-justify]': 'justify',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-stack\">\n  <ng-content />\n</div>\n", styles: [":host{display:block;width:100%}.cx-stack{display:flex;width:100%;flex-direction:column;min-width:0;box-sizing:border-box}.cx-stack:empty{display:none}:host([data-gap=\"2xs\"])>.cx-stack{gap:var(--space-2xs)}:host([data-gap=xs])>.cx-stack{gap:var(--space-xs)}:host([data-gap=sm])>.cx-stack{gap:var(--space-sm)}:host([data-gap=md])>.cx-stack{gap:var(--space-md)}:host([data-gap=lg])>.cx-stack{gap:var(--space-lg)}:host([data-gap=xl])>.cx-stack{gap:var(--space-xl)}:host([data-gap=\"2xl\"])>.cx-stack{gap:var(--space-2xl)}@media(max-width: 719px){:host([data-gap-mobile=\"2xs\"])>.cx-stack{gap:var(--space-2xs)}:host([data-gap-mobile=xs])>.cx-stack{gap:var(--space-xs)}:host([data-gap-mobile=sm])>.cx-stack{gap:var(--space-sm)}:host([data-gap-mobile=md])>.cx-stack{gap:var(--space-md)}:host([data-gap-mobile=lg])>.cx-stack{gap:var(--space-lg)}:host([data-gap-mobile=xl])>.cx-stack{gap:var(--space-xl)}:host([data-gap-mobile=\"2xl\"])>.cx-stack{gap:var(--space-2xl)}}:host([data-align=start])>.cx-stack{align-items:flex-start}:host([data-align=center])>.cx-stack{align-items:center}:host([data-align=end])>.cx-stack{align-items:flex-end}:host([data-align=stretch])>.cx-stack{align-items:stretch}:host([data-justify=start])>.cx-stack{justify-content:flex-start}:host([data-justify=center])>.cx-stack{justify-content:center}:host([data-justify=end])>.cx-stack{justify-content:flex-end}:host([data-justify=between])>.cx-stack{justify-content:space-between}"] }]
        }], propDecorators: { gap: [{
                type: Input
            }], gapMobile: [{
                type: Input
            }], align: [{
                type: Input
            }], justify: [{
                type: Input
            }] } });
