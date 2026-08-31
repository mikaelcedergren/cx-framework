import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent } from '../../primitives/actions/cx-button';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CX_TAG_COLOR_PICKER_OPTIONS, type CxTagColor } from '../../primitives/display/cx-tag';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
} from '../../primitives/overlay/cx-menu';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip';
import { CxFloatingSurfaceController } from '../../primitives/overlay/floating-surface-controller';

/** A content entry inside a folder. Icon and color are its visual identity. */
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
export type CxExplorerMenuAction = { kind: 'folder' | 'item'; id: string; actionId: string };

/**
 * Built-in row actions own this id space so consumer-added menu entries can
 * never collide with them.
 */
const RESERVED_MENU_PREFIX = 'cx-explorer:';
const MENU_RENAME = `${RESERVED_MENU_PREFIX}rename`;
const MENU_STYLE = `${RESERVED_MENU_PREFIX}style`;
const MENU_DELETE = `${RESERVED_MENU_PREFIX}delete`;

const DEFAULT_ITEM_ICON: CxIconName = 'document';
const PICKER_WIDTH = 272;
const PICKER_ESTIMATED_HEIGHT = 332;

/**
 * The icon vocabulary offered by the built-in icon & color editor: friendly,
 * content-shaped identities rather than the full product icon manifest.
 * Consumers with a different vocabulary pass `itemIcons`.
 */
