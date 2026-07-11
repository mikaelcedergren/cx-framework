import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxDropdownComponent, type CxDropdownOption } from '../cx-dropdown';
import {
  CX_MONTH_OPTIONS,
  addCxMonths,
  buildCxCalendarDays,
  compareCxDays,
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

@Component({
  selector: 'cx-calendar',
  imports: [CxIconButtonComponent, CxDropdownComponent],
  templateUrl: './cx-calendar.component.html',
  styleUrl: './cx-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCalendarComponent {
  private readonly valueState = signal<Date | undefined>(undefined);
  private readonly rangeState = signal<CxCalendarRange>({});
  private readonly rangePreviewEndState = signal<Date | undefined>(undefined);
  private readonly viewYearState = signal(getCxTodayParts().year);
  private readonly viewMonthState = signal(getCxTodayParts().month);
  private hasControlledView = false;

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

}
