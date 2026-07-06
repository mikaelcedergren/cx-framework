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
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxFieldValidation, type CxFieldSize, normalizeCxValidation } from '../shared/field.types';

@Component({
  selector: 'cx-password-field',
  imports: [CxValidationMessageComponent, CxSpinnerComponent, CxIconComponent],
  templateUrl: './cx-password-field.component.html',
  styleUrl: './cx-password-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPasswordFieldComponent implements OnDestroy {
  private static nextId = 0;
  private readonly valueState = signal('');
  private readonly focusedState = signal(false);
  private readonly revealedState = signal(false);
  private readonly revealStepState = signal(0);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private revealSecondsValue = 6;
  private firstStepTimer: ReturnType<typeof setTimeout> | undefined;
  private stepTimer: ReturnType<typeof setInterval> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly labelId = `cx-password-field-label-${CxPasswordFieldComponent.nextId}`;
  protected readonly messagesId = `cx-password-field-messages-${CxPasswordFieldComponent.nextId++}`;

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLInputElement>;

  @Input() label = 'Password';
  @Input() ariaLabel: string | undefined;
  @Input() name: string | undefined;
  @Input() autocomplete = 'current-password';
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() size: CxFieldSize = 'default';

  /**
   * Seconds the password stays revealed before it auto-hides. Defaults to 6.
   */
  @Input()
  public set revealSeconds(value: number | undefined) {
    this.revealSecondsValue =
      Number.isFinite(value) && (value as number) >= 1 ? Math.floor(value as number) : 6;
  }
  public get revealSeconds(): number {
    return this.revealSecondsValue;
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value ?? '');
  }

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly revealedChange = new EventEmitter<boolean>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly isFocused$ = computed(() => this.focusedState());
  protected readonly revealed$ = this.revealedState.asReadonly();
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidation(this.validationState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly hasClear$ = () =>
    this.clearable && !!this.valueState() && !this.disabled && !this.loading;

  public ngOnDestroy(): void {
    this.stopCountdown();
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

  protected onEscapeKey(): void {
    this.fieldRef?.nativeElement.blur();
  }

  protected onToggle(): void {
    if (this.disabled || this.loading) {
      return;
    }
    if (this.revealedState()) {
      this.hide();
    } else {
      this.reveal();
    }
  }

  protected onClear(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.valueState.set('');
    this.valueChange.emit('');
    queueMicrotask(() => this.fieldRef?.nativeElement.focus());
  }

  private reveal(): void {
    this.stopCountdown();
    this.revealStepState.set(0);
    this.revealedState.set(true);
    this.revealedChange.emit(true);
    this.firstStepTimer = setTimeout(() => {
      this.setRevealStep(1);
    }, 30);
    this.stepTimer = setInterval(() => {
      this.setRevealStep(this.revealStepState() + 1);
    }, 1000);
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, this.revealSecondsValue * 1000);
  }

  private hide(): void {
    this.stopCountdown();
    if (this.revealedState()) {
      this.revealedState.set(false);
      this.revealedChange.emit(false);
    }
  }

  private stopCountdown(): void {
    this.stopStepTimers();
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  private stopStepTimers(): void {
    if (this.firstStepTimer) {
      clearTimeout(this.firstStepTimer);
      this.firstStepTimer = undefined;
    }
    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = undefined;
    }
  }

  private setRevealStep(step: number): void {
    const nextStep = Math.min(Math.max(step, 0), this.revealSecondsValue);
    this.revealStepState.set(nextStep);
    if (nextStep >= this.revealSecondsValue) {
      this.stopStepTimers();
    }
  }

  protected revealOffsetStyle(): string {
    return String(-(this.revealStepState() / this.revealSecondsValue));
  }
}
