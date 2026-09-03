import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  type CdkDragDrop,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { type CxIconName } from "../../icons/manifest";
import { CxIconButtonComponent } from "../../primitives/actions/cx-icon-button";
import {
  CX_TAG_COLOR_PICKER_OPTIONS,
  type CxTagColor,
} from "../../primitives/display/cx-tag";
import { CxSearchFieldComponent } from "../../primitives/inputs/cx-search-field";
import { CxIconComponent } from "../../primitives/media/cx-icon";
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
} from "../../primitives/overlay/cx-menu";
import { CxPopoverComponent } from "../../primitives/overlay/cx-popover";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip";
import { CxFloatingSurfaceController } from "../../primitives/overlay/floating-surface-controller";

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

export type CxExplorerFolderChange = { id: string; name: string };

/** A consumer-added menu entry was chosen on a folder or item row. */
export type CxExplorerMenuAction = {
  kind: "folder" | "item";
  id: string;
  actionId: string;
};

/**
 * Built-in row actions own this id space so consumer-added menu entries can
 * never collide with them.
 */
const RESERVED_MENU_PREFIX = "cx-explorer:";
const MENU_RENAME = `${RESERVED_MENU_PREFIX}rename`;
const MENU_STYLE = `${RESERVED_MENU_PREFIX}style`;
const MENU_DELETE = `${RESERVED_MENU_PREFIX}delete`;

