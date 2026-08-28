import { AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import { type CxMenuGroup, type CxMenuItem } from '../../overlay/cx-menu';
import * as i0 from "@angular/core";
export interface CxBreadcrumbOption {
    id: string;
    label: string;
    disabled?: boolean;
}
export interface CxBreadcrumbItem {
    id: string;
    label: string;
    href?: string;
    routerLink?: string | readonly unknown[];
    fragment?: string;
    target?: string;
    rel?: string;
    selectedOptionId?: string;
    options?: readonly CxBreadcrumbOption[];
}
export interface CxBreadcrumbOptionSelectEvent {
    itemId: string;
    optionId: string;
}
export declare class CxBreadcrumbsComponent implements AfterViewInit, OnDestroy {
    private readonly cdr;
    private resizeObserver?;
    private viewReady;
    private readonly listRef?;
    private readonly measureListRef?;
    private readonly itemsState;
    private readonly currentIdState;
    private readonly ariaLabelState;
    private readonly compactState;
    set ariaLabel(value: string | undefined);
    set items(value: readonly CxBreadcrumbItem[] | undefined);
    set currentId(value: string | undefined);
    readonly itemSelect: EventEmitter<string>;
    readonly optionSelect: EventEmitter<CxBreadcrumbOptionSelectEvent>;
    protected readonly ariaLabel$: import("@angular/core").Signal<string>;
    protected readonly effectiveCurrentId$: import("@angular/core").Signal<string | undefined>;
    protected readonly pathItems$: import("@angular/core").Signal<CxBreadcrumbItem[]>;
    protected readonly shouldCompact$: import("@angular/core").Signal<boolean>;
    protected readonly firstItem$: import("@angular/core").Signal<CxBreadcrumbItem>;
    protected readonly lastItem$: import("@angular/core").Signal<CxBreadcrumbItem | undefined>;
    protected readonly hiddenItems$: import("@angular/core").Signal<CxBreadcrumbItem[]>;
    protected readonly hiddenMenuItems$: import("@angular/core").Signal<CxMenuItem[]>;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    protected isCurrent(itemId: string): boolean;
    protected selectItem(itemId: string): void;
    protected hasRouterLink(item: CxBreadcrumbItem): boolean;
    protected hasHref(item: CxBreadcrumbItem): boolean;
    protected hasOptions(item: CxBreadcrumbItem): boolean;
    protected optionMenuGroups(item: CxBreadcrumbItem): CxMenuGroup[];
    protected selectOption(item: CxBreadcrumbItem, optionId: string): void;
    private normalizeItems;
    private normalizeOptions;
    private scheduleCompactSync;
    private syncCompactState;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxBreadcrumbsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxBreadcrumbsComponent, "cx-breadcrumbs", never, { "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "items": { "alias": "items"; "required": false; }; "currentId": { "alias": "currentId"; "required": false; }; }, { "itemSelect": "itemSelect"; "optionSelect": "optionSelect"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-breadcrumbs.component.d.ts.map