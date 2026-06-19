import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, computed, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxFieldSize,
  type CxFieldUpdateOn,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

@Component({
  selector: 'cx-number-field',
  imports: [CxIconComponent, CxSpinnerComponent, CxValidationMessageComponent],
  templateUrl: './cx-number-field.component.html',
  styleUrl: './cx-number-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxNumberFieldComponent implements OnDestroy {
  private static nextId = 0;

  private readonly valueState = signal<number | undefined>(undefined);
  private readonly draftState = signal('');
  private readonly focusedState = signal(false);
  private readonly disabledState = signal(false);
  private readonly readOnlyState = signal(false);
  private readonly loadingState = signal(false);
  private readonly sizeState = signal<CxFieldSize>('default');
  private readonly minState = signal<number | undefined>(undefined);
  private readonly maxState = signal<number | undefined>(undefined);
  private readonly stepState = signal<number | undefined>(undefined);
  private readonly clearableState = signal(false);
  private readonly updateOnState = signal<CxFieldUpdateOn>('blur');
  private readonly prependTextState = signal<string | undefined>(undefined);
  private readonly appendTextState = signal<string | undefined>(undefined);
  private readonly hintState = signal<string | undefined>(undefined);
  private readonly errorMessageState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly labelId = `cx-number-field-label-${CxNumberFieldComponent.nextId}`;
  protected readonly messagesId = `cx-number-field-messages-${CxNumberFieldComponent.nextId++}`;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() label = 'Number';
  @Input() ariaLabel: string | undefined;
  @Input() ariaDescribedBy: string | undefined;
  @Input() placeholder = '';
  @Input() optional = false;

  @Input()
  public set value(value: number | null | undefined) {
    const normalized = this.normalizeOptionalNumber(value);
    this.valueState.set(normalized);
    this.draftState.set(this.formatValue(normalized));
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
  public set loading(value: boolean) {
    this.loadingState.set(!!value);
  }

  @Input()
  public set min(value: number | null | undefined) {
    this.minState.set(this.normalizeOptionalNumber(value));
  }

  @Input()
  public set max(value: number | null | undefined) {
    this.maxState.set(this.normalizeOptionalNumber(value));
  }

  @Input()
  public set step(value: number | null | undefined) {
    this.stepState.set(this.normalizeOptionalNumber(value));
  }

  @Input()
  public set size(value: CxFieldSize | undefined) {
    this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
  }

  @Input()
  public set clearable(value: boolean) {
    this.clearableState.set(!!value);
  }

  @Input()
  public set prependText(value: string | undefined) {
    this.prependTextState.set(value?.trim() || undefined);
  }

  @Input()
  public set appendText(value: string | undefined) {
    this.appendTextState.set(value?.trim() || undefined);
  }

  @Input()
  public set updateOn(value: CxFieldUpdateOn | undefined) {
    this.updateOnState.set(value === 'input' || value === 'debounced' ? value : 'blur');
  }

  @Input() debounceMs = 300;

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

  @Output() readonly valueChange = new EventEmitter<number | undefined>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly draft$ = this.draftState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly readOnly$ = this.readOnlyState.asReadonly();
  protected readonly loading$ = this.loadingState.asReadonly();
  protected readonly size$ = this.sizeState.asReadonly();
  protected readonly min$ = this.minState.asReadonly();
  protected readonly max$ = this.maxState.asReadonly();
  protected readonly step$ = this.stepState.asReadonly();
  protected readonly prependText$ = this.prependTextState.asReadonly();
  protected readonly appendText$ = this.appendTextState.asReadonly();
  protected readonly isLocked$ = computed(() => this.disabledState() || this.loadingState());
  protected readonly isInteractive$ = computed(() => !this.disabledState() && !this.loadingState() && !this.readOnlyState());
  protected readonly hasClear$ = computed(
    () => this.clearableState() && this.valueState() !== undefined && this.isInteractive$(),
  );
  protected readonly validationMessages$ = computed(() => {
    if (this.disabledState()) {
      return [];
    }
    return normalizeCxValidationMessages(this.validationMessagesState(), this.errorMessageState());
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'));
  protected readonly hint$ = computed(() => this.hintState()?.trim() || undefined);
  protected readonly showHint$ = computed(() => !!this.hint$() && this.validationMessages$().length === 0);
  protected readonly shellFocused$ = computed(() => this.focusedState() && !this.isLocked$());

  protected get resolvedAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    if (!this.label.trim()) {
      return 'Number';
    }
    return undefined;
  }

  protected get resolvedAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
  }

  protected get resolvedAriaDescribedBy(): string | undefined {
    const ids: string[] = [];
    const external = this.ariaDescribedBy?.trim();
    if (external) {
      ids.push(external);
    }
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.push(this.messagesId);
    }
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  public focus(): void {
    this.fieldRef?.nativeElement.focus();
  }

  public ngOnDestroy(): void {
    this.clearDebounce();
  }

  protected onInput(event: Event): void {
    if (!this.isInteractive$()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.draftState.set(target.value);
    if (this.updateOnState() === 'input') {
      this.clearDebounce();
      this.commit(target.value);
      return;
    }
    if (this.updateOnState() === 'debounced') {
      this.scheduleDebouncedCommit(target.value);
    }
  }

  protected onFocus(): void {
    if (this.isLocked$()) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    if (this.updateOnState() !== 'input') {
      this.commit(this.draftState());
    }
    this.focusedState.set(false);
    this.focusChange.emit(false);
  }

  protected onCommitOnEnter(event: Event): void {
    if (!this.isInteractive$()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.commit(target.value);
  }

  protected onEscapeKey(): void {
    this.fieldRef?.nativeElement.blur();
  }

  protected onClear(event: MouseEvent): void {
    if (!this.isInteractive$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (this.valueState() === undefined) {
      return;
    }
    this.valueState.set(undefined);
    this.draftState.set('');
    this.valueChange.emit(undefined);
    this.clear.emit();
    queueMicrotask(() => this.fieldRef?.nativeElement.focus());
  }

  private commit(raw: string): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.clearDebounce();

    const trimmed = raw.trim();
    if (!trimmed) {
      this.emitValue(undefined);
      this.draftState.set('');
      return;
    }

    const next = Number(trimmed);
    if (!Number.isFinite(next)) {
      return;
    }

    this.emitValue(next);
    this.draftState.set(trimmed);
  }

  private emitValue(value: number | undefined): void {
    if (value === this.valueState()) {
      return;
    }
    this.valueState.set(value);
    this.valueChange.emit(value);
  }

  private scheduleDebouncedCommit(raw: string): void {
    this.clearDebounce();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.commit(raw);
    }, this.normalizedDebounceMs());
  }

  private clearDebounce(): void {
    if (!this.debounceTimer) {
      return;
    }
    clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;
  }

  private normalizedDebounceMs(): number {
    return Number.isFinite(this.debounceMs) ? Math.max(0, Math.floor(this.debounceMs)) : 300;
  }

  private normalizeOptionalNumber(value: number | null | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private formatValue(value: number | undefined): string {
    return value === undefined ? '' : String(value);
  }

}
