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
  QueryList,
  ViewChild,
  ViewChildren,
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
import { CxDialogComponent } from '../../primitives/overlay/cx-dialog';
import {
  CxTabsComponent,
  type CxTabItem,
} from '../../primitives/navigation/cx-tabs';
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
  estimateCxColumnFilterHeight,
  isCxColumnFilterValueActive,
  normalizeCxColumnFilterValueMap,
  withCxColumnFilterValue,
} from '../../primitives/data/cx-column-filter-editor';
import {
  CxQueryFieldComponent,
  type CxQueryFieldCondition,
  type CxQueryFieldDefinition,
  type CxQueryFieldValueRetryEvent,
  type CxQueryFieldValueSearchEvent,
} from '../../primitives/data/cx-query-field';

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

export type CxFilterBarQueryTranslationIssuePart =
  | 'condition'
  | 'join'
  | 'field'
  | 'operator'
  | 'value';

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

const CX_FILTER_BAR_MAX_PINNED_COLUMNS = 3;
/** Same surface width as the table's column-header filter, so one filter reads the same in both places. */
const CX_FILTER_BAR_TAG_POPOVER_WIDTH = 320;
const CX_FILTER_BAR_OVERFLOW_POPOVER_WIDTH = 360;
const DISPLAY_OPTIONS: CxButtonGroupOption[] = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
];
const FILTER_VIEW_TABS: CxTabItem[] = [
  { id: 'recommended', label: 'Recommended filters' },
  { id: 'all', label: 'All filters' },
];
const DEFAULT_QUERY_FIELDS: readonly CxQueryFieldDefinition[] = [
  {
    id: 'search',
    label: 'Search',
    operators: [{ id: 'contains', label: 'contains' }],
    value: { kind: 'text' },
  },
];

