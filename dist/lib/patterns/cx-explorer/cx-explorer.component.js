import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild, computed, inject, signal, } from "@angular/core";
import { CdkDrag, CdkDragHandle, CdkDropList, moveItemInArray, } from "@angular/cdk/drag-drop";
import { CxIconButtonComponent } from "../../primitives/actions/cx-icon-button/index.js";
import { CX_TAG_COLOR_PICKER_OPTIONS, } from "../../primitives/display/cx-tag/index.js";
import { CxSearchFieldComponent } from "../../primitives/inputs/cx-search-field/index.js";
import { CxIconComponent } from "../../primitives/media/cx-icon/index.js";
import { CxMenuComponent, CxMenuTriggerDirective, } from "../../primitives/overlay/cx-menu/index.js";
import { CxPopoverComponent } from "../../primitives/overlay/cx-popover/index.js";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip/index.js";
import { CxFloatingSurfaceController } from "../../primitives/overlay/floating-surface-controller.js";
import * as i0 from "@angular/core";
/**
 * Built-in row actions own this id space so consumer-added menu entries can
 * never collide with them.
 */
const RESERVED_MENU_PREFIX = "cx-explorer:";
const MENU_RENAME = `${RESERVED_MENU_PREFIX}rename`;
const MENU_STYLE = `${RESERVED_MENU_PREFIX}style`;
const MENU_DELETE = `${RESERVED_MENU_PREFIX}delete`;
const DEFAULT_ITEM_ICON = "document";
const PICKER_WIDTH = 272;
const PICKER_ESTIMATED_HEIGHT = 332;
const FOLDER_CREATE_RENAME_TIMEOUT_MS = 30_000;
const EXPANDED_FOLDER_STORAGE_PREFIX = "cx-explorer.expanded-folder.";
const EXPLORER_DEFAULT_WIDTH = 260;
const EXPLORER_RESIZE_STEP = 8;
const EXPLORER_RESIZE_LARGE_STEP = 32;
/**
 * The icon vocabulary offered by the built-in icon & color editor: friendly,
 * content-shaped identities rather than the full product icon manifest.
 * Consumers with a different vocabulary pass `itemIcons`.
 */
export const CX_EXPLORER_DEFAULT_ITEM_ICONS = [
    "note",
    "document",
    "documents",
    "books",
    "bookmark",
    "star",
    "heart",
    "flag",
    "bolt",
    "award",
    "calendar",
    "camera",
    "cash",
    "chat",
    "check-square",
    "cloud",
    "envelope",
    "image",
    "link",
    "list-bullets",
    "lock",
    "package",
    "phone",
    "pin",
    "play",
    "radar",
    "robot",
    "schedule",
    "shield",
    "statistics",
    "tag",
    "terminal",
    "time",
    "trend-up",
    "user",
    "workflow",
];
/**
 * Content rail for browsing and managing one-level collections of user
 * content: persistent root items can sit above folders, and folders hold
 * nested items. Editable explorers expose mutation controls for folders and
 * nested items; root items stay browse-only. Unlike `cx-side-nav` it navigates
 * nothing — the consumer owns persisted effects.
 */
