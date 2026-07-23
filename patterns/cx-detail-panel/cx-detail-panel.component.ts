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
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../../primitives/overlay/overlay-state';
import { CxTabsComponent, type CxTabItem } from '../../primitives/navigation/cx-tabs';
import { isHostVisible } from '../../primitives/shared/host-visibility';

const DETAIL_PANEL_DISMISS_FALLBACK_BUFFER_MS = 50;

export type CxDetailPanelVariant = 'floating' | 'fixed';

@Component({
  selector: 'cx-detail-panel',
  imports: [CxIconButtonComponent, CxIconComponent, CxMenuComponent, CxMenuTriggerDirective, CxTabsComponent],
  templateUrl: './cx-detail-panel.component.html',
  styleUrl: './cx-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDetailPanelComponent implements OnDestroy {
  private static nextId = 0;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly overlayState = inject(CxOverlayStateService);
  private overlayHandle?: CxOverlayStateHandle;
  private dismissMeasureFrame: number | undefined;
  private dismissFallbackTimer: number | undefined;
  private restoreFocusOnDismiss = true;
  private dismissCompleted = false;
  private selectedTabIdValue: string | undefined;
  private readonly instanceId = CxDetailPanelComponent.nextId++;

  @ViewChild('contentViewport', { read: ElementRef })
  private readonly contentViewport?: ElementRef<HTMLElement>;

  @ViewChild('panelSurface', { read: ElementRef })
  private readonly panelSurface?: ElementRef<HTMLElement>;

  @Input() icon: CxIconName | undefined;
  @Input() heading = '';
  @Input() variant: CxDetailPanelVariant = 'floating';
  @Input() menuItems: readonly CxMenuItem[] | undefined;
  @Input() menuAriaLabel: string | undefined;
  @Input() tabs: readonly CxTabItem[] = [];
  @Input() tabsAriaLabel: string | undefined;
  /** Optional width / min-width overrides (any CSS length) for the panel host. */
  @Input() width: string | null = null;
  @Input() minWidth: string | null = null;
  /** Also dismiss on a click outside the panel after any owned overlay closes. */
  @Input() dismissOnClickOutside = false;

  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();
  @Output() readonly selectedTabIdChange = new EventEmitter<string>();

  protected readonly closing$ = signal(false);
  protected readonly headingId = `cx-detail-panel-heading-${this.instanceId}`;
  protected readonly tabPanelId = `cx-detail-panel-tab-panel-${this.instanceId}`;

  constructor() {
    this.overlayHandle = this.overlayState.capture({
      kind: 'transient',
      restoreFocus: true,
      isActive: () => isHostVisible(this.host.nativeElement),
      onEscape: () => {
        if (!this.closing$()) {
          this.dismiss();
        }
      },
    });
  }

  @Input()
  public set selectedTabId(value: string | undefined) {
    const nextValue = value?.trim() || undefined;
    if (nextValue !== this.selectedTabIdValue) {
      this.selectedTabIdValue = nextValue;
      this.resetContentScroll();
    }
  }

  public get selectedTabId(): string | undefined {
    return this.selectedTabIdValue;
  }

  // Exposed as custom properties so the responsive width rules can replace
  // them cleanly without competing with inline width declarations.
  @HostBinding('style.--cx-detail-panel-width') get widthVar(): string | null {
    return this.width;
  }

  @HostBinding('style.--cx-detail-panel-min-width') get minWidthVar(): string | null {
    return this.minWidth;
  }

  @HostBinding('class.cx-detail-panel-host--floating')
  protected get floatingHostClass(): boolean {
    return this.variant === 'floating';
  }

  protected get isFixed(): boolean {
    return this.variant === 'fixed';
  }

  protected get hasTabs(): boolean {
    return this.tabs.some(tab => tab.id?.trim());
  }

  protected get normalizedHeading(): string {
    return this.heading.trim();
  }

  protected get hasMenuItems(): boolean {
    return (this.menuItems?.length ?? 0) > 0;
  }

  protected get resolvedMenuAriaLabel(): string {
    const label = this.menuAriaLabel?.trim();
    if (label) {
      return label;
    }
    return this.normalizedHeading ? `Actions for ${this.normalizedHeading}` : 'Detail panel actions';
  }

  protected get resolvedTabsAriaLabel(): string {
    const label = this.tabsAriaLabel?.trim();
    if (label) {
      return label;
    }
    return this.normalizedHeading ? `${this.normalizedHeading} sections` : 'Detail sections';
  }

  protected get resolvedCloseAriaLabel(): string {
    return this.normalizedHeading ? `Close ${this.normalizedHeading}` : 'Close detail panel';
  }

  protected get selectedTabButtonId(): string | null {
    const normalizedTabs = this.tabs.filter(tab => tab.id?.trim());
    const selectedIndex = normalizedTabs.findIndex(tab => tab.id.trim() === this.selectedTabId && !tab.disabled);
    const resolvedIndex = selectedIndex >= 0 ? selectedIndex : normalizedTabs.findIndex(tab => !tab.disabled);
    return resolvedIndex >= 0 ? `${this.tabPanelId}-tab-${resolvedIndex}` : null;
  }

  @HostListener('document:mousedown', ['$event'])
  protected onDocumentMousedown(event: MouseEvent): void {
    if (!this.dismissOnClickOutside || this.closing$()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!isHostVisible(this.host.nativeElement)) return;
    if (!this.overlayState.isTopmost(this.overlayHandle)) return;
    if (this.host.nativeElement.contains(target)) return;
    this.dismiss(false);
  }

  protected dismiss(restoreFocus = true): void {
    if (this.closing$()) {
      return;
    }
    const activeElement = document.activeElement;
    // Blur only panel-owned focus so in-progress field edits commit without
    // perturbing a control that already owns focus elsewhere.
    if (activeElement instanceof HTMLElement && this.host.nativeElement.contains(activeElement)) {
      activeElement.blur();
    }
    this.restoreFocusOnDismiss = restoreFocus;
    this.closing$.set(true);
    this.scheduleDismissFallback();
  }

  protected onDismissAnimationEnd(event: AnimationEvent): void {
    if (event.target === this.panelSurface?.nativeElement) {
      this.completeDismiss();
    }
  }

  public ngOnDestroy(): void {
    this.clearDismissSchedule();
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }

  protected onMenuItemSelect(id: string): void {
    this.menuItemSelect.emit(id);
  }

  protected onTabSelect(id: string): void {
    this.selectedTabIdValue = id;
    this.resetContentScroll();
    this.selectedTabIdChange.emit(id);
  }

  private resetContentScroll(): void {
    if (this.contentViewport) {
      this.contentViewport.nativeElement.scrollTop = 0;
      this.contentViewport.nativeElement.scrollLeft = 0;
    }
  }

  private scheduleDismissFallback(): void {
    this.dismissMeasureFrame = window.requestAnimationFrame(() => {
      this.dismissMeasureFrame = undefined;
      const surface = this.panelSurface?.nativeElement;
      const animationMs = surface
        ? maximumAnimationTimeMs(window.getComputedStyle(surface))
        : 0;
      this.dismissFallbackTimer = window.setTimeout(
        () => this.completeDismiss(),
        animationMs + DETAIL_PANEL_DISMISS_FALLBACK_BUFFER_MS,
      );
    });
  }

  private completeDismiss(): void {
    if (!this.closing$() || this.dismissCompleted) {
      return;
    }
    this.dismissCompleted = true;
    this.clearDismissSchedule();
    if (this.overlayHandle && !this.restoreFocusOnDismiss) {
      this.overlayHandle.restoreFocus = false;
    }
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
    this.dismissed.emit();
  }

  private clearDismissSchedule(): void {
    if (this.dismissMeasureFrame !== undefined) {
      window.cancelAnimationFrame(this.dismissMeasureFrame);
      this.dismissMeasureFrame = undefined;
    }
    if (this.dismissFallbackTimer !== undefined) {
      window.clearTimeout(this.dismissFallbackTimer);
      this.dismissFallbackTimer = undefined;
    }
  }
}

function maximumAnimationTimeMs(style: CSSStyleDeclaration): number {
  const durations = parseCssTimes(style.animationDuration);
  const delays = parseCssTimes(style.animationDelay);
  const count = Math.max(durations.length, delays.length);
  let longest = 0;

  for (let index = 0; index < count; index += 1) {
    longest = Math.max(
      longest,
      durations[index % durations.length]! + delays[index % delays.length]!,
    );
  }
  return longest;
}

function parseCssTimes(value: string): number[] {
  const times = value.split(',').map(part => {
    const normalized = part.trim();
    const numeric = Number.parseFloat(normalized);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return normalized.endsWith('ms') ? numeric : numeric * 1000;
  });
  return times.length > 0 ? times : [0];
}
