import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, computed, inject, signal, } from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CX_TAG_COLOR_PICKER_OPTIONS } from '../../primitives/display/cx-tag/index.js';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxMenuComponent, CxMenuTriggerDirective, } from '../../primitives/overlay/cx-menu/index.js';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import { CxFloatingSurfaceController } from '../../primitives/overlay/floating-surface-controller.js';
import * as i0 from "@angular/core";
/**
 * Built-in row actions own this id space so consumer-added menu entries can
 * never collide with them.
 */
const RESERVED_MENU_PREFIX = 'cx-explorer:';
const MENU_RENAME = `${RESERVED_MENU_PREFIX}rename`;
const MENU_STYLE = `${RESERVED_MENU_PREFIX}style`;
const MENU_DELETE = `${RESERVED_MENU_PREFIX}delete`;
const DEFAULT_ITEM_ICON = 'document';
const PICKER_WIDTH = 272;
const PICKER_ESTIMATED_HEIGHT = 332;
/**
 * The icon vocabulary offered by the built-in icon & color editor: friendly,
 * content-shaped identities rather than the full product icon manifest.
 * Consumers with a different vocabulary pass `itemIcons`.
 */
export const CX_EXPLORER_DEFAULT_ITEM_ICONS = [
    'note',
    'document',
    'documents',
    'books',
    'bookmark',
    'star',
    'heart',
    'flag',
    'bolt',
    'award',
    'calendar',
    'camera',
    'cash',
    'chat',
    'check-square',
    'cloud',
    'envelope',
    'image',
    'link',
    'list-bullets',
    'lock',
    'package',
    'phone',
    'pin',
    'play',
    'radar',
    'robot',
    'schedule',
    'shield',
    'statistics',
    'tag',
    'terminal',
    'time',
    'trend-up',
    'user',
    'workflow',
];
/**
 * Content rail for browsing and managing one-level collections of user
 * content: folders hold items. Editable explorers expose mutation controls;
 * browse-only explorers preserve hierarchy and selection without them. Unlike
 * `cx-side-nav` it navigates nothing — the consumer owns persisted effects.
 */
