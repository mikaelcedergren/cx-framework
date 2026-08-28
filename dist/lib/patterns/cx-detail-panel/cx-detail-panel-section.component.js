import { ChangeDetectionStrategy, Component } from '@angular/core';
import * as i0 from "@angular/core";
export class CxDetailPanelSectionComponent {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDetailPanelSectionComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxDetailPanelSectionComponent, isStandalone: true, selector: "cx-detail-panel-section", ngImport: i0, template: '<ng-content />', isInline: true, styles: [":host{display:flex;width:100%;max-width:100%;min-width:0;flex:0 0 auto;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);border:var(--line-discreet);border-radius:var(--cx-detail-panel-island-radius, var(--radius-lg));background:var(--surface);box-sizing:border-box}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDetailPanelSectionComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-detail-panel-section', template: '<ng-content />', changeDetection: ChangeDetectionStrategy.OnPush, styles: [":host{display:flex;width:100%;max-width:100%;min-width:0;flex:0 0 auto;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);border:var(--line-discreet);border-radius:var(--cx-detail-panel-island-radius, var(--radius-lg));background:var(--surface);box-sizing:border-box}"] }]
        }] });
