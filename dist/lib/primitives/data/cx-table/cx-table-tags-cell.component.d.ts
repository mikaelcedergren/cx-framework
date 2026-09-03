import { type CxTagColor } from '../../display/cx-tag';
import * as i0 from "@angular/core";
interface CxTableTagsCellTag {
    label: string;
    color?: CxTagColor;
    outline?: boolean;
}
export declare class CxTableTagsCellComponent {
    private readonly host;
    private readonly tagsState;
    private readonly visibleCountState;
    private resizeObserver;
    private measurementFrame;
    set tags(value: readonly CxTableTagsCellTag[] | undefined);
    protected readonly tags$: import("@angular/core").Signal<readonly CxTableTagsCellTag[]>;
    protected readonly visibleTags$: import("@angular/core").Signal<CxTableTagsCellTag[]>;
    protected readonly hiddenTagCount$: import("@angular/core").Signal<number>;
    protected readonly hiddenTagCounts$: import("@angular/core").Signal<number[]>;
    protected readonly ariaLabel$: import("@angular/core").Signal<string>;
    constructor();
    private scheduleMeasurement;
    private measureVisibleTags;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTableTagsCellComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTableTagsCellComponent, "cx-table-tags-cell", never, { "tags": { "alias": "tags"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-table-tags-cell.component.d.ts.map