export class CxExplorerComponent {
    host = inject(ElementRef);
    explorerSurface;
    set explorerContent(contentRef) {
        this.contentResizeObserver?.disconnect();
        this.contentResizeObserver = undefined;
        const content = contentRef?.nativeElement;
        if (!content) {
            this.host.nativeElement.style.removeProperty("--cx-explorer-scrollbar-gutter");
            return;
        }
        const syncGutter = () => {
            const gutter = Math.max(0, content.offsetWidth - content.clientWidth);
            this.host.nativeElement.style.setProperty("--cx-explorer-scrollbar-gutter", `${gutter}px`);
        };
        syncGutter();
        if (typeof ResizeObserver !== "undefined") {
            this.contentResizeObserver = new ResizeObserver(syncGutter);
            this.contentResizeObserver.observe(content);
        }
    }
    rootItemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rootItemsState" }] : /* istanbul ignore next */ []));
    foldersState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "foldersState" }] : /* istanbul ignore next */ []));
    selectedItemIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedItemIdState" }] : /* istanbul ignore next */ []));
    itemIconsState = signal(CX_EXPLORER_DEFAULT_ITEM_ICONS, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemIconsState" }] : /* istanbul ignore next */ []));
    folderMenuItemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "folderMenuItemsState" }] : /* istanbul ignore next */ []));
    itemMenuItemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemMenuItemsState" }] : /* istanbul ignore next */ []));
    folderCreateBaseline = null;
    folderCreateRenameTimer;
    contentResizeObserver;
    persistenceStorageKey = "";
    /** One open folder at most; the untouched default is fully collapsed. */
    expandedFolderId = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expandedFolderId" }] : /* istanbul ignore next */ []));
    renaming = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renaming" }] : /* istanbul ignore next */ []));
    pickerItemId = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pickerItemId" }] : /* istanbul ignore next */ []));
    resizing = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resizing" }] : /* istanbul ignore next */ []));
    resizedWidth = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "resizedWidth" }] : /* istanbul ignore next */ []));
    activeResizeSession;
    skeletonRows = Array.from({ length: 7 }, (_, index) => `skeleton-${index}`);
    pickerColors = CX_TAG_COLOR_PICKER_OPTIONS;
    pickerWidth = PICKER_WIDTH;
    /**
     * Fixed-size surface: the measure callback publishes the final metrics, so
     * no post-render surface pass is needed.
     */
    pickerOverlay = new CxFloatingSurfaceController(() => ({
        width: PICKER_WIDTH,
        estimatedHeight: PICKER_ESTIMATED_HEIGHT,
        align: "end",
        gap: 6,
    }));
    set folders(value) {
        const folders = validateExplorerFolders(value ?? []);
        assertUniqueExplorerItemIds(this.rootItemsState(), folders);
        this.foldersState.set(folders);
        this.reconcileExpandedFolder();
        const baseline = this.folderCreateBaseline;
        if (!baseline)
            return;
        const createdFolders = folders.filter((folder) => !baseline.has(folder.id));
        if (createdFolders.length !== 1)
            return;
        this.clearFolderCreateRequest();
        this.beginRename("folder", createdFolders[0].id);
    }
    /** Persistent, browse-only selections rendered above the folder hierarchy. */
    set rootItems(value) {
        const rootItems = validateExplorerItems(value ?? [], "rootItems");
        assertUniqueExplorerItemIds(rootItems, this.foldersState());
        this.rootItemsState.set(rootItems);
    }
    set selectedItemId(value) {
        const id = value?.trim() || undefined;
        this.selectedItemIdState.set(id);
    }
    loading = false;
    /** Enables built-in reordering plus create, rename, restyle, and delete controls. */
    editable = true;
    /** Accessible name of the rail region. Name it after the content it manages. */
    ariaLabel = "Explorer";
    /** Optional width / minimum-width overrides as CSS lengths. */
    set width(value) {
        this.widthValue = value;
        this.resizedWidth.set(null);
    }
    get width() {
        return this.widthValue;
    }
    widthValue = null;
    minWidth = null;
    /** Lets the user drag the explorer's end edge to change its width. */
    resizable = true;
    /** Shows the built-in controlled collection search. */
    searchable = false;
    /** Current search query. The consumer filters its owned content. */
    searchValue = "";
    /** Accessible name of the built-in search field. */
    searchAriaLabel = "Search";
    /**
     * Stable local key used to remember the last open folder in this browser.
     * Omit it when disclosure should reset to fully collapsed on every load.
     */
    set persistenceKey(value) {
        const key = value?.trim() ?? "";
        if (key === this.persistenceStorageKey)
            return;
        this.persistenceStorageKey = key;
        this.expandedFolderId.set(readExpandedFolderId(key));
        this.reconcileExpandedFolder();
    }
    /** Label for the per-folder create action; also its tooltip. */
    createItemText = "New page";
    set itemIcons(value) {
        if (value !== null && value !== undefined && !Array.isArray(value)) {
            throw new Error("[cx-explorer] itemIcons must be an array of icon names.");
        }
        const icons = value ?? [];
        this.itemIconsState.set(icons.length > 0 ? [...icons] : CX_EXPLORER_DEFAULT_ITEM_ICONS);
    }
    /** Extra folder menu entries, between Rename and Delete. Reported via `menuAction`. */
    set folderMenuItems(value) {
        this.folderMenuItemsState.set(validateExplorerMenuItems(value ?? [], "folderMenuItems"));
    }
    /** Extra item menu entries, between Icon & color and Delete. Reported via `menuAction`. */
    set itemMenuItems(value) {
        this.itemMenuItemsState.set(validateExplorerMenuItems(value ?? [], "itemMenuItems"));
    }
    selectedItemIdChange = new EventEmitter();
    /** Emits the rendered width as a px length after a user resize settles. */
    widthChange = new EventEmitter();
    searchValueChange = new EventEmitter();
    folderCreate = new EventEmitter();
    /** Create an item inside the folder with this id. */
    itemCreate = new EventEmitter();
    folderChange = new EventEmitter();
    /** Controlled folder order after a drag completes. */
    folderOrderChange = new EventEmitter();
    /** The item's identity changed (rename or icon & color); emits the updated item. */
    itemChange = new EventEmitter();
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    folderDelete = new EventEmitter();
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    itemDelete = new EventEmitter();
    menuAction = new EventEmitter();
    rootItems$ = this.rootItemsState.asReadonly();
    folders$ = this.foldersState.asReadonly();
    selectedItemId$ = this.selectedItemIdState.asReadonly();
    itemIcons$ = this.itemIconsState.asReadonly();
    get widthVar() {
        return this.resizedWidth() ?? this.width;
    }
    get minWidthVar() {
        return this.minWidth;
    }
    /** The item the icon & color editor is open for; closes when the item disappears. */
    pickerItem = computed(() => {
        const id = this.pickerItemId();
        if (!id)
            return null;
        for (const folder of this.foldersState()) {
            const item = folder.items.find((entry) => entry.id === id);
            if (item)
                return item;
        }
        return null;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pickerItem" }] : /* istanbul ignore next */ []));
    ngOnDestroy() {
        this.contentResizeObserver?.disconnect();
        this.stopResizeSession();
        this.clearFolderCreateRequest();
        this.pickerOverlay.destroy();
    }
    get resolvedResizeAriaLabel() {
        const label = this.ariaLabel.trim();
        return label ? `Resize ${label}` : "Resize explorer";
    }
    get renderedWidthPx() {
        return Math.round(this.explorerSurface?.nativeElement.getBoundingClientRect().width ??
            EXPLORER_DEFAULT_WIDTH);
    }
    onResizePointerDown(event) {
        const surface = this.explorerSurface?.nativeElement;
        if (!surface || !this.resizable || !event.isPrimary || event.button !== 0) {
            return;
        }
        event.preventDefault();
        const handle = event.currentTarget;
        this.stopResizeSession();
        this.activeResizeSession = {
            pointerId: event.pointerId,
            handle,
            startX: event.clientX,
            startWidth: surface.getBoundingClientRect().width,
            rtl: window.getComputedStyle(surface).direction === "rtl",
        };
        this.resizing.set(true);
        handle.setPointerCapture(event.pointerId);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }
    onResizePointerMove(event) {
        const session = this.activeResizeSession;
        if (!session || event.pointerId !== session.pointerId) {
            return;
        }
        // Explorer is anchored to the inline start, so dragging its end edge
        // outward widens it in either writing direction. CSS owns the clamping.
        const delta = (event.clientX - session.startX) * (session.rtl ? -1 : 1);
        this.resizedWidth.set(`${Math.round(session.startWidth + delta)}px`);
    }
    onResizePointerUp(event) {
        if (this.activeResizeSession?.pointerId === event.pointerId) {
            this.finishResizeSession();
        }
    }
    onResizePointerCancel(event) {
        if (this.activeResizeSession?.pointerId === event.pointerId) {
            this.finishResizeSession();
        }
    }
    onResizeLostPointerCapture(event) {
        if (this.activeResizeSession?.pointerId === event.pointerId) {
            this.finishResizeSession();
        }
    }
    onResizeKeydown(event) {
        const surface = this.explorerSurface?.nativeElement;
        if (!surface || !this.resizable) {
            return;
        }
        const rtl = window.getComputedStyle(surface).direction === "rtl";
        const step = event.shiftKey
            ? EXPLORER_RESIZE_LARGE_STEP
            : EXPLORER_RESIZE_STEP;
        const current = surface.getBoundingClientRect().width;
        const outwardKey = rtl ? "ArrowLeft" : "ArrowRight";
        const inwardKey = rtl ? "ArrowRight" : "ArrowLeft";
        let next;
        switch (event.key) {
            case outwardKey:
                next = current + step;
                break;
            case inwardKey:
                next = current - step;
                break;
            case "Home":
                next = 0;
                break;
            case "End":
                next = Number.MAX_SAFE_INTEGER;
                break;
            default:
                return;
        }
        event.preventDefault();
        this.resizedWidth.set(`${Math.min(Math.max(Math.round(next), 0), 100000)}px`);
        this.emitRenderedWidthAfterLayout();
    }
    onResizeDoubleClick(event) {
        if (!this.resizable) {
            return;
        }
        event.preventDefault();
        this.stopResizeSession();
        this.resizedWidth.set(`${EXPLORER_DEFAULT_WIDTH}px`);
        this.emitRenderedWidthAfterLayout();
    }
    finishResizeSession() {
        this.stopResizeSession();
        this.widthChange.emit(`${this.renderedWidthPx}px`);
    }
    stopResizeSession() {
        const session = this.activeResizeSession;
        this.activeResizeSession = undefined;
        if (session && session.handle.hasPointerCapture(session.pointerId)) {
            session.handle.releasePointerCapture(session.pointerId);
        }
        this.resizing.set(false);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
    }
    emitRenderedWidthAfterLayout() {
        window.setTimeout(() => this.widthChange.emit(`${this.renderedWidthPx}px`));
    }
    hasContent() {
        return this.rootItemsState().length > 0 || this.foldersState().length > 0;
    }
    hasFolders() {
        return this.foldersState().length > 0;
    }
    isFolderExpanded(folder) {
        return this.expandedFolderId() === folder.id;
    }
    toggleFolder(folder) {
        if (this.isRenaming("folder", folder.id))
            return;
        this.setExpandedFolder(this.isFolderExpanded(folder) ? null : folder.id);
    }
    onFolderDrop(event) {
        if (!this.editable || event.previousIndex === event.currentIndex)
            return;
        const ids = this.foldersState().map((folder) => folder.id);
        moveItemInArray(ids, event.previousIndex, event.currentIndex);
        this.folderOrderChange.emit(ids);
    }
    onFolderMoveByKeyboard(event, folder, offset) {
        if (!this.editable)
            return;
        const ids = this.foldersState().map((entry) => entry.id);
        const previousIndex = ids.indexOf(folder.id);
        const currentIndex = previousIndex + offset;
        if (previousIndex < 0 || currentIndex < 0 || currentIndex >= ids.length)
            return;
        event.preventDefault();
        event.stopPropagation();
        moveItemInArray(ids, previousIndex, currentIndex);
        this.folderOrderChange.emit(ids);
    }
    isSelected(item) {
        return this.selectedItemIdState() === item.id;
    }
    onItemPressed(item) {
        if (this.isRenaming("item", item.id))
            return;
        this.selectedItemIdState.set(item.id);
        this.selectedItemIdChange.emit(item.id);
    }
    onFolderCreate() {
        this.clearFolderCreateRequest();
        this.folderCreateBaseline = new Set(this.foldersState().map((folder) => folder.id));
        this.folderCreateRenameTimer = setTimeout(() => this.clearFolderCreateRequest(), FOLDER_CREATE_RENAME_TIMEOUT_MS);
        this.folderCreate.emit();
    }
    itemIcon(item) {
        return item.icon ?? DEFAULT_ITEM_ICON;
    }
    /**
     * Hue as a CSS custom property so the stylesheet owns how the accent is
     * applied. The color union is closed, so the var name is always a real token.
     */
    itemAccent(item) {
        return item.color ? `var(--${item.color})` : null;
    }
    swatchAccent(color) {
        return `var(--${color})`;
    }
    folderMenu() {
        if (!this.editable)
            return this.folderMenuItemsState();
        return [
            { id: MENU_RENAME, label: "Rename", prependIcon: "edit" },
            ...this.folderMenuItemsState(),
            {
                id: MENU_DELETE,
                label: "Delete",
                prependIcon: "delete",
                danger: true,
                dividerBefore: true,
            },
        ];
    }
    itemMenu() {
        if (!this.editable)
            return this.itemMenuItemsState();
        return [
            { id: MENU_RENAME, label: "Rename", prependIcon: "edit" },
            { id: MENU_STYLE, label: "Icon & color", prependIcon: "squares-rotated" },
            ...this.itemMenuItemsState(),
            {
                id: MENU_DELETE,
                label: "Delete",
                prependIcon: "delete",
                danger: true,
                dividerBefore: true,
            },
        ];
    }
    hasFolderMenu() {
        return this.folderMenu().length > 0;
    }
    hasItemMenu() {
        return this.itemMenu().length > 0;
    }
    onFolderMenuSelect(folder, actionId) {
        if (actionId === MENU_RENAME) {
            this.beginRename("folder", folder.id);
            return;
        }
        if (actionId === MENU_DELETE) {
            this.folderDelete.emit(folder.id);
            return;
        }
        this.menuAction.emit({ kind: "folder", id: folder.id, actionId });
    }
    onItemMenuSelect(item, actionId, row) {
        if (actionId === MENU_RENAME) {
            this.beginRename("item", item.id);
            return;
        }
        if (actionId === MENU_STYLE) {
            this.openPicker(item, row);
            return;
        }
        if (actionId === MENU_DELETE) {
            this.itemDelete.emit(item.id);
            return;
        }
        this.menuAction.emit({ kind: "item", id: item.id, actionId });
    }
    isRenaming(kind, id) {
        const target = this.renaming();
        return !!target && target.kind === kind && target.id === id;
    }
    beginRename(kind, id) {
        if (!this.editable)
            return;
        this.closePicker();
        this.renaming.set({ kind, id });
        // The input exists only after the next render pass; select-all so typing
        // replaces the current name.
        afterRenderFrame(() => {
            const input = this.host.nativeElement.querySelector(".cx-explorer__rename-input");
            input?.focus();
            input?.select();
        });
    }
    commitRename(event, kind, current) {
        if (!this.isRenaming(kind, current.id))
            return;
        this.renaming.set(null);
        const name = event.target.value.trim();
        if (!name || name === current.name)
            return;
        if (kind === "folder") {
            this.folderChange.emit({ id: current.id, name });
            return;
        }
        const item = this.findItem(current.id);
        if (item) {
            this.itemChange.emit({ ...item, name });
        }
    }
    cancelRename(event) {
        // Keep the escape local: the rail's rename must not also dismiss an
        // overlay that happens to contain it.
        event.stopPropagation();
        this.renaming.set(null);
    }
    onRenameEnter(event) {
        event.target.blur();
    }
    clearFolderCreateRequest() {
        this.folderCreateBaseline = null;
        if (this.folderCreateRenameTimer) {
            clearTimeout(this.folderCreateRenameTimer);
            this.folderCreateRenameTimer = undefined;
        }
    }
    openPicker(item, row) {
        this.renaming.set(null);
        this.pickerOverlay.endSession();
        this.pickerItemId.set(item.id);
        this.pickerOverlay.sync(row);
        // Focus follows into the editor so the keyboard path continues where the
        // menu handed over; the popover restores focus on close. The surface
        // exists only after the next render pass.
        afterRenderFrame(() => {
            const surface = this.host.nativeElement.querySelector(".cx-explorer__picker");
            const target = surface?.querySelector('button[aria-pressed="true"]') ??
                surface?.querySelector("button");
            target?.focus();
        });
    }
    closePicker() {
        if (this.pickerItemId() === null)
            return;
        this.pickerItemId.set(null);
        this.pickerOverlay.endSession();
    }
    isPickerIconSelected(item, icon) {
        return this.itemIcon(item) === icon;
    }
    onPickerColor(item, color) {
        if ((item.color ?? undefined) === color)
            return;
        this.itemChange.emit({ ...item, color });
    }
    onPickerIcon(item, icon) {
        if (this.itemIcon(item) === icon)
            return;
        this.itemChange.emit({ ...item, icon });
    }
    onCreateItem(folder) {
        if (!this.editable)
            return;
        // Creating into a closed folder must land somewhere visible.
        this.setExpandedFolder(folder.id);
        this.itemCreate.emit(folder.id);
    }
    findItem(id) {
        for (const folder of this.foldersState()) {
            const item = folder.items.find((entry) => entry.id === id);
            if (item)
                return item;
        }
        return undefined;
    }
    setExpandedFolder(id) {
        this.expandedFolderId.set(id);
        writeExpandedFolderId(this.persistenceStorageKey, id);
    }
    reconcileExpandedFolder() {
        const expanded = this.expandedFolderId();
        const folders = this.foldersState();
        if (!expanded ||
            folders.length === 0 ||
            folders.some((folder) => folder.id === expanded))
            return;
        this.setExpandedFolder(null);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxExplorerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxExplorerComponent, isStandalone: true, selector: "cx-explorer", inputs: { folders: "folders", rootItems: "rootItems", selectedItemId: "selectedItemId", loading: "loading", editable: ["editable", "editable", booleanAttribute], ariaLabel: "ariaLabel", width: "width", minWidth: "minWidth", resizable: ["resizable", "resizable", booleanAttribute], searchable: ["searchable", "searchable", booleanAttribute], searchValue: "searchValue", searchAriaLabel: "searchAriaLabel", persistenceKey: "persistenceKey", createItemText: "createItemText", itemIcons: "itemIcons", folderMenuItems: "folderMenuItems", itemMenuItems: "itemMenuItems" }, outputs: { selectedItemIdChange: "selectedItemIdChange", widthChange: "widthChange", searchValueChange: "searchValueChange", folderCreate: "folderCreate", itemCreate: "itemCreate", folderChange: "folderChange", folderOrderChange: "folderOrderChange", itemChange: "itemChange", folderDelete: "folderDelete", itemDelete: "itemDelete", menuAction: "menuAction" }, host: { properties: { "style.--cx-explorer-width": "this.widthVar", "style.--cx-explorer-min-width": "this.minWidthVar" } }, viewQueries: [{ propertyName: "explorerSurface", first: true, predicate: ["explorerSurface"], descendants: true, read: ElementRef }, { propertyName: "explorerContent", first: true, predicate: ["explorerContent"], descendants: true, read: ElementRef }], ngImport: i0, template: "<aside\n  #explorerSurface\n  class=\"cx-explorer\"\n  [class.cx-explorer--resizable]=\"resizable\"\n  [attr.aria-label]=\"ariaLabel\"\n>\n  @if (resizable) {\n    <div\n      class=\"cx-explorer__resize-handle\"\n      [class.cx-explorer__resize-handle--active]=\"resizing()\"\n      role=\"separator\"\n      tabindex=\"0\"\n      aria-orientation=\"vertical\"\n      [attr.aria-label]=\"resolvedResizeAriaLabel\"\n      [attr.aria-valuenow]=\"renderedWidthPx\"\n      [attr.aria-valuetext]=\"renderedWidthPx + ' pixels'\"\n      (pointerdown)=\"onResizePointerDown($event)\"\n      (pointermove)=\"onResizePointerMove($event)\"\n      (pointerup)=\"onResizePointerUp($event)\"\n      (pointercancel)=\"onResizePointerCancel($event)\"\n      (lostpointercapture)=\"onResizeLostPointerCapture($event)\"\n      (keydown)=\"onResizeKeydown($event)\"\n      (dblclick)=\"onResizeDoubleClick($event)\"\n    ></div>\n  }\n\n  <div class=\"cx-explorer__header\">\n    <ng-content select=\"[header]\" />\n    @if (editable) {\n      <cx-icon-button\n        class=\"cx-explorer__new-folder\"\n        icon=\"plus\"\n        ariaLabel=\"New folder\"\n        cxTooltip=\"New folder\"\n        (pressed)=\"onFolderCreate()\"\n      />\n    }\n  </div>\n\n  @if (searchable) {\n    <cx-search-field\n      class=\"cx-explorer__search\"\n      label=\"\"\n      [ariaLabel]=\"searchAriaLabel\"\n      [clearable]=\"true\"\n      [value]=\"searchValue\"\n      (valueChange)=\"searchValueChange.emit($event)\"\n    />\n  }\n\n  @if (loading) {\n    <div class=\"cx-explorer__skeleton\" aria-hidden=\"true\">\n      @for (row of skeletonRows; track row) {\n        <span class=\"cx-explorer__skeleton-row\"></span>\n      }\n    </div>\n  } @else if (hasContent()) {\n    <div #explorerContent class=\"cx-explorer__content\">\n      @if (rootItems$().length > 0) {\n        <ul class=\"cx-explorer__root-items\">\n          @for (item of rootItems$(); track item.id) {\n            <li\n              class=\"cx-explorer__row cx-explorer__row--root\"\n              [style.--cx-explorer-accent]=\"itemAccent(item)\"\n            >\n              <button\n                class=\"cx-explorer__row-main\"\n                type=\"button\"\n                [class.cx-explorer__row-main--selected]=\"isSelected(item)\"\n                [attr.aria-current]=\"isSelected(item) ? 'true' : null\"\n                (click)=\"onItemPressed(item)\"\n              >\n                <span\n                  class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\"\n                  aria-hidden=\"true\"\n                >\n                  <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                </span>\n                <span\n                  class=\"cx-explorer__row-label cx-explorer__row-label--root\"\n                  >{{ item.name }}</span\n                >\n              </button>\n            </li>\n          }\n        </ul>\n      }\n\n      @if (hasFolders()) {\n        <div\n          class=\"cx-explorer__folders\"\n          cdkDropList\n          cdkDropListLockAxis=\"y\"\n          [cdkDropListData]=\"folders$()\"\n          (cdkDropListDropped)=\"onFolderDrop($event)\"\n        >\n          @for (folder of folders$(); track folder.id) {\n            <section\n              class=\"cx-explorer__folder\"\n              cdkDrag\n              [cdkDragData]=\"folder\"\n              [cdkDragDisabled]=\"!editable || isRenaming('folder', folder.id)\"\n            >\n              <div\n                class=\"cx-explorer__row cx-explorer__row--folder\"\n                cdkDragHandle\n              >\n                @if (isRenaming(\"folder\", folder.id)) {\n                  <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                    <cx-icon icon=\"folder\" [size]=\"16\" />\n                  </span>\n                  <input\n                    class=\"cx-explorer__rename-input\"\n                    type=\"text\"\n                    aria-label=\"Folder name\"\n                    [value]=\"folder.name\"\n                    (blur)=\"commitRename($event, 'folder', folder)\"\n                    (keydown.enter)=\"onRenameEnter($event)\"\n                    (keydown.escape)=\"cancelRename($event)\"\n                  />\n                } @else {\n                  <button\n                    class=\"cx-explorer__row-main\"\n                    type=\"button\"\n                    [attr.aria-expanded]=\"isFolderExpanded(folder)\"\n                    aria-keyshortcuts=\"Alt+ArrowUp Alt+ArrowDown\"\n                    (click)=\"toggleFolder(folder)\"\n                    (dblclick)=\"editable && beginRename('folder', folder.id)\"\n                    (keydown.alt.arrowup)=\"\n                      onFolderMoveByKeyboard($event, folder, -1)\n                    \"\n                    (keydown.alt.arrowdown)=\"\n                      onFolderMoveByKeyboard($event, folder, 1)\n                    \"\n                  >\n                    <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                      <cx-icon icon=\"folder\" [size]=\"16\" />\n                    </span>\n                    <span\n                      class=\"cx-explorer__row-label cx-explorer__row-label--folder\"\n                      >{{ folder.name }}</span\n                    >\n                    <cx-icon\n                      class=\"cx-explorer__chevron\"\n                      [icon]=\"\n                        isFolderExpanded(folder) ? 'chevron-up' : 'chevron-down'\n                      \"\n                      [size]=\"16\"\n                    />\n                  </button>\n                  @if (editable || hasFolderMenu()) {\n                    <div class=\"cx-explorer__row-actions\">\n                      @if (editable) {\n                        <cx-icon-button\n                          icon=\"plus\"\n                          size=\"small\"\n                          variant=\"transparent\"\n                          [ariaLabel]=\"createItemText\"\n                          [cxTooltip]=\"createItemText\"\n                          (pressed)=\"onCreateItem(folder)\"\n                        />\n                      }\n                      @if (hasFolderMenu()) {\n                        <cx-menu\n                          [presentation]=\"{ kind: 'trigger' }\"\n                          [items]=\"folderMenu()\"\n                          ariaLabel=\"Folder actions\"\n                          (itemSelect)=\"onFolderMenuSelect(folder, $event)\"\n                        >\n                          <cx-icon-button\n                            cxMenuTrigger\n                            icon=\"menu-vertical\"\n                            size=\"small\"\n                            variant=\"transparent\"\n                            ariaLabel=\"Folder actions\"\n                          />\n                        </cx-menu>\n                      }\n                    </div>\n                  }\n                }\n              </div>\n\n              @if (folder.items.length > 0) {\n                <div\n                  class=\"cx-explorer__items\"\n                  [class.cx-explorer__items--expanded]=\"\n                    isFolderExpanded(folder)\n                  \"\n                >\n                  <ul class=\"cx-explorer__items-inner\">\n                    @for (item of folder.items; track item.id) {\n                      <li\n                        class=\"cx-explorer__row cx-explorer__row--item\"\n                        #itemRow\n                        [style.--cx-explorer-accent]=\"itemAccent(item)\"\n                      >\n                        @if (isRenaming(\"item\", item.id)) {\n                          <span\n                            class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\"\n                            aria-hidden=\"true\"\n                          >\n                            <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                          </span>\n                          <input\n                            class=\"cx-explorer__rename-input\"\n                            type=\"text\"\n                            aria-label=\"Page name\"\n                            [value]=\"item.name\"\n                            (blur)=\"commitRename($event, 'item', item)\"\n                            (keydown.enter)=\"onRenameEnter($event)\"\n                            (keydown.escape)=\"cancelRename($event)\"\n                          />\n                        } @else {\n                          <button\n                            class=\"cx-explorer__row-main\"\n                            type=\"button\"\n                            [class.cx-explorer__row-main--selected]=\"\n                              isSelected(item)\n                            \"\n                            [attr.aria-current]=\"\n                              isSelected(item) ? 'true' : null\n                            \"\n                            (click)=\"onItemPressed(item)\"\n                            (dblclick)=\"\n                              editable && beginRename('item', item.id)\n                            \"\n                          >\n                            <span\n                              class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\"\n                              aria-hidden=\"true\"\n                            >\n                              <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                            </span>\n                            <span class=\"cx-explorer__row-label\">{{\n                              item.name\n                            }}</span>\n                          </button>\n                          <div class=\"cx-explorer__row-actions\">\n                            @if (hasItemMenu()) {\n                              <cx-menu\n                                [presentation]=\"{ kind: 'trigger' }\"\n                                [items]=\"itemMenu()\"\n                                ariaLabel=\"Page actions\"\n                                (itemSelect)=\"\n                                  onItemMenuSelect(item, $event, itemRow)\n                                \"\n                              >\n                                <cx-icon-button\n                                  cxMenuTrigger\n                                  icon=\"menu-vertical\"\n                                  size=\"small\"\n                                  variant=\"transparent\"\n                                  ariaLabel=\"Page actions\"\n                                />\n                              </cx-menu>\n                            }\n                          </div>\n                        }\n                      </li>\n                    }\n                  </ul>\n                </div>\n              }\n            </section>\n          }\n        </div>\n      }\n    </div>\n  }\n</aside>\n\n@if (pickerItem(); as item) {\n  <cx-popover\n    [open]=\"true\"\n    [showBackdrop]=\"true\"\n    [width]=\"pickerWidth\"\n    [left]=\"pickerOverlay.left$()\"\n    [top]=\"pickerOverlay.top$()\"\n    [bottom]=\"pickerOverlay.bottom$()\"\n    [maxHeight]=\"pickerOverlay.maxHeight$()\"\n    [placement]=\"pickerOverlay.placement$()\"\n    role=\"dialog\"\n    ariaLabel=\"Icon & color\"\n    (backdropPressed)=\"closePicker()\"\n  >\n    <div\n      class=\"cx-explorer__picker\"\n      [style.--cx-explorer-accent]=\"itemAccent(item)\"\n    >\n      <div class=\"cx-explorer__picker-swatches\" role=\"group\" aria-label=\"Color\">\n        <button\n          class=\"cx-explorer__swatch cx-explorer__swatch--none\"\n          type=\"button\"\n          aria-label=\"No color\"\n          [attr.aria-pressed]=\"!item.color\"\n          (click)=\"onPickerColor(item, undefined)\"\n        ></button>\n        @for (color of pickerColors; track color) {\n          <button\n            class=\"cx-explorer__swatch\"\n            type=\"button\"\n            [style.--cx-explorer-swatch]=\"swatchAccent(color)\"\n            [attr.aria-label]=\"color\"\n            [attr.aria-pressed]=\"item.color === color\"\n            (click)=\"onPickerColor(item, color)\"\n          ></button>\n        }\n      </div>\n      <div class=\"cx-explorer__picker-icons\" role=\"group\" aria-label=\"Icon\">\n        @for (icon of itemIcons$(); track icon) {\n          <button\n            class=\"cx-explorer__picker-icon\"\n            type=\"button\"\n            [attr.aria-label]=\"icon\"\n            [attr.aria-pressed]=\"isPickerIconSelected(item, icon)\"\n            (click)=\"onPickerIcon(item, icon)\"\n          >\n            <cx-icon [icon]=\"icon\" [size]=\"16\" />\n          </button>\n        }\n      </div>\n    </div>\n  </cx-popover>\n}\n", styles: [":host{display:block;height:100%;min-height:0}.cx-explorer{--cx-explorer-row-height: calc( var(--controller-size-small) + var(--space-sm) * 2 );--cx-explorer-subrow-height: calc( var(--controller-size-small) + var(--space-xs) * 2 );--cx-explorer-row-gap: 1px;--cx-explorer-rail: 0;display:flex;position:relative;width:var(--cx-explorer-width, 260px);min-width:min(max(200px,var(--cx-explorer-min-width, 0px)),100%);max-width:100%;height:100%;min-height:100%;flex-direction:column;gap:var(--space-md);padding:var(--space-sm);border-right:var(--line);background:var(--surface-alt);box-sizing:border-box;overflow:visible}.cx-explorer__header{display:flex;width:100%;height:var(--controller-size);min-height:var(--controller-size);align-items:center;flex:0 0 auto}.cx-explorer__header:empty{display:none}.cx-explorer__new-folder{margin-left:auto;flex:0 0 auto}.cx-explorer__resize-handle{position:absolute;top:0;inset-inline-end:calc(-1*(var(--space-xs) + var(--border-width)));z-index:2;width:12px;height:100%;cursor:col-resize;touch-action:none}.cx-explorer__resize-handle::after{position:absolute;top:50%;inset-inline-end:var(--space-xs);width:3px;height:calc(100% - var(--space-sm)*2);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);content:\"\";transform:translateY(-50%);transition:background-color var(--motion-fast) ease}.cx-explorer__resize-handle:hover::after,.cx-explorer__resize-handle:focus-visible::after,.cx-explorer__resize-handle--active::after{background:var(--info)}.cx-explorer__resize-handle:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}.cx-explorer__search{box-sizing:border-box;width:100%;flex:0 0 auto;padding-inline-end:var(--cx-explorer-scrollbar-gutter, 0px)}.cx-explorer__skeleton{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-xs) 0}.cx-explorer__skeleton-row{display:block;height:var(--cx-explorer-row-height);border-radius:var(--radius-sm);background:linear-gradient(90deg, var(--opacity-low), var(--opacity-mid), var(--opacity-low));background-size:180% 100%;animation:cx-explorer-skeleton 1.2s ease-in-out infinite}.cx-explorer__content{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:0;overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}.cx-explorer__root-items,.cx-explorer__folders{display:flex;width:100%;margin:0;padding:0;flex-direction:column}.cx-explorer__root-items{gap:var(--cx-explorer-row-gap);list-style:none}.cx-explorer__folders{gap:0}.cx-explorer__folder{display:flex;width:100%;flex-direction:column;gap:var(--cx-explorer-row-gap)}.cx-explorer__folder.cdk-drag-preview{border-radius:var(--radius-md);background:var(--surface-alt);box-shadow:var(--shadow-mid)}.cx-explorer__folder.cdk-drag-preview .cx-explorer__items{display:none}.cx-explorer__folder.cdk-drag-placeholder{opacity:0}.cx-explorer__folder.cdk-drag-animating,.cx-explorer__folders.cdk-drop-list-dragging .cx-explorer__folder:not(.cdk-drag-placeholder){transition:transform var(--motion-base) var(--ease-out)}.cx-explorer__row{position:relative;display:flex;width:100%;min-width:0;align-items:center;border-radius:var(--radius-md)}.cx-explorer__row:hover{background:var(--opacity-mid)}.cx-explorer__row-main{display:flex;min-width:0;min-height:var(--cx-explorer-row-height);flex:1 1 auto;align-items:center;gap:var(--space-sm);padding:var(--space-sm) var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;text-align:left;cursor:pointer}.cx-explorer__row:hover .cx-explorer__row-main{color:var(--ink)}.cx-explorer__row-main:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__row-main--selected{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-explorer__row--root,.cx-explorer__row--item{list-style:none}.cx-explorer__row--item .cx-explorer__row-main{min-height:var(--cx-explorer-subrow-height);padding-block:var(--space-xs)}.cx-explorer__row-icon{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);align-items:center;justify-content:center}.cx-explorer__row-icon--accent{color:var(--cx-explorer-accent, currentColor)}.cx-explorer__row--folder .cx-explorer__row-icon{color:var(--purple)}.cx-explorer__row-label{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__row-label--folder{font-weight:var(--font-weight-medium)}.cx-explorer__row-label--root{font-weight:var(--font-weight-medium)}.cx-explorer__chevron{flex:0 0 auto;color:var(--opacity-high)}.cx-explorer__row--folder .cx-explorer__row-main{padding-inline-end:calc(var(--space-xs) + var(--controller-size-small))}.cx-explorer__row--folder:has(.cx-explorer__row-actions) .cx-explorer__row-main{padding-inline-end:calc(var(--space-xs) + var(--controller-size-small) + var(--controller-size-small) + var(--space-2xs))}.cx-explorer__row--folder:has(.cx-explorer__row-actions>cx-icon-button) .cx-explorer__row-main{padding-inline-end:calc(var(--space-xs) + var(--controller-size-small) + var(--controller-size-small) + var(--controller-size-small) + var(--space-2xs) + var(--space-2xs))}.cx-explorer__row--folder .cx-explorer__chevron{position:absolute;inset-inline-end:var(--space-xs);display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;pointer-events:none}.cx-explorer__row--folder .cx-explorer__row-actions{position:absolute;inset-inline-end:calc(var(--space-xs) + var(--controller-size-small) + var(--space-2xs));z-index:1;padding-right:0}.cx-explorer__row-actions{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-2xs);padding-right:var(--space-2xs);opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-explorer__row:hover .cx-explorer__row-actions,.cx-explorer__row-actions:focus-within,.cx-explorer__row-actions:has([aria-expanded=true]){opacity:1}@media(hover: none){.cx-explorer__row-actions{opacity:1}}.cx-explorer__rename-input{min-width:0;min-height:var(--cx-explorer-subrow-height);flex:1 1 auto;margin:0;padding:var(--space-xs);border:var(--border-width) solid var(--primary);border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);font:inherit;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__rename-input:focus-visible{outline:none}.cx-explorer__items{display:grid;width:100%;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded{grid-template-rows:1fr}.cx-explorer__items-inner{display:flex;min-height:0;margin:0;padding:0 0 0 var(--cx-explorer-rail);flex-direction:column;gap:var(--cx-explorer-row-gap);list-style:none;overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded .cx-explorer__items-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-explorer__picker{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.cx-explorer__picker-swatches{display:flex;flex-wrap:wrap;gap:var(--space-2xs)}.cx-explorer__swatch{width:var(--controller-size-small);height:var(--controller-size-small);padding:0;border:var(--border-width) solid rgba(0,0,0,0);border-radius:var(--radius-pill);background:color-mix(in srgb, var(--cx-explorer-swatch) 80%, var(--surface));cursor:pointer}.cx-explorer__swatch--none{--cx-explorer-swatch: var(--ink);background:color-mix(in srgb, var(--ink) 30%, var(--surface))}.cx-explorer__swatch:hover{border-color:var(--opacity-strong)}.cx-explorer__swatch[aria-pressed=true]{border-color:var(--ink);box-shadow:inset 0 0 0 2px var(--surface)}.cx-explorer__swatch:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__picker-icons{display:grid;grid-template-columns:repeat(6, 1fr);gap:var(--space-2xs)}.cx-explorer__picker-icon{display:inline-flex;min-height:var(--controller-size-small);align-items:center;justify-content:center;padding:var(--space-2xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer}.cx-explorer__picker-icon:hover{background:var(--opacity-mid);color:var(--ink)}.cx-explorer__picker-icon[aria-pressed=true]{background:var(--opacity-low);color:var(--cx-explorer-accent, var(--ink))}.cx-explorer__picker-icon:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-explorer__items,.cx-explorer__items-inner,.cx-explorer__skeleton-row,.cx-explorer__row-actions{transition:none;animation:none}}@keyframes cx-explorer-skeleton{0%{background-position:100% 0}100%{background-position:-80% 0}}"], dependencies: [{ kind: "directive", type: CdkDrag, selector: "[cdkDrag]", inputs: ["cdkDragData", "cdkDragLockAxis", "cdkDragRootElement", "cdkDragBoundary", "cdkDragStartDelay", "cdkDragFreeDragPosition", "cdkDragDisabled", "cdkDragConstrainPosition", "cdkDragPreviewClass", "cdkDragPreviewContainer", "cdkDragScale"], outputs: ["cdkDragStarted", "cdkDragReleased", "cdkDragEnded", "cdkDragEntered", "cdkDragExited", "cdkDragDropped", "cdkDragMoved"], exportAs: ["cdkDrag"] }, { kind: "directive", type: CdkDragHandle, selector: "[cdkDragHandle]", inputs: ["cdkDragHandleDisabled"] }, { kind: "directive", type: CdkDropList, selector: "[cdkDropList], cdk-drop-list", inputs: ["cdkDropListConnectedTo", "cdkDropListData", "cdkDropListOrientation", "id", "cdkDropListLockAxis", "cdkDropListDisabled", "cdkDropListSortingDisabled", "cdkDropListEnterPredicate", "cdkDropListSortPredicate", "cdkDropListAutoScrollDisabled", "cdkDropListAutoScrollStep", "cdkDropListElementContainer", "cdkDropListHasAnchor"], outputs: ["cdkDropListDropped", "cdkDropListEntered", "cdkDropListExited", "cdkDropListSorted"], exportAs: ["cdkDropList"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSearchFieldComponent, selector: "cx-search-field", inputs: ["label", "ariaLabel", "hint", "optional", "disabled", "loading", "clearable", "size", "validation", "value"], outputs: ["valueChange", "focusChange"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxExplorerComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-explorer", imports: [
                        CdkDrag,
                        CdkDragHandle,
                        CdkDropList,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxSearchFieldComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxPopoverComponent,
                        CxTooltipDirective,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<aside\n  #explorerSurface\n  class=\"cx-explorer\"\n  [class.cx-explorer--resizable]=\"resizable\"\n  [attr.aria-label]=\"ariaLabel\"\n>\n  @if (resizable) {\n    <div\n      class=\"cx-explorer__resize-handle\"\n      [class.cx-explorer__resize-handle--active]=\"resizing()\"\n      role=\"separator\"\n      tabindex=\"0\"\n      aria-orientation=\"vertical\"\n      [attr.aria-label]=\"resolvedResizeAriaLabel\"\n      [attr.aria-valuenow]=\"renderedWidthPx\"\n      [attr.aria-valuetext]=\"renderedWidthPx + ' pixels'\"\n      (pointerdown)=\"onResizePointerDown($event)\"\n      (pointermove)=\"onResizePointerMove($event)\"\n      (pointerup)=\"onResizePointerUp($event)\"\n      (pointercancel)=\"onResizePointerCancel($event)\"\n      (lostpointercapture)=\"onResizeLostPointerCapture($event)\"\n      (keydown)=\"onResizeKeydown($event)\"\n      (dblclick)=\"onResizeDoubleClick($event)\"\n    ></div>\n  }\n\n  <div class=\"cx-explorer__header\">\n    <ng-content select=\"[header]\" />\n    @if (editable) {\n      <cx-icon-button\n        class=\"cx-explorer__new-folder\"\n        icon=\"plus\"\n        ariaLabel=\"New folder\"\n        cxTooltip=\"New folder\"\n        (pressed)=\"onFolderCreate()\"\n      />\n    }\n  </div>\n\n  @if (searchable) {\n    <cx-search-field\n      class=\"cx-explorer__search\"\n      label=\"\"\n      [ariaLabel]=\"searchAriaLabel\"\n      [clearable]=\"true\"\n      [value]=\"searchValue\"\n      (valueChange)=\"searchValueChange.emit($event)\"\n    />\n  }\n\n  @if (loading) {\n    <div class=\"cx-explorer__skeleton\" aria-hidden=\"true\">\n      @for (row of skeletonRows; track row) {\n        <span class=\"cx-explorer__skeleton-row\"></span>\n      }\n    </div>\n  } @else if (hasContent()) {\n    <div #explorerContent class=\"cx-explorer__content\">\n      @if (rootItems$().length > 0) {\n        <ul class=\"cx-explorer__root-items\">\n          @for (item of rootItems$(); track item.id) {\n            <li\n              class=\"cx-explorer__row cx-explorer__row--root\"\n              [style.--cx-explorer-accent]=\"itemAccent(item)\"\n            >\n              <button\n                class=\"cx-explorer__row-main\"\n                type=\"button\"\n                [class.cx-explorer__row-main--selected]=\"isSelected(item)\"\n                [attr.aria-current]=\"isSelected(item) ? 'true' : null\"\n                (click)=\"onItemPressed(item)\"\n              >\n                <span\n                  class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\"\n                  aria-hidden=\"true\"\n                >\n                  <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                </span>\n                <span\n                  class=\"cx-explorer__row-label cx-explorer__row-label--root\"\n                  >{{ item.name }}</span\n                >\n              </button>\n            </li>\n          }\n        </ul>\n      }\n\n      @if (hasFolders()) {\n        <div\n          class=\"cx-explorer__folders\"\n          cdkDropList\n          cdkDropListLockAxis=\"y\"\n          [cdkDropListData]=\"folders$()\"\n          (cdkDropListDropped)=\"onFolderDrop($event)\"\n        >\n          @for (folder of folders$(); track folder.id) {\n            <section\n              class=\"cx-explorer__folder\"\n              cdkDrag\n              [cdkDragData]=\"folder\"\n              [cdkDragDisabled]=\"!editable || isRenaming('folder', folder.id)\"\n            >\n              <div\n                class=\"cx-explorer__row cx-explorer__row--folder\"\n                cdkDragHandle\n              >\n                @if (isRenaming(\"folder\", folder.id)) {\n                  <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                    <cx-icon icon=\"folder\" [size]=\"16\" />\n                  </span>\n                  <input\n                    class=\"cx-explorer__rename-input\"\n                    type=\"text\"\n                    aria-label=\"Folder name\"\n                    [value]=\"folder.name\"\n                    (blur)=\"commitRename($event, 'folder', folder)\"\n                    (keydown.enter)=\"onRenameEnter($event)\"\n                    (keydown.escape)=\"cancelRename($event)\"\n                  />\n                } @else {\n                  <button\n                    class=\"cx-explorer__row-main\"\n                    type=\"button\"\n                    [attr.aria-expanded]=\"isFolderExpanded(folder)\"\n                    aria-keyshortcuts=\"Alt+ArrowUp Alt+ArrowDown\"\n                    (click)=\"toggleFolder(folder)\"\n                    (dblclick)=\"editable && beginRename('folder', folder.id)\"\n                    (keydown.alt.arrowup)=\"\n                      onFolderMoveByKeyboard($event, folder, -1)\n                    \"\n                    (keydown.alt.arrowdown)=\"\n                      onFolderMoveByKeyboard($event, folder, 1)\n                    \"\n                  >\n                    <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                      <cx-icon icon=\"folder\" [size]=\"16\" />\n                    </span>\n                    <span\n                      class=\"cx-explorer__row-label cx-explorer__row-label--folder\"\n                      >{{ folder.name }}</span\n                    >\n                    <cx-icon\n                      class=\"cx-explorer__chevron\"\n                      [icon]=\"\n                        isFolderExpanded(folder) ? 'chevron-up' : 'chevron-down'\n                      \"\n                      [size]=\"16\"\n                    />\n                  </button>\n                  @if (editable || hasFolderMenu()) {\n                    <div class=\"cx-explorer__row-actions\">\n                      @if (editable) {\n                        <cx-icon-button\n                          icon=\"plus\"\n                          size=\"small\"\n                          variant=\"transparent\"\n                          [ariaLabel]=\"createItemText\"\n                          [cxTooltip]=\"createItemText\"\n                          (pressed)=\"onCreateItem(folder)\"\n                        />\n                      }\n                      @if (hasFolderMenu()) {\n                        <cx-menu\n                          [presentation]=\"{ kind: 'trigger' }\"\n                          [items]=\"folderMenu()\"\n                          ariaLabel=\"Folder actions\"\n                          (itemSelect)=\"onFolderMenuSelect(folder, $event)\"\n                        >\n                          <cx-icon-button\n                            cxMenuTrigger\n                            icon=\"menu-vertical\"\n                            size=\"small\"\n                            variant=\"transparent\"\n                            ariaLabel=\"Folder actions\"\n                          />\n                        </cx-menu>\n                      }\n                    </div>\n                  }\n                }\n              </div>\n\n              @if (folder.items.length > 0) {\n                <div\n                  class=\"cx-explorer__items\"\n                  [class.cx-explorer__items--expanded]=\"\n                    isFolderExpanded(folder)\n                  \"\n                >\n                  <ul class=\"cx-explorer__items-inner\">\n                    @for (item of folder.items; track item.id) {\n                      <li\n                        class=\"cx-explorer__row cx-explorer__row--item\"\n                        #itemRow\n                        [style.--cx-explorer-accent]=\"itemAccent(item)\"\n                      >\n                        @if (isRenaming(\"item\", item.id)) {\n                          <span\n                            class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\"\n                            aria-hidden=\"true\"\n                          >\n                            <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                          </span>\n                          <input\n                            class=\"cx-explorer__rename-input\"\n                            type=\"text\"\n                            aria-label=\"Page name\"\n                            [value]=\"item.name\"\n                            (blur)=\"commitRename($event, 'item', item)\"\n                            (keydown.enter)=\"onRenameEnter($event)\"\n                            (keydown.escape)=\"cancelRename($event)\"\n                          />\n                        } @else {\n                          <button\n                            class=\"cx-explorer__row-main\"\n                            type=\"button\"\n                            [class.cx-explorer__row-main--selected]=\"\n                              isSelected(item)\n                            \"\n                            [attr.aria-current]=\"\n                              isSelected(item) ? 'true' : null\n                            \"\n                            (click)=\"onItemPressed(item)\"\n                            (dblclick)=\"\n                              editable && beginRename('item', item.id)\n                            \"\n                          >\n                            <span\n                              class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\"\n                              aria-hidden=\"true\"\n                            >\n                              <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                            </span>\n                            <span class=\"cx-explorer__row-label\">{{\n                              item.name\n                            }}</span>\n                          </button>\n                          <div class=\"cx-explorer__row-actions\">\n                            @if (hasItemMenu()) {\n                              <cx-menu\n                                [presentation]=\"{ kind: 'trigger' }\"\n                                [items]=\"itemMenu()\"\n                                ariaLabel=\"Page actions\"\n                                (itemSelect)=\"\n                                  onItemMenuSelect(item, $event, itemRow)\n                                \"\n                              >\n                                <cx-icon-button\n                                  cxMenuTrigger\n                                  icon=\"menu-vertical\"\n                                  size=\"small\"\n                                  variant=\"transparent\"\n                                  ariaLabel=\"Page actions\"\n                                />\n                              </cx-menu>\n                            }\n                          </div>\n                        }\n                      </li>\n                    }\n                  </ul>\n                </div>\n              }\n            </section>\n          }\n        </div>\n      }\n    </div>\n  }\n</aside>\n\n@if (pickerItem(); as item) {\n  <cx-popover\n    [open]=\"true\"\n    [showBackdrop]=\"true\"\n    [width]=\"pickerWidth\"\n    [left]=\"pickerOverlay.left$()\"\n    [top]=\"pickerOverlay.top$()\"\n    [bottom]=\"pickerOverlay.bottom$()\"\n    [maxHeight]=\"pickerOverlay.maxHeight$()\"\n    [placement]=\"pickerOverlay.placement$()\"\n    role=\"dialog\"\n    ariaLabel=\"Icon & color\"\n    (backdropPressed)=\"closePicker()\"\n  >\n    <div\n      class=\"cx-explorer__picker\"\n      [style.--cx-explorer-accent]=\"itemAccent(item)\"\n    >\n      <div class=\"cx-explorer__picker-swatches\" role=\"group\" aria-label=\"Color\">\n        <button\n          class=\"cx-explorer__swatch cx-explorer__swatch--none\"\n          type=\"button\"\n          aria-label=\"No color\"\n          [attr.aria-pressed]=\"!item.color\"\n          (click)=\"onPickerColor(item, undefined)\"\n        ></button>\n        @for (color of pickerColors; track color) {\n          <button\n            class=\"cx-explorer__swatch\"\n            type=\"button\"\n            [style.--cx-explorer-swatch]=\"swatchAccent(color)\"\n            [attr.aria-label]=\"color\"\n            [attr.aria-pressed]=\"item.color === color\"\n            (click)=\"onPickerColor(item, color)\"\n          ></button>\n        }\n      </div>\n      <div class=\"cx-explorer__picker-icons\" role=\"group\" aria-label=\"Icon\">\n        @for (icon of itemIcons$(); track icon) {\n          <button\n            class=\"cx-explorer__picker-icon\"\n            type=\"button\"\n            [attr.aria-label]=\"icon\"\n            [attr.aria-pressed]=\"isPickerIconSelected(item, icon)\"\n            (click)=\"onPickerIcon(item, icon)\"\n          >\n            <cx-icon [icon]=\"icon\" [size]=\"16\" />\n          </button>\n        }\n      </div>\n    </div>\n  </cx-popover>\n}\n", styles: [":host{display:block;height:100%;min-height:0}.cx-explorer{--cx-explorer-row-height: calc( var(--controller-size-small) + var(--space-sm) * 2 );--cx-explorer-subrow-height: calc( var(--controller-size-small) + var(--space-xs) * 2 );--cx-explorer-row-gap: 1px;--cx-explorer-rail: 0;display:flex;position:relative;width:var(--cx-explorer-width, 260px);min-width:min(max(200px,var(--cx-explorer-min-width, 0px)),100%);max-width:100%;height:100%;min-height:100%;flex-direction:column;gap:var(--space-md);padding:var(--space-sm);border-right:var(--line);background:var(--surface-alt);box-sizing:border-box;overflow:visible}.cx-explorer__header{display:flex;width:100%;height:var(--controller-size);min-height:var(--controller-size);align-items:center;flex:0 0 auto}.cx-explorer__header:empty{display:none}.cx-explorer__new-folder{margin-left:auto;flex:0 0 auto}.cx-explorer__resize-handle{position:absolute;top:0;inset-inline-end:calc(-1*(var(--space-xs) + var(--border-width)));z-index:2;width:12px;height:100%;cursor:col-resize;touch-action:none}.cx-explorer__resize-handle::after{position:absolute;top:50%;inset-inline-end:var(--space-xs);width:3px;height:calc(100% - var(--space-sm)*2);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);content:\"\";transform:translateY(-50%);transition:background-color var(--motion-fast) ease}.cx-explorer__resize-handle:hover::after,.cx-explorer__resize-handle:focus-visible::after,.cx-explorer__resize-handle--active::after{background:var(--info)}.cx-explorer__resize-handle:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}.cx-explorer__search{box-sizing:border-box;width:100%;flex:0 0 auto;padding-inline-end:var(--cx-explorer-scrollbar-gutter, 0px)}.cx-explorer__skeleton{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-xs) 0}.cx-explorer__skeleton-row{display:block;height:var(--cx-explorer-row-height);border-radius:var(--radius-sm);background:linear-gradient(90deg, var(--opacity-low), var(--opacity-mid), var(--opacity-low));background-size:180% 100%;animation:cx-explorer-skeleton 1.2s ease-in-out infinite}.cx-explorer__content{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:0;overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}.cx-explorer__root-items,.cx-explorer__folders{display:flex;width:100%;margin:0;padding:0;flex-direction:column}.cx-explorer__root-items{gap:var(--cx-explorer-row-gap);list-style:none}.cx-explorer__folders{gap:0}.cx-explorer__folder{display:flex;width:100%;flex-direction:column;gap:var(--cx-explorer-row-gap)}.cx-explorer__folder.cdk-drag-preview{border-radius:var(--radius-md);background:var(--surface-alt);box-shadow:var(--shadow-mid)}.cx-explorer__folder.cdk-drag-preview .cx-explorer__items{display:none}.cx-explorer__folder.cdk-drag-placeholder{opacity:0}.cx-explorer__folder.cdk-drag-animating,.cx-explorer__folders.cdk-drop-list-dragging .cx-explorer__folder:not(.cdk-drag-placeholder){transition:transform var(--motion-base) var(--ease-out)}.cx-explorer__row{position:relative;display:flex;width:100%;min-width:0;align-items:center;border-radius:var(--radius-md)}.cx-explorer__row:hover{background:var(--opacity-mid)}.cx-explorer__row-main{display:flex;min-width:0;min-height:var(--cx-explorer-row-height);flex:1 1 auto;align-items:center;gap:var(--space-sm);padding:var(--space-sm) var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;text-align:left;cursor:pointer}.cx-explorer__row:hover .cx-explorer__row-main{color:var(--ink)}.cx-explorer__row-main:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__row-main--selected{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-explorer__row--root,.cx-explorer__row--item{list-style:none}.cx-explorer__row--item .cx-explorer__row-main{min-height:var(--cx-explorer-subrow-height);padding-block:var(--space-xs)}.cx-explorer__row-icon{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);align-items:center;justify-content:center}.cx-explorer__row-icon--accent{color:var(--cx-explorer-accent, currentColor)}.cx-explorer__row--folder .cx-explorer__row-icon{color:var(--purple)}.cx-explorer__row-label{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__row-label--folder{font-weight:var(--font-weight-medium)}.cx-explorer__row-label--root{font-weight:var(--font-weight-medium)}.cx-explorer__chevron{flex:0 0 auto;color:var(--opacity-high)}.cx-explorer__row--folder .cx-explorer__row-main{padding-inline-end:calc(var(--space-xs) + var(--controller-size-small))}.cx-explorer__row--folder:has(.cx-explorer__row-actions) .cx-explorer__row-main{padding-inline-end:calc(var(--space-xs) + var(--controller-size-small) + var(--controller-size-small) + var(--space-2xs))}.cx-explorer__row--folder:has(.cx-explorer__row-actions>cx-icon-button) .cx-explorer__row-main{padding-inline-end:calc(var(--space-xs) + var(--controller-size-small) + var(--controller-size-small) + var(--controller-size-small) + var(--space-2xs) + var(--space-2xs))}.cx-explorer__row--folder .cx-explorer__chevron{position:absolute;inset-inline-end:var(--space-xs);display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;pointer-events:none}.cx-explorer__row--folder .cx-explorer__row-actions{position:absolute;inset-inline-end:calc(var(--space-xs) + var(--controller-size-small) + var(--space-2xs));z-index:1;padding-right:0}.cx-explorer__row-actions{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-2xs);padding-right:var(--space-2xs);opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-explorer__row:hover .cx-explorer__row-actions,.cx-explorer__row-actions:focus-within,.cx-explorer__row-actions:has([aria-expanded=true]){opacity:1}@media(hover: none){.cx-explorer__row-actions{opacity:1}}.cx-explorer__rename-input{min-width:0;min-height:var(--cx-explorer-subrow-height);flex:1 1 auto;margin:0;padding:var(--space-xs);border:var(--border-width) solid var(--primary);border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);font:inherit;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__rename-input:focus-visible{outline:none}.cx-explorer__items{display:grid;width:100%;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded{grid-template-rows:1fr}.cx-explorer__items-inner{display:flex;min-height:0;margin:0;padding:0 0 0 var(--cx-explorer-rail);flex-direction:column;gap:var(--cx-explorer-row-gap);list-style:none;overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded .cx-explorer__items-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-explorer__picker{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.cx-explorer__picker-swatches{display:flex;flex-wrap:wrap;gap:var(--space-2xs)}.cx-explorer__swatch{width:var(--controller-size-small);height:var(--controller-size-small);padding:0;border:var(--border-width) solid rgba(0,0,0,0);border-radius:var(--radius-pill);background:color-mix(in srgb, var(--cx-explorer-swatch) 80%, var(--surface));cursor:pointer}.cx-explorer__swatch--none{--cx-explorer-swatch: var(--ink);background:color-mix(in srgb, var(--ink) 30%, var(--surface))}.cx-explorer__swatch:hover{border-color:var(--opacity-strong)}.cx-explorer__swatch[aria-pressed=true]{border-color:var(--ink);box-shadow:inset 0 0 0 2px var(--surface)}.cx-explorer__swatch:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__picker-icons{display:grid;grid-template-columns:repeat(6, 1fr);gap:var(--space-2xs)}.cx-explorer__picker-icon{display:inline-flex;min-height:var(--controller-size-small);align-items:center;justify-content:center;padding:var(--space-2xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer}.cx-explorer__picker-icon:hover{background:var(--opacity-mid);color:var(--ink)}.cx-explorer__picker-icon[aria-pressed=true]{background:var(--opacity-low);color:var(--cx-explorer-accent, var(--ink))}.cx-explorer__picker-icon:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-explorer__items,.cx-explorer__items-inner,.cx-explorer__skeleton-row,.cx-explorer__row-actions{transition:none;animation:none}}@keyframes cx-explorer-skeleton{0%{background-position:100% 0}100%{background-position:-80% 0}}"] }]
        }], propDecorators: { explorerSurface: [{
                type: ViewChild,
                args: ["explorerSurface", { read: ElementRef }]
            }], explorerContent: [{
                type: ViewChild,
                args: ["explorerContent", { read: ElementRef }]
            }], folders: [{
                type: Input
            }], rootItems: [{
                type: Input
            }], selectedItemId: [{
                type: Input
            }], loading: [{
                type: Input
            }], editable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], ariaLabel: [{
                type: Input
            }], width: [{
                type: Input
            }], minWidth: [{
                type: Input
            }], resizable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], searchable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], searchValue: [{
                type: Input
            }], searchAriaLabel: [{
                type: Input
            }], persistenceKey: [{
                type: Input
            }], createItemText: [{
                type: Input
            }], itemIcons: [{
                type: Input
            }], folderMenuItems: [{
                type: Input
            }], itemMenuItems: [{
                type: Input
            }], selectedItemIdChange: [{
                type: Output
            }], widthChange: [{
                type: Output
            }], searchValueChange: [{
                type: Output
            }], folderCreate: [{
                type: Output
            }], itemCreate: [{
                type: Output
            }], folderChange: [{
                type: Output
            }], folderOrderChange: [{
                type: Output
            }], itemChange: [{
                type: Output
            }], folderDelete: [{
                type: Output
            }], itemDelete: [{
                type: Output
            }], menuAction: [{
                type: Output
            }], widthVar: [{
                type: HostBinding,
                args: ["style.--cx-explorer-width"]
            }], minWidthVar: [{
                type: HostBinding,
                args: ["style.--cx-explorer-min-width"]
            }] } });
