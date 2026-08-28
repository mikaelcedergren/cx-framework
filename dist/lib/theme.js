export const CX_THEMES = [
    { id: 'light', label: 'Light', icon: 'light-mode', group: 'appearance' },
    { id: 'dark', label: 'Dark', icon: 'dark-mode', group: 'appearance' },
    { id: 'night', label: 'Night', icon: 'night-mode', group: 'appearance' },
    { id: 'aqua', label: 'Aqua', icon: 'aqua-mode', group: 'appearance' },
    { id: 'high-contrast', label: 'High contrast', icon: 'high-contrast-mode', group: 'utility' },
    { id: 'wireframe', label: 'Wireframe', icon: 'browser-window', group: 'utility' },
    { id: 'legacy', label: 'Legacy', icon: 'history', group: 'utility' },
];
/** True when the theme at this index starts a new visual group in a selector. */
export function cxThemeStartsGroup(index) {
    const theme = CX_THEMES[index];
    const previous = CX_THEMES[index - 1];
    return !!theme && !!previous && previous.group !== theme.group;
}
function themeRecord(select) {
    return Object.fromEntries(CX_THEMES.map(theme => [theme.id, select(theme)]));
}
export const CX_THEME_LABELS = themeRecord(theme => theme.label);
export const CX_THEME_ICONS = themeRecord(theme => theme.icon);
const CX_THEME_MODE_SET = new Set(CX_THEMES.map(theme => theme.id));
export function isCxThemeMode(value) {
    return typeof value === 'string' && CX_THEME_MODE_SET.has(value);
}
