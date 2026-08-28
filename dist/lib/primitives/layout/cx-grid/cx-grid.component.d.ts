import { type CxLayoutAlign, type CxLayoutGap } from '../layout.types';
import * as i0 from "@angular/core";
export declare class CxGridComponent {
    columns: number;
    columnsMobile: number | undefined;
    gap: CxLayoutGap;
    gapMobile: CxLayoutGap | undefined;
    columnGap: CxLayoutGap | undefined;
    rowGap: CxLayoutGap | undefined;
    align: CxLayoutAlign;
    protected get normalizedColumns(): string;
    protected get normalizedColumnsMobile(): string | null;
    protected get resolvedColumnGap(): CxLayoutGap;
    protected get resolvedRowGap(): CxLayoutGap;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxGridComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxGridComponent, "cx-grid", never, { "columns": { "alias": "columns"; "required": false; }; "columnsMobile": { "alias": "columnsMobile"; "required": false; }; "gap": { "alias": "gap"; "required": false; }; "gapMobile": { "alias": "gapMobile"; "required": false; }; "columnGap": { "alias": "columnGap"; "required": false; }; "rowGap": { "alias": "rowGap"; "required": false; }; "align": { "alias": "align"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-grid.component.d.ts.map