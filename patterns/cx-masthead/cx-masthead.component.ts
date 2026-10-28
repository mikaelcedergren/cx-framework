import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
  afterEveryRender,
  inject,
  OnDestroy,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  signal,
  viewChild,
  ElementRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationError,
  Router,
  RouterLink,
  RouterLinkActive,
  type IsActiveMatchOptions,
} from "@angular/router";
import {
  CxOverlayStateService,
  type CxOverlayStateHandle,
} from "../../primitives/overlay/overlay-state";
import { type CxIconName } from "../../icons/manifest";
import { CxIconComponent } from "../../primitives/media/cx-icon";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip";
import { CxHostVisibilityObserver } from "../../primitives/shared/host-visibility";

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

/** Navigation sections for the compact menu, independent of the desktop links. */
export type CxMastheadGroup = {
  id: string;
  label?: string;
  /** A labelled section can disclose its links instead of showing them all. */
  collapsible?: boolean;
  items: CxMastheadItem[];
};

let nextPanelId = 0;

/**
 * Masthead: brand on the left, primary navigation and actions on the right.
 *
 * Distinct from `cx-top-bar` (in-app page chrome). The masthead is the
 * identity-and-wayfinding banner. Below a narrow container width it collapses
 * links into its menu; larger products can supply grouped compact navigation
 * and a menu footer without changing the desktop links or drawer behavior.
 */
