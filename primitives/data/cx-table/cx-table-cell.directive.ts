import { Directive, Input, TemplateRef, inject } from '@angular/core';
import type { CxTableCell, CxTableColumn, CxTableRow } from './cx-table.component';

export interface CxTableCellContext {
  $implicit: CxTableRow;
  row: CxTableRow;
  column: CxTableColumn;
  cell: Extract<CxTableCell, { kind: 'custom' }>;
}

/** A custom cell template, keyed by its column id. */
@Directive({ selector: 'ng-template[cxTableCell]' })
export class CxTableCellDirective {
  @Input({ required: true }) cxTableCell!: string;
  readonly template = inject<TemplateRef<CxTableCellContext>>(TemplateRef);

  static ngTemplateContextGuard(_directive: CxTableCellDirective, context: unknown): context is CxTableCellContext {
    return true;
  }
}
