import { createHash } from "node:crypto";
import type { Writable } from "node:stream";
import {
  currentLogContext,
  validateLogContext,
  type LogContext,
} from "./log-context.js";

export {
  currentLogContext,
  runWithLogContext,
  type LogContext,
} from "./log-context.js";

export const LOG_SCHEMA_VERSION = 1;
export const LOG_RECORD_MAX_BYTES = 16 * 1024;
export const LOG_BUFFER_MAX_BYTES = 64 * 1024;
export const LOG_DEBUG_MAX_MILLISECONDS = 60 * 60 * 1000;

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogOutcome =
  "started" | "success" | "failure" | "retry" | "cancelled" | "skipped";
export type LogCategory =
  "diagnostic" | "operation" | "security" | "maintenance";

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
  readonly method?:
    "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
  readonly statusCode?: number;
  readonly upstreamStatusCode?: number;
  readonly cacheStatus?:
    | "hit"
    | "miss"
    | "bypass"
    | "expired"
    | "stale"
    | "updating"
    | "revalidated"
    | "none";
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

const LABEL = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const EVENT = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){1,5}$/;
const LEVELS: readonly string[] = ["debug", "info", "warn", "error", "fatal"];
const OUTCOMES: readonly string[] = [
  "started",
  "success",
  "failure",
  "retry",
  "cancelled",
  "skipped",
];
const CATEGORIES: readonly string[] = [
  "diagnostic",
  "operation",
  "security",
  "maintenance",
];
const METHODS: readonly string[] = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];
const CACHE_STATUSES: readonly string[] = [
  "hit",
  "miss",
  "bypass",
  "expired",
  "stale",
  "updating",
  "revalidated",
  "none",
];
const CONTEXT_FIELDS = ["requestId", "runId", "jobId", "effectId"] as const;
const LABEL_FIELDS = ["code", "routeId", "provider", "operation"] as const;
const NUMBER_FIELDS = [
  "statusCode",
  "upstreamStatusCode",
  "durationMs",
  "upstreamDurationMs",
  "attempt",
  "count",
  "bytes",
  "inputTokens",
  "outputTokens",
] as const;
const EVENT_FIELDS = new Set<string>([
  "event",
  "level",
  "category",
  "outcome",
  "method",
  "cacheStatus",
  "error",
  ...CONTEXT_FIELDS,
  ...LABEL_FIELDS,
  ...NUMBER_FIELDS,
]);

const increment = (value: number): number =>
  Math.min(Number.MAX_SAFE_INTEGER, value + 1);

/** No file, socket, timer, listener, or process stream is opened at module import. */
export function createRuntimeLogger({
  identity,
  sink: suppliedSink,
  now = Date.now,
  monotonicNow = () => performance.now(),
}: {
  identity: LogIdentity;
  sink?: LogSink;
  now?: () => number;
  monotonicNow?: () => number;
}): RuntimeLogger {
  const safeIdentity = validateIdentity(identity);
  const sink = suppliedSink ?? defaultLogSink();
  if (
    !sink ||
    typeof sink.write !== "function" ||
    typeof sink.status !== "function"
  ) {
    throw new TypeError("A log sink must provide write and status operations.");
  }
  if (typeof now !== "function" || typeof monotonicNow !== "function")
    throw new TypeError("Log clocks must be functions.");
  let accepted = 0;
  let dropped = 0;
  let invalid = 0;
  let filtered = 0;
  let debugUntil = 0;
  let debugDeadline = 0;

  return Object.freeze({
    identity: safeIdentity,
    emit(event: LogEvent): boolean {
      let record: LogRecord;
      try {
        const timestamp = validTime(now());
        record = makeRecord(
          safeIdentity,
          event,
          timestamp,
          currentLogContext(),
        );
        if (
          record.level === "debug" &&
          validMonotonicTime(monotonicNow()) >= debugDeadline
        ) {
          filtered = increment(filtered);
          return false;
        }
      } catch {
        invalid = increment(invalid);
        return false;
      }
      try {
        const line = `${JSON.stringify(record)}\n`;
        if (Buffer.byteLength(line) > LOG_RECORD_MAX_BYTES) {
          invalid = increment(invalid);
          return false;
        }
        if (sink.write(line) !== true) {
          dropped = increment(dropped);
          return false;
        }
        accepted = increment(accepted);
        return true;
      } catch {
        dropped = increment(dropped);
        return false;
      }
    },
    enableDebug(durationMs: number): void {
      if (
        !Number.isSafeInteger(durationMs) ||
        durationMs < 0 ||
        durationMs > LOG_DEBUG_MAX_MILLISECONDS
      ) {
        throw new TypeError(
          "Debug logging requires a duration between zero and one hour.",
        );
      }
      const until =
        durationMs === 0 ? 0 : validTime(validTime(now()) + durationMs);
      const deadline =
        durationMs === 0 ? 0 : validMonotonicTime(monotonicNow()) + durationMs;
      debugUntil = until;
      debugDeadline = deadline;
    },
    status() {
      return Object.freeze({
        accepted,
        dropped,
        invalid,
        filtered,
        debugUntil:
          debugUntil === 0 ||
          validMonotonicTime(monotonicNow()) >= debugDeadline
            ? null
            : new Date(debugUntil).toISOString(),
        sink: sink.status(),
      });
    },
  });
}

