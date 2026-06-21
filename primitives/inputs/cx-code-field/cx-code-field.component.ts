import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  signal,
} from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import {
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxCodeFieldMode = 'numeric' | 'alphanumeric';

const CODE_FIELD_LENGTH = 6;

type CodeFieldCell = string;

const FILTER_REGEX: Record<CxCodeFieldMode, RegExp> = {
  numeric: /[^0-9]/g,
  alphanumeric: /[^A-Z0-9]/g,
};

function createEmptyCells(): CodeFieldCell[] {
  return Array.from({ length: CODE_FIELD_LENGTH }, () => '');
}

function cellsEqual(left: readonly CodeFieldCell[], right: readonly CodeFieldCell[]): boolean {
  return left.length === right.length && left.every((cell, index) => cell === right[index]);
}

@Component({
  selector: 'cx-code-field',
  imports: [CxValidationMessageComponent],
  templateUrl: './cx-code-field.component.html',
  styleUrl: './cx-code-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCodeFieldComponent implements OnDestroy {
  private static nextId = 0;

  private readonly modeState = signal<CxCodeFieldMode>('numeric');
  private readonly cellsState = signal<CodeFieldCell[]>(createEmptyCells());
  private readonly focusedState = signal(false);
  private readonly focusedIndexState = signal(0);
  private readonly disabledState = signal(false);
  private readonly readOnlyState = signal(false);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private blurTimer: ReturnType<typeof setTimeout> | undefined;
  private inputRunComplete = false;
  private lastEmittedValue: string | undefined;

  protected readonly messagesId = `cx-code-field-messages-${++CxCodeFieldComponent.nextId}`;

  @ViewChild('cells', { read: ElementRef })
  private readonly cellsRef?: ElementRef<HTMLElement>;

  @ViewChildren('cellInput', { read: ElementRef })
  private readonly cellInputs?: QueryList<ElementRef<HTMLInputElement>>;

  @Input() ariaLabel: string | undefined;
  @Input() autoFocus = false;

  @Input()
  public set mode(value: CxCodeFieldMode | null | undefined) {
    this.modeState.set(value === 'alphanumeric' ? 'alphanumeric' : 'numeric');
    this.inputRunComplete = false;
    this.setCellsFromExternalValue(this.currentValue());
  }

  @Input()
  public set value(value: string | null | undefined) {
    this.inputRunComplete = false;
    const nextValue = this.filterValue(value ?? '').slice(0, CODE_FIELD_LENGTH);
    if (this.lastEmittedValue === nextValue) {
      this.lastEmittedValue = undefined;
      return;
    }
    this.setCellsFromExternalValue(nextValue);
  }

  @Input()
  public set disabled(value: boolean | null | undefined) {
    this.disabledState.set(value === true);
  }

  @Input()
  public set readOnly(value: boolean | null | undefined) {
    this.readOnlyState.set(value === true);
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly complete = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly mode$ = this.modeState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly readOnly$ = this.readOnlyState.asReadonly();
  protected readonly focused$ = this.focusedState.asReadonly();
  protected readonly isInteractive$ = computed(() => !this.disabledState() && !this.readOnlyState());
  protected readonly inputMode$ = computed<'numeric' | 'text'>(() => (this.modeState() === 'numeric' ? 'numeric' : 'text'));
  protected readonly pattern$ = computed(() => (this.modeState() === 'numeric' ? '[0-9]*' : '[A-Z0-9]*'));
  protected readonly cells$ = this.cellsState.asReadonly();
  protected readonly activeIndex$ = computed(() => {
    if (!this.focusedState()) {
      return -1;
    }
    return Math.min(this.focusedIndexState(), CODE_FIELD_LENGTH - 1);
  });
  protected readonly validationMessages$ = computed(() => {
    if (this.disabledState()) {
      return [];
    }
    return normalizeCxValidationMessages(this.validationMessagesState());
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'));

  protected get resolvedAriaLabel(): string | undefined {
    return this.ariaLabel?.trim() || 'Verification code';
  }

  protected get resolvedAriaDescribedBy(): string | undefined {
    return this.validationMessages$().length > 0 ? this.messagesId : undefined;
  }

  public ngOnDestroy(): void {
    this.clearBlurTimer();
  }

  public clear(): void {
    if (!this.currentValue()) {
      return;
    }
    this.inputRunComplete = false;
    this.syncCells(createEmptyCells(), { emitComplete: false });
  }

  public focus(): void {
    this.focusCell(this.firstEditableIndex());
  }

  protected cellAriaLabel(index: number): string {
    const base = this.resolvedAriaLabel;
    return `${base}, character ${index + 1} of ${CODE_FIELD_LENGTH}`;
  }

  protected onCellInput(index: number, event: Event): void {
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

  protected onCellFocus(index: number): void {
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

  protected onCellBlur(): void {
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

  protected onCellClick(index: number): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.inputRunComplete = false;
    this.focusedIndexState.set(index);
    this.selectCell(index);
  }

  protected onCellKeydown(_index: number, event: KeyboardEvent): void {
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

  protected onCellPaste(index: number, event: ClipboardEvent): void {
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

  private syncCells(cells: readonly CodeFieldCell[], options: { emitComplete: boolean }): void {
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

  private writeTextFrom(index: number, value: string): void {
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

  private setCell(index: number, value: string): void {
    if (index < 0 || index >= CODE_FIELD_LENGTH) {
      return;
    }
    const cells = this.currentCells();
    cells[index] = this.filterValue(value).slice(0, 1);
    this.syncCells(cells, { emitComplete: true });
  }

  private currentCells(): string[] {
    return [...this.cellsState()];
  }

  private currentValue(): string {
    return this.cellsState().join('');
  }

  private setCellsFromExternalValue(value: string): void {
    const cells = createEmptyCells();
    for (const [index, character] of this.filterValue(value).slice(0, CODE_FIELD_LENGTH).split('').entries()) {
      cells[index] = character;
    }
    this.cellsState.set(cells);
  }

  private normalizeCells(cells: readonly CodeFieldCell[]): CodeFieldCell[] {
    return Array.from({ length: CODE_FIELD_LENGTH }, (_, index) => this.filterValue(cells[index] ?? '').slice(0, 1));
  }

  private firstEditableIndex(): number {
    const emptyIndex = this.cellsState().findIndex(cell => !cell);
    return emptyIndex >= 0 ? emptyIndex : CODE_FIELD_LENGTH - 1;
  }

  private isComplete(): boolean {
    return this.cellsState().every(Boolean);
  }

  private focusCell(index: number): void {
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

  private selectCell(index: number): void {
    requestAnimationFrame(() => {
      this.cellInputs?.get(index)?.nativeElement.select();
    });
  }

  private clampIndex(index: number): number {
    return Math.max(0, Math.min(CODE_FIELD_LENGTH - 1, index));
  }

  private clearBlurTimer(): void {
    if (this.blurTimer === undefined) {
      return;
    }
    clearTimeout(this.blurTimer);
    this.blurTimer = undefined;
  }

  private filterValue(raw: string): string {
    const normalized = this.modeState() === 'alphanumeric' ? raw.toUpperCase() : raw;
    return normalized.replace(FILTER_REGEX[this.modeState()], '');
  }
}
