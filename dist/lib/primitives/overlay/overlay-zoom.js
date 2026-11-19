/** CSS zoom compounds through layout, including nested zoomed regions. */
export function overlayZoom(element) {
    let zoom = 1;
    for (let current = element; current; current = current.parentElement) {
        const value = getComputedStyle(current).zoom;
        zoom *= value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value) || 1;
    }
    return zoom;
}
/** Observe only the open overlay's ancestry; closing releases every observer. */
export function observeOverlayZoom(element, changed) {
    let previous = overlayZoom(element);
    let previousBody = overlayZoom(element.ownerDocument.body);
    const check = () => {
        const next = overlayZoom(element);
        const body = overlayZoom(element.ownerDocument.body);
        if (next !== previous || body !== previousBody) {
            previous = next;
            previousBody = body;
            changed();
        }
    };
    const observer = new MutationObserver(check);
    for (let current = element; current; current = current.parentElement) {
        observer.observe(current, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    }
    window.addEventListener('resize', check);
    return () => {
        observer.disconnect();
        window.removeEventListener('resize', check);
    };
}
