# Date and time

Use `formatCxDateTime` from the framework's browser entry point for human date labels.
The portable [date-display rules](../ai/design/05-copy-and-microcopy.md#dates-and-time) own where
relative and absolute dates belong. This reference owns the formatter's exact API and boundaries.

```ts
import {
  CxDateTimeService,
  formatCxDateTime,
} from "@mikaelcedergren/cx-framework";

formatCxDateTime(value); // Activity: Just now, 12m ago, 4h ago, Yesterday, 3d ago.
formatCxDateTime(value, { mode: "calendar", withTime: true }); // Today 12:03, Tomorrow 09:00.
formatCxDateTime(value, { mode: "absolute", withTime: true }); // 9 Sep 2026 12:03.
```

## Inputs and options

- The value is an ISO date or datetime string, a `Date`, epoch milliseconds, `null`, or `undefined`.
  Unknown, invalid, and impossible dates display `—`. Arbitrary natural-language dates are not parsed.
- Store instants with their timezone. Display uses the runtime's local timezone. A datetime without
  an offset is treated as local wall time; a nonexistent local time is rejected. The existing log
  form `YYYY-MM-DD HH:mm:ss UTC` is also accepted.
- A `YYYY-MM-DD` value is a calendar date. It never shifts through UTC or gains an invented time.
- `mode` is `activity` (default), `calendar`, or `absolute`.
- `withTime` defaults to `false`. When true, append `HH:mm` to calendar and absolute labels for
  timestamps. Compact elapsed labels already express time, so `4h ago` stays compact.
- `now` is an optional reference instant (`Date` or epoch milliseconds) for deterministic formatting.

## Boundaries

`activity` uses elapsed minutes or hours for timestamps on the same local day: under one minute
is `Just now` in the past or `In a moment` in the future; then whole minutes, then whole hours.
Other days use the same calendar labels as `calendar`. Date-only inputs always use calendar labels.

`calendar` uses `Today`, `Yesterday`, `Tomorrow`, `Nd ago`, or `In Nd`. Day names use local calendar
arithmetic, including midnight and daylight saving changes. Exactly seven days remains relative.
Timestamps more than 168 hours from now, in either direction, become absolute. Date-only values
become absolute beyond seven calendar days. `absolute` ignores recency entirely.

Absolute labels are `D MMM YYYY`, optionally followed by `HH:mm`, using fixed English month
abbreviations and no comma. All modes format only the label: storage, filtering, sorting, and
date-picker values continue to use the original value. Use absolute mode in exact-date details,
records, and exports; never reconstruct an instant from a relative label.

## Angular views

Inject `CxDateTimeService` once through Angular's root provider and call `dates.format(value, options)`
inside a computed signal or template. It accepts the formatter's options except `now`, which it
supplies from its shared signal. Calls in a computed signal track that clock automatically; do not
cache a formatted string once when loading data.

One clock updates all consumers on each minute boundary. It pauses while the document is hidden,
refreshes immediately when visible again, and removes its timer and listener when destroyed.
Absolute-only calls do not subscribe to the clock. Non-browser rendering creates no timer.

No component or row needs its own interval. Date pickers, calendars, and time fields keep their
existing precise input contracts.
