import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, computed, contentChild, effect, inject, signal, viewChild, } from '@angular/core';
import { CxLabeledRowGroupComponent } from './cx-labeled-row-group.component.js';
import { CxLabeledRowInfoDirective } from './cx-labeled-row-info.directive.js';
import { CxValidationMessageComponent } from '../../primitives/feedback/cx-validation-message/index.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxCheckboxComponent } from '../../primitives/inputs/cx-checkbox/index.js';
import { CxFileUploadComponent, } from '../../primitives/inputs/cx-file-upload/index.js';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field/index.js';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio/index.js';
import { CxDropdownComponent } from '../../primitives/inputs/cx-dropdown/index.js';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch/index.js';
import { CxTextAreaComponent } from '../../primitives/inputs/cx-text-area/index.js';
import { normalizeCxValidation } from '../../primitives/inputs/shared/field.types.js';
import { CxDynamicFieldsComponent, } from '../cx-dynamic-fields/index.js';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover/index.js';
import { CxFloatingSurfaceController, } from '../../primitives/overlay/floating-surface-controller.js';
import { CxHostVisibilityObserver } from '../../primitives/shared/host-visibility.js';
import * as i0 from "@angular/core";
const CX_LABELED_ROW_INFO_MAX_WIDTH = 320;
const CX_LABELED_ROW_INFO_MAX_HEIGHT = 320;
const CX_LABELED_ROW_INFO_ESTIMATED_WIDTH = 280;
const CX_LABELED_ROW_INFO_MIN_WIDTH = 220;
const CX_LABELED_ROW_INFO_ESTIMATED_HEIGHT = 240;
const CX_LABELED_ROW_INFO_VIEWPORT_PADDING = 8;
const CX_LABELED_ROW_INFO_GAP = 4;
let nextLabeledRowInfoId = 0;
export class CxLabeledRowComponent {
    radioValueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "radioValueState" }] : /* istanbul ignore next */ []));
    hostElement = inject(ElementRef).nativeElement;
    document = inject(DOCUMENT);
    group = inject(CxLabeledRowGroupComponent, { optional: true });
    infoContent = contentChild(CxLabeledRowInfoDirective, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "infoContent" }] : /* istanbul ignore next */ []));
    infoTriggerRef = viewChild('infoTrigger', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "infoTriggerRef" }] : /* istanbul ignore next */ []));
    infoPopoverRef = viewChild('infoPopover', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "infoPopoverRef" }] : /* istanbul ignore next */ []));
    infoSurfaceFocusRef = viewChild('infoSurfaceFocus', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "infoSurfaceFocusRef" }] : /* istanbul ignore next */ []));
    infoOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "infoOpenState" }] : /* istanbul ignore next */ []));
    hostVisibility = new CxHostVisibilityObserver(this.hostElement, visible => {
        if (!visible && this.infoOpenState()) {
            this.closeInfoPopover();
        }
    });
    infoFocusTimer;
    infoOpenTracking = false;
    infoPopoverId = `cx-labeled-row-info-${++nextLabeledRowInfoId}`;
    infoPopoverMaxWidth = CX_LABELED_ROW_INFO_MAX_WIDTH;
    infoOpen = this.infoOpenState.asReadonly();
    hasInfoContent = computed(() => this.infoContent()?.hasVisibleContent() ?? false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasInfoContent" }] : /* istanbul ignore next */ []));
    infoOverlay = new CxFloatingSurfaceController((rect, viewport) => this.measureInfoOverlay(rect, viewport), () => this.infoPopoverRef()?.surfaceElement());
    constructor() {
        effect(() => {
            if (this.infoOpenState() && !this.hasInfoContent()) {
                this.closeInfoPopover();
            }
        });
    }
    /** A row placed directly in a cx-labeled-row-group defers its label column to the group. */
    get grouped() {
        const parent = this.hostElement.parentElement;
        return parent !== null && (this.group?.isGridElement(parent) ?? false);
    }
    label = 'Label';
    size = 'default';
    optional = false;
    get hasLabel() {
        return this.label.trim().length > 0;
    }
    set content(value) {
        this.contentInputBound = true;
        this.contentState = value;
        if (value.kind === 'radio-group') {
            this.radioValueState.set(value.value);
        }
    }
    get content() {
        return this.contentState;
    }
    inputValueChange = new EventEmitter();
    selectValueChange = new EventEmitter();
    selectValuesChange = new EventEmitter();
    radioValueChange = new EventEmitter();
    checkboxCheckedChange = new EventEmitter();
    switchCheckedChange = new EventEmitter();
    fileUploadChange = new EventEmitter();
    dynamicFieldsChange = new EventEmitter();
    contentInputBound = false;
    contentState = {
        kind: 'text',
        text: 'Paste chaos here',
    };
    ngOnDestroy() {
        this.stopInfoTracking();
        this.infoOverlay.destroy();
        this.clearInfoFocusTimer();
    }
    get infoAriaLabel() {
        const label = this.label.trim();
        return label ? `More information about ${label}` : 'More information';
    }
    get infoTriggerElement() {
        return this.infoTriggerRef()?.nativeElement;
    }
    toggleInfoPopover() {
        if (this.infoOpenState()) {
            this.closeInfoPopover();
            return;
        }
        if (!this.hasInfoContent()) {
            return;
        }
        const trigger = this.infoTriggerRef()?.nativeElement;
        if (!trigger) {
            return;
        }
        this.infoOverlay.endSession();
        this.infoOverlay.sync(trigger);
        this.infoOpenState.set(true);
        this.startInfoTracking();
        this.scheduleInfoSurfaceFocus();
    }
    closeInfoPopover() {
        if (!this.infoOpenState()) {
            return;
        }
        this.clearInfoFocusTimer();
        this.infoOpenState.set(false);
        this.stopInfoTracking();
        this.infoOverlay.endSession();
    }
    onInputValueChange(value) {
        this.inputValueChange.emit(value);
    }
    onSelectValueChange(value) {
        this.selectValueChange.emit(value);
    }
    onSelectValuesChange(value) {
        this.selectValuesChange.emit(value);
    }
    onRadioSelect(value) {
        this.radioValueState.set(value);
        this.radioValueChange.emit(value);
    }
    onCheckboxCheckedChange(value) {
        this.checkboxCheckedChange.emit(value);
    }
    onSwitchCheckedChange(value) {
        this.switchCheckedChange.emit(value);
    }
    onFileUpload(value) {
        this.fileUploadChange.emit(value);
    }
    onDynamicFieldsChange(value) {
        this.dynamicFieldsChange.emit(value);
    }
    isRadioSelected(optionId) {
        return this.radioValueState() === optionId;
    }
    validationMessages(validation) {
        return normalizeCxValidation(validation);
    }
    measureInfoOverlay(_rect, viewport) {
        const viewportWidth = Math.max(viewport.width - CX_LABELED_ROW_INFO_VIEWPORT_PADDING * 2, 0);
        const viewportHeight = Math.max(viewport.height - CX_LABELED_ROW_INFO_VIEWPORT_PADDING * 2, 0);
        const estimatedWidth = Math.min(CX_LABELED_ROW_INFO_ESTIMATED_WIDTH, viewportWidth);
        return {
            width: estimatedWidth,
            minWidth: Math.min(CX_LABELED_ROW_INFO_MIN_WIDTH, viewportWidth),
            estimatedHeight: Math.min(CX_LABELED_ROW_INFO_ESTIMATED_HEIGHT, viewportHeight),
            align: 'start',
            viewportPadding: CX_LABELED_ROW_INFO_VIEWPORT_PADDING,
            gap: CX_LABELED_ROW_INFO_GAP,
            maxHeightCap: Math.min(CX_LABELED_ROW_INFO_MAX_HEIGHT, viewportHeight),
        };
    }
    scheduleInfoSurfaceFocus() {
        const windowRef = this.document.defaultView;
        if (!windowRef) {
            return;
        }
        this.clearInfoFocusTimer();
        this.infoFocusTimer = windowRef.setTimeout(() => {
            this.infoFocusTimer = undefined;
            this.infoOverlay.sync();
            this.infoSurfaceFocusRef()?.nativeElement.focus({ preventScroll: true });
        });
    }
    clearInfoFocusTimer() {
        const windowRef = this.document.defaultView;
        if (windowRef && this.infoFocusTimer !== undefined) {
            windowRef.clearTimeout(this.infoFocusTimer);
        }
        this.infoFocusTimer = undefined;
    }
    startInfoTracking() {
        if (this.infoOpenTracking) {
            return;
        }
        this.infoOpenTracking = true;
        this.hostVisibility.start();
        this.document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
        this.document.defaultView?.addEventListener('resize', this.onWindowResize);
        this.infoOverlay.observeTrigger(this.infoTriggerRef()?.nativeElement, () => {
            if (this.hostVisibility.check()) {
                this.infoOverlay.sync();
            }
        });
    }
    stopInfoTracking() {
        this.hostVisibility.stop();
        if (!this.infoOpenTracking) {
            return;
        }
        this.infoOpenTracking = false;
        this.document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
        this.document.defaultView?.removeEventListener('resize', this.onWindowResize);
        this.infoOverlay.stopObservingTrigger();
    }
    onCapturedDocumentScroll = (event) => {
        if (!this.infoOpenState() || !this.hostVisibility.check()) {
            return;
        }
        const target = event.target;
        if (target instanceof Node && this.infoPopoverRef()?.surfaceElement()?.contains(target)) {
            return;
        }
        this.infoOverlay.sync();
    };
    onWindowResize = () => {
        if (this.infoOpenState() && this.hostVisibility.check()) {
            this.infoOverlay.sync();
        }
    };
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLabeledRowComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLabeledRowComponent, isStandalone: true, selector: "cx-labeled-row", inputs: { label: "label", size: "size", optional: "optional", content: "content" }, outputs: { inputValueChange: "inputValueChange", selectValueChange: "selectValueChange", selectValuesChange: "selectValuesChange", radioValueChange: "radioValueChange", checkboxCheckedChange: "checkboxCheckedChange", switchCheckedChange: "switchCheckedChange", fileUploadChange: "fileUploadChange", dynamicFieldsChange: "dynamicFieldsChange" }, host: { properties: { "class.cx-labeled-row--grouped": "this.grouped" } }, queries: [{ propertyName: "infoContent", first: true, predicate: CxLabeledRowInfoDirective, descendants: true, isSignal: true }], viewQueries: [{ propertyName: "infoTriggerRef", first: true, predicate: ["infoTrigger"], descendants: true, isSignal: true }, { propertyName: "infoPopoverRef", first: true, predicate: ["infoPopover"], descendants: true, isSignal: true }, { propertyName: "infoSurfaceFocusRef", first: true, predicate: ["infoSurfaceFocus"], descendants: true, isSignal: true }], ngImport: i0, template: "<div\n  class=\"cx-labeled-row\"\n  [class.cx-labeled-row--no-label]=\"!hasLabel\"\n  [class.cx-labeled-row--small]=\"size === 'small'\"\n  [class.cx-labeled-row--large]=\"size === 'large'\"\n>\n  @if (hasLabel) {\n    <div class=\"cx-labeled-row__label\">\n      <div class=\"cx-labeled-row__label-line\">\n        <span class=\"cx-labeled-row__label-text\">{{ label }}</span>\n        @if (hasInfoContent()) {\n          <span #infoTrigger class=\"cx-labeled-row__info-trigger\">\n            <cx-icon-button\n              icon=\"info\"\n              size=\"small\"\n              variant=\"transparent\"\n              [ariaLabel]=\"infoAriaLabel\"\n              ariaHasPopup=\"dialog\"\n              [ariaExpanded]=\"infoOpen()\"\n              [ariaControls]=\"infoPopoverId\"\n              (pressed)=\"toggleInfoPopover()\"\n            />\n          </span>\n        }\n      </div>\n      @if (optional) {\n        <span class=\"cx-labeled-row__optional\">Optional</span>\n      }\n\n      @if (hasInfoContent() && infoOpen()) {\n        <cx-popover\n          #infoPopover\n          [open]=\"true\"\n          [owner]=\"infoTriggerElement\"\n          [showBackdrop]=\"true\"\n          [surfaceId]=\"infoPopoverId\"\n          role=\"dialog\"\n          [ariaLabel]=\"infoAriaLabel\"\n          [maxWidth]=\"infoPopoverMaxWidth\"\n          [maxHeight]=\"infoOverlay.maxHeight$()\"\n          [left]=\"infoOverlay.left$()\"\n          [top]=\"infoOverlay.top$()\"\n          [bottom]=\"infoOverlay.bottom$()\"\n          [placement]=\"infoOverlay.placement$()\"\n          (backdropPressed)=\"closeInfoPopover()\"\n        >\n          <div #infoSurfaceFocus class=\"cx-labeled-row__info-content\" tabindex=\"-1\">\n            <ng-content select=\"[infoContent]\" />\n          </div>\n        </cx-popover>\n      }\n    </div>\n  }\n\n  <div class=\"cx-labeled-row__content\">\n    @if (contentInputBound) {\n      @switch (content.kind) {\n        @case ('text') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <div class=\"cx-labeled-row__plain-text\">{{ content.text }}</div>\n          </div>\n        }\n\n        @case ('input') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-text-field\n              [label]=\"''\"\n              [ariaLabel]=\"label\"\n              [value]=\"content.value\"\n              [prependText]=\"content.prependText\"\n              [appendText]=\"content.appendText\"\n              [hint]=\"content.hint\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (valueChange)=\"onInputValueChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('textarea') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-text-area\n              [label]=\"''\"\n              [ariaLabel]=\"label\"\n              [value]=\"content.value\"\n              [hint]=\"content.hint\"\n              [minLines]=\"content.minLines\"\n              [sizing]=\"content.sizing ?? 'resizable'\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (valueChange)=\"onInputValueChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('select') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-dropdown\n              [label]=\"''\"\n              [ariaLabel]=\"label\"\n              [availableValues]=\"content.options\"\n              [value]=\"content.value\"\n              [values]=\"content.values\"\n              [placeholder]=\"content.placeholder ?? 'Select'\"\n              [selection]=\"content.multiple ? 'multiple' : 'single'\"\n              [searchable]=\"content.searchable ?? false\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (valueChange)=\"onSelectValueChange($event)\"\n              (valuesChange)=\"onSelectValuesChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('radio-group') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <div class=\"cx-labeled-row__radio-group-field\">\n              <div class=\"cx-labeled-row__radio-group\">\n                @for (option of content.options; track option.id) {\n                  <cx-radio\n                    [text]=\"option.label\"\n                    [selected]=\"isRadioSelected(option.id)\"\n                    [disabled]=\"content.disabled ?? false\"\n                    (selectedChange)=\"onRadioSelect(option.id)\"\n                  />\n                }\n              </div>\n\n              @if (content.validation) {\n                <cx-validation-message\n                  class=\"cx-labeled-row__group-error\"\n                  [messages]=\"validationMessages(content.validation)\"\n                />\n              }\n            </div>\n          </div>\n        }\n\n        @case ('checkbox') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-checkbox\n              [text]=\"content.label\"\n              [selected]=\"content.checked ?? false\"\n              [disabled]=\"content.disabled ?? false\"\n              (selectedChange)=\"onCheckboxCheckedChange($event)\"\n            />\n            @if (content.validation) {\n              <cx-validation-message\n                class=\"cx-labeled-row__group-error\"\n                [messages]=\"validationMessages(content.validation)\"\n              />\n            }\n          </div>\n        }\n\n        @case ('switch') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-switch\n              [text]=\"content.label\"\n              [selected]=\"content.checked ?? false\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (selectedChange)=\"onSwitchCheckedChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('file-upload') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-file-upload\n              [multiple]=\"content.multiple ?? false\"\n              [files]=\"content.files ?? []\"\n              [buttonText]=\"content.buttonText ?? 'Upload file'\"\n              [buttonIcon]=\"content.buttonIcon ?? 'upload'\"\n              [disabled]=\"content.disabled ?? false\"\n              (fileUpload)=\"onFileUpload($event)\"\n            />\n          </div>\n        }\n\n        @case ('dynamic-fields') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-dynamic-fields\n              [options]=\"content.options\"\n              [fields]=\"content.fields ?? []\"\n              [disabled]=\"content.disabled ?? false\"\n              (fieldsChange)=\"onDynamicFieldsChange($event)\"\n            />\n          </div>\n        }\n      }\n    } @else {\n      <ng-content />\n    }\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;container-type:inline-size}.cx-labeled-row{--cx-labeled-row-label-width: 160px;display:grid;width:100%;grid-template-columns:var(--cx-labeled-row-label-width) minmax(0, 1fr);column-gap:var(--space-sm);align-items:baseline}.cx-labeled-row--small{--cx-labeled-row-label-width: 120px}.cx-labeled-row--large{--cx-labeled-row-label-width: 200px}.cx-labeled-row--no-label{grid-template-columns:minmax(0, 1fr)}:host(.cx-labeled-row--grouped){display:grid;grid-template-columns:subgrid;container-type:normal}:host(.cx-labeled-row--grouped) .cx-labeled-row{grid-column:1/-1}:host(.cx-labeled-row--grouped) .cx-labeled-row:not(.cx-labeled-row--no-label){grid-template-columns:subgrid;column-gap:var(--cx-labeled-row-group-column-gap, var(--space-sm));row-gap:var(--space-2xs)}.cx-labeled-row__label{display:flex;min-width:0;flex-direction:column;align-items:flex-start;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.3}.cx-labeled-row__label-line{display:flex;min-width:0;align-items:center;gap:var(--space-xs)}.cx-labeled-row__label-text{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere}.cx-labeled-row__info-trigger{--cx-icon-button-transparent-color: var(--opacity-high);--cx-icon-button-transparent-hover-background: var(--opacity-low);display:inline-flex;flex:0 0 auto}.cx-labeled-row__info-content{--font-size-body: var(--font-size-body-sm);--font-size-title-1: var(--font-size-body);--font-size-title-2: var(--font-size-body);--font-size-title-3: var(--font-size-body-sm);box-sizing:border-box;width:min(280px,100vw - var(--space-md)*2);max-width:100%;padding:var(--space-sm);color:var(--ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-body);outline:none;text-align:start}.cx-labeled-row__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-labeled-row__content{display:flex;flex-direction:column;min-width:0;gap:var(--space-xs)}.cx-labeled-row__field-shell{display:flex;width:100%;min-width:0;min-height:var(--controller-size);flex-direction:column;justify-content:center}.cx-labeled-row__plain-text{display:flex;min-height:var(--controller-size);align-items:center;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);overflow-wrap:anywhere;white-space:pre-wrap}.cx-labeled-row__radio-group{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-sm)}.cx-labeled-row__radio-group-field{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:var(--space-sm)}.cx-labeled-row__group-error{width:100%}@container (max-width: 300px){.cx-labeled-row:not(.cx-labeled-row--no-label,.cx-labeled-row--small,.cx-labeled-row--large){grid-template-columns:minmax(0, 1fr);row-gap:var(--space-2xs)}}@container (max-width: 260px){.cx-labeled-row--small:not(.cx-labeled-row--no-label){grid-template-columns:minmax(0, 1fr);row-gap:var(--space-2xs)}}@container (max-width: 340px){.cx-labeled-row--large:not(.cx-labeled-row--no-label){grid-template-columns:minmax(0, 1fr);row-gap:var(--space-2xs)}}"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxCheckboxComponent, selector: "cx-checkbox", inputs: ["text", "ariaLabel", "hint", "disabled", "selected", "value"], outputs: ["selectedChange", "valueChange", "focusChange"] }, { kind: "component", type: CxDynamicFieldsComponent, selector: "cx-dynamic-fields", inputs: ["disabled", "options", "fields"], outputs: ["fieldsChange"] }, { kind: "component", type: CxFileUploadComponent, selector: "cx-file-upload", inputs: ["variant", "buttonText", "buttonIcon", "icon", "heading", "hint", "accept", "maxSize", "multiple", "disabled", "files"], outputs: ["fileUpload"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxRadioComponent, selector: "cx-radio", inputs: ["text", "hint", "disabled", "validation", "selected"], outputs: ["selectedChange"] }, { kind: "component", type: CxDropdownComponent, selector: "cx-dropdown", inputs: ["label", "ariaLabel", "name", "transparent", "translations", "placeholder", "size", "optional", "disabled", "loading", "loadingMore", "hasMore", "clearable", "selection", "filterMode", "searchable", "creatable", "hint", "validation", "availableValues", "value", "values"], outputs: ["valueChange", "valuesChange", "create", "focusChange", "clear", "openChange", "queryChange", "loadMore"] }, { kind: "component", type: CxSwitchComponent, selector: "cx-switch", inputs: ["text", "ariaLabel", "hint", "size", "disabled", "validation", "selected"], outputs: ["selectedChange", "focusChange"] }, { kind: "component", type: CxTextAreaComponent, selector: "cx-text-area", inputs: ["label", "ariaLabel", "placeholder", "optional", "monospace", "variant", "focusVariant", "presentation", "layout", "markdown", "disabled", "size", "sizing", "minLines", "maxLines", "maxLength", "lineNumbers", "annotations", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "blurred"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLabeledRowComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-labeled-row', imports: [
                        CommonModule,
                        CxValidationMessageComponent,
                        CxIconButtonComponent,
                        CxCheckboxComponent,
                        CxDynamicFieldsComponent,
                        CxFileUploadComponent,
                        CxTextFieldComponent,
                        CxRadioComponent,
                        CxDropdownComponent,
                        CxSwitchComponent,
                        CxTextAreaComponent,
                        CxPopoverComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-labeled-row\"\n  [class.cx-labeled-row--no-label]=\"!hasLabel\"\n  [class.cx-labeled-row--small]=\"size === 'small'\"\n  [class.cx-labeled-row--large]=\"size === 'large'\"\n>\n  @if (hasLabel) {\n    <div class=\"cx-labeled-row__label\">\n      <div class=\"cx-labeled-row__label-line\">\n        <span class=\"cx-labeled-row__label-text\">{{ label }}</span>\n        @if (hasInfoContent()) {\n          <span #infoTrigger class=\"cx-labeled-row__info-trigger\">\n            <cx-icon-button\n              icon=\"info\"\n              size=\"small\"\n              variant=\"transparent\"\n              [ariaLabel]=\"infoAriaLabel\"\n              ariaHasPopup=\"dialog\"\n              [ariaExpanded]=\"infoOpen()\"\n              [ariaControls]=\"infoPopoverId\"\n              (pressed)=\"toggleInfoPopover()\"\n            />\n          </span>\n        }\n      </div>\n      @if (optional) {\n        <span class=\"cx-labeled-row__optional\">Optional</span>\n      }\n\n      @if (hasInfoContent() && infoOpen()) {\n        <cx-popover\n          #infoPopover\n          [open]=\"true\"\n          [owner]=\"infoTriggerElement\"\n          [showBackdrop]=\"true\"\n          [surfaceId]=\"infoPopoverId\"\n          role=\"dialog\"\n          [ariaLabel]=\"infoAriaLabel\"\n          [maxWidth]=\"infoPopoverMaxWidth\"\n          [maxHeight]=\"infoOverlay.maxHeight$()\"\n          [left]=\"infoOverlay.left$()\"\n          [top]=\"infoOverlay.top$()\"\n          [bottom]=\"infoOverlay.bottom$()\"\n          [placement]=\"infoOverlay.placement$()\"\n          (backdropPressed)=\"closeInfoPopover()\"\n        >\n          <div #infoSurfaceFocus class=\"cx-labeled-row__info-content\" tabindex=\"-1\">\n            <ng-content select=\"[infoContent]\" />\n          </div>\n        </cx-popover>\n      }\n    </div>\n  }\n\n  <div class=\"cx-labeled-row__content\">\n    @if (contentInputBound) {\n      @switch (content.kind) {\n        @case ('text') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <div class=\"cx-labeled-row__plain-text\">{{ content.text }}</div>\n          </div>\n        }\n\n        @case ('input') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-text-field\n              [label]=\"''\"\n              [ariaLabel]=\"label\"\n              [value]=\"content.value\"\n              [prependText]=\"content.prependText\"\n              [appendText]=\"content.appendText\"\n              [hint]=\"content.hint\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (valueChange)=\"onInputValueChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('textarea') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-text-area\n              [label]=\"''\"\n              [ariaLabel]=\"label\"\n              [value]=\"content.value\"\n              [hint]=\"content.hint\"\n              [minLines]=\"content.minLines\"\n              [sizing]=\"content.sizing ?? 'resizable'\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (valueChange)=\"onInputValueChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('select') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-dropdown\n              [label]=\"''\"\n              [ariaLabel]=\"label\"\n              [availableValues]=\"content.options\"\n              [value]=\"content.value\"\n              [values]=\"content.values\"\n              [placeholder]=\"content.placeholder ?? 'Select'\"\n              [selection]=\"content.multiple ? 'multiple' : 'single'\"\n              [searchable]=\"content.searchable ?? false\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (valueChange)=\"onSelectValueChange($event)\"\n              (valuesChange)=\"onSelectValuesChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('radio-group') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <div class=\"cx-labeled-row__radio-group-field\">\n              <div class=\"cx-labeled-row__radio-group\">\n                @for (option of content.options; track option.id) {\n                  <cx-radio\n                    [text]=\"option.label\"\n                    [selected]=\"isRadioSelected(option.id)\"\n                    [disabled]=\"content.disabled ?? false\"\n                    (selectedChange)=\"onRadioSelect(option.id)\"\n                  />\n                }\n              </div>\n\n              @if (content.validation) {\n                <cx-validation-message\n                  class=\"cx-labeled-row__group-error\"\n                  [messages]=\"validationMessages(content.validation)\"\n                />\n              }\n            </div>\n          </div>\n        }\n\n        @case ('checkbox') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-checkbox\n              [text]=\"content.label\"\n              [selected]=\"content.checked ?? false\"\n              [disabled]=\"content.disabled ?? false\"\n              (selectedChange)=\"onCheckboxCheckedChange($event)\"\n            />\n            @if (content.validation) {\n              <cx-validation-message\n                class=\"cx-labeled-row__group-error\"\n                [messages]=\"validationMessages(content.validation)\"\n              />\n            }\n          </div>\n        }\n\n        @case ('switch') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-switch\n              [text]=\"content.label\"\n              [selected]=\"content.checked ?? false\"\n              [disabled]=\"content.disabled ?? false\"\n              [validation]=\"content.validation\"\n              (selectedChange)=\"onSwitchCheckedChange($event)\"\n            />\n          </div>\n        }\n\n        @case ('file-upload') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-file-upload\n              [multiple]=\"content.multiple ?? false\"\n              [files]=\"content.files ?? []\"\n              [buttonText]=\"content.buttonText ?? 'Upload file'\"\n              [buttonIcon]=\"content.buttonIcon ?? 'upload'\"\n              [disabled]=\"content.disabled ?? false\"\n              (fileUpload)=\"onFileUpload($event)\"\n            />\n          </div>\n        }\n\n        @case ('dynamic-fields') {\n          <div class=\"cx-labeled-row__field-shell\">\n            <cx-dynamic-fields\n              [options]=\"content.options\"\n              [fields]=\"content.fields ?? []\"\n              [disabled]=\"content.disabled ?? false\"\n              (fieldsChange)=\"onDynamicFieldsChange($event)\"\n            />\n          </div>\n        }\n      }\n    } @else {\n      <ng-content />\n    }\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;container-type:inline-size}.cx-labeled-row{--cx-labeled-row-label-width: 160px;display:grid;width:100%;grid-template-columns:var(--cx-labeled-row-label-width) minmax(0, 1fr);column-gap:var(--space-sm);align-items:baseline}.cx-labeled-row--small{--cx-labeled-row-label-width: 120px}.cx-labeled-row--large{--cx-labeled-row-label-width: 200px}.cx-labeled-row--no-label{grid-template-columns:minmax(0, 1fr)}:host(.cx-labeled-row--grouped){display:grid;grid-template-columns:subgrid;container-type:normal}:host(.cx-labeled-row--grouped) .cx-labeled-row{grid-column:1/-1}:host(.cx-labeled-row--grouped) .cx-labeled-row:not(.cx-labeled-row--no-label){grid-template-columns:subgrid;column-gap:var(--cx-labeled-row-group-column-gap, var(--space-sm));row-gap:var(--space-2xs)}.cx-labeled-row__label{display:flex;min-width:0;flex-direction:column;align-items:flex-start;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:1.3}.cx-labeled-row__label-line{display:flex;min-width:0;align-items:center;gap:var(--space-xs)}.cx-labeled-row__label-text{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere}.cx-labeled-row__info-trigger{--cx-icon-button-transparent-color: var(--opacity-high);--cx-icon-button-transparent-hover-background: var(--opacity-low);display:inline-flex;flex:0 0 auto}.cx-labeled-row__info-content{--font-size-body: var(--font-size-body-sm);--font-size-title-1: var(--font-size-body);--font-size-title-2: var(--font-size-body);--font-size-title-3: var(--font-size-body-sm);box-sizing:border-box;width:min(280px,100vw - var(--space-md)*2);max-width:100%;padding:var(--space-sm);color:var(--ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-body);outline:none;text-align:start}.cx-labeled-row__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-labeled-row__content{display:flex;flex-direction:column;min-width:0;gap:var(--space-xs)}.cx-labeled-row__field-shell{display:flex;width:100%;min-width:0;min-height:var(--controller-size);flex-direction:column;justify-content:center}.cx-labeled-row__plain-text{display:flex;min-height:var(--controller-size);align-items:center;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);overflow-wrap:anywhere;white-space:pre-wrap}.cx-labeled-row__radio-group{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-sm)}.cx-labeled-row__radio-group-field{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:var(--space-sm)}.cx-labeled-row__group-error{width:100%}@container (max-width: 300px){.cx-labeled-row:not(.cx-labeled-row--no-label,.cx-labeled-row--small,.cx-labeled-row--large){grid-template-columns:minmax(0, 1fr);row-gap:var(--space-2xs)}}@container (max-width: 260px){.cx-labeled-row--small:not(.cx-labeled-row--no-label){grid-template-columns:minmax(0, 1fr);row-gap:var(--space-2xs)}}@container (max-width: 340px){.cx-labeled-row--large:not(.cx-labeled-row--no-label){grid-template-columns:minmax(0, 1fr);row-gap:var(--space-2xs)}}"] }]
        }], ctorParameters: () => [], propDecorators: { infoContent: [{ type: i0.ContentChild, args: [i0.forwardRef(() => CxLabeledRowInfoDirective), { isSignal: true }] }], infoTriggerRef: [{ type: i0.ViewChild, args: ['infoTrigger', { isSignal: true }] }], infoPopoverRef: [{ type: i0.ViewChild, args: ['infoPopover', { isSignal: true }] }], infoSurfaceFocusRef: [{ type: i0.ViewChild, args: ['infoSurfaceFocus', { isSignal: true }] }], grouped: [{
                type: HostBinding,
                args: ['class.cx-labeled-row--grouped']
            }], label: [{
                type: Input
            }], size: [{
                type: Input
            }], optional: [{
                type: Input
            }], content: [{
                type: Input
            }], inputValueChange: [{
                type: Output
            }], selectValueChange: [{
                type: Output
            }], selectValuesChange: [{
                type: Output
            }], radioValueChange: [{
                type: Output
            }], checkboxCheckedChange: [{
                type: Output
            }], switchCheckedChange: [{
                type: Output
            }], fileUploadChange: [{
                type: Output
            }], dynamicFieldsChange: [{
                type: Output
            }] } });
