/**
 * Shared keyboard-shortcut helpers for components that accept `shortcutParts`
 * (cx-button, cx-action-area, cx-menu). Parts are plain lowercase strings such
 * as `['shift', 'e']`; `mod` resolves to cmd on macOS and ctrl elsewhere.
 */

const MODIFIER_PARTS = ['mod', 'cmd', 'command', 'ctrl', 'control', 'alt', 'option', 'opt', 'shift'];

export function normalizeShortcutParts(parts: readonly string[] | undefined): readonly string[] {
  if (!Array.isArray(parts)) {
    return [];
  }
  return parts
    .filter(part => typeof part === 'string')
    .map(part => part.trim())
    .filter(Boolean);
}

export function eventMatchesShortcut(parts: readonly string[], event: KeyboardEvent): boolean {
  const normalizedParts = parts.map(part => part.trim().toLowerCase()).filter(Boolean);
  if (normalizedParts.length === 0) {
    return false;
  }
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const wantsCtrl =
    normalizedParts.includes('ctrl') ||
    normalizedParts.includes('control') ||
    (!isMac && normalizedParts.includes('mod'));
  const wantsMeta =
    normalizedParts.includes('cmd') ||
    normalizedParts.includes('command') ||
    (isMac && normalizedParts.includes('mod'));
  const wantsAlt =
    normalizedParts.includes('alt') ||
    normalizedParts.includes('option') ||
    normalizedParts.includes('opt');
  const wantsShift = normalizedParts.includes('shift');
  if (
    event.ctrlKey !== wantsCtrl ||
    event.metaKey !== wantsMeta ||
    event.altKey !== wantsAlt ||
    event.shiftKey !== wantsShift
  ) {
    return false;
  }
  const keyPart = normalizedParts.find(part => !MODIFIER_PARTS.includes(part));
  return keyPart ? normalizeShortcutKey(event.key) === normalizeShortcutKey(keyPart) : false;
}

export function normalizeShortcutKey(value: string): string {
  const key = value.trim().toLowerCase();
  if (key === 'esc') return 'escape';
  if (key === 'return') return 'enter';
  if (key === 'space') return ' ';
  return key;
}

/** True when the event target is a text-entry surface that owns its keystrokes. */
export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  );
}
