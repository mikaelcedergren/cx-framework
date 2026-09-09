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
/** Format in the runtime's local timezone. Storage and sorting keep the original value. */
export declare function formatCxDateTime(value: CxDateTimeValue, { mode, withTime, now, }?: CxDateTimeOptions): string;
//# sourceMappingURL=format-date-time.d.ts.map