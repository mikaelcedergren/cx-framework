import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { type Subscription } from 'rxjs';
import { type CxIconName } from '../../../icons/manifest';
import { eventMatchesShortcut, isTypingTarget } from '../../actions/shared/shortcuts';
import { CxOptionComponent } from '../cx-option';
import { CxOptionGroupComponent } from '../cx-option-group';
import { CxPopoverComponent } from '../cx-popover';
import { CxHostVisibilityObserver, isHostVisible } from '../../shared/host-visibility';
import {
  measureCxFloatingSurface,
  type CxFloatingSurfacePlacement,
} from '../floating-surface';
import { CxMenuTriggerDirective } from './cx-menu-trigger.directive';

export type CxMenuLayout = 'inline' | 'fill';
export type CxMenuSelection = 'single' | 'multiple';
export type CxMenuItemType = 'action' | 'choice';
export type CxMenuPresentation =
  | { kind: 'trigger' }
  | { kind: 'inline' }
  | { kind: 'context'; left: number; top: number };

export type CxMenuItem = {
  id: string;
  label: string;
  prependIcon?: CxIconName;
  appendIcon?: CxIconName;
  description?: string;
  disabled?: boolean;
  selected?: boolean;
  type?: CxMenuItemType;
  /** How this item's submenu tracks selection. Only read when the item has children. */
  selection?: CxMenuSelection;
  danger?: boolean;
  shortcutParts?: readonly string[];
  dividerBefore?: boolean;
  dividerAfter?: boolean;
  items?: readonly CxMenuItem[];
};

export type CxMenuGroup = {
  id?: string;
  label?: string;
  description?: string;
  /**
   * Declares the group as a choice group: 'single' announces items as
   * menuitemradio, 'multiple' as menuitemcheckbox, both with aria-checked.
   * Items with type: 'action' stay plain commands inside a choice group.
   */
  selection?: CxMenuSelection;
  items: readonly CxMenuItem[];
};

type CxMenuItemRole = 'menuitem' | 'menuitemradio' | 'menuitemcheckbox';

type CxResolvedMenuItem = CxMenuItem & {
  prependIcon?: CxIconName;
  appendIcon?: CxIconName;
  dividerBeforeResolved: boolean;
  hasChildren: boolean;
  role: CxMenuItemRole;
  items?: CxResolvedMenuItem[];
};

type CxResolvedMenuGroup = Omit<CxMenuGroup, 'id' | 'items'> & {
  id: string;
  items: CxResolvedMenuItem[];
};

type CxResolvedMenuVisualGroup = Pick<CxResolvedMenuGroup, 'id' | 'label' | 'description'> & {
  items: CxResolvedMenuItem[];
};

type CxMenuSubmenuSurface = {
  path: string;
  label: string;
  level: number;
  items: CxResolvedMenuItem[];
  left: number;
  top: number;
  maxHeight: number;
};

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function estimateMenuSurfaceHeight(items: readonly CxMenuItem[]): number {
  return Math.min(Math.max(items.length, 1) * 48 + 8, 320);
}

function resolveMenuItems(items: readonly CxMenuItem[], selection?: CxMenuSelection): CxResolvedMenuItem[] {
  const hasPrependIcons = items.length > 0 && items.every(item => !!item.prependIcon);
  return items.map((item, index) => {
    const hasChildren = childItemsFor(item).length > 0;
    const itemType: CxMenuItemType = hasChildren ? 'action' : (item.type ?? (selection ? 'choice' : 'action'));
    if (hasChildren && (item.type === 'choice' || item.selected !== undefined)) {
      throw new Error(`[cx-menu] Submenu item "${item.id}" cannot declare choice state.`);
    }
    if (!hasChildren && itemType === 'action' && item.selected !== undefined) {
      throw new Error(`[cx-menu] Action item "${item.id}" cannot declare selected state.`);
    }
    return {
      ...item,
      type: itemType,
      prependIcon: hasPrependIcons ? item.prependIcon : undefined,
      dividerBeforeResolved: index > 0 && ((item.dividerBefore ?? false) || (items[index - 1]?.dividerAfter ?? false)),
      hasChildren,
      role: resolveMenuItemRole({ ...item, type: itemType }, hasChildren, selection),
      items: hasChildren ? resolveMenuItems(childItemsFor(item), item.selection) : undefined,
    };
  });
}

function resolveMenuItemRole(
  item: CxMenuItem,
  hasChildren: boolean,
  selection: CxMenuSelection | undefined,
): CxMenuItemRole {
  if (hasChildren || item.type === 'action' || (!item.type && !selection)) {
    return 'menuitem';
  }
  if (selection === 'multiple') {
    return 'menuitemcheckbox';
  }
  return 'menuitemradio';
}

