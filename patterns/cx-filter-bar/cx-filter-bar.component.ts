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
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';
import { CxToggleChipGroupComponent } from '../../primitives/inputs/cx-toggle-chip-group';
import {
  CxSelectComponent,
  type CxSelectOption,
} from '../../primitives/inputs/cx-select';
import {
  CxMenuComponent,
  type CxMenuItem,
} from '../../primitives/overlay/cx-menu';
import { CxMenuLabelComponent } from '../../primitives/overlay/cx-menu-label';
import { CxExpansionPanelComponent } from '../../primitives/display/cx-expansion-panel';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover';
import { measureCxFloatingSurface } from '../../primitives/overlay/floating-surface';

export type CxFilterBarMode = 'filters' | 'query' | 'jql';
type CxFilterBarResolvedMode = 'filters' | 'query';
export type CxFilterBarDisplayMode = 'compact' | 'comfortable';
export type CxFilterBarSortDirection = 'asc' | 'desc';

export interface CxFilterBarSection {
  id: string;
  label: string;
  description?: string;
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
    CxIconButtonComponent,
    CxTextFieldComponent,
    CxSelectComponent,
    CxMenuComponent,
    CxMenuLabelComponent,
    CxPopoverComponent,
    CxExpansionPanelComponent,
    CxSwitchComponent,
    CxToggleButtonComponent,
    CxToggleChipGroupComponent,
  ],
  templateUrl: './cx-filter-bar.component.html',
  styleUrl: './cx-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFilterBarComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly modeState = signal<CxFilterBarResolvedMode>('filters');
  private readonly quickFiltersState = signal<CxButtonGroupOption[]>([]);
  private readonly selectedQuickFilterIdState = signal<string | undefined>(undefined);
  private readonly filterOptionsState = signal<CxSelectOption[]>([]);
  private readonly selectedFilterValueState = signal<string | undefined>(undefined);
  private readonly queryValueState = signal('');
  private readonly filterSectionsState = signal<CxFilterBarSection[]>([]);
  private readonly savedViewsState = signal<CxMenuItem[]>([]);
  private readonly activeSavedViewIdState = signal<string | undefined>(undefined);
  private readonly displayModeState = signal<CxFilterBarDisplayMode>('compact');
  private readonly groupByOptionsState = signal<CxButtonGroupOption[]>([]);
  private readonly groupByState = signal('none');
  private readonly sortOptionsState = signal<CxSelectOption[]>([]);
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
  private readonly presetSelectionState = signal<'recommended' | 'all'>('recommended');
  private resizeObserver?: ResizeObserver;

  @ViewChild('filterTriggerAnchor', { read: ElementRef })
  private filterTriggerRef?: ElementRef<HTMLElement>;

  @ViewChild('propertiesTriggerAnchor', { read: ElementRef })
  private propertiesTriggerRef?: ElementRef<HTMLElement>;

  @ViewChild('filterPopover')
  private filterPopoverRef?: CxPopoverComponent;

  @ViewChild('propertiesPopover')
  private propertiesPopoverRef?: CxPopoverComponent;

  @Input() filterPlaceholder = 'Status';
  @Input() queryPlaceholder = 'Type query';
  @Input() columnSearchPlaceholder = 'Search columns';

  @Input()
  public set mode(value: CxFilterBarMode | undefined) {
    this.modeState.set(value === 'query' || value === 'jql' ? 'query' : 'filters');
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
  public set filterOptions(value: CxSelectOption[]) {
    this.filterOptionsState.set(value ?? []);
  }

  @Input()
  public set selectedFilterValue(value: string | undefined) {
    this.selectedFilterValueState.set(value);
  }

  @Input()
  public set queryValue(value: string | undefined) {
    this.queryValueState.set(value ?? '');
  }

  @Input()
  public set filterSections(value: CxFilterBarSection[]) {
    this.filterSectionsState.set(value ?? []);
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
  public set sortOptions(value: CxSelectOption[] | undefined) {
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
  @Output() readonly selectedFilterValueChange = new EventEmitter<string | undefined>();
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
  @Output() readonly exportTable = new EventEmitter<void>();
  @Output() readonly resetTable = new EventEmitter<void>();

  protected readonly mode$ = this.modeState.asReadonly();
  protected readonly quickFilters$ = this.quickFiltersState.asReadonly();
  protected readonly selectedQuickFilterId$ = this.selectedQuickFilterIdState.asReadonly();
  protected readonly filterOptions$ = this.filterOptionsState.asReadonly();
  protected readonly selectedFilterValue$ = this.selectedFilterValueState.asReadonly();
  protected readonly queryValue$ = this.queryValueState.asReadonly();
  protected readonly filterSections$ = this.filterSectionsState.asReadonly();
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
  protected readonly presetSelection$ = this.presetSelectionState.asReadonly();
  protected readonly filteredColumnOptions$ = computed(() => {
    const query = this.columnSearchValueState().trim().toLowerCase();
    const options = this.columnOptionsState();
    if (!query) {
      return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(query));
  });
  protected readonly hasGroupByControls$ = computed(() => this.groupByOptionsState().length > 0);
  protected readonly groupByChipOptions$ = computed(() =>
    this.groupByOptionsState().map(option => ({
      id: option.id,
      label: option.label ?? option.name ?? option.id,
      disabled: option.disabled,
    })),
  );
  protected readonly groupByValues$ = computed(() => [this.groupByState()]);
  protected readonly hasSortControls$ = computed(() => this.sortOptionsState().length > 0);
  protected readonly hasThenByControls$ = computed(() => {
    const sortBy = this.sortByState();
    return this.sortOptionsState().length > 0 && sortBy !== undefined && sortBy !== 'none';
  });
  protected readonly hasColumnControls$ = computed(() => this.columnOptionsState().length > 0);
  protected readonly resolvedSavedViews$ = computed<CxMenuItem[]>(() =>
    this.savedViewsState().map(item => ({
      ...item,
      appendIcon:
        item.trackSelection === false
          ? undefined
          : this.activeSavedViewIdState() === item.id
            ? 'check'
            : undefined,
    })),
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
  protected readonly presetOptions: CxButtonGroupOption[] = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'all', label: 'All filters' },
  ];

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
    });
    const filterTrigger = this.filterTriggerRef?.nativeElement;
    if (filterTrigger) {
      this.resizeObserver.observe(filterTrigger);
    }
    const propertiesTrigger = this.propertiesTriggerRef?.nativeElement;
    if (propertiesTrigger) {
      this.resizeObserver.observe(propertiesTrigger);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected onQuickFilterSelect(value: string | undefined): void {
    if (!value) {
      return;
    }
    this.selectedQuickFilterIdState.set(value);
    this.selectedQuickFilterIdChange.emit(value);
    this.clearSavedViewSelection();
  }

  protected onFilterValueChange(value: string | undefined): void {
    this.selectedFilterValueState.set(value);
    this.selectedFilterValueChange.emit(value);
    this.clearSavedViewSelection();
  }

  protected onQueryChange(value: string): void {
    this.queryValueState.set(value);
    this.queryValueChange.emit(value);
    this.clearSavedViewSelection();
  }

  protected onSavedViewSelect(itemId: string): void {
    const item = this.savedViewsState().find(candidate => candidate.id === itemId);
    const nextActiveId = item?.trackSelection === false ? undefined : itemId;
    this.activeSavedViewIdState.set(nextActiveId);
    this.activeSavedViewIdChange.emit(nextActiveId);
    this.savedViewSelect.emit(itemId);
    this.filterPopoverOpenState.set(false);
    this.propertiesPopoverOpenState.set(false);
  }

  protected onSavedViewsOpenChange(open: boolean): void {
    if (!open) {
      return;
    }
    this.filterPopoverOpenState.set(false);
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
      this.clearSavedViewSelection();
    }
  }

  protected onOverflowOpenChange(open: boolean): void {
    if (!open) {
      return;
    }
    this.filterPopoverOpenState.set(false);
    this.propertiesPopoverOpenState.set(false);
  }

  protected onPresetSelect(value: string | undefined): void {
    this.presetSelectionState.set(value === 'all' ? 'all' : 'recommended');
  }

  protected onDisplayModeSelect(value: string | undefined): void {
    const next = value === 'comfortable' ? 'comfortable' : 'compact';
    this.displayModeState.set(next);
    this.displayModeChange.emit(next);
    this.clearSavedViewSelection();
  }

  protected onGroupBySelect(value: string | undefined): void {
    const next = value?.trim() || 'none';
    this.groupByState.set(next);
    this.groupByChange.emit(next);
    this.clearSavedViewSelection();
  }

  protected onGroupByValuesSelect(values: string[]): void {
    this.onGroupBySelect(values[0]);
  }

  protected onSortByValueChange(value: string | undefined): void {
    const next = value ?? 'none';
    this.sortByState.set(next);
    this.sortByChange.emit(next);
    if (next === 'none') {
      this.thenByState.set('none');
      this.thenByChange.emit('none');
    }
    this.clearSavedViewSelection();
  }

  protected onThenByValueChange(value: string | undefined): void {
    const next = value ?? 'none';
    this.thenByState.set(next);
    this.thenByChange.emit(next);
    this.clearSavedViewSelection();
  }

  protected toggleSortDirection(): void {
    if (!this.hasActivePrimarySort()) {
      return;
    }
    const next = this.sortDirectionState() === 'desc' ? 'asc' : 'desc';
    this.sortDirectionState.set(next);
    this.sortDirectionChange.emit(next);
    this.clearSavedViewSelection();
  }

  protected toggleThenByDirection(): void {
    if (!this.hasActiveSecondarySort()) {
      return;
    }
    const next = this.thenByDirectionState() === 'desc' ? 'asc' : 'desc';
    this.thenByDirectionState.set(next);
    this.thenByDirectionChange.emit(next);
    this.clearSavedViewSelection();
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
    this.clearSavedViewSelection();
  }

  protected resetColumns(): void {
    const next = this.columnOptionsState().map(option => option.id);
    this.visibleColumnIdsState.set(next);
    this.visibleColumnIdsChange.emit(next);
    this.pinnedColumnIdsState.set([]);
    this.pinnedColumnIdsChange.emit([]);
    this.clearSavedViewSelection();
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
    this.clearSavedViewSelection();
  }

  protected toggleFilterPopover(): void {
    if (this.modeState() !== 'filters') {
      return;
    }
    this.propertiesPopoverOpenState.set(false);
    const next = !this.filterPopoverOpenState();
    if (next) {
      this.syncFilterPopoverMetrics();
    }
    this.filterPopoverOpenState.set(next);
  }

  protected togglePropertiesPopover(): void {
    this.filterPopoverOpenState.set(false);
    const next = !this.propertiesPopoverOpenState();
    if (next) {
      this.syncPropertiesPopoverMetrics();
    }
    this.propertiesPopoverOpenState.set(next);
  }

  protected closeFloatingPopovers(): void {
    this.filterPopoverOpenState.set(false);
    this.propertiesPopoverOpenState.set(false);
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

  protected hasActivePrimarySort(): boolean {
    const sortBy = this.sortByState();
    return sortBy !== undefined && sortBy !== 'none';
  }

  protected hasActiveSecondarySort(): boolean {
    const thenBy = this.thenByState();
    return thenBy !== undefined && thenBy !== 'none';
  }

  protected sectionBody(section: CxFilterBarSection): string {
    return section.description?.trim() || `Configure ${section.label.toLowerCase()} filters here.`;
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.filterPopoverOpenState() && !this.propertiesPopoverOpenState()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node) || !this.pointerTargetIsInsideFilterBar(target)) {
      this.closeFloatingPopovers();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.propertiesPopoverOpenState()) {
      this.propertiesPopoverOpenState.set(false);
      return;
    }
    if (this.filterPopoverOpenState()) {
      this.filterPopoverOpenState.set(false);
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

  private applyMode(mode: CxFilterBarResolvedMode): void {
    this.modeState.set(mode);
    this.modeChange.emit(mode);
    this.filterPopoverOpenState.set(false);
    this.propertiesPopoverOpenState.set(false);
    this.clearSavedViewSelection();
  }

  private clearSavedViewSelection(): void {
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
    const estimatedHeight = Math.min(Math.max(this.filterSectionsState().length, 1) * 68 + 144, 520);
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: 560,
      estimatedHeight,
      align: 'start',
    });

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
    });

    this.propertiesPopoverWidthState.set(surface.width);
    this.propertiesPopoverLeftState.set(surface.left);
    this.propertiesPopoverTopState.set(surface.top);
    this.propertiesPopoverBottomState.set(surface.bottom);
    this.propertiesPopoverMaxHeightState.set(surface.maxHeight);
    this.propertiesPopoverPlacementState.set(surface.placement);
  }
}
