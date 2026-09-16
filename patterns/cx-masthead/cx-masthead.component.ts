import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
  afterEveryRender,
  inject,
  OnDestroy,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  viewChild,
  ElementRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  RouterLink,
  RouterLinkActive,
  type IsActiveMatchOptions,
} from "@angular/router";
import { CxIconButtonComponent } from "../../primitives/actions/cx-icon-button";
import {
  CxOverlayStateService,
  type CxOverlayStateHandle,
} from "../../primitives/overlay/overlay-state";
import { type CxIconName } from "../../icons/manifest";
import { CxIconComponent } from "../../primitives/media/cx-icon";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip";

const DEFAULT_ACTIVE_OPTIONS: { exact: boolean } = { exact: true };

export type CxMastheadVariant = "default" | "frosted" | "transparent";

export type CxMastheadItem = {
  id: string;
  label: string;
  /** Router target — renders the link as an in-app `<a routerLink>`, e.g. `['/about']`. */
  routerLink?: string | readonly unknown[];
  /** Optional URL fragment, e.g. an on-page anchor section. */
  fragment?: string;
  /** How `routerLinkActive` decides this item is the current page. Defaults to exact-path. */
  routerLinkActiveOptions?: { exact: boolean } | IsActiveMatchOptions;
  /**
   * Plain link target. When set, the item renders as an `<a href>` instead of an
   * in-app router link — use it for marketing anchors (`#work`) or external URLs.
   */
  href?: string;
  /** Anchor target for {@link href}, e.g. `'_blank'` to open in a new tab. */
  target?: string;
  /** Anchor `rel` for {@link href}; defaults to `'noopener'` for `_blank`. */
  rel?: string;
  /** Marks an `href` item as the current page. Router items derive this automatically. */
  active?: boolean;
  disabled?: boolean;
};

let nextPanelId = 0;

/**
 * Landing-page masthead: brand on the left, primary navigation on the right.
 *
 * Distinct from `cx-top-bar` (in-app page chrome). The masthead is the
 * identity-and-wayfinding banner for a marketing or portfolio surface. Below a
 * narrow container width it collapses its links behind a menu toggle, so it can
 * sit on any page width without overflowing.
 */
