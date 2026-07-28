import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import {
  DestroyRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, NavigationError, Router } from "@angular/router";
import { filter } from "rxjs";
import type { CxFeedbackAction } from "../../primitives/feedback/cx-feedback-action";
import type { CxBannerMood } from "../../primitives/feedback/cx-banner";

export const CX_BUILD_ID_META_NAME = "cx-build-id";
export const CX_BUILD_INFO_ENDPOINT = "/cx-build.json";

const BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;
const BUILD_ID_PLACEHOLDER = "__CX_BUILD_ID__";
const BUILD_REQUEST_TIMEOUT_MS = 2_000;
const MAX_DIAGNOSTIC_ENDPOINT_LENGTH = 256;
const MAX_DIAGNOSTIC_ROUTE_LENGTH = 256;
const DYNAMIC_IMPORT_ERROR_PATTERN =
  /chunkloaderror|dynamically imported module|module script|loading chunk|failed to fetch.*module|importing a module|unexpected token ['"]?<['"]?|mime type/i;

export type CxNavigationRecoveryCategory =
  | "dynamic-import"
  | "navigation"
  | "stale-build";
export type CxNavigationRecoveryActionKind = "retry" | "reload";

export interface CxNavigationRecoveryAction extends CxFeedbackAction {
  readonly kind: CxNavigationRecoveryActionKind;
}

export interface CxNavigationRecoveryState {
  readonly category: CxNavigationRecoveryCategory;
  readonly mood: CxBannerMood;
  readonly heading: string;
  readonly description: string;
  readonly primaryAction: CxNavigationRecoveryAction;
  readonly secondaryAction?: CxNavigationRecoveryAction;
  readonly dismissAriaLabel: string;
}

export interface CxNavigationRecoveryCopy {
  readonly failureHeading: string;
  readonly dynamicImportFailureDescription: string;
  readonly navigationFailureDescription: string;
  readonly staleBuildHeading: string;
  readonly staleBuildDescription: string;
  readonly retryActionLabel: string;
  readonly reloadActionLabel: string;
  readonly dismissActionAriaLabel: string;
}

export interface CxNavigationRecoveryOptions {
  /**
   * Optional same-origin route that receives bounded, content-free failure
   * metadata. Queries, fragments, error messages, and form state are never sent.
   */
  readonly diagnosticsEndpoint?: string;
  /** Override every visible string needed to localize the recovery pattern. */
  readonly copy?: Partial<CxNavigationRecoveryCopy>;
}

interface CxNavigationRecoveryConfig {
  readonly diagnosticsEndpoint?: string;
  readonly copy: CxNavigationRecoveryCopy;
}

interface CxBuildInfo {
  readonly buildId?: unknown;
}

export const CX_NAVIGATION_RECOVERY_DEFAULT_COPY: Readonly<CxNavigationRecoveryCopy> =
  Object.freeze({
    failureHeading: "Page could not open",
    dynamicImportFailureDescription:
      "A required app file could not be loaded. Check your connection, then try again.",
    navigationFailureDescription:
      "Navigation failed. Try opening the page again, or reload if the problem continues.",
    staleBuildHeading: "The app has been updated",
    staleBuildDescription:
      "This page cannot open with the version in this tab. Save any unsaved work, then reload.",
    retryActionLabel: "Retry",
    reloadActionLabel: "Reload",
    dismissActionAriaLabel: "Dismiss navigation recovery",
  });

function resolveDiagnosticsEndpoint(
  value: string | undefined,
): string | undefined {
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
  } catch {
    isSameOriginRoute = false;
  }
  const isBoundedRoute =
    endpoint.length > 0 &&
    endpoint.length <= MAX_DIAGNOSTIC_ENDPOINT_LENGTH &&
    /^\/(?!\/)[^\s?#\\]*$/.test(endpoint) &&
    isSameOriginRoute;
  if (!isBoundedRoute) {
    throw new Error(
      "[cx-navigation-recovery] diagnosticsEndpoint must be a same-origin route without a query or fragment.",
    );
  }
  return endpoint;
}

function resolveConfig(
  options: CxNavigationRecoveryOptions = {},
): CxNavigationRecoveryConfig {
  return {
    diagnosticsEndpoint: resolveDiagnosticsEndpoint(
      options.diagnosticsEndpoint,
    ),
    copy: {
      ...CX_NAVIGATION_RECOVERY_DEFAULT_COPY,
      ...(options.copy ?? {}),
    },
  };
}

const CX_NAVIGATION_RECOVERY_CONFIG =
  new InjectionToken<CxNavigationRecoveryConfig>(
    "CX_NAVIGATION_RECOVERY_CONFIG",
    {
      providedIn: "root",
      factory: () => resolveConfig(),
    },
  );

/**
 * Configures the app-level navigation recovery pattern. The build identity
 * contract remains fixed across products; copy and diagnostics are app policy.
 */
export function provideCxNavigationRecovery(
  options: CxNavigationRecoveryOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CX_NAVIGATION_RECOVERY_CONFIG,
      useValue: resolveConfig(options),
    },
  ]);
}

function validBuildId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const buildId = value.trim();
  return buildId !== BUILD_ID_PLACEHOLDER && BUILD_ID_PATTERN.test(buildId)
    ? buildId
    : undefined;
}

