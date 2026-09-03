import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Input, afterRenderEffect, computed, inject, signal, } from '@angular/core';
import { CxTagComponent } from '../../display/cx-tag/index.js';
import * as i0 from "@angular/core";
export class CxTableTagsCellComponent {
    host = inject(ElementRef);
    tagsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagsState" }] : /* istanbul ignore next */ []));
    visibleCountState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleCountState" }] : /* istanbul ignore next */ []));
    resizeObserver;
    measurementFrame;
    set tags(value) {
        this.tagsState.set(value ?? []);
    }
    tags$ = this.tagsState.asReadonly();
    visibleTags$ = computed(() => this.tagsState().slice(0, this.visibleCountState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleTags$" }] : /* istanbul ignore next */ []));
    hiddenTagCount$ = computed(() => Math.max(0, this.tagsState().length - this.visibleCountState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hiddenTagCount$" }] : /* istanbul ignore next */ []));
    hiddenTagCounts$ = computed(() => Array.from({ length: this.tagsState().length }, (_, index) => index + 1), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hiddenTagCounts$" }] : /* istanbul ignore next */ []));
    ariaLabel$ = computed(() => this.tagsState()
        .map(tag => tag.label.trim())
        .filter(Boolean)
        .join(', '), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabel$" }] : /* istanbul ignore next */ []));
    constructor() {
        const destroyRef = inject(DestroyRef);
        afterRenderEffect(() => {
            this.tagsState();
            this.scheduleMeasurement();
        });
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.scheduleMeasurement());
            this.resizeObserver.observe(this.host.nativeElement);
        }
        destroyRef.onDestroy(() => {
            this.resizeObserver?.disconnect();
            if (this.measurementFrame !== undefined) {
                cancelAnimationFrame(this.measurementFrame);
            }
        });
    }
    scheduleMeasurement() {
        if (typeof requestAnimationFrame === 'undefined') {
            return;
        }
        if (this.measurementFrame !== undefined) {
            cancelAnimationFrame(this.measurementFrame);
        }
        this.measurementFrame = requestAnimationFrame(() => {
            this.measurementFrame = undefined;
            this.measureVisibleTags();
        });
    }
    measureVisibleTags() {
        const root = this.host.nativeElement.querySelector('.cx-table-tags');
        const visible = this.host.nativeElement.querySelector('.cx-table-tags__visible');
        const measuredTags = Array.from(this.host.nativeElement.querySelectorAll('.cx-table-tags__measure-tag'));
        const measuredOverflowTags = Array.from(this.host.nativeElement.querySelectorAll('.cx-table-tags__measure-overflow'));
        const tagCount = this.tagsState().length;
        if (!root || !visible || measuredTags.length !== tagCount) {
            return;
        }
        if (tagCount === 0) {
            this.visibleCountState.set(0);
            return;
        }
        const availableWidth = root.clientWidth;
        if (availableWidth <= 0) {
            this.visibleCountState.set(0);
            return;
        }
        const gap = Number.parseFloat(getComputedStyle(visible).columnGap) || 0;
        const tagWidths = measuredTags.map(tag => tag.getBoundingClientRect().width);
        const completeWidth = tagWidths.reduce((sum, width) => sum + width, 0) +
            gap * Math.max(0, tagCount - 1);
        if (completeWidth <= availableWidth + 0.5) {
            this.visibleCountState.set(tagCount);
            return;
        }
        const overflowWidths = new Map(measuredOverflowTags.map(tag => [
            Number.parseInt(tag.dataset['hiddenCount'] ?? '', 10),
            tag.getBoundingClientRect().width,
        ]));
        let visibleWidth = 0;
        let nextVisibleCount = 0;
        for (let visibleCount = 0; visibleCount < tagCount; visibleCount += 1) {
            if (visibleCount > 0) {
                visibleWidth += tagWidths[visibleCount - 1] + gap;
            }
            const hiddenCount = tagCount - visibleCount;
            const overflowWidth = overflowWidths.get(hiddenCount);
            if (overflowWidth !== undefined &&
                visibleWidth + overflowWidth <= availableWidth + 0.5) {
                nextVisibleCount = visibleCount;
            }
        }
        this.visibleCountState.set(nextVisibleCount);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableTagsCellComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTableTagsCellComponent, isStandalone: true, selector: "cx-table-tags-cell", inputs: { tags: "tags" }, ngImport: i0, template: "<div\n  class=\"cx-table-tags\"\n  role=\"group\"\n  [attr.aria-label]=\"ariaLabel$() || null\"\n>\n  <div class=\"cx-table-tags__visible\" aria-hidden=\"true\">\n    @for (tag of visibleTags$(); track $index) {\n      <cx-tag\n        [text]=\"tag.label\"\n        [color]=\"tag.color ?? 'default'\"\n        [outline]=\"tag.outline ?? false\"\n      />\n    }\n    @if (hiddenTagCount$() > 0) {\n      <cx-tag\n        class=\"cx-table-tags__overflow\"\n        [text]=\"'+' + hiddenTagCount$()\"\n      />\n    }\n  </div>\n\n  <div class=\"cx-table-tags__measure\" aria-hidden=\"true\">\n    @for (tag of tags$(); track $index) {\n      <cx-tag\n        class=\"cx-table-tags__measure-tag\"\n        [text]=\"tag.label\"\n        [color]=\"tag.color ?? 'default'\"\n        [outline]=\"tag.outline ?? false\"\n      />\n    }\n    @for (hiddenCount of hiddenTagCounts$(); track hiddenCount) {\n      <cx-tag\n        class=\"cx-table-tags__measure-overflow\"\n        [attr.data-hidden-count]=\"hiddenCount\"\n        [text]=\"'+' + hiddenCount\"\n      />\n    }\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-table-tags{position:relative;width:100%;min-width:0}.cx-table-tags__visible,.cx-table-tags__measure{display:flex;align-items:center;gap:var(--space-xs)}.cx-table-tags__visible{width:100%;min-width:0;overflow:hidden}.cx-table-tags__visible>cx-tag,.cx-table-tags__measure>cx-tag{flex:0 0 auto}.cx-table-tags__measure{position:absolute;inset:0 auto auto 0;width:max-content;height:0;overflow:hidden;pointer-events:none;visibility:hidden}"], dependencies: [{ kind: "component", type: CxTagComponent, selector: "cx-tag", inputs: ["text", "icon", "color", "outline", "dismissible", "interactive", "ariaLabel", "expanded", "controls"], outputs: ["dismiss", "pressed"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTableTagsCellComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-table-tags-cell', imports: [CxTagComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-table-tags\"\n  role=\"group\"\n  [attr.aria-label]=\"ariaLabel$() || null\"\n>\n  <div class=\"cx-table-tags__visible\" aria-hidden=\"true\">\n    @for (tag of visibleTags$(); track $index) {\n      <cx-tag\n        [text]=\"tag.label\"\n        [color]=\"tag.color ?? 'default'\"\n        [outline]=\"tag.outline ?? false\"\n      />\n    }\n    @if (hiddenTagCount$() > 0) {\n      <cx-tag\n        class=\"cx-table-tags__overflow\"\n        [text]=\"'+' + hiddenTagCount$()\"\n      />\n    }\n  </div>\n\n  <div class=\"cx-table-tags__measure\" aria-hidden=\"true\">\n    @for (tag of tags$(); track $index) {\n      <cx-tag\n        class=\"cx-table-tags__measure-tag\"\n        [text]=\"tag.label\"\n        [color]=\"tag.color ?? 'default'\"\n        [outline]=\"tag.outline ?? false\"\n      />\n    }\n    @for (hiddenCount of hiddenTagCounts$(); track hiddenCount) {\n      <cx-tag\n        class=\"cx-table-tags__measure-overflow\"\n        [attr.data-hidden-count]=\"hiddenCount\"\n        [text]=\"'+' + hiddenCount\"\n      />\n    }\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-table-tags{position:relative;width:100%;min-width:0}.cx-table-tags__visible,.cx-table-tags__measure{display:flex;align-items:center;gap:var(--space-xs)}.cx-table-tags__visible{width:100%;min-width:0;overflow:hidden}.cx-table-tags__visible>cx-tag,.cx-table-tags__measure>cx-tag{flex:0 0 auto}.cx-table-tags__measure{position:absolute;inset:0 auto auto 0;width:max-content;height:0;overflow:hidden;pointer-events:none;visibility:hidden}"] }]
        }], ctorParameters: () => [], propDecorators: { tags: [{
                type: Input
            }] } });