@Component({
  selector: "cx-masthead",
  imports: [
    A11yModule,
    CxIconButtonComponent,
    NgTemplateOutlet,
    CxIconComponent,
    CxTooltipDirective,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./cx-masthead.component.html",
  styleUrl: "./cx-masthead.component.scss",
  // Brand slots are authored by the consumer; style their direct root alongside
  // the built-in brand. Every selector belongs to the masthead, including its portal.
  encapsulation: ViewEncapsulation.None,
  host: {
    "[class.cx-masthead-host--sticky]": "sticky || frostOnScroll",
    "[class.cx-masthead-host--overlay]": "overlay",
    "[style.margin-block-end.px]": "overlay ? -headerHeight() : null",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMastheadComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlayState = inject(CxOverlayStateService);
  private overlayHandle?: CxOverlayStateHandle;
  private portaledOverlay?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private scrollTarget?: HTMLElement | Document;
  protected readonly headerHeight = signal(0);
  protected readonly scrolled = signal(false);
  private readonly scrollListener = () => {
    const target = this.scrollTarget;
    const top =
      target === this.document
        ? (this.document.scrollingElement?.scrollTop ?? 0)
        : ((target as HTMLElement | undefined)?.scrollTop ?? 0);
    this.scrolled.set(top > 0);
  };
  private focusPending = false;
  private readonly focusListener = () => this.keepFocusInside();
  private readonly drawerOverlay =
    viewChild<ElementRef<HTMLElement>>("drawerOverlay");
  protected readonly trapsFocus = signal(false);

  constructor() {
    afterEveryRender(() => {
      if (!this.resizeObserver && typeof ResizeObserver !== "undefined") {
        const header =
          this.host.nativeElement.querySelector<HTMLElement>(".cx-masthead")!;
        this.resizeObserver = new ResizeObserver(() => {
          this.headerHeight.set(header.getBoundingClientRect().height);
          this.closeWhenExpanded();
        });
        this.resizeObserver.observe(header);
        this.headerHeight.set(header.getBoundingClientRect().height);
      }
      this.syncScrollTarget();
      this.closeWhenExpanded();
      const root = this.drawerOverlay()?.nativeElement;
      if (this.portaledOverlay && this.portaledOverlay !== root) {
        this.portaledOverlay.remove();
        this.portaledOverlay = undefined;
      }
      if (root && root.parentElement !== this.document.body) {
        // Portal while closed so opening preserves the CSS transition's starting state.
        this.document.body.appendChild(root);
        this.portaledOverlay = root;
      }
      const ownsFocus =
        this.menuOpen() && this.overlayState.isTopmost(this.overlayHandle);
      this.trapsFocus.set(ownsFocus);
      if (ownsFocus && this.focusPending) {
        this.focusPending = false;
        root
          ?.querySelector<HTMLButtonElement>("button")
          ?.focus({ preventScroll: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.closeMenu();
    this.resizeObserver?.disconnect();
    this.portaledOverlay?.remove();
    this.scrollTarget?.removeEventListener("scroll", this.scrollListener);
  }

  private syncScrollTarget(): void {
    let target: HTMLElement | Document | undefined;
    if (this.frostOnScroll && this.host.nativeElement.getClientRects().length) {
      target = this.document;
      for (
        let parent = this.host.nativeElement.parentElement;
        parent &&
        parent !== this.document.body &&
        parent !== this.document.documentElement;
        parent = parent.parentElement
      ) {
        if (
          /^(auto|scroll|hidden|overlay)$/.test(
            this.document.defaultView!.getComputedStyle(parent).overflowY,
          )
        ) {
          target = parent;
          break;
        }
      }
    }
    if (target !== this.scrollTarget) {
      this.scrollTarget?.removeEventListener("scroll", this.scrollListener);
      this.scrollTarget = target;
      target?.addEventListener("scroll", this.scrollListener, {
        passive: true,
      });
    }
    this.scrollListener();
  }

  protected surfaceVariant(): CxMastheadVariant {
    return this.frostOnScroll
      ? this.scrolled()
        ? "frosted"
        : "transparent"
      : this.variant;
  }

  private closeWhenExpanded(): void {
    if (
      this.menuOpen() &&
      !this.menuToggle()?.nativeElement.getClientRects().length
    )
      this.closeMenu();
  }

  private keepFocusInside(): void {
    const root = this.drawerOverlay()?.nativeElement;
    if (
      this.menuOpen() &&
      root &&
      this.overlayState.isTopmost(this.overlayHandle) &&
      !root.contains(this.document.activeElement)
    ) {
      root
        .querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    }
  }

  private itemsValue: CxMastheadItem[] = [];

  /** Brand title shown next to the logo, e.g. a name or product wordmark. */
  @Input() heading = "";
  /** Icon used as the brand mark when no `[brand]` slot or `logoSrc` is provided. */
  @Input() logo: CxIconName | undefined;
  /** Image source for the brand mark; takes precedence over {@link logo}. */
  @Input() logoSrc: string | undefined;
  /**
   * Link target for the brand cluster (clicking the logo/title goes here),
   * e.g. `'/'` or `'#top'`. For in-app router navigation, provide your own
   * `<a brand routerLink>` via the `[brand]` slot instead.
   */
  @Input() homeHref: string | undefined;
  /** Primary navigation links. */
  @Input()
  public set items(value: CxMastheadItem[]) {
    this.itemsValue = validateMastheadItems(value);
    if (!this.itemsValue.length) this.closeMenu();
  }
  public get items(): CxMastheadItem[] {
    return this.itemsValue;
  }
  /** Surface treatment. Frosted uses a translucent, theme-aware surface with backdrop blur. */
  @Input() variant: CxMastheadVariant = "default";
  /** Sticks the component host to the top of its scroll container. */
  @Input({ transform: booleanAttribute }) sticky = false;
  /** Overlaps the next sibling without moving content when its surface changes. */
  @Input({ transform: booleanAttribute }) overlay = false;
  /** Pins the masthead, transparent at the scroll origin and frosted after scrolling. */
  @Input({ transform: booleanAttribute }) frostOnScroll = false;
  /** Optional toggle label override; otherwise announces Open menu or Close menu. */
  @Input() menuAriaLabel: string | undefined;

  /** Emits when a navigation item is activated. */
  @Output() readonly itemSelect = new EventEmitter<CxMastheadItem>();

  protected readonly panelId = `cx-masthead-panel-${nextPanelId++}`;
  protected readonly menuOpen = signal(false);
  private readonly menuToggle =
    viewChild<ElementRef<HTMLButtonElement>>("menuToggle");

  protected hasDefaultBrand(): boolean {
    return Boolean(this.heading?.trim() || this.logo || this.logoSrc);
  }

  protected activeOptions(
    item: CxMastheadItem,
  ): { exact: boolean } | IsActiveMatchOptions {
    return item.routerLinkActiveOptions ?? DEFAULT_ACTIVE_OPTIONS;
  }

  protected resolvedMenuAriaLabel(): string {
    return (
      this.menuAriaLabel?.trim() ||
      (this.menuOpen() ? "Close menu" : "Open menu")
    );
  }

  protected toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }
    this.overlayHandle = this.overlayState.capture({
      owner: this.menuToggle()?.nativeElement,
      surface: () => this.drawerOverlay()?.nativeElement,
      isActive: () => this.menuOpen(),
      onEscape: () => this.closeMenu(),
    });
    this.menuOpen.set(true);
    this.focusPending = true;
    this.document.addEventListener("focusin", this.focusListener);
  }

  protected closeMenu(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
    this.document.removeEventListener("focusin", this.focusListener);
    this.trapsFocus.set(false);
    this.menuOpen.set(false);
    this.focusPending = false;
  }

  protected onBackdrop(event: MouseEvent): void {
    if (
      event.target === event.currentTarget &&
      this.overlayState.isTopmost(this.overlayHandle)
    )
      this.closeMenu();
  }

  protected onItemClick(event: MouseEvent, item: CxMastheadItem): void {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.closeMenu();
    this.itemSelect.emit(item);
  }
}

function validateMastheadItems(value: CxMastheadItem[]): CxMastheadItem[] {
  if (!Array.isArray(value)) {
    throw new Error("[cx-masthead] items must be an array.");
  }

  const ids = new Set<string>();
  const labels = new Set<string>();
  value.forEach((item, index) => {
    const id = typeof item?.id === "string" ? item.id.trim() : "";
    if (!id) {
      throw new Error(
        `[cx-masthead] item at index ${index} requires a non-empty id.`,
      );
    }
    if (ids.has(id)) {
      throw new Error(`[cx-masthead] item id "${id}" must be unique.`);
    }
    ids.add(id);

    const label = typeof item?.label === "string" ? item.label.trim() : "";
    const labelKey = label.toLowerCase();
    if (labels.has(labelKey)) {
      throw new Error(`[cx-masthead] item label "${label}" must be unique.`);
    }
    labels.add(labelKey);
  });

  return [...value];
}
