import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxDividerComponent {
    discreet = false;
    thick = false;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDividerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxDividerComponent, isStandalone: true, selector: "cx-divider", inputs: { discreet: "discreet", thick: "thick" }, host: { properties: { "class.cx-divider--discreet": "discreet", "class.cx-divider--thick": "thick" } }, ngImport: i0, template: '', isInline: true, styles: [":host{display:block;width:100%;height:1px;flex:0 0 auto;background:var(--opacity-mid)}:host(.cx-divider--discreet){background:var(--opacity-low)}:host(.cx-divider--thick){height:3px}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDividerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-divider', template: '', host: {
                        '[class.cx-divider--discreet]': 'discreet',
                        '[class.cx-divider--thick]': 'thick',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, styles: [":host{display:block;width:100%;height:1px;flex:0 0 auto;background:var(--opacity-mid)}:host(.cx-divider--discreet){background:var(--opacity-low)}:host(.cx-divider--thick){height:3px}"] }]
        }], propDecorators: { discreet: [{
                type: Input
            }], thick: [{
                type: Input
            }] } });
