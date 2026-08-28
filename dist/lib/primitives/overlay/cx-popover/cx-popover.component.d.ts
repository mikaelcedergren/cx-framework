import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxPopoverSurfaceVariant = 'default' | 'raised' | 'grouped';
export declare class CxPopoverComponent {
    private readonly document;
    private readonly overlayState;
    private readonly openState;
    private readonly showBackdropState;
    private overlayHandle?;
    private portaledSurface;
    private portaledBackdrop;
    private surfaceRef?;
    private contentRef?;
    private backdropRef?;
    constructor();
    private releasePortaledNodes;
    private syncPortaledNode;
    set open(value: boolean);
    get open(): boolean;
    set showBackdrop(value: boolean);
    get showBackdrop(): boolean;
    /** The element that opened this popover. Registered with the overlay state so tooltips anchored to the opener stand down while it owns the surface. */
    set owner(value: HTMLElement | undefined);
    get owner(): HTMLElement | undefined;
    private ownerElement?;
    surfaceId: string | undefined;
    role: string | undefined;
    ariaLabel: string | undefined;
    heading: string | undefined;
    left: number | undefined;
    top: number | undefined;
    bottom: number | undefined;
    /** Exact surface width for fixed layouts (calendars, fixed menus). Otherwise the content decides. */
    width: number | undefined;
    /** Width floor — anchored surfaces pass the trigger width so the popover never reads narrower than it. */
    minWidth: number | undefined;
    /** Raises or lowers the compact content cap. Always viewport-clamped. */
    maxWidth: number | undefined;
    maxHeight: number | undefined;
    /** Which side of its anchor the surface sits on — drives the entry animation's origin. */
    placement: 'top' | 'right' | 'bottom' | 'left' | undefined;
    surfaceVariant: CxPopoverSurfaceVariant;
    readonly backdropPressed: EventEmitter<void>;
    surfaceElement(): HTMLElement | undefined;
    protected get resolvedMaxHeight(): string;
    protected get resolvedMaxWidth(): string | null;
    protected get normalizedTitle(): string | undefined;
    private captureOverlayOwnership;
    private releaseOverlayOwnership;
    private prepareFocusRestoration;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxPopoverComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxPopoverComponent, "cx-popover", never, { "open": { "alias": "open"; "required": false; }; "showBackdrop": { "alias": "showBackdrop"; "required": false; }; "owner": { "alias": "owner"; "required": false; }; "surfaceId": { "alias": "surfaceId"; "required": false; }; "role": { "alias": "role"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "heading": { "alias": "heading"; "required": false; }; "left": { "alias": "left"; "required": false; }; "top": { "alias": "top"; "required": false; }; "bottom": { "alias": "bottom"; "required": false; }; "width": { "alias": "width"; "required": false; }; "minWidth": { "alias": "minWidth"; "required": false; }; "maxWidth": { "alias": "maxWidth"; "required": false; }; "maxHeight": { "alias": "maxHeight"; "required": false; }; "placement": { "alias": "placement"; "required": false; }; "surfaceVariant": { "alias": "surfaceVariant"; "required": false; }; }, { "backdropPressed": "backdropPressed"; }, never, ["*", "[actions]"], true, never>;
}
//# sourceMappingURL=cx-popover.component.d.ts.map