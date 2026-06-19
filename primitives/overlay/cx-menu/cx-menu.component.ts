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
import { CommonModule } from '@angular/common';
import { type CxIconName } from '../../../icons/manifest';
import { CxMenuHeaderComponent } from '../cx-menu-header';
import { CxMenuLabelComponent } from '../cx-menu-label';
import { CxOptionComponent } from '../cx-option';
import { CxPopoverComponent } from '../cx-popover';
import { measureCxFloatingSurface } from '../floating-surface';

export type CxMenuPriority = 'default' | 'primary' | 'secondary';
export type CxMenuGroupVariant = 'label' | 'header';

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
  variant?: CxMenuGroupVariant;
  items: readonly CxMenuItem[];
};

type CxResolvedMenuItem = CxMenuItem & {
  prependIcon?: CxIconName;
  appendIcon?: CxIconName;
  dividerBeforeResolved: boolean;
  hasChildren: boolean;
  items?: CxResolvedMenuItem[];
};

type CxResolvedMenuGroup = Omit<CxMenuGroup, 'id' | 'items'> & {
  id: string;
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

function resolveMenuItems(items: readonly CxMenuItem[]): CxResolvedMenuItem[] {
  const hasPrependIcons = items.length > 0 && items.every(item => !!item.prependIcon);
  return items.map((item, index) => ({
    ...item,
    prependIcon: hasPrependIcons ? item.prependIcon : undefined,
    dividerBeforeResolved:
      index > 0 && ((item.dividerBefore ?? false) || (items[index - 1]?.dividerAfter ?? false)),
    hasChildren: childItemsFor(item).length > 0,
    items: childItemsFor(item).length > 0 ? resolveMenuItems(childItemsFor(item)) : undefined,
  }));
}

function childItemsFor(item: CxMenuItem): readonly CxMenuItem[] {
  return item.items ?? item.children ?? [];
}

function resolveMenuGroups(groups: readonly CxMenuGroup[]): CxResolvedMenuGroup[] {
  return groups.map((group, index) => ({
    ...group,
    id: group.id?.trim() || `group-${index}`,
    items: resolveMenuItems(group.items),
  }));
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
  imports: [CommonModule, CxMenuHeaderComponent, CxMenuLabelComponent, CxOptionComponent, CxPopoverComponent],
  templateUrl: './cx-menu.component.html',
  styleUrl: './cx-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMenuComponent implements AfterViewInit, OnDestroy {
  private static instanceCounter = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly instanceId = ++CxMenuComponent.instanceCounter;
  protected readonly scopeClass = `cx-menu__surface--scope-${this.instanceId}`;
  private readonly itemsState = signal<CxMenuItem[]>([]);
  private readonly groupsState = signal<CxMenuGroup[]>([]);
  private readonly headingState = signal('');
  private readonly currentIdState = signal('none');
  private readonly shortcutsEnabledState = signal(false);
  private readonly openState = signal(false);
  private readonly hasTriggerState = signal(true);
  private readonly submenuSurfacesState = signal<CxMenuSubmenuSurface[]>([]);
  private readonly alignState = signal<'start' | 'end'>('end');
  private readonly widthState = signal(240);
  private readonly surfaceTopState = signal<number | undefined>(undefined);
  private readonly surfaceBottomState = signal<number | undefined>(undefined);
  private readonly surfaceLeftState = signal<number | undefined>(undefined);
  private readonly surfaceMaxHeightState = signal<number | undefined>(undefined);
  private triggerElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;

  @ViewChild('triggerWrap', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLElement>;

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
  public set width(value: number) {
    this.widthState.set(Number.isFinite(value) ? Math.max(value, 160) : 240);
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly itemSelect = new EventEmitter<string>();
  @Output() readonly currentIdChange = new EventEmitter<string>();

  protected readonly hasTrigger$ = this.hasTriggerState.asReadonly();
  protected readonly isOpen$ = this.openState.asReadonly();
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
    this.updateCurrentId(item.id);
    this.itemSelect.emit(item.id);
    this.closeSurface();
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

  protected onResolvedItemFocused(item: CxResolvedMenuItem): void {
    if (item.disabled) {
      return;
    }
    this.updateCurrentId(item.id);
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
    const targetElement = target instanceof Element ? target : target.parentElement;
    if (targetElement?.closest(`.${this.scopeClass}`)) {
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
    const focusWasInside = active instanceof Element && !!active.closest(`.${this.scopeClass}`);
    this.closeSurface();
    if (focusWasInside && this.hasTriggerState()) {
      this.focusTrigger();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.shortcutsEnabledState() || !this.isSurfaceActive() || this.isTypingTarget(event.target)) {
      return;
    }
    const item = this.findShortcutItem(this.normalizedGroups$().flatMap(group => group.items), event);
    if (!item || item.disabled || item.hasChildren) {
      return;
    }
    event.preventDefault();
    this.updateCurrentId(item.id);
    this.itemSelect.emit(item.id);
    this.closeSurface();
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
      const anchorElement = document.querySelector(
        `.${this.scopeClass} [data-menu-item-path="${surface.path}"]`,
      ) as HTMLElement | null;
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
    return document.querySelector(`.${this.scopeClass}:not(.cx-menu__surface--submenu)`);
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
    if (typeof document === 'undefined') {
      return null;
    }
    return document.querySelector<HTMLElement>(
      `.${this.scopeClass} [data-menu-item-path="${path}"] .cx-option`,
    );
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
      if (item.shortcutParts && this.eventMatchesShortcut(item.shortcutParts, event)) {
        return item;
      }
      const childMatch = item.items ? this.findShortcutItem(item.items, event) : undefined;
      if (childMatch) {
        return childMatch;
      }
    }
    return undefined;
  }

  private eventMatchesShortcut(parts: readonly string[], event: KeyboardEvent): boolean {
    const normalizedParts = parts.map(part => part.trim().toLowerCase()).filter(Boolean);
    if (normalizedParts.length === 0) {
      return false;
    }
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    const wantsCtrl =
      normalizedParts.includes('ctrl') ||
      normalizedParts.includes('control') ||
      (!isMac && normalizedParts.includes('mod'));
    const wantsMeta =
      normalizedParts.includes('cmd') ||
      normalizedParts.includes('command') ||
      (isMac && normalizedParts.includes('mod'));
    const wantsAlt =
      normalizedParts.includes('alt') ||
      normalizedParts.includes('option') ||
      normalizedParts.includes('opt');
    const wantsShift = normalizedParts.includes('shift');
    if (
      event.ctrlKey !== wantsCtrl ||
      event.metaKey !== wantsMeta ||
      event.altKey !== wantsAlt ||
      event.shiftKey !== wantsShift
    ) {
      return false;
    }
    const keyPart = normalizedParts.find(
      part => !['mod', 'cmd', 'command', 'ctrl', 'control', 'alt', 'option', 'opt', 'shift'].includes(part),
    );
    return keyPart ? this.normalizeShortcutKey(event.key) === this.normalizeShortcutKey(keyPart) : false;
  }

  private normalizeShortcutKey(value: string): string {
    const key = value.trim().toLowerCase();
    if (key === 'esc') return 'escape';
    if (key === 'return') return 'enter';
    if (key === 'space') return ' ';
    return key;
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
    );
  }
}
