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

export type CxPhoneCountryCodeOption = {
  code: string;
  label: string;
  country: string;
};

export const CX_PHONE_COUNTRY_CODE_OPTIONS: readonly CxPhoneCountryCodeOption[] = [
  { code: '+46', label: 'SE +46', country: 'Sweden' },
  { code: '+1', label: 'US +1', country: 'United States' },
  { code: '+44', label: 'GB +44', country: 'United Kingdom' },
  { code: '+45', label: 'DK +45', country: 'Denmark' },
  { code: '+47', label: 'NO +47', country: 'Norway' },
  { code: '+358', label: 'FI +358', country: 'Finland' },
  { code: '+49', label: 'DE +49', country: 'Germany' },
  { code: '+31', label: 'NL +31', country: 'Netherlands' },
  { code: '+33', label: 'FR +33', country: 'France' },
  { code: '+34', label: 'ES +34', country: 'Spain' },
  { code: '+39', label: 'IT +39', country: 'Italy' },
  { code: '+351', label: 'PT +351', country: 'Portugal' },
  { code: '+48', label: 'PL +48', country: 'Poland' },
  { code: '+372', label: 'EE +372', country: 'Estonia' },
  { code: '+371', label: 'LV +371', country: 'Latvia' },
  { code: '+370', label: 'LT +370', country: 'Lithuania' },
  { code: '+353', label: 'IE +353', country: 'Ireland' },
  { code: '+41', label: 'CH +41', country: 'Switzerland' },
  { code: '+43', label: 'AT +43', country: 'Austria' },
  { code: '+61', label: 'AU +61', country: 'Australia' },
  { code: '+64', label: 'NZ +64', country: 'New Zealand' },
  { code: '+81', label: 'JP +81', country: 'Japan' },
  { code: '+82', label: 'KR +82', country: 'South Korea' },
  { code: '+91', label: 'IN +91', country: 'India' },
  { code: '+55', label: 'BR +55', country: 'Brazil' },
];

@Component({
  selector: 'cx-phone-field',
  imports: [CxValidationMessageComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-phone-field.component.html',
  styleUrl: './cx-phone-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPhoneFieldComponent {
  private static nextId = 0;
  private readonly valueState = signal('');
  private readonly countryCodeState = signal('+46');
  private readonly focusedState = signal(false);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  protected readonly labelId = `cx-phone-field-label-${CxPhoneFieldComponent.nextId}`;
  protected readonly messagesId = `cx-phone-field-messages-${CxPhoneFieldComponent.nextId++}`;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() optional = false;
  @Input() disabled = false;
  @Input() size: CxFieldSize = 'default';
  @Input() loading = false;
  @Input() clearable = false;
  @Input() hint: string | undefined;

  @Input()
  public set countryCode(value: string | undefined) {
    this.countryCodeState.set(this.normalizeCountryCode(value));
  }

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value ?? '');
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly countryCodeChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly countryCode$ = this.countryCodeState.asReadonly();
  protected readonly isFocused$ = computed(() => this.focusedState());
  protected readonly countryCodeOptions$ = computed(() => {
    const countryCode = this.countryCodeState();
    if (CX_PHONE_COUNTRY_CODE_OPTIONS.some(option => option.code === countryCode)) {
      return CX_PHONE_COUNTRY_CODE_OPTIONS;
    }
    return [
      { code: countryCode, label: countryCode, country: 'Custom' },
      ...CX_PHONE_COUNTRY_CODE_OPTIONS,
    ];
  });
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

  protected onCountryCodeChange(event: Event): void {
    if (this.disabled || this.loading) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const nextCountryCode = this.normalizeCountryCode(target.value);
    this.countryCodeState.set(nextCountryCode);
    this.countryCodeChange.emit(nextCountryCode);
  }

  protected onFocusIn(): void {
    if (this.disabled || this.loading || this.focusedState()) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    const currentTarget = event.currentTarget;
    if (nextTarget instanceof Node && currentTarget instanceof Node && currentTarget.contains(nextTarget)) {
      return;
    }
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

  private normalizeCountryCode(value: string | undefined): string {
    const trimmed = value?.trim() || '+46';
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  }
}
