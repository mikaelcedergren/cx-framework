import type { Middleware } from "./http.js";
export interface OriginGuardOptions {
    allowedOrigins: readonly string[];
    allowMissingOrigin?: boolean;
}
export declare function normalizeHttpOrigin(value: string): string;
export declare function createOriginGuard({ allowedOrigins, allowMissingOrigin, }: OriginGuardOptions): Middleware;
//# sourceMappingURL=origin.d.ts.map