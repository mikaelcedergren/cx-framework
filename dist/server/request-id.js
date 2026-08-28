const REQUEST_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
export const REQUEST_ID_HEADER = "X-Request-ID";
export function createRequestId() {
    return globalThis.crypto.randomUUID();
}
export function requestIdFrom(request) {
    return request.requestId;
}
export function requestIdMiddleware({ generate = createRequestId, trustIncoming = false, } = {}) {
    return (request, response, next) => {
        const incoming = trustIncoming ? incomingRequestId(request) : undefined;
        const requestId = incoming ?? generate();
        if (!REQUEST_ID_PATTERN.test(requestId)) {
            next(new Error("The request ID generator returned an unsafe value."));
            return;
        }
        request.requestId = requestId;
        response.setHeader(REQUEST_ID_HEADER, requestId);
        next();
    };
}
function incomingRequestId(request) {
    const value = request.headers?.["x-request-id"];
    return typeof value === "string" && REQUEST_ID_PATTERN.test(value)
        ? value
        : undefined;
}
