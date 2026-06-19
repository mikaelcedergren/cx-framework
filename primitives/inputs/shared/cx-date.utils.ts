import { formatCxTimeValue, type CxTimeInputFormat } from '../cx-time-input';

export interface CxLocalDateParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

export interface CxCalendarDay {
  key: string;
  year: number;
  month: number;
  day: number;
  isoDate: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

export type CxCalendarWeekStart = 'mon' | 'sun';

const shortMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});
const monthDayYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const longMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
});

export const CX_WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
export const CX_WEEKDAY_LABELS_SUNDAY_START = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

export const CX_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: longMonthFormatter.format(new Date(2025, index, 1, 12, 0, 0, 0)),
}));

export function parseCxDateValue(value: string | undefined | null): CxLocalDateParts | null {
  const normalizedValue = value?.trim() ?? '';
  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  const hours = Number.parseInt(match[4] ?? '0', 10);
  const minutes = Number.parseInt(match[5] ?? '0', 10);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > getCxDaysInMonth(year, month) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    hours,
    minutes,
  };
}

export function formatCxDateValue(parts: CxLocalDateParts, includeTime = false): string {
  const dateText = `${parts.year}-${padTwo(parts.month)}-${padTwo(parts.day)}`;
  if (!includeTime) {
    return dateText;
  }
  return `${dateText}T${padTwo(parts.hours)}:${padTwo(parts.minutes)}`;
}

export function formatCxDateDisplay(
  value: string | undefined | null,
  includeTime = false,
  timeFormat: CxTimeInputFormat = '24',
): string | undefined {
  const parsedValue = parseCxDateValue(value);
  if (!parsedValue) {
    return undefined;
  }

  const dateText = shortMonthFormatter.format(
    createCxLocalDate(parsedValue.year, parsedValue.month, parsedValue.day, 12, 0),
  );
  if (!includeTime) {
    return dateText;
  }

  return `${dateText} ${formatCxTimeValue(parsedValue.hours, parsedValue.minutes, timeFormat)}`;
}

export function formatCxDateSpanDisplay(
  startValue: string | undefined | null,
  endValue: string | undefined | null,
  includeTime = false,
  timeFormat: CxTimeInputFormat = '24',
): string | undefined {
  const startDate = parseCxDateValue(startValue);
  const endDate = parseCxDateValue(endValue);

  if (!startDate && !endDate) {
    return undefined;
  }

  if (includeTime) {
    const startText = formatCxDateDisplay(startValue, includeTime, timeFormat);
    const endText = formatCxDateDisplay(endValue, includeTime, timeFormat);
    if (startText && endText) {
      return `${startText} – ${endText}`;
    }
    return startText ? `From ${startText}` : `Until ${endText}`;
  }

  if (startDate && !endDate) {
    return `From ${monthDayYearFormatter.format(createCxLocalDate(startDate.year, startDate.month, startDate.day, 12, 0))}`;
  }

  if (!startDate && endDate) {
    return `Until ${monthDayYearFormatter.format(createCxLocalDate(endDate.year, endDate.month, endDate.day, 12, 0))}`;
  }

  const startDisplayDate = createCxLocalDate(startDate!.year, startDate!.month, startDate!.day, 12, 0);
  const endDisplayDate = createCxLocalDate(endDate!.year, endDate!.month, endDate!.day, 12, 0);
  if (startDate!.year === endDate!.year) {
    return `${monthDayFormatter.format(startDisplayDate)} – ${monthDayYearFormatter.format(endDisplayDate)}`;
  }

  return `${monthDayYearFormatter.format(startDisplayDate)} – ${monthDayYearFormatter.format(endDisplayDate)}`;
}

export function getCxWeekdayLabels(weekStart: CxCalendarWeekStart): readonly string[] {
  return weekStart === 'sun' ? CX_WEEKDAY_LABELS_SUNDAY_START : CX_WEEKDAY_LABELS;
}

export function buildCxCalendarDays(
  year: number,
  month: number,
  weekStart: CxCalendarWeekStart = 'mon',
): CxCalendarDay[] {
  const firstOfMonth = createCxLocalDate(year, month, 1, 12, 0);
  const startOffset = weekStart === 'sun' ? firstOfMonth.getDay() : (firstOfMonth.getDay() + 6) % 7;
  const calendarStart = createCxLocalDate(year, month, 1 - startOffset, 12, 0);
  const today = getCxTodayParts();

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = createCxLocalDate(
      calendarStart.getFullYear(),
      calendarStart.getMonth() + 1,
      calendarStart.getDate() + index,
      12,
      0,
    );
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();

    return {
      key: `${currentYear}-${padTwo(currentMonth)}-${padTwo(currentDay)}`,
      year: currentYear,
      month: currentMonth,
      day: currentDay,
      isoDate: `${currentYear}-${padTwo(currentMonth)}-${padTwo(currentDay)}`,
      inCurrentMonth: currentMonth === month,
      isToday:
        currentYear === today.year &&
        currentMonth === today.month &&
        currentDay === today.day,
    };
  });
}

export function getCxTodayParts(): CxLocalDateParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hours: now.getHours(),
    minutes: now.getMinutes(),
  };
}

export function getCxYearOptions(viewYear: number, radius = 12): number[] {
  const years: number[] = [];
  for (let year = viewYear - radius; year <= viewYear + radius; year += 1) {
    years.push(year);
  }
  return years;
}

export function addCxMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const anchor = createCxLocalDate(year, month, 1, 12, 0);
  anchor.setMonth(anchor.getMonth() + delta);
  return {
    year: anchor.getFullYear(),
    month: anchor.getMonth() + 1,
  };
}

export function compareCxDays(a: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>, b: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  if (a.month !== b.month) {
    return a.month - b.month;
  }
  return a.day - b.day;
}

export function isSameCxDay(
  a: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined,
  b: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined,
): boolean {
  if (!a || !b) {
    return false;
  }
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function isCxDayBetween(
  target: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
  start: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined,
  end: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined,
): boolean {
  if (!start || !end) {
    return false;
  }
  return compareCxDays(target, start) >= 0 && compareCxDays(target, end) <= 0;
}

export function getCxDaysInMonth(year: number, month: number): number {
  return createCxLocalDate(year, month + 1, 0, 12, 0).getDate();
}

function createCxLocalDate(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function padTwo(value: number): string {
  return `${value}`.padStart(2, '0');
}
