import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
export class CxShortcutKeyComponent {
    parts;
    items() {
        const parts = this.parts?.filter(part => part.trim().length > 0);
        if (parts?.length) {
            return this.normalizeParts(parts);
        }
        return [];
    }
    normalizeParts(parts) {
        const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
        const items = parts
            .map(part => this.classify(part, isMac))
            .filter((item) => item !== undefined);
        return this.sortByConvention(items, isMac);
    }
    classify(part, isMac) {
        const token = part.trim();
        if (!token)
            return undefined;
        const key = token.toLowerCase();
        if (key === 'mod' || key === 'cmd' || key === 'command') {
            return isMac ? { icon: 'key-command' } : { text: 'Ctrl' };
        }
        if (key === 'ctrl' || key === 'control') {
            return isMac ? { icon: 'key-control' } : { text: 'Ctrl' };
        }
        if (key === 'alt' || key === 'option' || key === 'opt') {
            return isMac ? { icon: 'key-option' } : { text: 'Alt' };
        }
        if (key === 'shift')
            return { icon: 'key-shift' };
        if (key === 'space' || token === ' ')
            return { icon: 'key-space' };
        if (key === 'up' || key === 'arrowup')
            return { icon: 'arrow-up' };
        if (key === 'down' || key === 'arrowdown')
            return { icon: 'arrow-down' };
        if (key === 'left' || key === 'arrowleft')
            return { icon: 'arrow-left' };
        if (key === 'right' || key === 'arrowright')
            return { icon: 'arrow-right' };
        if (key === 'enter' || key === 'return')
            return { text: '\u21a9' };
        if (key === 'tab')
            return { text: 'Tab' };
        if (key === 'esc' || key === 'escape')
            return { text: 'Esc' };
        if (key === 'backspace' || key === 'delete' || key === 'del')
            return { text: '\u232b' };
        return { text: token.length === 1 ? token.toUpperCase() : token };
    }
    sortByConvention(items, isMac) {
        const order = isMac
            ? ['key-control', 'key-option', 'key-shift', 'key-command']
            : ['Ctrl', 'key-shift', 'Alt'];
        const rank = (item) => {
            const value = item.icon ?? item.text ?? '';
            const index = order.indexOf(value);
            return index === -1 ? order.length : index;
        };
        const modifiers = items.filter(item => rank(item) < order.length).sort((a, b) => rank(a) - rank(b));
        const rest = items.filter(item => rank(item) === order.length);
        return [...modifiers, ...rest];
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxShortcutKeyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxShortcutKeyComponent, isStandalone: true, selector: "cx-shortcut-key", inputs: { parts: "parts" }, ngImport: i0, template: "@if (items(); as shortcutItems) {\n  @if (shortcutItems.length > 0) {\n    <span class=\"cx-shortcut-key-group\" aria-hidden=\"true\">\n      @for (item of shortcutItems; track $index) {\n        <span\n          class=\"cx-shortcut-key\"\n          [class.cx-shortcut-key--icon]=\"item.icon\"\n          [class.cx-shortcut-key--text]=\"!item.icon && item.text\"\n        >\n          @if (item.icon; as iconName) {\n            <cx-icon class=\"cx-shortcut-key__icon\" [icon]=\"iconName\" [size]=\"12\" />\n          } @else if (item.text; as keyText) {\n            <span class=\"cx-shortcut-key__text\">{{ keyText }}</span>\n          }\n        </span>\n      }\n    </span>\n  }\n}\n", styles: [":host{display:inline-flex;width:auto}.cx-shortcut-key-group{display:inline-flex;align-items:center;gap:var(--space-2xs)}.cx-shortcut-key{display:inline-flex;min-width:var(--space-md);height:var(--space-md);align-items:center;justify-content:center;border-radius:var(--radius-xs);border:var(--line);color:var(--cx-shortcut-key-color, var(--placeholder));box-sizing:border-box}.cx-shortcut-key--icon{width:var(--space-md)}.cx-shortcut-key--text{width:auto;padding:0 var(--space-2xs)}.cx-shortcut-key__icon{display:inline-flex;color:var(--cx-shortcut-key-color, var(--placeholder))}.cx-shortcut-key__text{display:block;color:var(--cx-shortcut-key-color, var(--placeholder));font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);line-height:var(--line-height-small)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxShortcutKeyComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-shortcut-key', imports: [CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (items(); as shortcutItems) {\n  @if (shortcutItems.length > 0) {\n    <span class=\"cx-shortcut-key-group\" aria-hidden=\"true\">\n      @for (item of shortcutItems; track $index) {\n        <span\n          class=\"cx-shortcut-key\"\n          [class.cx-shortcut-key--icon]=\"item.icon\"\n          [class.cx-shortcut-key--text]=\"!item.icon && item.text\"\n        >\n          @if (item.icon; as iconName) {\n            <cx-icon class=\"cx-shortcut-key__icon\" [icon]=\"iconName\" [size]=\"12\" />\n          } @else if (item.text; as keyText) {\n            <span class=\"cx-shortcut-key__text\">{{ keyText }}</span>\n          }\n        </span>\n      }\n    </span>\n  }\n}\n", styles: [":host{display:inline-flex;width:auto}.cx-shortcut-key-group{display:inline-flex;align-items:center;gap:var(--space-2xs)}.cx-shortcut-key{display:inline-flex;min-width:var(--space-md);height:var(--space-md);align-items:center;justify-content:center;border-radius:var(--radius-xs);border:var(--line);color:var(--cx-shortcut-key-color, var(--placeholder));box-sizing:border-box}.cx-shortcut-key--icon{width:var(--space-md)}.cx-shortcut-key--text{width:auto;padding:0 var(--space-2xs)}.cx-shortcut-key__icon{display:inline-flex;color:var(--cx-shortcut-key-color, var(--placeholder))}.cx-shortcut-key__text{display:block;color:var(--cx-shortcut-key-color, var(--placeholder));font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);line-height:var(--line-height-small)}"] }]
        }], propDecorators: { parts: [{
                type: Input
            }] } });
