import { AfterContentInit, EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxMenuLayout = 'inline' | 'fill';
export type CxMenuSelection = 'single' | 'multiple';
export type CxMenuItemType = 'action' | 'choice';
/**
 * Which side of the anchor the surface opens on. `auto` keeps the classic
 * drop behavior — below the anchor, above when space runs out. An explicit
 * side is honored and viewport-clamped; `left`/`right` fall back to the
 * opposite side only when the requested one has no room at all.
 */
export type CxMenuPlacement = 'auto' | 'top' | 'right' | 'bottom' | 'left';
type CxMenuSurfaceSide = 'top' | 'right' | 'bottom' | 'left';
export type CxMenuPresentation = {
    kind: 'trigger';
} | {
    kind: 'inline';
}
/**
 * Anchored to a point (e.g. a right-click). An `owner` names the element
 * that opened the menu: tooltips on it stand down while the menu is open,
 * focus returns to it on close, and a side `placement` hugs its rect
 * instead of the bare point.
 */
 | {
    kind: 'context';
    left: number;
    top: number;
    owner?: HTMLElement;
};
export type CxMenuItem = {
    id: string;
    label: string;
    prependIcon?: CxIconName;
    appendIcon?: CxIconName;
    description?: string;
    disabled?: boolean;
    selected?: boolean;
    type?: CxMenuItemType;
    /** How this item's submenu tracks selection. Only read when the item has children. */
    selection?: CxMenuSelection;
    danger?: boolean;
    shortcutParts?: readonly string[];
    dividerBefore?: boolean;
    dividerAfter?: boolean;
    items?: readonly CxMenuItem[];
    /** Independent actions shown from a trailing kebab without replacing the row's primary action or choice. */
    trailingActions?: readonly CxMenuItem[];
};
export type CxMenuGroup = {
    id?: string;
    label?: string;
    description?: string;
    /**
     * Declares the group as a choice group: 'single' announces items as
     * menuitemradio, 'multiple' as menuitemcheckbox, both with aria-checked.
     * Items with type: 'action' stay plain commands inside a choice group.
     */
    selection?: CxMenuSelection;
    items: readonly CxMenuItem[];
};
type CxMenuItemRole = 'menuitem' | 'menuitemradio' | 'menuitemcheckbox';
type CxResolvedMenuItem = CxMenuItem & {
    prependIcon?: CxIconName;
    appendIcon?: CxIconName;
    dividerBeforeResolved: boolean;
    hasChildren: boolean;
    hasTrailingActions: boolean;
    role: CxMenuItemRole;
    items?: CxResolvedMenuItem[];
    trailingActions?: CxResolvedMenuItem[];
};
type CxResolvedMenuGroup = Omit<CxMenuGroup, 'id' | 'items'> & {
    id: string;
    items: CxResolvedMenuItem[];
};
type CxResolvedMenuVisualGroup = Pick<CxResolvedMenuGroup, 'id' | 'label' | 'description'> & {
    items: CxResolvedMenuItem[];
};
type CxMenuSubmenuSurface = {
    path: string;
    anchorPath: string;
    anchorKind: 'option' | 'trailing-actions';
    label: string;
    level: number;
    items: CxResolvedMenuItem[];
    left: number;
    top: number;
    maxHeight: number;
};
export declare class CxMenuComponent implements AfterContentInit, OnDestroy {
    private static instanceCounter;
    private readonly host;
    private readonly hostVisibility;
    private readonly instanceId;
    protected readonly scopeId: string;
    protected readonly rootSurfaceId: string;
    private readonly itemsState;
    private readonly groupsState;
    private readonly headingState;
    private readonly currentIdState;
    private readonly shortcutsEnabledState;
    private readonly openState;
    private readonly presentationState;
    private readonly submenuSurfacesState;
    private readonly alignState;
    private readonly placementState;
    private readonly layoutState;
    private readonly widthState;
    private readonly surfaceTopState;
    private readonly surfaceBottomState;
    private readonly surfaceLeftState;
    private readonly surfaceMaxHeightState;
    private readonly surfacePlacementState;
    private surfaceLockedPlacement?;
    private triggerElement?;
    private triggerButton?;
    protected get rootPopoverOwner(): HTMLElement | undefined;
    private triggerOriginalState?;
    private resizeObserver?;
    private destroyed;
    private readonly triggerClickListener;
    private readonly triggerKeydownListener;
    private triggerDirectives?;
    private triggerChangesSubscription?;
    private rootPopoverRef?;
    private triggerAnchorRef?;
    private disabledValue;
    set disabled(value: boolean);
    get disabled(): boolean;
    set presentation(value: CxMenuPresentation);
    ariaLabel: string;
    set heading(value: string | undefined);
    set items(value: readonly CxMenuItem[] | undefined);
    set groups(value: readonly CxMenuGroup[] | undefined);
    set currentId(value: string | undefined);
    set shortcutsEnabled(value: boolean);
    set open(value: boolean);
    set align(value: 'start' | 'end');
    set placement(value: CxMenuPlacement | undefined);
    set layout(value: CxMenuLayout | undefined);
    set width(value: number);
    readonly openChange: EventEmitter<boolean>;
    readonly itemSelect: EventEmitter<string>;
    readonly currentIdChange: EventEmitter<string>;
    protected readonly isOpen$: import("@angular/core").Signal<boolean>;
    protected readonly presentation$: import("@angular/core").Signal<CxMenuPresentation>;
    protected readonly layout$: import("@angular/core").Signal<CxMenuLayout>;
    protected readonly heading$: import("@angular/core").Signal<string>;
    protected readonly currentId$: import("@angular/core").Signal<string | undefined>;
    protected readonly surfaceTop$: import("@angular/core").Signal<number | undefined>;
    protected readonly surfaceBottom$: import("@angular/core").Signal<number | undefined>;
    protected readonly surfaceLeft$: import("@angular/core").Signal<number | undefined>;
    protected readonly surfaceWidth$: import("@angular/core").Signal<number>;
    protected readonly surfaceMaxHeight$: import("@angular/core").Signal<number | undefined>;
    protected readonly surfacePlacement$: import("@angular/core").Signal<CxMenuSurfaceSide>;
    protected readonly submenuSurfaces$: import("@angular/core").Signal<CxMenuSubmenuSurface[]>;
    protected readonly normalizedItems$: import("@angular/core").Signal<CxResolvedMenuItem[]>;
    protected readonly normalizedGroups$: import("@angular/core").Signal<CxResolvedMenuGroup[]>;
    protected readonly visibleGroups$: import("@angular/core").Signal<CxResolvedMenuGroup[]>;
    protected readonly visualGroups$: import("@angular/core").Signal<CxResolvedMenuVisualGroup[]>;
    protected get resolvedMenuAriaLabel(): string;
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    private onTriggerClick;
    private onTriggerKeydown;
    protected onResolvedItemClick(item: CxResolvedMenuItem, level: number, parentPath: string, optionWrap: HTMLElement, event: MouseEvent): void;
    protected onResolvedItemPointerEnter(item: CxResolvedMenuItem, level: number, parentPath: string, optionWrap: HTMLElement): void;
    protected onResolvedItemKeydown(event: KeyboardEvent, item: CxResolvedMenuItem, level: number, parentPath: string, optionWrap: HTMLElement): void;
    protected itemPath(parentPath: string, itemId: string): string;
    protected visualGroupsForItems(items: readonly CxResolvedMenuItem[], idPrefix: string): CxResolvedMenuVisualGroup[];
    protected itemSelectedState(item: CxResolvedMenuItem): boolean;
    private activateItem;
    protected submenuSurfaceId(path: string): string;
    protected itemSubmenuState(parentPath: string, item: CxResolvedMenuItem): 'none' | 'open' | 'closed';
    protected itemTrailingActionsState(parentPath: string, item: CxResolvedMenuItem): boolean;
    protected trailingActionsSurfaceId(parentPath: string, item: CxResolvedMenuItem): string;
    protected onTrailingActionsClick(item: CxResolvedMenuItem, level: number, parentPath: string, anchorElement: HTMLElement, event: MouseEvent): void;
    protected onTrailingActionsKeydown(event: KeyboardEvent, anchorElement: HTMLElement): void;
    protected onDocumentPointerDown(event: PointerEvent): void;
    protected onEscapeKey(): void;
    protected onDocumentKeydown(event: KeyboardEvent): void;
    protected onWindowResize(): void;
    private toggleOpen;
    protected setOpen(nextOpen: boolean, restoreFocus?: boolean): void;
    private syncSurfaceMetrics;
    private openSubmenu;
    private openTrailingActions;
    private trimSubmenus;
    private updateCurrentId;
    private closeSurface;
    private setSubmenuSurfaces;
    private onHostVisibilityChange;
    private isSurfaceActive;
    private syncSubmenuSurfaceMetrics;
    private moveMenuFocus;
    private rootSurfaceElement;
    private menuSurfaceElements;
    private targetIsInsideMenuSurface;
    private optionButtonsInSurface;
    private optionButtonByPath;
    private optionWrapByPath;
    private trailingActionsButtonByPath;
    private focusParentControl;
    private focusWhenReady;
    private focusTargetIsStable;
    private focusTrigger;
    private focusFirstEnabledOption;
    private connectTrigger;
    private syncTriggerResizeObserver;
    private disconnectTrigger;
    private syncTriggerState;
    private restoreAttribute;
    private normalizePresentation;
    private presentationsMatch;
    private rootItems;
    private findShortcutItem;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMenuComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMenuComponent, "cx-menu", never, { "disabled": { "alias": "disabled"; "required": false; }; "presentation": { "alias": "presentation"; "required": true; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "heading": { "alias": "heading"; "required": false; }; "items": { "alias": "items"; "required": false; }; "groups": { "alias": "groups"; "required": false; }; "currentId": { "alias": "currentId"; "required": false; }; "shortcutsEnabled": { "alias": "shortcutsEnabled"; "required": false; }; "open": { "alias": "open"; "required": false; }; "align": { "alias": "align"; "required": false; }; "placement": { "alias": "placement"; "required": false; }; "layout": { "alias": "layout"; "required": false; }; "width": { "alias": "width"; "required": false; }; }, { "openChange": "openChange"; "itemSelect": "itemSelect"; "currentIdChange": "currentIdChange"; }, ["triggerDirectives"], ["[cxMenuTrigger]", "[actions]"], true, never>;
}
export {};
//# sourceMappingURL=cx-menu.component.d.ts.map