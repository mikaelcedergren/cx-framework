import { AfterViewChecked, EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxIconMood } from '../../primitives/media/cx-icon';
import { type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxDismissRequest } from '../../primitives/overlay/dismiss-request';
import { type CxTabItem } from '../../primitives/navigation/cx-tabs';
import * as i0 from "@angular/core";
export type CxDetailPanelVariant = 'floating' | 'fixed';
export type CxDetailPanelMood = CxIconMood;
export declare class CxDetailPanelComponent implements AfterViewChecked, OnDestroy {
    private static nextId;
    private readonly host;
    private readonly overlayState;
    private overlayHandle?;
    private dismissMeasureFrame;
    private dismissFallbackTimer;
    private restoreFocusOnDismiss;
    private dismissCompleted;
    private selectedTabIdValue;
    private menuItemsValue;
    private tabsValue;
    private readonly instanceId;
    private readonly contentSections?;
    private readonly contentViewport?;
    private readonly panelSurface?;
    icon: CxIconName | undefined;
    /** Colors the header icon; every other part of the header stays ink. */
    mood: CxDetailPanelMood;
    heading: string;
    variant: CxDetailPanelVariant;
    set menuItems(value: readonly CxMenuItem[] | undefined);
    get menuItems(): readonly CxMenuItem[] | undefined;
    menuAriaLabel: string | undefined;
    set tabs(value: readonly CxTabItem[]);
    get tabs(): readonly CxTabItem[];
    tabsAriaLabel: string | undefined;
    /** Optional width / min-width overrides (any CSS length) for the panel host. */
    set width(value: string | null);
    get width(): string | null;
    private widthValue;
    minWidth: string | null;
    /** Lets the user drag the panel's start edge to change its width. */
    resizable: boolean;
    /**
     * Renders the footer bar and its close button. Turning it off removes the
     * panel's only pointer-reachable exit; Escape and an enabled outside click
     * remain the dismissal paths.
     */
    footer: boolean;
    /**
     * Also dismiss on a click outside the panel after any owned overlay closes.
     * A successful dismissal lets that pointer action continue to its outside
     * target and does not restore focus to the panel's invoker.
     */
    dismissOnClickOutside: boolean;
    readonly dismissed: EventEmitter<void>;
    /** Synchronous request emitted before a user dismissal would close this panel. */
    readonly dismissRequest: EventEmitter<CxDismissRequest>;
    readonly menuItemSelect: EventEmitter<string>;
    readonly selectedTabIdChange: EventEmitter<string>;
    /** Emits the rendered width as a px length after a user resize settles. */
    readonly widthChange: EventEmitter<string>;
    protected readonly closing$: import("@angular/core").WritableSignal<boolean>;
    protected readonly resizing$: import("@angular/core").WritableSignal<boolean>;
    private readonly resizedWidth$;
    private activeResizeSession?;
    protected readonly headingId: string;
    protected readonly tabPanelId: string;
    constructor();
    set selectedTabId(value: string | undefined);
    get selectedTabId(): string | undefined;
    ngAfterViewChecked(): void;
    get widthVar(): string | null;
    get minWidthVar(): string | null;
    protected get floatingHostClass(): boolean;
    protected get isFixed(): boolean;
    protected get hasTabs(): boolean;
    protected get normalizedHeading(): string;
    protected get hasMenuItems(): boolean;
    protected get resolvedMenuAriaLabel(): string;
    protected get resolvedTabsAriaLabel(): string;
    protected get resolvedCloseAriaLabel(): string;
    protected get resolvedResizeAriaLabel(): string;
    protected get renderedWidthPx(): number;
    protected onResizePointerDown(event: PointerEvent): void;
    protected onResizePointerMove(event: PointerEvent): void;
    protected onResizePointerUp(event: PointerEvent): void;
    protected onResizePointerCancel(event: PointerEvent): void;
    protected onResizeLostPointerCapture(event: PointerEvent): void;
    protected onResizeKeydown(event: KeyboardEvent): void;
    protected onResizeDoubleClick(event: MouseEvent): void;
    private finishResizeSession;
    private stopResizeSession;
    private emitRenderedWidthAfterLayout;
    protected get selectedTabButtonId(): string | null;
    protected onDocumentMousedown(event: MouseEvent): void;
    protected dismiss(restoreFocus?: boolean): boolean;
    protected onDismissAnimationEnd(event: AnimationEvent): void;
    ngOnDestroy(): void;
    protected onMenuItemSelect(id: string): void;
    protected onTabSelect(id: string): void;
    private resetContentScroll;
    private scheduleDismissFallback;
    private completeDismiss;
    private clearDismissSchedule;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxDetailPanelComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxDetailPanelComponent, "cx-detail-panel", never, { "icon": { "alias": "icon"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "heading": { "alias": "heading"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "menuItems": { "alias": "menuItems"; "required": false; }; "menuAriaLabel": { "alias": "menuAriaLabel"; "required": false; }; "tabs": { "alias": "tabs"; "required": false; }; "tabsAriaLabel": { "alias": "tabsAriaLabel"; "required": false; }; "width": { "alias": "width"; "required": false; }; "minWidth": { "alias": "minWidth"; "required": false; }; "resizable": { "alias": "resizable"; "required": false; }; "footer": { "alias": "footer"; "required": false; }; "dismissOnClickOutside": { "alias": "dismissOnClickOutside"; "required": false; }; "selectedTabId": { "alias": "selectedTabId"; "required": false; }; }, { "dismissed": "dismissed"; "dismissRequest": "dismissRequest"; "menuItemSelect": "menuItemSelect"; "selectedTabIdChange": "selectedTabIdChange"; "widthChange": "widthChange"; }, ["contentSections"], ["cx-status-tag[detail-panel-status]", "*", "[detail-panel-footer]"], true, never>;
    static ngAcceptInputType_resizable: unknown;
    static ngAcceptInputType_footer: unknown;
}
//# sourceMappingURL=cx-detail-panel.component.d.ts.map