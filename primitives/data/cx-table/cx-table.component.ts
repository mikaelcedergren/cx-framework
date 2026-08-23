import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Injector,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
} from '../../overlay/cx-menu';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxOptionComponent } from '../../overlay/cx-option';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';
import {
  measureCxFloatingSurface,
  type CxFloatingSurfacePlacement,
} from '../../overlay/floating-surface';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import {
  CxSeverityTagComponent,
  type CxSeverityLevel,
  type CxSeverityTagFavor,
} from '../../display/cx-severity-tag';
import {
  CxStatusTagComponent,
  type CxStatusTagMood,
} from '../../display/cx-status-tag';
import {
  CxTagComponent,
  type CxTagColor,
} from '../../display/cx-tag';
import {
  CxTrendTagComponent,
  type CxTrendTagFavor,
  type CxTrendTagUnit,
} from '../../display/cx-trend-tag';
import { CxIconComponent } from '../../media/cx-icon';
import { CxCheckboxComponent } from '../../inputs/cx-checkbox';
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
  summarizeCxColumnFilterValue,
  withCxColumnFilterValue,
} from '../cx-column-filter-editor';

export type CxTableDensity = 'comfortable' | 'compact';
export type CxTableColumnAlign = 'start' | 'end';
export type CxTableSelectionMode = 'none' | 'multiple';
export type CxTableColumnSize = 'content' | 'flex' | string;
export type CxTableRowKind = 'item' | 'folder';
export type CxTableRowActivation = 'none' | 'press' | 'active';
export type CxTableSortDirection = 'asc' | 'desc';

export interface CxTableColumn {
  id: string;
  label: string;
  key?: boolean;
  size?: CxTableColumnSize;
  align?: CxTableColumnAlign;
  sortable?: boolean;
  filter?: CxColumnFilterDefinition;
  hideable?: boolean;
  pinnable?: boolean;
  pinned?: boolean;
}

export interface CxTableSort {
  columnId: string;
  direction: CxTableSortDirection;
}

export type CxTableSeverityCell =
  | {
      kind: 'severity-tag';
      severity: CxSeverityLevel;
      score?: never;
      display?: 'severity';
      favor?: never;
      kev?: boolean;
    }
  | {
      kind: 'severity-tag';
      score: number;
      severity?: never;
      display?: 'severity' | 'grade';
      favor?: CxSeverityTagFavor;
      kev?: boolean;
    };

export type CxTableCell =
  | {
      kind: 'text';
      value: string;
      prependIcon?: CxIconName;
      strong?: boolean;
      muted?: boolean;
    }
  | {
      kind: 'status-tag';
      mood: CxStatusTagMood;
      text: string;
      icon?: CxIconName;
    }
  | CxTableSeverityCell
  | {
      kind: 'trend-tag';
      amount: number;
      favor?: CxTrendTagFavor;
      unit?: CxTrendTagUnit;
    }
  | {
      kind: 'tag';
      label: string;
      color?: CxTagColor;
      outline?: boolean;
    };

export interface CxTableRow {
  id: string;
  kind?: CxTableRowKind;
  cells: Record<string, CxTableCell | undefined>;
  menuItems?: CxMenuItem[];
}

export interface CxTableRowMenuSelectEvent {
  rowId: string;
  itemId: string;
}

export interface CxTableRowActivateEvent {
  rowId: string;
  kind: CxTableRowKind;
}

export interface CxTableColumnPinChangeEvent {
  columnId: string;
  pinned: boolean;
}

export interface CxTableColumnVisibilityChangeEvent {
  columnId: string;
  visible: boolean;
}

type CxTableColumnHeaderAction = 'sort-asc' | 'sort-desc' | 'pin' | 'unpin' | 'hide';

const CX_TABLE_MAX_PINNED_COLUMNS = 3;
const CX_TABLE_MIN_UNPINNED_WIDTH = 144;
const CX_TABLE_MIN_UNPINNED_RATIO = 0.35;
const CX_TABLE_SELECTION_COLUMN_WIDTH = 32;
const CX_TABLE_HEADER_MENU_WIDTH = 320;

type CxTableDropIndicator =
  | {
      columnId: string;
      position: 'before' | 'after';
    }
  | undefined;

type CxTableDragPreview =
  | {
      label: string;
      left: number;
      top: number;
    }
  | undefined;

type CxTableContextMenuState = {
  rowId: string;
  point: { left: number; top: number };
  invocation: 'pointer' | 'keyboard';
  originRow?: HTMLElement;
};

const CX_TABLE_COLUMN_MIN_WIDTH = 72;
const CX_TABLE_COLUMN_MAX_WIDTH = 640;
const CX_TABLE_COLUMN_RESIZE_STEP = 8;
const CX_TABLE_COLUMN_RESIZE_LARGE_STEP = 32;

const CX_TABLE_INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'grid',
  'gridcell',
  'link',
  'listbox',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'radiogroup',
  'scrollbar',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'tablist',
  'textbox',
  'toolbar',
  'tree',
  'treegrid',
  'treeitem',
]);

function hasSerializableFilterValue(value: CxColumnFilterValue): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  const span = value as { start?: string; end?: string };
  return Boolean(span.start || span.end);
}

