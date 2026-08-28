/**
 * Resolves only after an Express-compatible application has successfully bound
 * its listener. Express 5 reports asynchronous bind failures to the listen
 * callback, so callers must await this result before announcing readiness or
 * installing work that assumes the server is reachable.
 */
export function listenHttpApplication(application, address) {
    return new Promise((resolve, reject) => {
        let server;
        let serverReturned = false;
        let callbackResult;
        let settled = false;
        const settleCallbackResult = () => {
            if (!serverReturned || !callbackResult || settled) {
                return;
            }
            settled = true;
            if (callbackResult.kind === "error") {
                reject(callbackResult.error);
                return;
            }
            resolve(server);
        };
        const onListening = (error) => {
            if (settled || callbackResult) {
                return;
            }
            callbackResult = error
                ? Object.freeze({ error, kind: "error" })
                : Object.freeze({ kind: "listening" });
            settleCallbackResult();
        };
        try {
            server = application.listen(address.port, address.host, onListening);
            serverReturned = true;
        }
        catch (error) {
            if (!settled) {
                settled = true;
                reject(error);
            }
            return;
        }
        settleCallbackResult();
    });
}
