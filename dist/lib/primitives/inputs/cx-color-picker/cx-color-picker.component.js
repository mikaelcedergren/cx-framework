import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, computed, inject, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export const CX_COLOR_PICKER_COLORS = [
    'blue',
    'cyan',
    'lime',
    'green',
    'yellow',
    'orange',
    'tangerine',
    'red',
    'pink',
    'purple',
    'violet',
];
export const CX_COLOR_PICKER_PALETTE_OPTIONS = [
    { color: 'blue', label: 'Blue' },
    { color: 'cyan', label: 'Cyan' },
    { color: 'lime', label: 'Lime' },
    { color: 'green', label: 'Green' },
    { color: 'yellow', label: 'Yellow' },
    { color: 'orange', label: 'Orange' },
    { color: 'tangerine', label: 'Tangerine' },
    { color: 'red', label: 'Red' },
    { color: 'pink', label: 'Pink' },
    { color: 'purple', label: 'Purple' },
    { color: 'violet', label: 'Violet' },
];
const CX_COLOR_PICKER_COLOR_SET = new Set(CX_COLOR_PICKER_COLORS);
export class CxColorPickerComponent {
    static nextId = 0;
    host = inject((ElementRef));
    colorState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "colorState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    loadingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingState" }] : /* istanbul ignore next */ []));
    clearableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "clearableState" }] : /* istanbul ignore next */ []));
    showValueState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showValueState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport), () => this.popoverRef?.surfaceElement());
    labelId = `cx-color-picker-label-${CxColorPickerComponent.nextId}`;
    messagesId = `cx-color-picker-messages-${CxColorPickerComponent.nextId}`;
    popoverId = `cx-color-picker-popover-${CxColorPickerComponent.nextId++}`;
    triggerRef;
    popoverRef;
    colorChange = new EventEmitter();
    label = 'Color';
    hint;
    optional = false;
    ariaLabel;
    size = 'default';
    set color(color) {
        this.colorState.set(this.isColor(color) ? color : undefined);
    }
    set disabled(disabled) {
        this.disabledState.set(disabled === true);
        if (disabled) {
            this.openState.set(false);
        }
    }
    set loading(loading) {
        this.loadingState.set(loading === true);
        if (loading) {
            this.openState.set(false);
        }
    }
    set clearable(clearable) {
        this.clearableState.set(clearable === true);
    }
    set showValue(showValue) {
        this.showValueState.set(showValue !== false);
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    color$ = this.colorState.asReadonly();
    options = CX_COLOR_PICKER_PALETTE_OPTIONS;
    disabled$ = this.disabledState.asReadonly();
    loading$ = this.loadingState.asReadonly();
    clearable$ = this.clearableState.asReadonly();
    showValue$ = this.showValueState.asReadonly();
    open$ = this.openState.asReadonly();
    selectedOption$ = computed(() => CX_COLOR_PICKER_PALETTE_OPTIONS.find(option => option.color === this.colorState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedOption$" }] : /* istanbul ignore next */ []));
    selectedColor$ = computed(() => this.selectedOption$()?.color, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedColor$" }] : /* istanbul ignore next */ []));
    displayText$ = computed(() => this.selectedOption$()?.label || 'None', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayText$" }] : /* istanbul ignore next */ []));
    isInteractive$ = computed(() => !this.disabledState() && !this.loadingState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isInteractive$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => this.disabledState() ? [] : normalizeCxValidation(this.validationState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    triggerAriaLabel$ = computed(() => {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        return this.label.trim() ? undefined : `Color: ${this.displayText$()}`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "triggerAriaLabel$" }] : /* istanbul ignore next */ []));
    triggerAriaLabelledBy$ = computed(() => {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "triggerAriaLabelledBy$" }] : /* istanbul ignore next */ []));
    triggerAriaDescribedBy$ = computed(() => this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "triggerAriaDescribedBy$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        this.overlay.sync(this.triggerRef?.nativeElement);
        this.overlay.observeTrigger(this.triggerRef?.nativeElement);
    }
    ngOnDestroy() {
        this.overlay.destroy();
    }
    toggleOpen(field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (this.openState()) {
            this.openState.set(false);
            return;
        }
        this.overlay.setTrigger(field);
        this.openState.set(true);
        queueMicrotask(() => this.overlay.sync(field));
    }
    onTriggerKeydown(event, field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.toggleOpen(field);
            return;
        }
        if (event.key === 'Escape') {
            this.closePopover();
        }
    }
    selectOption(option) {
        if (!this.isInteractive$()) {
            return;
        }
        this.setColor(option.color);
    }
    clearSelection() {
        if (!this.isInteractive$() || !this.clearableState()) {
            return;
        }
        this.setColor(undefined);
    }
    closePopover() {
        this.openState.set(false);
        this.overlay.endSession();
    }
    isOptionSelected(option) {
        return this.colorState() === option.color;
    }
    onDocumentPointerDown(event) {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            this.closePopover();
            return;
        }
        if (this.host.nativeElement.contains(target)) {
            return;
        }
        const surface = this.popoverRef?.surfaceElement();
        if (surface && surface.contains(target)) {
            return;
        }
        this.closePopover();
    }
    onWindowResize() {
        if (this.openState()) {
            this.overlay.sync();
        }
    }
    setColor(color) {
        this.colorState.set(color);
        this.openState.set(false);
        this.colorChange.emit(color);
    }
    measureOverlay(rect, viewport) {
        const minWidth = Math.floor(Math.min(rect.width, viewport.width - 16));
        const optionCount = Math.max(CX_COLOR_PICKER_PALETTE_OPTIONS.length + (this.clearableState() ? 1 : 0), 1);
        const estimatedHeight = Math.min(optionCount * 48, 360);
        return {
            width: minWidth,
            minWidth,
            estimatedHeight,
            align: 'start',
        };
    }
    isColor(color) {
        return typeof color === 'string' && CX_COLOR_PICKER_COLOR_SET.has(color);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxColorPickerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxColorPickerComponent, isStandalone: true, selector: "cx-color-picker", inputs: { label: "label", hint: "hint", optional: "optional", ariaLabel: "ariaLabel", size: "size", color: "color", disabled: "disabled", loading: "loading", clearable: "clearable", showValue: "showValue", validation: "validation" }, outputs: { colorChange: "colorChange" }, host: { listeners: { "document:pointerdown": "onDocumentPointerDown($event)", "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "triggerRef", first: true, predicate: ["trigger"], descendants: true, read: ElementRef }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }], ngImport: i0, template: "<div\n  class=\"cx-color-picker\"\n  [class.cx-color-picker--disabled]=\"disabled$()\"\n  [class.cx-color-picker--loading]=\"loading$()\"\n  [class.cx-color-picker--small]=\"size === 'small'\"\n  [class.cx-color-picker--large]=\"size === 'large'\"\n  [class.cx-color-picker--swatch-only]=\"!showValue$()\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-color-picker__header\">\n      <div class=\"cx-color-picker__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-color-picker__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <button\n    #trigger\n    type=\"button\"\n    class=\"cx-color-picker__trigger\"\n    [class.cx-color-picker__trigger--open]=\"open$()\"\n    [class.cx-color-picker__trigger--error]=\"hasError$()\"\n    [disabled]=\"disabled$() || loading$()\"\n    [attr.aria-expanded]=\"open$()\"\n    aria-haspopup=\"listbox\"\n    [attr.aria-controls]=\"open$() ? popoverId : null\"\n    [attr.aria-label]=\"triggerAriaLabel$()\"\n    [attr.aria-labelledby]=\"triggerAriaLabelledBy$()\"\n    [attr.aria-describedby]=\"triggerAriaDescribedBy$()\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    [cxTooltip]=\"displayText$()\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggleOpen(trigger)\"\n    (keydown)=\"onTriggerKeydown($event, trigger)\"\n  >\n    <span\n      class=\"cx-color-picker__swatch\"\n      [class.cx-color-picker__swatch--empty]=\"!selectedColor$()\"\n      [attr.data-color]=\"selectedColor$()\"\n      aria-hidden=\"true\"\n    ></span>\n    @if (showValue$()) {\n      <span class=\"cx-color-picker__value\" data-cx-tooltip-overflow>\n        {{ displayText$() }}\n      </span>\n    }\n    @if (loading$()) {\n      <cx-spinner size=\"small\" mood=\"default\" />\n    } @else {\n      <cx-icon class=\"cx-color-picker__chevron\" icon=\"chevron-down\" [size]=\"16\" />\n    }\n  </button>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-color-picker__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-color-picker__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n  @if (open$() && isInteractive$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div\n        class=\"cx-color-picker__options\"\n        data-cx-popover-scroll-container\n        role=\"listbox\"\n        [attr.aria-label]=\"triggerAriaLabel$()\"\n        [attr.aria-labelledby]=\"triggerAriaLabelledBy$()\"\n      >\n        @if (clearable$()) {\n          <button\n            type=\"button\"\n            class=\"cx-color-picker__option cx-color-picker__option--clear\"\n            [class.cx-color-picker__option--selected]=\"!color$()\"\n            role=\"option\"\n            [attr.aria-selected]=\"!color$()\"\n            (click)=\"clearSelection()\"\n          >\n            <span class=\"cx-color-picker__swatch cx-color-picker__swatch--empty\"></span>\n            <span>None</span>\n          </button>\n        }\n        @for (option of options; track option.color) {\n          <button\n            type=\"button\"\n            class=\"cx-color-picker__option\"\n            [class.cx-color-picker__option--selected]=\"isOptionSelected(option)\"\n            role=\"option\"\n            [attr.aria-selected]=\"isOptionSelected(option)\"\n            [cxTooltip]=\"option.label\"\n            [cxTooltipOverflow]=\"true\"\n            (click)=\"selectOption(option)\"\n          >\n            <span class=\"cx-color-picker__swatch\" [attr.data-color]=\"option.color\" aria-hidden=\"true\"></span>\n            <span class=\"cx-color-picker__option-label\" data-cx-tooltip-overflow>{{ option.label }}</span>\n          </button>\n        }\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-flex;min-width:0}.cx-color-picker{display:inline-flex;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-color-picker__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:0}.cx-color-picker__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-color-picker__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-color-picker__trigger{box-sizing:border-box;display:inline-flex;min-width:calc(var(--controller-size)*4);min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:left;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-color-picker--small .cx-color-picker__trigger{min-height:var(--controller-size-small);font-size:var(--font-size-body-sm)}.cx-color-picker--large .cx-color-picker__trigger{min-height:calc(var(--controller-size) + var(--space-md));font-size:var(--font-size-body-lg)}.cx-color-picker--swatch-only .cx-color-picker__trigger{min-width:auto;gap:var(--space-sm)}.cx-color-picker__trigger:hover:not(:disabled){border-color:var(--opacity-mid)}.cx-color-picker__trigger:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-color-picker__trigger--open{border-color:var(--border-open);background:var(--surface-alt)}.cx-color-picker__trigger--error{border-color:var(--danger)}.cx-color-picker__trigger:disabled{cursor:default}.cx-color-picker--disabled,.cx-color-picker--loading{opacity:var(--opacity-disabled, 0.55)}.cx-color-picker__value{flex:1 1 auto;min-width:0;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);text-overflow:ellipsis;white-space:nowrap}.cx-color-picker__swatch{--cx-color-picker-swatch-size: calc(var(--icon-size-md) - 2px);display:inline-flex;width:var(--cx-color-picker-swatch-size);height:var(--cx-color-picker-swatch-size);flex:0 0 auto;border:var(--border-width) solid var(--opacity-mid);border-radius:var(--radius-sm);background:var(--surface);box-sizing:border-box}.cx-color-picker__swatch--empty{background:linear-gradient(135deg, transparent calc(50% - var(--border-width) / 2), var(--opacity-mid) calc(50% - var(--border-width) / 2), var(--opacity-mid) calc(50% + var(--border-width) / 2), transparent calc(50% + var(--border-width) / 2)),var(--surface)}.cx-color-picker__chevron{flex:0 0 auto;color:var(--opacity-high);transition:transform var(--motion-fast) ease}.cx-color-picker__trigger--open .cx-color-picker__chevron{transform:rotate(180deg)}.cx-color-picker__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:0}.cx-color-picker__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-color-picker__options{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;padding:var(--space-xs)}.cx-color-picker__option{display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-lg) var(--space-xs) var(--space-xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:left;transition:background var(--motion-fast) ease,color var(--motion-fast) ease}.cx-color-picker__option:hover{background:var(--primary-opacity)}.cx-color-picker__option:focus-visible{background:var(--primary-opacity);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-color-picker__option:active:not(:disabled){background:var(--opacity-mid);outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-color-picker__option--selected{background:var(--opacity-low)}.cx-color-picker__option-label{display:block;min-width:0;overflow:hidden;color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);text-overflow:ellipsis;white-space:nowrap}.cx-color-picker__option--clear{color:var(--ink)}.cx-color-picker__swatch[data-color=blue]{background:var(--blue)}.cx-color-picker__swatch[data-color=cyan]{background:var(--cyan)}.cx-color-picker__swatch[data-color=lime]{background:var(--lime)}.cx-color-picker__swatch[data-color=green]{background:var(--green)}.cx-color-picker__swatch[data-color=yellow]{background:var(--yellow)}.cx-color-picker__swatch[data-color=orange]{background:var(--orange)}.cx-color-picker__swatch[data-color=tangerine]{background:var(--tangerine)}.cx-color-picker__swatch[data-color=red]{background:var(--red)}.cx-color-picker__swatch[data-color=pink]{background:var(--pink)}.cx-color-picker__swatch[data-color=purple]{background:var(--purple)}.cx-color-picker__swatch[data-color=violet]{background:var(--violet)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxColorPickerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-color-picker', imports: [CxIconComponent, CxPopoverComponent, CxSpinnerComponent, CxTooltipDirective, CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-color-picker\"\n  [class.cx-color-picker--disabled]=\"disabled$()\"\n  [class.cx-color-picker--loading]=\"loading$()\"\n  [class.cx-color-picker--small]=\"size === 'small'\"\n  [class.cx-color-picker--large]=\"size === 'large'\"\n  [class.cx-color-picker--swatch-only]=\"!showValue$()\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-color-picker__header\">\n      <div class=\"cx-color-picker__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-color-picker__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <button\n    #trigger\n    type=\"button\"\n    class=\"cx-color-picker__trigger\"\n    [class.cx-color-picker__trigger--open]=\"open$()\"\n    [class.cx-color-picker__trigger--error]=\"hasError$()\"\n    [disabled]=\"disabled$() || loading$()\"\n    [attr.aria-expanded]=\"open$()\"\n    aria-haspopup=\"listbox\"\n    [attr.aria-controls]=\"open$() ? popoverId : null\"\n    [attr.aria-label]=\"triggerAriaLabel$()\"\n    [attr.aria-labelledby]=\"triggerAriaLabelledBy$()\"\n    [attr.aria-describedby]=\"triggerAriaDescribedBy$()\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    [cxTooltip]=\"displayText$()\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggleOpen(trigger)\"\n    (keydown)=\"onTriggerKeydown($event, trigger)\"\n  >\n    <span\n      class=\"cx-color-picker__swatch\"\n      [class.cx-color-picker__swatch--empty]=\"!selectedColor$()\"\n      [attr.data-color]=\"selectedColor$()\"\n      aria-hidden=\"true\"\n    ></span>\n    @if (showValue$()) {\n      <span class=\"cx-color-picker__value\" data-cx-tooltip-overflow>\n        {{ displayText$() }}\n      </span>\n    }\n    @if (loading$()) {\n      <cx-spinner size=\"small\" mood=\"default\" />\n    } @else {\n      <cx-icon class=\"cx-color-picker__chevron\" icon=\"chevron-down\" [size]=\"16\" />\n    }\n  </button>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-color-picker__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-color-picker__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n  @if (open$() && isInteractive$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div\n        class=\"cx-color-picker__options\"\n        data-cx-popover-scroll-container\n        role=\"listbox\"\n        [attr.aria-label]=\"triggerAriaLabel$()\"\n        [attr.aria-labelledby]=\"triggerAriaLabelledBy$()\"\n      >\n        @if (clearable$()) {\n          <button\n            type=\"button\"\n            class=\"cx-color-picker__option cx-color-picker__option--clear\"\n            [class.cx-color-picker__option--selected]=\"!color$()\"\n            role=\"option\"\n            [attr.aria-selected]=\"!color$()\"\n            (click)=\"clearSelection()\"\n          >\n            <span class=\"cx-color-picker__swatch cx-color-picker__swatch--empty\"></span>\n            <span>None</span>\n          </button>\n        }\n        @for (option of options; track option.color) {\n          <button\n            type=\"button\"\n            class=\"cx-color-picker__option\"\n            [class.cx-color-picker__option--selected]=\"isOptionSelected(option)\"\n            role=\"option\"\n            [attr.aria-selected]=\"isOptionSelected(option)\"\n            [cxTooltip]=\"option.label\"\n            [cxTooltipOverflow]=\"true\"\n            (click)=\"selectOption(option)\"\n          >\n            <span class=\"cx-color-picker__swatch\" [attr.data-color]=\"option.color\" aria-hidden=\"true\"></span>\n            <span class=\"cx-color-picker__option-label\" data-cx-tooltip-overflow>{{ option.label }}</span>\n          </button>\n        }\n      </div>\n    </cx-popover>\n  }\n</div>\n", styles: [":host{display:inline-flex;min-width:0}.cx-color-picker{display:inline-flex;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-color-picker__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:0}.cx-color-picker__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-color-picker__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-color-picker__trigger{box-sizing:border-box;display:inline-flex;min-width:calc(var(--controller-size)*4);min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:left;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-color-picker--small .cx-color-picker__trigger{min-height:var(--controller-size-small);font-size:var(--font-size-body-sm)}.cx-color-picker--large .cx-color-picker__trigger{min-height:calc(var(--controller-size) + var(--space-md));font-size:var(--font-size-body-lg)}.cx-color-picker--swatch-only .cx-color-picker__trigger{min-width:auto;gap:var(--space-sm)}.cx-color-picker__trigger:hover:not(:disabled){border-color:var(--opacity-mid)}.cx-color-picker__trigger:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-color-picker__trigger--open{border-color:var(--border-open);background:var(--surface-alt)}.cx-color-picker__trigger--error{border-color:var(--danger)}.cx-color-picker__trigger:disabled{cursor:default}.cx-color-picker--disabled,.cx-color-picker--loading{opacity:var(--opacity-disabled, 0.55)}.cx-color-picker__value{flex:1 1 auto;min-width:0;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);text-overflow:ellipsis;white-space:nowrap}.cx-color-picker__swatch{--cx-color-picker-swatch-size: calc(var(--icon-size-md) - 2px);display:inline-flex;width:var(--cx-color-picker-swatch-size);height:var(--cx-color-picker-swatch-size);flex:0 0 auto;border:var(--border-width) solid var(--opacity-mid);border-radius:var(--radius-sm);background:var(--surface);box-sizing:border-box}.cx-color-picker__swatch--empty{background:linear-gradient(135deg, transparent calc(50% - var(--border-width) / 2), var(--opacity-mid) calc(50% - var(--border-width) / 2), var(--opacity-mid) calc(50% + var(--border-width) / 2), transparent calc(50% + var(--border-width) / 2)),var(--surface)}.cx-color-picker__chevron{flex:0 0 auto;color:var(--opacity-high);transition:transform var(--motion-fast) ease}.cx-color-picker__trigger--open .cx-color-picker__chevron{transform:rotate(180deg)}.cx-color-picker__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:0}.cx-color-picker__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-color-picker__options{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;padding:var(--space-xs)}.cx-color-picker__option{display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-lg) var(--space-xs) var(--space-xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:left;transition:background var(--motion-fast) ease,color var(--motion-fast) ease}.cx-color-picker__option:hover{background:var(--primary-opacity)}.cx-color-picker__option:focus-visible{background:var(--primary-opacity);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-color-picker__option:active:not(:disabled){background:var(--opacity-mid);outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-color-picker__option--selected{background:var(--opacity-low)}.cx-color-picker__option-label{display:block;min-width:0;overflow:hidden;color:currentColor;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);text-overflow:ellipsis;white-space:nowrap}.cx-color-picker__option--clear{color:var(--ink)}.cx-color-picker__swatch[data-color=blue]{background:var(--blue)}.cx-color-picker__swatch[data-color=cyan]{background:var(--cyan)}.cx-color-picker__swatch[data-color=lime]{background:var(--lime)}.cx-color-picker__swatch[data-color=green]{background:var(--green)}.cx-color-picker__swatch[data-color=yellow]{background:var(--yellow)}.cx-color-picker__swatch[data-color=orange]{background:var(--orange)}.cx-color-picker__swatch[data-color=tangerine]{background:var(--tangerine)}.cx-color-picker__swatch[data-color=red]{background:var(--red)}.cx-color-picker__swatch[data-color=pink]{background:var(--pink)}.cx-color-picker__swatch[data-color=purple]{background:var(--purple)}.cx-color-picker__swatch[data-color=violet]{background:var(--violet)}"] }]
        }], propDecorators: { triggerRef: [{
                type: ViewChild,
                args: ['trigger', { read: ElementRef }]
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], colorChange: [{
                type: Output
            }], label: [{
                type: Input
            }], hint: [{
                type: Input
            }], optional: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], size: [{
                type: Input
            }], color: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], clearable: [{
                type: Input
            }], showValue: [{
                type: Input
            }], validation: [{
                type: Input
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
