import { EventEmitter } from '@angular/core';
import { UrlTree, type IsActiveMatchOptions, type Params, type QueryParamsHandling } from '@angular/router';
import { type CxIconName } from '../../icons/manifest';
import { type CxMenuItem, type CxMenuPresentation } from '../../primitives/overlay/cx-menu';
import * as i0 from "@angular/core";
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
    routerLinkActiveOptions?: {
        exact: boolean;
    } | IsActiveMatchOptions;
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
export declare class CxSideNavComponent {
    private itemsValue;
    private groupsValue;
    set items(value: CxSideNavItem[]);
    get items(): CxSideNavItem[];
    set groups(value: CxSideNavGroup[]);
    get groups(): CxSideNavGroup[];
    name: string;
    initials: string;
    navbarVisible: boolean;
    loading: boolean;
    /** Renders the collapse toggle at the end of the header row. */
    collapsible: boolean;
    /**
     * Rail state: only top-level icons remain, each described by an instant
     * tooltip. Two-way bindable so the consumer can persist the choice.
     */
    collapsed: boolean;
    readonly itemSelect: EventEmitter<CxSideNavItem>;
    readonly collapsedChange: EventEmitter<boolean>;
    private readonly router;
    private readonly route;
    private readonly destroyRef;
    protected readonly skeletonItems: string[];
    private readonly activeUrl;
    /** Explicit user expand/collapse choices, keyed by group id. */
    private expandedGroups;
    /** Explicit user expand/collapse choices, keyed by item id. */
    private expandedItems;
    /**
     * The rail's stand-in for in-place expansion: one flyout menu beside the
     * clicked parent row, carrying that section's items. `source` keeps the
     * original nav items so a selection navigates with full link semantics.
     */
    protected readonly flyout: import("@angular/core").WritableSignal<{
        nodeId: string;
        heading: string;
        source: readonly CxSideNavItem[];
        items: CxMenuItem[];
        currentId: string | undefined;
        presentation: CxMenuPresentation;
    } | null>;
    constructor();
    protected normalizedGroups(): CxSideNavGroup[];
    protected hasNavigationItems(): boolean;
    protected activeOptions(item: CxSideNavItem): {
        exact: boolean;
    } | IsActiveMatchOptions;
    /**
     * True when the group renders its own parent row. Such a group owns the
     * nesting: its items sit one level in, behind the tree guide.
     */
    protected hasGroupToggle(group: CxSideNavGroup): boolean;
    /** Nesting level the group's own items start at — 1 behind a parent row. */
    protected groupItemLevel(group: CxSideNavGroup): number;
    protected isGroupExpanded(group: CxSideNavGroup): boolean;
    protected groupContainsActive(group: CxSideNavGroup): boolean;
    protected showGroupItems(group: CxSideNavGroup): boolean;
    protected toggleGroup(group: CxSideNavGroup, event?: Event): void;
    protected hasChildren(item: CxSideNavItem): boolean;
    /** See {@link isGroupExpanded} — a nested parent holding the active route derives open too. */
    protected isItemExpanded(item: CxSideNavItem): boolean;
    protected showItemChildren(item: CxSideNavItem): boolean;
    protected toggleItem(item: CxSideNavItem, event?: Event): void;
    protected toggleCollapsed(): void;
    /** Rail stand-in for a top-level row without an icon, so no destination vanishes. */
    protected railInitial(label: string): string;
    protected isFlyoutOpen(nodeId: string): boolean;
    protected onFlyoutOpenChange(open: boolean): void;
    protected onFlyoutSelect(itemId: string): void;
    private openFlyout;
    private findActiveFlyoutId;
    private setCollapsed;
    protected itemContainsActive(item: CxSideNavItem): boolean;
    protected badgeLabel(item: CxSideNavItem): string;
    protected hasBadge(item: CxSideNavItem): boolean;
    protected badgeTone(item: CxSideNavItem): CxSideNavBadgeTone;
    protected accountName(): string;
    protected accountInitials(): string;
    protected onItemClick(event: MouseEvent, item: CxSideNavItem): void;
    private isItemActive;
    /** The one destination an item declares — shared by active matching and flyout navigation. */
    private destinationTree;
    private firstInitial;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSideNavComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSideNavComponent, "cx-side-nav", never, { "items": { "alias": "items"; "required": false; }; "groups": { "alias": "groups"; "required": false; }; "name": { "alias": "name"; "required": false; }; "initials": { "alias": "initials"; "required": false; }; "navbarVisible": { "alias": "navbarVisible"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "collapsible": { "alias": "collapsible"; "required": false; }; "collapsed": { "alias": "collapsed"; "required": false; }; }, { "itemSelect": "itemSelect"; "collapsedChange": "collapsedChange"; }, never, ["[header]", "[footer]"], true, never>;
}
//# sourceMappingURL=cx-side-nav.component.d.ts.map