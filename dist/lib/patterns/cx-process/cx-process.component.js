import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewChildren, booleanAttribute, computed, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxProcessPillComponent, } from '../../primitives/display/cx-process-pill/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
const ALL_TAB_KEY = '__all__';
/**
 * A prominent, full-row quick filter that doubles as a progress rail: it leads
 * the user through an ordered lifecycle whose goal is an empty backlog. Each
 * stage is a `cx-process-pill`; selecting one filters the view behind it.
 *
 * Unlike a plain filter, the rail understands "done": when every open
 * (non-terminal) stage reaches `0`, it resolves into an explicit all-clear
 * state instead of a row of zeros. What the user may reconfigure is decided by
 * the host via `editable`, not by the user freely.
 */
export class CxProcessComponent {
    tabRefs;
    rowRef;
    condensedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "condensedState" }] : /* istanbul ignore next */ []));
    resizeObserver;
    animationFrameId;
    // Smallest row width at which the full labels last fit; we only restore them once there is at least this much room again, so the layout cannot oscillate.
    expandWidth = Number.POSITIVE_INFINITY;
    stagesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stagesState" }] : /* istanbul ignore next */ []));
    selectedIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdState" }] : /* istanbul ignore next */ []));
    showAllState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showAllState" }] : /* istanbul ignore next */ []));
    allLabelState = signal('All', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "allLabelState" }] : /* istanbul ignore next */ []));
    allClearLabelState = signal('All clear', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "allClearLabelState" }] : /* istanbul ignore next */ []));
    editableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "editableState" }] : /* istanbul ignore next */ []));
    ariaLabelState = signal('Process stages', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabelState" }] : /* istanbul ignore next */ []));
    /** The ordered lifecycle stages, left (open) to right (terminal). */
    set stages(value) {
        const ids = new Set();
        const stages = (value ?? []).map(stage => {
            const id = stage.id?.trim();
            const label = stage.label?.trim();
            if (!id || !label) {
                throw new Error('[cx-process] every stage requires a visible label and non-empty id.');
            }
            if (ids.has(id)) {
                throw new Error(`[cx-process] stage ids must be unique; received "${id}" more than once.`);
            }
            if (stage.count !== undefined && (!Number.isInteger(stage.count) || stage.count < 0)) {
                throw new Error(`[cx-process] stage "${id}" count must be a non-negative integer when supplied.`);
            }
            ids.add(id);
            return { ...stage, id, label };
        });
        this.stagesState.set(stages);
        this.scheduleMeasure();
    }
    /** Currently selected stage id; `undefined` selects the leading "all" tab. Two-way bindable. */
    set selectedId(value) {
        this.selectedIdState.set(value);
    }
    /** Render a leading tab that clears the stage filter. Defaults to `true`. */
    set showAll(value) {
        this.showAllState.set(value);
    }
    /** Label for the leading "all" tab. */
    set allLabel(value) {
        this.allLabelState.set(value?.trim() || 'All');
    }
    /** Label the leading tab adopts once there is nothing left to handle. */
    set allClearLabel(value) {
        this.allClearLabelState.set(value?.trim() || 'All clear');
    }
    /** When true, reveal a customise affordance on hover/focus that emits `customize`. */
    set editable(value) {
        this.editableState.set(value);
    }
    /** Accessible name for the tablist. */
    set ariaLabel(value) {
        this.ariaLabelState.set(value?.trim() || 'Process stages');
    }
    selectedIdChange = new EventEmitter();
    customize = new EventEmitter();
    editable$ = this.editableState.asReadonly();
    ariaLabel$ = this.ariaLabelState.asReadonly();
    condensed$ = this.condensedState.asReadonly();
    hasLifecycle$ = computed(() => {
        const stages = this.stagesState();
        return stages.some(stage => stage.terminal) && stages.some(stage => !stage.terminal);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasLifecycle$" }] : /* istanbul ignore next */ []));
    /** True when there is a real lifecycle and every open stage is known to be empty. */
    isClear$ = computed(() => {
        if (!this.hasLifecycle$()) {
            return false;
        }
        const open = this.stagesState().filter(stage => !stage.terminal);
        return open.length > 0 && open.every(stage => stage.count === 0);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isClear$" }] : /* istanbul ignore next */ []));
    total$ = computed(() => {
        const counts = this.stagesState()
            .map(stage => stage.count)
            .filter((count) => typeof count === 'number');
        return counts.length ? counts.reduce((sum, count) => sum + count, 0) : undefined;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "total$" }] : /* istanbul ignore next */ []));
    tabs$ = computed(() => {
        const stages = this.stagesState();
        if (stages.length === 0) {
            return [];
        }
        const selected = this.selectedIdState();
        const clear = this.isClear$();
        const tabs = [];
        if (this.showAllState()) {
            const allLabel = clear ? this.allClearLabelState() : this.allLabelState();
            tabs.push({
                key: ALL_TAB_KEY,
                id: undefined,
                label: allLabel,
                ariaLabel: clear ? allLabel : this.labelWithCount(allLabel, this.total$()),
                count: clear ? undefined : this.total$(),
                mood: clear ? 'success' : 'default',
                icon: clear ? 'check' : undefined,
                terminal: false,
                open: false,
                muted: false,
                disabled: false,
                selected: selected === undefined,
                dividerBefore: false,
            });
        }
        const firstTerminalId = stages.find(stage => stage.terminal)?.id;
        const hasOpen = stages.some(stage => !stage.terminal);
        for (const stage of stages) {
            const open = !stage.terminal;
            tabs.push({
                key: stage.id,
                id: stage.id,
                label: stage.label,
                ariaLabel: this.labelWithCount(stage.label, stage.count),
                count: stage.count,
                mood: stage.mood ?? 'default',
                icon: stage.icon,
                terminal: !!stage.terminal,
                open,
                muted: clear && open,
                disabled: !!stage.disabled,
                selected: selected === stage.id,
                dividerBefore: hasOpen && stage.id === firstTerminalId,
            });
        }
        return tabs;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tabs$" }] : /* istanbul ignore next */ []));
    /** Index of the single tab that holds the roving tab stop. */
    focusIndex$ = computed(() => {
        const tabs = this.tabs$();
        const selected = tabs.findIndex(tab => tab.selected);
        return selected >= 0 ? selected : tabs.findIndex(tab => !tab.disabled);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusIndex$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
        if (this.rowRef) {
            this.resizeObserver.observe(this.rowRef.nativeElement);
        }
        this.scheduleMeasure();
    }
    ngOnDestroy() {
        if (this.animationFrameId !== undefined && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.resizeObserver?.disconnect();
    }
    scheduleMeasure() {
        if (typeof requestAnimationFrame === 'undefined') {
            this.measure();
            return;
        }
        if (this.animationFrameId !== undefined) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.animationFrameId = undefined;
            this.measure();
        });
    }
    // Drop to icon + count when the labelled row would overflow, before falling
    // back to horizontal scrolling — and never wrap to a second row. Hysteresis on
    // `expandWidth` keeps the toggle from oscillating frame to frame.
    measure() {
        const row = this.rowRef?.nativeElement;
        if (!row) {
            return;
        }
        if (!this.condensedState()) {
            if (row.scrollWidth > row.clientWidth + 1) {
                this.expandWidth = row.scrollWidth;
                this.condensedState.set(true);
            }
        }
        else if (row.clientWidth >= this.expandWidth) {
            this.condensedState.set(false);
        }
    }
    select(tab) {
        if (tab.disabled || tab.selected) {
            return;
        }
        this.selectedIdState.set(tab.id);
        this.selectedIdChange.emit(tab.id);
    }
    onKeydown(event, index) {
        const navigationKeys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Enter'];
        if (!navigationKeys.includes(event.key)) {
            return;
        }
        event.preventDefault();
        const tabs = this.tabs$();
        if (event.key === ' ' || event.key === 'Enter') {
            const tab = tabs[index];
            if (tab) {
                this.select(tab);
            }
            return;
        }
        const maxIndex = tabs.length - 1;
        if (maxIndex < 0) {
            return;
        }
        let nextIndex = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = this.nextEnabledIndex(tabs, index, 1);
        }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = this.nextEnabledIndex(tabs, index, -1);
        }
        else if (event.key === 'Home') {
            nextIndex = this.nextEnabledIndex(tabs, maxIndex, 1);
        }
        else if (event.key === 'End') {
            nextIndex = this.nextEnabledIndex(tabs, 0, -1);
        }
        const nextTab = tabs[nextIndex];
        if (!nextTab || nextTab.disabled) {
            return;
        }
        this.select(nextTab);
        this.tabRefs?.get(nextIndex)?.nativeElement.focus();
    }
    nextEnabledIndex(tabs, from, direction) {
        const maxIndex = tabs.length - 1;
        let index = from;
        for (let step = 0; step <= maxIndex; step++) {
            index = direction === 1 ? (index >= maxIndex ? 0 : index + 1) : index <= 0 ? maxIndex : index - 1;
            if (!tabs[index]?.disabled) {
                return index;
            }
        }
        return from;
    }
    labelWithCount(label, count) {
        return typeof count === 'number' ? `${label}, ${count}` : label;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxProcessComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxProcessComponent, isStandalone: true, selector: "cx-process", inputs: { stages: "stages", selectedId: "selectedId", showAll: ["showAll", "showAll", booleanAttribute], allLabel: "allLabel", allClearLabel: "allClearLabel", editable: ["editable", "editable", booleanAttribute], ariaLabel: "ariaLabel" }, outputs: { selectedIdChange: "selectedIdChange", customize: "customize" }, viewQueries: [{ propertyName: "rowRef", first: true, predicate: ["rowRef"], descendants: true }, { propertyName: "tabRefs", predicate: ["tabRef"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (tabs$().length > 0) {\n<div\n  class=\"cx-process\"\n  [class.cx-process--clear]=\"isClear$()\"\n  [class.cx-process--editable]=\"editable$()\"\n>\n  <div #rowRef class=\"cx-process__row\" role=\"tablist\" [attr.aria-label]=\"ariaLabel$()\">\n    @for (tab of tabs$(); track tab.key; let i = $index) {\n      @if (tab.dividerBefore) {\n        <span class=\"cx-process__divider\" aria-hidden=\"true\"></span>\n      }\n\n      <button\n        #tabRef\n        type=\"button\"\n        role=\"tab\"\n        class=\"cx-process__tab\"\n        [class.cx-process__tab--open]=\"tab.open\"\n        [class.cx-process__tab--terminal]=\"tab.terminal\"\n        [attr.aria-selected]=\"tab.selected\"\n        [attr.aria-label]=\"tab.ariaLabel\"\n        [cxTooltip]=\"condensed$() ? tab.label : undefined\"\n        [disabled]=\"tab.disabled\"\n        [attr.tabindex]=\"i === focusIndex$() ? '0' : '-1'\"\n        (click)=\"select(tab)\"\n        (keydown)=\"onKeydown($event, i)\"\n      >\n        <cx-process-pill\n          [label]=\"tab.label\"\n          [count]=\"tab.count\"\n          [mood]=\"tab.mood\"\n          [icon]=\"tab.icon\"\n          [selected]=\"tab.selected\"\n          [terminal]=\"tab.terminal\"\n          [muted]=\"tab.muted\"\n          [disabled]=\"tab.disabled\"\n          [dense]=\"condensed$()\"\n        />\n      </button>\n    }\n  </div>\n\n  @if (editable$()) {\n    <cx-icon-button\n      class=\"cx-process__edit\"\n      icon=\"settings\"\n      variant=\"transparent\"\n      size=\"small\"\n      ariaLabel=\"Customise stages\"\n      (pressed)=\"customize.emit()\"\n    />\n  }\n</div>\n}\n", styles: [":host{display:block;width:100%}.cx-process{display:flex;min-height:var(--controller-size);align-items:center;gap:var(--space-xs)}.cx-process__row{display:flex;flex:1 1 auto;min-width:0;align-items:center;gap:var(--space-2xs);flex-wrap:nowrap;overflow-x:auto;scrollbar-width:thin}.cx-process__row::-webkit-scrollbar{height:var(--space-xs)}.cx-process__row::-webkit-scrollbar-thumb{border-radius:var(--radius-pill, 999px);corner-shape:round;background:var(--opacity-mid)}.cx-process__tab{display:inline-flex;flex:0 0 auto;align-items:center;margin:0;padding:0;border:0;border-radius:var(--radius-pill, 999px);corner-shape:round;background:rgba(0,0,0,0);color:inherit;cursor:pointer;font:inherit;outline:none}.cx-process__tab:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-process__tab:disabled{cursor:default}.cx-process__divider{flex:0 0 auto;align-self:center;width:var(--border-width, 1px);height:var(--space-md);margin-inline:var(--space-2xs);background:var(--opacity-mid)}.cx-process__edit{flex:0 0 auto;opacity:0;transform:scale(0.92);pointer-events:none;transition:opacity var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-process--editable:hover .cx-process__edit,.cx-process--editable:focus-within .cx-process__edit{opacity:1;transform:none;pointer-events:auto}@media(prefers-reduced-motion: reduce){.cx-process__edit{transition:none}}"], dependencies: [{ kind: "component", type: CxProcessPillComponent, selector: "cx-process-pill", inputs: ["label", "count", "mood", "icon", "selected", "terminal", "muted", "disabled", "dense"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxProcessComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-process', imports: [CxProcessPillComponent, CxIconButtonComponent, CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (tabs$().length > 0) {\n<div\n  class=\"cx-process\"\n  [class.cx-process--clear]=\"isClear$()\"\n  [class.cx-process--editable]=\"editable$()\"\n>\n  <div #rowRef class=\"cx-process__row\" role=\"tablist\" [attr.aria-label]=\"ariaLabel$()\">\n    @for (tab of tabs$(); track tab.key; let i = $index) {\n      @if (tab.dividerBefore) {\n        <span class=\"cx-process__divider\" aria-hidden=\"true\"></span>\n      }\n\n      <button\n        #tabRef\n        type=\"button\"\n        role=\"tab\"\n        class=\"cx-process__tab\"\n        [class.cx-process__tab--open]=\"tab.open\"\n        [class.cx-process__tab--terminal]=\"tab.terminal\"\n        [attr.aria-selected]=\"tab.selected\"\n        [attr.aria-label]=\"tab.ariaLabel\"\n        [cxTooltip]=\"condensed$() ? tab.label : undefined\"\n        [disabled]=\"tab.disabled\"\n        [attr.tabindex]=\"i === focusIndex$() ? '0' : '-1'\"\n        (click)=\"select(tab)\"\n        (keydown)=\"onKeydown($event, i)\"\n      >\n        <cx-process-pill\n          [label]=\"tab.label\"\n          [count]=\"tab.count\"\n          [mood]=\"tab.mood\"\n          [icon]=\"tab.icon\"\n          [selected]=\"tab.selected\"\n          [terminal]=\"tab.terminal\"\n          [muted]=\"tab.muted\"\n          [disabled]=\"tab.disabled\"\n          [dense]=\"condensed$()\"\n        />\n      </button>\n    }\n  </div>\n\n  @if (editable$()) {\n    <cx-icon-button\n      class=\"cx-process__edit\"\n      icon=\"settings\"\n      variant=\"transparent\"\n      size=\"small\"\n      ariaLabel=\"Customise stages\"\n      (pressed)=\"customize.emit()\"\n    />\n  }\n</div>\n}\n", styles: [":host{display:block;width:100%}.cx-process{display:flex;min-height:var(--controller-size);align-items:center;gap:var(--space-xs)}.cx-process__row{display:flex;flex:1 1 auto;min-width:0;align-items:center;gap:var(--space-2xs);flex-wrap:nowrap;overflow-x:auto;scrollbar-width:thin}.cx-process__row::-webkit-scrollbar{height:var(--space-xs)}.cx-process__row::-webkit-scrollbar-thumb{border-radius:var(--radius-pill, 999px);corner-shape:round;background:var(--opacity-mid)}.cx-process__tab{display:inline-flex;flex:0 0 auto;align-items:center;margin:0;padding:0;border:0;border-radius:var(--radius-pill, 999px);corner-shape:round;background:rgba(0,0,0,0);color:inherit;cursor:pointer;font:inherit;outline:none}.cx-process__tab:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-process__tab:disabled{cursor:default}.cx-process__divider{flex:0 0 auto;align-self:center;width:var(--border-width, 1px);height:var(--space-md);margin-inline:var(--space-2xs);background:var(--opacity-mid)}.cx-process__edit{flex:0 0 auto;opacity:0;transform:scale(0.92);pointer-events:none;transition:opacity var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-process--editable:hover .cx-process__edit,.cx-process--editable:focus-within .cx-process__edit{opacity:1;transform:none;pointer-events:auto}@media(prefers-reduced-motion: reduce){.cx-process__edit{transition:none}}"] }]
        }], propDecorators: { tabRefs: [{
                type: ViewChildren,
                args: ['tabRef', { read: ElementRef }]
            }], rowRef: [{
                type: ViewChild,
                args: ['rowRef']
            }], stages: [{
                type: Input
            }], selectedId: [{
                type: Input
            }], showAll: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], allLabel: [{
                type: Input
            }], allClearLabel: [{
                type: Input
            }], editable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], ariaLabel: [{
                type: Input
            }], selectedIdChange: [{
                type: Output
            }], customize: [{
                type: Output
            }] } });