@Component({
  selector: 'cx-filter-bar',
  imports: [
    CommonModule,
    CxButtonGroupComponent,
    CxColumnFilterEditorComponent,
    CxQueryFieldComponent,
    CxExpansionPanelComponent,
    CxIconButtonComponent,
    CxTagComponent,
    CxTextFieldComponent,
    CxDropdownComponent,
    CxDialogComponent,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxOptionGroupComponent,
    CxPopoverComponent,
    CxSwitchComponent,
    CxTabsComponent,
    CxToggleButtonComponent,
    CxToggleChipGroupComponent,
    CxTooltipComponent,
  ],
  templateUrl: './cx-filter-bar.component.html',
  styleUrl: './cx-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFilterBarComponent implements AfterViewInit, OnDestroy {
  private static instanceCounter = 0;
  private readonly instanceId = ++CxFilterBarComponent.instanceCounter;
  protected readonly tagFilterDialogId = `cx-filter-bar-${this.instanceId}-tag-filter`;
  protected readonly overflowFilterDialogId = `cx-filter-bar-${this.instanceId}-overflow-filters`;
  protected readonly filterListPanelId = `cx-filter-bar-${this.instanceId}-filter-list`;
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
  private readonly filterViewState = signal<CxFilterBarFilterView>('recommended');
  private readonly expandedFilterIdState = signal<string | undefined>(
    undefined,
  );
  private readonly queryValueState = signal('');
  private readonly queryFieldsState = signal<readonly CxQueryFieldDefinition[]>(
    [],
  );
  private readonly queryConditionsState = signal<
    readonly CxQueryFieldCondition[]
  >([]);
  private readonly queryToFilterTranslationState = signal<
    CxFilterBarQueryTranslation | undefined
  >(undefined);
  private readonly filtersToQueryConditionsState = signal<
    readonly CxQueryFieldCondition[] | undefined
  >(undefined);
  protected readonly pendingQueryTranslationState = signal<
    CxFilterBarQueryTranslation | undefined
  >(undefined);
  private readonly savedViewsState = signal<CxMenuItem[]>([]);
  private readonly activeSavedViewIdState = signal<string | undefined>(undefined);
  private readonly displayModeState = signal<CxFilterBarDisplayMode>('comfortable');
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
  private readonly tagFilterIdState = signal<string | undefined>(undefined);
  private readonly tagFilterMetricsState = signal<
    CxFilterBarSurfaceMetrics | undefined
  >(undefined);
  private readonly overflowFilterPopoverOpenState = signal(false);
  private readonly overflowExpandedFilterIdState = signal<string | undefined>(undefined);
  private readonly overflowFilterMetricsState = signal<
    CxFilterBarSurfaceMetrics | undefined
  >(undefined);
  private tagFilterAnchor?: HTMLElement;
  private tagFilterLockedPlacement?: CxFloatingSurfacePlacement;
  private overflowFilterLockedPlacement?: CxFloatingSurfacePlacement;
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

  @ViewChild('tagFilterPopover')
  private tagFilterPopoverRef?: CxPopoverComponent;

  @ViewChild('activeFilterOverflowAnchor', { read: ElementRef })
  private activeFilterOverflowAnchorRef?: ElementRef<HTMLElement>;

  @ViewChild('activeFilterOverflowPopover')
  private activeFilterOverflowPopoverRef?: CxPopoverComponent;

  // The expansion panel and the tag popover render the same editor template,
  // so the instance is identified by which surface contains it. The two lists
  // come from one query and stay index-aligned.
  @ViewChildren(CxColumnFilterEditorComponent)
  private readonly columnFilterEditors?: QueryList<CxColumnFilterEditorComponent>;

  @ViewChildren(CxColumnFilterEditorComponent, { read: ElementRef })
  private readonly columnFilterEditorHosts?: QueryList<ElementRef<HTMLElement>>;

  // Both lists follow activeFilterTagsRow$ order, so one index resolves the
  // tag to focus and the element to anchor against.
  @ViewChildren('activeFilterTag')
  private readonly activeFilterTags?: QueryList<CxTagComponent>;

  @ViewChildren('activeFilterTag', { read: ElementRef })
  private readonly activeFilterTagHosts?: QueryList<ElementRef<HTMLElement>>;

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
      this.setVisibleActiveFilterCount(null);
    }
  }

  @Input() queryAriaLabel = 'Search query';
  @Input() filterSearchAriaLabel = 'Search filters';
  @Input() columnSearchAriaLabel = 'Search columns';

  @Input()
  public set mode(value: CxFilterBarMode | undefined) {
    const next = value === 'query' ? 'query' : 'filters';
    this.modeState.set(next);
    if (next === 'filters') {
      this.pendingQueryTranslationState.set(undefined);
    }
    if (next === 'query') {
      // An owner can switch modes without going through applyMode, and query
      // mode removes the tag row this surface is anchored to.
      this.closeTagFilterPopover(false);
    }
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
    if (
      this.filterViewState() === 'recommended'
      && !next.some(filter => filter.recommended)
    ) {
      this.filterViewState.set('all');
    }
    const expandedFilterId = this.expandedFilterIdState();
    if (
      expandedFilterId &&
      !next.some(filter => filter.id === expandedFilterId)
    ) {
      this.expandedFilterIdState.set(undefined);
    }
    const tagFilterId = this.tagFilterIdState();
    if (tagFilterId && !next.some(filter => filter.id === tagFilterId)) {
      this.closeTagFilterPopover(false);
    }
    this.reconcileActiveFilterOverflow();
  }

  @Input()
  public set filterValues(value: CxColumnFilterValueMap | undefined) {
    this.filterValuesState.set({ ...(value ?? {}) });
  }

  @Input()
  public set showActiveFilters(value: boolean | undefined) {
    this.showActiveFiltersState.set(value !== false);
    if (value === false) {
      this.closeTagFilterPopover(false);
      this.closeActiveFilterOverflow(false);
    }
  }

  @Input()
  public set queryValue(value: string | undefined) {
    this.queryValueState.set(value ?? '');
  }

  @Input()
  public set queryFields(
    value: readonly CxQueryFieldDefinition[] | null | undefined,
  ) {
    this.queryFieldsState.set(value ?? []);
  }

  @Input()
  public set queryConditions(
    value: readonly CxQueryFieldCondition[] | null | undefined,
  ) {
    this.queryConditionsState.set(value ?? []);
  }

  @Input()
  public set queryToFilterTranslation(
    value: CxFilterBarQueryTranslation | null | undefined,
  ) {
    this.queryToFilterTranslationState.set(value ?? undefined);
  }

  @Input()
  public set filtersToQueryConditions(
    value: readonly CxQueryFieldCondition[] | null | undefined,
  ) {
    this.filtersToQueryConditionsState.set(value ?? undefined);
  }

  @Input()
  public set savedViews(value: CxMenuItem[]) {
    this.savedViewsState.set(value ?? []);
  }

  @Input()
  public set displayMode(value: CxFilterBarDisplayMode | undefined) {
    this.displayModeState.set(value === 'compact' ? 'compact' : 'comfortable');
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
  @Output() readonly queryConditionsChange = new EventEmitter<
    readonly CxQueryFieldCondition[]
  >();
  @Output() readonly queryValueSearch =
    new EventEmitter<CxQueryFieldValueSearchEvent>();
  @Output() readonly queryValueRetry =
    new EventEmitter<CxQueryFieldValueRetryEvent>();
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
  protected readonly filterView$ = this.filterViewState.asReadonly();
  protected readonly queryValue$ = this.queryValueState.asReadonly();
  protected readonly queryTranslationDialogOpen$ = computed(
    () => this.pendingQueryTranslationState() !== undefined,
  );
  protected readonly resolvedQueryFields$ = computed<
    readonly CxQueryFieldDefinition[]
  >(() =>
    this.queryFieldsState().length > 0
      ? this.queryFieldsState()
      : DEFAULT_QUERY_FIELDS,
  );
  protected readonly resolvedQueryConditions$ = computed<
    readonly CxQueryFieldCondition[]
  >(() => {
    if (this.queryFieldsState().length > 0) {
      return this.queryConditionsState();
    }
    const value = this.queryValueState().trim();
    return value
      ? [{ id: 'search', fieldId: 'search', operatorId: 'contains', value }]
      : [];
  });
  protected readonly queryTranslationRemovedConditionIds$ = computed(() => {
    const translatedIds = new Set(
      this.pendingQueryTranslationState()?.translatedConditionIds ?? [],
    );
    return this.resolvedQueryConditions$()
      .filter(condition => !translatedIds.has(condition.id))
      .map(condition => condition.id);
  });
  protected readonly queryTranslationSummary$ = computed(() => {
    const translated = new Set(
      this.pendingQueryTranslationState()?.translatedConditionIds ?? [],
    ).size;
    const removed = this.queryTranslationRemovedConditionIds$().length;
    return `${translated} ${translated === 1 ? 'condition' : 'conditions'} will become filters. ${removed} ${removed === 1 ? 'condition' : 'conditions'} will be removed.`;
  });
  protected readonly queryTranslationPrimaryText$ = computed(() => {
    const count = this.queryTranslationRemovedConditionIds$().length;
    return `Switch and remove ${count} ${count === 1 ? 'condition' : 'conditions'}`;
  });
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
  protected readonly tagFilterMetrics$ = this.tagFilterMetricsState.asReadonly();
  protected readonly overflowFilterPopoverOpen$ = this.overflowFilterPopoverOpenState.asReadonly();
  protected readonly overflowFilterMetrics$ = this.overflowFilterMetricsState.asReadonly();
  /**
   * Resolved from the filter list, never from the active tags: clearing the
   * last value removes the tag but must not empty the editor the user is
   * still working in.
   */
  protected readonly tagFilter$ = computed(() => {
    const filterId = this.tagFilterIdState();
    return filterId
      ? this.filtersState().find(filter => filter.id === filterId)
      : undefined;
  });
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
  protected readonly hiddenActiveFilters$ = computed(() => {
    const hiddenIds = new Set(
      this.activeFilterTags$()
        .slice(0, this.hiddenActiveFilterCount$())
        .map(tag => tag.id),
    );
    return this.filtersState().filter(filter => hiddenIds.has(filter.id));
  });
  protected readonly filterButtonAriaLabel$ = computed(() => {
    const count = this.activeFilterCount$();
    return count === 0 ? 'Open filters' : `Open filters, ${count} active`;
  });
  protected readonly filteredFilters$ = computed(() => {
    const query = this.filterSearchValueState().trim().toLocaleLowerCase();
    const filters = this.filterViewState() === 'recommended'
      ? this.filtersState().filter(filter => filter.recommended)
      : this.filtersState();
    if (!query) {
      return filters;
    }
    return filters.filter(filter =>
      filter.label.toLocaleLowerCase().includes(query),
    );
  });
  protected readonly filterViewTabs = FILTER_VIEW_TABS;
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
      { id: 'reset-table', label: 'Reset view', prependIcon: 'reset', dividerBefore: true },
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
      if (this.tagFilterIdState()) {
        this.syncTagFilterMetrics();
      }
      if (this.overflowFilterPopoverOpenState()) {
        this.syncActiveFilterOverflowMetrics();
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
    this.reconcileActiveFilterOverflow();
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

  protected onFilterViewChange(value: string): void {
    const next: CxFilterBarFilterView = value === 'recommended' ? 'recommended' : 'all';
    this.filterViewState.set(next);
    const expandedFilterId = this.expandedFilterIdState();
    if (
      expandedFilterId
      && !this.filteredFilters$().some(filter => filter.id === expandedFilterId)
    ) {
      this.expandedFilterIdState.set(undefined);
    }
  }

  protected onFilterExpandedChange(
    filterId: string,
    expanded: boolean,
  ): void {
    this.expandedFilterIdState.set(expanded ? filterId : undefined);
    if (expanded) {
      this.scheduleExpandedFilterReveal(filterId);
      this.scheduleExpandedFilterFocus(filterId);
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

  protected isTagFilterOpen(filterId: string): boolean {
    return this.tagFilterIdState() === filterId;
  }

  protected activeFilterTagAriaLabel(label: string): string {
    return `Open ${label} filter`;
  }

  /**
   * The tag opens the same editor the column header and the filter list use;
   * only the surface around it differs.
   */
  protected onActiveFilterTagPressed(filterId: string): void {
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

  public closeTagFilterPopover(restoreFocus = true): void {
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
      this.filterTriggerRef?.nativeElement.querySelector<HTMLElement>('button')?.focus();
    });
  }

  private activeFilterTagIndex(filterId: string): number {
    return this.activeFilterTagsRow$().findIndex(tag => tag.id === filterId);
  }

  private activeFilterTagHost(filterId: string): HTMLElement | undefined {
    const index = this.activeFilterTagIndex(filterId);
    return index < 0
      ? undefined
      : this.activeFilterTagHosts?.get(index)?.nativeElement;
  }

  protected onMoreActiveFiltersPressed(): void {
    if (this.overflowFilterPopoverOpenState()) {
      this.closeActiveFilterOverflow();
      return;
    }
    if (this.hiddenActiveFilters$().length === 0) {
      return;
    }

    this.closeFilterPopover(false);
    this.closeTagFilterPopover(false);
    this.propertiesPopoverOpenState.set(false);
    this.overflowExpandedFilterIdState.set(undefined);
    this.overflowFilterLockedPlacement = undefined;
    this.syncActiveFilterOverflowMetrics();
    this.overflowFilterPopoverOpenState.set(true);
    this.filterPopoverOpenChange.emit(true);
    this.scheduleActiveFilterOverflowFocus();
  }

  protected isOverflowFilterExpanded(filterId: string): boolean {
    return this.overflowExpandedFilterIdState() === filterId;
  }

  protected onOverflowFilterExpandedChange(filterId: string, expanded: boolean): void {
    this.overflowExpandedFilterIdState.set(expanded ? filterId : undefined);
    if (expanded) {
      this.scheduleExpandedFilterFocus(filterId, 'overflow');
    }
    queueMicrotask(() => this.syncActiveFilterOverflowMetrics());
  }

  protected overflowFilterHeading(filter: CxFilterBarFilter): string {
    return filter.label;
  }

  public closeActiveFilterOverflow(restoreFocus = true): void {
    if (!this.overflowFilterPopoverOpenState()) {
      return;
    }
    this.overflowFilterPopoverOpenState.set(false);
    this.overflowExpandedFilterIdState.set(undefined);
    this.overflowFilterMetricsState.set(undefined);
    this.overflowFilterLockedPlacement = undefined;
    this.filterPopoverOpenChange.emit(false);

    if (!restoreFocus) {
      return;
    }
    queueMicrotask(() => {
      const trigger = this.activeFilterOverflowAnchorRef?.nativeElement;
      if (trigger?.isConnected) {
        trigger.focus();
        return;
      }
      this.filterTriggerRef?.nativeElement.querySelector<HTMLElement>('button')?.focus();
    });
  }

  protected clearAllFilters(): void {
    if (this.activeFilterCount$() === 0) {
      return;
    }
    this.filterValuesState.set({});
    this.filterValuesChange.emit({});
    this.invalidateSavedViewSelection();
    this.reconcileActiveFilterOverflow();
  }

  protected onQueryConditionsChange(value: readonly CxQueryFieldCondition[]): void {
    if (this.queryFieldsState().length > 0) {
      this.queryConditionsState.set(value);
      this.queryConditionsChange.emit(value);
    } else {
      const nextValue =
        value.length === 1 && typeof value[0]?.value === 'string'
          ? value[0].value
          : '';
      this.queryValueState.set(nextValue);
      this.queryValueChange.emit(nextValue);
    }
    this.invalidateSavedViewSelection();
  }

  protected onSavedViewSelect(itemId: string): void {
    const item = this.savedViewsState().find(candidate => candidate.id === itemId);
    if (item) {
      const nextActiveId = item.type === 'action' ? undefined : itemId;
      this.activeSavedViewIdState.set(nextActiveId);
      this.activeSavedViewIdChange.emit(nextActiveId);
    }
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
      this.requestModeSwitch();
      return;
    }
    if (itemId === 'reset-table') {
      this.resetTable.emit();
      this.invalidateSavedViewSelection();
    }
  }

  protected queryConditionFieldLabel(condition: CxQueryFieldCondition): string {
    return this.resolvedQueryFields$().find(field => field.id === condition.fieldId)?.label
      ?? condition.fieldId;
  }

  protected queryConditionOperatorLabel(condition: CxQueryFieldCondition): string {
    const field = this.resolvedQueryFields$().find(candidate => candidate.id === condition.fieldId);
    return field?.operators.find(operator => operator.id === condition.operatorId)?.label
      ?? condition.operatorId;
  }

  protected queryConditionValueLabel(condition: CxQueryFieldCondition): string {
    const values = Array.isArray(condition.value) ? condition.value : [condition.value];
    const field = this.resolvedQueryFields$().find(candidate => candidate.id === condition.fieldId);
    const options = field?.value?.kind === 'options' ? field.value.options : [];
    return values
      .filter(value => value !== undefined && value !== null && String(value).length > 0)
      .map(value => options.find(option => option.id === String(value))?.label ?? String(value))
      .join(', ');
  }

  protected queryConditionHasValue(condition: CxQueryFieldCondition): boolean {
    return this.queryConditionValueLabel(condition).length > 0;
  }

  protected queryTranslationPartUnsupported(
    conditionId: string,
    part: CxFilterBarQueryTranslationIssuePart,
  ): boolean {
    const issues = this.pendingQueryTranslationState()?.issues ?? [];
    return issues.some(issue =>
      issue.conditionId === conditionId
      && (issue.part === part || issue.part === 'condition'),
    );
  }

  protected queryTranslationIssueLabel(issue: CxFilterBarQueryTranslationIssue): string {
    const condition = this.resolvedQueryConditions$().find(candidate => candidate.id === issue.conditionId);
    if (!condition) {
      return issue.part;
    }
    if (issue.part === 'join') {
      return (condition.join ?? 'and').toUpperCase();
    }
    if (issue.part === 'field') {
      return this.queryConditionFieldLabel(condition);
    }
    if (issue.part === 'operator') {
      return this.queryConditionOperatorLabel(condition);
    }
    if (issue.part === 'value') {
      return this.queryConditionValueLabel(condition);
    }
    return `${this.queryConditionFieldLabel(condition)} ${this.queryConditionOperatorLabel(condition)}`;
  }

  protected keepQueryMode(): void {
    this.pendingQueryTranslationState.set(undefined);
  }

  protected confirmQueryToFilterSwitch(): void {
    const translation = this.pendingQueryTranslationState();
    if (!translation) {
      return;
    }
    this.pendingQueryTranslationState.set(undefined);
    this.applyQueryTranslation(translation);
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
    this.closeTagFilterPopover(false);
    this.closeActiveFilterOverflow(false);
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
    // One filter surface at a time; the tag popover has its own focus restore
    // for the paths where the user dismissed it directly.
    this.closeTagFilterPopover(false);
    this.closeActiveFilterOverflow(false);
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
    if (
      !this.filterPopoverOpenState() &&
      !this.propertiesPopoverOpenState() &&
      !this.tagFilterIdState() &&
      !this.overflowFilterPopoverOpenState()
    ) {
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
    if (this.tagFilterIdState()) {
      this.closeTagFilterPopover();
      return;
    }
    if (this.overflowFilterPopoverOpenState()) {
      this.closeActiveFilterOverflow();
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
    if (this.tagFilterIdState()) {
      this.syncTagFilterMetrics();
    }
    if (this.overflowFilterPopoverOpenState()) {
      this.syncActiveFilterOverflowMetrics();
    }
  }

  private applyMode(mode: CxFilterBarMode): void {
    this.modeState.set(mode);
    this.modeChange.emit(mode);
    this.closeFilterPopover(false);
    this.propertiesPopoverOpenState.set(false);
    this.invalidateSavedViewSelection();
  }

  private requestModeSwitch(): void {
    if (this.modeState() === 'filters') {
      const translatedQuery = this.filtersToQueryConditionsState();
      if (translatedQuery !== undefined && this.queryFieldsState().length > 0) {
        this.queryConditionsState.set(translatedQuery);
        this.queryConditionsChange.emit(translatedQuery);
      }
      this.applyMode('query');
      return;
    }

    const conditions = this.resolvedQueryConditions$();
    const translation = this.resolveQueryToFilterTranslation(conditions);
    const translatedIds = new Set(translation.translatedConditionIds);
    const hasLoss = translation.issues.length > 0
      || conditions.some(condition => !translatedIds.has(condition.id));
    if (hasLoss) {
      this.closeFilterPopover(false);
      this.propertiesPopoverOpenState.set(false);
      this.pendingQueryTranslationState.set(translation);
      return;
    }
    this.applyQueryTranslation(translation);
  }

  private resolveQueryToFilterTranslation(
    conditions: readonly CxQueryFieldCondition[],
  ): CxFilterBarQueryTranslation {
    const supplied = this.queryToFilterTranslationState();
    if (supplied) {
      return supplied;
    }
    return {
      filterValues: {},
      translatedConditionIds: [],
      issues: conditions.map(condition => ({
        conditionId: condition.id,
        part: 'condition' as const,
        reason: 'This condition has no filter-mode equivalent.',
      })),
    };
  }

  private applyQueryTranslation(translation: CxFilterBarQueryTranslation): void {
    const definitions = Object.fromEntries(
      this.filtersState().map(filter => [filter.id, filter.filter]),
    );
    const nextValues = normalizeCxColumnFilterValueMap(
      definitions,
      translation.filterValues,
    );
    this.filterValuesState.set(nextValues);
    this.filterValuesChange.emit(nextValues);
    if (this.queryFieldsState().length > 0) {
      this.queryConditionsState.set([]);
      this.queryConditionsChange.emit([]);
    } else {
      this.queryValueState.set('');
      this.queryValueChange.emit('');
    }
    this.applyMode('filters');
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
    if (this.tagFilterPopoverRef?.surfaceElement()?.contains(target)) {
      return true;
    }
    if (this.activeFilterOverflowPopoverRef?.surfaceElement()?.contains(target)) {
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

  private syncTagFilterMetrics(): void {
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

  private syncActiveFilterOverflowMetrics(): void {
    const anchor = this.activeFilterOverflowAnchorRef?.nativeElement;
    const filters = this.hiddenActiveFilters$();
    if (!anchor?.isConnected || filters.length === 0 || typeof window === 'undefined') {
      return;
    }
    const expandedFilterId = this.overflowExpandedFilterIdState();
    const expandedFilter = expandedFilterId
      ? filters.find(filter => filter.id === expandedFilterId)
      : undefined;
    const estimatedHeight = Math.min(
      filters.length * 48
        + 48
        + (expandedFilter ? estimateCxColumnFilterHeight(expandedFilter.filter) : 0),
      560,
    );
    const surface = measureCxFloatingSurface({
      triggerRect: anchor.getBoundingClientRect(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: CX_FILTER_BAR_OVERFLOW_POPOVER_WIDTH,
      estimatedHeight,
      minWidth: 280,
      align: 'end',
      gap: 4,
      lockedPlacement: this.overflowFilterLockedPlacement,
    });
    this.overflowFilterLockedPlacement = surface.placement;
    this.overflowFilterMetricsState.set({
      left: surface.left,
      top: surface.top,
      bottom: surface.bottom,
      width: surface.width,
      maxHeight: surface.maxHeight,
      placement: surface.placement,
    });
  }

  private scheduleActiveFilterOverflowFocus(attempt = 0): void {
    const focusFirstFilter = (): void => {
      if (!this.overflowFilterPopoverOpenState()) {
        return;
      }
      const surface = this.activeFilterOverflowPopoverRef?.surfaceElement();
      const trigger = surface?.querySelector<HTMLElement>(
        '.cx-filter-bar__overflow-filter-panel button',
      );
      if (trigger) {
        trigger.focus();
        return;
      }
      if (attempt < 12) {
        this.scheduleActiveFilterOverflowFocus(attempt + 1);
      }
    };
    if (typeof requestAnimationFrame === 'undefined') {
      queueMicrotask(focusFirstFilter);
      return;
    }
    requestAnimationFrame(focusFirstFilter);
  }

  private reconcileActiveFilterOverflow(): void {
    const hiddenIds = new Set(this.hiddenActiveFilters$().map(filter => filter.id));
    const expandedFilterId = this.overflowExpandedFilterIdState();
    if (expandedFilterId && !hiddenIds.has(expandedFilterId)) {
      this.overflowExpandedFilterIdState.set(undefined);
    }
    if (!this.overflowFilterPopoverOpenState()) {
      return;
    }
    if (hiddenIds.size === 0) {
      this.closeActiveFilterOverflow(false);
      return;
    }
    queueMicrotask(() => this.syncActiveFilterOverflowMetrics());
  }

  private scheduleTagFilterFocus(filterId: string, attempt = 0): void {
    if (typeof requestAnimationFrame === 'undefined') {
      queueMicrotask(() => this.focusTagFilterEditor(filterId, attempt));
      return;
    }
    requestAnimationFrame(() => this.focusTagFilterEditor(filterId, attempt));
  }

  private scheduleExpandedFilterFocus(
    filterId: string,
    surface: 'filters' | 'overflow' = 'filters',
    attempt = 0,
  ): void {
    const focusEditor = (): void => {
      const expandedFilterId = surface === 'overflow'
        ? this.overflowExpandedFilterIdState()
        : this.expandedFilterIdState();
      if (expandedFilterId !== filterId) {
        return;
      }
      const popover = surface === 'overflow'
        ? this.activeFilterOverflowPopoverRef
        : this.filterPopoverRef;
      const popoverSurface = popover?.surfaceElement();
      this.columnFilterEditorIn(popoverSurface)?.focus();
      const activeElement = typeof document === 'undefined' ? undefined : document.activeElement;
      if (activeElement && popoverSurface?.contains(activeElement)) {
        return;
      }
      if (attempt < 12) {
        this.scheduleExpandedFilterFocus(filterId, surface, attempt + 1);
      }
    };
    if (typeof requestAnimationFrame === 'undefined') {
      queueMicrotask(focusEditor);
      return;
    }
    requestAnimationFrame(focusEditor);
  }

  /**
   * The surface is portaled after render, so the editor may not exist on the
   * first frame; retry a bounded number of times, as the column header does.
   */
  private focusTagFilterEditor(filterId: string, attempt: number): void {
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

  private columnFilterEditorIn(
    surface: HTMLElement | undefined,
  ): CxColumnFilterEditorComponent | undefined {
    if (!surface) {
      return undefined;
    }
    const index = (this.columnFilterEditorHosts?.toArray() ?? []).findIndex(host =>
      surface.contains(host.nativeElement),
    );
    return index < 0 ? undefined : this.columnFilterEditors?.get(index);
  }

  private syncPropertiesPopoverMetrics(): void {
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

  private setVisibleActiveFilterCount(value: number | null): void {
    this.visibleActiveFilterCountState.set(value);
    this.reconcileActiveFilterOverflow();
  }

  /**
   * Counts how many tags wrapped past the first row. Tags stay in normal flow
   * (wrapped rows are clipped by the container), so this read never changes
   * layout and cannot oscillate.
   */
  private measureActiveFilterTags(): void {
    const container = this.activeFiltersRegionEl;
    if (!container) {
      this.setVisibleActiveFilterCount(null);
      return;
    }
    const tagElements = Array.from(
      container.querySelectorAll<HTMLElement>('.cx-filter-bar__active-filter'),
    );
    if (tagElements.length === 0) {
      this.setVisibleActiveFilterCount(null);
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
      this.setVisibleActiveFilterCount(null);
      return;
    }
    // The pill occupies row space too; without this check a single tag that
    // fits on its own could stay collapsed behind a "+1" forever.
    const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
    const totalWidth =
      tagElements.reduce((sum, element) => sum + element.offsetWidth, 0) +
      gap * (tagElements.length - 1);
    if (totalWidth <= container.clientWidth) {
      this.setVisibleActiveFilterCount(null);
      return;
    }
    this.setVisibleActiveFilterCount(tagElements.length - wrappedCount);
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
