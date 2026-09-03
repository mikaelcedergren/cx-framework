import { AfterViewInit, ElementRef, EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxButtonGroupOption } from '../../primitives/actions/cx-button-group';
import { type CxToggleChipGroupOption } from '../../primitives/inputs/cx-toggle-chip-group';
import { type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';
import { type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { type CxTabItem } from '../../primitives/navigation/cx-tabs';
import { type CxFloatingSurfacePlacement } from '../../primitives/overlay/floating-surface';
import { type CxColumnFilterDefinition, type CxColumnFilterLoadMoreEvent, type CxColumnFilterQueryChangeEvent, type CxColumnFilterValue, type CxColumnFilterValueMap } from '../../primitives/data/cx-column-filter-editor';
import { type CxQueryFieldCondition, type CxQueryFieldDefinition, type CxQueryFieldValueRetryEvent, type CxQueryFieldValueSearchEvent } from '../../primitives/data/cx-query-field';
import * as i0 from "@angular/core";
export type CxFilterBarMode = 'filters' | 'query';
export type CxFilterBarDisplayMode = 'compact' | 'comfortable';
export type CxFilterBarSortDirection = 'asc' | 'desc';
export type CxFilterBarFilterView = 'all' | 'recommended';
export interface CxFilterBarFilter {
    id: string;
    label: string;
    filter: CxColumnFilterDefinition;
    recommended?: boolean;
}
export interface CxFilterBarColumnOption {
    id: string;
    label: string;
    pinnable?: boolean;
}
export type CxFilterBarQueryTranslationIssuePart = 'condition' | 'join' | 'field' | 'operator' | 'value';
export interface CxFilterBarQueryTranslationIssue {
    conditionId: string;
    part: CxFilterBarQueryTranslationIssuePart;
    reason: string;
}
/**
 * Product-owned result for expressing the current query with filter controls.
 * The filter bar owns the safe transition, but never guesses what a field or
 * operator means in the collection it controls.
 */
export interface CxFilterBarQueryTranslation {
    filterValues: CxColumnFilterValueMap;
    translatedConditionIds: readonly string[];
    issues: readonly CxFilterBarQueryTranslationIssue[];
}
/**
 * Position held for the surface anchored to an active-filter tag. The tag can
 * disappear while its editor is open — clearing the last value deactivates the
 * filter — so the surface keeps the metrics it opened with instead of
 * re-reading an anchor that may already be detached.
 */
interface CxFilterBarSurfaceMetrics {
    left: number | undefined;
    top: number | undefined;
    bottom: number | undefined;
    width: number | undefined;
    maxHeight: number | undefined;
    placement: CxFloatingSurfacePlacement;
}
export declare class CxFilterBarComponent implements AfterViewInit, OnDestroy {
    private static instanceCounter;
    private readonly instanceId;
    protected readonly tagFilterDialogId: string;
    protected readonly overflowFilterDialogId: string;
    protected readonly filterListPanelId: string;
    private readonly host;
    private readonly modeState;
    private readonly quickFiltersState;
    private readonly selectedQuickFilterIdState;
    private readonly toggleFiltersState;
    private readonly selectedToggleFilterIdsState;
    private readonly filtersState;
    private readonly filterValuesState;
    private readonly showActiveFiltersState;
    /** null means every active-filter tag fits; a number is how many fit from the newest end. */
    private readonly visibleActiveFilterCountState;
    private readonly filterSearchValueState;
    private readonly filterViewState;
    private readonly expandedFilterIdState;
    private readonly queryValueState;
    private readonly queryFieldsState;
    private readonly queryConditionsState;
    private readonly queryToFilterTranslationState;
    private readonly filtersToQueryConditionsState;
    protected readonly pendingQueryTranslationState: import("@angular/core").WritableSignal<CxFilterBarQueryTranslation | undefined>;
    private readonly savedViewsState;
    private readonly activeSavedViewIdState;
    private readonly displayModeState;
    private readonly groupByOptionsState;
    private readonly groupByState;
    private readonly sortOptionsState;
    private readonly sortByState;
    private readonly sortDirectionState;
    private readonly thenByState;
    private readonly thenByDirectionState;
    private readonly columnOptionsState;
    private readonly visibleColumnIdsState;
    private readonly pinnedColumnIdsState;
    private readonly columnSearchValueState;
    private readonly filterPopoverOpenState;
    private readonly propertiesPopoverOpenState;
    private readonly filterPopoverLeftState;
    private readonly filterPopoverTopState;
    private readonly filterPopoverBottomState;
    private readonly filterPopoverWidthState;
    private readonly filterPopoverMaxHeightState;
    private readonly filterPopoverPlacementState;
    private readonly propertiesPopoverLeftState;
    private readonly propertiesPopoverTopState;
    private readonly propertiesPopoverBottomState;
    private readonly propertiesPopoverWidthState;
    private readonly propertiesPopoverMaxHeightState;
    private readonly propertiesPopoverPlacementState;
    private readonly tagFilterIdState;
    private readonly tagFilterMetricsState;
    private readonly overflowFilterPopoverOpenState;
    private readonly overflowExpandedFilterIdState;
    private readonly overflowFilterMetricsState;
    private tagFilterAnchor?;
    private tagFilterLockedPlacement?;
    private overflowFilterLockedPlacement?;
    private resizeObserver?;
    private filterPopoverLockedPlacement?;
    private propertiesPopoverLockedPlacement?;
    private activeFiltersRegionEl?;
    private activeFilterMeasureFrame?;
    private readonly activeFilterTagsChange;
    private filterTriggerRef?;
    private propertiesTriggerRef?;
    private filterPopoverRef?;
    private filterSearchRef?;
    private propertiesPopoverRef?;
    private tagFilterPopoverRef?;
    private activeFilterOverflowAnchorRef?;
    private activeFilterOverflowPopoverRef?;
    private readonly columnFilterEditors?;
    private readonly columnFilterEditorHosts?;
    private readonly activeFilterTags?;
    private readonly activeFilterTagHosts?;
    protected set activeFiltersRegion(ref: ElementRef<HTMLElement> | undefined);
    queryAriaLabel: string;
    filterSearchAriaLabel: string;
    columnSearchAriaLabel: string;
    set mode(value: CxFilterBarMode | undefined);
    set quickFilters(value: CxButtonGroupOption[]);
    set selectedQuickFilterId(value: string | undefined);
    set toggleFilters(value: CxToggleChipGroupOption[] | undefined);
    set selectedToggleFilterIds(value: string[] | undefined);
    set filters(value: CxFilterBarFilter[] | undefined);
    set filterValues(value: CxColumnFilterValueMap | undefined);
    set showActiveFilters(value: boolean | undefined);
    set queryValue(value: string | undefined);
    set queryFields(value: readonly CxQueryFieldDefinition[] | null | undefined);
    set queryConditions(value: readonly CxQueryFieldCondition[] | null | undefined);
    set queryToFilterTranslation(value: CxFilterBarQueryTranslation | null | undefined);
    set filtersToQueryConditions(value: readonly CxQueryFieldCondition[] | null | undefined);
    set savedViews(value: CxMenuItem[]);
    set displayMode(value: CxFilterBarDisplayMode | undefined);
    set groupByOptions(value: CxButtonGroupOption[] | undefined);
    set groupBy(value: string | undefined);
    set sortOptions(value: CxDropdownOption[] | undefined);
    set sortBy(value: string | undefined);
    set sortDirection(value: CxFilterBarSortDirection | undefined);
    set thenBy(value: string | undefined);
    set thenByDirection(value: CxFilterBarSortDirection | undefined);
    set columnOptions(value: CxFilterBarColumnOption[] | undefined);
    set visibleColumnIds(value: string[] | undefined);
    set pinnedColumnIds(value: string[] | undefined);
    readonly modeChange: EventEmitter<CxFilterBarMode>;
    readonly selectedQuickFilterIdChange: EventEmitter<string>;
    readonly selectedToggleFilterIdsChange: EventEmitter<string[]>;
    readonly filterValuesChange: EventEmitter<Readonly<Record<string, CxColumnFilterValue>>>;
    readonly filterQueryChange: EventEmitter<CxColumnFilterQueryChangeEvent>;
    readonly filterLoadMore: EventEmitter<CxColumnFilterLoadMoreEvent>;
    readonly queryValueChange: EventEmitter<string>;
    readonly queryConditionsChange: EventEmitter<readonly CxQueryFieldCondition[]>;
    readonly queryValueSearch: EventEmitter<CxQueryFieldValueSearchEvent>;
    readonly queryValueRetry: EventEmitter<CxQueryFieldValueRetryEvent>;
    readonly savedViewSelect: EventEmitter<string>;
    readonly activeSavedViewIdChange: EventEmitter<string | undefined>;
    readonly displayModeChange: EventEmitter<CxFilterBarDisplayMode>;
    readonly groupByChange: EventEmitter<string>;
    readonly sortByChange: EventEmitter<string | undefined>;
    readonly sortDirectionChange: EventEmitter<CxFilterBarSortDirection>;
    readonly thenByChange: EventEmitter<string | undefined>;
    readonly thenByDirectionChange: EventEmitter<CxFilterBarSortDirection>;
    readonly visibleColumnIdsChange: EventEmitter<string[]>;
    readonly pinnedColumnIdsChange: EventEmitter<string[]>;
    readonly filterPopoverOpenChange: EventEmitter<boolean>;
    readonly exportTable: EventEmitter<void>;
    readonly resetTable: EventEmitter<void>;
    protected readonly mode$: import("@angular/core").Signal<CxFilterBarMode>;
    protected readonly quickFilters$: import("@angular/core").Signal<CxButtonGroupOption[]>;
    protected readonly selectedQuickFilterId$: import("@angular/core").Signal<string | undefined>;
    protected readonly toggleFilters$: import("@angular/core").Signal<CxToggleChipGroupOption[]>;
    protected readonly selectedToggleFilterIds$: import("@angular/core").Signal<string[]>;
    protected readonly filters$: import("@angular/core").Signal<CxFilterBarFilter[]>;
    protected readonly filterSearchValue$: import("@angular/core").Signal<string>;
    protected readonly filterView$: import("@angular/core").Signal<CxFilterBarFilterView>;
    protected readonly queryValue$: import("@angular/core").Signal<string>;
    protected readonly queryTranslationDialogOpen$: import("@angular/core").Signal<boolean>;
    protected readonly resolvedQueryFields$: import("@angular/core").Signal<readonly CxQueryFieldDefinition[]>;
    protected readonly resolvedQueryConditions$: import("@angular/core").Signal<readonly CxQueryFieldCondition[]>;
    protected readonly queryTranslationRemovedConditionIds$: import("@angular/core").Signal<string[]>;
    protected readonly queryTranslationSummary$: import("@angular/core").Signal<string>;
    protected readonly queryTranslationPrimaryText$: import("@angular/core").Signal<string>;
    protected readonly savedViews$: import("@angular/core").Signal<CxMenuItem[]>;
    protected readonly activeSavedViewId$: import("@angular/core").Signal<string | undefined>;
    protected readonly displayMode$: import("@angular/core").Signal<CxFilterBarDisplayMode>;
    protected readonly groupByOptions$: import("@angular/core").Signal<CxButtonGroupOption[]>;
    protected readonly groupBy$: import("@angular/core").Signal<string>;
    protected readonly sortOptions$: import("@angular/core").Signal<CxDropdownOption[]>;
    protected readonly sortBy$: import("@angular/core").Signal<string | undefined>;
    protected readonly sortDirection$: import("@angular/core").Signal<CxFilterBarSortDirection>;
    protected readonly thenBy$: import("@angular/core").Signal<string | undefined>;
    protected readonly thenByDirection$: import("@angular/core").Signal<CxFilterBarSortDirection>;
    protected readonly columnOptions$: import("@angular/core").Signal<CxFilterBarColumnOption[]>;
    protected readonly visibleColumnIds$: import("@angular/core").Signal<string[]>;
    protected readonly pinnedColumnIds$: import("@angular/core").Signal<string[]>;
    protected readonly columnSearchValue$: import("@angular/core").Signal<string>;
    protected readonly filterPopoverOpen$: import("@angular/core").Signal<boolean>;
    protected readonly propertiesPopoverOpen$: import("@angular/core").Signal<boolean>;
    protected readonly filterPopoverLeft$: import("@angular/core").Signal<number | undefined>;
    protected readonly filterPopoverTop$: import("@angular/core").Signal<number | undefined>;
    protected readonly filterPopoverBottom$: import("@angular/core").Signal<number | undefined>;
    protected readonly filterPopoverWidth$: import("@angular/core").Signal<number | undefined>;
    protected readonly filterPopoverMaxHeight$: import("@angular/core").Signal<number | undefined>;
    protected readonly filterPopoverPlacement$: import("@angular/core").Signal<"top" | "bottom">;
    protected readonly propertiesPopoverLeft$: import("@angular/core").Signal<number | undefined>;
    protected readonly propertiesPopoverTop$: import("@angular/core").Signal<number | undefined>;
    protected readonly propertiesPopoverBottom$: import("@angular/core").Signal<number | undefined>;
    protected readonly propertiesPopoverWidth$: import("@angular/core").Signal<number | undefined>;
    protected readonly propertiesPopoverMaxHeight$: import("@angular/core").Signal<number | undefined>;
    protected readonly propertiesPopoverPlacement$: import("@angular/core").Signal<"top" | "bottom">;
    protected readonly tagFilterMetrics$: import("@angular/core").Signal<CxFilterBarSurfaceMetrics | undefined>;
    protected readonly overflowFilterPopoverOpen$: import("@angular/core").Signal<boolean>;
    protected readonly overflowFilterMetrics$: import("@angular/core").Signal<CxFilterBarSurfaceMetrics | undefined>;
    /**
     * Resolved from the filter list, never from the active tags: clearing the
     * last value removes the tag but must not empty the editor the user is
     * still working in.
     */
    protected readonly tagFilter$: import("@angular/core").Signal<CxFilterBarFilter | undefined>;
    protected readonly activeFilterCount$: import("@angular/core").Signal<number>;
    protected readonly showActiveFilters$: import("@angular/core").Signal<boolean>;
    protected readonly activeFilterTags$: import("@angular/core").Signal<{
        id: string;
        text: string;
    }[]>;
    /** Template order for the row-reverse layout: last DOM item lands leftmost. */
    protected readonly activeFilterTagsRow$: import("@angular/core").Signal<{
        id: string;
        text: string;
    }[]>;
    protected readonly hiddenActiveFilterCount$: import("@angular/core").Signal<number>;
    protected readonly moreActiveFiltersLabel$: import("@angular/core").Signal<string>;
    protected readonly hiddenActiveFilters$: import("@angular/core").Signal<CxFilterBarFilter[]>;
    protected readonly filterButtonAriaLabel$: import("@angular/core").Signal<string>;
    protected readonly filteredFilters$: import("@angular/core").Signal<CxFilterBarFilter[]>;
    protected readonly filterViewTabs: CxTabItem[];
    protected readonly filteredColumnOptions$: import("@angular/core").Signal<CxFilterBarColumnOption[]>;
    protected readonly hasGroupByControls$: import("@angular/core").Signal<boolean>;
    protected readonly groupByDropdownOptions$: import("@angular/core").Signal<CxDropdownOption[]>;
    protected readonly hasSortControls$: import("@angular/core").Signal<boolean>;
    protected readonly hasThenByControls$: import("@angular/core").Signal<boolean>;
    protected readonly hasColumnControls$: import("@angular/core").Signal<boolean>;
    protected readonly resolvedSavedViews$: import("@angular/core").Signal<CxMenuItem[]>;
    protected readonly savedViewIcon$: import("@angular/core").Signal<CxIconName>;
    protected readonly overflowItems$: import("@angular/core").Signal<CxMenuItem[]>;
    protected readonly displayOptions: CxButtonGroupOption[];
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    protected onQuickFilterSelect(value: string | undefined): void;
    protected onToggleFilterSelect(values: string[]): void;
    protected onColumnFilterValueChange(filter: CxFilterBarFilter, value: CxColumnFilterValue | undefined): void;
    protected onFilterQueryChange(columnId: string, query: string): void;
    protected onFilterLoadMore(columnId: string): void;
    protected filterValue(filterId: string): CxColumnFilterValue | undefined;
    protected isFilterActive(filter: CxFilterBarFilter): boolean;
    protected isFilterExpanded(filterId: string): boolean;
    protected onFilterSearchValueChange(value: string): void;
    protected onFilterViewChange(value: string): void;
    protected onFilterExpandedChange(filterId: string, expanded: boolean): void;
    /**
     * The popover keeps its position when content grows, so an editor expanding
     * near the bottom would otherwise open below the popover's fold. Follow the
     * panel briefly while its editor renders and settles, keeping it in view.
     */
    private scheduleExpandedFilterReveal;
    protected clearFilter(filter: CxFilterBarFilter): void;
    protected isActiveFilterTagHidden(rowIndex: number): boolean;
    protected onActiveFilterDismiss(filterId: string): void;
    protected isTagFilterOpen(filterId: string): boolean;
    protected activeFilterTagAriaLabel(label: string): string;
    /**
     * The tag opens the same editor the column header and the filter list use;
     * only the surface around it differs.
     */
    protected onActiveFilterTagPressed(filterId: string): void;
    closeTagFilterPopover(restoreFocus?: boolean): void;
    private activeFilterTagIndex;
    private activeFilterTagHost;
    protected onMoreActiveFiltersPressed(): void;
    protected isOverflowFilterExpanded(filterId: string): boolean;
    protected onOverflowFilterExpandedChange(filterId: string, expanded: boolean): void;
    protected overflowFilterHeading(filter: CxFilterBarFilter): string;
    closeActiveFilterOverflow(restoreFocus?: boolean): void;
    protected clearAllFilters(): void;
    protected onQueryConditionsChange(value: readonly CxQueryFieldCondition[]): void;
    protected onSavedViewSelect(itemId: string): void;
    protected onSavedViewsOpenChange(open: boolean): void;
    protected onOverflowItemSelect(itemId: string): void;
    protected queryConditionFieldLabel(condition: CxQueryFieldCondition): string;
    protected queryConditionOperatorLabel(condition: CxQueryFieldCondition): string;
    protected queryConditionValueLabel(condition: CxQueryFieldCondition): string;
    protected queryConditionHasValue(condition: CxQueryFieldCondition): boolean;
    protected queryTranslationPartUnsupported(conditionId: string, part: CxFilterBarQueryTranslationIssuePart): boolean;
    protected queryTranslationIssueLabel(issue: CxFilterBarQueryTranslationIssue): string;
    protected keepQueryMode(): void;
    protected confirmQueryToFilterSwitch(): void;
    protected onOverflowOpenChange(open: boolean): void;
    protected onDisplayModeSelect(value: string | undefined): void;
    protected onGroupBySelect(value: string | undefined): void;
    protected onSortByValueChange(value: string | undefined): void;
    protected onThenByValueChange(value: string | undefined): void;
    protected toggleSortDirection(): void;
    protected toggleThenByDirection(): void;
    protected onColumnSearchValueChange(value: string): void;
    protected onColumnOptionSelect(columnId: string): void;
    protected resetColumns(): void;
    protected togglePinnedColumn(columnId: string): void;
    protected toggleFilterPopover(): void;
    protected togglePropertiesPopover(): void;
    closeFilterPopover(restoreFocus?: boolean): void;
    protected closeFloatingPopovers(restoreFocus?: boolean): void;
    protected isColumnVisible(columnId: string): boolean;
    protected isColumnPinned(columnId: string): boolean;
    protected canPinColumn(columnId: string): boolean;
    protected directionIcon(direction: CxFilterBarSortDirection): CxIconName;
    protected directionTooltip(direction: CxFilterBarSortDirection): string;
    protected hasActivePrimarySort(): boolean;
    protected hasActiveSecondarySort(): boolean;
    protected onDocumentPointerDown(event: PointerEvent): void;
    protected onEscapeKey(): void;
    protected onWindowResize(): void;
    private applyMode;
    private requestModeSwitch;
    private resolveQueryToFilterTranslation;
    private applyQueryTranslation;
    invalidateSavedViewSelection(): void;
    private pointerTargetIsInsideFilterBar;
    private syncFilterPopoverMetrics;
    private syncTagFilterMetrics;
    private syncActiveFilterOverflowMetrics;
    private scheduleActiveFilterOverflowFocus;
    private reconcileActiveFilterOverflow;
    private scheduleTagFilterFocus;
    private scheduleExpandedFilterFocus;
    /**
     * The surface is portaled after render, so the editor may not exist on the
     * first frame; retry a bounded number of times, as the column header does.
     */
    private focusTagFilterEditor;
    private columnFilterEditorIn;
    private syncPropertiesPopoverMetrics;
    private scheduleActiveFilterMeasure;
    private setVisibleActiveFilterCount;
    /**
     * Counts how many tags wrapped past the first row. Tags stay in normal flow
     * (wrapped rows are clipped by the container), so this read never changes
     * layout and cannot oscillate.
     */
    private measureActiveFilterTags;
    private scheduleFilterFocus;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxFilterBarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxFilterBarComponent, "cx-filter-bar", never, { "queryAriaLabel": { "alias": "queryAriaLabel"; "required": false; }; "filterSearchAriaLabel": { "alias": "filterSearchAriaLabel"; "required": false; }; "columnSearchAriaLabel": { "alias": "columnSearchAriaLabel"; "required": false; }; "mode": { "alias": "mode"; "required": false; }; "quickFilters": { "alias": "quickFilters"; "required": false; }; "selectedQuickFilterId": { "alias": "selectedQuickFilterId"; "required": false; }; "toggleFilters": { "alias": "toggleFilters"; "required": false; }; "selectedToggleFilterIds": { "alias": "selectedToggleFilterIds"; "required": false; }; "filters": { "alias": "filters"; "required": false; }; "filterValues": { "alias": "filterValues"; "required": false; }; "showActiveFilters": { "alias": "showActiveFilters"; "required": false; }; "queryValue": { "alias": "queryValue"; "required": false; }; "queryFields": { "alias": "queryFields"; "required": false; }; "queryConditions": { "alias": "queryConditions"; "required": false; }; "queryToFilterTranslation": { "alias": "queryToFilterTranslation"; "required": false; }; "filtersToQueryConditions": { "alias": "filtersToQueryConditions"; "required": false; }; "savedViews": { "alias": "savedViews"; "required": false; }; "displayMode": { "alias": "displayMode"; "required": false; }; "groupByOptions": { "alias": "groupByOptions"; "required": false; }; "groupBy": { "alias": "groupBy"; "required": false; }; "sortOptions": { "alias": "sortOptions"; "required": false; }; "sortBy": { "alias": "sortBy"; "required": false; }; "sortDirection": { "alias": "sortDirection"; "required": false; }; "thenBy": { "alias": "thenBy"; "required": false; }; "thenByDirection": { "alias": "thenByDirection"; "required": false; }; "columnOptions": { "alias": "columnOptions"; "required": false; }; "visibleColumnIds": { "alias": "visibleColumnIds"; "required": false; }; "pinnedColumnIds": { "alias": "pinnedColumnIds"; "required": false; }; }, { "modeChange": "modeChange"; "selectedQuickFilterIdChange": "selectedQuickFilterIdChange"; "selectedToggleFilterIdsChange": "selectedToggleFilterIdsChange"; "filterValuesChange": "filterValuesChange"; "filterQueryChange": "filterQueryChange"; "filterLoadMore": "filterLoadMore"; "queryValueChange": "queryValueChange"; "queryConditionsChange": "queryConditionsChange"; "queryValueSearch": "queryValueSearch"; "queryValueRetry": "queryValueRetry"; "savedViewSelect": "savedViewSelect"; "activeSavedViewIdChange": "activeSavedViewIdChange"; "displayModeChange": "displayModeChange"; "groupByChange": "groupByChange"; "sortByChange": "sortByChange"; "sortDirectionChange": "sortDirectionChange"; "thenByChange": "thenByChange"; "thenByDirectionChange": "thenByDirectionChange"; "visibleColumnIdsChange": "visibleColumnIdsChange"; "pinnedColumnIdsChange": "pinnedColumnIdsChange"; "filterPopoverOpenChange": "filterPopoverOpenChange"; "exportTable": "exportTable"; "resetTable": "resetTable"; }, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-filter-bar.component.d.ts.map