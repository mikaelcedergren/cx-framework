import { EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxTagColor } from '../../primitives/display/cx-tag';
import { type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxFloatingSurfaceController } from '../../primitives/overlay/floating-surface-controller';
import * as i0 from "@angular/core";
/** A selectable content entry. Icon and color are its visual identity. */
export interface CxExplorerItem {
    id: string;
    name: string;
    /** Identity icon; `document` when omitted. */
    icon?: CxIconName;
    /** Identity hue from the shared palette; neutral ink when omitted. */
    color?: CxTagColor;
}
/** One collapsible section of the rail. Folders always render the folder icon. */
export interface CxExplorerFolder {
    id: string;
    name: string;
    items: readonly CxExplorerItem[];
}
export type CxExplorerFolderChange = {
    id: string;
    name: string;
};
/** A consumer-added menu entry was chosen on a folder or item row. */
export type CxExplorerMenuAction = {
    kind: 'folder' | 'item';
    id: string;
    actionId: string;
};
/**
 * The icon vocabulary offered by the built-in icon & color editor: friendly,
 * content-shaped identities rather than the full product icon manifest.
 * Consumers with a different vocabulary pass `itemIcons`.
 */
export declare const CX_EXPLORER_DEFAULT_ITEM_ICONS: readonly CxIconName[];
type CxExplorerRenameTarget = {
    kind: 'folder' | 'item';
    id: string;
};
/**
 * Content rail for browsing and managing one-level collections of user
 * content: persistent root items can sit above folders, and folders hold
 * nested items. Editable explorers expose mutation controls for folders and
 * nested items; root items stay browse-only. Unlike `cx-side-nav` it navigates
 * nothing — the consumer owns persisted effects.
 */
