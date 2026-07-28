import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Injector,
  Input,
  Output,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxFieldSize,
  type CxFieldValidation,
  type CxRenderedValidationMessage,
  type CxValidationMessage,
  normalizeCxValidation,
  normalizeCxValidationMessages,
} from '../shared/field.types';

type CxTimeSegment = 'hour' | 'minute';
type CxTimeMeridiem = 'AM' | 'PM';

export type CxTimeFieldMode = 'default' | '12h';
export type CxTimeFieldSize = CxFieldSize;

interface CxParsedTimeValue {
  hours24: number;
  minutes: number;
}

export function parseCxTimeValue(
  value: string | undefined | null,
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

  if (rawMinute < 0 || rawMinute > 59) {
    return null;
  }

  let hours24 = rawHour;
  if (meridiem) {
    if (rawHour < 1 || rawHour > 12) {
      return null;
    }
    hours24 = meridiem === 'AM' ? rawHour % 12 : (rawHour % 12) + 12;
  } else if (rawHour < 0 || rawHour > 23) {
    return null;
  }

  return {
    hours24,
    minutes: rawMinute,
  };
}

export function formatCxTimeValue(
  hours24: number,
  minutes: number,
): string {
  const normalizedHours24 = clamp(hours24, 0, 23);
  const normalizedMinutes = clamp(minutes, 0, 59);
  return `${padTwoDigits(normalizedHours24)}:${padTwoDigits(normalizedMinutes)}`;
}