const writableSinks = new WeakMap<
  Writable,
  { capacity: number; sink: LogSink }
>();

/** One bounded adapter per stream; late write errors remain visible without recursive logging. */
export function createWritableLogSink(
  stream: Writable,
  maxBufferedBytes = LOG_BUFFER_MAX_BYTES,
): LogSink {
  if (
    !Number.isSafeInteger(maxBufferedBytes) ||
    maxBufferedBytes < LOG_RECORD_MAX_BYTES ||
    maxBufferedBytes > LOG_BUFFER_MAX_BYTES
  ) {
    throw new TypeError(
      "Log transport capacity must fit one record and stay within the buffer ceiling.",
    );
  }
  const existing = writableSinks.get(stream);
  if (existing) {
    if (existing.capacity !== maxBufferedBytes)
      throw new TypeError(
        "A log stream already has a different buffer capacity.",
      );
    return existing.sink;
  }
  let accepted = 0;
  let dropped = 0;
  let failed = 0;
  let broken = false;
  stream.on("error", () => {
    broken = true;
  });
  const sink: LogSink = Object.freeze({
    write(line: string): boolean {
      const size = Buffer.byteLength(line);
      if (
        broken ||
        stream.destroyed ||
        stream.writableEnded ||
        stream.writableNeedDrain ||
        size > LOG_RECORD_MAX_BYTES ||
        stream.writableLength + size > maxBufferedBytes
      ) {
        dropped = increment(dropped);
        return false;
      }
      try {
        stream.write(line, (error) => {
          if (error) {
            failed = increment(failed);
            broken = true;
          }
        });
        accepted = increment(accepted);
        return true;
      } catch {
        failed = increment(failed);
        broken = true;
        return false;
      }
    },
    status() {
      return Object.freeze({
        accepted,
        dropped,
        failed,
        pendingBytes: stream.writableLength,
        available: !broken && !stream.destroyed && !stream.writableEnded,
      });
    },
  });
  writableSinks.set(stream, { capacity: maxBufferedBytes, sink });
  return sink;
}

let stderrSink: LogSink | undefined;
function defaultLogSink(): LogSink {
  stderrSink ??= createWritableLogSink(process.stderr);
  return stderrSink;
}

/** A boundary records a request failure once, including failures after response headers. */
export function createErrorRecorder(
  logger: Pick<RuntimeLogger, "emit">,
): (event: LogEvent, owner: object) => boolean {
  if (!logger || typeof logger.emit !== "function")
    throw new TypeError("An error boundary requires a runtime logger.");
  const recorded = new WeakSet<object>();
  return (event, owner) => {
    if (recorded.has(owner)) return false;
    let accepted: boolean;
    try {
      accepted = logger.emit(event);
    } catch {
      return false;
    }
    if (accepted) recorded.add(owner);
    return accepted;
  };
}

