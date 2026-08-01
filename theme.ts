import { type CxIconName } from './icons/manifest';

/** Everyday color appearances versus purpose-driven modes; selectors group them visually. */
export type CxThemeGroup = 'appearance' | 'utility';

export const CX_THEMES = [
  { id: 'light', label: 'Light', icon: 'light-mode', group: 'appearance' },
  { id: 'dark', label: 'Dark', icon: 'dark-mode', group: 'appearance' },
  { id: 'night', label: 'Night', icon: 'night-mode', group: 'appearance' },
  { id: 'high-contrast', label: 'High contrast', icon: 'high-contrast-mode', group: 'utility' },
  { id: 'wireframe', label: 'Wireframe', icon: 'browser-window', group: 'utility' },
  { id: 'legacy', label: 'Legacy', icon: 'history', group: 'utility' },
] as const satisfies readonly { id: string; label: string; icon: CxIconName; group: CxThemeGroup }[];

/** True when the theme at this index starts a new visual group in a selector. */
export function cxThemeStartsGroup(index: number): boolean {
  const theme = CX_THEMES[index];
  const previous = CX_THEMES[index - 1];
  return !!theme && !!previous && previous.group !== theme.group;
}

export type CxThemeDefinition = (typeof CX_THEMES)[number];
export type CxThemeMode = CxThemeDefinition['id'];

function themeRecord<T>(select: (theme: CxThemeDefinition) => T): Readonly<Record<CxThemeMode, T>> {
  return Object.fromEntries(CX_THEMES.map(theme => [theme.id, select(theme)])) as Record<CxThemeMode, T>;
}

export const CX_THEME_LABELS = themeRecord(theme => theme.label);
export const CX_THEME_ICONS = themeRecord(theme => theme.icon);

const CX_THEME_MODE_SET: ReadonlySet<string> = new Set(CX_THEMES.map(theme => theme.id));

export function isCxThemeMode(value: unknown): value is CxThemeMode {
  return typeof value === 'string' && CX_THEME_MODE_SET.has(value);
}
