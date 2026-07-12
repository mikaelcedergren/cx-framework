import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Output,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../../primitives/overlay/overlay-state';
import { isHostVisible } from '../../primitives/shared/host-visibility';

const DETAIL_PANEL_DISMISS_DURATION_MS = 240;

export type CxDetailPanelVariant = 'floating' | 'fixed' | 'bar';
export type CxDetailPanelPlacement = 'container' | 'viewport';

@Component({
  selector: 'cx-detail-panel',
  imports: [CxIconButtonComponent, CxIconComponent, CxMenuComponent, CxMenuTriggerDirective],
  templateUrl: './cx-detail-panel.component.html',
  styleUrl: './cx-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDetailPanelComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly overlayState = inject(CxOverlayStateService);
  private overlayHandle?: CxOverlayStateHandle;
  private dismissTimer: number | undefined;
  private placementValue: CxDetailPanelPlacement = 'container';

  @Input() ariaLabel = 'Detail panel';
  @Input() icon: CxIconName | undefined;
  @Input() heading = '';
  @Input() dismissible = true;
  @Input() variant: CxDetailPanelVariant = 'floating';
  @Input() scrollable = true;
  @Input() menuItems: CxMenuItem[] = [];
  @Input() menuAriaLabel = 'Open detail panel menu';
  /** Optional width / min-width overrides (any CSS length) for the panel host. */
  @Input() width: string | null = null;
  @Input() minWidth: string | null = null;
  /** Also dismiss on a click outside the panel after any owned overlay closes. */
  @Input() dismissOnClickOutside = false;

  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly menuSelect = new EventEmitter<string>();

  protected readonly closing$ = signal(false);

  constructor() {
    this.overlayHandle = this.overlayState.capture({
      kind: 'transient',
      restoreFocus: true,
      isActive: () => isHostVisible(this.host.nativeElement),
      onEscape: () => {
        if (this.dismissible && !this.closing$()) {
          this.dismiss();
        }
      },
    });
  }

  @Input()
  public set placement(value: CxDetailPanelPlacement) {
    if (value !== 'container' && value !== 'viewport') {
      throw new Error(`[cx-detail-panel] placement must be "container" or "viewport"; received "${value}".`);
    }
    this.placementValue = value;
  }

  public get placement(): CxDetailPanelPlacement {
    return this.placementValue;
  }

  @HostBinding('class.cx-detail-panel-host--container') get containerPlacementClass(): boolean {
    return this.placement === 'container';
  }

  @HostBinding('class.cx-detail-panel-host--viewport') get viewportPlacementClass(): boolean {
    return this.placement === 'viewport';
  }

  @HostBinding('class.cx-detail-panel-host--bar') get barClass(): boolean {
    return this.variant === 'bar';
  }

  // Exposed as custom properties so the responsive placement rules can replace
  // them cleanly without competing with inline width declarations.
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

  @HostListener('document:mousedown', ['$event'])
  protected onDocumentMousedown(event: MouseEvent): void {
    if (!this.dismissOnClickOutside || !this.dismissible || this.closing$()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!isHostVisible(this.host.nativeElement)) return;
    if (!this.overlayState.isTopmost(this.overlayHandle)) return;
    if (this.host.nativeElement.contains(target)) return;
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
    this.dismissTimer = window.setTimeout(() => {
      this.dismissTimer = undefined;
      this.dismissed.emit();
    }, DETAIL_PANEL_DISMISS_DURATION_MS);
  }

  public ngOnDestroy(): void {
    if (this.dismissTimer !== undefined) {
      window.clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }

  protected onMenuSelect(id: string): void {
    this.menuSelect.emit(id);
  }

}
