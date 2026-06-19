import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxMenuComponent, type CxMenuItem } from '../../primitives/overlay/cx-menu';

const DETAIL_PANEL_DISMISS_DURATION_MS = 240;

export type CxDetailPanelVariant = 'floating' | 'fixed' | 'bar';

@Component({
  selector: 'cx-detail-panel',
  imports: [CxIconButtonComponent, CxIconComponent, CxMenuComponent],
  templateUrl: './cx-detail-panel.component.html',
  styleUrl: './cx-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDetailPanelComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() ariaLabel = 'Detail panel';
  @Input() icon: CxIconName | undefined;
  @Input() heading = 'Asset details';
  @Input() dismissible = true;
  @Input() variant: CxDetailPanelVariant = 'floating';
  @Input() hasScrollbar = true;
  @Input() menuItems: CxMenuItem[] = [];
  @Input() menuAriaLabel = 'Open detail panel menu';
  /** Render in-page (position: absolute, fills the nearest positioned ancestor)
   * instead of a viewport-fixed drawer. The host page must be positioned. */
  @Input() inline = false;
  /** Optional width / min-width overrides (any CSS length) for inline panels. */
  @Input() width: string | null = null;
  @Input() minWidth: string | null = null;
  /** Also dismiss on a click outside the panel (ignoring popover surfaces). */
  @Input() dismissOnClickOutside = false;
  /** When set, escape / outside-click are suppressed while this selector
   * matches something in the DOM (e.g. an open date-picker overlay). */
  @Input() dismissGuardSelector: string | null = null;

  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly menuSelect = new EventEmitter<string>();

  protected readonly closing$ = signal(false);

  @HostBinding('class.cx-detail-panel-host--inline') get inlineClass(): boolean {
    return this.inline;
  }

  @HostBinding('class.cx-detail-panel-host--bar') get barClass(): boolean {
    return this.variant === 'bar';
  }

  // Exposed as custom properties (not direct width/min-width) so the inline
  // variant's responsive rules can override them without inline-style !important.
  @HostBinding('style.--cx-detail-panel-width') get widthVar(): string | null {
    return this.width;
  }

  @HostBinding('style.--cx-detail-panel-min-width') get minWidthVar(): string | null {
    return this.minWidth;
  }

  protected get isBar(): boolean {
    return this.variant === 'bar';
  }

  protected get isFixed(): boolean {
    return this.variant === 'fixed';
  }

  protected get showFooterClose(): boolean {
    return this.dismissible;
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.dismissible || this.closing$() || !(event instanceof KeyboardEvent)) {
      return;
    }
    if (this.isDismissGuarded()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dismiss();
  }

  @HostListener('document:mousedown', ['$event'])
  protected onDocumentMousedown(event: MouseEvent): void {
    if (!this.dismissOnClickOutside || !this.dismissible || this.closing$()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (this.host.nativeElement.contains(target)) return;
    // Don't close when the click lands on an overlay surface (menu, popover,
    // date-picker) that visually belongs to the panel but renders elsewhere.
    if (target.closest('[data-cx-popover-surface], .cx-popover-backdrop__surface')) return;
    if (this.isDismissGuarded()) return;
    this.dismiss();
  }

  protected dismiss(): void {
    if (this.closing$()) {
      return;
    }
    // Blur first so in-progress field edits commit via their blur handlers
    // before the panel animates away.
    (document.activeElement as HTMLElement | null)?.blur();
    this.closing$.set(true);
    window.setTimeout(() => {
      this.dismissed.emit();
    }, DETAIL_PANEL_DISMISS_DURATION_MS);
  }

  protected onMenuSelect(id: string): void {
    this.menuSelect.emit(id);
  }

  private isDismissGuarded(): boolean {
    return !!this.dismissGuardSelector && !!document.querySelector(this.dismissGuardSelector);
  }
}
