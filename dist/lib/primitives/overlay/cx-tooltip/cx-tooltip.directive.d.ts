import { AfterViewInit, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export type CxTooltipDelay = 'default' | 'none';
export type CxTooltipPosition = 'top' | 'right' | 'bottom' | 'left';
/**
 * Framework tooltip trigger. Attach it directly to the one element being
 * described; `cx-tooltip` remains available when composition needs a wrapper.
 */
export declare class CxTooltipDirective implements AfterViewInit, OnDestroy {
    readonly cxTooltip: import("@angular/core").InputSignal<string | undefined>;
    readonly cxTooltipPosition: import("@angular/core").InputSignal<CxTooltipPosition>;
    readonly cxTooltipDelay: import("@angular/core").InputSignal<CxTooltipDelay>;
    readonly cxTooltipDisabled: import("@angular/core").InputSignalWithTransform<boolean, unknown>;
    readonly cxTooltipOverflow: import("@angular/core").InputSignalWithTransform<boolean, unknown>;
    private readonly host;
    private readonly overlay;
    private readonly viewContainerRef;
    private readonly overflowObserver;
    private readonly interactionCoordinator;
    private readonly overlayState;
    private readonly browser;
    private readonly viewReady;
    private readonly tooltipId;
    private triggerHovered;
    private triggerFocused;
    private surfaceHovered;
    private dismissed;
    private open;
    private openTimer?;
    private closeTimer?;
    private overflowTargets;
    private clippedOverflowTargets;
    private hoveredOverflowTarget?;
    private stopOverflowObservations;
    private readonly overflowMeasurementCallback;
    private stopEscapeHandling?;
    private readonly escapeCallback;
    private stopPointerHandling?;
    private readonly pointerRegistration;
    private descriptionTarget?;
    private stopDescriptionObservation?;
    private readonly descriptionMutationCallback;
    private overlayRef?;
    private positionStrategy?;
    private surfaceRef?;
    private positionSubscription?;
    constructor();
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    protected onTriggerMouseEnter(): void;
    protected onTriggerMouseOver(event: MouseEvent): void;
    protected onTriggerMouseLeave(): void;
    protected onTriggerFocusIn(event: FocusEvent): void;
    protected onTriggerFocusOut(event: FocusEvent): void;
    private isKeyboardFocus;
    private onEscapeKey;
    private onDocumentPointerMove;
    private onDocumentPointerDown;
    private requestOpen;
    private openNow;
    private ensureOverlay;
    private syncOpenSurface;
    /**
     * Pointer-inert tooltips still have to remain available while the pointer
     * crosses the placement gap or rests over the visible surface. The bridge is
     * only the narrow axis-aligned space between origin and surface, not a broad
     * invisible hover layer that could pin the tooltip over unrelated content.
     */
    private pointerWithinTooltip;
    private scheduleClose;
    private scheduleOverflowTargetClose;
    private closeNow;
    private canOpen;
    private clearDismissalWhenIdle;
    private configureOverflow;
    private syncOverflowMeasurement;
    private resolveOverflowTargets;
    private resolveHoveredOverflowTarget;
    private overflowAllowsOpen;
    private tooltipOrigin;
    private effectiveMessageText;
    private overflowTargetText;
    private clearOverflowObservations;
    private sameTargets;
    private isClipped;
    /**
     * How much block overflow to forgive before calling the text clipped.
     *
     * A line box only as tall as the font size — `line-height: 1` — is shorter
     * than the glyphs the face actually draws, so a single fully visible line
     * reports a couple of pixels of block overflow on its own. That is the font's
     * own leading, not hidden text. Real block clipping hides at least part of a
     * line, so half a line is the honest place to draw the boundary.
     */
    private blockTolerance;
    private resolveDescriptionTarget;
    private setDescriptionTarget;
    private mergeDescription;
    private removeDescription;
    private descriptionTokens;
    private positions;
    private resolvePlacement;
    private clearOpenTimer;
    private clearCloseTimer;
    private startInteractionHandling;
    private stopInteractionHandlingIfIdle;
    private releaseOverlay;
    private messageText;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTooltipDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CxTooltipDirective, "[cxTooltip]", never, { "cxTooltip": { "alias": "cxTooltip"; "required": false; "isSignal": true; }; "cxTooltipPosition": { "alias": "cxTooltipPosition"; "required": false; "isSignal": true; }; "cxTooltipDelay": { "alias": "cxTooltipDelay"; "required": false; "isSignal": true; }; "cxTooltipDisabled": { "alias": "cxTooltipDisabled"; "required": false; "isSignal": true; }; "cxTooltipOverflow": { "alias": "cxTooltipOverflow"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-tooltip.directive.d.ts.map