/** CSS zoom compounds through layout, including nested zoomed regions. */
export declare function overlayZoom(element: HTMLElement): number;
/** Observe only the open overlay's ancestry; closing releases every observer. */
export declare function observeOverlayZoom(element: HTMLElement, changed: () => void): () => void;
//# sourceMappingURL=overlay-zoom.d.ts.map