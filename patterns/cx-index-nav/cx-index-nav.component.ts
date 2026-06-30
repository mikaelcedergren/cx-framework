import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';
import { type CxIconName } from '../../icons/manifest';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxSearchFieldComponent } from '../../primitives/inputs/cx-search-field';

export type CxIndexNavBadgeTone = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export type CxIndexNavItem = {
  id: string;
  label: string;
  /** Text the filter matches against. Defaults to {@link label} when omitted. */
  searchText?: string;
  badge?: string | number | boolean;
  badgeTone?: CxIndexNavBadgeTone;
  disabled?: boolean;
  /** Router target — renders the item as an in-app `<a routerLink>`. */
  routerLink?: string | readonly unknown[];
  /** Optional URL fragment (e.g. an on-page section). */
  fragment?: string;
  /** How `routerLinkActive` decides this item is the current page. Defaults to exact-path. */
  routerLinkActiveOptions?: { exact: boolean } | IsActiveMatchOptions;
  /** Plain link target; renders an `<a href>` instead of a router link. */
  href?: string;
  target?: string;
  rel?: string;
  /**
   * Marks the item active for selection-driven usage (plain items with neither
   * `routerLink` nor `href`). Router items derive active state automatically.
   */
  active?: boolean;
};

export type CxIndexNavGroup = {
  id: string;
  /** Folder heading. Omit for an unlabeled (flat) group. */
  label?: string;
  /** Folder icon; defaults to `folder` when the group has a label. */
  icon?: CxIconName;
  /** When true, the folder can be expanded/collapsed. Defaults to always-open. */
  collapsible?: boolean;
  /** Initial open state for a collapsible folder. Defaults to open. */
  defaultExpanded?: boolean;
  items: CxIndexNavItem[];
};

const DEFAULT_ACTIVE_OPTIONS: { exact: boolean } = { exact: true };

let nextBodyId = 0;

/**
 * Secondary, contextual side navigation — a sibling of `cx-side-nav` that opens
 * beside the main navigation and lists the contents of the active section
 * (e.g. an article index under a category). It carries a built-in filter,
 * collapsible folders, and a single active item, and the whole panel can
 * compress to a thin rail to give the content full width.
 *
 * It owns its own width via `--cx-index-nav-width` / `--cx-index-nav-collapsed-width`,
 * so hosting it in an `auto`-width grid track or a `flex: 0 0 auto` column lets
 * the column animate as the panel collapses.
 */
@Component({
  selector: 'cx-index-nav',
  imports: [NgTemplateOutlet, CxIconComponent, CxIconButtonComponent, CxSearchFieldComponent, RouterLink, RouterLinkActive],
  templateUrl: './cx-index-nav.component.html',
  styleUrl: './cx-index-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxIndexNavComponent {
  /** Title shown above the panel; doubles as the filter field's label. */
  @Input() heading = '';
  /** Folders of contextual items. A single unlabeled group renders as a flat list. */
  @Input() groups: CxIndexNavGroup[] = [];
  /** Accessible label for the navigation landmark. */
  @Input() ariaLabel = 'Section navigation';
  /** Show the built-in filter field. */
  @Input({ transform: booleanAttribute }) filterable = true;
  /** Placeholder for the filter field. */
  @Input() filterPlaceholder = 'Filter';
  /** Message shown when the filter matches nothing. */
  @Input() emptyText = 'No matches';
  /** Show the skeleton loading state. */
  @Input({ transform: booleanAttribute }) loading = false;
  /** Allow the whole panel to compress to a rail. */
  @Input({ transform: booleanAttribute }) collapsible = true;

  /** Whole-panel collapsed state. Controllable; mirrors `collapsedChange`. */
  @Input({ transform: booleanAttribute })
  set collapsed(value: boolean) {
    this.collapsedState.set(value);
  }
  get collapsed(): boolean {
    return this.collapsedState();
  }

  /** Emits when the user collapses or expands the panel. */
  @Output() readonly collapsedChange = new EventEmitter<boolean>();
  /** Emits the activated item (selection-driven usage). */
  @Output() readonly itemSelect = new EventEmitter<CxIndexNavItem>();
  /** Emits the current filter query. */
  @Output() readonly queryChange = new EventEmitter<string>();

  protected readonly bodyId = `cx-index-nav-body-${nextBodyId++}`;
  protected readonly collapsedState = signal(false);
  protected readonly query = signal('');
  protected readonly skeletonItems = Array.from({ length: 8 }, (_, index) => `skeleton-${index}`);

  /** Explicit user expand/collapse choices, keyed by folder id. */
  private expandedGroups: Record<string, boolean> = {};

  protected visibleGroups(): CxIndexNavGroup[] {
    const groups = this.groups.length > 0 ? this.groups : [];
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return groups;
    }
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => (item.searchText ?? item.label).toLowerCase().includes(q)),
      }))
      .filter(group => group.items.length > 0);
  }

  protected isGroupExpanded(group: CxIndexNavGroup): boolean {
    if (!group.collapsible) {
      return true;
    }
    const override = this.expandedGroups[group.id];
    if (override !== undefined) {
      return override;
    }
    return group.defaultExpanded ?? true;
  }

  protected showGroupItems(group: CxIndexNavGroup): boolean {
    return !group.collapsible || this.isGroupExpanded(group);
  }

  protected toggleGroup(group: CxIndexNavGroup): void {
    if (!group.collapsible) {
      return;
    }
    this.expandedGroups = {
      ...this.expandedGroups,
      [group.id]: !this.isGroupExpanded(group),
    };
  }

  protected folderIcon(group: CxIndexNavGroup): CxIconName {
    return group.icon ?? 'folder';
  }

  protected activeOptions(item: CxIndexNavItem): { exact: boolean } | IsActiveMatchOptions {
    return item.routerLinkActiveOptions ?? DEFAULT_ACTIVE_OPTIONS;
  }

  protected badgeLabel(item: CxIndexNavItem): string {
    if (item.badge === true || item.badge === false || item.badge === undefined) {
      return '';
    }
    return String(item.badge);
  }

  protected badgeTone(item: CxIndexNavItem): CxIndexNavBadgeTone {
    return item.badgeTone ?? 'info';
  }

  protected toggleCollapsed(): void {
    const next = !this.collapsedState();
    this.collapsedState.set(next);
    this.collapsedChange.emit(next);
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.queryChange.emit(value);
  }

  protected onItemClick(event: MouseEvent, item: CxIndexNavItem): void {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.itemSelect.emit(item);
  }
}
