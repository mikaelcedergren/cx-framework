import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, ViewChildren, computed, effect, inject, signal, } from '@angular/core';
import { CxButtonGroupComponent, } from '../../primitives/actions/cx-button-group/index.js';
import { CxToggleButtonComponent } from '../../primitives/actions/cx-toggle-button/index.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxExpansionPanelComponent } from '../../primitives/display/cx-expansion-panel/index.js';
import { CxTagComponent } from '../../primitives/display/cx-tag/index.js';
import { CxToggleChipGroupComponent, } from '../../primitives/inputs/cx-toggle-chip-group/index.js';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field/index.js';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch/index.js';
import { CxDropdownComponent, } from '../../primitives/inputs/cx-dropdown/index.js';
import { CxMenuComponent, CxMenuTriggerDirective, } from '../../primitives/overlay/cx-menu/index.js';
import { CxOptionGroupComponent } from '../../primitives/overlay/cx-option-group/index.js';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover/index.js';
import { CxTooltipComponent } from '../../primitives/overlay/cx-tooltip/index.js';
import { measureCxFloatingSurface, } from '../../primitives/overlay/floating-surface.js';
import { CxColumnFilterEditorComponent, assertCxColumnFilterDefinition, estimateCxColumnFilterHeight, isCxColumnFilterValueActive, withCxColumnFilterValue, } from '../../primitives/data/cx-column-filter-editor/index.js';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
const CX_FILTER_BAR_MAX_PINNED_COLUMNS = 3;
/** Same surface width as the table's column-header filter, so one filter reads the same in both places. */
const CX_FILTER_BAR_TAG_POPOVER_WIDTH = 320;
const DISPLAY_OPTIONS = [
    { id: 'compact', label: 'Compact' },
    { id: 'comfortable', label: 'Comfortable' },
];
export class CxFilterBarComponent {
    static instanceCounter = 0;
    instanceId = ++CxFilterBarComponent.instanceCounter;
    tagFilterDialogId = `cx-filter-bar-${this.instanceId}-tag-filter`;
    host = inject((ElementRef));
    modeState = signal('filters', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "modeState" }] : /* istanbul ignore next */ []));
    quickFiltersState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "quickFiltersState" }] : /* istanbul ignore next */ []));
    selectedQuickFilterIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedQuickFilterIdState" }] : /* istanbul ignore next */ []));
    toggleFiltersState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "toggleFiltersState" }] : /* istanbul ignore next */ []));
    selectedToggleFilterIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedToggleFilterIdsState" }] : /* istanbul ignore next */ []));
    filtersState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filtersState" }] : /* istanbul ignore next */ []));
    filterValuesState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterValuesState" }] : /* istanbul ignore next */ []));
    showActiveFiltersState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showActiveFiltersState" }] : /* istanbul ignore next */ []));
    /** null means every active-filter tag fits; a number is how many fit from the newest end. */
    visibleActiveFilterCountState = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleActiveFilterCountState" }] : /* istanbul ignore next */ []));
    filterSearchValueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterSearchValueState" }] : /* istanbul ignore next */ []));
    expandedFilterIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expandedFilterIdState" }] : /* istanbul ignore next */ []));
    queryValueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "queryValueState" }] : /* istanbul ignore next */ []));
    savedViewsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "savedViewsState" }] : /* istanbul ignore next */ []));
    activeSavedViewIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeSavedViewIdState" }] : /* istanbul ignore next */ []));
    displayModeState = signal('compact', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayModeState" }] : /* istanbul ignore next */ []));
    groupByOptionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "groupByOptionsState" }] : /* istanbul ignore next */ []));
    groupByState = signal('none', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "groupByState" }] : /* istanbul ignore next */ []));
    sortOptionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sortOptionsState" }] : /* istanbul ignore next */ []));
    sortByState = signal('none', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sortByState" }] : /* istanbul ignore next */ []));
    sortDirectionState = signal('asc', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sortDirectionState" }] : /* istanbul ignore next */ []));
    thenByState = signal('none', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "thenByState" }] : /* istanbul ignore next */ []));
    thenByDirectionState = signal('asc', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "thenByDirectionState" }] : /* istanbul ignore next */ []));
    columnOptionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnOptionsState" }] : /* istanbul ignore next */ []));
    visibleColumnIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleColumnIdsState" }] : /* istanbul ignore next */ []));
    pinnedColumnIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pinnedColumnIdsState" }] : /* istanbul ignore next */ []));
    columnSearchValueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnSearchValueState" }] : /* istanbul ignore next */ []));
    filterPopoverOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverOpenState" }] : /* istanbul ignore next */ []));
    propertiesPopoverOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverOpenState" }] : /* istanbul ignore next */ []));
    filterPopoverLeftState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverLeftState" }] : /* istanbul ignore next */ []));
    filterPopoverTopState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverTopState" }] : /* istanbul ignore next */ []));
    filterPopoverBottomState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverBottomState" }] : /* istanbul ignore next */ []));
    filterPopoverWidthState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverWidthState" }] : /* istanbul ignore next */ []));
    filterPopoverMaxHeightState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverMaxHeightState" }] : /* istanbul ignore next */ []));
    filterPopoverPlacementState = signal('bottom', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterPopoverPlacementState" }] : /* istanbul ignore next */ []));
    propertiesPopoverLeftState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverLeftState" }] : /* istanbul ignore next */ []));
    propertiesPopoverTopState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverTopState" }] : /* istanbul ignore next */ []));
    propertiesPopoverBottomState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverBottomState" }] : /* istanbul ignore next */ []));
    propertiesPopoverWidthState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverWidthState" }] : /* istanbul ignore next */ []));
    propertiesPopoverMaxHeightState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverMaxHeightState" }] : /* istanbul ignore next */ []));
    propertiesPopoverPlacementState = signal('bottom', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "propertiesPopoverPlacementState" }] : /* istanbul ignore next */ []));
    tagFilterIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagFilterIdState" }] : /* istanbul ignore next */ []));
    tagFilterMetricsState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagFilterMetricsState" }] : /* istanbul ignore next */ []));
    tagFilterAnchor;
    tagFilterLockedPlacement;
    resizeObserver;
    // Placement is decided once per open; re-syncs keep the side so an open
    // popover never flips — growing content scrolls inside it instead.
    filterPopoverLockedPlacement;
    propertiesPopoverLockedPlacement;
    activeFiltersRegionEl;
    activeFilterMeasureFrame;
    activeFilterTagsChange = effect(() => {
        this.activeFilterTags$();
        // Re-measure after the +N pill enters or leaves the row: it takes row
        // space itself, which can wrap one more tag. The pass converges because
        // the signal only notifies on real changes.
        this.visibleActiveFilterCountState();
        this.scheduleActiveFilterMeasure();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeFilterTagsChange" }] : /* istanbul ignore next */ []));
    filterTriggerRef;
    propertiesTriggerRef;
    filterPopoverRef;
    filterSearchRef;
    propertiesPopoverRef;
    tagFilterPopoverRef;
    // The expansion panel and the tag popover render the same editor template,
    // so the instance is identified by which surface contains it. The two lists
    // come from one query and stay index-aligned.
    columnFilterEditors;
    columnFilterEditorHosts;
    // Both lists follow activeFilterTagsRow$ order, so one index resolves the
    // tag to focus and the element to anchor against.
    activeFilterTags;
    activeFilterTagHosts;
    set activeFiltersRegion(ref) {
        const next = ref?.nativeElement;
        if (this.activeFiltersRegionEl === next) {
            return;
        }
        if (this.activeFiltersRegionEl) {
            this.resizeObserver?.unobserve(this.activeFiltersRegionEl);
        }
        this.activeFiltersRegionEl = next;
        if (next) {
            this.resizeObserver?.observe(next);
            this.scheduleActiveFilterMeasure();
        }
        else {
            this.visibleActiveFilterCountState.set(null);
        }
    }
    queryAriaLabel = 'Search query';
    filterSearchAriaLabel = 'Search filters';
    columnSearchAriaLabel = 'Search columns';
    set mode(value) {
        const next = value === 'query' ? 'query' : 'filters';
        this.modeState.set(next);
        if (next === 'query') {
            // An owner can switch modes without going through applyMode, and query
            // mode removes the tag row this surface is anchored to.
            this.closeTagFilterPopover(false);
        }
    }
    set quickFilters(value) {
        this.quickFiltersState.set(value ?? []);
    }
    set selectedQuickFilterId(value) {
        this.selectedQuickFilterIdState.set(value);
    }
    set toggleFilters(value) {
        this.toggleFiltersState.set(value ?? []);
    }
    set selectedToggleFilterIds(value) {
        this.selectedToggleFilterIdsState.set(value ?? []);
    }
    set filters(value) {
        const next = value ?? [];
        for (const filter of next) {
            assertCxColumnFilterDefinition(filter.filter);
        }
        this.filtersState.set(next);
        const expandedFilterId = this.expandedFilterIdState();
        if (expandedFilterId &&
            !next.some(filter => filter.id === expandedFilterId)) {
            this.expandedFilterIdState.set(undefined);
        }
        const tagFilterId = this.tagFilterIdState();
        if (tagFilterId && !next.some(filter => filter.id === tagFilterId)) {
            this.closeTagFilterPopover(false);
        }
    }
    set filterValues(value) {
        this.filterValuesState.set({ ...(value ?? {}) });
    }
    set showActiveFilters(value) {
        this.showActiveFiltersState.set(value !== false);
        if (value === false) {
            this.closeTagFilterPopover(false);
        }
    }
    set queryValue(value) {
        this.queryValueState.set(value ?? '');
    }
    set savedViews(value) {
        this.savedViewsState.set(value ?? []);
    }
    set displayMode(value) {
        this.displayModeState.set(value === 'comfortable' ? 'comfortable' : 'compact');
    }
    set groupByOptions(value) {
        this.groupByOptionsState.set(value ?? []);
    }
    set groupBy(value) {
        this.groupByState.set(value?.trim() || 'none');
    }
    set sortOptions(value) {
        this.sortOptionsState.set(value ?? []);
    }
    set sortBy(value) {
        this.sortByState.set(value ?? 'none');
    }
    set sortDirection(value) {
        this.sortDirectionState.set(value === 'desc' ? 'desc' : 'asc');
    }
    set thenBy(value) {
        this.thenByState.set(value ?? 'none');
    }
    set thenByDirection(value) {
        this.thenByDirectionState.set(value === 'desc' ? 'desc' : 'asc');
    }
    set columnOptions(value) {
        this.columnOptionsState.set(value ?? []);
    }
    set visibleColumnIds(value) {
        this.visibleColumnIdsState.set(value ?? []);
    }
    set pinnedColumnIds(value) {
        this.pinnedColumnIdsState.set(value ?? []);
    }
    modeChange = new EventEmitter();
    selectedQuickFilterIdChange = new EventEmitter();
    selectedToggleFilterIdsChange = new EventEmitter();
    filterValuesChange = new EventEmitter();
    filterQueryChange = new EventEmitter();
    filterLoadMore = new EventEmitter();
    queryValueChange = new EventEmitter();
    savedViewSelect = new EventEmitter();
    activeSavedViewIdChange = new EventEmitter();
    displayModeChange = new EventEmitter();
    groupByChange = new EventEmitter();
    sortByChange = new EventEmitter();
    sortDirectionChange = new EventEmitter();
    thenByChange = new EventEmitter();
    thenByDirectionChange = new EventEmitter();
    visibleColumnIdsChange = new EventEmitter();
    pinnedColumnIdsChange = new EventEmitter();
    filterPopoverOpenChange = new EventEmitter();
    exportTable = new EventEmitter();
    resetTable = new EventEmitter();
    mode$ = this.modeState.asReadonly();
    quickFilters$ = this.quickFiltersState.asReadonly();
    selectedQuickFilterId$ = this.selectedQuickFilterIdState.asReadonly();
    toggleFilters$ = this.toggleFiltersState.asReadonly();
    selectedToggleFilterIds$ = this.selectedToggleFilterIdsState.asReadonly();
    filters$ = this.filtersState.asReadonly();
    filterSearchValue$ = this.filterSearchValueState.asReadonly();
    queryValue$ = this.queryValueState.asReadonly();
    savedViews$ = this.savedViewsState.asReadonly();
    activeSavedViewId$ = this.activeSavedViewIdState.asReadonly();
    displayMode$ = this.displayModeState.asReadonly();
    groupByOptions$ = this.groupByOptionsState.asReadonly();
    groupBy$ = this.groupByState.asReadonly();
    sortOptions$ = this.sortOptionsState.asReadonly();
    sortBy$ = this.sortByState.asReadonly();
    sortDirection$ = this.sortDirectionState.asReadonly();
    thenBy$ = this.thenByState.asReadonly();
    thenByDirection$ = this.thenByDirectionState.asReadonly();
    columnOptions$ = this.columnOptionsState.asReadonly();
    visibleColumnIds$ = this.visibleColumnIdsState.asReadonly();
    pinnedColumnIds$ = this.pinnedColumnIdsState.asReadonly();
    columnSearchValue$ = this.columnSearchValueState.asReadonly();
    filterPopoverOpen$ = this.filterPopoverOpenState.asReadonly();
    propertiesPopoverOpen$ = this.propertiesPopoverOpenState.asReadonly();
    filterPopoverLeft$ = this.filterPopoverLeftState.asReadonly();
    filterPopoverTop$ = this.filterPopoverTopState.asReadonly();
    filterPopoverBottom$ = this.filterPopoverBottomState.asReadonly();
    filterPopoverWidth$ = this.filterPopoverWidthState.asReadonly();
    filterPopoverMaxHeight$ = this.filterPopoverMaxHeightState.asReadonly();
    filterPopoverPlacement$ = this.filterPopoverPlacementState.asReadonly();
    propertiesPopoverLeft$ = this.propertiesPopoverLeftState.asReadonly();
    propertiesPopoverTop$ = this.propertiesPopoverTopState.asReadonly();
    propertiesPopoverBottom$ = this.propertiesPopoverBottomState.asReadonly();
    propertiesPopoverWidth$ = this.propertiesPopoverWidthState.asReadonly();
    propertiesPopoverMaxHeight$ = this.propertiesPopoverMaxHeightState.asReadonly();
    propertiesPopoverPlacement$ = this.propertiesPopoverPlacementState.asReadonly();
    tagFilterMetrics$ = this.tagFilterMetricsState.asReadonly();
    /**
     * Resolved from the filter list, never from the active tags: clearing the
     * last value removes the tag but must not empty the editor the user is
     * still working in.
     */
    tagFilter$ = computed(() => {
        const filterId = this.tagFilterIdState();
        return filterId
            ? this.filtersState().find(filter => filter.id === filterId)
            : undefined;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagFilter$" }] : /* istanbul ignore next */ []));
    activeFilterCount$ = computed(() => this.filtersState().filter(filter => isCxColumnFilterValueActive(filter.filter, this.filterValuesState()[filter.id])).length, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeFilterCount$" }] : /* istanbul ignore next */ []));
    showActiveFilters$ = this.showActiveFiltersState.asReadonly();
    activeFilterTags$ = computed(() => {
        const values = this.filterValuesState();
        return this.filtersState()
            .filter(filter => isCxColumnFilterValueActive(filter.filter, values[filter.id]))
            .map(filter => ({ id: filter.id, text: filter.label }));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeFilterTags$" }] : /* istanbul ignore next */ []));
    /** Template order for the row-reverse layout: last DOM item lands leftmost. */
    activeFilterTagsRow$ = computed(() => this.activeFilterTags$().slice().reverse(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeFilterTagsRow$" }] : /* istanbul ignore next */ []));
    hiddenActiveFilterCount$ = computed(() => {
        const visibleCount = this.visibleActiveFilterCountState();
        if (visibleCount === null) {
            return 0;
        }
        return Math.max(this.activeFilterTags$().length - visibleCount, 0);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hiddenActiveFilterCount$" }] : /* istanbul ignore next */ []));
    moreActiveFiltersLabel$ = computed(() => {
        const hiddenCount = this.hiddenActiveFilterCount$();
        return hiddenCount === 1 ? 'Show 1 more active filter' : `Show ${hiddenCount} more active filters`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "moreActiveFiltersLabel$" }] : /* istanbul ignore next */ []));
    filterButtonAriaLabel$ = computed(() => {
        const count = this.activeFilterCount$();
        return count === 0 ? 'Open filters' : `Open filters, ${count} active`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterButtonAriaLabel$" }] : /* istanbul ignore next */ []));
    filteredFilters$ = computed(() => {
        const query = this.filterSearchValueState().trim().toLocaleLowerCase();
        const filters = this.filtersState();
        if (!query) {
            return filters;
        }
        return filters.filter(filter => filter.label.toLocaleLowerCase().includes(query));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filteredFilters$" }] : /* istanbul ignore next */ []));
    filteredColumnOptions$ = computed(() => {
        const query = this.columnSearchValueState().trim().toLowerCase();
        const options = this.columnOptionsState();
        if (!query) {
            return options;
        }
        return options.filter(option => option.label.toLowerCase().includes(query));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filteredColumnOptions$" }] : /* istanbul ignore next */ []));
    hasGroupByControls$ = computed(() => this.groupByOptionsState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasGroupByControls$" }] : /* istanbul ignore next */ []));
    groupByDropdownOptions$ = computed(() => this.groupByOptionsState().map(option => ({
        id: option.id,
        label: option.label ?? option.id,
        disabled: option.disabled,
    })), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "groupByDropdownOptions$" }] : /* istanbul ignore next */ []));
    hasSortControls$ = computed(() => this.sortOptionsState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasSortControls$" }] : /* istanbul ignore next */ []));
    hasThenByControls$ = computed(() => {
        const sortBy = this.sortByState();
        return this.sortOptionsState().length > 0 && sortBy !== undefined && sortBy !== 'none';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasThenByControls$" }] : /* istanbul ignore next */ []));
    hasColumnControls$ = computed(() => this.columnOptionsState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasColumnControls$" }] : /* istanbul ignore next */ []));
    resolvedSavedViews$ = computed(() => this.savedViewsState().map(item => {
        const type = item.type ?? 'choice';
        const selectable = type === 'choice';
        const active = selectable && this.activeSavedViewIdState() === item.id;
        return {
            ...item,
            type,
            selected: selectable ? active : undefined,
            appendIcon: active ? 'check' : undefined,
        };
    }), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resolvedSavedViews$" }] : /* istanbul ignore next */ []));
    savedViewIcon$ = computed(() => this.activeSavedViewIdState() ? 'saved-view-on' : 'saved-view', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "savedViewIcon$" }] : /* istanbul ignore next */ []));
    overflowItems$ = computed(() => {
        const switchLabel = this.modeState() === 'filters' ? 'Switch to query mode' : 'Switch to filter mode';
        const switchIcon = this.modeState() === 'filters' ? 'query' : 'filters';
        return [
            { id: 'switch-mode', label: switchLabel, prependIcon: switchIcon },
            { id: 'export-table', label: 'Export table', prependIcon: 'export' },
            { id: 'reset-table', label: 'Reset table', prependIcon: 'reset', dividerBefore: true },
        ];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overflowItems$" }] : /* istanbul ignore next */ []));
    displayOptions = DISPLAY_OPTIONS;
    ngAfterViewInit() {
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        this.resizeObserver = new ResizeObserver(() => {
            if (this.filterPopoverOpenState()) {
                this.syncFilterPopoverMetrics();
            }
            if (this.propertiesPopoverOpenState()) {
                this.syncPropertiesPopoverMetrics();
            }
            if (this.tagFilterIdState()) {
                this.syncTagFilterMetrics();
            }
            if (this.activeFiltersRegionEl) {
                this.scheduleActiveFilterMeasure();
            }
        });
        const filterTrigger = this.filterTriggerRef?.nativeElement;
        if (filterTrigger) {
            this.resizeObserver.observe(filterTrigger);
        }
        const propertiesTrigger = this.propertiesTriggerRef?.nativeElement;
        if (propertiesTrigger) {
            this.resizeObserver.observe(propertiesTrigger);
        }
        if (this.activeFiltersRegionEl) {
            this.resizeObserver.observe(this.activeFiltersRegionEl);
            this.scheduleActiveFilterMeasure();
        }
    }
    ngOnDestroy() {
        this.resizeObserver?.disconnect();
        if (this.activeFilterMeasureFrame !== undefined && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.activeFilterMeasureFrame);
        }
    }
    onQuickFilterSelect(value) {
        if (!value) {
            return;
        }
        this.selectedQuickFilterIdState.set(value);
        this.selectedQuickFilterIdChange.emit(value);
        this.invalidateSavedViewSelection();
    }
    onToggleFilterSelect(values) {
        this.selectedToggleFilterIdsState.set(values);
        this.selectedToggleFilterIdsChange.emit(values);
        this.invalidateSavedViewSelection();
    }
    onColumnFilterValueChange(filter, value) {
        const next = withCxColumnFilterValue(this.filterValuesState(), filter.id, filter.filter, value);
        if (next === this.filterValuesState()) {
            return;
        }
        this.filterValuesState.set(next);
        this.filterValuesChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    onFilterQueryChange(columnId, query) {
        this.filterQueryChange.emit({ columnId, query });
    }
    onFilterLoadMore(columnId) {
        this.filterLoadMore.emit({ columnId });
    }
    filterValue(filterId) {
        return this.filterValuesState()[filterId];
    }
    isFilterActive(filter) {
        return isCxColumnFilterValueActive(filter.filter, this.filterValuesState()[filter.id]);
    }
    isFilterExpanded(filterId) {
        return this.expandedFilterIdState() === filterId;
    }
    onFilterSearchValueChange(value) {
        this.filterSearchValueState.set(value);
    }
    onFilterExpandedChange(filterId, expanded) {
        this.expandedFilterIdState.set(expanded ? filterId : undefined);
        if (expanded) {
            this.scheduleExpandedFilterReveal(filterId);
        }
    }
    /**
     * The popover keeps its position when content grows, so an editor expanding
     * near the bottom would otherwise open below the popover's fold. Follow the
     * panel briefly while its editor renders and settles, keeping it in view.
     */
    scheduleExpandedFilterReveal(filterId) {
        if (typeof requestAnimationFrame === 'undefined' || typeof ResizeObserver === 'undefined') {
            return;
        }
        requestAnimationFrame(() => {
            if (this.expandedFilterIdState() !== filterId) {
                return;
            }
            const panel = this.filterPopoverRef
                ?.surfaceElement()
                ?.querySelector(`[data-cx-filter-panel="${CSS.escape(filterId)}"]`);
            if (!panel) {
                return;
            }
            const reveal = () => panel.scrollIntoView({ block: 'nearest' });
            reveal();
            const observer = new ResizeObserver(() => {
                if (this.expandedFilterIdState() === filterId) {
                    reveal();
                }
            });
            observer.observe(panel);
            setTimeout(() => observer.disconnect(), 500);
        });
    }
    clearFilter(filter) {
        this.onColumnFilterValueChange(filter, undefined);
    }
    isActiveFilterTagHidden(rowIndex) {
        // Row order is reversed, so the wrapped (hidden) tags are the last items.
        return rowIndex >= this.activeFilterTags$().length - this.hiddenActiveFilterCount$();
    }
    onActiveFilterDismiss(filterId) {
        const filter = this.filtersState().find(candidate => candidate.id === filterId);
        if (filter) {
            this.clearFilter(filter);
        }
    }
    isTagFilterOpen(filterId) {
        return this.tagFilterIdState() === filterId;
    }
    activeFilterTagAriaLabel(label) {
        return `Open ${label} filter`;
    }
    /**
     * The tag opens the same editor the column header and the filter list use;
     * only the surface around it differs.
     */
    onActiveFilterTagPressed(filterId) {
        if (this.tagFilterIdState() === filterId) {
            this.closeTagFilterPopover();
            return;
        }
        const filter = this.filtersState().find(candidate => candidate.id === filterId);
        const anchor = this.activeFilterTagHost(filterId);
        if (!filter || !anchor) {
            return;
        }
        this.closeFilterPopover(false);
        this.propertiesPopoverOpenState.set(false);
        this.tagFilterAnchor = anchor;
        // Fresh open: re-pick the side, then keep it for the whole session.
        this.tagFilterLockedPlacement = undefined;
        this.tagFilterIdState.set(filterId);
        this.syncTagFilterMetrics();
        this.filterPopoverOpenChange.emit(true);
        this.scheduleTagFilterFocus(filterId);
    }
    closeTagFilterPopover(restoreFocus = true) {
        const filterId = this.tagFilterIdState();
        if (!filterId) {
            return;
        }
        this.tagFilterIdState.set(undefined);
        this.tagFilterMetricsState.set(undefined);
        this.tagFilterAnchor = undefined;
        this.tagFilterLockedPlacement = undefined;
        this.filterPopoverOpenChange.emit(false);
        if (!restoreFocus) {
            return;
        }
        queueMicrotask(() => {
            const index = this.activeFilterTagIndex(filterId);
            const tag = index < 0 ? undefined : this.activeFilterTags?.get(index);
            if (tag) {
                tag.focus();
                return;
            }
            // Clearing the last value removes the tag that opened this surface, so
            // focus lands on the filter button instead of nothing.
            this.filterTriggerRef?.nativeElement.querySelector('button')?.focus();
        });
    }
    activeFilterTagIndex(filterId) {
        return this.activeFilterTagsRow$().findIndex(tag => tag.id === filterId);
    }
    activeFilterTagHost(filterId) {
        const index = this.activeFilterTagIndex(filterId);
        return index < 0
            ? undefined
            : this.activeFilterTagHosts?.get(index)?.nativeElement;
    }
    onMoreActiveFiltersPressed() {
        if (!this.filterPopoverOpenState()) {
            this.toggleFilterPopover();
        }
    }
    clearAllFilters() {
        if (this.activeFilterCount$() === 0) {
            return;
        }
        this.filterValuesState.set({});
        this.filterValuesChange.emit({});
        this.invalidateSavedViewSelection();
    }
    onQueryChange(value) {
        this.queryValueState.set(value);
        this.queryValueChange.emit(value);
        this.invalidateSavedViewSelection();
    }
    onSavedViewSelect(itemId) {
        const item = this.savedViewsState().find(candidate => candidate.id === itemId);
        const nextActiveId = item?.type === 'action' ? undefined : itemId;
        this.activeSavedViewIdState.set(nextActiveId);
        this.activeSavedViewIdChange.emit(nextActiveId);
        this.savedViewSelect.emit(itemId);
        this.closeFilterPopover(false);
        this.propertiesPopoverOpenState.set(false);
    }
    onSavedViewsOpenChange(open) {
        if (!open) {
            return;
        }
        this.closeFilterPopover(false);
        this.propertiesPopoverOpenState.set(false);
    }
    onOverflowItemSelect(itemId) {
        if (itemId === 'export-table') {
            this.exportTable.emit();
            return;
        }
        if (itemId === 'switch-mode') {
            this.applyMode(this.modeState() === 'filters' ? 'query' : 'filters');
            return;
        }
        if (itemId === 'reset-table') {
            this.resetTable.emit();
            this.invalidateSavedViewSelection();
        }
    }
    onOverflowOpenChange(open) {
        if (!open) {
            return;
        }
        this.closeFilterPopover(false);
        this.propertiesPopoverOpenState.set(false);
    }
    onDisplayModeSelect(value) {
        const next = value === 'comfortable' ? 'comfortable' : 'compact';
        this.displayModeState.set(next);
        this.displayModeChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    onGroupBySelect(value) {
        const next = value?.trim() || 'none';
        this.groupByState.set(next);
        this.groupByChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    onSortByValueChange(value) {
        const next = value ?? 'none';
        this.sortByState.set(next);
        this.sortByChange.emit(next);
        if (next === 'none') {
            this.thenByState.set('none');
            this.thenByChange.emit('none');
        }
        this.invalidateSavedViewSelection();
    }
    onThenByValueChange(value) {
        const next = value ?? 'none';
        this.thenByState.set(next);
        this.thenByChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    toggleSortDirection() {
        if (!this.hasActivePrimarySort()) {
            return;
        }
        const next = this.sortDirectionState() === 'desc' ? 'asc' : 'desc';
        this.sortDirectionState.set(next);
        this.sortDirectionChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    toggleThenByDirection() {
        if (!this.hasActiveSecondarySort()) {
            return;
        }
        const next = this.thenByDirectionState() === 'desc' ? 'asc' : 'desc';
        this.thenByDirectionState.set(next);
        this.thenByDirectionChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    onColumnSearchValueChange(value) {
        this.columnSearchValueState.set(value);
    }
    onColumnOptionSelect(columnId) {
        const columnIds = this.columnOptionsState().map(option => option.id);
        const visibleIds = new Set(this.visibleColumnIdsState().length === 0 ? columnIds : this.visibleColumnIdsState());
        if (visibleIds.has(columnId)) {
            visibleIds.delete(columnId);
        }
        else {
            visibleIds.add(columnId);
        }
        const next = columnIds.filter(id => visibleIds.has(id));
        this.visibleColumnIdsState.set(next);
        this.visibleColumnIdsChange.emit(next);
        const nextPinned = this.pinnedColumnIdsState().filter(id => next.includes(id));
        if (nextPinned.length !== this.pinnedColumnIdsState().length) {
            this.pinnedColumnIdsState.set(nextPinned);
            this.pinnedColumnIdsChange.emit(nextPinned);
        }
        this.invalidateSavedViewSelection();
    }
    resetColumns() {
        const next = this.columnOptionsState().map(option => option.id);
        this.visibleColumnIdsState.set(next);
        this.visibleColumnIdsChange.emit(next);
        this.pinnedColumnIdsState.set([]);
        this.pinnedColumnIdsChange.emit([]);
        this.invalidateSavedViewSelection();
    }
    togglePinnedColumn(columnId) {
        if (!this.canPinColumn(columnId)) {
            return;
        }
        const current = this.pinnedColumnIdsState();
        const next = current.includes(columnId)
            ? current.filter(id => id !== columnId)
            : [...current, columnId].slice(0, CX_FILTER_BAR_MAX_PINNED_COLUMNS);
        this.pinnedColumnIdsState.set(next);
        this.pinnedColumnIdsChange.emit(next);
        this.invalidateSavedViewSelection();
    }
    toggleFilterPopover() {
        if (this.modeState() !== 'filters') {
            return;
        }
        this.closeTagFilterPopover(false);
        this.propertiesPopoverOpenState.set(false);
        const next = !this.filterPopoverOpenState();
        if (next) {
            // Fresh open: re-pick the side, then keep it for the whole session.
            this.filterPopoverLockedPlacement = undefined;
            this.syncFilterPopoverMetrics();
        }
        this.filterPopoverOpenState.set(next);
        this.filterPopoverOpenChange.emit(next);
        if (next) {
            this.scheduleFilterFocus();
        }
    }
    togglePropertiesPopover() {
        this.closeFilterPopover(false);
        const next = !this.propertiesPopoverOpenState();
        if (next) {
            this.propertiesPopoverLockedPlacement = undefined;
            this.syncPropertiesPopoverMetrics();
        }
        this.propertiesPopoverOpenState.set(next);
    }
    closeFilterPopover(restoreFocus = true) {
        // One filter surface at a time; the tag popover has its own focus restore
        // for the paths where the user dismissed it directly.
        this.closeTagFilterPopover(false);
        if (!this.filterPopoverOpenState()) {
            return;
        }
        this.filterPopoverOpenState.set(false);
        this.filterPopoverOpenChange.emit(false);
        if (restoreFocus) {
            queueMicrotask(() => {
                this.filterTriggerRef?.nativeElement.querySelector('button')?.focus();
            });
        }
    }
    closeFloatingPopovers(restoreFocus = true) {
        const propertiesWasOpen = this.propertiesPopoverOpenState();
        this.closeFilterPopover(restoreFocus && !propertiesWasOpen);
        this.propertiesPopoverOpenState.set(false);
        if (restoreFocus && propertiesWasOpen) {
            queueMicrotask(() => {
                this.propertiesTriggerRef?.nativeElement.querySelector('button')?.focus();
            });
        }
    }
    isColumnVisible(columnId) {
        const visibleColumnIds = this.visibleColumnIdsState();
        return visibleColumnIds.length === 0 || visibleColumnIds.includes(columnId);
    }
    isColumnPinned(columnId) {
        return this.pinnedColumnIdsState().includes(columnId);
    }
    canPinColumn(columnId) {
        const option = this.columnOptionsState().find(candidate => candidate.id === columnId);
        if (option?.pinnable === false || !this.isColumnVisible(columnId)) {
            return false;
        }
        return this.isColumnPinned(columnId) || this.pinnedColumnIdsState().length < CX_FILTER_BAR_MAX_PINNED_COLUMNS;
    }
    directionIcon(direction) {
        return direction === 'desc' ? 'arrow-down' : 'arrow-up';
    }
    directionTooltip(direction) {
        return direction === 'desc'
            ? 'Descending — press for ascending'
            : 'Ascending — press for descending';
    }
    hasActivePrimarySort() {
        const sortBy = this.sortByState();
        return sortBy !== undefined && sortBy !== 'none';
    }
    hasActiveSecondarySort() {
        const thenBy = this.thenByState();
        return thenBy !== undefined && thenBy !== 'none';
    }
    onDocumentPointerDown(event) {
        if (!this.filterPopoverOpenState() &&
            !this.propertiesPopoverOpenState() &&
            !this.tagFilterIdState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node) || !this.pointerTargetIsInsideFilterBar(target)) {
            this.closeFloatingPopovers(false);
        }
    }
    onEscapeKey() {
        if (this.propertiesPopoverOpenState()) {
            this.propertiesPopoverOpenState.set(false);
            return;
        }
        if (this.tagFilterIdState()) {
            this.closeTagFilterPopover();
            return;
        }
        if (this.filterPopoverOpenState()) {
            this.closeFilterPopover();
        }
    }
    onWindowResize() {
        if (this.filterPopoverOpenState()) {
            this.syncFilterPopoverMetrics();
        }
        if (this.propertiesPopoverOpenState()) {
            this.syncPropertiesPopoverMetrics();
        }
        if (this.tagFilterIdState()) {
            this.syncTagFilterMetrics();
        }
    }
    applyMode(mode) {
        this.modeState.set(mode);
        this.modeChange.emit(mode);
        this.closeFilterPopover(false);
        this.propertiesPopoverOpenState.set(false);
        this.invalidateSavedViewSelection();
    }
    invalidateSavedViewSelection() {
        if (!this.activeSavedViewIdState()) {
            return;
        }
        this.activeSavedViewIdState.set(undefined);
        this.activeSavedViewIdChange.emit(undefined);
    }
    pointerTargetIsInsideFilterBar(target) {
        if (this.host.nativeElement.contains(target)) {
            return true;
        }
        if (this.filterPopoverRef?.surfaceElement()?.contains(target)) {
            return true;
        }
        if (this.propertiesPopoverRef?.surfaceElement()?.contains(target)) {
            return true;
        }
        if (this.tagFilterPopoverRef?.surfaceElement()?.contains(target)) {
            return true;
        }
        const targetElement = target instanceof Element ? target : target.parentElement;
        return !!targetElement?.closest('[data-cx-popover-surface]');
    }
    syncFilterPopoverMetrics() {
        const trigger = this.filterTriggerRef?.nativeElement;
        if (!trigger || typeof window === 'undefined') {
            return;
        }
        const rect = trigger.getBoundingClientRect();
        const estimatedHeight = Math.min(Math.max(this.filtersState().length, 1) * 72 + 80, 620);
        const surface = measureCxFloatingSurface({
            triggerRect: rect,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            width: 560,
            estimatedHeight,
            align: 'start',
            lockedPlacement: this.filterPopoverLockedPlacement,
        });
        this.filterPopoverLockedPlacement = surface.placement;
        this.filterPopoverWidthState.set(surface.width);
        this.filterPopoverLeftState.set(surface.left);
        this.filterPopoverTopState.set(surface.top);
        this.filterPopoverBottomState.set(surface.bottom);
        this.filterPopoverMaxHeightState.set(surface.maxHeight);
        this.filterPopoverPlacementState.set(surface.placement);
    }
    syncTagFilterMetrics() {
        const anchor = this.tagFilterAnchor;
        const filter = this.tagFilter$();
        if (!anchor || !filter || typeof window === 'undefined') {
            return;
        }
        // A detached anchor measures as a zero rect, which would throw the surface
        // into the viewport corner. Keep the position it was opened with instead.
        if (!anchor.isConnected) {
            return;
        }
        const surface = measureCxFloatingSurface({
            triggerRect: anchor.getBoundingClientRect(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            width: CX_FILTER_BAR_TAG_POPOVER_WIDTH,
            // One island of padding around the editor.
            estimatedHeight: estimateCxColumnFilterHeight(filter.filter) + 16,
            minWidth: 240,
            align: 'start',
            gap: 4,
            lockedPlacement: this.tagFilterLockedPlacement,
        });
        this.tagFilterLockedPlacement = surface.placement;
        this.tagFilterMetricsState.set({
            left: surface.left,
            top: surface.top,
            bottom: surface.bottom,
            width: surface.width,
            maxHeight: surface.maxHeight,
            placement: surface.placement,
        });
    }
    scheduleTagFilterFocus(filterId, attempt = 0) {
        if (typeof requestAnimationFrame === 'undefined') {
            queueMicrotask(() => this.focusTagFilterEditor(filterId, attempt));
            return;
        }
        requestAnimationFrame(() => this.focusTagFilterEditor(filterId, attempt));
    }
    /**
     * The surface is portaled after render, so the editor may not exist on the
     * first frame; retry a bounded number of times, as the column header does.
     */
    focusTagFilterEditor(filterId, attempt) {
        if (this.tagFilterIdState() !== filterId) {
            return;
        }
        const surface = this.tagFilterPopoverRef?.surfaceElement();
        this.columnFilterEditorIn(surface)?.focus();
        const activeElement = typeof document === 'undefined' ? undefined : document.activeElement;
        if (activeElement && surface?.contains(activeElement)) {
            return;
        }
        if (attempt >= 12) {
            return;
        }
        this.scheduleTagFilterFocus(filterId, attempt + 1);
    }
    columnFilterEditorIn(surface) {
        if (!surface) {
            return undefined;
        }
        const index = (this.columnFilterEditorHosts?.toArray() ?? []).findIndex(host => surface.contains(host.nativeElement));
        return index < 0 ? undefined : this.columnFilterEditors?.get(index);
    }
    syncPropertiesPopoverMetrics() {
        const trigger = this.propertiesTriggerRef?.nativeElement;
        if (!trigger || typeof window === 'undefined') {
            return;
        }
        const rect = trigger.getBoundingClientRect();
        // 292 covers the fixed sections; 40 is the heading island and its gap.
        const estimatedHeight = Math.min(Math.max(this.columnOptionsState().length, 1) * 32 + 332, 620);
        const surface = measureCxFloatingSurface({
            triggerRect: rect,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            width: 320,
            estimatedHeight,
            align: 'end',
            lockedPlacement: this.propertiesPopoverLockedPlacement,
        });
        this.propertiesPopoverLockedPlacement = surface.placement;
        this.propertiesPopoverWidthState.set(surface.width);
        this.propertiesPopoverLeftState.set(surface.left);
        this.propertiesPopoverTopState.set(surface.top);
        this.propertiesPopoverBottomState.set(surface.bottom);
        this.propertiesPopoverMaxHeightState.set(surface.maxHeight);
        this.propertiesPopoverPlacementState.set(surface.placement);
    }
    scheduleActiveFilterMeasure() {
        if (typeof requestAnimationFrame === 'undefined') {
            return;
        }
        if (this.activeFilterMeasureFrame !== undefined) {
            cancelAnimationFrame(this.activeFilterMeasureFrame);
        }
        this.activeFilterMeasureFrame = requestAnimationFrame(() => {
            this.activeFilterMeasureFrame = undefined;
            this.measureActiveFilterTags();
        });
    }
    /**
     * Counts how many tags wrapped past the first row. Tags stay in normal flow
     * (wrapped rows are clipped by the container), so this read never changes
     * layout and cannot oscillate.
     */
    measureActiveFilterTags() {
        const container = this.activeFiltersRegionEl;
        if (!container) {
            this.visibleActiveFilterCountState.set(null);
            return;
        }
        const tagElements = Array.from(container.querySelectorAll('.cx-filter-bar__active-filter'));
        if (tagElements.length === 0) {
            this.visibleActiveFilterCountState.set(null);
            return;
        }
        // The first row is defined by every child including the +N pill; a tag
        // sitting below it has wrapped even when no tag made the first row.
        const firstRowTop = Math.min(...Array.from(container.children, child => child.offsetTop));
        const rowHeight = tagElements[0].offsetHeight;
        const wrappedCount = tagElements.filter(element => element.offsetTop >= firstRowTop + rowHeight).length;
        if (wrappedCount === 0) {
            this.visibleActiveFilterCountState.set(null);
            return;
        }
        // The pill occupies row space too; without this check a single tag that
        // fits on its own could stay collapsed behind a "+1" forever.
        const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
        const totalWidth = tagElements.reduce((sum, element) => sum + element.offsetWidth, 0) +
            gap * (tagElements.length - 1);
        if (totalWidth <= container.clientWidth) {
            this.visibleActiveFilterCountState.set(null);
            return;
        }
        this.visibleActiveFilterCountState.set(tagElements.length - wrappedCount);
    }
    scheduleFilterFocus() {
        const focusSearch = (attempt = 0) => {
            if (!this.filterPopoverOpenState()) {
                return;
            }
            if (this.filterSearchRef) {
                this.filterSearchRef.focus();
                return;
            }
            if (attempt >= 12 || typeof requestAnimationFrame === 'undefined') {
                return;
            }
            requestAnimationFrame(() => focusSearch(attempt + 1));
        };
        if (typeof requestAnimationFrame === 'undefined') {
            queueMicrotask(() => focusSearch());
            return;
        }
        requestAnimationFrame(() => focusSearch());
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxFilterBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxFilterBarComponent, isStandalone: true, selector: "cx-filter-bar", inputs: { queryAriaLabel: "queryAriaLabel", filterSearchAriaLabel: "filterSearchAriaLabel", columnSearchAriaLabel: "columnSearchAriaLabel", mode: "mode", quickFilters: "quickFilters", selectedQuickFilterId: "selectedQuickFilterId", toggleFilters: "toggleFilters", selectedToggleFilterIds: "selectedToggleFilterIds", filters: "filters", filterValues: "filterValues", showActiveFilters: "showActiveFilters", queryValue: "queryValue", savedViews: "savedViews", displayMode: "displayMode", groupByOptions: "groupByOptions", groupBy: "groupBy", sortOptions: "sortOptions", sortBy: "sortBy", sortDirection: "sortDirection", thenBy: "thenBy", thenByDirection: "thenByDirection", columnOptions: "columnOptions", visibleColumnIds: "visibleColumnIds", pinnedColumnIds: "pinnedColumnIds" }, outputs: { modeChange: "modeChange", selectedQuickFilterIdChange: "selectedQuickFilterIdChange", selectedToggleFilterIdsChange: "selectedToggleFilterIdsChange", filterValuesChange: "filterValuesChange", filterQueryChange: "filterQueryChange", filterLoadMore: "filterLoadMore", queryValueChange: "queryValueChange", savedViewSelect: "savedViewSelect", activeSavedViewIdChange: "activeSavedViewIdChange", displayModeChange: "displayModeChange", groupByChange: "groupByChange", sortByChange: "sortByChange", sortDirectionChange: "sortDirectionChange", thenByChange: "thenByChange", thenByDirectionChange: "thenByDirectionChange", visibleColumnIdsChange: "visibleColumnIdsChange", pinnedColumnIdsChange: "pinnedColumnIdsChange", filterPopoverOpenChange: "filterPopoverOpenChange", exportTable: "exportTable", resetTable: "resetTable" }, host: { listeners: { "document:pointerdown": "onDocumentPointerDown($event)", "document:keydown.escape": "onEscapeKey()", "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "filterTriggerRef", first: true, predicate: ["filterTriggerAnchor"], descendants: true, read: ElementRef }, { propertyName: "propertiesTriggerRef", first: true, predicate: ["propertiesTriggerAnchor"], descendants: true, read: ElementRef }, { propertyName: "filterPopoverRef", first: true, predicate: ["filterPopover"], descendants: true }, { propertyName: "filterSearchRef", first: true, predicate: ["filterSearchControl"], descendants: true }, { propertyName: "propertiesPopoverRef", first: true, predicate: ["propertiesPopover"], descendants: true }, { propertyName: "tagFilterPopoverRef", first: true, predicate: ["tagFilterPopover"], descendants: true }, { propertyName: "activeFiltersRegion", first: true, predicate: ["activeFiltersRegion"], descendants: true, read: ElementRef }, { propertyName: "columnFilterEditors", predicate: CxColumnFilterEditorComponent, descendants: true }, { propertyName: "columnFilterEditorHosts", predicate: CxColumnFilterEditorComponent, descendants: true, read: ElementRef }, { propertyName: "activeFilterTags", predicate: ["activeFilterTag"], descendants: true }, { propertyName: "activeFilterTagHosts", predicate: ["activeFilterTag"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div class=\"cx-filter-bar\" [class.cx-filter-bar--query]=\"mode$() === 'query'\">\n  <div class=\"cx-filter-bar__left\">\n    @if (mode$() === 'filters') {\n      @if (filters$().length > 0) {\n        <div class=\"cx-filter-bar__filter-trigger\" #filterTriggerAnchor>\n          <cx-icon-button\n            icon=\"filters\"\n            [ariaLabel]=\"filterButtonAriaLabel$()\"\n            mood=\"default\"\n            [badgeValue]=\"activeFilterCount$() > 0 ? '' : undefined\"\n            (pressed)=\"toggleFilterPopover()\"\n          />\n        </div>\n      }\n\n      @if (quickFilters$().length > 0) {\n        <!-- Quick filters stay small on purpose: they are a compact scope strip, not primary controls. -->\n        <cx-button-group\n          size=\"small\"\n          [availableValues]=\"quickFilters$()\"\n          [value]=\"selectedQuickFilterId$()\"\n          (valueChange)=\"onQuickFilterSelect($event)\"\n        />\n      }\n\n      @if (toggleFilters$().length > 0) {\n        <!-- Same scope strip as the quick filters, so the same small size. -->\n        <cx-toggle-chip-group\n          size=\"small\"\n          selection=\"multiple\"\n          [availableValues]=\"toggleFilters$()\"\n          [selectedValues]=\"selectedToggleFilterIds$()\"\n          (selectedValuesChange)=\"onToggleFilterSelect($event)\"\n        />\n      }\n    } @else {\n      <div class=\"cx-filter-bar__query\">\n        <cx-text-field\n          label=\"\"\n          [ariaLabel]=\"queryAriaLabel\"\n          prependIcon=\"query\"\n          [value]=\"queryValue$()\"\n          (valueChange)=\"onQueryChange($event)\"\n        />\n      </div>\n    }\n  </div>\n\n  @if (mode$() === 'filters' && showActiveFilters$() && activeFilterTags$().length > 0) {\n    <div class=\"cx-filter-bar__active-filters\" #activeFiltersRegion>\n      @if (hiddenActiveFilterCount$() > 0) {\n        <button\n          type=\"button\"\n          class=\"cx-filter-bar__active-filters-more\"\n          [attr.aria-label]=\"moreActiveFiltersLabel$()\"\n          (click)=\"onMoreActiveFiltersPressed()\"\n        >\n          +{{ hiddenActiveFilterCount$() }}\n        </button>\n      }\n      <!-- Reversed on purpose: row-reverse renders DOM order right-to-left, so\n           this keeps the visual order matching the filter list. -->\n      @for (tag of activeFilterTagsRow$(); track tag.id; let index = $index) {\n        <cx-tag\n          #activeFilterTag\n          class=\"cx-filter-bar__active-filter\"\n          [class.cx-filter-bar__active-filter--hidden]=\"isActiveFilterTagHidden(index)\"\n          [text]=\"tag.text\"\n          [interactive]=\"true\"\n          [ariaLabel]=\"activeFilterTagAriaLabel(tag.text)\"\n          [expanded]=\"isTagFilterOpen(tag.id)\"\n          [controls]=\"isTagFilterOpen(tag.id) ? tagFilterDialogId : undefined\"\n          [dismissible]=\"true\"\n          (pressed)=\"onActiveFilterTagPressed(tag.id)\"\n          (dismiss)=\"onActiveFilterDismiss(tag.id)\"\n        />\n      }\n    </div>\n  }\n\n  <div class=\"cx-filter-bar__right\">\n    @if (savedViews$().length > 0) {\n      <cx-menu\n        [presentation]=\"{ kind: 'trigger' }\"\n        heading=\"Saved views\"\n        [items]=\"resolvedSavedViews$()\"\n        (openChange)=\"onSavedViewsOpenChange($event)\"\n        (itemSelect)=\"onSavedViewSelect($event)\"\n      >\n        <cx-icon-button\n          cxMenuTrigger\n          [icon]=\"savedViewIcon$()\"\n          ariaLabel=\"Saved views\" variant=\"transparent\"\n        />\n      </cx-menu>\n    }\n\n    <div class=\"cx-filter-bar__properties-trigger\" #propertiesTriggerAnchor>\n      <cx-icon-button\n        icon=\"properties\"\n        ariaLabel=\"Table properties\" variant=\"transparent\"\n        (pressed)=\"togglePropertiesPopover()\"\n      />\n    </div>\n\n    <cx-menu\n      [presentation]=\"{ kind: 'trigger' }\"\n      [items]=\"overflowItems$()\"\n      (openChange)=\"onOverflowOpenChange($event)\"\n      (itemSelect)=\"onOverflowItemSelect($event)\"\n    >\n      <cx-icon-button\n        cxMenuTrigger\n        icon=\"menu-vertical\"\n        ariaLabel=\"Table actions\" variant=\"transparent\"\n      />\n    </cx-menu>\n  </div>\n\n</div>\n\n<cx-popover\n  #filterPopover\n  [open]=\"filterPopoverOpen$() && mode$() === 'filters'\"\n  [showBackdrop]=\"filterPopoverOpen$() || propertiesPopoverOpen$()\"\n  [heading]=\"'Filters'\"\n  [left]=\"filterPopoverLeft$()\"\n  [top]=\"filterPopoverTop$()\"\n  [bottom]=\"filterPopoverBottom$()\"\n  [width]=\"filterPopoverWidth$()\"\n  [maxHeight]=\"filterPopoverMaxHeight$()\"\n  [placement]=\"filterPopoverPlacement$()\"\n  [role]=\"'dialog'\"\n  ariaLabel=\"Filters\"\n  (backdropPressed)=\"closeFloatingPopovers()\"\n>\n  <div class=\"cx-filter-bar__popover-content\">\n    <cx-text-field\n      #filterSearchControl\n      class=\"cx-filter-bar__filter-search\"\n      label=\"\"\n      [ariaLabel]=\"filterSearchAriaLabel\"\n      placeholder=\"Search columns\"\n      prependIcon=\"search\"\n      [clearable]=\"true\"\n      [value]=\"filterSearchValue$()\"\n      (valueChange)=\"onFilterSearchValueChange($event)\"\n    />\n\n    @if (activeFilterCount$() > 0) {\n      <div class=\"cx-filter-bar__filter-actions\">\n        <span>{{ activeFilterCount$() }} active</span>\n        <button type=\"button\" class=\"cx-filter-bar__filter-clear\" (click)=\"clearAllFilters()\">\n          Clear all\n        </button>\n      </div>\n    }\n\n    <div class=\"cx-filter-bar__filters\">\n      @for (filter of filteredFilters$(); track filter.id) {\n        <cx-expansion-panel\n          class=\"cx-filter-bar__filter-panel\"\n          variant=\"flat\"\n          [attr.data-cx-filter-panel]=\"filter.id\"\n          [heading]=\"filter.label\"\n          [expanded]=\"isFilterExpanded(filter.id)\"\n          (expandedChange)=\"onFilterExpandedChange(filter.id, $event)\"\n        >\n          @if (isFilterActive(filter)) {\n            <button\n              actions\n              type=\"button\"\n              class=\"cx-filter-bar__filter-clear cx-filter-bar__filter-clear--column\"\n              [attr.aria-label]=\"'Clear ' + filter.label + ' filter'\"\n              (click)=\"clearFilter(filter)\"\n            >\n              Clear\n            </button>\n          }\n\n          @if (isFilterExpanded(filter.id)) {\n            <!-- Heading and Clear come from the panel here, so the editor\n                 renders neither; the tag popover has no such chrome. -->\n            <ng-container\n              [ngTemplateOutlet]=\"columnFilterEditor\"\n              [ngTemplateOutletContext]=\"{ filter, label: '', showClear: false }\"\n            />\n          }\n        </cx-expansion-panel>\n      } @empty {\n        <div class=\"cx-filter-bar__filter-empty\" role=\"status\">\n          No matching columns\n        </div>\n      }\n    </div>\n  </div>\n</cx-popover>\n\n<cx-popover\n  #tagFilterPopover\n  [open]=\"tagFilter$() !== undefined && tagFilterMetrics$() !== undefined && mode$() === 'filters' && showActiveFilters$()\"\n  [showBackdrop]=\"true\"\n  [left]=\"tagFilterMetrics$()?.left\"\n  [top]=\"tagFilterMetrics$()?.top\"\n  [bottom]=\"tagFilterMetrics$()?.bottom\"\n  [width]=\"tagFilterMetrics$()?.width\"\n  [maxHeight]=\"tagFilterMetrics$()?.maxHeight\"\n  [placement]=\"tagFilterMetrics$()?.placement\"\n  [surfaceId]=\"tagFilterDialogId\"\n  [role]=\"'dialog'\"\n  [ariaLabel]=\"(tagFilter$()?.label ?? '') + ' filter'\"\n  surfaceVariant=\"grouped\"\n  (backdropPressed)=\"closeTagFilterPopover()\"\n>\n  @if (tagFilter$(); as filter) {\n    <div class=\"cx-filter-bar__tag-filter\">\n      <!-- Same shape as the column header: the editor owns the label and the\n           Clear action because nothing around it does. -->\n      <ng-container\n        [ngTemplateOutlet]=\"columnFilterEditor\"\n        [ngTemplateOutletContext]=\"{ filter, label: filter.label, showClear: true }\"\n      />\n    </div>\n  }\n</cx-popover>\n\n<!-- One editor wiring for every surface in this bar: the definition, the\n     current value and the three outputs can never drift between them. Only\n     the surrounding chrome differs, through label and showClear. -->\n<ng-template #columnFilterEditor let-filter=\"filter\" let-label=\"label\" let-showClear=\"showClear\">\n  <cx-column-filter-editor\n    class=\"cx-filter-bar__filter-editor\"\n    [label]=\"label\"\n    [ariaLabel]=\"filter.label + ' filter'\"\n    [showClearAction]=\"showClear\"\n    [definition]=\"filter.filter\"\n    [value]=\"filterValue(filter.id)\"\n    (valueChange)=\"onColumnFilterValueChange(filter, $event)\"\n    (queryChange)=\"onFilterQueryChange(filter.id, $event)\"\n    (loadMore)=\"onFilterLoadMore(filter.id)\"\n  />\n</ng-template>\n\n<cx-popover\n  #propertiesPopover\n  [open]=\"propertiesPopoverOpen$()\"\n  [showBackdrop]=\"filterPopoverOpen$() || propertiesPopoverOpen$()\"\n  [left]=\"propertiesPopoverLeft$()\"\n  [top]=\"propertiesPopoverTop$()\"\n  [bottom]=\"propertiesPopoverBottom$()\"\n  [width]=\"propertiesPopoverWidth$()\"\n  [maxHeight]=\"propertiesPopoverMaxHeight$()\"\n  [placement]=\"propertiesPopoverPlacement$()\"\n  [heading]=\"'Table properties'\"\n  [role]=\"'dialog'\"\n  ariaLabel=\"Table properties\"\n  surfaceVariant=\"grouped\"\n  (backdropPressed)=\"closeFloatingPopovers()\"\n>\n  <div class=\"cx-filter-bar__popover-content cx-filter-bar__popover-content--properties\">\n    <section class=\"cx-filter-bar__properties-section cx-filter-bar__properties-island\">\n      <cx-option-group label=\"Display\" />\n      <div class=\"cx-filter-bar__properties-section-body\">\n        <cx-button-group\n          class=\"cx-filter-bar__display-toggle\"\n          ariaLabel=\"Display\"\n          [fill]=\"true\"\n          [availableValues]=\"displayOptions\"\n          [value]=\"displayMode$()\"\n          (valueChange)=\"onDisplayModeSelect($event)\"\n        />\n      </div>\n    </section>\n\n    @if (hasGroupByControls$()) {\n      <section class=\"cx-filter-bar__properties-section cx-filter-bar__properties-island\">\n        <cx-option-group label=\"Group by\" />\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <cx-dropdown\n            label=\"\"\n            ariaLabel=\"Group by\"\n            [availableValues]=\"groupByDropdownOptions$()\"\n            [value]=\"groupBy$()\"\n            (valueChange)=\"onGroupBySelect($event)\"\n          />\n        </div>\n      </section>\n    }\n\n    @if (hasSortControls$()) {\n      <div class=\"cx-filter-bar__properties-island\">\n      <section class=\"cx-filter-bar__properties-section\">\n        <cx-option-group label=\"Sort by\" />\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <div class=\"cx-filter-bar__sort-row\">\n            <cx-dropdown\n              class=\"cx-filter-bar__sort-select\"\n              label=\"\"\n              ariaLabel=\"Sort by\"\n              placeholder=\"Select column\"\n              [availableValues]=\"sortOptions$()\"\n              [value]=\"sortBy$()\"\n              (valueChange)=\"onSortByValueChange($event)\"\n            />\n            <cx-tooltip [text]=\"directionTooltip(sortDirection$())\" position=\"top\">\n              <cx-icon-button\n                [icon]=\"directionIcon(sortDirection$())\"\n                ariaLabel=\"Toggle primary sort direction\" variant=\"transparent\"\n                [disabled]=\"!hasActivePrimarySort()\"\n                (pressed)=\"toggleSortDirection()\"\n              />\n            </cx-tooltip>\n          </div>\n        </div>\n      </section>\n\n      @if (hasThenByControls$()) {\n      <section class=\"cx-filter-bar__properties-section\">\n        <cx-option-group label=\"Then by\" />\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <div class=\"cx-filter-bar__sort-row\">\n            <cx-dropdown\n              class=\"cx-filter-bar__sort-select\"\n              label=\"\"\n              ariaLabel=\"Then by\"\n              placeholder=\"Select column\"\n              [availableValues]=\"sortOptions$()\"\n              [value]=\"thenBy$()\"\n              (valueChange)=\"onThenByValueChange($event)\"\n            />\n            <cx-tooltip [text]=\"directionTooltip(thenByDirection$())\" position=\"top\">\n              <cx-icon-button\n                [icon]=\"directionIcon(thenByDirection$())\"\n                ariaLabel=\"Toggle secondary sort direction\" variant=\"transparent\"\n                [disabled]=\"!hasActiveSecondarySort()\"\n                (pressed)=\"toggleThenByDirection()\"\n              />\n            </cx-tooltip>\n          </div>\n        </div>\n      </section>\n      }\n      </div>\n    }\n\n    @if (hasColumnControls$()) {\n      <section class=\"cx-filter-bar__properties-section cx-filter-bar__properties-island\">\n        <cx-option-group label=\"Columns\">\n          <button\n            actions\n            type=\"button\"\n            class=\"cx-filter-bar__properties-link\"\n            (click)=\"resetColumns()\"\n          >\n            Reset\n          </button>\n        </cx-option-group>\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <cx-text-field\n            label=\"\"\n            [ariaLabel]=\"columnSearchAriaLabel\"\n            prependIcon=\"search\"\n            [value]=\"columnSearchValue$()\"\n            (valueChange)=\"onColumnSearchValueChange($event)\"\n          />\n\n          <div class=\"cx-filter-bar__column-options\">\n            @for (column of filteredColumnOptions$(); track column.id) {\n              <div class=\"cx-filter-bar__column-row\">\n                <cx-switch\n                  class=\"cx-filter-bar__column-switch\"\n                  [text]=\"column.label\"\n                  [selected]=\"isColumnVisible(column.id)\"\n                  (selectedChange)=\"onColumnOptionSelect(column.id)\"\n                />\n                <!-- Repeated row action in a dense list: one of the few legitimate size=\"small\" cases. -->\n                <cx-toggle-button\n                  [icon]=\"'pin'\"\n                  [iconSelected]=\"'pin-off'\"\n                  [selected]=\"isColumnPinned(column.id)\"\n                  [ariaLabel]=\"isColumnPinned(column.id) ? 'Unpin column' : 'Pin column'\"\n                  size=\"small\"\n                  [disabled]=\"!canPinColumn(column.id)\"\n                  (selectedChange)=\"togglePinnedColumn(column.id)\"\n                />\n              </div>\n            }\n          </div>\n        </div>\n      </section>\n    }\n  </div>\n</cx-popover>\n", styles: [":host{display:block;width:100%}.cx-filter-bar{position:relative;display:flex;width:100%;align-items:center;justify-content:space-between;gap:var(--space-md);box-sizing:border-box}.cx-filter-bar__left,.cx-filter-bar__right{display:flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-filter-bar__left{flex:0 0 auto}.cx-filter-bar--query .cx-filter-bar__left{flex:1 1 auto}.cx-filter-bar__right{flex:0 0 auto}.cx-filter-bar__active-filters{display:flex;min-width:0;flex:1 1 auto;flex-direction:row-reverse;flex-wrap:wrap;align-content:flex-start;align-items:center;gap:var(--space-sm);max-height:var(--icon-size-md);overflow:hidden}.cx-filter-bar__active-filter{max-width:240px}.cx-filter-bar__active-filter--hidden{visibility:hidden;pointer-events:none}.cx-filter-bar__active-filters-more{display:inline-flex;min-height:var(--icon-size-md);flex:0 0 auto;align-items:center;padding:0 var(--space-xs);border:1px solid rgba(0,0,0,0);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--opacity-high);cursor:pointer;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-filter-bar__active-filters-more:hover,.cx-filter-bar__active-filters-more:focus-visible{color:var(--ink)}.cx-filter-bar__active-filters-more:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-filter-bar__filter-trigger,.cx-filter-bar__properties-trigger{flex:0 0 auto}.cx-filter-bar__query{width:min(420px,100%);flex:1 1 320px}.cx-filter-bar__popover-title,.cx-filter-bar__properties-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:1.2}.cx-filter-bar__popover-content{display:flex;flex-direction:column;gap:var(--space-md);padding:var(--space-md) var(--space-sm)}.cx-filter-bar__popover-content--properties{gap:var(--surface-separation);padding:0}.cx-filter-bar__filters{display:flex;flex-direction:column;margin-inline:calc(var(--space-sm)*-1)}.cx-filter-bar__filter-search,.cx-filter-bar__filter-panel,.cx-filter-bar__filter-editor{display:block;width:100%;min-width:0}.cx-filter-bar__filter-panel{border-bottom:var(--line)}.cx-filter-bar__filter-panel:first-child{border-top:var(--line)}.cx-filter-bar__tag-filter{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;padding:var(--space-sm);border-radius:var(--radius-md);background:var(--surface)}.cx-filter-bar__filter-actions{display:flex;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body-sm)}.cx-filter-bar__filter-clear{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit}.cx-filter-bar__filter-clear:hover,.cx-filter-bar__filter-clear:focus-visible{color:var(--ink)}.cx-filter-bar__filter-clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-filter-bar__filter-clear--column{min-height:var(--controller-size);padding:0 var(--space-xs)}.cx-filter-bar__filter-empty{padding:var(--space-md) var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-filter-bar__properties-section{display:flex;flex-direction:column;gap:0}.cx-filter-bar__properties-section-body{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.cx-filter-bar__properties-island{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-md);background:var(--surface)}.cx-filter-bar__display-toggle{align-self:stretch}.cx-filter-bar__sort-row,.cx-filter-bar__column-row{display:flex;align-items:center;gap:var(--space-sm)}.cx-filter-bar__sort-select,.cx-filter-bar__column-switch{min-width:0;flex:1 1 auto}.cx-filter-bar__properties-link{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;cursor:pointer}.cx-filter-bar__properties-link:hover,.cx-filter-bar__properties-link:focus-visible{color:var(--ink)}.cx-filter-bar__properties-link:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-filter-bar__properties-link:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-filter-bar__column-options{display:flex;flex-direction:column;gap:var(--space-sm)}.cx-filter-bar__column-row{min-height:var(--controller-size);justify-content:space-between}"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxButtonGroupComponent, selector: "cx-button-group", inputs: ["ariaLabel", "availableValues", "value", "size", "disabled", "fill"], outputs: ["valueChange"] }, { kind: "component", type: CxColumnFilterEditorComponent, selector: "cx-column-filter-editor", inputs: ["definition", "value", "label", "ariaLabel", "disabled", "loading", "showClearAction"], outputs: ["valueChange", "queryChange", "loadMore"] }, { kind: "component", type: CxExpansionPanelComponent, selector: "cx-expansion-panel", inputs: ["heading", "variant", "expanded"], outputs: ["expandedChange"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxTagComponent, selector: "cx-tag", inputs: ["text", "icon", "color", "outline", "dismissible", "interactive", "ariaLabel", "expanded", "controls"], outputs: ["dismiss", "pressed"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxDropdownComponent, selector: "cx-dropdown", inputs: ["label", "ariaLabel", "name", "transparent", "translations", "placeholder", "size", "optional", "disabled", "loading", "loadingMore", "hasMore", "clearable", "selection", "filterMode", "searchable", "creatable", "hint", "validation", "availableValues", "value", "values"], outputs: ["valueChange", "valuesChange", "create", "focusChange", "clear", "openChange", "queryChange", "loadMore"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxOptionGroupComponent, selector: "cx-option-group", inputs: ["label", "description", "variant"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxSwitchComponent, selector: "cx-switch", inputs: ["text", "ariaLabel", "hint", "size", "disabled", "validation", "selected"], outputs: ["selectedChange", "focusChange"] }, { kind: "component", type: CxToggleButtonComponent, selector: "cx-toggle-button", inputs: ["text", "icon", "iconSelected", "size", "ariaLabel", "disabled", "selected"], outputs: ["selectedChange"] }, { kind: "component", type: CxToggleChipGroupComponent, selector: "cx-toggle-chip-group", inputs: ["availableValues", "selection", "size", "disabled", "allowEmpty", "selectedValues"], outputs: ["selectedValuesChange"] }, { kind: "component", type: CxTooltipComponent, selector: "cx-tooltip", inputs: ["text", "delay", "disabled", "position", "onlyWhenTruncated"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxFilterBarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-filter-bar', imports: [
                        CommonModule,
                        CxButtonGroupComponent,
                        CxColumnFilterEditorComponent,
                        CxExpansionPanelComponent,
                        CxIconButtonComponent,
                        CxTagComponent,
                        CxTextFieldComponent,
                        CxDropdownComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxOptionGroupComponent,
                        CxPopoverComponent,
                        CxSwitchComponent,
                        CxToggleButtonComponent,
                        CxToggleChipGroupComponent,
                        CxTooltipComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-filter-bar\" [class.cx-filter-bar--query]=\"mode$() === 'query'\">\n  <div class=\"cx-filter-bar__left\">\n    @if (mode$() === 'filters') {\n      @if (filters$().length > 0) {\n        <div class=\"cx-filter-bar__filter-trigger\" #filterTriggerAnchor>\n          <cx-icon-button\n            icon=\"filters\"\n            [ariaLabel]=\"filterButtonAriaLabel$()\"\n            mood=\"default\"\n            [badgeValue]=\"activeFilterCount$() > 0 ? '' : undefined\"\n            (pressed)=\"toggleFilterPopover()\"\n          />\n        </div>\n      }\n\n      @if (quickFilters$().length > 0) {\n        <!-- Quick filters stay small on purpose: they are a compact scope strip, not primary controls. -->\n        <cx-button-group\n          size=\"small\"\n          [availableValues]=\"quickFilters$()\"\n          [value]=\"selectedQuickFilterId$()\"\n          (valueChange)=\"onQuickFilterSelect($event)\"\n        />\n      }\n\n      @if (toggleFilters$().length > 0) {\n        <!-- Same scope strip as the quick filters, so the same small size. -->\n        <cx-toggle-chip-group\n          size=\"small\"\n          selection=\"multiple\"\n          [availableValues]=\"toggleFilters$()\"\n          [selectedValues]=\"selectedToggleFilterIds$()\"\n          (selectedValuesChange)=\"onToggleFilterSelect($event)\"\n        />\n      }\n    } @else {\n      <div class=\"cx-filter-bar__query\">\n        <cx-text-field\n          label=\"\"\n          [ariaLabel]=\"queryAriaLabel\"\n          prependIcon=\"query\"\n          [value]=\"queryValue$()\"\n          (valueChange)=\"onQueryChange($event)\"\n        />\n      </div>\n    }\n  </div>\n\n  @if (mode$() === 'filters' && showActiveFilters$() && activeFilterTags$().length > 0) {\n    <div class=\"cx-filter-bar__active-filters\" #activeFiltersRegion>\n      @if (hiddenActiveFilterCount$() > 0) {\n        <button\n          type=\"button\"\n          class=\"cx-filter-bar__active-filters-more\"\n          [attr.aria-label]=\"moreActiveFiltersLabel$()\"\n          (click)=\"onMoreActiveFiltersPressed()\"\n        >\n          +{{ hiddenActiveFilterCount$() }}\n        </button>\n      }\n      <!-- Reversed on purpose: row-reverse renders DOM order right-to-left, so\n           this keeps the visual order matching the filter list. -->\n      @for (tag of activeFilterTagsRow$(); track tag.id; let index = $index) {\n        <cx-tag\n          #activeFilterTag\n          class=\"cx-filter-bar__active-filter\"\n          [class.cx-filter-bar__active-filter--hidden]=\"isActiveFilterTagHidden(index)\"\n          [text]=\"tag.text\"\n          [interactive]=\"true\"\n          [ariaLabel]=\"activeFilterTagAriaLabel(tag.text)\"\n          [expanded]=\"isTagFilterOpen(tag.id)\"\n          [controls]=\"isTagFilterOpen(tag.id) ? tagFilterDialogId : undefined\"\n          [dismissible]=\"true\"\n          (pressed)=\"onActiveFilterTagPressed(tag.id)\"\n          (dismiss)=\"onActiveFilterDismiss(tag.id)\"\n        />\n      }\n    </div>\n  }\n\n  <div class=\"cx-filter-bar__right\">\n    @if (savedViews$().length > 0) {\n      <cx-menu\n        [presentation]=\"{ kind: 'trigger' }\"\n        heading=\"Saved views\"\n        [items]=\"resolvedSavedViews$()\"\n        (openChange)=\"onSavedViewsOpenChange($event)\"\n        (itemSelect)=\"onSavedViewSelect($event)\"\n      >\n        <cx-icon-button\n          cxMenuTrigger\n          [icon]=\"savedViewIcon$()\"\n          ariaLabel=\"Saved views\" variant=\"transparent\"\n        />\n      </cx-menu>\n    }\n\n    <div class=\"cx-filter-bar__properties-trigger\" #propertiesTriggerAnchor>\n      <cx-icon-button\n        icon=\"properties\"\n        ariaLabel=\"Table properties\" variant=\"transparent\"\n        (pressed)=\"togglePropertiesPopover()\"\n      />\n    </div>\n\n    <cx-menu\n      [presentation]=\"{ kind: 'trigger' }\"\n      [items]=\"overflowItems$()\"\n      (openChange)=\"onOverflowOpenChange($event)\"\n      (itemSelect)=\"onOverflowItemSelect($event)\"\n    >\n      <cx-icon-button\n        cxMenuTrigger\n        icon=\"menu-vertical\"\n        ariaLabel=\"Table actions\" variant=\"transparent\"\n      />\n    </cx-menu>\n  </div>\n\n</div>\n\n<cx-popover\n  #filterPopover\n  [open]=\"filterPopoverOpen$() && mode$() === 'filters'\"\n  [showBackdrop]=\"filterPopoverOpen$() || propertiesPopoverOpen$()\"\n  [heading]=\"'Filters'\"\n  [left]=\"filterPopoverLeft$()\"\n  [top]=\"filterPopoverTop$()\"\n  [bottom]=\"filterPopoverBottom$()\"\n  [width]=\"filterPopoverWidth$()\"\n  [maxHeight]=\"filterPopoverMaxHeight$()\"\n  [placement]=\"filterPopoverPlacement$()\"\n  [role]=\"'dialog'\"\n  ariaLabel=\"Filters\"\n  (backdropPressed)=\"closeFloatingPopovers()\"\n>\n  <div class=\"cx-filter-bar__popover-content\">\n    <cx-text-field\n      #filterSearchControl\n      class=\"cx-filter-bar__filter-search\"\n      label=\"\"\n      [ariaLabel]=\"filterSearchAriaLabel\"\n      placeholder=\"Search columns\"\n      prependIcon=\"search\"\n      [clearable]=\"true\"\n      [value]=\"filterSearchValue$()\"\n      (valueChange)=\"onFilterSearchValueChange($event)\"\n    />\n\n    @if (activeFilterCount$() > 0) {\n      <div class=\"cx-filter-bar__filter-actions\">\n        <span>{{ activeFilterCount$() }} active</span>\n        <button type=\"button\" class=\"cx-filter-bar__filter-clear\" (click)=\"clearAllFilters()\">\n          Clear all\n        </button>\n      </div>\n    }\n\n    <div class=\"cx-filter-bar__filters\">\n      @for (filter of filteredFilters$(); track filter.id) {\n        <cx-expansion-panel\n          class=\"cx-filter-bar__filter-panel\"\n          variant=\"flat\"\n          [attr.data-cx-filter-panel]=\"filter.id\"\n          [heading]=\"filter.label\"\n          [expanded]=\"isFilterExpanded(filter.id)\"\n          (expandedChange)=\"onFilterExpandedChange(filter.id, $event)\"\n        >\n          @if (isFilterActive(filter)) {\n            <button\n              actions\n              type=\"button\"\n              class=\"cx-filter-bar__filter-clear cx-filter-bar__filter-clear--column\"\n              [attr.aria-label]=\"'Clear ' + filter.label + ' filter'\"\n              (click)=\"clearFilter(filter)\"\n            >\n              Clear\n            </button>\n          }\n\n          @if (isFilterExpanded(filter.id)) {\n            <!-- Heading and Clear come from the panel here, so the editor\n                 renders neither; the tag popover has no such chrome. -->\n            <ng-container\n              [ngTemplateOutlet]=\"columnFilterEditor\"\n              [ngTemplateOutletContext]=\"{ filter, label: '', showClear: false }\"\n            />\n          }\n        </cx-expansion-panel>\n      } @empty {\n        <div class=\"cx-filter-bar__filter-empty\" role=\"status\">\n          No matching columns\n        </div>\n      }\n    </div>\n  </div>\n</cx-popover>\n\n<cx-popover\n  #tagFilterPopover\n  [open]=\"tagFilter$() !== undefined && tagFilterMetrics$() !== undefined && mode$() === 'filters' && showActiveFilters$()\"\n  [showBackdrop]=\"true\"\n  [left]=\"tagFilterMetrics$()?.left\"\n  [top]=\"tagFilterMetrics$()?.top\"\n  [bottom]=\"tagFilterMetrics$()?.bottom\"\n  [width]=\"tagFilterMetrics$()?.width\"\n  [maxHeight]=\"tagFilterMetrics$()?.maxHeight\"\n  [placement]=\"tagFilterMetrics$()?.placement\"\n  [surfaceId]=\"tagFilterDialogId\"\n  [role]=\"'dialog'\"\n  [ariaLabel]=\"(tagFilter$()?.label ?? '') + ' filter'\"\n  surfaceVariant=\"grouped\"\n  (backdropPressed)=\"closeTagFilterPopover()\"\n>\n  @if (tagFilter$(); as filter) {\n    <div class=\"cx-filter-bar__tag-filter\">\n      <!-- Same shape as the column header: the editor owns the label and the\n           Clear action because nothing around it does. -->\n      <ng-container\n        [ngTemplateOutlet]=\"columnFilterEditor\"\n        [ngTemplateOutletContext]=\"{ filter, label: filter.label, showClear: true }\"\n      />\n    </div>\n  }\n</cx-popover>\n\n<!-- One editor wiring for every surface in this bar: the definition, the\n     current value and the three outputs can never drift between them. Only\n     the surrounding chrome differs, through label and showClear. -->\n<ng-template #columnFilterEditor let-filter=\"filter\" let-label=\"label\" let-showClear=\"showClear\">\n  <cx-column-filter-editor\n    class=\"cx-filter-bar__filter-editor\"\n    [label]=\"label\"\n    [ariaLabel]=\"filter.label + ' filter'\"\n    [showClearAction]=\"showClear\"\n    [definition]=\"filter.filter\"\n    [value]=\"filterValue(filter.id)\"\n    (valueChange)=\"onColumnFilterValueChange(filter, $event)\"\n    (queryChange)=\"onFilterQueryChange(filter.id, $event)\"\n    (loadMore)=\"onFilterLoadMore(filter.id)\"\n  />\n</ng-template>\n\n<cx-popover\n  #propertiesPopover\n  [open]=\"propertiesPopoverOpen$()\"\n  [showBackdrop]=\"filterPopoverOpen$() || propertiesPopoverOpen$()\"\n  [left]=\"propertiesPopoverLeft$()\"\n  [top]=\"propertiesPopoverTop$()\"\n  [bottom]=\"propertiesPopoverBottom$()\"\n  [width]=\"propertiesPopoverWidth$()\"\n  [maxHeight]=\"propertiesPopoverMaxHeight$()\"\n  [placement]=\"propertiesPopoverPlacement$()\"\n  [heading]=\"'Table properties'\"\n  [role]=\"'dialog'\"\n  ariaLabel=\"Table properties\"\n  surfaceVariant=\"grouped\"\n  (backdropPressed)=\"closeFloatingPopovers()\"\n>\n  <div class=\"cx-filter-bar__popover-content cx-filter-bar__popover-content--properties\">\n    <section class=\"cx-filter-bar__properties-section cx-filter-bar__properties-island\">\n      <cx-option-group label=\"Display\" />\n      <div class=\"cx-filter-bar__properties-section-body\">\n        <cx-button-group\n          class=\"cx-filter-bar__display-toggle\"\n          ariaLabel=\"Display\"\n          [fill]=\"true\"\n          [availableValues]=\"displayOptions\"\n          [value]=\"displayMode$()\"\n          (valueChange)=\"onDisplayModeSelect($event)\"\n        />\n      </div>\n    </section>\n\n    @if (hasGroupByControls$()) {\n      <section class=\"cx-filter-bar__properties-section cx-filter-bar__properties-island\">\n        <cx-option-group label=\"Group by\" />\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <cx-dropdown\n            label=\"\"\n            ariaLabel=\"Group by\"\n            [availableValues]=\"groupByDropdownOptions$()\"\n            [value]=\"groupBy$()\"\n            (valueChange)=\"onGroupBySelect($event)\"\n          />\n        </div>\n      </section>\n    }\n\n    @if (hasSortControls$()) {\n      <div class=\"cx-filter-bar__properties-island\">\n      <section class=\"cx-filter-bar__properties-section\">\n        <cx-option-group label=\"Sort by\" />\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <div class=\"cx-filter-bar__sort-row\">\n            <cx-dropdown\n              class=\"cx-filter-bar__sort-select\"\n              label=\"\"\n              ariaLabel=\"Sort by\"\n              placeholder=\"Select column\"\n              [availableValues]=\"sortOptions$()\"\n              [value]=\"sortBy$()\"\n              (valueChange)=\"onSortByValueChange($event)\"\n            />\n            <cx-tooltip [text]=\"directionTooltip(sortDirection$())\" position=\"top\">\n              <cx-icon-button\n                [icon]=\"directionIcon(sortDirection$())\"\n                ariaLabel=\"Toggle primary sort direction\" variant=\"transparent\"\n                [disabled]=\"!hasActivePrimarySort()\"\n                (pressed)=\"toggleSortDirection()\"\n              />\n            </cx-tooltip>\n          </div>\n        </div>\n      </section>\n\n      @if (hasThenByControls$()) {\n      <section class=\"cx-filter-bar__properties-section\">\n        <cx-option-group label=\"Then by\" />\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <div class=\"cx-filter-bar__sort-row\">\n            <cx-dropdown\n              class=\"cx-filter-bar__sort-select\"\n              label=\"\"\n              ariaLabel=\"Then by\"\n              placeholder=\"Select column\"\n              [availableValues]=\"sortOptions$()\"\n              [value]=\"thenBy$()\"\n              (valueChange)=\"onThenByValueChange($event)\"\n            />\n            <cx-tooltip [text]=\"directionTooltip(thenByDirection$())\" position=\"top\">\n              <cx-icon-button\n                [icon]=\"directionIcon(thenByDirection$())\"\n                ariaLabel=\"Toggle secondary sort direction\" variant=\"transparent\"\n                [disabled]=\"!hasActiveSecondarySort()\"\n                (pressed)=\"toggleThenByDirection()\"\n              />\n            </cx-tooltip>\n          </div>\n        </div>\n      </section>\n      }\n      </div>\n    }\n\n    @if (hasColumnControls$()) {\n      <section class=\"cx-filter-bar__properties-section cx-filter-bar__properties-island\">\n        <cx-option-group label=\"Columns\">\n          <button\n            actions\n            type=\"button\"\n            class=\"cx-filter-bar__properties-link\"\n            (click)=\"resetColumns()\"\n          >\n            Reset\n          </button>\n        </cx-option-group>\n        <div class=\"cx-filter-bar__properties-section-body\">\n          <cx-text-field\n            label=\"\"\n            [ariaLabel]=\"columnSearchAriaLabel\"\n            prependIcon=\"search\"\n            [value]=\"columnSearchValue$()\"\n            (valueChange)=\"onColumnSearchValueChange($event)\"\n          />\n\n          <div class=\"cx-filter-bar__column-options\">\n            @for (column of filteredColumnOptions$(); track column.id) {\n              <div class=\"cx-filter-bar__column-row\">\n                <cx-switch\n                  class=\"cx-filter-bar__column-switch\"\n                  [text]=\"column.label\"\n                  [selected]=\"isColumnVisible(column.id)\"\n                  (selectedChange)=\"onColumnOptionSelect(column.id)\"\n                />\n                <!-- Repeated row action in a dense list: one of the few legitimate size=\"small\" cases. -->\n                <cx-toggle-button\n                  [icon]=\"'pin'\"\n                  [iconSelected]=\"'pin-off'\"\n                  [selected]=\"isColumnPinned(column.id)\"\n                  [ariaLabel]=\"isColumnPinned(column.id) ? 'Unpin column' : 'Pin column'\"\n                  size=\"small\"\n                  [disabled]=\"!canPinColumn(column.id)\"\n                  (selectedChange)=\"togglePinnedColumn(column.id)\"\n                />\n              </div>\n            }\n          </div>\n        </div>\n      </section>\n    }\n  </div>\n</cx-popover>\n", styles: [":host{display:block;width:100%}.cx-filter-bar{position:relative;display:flex;width:100%;align-items:center;justify-content:space-between;gap:var(--space-md);box-sizing:border-box}.cx-filter-bar__left,.cx-filter-bar__right{display:flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-filter-bar__left{flex:0 0 auto}.cx-filter-bar--query .cx-filter-bar__left{flex:1 1 auto}.cx-filter-bar__right{flex:0 0 auto}.cx-filter-bar__active-filters{display:flex;min-width:0;flex:1 1 auto;flex-direction:row-reverse;flex-wrap:wrap;align-content:flex-start;align-items:center;gap:var(--space-sm);max-height:var(--icon-size-md);overflow:hidden}.cx-filter-bar__active-filter{max-width:240px}.cx-filter-bar__active-filter--hidden{visibility:hidden;pointer-events:none}.cx-filter-bar__active-filters-more{display:inline-flex;min-height:var(--icon-size-md);flex:0 0 auto;align-items:center;padding:0 var(--space-xs);border:1px solid rgba(0,0,0,0);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--opacity-high);cursor:pointer;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-filter-bar__active-filters-more:hover,.cx-filter-bar__active-filters-more:focus-visible{color:var(--ink)}.cx-filter-bar__active-filters-more:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-filter-bar__filter-trigger,.cx-filter-bar__properties-trigger{flex:0 0 auto}.cx-filter-bar__query{width:min(420px,100%);flex:1 1 320px}.cx-filter-bar__popover-title,.cx-filter-bar__properties-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:1.2}.cx-filter-bar__popover-content{display:flex;flex-direction:column;gap:var(--space-md);padding:var(--space-md) var(--space-sm)}.cx-filter-bar__popover-content--properties{gap:var(--surface-separation);padding:0}.cx-filter-bar__filters{display:flex;flex-direction:column;margin-inline:calc(var(--space-sm)*-1)}.cx-filter-bar__filter-search,.cx-filter-bar__filter-panel,.cx-filter-bar__filter-editor{display:block;width:100%;min-width:0}.cx-filter-bar__filter-panel{border-bottom:var(--line)}.cx-filter-bar__filter-panel:first-child{border-top:var(--line)}.cx-filter-bar__tag-filter{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;padding:var(--space-sm);border-radius:var(--radius-md);background:var(--surface)}.cx-filter-bar__filter-actions{display:flex;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body-sm)}.cx-filter-bar__filter-clear{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit}.cx-filter-bar__filter-clear:hover,.cx-filter-bar__filter-clear:focus-visible{color:var(--ink)}.cx-filter-bar__filter-clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-filter-bar__filter-clear--column{min-height:var(--controller-size);padding:0 var(--space-xs)}.cx-filter-bar__filter-empty{padding:var(--space-md) var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-filter-bar__properties-section{display:flex;flex-direction:column;gap:0}.cx-filter-bar__properties-section-body{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.cx-filter-bar__properties-island{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-md);background:var(--surface)}.cx-filter-bar__display-toggle{align-self:stretch}.cx-filter-bar__sort-row,.cx-filter-bar__column-row{display:flex;align-items:center;gap:var(--space-sm)}.cx-filter-bar__sort-select,.cx-filter-bar__column-switch{min-width:0;flex:1 1 auto}.cx-filter-bar__properties-link{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;cursor:pointer}.cx-filter-bar__properties-link:hover,.cx-filter-bar__properties-link:focus-visible{color:var(--ink)}.cx-filter-bar__properties-link:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-filter-bar__properties-link:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-filter-bar__column-options{display:flex;flex-direction:column;gap:var(--space-sm)}.cx-filter-bar__column-row{min-height:var(--controller-size);justify-content:space-between}"] }]
        }], propDecorators: { filterTriggerRef: [{
                type: ViewChild,
                args: ['filterTriggerAnchor', { read: ElementRef }]
            }], propertiesTriggerRef: [{
                type: ViewChild,
                args: ['propertiesTriggerAnchor', { read: ElementRef }]
            }], filterPopoverRef: [{
                type: ViewChild,
                args: ['filterPopover']
            }], filterSearchRef: [{
                type: ViewChild,
                args: ['filterSearchControl']
            }], propertiesPopoverRef: [{
                type: ViewChild,
                args: ['propertiesPopover']
            }], tagFilterPopoverRef: [{
                type: ViewChild,
                args: ['tagFilterPopover']
            }], columnFilterEditors: [{
                type: ViewChildren,
                args: [CxColumnFilterEditorComponent]
            }], columnFilterEditorHosts: [{
                type: ViewChildren,
                args: [CxColumnFilterEditorComponent, { read: ElementRef }]
            }], activeFilterTags: [{
                type: ViewChildren,
                args: ['activeFilterTag']
            }], activeFilterTagHosts: [{
                type: ViewChildren,
                args: ['activeFilterTag', { read: ElementRef }]
            }], activeFiltersRegion: [{
                type: ViewChild,
                args: ['activeFiltersRegion', { read: ElementRef }]
            }], queryAriaLabel: [{
                type: Input
            }], filterSearchAriaLabel: [{
                type: Input
            }], columnSearchAriaLabel: [{
                type: Input
            }], mode: [{
                type: Input
            }], quickFilters: [{
                type: Input
            }], selectedQuickFilterId: [{
                type: Input
            }], toggleFilters: [{
                type: Input
            }], selectedToggleFilterIds: [{
                type: Input
            }], filters: [{
                type: Input
            }], filterValues: [{
                type: Input
            }], showActiveFilters: [{
                type: Input
            }], queryValue: [{
                type: Input
            }], savedViews: [{
                type: Input
            }], displayMode: [{
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
            }], modeChange: [{
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
            }], savedViewSelect: [{
                type: Output
            }], activeSavedViewIdChange: [{
                type: Output
            }], displayModeChange: [{
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
            }], filterPopoverOpenChange: [{
                type: Output
            }], exportTable: [{
                type: Output
            }], resetTable: [{
                type: Output
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onEscapeKey: [{
                type: HostListener,
                args: ['document:keydown.escape']
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