function childItemsFor(item: CxMenuItem): readonly CxMenuItem[] {
  return item.items ?? [];
}

function validateMenuItems(items: readonly CxMenuItem[], seenIds = new Set<string>()): void {
  if (!Array.isArray(items)) {
    throw new Error('[cx-menu] items must be an array.');
  }
  const preservesPrependIcons = items.length > 0 && items.every(item => !!item.prependIcon);
  for (const item of items) {
    const id = item.id?.trim();
    if (!id) {
      throw new Error('[cx-menu] every item requires a non-empty id.');
    }
    if (seenIds.has(id)) {
      throw new Error(`[cx-menu] item ids must be unique; received "${id}" more than once.`);
    }
    seenIds.add(id);
    validateMenuItems(childItemsFor(item), seenIds);
  }
}

function resolveMenuGroups(groups: readonly CxMenuGroup[]): CxResolvedMenuGroup[] {
  return groups.map((group, index) => ({
    ...group,
    id: group.id?.trim() || `group-${index}`,
    items: resolveMenuItems(group.items, group.selection),
  }));
}

function splitMenuItemsIntoVisualGroups(
  items: readonly CxResolvedMenuItem[],
  idPrefix: string,
  label?: string,
  description?: string,
): CxResolvedMenuVisualGroup[] {
  const groups: CxResolvedMenuVisualGroup[] = [];
  let index = 0;
  let current: CxResolvedMenuVisualGroup = {
    id: `${idPrefix}-visual-${index}`,
    label,
    description,
    items: [],
  };

  for (const item of items) {
    if (item.dividerBeforeResolved && current.items.length > 0) {
      groups.push(current);
      index += 1;
      current = {
        id: `${idPrefix}-visual-${index}`,
        items: [],
      };
    }
    current.items.push(item);
  }

  if (current.items.length > 0 || current.label || current.description) {
    groups.push(current);
  }
  return groups;
}

function resolveMenuVisualGroups(groups: readonly CxResolvedMenuGroup[]): CxResolvedMenuVisualGroup[] {
  return groups.flatMap(group => splitMenuItemsIntoVisualGroups(group.items, group.id, group.label, group.description));
}

function buildItemPath(parentPath: string, itemId: string): string {
  return parentPath ? `${parentPath}/${itemId}` : itemId;
}

function measureCxSubmenuSurface(input: {
  triggerRect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>;
  viewportWidth: number;
  viewportHeight: number;
  width: number;
  estimatedHeight: number;
  viewportPadding?: number;
  gap?: number;
}): Pick<CxMenuSubmenuSurface, 'left' | 'top' | 'maxHeight'> {
  const viewportPadding = input.viewportPadding ?? 8;
  const gap = input.gap ?? 8;
  const maxViewportWidth = Math.max(input.viewportWidth - viewportPadding * 2, 0);
  const width = Math.floor(clamp(input.width, 160, maxViewportWidth));
  const spaceRight = input.viewportWidth - input.triggerRect.right - viewportPadding - gap;
  const spaceLeft = input.triggerRect.left - viewportPadding - gap;
  const openToRight = spaceRight >= width || spaceRight >= spaceLeft;
  const leftBase = openToRight ? input.triggerRect.right + gap : input.triggerRect.left - width - gap;
  const left = Math.floor(clamp(leftBase, viewportPadding, input.viewportWidth - width - viewportPadding));
  const maxTop = Math.max(
    input.viewportHeight -
      Math.min(input.estimatedHeight, input.viewportHeight - viewportPadding * 2) -
      viewportPadding,
    viewportPadding,
  );
  const top = Math.floor(clamp(input.triggerRect.top, viewportPadding, maxTop));
  const maxHeight = Math.max(input.viewportHeight - top - viewportPadding, 0);

  return { left, top, maxHeight };
}

