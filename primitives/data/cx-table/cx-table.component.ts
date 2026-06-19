import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  afterRenderEffect,
  computed,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import {
  CxMenuComponent,
  type CxMenuItem,
} from '../../overlay/cx-menu';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxOptionComponent } from '../../overlay/cx-option';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import {
  CxSeverityTagComponent,
  type CxSeverityLevel,
} from '../../display/cx-severity-tag';
import {
  CxStatusTagComponent,
  type CxStatusTagMood,
} from '../../display/cx-status-tag';
import {
  CxTagComponent,
  type CxTagColor,
  type CxTagVariant,
} from '../../display/cx-tag';
import {
  CxTrendTagComponent,
  type CxTrendTagTrend,
} from '../../display/cx-trend-tag';
import { CxIconComponent } from '../../media/cx-icon';
import { CxCheckboxComponent } from '../../inputs/cx-checkbox';

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
  pinned?: boolean;
}

export interface CxTableSort {
  columnId: string;
  direction: CxTableSortDirection;
}

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
    }
  | {
      kind: 'severity-tag';
      severity: CxSeverityLevel;
      score?: string;
      kev?: boolean;
      grade?: boolean;
    }
  | {
      kind: 'trend-tag';
      trend: CxTrendTagTrend;
      value: string;
    }
  | {
      kind: 'tag';
      label: string;
      color?: CxTagColor;
      variant?: CxTagVariant;
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

@Component({
  selector: 'cx-table',
  imports: [
    CommonModule,
    CxMenuComponent,
    CxPopoverComponent,
    CxOptionComponent,
    CxIconButtonComponent,
    CxCheckboxComponent,
    CxSeverityTagComponent,
    CxStatusTagComponent,
    CxTagComponent,
    CxTrendTagComponent,
    CxIconComponent,
  ],
  templateUrl: './cx-table.component.html',
  styleUrl: './cx-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTableComponent implements OnDestroy {
  private readonly columnsState = signal<CxTableColumn[]>([]);
  private readonly rowsState = signal<CxTableRow[]>([]);
  private readonly activeRowIdState = signal<string | undefined>(undefined);
  private readonly openRowMenuIdState = signal<string | undefined>(undefined);
  private readonly contextMenuRowIdState = signal<string | undefined>(undefined);
  private readonly contextMenuItemsState = signal<CxMenuItem[]>([]);
  private readonly contextMenuPositionState = signal<{ left: number; top: number } | undefined>(undefined);
  private readonly contextMenuOpenState = signal(false);
  private readonly selectionModeState = signal<CxTableSelectionMode>('none');
  private readonly selectedRowIdsState = signal<string[]>([]);
  private readonly columnOrderState = signal<string[]>([]);
  private readonly columnWidthOverridesState = signal<Record<string, number>>({});
  private readonly contentWidthsState = signal<Record<string, number>>({});
  private readonly columnLeftOffsetsState = signal<Record<string, number>>({});
  private readonly resizingColumnIdState = signal<string | undefined>(undefined);
  private readonly draggingColumnIdState = signal<string | undefined>(undefined);
  private readonly dropIndicatorState = signal<CxTableDropIndicator>(undefined);
  private readonly dragPreviewState = signal<CxTableDragPreview>(undefined);
  private readonly sortState = signal<CxTableSort | undefined>(undefined);
  private activeResizeSession:
    | {
        columnId: string;
        startX: number;
        startWidth: number;
        pointerId: number;
        handleElement: HTMLElement;
      }
    | undefined;
  private activeReorderSession:
    | {
        columnId: string;
        columnLabel: string;
        pointerId: number;
        handleElement: HTMLElement;
      }
    | undefined;

  @ViewChild('tableElement') private readonly tableElement?: ElementRef<HTMLTableElement>;
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
  @Input() emptyText = 'No rows to display.';

  @Input()
  public set selectionMode(value: CxTableSelectionMode) {
    this.selectionModeState.set(value ?? 'none');
  }

  @Input()
  public set columns(value: CxTableColumn[]) {
    const nextColumns = value ?? [];
    const nextIds = nextColumns.map(column => column.id);
    const currentOrder = this.columnOrderState();
    const preservedOrder = currentOrder.filter(id => nextIds.includes(id));
    const appendedIds = nextIds.filter(id => !preservedOrder.includes(id));

    this.columnsState.set(nextColumns);
    this.columnOrderState.set([...preservedOrder, ...appendedIds]);
    this.columnWidthOverridesState.update(current =>
      Object.fromEntries(Object.entries(current).filter(([id]) => nextIds.includes(id))),
    );
  }

  @Input()
  public set rows(value: CxTableRow[]) {
    this.rowsState.set(value ?? []);
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
  public set sort(value: CxTableSort | undefined) {
    this.sortState.set(value);
  }

  @Output() readonly activeRowIdChange = new EventEmitter<string>();
  @Output() readonly selectedRowIdsChange = new EventEmitter<string[]>();
  @Output() readonly rowMenuItemSelect = new EventEmitter<CxTableRowMenuSelectEvent>();
  @Output() readonly rowActivate = new EventEmitter<CxTableRowActivateEvent>();
  @Output() readonly columnOrderChange = new EventEmitter<string[]>();
  @Output() readonly sortChange = new EventEmitter<CxTableSort | undefined>();

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
  protected readonly contextMenuItems$ = this.contextMenuItemsState.asReadonly();
  protected readonly contextMenuPosition$ = this.contextMenuPositionState.asReadonly();
  protected readonly contextMenuOpen$ = this.contextMenuOpenState.asReadonly();
  protected readonly resizingColumnId$ = this.resizingColumnIdState.asReadonly();
  protected readonly draggingColumnId$ = this.draggingColumnIdState.asReadonly();
  protected readonly dropIndicator$ = this.dropIndicatorState.asReadonly();
  protected readonly dragPreview$ = this.dragPreviewState.asReadonly();
  protected readonly sort$ = this.sortState.asReadonly();
  protected readonly columnLeftOffsets$ = this.columnLeftOffsetsState.asReadonly();
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

  constructor() {
    afterRenderEffect(() => {
      const columns = this.columnsState();
      this.rowsState();

      if (this.resizingColumnIdState() || this.draggingColumnIdState()) {
        return;
      }
      if (!this.tableElement?.nativeElement) {
        return;
      }

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
    this.stopResizeSession();
    this.stopReorderSession();
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
    if (this.rightClickMenu && event.button === 2 && (row.menuItems?.length ?? 0) > 0) {
      event.preventDefault();
      this.openRowContextMenu(row, rowElement, { left: event.clientX, top: event.clientY });
      return;
    }

    this.activateRow(row);
  }

  protected onRowKeydown(event: KeyboardEvent, row: CxTableRow, rowElement?: HTMLElement): void {
    if (this.rightClickMenu && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
      event.preventDefault();
      this.openRowContextMenu(row, rowElement);
      return;
    }

    if (this.rowActivation === 'none') {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.activateRow(row);
  }

  protected onRowContextMenu(event: MouseEvent, row: CxTableRow, rowElement?: HTMLElement): void {
    if (!this.rightClickMenu || (row.menuItems?.length ?? 0) === 0) {
      return;
    }

    event.preventDefault();
    this.openRowContextMenu(row, rowElement, { left: event.clientX, top: event.clientY });
  }

  protected onRowMouseUp(event: MouseEvent, row: CxTableRow, rowElement?: HTMLElement): void {
    if (!this.rightClickMenu || event.button !== 2 || (row.menuItems?.length ?? 0) === 0) {
      return;
    }

    event.preventDefault();
  }

  protected onRowMenuOpenChange(rowId: string, open: boolean): void {
    if (open) {
      this.openRowMenuIdState.set(rowId);
      return;
    }

    if (this.openRowMenuIdState() === rowId) {
      this.openRowMenuIdState.set(undefined);
    }
  }

  protected onRowMenuItemSelect(rowId: string, itemId: string): void {
    this.openRowMenuIdState.set(undefined);
    this.rowMenuItemSelect.emit({ rowId, itemId });
  }

  protected onContextMenuItemSelect(itemId: string): void {
    const rowId = this.contextMenuRowIdState();
    if (!rowId) {
      return;
    }

    this.closeContextMenu();
    this.onRowMenuItemSelect(rowId, itemId);
  }

  protected closeContextMenu(): void {
    this.contextMenuOpenState.set(false);
    this.contextMenuRowIdState.set(undefined);
    this.contextMenuItemsState.set([]);
    this.contextMenuPositionState.set(undefined);
  }

  protected showContextMenuDividerBefore(index: number): boolean {
    if (index === 0) {
      return false;
    }

    const items = this.contextMenuItemsState();
    return (items[index]?.dividerBefore ?? false) || (items[index - 1]?.dividerAfter ?? false);
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

  protected rowIsKeyboardReachable(): boolean {
    return this.rowActivation !== 'none';
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
    return this.isColumnSortable(column);
  }

  protected columnHeaderMenuItems(column: CxTableColumn): CxMenuItem[] {
    if (!this.isColumnSortable(column)) {
      return [];
    }
    const sort = this.sortState();
    return [
      {
        id: 'sort-asc',
        label: 'Sort ascending',
        prependIcon: 'arrow-up',
        appendIcon: sort?.columnId === column.id && sort.direction === 'asc' ? 'check' : undefined,
      },
      {
        id: 'sort-desc',
        label: 'Sort descending',
        prependIcon: 'arrow-down',
        appendIcon: sort?.columnId === column.id && sort.direction === 'desc' ? 'check' : undefined,
      },
    ];
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

  protected onColumnHeaderMenuSelect(column: CxTableColumn, itemId: string): void {
    if (!this.isColumnSortable(column)) {
      return;
    }
    if (itemId !== 'sort-asc' && itemId !== 'sort-desc') {
      return;
    }

    const next: CxTableSort = {
      columnId: column.id,
      direction: itemId === 'sort-desc' ? 'desc' : 'asc',
    };

    this.sortState.set(next);
    this.sortChange.emit(next);
  }

  protected isColumnPinned(column: CxTableColumn): boolean {
    return column.pinned === true;
  }

  protected isLastPinnedColumn(column: CxTableColumn): boolean {
    const pinnedColumns = this.columns$().filter(candidate => candidate.pinned === true);
    return pinnedColumns[pinnedColumns.length - 1]?.id === column.id;
  }

  protected columnPinnedLeft(column: CxTableColumn): string | null {
    if (!this.isColumnPinned(column)) {
      return null;
    }
    return `${this.columnLeftOffsetsState()[column.id] ?? 0}px`;
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

  protected onColumnResizePointerDown(event: PointerEvent, column: CxTableColumn): void {
    if (!this.columnsResizable) {
      return;
    }
    const captureElement = event.currentTarget as HTMLElement;
    if (!this.isResizeGesture(event, captureElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

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

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  protected onColumnResizeMouseDown(event: MouseEvent, column: CxTableColumn): void {
    if (!this.columnsResizable) {
      return;
    }
    const captureElement = event.currentTarget as HTMLElement;
    if (!this.isResizeGesture(event, captureElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentWidth = this.currentColumnWidth(column.id);
    this.activeResizeSession = {
      columnId: column.id,
      startX: event.clientX,
      startWidth: currentWidth,
      pointerId: -1,
      handleElement: captureElement,
    };
    this.resizingColumnIdState.set(column.id);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
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

    this.stopResizeSession();
    this.updateColumnWidth(column.id, this.autoFitColumnWidth(column.id));
  }

  protected onColumnGripPointerDown(event: PointerEvent, column: CxTableColumn): void {
    if (!this.columnsReorderable) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const handleElement = event.currentTarget as HTMLElement;
    this.stopResizeSession();
    this.activeReorderSession = {
      columnId: column.id,
      columnLabel: column.label,
      pointerId: event.pointerId,
      handleElement,
    };
    this.draggingColumnIdState.set(column.id);
    this.dropIndicatorState.set(undefined);
    this.updateDragPreview(event.clientX, event.clientY, column.label);
    handleElement.setPointerCapture(event.pointerId);

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  protected onColumnGripMouseDown(event: MouseEvent, column: CxTableColumn): void {
    if (!this.columnsReorderable) {
      return;
    }
    if (this.activeReorderSession) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.stopResizeSession();
    this.activeReorderSession = {
      columnId: column.id,
      columnLabel: column.label,
      pointerId: -1,
      handleElement: event.currentTarget as HTMLElement,
    };
    this.draggingColumnIdState.set(column.id);
    this.dropIndicatorState.set(undefined);
    this.updateDragPreview(event.clientX, event.clientY, column.label);

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
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

  protected onColumnResizePointerMove(event: PointerEvent): void {
    if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
      return;
    }

    const delta = event.clientX - this.activeResizeSession.startX;
    const nextWidth = Math.max(72, Math.round(this.activeResizeSession.startWidth + delta));
    this.updateColumnWidth(this.activeResizeSession.columnId, nextWidth);
  }

  protected onColumnResizePointerUp(event: PointerEvent): void {
    if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
      return;
    }
    this.stopResizeSession();
  }

  @HostListener('window:mousemove', ['$event'])
  protected onWindowMouseMove(event: MouseEvent): void {
    if (this.activeResizeSession?.pointerId === -1) {
      const delta = event.clientX - this.activeResizeSession.startX;
      const nextWidth = Math.max(72, Math.round(this.activeResizeSession.startWidth + delta));
      this.updateColumnWidth(this.activeResizeSession.columnId, nextWidth);
      return;
    }

    if (this.activeReorderSession?.pointerId === -1) {
      const indicator = this.resolveDropIndicator(
        event.clientX,
        event.clientY,
        this.activeReorderSession.columnId,
      );
      this.dropIndicatorState.set(indicator);
      this.updateDragPreview(
        event.clientX,
        event.clientY,
        this.activeReorderSession.columnLabel,
      );
    }
  }

  @HostListener('window:mouseup')
  protected onWindowMouseUp(): void {
    if (this.activeResizeSession?.pointerId === -1) {
      this.stopResizeSession();
      return;
    }

    if (this.activeReorderSession?.pointerId === -1) {
      this.commitColumnReorder();
      this.stopReorderSession();
    }
  }

  private stopResizeSession(): void {
    const handleElement = this.activeResizeSession?.handleElement;
    const pointerId = this.activeResizeSession?.pointerId;
    if (handleElement && pointerId !== undefined && handleElement.hasPointerCapture(pointerId)) {
      handleElement.releasePointerCapture(pointerId);
    }
    this.activeResizeSession = undefined;
    this.resizingColumnIdState.set(undefined);
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  }

  private openRowContextMenu(
    row: CxTableRow,
    rowElement?: HTMLElement,
    position?: { left: number; top: number },
  ): void {
    if ((row.menuItems?.length ?? 0) === 0) {
      return;
    }

    this.activateRow(row);
    this.contextMenuRowIdState.set(row.id);
    this.contextMenuItemsState.set(row.menuItems ?? []);
    this.contextMenuPositionState.set(position ?? this.resolveRowContextMenuPosition(rowElement));
    this.contextMenuOpenState.set(true);
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
    const handleElement = this.activeReorderSession?.handleElement;
    const pointerId = this.activeReorderSession?.pointerId;
    if (handleElement && pointerId !== undefined && handleElement.hasPointerCapture(pointerId)) {
      handleElement.releasePointerCapture(pointerId);
    }
    this.activeReorderSession = undefined;
    this.draggingColumnIdState.set(undefined);
    this.dropIndicatorState.set(undefined);
    this.dragPreviewState.set(undefined);
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  }

  private updateColumnWidth(columnId: string, width: number): void {
    this.columnWidthOverridesState.update(current => ({
      ...current,
      [columnId]: width,
    }));
    this.applyColumnWidthToDom(columnId, width);
    this.syncPinnedColumnOffsets();
  }

  private syncPinnedColumnOffsets(): void {
    const pinnedColumns = this.columns$().filter(column => column.pinned === true);
    if (pinnedColumns.length === 0) {
      if (Object.keys(this.columnLeftOffsetsState()).length > 0) {
        this.columnLeftOffsetsState.set({});
      }
      return;
    }

    let left = 0;
    const next: Record<string, number> = {};
    for (const column of pinnedColumns) {
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

  private currentColumnWidth(columnId: string): number {
    const table = this.tableElement?.nativeElement;
    if (!table) {
      return 120;
    }

    const cell = table.querySelector(`th[data-column-id="${this.escapeColumnId(columnId)}"]`) as HTMLElement | null;
    return Math.max(72, Math.round(cell?.getBoundingClientRect().width ?? 120));
  }

  private autoFitColumnWidth(columnId: string): number {
    const table = this.tableElement?.nativeElement;
    if (!table) {
      return 120;
    }

    const selector = `[data-column-id="${this.escapeColumnId(columnId)}"]`;
    let maxContentWidth = 0;

    const headerLabel = table.querySelector(
      `th${selector} .cx-table__head-label`,
    ) as HTMLElement | null;
    if (headerLabel) {
      const headerGripAllowance = 24;
      maxContentWidth = Math.max(
        maxContentWidth,
        this.measureTextWidth(headerLabel.textContent ?? '', headerLabel) + headerGripAllowance,
      );
    }

    table.querySelectorAll(`td${selector}`).forEach(node => {
      const cell = node as HTMLElement;
      const textValue = cell.querySelector('.cx-table__text-value') as HTMLElement | null;
      if (textValue) {
        let cellWidth = this.measureTextWidth(textValue.textContent ?? '', textValue);
        if (cell.querySelector('.cx-table__text-icon')) {
          cellWidth += 24;
        }
        maxContentWidth = Math.max(maxContentWidth, cellWidth);
        return;
      }

      const content = cell.querySelector('.cx-table__measure-target > *') as HTMLElement | null;
      if (content) {
        maxContentWidth = Math.max(
          maxContentWidth,
          Math.ceil(content.getBoundingClientRect().width),
        );
      }
    });

    const horizontalPadding = this.density === 'comfortable' ? 40 : 16;
    const resizeHandleAllowance = 12;
    return Math.max(72, maxContentWidth + horizontalPadding + resizeHandleAllowance);
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

    if (!target) {
      return undefined;
    }

    const columnId = target.dataset['columnId'];
    if (!columnId || columnId === draggingColumnId) {
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
    this.columnOrderState.set(nextOrder);
    this.columnOrderChange.emit(nextOrder);
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

  private measureTextWidth(text: string, referenceElement: HTMLElement): number {
    const probe = document.createElement('span');
    const computedStyles = window.getComputedStyle(referenceElement);

    probe.textContent = text;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'nowrap';
    probe.style.pointerEvents = 'none';
    probe.style.font = computedStyles.font;
    probe.style.letterSpacing = computedStyles.letterSpacing;
    probe.style.textTransform = computedStyles.textTransform;

    document.body.appendChild(probe);
    const width = Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();
    return width;
  }
}
