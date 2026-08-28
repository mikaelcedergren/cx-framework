import { EventEmitter } from '@angular/core';
import { type CxDropdownOption } from '../../inputs/cx-dropdown';
import * as i0 from "@angular/core";
export interface CxPaginationPage {
    number: number;
    size: number;
    total: number;
}
export type CxPaginationTotalMode = 'known' | 'unknown';
type CxPaginationPageItem = {
    kind: 'page';
    id: string;
    page: number;
    label: string;
    current: boolean;
} | {
    kind: 'ellipsis';
    id: string;
    label: string;
};
export declare class CxPaginationComponent {
    private readonly pageState;
    private readonly pageSizesState;
    private readonly totalModeState;
    set page(value: CxPaginationPage | undefined);
    set pageSizes(value: readonly number[] | undefined);
    set totalMode(value: CxPaginationTotalMode | undefined);
    readonly pageChange: EventEmitter<CxPaginationPage>;
    protected readonly currentPage$: import("@angular/core").Signal<number>;
    protected readonly currentPageSize$: import("@angular/core").Signal<number>;
    protected readonly totalItems$: import("@angular/core").Signal<number>;
    protected readonly availablePageSizes$: import("@angular/core").Signal<number[]>;
    protected readonly pageSizeOptions$: import("@angular/core").Signal<CxDropdownOption[]>;
    protected readonly pageCount$: import("@angular/core").Signal<number>;
    protected readonly pageSizeValue$: import("@angular/core").Signal<string>;
    protected readonly totalKnown$: import("@angular/core").Signal<boolean>;
    protected readonly pageItems$: import("@angular/core").Signal<CxPaginationPageItem[]>;
    protected readonly previousDisabled$: import("@angular/core").Signal<boolean>;
    protected readonly nextDisabled$: import("@angular/core").Signal<boolean>;
    protected readonly totalText$: import("@angular/core").Signal<string>;
    protected goToPreviousPage(): void;
    protected goToNextPage(): void;
    protected goToPage(page: number): void;
    protected onPageSizeChange(value: string | undefined): void;
    private emitPage;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxPaginationComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxPaginationComponent, "cx-pagination", never, { "page": { "alias": "page"; "required": false; }; "pageSizes": { "alias": "pageSizes"; "required": false; }; "totalMode": { "alias": "totalMode"; "required": false; }; }, { "pageChange": "pageChange"; }, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-pagination.component.d.ts.map