function makeRecord(
  identity: LogIdentity,
  event: LogEvent,
  timestamp: number,
  inheritedContext: Readonly<LogContext>,
): LogRecord {
  if (
    !event ||
    typeof event !== "object" ||
    Array.isArray(event) ||
    Object.keys(event).some((key) => !EVENT_FIELDS.has(key))
  ) {
    throw new TypeError(
      "Log events accept only the declared operational fields.",
    );
  }
  if (
    typeof event.event !== "string" ||
    event.event.length > 96 ||
    !EVENT.test(event.event) ||
    !LEVELS.includes(event.level) ||
    !OUTCOMES.includes(event.outcome) ||
    !CATEGORIES.includes(event.category)
  ) {
    throw new TypeError("Log event classification is invalid.");
  }
  const context: Record<string, string> = { ...inheritedContext };
  for (const key of CONTEXT_FIELDS) {
    if (event[key] !== undefined) context[key] = event[key];
  }
  const fields: Record<string, string | number> = {};
  for (const key of LABEL_FIELDS) {
    const value = event[key];
    if (value === undefined) continue;
    fields[key] = validLabel(value);
  }
  if (event.method !== undefined) {
    if (!METHODS.includes(event.method))
      throw new TypeError("Unknown HTTP method.");
    fields["method"] = event.method;
  }
  if (event.cacheStatus !== undefined) {
    if (!CACHE_STATUSES.includes(event.cacheStatus))
      throw new TypeError("Unknown cache status.");
    fields["cacheStatus"] = event.cacheStatus;
  }
  for (const key of NUMBER_FIELDS) {
    const value = event[key];
    if (value === undefined) continue;
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > Number.MAX_SAFE_INTEGER ||
      (key !== "durationMs" &&
        key !== "upstreamDurationMs" &&
        !Number.isSafeInteger(value))
    ) {
      throw new TypeError("Log measurements must be finite and bounded.");
    }
    if (
      (key === "statusCode" || key === "upstreamStatusCode") &&
      (value < 100 || value > 599)
    )
      throw new TypeError("Invalid logged HTTP status.");
    fields[key] = value;
  }
  return Object.freeze({
    schemaVersion: LOG_SCHEMA_VERSION,
    timestamp: new Date(timestamp).toISOString(),
    ...identity,
    event: event.event,
    level: event.level,
    category: event.category,
    outcome: event.outcome,
    ...validateLogContext(context),
    ...fields,
    ...(event.error === undefined ? {} : { error: safeError(event.error) }),
  });
}

/** Decode one bounded event at a host boundary without renewing its timestamp or inheriting context. */
export function parseLogRecord(line: string): LogRecord {
  if (
    typeof line !== "string" ||
    Buffer.byteLength(line) > LOG_RECORD_MAX_BYTES
  ) {
    throw new TypeError("A serialized log record exceeds its byte ceiling.");
  }
  const value: unknown = JSON.parse(line);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("A log record must be an object.");
  const record = value as Record<string, unknown>;
  const recordFields = new Set([
    "schemaVersion",
    "timestamp",
    "service",
    "environment",
    "executionScope",
    "role",
    "releaseId",
    "pid",
    ...EVENT_FIELDS,
  ]);
  if (
    Object.keys(record).some((key) => !recordFields.has(key)) ||
    record["schemaVersion"] !== LOG_SCHEMA_VERSION ||
    typeof record["timestamp"] !== "string"
  ) {
    throw new TypeError("A log record has an unsupported schema or field.");
  }
  const timestamp = validTime(Date.parse(record["timestamp"]));
  if (new Date(timestamp).toISOString() !== record["timestamp"])
    throw new TypeError("Log timestamps must be canonical UTC instants.");
  const eventFields: Record<string, unknown> = {};
  for (const key of EVENT_FIELDS) {
    if (key !== "error" && Object.hasOwn(record, key))
      eventFields[key] = record[key];
  }
  const normalized = makeRecord(
    validateIdentity(value as LogIdentity),
    eventFields as unknown as LogEvent,
    timestamp,
    {},
  );
  return Object.freeze({
    ...normalized,
    ...(Object.hasOwn(record, "error")
      ? { error: validateSafeLogError(record["error"]) }
      : {}),
  });
}

