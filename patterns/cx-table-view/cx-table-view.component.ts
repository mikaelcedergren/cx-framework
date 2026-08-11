import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import {
  CxFilterBarComponent,
  type CxFilterBarColumnOption,
  type CxFilterBarFilter,
  type CxFilterBarMode,
} from '../cx-filter-bar';
import { type CxToggleChipGroupOption } from '../../primitives/inputs/cx-toggle-chip-group';
import {
  CxTableComponent,
  type CxTableColumn,
  type CxTableDensity,
  type CxTableRowActivation,
  type CxTableSelectionMode,
  type CxTableColumnPinChangeEvent,
  type CxTableColumnVisibilityChangeEvent,
  type CxTableRowActivateEvent,
  type CxTableRow,
  type CxTableRowMenuSelectEvent,
  type CxTableSort,
  type CxTableSortDirection,
} from '../../primitives/data/cx-table';
import {
  type CxColumnFilterLoadMoreEvent,
  type CxColumnFilterQueryChangeEvent,
  type CxColumnFilterValueMap,
  normalizeCxColumnFilterValueMap,
} from '../../primitives/data/cx-column-filter-editor';
import { type CxButtonGroupOption } from '../../primitives/actions/cx-button-group';
import { type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';
import { type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxPaginationComponent, type CxPaginationPage } from '../../primitives/navigation/cx-pagination';
import { CxActionBarComponent, type CxActionBarData } from '../cx-action-bar';

export type CxTableViewPaginationMode = 'none' | 'pages';

@Component({
  selector: 'cx-table-view',
  imports: [CommonModule, CxActionBarComponent, CxFilterBarComponent, CxPaginationComponent, CxTableComponent],
  templateUrl: './cx-table-view.component.html',
  styleUrl: './cx-table-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTableViewComponent {
  private readonly columnsState = signal<CxTableColumn[]>([]);
  private readonly filterValuesState = signal<CxColumnFilterValueMap>({});

  @ViewChild(CxFilterBarComponent)
  private readonly filterBar?: CxFilterBarComponent;

  @ViewChild(CxTableComponent)
  private readonly table?: CxTableComponent;

  @Input() heading = '';
  @Input() showFilterBar = true;
  @Input() showActiveFilters = true;
  @Input() filterBarMode: CxFilterBarMode = 'filters';
  @Input() quickFilters: CxButtonGroupOption[] = [];
  @Input() selectedQuickFilterId: string | undefined;
  @Input() toggleFilters: CxToggleChipGroupOption[] = [];
  @Input() selectedToggleFilterIds: string[] = [];
  @Input() queryValue = '';
  @Input() queryAriaLabel = 'Search query';
  @Input() savedViews: CxMenuItem[] = [];
  @Input() groupByOptions: CxButtonGroupOption[] = [];
  @Input() groupBy = 'none';
  @Input() sortOptions: CxDropdownOption[] = [];
  @Input() sortBy: string | undefined = 'none';
  @Input() sortDirection: CxTableSortDirection = 'asc';
  @Input() thenBy: string | undefined = 'none';
  @Input() thenByDirection: CxTableSortDirection = 'asc';
  @Input() columnOptions: CxFilterBarColumnOption[] = [];
  @Input() visibleColumnIds: string[] = [];
  @Input() pinnedColumnIds: string[] = [];
  @Input()
  public set columns(value: CxTableColumn[] | undefined) {
    this.columnsState.set(value ?? []);
  }
  public get columns(): CxTableColumn[] {
    return this.columnsState();
  }
  @Input() rows: CxTableRow[] = [];
  @Input() density: CxTableDensity = 'compact';
  @Input() rowActivation: CxTableRowActivation = 'none';
  @Input() showHeaders = true;
  @Input() columnsResizable = true;
  @Input() columnsReorderable = true;
  @Input() stickyHeader = false;
  @Input() zebra = false;
  @Input() loading = false;
  @Input() showRowActions = true;
  @Input() rightClickMenu = true;
  @Input() emptyText = 'No results to display.';
  @Input() noMatchesText = 'No results match the current filters.';
  @Input() sort: CxTableSort | undefined;
  @Input() activeRowId: string | undefined;
  @Input() selectionMode: CxTableSelectionMode = 'none';
  @Input() selectedRowIds: string[] = [];
  @Input() paginationMode: CxTableViewPaginationMode = 'none';
  @Input() page: CxPaginationPage | undefined;
  @Input() pageSizes: readonly number[] = [10, 25, 50, 100];
  @Input() actionBarData: CxActionBarData | undefined;

  @Input()
  public set filterValues(value: CxColumnFilterValueMap | undefined) {
    this.filterValuesState.set({ ...(value ?? {}) });
  }

  @Output() readonly filterBarModeChange = new EventEmitter<CxFilterBarMode>();
  @Output() readonly selectedQuickFilterIdChange = new EventEmitter<string>();
  @Output() readonly selectedToggleFilterIdsChange = new EventEmitter<string[]>();
  @Output() readonly filterValuesChange = new EventEmitter<CxColumnFilterValueMap>();
  @Output() readonly filterQueryChange = new EventEmitter<CxColumnFilterQueryChangeEvent>();
  @Output() readonly filterLoadMore = new EventEmitter<CxColumnFilterLoadMoreEvent>();
  @Output() readonly queryValueChange = new EventEmitter<string>();
  @Output() readonly savedViewSelect = new EventEmitter<string>();
  @Output() readonly activeSavedViewIdChange = new EventEmitter<string | undefined>();
  @Output() readonly densityChange = new EventEmitter<CxTableDensity>();
  @Output() readonly groupByChange = new EventEmitter<string>();
  @Output() readonly sortByChange = new EventEmitter<string | undefined>();
  @Output() readonly sortDirectionChange = new EventEmitter<CxTableSortDirection>();
  @Output() readonly thenByChange = new EventEmitter<string | undefined>();
  @Output() readonly thenByDirectionChange = new EventEmitter<CxTableSortDirection>();
  @Output() readonly visibleColumnIdsChange = new EventEmitter<string[]>();
  @Output() readonly pinnedColumnIdsChange = new EventEmitter<string[]>();
  @Output() readonly exportTable = new EventEmitter<void>();
  @Output() readonly resetTable = new EventEmitter<void>();
  @Output() readonly sortChange = new EventEmitter<CxTableSort | undefined>();
  @Output() readonly columnOrderChange = new EventEmitter<string[]>();
  @Output() readonly activeRowIdChange = new EventEmitter<string>();
  @Output() readonly rowActivate = new EventEmitter<CxTableRowActivateEvent>();
  @Output() readonly selectedRowIdsChange = new EventEmitter<string[]>();
  @Output() readonly rowMenuItemSelect = new EventEmitter<CxTableRowMenuSelectEvent>();
  @Output() readonly pageChange = new EventEmitter<CxPaginationPage>();
  @Output() readonly actionBarDeselectAll = new EventEmitter<void>();
  @Output() readonly actionBarAction = new EventEmitter<string>();

  protected get hasHeading(): boolean {
    return this.heading.trim().length > 0;
  }

  protected get showPagination(): boolean {
    return this.paginationMode === 'pages' && this.page !== undefined;
  }

  protected readonly filters$ = computed<CxFilterBarFilter[]>(() =>
    this.columnsState()
      .filter((column): column is CxTableColumn & { filter: NonNullable<CxTableColumn['filter']> } =>
        column.filter !== undefined,
      )
      .map(column => ({
        id: column.id,
        label: column.label,
        filter: column.filter,
      })),
  );
  protected readonly resolvedFilterValues$ = computed(() =>
    normalizeCxColumnFilterValueMap(
      Object.fromEntries(this.filters$().map(filter => [filter.id, filter.filter])),
      this.filterValuesState(),
    ),
  );

  protected get visibleColumns(): CxTableColumn[] {
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

  private columnIsPinnable(column: CxTableColumn, columnOptionsById: Map<string, CxFilterBarColumnOption>): boolean {
    const option = columnOptionsById.get(column.id);
    return column.pinnable ?? (option !== undefined && option.pinnable !== false);
  }

  private columnIsHideable(column: CxTableColumn, columnOptionsById: Map<string, CxFilterBarColumnOption>): boolean {
    return column.hideable ?? columnOptionsById.has(column.id);
  }

  protected onColumnPinChange(event: CxTableColumnPinChangeEvent): void {
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

  protected onColumnVisibilityChange(event: CxTableColumnVisibilityChangeEvent): void {
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

  protected onFilterValuesChange(values: CxColumnFilterValueMap): void {
    this.filterValuesState.set(values);
    this.filterBar?.invalidateSavedViewSelection();
    this.filterValuesChange.emit(values);
  }

  protected onFilterPopoverOpenChange(open: boolean): void {
    if (open) {
      this.table?.closeColumnHeaderMenu(false);
    }
  }

  protected onColumnHeaderMenuOpenChange(open: boolean): void {
    if (open) {
      this.filterBar?.closeFilterPopover(false);
    }
  }

  private resolvedVisibleColumnIds(): string[] {
    return this.visibleColumnIds.length > 0 ? this.visibleColumnIds : this.columns.map(column => column.id);
  }
}
