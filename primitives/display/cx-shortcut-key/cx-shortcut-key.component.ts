import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export interface CxShortcutKeyItem {
  icon?: CxIconName;
  text?: string;
}

@Component({
  selector: 'cx-shortcut-key',
  imports: [CxIconComponent],
  templateUrl: './cx-shortcut-key.component.html',
  styleUrl: './cx-shortcut-key.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxShortcutKeyComponent {
  @Input() parts: readonly string[] | undefined;

  protected items(): readonly CxShortcutKeyItem[] {
    const parts = this.parts?.filter(part => part.trim().length > 0);
    if (parts?.length) {
      return this.normalizeParts(parts);
    }
    return [];
  }

  private normalizeParts(parts: readonly string[]): readonly CxShortcutKeyItem[] {
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    const items = parts
      .map(part => this.classify(part, isMac))
      .filter((item): item is CxShortcutKeyItem => item !== undefined);
    return this.sortByConvention(items, isMac);
  }

  private classify(part: string, isMac: boolean): CxShortcutKeyItem | undefined {
    const token = part.trim();
    if (!token) return undefined;
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
    if (key === 'shift') return { icon: 'key-shift' };
    if (key === 'space' || token === ' ') return { icon: 'key-space' };
    if (key === 'up' || key === 'arrowup') return { icon: 'arrow-up' };
    if (key === 'down' || key === 'arrowdown') return { icon: 'arrow-down' };
    if (key === 'left' || key === 'arrowleft') return { icon: 'arrow-left' };
    if (key === 'right' || key === 'arrowright') return { icon: 'arrow-right' };
    if (key === 'enter' || key === 'return') return { text: '\u21a9' };
    if (key === 'tab') return { text: 'Tab' };
    if (key === 'esc' || key === 'escape') return { text: 'Esc' };
    if (key === 'backspace' || key === 'delete' || key === 'del') return { text: '\u232b' };
    return { text: token.length === 1 ? token.toUpperCase() : token };
  }

  private sortByConvention(items: readonly CxShortcutKeyItem[], isMac: boolean): readonly CxShortcutKeyItem[] {
    const order = isMac
      ? ['key-control', 'key-option', 'key-shift', 'key-command']
      : ['Ctrl', 'key-shift', 'Alt'];
    const rank = (item: CxShortcutKeyItem) => {
      const value = item.icon ?? item.text ?? '';
      const index = order.indexOf(value);
      return index === -1 ? order.length : index;
    };
    const modifiers = items.filter(item => rank(item) < order.length).sort((a, b) => rank(a) - rank(b));
    const rest = items.filter(item => rank(item) === order.length);
    return [...modifiers, ...rest];
  }
}
