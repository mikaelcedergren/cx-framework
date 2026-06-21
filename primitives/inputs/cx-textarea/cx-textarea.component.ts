import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, afterRenderEffect, computed, signal } from '@angular/core';
import { marked } from 'marked';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxTextareaAnnotationMood = 'success' | 'danger';

export type CxTextareaAnnotation =
  | {
      id?: string;
      kind: 'line';
      line: number;
      mood: CxTextareaAnnotationMood;
      message?: string;
    }
  | {
      id?: string;
      kind: 'range';
      line: number;
      startIndex: number;
      endIndex: number;
      mood: CxTextareaAnnotationMood;
      message?: string;
    };

type CxTextareaNormalizedLineAnnotation = Extract<CxTextareaAnnotation, { kind: 'line' }> & {
  order: number;
};

type CxTextareaNormalizedRangeAnnotation = Extract<CxTextareaAnnotation, { kind: 'range' }> & {
  order: number;
};

type CxTextareaNormalizedAnnotation =
  | CxTextareaNormalizedLineAnnotation
  | CxTextareaNormalizedRangeAnnotation;

export type CxTextareaVariant = 'default' | 'inline-edit' | 'title';
export type CxTextareaFocusVariant = 'default' | 'ring';
export type CxTextareaLayout = 'default' | 'fill';
export type CxTextareaPresentation = 'default' | 'document';
export type CxTextareaSize = 'small' | 'default' | 'large';
export type CxTextareaSizing = 'fixed' | 'auto' | 'resizable';

type CxTextareaRenderedLine = {
  number: number;
  mood?: CxTextareaAnnotationMood;
  iconMood?: CxTextareaAnnotationMood;
  title?: string;
  segments: ReadonlyArray<{
    text: string;
    mood?: CxTextareaAnnotationMood;
  }>;
};

