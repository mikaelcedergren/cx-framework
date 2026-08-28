import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, inject, signal, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CxMenuComponent, CxMenuTriggerDirective } from '../../overlay/cx-menu/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
export class CxBreadcrumbsComponent {
    cdr = inject(ChangeDetectorRef);
    resizeObserver;
    viewReady = false;
    listRef;
    measureListRef;
    itemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemsState" }] : /* istanbul ignore next */ []));
    currentIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentIdState" }] : /* istanbul ignore next */ []));
    ariaLabelState = signal('Breadcrumbs', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabelState" }] : /* istanbul ignore next */ []));
    compactState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "compactState" }] : /* istanbul ignore next */ []));
    set ariaLabel(value) {
        const label = value?.trim();
        this.ariaLabelState.set(label ? label : 'Breadcrumbs');
    }
    set items(value) {
        this.itemsState.set(this.normalizeItems(value));
        this.scheduleCompactSync();
    }
    set currentId(value) {
        this.currentIdState.set(value?.trim() || undefined);
        this.scheduleCompactSync();
    }
    itemSelect = new EventEmitter();
    optionSelect = new EventEmitter();
    ariaLabel$ = this.ariaLabelState.asReadonly();
    effectiveCurrentId$ = computed(() => {
        const currentId = this.currentIdState();
        if (currentId && this.itemsState().some(item => item.id === currentId)) {
            return currentId;
        }
        return this.itemsState().at(-1)?.id;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "effectiveCurrentId$" }] : /* istanbul ignore next */ []));
    pathItems$ = computed(() => {
        const items = this.itemsState();
        const currentId = this.effectiveCurrentId$();
        const currentIndex = items.findIndex(item => item.id === currentId);
        return currentIndex >= 0 ? items.slice(0, currentIndex + 1) : items;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pathItems$" }] : /* istanbul ignore next */ []));
    shouldCompact$ = computed(() => this.compactState() && this.pathItems$().length > 2, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "shouldCompact$" }] : /* istanbul ignore next */ []));
    firstItem$ = computed(() => this.pathItems$()[0], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "firstItem$" }] : /* istanbul ignore next */ []));
    lastItem$ = computed(() => this.pathItems$().at(-1), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "lastItem$" }] : /* istanbul ignore next */ []));
    hiddenItems$ = computed(() => {
        const items = this.pathItems$();
        return this.shouldCompact$() ? items.slice(1, -1) : [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hiddenItems$" }] : /* istanbul ignore next */ []));
    hiddenMenuItems$ = computed(() => this.hiddenItems$().map(item => ({ id: item.id, label: item.label })), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hiddenMenuItems$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        this.viewReady = true;
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.syncCompactState());
            const list = this.listRef?.nativeElement;
            if (list) {
                this.resizeObserver.observe(list);
            }
        }
        this.scheduleCompactSync();
    }
    ngOnDestroy() {
        this.resizeObserver?.disconnect();
    }
    isCurrent(itemId) {
        return this.effectiveCurrentId$() === itemId;
    }
    selectItem(itemId) {
        if (this.isCurrent(itemId)) {
            return;
        }
        this.itemSelect.emit(itemId);
    }
    hasRouterLink(item) {
        return item.routerLink !== undefined;
    }
    hasHref(item) {
        return !!item.href;
    }
    hasOptions(item) {
        return (item.options?.length ?? 0) > 0;
    }
    optionMenuGroups(item) {
        // Sibling switching is a single-choice group: exactly one option is the
        // current page, so items announce as menuitemradio with aria-checked.
        const selectedOptionId = item.selectedOptionId ?? item.id;
        return [
            {
                selection: 'single',
                items: (item.options ?? []).map(option => ({
                    id: option.id,
                    label: option.label,
                    disabled: option.disabled,
                    selected: option.id === selectedOptionId,
                })),
            },
        ];
    }
    selectOption(item, optionId) {
        if ((item.selectedOptionId ?? item.id) === optionId) {
            return;
        }
        this.optionSelect.emit({ itemId: item.id, optionId });
    }
    normalizeItems(value) {
        const ids = new Set();
        return (value ?? []).map((item, index) => {
            const id = item?.id?.trim() ?? '';
            if (!id) {
                throw new Error(`[cx-breadcrumbs] item at index ${index} requires a non-empty id.`);
            }
            if (ids.has(id)) {
                throw new Error(`[cx-breadcrumbs] item id "${id}" must be unique.`);
            }
            ids.add(id);
            const label = item?.label?.trim() ?? '';
            return {
                ...item,
                id,
                label,
                selectedOptionId: item.selectedOptionId?.trim() || undefined,
                options: this.normalizeOptions(item.options, id),
            };
        });
    }
    normalizeOptions(value, itemId) {
        const ids = new Set();
        return (value ?? []).map((option, index) => {
            const id = option?.id?.trim() ?? '';
            if (!id) {
                throw new Error(`[cx-breadcrumbs] option at index ${index} for item "${itemId}" requires a non-empty id.`);
            }
            if (ids.has(id)) {
                throw new Error(`[cx-breadcrumbs] option id "${id}" for item "${itemId}" must be unique.`);
            }
            ids.add(id);
            const label = option?.label?.trim() ?? '';
            return { ...option, id, label };
        });
    }
    scheduleCompactSync() {
        if (!this.viewReady) {
            return;
        }
        queueMicrotask(() => this.syncCompactState());
    }
    syncCompactState() {
        const list = this.listRef?.nativeElement;
        const measureList = this.measureListRef?.nativeElement;
        if (!list || !measureList || list.clientWidth <= 0) {
            return;
        }
        const shouldCompact = this.pathItems$().length > 2 && measureList.scrollWidth > list.clientWidth + 1;
        if (this.compactState() === shouldCompact) {
            return;
        }
        this.compactState.set(shouldCompact);
        this.cdr.markForCheck();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBreadcrumbsComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxBreadcrumbsComponent, isStandalone: true, selector: "cx-breadcrumbs", inputs: { ariaLabel: "ariaLabel", items: "items", currentId: "currentId" }, outputs: { itemSelect: "itemSelect", optionSelect: "optionSelect" }, viewQueries: [{ propertyName: "listRef", first: true, predicate: ["list"], descendants: true, read: ElementRef }, { propertyName: "measureListRef", first: true, predicate: ["measureList"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (pathItems$().length > 0) {\n<nav class=\"cx-breadcrumbs\" [attr.aria-label]=\"ariaLabel$()\">\n  <ng-template #breadcrumbItem let-item let-last=\"last\" let-kind=\"kind\">\n    <li\n      class=\"cx-breadcrumbs__item\"\n      [class.cx-breadcrumbs__item--anchor]=\"kind === 'anchor'\"\n      [class.cx-breadcrumbs__item--current]=\"isCurrent(item.id)\"\n    >\n      @if (hasOptions(item)) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-breadcrumbs__menu\"\n          [ariaLabel]=\"'Switch ' + item.label\"\n          [groups]=\"optionMenuGroups(item)\"\n          [currentId]=\"item.selectedOptionId ?? item.id\"\n          align=\"start\"\n          [width]=\"220\"\n          (itemSelect)=\"selectOption(item, $event)\"\n        >\n          <button\n            cxMenuTrigger\n            type=\"button\"\n            class=\"cx-breadcrumbs__control cx-breadcrumbs__control--menu\"\n            [class.cx-breadcrumbs__current]=\"isCurrent(item.id)\"\n            [attr.aria-current]=\"isCurrent(item.id) ? 'page' : null\"\n            [cxTooltip]=\"item.label\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            <span\n              class=\"cx-breadcrumbs__label\"\n              data-cx-tooltip-overflow\n              [attr.data-text]=\"item.label\"\n            >\n              {{ item.label }}\n            </span>\n            <cx-icon class=\"cx-breadcrumbs__menu-icon\" icon=\"chevron-down\" [size]=\"16\" aria-hidden=\"true\" />\n          </button>\n        </cx-menu>\n      } @else if (isCurrent(item.id)) {\n        <span\n          class=\"cx-breadcrumbs__current\"\n          aria-current=\"page\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </span>\n      } @else if (hasRouterLink(item)) {\n        <a\n          class=\"cx-breadcrumbs__control\"\n          [routerLink]=\"item.routerLink\"\n          [fragment]=\"item.fragment\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n          (click)=\"selectItem(item.id)\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </a>\n      } @else if (hasHref(item)) {\n        <a\n          class=\"cx-breadcrumbs__control\"\n          [href]=\"item.href\"\n          [attr.target]=\"item.target ?? null\"\n          [attr.rel]=\"item.rel ?? null\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n          (click)=\"selectItem(item.id)\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </a>\n      } @else {\n        <button\n          type=\"button\"\n          class=\"cx-breadcrumbs__control\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n          (click)=\"selectItem(item.id)\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </button>\n      }\n\n      @if (!last) {\n        <span class=\"cx-breadcrumbs__separator\" aria-hidden=\"true\">\n          <cx-icon icon=\"chevron-right\" [size]=\"16\" />\n        </span>\n      }\n    </li>\n  </ng-template>\n\n  <ol #list class=\"cx-breadcrumbs__list\">\n    @if (shouldCompact$()) {\n      @if (firstItem$(); as firstItem) {\n        <ng-container\n          [ngTemplateOutlet]=\"breadcrumbItem\"\n          [ngTemplateOutletContext]=\"{ $implicit: firstItem, last: false, kind: 'anchor' }\"\n        />\n      }\n\n      <li class=\"cx-breadcrumbs__item cx-breadcrumbs__item--ellipsis\">\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-breadcrumbs__menu\"\n          ariaLabel=\"Hidden breadcrumb levels\"\n          [items]=\"hiddenMenuItems$()\"\n          align=\"start\"\n          [width]=\"220\"\n          (itemSelect)=\"selectItem($event)\"\n        >\n          <button\n            cxMenuTrigger\n            type=\"button\"\n            class=\"cx-breadcrumbs__control cx-breadcrumbs__control--ellipsis\"\n            aria-label=\"Show hidden breadcrumb levels\"\n          >\n            <span aria-hidden=\"true\">...</span>\n          </button>\n        </cx-menu>\n\n        <span class=\"cx-breadcrumbs__separator\" aria-hidden=\"true\">\n          <cx-icon icon=\"chevron-right\" [size]=\"16\" />\n        </span>\n      </li>\n\n      @if (lastItem$(); as lastItem) {\n        <ng-container\n          [ngTemplateOutlet]=\"breadcrumbItem\"\n          [ngTemplateOutletContext]=\"{ $implicit: lastItem, last: true, kind: 'current' }\"\n        />\n      }\n    } @else {\n      @for (item of pathItems$(); track item.id; let last = $last) {\n        <ng-container\n          [ngTemplateOutlet]=\"breadcrumbItem\"\n          [ngTemplateOutletContext]=\"{ $implicit: item, last, kind: last ? 'current' : 'middle' }\"\n        />\n      }\n    }\n  </ol>\n\n  <ol #measureList class=\"cx-breadcrumbs__measure\" aria-hidden=\"true\">\n    @for (item of pathItems$(); track item.id; let last = $last) {\n      <li class=\"cx-breadcrumbs__item\">\n        <span class=\"cx-breadcrumbs__measure-label\">{{ item.label }}</span>\n        @if (hasOptions(item)) {\n          <cx-icon class=\"cx-breadcrumbs__menu-icon\" icon=\"chevron-down\" [size]=\"16\" aria-hidden=\"true\" />\n        }\n        @if (!last) {\n          <span class=\"cx-breadcrumbs__separator\" aria-hidden=\"true\">\n            <cx-icon icon=\"chevron-right\" [size]=\"16\" />\n          </span>\n        }\n      </li>\n    }\n  </ol>\n</nav>\n}\n", styles: [":host{display:block;width:100%;min-width:0}.cx-breadcrumbs{width:100%;min-width:0}.cx-breadcrumbs__list,.cx-breadcrumbs__measure{display:flex;min-width:0;align-items:center;gap:var(--space-xs);margin:0;padding:0;list-style:none}.cx-breadcrumbs__list{width:100%;flex-wrap:nowrap;overflow:hidden}.cx-breadcrumbs__measure{position:fixed;bottom:0;left:0;width:max-content;max-width:none;height:0;overflow:hidden;pointer-events:none;visibility:hidden}.cx-breadcrumbs__item{display:inline-flex;min-width:0;max-width:min(28ch,42vw);flex:0 1 auto;align-items:center;gap:var(--space-xs)}.cx-breadcrumbs__item--anchor{flex:0 1 auto}.cx-breadcrumbs__item--current{flex:0 1 auto}.cx-breadcrumbs__item--ellipsis{flex:0 0 auto}.cx-breadcrumbs__control,.cx-breadcrumbs__current,.cx-breadcrumbs__measure-label{min-width:0;font-size:var(--font-size-body);line-height:1.2;white-space:nowrap}.cx-breadcrumbs__control,.cx-breadcrumbs__current{display:inline-flex;min-height:var(--controller-size-small);max-width:100%;align-items:center;gap:var(--space-2xs);border-radius:var(--radius-sm);padding:0 var(--space-2xs);box-sizing:border-box}.cx-breadcrumbs__control{border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font-family:inherit;font-weight:var(--font-weight-regular);text-decoration:none;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-breadcrumbs__control:hover,.cx-breadcrumbs__control:focus-visible{background:var(--opacity-low);color:var(--ink);outline:0}.cx-breadcrumbs__control:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-breadcrumbs__control:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-breadcrumbs__control--ellipsis{min-width:var(--icon-size-md);justify-content:center}.cx-breadcrumbs__current{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-breadcrumbs__label{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-breadcrumbs__label::before{content:attr(data-text);display:block;height:0;overflow:hidden;visibility:hidden;font-weight:var(--font-weight-bold)}.cx-breadcrumbs__menu{display:inline-flex;width:auto;min-width:0;max-width:100%}.cx-breadcrumbs__menu-icon{flex:0 0 auto;color:var(--opacity-mid);transition:color var(--motion-fast) ease}.cx-breadcrumbs__control:hover .cx-breadcrumbs__menu-icon,.cx-breadcrumbs__control:focus-visible .cx-breadcrumbs__menu-icon{color:var(--ink)}.cx-breadcrumbs__separator{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "browserUrl", "routerLink"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBreadcrumbsComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-breadcrumbs', imports: [
                        NgTemplateOutlet,
                        RouterLink,
                        CxIconComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxTooltipDirective,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (pathItems$().length > 0) {\n<nav class=\"cx-breadcrumbs\" [attr.aria-label]=\"ariaLabel$()\">\n  <ng-template #breadcrumbItem let-item let-last=\"last\" let-kind=\"kind\">\n    <li\n      class=\"cx-breadcrumbs__item\"\n      [class.cx-breadcrumbs__item--anchor]=\"kind === 'anchor'\"\n      [class.cx-breadcrumbs__item--current]=\"isCurrent(item.id)\"\n    >\n      @if (hasOptions(item)) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-breadcrumbs__menu\"\n          [ariaLabel]=\"'Switch ' + item.label\"\n          [groups]=\"optionMenuGroups(item)\"\n          [currentId]=\"item.selectedOptionId ?? item.id\"\n          align=\"start\"\n          [width]=\"220\"\n          (itemSelect)=\"selectOption(item, $event)\"\n        >\n          <button\n            cxMenuTrigger\n            type=\"button\"\n            class=\"cx-breadcrumbs__control cx-breadcrumbs__control--menu\"\n            [class.cx-breadcrumbs__current]=\"isCurrent(item.id)\"\n            [attr.aria-current]=\"isCurrent(item.id) ? 'page' : null\"\n            [cxTooltip]=\"item.label\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            <span\n              class=\"cx-breadcrumbs__label\"\n              data-cx-tooltip-overflow\n              [attr.data-text]=\"item.label\"\n            >\n              {{ item.label }}\n            </span>\n            <cx-icon class=\"cx-breadcrumbs__menu-icon\" icon=\"chevron-down\" [size]=\"16\" aria-hidden=\"true\" />\n          </button>\n        </cx-menu>\n      } @else if (isCurrent(item.id)) {\n        <span\n          class=\"cx-breadcrumbs__current\"\n          aria-current=\"page\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </span>\n      } @else if (hasRouterLink(item)) {\n        <a\n          class=\"cx-breadcrumbs__control\"\n          [routerLink]=\"item.routerLink\"\n          [fragment]=\"item.fragment\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n          (click)=\"selectItem(item.id)\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </a>\n      } @else if (hasHref(item)) {\n        <a\n          class=\"cx-breadcrumbs__control\"\n          [href]=\"item.href\"\n          [attr.target]=\"item.target ?? null\"\n          [attr.rel]=\"item.rel ?? null\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n          (click)=\"selectItem(item.id)\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </a>\n      } @else {\n        <button\n          type=\"button\"\n          class=\"cx-breadcrumbs__control\"\n          [cxTooltip]=\"item.label\"\n          [cxTooltipOverflow]=\"true\"\n          (click)=\"selectItem(item.id)\"\n        >\n          <span\n            class=\"cx-breadcrumbs__label\"\n            data-cx-tooltip-overflow\n            [attr.data-text]=\"item.label\"\n          >\n            {{ item.label }}\n          </span>\n        </button>\n      }\n\n      @if (!last) {\n        <span class=\"cx-breadcrumbs__separator\" aria-hidden=\"true\">\n          <cx-icon icon=\"chevron-right\" [size]=\"16\" />\n        </span>\n      }\n    </li>\n  </ng-template>\n\n  <ol #list class=\"cx-breadcrumbs__list\">\n    @if (shouldCompact$()) {\n      @if (firstItem$(); as firstItem) {\n        <ng-container\n          [ngTemplateOutlet]=\"breadcrumbItem\"\n          [ngTemplateOutletContext]=\"{ $implicit: firstItem, last: false, kind: 'anchor' }\"\n        />\n      }\n\n      <li class=\"cx-breadcrumbs__item cx-breadcrumbs__item--ellipsis\">\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-breadcrumbs__menu\"\n          ariaLabel=\"Hidden breadcrumb levels\"\n          [items]=\"hiddenMenuItems$()\"\n          align=\"start\"\n          [width]=\"220\"\n          (itemSelect)=\"selectItem($event)\"\n        >\n          <button\n            cxMenuTrigger\n            type=\"button\"\n            class=\"cx-breadcrumbs__control cx-breadcrumbs__control--ellipsis\"\n            aria-label=\"Show hidden breadcrumb levels\"\n          >\n            <span aria-hidden=\"true\">...</span>\n          </button>\n        </cx-menu>\n\n        <span class=\"cx-breadcrumbs__separator\" aria-hidden=\"true\">\n          <cx-icon icon=\"chevron-right\" [size]=\"16\" />\n        </span>\n      </li>\n\n      @if (lastItem$(); as lastItem) {\n        <ng-container\n          [ngTemplateOutlet]=\"breadcrumbItem\"\n          [ngTemplateOutletContext]=\"{ $implicit: lastItem, last: true, kind: 'current' }\"\n        />\n      }\n    } @else {\n      @for (item of pathItems$(); track item.id; let last = $last) {\n        <ng-container\n          [ngTemplateOutlet]=\"breadcrumbItem\"\n          [ngTemplateOutletContext]=\"{ $implicit: item, last, kind: last ? 'current' : 'middle' }\"\n        />\n      }\n    }\n  </ol>\n\n  <ol #measureList class=\"cx-breadcrumbs__measure\" aria-hidden=\"true\">\n    @for (item of pathItems$(); track item.id; let last = $last) {\n      <li class=\"cx-breadcrumbs__item\">\n        <span class=\"cx-breadcrumbs__measure-label\">{{ item.label }}</span>\n        @if (hasOptions(item)) {\n          <cx-icon class=\"cx-breadcrumbs__menu-icon\" icon=\"chevron-down\" [size]=\"16\" aria-hidden=\"true\" />\n        }\n        @if (!last) {\n          <span class=\"cx-breadcrumbs__separator\" aria-hidden=\"true\">\n            <cx-icon icon=\"chevron-right\" [size]=\"16\" />\n          </span>\n        }\n      </li>\n    }\n  </ol>\n</nav>\n}\n", styles: [":host{display:block;width:100%;min-width:0}.cx-breadcrumbs{width:100%;min-width:0}.cx-breadcrumbs__list,.cx-breadcrumbs__measure{display:flex;min-width:0;align-items:center;gap:var(--space-xs);margin:0;padding:0;list-style:none}.cx-breadcrumbs__list{width:100%;flex-wrap:nowrap;overflow:hidden}.cx-breadcrumbs__measure{position:fixed;bottom:0;left:0;width:max-content;max-width:none;height:0;overflow:hidden;pointer-events:none;visibility:hidden}.cx-breadcrumbs__item{display:inline-flex;min-width:0;max-width:min(28ch,42vw);flex:0 1 auto;align-items:center;gap:var(--space-xs)}.cx-breadcrumbs__item--anchor{flex:0 1 auto}.cx-breadcrumbs__item--current{flex:0 1 auto}.cx-breadcrumbs__item--ellipsis{flex:0 0 auto}.cx-breadcrumbs__control,.cx-breadcrumbs__current,.cx-breadcrumbs__measure-label{min-width:0;font-size:var(--font-size-body);line-height:1.2;white-space:nowrap}.cx-breadcrumbs__control,.cx-breadcrumbs__current{display:inline-flex;min-height:var(--controller-size-small);max-width:100%;align-items:center;gap:var(--space-2xs);border-radius:var(--radius-sm);padding:0 var(--space-2xs);box-sizing:border-box}.cx-breadcrumbs__control{border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font-family:inherit;font-weight:var(--font-weight-regular);text-decoration:none;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-breadcrumbs__control:hover,.cx-breadcrumbs__control:focus-visible{background:var(--opacity-low);color:var(--ink);outline:0}.cx-breadcrumbs__control:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-breadcrumbs__control:active{outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-breadcrumbs__control--ellipsis{min-width:var(--icon-size-md);justify-content:center}.cx-breadcrumbs__current{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-breadcrumbs__label{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-breadcrumbs__label::before{content:attr(data-text);display:block;height:0;overflow:hidden;visibility:hidden;font-weight:var(--font-weight-bold)}.cx-breadcrumbs__menu{display:inline-flex;width:auto;min-width:0;max-width:100%}.cx-breadcrumbs__menu-icon{flex:0 0 auto;color:var(--opacity-mid);transition:color var(--motion-fast) ease}.cx-breadcrumbs__control:hover .cx-breadcrumbs__menu-icon,.cx-breadcrumbs__control:focus-visible .cx-breadcrumbs__menu-icon{color:var(--ink)}.cx-breadcrumbs__separator{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}"] }]
        }], propDecorators: { listRef: [{
                type: ViewChild,
                args: ['list', { read: ElementRef }]
            }], measureListRef: [{
                type: ViewChild,
                args: ['measureList', { read: ElementRef }]
            }], ariaLabel: [{
                type: Input
            }], items: [{
                type: Input
            }], currentId: [{
                type: Input
            }], itemSelect: [{
                type: Output
            }], optionSelect: [{
                type: Output
            }] } });
