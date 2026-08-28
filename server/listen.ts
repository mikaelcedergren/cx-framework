export interface HttpListenApplication<Server> {
  listen(port: number, host: string, callback: (error?: Error) => void): Server;
}

export interface HttpListenAddress {
  readonly host: string;
  readonly port: number;
}

/**
 * Resolves only after an Express-compatible application has successfully bound
 * its listener. Express 5 reports asynchronous bind failures to the listen
 * callback, so callers must await this result before announcing readiness or
 * installing work that assumes the server is reachable.
 */
export function listenHttpApplication<Server>(
  application: HttpListenApplication<Server>,
  address: HttpListenAddress,
): Promise<Server> {
  return new Promise((resolve, reject) => {
    let server: Server;
    let serverReturned = false;
    let callbackResult:
      | Readonly<{ kind: "error"; error: Error }>
      | Readonly<{ kind: "listening" }>
      | undefined;
    let settled = false;

    const settleCallbackResult = (): void => {
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

    const onListening = (error?: Error): void => {
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
    } catch (error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
      return;
    }

    settleCallbackResult();
  });
}