@Component({
  selector: 'cx-textarea',
  imports: [CxIconComponent, CxValidationMessageComponent],
  templateUrl: './cx-textarea.component.html',
  styleUrl: './cx-textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTextareaComponent {
  private readonly valueState = signal('');
  private readonly focusedState = signal(false);
  private readonly forcedFocusState = signal(false);
  private readonly markdownState = signal(false);
  private readonly disabledState = signal(false);
  private readonly readOnlyState = signal(false);
  private readonly sizeState = signal<CxTextareaSize>('default');
  private readonly sizingState = signal<CxTextareaSizing>('resizable');
  private readonly minLinesState = signal(5);
  private readonly maxLinesState = signal<number | undefined>(undefined);
  private readonly maxLengthState = signal<number | undefined>(undefined);
  private readonly lineNumbersState = signal(false);
  private readonly annotationsState = signal<ReadonlyArray<CxTextareaAnnotation>>([]);
  private readonly scrollTopState = signal(0);
  private readonly hintState = signal<string | undefined>(undefined);
  private readonly errorMessageState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLTextAreaElement>;

  @Input() label = 'Label';
  @Input() ariaLabel: string | undefined;
  @Input() placeholder = '';
  @Input() optional = false;
  @Input() monospace = false;
  @Input() variant: CxTextareaVariant = 'default';
  @Input() focusVariant: CxTextareaFocusVariant = 'default';
  @Input() layout: CxTextareaLayout = 'default';
  @Input() presentation: CxTextareaPresentation = 'default';

  @Input()
  public set autoGrow(value: boolean) {
    if (value) {
      this.sizingState.set('auto');
    } else if (this.sizingState() === 'auto') {
      this.sizingState.set('resizable');
    }
  }

  @Input()
  public set markdown(value: boolean) {
    this.markdownState.set(!!value);
  }

  @Input()
  public set disabled(value: boolean) {
    this.disabledState.set(!!value);
  }

  @Input()
  public set readOnly(value: boolean) {
    this.readOnlyState.set(!!value);
  }

  @Input()
  public set size(value: CxTextareaSize | undefined) {
    this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
  }

  @Input()
  public set sizing(value: CxTextareaSizing | undefined) {
    this.sizingState.set(value === 'fixed' || value === 'auto' || value === 'resizable' ? value : 'resizable');
  }

  @Input()
  public set minLines(value: number | undefined) {
    this.minLinesState.set(this.normalizeLineCount(value, 5));
  }

  @Input()
  public set rows(value: number | undefined) {
    this.minLines = value;
  }

  @Input()
  public set maxLines(value: number | null | undefined) {
    this.maxLinesState.set(this.normalizeOptionalCount(value));
  }

  @Input()
  public set maxLength(value: number | null | undefined) {
    this.maxLengthState.set(this.normalizeOptionalCount(value));
  }

  @Input()
  public set resizable(value: boolean) {
    if (value) {
      if (this.sizingState() !== 'auto') {
        this.sizingState.set('resizable');
      }
      return;
    }
    if (this.sizingState() === 'resizable') {
      this.sizingState.set('fixed');
    }
  }

  @Input()
  public set lineNumbers(value: boolean) {
    this.lineNumbersState.set(!!value);
  }

  @Input()
  public set annotations(value: ReadonlyArray<CxTextareaAnnotation> | null | undefined) {
    this.annotationsState.set(value ?? []);
  }

  @Input()
  public set hint(value: string | undefined) {
    this.hintState.set(value);
  }

  @Input()
  public set errorMessage(value: string | undefined) {
    this.errorMessageState.set(value);
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(this.normalizeValueForLimits(value ?? ''));
  }

  @Input()
  public set focused(value: boolean) {
    this.forcedFocusState.set(value);
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly blurred = new EventEmitter<void>();

  protected get resolvedAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    const label = this.label.trim();
    return label || undefined;
  }

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly readOnly$ = this.readOnlyState.asReadonly();
  protected readonly size$ = this.sizeState.asReadonly();
  protected readonly sizing$ = this.sizingState.asReadonly();
  protected readonly minLines$ = this.minLinesState.asReadonly();
  protected readonly maxLines$ = computed(() => {
    const maxLines = this.maxLinesState();
    return maxLines === undefined ? undefined : Math.max(this.minLinesState(), maxLines);
  });
  protected readonly maxLength$ = this.maxLengthState.asReadonly();
  protected readonly isFocused$ = computed(() => this.forcedFocusState() || this.focusedState());
  protected readonly normalizedAnnotations$ = computed<ReadonlyArray<CxTextareaNormalizedAnnotation>>(() => {
    const normalized: CxTextareaNormalizedAnnotation[] = [];

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
  });
  protected readonly visibleLineCount$ = computed(() =>
    Math.max(1, this.valueState().split(/\r?\n/).length, this.minLinesState()),
  );
  protected readonly visibleAnnotations$ = computed(() => {
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
  });
  protected readonly showLineNumbers$ = computed(() => this.lineNumbersState());
  protected readonly showFullLineAnnotations$ = computed(() =>
    this.visibleAnnotations$().some((annotation) => annotation.kind === 'line'),
  );
  protected readonly showRangeAnnotations$ = computed(() =>
    this.visibleAnnotations$().some((annotation) => annotation.kind === 'range'),
  );
  protected readonly showGutterIconColumn$ = computed(() =>
    this.renderedLines$().some((line) => line.iconMood !== undefined),
  );
  protected readonly showGutter$ = computed(() => this.showLineNumbers$() || this.showGutterIconColumn$());
  protected readonly renderedLines$ = computed<ReadonlyArray<CxTextareaRenderedLine>>(() => {
    const textLines = this.valueState().split(/\r?\n/);
    const total = this.visibleLineCount$();
    return Array.from({ length: total }, (_, index) => {
      const number = index + 1;
      const text = textLines[index] ?? '';
      const annotations = this.visibleAnnotations$().filter((annotation) => annotation.line === number);
      const lineAnnotations = annotations.filter((annotation) => annotation.kind === 'line');
      const rangeAnnotations = annotations.filter((annotation) => annotation.kind === 'range');
      const iconMood = this.iconMoodForAnnotations(annotations);
      const messages = annotations
        .filter((annotation) => annotation.mood === 'danger' && annotation.message?.trim())
        .map((annotation) => annotation.message!.trim());
      return {
        number,
        mood: this.dominantMood(lineAnnotations.map((annotation) => annotation.mood)),
        iconMood,
        title: messages.join('\n') || undefined,
        segments: this.renderSegments(text, rangeAnnotations),
      };
    });
  });
  protected readonly validationMessages$ = computed(() => {
    if (this.disabledState()) {
      return [];
    }

    const messages: CxValidationMessage[] = [...this.validationMessagesState()];
    for (const annotation of this.visibleAnnotations$()) {
      const message = annotation.message?.trim();
      if (annotation.mood === 'danger' && message) {
        messages.push({ type: 'error', message: `Line ${annotation.line}: ${message}` });
      }
    }
    return normalizeCxValidationMessages(messages, this.errorMessageState());
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'));
  protected readonly hint$ = computed(() => this.hintState()?.trim() || undefined);
  protected readonly showHint$ = computed(() => !!this.hint$() && this.validationMessages$().length === 0);
  protected readonly errorMessage$ = this.errorMessageState.asReadonly();
  protected readonly gutterTransform$ = computed(() => `translateY(-${this.scrollTopState()}px)`);
  protected readonly markdown$ = this.markdownState.asReadonly();
  protected readonly showMarkdownPreview$ = computed(
    () => this.markdownState() && !this.isFocused$() && this.valueState().trim().length > 0,
  );
  protected readonly renderedMarkdown$ = computed(() => {
    const raw = this.valueState().trim();
    if (!raw) return '';
    return marked.parse(raw) as string;
  });

  private dominantMood(moods: ReadonlyArray<CxTextareaAnnotationMood | undefined>): CxTextareaAnnotationMood | undefined {
    if (moods.includes('danger')) {
      return 'danger';
    }
    if (moods.includes('success')) {
      return 'success';
    }
    return undefined;
  }

  private iconMoodForAnnotations(
    annotations: ReadonlyArray<CxTextareaNormalizedAnnotation>,
  ): CxTextareaAnnotationMood | undefined {
    return this.dominantMood(annotations.map((annotation) => annotation.mood));
  }

  private renderSegments(
    text: string,
    annotations: ReadonlyArray<CxTextareaNormalizedRangeAnnotation>,
  ): ReadonlyArray<{ text: string; mood?: CxTextareaAnnotationMood }> {
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
    const boundaries = new Set<number>([0, text.length]);
    for (const annotation of clipped) {
      boundaries.add(annotation.startIndex);
      boundaries.add(annotation.endIndex);
    }

    const sortedBoundaries = Array.from(boundaries).sort((left, right) => left - right);
    const segments: Array<{ text: string; mood?: CxTextareaAnnotationMood }> = [];
    for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
      const startIndex = sortedBoundaries[index];
      const endIndex = sortedBoundaries[index + 1];
      const segmentText = text.slice(startIndex, endIndex);
      const mood = this.dominantMood(
        clipped
          .filter((annotation) => annotation.startIndex < endIndex && annotation.endIndex > startIndex)
          .map((annotation) => annotation.mood),
      );
      const previous = segments.at(-1);
      if (previous && previous.mood === mood) {
        previous.text += segmentText;
      } else {
        segments.push(mood ? { text: segmentText, mood } : { text: segmentText });
      }
    }

    return segments.length > 0 ? segments : [{ text: ' ' }];
  }

  private isAnnotationMood(value: string): value is CxTextareaAnnotationMood {
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

  public focus(): void {
    this.fieldRef?.nativeElement.focus();
  }

  protected onPreviewClick(event: MouseEvent): void {
    const previewEl = event.currentTarget as HTMLElement;
    const clickedBlock = (event.target as HTMLElement | null)?.closest(
      'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre',
    ) as HTMLElement | null;

    const caretDoc = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
    };
    const range = caretDoc.caretRangeFromPoint
      ? caretDoc.caretRangeFromPoint(event.clientX, event.clientY)
      : null;

    const raw = this.valueState();
    let cursor = raw.length;

    if (clickedBlock && previewEl.contains(clickedBlock)) {
      const blockStart = this.findBlockStartInRaw(raw, clickedBlock.textContent ?? '');
      if (blockStart >= 0) {
        const offsetInBlock =
          range && clickedBlock.contains(range.startContainer)
            ? this.textOffsetWithin(clickedBlock, range.startContainer, range.startOffset)
            : (clickedBlock.textContent ?? '').length;
        cursor = blockStart + offsetInBlock;
      }
    }

    this.focus();

    queueMicrotask(() => {
      const textarea = this.fieldRef?.nativeElement;
      if (!textarea) return;
      const clamped = Math.max(0, Math.min(cursor, textarea.value.length));
      textarea.setSelectionRange(clamped, clamped);
    });
  }

  private findBlockStartInRaw(raw: string, blockText: string): number {
    const trimmed = blockText.trim();
    if (!trimmed) return -1;
    const longProbe = trimmed.slice(0, Math.min(40, trimmed.length));
    let idx = raw.indexOf(longProbe);
    if (idx >= 0) return idx;
    const firstWord = trimmed.split(/\s+/)[0];
    if (firstWord) {
      idx = raw.indexOf(firstWord);
      if (idx >= 0) return idx;
    }
    return -1;
  }

  private textOffsetWithin(root: Node, target: Node, targetOffset: number): number {
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
      if (node === target) return offset + targetOffset;
      offset += (node.textContent ?? '').length;
      node = textIterator.nextNode();
    }
    return offset;
  }

  protected onBeforeInput(event: Event): void {
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

  protected onInput(event: Event): void {
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

  protected onFocus(): void {
    if (!this.disabledState()) {
      this.focusedState.set(true);
      this.focusChange.emit(true);
    }
  }

  protected onBlur(): void {
    this.focusedState.set(false);
    this.focusChange.emit(false);
    this.blurred.emit();
  }

  protected onScroll(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }
    this.scrollTopState.set(target.scrollTop);
  }

  private normalizeLineCount(value: number | undefined, fallback: number): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : fallback;
  }

  private normalizeOptionalCount(value: number | null | undefined): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : undefined;
  }

  private normalizeValueForLimits(value: string): string {
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

  private insertsLineBreak(event: InputEvent): boolean {
    return event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph' || !!event.data?.includes('\n');
  }

  private valueAfterInput(target: HTMLTextAreaElement, insertText: string): string {
    const selectionStart = target.selectionStart ?? target.value.length;
    const selectionEnd = target.selectionEnd ?? selectionStart;
    return `${target.value.slice(0, selectionStart)}${insertText}${target.value.slice(selectionEnd)}`;
  }

  private lineCount(value: string): number {
    return value.split(/\r?\n/).length;
  }

  private resizeField(): void {
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

  private heightForLines(el: HTMLTextAreaElement, lines: number): number {
    const styles = getComputedStyle(el);
    const fontSize = this.parsePixelValue(styles.fontSize) || 14;
    const lineHeight = this.parsePixelValue(styles.lineHeight) || fontSize * 1.3;
    const padding =
      this.parsePixelValue(styles.paddingTop) +
      this.parsePixelValue(styles.paddingBottom) +
      this.parsePixelValue(styles.borderTopWidth) +
      this.parsePixelValue(styles.borderBottomWidth);
    return Math.ceil(lineHeight * lines + padding);
  }

  private parsePixelValue(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
