import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxDismissRequest } from '../../primitives/overlay/dismiss-request';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../../primitives/overlay/overlay-state';
import { CxTabsComponent, type CxTabItem } from '../../primitives/navigation/cx-tabs';
import { isHostVisible } from '../../primitives/shared/host-visibility';
import { CxDetailPanelSectionComponent } from './cx-detail-panel-section.component';

const DETAIL_PANEL_DISMISS_FALLBACK_BUFFER_MS = 50;

export type CxDetailPanelVariant = 'floating' | 'fixed';

@Component({
  selector: 'cx-detail-panel',
  imports: [
    CxIconButtonComponent,
    CxIconComponent,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxTabsComponent,
  ],
  templateUrl: './cx-detail-panel.component.html',
  styleUrl: './cx-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDetailPanelComponent implements AfterViewChecked, OnDestroy {
  private static nextId = 0;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly overlayState = inject(CxOverlayStateService);
  private overlayHandle?: CxOverlayStateHandle;
  private dismissMeasureFrame: number | undefined;
  private dismissFallbackTimer: number | undefined;
  private restoreFocusOnDismiss = true;
  private dismissCompleted = false;
  private selectedTabIdValue: string | undefined;
  private menuItemsValue: readonly CxMenuItem[] | undefined;
  private tabsValue: readonly CxTabItem[] = [];
  private readonly instanceId = CxDetailPanelComponent.nextId++;

  @ContentChildren(CxDetailPanelSectionComponent, { read: ElementRef })
  private readonly contentSections?: QueryList<ElementRef<HTMLElement>>;

  @ViewChild('contentViewport', { read: ElementRef })
  private readonly contentViewport?: ElementRef<HTMLElement>;

  @ViewChild('panelSurface', { read: ElementRef })
  private readonly panelSurface?: ElementRef<HTMLElement>;

  @Input() icon: CxIconName | undefined;
  @Input() heading = '';
  @Input() variant: CxDetailPanelVariant = 'floating';
  @Input()
  public set menuItems(value: readonly CxMenuItem[] | undefined) {
    this.menuItemsValue = validateDetailPanelMenuItems(value);
  }
  public get menuItems(): readonly CxMenuItem[] | undefined {
    return this.menuItemsValue;
  }
  @Input() menuAriaLabel: string | undefined;
  @Input()
  public set tabs(value: readonly CxTabItem[]) {
    this.tabsValue = validateDetailPanelTabs(value);
  }
  public get tabs(): readonly CxTabItem[] {
    return this.tabsValue;
  }
  @Input() tabsAriaLabel: string | undefined;
  /** Optional width / min-width overrides (any CSS length) for the panel host. */
  @Input() width: string | null = null;
  @Input() minWidth: string | null = null;
  /**
   * Also dismiss on a click outside the panel after any owned overlay closes.
   * A successful dismissal lets that pointer action continue to its outside
   * target and does not restore focus to the panel's invoker.
   */
  @Input() dismissOnClickOutside = false;

  @Output() readonly dismissed = new EventEmitter<void>();
  /** Synchronous request emitted before a user dismissal would close this panel. */
  @Output() readonly dismissRequest = new EventEmitter<CxDismissRequest>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();
  @Output() readonly selectedTabIdChange = new EventEmitter<string>();

  protected readonly closing$ = signal(false);
  protected readonly headingId = `cx-detail-panel-heading-${this.instanceId}`;
  protected readonly tabPanelId = `cx-detail-panel-tab-panel-${this.instanceId}`;

  constructor() {
    this.overlayHandle = this.overlayState.capture({
      kind: 'transient',
      restoreFocus: true,
      surface: () => this.panelSurface?.nativeElement,
      layerSurfaces: () => [this.host.nativeElement],
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

  public ngAfterViewChecked(): void {
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
    if (!this.dismiss(false)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  protected dismiss(restoreFocus = true): boolean {
    if (this.closing$()) {
      return false;
    }
    const request = new CxDismissRequest('dismiss');
    this.dismissRequest.emit(request);
    if (request.defaultPrevented) {
      return false;
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
    return true;
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

function validateDetailPanelMenuItems(
  value: readonly CxMenuItem[] | undefined,
): readonly CxMenuItem[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('[cx-detail-panel] menuItems must be an array.');
  }

  validateDetailPanelMenuLevel(value, 'menuItems', new Set<string>());
  return [...value];
}

function validateDetailPanelMenuLevel(
  items: readonly CxMenuItem[],
  path: string,
  ids: Set<string>,
): void {
  const labels = new Set<string>();
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    const id = typeof item?.id === 'string' ? item.id.trim() : '';
    if (!id) {
      throw new Error(`[cx-detail-panel] ${itemPath} requires a non-empty id.`);
    }
    if (ids.has(id)) {
      throw new Error(`[cx-detail-panel] menu item id "${id}" must be unique.`);
    }
    ids.add(id);

    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    const labelKey = label.toLowerCase();
    if (labels.has(labelKey)) {
      throw new Error(`[cx-detail-panel] menu item label "${label}" must be unique within ${path}.`);
    }
    labels.add(labelKey);

    if (item.items !== undefined) {
      if (!Array.isArray(item.items)) {
        throw new Error(`[cx-detail-panel] ${itemPath}.items must be an array.`);
      }
      validateDetailPanelMenuLevel(item.items, `${itemPath}.items`, ids);
    }
  });
}

function validateDetailPanelTabs(value: readonly CxTabItem[]): readonly CxTabItem[] {
  if (!Array.isArray(value)) {
    throw new Error('[cx-detail-panel] tabs must be an array.');
  }

  const ids = new Set<string>();
  const labels = new Set<string>();
  value.forEach((tab, index) => {
    const id = typeof tab?.id === 'string' ? tab.id.trim() : '';
    if (!id) {
      throw new Error(`[cx-detail-panel] tab at index ${index} requires a non-empty id.`);
    }
    if (ids.has(id)) {
      throw new Error(`[cx-detail-panel] tab id "${id}" must be unique.`);
    }
    ids.add(id);

    const label = typeof tab?.label === 'string' ? tab.label.trim() : '';
    const labelKey = label.toLowerCase();
    if (labels.has(labelKey)) {
      throw new Error(`[cx-detail-panel] tab label "${label}" must be unique.`);
    }
    labels.add(labelKey);
  });

  return [...value];
}
