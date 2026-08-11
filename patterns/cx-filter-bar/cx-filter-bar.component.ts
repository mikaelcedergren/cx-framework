import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import {
  CxButtonGroupComponent,
  type CxButtonGroupOption,
} from '../../primitives/actions/cx-button-group';
import { CxToggleButtonComponent } from '../../primitives/actions/cx-toggle-button';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxExpansionPanelComponent } from '../../primitives/display/cx-expansion-panel';
import { CxTagComponent } from '../../primitives/display/cx-tag';
import {
  CxToggleChipGroupComponent,
  type CxToggleChipGroupOption,
} from '../../primitives/inputs/cx-toggle-chip-group';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';
import {
  CxDropdownComponent,
  type CxDropdownOption,
} from '../../primitives/inputs/cx-dropdown';
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
} from '../../primitives/overlay/cx-menu';
import { CxOptionGroupComponent } from '../../primitives/overlay/cx-option-group';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover';
import { CxTooltipComponent } from '../../primitives/overlay/cx-tooltip';
import {
  measureCxFloatingSurface,
  type CxFloatingSurfacePlacement,
} from '../../primitives/overlay/floating-surface';
import {
  CxColumnFilterEditorComponent,
  type CxColumnFilterDefinition,
  type CxColumnFilterLoadMoreEvent,
  type CxColumnFilterQueryChangeEvent,
  type CxColumnFilterValue,
  type CxColumnFilterValueMap,
  assertCxColumnFilterDefinition,
  isCxColumnFilterValueActive,
  withCxColumnFilterValue,
} from '../../primitives/data/cx-column-filter-editor';

export type CxFilterBarMode = 'filters' | 'query';
export type CxFilterBarDisplayMode = 'compact' | 'comfortable';
export type CxFilterBarSortDirection = 'asc' | 'desc';

export interface CxFilterBarFilter {
  id: string;
  label: string;
  filter: CxColumnFilterDefinition;
}

export interface CxFilterBarColumnOption {
  id: string;
  label: string;
  pinnable?: boolean;
}

const CX_FILTER_BAR_MAX_PINNED_COLUMNS = 3;
const DISPLAY_OPTIONS: CxButtonGroupOption[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'comfortable', label: 'Comfortable' },
];

