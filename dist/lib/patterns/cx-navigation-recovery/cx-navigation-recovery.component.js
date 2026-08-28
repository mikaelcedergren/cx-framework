import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CxBannerComponent } from '../../primitives/feedback/cx-banner/index.js';
import { CxNavigationRecoveryService } from './cx-navigation-recovery.service.js';
import * as i0 from "@angular/core";
export class CxNavigationRecoveryComponent {
    recovery = inject(CxNavigationRecoveryService);
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNavigationRecoveryComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxNavigationRecoveryComponent, isStandalone: true, selector: "cx-navigation-recovery", ngImport: i0, template: "@if (recovery.state(); as state) {\n  <cx-banner\n    [mood]=\"state.mood\"\n    [heading]=\"state.heading\"\n    [description]=\"state.description\"\n    [action]=\"state.primaryAction\"\n    [secondaryAction]=\"state.secondaryAction\"\n    [dismissAriaLabel]=\"state.dismissAriaLabel\"\n    [dismissible]=\"true\"\n    [visible]=\"true\"\n    (actionSelect)=\"recovery.performPrimaryAction()\"\n    (secondaryActionSelect)=\"recovery.performSecondaryAction()\"\n    (visibleChange)=\"recovery.dismiss()\"\n  />\n}\n", styles: [":host{display:contents}"], dependencies: [{ kind: "component", type: CxBannerComponent, selector: "cx-banner", inputs: ["mood", "heading", "description", "action", "secondaryAction", "dismissAriaLabel", "dismissible", "visible"], outputs: ["actionSelect", "secondaryActionSelect", "visibleChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNavigationRecoveryComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-navigation-recovery', imports: [CxBannerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (recovery.state(); as state) {\n  <cx-banner\n    [mood]=\"state.mood\"\n    [heading]=\"state.heading\"\n    [description]=\"state.description\"\n    [action]=\"state.primaryAction\"\n    [secondaryAction]=\"state.secondaryAction\"\n    [dismissAriaLabel]=\"state.dismissAriaLabel\"\n    [dismissible]=\"true\"\n    [visible]=\"true\"\n    (actionSelect)=\"recovery.performPrimaryAction()\"\n    (secondaryActionSelect)=\"recovery.performSecondaryAction()\"\n    (visibleChange)=\"recovery.dismiss()\"\n  />\n}\n", styles: [":host{display:contents}"] }]
        }] });
