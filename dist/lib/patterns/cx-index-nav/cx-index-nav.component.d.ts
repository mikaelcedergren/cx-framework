import { EventEmitter } from '@angular/core';
import { type IsActiveMatchOptions } from '@angular/router';
import { type CxIconName } from '../../icons/manifest';
import * as i0 from "@angular/core";
export type CxIndexNavBadgeTone = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxIndexNavVariant = 'default' | 'transparent';
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
    routerLinkActiveOptions?: {
        exact: boolean;
    } | IsActiveMatchOptions;
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
/**
 * Secondary, contextual side navigation — a sibling of `cx-side-nav` that opens
 * beside the main navigation and lists the contents of the active section
 * (e.g. an article index under a category). It carries a built-in filter,
 * collapsible folders, and a single active item, and the whole panel can
 * compress to a thin rail to give the content full width.
 *
 * It owns its expanded width via `--cx-index-nav-width`; its collapsed width
 * follows the shared large control size. Hosting it in an `auto`-width grid
 * track or a `flex: 0 0 auto` column lets the column animate as it collapses.
 */
export declare class CxIndexNavComponent {
    /** Title shown above the panel; doubles as the filter field's label. */
    heading: string;
    /** Folders of contextual items. A single unlabeled group renders as a flat list. */
    groups: CxIndexNavGroup[];
    /** Accessible label for the navigation landmark. */
    ariaLabel: string;
    /** Show the built-in filter field. */
    filterable: boolean;
    /** Message shown when the filter matches nothing. */
    emptyText: string;
    /** Show the skeleton loading state. */
    loading: boolean;
    /** Allow the whole panel to compress to a rail. */
    collapsible: boolean;
    /** Panel surface treatment. Transparent keeps the divider but removes the alternate background. */
    variant: CxIndexNavVariant;
    /** Whole-panel collapsed state. Controllable; mirrors `collapsedChange`. */
    set collapsed(value: boolean);
    get collapsed(): boolean;
    /** Emits when the user collapses or expands the panel. */
    readonly collapsedChange: EventEmitter<boolean>;
    /** Emits the activated item (selection-driven usage). */
    readonly itemSelect: EventEmitter<CxIndexNavItem>;
    /** Emits the current filter query. */
    readonly queryChange: EventEmitter<string>;
    protected readonly bodyId: string;
    protected readonly collapsedState: import("@angular/core").WritableSignal<boolean>;
    protected readonly query: import("@angular/core").WritableSignal<string>;
    protected readonly skeletonItems: string[];
    /** Explicit user expand/collapse choices, keyed by folder id. */
    private expandedGroups;
    protected visibleGroups(): CxIndexNavGroup[];
    protected isGroupExpanded(group: CxIndexNavGroup): boolean;
    protected showGroupItems(group: CxIndexNavGroup): boolean;
    protected toggleGroup(group: CxIndexNavGroup): void;
    protected folderIcon(group: CxIndexNavGroup): CxIconName;
    protected activeOptions(item: CxIndexNavItem): {
        exact: boolean;
    } | IsActiveMatchOptions;
    protected badgeLabel(item: CxIndexNavItem): string;
    protected badgeTone(item: CxIndexNavItem): CxIndexNavBadgeTone;
    protected toggleCollapsed(): void;
    protected onQueryChange(value: string): void;
    protected onItemClick(event: MouseEvent, item: CxIndexNavItem): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxIndexNavComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxIndexNavComponent, "cx-index-nav", never, { "heading": { "alias": "heading"; "required": false; }; "groups": { "alias": "groups"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "filterable": { "alias": "filterable"; "required": false; }; "emptyText": { "alias": "emptyText"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "collapsible": { "alias": "collapsible"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "collapsed": { "alias": "collapsed"; "required": false; }; }, { "collapsedChange": "collapsedChange"; "itemSelect": "itemSelect"; "queryChange": "queryChange"; }, never, never, true, never>;
    static ngAcceptInputType_filterable: unknown;
    static ngAcceptInputType_loading: unknown;
    static ngAcceptInputType_collapsible: unknown;
    static ngAcceptInputType_collapsed: unknown;
}
//# sourceMappingURL=cx-index-nav.component.d.ts.map