import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CxFilterBarComponent,
  type CxFilterBarColumnOption,
  type CxFilterBarMode,
  type CxFilterBarSection,
} from '../cx-filter-bar';
import {
  CxTableComponent,
  type CxTableColumn,
  type CxTableDensity,
  type CxTableRowActivation,
  type CxTableSelectionMode,
  type CxTableColumnPinChangeEvent,
  type CxTableColumnSearchChangeEvent,
  type CxTableColumnVisibilityChangeEvent,
  type CxTableRowActivateEvent,
  type CxTableRow,
  type CxTableRowMenuSelectEvent,
  type CxTableSort,
  type CxTableSortDirection,
} from '../../primitives/data/cx-table';
import { type CxButtonGroupOption } from '../../primitives/actions/cx-button-group';
import { type CxSelectOption } from '../../primitives/inputs/cx-select';
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
  @Input() heading = '';
  @Input() showFilterBar = true;
  @Input() filterBarMode: CxFilterBarMode = 'filters';
  @Input() quickFilters: CxButtonGroupOption[] = [];
  @Input() selectedQuickFilterId: string | undefined;
  @Input() filterOptions: CxSelectOption[] = [];
  @Input() selectedFilterValue: string | undefined;
  @Input() filterPlaceholder = 'Status';
  @Input() queryValue = '';
  @Input() queryPlaceholder = 'Type query';
  @Input() filterSections: CxFilterBarSection[] = [];
  @Input() savedViews: CxMenuItem[] = [];
  @Input() groupByOptions: CxButtonGroupOption[] = [];
  @Input() groupBy = 'none';
  @Input() sortOptions: CxSelectOption[] = [];
  @Input() sortBy: string | undefined = 'none';
  @Input() sortDirection: CxTableSortDirection = 'asc';
  @Input() thenBy: string | undefined = 'none';
  @Input() thenByDirection: CxTableSortDirection = 'asc';
  @Input() columnOptions: CxFilterBarColumnOption[] = [];
  @Input() visibleColumnIds: string[] = [];
  @Input() pinnedColumnIds: string[] = [];
  @Input() columnSearchValues: Record<string, string> = {};
  @Input() columns: CxTableColumn[] = [];
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
  @Input() sort: CxTableSort | undefined;
  @Input() activeRowId: string | undefined;
  @Input() selectionMode: CxTableSelectionMode = 'none';
  @Input() selectedRowIds: string[] = [];
  @Input() paginationMode: CxTableViewPaginationMode = 'none';
  @Input() page: CxPaginationPage | undefined;
  @Input() pageSizes: readonly number[] = [10, 25, 50, 100];
  @Input() actionBarData: CxActionBarData | undefined;

  @Output() readonly filterBarModeChange = new EventEmitter<CxFilterBarMode>();
  @Output() readonly selectedQuickFilterIdChange = new EventEmitter<string>();
  @Output() readonly selectedFilterValueChange = new EventEmitter<string | undefined>();
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
  @Output() readonly columnSearchChange = new EventEmitter<CxTableColumnSearchChangeEvent>();
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

  private resolvedVisibleColumnIds(): string[] {
    return this.visibleColumnIds.length > 0 ? this.visibleColumnIds : this.columns.map(column => column.id);
  }
}
