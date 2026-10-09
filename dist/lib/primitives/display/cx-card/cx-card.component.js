import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild, } from "@angular/core";
import { CxIconButtonComponent } from "../../actions/cx-icon-button/index.js";
import { CxIconComponent } from "../../media/cx-icon/index.js";
import { CxTabsComponent } from "../../navigation/cx-tabs/index.js";
import { CxMenuComponent, CxMenuTriggerDirective, } from "../../overlay/cx-menu/index.js";
import * as i0 from "@angular/core";
// Overflow below this many pixels is not worth an expand control: the fade would
// hide more than the expansion reveals. Roughly one body line of text.
const EXPAND_OVERFLOW_TOLERANCE = 24;
let nextCardContentId = 0;
export class CxCardComponent {
    warnedInvalidActivation = false;
    warnedInvalidExpansion = false;
    warnedInvalidTabs = false;
    resizeObserver;
    contentId = `cx-card-content-${(nextCardContentId += 1)}`;
    expanded = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expanded" }] : /* istanbul ignore next */ []));
    contentHeight = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "contentHeight" }] : /* istanbul ignore next */ []));
    cardViewportRef;
    cardContentRef;
    cardMetaRef;
    heading;
    icon;
    mood = "default";
    variant = "default";
    /** Preset outer inset; default preserves the original section spacing. */
    padding = "default";
    /** Use the theme radius, a shared preset, square corners, or a non-negative pixel value. */
    borderRadius = "default";
    /** Action mode. The card exposes a real button surface and emits pressed. */
    interactive = false;
    /** Navigation mode. Takes precedence over interactive and exposes a real link surface. */
    href;
    target;
    rel;
    /** Accessible name for the card action or link; falls back to heading. */
    ariaLabel;
    menuItems;
    /** Clamps overflowing content to previewHeight behind an earned expand control. */
    expandable = false;
    /** Collapsed content height in px. The expand control appears only when content exceeds it. */
    previewHeight = 240;
    /** Renders a flush tab row between the header and the content island. */
    tabs;
    selectedTabId;
    /** Accessible name for the tab row; falls back to the heading. */
    tabsAriaLabel;
    menuItemSelect = new EventEmitter();
    /** Emitted only by action mode. Navigation mode follows native link behavior. */
    pressed = new EventEmitter();
    selectedTabIdChange = new EventEmitter();
    ngOnChanges(_changes) {
        if (!this.warnedInvalidActivation &&
            this.resolvedHref &&
            this.interactive) {
            this.warnedInvalidActivation = true;
            console.warn(`cx-card "${this.heading?.trim() || "Untitled card"}" sets both href and interactive. ` +
                "A card navigates or acts; href wins and pressed will not emit.");
        }
        if (!this.warnedInvalidExpansion && this.expandable && this.activatable) {
            this.warnedInvalidExpansion = true;
            console.error(`cx-card "${this.heading?.trim() || "Untitled card"}" sets expandable on an activatable card. ` +
                "A whole-card link or action cannot also host an expand control; expandable is ignored.");
        }
        if (!this.warnedInvalidTabs &&
            (this.tabs?.length ?? 0) > 0 &&
            this.activatable) {
            this.warnedInvalidTabs = true;
            console.error(`cx-card "${this.heading?.trim() || "Untitled card"}" sets tabs on an activatable card. ` +
                "A whole-card link or action cannot also host a tab row; tabs are ignored.");
        }
        if (!["default", "none", "xs", "sm", "md", "lg", "xl", "2xl"].includes(String(this.borderRadius)) &&
            (typeof this.borderRadius !== "number" ||
                !Number.isFinite(this.borderRadius) ||
                this.borderRadius < 0)) {
            throw new Error("cx-card borderRadius must be default, none, xs, sm, md, lg, xl, 2xl, or a finite non-negative pixel value.");
        }
        if (!["default", "md", "lg", "xl", "2xl"].includes(this.padding)) {
            throw new Error("cx-card padding must be default, md, lg, xl, or 2xl.");
        }
        this.syncContentObserver();
    }
    get resolvedBorderRadius() {
        if (this.borderRadius === "default")
            return null;
        if (this.borderRadius === "none")
            return "0px";
        return typeof this.borderRadius === "number"
            ? `${this.borderRadius}px`
            : `var(--radius-${this.borderRadius})`;
    }
    get resolvedInnerBorderRadius() {
        const outer = this.resolvedBorderRadius ?? "var(--radius-lg)";
        const inset = this.padding === "default"
            ? "var(--surface-separation)"
            : `var(--space-${this.padding})`;
        const border = this.variant === "border" || this.variant === "frosted"
            ? "var(--border-width)"
            : "0px";
        return `max(0px, calc(${outer} - ${inset} - ${border}))`;
    }
    ngAfterViewInit() {
        this.syncContentObserver();
    }
    ngOnDestroy() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
    }
    get resolvedHref() {
        return this.href?.trim() || undefined;
    }
    get activatable() {
        return Boolean(this.resolvedHref) || this.interactive;
    }
    get resolvedRel() {
        return (this.rel?.trim() || (this.target?.trim() === "_blank" ? "noopener" : null));
    }
    get activationLabel() {
        return (this.ariaLabel?.trim() ||
            this.heading?.trim() ||
            (this.resolvedHref ? "Open card" : "Activate card"));
    }
    onActivate() {
        this.pressed.emit();
    }
    get expansionEnabled() {
        return this.expandable && !this.activatable;
    }
    get hasTabs() {
        return (!this.activatable && (this.tabs?.some((tab) => tab.id?.trim()) ?? false));
    }
    get resolvedTabsAriaLabel() {
        const label = this.tabsAriaLabel?.trim();
        if (label) {
            return label;
        }
        const heading = this.heading?.trim();
        return heading ? `${heading} sections` : "Card sections";
    }
    // Mirrors the tab button ids cx-tabs derives from controlsId, so the content
    // region can name itself after the active tab.
    get selectedTabButtonId() {
        const normalizedTabs = (this.tabs ?? []).filter((tab) => tab.id?.trim());
        const selectedIndex = normalizedTabs.findIndex((tab) => tab.id.trim() === this.selectedTabId && !tab.disabled);
        const resolvedIndex = selectedIndex >= 0
            ? selectedIndex
            : normalizedTabs.findIndex((tab) => !tab.disabled);
        return resolvedIndex >= 0 ? `${this.contentId}-tab-${resolvedIndex}` : null;
    }
    onTabSelect(id) {
        this.selectedTabId = id;
        this.selectedTabIdChange.emit(id);
    }
    overflowing() {
        return (this.expansionEnabled &&
            this.contentHeight() > this.previewHeight + EXPAND_OVERFLOW_TOLERANCE);
    }
    clamped() {
        return this.overflowing() && !this.expanded();
    }
    // Expanded binds the measured content height rather than clearing the clamp,
    // because max-height cannot animate to or from `none`. The resize observer
    // keeps the measurement current, so growing content stays fully visible.
    viewportMaxHeight() {
        if (!this.overflowing()) {
            return null;
        }
        return this.expanded() ? this.contentHeight() : this.previewHeight;
    }
    toggleExpanded() {
        this.expanded.update((expanded) => !expanded);
    }
    // The control is chevron-only; this label is its entire accessible name.
    expandAriaLabel() {
        const heading = this.heading?.trim();
        const label = this.expanded() ? "Show less" : "Show more";
        return heading ? `${label} of ${heading}` : label;
    }
    // Keyboard focus must never land inside the clipped region: reaching a
    // focusable element below the preview fold expands the card instead of
    // moving focus somewhere invisible. The browser reveals a clipped focus
    // target by silently scrolling the overflow-hidden viewport before focusin
    // fires, so a scrolled viewport is the same signal as a below-fold target;
    // undo that scroll, or the collapsed preview shows the middle of the content.
    onViewportFocusIn(event) {
        const viewport = this.cardViewportRef?.nativeElement;
        if (!this.clamped() ||
            !viewport ||
            !(event.target instanceof HTMLElement)) {
            return;
        }
        const scrolled = viewport.scrollTop > 0;
        const belowFold = event.target.getBoundingClientRect().bottom >
            viewport.getBoundingClientRect().bottom;
        if (scrolled || belowFold) {
            viewport.scrollTop = 0;
            this.expanded.set(true);
        }
    }
    syncContentObserver() {
        const content = this.cardContentRef?.nativeElement;
        if (!content || typeof ResizeObserver === "undefined") {
            return;
        }
        if (this.expansionEnabled && !this.resizeObserver) {
            this.resizeObserver = new ResizeObserver((entries) => {
                const measured = entries[entries.length - 1]?.borderBoxSize?.[0]?.blockSize;
                this.contentHeight.set(Math.ceil(measured ?? content.getBoundingClientRect().height));
            });
            this.resizeObserver.observe(content);
        }
        else if (!this.expansionEnabled && this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = undefined;
            this.contentHeight.set(0);
            this.expanded.set(false);
        }
    }
    hasHeading() {
        return !!this.heading?.trim();
    }
    hasMenuItems() {
        return (this.menuItems?.length ?? 0) > 0;
    }
    resolvedMenuAriaLabel() {
        const heading = this.heading?.trim();
        return heading ? `${heading} actions` : "Card actions";
    }
    onMenuItemSelect(itemId) {
        this.menuItemSelect.emit(itemId);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxCardComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxCardComponent, isStandalone: true, selector: "cx-card", inputs: { heading: "heading", icon: "icon", mood: "mood", variant: "variant", padding: "padding", borderRadius: "borderRadius", interactive: ["interactive", "interactive", booleanAttribute], href: "href", target: "target", rel: "rel", ariaLabel: "ariaLabel", menuItems: "menuItems", expandable: ["expandable", "expandable", booleanAttribute], previewHeight: "previewHeight", tabs: "tabs", selectedTabId: "selectedTabId", tabsAriaLabel: "tabsAriaLabel" }, outputs: { menuItemSelect: "menuItemSelect", pressed: "pressed", selectedTabIdChange: "selectedTabIdChange" }, host: { properties: { "attr.data-padding": "padding", "class.cx-card-host--discreet": "variant === \"discreet\"", "class.cx-card-host--frosted": "variant === \"frosted\"", "class.cx-card-host--border": "variant === \"border\"", "class.cx-card-host--interactive": "activatable", "class.cx-card-host--mood-primary": "mood === \"primary\"", "class.cx-card-host--mood-accent": "mood === \"accent\"", "class.cx-card-host--mood-info": "mood === \"info\"", "class.cx-card-host--mood-success": "mood === \"success\"", "class.cx-card-host--mood-warning": "mood === \"warning\"", "class.cx-card-host--mood-danger": "mood === \"danger\"" } }, viewQueries: [{ propertyName: "cardViewportRef", first: true, predicate: ["cardViewport"], descendants: true, read: ElementRef }, { propertyName: "cardContentRef", first: true, predicate: ["cardContent"], descendants: true, read: ElementRef }, { propertyName: "cardMetaRef", first: true, predicate: ["cardMeta"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cx-card\" [style.border-radius]=\"resolvedBorderRadius\">\n  @if (resolvedHref; as href) {\n    <a\n      class=\"cx-card__activation\"\n      [attr.href]=\"href\"\n      [attr.target]=\"target?.trim() || null\"\n      [attr.rel]=\"resolvedRel\"\n      [attr.aria-label]=\"activationLabel\"\n    ></a>\n  } @else if (interactive) {\n    <button\n      type=\"button\"\n      class=\"cx-card__activation\"\n      [attr.aria-label]=\"activationLabel\"\n      (click)=\"onActivate()\"\n    ></button>\n  }\n\n  <div class=\"cx-card__header\">\n    <div class=\"cx-card__identity\">\n      @if (icon; as iconName) {\n        <cx-icon class=\"cx-card__icon\" [icon]=\"iconName\" [size]=\"20\" />\n      }\n      @if (hasHeading()) {\n        <div class=\"cx-card__heading\">{{ heading!.trim() }}</div>\n      }\n    </div>\n\n    <div class=\"cx-card__header-actions\">\n      <div #cardMeta class=\"cx-card__meta\">\n        <ng-content select=\"[slot=meta], [cxCardMeta]\" />\n      </div>\n\n      @if (hasMenuItems()) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-card__menu\"\n          [items]=\"menuItems ?? []\"\n          [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          align=\"end\"\n          (itemSelect)=\"onMenuItemSelect($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            variant=\"transparent\"\n            [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </div>\n\n  @if (hasTabs) {\n    <cx-tabs\n      class=\"cx-card__tabs\"\n      [items]=\"tabs ?? []\"\n      [selectedId]=\"selectedTabId\"\n      [ariaLabel]=\"resolvedTabsAriaLabel\"\n      [controlsId]=\"contentId\"\n      [transparent]=\"true\"\n      [divided]=\"true\"\n      (selectedIdChange)=\"onTabSelect($event)\"\n    />\n  }\n\n  <div\n    #cardViewport\n    class=\"cx-card__viewport\"\n    [style.border-radius]=\"resolvedInnerBorderRadius\"\n    [id]=\"contentId\"\n    [class.cx-card__viewport--expandable]=\"expansionEnabled\"\n    [class.cx-card__viewport--clamped]=\"clamped()\"\n    [style.maxHeight.px]=\"viewportMaxHeight()\"\n    [attr.role]=\"hasTabs ? 'tabpanel' : null\"\n    [attr.aria-labelledby]=\"hasTabs ? selectedTabButtonId : null\"\n    [attr.aria-label]=\"\n      hasTabs && !selectedTabButtonId ? resolvedTabsAriaLabel : null\n    \"\n    [attr.tabindex]=\"hasTabs ? '0' : null\"\n    (focusin)=\"onViewportFocusIn($event)\"\n  >\n    <div #cardContent class=\"cx-card__content\">\n      <ng-content />\n    </div>\n  </div>\n\n  @if (overflowing()) {\n    <button\n      type=\"button\"\n      class=\"cx-card__expand\"\n      [attr.aria-expanded]=\"expanded()\"\n      [attr.aria-controls]=\"contentId\"\n      [attr.aria-label]=\"expandAriaLabel()\"\n      (click)=\"toggleExpanded()\"\n    >\n      <cx-icon\n        class=\"cx-card__expand-chevron\"\n        icon=\"chevron-down\"\n        [size]=\"16\"\n      />\n    </button>\n  }\n\n  <div class=\"cx-card__footer\">\n    <ng-content select=\"[slot=footer], [cxCardFooter]\" />\n  </div>\n</div>\n", styles: [":host{display:block}.cx-card{position:relative;display:flex;width:100%;height:100%;min-width:0;min-height:0;flex-direction:column;gap:var(--surface-separation);overflow:hidden;border:0;border-radius:var(--radius-lg);background-color:var(--opacity-low);box-shadow:none;box-sizing:border-box;padding:var(--surface-separation);transition:background-color var(--motion-fast) var(--ease-out),border-color var(--motion-fast) var(--ease-out),box-shadow var(--motion-fast) var(--ease-out),transform var(--motion-fast) var(--ease-out)}:host(.cx-card-host--border) .cx-card{border:var(--line);background-color:rgba(0,0,0,0)}:host(.cx-card-host--interactive){position:relative}:host(.cx-card-host--interactive:has(.cx-card__activation:hover)){z-index:1}.cx-card__activation{position:absolute;z-index:1;border:0;border-radius:inherit;appearance:none;background:rgba(0,0,0,0);cursor:pointer;inset:0;outline:none}:host(.cx-card-host--interactive) :is(.cx-card__header,.cx-card__viewport,.cx-card__footer){pointer-events:none}:host(.cx-card-host--interactive) .cx-card__header-actions{position:relative;z-index:2;pointer-events:none}:host(.cx-card-host--interactive) .cx-card__menu{pointer-events:auto}:host(.cx-card-host--interactive:not(.cx-card-host--border):not(.cx-card-host--frosted):not(.cx-card-host--discreet)) .cx-card:has(.cx-card__activation:hover){background-color:var(--opacity-low)}:host(.cx-card-host--interactive:not(.cx-card-host--border):not(.cx-card-host--frosted):not(.cx-card-host--discreet)) .cx-card:has(.cx-card__activation:active){background-color:var(--opacity-darken)}:host(.cx-card-host--interactive.cx-card-host--border) .cx-card:has(.cx-card__activation:hover){border-color:var(--border-hover);background-color:rgba(0,0,0,0)}:host(.cx-card-host--interactive.cx-card-host--border) .cx-card:has(.cx-card__activation:active){border-color:var(--border-active);background-color:rgba(0,0,0,0)}:host(.cx-card-host--frosted) .cx-card{border:var(--line);background-color:var(--surface)}@supports(backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)){:host(.cx-card-host--frosted) .cx-card{background-color:color-mix(in srgb, var(--ink) 12%, transparent);-webkit-backdrop-filter:blur(calc(var(--frost-softness) * 12));backdrop-filter:blur(calc(var(--frost-softness) * 12))}}@media(prefers-reduced-transparency: reduce){:host(.cx-card-host--frosted) .cx-card{background-color:var(--surface);-webkit-backdrop-filter:none;backdrop-filter:none}}@media(hover: hover){:host(.cx-card-host--interactive:not(.cx-card-host--discreet)) .cx-card:has(.cx-card__activation:hover:not(:active)){transform:scale(1.01);box-shadow:var(--shadow-mid)}}:host(.cx-card-host--discreet) .cx-card{background-color:rgba(0,0,0,0)}:host(.cx-card-host--discreet) .cx-card__footer{border-top:0}@media(hover: hover){:host(.cx-card-host--discreet.cx-card-host--interactive) .cx-card:has(.cx-card__activation:hover:not(:active)){box-shadow:var(--shadow-low)}}:host(.cx-card-host--discreet.cx-card-host--interactive) .cx-card:has(.cx-card__activation:focus-visible:not(:active)){box-shadow:var(--shadow-low)}:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:active){transform:none;box-shadow:none}@media(prefers-reduced-motion: reduce){:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:hover),:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:active){transform:none}}:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}:host(.cx-card-host--mood-primary) .cx-card__icon{color:var(--primary)}:host(.cx-card-host--mood-accent) .cx-card__icon{color:var(--accent)}:host(.cx-card-host--mood-info) .cx-card__icon{color:var(--info)}:host(.cx-card-host--mood-success) .cx-card__icon{color:var(--success)}:host(.cx-card-host--mood-warning) .cx-card__icon{color:var(--warning)}:host(.cx-card-host--mood-danger) .cx-card__icon{color:var(--danger)}.cx-card__header{display:flex;flex-wrap:wrap;min-width:0;min-height:var(--controller-size);align-items:center;gap:var(--space-md);padding:0 var(--space-sm);box-sizing:border-box}.cx-card__header:not(:has(.cx-card__heading,.cx-card__icon,.cx-card__meta>*,.cx-card__menu)){display:none}.cx-card__identity{display:flex;flex:1 1 0;align-items:center;gap:var(--space-sm)}.cx-card__identity:empty{display:none}.cx-card__icon{flex:0 0 auto;color:var(--ink)}.cx-card__heading{width:0;min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-card__header-actions{display:inline-flex;min-width:0;max-width:100%;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:var(--space-sm);margin-inline-start:auto}.cx-card__meta{display:inline-flex;min-width:0;flex:0 1 auto;align-items:center;justify-content:flex-end;gap:var(--space-sm)}.cx-card__meta:empty{display:none}.cx-card__header-actions:not(:has(.cx-card__meta>*,.cx-card__menu)){display:none}.cx-card__menu{display:inline-flex;flex:0 0 auto;opacity:.15;transition:opacity var(--motion-fast) ease}.cx-card:hover .cx-card__menu,.cx-card:focus-within .cx-card__menu{opacity:1}.cx-card__viewport:has(>.cx-card__content:empty){display:none}.cx-card:not(:has(.cx-card__heading,.cx-card__icon,.cx-card__meta>*)):has(.cx-card__content:empty):has(.cx-card__footer:empty){display:none}.cx-card__tabs{min-width:0;flex:0 0 auto;padding-inline:var(--space-sm)}.cx-card__viewport{position:relative;display:flex;min-width:0;min-height:0;flex:1 1 auto;flex-direction:column;overflow:hidden;border-radius:inherit;transition:max-height var(--motion-base) var(--ease-out-in)}.cx-card__viewport:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}.cx-card__content{display:flex;min-width:0;min-height:0;flex:1 1 auto;flex-direction:column;gap:var(--space-sm);overflow:hidden;border-radius:inherit;background:rgba(0,0,0,0);padding:var(--space-sm);box-sizing:border-box}.cx-card__viewport--expandable .cx-card__content{flex-shrink:0}.cx-card__viewport--clamped{-webkit-mask-image:linear-gradient(to bottom, #000 calc(100% - 48px), transparent);mask-image:linear-gradient(to bottom, #000 calc(100% - 48px), transparent)}.cx-card__expand{display:flex;min-height:var(--controller-size);flex:0 0 auto;align-items:center;justify-content:center;padding:0 var(--space-sm);border:0;border-radius:inherit;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) var(--ease-out),color var(--motion-fast) var(--ease-out)}.cx-card__expand:hover{background:var(--opacity-low);color:var(--ink)}:host(.cx-card-host--border) .cx-card__expand:hover{background:rgba(0,0,0,0)}.cx-card__expand:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-card__expand-chevron{flex:0 0 auto;transition:transform var(--motion-fast) var(--ease-out)}.cx-card__expand[aria-expanded=true] .cx-card__expand-chevron{transform:rotate(180deg)}.cx-card__footer{display:flex;min-width:0;min-height:var(--controller-size);flex:0 0 auto;align-items:center;gap:var(--space-sm);padding:var(--space-sm);border-top:var(--line-discreet);box-sizing:border-box;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-card__footer:empty{display:none}@media(prefers-reduced-motion: reduce){.cx-card__viewport,.cx-card__expand-chevron{transition:none}}:host([data-padding=md]) .cx-card{padding:var(--space-md)}:host([data-padding=md]) .cx-card__header,:host([data-padding=md]) .cx-card__tabs,:host([data-padding=md]) .cx-card__content,:host([data-padding=md]) .cx-card__footer{padding:0}:host([data-padding=md]) .cx-card__footer{padding-block-start:var(--space-sm)}:host([data-padding=lg]) .cx-card{padding:var(--space-lg)}:host([data-padding=lg]) .cx-card__header,:host([data-padding=lg]) .cx-card__tabs,:host([data-padding=lg]) .cx-card__content,:host([data-padding=lg]) .cx-card__footer{padding:0}:host([data-padding=lg]) .cx-card__footer{padding-block-start:var(--space-sm)}:host([data-padding=xl]) .cx-card{padding:var(--space-xl)}:host([data-padding=xl]) .cx-card__header,:host([data-padding=xl]) .cx-card__tabs,:host([data-padding=xl]) .cx-card__content,:host([data-padding=xl]) .cx-card__footer{padding:0}:host([data-padding=xl]) .cx-card__footer{padding-block-start:var(--space-sm)}:host([data-padding=\"2xl\"]) .cx-card{padding:var(--space-2xl)}:host([data-padding=\"2xl\"]) .cx-card__header,:host([data-padding=\"2xl\"]) .cx-card__tabs,:host([data-padding=\"2xl\"]) .cx-card__content,:host([data-padding=\"2xl\"]) .cx-card__footer{padding:0}:host([data-padding=\"2xl\"]) .cx-card__footer{padding-block-start:var(--space-sm)}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "component", type: CxTabsComponent, selector: "cx-tabs", inputs: ["ariaLabel", "controlsId", "items", "selectedId", "transparent", "divided", "equalWidth"], outputs: ["selectedIdChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxCardComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-card", imports: [
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxTabsComponent,
                    ], host: {
                        "[attr.data-padding]": "padding",
                        "[class.cx-card-host--discreet]": 'variant === "discreet"',
                        "[class.cx-card-host--frosted]": 'variant === "frosted"',
                        "[class.cx-card-host--border]": 'variant === "border"',
                        "[class.cx-card-host--interactive]": "activatable",
                        "[class.cx-card-host--mood-primary]": 'mood === "primary"',
                        "[class.cx-card-host--mood-accent]": 'mood === "accent"',
                        "[class.cx-card-host--mood-info]": 'mood === "info"',
                        "[class.cx-card-host--mood-success]": 'mood === "success"',
                        "[class.cx-card-host--mood-warning]": 'mood === "warning"',
                        "[class.cx-card-host--mood-danger]": 'mood === "danger"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-card\" [style.border-radius]=\"resolvedBorderRadius\">\n  @if (resolvedHref; as href) {\n    <a\n      class=\"cx-card__activation\"\n      [attr.href]=\"href\"\n      [attr.target]=\"target?.trim() || null\"\n      [attr.rel]=\"resolvedRel\"\n      [attr.aria-label]=\"activationLabel\"\n    ></a>\n  } @else if (interactive) {\n    <button\n      type=\"button\"\n      class=\"cx-card__activation\"\n      [attr.aria-label]=\"activationLabel\"\n      (click)=\"onActivate()\"\n    ></button>\n  }\n\n  <div class=\"cx-card__header\">\n    <div class=\"cx-card__identity\">\n      @if (icon; as iconName) {\n        <cx-icon class=\"cx-card__icon\" [icon]=\"iconName\" [size]=\"20\" />\n      }\n      @if (hasHeading()) {\n        <div class=\"cx-card__heading\">{{ heading!.trim() }}</div>\n      }\n    </div>\n\n    <div class=\"cx-card__header-actions\">\n      <div #cardMeta class=\"cx-card__meta\">\n        <ng-content select=\"[slot=meta], [cxCardMeta]\" />\n      </div>\n\n      @if (hasMenuItems()) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-card__menu\"\n          [items]=\"menuItems ?? []\"\n          [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          align=\"end\"\n          (itemSelect)=\"onMenuItemSelect($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            variant=\"transparent\"\n            [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </div>\n\n  @if (hasTabs) {\n    <cx-tabs\n      class=\"cx-card__tabs\"\n      [items]=\"tabs ?? []\"\n      [selectedId]=\"selectedTabId\"\n      [ariaLabel]=\"resolvedTabsAriaLabel\"\n      [controlsId]=\"contentId\"\n      [transparent]=\"true\"\n      [divided]=\"true\"\n      (selectedIdChange)=\"onTabSelect($event)\"\n    />\n  }\n\n  <div\n    #cardViewport\n    class=\"cx-card__viewport\"\n    [style.border-radius]=\"resolvedInnerBorderRadius\"\n    [id]=\"contentId\"\n    [class.cx-card__viewport--expandable]=\"expansionEnabled\"\n    [class.cx-card__viewport--clamped]=\"clamped()\"\n    [style.maxHeight.px]=\"viewportMaxHeight()\"\n    [attr.role]=\"hasTabs ? 'tabpanel' : null\"\n    [attr.aria-labelledby]=\"hasTabs ? selectedTabButtonId : null\"\n    [attr.aria-label]=\"\n      hasTabs && !selectedTabButtonId ? resolvedTabsAriaLabel : null\n    \"\n    [attr.tabindex]=\"hasTabs ? '0' : null\"\n    (focusin)=\"onViewportFocusIn($event)\"\n  >\n    <div #cardContent class=\"cx-card__content\">\n      <ng-content />\n    </div>\n  </div>\n\n  @if (overflowing()) {\n    <button\n      type=\"button\"\n      class=\"cx-card__expand\"\n      [attr.aria-expanded]=\"expanded()\"\n      [attr.aria-controls]=\"contentId\"\n      [attr.aria-label]=\"expandAriaLabel()\"\n      (click)=\"toggleExpanded()\"\n    >\n      <cx-icon\n        class=\"cx-card__expand-chevron\"\n        icon=\"chevron-down\"\n        [size]=\"16\"\n      />\n    </button>\n  }\n\n  <div class=\"cx-card__footer\">\n    <ng-content select=\"[slot=footer], [cxCardFooter]\" />\n  </div>\n</div>\n", styles: [":host{display:block}.cx-card{position:relative;display:flex;width:100%;height:100%;min-width:0;min-height:0;flex-direction:column;gap:var(--surface-separation);overflow:hidden;border:0;border-radius:var(--radius-lg);background-color:var(--opacity-low);box-shadow:none;box-sizing:border-box;padding:var(--surface-separation);transition:background-color var(--motion-fast) var(--ease-out),border-color var(--motion-fast) var(--ease-out),box-shadow var(--motion-fast) var(--ease-out),transform var(--motion-fast) var(--ease-out)}:host(.cx-card-host--border) .cx-card{border:var(--line);background-color:rgba(0,0,0,0)}:host(.cx-card-host--interactive){position:relative}:host(.cx-card-host--interactive:has(.cx-card__activation:hover)){z-index:1}.cx-card__activation{position:absolute;z-index:1;border:0;border-radius:inherit;appearance:none;background:rgba(0,0,0,0);cursor:pointer;inset:0;outline:none}:host(.cx-card-host--interactive) :is(.cx-card__header,.cx-card__viewport,.cx-card__footer){pointer-events:none}:host(.cx-card-host--interactive) .cx-card__header-actions{position:relative;z-index:2;pointer-events:none}:host(.cx-card-host--interactive) .cx-card__menu{pointer-events:auto}:host(.cx-card-host--interactive:not(.cx-card-host--border):not(.cx-card-host--frosted):not(.cx-card-host--discreet)) .cx-card:has(.cx-card__activation:hover){background-color:var(--opacity-low)}:host(.cx-card-host--interactive:not(.cx-card-host--border):not(.cx-card-host--frosted):not(.cx-card-host--discreet)) .cx-card:has(.cx-card__activation:active){background-color:var(--opacity-darken)}:host(.cx-card-host--interactive.cx-card-host--border) .cx-card:has(.cx-card__activation:hover){border-color:var(--border-hover);background-color:rgba(0,0,0,0)}:host(.cx-card-host--interactive.cx-card-host--border) .cx-card:has(.cx-card__activation:active){border-color:var(--border-active);background-color:rgba(0,0,0,0)}:host(.cx-card-host--frosted) .cx-card{border:var(--line);background-color:var(--surface)}@supports(backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)){:host(.cx-card-host--frosted) .cx-card{background-color:color-mix(in srgb, var(--ink) 12%, transparent);-webkit-backdrop-filter:blur(calc(var(--frost-softness) * 12));backdrop-filter:blur(calc(var(--frost-softness) * 12))}}@media(prefers-reduced-transparency: reduce){:host(.cx-card-host--frosted) .cx-card{background-color:var(--surface);-webkit-backdrop-filter:none;backdrop-filter:none}}@media(hover: hover){:host(.cx-card-host--interactive:not(.cx-card-host--discreet)) .cx-card:has(.cx-card__activation:hover:not(:active)){transform:scale(1.01);box-shadow:var(--shadow-mid)}}:host(.cx-card-host--discreet) .cx-card{background-color:rgba(0,0,0,0)}:host(.cx-card-host--discreet) .cx-card__footer{border-top:0}@media(hover: hover){:host(.cx-card-host--discreet.cx-card-host--interactive) .cx-card:has(.cx-card__activation:hover:not(:active)){box-shadow:var(--shadow-low)}}:host(.cx-card-host--discreet.cx-card-host--interactive) .cx-card:has(.cx-card__activation:focus-visible:not(:active)){box-shadow:var(--shadow-low)}:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:active){transform:none;box-shadow:none}@media(prefers-reduced-motion: reduce){:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:hover),:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:active){transform:none}}:host(.cx-card-host--interactive) .cx-card:has(.cx-card__activation:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}:host(.cx-card-host--mood-primary) .cx-card__icon{color:var(--primary)}:host(.cx-card-host--mood-accent) .cx-card__icon{color:var(--accent)}:host(.cx-card-host--mood-info) .cx-card__icon{color:var(--info)}:host(.cx-card-host--mood-success) .cx-card__icon{color:var(--success)}:host(.cx-card-host--mood-warning) .cx-card__icon{color:var(--warning)}:host(.cx-card-host--mood-danger) .cx-card__icon{color:var(--danger)}.cx-card__header{display:flex;flex-wrap:wrap;min-width:0;min-height:var(--controller-size);align-items:center;gap:var(--space-md);padding:0 var(--space-sm);box-sizing:border-box}.cx-card__header:not(:has(.cx-card__heading,.cx-card__icon,.cx-card__meta>*,.cx-card__menu)){display:none}.cx-card__identity{display:flex;flex:1 1 0;align-items:center;gap:var(--space-sm)}.cx-card__identity:empty{display:none}.cx-card__icon{flex:0 0 auto;color:var(--ink)}.cx-card__heading{width:0;min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-card__header-actions{display:inline-flex;min-width:0;max-width:100%;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:var(--space-sm);margin-inline-start:auto}.cx-card__meta{display:inline-flex;min-width:0;flex:0 1 auto;align-items:center;justify-content:flex-end;gap:var(--space-sm)}.cx-card__meta:empty{display:none}.cx-card__header-actions:not(:has(.cx-card__meta>*,.cx-card__menu)){display:none}.cx-card__menu{display:inline-flex;flex:0 0 auto;opacity:.15;transition:opacity var(--motion-fast) ease}.cx-card:hover .cx-card__menu,.cx-card:focus-within .cx-card__menu{opacity:1}.cx-card__viewport:has(>.cx-card__content:empty){display:none}.cx-card:not(:has(.cx-card__heading,.cx-card__icon,.cx-card__meta>*)):has(.cx-card__content:empty):has(.cx-card__footer:empty){display:none}.cx-card__tabs{min-width:0;flex:0 0 auto;padding-inline:var(--space-sm)}.cx-card__viewport{position:relative;display:flex;min-width:0;min-height:0;flex:1 1 auto;flex-direction:column;overflow:hidden;border-radius:inherit;transition:max-height var(--motion-base) var(--ease-out-in)}.cx-card__viewport:focus-visible{outline:var(--outline-tab);outline-offset:calc(-1*var(--outline-tab-offset))}.cx-card__content{display:flex;min-width:0;min-height:0;flex:1 1 auto;flex-direction:column;gap:var(--space-sm);overflow:hidden;border-radius:inherit;background:rgba(0,0,0,0);padding:var(--space-sm);box-sizing:border-box}.cx-card__viewport--expandable .cx-card__content{flex-shrink:0}.cx-card__viewport--clamped{-webkit-mask-image:linear-gradient(to bottom, #000 calc(100% - 48px), transparent);mask-image:linear-gradient(to bottom, #000 calc(100% - 48px), transparent)}.cx-card__expand{display:flex;min-height:var(--controller-size);flex:0 0 auto;align-items:center;justify-content:center;padding:0 var(--space-sm);border:0;border-radius:inherit;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) var(--ease-out),color var(--motion-fast) var(--ease-out)}.cx-card__expand:hover{background:var(--opacity-low);color:var(--ink)}:host(.cx-card-host--border) .cx-card__expand:hover{background:rgba(0,0,0,0)}.cx-card__expand:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-card__expand-chevron{flex:0 0 auto;transition:transform var(--motion-fast) var(--ease-out)}.cx-card__expand[aria-expanded=true] .cx-card__expand-chevron{transform:rotate(180deg)}.cx-card__footer{display:flex;min-width:0;min-height:var(--controller-size);flex:0 0 auto;align-items:center;gap:var(--space-sm);padding:var(--space-sm);border-top:var(--line-discreet);box-sizing:border-box;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-card__footer:empty{display:none}@media(prefers-reduced-motion: reduce){.cx-card__viewport,.cx-card__expand-chevron{transition:none}}:host([data-padding=md]) .cx-card{padding:var(--space-md)}:host([data-padding=md]) .cx-card__header,:host([data-padding=md]) .cx-card__tabs,:host([data-padding=md]) .cx-card__content,:host([data-padding=md]) .cx-card__footer{padding:0}:host([data-padding=md]) .cx-card__footer{padding-block-start:var(--space-sm)}:host([data-padding=lg]) .cx-card{padding:var(--space-lg)}:host([data-padding=lg]) .cx-card__header,:host([data-padding=lg]) .cx-card__tabs,:host([data-padding=lg]) .cx-card__content,:host([data-padding=lg]) .cx-card__footer{padding:0}:host([data-padding=lg]) .cx-card__footer{padding-block-start:var(--space-sm)}:host([data-padding=xl]) .cx-card{padding:var(--space-xl)}:host([data-padding=xl]) .cx-card__header,:host([data-padding=xl]) .cx-card__tabs,:host([data-padding=xl]) .cx-card__content,:host([data-padding=xl]) .cx-card__footer{padding:0}:host([data-padding=xl]) .cx-card__footer{padding-block-start:var(--space-sm)}:host([data-padding=\"2xl\"]) .cx-card{padding:var(--space-2xl)}:host([data-padding=\"2xl\"]) .cx-card__header,:host([data-padding=\"2xl\"]) .cx-card__tabs,:host([data-padding=\"2xl\"]) .cx-card__content,:host([data-padding=\"2xl\"]) .cx-card__footer{padding:0}:host([data-padding=\"2xl\"]) .cx-card__footer{padding-block-start:var(--space-sm)}"] }]
        }], propDecorators: { cardViewportRef: [{
                type: ViewChild,
                args: ["cardViewport", { read: ElementRef }]
            }], cardContentRef: [{
                type: ViewChild,
                args: ["cardContent", { read: ElementRef }]
            }], cardMetaRef: [{
                type: ViewChild,
                args: ["cardMeta", { read: ElementRef }]
            }], heading: [{
                type: Input
            }], icon: [{
                type: Input
            }], mood: [{
                type: Input
            }], variant: [{
                type: Input
            }], padding: [{
                type: Input
            }], borderRadius: [{
                type: Input
            }], interactive: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], href: [{
                type: Input
            }], target: [{
                type: Input
            }], rel: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], menuItems: [{
                type: Input
            }], expandable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], previewHeight: [{
                type: Input
            }], tabs: [{
                type: Input
            }], selectedTabId: [{
                type: Input
            }], tabsAriaLabel: [{
                type: Input
            }], menuItemSelect: [{
                type: Output
            }], pressed: [{
                type: Output
            }], selectedTabIdChange: [{
                type: Output
            }] } });
