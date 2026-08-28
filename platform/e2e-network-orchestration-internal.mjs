import { randomInt } from "node:crypto";
import http from "node:http";
import { createConnection, createServer } from "node:net";
import { URL as NodeURL } from "node:url";
import { E2E_DYNAMIC_PORT_RANGE } from "./e2e-contract.mjs";
import { probeExactE2EHealth } from "./e2e-health-probe.mjs";

export function createExactOriginFetch(nativeFetch, allowedOrigin) {
  if (typeof nativeFetch !== "function") {
    throw new TypeError(
      "E2E fetch isolation requires a native fetch function.",
    );
  }
  const allowed = exactLoopbackOrigin(allowedOrigin, "allowed E2E origin");
  const NativeURL = NodeURL;
  const urlHrefGetter = intrinsicGetter(NativeURL.prototype, "href", "URL");
  const urlOriginGetter = intrinsicGetter(NativeURL.prototype, "origin", "URL");
  const urlPasswordGetter = intrinsicGetter(
    NativeURL.prototype,
    "password",
    "URL",
  );
  const urlUsernameGetter = intrinsicGetter(
    NativeURL.prototype,
    "username",
    "URL",
  );
  const exactAllowedOrigin = urlOriginGetter.call(allowed);
  const requestUrlGetter =
    typeof Request === "function"
      ? intrinsicGetter(Request.prototype, "url", "Request")
      : undefined;
  return async (input, init) => {
    if (init !== undefined && init !== null) {
      if (typeof init !== "object" || Array.isArray(init)) {
        throw new Error("E2E network isolation blocked invalid fetch options.");
      }
      for (const name of ["agent", "dispatcher"]) {
        if (name in init) {
          throw new Error(
            `E2E network isolation blocked fetch transport override ${name}.`,
          );
        }
      }
    }
    let forwardedInput;
    let raw;
    if (typeof input === "string") {
      raw = input;
    } else if (input instanceof NativeURL) {
      raw = urlHrefGetter.call(input);
    } else if (requestUrlGetter) {
      try {
        raw = requestUrlGetter.call(input);
        forwardedInput = input;
      } catch {
        throw new Error(
          "E2E network isolation blocked an invalid fetch input.",
        );
      }
    } else {
      throw new Error("E2E network isolation blocked an invalid fetch input.");
    }
    let target;
    try {
      target = new NativeURL(raw);
    } catch {
      throw new Error("E2E network isolation blocked an invalid fetch URL.");
    }
    if (
      urlUsernameGetter.call(target) ||
      urlPasswordGetter.call(target) ||
      urlOriginGetter.call(target) !== exactAllowedOrigin
    ) {
      throw new Error(
        `E2E network isolation blocked fetch to ${urlOriginGetter.call(target)}.`,
      );
    }
    return nativeFetch(forwardedInput ?? urlHrefGetter.call(target), {
      ...init,
      redirect: "manual",
    });
  };
}

export async function createExactOriginProxy(allowedOrigin) {
  const allowed = exactLoopbackOrigin(allowedOrigin, "allowed E2E origin");
  const connections = new Set();
  const upstreamRequests = new Set();
  const server = http.createServer((request, response) => {
    let target;
    try {
      target = new NodeURL(request.url, allowedOrigin);
    } catch {
      denyProxy(response);
      return;
    }
    if (
      target.username ||
      target.password ||
      target.origin !== allowedOrigin ||
      target.protocol !== "http:"
    ) {
      denyProxy(response);
      return;
    }
    const headers = { ...request.headers, host: target.host };
    delete headers["proxy-authorization"];
    delete headers["proxy-connection"];
    const upstream = http.request(
      {
        headers,
        host: "127.0.0.1",
        method: request.method,
        path: `${target.pathname}${target.search}`,
        port: allowed.port,
      },
      (upstreamResponse) => {
        response.writeHead(
          upstreamResponse.statusCode ?? 502,
          upstreamResponse.headers,
        );
        upstreamResponse.pipe(response);
      },
    );
    upstreamRequests.add(upstream);
    upstream.once("close", () => upstreamRequests.delete(upstream));
    upstream.once("error", () => {
      if (!response.headersSent)
        response.writeHead(502, { "content-type": "text/plain" });
      response.end("E2E upstream unavailable.\n");
    });
    request.once("aborted", () => upstream.destroy());
    response.once("close", () => {
      if (!response.writableEnded) upstream.destroy();
    });
    request.pipe(upstream);
  });
  server.on("connection", (socket) => {
    connections.add(socket);
    socket.once("close", () => connections.delete(socket));
  });
  server.on("connect", (request, socket, head) => {
    if (request.url !== allowed.host) {
      denyProxyTunnel(socket);
      return;
    }
    const upstream = createConnection({
      host: "127.0.0.1",
      port: Number(allowed.port),
    });
    connections.add(upstream);
    upstream.once("close", () => connections.delete(upstream));
    upstream.once("connect", () => {
      if (socket.destroyed) {
        upstream.destroy();
        return;
      }
      socket.write(
        "HTTP/1.1 200 Connection Established\r\nConnection: keep-alive\r\n\r\n",
      );
      if (head.length > 0) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    upstream.once("error", () => {
      if (!socket.destroyed) {
        socket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n");
      }
    });
    socket.once("close", () => upstream.destroy());
  });
  server.on("upgrade", (_request, socket) => socket.destroy());
  const proxyPort = await listenOnDynamicLoopbackPort(
    server,
    new Set([Number(allowed.port)]),
  );
  return Object.freeze({
    close: () => closeServer(server, connections, upstreamRequests),
    url: `http://127.0.0.1:${proxyPort}`,
  });
}

async function listenOnDynamicLoopbackPort(server, excludedPorts) {
  const portCount =
    E2E_DYNAMIC_PORT_RANGE.last - E2E_DYNAMIC_PORT_RANGE.first + 1;
  const firstOffset = randomInt(portCount);
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const port =
      E2E_DYNAMIC_PORT_RANGE.first + ((firstOffset + attempt) % portCount);
    if (excludedPorts.has(port)) continue;
    try {
      await listenOnLoopbackPort(server, port);
      return port;
    } catch (error) {
      if (error?.code !== "EADDRINUSE") throw error;
    }
  }
  throw new Error(
    `Could not bind an owned E2E listener in ${E2E_DYNAMIC_PORT_RANGE.first}..${E2E_DYNAMIC_PORT_RANGE.last}.`,
  );
}

function listenOnLoopbackPort(server, port) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen({ exclusive: true, host: "127.0.0.1", port });
  });
}