@Component({
  selector: 'cx-filter-bar',
  imports: [
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
  ],
  templateUrl: './cx-filter-bar.component.html',
  styleUrl: './cx-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFilterBarComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly modeState = signal<CxFilterBarMode>('filters');
  private readonly quickFiltersState = signal<CxButtonGroupOption[]>([]);
  private readonly selectedQuickFilterIdState = signal<string | undefined>(undefined);
  private readonly toggleFiltersState = signal<CxToggleChipGroupOption[]>([]);
  private readonly selectedToggleFilterIdsState = signal<string[]>([]);
  private readonly filtersState = signal<CxFilterBarFilter[]>([]);
  private readonly filterValuesState = signal<CxColumnFilterValueMap>({});
  private readonly showActiveFiltersState = signal(true);
  /** null means every active-filter tag fits; a number is how many fit from the newest end. */
  private readonly visibleActiveFilterCountState = signal<number | null>(null);
  private readonly filterSearchValueState = signal('');
  private readonly expandedFilterIdState = signal<string | undefined>(
    undefined,
  );
  private readonly queryValueState = signal('');
  private readonly savedViewsState = signal<CxMenuItem[]>([]);
  private readonly activeSavedViewIdState = signal<string | undefined>(undefined);
  private readonly displayModeState = signal<CxFilterBarDisplayMode>('compact');
  private readonly groupByOptionsState = signal<CxButtonGroupOption[]>([]);
  private readonly groupByState = signal('none');
  private readonly sortOptionsState = signal<CxDropdownOption[]>([]);
  private readonly sortByState = signal<string | undefined>('none');
  private readonly sortDirectionState = signal<CxFilterBarSortDirection>('asc');
  private readonly thenByState = signal<string | undefined>('none');
  private readonly thenByDirectionState = signal<CxFilterBarSortDirection>('asc');
  private readonly columnOptionsState = signal<CxFilterBarColumnOption[]>([]);
  private readonly visibleColumnIdsState = signal<string[]>([]);
  private readonly pinnedColumnIdsState = signal<string[]>([]);
  private readonly columnSearchValueState = signal('');
  private readonly filterPopoverOpenState = signal(false);
  private readonly propertiesPopoverOpenState = signal(false);
  private readonly filterPopoverLeftState = signal<number | undefined>(undefined);
  private readonly filterPopoverTopState = signal<number | undefined>(undefined);
  private readonly filterPopoverBottomState = signal<number | undefined>(undefined);
  private readonly filterPopoverWidthState = signal<number | undefined>(undefined);
  private readonly filterPopoverMaxHeightState = signal<number | undefined>(undefined);
  private readonly filterPopoverPlacementState = signal<'bottom' | 'top'>('bottom');
  private readonly propertiesPopoverLeftState = signal<number | undefined>(undefined);
  private readonly propertiesPopoverTopState = signal<number | undefined>(undefined);
  private readonly propertiesPopoverBottomState = signal<number | undefined>(undefined);
  private readonly propertiesPopoverWidthState = signal<number | undefined>(undefined);
  private readonly propertiesPopoverMaxHeightState = signal<number | undefined>(undefined);
  private readonly propertiesPopoverPlacementState = signal<'bottom' | 'top'>('bottom');
  private resizeObserver?: ResizeObserver;
  // Placement is decided once per open; re-syncs keep the side so an open
  // popover never flips — growing content scrolls inside it instead.
  private filterPopoverLockedPlacement?: CxFloatingSurfacePlacement;
  private propertiesPopoverLockedPlacement?: CxFloatingSurfacePlacement;
  private activeFiltersRegionEl?: HTMLElement;
  private activeFilterMeasureFrame?: number;
  private readonly activeFilterTagsChange = effect(() => {
    this.activeFilterTags$();
    // Re-measure after the +N pill enters or leaves the row: it takes row
    // space itself, which can wrap one more tag. The pass converges because
    // the signal only notifies on real changes.
    this.visibleActiveFilterCountState();
    this.scheduleActiveFilterMeasure();
  });

  @ViewChild('filterTriggerAnchor', { read: ElementRef })
  private filterTriggerRef?: ElementRef<HTMLElement>;

  @ViewChild('propertiesTriggerAnchor', { read: ElementRef })
  private propertiesTriggerRef?: ElementRef<HTMLElement>;

  @ViewChild('filterPopover')
  private filterPopoverRef?: CxPopoverComponent;

  @ViewChild('filterSearchControl')
  private filterSearchRef?: CxTextFieldComponent;

  @ViewChild('propertiesPopover')
  private propertiesPopoverRef?: CxPopoverComponent;

  @ViewChild('activeFiltersRegion', { read: ElementRef })
  protected set activeFiltersRegion(ref: ElementRef<HTMLElement> | undefined) {
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
    } else {
      this.visibleActiveFilterCountState.set(null);
    }
  }

  @Input() queryAriaLabel = 'Search query';
  @Input() filterSearchAriaLabel = 'Search filters';
  @Input() columnSearchAriaLabel = 'Search columns';

  @Input()
  public set mode(value: CxFilterBarMode | undefined) {
    this.modeState.set(value === 'query' ? 'query' : 'filters');
  }

  @Input()
  public set quickFilters(value: CxButtonGroupOption[]) {
    this.quickFiltersState.set(value ?? []);
  }

  @Input()
  public set selectedQuickFilterId(value: string | undefined) {
    this.selectedQuickFilterIdState.set(value);
  }

  @Input()
  public set toggleFilters(value: CxToggleChipGroupOption[] | undefined) {
    this.toggleFiltersState.set(value ?? []);
  }

  @Input()
  public set selectedToggleFilterIds(value: string[] | undefined) {
    this.selectedToggleFilterIdsState.set(value ?? []);
  }

  @Input()
  public set filters(value: CxFilterBarFilter[] | undefined) {
    const next = value ?? [];
    for (const filter of next) {
      assertCxColumnFilterDefinition(filter.filter);
    }
    this.filtersState.set(next);
    const expandedFilterId = this.expandedFilterIdState();
    if (
      expandedFilterId &&
      !next.some(filter => filter.id === expandedFilterId)
    ) {
      this.expandedFilterIdState.set(undefined);
    }
  }

  @Input()
  public set filterValues(value: CxColumnFilterValueMap | undefined) {
    this.filterValuesState.set({ ...(value ?? {}) });
  }

  @Input()
  public set showActiveFilters(value: boolean | undefined) {
    this.showActiveFiltersState.set(value !== false);
  }

  @Input()
  public set queryValue(value: string | undefined) {
    this.queryValueState.set(value ?? '');
  }

  @Input()
  public set savedViews(value: CxMenuItem[]) {
    this.savedViewsState.set(value ?? []);
  }

  @Input()
  public set displayMode(value: CxFilterBarDisplayMode | undefined) {
    this.displayModeState.set(value === 'comfortable' ? 'comfortable' : 'compact');
  }

  @Input()
  public set groupByOptions(value: CxButtonGroupOption[] | undefined) {
    this.groupByOptionsState.set(value ?? []);
  }

  @Input()
  public set groupBy(value: string | undefined) {
    this.groupByState.set(value?.trim() || 'none');
  }

  @Input()
  public set sortOptions(value: CxDropdownOption[] | undefined) {
    this.sortOptionsState.set(value ?? []);
  }

  @Input()
  public set sortBy(value: string | undefined) {
    this.sortByState.set(value ?? 'none');
  }

  @Input()
  public set sortDirection(value: CxFilterBarSortDirection | undefined) {
    this.sortDirectionState.set(value === 'desc' ? 'desc' : 'asc');
  }

  @Input()
  public set thenBy(value: string | undefined) {
    this.thenByState.set(value ?? 'none');
  }

  @Input()
  public set thenByDirection(value: CxFilterBarSortDirection | undefined) {
    this.thenByDirectionState.set(value === 'desc' ? 'desc' : 'asc');
  }

  @Input()
  public set columnOptions(value: CxFilterBarColumnOption[] | undefined) {
    this.columnOptionsState.set(value ?? []);
  }

  @Input()
  public set visibleColumnIds(value: string[] | undefined) {
    this.visibleColumnIdsState.set(value ?? []);
  }

  @Input()
  public set pinnedColumnIds(value: string[] | undefined) {
    this.pinnedColumnIdsState.set(value ?? []);
  }

  @Output() readonly modeChange = new EventEmitter<CxFilterBarMode>();
  @Output() readonly selectedQuickFilterIdChange = new EventEmitter<string>();
  @Output() readonly selectedToggleFilterIdsChange = new EventEmitter<string[]>();
  @Output() readonly filterValuesChange = new EventEmitter<CxColumnFilterValueMap>();
  @Output() readonly filterQueryChange = new EventEmitter<CxColumnFilterQueryChangeEvent>();
  @Output() readonly filterLoadMore = new EventEmitter<CxColumnFilterLoadMoreEvent>();
  @Output() readonly queryValueChange = new EventEmitter<string>();
  @Output() readonly savedViewSelect = new EventEmitter<string>();
  @Output() readonly activeSavedViewIdChange = new EventEmitter<string | undefined>();
  @Output() readonly displayModeChange = new EventEmitter<CxFilterBarDisplayMode>();
  @Output() readonly groupByChange = new EventEmitter<string>();
  @Output() readonly sortByChange = new EventEmitter<string | undefined>();
  @Output() readonly sortDirectionChange = new EventEmitter<CxFilterBarSortDirection>();
  @Output() readonly thenByChange = new EventEmitter<string | undefined>();
  @Output() readonly thenByDirectionChange = new EventEmitter<CxFilterBarSortDirection>();
  @Output() readonly visibleColumnIdsChange = new EventEmitter<string[]>();
  @Output() readonly pinnedColumnIdsChange = new EventEmitter<string[]>();
  @Output() readonly filterPopoverOpenChange = new EventEmitter<boolean>();
  @Output() readonly exportTable = new EventEmitter<void>();
  @Output() readonly resetTable = new EventEmitter<void>();

  protected readonly mode$ = this.modeState.asReadonly();
  protected readonly quickFilters$ = this.quickFiltersState.asReadonly();
  protected readonly selectedQuickFilterId$ = this.selectedQuickFilterIdState.asReadonly();
  protected readonly toggleFilters$ = this.toggleFiltersState.asReadonly();
  protected readonly selectedToggleFilterIds$ = this.selectedToggleFilterIdsState.asReadonly();
  protected readonly filters$ = this.filtersState.asReadonly();
  protected readonly filterSearchValue$ =
    this.filterSearchValueState.asReadonly();
  protected readonly queryValue$ = this.queryValueState.asReadonly();
  protected readonly savedViews$ = this.savedViewsState.asReadonly();
  protected readonly activeSavedViewId$ = this.activeSavedViewIdState.asReadonly();
  protected readonly displayMode$ = this.displayModeState.asReadonly();
  protected readonly groupByOptions$ = this.groupByOptionsState.asReadonly();
  protected readonly groupBy$ = this.groupByState.asReadonly();
  protected readonly sortOptions$ = this.sortOptionsState.asReadonly();
  protected readonly sortBy$ = this.sortByState.asReadonly();
  protected readonly sortDirection$ = this.sortDirectionState.asReadonly();
  protected readonly thenBy$ = this.thenByState.asReadonly();
  protected readonly thenByDirection$ = this.thenByDirectionState.asReadonly();
  protected readonly columnOptions$ = this.columnOptionsState.asReadonly();
  protected readonly visibleColumnIds$ = this.visibleColumnIdsState.asReadonly();
  protected readonly pinnedColumnIds$ = this.pinnedColumnIdsState.asReadonly();
  protected readonly columnSearchValue$ = this.columnSearchValueState.asReadonly();
  protected readonly filterPopoverOpen$ = this.filterPopoverOpenState.asReadonly();
  protected readonly propertiesPopoverOpen$ = this.propertiesPopoverOpenState.asReadonly();
  protected readonly filterPopoverLeft$ = this.filterPopoverLeftState.asReadonly();
  protected readonly filterPopoverTop$ = this.filterPopoverTopState.asReadonly();
  protected readonly filterPopoverBottom$ = this.filterPopoverBottomState.asReadonly();
  protected readonly filterPopoverWidth$ = this.filterPopoverWidthState.asReadonly();
  protected readonly filterPopoverMaxHeight$ = this.filterPopoverMaxHeightState.asReadonly();
  protected readonly filterPopoverPlacement$ = this.filterPopoverPlacementState.asReadonly();
  protected readonly propertiesPopoverLeft$ = this.propertiesPopoverLeftState.asReadonly();
  protected readonly propertiesPopoverTop$ = this.propertiesPopoverTopState.asReadonly();
  protected readonly propertiesPopoverBottom$ = this.propertiesPopoverBottomState.asReadonly();
  protected readonly propertiesPopoverWidth$ = this.propertiesPopoverWidthState.asReadonly();
  protected readonly propertiesPopoverMaxHeight$ = this.propertiesPopoverMaxHeightState.asReadonly();
  protected readonly propertiesPopoverPlacement$ = this.propertiesPopoverPlacementState.asReadonly();
  protected readonly activeFilterCount$ = computed(() =>
    this.filtersState().filter(filter =>
      isCxColumnFilterValueActive(filter.filter, this.filterValuesState()[filter.id]),
    ).length,
  );
  protected readonly showActiveFilters$ = this.showActiveFiltersState.asReadonly();
  protected readonly activeFilterTags$ = computed(() => {
    const values = this.filterValuesState();
    return this.filtersState()
      .filter(filter => isCxColumnFilterValueActive(filter.filter, values[filter.id]))
      .map(filter => ({ id: filter.id, text: filter.label }));
  });
  /** Template order for the row-reverse layout: last DOM item lands leftmost. */
  protected readonly activeFilterTagsRow$ = computed(() => this.activeFilterTags$().slice().reverse());
  protected readonly hiddenActiveFilterCount$ = computed(() => {
    const visibleCount = this.visibleActiveFilterCountState();
    if (visibleCount === null) {
      return 0;
    }
    return Math.max(this.activeFilterTags$().length - visibleCount, 0);
  });
  protected readonly moreActiveFiltersLabel$ = computed(() => {
    const hiddenCount = this.hiddenActiveFilterCount$();
    return hiddenCount === 1 ? 'Show 1 more active filter' : `Show ${hiddenCount} more active filters`;
  });
  protected readonly filterButtonAriaLabel$ = computed(() => {
    const count = this.activeFilterCount$();
    return count === 0 ? 'Open filters' : `Open filters, ${count} active`;
  });
  protected readonly filteredFilters$ = computed(() => {
    const query = this.filterSearchValueState().trim().toLocaleLowerCase();
    const filters = this.filtersState();
    if (!query) {
      return filters;
    }
    return filters.filter(filter =>
      filter.label.toLocaleLowerCase().includes(query),
    );
  });
  protected readonly filteredColumnOptions$ = computed(() => {
    const query = this.columnSearchValueState().trim().toLowerCase();
    const options = this.columnOptionsState();
    if (!query) {
      return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(query));
  });
  protected readonly hasGroupByControls$ = computed(() => this.groupByOptionsState().length > 0);
  protected readonly groupByDropdownOptions$ = computed<CxDropdownOption[]>(() =>
    this.groupByOptionsState().map(option => ({
      id: option.id,
      label: option.label ?? option.id,
      disabled: option.disabled,
    })),
  );
  protected readonly hasSortControls$ = computed(() => this.sortOptionsState().length > 0);
  protected readonly hasThenByControls$ = computed(() => {
    const sortBy = this.sortByState();
    return this.sortOptionsState().length > 0 && sortBy !== undefined && sortBy !== 'none';
  });
  protected readonly hasColumnControls$ = computed(() => this.columnOptionsState().length > 0);
  protected readonly resolvedSavedViews$ = computed<CxMenuItem[]>(() =>
    this.savedViewsState().map(item => {
      const type = item.type ?? 'choice';
      const selectable = type === 'choice';
      const active = selectable && this.activeSavedViewIdState() === item.id;
      return {
        ...item,
        type,
        selected: selectable ? active : undefined,
        appendIcon: active ? 'check' : undefined,
      };
    }),
  );
  protected readonly savedViewIcon$ = computed<CxIconName>(() =>
    this.activeSavedViewIdState() ? 'saved-view-on' : 'saved-view',
  );
  protected readonly overflowItems$ = computed<CxMenuItem[]>(() => {
    const switchLabel = this.modeState() === 'filters' ? 'Switch to query mode' : 'Switch to filter mode';
    const switchIcon = this.modeState() === 'filters' ? 'query' : 'filters';
    return [
      { id: 'switch-mode', label: switchLabel, prependIcon: switchIcon },
      { id: 'export-table', label: 'Export table', prependIcon: 'export' },
      { id: 'reset-table', label: 'Reset table', prependIcon: 'reset', dividerBefore: true },
    ];
  });
  protected readonly displayOptions = DISPLAY_OPTIONS;
  ngAfterViewInit(): void {
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

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.activeFilterMeasureFrame !== undefined && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.activeFilterMeasureFrame);
    }
  }

  protected onQuickFilterSelect(value: string | undefined): void {
    if (!value) {
      return;
    }
    this.selectedQuickFilterIdState.set(value);
    this.selectedQuickFilterIdChange.emit(value);
    this.invalidateSavedViewSelection();
  }

  protected onToggleFilterSelect(values: string[]): void {
    this.selectedToggleFilterIdsState.set(values);
    this.selectedToggleFilterIdsChange.emit(values);
    this.invalidateSavedViewSelection();
  }

  protected onColumnFilterValueChange(
    filter: CxFilterBarFilter,
    value: CxColumnFilterValue | undefined,
  ): void {
    const next = withCxColumnFilterValue(
      this.filterValuesState(),
      filter.id,
      filter.filter,
      value,
    );
    if (next === this.filterValuesState()) {
      return;
    }
    this.filterValuesState.set(next);
    this.filterValuesChange.emit(next);
    this.invalidateSavedViewSelection();
  }

  protected onFilterQueryChange(columnId: string, query: string): void {
    this.filterQueryChange.emit({ columnId, query });
  }

  protected onFilterLoadMore(columnId: string): void {
    this.filterLoadMore.emit({ columnId });
  }

  protected filterValue(filterId: string): CxColumnFilterValue | undefined {
    return this.filterValuesState()[filterId];
  }

  protected isFilterActive(filter: CxFilterBarFilter): boolean {
    return isCxColumnFilterValueActive(
      filter.filter,
      this.filterValuesState()[filter.id],
    );
  }

  protected isFilterExpanded(filterId: string): boolean {
    return this.expandedFilterIdState() === filterId;
  }

  protected onFilterSearchValueChange(value: string): void {
    this.filterSearchValueState.set(value);
  }

  protected onFilterExpandedChange(
    filterId: string,
    expanded: boolean,
  ): void {
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
  private scheduleExpandedFilterReveal(filterId: string): void {
    if (typeof requestAnimationFrame === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }
    requestAnimationFrame(() => {
      if (this.expandedFilterIdState() !== filterId) {
        return;
      }
      const panel = this.filterPopoverRef
        ?.surfaceElement()
        ?.querySelector<HTMLElement>(`[data-cx-filter-panel="${CSS.escape(filterId)}"]`);
      if (!panel) {
        return;
      }
      const reveal = (): void => panel.scrollIntoView({ block: 'nearest' });
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

  protected clearFilter(filter: CxFilterBarFilter): void {
    this.onColumnFilterValueChange(filter, undefined);
  }

  protected isActiveFilterTagHidden(rowIndex: number): boolean {
    // Row order is reversed, so the wrapped (hidden) tags are the last items.
    return rowIndex >= this.activeFilterTags$().length - this.hiddenActiveFilterCount$();
  }

  protected onActiveFilterDismiss(filterId: string): void {
    const filter = this.filtersState().find(candidate => candidate.id === filterId);
    if (filter) {
      this.clearFilter(filter);
    }
  }

  protected onMoreActiveFiltersPressed(): void {
    if (!this.filterPopoverOpenState()) {
      this.toggleFilterPopover();
    }
  }

  protected clearAllFilters(): void {
    if (this.activeFilterCount$() === 0) {
      return;
    }
    this.filterValuesState.set({});
    this.filterValuesChange.emit({});
    this.invalidateSavedViewSelection();
  }

  protected onQueryChange(value: string): void {
    this.queryValueState.set(value);
    this.queryValueChange.emit(value);
    this.invalidateSavedViewSelection();
  }

  protected onSavedViewSelect(itemId: string): void {
    const item = this.savedViewsState().find(candidate => candidate.id === itemId);
    const nextActiveId = item?.type === 'action' ? undefined : itemId;
    this.activeSavedViewIdState.set(nextActiveId);
    this.activeSavedViewIdChange.emit(nextActiveId);
    this.savedViewSelect.emit(itemId);
    this.closeFilterPopover(false);
    this.propertiesPopoverOpenState.set(false);
  }

  protected onSavedViewsOpenChange(open: boolean): void {
    if (!open) {
      return;
    }
    this.closeFilterPopover(false);
    this.propertiesPopoverOpenState.set(false);
  }

  protected onOverflowItemSelect(itemId: string): void {
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

  protected onOverflowOpenChange(open: boolean): void {
    if (!open) {
      return;
    }
    this.closeFilterPopover(false);
    this.propertiesPopoverOpenState.set(false);
  }

  protected onDisplayModeSelect(value: string | undefined): void {
    const next = value === 'comfortable' ? 'comfortable' : 'compact';
    this.displayModeState.set(next);
    this.displayModeChange.emit(next);
    this.invalidateSavedViewSelection();
  }

  protected onGroupBySelect(value: string | undefined): void {
    const next = value?.trim() || 'none';
    this.groupByState.set(next);
    this.groupByChange.emit(next);
    this.invalidateSavedViewSelection();
  }

  protected onSortByValueChange(value: string | undefined): void {
    const next = value ?? 'none';
    this.sortByState.set(next);
    this.sortByChange.emit(next);
    if (next === 'none') {
      this.thenByState.set('none');
      this.thenByChange.emit('none');
    }
    this.invalidateSavedViewSelection();
  }

  protected onThenByValueChange(value: string | undefined): void {
    const next = value ?? 'none';
    this.thenByState.set(next);
    this.thenByChange.emit(next);
    this.invalidateSavedViewSelection();
  }

  protected toggleSortDirection(): void {
    if (!this.hasActivePrimarySort()) {
      return;
    }
    const next = this.sortDirectionState() === 'desc' ? 'asc' : 'desc';
    this.sortDirectionState.set(next);
    this.sortDirectionChange.emit(next);
    this.invalidateSavedViewSelection();
  }

  protected toggleThenByDirection(): void {
    if (!this.hasActiveSecondarySort()) {
      return;
    }
    const next = this.thenByDirectionState() === 'desc' ? 'asc' : 'desc';
    this.thenByDirectionState.set(next);
    this.thenByDirectionChange.emit(next);
    this.invalidateSavedViewSelection();
  }

  protected onColumnSearchValueChange(value: string): void {
    this.columnSearchValueState.set(value);
  }

  protected onColumnOptionSelect(columnId: string): void {
    const columnIds = this.columnOptionsState().map(option => option.id);
    const visibleIds = new Set(this.visibleColumnIdsState().length === 0 ? columnIds : this.visibleColumnIdsState());
    if (visibleIds.has(columnId)) {
      visibleIds.delete(columnId);
    } else {
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

  protected resetColumns(): void {
    const next = this.columnOptionsState().map(option => option.id);
    this.visibleColumnIdsState.set(next);
    this.visibleColumnIdsChange.emit(next);
    this.pinnedColumnIdsState.set([]);
    this.pinnedColumnIdsChange.emit([]);
    this.invalidateSavedViewSelection();
  }

  protected togglePinnedColumn(columnId: string): void {
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

  protected toggleFilterPopover(): void {
    if (this.modeState() !== 'filters') {
      return;
    }
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

  protected togglePropertiesPopover(): void {
    this.closeFilterPopover(false);
    const next = !this.propertiesPopoverOpenState();
    if (next) {
      this.propertiesPopoverLockedPlacement = undefined;
      this.syncPropertiesPopoverMetrics();
    }
    this.propertiesPopoverOpenState.set(next);
  }

  public closeFilterPopover(restoreFocus = true): void {
    if (!this.filterPopoverOpenState()) {
      return;
    }
    this.filterPopoverOpenState.set(false);
    this.filterPopoverOpenChange.emit(false);
    if (restoreFocus) {
      queueMicrotask(() => {
        this.filterTriggerRef?.nativeElement.querySelector<HTMLElement>('button')?.focus();
      });
    }
  }

  protected closeFloatingPopovers(restoreFocus = true): void {
    const propertiesWasOpen = this.propertiesPopoverOpenState();
    this.closeFilterPopover(restoreFocus && !propertiesWasOpen);
    this.propertiesPopoverOpenState.set(false);
    if (restoreFocus && propertiesWasOpen) {
      queueMicrotask(() => {
        this.propertiesTriggerRef?.nativeElement.querySelector<HTMLElement>('button')?.focus();
      });
    }
  }

  protected isColumnVisible(columnId: string): boolean {
    const visibleColumnIds = this.visibleColumnIdsState();
    return visibleColumnIds.length === 0 || visibleColumnIds.includes(columnId);
  }

  protected isColumnPinned(columnId: string): boolean {
    return this.pinnedColumnIdsState().includes(columnId);
  }

  protected canPinColumn(columnId: string): boolean {
    const option = this.columnOptionsState().find(candidate => candidate.id === columnId);
    if (option?.pinnable === false || !this.isColumnVisible(columnId)) {
      return false;
    }
    return this.isColumnPinned(columnId) || this.pinnedColumnIdsState().length < CX_FILTER_BAR_MAX_PINNED_COLUMNS;
  }

  protected directionIcon(direction: CxFilterBarSortDirection): CxIconName {
    return direction === 'desc' ? 'arrow-down' : 'arrow-up';
  }

  protected directionTooltip(direction: CxFilterBarSortDirection): string {
    return direction === 'desc'
      ? 'Descending — press for ascending'
      : 'Ascending — press for descending';
  }

  protected hasActivePrimarySort(): boolean {
    const sortBy = this.sortByState();
    return sortBy !== undefined && sortBy !== 'none';
  }

  protected hasActiveSecondarySort(): boolean {
    const thenBy = this.thenByState();
    return thenBy !== undefined && thenBy !== 'none';
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.filterPopoverOpenState() && !this.propertiesPopoverOpenState()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node) || !this.pointerTargetIsInsideFilterBar(target)) {
      this.closeFloatingPopovers(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.propertiesPopoverOpenState()) {
      this.propertiesPopoverOpenState.set(false);
      return;
    }
    if (this.filterPopoverOpenState()) {
      this.closeFilterPopover();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.filterPopoverOpenState()) {
      this.syncFilterPopoverMetrics();
    }
    if (this.propertiesPopoverOpenState()) {
      this.syncPropertiesPopoverMetrics();
    }
  }

  private applyMode(mode: CxFilterBarMode): void {
    this.modeState.set(mode);
    this.modeChange.emit(mode);
    this.closeFilterPopover(false);
    this.propertiesPopoverOpenState.set(false);
    this.invalidateSavedViewSelection();
  }

  public invalidateSavedViewSelection(): void {
    if (!this.activeSavedViewIdState()) {
      return;
    }
    this.activeSavedViewIdState.set(undefined);
    this.activeSavedViewIdChange.emit(undefined);
  }

  private pointerTargetIsInsideFilterBar(target: Node): boolean {
    if (this.host.nativeElement.contains(target)) {
      return true;
    }
    if (this.filterPopoverRef?.surfaceElement()?.contains(target)) {
      return true;
    }
    if (this.propertiesPopoverRef?.surfaceElement()?.contains(target)) {
      return true;
    }
    const targetElement = target instanceof Element ? target : target.parentElement;
    return !!targetElement?.closest('[data-cx-popover-surface]');
  }

  private syncFilterPopoverMetrics(): void {
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

  private syncPropertiesPopoverMetrics(): void {
    const trigger = this.propertiesTriggerRef?.nativeElement;
    if (!trigger || typeof window === 'undefined') {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = Math.min(Math.max(this.columnOptionsState().length, 1) * 32 + 292, 620);
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

  private scheduleActiveFilterMeasure(): void {
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
  private measureActiveFilterTags(): void {
    const container = this.activeFiltersRegionEl;
    if (!container) {
      this.visibleActiveFilterCountState.set(null);
      return;
    }
    const tagElements = Array.from(
      container.querySelectorAll<HTMLElement>('.cx-filter-bar__active-filter'),
    );
    if (tagElements.length === 0) {
      this.visibleActiveFilterCountState.set(null);
      return;
    }
    // The first row is defined by every child including the +N pill; a tag
    // sitting below it has wrapped even when no tag made the first row.
    const firstRowTop = Math.min(
      ...Array.from(container.children, child => (child as HTMLElement).offsetTop),
    );
    const rowHeight = tagElements[0].offsetHeight;
    const wrappedCount = tagElements.filter(
      element => element.offsetTop >= firstRowTop + rowHeight,
    ).length;
    if (wrappedCount === 0) {
      this.visibleActiveFilterCountState.set(null);
      return;
    }
    // The pill occupies row space too; without this check a single tag that
    // fits on its own could stay collapsed behind a "+1" forever.
    const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
    const totalWidth =
      tagElements.reduce((sum, element) => sum + element.offsetWidth, 0) +
      gap * (tagElements.length - 1);
    if (totalWidth <= container.clientWidth) {
      this.visibleActiveFilterCountState.set(null);
      return;
    }
    this.visibleActiveFilterCountState.set(tagElements.length - wrappedCount);
  }

  private scheduleFilterFocus(): void {
    const focusSearch = (attempt = 0): void => {
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
}
