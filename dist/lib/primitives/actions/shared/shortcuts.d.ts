/**
 * Shared keyboard-shortcut helpers for components that accept `shortcutParts`
 * (cx-button, cx-action-area, cx-menu). Parts are plain lowercase strings such
 * as `['shift', 'e']`; `mod` resolves to cmd on macOS and ctrl elsewhere.
 */
export declare function normalizeShortcutParts(parts: readonly string[] | undefined): readonly string[];
export declare function eventMatchesShortcut(parts: readonly string[], event: KeyboardEvent): boolean;
export declare function normalizeShortcutKey(value: string): string;
/** True when the event target is a text-entry surface that owns its keystrokes. */
export declare function isTypingTarget(target: EventTarget | null): boolean;
//# sourceMappingURL=shortcuts.d.ts.map