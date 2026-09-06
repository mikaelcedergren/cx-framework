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
import { type CxIconName } from '../../../icons/manifest';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxFieldValidation,
  type CxFieldSize,
  normalizeCxValidation,
} from '../shared/field.types';

/** Connects a composite search field to the listbox it controls. */
export type CxTextFieldCombobox = {
  controls: string;
  expanded: boolean;
  activeDescendant?: string;
};

@Component({
  selector: 'cx-text-field',
  imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-text-field.component.html',
  styleUrl: './cx-text-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTextFieldComponent {
  private static nextId = 0;
  private readonly valueState = signal('');
  private readonly focusedState = signal(false);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  protected readonly labelId = `cx-text-field-label-${CxTextFieldComponent.nextId}`;
  protected readonly messagesId = `cx-text-field-messages-${CxTextFieldComponent.nextId++}`;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() label = 'Label';
  @Input() ariaLabel: string | undefined;
  @Input() placeholder: string | undefined;
  @Input() name: string | undefined;
  @Input() autocomplete: string | undefined;
  @Input() inlineEdit = false;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() size: CxFieldSize = 'default';
  @Input() loading = false;
  @Input() clearable = false;
  @Input() prependIcon: CxIconName | undefined;
  @Input() appendIcon: CxIconName | undefined;
  @Input() prependText: string | undefined;
  @Input() appendText: string | undefined;
  @Input() hint: string | undefined;
  @Input() combobox: CxTextFieldCombobox | undefined;

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

  protected get resolvedAriaDescribedBy(): string | undefined {
    return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
  }

  protected get resolvedName(): string | null {
    return this.name?.trim() || null;
  }

  protected get resolvedAutocomplete(): string | null {
    return this.autocomplete?.trim() || null;
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

  protected onEnterKey(event: Event): void {
    if (this.inlineEdit) {
      event.preventDefault();
      this.fieldRef?.nativeElement.blur();
    }
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
