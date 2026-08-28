/**
 * Whether a component host is actually part of the visible UI — connected to
 * the document and not inside a `display: none` / `visibility: hidden`
 * subtree.
 *
 * Components whose surface renders entirely inside their host must gate
 * document-level listeners (escape, outside-click, global shortcuts) on this:
 * a CSS-hidden instance (hidden tab, hidden workbench, collapsed step) is not
 * part of the UI and must not react to page-wide events. A component that
 * portals an open surface to `<body>` must additionally observe its owning
 * host and close if that host becomes hidden.
 */
export declare function isHostVisible(host: Element | null | undefined): boolean;
/**
 * Watches only while a component owns a portaled surface. Resize covers
 * display/layout changes; ancestor attribute observation also catches
 * visibility changes that preserve the host's box.
 */
export declare class CxHostVisibilityObserver {
    private readonly host;
    private readonly onChange;
    private observing;
    private wasConnected;
    private resizeObserver?;
    private mutationObserver?;
    constructor(host: Element, onChange: (visible: boolean) => void);
    start(): void;
    stop(): void;
    check(): boolean;
}
//# sourceMappingURL=host-visibility.d.ts.map