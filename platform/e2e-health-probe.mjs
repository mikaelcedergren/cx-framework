import http from "node:http";

export const E2E_OWNER_HEADER_NAME = "x-cx-e2e-owner-nonce";

const OWNER_NONCE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function probeExactE2EHealth(value, timeoutMs, ownerNonce) {
  const url = exactHealthUrl(value);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1_000) {
    throw new Error("E2E health probe timeout must be 1..1000 milliseconds.");
  }
  if (typeof ownerNonce !== "string" || !OWNER_NONCE.test(ownerNonce)) {
    throw new Error("E2E health probe requires one exact owner nonce.");
  }

  return new Promise((resolve) => {
    let response;
    let settled = false;
    let timer;
    const finish = (ready) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ready);
    };
    const request = http.get(url, (incoming) => {
      response = incoming;
      const ready =
        incoming.statusCode === 200 &&
        incoming.headers[E2E_OWNER_HEADER_NAME] === ownerNonce;
      incoming.resume();
      incoming.once("aborted", () => finish(false));
      incoming.once("end", () => finish(ready));
      incoming.once("error", () => finish(false));
    });
    const stop = () => {
      response?.destroy();
      request.destroy();
      finish(false);
    };
    request.setTimeout(timeoutMs, stop);
    request.once("error", () => finish(false));
    timer = setTimeout(stop, timeoutMs);
  });
}

function exactHealthUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("E2E health probe requires one exact loopback URL.");
  }
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== "/healthz" ||
    url.search ||
    url.hash
  ) {
    throw new Error("E2E health probe requires one exact loopback URL.");
  }
  return url;
}
