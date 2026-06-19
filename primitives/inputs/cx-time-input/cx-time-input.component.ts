import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

type CxTimeSegment = 'hour' | 'minute';
type CxTimeMeridiem = 'AM' | 'PM';

export type CxTimeInputMode = 'default' | '12h';
export type CxTimeInputFormat = '24';
export type CxTimeInputSize = 'small' | 'default' | 'large';

export interface CxTimeInputModel {
  value?: string;
  mode?: CxTimeInputMode;
  minuteStep?: number;
  min?: string;
  max?: string;
  disabled?: boolean;
}

interface CxParsedTimeValue {
  hours24: number;
  minutes: number;
}

export function parseCxTimeValue(
  value: string | undefined | null,
  preferredFormat: CxTimeInputFormat = '24',
): CxParsedTimeValue | null {
  const normalizedValue = value?.trim() ?? '';
  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(/^(\d{1,2})(?::?(\d{2}))?(?:\s*([ap]m))?$/i);
  if (!match) {
    return null;
  }

  let hourText = match[1] ?? '';
  let minuteText = match[2] ?? '';
  const meridiem = match[3]?.toUpperCase() as CxTimeMeridiem | undefined;
  const digits = normalizedValue.replace(/[^0-9]/g, '');
  if (!minuteText && /^\d{3,4}$/.test(digits)) {
    if (digits.length === 3) {
      hourText = digits.slice(0, 1);
      minuteText = digits.slice(1);
    } else {
      hourText = digits.slice(0, 2);
      minuteText = digits.slice(2, 4);
    }
  }

  if (!minuteText) {
    minuteText = '00';
  }

  const rawHour = Number.parseInt(hourText, 10);
  const rawMinute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) {
    return null;
  }

  let hours24 = clamp(rawHour, 0, 23);
  if (meridiem) {
    const hour12 = clamp(rawHour, 1, 12);
    hours24 = meridiem === 'AM' ? hour12 % 12 : (hour12 % 12) + 12;
  }

  void preferredFormat;

  return {
    hours24,
    minutes: clamp(rawMinute, 0, 59),
  };
}

export function formatCxTimeValue(
  hours24: number,
  minutes: number,
  format: CxTimeInputFormat = '24',
): string {
  const normalizedHours24 = clamp(hours24, 0, 23);
  const normalizedMinutes = clamp(minutes, 0, 59);
  void format;

  return `${padTwoDigits(normalizedHours24)}:${padTwoDigits(normalizedMinutes)}`;
}

