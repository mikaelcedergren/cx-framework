import { OnDestroy, EventEmitter } from "@angular/core";
import { type IsActiveMatchOptions } from "@angular/router";
import { type CxIconName } from "../../icons/manifest";
import * as i0 from "@angular/core";
export type CxMastheadVariant = "default" | "frosted" | "transparent";
export type CxMastheadItem = {
    id: string;
    label: string;
    /** Router target — renders the link as an in-app `<a routerLink>`, e.g. `['/about']`. */
    routerLink?: string | readonly unknown[];
    /** Optional URL fragment, e.g. an on-page anchor section. */
    fragment?: string;
    /** How `routerLinkActive` decides this item is the current page. Defaults to exact-path. */
    routerLinkActiveOptions?: {
        exact: boolean;
    } | IsActiveMatchOptions;
    /**
     * Plain link target. When set, the item renders as an `<a href>` instead of an
     * in-app router link — use it for marketing anchors (`#work`) or external URLs.
     */
    href?: string;
    /** Anchor target for {@link href}, e.g. `'_blank'` to open in a new tab. */
    target?: string;
    /** Anchor `rel` for {@link href}; defaults to `'noopener'` for `_blank`. */
    rel?: string;
    /** Marks an `href` item as the current page. Router items derive this automatically. */
    active?: boolean;
    disabled?: boolean;
};
/**
 * Landing-page masthead: brand on the left, primary navigation on the right.
 *
 * Distinct from `cx-top-bar` (in-app page chrome). The masthead is the
 * identity-and-wayfinding banner for a marketing or portfolio surface. Below a
 * narrow container width it collapses its links behind a menu toggle, so it can
 * sit on any page width without overflowing.
 */
export declare class CxMastheadComponent implements OnDestroy {
    private readonly document;
    private readonly host;
    private readonly overlayState;
    private overlayHandle?;
    private portaledMenu?;
    private closingAnimationsPending;
    private readonly positionListener;
    private readonly visibilityObserver;
    private resizeObserver?;
    private scrollTarget?;
    protected readonly headerHeight: import("@angular/core").WritableSignal<number>;
    protected readonly scrolled: import("@angular/core").WritableSignal<boolean>;
    private readonly scrollListener;
    private focusPending;
    private readonly focusListener;
    private readonly closingKeyListener;
    private readonly drawerOverlay;
    private readonly menuSurface;
    private readonly menuSlot;
    protected readonly menuClosing: import("@angular/core").WritableSignal<boolean>;
    protected readonly trapsFocus: import("@angular/core").WritableSignal<boolean>;
    constructor();
    ngOnDestroy(): void;
    private syncScrollTarget;
    protected surfaceVariant(): CxMastheadVariant;
    private closeWhenExpanded;
    private syncMenuPosition;
    private keepFocusInside;
    private itemsValue;
    /** Brand title shown next to the logo, e.g. a name or product wordmark. */
    heading: string;
    /** Icon used as the brand mark when no `[brand]` slot or `logoSrc` is provided. */
    logo: CxIconName | undefined;
    /** Image source for the brand mark; takes precedence over {@link logo}. */
    logoSrc: string | undefined;
    /**
     * Link target for the brand cluster (clicking the logo/title goes here),
     * e.g. `'/'` or `'#top'`. For in-app router navigation, provide your own
     * `<a brand routerLink>` via the `[brand]` slot instead.
     */
    homeHref: string | undefined;
    /** Primary navigation links. */
    set items(value: CxMastheadItem[]);
    get items(): CxMastheadItem[];
    /** Surface treatment. Frosted uses a translucent, theme-aware surface with backdrop blur. */
    variant: CxMastheadVariant;
    /** Sticks the component host to the top of its scroll container. */
    sticky: boolean;
    /** Overlaps the next sibling without moving content when its surface changes. */
    overlay: boolean;
    /** Pins the masthead, transparent at the scroll origin and frosted after scrolling. */
    frostOnScroll: boolean;
    /** Optional toggle label override; otherwise announces Open menu or Close menu. */
    menuAriaLabel: string | undefined;
    /** Emits when a navigation item is activated. */
    readonly itemSelect: EventEmitter<CxMastheadItem>;
    protected readonly panelId: string;
    protected readonly menuOpen: import("@angular/core").WritableSignal<boolean>;
    private readonly menuToggle;
    protected hasDefaultBrand(): boolean;
    protected activeOptions(item: CxMastheadItem): {
        exact: boolean;
    } | IsActiveMatchOptions;
    protected resolvedMenuAriaLabel(): string;
    protected toggleMenu(): void;
    protected closeMenu(): void;
    private finishClose;
    protected onBackdrop(event: MouseEvent): void;
    protected onItemClick(event: MouseEvent, item: CxMastheadItem): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMastheadComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMastheadComponent, "cx-masthead", never, { "heading": { "alias": "heading"; "required": false; }; "logo": { "alias": "logo"; "required": false; }; "logoSrc": { "alias": "logoSrc"; "required": false; }; "homeHref": { "alias": "homeHref"; "required": false; }; "items": { "alias": "items"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "sticky": { "alias": "sticky"; "required": false; }; "overlay": { "alias": "overlay"; "required": false; }; "frostOnScroll": { "alias": "frostOnScroll"; "required": false; }; "menuAriaLabel": { "alias": "menuAriaLabel"; "required": false; }; }, { "itemSelect": "itemSelect"; }, never, ["[brand], [cxMastheadBrand]", "[actions], [cxMastheadActions]"], true, never>;
    static ngAcceptInputType_sticky: unknown;
    static ngAcceptInputType_overlay: unknown;
    static ngAcceptInputType_frostOnScroll: unknown;
}
//# sourceMappingURL=cx-masthead.component.d.ts.map