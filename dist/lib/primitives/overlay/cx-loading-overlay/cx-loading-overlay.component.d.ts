import { EventEmitter, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
interface CxLoadingOverlayStatusEntry {
    /** Increments on every displayed change so `@for` replaces the node and replays the enter animation. */
    key: number;
    text: string;
}
/**
 * A modal wait: a scrim, a compact surface, a spinner, and the live status of
 * the work underneath it.
 *
 * `status` is the current stage only — the component never owns a plan, an
 * index, or a timer that advances on its own, so the label can only ever say
 * what the host actually knows.
 *
 * It deliberately cannot be dismissed. There is no close control, Escape is
 * swallowed rather than passed down, and the backdrop ignores clicks — the
 * dialog closes only when the host sets `open` to false, which should be when
 * the work actually finishes.
 */
export declare class CxLoadingOverlayComponent implements OnDestroy {
    private readonly overlayState;
    private readonly openState;
    private overlayHandle?;
    private readonly overlayBackdrop?;
    private readonly displayedState;
    private readonly revisionState;
    /** The most recent value the host set, which may not be on screen yet. */
    private latest;
    /** A status waiting out the current dwell. Only the newest one survives. */
    private queued;
    private dwellTimer;
    private displayedAt;
    protected readonly isOpen$: import("@angular/core").Signal<boolean>;
    protected readonly displayed$: import("@angular/core").Signal<string>;
    constructor();
    /** Whether the wait is showing. Two-way bindable; the host closes it when the work finishes. */
    set open(value: boolean);
    get open(): boolean;
    /**
     * What the work is doing right now. Empty shows the spinner alone.
     *
     * Set it again whenever the work moves on; the overlay holds each value on
     * screen long enough to read before accepting the next.
     */
    set status(value: string | undefined);
    get status(): string;
    /**
     * Accessible name for the overlay. Kept stable on purpose — naming it from the
     * changing status would rename the overlay on every stage.
     */
    ariaLabel: string;
    readonly openChange: EventEmitter<boolean>;
    ngOnDestroy(): void;
    protected get resolvedAriaLabel(): string;
    protected readonly hasStatus$: import("@angular/core").Signal<boolean>;
    protected readonly entries$: import("@angular/core").Signal<CxLoadingOverlayStatusEntry[]>;
    /**
     * The wait holds no controls, so there is nowhere for Tab to go. Swallowing it
     * keeps focus on the surface instead of letting it reach the page behind,
     * which the user is not allowed to touch while the work runs.
     */
    protected onKeydown(event: KeyboardEvent): void;
    /**
     * Pressing the scrim would otherwise blur the surface onto the document body,
     * which then lets the next Tab walk into the page behind the wait. Cancelling
     * the default on the scrim itself keeps focus where the trap put it, while
     * anything inside the surface still behaves normally.
     */
    protected onBackdropMousedown(event: MouseEvent): void;
    private syncOpen;
    private releaseOverlay;
    private accept;
    private flush;
    private display;
    private clearDwellTimer;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxLoadingOverlayComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxLoadingOverlayComponent, "cx-loading-overlay", never, { "open": { "alias": "open"; "required": false; }; "status": { "alias": "status"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, { "openChange": "openChange"; }, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-loading-overlay.component.d.ts.map