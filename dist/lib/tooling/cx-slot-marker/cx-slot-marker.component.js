import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxSlotMarkerComponent {
    label = 'slot';
    display = 'inline';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSlotMarkerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxSlotMarkerComponent, isStandalone: true, selector: "cx-slot-marker", inputs: { label: "label", display: "display" }, host: { properties: { "class.cx-slot-marker-host--block": "display === \"block\"" } }, ngImport: i0, template: "<span class=\"cx-slot-marker\">{{ label }}</span>\n", styles: [":host {\n  display: inline-flex;\n  min-width: 0;\n}\n\n:host(.cx-slot-marker-host--block) {\n  display: flex;\n  width: 100%;\n}\n\n.cx-slot-marker {\n  display: inline-flex;\n  width: fit-content;\n  max-width: 100%;\n  min-height: calc(var(--space-md) + var(--space-xs));\n  align-items: center;\n  justify-content: center;\n  border: 1px dashed var(--opacity-mid);\n  border-radius: var(--radius-sm);\n  padding: var(--space-2xs) var(--space-xs);\n  background: color-mix(in srgb, var(--opacity-low) 50%, transparent);\n  color: var(--opacity-high);\n  font-family: var(--font-family-mono);\n  font-size: var(--font-size-body-sm);\n  font-weight: var(--font-weight-medium);\n  line-height: var(--line-height-small);\n  overflow-wrap: anywhere;\n  box-sizing: border-box;\n}\n\n:host(.cx-slot-marker-host--block) .cx-slot-marker {\n  width: 100%;\n}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSlotMarkerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-slot-marker', host: {
                        '[class.cx-slot-marker-host--block]': 'display === "block"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<span class=\"cx-slot-marker\">{{ label }}</span>\n", styles: [":host {\n  display: inline-flex;\n  min-width: 0;\n}\n\n:host(.cx-slot-marker-host--block) {\n  display: flex;\n  width: 100%;\n}\n\n.cx-slot-marker {\n  display: inline-flex;\n  width: fit-content;\n  max-width: 100%;\n  min-height: calc(var(--space-md) + var(--space-xs));\n  align-items: center;\n  justify-content: center;\n  border: 1px dashed var(--opacity-mid);\n  border-radius: var(--radius-sm);\n  padding: var(--space-2xs) var(--space-xs);\n  background: color-mix(in srgb, var(--opacity-low) 50%, transparent);\n  color: var(--opacity-high);\n  font-family: var(--font-family-mono);\n  font-size: var(--font-size-body-sm);\n  font-weight: var(--font-weight-medium);\n  line-height: var(--line-height-small);\n  overflow-wrap: anywhere;\n  box-sizing: border-box;\n}\n\n:host(.cx-slot-marker-host--block) .cx-slot-marker {\n  width: 100%;\n}\n"] }]
        }], propDecorators: { label: [{
                type: Input
            }], display: [{
                type: Input
            }] } });