function denyProxy(response) {
  response.writeHead(403, {
    connection: "close",
    "content-type": "text/plain; charset=utf-8",
  });
  response.end("E2E proxy denied this origin.\n");
}

function denyProxyTunnel(socket) {
  socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
}

async function waitForExactLoopbackHealth({
  controller,
  ownerNonce,
  timeoutMs,
  url,
}) {
  const target = new NodeURL(url);
  if (target.protocol !== "http:" || target.hostname !== "127.0.0.1") {
    throw new Error(
      "E2E health polling accepts only the owned loopback origin.",
    );
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now();
    const winner = await Promise.race([
      controller.result.then((result) => ({ result, type: "exit" })),
      probeExactE2EHealth(target, Math.min(250, remainingMs), ownerNonce).then(
        (ready) => ({
          ready,
          type: "health",
        }),
      ),
    ]);
    if (winner.type === "exit") {
      throw new Error(
        `E2E controller failed during setup (${formatResult(winner.result)}).`,
      );
    }
    if (winner.ready) return;
    await delay(Math.min(50, Math.max(0, deadline - Date.now())));
  }
  throw new Error(
    `E2E controller did not become ready within ${timeoutMs} ms.`,
  );
}

function validatedStartupTimeout(value = 180_000) {
  if (!Number.isInteger(value) || value < 100 || value > 300_000) {
    throw new Error(
      "E2E controller startup timeout must be 100..300000 milliseconds.",
    );
  }
  return value;
}

async function reserveLoopbackPort() {
  const server = createServer();
  try {
    const port = await listenOnDynamicLoopbackPort(server, new Set());
    await closeServer(server);
    return port;
  } catch (error) {
    await closeServer(server).catch(() => {});
    throw error;
  }
}

function closeServer(
  server,
  connections = new Set(),
  upstreamRequests = new Set(),
) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let forceTimer;
    let deadlineTimer;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(forceTimer);
      clearTimeout(deadlineTimer);
      if (error && error.code !== "ERR_SERVER_NOT_RUNNING") reject(error);
      else resolve();
    };
    forceTimer = setTimeout(() => {
      for (const socket of connections) socket.destroy();
      for (const request of upstreamRequests) request.destroy();
      server.closeAllConnections?.();
    }, 250);
    deadlineTimer = setTimeout(() => {
      for (const socket of connections) socket.destroy();
      for (const request of upstreamRequests) request.destroy();
      finish(
        new Error("Owned E2E listener did not close within its deadline."),
      );
    }, 1_000);
    server.close(finish);
    server.closeIdleConnections?.();
  });
}

function loopbackPortIsOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    let settled = false;
    const finish = (open) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", (error) => finish(error?.code !== "ECONNREFUSED"));
    socket.setTimeout(250, () => finish(true));
  });
}

async function waitForLoopbackPortToClose(port, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (await loopbackPortIsOpen(port)) {
    if (Date.now() >= deadline) {
      throw new Error(`E2E teardown left loopback port ${port} open.`);
    }
    await delay(25);
  }
}

function intrinsicGetter(prototype, property, label) {
  const getter = Object.getOwnPropertyDescriptor(prototype, property)?.get;
  if (typeof getter !== "function") {
    throw new Error(`${label}.${property} intrinsic is unavailable.`);
  }
  return getter;
}

function validatePort(port) {
  if (
    !Number.isInteger(port) ||
    port < E2E_DYNAMIC_PORT_RANGE.first ||
    port > E2E_DYNAMIC_PORT_RANGE.last
  ) {
    throw new Error(
      `E2E port must be inside ${E2E_DYNAMIC_PORT_RANGE.first}..${E2E_DYNAMIC_PORT_RANGE.last}.`,
    );
  }
}

function exactLoopbackOrigin(value, label) {
  let url;
  try {
    url = new NodeURL(value);
  } catch {
    throw new Error(`${label} must be one exact loopback HTTP origin.`);
  }
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.origin !== value
  ) {
    throw new Error(`${label} must be one exact loopback HTTP origin.`);
  }
  return url;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatResult(result) {
  return result.code === null
    ? `signal ${result.signal ?? "unknown"}`
    : `exit ${result.code}`;
}

export {
  delay,
  exactLoopbackOrigin,
  formatResult,
  loopbackPortIsOpen,
  reserveLoopbackPort,
  validatePort,
  validatedStartupTimeout,
  waitForExactLoopbackHealth,
  waitForLoopbackPortToClose,
};
