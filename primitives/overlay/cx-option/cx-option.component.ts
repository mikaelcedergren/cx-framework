import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxCheckboxComponent } from '../../inputs/cx-checkbox';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key';
import { CxIconComponent } from '../../media/cx-icon';

export type CxOptionSize = 'small' | 'default' | 'large';
export type CxOptionMood = 'default' | 'danger';
export type CxOptionSubmenu = 'none' | 'open' | 'closed';
type CxOptionIconSize = '12' | '16' | '24';

@Component({
  selector: 'cx-option',
  imports: [CxCheckboxComponent, CxIconComponent, CxShortcutKeyComponent],
  templateUrl: './cx-option.component.html',
  styleUrl: './cx-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxOptionComponent {
  @Input() label = 'Option';
  /**
   * ARIA role for the underlying control. Left undefined by default so shared
   * consumers (cx-select, cx-table, cx-tag-input) keep the native button role.
   * cx-menu passes "menuitem".
   */
  @Input() role?: string;
  @Input() prependIcon?: CxIconName;
  @Input() description?: string;
  @Input() appendIcon?: CxIconName;
  @Input() mood: CxOptionMood = 'default';
  @Input() size: CxOptionSize = 'default';
  @Input() hover = false;
  @Input() selected = false;
  @Input() showCheckbox = false;
  @Input() disabled = false;
  @Input() shortcutParts: readonly string[] | undefined;
  @Input() submenu: CxOptionSubmenu = 'none';

  protected hasAppendOnlyLayout(): boolean {
    return !this.showCheckbox && !this.prependIcon && Boolean(this.appendIcon || this.submenu !== 'none');
  }

  protected hasShortcut(): boolean {
    return Array.isArray(this.shortcutParts) && this.shortcutParts.length > 0;
  }

  protected appendIconName(): CxIconName | undefined {
    return this.submenu === 'none' ? this.appendIcon : 'chevron-right';
  }

  protected iconSize(): CxOptionIconSize {
    if (this.size === 'small') {
      return '12';
    }
    if (this.size === 'large') {
      return '24';
    }
    return '16';
  }

  protected ariaSelectedValue(): string | null {
    return this.selected || this.role === 'option' ? String(this.selected) : null;
  }
}
