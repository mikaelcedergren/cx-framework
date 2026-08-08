import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { type CxIconName } from '../../../icons/manifest';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTooltipDirective } from '../cx-tooltip';

export type CxOptionMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxOptionSubmenu = 'none' | 'open' | 'closed';

@Component({
  selector: 'cx-option',
  imports: [NgTemplateOutlet, CxIconComponent, CxShortcutKeyComponent, CxTooltipDirective],
  templateUrl: './cx-option.component.html',
  styleUrl: './cx-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxOptionComponent implements OnChanges {
  @Input() label = 'Option';
  @Input() description?: string;
  @Input() prependIcon?: CxIconName;
  @Input() appendIcon?: CxIconName;
  @Input() shortcutParts: readonly string[] | undefined;
  @Input() submenu: CxOptionSubmenu = 'none';
  @Input() mood: CxOptionMood = 'default';
  @Input() active = false;
  @Input() selected = false;
  @Input() selectedHighlight = true;
  @Input() showCheckbox = false;
  @Input() clickable = true;
  @Input() disabled = false;
  /**
   * ARIA role for the underlying control. Left undefined by default so shared
   * consumers (cx-dropdown, cx-table, cx-tag-field) keep the native button role.
   * cx-menu passes "menuitem".
   */
  @Input() role?: string;
  /** Position within a partially rendered set (1-based); virtualized listboxes pass this. */
  @Input() ariaPosInSet?: number;
  /** Total size of a partially rendered set; virtualized listboxes pass this. */
  @Input() ariaSetSize?: number;

  @ViewChild('control', { read: ElementRef })
  private controlRef?: ElementRef<HTMLElement>;

  private warnedInvalidCheckboxIcon = false;

  ngOnChanges(_changes: SimpleChanges): void {
    this.warnInvalidCombinations();
  }

  /** Move keyboard focus to the option's control. */
  public focus(): void {
    this.controlRef?.nativeElement.focus();
  }

  protected hasAppendOnlyLayout(): boolean {
    return !this.showCheckbox && !this.showPrependIcon() && Boolean(this.appendIcon || this.submenu !== 'none');
  }

  protected hasShortcut(): boolean {
    return Array.isArray(this.shortcutParts) && this.shortcutParts.length > 0;
  }

  protected appendIconName(): CxIconName | undefined {
    return this.submenu === 'none' ? this.appendIcon : 'chevron-right';
  }

  protected showPrependIcon(): CxIconName | undefined {
    return this.showCheckbox ? undefined : this.prependIcon;
  }

  protected ariaSelectedValue(): string | null {
    // aria-selected is only valid on the option role; other consumers (plain
    // buttons, menu items) express selection visually or via aria-checked.
    return this.role === 'option' ? String(this.selected) : null;
  }

  protected ariaCheckedValue(): string | null {
    return this.role === 'menuitemradio' || this.role === 'menuitemcheckbox'
      ? String(this.selected)
      : null;
  }

  protected stopControlEvent(event: Event): void {
    event.stopPropagation();
  }

  private warnInvalidCombinations(): void {
    if (this.showCheckbox && this.prependIcon) {
      if (!this.warnedInvalidCheckboxIcon) {
        console.warn('[cx-option] showCheckbox and prependIcon cannot be used together. The checkbox affordance replaces the prepend icon.');
        this.warnedInvalidCheckboxIcon = true;
      }
      return;
    }

    this.warnedInvalidCheckboxIcon = false;
  }
}
