import { ChangeDetectionStrategy, Component } from "@angular/core";
import * as i0 from "@angular/core";
/** Visual destination only; the collection owns drag behavior and placement. */
export class CxDropIndicatorComponent {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxDropIndicatorComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.2.2", type: CxDropIndicatorComponent, isStandalone: true, selector: "cx-drop-indicator", host: { attributes: { "aria-hidden": "true", "inert": "" } }, ngImport: i0, template: "<div class=\"cx-drop-indicator__sizer\"><ng-content /></div>\n", styles: [":host{display:block;position:relative;min-width:0;border-radius:var(--radius-lg);background:var(--primary-opacity);pointer-events:none}:host::after{content:\"\";position:absolute;inset:0;box-sizing:border-box;border:calc(var(--border-width)*2) dashed var(--primary);border-radius:inherit}.cx-drop-indicator__sizer{visibility:hidden}.cx-drop-indicator__sizer:empty{height:var(--controller-size)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxDropIndicatorComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-drop-indicator", host: { "aria-hidden": "true", inert: "" }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-drop-indicator__sizer\"><ng-content /></div>\n", styles: [":host{display:block;position:relative;min-width:0;border-radius:var(--radius-lg);background:var(--primary-opacity);pointer-events:none}:host::after{content:\"\";position:absolute;inset:0;box-sizing:border-box;border:calc(var(--border-width)*2) dashed var(--primary);border-radius:inherit}.cx-drop-indicator__sizer{visibility:hidden}.cx-drop-indicator__sizer:empty{height:var(--controller-size)}"] }]
        }] });
