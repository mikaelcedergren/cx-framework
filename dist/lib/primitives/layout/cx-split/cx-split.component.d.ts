import { type CxLayoutAlign, type CxLayoutGap } from '../layout.types';
import * as i0 from "@angular/core";
export declare class CxSplitComponent {
    gap: CxLayoutGap;
    gapMobile: CxLayoutGap | undefined;
    align: CxLayoutAlign;
    startWidth: 'auto' | 'sm' | 'md' | 'lg';
    /**
     * Let the end group drop to its own line when it no longer fits beside the
     * start group.
     *
     * Off by default, because a split's whole point is two ends of one line. Turn
     * it on for a header whose end group is controls rather than a button or two:
     * squeezing a search field and a dropdown into the space left over is worse
     * than giving them a row of their own on a narrow screen.
     */
    wrap: boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSplitComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSplitComponent, "cx-split", never, { "gap": { "alias": "gap"; "required": false; }; "gapMobile": { "alias": "gapMobile"; "required": false; }; "align": { "alias": "align"; "required": false; }; "startWidth": { "alias": "startWidth"; "required": false; }; "wrap": { "alias": "wrap"; "required": false; }; }, {}, never, ["[start]", "[end]"], true, never>;
}
//# sourceMappingURL=cx-split.component.d.ts.map