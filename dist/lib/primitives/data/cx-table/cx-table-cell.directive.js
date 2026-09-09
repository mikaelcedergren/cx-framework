import { Directive, Input, TemplateRef, inject } from '@angular/core';
import * as i0 from "@angular/core";
/** A custom cell template, keyed by its column id. */
export class CxTableCellDirective {
    cxTableCell;
    template = inject(TemplateRef);
    static ngTemplateContextGuard(_directive, context) {
        return true;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableCellDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "22.0.8", type: CxTableCellDirective, isStandalone: true, selector: "ng-template[cxTableCell]", inputs: { cxTableCell: "cxTableCell" }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableCellDirective, decorators: [{
            type: Directive,
            args: [{ selector: 'ng-template[cxTableCell]' }]
        }], propDecorators: { cxTableCell: [{
                type: Input,
                args: [{ required: true }]
            }] } });
