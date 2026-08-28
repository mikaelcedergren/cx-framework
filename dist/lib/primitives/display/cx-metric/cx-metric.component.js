import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxMetricComponent {
    label = 'Metric';
    value = '0';
    size = 'default';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMetricComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxMetricComponent, isStandalone: true, selector: "cx-metric", inputs: { label: "label", value: "value", size: "size" }, host: { properties: { "class.cx-metric--small": "size === \"small\"", "class.cx-metric--default": "size === \"default\"", "class.cx-metric--large": "size === \"large\"" } }, ngImport: i0, template: "<div class=\"cx-metric__label\">{{ label }}</div>\n<div class=\"cx-metric__value-row\">\n  <div class=\"cx-metric__value\">{{ value }}</div>\n  <ng-content select=\"[slot=trend]\" />\n</div>\n", styles: [":host{display:flex;min-width:0;flex-direction:column;gap:var(--space-xs);color:var(--ink)}.cx-metric__label{min-width:0;color:var(--opacity-high);overflow-wrap:anywhere}.cx-metric__value-row{display:flex;min-width:0;flex-flow:row wrap;align-items:center;gap:var(--space-sm)}.cx-metric__value{min-width:0;color:var(--ink);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cx-metric__value-row>[slot=trend]{flex:0 0 auto}:host(.cx-metric--small) .cx-metric__label{font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}:host(.cx-metric--small) .cx-metric__value{font-size:var(--font-size-title-1)}:host(.cx-metric--default) .cx-metric__label{font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}:host(.cx-metric--default) .cx-metric__value{font-size:var(--controller-size)}:host(.cx-metric--large){gap:var(--space-sm)}:host(.cx-metric--large) .cx-metric__label{font-size:var(--font-size-title-2);font-weight:var(--font-weight-regular);line-height:var(--line-height-heading)}:host(.cx-metric--large) .cx-metric__value{font-size:calc(var(--controller-size)*1.5)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMetricComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-metric', host: {
                        '[class.cx-metric--small]': 'size === "small"',
                        '[class.cx-metric--default]': 'size === "default"',
                        '[class.cx-metric--large]': 'size === "large"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-metric__label\">{{ label }}</div>\n<div class=\"cx-metric__value-row\">\n  <div class=\"cx-metric__value\">{{ value }}</div>\n  <ng-content select=\"[slot=trend]\" />\n</div>\n", styles: [":host{display:flex;min-width:0;flex-direction:column;gap:var(--space-xs);color:var(--ink)}.cx-metric__label{min-width:0;color:var(--opacity-high);overflow-wrap:anywhere}.cx-metric__value-row{display:flex;min-width:0;flex-flow:row wrap;align-items:center;gap:var(--space-sm)}.cx-metric__value{min-width:0;color:var(--ink);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cx-metric__value-row>[slot=trend]{flex:0 0 auto}:host(.cx-metric--small) .cx-metric__label{font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}:host(.cx-metric--small) .cx-metric__value{font-size:var(--font-size-title-1)}:host(.cx-metric--default) .cx-metric__label{font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}:host(.cx-metric--default) .cx-metric__value{font-size:var(--controller-size)}:host(.cx-metric--large){gap:var(--space-sm)}:host(.cx-metric--large) .cx-metric__label{font-size:var(--font-size-title-2);font-weight:var(--font-weight-regular);line-height:var(--line-height-heading)}:host(.cx-metric--large) .cx-metric__value{font-size:calc(var(--controller-size)*1.5)}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], value: [{
                type: Input
            }], size: [{
                type: Input
            }] } });
