import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewChildren, computed, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
const CODE_FIELD_LENGTH = 6;
const FILTER_REGEX = {
    numeric: /[^0-9]/g,
    alphanumeric: /[^A-Z0-9]/g,
};
function createEmptyCells() {
    return Array.from({ length: CODE_FIELD_LENGTH }, () => '');
}
function cellsEqual(left, right) {
    return left.length === right.length && left.every((cell, index) => cell === right[index]);
}
export class CxCodeFieldComponent {
    static nextId = 0;
    modeState = signal('numeric', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "modeState" }] : /* istanbul ignore next */ []));
    cellsState = signal(createEmptyCells(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "cellsState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    focusedIndexState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedIndexState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    blurTimer;
    inputRunComplete = false;
    lastEmittedValue;
    labelId = `cx-code-field-label-${++CxCodeFieldComponent.nextId}`;
    messagesId = `cx-code-field-messages-${CxCodeFieldComponent.nextId}`;
    cellsRef;
    cellInputs;
    label = 'Verification code';
    ariaLabel;
    hint;
    optional = false;
    autoFocus = false;
    set mode(value) {
        this.modeState.set(value === 'alphanumeric' ? 'alphanumeric' : 'numeric');
        this.inputRunComplete = false;
        this.setCellsFromExternalValue(this.currentValue());
    }
    set value(value) {
        const nextValue = this.filterValue(value ?? '').slice(0, CODE_FIELD_LENGTH);
        // A parent echoing our own emission back is not an external change; it
        // must not reset interaction state like inputRunComplete mid-typing.
        if (this.lastEmittedValue === nextValue) {
            this.lastEmittedValue = undefined;
            return;
        }
        this.inputRunComplete = false;
        this.setCellsFromExternalValue(nextValue);
    }
    set disabled(value) {
        this.disabledState.set(value === true);
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    valueChange = new EventEmitter();
    complete = new EventEmitter();
    focusChange = new EventEmitter();
    mode$ = this.modeState.asReadonly();
    disabled$ = this.disabledState.asReadonly();
    focused$ = this.focusedState.asReadonly();
    isInteractive$ = computed(() => !this.disabledState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isInteractive$" }] : /* istanbul ignore next */ []));
    inputMode$ = computed(() => (this.modeState() === 'numeric' ? 'numeric' : 'text'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "inputMode$" }] : /* istanbul ignore next */ []));
    pattern$ = computed(() => (this.modeState() === 'numeric' ? '[0-9]*' : '[A-Z0-9]*'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pattern$" }] : /* istanbul ignore next */ []));
    cells$ = this.cellsState.asReadonly();
    activeIndex$ = computed(() => {
        if (!this.focusedState()) {
            return -1;
        }
        return Math.min(this.focusedIndexState(), CODE_FIELD_LENGTH - 1);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeIndex$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => {
        if (this.disabledState()) {
            return [];
        }
        return normalizeCxValidation(this.validationState());
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    get resolvedAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        if (this.label.trim()) {
            return undefined;
        }
        return 'Verification code';
    }
    get resolvedAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedAriaDescribedBy() {
        return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
    }
    ngOnDestroy() {
        this.clearBlurTimer();
    }
    clear() {
        if (!this.currentValue()) {
            return;
        }
        this.inputRunComplete = false;
        this.syncCells(createEmptyCells(), { emitComplete: false });
    }
    focus() {
        this.focusCell(this.firstEditableIndex());
    }
    cellAriaLabel(index) {
        const base = this.ariaLabel?.trim() || this.label.trim() || 'Verification code';
        return `${base}, character ${index + 1} of ${CODE_FIELD_LENGTH}`;
    }
    onCellInput(index, event) {
        if (!this.isInteractive$()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const value = this.filterValue(target.value);
        if (!value) {
            this.setCell(index, '');
            target.value = '';
            return;
        }
        this.inputRunComplete = false;
        this.writeTextFrom(index, value);
    }
    onCellFocus(index) {
        if (this.disabledState()) {
            return;
        }
        this.clearBlurTimer();
        this.focusedIndexState.set(index);
        if (!this.focusedState()) {
            this.focusedState.set(true);
            this.focusChange.emit(true);
        }
        this.selectCell(index);
    }
    onCellBlur() {
        this.clearBlurTimer();
        this.blurTimer = setTimeout(() => {
            const activeElement = document.activeElement;
            const stillInside = !!activeElement && !!this.cellsRef?.nativeElement.contains(activeElement);
            if (stillInside) {
                return;
            }
            this.inputRunComplete = false;
            this.focusedState.set(false);
            this.focusChange.emit(false);
        }, 0);
    }
    onCellClick(index) {
        if (!this.isInteractive$()) {
            return;
        }
        this.inputRunComplete = false;
        this.focusedIndexState.set(index);
        this.selectCell(index);
    }
    onCellKeydown(_index, event) {
        if (!this.isInteractive$()) {
            return;
        }
        const currentIndex = this.clampIndex(this.focusedIndexState());
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.inputRunComplete = false;
            this.focusCell(currentIndex - 1);
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.inputRunComplete = false;
            this.focusCell(currentIndex + 1);
            return;
        }
        if (event.key === 'Home') {
            event.preventDefault();
            this.inputRunComplete = false;
            this.focusCell(0);
            return;
        }
        if (event.key === 'End') {
            event.preventDefault();
            this.inputRunComplete = false;
            this.focusCell(CODE_FIELD_LENGTH - 1);
            return;
        }
        if (event.key === 'Backspace') {
            event.preventDefault();
            this.inputRunComplete = false;
            if (this.cells$()[currentIndex]) {
                this.setCell(currentIndex, '');
                this.focusCell(currentIndex);
                return;
            }
            this.setCell(currentIndex - 1, '');
            this.focusCell(currentIndex - 1);
            return;
        }
        if (event.key === 'Delete') {
            event.preventDefault();
            this.inputRunComplete = false;
            this.setCell(currentIndex, '');
            this.focusCell(currentIndex);
            return;
        }
        if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) {
            return;
        }
        const value = this.filterValue(event.key);
        event.preventDefault();
        if (!value) {
            return;
        }
        if (this.inputRunComplete && currentIndex === CODE_FIELD_LENGTH - 1 && this.isComplete()) {
            return;
        }
        this.writeTextFrom(currentIndex, value);
    }
    onCellPaste(index, event) {
        if (!this.isInteractive$()) {
            return;
        }
        const text = event.clipboardData?.getData('text') ?? '';
        const value = this.filterValue(text);
        if (!value) {
            return;
        }
        event.preventDefault();
        this.inputRunComplete = false;
        this.writeTextFrom(index, value);
    }
    syncCells(cells, options) {
        const previousCells = this.cellsState();
        const nextCells = this.normalizeCells(cells);
        if (cellsEqual(previousCells, nextCells)) {
            return;
        }
        const previousValue = this.currentValue();
        this.cellsState.set(nextCells);
        const nextValue = this.currentValue();
        if (nextValue !== previousValue) {
            this.lastEmittedValue = nextValue;
            this.valueChange.emit(nextValue);
        }
        if (options.emitComplete && this.isComplete()) {
            this.complete.emit(nextValue);
        }
    }
    writeTextFrom(index, value) {
        const cells = this.currentCells();
        let writeIndex = this.clampIndex(index);
        for (const character of value) {
            if (writeIndex >= CODE_FIELD_LENGTH) {
                break;
            }
            cells[writeIndex] = character;
            writeIndex += 1;
        }
        this.syncCells(cells, { emitComplete: true });
        this.inputRunComplete = writeIndex >= CODE_FIELD_LENGTH && this.isComplete();
        this.focusCell(Math.min(writeIndex, CODE_FIELD_LENGTH - 1));
    }
    setCell(index, value) {
        if (index < 0 || index >= CODE_FIELD_LENGTH) {
            return;
        }
        const cells = this.currentCells();
        cells[index] = this.filterValue(value).slice(0, 1);
        this.syncCells(cells, { emitComplete: true });
    }
    currentCells() {
        return [...this.cellsState()];
    }
    currentValue() {
        return this.cellsState().join('');
    }
    setCellsFromExternalValue(value) {
        const cells = createEmptyCells();
        for (const [index, character] of this.filterValue(value).slice(0, CODE_FIELD_LENGTH).split('').entries()) {
            cells[index] = character;
        }
        this.cellsState.set(cells);
    }
    normalizeCells(cells) {
        return Array.from({ length: CODE_FIELD_LENGTH }, (_, index) => this.filterValue(cells[index] ?? '').slice(0, 1));
    }
    firstEditableIndex() {
        const emptyIndex = this.cellsState().findIndex(cell => !cell);
        return emptyIndex >= 0 ? emptyIndex : CODE_FIELD_LENGTH - 1;
    }
    isComplete() {
        return this.cellsState().every(Boolean);
    }
    focusCell(index) {
        const nextIndex = this.clampIndex(index);
        this.focusedIndexState.set(nextIndex);
        const existingInput = this.cellInputs?.get(nextIndex)?.nativeElement;
        if (existingInput && !existingInput.disabled) {
            existingInput.focus();
            existingInput.select();
            return;
        }
        requestAnimationFrame(() => {
            const input = this.cellInputs?.get(nextIndex)?.nativeElement;
            if (!input || input.disabled) {
                return;
            }
            input.focus();
            input.select();
        });
    }
    selectCell(index) {
        requestAnimationFrame(() => {
            this.cellInputs?.get(index)?.nativeElement.select();
        });
    }
    clampIndex(index) {
        return Math.max(0, Math.min(CODE_FIELD_LENGTH - 1, index));
    }
    clearBlurTimer() {
        if (this.blurTimer === undefined) {
            return;
        }
        clearTimeout(this.blurTimer);
        this.blurTimer = undefined;
    }
    filterValue(raw) {
        const normalized = this.modeState() === 'alphanumeric' ? raw.toUpperCase() : raw;
        return normalized.replace(FILTER_REGEX[this.modeState()], '');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCodeFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxCodeFieldComponent, isStandalone: true, selector: "cx-code-field", inputs: { label: "label", ariaLabel: "ariaLabel", hint: "hint", optional: "optional", autoFocus: "autoFocus", mode: "mode", value: "value", disabled: "disabled", validation: "validation" }, outputs: { valueChange: "valueChange", complete: "complete", focusChange: "focusChange" }, viewQueries: [{ propertyName: "cellsRef", first: true, predicate: ["cells"], descendants: true, read: ElementRef }, { propertyName: "cellInputs", predicate: ["cellInput"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-code-field\"\n  [class.cx-code-field--disabled]=\"disabled$()\"\n  [class.cx-code-field--error]=\"hasError$()\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-code-field__header\">\n      <div class=\"cx-code-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-code-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    #cells\n    class=\"cx-code-field__cells\"\n    role=\"group\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n  >\n    @for (cell of cells$(); track $index) {\n      <input\n        #cellInput\n        class=\"cx-code-field__cell\"\n        type=\"text\"\n        maxlength=\"1\"\n        autocorrect=\"off\"\n        spellcheck=\"false\"\n        [class.cx-code-field__cell--active]=\"focused$() && $index === activeIndex$()\"\n        [attr.autocomplete]=\"$index === 0 ? 'one-time-code' : 'off'\"\n        [attr.inputmode]=\"inputMode$()\"\n        [attr.pattern]=\"pattern$()\"\n        [attr.autocapitalize]=\"mode$() === 'alphanumeric' ? 'characters' : 'none'\"\n        [attr.aria-label]=\"cellAriaLabel($index)\"\n        [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        [disabled]=\"disabled$()\"\n        [value]=\"cell\"\n        [autofocus]=\"autoFocus && $index === 0\"\n        (input)=\"onCellInput($index, $event)\"\n        (focus)=\"onCellFocus($index)\"\n        (blur)=\"onCellBlur()\"\n        (click)=\"onCellClick($index)\"\n        (keydown)=\"onCellKeydown($index, $event)\"\n        (paste)=\"onCellPaste($index, $event)\"\n      />\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-code-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-code-field__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:calc(288px + var(--space-sm)*5);max-width:100%;box-sizing:border-box;container-type:inline-size}.cx-code-field{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-code-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:0}.cx-code-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-code-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-code-field--disabled{opacity:var(--opacity-disabled, 0.45)}.cx-code-field__cells{display:grid;width:100%;min-width:0;grid-template-columns:repeat(6, minmax(0, 1fr));gap:var(--space-sm);border-radius:var(--radius-sm)}.cx-code-field__cell{--cx-code-field-cell-size: calc((100cqw - (var(--space-sm) * 5)) / 6);position:relative;display:inline-flex;width:100%;min-width:0;height:clamp(44px,var(--cx-code-field-cell-size)*1.1667,56px);align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-xl);appearance:none;background:var(--surface);color:var(--ink);caret-color:var(--primary);cursor:text;font-family:var(--font-family-mono);font-size:clamp(var(--font-size-title-2),var(--cx-code-field-cell-size)*.5,var(--font-size-title-1));font-weight:var(--font-weight-medium);font-variant-numeric:tabular-nums;line-height:1;margin:0;outline:none;padding:0;text-align:center;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-code-field:not(.cx-code-field--error) .cx-code-field__cell:not(:disabled):hover{border-color:var(--opacity-mid)}.cx-code-field__cell--active{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}.cx-code-field__cell:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-code-field__cell:disabled{cursor:default}.cx-code-field--error .cx-code-field__cell{border-color:var(--danger);caret-color:var(--danger)}.cx-code-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:0}.cx-code-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"], dependencies: [{ kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCodeFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-code-field', imports: [CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-code-field\"\n  [class.cx-code-field--disabled]=\"disabled$()\"\n  [class.cx-code-field--error]=\"hasError$()\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-code-field__header\">\n      <div class=\"cx-code-field__label\" [id]=\"labelId\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-code-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    #cells\n    class=\"cx-code-field__cells\"\n    role=\"group\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [attr.aria-labelledby]=\"resolvedAriaLabelledBy\"\n  >\n    @for (cell of cells$(); track $index) {\n      <input\n        #cellInput\n        class=\"cx-code-field__cell\"\n        type=\"text\"\n        maxlength=\"1\"\n        autocorrect=\"off\"\n        spellcheck=\"false\"\n        [class.cx-code-field__cell--active]=\"focused$() && $index === activeIndex$()\"\n        [attr.autocomplete]=\"$index === 0 ? 'one-time-code' : 'off'\"\n        [attr.inputmode]=\"inputMode$()\"\n        [attr.pattern]=\"pattern$()\"\n        [attr.autocapitalize]=\"mode$() === 'alphanumeric' ? 'characters' : 'none'\"\n        [attr.aria-label]=\"cellAriaLabel($index)\"\n        [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        [disabled]=\"disabled$()\"\n        [value]=\"cell\"\n        [autofocus]=\"autoFocus && $index === 0\"\n        (input)=\"onCellInput($index, $event)\"\n        (focus)=\"onCellFocus($index)\"\n        (blur)=\"onCellBlur()\"\n        (click)=\"onCellClick($index)\"\n        (keydown)=\"onCellKeydown($index, $event)\"\n        (paste)=\"onCellPaste($index, $event)\"\n      />\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-code-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-code-field__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:calc(288px + var(--space-sm)*5);max-width:100%;box-sizing:border-box;container-type:inline-size}.cx-code-field{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-code-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:0}.cx-code-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-code-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-code-field--disabled{opacity:var(--opacity-disabled, 0.45)}.cx-code-field__cells{display:grid;width:100%;min-width:0;grid-template-columns:repeat(6, minmax(0, 1fr));gap:var(--space-sm);border-radius:var(--radius-sm)}.cx-code-field__cell{--cx-code-field-cell-size: calc((100cqw - (var(--space-sm) * 5)) / 6);position:relative;display:inline-flex;width:100%;min-width:0;height:clamp(44px,var(--cx-code-field-cell-size)*1.1667,56px);align-items:center;justify-content:center;border:var(--line);border-radius:var(--radius-xl);appearance:none;background:var(--surface);color:var(--ink);caret-color:var(--primary);cursor:text;font-family:var(--font-family-mono);font-size:clamp(var(--font-size-title-2),var(--cx-code-field-cell-size)*.5,var(--font-size-title-1));font-weight:var(--font-weight-medium);font-variant-numeric:tabular-nums;line-height:1;margin:0;outline:none;padding:0;text-align:center;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-code-field:not(.cx-code-field--error) .cx-code-field__cell:not(:disabled):hover{border-color:var(--opacity-mid)}.cx-code-field__cell--active{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}.cx-code-field__cell:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-code-field__cell:disabled{cursor:default}.cx-code-field--error .cx-code-field__cell{border-color:var(--danger);caret-color:var(--danger)}.cx-code-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:0}.cx-code-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"] }]
        }], propDecorators: { cellsRef: [{
                type: ViewChild,
                args: ['cells', { read: ElementRef }]
            }], cellInputs: [{
                type: ViewChildren,
                args: ['cellInput', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], hint: [{
                type: Input
            }], optional: [{
                type: Input
            }], autoFocus: [{
                type: Input
            }], mode: [{
                type: Input
            }], value: [{
                type: Input
            }], disabled: [{
                type: Input
            }], validation: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], complete: [{
                type: Output
            }], focusChange: [{
                type: Output
            }] } });