@Component({
  selector: 'cx-table',
  imports: [
    CommonModule,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxPopoverComponent,
    CxOptionComponent,
    CxIconButtonComponent,
    CxCheckboxComponent,
    CxSeverityTagComponent,
    CxStatusTagComponent,
    CxTagComponent,
    CxTrendTagComponent,
    CxIconComponent,
    CxTooltipDirective,
    CxColumnFilterEditorComponent,
  ],
  templateUrl: './cx-table.component.html',
  styleUrl: './cx-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTableComponent implements OnDestroy {
  private static instanceCounter = 0;

  private readonly injector = inject(Injector);
  private readonly instanceId = ++CxTableComponent.instanceCounter;
  protected readonly columnHeaderDialogId = `cx-table-${this.instanceId}-column-dialog`;
  protected readonly columnMinWidth = CX_TABLE_COLUMN_MIN_WIDTH;
  protected readonly columnMaxWidth = CX_TABLE_COLUMN_MAX_WIDTH;
  private readonly columnsState = signal<readonly CxTableColumn[]>([]);
  private readonly rowsState = signal<readonly CxTableRow[]>([]);
  private readonly activeRowIdState = signal<string | undefined>(undefined);
  private readonly openRowMenuIdState = signal<string | undefined>(undefined);
  private readonly contextMenuState = signal<CxTableContextMenuState | undefined>(undefined);
  private readonly selectionModeState = signal<CxTableSelectionMode>('none');
  private readonly selectedRowIdsState = signal<string[]>([]);
  private readonly columnOrderState = signal<string[]>([]);
  private readonly columnWidthOverridesState = signal<Record<string, number>>({});
  // The first column carries the key information, so it auto-fits to its
  // content until the user resizes it manually.
  private appliedFirstColumnAutoFit?: { columnId: string; width: number };
  private firstColumnAutoFitTimer?: number;
  private readonly contentWidthsState = signal<Record<string, number>>({});
  private readonly columnLeftOffsetsState = signal<Record<string, number>>({});
  private readonly effectivePinnedColumnIdsState = signal<readonly string[]>([]);
  private readonly resizingColumnIdState = signal<string | undefined>(undefined);
  private readonly draggingColumnIdState = signal<string | undefined>(undefined);
  private readonly dropIndicatorState = signal<CxTableDropIndicator>(undefined);
  private readonly dragPreviewState = signal<CxTableDragPreview>(undefined);
  private pendingContextMenuState?: CxTableContextMenuState;
  private contextMenuTeardownPending = false;
  private destroyed = false;
  private tableViewportResizeObserver?: ResizeObserver;
  private observedTableViewport?: HTMLElement;
  private lastViewportWidth = 0;
  private readonly columnReorderAnnouncementState = signal('');
  private readonly sortState = signal<CxTableSort | undefined>(undefined);
  private readonly filterValuesState = signal<CxColumnFilterValueMap>({});
  private readonly columnHeaderMenuColumnIdState = signal<string | undefined>(undefined);
  private readonly columnHeaderMenuPositionState = signal<
    | {
        left: number;
        top?: number;
        bottom?: number;
        maxHeight: number;
        placement: 'top' | 'bottom';
      }
    | undefined
  >(undefined);
  private columnHeaderMenuTrigger?: HTMLElement;
  // Placement is decided once per open; window-resize re-syncs keep the side
  // so an open header menu never flips.
  private columnHeaderMenuLockedPlacement?: CxFloatingSurfacePlacement;
  private activeResizeSession:
    | {
        columnId: string;
        startX: number;
        startWidth: number;
        pointerId: number;
        handleElement: HTMLElement;
      }
    | undefined;
  private keyboardReorderSession:
    | {
        columnId: string;
        columnLabel: string;
        handleElement: HTMLElement;
        originalOrder: string[];
      }
    | undefined;
  private activeReorderSession:
    | {
        columnId: string;
        columnLabel: string;
        pointerId: number;
        handleElement: HTMLElement;
        originalOrder: string[];
      }
    | undefined;

  @ViewChild('tableElement') private readonly tableElement?: ElementRef<HTMLTableElement>;
  @ViewChild('columnHeaderPopover') private readonly columnHeaderPopover?: CxPopoverComponent;
  @ViewChild(CxColumnFilterEditorComponent)
  private readonly columnFilterEditor?: CxColumnFilterEditorComponent;
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

  @Input()
  public set selectionMode(value: CxTableSelectionMode) {
    this.selectionModeState.set(value ?? 'none');
  }

  @Input()
  public set columns(value: readonly CxTableColumn[]) {
    if (this.activeResizeSession) {
      this.stopResizeSession();
    }
    if (this.activeReorderSession) {
      this.stopReorderSession();
    }
    if (this.keyboardReorderSession) {
      this.cancelKeyboardColumnReorder(false);
    }
    const nextColumns = value ?? [];
    for (const column of nextColumns) {
      if (column.filter) {
        assertCxColumnFilterDefinition(column.filter);
      }
    }
    const nextIds = nextColumns.map(column => column.id);
    const currentOrder = this.columnOrderState();
    const preservedOrder = currentOrder.filter(id => nextIds.includes(id));
    const appendedIds = nextIds.filter(id => !preservedOrder.includes(id));

    this.columnsState.set(nextColumns);
    this.columnOrderState.set(this.normalizeColumnOrder([...preservedOrder, ...appendedIds], nextColumns));
    const openHeaderColumnId = this.columnHeaderMenuColumnIdState();
    if (openHeaderColumnId && !nextIds.includes(openHeaderColumnId)) {
      this.closeColumnHeaderMenu(false);
    }
    this.columnWidthOverridesState.update(current =>
      Object.fromEntries(Object.entries(current).filter(([id]) => nextIds.includes(id))),
    );
    this.scheduleFirstColumnAutoFit();
  }

  @Input()
  public set rows(value: readonly CxTableRow[]) {
    const nextRows = value ?? [];
    const nextRowIds = new Set(nextRows.map(row => row.id));
    this.rowsState.set(nextRows);
    this.scheduleFirstColumnAutoFit();

    const openRowMenuId = this.openRowMenuIdState();
    const openRowMenu = openRowMenuId ? nextRows.find(row => row.id === openRowMenuId) : undefined;
    if (openRowMenuId && (!nextRowIds.has(openRowMenuId) || (openRowMenu?.menuItems?.length ?? 0) === 0)) {
      this.openRowMenuIdState.set(undefined);
    }
    const contextMenu = this.contextMenuState();
    const contextRow = contextMenu ? nextRows.find(row => row.id === contextMenu.rowId) : undefined;
    if (contextMenu && (!nextRowIds.has(contextMenu.rowId) || (contextRow?.menuItems?.length ?? 0) === 0)) {
      this.closeContextMenu(false);
    }
  }

  @Input()
  public set activeRowId(value: string | undefined) {
    this.activeRowIdState.set(value);
  }

  @Input()
  public set selectedRowIds(value: string[] | undefined) {
    this.selectedRowIdsState.set(value ?? []);
  }

  @Input()
  public set filterValues(value: CxColumnFilterValueMap | undefined) {
    this.filterValuesState.set({ ...(value ?? {}) });
  }

  @Input()
  public set sort(value: CxTableSort | undefined) {
    this.sortState.set(value);
  }

  @Output() readonly activeRowIdChange = new EventEmitter<string>();
  @Output() readonly selectedRowIdsChange = new EventEmitter<string[]>();
  @Output() readonly rowMenuItemSelect = new EventEmitter<CxTableRowMenuSelectEvent>();
  @Output() readonly rowActivate = new EventEmitter<CxTableRowActivateEvent>();
  @Output() readonly columnOrderChange = new EventEmitter<string[]>();
  @Output() readonly sortChange = new EventEmitter<CxTableSort | undefined>();
  @Output() readonly filterValuesChange = new EventEmitter<CxColumnFilterValueMap>();
  @Output() readonly filterQueryChange = new EventEmitter<CxColumnFilterQueryChangeEvent>();
  @Output() readonly filterLoadMore = new EventEmitter<CxColumnFilterLoadMoreEvent>();
  @Output() readonly columnHeaderMenuOpenChange = new EventEmitter<boolean>();
  @Output() readonly columnPinChange = new EventEmitter<CxTableColumnPinChangeEvent>();
  @Output() readonly columnVisibilityChange = new EventEmitter<CxTableColumnVisibilityChangeEvent>();

  protected readonly columns$ = computed(() => {
    const columns = this.columnsState();
    const columnMap = new Map(columns.map(column => [column.id, column]));
    const ordered = this.columnOrderState()
      .map(id => columnMap.get(id))
      .filter((column): column is CxTableColumn => column !== undefined);

    const orderedIds = new Set(ordered.map(column => column.id));
    const resolvedColumns = ordered.length === columns.length
      ? ordered
      : [...ordered, ...columns.filter(column => !orderedIds.has(column.id))];
    return [
      ...resolvedColumns.filter(column => column.pinned === true),
      ...resolvedColumns.filter(column => column.pinned !== true),
    ];
  });
  protected readonly rows$ = this.rowsState.asReadonly();
  protected readonly activeRowId$ = this.activeRowIdState.asReadonly();
  protected readonly selectedRowIds$ = this.selectedRowIdsState.asReadonly();
  protected readonly openRowMenuId$ = this.openRowMenuIdState.asReadonly();
  protected readonly contextMenu$ = this.contextMenuState.asReadonly();
  protected readonly contextMenuItems$ = computed(() => {
    const contextMenu = this.contextMenuState();
    return contextMenu
      ? this.rowsState().find(row => row.id === contextMenu.rowId)?.menuItems ?? []
      : [];
  });
  protected readonly resizingColumnId$ = this.resizingColumnIdState.asReadonly();
  protected readonly draggingColumnId$ = this.draggingColumnIdState.asReadonly();
  protected readonly dropIndicator$ = this.dropIndicatorState.asReadonly();
  protected readonly dragPreview$ = this.dragPreviewState.asReadonly();
  protected readonly columnReorderAnnouncement$ = this.columnReorderAnnouncementState.asReadonly();
  protected readonly sort$ = this.sortState.asReadonly();
  protected readonly filterValues$ = this.filterValuesState.asReadonly();
  protected readonly columnLeftOffsets$ = this.columnLeftOffsetsState.asReadonly();
  protected readonly columnHeaderMenuPosition$ = this.columnHeaderMenuPositionState.asReadonly();
  protected readonly skeletonRows = Array.from({ length: 5 }, (_, index) => index);
  protected readonly hasRowMenus$ = computed(() =>
    this.rowsState().some(row => (row.menuItems?.length ?? 0) > 0),
  );
  protected readonly hasRowSelection$ = computed(() => this.selectionModeState() === 'multiple');
  protected readonly rowIds$ = computed(() => this.rowsState().map(row => row.id));
  protected readonly selectedVisibleRowIds$ = computed(() => {
    const visibleRowIds = new Set(this.rowIds$());
    return this.selectedRowIdsState().filter(rowId => visibleRowIds.has(rowId));
  });
  protected readonly allRowsSelected$ = computed(() => {
    const rowIds = this.rowIds$();
    return rowIds.length > 0 && this.selectedVisibleRowIds$().length === rowIds.length;
  });
  protected readonly partiallySelectedRows$ = computed(() => {
    const selectedCount = this.selectedVisibleRowIds$().length;
    return selectedCount > 0 && !this.allRowsSelected$();
  });
  protected readonly activeFilterCount$ = computed(() => {
    const definitions = new Map(
      this.columnsState()
        .filter((column): column is CxTableColumn & { filter: CxColumnFilterDefinition } =>
          column.filter !== undefined,
        )
        .map(column => [column.id, column.filter]),
    );
    return Object.entries(this.filterValuesState()).filter(([columnId, value]) => {
      const definition = definitions.get(columnId);
      return definition
        ? isCxColumnFilterValueActive(definition, value)
        : hasSerializableFilterValue(value);
    }).length;
  });

  constructor() {
    afterRenderEffect(() => {
      const columns = this.columnsState();
      this.rowsState();
      // Selection owns a real sticky leading column. Reading the mode here
      // reruns this post-render measurement after that column enters or leaves
      // the DOM, so existing pinned columns never retain its old offset.
      this.selectionModeState();

      if (this.resizingColumnIdState() || this.draggingColumnIdState()) {
        return;
      }
      if (!this.tableElement?.nativeElement) {
        return;
      }

      this.observeTableViewport();

      const current = this.contentWidthsState();
      const overrides = this.columnWidthOverridesState();
      const next: Record<string, number> = {};
      let changed = false;

      for (const column of columns) {
        if (column.size !== 'content') continue;
        if (overrides[column.id] !== undefined) continue;
        const measured = this.autoFitColumnWidth(column.id);
        next[column.id] = measured;
        if (current[column.id] !== measured) changed = true;
      }

      for (const key of Object.keys(current)) {
        if (next[key] === undefined) {
          changed = true;
        }
      }

      if (changed) {
        this.contentWidthsState.set(next);
      }

      this.syncPinnedColumnOffsets();
    });
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
    this.tableViewportResizeObserver?.disconnect();
    this.tableViewportResizeObserver = undefined;
    this.observedTableViewport = undefined;
    this.pendingContextMenuState = undefined;
    if (typeof window !== 'undefined' && this.firstColumnAutoFitTimer !== undefined) {
      window.clearTimeout(this.firstColumnAutoFitTimer);
    }
    this.stopResizeSession();
    this.stopReorderSession();
    this.cancelKeyboardColumnReorder(false);
    this.closeContextMenu(false);
    this.closeColumnHeaderMenu(false);
  }

  protected activateRow(row: CxTableRow): void {
    if (this.rowActivation === 'none') {
      return;
    }

    if (this.rowActivation === 'active' && this.activeRowIdState() !== row.id) {
      this.activeRowIdState.set(row.id);
      this.activeRowIdChange.emit(row.id);
    }

    this.rowActivate.emit({
      rowId: row.id,
      kind: this.rowKind(row),
    });
  }

  protected onRowClick(event: MouseEvent, row: CxTableRow, rowElement?: HTMLElement): void {
    if (event.button !== 0 || this.eventComesFromInteractiveDescendant(event, rowElement)) {
      return;
    }
    this.activateRow(row);
  }

  protected onRowKeydown(event: KeyboardEvent, row: CxTableRow, rowElement?: HTMLElement): void {
    if (!this.rowOwnsKeyboardEvent(event, rowElement)) {
      return;
    }
    if (this.rightClickMenu && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
      event.preventDefault();
      event.stopPropagation();
      this.openRowContextMenu(row, rowElement, undefined, 'keyboard');
      return;
    }

    if (this.rowActivation === 'none') {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.activateRow(row);
  }

  protected onRowContextMenu(event: MouseEvent, row: CxTableRow, rowElement?: HTMLElement): void {
    if (!this.rightClickMenu || (row.menuItems?.length ?? 0) === 0) {
      return;
    }
    if (this.eventComesFromInteractiveDescendant(event, rowElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.openRowContextMenu(row, rowElement, { left: event.clientX, top: event.clientY }, 'pointer');
  }

  protected onRowMenuOpenChange(rowId: string, open: boolean): void {
    if (open) {
      this.closeContextMenu(false);
      this.closeColumnHeaderMenu(false);
      this.openRowMenuIdState.set(rowId);
      return;
    }

    if (this.openRowMenuIdState() === rowId) {
      this.openRowMenuIdState.set(undefined);
    }
  }

  protected onRowMenuItemSelect(rowId: string, itemId: string): void {
    this.rowMenuItemSelect.emit({ rowId, itemId });
  }

  protected onContextMenuItemSelect(itemId: string): void {
    const contextMenu = this.contextMenuState();
    if (!contextMenu) {
      return;
    }

    this.rowMenuItemSelect.emit({ rowId: contextMenu.rowId, itemId });
  }

  protected onContextMenuOpenChange(open: boolean): void {
    if (!open) {
      this.closeContextMenu(true);
    }
  }

  protected closeContextMenu(restoreFocus = true): void {
    this.pendingContextMenuState = undefined;
    const contextMenu = this.contextMenuState();
    if (!contextMenu) {
      return;
    }
    this.contextMenuState.set(undefined);

    if (!this.destroyed && !this.contextMenuTeardownPending) {
      this.contextMenuTeardownPending = true;
      afterNextRender(() => {
        if (this.destroyed) {
          return;
        }
        this.contextMenuTeardownPending = false;
        const pendingContextMenu = this.pendingContextMenuState;
        this.pendingContextMenuState = undefined;
        if (pendingContextMenu) {
          this.contextMenuState.set(pendingContextMenu);
        }
      }, { injector: this.injector });
    }

    if (restoreFocus && contextMenu.invocation === 'keyboard' && contextMenu.originRow?.isConnected) {
      queueMicrotask(() => contextMenu.originRow?.focus());
    }
  }

  protected isRowSelected(rowId: string): boolean {
    return this.selectedRowIdsState().includes(rowId);
  }

  protected toggleAllRowsSelection(checked: boolean): void {
    if (this.selectionModeState() !== 'multiple') {
      return;
    }

    const visibleRowIds = this.rowIds$();
    const visibleRowIdSet = new Set(visibleRowIds);
    const preservedHiddenIds = this.selectedRowIdsState().filter(rowId => !visibleRowIdSet.has(rowId));
    const nextSelectedRowIds = checked
      ? [...preservedHiddenIds, ...visibleRowIds]
      : preservedHiddenIds;

    this.selectedRowIdsState.set(nextSelectedRowIds);
    this.selectedRowIdsChange.emit(nextSelectedRowIds);
  }

  protected toggleRowSelection(rowId: string, checked: boolean): void {
    if (this.selectionModeState() !== 'multiple') {
      return;
    }

    const currentSelectedRowIds = this.selectedRowIdsState();
    const nextSelectedRowIds = checked
      ? currentSelectedRowIds.includes(rowId)
        ? currentSelectedRowIds
        : [...currentSelectedRowIds, rowId]
      : currentSelectedRowIds.filter(selectedRowId => selectedRowId !== rowId);

    this.selectedRowIdsState.set(nextSelectedRowIds);
    this.selectedRowIdsChange.emit(nextSelectedRowIds);
  }

  protected selectionLabel(row: CxTableRow): string {
    const keyColumn = this.columns$().find(column => column.key);
    const keyCell = keyColumn ? row.cells[keyColumn.id] : undefined;
    if (keyCell?.kind === 'text' && keyCell.value.trim()) {
      return `Select row ${keyCell.value.trim()}`;
    }
    return `Select row ${row.id}`;
  }

  protected trackColumn(index: number, column: CxTableColumn): string {
    return column.id ?? `${index}`;
  }

  protected trackRow(index: number, row: CxTableRow): string {
    return row.id ?? `${index}`;
  }

  protected cellFor(row: CxTableRow, columnId: string): CxTableCell | undefined {
    return row.cells[columnId];
  }

  protected rowKind(row: CxTableRow): CxTableRowKind {
    return row.kind === 'folder' ? 'folder' : 'item';
  }

  protected rowIsKeyboardReachable(row: CxTableRow): boolean {
    return this.rowActivation !== 'none' || (this.rightClickMenu && (row.menuItems?.length ?? 0) > 0);
  }

  protected rowLabel(row: CxTableRow): string | null {
    const keyCell = this.keyTextCell(row);
    if (!keyCell) {
      return null;
    }
    return `${this.rowKind(row) === 'folder' ? 'Folder' : 'Item'} ${keyCell.value}`;
  }

  protected resolvedTextIcon(row: CxTableRow, column: CxTableColumn, cell: CxTableCell): CxIconName | undefined {
    if (cell.kind !== 'text') {
      return undefined;
    }
    if (cell.prependIcon) {
      return cell.prependIcon;
    }
    if (column.key && this.rowKind(row) === 'folder') {
      return 'folder';
    }
    return undefined;
  }

  protected isColumnSortable(column: CxTableColumn): boolean {
    return column.sortable === true;
  }

  protected hasColumnHeaderMenu(column: CxTableColumn): boolean {
    return (
      this.isColumnFilterable(column) ||
      this.isColumnSortable(column) ||
      this.isColumnPinnable(column) ||
      this.isColumnHideable(column)
    );
  }

  protected columnHeaderMenuColumn(): CxTableColumn | undefined {
    const columnId = this.columnHeaderMenuColumnIdState();
    return columnId ? this.columns$().find(column => column.id === columnId) : undefined;
  }

  protected isColumnFilterable(column: CxTableColumn): boolean {
    return column.filter !== undefined;
  }

  protected isColumnPinnable(column: CxTableColumn): boolean {
    return column.pinnable === true;
  }

  protected isColumnHideable(column: CxTableColumn): boolean {
    return column.hideable === true;
  }

  protected hasColumnHeaderMenuProperties(column: CxTableColumn): boolean {
    return this.isColumnPinnable(column) || this.isColumnHideable(column);
  }

  protected columnFilterValue(column: CxTableColumn): CxColumnFilterValue | undefined {
    return this.filterValuesState()[column.id];
  }

  protected columnFilterSummary(column: CxTableColumn): string | undefined {
    return column.filter
      ? summarizeCxColumnFilterValue(column.filter, this.filterValuesState()[column.id])
      : undefined;
  }

  protected canPinColumn(column: CxTableColumn): boolean {
    if (!this.isColumnPinnable(column)) {
      return false;
    }
    if (this.isColumnPinned(column)) {
      return true;
    }
    const pinnedColumns = this.columns$().filter(candidate => candidate.pinned === true);
    if (pinnedColumns.length >= CX_TABLE_MAX_PINNED_COLUMNS) {
      return false;
    }
    return this.pinnedColumnsFit([...pinnedColumns, column]);
  }

  protected canHideColumn(column: CxTableColumn): boolean {
    return this.isColumnHideable(column) && this.columns$().length > 1;
  }

  protected columnHeaderMenuAriaLabel(column: CxTableColumn): string {
    return `${column.label} column actions`;
  }

  protected columnHeaderTriggerAriaLabel(column: CxTableColumn): string {
    const summary = this.columnFilterSummary(column);
    return summary
      ? `Open ${column.label} column actions, filter ${summary}`
      : `Open ${column.label} column actions`;
  }

  protected isColumnHeaderMenuOpen(column: CxTableColumn): boolean {
    return this.columnHeaderMenuColumnIdState() === column.id;
  }

  protected sortIcon(columnId: string): CxIconName | undefined {
    const sort = this.sortState();
    if (sort?.columnId !== columnId) {
      return undefined;
    }
    return sort.direction === 'desc' ? 'arrow-down' : 'arrow-up';
  }

  protected sortAria(columnId: string): 'ascending' | 'descending' | null {
    const sort = this.sortState();
    if (sort?.columnId !== columnId) {
      return null;
    }
    return sort.direction === 'desc' ? 'descending' : 'ascending';
  }

  protected onColumnHeaderTriggerClick(
    event: MouseEvent,
    column: CxTableColumn,
    triggerElement: HTMLElement,
  ): void {
    event.stopPropagation();
    if (!this.hasColumnHeaderMenu(column)) {
      return;
    }
    if (this.columnHeaderMenuColumnIdState() === column.id) {
      this.closeColumnHeaderMenu();
      return;
    }

    this.openColumnHeaderMenu(column, triggerElement);
  }

  protected onColumnFilterValueChange(
    column: CxTableColumn,
    value: CxColumnFilterValue | undefined,
  ): void {
    if (!column.filter) {
      return;
    }
    const next = withCxColumnFilterValue(
      this.filterValuesState(),
      column.id,
      column.filter,
      value,
    );
    if (next === this.filterValuesState()) {
      return;
    }
    this.filterValuesState.set(next);
    this.filterValuesChange.emit(next);
  }

  protected onColumnFilterQueryChange(columnId: string, query: string): void {
    this.filterQueryChange.emit({ columnId, query });
  }

  protected onColumnFilterLoadMore(columnId: string): void {
    this.filterLoadMore.emit({ columnId });
  }

  protected clearFilters(): void {
    if (this.activeFilterCount$() === 0) {
      return;
    }
    this.filterValuesState.set({});
    this.filterValuesChange.emit({});
  }

  protected onColumnHeaderAction(column: CxTableColumn, action: CxTableColumnHeaderAction): void {
    if ((action === 'sort-asc' || action === 'sort-desc') && this.isColumnSortable(column)) {
      this.closeColumnHeaderMenu();
      this.applyColumnSort(column, action);
      return;
    }

    if (action === 'pin' && this.canPinColumn(column)) {
      this.closeColumnHeaderMenu();
      this.columnPinChange.emit({ columnId: column.id, pinned: true });
      return;
    }

    if (action === 'unpin' && this.canPinColumn(column)) {
      this.closeColumnHeaderMenu();
      this.columnPinChange.emit({ columnId: column.id, pinned: false });
      return;
    }

    if (action === 'hide' && this.canHideColumn(column)) {
      this.closeColumnHeaderMenu();
      this.columnVisibilityChange.emit({ columnId: column.id, visible: false });
    }
  }

  private applyColumnSort(column: CxTableColumn, action: 'sort-asc' | 'sort-desc'): void {
    const next: CxTableSort = {
      columnId: column.id,
      direction: action === 'sort-desc' ? 'desc' : 'asc',
    };

    this.sortState.set(next);
    this.sortChange.emit(next);
  }

  private openColumnHeaderMenu(column: CxTableColumn, triggerElement: HTMLElement): void {
    this.closeContextMenu(false);
    this.openRowMenuIdState.set(undefined);
    this.closeColumnHeaderMenu(false);
    this.columnHeaderMenuColumnIdState.set(column.id);
    this.columnHeaderMenuOpenChange.emit(true);
    this.columnHeaderMenuTrigger = triggerElement;
    // Fresh open: re-pick the side, then keep it for the whole session.
    this.columnHeaderMenuLockedPlacement = undefined;
    this.syncColumnHeaderMenuPosition(column, triggerElement);
    this.scheduleColumnHeaderMenuFocus(column);
  }

  public closeColumnHeaderMenu(restoreFocus = true): void {
    if (!this.columnHeaderMenuColumnIdState()) {
      return;
    }
    const trigger = this.columnHeaderMenuTrigger;
    const fallbackTrigger = trigger ? this.adjacentColumnHeaderTrigger(trigger) : undefined;
    this.columnHeaderMenuColumnIdState.set(undefined);
    this.columnHeaderMenuOpenChange.emit(false);
    this.columnHeaderMenuPositionState.set(undefined);
    this.columnHeaderMenuTrigger = undefined;

    if (restoreFocus && trigger) {
      queueMicrotask(() => {
        if (trigger.isConnected) {
          trigger.focus();
          return;
        }
        if (fallbackTrigger?.isConnected) {
          fallbackTrigger.focus();
        }
      });
    }
  }

  private adjacentColumnHeaderTrigger(trigger: HTMLElement): HTMLElement | undefined {
    const triggers = Array.from(
      this.tableElement?.nativeElement.querySelectorAll<HTMLElement>('button.cx-table__head-trigger') ?? [],
    );
    const index = triggers.indexOf(trigger);
    return index < 0 ? undefined : triggers[index + 1] ?? triggers[index - 1];
  }

  private focusColumnHeaderMenuWhenReady(column: CxTableColumn, attempt = 0): void {
    if (this.columnHeaderMenuColumnIdState() !== column.id) {
      return;
    }
    const surface = this.columnHeaderPopover?.surfaceElement();
    if (this.isColumnFilterable(column)) {
      this.columnFilterEditor?.focus();
      const activeElement = typeof document === 'undefined' ? undefined : document.activeElement;
      if (activeElement && surface?.contains(activeElement)) {
        return;
      }
      this.retryColumnHeaderMenuFocus(column, attempt);
      return;
    }
    const firstAction = surface
      ?.querySelector<HTMLButtonElement>('.cx-table__header-menu-actions button:not(:disabled)');
    if (firstAction) {
      firstAction.focus();
      return;
    }
    if (surface) {
      surface.tabIndex = -1;
      surface.focus();
      return;
    }
    this.retryColumnHeaderMenuFocus(column, attempt);
  }

  private scheduleColumnHeaderMenuFocus(column: CxTableColumn): void {
    if (typeof requestAnimationFrame === 'undefined') {
      queueMicrotask(() => this.focusColumnHeaderMenuWhenReady(column));
      return;
    }
    requestAnimationFrame(() => this.focusColumnHeaderMenuWhenReady(column));
  }

  private retryColumnHeaderMenuFocus(column: CxTableColumn, attempt: number): void {
    if (attempt >= 12 || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    requestAnimationFrame(() => this.focusColumnHeaderMenuWhenReady(column, attempt + 1));
  }

  private syncColumnHeaderMenuPosition(column: CxTableColumn, triggerElement: HTMLElement): void {
    if (typeof window === 'undefined') {
      return;
    }
    const rect = triggerElement.getBoundingClientRect();
    const propertyActionCount =
      Number(this.isColumnPinnable(column)) +
      Number(this.isColumnHideable(column));
    const islandCount =
      Number(column.filter !== undefined) +
      Number(this.isColumnSortable(column)) +
      Number(propertyActionCount > 0);
    const estimatedHeight =
      estimateCxColumnFilterHeight(column.filter) +
      (this.isColumnSortable(column) ? 80 + 8 : 0) +
      (propertyActionCount > 0 ? propertyActionCount * 40 + 8 : 0) +
      Math.max(0, islandCount - 1) * 4 +
      8;
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: CX_TABLE_HEADER_MENU_WIDTH,
      estimatedHeight,
      minWidth: 240,
      align: 'start',
      gap: 4,
      lockedPlacement: this.columnHeaderMenuLockedPlacement,
    });
    this.columnHeaderMenuLockedPlacement = surface.placement;

    this.columnHeaderMenuPositionState.set({
      left: surface.left,
      top: surface.top,
      bottom: surface.bottom,
      maxHeight: surface.maxHeight,
      placement: surface.placement,
    });
  }

  protected isColumnPinned(column: CxTableColumn): boolean {
    return column.pinned === true;
  }

  protected isLastPinnedColumn(column: CxTableColumn): boolean {
    const pinnedIds = this.effectivePinnedColumnIdsState();
    return pinnedIds[pinnedIds.length - 1] === column.id;
  }

  protected columnPinnedLeft(column: CxTableColumn): string | null {
    if (!this.isColumnEffectivelyPinned(column)) {
      return null;
    }
    return `${this.columnLeftOffsetsState()[column.id] ?? 0}px`;
  }

  protected isColumnEffectivelyPinned(column: CxTableColumn): boolean {
    return this.effectivePinnedColumnIdsState().includes(column.id);
  }

  protected columnWidth(column: CxTableColumn): string | null {
    const override = this.columnWidthOverridesState()[column.id];
    if (typeof override === 'number') {
      return `${override}px`;
    }
    const size = column.size;
    if (size === undefined || size === 'flex') {
      return null;
    }
    if (size === 'content') {
      const measured = this.contentWidthsState()[column.id];
      return typeof measured === 'number' ? `${measured}px` : null;
    }
    return size;
  }

  protected columnWidthValue(column: CxTableColumn): number {
    return this.columnWidthOverridesState()[column.id]
      ?? this.contentWidthsState()[column.id]
      ?? this.currentColumnWidth(column.id);
  }

  protected onColumnResizePointerDown(event: PointerEvent, column: CxTableColumn): void {
    if (!this.columnsResizable || !event.isPrimary || event.button !== 0) {
      return;
    }
    const captureElement = event.currentTarget as HTMLElement;
    if (!this.isResizeGesture(event, captureElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.closeColumnHeaderMenu(false);
    this.stopResizeSession();

    const currentWidth = this.currentColumnWidth(column.id);
    this.activeResizeSession = {
      columnId: column.id,
      startX: event.clientX,
      startWidth: currentWidth,
      pointerId: event.pointerId,
      handleElement: captureElement,
    };
    this.resizingColumnIdState.set(column.id);
    captureElement.setPointerCapture(event.pointerId);

    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
  }

  protected onColumnResizeDoubleClick(event: MouseEvent, column: CxTableColumn): void {
    if (!this.columnsResizable) {
      return;
    }
    const captureElement = event.currentTarget as HTMLElement;
    if (!this.isResizeGesture(event, captureElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.closeColumnHeaderMenu(false);

    this.stopResizeSession();
    this.updateColumnWidth(column.id, this.autoFitColumnWidth(column.id));
  }

  protected onColumnResizeKeydown(event: KeyboardEvent, column: CxTableColumn): void {
    if (!this.columnsResizable) {
      return;
    }
    const currentWidth = this.currentColumnWidth(column.id);
    const step = event.shiftKey ? CX_TABLE_COLUMN_RESIZE_LARGE_STEP : CX_TABLE_COLUMN_RESIZE_STEP;
    let nextWidth: number | undefined;

    switch (event.key) {
      case 'ArrowLeft':
        nextWidth = currentWidth - step;
        break;
      case 'ArrowRight':
        nextWidth = currentWidth + step;
        break;
      case 'Home':
        nextWidth = CX_TABLE_COLUMN_MIN_WIDTH;
        break;
      case 'End':
        nextWidth = CX_TABLE_COLUMN_MAX_WIDTH;
        break;
      case 'Enter':
        nextWidth = this.autoFitColumnWidth(column.id);
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.closeColumnHeaderMenu(false);
    this.updateColumnWidth(column.id, nextWidth);
  }

  protected onColumnGripPointerDown(event: PointerEvent, column: CxTableColumn): void {
    if (!this.columnsReorderable || !event.isPrimary || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    this.closeColumnHeaderMenu(false);
    const handleElement = event.currentTarget as HTMLElement;
    this.stopResizeSession();
    this.cancelKeyboardColumnReorder(false);
    this.activeReorderSession = {
      columnId: column.id,
      columnLabel: column.label,
      pointerId: event.pointerId,
      handleElement,
      originalOrder: [...this.columnOrderState()],
    };
    this.draggingColumnIdState.set(column.id);
    this.dropIndicatorState.set(undefined);
    this.updateDragPreview(event.clientX, event.clientY, column.label);
    handleElement.setPointerCapture(event.pointerId);

    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }
  }

  protected onColumnGripPointerMove(event: PointerEvent): void {
    if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
      return;
    }

    const indicator = this.resolveDropIndicator(event.clientX, event.clientY, this.activeReorderSession.columnId);
    this.dropIndicatorState.set(indicator);
    this.updateDragPreview(event.clientX, event.clientY, this.activeReorderSession.columnLabel);
  }

  protected onColumnGripPointerUp(event: PointerEvent): void {
    if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
      return;
    }

    this.commitColumnReorder();
    this.stopReorderSession();
  }

  protected onColumnGripPointerCancel(event: PointerEvent): void {
    if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
      return;
    }
    this.stopReorderSession();
  }

  protected onColumnGripLostPointerCapture(event: PointerEvent): void {
    if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
      return;
    }
    this.stopReorderSession();
  }

  protected onColumnGripKeydown(
    event: KeyboardEvent,
    column: CxTableColumn,
    handleElement: HTMLElement,
  ): void {
    if (!this.columnsReorderable) {
      return;
    }
    const session = this.keyboardReorderSession;
    if (!session || session.columnId !== column.id) {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.startKeyboardColumnReorder(column, handleElement);
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        event.stopPropagation();
        this.moveKeyboardColumn(column, 'previous');
        return;
      case 'ArrowRight':
        event.preventDefault();
        event.stopPropagation();
        this.moveKeyboardColumn(column, 'next');
        return;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.moveKeyboardColumn(column, 'first');
        return;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.moveKeyboardColumn(column, 'last');
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        this.commitKeyboardColumnReorder();
        return;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.cancelKeyboardColumnReorder(true);
    }
  }

  protected onColumnResizePointerMove(event: PointerEvent): void {
    if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
      return;
    }

    const delta = event.clientX - this.activeResizeSession.startX;
    const nextWidth = this.activeResizeSession.startWidth + delta;
    this.updateColumnWidth(this.activeResizeSession.columnId, nextWidth);
  }

  protected onColumnResizePointerUp(event: PointerEvent): void {
    if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
      return;
    }
    this.stopResizeSession();
  }

  protected onColumnResizePointerCancel(event: PointerEvent): void {
    if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
      return;
    }
    this.stopResizeSession();
  }

  protected onColumnResizeLostPointerCapture(event: PointerEvent): void {
    if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
      return;
    }
    this.stopResizeSession();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.syncPinnedColumnOffsets();
    const column = this.columnHeaderMenuColumn();
    if (!column || !this.columnHeaderMenuTrigger) {
      return;
    }
    this.syncColumnHeaderMenuPosition(column, this.columnHeaderMenuTrigger);
  }

  private stopResizeSession(): void {
    const session = this.activeResizeSession;
    this.activeResizeSession = undefined;
    const handleElement = session?.handleElement;
    const pointerId = session?.pointerId;
    if (handleElement && pointerId !== undefined && handleElement.hasPointerCapture(pointerId)) {
      handleElement.releasePointerCapture(pointerId);
    }
    this.resizingColumnIdState.set(undefined);
    if (typeof document !== 'undefined') {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    }
  }

  private openRowContextMenu(
    row: CxTableRow,
    rowElement?: HTMLElement,
    position?: { left: number; top: number },
    invocation: 'pointer' | 'keyboard' = 'pointer',
  ): void {
    if ((row.menuItems?.length ?? 0) === 0) {
      return;
    }

    this.openRowMenuIdState.set(undefined);
    this.closeColumnHeaderMenu(false);
    this.closeContextMenu(false);
    const nextContextMenu: CxTableContextMenuState = {
      rowId: row.id,
      point: position ?? this.resolveRowContextMenuPosition(rowElement),
      invocation,
      originRow: rowElement,
    };
    if (this.contextMenuTeardownPending) {
      // The previous controlled menu can be internally closed before its
      // conditional host has rendered away. Reusing that host would leave its
      // unchanged [open] input at true while its internal state stays false.
      // Let teardown finish, then render the latest requested invocation as a
      // fresh menu instance.
      this.pendingContextMenuState = nextContextMenu;
      return;
    }
    this.contextMenuState.set(nextContextMenu);
  }

  private resolveRowContextMenuPosition(rowElement?: HTMLElement): { left: number; top: number } {
    const rect = rowElement?.getBoundingClientRect();
    if (!rect) {
      return { left: 16, top: 16 };
    }

    return {
      left: Math.max(rect.right - 16, rect.left + 16),
      top: rect.top + Math.min(rect.height / 2, 16),
    };
  }

  private stopReorderSession(): void {
    const session = this.activeReorderSession;
    this.activeReorderSession = undefined;
    const handleElement = session?.handleElement;
    const pointerId = session?.pointerId;
    if (handleElement && pointerId !== undefined && handleElement.hasPointerCapture(pointerId)) {
      handleElement.releasePointerCapture(pointerId);
    }
    this.draggingColumnIdState.set(undefined);
    this.dropIndicatorState.set(undefined);
    this.dragPreviewState.set(undefined);
    if (typeof document !== 'undefined') {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    }
  }

  /**
   * The first column carries the most important information, so it sizes to
   * its content automatically whenever rows or columns change — until the
   * user resizes it manually, which takes ownership of the width.
   * Timeout-based (not animation frames) so it also runs in hidden tabs, and
   * retried briefly because the new rows render one change-detection pass
   * after the input setter fires.
   */
  private scheduleFirstColumnAutoFit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.firstColumnAutoFitTimer !== undefined) {
      window.clearTimeout(this.firstColumnAutoFitTimer);
    }
    const attempt = (tries: number): void => {
      this.firstColumnAutoFitTimer = undefined;
      if (this.destroyed || this.applyFirstColumnAutoFit() || tries >= 5) {
        return;
      }
      this.firstColumnAutoFitTimer = window.setTimeout(() => attempt(tries + 1), 32);
    };
    this.firstColumnAutoFitTimer = window.setTimeout(() => attempt(0), 0);
  }

  /** Returns true when settled: applied, or skipped because the user owns the width. */
  private applyFirstColumnAutoFit(): boolean {
    const firstColumn = this.columns$()[0];
    if (!firstColumn || this.rowsState().length === 0) {
      return false;
    }
    const table = this.tableElement?.nativeElement;
    if (!table?.querySelector(`td[data-column-id="${this.escapeColumnId(firstColumn.id)}"]`)) {
      return false;
    }
    const override = this.columnWidthOverridesState()[firstColumn.id];
    const applied = this.appliedFirstColumnAutoFit;
    const autoFitOwnsWidth =
      override === undefined ||
      (applied?.columnId === firstColumn.id && applied.width === override);
    if (!autoFitOwnsWidth) {
      return true;
    }
    const width = this.capFirstColumnWidthToViewport(
      firstColumn.id,
      this.clampColumnWidth(this.autoFitColumnWidth(firstColumn.id)),
    );
    this.updateColumnWidth(firstColumn.id, width);
    this.appliedFirstColumnAutoFit = { columnId: firstColumn.id, width };
    return true;
  }

  /**
   * Auto-fit must never be the reason a horizontal scrollbar exists: the key
   * column prefers its content width but yields — down to the shared column
   * minimum — before the table outgrows its viewport. The candidate width is
   * applied first so the browser itself reports the overflow it would cause;
   * that keeps menu/selection columns, paddings, and borders accounted for
   * without duplicating layout math. Any overflow that remains at the minimum
   * width comes from content-sized columns, and then the scrollbar is honest.
   */
  private capFirstColumnWidthToViewport(columnId: string, width: number): number {
    const viewport = this.tableElement?.nativeElement.parentElement;
    if (!viewport) {
      return width;
    }
    this.applyColumnWidthToDom(columnId, width);
    const overflow = viewport.scrollWidth - viewport.clientWidth;
    if (overflow <= 0) {
      return width;
    }
    const fitted = this.clampColumnWidth(width - overflow);
    if (fitted !== width) {
      this.applyColumnWidthToDom(columnId, fitted);
    }
    return fitted;
  }

  private updateColumnWidth(columnId: string, width: number): void {
    const nextWidth = this.clampColumnWidth(width);
    if (this.columnWidthOverridesState()[columnId] === nextWidth) {
      return;
    }
    this.columnWidthOverridesState.update(current => ({
      ...current,
      [columnId]: nextWidth,
    }));
    this.applyColumnWidthToDom(columnId, nextWidth);
    this.syncPinnedColumnOffsets();
  }

  private syncPinnedColumnOffsets(): void {
    const pinnedColumns = this.columns$().filter(column => column.pinned === true);
    if (pinnedColumns.length === 0) {
      if (this.effectivePinnedColumnIdsState().length > 0) {
        this.effectivePinnedColumnIdsState.set([]);
      }
      if (Object.keys(this.columnLeftOffsetsState()).length > 0) {
        this.columnLeftOffsetsState.set({});
      }
      return;
    }

    const effectivePinnedColumns: CxTableColumn[] = [];
    for (const column of pinnedColumns.slice(0, CX_TABLE_MAX_PINNED_COLUMNS)) {
      const candidate = [...effectivePinnedColumns, column];
      if (!this.pinnedColumnsFit(candidate)) {
        break;
      }
      effectivePinnedColumns.push(column);
    }

    const effectiveIds = effectivePinnedColumns.map(column => column.id);
    const currentEffectiveIds = this.effectivePinnedColumnIdsState();
    if (
      effectiveIds.length !== currentEffectiveIds.length ||
      effectiveIds.some((id, index) => currentEffectiveIds[index] !== id)
    ) {
      this.effectivePinnedColumnIdsState.set(effectiveIds);
    }

    let left = this.currentSelectionColumnWidth();
    const next: Record<string, number> = {};
    for (const column of effectivePinnedColumns) {
      next[column.id] = left;
      left += this.currentColumnWidth(column.id);
    }

    const current = this.columnLeftOffsetsState();
    const currentKeys = Object.keys(current);
    const nextKeys = Object.keys(next);
    const changed =
      currentKeys.length !== nextKeys.length ||
      nextKeys.some(key => current[key] !== next[key]);
    if (changed) {
      this.columnLeftOffsetsState.set(next);
    }
  }

  private observeTableViewport(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const viewport = this.tableElement?.nativeElement.parentElement;
    if (!viewport || viewport === this.observedTableViewport) {
      return;
    }

    this.tableViewportResizeObserver?.disconnect();
    this.observedTableViewport = viewport;
    this.lastViewportWidth = viewport.clientWidth;
    this.tableViewportResizeObserver = new ResizeObserver(() => {
      if (this.destroyed) {
        return;
      }
      this.syncPinnedColumnOffsets();
      // Width changes move the auto-fit ceiling, so the key column re-fits:
      // narrower windows squeeze it before a scrollbar appears, wider ones
      // give the room back. Guarded to width so height-only changes (row
      // wrap, virtualization) cannot ping-pong the observer.
      const currentWidth = viewport.clientWidth;
      if (currentWidth !== this.lastViewportWidth) {
        this.lastViewportWidth = currentWidth;
        this.scheduleFirstColumnAutoFit();
      }
    });
    this.tableViewportResizeObserver.observe(viewport);
  }

  private pinnedColumnsFit(pinnedColumns: readonly CxTableColumn[]): boolean {
    if (pinnedColumns.length === 0) {
      return true;
    }
    const table = this.tableElement?.nativeElement;
    const viewportWidth = table?.parentElement?.clientWidth ?? 0;
    if (viewportWidth <= 0) {
      return pinnedColumns.length <= CX_TABLE_MAX_PINNED_COLUMNS;
    }

    const pinnedIds = new Set(pinnedColumns.map(column => column.id));
    const hasUnpinnedColumn = this.columns$().some(column => !pinnedIds.has(column.id));
    const selectionWidth = this.currentSelectionColumnWidth();
    const reachableWidth = hasUnpinnedColumn
      ? Math.max(CX_TABLE_MIN_UNPINNED_WIDTH, viewportWidth * CX_TABLE_MIN_UNPINNED_RATIO)
      : 0;
    const pinnedWidth = pinnedColumns.reduce(
      (total, candidate) => total + this.currentColumnWidth(candidate.id),
      selectionWidth,
    );
    return pinnedWidth <= Math.max(0, viewportWidth - reachableWidth);
  }

  private currentSelectionColumnWidth(): number {
    if (!this.hasRowSelection$()) {
      return 0;
    }
    const table = this.tableElement?.nativeElement;
    const cell = table?.querySelector<HTMLElement>('.cx-table__head-cell--selection, .cx-table__cell--selection');
    return cell?.getBoundingClientRect().width ?? CX_TABLE_SELECTION_COLUMN_WIDTH;
  }

  private currentColumnWidth(columnId: string): number {
    const override = this.columnWidthOverridesState()[columnId];
    if (typeof override === 'number') {
      return this.clampColumnWidth(override);
    }
    const table = this.tableElement?.nativeElement;
    if (!table) {
      return this.clampColumnWidth(120);
    }

    const cell = table.querySelector(`th[data-column-id="${this.escapeColumnId(columnId)}"]`) as HTMLElement | null;
    return this.clampColumnWidth(cell?.getBoundingClientRect().width ?? 120);
  }

  private autoFitColumnWidth(columnId: string): number {
    const table = this.tableElement?.nativeElement;
    if (!table) {
      return this.clampColumnWidth(120);
    }

    // One measurement path for every cell kind: the natural width of the real
    // rendered content container. Icons, gaps, sort arrows, and future cell
    // kinds are included automatically because the actual DOM is measured —
    // no per-kind branches, no pixel allowances.
    const selector = `[data-column-id="${this.escapeColumnId(columnId)}"]`;
    let maxContentWidth = 0;
    let paddedCell: HTMLElement | undefined;

    const headerCell = table.querySelector(`th${selector}`) as HTMLElement | null;
    const headerContent = headerCell?.querySelector('.cx-table__head-content') as HTMLElement | null;
    if (headerContent) {
      maxContentWidth = Math.max(maxContentWidth, this.measureNaturalContentWidth(headerContent));
      paddedCell = headerCell ?? undefined;
    }

    table.querySelectorAll(`td${selector}`).forEach(node => {
      const cell = node as HTMLElement;
      const content = cell.querySelector('.cx-table__measure-target') as HTMLElement | null;
      if (content) {
        maxContentWidth = Math.max(maxContentWidth, this.measureNaturalContentWidth(content));
        paddedCell = cell;
      }
    });

    // The cell's real computed padding, not a constant mirroring the CSS.
    let horizontalPadding = 0;
    if (paddedCell && typeof window !== 'undefined') {
      const cellStyles = window.getComputedStyle(paddedCell);
      horizontalPadding =
        (Number.parseFloat(cellStyles.paddingLeft) || 0) +
        (Number.parseFloat(cellStyles.paddingRight) || 0);
    }
    return this.clampColumnWidth(maxContentWidth + horizontalPadding);
  }

  /**
   * The live cell content shrinks to the current column width, so its rendered
   * width is useless for auto-fit once it is already clipped. Measure an
   * off-flow clone freed from the flex constraints instead — it reports the
   * content's natural width while inheriting the same component styles.
   */
  private measureNaturalContentWidth(content: HTMLElement): number {
    const parent = content.parentElement;
    if (!parent) {
      return Math.ceil(content.getBoundingClientRect().width);
    }
    const clone = content.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.width = 'max-content';
    clone.style.maxWidth = 'none';
    clone.style.flex = 'none';
    clone.style.visibility = 'hidden';
    clone.style.pointerEvents = 'none';
    parent.appendChild(clone);
    const width = Math.ceil(clone.getBoundingClientRect().width);
    clone.remove();
    return width;
  }

  private escapeColumnId(columnId: string): string {
    return columnId.replace(/"/g, '\\"');
  }

  private resolveDropIndicator(
    clientX: number,
    clientY: number,
    draggingColumnId: string,
  ): CxTableDropIndicator {
    const target = document.elementFromPoint(clientX, clientY)?.closest(
      'th[data-column-id]',
    ) as HTMLElement | null;

    if (!target || !this.tableElement?.nativeElement.contains(target)) {
      return undefined;
    }

    const columnId = target.dataset['columnId'];
    if (!columnId || columnId === draggingColumnId) {
      return undefined;
    }
    const draggingColumn = this.columnsState().find(column => column.id === draggingColumnId);
    const targetColumn = this.columnsState().find(column => column.id === columnId);
    if (!draggingColumn || !targetColumn || this.isColumnPinned(draggingColumn) !== this.isColumnPinned(targetColumn)) {
      return undefined;
    }

    const rect = target.getBoundingClientRect();
    return {
      columnId,
      position: clientX < rect.left + rect.width / 2 ? 'before' : 'after',
    };
  }

  private commitColumnReorder(): void {
    const session = this.activeReorderSession;
    const indicator = this.dropIndicatorState();
    if (!session || !indicator) {
      return;
    }

    const nextOrder = [...this.columnOrderState()];
    const fromIndex = nextOrder.indexOf(session.columnId);
    const targetIndex = nextOrder.indexOf(indicator.columnId);
    if (fromIndex < 0 || targetIndex < 0) {
      return;
    }

    nextOrder.splice(fromIndex, 1);
    let insertIndex = indicator.position === 'before' ? targetIndex : targetIndex + 1;
    if (fromIndex < targetIndex) {
      insertIndex -= 1;
    }

    nextOrder.splice(insertIndex, 0, session.columnId);
    const normalizedOrder = this.normalizeColumnOrder(nextOrder, this.columnsState());
    if (this.ordersMatch(session.originalOrder, normalizedOrder)) {
      return;
    }
    this.columnOrderState.set(normalizedOrder);
    this.columnOrderChange.emit(normalizedOrder);
  }

  private startKeyboardColumnReorder(column: CxTableColumn, handleElement: HTMLElement): void {
    this.closeColumnHeaderMenu(false);
    this.closeContextMenu(false);
    this.openRowMenuIdState.set(undefined);
    this.stopResizeSession();
    this.stopReorderSession();
    this.keyboardReorderSession = {
      columnId: column.id,
      columnLabel: column.label,
      handleElement,
      originalOrder: [...this.columnOrderState()],
    };
    this.draggingColumnIdState.set(column.id);
    this.announceColumnPosition(column, 'Moving');
  }

  private moveKeyboardColumn(
    column: CxTableColumn,
    direction: 'previous' | 'next' | 'first' | 'last',
  ): void {
    if (this.keyboardReorderSession?.columnId !== column.id) {
      return;
    }
    const currentOrder = [...this.columnOrderState()];
    const partition = currentOrder.filter(columnId => {
      const candidate = this.columnsState().find(item => item.id === columnId);
      return candidate && this.isColumnPinned(candidate) === this.isColumnPinned(column);
    });
    const currentIndex = partition.indexOf(column.id);
    if (currentIndex < 0) {
      return;
    }
    const nextIndex = direction === 'first'
      ? 0
      : direction === 'last'
        ? partition.length - 1
        : direction === 'previous'
          ? Math.max(currentIndex - 1, 0)
          : Math.min(currentIndex + 1, partition.length - 1);
    if (nextIndex === currentIndex) {
      this.announceColumnPosition(column, 'Moving');
      return;
    }

    partition.splice(currentIndex, 1);
    partition.splice(nextIndex, 0, column.id);
    const partitionIds = new Set(partition);
    let partitionIndex = 0;
    const nextOrder = currentOrder.map(columnId =>
      partitionIds.has(columnId) ? partition[partitionIndex++]! : columnId,
    );
    this.columnOrderState.set(this.normalizeColumnOrder(nextOrder, this.columnsState()));
    this.announceColumnPosition(column, 'Moving');
    this.focusColumnGripAfterRender(column.id);
  }

  private commitKeyboardColumnReorder(): void {
    const session = this.keyboardReorderSession;
    if (!session) {
      return;
    }
    const nextOrder = [...this.columnOrderState()];
    const changed = !this.ordersMatch(session.originalOrder, nextOrder);
    this.keyboardReorderSession = undefined;
    this.draggingColumnIdState.set(undefined);
    this.columnReorderAnnouncementState.set(
      changed ? `${session.columnLabel} column move complete.` : `${session.columnLabel} column position unchanged.`,
    );
    if (changed) {
      this.columnOrderChange.emit(nextOrder);
    }
    this.focusColumnGripAfterRender(session.columnId);
  }

  private cancelKeyboardColumnReorder(announce: boolean): void {
    const session = this.keyboardReorderSession;
    if (!session) {
      return;
    }
    this.keyboardReorderSession = undefined;
    this.columnOrderState.set(this.normalizeColumnOrder(session.originalOrder, this.columnsState()));
    this.draggingColumnIdState.set(undefined);
    if (announce) {
      this.columnReorderAnnouncementState.set(`${session.columnLabel} column move cancelled.`);
      this.focusColumnGripAfterRender(session.columnId);
    } else {
      this.columnReorderAnnouncementState.set('');
    }
  }

  private focusColumnGripAfterRender(columnId: string): void {
    afterNextRender(() => this.focusColumnGrip(columnId), { injector: this.injector });
  }

  private announceColumnPosition(column: CxTableColumn, prefix: string): void {
    const order = this.columnOrderState();
    const position = Math.max(order.indexOf(column.id), 0) + 1;
    this.columnReorderAnnouncementState.set(
      `${prefix} ${column.label} column, position ${position} of ${order.length}.`,
    );
  }

  private focusColumnGrip(columnId: string): void {
    const grips = this.tableElement?.nativeElement.querySelectorAll<HTMLElement>('[data-column-grip-id]');
    Array.from(grips ?? []).find(grip => grip.dataset['columnGripId'] === columnId)?.focus();
  }

  private normalizeColumnOrder(order: readonly string[], columns: readonly CxTableColumn[]): string[] {
    const columnMap = new Map(columns.map(column => [column.id, column]));
    const completeOrder = [
      ...order.filter(id => columnMap.has(id)),
      ...columns.map(column => column.id).filter(id => !order.includes(id)),
    ];
    return [
      ...completeOrder.filter(id => columnMap.get(id)?.pinned === true),
      ...completeOrder.filter(id => columnMap.get(id)?.pinned !== true),
    ];
  }

  private ordersMatch(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((id, index) => id === right[index]);
  }

  private clampColumnWidth(width: number): number {
    const rounded = Number.isFinite(width) ? Math.round(width) : CX_TABLE_COLUMN_MIN_WIDTH;
    return Math.min(Math.max(rounded, CX_TABLE_COLUMN_MIN_WIDTH), CX_TABLE_COLUMN_MAX_WIDTH);
  }

  private applyColumnWidthToDom(columnId: string, width: number): void {
    const table = this.tableElement?.nativeElement;
    if (!table) {
      return;
    }

    const pxWidth = `${width}px`;
    const selector = `[data-column-id="${this.escapeColumnId(columnId)}"]`;
    table.querySelectorAll(selector).forEach(node => {
      const element = node as HTMLElement;
      element.style.width = pxWidth;
      element.style.minWidth = pxWidth;
      element.style.maxWidth = pxWidth;
    });
  }

  private isResizeGesture(event: MouseEvent | PointerEvent, element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right;
  }

  private rowOwnsKeyboardEvent(event: KeyboardEvent, rowElement?: HTMLElement): boolean {
    return Boolean(rowElement && event.target === rowElement);
  }

  private eventComesFromInteractiveDescendant(event: Event, rowElement?: HTMLElement): boolean {
    if (!rowElement) {
      return false;
    }
    const composedPath = event.composedPath?.() ?? [];
    const path = composedPath.length > 0
      ? composedPath
      : this.elementPathToRow(event.target, rowElement);

    for (const target of path) {
      if (target === rowElement) {
        return false;
      }
      if (target instanceof Element && this.isInteractiveElement(target)) {
        return true;
      }
    }
    return false;
  }

  private elementPathToRow(target: EventTarget | null, rowElement: HTMLElement): EventTarget[] {
    const path: EventTarget[] = [];
    let current = target instanceof Node ? target : null;
    while (current) {
      path.push(current);
      if (current === rowElement) {
        break;
      }
      current = current.parentNode;
    }
    return path;
  }

  private isInteractiveElement(element: Element): boolean {
    if (element.matches(
      'button, input, select, textarea, label, summary, a[href], area[href], audio[controls], video[controls], iframe',
    )) {
      return true;
    }
    if (element instanceof HTMLElement && element.isContentEditable) {
      return true;
    }
    if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') {
      return true;
    }
    const role = element.getAttribute('role')?.trim().split(/\s+/)[0];
    return role ? CX_TABLE_INTERACTIVE_ROLES.has(role) : false;
  }

  private keyTextCell(row: CxTableRow): Extract<CxTableCell, { kind: 'text' }> | undefined {
    const keyColumn = this.columns$().find(column => column.key);
    const keyCell = keyColumn ? row.cells[keyColumn.id] : undefined;
    return keyCell?.kind === 'text' && keyCell.value.trim() ? keyCell : undefined;
  }

  private updateDragPreview(clientX: number, clientY: number, label: string): void {
    const estimatedWidth = Math.min(Math.max(label.length * 11 + 52, 96), 220);
    const estimatedHeight = 52;
    const viewportInset = 8;
    const offsetX = 14;
    const offsetY = -20;
    const left = Math.min(
      Math.max(viewportInset, clientX + offsetX),
      window.innerWidth - estimatedWidth - viewportInset,
    );
    const top = Math.min(
      Math.max(viewportInset, clientY + offsetY),
      window.innerHeight - estimatedHeight - viewportInset,
    );

    this.dragPreviewState.set({
      label,
      left,
      top,
    });
  }

}
