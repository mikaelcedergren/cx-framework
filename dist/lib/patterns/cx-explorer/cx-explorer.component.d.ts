import { EventEmitter, OnDestroy } from "@angular/core";
import { type CdkDragDrop } from "@angular/cdk/drag-drop";
import { type CxIconName } from "../../icons/manifest";
import { type CxTagColor } from "../../primitives/display/cx-tag";
import { type CxMenuItem } from "../../primitives/overlay/cx-menu";
import { CxFloatingSurfaceController } from "../../primitives/overlay/floating-surface-controller";
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
    kind: "folder" | "item";
    id: string;
    actionId: string;
};
/** The complete library, kept in sync with the generated icon manifest. */
export declare const CX_EXPLORER_DEFAULT_ITEM_ICONS: readonly CxIconName[];
type CxExplorerRenameTarget = {
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
    private readonly explorerSurface?;
    private set explorerContent(value);
    private readonly rootItemsState;
    private readonly foldersState;
    private readonly selectedItemIdState;
    private readonly itemIconsState;
    private readonly folderMenuItemsState;
    private readonly itemMenuItemsState;
    private folderCreateBaseline;
    private folderCreateRenameTimer;
    private contentResizeObserver?;
    private persistenceStorageKey;
    /** One open folder at most; the untouched default is fully collapsed. */
    private readonly expandedFolderId;
    protected readonly renaming: import("@angular/core").WritableSignal<CxExplorerRenameTarget | null>;
    private pickerPopover?;
    protected readonly pickerSearch: import("@angular/core").WritableSignal<string>;
    protected readonly pickerItemId: import("@angular/core").WritableSignal<string | null>;
    protected readonly resizing: import("@angular/core").WritableSignal<boolean>;
    private readonly resizedWidth;
    private activeResizeSession?;
    protected readonly skeletonRows: string[];
    protected readonly pickerColors: readonly ["blue", "cyan", "lime", "green", "yellow", "orange", "tangerine", "red", "pink", "purple", "violet"];
    /** Measure the swatch-led content once, then keep that width while searching. */
    protected readonly pickerOverlay: CxFloatingSurfaceController;
    set folders(value: readonly CxExplorerFolder[] | null | undefined);
    /** Persistent, browse-only selections rendered above the folder hierarchy. */
    set rootItems(value: readonly CxExplorerItem[] | null | undefined);
    set selectedItemId(value: string | undefined);
    loading: boolean;
    /** Enables built-in reordering plus create, rename, restyle, and delete controls. */
    editable: boolean;
    /** Accessible name of the rail region. Name it after the content it manages. */
    ariaLabel: string;
    /** Optional width / minimum-width overrides as CSS lengths. */
    set width(value: string | null);
    get width(): string | null;
    private widthValue;
    minWidth: string | null;
    /** Lets the user drag the explorer's end edge to change its width. */
    resizable: boolean;
    /** Shows the built-in controlled collection search. */
    searchable: boolean;
    /** Current search query. The consumer filters its owned content. */
    searchValue: string;
    /** Accessible name of the built-in search field. */
    searchAriaLabel: string;
    /**
     * Stable local key used to remember the last open folder in this browser.
     * Omit it when disclosure should reset to fully collapsed on every load.
     */
    set persistenceKey(value: string | null | undefined);
    /** Label for the per-folder create action; also its tooltip. */
    createItemText: string;
    set itemIcons(value: readonly CxIconName[] | null | undefined);
    /** Extra folder menu entries, between Rename and Delete. Reported via `menuAction`. */
    set folderMenuItems(value: readonly CxMenuItem[] | null | undefined);
    /** Extra item menu entries, between Icon & color and Delete. Reported via `menuAction`. */
    set itemMenuItems(value: readonly CxMenuItem[] | null | undefined);
    readonly selectedItemIdChange: EventEmitter<string>;
    /** Emits the rendered width as a px length after a user resize settles. */
    readonly widthChange: EventEmitter<string>;
    readonly searchValueChange: EventEmitter<string>;
    readonly folderCreate: EventEmitter<void>;
    /** Create an item inside the folder with this id. */
    readonly itemCreate: EventEmitter<string>;
    readonly folderChange: EventEmitter<CxExplorerFolderChange>;
    /** Controlled folder order after a drag completes. */
    readonly folderOrderChange: EventEmitter<readonly string[]>;
    /** The item's icon or color changed; emits the updated item. */
    readonly itemChange: EventEmitter<CxExplorerItem>;
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    readonly folderDelete: EventEmitter<string>;
    /** Delete intent only — the consumer owns confirmation and the actual removal. */
    readonly itemDelete: EventEmitter<string>;
    readonly menuAction: EventEmitter<CxExplorerMenuAction>;
    protected readonly rootItems$: import("@angular/core").Signal<readonly CxExplorerItem[]>;
    protected readonly folders$: import("@angular/core").Signal<readonly CxExplorerFolder[]>;
    protected readonly selectedItemId$: import("@angular/core").Signal<string | undefined>;
    protected readonly filteredPickerIcons: import("@angular/core").Signal<CxIconName[]>;
    get widthVar(): string | null;
    get minWidthVar(): string | null;
    /** The item the icon & color editor is open for; closes when the item disappears. */
    protected readonly pickerItem: import("@angular/core").Signal<CxExplorerItem | null>;
    ngOnDestroy(): void;
    protected get resolvedResizeAriaLabel(): string;
    protected get renderedWidthPx(): number;
    protected onResizePointerDown(event: PointerEvent): void;
    protected onResizePointerMove(event: PointerEvent): void;
    protected onResizePointerUp(event: PointerEvent): void;
    protected onResizePointerCancel(event: PointerEvent): void;
    protected onResizeLostPointerCapture(event: PointerEvent): void;
    protected onResizeKeydown(event: KeyboardEvent): void;
    protected onResizeDoubleClick(event: MouseEvent): void;
    private finishResizeSession;
    private stopResizeSession;
    private emitRenderedWidthAfterLayout;
    protected hasContent(): boolean;
    protected hasFolders(): boolean;
    protected isFolderExpanded(folder: CxExplorerFolder): boolean;
    protected toggleFolder(folder: CxExplorerFolder): void;
    protected onFolderDrop(event: CdkDragDrop<readonly CxExplorerFolder[]>): void;
    protected onFolderMoveByKeyboard(event: Event, folder: CxExplorerFolder, offset: -1 | 1): void;
    protected isSelected(item: CxExplorerItem): boolean;
    protected onItemPressed(item: CxExplorerItem): void;
    protected onFolderCreate(): void;
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
    protected isRenaming(id: string): boolean;
    protected beginRename(id: string): void;
    protected commitRename(event: Event, current: {
        id: string;
        name: string;
    }): void;
    protected cancelRename(event: Event): void;
    protected onRenameEnter(event: Event): void;
    private clearFolderCreateRequest;
    protected openPicker(item: CxExplorerItem, row: HTMLElement): void;
    protected closePicker(): void;
    protected isPickerIconSelected(item: CxExplorerItem, icon: CxIconName): boolean;
    protected onPickerColor(item: CxExplorerItem, color: CxTagColor | undefined): void;
    protected onPickerReset(item: CxExplorerItem): void;
    private focusPickerSearch;
    protected onPickerIcon(item: CxExplorerItem, icon: CxIconName): void;
    protected onCreateItem(folder: CxExplorerFolder): void;
    private findItem;
    private setExpandedFolder;
    private reconcileExpandedFolder;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxExplorerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxExplorerComponent, "cx-explorer", never, { "folders": { "alias": "folders"; "required": false; }; "rootItems": { "alias": "rootItems"; "required": false; }; "selectedItemId": { "alias": "selectedItemId"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "editable": { "alias": "editable"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "width": { "alias": "width"; "required": false; }; "minWidth": { "alias": "minWidth"; "required": false; }; "resizable": { "alias": "resizable"; "required": false; }; "searchable": { "alias": "searchable"; "required": false; }; "searchValue": { "alias": "searchValue"; "required": false; }; "searchAriaLabel": { "alias": "searchAriaLabel"; "required": false; }; "persistenceKey": { "alias": "persistenceKey"; "required": false; }; "createItemText": { "alias": "createItemText"; "required": false; }; "itemIcons": { "alias": "itemIcons"; "required": false; }; "folderMenuItems": { "alias": "folderMenuItems"; "required": false; }; "itemMenuItems": { "alias": "itemMenuItems"; "required": false; }; }, { "selectedItemIdChange": "selectedItemIdChange"; "widthChange": "widthChange"; "searchValueChange": "searchValueChange"; "folderCreate": "folderCreate"; "itemCreate": "itemCreate"; "folderChange": "folderChange"; "folderOrderChange": "folderOrderChange"; "itemChange": "itemChange"; "folderDelete": "folderDelete"; "itemDelete": "itemDelete"; "menuAction": "menuAction"; }, never, ["[header]"], true, never>;
    static ngAcceptInputType_editable: unknown;
    static ngAcceptInputType_resizable: unknown;
    static ngAcceptInputType_searchable: unknown;
}
export {};
//# sourceMappingURL=cx-explorer.component.d.ts.map