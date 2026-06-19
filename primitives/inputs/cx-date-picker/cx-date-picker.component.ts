import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxIconComponent } from '../../media/cx-icon';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxSelectComponent, type CxSelectOption } from '../cx-select';
import { CxCheckboxComponent } from '../cx-checkbox';
import {
  CxTimeInputComponent,
  type CxTimeInputFormat,
  formatCxTimeValue,
  parseCxTimeValue,
} from '../cx-time-input';
import {
  CX_MONTH_OPTIONS,
  addCxMonths,
  buildCxCalendarDays,
  compareCxDays,
  formatCxDateDisplay,
  formatCxDateValue,
  getCxTodayParts,
  getCxWeekdayLabels,
  getCxYearOptions,
  isSameCxDay,
  parseCxDateValue,
  type CxCalendarDay,
  type CxCalendarWeekStart,
  type CxLocalDateParts,
} from '../shared/cx-date.utils';
import { measureCxFloatingSurface } from '../../overlay/floating-surface';
import {
  type CxRenderedValidationMessage,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxDatePickerSize = 'small' | 'default' | 'large';
export type CxDatePickerWeekStart = CxCalendarWeekStart;

@Component({
  selector: 'cx-date-picker',
  imports: [
    CxCheckboxComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxPopoverComponent,
    CxSelectComponent,
    CxTimeInputComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-date-picker.component.html',
  styleUrl: './cx-date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDatePickerComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly valueState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private readonly openState = signal(false);
  private readonly focusedState = signal(false);
  private readonly overlayWidthState = signal<number | undefined>(undefined);
  private readonly overlayMaxHeightState = signal<number | undefined>(undefined);
  private readonly overlayLeftState = signal<number | undefined>(undefined);
  private readonly overlayTopState = signal<number | undefined>(undefined);
  private readonly overlayBottomState = signal<number | undefined>(undefined);
  private readonly viewYearState = signal(getCxTodayParts().year);
  private readonly viewMonthState = signal(getCxTodayParts().month);
  private triggerElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  protected readonly messagesId = `cx-date-picker-messages-${CxDatePickerComponent.nextId}`;
  protected readonly surfaceId = `cx-date-picker-surface-${CxDatePickerComponent.nextId++}`;
  protected readonly timeFormat: CxTimeInputFormat = '24';

  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLElement>;

  @Input() placeholder = '';
  @Input() size: CxDatePickerSize = 'default';
  @Input() weekStart: CxDatePickerWeekStart = 'mon';
  @Input() yearRange = 50;
  @Input() min: string | undefined;
  @Input() max: string | undefined;
  @Input() timeEnabled = false;
  @Input() allDayEnabled = false;
  @Input() allDay = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() clearable = false;

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value?.trim() ? value : undefined);
    this.syncViewToValue();
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
  @Output() readonly clear = new EventEmitter<void>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly monthOptions: CxSelectOption[] = CX_MONTH_OPTIONS.map(option => ({
    id: String(option.value),
    label: option.label,
  }));
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly focused$ = this.focusedState.asReadonly();
  protected readonly overlayWidth$ = this.overlayWidthState.asReadonly();
  protected readonly overlayMaxHeight$ = this.overlayMaxHeightState.asReadonly();
  protected readonly overlayLeft$ = this.overlayLeftState.asReadonly();
  protected readonly overlayTop$ = this.overlayTopState.asReadonly();
  protected readonly overlayBottom$ = this.overlayBottomState.asReadonly();
  protected readonly viewYearValue$ = computed(() => `${this.viewYearState()}`);
  protected readonly viewMonthValue$ = computed(() => `${this.viewMonthState()}`);
  protected readonly selectedDate$ = computed(() => parseCxDateValue(this.valueState()));
  protected readonly minDate$ = computed(() => parseCxDateValue(this.min));
  protected readonly maxDate$ = computed(() => parseCxDateValue(this.max));
  protected readonly effectiveAllDay$ = computed(() => this.timeEnabled && this.allDayEnabled && this.allDay);
  protected readonly displayText$ = computed(
    () =>
      formatCxDateDisplay(this.valueState(), this.timeEnabled && !this.effectiveAllDay$(), this.timeFormat) ??
      this.placeholder,
  );
  protected readonly showPlaceholder$ = computed(() => !this.selectedDate$());
  protected readonly weekdayLabels$ = computed(() => getCxWeekdayLabels(this.weekStart));
  protected readonly calendarDays$ = computed(() =>
    buildCxCalendarDays(this.viewYearState(), this.viewMonthState(), this.weekStart),
  );
  protected readonly yearOptions$ = computed<CxSelectOption[]>(() =>
    getCxYearOptions(this.viewYearState(), this.yearRange).map(year => ({
      id: String(year),
      label: String(year),
    })),
  );
  protected readonly selectedTimeValue$ = computed(() => {
    const selectedDate = this.selectedDate$();
    if (!selectedDate) {
      return '00:00';
    }
    return formatCxTimeValue(selectedDate.hours, selectedDate.minutes, this.timeFormat);
  });
  protected readonly hasClear$ = computed(
    () => this.clearable && !!this.selectedDate$() && !this.disabled && !this.readOnly && !this.loading,
  );
  protected readonly outOfRange$ = computed(() => {
    const selectedDate = this.selectedDate$();
    if (!selectedDate) {
      return false;
    }
    return this.isOutsideRange(selectedDate);
  });
  protected readonly validationMessages$ = computed<ReadonlyArray<CxRenderedValidationMessage>>(() => {
    if (this.disabled) {
      return [];
    }
    const messages = [...normalizeCxValidationMessages(this.validationMessagesState())];
    if (this.outOfRange$()) {
      messages.push({
        id: 'error:Date must be within the allowed range.',
        type: 'error',
        message: 'Date must be within the allowed range.',
      });
    }
    return messages;
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly isInteractive$ = () => !this.disabled && !this.loading && !this.readOnly;

  protected get resolvedFieldAriaLabel(): string {
    return this.host.nativeElement.getAttribute('aria-label')?.trim() || this.placeholder.trim() || 'Date';
  }

  public ngAfterViewInit(): void {
    this.triggerElement = this.fieldRef?.nativeElement;
    this.syncOverlayMetrics();
    const trigger = this.triggerElement;
    if (!trigger || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.openState()) {
        this.syncOverlayMetrics();
      }
    });
    this.resizeObserver.observe(trigger);
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected toggleOpen(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }

    const nextOpen = !this.openState();
    this.openState.set(nextOpen);
    if (!nextOpen) {
      return;
    }

    this.triggerElement = field ?? this.triggerElement;
    this.syncViewToValue();
    queueMicrotask(() => {
      this.syncOverlayMetrics();
    });
  }

  protected onFieldKeydown(event: KeyboardEvent, field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleOpen(field);
      return;
    }
    if (event.key === 'Escape') {
      this.openState.set(false);
    }
  }

  protected onFieldFocus(focused: boolean): void {
    if (this.disabled || this.loading || this.focusedState() === focused) {
      return;
    }
    this.focusedState.set(focused);
    this.focusChange.emit(focused);
  }

  protected onClear(event: MouseEvent): void {
    if (!this.hasClear$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.valueState.set(undefined);
    this.openState.set(false);
    this.valueChange.emit(undefined);
    this.clear.emit();
  }

  protected onPreviousMonth(): void {
    const next = addCxMonths(this.viewYearState(), this.viewMonthState(), -1);
    this.viewYearState.set(next.year);
    this.viewMonthState.set(next.month);
  }

  protected onNextMonth(): void {
    const next = addCxMonths(this.viewYearState(), this.viewMonthState(), 1);
    this.viewYearState.set(next.year);
    this.viewMonthState.set(next.month);
  }

  protected onMonthChange(value: string | undefined): void {
    const nextMonth = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(nextMonth) || nextMonth < 1 || nextMonth > 12) {
      return;
    }
    this.viewMonthState.set(nextMonth);
  }

  protected onYearChange(value: string | undefined): void {
    const nextYear = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(nextYear)) {
      return;
    }
    this.viewYearState.set(nextYear);
  }

  protected onDaySelect(day: CxCalendarDay): void {
    if (!this.isInteractive$() || this.isOutsideRange(day)) {
      return;
    }

    const currentValue = this.selectedDate$();
    const nextValue: CxLocalDateParts = {
      year: day.year,
      month: day.month,
      day: day.day,
      hours: currentValue?.hours ?? 0,
      minutes: currentValue?.minutes ?? 0,
    };
    this.commitValue(nextValue);
    this.viewYearState.set(day.year);
    this.viewMonthState.set(day.month);

    if (!this.timeEnabled) {
      this.openState.set(false);
    }
  }

  protected onTimeValueChange(value: string | undefined): void {
    if (!this.isInteractive$()) {
      return;
    }
    const selectedDate = this.selectedDate$();
    if (!selectedDate) {
      return;
    }
    const parsedTime = parseCxTimeValue(value, this.timeFormat);
    if (!parsedTime) {
      return;
    }
    this.commitValue({
      ...selectedDate,
      hours: parsedTime.hours24,
      minutes: parsedTime.minutes,
    });
  }

  protected onAllDayChange(allDay: boolean): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.allDay = allDay;
    const selectedDate = this.selectedDate$();
    if (selectedDate) {
      this.commitValue(selectedDate);
    }
  }

  protected isSelectedDay(day: CxCalendarDay): boolean {
    return isSameCxDay(this.selectedDate$(), day);
  }

  protected isOutsideRange(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    const target: CxLocalDateParts = { year: day.year, month: day.month, day: day.day, hours: 0, minutes: 0 };
    const min = this.minDate$();
    const max = this.maxDate$();
    return (min !== null && compareCxDays(target, min) < 0) || (max !== null && compareCxDays(target, max) > 0);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.openState()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      this.openState.set(false);
      return;
    }
    if (this.host.nativeElement.contains(target)) {
      return;
    }
    const surface = typeof document !== 'undefined' ? document.getElementById(this.surfaceId) : null;
    if (surface && surface.contains(target)) {
      return;
    }
    if (target instanceof Element && target.closest('[data-cx-popover-surface]')) {
      return;
    }
    this.openState.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.openState()) {
      this.openState.set(false);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.syncOverlayMetrics();
    }
  }

  private commitValue(parts: CxLocalDateParts): void {
    const nextValue = formatCxDateValue(parts, this.timeEnabled && !this.effectiveAllDay$());
    this.valueState.set(nextValue);
    this.valueChange.emit(nextValue);
  }

  private syncViewToValue(): void {
    const selectedDate = this.selectedDate$();
    const source = selectedDate ?? getCxTodayParts();
    this.viewYearState.set(source.year);
    this.viewMonthState.set(source.month);
  }

  private syncOverlayMetrics(): void {
    const trigger = this.triggerElement;
    if (!trigger || typeof window === 'undefined') {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const controllerSize = this.readLengthToken('--controller-size', 32);
    const viewportPadding = this.readLengthToken('--space-md', 16);
    const gap = this.readLengthToken('--space-sm', 8);
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: controllerSize * 9.25,
      estimatedHeight: this.timeEnabled ? controllerSize * 12.25 : controllerSize * 9.5,
      align: 'start',
      viewportPadding,
      gap,
    });

    this.overlayWidthState.set(surface.width);
    this.overlayMaxHeightState.set(surface.maxHeight);
    this.overlayLeftState.set(surface.left);
    this.overlayTopState.set(surface.top);
    this.overlayBottomState.set(surface.bottom);
  }

  private readLengthToken(name: string, fallback: number): number {
    const rawValue = window.getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim();
    const parsedValue = Number.parseFloat(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }
}
