import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { eventMatchesShortcut, isTypingTarget } from '../../actions/shared/shortcuts';
import { CxOptionComponent } from '../cx-option';
import { CxOptionGroupComponent } from '../cx-option-group';
import { CxPopoverComponent } from '../cx-popover';
import { measureCxFloatingSurface } from '../floating-surface';

export type CxMenuPriority = 'default' | 'primary' | 'secondary';
export type CxMenuLayout = 'inline' | 'fill';
export type CxMenuSelection = 'single' | 'multiple';

export type CxMenuItem = {
  id: string;
  label: string;
  prependIcon?: CxIconName;
  appendIcon?: CxIconName;
  description?: string;
  hint?: string;
  disabled?: boolean;
  selected?: boolean;
  trackSelection?: boolean;
  /** How this item's submenu tracks selection. Only read when the item has children. */
  selection?: CxMenuSelection;
  priority?: CxMenuPriority;
  danger?: boolean;
  shortcutParts?: readonly string[];
  dividerBefore?: boolean;
  dividerAfter?: boolean;
  items?: readonly CxMenuItem[];
  children?: readonly CxMenuItem[];
};

export type CxMenuGroup = {
  id?: string;
  label?: string;
  description?: string;
  /**
   * Declares the group as a choice group: 'single' announces items as
   * menuitemradio, 'multiple' as menuitemcheckbox, both with aria-checked.
   * Items with trackSelection: false stay plain menuitem actions.
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
    return {
      ...item,
      prependIcon: hasPrependIcons ? item.prependIcon : undefined,
      dividerBeforeResolved:
        index > 0 && ((item.dividerBefore ?? false) || (items[index - 1]?.dividerAfter ?? false)),
      hasChildren,
      role: resolveMenuItemRole(item, hasChildren, selection),
      items: hasChildren ? resolveMenuItems(childItemsFor(item), item.selection) : undefined,
    };
  });
}

function resolveMenuItemRole(
  item: CxMenuItem,
  hasChildren: boolean,
  selection: CxMenuSelection | undefined,
): CxMenuItemRole {
  // Submenu parents open a surface and trackSelection: false marks plain
  // actions inside choice groups; neither carries selection state.
  if (hasChildren || item.trackSelection === false) {
    return 'menuitem';
  }
  if (selection === 'multiple') {
    return 'menuitemcheckbox';
  }
  // A consumer that tracks selection per item (selected set explicitly, or
  // trackSelection: true) gets single-choice semantics without a group flag.
  if (selection === 'single' || item.selected !== undefined || item.trackSelection === true) {
    return 'menuitemradio';
  }
  return 'menuitem';
}

function childItemsFor(item: CxMenuItem): readonly CxMenuItem[] {
  return item.items ?? item.children ?? [];
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
  return groups.flatMap(group =>
    splitMenuItemsIntoVisualGroups(group.items, group.id, group.label, group.description),
  );
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
    input.viewportHeight - Math.min(input.estimatedHeight, input.viewportHeight - viewportPadding * 2) - viewportPadding,
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
export class CxMenuComponent implements AfterViewInit, OnDestroy {
  private static instanceCounter = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly instanceId = ++CxMenuComponent.instanceCounter;
  protected readonly scopeId = `cx-menu-${this.instanceId}`;
  protected readonly rootSurfaceId = `${this.scopeId}-surface`;
  private readonly itemsState = signal<CxMenuItem[]>([]);
  private readonly groupsState = signal<CxMenuGroup[]>([]);
  private readonly headingState = signal('');
  private readonly currentIdState = signal('none');
  private readonly shortcutsEnabledState = signal(false);
  private readonly openState = signal(false);
  private readonly hasTriggerState = signal(true);
  private readonly submenuSurfacesState = signal<CxMenuSubmenuSurface[]>([]);
  private readonly alignState = signal<'start' | 'end'>('end');
  private readonly layoutState = signal<CxMenuLayout>('inline');
  private readonly widthState = signal(240);
  private readonly surfaceTopState = signal<number | undefined>(undefined);
  private readonly surfaceBottomState = signal<number | undefined>(undefined);
  private readonly surfaceLeftState = signal<number | undefined>(undefined);
  private readonly surfaceMaxHeightState = signal<number | undefined>(undefined);
  private triggerElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;

  @ViewChild('triggerWrap', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLElement>;

  @ViewChild('rootPopover')
  private rootPopoverRef?: CxPopoverComponent;

  @Input() disabled = false;
  @Input() ariaLabel = 'Menu';

  @Input()
  public set heading(value: string | undefined) {
    this.headingState.set(value?.trim() ?? '');
  }

  @Input()
  public set items(value: readonly CxMenuItem[] | undefined) {
    this.itemsState.set([...(value ?? [])]);
  }

  @Input()
  public set menu(value: readonly CxMenuGroup[] | undefined) {
    this.groupsState.set([...(value ?? [])]);
  }

  @Input()
  public set groups(value: readonly CxMenuGroup[] | undefined) {
    this.groupsState.set([...(value ?? [])]);
  }

  @Input()
  public set currentId(value: string | undefined) {
    this.currentIdState.set(value?.trim() || 'none');
  }

  @Input()
  public set shortcutsEnabled(value: boolean) {
    this.shortcutsEnabledState.set(value);
  }

  @Input()
  public set open(value: boolean) {
    this.openState.set(value);
    if (value) {
      queueMicrotask(() => {
        this.syncSurfaceMetrics();
      });
      return;
    }
    this.submenuSurfacesState.set([]);
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

  protected readonly hasTrigger$ = this.hasTriggerState.asReadonly();
  protected readonly isOpen$ = this.openState.asReadonly();
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

  ngAfterViewInit(): void {
    this.triggerElement = this.triggerRef?.nativeElement;
    const trigger = this.triggerElement;
    this.hasTriggerState.set(this.hasTriggerContent(trigger));
    if (!this.hasTriggerState()) {
      return;
    }
    if (!trigger || typeof ResizeObserver === 'undefined') {
      return;
    }
    if (this.openState()) {
      queueMicrotask(() => {
        this.syncSurfaceMetrics(trigger);
      });
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.openState()) {
        this.syncSurfaceMetrics();
      }
    });
    this.resizeObserver.observe(trigger);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected onTriggerClick(event: MouseEvent, trigger?: HTMLElement): void {
    event.preventDefault();
    if (this.disabled) {
      return;
    }
    // A click synthesised from keyboard activation (Enter/Space on the trigger
    // button) reports detail === 0; only then do we pull focus into the menu so
    // pointer-driven opens leave focus on the trigger.
    this.toggleOpen(trigger, event.detail === 0);
  }

  protected onTriggerKeydown(event: KeyboardEvent, trigger?: HTMLElement): void {
    if (this.disabled) {
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    // Enter/Space activation is handled natively through the trigger's click.
    event.preventDefault();
    if (!this.openState()) {
      this.syncSurfaceMetrics(trigger);
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
        const firstChildId = item.items?.[0]?.id;
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
    return (item.selected ?? false) || this.currentIdState() === item.id;
  }

  private activateItem(item: CxResolvedMenuItem): void {
    if (item.role === 'menuitemcheckbox') {
      // A toggle is not the menu's current choice, and closing after each
      // toggle would make multi-select menus unusable.
      this.itemSelect.emit(item.id);
      return;
    }
    if (item.trackSelection !== false) {
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
    this.closeSurface();
    if (focusWasInside && this.hasTriggerState()) {
      this.focusTrigger();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.shortcutsEnabledState() || !this.isSurfaceActive() || isTypingTarget(event.target)) {
      return;
    }
    const item = this.findShortcutItem(this.normalizedGroups$().flatMap(group => group.items), event);
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

  private toggleOpen(trigger?: HTMLElement, focusFirstOption = false): void {
    const nextOpen = !this.openState();
    if (nextOpen) {
      this.syncSurfaceMetrics(trigger);
    }
    this.setOpen(nextOpen);
    if (nextOpen && focusFirstOption) {
      this.focusWhenReady(() => this.optionButtonsInSurface(this.rootSurfaceElement())[0] ?? null);
    }
  }

  protected setOpen(nextOpen: boolean): void {
    this.openState.set(nextOpen);
    if (!nextOpen) {
      this.submenuSurfacesState.set([]);
    }
    this.openChange.emit(nextOpen);
  }

  private syncSurfaceMetrics(trigger?: HTMLElement): void {
    if (trigger) {
      this.triggerElement = trigger;
    }
    const activeTrigger = this.triggerElement;
    if (!activeTrigger || typeof window === 'undefined') {
      return;
    }

    const rect = activeTrigger.getBoundingClientRect();
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: this.widthState(),
      estimatedHeight: estimateMenuSurfaceHeight(this.rootItems()),
      align: this.alignState(),
    });

    this.surfaceLeftState.set(surface.left);
    this.surfaceTopState.set(surface.top);
    this.surfaceBottomState.set(surface.bottom);
    this.surfaceMaxHeightState.set(surface.maxHeight);
    this.syncSubmenuSurfaceMetrics();
  }

  private openSubmenu(
    item: CxResolvedMenuItem,
    level: number,
    itemPath: string,
    anchorElement: HTMLElement,
  ): void {
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

    this.submenuSurfacesState.set([
      ...this.submenuSurfacesState().filter(existingSurface => existingSurface.level < nextSurface.level),
      nextSurface,
    ]);
  }

  private trimSubmenus(level: number): void {
    this.submenuSurfacesState.set(
      this.submenuSurfacesState().filter(existingSurface => existingSurface.level <= level),
    );
  }

  private updateCurrentId(itemId: string): void {
    if (this.currentIdState() === itemId) {
      return;
    }
    this.currentIdState.set(itemId);
    this.currentIdChange.emit(itemId);
  }

  private closeSurface(): void {
    if (this.hasTriggerState()) {
      this.setOpen(false);
      return;
    }
    this.submenuSurfacesState.set([]);
  }

  private isSurfaceActive(): boolean {
    return this.openState() || !this.hasTriggerState();
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
    this.submenuSurfacesState.set(refreshedSurfaces);
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
    if (!this.hasTriggerState()) {
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
    return Array.from(
      surface.querySelectorAll<HTMLElement>('.cx-menu__option-wrap .cx-option'),
    ).filter(button => !button.hasAttribute('disabled'));
  }

  private optionButtonByPath(path: string): HTMLElement | null {
    return this.optionWrapByPath(path)?.querySelector<HTMLElement>('.cx-option') ?? null;
  }

  private optionWrapByPath(path: string): HTMLElement | null {
    for (const surface of this.menuSurfaceElements()) {
      const option = Array.from(surface.querySelectorAll<HTMLElement>('[data-menu-item-path]'))
        .find(element =>
          element.getAttribute('data-cx-menu-scope') === this.scopeId
          && element.getAttribute('data-menu-item-path') === path,
        );
      if (option) {
        return option;
      }
    }
    return null;
  }

  private focusWhenReady(resolve: () => HTMLElement | null, attempt = 0): void {
    if (typeof requestAnimationFrame === 'undefined') {
      resolve()?.focus();
      return;
    }
    const target = resolve();
    if (target) {
      target.focus();
      return;
    }
    if (attempt >= 12) {
      return;
    }
    requestAnimationFrame(() => this.focusWhenReady(resolve, attempt + 1));
  }

  private focusTrigger(): void {
    const focusable = this.triggerElement?.querySelector<HTMLElement>('button, [tabindex]');
    focusable?.focus();
  }

  private rootItems(): readonly CxMenuItem[] {
    const groups = this.groupsState();
    if (groups.length === 0) {
      return this.itemsState();
    }
    return groups.flatMap(group => group.items);
  }

  private hasTriggerContent(trigger?: HTMLElement): boolean {
    if (!trigger) {
      return false;
    }
    return Array.from(trigger.childNodes).some(
      node => node.nodeType === 1 || (node.textContent?.trim().length ?? 0) > 0,
    );
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
