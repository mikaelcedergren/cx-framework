import { type CxLayoutGap } from '../layout.types';
import * as i0 from "@angular/core";
export declare class CxMasonryComponent {
    columns: number;
    columnsMobile: number | undefined;
    gap: CxLayoutGap;
    protected get normalizedColumns(): string;
    protected get normalizedColumnsMobile(): string;
    protected get resolvedGap(): string;
    private clampColumns;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMasonryComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMasonryComponent, "cx-masonry", never, { "columns": { "alias": "columns"; "required": false; }; "columnsMobile": { "alias": "columnsMobile"; "required": false; }; "gap": { "alias": "gap"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-masonry.component.d.ts.map