@Component({
  selector: 'cx-time-field',
  imports: [CxIconComponent, CxSpinnerComponent, CxValidationMessageComponent],
  templateUrl: './cx-time-field.component.html',
  styleUrl: './cx-time-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTimeFieldComponent {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly modeState = signal<CxTimeFieldMode>('default');
  private readonly sizeState = signal<CxTimeFieldSize>('default');
  private readonly hours24State = signal(0);
  private readonly minutesState = signal(0);
  private readonly hourTextState = signal('');
  private readonly minuteTextState = signal('');
  private readonly meridiemState = signal<CxTimeMeridiem>('AM');
  private readonly minuteStepState = signal(1);
  private readonly minState = signal<string | undefined>(undefined);
  private readonly maxState = signal<string | undefined>(undefined);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly focusedState = signal(false);
  private readonly committedValueState = signal<CxParsedTimeValue | null>(null);
  private readonly dirtyDraftState = signal(false);
  private lastEmittedValue: string | undefined;
  private refocusPending = false;
  protected readonly labelId = `cx-time-field-label-${CxTimeFieldComponent.nextId}`;
  protected readonly messagesId = `cx-time-field-messages-${CxTimeFieldComponent.nextId++}`;

  @ViewChild('hourField', { read: ElementRef })
  private readonly hourFieldRef?: ElementRef<HTMLInputElement>;
  @ViewChild('minuteField', { read: ElementRef })
  private readonly minuteFieldRef?: ElementRef<HTMLInputElement>;
  @ViewChild('meridiemButton', { read: ElementRef })
  private readonly meridiemButtonRef?: ElementRef<HTMLButtonElement>;

  @Input() label = 'Time';
  @Input() ariaLabel: string | undefined;
  @Input() hourAriaLabel = 'Hours';
  @Input() minuteAriaLabel = 'Minutes';
  @Input() optional = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() hint: string | undefined;

  @Input()
  public set mode(value: CxTimeFieldMode | undefined) {
    const mode = value === '12h' ? '12h' : 'default';
    if (mode === this.modeState()) {
      return;
    }
    this.modeState.set(mode);
    if (this.committedValueState() && !this.dirtyDraftState()) {
      this.syncDraftFromCanonical(true);
    }
  }

  @Input()
  public set size(value: CxTimeFieldSize | undefined) {
    this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
  }

  @Input()
  public set minuteStep(value: number | undefined) {
    const numeric = Number(value);
    const nextStep = Number.isFinite(numeric) ? clamp(Math.floor(numeric), 1, 59) : 1;
    if (nextStep === this.minuteStepState()) {
      return;
    }

    this.minuteStepState.set(nextStep);
    const committedValue = this.committedValueState();
    if (!committedValue || this.dirtyDraftState()) {
      return;
    }

    const nextMinutes = snapToMinuteStep(committedValue.minutes, nextStep);
    if (nextMinutes === committedValue.minutes) {
      return;
    }

    const nextValue = { ...committedValue, minutes: nextMinutes };
    this.committedValueState.set(nextValue);
    this.hours24State.set(nextValue.hours24);
    this.minutesState.set(nextValue.minutes);
    this.syncDraftFromCanonical(true);
    queueMicrotask(() => this.emitCommittedValue());
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
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Input()
  public set value(value: string | undefined) {
    const parsedValue = parseCxTimeValue(value);
    if (!parsedValue) {
      this.clearDraft();
      this.lastEmittedValue = undefined;
      return;
    }

    this.setCanonicalValue(parsedValue);
    this.lastEmittedValue = this.formattedCommittedValue();
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
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
  protected readonly validationMessages$ = (): ReadonlyArray<CxRenderedValidationMessage> => {
    if (this.disabled) {
      return [];
    }

    const explicitValidation = normalizeCxValidation(this.validationState());
    const explicitError = explicitValidation.find(message => message.type === 'error');
    if (explicitError) {
      return [explicitError];
    }

    const messages: CxValidationMessage[] = [];
    const invalidDraftMessage = this.invalidDraftMessage();
    if (invalidDraftMessage) {
      messages.push({ type: 'error', message: invalidDraftMessage });
    }
    if (this.outOfRange$()) {
      messages.push({ type: 'error', message: this.rangeValidationMessage() });
    }
    const builtInMessages = normalizeCxValidationMessages(messages).slice(0, 1);
    if (builtInMessages.length > 0) {
      return builtInMessages;
    }
    return explicitValidation;
  };
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly shellFocused$ = this.focusedState.asReadonly();
  protected readonly hasClear$ = () =>
    this.clearable && !this.isEmpty$() && !this.disabled && !this.loading;

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
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.push(this.messagesId);
    }
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  @HostListener('focusin')
  protected onFocusIn(): void {
    if (this.isLocked$() || this.focusedState()) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    if (this.refocusPending) {
      return;
    }
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget)) {
      return;
    }

    this.commitDraftOnExit();
    if (!this.focusedState()) {
      return;
    }
    this.focusedState.set(false);
    this.focusChange.emit(false);
  }

  protected onShellMousedown(event: MouseEvent): void {
    if (this.isLocked$()) {
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
    if (this.isLocked$()) {
      return;
    }
    this.selectSegmentText(segment);
  }

  protected onSegmentPointerUp(segment: CxTimeSegment, event: PointerEvent): void {
    if (this.isLocked$()) {
      return;
    }
    event.preventDefault();
    this.selectSegmentText(segment);
  }

  protected onSegmentInput(segment: CxTimeSegment, event: Event): void {
    if (this.isLocked$()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const digits = target.value.replace(/\D/g, '').slice(0, 2);
    this.setSegmentText(segment, digits);
    this.dirtyDraftState.set(true);
    if (digits.length === 1 && shouldAutoPadSingleDigit(segment, digits, this.modeState())) {
      this.setSegmentText(segment, normalizeSegmentDraft(
        segment,
        `0${digits}`,
        this.modeState(),
        this.minuteStepState(),
      ));
      this.commitSegment(segment);
      this.focusNextSegment(segment);
      return;
    }
    if (digits.length === 2) {
      this.commitSegment(segment);
      this.focusNextSegment(segment);
      return;
    }
    this.positionSegmentCaret(segment, digits.length);
  }

  protected onSegmentKeydown(segment: CxTimeSegment, event: KeyboardEvent): void {
    if (this.isLocked$()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
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
        return;
      case 'Delete':
        event.preventDefault();
        this.handleDelete(segment, target);
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
        this.adjustSegment(segment, 1, event.shiftKey);
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.adjustSegment(segment, -1, event.shiftKey);
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
    if (this.isLocked$()) {
      return;
    }

    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') ?? '';
    const parsedValue = parseCxTimeValue(pastedText);
    if (!parsedValue) {
      return;
    }

    this.setCanonicalValue(parsedValue);
    this.emitCommittedValue();
  }

  protected onMeridiemClick(): void {
    if (this.isLocked$() || !this.is12h$()) {
      return;
    }
    this.toggleMeridiem();
  }

  protected onMeridiemKeydown(event: KeyboardEvent): void {
    if (this.isLocked$() || !this.is12h$()) {
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
    this.emitValue(undefined, true);
    this.clear.emit();
    this.refocusPending = true;
    afterNextRender(() => {
      this.focusSegment('hour');
      this.refocusPending = false;
    }, { injector: this.injector });
  }

  private setCanonicalValue(value: CxParsedTimeValue): void {
    const normalizedValue = {
      hours24: clamp(value.hours24, 0, 23),
      minutes: snapToMinuteStep(value.minutes, this.minuteStepState()),
    };
    this.hours24State.set(normalizedValue.hours24);
    this.minutesState.set(normalizedValue.minutes);
    this.committedValueState.set(normalizedValue);
    this.dirtyDraftState.set(false);
    this.syncDraftFromCanonical(true);
  }

  private clearDraft(): void {
    this.hours24State.set(0);
    this.minutesState.set(0);
    this.hourTextState.set('');
    this.minuteTextState.set('');
    this.meridiemState.set('AM');
    this.committedValueState.set(null);
    this.dirtyDraftState.set(false);
  }

  private handleDigit(segment: CxTimeSegment, digit: string, replace: boolean): boolean {
    const currentText = this.getSegmentText(segment);
    const candidate = replace || currentText.length >= 2 ? digit : `${currentText}${digit}`;
    this.dirtyDraftState.set(true);

    if (candidate.length === 1) {
      if (shouldAutoPadSingleDigit(segment, digit, this.modeState())) {
        const normalizedValue = normalizeSegmentDraft(segment, `0${digit}`, this.modeState(), this.minuteStepState());
        this.setSegmentText(segment, normalizedValue);
        this.commitSegment(segment);
        return true;
      }

      this.setSegmentText(segment, candidate);
      this.positionSegmentCaret(segment, 1);
      return false;
    }

    const normalizedValue = normalizeSegmentDraft(segment, candidate, this.modeState(), this.minuteStepState());
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

    const start = input.selectionStart ?? currentText.length;
    const end = input.selectionEnd ?? start;
    if (start === 0 && end === 0) {
      return;
    }

    const nextStart = start === end ? Math.max(0, start - 1) : start;
    const nextText = start === end
      ? `${currentText.slice(0, nextStart)}${currentText.slice(end)}`
      : `${currentText.slice(0, start)}${currentText.slice(end)}`;
    this.setSegmentText(segment, nextText);
    this.dirtyDraftState.set(true);
    this.positionSegmentCaret(segment, nextStart);
  }

  private handleDelete(segment: CxTimeSegment, input: HTMLInputElement): void {
    const currentText = this.getSegmentText(segment);
    if (!currentText) {
      return;
    }

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    if (start === end && start >= currentText.length) {
      return;
    }

    const nextEnd = start === end ? start + 1 : end;
    this.setSegmentText(segment, `${currentText.slice(0, start)}${currentText.slice(nextEnd)}`);
    this.dirtyDraftState.set(true);
    this.positionSegmentCaret(segment, start);
  }

  private adjustSegment(segment: CxTimeSegment, direction: 1 | -1, large: boolean): void {
    const currentValue = this.currentValue();
    if (currentValue) {
      this.setCanonicalValue(currentValue);
    } else if (!this.committedValueState()) {
      this.setCanonicalValue({ hours24: 0, minutes: 0 });
    } else {
      this.syncDraftFromCanonical(true);
    }

    if (segment === 'hour') {
      const delta = direction * (large ? 5 : 1);
      this.hours24State.set(wrap(this.hours24State() + delta, 0, 23));
    } else {
      const stepCount = large ? this.largeMinuteStepCount() : 1;
      this.minutesState.set(stepMinuteOnGrid(
        this.minutesState(),
        this.minuteStepState(),
        direction,
        stepCount,
      ));
    }

    const nextValue = { hours24: this.hours24State(), minutes: this.minutesState() };
    this.committedValueState.set(nextValue);
    this.dirtyDraftState.set(false);
    this.syncDraftFromCanonical(true);
    this.emitCommittedValue();
    this.selectSegmentText(segment);
  }

  private commitSegment(segment: CxTimeSegment): void {
    const text = this.getSegmentText(segment);
    if (!text.trim()) {
      this.setSegmentText(segment, '');
      this.dirtyDraftState.set(true);
      return;
    }

    const normalizedValue = normalizeSegmentDraft(segment, text, this.modeState(), this.minuteStepState());
    this.setSegmentText(segment, normalizedValue);
    this.dirtyDraftState.set(true);
    this.commitCurrentDraft();
  }

  private commitDraftOnExit(): void {
    const hourText = this.hourTextState();
    const minuteText = this.minuteTextState();
    if (!hourText && !minuteText) {
      this.clearDraft();
      this.emitValue(undefined);
      return;
    }

    const fallbackHour = this.is12h$() ? '12' : '00';
    this.hourTextState.set(normalizeSegmentDraft(
      'hour',
      hourText || fallbackHour,
      this.modeState(),
      this.minuteStepState(),
    ));
    this.minuteTextState.set(normalizeSegmentDraft(
      'minute',
      minuteText || '00',
      this.modeState(),
      this.minuteStepState(),
    ));
    this.dirtyDraftState.set(true);
    this.commitCurrentDraft();
  }

  private commitCurrentDraft(): boolean {
    const value = this.currentValue();
    if (!value) {
      return false;
    }

    this.setCanonicalValue(value);
    this.emitCommittedValue();
    return true;
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

  private emitCommittedValue(): void {
    const value = this.formattedCommittedValue();
    if (!value) {
      return;
    }
    this.emitValue(value);
  }

  private emitValue(value: string | undefined, force = false): void {
    if (!force && value === this.lastEmittedValue) {
      return;
    }
    this.lastEmittedValue = value;
    this.valueChange.emit(value);
  }

  private formattedCommittedValue(): string | undefined {
    const value = this.committedValueState();
    return value ? formatCxTimeValue(value.hours24, value.minutes) : undefined;
  }

  private currentValue(): CxParsedTimeValue | null {
    const hourText = this.hourTextState().trim();
    const minuteText = this.minuteTextState().trim();
    if (hourText.length !== 2 || minuteText.length !== 2) {
      return null;
    }
    const hour = Number.parseInt(hourText, 10);
    const minute = Number.parseInt(minuteText, 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }
    const validHour = this.is12h$() ? hour >= 1 && hour <= 12 : hour >= 0 && hour <= 23;
    if (!validHour || minute < 0 || minute > 59) {
      return null;
    }
    return {
      hours24: this.toHours24(hour),
      minutes: minute,
    };
  }

  private totalMinutes(value: CxParsedTimeValue): number {
    return value.hours24 * 60 + value.minutes;
  }

  private toHours24(displayHour: number): number {
    if (this.modeState() !== '12h') {
      return displayHour;
    }
    return this.meridiemState() === 'AM' ? displayHour % 12 : (displayHour % 12) + 12;
  }

  private toggleMeridiem(): void {
    this.setMeridiem(this.meridiemState() === 'AM' ? 'PM' : 'AM');
  }

  private setMeridiem(value: CxTimeMeridiem): void {
    if (value === this.meridiemState()) {
      return;
    }
    this.meridiemState.set(value);
    this.dirtyDraftState.set(true);
    this.commitCurrentDraft();
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
      return;
    }
    this.selectSegmentText('minute');
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

  private positionSegmentCaret(segment: CxTimeSegment, position: number): void {
    const target = segment === 'hour' ? this.hourFieldRef?.nativeElement : this.minuteFieldRef?.nativeElement;
    if (!target) {
      return;
    }
    queueMicrotask(() => target.setSelectionRange(position, position));
  }

  private largeMinuteStepCount(): number {
    return Math.max(1, Math.round(15 / this.minuteStepState()));
  }

  private invalidDraftMessage(): string | undefined {
    const hourText = this.hourTextState().trim();
    if (hourText.length === 2) {
      const hour = Number.parseInt(hourText, 10);
      const validHour = Number.isFinite(hour)
        && (this.is12h$() ? hour >= 1 && hour <= 12 : hour >= 0 && hour <= 23);
      if (!validHour) {
        return this.is12h$()
          ? 'Enter an hour from 1 to 12.'
          : 'Enter an hour from 00 to 23.';
      }
    }

    const minuteText = this.minuteTextState().trim();
    if (minuteText.length === 2) {
      const minute = Number.parseInt(minuteText, 10);
      if (!Number.isFinite(minute) || minute < 0 || minute > 59) {
        return 'Enter minutes from 00 to 59.';
      }
    }
    return undefined;
  }

  private rangeValidationMessage(): string {
    const min = parseCxTimeValue(this.minState());
    const max = parseCxTimeValue(this.maxState());
    const minText = min ? formatCxTimeValue(min.hours24, min.minutes) : undefined;
    const maxText = max ? formatCxTimeValue(max.hours24, max.minutes) : undefined;
    if (minText && maxText) {
      return `Enter a time from ${minText} to ${maxText}.`;
    }
    if (minText) {
      return `Enter a time at or after ${minText}.`;
    }
    if (maxText) {
      return `Enter a time at or before ${maxText}.`;
    }
    return 'Enter an allowed time.';
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
  mode: CxTimeFieldMode,
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

function normalizeSegmentDraft(
  segment: CxTimeSegment,
  value: string,
  mode: CxTimeFieldMode,
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
    if (parsedValue > 59) {
      return padTwoDigits(parsedValue);
    }
    return padTwoDigits(snapToMinuteStep(parsedValue, minuteStep));
  }

  if (mode === '12h' && parsedValue === 0) {
    return '12';
  }
  return padTwoDigits(parsedValue);
}

function snapToMinuteStep(value: number, minuteStep: number): number {
  const normalizedValue = clamp(value, 0, 59);
  return minuteGrid(minuteStep).reduce((closest, candidate) => {
    const closestDistance = Math.abs(normalizedValue - closest);
    const candidateDistance = Math.abs(normalizedValue - candidate);
    return candidateDistance <= closestDistance ? candidate : closest;
  });
}

function stepMinuteOnGrid(
  current: number,
  minuteStep: number,
  direction: 1 | -1,
  count: number,
): number {
  const grid = minuteGrid(minuteStep);
  const exactIndex = grid.indexOf(current);
  let index: number;
  if (exactIndex >= 0) {
    index = exactIndex;
  } else if (direction > 0) {
    const nextIndex = grid.findIndex(value => value > current);
    index = nextIndex >= 0 ? nextIndex - 1 : grid.length - 1;
  } else {
    let previousIndex = -1;
    for (let gridIndex = grid.length - 1; gridIndex >= 0; gridIndex -= 1) {
      if ((grid[gridIndex] ?? 0) < current) {
        previousIndex = gridIndex;
        break;
      }
    }
    index = previousIndex >= 0 ? previousIndex + 1 : 0;
  }

  const moves = Math.max(1, Math.floor(count));
  for (let move = 0; move < moves; move += 1) {
    index = wrap(index + direction, 0, grid.length - 1);
  }
  return grid[index] ?? 0;
}

function minuteGrid(minuteStep: number): number[] {
  const step = clamp(Math.floor(minuteStep), 1, 59);
  const values: number[] = [];
  for (let minute = 0; minute <= 59; minute += step) {
    values.push(minute);
  }
  return values;
}

function toDisplayHour(hours24: number): number {
  const normalized = clamp(hours24, 0, 23);
  const display = normalized % 12;
  return display === 0 ? 12 : display;
}