function errorText(error: unknown, depth = 0): string {
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
    const value = error as {
      readonly name?: unknown;
      readonly message?: unknown;
      readonly cause?: unknown;
    };
    return `${String(value.name ?? "")}: ${String(value.message ?? "")} ${errorText(
      value.cause,
      depth + 1,
    )}`;
  }
  return String(error ?? "");
}

export function isCxDynamicImportFailure(error: unknown): boolean {
  return DYNAMIC_IMPORT_ERROR_PATTERN.test(errorText(error));
}

/**
 * Routes Angular navigation failures into the configured recovery service.
 * Pass this directly to `withNavigationErrorHandler`.
 */
export function cxNavigationRecoveryHandler(error: NavigationError): void {
  inject(CxNavigationRecoveryService).handle(error);
}

@Injectable({ providedIn: "root" })
export class CxNavigationRecoveryService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(CX_NAVIGATION_RECOVERY_CONFIG);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly recoveryState = signal<
    CxNavigationRecoveryState | undefined
  >(undefined);
  private failedUrl: string | undefined;
  private failureSequence = 0;
  private retrying = false;
  private retryRequiresFreshDocument = false;

  readonly clientBuildId = this.readClientBuildId();
  readonly state = this.recoveryState.asReadonly();

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.hide());
  }

  handle(error: NavigationError): void {
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
    } else {
      this.reportFailure("navigation", route, occurredAt);
    }
  }

  dismiss(): void {
    this.hide();
  }

  performPrimaryAction(): void {
    this.performAction(this.recoveryState()?.primaryAction.kind);
  }

  performSecondaryAction(): void {
    this.performAction(this.recoveryState()?.secondaryAction?.kind);
  }

  private performAction(
    action: CxNavigationRecoveryActionKind | undefined,
  ): void {
    if (action === "retry") {
      void this.retry();
    } else if (action === "reload") {
      this.reload();
    }
  }

  private async checkForNewBuild(
    sequence: number,
    route: string,
    occurredAt: string,
  ): Promise<void> {
    const serverBuildId = await this.currentServerBuildId();
    // Once the server has a valid identity, an unknown client identity is not
    // evidence of compatibility. Conservatively require a fresh document.
    const staleBuild =
      serverBuildId !== undefined && this.clientBuildId !== serverBuildId;

    if (sequence !== this.failureSequence) {
      return;
    }

    this.reportFailure(
      staleBuild ? "stale-build" : "dynamic-import",
      route,
      occurredAt,
      serverBuildId,
    );

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

  private showRecoverableFailure(dynamicImportFailure: boolean): void {
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

  private async retry(): Promise<void> {
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
    } catch {
      // The router's configured navigation error handler owns the next state.
    } finally {
      this.finishRetry(sequence);
    }
  }

  private retryInFreshDocument(failedUrl: string, sequence: number): void {
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
    } catch {
      this.finishRetry(sequence);
    }
  }

  private finishRetry(sequence: number): void {
    if (sequence !== this.failureSequence) {
      return;
    }
    this.retrying = false;
    this.setPrimaryLoading(false);
  }

  private setPrimaryLoading(loading: boolean): void {
    this.recoveryState.update((state) =>
      state
        ? {
            ...state,
            primaryAction: { ...state.primaryAction, loading },
          }
        : state,
    );
  }

  private reload(): void {
    // Reload is never automatic. Browser beforeunload protection remains in
    // control of unsaved work when the user explicitly chooses this action.
    this.browserView()?.location.reload();
  }

  private async currentServerBuildId(): Promise<string | undefined> {
    const view = this.browserView();
    if (!view || typeof view.fetch !== "function") {
      return undefined;
    }

    const controller =
      typeof AbortController === "undefined"
        ? undefined
        : new AbortController();
    const timeoutId = view.setTimeout(
      () => controller?.abort(),
      BUILD_REQUEST_TIMEOUT_MS,
    );
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
      const body = (await response.json()) as CxBuildInfo;
      return validBuildId(body?.buildId);
    } catch {
      return undefined;
    } finally {
      view.clearTimeout(timeoutId);
    }
  }

  private reportFailure(
    category: CxNavigationRecoveryCategory,
    route: string,
    occurredAt: string,
    serverBuildId?: string,
  ): void {
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
      if (
        typeof view.navigator.sendBeacon === "function" &&
        view.navigator.sendBeacon(
          endpoint,
          new Blob([body], { type: "application/json" }),
        )
      ) {
        return;
      }
    } catch {
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

  private readClientBuildId(): string | undefined {
    if (!this.browser) {
      return undefined;
    }
    return validBuildId(
      this.document
        .querySelector<HTMLMetaElement>(`meta[name="${CX_BUILD_ID_META_NAME}"]`)
        ?.content.trim(),
    );
  }

  private hide(): void {
    this.failureSequence += 1;
    this.recoveryState.set(undefined);
    this.failedUrl = undefined;
    this.retrying = false;
    this.retryRequiresFreshDocument = false;
  }

  private routePath(url: string): string {
    try {
      const path = new URL(url, this.document.baseURI || "http://localhost/")
        .pathname;
      return (path || "/").slice(0, MAX_DIAGNOSTIC_ROUTE_LENGTH);
    } catch {
      return "/";
    }
  }

  private sameOriginNavigationUrl(
    url: string,
    view: Window,
  ): string | undefined {
    try {
      const target = new URL(url, view.location.href);
      if (target.origin !== view.location.origin) {
        return undefined;
      }
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return undefined;
    }
  }

  private browserView(): Window | null {
    return this.browser ? this.document.defaultView : null;
  }
}