export class CxExplorerComponent {
    host = inject(ElementRef);
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
    /** Folders the user explicitly closed; everything else stays open. */
    collapsedFolders = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "collapsedFolders" }] : /* istanbul ignore next */ []));
    renaming = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renaming" }] : /* istanbul ignore next */ []));
    pickerItemId = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pickerItemId" }] : /* istanbul ignore next */ []));
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
        align: 'end',
        gap: 6,
    }));
    set folders(value) {
        this.foldersState.set(validateExplorerFolders(value ?? []));
    }
    set selectedItemId(value) {
        const id = value?.trim() || undefined;
        this.selectedItemIdState.set(id);
        if (id) {
            this.revealItem(id);
        }
    }
    loading = false;
    /** Enables the built-in create, rename, restyle, and delete controls. */
    editable = true;
    /** Accessible name of the rail region. Name it after the content it manages. */
    ariaLabel = 'Explorer';
    /** Label for the per-folder create action; also its tooltip. */
    createItemText = 'New page';
    set itemIcons(value) {
        if (value !== null && value !== undefined && !Array.isArray(value)) {
            throw new Error('[cx-explorer] itemIcons must be an array of icon names.');
        }
        const icons = value ?? [];
        this.itemIconsState.set(icons.length > 0 ? [...icons] : CX_EXPLORER_DEFAULT_ITEM_ICONS);
    }
    /** Extra folder menu entries, between Rename and Delete. Reported via `menuAction`. */
    set folderMenuItems(value) {
        this.folderMenuItemsState.set(validateExplorerMenuItems(value ?? [], 'folderMenuItems'));
    }
    /** Extra item menu entries, between Icon & color and Delete. Reported via `menuAction`. */
    set itemMenuItems(value) {
        this.itemMenuItemsState.set(validateExplorerMenuItems(value ?? [], 'itemMenuItems'));
    }
    selectedItemIdChange = new EventEmitter();
    folderCreate = new EventEmitter();
    /** Create an item inside the folder with this id. */
    itemCreate = new EventEmitter();
    folderChange = new EventEmitter();
    /** The item's identity changed (rename or icon & color); emits the updated item. */
    itemChange = new EventEmitter();
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    folderDelete = new EventEmitter();
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    itemDelete = new EventEmitter();
    menuAction = new EventEmitter();
    folders$ = this.foldersState.asReadonly();
    selectedItemId$ = this.selectedItemIdState.asReadonly();
    itemIcons$ = this.itemIconsState.asReadonly();
    /** The item the icon & color editor is open for; closes when the item disappears. */
    pickerItem = computed(() => {
        const id = this.pickerItemId();
        if (!id)
            return null;
        for (const folder of this.foldersState()) {
            const item = folder.items.find(entry => entry.id === id);
            if (item)
                return item;
        }
        return null;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pickerItem" }] : /* istanbul ignore next */ []));
    ngOnDestroy() {
        this.pickerOverlay.destroy();
    }
    hasFolders() {
        return this.foldersState().length > 0;
    }
    isFolderExpanded(folder) {
        return !this.collapsedFolders()[folder.id];
    }
    toggleFolder(folder) {
        if (this.isRenaming('folder', folder.id))
            return;
        this.collapsedFolders.update(collapsed => ({
            ...collapsed,
            [folder.id]: !collapsed[folder.id],
        }));
    }
    isSelected(item) {
        return this.selectedItemIdState() === item.id;
    }
    onItemPressed(item) {
        if (this.isRenaming('item', item.id))
            return;
        this.selectedItemIdState.set(item.id);
        this.selectedItemIdChange.emit(item.id);
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
            { id: MENU_RENAME, label: 'Rename', prependIcon: 'edit' },
            ...this.folderMenuItemsState(),
            { id: MENU_DELETE, label: 'Delete', prependIcon: 'delete', danger: true, dividerBefore: true },
        ];
    }
    itemMenu() {
        if (!this.editable)
            return this.itemMenuItemsState();
        return [
            { id: MENU_RENAME, label: 'Rename', prependIcon: 'edit' },
            { id: MENU_STYLE, label: 'Icon & color', prependIcon: 'squares-rotated' },
            ...this.itemMenuItemsState(),
            { id: MENU_DELETE, label: 'Delete', prependIcon: 'delete', danger: true, dividerBefore: true },
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
            this.beginRename('folder', folder.id);
            return;
        }
        if (actionId === MENU_DELETE) {
            this.folderDelete.emit(folder.id);
            return;
        }
        this.menuAction.emit({ kind: 'folder', id: folder.id, actionId });
    }
    onItemMenuSelect(item, actionId, row) {
        if (actionId === MENU_RENAME) {
            this.beginRename('item', item.id);
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
        this.menuAction.emit({ kind: 'item', id: item.id, actionId });
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
            const input = this.host.nativeElement.querySelector('.cx-explorer__rename-input');
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
        if (kind === 'folder') {
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
    openPicker(item, row) {
        this.renaming.set(null);
        this.pickerOverlay.endSession();
        this.pickerItemId.set(item.id);
        this.pickerOverlay.sync(row);
        // Focus follows into the editor so the keyboard path continues where the
        // menu handed over; the popover restores focus on close. The surface
        // exists only after the next render pass.
        afterRenderFrame(() => {
            const surface = this.host.nativeElement.querySelector('.cx-explorer__picker');
            const target = surface?.querySelector('button[aria-pressed="true"]') ??
                surface?.querySelector('button');
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
        this.collapsedFolders.update(collapsed => ({ ...collapsed, [folder.id]: false }));
        this.itemCreate.emit(folder.id);
    }
    findItem(id) {
        for (const folder of this.foldersState()) {
            const item = folder.items.find(entry => entry.id === id);
            if (item)
                return item;
        }
        return undefined;
    }
    /** Selection always lands visible: clear an explicit close on its folder. */
    revealItem(id) {
        const folder = this.foldersState().find(entry => entry.items.some(item => item.id === id));
        if (!folder || !this.collapsedFolders()[folder.id])
            return;
        this.collapsedFolders.update(collapsed => ({ ...collapsed, [folder.id]: false }));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxExplorerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxExplorerComponent, isStandalone: true, selector: "cx-explorer", inputs: { folders: "folders", selectedItemId: "selectedItemId", loading: "loading", editable: ["editable", "editable", booleanAttribute], ariaLabel: "ariaLabel", createItemText: "createItemText", itemIcons: "itemIcons", folderMenuItems: "folderMenuItems", itemMenuItems: "itemMenuItems" }, outputs: { selectedItemIdChange: "selectedItemIdChange", folderCreate: "folderCreate", itemCreate: "itemCreate", folderChange: "folderChange", itemChange: "itemChange", folderDelete: "folderDelete", itemDelete: "itemDelete", menuAction: "menuAction" }, ngImport: i0, template: "<aside class=\"cx-explorer\" [attr.aria-label]=\"ariaLabel\">\n  <div class=\"cx-explorer__header\">\n    <ng-content select=\"[header]\" />\n  </div>\n\n  @if (loading) {\n    <div class=\"cx-explorer__skeleton\" aria-hidden=\"true\">\n      @for (row of skeletonRows; track row) {\n        <span class=\"cx-explorer__skeleton-row\"></span>\n      }\n    </div>\n  } @else if (hasFolders()) {\n    <div class=\"cx-explorer__folders\">\n      @for (folder of folders$(); track folder.id) {\n        <section class=\"cx-explorer__folder\">\n          <div class=\"cx-explorer__row cx-explorer__row--folder\">\n            @if (isRenaming('folder', folder.id)) {\n              <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                <cx-icon icon=\"folder\" [size]=\"16\" />\n              </span>\n              <input\n                class=\"cx-explorer__rename-input\"\n                type=\"text\"\n                aria-label=\"Folder name\"\n                [value]=\"folder.name\"\n                (blur)=\"commitRename($event, 'folder', folder)\"\n                (keydown.enter)=\"onRenameEnter($event)\"\n                (keydown.escape)=\"cancelRename($event)\"\n              />\n            } @else {\n              <button\n                class=\"cx-explorer__row-main\"\n                type=\"button\"\n                [attr.aria-expanded]=\"isFolderExpanded(folder)\"\n                (click)=\"toggleFolder(folder)\"\n                (dblclick)=\"editable && beginRename('folder', folder.id)\"\n              >\n                <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                  <cx-icon icon=\"folder\" [size]=\"16\" />\n                </span>\n                <span\n                  class=\"cx-explorer__row-label cx-explorer__row-label--folder\"\n                  data-cx-tooltip-overflow\n                  [cxTooltip]=\"folder.name\"\n                  [cxTooltipOverflow]=\"true\"\n                >{{ folder.name }}</span>\n                <cx-icon\n                  class=\"cx-explorer__chevron\"\n                  [icon]=\"isFolderExpanded(folder) ? 'chevron-up' : 'chevron-down'\"\n                  [size]=\"16\"\n                />\n              </button>\n              <div class=\"cx-explorer__row-actions\">\n                @if (editable) {\n                  <cx-icon-button\n                    icon=\"plus\"\n                    size=\"small\"\n                    variant=\"transparent\"\n                    [ariaLabel]=\"createItemText\"\n                    [cxTooltip]=\"createItemText\"\n                    (pressed)=\"onCreateItem(folder)\"\n                  />\n                }\n                @if (hasFolderMenu()) {\n                  <cx-menu\n                    [presentation]=\"{ kind: 'trigger' }\"\n                    [items]=\"folderMenu()\"\n                    ariaLabel=\"Folder actions\"\n                    (itemSelect)=\"onFolderMenuSelect(folder, $event)\"\n                  >\n                    <cx-icon-button\n                      cxMenuTrigger\n                      icon=\"menu-horizontal\"\n                      size=\"small\"\n                      variant=\"transparent\"\n                      ariaLabel=\"Folder actions\"\n                    />\n                  </cx-menu>\n                }\n              </div>\n            }\n          </div>\n\n          @if (folder.items.length > 0) {\n            <div\n              class=\"cx-explorer__items\"\n              [class.cx-explorer__items--expanded]=\"isFolderExpanded(folder)\"\n            >\n              <ul class=\"cx-explorer__items-inner\">\n                @for (item of folder.items; track item.id) {\n                  <li\n                    class=\"cx-explorer__row cx-explorer__row--item\"\n                    #itemRow\n                    [style.--cx-explorer-accent]=\"itemAccent(item)\"\n                  >\n                    @if (isRenaming('item', item.id)) {\n                      <span class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\" aria-hidden=\"true\">\n                        <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                      </span>\n                      <input\n                        class=\"cx-explorer__rename-input\"\n                        type=\"text\"\n                        aria-label=\"Page name\"\n                        [value]=\"item.name\"\n                        (blur)=\"commitRename($event, 'item', item)\"\n                        (keydown.enter)=\"onRenameEnter($event)\"\n                        (keydown.escape)=\"cancelRename($event)\"\n                      />\n                    } @else {\n                      <button\n                        class=\"cx-explorer__row-main\"\n                        type=\"button\"\n                        [class.cx-explorer__row-main--selected]=\"isSelected(item)\"\n                        [attr.aria-current]=\"isSelected(item) ? 'true' : null\"\n                        (click)=\"onItemPressed(item)\"\n                        (dblclick)=\"editable && beginRename('item', item.id)\"\n                      >\n                        <span class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\" aria-hidden=\"true\">\n                          <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                        </span>\n                        <span\n                          class=\"cx-explorer__row-label\"\n                          data-cx-tooltip-overflow\n                          [cxTooltip]=\"item.name\"\n                          [cxTooltipOverflow]=\"true\"\n                        >{{ item.name }}</span>\n                      </button>\n                      <div class=\"cx-explorer__row-actions\">\n                        @if (hasItemMenu()) {\n                          <cx-menu\n                            [presentation]=\"{ kind: 'trigger' }\"\n                            [items]=\"itemMenu()\"\n                            ariaLabel=\"Page actions\"\n                            (itemSelect)=\"onItemMenuSelect(item, $event, itemRow)\"\n                          >\n                            <cx-icon-button\n                              cxMenuTrigger\n                              icon=\"menu-horizontal\"\n                              size=\"small\"\n                              variant=\"transparent\"\n                              ariaLabel=\"Page actions\"\n                            />\n                          </cx-menu>\n                        }\n                      </div>\n                    }\n                  </li>\n                }\n              </ul>\n            </div>\n          }\n        </section>\n      }\n    </div>\n  }\n\n  <div class=\"cx-explorer__footer\">\n    @if (editable) {\n      <cx-button\n        class=\"cx-explorer__new-folder\"\n        text=\"New folder\"\n        icon=\"plus\"\n        [transparent]=\"true\"\n        (pressed)=\"folderCreate.emit()\"\n      />\n    }\n  </div>\n</aside>\n\n@if (pickerItem(); as item) {\n  <cx-popover\n    [open]=\"true\"\n    [showBackdrop]=\"true\"\n    [width]=\"pickerWidth\"\n    [left]=\"pickerOverlay.left$()\"\n    [top]=\"pickerOverlay.top$()\"\n    [bottom]=\"pickerOverlay.bottom$()\"\n    [maxHeight]=\"pickerOverlay.maxHeight$()\"\n    [placement]=\"pickerOverlay.placement$()\"\n    role=\"dialog\"\n    ariaLabel=\"Icon & color\"\n    (backdropPressed)=\"closePicker()\"\n  >\n    <div class=\"cx-explorer__picker\" [style.--cx-explorer-accent]=\"itemAccent(item)\">\n      <div class=\"cx-explorer__picker-swatches\" role=\"group\" aria-label=\"Color\">\n        <button\n          class=\"cx-explorer__swatch cx-explorer__swatch--none\"\n          type=\"button\"\n          aria-label=\"No color\"\n          [attr.aria-pressed]=\"!item.color\"\n          (click)=\"onPickerColor(item, undefined)\"\n        ></button>\n        @for (color of pickerColors; track color) {\n          <button\n            class=\"cx-explorer__swatch\"\n            type=\"button\"\n            [style.--cx-explorer-swatch]=\"swatchAccent(color)\"\n            [attr.aria-label]=\"color\"\n            [attr.aria-pressed]=\"item.color === color\"\n            (click)=\"onPickerColor(item, color)\"\n          ></button>\n        }\n      </div>\n      <div class=\"cx-explorer__picker-icons\" role=\"group\" aria-label=\"Icon\">\n        @for (icon of itemIcons$(); track icon) {\n          <button\n            class=\"cx-explorer__picker-icon\"\n            type=\"button\"\n            [attr.aria-label]=\"icon\"\n            [attr.aria-pressed]=\"isPickerIconSelected(item, icon)\"\n            (click)=\"onPickerIcon(item, icon)\"\n          >\n            <cx-icon [icon]=\"icon\" [size]=\"16\" />\n          </button>\n        }\n      </div>\n    </div>\n  </cx-popover>\n}\n", styles: [":host{display:block;height:100%;min-height:0}.cx-explorer{--cx-explorer-row-height: calc(var(--controller-size-small) + var(--space-sm) * 2);--cx-explorer-subrow-height: calc(var(--controller-size-small) + var(--space-xs) * 2);--cx-explorer-row-gap: 1px;--cx-explorer-rail: calc(var(--controller-size-small) + var(--space-sm));display:flex;width:260px;height:100%;min-height:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-sm);border-right:var(--line);background:var(--surface-alt);box-sizing:border-box;overflow:hidden}.cx-explorer__header{display:flex;width:100%;min-height:var(--controller-size);align-items:center;flex:0 0 auto}.cx-explorer__header:empty{display:none}.cx-explorer__skeleton{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-xs) 0}.cx-explorer__skeleton-row{display:block;height:var(--cx-explorer-row-height);border-radius:var(--radius-sm);background:linear-gradient(90deg, var(--opacity-low), var(--opacity-mid), var(--opacity-low));background-size:180% 100%;animation:cx-explorer-skeleton 1.2s ease-in-out infinite}.cx-explorer__folders{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-sm);overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}.cx-explorer__folder{display:flex;width:100%;flex-direction:column;gap:var(--cx-explorer-row-gap)}.cx-explorer__row{position:relative;display:flex;width:100%;min-width:0;align-items:center;border-radius:var(--radius-md)}.cx-explorer__row:hover{background:var(--opacity-mid)}.cx-explorer__row-main{display:flex;min-width:0;min-height:var(--cx-explorer-row-height);flex:1 1 auto;align-items:center;gap:var(--space-sm);padding:var(--space-sm) var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;text-align:left;cursor:pointer}.cx-explorer__row:hover .cx-explorer__row-main{color:var(--ink)}.cx-explorer__row-main:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__row-main--selected{background:var(--opacity-low);color:var(--ink);font-weight:var(--font-weight-medium)}.cx-explorer__row--item{list-style:none}.cx-explorer__row--item .cx-explorer__row-main{min-height:var(--cx-explorer-subrow-height);padding-block:var(--space-xs)}.cx-explorer__row-icon{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);align-items:center;justify-content:center}.cx-explorer__row-icon--accent{color:var(--cx-explorer-accent, currentColor)}.cx-explorer__row--folder .cx-explorer__row-icon{color:var(--purple)}.cx-explorer__row-label{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__row-label--folder{font-weight:var(--font-weight-medium)}.cx-explorer__chevron{flex:0 0 auto;color:var(--opacity-high)}.cx-explorer__row-actions{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-2xs);padding-right:var(--space-2xs);opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-explorer__row:hover .cx-explorer__row-actions,.cx-explorer__row:focus-within .cx-explorer__row-actions,.cx-explorer__row-actions:has([aria-expanded=true]){opacity:1}@media(hover: none){.cx-explorer__row-actions{opacity:1}}.cx-explorer__rename-input{min-width:0;min-height:var(--cx-explorer-subrow-height);flex:1 1 auto;margin:0;padding:var(--space-xs);border:var(--border-width) solid var(--primary);border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);font:inherit;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__rename-input:focus-visible{outline:none}.cx-explorer__items{display:grid;width:100%;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded{grid-template-rows:1fr}.cx-explorer__items-inner{display:flex;min-height:0;margin:0;padding:0 0 0 var(--cx-explorer-rail);flex-direction:column;gap:var(--cx-explorer-row-gap);list-style:none;overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded .cx-explorer__items-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-explorer__footer{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:var(--space-xs);padding-top:var(--space-xs);border-top:var(--line-discreet);flex:0 0 auto;box-sizing:border-box}.cx-explorer__picker{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.cx-explorer__picker-swatches{display:flex;flex-wrap:wrap;gap:var(--space-2xs)}.cx-explorer__swatch{width:var(--controller-size-small);height:var(--controller-size-small);padding:0;border:var(--border-width) solid rgba(0,0,0,0);border-radius:var(--radius-pill);background:color-mix(in srgb, var(--cx-explorer-swatch) 80%, var(--surface));cursor:pointer}.cx-explorer__swatch--none{--cx-explorer-swatch: var(--ink);background:color-mix(in srgb, var(--ink) 30%, var(--surface))}.cx-explorer__swatch:hover{border-color:var(--opacity-strong)}.cx-explorer__swatch[aria-pressed=true]{border-color:var(--ink);box-shadow:inset 0 0 0 2px var(--surface)}.cx-explorer__swatch:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__picker-icons{display:grid;grid-template-columns:repeat(6, 1fr);gap:var(--space-2xs)}.cx-explorer__picker-icon{display:inline-flex;min-height:var(--controller-size-small);align-items:center;justify-content:center;padding:var(--space-2xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer}.cx-explorer__picker-icon:hover{background:var(--opacity-mid);color:var(--ink)}.cx-explorer__picker-icon[aria-pressed=true]{background:var(--opacity-low);color:var(--cx-explorer-accent, var(--ink))}.cx-explorer__picker-icon:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-explorer__items,.cx-explorer__items-inner,.cx-explorer__skeleton-row,.cx-explorer__row-actions{transition:none;animation:none}}@keyframes cx-explorer-skeleton{0%{background-position:100% 0}100%{background-position:-80% 0}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxExplorerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-explorer', imports: [
                        CxButtonComponent,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxPopoverComponent,
                        CxTooltipDirective,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<aside class=\"cx-explorer\" [attr.aria-label]=\"ariaLabel\">\n  <div class=\"cx-explorer__header\">\n    <ng-content select=\"[header]\" />\n  </div>\n\n  @if (loading) {\n    <div class=\"cx-explorer__skeleton\" aria-hidden=\"true\">\n      @for (row of skeletonRows; track row) {\n        <span class=\"cx-explorer__skeleton-row\"></span>\n      }\n    </div>\n  } @else if (hasFolders()) {\n    <div class=\"cx-explorer__folders\">\n      @for (folder of folders$(); track folder.id) {\n        <section class=\"cx-explorer__folder\">\n          <div class=\"cx-explorer__row cx-explorer__row--folder\">\n            @if (isRenaming('folder', folder.id)) {\n              <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                <cx-icon icon=\"folder\" [size]=\"16\" />\n              </span>\n              <input\n                class=\"cx-explorer__rename-input\"\n                type=\"text\"\n                aria-label=\"Folder name\"\n                [value]=\"folder.name\"\n                (blur)=\"commitRename($event, 'folder', folder)\"\n                (keydown.enter)=\"onRenameEnter($event)\"\n                (keydown.escape)=\"cancelRename($event)\"\n              />\n            } @else {\n              <button\n                class=\"cx-explorer__row-main\"\n                type=\"button\"\n                [attr.aria-expanded]=\"isFolderExpanded(folder)\"\n                (click)=\"toggleFolder(folder)\"\n                (dblclick)=\"editable && beginRename('folder', folder.id)\"\n              >\n                <span class=\"cx-explorer__row-icon\" aria-hidden=\"true\">\n                  <cx-icon icon=\"folder\" [size]=\"16\" />\n                </span>\n                <span\n                  class=\"cx-explorer__row-label cx-explorer__row-label--folder\"\n                  data-cx-tooltip-overflow\n                  [cxTooltip]=\"folder.name\"\n                  [cxTooltipOverflow]=\"true\"\n                >{{ folder.name }}</span>\n                <cx-icon\n                  class=\"cx-explorer__chevron\"\n                  [icon]=\"isFolderExpanded(folder) ? 'chevron-up' : 'chevron-down'\"\n                  [size]=\"16\"\n                />\n              </button>\n              <div class=\"cx-explorer__row-actions\">\n                @if (editable) {\n                  <cx-icon-button\n                    icon=\"plus\"\n                    size=\"small\"\n                    variant=\"transparent\"\n                    [ariaLabel]=\"createItemText\"\n                    [cxTooltip]=\"createItemText\"\n                    (pressed)=\"onCreateItem(folder)\"\n                  />\n                }\n                @if (hasFolderMenu()) {\n                  <cx-menu\n                    [presentation]=\"{ kind: 'trigger' }\"\n                    [items]=\"folderMenu()\"\n                    ariaLabel=\"Folder actions\"\n                    (itemSelect)=\"onFolderMenuSelect(folder, $event)\"\n                  >\n                    <cx-icon-button\n                      cxMenuTrigger\n                      icon=\"menu-horizontal\"\n                      size=\"small\"\n                      variant=\"transparent\"\n                      ariaLabel=\"Folder actions\"\n                    />\n                  </cx-menu>\n                }\n              </div>\n            }\n          </div>\n\n          @if (folder.items.length > 0) {\n            <div\n              class=\"cx-explorer__items\"\n              [class.cx-explorer__items--expanded]=\"isFolderExpanded(folder)\"\n            >\n              <ul class=\"cx-explorer__items-inner\">\n                @for (item of folder.items; track item.id) {\n                  <li\n                    class=\"cx-explorer__row cx-explorer__row--item\"\n                    #itemRow\n                    [style.--cx-explorer-accent]=\"itemAccent(item)\"\n                  >\n                    @if (isRenaming('item', item.id)) {\n                      <span class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\" aria-hidden=\"true\">\n                        <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                      </span>\n                      <input\n                        class=\"cx-explorer__rename-input\"\n                        type=\"text\"\n                        aria-label=\"Page name\"\n                        [value]=\"item.name\"\n                        (blur)=\"commitRename($event, 'item', item)\"\n                        (keydown.enter)=\"onRenameEnter($event)\"\n                        (keydown.escape)=\"cancelRename($event)\"\n                      />\n                    } @else {\n                      <button\n                        class=\"cx-explorer__row-main\"\n                        type=\"button\"\n                        [class.cx-explorer__row-main--selected]=\"isSelected(item)\"\n                        [attr.aria-current]=\"isSelected(item) ? 'true' : null\"\n                        (click)=\"onItemPressed(item)\"\n                        (dblclick)=\"editable && beginRename('item', item.id)\"\n                      >\n                        <span class=\"cx-explorer__row-icon cx-explorer__row-icon--accent\" aria-hidden=\"true\">\n                          <cx-icon [icon]=\"itemIcon(item)\" [size]=\"16\" />\n                        </span>\n                        <span\n                          class=\"cx-explorer__row-label\"\n                          data-cx-tooltip-overflow\n                          [cxTooltip]=\"item.name\"\n                          [cxTooltipOverflow]=\"true\"\n                        >{{ item.name }}</span>\n                      </button>\n                      <div class=\"cx-explorer__row-actions\">\n                        @if (hasItemMenu()) {\n                          <cx-menu\n                            [presentation]=\"{ kind: 'trigger' }\"\n                            [items]=\"itemMenu()\"\n                            ariaLabel=\"Page actions\"\n                            (itemSelect)=\"onItemMenuSelect(item, $event, itemRow)\"\n                          >\n                            <cx-icon-button\n                              cxMenuTrigger\n                              icon=\"menu-horizontal\"\n                              size=\"small\"\n                              variant=\"transparent\"\n                              ariaLabel=\"Page actions\"\n                            />\n                          </cx-menu>\n                        }\n                      </div>\n                    }\n                  </li>\n                }\n              </ul>\n            </div>\n          }\n        </section>\n      }\n    </div>\n  }\n\n  <div class=\"cx-explorer__footer\">\n    @if (editable) {\n      <cx-button\n        class=\"cx-explorer__new-folder\"\n        text=\"New folder\"\n        icon=\"plus\"\n        [transparent]=\"true\"\n        (pressed)=\"folderCreate.emit()\"\n      />\n    }\n  </div>\n</aside>\n\n@if (pickerItem(); as item) {\n  <cx-popover\n    [open]=\"true\"\n    [showBackdrop]=\"true\"\n    [width]=\"pickerWidth\"\n    [left]=\"pickerOverlay.left$()\"\n    [top]=\"pickerOverlay.top$()\"\n    [bottom]=\"pickerOverlay.bottom$()\"\n    [maxHeight]=\"pickerOverlay.maxHeight$()\"\n    [placement]=\"pickerOverlay.placement$()\"\n    role=\"dialog\"\n    ariaLabel=\"Icon & color\"\n    (backdropPressed)=\"closePicker()\"\n  >\n    <div class=\"cx-explorer__picker\" [style.--cx-explorer-accent]=\"itemAccent(item)\">\n      <div class=\"cx-explorer__picker-swatches\" role=\"group\" aria-label=\"Color\">\n        <button\n          class=\"cx-explorer__swatch cx-explorer__swatch--none\"\n          type=\"button\"\n          aria-label=\"No color\"\n          [attr.aria-pressed]=\"!item.color\"\n          (click)=\"onPickerColor(item, undefined)\"\n        ></button>\n        @for (color of pickerColors; track color) {\n          <button\n            class=\"cx-explorer__swatch\"\n            type=\"button\"\n            [style.--cx-explorer-swatch]=\"swatchAccent(color)\"\n            [attr.aria-label]=\"color\"\n            [attr.aria-pressed]=\"item.color === color\"\n            (click)=\"onPickerColor(item, color)\"\n          ></button>\n        }\n      </div>\n      <div class=\"cx-explorer__picker-icons\" role=\"group\" aria-label=\"Icon\">\n        @for (icon of itemIcons$(); track icon) {\n          <button\n            class=\"cx-explorer__picker-icon\"\n            type=\"button\"\n            [attr.aria-label]=\"icon\"\n            [attr.aria-pressed]=\"isPickerIconSelected(item, icon)\"\n            (click)=\"onPickerIcon(item, icon)\"\n          >\n            <cx-icon [icon]=\"icon\" [size]=\"16\" />\n          </button>\n        }\n      </div>\n    </div>\n  </cx-popover>\n}\n", styles: [":host{display:block;height:100%;min-height:0}.cx-explorer{--cx-explorer-row-height: calc(var(--controller-size-small) + var(--space-sm) * 2);--cx-explorer-subrow-height: calc(var(--controller-size-small) + var(--space-xs) * 2);--cx-explorer-row-gap: 1px;--cx-explorer-rail: calc(var(--controller-size-small) + var(--space-sm));display:flex;width:260px;height:100%;min-height:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-sm);border-right:var(--line);background:var(--surface-alt);box-sizing:border-box;overflow:hidden}.cx-explorer__header{display:flex;width:100%;min-height:var(--controller-size);align-items:center;flex:0 0 auto}.cx-explorer__header:empty{display:none}.cx-explorer__skeleton{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-xs) 0}.cx-explorer__skeleton-row{display:block;height:var(--cx-explorer-row-height);border-radius:var(--radius-sm);background:linear-gradient(90deg, var(--opacity-low), var(--opacity-mid), var(--opacity-low));background-size:180% 100%;animation:cx-explorer-skeleton 1.2s ease-in-out infinite}.cx-explorer__folders{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-sm);overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}.cx-explorer__folder{display:flex;width:100%;flex-direction:column;gap:var(--cx-explorer-row-gap)}.cx-explorer__row{position:relative;display:flex;width:100%;min-width:0;align-items:center;border-radius:var(--radius-md)}.cx-explorer__row:hover{background:var(--opacity-mid)}.cx-explorer__row-main{display:flex;min-width:0;min-height:var(--cx-explorer-row-height);flex:1 1 auto;align-items:center;gap:var(--space-sm);padding:var(--space-sm) var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;text-align:left;cursor:pointer}.cx-explorer__row:hover .cx-explorer__row-main{color:var(--ink)}.cx-explorer__row-main:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__row-main--selected{background:var(--opacity-low);color:var(--ink);font-weight:var(--font-weight-medium)}.cx-explorer__row--item{list-style:none}.cx-explorer__row--item .cx-explorer__row-main{min-height:var(--cx-explorer-subrow-height);padding-block:var(--space-xs)}.cx-explorer__row-icon{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);align-items:center;justify-content:center}.cx-explorer__row-icon--accent{color:var(--cx-explorer-accent, currentColor)}.cx-explorer__row--folder .cx-explorer__row-icon{color:var(--purple)}.cx-explorer__row-label{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__row-label--folder{font-weight:var(--font-weight-medium)}.cx-explorer__chevron{flex:0 0 auto;color:var(--opacity-high)}.cx-explorer__row-actions{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-2xs);padding-right:var(--space-2xs);opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-explorer__row:hover .cx-explorer__row-actions,.cx-explorer__row:focus-within .cx-explorer__row-actions,.cx-explorer__row-actions:has([aria-expanded=true]){opacity:1}@media(hover: none){.cx-explorer__row-actions{opacity:1}}.cx-explorer__rename-input{min-width:0;min-height:var(--cx-explorer-subrow-height);flex:1 1 auto;margin:0;padding:var(--space-xs);border:var(--border-width) solid var(--primary);border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);font:inherit;font-size:var(--font-size-body);line-height:1.2}.cx-explorer__rename-input:focus-visible{outline:none}.cx-explorer__items{display:grid;width:100%;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded{grid-template-rows:1fr}.cx-explorer__items-inner{display:flex;min-height:0;margin:0;padding:0 0 0 var(--cx-explorer-rail);flex-direction:column;gap:var(--cx-explorer-row-gap);list-style:none;overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-explorer__items--expanded .cx-explorer__items-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-explorer__footer{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:var(--space-xs);padding-top:var(--space-xs);border-top:var(--line-discreet);flex:0 0 auto;box-sizing:border-box}.cx-explorer__picker{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.cx-explorer__picker-swatches{display:flex;flex-wrap:wrap;gap:var(--space-2xs)}.cx-explorer__swatch{width:var(--controller-size-small);height:var(--controller-size-small);padding:0;border:var(--border-width) solid rgba(0,0,0,0);border-radius:var(--radius-pill);background:color-mix(in srgb, var(--cx-explorer-swatch) 80%, var(--surface));cursor:pointer}.cx-explorer__swatch--none{--cx-explorer-swatch: var(--ink);background:color-mix(in srgb, var(--ink) 30%, var(--surface))}.cx-explorer__swatch:hover{border-color:var(--opacity-strong)}.cx-explorer__swatch[aria-pressed=true]{border-color:var(--ink);box-shadow:inset 0 0 0 2px var(--surface)}.cx-explorer__swatch:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-explorer__picker-icons{display:grid;grid-template-columns:repeat(6, 1fr);gap:var(--space-2xs)}.cx-explorer__picker-icon{display:inline-flex;min-height:var(--controller-size-small);align-items:center;justify-content:center;padding:var(--space-2xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer}.cx-explorer__picker-icon:hover{background:var(--opacity-mid);color:var(--ink)}.cx-explorer__picker-icon[aria-pressed=true]{background:var(--opacity-low);color:var(--cx-explorer-accent, var(--ink))}.cx-explorer__picker-icon:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(prefers-reduced-motion: reduce){.cx-explorer__items,.cx-explorer__items-inner,.cx-explorer__skeleton-row,.cx-explorer__row-actions{transition:none;animation:none}}@keyframes cx-explorer-skeleton{0%{background-position:100% 0}100%{background-position:-80% 0}}"] }]
        }], propDecorators: { folders: [{
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
            }], folderCreate: [{
                type: Output
            }], itemCreate: [{
                type: Output
            }], folderChange: [{
                type: Output
            }], itemChange: [{
                type: Output
            }], folderDelete: [{
                type: Output
            }], itemDelete: [{
                type: Output
            }], menuAction: [{
                type: Output
            }] } });
// Post-render work (focusing an element an @if just created) has to wait for
// the frame; environments without rAF fall back to a microtask.
function afterRenderFrame(work) {
    if (typeof requestAnimationFrame === 'undefined') {
        queueMicrotask(work);
        return;
    }
    requestAnimationFrame(work);
}
function validateExplorerFolders(value) {
    if (!Array.isArray(value)) {
        throw new Error('[cx-explorer] folders must be an array.');
    }
    const folderIds = new Set();
    const itemIds = new Set();
    return value.map((folder, index) => {
        const path = `folders[${index}]`;
        const id = typeof folder?.id === 'string' ? folder.id.trim() : '';
        if (!id) {
            throw new Error(`[cx-explorer] ${path} requires a non-empty id.`);
        }
        if (folderIds.has(id)) {
            throw new Error(`[cx-explorer] folder id "${id}" must be unique.`);
        }
        folderIds.add(id);
        if (typeof folder.name !== 'string') {
            throw new Error(`[cx-explorer] ${path}.name must be a string.`);
        }
        if (!Array.isArray(folder.items)) {
            throw new Error(`[cx-explorer] ${path}.items must be an array.`);
        }
        const items = folder.items.map((item, itemIndex) => {
            const itemPath = `${path}.items[${itemIndex}]`;
            const itemId = typeof item?.id === 'string' ? item.id.trim() : '';
            if (!itemId) {
                throw new Error(`[cx-explorer] ${itemPath} requires a non-empty id.`);
            }
            if (itemIds.has(itemId)) {
                throw new Error(`[cx-explorer] item id "${itemId}" must be unique across folders.`);
            }
            itemIds.add(itemId);
            if (typeof item.name !== 'string') {
                throw new Error(`[cx-explorer] ${itemPath}.name must be a string.`);
            }
            return { ...item, id: itemId };
        });
        return { ...folder, id, items };
    });
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
