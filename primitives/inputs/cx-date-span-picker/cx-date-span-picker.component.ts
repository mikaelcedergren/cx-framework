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
import { CxCheckboxComponent } from '../cx-checkbox';
import { CxSelectComponent, type CxSelectOption } from '../cx-select';
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
  formatCxDateSpanDisplay,
  formatCxDateValue,
  getCxTodayParts,
  getCxWeekdayLabels,
  getCxYearOptions,
  isCxDayBetween,
  isSameCxDay,
  parseCxDateValue,
  type CxCalendarDay,
  type CxCalendarWeekStart,
  type CxLocalDateParts,
} from '../shared/cx-date.utils';
import { measureCxFloatingSurface } from '../../overlay/floating-surface';
import {
  type CxFieldSize,
  type CxRenderedValidationMessage,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxDateSpanValue = {
  start?: string;
  end?: string;
};

export type CxDateSpanQuickRange = {
  id: string;
  label: string;
  start: string;
  end: string;
};

export type CxDateSpanDisabledDates = (date: Date) => boolean;
export type CxDateSpanPickerSize = CxFieldSize;
export type CxDateSpanPickerWeekStart = CxCalendarWeekStart;

@Component({
  selector: 'cx-date-span-picker',
  imports: [
    CxCheckboxComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxPopoverComponent,
    CxSelectComponent,
    CxTimeInputComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-date-span-picker.component.html',
  styleUrl: './cx-date-span-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDateSpanPickerComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly startValueState = signal<string | undefined>(undefined);
  private readonly endValueState = signal<string | undefined>(undefined);
  private readonly quickRangesState = signal<CxDateSpanQuickRange[]>([]);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private readonly openState = signal(false);
  private readonly overlayWidthState = signal<number | undefined>(undefined);
  private readonly overlayMaxHeightState = signal<number | undefined>(undefined);
  private readonly overlayLeftState = signal<number | undefined>(undefined);
  private readonly overlayTopState = signal<number | undefined>(undefined);
  private readonly overlayBottomState = signal<number | undefined>(undefined);
  private readonly leftViewYearState = signal(getCxTodayParts().year);
  private readonly leftViewMonthState = signal(getCxTodayParts().month);
  private readonly rightViewYearState = signal(addCxMonths(getCxTodayParts().year, getCxTodayParts().month, 1).year);
  private readonly rightViewMonthState = signal(addCxMonths(getCxTodayParts().year, getCxTodayParts().month, 1).month);
  private readonly hoverDayState = signal<Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | undefined>(undefined);
  private triggerElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  protected readonly labelId = `cx-date-span-picker-label-${CxDateSpanPickerComponent.nextId}`;
  protected readonly messagesId = `cx-date-span-picker-messages-${CxDateSpanPickerComponent.nextId}`;
  protected readonly surfaceId = `cx-date-span-picker-surface-${CxDateSpanPickerComponent.nextId++}`;
  protected readonly timeFormat: CxTimeInputFormat = '24';

  @ViewChild('fieldButton', { read: ElementRef })
  private readonly fieldButtonRef?: ElementRef<HTMLElement>;

  @Input() label = 'Date span';
  @Input() placeholder = '';
  @Input() hint: string | undefined;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() optional = false;
  @Input() size: CxDateSpanPickerSize = 'default';
  @Input() timeEnabled = false;
  @Input() allDayEnabled = true;
  @Input() allDayStart = false;
  @Input() allDayEnd = false;
  @Input() min: number | undefined;
  @Input() max: number | undefined;
  @Input() maxSpan: number | undefined;
  @Input() disabledDates: CxDateSpanDisabledDates | undefined;
  @Input() weekStart: CxDateSpanPickerWeekStart = 'mon';
  @Input() clearable = false;
  @Input() closeOnSelect = true;

  @Input()
  public set quickRanges(value: CxDateSpanQuickRange[] | undefined) {
    this.quickRangesState.set((value ?? []).map(range => ({ ...range })));
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set value(value: CxDateSpanValue | undefined) {
    this.startValueState.set(value?.start?.trim() ? value.start : undefined);
    this.endValueState.set(value?.end?.trim() ? value.end : undefined);
    this.syncViewToSelection();
  }

  @Output() readonly valueChange = new EventEmitter<CxDateSpanValue>();
  @Output() readonly allDayStartChange = new EventEmitter<boolean>();
  @Output() readonly allDayEndChange = new EventEmitter<boolean>();

  protected readonly monthOptions: CxSelectOption[] = CX_MONTH_OPTIONS.map(option => ({
    id: String(option.value),
    label: option.label,
  }));
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly overlayWidth$ = this.overlayWidthState.asReadonly();
  protected readonly overlayMaxHeight$ = this.overlayMaxHeightState.asReadonly();
  protected readonly overlayLeft$ = this.overlayLeftState.asReadonly();
  protected readonly overlayTop$ = this.overlayTopState.asReadonly();
  protected readonly overlayBottom$ = this.overlayBottomState.asReadonly();
  protected readonly quickRanges$ = this.quickRangesState.asReadonly();
  protected readonly leftViewYearValue$ = computed(() => `${this.leftViewYearState()}`);
  protected readonly leftViewMonthValue$ = computed(() => `${this.leftViewMonthState()}`);
  protected readonly rightViewYearValue$ = computed(() => `${this.rightViewYearState()}`);
  protected readonly rightViewMonthValue$ = computed(() => `${this.rightViewMonthState()}`);
  protected readonly startDate$ = computed(() => parseCxDateValue(this.startValueState()));
  protected readonly endDate$ = computed(() => parseCxDateValue(this.endValueState()));
  protected readonly displayText$ = computed(
    () => formatCxDateSpanDisplay(this.startValueState(), this.endValueState()) ?? this.placeholder,
  );
  protected readonly showPlaceholder$ = computed(() => !this.startDate$() && !this.endDate$());
  protected readonly weekdayLabels$ = computed(() => getCxWeekdayLabels(this.weekStart));
  protected readonly leftCalendarDays$ = computed(() =>
    buildCxCalendarDays(this.leftViewYearState(), this.leftViewMonthState(), this.weekStart),
  );
  protected readonly rightCalendarDays$ = computed(() =>
    buildCxCalendarDays(this.rightViewYearState(), this.rightViewMonthState(), this.weekStart),
  );
  protected readonly leftYearOptions$ = computed<CxSelectOption[]>(() =>
    getCxYearOptions(this.leftViewYearState(), 12).map(year => ({
      id: String(year),
      label: String(year),
    })),
  );
  protected readonly rightYearOptions$ = computed<CxSelectOption[]>(() =>
    getCxYearOptions(this.rightViewYearState(), 12).map(year => ({
      id: String(year),
      label: String(year),
    })),
  );
  protected readonly startTimeValue$ = computed(() => {
    const startDate = this.startDate$();
    return startDate ? formatCxTimeValue(startDate.hours, startDate.minutes, this.timeFormat) : '00:00';
  });
  protected readonly endTimeValue$ = computed(() => {
    const endDate = this.endDate$();
    return endDate ? formatCxTimeValue(endDate.hours, endDate.minutes, this.timeFormat) : '23:59';
  });
  protected readonly effectiveAllDayStart$ = computed(
    () => this.timeEnabled && this.allDayEnabled && this.allDayStart,
  );
  protected readonly effectiveAllDayEnd$ = computed(
    () => this.timeEnabled && this.allDayEnabled && this.allDayEnd,
  );
  protected readonly hasClear$ = computed(
    () =>
      this.clearable &&
      (!!this.startDate$() || !!this.endDate$()) &&
      !this.disabled &&
      !this.readOnly &&
      !this.loading,
  );
  protected readonly validationMessages$ = computed<ReadonlyArray<CxRenderedValidationMessage>>(() =>
    this.disabled ? [] : normalizeCxValidationMessages(this.validationMessagesState()),
  );
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0);
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly isInteractive$ = () => !this.disabled && !this.loading && !this.readOnly;
  protected readonly summaryText$ = computed(() => {
    const startText = formatCxDateDisplay(this.startValueState(), this.timeEnabled, this.timeFormat);
    const endText = formatCxDateDisplay(this.endValueState(), this.timeEnabled, this.timeFormat);
    if (startText && endText) {
      return `From ${startText} to ${endText}`;
    }
    if (startText) {
      return `From ${startText}`;
    }
    if (endText) {
      return `Until ${endText}`;
    }
    return undefined;
  });

  protected get resolvedFieldAriaLabel(): string | undefined {
    if (this.label.trim()) {
      return undefined;
    }
    return this.placeholder.trim() || 'Date span';
  }

  protected get resolvedFieldAriaLabelledBy(): string | undefined {
    return this.label.trim() ? this.labelId : undefined;
  }

  protected get resolvedFieldAriaDescribedBy(): string | undefined {
    return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
  }

  public ngAfterViewInit(): void {
    this.triggerElement = this.fieldButtonRef?.nativeElement;
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
    this.syncViewToSelection();
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

  protected onLeftPreviousMonth(): void {
    const next = addCxMonths(this.leftViewYearState(), this.leftViewMonthState(), -1);
    this.leftViewYearState.set(next.year);
    this.leftViewMonthState.set(next.month);
  }

  protected onLeftNextMonth(): void {
    const next = addCxMonths(this.leftViewYearState(), this.leftViewMonthState(), 1);
    this.leftViewYearState.set(next.year);
    this.leftViewMonthState.set(next.month);
  }

  protected onRightPreviousMonth(): void {
    const next = addCxMonths(this.rightViewYearState(), this.rightViewMonthState(), -1);
    this.rightViewYearState.set(next.year);
    this.rightViewMonthState.set(next.month);
  }

  protected onRightNextMonth(): void {
    const next = addCxMonths(this.rightViewYearState(), this.rightViewMonthState(), 1);
    this.rightViewYearState.set(next.year);
    this.rightViewMonthState.set(next.month);
  }

  protected onLeftMonthChange(value: string | undefined): void {
    const nextMonth = this.parseMonth(value);
    if (nextMonth === undefined) {
      return;
    }
    this.leftViewMonthState.set(nextMonth);
  }

  protected onLeftYearChange(value: string | undefined): void {
    const nextYear = this.parseYear(value);
    if (nextYear === undefined) {
      return;
    }
    this.leftViewYearState.set(nextYear);
  }

  protected onRightMonthChange(value: string | undefined): void {
    const nextMonth = this.parseMonth(value);
    if (nextMonth === undefined) {
      return;
    }
    this.rightViewMonthState.set(nextMonth);
  }

  protected onRightYearChange(value: string | undefined): void {
    const nextYear = this.parseYear(value);
    if (nextYear === undefined) {
      return;
    }
    this.rightViewYearState.set(nextYear);
  }

  protected onDaySelect(day: CxCalendarDay): void {
    if (!this.isInteractive$() || !this.isDaySelectable(day)) {
      return;
    }

    const currentStart = this.startDate$();
    const currentEnd = this.endDate$();

    if (!currentStart || currentEnd) {
      const nextStart = this.buildBoundaryParts(day, 'start', currentStart);
      this.commitRange(nextStart, undefined);
      return;
    }

    if (compareCxDays(day, currentStart) < 0) {
      const nextStart = this.buildBoundaryParts(day, 'start', currentStart);
      const nextEnd = this.buildBoundaryParts(currentStart, 'end', currentEnd ?? currentStart);
      this.commitRange(nextStart, nextEnd);
    } else {
      const nextEnd = this.buildBoundaryParts(day, 'end', currentEnd ?? currentStart);
      this.commitRange(currentStart, nextEnd);
    }

    if (this.closeOnSelect && !this.timeEnabled) {
      this.openState.set(false);
    }
  }

  protected onQuickRangeSelect(range: CxDateSpanQuickRange): void {
    if (!this.isInteractive$()) {
      return;
    }
    const start = parseCxDateValue(range.start);
    const end = parseCxDateValue(range.end);
    if (!start || !end) {
      return;
    }
    this.commitRange(start, end);
    if (this.closeOnSelect && !this.timeEnabled) {
      this.openState.set(false);
    }
  }

  protected onClear(event: MouseEvent): void {
    if (!this.hasClear$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.commitRange(undefined, undefined);
    this.setAllDayStart(false);
    this.setAllDayEnd(false);
  }

  protected onStartTimeChange(value: string | undefined): void {
    if (!this.isInteractive$()) {
      return;
    }
    const startDate = this.startDate$();
    if (!startDate) {
      return;
    }
    const parsedTime = parseCxTimeValue(value, this.timeFormat);
    if (!parsedTime) {
      return;
    }
    this.commitRange(
      {
        ...startDate,
        hours: parsedTime.hours24,
        minutes: parsedTime.minutes,
      },
      this.endDate$() ?? undefined,
    );
  }

  protected onEndTimeChange(value: string | undefined): void {
    if (!this.isInteractive$()) {
      return;
    }
    const endDate = this.endDate$();
    if (!endDate) {
      return;
    }
    const parsedTime = parseCxTimeValue(value, this.timeFormat);
    if (!parsedTime) {
      return;
    }
    this.commitRange(
      this.startDate$() ?? undefined,
      {
        ...endDate,
        hours: parsedTime.hours24,
        minutes: parsedTime.minutes,
      },
    );
  }

  protected onAllDayStartChange(value: boolean): void {
    this.setAllDayStart(value);
    if (!value) {
      return;
    }
    const startDate = this.startDate$();
    if (!startDate) {
      return;
    }
    this.commitRange({ ...startDate, hours: 0, minutes: 0 }, this.endDate$() ?? undefined);
  }

  protected onAllDayEndChange(value: boolean): void {
    this.setAllDayEnd(value);
    if (!value) {
      return;
    }
    const endDate = this.endDate$();
    if (!endDate) {
      return;
    }
    this.commitRange(this.startDate$() ?? undefined, { ...endDate, hours: 23, minutes: 59 });
  }

  protected onDayHover(day: CxCalendarDay): void {
    this.hoverDayState.set({ year: day.year, month: day.month, day: day.day });
  }

  protected onDayLeave(): void {
    this.hoverDayState.set(undefined);
  }

  protected isStartDay(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    return isSameCxDay(this.startDate$(), day);
  }

  protected isEndDay(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    return isSameCxDay(this.endDate$(), day);
  }

  protected isPreviewEnd(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    const start = this.startDate$();
    const end = this.endDate$();
    const hover = this.hoverDayState();
    return !!start && !end && !!hover && isSameCxDay(day, hover) && !isSameCxDay(day, start);
  }

  protected isInRange(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    if (this.isStartDay(day) || this.isEndDay(day)) {
      return false;
    }
    const start = this.startDate$();
    const end = this.endDate$();
    if (end) {
      return isCxDayBetween(day, start, end);
    }
    const hover = this.hoverDayState();
    if (!start || !hover || isSameCxDay(day, hover)) {
      return false;
    }
    return compareCxDays(hover, start) < 0 ? isCxDayBetween(day, hover, start) : isCxDayBetween(day, start, hover);
  }

  protected isDaySelectable(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    const today = getCxTodayParts();
    if (typeof this.min === 'number' && compareCxDays(day, this.addDaysToParts(today, Math.trunc(this.min))) < 0) {
      return false;
    }
    if (typeof this.max === 'number' && compareCxDays(day, this.addDaysToParts(today, Math.trunc(this.max))) > 0) {
      return false;
    }
    if (this.disabledDates?.(this.toLocalDate(day))) {
      return false;
    }
    const start = this.startDate$();
    const maxSpan = typeof this.maxSpan === 'number' && this.maxSpan > 0 ? Math.floor(this.maxSpan) : undefined;
    if (maxSpan && start && !this.endDate$() && Math.abs(this.differenceInDays(day, start)) >= maxSpan) {
      return false;
    }
    return true;
  }

  protected isQuickRangeActive(range: CxDateSpanQuickRange): boolean {
    return this.startValueState() === range.start && this.endValueState() === range.end;
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

  private parseMonth(value: string | undefined): number | undefined {
    const nextMonth = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(nextMonth) || nextMonth < 1 || nextMonth > 12) {
      return undefined;
    }
    return nextMonth;
  }

  private parseYear(value: string | undefined): number | undefined {
    const nextYear = Number.parseInt(value ?? '', 10);
    return Number.isFinite(nextYear) ? nextYear : undefined;
  }

  private buildBoundaryParts(
    date: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
    boundary: 'start' | 'end',
    fallback?: Pick<CxLocalDateParts, 'hours' | 'minutes'> | null,
  ): CxLocalDateParts {
    const isAllDay = boundary === 'start' ? this.effectiveAllDayStart$() : this.effectiveAllDayEnd$();
    return {
      year: date.year,
      month: date.month,
      day: date.day,
      hours: isAllDay ? (boundary === 'end' ? 23 : 0) : fallback?.hours ?? (boundary === 'end' && this.timeEnabled ? 23 : 0),
      minutes: isAllDay ? (boundary === 'end' ? 59 : 0) : fallback?.minutes ?? (boundary === 'end' && this.timeEnabled ? 59 : 0),
    };
  }

  private commitRange(start: CxLocalDateParts | undefined, end: CxLocalDateParts | undefined): void {
    const nextValue: CxDateSpanValue = {
      start: start ? formatCxDateValue(start, this.timeEnabled) : undefined,
      end: end ? formatCxDateValue(end, this.timeEnabled) : undefined,
    };
    this.startValueState.set(nextValue.start);
    this.endValueState.set(nextValue.end);
    this.valueChange.emit(nextValue);
    this.syncViewToSelection();
  }

  private setAllDayStart(value: boolean): void {
    if (this.allDayStart === value) {
      return;
    }
    this.allDayStart = value;
    this.allDayStartChange.emit(value);
  }

  private setAllDayEnd(value: boolean): void {
    if (this.allDayEnd === value) {
      return;
    }
    this.allDayEnd = value;
    this.allDayEndChange.emit(value);
  }

  private syncViewToSelection(): void {
    const source = this.startDate$() ?? getCxTodayParts();
    const nextRight = addCxMonths(source.year, source.month, 1);
    this.leftViewYearState.set(source.year);
    this.leftViewMonthState.set(source.month);
    this.rightViewYearState.set(nextRight.year);
    this.rightViewMonthState.set(nextRight.month);
  }

  private syncOverlayMetrics(): void {
    const trigger = this.triggerElement;
    if (!trigger || typeof window === 'undefined') {
      return;
    }

    const controllerSize = this.readLengthToken('--controller-size', 32);
    const spaceXs = this.readLengthToken('--space-xs', 4);
    const spaceSm = this.readLengthToken('--space-sm', 8);
    const spaceMd = this.readLengthToken('--space-md', 16);
    const calendarWidth = controllerSize * 8.75;
    const calendarGap = spaceSm + spaceXs;
    const surfacePadding = spaceSm * 2;
    const quickRangeWidth = this.quickRangesState().length > 0 ? controllerSize * 4 + spaceSm + spaceXs + spaceSm : 0;
    const rect = trigger.getBoundingClientRect();
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: calendarWidth * 2 + calendarGap + surfacePadding + spaceSm + quickRangeWidth,
      estimatedHeight: this.timeEnabled ? controllerSize * 13 : controllerSize * 10.5,
      align: 'start',
      viewportPadding: spaceMd,
      gap: spaceSm,
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

  private addDaysToParts(parts: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>, delta: number): CxLocalDateParts {
    const next = new Date(parts.year, parts.month - 1, parts.day + delta, 12, 0, 0, 0);
    return {
      year: next.getFullYear(),
      month: next.getMonth() + 1,
      day: next.getDate(),
      hours: 0,
      minutes: 0,
    };
  }

  private differenceInDays(
    a: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
    b: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
  ): number {
    const aDate = this.toLocalDate(a);
    const bDate = this.toLocalDate(b);
    return Math.round((aDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private toLocalDate(parts: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): Date {
    return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
  }
}
