import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';
import { type CxIconName } from '../../icons/manifest';
import { CxIconComponent } from '../../primitives/media/cx-icon';

export type CxSideNavBadgeTone = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export type CxSideNavItem = {
  id: string;
  label: string;
  icon?: CxIconName;
  badge?: string | number | boolean;
  badgeTone?: CxSideNavBadgeTone;
  disabled?: boolean;
  defaultExpanded?: boolean;
  children?: CxSideNavItem[];
  /** Router target — renders the item as an `<a routerLink>`, e.g. `['/dashboard']`. */
  routerLink?: string | readonly unknown[];
  /** Optional URL fragment (e.g. a scrollable section on a workbench page). */
  fragment?: string;
  /** How `routerLinkActive` decides this item is active. Defaults to exact-path. */
  routerLinkActiveOptions?: { exact: boolean } | IsActiveMatchOptions;
};

export type CxSideNavGroup = {
  id: string;
  label?: string;
  icon?: CxIconName;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  items: CxSideNavItem[];
};

const DEFAULT_ACTIVE_OPTIONS: { exact: boolean } = { exact: true };

@Component({
  selector: 'cx-side-nav',
  imports: [NgTemplateOutlet, CxIconComponent, RouterLink, RouterLinkActive],
  templateUrl: './cx-side-nav.component.html',
  styleUrl: './cx-side-nav.component.scss',
  host: {
    '[class.cx-side-nav-host--hidden]': '!navbarVisible',
    '[class.cx-side-nav-host--loading]': 'loading',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSideNavComponent {
  @Input() items: CxSideNavItem[] = [];
  @Input() groups: CxSideNavGroup[] = [];
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

  protected activeOptions(item: CxSideNavItem): { exact: boolean } | IsActiveMatchOptions {
    return item.routerLinkActiveOptions ?? DEFAULT_ACTIVE_OPTIONS;
  }

  protected isGroupExpanded(group: CxSideNavGroup): boolean {
    if (!group.collapsible) {
      return !group.collapsible;
    }
    const override = this.expandedGroups[group.id];
    if (override !== undefined) {
      return override;
    }
    return (group.defaultExpanded ?? false) || this.groupContainsActive(group);
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
    this.expandedGroups = {
      ...this.expandedGroups,
      [group.id]: !this.isGroupExpanded(group),
    };
  }

  protected itemPadding(level: number): number | null {
    return 8 + Math.max(0, level) * 18;
  }

  protected hasChildren(item: CxSideNavItem): boolean {
    return (item.children?.length ?? 0) > 0;
  }

  protected isItemExpanded(item: CxSideNavItem): boolean {
    if (!this.hasChildren(item)) {
      return false;
    }
    const override = this.expandedItems[item.id];
    if (override !== undefined) {
      return override;
    }
    return (item.defaultExpanded ?? false) || this.itemContainsActive(item);
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
