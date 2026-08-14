import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../../overlay/cx-menu';

export type CxCardMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxCardPadding = 'none' | 'default' | 'large';

@Component({
  selector: 'cx-card',
  imports: [CxIconButtonComponent, CxIconComponent, CxMenuComponent, CxMenuTriggerDirective],
  templateUrl: './cx-card.component.html',
  styleUrl: './cx-card.component.scss',
  host: {
    '[class.cx-card-host--background]': 'background',
    '[class.cx-card-host--border]': 'border',
    '[class.cx-card-host--shadow]': 'shadow',
    '[class.cx-card-host--padding-none]': 'padding === "none"',
    '[class.cx-card-host--padding-large]': 'padding === "large"',
    '[class.cx-card-host--interactive]': 'activatable',
    '[class.cx-card-host--mood-primary]': 'mood === "primary"',
    '[class.cx-card-host--mood-accent]': 'mood === "accent"',
    '[class.cx-card-host--mood-info]': 'mood === "info"',
    '[class.cx-card-host--mood-success]': 'mood === "success"',
    '[class.cx-card-host--mood-warning]': 'mood === "warning"',
    '[class.cx-card-host--mood-danger]': 'mood === "danger"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCardComponent implements OnChanges {
  private warnedInvalidActivation = false;

  @Input() heading: string | undefined;
  @Input() icon: CxIconName | undefined;
  @Input() mood: CxCardMood = 'default';
  @Input() padding: CxCardPadding = 'default';
  @Input({ transform: booleanAttribute }) background = false;
  @Input({ transform: booleanAttribute }) border = false;
  @Input({ transform: booleanAttribute }) shadow = false;
  /** Action mode. The card exposes a real button surface and emits pressed. */
  @Input({ transform: booleanAttribute }) interactive = false;
  /** Navigation mode. Takes precedence over interactive and exposes a real link surface. */
  @Input() href: string | undefined;
  @Input() target: string | undefined;
  @Input() rel: string | undefined;
  /** Accessible name for the card action or link; falls back to heading. */
  @Input() ariaLabel: string | undefined;
  @Input() menuItems: readonly CxMenuItem[] | undefined;

  @Output() readonly menuItemSelect = new EventEmitter<string>();
  /** Emitted only by action mode. Navigation mode follows native link behavior. */
  @Output() readonly pressed = new EventEmitter<void>();

  public ngOnChanges(_changes: SimpleChanges): void {
    if (this.warnedInvalidActivation || !this.resolvedHref || !this.interactive) {
      return;
    }
    this.warnedInvalidActivation = true;
    console.warn(
      `cx-card "${this.heading?.trim() || 'Untitled card'}" sets both href and interactive. ` +
        'A card navigates or acts; href wins and pressed will not emit.',
    );
  }

  protected get resolvedHref(): string | undefined {
    return this.href?.trim() || undefined;
  }

  protected get activatable(): boolean {
    return Boolean(this.resolvedHref) || this.interactive;
  }

  protected get resolvedRel(): string | null {
    return this.rel?.trim() || (this.target?.trim() === '_blank' ? 'noopener' : null);
  }

  protected get activationLabel(): string {
    return this.ariaLabel?.trim() || this.heading?.trim() || (this.resolvedHref ? 'Open card' : 'Activate card');
  }

  protected onActivate(): void {
    this.pressed.emit();
  }

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
