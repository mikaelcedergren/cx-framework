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
export declare function healthPayload(app: string, port: number): HealthPayload;
export declare function healthMiddleware(app: string, port: number, readinessProbe?: HealthReadinessProbe): Middleware;
//# sourceMappingURL=health.d.ts.map