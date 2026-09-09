export type CxDateTimeValue = string | Date | number | null | undefined;
export type CxDateTimeMode = "activity" | "calendar" | "absolute";

export interface CxDateTimeOptions {
  /** Activity measures recency; calendar names days; absolute always names the date. */
  mode?: CxDateTimeMode;
  /** Adds the local clock time to calendar and absolute labels, never to a date-only value. */
  withTime?: boolean;
  /** Reference instant for deterministic rendering and tests. Defaults to the current time. */
  now?: number | Date;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

interface ParsedDate {
  calendar: CalendarDate;
  instant?: Date;
}

/** Format in the runtime's local timezone. Storage and sorting keep the original value. */
export function formatCxDateTime(
  value: CxDateTimeValue,
  {
    mode = "activity",
    withTime = false,
    now = Date.now(),
  }: CxDateTimeOptions = {},
): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  const { calendar, instant } = parsed;
  const time =
    withTime && instant
      ? ` ${String(instant.getHours()).padStart(2, "0")}:${String(instant.getMinutes()).padStart(2, "0")}`
      : "";
  const absolute = `${calendar.day} ${MONTHS[calendar.month - 1]} ${String(calendar.year).padStart(4, "0")}${time}`;
  if (mode === "absolute") return absolute;

  const reference = new Date(now instanceof Date ? now.getTime() : now);
  if (!Number.isFinite(reference.getTime())) return "—";
  const days = calendarDay(calendar) - calendarDay(localCalendar(reference));
  const elapsed = instant
    ? instant.getTime() - reference.getTime()
    : days * DAY;
  // Instants use exactly 168 hours; date-only values use seven calendar days.
  if (Math.abs(elapsed) > WEEK) return absolute;

  if (mode === "activity" && instant && days === 0) {
    const age = Math.abs(elapsed);
    if (age < MINUTE) return elapsed > 0 ? "In a moment" : "Just now";
    const amount =
      age < HOUR
        ? `${Math.floor(age / MINUTE)}m`
        : `${Math.floor(age / HOUR)}h`;
    return elapsed > 0 ? `In ${amount}` : `${amount} ago`;
  }

  let label: string;
  if (days === 0) label = "Today";
  else if (days === -1) label = "Yesterday";
  else if (days === 1) label = "Tomorrow";
  else label = days > 0 ? `In ${days}d` : `${Math.abs(days)}d ago`;
  return `${label}${time}`;
}

function localCalendar(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function calendarDay({ year, month, day }: CalendarDate): number {
  // UTC is only an ordinal for calendar arithmetic, never a display timezone.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime() / DAY;
}

function validCalendar({ year, month, day }: CalendarDate): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return (
    day <=
    [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  );
}

function parseDate(value: CxDateTimeValue): ParsedDate | null {
  if (value == null || value === "") return null;
  let instant: Date;
  if (typeof value === "string") {
    // Accept the existing log timestamp spelling as well as ISO values.
    const normalized = value.trim().replace(/ UTC$/, "Z");
    const match =
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(
        normalized,
      );
    if (!match) return null;
    const calendar = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
    if (!validCalendar(calendar)) return null;
    if (match[4] === undefined) return { calendar };
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    if (hour > 23 || minute > 59 || Number(match[6] ?? 0) > 59) return null;
    instant = new Date(normalized.replace(" ", "T"));
    if (
      !match[8] &&
      (instant.getFullYear() !== calendar.year ||
        instant.getMonth() + 1 !== calendar.month ||
        instant.getDate() !== calendar.day ||
        instant.getHours() !== hour ||
        instant.getMinutes() !== minute)
    )
      return null;
  } else {
    instant = new Date(value instanceof Date ? value.getTime() : value);
  }
  if (!Number.isFinite(instant.getTime())) return null;
  return { calendar: localCalendar(instant), instant };
}
