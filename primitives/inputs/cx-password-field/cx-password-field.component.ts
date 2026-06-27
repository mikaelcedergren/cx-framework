import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxTextFieldComponent } from '../cx-text-field';
import { type CxFieldSize, type CxValidationMessage } from '../shared/field.types';

@Component({
  selector: 'cx-password-field',
  imports: [CxTextFieldComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-password-field.component.html',
  styleUrl: './cx-password-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPasswordFieldComponent implements OnDestroy {
  private readonly valueState = signal('');
  private readonly revealedState = signal(false);
  private readonly remainingState = signal(0);
  private revealSecondsValue = 6;
  private countdownTimer: ReturnType<typeof setInterval> | undefined;

  @Input() label = 'Password';
  @Input() name: string | undefined;
  @Input() autocomplete = 'current-password';
  @Input() placeholder = '';
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() size: CxFieldSize = 'default';
  @Input() errorMessage: string | undefined;
  @Input() validationMessages: ReadonlyArray<CxValidationMessage> | null | undefined;

  /**
   * Seconds the password stays revealed before it auto-hides. Doubles as the
   * number of countdown segments shown in the spinner. Defaults to 6.
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

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly revealedChange = new EventEmitter<boolean>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly revealed$ = this.revealedState.asReadonly();
  protected readonly remaining$ = this.remainingState.asReadonly();

  public ngOnDestroy(): void {
    this.stopCountdown();
  }

  protected onValueChange(value: string): void {
    this.valueState.set(value);
    this.valueChange.emit(value);
  }

  protected onToggle(): void {
    if (this.disabled || this.readOnly) {
      return;
    }
    if (this.revealedState()) {
      this.hide();
    } else {
      this.reveal();
    }
  }

  private reveal(): void {
    this.stopCountdown();
    this.remainingState.set(this.revealSecondsValue);
    this.revealedState.set(true);
    this.revealedChange.emit(true);
    this.countdownTimer = setInterval(() => {
      const next = this.remainingState() - 1;
      if (next <= 0) {
        this.hide();
        return;
      }
      this.remainingState.set(next);
    }, 1000);
  }

  private hide(): void {
    this.stopCountdown();
    this.remainingState.set(0);
    if (this.revealedState()) {
      this.revealedState.set(false);
      this.revealedChange.emit(false);
    }
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }
}
