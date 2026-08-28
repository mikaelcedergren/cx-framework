import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxSkeletonLoader {
    rows;
    gap;
    margin;
    frozen;
    constructor(rows, gap, margin, frozen) {
        this.rows = rows;
        this.gap = gap;
        this.margin = margin;
        this.frozen = frozen;
    }
    static of(rows, gap, margin, frozen = false) {
        return new CxSkeletonLoader(rows, gap, margin, frozen);
    }
    static ofTable(columnCount = 4, rowCount = 6) {
        const rows = Array.from({ length: rowCount }, () => ({
            cells: Array.from({ length: columnCount }, () => ({})),
        }));
        return CxSkeletonLoader.of(rows, '8', '16');
    }
    static ofList(itemCount = 3, groupCount = 0) {
        const rows = [];
        for (let groupIndex = 0; groupIndex < Math.max(groupCount, 1); groupIndex += 1) {
            if (groupCount > 0) {
                rows.push({ width: '50', cells: [{}] });
            }
            for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
                rows.push({ cells: [{}] });
            }
        }
        return CxSkeletonLoader.of(rows, '8', '16');
    }
    static ofChart() {
        return CxSkeletonLoader.of([
            {
                cells: [
                    { height: '32' },
                    { height: '32' },
                    { height: '64' },
                    { height: '128' },
                    { height: '32' },
                    { height: '16' },
                    { height: '64' },
                ],
            },
        ], '8', '16');
    }
    static ofBlocks(rowCount = 2, columnCount = 1, height = '128') {
        const rows = Array.from({ length: rowCount }, () => ({
            cells: Array.from({ length: columnCount }, () => ({ height })),
        }));
        return CxSkeletonLoader.of(rows, '8', '16');
    }
    withRows(rows) {
        return new CxSkeletonLoader(rows, this.gap, this.margin, this.frozen);
    }
    withGap(gap) {
        return new CxSkeletonLoader(this.rows, gap, this.margin, this.frozen);
    }
    withMargin(margin) {
        return new CxSkeletonLoader(this.rows, this.gap, margin, this.frozen);
    }
    withFrozen(frozen) {
        return new CxSkeletonLoader(this.rows, this.gap, this.margin, frozen);
    }
}
const DEFAULT_SKELETON = CxSkeletonLoader.ofTable();
export class CxSkeletonLoaderComponent {
    skeletonState = DEFAULT_SKELETON;
    /** The placeholder layout to hold. Defaults to a table skeleton. */
    set skeleton(skeleton) {
        this.skeletonState = skeleton ?? DEFAULT_SKELETON;
    }
    get skeleton() {
        return this.skeletonState;
    }
    loading = true;
    rows() {
        return this.skeleton.rows;
    }
    rowWidth(row) {
        return row.width ?? '100';
    }
    cellHeight(cell) {
        return cell.height ?? '32';
    }
    animationDelay(rowIndex, cellIndex) {
        return this.skeleton.frozen ? 0 : (rowIndex + cellIndex) * 90;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSkeletonLoaderComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSkeletonLoaderComponent, isStandalone: true, selector: "cx-skeleton-loader", inputs: { skeleton: "skeleton", loading: "loading" }, host: { attributes: { "role": "status", "aria-label": "Loading" }, properties: { "attr.aria-busy": "loading ? \"true\" : \"false\"" } }, ngImport: i0, template: "@if (loading) {\n  <div\n    class=\"cx-skeleton-loader\"\n    [class.cx-skeleton-loader--frozen]=\"skeleton.frozen\"\n    [class.cx-skeleton-loader--gap-4]=\"skeleton.gap === '4'\"\n    [class.cx-skeleton-loader--gap-8]=\"skeleton.gap === '8'\"\n    [class.cx-skeleton-loader--gap-16]=\"skeleton.gap === '16'\"\n  >\n    @for (row of rows(); track rowIndex; let rowIndex = $index) {\n      <div\n        class=\"cx-skeleton-loader__row\"\n        [class.cx-skeleton-loader__row--w-50]=\"rowWidth(row) === '50'\"\n        [class.cx-skeleton-loader__row--w-100]=\"rowWidth(row) === '100'\"\n      >\n        @for (cell of row.cells; track cellIndex; let cellIndex = $index) {\n          <span\n            class=\"cx-skeleton-loader__cell\"\n            [class.cx-skeleton-loader__cell--h-16]=\"cellHeight(cell) === '16'\"\n            [class.cx-skeleton-loader__cell--h-32]=\"cellHeight(cell) === '32'\"\n            [class.cx-skeleton-loader__cell--h-64]=\"cellHeight(cell) === '64'\"\n            [class.cx-skeleton-loader__cell--h-128]=\"cellHeight(cell) === '128'\"\n            [class.cx-skeleton-loader__cell--h-256]=\"cellHeight(cell) === '256'\"\n            [style.animation-delay.ms]=\"animationDelay(rowIndex, cellIndex)\"\n            aria-hidden=\"true\"\n          ></span>\n        }\n      </div>\n    }\n  </div>\n} @else {\n  <ng-content />\n}\n", styles: [":host{display:block;width:100%}.cx-skeleton-loader{display:flex;width:100%;flex-direction:column;gap:var(--space-md);animation:cx-skeleton-loader-fade-in var(--motion-slow) var(--ease-out)}.cx-skeleton-loader--gap-4{gap:var(--space-xs)}.cx-skeleton-loader--gap-8{gap:var(--space-sm)}.cx-skeleton-loader--gap-16{gap:var(--space-md)}.cx-skeleton-loader__row{display:flex;width:100%;align-items:flex-end;gap:inherit}.cx-skeleton-loader__row--w-50{width:50%}.cx-skeleton-loader__row--w-100{width:100%}.cx-skeleton-loader__cell{display:block;width:100%;border-radius:var(--radius-sm);background:var(--opacity-mid);opacity:.45;animation:cx-skeleton-loader-wave 1.5s var(--ease-out) infinite alternate}.cx-skeleton-loader--frozen .cx-skeleton-loader__cell{background:var(--opacity-low);opacity:1;animation:none}.cx-skeleton-loader__cell--h-16{height:calc(var(--controller-size)/2)}.cx-skeleton-loader__cell--h-32{height:var(--controller-size)}.cx-skeleton-loader__cell--h-64{height:calc(var(--controller-size)*2)}.cx-skeleton-loader__cell--h-128{height:calc(var(--controller-size)*4)}.cx-skeleton-loader__cell--h-256{height:calc(var(--controller-size)*8)}@keyframes cx-skeleton-loader-fade-in{from{opacity:0}to{opacity:1}}@keyframes cx-skeleton-loader-wave{from{opacity:.24}to{opacity:.72}}@media(prefers-reduced-motion: reduce){.cx-skeleton-loader,.cx-skeleton-loader__cell{animation:none}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSkeletonLoaderComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-skeleton-loader', host: {
                        role: 'status',
                        '[attr.aria-busy]': 'loading ? "true" : "false"',
                        'aria-label': 'Loading',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (loading) {\n  <div\n    class=\"cx-skeleton-loader\"\n    [class.cx-skeleton-loader--frozen]=\"skeleton.frozen\"\n    [class.cx-skeleton-loader--gap-4]=\"skeleton.gap === '4'\"\n    [class.cx-skeleton-loader--gap-8]=\"skeleton.gap === '8'\"\n    [class.cx-skeleton-loader--gap-16]=\"skeleton.gap === '16'\"\n  >\n    @for (row of rows(); track rowIndex; let rowIndex = $index) {\n      <div\n        class=\"cx-skeleton-loader__row\"\n        [class.cx-skeleton-loader__row--w-50]=\"rowWidth(row) === '50'\"\n        [class.cx-skeleton-loader__row--w-100]=\"rowWidth(row) === '100'\"\n      >\n        @for (cell of row.cells; track cellIndex; let cellIndex = $index) {\n          <span\n            class=\"cx-skeleton-loader__cell\"\n            [class.cx-skeleton-loader__cell--h-16]=\"cellHeight(cell) === '16'\"\n            [class.cx-skeleton-loader__cell--h-32]=\"cellHeight(cell) === '32'\"\n            [class.cx-skeleton-loader__cell--h-64]=\"cellHeight(cell) === '64'\"\n            [class.cx-skeleton-loader__cell--h-128]=\"cellHeight(cell) === '128'\"\n            [class.cx-skeleton-loader__cell--h-256]=\"cellHeight(cell) === '256'\"\n            [style.animation-delay.ms]=\"animationDelay(rowIndex, cellIndex)\"\n            aria-hidden=\"true\"\n          ></span>\n        }\n      </div>\n    }\n  </div>\n} @else {\n  <ng-content />\n}\n", styles: [":host{display:block;width:100%}.cx-skeleton-loader{display:flex;width:100%;flex-direction:column;gap:var(--space-md);animation:cx-skeleton-loader-fade-in var(--motion-slow) var(--ease-out)}.cx-skeleton-loader--gap-4{gap:var(--space-xs)}.cx-skeleton-loader--gap-8{gap:var(--space-sm)}.cx-skeleton-loader--gap-16{gap:var(--space-md)}.cx-skeleton-loader__row{display:flex;width:100%;align-items:flex-end;gap:inherit}.cx-skeleton-loader__row--w-50{width:50%}.cx-skeleton-loader__row--w-100{width:100%}.cx-skeleton-loader__cell{display:block;width:100%;border-radius:var(--radius-sm);background:var(--opacity-mid);opacity:.45;animation:cx-skeleton-loader-wave 1.5s var(--ease-out) infinite alternate}.cx-skeleton-loader--frozen .cx-skeleton-loader__cell{background:var(--opacity-low);opacity:1;animation:none}.cx-skeleton-loader__cell--h-16{height:calc(var(--controller-size)/2)}.cx-skeleton-loader__cell--h-32{height:var(--controller-size)}.cx-skeleton-loader__cell--h-64{height:calc(var(--controller-size)*2)}.cx-skeleton-loader__cell--h-128{height:calc(var(--controller-size)*4)}.cx-skeleton-loader__cell--h-256{height:calc(var(--controller-size)*8)}@keyframes cx-skeleton-loader-fade-in{from{opacity:0}to{opacity:1}}@keyframes cx-skeleton-loader-wave{from{opacity:.24}to{opacity:.72}}@media(prefers-reduced-motion: reduce){.cx-skeleton-loader,.cx-skeleton-loader__cell{animation:none}}"] }]
        }], propDecorators: { skeleton: [{
                type: Input
            }], loading: [{
                type: Input
            }] } });
