import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxFieldSize,
  type CxFieldUpdateOn,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxInputType = 'text' | 'password';
export type CxInputVariant = 'default' | 'inline-edit';

@Component({
  selector: 'cx-input',
  imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-input.component.html',
  styleUrl: './cx-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxInputComponent implements OnDestroy {
  private readonly valueState = signal('');
  private readonly focusedState = signal(false);
  private readonly errorMessageState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private lastEmittedValue = '';
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() label = 'Label';
  @Input() ariaLabel: string | undefined;
  @Input() placeholder = '';
  @Input() type: CxInputType = 'text';
  @Input() variant: CxInputVariant = 'default';
  @Input() optional = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() size: CxFieldSize = 'default';
  @Input() loading = false;
  @Input() clearable = false;
  @Input() updateOn: CxFieldUpdateOn = 'input';
  @Input() debounceMs = 300;
  @Input() prependIcon: CxIconName | undefined;
  @Input() prependIconClickable = false;
  @Input() appendIcon: CxIconName | undefined;
  @Input() appendIconClickable = false;
  @Input() prependText: string | undefined;
  @Input() appendText: string | undefined;
  @Input() hint: string | undefined;

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
    const nextValue = value ?? '';
    this.valueState.set(nextValue);
    this.lastEmittedValue = nextValue;
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly iconClick = new EventEmitter<'prepend' | 'append'>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly isFocused$ = computed(() => this.focusedState());
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidationMessages(this.validationMessagesState(), this.errorMessageState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly hasClear$ = () =>
    this.clearable && !!this.valueState() && !this.disabled && !this.readOnly && !this.loading;

  protected get resolvedAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    const label = this.label.trim();
    return label || undefined;
  }

  protected get effectiveType(): 'text' | 'password' {
    return this.type === 'password' ? 'password' : 'text';
  }

  public ngOnDestroy(): void {
    this.clearDebounce();
  }

  public focus(): void {
    this.fieldRef?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    if (this.disabled || this.readOnly || this.loading) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.valueState.set(target.value);
    if (this.updateOn === 'input') {
      this.clearDebounce();
      this.emitValue(target.value);
      return;
    }
    if (this.updateOn === 'debounced') {
      this.scheduleDebouncedValue(target.value);
    }
  }

  protected onFocus(): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    if (this.updateOn !== 'input') {
      this.commitValue();
    }
    this.focusedState.set(false);
    this.focusChange.emit(false);
  }

  protected onEnterKey(event: Event): void {
    this.commitValue();
    if (this.variant === 'inline-edit') {
      event.preventDefault();
      this.fieldRef?.nativeElement.blur();
    }
  }

  protected onEscapeKey(): void {
    this.fieldRef?.nativeElement.blur();
  }

  protected onIconPress(position: 'prepend' | 'append', event: MouseEvent): void {
    const clickable = position === 'prepend' ? this.prependIconClickable : this.appendIconClickable;
    if (!clickable || this.disabled || this.loading) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.iconClick.emit(position);
  }

  protected onClear(event: MouseEvent): void {
    if (this.disabled || this.readOnly || this.loading) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.valueState.set('');
    this.emitValue('');
    this.clear.emit();
    queueMicrotask(() => this.fieldRef?.nativeElement.focus());
  }

  private commitValue(): void {
    this.clearDebounce();
    const value = this.valueState();
    if (value === this.lastEmittedValue) {
      return;
    }
    this.emitValue(value);
  }

  private emitValue(value: string): void {
    this.lastEmittedValue = value;
    this.valueChange.emit(value);
  }

  private scheduleDebouncedValue(value: string): void {
    this.clearDebounce();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.emitValue(value);
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
}
