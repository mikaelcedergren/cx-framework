import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { CxTooltipDirective, } from './cx-tooltip.directive.js';
import * as i0 from "@angular/core";
/**
 * Composition sugar for templates that need to wrap projected content.
 * Prefer attaching `cxTooltip` directly to the native trigger when possible.
 */
export class CxTooltipComponent {
    text = input(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "text" }] : /* istanbul ignore next */ []));
    delay = input('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "delay" }] : /* istanbul ignore next */ []));
    disabled = input(false, { ...(ngDevMode ? { debugName: "disabled" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    position = input('top', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "position" }] : /* istanbul ignore next */ []));
    onlyWhenTruncated = input(false, { ...(ngDevMode ? { debugName: "onlyWhenTruncated" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.1.0", version: "22.0.8", type: CxTooltipComponent, isStandalone: true, selector: "cx-tooltip", inputs: { text: { classPropertyName: "text", publicName: "text", isSignal: true, isRequired: false, transformFunction: null }, delay: { classPropertyName: "delay", publicName: "delay", isSignal: true, isRequired: false, transformFunction: null }, disabled: { classPropertyName: "disabled", publicName: "disabled", isSignal: true, isRequired: false, transformFunction: null }, position: { classPropertyName: "position", publicName: "position", isSignal: true, isRequired: false, transformFunction: null }, onlyWhenTruncated: { classPropertyName: "onlyWhenTruncated", publicName: "onlyWhenTruncated", isSignal: true, isRequired: false, transformFunction: null } }, ngImport: i0, template: "<span\n  class=\"cx-tooltip__trigger\"\n  [cxTooltip]=\"text()\"\n  [cxTooltipPosition]=\"position()\"\n  [cxTooltipDelay]=\"delay()\"\n  [cxTooltipDisabled]=\"disabled()\"\n  [cxTooltipOverflow]=\"onlyWhenTruncated()\"\n>\n  <ng-content />\n</span>\n", styles: [":host{display:inline-flex;min-width:0;width:auto}.cx-tooltip__trigger{display:inline-flex;min-width:0;width:auto}"], dependencies: [{ kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTooltipComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-tooltip', imports: [CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<span\n  class=\"cx-tooltip__trigger\"\n  [cxTooltip]=\"text()\"\n  [cxTooltipPosition]=\"position()\"\n  [cxTooltipDelay]=\"delay()\"\n  [cxTooltipDisabled]=\"disabled()\"\n  [cxTooltipOverflow]=\"onlyWhenTruncated()\"\n>\n  <ng-content />\n</span>\n", styles: [":host{display:inline-flex;min-width:0;width:auto}.cx-tooltip__trigger{display:inline-flex;min-width:0;width:auto}"] }]
        }], propDecorators: { text: [{ type: i0.Input, args: [{ isSignal: true, alias: "text", required: false }] }], delay: [{ type: i0.Input, args: [{ isSignal: true, alias: "delay", required: false }] }], disabled: [{ type: i0.Input, args: [{ isSignal: true, alias: "disabled", required: false }] }], position: [{ type: i0.Input, args: [{ isSignal: true, alias: "position", required: false }] }], onlyWhenTruncated: [{ type: i0.Input, args: [{ isSignal: true, alias: "onlyWhenTruncated", required: false }] }] } });
