export function measureCxFloatingSurface(input) {
    const viewportPadding = input.viewportPadding ?? 8;
    const gap = input.gap ?? 8;
    const maxViewportWidth = Math.max(input.viewportWidth - viewportPadding * 2, 0);
    const minWidth = Math.max(0, Math.min(input.minWidth ?? 0, maxViewportWidth));
    const width = Math.floor(clamp(input.width, minWidth, maxViewportWidth));
    const spaceBelow = input.viewportHeight - input.triggerRect.bottom - viewportPadding - gap;
    const spaceAbove = input.triggerRect.top - viewportPadding - gap;
    const placement = input.lockedPlacement ??
        (spaceBelow < input.estimatedHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
    const maxHeight = Math.max(placement === 'top' ? spaceAbove : spaceBelow, 0);
    const align = input.align ?? 'start';
    const leftBase = align === 'end' ? input.triggerRect.right - width : input.triggerRect.left;
    const left = Math.floor(clamp(leftBase, viewportPadding, input.viewportWidth - width - viewportPadding));
    return {
        width,
        left,
        top: placement === 'bottom' ? input.triggerRect.bottom + gap : undefined,
        bottom: placement === 'top' ? Math.max(input.viewportHeight - input.triggerRect.top + gap, viewportPadding) : undefined,
        maxHeight,
        placement,
    };
}
function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}
