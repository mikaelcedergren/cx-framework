export class BoundedResponseError extends Error {
    code;
    maxBytes;
    receivedBytes;
    constructor({ cause, code, maxBytes, message, receivedBytes, }) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = "BoundedResponseError";
        this.code = code;
        this.maxBytes = maxBytes;
        this.receivedBytes = receivedBytes;
    }
}
function validateMaximum(maxBytes) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
        throw new RangeError("Response maxBytes must be a positive safe integer.");
    }
}
function responseError(code, message, maxBytes, options = {}) {
    return new BoundedResponseError({
        code,
        maxBytes,
        message,
        ...(options.cause === undefined ? {} : { cause: options.cause }),
        ...(options.receivedBytes === undefined
            ? {}
            : { receivedBytes: options.receivedBytes }),
    });
}
function contentLength(response, maxBytes) {
    const value = response.headers.get("content-length");
    if (value === null)
        return null;
    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) {
        throw responseError("response_content_length_invalid", "The response Content-Length header is invalid.", maxBytes);
    }
    const declared = BigInt(normalized);
    if (declared > BigInt(maxBytes)) {
        const receivedBytes = declared <= BigInt(Number.MAX_SAFE_INTEGER)
            ? Number(declared)
            : undefined;
        throw responseError("response_body_too_large", `The response body exceeds the ${maxBytes}-byte limit.`, maxBytes, receivedBytes === undefined ? {} : { receivedBytes });
    }
    return Number(declared);
}
function abortedError(maxBytes, signal) {
    return responseError("response_aborted", "Response-body reading was aborted.", maxBytes, { cause: signal.reason });
}
async function cancelBody(body, reason) {
    if (!body || body.locked)
        return;
    try {
        await body.cancel(reason);
    }
    catch {
        // Preserve the primary bounded-read failure. Cancellation is best-effort cleanup only.
    }
}
async function failBeforeReading(response, error) {
    await cancelBody(response.body, error);
    throw error;
}
function combineChunks(chunks, byteLength) {
    const body = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return body;
}
/**
 * Read an untrusted Fetch response incrementally and stop as soon as its explicit byte ceiling is
 * crossed. The returned bytes are an owned copy; the response stream is always unlocked, and any
 * failed or aborted read cancels the upstream body before returning control to the caller.
 */
export async function readBoundedResponseBytes(response, options) {
    validateMaximum(options.maxBytes);
    if (options.signal?.aborted) {
        return failBeforeReading(response, abortedError(options.maxBytes, options.signal));
    }
    try {
        contentLength(response, options.maxBytes);
    }
    catch (error) {
        if (error instanceof BoundedResponseError) {
            return failBeforeReading(response, error);
        }
        throw error;
    }
    if (!response.body)
        return new Uint8Array();
    let reader;
    try {
        reader = response.body.getReader();
    }
    catch (cause) {
        throw responseError("response_read_failed", "The response body could not be opened for reading.", options.maxBytes, { cause });
    }
    let abortListener;
    let abortPromise;
    if (options.signal) {
        const signal = options.signal;
        abortPromise = new Promise((_resolve, reject) => {
            abortListener = () => reject(abortedError(options.maxBytes, signal));
            signal.addEventListener("abort", abortListener, { once: true });
            if (signal.aborted)
                abortListener();
        });
    }
    const chunks = [];
    let receivedBytes = 0;
    try {
        while (true) {
            const result = await (abortPromise
                ? Promise.race([reader.read(), abortPromise])
                : reader.read());
            if (result.done)
                break;
            const chunk = result.value;
            if (!(chunk instanceof Uint8Array)) {
                throw responseError("response_read_failed", "The response body produced a non-byte chunk.", options.maxBytes);
            }
            if (chunk.byteLength > options.maxBytes - receivedBytes) {
                throw responseError("response_body_too_large", `The response body exceeds the ${options.maxBytes}-byte limit.`, options.maxBytes, { receivedBytes: receivedBytes + chunk.byteLength });
            }
            chunks.push(chunk);
            receivedBytes += chunk.byteLength;
        }
        if (options.signal?.aborted) {
            throw abortedError(options.maxBytes, options.signal);
        }
        return combineChunks(chunks, receivedBytes);
    }
    catch (error) {
        const normalized = error instanceof BoundedResponseError
            ? error
            : options.signal?.aborted
                ? abortedError(options.maxBytes, options.signal)
                : responseError("response_read_failed", "The response body could not be read.", options.maxBytes, { cause: error, receivedBytes });
        try {
            await reader.cancel(normalized);
        }
        catch {
            // Preserve the primary bounded-read failure. Cancellation is best-effort cleanup only.
        }
        throw normalized;
    }
    finally {
        if (abortListener && options.signal) {
            options.signal.removeEventListener("abort", abortListener);
        }
        try {
            reader.releaseLock();
        }
        catch {
            // A hostile stream must not replace the clear bounded-read error during cleanup.
        }
    }
}
/** Read a bounded response as strict UTF-8. Invalid byte sequences are never replacement-decoded. */
export async function readBoundedResponseText(response, options) {
    const bytes = await readBoundedResponseBytes(response, options);
    if (options.signal?.aborted) {
        throw abortedError(options.maxBytes, options.signal);
    }
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    catch (cause) {
        throw responseError("response_invalid_utf8", "The response body is not valid UTF-8.", options.maxBytes, { cause, receivedBytes: bytes.byteLength });
    }
}
/** Read a bounded strict UTF-8 response and parse exactly one JSON value. */
export async function readBoundedResponseJson(response, options) {
    const text = await readBoundedResponseText(response, options);
    if (options.signal?.aborted) {
        throw abortedError(options.maxBytes, options.signal);
    }
    try {
        return JSON.parse(text);
    }
    catch (cause) {
        throw responseError("response_invalid_json", "The response body is not valid JSON.", options.maxBytes, { cause });
    }
}
