import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  UrlTree,
  type IsActiveMatchOptions,
  type Params,
  type QueryParamsHandling,
} from '@angular/router';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxMenuComponent, type CxMenuItem, type CxMenuPresentation } from '../../primitives/overlay/cx-menu';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip';
import { assertCompatibleSideNavUrlTreeExtras } from './cx-side-nav.validation';

export type CxSideNavBadgeTone = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export type CxSideNavItem = {
  id: string;
  label: string;
  /**
   * Icon for a top-level row only. Nested rows are identified by the tree
   * guide instead, so setting an icon on a sub item is rejected — see
   * {@link CxSideNavGroup} for what counts as nested.
   */
  icon?: CxIconName;
  badge?: string | number | boolean;
  badgeTone?: CxSideNavBadgeTone;
  disabled?: boolean;
  children?: CxSideNavItem[];
  /** Router target — renders the item as an `<a routerLink>`, e.g. `['/dashboard']`. */
  routerLink?: string | readonly unknown[] | UrlTree;
  /** Query parameters included in the router destination. */
  queryParams?: Params;
  /** How the destination combines its query parameters with the current URL. */
  queryParamsHandling?: QueryParamsHandling;
  /** Optional URL fragment (e.g. a scrollable section on a workbench page). */
  fragment?: string;
  /** How `routerLinkActive` decides this item is active. Defaults to Angular's exact destination matching. */
  routerLinkActiveOptions?: { exact: boolean } | IsActiveMatchOptions;
  /**
   * External link target. When set, the item renders as a plain `<a href>`
   * instead of an in-app router link — use it to point at a different app or
   * open a destination in a new browser tab (see {@link target}).
   */
  href?: string;
  /** Anchor target for {@link href}, e.g. `'_blank'` to open in a new tab. */
  target?: string;
  /** Anchor `rel` for {@link href}; defaults to `'noopener'` for `_blank`. */
  rel?: string;
};

/**
 * A section of the nav. A labelled `collapsible` group renders a parent row
 * that opens and closes, which makes its items *nested* — they lose their icon
 * and gain the tree guide. A group that is only labelled renders a plain
 * heading, so its items stay top-level and keep their icons.
 *
 * Groups start closed, with one exception: the group holding the active route
 * starts open, so landing on or reloading a sub page keeps its section
 * unfolded. An explicit user toggle always wins over that default.
 */
export type CxSideNavGroup = {
  id: string;
  label?: string;
  icon?: CxIconName;
  collapsible?: boolean;
  items: CxSideNavItem[];
};

const DEFAULT_ACTIVE_OPTIONS: { exact: boolean } = { exact: true };

