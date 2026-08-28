import { EnvironmentProviders } from "@angular/core";
import { NavigationError } from "@angular/router";
import type { CxFeedbackAction } from "../../primitives/feedback/cx-feedback-action";
import type { CxBannerMood } from "../../primitives/feedback/cx-banner";
import * as i0 from "@angular/core";
export declare const CX_BUILD_ID_META_NAME = "cx-build-id";
export declare const CX_BUILD_INFO_ENDPOINT = "/cx-build.json";
export type CxNavigationRecoveryCategory = "dynamic-import" | "navigation" | "stale-build";
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
export declare const CX_NAVIGATION_RECOVERY_DEFAULT_COPY: Readonly<CxNavigationRecoveryCopy>;
/**
 * Configures the app-level navigation recovery pattern. The build identity
 * contract remains fixed across products; copy and diagnostics are app policy.
 */
export declare function provideCxNavigationRecovery(options?: CxNavigationRecoveryOptions): EnvironmentProviders;
export declare function isCxDynamicImportFailure(error: unknown): boolean;
/**
 * Routes Angular navigation failures into the configured recovery service.
 * Pass this directly to `withNavigationErrorHandler`.
 */
export declare function cxNavigationRecoveryHandler(error: NavigationError): void;
export declare class CxNavigationRecoveryService {
    private readonly router;
    private readonly destroyRef;
    private readonly document;
    private readonly platformId;
    private readonly config;
    private readonly browser;
    private readonly recoveryState;
    private failedUrl;
    private failureSequence;
    private retrying;
    private retryRequiresFreshDocument;
    readonly clientBuildId: string | undefined;
    readonly state: import("@angular/core").Signal<CxNavigationRecoveryState | undefined>;
    constructor();
    handle(error: NavigationError): void;
    dismiss(): void;
    performPrimaryAction(): void;
    performSecondaryAction(): void;
    private performAction;
    private checkForNewBuild;
    private showRecoverableFailure;
    private retry;
    private retryInFreshDocument;
    private finishRetry;
    private setPrimaryLoading;
    private reload;
    private currentServerBuildId;
    private reportFailure;
    private readClientBuildId;
    private hide;
    private routePath;
    private sameOriginNavigationUrl;
    private browserView;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxNavigationRecoveryService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<CxNavigationRecoveryService>;
}
//# sourceMappingURL=cx-navigation-recovery.service.d.ts.map