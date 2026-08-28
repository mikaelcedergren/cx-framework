import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewChildren, computed, inject, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxMenuComponent, CxMenuTriggerDirective } from '../../overlay/cx-menu/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
function coerceBoolean(value) {
    return value === '' || value === true || value === 'true';
}
export class CxTabsComponent {
    changeDetector = inject(ChangeDetectorRef);
    rootRef;
    trackRef;
    tabButtons;
    itemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemsState" }] : /* istanbul ignore next */ []));
    selectedIdState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdState" }] : /* istanbul ignore next */ []));
    hasOverflowState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasOverflowState" }] : /* istanbul ignore next */ []));
    overflowIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overflowIdsState" }] : /* istanbul ignore next */ []));
    transparentState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "transparentState" }] : /* istanbul ignore next */ []));
    dividedState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dividedState" }] : /* istanbul ignore next */ []));
    equalWidthState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "equalWidthState" }] : /* istanbul ignore next */ []));
    overflowOpen$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overflowOpen$" }] : /* istanbul ignore next */ []));
    indicatorVisible$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorVisible$" }] : /* istanbul ignore next */ []));
    indicatorXState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorXState" }] : /* istanbul ignore next */ []));
    indicatorWidthState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorWidthState" }] : /* istanbul ignore next */ []));
    tabsChangesSubscription;
    resizeObserver;
    layoutFrameId;
    indicatorFrameId;
    scrollFrameId;
    pointerScrollLeft;
    ariaLabel = 'Tabs';
    /** DOM id of the tab panel controlled by this tablist. */
    controlsId;
    set items(value) {
        const nextItems = this.normalizeItems(value);
        this.itemsState.set(nextItems);
        this.ensureSelectedId();
        this.scheduleLayoutRefresh();
    }
    set selectedId(value) {
        const nextSelectedId = this.resolveSelectedId(value);
        const previousSelectedId = this.selectedIdState();
        this.selectedIdState.set(nextSelectedId);
        if (nextSelectedId !== previousSelectedId) {
            this.scheduleSelectedTabScroll();
        }
        this.scheduleLayoutRefresh();
    }
    set transparent(value) {
        this.transparentState.set(coerceBoolean(value));
    }
    set divided(value) {
        this.dividedState.set(value === undefined ? true : coerceBoolean(value));
    }
    set equalWidth(value) {
        this.equalWidthState.set(coerceBoolean(value));
        this.scheduleLayoutRefresh();
    }
    selectedIdChange = new EventEmitter();
    selectedId$ = this.selectedIdState.asReadonly();
    items$ = this.itemsState.asReadonly();
    transparent$ = this.transparentState.asReadonly();
    divided$ = this.dividedState.asReadonly();
    equalWidth$ = this.equalWidthState.asReadonly();
    hasOverflow$ = this.hasOverflowState.asReadonly();
    overflowItems$ = computed(() => {
        const overflowIds = new Set(this.overflowIdsState());
        return this.itemsState().filter(item => overflowIds.has(item.id));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overflowItems$" }] : /* istanbul ignore next */ []));
    selectedIsOverflow$ = computed(() => this.overflowItems$().some(item => item.id === this.selectedIdState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIsOverflow$" }] : /* istanbul ignore next */ []));
    overflowMenuItems$ = computed(() => this.overflowItems$().map(item => ({
        id: item.id,
        label: this.menuLabelFor(item),
        type: 'choice',
        disabled: item.disabled,
        selected: item.id === this.selectedIdState(),
    })), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overflowMenuItems$" }] : /* istanbul ignore next */ []));
    get indicatorX() {
        return `${this.indicatorXState()}px`;
    }
    get indicatorWidth() {
        return `${this.indicatorWidthState()}px`;
    }
    ngAfterViewInit() {
        this.tabsChangesSubscription = this.tabButtons?.changes.subscribe(() => {
            this.observeLayoutTargets();
            this.scheduleLayoutRefresh();
        });
        this.observeLayoutTargets();
        this.scheduleLayoutRefresh();
    }
    ngOnDestroy() {
        this.tabsChangesSubscription?.unsubscribe();
        this.destroyMeasurements();
    }
    select(id, scrollToSelection = false) {
        const item = this.itemsState().find(candidate => candidate.id === id);
        if (!item || item.disabled) {
            return;
        }
        if (this.selectedIdState() === id) {
            return;
        }
        this.selectedIdState.set(id);
        this.selectedIdChange.emit(id);
        if (scrollToSelection) {
            this.scheduleSelectedTabScroll();
        }
        else {
            this.schedulePointerScrollRestore();
        }
        this.scheduleLayoutRefresh();
    }
    onKeydown(event, index) {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Enter'].includes(event.key)) {
            return;
        }
        event.preventDefault();
        const enabledItems = this.itemsState().filter(item => !item.disabled);
        if (enabledItems.length === 0) {
            return;
        }
        if (event.key === ' ' || event.key === 'Enter') {
            const item = this.itemsState()[index];
            if (item) {
                this.select(item.id, false);
            }
            return;
        }
        const currentItem = this.itemsState()[index];
        const currentEnabledIndex = Math.max(enabledItems.findIndex(item => item.id === currentItem?.id), 0);
        const maxIndex = enabledItems.length - 1;
        let nextEnabledIndex = currentEnabledIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextEnabledIndex = currentEnabledIndex >= maxIndex ? 0 : currentEnabledIndex + 1;
        }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextEnabledIndex = currentEnabledIndex <= 0 ? maxIndex : currentEnabledIndex - 1;
        }
        else if (event.key === 'Home') {
            nextEnabledIndex = 0;
        }
        else if (event.key === 'End') {
            nextEnabledIndex = maxIndex;
        }
        const nextItem = enabledItems[nextEnabledIndex];
        if (!nextItem) {
            return;
        }
        this.select(nextItem.id, true);
        const nextIndex = this.itemsState().findIndex(item => item.id === nextItem.id);
        this.focusTab(nextIndex);
    }
    onTabPointerDown(event) {
        this.pointerScrollLeft = this.trackRef?.nativeElement.scrollLeft;
        event.preventDefault();
    }
    tabIndexFor(item, index) {
        if (item.disabled) {
            return '-1';
        }
        if (item.id === this.selectedIdState()) {
            return '0';
        }
        if (!this.selectedIdState()) {
            return this.itemsState().findIndex(candidate => !candidate.disabled) === index ? '0' : '-1';
        }
        return '-1';
    }
    hasCount(item) {
        return typeof item.count === 'number' && Number.isFinite(item.count);
    }
    menuLabelFor(item) {
        return this.hasCount(item) ? `${item.label} (${item.count})` : item.label;
    }
    tabIdFor(index) {
        return this.controlsId ? `${this.controlsId}-tab-${index}` : null;
    }
    normalizeItems(value) {
        const ids = new Set();
        return [...(value ?? [])].map((item, index) => {
            const id = item?.id?.trim() ?? '';
            if (!id) {
                throw new Error(`[cx-tabs] item at index ${index} requires a non-empty id.`);
            }
            if (ids.has(id)) {
                throw new Error(`[cx-tabs] item id "${id}" must be unique.`);
            }
            ids.add(id);
            const label = item?.label?.trim() ?? '';
            return {
                id,
                label,
                count: this.normalizeCount(item.count),
                disabled: !!item.disabled,
            };
        });
    }
    normalizeCount(value) {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0
            ? Math.floor(value)
            : undefined;
    }
    resolveSelectedId(value) {
        const items = this.itemsState();
        const requested = value?.trim();
        if (requested && items.some(item => item.id === requested && !item.disabled)) {
            return requested;
        }
        return items.find(item => !item.disabled)?.id ?? '';
    }
    ensureSelectedId() {
        const resolved = this.resolveSelectedId(this.selectedIdState());
        if (resolved !== this.selectedIdState()) {
            this.selectedIdState.set(resolved);
        }
    }
    observeLayoutTargets() {
        this.resizeObserver?.disconnect();
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        this.resizeObserver = new ResizeObserver(() => this.scheduleLayoutRefresh());
        if (this.rootRef?.nativeElement) {
            this.resizeObserver.observe(this.rootRef.nativeElement);
        }
        if (this.trackRef?.nativeElement) {
            this.resizeObserver.observe(this.trackRef.nativeElement);
        }
        this.tabButtons?.forEach(button => this.resizeObserver?.observe(button.nativeElement));
    }
    scheduleLayoutRefresh() {
        if (this.layoutFrameId !== undefined) {
            cancelAnimationFrame(this.layoutFrameId);
        }
        if (typeof requestAnimationFrame === 'undefined') {
            this.refreshLayout();
            return;
        }
        this.layoutFrameId = requestAnimationFrame(() => {
            this.layoutFrameId = undefined;
            this.refreshLayout();
        });
    }
    refreshLayout() {
        this.ensureSelectedId();
        this.refreshOverflowItems();
        this.scheduleIndicatorRefresh();
    }
    refreshOverflowItems() {
        const items = this.itemsState();
        if (items.length === 0) {
            this.setHasOverflow(false);
            this.setOverflowIds([]);
            return;
        }
        const track = this.trackRef?.nativeElement;
        const tabButtons = this.tabButtons?.toArray() ?? [];
        if (!track || tabButtons.length !== items.length || track.clientWidth <= 0) {
            this.setHasOverflow(false);
            this.setOverflowIds([]);
            return;
        }
        const hasOverflow = track.scrollWidth > track.clientWidth + 1;
        this.setHasOverflow(hasOverflow);
        if (!hasOverflow) {
            this.setOverflowIds([]);
            return;
        }
        const trackRect = track.getBoundingClientRect();
        const overflowIds = items
            .filter((item, index) => {
            const rect = tabButtons[index]?.nativeElement.getBoundingClientRect();
            if (!rect) {
                return false;
            }
            return rect.left < trackRect.left - 1 || rect.right > trackRect.right + 1;
        })
            .map(item => item.id);
        this.setOverflowIds(overflowIds);
    }
    setHasOverflow(hasOverflow) {
        if (this.hasOverflowState() === hasOverflow) {
            return;
        }
        this.hasOverflowState.set(hasOverflow);
        this.changeDetector.markForCheck();
    }
    setOverflowIds(ids) {
        const previous = this.overflowIdsState();
        if (previous.length === ids.length && previous.every((id, index) => id === ids[index])) {
            return;
        }
        this.overflowIdsState.set(ids);
        this.changeDetector.markForCheck();
    }
    scheduleIndicatorRefresh() {
        if (this.indicatorFrameId !== undefined) {
            cancelAnimationFrame(this.indicatorFrameId);
        }
        if (typeof requestAnimationFrame === 'undefined') {
            this.refreshIndicator();
            return;
        }
        this.indicatorFrameId = requestAnimationFrame(() => {
            this.indicatorFrameId = undefined;
            this.refreshIndicator();
        });
    }
    refreshIndicator() {
        const selectedIndex = this.itemsState().findIndex(item => item.id === this.selectedIdState());
        const selectedButton = this.tabButtons?.toArray()[selectedIndex]?.nativeElement;
        if (selectedIndex < 0 || !selectedButton) {
            this.indicatorVisible$.set(false);
            return;
        }
        this.indicatorXState.set(selectedButton.offsetLeft);
        this.indicatorWidthState.set(selectedButton.offsetWidth);
        this.indicatorVisible$.set(true);
    }
    onTrackScroll() {
        this.scheduleLayoutRefresh();
    }
    scheduleSelectedTabScroll() {
        if (this.scrollFrameId !== undefined) {
            cancelAnimationFrame(this.scrollFrameId);
        }
        if (typeof requestAnimationFrame === 'undefined') {
            this.scrollSelectedTabIntoView();
            return;
        }
        this.scrollFrameId = requestAnimationFrame(() => {
            this.scrollFrameId = undefined;
            this.scrollSelectedTabIntoView();
        });
    }
    scrollSelectedTabIntoView() {
        const selectedIndex = this.itemsState().findIndex(item => item.id === this.selectedIdState());
        const selectedButton = this.tabButtons?.toArray()[selectedIndex]?.nativeElement;
        const track = this.trackRef?.nativeElement;
        if (!selectedButton || !track) {
            return;
        }
        const tabLeft = selectedButton.offsetLeft;
        const tabRight = tabLeft + selectedButton.offsetWidth;
        const viewportLeft = track.scrollLeft;
        const viewportRight = viewportLeft + track.clientWidth;
        let nextScrollLeft = viewportLeft;
        if (tabLeft < viewportLeft) {
            nextScrollLeft = tabLeft;
        }
        else if (tabRight > viewportRight) {
            nextScrollLeft = tabRight - track.clientWidth;
        }
        if (Math.abs(nextScrollLeft - viewportLeft) < 1) {
            this.scheduleLayoutRefresh();
            return;
        }
        track.scrollTo({
            left: Math.max(0, nextScrollLeft),
            behavior: 'smooth',
        });
        this.scheduleLayoutRefresh();
    }
    schedulePointerScrollRestore() {
        const scrollLeft = this.pointerScrollLeft;
        const track = this.trackRef?.nativeElement;
        this.pointerScrollLeft = undefined;
        if (scrollLeft === undefined || !track) {
            return;
        }
        const restore = () => {
            track.scrollLeft = scrollLeft;
            this.scheduleLayoutRefresh();
        };
        if (typeof requestAnimationFrame === 'undefined') {
            restore();
            return;
        }
        requestAnimationFrame(restore);
    }
    focusTab(index) {
        if (index < 0) {
            return;
        }
        const focus = () => this.tabButtons?.get(index)?.nativeElement.focus({ preventScroll: true });
        if (typeof requestAnimationFrame === 'undefined') {
            focus();
            return;
        }
        requestAnimationFrame(focus);
    }
    destroyMeasurements() {
        if (this.layoutFrameId !== undefined) {
            cancelAnimationFrame(this.layoutFrameId);
        }
        if (this.indicatorFrameId !== undefined) {
            cancelAnimationFrame(this.indicatorFrameId);
        }
        if (this.scrollFrameId !== undefined) {
            cancelAnimationFrame(this.scrollFrameId);
        }
        this.resizeObserver?.disconnect();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTabsComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTabsComponent, isStandalone: true, selector: "cx-tabs", inputs: { ariaLabel: "ariaLabel", controlsId: "controlsId", items: "items", selectedId: "selectedId", transparent: "transparent", divided: "divided", equalWidth: "equalWidth" }, outputs: { selectedIdChange: "selectedIdChange" }, viewQueries: [{ propertyName: "rootRef", first: true, predicate: ["rootRef"], descendants: true, read: ElementRef }, { propertyName: "trackRef", first: true, predicate: ["trackRef"], descendants: true, read: ElementRef }, { propertyName: "tabButtons", predicate: ["tabButton"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (items$().length > 0) {\n<div\n  #rootRef\n  class=\"cx-tabs\"\n  [class.cx-tabs--transparent]=\"transparent$()\"\n  [class.cx-tabs--divided]=\"divided$()\"\n  [class.cx-tabs--equal-width]=\"equalWidth$()\"\n>\n  <div\n    #trackRef\n    class=\"cx-tabs__track\"\n    role=\"tablist\"\n    [attr.aria-label]=\"ariaLabel\"\n    (scroll)=\"onTrackScroll()\"\n  >\n    @for (item of items$(); track item.id; let index = $index) {\n      <button\n        #tabButton\n        type=\"button\"\n        class=\"cx-tabs__tab\"\n        role=\"tab\"\n        [class.cx-tabs__tab--active]=\"selectedId$() === item.id\"\n        [class.cx-tabs__tab--disabled]=\"item.disabled\"\n        [disabled]=\"item.disabled\"\n        [attr.id]=\"tabIdFor(index)\"\n        [attr.aria-selected]=\"selectedId$() === item.id ? 'true' : 'false'\"\n        [attr.aria-controls]=\"controlsId || null\"\n        [attr.tabindex]=\"tabIndexFor(item, index)\"\n        [cxTooltip]=\"item.label\"\n        [cxTooltipOverflow]=\"true\"\n        (pointerdown)=\"onTabPointerDown($event)\"\n        (click)=\"select(item.id, false)\"\n        (keydown)=\"onKeydown($event, index)\"\n      >\n        <span class=\"cx-tabs__label\" data-cx-tooltip-overflow>{{ item.label }}</span>\n        @if (hasCount(item)) {\n          <span class=\"cx-tabs__count\">{{ item.count }}</span>\n        }\n      </button>\n    }\n\n    @if (indicatorVisible$()) {\n      <span\n        class=\"cx-tabs__indicator\"\n        [style.--cx-tabs-indicator-x]=\"indicatorX\"\n        [style.--cx-tabs-indicator-width]=\"indicatorWidth\"\n        aria-hidden=\"true\"\n      ></span>\n    }\n  </div>\n\n  @if (overflowItems$().length > 0) {\n    <cx-menu\n      [presentation]=\"{ kind: 'trigger' }\"\n      #overflowMenu\n      class=\"cx-tabs__overflow\"\n      [items]=\"overflowMenuItems$()\"\n      [currentId]=\"selectedId$()\"\n      [disabled]=\"!hasOverflow$()\"\n      ariaLabel=\"More tabs\"\n      [class.cx-tabs__overflow--hidden]=\"!hasOverflow$()\"\n      (itemSelect)=\"select($event, true)\"\n      (openChange)=\"overflowOpen$.set($event)\"\n    >\n      <cx-icon-button\n        cxMenuTrigger\n        icon=\"chevrons-right\"\n        variant=\"transparent\"\n        [selected]=\"overflowOpen$() || selectedIsOverflow$()\"\n        ariaLabel=\"More tabs\"\n      />\n    </cx-menu>\n  }\n</div>\n}\n", styles: [":host{display:block;width:100%;min-width:0;max-width:100%}.cx-tabs{position:relative;display:flex;width:100%;min-width:0;align-items:stretch;gap:0;padding:0;border-bottom:var(--border-width) solid rgba(0,0,0,0);background:var(--opacity-low);box-sizing:border-box}.cx-tabs--divided{border-bottom-color:var(--opacity-mid)}.cx-tabs--transparent{background:rgba(0,0,0,0)}.cx-tabs__track{position:relative;display:flex;min-width:0;flex:1 1 auto;align-items:stretch;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}.cx-tabs__track::-webkit-scrollbar{display:none}.cx-tabs__tab{position:relative;display:inline-flex;min-width:0;min-height:40px;flex:0 0 auto;align-items:center;gap:var(--space-xs);padding:0 var(--space-md);border:0;border-radius:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transition:color var(--motion-fast) ease;white-space:nowrap}.cx-tabs--equal-width .cx-tabs__track>.cx-tabs__tab{flex:1 1 0;justify-content:center}.cx-tabs__tab:is(:hover,:focus-visible):not(.cx-tabs__tab--disabled){color:var(--ink)}.cx-tabs__tab:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tabs__tab:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-tabs__tab--active{color:var(--ink)}.cx-tabs__tab--disabled,.cx-tabs__tab:disabled{cursor:default;opacity:.45}.cx-tabs__label{min-width:0;overflow:hidden;text-overflow:ellipsis}.cx-tabs__count{display:inline-flex;min-width:18px;height:18px;align-items:center;justify-content:center;padding:0 var(--space-2xs);border-radius:var(--radius-pill, 999px);corner-shape:round;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);line-height:1}.cx-tabs__tab--active .cx-tabs__count{background:var(--opacity-mid);color:var(--ink)}.cx-tabs__indicator{position:absolute;bottom:0;left:0;width:var(--cx-tabs-indicator-width);height:2px;background:var(--ink);pointer-events:none;transform:translateX(var(--cx-tabs-indicator-x));transition:transform var(--motion-base) var(--ease-out),width var(--motion-base) var(--ease-out)}.cx-tabs__overflow{--cx-icon-button-transparent-color: var(--opacity-high);--cx-icon-button-transparent-hover-background: var(--opacity-low);display:inline-flex;flex:0 0 var(--controller-size);align-items:center;justify-content:center;align-self:stretch;min-height:40px;width:var(--controller-size)}.cx-tabs__overflow:hover,.cx-tabs__overflow:has([aria-expanded=true]){--cx-icon-button-transparent-color: var(--ink)}.cx-tabs__overflow--hidden{display:none}@media(prefers-reduced-motion: reduce){.cx-tabs__indicator{transition:none}}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTabsComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-tabs', imports: [CxIconButtonComponent, CxMenuComponent, CxMenuTriggerDirective, CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (items$().length > 0) {\n<div\n  #rootRef\n  class=\"cx-tabs\"\n  [class.cx-tabs--transparent]=\"transparent$()\"\n  [class.cx-tabs--divided]=\"divided$()\"\n  [class.cx-tabs--equal-width]=\"equalWidth$()\"\n>\n  <div\n    #trackRef\n    class=\"cx-tabs__track\"\n    role=\"tablist\"\n    [attr.aria-label]=\"ariaLabel\"\n    (scroll)=\"onTrackScroll()\"\n  >\n    @for (item of items$(); track item.id; let index = $index) {\n      <button\n        #tabButton\n        type=\"button\"\n        class=\"cx-tabs__tab\"\n        role=\"tab\"\n        [class.cx-tabs__tab--active]=\"selectedId$() === item.id\"\n        [class.cx-tabs__tab--disabled]=\"item.disabled\"\n        [disabled]=\"item.disabled\"\n        [attr.id]=\"tabIdFor(index)\"\n        [attr.aria-selected]=\"selectedId$() === item.id ? 'true' : 'false'\"\n        [attr.aria-controls]=\"controlsId || null\"\n        [attr.tabindex]=\"tabIndexFor(item, index)\"\n        [cxTooltip]=\"item.label\"\n        [cxTooltipOverflow]=\"true\"\n        (pointerdown)=\"onTabPointerDown($event)\"\n        (click)=\"select(item.id, false)\"\n        (keydown)=\"onKeydown($event, index)\"\n      >\n        <span class=\"cx-tabs__label\" data-cx-tooltip-overflow>{{ item.label }}</span>\n        @if (hasCount(item)) {\n          <span class=\"cx-tabs__count\">{{ item.count }}</span>\n        }\n      </button>\n    }\n\n    @if (indicatorVisible$()) {\n      <span\n        class=\"cx-tabs__indicator\"\n        [style.--cx-tabs-indicator-x]=\"indicatorX\"\n        [style.--cx-tabs-indicator-width]=\"indicatorWidth\"\n        aria-hidden=\"true\"\n      ></span>\n    }\n  </div>\n\n  @if (overflowItems$().length > 0) {\n    <cx-menu\n      [presentation]=\"{ kind: 'trigger' }\"\n      #overflowMenu\n      class=\"cx-tabs__overflow\"\n      [items]=\"overflowMenuItems$()\"\n      [currentId]=\"selectedId$()\"\n      [disabled]=\"!hasOverflow$()\"\n      ariaLabel=\"More tabs\"\n      [class.cx-tabs__overflow--hidden]=\"!hasOverflow$()\"\n      (itemSelect)=\"select($event, true)\"\n      (openChange)=\"overflowOpen$.set($event)\"\n    >\n      <cx-icon-button\n        cxMenuTrigger\n        icon=\"chevrons-right\"\n        variant=\"transparent\"\n        [selected]=\"overflowOpen$() || selectedIsOverflow$()\"\n        ariaLabel=\"More tabs\"\n      />\n    </cx-menu>\n  }\n</div>\n}\n", styles: [":host{display:block;width:100%;min-width:0;max-width:100%}.cx-tabs{position:relative;display:flex;width:100%;min-width:0;align-items:stretch;gap:0;padding:0;border-bottom:var(--border-width) solid rgba(0,0,0,0);background:var(--opacity-low);box-sizing:border-box}.cx-tabs--divided{border-bottom-color:var(--opacity-mid)}.cx-tabs--transparent{background:rgba(0,0,0,0)}.cx-tabs__track{position:relative;display:flex;min-width:0;flex:1 1 auto;align-items:stretch;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}.cx-tabs__track::-webkit-scrollbar{display:none}.cx-tabs__tab{position:relative;display:inline-flex;min-width:0;min-height:40px;flex:0 0 auto;align-items:center;gap:var(--space-xs);padding:0 var(--space-md);border:0;border-radius:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transition:color var(--motion-fast) ease;white-space:nowrap}.cx-tabs--equal-width .cx-tabs__track>.cx-tabs__tab{flex:1 1 0;justify-content:center}.cx-tabs__tab:is(:hover,:focus-visible):not(.cx-tabs__tab--disabled){color:var(--ink)}.cx-tabs__tab:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tabs__tab:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-tabs__tab--active{color:var(--ink)}.cx-tabs__tab--disabled,.cx-tabs__tab:disabled{cursor:default;opacity:.45}.cx-tabs__label{min-width:0;overflow:hidden;text-overflow:ellipsis}.cx-tabs__count{display:inline-flex;min-width:18px;height:18px;align-items:center;justify-content:center;padding:0 var(--space-2xs);border-radius:var(--radius-pill, 999px);corner-shape:round;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);line-height:1}.cx-tabs__tab--active .cx-tabs__count{background:var(--opacity-mid);color:var(--ink)}.cx-tabs__indicator{position:absolute;bottom:0;left:0;width:var(--cx-tabs-indicator-width);height:2px;background:var(--ink);pointer-events:none;transform:translateX(var(--cx-tabs-indicator-x));transition:transform var(--motion-base) var(--ease-out),width var(--motion-base) var(--ease-out)}.cx-tabs__overflow{--cx-icon-button-transparent-color: var(--opacity-high);--cx-icon-button-transparent-hover-background: var(--opacity-low);display:inline-flex;flex:0 0 var(--controller-size);align-items:center;justify-content:center;align-self:stretch;min-height:40px;width:var(--controller-size)}.cx-tabs__overflow:hover,.cx-tabs__overflow:has([aria-expanded=true]){--cx-icon-button-transparent-color: var(--ink)}.cx-tabs__overflow--hidden{display:none}@media(prefers-reduced-motion: reduce){.cx-tabs__indicator{transition:none}}"] }]
        }], propDecorators: { rootRef: [{
                type: ViewChild,
                args: ['rootRef', { read: ElementRef }]
            }], trackRef: [{
                type: ViewChild,
                args: ['trackRef', { read: ElementRef }]
            }], tabButtons: [{
                type: ViewChildren,
                args: ['tabButton', { read: ElementRef }]
            }], ariaLabel: [{
                type: Input
            }], controlsId: [{
                type: Input
            }], items: [{
                type: Input
            }], selectedId: [{
                type: Input
            }], transparent: [{
                type: Input
            }], divided: [{
                type: Input
            }], equalWidth: [{
                type: Input
            }], selectedIdChange: [{
                type: Output
            }] } });
