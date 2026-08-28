import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import * as i0 from "@angular/core";
export class CxMasonryComponent {
    columns = 3;
    columnsMobile;
    gap = 'md';
    get normalizedColumns() {
        return `${this.clampColumns(this.columns, 3)}`;
    }
    get normalizedColumnsMobile() {
        if (this.columnsMobile == null || !Number.isFinite(this.columnsMobile)) {
            return '1';
        }
        return `${this.clampColumns(this.columnsMobile, 1)}`;
    }
    get resolvedGap() {
        return `var(--space-${this.gap})`;
    }
    clampColumns(value, fallback) {
        return Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 1), 12) : fallback;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMasonryComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxMasonryComponent, isStandalone: true, selector: "cx-masonry", inputs: { columns: "columns", columnsMobile: "columnsMobile", gap: "gap" }, host: { properties: { "style.--cx-masonry-columns": "normalizedColumns", "style.--cx-masonry-columns-mobile": "normalizedColumnsMobile", "style.--cx-masonry-gap": "resolvedGap" } }, ngImport: i0, template: "<div class=\"cx-masonry\">\n  <ng-content />\n</div>\n", styles: ["cx-masonry{display:block;width:100%}cx-masonry>.cx-masonry{width:100%;min-width:0;box-sizing:border-box;column-count:var(--cx-masonry-columns, 3);column-gap:var(--cx-masonry-gap, var(--space-md))}cx-masonry>.cx-masonry:empty{display:none}cx-masonry>.cx-masonry{margin-block-end:calc(var(--cx-masonry-gap, var(--space-md))*-1)}cx-masonry>.cx-masonry>*{display:block;width:100%;box-sizing:border-box;break-inside:avoid;margin-block-end:var(--cx-masonry-gap, var(--space-md))}@media(max-width: 719px){cx-masonry>.cx-masonry{column-count:var(--cx-masonry-columns-mobile, 1)}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMasonryComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-masonry', host: {
                        '[style.--cx-masonry-columns]': 'normalizedColumns',
                        '[style.--cx-masonry-columns-mobile]': 'normalizedColumnsMobile',
                        '[style.--cx-masonry-gap]': 'resolvedGap',
                    }, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-masonry\">\n  <ng-content />\n</div>\n", styles: ["cx-masonry{display:block;width:100%}cx-masonry>.cx-masonry{width:100%;min-width:0;box-sizing:border-box;column-count:var(--cx-masonry-columns, 3);column-gap:var(--cx-masonry-gap, var(--space-md))}cx-masonry>.cx-masonry:empty{display:none}cx-masonry>.cx-masonry{margin-block-end:calc(var(--cx-masonry-gap, var(--space-md))*-1)}cx-masonry>.cx-masonry>*{display:block;width:100%;box-sizing:border-box;break-inside:avoid;margin-block-end:var(--cx-masonry-gap, var(--space-md))}@media(max-width: 719px){cx-masonry>.cx-masonry{column-count:var(--cx-masonry-columns-mobile, 1)}}"] }]
        }], propDecorators: { columns: [{
                type: Input
            }], columnsMobile: [{
                type: Input
            }], gap: [{
                type: Input
            }] } });
