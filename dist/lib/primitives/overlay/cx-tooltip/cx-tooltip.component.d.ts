import { type CxTooltipDelay, type CxTooltipPosition } from './cx-tooltip.directive';
import * as i0 from "@angular/core";
/**
 * Composition sugar for templates that need to wrap projected content.
 * Prefer attaching `cxTooltip` directly to the native trigger when possible.
 */
export declare class CxTooltipComponent {
    readonly text: import("@angular/core").InputSignal<string | undefined>;
    readonly delay: import("@angular/core").InputSignal<CxTooltipDelay>;
    readonly disabled: import("@angular/core").InputSignalWithTransform<boolean, unknown>;
    readonly position: import("@angular/core").InputSignal<CxTooltipPosition>;
    readonly onlyWhenTruncated: import("@angular/core").InputSignalWithTransform<boolean, unknown>;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTooltipComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTooltipComponent, "cx-tooltip", never, { "text": { "alias": "text"; "required": false; "isSignal": true; }; "delay": { "alias": "delay"; "required": false; "isSignal": true; }; "disabled": { "alias": "disabled"; "required": false; "isSignal": true; }; "position": { "alias": "position"; "required": false; "isSignal": true; }; "onlyWhenTruncated": { "alias": "onlyWhenTruncated"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-tooltip.component.d.ts.map