export declare class CxExplorerComponent implements OnDestroy {
    private readonly host;
    private readonly rootItemsState;
    private readonly foldersState;
    private readonly selectedItemIdState;
    private readonly itemIconsState;
    private readonly folderMenuItemsState;
    private readonly itemMenuItemsState;
    /** Folders the user explicitly closed; everything else stays open. */
    private readonly collapsedFolders;
    protected readonly renaming: import("@angular/core").WritableSignal<CxExplorerRenameTarget | null>;
    protected readonly pickerItemId: import("@angular/core").WritableSignal<string | null>;
    protected readonly skeletonRows: string[];
    protected readonly pickerColors: readonly ["blue", "cyan", "lime", "green", "yellow", "orange", "tangerine", "red", "pink", "purple", "violet"];
    protected readonly pickerWidth = 272;
    /**
     * Fixed-size surface: the measure callback publishes the final metrics, so
     * no post-render surface pass is needed.
     */
    protected readonly pickerOverlay: CxFloatingSurfaceController;
    set folders(value: readonly CxExplorerFolder[] | null | undefined);
    /** Persistent, browse-only selections rendered above the folder hierarchy. */
    set rootItems(value: readonly CxExplorerItem[] | null | undefined);
    set selectedItemId(value: string | undefined);
    loading: boolean;
    /** Enables the built-in create, rename, restyle, and delete controls. */
    editable: boolean;
    /** Accessible name of the rail region. Name it after the content it manages. */
    ariaLabel: string;
    /** Label for the per-folder create action; also its tooltip. */
    createItemText: string;
    set itemIcons(value: readonly CxIconName[] | null | undefined);
    /** Extra folder menu entries, between Rename and Delete. Reported via `menuAction`. */
    set folderMenuItems(value: readonly CxMenuItem[] | null | undefined);
    /** Extra item menu entries, between Icon & color and Delete. Reported via `menuAction`. */
    set itemMenuItems(value: readonly CxMenuItem[] | null | undefined);
    readonly selectedItemIdChange: EventEmitter<string>;
    readonly folderCreate: EventEmitter<void>;
    /** Create an item inside the folder with this id. */
    readonly itemCreate: EventEmitter<string>;
    readonly folderChange: EventEmitter<CxExplorerFolderChange>;
    /** The item's identity changed (rename or icon & color); emits the updated item. */
    readonly itemChange: EventEmitter<CxExplorerItem>;
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    readonly folderDelete: EventEmitter<string>;
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    readonly itemDelete: EventEmitter<string>;
    readonly menuAction: EventEmitter<CxExplorerMenuAction>;
    protected readonly rootItems$: import("@angular/core").Signal<readonly CxExplorerItem[]>;
    protected readonly folders$: import("@angular/core").Signal<readonly CxExplorerFolder[]>;
    protected readonly selectedItemId$: import("@angular/core").Signal<string | undefined>;
    protected readonly itemIcons$: import("@angular/core").Signal<readonly CxIconName[]>;
    /** The item the icon & color editor is open for; closes when the item disappears. */
    protected readonly pickerItem: import("@angular/core").Signal<CxExplorerItem | null>;
    ngOnDestroy(): void;
    protected hasContent(): boolean;
    protected hasFolders(): boolean;
    protected isFolderExpanded(folder: CxExplorerFolder): boolean;
    protected toggleFolder(folder: CxExplorerFolder): void;
    protected isSelected(item: CxExplorerItem): boolean;
    protected onItemPressed(item: CxExplorerItem): void;
    protected itemIcon(item: CxExplorerItem): CxIconName;
    /**
     * Hue as a CSS custom property so the stylesheet owns how the accent is
     * applied. The color union is closed, so the var name is always a real token.
     */
    protected itemAccent(item: CxExplorerItem): string | null;
    protected swatchAccent(color: CxTagColor): string;
    protected folderMenu(): readonly CxMenuItem[];
    protected itemMenu(): readonly CxMenuItem[];
    protected hasFolderMenu(): boolean;
    protected hasItemMenu(): boolean;
    protected onFolderMenuSelect(folder: CxExplorerFolder, actionId: string): void;
    protected onItemMenuSelect(item: CxExplorerItem, actionId: string, row: HTMLElement): void;
    protected isRenaming(kind: 'folder' | 'item', id: string): boolean;
    protected beginRename(kind: 'folder' | 'item', id: string): void;
    protected commitRename(event: Event, kind: 'folder' | 'item', current: {
        id: string;
        name: string;
    }): void;
    protected cancelRename(event: Event): void;
    protected onRenameEnter(event: Event): void;
    protected openPicker(item: CxExplorerItem, row: HTMLElement): void;
    protected closePicker(): void;
    protected isPickerIconSelected(item: CxExplorerItem, icon: CxIconName): boolean;
    protected onPickerColor(item: CxExplorerItem, color: CxTagColor | undefined): void;
    protected onPickerIcon(item: CxExplorerItem, icon: CxIconName): void;
    protected onCreateItem(folder: CxExplorerFolder): void;
    private findItem;
    /** Selection always lands visible: clear an explicit close on its folder. */
    private revealItem;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxExplorerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxExplorerComponent, "cx-explorer", never, { "folders": { "alias": "folders"; "required": false; }; "rootItems": { "alias": "rootItems"; "required": false; }; "selectedItemId": { "alias": "selectedItemId"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "editable": { "alias": "editable"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "createItemText": { "alias": "createItemText"; "required": false; }; "itemIcons": { "alias": "itemIcons"; "required": false; }; "folderMenuItems": { "alias": "folderMenuItems"; "required": false; }; "itemMenuItems": { "alias": "itemMenuItems"; "required": false; }; }, { "selectedItemIdChange": "selectedItemIdChange"; "folderCreate": "folderCreate"; "itemCreate": "itemCreate"; "folderChange": "folderChange"; "itemChange": "itemChange"; "folderDelete": "folderDelete"; "itemDelete": "itemDelete"; "menuAction": "menuAction"; }, never, ["[header]"], true, never>;
    static ngAcceptInputType_editable: unknown;
}
export {};
//# sourceMappingURL=cx-explorer.component.d.ts.map