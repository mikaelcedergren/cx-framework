import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, afterRenderEffect, computed, signal } from '@angular/core';
import { marked } from 'marked';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation, normalizeCxValidationMessages, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export class CxTextAreaComponent {
    static nextId = 0;
    valueState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    markdownState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "markdownState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    sizeState = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sizeState" }] : /* istanbul ignore next */ []));
    sizingState = signal('resizable', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sizingState" }] : /* istanbul ignore next */ []));
    minLinesState = signal(3, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minLinesState" }] : /* istanbul ignore next */ []));
    maxLinesState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxLinesState" }] : /* istanbul ignore next */ []));
    maxLengthState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxLengthState" }] : /* istanbul ignore next */ []));
    lineNumbersState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "lineNumbersState" }] : /* istanbul ignore next */ []));
    annotationsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "annotationsState" }] : /* istanbul ignore next */ []));
    scrollTopState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "scrollTopState" }] : /* istanbul ignore next */ []));
    hintState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hintState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    fieldRef;
    label = 'Label';
    ariaLabel;
    placeholder;
    optional = false;
    monospace = false;
    variant = 'default';
    focusVariant = 'default';
    layout = 'default';
    presentation = 'default';
    set markdown(value) {
        this.markdownState.set(!!value);
    }
    set disabled(value) {
        this.disabledState.set(!!value);
    }
    set size(value) {
        this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
    }
    set sizing(value) {
        this.sizingState.set(value === 'fixed' || value === 'auto' || value === 'resizable' ? value : 'resizable');
    }
    set minLines(value) {
        this.minLinesState.set(this.normalizeLineCount(value, 3));
    }
    set maxLines(value) {
        this.maxLinesState.set(this.normalizeOptionalCount(value));
    }
    set maxLength(value) {
        this.maxLengthState.set(this.normalizeOptionalCount(value));
    }
    set lineNumbers(value) {
        this.lineNumbersState.set(!!value);
    }
    set annotations(value) {
        this.annotationsState.set(value ?? []);
    }
    set hint(value) {
        this.hintState.set(value);
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set value(value) {
        this.valueState.set(this.normalizeValueForLimits(value ?? ''));
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    blurred = new EventEmitter();
    messagesId = `cx-text-area-messages-${CxTextAreaComponent.nextId++}`;
    get resolvedAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        const label = this.label.trim();
        return label || undefined;
    }
    get resolvedAriaDescribedBy() {
        return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
    }
    value$ = this.valueState.asReadonly();
    disabled$ = this.disabledState.asReadonly();
    size$ = this.sizeState.asReadonly();
    sizing$ = this.sizingState.asReadonly();
    minLines$ = this.minLinesState.asReadonly();
    maxLines$ = computed(() => {
        const maxLines = this.maxLinesState();
        return maxLines === undefined ? undefined : Math.max(this.minLinesState(), maxLines);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxLines$" }] : /* istanbul ignore next */ []));
    maxLength$ = this.maxLengthState.asReadonly();
    isFocused$ = computed(() => this.focusedState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isFocused$" }] : /* istanbul ignore next */ []));
    normalizedAnnotations$ = computed(() => {
        const normalized = [];
        this.annotationsState().forEach((annotation, index) => {
            const line = Math.max(1, Math.floor(annotation.line));
            if (!Number.isFinite(line) || !this.isAnnotationMood(annotation.mood)) {
                return;
            }
            if (annotation.kind === 'range') {
                const startIndex = Math.max(0, Math.floor(annotation.startIndex));
                const endIndex = Math.max(0, Math.floor(annotation.endIndex));
                if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || endIndex <= startIndex) {
                    return;
                }
                normalized.push({ ...annotation, line, startIndex, endIndex, order: index });
                return;
            }
            normalized.push({ ...annotation, line, order: index });
        });
        return normalized.sort((left, right) => left.line - right.line || left.order - right.order);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "normalizedAnnotations$" }] : /* istanbul ignore next */ []));
    visibleLineCount$ = computed(() => Math.max(1, this.valueState().split(/\r?\n/).length, this.minLinesState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleLineCount$" }] : /* istanbul ignore next */ []));
    visibleAnnotations$ = computed(() => {
        const lines = this.valueState().split(/\r?\n/);
        const visibleLineCount = this.visibleLineCount$();
        return this.normalizedAnnotations$().filter((annotation) => {
            if (annotation.line > visibleLineCount) {
                return false;
            }
            if (annotation.kind === 'line') {
                return true;
            }
            const text = lines[annotation.line - 1] ?? '';
            const clippedStart = Math.min(annotation.startIndex, text.length);
            const clippedEnd = Math.min(annotation.endIndex, text.length);
            return clippedEnd > clippedStart;
        });
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleAnnotations$" }] : /* istanbul ignore next */ []));
    showLineNumbers$ = computed(() => this.lineNumbersState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showLineNumbers$" }] : /* istanbul ignore next */ []));
    showFullLineAnnotations$ = computed(() => this.visibleAnnotations$().some((annotation) => annotation.kind === 'line'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showFullLineAnnotations$" }] : /* istanbul ignore next */ []));
    showRangeAnnotations$ = computed(() => this.visibleAnnotations$().some((annotation) => annotation.kind === 'range'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showRangeAnnotations$" }] : /* istanbul ignore next */ []));
    showGutterIconColumn$ = computed(() => this.renderedLines$().some((line) => line.iconMood !== undefined), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showGutterIconColumn$" }] : /* istanbul ignore next */ []));
    showGutter$ = computed(() => this.showLineNumbers$() || this.showGutterIconColumn$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showGutter$" }] : /* istanbul ignore next */ []));
    renderedLines$ = computed(() => {
        const textLines = this.valueState().split(/\r?\n/);
        const total = this.visibleLineCount$();
        return Array.from({ length: total }, (_, index) => {
            const number = index + 1;
            const text = textLines[index] ?? '';
            const annotations = this.visibleAnnotations$().filter((annotation) => annotation.line === number);
            const lineAnnotations = annotations.filter((annotation) => annotation.kind === 'line');
            const rangeAnnotations = annotations.filter((annotation) => annotation.kind === 'range');
            const iconMood = this.iconMoodForAnnotations(annotations);
            return {
                number,
                mood: this.dominantMood(lineAnnotations.map((annotation) => annotation.mood)),
                iconMood,
                segments: this.renderSegments(text, rangeAnnotations),
            };
        });
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedLines$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => {
        if (this.disabledState()) {
            return [];
        }
        const messages = [...normalizeCxValidation(this.validationState())];
        for (const annotation of this.visibleAnnotations$()) {
            const message = annotation.message?.trim();
            if (annotation.mood === 'danger' && message) {
                messages.push({ type: 'error', message: `Line ${annotation.line}: ${message}` });
            }
        }
        return normalizeCxValidationMessages(messages);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    hint$ = computed(() => this.hintState()?.trim() || undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hint$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => !!this.hint$() && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    gutterTransform$ = computed(() => `translateY(-${this.scrollTopState()}px)`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "gutterTransform$" }] : /* istanbul ignore next */ []));
    markdown$ = this.markdownState.asReadonly();
    showMarkdownPreview$ = computed(() => this.markdownState() && !this.isFocused$() && this.valueState().trim().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showMarkdownPreview$" }] : /* istanbul ignore next */ []));
    renderedMarkdown$ = computed(() => {
        const raw = this.valueState().trim();
        if (!raw)
            return '';
        return marked.parse(raw);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedMarkdown$" }] : /* istanbul ignore next */ []));
    dominantMood(moods) {
        if (moods.includes('danger')) {
            return 'danger';
        }
        if (moods.includes('success')) {
            return 'success';
        }
        return undefined;
    }
    iconMoodForAnnotations(annotations) {
        return this.dominantMood(annotations.map((annotation) => annotation.mood));
    }
    renderSegments(text, annotations) {
        if (!text || annotations.length === 0) {
            return text ? [{ text }] : [{ text: ' ' }];
        }
        const clipped = annotations
            .map((annotation) => ({
            ...annotation,
            startIndex: Math.min(annotation.startIndex, text.length),
            endIndex: Math.min(annotation.endIndex, text.length),
        }))
            .filter((annotation) => annotation.endIndex > annotation.startIndex);
        const boundaries = new Set([0, text.length]);
        for (const annotation of clipped) {
            boundaries.add(annotation.startIndex);
            boundaries.add(annotation.endIndex);
        }
        const sortedBoundaries = Array.from(boundaries).sort((left, right) => left - right);
        const segments = [];
        for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
            const startIndex = sortedBoundaries[index];
            const endIndex = sortedBoundaries[index + 1];
            const segmentText = text.slice(startIndex, endIndex);
            const mood = this.dominantMood(clipped
                .filter((annotation) => annotation.startIndex < endIndex && annotation.endIndex > startIndex)
                .map((annotation) => annotation.mood));
            const previous = segments.at(-1);
            if (previous && previous.mood === mood) {
                previous.text += segmentText;
            }
            else {
                segments.push(mood ? { text: segmentText, mood } : { text: segmentText });
            }
        }
        return segments.length > 0 ? segments : [{ text: ' ' }];
    }
    isAnnotationMood(value) {
        return value === 'success' || value === 'danger';
    }
    constructor() {
        afterRenderEffect(() => {
            this.valueState();
            this.sizingState();
            this.minLinesState();
            this.maxLines$();
            this.sizeState();
            this.resizeField();
        });
    }
    focus() {
        this.fieldRef?.nativeElement.focus();
    }
    onPreviewClick(event) {
        const previewEl = event.currentTarget;
        const clickedBlock = event.target?.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');
        const caretDoc = document;
        const range = caretDoc.caretRangeFromPoint
            ? caretDoc.caretRangeFromPoint(event.clientX, event.clientY)
            : null;
        const raw = this.valueState();
        let cursor = raw.length;
        if (clickedBlock && previewEl.contains(clickedBlock)) {
            const blockStart = this.findBlockStartInRaw(raw, clickedBlock.textContent ?? '');
            if (blockStart >= 0) {
                const offsetInBlock = range && clickedBlock.contains(range.startContainer)
                    ? this.textOffsetWithin(clickedBlock, range.startContainer, range.startOffset)
                    : (clickedBlock.textContent ?? '').length;
                cursor = blockStart + offsetInBlock;
            }
        }
        this.focus();
        queueMicrotask(() => {
            const textarea = this.fieldRef?.nativeElement;
            if (!textarea)
                return;
            const clamped = Math.max(0, Math.min(cursor, textarea.value.length));
            textarea.setSelectionRange(clamped, clamped);
        });
    }
    findBlockStartInRaw(raw, blockText) {
        const trimmed = blockText.trim();
        if (!trimmed)
            return -1;
        const longProbe = trimmed.slice(0, Math.min(40, trimmed.length));
        let idx = raw.indexOf(longProbe);
        if (idx >= 0)
            return idx;
        const firstWord = trimmed.split(/\s+/)[0];
        if (firstWord) {
            idx = raw.indexOf(firstWord);
            if (idx >= 0)
                return idx;
        }
        return -1;
    }
    textOffsetWithin(root, target, targetOffset) {
        if (target === root) {
            let sum = 0;
            for (let i = 0; i < targetOffset && i < root.childNodes.length; i++) {
                sum += (root.childNodes[i].textContent ?? '').length;
            }
            return sum;
        }
        let offset = 0;
        const textIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
        let node = textIterator.nextNode();
        while (node) {
            if (node === target)
                return offset + targetOffset;
            offset += (node.textContent ?? '').length;
            node = textIterator.nextNode();
        }
        return offset;
    }
    onBeforeInput(event) {
        if (!(event instanceof InputEvent)) {
            return;
        }
        const target = event.target;
        const maxLines = this.maxLines$();
        if (!maxLines || !(target instanceof HTMLTextAreaElement) || !this.insertsLineBreak(event)) {
            return;
        }
        const nextValue = this.valueAfterInput(target, event.data ?? '\n');
        if (this.lineCount(nextValue) > maxLines) {
            event.preventDefault();
        }
    }
    onInput(event) {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
            return;
        }
        const normalized = this.normalizeValueForLimits(target.value);
        if (normalized !== target.value) {
            target.value = normalized;
        }
        this.valueState.set(normalized);
        this.valueChange.emit(normalized);
    }
    onFocus() {
        if (!this.disabledState()) {
            this.focusedState.set(true);
            this.focusChange.emit(true);
        }
    }
    onBlur() {
        this.focusedState.set(false);
        this.focusChange.emit(false);
        this.blurred.emit();
    }
    onScroll(event) {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
            return;
        }
        this.scrollTopState.set(target.scrollTop);
    }
    normalizeLineCount(value, fallback) {
        const numeric = Number(value);
        // Floor of 3: fewer lines would make the area read as a single-line text
        // field instead of an invitation to write more.
        return Number.isFinite(numeric) ? Math.max(3, Math.floor(numeric)) : fallback;
    }
    normalizeOptionalCount(value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : undefined;
    }
    normalizeValueForLimits(value) {
        let next = value;
        const maxLength = this.maxLengthState();
        if (maxLength !== undefined && next.length > maxLength) {
            next = next.slice(0, maxLength);
        }
        const maxLines = this.maxLines$();
        if (maxLines !== undefined && this.lineCount(next) > maxLines) {
            next = next.split(/\r?\n/).slice(0, maxLines).join('\n');
        }
        return next;
    }
    insertsLineBreak(event) {
        return event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph' || !!event.data?.includes('\n');
    }
    valueAfterInput(target, insertText) {
        const selectionStart = target.selectionStart ?? target.value.length;
        const selectionEnd = target.selectionEnd ?? selectionStart;
        return `${target.value.slice(0, selectionStart)}${insertText}${target.value.slice(selectionEnd)}`;
    }
    lineCount(value) {
        return value.split(/\r?\n/).length;
    }
    resizeField() {
        const el = this.fieldRef?.nativeElement;
        if (!el || this.layout === 'fill') {
            return;
        }
        const minHeight = this.heightForLines(el, this.minLinesState());
        const maxLines = this.maxLines$();
        const maxHeight = maxLines === undefined ? undefined : this.heightForLines(el, maxLines);
        el.style.minHeight = `${minHeight}px`;
        el.style.maxHeight = maxHeight === undefined ? '' : `${maxHeight}px`;
        if (this.sizingState() !== 'auto') {
            el.style.height = '';
            el.style.overflowY = '';
            return;
        }
        el.style.height = 'auto';
        const nextHeight = Math.max(minHeight, maxHeight === undefined ? el.scrollHeight : Math.min(el.scrollHeight, maxHeight));
        el.style.height = `${nextHeight}px`;
        el.style.overflowY = maxHeight !== undefined && el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
    heightForLines(el, lines) {
        const styles = getComputedStyle(el);
        const fontSize = this.parsePixelValue(styles.fontSize) || 14;
        const lineHeight = this.parsePixelValue(styles.lineHeight) || fontSize * 1.3;
        const padding = this.parsePixelValue(styles.paddingTop) +
            this.parsePixelValue(styles.paddingBottom) +
            this.parsePixelValue(styles.borderTopWidth) +
            this.parsePixelValue(styles.borderBottomWidth);
        return Math.ceil(lineHeight * lines + padding);
    }
    parsePixelValue(value) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTextAreaComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTextAreaComponent, isStandalone: true, selector: "cx-text-area", inputs: { label: "label", ariaLabel: "ariaLabel", placeholder: "placeholder", optional: "optional", monospace: "monospace", variant: "variant", focusVariant: "focusVariant", layout: "layout", presentation: "presentation", markdown: "markdown", disabled: "disabled", size: "size", sizing: "sizing", minLines: "minLines", maxLines: "maxLines", maxLength: "maxLength", lineNumbers: "lineNumbers", annotations: "annotations", hint: "hint", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", blurred: "blurred" }, viewQueries: [{ propertyName: "fieldRef", first: true, predicate: ["field"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-text-area\"\n  [class.cx-text-area--small]=\"size$() === 'small'\"\n  [class.cx-text-area--large]=\"size$() === 'large'\"\n  [class.cx-text-area--title]=\"variant === 'title'\"\n  [class.cx-text-area--fill]=\"layout === 'fill'\"\n  [class.cx-text-area--document]=\"presentation === 'document'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-text-area__header\">\n      <div class=\"cx-text-area__label\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-text-area__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-text-area__shell\"\n    [class.cx-text-area__shell--focused]=\"isFocused$()\"\n    [class.cx-text-area__shell--disabled]=\"disabled$()\"\n    [class.cx-text-area__shell--error]=\"hasError$()\"\n    [class.cx-text-area__shell--inline-edit]=\"variant === 'inline-edit' || variant === 'title'\"\n    [class.cx-text-area__shell--focus-ring]=\"focusVariant === 'ring'\"\n  >\n    <div\n      class=\"cx-text-area__editor\"\n      [class.cx-text-area__editor--with-gutter]=\"showGutter$()\"\n    >\n      <div class=\"cx-text-area__gutter\" aria-hidden=\"true\">\n        @if (showGutter$()) {\n          <div class=\"cx-text-area__gutter-rows\" [style.transform]=\"gutterTransform$()\">\n            @for (line of renderedLines$(); track line.number) {\n              <div\n                class=\"cx-text-area__gutter-row\"\n                [class.cx-text-area__gutter-row--success]=\"line.iconMood === 'success'\"\n                [class.cx-text-area__gutter-row--error]=\"line.iconMood === 'danger'\"\n              >\n                @if (line.iconMood === 'danger') {\n                  <cx-icon class=\"cx-text-area__gutter-icon\" icon=\"warning\" [size]=\"12\" />\n                } @else if (line.iconMood === 'success') {\n                  <cx-icon class=\"cx-text-area__gutter-icon\" icon=\"check\" [size]=\"12\" />\n                }\n                @if (showLineNumbers$()) {\n                  <span class=\"cx-text-area__gutter-number\">{{ line.number }}</span>\n                }\n              </div>\n            }\n          </div>\n        }\n      </div>\n\n      <div class=\"cx-text-area__field-wrap\">\n        @if (showFullLineAnnotations$()) {\n          <div class=\"cx-text-area__highlight\" aria-hidden=\"true\">\n            <div class=\"cx-text-area__highlight-lines\" [style.transform]=\"gutterTransform$()\">\n              @for (line of renderedLines$(); track line.number) {\n                <div\n                  class=\"cx-text-area__highlight-line\"\n                  [class.cx-text-area__highlight-line--success]=\"line.mood === 'success'\"\n                  [class.cx-text-area__highlight-line--error]=\"line.mood === 'danger'\"\n                ></div>\n              }\n            </div>\n          </div>\n        }\n        @if (showRangeAnnotations$()) {\n          <div\n            class=\"cx-text-area__range-mirror\"\n            [class.cx-text-area__range-mirror--monospace]=\"monospace\"\n            aria-hidden=\"true\"\n          >\n            <div class=\"cx-text-area__range-lines\" [style.transform]=\"gutterTransform$()\">\n              @for (line of renderedLines$(); track line.number) {\n                <div class=\"cx-text-area__range-line\">\n                  @for (segment of line.segments; track $index) {\n                    <span\n                      [class.cx-text-area__range-segment--success]=\"segment.mood === 'success'\"\n                      [class.cx-text-area__range-segment--error]=\"segment.mood === 'danger'\"\n                    >{{ segment.text }}</span>\n                  }\n                </div>\n              }\n            </div>\n          </div>\n        }\n        @if (showMarkdownPreview$()) {\n          <div\n            class=\"cx-text-area__markdown\"\n            [innerHTML]=\"renderedMarkdown$()\"\n            (click)=\"onPreviewClick($event)\"\n          ></div>\n        }\n        <textarea\n          #field\n          class=\"cx-text-area__field\"\n          [class.cx-text-area__field--hidden]=\"showMarkdownPreview$()\"\n          [class.cx-text-area__field--auto-grow]=\"sizing$() === 'auto'\"\n          [class.cx-text-area__field--monospace]=\"monospace\"\n          [class.cx-text-area__field--resizable]=\"sizing$() === 'resizable'\"\n          [class.cx-text-area__field--fixed]=\"sizing$() === 'fixed'\"\n          [class.cx-text-area__field--with-range-annotations]=\"showRangeAnnotations$()\"\n          [value]=\"value$()\"\n          [rows]=\"minLines$()\"\n          [disabled]=\"disabled$()\"\n          [attr.placeholder]=\"placeholder\"\n          [attr.maxlength]=\"maxLength$() ?? null\"\n          [attr.aria-label]=\"resolvedAriaLabel\"\n          [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n          [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n          (beforeinput)=\"onBeforeInput($event)\"\n          (input)=\"onInput($event)\"\n          (focus)=\"onFocus()\"\n          (blur)=\"onBlur()\"\n          (scroll)=\"onScroll($event)\"\n        ></textarea>\n      </div>\n    </div>\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-text-area__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-text-area__hint\">{{ hint$() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" [showAll]=\"true\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-text-area{--cx-text-area-font-size: var(--font-size-body);--cx-text-area-line-height: var(--line-height-body);width:100%}.cx-text-area--small{--cx-text-area-font-size: var(--font-size-body-sm)}.cx-text-area--large{--cx-text-area-font-size: var(--font-size-title-3)}.cx-text-area--document{--cx-text-area-font-size: 18px;--cx-text-area-line-height: 1.75}.cx-text-area__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-text-area__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-text-area__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-text-area__shell{width:100%;border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);box-sizing:border-box;overflow:hidden}.cx-text-area__shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-text-area__shell:hover:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error){border-color:var(--border-hover)}.cx-text-area__shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-text-area__shell:has(.cx-text-area__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-text-area__shell--error,.cx-text-area__shell--error:hover:not(.cx-text-area__shell--disabled){border-color:var(--danger)}.cx-text-area__shell--disabled{opacity:.55;cursor:default}.cx-text-area__shell--loading{cursor:progress}.cx-text-area__shell:hover:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error),.cx-text-area__shell:focus-within:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error){outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-text-area__shell--focus-ring:not(.cx-text-area__shell--error):has(.cx-text-area__field:focus){border-color:var(--primary);outline:var(--outline-tab);outline-offset:0}.cx-text-area__shell--inline-edit{border-color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.cx-text-area__shell--inline-edit:hover:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error),.cx-text-area__shell--inline-edit.cx-text-area__shell--focused:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error),.cx-text-area__shell--inline-edit:has(.cx-text-area__field:focus-visible):not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error){border-color:var(--border-hover);background:var(--opacity-darken)}.cx-text-area__shell--inline-edit.cx-text-area__shell--error,.cx-text-area__shell--inline-edit.cx-text-area__shell--error:hover:not(.cx-text-area__shell--disabled){border-color:var(--danger)}.cx-text-area__editor{display:grid;grid-template-columns:0px minmax(0, 1fr);align-items:start;padding:var(--space-sm)}.cx-text-area--small .cx-text-area__editor{padding:var(--space-xs) var(--space-sm)}.cx-text-area--large .cx-text-area__editor,.cx-text-area--document .cx-text-area__editor{padding:var(--space-md)}.cx-text-area__editor--with-gutter{grid-template-columns:auto minmax(0, 1fr);gap:var(--space-sm)}.cx-text-area__gutter{overflow:hidden;min-width:0;color:var(--opacity-high);font-family:var(--font-family-mono);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:var(--cx-text-area-line-height);text-align:right;user-select:none;letter-spacing:0}.cx-text-area__editor--with-gutter .cx-text-area__gutter{min-width:2ch;padding-right:var(--space-sm);border-right:var(--line);border-color:var(--opacity-mid)}.cx-text-area__gutter-rows{display:flex;flex-direction:column;width:100%;will-change:transform}.cx-text-area__gutter-row{display:grid;grid-template-columns:12px minmax(2ch, auto);column-gap:var(--space-2xs);min-height:calc(var(--cx-text-area-font-size)*var(--cx-text-area-line-height));align-items:center;justify-items:end}.cx-text-area__gutter-row--error{color:var(--danger)}.cx-text-area__gutter-row--success{color:var(--success)}.cx-text-area__gutter-icon{display:inline-flex;flex:0 0 auto}.cx-text-area__gutter-number{grid-column:2}.cx-text-area__field-wrap{position:relative;min-width:0}.cx-text-area__highlight{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}.cx-text-area__highlight-lines{will-change:transform}.cx-text-area__highlight-line{height:calc(var(--cx-text-area-font-size)*var(--cx-text-area-line-height))}.cx-text-area__highlight-line--error{background:var(--danger-opacity)}.cx-text-area__highlight-line--success{background:var(--success-opacity)}.cx-text-area__range-mirror{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;color:var(--ink);font-family:inherit;font-size:var(--cx-text-area-font-size);font-weight:var(--font-weight-regular);line-height:var(--cx-text-area-line-height);white-space:pre-wrap;overflow-wrap:anywhere}.cx-text-area__range-mirror--monospace{font-family:var(--font-family-mono)}.cx-text-area__range-lines{will-change:transform}.cx-text-area__range-line{min-height:calc(var(--cx-text-area-font-size)*var(--cx-text-area-line-height))}.cx-text-area__range-segment--success{background:var(--success-opacity);color:var(--success-alt)}.cx-text-area__range-segment--error{background:var(--danger-opacity);color:var(--danger-alt)}.cx-text-area__field{position:relative;z-index:1;width:100%;min-height:0;padding:0;border:0;resize:none;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--cx-text-area-font-size);font-weight:var(--font-weight-regular);line-height:var(--cx-text-area-line-height);box-sizing:border-box;overflow-wrap:anywhere;white-space:pre-wrap}.cx-text-area__field--monospace{font-family:var(--font-family-mono)}.cx-text-area__field::placeholder{color:var(--placeholder)}.cx-text-area__field:focus-visible{outline:0}.cx-text-area__field--hidden{opacity:0;pointer-events:none}.cx-text-area__field--auto-grow{resize:none;overflow:hidden}.cx-text-area__field--resizable{resize:vertical;overflow:auto}.cx-text-area__field--fixed{resize:none;overflow:auto}.cx-text-area__field--with-range-annotations{color:rgba(0,0,0,0);caret-color:var(--ink)}.cx-text-area__markdown{position:absolute;inset:0;overflow-y:auto;z-index:2;color:var(--ink);font-family:inherit;font-size:var(--cx-text-area-font-size);font-weight:var(--font-weight-regular);line-height:var(--cx-text-area-line-height);cursor:text;box-sizing:border-box;overflow-wrap:anywhere}.cx-text-area__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-text-area__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-text-area__validation{display:grid;grid-template-columns:14px minmax(0, 1fr);align-items:start;gap:var(--space-xs);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}.cx-text-area__validation--info{color:var(--info)}.cx-text-area__validation--success{color:var(--success)}.cx-text-area__validation--warning{color:var(--warning)}.cx-text-area__validation--error{color:var(--danger)}.cx-text-area__validation-icon{display:inline-flex;margin-top:1px}.cx-text-area__validation-text{min-width:0;overflow-wrap:anywhere}.cx-text-area--title .cx-text-area__field{font-size:var(--font-size-title-2);font-weight:var(--font-weight-bold);line-height:1.2}.cx-text-area--fill{height:100%;display:flex;flex:1 1 auto;min-height:0;flex-direction:column}.cx-text-area--fill .cx-text-area__shell{display:flex;flex:1 1 auto;min-height:0;flex-direction:column}.cx-text-area--fill .cx-text-area__editor{flex:1 1 auto;min-height:0;grid-template-rows:1fr;align-items:stretch}.cx-text-area--fill .cx-text-area__field-wrap{height:100%;min-height:0}.cx-text-area--fill .cx-text-area__field,.cx-text-area--fill .cx-text-area__markdown{height:100%;min-height:160px}.cx-text-area--fill .cx-text-area__field{resize:none}.cx-text-area--fill .cx-text-area__markdown{overflow-y:auto}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTextAreaComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-text-area', imports: [CxIconComponent, CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-text-area\"\n  [class.cx-text-area--small]=\"size$() === 'small'\"\n  [class.cx-text-area--large]=\"size$() === 'large'\"\n  [class.cx-text-area--title]=\"variant === 'title'\"\n  [class.cx-text-area--fill]=\"layout === 'fill'\"\n  [class.cx-text-area--document]=\"presentation === 'document'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-text-area__header\">\n      <div class=\"cx-text-area__label\">{{ label }}</div>\n      @if (optional) {\n        <div class=\"cx-text-area__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-text-area__shell\"\n    [class.cx-text-area__shell--focused]=\"isFocused$()\"\n    [class.cx-text-area__shell--disabled]=\"disabled$()\"\n    [class.cx-text-area__shell--error]=\"hasError$()\"\n    [class.cx-text-area__shell--inline-edit]=\"variant === 'inline-edit' || variant === 'title'\"\n    [class.cx-text-area__shell--focus-ring]=\"focusVariant === 'ring'\"\n  >\n    <div\n      class=\"cx-text-area__editor\"\n      [class.cx-text-area__editor--with-gutter]=\"showGutter$()\"\n    >\n      <div class=\"cx-text-area__gutter\" aria-hidden=\"true\">\n        @if (showGutter$()) {\n          <div class=\"cx-text-area__gutter-rows\" [style.transform]=\"gutterTransform$()\">\n            @for (line of renderedLines$(); track line.number) {\n              <div\n                class=\"cx-text-area__gutter-row\"\n                [class.cx-text-area__gutter-row--success]=\"line.iconMood === 'success'\"\n                [class.cx-text-area__gutter-row--error]=\"line.iconMood === 'danger'\"\n              >\n                @if (line.iconMood === 'danger') {\n                  <cx-icon class=\"cx-text-area__gutter-icon\" icon=\"warning\" [size]=\"12\" />\n                } @else if (line.iconMood === 'success') {\n                  <cx-icon class=\"cx-text-area__gutter-icon\" icon=\"check\" [size]=\"12\" />\n                }\n                @if (showLineNumbers$()) {\n                  <span class=\"cx-text-area__gutter-number\">{{ line.number }}</span>\n                }\n              </div>\n            }\n          </div>\n        }\n      </div>\n\n      <div class=\"cx-text-area__field-wrap\">\n        @if (showFullLineAnnotations$()) {\n          <div class=\"cx-text-area__highlight\" aria-hidden=\"true\">\n            <div class=\"cx-text-area__highlight-lines\" [style.transform]=\"gutterTransform$()\">\n              @for (line of renderedLines$(); track line.number) {\n                <div\n                  class=\"cx-text-area__highlight-line\"\n                  [class.cx-text-area__highlight-line--success]=\"line.mood === 'success'\"\n                  [class.cx-text-area__highlight-line--error]=\"line.mood === 'danger'\"\n                ></div>\n              }\n            </div>\n          </div>\n        }\n        @if (showRangeAnnotations$()) {\n          <div\n            class=\"cx-text-area__range-mirror\"\n            [class.cx-text-area__range-mirror--monospace]=\"monospace\"\n            aria-hidden=\"true\"\n          >\n            <div class=\"cx-text-area__range-lines\" [style.transform]=\"gutterTransform$()\">\n              @for (line of renderedLines$(); track line.number) {\n                <div class=\"cx-text-area__range-line\">\n                  @for (segment of line.segments; track $index) {\n                    <span\n                      [class.cx-text-area__range-segment--success]=\"segment.mood === 'success'\"\n                      [class.cx-text-area__range-segment--error]=\"segment.mood === 'danger'\"\n                    >{{ segment.text }}</span>\n                  }\n                </div>\n              }\n            </div>\n          </div>\n        }\n        @if (showMarkdownPreview$()) {\n          <div\n            class=\"cx-text-area__markdown\"\n            [innerHTML]=\"renderedMarkdown$()\"\n            (click)=\"onPreviewClick($event)\"\n          ></div>\n        }\n        <textarea\n          #field\n          class=\"cx-text-area__field\"\n          [class.cx-text-area__field--hidden]=\"showMarkdownPreview$()\"\n          [class.cx-text-area__field--auto-grow]=\"sizing$() === 'auto'\"\n          [class.cx-text-area__field--monospace]=\"monospace\"\n          [class.cx-text-area__field--resizable]=\"sizing$() === 'resizable'\"\n          [class.cx-text-area__field--fixed]=\"sizing$() === 'fixed'\"\n          [class.cx-text-area__field--with-range-annotations]=\"showRangeAnnotations$()\"\n          [value]=\"value$()\"\n          [rows]=\"minLines$()\"\n          [disabled]=\"disabled$()\"\n          [attr.placeholder]=\"placeholder\"\n          [attr.maxlength]=\"maxLength$() ?? null\"\n          [attr.aria-label]=\"resolvedAriaLabel\"\n          [attr.aria-describedby]=\"resolvedAriaDescribedBy\"\n          [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n          (beforeinput)=\"onBeforeInput($event)\"\n          (input)=\"onInput($event)\"\n          (focus)=\"onFocus()\"\n          (blur)=\"onBlur()\"\n          (scroll)=\"onScroll($event)\"\n        ></textarea>\n      </div>\n    </div>\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-text-area__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-text-area__hint\">{{ hint$() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" [showAll]=\"true\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-text-area{--cx-text-area-font-size: var(--font-size-body);--cx-text-area-line-height: var(--line-height-body);width:100%}.cx-text-area--small{--cx-text-area-font-size: var(--font-size-body-sm)}.cx-text-area--large{--cx-text-area-font-size: var(--font-size-title-3)}.cx-text-area--document{--cx-text-area-font-size: 18px;--cx-text-area-line-height: 1.75}.cx-text-area__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-text-area__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-text-area__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-text-area__shell{width:100%;border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);box-sizing:border-box;overflow:hidden}.cx-text-area__shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-text-area__shell:hover:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error){border-color:var(--border-hover)}.cx-text-area__shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-text-area__shell:has(.cx-text-area__field:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-text-area__shell--error,.cx-text-area__shell--error:hover:not(.cx-text-area__shell--disabled){border-color:var(--danger)}.cx-text-area__shell--disabled{opacity:.55;cursor:default}.cx-text-area__shell--loading{cursor:progress}.cx-text-area__shell:hover:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error),.cx-text-area__shell:focus-within:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error){outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-text-area__shell--focus-ring:not(.cx-text-area__shell--error):has(.cx-text-area__field:focus){border-color:var(--primary);outline:var(--outline-tab);outline-offset:0}.cx-text-area__shell--inline-edit{border-color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.cx-text-area__shell--inline-edit:hover:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error),.cx-text-area__shell--inline-edit.cx-text-area__shell--focused:not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error),.cx-text-area__shell--inline-edit:has(.cx-text-area__field:focus-visible):not(.cx-text-area__shell--disabled):not(.cx-text-area__shell--error){border-color:var(--border-hover);background:var(--opacity-darken)}.cx-text-area__shell--inline-edit.cx-text-area__shell--error,.cx-text-area__shell--inline-edit.cx-text-area__shell--error:hover:not(.cx-text-area__shell--disabled){border-color:var(--danger)}.cx-text-area__editor{display:grid;grid-template-columns:0px minmax(0, 1fr);align-items:start;padding:var(--space-sm)}.cx-text-area--small .cx-text-area__editor{padding:var(--space-xs) var(--space-sm)}.cx-text-area--large .cx-text-area__editor,.cx-text-area--document .cx-text-area__editor{padding:var(--space-md)}.cx-text-area__editor--with-gutter{grid-template-columns:auto minmax(0, 1fr);gap:var(--space-sm)}.cx-text-area__gutter{overflow:hidden;min-width:0;color:var(--opacity-high);font-family:var(--font-family-mono);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:var(--cx-text-area-line-height);text-align:right;user-select:none;letter-spacing:0}.cx-text-area__editor--with-gutter .cx-text-area__gutter{min-width:2ch;padding-right:var(--space-sm);border-right:var(--line);border-color:var(--opacity-mid)}.cx-text-area__gutter-rows{display:flex;flex-direction:column;width:100%;will-change:transform}.cx-text-area__gutter-row{display:grid;grid-template-columns:12px minmax(2ch, auto);column-gap:var(--space-2xs);min-height:calc(var(--cx-text-area-font-size)*var(--cx-text-area-line-height));align-items:center;justify-items:end}.cx-text-area__gutter-row--error{color:var(--danger)}.cx-text-area__gutter-row--success{color:var(--success)}.cx-text-area__gutter-icon{display:inline-flex;flex:0 0 auto}.cx-text-area__gutter-number{grid-column:2}.cx-text-area__field-wrap{position:relative;min-width:0}.cx-text-area__highlight{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}.cx-text-area__highlight-lines{will-change:transform}.cx-text-area__highlight-line{height:calc(var(--cx-text-area-font-size)*var(--cx-text-area-line-height))}.cx-text-area__highlight-line--error{background:var(--danger-opacity)}.cx-text-area__highlight-line--success{background:var(--success-opacity)}.cx-text-area__range-mirror{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;color:var(--ink);font-family:inherit;font-size:var(--cx-text-area-font-size);font-weight:var(--font-weight-regular);line-height:var(--cx-text-area-line-height);white-space:pre-wrap;overflow-wrap:anywhere}.cx-text-area__range-mirror--monospace{font-family:var(--font-family-mono)}.cx-text-area__range-lines{will-change:transform}.cx-text-area__range-line{min-height:calc(var(--cx-text-area-font-size)*var(--cx-text-area-line-height))}.cx-text-area__range-segment--success{background:var(--success-opacity);color:var(--success-alt)}.cx-text-area__range-segment--error{background:var(--danger-opacity);color:var(--danger-alt)}.cx-text-area__field{position:relative;z-index:1;width:100%;min-height:0;padding:0;border:0;resize:none;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--cx-text-area-font-size);font-weight:var(--font-weight-regular);line-height:var(--cx-text-area-line-height);box-sizing:border-box;overflow-wrap:anywhere;white-space:pre-wrap}.cx-text-area__field--monospace{font-family:var(--font-family-mono)}.cx-text-area__field::placeholder{color:var(--placeholder)}.cx-text-area__field:focus-visible{outline:0}.cx-text-area__field--hidden{opacity:0;pointer-events:none}.cx-text-area__field--auto-grow{resize:none;overflow:hidden}.cx-text-area__field--resizable{resize:vertical;overflow:auto}.cx-text-area__field--fixed{resize:none;overflow:auto}.cx-text-area__field--with-range-annotations{color:rgba(0,0,0,0);caret-color:var(--ink)}.cx-text-area__markdown{position:absolute;inset:0;overflow-y:auto;z-index:2;color:var(--ink);font-family:inherit;font-size:var(--cx-text-area-font-size);font-weight:var(--font-weight-regular);line-height:var(--cx-text-area-line-height);cursor:text;box-sizing:border-box;overflow-wrap:anywhere}.cx-text-area__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-text-area__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-text-area__validation{display:grid;grid-template-columns:14px minmax(0, 1fr);align-items:start;gap:var(--space-xs);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}.cx-text-area__validation--info{color:var(--info)}.cx-text-area__validation--success{color:var(--success)}.cx-text-area__validation--warning{color:var(--warning)}.cx-text-area__validation--error{color:var(--danger)}.cx-text-area__validation-icon{display:inline-flex;margin-top:1px}.cx-text-area__validation-text{min-width:0;overflow-wrap:anywhere}.cx-text-area--title .cx-text-area__field{font-size:var(--font-size-title-2);font-weight:var(--font-weight-bold);line-height:1.2}.cx-text-area--fill{height:100%;display:flex;flex:1 1 auto;min-height:0;flex-direction:column}.cx-text-area--fill .cx-text-area__shell{display:flex;flex:1 1 auto;min-height:0;flex-direction:column}.cx-text-area--fill .cx-text-area__editor{flex:1 1 auto;min-height:0;grid-template-rows:1fr;align-items:stretch}.cx-text-area--fill .cx-text-area__field-wrap{height:100%;min-height:0}.cx-text-area--fill .cx-text-area__field,.cx-text-area--fill .cx-text-area__markdown{height:100%;min-height:160px}.cx-text-area--fill .cx-text-area__field{resize:none}.cx-text-area--fill .cx-text-area__markdown{overflow-y:auto}"] }]
        }], ctorParameters: () => [], propDecorators: { fieldRef: [{
                type: ViewChild,
                args: ['field', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], optional: [{
                type: Input
            }], monospace: [{
                type: Input
            }], variant: [{
                type: Input
            }], focusVariant: [{
                type: Input
            }], layout: [{
                type: Input
            }], presentation: [{
                type: Input
            }], markdown: [{
                type: Input
            }], disabled: [{
                type: Input
            }], size: [{
                type: Input
            }], sizing: [{
                type: Input
            }], minLines: [{
                type: Input
            }], maxLines: [{
                type: Input
            }], maxLength: [{
                type: Input
            }], lineNumbers: [{
                type: Input
            }], annotations: [{
                type: Input
            }], hint: [{
                type: Input
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], blurred: [{
                type: Output
            }] } });
