import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild, ViewChildren, computed, signal, } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
export class CxButtonGroupComponent {
    rowRef;
    buttonRefs;
    availableValuesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "availableValuesState" }] : /* istanbul ignore next */ []));
    valueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    sizeState = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sizeState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    fillState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fillState" }] : /* istanbul ignore next */ []));
    indicatorVisible$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorVisible$" }] : /* istanbul ignore next */ []));
    indicatorX$ = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorX$" }] : /* istanbul ignore next */ []));
    indicatorY$ = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorY$" }] : /* istanbul ignore next */ []));
    indicatorWidth$ = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorWidth$" }] : /* istanbul ignore next */ []));
    indicatorHeight$ = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indicatorHeight$" }] : /* istanbul ignore next */ []));
    buttonChangesSubscription;
    resizeObserver;
    animationFrameId;
    /** Accessible name for the single-choice group. */
    ariaLabel = 'Options';
    set availableValues(value) {
        this.availableValuesState.set(value ?? []);
        this.scheduleIndicatorRefresh();
    }
    set value(value) {
        this.valueState.set(value);
        this.scheduleIndicatorRefresh();
    }
    set size(value) {
        this.sizeState.set(value === 'small' ? 'small' : 'default');
        this.scheduleIndicatorRefresh();
    }
    set disabled(value) {
        this.disabledState.set(!!value);
    }
    /** Stretches the group to its container width, distributing buttons evenly. */
    set fill(value) {
        this.fillState.set(!!value);
        this.scheduleIndicatorRefresh();
    }
    valueChange = new EventEmitter();
    get disabledHostClass() {
        return this.disabledState();
    }
    get fillHostClass() {
        return this.fillState();
    }
    get indicatorX() {
        return `${this.indicatorX$()}px`;
    }
    get indicatorY() {
        return `${this.indicatorY$()}px`;
    }
    get indicatorWidth() {
        return `${this.indicatorWidth$()}px`;
    }
    get indicatorHeight() {
        return `${this.indicatorHeight$()}px`;
    }
    size$ = this.sizeState.asReadonly();
    disabled$ = this.disabledState.asReadonly();
    buttons$ = computed(() => this.availableValuesState().map(option => {
        const name = option.label?.trim() || option.id?.trim() || '';
        return {
            id: option.id,
            name,
            icon: option.icon,
            disabled: !!option.disabled,
            selected: option.id === this.valueState(),
        };
    }), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "buttons$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        this.buttonChangesSubscription = this.buttonRefs?.changes.subscribe(() => {
            this.observeIndicatorTargets();
            this.scheduleIndicatorRefresh();
        });
        this.observeIndicatorTargets();
        this.scheduleIndicatorRefresh();
    }
    ngOnDestroy() {
        this.buttonChangesSubscription?.unsubscribe();
        this.destroyIndicatorMeasurement();
    }
    select(event, option) {
        if (this.disabledState() || option.disabled || option.selected) {
            return;
        }
        event.stopPropagation();
        this.valueState.set(option.id);
        this.valueChange.emit(option.id);
        this.scheduleIndicatorRefresh();
    }
    onKeydown(event, index) {
        if (this.disabledState()) {
            return;
        }
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            return;
        }
        event.preventDefault();
        const buttons = this.buttons$();
        const enabledIndexes = buttons
            .map((button, buttonIndex) => button.disabled ? -1 : buttonIndex)
            .filter(buttonIndex => buttonIndex >= 0);
        if (enabledIndexes.length === 0) {
            return;
        }
        let nextIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = this.nextEnabledIndex(enabledIndexes, index, 1);
        }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = this.nextEnabledIndex(enabledIndexes, index, -1);
        }
        else if (event.key === 'Home') {
            nextIndex = enabledIndexes[0];
        }
        else if (event.key === 'End') {
            nextIndex = enabledIndexes[enabledIndexes.length - 1];
        }
        else {
            return;
        }
        const nextButton = buttons[nextIndex];
        if (!nextButton) {
            return;
        }
        this.buttonRefs?.get(nextIndex)?.nativeElement.focus();
        if (!nextButton.selected) {
            this.valueState.set(nextButton.id);
            this.valueChange.emit(nextButton.id);
            this.scheduleIndicatorRefresh();
        }
    }
    tabIndexFor(index) {
        if (this.disabledState()) {
            return '-1';
        }
        const buttons = this.buttons$();
        const selectedEnabledIndex = buttons.findIndex(button => button.selected && !button.disabled);
        const tabStopIndex = selectedEnabledIndex >= 0
            ? selectedEnabledIndex
            : buttons.findIndex(button => !button.disabled);
        return index === tabStopIndex ? '0' : '-1';
    }
    nextEnabledIndex(enabledIndexes, currentIndex, direction) {
        const currentEnabledPosition = enabledIndexes.indexOf(currentIndex);
        if (currentEnabledPosition < 0) {
            return direction === 1 ? enabledIndexes[0] : enabledIndexes[enabledIndexes.length - 1];
        }
        return enabledIndexes[(currentEnabledPosition + direction + enabledIndexes.length) % enabledIndexes.length];
    }
    observeIndicatorTargets() {
        this.resizeObserver?.disconnect();
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        this.resizeObserver = new ResizeObserver(() => this.scheduleIndicatorRefresh());
        if (this.rowRef?.nativeElement) {
            this.resizeObserver.observe(this.rowRef.nativeElement);
        }
        this.buttonRefs?.forEach(button => this.resizeObserver?.observe(button.nativeElement));
    }
    scheduleIndicatorRefresh() {
        if (this.animationFrameId !== undefined) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (typeof requestAnimationFrame === 'undefined') {
            this.refreshIndicator();
            return;
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.animationFrameId = undefined;
            this.refreshIndicator();
        });
    }
    refreshIndicator() {
        const selectedIndex = this.buttons$().findIndex(button => button.selected);
        const selectedButton = this.buttonRefs?.toArray()[selectedIndex]?.nativeElement;
        if (selectedIndex < 0 || selectedButton === undefined) {
            this.indicatorVisible$.set(false);
            return;
        }
        this.indicatorX$.set(selectedButton.offsetLeft);
        this.indicatorY$.set(selectedButton.offsetTop);
        this.indicatorWidth$.set(selectedButton.offsetWidth);
        this.indicatorHeight$.set(selectedButton.offsetHeight);
        this.indicatorVisible$.set(true);
    }
    destroyIndicatorMeasurement() {
        if (this.animationFrameId !== undefined) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.resizeObserver?.disconnect();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxButtonGroupComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxButtonGroupComponent, isStandalone: true, selector: "cx-button-group", inputs: { ariaLabel: "ariaLabel", availableValues: "availableValues", value: "value", size: "size", disabled: "disabled", fill: "fill" }, outputs: { valueChange: "valueChange" }, host: { properties: { "class.cx-button-group-disabled": "this.disabledHostClass", "class.cx-button-group-fill": "this.fillHostClass", "style.--cx-button-group-indicator-x": "this.indicatorX", "style.--cx-button-group-indicator-y": "this.indicatorY", "style.--cx-button-group-indicator-width": "this.indicatorWidth", "style.--cx-button-group-indicator-height": "this.indicatorHeight" } }, viewQueries: [{ propertyName: "rowRef", first: true, predicate: ["rowRef"], descendants: true }, { propertyName: "buttonRefs", predicate: ["buttonRef"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (buttons$().length > 0) {\n<div\n  #rowRef\n  class=\"cx-button-group-row\"\n  [class.cx-button-group-row-has-indicator]=\"indicatorVisible$()\"\n  role=\"group\"\n  [attr.aria-label]=\"ariaLabel?.trim() || 'Options'\"\n>\n  @if (indicatorVisible$()) {\n    <span class=\"cx-button-group-indicator\" aria-hidden=\"true\"></span>\n  }\n\n  @for (button of buttons$(); track button.id; let buttonIndex = $index) {\n    <button\n      #buttonRef\n      type=\"button\"\n      class=\"cx-button-group-button\"\n      [class.cx-button-group-button-selected]=\"button.selected\"\n      [class.cx-button-group-button-small]=\"size$() === 'small'\"\n      [class.cx-button-group-button-icon]=\"button.icon !== undefined\"\n      [class.cx-button-group-button-no-text]=\"!button.name\"\n      [class.cx-button-group-button-disabled]=\"button.disabled\"\n      [disabled]=\"disabled$() || button.disabled\"\n      [attr.aria-pressed]=\"button.selected\"\n      [attr.tabindex]=\"tabIndexFor(buttonIndex)\"\n      (click)=\"select($event, button)\"\n      (keydown)=\"onKeydown($event, buttonIndex)\"\n    >\n      @if (button.icon; as iconName) {\n        <cx-icon [icon]=\"iconName\" />\n      }\n      {{ button.name }}\n    </button>\n  }\n</div>\n}\n", styles: [":host{position:relative;display:inline-block;width:max-content;border-radius:var(--radius-md);background:var(--opacity-low)}:host(.cx-button-group-disabled){cursor:default;opacity:.3;pointer-events:none}:host(.cx-button-group-fill){display:block;width:auto}:host(.cx-button-group-fill) .cx-button-group-row{display:flex}:host(.cx-button-group-fill) .cx-button-group-button{flex:1 1 0;justify-content:center}.cx-button-group-row{position:relative;display:inline-flex;flex-direction:row;flex-wrap:nowrap;gap:var(--space-xs);padding:var(--space-2xs);white-space:nowrap}.cx-button-group-indicator{position:absolute;z-index:0;top:0;left:0;width:var(--cx-button-group-indicator-width);height:var(--cx-button-group-indicator-height);border-radius:var(--radius-md);background:var(--emphasis);box-shadow:var(--shadow-low);pointer-events:none;transform:translate(var(--cx-button-group-indicator-x), var(--cx-button-group-indicator-y));transition:transform var(--motion-base) ease,width var(--motion-base) ease,height var(--motion-base) ease}.cx-button-group-button{position:relative;z-index:1;display:inline-flex;height:calc(var(--controller-size) - var(--space-xs));align-items:center;gap:var(--space-sm);margin:0;padding:0 var(--space-md);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;font-weight:var(--font-weight-regular);line-height:1;outline:none;transition:color var(--motion-fast) ease,background-color var(--motion-fast) ease;white-space:nowrap}.cx-button-group-button:hover{color:var(--ink)}.cx-button-group-button-icon{padding-left:var(--space-sm)}.cx-button-group-button-no-text{padding:0 var(--space-sm)}.cx-button-group-button-small{height:calc(var(--controller-size-small) - var(--space-xs));padding:0 var(--space-sm);border-radius:var(--radius-sm);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}:host:has(.cx-button-group-button-small){border-radius:var(--radius-sm)}.cx-button-group-row-has-indicator:has(.cx-button-group-button-small) .cx-button-group-indicator{border-radius:var(--radius-sm)}.cx-button-group-button-selected{color:var(--on-emphasis);background:var(--emphasis);box-shadow:var(--shadow-low)}.cx-button-group-row-has-indicator .cx-button-group-button-selected{background:rgba(0,0,0,0);box-shadow:none}.cx-button-group-button-selected:hover{color:var(--on-emphasis)}.cx-button-group-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-button-group-button:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-button-group-button-disabled,.cx-button-group-button:disabled{cursor:default;opacity:.3;pointer-events:none}.cx-button-group-button-disabled:disabled{opacity:1}@media(prefers-reduced-motion: reduce){.cx-button-group-indicator{transition:none}}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxButtonGroupComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-button-group', imports: [CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (buttons$().length > 0) {\n<div\n  #rowRef\n  class=\"cx-button-group-row\"\n  [class.cx-button-group-row-has-indicator]=\"indicatorVisible$()\"\n  role=\"group\"\n  [attr.aria-label]=\"ariaLabel?.trim() || 'Options'\"\n>\n  @if (indicatorVisible$()) {\n    <span class=\"cx-button-group-indicator\" aria-hidden=\"true\"></span>\n  }\n\n  @for (button of buttons$(); track button.id; let buttonIndex = $index) {\n    <button\n      #buttonRef\n      type=\"button\"\n      class=\"cx-button-group-button\"\n      [class.cx-button-group-button-selected]=\"button.selected\"\n      [class.cx-button-group-button-small]=\"size$() === 'small'\"\n      [class.cx-button-group-button-icon]=\"button.icon !== undefined\"\n      [class.cx-button-group-button-no-text]=\"!button.name\"\n      [class.cx-button-group-button-disabled]=\"button.disabled\"\n      [disabled]=\"disabled$() || button.disabled\"\n      [attr.aria-pressed]=\"button.selected\"\n      [attr.tabindex]=\"tabIndexFor(buttonIndex)\"\n      (click)=\"select($event, button)\"\n      (keydown)=\"onKeydown($event, buttonIndex)\"\n    >\n      @if (button.icon; as iconName) {\n        <cx-icon [icon]=\"iconName\" />\n      }\n      {{ button.name }}\n    </button>\n  }\n</div>\n}\n", styles: [":host{position:relative;display:inline-block;width:max-content;border-radius:var(--radius-md);background:var(--opacity-low)}:host(.cx-button-group-disabled){cursor:default;opacity:.3;pointer-events:none}:host(.cx-button-group-fill){display:block;width:auto}:host(.cx-button-group-fill) .cx-button-group-row{display:flex}:host(.cx-button-group-fill) .cx-button-group-button{flex:1 1 0;justify-content:center}.cx-button-group-row{position:relative;display:inline-flex;flex-direction:row;flex-wrap:nowrap;gap:var(--space-xs);padding:var(--space-2xs);white-space:nowrap}.cx-button-group-indicator{position:absolute;z-index:0;top:0;left:0;width:var(--cx-button-group-indicator-width);height:var(--cx-button-group-indicator-height);border-radius:var(--radius-md);background:var(--emphasis);box-shadow:var(--shadow-low);pointer-events:none;transform:translate(var(--cx-button-group-indicator-x), var(--cx-button-group-indicator-y));transition:transform var(--motion-base) ease,width var(--motion-base) ease,height var(--motion-base) ease}.cx-button-group-button{position:relative;z-index:1;display:inline-flex;height:calc(var(--controller-size) - var(--space-xs));align-items:center;gap:var(--space-sm);margin:0;padding:0 var(--space-md);border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;font-weight:var(--font-weight-regular);line-height:1;outline:none;transition:color var(--motion-fast) ease,background-color var(--motion-fast) ease;white-space:nowrap}.cx-button-group-button:hover{color:var(--ink)}.cx-button-group-button-icon{padding-left:var(--space-sm)}.cx-button-group-button-no-text{padding:0 var(--space-sm)}.cx-button-group-button-small{height:calc(var(--controller-size-small) - var(--space-xs));padding:0 var(--space-sm);border-radius:var(--radius-sm);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}:host:has(.cx-button-group-button-small){border-radius:var(--radius-sm)}.cx-button-group-row-has-indicator:has(.cx-button-group-button-small) .cx-button-group-indicator{border-radius:var(--radius-sm)}.cx-button-group-button-selected{color:var(--on-emphasis);background:var(--emphasis);box-shadow:var(--shadow-low)}.cx-button-group-row-has-indicator .cx-button-group-button-selected{background:rgba(0,0,0,0);box-shadow:none}.cx-button-group-button-selected:hover{color:var(--on-emphasis)}.cx-button-group-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-button-group-button:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-button-group-button-disabled,.cx-button-group-button:disabled{cursor:default;opacity:.3;pointer-events:none}.cx-button-group-button-disabled:disabled{opacity:1}@media(prefers-reduced-motion: reduce){.cx-button-group-indicator{transition:none}}"] }]
        }], propDecorators: { rowRef: [{
                type: ViewChild,
                args: ['rowRef']
            }], buttonRefs: [{
                type: ViewChildren,
                args: ['buttonRef', { read: ElementRef }]
            }], ariaLabel: [{
                type: Input
            }], availableValues: [{
                type: Input
            }], value: [{
                type: Input
            }], size: [{
                type: Input
            }], disabled: [{
                type: Input
            }], fill: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], disabledHostClass: [{
                type: HostBinding,
                args: ['class.cx-button-group-disabled']
            }], fillHostClass: [{
                type: HostBinding,
                args: ['class.cx-button-group-fill']
            }], indicatorX: [{
                type: HostBinding,
                args: ['style.--cx-button-group-indicator-x']
            }], indicatorY: [{
                type: HostBinding,
                args: ['style.--cx-button-group-indicator-y']
            }], indicatorWidth: [{
                type: HostBinding,
                args: ['style.--cx-button-group-indicator-width']
            }], indicatorHeight: [{
                type: HostBinding,
                args: ['style.--cx-button-group-indicator-height']
            }] } });
