import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Injector, Input, Output, ViewChild, afterNextRender, afterRenderEffect, computed, inject, signal, } from '@angular/core';
import { CxMenuComponent, CxMenuTriggerDirective, } from '../../overlay/cx-menu/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxOptionComponent } from '../../overlay/cx-option/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { measureCxFloatingSurface, } from '../../overlay/floating-surface.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxSeverityTagComponent, } from '../../display/cx-severity-tag/index.js';
import { CxStatusTagComponent, } from '../../display/cx-status-tag/index.js';
import { CxTagComponent, } from '../../display/cx-tag/index.js';
import { CxAvatarComponent, } from '../../display/cx-avatar/index.js';
import { CxTrendTagComponent, } from '../../display/cx-trend-tag/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxProgressBarComponent, } from '../../feedback/cx-progress-bar/index.js';
import { CxSkeletonLoader, CxSkeletonLoaderComponent, } from '../../feedback/cx-skeleton-loader/index.js';
import { CxStateMessageComponent, } from '../../feedback/cx-state-message/index.js';
import { CxCheckboxComponent } from '../../inputs/cx-checkbox/index.js';
import { CxColumnFilterEditorComponent, assertCxColumnFilterDefinition, estimateCxColumnFilterHeight, isCxColumnFilterValueActive, summarizeCxColumnFilterValue, withCxColumnFilterValue, } from '../cx-column-filter-editor/index.js';
import { CxTableTagsCellComponent } from './cx-table-tags-cell.component.js';
import * as i0 from "@angular/core";
const CX_TABLE_MAX_PINNED_COLUMNS = 3;
const CX_TABLE_MIN_UNPINNED_WIDTH = 144;
const CX_TABLE_MIN_UNPINNED_RATIO = 0.35;
const CX_TABLE_SELECTION_COLUMN_WIDTH = 32;
const CX_TABLE_HEADER_MENU_WIDTH = 320;
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
function hasSerializableFilterValue(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    const span = value;
    return Boolean(span.start
        || span.end
        || typeof span.min === 'number'
        || typeof span.max === 'number');
}
export class CxTableComponent {
    static instanceCounter = 0;
    injector = inject(Injector);
    instanceId = ++CxTableComponent.instanceCounter;
    columnHeaderDialogId = `cx-table-${this.instanceId}-column-dialog`;
    columnMinWidth = CX_TABLE_COLUMN_MIN_WIDTH;
    columnMaxWidth = CX_TABLE_COLUMN_MAX_WIDTH;
    columnsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnsState" }] : /* istanbul ignore next */ []));
    rowsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rowsState" }] : /* istanbul ignore next */ []));
    activeRowIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeRowIdState" }] : /* istanbul ignore next */ []));
    openRowMenuIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openRowMenuIdState" }] : /* istanbul ignore next */ []));
    contextMenuState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "contextMenuState" }] : /* istanbul ignore next */ []));
    selectionModeState = signal('none', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectionModeState" }] : /* istanbul ignore next */ []));
    selectedRowIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedRowIdsState" }] : /* istanbul ignore next */ []));
    columnOrderState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnOrderState" }] : /* istanbul ignore next */ []));
    columnWidthOverridesState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnWidthOverridesState" }] : /* istanbul ignore next */ []));
    // The declared key column carries the row identity, so it auto-fits to its
    // content until the user resizes it manually. Tables without a key retain
    // the historical first-column fallback.
    appliedKeyColumnAutoFit;
    keyColumnAutoFitTimer;
    contentWidthsState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "contentWidthsState" }] : /* istanbul ignore next */ []));
    columnLeftOffsetsState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnLeftOffsetsState" }] : /* istanbul ignore next */ []));
    effectivePinnedColumnIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "effectivePinnedColumnIdsState" }] : /* istanbul ignore next */ []));
    resizingColumnIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resizingColumnIdState" }] : /* istanbul ignore next */ []));
    draggingColumnIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draggingColumnIdState" }] : /* istanbul ignore next */ []));
    dropIndicatorState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dropIndicatorState" }] : /* istanbul ignore next */ []));
    dragPreviewState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dragPreviewState" }] : /* istanbul ignore next */ []));
    pendingContextMenuState;
    contextMenuTeardownPending = false;
    destroyed = false;
    tableViewportResizeObserver;
    observedTableViewport;
    lastViewportWidth = 0;
    columnReorderAnnouncementState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnReorderAnnouncementState" }] : /* istanbul ignore next */ []));
    sortState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sortState" }] : /* istanbul ignore next */ []));
    filterValuesState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterValuesState" }] : /* istanbul ignore next */ []));
    columnHeaderMenuColumnIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnHeaderMenuColumnIdState" }] : /* istanbul ignore next */ []));
    columnHeaderMenuPositionState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columnHeaderMenuPositionState" }] : /* istanbul ignore next */ []));
    columnHeaderMenuTrigger;
    // Placement is decided once per open; window-resize re-syncs keep the side
    // so an open header menu never flips.
    columnHeaderMenuLockedPlacement;
    activeResizeSession;
    keyboardReorderSession;
    activeReorderSession;
    tableElement;
    columnHeaderPopover;
    columnFilterEditor;
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
    set selectionMode(value) {
        this.selectionModeState.set(value ?? 'none');
    }
    set columns(value) {
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
        this.columnWidthOverridesState.update(current => Object.fromEntries(Object.entries(current).filter(([id]) => nextIds.includes(id))));
        this.scheduleKeyColumnAutoFit();
    }
    set rows(value) {
        const nextRows = value ?? [];
        const nextRowIds = new Set(nextRows.map(row => row.id));
        this.rowsState.set(nextRows);
        const activeRowId = this.activeRowIdState();
        const activeRow = activeRowId ? nextRows.find(row => row.id === activeRowId) : undefined;
        if (activeRowId && (!activeRow || this.rowKind(activeRow) === 'folder')) {
            this.activeRowIdState.set(undefined);
        }
        this.scheduleKeyColumnAutoFit();
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
    set activeRowId(value) {
        const row = value ? this.rowsState().find(candidate => candidate.id === value) : undefined;
        this.activeRowIdState.set(row && this.rowKind(row) === 'folder' ? undefined : value);
    }
    set selectedRowIds(value) {
        this.selectedRowIdsState.set(value ?? []);
    }
    set filterValues(value) {
        this.filterValuesState.set({ ...(value ?? {}) });
    }
    set sort(value) {
        this.sortState.set(value);
    }
    activeRowIdChange = new EventEmitter();
    emptyStateActionSelect = new EventEmitter();
    selectedRowIdsChange = new EventEmitter();
    rowMenuItemSelect = new EventEmitter();
    rowActivate = new EventEmitter();
    columnOrderChange = new EventEmitter();
    sortChange = new EventEmitter();
    filterValuesChange = new EventEmitter();
    resetTable = new EventEmitter();
    filterQueryChange = new EventEmitter();
    filterLoadMore = new EventEmitter();
    columnHeaderMenuOpenChange = new EventEmitter();
    columnPinChange = new EventEmitter();
    columnVisibilityChange = new EventEmitter();
    columns$ = computed(() => {
        const columns = this.columnsState();
        const columnMap = new Map(columns.map(column => [column.id, column]));
        const ordered = this.columnOrderState()
            .map(id => columnMap.get(id))
            .filter((column) => column !== undefined);
        const orderedIds = new Set(ordered.map(column => column.id));
        const resolvedColumns = ordered.length === columns.length
            ? ordered
            : [...ordered, ...columns.filter(column => !orderedIds.has(column.id))];
        return [
            ...resolvedColumns.filter(column => column.pinned === true),
            ...resolvedColumns.filter(column => column.pinned !== true),
        ];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "columns$" }] : /* istanbul ignore next */ []));
    rows$ = this.rowsState.asReadonly();
    activeRowId$ = this.activeRowIdState.asReadonly();
    selectedRowIds$ = this.selectedRowIdsState.asReadonly();
    openRowMenuId$ = this.openRowMenuIdState.asReadonly();
    contextMenu$ = this.contextMenuState.asReadonly();
    contextMenuItems$ = computed(() => {
        const contextMenu = this.contextMenuState();
        return contextMenu
            ? this.rowsState().find(row => row.id === contextMenu.rowId)?.menuItems ?? []
            : [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "contextMenuItems$" }] : /* istanbul ignore next */ []));
    resizingColumnId$ = this.resizingColumnIdState.asReadonly();
    draggingColumnId$ = this.draggingColumnIdState.asReadonly();
    dropIndicator$ = this.dropIndicatorState.asReadonly();
    dragPreview$ = this.dragPreviewState.asReadonly();
    columnReorderAnnouncement$ = this.columnReorderAnnouncementState.asReadonly();
    sort$ = this.sortState.asReadonly();
    filterValues$ = this.filterValuesState.asReadonly();
    columnLeftOffsets$ = this.columnLeftOffsetsState.asReadonly();
    columnHeaderMenuPosition$ = this.columnHeaderMenuPositionState.asReadonly();
    loadingSkeleton$ = computed(() => CxSkeletonLoader.ofTable(Math.max(1, this.columns$().length), 5).withMargin('0'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingSkeleton$" }] : /* istanbul ignore next */ []));
    hasRowMenus$ = computed(() => this.rowsState().some(row => (row.menuItems?.length ?? 0) > 0), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasRowMenus$" }] : /* istanbul ignore next */ []));
    hasRowSelection$ = computed(() => this.selectionModeState() === 'multiple', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasRowSelection$" }] : /* istanbul ignore next */ []));
    tableColumnSpan$ = computed(() => Math.max(1, this.columns$().length
        + (this.hasRowSelection$() ? 1 : 0)
        + (this.hasRowMenus$() && this.showRowActions ? 1 : 0)), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tableColumnSpan$" }] : /* istanbul ignore next */ []));
    selectableRowIds$ = computed(() => this.rowsState()
        .filter(row => this.rowIsSelectable(row))
        .map(row => row.id), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectableRowIds$" }] : /* istanbul ignore next */ []));
    selectedVisibleRowIds$ = computed(() => {
        const selectableRowIds = new Set(this.selectableRowIds$());
        return this.selectedRowIdsState().filter(rowId => selectableRowIds.has(rowId));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedVisibleRowIds$" }] : /* istanbul ignore next */ []));
    allRowsSelected$ = computed(() => {
        const selectableRowIds = this.selectableRowIds$();
        return selectableRowIds.length > 0
            && this.selectedVisibleRowIds$().length === selectableRowIds.length;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "allRowsSelected$" }] : /* istanbul ignore next */ []));
    partiallySelectedRows$ = computed(() => {
        const selectedCount = this.selectedVisibleRowIds$().length;
        return selectedCount > 0 && !this.allRowsSelected$();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "partiallySelectedRows$" }] : /* istanbul ignore next */ []));
    activeFilterCount$ = computed(() => {
        const definitions = new Map(this.columnsState()
            .filter((column) => column.filter !== undefined)
            .map(column => [column.id, column.filter]));
        return Object.entries(this.filterValuesState()).filter(([columnId, value]) => {
            const definition = definitions.get(columnId);
            return definition
                ? isCxColumnFilterValueActive(definition, value)
                : hasSerializableFilterValue(value);
        }).length;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeFilterCount$" }] : /* istanbul ignore next */ []));
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
            const next = {};
            let changed = false;
            for (const column of columns) {
                if (column.size !== 'content')
                    continue;
                if (overrides[column.id] !== undefined)
                    continue;
                const measured = this.autoFitColumnWidth(column.id);
                next[column.id] = measured;
                if (current[column.id] !== measured)
                    changed = true;
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
    ngOnDestroy() {
        this.destroyed = true;
        this.tableViewportResizeObserver?.disconnect();
        this.tableViewportResizeObserver = undefined;
        this.observedTableViewport = undefined;
        this.pendingContextMenuState = undefined;
        if (typeof window !== 'undefined' && this.keyColumnAutoFitTimer !== undefined) {
            window.clearTimeout(this.keyColumnAutoFitTimer);
        }
        this.stopResizeSession();
        this.stopReorderSession();
        this.cancelKeyboardColumnReorder(false);
        this.closeContextMenu(false);
        this.closeColumnHeaderMenu(false);
    }
    activateRow(row) {
        if (this.rowActivation === 'none') {
            return;
        }
        if (this.rowActivation === 'active') {
            this.setActiveRow(row);
        }
        this.rowActivate.emit({
            rowId: row.id,
            kind: this.rowKind(row),
        });
    }
    onRowClick(event, row, rowElement) {
        if (event.button !== 0 || this.eventComesFromInteractiveDescendant(event, rowElement)) {
            return;
        }
        this.activateRow(row);
    }
    onRowKeydown(event, row, rowElement) {
        if (!this.rowOwnsKeyboardEvent(event, rowElement)) {
            return;
        }
        if (this.rightClickMenu && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
            event.preventDefault();
            event.stopPropagation();
            this.openRowContextMenu(row, rowElement, undefined, 'keyboard');
            return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            this.moveRowFocus(row, event.key === 'ArrowUp' ? -1 : 1);
            return;
        }
        if (event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            if (this.selectionModeState() === 'multiple' && this.rowIsSelectable(row)) {
                this.toggleRowSelection(row.id, !this.isRowSelected(row.id));
            }
            return;
        }
        if (event.key !== 'Enter' || this.rowActivation === 'none') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.activateRow(row);
    }
    onRowContextMenu(event, row, rowElement) {
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
    onRowMenuOpenChange(rowId, open) {
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
    onRowMenuItemSelect(rowId, itemId) {
        this.rowMenuItemSelect.emit({ rowId, itemId });
    }
    onContextMenuItemSelect(itemId) {
        const contextMenu = this.contextMenuState();
        if (!contextMenu) {
            return;
        }
        this.rowMenuItemSelect.emit({ rowId: contextMenu.rowId, itemId });
    }
    onContextMenuOpenChange(open) {
        if (!open) {
            this.closeContextMenu(true);
        }
    }
    closeContextMenu(restoreFocus = true) {
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
    isRowSelected(rowId) {
        return this.selectedRowIdsState().includes(rowId);
    }
    toggleAllRowsSelection(checked) {
        if (this.selectionModeState() !== 'multiple') {
            return;
        }
        const selectableRowIds = this.selectableRowIds$();
        const visibleRowIdSet = new Set(this.rowsState().map(row => row.id));
        const preservedHiddenIds = this.selectedRowIdsState().filter(rowId => !visibleRowIdSet.has(rowId));
        const nextSelectedRowIds = checked
            ? [...preservedHiddenIds, ...selectableRowIds]
            : preservedHiddenIds;
        this.selectedRowIdsState.set(nextSelectedRowIds);
        this.selectedRowIdsChange.emit(nextSelectedRowIds);
    }
    toggleRowSelection(rowId, checked) {
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
    selectionLabel(row) {
        const keyColumn = this.columns$().find(column => column.key);
        const keyCell = keyColumn ? row.cells[keyColumn.id] : undefined;
        if (keyCell?.kind === 'text' && keyCell.value.trim()) {
            return `Select row ${keyCell.value.trim()}`;
        }
        return `Select row ${row.id}`;
    }
    trackColumn(index, column) {
        return column.id ?? `${index}`;
    }
    trackRow(index, row) {
        return row.id ?? `${index}`;
    }
    cellFor(row, columnId) {
        return row.cells[columnId];
    }
    progressPercent(value) {
        const normalizedValue = Number.isFinite(value)
            ? Math.min(Math.max(value, 0), 100)
            : 0;
        return `${Math.round(normalizedValue)}%`;
    }
    rowKind(row) {
        return row.kind === 'folder' ? 'folder' : 'item';
    }
    rowIsSelectable(row) {
        return this.rowKind(row) === 'item';
    }
    rowIsKeyboardReachable(row) {
        return this.rowActivation !== 'none'
            || (this.selectionModeState() === 'multiple' && this.rowIsSelectable(row))
            || (this.rightClickMenu && (row.menuItems?.length ?? 0) > 0);
    }
    rowLabel(row) {
        const keyCell = this.keyTextCell(row);
        if (!keyCell) {
            return null;
        }
        return `${this.rowKind(row) === 'folder' ? 'Folder' : 'Item'} ${keyCell.value}`;
    }
    resolvedTextIcon(row, column, cell) {
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
    isColumnSortable(column) {
        return column.sortable === true;
    }
    hasColumnHeaderMenu(column) {
        return (this.isColumnFilterable(column) ||
            this.isColumnSortable(column) ||
            this.isColumnPinnable(column) ||
            this.isColumnHideable(column));
    }
    columnHeaderMenuColumn() {
        const columnId = this.columnHeaderMenuColumnIdState();
        return columnId ? this.columns$().find(column => column.id === columnId) : undefined;
    }
    isColumnFilterable(column) {
        return column.filter !== undefined;
    }
    isColumnPinnable(column) {
        return column.pinnable === true;
    }
    isColumnHideable(column) {
        return column.hideable === true;
    }
    hasColumnHeaderMenuProperties(column) {
        return this.isColumnPinnable(column) || this.isColumnHideable(column);
    }
    columnFilterValue(column) {
        return this.filterValuesState()[column.id];
    }
    isColumnFilterActive(column) {
        return column.filter !== undefined
            && isCxColumnFilterValueActive(column.filter, this.filterValuesState()[column.id]);
    }
    columnFilterSummary(column) {
        return column.filter
            ? summarizeCxColumnFilterValue(column.filter, this.filterValuesState()[column.id])
            : undefined;
    }
    canPinColumn(column) {
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
    canHideColumn(column) {
        return this.isColumnHideable(column) && this.columns$().length > 1;
    }
    columnHeaderMenuAriaLabel(column) {
        return `${column.label} column actions`;
    }
    columnHeaderTriggerAriaLabel(column) {
        const summary = this.columnFilterSummary(column);
        return summary
            ? `Open ${column.label} column actions, filter ${summary}`
            : `Open ${column.label} column actions`;
    }
    isColumnHeaderMenuOpen(column) {
        return this.columnHeaderMenuColumnIdState() === column.id;
    }
    sortIcon(columnId) {
        const sort = this.sortState();
        if (sort?.columnId !== columnId) {
            return undefined;
        }
        return sort.direction === 'desc' ? 'arrow-down' : 'arrow-up';
    }
    sortAria(columnId) {
        const sort = this.sortState();
        if (sort?.columnId !== columnId) {
            return null;
        }
        return sort.direction === 'desc' ? 'descending' : 'ascending';
    }
    onColumnHeaderTriggerClick(event, column, triggerElement) {
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
    onColumnFilterValueChange(column, value) {
        if (!column.filter) {
            return;
        }
        const next = withCxColumnFilterValue(this.filterValuesState(), column.id, column.filter, value);
        if (next === this.filterValuesState()) {
            return;
        }
        this.filterValuesState.set(next);
        this.filterValuesChange.emit(next);
    }
    onColumnFilterQueryChange(columnId, query) {
        this.filterQueryChange.emit({ columnId, query });
    }
    onColumnFilterLoadMore(columnId) {
        this.filterLoadMore.emit({ columnId });
    }
    onResetTable() {
        if (this.activeFilterCount$() === 0) {
            return;
        }
        this.resetTable.emit();
    }
    onEmptyStateAction(action) {
        this.emptyStateActionSelect.emit(action);
    }
    onColumnHeaderAction(column, action) {
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
    applyColumnSort(column, action) {
        const next = {
            columnId: column.id,
            direction: action === 'sort-desc' ? 'desc' : 'asc',
        };
        this.sortState.set(next);
        this.sortChange.emit(next);
    }
    openColumnHeaderMenu(column, triggerElement) {
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
    closeColumnHeaderMenu(restoreFocus = true) {
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
    adjacentColumnHeaderTrigger(trigger) {
        const triggers = Array.from(this.tableElement?.nativeElement.querySelectorAll('button.cx-table__head-trigger') ?? []);
        const index = triggers.indexOf(trigger);
        return index < 0 ? undefined : triggers[index + 1] ?? triggers[index - 1];
    }
    focusColumnHeaderMenuWhenReady(column, attempt = 0) {
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
            ?.querySelector('.cx-table__header-menu-actions button:not(:disabled)');
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
    scheduleColumnHeaderMenuFocus(column) {
        if (typeof requestAnimationFrame === 'undefined') {
            queueMicrotask(() => this.focusColumnHeaderMenuWhenReady(column));
            return;
        }
        requestAnimationFrame(() => this.focusColumnHeaderMenuWhenReady(column));
    }
    retryColumnHeaderMenuFocus(column, attempt) {
        if (attempt >= 12 || typeof requestAnimationFrame === 'undefined') {
            return;
        }
        requestAnimationFrame(() => this.focusColumnHeaderMenuWhenReady(column, attempt + 1));
    }
    syncColumnHeaderMenuPosition(column, triggerElement) {
        if (typeof window === 'undefined') {
            return;
        }
        const rect = triggerElement.getBoundingClientRect();
        const propertyActionCount = Number(this.isColumnPinnable(column)) +
            Number(this.isColumnHideable(column));
        const islandCount = Number(column.filter !== undefined) +
            Number(this.isColumnSortable(column)) +
            Number(propertyActionCount > 0);
        const estimatedHeight = estimateCxColumnFilterHeight(column.filter) +
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
    isColumnPinned(column) {
        return column.pinned === true;
    }
    isLastPinnedColumn(column) {
        const pinnedIds = this.effectivePinnedColumnIdsState();
        return pinnedIds[pinnedIds.length - 1] === column.id;
    }
    columnPinnedLeft(column) {
        if (!this.isColumnEffectivelyPinned(column)) {
            return null;
        }
        return `${this.columnLeftOffsetsState()[column.id] ?? 0}px`;
    }
    isColumnEffectivelyPinned(column) {
        return this.effectivePinnedColumnIdsState().includes(column.id);
    }
    columnWidth(column) {
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
    columnWidthValue(column) {
        return this.columnWidthOverridesState()[column.id]
            ?? this.contentWidthsState()[column.id]
            ?? this.currentColumnWidth(column.id);
    }
    onColumnResizePointerDown(event, column) {
        if (!this.columnsResizable || !event.isPrimary || event.button !== 0) {
            return;
        }
        const captureElement = event.currentTarget;
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
    onColumnResizeDoubleClick(event, column) {
        if (!this.columnsResizable) {
            return;
        }
        const captureElement = event.currentTarget;
        if (!this.isResizeGesture(event, captureElement)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.closeColumnHeaderMenu(false);
        this.stopResizeSession();
        this.updateColumnWidth(column.id, this.autoFitColumnWidth(column.id));
    }
    onColumnResizeKeydown(event, column) {
        if (!this.columnsResizable) {
            return;
        }
        const currentWidth = this.currentColumnWidth(column.id);
        const step = event.shiftKey ? CX_TABLE_COLUMN_RESIZE_LARGE_STEP : CX_TABLE_COLUMN_RESIZE_STEP;
        let nextWidth;
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
    onColumnGripPointerDown(event, column) {
        if (!this.columnsReorderable || !event.isPrimary || event.button !== 0) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.closeColumnHeaderMenu(false);
        const handleElement = event.currentTarget;
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
    onColumnGripPointerMove(event) {
        if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
            return;
        }
        const indicator = this.resolveDropIndicator(event.clientX, event.clientY, this.activeReorderSession.columnId);
        this.dropIndicatorState.set(indicator);
        this.updateDragPreview(event.clientX, event.clientY, this.activeReorderSession.columnLabel);
    }
    onColumnGripPointerUp(event) {
        if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
            return;
        }
        this.commitColumnReorder();
        this.stopReorderSession();
    }
    onColumnGripPointerCancel(event) {
        if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
            return;
        }
        this.stopReorderSession();
    }
    onColumnGripLostPointerCapture(event) {
        if (!this.activeReorderSession || event.pointerId !== this.activeReorderSession.pointerId) {
            return;
        }
        this.stopReorderSession();
    }
    onColumnGripKeydown(event, column, handleElement) {
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
    onColumnResizePointerMove(event) {
        if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
            return;
        }
        const delta = event.clientX - this.activeResizeSession.startX;
        const nextWidth = this.activeResizeSession.startWidth + delta;
        this.updateColumnWidth(this.activeResizeSession.columnId, nextWidth);
    }
    onColumnResizePointerUp(event) {
        if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
            return;
        }
        this.stopResizeSession();
    }
    onColumnResizePointerCancel(event) {
        if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
            return;
        }
        this.stopResizeSession();
    }
    onColumnResizeLostPointerCapture(event) {
        if (!this.activeResizeSession || event.pointerId !== this.activeResizeSession.pointerId) {
            return;
        }
        this.stopResizeSession();
    }
    onWindowResize() {
        this.syncPinnedColumnOffsets();
        const column = this.columnHeaderMenuColumn();
        if (!column || !this.columnHeaderMenuTrigger) {
            return;
        }
        this.syncColumnHeaderMenuPosition(column, this.columnHeaderMenuTrigger);
    }
    stopResizeSession() {
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
    openRowContextMenu(row, rowElement, position, invocation = 'pointer') {
        if ((row.menuItems?.length ?? 0) === 0) {
            return;
        }
        this.openRowMenuIdState.set(undefined);
        this.closeColumnHeaderMenu(false);
        this.closeContextMenu(false);
        const nextContextMenu = {
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
    resolveRowContextMenuPosition(rowElement) {
        const rect = rowElement?.getBoundingClientRect();
        if (!rect) {
            return { left: 16, top: 16 };
        }
        return {
            left: Math.max(rect.right - 16, rect.left + 16),
            top: rect.top + Math.min(rect.height / 2, 16),
        };
    }
    stopReorderSession() {
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
     * The key column carries the row identity, so it sizes to its content
     * automatically whenever rows or columns change — until the
     * user resizes it manually, which takes ownership of the width.
     * Timeout-based (not animation frames) so it also runs in hidden tabs, and
     * retried briefly because the new rows render one change-detection pass
     * after the input setter fires.
     */
    scheduleKeyColumnAutoFit() {
        if (typeof window === 'undefined') {
            return;
        }
        if (this.keyColumnAutoFitTimer !== undefined) {
            window.clearTimeout(this.keyColumnAutoFitTimer);
        }
        const attempt = (tries) => {
            this.keyColumnAutoFitTimer = undefined;
            if (this.destroyed || this.applyKeyColumnAutoFit() || tries >= 5) {
                return;
            }
            this.keyColumnAutoFitTimer = window.setTimeout(() => attempt(tries + 1), 32);
        };
        this.keyColumnAutoFitTimer = window.setTimeout(() => attempt(0), 0);
    }
    /** Returns true when settled: applied, or skipped because the user owns the width. */
    applyKeyColumnAutoFit() {
        const columns = this.columns$();
        const keyColumn = columns.find(column => column.key) ?? columns[0];
        if (!keyColumn || this.rowsState().length === 0) {
            return false;
        }
        const table = this.tableElement?.nativeElement;
        if (!table?.querySelector(`td[data-column-id="${this.escapeColumnId(keyColumn.id)}"]`)) {
            return false;
        }
        const applied = this.appliedKeyColumnAutoFit;
        if (keyColumn.size !== undefined && keyColumn.size !== 'flex') {
            if (applied && this.columnWidthOverridesState()[applied.columnId] === applied.width) {
                this.columnWidthOverridesState.update(current => {
                    const next = { ...current };
                    delete next[applied.columnId];
                    return next;
                });
            }
            this.appliedKeyColumnAutoFit = undefined;
            return true;
        }
        if (applied && applied.columnId !== keyColumn.id) {
            this.columnWidthOverridesState.update(current => {
                if (current[applied.columnId] !== applied.width)
                    return current;
                const next = { ...current };
                delete next[applied.columnId];
                return next;
            });
        }
        const override = this.columnWidthOverridesState()[keyColumn.id];
        const autoFitOwnsWidth = override === undefined ||
            (applied?.columnId === keyColumn.id && applied.width === override);
        if (!autoFitOwnsWidth) {
            return true;
        }
        const width = this.capAutoFitColumnWidthToViewport(keyColumn.id, this.clampColumnWidth(this.autoFitColumnWidth(keyColumn.id)));
        this.updateColumnWidth(keyColumn.id, width);
        this.appliedKeyColumnAutoFit = { columnId: keyColumn.id, width };
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
    capAutoFitColumnWidthToViewport(columnId, width) {
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
    updateColumnWidth(columnId, width) {
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
    syncPinnedColumnOffsets() {
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
        const effectivePinnedColumns = [];
        for (const column of pinnedColumns.slice(0, CX_TABLE_MAX_PINNED_COLUMNS)) {
            const candidate = [...effectivePinnedColumns, column];
            if (!this.pinnedColumnsFit(candidate)) {
                break;
            }
            effectivePinnedColumns.push(column);
        }
        const effectiveIds = effectivePinnedColumns.map(column => column.id);
        const currentEffectiveIds = this.effectivePinnedColumnIdsState();
        if (effectiveIds.length !== currentEffectiveIds.length ||
            effectiveIds.some((id, index) => currentEffectiveIds[index] !== id)) {
            this.effectivePinnedColumnIdsState.set(effectiveIds);
        }
        let left = this.currentSelectionColumnWidth();
        const next = {};
        for (const column of effectivePinnedColumns) {
            next[column.id] = left;
            left += this.currentColumnWidth(column.id);
        }
        const current = this.columnLeftOffsetsState();
        const currentKeys = Object.keys(current);
        const nextKeys = Object.keys(next);
        const changed = currentKeys.length !== nextKeys.length ||
            nextKeys.some(key => current[key] !== next[key]);
        if (changed) {
            this.columnLeftOffsetsState.set(next);
        }
    }
    observeTableViewport() {
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
                this.scheduleKeyColumnAutoFit();
            }
        });
        this.tableViewportResizeObserver.observe(viewport);
    }
    pinnedColumnsFit(pinnedColumns) {
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
        const pinnedWidth = pinnedColumns.reduce((total, candidate) => total + this.currentColumnWidth(candidate.id), selectionWidth);
        return pinnedWidth <= Math.max(0, viewportWidth - reachableWidth);
    }
    currentSelectionColumnWidth() {
        if (!this.hasRowSelection$()) {
            return 0;
        }
        const table = this.tableElement?.nativeElement;
        const cell = table?.querySelector('.cx-table__head-cell--selection, .cx-table__cell--selection');
        return cell?.getBoundingClientRect().width ?? CX_TABLE_SELECTION_COLUMN_WIDTH;
    }
    currentColumnWidth(columnId) {
        const override = this.columnWidthOverridesState()[columnId];
        if (typeof override === 'number') {
            return this.clampColumnWidth(override);
        }
        const table = this.tableElement?.nativeElement;
        if (!table) {
            return this.clampColumnWidth(120);
        }
        const cell = table.querySelector(`th[data-column-id="${this.escapeColumnId(columnId)}"]`);
        return this.clampColumnWidth(cell?.getBoundingClientRect().width ?? 120);
    }
    autoFitColumnWidth(columnId) {
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
        let paddedCell;
        const headerCell = table.querySelector(`th${selector}`);
        const headerContent = headerCell?.querySelector('.cx-table__head-content');
        if (headerContent) {
            maxContentWidth = Math.max(maxContentWidth, this.measureNaturalContentWidth(headerContent));
            paddedCell = headerCell ?? undefined;
        }
        table.querySelectorAll(`td${selector}`).forEach(node => {
            const cell = node;
            const content = cell.querySelector('.cx-table__measure-target');
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
    measureNaturalContentWidth(content) {
        const parent = content.parentElement;
        if (!parent) {
            return Math.ceil(content.getBoundingClientRect().width);
        }
        const clone = content.cloneNode(true);
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
    escapeColumnId(columnId) {
        return columnId.replace(/"/g, '\\"');
    }
    resolveDropIndicator(clientX, clientY, draggingColumnId) {
        const target = document.elementFromPoint(clientX, clientY)?.closest('th[data-column-id]');
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
    commitColumnReorder() {
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
    startKeyboardColumnReorder(column, handleElement) {
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
    moveKeyboardColumn(column, direction) {
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
        const nextOrder = currentOrder.map(columnId => partitionIds.has(columnId) ? partition[partitionIndex++] : columnId);
        this.columnOrderState.set(this.normalizeColumnOrder(nextOrder, this.columnsState()));
        this.announceColumnPosition(column, 'Moving');
        this.focusColumnGripAfterRender(column.id);
    }
    commitKeyboardColumnReorder() {
        const session = this.keyboardReorderSession;
        if (!session) {
            return;
        }
        const nextOrder = [...this.columnOrderState()];
        const changed = !this.ordersMatch(session.originalOrder, nextOrder);
        this.keyboardReorderSession = undefined;
        this.draggingColumnIdState.set(undefined);
        this.columnReorderAnnouncementState.set(changed ? `${session.columnLabel} column move complete.` : `${session.columnLabel} column position unchanged.`);
        if (changed) {
            this.columnOrderChange.emit(nextOrder);
        }
        this.focusColumnGripAfterRender(session.columnId);
    }
    cancelKeyboardColumnReorder(announce) {
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
        }
        else {
            this.columnReorderAnnouncementState.set('');
        }
    }
    focusColumnGripAfterRender(columnId) {
        afterNextRender(() => this.focusColumnGrip(columnId), { injector: this.injector });
    }
    announceColumnPosition(column, prefix) {
        const order = this.columnOrderState();
        const position = Math.max(order.indexOf(column.id), 0) + 1;
        this.columnReorderAnnouncementState.set(`${prefix} ${column.label} column, position ${position} of ${order.length}.`);
    }
    focusColumnGrip(columnId) {
        const grips = this.tableElement?.nativeElement.querySelectorAll('[data-column-grip-id]');
        Array.from(grips ?? []).find(grip => grip.dataset['columnGripId'] === columnId)?.focus();
    }
    normalizeColumnOrder(order, columns) {
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
    ordersMatch(left, right) {
        return left.length === right.length && left.every((id, index) => id === right[index]);
    }
    clampColumnWidth(width) {
        const rounded = Number.isFinite(width) ? Math.round(width) : CX_TABLE_COLUMN_MIN_WIDTH;
        return Math.min(Math.max(rounded, CX_TABLE_COLUMN_MIN_WIDTH), CX_TABLE_COLUMN_MAX_WIDTH);
    }
    applyColumnWidthToDom(columnId, width) {
        const table = this.tableElement?.nativeElement;
        if (!table) {
            return;
        }
        const pxWidth = `${width}px`;
        const selector = `[data-column-id="${this.escapeColumnId(columnId)}"]`;
        table.querySelectorAll(selector).forEach(node => {
            const element = node;
            element.style.width = pxWidth;
            element.style.minWidth = pxWidth;
            element.style.maxWidth = pxWidth;
        });
    }
    isResizeGesture(event, element) {
        const rect = element.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right;
    }
    rowOwnsKeyboardEvent(event, rowElement) {
        return Boolean(rowElement && event.target === rowElement);
    }
    moveRowFocus(row, direction) {
        const rows = this.rowsState();
        const currentIndex = rows.findIndex(candidate => candidate.id === row.id);
        if (currentIndex < 0) {
            return;
        }
        let nextIndex = currentIndex + direction;
        while (nextIndex >= 0 && nextIndex < rows.length && !this.rowIsKeyboardReachable(rows[nextIndex])) {
            nextIndex += direction;
        }
        if (nextIndex < 0 || nextIndex >= rows.length) {
            return;
        }
        const nextRow = rows[nextIndex];
        const nextRowElement = Array.from(this.tableElement?.nativeElement.querySelectorAll('tbody tr[data-row-id]') ?? []).find(element => element.dataset['rowId'] === nextRow.id);
        if (!nextRowElement) {
            return;
        }
        nextRowElement.focus();
        if (this.rowActivation === 'active') {
            this.setActiveRow(nextRow);
        }
    }
    setActiveRow(row) {
        const nextActiveRowId = this.rowKind(row) === 'folder' ? undefined : row.id;
        if (this.activeRowIdState() === nextActiveRowId) {
            return;
        }
        this.activeRowIdState.set(nextActiveRowId);
        this.activeRowIdChange.emit(nextActiveRowId);
    }
    eventComesFromInteractiveDescendant(event, rowElement) {
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
    elementPathToRow(target, rowElement) {
        const path = [];
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
    isInteractiveElement(element) {
        if (element.matches('button, input, select, textarea, label, summary, a[href], area[href], audio[controls], video[controls], iframe')) {
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
    keyTextCell(row) {
        const keyColumn = this.columns$().find(column => column.key);
        const keyCell = keyColumn ? row.cells[keyColumn.id] : undefined;
        return keyCell?.kind === 'text' && keyCell.value.trim() ? keyCell : undefined;
    }
    updateDragPreview(clientX, clientY, label) {
        const estimatedWidth = Math.min(Math.max(label.length * 11 + 52, 96), 220);
        const estimatedHeight = 52;
        const viewportInset = 8;
        const offsetX = 14;
        const offsetY = -20;
        const left = Math.min(Math.max(viewportInset, clientX + offsetX), window.innerWidth - estimatedWidth - viewportInset);
        const top = Math.min(Math.max(viewportInset, clientY + offsetY), window.innerHeight - estimatedHeight - viewportInset);
        this.dragPreviewState.set({
            label,
            left,
            top,
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTableComponent, isStandalone: true, selector: "cx-table", inputs: { density: "density", rowActivation: "rowActivation", showHeaders: "showHeaders", columnsResizable: "columnsResizable", columnsReorderable: "columnsReorderable", stickyHeader: "stickyHeader", zebra: "zebra", loading: "loading", showRowActions: "showRowActions", rightClickMenu: "rightClickMenu", emptyState: "emptyState", emptyStateAction: "emptyStateAction", noMatchesState: "noMatchesState", selectionMode: "selectionMode", columns: "columns", rows: "rows", activeRowId: "activeRowId", selectedRowIds: "selectedRowIds", filterValues: "filterValues", sort: "sort" }, outputs: { activeRowIdChange: "activeRowIdChange", emptyStateActionSelect: "emptyStateActionSelect", selectedRowIdsChange: "selectedRowIdsChange", rowMenuItemSelect: "rowMenuItemSelect", rowActivate: "rowActivate", columnOrderChange: "columnOrderChange", sortChange: "sortChange", filterValuesChange: "filterValuesChange", resetTable: "resetTable", filterQueryChange: "filterQueryChange", filterLoadMore: "filterLoadMore", columnHeaderMenuOpenChange: "columnHeaderMenuOpenChange", columnPinChange: "columnPinChange", columnVisibilityChange: "columnVisibilityChange" }, host: { listeners: { "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "tableElement", first: true, predicate: ["tableElement"], descendants: true }, { propertyName: "columnHeaderPopover", first: true, predicate: ["columnHeaderPopover"], descendants: true }, { propertyName: "columnFilterEditor", first: true, predicate: CxColumnFilterEditorComponent, descendants: true }], ngImport: i0, template: "<div\n  class=\"cx-table\"\n  [class.cx-table--compact]=\"density === 'compact'\"\n  [class.cx-table--comfortable]=\"density === 'comfortable'\"\n  [class.cx-table--row-press]=\"rowActivation === 'press'\"\n  [class.cx-table--row-active]=\"rowActivation === 'active'\"\n  [class.cx-table--sticky-header]=\"stickyHeader && showHeaders\"\n  [class.cx-table--zebra]=\"zebra\"\n  [class.cx-table--loading]=\"loading\"\n>\n  <span class=\"cx-table__visually-hidden\" aria-live=\"polite\" aria-atomic=\"true\">\n    {{ columnReorderAnnouncement$() }}\n  </span>\n  @if (loading || rows$().length > 0 || columns$().length > 0) {\n    <table #tableElement class=\"cx-table__table\">\n      <colgroup>\n        @if (hasRowSelection$()) {\n          <col class=\"cx-table__selection-column\" />\n        }\n        @for (column of columns$(); track trackColumn($index, column)) {\n          <col\n            [style.width]=\"columnWidth(column)\"\n            [style.min-width]=\"columnWidth(column)\"\n            [style.max-width]=\"columnWidth(column)\"\n            [attr.data-column-id]=\"column.id\"\n          />\n        }\n        @if (hasRowMenus$() && showRowActions) {\n          <col class=\"cx-table__menu-column\" />\n        }\n      </colgroup>\n      @if (showHeaders) {\n        <thead>\n        <tr class=\"cx-table__head-row\">\n          @if (hasRowSelection$()) {\n            <th class=\"cx-table__head-cell cx-table__head-cell--selection\" scope=\"col\">\n              <cx-checkbox\n                [value]=\"partiallySelectedRows$() ? 'indeterminate' : allRowsSelected$() ? 'selected' : 'deselected'\"\n                ariaLabel=\"Select all rows\"\n                (selectedChange)=\"toggleAllRowsSelection($event)\"\n              />\n            </th>\n          }\n          @for (column of columns$(); track trackColumn($index, column)) {\n            <th\n              class=\"cx-table__head-cell\"\n              [class.cx-table__head-cell--interactive]=\"hasColumnHeaderMenu(column) || columnsReorderable || columnsResizable\"\n              [class.cx-table__head-cell--end]=\"column.align === 'end'\"\n              [class.cx-table__head-cell--pinned]=\"isColumnEffectivelyPinned(column)\"\n              [class.cx-table__head-cell--last-pinned]=\"isLastPinnedColumn(column)\"\n              [class.cx-table__head-cell--dragging]=\"draggingColumnId$() === column.id\"\n              [class.cx-table__head-cell--drop-before]=\"dropIndicator$()?.columnId === column.id && dropIndicator$()?.position === 'before'\"\n              [class.cx-table__head-cell--drop-after]=\"dropIndicator$()?.columnId === column.id && dropIndicator$()?.position === 'after'\"\n              [style.width]=\"columnWidth(column)\"\n              [style.min-width]=\"columnWidth(column)\"\n              [style.max-width]=\"columnWidth(column)\"\n              [style.left]=\"columnPinnedLeft(column)\"\n              [attr.data-column-id]=\"column.id\"\n              [attr.aria-sort]=\"sortAria(column.id)\"\n              scope=\"col\"\n            >\n              <div class=\"cx-table__head-content\">\n                @if (hasColumnHeaderMenu(column)) {\n                  <button\n                    #headerTrigger\n                    type=\"button\"\n                    class=\"cx-table__head-trigger\"\n                    [attr.aria-label]=\"columnHeaderTriggerAriaLabel(column)\"\n                    aria-haspopup=\"dialog\"\n                    [attr.aria-expanded]=\"isColumnHeaderMenuOpen(column)\"\n                    [attr.aria-controls]=\"columnHeaderDialogId\"\n                    [cxTooltip]=\"column.label\"\n                    [cxTooltipOverflow]=\"true\"\n                    (click)=\"onColumnHeaderTriggerClick($event, column, headerTrigger)\"\n                  >\n                    <span class=\"cx-table__head-label\" data-cx-tooltip-overflow>{{ column.label }}</span>\n                    @if (sortIcon(column.id); as iconName) {\n                      <cx-icon class=\"cx-table__sort-icon\" [icon]=\"iconName\" [size]=\"14\" />\n                    }\n                  </button>\n                } @else {\n                  <span class=\"cx-table__head-trigger cx-table__head-trigger--static\">\n                    <span\n                      class=\"cx-table__head-label\"\n                      [cxTooltip]=\"column.label\"\n                      [cxTooltipOverflow]=\"true\"\n                    >{{ column.label }}</span>\n                  </span>\n                }\n                @if (columnsReorderable) {\n                  <button\n                    #columnGrip\n                    type=\"button\"\n                    class=\"cx-table__column-grip\"\n                    [class.cx-table__column-grip--active]=\"draggingColumnId$() === column.id\"\n                    [attr.aria-label]=\"'Reorder ' + column.label + ' column'\"\n                    [attr.data-column-grip-id]=\"column.id\"\n                    (pointerdown)=\"onColumnGripPointerDown($event, column)\"\n                    (pointermove)=\"onColumnGripPointerMove($event)\"\n                    (pointerup)=\"onColumnGripPointerUp($event)\"\n                    (pointercancel)=\"onColumnGripPointerCancel($event)\"\n                    (lostpointercapture)=\"onColumnGripLostPointerCapture($event)\"\n                    (keydown)=\"onColumnGripKeydown($event, column, columnGrip)\"\n                    (click)=\"$event.stopPropagation()\"\n                  >\n                    <cx-icon icon=\"grip-vertical\" [size]=\"16\" />\n                  </button>\n                }\n              </div>\n              @if (columnsResizable) {\n                <div\n                  class=\"cx-table__column-resizer\"\n                  [class.cx-table__column-resizer--active]=\"resizingColumnId$() === column.id\"\n                  [attr.aria-label]=\"'Resize ' + column.label + ' column'\"\n                  aria-orientation=\"vertical\"\n                  [attr.aria-valuemin]=\"columnMinWidth\"\n                  [attr.aria-valuemax]=\"columnMaxWidth\"\n                  [attr.aria-valuenow]=\"columnWidthValue(column)\"\n                  [attr.aria-valuetext]=\"columnWidthValue(column) + ' pixels'\"\n                  tabindex=\"0\"\n                  role=\"separator\"\n                  (pointerdown)=\"onColumnResizePointerDown($event, column)\"\n                  (pointermove)=\"onColumnResizePointerMove($event)\"\n                  (pointerup)=\"onColumnResizePointerUp($event)\"\n                  (pointercancel)=\"onColumnResizePointerCancel($event)\"\n                  (lostpointercapture)=\"onColumnResizeLostPointerCapture($event)\"\n                  (keydown)=\"onColumnResizeKeydown($event, column)\"\n                  (dblclick)=\"onColumnResizeDoubleClick($event, column)\"\n                ></div>\n              }\n            </th>\n          }\n          @if (hasRowMenus$() && showRowActions) {\n            <th class=\"cx-table__head-cell cx-table__head-cell--menu\" scope=\"col\"></th>\n          }\n        </tr>\n        </thead>\n      }\n\n      <tbody class=\"cx-table__body\">\n        @if (loading) {\n          <tr class=\"cx-table__loading-row\">\n            <td class=\"cx-table__loading-cell\" [attr.colspan]=\"tableColumnSpan$()\">\n              <cx-skeleton-loader [skeleton]=\"loadingSkeleton$()\" />\n            </td>\n          </tr>\n        } @else {\n          @for (row of rows$(); track trackRow($index, row)) {\n          <tr\n            class=\"cx-table__row\"\n            [class.cx-table__row--active]=\"rowKind(row) === 'item' && activeRowId$() === row.id\"\n            [class.cx-table__row--folder]=\"rowKind(row) === 'folder'\"\n            [class.cx-table__row--item]=\"rowKind(row) === 'item'\"\n            [attr.data-row-id]=\"row.id\"\n            [attr.tabindex]=\"rowIsKeyboardReachable(row) ? '0' : null\"\n            [attr.aria-label]=\"rowLabel(row)\"\n            (click)=\"onRowClick($event, row, $any($event.currentTarget))\"\n            (keydown)=\"onRowKeydown($event, row, $any($event.currentTarget))\"\n            (contextmenu)=\"onRowContextMenu($event, row, $any($event.currentTarget))\"\n          >\n            @if (hasRowSelection$()) {\n              @if (rowIsSelectable(row)) {\n                <td\n                  class=\"cx-table__cell cx-table__cell--selection\"\n                  (click)=\"$event.stopPropagation()\"\n                  (keydown)=\"$event.stopPropagation()\"\n                >\n                  <cx-checkbox\n                    [selected]=\"isRowSelected(row.id)\"\n                    [ariaLabel]=\"selectionLabel(row)\"\n                    (selectedChange)=\"toggleRowSelection(row.id, $event)\"\n                  />\n                </td>\n              } @else {\n                <td class=\"cx-table__cell cx-table__cell--selection\"></td>\n              }\n            }\n            @for (column of columns$(); track trackColumn($index, column)) {\n              @if (cellFor(row, column.id); as cell) {\n                <td\n                  class=\"cx-table__cell\"\n                  [class.cx-table__cell--key]=\"column.key\"\n                  [class.cx-table__cell--end]=\"column.align === 'end'\"\n                  [class.cx-table__cell--pinned]=\"isColumnEffectivelyPinned(column)\"\n                  [class.cx-table__cell--last-pinned]=\"isLastPinnedColumn(column)\"\n                  [style.width]=\"columnWidth(column)\"\n                  [style.min-width]=\"columnWidth(column)\"\n                  [style.max-width]=\"columnWidth(column)\"\n                  [style.left]=\"columnPinnedLeft(column)\"\n                  [attr.data-column-id]=\"column.id\"\n                >\n                  <div class=\"cx-table__cell-content\">\n                    <div class=\"cx-table__measure-target\">\n                      @switch (cell.kind) {\n                        @case ('status-tag') {\n                          <cx-status-tag [mood]=\"cell.mood\" [text]=\"cell.text\" [icon]=\"cell.icon\" />\n                        }\n                        @case ('severity-tag') {\n                          <cx-severity-tag\n                            [severity]=\"cell.severity\"\n                            [score]=\"cell.score\"\n                            [kev]=\"cell.kev ?? false\"\n                            [display]=\"cell.display ?? 'severity'\"\n                            [favor]=\"cell.favor ?? 'low'\"\n                          />\n                        }\n                        @case ('trend-tag') {\n                          <cx-trend-tag\n                            [amount]=\"cell.amount\"\n                            [favor]=\"cell.favor ?? 'up'\"\n                            [unit]=\"cell.unit ?? 'percent'\"\n                          />\n                        }\n                        @case ('tag') {\n                          <cx-tag\n                            [text]=\"cell.label\"\n                            [color]=\"cell.color ?? 'default'\"\n                            [outline]=\"cell.outline ?? false\"\n                          />\n                        }\n                        @case ('tags') {\n                          <cx-table-tags-cell [tags]=\"cell.tags\" />\n                        }\n                        @case ('person') {\n                          <div class=\"cx-table__person\">\n                            <cx-avatar\n                              [name]=\"cell.name\"\n                              [src]=\"cell.src\"\n                              [color]=\"cell.color ?? 'auto'\"\n                              size=\"small\"\n                              ariaLabel=\"\"\n                            />\n                            <span class=\"cx-table__person-copy\">\n                              <span class=\"cx-table__person-name\">{{ cell.name }}</span>\n                              @if (cell.detail) {\n                                <span class=\"cx-table__person-detail\">{{ cell.detail }}</span>\n                              }\n                            </span>\n                          </div>\n                        }\n                        @case ('progress') {\n                          <div class=\"cx-table__progress\">\n                            <cx-progress-bar\n                              class=\"cx-table__progress-bar\"\n                              label=\"\"\n                              [ariaLabel]=\"cell.label ?? 'Progress'\"\n                              [value]=\"cell.value\"\n                              [mood]=\"cell.mood ?? 'default'\"\n                              [showValue]=\"false\"\n                            />\n                            <span class=\"cx-table__progress-value\" aria-hidden=\"true\">\n                              {{ progressPercent(cell.value) }}\n                            </span>\n                          </div>\n                        }\n                        @default {\n                          <span\n                            class=\"cx-table__text\"\n                            [class.cx-table__text--strong]=\"cell.strong\"\n                            [class.cx-table__text--muted]=\"cell.muted\"\n                          >\n                            @if (resolvedTextIcon(row, column, cell); as iconName) {\n                              <cx-icon class=\"cx-table__text-icon\" [icon]=\"iconName\" [size]=\"16\" />\n                            }\n                            <span\n                              class=\"cx-table__text-value\"\n                              [cxTooltip]=\"cell.value\"\n                              [cxTooltipOverflow]=\"true\"\n                            >{{ cell.value }}</span>\n                          </span>\n                        }\n                      }\n                    </div>\n                  </div>\n                </td>\n              } @else {\n                <td\n                  class=\"cx-table__cell\"\n                  [class.cx-table__cell--key]=\"column.key\"\n                  [class.cx-table__cell--end]=\"column.align === 'end'\"\n                  [class.cx-table__cell--pinned]=\"isColumnEffectivelyPinned(column)\"\n                  [class.cx-table__cell--last-pinned]=\"isLastPinnedColumn(column)\"\n                  [style.width]=\"columnWidth(column)\"\n                  [style.min-width]=\"columnWidth(column)\"\n                  [style.max-width]=\"columnWidth(column)\"\n                  [style.left]=\"columnPinnedLeft(column)\"\n                  [attr.data-column-id]=\"column.id\"\n                ></td>\n              }\n            }\n\n            @if (hasRowMenus$() && showRowActions) {\n              <td\n                class=\"cx-table__cell cx-table__cell--menu\"\n                (click)=\"$event.stopPropagation()\"\n                (keydown)=\"$event.stopPropagation()\"\n              >\n                @if (row.menuItems?.length) {\n                  <cx-menu\n                    [presentation]=\"{ kind: 'trigger' }\"\n                    [items]=\"row.menuItems\"\n                    [open]=\"openRowMenuId$() === row.id\"\n                    (openChange)=\"onRowMenuOpenChange(row.id, $event)\"\n                    (itemSelect)=\"onRowMenuItemSelect(row.id, $event)\"\n                  >\n                    <cx-icon-button\n                      data-row-menu-trigger\n                      cxMenuTrigger\n                      class=\"cx-table__row-menu-trigger\"\n                      icon=\"menu-vertical\"\n                      ariaLabel=\"Row actions\" variant=\"transparent\"\n                    />\n                  </cx-menu>\n                }\n              </td>\n            }\n          </tr>\n          }\n          @if (rows$().length === 0) {\n            <tr class=\"cx-table__empty-row\">\n              <td\n                class=\"cx-table__empty-cell\"\n                [attr.colspan]=\"tableColumnSpan$()\"\n              >\n                @if (activeFilterCount$() > 0) {\n                  <cx-state-message\n                    [heading]=\"noMatchesState.heading\"\n                    [description]=\"noMatchesState.description\"\n                    [icon]=\"noMatchesState.icon\"\n                    [visual]=\"noMatchesState.visual ?? 'none'\"\n                    [action]=\"{ text: 'Reset view' }\"\n                    (action)=\"onResetTable()\"\n                  />\n                } @else {\n                  <cx-state-message\n                    [heading]=\"emptyState.heading\"\n                    [description]=\"emptyState.description\"\n                    [icon]=\"emptyState.icon\"\n                    [visual]=\"emptyState.visual ?? 'none'\"\n                    [action]=\"emptyStateAction\"\n                    (action)=\"onEmptyStateAction($event)\"\n                  />\n                }\n              </td>\n            </tr>\n          }\n        }\n      </tbody>\n    </table>\n\n    @if (columnHeaderMenuColumn(); as column) {\n      @if (columnHeaderMenuPosition$(); as columnHeaderMenuPosition) {\n        <cx-popover\n          #columnHeaderPopover\n          [open]=\"true\"\n          [showBackdrop]=\"true\"\n          [left]=\"columnHeaderMenuPosition.left\"\n          [top]=\"columnHeaderMenuPosition.top\"\n          [bottom]=\"columnHeaderMenuPosition.bottom\"\n          [width]=\"320\"\n          [maxHeight]=\"columnHeaderMenuPosition.maxHeight\"\n          [placement]=\"columnHeaderMenuPosition.placement\"\n          [surfaceId]=\"columnHeaderDialogId\"\n          [role]=\"'dialog'\"\n          [ariaLabel]=\"columnHeaderMenuAriaLabel(column)\"\n          [heading]=\"column.label\"\n          surfaceVariant=\"grouped\"\n          (backdropPressed)=\"closeColumnHeaderMenu()\"\n        >\n          @if (isColumnFilterActive(column)) {\n            <button\n              actions\n              type=\"button\"\n              class=\"cx-table__header-menu-clear\"\n              [attr.aria-label]=\"'Clear ' + column.label + ' filter'\"\n              (click)=\"onColumnFilterValueChange(column, undefined)\"\n            >\n              Clear\n            </button>\n          }\n\n          <div class=\"cx-table__header-menu\">\n            @if (column.filter; as filterDefinition) {\n              <div class=\"cx-table__header-menu-group cx-table__header-menu-filter\">\n                <cx-column-filter-editor\n                  label=\"\"\n                  [ariaLabel]=\"column.label + ' filter'\"\n                  [showClearAction]=\"false\"\n                  [definition]=\"filterDefinition\"\n                  [value]=\"columnFilterValue(column)\"\n                  (valueChange)=\"onColumnFilterValueChange(column, $event)\"\n                  (queryChange)=\"onColumnFilterQueryChange(column.id, $event)\"\n                  (loadMore)=\"onColumnFilterLoadMore(column.id)\"\n                />\n              </div>\n            }\n\n            @if (isColumnSortable(column)) {\n              <div class=\"cx-table__header-menu-group cx-table__header-menu-actions\">\n                <cx-option\n                  label=\"Sort ascending\"\n                  prependIcon=\"arrow-up\"\n                  (click)=\"onColumnHeaderAction(column, 'sort-asc')\"\n                />\n                <cx-option\n                  label=\"Sort descending\"\n                  prependIcon=\"arrow-down\"\n                  (click)=\"onColumnHeaderAction(column, 'sort-desc')\"\n                />\n              </div>\n            }\n\n            @if (hasColumnHeaderMenuProperties(column)) {\n              <div class=\"cx-table__header-menu-group cx-table__header-menu-actions\">\n                @if (isColumnPinnable(column)) {\n                  @if (isColumnPinned(column)) {\n                    <cx-option\n                      label=\"Unpin\"\n                      prependIcon=\"pin-off\"\n                      [disabled]=\"!canPinColumn(column)\"\n                      (click)=\"onColumnHeaderAction(column, 'unpin')\"\n                    />\n                  } @else {\n                    <cx-option\n                      label=\"Pin\"\n                      prependIcon=\"pin\"\n                      [disabled]=\"!canPinColumn(column)\"\n                      (click)=\"onColumnHeaderAction(column, 'pin')\"\n                    />\n                  }\n                }\n\n                @if (isColumnHideable(column)) {\n                  <cx-option\n                    label=\"Hide\"\n                    prependIcon=\"unwatch\"\n                    [disabled]=\"!canHideColumn(column)\"\n                    (click)=\"onColumnHeaderAction(column, 'hide')\"\n                  />\n                }\n              </div>\n            }\n          </div>\n        </cx-popover>\n      }\n    }\n\n    @if (contextMenu$(); as contextMenu) {\n      <cx-menu\n        [presentation]=\"{ kind: 'context', left: contextMenu.point.left, top: contextMenu.point.top }\"\n        [open]=\"true\"\n        [items]=\"contextMenuItems$()\"\n        ariaLabel=\"Row actions\"\n        (openChange)=\"onContextMenuOpenChange($event)\"\n        (itemSelect)=\"onContextMenuItemSelect($event)\"\n      />\n    }\n\n    @if (dragPreview$(); as dragPreview) {\n      <div\n        class=\"cx-table__drag-preview\"\n        [style.left.px]=\"dragPreview.left\"\n        [style.top.px]=\"dragPreview.top\"\n        aria-hidden=\"true\"\n      >\n        <cx-icon class=\"cx-table__drag-preview-icon\" icon=\"grip-vertical\" [size]=\"16\" />\n        <span class=\"cx-table__drag-preview-label\">{{ dragPreview.label }}</span>\n      </div>\n    }\n  } @else {\n    <div class=\"cx-table__empty\">\n      <cx-state-message\n        [heading]=\"emptyState.heading\"\n        [description]=\"emptyState.description\"\n        [icon]=\"emptyState.icon\"\n        [visual]=\"emptyState.visual ?? 'none'\"\n        [action]=\"emptyStateAction\"\n        (action)=\"onEmptyStateAction($event)\"\n      />\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-table{--cx-table-z-sticky-header: 1;--cx-table-z-pinned-cell: 2;--cx-table-z-pinned-header: 3;display:block;width:100%;background:rgba(0,0,0,0);overflow-x:auto}.cx-table__table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed}.cx-table__head-cell{--cx-table-head-surface: transparent;--cx-table-head-overlay: transparent;position:relative;padding:var(--space-sm) var(--space-sm);border-bottom:var(--line-discreet);background-color:var(--cx-table-head-surface);background-image:linear-gradient(var(--cx-table-head-overlay), var(--cx-table-head-overlay));color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1.2;text-align:left;vertical-align:middle}.cx-table__head-cell--end{text-align:right}.cx-table__head-cell--interactive:hover,.cx-table__head-cell--dragging{--cx-table-head-overlay: var(--opacity-low)}.cx-table--sticky-header .cx-table__head-cell{--cx-table-head-surface: var(--surface);position:sticky;top:0;z-index:var(--cx-table-z-sticky-header)}.cx-table__head-cell--pinned,.cx-table__cell--pinned{position:sticky;z-index:var(--cx-table-z-pinned-cell)}.cx-table__cell--pinned{background:var(--surface)}.cx-table__head-cell--pinned{--cx-table-head-surface: var(--surface);z-index:var(--cx-table-z-pinned-header);background-color:var(--cx-table-head-surface);background-image:linear-gradient(var(--cx-table-head-overlay), var(--cx-table-head-overlay))}.cx-table--sticky-header .cx-table__head-cell--pinned{z-index:calc(var(--cx-table-z-pinned-header) + 1)}.cx-table__head-cell--last-pinned,.cx-table__cell--last-pinned{box-shadow:1px 0 0 var(--opacity-low)}.cx-table__head-cell--drop-before::before,.cx-table__head-cell--drop-after::after{position:absolute;top:var(--space-xs);bottom:var(--space-xs);width:2px;border-radius:var(--radius-pill);corner-shape:round;background:var(--primary);content:\"\"}.cx-table__head-cell--drop-before::before{left:-1px}.cx-table__head-cell--drop-after::after{right:-1px}.cx-table__head-cell--menu{width:40px}.cx-table__head-cell--selection{--cx-table-head-surface: var(--surface);position:sticky;left:0;width:32px;z-index:var(--cx-table-z-pinned-header);text-align:center}.cx-table--sticky-header .cx-table__head-cell--selection{z-index:calc(var(--cx-table-z-pinned-header) + 1)}.cx-table__menu-column{width:40px}.cx-table__selection-column{width:32px}.cx-table__cell{padding:2px var(--space-sm);border-bottom:var(--line);vertical-align:middle;box-sizing:border-box}.cx-table--comfortable .cx-table__head-cell{padding:var(--space-md) var(--space-sm)}.cx-table--comfortable .cx-table__cell{padding:4px var(--space-sm)}.cx-table__row{--cx-table-row-overlay: transparent;background-color:var(--cx-table-row-overlay);transition:background-color var(--motion-fast) ease}.cx-table--row-press .cx-table__row,.cx-table--row-active .cx-table__row{cursor:pointer}.cx-table--row-press .cx-table__row:hover,.cx-table--row-active .cx-table__row:hover{--cx-table-row-overlay: var(--opacity-low)}.cx-table__row--active{--cx-table-row-overlay: var(--opacity-low)}.cx-table--zebra .cx-table__body .cx-table__row:nth-child(even):not(.cx-table__row--active){--cx-table-row-overlay: color-mix(in srgb, var(--opacity-low) 48%, transparent)}.cx-table__row-menu-trigger{opacity:.15;transition:opacity var(--motion-fast) ease}.cx-table__row:hover .cx-table__row-menu-trigger,.cx-table__row:focus-within .cx-table__row-menu-trigger{opacity:1}.cx-table__row:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__cell--end{text-align:right}.cx-table__cell--menu{text-align:right}.cx-table__cell--selection{position:sticky;left:0;width:32px;z-index:var(--cx-table-z-pinned-cell);background-color:var(--surface);background-image:linear-gradient(var(--cx-table-row-overlay), var(--cx-table-row-overlay));text-align:center}.cx-table__head-cell--selection cx-checkbox,.cx-table__cell--selection cx-checkbox{display:flex;width:16px;line-height:0}.cx-table__cell-content{display:flex;width:100%;min-width:0;min-height:40px;align-items:center;overflow:hidden}.cx-table--compact .cx-table__cell-content{min-height:36px}.cx-table__text{display:flex;width:100%;min-width:0;align-items:center;gap:var(--space-sm);color:var(--ink);overflow:hidden}.cx-table__text--strong{font-weight:var(--font-weight-medium)}.cx-table__text--muted{color:var(--opacity-high)}.cx-table__text-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-table__row--folder .cx-table__text-icon{color:var(--ink)}.cx-table__text-value{display:block;flex:1 1 auto;min-width:0;overflow:hidden;font-size:var(--font-size-body);line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.cx-table__person{display:flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-table__person cx-avatar{flex:0 0 auto}.cx-table__person-copy{display:flex;min-width:0;flex-direction:column}.cx-table__person-name,.cx-table__person-detail{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-table__person-name{color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-table__person-detail{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-table__progress{display:flex;width:min(100%,180px);min-width:0;align-items:center;gap:var(--space-sm)}.cx-table__progress-bar{flex:1 1 auto;min-width:0}.cx-table__progress-value{flex:0 0 auto;min-width:3ch;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-variant-numeric:tabular-nums;line-height:var(--line-height-small);text-align:end}.cx-table__measure-target{display:flex;width:100%;min-width:0;align-items:center;overflow:hidden;white-space:nowrap}.cx-table__measure-target>*{min-width:0;max-width:100%;flex:0 1 auto}.cx-table__measure-target>.cx-table__text{flex:1 1 auto}.cx-table__head-content{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-table__head-trigger{display:inline-flex;width:100%;min-width:0;align-items:center;justify-content:flex-start;gap:var(--space-xs);padding:0;border:0;background:rgba(0,0,0,0);color:inherit;cursor:pointer;font:inherit;text-align:left}.cx-table__head-trigger--static{cursor:default}.cx-table__head-trigger:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__head-label{display:block;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-table__head-cell--end .cx-table__head-label{text-align:right}.cx-table__sort-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-table__header-menu{display:flex;min-width:240px;flex-direction:column;gap:var(--surface-separation)}.cx-table__header-menu-group{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-md);background:var(--surface)}.cx-table__header-menu-filter{padding:var(--space-sm)}.cx-table__header-menu-actions{padding:var(--space-xs) 0}.cx-table__header-menu-clear{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-table__header-menu-clear:hover,.cx-table__header-menu-clear:focus-visible{color:var(--ink)}.cx-table__header-menu-clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__column-resizer{position:absolute;top:0;right:-6px;z-index:1;width:12px;height:100%;cursor:col-resize;pointer-events:auto}.cx-table__head-cell:last-child .cx-table__column-resizer{right:0;width:6px}.cx-table__column-resizer::after{position:absolute;top:50%;left:50%;width:3px;height:calc(100% - var(--space-xs)*2);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);content:\"\";transform:translate(-50%, -50%);transition:background-color var(--motion-fast) ease}.cx-table__column-resizer:hover::after,.cx-table__column-resizer:focus-visible::after,.cx-table__column-resizer--active::after{background:var(--info)}.cx-table__column-resizer:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__column-grip{display:inline-flex;flex:0 0 16px;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-mid);cursor:grab;opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease,color var(--motion-fast) ease}.cx-table__column-grip:focus-visible{opacity:1;outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__column-grip--active,.cx-table__head-cell:hover .cx-table__column-grip,.cx-table__head-cell:focus-within .cx-table__column-grip{opacity:1;pointer-events:auto}.cx-table__column-grip:hover,.cx-table__column-grip--active{color:var(--opacity-mid)}.cx-table__drag-preview{position:fixed;z-index:var(--z-index-popover);display:inline-flex;max-width:220px;min-height:32px;align-items:center;gap:var(--space-xs);padding:var(--space-xs);border:var(--line);border-radius:var(--radius-sm);background:color-mix(in srgb, var(--surface) 94%, transparent);box-shadow:var(--shadow-mid);backdrop-filter:blur(var(--frost-softness));color:var(--ink);pointer-events:none}.cx-table__drag-preview-icon{flex:0 0 auto;color:var(--opacity-mid)}.cx-table__drag-preview-label{display:block;min-width:0;overflow:hidden;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);text-overflow:ellipsis;white-space:nowrap}.cx-table__loading-cell{padding:var(--space-lg);border-bottom:var(--line)}.cx-table__empty{display:flex;min-height:160px;align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-xl);color:var(--opacity-high);font-size:var(--font-size-body)}.cx-table__empty-cell{height:160px;padding:0;border-bottom:var(--line)}.cx-table__visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;border:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap}"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxCheckboxComponent, selector: "cx-checkbox", inputs: ["text", "ariaLabel", "hint", "disabled", "selected", "value"], outputs: ["selectedChange", "valueChange", "focusChange"] }, { kind: "component", type: CxAvatarComponent, selector: "cx-avatar", inputs: ["name", "badge", "src", "size", "color", "ariaLabel"] }, { kind: "component", type: CxProgressBarComponent, selector: "cx-progress-bar", inputs: ["label", "ariaLabel", "hint", "mood", "showValue", "indeterminate", "valueLabel", "value", "max"] }, { kind: "component", type: CxSkeletonLoaderComponent, selector: "cx-skeleton-loader", inputs: ["skeleton", "loading"] }, { kind: "component", type: CxStateMessageComponent, selector: "cx-state-message", inputs: ["heading", "description", "action", "secondaryAction", "state", "visual", "layout", "icon"], outputs: ["action", "secondaryAction"] }, { kind: "component", type: CxSeverityTagComponent, selector: "cx-severity-tag", inputs: ["variant", "display", "favor", "kev", "severity", "score"] }, { kind: "component", type: CxStatusTagComponent, selector: "cx-status-tag", inputs: ["mood", "text", "icon"] }, { kind: "component", type: CxTagComponent, selector: "cx-tag", inputs: ["text", "icon", "color", "outline", "dismissible", "interactive", "ariaLabel", "expanded", "controls"], outputs: ["dismiss", "pressed"] }, { kind: "component", type: CxTrendTagComponent, selector: "cx-trend-tag", inputs: ["favor", "unit", "amount"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxColumnFilterEditorComponent, selector: "cx-column-filter-editor", inputs: ["definition", "value", "label", "ariaLabel", "disabled", "loading", "showClearAction"], outputs: ["valueChange", "queryChange", "loadMore"] }, { kind: "component", type: CxTableTagsCellComponent, selector: "cx-table-tags-cell", inputs: ["tags"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-table', imports: [
                        CommonModule,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxPopoverComponent,
                        CxOptionComponent,
                        CxIconButtonComponent,
                        CxCheckboxComponent,
                        CxAvatarComponent,
                        CxProgressBarComponent,
                        CxSkeletonLoaderComponent,
                        CxStateMessageComponent,
                        CxSeverityTagComponent,
                        CxStatusTagComponent,
                        CxTagComponent,
                        CxTrendTagComponent,
                        CxIconComponent,
                        CxTooltipDirective,
                        CxColumnFilterEditorComponent,
                        CxTableTagsCellComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-table\"\n  [class.cx-table--compact]=\"density === 'compact'\"\n  [class.cx-table--comfortable]=\"density === 'comfortable'\"\n  [class.cx-table--row-press]=\"rowActivation === 'press'\"\n  [class.cx-table--row-active]=\"rowActivation === 'active'\"\n  [class.cx-table--sticky-header]=\"stickyHeader && showHeaders\"\n  [class.cx-table--zebra]=\"zebra\"\n  [class.cx-table--loading]=\"loading\"\n>\n  <span class=\"cx-table__visually-hidden\" aria-live=\"polite\" aria-atomic=\"true\">\n    {{ columnReorderAnnouncement$() }}\n  </span>\n  @if (loading || rows$().length > 0 || columns$().length > 0) {\n    <table #tableElement class=\"cx-table__table\">\n      <colgroup>\n        @if (hasRowSelection$()) {\n          <col class=\"cx-table__selection-column\" />\n        }\n        @for (column of columns$(); track trackColumn($index, column)) {\n          <col\n            [style.width]=\"columnWidth(column)\"\n            [style.min-width]=\"columnWidth(column)\"\n            [style.max-width]=\"columnWidth(column)\"\n            [attr.data-column-id]=\"column.id\"\n          />\n        }\n        @if (hasRowMenus$() && showRowActions) {\n          <col class=\"cx-table__menu-column\" />\n        }\n      </colgroup>\n      @if (showHeaders) {\n        <thead>\n        <tr class=\"cx-table__head-row\">\n          @if (hasRowSelection$()) {\n            <th class=\"cx-table__head-cell cx-table__head-cell--selection\" scope=\"col\">\n              <cx-checkbox\n                [value]=\"partiallySelectedRows$() ? 'indeterminate' : allRowsSelected$() ? 'selected' : 'deselected'\"\n                ariaLabel=\"Select all rows\"\n                (selectedChange)=\"toggleAllRowsSelection($event)\"\n              />\n            </th>\n          }\n          @for (column of columns$(); track trackColumn($index, column)) {\n            <th\n              class=\"cx-table__head-cell\"\n              [class.cx-table__head-cell--interactive]=\"hasColumnHeaderMenu(column) || columnsReorderable || columnsResizable\"\n              [class.cx-table__head-cell--end]=\"column.align === 'end'\"\n              [class.cx-table__head-cell--pinned]=\"isColumnEffectivelyPinned(column)\"\n              [class.cx-table__head-cell--last-pinned]=\"isLastPinnedColumn(column)\"\n              [class.cx-table__head-cell--dragging]=\"draggingColumnId$() === column.id\"\n              [class.cx-table__head-cell--drop-before]=\"dropIndicator$()?.columnId === column.id && dropIndicator$()?.position === 'before'\"\n              [class.cx-table__head-cell--drop-after]=\"dropIndicator$()?.columnId === column.id && dropIndicator$()?.position === 'after'\"\n              [style.width]=\"columnWidth(column)\"\n              [style.min-width]=\"columnWidth(column)\"\n              [style.max-width]=\"columnWidth(column)\"\n              [style.left]=\"columnPinnedLeft(column)\"\n              [attr.data-column-id]=\"column.id\"\n              [attr.aria-sort]=\"sortAria(column.id)\"\n              scope=\"col\"\n            >\n              <div class=\"cx-table__head-content\">\n                @if (hasColumnHeaderMenu(column)) {\n                  <button\n                    #headerTrigger\n                    type=\"button\"\n                    class=\"cx-table__head-trigger\"\n                    [attr.aria-label]=\"columnHeaderTriggerAriaLabel(column)\"\n                    aria-haspopup=\"dialog\"\n                    [attr.aria-expanded]=\"isColumnHeaderMenuOpen(column)\"\n                    [attr.aria-controls]=\"columnHeaderDialogId\"\n                    [cxTooltip]=\"column.label\"\n                    [cxTooltipOverflow]=\"true\"\n                    (click)=\"onColumnHeaderTriggerClick($event, column, headerTrigger)\"\n                  >\n                    <span class=\"cx-table__head-label\" data-cx-tooltip-overflow>{{ column.label }}</span>\n                    @if (sortIcon(column.id); as iconName) {\n                      <cx-icon class=\"cx-table__sort-icon\" [icon]=\"iconName\" [size]=\"14\" />\n                    }\n                  </button>\n                } @else {\n                  <span class=\"cx-table__head-trigger cx-table__head-trigger--static\">\n                    <span\n                      class=\"cx-table__head-label\"\n                      [cxTooltip]=\"column.label\"\n                      [cxTooltipOverflow]=\"true\"\n                    >{{ column.label }}</span>\n                  </span>\n                }\n                @if (columnsReorderable) {\n                  <button\n                    #columnGrip\n                    type=\"button\"\n                    class=\"cx-table__column-grip\"\n                    [class.cx-table__column-grip--active]=\"draggingColumnId$() === column.id\"\n                    [attr.aria-label]=\"'Reorder ' + column.label + ' column'\"\n                    [attr.data-column-grip-id]=\"column.id\"\n                    (pointerdown)=\"onColumnGripPointerDown($event, column)\"\n                    (pointermove)=\"onColumnGripPointerMove($event)\"\n                    (pointerup)=\"onColumnGripPointerUp($event)\"\n                    (pointercancel)=\"onColumnGripPointerCancel($event)\"\n                    (lostpointercapture)=\"onColumnGripLostPointerCapture($event)\"\n                    (keydown)=\"onColumnGripKeydown($event, column, columnGrip)\"\n                    (click)=\"$event.stopPropagation()\"\n                  >\n                    <cx-icon icon=\"grip-vertical\" [size]=\"16\" />\n                  </button>\n                }\n              </div>\n              @if (columnsResizable) {\n                <div\n                  class=\"cx-table__column-resizer\"\n                  [class.cx-table__column-resizer--active]=\"resizingColumnId$() === column.id\"\n                  [attr.aria-label]=\"'Resize ' + column.label + ' column'\"\n                  aria-orientation=\"vertical\"\n                  [attr.aria-valuemin]=\"columnMinWidth\"\n                  [attr.aria-valuemax]=\"columnMaxWidth\"\n                  [attr.aria-valuenow]=\"columnWidthValue(column)\"\n                  [attr.aria-valuetext]=\"columnWidthValue(column) + ' pixels'\"\n                  tabindex=\"0\"\n                  role=\"separator\"\n                  (pointerdown)=\"onColumnResizePointerDown($event, column)\"\n                  (pointermove)=\"onColumnResizePointerMove($event)\"\n                  (pointerup)=\"onColumnResizePointerUp($event)\"\n                  (pointercancel)=\"onColumnResizePointerCancel($event)\"\n                  (lostpointercapture)=\"onColumnResizeLostPointerCapture($event)\"\n                  (keydown)=\"onColumnResizeKeydown($event, column)\"\n                  (dblclick)=\"onColumnResizeDoubleClick($event, column)\"\n                ></div>\n              }\n            </th>\n          }\n          @if (hasRowMenus$() && showRowActions) {\n            <th class=\"cx-table__head-cell cx-table__head-cell--menu\" scope=\"col\"></th>\n          }\n        </tr>\n        </thead>\n      }\n\n      <tbody class=\"cx-table__body\">\n        @if (loading) {\n          <tr class=\"cx-table__loading-row\">\n            <td class=\"cx-table__loading-cell\" [attr.colspan]=\"tableColumnSpan$()\">\n              <cx-skeleton-loader [skeleton]=\"loadingSkeleton$()\" />\n            </td>\n          </tr>\n        } @else {\n          @for (row of rows$(); track trackRow($index, row)) {\n          <tr\n            class=\"cx-table__row\"\n            [class.cx-table__row--active]=\"rowKind(row) === 'item' && activeRowId$() === row.id\"\n            [class.cx-table__row--folder]=\"rowKind(row) === 'folder'\"\n            [class.cx-table__row--item]=\"rowKind(row) === 'item'\"\n            [attr.data-row-id]=\"row.id\"\n            [attr.tabindex]=\"rowIsKeyboardReachable(row) ? '0' : null\"\n            [attr.aria-label]=\"rowLabel(row)\"\n            (click)=\"onRowClick($event, row, $any($event.currentTarget))\"\n            (keydown)=\"onRowKeydown($event, row, $any($event.currentTarget))\"\n            (contextmenu)=\"onRowContextMenu($event, row, $any($event.currentTarget))\"\n          >\n            @if (hasRowSelection$()) {\n              @if (rowIsSelectable(row)) {\n                <td\n                  class=\"cx-table__cell cx-table__cell--selection\"\n                  (click)=\"$event.stopPropagation()\"\n                  (keydown)=\"$event.stopPropagation()\"\n                >\n                  <cx-checkbox\n                    [selected]=\"isRowSelected(row.id)\"\n                    [ariaLabel]=\"selectionLabel(row)\"\n                    (selectedChange)=\"toggleRowSelection(row.id, $event)\"\n                  />\n                </td>\n              } @else {\n                <td class=\"cx-table__cell cx-table__cell--selection\"></td>\n              }\n            }\n            @for (column of columns$(); track trackColumn($index, column)) {\n              @if (cellFor(row, column.id); as cell) {\n                <td\n                  class=\"cx-table__cell\"\n                  [class.cx-table__cell--key]=\"column.key\"\n                  [class.cx-table__cell--end]=\"column.align === 'end'\"\n                  [class.cx-table__cell--pinned]=\"isColumnEffectivelyPinned(column)\"\n                  [class.cx-table__cell--last-pinned]=\"isLastPinnedColumn(column)\"\n                  [style.width]=\"columnWidth(column)\"\n                  [style.min-width]=\"columnWidth(column)\"\n                  [style.max-width]=\"columnWidth(column)\"\n                  [style.left]=\"columnPinnedLeft(column)\"\n                  [attr.data-column-id]=\"column.id\"\n                >\n                  <div class=\"cx-table__cell-content\">\n                    <div class=\"cx-table__measure-target\">\n                      @switch (cell.kind) {\n                        @case ('status-tag') {\n                          <cx-status-tag [mood]=\"cell.mood\" [text]=\"cell.text\" [icon]=\"cell.icon\" />\n                        }\n                        @case ('severity-tag') {\n                          <cx-severity-tag\n                            [severity]=\"cell.severity\"\n                            [score]=\"cell.score\"\n                            [kev]=\"cell.kev ?? false\"\n                            [display]=\"cell.display ?? 'severity'\"\n                            [favor]=\"cell.favor ?? 'low'\"\n                          />\n                        }\n                        @case ('trend-tag') {\n                          <cx-trend-tag\n                            [amount]=\"cell.amount\"\n                            [favor]=\"cell.favor ?? 'up'\"\n                            [unit]=\"cell.unit ?? 'percent'\"\n                          />\n                        }\n                        @case ('tag') {\n                          <cx-tag\n                            [text]=\"cell.label\"\n                            [color]=\"cell.color ?? 'default'\"\n                            [outline]=\"cell.outline ?? false\"\n                          />\n                        }\n                        @case ('tags') {\n                          <cx-table-tags-cell [tags]=\"cell.tags\" />\n                        }\n                        @case ('person') {\n                          <div class=\"cx-table__person\">\n                            <cx-avatar\n                              [name]=\"cell.name\"\n                              [src]=\"cell.src\"\n                              [color]=\"cell.color ?? 'auto'\"\n                              size=\"small\"\n                              ariaLabel=\"\"\n                            />\n                            <span class=\"cx-table__person-copy\">\n                              <span class=\"cx-table__person-name\">{{ cell.name }}</span>\n                              @if (cell.detail) {\n                                <span class=\"cx-table__person-detail\">{{ cell.detail }}</span>\n                              }\n                            </span>\n                          </div>\n                        }\n                        @case ('progress') {\n                          <div class=\"cx-table__progress\">\n                            <cx-progress-bar\n                              class=\"cx-table__progress-bar\"\n                              label=\"\"\n                              [ariaLabel]=\"cell.label ?? 'Progress'\"\n                              [value]=\"cell.value\"\n                              [mood]=\"cell.mood ?? 'default'\"\n                              [showValue]=\"false\"\n                            />\n                            <span class=\"cx-table__progress-value\" aria-hidden=\"true\">\n                              {{ progressPercent(cell.value) }}\n                            </span>\n                          </div>\n                        }\n                        @default {\n                          <span\n                            class=\"cx-table__text\"\n                            [class.cx-table__text--strong]=\"cell.strong\"\n                            [class.cx-table__text--muted]=\"cell.muted\"\n                          >\n                            @if (resolvedTextIcon(row, column, cell); as iconName) {\n                              <cx-icon class=\"cx-table__text-icon\" [icon]=\"iconName\" [size]=\"16\" />\n                            }\n                            <span\n                              class=\"cx-table__text-value\"\n                              [cxTooltip]=\"cell.value\"\n                              [cxTooltipOverflow]=\"true\"\n                            >{{ cell.value }}</span>\n                          </span>\n                        }\n                      }\n                    </div>\n                  </div>\n                </td>\n              } @else {\n                <td\n                  class=\"cx-table__cell\"\n                  [class.cx-table__cell--key]=\"column.key\"\n                  [class.cx-table__cell--end]=\"column.align === 'end'\"\n                  [class.cx-table__cell--pinned]=\"isColumnEffectivelyPinned(column)\"\n                  [class.cx-table__cell--last-pinned]=\"isLastPinnedColumn(column)\"\n                  [style.width]=\"columnWidth(column)\"\n                  [style.min-width]=\"columnWidth(column)\"\n                  [style.max-width]=\"columnWidth(column)\"\n                  [style.left]=\"columnPinnedLeft(column)\"\n                  [attr.data-column-id]=\"column.id\"\n                ></td>\n              }\n            }\n\n            @if (hasRowMenus$() && showRowActions) {\n              <td\n                class=\"cx-table__cell cx-table__cell--menu\"\n                (click)=\"$event.stopPropagation()\"\n                (keydown)=\"$event.stopPropagation()\"\n              >\n                @if (row.menuItems?.length) {\n                  <cx-menu\n                    [presentation]=\"{ kind: 'trigger' }\"\n                    [items]=\"row.menuItems\"\n                    [open]=\"openRowMenuId$() === row.id\"\n                    (openChange)=\"onRowMenuOpenChange(row.id, $event)\"\n                    (itemSelect)=\"onRowMenuItemSelect(row.id, $event)\"\n                  >\n                    <cx-icon-button\n                      data-row-menu-trigger\n                      cxMenuTrigger\n                      class=\"cx-table__row-menu-trigger\"\n                      icon=\"menu-vertical\"\n                      ariaLabel=\"Row actions\" variant=\"transparent\"\n                    />\n                  </cx-menu>\n                }\n              </td>\n            }\n          </tr>\n          }\n          @if (rows$().length === 0) {\n            <tr class=\"cx-table__empty-row\">\n              <td\n                class=\"cx-table__empty-cell\"\n                [attr.colspan]=\"tableColumnSpan$()\"\n              >\n                @if (activeFilterCount$() > 0) {\n                  <cx-state-message\n                    [heading]=\"noMatchesState.heading\"\n                    [description]=\"noMatchesState.description\"\n                    [icon]=\"noMatchesState.icon\"\n                    [visual]=\"noMatchesState.visual ?? 'none'\"\n                    [action]=\"{ text: 'Reset view' }\"\n                    (action)=\"onResetTable()\"\n                  />\n                } @else {\n                  <cx-state-message\n                    [heading]=\"emptyState.heading\"\n                    [description]=\"emptyState.description\"\n                    [icon]=\"emptyState.icon\"\n                    [visual]=\"emptyState.visual ?? 'none'\"\n                    [action]=\"emptyStateAction\"\n                    (action)=\"onEmptyStateAction($event)\"\n                  />\n                }\n              </td>\n            </tr>\n          }\n        }\n      </tbody>\n    </table>\n\n    @if (columnHeaderMenuColumn(); as column) {\n      @if (columnHeaderMenuPosition$(); as columnHeaderMenuPosition) {\n        <cx-popover\n          #columnHeaderPopover\n          [open]=\"true\"\n          [showBackdrop]=\"true\"\n          [left]=\"columnHeaderMenuPosition.left\"\n          [top]=\"columnHeaderMenuPosition.top\"\n          [bottom]=\"columnHeaderMenuPosition.bottom\"\n          [width]=\"320\"\n          [maxHeight]=\"columnHeaderMenuPosition.maxHeight\"\n          [placement]=\"columnHeaderMenuPosition.placement\"\n          [surfaceId]=\"columnHeaderDialogId\"\n          [role]=\"'dialog'\"\n          [ariaLabel]=\"columnHeaderMenuAriaLabel(column)\"\n          [heading]=\"column.label\"\n          surfaceVariant=\"grouped\"\n          (backdropPressed)=\"closeColumnHeaderMenu()\"\n        >\n          @if (isColumnFilterActive(column)) {\n            <button\n              actions\n              type=\"button\"\n              class=\"cx-table__header-menu-clear\"\n              [attr.aria-label]=\"'Clear ' + column.label + ' filter'\"\n              (click)=\"onColumnFilterValueChange(column, undefined)\"\n            >\n              Clear\n            </button>\n          }\n\n          <div class=\"cx-table__header-menu\">\n            @if (column.filter; as filterDefinition) {\n              <div class=\"cx-table__header-menu-group cx-table__header-menu-filter\">\n                <cx-column-filter-editor\n                  label=\"\"\n                  [ariaLabel]=\"column.label + ' filter'\"\n                  [showClearAction]=\"false\"\n                  [definition]=\"filterDefinition\"\n                  [value]=\"columnFilterValue(column)\"\n                  (valueChange)=\"onColumnFilterValueChange(column, $event)\"\n                  (queryChange)=\"onColumnFilterQueryChange(column.id, $event)\"\n                  (loadMore)=\"onColumnFilterLoadMore(column.id)\"\n                />\n              </div>\n            }\n\n            @if (isColumnSortable(column)) {\n              <div class=\"cx-table__header-menu-group cx-table__header-menu-actions\">\n                <cx-option\n                  label=\"Sort ascending\"\n                  prependIcon=\"arrow-up\"\n                  (click)=\"onColumnHeaderAction(column, 'sort-asc')\"\n                />\n                <cx-option\n                  label=\"Sort descending\"\n                  prependIcon=\"arrow-down\"\n                  (click)=\"onColumnHeaderAction(column, 'sort-desc')\"\n                />\n              </div>\n            }\n\n            @if (hasColumnHeaderMenuProperties(column)) {\n              <div class=\"cx-table__header-menu-group cx-table__header-menu-actions\">\n                @if (isColumnPinnable(column)) {\n                  @if (isColumnPinned(column)) {\n                    <cx-option\n                      label=\"Unpin\"\n                      prependIcon=\"pin-off\"\n                      [disabled]=\"!canPinColumn(column)\"\n                      (click)=\"onColumnHeaderAction(column, 'unpin')\"\n                    />\n                  } @else {\n                    <cx-option\n                      label=\"Pin\"\n                      prependIcon=\"pin\"\n                      [disabled]=\"!canPinColumn(column)\"\n                      (click)=\"onColumnHeaderAction(column, 'pin')\"\n                    />\n                  }\n                }\n\n                @if (isColumnHideable(column)) {\n                  <cx-option\n                    label=\"Hide\"\n                    prependIcon=\"unwatch\"\n                    [disabled]=\"!canHideColumn(column)\"\n                    (click)=\"onColumnHeaderAction(column, 'hide')\"\n                  />\n                }\n              </div>\n            }\n          </div>\n        </cx-popover>\n      }\n    }\n\n    @if (contextMenu$(); as contextMenu) {\n      <cx-menu\n        [presentation]=\"{ kind: 'context', left: contextMenu.point.left, top: contextMenu.point.top }\"\n        [open]=\"true\"\n        [items]=\"contextMenuItems$()\"\n        ariaLabel=\"Row actions\"\n        (openChange)=\"onContextMenuOpenChange($event)\"\n        (itemSelect)=\"onContextMenuItemSelect($event)\"\n      />\n    }\n\n    @if (dragPreview$(); as dragPreview) {\n      <div\n        class=\"cx-table__drag-preview\"\n        [style.left.px]=\"dragPreview.left\"\n        [style.top.px]=\"dragPreview.top\"\n        aria-hidden=\"true\"\n      >\n        <cx-icon class=\"cx-table__drag-preview-icon\" icon=\"grip-vertical\" [size]=\"16\" />\n        <span class=\"cx-table__drag-preview-label\">{{ dragPreview.label }}</span>\n      </div>\n    }\n  } @else {\n    <div class=\"cx-table__empty\">\n      <cx-state-message\n        [heading]=\"emptyState.heading\"\n        [description]=\"emptyState.description\"\n        [icon]=\"emptyState.icon\"\n        [visual]=\"emptyState.visual ?? 'none'\"\n        [action]=\"emptyStateAction\"\n        (action)=\"onEmptyStateAction($event)\"\n      />\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-table{--cx-table-z-sticky-header: 1;--cx-table-z-pinned-cell: 2;--cx-table-z-pinned-header: 3;display:block;width:100%;background:rgba(0,0,0,0);overflow-x:auto}.cx-table__table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed}.cx-table__head-cell{--cx-table-head-surface: transparent;--cx-table-head-overlay: transparent;position:relative;padding:var(--space-sm) var(--space-sm);border-bottom:var(--line-discreet);background-color:var(--cx-table-head-surface);background-image:linear-gradient(var(--cx-table-head-overlay), var(--cx-table-head-overlay));color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1.2;text-align:left;vertical-align:middle}.cx-table__head-cell--end{text-align:right}.cx-table__head-cell--interactive:hover,.cx-table__head-cell--dragging{--cx-table-head-overlay: var(--opacity-low)}.cx-table--sticky-header .cx-table__head-cell{--cx-table-head-surface: var(--surface);position:sticky;top:0;z-index:var(--cx-table-z-sticky-header)}.cx-table__head-cell--pinned,.cx-table__cell--pinned{position:sticky;z-index:var(--cx-table-z-pinned-cell)}.cx-table__cell--pinned{background:var(--surface)}.cx-table__head-cell--pinned{--cx-table-head-surface: var(--surface);z-index:var(--cx-table-z-pinned-header);background-color:var(--cx-table-head-surface);background-image:linear-gradient(var(--cx-table-head-overlay), var(--cx-table-head-overlay))}.cx-table--sticky-header .cx-table__head-cell--pinned{z-index:calc(var(--cx-table-z-pinned-header) + 1)}.cx-table__head-cell--last-pinned,.cx-table__cell--last-pinned{box-shadow:1px 0 0 var(--opacity-low)}.cx-table__head-cell--drop-before::before,.cx-table__head-cell--drop-after::after{position:absolute;top:var(--space-xs);bottom:var(--space-xs);width:2px;border-radius:var(--radius-pill);corner-shape:round;background:var(--primary);content:\"\"}.cx-table__head-cell--drop-before::before{left:-1px}.cx-table__head-cell--drop-after::after{right:-1px}.cx-table__head-cell--menu{width:40px}.cx-table__head-cell--selection{--cx-table-head-surface: var(--surface);position:sticky;left:0;width:32px;z-index:var(--cx-table-z-pinned-header);text-align:center}.cx-table--sticky-header .cx-table__head-cell--selection{z-index:calc(var(--cx-table-z-pinned-header) + 1)}.cx-table__menu-column{width:40px}.cx-table__selection-column{width:32px}.cx-table__cell{padding:2px var(--space-sm);border-bottom:var(--line);vertical-align:middle;box-sizing:border-box}.cx-table--comfortable .cx-table__head-cell{padding:var(--space-md) var(--space-sm)}.cx-table--comfortable .cx-table__cell{padding:4px var(--space-sm)}.cx-table__row{--cx-table-row-overlay: transparent;background-color:var(--cx-table-row-overlay);transition:background-color var(--motion-fast) ease}.cx-table--row-press .cx-table__row,.cx-table--row-active .cx-table__row{cursor:pointer}.cx-table--row-press .cx-table__row:hover,.cx-table--row-active .cx-table__row:hover{--cx-table-row-overlay: var(--opacity-low)}.cx-table__row--active{--cx-table-row-overlay: var(--opacity-low)}.cx-table--zebra .cx-table__body .cx-table__row:nth-child(even):not(.cx-table__row--active){--cx-table-row-overlay: color-mix(in srgb, var(--opacity-low) 48%, transparent)}.cx-table__row-menu-trigger{opacity:.15;transition:opacity var(--motion-fast) ease}.cx-table__row:hover .cx-table__row-menu-trigger,.cx-table__row:focus-within .cx-table__row-menu-trigger{opacity:1}.cx-table__row:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__cell--end{text-align:right}.cx-table__cell--menu{text-align:right}.cx-table__cell--selection{position:sticky;left:0;width:32px;z-index:var(--cx-table-z-pinned-cell);background-color:var(--surface);background-image:linear-gradient(var(--cx-table-row-overlay), var(--cx-table-row-overlay));text-align:center}.cx-table__head-cell--selection cx-checkbox,.cx-table__cell--selection cx-checkbox{display:flex;width:16px;line-height:0}.cx-table__cell-content{display:flex;width:100%;min-width:0;min-height:40px;align-items:center;overflow:hidden}.cx-table--compact .cx-table__cell-content{min-height:36px}.cx-table__text{display:flex;width:100%;min-width:0;align-items:center;gap:var(--space-sm);color:var(--ink);overflow:hidden}.cx-table__text--strong{font-weight:var(--font-weight-medium)}.cx-table__text--muted{color:var(--opacity-high)}.cx-table__text-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-table__row--folder .cx-table__text-icon{color:var(--ink)}.cx-table__text-value{display:block;flex:1 1 auto;min-width:0;overflow:hidden;font-size:var(--font-size-body);line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.cx-table__person{display:flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-table__person cx-avatar{flex:0 0 auto}.cx-table__person-copy{display:flex;min-width:0;flex-direction:column}.cx-table__person-name,.cx-table__person-detail{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-table__person-name{color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-table__person-detail{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-table__progress{display:flex;width:min(100%,180px);min-width:0;align-items:center;gap:var(--space-sm)}.cx-table__progress-bar{flex:1 1 auto;min-width:0}.cx-table__progress-value{flex:0 0 auto;min-width:3ch;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-variant-numeric:tabular-nums;line-height:var(--line-height-small);text-align:end}.cx-table__measure-target{display:flex;width:100%;min-width:0;align-items:center;overflow:hidden;white-space:nowrap}.cx-table__measure-target>*{min-width:0;max-width:100%;flex:0 1 auto}.cx-table__measure-target>.cx-table__text{flex:1 1 auto}.cx-table__head-content{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-table__head-trigger{display:inline-flex;width:100%;min-width:0;align-items:center;justify-content:flex-start;gap:var(--space-xs);padding:0;border:0;background:rgba(0,0,0,0);color:inherit;cursor:pointer;font:inherit;text-align:left}.cx-table__head-trigger--static{cursor:default}.cx-table__head-trigger:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__head-label{display:block;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-table__head-cell--end .cx-table__head-label{text-align:right}.cx-table__sort-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-table__header-menu{display:flex;min-width:240px;flex-direction:column;gap:var(--surface-separation)}.cx-table__header-menu-group{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-md);background:var(--surface)}.cx-table__header-menu-filter{padding:var(--space-sm)}.cx-table__header-menu-actions{padding:var(--space-xs) 0}.cx-table__header-menu-clear{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-table__header-menu-clear:hover,.cx-table__header-menu-clear:focus-visible{color:var(--ink)}.cx-table__header-menu-clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__column-resizer{position:absolute;top:0;right:-6px;z-index:1;width:12px;height:100%;cursor:col-resize;pointer-events:auto}.cx-table__head-cell:last-child .cx-table__column-resizer{right:0;width:6px}.cx-table__column-resizer::after{position:absolute;top:50%;left:50%;width:3px;height:calc(100% - var(--space-xs)*2);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);content:\"\";transform:translate(-50%, -50%);transition:background-color var(--motion-fast) ease}.cx-table__column-resizer:hover::after,.cx-table__column-resizer:focus-visible::after,.cx-table__column-resizer--active::after{background:var(--info)}.cx-table__column-resizer:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__column-grip{display:inline-flex;flex:0 0 16px;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-mid);cursor:grab;opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease,color var(--motion-fast) ease}.cx-table__column-grip:focus-visible{opacity:1;outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-table__column-grip--active,.cx-table__head-cell:hover .cx-table__column-grip,.cx-table__head-cell:focus-within .cx-table__column-grip{opacity:1;pointer-events:auto}.cx-table__column-grip:hover,.cx-table__column-grip--active{color:var(--opacity-mid)}.cx-table__drag-preview{position:fixed;z-index:var(--z-index-popover);display:inline-flex;max-width:220px;min-height:32px;align-items:center;gap:var(--space-xs);padding:var(--space-xs);border:var(--line);border-radius:var(--radius-sm);background:color-mix(in srgb, var(--surface) 94%, transparent);box-shadow:var(--shadow-mid);backdrop-filter:blur(var(--frost-softness));color:var(--ink);pointer-events:none}.cx-table__drag-preview-icon{flex:0 0 auto;color:var(--opacity-mid)}.cx-table__drag-preview-label{display:block;min-width:0;overflow:hidden;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);text-overflow:ellipsis;white-space:nowrap}.cx-table__loading-cell{padding:var(--space-lg);border-bottom:var(--line)}.cx-table__empty{display:flex;min-height:160px;align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-xl);color:var(--opacity-high);font-size:var(--font-size-body)}.cx-table__empty-cell{height:160px;padding:0;border-bottom:var(--line)}.cx-table__visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;border:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap}"] }]
        }], ctorParameters: () => [], propDecorators: { tableElement: [{
                type: ViewChild,
                args: ['tableElement']
            }], columnHeaderPopover: [{
                type: ViewChild,
                args: ['columnHeaderPopover']
            }], columnFilterEditor: [{
                type: ViewChild,
                args: [CxColumnFilterEditorComponent]
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
            }], selectionMode: [{
                type: Input
            }], columns: [{
                type: Input
            }], rows: [{
                type: Input
            }], activeRowId: [{
                type: Input
            }], selectedRowIds: [{
                type: Input
            }], filterValues: [{
                type: Input
            }], sort: [{
                type: Input
            }], activeRowIdChange: [{
                type: Output
            }], emptyStateActionSelect: [{
                type: Output
            }], selectedRowIdsChange: [{
                type: Output
            }], rowMenuItemSelect: [{
                type: Output
            }], rowActivate: [{
                type: Output
            }], columnOrderChange: [{
                type: Output
            }], sortChange: [{
                type: Output
            }], filterValuesChange: [{
                type: Output
            }], resetTable: [{
                type: Output
            }], filterQueryChange: [{
                type: Output
            }], filterLoadMore: [{
                type: Output
            }], columnHeaderMenuOpenChange: [{
                type: Output
            }], columnPinChange: [{
                type: Output
            }], columnVisibilityChange: [{
                type: Output
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