const DEFAULT_ITEM_ICON: CxIconName = "document";
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
export const CX_EXPLORER_DEFAULT_ITEM_ICONS: readonly CxIconName[] = [
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

type CxExplorerRenameTarget = { kind: "folder" | "item"; id: string };

/**
 * Content rail for browsing and managing one-level collections of user
 * content: persistent root items can sit above folders, and folders hold
 * nested items. Editable explorers expose mutation controls for folders and
 * nested items; root items stay browse-only. Unlike `cx-side-nav` it navigates
 * nothing — the consumer owns persisted effects.
 */
@Component({
  selector: "cx-explorer",
  imports: [
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
  ],
  templateUrl: "./cx-explorer.component.html",
  styleUrl: "./cx-explorer.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxExplorerComponent implements OnDestroy {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  @ViewChild("explorerSurface", { read: ElementRef })
  private readonly explorerSurface?: ElementRef<HTMLElement>;

  private readonly rootItemsState = signal<readonly CxExplorerItem[]>([]);
  private readonly foldersState = signal<readonly CxExplorerFolder[]>([]);
  private readonly selectedItemIdState = signal<string | undefined>(undefined);
  private readonly itemIconsState = signal<readonly CxIconName[]>(
    CX_EXPLORER_DEFAULT_ITEM_ICONS,
  );
  private readonly folderMenuItemsState = signal<readonly CxMenuItem[]>([]);
  private readonly itemMenuItemsState = signal<readonly CxMenuItem[]>([]);
  private folderCreateBaseline: ReadonlySet<string> | null = null;
  private folderCreateRenameTimer: ReturnType<typeof setTimeout> | undefined;
  private persistenceStorageKey = "";
  /** One open folder at most; the untouched default is fully collapsed. */
  private readonly expandedFolderId = signal<string | null>(null);

  protected readonly renaming = signal<CxExplorerRenameTarget | null>(null);
  protected readonly pickerItemId = signal<string | null>(null);
  protected readonly resizing = signal(false);
  private readonly resizedWidth = signal<string | null>(null);
  private activeResizeSession?: {
    pointerId: number;
    handle: HTMLElement;
    startX: number;
    startWidth: number;
    rtl: boolean;
  };

  protected readonly skeletonRows = Array.from(
    { length: 7 },
    (_, index) => `skeleton-${index}`,
  );
  protected readonly pickerColors = CX_TAG_COLOR_PICKER_OPTIONS;
  protected readonly pickerWidth = PICKER_WIDTH;

  /**
   * Fixed-size surface: the measure callback publishes the final metrics, so
   * no post-render surface pass is needed.
   */
  protected readonly pickerOverlay = new CxFloatingSurfaceController(() => ({
    width: PICKER_WIDTH,
    estimatedHeight: PICKER_ESTIMATED_HEIGHT,
    align: "end",
    gap: 6,
  }));

  @Input()
  public set folders(value: readonly CxExplorerFolder[] | null | undefined) {
    const folders = validateExplorerFolders(value ?? []);
    assertUniqueExplorerItemIds(this.rootItemsState(), folders);
    this.foldersState.set(folders);
    this.reconcileExpandedFolder();
    const baseline = this.folderCreateBaseline;
    if (!baseline) return;
    const createdFolders = folders.filter((folder) => !baseline.has(folder.id));
    if (createdFolders.length !== 1) return;
    this.clearFolderCreateRequest();
    this.beginRename("folder", createdFolders[0]!.id);
  }

  /** Persistent, browse-only selections rendered above the folder hierarchy. */
  @Input()
  public set rootItems(value: readonly CxExplorerItem[] | null | undefined) {
    const rootItems = validateExplorerItems(value ?? [], "rootItems");
    assertUniqueExplorerItemIds(rootItems, this.foldersState());
    this.rootItemsState.set(rootItems);
  }

  @Input()
  public set selectedItemId(value: string | undefined) {
    const id = value?.trim() || undefined;
    this.selectedItemIdState.set(id);
  }

  @Input() loading = false;

  /** Enables built-in reordering plus create, rename, restyle, and delete controls. */
  @Input({ transform: booleanAttribute }) editable = true;

  /** Accessible name of the rail region. Name it after the content it manages. */
  @Input() ariaLabel = "Explorer";

  /** Optional width / minimum-width overrides as CSS lengths. */
  @Input()
  public set width(value: string | null) {
    this.widthValue = value;
    this.resizedWidth.set(null);
  }
  public get width(): string | null {
    return this.widthValue;
  }
  private widthValue: string | null = null;
  @Input() minWidth: string | null = null;

  /** Lets the user drag the explorer's end edge to change its width. */
  @Input({ transform: booleanAttribute }) resizable = true;

  /** Shows the built-in controlled collection search. */
  @Input({ transform: booleanAttribute }) searchable = false;

  /** Current search query. The consumer filters its owned content. */
  @Input() searchValue = "";

  /** Accessible name of the built-in search field. */
  @Input() searchAriaLabel = "Search";

  /**
   * Stable local key used to remember the last open folder in this browser.
   * Omit it when disclosure should reset to fully collapsed on every load.
   */
  @Input()
  public set persistenceKey(value: string | null | undefined) {
    const key = value?.trim() ?? "";
    if (key === this.persistenceStorageKey) return;
    this.persistenceStorageKey = key;
    this.expandedFolderId.set(readExpandedFolderId(key));
    this.reconcileExpandedFolder();
  }

  /** Label for the per-folder create action; also its tooltip. */
  @Input() createItemText = "New page";

  @Input()
  public set itemIcons(value: readonly CxIconName[] | null | undefined) {
    if (value !== null && value !== undefined && !Array.isArray(value)) {
      throw new Error(
        "[cx-explorer] itemIcons must be an array of icon names.",
      );
    }
    const icons: readonly CxIconName[] = value ?? [];
    this.itemIconsState.set(
      icons.length > 0 ? [...icons] : CX_EXPLORER_DEFAULT_ITEM_ICONS,
    );
  }

  /** Extra folder menu entries, between Rename and Delete. Reported via `menuAction`. */
  @Input()
  public set folderMenuItems(value: readonly CxMenuItem[] | null | undefined) {
    this.folderMenuItemsState.set(
      validateExplorerMenuItems(value ?? [], "folderMenuItems"),
    );
  }

  /** Extra item menu entries, between Icon & color and Delete. Reported via `menuAction`. */
  @Input()
  public set itemMenuItems(value: readonly CxMenuItem[] | null | undefined) {
    this.itemMenuItemsState.set(
      validateExplorerMenuItems(value ?? [], "itemMenuItems"),
    );
  }

  @Output() readonly selectedItemIdChange = new EventEmitter<string>();
  /** Emits the rendered width as a px length after a user resize settles. */
  @Output() readonly widthChange = new EventEmitter<string>();
  @Output() readonly searchValueChange = new EventEmitter<string>();
  @Output() readonly folderCreate = new EventEmitter<void>();
  /** Create an item inside the folder with this id. */
  @Output() readonly itemCreate = new EventEmitter<string>();
  @Output() readonly folderChange = new EventEmitter<CxExplorerFolderChange>();
  /** Controlled folder order after a drag completes. */
  @Output() readonly folderOrderChange = new EventEmitter<readonly string[]>();
  /** The item's identity changed (rename or icon & color); emits the updated item. */
  @Output() readonly itemChange = new EventEmitter<CxExplorerItem>();
  /** Delete intent only — the consumer owns confirmation and the actual removal. */
  @Output() readonly folderDelete = new EventEmitter<string>();
  /** Delete intent only — the consumer owns confirmation and the actual removal. */
  @Output() readonly itemDelete = new EventEmitter<string>();
  @Output() readonly menuAction = new EventEmitter<CxExplorerMenuAction>();

  protected readonly rootItems$ = this.rootItemsState.asReadonly();
  protected readonly folders$ = this.foldersState.asReadonly();
  protected readonly selectedItemId$ = this.selectedItemIdState.asReadonly();
  protected readonly itemIcons$ = this.itemIconsState.asReadonly();

  @HostBinding("style.--cx-explorer-width") get widthVar(): string | null {
    return this.resizedWidth() ?? this.width;
  }

  @HostBinding("style.--cx-explorer-min-width") get minWidthVar():
    string | null {
    return this.minWidth;
  }

  /** The item the icon & color editor is open for; closes when the item disappears. */
  protected readonly pickerItem = computed<CxExplorerItem | null>(() => {
    const id = this.pickerItemId();
    if (!id) return null;
    for (const folder of this.foldersState()) {
      const item = folder.items.find((entry) => entry.id === id);
      if (item) return item;
    }
    return null;
  });

  ngOnDestroy(): void {
    this.stopResizeSession();
    this.clearFolderCreateRequest();
    this.pickerOverlay.destroy();
  }

  protected get resolvedResizeAriaLabel(): string {
    const label = this.ariaLabel.trim();
    return label ? `Resize ${label}` : "Resize explorer";
  }

  protected get renderedWidthPx(): number {
    return Math.round(
      this.explorerSurface?.nativeElement.getBoundingClientRect().width ??
        EXPLORER_DEFAULT_WIDTH,
    );
  }

  protected onResizePointerDown(event: PointerEvent): void {
    const surface = this.explorerSurface?.nativeElement;
    if (!surface || !this.resizable || !event.isPrimary || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
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

  protected onResizePointerMove(event: PointerEvent): void {
    const session = this.activeResizeSession;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }
    // Explorer is anchored to the inline start, so dragging its end edge
    // outward widens it in either writing direction. CSS owns the clamping.
    const delta = (event.clientX - session.startX) * (session.rtl ? -1 : 1);
    this.resizedWidth.set(`${Math.round(session.startWidth + delta)}px`);
  }

  protected onResizePointerUp(event: PointerEvent): void {
    if (this.activeResizeSession?.pointerId === event.pointerId) {
      this.finishResizeSession();
    }
  }

  protected onResizePointerCancel(event: PointerEvent): void {
    if (this.activeResizeSession?.pointerId === event.pointerId) {
      this.finishResizeSession();
    }
  }

  protected onResizeLostPointerCapture(event: PointerEvent): void {
    if (this.activeResizeSession?.pointerId === event.pointerId) {
      this.finishResizeSession();
    }
  }

  protected onResizeKeydown(event: KeyboardEvent): void {
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
    let next: number;

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
    this.resizedWidth.set(
      `${Math.min(Math.max(Math.round(next), 0), 100000)}px`,
    );
    this.emitRenderedWidthAfterLayout();
  }

  protected onResizeDoubleClick(event: MouseEvent): void {
    if (!this.resizable) {
      return;
    }
    event.preventDefault();
    this.stopResizeSession();
    this.resizedWidth.set(`${EXPLORER_DEFAULT_WIDTH}px`);
    this.emitRenderedWidthAfterLayout();
  }

  private finishResizeSession(): void {
    this.stopResizeSession();
    this.widthChange.emit(`${this.renderedWidthPx}px`);
  }

  private stopResizeSession(): void {
    const session = this.activeResizeSession;
    this.activeResizeSession = undefined;
    if (session && session.handle.hasPointerCapture(session.pointerId)) {
      session.handle.releasePointerCapture(session.pointerId);
    }
    this.resizing.set(false);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }

  private emitRenderedWidthAfterLayout(): void {
    window.setTimeout(() => this.widthChange.emit(`${this.renderedWidthPx}px`));
  }

  protected hasContent(): boolean {
    return this.rootItemsState().length > 0 || this.foldersState().length > 0;
  }

  protected hasFolders(): boolean {
    return this.foldersState().length > 0;
  }

  protected isFolderExpanded(folder: CxExplorerFolder): boolean {
    return this.expandedFolderId() === folder.id;
  }

  protected toggleFolder(folder: CxExplorerFolder): void {
    if (this.isRenaming("folder", folder.id)) return;
    this.setExpandedFolder(this.isFolderExpanded(folder) ? null : folder.id);
  }

  protected onFolderDrop(
    event: CdkDragDrop<readonly CxExplorerFolder[]>,
  ): void {
    if (!this.editable || event.previousIndex === event.currentIndex) return;
    const ids = this.foldersState().map((folder) => folder.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.folderOrderChange.emit(ids);
  }

  protected onFolderMoveByKeyboard(
    event: Event,
    folder: CxExplorerFolder,
    offset: -1 | 1,
  ): void {
    if (!this.editable) return;
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

  protected isSelected(item: CxExplorerItem): boolean {
    return this.selectedItemIdState() === item.id;
  }

  protected onItemPressed(item: CxExplorerItem): void {
    if (this.isRenaming("item", item.id)) return;
    this.selectedItemIdState.set(item.id);
    this.selectedItemIdChange.emit(item.id);
  }

  protected onFolderCreate(): void {
    this.clearFolderCreateRequest();
    this.folderCreateBaseline = new Set(
      this.foldersState().map((folder) => folder.id),
    );
    this.folderCreateRenameTimer = setTimeout(
      () => this.clearFolderCreateRequest(),
      FOLDER_CREATE_RENAME_TIMEOUT_MS,
    );
    this.folderCreate.emit();
  }

  protected itemIcon(item: CxExplorerItem): CxIconName {
    return item.icon ?? DEFAULT_ITEM_ICON;
  }

  /**
   * Hue as a CSS custom property so the stylesheet owns how the accent is
   * applied. The color union is closed, so the var name is always a real token.
   */
  protected itemAccent(item: CxExplorerItem): string | null {
    return item.color ? `var(--${item.color})` : null;
  }

  protected swatchAccent(color: CxTagColor): string {
    return `var(--${color})`;
  }

  protected folderMenu(): readonly CxMenuItem[] {
    if (!this.editable) return this.folderMenuItemsState();
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

  protected itemMenu(): readonly CxMenuItem[] {
    if (!this.editable) return this.itemMenuItemsState();
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

  protected hasFolderMenu(): boolean {
    return this.folderMenu().length > 0;
  }

  protected hasItemMenu(): boolean {
    return this.itemMenu().length > 0;
  }

  protected onFolderMenuSelect(
    folder: CxExplorerFolder,
    actionId: string,
  ): void {
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

  protected onItemMenuSelect(
    item: CxExplorerItem,
    actionId: string,
    row: HTMLElement,
  ): void {
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

  protected isRenaming(kind: "folder" | "item", id: string): boolean {
    const target = this.renaming();
    return !!target && target.kind === kind && target.id === id;
  }

  protected beginRename(kind: "folder" | "item", id: string): void {
    if (!this.editable) return;
    this.closePicker();
    this.renaming.set({ kind, id });
    // The input exists only after the next render pass; select-all so typing
    // replaces the current name.
    afterRenderFrame(() => {
      const input = this.host.nativeElement.querySelector<HTMLInputElement>(
        ".cx-explorer__rename-input",
      );
      input?.focus();
      input?.select();
    });
  }

  protected commitRename(
    event: Event,
    kind: "folder" | "item",
    current: { id: string; name: string },
  ): void {
    if (!this.isRenaming(kind, current.id)) return;
    this.renaming.set(null);
    const name = (event.target as HTMLInputElement).value.trim();
    if (!name || name === current.name) return;
    if (kind === "folder") {
      this.folderChange.emit({ id: current.id, name });
      return;
    }
    const item = this.findItem(current.id);
    if (item) {
      this.itemChange.emit({ ...item, name });
    }
  }

  protected cancelRename(event: Event): void {
    // Keep the escape local: the rail's rename must not also dismiss an
    // overlay that happens to contain it.
    event.stopPropagation();
    this.renaming.set(null);
  }

  protected onRenameEnter(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  private clearFolderCreateRequest(): void {
    this.folderCreateBaseline = null;
    if (this.folderCreateRenameTimer) {
      clearTimeout(this.folderCreateRenameTimer);
      this.folderCreateRenameTimer = undefined;
    }
  }

  protected openPicker(item: CxExplorerItem, row: HTMLElement): void {
    this.renaming.set(null);
    this.pickerOverlay.endSession();
    this.pickerItemId.set(item.id);
    this.pickerOverlay.sync(row);
    // Focus follows into the editor so the keyboard path continues where the
    // menu handed over; the popover restores focus on close. The surface
    // exists only after the next render pass.
    afterRenderFrame(() => {
      const surface = this.host.nativeElement.querySelector<HTMLElement>(
        ".cx-explorer__picker",
      );
      const target =
        surface?.querySelector<HTMLElement>('button[aria-pressed="true"]') ??
        surface?.querySelector<HTMLElement>("button");
      target?.focus();
    });
  }

  protected closePicker(): void {
    if (this.pickerItemId() === null) return;
    this.pickerItemId.set(null);
    this.pickerOverlay.endSession();
  }

  protected isPickerIconSelected(
    item: CxExplorerItem,
    icon: CxIconName,
  ): boolean {
    return this.itemIcon(item) === icon;
  }

  protected onPickerColor(
    item: CxExplorerItem,
    color: CxTagColor | undefined,
  ): void {
    if ((item.color ?? undefined) === color) return;
    this.itemChange.emit({ ...item, color });
  }

  protected onPickerIcon(item: CxExplorerItem, icon: CxIconName): void {
    if (this.itemIcon(item) === icon) return;
    this.itemChange.emit({ ...item, icon });
  }

  protected onCreateItem(folder: CxExplorerFolder): void {
    if (!this.editable) return;
    // Creating into a closed folder must land somewhere visible.
    this.setExpandedFolder(folder.id);
    this.itemCreate.emit(folder.id);
  }

  private findItem(id: string): CxExplorerItem | undefined {
    for (const folder of this.foldersState()) {
      const item = folder.items.find((entry) => entry.id === id);
      if (item) return item;
    }
    return undefined;
  }

  private setExpandedFolder(id: string | null): void {
    this.expandedFolderId.set(id);
    writeExpandedFolderId(this.persistenceStorageKey, id);
  }

  private reconcileExpandedFolder(): void {
    const expanded = this.expandedFolderId();
    const folders = this.foldersState();
    if (
      !expanded ||
      folders.length === 0 ||
      folders.some((folder) => folder.id === expanded)
    )
      return;
    this.setExpandedFolder(null);
  }
}

// Post-render work (focusing an element an @if just created) has to wait for
// the frame; environments without rAF fall back to a microtask.
function afterRenderFrame(work: () => void): void {
  if (typeof requestAnimationFrame === "undefined") {
    queueMicrotask(work);
    return;
  }
  requestAnimationFrame(work);
}

function readExpandedFolderId(key: string): string | null {
  if (!key || typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(`${EXPANDED_FOLDER_STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function writeExpandedFolderId(key: string, id: string | null): void {
  if (!key || typeof localStorage === "undefined") return;
  try {
    const storageKey = `${EXPANDED_FOLDER_STORAGE_PREFIX}${key}`;
    if (id) {
      localStorage.setItem(storageKey, id);
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // Disclosure persistence is best-effort browser view state.
  }
}

function validateExplorerFolders(
  value: readonly CxExplorerFolder[],
): readonly CxExplorerFolder[] {
  if (!Array.isArray(value)) {
    throw new Error("[cx-explorer] folders must be an array.");
  }
  const folderIds = new Set<string>();
  const itemIds = new Set<string>();
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
    const items = folder.items.map(
      (item: CxExplorerItem, itemIndex: number) => {
        const itemPath = `${path}.items[${itemIndex}]`;
        const itemId = typeof item?.id === "string" ? item.id.trim() : "";
        if (!itemId) {
          throw new Error(`[cx-explorer] ${itemPath} requires a non-empty id.`);
        }
        if (itemIds.has(itemId)) {
          throw new Error(
            `[cx-explorer] item id "${itemId}" must be unique across folders.`,
          );
        }
        itemIds.add(itemId);
        if (typeof item.name !== "string") {
          throw new Error(`[cx-explorer] ${itemPath}.name must be a string.`);
        }
        return { ...item, id: itemId };
      },
    );
    return { ...folder, id, items };
  });
}

function validateExplorerItems(
  value: readonly CxExplorerItem[],
  inputName: string,
): readonly CxExplorerItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`[cx-explorer] ${inputName} must be an array.`);
  }
  const itemIds = new Set<string>();
  return value.map((item, index) => {
    const path = `${inputName}[${index}]`;
    const id = typeof item?.id === "string" ? item.id.trim() : "";
    if (!id) {
      throw new Error(`[cx-explorer] ${path} requires a non-empty id.`);
    }
    if (itemIds.has(id)) {
      throw new Error(
        `[cx-explorer] item id "${id}" must be unique within ${inputName}.`,
      );
    }
    itemIds.add(id);
    if (typeof item.name !== "string") {
      throw new Error(`[cx-explorer] ${path}.name must be a string.`);
    }
    return { ...item, id };
  });
}

function assertUniqueExplorerItemIds(
  rootItems: readonly CxExplorerItem[],
  folders: readonly CxExplorerFolder[],
): void {
  const rootIds = new Set(rootItems.map((item) => item.id));
  for (const folder of folders) {
    for (const item of folder.items) {
      if (rootIds.has(item.id)) {
        throw new Error(
          `[cx-explorer] item id "${item.id}" must be unique across rootItems and folders.`,
        );
      }
    }
  }
}

function validateExplorerMenuItems(
  value: readonly CxMenuItem[],
  inputName: string,
): readonly CxMenuItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`[cx-explorer] ${inputName} must be an array.`);
  }
  for (const item of value) {
    if (item.id.startsWith(RESERVED_MENU_PREFIX)) {
      throw new Error(
        `[cx-explorer] ${inputName} ids must not start with "${RESERVED_MENU_PREFIX}" — that space belongs to the built-in row actions.`,
      );
    }
  }
  return [...value];
}