@Component({
  selector: 'cx-side-nav',
  imports: [
    NgTemplateOutlet,
    CxIconButtonComponent,
    CxIconComponent,
    CxMenuComponent,
    CxTooltipDirective,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './cx-side-nav.component.html',
  styleUrl: './cx-side-nav.component.scss',
  host: {
    '[class.cx-side-nav-host--loading]': 'loading',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSideNavComponent {
  private itemsValue: CxSideNavItem[] = [];
  private groupsValue: CxSideNavGroup[] = [];

  @Input()
  public set items(value: CxSideNavItem[]) {
    this.itemsValue = validateSideNavItems(value, 'items');
  }
  public get items(): CxSideNavItem[] {
    return this.itemsValue;
  }

  @Input()
  public set groups(value: CxSideNavGroup[]) {
    this.groupsValue = validateSideNavGroups(value);
  }
  public get groups(): CxSideNavGroup[] {
    return this.groupsValue;
  }

  @Input() name = '';
  @Input() initials = '';
  @Input() navbarVisible = true;
  @Input() loading = false;
  /** Renders the collapse toggle at the end of the header row. */
  @Input() collapsible = false;
  /**
   * Rail state: only top-level icons remain, each described by an instant
   * tooltip. Two-way bindable so the consumer can persist the choice.
   */
  @Input() collapsed = false;

  @Output() readonly itemSelect = new EventEmitter<CxSideNavItem>();
  @Output() readonly collapsedChange = new EventEmitter<boolean>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly skeletonItems = Array.from({ length: 7 }, (_, index) => `skeleton-${index}`);

  // Tracks the active URL so router-derived state (a group "contains the active
  // item", and therefore its auto-expansion) re-evaluates whenever navigation
  // settles. Per-item active styling + aria-current are owned by the
  // routerLinkActive directives in the template.
  private readonly activeUrl = signal(this.router.url);

  /** Explicit user expand/collapse choices, keyed by group id. */
  private expandedGroups: Record<string, boolean> = {};
  /** Explicit user expand/collapse choices, keyed by item id. */
  private expandedItems: Record<string, boolean> = {};

  /**
   * The rail's stand-in for in-place expansion: one flyout menu beside the
   * clicked parent row, carrying that section's items. `source` keeps the
   * original nav items so a selection navigates with full link semantics.
   */
  protected readonly flyout = signal<{
    nodeId: string;
    heading: string;
    source: readonly CxSideNavItem[];
    items: CxMenuItem[];
    currentId: string | undefined;
    presentation: CxMenuPresentation;
  } | null>(null);

  constructor() {
    const subscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activeUrl.set(this.router.url);
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected normalizedGroups(): CxSideNavGroup[] {
    if (this.groups.length > 0) {
      return this.groups;
    }
    return [{ id: 'default', items: this.items }];
  }

  protected hasNavigationItems(): boolean {
    return this.groups.length > 0 || this.items.length > 0;
  }

  protected activeOptions(item: CxSideNavItem): { exact: boolean } | IsActiveMatchOptions {
    return item.routerLinkActiveOptions ?? DEFAULT_ACTIVE_OPTIONS;
  }

  /**
   * True when the group renders its own parent row. Such a group owns the
   * nesting: its items sit one level in, behind the tree guide.
   */
  protected hasGroupToggle(group: CxSideNavGroup): boolean {
    return Boolean(group.collapsible && group.label);
  }

  /** Nesting level the group's own items start at — 1 behind a parent row. */
  protected groupItemLevel(group: CxSideNavGroup): number {
    return this.hasGroupToggle(group) ? 1 : 0;
  }

  // Collapsed is the starting state, except for the group holding the active
  // route: it derives open from the URL, so entering or reloading a sub page
  // keeps its section unfolded without anything being persisted. An explicit
  // user toggle overrides the derived default, and a collapsed parent row
  // still carries the active highlight so the section stays identifiable.
  protected isGroupExpanded(group: CxSideNavGroup): boolean {
    if (!group.collapsible) {
      return true;
    }
    return this.expandedGroups[group.id] ?? this.groupContainsActive(group);
  }

  protected groupContainsActive(group: CxSideNavGroup): boolean {
    return group.items.some(item => this.itemContainsActive(item));
  }

  // The rail cannot draw nested rows, so while collapsed every sub-tree stays
  // visually closed. The underlying expansion choices are kept, which is what
  // lets expanding the nav restore exactly the sections that were open.
  protected showGroupItems(group: CxSideNavGroup): boolean {
    return !group.collapsible || (!this.collapsed && this.isGroupExpanded(group));
  }

  protected toggleGroup(group: CxSideNavGroup, event?: Event): void {
    if (!group.collapsible) {
      return;
    }
    // A rail parent row cannot unfold in place: its section opens as a flyout
    // beside the rail instead, and the nav stays collapsed.
    if (this.collapsed) {
      this.openFlyout(group.id, group.label ?? '', group.items, event);
      return;
    }
    const nextExpanded = !this.isGroupExpanded(group);
    this.expandedGroups = this.normalizedGroups().reduce<Record<string, boolean>>((expandedGroups, candidate) => {
      if (candidate.collapsible) {
        expandedGroups[candidate.id] = candidate.id === group.id ? nextExpanded : false;
      }
      return expandedGroups;
    }, {});
  }

  protected hasChildren(item: CxSideNavItem): boolean {
    return (item.children?.length ?? 0) > 0;
  }

  /** See {@link isGroupExpanded} — a nested parent holding the active route derives open too. */
  protected isItemExpanded(item: CxSideNavItem): boolean {
    if (!this.hasChildren(item)) {
      return false;
    }
    return this.expandedItems[item.id] ?? this.itemContainsActive(item);
  }

  protected showItemChildren(item: CxSideNavItem): boolean {
    return this.hasChildren(item) && !this.collapsed && this.isItemExpanded(item);
  }

  protected toggleItem(item: CxSideNavItem, event?: Event): void {
    if (item.disabled || !this.hasChildren(item)) {
      return;
    }
    if (this.collapsed) {
      this.openFlyout(item.id, item.label, item.children ?? [], event);
      return;
    }
    this.expandedItems = {
      ...this.expandedItems,
      [item.id]: !this.isItemExpanded(item),
    };
  }

  protected toggleCollapsed(): void {
    this.setCollapsed(!this.collapsed);
  }

  /** Rail stand-in for a top-level row without an icon, so no destination vanishes. */
  protected railInitial(label: string): string {
    return this.firstInitial(label);
  }

  protected isFlyoutOpen(nodeId: string): boolean {
    return this.flyout()?.nodeId === nodeId;
  }

  protected onFlyoutOpenChange(open: boolean): void {
    if (!open) {
      this.flyout.set(null);
    }
  }

  protected onFlyoutSelect(itemId: string): void {
    const flyout = this.flyout();
    this.flyout.set(null);
    const item = flyout ? findSideNavItem(flyout.source, itemId) : undefined;
    if (!item || item.disabled) {
      return;
    }
    if (item.href) {
      if (item.target === '_blank') {
        window.open(item.href, '_blank', item.rel ?? 'noopener');
      } else {
        window.location.assign(item.href);
      }
    } else if (item.routerLink !== undefined) {
      void this.router.navigateByUrl(this.destinationTree(item));
    }
    this.itemSelect.emit(item);
  }

  private openFlyout(nodeId: string, heading: string, items: readonly CxSideNavItem[], event?: Event): void {
    const origin = event?.currentTarget;
    if (!(origin instanceof HTMLElement) || items.length === 0) {
      return;
    }
    const rect = origin.getBoundingClientRect();
    this.flyout.set({
      nodeId,
      heading,
      source: items,
      items: items.map(item => toFlyoutMenuItem(item)),
      currentId: this.findActiveFlyoutId(items),
      presentation: { kind: 'context', left: rect.right, top: rect.top, owner: origin },
    });
  }

  private findActiveFlyoutId(items: readonly CxSideNavItem[]): string | undefined {
    for (const item of items) {
      if (this.isItemActive(item)) {
        return item.id;
      }
      const childId = item.children?.length ? this.findActiveFlyoutId(item.children) : undefined;
      if (childId) {
        return childId;
      }
    }
    return undefined;
  }

  private setCollapsed(collapsed: boolean): void {
    if (this.collapsed === collapsed) {
      return;
    }
    this.collapsed = collapsed;
    this.flyout.set(null);
    this.collapsedChange.emit(collapsed);
  }

  protected itemContainsActive(item: CxSideNavItem): boolean {
    this.activeUrl(); // establish the navigation dependency for OnPush
    if (this.isItemActive(item)) {
      return true;
    }
    return item.children?.some(child => this.itemContainsActive(child)) ?? false;
  }

  protected badgeLabel(item: CxSideNavItem): string {
    if (item.badge === true) {
      return '';
    }
    if (item.badge === false || item.badge === undefined) {
      return '';
    }
    return String(item.badge);
  }

  protected hasBadge(item: CxSideNavItem): boolean {
    // A finite number counts as visible even at 0; a string must be non-blank.
    if (typeof item.badge === 'number') return Number.isFinite(item.badge);
    if (typeof item.badge === 'string') return item.badge.trim().length > 0;
    return item.badge === true;
  }

  protected badgeTone(item: CxSideNavItem): CxSideNavBadgeTone {
    return item.badgeTone ?? 'info';
  }

  protected accountName(): string {
    return this.name.trim();
  }

  protected accountInitials(): string {
    const explicitInitials = this.initials.trim();
    if (explicitInitials) {
      return Array.from(explicitInitials).slice(0, 2).join('').toUpperCase();
    }
    const parts = this.accountName().split(/[\s-]+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    if (parts.length === 1) {
      return this.firstInitial(parts[0]);
    }
    return `${this.firstInitial(parts[0])}${this.firstInitial(parts[parts.length - 1])}`;
  }

  protected onItemClick(event: MouseEvent, item: CxSideNavItem): void {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.itemSelect.emit(item);
  }

  private isItemActive(item: CxSideNavItem): boolean {
    if (item.disabled || item.routerLink === undefined) {
      return false;
    }
    const tree = this.destinationTree(item);
    const options = this.activeOptions(item);
    return typeof (options as { exact?: unknown }).exact === 'boolean'
      ? this.router.isActive(tree, (options as { exact: boolean }).exact)
      : this.router.isActive(tree, options as IsActiveMatchOptions);
  }

  /** The one destination an item declares — shared by active matching and flyout navigation. */
  private destinationTree(item: CxSideNavItem): UrlTree {
    return item.routerLink instanceof UrlTree
      ? item.routerLink
      : this.router.createUrlTree(Array.isArray(item.routerLink) ? [...item.routerLink] : [item.routerLink], {
          relativeTo: this.route,
          queryParams: item.queryParams,
          queryParamsHandling: item.queryParamsHandling,
          fragment: item.fragment,
        });
  }

  private firstInitial(value: string): string {
    return Array.from(value.trim()).find(char => /\p{L}|\p{N}/u.test(char))?.toUpperCase() ?? '';
  }
}

/** Rail flyout row: same identity and nesting, menu vocabulary. Children carry no icons by contract. */
function toFlyoutMenuItem(item: CxSideNavItem): CxMenuItem {
  return {
    id: item.id,
    label: item.label,
    ...(item.disabled ? { disabled: true } : {}),
    ...(item.children?.length ? { items: item.children.map(child => toFlyoutMenuItem(child)) } : {}),
  };
}

function findSideNavItem(items: readonly CxSideNavItem[], id: string): CxSideNavItem | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    const child = item.children?.length ? findSideNavItem(item.children, id) : undefined;
    if (child) {
      return child;
    }
  }
  return undefined;
}

function validateSideNavItems(value: CxSideNavItem[], inputName: string): CxSideNavItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`[cx-side-nav] ${inputName} must be an array.`);
  }
  validateSideNavItemLevel(value, inputName, new Set<string>(), 0);
  return [...value];
}

function validateSideNavItemLevel(
  items: readonly CxSideNavItem[],
  path: string,
  ids: Set<string>,
  level: number,
): void {
  const labels = new Set<string>();
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    const id = typeof item?.id === 'string' ? item.id.trim() : '';
    if (!id) {
      throw new Error(`[cx-side-nav] ${itemPath} requires a non-empty id.`);
    }
    if (ids.has(id)) {
      throw new Error(`[cx-side-nav] item id "${id}" must be unique.`);
    }
    ids.add(id);

    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    const labelKey = label.toLowerCase();
    if (labels.has(labelKey)) {
      throw new Error(`[cx-side-nav] item label "${label}" must be unique within ${path}.`);
    }
    labels.add(labelKey);

    // The tree guide is the nesting signal below the top level; an icon there
    // would compete with it and break the label alignment. Rejected rather than
    // dropped silently so the consumer learns where icons belong.
    if (level > 0 && item.icon !== undefined) {
      throw new Error(
        `[cx-side-nav] ${itemPath} must not set an icon. Nested items are marked by the tree guide — icons belong to top-level items and group parent rows.`,
      );
    }

    assertCompatibleSideNavUrlTreeExtras(item, itemPath);

    if (item.children !== undefined) {
      if (!Array.isArray(item.children)) {
        throw new Error(`[cx-side-nav] ${itemPath}.children must be an array.`);
      }
      validateSideNavItemLevel(item.children, `${itemPath}.children`, ids, level + 1);
    }
  });
}

