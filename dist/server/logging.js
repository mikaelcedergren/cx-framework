import { createHash } from "node:crypto";
import { currentLogContext, validateLogContext, } from "./log-context.js";
export { currentLogContext, runWithLogContext, } from "./log-context.js";
export const LOG_SCHEMA_VERSION = 1;
export const LOG_RECORD_MAX_BYTES = 16 * 1024;
export const LOG_BUFFER_MAX_BYTES = 64 * 1024;
export const LOG_DEBUG_MAX_MILLISECONDS = 60 * 60 * 1000;
const LABEL = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const EVENT = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){1,5}$/;
const LEVELS = ["debug", "info", "warn", "error", "fatal"];
const OUTCOMES = [
    "started",
    "success",
    "failure",
    "retry",
    "cancelled",
    "skipped",
];
const CATEGORIES = [
    "diagnostic",
    "operation",
    "security",
    "maintenance",
];
const METHODS = [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
];
const CACHE_STATUSES = [
    "hit",
    "miss",
    "bypass",
    "expired",
    "stale",
    "updating",
    "revalidated",
    "none",
];
const CONTEXT_FIELDS = ["requestId", "runId", "jobId", "effectId"];
const LABEL_FIELDS = ["code", "routeId", "provider", "operation"];
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
];
const EVENT_FIELDS = new Set([
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
const increment = (value) => Math.min(Number.MAX_SAFE_INTEGER, value + 1);
/** No file, socket, timer, listener, or process stream is opened at module import. */
export function createRuntimeLogger({ identity, sink: suppliedSink, now = Date.now, monotonicNow = () => performance.now(), }) {
    const safeIdentity = validateIdentity(identity);
    const sink = suppliedSink ?? defaultLogSink();
    if (!sink ||
        typeof sink.write !== "function" ||
        typeof sink.status !== "function") {
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
        emit(event) {
            let record;
            try {
                const timestamp = validTime(now());
                record = makeRecord(safeIdentity, event, timestamp, currentLogContext());
                if (record.level === "debug" &&
                    validMonotonicTime(monotonicNow()) >= debugDeadline) {
                    filtered = increment(filtered);
                    return false;
                }
            }
            catch {
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
            }
            catch {
                dropped = increment(dropped);
                return false;
            }
        },
        enableDebug(durationMs) {
            if (!Number.isSafeInteger(durationMs) ||
                durationMs < 0 ||
                durationMs > LOG_DEBUG_MAX_MILLISECONDS) {
                throw new TypeError("Debug logging requires a duration between zero and one hour.");
            }
            const until = durationMs === 0 ? 0 : validTime(validTime(now()) + durationMs);
            const deadline = durationMs === 0 ? 0 : validMonotonicTime(monotonicNow()) + durationMs;
            debugUntil = until;
            debugDeadline = deadline;
        },
        status() {
            return Object.freeze({
                accepted,
                dropped,
                invalid,
                filtered,
                debugUntil: debugUntil === 0 ||
                    validMonotonicTime(monotonicNow()) >= debugDeadline
                    ? null
                    : new Date(debugUntil).toISOString(),
                sink: sink.status(),
            });
        },
    });
}
const writableSinks = new WeakMap();
/** One bounded adapter per stream; late write errors remain visible without recursive logging. */
export function createWritableLogSink(stream, maxBufferedBytes = LOG_BUFFER_MAX_BYTES) {
    if (!Number.isSafeInteger(maxBufferedBytes) ||
        maxBufferedBytes < LOG_RECORD_MAX_BYTES ||
        maxBufferedBytes > LOG_BUFFER_MAX_BYTES) {
        throw new TypeError("Log transport capacity must fit one record and stay within the buffer ceiling.");
    }
    const existing = writableSinks.get(stream);
    if (existing) {
        if (existing.capacity !== maxBufferedBytes)
            throw new TypeError("A log stream already has a different buffer capacity.");
        return existing.sink;
    }
    let accepted = 0;
    let dropped = 0;
    let failed = 0;
    let broken = false;
    stream.on("error", () => {
        broken = true;
    });
    const sink = Object.freeze({
        write(line) {
            const size = Buffer.byteLength(line);
            if (broken ||
                stream.destroyed ||
                stream.writableEnded ||
                stream.writableNeedDrain ||
                size > LOG_RECORD_MAX_BYTES ||
                stream.writableLength + size > maxBufferedBytes) {
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
            }
            catch {
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
let stderrSink;
function defaultLogSink() {
    stderrSink ??= createWritableLogSink(process.stderr);
    return stderrSink;
}
/** A boundary records a request failure once, including failures after response headers. */
export function createErrorRecorder(logger) {
    if (!logger || typeof logger.emit !== "function")
        throw new TypeError("An error boundary requires a runtime logger.");
    const recorded = new WeakSet();
    return (event, owner) => {
        if (recorded.has(owner))
            return false;
        let accepted;
        try {
            accepted = logger.emit(event);
        }
        catch {
            return false;
        }
        if (accepted)
            recorded.add(owner);
        return accepted;
    };
}
function makeRecord(identity, event, timestamp, inheritedContext) {
    if (!event ||
        typeof event !== "object" ||
        Array.isArray(event) ||
        Object.keys(event).some((key) => !EVENT_FIELDS.has(key))) {
        throw new TypeError("Log events accept only the declared operational fields.");
    }
    if (typeof event.event !== "string" ||
        event.event.length > 96 ||
        !EVENT.test(event.event) ||
        !LEVELS.includes(event.level) ||
        !OUTCOMES.includes(event.outcome) ||
        !CATEGORIES.includes(event.category)) {
        throw new TypeError("Log event classification is invalid.");
    }
    const context = { ...inheritedContext };
    for (const key of CONTEXT_FIELDS) {
        if (event[key] !== undefined)
            context[key] = event[key];
    }
    const fields = {};
    for (const key of LABEL_FIELDS) {
        const value = event[key];
        if (value === undefined)
            continue;
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
        if (value === undefined)
            continue;
        if (!Number.isFinite(value) ||
            value < 0 ||
            value > Number.MAX_SAFE_INTEGER ||
            (key !== "durationMs" &&
                key !== "upstreamDurationMs" &&
                !Number.isSafeInteger(value))) {
            throw new TypeError("Log measurements must be finite and bounded.");
        }
        if ((key === "statusCode" || key === "upstreamStatusCode") &&
            (value < 100 || value > 599))
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
export function parseLogRecord(line) {
    if (typeof line !== "string" ||
        Buffer.byteLength(line) > LOG_RECORD_MAX_BYTES) {
        throw new TypeError("A serialized log record exceeds its byte ceiling.");
    }
    const value = JSON.parse(line);
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new TypeError("A log record must be an object.");
    const record = value;
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
    if (Object.keys(record).some((key) => !recordFields.has(key)) ||
        record["schemaVersion"] !== LOG_SCHEMA_VERSION ||
        typeof record["timestamp"] !== "string") {
        throw new TypeError("A log record has an unsupported schema or field.");
    }
    const timestamp = validTime(Date.parse(record["timestamp"]));
    if (new Date(timestamp).toISOString() !== record["timestamp"])
        throw new TypeError("Log timestamps must be canonical UTC instants.");
    const eventFields = {};
    for (const key of EVENT_FIELDS) {
        if (key !== "error" && Object.hasOwn(record, key))
            eventFields[key] = record[key];
    }
    const normalized = makeRecord(validateIdentity(value), eventFields, timestamp, {});
    return Object.freeze({
        ...normalized,
        ...(Object.hasOwn(record, "error")
            ? { error: validateSafeLogError(record["error"]) }
            : {}),
    });
}
function validateSafeLogError(value) {
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
    const location = /^[a-zA-Z0-9_-]{1,80}\.(?:[cm]?js|tsx?):\d{1,8}:\d{1,8}$/;
    function entry(candidate, keys) {
        if (!candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate) ||
            Object.keys(candidate).some((key) => !keys.includes(key)))
            throw new TypeError("Unsupported serialized error fields.");
        const fields = candidate;
        const locations = fields["locations"];
        if (typeof fields["type"] !== "string" ||
            !ERROR_TYPES.has(fields["type"]) ||
            !Array.isArray(locations) ||
            locations.length > 8 ||
            locations.some((item) => typeof item !== "string" || !location.test(item)))
            throw new TypeError("Unsafe serialized error evidence.");
        return Object.freeze({
            type: fields["type"],
            locations: Object.freeze([...locations]),
        });
    }
    const first = entry(value, [
        "type",
        "locations",
        "causes",
        "fingerprint",
        "truncated",
    ]);
    const fields = value;
    if (!Array.isArray(fields["causes"]) ||
        fields["causes"].length > 3 ||
        typeof fields["truncated"] !== "boolean")
        throw new TypeError("Serialized error causes exceed their contract.");
    const causes = fields["causes"].map((cause) => entry(cause, ["type", "locations"]));
    const fingerprint = createHash("sha256")
        .update(JSON.stringify([first, ...causes]))
        .digest("hex")
        .slice(0, 32);
    if (fields["fingerprint"] !== fingerprint)
        throw new TypeError("Serialized error fingerprint does not match its evidence.");
    return Object.freeze({
        ...first,
        causes: Object.freeze(causes),
        fingerprint,
        truncated: fields["truncated"],
    });
}
function safeError(error) {
    const causes = [];
    const seen = new Set();
    let current = error;
    let truncated = false;
    for (let depth = 0; depth < 4; depth += 1) {
        if (seen.has(current)) {
            truncated = true;
            break;
        }
        seen.add(current);
        const type = errorType(current);
        const locations = [];
        if (current instanceof Error && typeof current.stack === "string") {
            const stack = current.stack.slice(0, 32 * 1024);
            truncated ||= stack.length !== current.stack.length;
            for (const line of stack.split("\n").slice(1, 25)) {
                // Only executable source basenames and numeric positions survive. No message, locals,
                // function arguments, absolute paths, URL credentials, query strings, or custom fields.
                const match = /^\s+at .*?[/\\]([a-zA-Z0-9_-]{1,80}\.(?:[cm]?js|tsx?)):(\d{1,8}):(\d{1,8})\)?$/.exec(line);
                if (match)
                    locations.push(`${match[1]}:${match[2]}:${match[3]}`);
                if (locations.length === 8) {
                    truncated = true;
                    break;
                }
            }
        }
        causes.push({ type, locations: Object.freeze(locations) });
        if (!(current instanceof Error) || current.cause === undefined)
            break;
        current = current.cause;
        if (depth === 3)
            truncated = true;
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
function errorType(error) {
    for (const type of [
        TypeError,
        RangeError,
        SyntaxError,
        ReferenceError,
        URIError,
        EvalError,
        AggregateError,
    ]) {
        if (error instanceof type)
            return type.name;
    }
    return error instanceof Error ? "Error" : "UnknownError";
}
function validateIdentity(identity) {
    if (!identity ||
        typeof identity !== "object" ||
        !["development", "test", "production"].includes(identity.environment) ||
        !Number.isSafeInteger(identity.pid) ||
        identity.pid < 1) {
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
function validLabel(value) {
    if (typeof value !== "string" || !LABEL.test(value))
        throw new TypeError("Log labels must be bounded source-defined identifiers.");
    return value;
}
function validTime(value) {
    if (!Number.isSafeInteger(value) ||
        value < 0 ||
        value > 8_640_000_000_000_000)
        throw new TypeError("Invalid log timestamp.");
    return value;
}
function validMonotonicTime(value) {
    if (!Number.isFinite(value) ||
        value < 0 ||
        value > Number.MAX_SAFE_INTEGER - LOG_DEBUG_MAX_MILLISECONDS)
        throw new TypeError("Invalid monotonic log clock.");
    return value;
}
