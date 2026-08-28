import { formatCxTimeValue } from '../cx-time-field/index.js';
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
export const CX_WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
export const CX_WEEKDAY_LABELS_SUNDAY_START = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const CX_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: longMonthFormatter.format(new Date(2025, index, 1, 12, 0, 0, 0)),
}));
export function parseCxDateValue(value) {
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
    if (!Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)) {
        return null;
    }
    if (month < 1 ||
        month > 12 ||
        day < 1 ||
        day > getCxDaysInMonth(year, month) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59) {
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
export function formatCxDateValue(parts, includeTime = false) {
    const dateText = `${parts.year}-${padTwo(parts.month)}-${padTwo(parts.day)}`;
    if (!includeTime) {
        return dateText;
    }
    return `${dateText}T${padTwo(parts.hours)}:${padTwo(parts.minutes)}`;
}
export function formatCxDateDisplay(value, includeTime = false) {
    const parsedValue = parseCxDateValue(value);
    if (!parsedValue) {
        return undefined;
    }
    const dateText = shortMonthFormatter.format(createCxLocalDate(parsedValue.year, parsedValue.month, parsedValue.day, 12, 0));
    if (!includeTime) {
        return dateText;
    }
    return `${dateText} ${formatCxTimeValue(parsedValue.hours, parsedValue.minutes)}`;
}
export function formatCxDateSpanDisplay(startValue, endValue, includeTime = false) {
    const startDate = parseCxDateValue(startValue);
    const endDate = parseCxDateValue(endValue);
    if (!startDate && !endDate) {
        return undefined;
    }
    if (includeTime) {
        const startText = formatCxDateDisplay(startValue, includeTime);
        const endText = formatCxDateDisplay(endValue, includeTime);
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
    const startDisplayDate = createCxLocalDate(startDate.year, startDate.month, startDate.day, 12, 0);
    const endDisplayDate = createCxLocalDate(endDate.year, endDate.month, endDate.day, 12, 0);
    if (startDate.year === endDate.year) {
        return `${monthDayFormatter.format(startDisplayDate)} – ${monthDayYearFormatter.format(endDisplayDate)}`;
    }
    return `${monthDayYearFormatter.format(startDisplayDate)} – ${monthDayYearFormatter.format(endDisplayDate)}`;
}
export function getCxWeekdayLabels(weekStart) {
    return weekStart === 'sun' ? CX_WEEKDAY_LABELS_SUNDAY_START : CX_WEEKDAY_LABELS;
}
export function buildCxCalendarDays(year, month, weekStart = 'mon') {
    const firstOfMonth = createCxLocalDate(year, month, 1, 12, 0);
    const startOffset = weekStart === 'sun' ? firstOfMonth.getDay() : (firstOfMonth.getDay() + 6) % 7;
    const calendarStart = createCxLocalDate(year, month, 1 - startOffset, 12, 0);
    const today = getCxTodayParts();
    return Array.from({ length: 42 }, (_, index) => {
        const currentDate = createCxLocalDate(calendarStart.getFullYear(), calendarStart.getMonth() + 1, calendarStart.getDate() + index, 12, 0);
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
            isToday: currentYear === today.year &&
                currentMonth === today.month &&
                currentDay === today.day,
        };
    });
}
export function getCxTodayParts() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hours: now.getHours(),
        minutes: now.getMinutes(),
    };
}
export function getCxYearOptions(viewYear, radius = 12) {
    const years = [];
    for (let year = viewYear - radius; year <= viewYear + radius; year += 1) {
        years.push(year);
    }
    return years;
}
export function addCxMonths(year, month, delta) {
    const anchor = createCxLocalDate(year, month, 1, 12, 0);
    anchor.setMonth(anchor.getMonth() + delta);
    return {
        year: anchor.getFullYear(),
        month: anchor.getMonth() + 1,
    };
}
export function compareCxDays(a, b) {
    if (a.year !== b.year) {
        return a.year - b.year;
    }
    if (a.month !== b.month) {
        return a.month - b.month;
    }
    return a.day - b.day;
}
export function isSameCxDay(a, b) {
    if (!a || !b) {
        return false;
    }
    return a.year === b.year && a.month === b.month && a.day === b.day;
}
export function isCxDayBetween(target, start, end) {
    if (!start || !end) {
        return false;
    }
    return compareCxDays(target, start) >= 0 && compareCxDays(target, end) <= 0;
}
export function getCxDaysInMonth(year, month) {
    return createCxLocalDate(year, month + 1, 0, 12, 0).getDate();
}
function createCxLocalDate(year, month, day, hours, minutes) {
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}
function padTwo(value) {
    return `${value}`.padStart(2, '0');
}