// Post-render work (focusing an element an @if just created) has to wait for
// the frame; environments without rAF fall back to a microtask.
function afterRenderFrame(work) {
    if (typeof requestAnimationFrame === "undefined") {
        queueMicrotask(work);
        return;
    }
    requestAnimationFrame(work);
}
function readExpandedFolderId(key) {
    if (!key || typeof localStorage === "undefined")
        return null;
    try {
        return localStorage.getItem(`${EXPANDED_FOLDER_STORAGE_PREFIX}${key}`);
    }
    catch {
        return null;
    }
}
function writeExpandedFolderId(key, id) {
    if (!key || typeof localStorage === "undefined")
        return;
    try {
        const storageKey = `${EXPANDED_FOLDER_STORAGE_PREFIX}${key}`;
        if (id) {
            localStorage.setItem(storageKey, id);
        }
        else {
            localStorage.removeItem(storageKey);
        }
    }
    catch {
        // Disclosure persistence is best-effort browser view state.
    }
}
function validateExplorerFolders(value) {
    if (!Array.isArray(value)) {
        throw new Error("[cx-explorer] folders must be an array.");
    }
    const folderIds = new Set();
    const itemIds = new Set();
    return value.map((folder, index) => {
        const path = `folders[${index}]`;
        const id = typeof folder?.id === "string" ? folder.id.trim() : "";
        if (!id) {
            throw new Error(`[cx-explorer] ${path} requires a non-empty id.`);
        }
        if (folderIds.has(id)) {
            throw new Error(`[cx-explorer] folder id "${id}" must be unique.`);
        }
        folderIds.add(id);
        if (typeof folder.name !== "string") {
            throw new Error(`[cx-explorer] ${path}.name must be a string.`);
        }
        if (!Array.isArray(folder.items)) {
            throw new Error(`[cx-explorer] ${path}.items must be an array.`);
        }
        const items = folder.items.map((item, itemIndex) => {
            const itemPath = `${path}.items[${itemIndex}]`;
            const itemId = typeof item?.id === "string" ? item.id.trim() : "";
            if (!itemId) {
                throw new Error(`[cx-explorer] ${itemPath} requires a non-empty id.`);
            }
            if (itemIds.has(itemId)) {
                throw new Error(`[cx-explorer] item id "${itemId}" must be unique across folders.`);
            }
            itemIds.add(itemId);
            if (typeof item.name !== "string") {
                throw new Error(`[cx-explorer] ${itemPath}.name must be a string.`);
            }
            return { ...item, id: itemId };
        });
        return { ...folder, id, items };
    });
}
function validateExplorerItems(value, inputName) {
    if (!Array.isArray(value)) {
        throw new Error(`[cx-explorer] ${inputName} must be an array.`);
    }
    const itemIds = new Set();
    return value.map((item, index) => {
        const path = `${inputName}[${index}]`;
        const id = typeof item?.id === "string" ? item.id.trim() : "";
        if (!id) {
            throw new Error(`[cx-explorer] ${path} requires a non-empty id.`);
        }
        if (itemIds.has(id)) {
            throw new Error(`[cx-explorer] item id "${id}" must be unique within ${inputName}.`);
        }
        itemIds.add(id);
        if (typeof item.name !== "string") {
            throw new Error(`[cx-explorer] ${path}.name must be a string.`);
        }
        return { ...item, id };
    });
}
function assertUniqueExplorerItemIds(rootItems, folders) {
    const rootIds = new Set(rootItems.map((item) => item.id));
    for (const folder of folders) {
        for (const item of folder.items) {
            if (rootIds.has(item.id)) {
                throw new Error(`[cx-explorer] item id "${item.id}" must be unique across rootItems and folders.`);
            }
        }
    }
}
function validateExplorerMenuItems(value, inputName) {
    if (!Array.isArray(value)) {
        throw new Error(`[cx-explorer] ${inputName} must be an array.`);
    }
    for (const item of value) {
        if (item.id.startsWith(RESERVED_MENU_PREFIX)) {
            throw new Error(`[cx-explorer] ${inputName} ids must not start with "${RESERVED_MENU_PREFIX}" — that space belongs to the built-in row actions.`);
        }
    }
    return [...value];
}
