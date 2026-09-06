import { ChangeDetectionStrategy, Component, ContentChildren, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, computed, inject, signal, } from '@angular/core';
import { eventMatchesShortcut, isTypingTarget } from '../../actions/shared/shortcuts.js';
import { CxOptionComponent } from '../cx-option/index.js';
import { CxOptionGroupComponent } from '../cx-option-group/index.js';
import { CxPopoverComponent } from '../cx-popover/index.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxHostVisibilityObserver, isHostVisible } from '../../shared/host-visibility.js';
import { measureCxFloatingSurface } from '../floating-surface.js';
import { CxMenuTriggerDirective } from './cx-menu-trigger.directive.js';
import * as i0 from "@angular/core";
function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}
function estimateMenuSurfaceHeight(items) {
    return Math.min(Math.max(items.length, 1) * 48 + 8, 320);
}
function resolveMenuItems(items, selection) {
    return items.map((item, index) => {
        const hasChildren = childItemsFor(item).length > 0;
        const hasTrailingActions = trailingActionsFor(item).length > 0;
        const itemType = hasChildren ? 'action' : (item.type ?? (selection ? 'choice' : 'action'));
        if (hasChildren && (item.type === 'choice' || item.selected !== undefined)) {
            throw new Error(`[cx-menu] Submenu item "${item.id}" cannot declare choice state.`);
        }
        if (!hasChildren && itemType === 'action' && item.selected !== undefined) {
            throw new Error(`[cx-menu] Action item "${item.id}" cannot declare selected state.`);
        }
        return {
            ...item,
            type: itemType,
            dividerBeforeResolved: index > 0 && ((item.dividerBefore ?? false) || (items[index - 1]?.dividerAfter ?? false)),
            hasChildren,
            hasTrailingActions,
            role: resolveMenuItemRole({ ...item, type: itemType }, hasChildren, selection),
            items: hasChildren ? resolveMenuItems(childItemsFor(item), item.selection) : undefined,
            trailingActions: hasTrailingActions ? resolveMenuItems(trailingActionsFor(item)) : undefined,
        };
    });
}
function resolveMenuItemRole(item, hasChildren, selection) {
    if (hasChildren || item.type === 'action' || (!item.type && !selection)) {
        return 'menuitem';
    }
    if (selection === 'multiple') {
        return 'menuitemcheckbox';
    }
    return 'menuitemradio';
}
function childItemsFor(item) {
    return item.items ?? [];
}
function trailingActionsFor(item) {
    return item.trailingActions ?? [];
}
function validateMenuItems(items, seenIds = new Set()) {
    if (!Array.isArray(items)) {
        throw new Error('[cx-menu] items must be an array.');
    }
    for (const item of items) {
        const id = item.id?.trim();
        if (!id) {
            throw new Error('[cx-menu] every item requires a non-empty id.');
        }
        if (seenIds.has(id)) {
            throw new Error(`[cx-menu] item ids must be unique; received "${id}" more than once.`);
        }
        seenIds.add(id);
        if (childItemsFor(item).length > 0 && trailingActionsFor(item).length > 0) {
            throw new Error(`[cx-menu] Item "${item.id}" cannot have both a submenu and trailing actions.`);
        }
        validateMenuItems(childItemsFor(item), seenIds);
        validateMenuItems(trailingActionsFor(item), seenIds);
    }
}
function resolveMenuGroups(groups) {
    return groups.map((group, index) => ({
        ...group,
        id: group.id?.trim() || `group-${index}`,
        items: resolveMenuItems(group.items, group.selection),
    }));
}
function splitMenuItemsIntoVisualGroups(items, idPrefix, label, description) {
    const groups = [];
    let index = 0;
    let current = {
        id: `${idPrefix}-visual-${index}`,
        label,
        description,
        items: [],
    };
    for (const item of items) {
        if (item.dividerBeforeResolved && current.items.length > 0) {
            groups.push(current);
            index += 1;
            current = {
                id: `${idPrefix}-visual-${index}`,
                items: [],
            };
        }
        current.items.push(item);
    }
    if (current.items.length > 0 || current.label || current.description) {
        groups.push(current);
    }
    return groups.map(group => {
        const keepsPrependIcons = group.items.length > 0 && group.items.every(item => !!item.prependIcon);
        if (keepsPrependIcons) {
            return group;
        }
        return {
            ...group,
            items: group.items.map(item => ({ ...item, prependIcon: undefined })),
        };
    });
}
function resolveMenuVisualGroups(groups) {
    return groups.flatMap((group) => splitMenuItemsIntoVisualGroups(group.items, group.id, group.label, group.description));
}
function buildItemPath(parentPath, itemId) {
    return parentPath ? `${parentPath}/${itemId}` : itemId;
}
function buildTrailingActionsPath(itemPath) {
    return `${itemPath}/__trailing-actions`;
}
/**
 * Places a surface beside its anchor — the geometry submenus have always used,
 * generalized so a root surface with `placement` left/right shares it. The
 * requested side wins whenever it fits the width or offers at least as much
 * room as the other side; `lockedSide` keeps an open surface where it is.
 */