export const CX_EXPLORER_DEFAULT_ITEM_ICONS: readonly CxIconName[] = [
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

type CxExplorerRenameTarget = { kind: 'folder' | 'item'; id: string };

/**
 * Content rail for browsing and managing one-level collections of user
 * content: folders hold items. Editable explorers expose mutation controls;
 * browse-only explorers preserve hierarchy and selection without them. Unlike
 * `cx-side-nav` it navigates nothing — the consumer owns persisted effects.
 */
@Component({
  selector: 'cx-explorer',
  imports: [
    CxButtonComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxPopoverComponent,
    CxTooltipDirective,
  ],
  templateUrl: './cx-explorer.component.html',
  styleUrl: './cx-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxExplorerComponent implements OnDestroy {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  private readonly foldersState = signal<readonly CxExplorerFolder[]>([]);
  private readonly selectedItemIdState = signal<string | undefined>(undefined);
  private readonly itemIconsState = signal<readonly CxIconName[]>(CX_EXPLORER_DEFAULT_ITEM_ICONS);
  private readonly folderMenuItemsState = signal<readonly CxMenuItem[]>([]);
  private readonly itemMenuItemsState = signal<readonly CxMenuItem[]>([]);
  /** Folders the user explicitly closed; everything else stays open. */
  private readonly collapsedFolders = signal<Record<string, boolean>>({});

  protected readonly renaming = signal<CxExplorerRenameTarget | null>(null);
  protected readonly pickerItemId = signal<string | null>(null);

  protected readonly skeletonRows = Array.from({ length: 7 }, (_, index) => `skeleton-${index}`);
  protected readonly pickerColors = CX_TAG_COLOR_PICKER_OPTIONS;
  protected readonly pickerWidth = PICKER_WIDTH;

  /**
   * Fixed-size surface: the measure callback publishes the final metrics, so
   * no post-render surface pass is needed.
   */
  protected readonly pickerOverlay = new CxFloatingSurfaceController(() => ({
    width: PICKER_WIDTH,
    estimatedHeight: PICKER_ESTIMATED_HEIGHT,
    align: 'end',
    gap: 6,
  }));

  @Input()
  public set folders(value: readonly CxExplorerFolder[] | null | undefined) {
    this.foldersState.set(validateExplorerFolders(value ?? []));
  }

  @Input()
  public set selectedItemId(value: string | undefined) {
    const id = value?.trim() || undefined;
    this.selectedItemIdState.set(id);
    if (id) {
      this.revealItem(id);
    }
  }

  @Input() loading = false;

  /** Enables the built-in create, rename, restyle, and delete controls. */
  @Input({ transform: booleanAttribute }) editable = true;

  /** Accessible name of the rail region. Name it after the content it manages. */
  @Input() ariaLabel = 'Explorer';

  /** Label for the per-folder create action; also its tooltip. */
  @Input() createItemText = 'New page';

  @Input()
  public set itemIcons(value: readonly CxIconName[] | null | undefined) {
    if (value !== null && value !== undefined && !Array.isArray(value)) {
      throw new Error('[cx-explorer] itemIcons must be an array of icon names.');
    }
    const icons: readonly CxIconName[] = value ?? [];
    this.itemIconsState.set(icons.length > 0 ? [...icons] : CX_EXPLORER_DEFAULT_ITEM_ICONS);
  }

  /** Extra folder menu entries, between Rename and Delete. Reported via `menuAction`. */
  @Input()
  public set folderMenuItems(value: readonly CxMenuItem[] | null | undefined) {
    this.folderMenuItemsState.set(validateExplorerMenuItems(value ?? [], 'folderMenuItems'));
  }

  /** Extra item menu entries, between Icon & color and Delete. Reported via `menuAction`. */
  @Input()
  public set itemMenuItems(value: readonly CxMenuItem[] | null | undefined) {
    this.itemMenuItemsState.set(validateExplorerMenuItems(value ?? [], 'itemMenuItems'));
  }

  @Output() readonly selectedItemIdChange = new EventEmitter<string>();
  @Output() readonly folderCreate = new EventEmitter<void>();
  /** Create an item inside the folder with this id. */
  @Output() readonly itemCreate = new EventEmitter<string>();
  @Output() readonly folderChange = new EventEmitter<CxExplorerFolderChange>();
  /** The item's identity changed (rename or icon & color); emits the updated item. */
  @Output() readonly itemChange = new EventEmitter<CxExplorerItem>();
  /** Delete intent only — the consumer owns confirmation and the actual removal. */
  @Output() readonly folderDelete = new EventEmitter<string>();
  /** Delete intent only — the consumer owns confirmation and the actual removal. */
  @Output() readonly itemDelete = new EventEmitter<string>();
  @Output() readonly menuAction = new EventEmitter<CxExplorerMenuAction>();

  protected readonly folders$ = this.foldersState.asReadonly();
  protected readonly selectedItemId$ = this.selectedItemIdState.asReadonly();
  protected readonly itemIcons$ = this.itemIconsState.asReadonly();

  /** The item the icon & color editor is open for; closes when the item disappears. */
  protected readonly pickerItem = computed<CxExplorerItem | null>(() => {
    const id = this.pickerItemId();
    if (!id) return null;
    for (const folder of this.foldersState()) {
      const item = folder.items.find(entry => entry.id === id);
      if (item) return item;
    }
    return null;
  });

  ngOnDestroy(): void {
    this.pickerOverlay.destroy();
  }

  protected hasFolders(): boolean {
    return this.foldersState().length > 0;
  }

  protected isFolderExpanded(folder: CxExplorerFolder): boolean {
    return !this.collapsedFolders()[folder.id];
  }

  protected toggleFolder(folder: CxExplorerFolder): void {
    if (this.isRenaming('folder', folder.id)) return;
    this.collapsedFolders.update(collapsed => ({
      ...collapsed,
      [folder.id]: !collapsed[folder.id],
    }));
  }

  protected isSelected(item: CxExplorerItem): boolean {
    return this.selectedItemIdState() === item.id;
  }

  protected onItemPressed(item: CxExplorerItem): void {
    if (this.isRenaming('item', item.id)) return;
    this.selectedItemIdState.set(item.id);
    this.selectedItemIdChange.emit(item.id);
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
      { id: MENU_RENAME, label: 'Rename', prependIcon: 'edit' },
      ...this.folderMenuItemsState(),
      { id: MENU_DELETE, label: 'Delete', prependIcon: 'delete', danger: true, dividerBefore: true },
    ];
  }

  protected itemMenu(): readonly CxMenuItem[] {
    if (!this.editable) return this.itemMenuItemsState();
    return [
      { id: MENU_RENAME, label: 'Rename', prependIcon: 'edit' },
      { id: MENU_STYLE, label: 'Icon & color', prependIcon: 'squares-rotated' },
      ...this.itemMenuItemsState(),
      { id: MENU_DELETE, label: 'Delete', prependIcon: 'delete', danger: true, dividerBefore: true },
    ];
  }

  protected hasFolderMenu(): boolean {
    return this.folderMenu().length > 0;
  }

  protected hasItemMenu(): boolean {
    return this.itemMenu().length > 0;
  }

  protected onFolderMenuSelect(folder: CxExplorerFolder, actionId: string): void {
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

  protected onItemMenuSelect(item: CxExplorerItem, actionId: string, row: HTMLElement): void {
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

  protected isRenaming(kind: 'folder' | 'item', id: string): boolean {
    const target = this.renaming();
    return !!target && target.kind === kind && target.id === id;
  }

  protected beginRename(kind: 'folder' | 'item', id: string): void {
    if (!this.editable) return;
    this.closePicker();
    this.renaming.set({ kind, id });
    // The input exists only after the next render pass; select-all so typing
    // replaces the current name.
    afterRenderFrame(() => {
      const input = this.host.nativeElement.querySelector<HTMLInputElement>('.cx-explorer__rename-input');
      input?.focus();
      input?.select();
    });
  }

  protected commitRename(event: Event, kind: 'folder' | 'item', current: { id: string; name: string }): void {
    if (!this.isRenaming(kind, current.id)) return;
    this.renaming.set(null);
    const name = (event.target as HTMLInputElement).value.trim();
    if (!name || name === current.name) return;
    if (kind === 'folder') {
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

  protected openPicker(item: CxExplorerItem, row: HTMLElement): void {
    this.renaming.set(null);
    this.pickerOverlay.endSession();
    this.pickerItemId.set(item.id);
    this.pickerOverlay.sync(row);
    // Focus follows into the editor so the keyboard path continues where the
    // menu handed over; the popover restores focus on close. The surface
    // exists only after the next render pass.
    afterRenderFrame(() => {
      const surface = this.host.nativeElement.querySelector<HTMLElement>('.cx-explorer__picker');
      const target =
        surface?.querySelector<HTMLElement>('button[aria-pressed="true"]') ??
        surface?.querySelector<HTMLElement>('button');
      target?.focus();
    });
  }

  protected closePicker(): void {
    if (this.pickerItemId() === null) return;
    this.pickerItemId.set(null);
    this.pickerOverlay.endSession();
  }

  protected isPickerIconSelected(item: CxExplorerItem, icon: CxIconName): boolean {
    return this.itemIcon(item) === icon;
  }

  protected onPickerColor(item: CxExplorerItem, color: CxTagColor | undefined): void {
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
    this.collapsedFolders.update(collapsed => ({ ...collapsed, [folder.id]: false }));
    this.itemCreate.emit(folder.id);
  }

  private findItem(id: string): CxExplorerItem | undefined {
    for (const folder of this.foldersState()) {
      const item = folder.items.find(entry => entry.id === id);
      if (item) return item;
    }
    return undefined;
  }

  /** Selection always lands visible: clear an explicit close on its folder. */
  private revealItem(id: string): void {
    const folder = this.foldersState().find(entry => entry.items.some(item => item.id === id));
    if (!folder || !this.collapsedFolders()[folder.id]) return;
    this.collapsedFolders.update(collapsed => ({ ...collapsed, [folder.id]: false }));
  }
}

// Post-render work (focusing an element an @if just created) has to wait for
// the frame; environments without rAF fall back to a microtask.
function afterRenderFrame(work: () => void): void {
  if (typeof requestAnimationFrame === 'undefined') {
    queueMicrotask(work);
    return;
  }
  requestAnimationFrame(work);
}

function validateExplorerFolders(value: readonly CxExplorerFolder[]): readonly CxExplorerFolder[] {
  if (!Array.isArray(value)) {
    throw new Error('[cx-explorer] folders must be an array.');
  }
  const folderIds = new Set<string>();
  const itemIds = new Set<string>();
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
    const items = folder.items.map((item: CxExplorerItem, itemIndex: number) => {
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
