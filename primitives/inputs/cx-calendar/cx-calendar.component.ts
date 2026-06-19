import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxSelectComponent, type CxSelectOption } from '../cx-select';
import {
  CX_MONTH_OPTIONS,
  addCxMonths,
  buildCxCalendarDays,
  compareCxDays,
  getCxWeekdayLabels,
  getCxTodayParts,
  getCxYearOptions,
  isSameCxDay,
  type CxCalendarDay,
  type CxCalendarWeekStart,
  type CxLocalDateParts,
} from '../shared/cx-date.utils';

@Component({
  selector: 'cx-calendar',
  imports: [CxIconButtonComponent, CxSelectComponent],
  templateUrl: './cx-calendar.component.html',
  styleUrl: './cx-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCalendarComponent {
  private readonly valueState = signal<Date | undefined>(undefined);
  private readonly viewYearState = signal(getCxTodayParts().year);
  private readonly viewMonthState = signal(getCxTodayParts().month);

  @Input() weekStart: CxCalendarWeekStart = 'mon';
  @Input() yearRange = 12;
  @Input() disabled = false;
  @Input() min: Date | undefined;
  @Input() max: Date | undefined;

  @Input()
  public set value(value: Date | undefined) {
    this.valueState.set(value ?? undefined);
    const parsed = this.toDateParts(value);
    const source = parsed ?? getCxTodayParts();
    this.viewYearState.set(source.year);
    this.viewMonthState.set(source.month);
  }

  @Output() readonly valueChange = new EventEmitter<Date | undefined>();

  protected readonly monthOptions: CxSelectOption[] = CX_MONTH_OPTIONS.map(option => ({
    id: String(option.value),
    label: option.label,
  }));
  protected readonly viewYear$ = this.viewYearState.asReadonly();
  protected readonly viewMonth$ = this.viewMonthState.asReadonly();
  protected readonly viewYearValue$ = computed(() => `${this.viewYearState()}`);
  protected readonly viewMonthValue$ = computed(() => `${this.viewMonthState()}`);
  protected readonly selectedDate$ = computed(() => this.toDateParts(this.valueState()));
  protected readonly yearOptions$ = computed<CxSelectOption[]>(() =>
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
    this.viewYearState.set(next.year);
    this.viewMonthState.set(next.month);
  }

  protected onNextMonth(): void {
    const next = addCxMonths(this.viewYearState(), this.viewMonthState(), 1);
    this.viewYearState.set(next.year);
    this.viewMonthState.set(next.month);
  }

  protected onMonthChange(value: string | undefined): void {
    const month = Number.parseInt(value ?? '', 10);
    if (Number.isFinite(month) && month >= 1 && month <= 12) {
      this.viewMonthState.set(month);
    }
  }

  protected onYearChange(value: string | undefined): void {
    const year = Number.parseInt(value ?? '', 10);
    if (Number.isFinite(year)) {
      this.viewYearState.set(year);
    }
  }

  protected onDaySelect(day: CxCalendarDay): void {
    if (this.disabled || this.isOutsideRange(day)) {
      return;
    }
    const nextValue = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);
    this.valueState.set(nextValue);
    this.viewYearState.set(day.year);
    this.viewMonthState.set(day.month);
    this.valueChange.emit(nextValue);
  }

  protected isSelectedDay(day: CxCalendarDay): boolean {
    return isSameCxDay(this.selectedDate$(), day);
  }

  protected isOutsideRange(day: CxCalendarDay): boolean {
    const target: CxLocalDateParts = { year: day.year, month: day.month, day: day.day, hours: 0, minutes: 0 };
    const min = this.toDateParts(this.min);
    const max = this.toDateParts(this.max);
    return (min !== null && compareCxDays(target, min) < 0) || (max !== null && compareCxDays(target, max) > 0);
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