function measureCxMenuSideSurface(input) {
    const viewportPadding = input.viewportPadding ?? 8;
    const gap = input.gap ?? 8;
    const maxViewportWidth = Math.max(input.viewportWidth - viewportPadding * 2, 0);
    const width = Math.floor(clamp(input.width, 160, maxViewportWidth));
    const spaceRight = input.viewportWidth - input.triggerRect.right - viewportPadding - gap;
    const spaceLeft = input.triggerRect.left - viewportPadding - gap;
    const side = input.lockedSide ??
        (input.prefer === 'right'
            ? spaceRight >= width || spaceRight >= spaceLeft
                ? 'right'
                : 'left'
            : spaceLeft >= width || spaceLeft >= spaceRight
                ? 'left'
                : 'right');
    const leftBase = side === 'right' ? input.triggerRect.right + gap : input.triggerRect.left - width - gap;
    const left = Math.floor(clamp(leftBase, viewportPadding, input.viewportWidth - width - viewportPadding));
    const maxTop = Math.max(input.viewportHeight - Math.min(input.estimatedHeight, input.viewportHeight - viewportPadding * 2) - viewportPadding, viewportPadding);
    const top = Math.floor(clamp(input.triggerRect.top, viewportPadding, maxTop));
    const maxHeight = Math.max(input.viewportHeight - top - viewportPadding, 0);
    return { left, top, maxHeight, side };
}
export class CxMenuComponent {
    static instanceCounter = 0;
    host = inject((ElementRef));
    hostVisibility = new CxHostVisibilityObserver(this.host.nativeElement, (visible) => this.onHostVisibilityChange(visible));
    instanceId = ++CxMenuComponent.instanceCounter;
    scopeId = `cx-menu-${this.instanceId}`;
    rootSurfaceId = `${this.scopeId}-surface`;
    itemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemsState" }] : /* istanbul ignore next */ []));
    groupsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "groupsState" }] : /* istanbul ignore next */ []));
    headingState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "headingState" }] : /* istanbul ignore next */ []));
    currentIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentIdState" }] : /* istanbul ignore next */ []));
    shortcutsEnabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "shortcutsEnabledState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    presentationState = signal({
        kind: 'inline',
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "presentationState" }] : /* istanbul ignore next */ []));
    submenuSurfacesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "submenuSurfacesState" }] : /* istanbul ignore next */ []));
    alignState = signal('end', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "alignState" }] : /* istanbul ignore next */ []));
    placementState = signal('auto', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "placementState" }] : /* istanbul ignore next */ []));
    layoutState = signal('inline', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "layoutState" }] : /* istanbul ignore next */ []));
    widthState = signal(240, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "widthState" }] : /* istanbul ignore next */ []));
    surfaceTopState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "surfaceTopState" }] : /* istanbul ignore next */ []));
    surfaceBottomState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "surfaceBottomState" }] : /* istanbul ignore next */ []));
    surfaceLeftState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "surfaceLeftState" }] : /* istanbul ignore next */ []));
    surfaceMaxHeightState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "surfaceMaxHeightState" }] : /* istanbul ignore next */ []));
    surfacePlacementState = signal('bottom', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "surfacePlacementState" }] : /* istanbul ignore next */ []));
    // Placement is decided once per open; re-syncs while open keep the side so
    // the surface never flips mid-interaction.
    surfaceLockedPlacement;
    triggerElement;
    triggerButton;
    get rootPopoverOwner() {
        const presentation = this.presentationState();
        if (presentation.kind === 'context') {
            return presentation.owner;
        }
        return this.triggerElement;
    }
    triggerOriginalState;
    resizeObserver;
    destroyed = false;
    triggerClickListener = (event) => this.onTriggerClick(event);
    triggerKeydownListener = (event) => this.onTriggerKeydown(event);
    triggerDirectives;
    triggerChangesSubscription;
    rootPopoverRef;
    triggerAnchorRef;
    disabledValue = false;
    set disabled(value) {
        this.disabledValue = Boolean(value);
        if (this.disabledValue && this.openState()) {
            this.setOpen(false, true);
        }
        this.syncTriggerState();
    }
    get disabled() {
        return this.disabledValue;
    }
    set presentation(value) {
        const nextPresentation = this.normalizePresentation(value);
        if (this.presentationsMatch(this.presentationState(), nextPresentation)) {
            return;
        }
        this.presentationState.set(nextPresentation);
        if (nextPresentation.kind === 'inline' && this.openState()) {
            this.setOpen(false, false);
        }
        queueMicrotask(() => this.connectTrigger());
        if (nextPresentation.kind === 'context' && this.openState()) {
            // A context menu re-anchored to a new pointer position is a new
            // session: re-pick the side for the new anchor.
            this.surfaceLockedPlacement = undefined;
            queueMicrotask(() => {
                this.syncSurfaceMetrics();
                this.focusFirstEnabledOption();
            });
        }
    }
    ariaLabel = 'Menu';
    set heading(value) {
        this.headingState.set(value?.trim() ?? '');
    }
    set items(value) {
        const items = value ?? [];
        validateMenuItems(items);
        this.itemsState.set([...items]);
    }
    set groups(value) {
        const groups = value ?? [];
        if (!Array.isArray(groups)) {
            throw new Error('[cx-menu] groups must be an array.');
        }
        const seenIds = new Set();
        for (const group of groups) {
            validateMenuItems(group.items, seenIds);
        }
        this.groupsState.set([...groups]);
    }
    set currentId(value) {
        this.currentIdState.set(value?.trim() || undefined);
    }
    set shortcutsEnabled(value) {
        this.shortcutsEnabledState.set(value);
    }
    set open(value) {
        const nextOpen = Boolean(value) && !this.disabled && this.presentationState().kind !== 'inline';
        this.openState.set(nextOpen);
        this.syncTriggerState();
        this.syncTriggerResizeObserver();
        if (nextOpen) {
            this.surfaceLockedPlacement = undefined;
            queueMicrotask(() => {
                this.syncSurfaceMetrics();
                if (this.presentationState().kind === 'context') {
                    this.focusFirstEnabledOption();
                }
            });
            return;
        }
        this.setSubmenuSurfaces([]);
    }
    set align(value) {
        this.alignState.set(value === 'start' ? 'start' : 'end');
    }
    set placement(value) {
        const placement = value === 'top' || value === 'right' || value === 'bottom' || value === 'left' ? value : 'auto';
        if (this.placementState() === placement) {
            return;
        }
        this.placementState.set(placement);
        if (this.openState()) {
            // A new placement is a new session for the open surface: re-pick the side.
            this.surfaceLockedPlacement = undefined;
            this.syncSurfaceMetrics();
        }
    }
    set layout(value) {
        this.layoutState.set(value === 'fill' ? 'fill' : 'inline');
    }
    set width(value) {
        this.widthState.set(Number.isFinite(value) ? Math.max(value, 160) : 240);
    }
    openChange = new EventEmitter();
    itemSelect = new EventEmitter();
    currentIdChange = new EventEmitter();
    isOpen$ = this.openState.asReadonly();
    presentation$ = this.presentationState.asReadonly();
    layout$ = this.layoutState.asReadonly();
    heading$ = this.headingState.asReadonly();
    currentId$ = this.currentIdState.asReadonly();
    surfaceTop$ = this.surfaceTopState.asReadonly();
    surfaceBottom$ = this.surfaceBottomState.asReadonly();
    surfaceLeft$ = this.surfaceLeftState.asReadonly();
    surfaceWidth$ = this.widthState.asReadonly();
    surfaceMaxHeight$ = this.surfaceMaxHeightState.asReadonly();
    surfacePlacement$ = this.surfacePlacementState.asReadonly();
    submenuSurfaces$ = this.submenuSurfacesState.asReadonly();
    normalizedItems$ = computed(() => resolveMenuItems(this.itemsState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "normalizedItems$" }] : /* istanbul ignore next */ []));
    normalizedGroups$ = computed(() => {
        const groups = this.groupsState();
        if (groups.length > 0) {
            return resolveMenuGroups(groups);
        }
        return [{ id: 'default', items: resolveMenuItems(this.itemsState()) }];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "normalizedGroups$" }] : /* istanbul ignore next */ []));
    visibleGroups$ = computed(() => this.normalizedGroups$().filter((group) => group.items.length > 0), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleGroups$" }] : /* istanbul ignore next */ []));
    visualGroups$ = computed(() => resolveMenuVisualGroups(this.visibleGroups$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visualGroups$" }] : /* istanbul ignore next */ []));
    get resolvedMenuAriaLabel() {
        return this.headingState() || this.ariaLabel;
    }
    ngAfterContentInit() {
        this.triggerChangesSubscription = this.triggerDirectives?.changes.subscribe(() => {
            queueMicrotask(() => this.connectTrigger());
        });
        queueMicrotask(() => this.connectTrigger());
    }
    ngOnDestroy() {
        this.destroyed = true;
        this.openState.set(false);
        this.submenuSurfacesState.set([]);
        this.triggerChangesSubscription?.unsubscribe();
        this.disconnectTrigger();
    }
    onTriggerClick(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.disabled) {
            return;
        }
        // A click synthesised from keyboard activation (Enter/Space on the trigger
        // button) reports detail === 0; only then do we pull focus into the menu so
        // pointer-driven opens leave focus on the trigger.
        this.toggleOpen(event.detail === 0);
    }
    onTriggerKeydown(event) {
        if (this.disabled) {
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!this.openState()) {
            this.surfaceLockedPlacement = undefined;
            this.syncSurfaceMetrics();
            this.setOpen(true);
        }
        const toLast = event.key === 'ArrowUp';
        this.focusWhenReady(() => {
            const options = this.optionButtonsInSurface(this.rootSurfaceElement());
            return (toLast ? options[options.length - 1] : options[0]) ?? null;
        });
    }
    onResolvedItemClick(item, level, parentPath, optionWrap, event) {
        if (item.disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (item.hasChildren) {
            event.preventDefault();
            event.stopPropagation();
            this.openSubmenu(item, level, buildItemPath(parentPath, item.id), optionWrap);
            return;
        }
        this.activateItem(item);
    }
    onResolvedItemPointerEnter(item, level, parentPath, optionWrap) {
        if (item.disabled) {
            this.trimSubmenus(level);
            return;
        }
        if (item.hasChildren) {
            this.openSubmenu(item, level, buildItemPath(parentPath, item.id), optionWrap);
            return;
        }
        this.trimSubmenus(level);
    }
    onResolvedItemKeydown(event, item, level, parentPath, optionWrap) {
        if (item.disabled) {
            return;
        }
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Home':
            case 'End': {
                event.preventDefault();
                const option = optionWrap.querySelector('.cx-option');
                if (option) {
                    this.moveMenuFocus(event.key, option);
                }
                return;
            }
            case 'ArrowRight': {
                if (!item.hasChildren) {
                    return;
                }
                event.preventDefault();
                const itemPath = buildItemPath(parentPath, item.id);
                this.openSubmenu(item, level, itemPath, optionWrap);
                const firstChildId = item.items?.find((child) => !child.disabled)?.id;
                if (firstChildId) {
                    const childPath = buildItemPath(itemPath, firstChildId);
                    this.focusWhenReady(() => this.optionButtonByPath(childPath));
                }
                return;
            }
            case 'ArrowLeft': {
                if (level <= 0) {
                    return;
                }
                event.preventDefault();
                this.trimSubmenus(level - 1);
                this.focusParentControl(parentPath);
                return;
            }
            default:
                return;
        }
    }
    itemPath(parentPath, itemId) {
        return buildItemPath(parentPath, itemId);
    }
    visualGroupsForItems(items, idPrefix) {
        return splitMenuItemsIntoVisualGroups(items, idPrefix || 'submenu');
    }
    itemSelectedState(item) {
        if (item.role === 'menuitemcheckbox') {
            // currentId is a single-choice tracker; toggles rely on the consumer's
            // per-item selected state only.
            return item.selected ?? false;
        }
        if (item.role === 'menuitemradio') {
            return item.selected ?? this.currentIdState() === item.id;
        }
        return false;
    }
    activateItem(item) {
        if (item.role === 'menuitemcheckbox') {
            // A toggle is not the menu's current choice, and closing after each
            // toggle would make multi-select menus unusable.
            this.itemSelect.emit(item.id);
            return;
        }
        if (item.role === 'menuitemradio') {
            this.updateCurrentId(item.id);
        }
        this.itemSelect.emit(item.id);
        this.closeSurface();
    }
    submenuSurfaceId(path) {
        return `${this.scopeId}-submenu-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    }
    itemSubmenuState(parentPath, item) {
        if (!item.hasChildren) {
            return 'none';
        }
        const path = buildItemPath(parentPath, item.id);
        return this.submenuSurfacesState().some((surface) => surface.path === path) ? 'open' : 'closed';
    }
    itemTrailingActionsState(parentPath, item) {
        if (!item.hasTrailingActions) {
            return false;
        }
        const path = buildTrailingActionsPath(buildItemPath(parentPath, item.id));
        return this.submenuSurfacesState().some((surface) => surface.path === path);
    }
    trailingActionsSurfaceId(parentPath, item) {
        return this.submenuSurfaceId(buildTrailingActionsPath(buildItemPath(parentPath, item.id)));
    }
    onTrailingActionsClick(item, level, parentPath, anchorElement, event) {
        event.preventDefault();
        event.stopPropagation();
        if (item.disabled || !item.trailingActions?.length) {
            return;
        }
        const itemPath = buildItemPath(parentPath, item.id);
        const surfacePath = buildTrailingActionsPath(itemPath);
        if (this.submenuSurfacesState().some((surface) => surface.path === surfacePath)) {
            this.trimSubmenus(level);
            return;
        }
        this.openTrailingActions(item, level, itemPath, anchorElement);
        if (event.detail === 0) {
            this.focusWhenReady(() => this.optionButtonsInSurface(document.getElementById(this.submenuSurfaceId(surfacePath)))[0] ?? null);
        }
    }
    onTrailingActionsKeydown(event, anchorElement) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
            return;
        }
        event.preventDefault();
        this.moveMenuFocus(event.key, anchorElement);
    }
    onDocumentPointerDown(event) {
        if (!this.isSurfaceActive()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        if (this.host.nativeElement.contains(target)) {
            return;
        }
        if (this.targetIsInsideMenuSurface(target)) {
            return;
        }
        this.closeSurface();
    }
    onEscapeKey() {
        if (!this.isSurfaceActive()) {
            return;
        }
        const active = typeof document !== 'undefined' ? document.activeElement : null;
        const focusWasInside = active instanceof Node && this.targetIsInsideMenuSurface(active);
        this.closeSurface(focusWasInside);
    }
    onDocumentKeydown(event) {
        if (!this.shortcutsEnabledState() || !this.isSurfaceActive() || isTypingTarget(event.target)) {
            return;
        }
        const item = this.findShortcutItem(this.normalizedGroups$().flatMap((group) => group.items), event);
        if (!item || item.disabled || item.hasChildren) {
            return;
        }
        event.preventDefault();
        this.activateItem(item);
    }
    onWindowResize() {
        if (!this.isSurfaceActive()) {
            return;
        }
        this.syncSurfaceMetrics();
    }
    toggleOpen(focusFirstOption = false) {
        const nextOpen = !this.openState();
        if (nextOpen) {
            this.surfaceLockedPlacement = undefined;
            this.syncSurfaceMetrics();
        }
        this.setOpen(nextOpen, !nextOpen);
        if (nextOpen && focusFirstOption) {
            this.focusWhenReady(() => this.optionButtonsInSurface(this.rootSurfaceElement())[0] ?? null);
        }
    }
    setOpen(nextOpen, restoreFocus = !nextOpen) {
        const resolvedOpen = nextOpen && !this.disabled && this.presentationState().kind !== 'inline';
        if (this.openState() === resolvedOpen) {
            return;
        }
        this.openState.set(resolvedOpen);
        if (!resolvedOpen) {
            this.setSubmenuSurfaces([]);
        }
        this.syncTriggerState();
        this.syncTriggerResizeObserver();
        this.openChange.emit(resolvedOpen);
        if (!resolvedOpen && restoreFocus && this.presentationState().kind === 'trigger') {
            queueMicrotask(() => this.focusTrigger());
        }
    }
    syncSurfaceMetrics() {
        if (typeof window === 'undefined') {
            return;
        }
        const presentation = this.presentationState();
        const requestedPlacement = this.placementState();
        const sideRequested = requestedPlacement === 'left' || requestedPlacement === 'right';
        const rect = presentation.kind === 'context'
            ? // A side placement hugs the owner element when one is named; the bare
                // context point stays the anchor for classic drop placement.
                sideRequested && presentation.owner
                    ? presentation.owner.getBoundingClientRect()
                    : {
                        left: presentation.left,
                        right: presentation.left,
                        top: presentation.top,
                        bottom: presentation.top,
                    }
            : // The wrapper keeps the menu anchored to layout while a button's
                // pressed transform settles; nested surfaces must not correct it later.
                (this.triggerAnchorRef?.nativeElement ?? this.triggerElement)?.getBoundingClientRect();
        if (!rect) {
            return;
        }
        if (sideRequested) {
            const lockedSide = this.surfaceLockedPlacement === 'left' || this.surfaceLockedPlacement === 'right' ? this.surfaceLockedPlacement : undefined;
            const surface = measureCxMenuSideSurface({
                triggerRect: rect,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                width: this.widthState(),
                estimatedHeight: estimateMenuSurfaceHeight(this.rootItems()),
                prefer: requestedPlacement,
                lockedSide,
            });
            this.surfaceLockedPlacement = surface.side;
            this.surfacePlacementState.set(surface.side);
            this.surfaceLeftState.set(surface.left);
            this.surfaceTopState.set(surface.top);
            this.surfaceBottomState.set(undefined);
            this.surfaceMaxHeightState.set(surface.maxHeight);
            this.syncSubmenuSurfaceMetrics();
            return;
        }
        const lockedDrop = this.surfaceLockedPlacement === 'top' || this.surfaceLockedPlacement === 'bottom' ? this.surfaceLockedPlacement : undefined;
        const surface = measureCxFloatingSurface({
            triggerRect: rect,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            width: this.widthState(),
            estimatedHeight: estimateMenuSurfaceHeight(this.rootItems()),
            align: presentation.kind === 'context' ? 'start' : this.alignState(),
            gap: presentation.kind === 'context' ? 0 : undefined,
            // An explicit top/bottom is honored outright — the surface scrolls
            // within that side's room rather than flipping away from the request.
            lockedPlacement: lockedDrop ?? (requestedPlacement === 'auto' ? undefined : requestedPlacement),
        });
        this.surfaceLockedPlacement = surface.placement;
        this.surfacePlacementState.set(surface.placement);
        this.surfaceLeftState.set(surface.left);
        this.surfaceTopState.set(surface.top);
        this.surfaceBottomState.set(surface.bottom);
        this.surfaceMaxHeightState.set(surface.maxHeight);
        this.syncSubmenuSurfaceMetrics();
    }
    openSubmenu(item, level, itemPath, anchorElement) {
        if (!item.items?.length || typeof window === 'undefined') {
            this.trimSubmenus(level);
            return;
        }
        const rect = anchorElement.getBoundingClientRect();
        const surface = measureCxMenuSideSurface({
            triggerRect: rect,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            width: this.widthState(),
            estimatedHeight: estimateMenuSurfaceHeight(item.items),
            prefer: 'right',
        });
        const nextSurface = {
            path: itemPath,
            anchorPath: itemPath,
            anchorKind: 'option',
            label: item.label,
            level: level + 1,
            items: item.items,
            left: surface.left,
            top: surface.top,
            maxHeight: surface.maxHeight,
        };
        this.setSubmenuSurfaces([
            ...this.submenuSurfacesState().filter((existingSurface) => existingSurface.level < nextSurface.level),
            nextSurface,
        ]);
    }
    openTrailingActions(item, level, itemPath, anchorElement) {
        if (!item.trailingActions?.length || typeof window === 'undefined') {
            this.trimSubmenus(level);
            return;
        }
        const rect = anchorElement.getBoundingClientRect();
        const surface = measureCxMenuSideSurface({
            triggerRect: rect,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            width: this.widthState(),
            estimatedHeight: estimateMenuSurfaceHeight(item.trailingActions),
            prefer: 'right',
        });
        const nextSurface = {
            path: buildTrailingActionsPath(itemPath),
            anchorPath: itemPath,
            anchorKind: 'trailing-actions',
            label: `${item.label} actions`,
            level: level + 1,
            items: item.trailingActions,
            left: surface.left,
            top: surface.top,
            maxHeight: surface.maxHeight,
        };
        this.setSubmenuSurfaces([
            ...this.submenuSurfacesState().filter((existingSurface) => existingSurface.level < nextSurface.level),
            nextSurface,
        ]);
    }
    trimSubmenus(level) {
        this.setSubmenuSurfaces(this.submenuSurfacesState().filter((existingSurface) => existingSurface.level <= level));
    }
    updateCurrentId(itemId) {
        if (this.currentIdState() === itemId) {
            return;
        }
        this.currentIdState.set(itemId);
        this.currentIdChange.emit(itemId);
    }
    closeSurface(restoreFocus = true) {
        if (this.presentationState().kind !== 'inline') {
            this.setOpen(false, restoreFocus);
            return;
        }
        this.setSubmenuSurfaces([]);
    }
    setSubmenuSurfaces(surfaces) {
        const trackingChanged = this.submenuSurfacesState().length > 0 !== surfaces.length > 0;
        this.submenuSurfacesState.set(surfaces);
        if (trackingChanged) {
            this.syncTriggerResizeObserver();
        }
    }
    onHostVisibilityChange(visible) {
        if (this.destroyed) {
            return;
        }
        if (visible) {
            this.syncSurfaceMetrics();
            return;
        }
        if (this.presentationState().kind === 'inline') {
            if (this.submenuSurfacesState().length > 0) {
                this.setSubmenuSurfaces([]);
            }
            return;
        }
        if (this.openState()) {
            this.setOpen(false, false);
        }
    }
    isSurfaceActive() {
        if (this.presentationState().kind === 'inline') {
            const visible = isHostVisible(this.host.nativeElement);
            if (!visible && this.submenuSurfacesState().length > 0) {
                this.setSubmenuSurfaces([]);
            }
            return visible;
        }
        if (!this.openState()) {
            return false;
        }
        if (!isHostVisible(this.host.nativeElement)) {
            this.setOpen(false, false);
            return false;
        }
        return true;
    }
    syncSubmenuSurfaceMetrics() {
        if (typeof window === 'undefined' || this.submenuSurfacesState().length === 0) {
            return;
        }
        const refreshedSurfaces = [];
        for (const surface of this.submenuSurfacesState()) {
            const anchorElement = surface.anchorKind === 'trailing-actions'
                ? this.trailingActionsButtonByPath(surface.anchorPath)
                : this.optionWrapByPath(surface.anchorPath);
            if (!anchorElement) {
                continue;
            }
            const rect = anchorElement.getBoundingClientRect();
            const nextMetrics = measureCxMenuSideSurface({
                triggerRect: rect,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                width: this.widthState(),
                estimatedHeight: estimateMenuSurfaceHeight(surface.items),
                prefer: 'right',
            });
            refreshedSurfaces.push({
                ...surface,
                left: nextMetrics.left,
                top: nextMetrics.top,
                maxHeight: nextMetrics.maxHeight,
            });
        }
        this.setSubmenuSurfaces(refreshedSurfaces);
    }
    moveMenuFocus(key, currentControl) {
        const surface = currentControl.closest('[data-cx-popover-surface]');
        const options = this.optionButtonsInSurface(surface);
        if (options.length === 0) {
            return;
        }
        const currentIndex = options.indexOf(currentControl);
        let nextIndex;
        if (key === 'Home') {
            nextIndex = 0;
        }
        else if (key === 'End') {
            nextIndex = options.length - 1;
        }
        else if (key === 'ArrowDown') {
            nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
        }
        else {
            nextIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
        }
        options[nextIndex]?.focus();
    }
    rootSurfaceElement() {
        if (typeof document === 'undefined') {
            return null;
        }
        if (this.presentationState().kind === 'inline') {
            return this.host.nativeElement.querySelector('[data-cx-popover-surface]');
        }
        return this.rootPopoverRef?.surfaceElement() ?? document.getElementById(this.rootSurfaceId);
    }
    menuSurfaceElements() {
        if (typeof document === 'undefined') {
            return [];
        }
        return [
            this.rootSurfaceElement(),
            ...this.submenuSurfacesState()
                .map((surface) => document.getElementById(this.submenuSurfaceId(surface.path)))
                .filter((surface) => surface !== null),
        ].filter((surface) => surface instanceof HTMLElement);
    }
    targetIsInsideMenuSurface(target) {
        return this.menuSurfaceElements().some((surface) => surface.contains(target));
    }
    optionButtonsInSurface(surface) {
        if (!surface) {
            return [];
        }
        return Array.from(surface.querySelectorAll('.cx-menu__option-wrap .cx-option, .cx-menu__trailing-actions button')).filter((button) => !button.hasAttribute('disabled'));
    }
    optionButtonByPath(path) {
        return this.optionWrapByPath(path)?.querySelector('.cx-option') ?? null;
    }
    optionWrapByPath(path) {
        for (const surface of this.menuSurfaceElements()) {
            const option = Array.from(surface.querySelectorAll('[data-menu-item-path]')).find((element) => element.getAttribute('data-cx-menu-scope') === this.scopeId && element.getAttribute('data-menu-item-path') === path);
            if (option) {
                return option;
            }
        }
        return null;
    }
    trailingActionsButtonByPath(path) {
        for (const surface of this.menuSurfaceElements()) {
            const button = Array.from(surface.querySelectorAll('[data-menu-trailing-actions-path]')).find((element) => element.getAttribute('data-cx-menu-scope') === this.scopeId && element.getAttribute('data-menu-trailing-actions-path') === path);
            if (button) {
                return button.querySelector('button') ?? button;
            }
        }
        return null;
    }
    focusParentControl(parentPath) {
        const parentSurface = this.submenuSurfacesState().find((surface) => surface.path === parentPath);
        if (parentSurface?.anchorKind === 'trailing-actions') {
            this.trailingActionsButtonByPath(parentSurface.anchorPath)?.focus();
            return;
        }
        this.optionButtonByPath(parentPath)?.focus();
    }
    focusWhenReady(resolve, attempt = 0) {
        if (this.destroyed) {
            return;
        }
        if (typeof requestAnimationFrame === 'undefined') {
            resolve()?.focus();
            return;
        }
        const target = resolve();
        if (target && this.focusTargetIsStable(target)) {
            target.focus();
            return;
        }
        if (attempt >= 12) {
            return;
        }
        requestAnimationFrame(() => this.focusWhenReady(resolve, attempt + 1));
    }
    focusTargetIsStable(target) {
        if (!target.isConnected) {
            return false;
        }
        const surface = target.closest('[data-cx-popover-surface]');
        return !surface || surface.classList.contains('cx-menu__inline-surface') || surface.parentElement === document.body;
    }
    focusTrigger() {
        if (this.triggerButton && !this.triggerButton.disabled && this.triggerButton.isConnected) {
            this.triggerButton.focus();
        }
    }
    focusFirstEnabledOption() {
        this.focusWhenReady(() => this.optionButtonsInSurface(this.rootSurfaceElement())[0] ?? null);
    }
    connectTrigger() {
        if (this.destroyed) {
            return;
        }
        this.disconnectTrigger();
        const presentation = this.presentationState();
        const triggerDirectives = this.triggerDirectives?.toArray() ?? [];
        if (presentation.kind !== 'trigger') {
            if (triggerDirectives.length > 0) {
                throw new Error(`[cx-menu] ${presentation.kind} presentation cannot contain cxMenuTrigger.`);
            }
            this.syncTriggerResizeObserver();
            return;
        }
        if (triggerDirectives.length !== 1) {
            throw new Error(`[cx-menu] Trigger presentation requires exactly one cxMenuTrigger; found ${triggerDirectives.length}.`);
        }
        const button = triggerDirectives[0].nativeButton();
        this.triggerButton = button;
        this.triggerElement = button;
        this.triggerOriginalState = {
            disabled: button.disabled,
            type: button.getAttribute('type'),
            ariaHaspopup: button.getAttribute('aria-haspopup'),
            ariaExpanded: button.getAttribute('aria-expanded'),
            ariaControls: button.getAttribute('aria-controls'),
            ariaDisabled: button.getAttribute('aria-disabled'),
            buttonDisabledClass: button.classList.contains('cx-button--disabled'),
            iconButtonDisabledClass: button.classList.contains('cx-icon-button--disabled'),
        };
        button.addEventListener('click', this.triggerClickListener, true);
        button.addEventListener('keydown', this.triggerKeydownListener, true);
        this.syncTriggerState();
        this.syncTriggerResizeObserver();
        if (this.openState()) {
            this.syncSurfaceMetrics();
        }
    }
    syncTriggerResizeObserver() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.hostVisibility.stop();
        if (!this.openState() && this.submenuSurfacesState().length === 0) {
            return;
        }
        this.hostVisibility.start();
        if (!this.openState() && this.submenuSurfacesState().length === 0) {
            this.hostVisibility.stop();
            return;
        }
        if (this.triggerButton && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                if (this.hostVisibility.check()) {
                    this.syncSurfaceMetrics();
                }
            });
            this.resizeObserver.observe(this.triggerButton);
        }
    }
    disconnectTrigger() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.hostVisibility.stop();
        const button = this.triggerButton;
        const original = this.triggerOriginalState;
        if (button && original) {
            button.removeEventListener('click', this.triggerClickListener, true);
            button.removeEventListener('keydown', this.triggerKeydownListener, true);
            button.disabled = original.disabled;
            this.restoreAttribute(button, 'type', original.type);
            this.restoreAttribute(button, 'aria-haspopup', original.ariaHaspopup);
            this.restoreAttribute(button, 'aria-expanded', original.ariaExpanded);
            this.restoreAttribute(button, 'aria-controls', original.ariaControls);
            this.restoreAttribute(button, 'aria-disabled', original.ariaDisabled);
            button.classList.toggle('cx-button--disabled', original.buttonDisabledClass);
            button.classList.toggle('cx-icon-button--disabled', original.iconButtonDisabledClass);
        }
        this.triggerButton = undefined;
        this.triggerElement = undefined;
        this.triggerOriginalState = undefined;
    }
    syncTriggerState() {
        const button = this.triggerButton;
        const original = this.triggerOriginalState;
        if (!button || !original) {
            return;
        }
        const disabled = original.disabled || this.disabled;
        button.type = 'button';
        button.disabled = disabled;
        button.setAttribute('aria-haspopup', 'menu');
        button.setAttribute('aria-expanded', String(this.openState()));
        button.setAttribute('aria-controls', this.rootSurfaceId);
        this.restoreAttribute(button, 'aria-disabled', disabled ? 'true' : original.ariaDisabled);
        if (button.classList.contains('cx-button')) {
            button.classList.toggle('cx-button--disabled', disabled);
        }
        if (button.classList.contains('cx-icon-button')) {
            button.classList.toggle('cx-icon-button--disabled', disabled);
        }
    }
    restoreAttribute(element, name, value) {
        if (value === null) {
            element.removeAttribute(name);
            return;
        }
        element.setAttribute(name, value);
    }
    normalizePresentation(value) {
        if (value?.kind === 'trigger' || value?.kind === 'inline') {
            return value;
        }
        if (value?.kind === 'context' && Number.isFinite(value.left) && Number.isFinite(value.top)) {
            return value.owner instanceof HTMLElement
                ? {
                    kind: 'context',
                    left: value.left,
                    top: value.top,
                    owner: value.owner,
                }
                : { kind: 'context', left: value.left, top: value.top };
        }
        throw new Error('[cx-menu] presentation must be trigger, inline, or a finite context point.');
    }
    presentationsMatch(current, next) {
        if (current.kind !== next.kind) {
            return false;
        }
        if (current.kind !== 'context' || next.kind !== 'context') {
            return true;
        }
        return current.left === next.left && current.top === next.top && current.owner === next.owner;
    }
    rootItems() {
        const groups = this.groupsState();
        if (groups.length === 0) {
            return this.itemsState();
        }
        return groups.flatMap((group) => group.items);
    }
    findShortcutItem(items, event) {
        for (const item of items) {
            if (item.shortcutParts && eventMatchesShortcut(item.shortcutParts, event)) {
                return item;
            }
            const childMatch = item.items ? this.findShortcutItem(item.items, event) : undefined;
            if (childMatch) {
                return childMatch;
            }
            const trailingActionMatch = item.trailingActions ? this.findShortcutItem(item.trailingActions, event) : undefined;
            if (trailingActionMatch) {
                return trailingActionMatch;
            }
        }
        return undefined;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMenuComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxMenuComponent, isStandalone: true, selector: "cx-menu", inputs: { disabled: "disabled", presentation: "presentation", ariaLabel: "ariaLabel", heading: "heading", items: "items", groups: "groups", currentId: "currentId", shortcutsEnabled: "shortcutsEnabled", open: "open", align: "align", placement: "placement", layout: "layout", width: "width" }, outputs: { openChange: "openChange", itemSelect: "itemSelect", currentIdChange: "currentIdChange" }, host: { listeners: { "document:pointerdown": "onDocumentPointerDown($event)", "document:keydown.escape": "onEscapeKey()", "document:keydown": "onDocumentKeydown($event)", "window:resize": "onWindowResize()" }, properties: { "class.cx-menu-host--fill": "layout$() === \"fill\"" } }, queries: [{ propertyName: "triggerDirectives", predicate: CxMenuTriggerDirective, descendants: true }], viewQueries: [{ propertyName: "rootPopoverRef", first: true, predicate: ["rootPopover"], descendants: true }, { propertyName: "triggerAnchorRef", first: true, predicate: ["triggerAnchor"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div class=\"cx-menu\" [class.cx-menu--fill]=\"layout$() === 'fill'\">\n  @if (presentation$().kind === 'trigger') {\n    <span #triggerAnchor class=\"cx-menu__trigger\">\n      <ng-content select=\"[cxMenuTrigger]\" />\n    </span>\n  }\n\n  @if (presentation$().kind !== 'inline') {\n    <cx-popover\n      #rootPopover\n      [open]=\"isOpen$()\"\n      [owner]=\"rootPopoverOwner\"\n      [showBackdrop]=\"true\"\n      [heading]=\"heading$()\"\n      [surfaceId]=\"rootSurfaceId\"\n      [role]=\"'menu'\"\n      [ariaLabel]=\"resolvedMenuAriaLabel\"\n      [width]=\"surfaceWidth$()\"\n      [maxHeight]=\"surfaceMaxHeight$()\"\n      [left]=\"surfaceLeft$()\"\n      [top]=\"surfaceTop$()\"\n      [bottom]=\"surfaceBottom$()\"\n      [placement]=\"surfacePlacement$()\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"setOpen(false, true)\"\n    >\n      <div class=\"cx-menu__groups\">\n        @for (group of visualGroups$(); track group.id) {\n          <div class=\"cx-menu__group\">\n            @if (group.label || group.description) {\n              <cx-option-group [label]=\"group.label || 'Menu'\" [description]=\"group.description\" />\n            }\n            @for (item of group.items; track item.id) {\n              <div\n                class=\"cx-menu__option-wrap\"\n                [attr.data-cx-menu-scope]=\"scopeId\"\n                [attr.data-menu-item-path]=\"itemPath('', item.id)\"\n                (pointerenter)=\"onResolvedItemPointerEnter(item, 0, '', $any($event.currentTarget))\"\n                (click)=\"onResolvedItemClick(item, 0, '', $any($event.currentTarget), $event)\"\n                (keydown)=\"onResolvedItemKeydown($event, item, 0, '', $any($event.currentTarget))\"\n              >\n                <cx-option\n                  [role]=\"item.role\"\n                  [label]=\"item.label\"\n                  [prependIcon]=\"item.prependIcon\"\n                  [appendIcon]=\"item.appendIcon\"\n                  [description]=\"item.description\"\n                  [mood]=\"item.danger ? 'danger' : 'default'\"\n                  [disabled]=\"item.disabled ?? false\"\n                  [selected]=\"itemSelectedState(item)\"\n                  [shortcutParts]=\"item.shortcutParts\"\n                  [submenu]=\"itemSubmenuState('', item)\"\n                >\n                  @if (item.hasTrailingActions) {\n                    <cx-icon-button\n                      control\n                      class=\"cx-menu__trailing-actions\"\n                      icon=\"menu-vertical\"\n                      variant=\"transparent\"\n                      size=\"small\"\n                      [ariaLabel]=\"'Actions for ' + item.label\"\n                      [role]=\"'menuitem'\"\n                      [ariaHasPopup]=\"'menu'\"\n                      [ariaExpanded]=\"itemTrailingActionsState('', item)\"\n                      [ariaControls]=\"trailingActionsSurfaceId('', item)\"\n                      [attr.data-cx-menu-scope]=\"scopeId\"\n                      [attr.data-menu-trailing-actions-path]=\"itemPath('', item.id)\"\n                      [disabled]=\"item.disabled ?? false\"\n                      (click)=\"onTrailingActionsClick(item, 0, '', $any($event.currentTarget), $event)\"\n                      (keydown)=\"onTrailingActionsKeydown($event, $any($event.target))\"\n                    />\n                  }\n                </cx-option>\n              </div>\n            }\n          </div>\n        }\n        @if (visibleGroups$().length === 0) {\n          <div class=\"cx-menu__group\">\n            <div class=\"cx-menu__empty\">No actions available</div>\n          </div>\n        }\n      </div>\n    </cx-popover>\n  } @else {\n    <div\n      class=\"cx-menu__inline-surface cx-menu__surface\"\n      [attr.data-cx-menu-scope]=\"scopeId\"\n      role=\"menu\"\n      [attr.aria-label]=\"resolvedMenuAriaLabel\"\n      data-cx-popover-surface\n    >\n      <div class=\"cx-menu__groups\">\n        @if (heading$()) {\n          <div class=\"cx-menu__group cx-menu__group--heading\">\n            <cx-option-group [label]=\"heading$()\" variant=\"heading\">\n              <!-- ngProjectAs: a forwarded ng-content carries no attributes, so\n                   without it this content matches no slot and is dropped. -->\n              <ng-content select=\"[actions]\" ngProjectAs=\"[actions]\" />\n            </cx-option-group>\n          </div>\n        }\n        @for (group of visualGroups$(); track group.id) {\n          <div class=\"cx-menu__group\">\n            @if (group.label || group.description) {\n              <cx-option-group [label]=\"group.label || 'Menu'\" [description]=\"group.description\" />\n            }\n            @for (item of group.items; track item.id) {\n              <div\n                class=\"cx-menu__option-wrap\"\n                [attr.data-cx-menu-scope]=\"scopeId\"\n                [attr.data-menu-item-path]=\"itemPath('', item.id)\"\n                (pointerenter)=\"onResolvedItemPointerEnter(item, 0, '', $any($event.currentTarget))\"\n                (click)=\"onResolvedItemClick(item, 0, '', $any($event.currentTarget), $event)\"\n                (keydown)=\"onResolvedItemKeydown($event, item, 0, '', $any($event.currentTarget))\"\n              >\n                <cx-option\n                  [role]=\"item.role\"\n                  [label]=\"item.label\"\n                  [prependIcon]=\"item.prependIcon\"\n                  [appendIcon]=\"item.appendIcon\"\n                  [description]=\"item.description\"\n                  [mood]=\"item.danger ? 'danger' : 'default'\"\n                  [disabled]=\"item.disabled ?? false\"\n                  [selected]=\"itemSelectedState(item)\"\n                  [shortcutParts]=\"item.shortcutParts\"\n                  [submenu]=\"itemSubmenuState('', item)\"\n                >\n                  @if (item.hasTrailingActions) {\n                    <cx-icon-button\n                      control\n                      class=\"cx-menu__trailing-actions\"\n                      icon=\"menu-vertical\"\n                      variant=\"transparent\"\n                      size=\"small\"\n                      [ariaLabel]=\"'Actions for ' + item.label\"\n                      [role]=\"'menuitem'\"\n                      [ariaHasPopup]=\"'menu'\"\n                      [ariaExpanded]=\"itemTrailingActionsState('', item)\"\n                      [ariaControls]=\"trailingActionsSurfaceId('', item)\"\n                      [attr.data-cx-menu-scope]=\"scopeId\"\n                      [attr.data-menu-trailing-actions-path]=\"itemPath('', item.id)\"\n                      [disabled]=\"item.disabled ?? false\"\n                      (click)=\"onTrailingActionsClick(item, 0, '', $any($event.currentTarget), $event)\"\n                      (keydown)=\"onTrailingActionsKeydown($event, $any($event.target))\"\n                    />\n                  }\n                </cx-option>\n              </div>\n            }\n          </div>\n        }\n        @if (visibleGroups$().length === 0) {\n          <div class=\"cx-menu__group\">\n            <div class=\"cx-menu__empty\">No actions available</div>\n          </div>\n        }\n      </div>\n    </div>\n  }\n\n  @for (surface of submenuSurfaces$(); track surface.path) {\n    <cx-popover\n      [open]=\"true\"\n      [showBackdrop]=\"false\"\n      [role]=\"'menu'\"\n      [ariaLabel]=\"surface.label\"\n      [width]=\"surfaceWidth$()\"\n      [maxHeight]=\"surface.maxHeight\"\n      [left]=\"surface.left\"\n      [top]=\"surface.top\"\n      [surfaceId]=\"submenuSurfaceId(surface.path)\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"onEscapeKey()\"\n    >\n      <div class=\"cx-menu__groups\">\n        @for (group of visualGroupsForItems(surface.items, surface.path); track group.id) {\n          <div class=\"cx-menu__group\">\n            @for (item of group.items; track item.id) {\n              <div\n                class=\"cx-menu__option-wrap\"\n                [attr.data-cx-menu-scope]=\"scopeId\"\n                [attr.data-menu-item-path]=\"itemPath(surface.path, item.id)\"\n                (pointerenter)=\"onResolvedItemPointerEnter(item, surface.level, surface.path, $any($event.currentTarget))\"\n                (click)=\"onResolvedItemClick(item, surface.level, surface.path, $any($event.currentTarget), $event)\"\n                (keydown)=\"onResolvedItemKeydown($event, item, surface.level, surface.path, $any($event.currentTarget))\"\n              >\n                <cx-option\n                  [role]=\"item.role\"\n                  [label]=\"item.label\"\n                  [prependIcon]=\"item.prependIcon\"\n                  [appendIcon]=\"item.appendIcon\"\n                  [description]=\"item.description\"\n                  [mood]=\"item.danger ? 'danger' : 'default'\"\n                  [disabled]=\"item.disabled ?? false\"\n                  [selected]=\"itemSelectedState(item)\"\n                  [shortcutParts]=\"item.shortcutParts\"\n                  [submenu]=\"itemSubmenuState(surface.path, item)\"\n                >\n                  @if (item.hasTrailingActions) {\n                    <cx-icon-button\n                      control\n                      class=\"cx-menu__trailing-actions\"\n                      icon=\"menu-vertical\"\n                      variant=\"transparent\"\n                      size=\"small\"\n                      [ariaLabel]=\"'Actions for ' + item.label\"\n                      [role]=\"'menuitem'\"\n                      [ariaHasPopup]=\"'menu'\"\n                      [ariaExpanded]=\"itemTrailingActionsState(surface.path, item)\"\n                      [ariaControls]=\"trailingActionsSurfaceId(surface.path, item)\"\n                      [attr.data-cx-menu-scope]=\"scopeId\"\n                      [attr.data-menu-trailing-actions-path]=\"itemPath(surface.path, item.id)\"\n                      [disabled]=\"item.disabled ?? false\"\n                      (click)=\"onTrailingActionsClick(item, surface.level, surface.path, $any($event.currentTarget), $event)\"\n                      (keydown)=\"onTrailingActionsKeydown($event, $any($event.target))\"\n                    />\n                  }\n                </cx-option>\n              </div>\n            }\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}:host(.cx-menu-host--fill){display:flex;width:100%}.cx-menu{display:inline-flex;width:auto}.cx-menu--fill{display:flex;width:100%}.cx-menu__trigger{display:inline-flex;width:auto}.cx-menu--fill .cx-menu__trigger{display:flex;width:100%}.cx-menu__inline-surface{display:flex;min-width:max-content;max-width:calc(var(--controller-size)*8);flex-direction:column;overflow:hidden;border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-mid);padding:var(--surface-separation)}.cx-menu__option-wrap,.cx-menu__inline-surface cx-option{width:100%}.cx-menu__option-wrap{min-width:0}.cx-menu__trailing-actions{display:inline-flex;flex:0 0 auto;margin-right:var(--space-xs);opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease}.cx-menu__option-wrap:hover .cx-menu__trailing-actions,.cx-menu__option-wrap:focus-within .cx-menu__trailing-actions,.cx-menu__trailing-actions:has(button[aria-expanded=true]){opacity:1;pointer-events:auto}.cx-menu__groups{display:flex;width:100%;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--surface-separation)}.cx-menu__group{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-md);background:var(--surface)}.cx-menu__group:first-child{border-top-left-radius:var(--cx-popover-inner-radius, var(--radius-md));border-top-right-radius:var(--cx-popover-inner-radius, var(--radius-md))}.cx-menu__group:last-child{border-bottom-right-radius:var(--cx-popover-inner-radius, var(--radius-md));border-bottom-left-radius:var(--cx-popover-inner-radius, var(--radius-md))}.cx-menu__group--heading{background:rgba(0,0,0,0)}.cx-menu__empty{display:flex;min-height:var(--controller-size);align-items:center;padding:0 var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body);line-height:var(--line-height-body)}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "descriptionAlign", "size", "tooltip", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "controlId", "tabIndex", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxOptionGroupComponent, selector: "cx-option-group", inputs: ["label", "description", "variant"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMenuComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-menu', imports: [CxIconButtonComponent, CxOptionComponent, CxOptionGroupComponent, CxPopoverComponent], host: {
                        '[class.cx-menu-host--fill]': 'layout$() === "fill"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-menu\" [class.cx-menu--fill]=\"layout$() === 'fill'\">\n  @if (presentation$().kind === 'trigger') {\n    <span #triggerAnchor class=\"cx-menu__trigger\">\n      <ng-content select=\"[cxMenuTrigger]\" />\n    </span>\n  }\n\n  @if (presentation$().kind !== 'inline') {\n    <cx-popover\n      #rootPopover\n      [open]=\"isOpen$()\"\n      [owner]=\"rootPopoverOwner\"\n      [showBackdrop]=\"true\"\n      [heading]=\"heading$()\"\n      [surfaceId]=\"rootSurfaceId\"\n      [role]=\"'menu'\"\n      [ariaLabel]=\"resolvedMenuAriaLabel\"\n      [width]=\"surfaceWidth$()\"\n      [maxHeight]=\"surfaceMaxHeight$()\"\n      [left]=\"surfaceLeft$()\"\n      [top]=\"surfaceTop$()\"\n      [bottom]=\"surfaceBottom$()\"\n      [placement]=\"surfacePlacement$()\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"setOpen(false, true)\"\n    >\n      <div class=\"cx-menu__groups\">\n        @for (group of visualGroups$(); track group.id) {\n          <div class=\"cx-menu__group\">\n            @if (group.label || group.description) {\n              <cx-option-group [label]=\"group.label || 'Menu'\" [description]=\"group.description\" />\n            }\n            @for (item of group.items; track item.id) {\n              <div\n                class=\"cx-menu__option-wrap\"\n                [attr.data-cx-menu-scope]=\"scopeId\"\n                [attr.data-menu-item-path]=\"itemPath('', item.id)\"\n                (pointerenter)=\"onResolvedItemPointerEnter(item, 0, '', $any($event.currentTarget))\"\n                (click)=\"onResolvedItemClick(item, 0, '', $any($event.currentTarget), $event)\"\n                (keydown)=\"onResolvedItemKeydown($event, item, 0, '', $any($event.currentTarget))\"\n              >\n                <cx-option\n                  [role]=\"item.role\"\n                  [label]=\"item.label\"\n                  [prependIcon]=\"item.prependIcon\"\n                  [appendIcon]=\"item.appendIcon\"\n                  [description]=\"item.description\"\n                  [mood]=\"item.danger ? 'danger' : 'default'\"\n                  [disabled]=\"item.disabled ?? false\"\n                  [selected]=\"itemSelectedState(item)\"\n                  [shortcutParts]=\"item.shortcutParts\"\n                  [submenu]=\"itemSubmenuState('', item)\"\n                >\n                  @if (item.hasTrailingActions) {\n                    <cx-icon-button\n                      control\n                      class=\"cx-menu__trailing-actions\"\n                      icon=\"menu-vertical\"\n                      variant=\"transparent\"\n                      size=\"small\"\n                      [ariaLabel]=\"'Actions for ' + item.label\"\n                      [role]=\"'menuitem'\"\n                      [ariaHasPopup]=\"'menu'\"\n                      [ariaExpanded]=\"itemTrailingActionsState('', item)\"\n                      [ariaControls]=\"trailingActionsSurfaceId('', item)\"\n                      [attr.data-cx-menu-scope]=\"scopeId\"\n                      [attr.data-menu-trailing-actions-path]=\"itemPath('', item.id)\"\n                      [disabled]=\"item.disabled ?? false\"\n                      (click)=\"onTrailingActionsClick(item, 0, '', $any($event.currentTarget), $event)\"\n                      (keydown)=\"onTrailingActionsKeydown($event, $any($event.target))\"\n                    />\n                  }\n                </cx-option>\n              </div>\n            }\n          </div>\n        }\n        @if (visibleGroups$().length === 0) {\n          <div class=\"cx-menu__group\">\n            <div class=\"cx-menu__empty\">No actions available</div>\n          </div>\n        }\n      </div>\n    </cx-popover>\n  } @else {\n    <div\n      class=\"cx-menu__inline-surface cx-menu__surface\"\n      [attr.data-cx-menu-scope]=\"scopeId\"\n      role=\"menu\"\n      [attr.aria-label]=\"resolvedMenuAriaLabel\"\n      data-cx-popover-surface\n    >\n      <div class=\"cx-menu__groups\">\n        @if (heading$()) {\n          <div class=\"cx-menu__group cx-menu__group--heading\">\n            <cx-option-group [label]=\"heading$()\" variant=\"heading\">\n              <!-- ngProjectAs: a forwarded ng-content carries no attributes, so\n                   without it this content matches no slot and is dropped. -->\n              <ng-content select=\"[actions]\" ngProjectAs=\"[actions]\" />\n            </cx-option-group>\n          </div>\n        }\n        @for (group of visualGroups$(); track group.id) {\n          <div class=\"cx-menu__group\">\n            @if (group.label || group.description) {\n              <cx-option-group [label]=\"group.label || 'Menu'\" [description]=\"group.description\" />\n            }\n            @for (item of group.items; track item.id) {\n              <div\n                class=\"cx-menu__option-wrap\"\n                [attr.data-cx-menu-scope]=\"scopeId\"\n                [attr.data-menu-item-path]=\"itemPath('', item.id)\"\n                (pointerenter)=\"onResolvedItemPointerEnter(item, 0, '', $any($event.currentTarget))\"\n                (click)=\"onResolvedItemClick(item, 0, '', $any($event.currentTarget), $event)\"\n                (keydown)=\"onResolvedItemKeydown($event, item, 0, '', $any($event.currentTarget))\"\n              >\n                <cx-option\n                  [role]=\"item.role\"\n                  [label]=\"item.label\"\n                  [prependIcon]=\"item.prependIcon\"\n                  [appendIcon]=\"item.appendIcon\"\n                  [description]=\"item.description\"\n                  [mood]=\"item.danger ? 'danger' : 'default'\"\n                  [disabled]=\"item.disabled ?? false\"\n                  [selected]=\"itemSelectedState(item)\"\n                  [shortcutParts]=\"item.shortcutParts\"\n                  [submenu]=\"itemSubmenuState('', item)\"\n                >\n                  @if (item.hasTrailingActions) {\n                    <cx-icon-button\n                      control\n                      class=\"cx-menu__trailing-actions\"\n                      icon=\"menu-vertical\"\n                      variant=\"transparent\"\n                      size=\"small\"\n                      [ariaLabel]=\"'Actions for ' + item.label\"\n                      [role]=\"'menuitem'\"\n                      [ariaHasPopup]=\"'menu'\"\n                      [ariaExpanded]=\"itemTrailingActionsState('', item)\"\n                      [ariaControls]=\"trailingActionsSurfaceId('', item)\"\n                      [attr.data-cx-menu-scope]=\"scopeId\"\n                      [attr.data-menu-trailing-actions-path]=\"itemPath('', item.id)\"\n                      [disabled]=\"item.disabled ?? false\"\n                      (click)=\"onTrailingActionsClick(item, 0, '', $any($event.currentTarget), $event)\"\n                      (keydown)=\"onTrailingActionsKeydown($event, $any($event.target))\"\n                    />\n                  }\n                </cx-option>\n              </div>\n            }\n          </div>\n        }\n        @if (visibleGroups$().length === 0) {\n          <div class=\"cx-menu__group\">\n            <div class=\"cx-menu__empty\">No actions available</div>\n          </div>\n        }\n      </div>\n    </div>\n  }\n\n  @for (surface of submenuSurfaces$(); track surface.path) {\n    <cx-popover\n      [open]=\"true\"\n      [showBackdrop]=\"false\"\n      [role]=\"'menu'\"\n      [ariaLabel]=\"surface.label\"\n      [width]=\"surfaceWidth$()\"\n      [maxHeight]=\"surface.maxHeight\"\n      [left]=\"surface.left\"\n      [top]=\"surface.top\"\n      [surfaceId]=\"submenuSurfaceId(surface.path)\"\n      surfaceVariant=\"grouped\"\n      (backdropPressed)=\"onEscapeKey()\"\n    >\n      <div class=\"cx-menu__groups\">\n        @for (group of visualGroupsForItems(surface.items, surface.path); track group.id) {\n          <div class=\"cx-menu__group\">\n            @for (item of group.items; track item.id) {\n              <div\n                class=\"cx-menu__option-wrap\"\n                [attr.data-cx-menu-scope]=\"scopeId\"\n                [attr.data-menu-item-path]=\"itemPath(surface.path, item.id)\"\n                (pointerenter)=\"onResolvedItemPointerEnter(item, surface.level, surface.path, $any($event.currentTarget))\"\n                (click)=\"onResolvedItemClick(item, surface.level, surface.path, $any($event.currentTarget), $event)\"\n                (keydown)=\"onResolvedItemKeydown($event, item, surface.level, surface.path, $any($event.currentTarget))\"\n              >\n                <cx-option\n                  [role]=\"item.role\"\n                  [label]=\"item.label\"\n                  [prependIcon]=\"item.prependIcon\"\n                  [appendIcon]=\"item.appendIcon\"\n                  [description]=\"item.description\"\n                  [mood]=\"item.danger ? 'danger' : 'default'\"\n                  [disabled]=\"item.disabled ?? false\"\n                  [selected]=\"itemSelectedState(item)\"\n                  [shortcutParts]=\"item.shortcutParts\"\n                  [submenu]=\"itemSubmenuState(surface.path, item)\"\n                >\n                  @if (item.hasTrailingActions) {\n                    <cx-icon-button\n                      control\n                      class=\"cx-menu__trailing-actions\"\n                      icon=\"menu-vertical\"\n                      variant=\"transparent\"\n                      size=\"small\"\n                      [ariaLabel]=\"'Actions for ' + item.label\"\n                      [role]=\"'menuitem'\"\n                      [ariaHasPopup]=\"'menu'\"\n                      [ariaExpanded]=\"itemTrailingActionsState(surface.path, item)\"\n                      [ariaControls]=\"trailingActionsSurfaceId(surface.path, item)\"\n                      [attr.data-cx-menu-scope]=\"scopeId\"\n                      [attr.data-menu-trailing-actions-path]=\"itemPath(surface.path, item.id)\"\n                      [disabled]=\"item.disabled ?? false\"\n                      (click)=\"onTrailingActionsClick(item, surface.level, surface.path, $any($event.currentTarget), $event)\"\n                      (keydown)=\"onTrailingActionsKeydown($event, $any($event.target))\"\n                    />\n                  }\n                </cx-option>\n              </div>\n            }\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}:host(.cx-menu-host--fill){display:flex;width:100%}.cx-menu{display:inline-flex;width:auto}.cx-menu--fill{display:flex;width:100%}.cx-menu__trigger{display:inline-flex;width:auto}.cx-menu--fill .cx-menu__trigger{display:flex;width:100%}.cx-menu__inline-surface{display:flex;min-width:max-content;max-width:calc(var(--controller-size)*8);flex-direction:column;overflow:hidden;border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface-alt);box-shadow:var(--shadow-mid);padding:var(--surface-separation)}.cx-menu__option-wrap,.cx-menu__inline-surface cx-option{width:100%}.cx-menu__option-wrap{min-width:0}.cx-menu__trailing-actions{display:inline-flex;flex:0 0 auto;margin-right:var(--space-xs);opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease}.cx-menu__option-wrap:hover .cx-menu__trailing-actions,.cx-menu__option-wrap:focus-within .cx-menu__trailing-actions,.cx-menu__trailing-actions:has(button[aria-expanded=true]){opacity:1;pointer-events:auto}.cx-menu__groups{display:flex;width:100%;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--surface-separation)}.cx-menu__group{display:flex;min-width:0;flex:0 0 auto;flex-direction:column;overflow:hidden;border-radius:var(--radius-md);background:var(--surface)}.cx-menu__group:first-child{border-top-left-radius:var(--cx-popover-inner-radius, var(--radius-md));border-top-right-radius:var(--cx-popover-inner-radius, var(--radius-md))}.cx-menu__group:last-child{border-bottom-right-radius:var(--cx-popover-inner-radius, var(--radius-md));border-bottom-left-radius:var(--cx-popover-inner-radius, var(--radius-md))}.cx-menu__group--heading{background:rgba(0,0,0,0)}.cx-menu__empty{display:flex;min-height:var(--controller-size);align-items:center;padding:0 var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body);line-height:var(--line-height-body)}"] }]
        }], propDecorators: { triggerDirectives: [{
                type: ContentChildren,
                args: [CxMenuTriggerDirective, { descendants: true }]
            }], rootPopoverRef: [{
                type: ViewChild,
                args: ['rootPopover']
            }], triggerAnchorRef: [{
                type: ViewChild,
                args: ['triggerAnchor', { read: ElementRef }]
            }], disabled: [{
                type: Input
            }], presentation: [{
                type: Input,
                args: [{ required: true }]
            }], ariaLabel: [{
                type: Input
            }], heading: [{
                type: Input
            }], items: [{
                type: Input
            }], groups: [{
                type: Input
            }], currentId: [{
                type: Input
            }], shortcutsEnabled: [{
                type: Input
            }], open: [{
                type: Input
            }], align: [{
                type: Input
            }], placement: [{
                type: Input
            }], layout: [{
                type: Input
            }], width: [{
                type: Input
            }], openChange: [{
                type: Output
            }], itemSelect: [{
                type: Output
            }], currentIdChange: [{
                type: Output
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onEscapeKey: [{
                type: HostListener,
                args: ['document:keydown.escape']
            }], onDocumentKeydown: [{
                type: HostListener,
                args: ['document:keydown', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
