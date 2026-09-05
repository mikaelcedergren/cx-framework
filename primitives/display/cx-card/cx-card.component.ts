import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTabsComponent, type CxTabItem } from '../../navigation/cx-tabs';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../../overlay/cx-menu';

export type CxCardMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxCardVariant = 'default' | 'border';

// Overflow below this many pixels is not worth an expand control: the fade would
// hide more than the expansion reveals. Roughly one body line of text.
const EXPAND_OVERFLOW_TOLERANCE = 24;

let nextCardContentId = 0;

@Component({
  selector: 'cx-card',
  imports: [
    CxIconButtonComponent,
    CxIconComponent,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxTabsComponent,
  ],
  templateUrl: './cx-card.component.html',
  styleUrl: './cx-card.component.scss',
  host: {
    '[class.cx-card-host--border]': 'variant === "border"',
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
export class CxCardComponent implements OnChanges, AfterViewInit, OnDestroy {
  private warnedInvalidActivation = false;
  private warnedInvalidExpansion = false;
  private warnedInvalidTabs = false;
  private resizeObserver: ResizeObserver | undefined;

  protected readonly contentId = `cx-card-content-${(nextCardContentId += 1)}`;
  protected readonly expanded = signal(false);
  private readonly contentHeight = signal(0);

  @ViewChild('cardViewport', { read: ElementRef })
  private cardViewportRef?: ElementRef<HTMLElement>;

  @ViewChild('cardContent', { read: ElementRef })
  private cardContentRef?: ElementRef<HTMLElement>;

  @ViewChild('cardMeta', { read: ElementRef })
  private cardMetaRef?: ElementRef<HTMLElement>;

  @Input() heading: string | undefined;
  @Input() icon: CxIconName | undefined;
  @Input() mood: CxCardMood = 'default';
  @Input() variant: CxCardVariant = 'default';
  /** Action mode. The card exposes a real button surface and emits pressed. */
  @Input({ transform: booleanAttribute }) interactive = false;
  /** Navigation mode. Takes precedence over interactive and exposes a real link surface. */
  @Input() href: string | undefined;
  @Input() target: string | undefined;
  @Input() rel: string | undefined;
  /** Accessible name for the card action or link; falls back to heading. */
  @Input() ariaLabel: string | undefined;
  @Input() menuItems: readonly CxMenuItem[] | undefined;
  /** Clamps overflowing content to previewHeight behind an earned expand control. */
  @Input({ transform: booleanAttribute }) expandable = false;
  /** Collapsed content height in px. The expand control appears only when content exceeds it. */
  @Input() previewHeight = 240;
  /** Renders a flush tab row between the header and the content island. */
  @Input() tabs: readonly CxTabItem[] | undefined;
  @Input() selectedTabId: string | undefined;
  /** Accessible name for the tab row; falls back to the heading. */
  @Input() tabsAriaLabel: string | undefined;

  @Output() readonly menuItemSelect = new EventEmitter<string>();
  /** Emitted only by action mode. Navigation mode follows native link behavior. */
  @Output() readonly pressed = new EventEmitter<void>();
  @Output() readonly selectedTabIdChange = new EventEmitter<string>();

  public ngOnChanges(_changes: SimpleChanges): void {
    if (!this.warnedInvalidActivation && this.resolvedHref && this.interactive) {
      this.warnedInvalidActivation = true;
      console.warn(
        `cx-card "${this.heading?.trim() || 'Untitled card'}" sets both href and interactive. ` +
          'A card navigates or acts; href wins and pressed will not emit.',
      );
    }
    if (!this.warnedInvalidExpansion && this.expandable && this.activatable) {
      this.warnedInvalidExpansion = true;
      console.error(
        `cx-card "${this.heading?.trim() || 'Untitled card'}" sets expandable on an activatable card. ` +
          'A whole-card link or action cannot also host an expand control; expandable is ignored.',
      );
    }
    if (!this.warnedInvalidTabs && (this.tabs?.length ?? 0) > 0 && this.activatable) {
      this.warnedInvalidTabs = true;
      console.error(
        `cx-card "${this.heading?.trim() || 'Untitled card'}" sets tabs on an activatable card. ` +
          'A whole-card link or action cannot also host a tab row; tabs are ignored.',
      );
    }
    this.syncContentObserver();
  }

  public ngAfterViewInit(): void {
    this.syncContentObserver();
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
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

  protected get expansionEnabled(): boolean {
    return this.expandable && !this.activatable;
  }

  protected get hasTabs(): boolean {
    return !this.activatable && (this.tabs?.some(tab => tab.id?.trim()) ?? false);
  }

  protected get resolvedTabsAriaLabel(): string {
    const label = this.tabsAriaLabel?.trim();
    if (label) {
      return label;
    }
    const heading = this.heading?.trim();
    return heading ? `${heading} sections` : 'Card sections';
  }

  // Mirrors the tab button ids cx-tabs derives from controlsId, so the content
  // region can name itself after the active tab.
  protected get selectedTabButtonId(): string | null {
    const normalizedTabs = (this.tabs ?? []).filter(tab => tab.id?.trim());
    const selectedIndex = normalizedTabs.findIndex(tab => tab.id.trim() === this.selectedTabId && !tab.disabled);
    const resolvedIndex = selectedIndex >= 0 ? selectedIndex : normalizedTabs.findIndex(tab => !tab.disabled);
    return resolvedIndex >= 0 ? `${this.contentId}-tab-${resolvedIndex}` : null;
  }

  protected onTabSelect(id: string): void {
    this.selectedTabId = id;
    this.selectedTabIdChange.emit(id);
  }

  protected overflowing(): boolean {
    return this.expansionEnabled && this.contentHeight() > this.previewHeight + EXPAND_OVERFLOW_TOLERANCE;
  }

  protected clamped(): boolean {
    return this.overflowing() && !this.expanded();
  }

  // Expanded binds the measured content height rather than clearing the clamp,
  // because max-height cannot animate to or from `none`. The resize observer
  // keeps the measurement current, so growing content stays fully visible.
  protected viewportMaxHeight(): number | null {
    if (!this.overflowing()) {
      return null;
    }
    return this.expanded() ? this.contentHeight() : this.previewHeight;
  }

  protected toggleExpanded(): void {
    this.expanded.update(expanded => !expanded);
  }

  // The control is chevron-only; this label is its entire accessible name.
  protected expandAriaLabel(): string {
    const heading = this.heading?.trim();
    const label = this.expanded() ? 'Show less' : 'Show more';
    return heading ? `${label} of ${heading}` : label;
  }

  // Keyboard focus must never land inside the clipped region: reaching a
  // focusable element below the preview fold expands the card instead of
  // moving focus somewhere invisible. The browser reveals a clipped focus
  // target by silently scrolling the overflow-hidden viewport before focusin
  // fires, so a scrolled viewport is the same signal as a below-fold target;
  // undo that scroll, or the collapsed preview shows the middle of the content.
  protected onViewportFocusIn(event: FocusEvent): void {
    const viewport = this.cardViewportRef?.nativeElement;
    if (!this.clamped() || !viewport || !(event.target instanceof HTMLElement)) {
      return;
    }
    const scrolled = viewport.scrollTop > 0;
    const belowFold = event.target.getBoundingClientRect().bottom > viewport.getBoundingClientRect().bottom;
    if (scrolled || belowFold) {
      viewport.scrollTop = 0;
      this.expanded.set(true);
    }
  }

  private syncContentObserver(): void {
    const content = this.cardContentRef?.nativeElement;
    if (!content || typeof ResizeObserver === 'undefined') {
      return;
    }
    if (this.expansionEnabled && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(entries => {
        const measured = entries[entries.length - 1]?.borderBoxSize?.[0]?.blockSize;
        this.contentHeight.set(Math.ceil(measured ?? content.getBoundingClientRect().height));
      });
      this.resizeObserver.observe(content);
    } else if (!this.expansionEnabled && this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
      this.contentHeight.set(0);
      this.expanded.set(false);
    }
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
