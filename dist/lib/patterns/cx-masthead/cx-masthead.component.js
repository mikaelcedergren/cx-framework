import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import { afterEveryRender, inject, booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, viewChild, ElementRef, ViewEncapsulation, } from "@angular/core";
import { RouterLink, RouterLinkActive, } from "@angular/router";
import { CxOverlayStateService, } from "../../primitives/overlay/overlay-state.js";
import { CxIconComponent } from "../../primitives/media/cx-icon/index.js";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip/index.js";
import { CxHostVisibilityObserver } from "../../primitives/shared/host-visibility.js";
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
const DEFAULT_ACTIVE_OPTIONS = { exact: true };
let nextPanelId = 0;
/**
 * Landing-page masthead: brand on the left, primary navigation on the right.
 *
 * Distinct from `cx-top-bar` (in-app page chrome). The masthead is the
 * identity-and-wayfinding banner for a marketing or portfolio surface. Below a
 * narrow container width it collapses its links behind a menu toggle, so it can
 * sit on any page width without overflowing.
 */
export class CxMastheadComponent {
    document = inject(DOCUMENT);
    host = inject(ElementRef);
    overlayState = inject(CxOverlayStateService);
    overlayHandle;
    portaledMenu;
    closingAnimationsPending = false;
    positionListener = () => this.syncMenuPosition();
    visibilityObserver = new CxHostVisibilityObserver(this.host.nativeElement, (visible) => {
        if (!visible)
            this.finishClose();
    });
    resizeObserver;
    scrollTarget;
    headerHeight = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "headerHeight" }] : /* istanbul ignore next */ []));
    scrolled = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "scrolled" }] : /* istanbul ignore next */ []));
    scrollListener = () => {
        const target = this.scrollTarget;
        const top = target === this.document
            ? (this.document.scrollingElement?.scrollTop ?? 0)
            : (target?.scrollTop ?? 0);
        this.scrolled.set(top > 0);
    };
    focusPending = false;
    focusListener = () => this.keepFocusInside();
    closingKeyListener = (event) => {
        if (event.key === "Tab" &&
            this.menuClosing() &&
            this.overlayState.isTopmost(this.overlayHandle)) {
            event.preventDefault();
            this.menuToggle()?.nativeElement.focus({ preventScroll: true });
        }
    };
    drawerOverlay = viewChild("drawerOverlay", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "drawerOverlay" }] : /* istanbul ignore next */ []));
    menuSurface = viewChild("menuSurface", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuSurface" }] : /* istanbul ignore next */ []));
    menuSlot = viewChild("menuSlot", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuSlot" }] : /* istanbul ignore next */ []));
    menuClosing = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuClosing" }] : /* istanbul ignore next */ []));
    trapsFocus = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "trapsFocus" }] : /* istanbul ignore next */ []));
    constructor() {
        afterEveryRender(() => {
            if (!this.resizeObserver && typeof ResizeObserver !== "undefined") {
                const header = this.host.nativeElement.querySelector(".cx-masthead");
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
            if (this.portaledMenu && this.portaledMenu !== root)
                this.finishClose();
            this.syncMenuPosition();
            const ownsFocus = (this.menuOpen() || this.menuClosing()) &&
                this.overlayState.isTopmost(this.overlayHandle);
            this.trapsFocus.set(ownsFocus);
            if (ownsFocus && this.focusPending) {
                this.focusPending = false;
                root
                    ?.querySelector("button")
                    ?.focus({ preventScroll: true });
            }
            if (this.menuClosing() && !this.closingAnimationsPending) {
                this.closingAnimationsPending = true;
                // Keep the same button above the departing drawer until its X has
                // finished becoming a hamburger, including reduced-motion (no animations).
                void Promise.allSettled(root
                    ?.getAnimations({ subtree: true })
                    .map((animation) => animation.finished) ?? []).then(() => {
                    if (this.menuClosing())
                        this.finishClose();
                });
            }
        });
    }
    ngOnDestroy() {
        this.finishClose();
        this.resizeObserver?.disconnect();
        this.scrollTarget?.removeEventListener("scroll", this.scrollListener);
    }
    syncScrollTarget() {
        let target;
        if (this.frostOnScroll && this.host.nativeElement.getClientRects().length) {
            target = this.document;
            for (let parent = this.host.nativeElement.parentElement; parent &&
                parent !== this.document.body &&
                parent !== this.document.documentElement; parent = parent.parentElement) {
                if (/^(auto|scroll|hidden|overlay)$/.test(this.document.defaultView.getComputedStyle(parent).overflowY)) {
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
    surfaceVariant() {
        return this.frostOnScroll
            ? this.scrolled()
                ? "frosted"
                : "transparent"
            : this.variant;
    }
    closeWhenExpanded() {
        if (this.portaledMenu &&
            !this.menuSlot()?.nativeElement.getClientRects().length)
            this.finishClose();
    }
    syncMenuPosition() {
        if (!this.portaledMenu)
            return;
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
    keepFocusInside() {
        const root = this.menuSurface()?.nativeElement;
        if ((this.menuOpen() || this.menuClosing()) &&
            root &&
            this.overlayState.isTopmost(this.overlayHandle) &&
            (this.menuClosing()
                ? this.document.activeElement !== this.menuToggle()?.nativeElement
                : !root.contains(this.document.activeElement))) {
            root
                .querySelector("button")
                ?.focus({ preventScroll: true });
        }
    }
    itemsValue = [];
    /** Brand title shown next to the logo, e.g. a name or product wordmark. */
    heading = "";
    /** Icon used as the brand mark when no `[brand]` slot or `logoSrc` is provided. */
    logo;
    /** Image source for the brand mark; takes precedence over {@link logo}. */
    logoSrc;
    /**
     * Link target for the brand cluster (clicking the logo/title goes here),
     * e.g. `'/'` or `'#top'`. For in-app router navigation, provide your own
     * `<a brand routerLink>` via the `[brand]` slot instead.
     */
    homeHref;
    /** Primary navigation links. */
    set items(value) {
        this.itemsValue = validateMastheadItems(value);
        if (!this.itemsValue.length)
            this.finishClose();
    }
    get items() {
        return this.itemsValue;
    }
    /** Surface treatment. Frosted uses a translucent, theme-aware surface with backdrop blur. */
    variant = "default";
    /** Sticks the component host to the top of its scroll container. */
    sticky = false;
    /** Overlaps the next sibling without moving content when its surface changes. */
    overlay = false;
    /** Pins the masthead, transparent at the scroll origin and frosted after scrolling. */
    frostOnScroll = false;
    /** Optional toggle label override; otherwise announces Open menu or Close menu. */
    menuAriaLabel;
    /** Emits when a navigation item is activated. */
    itemSelect = new EventEmitter();
    panelId = `cx-masthead-panel-${nextPanelId++}`;
    menuOpen = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuOpen" }] : /* istanbul ignore next */ []));
    menuToggle = viewChild("menuToggle", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "menuToggle" }] : /* istanbul ignore next */ []));
    hasDefaultBrand() {
        return Boolean(this.heading?.trim() || this.logo || this.logoSrc);
    }
    activeOptions(item) {
        return item.routerLinkActiveOptions ?? DEFAULT_ACTIVE_OPTIONS;
    }
    resolvedMenuAriaLabel() {
        return (this.menuAriaLabel?.trim() ||
            (this.menuOpen() ? "Close menu" : "Open menu"));
    }
    toggleMenu() {
        if (this.menuClosing())
            return;
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
        const root = this.menuSurface().nativeElement;
        // Lift the actual control and drawer together out of sticky/frosted stacking
        // contexts. The empty slot preserves the header's geometry and button position.
        root.classList.add("cx-masthead__menu--portaled");
        this.document.body.appendChild(root);
        this.portaledMenu = root;
        this.syncMenuPosition();
        this.document.addEventListener("scroll", this.positionListener, true);
        this.document.defaultView?.addEventListener("resize", this.positionListener);
        this.visibilityObserver.start();
        // Establish the closed styles after reparenting before starting both animations.
        this.drawerOverlay().nativeElement.getBoundingClientRect();
        this.menuOpen.set(true);
        this.focusPending = true;
        this.document.addEventListener("focusin", this.focusListener);
        this.document.addEventListener("keydown", this.closingKeyListener);
    }
    closeMenu() {
        if (!this.menuOpen())
            return;
        this.menuClosing.set(true);
        this.menuOpen.set(false);
        this.focusPending = false;
    }
    finishClose() {
        this.document.removeEventListener("scroll", this.positionListener, true);
        this.document.defaultView?.removeEventListener("resize", this.positionListener);
        this.visibilityObserver.stop();
        if (this.portaledMenu) {
            const slot = this.menuSlot()?.nativeElement;
            if (slot)
                slot.appendChild(this.portaledMenu);
            else
                this.portaledMenu.remove();
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
    onBackdrop(event) {
        if (event.target === event.currentTarget &&
            this.overlayState.isTopmost(this.overlayHandle))
            this.closeMenu();
    }
    onItemClick(event, item) {
        if (item.disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        this.closeMenu();
        this.itemSelect.emit(item);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMastheadComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxMastheadComponent, isStandalone: true, selector: "cx-masthead", inputs: { heading: "heading", logo: "logo", logoSrc: "logoSrc", homeHref: "homeHref", items: "items", variant: "variant", sticky: ["sticky", "sticky", booleanAttribute], overlay: ["overlay", "overlay", booleanAttribute], frostOnScroll: ["frostOnScroll", "frostOnScroll", booleanAttribute], menuAriaLabel: "menuAriaLabel" }, outputs: { itemSelect: "itemSelect" }, host: { properties: { "class.cx-masthead-host--sticky": "sticky || frostOnScroll", "class.cx-masthead-host--overlay": "overlay", "style.margin-block-end.px": "overlay ? -headerHeight() : null" } }, viewQueries: [{ propertyName: "drawerOverlay", first: true, predicate: ["drawerOverlay"], descendants: true, isSignal: true }, { propertyName: "menuSurface", first: true, predicate: ["menuSurface"], descendants: true, isSignal: true }, { propertyName: "menuSlot", first: true, predicate: ["menuSlot"], descendants: true, isSignal: true }, { propertyName: "menuToggle", first: true, predicate: ["menuToggle"], descendants: true, isSignal: true }], ngImport: i0, template: "<header\n  class=\"cx-masthead\"\n  [class.cx-masthead--frosted]=\"surfaceVariant() === 'frosted'\"\n  [class.cx-masthead--transparent]=\"surfaceVariant() === 'transparent'\"\n>\n  <div class=\"cx-masthead__inner\">\n    <div class=\"cx-masthead__brand\">\n      <ng-content select=\"[brand], [cxMastheadBrand]\" />\n      @if (hasDefaultBrand()) {\n        @if (homeHref) {\n          <a\n            class=\"cx-masthead__home\"\n            [href]=\"homeHref\"\n            [cxTooltip]=\"heading\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            <ng-container [ngTemplateOutlet]=\"brandContent\" />\n          </a>\n        } @else {\n          <span\n            class=\"cx-masthead__home cx-masthead__home--static\"\n            [cxTooltip]=\"heading\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            <ng-container [ngTemplateOutlet]=\"brandContent\" />\n          </span>\n        }\n      }\n    </div>\n\n    <div class=\"cx-masthead__cluster\">\n      @if (items.length) {\n        <nav class=\"cx-masthead__nav\" aria-label=\"Primary\">\n          <ul class=\"cx-masthead__links\">\n            @for (item of items; track item.id) {\n              <li class=\"cx-masthead__links-item\">\n                <ng-container\n                  [ngTemplateOutlet]=\"navLink\"\n                  [ngTemplateOutletContext]=\"{ $implicit: item }\"\n                />\n              </li>\n            }\n          </ul>\n        </nav>\n      }\n\n      <div class=\"cx-masthead__actions\">\n        <ng-content select=\"[actions], [cxMastheadActions]\" />\n      </div>\n\n      @if (items.length) {\n        <div #menuSlot class=\"cx-masthead__toggle-slot\">\n          <div\n            #menuSurface\n            class=\"cx-masthead__menu\"\n            [id]=\"panelId\"\n            [class.cx-masthead__menu--closing]=\"menuClosing()\"\n            [attr.role]=\"menuOpen() || menuClosing() ? 'dialog' : null\"\n            [attr.aria-modal]=\"menuOpen() || menuClosing() ? 'true' : null\"\n            [attr.aria-label]=\"menuOpen() || menuClosing() ? 'Menu' : null\"\n            [cdkTrapFocus]=\"trapsFocus()\"\n          >\n            <button\n              #menuToggle\n              class=\"cx-masthead__toggle\"\n              [class.cx-masthead__toggle--open]=\"menuOpen()\"\n              type=\"button\"\n              aria-haspopup=\"dialog\"\n              [attr.aria-expanded]=\"menuOpen()\"\n              [attr.aria-controls]=\"panelId\"\n              [attr.aria-label]=\"resolvedMenuAriaLabel()\"\n              [attr.aria-disabled]=\"menuClosing() ? 'true' : null\"\n              (click)=\"toggleMenu()\"\n            >\n              <span class=\"cx-masthead__toggle-icon\" aria-hidden=\"true\">\n                <span class=\"cx-masthead__toggle-line\"></span>\n                <span class=\"cx-masthead__toggle-line\"></span>\n                <span class=\"cx-masthead__toggle-line\"></span>\n              </span>\n            </button>\n            <div\n              #drawerOverlay\n              class=\"cx-masthead__overlay\"\n              [class.cx-masthead__overlay--open]=\"menuOpen()\"\n              [inert]=\"!menuOpen()\"\n              [attr.aria-hidden]=\"menuOpen() ? null : 'true'\"\n              (click)=\"onBackdrop($event)\"\n            >\n              <section\n                class=\"cx-masthead__drawer\"\n                [style.padding-block-start]=\"\n                  'max(' + headerHeight() + 'px, env(safe-area-inset-top))'\n                \"\n              >\n                <nav class=\"cx-masthead__drawer-nav\" aria-label=\"Primary\">\n                  <ul class=\"cx-masthead__drawer-links\">\n                    @for (item of items; track item.id) {\n                      <li class=\"cx-masthead__links-item\">\n                        <ng-container\n                          [ngTemplateOutlet]=\"navLink\"\n                          [ngTemplateOutletContext]=\"{ $implicit: item }\"\n                        />\n                      </li>\n                    }\n                  </ul>\n                </nav>\n              </section>\n            </div>\n          </div>\n        </div>\n      }\n    </div>\n  </div>\n</header>\n\n<ng-template #brandContent>\n  @if (logoSrc) {\n    <img class=\"cx-masthead__logo\" [src]=\"logoSrc\" alt=\"\" aria-hidden=\"true\" />\n  } @else if (logo) {\n    <cx-icon class=\"cx-masthead__logo-icon\" [icon]=\"logo\" [size]=\"24\" />\n  }\n  @if (heading) {\n    <span class=\"cx-masthead__title\" data-cx-tooltip-overflow>{{\n      heading\n    }}</span>\n  }\n</ng-template>\n\n<ng-template #navLink let-item>\n  @if (item.href !== undefined) {\n    <a\n      class=\"cx-masthead__link\"\n      [class.cx-masthead__link--active]=\"item.active\"\n      [class.cx-masthead__link--disabled]=\"item.disabled\"\n      [attr.href]=\"item.disabled ? null : item.href\"\n      [attr.target]=\"item.target ?? null\"\n      [attr.rel]=\"item.rel ?? (item.target === '_blank' ? 'noopener' : null)\"\n      [attr.aria-current]=\"item.active && !item.disabled ? 'page' : null\"\n      [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n      [attr.tabindex]=\"item.disabled ? '-1' : null\"\n      (click)=\"onItemClick($event, item)\"\n      >{{ item.label }}</a\n    >\n  } @else if (item.routerLink !== undefined) {\n    <a\n      class=\"cx-masthead__link\"\n      [class.cx-masthead__link--disabled]=\"item.disabled\"\n      [routerLink]=\"item.disabled ? null : item.routerLink\"\n      [fragment]=\"item.disabled ? undefined : item.fragment\"\n      routerLinkActive=\"cx-masthead__link--active\"\n      [routerLinkActiveOptions]=\"activeOptions(item)\"\n      #rla=\"routerLinkActive\"\n      [attr.aria-current]=\"rla.isActive && !item.disabled ? 'page' : null\"\n      [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n      [attr.tabindex]=\"item.disabled ? '-1' : null\"\n      (click)=\"onItemClick($event, item)\"\n      >{{ item.label }}</a\n    >\n  } @else {\n    <button\n      class=\"cx-masthead__link\"\n      type=\"button\"\n      [class.cx-masthead__link--active]=\"item.active\"\n      [class.cx-masthead__link--disabled]=\"item.disabled\"\n      [disabled]=\"item.disabled\"\n      [attr.aria-current]=\"item.active ? 'page' : null\"\n      (click)=\"onItemClick($event, item)\"\n    >\n      {{ item.label }}\n    </button>\n  }\n</ng-template>\n", styles: ["cx-masthead{display:block}cx-masthead.cx-masthead-host--overlay{position:relative;z-index:var(--z-index-sticky)}cx-masthead.cx-masthead-host--sticky{position:sticky;top:0;z-index:var(--z-index-sticky)}.cx-masthead{display:block;container-type:inline-size;min-width:0;border-bottom:var(--line);background:var(--surface);box-sizing:border-box;transition:background-color var(--motion-slow) var(--ease-out-in),border-color var(--motion-slow) var(--ease-out-in),-webkit-backdrop-filter var(--motion-slow) var(--ease-out-in),backdrop-filter var(--motion-slow) var(--ease-out-in)}.cx-masthead--transparent{background:rgba(0,0,0,0);border-bottom-color:rgba(0,0,0,0)}@supports(backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)){.cx-masthead--transparent{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}.cx-masthead--frosted{background:color-mix(in srgb, var(--ink) 12%, transparent);-webkit-backdrop-filter:blur(calc(var(--frost-softness) * 12));backdrop-filter:blur(calc(var(--frost-softness) * 12))}}.cx-masthead__inner{display:flex;width:100%;min-width:0;max-height:calc(var(--controller-size-large) + var(--space-md)*2 - var(--border-width));align-items:center;justify-content:space-between;gap:var(--space-lg);padding:var(--space-md) var(--gutter-page);box-sizing:border-box}.cx-masthead__brand{display:inline-flex;min-width:0;align-items:center;flex:0 1 auto}.cx-masthead__brand:empty{display:none}.cx-masthead__brand,.cx-masthead__brand>[brand],.cx-masthead__brand>[cxMastheadBrand],.cx-masthead__home:is(:link,:visited,:hover,:active){color:var(--ink);text-decoration:none}.cx-masthead__home{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm);border-radius:var(--radius-sm);color:var(--ink);text-decoration:none}.cx-masthead__home:not(.cx-masthead__home--static):hover .cx-masthead__title{color:var(--ink)}.cx-masthead__home:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-masthead__logo{display:block;width:28px;height:28px;flex:0 0 auto;object-fit:contain}.cx-masthead__logo-icon{display:inline-flex;flex:0 0 auto;color:var(--ink)}.cx-masthead__title{min-width:0;overflow:hidden;color:var(--ink);font-size:var(--font-size-title-3);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);text-overflow:ellipsis;white-space:nowrap}.cx-masthead__cluster{display:inline-flex;min-width:0;align-items:center;flex:0 0 auto;gap:var(--space-lg)}.cx-masthead__cluster:not(:has(.cx-masthead__nav,.cx-masthead__actions>*)){display:none}.cx-masthead:not(:has(.cx-masthead__brand>*,.cx-masthead__nav,.cx-masthead__actions>*)){display:none}.cx-masthead__nav{display:flex;min-width:0}.cx-masthead__links{display:flex;align-items:center;gap:var(--space-2xs);margin:0;padding:0;list-style:none}.cx-masthead__links-item{display:flex;min-width:0}.cx-masthead__actions{display:inline-flex;align-items:center;flex:0 0 auto;gap:var(--space-sm)}.cx-masthead__actions:empty{display:none}.cx-masthead__link{display:inline-flex;min-width:0;align-items:center;padding:var(--space-2xs) var(--space-xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);text-align:left;text-decoration:none;white-space:nowrap;cursor:pointer}.cx-masthead__link:is(:link,:visited,:hover,:active){color:var(--ink);text-decoration:none}.cx-masthead__link:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-masthead__link:active:not(.cx-masthead__link--disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-masthead__link--active{font-weight:var(--font-weight-bold)}.cx-masthead__link--disabled{cursor:default;pointer-events:none;opacity:var(--opacity-disabled)}.cx-masthead__toggle-slot{display:none;width:var(--controller-size-large);height:var(--controller-size-large);flex:0 0 auto;margin-inline-end:calc((var(--icon-size-lg) - var(--controller-size-large))/2)}.cx-masthead__menu{display:contents}.cx-masthead__menu--portaled{display:block;position:fixed;inset:0;z-index:var(--z-index-dialog);pointer-events:none}.cx-masthead__menu--portaled .cx-masthead__toggle{position:fixed;z-index:var(--z-index-sticky);pointer-events:auto}.cx-masthead__menu--closing{pointer-events:auto}.cx-masthead__menu--closing .cx-masthead__toggle{pointer-events:none}.cx-masthead__toggle{display:inline-flex;align-items:center;justify-content:center;width:var(--controller-size-large);height:var(--controller-size-large);padding:0;flex:0 0 auto;border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer}.cx-masthead__toggle:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-masthead__toggle-icon{position:relative;display:block;width:var(--icon-size-lg);height:var(--icon-size-lg);flex:0 0 auto}.cx-masthead__toggle-line{position:absolute;top:50%;left:0;width:100%;height:calc(var(--border-width)*2);border-radius:var(--radius-pill);background:currentColor;transform:translateY(-50%);transform-origin:center;transition:transform calc(var(--motion-slow)*2) var(--ease-out-in),opacity calc(var(--motion-base)*2) var(--ease-out-in)}.cx-masthead__toggle-line:first-child{transform:translateY(calc(-50% - var(--space-xs) - var(--space-2xs)))}.cx-masthead__toggle-line:last-child{transform:translateY(calc(-50% + var(--space-xs) + var(--space-2xs)))}.cx-masthead__toggle--open .cx-masthead__toggle-line:first-child{transform:translateY(-50%) rotate(45deg)}.cx-masthead__toggle--open .cx-masthead__toggle-line:nth-child(2){opacity:0;transform:translateY(-50%) scaleX(0)}.cx-masthead__toggle--open .cx-masthead__toggle-line:last-child{transform:translateY(-50%) rotate(-45deg)}.cx-masthead__overlay{position:fixed;inset:0;display:flex;justify-content:flex-end;background:var(--overlay-backdrop);visibility:hidden;opacity:0;pointer-events:none;transition:opacity var(--motion-slow) var(--ease-out-strong),visibility 0s var(--motion-slow)}.cx-masthead__overlay--open{visibility:visible;opacity:1;pointer-events:auto;transition-delay:0s}.cx-masthead__drawer{display:flex;flex-direction:column;box-sizing:border-box;width:min(var(--measure-sm),100% - var(--space-xl));height:100%;min-height:0;overflow:hidden;padding:max(var(--space-lg),env(safe-area-inset-top)) max(var(--space-lg),env(safe-area-inset-right)) max(var(--space-lg),env(safe-area-inset-bottom)) var(--space-lg);gap:var(--space-lg);background:var(--surface);color:var(--ink);box-shadow:var(--shadow-high);transform:translateX(100%);transition:transform var(--motion-slow) var(--ease-out-strong)}.cx-masthead__overlay--open .cx-masthead__drawer{transform:translateX(0)}.cx-masthead__drawer-nav{min-height:0;overflow:auto;overscroll-behavior:contain;padding:var(--space-xs);padding-inline-end:calc(var(--controller-size-large) + var(--space-sm))}.cx-masthead__drawer-links{display:flex;flex-direction:column;gap:var(--space-sm);margin:0;padding:0;list-style:none}.cx-masthead__drawer .cx-masthead__link{width:100%;min-height:var(--controller-size-large);box-sizing:border-box;padding:var(--space-sm);font-size:var(--font-size-title-3);white-space:normal;overflow-wrap:anywhere}@container (max-width: 719px){.cx-masthead__inner{max-height:calc(var(--controller-size-large) + var(--space-sm)*2 - var(--border-width));padding-block:var(--space-sm)}.cx-masthead__nav{display:none}.cx-masthead__toggle-slot{display:inline-flex}}@media(prefers-reduced-motion: reduce){.cx-masthead,.cx-masthead__overlay,.cx-masthead__drawer,.cx-masthead__link,.cx-masthead__toggle,.cx-masthead__toggle-line{transition:none}}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "directive", type: RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "browserUrl", "routerLink"] }, { kind: "directive", type: RouterLinkActive, selector: "[routerLinkActive]", inputs: ["routerLinkActiveOptions", "ariaCurrentWhenActive", "routerLinkActive"], outputs: ["isActiveChange"], exportAs: ["routerLinkActive"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMastheadComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-masthead", imports: [
                        A11yModule,
                        NgTemplateOutlet,
                        CxIconComponent,
                        CxTooltipDirective,
                        RouterLink,
                        RouterLinkActive,
                    ], encapsulation: ViewEncapsulation.None, host: {
                        "[class.cx-masthead-host--sticky]": "sticky || frostOnScroll",
                        "[class.cx-masthead-host--overlay]": "overlay",
                        "[style.margin-block-end.px]": "overlay ? -headerHeight() : null",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<header\n  class=\"cx-masthead\"\n  [class.cx-masthead--frosted]=\"surfaceVariant() === 'frosted'\"\n  [class.cx-masthead--transparent]=\"surfaceVariant() === 'transparent'\"\n>\n  <div class=\"cx-masthead__inner\">\n    <div class=\"cx-masthead__brand\">\n      <ng-content select=\"[brand], [cxMastheadBrand]\" />\n      @if (hasDefaultBrand()) {\n        @if (homeHref) {\n          <a\n            class=\"cx-masthead__home\"\n            [href]=\"homeHref\"\n            [cxTooltip]=\"heading\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            <ng-container [ngTemplateOutlet]=\"brandContent\" />\n          </a>\n        } @else {\n          <span\n            class=\"cx-masthead__home cx-masthead__home--static\"\n            [cxTooltip]=\"heading\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            <ng-container [ngTemplateOutlet]=\"brandContent\" />\n          </span>\n        }\n      }\n    </div>\n\n    <div class=\"cx-masthead__cluster\">\n      @if (items.length) {\n        <nav class=\"cx-masthead__nav\" aria-label=\"Primary\">\n          <ul class=\"cx-masthead__links\">\n            @for (item of items; track item.id) {\n              <li class=\"cx-masthead__links-item\">\n                <ng-container\n                  [ngTemplateOutlet]=\"navLink\"\n                  [ngTemplateOutletContext]=\"{ $implicit: item }\"\n                />\n              </li>\n            }\n          </ul>\n        </nav>\n      }\n\n      <div class=\"cx-masthead__actions\">\n        <ng-content select=\"[actions], [cxMastheadActions]\" />\n      </div>\n\n      @if (items.length) {\n        <div #menuSlot class=\"cx-masthead__toggle-slot\">\n          <div\n            #menuSurface\n            class=\"cx-masthead__menu\"\n            [id]=\"panelId\"\n            [class.cx-masthead__menu--closing]=\"menuClosing()\"\n            [attr.role]=\"menuOpen() || menuClosing() ? 'dialog' : null\"\n            [attr.aria-modal]=\"menuOpen() || menuClosing() ? 'true' : null\"\n            [attr.aria-label]=\"menuOpen() || menuClosing() ? 'Menu' : null\"\n            [cdkTrapFocus]=\"trapsFocus()\"\n          >\n            <button\n              #menuToggle\n              class=\"cx-masthead__toggle\"\n              [class.cx-masthead__toggle--open]=\"menuOpen()\"\n              type=\"button\"\n              aria-haspopup=\"dialog\"\n              [attr.aria-expanded]=\"menuOpen()\"\n              [attr.aria-controls]=\"panelId\"\n              [attr.aria-label]=\"resolvedMenuAriaLabel()\"\n              [attr.aria-disabled]=\"menuClosing() ? 'true' : null\"\n              (click)=\"toggleMenu()\"\n            >\n              <span class=\"cx-masthead__toggle-icon\" aria-hidden=\"true\">\n                <span class=\"cx-masthead__toggle-line\"></span>\n                <span class=\"cx-masthead__toggle-line\"></span>\n                <span class=\"cx-masthead__toggle-line\"></span>\n              </span>\n            </button>\n            <div\n              #drawerOverlay\n              class=\"cx-masthead__overlay\"\n              [class.cx-masthead__overlay--open]=\"menuOpen()\"\n              [inert]=\"!menuOpen()\"\n              [attr.aria-hidden]=\"menuOpen() ? null : 'true'\"\n              (click)=\"onBackdrop($event)\"\n            >\n              <section\n                class=\"cx-masthead__drawer\"\n                [style.padding-block-start]=\"\n                  'max(' + headerHeight() + 'px, env(safe-area-inset-top))'\n                \"\n              >\n                <nav class=\"cx-masthead__drawer-nav\" aria-label=\"Primary\">\n                  <ul class=\"cx-masthead__drawer-links\">\n                    @for (item of items; track item.id) {\n                      <li class=\"cx-masthead__links-item\">\n                        <ng-container\n                          [ngTemplateOutlet]=\"navLink\"\n                          [ngTemplateOutletContext]=\"{ $implicit: item }\"\n                        />\n                      </li>\n                    }\n                  </ul>\n                </nav>\n              </section>\n            </div>\n          </div>\n        </div>\n      }\n    </div>\n  </div>\n</header>\n\n<ng-template #brandContent>\n  @if (logoSrc) {\n    <img class=\"cx-masthead__logo\" [src]=\"logoSrc\" alt=\"\" aria-hidden=\"true\" />\n  } @else if (logo) {\n    <cx-icon class=\"cx-masthead__logo-icon\" [icon]=\"logo\" [size]=\"24\" />\n  }\n  @if (heading) {\n    <span class=\"cx-masthead__title\" data-cx-tooltip-overflow>{{\n      heading\n    }}</span>\n  }\n</ng-template>\n\n<ng-template #navLink let-item>\n  @if (item.href !== undefined) {\n    <a\n      class=\"cx-masthead__link\"\n      [class.cx-masthead__link--active]=\"item.active\"\n      [class.cx-masthead__link--disabled]=\"item.disabled\"\n      [attr.href]=\"item.disabled ? null : item.href\"\n      [attr.target]=\"item.target ?? null\"\n      [attr.rel]=\"item.rel ?? (item.target === '_blank' ? 'noopener' : null)\"\n      [attr.aria-current]=\"item.active && !item.disabled ? 'page' : null\"\n      [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n      [attr.tabindex]=\"item.disabled ? '-1' : null\"\n      (click)=\"onItemClick($event, item)\"\n      >{{ item.label }}</a\n    >\n  } @else if (item.routerLink !== undefined) {\n    <a\n      class=\"cx-masthead__link\"\n      [class.cx-masthead__link--disabled]=\"item.disabled\"\n      [routerLink]=\"item.disabled ? null : item.routerLink\"\n      [fragment]=\"item.disabled ? undefined : item.fragment\"\n      routerLinkActive=\"cx-masthead__link--active\"\n      [routerLinkActiveOptions]=\"activeOptions(item)\"\n      #rla=\"routerLinkActive\"\n      [attr.aria-current]=\"rla.isActive && !item.disabled ? 'page' : null\"\n      [attr.aria-disabled]=\"item.disabled ? 'true' : null\"\n      [attr.tabindex]=\"item.disabled ? '-1' : null\"\n      (click)=\"onItemClick($event, item)\"\n      >{{ item.label }}</a\n    >\n  } @else {\n    <button\n      class=\"cx-masthead__link\"\n      type=\"button\"\n      [class.cx-masthead__link--active]=\"item.active\"\n      [class.cx-masthead__link--disabled]=\"item.disabled\"\n      [disabled]=\"item.disabled\"\n      [attr.aria-current]=\"item.active ? 'page' : null\"\n      (click)=\"onItemClick($event, item)\"\n    >\n      {{ item.label }}\n    </button>\n  }\n</ng-template>\n", styles: ["cx-masthead{display:block}cx-masthead.cx-masthead-host--overlay{position:relative;z-index:var(--z-index-sticky)}cx-masthead.cx-masthead-host--sticky{position:sticky;top:0;z-index:var(--z-index-sticky)}.cx-masthead{display:block;container-type:inline-size;min-width:0;border-bottom:var(--line);background:var(--surface);box-sizing:border-box;transition:background-color var(--motion-slow) var(--ease-out-in),border-color var(--motion-slow) var(--ease-out-in),-webkit-backdrop-filter var(--motion-slow) var(--ease-out-in),backdrop-filter var(--motion-slow) var(--ease-out-in)}.cx-masthead--transparent{background:rgba(0,0,0,0);border-bottom-color:rgba(0,0,0,0)}@supports(backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)){.cx-masthead--transparent{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}.cx-masthead--frosted{background:color-mix(in srgb, var(--ink) 12%, transparent);-webkit-backdrop-filter:blur(calc(var(--frost-softness) * 12));backdrop-filter:blur(calc(var(--frost-softness) * 12))}}.cx-masthead__inner{display:flex;width:100%;min-width:0;max-height:calc(var(--controller-size-large) + var(--space-md)*2 - var(--border-width));align-items:center;justify-content:space-between;gap:var(--space-lg);padding:var(--space-md) var(--gutter-page);box-sizing:border-box}.cx-masthead__brand{display:inline-flex;min-width:0;align-items:center;flex:0 1 auto}.cx-masthead__brand:empty{display:none}.cx-masthead__brand,.cx-masthead__brand>[brand],.cx-masthead__brand>[cxMastheadBrand],.cx-masthead__home:is(:link,:visited,:hover,:active){color:var(--ink);text-decoration:none}.cx-masthead__home{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm);border-radius:var(--radius-sm);color:var(--ink);text-decoration:none}.cx-masthead__home:not(.cx-masthead__home--static):hover .cx-masthead__title{color:var(--ink)}.cx-masthead__home:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-masthead__logo{display:block;width:28px;height:28px;flex:0 0 auto;object-fit:contain}.cx-masthead__logo-icon{display:inline-flex;flex:0 0 auto;color:var(--ink)}.cx-masthead__title{min-width:0;overflow:hidden;color:var(--ink);font-size:var(--font-size-title-3);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);text-overflow:ellipsis;white-space:nowrap}.cx-masthead__cluster{display:inline-flex;min-width:0;align-items:center;flex:0 0 auto;gap:var(--space-lg)}.cx-masthead__cluster:not(:has(.cx-masthead__nav,.cx-masthead__actions>*)){display:none}.cx-masthead:not(:has(.cx-masthead__brand>*,.cx-masthead__nav,.cx-masthead__actions>*)){display:none}.cx-masthead__nav{display:flex;min-width:0}.cx-masthead__links{display:flex;align-items:center;gap:var(--space-2xs);margin:0;padding:0;list-style:none}.cx-masthead__links-item{display:flex;min-width:0}.cx-masthead__actions{display:inline-flex;align-items:center;flex:0 0 auto;gap:var(--space-sm)}.cx-masthead__actions:empty{display:none}.cx-masthead__link{display:inline-flex;min-width:0;align-items:center;padding:var(--space-2xs) var(--space-xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);font:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);text-align:left;text-decoration:none;white-space:nowrap;cursor:pointer}.cx-masthead__link:is(:link,:visited,:hover,:active){color:var(--ink);text-decoration:none}.cx-masthead__link:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-masthead__link:active:not(.cx-masthead__link--disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset)}.cx-masthead__link--active{font-weight:var(--font-weight-bold)}.cx-masthead__link--disabled{cursor:default;pointer-events:none;opacity:var(--opacity-disabled)}.cx-masthead__toggle-slot{display:none;width:var(--controller-size-large);height:var(--controller-size-large);flex:0 0 auto;margin-inline-end:calc((var(--icon-size-lg) - var(--controller-size-large))/2)}.cx-masthead__menu{display:contents}.cx-masthead__menu--portaled{display:block;position:fixed;inset:0;z-index:var(--z-index-dialog);pointer-events:none}.cx-masthead__menu--portaled .cx-masthead__toggle{position:fixed;z-index:var(--z-index-sticky);pointer-events:auto}.cx-masthead__menu--closing{pointer-events:auto}.cx-masthead__menu--closing .cx-masthead__toggle{pointer-events:none}.cx-masthead__toggle{display:inline-flex;align-items:center;justify-content:center;width:var(--controller-size-large);height:var(--controller-size-large);padding:0;flex:0 0 auto;border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer}.cx-masthead__toggle:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-masthead__toggle-icon{position:relative;display:block;width:var(--icon-size-lg);height:var(--icon-size-lg);flex:0 0 auto}.cx-masthead__toggle-line{position:absolute;top:50%;left:0;width:100%;height:calc(var(--border-width)*2);border-radius:var(--radius-pill);background:currentColor;transform:translateY(-50%);transform-origin:center;transition:transform calc(var(--motion-slow)*2) var(--ease-out-in),opacity calc(var(--motion-base)*2) var(--ease-out-in)}.cx-masthead__toggle-line:first-child{transform:translateY(calc(-50% - var(--space-xs) - var(--space-2xs)))}.cx-masthead__toggle-line:last-child{transform:translateY(calc(-50% + var(--space-xs) + var(--space-2xs)))}.cx-masthead__toggle--open .cx-masthead__toggle-line:first-child{transform:translateY(-50%) rotate(45deg)}.cx-masthead__toggle--open .cx-masthead__toggle-line:nth-child(2){opacity:0;transform:translateY(-50%) scaleX(0)}.cx-masthead__toggle--open .cx-masthead__toggle-line:last-child{transform:translateY(-50%) rotate(-45deg)}.cx-masthead__overlay{position:fixed;inset:0;display:flex;justify-content:flex-end;background:var(--overlay-backdrop);visibility:hidden;opacity:0;pointer-events:none;transition:opacity var(--motion-slow) var(--ease-out-strong),visibility 0s var(--motion-slow)}.cx-masthead__overlay--open{visibility:visible;opacity:1;pointer-events:auto;transition-delay:0s}.cx-masthead__drawer{display:flex;flex-direction:column;box-sizing:border-box;width:min(var(--measure-sm),100% - var(--space-xl));height:100%;min-height:0;overflow:hidden;padding:max(var(--space-lg),env(safe-area-inset-top)) max(var(--space-lg),env(safe-area-inset-right)) max(var(--space-lg),env(safe-area-inset-bottom)) var(--space-lg);gap:var(--space-lg);background:var(--surface);color:var(--ink);box-shadow:var(--shadow-high);transform:translateX(100%);transition:transform var(--motion-slow) var(--ease-out-strong)}.cx-masthead__overlay--open .cx-masthead__drawer{transform:translateX(0)}.cx-masthead__drawer-nav{min-height:0;overflow:auto;overscroll-behavior:contain;padding:var(--space-xs);padding-inline-end:calc(var(--controller-size-large) + var(--space-sm))}.cx-masthead__drawer-links{display:flex;flex-direction:column;gap:var(--space-sm);margin:0;padding:0;list-style:none}.cx-masthead__drawer .cx-masthead__link{width:100%;min-height:var(--controller-size-large);box-sizing:border-box;padding:var(--space-sm);font-size:var(--font-size-title-3);white-space:normal;overflow-wrap:anywhere}@container (max-width: 719px){.cx-masthead__inner{max-height:calc(var(--controller-size-large) + var(--space-sm)*2 - var(--border-width));padding-block:var(--space-sm)}.cx-masthead__nav{display:none}.cx-masthead__toggle-slot{display:inline-flex}}@media(prefers-reduced-motion: reduce){.cx-masthead,.cx-masthead__overlay,.cx-masthead__drawer,.cx-masthead__link,.cx-masthead__toggle,.cx-masthead__toggle-line{transition:none}}"] }]
        }], ctorParameters: () => [], propDecorators: { drawerOverlay: [{ type: i0.ViewChild, args: ["drawerOverlay", { isSignal: true }] }], menuSurface: [{ type: i0.ViewChild, args: ["menuSurface", { isSignal: true }] }], menuSlot: [{ type: i0.ViewChild, args: ["menuSlot", { isSignal: true }] }], heading: [{
                type: Input
            }], logo: [{
                type: Input
            }], logoSrc: [{
                type: Input
            }], homeHref: [{
                type: Input
            }], items: [{
                type: Input
            }], variant: [{
                type: Input
            }], sticky: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], overlay: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], frostOnScroll: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], menuAriaLabel: [{
                type: Input
            }], itemSelect: [{
                type: Output
            }], menuToggle: [{ type: i0.ViewChild, args: ["menuToggle", { isSignal: true }] }] } });
function validateMastheadItems(value) {
    if (!Array.isArray(value)) {
        throw new Error("[cx-masthead] items must be an array.");
    }
    const ids = new Set();
    const labels = new Set();
    value.forEach((item, index) => {
        const id = typeof item?.id === "string" ? item.id.trim() : "";
        if (!id) {
            throw new Error(`[cx-masthead] item at index ${index} requires a non-empty id.`);
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
