import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, UrlTree, } from '@angular/router';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxMenuComponent } from '../../primitives/overlay/cx-menu/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import { assertCompatibleSideNavUrlTreeExtras } from './cx-side-nav.validation.js';
import * as i0 from "@angular/core";
const DEFAULT_ACTIVE_OPTIONS = { exact: true };
export class CxSideNavComponent {
    itemsValue = [];
    groupsValue = [];
    set items(value) {
        this.itemsValue = validateSideNavItems(value, 'items');
    }
    get items() {
        return this.itemsValue;
    }
    set groups(value) {
        this.groupsValue = validateSideNavGroups(value);
    }
    get groups() {
        return this.groupsValue;
    }
    name = '';
    initials = '';
    navbarVisible = true;
    loading = false;
    /** Renders the collapse toggle at the end of the header row. */
    collapsible = false;
    /**
     * Rail state: only top-level icons remain, each described by an instant
     * tooltip. Two-way bindable so the consumer can persist the choice.
     */
    collapsed = false;
    itemSelect = new EventEmitter();
    collapsedChange = new EventEmitter();
    router = inject(Router);
    route = inject(ActivatedRoute);
    destroyRef = inject(DestroyRef);
    skeletonItems = Array.from({ length: 7 }, (_, index) => `skeleton-${index}`);
    // Tracks the active URL so router-derived state (a group "contains the active
    // item", and therefore its auto-expansion) re-evaluates whenever navigation
    // settles. Per-item active styling + aria-current are owned by the
    // routerLinkActive directives in the template.
    activeUrl = signal(this.router.url, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeUrl" }] : /* istanbul ignore next */ []));
    /** Explicit user expand/collapse choices, keyed by group id. */
    expandedGroups = {};
    /** Explicit user expand/collapse choices, keyed by item id. */
    expandedItems = {};
    /**
     * The rail's stand-in for in-place expansion: one flyout menu beside the
     * clicked parent row, carrying that section's items. `source` keeps the
     * original nav items so a selection navigates with full link semantics.
     */
    flyout = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "flyout" }] : /* istanbul ignore next */ []));
    constructor() {
        const subscription = this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.activeUrl.set(this.router.url);
            }
        });
        this.destroyRef.onDestroy(() => subscription.unsubscribe());
    }
    normalizedGroups() {
        if (this.groups.length > 0) {
            return this.groups;
        }
        return [{ id: 'default', items: this.items }];
    }
    hasNavigationItems() {
        return this.groups.length > 0 || this.items.length > 0;
    }
    activeOptions(item) {
        return item.routerLinkActiveOptions ?? DEFAULT_ACTIVE_OPTIONS;
    }
    /**
     * True when the group renders its own parent row. Such a group owns the
     * nesting: its items sit one level in, behind the tree guide.
     */
    hasGroupToggle(group) {
        return Boolean(group.collapsible && group.label);
    }
    /** Nesting level the group's own items start at — 1 behind a parent row. */
    groupItemLevel(group) {
        return this.hasGroupToggle(group) ? 1 : 0;
    }
    // Collapsed is the starting state, except for the group holding the active
    // route: it derives open from the URL, so entering or reloading a sub page
    // keeps its section unfolded without anything being persisted. An explicit
    // user toggle overrides the derived default, and a collapsed parent row
    // still carries the active highlight so the section stays identifiable.
    isGroupExpanded(group) {
        if (!group.collapsible) {
            return true;
        }
        return this.expandedGroups[group.id] ?? this.groupContainsActive(group);
    }
    groupContainsActive(group) {
        return group.items.some(item => this.itemContainsActive(item));
    }
    // The rail cannot draw nested rows, so while collapsed every sub-tree stays
    // visually closed. The underlying expansion choices are kept, which is what
    // lets expanding the nav restore exactly the sections that were open.
    showGroupItems(group) {
        return !group.collapsible || (!this.collapsed && this.isGroupExpanded(group));
    }
    toggleGroup(group, event) {
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
        this.expandedGroups = this.normalizedGroups().reduce((expandedGroups, candidate) => {
            if (candidate.collapsible) {
                expandedGroups[candidate.id] = candidate.id === group.id ? nextExpanded : false;
            }
            return expandedGroups;
        }, {});
    }
    hasChildren(item) {
        return (item.children?.length ?? 0) > 0;
    }
    /** See {@link isGroupExpanded} — a nested parent holding the active route derives open too. */
    isItemExpanded(item) {
        if (!this.hasChildren(item)) {
            return false;
        }
        return this.expandedItems[item.id] ?? this.itemContainsActive(item);
    }
    showItemChildren(item) {
        return this.hasChildren(item) && !this.collapsed && this.isItemExpanded(item);
    }
    toggleItem(item, event) {
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
    toggleCollapsed() {
        this.setCollapsed(!this.collapsed);
    }
    /** Rail stand-in for a top-level row without an icon, so no destination vanishes. */
    railInitial(label) {
        return this.firstInitial(label);
    }
    isFlyoutOpen(nodeId) {
        return this.flyout()?.nodeId === nodeId;
    }
    onFlyoutOpenChange(open) {
        if (!open) {
            this.flyout.set(null);
        }
    }
    onFlyoutSelect(itemId) {
        const flyout = this.flyout();
        this.flyout.set(null);
        const item = flyout ? findSideNavItem(flyout.source, itemId) : undefined;
        if (!item || item.disabled) {
            return;
        }
        if (item.href) {
            if (item.target === '_blank') {
                window.open(item.href, '_blank', item.rel ?? 'noopener');
            }
            else {
                window.location.assign(item.href);
            }
        }
        else if (item.routerLink !== undefined) {
            void this.router.navigateByUrl(this.destinationTree(item));
        }
        this.itemSelect.emit(item);
    }
    openFlyout(nodeId, heading, items, event) {
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
    findActiveFlyoutId(items) {
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
    setCollapsed(collapsed) {
        if (this.collapsed === collapsed) {
            return;
        }
        this.collapsed = collapsed;
        this.flyout.set(null);
        this.collapsedChange.emit(collapsed);
    }
    itemContainsActive(item) {
        this.activeUrl(); // establish the navigation dependency for OnPush
        if (this.isItemActive(item)) {
            return true;
        }
        return item.children?.some(child => this.itemContainsActive(child)) ?? false;
    }
    badgeLabel(item) {
        if (item.badge === true) {
            return '';
        }
        if (item.badge === false || item.badge === undefined) {
            return '';
        }
        return String(item.badge);
    }
    hasBadge(item) {
        // A finite number counts as visible even at 0; a string must be non-blank.
        if (typeof item.badge === 'number')
            return Number.isFinite(item.badge);
        if (typeof item.badge === 'string')
            return item.badge.trim().length > 0;
        return item.badge === true;
    }
    badgeTone(item) {
        return item.badgeTone ?? 'info';
    }
    accountName() {
        return this.name.trim();
    }
    accountInitials() {
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
    onItemClick(event, item) {
        if (item.disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        this.itemSelect.emit(item);
    }
    isItemActive(item) {
        if (item.disabled || item.routerLink === undefined) {
            return false;
        }
        const tree = this.destinationTree(item);
        const options = this.activeOptions(item);
        return typeof options.exact === 'boolean'
            ? this.router.isActive(tree, options.exact)
            : this.router.isActive(tree, options);
    }
    /** The one destination an item declares — shared by active matching and flyout navigation. */
    destinationTree(item) {
        return item.routerLink instanceof UrlTree
            ? item.routerLink
            : this.router.createUrlTree(Array.isArray(item.routerLink) ? [...item.routerLink] : [item.routerLink], {
                relativeTo: this.route,
                queryParams: item.queryParams,
                queryParamsHandling: item.queryParamsHandling,
                fragment: item.fragment,
            });
    }
    firstInitial(value) {
        return Array.from(value.trim()).find(char => /\p{L}|\p{N}/u.test(char))?.toUpperCase() ?? '';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSideNavComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSideNavComponent, isStandalone: true, selector: "cx-side-nav", inputs: { items: "items", groups: "groups", name: "name", initials: "initials", navbarVisible: "navbarVisible", loading: "loading", collapsible: "collapsible", collapsed: "collapsed" }, outputs: { itemSelect: "itemSelect", collapsedChange: "collapsedChange" }, host: { properties: { "class.cx-side-nav-host--loading": "loading" } }, ngImport: i0, template: "@if (navbarVisible) {\n  <aside\n    class=\"cx-side-nav\"\n    [class.cx-side-nav--collapsible]=\"collapsible\"\n    [class.cx-side-nav--collapsed]=\"collapsed\"\n    aria-label=\"Main navigation\"\n  >\n    <div class=\"cx-side-nav__header\">\n      <div class=\"cx-side-nav__header-slot\">\n        <ng-content select=\"[header]\" />\n      </div>\n      @if (collapsible) {\n        <cx-icon-button\n          class=\"cx-side-nav__collapse-toggle\"\n          icon=\"sidebar-left\"\n          variant=\"transparent\"\n          [ariaLabel]=\"collapsed ? 'Expand' : 'Collapse'\"\n          [cxTooltip]=\"collapsed ? 'Expand' : 'Collapse'\"\n          cxTooltipPosition=\"right\"\n          [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n          (pressed)=\"toggleCollapsed()\"\n        />\n      }\n    </div>\n\n    @if (loading) {\n      <div class=\"cx-side-nav__skeleton\" aria-hidden=\"true\">\n        @for (item of skeletonItems; track item) {\n          <span class=\"cx-side-nav__skeleton-row\"></span>\n        }\n      </div>\n    } @else if (hasNavigationItems()) {\n      <nav class=\"cx-side-nav__items\">\n        <!-- `level` 0 is a top-level row: it carries an icon. Level 1 and deeper\n             are nested rows: no icon, and the tree guide marks the nesting. -->\n        <ng-template #navItems let-items let-level=\"level\">\n          @for (item of items; track item.id) {\n            <div class=\"cx-side-nav__node\" [class.cx-side-nav__node--branch]=\"level > 0\">\n              @if (hasChildren(item)) {\n                <button\n                  class=\"cx-side-nav__item cx-side-nav__item--toggle\"\n                  [class.cx-side-nav__item--active]=\"itemContainsActive(item)\"\n                  [class.cx-side-nav__item--disabled]=\"item.disabled\"\n                  type=\"button\"\n                  [disabled]=\"item.disabled\"\n                  [attr.aria-haspopup]=\"collapsed ? 'menu' : null\"\n                  [attr.aria-expanded]=\"collapsed ? isFlyoutOpen(item.id) : showItemChildren(item)\"\n                  [cxTooltip]=\"item.label\"\n                  cxTooltipPosition=\"right\"\n                  cxTooltipDelay=\"none\"\n                  [cxTooltipDisabled]=\"!collapsed\"\n                  (click)=\"toggleItem(item, $event)\"\n                >\n                  @if (level === 0) {\n                    @if (item.icon) {\n                      <cx-icon\n                        class=\"cx-side-nav__icon\"\n                        [icon]=\"item.icon\"\n                        [size]=\"16\"\n                        [mood]=\"itemContainsActive(item) ? 'primary' : 'default'\"\n                      />\n                    } @else {\n                      <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(item.label) }}</span>\n                    }\n                    @if (hasBadge(item)) {\n                      <span\n                        class=\"cx-side-nav__rail-dot\"\n                        [class.cx-side-nav__rail-dot--primary]=\"badgeTone(item) === 'primary'\"\n                        [class.cx-side-nav__rail-dot--accent]=\"badgeTone(item) === 'accent'\"\n                        [class.cx-side-nav__rail-dot--info]=\"badgeTone(item) === 'info'\"\n                        [class.cx-side-nav__rail-dot--success]=\"badgeTone(item) === 'success'\"\n                        [class.cx-side-nav__rail-dot--warning]=\"badgeTone(item) === 'warning'\"\n                        [class.cx-side-nav__rail-dot--danger]=\"badgeTone(item) === 'danger'\"\n                        aria-hidden=\"true\"\n                      ></span>\n                    }\n                  }\n                  <span class=\"cx-side-nav__label\">{{ item.label }}</span>\n                  @if (hasBadge(item)) {\n                    <span\n                      class=\"cx-side-nav__badge\"\n                      [class.cx-side-nav__badge--dot]=\"item.badge === true\"\n                      [class.cx-side-nav__badge--primary]=\"badgeTone(item) === 'primary'\"\n                      [class.cx-side-nav__badge--accent]=\"badgeTone(item) === 'accent'\"\n                      [class.cx-side-nav__badge--info]=\"badgeTone(item) === 'info'\"\n                      [class.cx-side-nav__badge--success]=\"badgeTone(item) === 'success'\"\n                      [class.cx-side-nav__badge--warning]=\"badgeTone(item) === 'warning'\"\n                      [class.cx-side-nav__badge--danger]=\"badgeTone(item) === 'danger'\"\n                    >\n                      {{ badgeLabel(item) }}\n                    </span>\n                  }\n                  <cx-icon\n                    class=\"cx-side-nav__item-chevron\"\n                    [icon]=\"showItemChildren(item) ? 'chevron-up' : 'chevron-down'\"\n                    [size]=\"16\"\n                  />\n                </button>\n                <div\n                  class=\"cx-side-nav__children\"\n                  [class.cx-side-nav__children--expanded]=\"showItemChildren(item)\"\n                >\n                  <div class=\"cx-side-nav__children-inner cx-side-nav__branch\">\n                    <ng-container\n                      [ngTemplateOutlet]=\"navItems\"\n                      [ngTemplateOutletContext]=\"{ $implicit: item.children, level: level + 1 }\"\n                    />\n                  </div>\n                </div>\n              } @else if (item.href) {\n                <a\n                  class=\"cx-side-nav__item\"\n                  [class.cx-side-nav__item--disabled]=\"item.disabled\"\n                  [attr.href]=\"item.disabled ? null : item.href\"\n                  [attr.target]=\"item.target ?? null\"\n                  [attr.rel]=\"item.rel ?? (item.target === '_blank' ? 'noopener' : null)\"\n                  [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n                  [attr.tabindex]=\"item.disabled ? '-1' : null\"\n                  [cxTooltip]=\"item.label\"\n                  cxTooltipPosition=\"right\"\n                  cxTooltipDelay=\"none\"\n                  [cxTooltipDisabled]=\"!collapsed\"\n                  (click)=\"onItemClick($event, item)\"\n                >\n                  @if (level === 0) {\n                    @if (item.icon) {\n                      <cx-icon class=\"cx-side-nav__icon\" [icon]=\"item.icon\" [size]=\"16\" />\n                    } @else {\n                      <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(item.label) }}</span>\n                    }\n                    @if (hasBadge(item)) {\n                      <span\n                        class=\"cx-side-nav__rail-dot\"\n                        [class.cx-side-nav__rail-dot--primary]=\"badgeTone(item) === 'primary'\"\n                        [class.cx-side-nav__rail-dot--accent]=\"badgeTone(item) === 'accent'\"\n                        [class.cx-side-nav__rail-dot--info]=\"badgeTone(item) === 'info'\"\n                        [class.cx-side-nav__rail-dot--success]=\"badgeTone(item) === 'success'\"\n                        [class.cx-side-nav__rail-dot--warning]=\"badgeTone(item) === 'warning'\"\n                        [class.cx-side-nav__rail-dot--danger]=\"badgeTone(item) === 'danger'\"\n                        aria-hidden=\"true\"\n                      ></span>\n                    }\n                  }\n                  <span class=\"cx-side-nav__label\">{{ item.label }}</span>\n                  @if (hasBadge(item)) {\n                    <span\n                      class=\"cx-side-nav__badge\"\n                      [class.cx-side-nav__badge--dot]=\"item.badge === true\"\n                      [class.cx-side-nav__badge--primary]=\"badgeTone(item) === 'primary'\"\n                      [class.cx-side-nav__badge--accent]=\"badgeTone(item) === 'accent'\"\n                      [class.cx-side-nav__badge--info]=\"badgeTone(item) === 'info'\"\n                      [class.cx-side-nav__badge--success]=\"badgeTone(item) === 'success'\"\n                      [class.cx-side-nav__badge--warning]=\"badgeTone(item) === 'warning'\"\n                      [class.cx-side-nav__badge--danger]=\"badgeTone(item) === 'danger'\"\n                    >\n                      {{ badgeLabel(item) }}\n                    </span>\n                  }\n                </a>\n              } @else {\n                <a\n                  class=\"cx-side-nav__item\"\n                  [class.cx-side-nav__item--disabled]=\"item.disabled\"\n                  [routerLink]=\"item.disabled ? null : item.routerLink\"\n                  [queryParams]=\"item.disabled ? undefined : item.queryParams\"\n                  [queryParamsHandling]=\"item.disabled ? undefined : item.queryParamsHandling\"\n                  [fragment]=\"item.disabled ? undefined : item.fragment\"\n                  routerLinkActive=\"cx-side-nav__item--active\"\n                  #itemActive=\"routerLinkActive\"\n                  [routerLinkActiveOptions]=\"activeOptions(item)\"\n                  ariaCurrentWhenActive=\"page\"\n                  [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n                  [attr.tabindex]=\"item.disabled ? '-1' : null\"\n                  [cxTooltip]=\"item.label\"\n                  cxTooltipPosition=\"right\"\n                  cxTooltipDelay=\"none\"\n                  [cxTooltipDisabled]=\"!collapsed\"\n                  (click)=\"onItemClick($event, item)\"\n                >\n                  @if (level === 0) {\n                    @if (item.icon) {\n                      <cx-icon\n                        class=\"cx-side-nav__icon\"\n                        [icon]=\"item.icon\"\n                        [size]=\"16\"\n                        [mood]=\"itemActive.isActive ? 'primary' : 'default'\"\n                      />\n                    } @else {\n                      <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(item.label) }}</span>\n                    }\n                    @if (hasBadge(item)) {\n                      <span\n                        class=\"cx-side-nav__rail-dot\"\n                        [class.cx-side-nav__rail-dot--primary]=\"badgeTone(item) === 'primary'\"\n                        [class.cx-side-nav__rail-dot--accent]=\"badgeTone(item) === 'accent'\"\n                        [class.cx-side-nav__rail-dot--info]=\"badgeTone(item) === 'info'\"\n                        [class.cx-side-nav__rail-dot--success]=\"badgeTone(item) === 'success'\"\n                        [class.cx-side-nav__rail-dot--warning]=\"badgeTone(item) === 'warning'\"\n                        [class.cx-side-nav__rail-dot--danger]=\"badgeTone(item) === 'danger'\"\n                        aria-hidden=\"true\"\n                      ></span>\n                    }\n                  }\n                  <span class=\"cx-side-nav__label\">{{ item.label }}</span>\n                  @if (hasBadge(item)) {\n                    <span\n                      class=\"cx-side-nav__badge\"\n                      [class.cx-side-nav__badge--dot]=\"item.badge === true\"\n                      [class.cx-side-nav__badge--primary]=\"badgeTone(item) === 'primary'\"\n                      [class.cx-side-nav__badge--accent]=\"badgeTone(item) === 'accent'\"\n                      [class.cx-side-nav__badge--info]=\"badgeTone(item) === 'info'\"\n                      [class.cx-side-nav__badge--success]=\"badgeTone(item) === 'success'\"\n                      [class.cx-side-nav__badge--warning]=\"badgeTone(item) === 'warning'\"\n                      [class.cx-side-nav__badge--danger]=\"badgeTone(item) === 'danger'\"\n                    >\n                      {{ badgeLabel(item) }}\n                    </span>\n                  }\n                </a>\n              }\n            </div>\n          }\n        </ng-template>\n\n        @for (group of normalizedGroups(); track group.id) {\n          <div class=\"cx-side-nav__group\">\n            @if (hasGroupToggle(group)) {\n              <button\n                class=\"cx-side-nav__item cx-side-nav__group-toggle\"\n                [class.cx-side-nav__item--active]=\"groupContainsActive(group)\"\n                type=\"button\"\n                [attr.aria-haspopup]=\"collapsed ? 'menu' : null\"\n                [attr.aria-expanded]=\"collapsed ? isFlyoutOpen(group.id) : showGroupItems(group)\"\n                [cxTooltip]=\"group.label\"\n                cxTooltipPosition=\"right\"\n                cxTooltipDelay=\"none\"\n                [cxTooltipDisabled]=\"!collapsed\"\n                (click)=\"toggleGroup(group, $event)\"\n              >\n                @if (group.icon) {\n                  <cx-icon\n                    class=\"cx-side-nav__icon\"\n                    [icon]=\"group.icon\"\n                    [size]=\"16\"\n                    [mood]=\"groupContainsActive(group) ? 'primary' : 'default'\"\n                  />\n                } @else {\n                  <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(group.label ?? '') }}</span>\n                }\n                <span class=\"cx-side-nav__label\">{{ group.label }}</span>\n                <cx-icon\n                  class=\"cx-side-nav__group-chevron\"\n                  [icon]=\"showGroupItems(group) ? 'chevron-up' : 'chevron-down'\"\n                  [size]=\"16\"\n                />\n              </button>\n            } @else if (group.label) {\n              <div class=\"cx-side-nav__group-label\">{{ group.label }}</div>\n            }\n            <div\n              class=\"cx-side-nav__group-items\"\n              [class.cx-side-nav__group-items--collapsible]=\"group.collapsible\"\n              [class.cx-side-nav__group-items--expanded]=\"showGroupItems(group)\"\n            >\n              <div\n                class=\"cx-side-nav__group-items-inner\"\n                [class.cx-side-nav__branch]=\"hasGroupToggle(group)\"\n              >\n                <ng-container\n                  [ngTemplateOutlet]=\"navItems\"\n                  [ngTemplateOutletContext]=\"{ $implicit: group.items, level: groupItemLevel(group) }\"\n                />\n              </div>\n            </div>\n          </div>\n        }\n      </nav>\n    }\n\n    <!-- Rail flyout: one menu beside the clicked parent row. The popover is\n         fixed-positioned, so the aside's overflow clipping never touches it. -->\n    @if (flyout(); as railFlyout) {\n      <cx-menu\n        class=\"cx-side-nav__flyout\"\n        [presentation]=\"railFlyout.presentation\"\n        placement=\"right\"\n        [heading]=\"railFlyout.heading\"\n        [items]=\"railFlyout.items\"\n        [currentId]=\"railFlyout.currentId\"\n        [open]=\"true\"\n        [width]=\"208\"\n        (openChange)=\"onFlyoutOpenChange($event)\"\n        (itemSelect)=\"onFlyoutSelect($event)\"\n      />\n    }\n\n    <div class=\"cx-side-nav__footer\">\n      @if (accountName()) {\n        <button\n          class=\"cx-side-nav__account\"\n          type=\"button\"\n          [attr.aria-label]=\"'Account actions for ' + accountName()\"\n          [cxTooltip]=\"accountName()\"\n          [cxTooltipOverflow]=\"!collapsed\"\n          [cxTooltipPosition]=\"collapsed ? 'right' : 'top'\"\n          [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n        >\n          <span class=\"cx-side-nav__account-avatar\" aria-hidden=\"true\">{{ accountInitials() }}</span>\n          <span class=\"cx-side-nav__account-name\" data-cx-tooltip-overflow>{{ accountName() }}</span>\n          <cx-icon class=\"cx-side-nav__account-icon\" icon=\"chevrons-vertical\" [size]=\"16\" />\n        </button>\n      }\n      <ng-content select=\"[footer]\" />\n    </div>\n  </aside>\n}\n", styles: [":host{display:block;height:100%;min-height:0}.cx-side-nav{--cx-side-nav-row-height: calc( var(--controller-size-small) + var(--space-sm) * 2 );--cx-side-nav-subrow-height: calc( var(--controller-size-small) + var(--space-xs) * 2 );--cx-side-nav-row-gap: 1px;--cx-side-nav-rail: calc(var(--controller-size-small) + var(--space-sm));--cx-side-nav-guide: calc( var(--space-xs) + var(--controller-size-small) / 2 - var(--border-width) );--cx-side-nav-guide-offset: calc( var(--cx-side-nav-guide) - var(--cx-side-nav-rail) );--cx-side-nav-elbow: calc(var(--space-sm) + var(--space-xs));--cx-side-nav-guide-line: var(--border-width) solid color-mix(in srgb, var(--ink) 18%, transparent);--cx-side-nav-rail-width: calc( var(--space-sm) * 2 + var(--space-xs) * 2 + var(--controller-size-small) );display:flex;width:240px;height:100%;min-height:100%;flex-direction:column;gap:var(--space-md);padding:var(--space-sm);border-right:var(--line);background:var(--surface-alt);box-sizing:border-box;overflow:hidden;transition:width var(--motion-slow) var(--ease-out-strong)}.cx-side-nav--collapsed{width:var(--cx-side-nav-rail-width)}.cx-side-nav--collapsed .cx-side-nav__items{scrollbar-gutter:auto;scrollbar-width:none}.cx-side-nav--collapsed .cx-side-nav__items::-webkit-scrollbar{display:none}.cx-side-nav:not(:has(.cx-side-nav__header-slot>*,.cx-side-nav__collapse-toggle,.cx-side-nav__skeleton,.cx-side-nav__items,.cx-side-nav__footer>*)){display:none}.cx-side-nav__header{display:flex;width:100%;height:var(--controller-size);min-height:var(--controller-size);align-items:center;flex:0 0 auto}.cx-side-nav__header:not(:has(.cx-side-nav__header-slot>*,.cx-side-nav__collapse-toggle)){display:none}.cx-side-nav__header-slot{display:flex;min-width:0;flex:1 1 auto;align-items:center;margin-left:6px;overflow:hidden;white-space:nowrap;transition:opacity var(--motion-base) ease var(--motion-fast),margin-left var(--motion-slow) var(--ease-out-strong),visibility 0s}.cx-side-nav--collapsed .cx-side-nav__header-slot{opacity:0;margin-left:0;visibility:hidden;transition:opacity var(--motion-base) ease,margin-left var(--motion-slow) var(--ease-out-strong),visibility 0s var(--motion-base)}.cx-side-nav__collapse-toggle{flex:0 0 auto}.cx-side-nav__flyout{position:fixed}.cx-side-nav__skeleton{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-xs) 0}.cx-side-nav__skeleton-row{display:block;height:var(--cx-side-nav-row-height);border-radius:var(--radius-sm);background:linear-gradient(90deg, var(--opacity-low), var(--opacity-mid), var(--opacity-low));background-size:180% 100%;animation:cx-side-nav-skeleton 1.2s ease-in-out infinite}.cx-side-nav__items{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--cx-side-nav-row-gap);overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}.cx-side-nav__group{display:flex;width:100%;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__node{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__group-items{display:flex;width:100%;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__group-items--collapsible{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__group-items--collapsible .cx-side-nav__group-items-inner{overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__group-items--expanded.cx-side-nav__group-items--collapsible{grid-template-rows:1fr}.cx-side-nav__group-items--expanded.cx-side-nav__group-items--collapsible .cx-side-nav__group-items-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-side-nav__group-items-inner{display:flex;width:100%;min-height:0;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__branch{padding-left:var(--cx-side-nav-rail)}.cx-side-nav__node--branch>.cx-side-nav__item{min-height:var(--cx-side-nav-subrow-height);padding-block:var(--space-xs)}.cx-side-nav__node--branch>.cx-side-nav__item::before{content:\"\";position:absolute;top:0;left:var(--cx-side-nav-guide-offset);width:var(--cx-side-nav-elbow);height:50%;border-left:var(--cx-side-nav-guide-line);border-bottom:var(--cx-side-nav-guide-line);border-bottom-left-radius:var(--radius-sm);pointer-events:none}.cx-side-nav__node--branch>.cx-side-nav__item::after{content:\"\";position:absolute;top:50%;bottom:calc(-1*var(--cx-side-nav-row-gap));left:var(--cx-side-nav-guide-offset);border-left:var(--cx-side-nav-guide-line);pointer-events:none}.cx-side-nav__node--branch>.cx-side-nav__children{position:relative}.cx-side-nav__node--branch>.cx-side-nav__children::before{content:\"\";position:absolute;top:0;bottom:calc(-1*var(--cx-side-nav-row-gap));left:var(--cx-side-nav-guide-offset);border-left:var(--cx-side-nav-guide-line);pointer-events:none}.cx-side-nav__node--branch:last-child>.cx-side-nav__item::after,.cx-side-nav__node--branch:last-child>.cx-side-nav__children::before{content:none}.cx-side-nav__children{display:grid;width:100%;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__children-inner{display:flex;min-height:0;flex-direction:column;gap:var(--cx-side-nav-row-gap);overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__children--expanded{grid-template-rows:1fr}.cx-side-nav__children--expanded .cx-side-nav__children-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-side-nav__group-label{padding:0 var(--space-xs);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1.2}.cx-side-nav__item{position:relative;display:flex;width:100%;min-height:var(--cx-side-nav-row-height);align-items:center;gap:var(--space-sm);padding:var(--space-sm) var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;text-align:left;text-decoration:none;cursor:pointer}.cx-side-nav__group-toggle{justify-content:flex-start}.cx-side-nav__item:hover{background:var(--opacity-mid);color:var(--ink)}.cx-side-nav__item:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-side-nav__item:active:not(.cx-side-nav__item--disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-side-nav__item--active{color:var(--ink);font-weight:var(--font-weight-medium)}.cx-side-nav__item--disabled{color:var(--opacity-mid);cursor:default;pointer-events:none}.cx-side-nav__item--toggle{justify-content:flex-start}.cx-side-nav__icon{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);align-items:center;justify-content:center}.cx-side-nav__label{min-width:0;flex:1 1 auto;font-size:var(--font-size-body);line-height:1.2}.cx-side-nav__badge{display:inline-flex;min-width:16px;height:16px;align-items:center;justify-content:center;padding:0 var(--space-2xs);border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);line-height:1}.cx-side-nav__badge--dot{width:8px;min-width:8px;height:8px;padding:0}.cx-side-nav__badge--primary{background:var(--primary-opacity);color:var(--primary)}.cx-side-nav__badge--accent{background:var(--accent-opacity);color:var(--accent)}.cx-side-nav__badge--info{background:var(--info-opacity);color:var(--info)}.cx-side-nav__badge--success{background:var(--success-opacity);color:var(--success)}.cx-side-nav__badge--warning{background:var(--warning-opacity);color:var(--warning)}.cx-side-nav__badge--danger{background:var(--danger-opacity);color:var(--danger)}.cx-side-nav__group-chevron,.cx-side-nav__item-chevron{flex:0 0 auto;margin-left:auto}.cx-side-nav__footer{display:flex;width:100%;flex-direction:column;gap:var(--space-xs);padding-top:var(--space-xs);border-top:var(--line-discreet);flex:0 0 auto;box-sizing:border-box}.cx-side-nav__footer:empty{display:none}.cx-side-nav__account{display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;cursor:pointer}.cx-side-nav__account:hover{background:var(--opacity-low)}.cx-side-nav__account:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-side-nav__account-avatar{display:inline-flex;width:24px;height:24px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--primary);color:var(--on-ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1}.cx-side-nav__account-name{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1.2}.cx-side-nav__account-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-side-nav--collapsible .cx-side-nav__label,.cx-side-nav--collapsible .cx-side-nav__group-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cx-side-nav__label,.cx-side-nav__badge,.cx-side-nav__item-chevron,.cx-side-nav__group-chevron,.cx-side-nav__account-name,.cx-side-nav__account-icon{transition:opacity var(--motion-base) ease var(--motion-fast)}.cx-side-nav--collapsed .cx-side-nav__label,.cx-side-nav--collapsed .cx-side-nav__badge,.cx-side-nav--collapsed .cx-side-nav__item-chevron,.cx-side-nav--collapsed .cx-side-nav__group-chevron,.cx-side-nav--collapsed .cx-side-nav__account-name,.cx-side-nav--collapsed .cx-side-nav__account-icon{opacity:0;transition-delay:0s}.cx-side-nav__group-label{position:relative;transition:color var(--motion-base) ease var(--motion-fast)}.cx-side-nav__group-label::after{content:\"\";position:absolute;top:50%;left:var(--space-xs);width:var(--controller-size-small);border-top:var(--line-discreet);opacity:0;transition:opacity var(--motion-base) ease}.cx-side-nav--collapsed .cx-side-nav__group-label{color:rgba(0,0,0,0);transition-delay:0s}.cx-side-nav--collapsed .cx-side-nav__group-label::after{opacity:1;transition-delay:var(--motion-fast)}.cx-side-nav__rail-letter{position:absolute;top:50%;left:var(--space-xs);display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1;translate:0 -50%;opacity:0;pointer-events:none;transition:opacity var(--motion-base) ease}.cx-side-nav--collapsed .cx-side-nav__rail-letter{opacity:1;transition-delay:var(--motion-fast)}.cx-side-nav__rail-dot{position:absolute;top:calc(50% - var(--controller-size-small)/2);left:calc(var(--space-xs) + var(--controller-size-small) - 6px);width:8px;height:8px;border-radius:var(--radius-pill);background:var(--opacity-high);opacity:0;pointer-events:none;transition:opacity var(--motion-base) ease}.cx-side-nav--collapsed .cx-side-nav__rail-dot{opacity:1;transition-delay:var(--motion-fast)}.cx-side-nav__rail-dot--primary{background:var(--primary)}.cx-side-nav__rail-dot--accent{background:var(--accent)}.cx-side-nav__rail-dot--info{background:var(--info)}.cx-side-nav__rail-dot--success{background:var(--success)}.cx-side-nav__rail-dot--warning{background:var(--warning)}.cx-side-nav__rail-dot--danger{background:var(--danger)}@media(prefers-reduced-motion: reduce){.cx-side-nav,.cx-side-nav__header-slot,.cx-side-nav__label,.cx-side-nav__badge,.cx-side-nav__item-chevron,.cx-side-nav__group-chevron,.cx-side-nav__group-label,.cx-side-nav__group-label::after,.cx-side-nav__rail-letter,.cx-side-nav__rail-dot,.cx-side-nav__account-name,.cx-side-nav__account-icon,.cx-side-nav__group-items--collapsible,.cx-side-nav__group-items--collapsible .cx-side-nav__group-items-inner,.cx-side-nav__children,.cx-side-nav__children-inner,.cx-side-nav__skeleton-row{transition:none;animation:none}}@keyframes cx-side-nav-skeleton{0%{background-position:100% 0}100%{background-position:-80% 0}}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "directive", type: RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "browserUrl", "routerLink"] }, { kind: "directive", type: RouterLinkActive, selector: "[routerLinkActive]", inputs: ["routerLinkActiveOptions", "ariaCurrentWhenActive", "routerLinkActive"], outputs: ["isActiveChange"], exportAs: ["routerLinkActive"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSideNavComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-side-nav', imports: [
                        NgTemplateOutlet,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxMenuComponent,
                        CxTooltipDirective,
                        RouterLink,
                        RouterLinkActive,
                    ], host: {
                        '[class.cx-side-nav-host--loading]': 'loading',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (navbarVisible) {\n  <aside\n    class=\"cx-side-nav\"\n    [class.cx-side-nav--collapsible]=\"collapsible\"\n    [class.cx-side-nav--collapsed]=\"collapsed\"\n    aria-label=\"Main navigation\"\n  >\n    <div class=\"cx-side-nav__header\">\n      <div class=\"cx-side-nav__header-slot\">\n        <ng-content select=\"[header]\" />\n      </div>\n      @if (collapsible) {\n        <cx-icon-button\n          class=\"cx-side-nav__collapse-toggle\"\n          icon=\"sidebar-left\"\n          variant=\"transparent\"\n          [ariaLabel]=\"collapsed ? 'Expand' : 'Collapse'\"\n          [cxTooltip]=\"collapsed ? 'Expand' : 'Collapse'\"\n          cxTooltipPosition=\"right\"\n          [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n          (pressed)=\"toggleCollapsed()\"\n        />\n      }\n    </div>\n\n    @if (loading) {\n      <div class=\"cx-side-nav__skeleton\" aria-hidden=\"true\">\n        @for (item of skeletonItems; track item) {\n          <span class=\"cx-side-nav__skeleton-row\"></span>\n        }\n      </div>\n    } @else if (hasNavigationItems()) {\n      <nav class=\"cx-side-nav__items\">\n        <!-- `level` 0 is a top-level row: it carries an icon. Level 1 and deeper\n             are nested rows: no icon, and the tree guide marks the nesting. -->\n        <ng-template #navItems let-items let-level=\"level\">\n          @for (item of items; track item.id) {\n            <div class=\"cx-side-nav__node\" [class.cx-side-nav__node--branch]=\"level > 0\">\n              @if (hasChildren(item)) {\n                <button\n                  class=\"cx-side-nav__item cx-side-nav__item--toggle\"\n                  [class.cx-side-nav__item--active]=\"itemContainsActive(item)\"\n                  [class.cx-side-nav__item--disabled]=\"item.disabled\"\n                  type=\"button\"\n                  [disabled]=\"item.disabled\"\n                  [attr.aria-haspopup]=\"collapsed ? 'menu' : null\"\n                  [attr.aria-expanded]=\"collapsed ? isFlyoutOpen(item.id) : showItemChildren(item)\"\n                  [cxTooltip]=\"item.label\"\n                  cxTooltipPosition=\"right\"\n                  cxTooltipDelay=\"none\"\n                  [cxTooltipDisabled]=\"!collapsed\"\n                  (click)=\"toggleItem(item, $event)\"\n                >\n                  @if (level === 0) {\n                    @if (item.icon) {\n                      <cx-icon\n                        class=\"cx-side-nav__icon\"\n                        [icon]=\"item.icon\"\n                        [size]=\"16\"\n                        [mood]=\"itemContainsActive(item) ? 'primary' : 'default'\"\n                      />\n                    } @else {\n                      <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(item.label) }}</span>\n                    }\n                    @if (hasBadge(item)) {\n                      <span\n                        class=\"cx-side-nav__rail-dot\"\n                        [class.cx-side-nav__rail-dot--primary]=\"badgeTone(item) === 'primary'\"\n                        [class.cx-side-nav__rail-dot--accent]=\"badgeTone(item) === 'accent'\"\n                        [class.cx-side-nav__rail-dot--info]=\"badgeTone(item) === 'info'\"\n                        [class.cx-side-nav__rail-dot--success]=\"badgeTone(item) === 'success'\"\n                        [class.cx-side-nav__rail-dot--warning]=\"badgeTone(item) === 'warning'\"\n                        [class.cx-side-nav__rail-dot--danger]=\"badgeTone(item) === 'danger'\"\n                        aria-hidden=\"true\"\n                      ></span>\n                    }\n                  }\n                  <span class=\"cx-side-nav__label\">{{ item.label }}</span>\n                  @if (hasBadge(item)) {\n                    <span\n                      class=\"cx-side-nav__badge\"\n                      [class.cx-side-nav__badge--dot]=\"item.badge === true\"\n                      [class.cx-side-nav__badge--primary]=\"badgeTone(item) === 'primary'\"\n                      [class.cx-side-nav__badge--accent]=\"badgeTone(item) === 'accent'\"\n                      [class.cx-side-nav__badge--info]=\"badgeTone(item) === 'info'\"\n                      [class.cx-side-nav__badge--success]=\"badgeTone(item) === 'success'\"\n                      [class.cx-side-nav__badge--warning]=\"badgeTone(item) === 'warning'\"\n                      [class.cx-side-nav__badge--danger]=\"badgeTone(item) === 'danger'\"\n                    >\n                      {{ badgeLabel(item) }}\n                    </span>\n                  }\n                  <cx-icon\n                    class=\"cx-side-nav__item-chevron\"\n                    [icon]=\"showItemChildren(item) ? 'chevron-up' : 'chevron-down'\"\n                    [size]=\"16\"\n                  />\n                </button>\n                <div\n                  class=\"cx-side-nav__children\"\n                  [class.cx-side-nav__children--expanded]=\"showItemChildren(item)\"\n                >\n                  <div class=\"cx-side-nav__children-inner cx-side-nav__branch\">\n                    <ng-container\n                      [ngTemplateOutlet]=\"navItems\"\n                      [ngTemplateOutletContext]=\"{ $implicit: item.children, level: level + 1 }\"\n                    />\n                  </div>\n                </div>\n              } @else if (item.href) {\n                <a\n                  class=\"cx-side-nav__item\"\n                  [class.cx-side-nav__item--disabled]=\"item.disabled\"\n                  [attr.href]=\"item.disabled ? null : item.href\"\n                  [attr.target]=\"item.target ?? null\"\n                  [attr.rel]=\"item.rel ?? (item.target === '_blank' ? 'noopener' : null)\"\n                  [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n                  [attr.tabindex]=\"item.disabled ? '-1' : null\"\n                  [cxTooltip]=\"item.label\"\n                  cxTooltipPosition=\"right\"\n                  cxTooltipDelay=\"none\"\n                  [cxTooltipDisabled]=\"!collapsed\"\n                  (click)=\"onItemClick($event, item)\"\n                >\n                  @if (level === 0) {\n                    @if (item.icon) {\n                      <cx-icon class=\"cx-side-nav__icon\" [icon]=\"item.icon\" [size]=\"16\" />\n                    } @else {\n                      <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(item.label) }}</span>\n                    }\n                    @if (hasBadge(item)) {\n                      <span\n                        class=\"cx-side-nav__rail-dot\"\n                        [class.cx-side-nav__rail-dot--primary]=\"badgeTone(item) === 'primary'\"\n                        [class.cx-side-nav__rail-dot--accent]=\"badgeTone(item) === 'accent'\"\n                        [class.cx-side-nav__rail-dot--info]=\"badgeTone(item) === 'info'\"\n                        [class.cx-side-nav__rail-dot--success]=\"badgeTone(item) === 'success'\"\n                        [class.cx-side-nav__rail-dot--warning]=\"badgeTone(item) === 'warning'\"\n                        [class.cx-side-nav__rail-dot--danger]=\"badgeTone(item) === 'danger'\"\n                        aria-hidden=\"true\"\n                      ></span>\n                    }\n                  }\n                  <span class=\"cx-side-nav__label\">{{ item.label }}</span>\n                  @if (hasBadge(item)) {\n                    <span\n                      class=\"cx-side-nav__badge\"\n                      [class.cx-side-nav__badge--dot]=\"item.badge === true\"\n                      [class.cx-side-nav__badge--primary]=\"badgeTone(item) === 'primary'\"\n                      [class.cx-side-nav__badge--accent]=\"badgeTone(item) === 'accent'\"\n                      [class.cx-side-nav__badge--info]=\"badgeTone(item) === 'info'\"\n                      [class.cx-side-nav__badge--success]=\"badgeTone(item) === 'success'\"\n                      [class.cx-side-nav__badge--warning]=\"badgeTone(item) === 'warning'\"\n                      [class.cx-side-nav__badge--danger]=\"badgeTone(item) === 'danger'\"\n                    >\n                      {{ badgeLabel(item) }}\n                    </span>\n                  }\n                </a>\n              } @else {\n                <a\n                  class=\"cx-side-nav__item\"\n                  [class.cx-side-nav__item--disabled]=\"item.disabled\"\n                  [routerLink]=\"item.disabled ? null : item.routerLink\"\n                  [queryParams]=\"item.disabled ? undefined : item.queryParams\"\n                  [queryParamsHandling]=\"item.disabled ? undefined : item.queryParamsHandling\"\n                  [fragment]=\"item.disabled ? undefined : item.fragment\"\n                  routerLinkActive=\"cx-side-nav__item--active\"\n                  #itemActive=\"routerLinkActive\"\n                  [routerLinkActiveOptions]=\"activeOptions(item)\"\n                  ariaCurrentWhenActive=\"page\"\n                  [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n                  [attr.tabindex]=\"item.disabled ? '-1' : null\"\n                  [cxTooltip]=\"item.label\"\n                  cxTooltipPosition=\"right\"\n                  cxTooltipDelay=\"none\"\n                  [cxTooltipDisabled]=\"!collapsed\"\n                  (click)=\"onItemClick($event, item)\"\n                >\n                  @if (level === 0) {\n                    @if (item.icon) {\n                      <cx-icon\n                        class=\"cx-side-nav__icon\"\n                        [icon]=\"item.icon\"\n                        [size]=\"16\"\n                        [mood]=\"itemActive.isActive ? 'primary' : 'default'\"\n                      />\n                    } @else {\n                      <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(item.label) }}</span>\n                    }\n                    @if (hasBadge(item)) {\n                      <span\n                        class=\"cx-side-nav__rail-dot\"\n                        [class.cx-side-nav__rail-dot--primary]=\"badgeTone(item) === 'primary'\"\n                        [class.cx-side-nav__rail-dot--accent]=\"badgeTone(item) === 'accent'\"\n                        [class.cx-side-nav__rail-dot--info]=\"badgeTone(item) === 'info'\"\n                        [class.cx-side-nav__rail-dot--success]=\"badgeTone(item) === 'success'\"\n                        [class.cx-side-nav__rail-dot--warning]=\"badgeTone(item) === 'warning'\"\n                        [class.cx-side-nav__rail-dot--danger]=\"badgeTone(item) === 'danger'\"\n                        aria-hidden=\"true\"\n                      ></span>\n                    }\n                  }\n                  <span class=\"cx-side-nav__label\">{{ item.label }}</span>\n                  @if (hasBadge(item)) {\n                    <span\n                      class=\"cx-side-nav__badge\"\n                      [class.cx-side-nav__badge--dot]=\"item.badge === true\"\n                      [class.cx-side-nav__badge--primary]=\"badgeTone(item) === 'primary'\"\n                      [class.cx-side-nav__badge--accent]=\"badgeTone(item) === 'accent'\"\n                      [class.cx-side-nav__badge--info]=\"badgeTone(item) === 'info'\"\n                      [class.cx-side-nav__badge--success]=\"badgeTone(item) === 'success'\"\n                      [class.cx-side-nav__badge--warning]=\"badgeTone(item) === 'warning'\"\n                      [class.cx-side-nav__badge--danger]=\"badgeTone(item) === 'danger'\"\n                    >\n                      {{ badgeLabel(item) }}\n                    </span>\n                  }\n                </a>\n              }\n            </div>\n          }\n        </ng-template>\n\n        @for (group of normalizedGroups(); track group.id) {\n          <div class=\"cx-side-nav__group\">\n            @if (hasGroupToggle(group)) {\n              <button\n                class=\"cx-side-nav__item cx-side-nav__group-toggle\"\n                [class.cx-side-nav__item--active]=\"groupContainsActive(group)\"\n                type=\"button\"\n                [attr.aria-haspopup]=\"collapsed ? 'menu' : null\"\n                [attr.aria-expanded]=\"collapsed ? isFlyoutOpen(group.id) : showGroupItems(group)\"\n                [cxTooltip]=\"group.label\"\n                cxTooltipPosition=\"right\"\n                cxTooltipDelay=\"none\"\n                [cxTooltipDisabled]=\"!collapsed\"\n                (click)=\"toggleGroup(group, $event)\"\n              >\n                @if (group.icon) {\n                  <cx-icon\n                    class=\"cx-side-nav__icon\"\n                    [icon]=\"group.icon\"\n                    [size]=\"16\"\n                    [mood]=\"groupContainsActive(group) ? 'primary' : 'default'\"\n                  />\n                } @else {\n                  <span class=\"cx-side-nav__rail-letter\" aria-hidden=\"true\">{{ railInitial(group.label ?? '') }}</span>\n                }\n                <span class=\"cx-side-nav__label\">{{ group.label }}</span>\n                <cx-icon\n                  class=\"cx-side-nav__group-chevron\"\n                  [icon]=\"showGroupItems(group) ? 'chevron-up' : 'chevron-down'\"\n                  [size]=\"16\"\n                />\n              </button>\n            } @else if (group.label) {\n              <div class=\"cx-side-nav__group-label\">{{ group.label }}</div>\n            }\n            <div\n              class=\"cx-side-nav__group-items\"\n              [class.cx-side-nav__group-items--collapsible]=\"group.collapsible\"\n              [class.cx-side-nav__group-items--expanded]=\"showGroupItems(group)\"\n            >\n              <div\n                class=\"cx-side-nav__group-items-inner\"\n                [class.cx-side-nav__branch]=\"hasGroupToggle(group)\"\n              >\n                <ng-container\n                  [ngTemplateOutlet]=\"navItems\"\n                  [ngTemplateOutletContext]=\"{ $implicit: group.items, level: groupItemLevel(group) }\"\n                />\n              </div>\n            </div>\n          </div>\n        }\n      </nav>\n    }\n\n    <!-- Rail flyout: one menu beside the clicked parent row. The popover is\n         fixed-positioned, so the aside's overflow clipping never touches it. -->\n    @if (flyout(); as railFlyout) {\n      <cx-menu\n        class=\"cx-side-nav__flyout\"\n        [presentation]=\"railFlyout.presentation\"\n        placement=\"right\"\n        [heading]=\"railFlyout.heading\"\n        [items]=\"railFlyout.items\"\n        [currentId]=\"railFlyout.currentId\"\n        [open]=\"true\"\n        [width]=\"208\"\n        (openChange)=\"onFlyoutOpenChange($event)\"\n        (itemSelect)=\"onFlyoutSelect($event)\"\n      />\n    }\n\n    <div class=\"cx-side-nav__footer\">\n      @if (accountName()) {\n        <button\n          class=\"cx-side-nav__account\"\n          type=\"button\"\n          [attr.aria-label]=\"'Account actions for ' + accountName()\"\n          [cxTooltip]=\"accountName()\"\n          [cxTooltipOverflow]=\"!collapsed\"\n          [cxTooltipPosition]=\"collapsed ? 'right' : 'top'\"\n          [cxTooltipDelay]=\"collapsed ? 'none' : 'default'\"\n        >\n          <span class=\"cx-side-nav__account-avatar\" aria-hidden=\"true\">{{ accountInitials() }}</span>\n          <span class=\"cx-side-nav__account-name\" data-cx-tooltip-overflow>{{ accountName() }}</span>\n          <cx-icon class=\"cx-side-nav__account-icon\" icon=\"chevrons-vertical\" [size]=\"16\" />\n        </button>\n      }\n      <ng-content select=\"[footer]\" />\n    </div>\n  </aside>\n}\n", styles: [":host{display:block;height:100%;min-height:0}.cx-side-nav{--cx-side-nav-row-height: calc( var(--controller-size-small) + var(--space-sm) * 2 );--cx-side-nav-subrow-height: calc( var(--controller-size-small) + var(--space-xs) * 2 );--cx-side-nav-row-gap: 1px;--cx-side-nav-rail: calc(var(--controller-size-small) + var(--space-sm));--cx-side-nav-guide: calc( var(--space-xs) + var(--controller-size-small) / 2 - var(--border-width) );--cx-side-nav-guide-offset: calc( var(--cx-side-nav-guide) - var(--cx-side-nav-rail) );--cx-side-nav-elbow: calc(var(--space-sm) + var(--space-xs));--cx-side-nav-guide-line: var(--border-width) solid color-mix(in srgb, var(--ink) 18%, transparent);--cx-side-nav-rail-width: calc( var(--space-sm) * 2 + var(--space-xs) * 2 + var(--controller-size-small) );display:flex;width:240px;height:100%;min-height:100%;flex-direction:column;gap:var(--space-md);padding:var(--space-sm);border-right:var(--line);background:var(--surface-alt);box-sizing:border-box;overflow:hidden;transition:width var(--motion-slow) var(--ease-out-strong)}.cx-side-nav--collapsed{width:var(--cx-side-nav-rail-width)}.cx-side-nav--collapsed .cx-side-nav__items{scrollbar-gutter:auto;scrollbar-width:none}.cx-side-nav--collapsed .cx-side-nav__items::-webkit-scrollbar{display:none}.cx-side-nav:not(:has(.cx-side-nav__header-slot>*,.cx-side-nav__collapse-toggle,.cx-side-nav__skeleton,.cx-side-nav__items,.cx-side-nav__footer>*)){display:none}.cx-side-nav__header{display:flex;width:100%;height:var(--controller-size);min-height:var(--controller-size);align-items:center;flex:0 0 auto}.cx-side-nav__header:not(:has(.cx-side-nav__header-slot>*,.cx-side-nav__collapse-toggle)){display:none}.cx-side-nav__header-slot{display:flex;min-width:0;flex:1 1 auto;align-items:center;margin-left:6px;overflow:hidden;white-space:nowrap;transition:opacity var(--motion-base) ease var(--motion-fast),margin-left var(--motion-slow) var(--ease-out-strong),visibility 0s}.cx-side-nav--collapsed .cx-side-nav__header-slot{opacity:0;margin-left:0;visibility:hidden;transition:opacity var(--motion-base) ease,margin-left var(--motion-slow) var(--ease-out-strong),visibility 0s var(--motion-base)}.cx-side-nav__collapse-toggle{flex:0 0 auto}.cx-side-nav__flyout{position:fixed}.cx-side-nav__skeleton{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--space-xs);padding:var(--space-xs) 0}.cx-side-nav__skeleton-row{display:block;height:var(--cx-side-nav-row-height);border-radius:var(--radius-sm);background:linear-gradient(90deg, var(--opacity-low), var(--opacity-mid), var(--opacity-low));background-size:180% 100%;animation:cx-side-nav-skeleton 1.2s ease-in-out infinite}.cx-side-nav__items{display:flex;min-height:0;flex:1 1 auto;width:100%;flex-direction:column;gap:var(--cx-side-nav-row-gap);overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}.cx-side-nav__group{display:flex;width:100%;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__node{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__group-items{display:flex;width:100%;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__group-items--collapsible{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__group-items--collapsible .cx-side-nav__group-items-inner{overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__group-items--expanded.cx-side-nav__group-items--collapsible{grid-template-rows:1fr}.cx-side-nav__group-items--expanded.cx-side-nav__group-items--collapsible .cx-side-nav__group-items-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-side-nav__group-items-inner{display:flex;width:100%;min-height:0;flex-direction:column;gap:var(--cx-side-nav-row-gap)}.cx-side-nav__branch{padding-left:var(--cx-side-nav-rail)}.cx-side-nav__node--branch>.cx-side-nav__item{min-height:var(--cx-side-nav-subrow-height);padding-block:var(--space-xs)}.cx-side-nav__node--branch>.cx-side-nav__item::before{content:\"\";position:absolute;top:0;left:var(--cx-side-nav-guide-offset);width:var(--cx-side-nav-elbow);height:50%;border-left:var(--cx-side-nav-guide-line);border-bottom:var(--cx-side-nav-guide-line);border-bottom-left-radius:var(--radius-sm);pointer-events:none}.cx-side-nav__node--branch>.cx-side-nav__item::after{content:\"\";position:absolute;top:50%;bottom:calc(-1*var(--cx-side-nav-row-gap));left:var(--cx-side-nav-guide-offset);border-left:var(--cx-side-nav-guide-line);pointer-events:none}.cx-side-nav__node--branch>.cx-side-nav__children{position:relative}.cx-side-nav__node--branch>.cx-side-nav__children::before{content:\"\";position:absolute;top:0;bottom:calc(-1*var(--cx-side-nav-row-gap));left:var(--cx-side-nav-guide-offset);border-left:var(--cx-side-nav-guide-line);pointer-events:none}.cx-side-nav__node--branch:last-child>.cx-side-nav__item::after,.cx-side-nav__node--branch:last-child>.cx-side-nav__children::before{content:none}.cx-side-nav__children{display:grid;width:100%;grid-template-rows:0fr;transition:grid-template-rows var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__children-inner{display:flex;min-height:0;flex-direction:column;gap:var(--cx-side-nav-row-gap);overflow:hidden;visibility:hidden;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity var(--motion-base) ease,transform var(--motion-slow) var(--ease-out-strong)}.cx-side-nav__children--expanded{grid-template-rows:1fr}.cx-side-nav__children--expanded .cx-side-nav__children-inner{visibility:visible;pointer-events:auto;opacity:1;transform:translateY(0)}.cx-side-nav__group-label{padding:0 var(--space-xs);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1.2}.cx-side-nav__item{position:relative;display:flex;width:100%;min-height:var(--cx-side-nav-row-height);align-items:center;gap:var(--space-sm);padding:var(--space-sm) var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;text-align:left;text-decoration:none;cursor:pointer}.cx-side-nav__group-toggle{justify-content:flex-start}.cx-side-nav__item:hover{background:var(--opacity-mid);color:var(--ink)}.cx-side-nav__item:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-side-nav__item:active:not(.cx-side-nav__item--disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-side-nav__item--active{color:var(--ink);font-weight:var(--font-weight-medium)}.cx-side-nav__item--disabled{color:var(--opacity-mid);cursor:default;pointer-events:none}.cx-side-nav__item--toggle{justify-content:flex-start}.cx-side-nav__icon{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);align-items:center;justify-content:center}.cx-side-nav__label{min-width:0;flex:1 1 auto;font-size:var(--font-size-body);line-height:1.2}.cx-side-nav__badge{display:inline-flex;min-width:16px;height:16px;align-items:center;justify-content:center;padding:0 var(--space-2xs);border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);line-height:1}.cx-side-nav__badge--dot{width:8px;min-width:8px;height:8px;padding:0}.cx-side-nav__badge--primary{background:var(--primary-opacity);color:var(--primary)}.cx-side-nav__badge--accent{background:var(--accent-opacity);color:var(--accent)}.cx-side-nav__badge--info{background:var(--info-opacity);color:var(--info)}.cx-side-nav__badge--success{background:var(--success-opacity);color:var(--success)}.cx-side-nav__badge--warning{background:var(--warning-opacity);color:var(--warning)}.cx-side-nav__badge--danger{background:var(--danger-opacity);color:var(--danger)}.cx-side-nav__group-chevron,.cx-side-nav__item-chevron{flex:0 0 auto;margin-left:auto}.cx-side-nav__footer{display:flex;width:100%;flex-direction:column;gap:var(--space-xs);padding-top:var(--space-xs);border-top:var(--line-discreet);flex:0 0 auto;box-sizing:border-box}.cx-side-nav__footer:empty{display:none}.cx-side-nav__account{display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-xs);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);font:inherit;text-align:left;cursor:pointer}.cx-side-nav__account:hover{background:var(--opacity-low)}.cx-side-nav__account:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-side-nav__account-avatar{display:inline-flex;width:24px;height:24px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--primary);color:var(--on-ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1}.cx-side-nav__account-name{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1.2}.cx-side-nav__account-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-side-nav--collapsible .cx-side-nav__label,.cx-side-nav--collapsible .cx-side-nav__group-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cx-side-nav__label,.cx-side-nav__badge,.cx-side-nav__item-chevron,.cx-side-nav__group-chevron,.cx-side-nav__account-name,.cx-side-nav__account-icon{transition:opacity var(--motion-base) ease var(--motion-fast)}.cx-side-nav--collapsed .cx-side-nav__label,.cx-side-nav--collapsed .cx-side-nav__badge,.cx-side-nav--collapsed .cx-side-nav__item-chevron,.cx-side-nav--collapsed .cx-side-nav__group-chevron,.cx-side-nav--collapsed .cx-side-nav__account-name,.cx-side-nav--collapsed .cx-side-nav__account-icon{opacity:0;transition-delay:0s}.cx-side-nav__group-label{position:relative;transition:color var(--motion-base) ease var(--motion-fast)}.cx-side-nav__group-label::after{content:\"\";position:absolute;top:50%;left:var(--space-xs);width:var(--controller-size-small);border-top:var(--line-discreet);opacity:0;transition:opacity var(--motion-base) ease}.cx-side-nav--collapsed .cx-side-nav__group-label{color:rgba(0,0,0,0);transition-delay:0s}.cx-side-nav--collapsed .cx-side-nav__group-label::after{opacity:1;transition-delay:var(--motion-fast)}.cx-side-nav__rail-letter{position:absolute;top:50%;left:var(--space-xs);display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:1;translate:0 -50%;opacity:0;pointer-events:none;transition:opacity var(--motion-base) ease}.cx-side-nav--collapsed .cx-side-nav__rail-letter{opacity:1;transition-delay:var(--motion-fast)}.cx-side-nav__rail-dot{position:absolute;top:calc(50% - var(--controller-size-small)/2);left:calc(var(--space-xs) + var(--controller-size-small) - 6px);width:8px;height:8px;border-radius:var(--radius-pill);background:var(--opacity-high);opacity:0;pointer-events:none;transition:opacity var(--motion-base) ease}.cx-side-nav--collapsed .cx-side-nav__rail-dot{opacity:1;transition-delay:var(--motion-fast)}.cx-side-nav__rail-dot--primary{background:var(--primary)}.cx-side-nav__rail-dot--accent{background:var(--accent)}.cx-side-nav__rail-dot--info{background:var(--info)}.cx-side-nav__rail-dot--success{background:var(--success)}.cx-side-nav__rail-dot--warning{background:var(--warning)}.cx-side-nav__rail-dot--danger{background:var(--danger)}@media(prefers-reduced-motion: reduce){.cx-side-nav,.cx-side-nav__header-slot,.cx-side-nav__label,.cx-side-nav__badge,.cx-side-nav__item-chevron,.cx-side-nav__group-chevron,.cx-side-nav__group-label,.cx-side-nav__group-label::after,.cx-side-nav__rail-letter,.cx-side-nav__rail-dot,.cx-side-nav__account-name,.cx-side-nav__account-icon,.cx-side-nav__group-items--collapsible,.cx-side-nav__group-items--collapsible .cx-side-nav__group-items-inner,.cx-side-nav__children,.cx-side-nav__children-inner,.cx-side-nav__skeleton-row{transition:none;animation:none}}@keyframes cx-side-nav-skeleton{0%{background-position:100% 0}100%{background-position:-80% 0}}"] }]
        }], ctorParameters: () => [], propDecorators: { items: [{
                type: Input
            }], groups: [{
                type: Input
            }], name: [{
                type: Input
            }], initials: [{
                type: Input
            }], navbarVisible: [{
                type: Input
            }], loading: [{
                type: Input
            }], collapsible: [{
                type: Input
            }], collapsed: [{
                type: Input
            }], itemSelect: [{
                type: Output
            }], collapsedChange: [{
                type: Output
            }] } });
/** Rail flyout row: same identity and nesting, menu vocabulary. Children carry no icons by contract. */
function toFlyoutMenuItem(item) {
    return {
        id: item.id,
        label: item.label,
        ...(item.disabled ? { disabled: true } : {}),
        ...(item.children?.length ? { items: item.children.map(child => toFlyoutMenuItem(child)) } : {}),
    };
}
function findSideNavItem(items, id) {
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
function validateSideNavItems(value, inputName) {
    if (!Array.isArray(value)) {
        throw new Error(`[cx-side-nav] ${inputName} must be an array.`);
    }
    validateSideNavItemLevel(value, inputName, new Set(), 0);
    return [...value];
}
function validateSideNavItemLevel(items, path, ids, level) {
    const labels = new Set();
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
            throw new Error(`[cx-side-nav] ${itemPath} must not set an icon. Nested items are marked by the tree guide — icons belong to top-level items and group parent rows.`);
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
function validateSideNavGroups(value) {
    if (!Array.isArray(value)) {
        throw new Error('[cx-side-nav] groups must be an array.');
    }
    const groupIds = new Set();
    const groupLabels = new Set();
    const itemIds = new Set();
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