function validateSafeLogError(value: unknown): SafeLogError {
  const ERROR_TYPES = new Set([
    "Error",
    "UnknownError",
    "TypeError",
    "RangeError",
    "SyntaxError",
    "ReferenceError",
    "URIError",
    "EvalError",
    "AggregateError",
  ]);
  const location = /^[a-zA-Z0-9_-]{1,80}\.(?:[cm]?js|tsx?|py):\d{1,8}:\d{1,8}$/;
  function entry(
    candidate: unknown,
    keys: readonly string[],
  ): { type: string; locations: readonly string[] } {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate) ||
      Object.keys(candidate).some((key) => !keys.includes(key))
    )
      throw new TypeError("Unsupported serialized error fields.");
    const fields = candidate as Record<string, unknown>;
    const locations = fields["locations"];
    if (
      typeof fields["type"] !== "string" ||
      !ERROR_TYPES.has(fields["type"]) ||
      !Array.isArray(locations) ||
      locations.length > 8 ||
      locations.some(
        (item: unknown) => typeof item !== "string" || !location.test(item),
      )
    )
      throw new TypeError("Unsafe serialized error evidence.");
    return Object.freeze({
      type: fields["type"],
      locations: Object.freeze([...locations]) as readonly string[],
    });
  }
  const first = entry(value, [
    "type",
    "locations",
    "causes",
    "fingerprint",
    "truncated",
  ]);
  const fields = value as Record<string, unknown>;
  if (
    !Array.isArray(fields["causes"]) ||
    fields["causes"].length > 3 ||
    typeof fields["truncated"] !== "boolean"
  )
    throw new TypeError("Serialized error causes exceed their contract.");
  const causes = fields["causes"].map((cause: unknown) =>
    entry(cause, ["type", "locations"]),
  );
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([first, ...causes]))
    .digest("hex")
    .slice(0, 32);
  if (fields["fingerprint"] !== fingerprint)
    throw new TypeError(
      "Serialized error fingerprint does not match its evidence.",
    );
  return Object.freeze({
    ...first,
    causes: Object.freeze(causes),
    fingerprint,
    truncated: fields["truncated"],
  });
}

function safeError(error: unknown): SafeLogError {
  const causes: { type: string; locations: readonly string[] }[] = [];
  const seen = new Set<unknown>();
  let current = error;
  let truncated = false;
  for (let depth = 0; depth < 4; depth += 1) {
    if (seen.has(current)) {
      truncated = true;
      break;
    }
    seen.add(current);
    const type = errorType(current);
    const locations: string[] = [];
    if (current instanceof Error && typeof current.stack === "string") {
      const stack = current.stack.slice(0, 32 * 1024);
      truncated ||= stack.length !== current.stack.length;
      for (const line of stack.split("\n").slice(1, 25)) {
        // Only executable source basenames and numeric positions survive. No message, locals,
        // function arguments, absolute paths, URL credentials, query strings, or custom fields.
        const match =
          /^\s+at .*?[/\\]([a-zA-Z0-9_-]{1,80}\.(?:[cm]?js|tsx?|py)):(\d{1,8}):(\d{1,8})\)?$/.exec(
            line,
          );
        if (match) locations.push(`${match[1]}:${match[2]}:${match[3]}`);
        if (locations.length === 8) {
          truncated = true;
          break;
        }
      }
    }
    causes.push({ type, locations: Object.freeze(locations) });
    if (!(current instanceof Error) || current.cause === undefined) break;
    current = current.cause;
    if (depth === 3) truncated = true;
  }
  const first = causes.shift() ?? {
    type: "UnknownError",
    locations: Object.freeze([]),
  };
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([first, ...causes]))
    .digest("hex")
    .slice(0, 32);
  return Object.freeze({
    ...first,
    fingerprint,
    causes: Object.freeze(causes),
    truncated,
  });
}

function errorType(error: unknown): string {
  for (const type of [
    TypeError,
    RangeError,
    SyntaxError,
    ReferenceError,
    URIError,
    EvalError,
    AggregateError,
  ]) {
    if (error instanceof type) return type.name;
  }
  return error instanceof Error ? "Error" : "UnknownError";
}

function validateIdentity(identity: LogIdentity): Readonly<LogIdentity> {
  if (
    !identity ||
    typeof identity !== "object" ||
    !["development", "test", "production"].includes(identity.environment) ||
    !Number.isSafeInteger(identity.pid) ||
    identity.pid < 1
  ) {
    throw new TypeError("A logger requires an explicit process identity.");
  }
  return Object.freeze({
    service: validLabel(identity.service),
    environment: identity.environment,
    executionScope: validLabel(identity.executionScope),
    role: validLabel(identity.role),
    releaseId: validLabel(identity.releaseId),
    pid: identity.pid,
  });
}

function validLabel(value: string): string {
  if (typeof value !== "string" || !LABEL.test(value))
    throw new TypeError(
      "Log labels must be bounded source-defined identifiers.",
    );
  return value;
}

function validTime(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 8_640_000_000_000_000
  )
    throw new TypeError("Invalid log timestamp.");
  return value;
}

function validMonotonicTime(value: number): number {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > Number.MAX_SAFE_INTEGER - LOG_DEBUG_MAX_MILLISECONDS
  )
    throw new TypeError("Invalid monotonic log clock.");
  return value;
}
