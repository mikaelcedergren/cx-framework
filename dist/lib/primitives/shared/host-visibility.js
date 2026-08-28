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
export function isHostVisible(host) {
    if (!host || !host.isConnected) {
        return false;
    }
    if (typeof host.checkVisibility === 'function') {
        return host.checkVisibility({ visibilityProperty: true });
    }
    // Fallback: a display:none subtree produces no client rects. Unlike
    // offsetParent, this also works for position: fixed hosts.
    return host.getClientRects().length > 0;
}
/**
 * Watches only while a component owns a portaled surface. Resize covers
 * display/layout changes; ancestor attribute observation also catches
 * visibility changes that preserve the host's box.
 */
export class CxHostVisibilityObserver {
    host;
    onChange;
    observing = false;
    wasConnected = false;
    resizeObserver;
    mutationObserver;
    constructor(host, onChange) {
        this.host = host;
        this.onChange = onChange;
    }
    start() {
        if (this.observing) {
            this.check();
            return;
        }
        this.observing = true;
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.check());
            this.resizeObserver.observe(this.host);
        }
        if (typeof MutationObserver !== 'undefined') {
            this.mutationObserver = new MutationObserver(() => this.check());
            let ancestor = this.host;
            while (ancestor) {
                this.mutationObserver.observe(ancestor, {
                    attributes: true,
                    attributeFilter: ['class', 'hidden', 'style'],
                });
                ancestor = ancestor.parentElement;
            }
        }
        this.check();
    }
    stop() {
        this.observing = false;
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.mutationObserver?.disconnect();
        this.mutationObserver = undefined;
    }
    check() {
        if (this.host.isConnected) {
            this.wasConnected = true;
        }
        const visible = this.host.isConnected ? isHostVisible(this.host) : !this.wasConnected;
        if (this.observing) {
            this.onChange(visible);
        }
        return visible;
    }
}
