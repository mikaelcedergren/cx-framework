import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxDropdownComponent, type CxDropdownOption } from '../cx-dropdown';
import {
  CX_MONTH_OPTIONS,
  addCxMonths,
  buildCxCalendarDays,
  compareCxDays,
  getCxDaysInMonth,
  getCxWeekdayLabels,
  getCxTodayParts,
  getCxYearOptions,
  isCxDayBetween,
  isSameCxDay,
  type CxCalendarDay,
  type CxCalendarWeekStart,
  type CxLocalDateParts,
} from '../shared/cx-date.utils';

export type CxCalendarVariant = 'default' | 'embedded';
export type CxCalendarSelectionMode = 'single' | 'range';
export type CxCalendarDisabledDates = (date: Date) => boolean;
export interface CxCalendarRange {
  start?: Date;
  end?: Date;
}

const calendarDayLabelFormatter = new Intl.DateTimeFormat('en-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const calendarGridLabelFormatter = new Intl.DateTimeFormat('en-SE', {
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'cx-calendar',
  imports: [CxIconButtonComponent, CxDropdownComponent],
  templateUrl: './cx-calendar.component.html',
  styleUrl: './cx-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCalendarComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly valueState = signal<Date | undefined>(undefined);
  private readonly rangeState = signal<CxCalendarRange>({});
  private readonly rangePreviewEndState = signal<Date | undefined>(undefined);
  private readonly viewYearState = signal(getCxTodayParts().year);
  private readonly viewMonthState = signal(getCxTodayParts().month);
  private readonly focusedDayKeyState = signal<string | undefined>(undefined);
  private hasControlledView = false;
  private focusFrame: number | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (typeof window !== 'undefined' && this.focusFrame !== undefined) {
        window.cancelAnimationFrame(this.focusFrame);
      }
    });
  }

  @Input() variant: CxCalendarVariant = 'default';
  @Input() selectionMode: CxCalendarSelectionMode = 'single';
  @Input() weekStart: CxCalendarWeekStart = 'mon';
  @Input() yearRange = 12;
  @Input() disabled = false;
  @Input() min: Date | undefined;
  @Input() max: Date | undefined;
  @Input() disabledDates: CxCalendarDisabledDates | undefined;

  @Input()
  public set value(value: Date | undefined) {
    const nextValue = this.validDate(value);
    this.valueState.set(nextValue);
    if (!this.hasControlledView) {
      this.syncViewToDate(nextValue);
    }
  }

  @Input()
  public set range(value: CxCalendarRange | undefined) {
    const nextRange = {
      start: this.validDate(value?.start),
      end: this.validDate(value?.end),
    };
    this.rangeState.set(nextRange);
    if (!this.hasControlledView) {
      this.syncViewToDate(nextRange.start);
    }
  }

  @Input()
  public set viewDate(value: Date | undefined) {
    const nextView = this.validDate(value);
    this.hasControlledView = !!nextView;
    this.syncViewToDate(nextView ?? this.valueState() ?? this.rangeState().start);
  }

  @Input()
  public set rangePreviewEnd(value: Date | undefined) {
    this.rangePreviewEndState.set(this.validDate(value));
  }

  @Output() readonly valueChange = new EventEmitter<Date | undefined>();
  @Output() readonly rangeChange = new EventEmitter<CxCalendarRange>();
  @Output() readonly rangePreviewEndChange = new EventEmitter<Date | undefined>();
  @Output() readonly viewDateChange = new EventEmitter<Date>();

  protected readonly monthOptions: CxDropdownOption[] = CX_MONTH_OPTIONS.map(option => ({
    id: String(option.value),
    label: option.label,
  }));
  protected readonly viewYearValue$ = computed(() => `${this.viewYearState()}`);
  protected readonly viewMonthValue$ = computed(() => `${this.viewMonthState()}`);
  protected readonly selectedDate$ = computed(() => this.toDateParts(this.valueState()));
  protected readonly rangeStart$ = computed(() => this.toDateParts(this.rangeState().start));
  protected readonly rangeEnd$ = computed(() => this.toDateParts(this.rangeState().end));
  protected readonly rangePreviewEnd$ = computed(() => this.toDateParts(this.rangePreviewEndState()));
  protected readonly yearOptions$ = computed<CxDropdownOption[]>(() =>
    getCxYearOptions(this.viewYearState(), this.yearRange).map(year => ({
      id: String(year),
      label: String(year),
    })),
  );
  protected readonly weekdayLabels$ = computed(() => getCxWeekdayLabels(this.weekStart));
  protected readonly calendarDays$ = computed(() =>
    buildCxCalendarDays(this.viewYearState(), this.viewMonthState(), this.weekStart),
  );
  protected readonly gridAriaLabel$ = computed(() =>
    calendarGridLabelFormatter.format(
      new Date(this.viewYearState(), this.viewMonthState() - 1, 1, 12, 0, 0, 0),
    ),
  );
  protected readonly tabbableDayKey$ = computed(() => this.resolveTabbableDay()?.key);

  /**
   * Moves focus to the calendar's current roving day.
   * Returns false when the calendar is disabled or every rendered day is unavailable.
   */
  public focusActiveDay(): boolean {
    if (this.disabled) {
      return false;
    }
    const day = this.resolveTabbableDay();
    if (!day) {
      return false;
    }
    this.focusedDayKeyState.set(day.key);
    if (!this.focusDayButton(day.key)) {
      this.scheduleDayFocus(day.key);
    }
    return true;
  }

  protected onPreviousMonth(): void {
    const next = addCxMonths(this.viewYearState(), this.viewMonthState(), -1);
    this.setView(next.year, next.month);
  }

  protected onNextMonth(): void {
    const next = addCxMonths(this.viewYearState(), this.viewMonthState(), 1);
    this.setView(next.year, next.month);
  }

  protected onMonthChange(value: string | undefined): void {
    const month = Number.parseInt(value ?? '', 10);
    if (Number.isFinite(month) && month >= 1 && month <= 12) {
      this.setView(this.viewYearState(), month);
    }
  }

  protected onYearChange(value: string | undefined): void {
    const year = Number.parseInt(value ?? '', 10);
    if (Number.isFinite(year)) {
      this.setView(year, this.viewMonthState());
    }
  }

  protected onDaySelect(day: CxCalendarDay): void {
    if (this.disabled || this.isOutsideRange(day)) {
      return;
    }
    this.focusedDayKeyState.set(day.key);
    const nextValue = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);

    if (this.selectionMode === 'range') {
      const currentRange = this.rangeState();
      const currentStart = this.toDateParts(currentRange.start);
      const currentEnd = this.toDateParts(currentRange.end);
      let nextRange: CxCalendarRange;

      if (!currentStart || currentEnd) {
        nextRange = { start: nextValue };
      } else if (compareCxDays(day, currentStart) < 0) {
        nextRange = { start: nextValue, end: currentRange.start };
      } else {
        nextRange = { start: currentRange.start, end: nextValue };
      }

      this.rangeState.set(nextRange);
      this.clearRangePreview();
      this.setView(day.year, day.month);
      this.rangeChange.emit(nextRange);
      return;
    }

    this.valueState.set(nextValue);
    this.setView(day.year, day.month);
    this.valueChange.emit(nextValue);
  }

  protected isSelectedDay(day: CxCalendarDay): boolean {
    return this.selectionMode === 'single' && isSameCxDay(this.selectedDate$(), day);
  }

  protected isRangeStartDay(day: CxCalendarDay): boolean {
    return this.selectionMode === 'range' && isSameCxDay(this.rangeStart$(), day);
  }

  protected isRangeEndDay(day: CxCalendarDay): boolean {
    return this.selectionMode === 'range' && isSameCxDay(this.rangeEnd$(), day);
  }

  protected isRangePreviewEnd(day: CxCalendarDay): boolean {
    const start = this.rangeStart$();
    const end = this.rangeEnd$();
    const hover = this.rangePreviewEnd$();
    return this.selectionMode === 'range' && !!start && !end && !!hover && isSameCxDay(day, hover) && !isSameCxDay(day, start);
  }

  protected isInRange(day: CxCalendarDay): boolean {
    if (this.selectionMode !== 'range' || this.isRangeStartDay(day) || this.isRangeEndDay(day)) {
      return false;
    }
    const start = this.rangeStart$();
    const end = this.rangeEnd$();
    if (end) {
      return isCxDayBetween(day, start, end);
    }
    const hover = this.rangePreviewEnd$();
    if (!start || !hover || isSameCxDay(day, hover)) {
      return false;
    }
    return compareCxDays(hover, start) < 0
      ? isCxDayBetween(day, hover, start)
      : isCxDayBetween(day, start, hover);
  }

  protected isAriaSelectedDay(day: CxCalendarDay): boolean {
    return this.isSelectedDay(day) || this.isRangeStartDay(day) || this.isRangeEndDay(day) || this.isInRange(day);
  }

  protected onDayHover(day: CxCalendarDay): void {
    if (this.selectionMode !== 'range' || this.isOutsideRange(day)) {
      return;
    }
    const nextPreview = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);
    this.rangePreviewEndState.set(nextPreview);
    this.rangePreviewEndChange.emit(nextPreview);
  }

  protected onDayLeave(): void {
    this.clearRangePreview();
  }

  protected onDayFocus(day: CxCalendarDay): void {
    if (!this.disabled && !this.isOutsideRange(day)) {
      this.focusedDayKeyState.set(day.key);
    }
  }

  protected onDayKeydown(event: KeyboardEvent, day: CxCalendarDay): void {
    if (this.disabled || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const days = this.calendarDays$();
      const dayIndex = days.findIndex(candidate => candidate.key === day.key);
      if (dayIndex < 0) {
        return;
      }
      const rowStart = Math.floor(dayIndex / 7) * 7;
      const week = days.slice(rowStart, rowStart + 7);
      const orderedWeek = event.key === 'Home' ? week : [...week].reverse();
      const target = orderedWeek.find(candidate => !this.isOutsideRange(candidate));
      if (target) {
        this.moveFocusToDay(target);
      }
      return;
    }

    let dayDelta: number | undefined;
    if (event.key === 'ArrowLeft') {
      dayDelta = -1;
    } else if (event.key === 'ArrowRight') {
      dayDelta = 1;
    } else if (event.key === 'ArrowUp') {
      dayDelta = -7;
    } else if (event.key === 'ArrowDown') {
      dayDelta = 7;
    }

    if (dayDelta !== undefined) {
      event.preventDefault();
      const target = this.addDays(day, dayDelta);
      if (!this.isOutsideRange(target)) {
        this.moveFocusToDay(target);
      }
      return;
    }

    if (event.key !== 'PageUp' && event.key !== 'PageDown') {
      return;
    }

    const monthDelta = (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1);
    const nextMonth = addCxMonths(day.year, day.month, monthDelta);
    const targetDay = Math.min(day.day, getCxDaysInMonth(nextMonth.year, nextMonth.month));
    const target: CxCalendarDay = {
      key: this.dayKey(nextMonth.year, nextMonth.month, targetDay),
      year: nextMonth.year,
      month: nextMonth.month,
      day: targetDay,
      isoDate: '',
      inCurrentMonth: true,
      isToday: false,
    };
    event.preventDefault();
    if (!this.isOutsideRange(target)) {
      this.moveFocusToDay(target);
    }
  }

  protected dayAriaLabel(day: CxCalendarDay): string {
    return calendarDayLabelFormatter.format(
      new Date(day.year, day.month - 1, day.day, 12, 0, 0, 0),
    );
  }

  protected isOutsideRange(day: CxCalendarDay): boolean {
    const target: CxLocalDateParts = { year: day.year, month: day.month, day: day.day, hours: 0, minutes: 0 };
    const min = this.toDateParts(this.min);
    const max = this.toDateParts(this.max);
    return (
      (min !== null && compareCxDays(target, min) < 0) ||
      (max !== null && compareCxDays(target, max) > 0) ||
      !!this.disabledDates?.(new Date(day.year, day.month - 1, day.day, 12, 0, 0, 0))
    );
  }

  private setView(year: number, month: number): void {
    this.viewYearState.set(year);
    this.viewMonthState.set(month);
    this.viewDateChange.emit(new Date(year, month - 1, 1, 0, 0, 0, 0));
  }

  private syncViewToDate(value: Date | undefined): void {
    const source = this.toDateParts(value) ?? getCxTodayParts();
    this.viewYearState.set(source.year);
    this.viewMonthState.set(source.month);
  }

  private validDate(value: Date | undefined | null): Date | undefined {
    return value && !Number.isNaN(value.getTime()) ? new Date(value.getTime()) : undefined;
  }

  private clearRangePreview(): void {
    if (!this.rangePreviewEndState()) {
      return;
    }
    this.rangePreviewEndState.set(undefined);
    this.rangePreviewEndChange.emit(undefined);
  }

  private toDateParts(value: Date | undefined | null): CxLocalDateParts | null {
    if (!value || Number.isNaN(value.getTime())) {
      return null;
    }
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hours: value.getHours(),
      minutes: value.getMinutes(),
    };
  }

  private resolveTabbableDay(): CxCalendarDay | undefined {
    const days = this.calendarDays$();
    const isAvailable = (day: CxCalendarDay | undefined): day is CxCalendarDay =>
      !!day && !this.isOutsideRange(day);
    const focusedDay = days.find(day => day.key === this.focusedDayKeyState());
    if (isAvailable(focusedDay)) {
      return focusedDay;
    }

    const selectedDates = [
      this.selectedDate$(),
      this.rangeStart$(),
      this.rangeEnd$(),
    ];
    for (const preferredDate of selectedDates) {
      const preferredDay = days.find(day => isSameCxDay(day, preferredDate));
      if (isAvailable(preferredDay)) {
        return preferredDay;
      }
    }

    const today = getCxTodayParts();
    const todayDay = days.find(day => day.inCurrentMonth && isSameCxDay(day, today));
    if (isAvailable(todayDay)) {
      return todayDay;
    }

    return (
      days.find(day => day.inCurrentMonth && isAvailable(day)) ??
      days.find(day => isAvailable(day))
    );
  }

  private moveFocusToDay(day: CxCalendarDay): void {
    this.focusedDayKeyState.set(day.key);
    if (day.year !== this.viewYearState() || day.month !== this.viewMonthState()) {
      this.setView(day.year, day.month);
    }
    this.scheduleDayFocus(day.key);
  }

  private scheduleDayFocus(dayKey: string): void {
    if (typeof window === 'undefined') {
      queueMicrotask(() => this.focusDayButton(dayKey));
      return;
    }
    if (this.focusFrame !== undefined) {
      window.cancelAnimationFrame(this.focusFrame);
    }
    this.focusFrame = window.requestAnimationFrame(() => {
      this.focusFrame = undefined;
      this.focusDayButton(dayKey);
    });
  }

  private focusDayButton(dayKey: string): boolean {
    const button = this.host.nativeElement.querySelector(
      `[data-cx-calendar-day="${dayKey}"]`,
    ) as HTMLButtonElement | null;
    if (!button || button.disabled) {
      return false;
    }
    button.focus({ preventScroll: true });
    return true;
  }

  private addDays(
    day: Pick<CxCalendarDay, 'year' | 'month' | 'day'>,
    delta: number,
  ): CxCalendarDay {
    const date = new Date(day.year, day.month - 1, day.day + delta, 12, 0, 0, 0);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dayOfMonth = date.getDate();
    return {
      key: this.dayKey(year, month, dayOfMonth),
      year,
      month,
      day: dayOfMonth,
      isoDate: '',
      inCurrentMonth: month === this.viewMonthState() && year === this.viewYearState(),
      isToday: false,
    };
  }

  private dayKey(year: number, month: number, day: number): string {
    return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
  }

}
