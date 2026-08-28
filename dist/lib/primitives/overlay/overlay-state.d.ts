import * as i0 from "@angular/core";
export type CxOverlayStateKind = 'modal' | 'transient';
export type CxOverlayStateCaptureOptions = {
    kind?: CxOverlayStateKind;
    /**
     * Whether release restores focus. Defaults to true for modal captures and
     * false for transient captures. Restoration settles after child teardown and
     * parent focus maintenance; a newer top overlay takes precedence.
     */
    restoreFocus?: boolean;
    /** The element that opened the overlay, so descriptions anchored to it (tooltips) can stand down while it owns an open surface. */
    owner?: HTMLElement;
    /**
     * The rendered overlay root. It keeps visual stack order aligned with this
     * capture and identifies the owning surface for deterministic focus fallback.
     */
    surface?: () => HTMLElement | undefined;
    /**
     * Every independently positioned root that paints this overlay, ordered from
     * back to front. Use this when a surface and its backdrop are DOM siblings.
     */
    layerSurfaces?: () => readonly HTMLElement[];
    /** Whether this capture currently participates in topmost overlay ownership. Hidden and inactive surfaces return false. */
    isActive?: () => boolean;
    /** Runs after the coordinator consumes Escape for this topmost active overlay. Omit to consume Escape without invoking a callback. */
    onEscape?: (event: KeyboardEvent) => void;
};
export type CxOverlayStateHandle = {
    id: number;
    kind: CxOverlayStateKind;
    focusedElement?: HTMLElement;
    restoreFocus: boolean;
    owner?: HTMLElement;
    surface?: () => HTMLElement | undefined;
    layerSurfaces?: () => readonly HTMLElement[];
    isActive: () => boolean;
    onEscape?: (event: KeyboardEvent) => void;
    released: boolean;
};
export declare class CxOverlayStateService {
    private static readonly activationTargetMaxAgeMs;
    private readonly document;
    private readonly injector;
    private readonly interactivityChecker;
    private readonly stack;
    private readonly focusAncestry;
    private readonly stackVersion;
    private nextId;
    private modalDepth;
    private previousBodyOverflow;
    private activationTarget?;
    private readonly managedLayerElements;
    private readonly originalLayerStyles;
    private readonly clickListener;
    private readonly keydownListener;
    constructor();
    capture(options?: CxOverlayStateCaptureOptions): CxOverlayStateHandle;
    /** Attach or correct a capture's owner after the fact; input order between `open` and `owner` bindings is not guaranteed. */
    assignOwner(handle: CxOverlayStateHandle | undefined, owner: HTMLElement | undefined): void;
    /**
     * True while an active overlay was opened by this element, by an element
     * inside it, or by an element it sits inside. Descriptions anchored to the
     * opener (tooltips) must stand down for as long as this holds.
     */
    ownsOpenOverlay(element: HTMLElement): boolean;
    /** Release a capture and restore its valid invoker, or owning-parent fallback, after teardown settles. */
    release(handle: CxOverlayStateHandle | undefined): void;
    isTopmost(handle: CxOverlayStateHandle | undefined): boolean;
    private onDocumentKeydown;
    private onDocumentClick;
    private recentActivationTarget;
    private captureFocusAncestry;
    private restoreFocusAfterRender;
    private isFocusParent;
    private resolveFallbackTarget;
    private resolveSurfaceFocusTarget;
    private visibleModalFocusTarget;
    private syncSurfaceLayers;
    private layerSurfacesFor;
    private restoreManagedLayerElements;
    private restoreManagedLayerElement;
    private surfaceFor;
    private tryFocus;
    private topmostActiveHandle;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxOverlayStateService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<CxOverlayStateService>;
}
//# sourceMappingURL=overlay-state.d.ts.map