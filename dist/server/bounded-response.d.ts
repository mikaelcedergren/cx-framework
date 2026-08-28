export type BoundedResponseErrorCode = "response_aborted" | "response_body_too_large" | "response_content_length_invalid" | "response_invalid_json" | "response_invalid_utf8" | "response_read_failed";
export interface BoundedResponseReadOptions {
    /** Maximum response-body bytes accepted from the Fetch stream. */
    readonly maxBytes: number;
    /** The active effect signal. Aborting it cancels and releases the body reader. */
    readonly signal?: AbortSignal;
}
export declare class BoundedResponseError extends Error {
    readonly code: BoundedResponseErrorCode;
    readonly maxBytes: number;
    readonly receivedBytes: number | undefined;
    constructor({ cause, code, maxBytes, message, receivedBytes, }: {
        readonly cause?: unknown;
        readonly code: BoundedResponseErrorCode;
        readonly maxBytes: number;
        readonly message: string;
        readonly receivedBytes?: number;
    });
}
/**
 * Read an untrusted Fetch response incrementally and stop as soon as its explicit byte ceiling is
 * crossed. The returned bytes are an owned copy; the response stream is always unlocked, and any
 * failed or aborted read cancels the upstream body before returning control to the caller.
 */
export declare function readBoundedResponseBytes(response: Response, options: BoundedResponseReadOptions): Promise<Uint8Array>;
/** Read a bounded response as strict UTF-8. Invalid byte sequences are never replacement-decoded. */
export declare function readBoundedResponseText(response: Response, options: BoundedResponseReadOptions): Promise<string>;
/** Read a bounded strict UTF-8 response and parse exactly one JSON value. */
export declare function readBoundedResponseJson(response: Response, options: BoundedResponseReadOptions): Promise<unknown>;
//# sourceMappingURL=bounded-response.d.ts.map