@Component({
  selector: 'cx-time-input',
  imports: [CxIconComponent, CxValidationMessageComponent],
  templateUrl: './cx-time-input.component.html',
  styleUrl: './cx-time-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTimeInputComponent {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly modeState = signal<CxTimeInputMode>('default');
  private readonly sizeState = signal<CxTimeInputSize>('default');
  private readonly hours24State = signal(0);
  private readonly minutesState = signal(0);
  private readonly hourTextState = signal('');
  private readonly minuteTextState = signal('');
  private readonly meridiemState = signal<CxTimeMeridiem>('AM');
  private readonly minuteStepState = signal(1);
  private readonly minState = signal<string | undefined>(undefined);
  private readonly maxState = signal<string | undefined>(undefined);
  private readonly errorMessageState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private readonly focusedState = signal(false);
  protected readonly labelId = `cx-time-input-label-${CxTimeInputComponent.nextId}`;
  protected readonly messagesId = `cx-time-input-messages-${CxTimeInputComponent.nextId++}`;

  @ViewChild('hourField', { read: ElementRef })
  private readonly hourFieldRef?: ElementRef<HTMLInputElement>;
  @ViewChild('minuteField', { read: ElementRef })
  private readonly minuteFieldRef?: ElementRef<HTMLInputElement>;
  @ViewChild('meridiemButton', { read: ElementRef })
  private readonly meridiemButtonRef?: ElementRef<HTMLButtonElement>;

  @Input() label = 'Time';
  @Input() ariaLabel: string | undefined;
  @Input() ariaDescribedBy: string | undefined;
  @Input() hourAriaLabel = 'Hours';
  @Input() minuteAriaLabel = 'Minutes';
  @Input() optional = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() hint: string | undefined;

  @Input()
  public set time(value: CxTimeInputModel | null | undefined) {
    if (!value) {
      return;
    }

    this.mode = value.mode;
    this.minuteStep = value.minuteStep;
    this.min = value.min;
    this.max = value.max;
    if (value.disabled !== undefined) {
      this.disabled = value.disabled;
    }
    this.value = value.value;
  }

  @Input()
  public set mode(value: CxTimeInputMode | undefined) {
    const mode = value === '12h' ? '12h' : 'default';
    this.modeState.set(mode);
    this.syncDraftFromCanonical();
  }

  @Input()
  public set size(value: CxTimeInputSize | undefined) {
    this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
  }

  @Input()
  public set minuteStep(value: number | undefined) {
    const numeric = Number(value);
    this.minuteStepState.set(Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : 1);
  }

  @Input()
  public set min(value: string | undefined) {
    this.minState.set(value?.trim() || undefined);
  }

  @Input()
  public set max(value: string | undefined) {
    this.maxState.set(value?.trim() || undefined);
  }

  @Input()
  public set format(value: CxTimeInputFormat | undefined) {
    void value;
    this.mode = 'default';
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
    const parsedValue = parseCxTimeValue(value);
    if (!parsedValue) {
      this.clearDraft();
      return;
    }

    this.setCanonicalValue(parsedValue);
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
  @Output() readonly timeChange = new EventEmitter<CxTimeInputModel>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly hourText$ = this.hourTextState.asReadonly();
  protected readonly minuteText$ = this.minuteTextState.asReadonly();
  protected readonly mode$ = this.modeState.asReadonly();
  protected readonly size$ = this.sizeState.asReadonly();
  protected readonly meridiem$ = this.meridiemState.asReadonly();
  protected readonly is12h$ = computed(() => this.modeState() === '12h');
  protected readonly isEmpty$ = computed(() => !this.hourTextState() && !this.minuteTextState());
  protected readonly outOfRange$ = computed(() => {
    const value = this.currentValue();
    if (!value) {
      return false;
    }

    const min = parseCxTimeValue(this.minState());
    const max = parseCxTimeValue(this.maxState());
    const currentMinutes = this.totalMinutes(value);
    return (min && currentMinutes < this.totalMinutes(min)) || (max && currentMinutes > this.totalMinutes(max));
  });
  protected readonly validationMessages$ = () => {
    if (this.disabled) {
      return [];
    }

    const messages: CxValidationMessage[] = [...this.validationMessagesState()];
    if (this.outOfRange$()) {
      messages.push({ type: 'error', message: 'Time must be within the allowed range.' });
    }
    return normalizeCxValidationMessages(messages, this.errorMessageState());
  };
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly shellFocused$ = this.focusedState.asReadonly();
  protected readonly hasClear$ = () =>
    this.clearable && !this.isEmpty$() && !this.disabled && !this.readOnly && !this.loading;

  protected get resolvedGroupAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    if (this.label.trim()) {
      return undefined;
    }
    return 'Time';
  }

  protected get resolvedGroupAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
  }

  protected get resolvedGroupAriaDescribedBy(): string | undefined {
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

  @HostListener('focusin')
  protected onFocusIn(): void {
    if (!this.isLocked$()) {
      this.focusedState.set(true);
      this.focusChange.emit(true);
    }
  }

  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget)) {
      return;
    }

    this.commitSegment('hour');
    this.commitSegment('minute');
    this.focusedState.set(false);
    this.focusChange.emit(false);
  }

  protected onShellMousedown(event: MouseEvent): void {
    if (this.isLocked$() || this.readOnly) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target || target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    event.preventDefault();
    this.focusSegment('hour');
  }

  protected onSegmentFocus(segment: CxTimeSegment): void {
    if (this.isLocked$() || this.readOnly) {
      return;
    }
    this.selectSegmentText(segment);
  }

  protected onSegmentKeydown(segment: CxTimeSegment, event: KeyboardEvent): void {
    if (this.isLocked$() || this.readOnly) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const completed = this.handleDigit(segment, event.key, shouldReplaceSelection(target));
      if (completed) {
        this.focusNextSegment(segment);
      }
      return;
    }

    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        this.handleBackspace(segment, target);
        this.emitCurrentValue();
        return;
      case ':':
      case 'ArrowRight':
        event.preventDefault();
        this.commitSegment(segment);
        this.focusNextSegment(segment);
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.commitSegment(segment);
        this.focusPreviousSegment(segment);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.adjustSegment(segment, event.shiftKey ? this.bigStep(segment) : this.stepForSegment(segment));
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.adjustSegment(segment, event.shiftKey ? -this.bigStep(segment) : -this.stepForSegment(segment));
        return;
      case 'Enter':
        event.preventDefault();
        this.commitSegment(segment);
        return;
      case 'Tab':
        this.commitSegment(segment);
        return;
      default:
        if (event.key.length === 1) {
          event.preventDefault();
        }
    }
  }

  protected onSegmentPaste(event: ClipboardEvent): void {
    if (this.isLocked$() || this.readOnly) {
      return;
    }

    const pastedText = event.clipboardData?.getData('text') ?? '';
    const parsedValue = parseCxTimeValue(pastedText);
    if (!parsedValue) {
      return;
    }

    event.preventDefault();
    this.setCanonicalValue(parsedValue);
    this.emitCurrentValue();
  }

  protected onMeridiemClick(): void {
    if (this.isLocked$() || this.readOnly || !this.is12h$()) {
      return;
    }
    this.toggleMeridiem();
  }

  protected onMeridiemKeydown(event: KeyboardEvent): void {
    if (this.isLocked$() || this.readOnly || !this.is12h$()) {
      return;
    }
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleMeridiem();
        return;
      case 'a':
      case 'A':
        event.preventDefault();
        this.setMeridiem('AM');
        return;
      case 'p':
      case 'P':
        event.preventDefault();
        this.setMeridiem('PM');
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusSegment('minute');
        return;
      default:
        return;
    }
  }

  protected onClear(event: MouseEvent): void {
    if (!this.hasClear$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.clearDraft();
    this.valueChange.emit(undefined);
    this.timeChange.emit(this.currentModel(undefined));
    this.clear.emit();
  }

  private setCanonicalValue(value: CxParsedTimeValue): void {
    this.hours24State.set(value.hours24);
    this.minutesState.set(snapToMinuteStep(value.minutes, this.minuteStepState()));
    this.syncDraftFromCanonical(true);
  }

  private clearDraft(): void {
    this.hours24State.set(0);
    this.minutesState.set(0);
    this.hourTextState.set('');
    this.minuteTextState.set('');
    this.meridiemState.set('AM');
  }

  private handleDigit(segment: CxTimeSegment, digit: string, replace: boolean): boolean {
    const currentText = this.getSegmentText(segment);
    const candidate = replace || currentText.length >= 2 ? digit : `${currentText}${digit}`;

    if (candidate.length === 1) {
      if (shouldAutoPadSingleDigit(segment, digit, this.modeState())) {
        const normalizedValue = normalizeSegmentCandidate(segment, `0${digit}`, this.modeState(), this.minuteStepState());
        this.setSegmentText(segment, normalizedValue);
        this.commitSegment(segment);
        return true;
      }

      this.setSegmentText(segment, candidate);
      this.emitCurrentValue();
      return false;
    }

    const normalizedValue = normalizeSegmentCandidate(segment, candidate, this.modeState(), this.minuteStepState());
    this.setSegmentText(segment, normalizedValue);
    this.commitSegment(segment);
    return true;
  }

  private handleBackspace(segment: CxTimeSegment, input: HTMLInputElement): void {
    const currentText = this.getSegmentText(segment);
    if (!currentText) {
      this.focusPreviousSegment(segment);
      return;
    }

    if (shouldReplaceSelection(input)) {
      this.setSegmentText(segment, '');
      return;
    }

    this.setSegmentText(segment, currentText.slice(0, -1));
  }

  private adjustSegment(segment: CxTimeSegment, delta: number): void {
    if (this.isEmpty$()) {
      this.setCanonicalValue({ hours24: 0, minutes: 0 });
    } else {
      this.commitSegment(segment);
    }

    if (segment === 'hour') {
      this.hours24State.set(wrap(this.hours24State() + delta, 0, 23));
    } else {
      this.minutesState.set(wrap(this.minutesState() + delta, 0, 59));
    }

    this.syncDraftFromCanonical();
    this.emitCurrentValue();
    this.selectSegmentText(segment);
  }

  private commitSegment(segment: CxTimeSegment): void {
    const text = this.getSegmentText(segment);
    if (!text.trim()) {
      this.setSegmentText(segment, '');
      this.emitCurrentValue();
      return;
    }

    const normalizedValue = normalizeSegmentCandidate(segment, text, this.modeState(), this.minuteStepState());
    this.setSegmentText(segment, normalizedValue);

    if (segment === 'hour') {
      this.hours24State.set(this.toHours24(Number.parseInt(normalizedValue, 10)));
    } else {
      this.minutesState.set(Number.parseInt(normalizedValue, 10));
    }

    this.emitCurrentValue();
  }

  private syncDraftFromCanonical(force = false): void {
    if (!force && this.isEmpty$()) {
      return;
    }

    if (this.modeState() === '12h') {
      const hours24 = this.hours24State();
      this.meridiemState.set(hours24 >= 12 ? 'PM' : 'AM');
      this.hourTextState.set(padTwoDigits(toDisplayHour(hours24)));
    } else {
      this.hourTextState.set(padTwoDigits(this.hours24State()));
    }

    this.minuteTextState.set(padTwoDigits(this.minutesState()));
  }

  private emitCurrentValue(): void {
    const value = this.outOfRange$() ? undefined : this.formattedCurrentValue();
    this.valueChange.emit(value);
    this.timeChange.emit(this.currentModel(value));
  }

  private formattedCurrentValue(): string | undefined {
    const parsed = this.currentValue();
    return parsed ? formatCxTimeValue(parsed.hours24, parsed.minutes) : undefined;
  }

  private currentValue(): CxParsedTimeValue | null {
    if (!this.hourTextState().trim() || !this.minuteTextState().trim()) {
      return null;
    }
    const hour = Number.parseInt(this.hourTextState(), 10);
    const minute = Number.parseInt(this.minuteTextState(), 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }
    return {
      hours24: this.toHours24(hour),
      minutes: clamp(minute, 0, 59),
    };
  }

  private currentModel(value: string | undefined): CxTimeInputModel {
    return {
      value,
      mode: this.modeState(),
      minuteStep: this.minuteStepState(),
      min: this.minState(),
      max: this.maxState(),
      disabled: this.disabled,
    };
  }

  private totalMinutes(value: CxParsedTimeValue): number {
    return value.hours24 * 60 + value.minutes;
  }

  private toHours24(displayHour: number): number {
    const hour = this.modeState() === '12h' ? clamp(displayHour, 1, 12) : clamp(displayHour, 0, 23);
    if (this.modeState() !== '12h') {
      return hour;
    }
    return this.meridiemState() === 'AM' ? hour % 12 : (hour % 12) + 12;
  }

  private toggleMeridiem(): void {
    this.setMeridiem(this.meridiemState() === 'AM' ? 'PM' : 'AM');
  }

  private setMeridiem(value: CxTimeMeridiem): void {
    this.meridiemState.set(value);
    const parsed = this.currentValue();
    if (parsed) {
      this.hours24State.set(parsed.hours24);
    }
    this.emitCurrentValue();
  }

  private getSegmentText(segment: CxTimeSegment): string {
    return segment === 'hour' ? this.hourTextState() : this.minuteTextState();
  }

  private setSegmentText(segment: CxTimeSegment, value: string): void {
    if (segment === 'hour') {
      this.hourTextState.set(value);
      return;
    }

    this.minuteTextState.set(value);
  }

  private focusNextSegment(segment: CxTimeSegment): void {
    if (segment === 'hour') {
      this.focusSegment('minute');
      return;
    }
    if (this.is12h$()) {
      this.meridiemButtonRef?.nativeElement.focus();
    }
  }

  private focusPreviousSegment(segment: CxTimeSegment): void {
    if (segment === 'minute') {
      this.focusSegment('hour');
    }
  }

  private focusSegment(segment: CxTimeSegment): void {
    const target = segment === 'hour' ? this.hourFieldRef?.nativeElement : this.minuteFieldRef?.nativeElement;
    target?.focus();
    this.selectSegmentText(segment);
  }

  private selectSegmentText(segment: CxTimeSegment): void {
    const target = segment === 'hour' ? this.hourFieldRef?.nativeElement : this.minuteFieldRef?.nativeElement;
    if (!target) {
      return;
    }

    queueMicrotask(() => {
      target.setSelectionRange(0, target.value.length);
    });
  }

  private stepForSegment(segment: CxTimeSegment): number {
    return segment === 'minute' ? this.minuteStepState() : 1;
  }

  private bigStep(segment: CxTimeSegment): number {
    return segment === 'minute' ? 15 : 5;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function wrap(value: number, min: number, max: number): number {
  const size = max - min + 1;
  return ((value - min + size) % size) + min;
}

function padTwoDigits(value: number): string {
  return `${Math.floor(value)}`.padStart(2, '0');
}

function shouldReplaceSelection(input: HTMLInputElement): boolean {
  return input.selectionStart === 0 && input.selectionEnd === input.value.length;
}

function shouldAutoPadSingleDigit(
  segment: CxTimeSegment,
  digit: string,
  mode: CxTimeInputMode,
): boolean {
  const numericDigit = Number.parseInt(digit, 10);
  if (!Number.isFinite(numericDigit)) {
    return false;
  }

  if (segment === 'minute') {
    return numericDigit > 5;
  }

  return mode === '12h' ? numericDigit > 1 : numericDigit > 2;
}

function normalizeSegmentCandidate(
  segment: CxTimeSegment,
  value: string,
  mode: CxTimeInputMode,
  minuteStep: number,
): string {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    return '';
  }

  const parsedValue = Number.parseInt(digitsOnly, 10);
  if (!Number.isFinite(parsedValue)) {
    return '';
  }

  if (segment === 'minute') {
    return padTwoDigits(snapToMinuteStep(parsedValue, minuteStep));
  }

  return padTwoDigits(mode === '12h' ? clamp(parsedValue, 1, 12) : clamp(parsedValue, 0, 23));
}

function snapToMinuteStep(value: number, minuteStep: number): number {
  const step = Math.max(1, Math.floor(minuteStep));
  return clamp(Math.round(clamp(value, 0, 59) / step) * step, 0, 59);
}

function toDisplayHour(hours24: number): number {
  const normalized = clamp(hours24, 0, 23);
  const display = normalized % 12;
  return display === 0 ? 12 : display;
}
