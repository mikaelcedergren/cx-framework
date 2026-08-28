/** Everyday color appearances versus purpose-driven modes; selectors group them visually. */
export type CxThemeGroup = 'appearance' | 'utility';
export declare const CX_THEMES: readonly [{
    readonly id: "light";
    readonly label: "Light";
    readonly icon: "light-mode";
    readonly group: "appearance";
}, {
    readonly id: "dark";
    readonly label: "Dark";
    readonly icon: "dark-mode";
    readonly group: "appearance";
}, {
    readonly id: "night";
    readonly label: "Night";
    readonly icon: "night-mode";
    readonly group: "appearance";
}, {
    readonly id: "aqua";
    readonly label: "Aqua";
    readonly icon: "aqua-mode";
    readonly group: "appearance";
}, {
    readonly id: "high-contrast";
    readonly label: "High contrast";
    readonly icon: "high-contrast-mode";
    readonly group: "utility";
}, {
    readonly id: "wireframe";
    readonly label: "Wireframe";
    readonly icon: "browser-window";
    readonly group: "utility";
}, {
    readonly id: "legacy";
    readonly label: "Legacy";
    readonly icon: "history";
    readonly group: "utility";
}];
/** True when the theme at this index starts a new visual group in a selector. */
export declare function cxThemeStartsGroup(index: number): boolean;
export type CxThemeDefinition = (typeof CX_THEMES)[number];
export type CxThemeMode = CxThemeDefinition['id'];
export declare const CX_THEME_LABELS: Readonly<Record<"light" | "dark" | "night" | "aqua" | "high-contrast" | "wireframe" | "legacy", "Light" | "Dark" | "Night" | "Aqua" | "High contrast" | "Wireframe" | "Legacy">>;
export declare const CX_THEME_ICONS: Readonly<Record<"light" | "dark" | "night" | "aqua" | "high-contrast" | "wireframe" | "legacy", "aqua-mode" | "browser-window" | "dark-mode" | "high-contrast-mode" | "history" | "light-mode" | "night-mode">>;
export declare function isCxThemeMode(value: unknown): value is CxThemeMode;
//# sourceMappingURL=theme.d.ts.map