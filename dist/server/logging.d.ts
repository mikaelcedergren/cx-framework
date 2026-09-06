import type { Writable } from "node:stream";
import { type LogContext } from "./log-context.js";
export { currentLogContext, runWithLogContext, type LogContext, } from "./log-context.js";
export declare const LOG_SCHEMA_VERSION = 1;
export declare const LOG_RECORD_MAX_BYTES: number;
export declare const LOG_BUFFER_MAX_BYTES: number;
export declare const LOG_DEBUG_MAX_MILLISECONDS: number;
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogOutcome = "started" | "success" | "failure" | "retry" | "cancelled" | "skipped";
export type LogCategory = "diagnostic" | "operation" | "security" | "maintenance";
export interface LogIdentity {
    readonly service: string;
    readonly environment: "development" | "test" | "production";
    readonly executionScope: string;
    readonly role: string;
    readonly releaseId: string;
    readonly pid: number;
}
/** Fixed metadata only. IDs must be opaque references; labels come from reviewed source. */
export interface LogEvent extends LogContext {
    readonly event: string;
    readonly level: LogLevel;
    readonly category: LogCategory;
    readonly outcome: LogOutcome;
    readonly code?: string;
    readonly routeId?: string;
    readonly provider?: string;
    readonly operation?: string;
    readonly method?: "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
    readonly statusCode?: number;
    readonly upstreamStatusCode?: number;
    readonly cacheStatus?: "hit" | "miss" | "bypass" | "expired" | "stale" | "updating" | "revalidated" | "none";
    readonly durationMs?: number;
    readonly upstreamDurationMs?: number;
    readonly attempt?: number;
    readonly count?: number;
    readonly bytes?: number;
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly error?: unknown;
}
export interface SafeLogError {
    readonly type: string;
    readonly fingerprint: string;
    readonly locations: readonly string[];
    readonly causes: readonly {
        readonly type: string;
        readonly locations: readonly string[];
    }[];
    readonly truncated: boolean;
}
export interface LogRecord extends LogIdentity, Omit<LogEvent, "error"> {
    readonly schemaVersion: typeof LOG_SCHEMA_VERSION;
    readonly timestamp: string;
    readonly error?: SafeLogError;
}
export interface LogSinkStatus {
    readonly accepted: number;
    readonly dropped: number;
    readonly failed: number;
    readonly pendingBytes: number;
    readonly available: boolean;
}
/** Accepted means handed to the transport, never a promise of disk durability. */
export interface LogSink {
    write(line: string): boolean;
    status(): Readonly<LogSinkStatus>;
}
export interface RuntimeLogger {
    readonly identity: Readonly<LogIdentity>;
    emit(event: LogEvent): boolean;
    enableDebug(durationMs: number): void;
    status(): Readonly<{
        accepted: number;
        dropped: number;
        invalid: number;
        filtered: number;
        debugUntil: string | null;
        sink: Readonly<LogSinkStatus>;
    }>;
}
/** No file, socket, timer, listener, or process stream is opened at module import. */
export declare function createRuntimeLogger({ identity, sink: suppliedSink, now, monotonicNow, }: {
    identity: LogIdentity;
    sink?: LogSink;
    now?: () => number;
    monotonicNow?: () => number;
}): RuntimeLogger;
/** One bounded adapter per stream; late write errors remain visible without recursive logging. */
export declare function createWritableLogSink(stream: Writable, maxBufferedBytes?: number): LogSink;
/** A boundary records a request failure once, including failures after response headers. */
export declare function createErrorRecorder(logger: Pick<RuntimeLogger, "emit">): (event: LogEvent, owner: object) => boolean;
/** Decode one bounded event at a host boundary without renewing its timestamp or inheriting context. */
export declare function parseLogRecord(line: string): LogRecord;
//# sourceMappingURL=logging.d.ts.map