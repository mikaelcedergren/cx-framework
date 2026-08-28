import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { DestroyRef, Injectable, InjectionToken, PLATFORM_ID, inject, makeEnvironmentProviders, signal, } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import * as i0 from "@angular/core";
export const CX_BUILD_ID_META_NAME = "cx-build-id";
export const CX_BUILD_INFO_ENDPOINT = "/cx-build.json";
const BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;
const BUILD_ID_PLACEHOLDER = "__CX_BUILD_ID__";
const BUILD_REQUEST_TIMEOUT_MS = 2_000;
const MAX_DIAGNOSTIC_ENDPOINT_LENGTH = 256;
const MAX_DIAGNOSTIC_ROUTE_LENGTH = 256;
const DYNAMIC_IMPORT_ERROR_PATTERN = /chunkloaderror|dynamically imported module|module script|loading chunk|failed to fetch.*module|importing a module|unexpected token ['"]?<['"]?|mime type/i;
export const CX_NAVIGATION_RECOVERY_DEFAULT_COPY = Object.freeze({
    failureHeading: "Page could not open",
    dynamicImportFailureDescription: "A required app file could not be loaded. Check your connection, then try again.",
    navigationFailureDescription: "Navigation failed. Try opening the page again, or reload if the problem continues.",
    staleBuildHeading: "The app has been updated",
    staleBuildDescription: "This page cannot open with the version in this tab. Save any unsaved work, then reload.",
    retryActionLabel: "Retry",
    reloadActionLabel: "Reload",
    dismissActionAriaLabel: "Dismiss navigation recovery",
});
function resolveDiagnosticsEndpoint(value) {
    if (value === undefined) {
        return undefined;
    }
    const endpoint = value.trim();
    let isSameOriginRoute = false;
    try {
        const base = new URL("https://cx-navigation-recovery.invalid");
        const resolved = new URL(endpoint, base);
        isSameOriginRoute =
            resolved.origin === base.origin &&
                resolved.pathname === endpoint &&
                !resolved.search &&
                !resolved.hash;
    }
    catch {
        isSameOriginRoute = false;
    }
    const isBoundedRoute = endpoint.length > 0 &&
        endpoint.length <= MAX_DIAGNOSTIC_ENDPOINT_LENGTH &&
        /^\/(?!\/)[^\s?#\\]*$/.test(endpoint) &&
        isSameOriginRoute;
    if (!isBoundedRoute) {
        throw new Error("[cx-navigation-recovery] diagnosticsEndpoint must be a same-origin route without a query or fragment.");
    }
    return endpoint;
}
function resolveConfig(options = {}) {
    return {
        diagnosticsEndpoint: resolveDiagnosticsEndpoint(options.diagnosticsEndpoint),
        copy: {
            ...CX_NAVIGATION_RECOVERY_DEFAULT_COPY,
            ...(options.copy ?? {}),
        },
    };
}
const CX_NAVIGATION_RECOVERY_CONFIG = new InjectionToken("CX_NAVIGATION_RECOVERY_CONFIG", {
    providedIn: "root",
    factory: () => resolveConfig(),
});
/**
 * Configures the app-level navigation recovery pattern. The build identity
 * contract remains fixed across products; copy and diagnostics are app policy.
 */
export function provideCxNavigationRecovery(options = {}) {
    return makeEnvironmentProviders([
        {
            provide: CX_NAVIGATION_RECOVERY_CONFIG,
            useValue: resolveConfig(options),
        },
    ]);
}
function validBuildId(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const buildId = value.trim();
    return buildId !== BUILD_ID_PLACEHOLDER && BUILD_ID_PATTERN.test(buildId)
        ? buildId
        : undefined;
}
function errorText(error, depth = 0) {
    if (depth >= 3) {
        return "";
    }
    if (typeof error === "string") {
        return error;
    }
    if (error instanceof Error) {
        const cause = "cause" in error ? error.cause : undefined;
        return `${error.name}: ${error.message} ${errorText(cause, depth + 1)}`;
    }
    if (error && typeof error === "object") {
        const value = error;
        return `${String(value.name ?? "")}: ${String(value.message ?? "")} ${errorText(value.cause, depth + 1)}`;
    }
    return String(error ?? "");
}
export function isCxDynamicImportFailure(error) {
    return DYNAMIC_IMPORT_ERROR_PATTERN.test(errorText(error));
}
/**
 * Routes Angular navigation failures into the configured recovery service.
 * Pass this directly to `withNavigationErrorHandler`.
 */
export function cxNavigationRecoveryHandler(error) {
    inject(CxNavigationRecoveryService).handle(error);
}
export class CxNavigationRecoveryService {
    router = inject(Router);
    destroyRef = inject(DestroyRef);
    document = inject(DOCUMENT);
    platformId = inject(PLATFORM_ID);
    config = inject(CX_NAVIGATION_RECOVERY_CONFIG);
    browser = isPlatformBrowser(this.platformId);
    recoveryState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "recoveryState" }] : /* istanbul ignore next */ []));
    failedUrl;
    failureSequence = 0;
    retrying = false;
    retryRequiresFreshDocument = false;
    clientBuildId = this.readClientBuildId();
    state = this.recoveryState.asReadonly();
    constructor() {
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.hide());
    }
    handle(error) {
        const sequence = ++this.failureSequence;
        const dynamicImportFailure = isCxDynamicImportFailure(error.error);
        const route = this.routePath(error.url);
        const occurredAt = new Date().toISOString();
        this.failedUrl = error.url;
        this.retrying = false;
        this.retryRequiresFreshDocument = dynamicImportFailure;
        this.showRecoverableFailure(dynamicImportFailure);
        console.error("[Navigation] Page navigation failed", {
            route,
            category: dynamicImportFailure ? "dynamic-import" : "navigation",
            clientBuildId: this.clientBuildId ?? "unknown",
        });
        if (dynamicImportFailure) {
            void this.checkForNewBuild(sequence, route, occurredAt);
        }
        else {
            this.reportFailure("navigation", route, occurredAt);
        }
    }
    dismiss() {
        this.hide();
    }
    performPrimaryAction() {
        this.performAction(this.recoveryState()?.primaryAction.kind);
    }
    performSecondaryAction() {
        this.performAction(this.recoveryState()?.secondaryAction?.kind);
    }
    performAction(action) {
        if (action === "retry") {
            void this.retry();
        }
        else if (action === "reload") {
            this.reload();
        }
    }
    async checkForNewBuild(sequence, route, occurredAt) {
        const serverBuildId = await this.currentServerBuildId();
        // Once the server has a valid identity, an unknown client identity is not
        // evidence of compatibility. Conservatively require a fresh document.
        const staleBuild = serverBuildId !== undefined && this.clientBuildId !== serverBuildId;
        if (sequence !== this.failureSequence) {
            return;
        }
        this.reportFailure(staleBuild ? "stale-build" : "dynamic-import", route, occurredAt, serverBuildId);
        if (!staleBuild) {
            return;
        }
        const copy = this.config.copy;
        this.recoveryState.set({
            category: "stale-build",
            mood: "warning",
            heading: copy.staleBuildHeading,
            description: copy.staleBuildDescription,
            primaryAction: {
                kind: "reload",
                text: copy.reloadActionLabel,
            },
            dismissAriaLabel: copy.dismissActionAriaLabel,
        });
        this.retryRequiresFreshDocument = true;
    }
    showRecoverableFailure(dynamicImportFailure) {
        const copy = this.config.copy;
        this.recoveryState.set({
            category: dynamicImportFailure ? "dynamic-import" : "navigation",
            mood: "danger",
            heading: copy.failureHeading,
            description: dynamicImportFailure
                ? copy.dynamicImportFailureDescription
                : copy.navigationFailureDescription,
            primaryAction: {
                kind: "retry",
                text: copy.retryActionLabel,
            },
            secondaryAction: {
                kind: "reload",
                text: copy.reloadActionLabel,
                transparent: true,
            },
            dismissAriaLabel: copy.dismissActionAriaLabel,
        });
    }
    async retry() {
        const failedUrl = this.failedUrl;
        if (!failedUrl || this.retrying) {
            return;
        }
        this.retrying = true;
        const sequence = this.failureSequence;
        this.setPrimaryLoading(true);
        if (this.retryRequiresFreshDocument) {
            this.retryInFreshDocument(failedUrl, sequence);
            return;
        }
        try {
            await this.router.navigateByUrl(failedUrl);
        }
        catch {
            // The router's configured navigation error handler owns the next state.
        }
        finally {
            this.finishRetry(sequence);
        }
    }
    retryInFreshDocument(failedUrl, sequence) {
        const view = this.browserView();
        if (!view) {
            this.finishRetry(sequence);
            return;
        }
        const retryUrl = this.sameOriginNavigationUrl(failedUrl, view);
        if (!retryUrl) {
            this.finishRetry(sequence);
            return;
        }
        view.setTimeout(() => this.finishRetry(sequence), 1_000);
        try {
            // Failed module imports are cached in the current document's module map.
            // A user-initiated document navigation is the only reliable retry.
            view.location.assign(retryUrl);
        }
        catch {
            this.finishRetry(sequence);
        }
    }
    finishRetry(sequence) {
        if (sequence !== this.failureSequence) {
            return;
        }
        this.retrying = false;
        this.setPrimaryLoading(false);
    }
    setPrimaryLoading(loading) {
        this.recoveryState.update((state) => state
            ? {
                ...state,
                primaryAction: { ...state.primaryAction, loading },
            }
            : state);
    }
    reload() {
        // Reload is never automatic. Browser beforeunload protection remains in
        // control of unsaved work when the user explicitly chooses this action.
        this.browserView()?.location.reload();
    }
    async currentServerBuildId() {
        const view = this.browserView();
        if (!view || typeof view.fetch !== "function") {
            return undefined;
        }
        const controller = typeof AbortController === "undefined"
            ? undefined
            : new AbortController();
        const timeoutId = view.setTimeout(() => controller?.abort(), BUILD_REQUEST_TIMEOUT_MS);
        try {
            const response = await view.fetch(CX_BUILD_INFO_ENDPOINT, {
                cache: "no-store",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Cache-Control": "no-cache",
                },
                signal: controller?.signal,
            });
            if (!response.ok) {
                return undefined;
            }
            const body = (await response.json());
            return validBuildId(body?.buildId);
        }
        catch {
            return undefined;
        }
        finally {
            view.clearTimeout(timeoutId);
        }
    }
    reportFailure(category, route, occurredAt, serverBuildId) {
        const endpoint = this.config.diagnosticsEndpoint;
        const view = this.browserView();
        if (!endpoint || !view) {
            return;
        }
        const body = JSON.stringify({
            category,
            route,
            occurredAt,
            ...(this.clientBuildId ? { clientBuildId: this.clientBuildId } : {}),
            ...(serverBuildId ? { serverBuildId } : {}),
        });
        try {
            if (typeof view.navigator.sendBeacon === "function" &&
                view.navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }))) {
                return;
            }
        }
        catch {
            // A blocked beacon falls through to a bounded keepalive request.
        }
        if (typeof view.fetch === "function") {
            void view
                .fetch(endpoint, {
                method: "POST",
                body,
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                keepalive: true,
            })
                .catch(() => undefined);
        }
    }
    readClientBuildId() {
        if (!this.browser) {
            return undefined;
        }
        return validBuildId(this.document
            .querySelector(`meta[name="${CX_BUILD_ID_META_NAME}"]`)
            ?.content.trim());
    }
    hide() {
        this.failureSequence += 1;
        this.recoveryState.set(undefined);
        this.failedUrl = undefined;
        this.retrying = false;
        this.retryRequiresFreshDocument = false;
    }
    routePath(url) {
        try {
            const path = new URL(url, this.document.baseURI || "http://localhost/")
                .pathname;
            return (path || "/").slice(0, MAX_DIAGNOSTIC_ROUTE_LENGTH);
        }
        catch {
            return "/";
        }
    }
    sameOriginNavigationUrl(url, view) {
        try {
            const target = new URL(url, view.location.href);
            if (target.origin !== view.location.origin) {
                return undefined;
            }
            return `${target.pathname}${target.search}${target.hash}`;
        }
        catch {
            return undefined;
        }
    }
    browserView() {
        return this.browser ? this.document.defaultView : null;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNavigationRecoveryService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNavigationRecoveryService, providedIn: "root" });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxNavigationRecoveryService, decorators: [{
            type: Injectable,
            args: [{ providedIn: "root" }]
        }], ctorParameters: () => [] });
