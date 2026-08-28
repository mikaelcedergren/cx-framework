import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
function normalizeTreeItems(items, seenIds = new Set()) {
    if (!Array.isArray(items)) {
        throw new Error('[cx-tree-view] items must be an array.');
    }
    return items.map(item => {
        const id = item.id?.trim();
        if (!id) {
            throw new Error('[cx-tree-view] every item requires a non-empty id.');
        }
        if (seenIds.has(id)) {
            throw new Error(`[cx-tree-view] item ids must be unique; received "${id}" more than once.`);
        }
        seenIds.add(id);
        return {
            ...item,
            id,
            label: item.label.trim(),
            children: item.children ? normalizeTreeItems(item.children, seenIds) : undefined,
        };
    });
}
export class CxTreeViewComponent {
    itemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemsState" }] : /* istanbul ignore next */ []));
    selectedIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdState" }] : /* istanbul ignore next */ []));
    expandedIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expandedIdsState" }] : /* istanbul ignore next */ []));
    densityState = signal('comfortable', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "densityState" }] : /* istanbul ignore next */ []));
    selectableState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectableState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    showIconsState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showIconsState" }] : /* istanbul ignore next */ []));
    set density(value) {
        this.densityState.set(value ?? 'comfortable');
    }
    set selectable(value) {
        this.selectableState.set(value !== false);
    }
    set disabled(value) {
        this.disabledState.set(value === true);
    }
    set showIcons(value) {
        this.showIconsState.set(value !== false);
    }
    set items(value) {
        this.itemsState.set(normalizeTreeItems(value ?? []));
    }
    set selectedId(value) {
        this.selectedIdState.set(value);
    }
    set expandedIds(value) {
        this.expandedIdsState.set(value ?? []);
    }
    selectedIdChange = new EventEmitter();
    expandedIdsChange = new EventEmitter();
    items$ = this.itemsState.asReadonly();
    selectedId$ = this.selectedIdState.asReadonly();
    expandedIds$ = this.expandedIdsState.asReadonly();
    density$ = this.densityState.asReadonly();
    selectable$ = this.selectableState.asReadonly();
    disabled$ = this.disabledState.asReadonly();
    showIcons$ = this.showIconsState.asReadonly();
    hasChildren(item) {
        return (item.children?.length ?? 0) > 0;
    }
    isExpanded(item) {
        return this.expandedIdsState().includes(item.id);
    }
    onToggle(item) {
        if (!this.hasChildren(item) || this.disabledState() || item.disabled) {
            return;
        }
        const expanded = this.expandedIdsState();
        const next = expanded.includes(item.id)
            ? expanded.filter(id => id !== item.id)
            : [...expanded, item.id];
        this.expandedIdsState.set(next);
        this.expandedIdsChange.emit(next);
    }
    onSelect(item) {
        if (!this.selectableState() || this.disabledState() || item.disabled) {
            return;
        }
        this.selectedIdState.set(item.id);
        this.selectedIdChange.emit(item.id);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTreeViewComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTreeViewComponent, isStandalone: true, selector: "cx-tree-view", inputs: { density: "density", selectable: "selectable", disabled: "disabled", showIcons: "showIcons", items: "items", selectedId: "selectedId", expandedIds: "expandedIds" }, outputs: { selectedIdChange: "selectedIdChange", expandedIdsChange: "expandedIdsChange" }, ngImport: i0, template: "<ng-template #tree let-items>\n  <ul class=\"cx-tree-view__list\" role=\"group\">\n    @for (item of items; track item.id) {\n      <li\n        class=\"cx-tree-view__node\"\n        role=\"treeitem\"\n        [attr.aria-expanded]=\"hasChildren(item) ? isExpanded(item) : null\"\n      >\n        <div\n          class=\"cx-tree-view__row\"\n          [class.cx-tree-view__row--selected]=\"selectedId$() === item.id\"\n          [class.cx-tree-view__row--disabled]=\"disabled$() || item.disabled === true\"\n        >\n          @if (hasChildren(item)) {\n            <button\n              type=\"button\"\n              class=\"cx-tree-view__expander\"\n              [disabled]=\"disabled$() || item.disabled === true\"\n              [attr.aria-label]=\"isExpanded(item) ? 'Collapse' : 'Expand'\"\n              (click)=\"onToggle(item)\"\n            >\n              <cx-icon [icon]=\"isExpanded(item) ? 'chevron-down' : 'chevron-right'\" [size]=\"14\" />\n            </button>\n          } @else {\n            <span class=\"cx-tree-view__expander-space\"></span>\n          }\n\n          <button\n            type=\"button\"\n            class=\"cx-tree-view__label-button\"\n            [disabled]=\"disabled$() || item.disabled === true || !selectable$()\"\n            [attr.aria-current]=\"selectedId$() === item.id ? 'true' : null\"\n            [cxTooltip]=\"item.label\"\n            [cxTooltipOverflow]=\"true\"\n            (click)=\"onSelect(item)\"\n          >\n            @if (showIcons$() && item.icon) {\n              <cx-icon class=\"cx-tree-view__icon\" [icon]=\"item.icon\" [size]=\"16\" />\n            }\n            <span class=\"cx-tree-view__label\" data-cx-tooltip-overflow>{{ item.label }}</span>\n          </button>\n        </div>\n\n        @if (hasChildren(item) && isExpanded(item)) {\n          <ng-container [ngTemplateOutlet]=\"tree\" [ngTemplateOutletContext]=\"{ $implicit: item.children }\" />\n        }\n      </li>\n    }\n  </ul>\n</ng-template>\n\n@if (items$().length > 0) {\n<div\n  class=\"cx-tree-view\"\n  [class.cx-tree-view--compact]=\"density$() === 'compact'\"\n  [class.cx-tree-view--disabled]=\"disabled$()\"\n  role=\"tree\"\n>\n  <ng-container [ngTemplateOutlet]=\"tree\" [ngTemplateOutletContext]=\"{ $implicit: items$() }\" />\n</div>\n}\n", styles: [":host{display:block;min-width:0}.cx-tree-view{min-width:0;color:var(--ink)}.cx-tree-view__list{display:flex;min-width:0;flex-direction:column;gap:var(--space-2xs);margin:0;padding:0;list-style:none}.cx-tree-view__list .cx-tree-view__list{margin-block-start:var(--space-2xs);margin-inline-start:var(--space-md)}.cx-tree-view__row{display:grid;min-width:0;grid-template-columns:var(--controller-size-small) minmax(0, 1fr);align-items:center;border-radius:var(--radius-xs)}.cx-tree-view__row:hover:not(.cx-tree-view__row--disabled){background:var(--opacity-low)}.cx-tree-view__row--selected{background:var(--primary-opacity)}.cx-tree-view__expander,.cx-tree-view__label-button{border:0;background:rgba(0,0,0,0);color:inherit;font:inherit}.cx-tree-view__expander{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;cursor:pointer}.cx-tree-view__expander-space{width:var(--controller-size-small);height:var(--controller-size-small)}.cx-tree-view__label-button{display:flex;min-width:0;align-items:center;gap:var(--space-sm);padding:var(--space-sm);cursor:pointer;text-align:start}.cx-tree-view--compact .cx-tree-view__label-button{padding:var(--space-xs) var(--space-sm)}.cx-tree-view__icon{flex:0 0 auto;color:var(--opacity-high)}.cx-tree-view__label{overflow:hidden;color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-tree-view__expander:focus-visible,.cx-tree-view__label-button:focus-visible{outline:var(--outline-tab);outline-offset:calc(var(--outline-tab-offset)*-1)}.cx-tree-view__row--disabled,.cx-tree-view--disabled{opacity:var(--opacity-disabled, 0.45)}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTreeViewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-tree-view', imports: [NgTemplateOutlet, CxIconComponent, CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<ng-template #tree let-items>\n  <ul class=\"cx-tree-view__list\" role=\"group\">\n    @for (item of items; track item.id) {\n      <li\n        class=\"cx-tree-view__node\"\n        role=\"treeitem\"\n        [attr.aria-expanded]=\"hasChildren(item) ? isExpanded(item) : null\"\n      >\n        <div\n          class=\"cx-tree-view__row\"\n          [class.cx-tree-view__row--selected]=\"selectedId$() === item.id\"\n          [class.cx-tree-view__row--disabled]=\"disabled$() || item.disabled === true\"\n        >\n          @if (hasChildren(item)) {\n            <button\n              type=\"button\"\n              class=\"cx-tree-view__expander\"\n              [disabled]=\"disabled$() || item.disabled === true\"\n              [attr.aria-label]=\"isExpanded(item) ? 'Collapse' : 'Expand'\"\n              (click)=\"onToggle(item)\"\n            >\n              <cx-icon [icon]=\"isExpanded(item) ? 'chevron-down' : 'chevron-right'\" [size]=\"14\" />\n            </button>\n          } @else {\n            <span class=\"cx-tree-view__expander-space\"></span>\n          }\n\n          <button\n            type=\"button\"\n            class=\"cx-tree-view__label-button\"\n            [disabled]=\"disabled$() || item.disabled === true || !selectable$()\"\n            [attr.aria-current]=\"selectedId$() === item.id ? 'true' : null\"\n            [cxTooltip]=\"item.label\"\n            [cxTooltipOverflow]=\"true\"\n            (click)=\"onSelect(item)\"\n          >\n            @if (showIcons$() && item.icon) {\n              <cx-icon class=\"cx-tree-view__icon\" [icon]=\"item.icon\" [size]=\"16\" />\n            }\n            <span class=\"cx-tree-view__label\" data-cx-tooltip-overflow>{{ item.label }}</span>\n          </button>\n        </div>\n\n        @if (hasChildren(item) && isExpanded(item)) {\n          <ng-container [ngTemplateOutlet]=\"tree\" [ngTemplateOutletContext]=\"{ $implicit: item.children }\" />\n        }\n      </li>\n    }\n  </ul>\n</ng-template>\n\n@if (items$().length > 0) {\n<div\n  class=\"cx-tree-view\"\n  [class.cx-tree-view--compact]=\"density$() === 'compact'\"\n  [class.cx-tree-view--disabled]=\"disabled$()\"\n  role=\"tree\"\n>\n  <ng-container [ngTemplateOutlet]=\"tree\" [ngTemplateOutletContext]=\"{ $implicit: items$() }\" />\n</div>\n}\n", styles: [":host{display:block;min-width:0}.cx-tree-view{min-width:0;color:var(--ink)}.cx-tree-view__list{display:flex;min-width:0;flex-direction:column;gap:var(--space-2xs);margin:0;padding:0;list-style:none}.cx-tree-view__list .cx-tree-view__list{margin-block-start:var(--space-2xs);margin-inline-start:var(--space-md)}.cx-tree-view__row{display:grid;min-width:0;grid-template-columns:var(--controller-size-small) minmax(0, 1fr);align-items:center;border-radius:var(--radius-xs)}.cx-tree-view__row:hover:not(.cx-tree-view__row--disabled){background:var(--opacity-low)}.cx-tree-view__row--selected{background:var(--primary-opacity)}.cx-tree-view__expander,.cx-tree-view__label-button{border:0;background:rgba(0,0,0,0);color:inherit;font:inherit}.cx-tree-view__expander{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center;cursor:pointer}.cx-tree-view__expander-space{width:var(--controller-size-small);height:var(--controller-size-small)}.cx-tree-view__label-button{display:flex;min-width:0;align-items:center;gap:var(--space-sm);padding:var(--space-sm);cursor:pointer;text-align:start}.cx-tree-view--compact .cx-tree-view__label-button{padding:var(--space-xs) var(--space-sm)}.cx-tree-view__icon{flex:0 0 auto;color:var(--opacity-high)}.cx-tree-view__label{overflow:hidden;color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-tree-view__expander:focus-visible,.cx-tree-view__label-button:focus-visible{outline:var(--outline-tab);outline-offset:calc(var(--outline-tab-offset)*-1)}.cx-tree-view__row--disabled,.cx-tree-view--disabled{opacity:var(--opacity-disabled, 0.45)}"] }]
        }], propDecorators: { density: [{
                type: Input
            }], selectable: [{
                type: Input
            }], disabled: [{
                type: Input
            }], showIcons: [{
                type: Input
            }], items: [{
                type: Input
            }], selectedId: [{
                type: Input
            }], expandedIds: [{
                type: Input
            }], selectedIdChange: [{
                type: Output
            }], expandedIdsChange: [{
                type: Output
            }] } });