@Component({
  selector: "cx-masthead",
  imports: [
    A11yModule,
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
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMastheadComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly activeUrl = signal(this.router?.url ?? "");
  private overlayHandle?: CxOverlayStateHandle;
  private portaledMenu?: HTMLElement;
  private closingAnimationsPending = false;
  private readonly positionListener = () => this.syncMenuPosition();
  private readonly visibilityObserver = new CxHostVisibilityObserver(
    this.host.nativeElement,
    (visible) => {
      if (!visible) this.finishClose();
    },
  );
  private resizeObserver?: ResizeObserver;
  private brandResizeObserver?: ResizeObserver;
  private brandObservedElements: Element[] = [];
  private brandMutationObserver?: MutationObserver;
  private readonly fontListener = () => this.syncBrandFit();
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
  private readonly closingKeyListener = (event: KeyboardEvent) => {
    if (
      event.key === "Tab" &&
      this.menuClosing() &&
      this.overlayState.isTopmost(this.overlayHandle)
    ) {
      event.preventDefault();
      this.menuToggle()?.nativeElement.focus({ preventScroll: true });
    }
  };
  private readonly drawerOverlay =
    viewChild<ElementRef<HTMLElement>>("drawerOverlay");
  private readonly menuSurface =
    viewChild<ElementRef<HTMLElement>>("menuSurface");
  private readonly menuSlot = viewChild<ElementRef<HTMLElement>>("menuSlot");
  protected readonly menuClosing = signal(false);
  protected readonly trapsFocus = signal(false);

  constructor() {
    const navigation = this.router?.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeUrl.set(event.urlAfterRedirects);
        this.expandedGroups.set(new Map());
        this.closeMenu();
      } else if (event instanceof NavigationError) {
        this.closeMenu();
      }
    });
    inject(DestroyRef).onDestroy(() => navigation?.unsubscribe());
    afterEveryRender(() => {
      this.observeBrandFit();
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
      const root = this.menuSurface()?.nativeElement;
      if (this.portaledMenu && this.portaledMenu !== root) this.finishClose();
      this.syncMenuPosition();
      const ownsFocus =
        (this.menuOpen() || this.menuClosing()) &&
        this.overlayState.isTopmost(this.overlayHandle);
      this.trapsFocus.set(ownsFocus);
      if (ownsFocus && this.focusPending) {
        this.focusPending = false;
        root
          ?.querySelector<HTMLButtonElement>("button")
          ?.focus({ preventScroll: true });
      }
      if (this.menuClosing() && !this.closingAnimationsPending) {
        this.closingAnimationsPending = true;
        // Keep the same button above the departing drawer until its X has
        // finished becoming a hamburger, including reduced-motion (no animations).
        void Promise.allSettled(
          root
            ?.getAnimations({ subtree: true })
            .map((animation) => animation.finished) ?? [],
        ).then(() => {
          if (this.menuClosing()) this.finishClose();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.finishClose();
    this.resizeObserver?.disconnect();
    this.brandResizeObserver?.disconnect();
    this.brandMutationObserver?.disconnect();
    this.document.fonts?.removeEventListener("loadingdone", this.fontListener);
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
      this.portaledMenu &&
      !this.menuSlot()?.nativeElement.getClientRects().length
    )
      this.finishClose();
  }

  private syncMenuPosition(): void {
    if (!this.portaledMenu) return;
    const slot = this.menuSlot()?.nativeElement;
    const toggle = this.menuToggle()?.nativeElement;
    if (!slot?.getClientRects().length || !toggle) {
      this.finishClose();
      return;
    }
    const rect = slot.getBoundingClientRect();
    toggle.style.top = `${rect.top}px`;
    toggle.style.left = `${rect.left}px`;
  }

  private keepFocusInside(): void {
    const root = this.menuSurface()?.nativeElement;
    if (
      (this.menuOpen() || this.menuClosing()) &&
      root &&
      this.overlayState.isTopmost(this.overlayHandle) &&
      (this.menuClosing()
        ? this.document.activeElement !== this.menuToggle()?.nativeElement
        : !root.contains(this.document.activeElement))
    ) {
      root
        .querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    }
  }

  private itemsValue: CxMastheadItem[] = [];
  private menuGroupsValue: CxMastheadGroup[] = [];
  private readonly expandedGroups = signal<ReadonlyMap<string, boolean>>(
    new Map(),
  );

  private observeBrandFit(): void {
    const inner = this.host.nativeElement.querySelector<HTMLElement>(
      ".cx-masthead__inner",
    );
    const brand = inner?.querySelector<HTMLElement>(".cx-masthead__brand");
    const cluster = inner?.querySelector<HTMLElement>(".cx-masthead__cluster");
    if (!inner || !brand || !cluster || typeof ResizeObserver === "undefined")
      return;
    const parts = Array.from(
      brand.querySelectorAll<HTMLElement>(
        "[cxMastheadName], [cxMastheadSymbol]",
      ),
    );
    const elements = [inner, cluster, brand, ...parts];
    if (
      elements.length === this.brandObservedElements.length &&
      elements.every(
        (element, index) => element === this.brandObservedElements[index],
      )
    )
      return;

    if (!this.brandResizeObserver) {
      this.brandResizeObserver = new ResizeObserver(() => this.syncBrandFit());
      this.brandMutationObserver = new MutationObserver(() => {
        this.observeBrandFit();
        this.syncBrandFit();
      });
      this.document.fonts?.addEventListener("loadingdone", this.fontListener);
    }
    this.brandResizeObserver.disconnect();
    // Observe available space and intrinsic parts, not the brand wrapper whose
    // width we change. Content changes also matter while the name is clipped.
    [inner, cluster, ...parts].forEach((element) =>
      this.brandResizeObserver!.observe(element),
    );
    this.brandMutationObserver!.disconnect();
    this.brandMutationObserver!.observe(brand, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    this.brandObservedElements = elements;
    this.syncBrandFit();
  }

  /**
   * Custom brands opt in with cxMastheadSymbol and cxMastheadName on their
   * symbol and name. The name remains in the accessibility tree when compact.
   */
  private syncBrandFit(): void {
    const [inner, cluster, brand] = this.brandObservedElements as HTMLElement[];
    if (!brand) return;
    const name = brand.querySelector<HTMLElement>("[cxMastheadName]");
    const symbol = brand.querySelector<HTMLElement>("[cxMastheadSymbol]");
    brand.classList.remove("cx-masthead__brand--symbol-only");
    if (!name || !symbol) return;

    // Measure the unshrunk brand synchronously, even when its name was hidden.
    // Reusing its compact width would oscillate between the two presentations.
    brand.classList.add("cx-masthead__brand--measuring");
    // Use layout dimensions throughout, so a scaled preview has the same fit.
    const fullWidth = brand.offsetWidth;
    const style = this.document.defaultView!.getComputedStyle(inner);
    const available =
      inner.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      cluster.offsetWidth -
      parseFloat(style.columnGap);
    brand.classList.remove("cx-masthead__brand--measuring");
    brand.classList.toggle(
      "cx-masthead__brand--symbol-only",
      fullWidth > available + 0.5,
    );
  }

  /** Brand name. With a logo, it becomes visually hidden when the full brand no longer fits. */
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
    if (!this.hasMenuNavigation()) this.finishClose();
  }
  public get items(): CxMastheadItem[] {
    return this.itemsValue;
  }
  /**
   * Compact-menu sections. Nonempty sections replace `items` inside the drawer;
   * desktop links are unchanged. Empty sections are omitted.
   */
  @Input()
  public set menuGroups(value: CxMastheadGroup[]) {
    this.menuGroupsValue = validateMastheadGroups(value);
    const previous = this.expandedGroups();
    this.expandedGroups.set(
      new Map(
        this.menuGroupsValue
          .filter((group) => previous.has(group.id))
          .map((group) => [group.id, previous.get(group.id)!]),
      ),
    );
    if (!this.hasMenuNavigation()) this.finishClose();
  }
  public get menuGroups(): CxMastheadGroup[] {
    return this.menuGroupsValue;
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

  protected hasMenuNavigation(): boolean {
    return this.menuGroups.length > 0 || this.items.length > 0;
  }

  protected groupContainsActive(group: CxMastheadGroup): boolean {
    this.activeUrl();
    return group.items.some((item) => {
      if (item.disabled) return false;
      if (item.href !== undefined || item.routerLink === undefined)
        return Boolean(item.active);
      if (!this.router) return false;
      const tree = this.router.createUrlTree(
        typeof item.routerLink === "string"
          ? [item.routerLink]
          : [...item.routerLink],
        { relativeTo: this.route, fragment: item.fragment },
      );
      const options = this.activeOptions(item);
      return "exact" in options
        ? this.router.isActive(tree, options.exact)
        : this.router.isActive(tree, options);
    });
  }

  protected groupExpanded(group: CxMastheadGroup): boolean {
    return (
      !group.collapsible ||
      (this.expandedGroups().get(group.id) ?? this.groupContainsActive(group))
    );
  }

  protected toggleGroup(group: CxMastheadGroup): void {
    const expanded = !this.groupExpanded(group);
    this.expandedGroups.update((groups) =>
      new Map(groups).set(group.id, expanded),
    );
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
    if (this.menuClosing()) return;
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }
    this.overlayHandle = this.overlayState.capture({
      owner: this.menuToggle()?.nativeElement,
      surface: () => this.menuSurface()?.nativeElement,
      isActive: () => this.menuOpen() || this.menuClosing(),
      onEscape: () => this.closeMenu(),
    });
    const root = this.menuSurface()!.nativeElement;
    // Lift the actual control and drawer together out of sticky/frosted stacking
    // contexts. The empty slot preserves the header's geometry and button position.
    root.classList.add("cx-masthead__menu--portaled");
    this.document.body.appendChild(root);
    this.portaledMenu = root;
    this.syncMenuPosition();
    this.document.addEventListener("scroll", this.positionListener, true);
    this.document.defaultView?.addEventListener(
      "resize",
      this.positionListener,
    );
    this.visibilityObserver.start();
    // Establish the closed styles after reparenting before starting both animations.
    this.drawerOverlay()!.nativeElement.getBoundingClientRect();
    this.menuOpen.set(true);
    this.focusPending = true;
    this.document.addEventListener("focusin", this.focusListener);
    this.document.addEventListener("keydown", this.closingKeyListener);
  }

  protected closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuClosing.set(true);
    this.menuOpen.set(false);
    this.focusPending = false;
  }

  private finishClose(): void {
    this.document.removeEventListener("scroll", this.positionListener, true);
    this.document.defaultView?.removeEventListener(
      "resize",
      this.positionListener,
    );
    this.visibilityObserver.stop();
    if (this.portaledMenu) {
      const slot = this.menuSlot()?.nativeElement;
      if (slot) slot.appendChild(this.portaledMenu);
      else this.portaledMenu.remove();
      this.portaledMenu.classList.remove("cx-masthead__menu--portaled");
      this.portaledMenu = undefined;
    }
    const toggle = this.menuToggle()?.nativeElement;
    toggle?.style.removeProperty("top");
    toggle?.style.removeProperty("left");
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
    this.document.removeEventListener("focusin", this.focusListener);
    this.document.removeEventListener("keydown", this.closingKeyListener);
    this.trapsFocus.set(false);
    this.menuOpen.set(false);
    this.menuClosing.set(false);
    this.closingAnimationsPending = false;
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

function validateMastheadItems(
  value: CxMastheadItem[],
  context = "items",
  ids = new Set<string>(),
): CxMastheadItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`[cx-masthead] ${context} must be an array.`);
  }

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
    if (!label) {
      throw new Error(`[cx-masthead] item "${id}" requires a non-empty label.`);
    }
    const labelKey = label.toLowerCase();
    if (labels.has(labelKey)) {
      throw new Error(`[cx-masthead] item label "${label}" must be unique.`);
    }
    labels.add(labelKey);
  });

  return [...value];
}

function validateMastheadGroups(value: CxMastheadGroup[]): CxMastheadGroup[] {
  if (!Array.isArray(value)) {
    throw new Error("[cx-masthead] menuGroups must be an array.");
  }
  const groupIds = new Set<string>();
  const itemIds = new Set<string>();
  return value
    .map((group, index) => {
      const id = typeof group?.id === "string" ? group.id.trim() : "";
      if (!id) {
        throw new Error(
          `[cx-masthead] menuGroups[${index}] requires a non-empty id.`,
        );
      }
      if (groupIds.has(id)) {
        throw new Error(`[cx-masthead] menu group id "${id}" must be unique.`);
      }
      groupIds.add(id);
      if (group.label !== undefined && typeof group.label !== "string") {
        throw new Error(
          `[cx-masthead] menu group "${id}" label must be a string.`,
        );
      }
      if (group.collapsible && !group.label?.trim()) {
        throw new Error(
          `[cx-masthead] collapsible menu group "${id}" requires a label.`,
        );
      }
      return {
        ...group,
        items: validateMastheadItems(
          group.items,
          `menuGroups[${index}].items`,
          itemIds,
        ),
      };
    })
    .filter((group) => group.items.length > 0);
}
