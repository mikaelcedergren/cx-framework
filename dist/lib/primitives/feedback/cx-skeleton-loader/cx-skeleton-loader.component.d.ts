import * as i0 from "@angular/core";
export type CxSkeletonLoaderShape = 'table' | 'list' | 'chart' | 'blocks';
export type CxSkeletonLoaderRowHeight = '16' | '32' | '64' | '128' | '256';
export type CxSkeletonLoaderRowWidth = '50' | '100';
export type CxSkeletonLoaderGap = '4' | '8' | '16';
export type CxSkeletonLoaderMargin = '0' | '16';
export interface CxSkeletonLoaderCell {
    height?: CxSkeletonLoaderRowHeight;
}
export interface CxSkeletonLoaderRow {
    width?: CxSkeletonLoaderRowWidth;
    cells: readonly CxSkeletonLoaderCell[];
}
export declare class CxSkeletonLoader {
    readonly rows: readonly CxSkeletonLoaderRow[];
    readonly gap: CxSkeletonLoaderGap;
    readonly margin: CxSkeletonLoaderMargin;
    readonly frozen: boolean;
    private constructor();
    static of(rows: readonly CxSkeletonLoaderRow[], gap: CxSkeletonLoaderGap, margin: CxSkeletonLoaderMargin, frozen?: boolean): CxSkeletonLoader;
    static ofTable(columnCount?: number, rowCount?: number): CxSkeletonLoader;
    static ofList(itemCount?: number, groupCount?: number): CxSkeletonLoader;
    static ofChart(): CxSkeletonLoader;
    static ofBlocks(rowCount?: number, columnCount?: number, height?: CxSkeletonLoaderRowHeight): CxSkeletonLoader;
    withRows(rows: readonly CxSkeletonLoaderRow[]): CxSkeletonLoader;
    withGap(gap: CxSkeletonLoaderGap): CxSkeletonLoader;
    withMargin(margin: CxSkeletonLoaderMargin): CxSkeletonLoader;
    withFrozen(frozen: boolean): CxSkeletonLoader;
}
export declare class CxSkeletonLoaderComponent {
    private skeletonState;
    /** The placeholder layout to hold. Defaults to a table skeleton. */
    set skeleton(skeleton: CxSkeletonLoader | undefined);
    get skeleton(): CxSkeletonLoader;
    loading: boolean;
    protected rows(): readonly CxSkeletonLoaderRow[];
    protected rowWidth(row: CxSkeletonLoaderRow): CxSkeletonLoaderRowWidth;
    protected cellHeight(cell: CxSkeletonLoaderCell): CxSkeletonLoaderRowHeight;
    protected animationDelay(rowIndex: number, cellIndex: number): number;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSkeletonLoaderComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSkeletonLoaderComponent, "cx-skeleton-loader", never, { "skeleton": { "alias": "skeleton"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-skeleton-loader.component.d.ts.map