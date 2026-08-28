import type { HttpRequest, Middleware } from "./http.js";
export declare const DEFAULT_SITE_GATE_PUBLIC_PATHS: readonly string[];
export type SiteGateRequestClass = "api" | "gate" | "protected-page" | "public";
export interface SiteGatePolicyOptions {
    apiPathPrefixes?: readonly string[];
    gatePath?: string;
    /** Additional exact paths that remain reachable while the gate is locked. */
    publicPaths?: readonly string[];
}
export interface SiteGatePolicy {
    readonly apiPathPrefixes: readonly string[];
    readonly gatePath: string;
    readonly publicPaths: readonly string[];
}
export interface SiteGateFormPresentationOptions {
    errorClassName?: string;
    errorMessage?: string;
    formClassName?: string;
    inputClassName?: string;
    labelClassName?: string;
    passwordLabel?: string;
    submitClassName?: string;
    submitLabel?: string;
}
export interface SiteGatePresentationOptions {
    form?: SiteGateFormPresentationOptions;
    template: string;
}
export interface SiteGateFormPresentation {
    readonly errorClassName: string;
    readonly errorMessage: string;
    readonly formClassName: string;
    readonly inputClassName: string;
    readonly labelClassName: string;
    readonly passwordLabel: string;
    readonly submitClassName: string;
    readonly submitLabel: string;
}
declare const siteGatePresentationBrand: unique symbol;
/**
 * A startup-validated, request-independent gate page shell.
 *
 * Construct this value only through `createSiteGatePresentation()`. The private brand prevents a
 * mutable or unvalidated structural lookalike from entering the request path.
 */
export interface SiteGatePresentation {
    readonly [siteGatePresentationBrand]: true;
    readonly form: SiteGateFormPresentation;
    readonly template: string;
}
export interface SiteGateOptions extends SiteGatePolicyOptions {
    cookieName?: string;
    /** The maximum unlock lifetime. The framework caps this at seven days. */
    maxAgeSeconds?: number;
    /** Injectable clock for deterministic tests and controlled runtimes. */
    now?: () => number;
    password?: string;
    presentation?: SiteGatePresentation;
    secret?: string;
    siteName?: string;
}
export interface SiteGate {
    readonly enabled: boolean;
    readonly gatePath: string;
    isUnlocked(request: HttpRequest): boolean;
    middleware(): Middleware;
}
export declare const SITE_GATE_FORM_SLOT = "<!-- cx-site-gate-form -->";
export declare const SITE_GATE_CONTENT_SECURITY_POLICIES: Readonly<{
    readonly default: "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
    readonly presented: "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
}>;
export declare const SITE_GATE_SECURITY_HEADERS: Readonly<{
    readonly "referrer-policy": "no-referrer";
    readonly "x-content-type-options": "nosniff";
    readonly "x-frame-options": "DENY";
    readonly "x-robots-tag": "noindex, nofollow";
}>;
/**
 * Validate and freeze one branded page shell before it can be supplied to `createSiteGate()`.
 *
 * The shell is static product presentation, not a request renderer. It may reference exact
 * same-origin assets, but it cannot contain executable content, inline styles, embedded documents,
 * or form controls. Cortex inserts the sole form at `SITE_GATE_FORM_SLOT`.
 */
export declare function createSiteGatePresentation(options: SiteGatePresentationOptions): SiteGatePresentation;
export declare function createSiteGatePolicy({ apiPathPrefixes, gatePath, publicPaths, }?: SiteGatePolicyOptions): SiteGatePolicy;
export declare function classifySiteGateRequest(policy: SiteGatePolicy, requestPath: string): SiteGateRequestClass;
/**
 * Build a dependency-free pre-launch gate for an Express-compatible Node server.
 *
 * Empty passwords deliberately make the middleware inert for local development, but every path,
 * cookie, lifetime, label, and clock option is still validated before that decision. Products
 * whose launch policy requires a gate must enforce the non-empty password in product-owned startup
 * configuration. When enabled, unlock state is a bounded, purpose-bound signed cookie; it contains
 * no password or product data.
 */
export declare function createSiteGate({ apiPathPrefixes, cookieName, gatePath, maxAgeSeconds, now, password, presentation, publicPaths, secret, siteName, }?: SiteGateOptions): SiteGate;
export {};
//# sourceMappingURL=gate.d.ts.map