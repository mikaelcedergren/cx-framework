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
import {
  type CxFieldSize,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxCodeFieldMode = 'numeric' | 'alphanumeric';

const FILTER_REGEX: Record<CxCodeFieldMode, RegExp> = {
  numeric: /[^0-9]/g,
  alphanumeric: /[^A-Z0-9]/g,
};

@Component({
  selector: 'cx-code-field',
  imports: [CxValidationMessageComponent],
  templateUrl: './cx-code-field.component.html',
  styleUrl: './cx-code-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCodeFieldComponent {
  private static nextId = 0;

  private readonly lengthState = signal(6);
  private readonly modeState = signal<CxCodeFieldMode>('numeric');
  private readonly valueState = signal('');
  private readonly focusedState = signal(false);
  private readonly disabledState = signal(false);
  private readonly readOnlyState = signal(false);
  private readonly sizeState = signal<CxFieldSize>('default');
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);

  protected readonly messagesId = `cx-code-field-messages-${++CxCodeFieldComponent.nextId}`;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() ariaLabel: string | undefined;
  @Input() autoFocus = false;

  @Input()
  public set length(value: number | null | undefined) {
    const normalized = Number.isFinite(value) ? Math.floor(Number(value)) : 6;
    const nextLength = Math.max(1, Math.min(12, normalized));
    this.lengthState.set(nextLength);
    const nextValue = this.valueState().slice(0, nextLength);
    this.valueState.set(nextValue);
  }

  @Input()
  public set mode(value: CxCodeFieldMode | null | undefined) {
    this.modeState.set(value === 'alphanumeric' ? 'alphanumeric' : 'numeric');
    this.valueState.set(this.filterValue(this.valueState()).slice(0, this.lengthState()));
  }

  @Input()
  public set value(value: string | null | undefined) {
    this.valueState.set(this.filterValue(value ?? '').slice(0, this.lengthState()));
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
  public set size(value: CxFieldSize | null | undefined) {
    this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly complete = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly length$ = this.lengthState.asReadonly();
  protected readonly mode$ = this.modeState.asReadonly();
  protected readonly value$ = this.valueState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly readOnly$ = this.readOnlyState.asReadonly();
  protected readonly size$ = this.sizeState.asReadonly();
  protected readonly focused$ = this.focusedState.asReadonly();
  protected readonly isInteractive$ = computed(() => !this.disabledState() && !this.readOnlyState());
  protected readonly inputMode$ = computed<'numeric' | 'text'>(() => (this.modeState() === 'numeric' ? 'numeric' : 'text'));
  protected readonly pattern$ = computed(() => (this.modeState() === 'numeric' ? '[0-9]*' : '[A-Z0-9]*'));
  protected readonly cells$ = computed(() => {
    const value = this.valueState();
    return Array.from({ length: this.lengthState() }, (_, index) => value[index] ?? '');
  });
  protected readonly activeIndex$ = computed(() => {
    const valueLength = this.valueState().length;
    return valueLength >= this.lengthState() ? -1 : valueLength;
  });
  protected readonly validationMessages$ = computed(() => {
    if (this.disabledState()) {
      return [];
    }
    return normalizeCxValidationMessages(this.validationMessagesState());
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some((message) => message.type === 'error'));

  protected get resolvedAriaLabel(): string | undefined {
    return this.ariaLabel?.trim() || undefined;
  }

  protected get resolvedAriaDescribedBy(): string | undefined {
    return this.validationMessages$().length > 0 ? this.messagesId : undefined;
  }

  public clear(): void {
    if (!this.valueState()) {
      return;
    }
    this.syncValue('');
    if (this.fieldRef) {
      this.fieldRef.nativeElement.value = '';
    }
  }

  public focus(): void {
    this.fieldRef?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    if (!this.isInteractive$()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const value = this.filterValue(target.value).slice(0, this.lengthState());
    if (target.value !== value) {
      target.value = value;
    }
    this.syncValue(value);
  }

  protected onFocus(): void {
    if (this.disabledState()) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.focusedState.set(false);
    this.focusChange.emit(false);
  }

  protected onShellPointerDown(event: Event): void {
    if (!this.isInteractive$()) {
      return;
    }
    event.preventDefault();
    this.focus();
  }

  private syncValue(value: string): void {
    if (value === this.valueState()) {
      return;
    }
    this.valueState.set(value);
    this.valueChange.emit(value);
    if (value.length === this.lengthState()) {
      this.complete.emit(value);
    }
  }

  private filterValue(raw: string): string {
    const normalized = this.modeState() === 'alphanumeric' ? raw.toUpperCase() : raw;
    return normalized.replace(FILTER_REGEX[this.modeState()], '');
  }
}
