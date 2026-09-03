import { EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxMenuItem } from '../../overlay/cx-menu';
import { type CxSeverityLevel, type CxSeverityTagFavor } from '../../display/cx-severity-tag';
import { type CxStatusTagMood } from '../../display/cx-status-tag';
import { type CxTagColor } from '../../display/cx-tag';
import { type CxAvatarColor } from '../../display/cx-avatar';
import { type CxTrendTagFavor, type CxTrendTagUnit } from '../../display/cx-trend-tag';
import { type CxProgressBarMood } from '../../feedback/cx-progress-bar';
import { CxSkeletonLoader } from '../../feedback/cx-skeleton-loader';
import { type CxStateMessageVisual } from '../../feedback/cx-state-message';
import { type CxColumnFilterDefinition, type CxColumnFilterLoadMoreEvent, type CxColumnFilterQueryChangeEvent, type CxColumnFilterValue, type CxColumnFilterValueMap } from '../cx-column-filter-editor';
import * as i0 from "@angular/core";
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
export type CxTableSeverityCell = {
    kind: 'severity-tag';
    severity: CxSeverityLevel;
    score?: never;
    display?: 'severity';
    favor?: never;
    kev?: boolean;
} | {
    kind: 'severity-tag';
    score: number;
    severity?: never;
    display?: 'severity' | 'grade';
    favor?: CxSeverityTagFavor;
    kev?: boolean;
};
export type CxTableCell = {
    kind: 'text';
    value: string;
    prependIcon?: CxIconName;
    strong?: boolean;
    muted?: boolean;
} | {
    kind: 'status-tag';
    mood: CxStatusTagMood;
    text: string;
    icon?: CxIconName;
} | CxTableSeverityCell | {
    kind: 'trend-tag';
    amount: number;
    favor?: CxTrendTagFavor;
    unit?: CxTrendTagUnit;
} | {
    kind: 'tag';
    label: string;
    color?: CxTagColor;
    outline?: boolean;
} | {
    kind: 'tags';
    tags: readonly {
        label: string;
        color?: CxTagColor;
        outline?: boolean;
    }[];
} | {
    kind: 'person';
    name: string;
    detail?: string;
    src?: string;
    color?: CxAvatarColor;
} | {
    kind: 'progress';
    value: number;
    mood?: CxProgressBarMood;
    label?: string;
};
export interface CxTableRow {
    id: string;
    kind?: CxTableRowKind;
    cells: Record<string, CxTableCell | undefined>;
    menuItems?: CxMenuItem[];
}
export interface CxTableStateMessage {
    heading: string;
    description?: string;
    icon?: CxIconName;
    visual?: CxStateMessageVisual;
}
export interface CxTableEmptyStateAction {
    text: string;
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
type CxTableDropIndicator = {
    columnId: string;
    position: 'before' | 'after';
} | undefined;
type CxTableDragPreview = {
    label: string;
    left: number;
    top: number;
} | undefined;
type CxTableContextMenuState = {
    rowId: string;
    point: {
        left: number;
        top: number;
    };
    invocation: 'pointer' | 'keyboard';
    originRow?: HTMLElement;
};
export declare class CxTableComponent implements OnDestroy {
    private static instanceCounter;
    private readonly injector;
    private readonly instanceId;
    protected readonly columnHeaderDialogId: string;
    protected readonly columnMinWidth = 72;
    protected readonly columnMaxWidth = 640;
    private readonly columnsState;
    private readonly rowsState;
    private readonly activeRowIdState;
    private readonly openRowMenuIdState;
    private readonly contextMenuState;
    private readonly selectionModeState;
    private readonly selectedRowIdsState;
    private readonly columnOrderState;
    private readonly columnWidthOverridesState;
    private appliedKeyColumnAutoFit?;
    private keyColumnAutoFitTimer?;
    private readonly contentWidthsState;
    private readonly columnLeftOffsetsState;
    private readonly effectivePinnedColumnIdsState;
    private readonly resizingColumnIdState;
    private readonly draggingColumnIdState;
    private readonly dropIndicatorState;
    private readonly dragPreviewState;
    private pendingContextMenuState?;
    private contextMenuTeardownPending;
    private destroyed;
    private tableViewportResizeObserver?;
    private observedTableViewport?;
    private lastViewportWidth;
    private readonly columnReorderAnnouncementState;
    private readonly sortState;
    private readonly filterValuesState;
    private readonly columnHeaderMenuColumnIdState;
    private readonly columnHeaderMenuPositionState;
    private columnHeaderMenuTrigger?;
    private columnHeaderMenuLockedPlacement?;
    private activeResizeSession;
    private keyboardReorderSession;
    private activeReorderSession;
    private readonly tableElement?;
    private readonly columnHeaderPopover?;
    private readonly columnFilterEditor?;
    density: CxTableDensity;
    rowActivation: CxTableRowActivation;
    showHeaders: boolean;
    columnsResizable: boolean;
    columnsReorderable: boolean;
    stickyHeader: boolean;
    zebra: boolean;
    loading: boolean;
    showRowActions: boolean;
    rightClickMenu: boolean;
    emptyState: CxTableStateMessage;
    emptyStateAction: CxTableEmptyStateAction | undefined;
    noMatchesState: CxTableStateMessage;
    set selectionMode(value: CxTableSelectionMode);
    set columns(value: readonly CxTableColumn[]);
    set rows(value: readonly CxTableRow[]);
    set activeRowId(value: string | undefined);
    set selectedRowIds(value: string[] | undefined);
    set filterValues(value: CxColumnFilterValueMap | undefined);
    set sort(value: CxTableSort | undefined);
    readonly activeRowIdChange: EventEmitter<string | undefined>;
    readonly emptyStateActionSelect: EventEmitter<CxTableEmptyStateAction>;
    readonly selectedRowIdsChange: EventEmitter<string[]>;
    readonly rowMenuItemSelect: EventEmitter<CxTableRowMenuSelectEvent>;
    readonly rowActivate: EventEmitter<CxTableRowActivateEvent>;
    readonly columnOrderChange: EventEmitter<string[]>;
    readonly sortChange: EventEmitter<CxTableSort | undefined>;
    readonly filterValuesChange: EventEmitter<Readonly<Record<string, CxColumnFilterValue>>>;
    readonly resetTable: EventEmitter<void>;
    readonly filterQueryChange: EventEmitter<CxColumnFilterQueryChangeEvent>;
    readonly filterLoadMore: EventEmitter<CxColumnFilterLoadMoreEvent>;
    readonly columnHeaderMenuOpenChange: EventEmitter<boolean>;
    readonly columnPinChange: EventEmitter<CxTableColumnPinChangeEvent>;
    readonly columnVisibilityChange: EventEmitter<CxTableColumnVisibilityChangeEvent>;
    protected readonly columns$: import("@angular/core").Signal<CxTableColumn[]>;
    protected readonly rows$: import("@angular/core").Signal<readonly CxTableRow[]>;
    protected readonly activeRowId$: import("@angular/core").Signal<string | undefined>;
    protected readonly selectedRowIds$: import("@angular/core").Signal<string[]>;
    protected readonly openRowMenuId$: import("@angular/core").Signal<string | undefined>;
    protected readonly contextMenu$: import("@angular/core").Signal<CxTableContextMenuState | undefined>;
    protected readonly contextMenuItems$: import("@angular/core").Signal<CxMenuItem[]>;
    protected readonly resizingColumnId$: import("@angular/core").Signal<string | undefined>;
    protected readonly draggingColumnId$: import("@angular/core").Signal<string | undefined>;
    protected readonly dropIndicator$: import("@angular/core").Signal<CxTableDropIndicator>;
    protected readonly dragPreview$: import("@angular/core").Signal<CxTableDragPreview>;
    protected readonly columnReorderAnnouncement$: import("@angular/core").Signal<string>;
    protected readonly sort$: import("@angular/core").Signal<CxTableSort | undefined>;
    protected readonly filterValues$: import("@angular/core").Signal<Readonly<Record<string, CxColumnFilterValue>>>;
    protected readonly columnLeftOffsets$: import("@angular/core").Signal<Record<string, number>>;
    protected readonly columnHeaderMenuPosition$: import("@angular/core").Signal<{
        left: number;
        top?: number;
        bottom?: number;
        maxHeight: number;
        placement: "top" | "bottom";
    } | undefined>;
    protected readonly loadingSkeleton$: import("@angular/core").Signal<CxSkeletonLoader>;
    protected readonly hasRowMenus$: import("@angular/core").Signal<boolean>;
    protected readonly hasRowSelection$: import("@angular/core").Signal<boolean>;
    protected readonly tableColumnSpan$: import("@angular/core").Signal<number>;
    protected readonly selectableRowIds$: import("@angular/core").Signal<string[]>;
    protected readonly selectedVisibleRowIds$: import("@angular/core").Signal<string[]>;
    protected readonly allRowsSelected$: import("@angular/core").Signal<boolean>;
    protected readonly partiallySelectedRows$: import("@angular/core").Signal<boolean>;
    protected readonly activeFilterCount$: import("@angular/core").Signal<number>;
    constructor();
    ngOnDestroy(): void;
    protected activateRow(row: CxTableRow): void;
    protected onRowClick(event: MouseEvent, row: CxTableRow, rowElement?: HTMLElement): void;
    protected onRowKeydown(event: KeyboardEvent, row: CxTableRow, rowElement?: HTMLElement): void;
    protected onRowContextMenu(event: MouseEvent, row: CxTableRow, rowElement?: HTMLElement): void;
    protected onRowMenuOpenChange(rowId: string, open: boolean): void;
    protected onRowMenuItemSelect(rowId: string, itemId: string): void;
    protected onContextMenuItemSelect(itemId: string): void;
    protected onContextMenuOpenChange(open: boolean): void;
    protected closeContextMenu(restoreFocus?: boolean): void;
    protected isRowSelected(rowId: string): boolean;
    protected toggleAllRowsSelection(checked: boolean): void;
    protected toggleRowSelection(rowId: string, checked: boolean): void;
    protected selectionLabel(row: CxTableRow): string;
    protected trackColumn(index: number, column: CxTableColumn): string;
    protected trackRow(index: number, row: CxTableRow): string;
    protected cellFor(row: CxTableRow, columnId: string): CxTableCell | undefined;
    protected progressPercent(value: number): string;
    protected rowKind(row: CxTableRow): CxTableRowKind;
    protected rowIsSelectable(row: CxTableRow): boolean;
    protected rowIsKeyboardReachable(row: CxTableRow): boolean;
    protected rowLabel(row: CxTableRow): string | null;
    protected resolvedTextIcon(row: CxTableRow, column: CxTableColumn, cell: CxTableCell): CxIconName | undefined;
    protected isColumnSortable(column: CxTableColumn): boolean;
    protected hasColumnHeaderMenu(column: CxTableColumn): boolean;
    protected columnHeaderMenuColumn(): CxTableColumn | undefined;
    protected isColumnFilterable(column: CxTableColumn): boolean;
    protected isColumnPinnable(column: CxTableColumn): boolean;
    protected isColumnHideable(column: CxTableColumn): boolean;
    protected hasColumnHeaderMenuProperties(column: CxTableColumn): boolean;
    protected columnFilterValue(column: CxTableColumn): CxColumnFilterValue | undefined;
    protected isColumnFilterActive(column: CxTableColumn): boolean;
    protected columnFilterSummary(column: CxTableColumn): string | undefined;
    protected canPinColumn(column: CxTableColumn): boolean;
    protected canHideColumn(column: CxTableColumn): boolean;
    protected columnHeaderMenuAriaLabel(column: CxTableColumn): string;
    protected columnHeaderTriggerAriaLabel(column: CxTableColumn): string;
    protected isColumnHeaderMenuOpen(column: CxTableColumn): boolean;
    protected sortIcon(columnId: string): CxIconName | undefined;
    protected sortAria(columnId: string): 'ascending' | 'descending' | null;
    protected onColumnHeaderTriggerClick(event: MouseEvent, column: CxTableColumn, triggerElement: HTMLElement): void;
    protected onColumnFilterValueChange(column: CxTableColumn, value: CxColumnFilterValue | undefined): void;
    protected onColumnFilterQueryChange(columnId: string, query: string): void;
    protected onColumnFilterLoadMore(columnId: string): void;
    protected onResetTable(): void;
    protected onEmptyStateAction(action: CxTableEmptyStateAction): void;
    protected onColumnHeaderAction(column: CxTableColumn, action: CxTableColumnHeaderAction): void;
    private applyColumnSort;
    private openColumnHeaderMenu;
    closeColumnHeaderMenu(restoreFocus?: boolean): void;
    private adjacentColumnHeaderTrigger;
    private focusColumnHeaderMenuWhenReady;
    private scheduleColumnHeaderMenuFocus;
    private retryColumnHeaderMenuFocus;
    private syncColumnHeaderMenuPosition;
    protected isColumnPinned(column: CxTableColumn): boolean;
    protected isLastPinnedColumn(column: CxTableColumn): boolean;
    protected columnPinnedLeft(column: CxTableColumn): string | null;
    protected isColumnEffectivelyPinned(column: CxTableColumn): boolean;
    protected columnWidth(column: CxTableColumn): string | null;
    protected columnWidthValue(column: CxTableColumn): number;
    protected onColumnResizePointerDown(event: PointerEvent, column: CxTableColumn): void;
    protected onColumnResizeDoubleClick(event: MouseEvent, column: CxTableColumn): void;
    protected onColumnResizeKeydown(event: KeyboardEvent, column: CxTableColumn): void;
    protected onColumnGripPointerDown(event: PointerEvent, column: CxTableColumn): void;
    protected onColumnGripPointerMove(event: PointerEvent): void;
    protected onColumnGripPointerUp(event: PointerEvent): void;
    protected onColumnGripPointerCancel(event: PointerEvent): void;
    protected onColumnGripLostPointerCapture(event: PointerEvent): void;
    protected onColumnGripKeydown(event: KeyboardEvent, column: CxTableColumn, handleElement: HTMLElement): void;
    protected onColumnResizePointerMove(event: PointerEvent): void;
    protected onColumnResizePointerUp(event: PointerEvent): void;
    protected onColumnResizePointerCancel(event: PointerEvent): void;
    protected onColumnResizeLostPointerCapture(event: PointerEvent): void;
    protected onWindowResize(): void;
    private stopResizeSession;
    private openRowContextMenu;
    private resolveRowContextMenuPosition;
    private stopReorderSession;
    /**
     * The key column carries the row identity, so it sizes to its content
     * automatically whenever rows or columns change — until the
     * user resizes it manually, which takes ownership of the width.
     * Timeout-based (not animation frames) so it also runs in hidden tabs, and
     * retried briefly because the new rows render one change-detection pass
     * after the input setter fires.
     */
    private scheduleKeyColumnAutoFit;
    /** Returns true when settled: applied, or skipped because the user owns the width. */
    private applyKeyColumnAutoFit;
    /**
     * Auto-fit must never be the reason a horizontal scrollbar exists: the key
     * column prefers its content width but yields — down to the shared column
     * minimum — before the table outgrows its viewport. The candidate width is
     * applied first so the browser itself reports the overflow it would cause;
     * that keeps menu/selection columns, paddings, and borders accounted for
     * without duplicating layout math. Any overflow that remains at the minimum
     * width comes from content-sized columns, and then the scrollbar is honest.
     */
    private capAutoFitColumnWidthToViewport;
    private updateColumnWidth;
    private syncPinnedColumnOffsets;
    private observeTableViewport;
    private pinnedColumnsFit;
    private currentSelectionColumnWidth;
    private currentColumnWidth;
    private autoFitColumnWidth;
    /**
     * The live cell content shrinks to the current column width, so its rendered
     * width is useless for auto-fit once it is already clipped. Measure an
     * off-flow clone freed from the flex constraints instead — it reports the
     * content's natural width while inheriting the same component styles.
     */
    private measureNaturalContentWidth;
    private escapeColumnId;
    private resolveDropIndicator;
    private commitColumnReorder;
    private startKeyboardColumnReorder;
    private moveKeyboardColumn;
    private commitKeyboardColumnReorder;
    private cancelKeyboardColumnReorder;
    private focusColumnGripAfterRender;
    private announceColumnPosition;
    private focusColumnGrip;
    private normalizeColumnOrder;
    private ordersMatch;
    private clampColumnWidth;
    private applyColumnWidthToDom;
    private isResizeGesture;
    private rowOwnsKeyboardEvent;
    private moveRowFocus;
    private setActiveRow;
    private eventComesFromInteractiveDescendant;
    private elementPathToRow;
    private isInteractiveElement;
    private keyTextCell;
    private updateDragPreview;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTableComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTableComponent, "cx-table", never, { "density": { "alias": "density"; "required": false; }; "rowActivation": { "alias": "rowActivation"; "required": false; }; "showHeaders": { "alias": "showHeaders"; "required": false; }; "columnsResizable": { "alias": "columnsResizable"; "required": false; }; "columnsReorderable": { "alias": "columnsReorderable"; "required": false; }; "stickyHeader": { "alias": "stickyHeader"; "required": false; }; "zebra": { "alias": "zebra"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "showRowActions": { "alias": "showRowActions"; "required": false; }; "rightClickMenu": { "alias": "rightClickMenu"; "required": false; }; "emptyState": { "alias": "emptyState"; "required": false; }; "emptyStateAction": { "alias": "emptyStateAction"; "required": false; }; "noMatchesState": { "alias": "noMatchesState"; "required": false; }; "selectionMode": { "alias": "selectionMode"; "required": false; }; "columns": { "alias": "columns"; "required": false; }; "rows": { "alias": "rows"; "required": false; }; "activeRowId": { "alias": "activeRowId"; "required": false; }; "selectedRowIds": { "alias": "selectedRowIds"; "required": false; }; "filterValues": { "alias": "filterValues"; "required": false; }; "sort": { "alias": "sort"; "required": false; }; }, { "activeRowIdChange": "activeRowIdChange"; "emptyStateActionSelect": "emptyStateActionSelect"; "selectedRowIdsChange": "selectedRowIdsChange"; "rowMenuItemSelect": "rowMenuItemSelect"; "rowActivate": "rowActivate"; "columnOrderChange": "columnOrderChange"; "sortChange": "sortChange"; "filterValuesChange": "filterValuesChange"; "resetTable": "resetTable"; "filterQueryChange": "filterQueryChange"; "filterLoadMore": "filterLoadMore"; "columnHeaderMenuOpenChange": "columnHeaderMenuOpenChange"; "columnPinChange": "columnPinChange"; "columnVisibilityChange": "columnVisibilityChange"; }, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-table.component.d.ts.map