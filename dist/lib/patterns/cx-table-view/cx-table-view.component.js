import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxFilterBarComponent, } from '../cx-filter-bar/index.js';
import { CxTableComponent, } from '../../primitives/data/cx-table/index.js';
import { normalizeCxColumnFilterValueMap, } from '../../primitives/data/cx-column-filter-editor/index.js';
import { CxPaginationComponent } from '../../primitives/navigation/cx-pagination/index.js';
import { CxActionBarComponent } from '../cx-action-bar/index.js';
import * as i0 from "@angular/core";
export class CxTableViewComponent {
    columnsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnsState" }] : /* istanbul ignore next */ []));
    filterValuesState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterValuesState" }] : /* istanbul ignore next */ []));
    filterBar;
    table;
    heading = '';
    showFilterBar = true;
    showActiveFilters = true;
    filterBarMode = 'filters';
    quickFilters = [];
    selectedQuickFilterId;
    toggleFilters = [];
    selectedToggleFilterIds = [];
    queryValue = '';
    queryFields = [];
    queryConditions = [];
    queryToFilterTranslation;
    filtersToQueryConditions;
    queryAriaLabel = 'Search query';
    savedViews = [];
    groupByOptions = [];
    groupBy = 'none';
    sortOptions = [];
    sortBy = 'none';
    sortDirection = 'asc';
    thenBy = 'none';
    thenByDirection = 'asc';
    columnOptions = [];
    visibleColumnIds = [];
    pinnedColumnIds = [];
    set columns(value) {
        this.columnsState.set(value ?? []);
    }
    get columns() {
        return this.columnsState();
    }
    rows = [];
    density = 'comfortable';
    rowActivation = 'none';
    showHeaders = true;
    columnsResizable = true;
    columnsReorderable = true;
    stickyHeader = false;
    zebra = false;
    loading = false;
    showRowActions = true;
    rightClickMenu = true;
    emptyState = {
        heading: 'No results to display.',
        visual: 'none',
    };
    emptyStateAction;
    noMatchesState = {
        heading: 'No results match this view.',
        visual: 'none',
    };
    sort;
    activeRowId;
    selectionMode = 'none';
    selectedRowIds = [];
    paginationMode = 'none';
    page;
    pageSizes = [10, 25, 50, 100];
    actionBarData;
    set filterValues(value) {
        this.filterValuesState.set({ ...(value ?? {}) });
    }
    filterBarModeChange = new EventEmitter();
    selectedQuickFilterIdChange = new EventEmitter();
    selectedToggleFilterIdsChange = new EventEmitter();
    filterValuesChange = new EventEmitter();
    filterQueryChange = new EventEmitter();
    filterLoadMore = new EventEmitter();
    queryValueChange = new EventEmitter();
    queryConditionsChange = new EventEmitter();
    queryValueSearch = new EventEmitter();
    queryValueRetry = new EventEmitter();
    savedViewSelect = new EventEmitter();
    activeSavedViewIdChange = new EventEmitter();
    densityChange = new EventEmitter();
    groupByChange = new EventEmitter();
    sortByChange = new EventEmitter();
    sortDirectionChange = new EventEmitter();
    thenByChange = new EventEmitter();
    thenByDirectionChange = new EventEmitter();
    visibleColumnIdsChange = new EventEmitter();
    pinnedColumnIdsChange = new EventEmitter();
    exportTable = new EventEmitter();
    resetTable = new EventEmitter();
    sortChange = new EventEmitter();
    columnOrderChange = new EventEmitter();
    activeRowIdChange = new EventEmitter();
    emptyStateActionSelect = new EventEmitter();
    rowActivate = new EventEmitter();
    selectedRowIdsChange = new EventEmitter();
    rowMenuItemSelect = new EventEmitter();
    pageChange = new EventEmitter();
    actionBarDeselectAll = new EventEmitter();
    actionBarAction = new EventEmitter();
    get hasHeading() {
        return this.heading.trim().length > 0;
    }
    get showPagination() {
        return this.paginationMode === 'pages' && this.page !== undefined;
    }
    filters$ = computed(() => this.columnsState()
        .filter((column) => column.filter !== undefined)
        .map(column => ({
        id: column.id,
        label: column.label,
        filter: column.filter,
    })), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filters$" }] : /* istanbul ignore next */ []));
    resolvedFilterValues$ = computed(() => normalizeCxColumnFilterValueMap(Object.fromEntries(this.filters$().map(filter => [filter.id, filter.filter])), this.filterValuesState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resolvedFilterValues$" }] : /* istanbul ignore next */ []));
    get visibleColumns() {
        const pinnedIds = new Set(this.pinnedColumnIds);
        const columnOptionsById = new Map(this.columnOptions.map(option => [option.id, option]));
        if (this.visibleColumnIds.length === 0) {
            return this.columns.map(column => ({
                ...column,
                pinned: pinnedIds.has(column.id),
                pinnable: this.columnIsPinnable(column, columnOptionsById),
                hideable: this.columnIsHideable(column, columnOptionsById),
            }));
        }
        const visibleIds = new Set(this.visibleColumnIds);
        return this.columns
            .filter(column => visibleIds.has(column.id))
            .map(column => ({
            ...column,
            pinned: pinnedIds.has(column.id),
            pinnable: this.columnIsPinnable(column, columnOptionsById),
            hideable: this.columnIsHideable(column, columnOptionsById),
        }));
    }
    columnIsPinnable(column, columnOptionsById) {
        const option = columnOptionsById.get(column.id);
        return column.pinnable ?? (option !== undefined && option.pinnable !== false);
    }
    columnIsHideable(column, columnOptionsById) {
        return column.hideable ?? columnOptionsById.has(column.id);
    }
    onColumnPinChange(event) {
        const visibleIds = this.resolvedVisibleColumnIds();
        if (!visibleIds.includes(event.columnId)) {
            return;
        }
        const current = this.pinnedColumnIds.filter(id => visibleIds.includes(id));
        const next = event.pinned
            ? current.includes(event.columnId)
                ? current
                : [...current, event.columnId]
            : current.filter(id => id !== event.columnId);
        this.pinnedColumnIdsChange.emit(next);
    }
    onColumnVisibilityChange(event) {
        if (event.visible) {
            return;
        }
        const current = this.resolvedVisibleColumnIds();
        if (!current.includes(event.columnId) || current.length <= 1) {
            return;
        }
        const next = current.filter(id => id !== event.columnId);
        this.visibleColumnIdsChange.emit(next);
        if (this.pinnedColumnIds.includes(event.columnId)) {
            this.pinnedColumnIdsChange.emit(this.pinnedColumnIds.filter(id => id !== event.columnId));
        }
    }
    onFilterValuesChange(values) {
        this.filterValuesState.set(values);
        this.filterBar?.invalidateSavedViewSelection();
        this.filterValuesChange.emit(values);
    }
    onFilterPopoverOpenChange(open) {
        if (open) {
            this.table?.closeColumnHeaderMenu(false);
        }
    }
    onColumnHeaderMenuOpenChange(open) {
        if (open) {
            this.filterBar?.closeFilterPopover(false);
        }
    }
    resolvedVisibleColumnIds() {
        return this.visibleColumnIds.length > 0 ? this.visibleColumnIds : this.columns.map(column => column.id);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableViewComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTableViewComponent, isStandalone: true, selector: "cx-table-view", inputs: { heading: "heading", showFilterBar: "showFilterBar", showActiveFilters: "showActiveFilters", filterBarMode: "filterBarMode", quickFilters: "quickFilters", selectedQuickFilterId: "selectedQuickFilterId", toggleFilters: "toggleFilters", selectedToggleFilterIds: "selectedToggleFilterIds", queryValue: "queryValue", queryFields: "queryFields", queryConditions: "queryConditions", queryToFilterTranslation: "queryToFilterTranslation", filtersToQueryConditions: "filtersToQueryConditions", queryAriaLabel: "queryAriaLabel", savedViews: "savedViews", groupByOptions: "groupByOptions", groupBy: "groupBy", sortOptions: "sortOptions", sortBy: "sortBy", sortDirection: "sortDirection", thenBy: "thenBy", thenByDirection: "thenByDirection", columnOptions: "columnOptions", visibleColumnIds: "visibleColumnIds", pinnedColumnIds: "pinnedColumnIds", columns: "columns", rows: "rows", density: "density", rowActivation: "rowActivation", showHeaders: "showHeaders", columnsResizable: "columnsResizable", columnsReorderable: "columnsReorderable", stickyHeader: "stickyHeader", zebra: "zebra", loading: "loading", showRowActions: "showRowActions", rightClickMenu: "rightClickMenu", emptyState: "emptyState", emptyStateAction: "emptyStateAction", noMatchesState: "noMatchesState", sort: "sort", activeRowId: "activeRowId", selectionMode: "selectionMode", selectedRowIds: "selectedRowIds", paginationMode: "paginationMode", page: "page", pageSizes: "pageSizes", actionBarData: "actionBarData", filterValues: "filterValues" }, outputs: { filterBarModeChange: "filterBarModeChange", selectedQuickFilterIdChange: "selectedQuickFilterIdChange", selectedToggleFilterIdsChange: "selectedToggleFilterIdsChange", filterValuesChange: "filterValuesChange", filterQueryChange: "filterQueryChange", filterLoadMore: "filterLoadMore", queryValueChange: "queryValueChange", queryConditionsChange: "queryConditionsChange", queryValueSearch: "queryValueSearch", queryValueRetry: "queryValueRetry", savedViewSelect: "savedViewSelect", activeSavedViewIdChange: "activeSavedViewIdChange", densityChange: "densityChange", groupByChange: "groupByChange", sortByChange: "sortByChange", sortDirectionChange: "sortDirectionChange", thenByChange: "thenByChange", thenByDirectionChange: "thenByDirectionChange", visibleColumnIdsChange: "visibleColumnIdsChange", pinnedColumnIdsChange: "pinnedColumnIdsChange", exportTable: "exportTable", resetTable: "resetTable", sortChange: "sortChange", columnOrderChange: "columnOrderChange", activeRowIdChange: "activeRowIdChange", emptyStateActionSelect: "emptyStateActionSelect", rowActivate: "rowActivate", selectedRowIdsChange: "selectedRowIdsChange", rowMenuItemSelect: "rowMenuItemSelect", pageChange: "pageChange", actionBarDeselectAll: "actionBarDeselectAll", actionBarAction: "actionBarAction" }, viewQueries: [{ propertyName: "filterBar", first: true, predicate: CxFilterBarComponent, descendants: true }, { propertyName: "table", first: true, predicate: CxTableComponent, descendants: true }], ngImport: i0, template: "<div class=\"cx-table-view\">\n  <div class=\"cx-table-view__header\">\n    @if (hasHeading) {\n      <h2 class=\"cx-table-view__heading\">{{ heading }}</h2>\n    }\n    <div class=\"cx-table-view__actions\">\n      <ng-content select=\"[actions], [cxTableViewActions]\" />\n    </div>\n\n    @if (showFilterBar) {\n      <cx-filter-bar\n        class=\"cx-table-view__filters\"\n        [mode]=\"filterBarMode\"\n        [showActiveFilters]=\"showActiveFilters\"\n        [quickFilters]=\"quickFilters\"\n        [selectedQuickFilterId]=\"selectedQuickFilterId\"\n        [toggleFilters]=\"toggleFilters\"\n        [selectedToggleFilterIds]=\"selectedToggleFilterIds\"\n        [filters]=\"filters$()\"\n        [filterValues]=\"resolvedFilterValues$()\"\n        [queryValue]=\"queryValue\"\n        [queryFields]=\"queryFields\"\n        [queryConditions]=\"queryConditions\"\n        [queryToFilterTranslation]=\"queryToFilterTranslation\"\n        [filtersToQueryConditions]=\"filtersToQueryConditions\"\n        [queryAriaLabel]=\"queryAriaLabel\"\n        [savedViews]=\"savedViews\"\n        [displayMode]=\"density === 'comfortable' ? 'comfortable' : 'compact'\"\n        [groupByOptions]=\"groupByOptions\"\n        [groupBy]=\"groupBy\"\n        [sortOptions]=\"sortOptions\"\n        [sortBy]=\"sortBy\"\n        [sortDirection]=\"sortDirection\"\n        [thenBy]=\"thenBy\"\n        [thenByDirection]=\"thenByDirection\"\n        [columnOptions]=\"columnOptions\"\n        [visibleColumnIds]=\"visibleColumnIds\"\n        [pinnedColumnIds]=\"pinnedColumnIds\"\n        (modeChange)=\"filterBarModeChange.emit($event)\"\n        (selectedQuickFilterIdChange)=\"selectedQuickFilterIdChange.emit($event)\"\n        (selectedToggleFilterIdsChange)=\"selectedToggleFilterIdsChange.emit($event)\"\n        (filterValuesChange)=\"onFilterValuesChange($event)\"\n        (filterQueryChange)=\"filterQueryChange.emit($event)\"\n        (filterLoadMore)=\"filterLoadMore.emit($event)\"\n        (filterPopoverOpenChange)=\"onFilterPopoverOpenChange($event)\"\n        (queryValueChange)=\"queryValueChange.emit($event)\"\n        (queryConditionsChange)=\"queryConditionsChange.emit($event)\"\n        (queryValueSearch)=\"queryValueSearch.emit($event)\"\n        (queryValueRetry)=\"queryValueRetry.emit($event)\"\n        (savedViewSelect)=\"savedViewSelect.emit($event)\"\n        (activeSavedViewIdChange)=\"activeSavedViewIdChange.emit($event)\"\n        (displayModeChange)=\"densityChange.emit($event === 'comfortable' ? 'comfortable' : 'compact')\"\n        (groupByChange)=\"groupByChange.emit($event)\"\n        (sortByChange)=\"sortByChange.emit($event)\"\n        (sortDirectionChange)=\"sortDirectionChange.emit($event)\"\n        (thenByChange)=\"thenByChange.emit($event)\"\n        (thenByDirectionChange)=\"thenByDirectionChange.emit($event)\"\n        (visibleColumnIdsChange)=\"visibleColumnIdsChange.emit($event)\"\n        (pinnedColumnIdsChange)=\"pinnedColumnIdsChange.emit($event)\"\n        (exportTable)=\"exportTable.emit()\"\n        (resetTable)=\"resetTable.emit()\"\n      />\n    }\n  </div>\n\n  <div class=\"cx-table-view__surface\">\n    <cx-table\n      [columns]=\"visibleColumns\"\n      [rows]=\"rows\"\n      [density]=\"density\"\n      [rowActivation]=\"rowActivation\"\n      [showHeaders]=\"showHeaders\"\n      [columnsResizable]=\"columnsResizable\"\n      [columnsReorderable]=\"columnsReorderable\"\n      [stickyHeader]=\"stickyHeader\"\n      [zebra]=\"zebra\"\n      [loading]=\"loading\"\n      [showRowActions]=\"showRowActions\"\n      [rightClickMenu]=\"rightClickMenu\"\n      [sort]=\"sort\"\n      [filterValues]=\"resolvedFilterValues$()\"\n      [emptyState]=\"emptyState\"\n      [emptyStateAction]=\"emptyStateAction\"\n      [noMatchesState]=\"noMatchesState\"\n      [activeRowId]=\"activeRowId\"\n      [selectionMode]=\"selectionMode\"\n      [selectedRowIds]=\"selectedRowIds\"\n      (sortChange)=\"sortChange.emit($event)\"\n      (filterValuesChange)=\"onFilterValuesChange($event)\"\n      (resetTable)=\"resetTable.emit()\"\n      (filterQueryChange)=\"filterQueryChange.emit($event)\"\n      (filterLoadMore)=\"filterLoadMore.emit($event)\"\n      (columnHeaderMenuOpenChange)=\"onColumnHeaderMenuOpenChange($event)\"\n      (columnOrderChange)=\"columnOrderChange.emit($event)\"\n      (columnPinChange)=\"onColumnPinChange($event)\"\n      (columnVisibilityChange)=\"onColumnVisibilityChange($event)\"\n      (activeRowIdChange)=\"activeRowIdChange.emit($event)\"\n      (emptyStateActionSelect)=\"emptyStateActionSelect.emit($event)\"\n      (rowActivate)=\"rowActivate.emit($event)\"\n      (selectedRowIdsChange)=\"selectedRowIdsChange.emit($event)\"\n      (rowMenuItemSelect)=\"rowMenuItemSelect.emit($event)\"\n    />\n  </div>\n\n  @if (showPagination) {\n    <div class=\"cx-table-view__footer\">\n      <cx-pagination\n        [page]=\"page\"\n        [pageSizes]=\"pageSizes\"\n        (pageChange)=\"pageChange.emit($event)\"\n      />\n    </div>\n  }\n\n  <cx-action-bar\n    [data]=\"actionBarData\"\n    (deselectAll)=\"actionBarDeselectAll.emit()\"\n    (action)=\"actionBarAction.emit($event)\"\n  />\n</div>\n", styles: [":host{display:block;width:100%}.cx-table-view{display:flex;width:100%;flex-direction:column;gap:var(--space-md)}.cx-table-view__header{display:flex;min-width:0;flex-wrap:wrap;align-items:center;gap:var(--space-md)}.cx-table-view__heading{margin:0;flex:0 0 auto;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-table-view__actions{display:inline-flex;min-width:0;flex:0 0 auto;align-items:center;gap:var(--space-sm)}.cx-table-view__filters{min-width:0;flex:1 1 24rem}.cx-table-view__header:not(:has(.cx-table-view__heading,.cx-table-view__actions>*,.cx-table-view__filters)){display:none}.cx-table-view__surface{min-width:0}.cx-table-view__footer{display:flex;min-width:0;align-items:center;justify-content:flex-end;padding-top:var(--space-sm)}"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "component", type: CxActionBarComponent, selector: "cx-action-bar", inputs: ["data"], outputs: ["deselectAll", "action"] }, { kind: "component", type: CxFilterBarComponent, selector: "cx-filter-bar", inputs: ["queryAriaLabel", "filterSearchAriaLabel", "columnSearchAriaLabel", "mode", "quickFilters", "selectedQuickFilterId", "toggleFilters", "selectedToggleFilterIds", "filters", "filterValues", "showActiveFilters", "queryValue", "queryFields", "queryConditions", "queryToFilterTranslation", "filtersToQueryConditions", "savedViews", "displayMode", "groupByOptions", "groupBy", "sortOptions", "sortBy", "sortDirection", "thenBy", "thenByDirection", "columnOptions", "visibleColumnIds", "pinnedColumnIds"], outputs: ["modeChange", "selectedQuickFilterIdChange", "selectedToggleFilterIdsChange", "filterValuesChange", "filterQueryChange", "filterLoadMore", "queryValueChange", "queryConditionsChange", "queryValueSearch", "queryValueRetry", "savedViewSelect", "activeSavedViewIdChange", "displayModeChange", "groupByChange", "sortByChange", "sortDirectionChange", "thenByChange", "thenByDirectionChange", "visibleColumnIdsChange", "pinnedColumnIdsChange", "filterPopoverOpenChange", "exportTable", "resetTable"] }, { kind: "component", type: CxPaginationComponent, selector: "cx-pagination", inputs: ["page", "pageSizes", "totalMode"], outputs: ["pageChange"] }, { kind: "component", type: CxTableComponent, selector: "cx-table", inputs: ["density", "rowActivation", "showHeaders", "columnsResizable", "columnsReorderable", "stickyHeader", "zebra", "loading", "showRowActions", "rightClickMenu", "emptyState", "emptyStateAction", "noMatchesState", "selectionMode", "columns", "rows", "activeRowId", "selectedRowIds", "filterValues", "sort"], outputs: ["activeRowIdChange", "emptyStateActionSelect", "selectedRowIdsChange", "rowMenuItemSelect", "rowActivate", "columnOrderChange", "sortChange", "filterValuesChange", "resetTable", "filterQueryChange", "filterLoadMore", "columnHeaderMenuOpenChange", "columnPinChange", "columnVisibilityChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableViewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-table-view', imports: [CommonModule, CxActionBarComponent, CxFilterBarComponent, CxPaginationComponent, CxTableComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-table-view\">\n  <div class=\"cx-table-view__header\">\n    @if (hasHeading) {\n      <h2 class=\"cx-table-view__heading\">{{ heading }}</h2>\n    }\n    <div class=\"cx-table-view__actions\">\n      <ng-content select=\"[actions], [cxTableViewActions]\" />\n    </div>\n\n    @if (showFilterBar) {\n      <cx-filter-bar\n        class=\"cx-table-view__filters\"\n        [mode]=\"filterBarMode\"\n        [showActiveFilters]=\"showActiveFilters\"\n        [quickFilters]=\"quickFilters\"\n        [selectedQuickFilterId]=\"selectedQuickFilterId\"\n        [toggleFilters]=\"toggleFilters\"\n        [selectedToggleFilterIds]=\"selectedToggleFilterIds\"\n        [filters]=\"filters$()\"\n        [filterValues]=\"resolvedFilterValues$()\"\n        [queryValue]=\"queryValue\"\n        [queryFields]=\"queryFields\"\n        [queryConditions]=\"queryConditions\"\n        [queryToFilterTranslation]=\"queryToFilterTranslation\"\n        [filtersToQueryConditions]=\"filtersToQueryConditions\"\n        [queryAriaLabel]=\"queryAriaLabel\"\n        [savedViews]=\"savedViews\"\n        [displayMode]=\"density === 'comfortable' ? 'comfortable' : 'compact'\"\n        [groupByOptions]=\"groupByOptions\"\n        [groupBy]=\"groupBy\"\n        [sortOptions]=\"sortOptions\"\n        [sortBy]=\"sortBy\"\n        [sortDirection]=\"sortDirection\"\n        [thenBy]=\"thenBy\"\n        [thenByDirection]=\"thenByDirection\"\n        [columnOptions]=\"columnOptions\"\n        [visibleColumnIds]=\"visibleColumnIds\"\n        [pinnedColumnIds]=\"pinnedColumnIds\"\n        (modeChange)=\"filterBarModeChange.emit($event)\"\n        (selectedQuickFilterIdChange)=\"selectedQuickFilterIdChange.emit($event)\"\n        (selectedToggleFilterIdsChange)=\"selectedToggleFilterIdsChange.emit($event)\"\n        (filterValuesChange)=\"onFilterValuesChange($event)\"\n        (filterQueryChange)=\"filterQueryChange.emit($event)\"\n        (filterLoadMore)=\"filterLoadMore.emit($event)\"\n        (filterPopoverOpenChange)=\"onFilterPopoverOpenChange($event)\"\n        (queryValueChange)=\"queryValueChange.emit($event)\"\n        (queryConditionsChange)=\"queryConditionsChange.emit($event)\"\n        (queryValueSearch)=\"queryValueSearch.emit($event)\"\n        (queryValueRetry)=\"queryValueRetry.emit($event)\"\n        (savedViewSelect)=\"savedViewSelect.emit($event)\"\n        (activeSavedViewIdChange)=\"activeSavedViewIdChange.emit($event)\"\n        (displayModeChange)=\"densityChange.emit($event === 'comfortable' ? 'comfortable' : 'compact')\"\n        (groupByChange)=\"groupByChange.emit($event)\"\n        (sortByChange)=\"sortByChange.emit($event)\"\n        (sortDirectionChange)=\"sortDirectionChange.emit($event)\"\n        (thenByChange)=\"thenByChange.emit($event)\"\n        (thenByDirectionChange)=\"thenByDirectionChange.emit($event)\"\n        (visibleColumnIdsChange)=\"visibleColumnIdsChange.emit($event)\"\n        (pinnedColumnIdsChange)=\"pinnedColumnIdsChange.emit($event)\"\n        (exportTable)=\"exportTable.emit()\"\n        (resetTable)=\"resetTable.emit()\"\n      />\n    }\n  </div>\n\n  <div class=\"cx-table-view__surface\">\n    <cx-table\n      [columns]=\"visibleColumns\"\n      [rows]=\"rows\"\n      [density]=\"density\"\n      [rowActivation]=\"rowActivation\"\n      [showHeaders]=\"showHeaders\"\n      [columnsResizable]=\"columnsResizable\"\n      [columnsReorderable]=\"columnsReorderable\"\n      [stickyHeader]=\"stickyHeader\"\n      [zebra]=\"zebra\"\n      [loading]=\"loading\"\n      [showRowActions]=\"showRowActions\"\n      [rightClickMenu]=\"rightClickMenu\"\n      [sort]=\"sort\"\n      [filterValues]=\"resolvedFilterValues$()\"\n      [emptyState]=\"emptyState\"\n      [emptyStateAction]=\"emptyStateAction\"\n      [noMatchesState]=\"noMatchesState\"\n      [activeRowId]=\"activeRowId\"\n      [selectionMode]=\"selectionMode\"\n      [selectedRowIds]=\"selectedRowIds\"\n      (sortChange)=\"sortChange.emit($event)\"\n      (filterValuesChange)=\"onFilterValuesChange($event)\"\n      (resetTable)=\"resetTable.emit()\"\n      (filterQueryChange)=\"filterQueryChange.emit($event)\"\n      (filterLoadMore)=\"filterLoadMore.emit($event)\"\n      (columnHeaderMenuOpenChange)=\"onColumnHeaderMenuOpenChange($event)\"\n      (columnOrderChange)=\"columnOrderChange.emit($event)\"\n      (columnPinChange)=\"onColumnPinChange($event)\"\n      (columnVisibilityChange)=\"onColumnVisibilityChange($event)\"\n      (activeRowIdChange)=\"activeRowIdChange.emit($event)\"\n      (emptyStateActionSelect)=\"emptyStateActionSelect.emit($event)\"\n      (rowActivate)=\"rowActivate.emit($event)\"\n      (selectedRowIdsChange)=\"selectedRowIdsChange.emit($event)\"\n      (rowMenuItemSelect)=\"rowMenuItemSelect.emit($event)\"\n    />\n  </div>\n\n  @if (showPagination) {\n    <div class=\"cx-table-view__footer\">\n      <cx-pagination\n        [page]=\"page\"\n        [pageSizes]=\"pageSizes\"\n        (pageChange)=\"pageChange.emit($event)\"\n      />\n    </div>\n  }\n\n  <cx-action-bar\n    [data]=\"actionBarData\"\n    (deselectAll)=\"actionBarDeselectAll.emit()\"\n    (action)=\"actionBarAction.emit($event)\"\n  />\n</div>\n", styles: [":host{display:block;width:100%}.cx-table-view{display:flex;width:100%;flex-direction:column;gap:var(--space-md)}.cx-table-view__header{display:flex;min-width:0;flex-wrap:wrap;align-items:center;gap:var(--space-md)}.cx-table-view__heading{margin:0;flex:0 0 auto;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-table-view__actions{display:inline-flex;min-width:0;flex:0 0 auto;align-items:center;gap:var(--space-sm)}.cx-table-view__filters{min-width:0;flex:1 1 24rem}.cx-table-view__header:not(:has(.cx-table-view__heading,.cx-table-view__actions>*,.cx-table-view__filters)){display:none}.cx-table-view__surface{min-width:0}.cx-table-view__footer{display:flex;min-width:0;align-items:center;justify-content:flex-end;padding-top:var(--space-sm)}"] }]
        }], propDecorators: { filterBar: [{
                type: ViewChild,
                args: [CxFilterBarComponent]
            }], table: [{
                type: ViewChild,
                args: [CxTableComponent]
            }], heading: [{
                type: Input
            }], showFilterBar: [{
                type: Input
            }], showActiveFilters: [{
                type: Input
            }], filterBarMode: [{
                type: Input
            }], quickFilters: [{
                type: Input
            }], selectedQuickFilterId: [{
                type: Input
            }], toggleFilters: [{
                type: Input
            }], selectedToggleFilterIds: [{
                type: Input
            }], queryValue: [{
                type: Input
            }], queryFields: [{
                type: Input
            }], queryConditions: [{
                type: Input
            }], queryToFilterTranslation: [{
                type: Input
            }], filtersToQueryConditions: [{
                type: Input
            }], queryAriaLabel: [{
                type: Input
            }], savedViews: [{
                type: Input
            }], groupByOptions: [{
                type: Input
            }], groupBy: [{
                type: Input
            }], sortOptions: [{
                type: Input
            }], sortBy: [{
                type: Input
            }], sortDirection: [{
                type: Input
            }], thenBy: [{
                type: Input
            }], thenByDirection: [{
                type: Input
            }], columnOptions: [{
                type: Input
            }], visibleColumnIds: [{
                type: Input
            }], pinnedColumnIds: [{
                type: Input
            }], columns: [{
                type: Input
            }], rows: [{
                type: Input
            }], density: [{
                type: Input
            }], rowActivation: [{
                type: Input
            }], showHeaders: [{
                type: Input
            }], columnsResizable: [{
                type: Input
            }], columnsReorderable: [{
                type: Input
            }], stickyHeader: [{
                type: Input
            }], zebra: [{
                type: Input
            }], loading: [{
                type: Input
            }], showRowActions: [{
                type: Input
            }], rightClickMenu: [{
                type: Input
            }], emptyState: [{
                type: Input
            }], emptyStateAction: [{
                type: Input
            }], noMatchesState: [{
                type: Input
            }], sort: [{
                type: Input
            }], activeRowId: [{
                type: Input
            }], selectionMode: [{
                type: Input
            }], selectedRowIds: [{
                type: Input
            }], paginationMode: [{
                type: Input
            }], page: [{
                type: Input
            }], pageSizes: [{
                type: Input
            }], actionBarData: [{
                type: Input
            }], filterValues: [{
                type: Input
            }], filterBarModeChange: [{
                type: Output
            }], selectedQuickFilterIdChange: [{
                type: Output
            }], selectedToggleFilterIdsChange: [{
                type: Output
            }], filterValuesChange: [{
                type: Output
            }], filterQueryChange: [{
                type: Output
            }], filterLoadMore: [{
                type: Output
            }], queryValueChange: [{
                type: Output
            }], queryConditionsChange: [{
                type: Output
            }], queryValueSearch: [{
                type: Output
            }], queryValueRetry: [{
                type: Output
            }], savedViewSelect: [{
                type: Output
            }], activeSavedViewIdChange: [{
                type: Output
            }], densityChange: [{
                type: Output
            }], groupByChange: [{
                type: Output
            }], sortByChange: [{
                type: Output
            }], sortDirectionChange: [{
                type: Output
            }], thenByChange: [{
                type: Output
            }], thenByDirectionChange: [{
                type: Output
            }], visibleColumnIdsChange: [{
                type: Output
            }], pinnedColumnIdsChange: [{
                type: Output
            }], exportTable: [{
                type: Output
            }], resetTable: [{
                type: Output
            }], sortChange: [{
                type: Output
            }], columnOrderChange: [{
                type: Output
            }], activeRowIdChange: [{
                type: Output
            }], emptyStateActionSelect: [{
                type: Output
            }], rowActivate: [{
                type: Output
            }], selectedRowIdsChange: [{
                type: Output
            }], rowMenuItemSelect: [{
                type: Output
            }], pageChange: [{
                type: Output
            }], actionBarDeselectAll: [{
                type: Output
            }], actionBarAction: [{
                type: Output
            }] } });
