import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxFieldValidation,
  type CxFieldSize,
  normalizeCxValidation,
} from '../shared/field.types';

@Component({
  selector: 'cx-email-field',
  imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-email-field.component.html',
  styleUrl: './cx-email-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxEmailFieldComponent {
  private static nextId = 0;
  private readonly valueState = signal('');
  private readonly focusedState = signal(false);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  protected readonly labelId = `cx-email-field-label-${CxEmailFieldComponent.nextId}`;
  protected readonly messagesId = `cx-email-field-messages-${CxEmailFieldComponent.nextId++}`;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() label = 'Email';
  @Input() ariaLabel: string | undefined;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() size: CxFieldSize = 'default';
  @Input() loading = false;
  @Input() clearable = false;
  @Input() hint: string | undefined;

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value ?? '');
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly isFocused$ = computed(() => this.focusedState());
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidation(this.validationState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly hasClear$ = () =>
    this.clearable && !!this.valueState() && !this.disabled && !this.loading;

  protected get resolvedAriaDescribedBy(): string | undefined {
    return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
  }

  protected get resolvedAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    const label = this.label.trim();
    return label || undefined;
  }

  protected get resolvedAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
  }

  public focus(): void {
    this.fieldRef?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    if (this.disabled || this.loading) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.valueState.set(target.value);
    this.valueChange.emit(target.value);
  }

  protected onFocus(): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.focusedState.set(false);
    this.focusChange.emit(false);
  }

  protected onEscapeKey(): void {
    this.fieldRef?.nativeElement.blur();
  }

  protected onClear(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.valueState.set('');
    this.valueChange.emit('');
    this.clear.emit();
    queueMicrotask(() => this.fieldRef?.nativeElement.focus());
  }
}