function validateSideNavGroups(value: CxSideNavGroup[]): CxSideNavGroup[] {
  if (!Array.isArray(value)) {
    throw new Error('[cx-side-nav] groups must be an array.');
  }

  const groupIds = new Set<string>();
  const groupLabels = new Set<string>();
  const itemIds = new Set<string>();
  value.forEach((group, index) => {
    const path = `groups[${index}]`;
    const id = typeof group?.id === 'string' ? group.id.trim() : '';
    if (!id) {
      throw new Error(`[cx-side-nav] ${path} requires a non-empty id.`);
    }
    if (groupIds.has(id)) {
      throw new Error(`[cx-side-nav] group id "${id}" must be unique.`);
    }
    groupIds.add(id);

    const label = typeof group?.label === 'string' ? group.label.trim() : '';
    // A collapsible group's label *is* its parent row; without one there is no
    // control to open it and the items would be unreachable.
    if (group.collapsible && !label) {
      throw new Error(`[cx-side-nav] group "${id}" is collapsible and needs a label to act as its parent row.`);
    }
    if (label) {
      const labelKey = label.toLowerCase();
      if (groupLabels.has(labelKey)) {
        throw new Error(`[cx-side-nav] group label "${label}" must be unique.`);
      }
      groupLabels.add(labelKey);
    }

    if (!Array.isArray(group.items) || group.items.length === 0) {
      throw new Error(`[cx-side-nav] group "${id}" requires at least one item.`);
    }
    // A labelled collapsible group owns a parent row, so its items are already
    // one level in and must follow the nested rules.
    validateSideNavItemLevel(group.items, `${path}.items`, itemIds, group.collapsible && label ? 1 : 0);
  });

  return [...value];
}
