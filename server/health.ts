import type { Middleware } from "./http.js";

export interface HealthPayload {
  app: string;
  ok: true;
  port: number;
}

export interface UnavailableHealthPayload {
  ok: false;
}

/**
 * A synchronous, side-effect-free check of essential local process state.
 * Returning anything other than `true`, or throwing, makes the process unavailable.
 */
export type HealthReadinessProbe = () => boolean;

export function healthPayload(app: string, port: number): HealthPayload {
  if (!app.trim()) throw new Error("Health payload requires an app name.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Health payload requires a valid port.");
  }
  return { app, ok: true, port };
}

export function healthMiddleware(
  app: string,
  port: number,
  readinessProbe?: HealthReadinessProbe,
): Middleware {
  const healthyPayload = healthPayload(app, port);
  const unavailablePayload: UnavailableHealthPayload = { ok: false };
  if (readinessProbe !== undefined && typeof readinessProbe !== "function") {
    throw new Error("Health readiness probe must be a function.");
  }
  return (_request, response) => {
    let ready = true;
    if (readinessProbe) {
      try {
        ready = readinessProbe() === true;
      } catch {
        ready = false;
      }
    }
    response.setHeader("Cache-Control", "no-store");
    response
      .status(ready ? 200 : 503)
      .type("application/json")
      .json(ready ? healthyPayload : unavailablePayload);
  };
}
