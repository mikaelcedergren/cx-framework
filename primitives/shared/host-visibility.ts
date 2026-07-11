/**
 * Whether a component host is actually part of the visible UI — connected to
 * the document and not inside a `display: none` / `visibility: hidden`
 * subtree.
 *
 * Components whose surface renders entirely inside their host must gate
 * document-level listeners (escape, outside-click, global shortcuts) on this:
 * a CSS-hidden instance (hidden tab, hidden workbench, collapsed step) is not
 * part of the UI and must not react to page-wide events. Components that
 * portal their surface to `<body>` should keep gating on their own open state
 * instead — their surface can be visible while the host is hidden.
 */
export function isHostVisible(host: Element | null | undefined): boolean {
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