@Component({
  selector: 'cx-menu',
  imports: [CxOptionComponent, CxOptionGroupComponent, CxPopoverComponent],
  templateUrl: './cx-menu.component.html',
  styleUrl: './cx-menu.component.scss',
  host: {
    '[class.cx-menu-host--fill]': 'layout$() === "fill"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMenuComponent implements AfterContentInit, OnDestroy {
  private static instanceCounter = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly hostVisibility = new CxHostVisibilityObserver(this.host.nativeElement, visible =>
    this.onHostVisibilityChange(visible),
  );
  private readonly instanceId = ++CxMenuComponent.instanceCounter;
  protected readonly scopeId = `cx-menu-${this.instanceId}`;
  protected readonly rootSurfaceId = `${this.scopeId}-surface`;
  private readonly itemsState = signal<CxMenuItem[]>([]);
  private readonly groupsState = signal<CxMenuGroup[]>([]);
  private readonly headingState = signal('');
  private readonly currentIdState = signal<string | undefined>(undefined);
  private readonly shortcutsEnabledState = signal(false);
  private readonly openState = signal(false);
  private readonly presentationState = signal<CxMenuPresentation>({
    kind: 'inline',
  });
  private readonly submenuSurfacesState = signal<CxMenuSubmenuSurface[]>([]);
  private readonly alignState = signal<'start' | 'end'>('end');
  private readonly layoutState = signal<CxMenuLayout>('inline');
  private readonly widthState = signal(240);
  private readonly surfaceTopState = signal<number | undefined>(undefined);
  private readonly surfaceBottomState = signal<number | undefined>(undefined);
  private readonly surfaceLeftState = signal<number | undefined>(undefined);
  private readonly surfaceMaxHeightState = signal<number | undefined>(undefined);
  // Placement is decided once per open; re-syncs while open keep the side so
  // the surface never flips mid-interaction.
  private surfaceLockedPlacement?: CxFloatingSurfacePlacement;
  private triggerElement?: HTMLElement;
  private triggerButton?: HTMLButtonElement;

  protected get rootPopoverOwner(): HTMLElement | undefined {
    return this.triggerElement;
  }
  private triggerOriginalState?: {
    disabled: boolean;
    type: string | null;
    ariaHaspopup: string | null;
    ariaExpanded: string | null;
    ariaControls: string | null;
    ariaDisabled: string | null;
    buttonDisabledClass: boolean;
    iconButtonDisabledClass: boolean;
  };
  private resizeObserver?: ResizeObserver;
  private destroyed = false;
  private readonly triggerClickListener = (event: MouseEvent) => this.onTriggerClick(event);
  private readonly triggerKeydownListener = (event: KeyboardEvent) => this.onTriggerKeydown(event);

  @ContentChildren(CxMenuTriggerDirective, { descendants: true })
  private triggerDirectives?: QueryList<CxMenuTriggerDirective>;
  private triggerChangesSubscription?: Subscription;

  @ViewChild('rootPopover')
  private rootPopoverRef?: CxPopoverComponent;

  private disabledValue = false;

  @Input()
  public set disabled(value: boolean) {
    this.disabledValue = Boolean(value);
    if (this.disabledValue && this.openState()) {
      this.setOpen(false, true);
    }
    this.syncTriggerState();
  }
  public get disabled(): boolean {
    return this.disabledValue;
  }

  @Input({ required: true })
  public set presentation(value: CxMenuPresentation) {
    const nextPresentation = this.normalizePresentation(value);
    if (this.presentationsMatch(this.presentationState(), nextPresentation)) {
      return;
    }
    this.presentationState.set(nextPresentation);
    if (nextPresentation.kind === 'inline' && this.openState()) {
      this.setOpen(false, false);
    }
    queueMicrotask(() => this.connectTrigger());
    if (nextPresentation.kind === 'context' && this.openState()) {
      // A context menu re-anchored to a new pointer position is a new
      // session: re-pick the side for the new anchor.
      this.surfaceLockedPlacement = undefined;
      queueMicrotask(() => {
        this.syncSurfaceMetrics();
        this.focusFirstEnabledOption();
      });
    }
  }
  @Input() ariaLabel = 'Menu';

  @Input()
  public set heading(value: string | undefined) {
    this.headingState.set(value?.trim() ?? '');
  }

  @Input()
  public set items(value: readonly CxMenuItem[] | undefined) {
    const items = value ?? [];
    validateMenuItems(items);
    this.itemsState.set([...items]);
  }

  @Input()
  public set groups(value: readonly CxMenuGroup[] | undefined) {
    const groups = value ?? [];
    if (!Array.isArray(groups)) {
      throw new Error('[cx-menu] groups must be an array.');
    }
    const seenIds = new Set<string>();
    for (const group of groups) {
      validateMenuItems(group.items, seenIds);
    }
    this.groupsState.set([...groups]);
  }

  @Input()
  public set currentId(value: string | undefined) {
    this.currentIdState.set(value?.trim() || undefined);
  }

  @Input()
  public set shortcutsEnabled(value: boolean) {
    this.shortcutsEnabledState.set(value);
  }

  @Input()
  public set open(value: boolean) {
    const nextOpen = Boolean(value) && !this.disabled && this.presentationState().kind !== 'inline';
    this.openState.set(nextOpen);
    this.syncTriggerState();
    this.syncTriggerResizeObserver();
    if (nextOpen) {
      this.surfaceLockedPlacement = undefined;
      queueMicrotask(() => {
        this.syncSurfaceMetrics();
        if (this.presentationState().kind === 'context') {
          this.focusFirstEnabledOption();
        }
      });
      return;
    }
    this.setSubmenuSurfaces([]);
  }

  @Input()
  public set align(value: 'start' | 'end') {
    this.alignState.set(value === 'start' ? 'start' : 'end');
  }

  @Input()
  public set layout(value: CxMenuLayout | undefined) {
    this.layoutState.set(value === 'fill' ? 'fill' : 'inline');
  }

  @Input()
  public set width(value: number) {
    this.widthState.set(Number.isFinite(value) ? Math.max(value, 160) : 240);
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly itemSelect = new EventEmitter<string>();
  @Output() readonly currentIdChange = new EventEmitter<string>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly presentation$ = this.presentationState.asReadonly();
  protected readonly layout$ = this.layoutState.asReadonly();
  protected readonly heading$ = this.headingState.asReadonly();
  protected readonly currentId$ = this.currentIdState.asReadonly();
  protected readonly surfaceTop$ = this.surfaceTopState.asReadonly();
  protected readonly surfaceBottom$ = this.surfaceBottomState.asReadonly();
  protected readonly surfaceLeft$ = this.surfaceLeftState.asReadonly();
  protected readonly surfaceWidth$ = this.widthState.asReadonly();
  protected readonly surfaceMaxHeight$ = this.surfaceMaxHeightState.asReadonly();
  protected readonly submenuSurfaces$ = this.submenuSurfacesState.asReadonly();
  protected readonly normalizedItems$ = computed(() => resolveMenuItems(this.itemsState()));
  protected readonly normalizedGroups$ = computed<CxResolvedMenuGroup[]>(() => {
    const groups = this.groupsState();
    if (groups.length > 0) {
      return resolveMenuGroups(groups);
    }
    return [{ id: 'default', items: resolveMenuItems(this.itemsState()) }];
  });
  protected readonly visibleGroups$ = computed<CxResolvedMenuGroup[]>(() =>
    this.normalizedGroups$().filter(group => group.items.length > 0),
  );
  protected readonly visualGroups$ = computed<CxResolvedMenuVisualGroup[]>(() =>
    resolveMenuVisualGroups(this.visibleGroups$()),
  );

  protected get resolvedMenuAriaLabel(): string {
    return this.headingState() || this.ariaLabel;
  }

  ngAfterContentInit(): void {
    this.triggerChangesSubscription = this.triggerDirectives?.changes.subscribe(() => {
      queueMicrotask(() => this.connectTrigger());
    });
    queueMicrotask(() => this.connectTrigger());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.openState.set(false);
    this.submenuSurfacesState.set([]);
    this.triggerChangesSubscription?.unsubscribe();
    this.disconnectTrigger();
  }

  private onTriggerClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.disabled) {
      return;
    }
    // A click synthesised from keyboard activation (Enter/Space on the trigger
    // button) reports detail === 0; only then do we pull focus into the menu so
    // pointer-driven opens leave focus on the trigger.
    this.toggleOpen(event.detail === 0);
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!this.openState()) {
      this.surfaceLockedPlacement = undefined;
      this.syncSurfaceMetrics();
      this.setOpen(true);
    }
    const toLast = event.key === 'ArrowUp';
    this.focusWhenReady(() => {
      const options = this.optionButtonsInSurface(this.rootSurfaceElement());
      return (toLast ? options[options.length - 1] : options[0]) ?? null;
    });
  }

  protected onResolvedItemClick(
    item: CxResolvedMenuItem,
    level: number,
    parentPath: string,
    optionWrap: HTMLElement,
    event: MouseEvent,
  ): void {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (item.hasChildren) {
      event.preventDefault();
      event.stopPropagation();
      this.openSubmenu(item, level, buildItemPath(parentPath, item.id), optionWrap);
      return;
    }
    this.activateItem(item);
  }

  protected onResolvedItemPointerEnter(
    item: CxResolvedMenuItem,
    level: number,
    parentPath: string,
    optionWrap: HTMLElement,
  ): void {
    if (item.disabled) {
      this.trimSubmenus(level);
      return;
    }
    if (item.hasChildren) {
      this.openSubmenu(item, level, buildItemPath(parentPath, item.id), optionWrap);
      return;
    }
    this.trimSubmenus(level);
  }

  protected onResolvedItemKeydown(
    event: KeyboardEvent,
    item: CxResolvedMenuItem,
    level: number,
    parentPath: string,
    optionWrap: HTMLElement,
  ): void {
    if (item.disabled) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End': {
        event.preventDefault();
        this.moveOptionFocus(event.key, optionWrap);
        return;
      }
      case 'ArrowRight': {
        if (!item.hasChildren) {
          return;
        }
        event.preventDefault();
        const itemPath = buildItemPath(parentPath, item.id);
        this.openSubmenu(item, level, itemPath, optionWrap);
        const firstChildId = item.items?.find(child => !child.disabled)?.id;
        if (firstChildId) {
          const childPath = buildItemPath(itemPath, firstChildId);
          this.focusWhenReady(() => this.optionButtonByPath(childPath));
        }
        return;
      }
      case 'ArrowLeft': {
        if (level <= 0) {
          return;
        }
        event.preventDefault();
        this.trimSubmenus(level - 1);
        this.optionButtonByPath(parentPath)?.focus();
        return;
      }
      default:
        return;
    }
  }

  protected itemPath(parentPath: string, itemId: string): string {
    return buildItemPath(parentPath, itemId);
  }

  protected visualGroupsForItems(items: readonly CxResolvedMenuItem[], idPrefix: string): CxResolvedMenuVisualGroup[] {
    return splitMenuItemsIntoVisualGroups(items, idPrefix || 'submenu');
  }

  protected itemSelectedState(item: CxResolvedMenuItem): boolean {
    if (item.role === 'menuitemcheckbox') {
      // currentId is a single-choice tracker; toggles rely on the consumer's
      // per-item selected state only.
      return item.selected ?? false;
    }
    if (item.role === 'menuitemradio') {
      return item.selected ?? this.currentIdState() === item.id;
    }
    return false;
  }

  private activateItem(item: CxResolvedMenuItem): void {
    if (item.role === 'menuitemcheckbox') {
      // A toggle is not the menu's current choice, and closing after each
      // toggle would make multi-select menus unusable.
      this.itemSelect.emit(item.id);
      return;
    }
    if (item.role === 'menuitemradio') {
      this.updateCurrentId(item.id);
    }
    this.itemSelect.emit(item.id);
    this.closeSurface();
  }

  protected submenuSurfaceId(path: string): string {
    return `${this.scopeId}-submenu-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  protected itemSubmenuState(parentPath: string, item: CxResolvedMenuItem): 'none' | 'open' | 'closed' {
    if (!item.hasChildren) {
      return 'none';
    }
    const path = buildItemPath(parentPath, item.id);
    return this.submenuSurfacesState().some(surface => surface.path === path) ? 'open' : 'closed';
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isSurfaceActive()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (this.host.nativeElement.contains(target)) {
      return;
    }
    if (this.targetIsInsideMenuSurface(target)) {
      return;
    }
    this.closeSurface();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.isSurfaceActive()) {
      return;
    }
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    const focusWasInside = active instanceof Node && this.targetIsInsideMenuSurface(active);
    this.closeSurface(focusWasInside);
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.shortcutsEnabledState() || !this.isSurfaceActive() || isTypingTarget(event.target)) {
      return;
    }
    const item = this.findShortcutItem(
      this.normalizedGroups$().flatMap(group => group.items),
      event,
    );
    if (!item || item.disabled || item.hasChildren) {
      return;
    }
    event.preventDefault();
    this.activateItem(item);
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (!this.isSurfaceActive()) {
      return;
    }
    this.syncSurfaceMetrics();
  }

  private toggleOpen(focusFirstOption = false): void {
    const nextOpen = !this.openState();
    if (nextOpen) {
      this.surfaceLockedPlacement = undefined;
      this.syncSurfaceMetrics();
    }
    this.setOpen(nextOpen, !nextOpen);
    if (nextOpen && focusFirstOption) {
      this.focusWhenReady(() => this.optionButtonsInSurface(this.rootSurfaceElement())[0] ?? null);
    }
  }

  protected setOpen(nextOpen: boolean, restoreFocus = !nextOpen): void {
    const resolvedOpen = nextOpen && !this.disabled && this.presentationState().kind !== 'inline';
    if (this.openState() === resolvedOpen) {
      return;
    }
    this.openState.set(resolvedOpen);
    if (!resolvedOpen) {
      this.setSubmenuSurfaces([]);
    }
    this.syncTriggerState();
    this.syncTriggerResizeObserver();
    this.openChange.emit(resolvedOpen);
    if (!resolvedOpen && restoreFocus && this.presentationState().kind === 'trigger') {
      queueMicrotask(() => this.focusTrigger());
    }
  }

  private syncSurfaceMetrics(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const presentation = this.presentationState();
    const rect =
      presentation.kind === 'context'
        ? {
            left: presentation.left,
            right: presentation.left,
            top: presentation.top,
            bottom: presentation.top,
          }
        : this.triggerElement?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: this.widthState(),
      estimatedHeight: estimateMenuSurfaceHeight(this.rootItems()),
      align: presentation.kind === 'context' ? 'start' : this.alignState(),
      gap: presentation.kind === 'context' ? 0 : undefined,
      lockedPlacement: this.surfaceLockedPlacement,
    });
    this.surfaceLockedPlacement = surface.placement;

    this.surfaceLeftState.set(surface.left);
    this.surfaceTopState.set(surface.top);
    this.surfaceBottomState.set(surface.bottom);
    this.surfaceMaxHeightState.set(surface.maxHeight);
    this.syncSubmenuSurfaceMetrics();
  }

  private openSubmenu(item: CxResolvedMenuItem, level: number, itemPath: string, anchorElement: HTMLElement): void {
    if (!item.items?.length || typeof window === 'undefined') {
      this.trimSubmenus(level);
      return;
    }

    const rect = anchorElement.getBoundingClientRect();
    const surface = measureCxSubmenuSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: this.widthState(),
      estimatedHeight: estimateMenuSurfaceHeight(item.items),
    });

    const nextSurface: CxMenuSubmenuSurface = {
      path: itemPath,
      label: item.label,
      level: level + 1,
      items: item.items,
      left: surface.left,
      top: surface.top,
      maxHeight: surface.maxHeight,
    };

    this.setSubmenuSurfaces([
      ...this.submenuSurfacesState().filter(existingSurface => existingSurface.level < nextSurface.level),
      nextSurface,
    ]);
  }

  private trimSubmenus(level: number): void {
    this.setSubmenuSurfaces(this.submenuSurfacesState().filter(existingSurface => existingSurface.level <= level));
  }

  private updateCurrentId(itemId: string): void {
    if (this.currentIdState() === itemId) {
      return;
    }
    this.currentIdState.set(itemId);
    this.currentIdChange.emit(itemId);
  }

  private closeSurface(restoreFocus = true): void {
    if (this.presentationState().kind !== 'inline') {
      this.setOpen(false, restoreFocus);
      return;
    }
    this.setSubmenuSurfaces([]);
  }

  private setSubmenuSurfaces(surfaces: CxMenuSubmenuSurface[]): void {
    const trackingChanged = this.submenuSurfacesState().length > 0 !== surfaces.length > 0;
    this.submenuSurfacesState.set(surfaces);
    if (trackingChanged) {
      this.syncTriggerResizeObserver();
    }
  }

  private onHostVisibilityChange(visible: boolean): void {
    if (this.destroyed) {
      return;
    }
    if (visible) {
      this.syncSurfaceMetrics();
      return;
    }
    if (this.presentationState().kind === 'inline') {
      if (this.submenuSurfacesState().length > 0) {
        this.setSubmenuSurfaces([]);
      }
      return;
    }
    if (this.openState()) {
      this.setOpen(false, false);
    }
  }

  private isSurfaceActive(): boolean {
    if (this.presentationState().kind === 'inline') {
      const visible = isHostVisible(this.host.nativeElement);
      if (!visible && this.submenuSurfacesState().length > 0) {
        this.setSubmenuSurfaces([]);
      }
      return visible;
    }
    if (!this.openState()) {
      return false;
    }
    if (!isHostVisible(this.host.nativeElement)) {
      this.setOpen(false, false);
      return false;
    }
    return true;
  }

  private syncSubmenuSurfaceMetrics(): void {
    if (typeof window === 'undefined' || this.submenuSurfacesState().length === 0) {
      return;
    }

    const refreshedSurfaces: CxMenuSubmenuSurface[] = [];
    for (const surface of this.submenuSurfacesState()) {
      const anchorElement = this.optionWrapByPath(surface.path);
      if (!anchorElement) {
        continue;
      }
      const rect = anchorElement.getBoundingClientRect();
      const nextMetrics = measureCxSubmenuSurface({
        triggerRect: rect,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        width: this.widthState(),
        estimatedHeight: estimateMenuSurfaceHeight(surface.items),
      });
      refreshedSurfaces.push({
        ...surface,
        left: nextMetrics.left,
        top: nextMetrics.top,
        maxHeight: nextMetrics.maxHeight,
      });
    }
    this.setSubmenuSurfaces(refreshedSurfaces);
  }

  private moveOptionFocus(key: string, optionWrap: HTMLElement): void {
    const surface = optionWrap.closest('[data-cx-popover-surface]');
    const options = this.optionButtonsInSurface(surface);
    if (options.length === 0) {
      return;
    }
    const current = optionWrap.querySelector<HTMLElement>('.cx-option');
    const currentIndex = current ? options.indexOf(current) : -1;
    let nextIndex: number;
    if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = options.length - 1;
    } else if (key === 'ArrowDown') {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
    } else {
      nextIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
    }
    options[nextIndex]?.focus();
  }

  private rootSurfaceElement(): Element | null {
    if (typeof document === 'undefined') {
      return null;
    }
    if (this.presentationState().kind === 'inline') {
      return this.host.nativeElement.querySelector('[data-cx-popover-surface]');
    }
    return this.rootPopoverRef?.surfaceElement() ?? document.getElementById(this.rootSurfaceId);
  }

  private menuSurfaceElements(): HTMLElement[] {
    if (typeof document === 'undefined') {
      return [];
    }
    return [
      this.rootSurfaceElement(),
      ...this.submenuSurfacesState()
        .map(surface => document.getElementById(this.submenuSurfaceId(surface.path)))
        .filter((surface): surface is HTMLElement => surface !== null),
    ].filter((surface): surface is HTMLElement => surface instanceof HTMLElement);
  }

  private targetIsInsideMenuSurface(target: Node): boolean {
    return this.menuSurfaceElements().some(surface => surface.contains(target));
  }

  private optionButtonsInSurface(surface: Element | null): HTMLElement[] {
    if (!surface) {
      return [];
    }
    return Array.from(surface.querySelectorAll<HTMLElement>('.cx-menu__option-wrap .cx-option')).filter(
      button => !button.hasAttribute('disabled'),
    );
  }

  private optionButtonByPath(path: string): HTMLElement | null {
    return this.optionWrapByPath(path)?.querySelector<HTMLElement>('.cx-option') ?? null;
  }

  private optionWrapByPath(path: string): HTMLElement | null {
    for (const surface of this.menuSurfaceElements()) {
      const option = Array.from(surface.querySelectorAll<HTMLElement>('[data-menu-item-path]')).find(
        element =>
          element.getAttribute('data-cx-menu-scope') === this.scopeId &&
          element.getAttribute('data-menu-item-path') === path,
      );
      if (option) {
        return option;
      }
    }
    return null;
  }

  private focusWhenReady(resolve: () => HTMLElement | null, attempt = 0): void {
    if (this.destroyed) {
      return;
    }
    if (typeof requestAnimationFrame === 'undefined') {
      resolve()?.focus();
      return;
    }
    const target = resolve();
    if (target && this.focusTargetIsStable(target)) {
      target.focus();
      return;
    }
    if (attempt >= 12) {
      return;
    }
    requestAnimationFrame(() => this.focusWhenReady(resolve, attempt + 1));
  }

  private focusTargetIsStable(target: HTMLElement): boolean {
    if (!target.isConnected) {
      return false;
    }
    const surface = target.closest<HTMLElement>('[data-cx-popover-surface]');
    return (
      !surface
      || surface.classList.contains('cx-menu__inline-surface')
      || surface.parentElement === document.body
    );
  }

  private focusTrigger(): void {
    if (this.triggerButton && !this.triggerButton.disabled && this.triggerButton.isConnected) {
      this.triggerButton.focus();
    }
  }

  private focusFirstEnabledOption(): void {
    this.focusWhenReady(() => this.optionButtonsInSurface(this.rootSurfaceElement())[0] ?? null);
  }

  private connectTrigger(): void {
    if (this.destroyed) {
      return;
    }
    this.disconnectTrigger();

    const presentation = this.presentationState();
    const triggerDirectives = this.triggerDirectives?.toArray() ?? [];
    if (presentation.kind !== 'trigger') {
      if (triggerDirectives.length > 0) {
        throw new Error(`[cx-menu] ${presentation.kind} presentation cannot contain cxMenuTrigger.`);
      }
      this.syncTriggerResizeObserver();
      return;
    }
    if (triggerDirectives.length !== 1) {
      throw new Error(
        `[cx-menu] Trigger presentation requires exactly one cxMenuTrigger; found ${triggerDirectives.length}.`,
      );
    }

    const button = triggerDirectives[0].nativeButton();
    this.triggerButton = button;
    this.triggerElement = button;
    this.triggerOriginalState = {
      disabled: button.disabled,
      type: button.getAttribute('type'),
      ariaHaspopup: button.getAttribute('aria-haspopup'),
      ariaExpanded: button.getAttribute('aria-expanded'),
      ariaControls: button.getAttribute('aria-controls'),
      ariaDisabled: button.getAttribute('aria-disabled'),
      buttonDisabledClass: button.classList.contains('cx-button--disabled'),
      iconButtonDisabledClass: button.classList.contains('cx-icon-button--disabled'),
    };

    button.addEventListener('click', this.triggerClickListener, true);
    button.addEventListener('keydown', this.triggerKeydownListener, true);
    this.syncTriggerState();
    this.syncTriggerResizeObserver();
    if (this.openState()) {
      this.syncSurfaceMetrics();
    }
  }

  private syncTriggerResizeObserver(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.hostVisibility.stop();

    if (!this.openState() && this.submenuSurfacesState().length === 0) {
      return;
    }

    this.hostVisibility.start();
    if (!this.openState() && this.submenuSurfacesState().length === 0) {
      this.hostVisibility.stop();
      return;
    }
    if (this.triggerButton && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.hostVisibility.check()) {
          this.syncSurfaceMetrics();
        }
      });
      this.resizeObserver.observe(this.triggerButton);
    }
  }

  private disconnectTrigger(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.hostVisibility.stop();

    const button = this.triggerButton;
    const original = this.triggerOriginalState;
    if (button && original) {
      button.removeEventListener('click', this.triggerClickListener, true);
      button.removeEventListener('keydown', this.triggerKeydownListener, true);
      button.disabled = original.disabled;
      this.restoreAttribute(button, 'type', original.type);
      this.restoreAttribute(button, 'aria-haspopup', original.ariaHaspopup);
      this.restoreAttribute(button, 'aria-expanded', original.ariaExpanded);
      this.restoreAttribute(button, 'aria-controls', original.ariaControls);
      this.restoreAttribute(button, 'aria-disabled', original.ariaDisabled);
      button.classList.toggle('cx-button--disabled', original.buttonDisabledClass);
      button.classList.toggle('cx-icon-button--disabled', original.iconButtonDisabledClass);
    }

    this.triggerButton = undefined;
    this.triggerElement = undefined;
    this.triggerOriginalState = undefined;
  }

  private syncTriggerState(): void {
    const button = this.triggerButton;
    const original = this.triggerOriginalState;
    if (!button || !original) {
      return;
    }

    const disabled = original.disabled || this.disabled;
    button.type = 'button';
    button.disabled = disabled;
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', String(this.openState()));
    button.setAttribute('aria-controls', this.rootSurfaceId);
    this.restoreAttribute(button, 'aria-disabled', disabled ? 'true' : original.ariaDisabled);
    if (button.classList.contains('cx-button')) {
      button.classList.toggle('cx-button--disabled', disabled);
    }
    if (button.classList.contains('cx-icon-button')) {
      button.classList.toggle('cx-icon-button--disabled', disabled);
    }
  }

  private restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) {
      element.removeAttribute(name);
      return;
    }
    element.setAttribute(name, value);
  }

  private normalizePresentation(value: CxMenuPresentation): CxMenuPresentation {
    if (value?.kind === 'trigger' || value?.kind === 'inline') {
      return value;
    }
    if (value?.kind === 'context' && Number.isFinite(value.left) && Number.isFinite(value.top)) {
      return { kind: 'context', left: value.left, top: value.top };
    }
    throw new Error('[cx-menu] presentation must be trigger, inline, or a finite context point.');
  }

  private presentationsMatch(current: CxMenuPresentation, next: CxMenuPresentation): boolean {
    if (current.kind !== next.kind) {
      return false;
    }
    if (current.kind !== 'context' || next.kind !== 'context') {
      return true;
    }
    return current.left === next.left && current.top === next.top;
  }

  private rootItems(): readonly CxMenuItem[] {
    const groups = this.groupsState();
    if (groups.length === 0) {
      return this.itemsState();
    }
    return groups.flatMap(group => group.items);
  }

  private findShortcutItem(items: readonly CxResolvedMenuItem[], event: KeyboardEvent): CxResolvedMenuItem | undefined {
    for (const item of items) {
      if (item.shortcutParts && eventMatchesShortcut(item.shortcutParts, event)) {
        return item;
      }
      const childMatch = item.items ? this.findShortcutItem(item.items, event) : undefined;
      if (childMatch) {
        return childMatch;
      }
    }
    return undefined;
  }
}
