import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { CxMenuComponent, type CxMenuItem } from '../../overlay/cx-menu';

export type CxCardMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cx-card',
  imports: [CxIconButtonComponent, CxIconComponent, CxMenuComponent],
  templateUrl: './cx-card.component.html',
  styleUrl: './cx-card.component.scss',
  host: {
    '[class.cx-card-host--background]': 'background',
    '[class.cx-card-host--unpadded]': '!padded',
    '[class.cx-card-host--interactive]': 'interactive',
    '[class.cx-card-host--mood-primary]': 'mood === "primary"',
    '[class.cx-card-host--mood-accent]': 'mood === "accent"',
    '[class.cx-card-host--mood-info]': 'mood === "info"',
    '[class.cx-card-host--mood-success]': 'mood === "success"',
    '[class.cx-card-host--mood-warning]': 'mood === "warning"',
    '[class.cx-card-host--mood-danger]': 'mood === "danger"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCardComponent {
  @Input() heading: string | undefined;
  @Input() icon: CxIconName | undefined;
  @Input() mood: CxCardMood = 'default';
  @Input({ transform: booleanAttribute }) background = false;
  @Input({ transform: booleanAttribute }) padded = true;
  @Input({ transform: booleanAttribute }) interactive = false;
  @Input() menuItems: readonly CxMenuItem[] | undefined;

  @Output() readonly menuItemSelect = new EventEmitter<string>();

  protected hasHeading(): boolean {
    return !!this.heading?.trim();
  }

  protected hasMenuItems(): boolean {
    return (this.menuItems?.length ?? 0) > 0;
  }

  protected resolvedMenuAriaLabel(): string {
    const heading = this.heading?.trim();
    return heading ? `${heading} actions` : 'Card actions';
  }

  protected onMenuItemSelect(itemId: string): void {
    this.menuItemSelect.emit(itemId);
  }
}
