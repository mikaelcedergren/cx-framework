import { AfterViewInit, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxTabItem } from '../../navigation/cx-tabs';
import { type CxMenuItem } from '../../overlay/cx-menu';
import * as i0 from "@angular/core";
export type CxCardMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxCardVariant = 'default' | 'border';
export declare class CxCardComponent implements OnChanges, AfterViewInit, OnDestroy {
    private warnedInvalidActivation;
    private warnedInvalidExpansion;
    private warnedInvalidTabs;
    private resizeObserver;
    protected readonly contentId: string;
    protected readonly expanded: import("@angular/core").WritableSignal<boolean>;
    private readonly contentHeight;
    private cardViewportRef?;
    private cardContentRef?;
    private cardMetaRef?;
    heading: string | undefined;
    icon: CxIconName | undefined;
    mood: CxCardMood;
    variant: CxCardVariant;
    /** Action mode. The card exposes a real button surface and emits pressed. */
    interactive: boolean;
    /** Navigation mode. Takes precedence over interactive and exposes a real link surface. */
    href: string | undefined;
    target: string | undefined;
    rel: string | undefined;
    /** Accessible name for the card action or link; falls back to heading. */
    ariaLabel: string | undefined;
    menuItems: readonly CxMenuItem[] | undefined;
    /** Clamps overflowing content to previewHeight behind an earned expand control. */
    expandable: boolean;
    /** Collapsed content height in px. The expand control appears only when content exceeds it. */
    previewHeight: number;
    /** Renders a flush tab row between the header and the content island. */
    tabs: readonly CxTabItem[] | undefined;
    selectedTabId: string | undefined;
    /** Accessible name for the tab row; falls back to the heading. */
    tabsAriaLabel: string | undefined;
    readonly menuItemSelect: EventEmitter<string>;
    /** Emitted only by action mode. Navigation mode follows native link behavior. */
    readonly pressed: EventEmitter<void>;
    readonly selectedTabIdChange: EventEmitter<string>;
    ngOnChanges(_changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    protected get resolvedHref(): string | undefined;
    protected get activatable(): boolean;
    protected get resolvedRel(): string | null;
    protected get activationLabel(): string;
    protected onActivate(): void;
    protected get expansionEnabled(): boolean;
    protected get hasTabs(): boolean;
    protected get resolvedTabsAriaLabel(): string;
    protected get selectedTabButtonId(): string | null;
    protected onTabSelect(id: string): void;
    protected overflowing(): boolean;
    protected clamped(): boolean;
    protected viewportMaxHeight(): number | null;
    protected toggleExpanded(): void;
    protected expandAriaLabel(): string;
    protected onViewportFocusIn(event: FocusEvent): void;
    private syncContentObserver;
    protected hasHeading(): boolean;
    protected hasMenuItems(): boolean;
    protected resolvedMenuAriaLabel(): string;
    protected onMenuItemSelect(itemId: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxCardComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxCardComponent, "cx-card", never, { "heading": { "alias": "heading"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "interactive": { "alias": "interactive"; "required": false; }; "href": { "alias": "href"; "required": false; }; "target": { "alias": "target"; "required": false; }; "rel": { "alias": "rel"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "menuItems": { "alias": "menuItems"; "required": false; }; "expandable": { "alias": "expandable"; "required": false; }; "previewHeight": { "alias": "previewHeight"; "required": false; }; "tabs": { "alias": "tabs"; "required": false; }; "selectedTabId": { "alias": "selectedTabId"; "required": false; }; "tabsAriaLabel": { "alias": "tabsAriaLabel"; "required": false; }; }, { "menuItemSelect": "menuItemSelect"; "pressed": "pressed"; "selectedTabIdChange": "selectedTabIdChange"; }, never, ["[slot=meta], [cxCardMeta]", "*", "[slot=footer], [cxCardFooter]"], true, never>;
    static ngAcceptInputType_interactive: unknown;
    static ngAcceptInputType_expandable: unknown;
}
//# sourceMappingURL=cx-card.component.d.ts.map