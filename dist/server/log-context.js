import { AsyncLocalStorage } from "node:async_hooks";
const contextStorage = new AsyncLocalStorage();
const CONTEXT_KEYS = ["requestId", "runId", "jobId", "effectId"];
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
/** Capture only correlation references, never an HTTP request or a product record. */
export function currentLogContext() {
    return contextStorage.getStore() ?? Object.freeze({});
}
/** Replace context at an operation boundary; explicitly carry parent references into child work. */
export function runWithLogContext(context, operation) {
    return contextStorage.run(validateLogContext(context), operation);
}
export function validateLogContext(context) {
    if (!context || typeof context !== "object" || Array.isArray(context)) {
        throw new TypeError("Log context must be an object of correlation references.");
    }
    const keys = Object.keys(context);
    if (keys.some((key) => !CONTEXT_KEYS.includes(key))) {
        throw new TypeError("Log context contains an unsupported field.");
    }
    const result = {};
    for (const key of CONTEXT_KEYS) {
        const value = context[key];
        if (value === undefined)
            continue;
        if (typeof value !== "string" || !ID_PATTERN.test(value)) {
            throw new TypeError("Log correlation references must be bounded opaque identifiers.");
        }
        result[key] = value;
    }
    return Object.freeze(result);
}
