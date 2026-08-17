import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';
import { type CxIconName } from '../../icons/manifest';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip';

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
  routerLink?: string | readonly unknown[];
  /** Optional URL fragment (e.g. a scrollable section on a workbench page). */
  fragment?: string;
  /** How `routerLinkActive` decides this item is active. Defaults to exact-path. */
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
 * Groups always start closed; expansion is a user action, never a default.
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
  imports: [NgTemplateOutlet, CxIconComponent, CxTooltipDirective, RouterLink, RouterLinkActive],
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

  @Output() readonly itemSelect = new EventEmitter<CxSideNavItem>();

  private readonly router = inject(Router);
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

  // Collapsed is the only starting state: a group opens because the user opened
  // it, never because it happens to hold the active route. The collapsed parent
  // row still carries the active highlight, so the section is identifiable
  // without being unfolded.
  protected isGroupExpanded(group: CxSideNavGroup): boolean {
    if (!group.collapsible) {
      return true;
    }
    return this.expandedGroups[group.id] ?? false;
  }

  protected groupContainsActive(group: CxSideNavGroup): boolean {
    this.activeUrl(); // establish the navigation dependency for OnPush
    return group.items.some(item => this.itemContainsActive(item));
  }

  protected showGroupItems(group: CxSideNavGroup): boolean {
    return !group.collapsible || this.isGroupExpanded(group);
  }

  protected toggleGroup(group: CxSideNavGroup): void {
    if (!group.collapsible) {
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

  /** See {@link isGroupExpanded} — nested parents start closed for the same reason. */
  protected isItemExpanded(item: CxSideNavItem): boolean {
    if (!this.hasChildren(item)) {
      return false;
    }
    return this.expandedItems[item.id] ?? false;
  }

  protected showItemChildren(item: CxSideNavItem): boolean {
    return this.hasChildren(item) && this.isItemExpanded(item);
  }

  protected toggleItem(item: CxSideNavItem): void {
    if (item.disabled || !this.hasChildren(item)) {
      return;
    }
    this.expandedItems = {
      ...this.expandedItems,
      [item.id]: !this.isItemExpanded(item),
    };
  }

  protected itemContainsActive(item: CxSideNavItem): boolean {
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
    const commands = Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink];
    const tree = this.router.createUrlTree([...commands], { fragment: item.fragment });
    const options = this.activeOptions(item);
    return typeof (options as { exact?: unknown }).exact === 'boolean'
      ? this.router.isActive(tree, (options as { exact: boolean }).exact)
      : this.router.isActive(tree, options as IsActiveMatchOptions);
  }

  private firstInitial(value: string): string {
    return Array.from(value.trim()).find(char => /\p{L}|\p{N}/u.test(char))?.toUpperCase() ?? '';
  }
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
