import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxDropdownComponent } from '../../inputs/cx-dropdown/index.js';
import * as i0 from "@angular/core";
function toPositiveInteger(value, fallback) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.max(1, Math.floor(value));
}
function toNonNegativeInteger(value, fallback) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.max(0, Math.floor(value));
}
function normalizePageSizeOptions(options) {
    const normalized = (options ?? [])
        .filter(value => Number.isFinite(value))
        .map(value => Math.max(1, Math.floor(value)));
    return [...new Set(normalized)];
}
function getPageCount(totalItems, pageSize) {
    if (pageSize <= 0) {
        return 0;
    }
    return Math.ceil(Math.max(0, totalItems) / pageSize);
}
function createPageItem(page, currentPage) {
    return {
        kind: 'page',
        id: `page-${page}`,
        page,
        label: String(page),
        current: page === currentPage,
    };
}
function buildPageItems(currentPage, pageCount) {
    if (pageCount <= 0) {
        return [];
    }
    const items = [];
    const maxDiff = 3;
    for (let index = 1; index <= pageCount; index++) {
        const diff = Math.abs(currentPage - index);
        const diffEnd = pageCount - currentPage;
        const show = index === 1 ||
            index === pageCount ||
            diff < maxDiff ||
            (index < currentPage && currentPage === maxDiff + 1) ||
            (index > currentPage && diffEnd === maxDiff + 1);
        if (show) {
            items.push(createPageItem(index, currentPage));
            continue;
        }
        if (items.at(-1)?.kind !== 'ellipsis') {
            items.push({ kind: 'ellipsis', id: `ellipsis-${index}`, label: '...' });
        }
    }
    return items;
}
function normalizePage(value) {
    return {
        number: toPositiveInteger(value?.number, 1),
        size: toPositiveInteger(value?.size, 25),
        total: toNonNegativeInteger(value?.total, 0),
    };
}
export class CxPaginationComponent {
    pageState = signal({ number: 1, size: 25, total: 0 }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pageState" }] : /* istanbul ignore next */ []));
    pageSizesState = signal([10, 25, 50, 100], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pageSizesState" }] : /* istanbul ignore next */ []));
    totalModeState = signal('known', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "totalModeState" }] : /* istanbul ignore next */ []));
    set page(value) {
        this.pageState.set(normalizePage(value));
    }
    set pageSizes(value) {
        this.pageSizesState.set(normalizePageSizeOptions(value ?? [10, 25, 50, 100]));
    }
    set totalMode(value) {
        this.totalModeState.set(value === 'unknown' ? 'unknown' : 'known');
    }
    pageChange = new EventEmitter();
    currentPage$ = computed(() => this.pageState().number, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentPage$" }] : /* istanbul ignore next */ []));
    currentPageSize$ = computed(() => this.pageState().size, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentPageSize$" }] : /* istanbul ignore next */ []));
    totalItems$ = computed(() => this.pageState().total, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "totalItems$" }] : /* istanbul ignore next */ []));
    availablePageSizes$ = computed(() => normalizePageSizeOptions(this.pageSizesState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "availablePageSizes$" }] : /* istanbul ignore next */ []));
    pageSizeOptions$ = computed(() => this.availablePageSizes$().map(value => ({
        id: String(value),
        label: String(value),
    })), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pageSizeOptions$" }] : /* istanbul ignore next */ []));
    pageCount$ = computed(() => getPageCount(this.totalItems$(), this.currentPageSize$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pageCount$" }] : /* istanbul ignore next */ []));
    pageSizeValue$ = computed(() => String(this.currentPageSize$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pageSizeValue$" }] : /* istanbul ignore next */ []));
    totalKnown$ = computed(() => this.totalModeState() === 'known', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "totalKnown$" }] : /* istanbul ignore next */ []));
    pageItems$ = computed(() => {
        if (!this.totalKnown$()) {
            return [createPageItem(this.currentPage$(), this.currentPage$())];
        }
        return buildPageItems(this.currentPage$(), this.pageCount$());
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pageItems$" }] : /* istanbul ignore next */ []));
    previousDisabled$ = computed(() => this.currentPage$() <= 1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "previousDisabled$" }] : /* istanbul ignore next */ []));
    nextDisabled$ = computed(() => this.totalKnown$() && this.currentPage$() >= this.pageCount$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "nextDisabled$" }] : /* istanbul ignore next */ []));
    totalText$ = computed(() => {
        if (!this.totalKnown$()) {
            return '';
        }
        const totalItems = this.totalItems$();
        if (totalItems === 0) {
            return '0 of 0';
        }
        const start = (this.currentPage$() - 1) * this.currentPageSize$() + 1;
        const end = Math.min(this.currentPage$() * this.currentPageSize$(), totalItems);
        return `${start}-${end} of ${totalItems}`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "totalText$" }] : /* istanbul ignore next */ []));
    goToPreviousPage() {
        if (this.previousDisabled$()) {
            return;
        }
        const nextPage = this.currentPage$() - 1;
        this.emitPage({ ...this.pageState(), number: nextPage });
    }
    goToNextPage() {
        if (this.nextDisabled$()) {
            return;
        }
        const nextPage = this.currentPage$() + 1;
        this.emitPage({ ...this.pageState(), number: nextPage });
    }
    goToPage(page) {
        const requestedPage = Math.max(1, toPositiveInteger(page, this.currentPage$()));
        const nextPage = this.totalKnown$() ? Math.min(requestedPage, this.pageCount$()) : requestedPage;
        if (nextPage === this.currentPage$()) {
            return;
        }
        this.emitPage({ ...this.pageState(), number: nextPage });
    }
    onPageSizeChange(value) {
        const parsedValue = Number.parseInt(value ?? '', 10);
        const nextPageSize = toPositiveInteger(parsedValue, this.currentPageSize$());
        if (nextPageSize === this.currentPageSize$()) {
            return;
        }
        this.emitPage({
            ...this.pageState(),
            number: 1,
            size: nextPageSize,
        });
    }
    emitPage(page) {
        const nextPage = normalizePage(page);
        this.pageState.set(nextPage);
        this.pageChange.emit(nextPage);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPaginationComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxPaginationComponent, isStandalone: true, selector: "cx-pagination", inputs: { page: "page", pageSizes: "pageSizes", totalMode: "totalMode" }, outputs: { pageChange: "pageChange" }, ngImport: i0, template: "<nav class=\"cx-pagination\" aria-label=\"Pagination\">\n  @if (totalText$()) {\n    <div class=\"cx-pagination__summary\" aria-label=\"Total items\">{{ totalText$() }}</div>\n  }\n\n  <div class=\"cx-pagination__controls\">\n    <div class=\"cx-pagination__navigation\">\n      <cx-icon-button\n        icon=\"chevron-left\"\n        ariaLabel=\"Previous page\" variant=\"transparent\"\n        [disabled]=\"previousDisabled$()\"\n        (pressed)=\"goToPreviousPage()\"\n      />\n      <div class=\"cx-pagination__pages\">\n        @for (item of pageItems$(); track item.id) {\n          @if (item.kind === 'page') {\n            @if (item.current) {\n              <div class=\"cx-pagination__page-button cx-pagination__page-button--current\">\n                {{ item.label }}\n              </div>\n            } @else {\n              <button type=\"button\" class=\"cx-pagination__page-button\" (click)=\"goToPage(item.page)\">\n                {{ item.label }}\n              </button>\n            }\n          } @else {\n            <span class=\"cx-pagination__ellipsis\" aria-hidden=\"true\">{{ item.label }}</span>\n          }\n        }\n      </div>\n      <cx-icon-button\n        icon=\"chevron-right\"\n        ariaLabel=\"Next page\" variant=\"transparent\"\n        [disabled]=\"nextDisabled$()\"\n        (pressed)=\"goToNextPage()\"\n      />\n    </div>\n\n    <div class=\"cx-pagination__page-size\">\n      <span class=\"cx-pagination__page-size-label\">Results per page</span>\n      <cx-dropdown\n        class=\"cx-pagination__page-size-select\"\n        label=\"\"\n        ariaLabel=\"Page size\"\n        placeholder=\"Select page size\"\n        size=\"small\"\n        [availableValues]=\"pageSizeOptions$()\"\n        [value]=\"pageSizeValue$()\"\n        (valueChange)=\"onPageSizeChange($event)\"\n      />\n    </div>\n  </div>\n</nav>\n", styles: [":host{display:inline-block;max-width:100%}.cx-pagination{display:flex;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-lg);user-select:none}.cx-pagination__summary{flex:0 0 auto;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);white-space:nowrap}.cx-pagination__controls{display:inline-flex;min-width:0;align-items:center;justify-content:flex-end;gap:var(--space-lg)}.cx-pagination__page-size,.cx-pagination__navigation{display:inline-flex;align-items:center;gap:var(--space-sm)}.cx-pagination__page-size-label{color:var(--opacity-high);font-size:var(--font-size-body);line-height:var(--line-height-body);white-space:nowrap}.cx-pagination__page-size-select{min-width:0;width:auto}.cx-pagination__navigation{flex-wrap:wrap;justify-content:flex-end}.cx-pagination__pages{display:inline-flex;align-items:center;gap:var(--space-sm)}.cx-pagination__page-button,.cx-pagination__ellipsis{display:inline-flex;min-width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1;white-space:nowrap}.cx-pagination__page-button{padding:0 var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);cursor:pointer;font-family:inherit;transition:background var(--motion-fast) ease,color var(--motion-fast) ease}.cx-pagination__page-button:hover:not(:disabled),.cx-pagination__page-button:focus-visible{background:var(--opacity-low);color:var(--ink);outline:0}.cx-pagination__page-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-pagination__page-button:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-pagination__page-button:disabled{cursor:default}.cx-pagination__page-button--current{color:var(--ink);font-weight:var(--font-weight-bold);cursor:default;pointer-events:none}.cx-pagination__ellipsis{min-width:auto;color:var(--opacity-high)}@media(max-width: 640px){.cx-pagination{align-items:flex-start;flex-direction:column}.cx-pagination__controls{width:100%;align-items:flex-start;flex-direction:column}.cx-pagination__navigation{justify-content:flex-start}}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxDropdownComponent, selector: "cx-dropdown", inputs: ["label", "ariaLabel", "name", "transparent", "translations", "placeholder", "size", "optional", "disabled", "loading", "loadingMore", "hasMore", "clearable", "selection", "filterMode", "searchable", "creatable", "hint", "validation", "availableValues", "value", "values"], outputs: ["valueChange", "valuesChange", "create", "focusChange", "clear", "openChange", "queryChange", "loadMore"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxPaginationComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-pagination', imports: [CxIconButtonComponent, CxDropdownComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<nav class=\"cx-pagination\" aria-label=\"Pagination\">\n  @if (totalText$()) {\n    <div class=\"cx-pagination__summary\" aria-label=\"Total items\">{{ totalText$() }}</div>\n  }\n\n  <div class=\"cx-pagination__controls\">\n    <div class=\"cx-pagination__navigation\">\n      <cx-icon-button\n        icon=\"chevron-left\"\n        ariaLabel=\"Previous page\" variant=\"transparent\"\n        [disabled]=\"previousDisabled$()\"\n        (pressed)=\"goToPreviousPage()\"\n      />\n      <div class=\"cx-pagination__pages\">\n        @for (item of pageItems$(); track item.id) {\n          @if (item.kind === 'page') {\n            @if (item.current) {\n              <div class=\"cx-pagination__page-button cx-pagination__page-button--current\">\n                {{ item.label }}\n              </div>\n            } @else {\n              <button type=\"button\" class=\"cx-pagination__page-button\" (click)=\"goToPage(item.page)\">\n                {{ item.label }}\n              </button>\n            }\n          } @else {\n            <span class=\"cx-pagination__ellipsis\" aria-hidden=\"true\">{{ item.label }}</span>\n          }\n        }\n      </div>\n      <cx-icon-button\n        icon=\"chevron-right\"\n        ariaLabel=\"Next page\" variant=\"transparent\"\n        [disabled]=\"nextDisabled$()\"\n        (pressed)=\"goToNextPage()\"\n      />\n    </div>\n\n    <div class=\"cx-pagination__page-size\">\n      <span class=\"cx-pagination__page-size-label\">Results per page</span>\n      <cx-dropdown\n        class=\"cx-pagination__page-size-select\"\n        label=\"\"\n        ariaLabel=\"Page size\"\n        placeholder=\"Select page size\"\n        size=\"small\"\n        [availableValues]=\"pageSizeOptions$()\"\n        [value]=\"pageSizeValue$()\"\n        (valueChange)=\"onPageSizeChange($event)\"\n      />\n    </div>\n  </div>\n</nav>\n", styles: [":host{display:inline-block;max-width:100%}.cx-pagination{display:flex;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-lg);user-select:none}.cx-pagination__summary{flex:0 0 auto;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);white-space:nowrap}.cx-pagination__controls{display:inline-flex;min-width:0;align-items:center;justify-content:flex-end;gap:var(--space-lg)}.cx-pagination__page-size,.cx-pagination__navigation{display:inline-flex;align-items:center;gap:var(--space-sm)}.cx-pagination__page-size-label{color:var(--opacity-high);font-size:var(--font-size-body);line-height:var(--line-height-body);white-space:nowrap}.cx-pagination__page-size-select{min-width:0;width:auto}.cx-pagination__navigation{flex-wrap:wrap;justify-content:flex-end}.cx-pagination__pages{display:inline-flex;align-items:center;gap:var(--space-sm)}.cx-pagination__page-button,.cx-pagination__ellipsis{display:inline-flex;min-width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1;white-space:nowrap}.cx-pagination__page-button{padding:0 var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);cursor:pointer;font-family:inherit;transition:background var(--motion-fast) ease,color var(--motion-fast) ease}.cx-pagination__page-button:hover:not(:disabled),.cx-pagination__page-button:focus-visible{background:var(--opacity-low);color:var(--ink);outline:0}.cx-pagination__page-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-pagination__page-button:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-pagination__page-button:disabled{cursor:default}.cx-pagination__page-button--current{color:var(--ink);font-weight:var(--font-weight-bold);cursor:default;pointer-events:none}.cx-pagination__ellipsis{min-width:auto;color:var(--opacity-high)}@media(max-width: 640px){.cx-pagination{align-items:flex-start;flex-direction:column}.cx-pagination__controls{width:100%;align-items:flex-start;flex-direction:column}.cx-pagination__navigation{justify-content:flex-start}}"] }]
        }], propDecorators: { page: [{
                type: Input
            }], pageSizes: [{
                type: Input
            }], totalMode: [{
                type: Input
            }], pageChange: [{
                type: Output
            }] } });
