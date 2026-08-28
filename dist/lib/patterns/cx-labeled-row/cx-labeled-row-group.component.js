import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation, } from '@angular/core';
import * as i0 from "@angular/core";
export class CxLabeledRowGroupComponent {
    gridRef;
    /** True when the element is the grid whose direct rows share this group's label column. */
    isGridElement(element) {
        return element === this.gridRef?.nativeElement;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLabeledRowGroupComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxLabeledRowGroupComponent, isStandalone: true, selector: "cx-labeled-row-group", viewQueries: [{ propertyName: "gridRef", first: true, predicate: ["grid"], descendants: true, static: true }], ngImport: i0, template: "<div #grid class=\"cx-labeled-row-group\">\n  <ng-content />\n</div>\n", styles: ["cx-labeled-row-group{display:block;width:100%}.cx-labeled-row-group{--cx-labeled-row-group-column-gap: var(--space-xl);display:grid;width:100%;grid-template-columns:fit-content(200px) minmax(0, 1fr);column-gap:var(--cx-labeled-row-group-column-gap);row-gap:var(--space-lg)}.cx-labeled-row-group>*{grid-column:1/-1;min-width:0}@media(max-width: 480px){.cx-labeled-row-group{grid-template-columns:minmax(0, 1fr)}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLabeledRowGroupComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-labeled-row-group', changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, template: "<div #grid class=\"cx-labeled-row-group\">\n  <ng-content />\n</div>\n", styles: ["cx-labeled-row-group{display:block;width:100%}.cx-labeled-row-group{--cx-labeled-row-group-column-gap: var(--space-xl);display:grid;width:100%;grid-template-columns:fit-content(200px) minmax(0, 1fr);column-gap:var(--cx-labeled-row-group-column-gap);row-gap:var(--space-lg)}.cx-labeled-row-group>*{grid-column:1/-1;min-width:0}@media(max-width: 480px){.cx-labeled-row-group{grid-template-columns:minmax(0, 1fr)}}"] }]
        }], propDecorators: { gridRef: [{
                type: ViewChild,
                args: ['grid', { static: true }]
            }] } });
