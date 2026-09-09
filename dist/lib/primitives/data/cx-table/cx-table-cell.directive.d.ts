import { TemplateRef } from '@angular/core';
import type { CxTableCell, CxTableColumn, CxTableRow } from './cx-table.component';
import * as i0 from "@angular/core";
export interface CxTableCellContext {
    $implicit: CxTableRow;
    row: CxTableRow;
    column: CxTableColumn;
    cell: Extract<CxTableCell, {
        kind: 'custom';
    }>;
}
/** A custom cell template, keyed by its column id. */
export declare class CxTableCellDirective {
    cxTableCell: string;
    readonly template: TemplateRef<CxTableCellContext>;
    static ngTemplateContextGuard(_directive: CxTableCellDirective, context: unknown): context is CxTableCellContext;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTableCellDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CxTableCellDirective, "ng-template[cxTableCell]", never, { "cxTableCell": { "alias": "cxTableCell"; "required": true; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-table-cell.directive.d.ts.map