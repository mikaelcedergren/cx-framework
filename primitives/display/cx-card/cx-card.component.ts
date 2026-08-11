import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
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
    '[class.cx-card-host--interactive]': 'interactive',
    '[attr.role]': 'interactive ? "button" : null',
    '[attr.tabindex]': 'interactive ? 0 : null',
    '(click)': 'onHostClick($event)',
    '(keydown)': 'onHostKeydown($event)',
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
  @Input() padding: CxCardPadding = 'default';
  @Input({ transform: booleanAttribute }) background = false;
  @Input({ transform: booleanAttribute }) border = false;
  @Input({ transform: booleanAttribute }) shadow = false;
  @Input({ transform: booleanAttribute }) interactive = false;
  @Input() menuItems: readonly CxMenuItem[] | undefined;

  @Output() readonly menuItemSelect = new EventEmitter<string>();
  @Output() readonly pressed = new EventEmitter<void>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onHostClick(event: MouseEvent): void {
    if (!this.interactive || this.isInteractiveDescendant(event.target)) {
      return;
    }
    this.pressed.emit();
  }

  protected onHostKeydown(event: KeyboardEvent): void {
    if (!this.interactive || event.target !== this.elementRef.nativeElement) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.pressed.emit();
  }

  private isInteractiveDescendant(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      !!target.closest('button, a, input, textarea, select, cx-menu, [contenteditable="true"]')
    );
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
