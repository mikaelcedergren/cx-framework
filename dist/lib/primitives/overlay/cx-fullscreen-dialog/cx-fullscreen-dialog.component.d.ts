import { EventEmitter, OnDestroy } from '@angular/core';
import { CxDismissRequest } from '../dismiss-request';
import * as i0 from "@angular/core";
export declare class CxFullscreenDialogComponent implements OnDestroy {
    private static readonly motionDurationMs;
    private static readonly closeButtonRevealMs;
    private readonly overlayState;
    private readonly renderedState;
    private readonly closingState;
    private readonly closeButtonReadyState;
    private requestedOpen;
    private closeButtonRevealed;
    private closeButtonValue;
    private overlayHandle?;
    private closeButtonRevealTimer?;
    private exitFallbackTimer?;
    private dialogRootRef?;
    private dialogContentRef?;
    ariaLabel: string;
    set closeButton(value: boolean);
    get closeButton(): boolean;
    set open(value: boolean);
    readonly openChange: EventEmitter<boolean>;
    /** Synchronous request emitted before a user dismissal would close this dialog. */
    readonly dismissRequest: EventEmitter<CxDismissRequest>;
    readonly dismiss: EventEmitter<void>;
    protected readonly isRendered$: import("@angular/core").Signal<boolean>;
    protected readonly isClosing$: import("@angular/core").Signal<boolean>;
    protected readonly isCloseButtonReady$: import("@angular/core").Signal<boolean>;
    ngOnDestroy(): void;
    protected resolvedAriaLabel(): string;
    protected onDismiss(): void;
    protected onCanvasAnimationEnd(event: AnimationEvent): void;
    protected dialogTabIndex(): number;
    private closeFromUser;
    private syncOpen;
    private revealCloseButton;
    private finishClose;
    private prefersReducedMotion;
    private scheduleCloseButtonReveal;
    private scheduleExitFallback;
    private clearMotionTimers;
    private clearCloseButtonReveal;
    private clearExitFallback;
    private releaseOverlay;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxFullscreenDialogComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxFullscreenDialogComponent, "cx-fullscreen-dialog", never, { "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "closeButton": { "alias": "closeButton"; "required": false; }; "open": { "alias": "open"; "required": false; }; }, { "openChange": "openChange"; "dismissRequest": "dismissRequest"; "dismiss": "dismiss"; }, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-fullscreen-dialog.component.d.ts.map