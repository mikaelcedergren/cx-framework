import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewEncapsulation, afterEveryRender, booleanAttribute, inject, } from "@angular/core";
import * as i0 from "@angular/core";
const HERO_LAYOUTS = ["cover", "split", "stacked"];
const HERO_ALIGNMENTS = ["start", "center"];
const HERO_MEDIA_POSITIONS = [
    "top",
    "center",
    "bottom",
];
/**
 * Page introduction for a public, editorial, or marketing surface.
 *
 * The hero owns one h1, its supporting hierarchy, the placement of optional
 * projected content, and three complete responsive compositions. The parent
 * still owns where the hero sits and whether that region is full bleed.
 */
export class CxHeroComponent {
    host = inject(ElementRef);
    contentReady = false;
    layoutValue = "stacked";
    alignValue = "start";
    overlayOpacityValue = 0;
    mediaPositionValue = "center";
    constructor() {
        afterEveryRender(() => {
            if (this.contentReady && this.resolvedHeading()) {
                this.validateComposition();
            }
        });
    }
    /** Required page heading. Empty text removes the whole hero. */
    heading = "";
    /** Utility classes applied directly to the heading; empty keeps the default. */
    headingClass = "";
    /** Responsive composition. Split and cover require projected media. */
    set layout(value) {
        this.layoutValue = validateOption("layout", value, HERO_LAYOUTS);
    }
    get layout() {
        return this.layoutValue;
    }
    variantValue = "default";
    mediaSideValue = "end";
    /** Framing. Flush fills one half of a split hero to its outer edges. */
    set variant(value) {
        this.variantValue = validateOption("variant", value, ["default", "flush"]);
    }
    get variant() {
        return this.variantValue;
    }
    /** Desktop media side for split layouts. Narrow layouts always lead with copy. */
    set mediaSide(value) {
        this.mediaSideValue = validateOption("mediaSide", value, ["start", "end"]);
    }
    get mediaSide() {
        return this.mediaSideValue;
    }
    /** Copy alignment. Split heroes accept start only. */
    set align(value) {
        this.alignValue = validateOption("align", value, HERO_ALIGNMENTS);
    }
    get align() {
        return this.alignValue;
    }
    /** Coarse vertical crop position for cover media. */
    set mediaPosition(value) {
        this.mediaPositionValue = validateOption("mediaPosition", value, HERO_MEDIA_POSITIONS);
    }
    get mediaPosition() {
        return this.mediaPositionValue;
    }
    /** Theme-surface overlay percentage. Zero leaves cover media untreated. */
    set overlayOpacity(value) {
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            throw new Error("[cx-hero] overlayOpacity must be a number from 0 to 100.");
        }
        this.overlayOpacityValue = value;
    }
    get overlayOpacity() {
        return this.overlayOpacityValue;
    }
    /** Smoothly blends the lower half of cover media into the default surface. */
    fadeBottom = false;
    /** Gently moves cover media while foreground content stays still. */
    parallax = false;
    /** Reserves space for an overlapping masthead while media extends behind it. */
    underMasthead = false;
    ngAfterContentInit() {
        this.contentReady = true;
    }
    resolvedHeading() {
        return this.heading.trim();
    }
    validateComposition() {
        if (this.variant === "flush" && this.layout !== "split") {
            throw new Error('[cx-hero] variant="flush" requires layout="split".');
        }
        if (this.mediaSide === "start" && this.layout !== "split") {
            throw new Error('[cx-hero] mediaSide="start" requires layout="split".');
        }
        const caption = this.host.nativeElement.querySelector(".cx-hero__caption");
        if (caption &&
            (caption.childElementCount || caption.textContent?.trim()) &&
            (this.layout === "cover" || !this.hasProjectedMedia())) {
            throw new Error("[cx-hero] caption requires meaningful media in a stacked or split layout.");
        }
        if (this.overlayOpacity > 0 && this.layoutValue !== "cover") {
            throw new Error('[cx-hero] overlayOpacity requires layout="cover".');
        }
        if (this.parallax && this.layoutValue !== "cover") {
            throw new Error('[cx-hero] parallax requires layout="cover".');
        }
        if (this.fadeBottom && this.layoutValue !== "cover") {
            throw new Error('[cx-hero] fadeBottom requires layout="cover".');
        }
        if (this.layoutValue === "split" && this.alignValue !== "start") {
            throw new Error('[cx-hero] split layout requires align="start".');
        }
        if ((this.layoutValue === "split" || this.layoutValue === "cover") &&
            !this.hasProjectedMedia()) {
            throw new Error(`[cx-hero] ${this.layoutValue} layout requires the media slot.`);
        }
    }
    hasProjectedMedia() {
        const media = this.host.nativeElement.querySelector(":scope > .cx-hero > .cx-hero__media > .cx-hero__visual");
        return Boolean(media && (media.childElementCount > 0 || media.textContent?.trim()));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxHeroComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxHeroComponent, isStandalone: true, selector: "cx-hero", inputs: { heading: "heading", headingClass: "headingClass", layout: "layout", variant: "variant", mediaSide: "mediaSide", align: "align", mediaPosition: "mediaPosition", overlayOpacity: "overlayOpacity", fadeBottom: ["fadeBottom", "fadeBottom", booleanAttribute], parallax: ["parallax", "parallax", booleanAttribute], underMasthead: ["underMasthead", "underMasthead", booleanAttribute] }, host: { properties: { "attr.data-layout": "layout", "attr.data-variant": "variant", "attr.data-media-side": "mediaSide", "attr.data-align": "align", "attr.data-media-position": "mediaPosition" } }, ngImport: i0, template: "@if (resolvedHeading(); as title) {\n  <header\n    class=\"cx-hero\"\n    [class.cx-hero--stacked]=\"layout === 'stacked'\"\n    [class.cx-hero--split]=\"layout === 'split'\"\n    [class.cx-hero--cover]=\"layout === 'cover'\"\n    [class.cx-hero--flush]=\"variant === 'flush'\"\n    [class.cx-hero--media-start]=\"mediaSide === 'start'\"\n    [class.cx-hero--center]=\"align === 'center'\"\n    [class.cx-hero--parallax]=\"parallax\"\n    [class.cx-hero--fade-bottom]=\"fadeBottom\"\n    [class.cx-hero--under-masthead]=\"underMasthead\"\n  >\n    @if (layout === \"cover\" && overlayOpacity > 0) {\n      <div\n        class=\"cx-hero__overlay\"\n        aria-hidden=\"true\"\n        [style.opacity]=\"overlayOpacity / 100\"\n      ></div>\n    }\n    <div class=\"cx-hero__copy\">\n      <div class=\"cx-hero__context\">\n        <ng-content select=\"[context], [cxHeroContext]\" />\n      </div>\n\n      <div class=\"cx-hero__message\">\n        <h1 class=\"cx-hero__heading\" [class]=\"headingClass\">{{ title }}</h1>\n        <div class=\"cx-hero__body\">\n          <ng-content select=\"[body], [cxHeroBody]\" />\n        </div>\n      </div>\n\n      <div class=\"cx-hero__actions\">\n        <ng-content select=\"[actions], [cxHeroActions]\" />\n      </div>\n\n      <div class=\"cx-hero__meta\">\n        <ng-content select=\"[meta], [cxHeroMeta]\" />\n      </div>\n    </div>\n\n    <figure\n      class=\"cx-hero__media\"\n      [attr.aria-hidden]=\"layout === 'cover' ? 'true' : null\"\n    >\n      <div class=\"cx-hero__visual\">\n        <ng-content select=\"[media], [cxHeroMedia]\" />\n      </div>\n      <figcaption class=\"cx-hero__caption\">\n        <ng-content select=\"[caption], [cxHeroCaption]\" />\n      </figcaption>\n    </figure>\n  </header>\n}\n", styles: ["cx-hero{display:block;width:100%;min-width:0;container-type:inline-size}cx-hero .cx-hero{position:relative;isolation:isolate;display:grid;width:100%;min-width:0;align-items:center;gap:var(--space-2xl);overflow:clip;padding-block:var(--space-2xl);padding-inline:max(var(--gutter-page),(100% - var(--measure-xl))/2);background:var(--surface);color:var(--ink)}cx-hero .cx-hero__copy{position:relative;z-index:1;display:grid;width:min(100%,var(--measure-lg));min-width:0;align-content:center;justify-self:start;gap:var(--space-lg)}cx-hero .cx-hero--under-masthead{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-md)*2)}cx-hero .cx-hero__message{display:grid;width:100%;max-width:18ch;font-family:var(--font-family-heading);font-size:var(--font-size-display);min-width:0;gap:var(--space-lg)}cx-hero .cx-hero__heading{max-width:16ch;color:var(--ink);font-family:var(--font-family-heading);font-size:var(--font-size-display);font-weight:var(--font-weight-editorial-heading);line-height:var(--line-height-display);overflow-wrap:anywhere;text-wrap:balance}cx-hero .cx-hero__context,cx-hero .cx-hero__actions,cx-hero .cx-hero__meta{display:flex;min-width:0;flex-wrap:wrap;align-items:center}cx-hero .cx-hero__context{gap:var(--space-sm);color:var(--accent);font-size:var(--font-size-body-lg);line-height:var(--line-height-body)}cx-hero .cx-hero__body{display:grid;width:100%;max-width:100%;min-width:0;gap:var(--space-sm);font-family:var(--font-family-base);color:var(--opacity-high);font-size:var(--font-size-editorial-lead);line-height:var(--line-height-editorial-lead)}cx-hero .cx-hero__actions{gap:var(--space-sm)}cx-hero .cx-hero__meta{gap:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}cx-hero .cx-hero__context:empty,cx-hero .cx-hero__body:empty,cx-hero .cx-hero__actions:empty,cx-hero .cx-hero__meta:empty,cx-hero .cx-hero__caption:empty,cx-hero .cx-hero__media:not(:has(.cx-hero__visual>*)){display:none}cx-hero .cx-hero__media{margin:0;position:relative;display:grid;width:100%;min-width:0;overflow:hidden;border-radius:var(--radius-media-lg)}cx-hero .cx-hero__visual>[media],cx-hero .cx-hero__visual>[cxHeroMedia]{display:block;width:100%;max-width:100%;min-width:0}cx-hero .cx-hero__visual{position:relative;min-width:0;min-height:0}cx-hero .cx-hero__visual>picture[media]>img,cx-hero .cx-hero__visual>picture[cxHeroMedia]>img{display:block;width:100%;height:100%;object-fit:inherit;object-position:inherit}cx-hero .cx-hero__caption{padding:var(--space-md) var(--space-lg);background:var(--surface);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}cx-hero .cx-hero--center .cx-hero__copy{justify-self:center;text-align:center}cx-hero .cx-hero--center .cx-hero__message{justify-self:center}cx-hero .cx-hero--center .cx-hero__heading,cx-hero .cx-hero--center .cx-hero__body{margin-inline:auto}cx-hero .cx-hero--center .cx-hero__context,cx-hero .cx-hero--center .cx-hero__actions,cx-hero .cx-hero--center .cx-hero__meta{justify-content:center}cx-hero .cx-hero--stacked .cx-hero__media{max-width:var(--measure-xl);justify-self:center}cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr) minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:end}cx-hero .cx-hero--media-start .cx-hero__media{grid-column:1;grid-row:1}cx-hero .cx-hero--media-start .cx-hero__copy{grid-column:2;grid-row:1;justify-self:start}cx-hero .cx-hero--flush{padding:0;gap:0;align-items:stretch}cx-hero .cx-hero--flush .cx-hero__copy{width:100%;padding-block:var(--space-2xl);padding-inline:max(var(--gutter-page),(100cqw - var(--measure-xl))/2) var(--space-2xl)}cx-hero .cx-hero--flush.cx-hero--media-start .cx-hero__copy{padding-inline:var(--space-2xl) max(var(--gutter-page),(100cqw - var(--measure-xl))/2)}cx-hero .cx-hero--flush.cx-hero--under-masthead{padding:0}cx-hero .cx-hero--flush.cx-hero--under-masthead .cx-hero__copy{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-md)*2)}cx-hero .cx-hero--flush .cx-hero__media{border-radius:var(--radius-none);grid-template-rows:minmax(0, 1fr) auto}cx-hero .cx-hero--flush .cx-hero__visual{min-height:calc(var(--space-2xl)*5)}cx-hero .cx-hero--flush .cx-hero__visual>[media],cx-hero .cx-hero--flush .cx-hero__visual>[cxHeroMedia]{position:absolute;inset:0;height:100%;object-fit:cover}cx-hero .cx-hero--cover{min-height:clamp(var(--space-2xl)*6,60svh,var(--space-2xl)*10)}cx-hero .cx-hero__overlay{position:absolute;z-index:-1;inset:0;background:var(--surface);pointer-events:none}cx-hero .cx-hero--cover.cx-hero--fade-bottom::before{position:absolute;z-index:0;inset:0;background:linear-gradient(to bottom, color-mix(in srgb, var(--surface) 0%, transparent) 50%, color-mix(in srgb, var(--surface) 4%, transparent) 58%, color-mix(in srgb, var(--surface) 12%, transparent) 66%, color-mix(in srgb, var(--surface) 28%, transparent) 75%, color-mix(in srgb, var(--surface) 50%, transparent) 84%, color-mix(in srgb, var(--surface) 76%, transparent) 92%, var(--surface) 100%);content:\"\";pointer-events:none}cx-hero .cx-hero--cover .cx-hero__copy,cx-hero .cx-hero--cover .cx-hero__heading,cx-hero .cx-hero--cover .cx-hero__context,cx-hero .cx-hero--cover .cx-hero__body,cx-hero .cx-hero--cover .cx-hero__meta{color:var(--ink)}cx-hero .cx-hero--cover .cx-hero__media{position:absolute;z-index:-2;grid-template-rows:minmax(0, 1fr);inset:0;height:100%;overflow:hidden;border-radius:var(--radius-none);background:var(--surface-alt)}cx-hero .cx-hero--cover .cx-hero__visual>[media],cx-hero .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{width:100%;height:100%;object-fit:cover}cx-hero .cx-hero--cover.cx-hero--parallax .cx-hero__media{transform:scale(1.18)}@supports(animation-timeline: view()){@media(prefers-reduced-motion: no-preference){cx-hero .cx-hero--cover.cx-hero--parallax{view-timeline:--cx-hero-parallax block;view-timeline-inset:0}cx-hero .cx-hero--cover.cx-hero--parallax .cx-hero__media{animation:cx-hero-parallax auto cubic-bezier(0.25, 0.2, 0.75, 0.8) both;animation-timeline:--cx-hero-parallax;animation-range:exit-crossing 0% exit-crossing 100%}}}@keyframes cx-hero-parallax{from{translate:0 0}to{translate:0 8%}}cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__visual>[media],cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{object-position:center top}cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__visual>[media],cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{object-position:center center}cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__visual>[media],cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{object-position:center bottom}@container (max-width: 719px){cx-hero .cx-hero--under-masthead{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-sm)*2)}cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:start;grid-column:1;grid-row:1}cx-hero .cx-hero--split .cx-hero__media{grid-column:1;grid-row:2}cx-hero .cx-hero--flush .cx-hero__copy,cx-hero .cx-hero--flush.cx-hero--media-start .cx-hero__copy{padding-inline:var(--gutter-page)}cx-hero .cx-hero--flush.cx-hero--under-masthead .cx-hero__copy{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-sm)*2)}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxHeroComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-hero", changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, host: {
                        "[attr.data-layout]": "layout",
                        "[attr.data-variant]": "variant",
                        "[attr.data-media-side]": "mediaSide",
                        "[attr.data-align]": "align",
                        "[attr.data-media-position]": "mediaPosition",
                    }, template: "@if (resolvedHeading(); as title) {\n  <header\n    class=\"cx-hero\"\n    [class.cx-hero--stacked]=\"layout === 'stacked'\"\n    [class.cx-hero--split]=\"layout === 'split'\"\n    [class.cx-hero--cover]=\"layout === 'cover'\"\n    [class.cx-hero--flush]=\"variant === 'flush'\"\n    [class.cx-hero--media-start]=\"mediaSide === 'start'\"\n    [class.cx-hero--center]=\"align === 'center'\"\n    [class.cx-hero--parallax]=\"parallax\"\n    [class.cx-hero--fade-bottom]=\"fadeBottom\"\n    [class.cx-hero--under-masthead]=\"underMasthead\"\n  >\n    @if (layout === \"cover\" && overlayOpacity > 0) {\n      <div\n        class=\"cx-hero__overlay\"\n        aria-hidden=\"true\"\n        [style.opacity]=\"overlayOpacity / 100\"\n      ></div>\n    }\n    <div class=\"cx-hero__copy\">\n      <div class=\"cx-hero__context\">\n        <ng-content select=\"[context], [cxHeroContext]\" />\n      </div>\n\n      <div class=\"cx-hero__message\">\n        <h1 class=\"cx-hero__heading\" [class]=\"headingClass\">{{ title }}</h1>\n        <div class=\"cx-hero__body\">\n          <ng-content select=\"[body], [cxHeroBody]\" />\n        </div>\n      </div>\n\n      <div class=\"cx-hero__actions\">\n        <ng-content select=\"[actions], [cxHeroActions]\" />\n      </div>\n\n      <div class=\"cx-hero__meta\">\n        <ng-content select=\"[meta], [cxHeroMeta]\" />\n      </div>\n    </div>\n\n    <figure\n      class=\"cx-hero__media\"\n      [attr.aria-hidden]=\"layout === 'cover' ? 'true' : null\"\n    >\n      <div class=\"cx-hero__visual\">\n        <ng-content select=\"[media], [cxHeroMedia]\" />\n      </div>\n      <figcaption class=\"cx-hero__caption\">\n        <ng-content select=\"[caption], [cxHeroCaption]\" />\n      </figcaption>\n    </figure>\n  </header>\n}\n", styles: ["cx-hero{display:block;width:100%;min-width:0;container-type:inline-size}cx-hero .cx-hero{position:relative;isolation:isolate;display:grid;width:100%;min-width:0;align-items:center;gap:var(--space-2xl);overflow:clip;padding-block:var(--space-2xl);padding-inline:max(var(--gutter-page),(100% - var(--measure-xl))/2);background:var(--surface);color:var(--ink)}cx-hero .cx-hero__copy{position:relative;z-index:1;display:grid;width:min(100%,var(--measure-lg));min-width:0;align-content:center;justify-self:start;gap:var(--space-lg)}cx-hero .cx-hero--under-masthead{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-md)*2)}cx-hero .cx-hero__message{display:grid;width:100%;max-width:18ch;font-family:var(--font-family-heading);font-size:var(--font-size-display);min-width:0;gap:var(--space-lg)}cx-hero .cx-hero__heading{max-width:16ch;color:var(--ink);font-family:var(--font-family-heading);font-size:var(--font-size-display);font-weight:var(--font-weight-editorial-heading);line-height:var(--line-height-display);overflow-wrap:anywhere;text-wrap:balance}cx-hero .cx-hero__context,cx-hero .cx-hero__actions,cx-hero .cx-hero__meta{display:flex;min-width:0;flex-wrap:wrap;align-items:center}cx-hero .cx-hero__context{gap:var(--space-sm);color:var(--accent);font-size:var(--font-size-body-lg);line-height:var(--line-height-body)}cx-hero .cx-hero__body{display:grid;width:100%;max-width:100%;min-width:0;gap:var(--space-sm);font-family:var(--font-family-base);color:var(--opacity-high);font-size:var(--font-size-editorial-lead);line-height:var(--line-height-editorial-lead)}cx-hero .cx-hero__actions{gap:var(--space-sm)}cx-hero .cx-hero__meta{gap:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}cx-hero .cx-hero__context:empty,cx-hero .cx-hero__body:empty,cx-hero .cx-hero__actions:empty,cx-hero .cx-hero__meta:empty,cx-hero .cx-hero__caption:empty,cx-hero .cx-hero__media:not(:has(.cx-hero__visual>*)){display:none}cx-hero .cx-hero__media{margin:0;position:relative;display:grid;width:100%;min-width:0;overflow:hidden;border-radius:var(--radius-media-lg)}cx-hero .cx-hero__visual>[media],cx-hero .cx-hero__visual>[cxHeroMedia]{display:block;width:100%;max-width:100%;min-width:0}cx-hero .cx-hero__visual{position:relative;min-width:0;min-height:0}cx-hero .cx-hero__visual>picture[media]>img,cx-hero .cx-hero__visual>picture[cxHeroMedia]>img{display:block;width:100%;height:100%;object-fit:inherit;object-position:inherit}cx-hero .cx-hero__caption{padding:var(--space-md) var(--space-lg);background:var(--surface);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}cx-hero .cx-hero--center .cx-hero__copy{justify-self:center;text-align:center}cx-hero .cx-hero--center .cx-hero__message{justify-self:center}cx-hero .cx-hero--center .cx-hero__heading,cx-hero .cx-hero--center .cx-hero__body{margin-inline:auto}cx-hero .cx-hero--center .cx-hero__context,cx-hero .cx-hero--center .cx-hero__actions,cx-hero .cx-hero--center .cx-hero__meta{justify-content:center}cx-hero .cx-hero--stacked .cx-hero__media{max-width:var(--measure-xl);justify-self:center}cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr) minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:end}cx-hero .cx-hero--media-start .cx-hero__media{grid-column:1;grid-row:1}cx-hero .cx-hero--media-start .cx-hero__copy{grid-column:2;grid-row:1;justify-self:start}cx-hero .cx-hero--flush{padding:0;gap:0;align-items:stretch}cx-hero .cx-hero--flush .cx-hero__copy{width:100%;padding-block:var(--space-2xl);padding-inline:max(var(--gutter-page),(100cqw - var(--measure-xl))/2) var(--space-2xl)}cx-hero .cx-hero--flush.cx-hero--media-start .cx-hero__copy{padding-inline:var(--space-2xl) max(var(--gutter-page),(100cqw - var(--measure-xl))/2)}cx-hero .cx-hero--flush.cx-hero--under-masthead{padding:0}cx-hero .cx-hero--flush.cx-hero--under-masthead .cx-hero__copy{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-md)*2)}cx-hero .cx-hero--flush .cx-hero__media{border-radius:var(--radius-none);grid-template-rows:minmax(0, 1fr) auto}cx-hero .cx-hero--flush .cx-hero__visual{min-height:calc(var(--space-2xl)*5)}cx-hero .cx-hero--flush .cx-hero__visual>[media],cx-hero .cx-hero--flush .cx-hero__visual>[cxHeroMedia]{position:absolute;inset:0;height:100%;object-fit:cover}cx-hero .cx-hero--cover{min-height:clamp(var(--space-2xl)*6,60svh,var(--space-2xl)*10)}cx-hero .cx-hero__overlay{position:absolute;z-index:-1;inset:0;background:var(--surface);pointer-events:none}cx-hero .cx-hero--cover.cx-hero--fade-bottom::before{position:absolute;z-index:0;inset:0;background:linear-gradient(to bottom, color-mix(in srgb, var(--surface) 0%, transparent) 50%, color-mix(in srgb, var(--surface) 4%, transparent) 58%, color-mix(in srgb, var(--surface) 12%, transparent) 66%, color-mix(in srgb, var(--surface) 28%, transparent) 75%, color-mix(in srgb, var(--surface) 50%, transparent) 84%, color-mix(in srgb, var(--surface) 76%, transparent) 92%, var(--surface) 100%);content:\"\";pointer-events:none}cx-hero .cx-hero--cover .cx-hero__copy,cx-hero .cx-hero--cover .cx-hero__heading,cx-hero .cx-hero--cover .cx-hero__context,cx-hero .cx-hero--cover .cx-hero__body,cx-hero .cx-hero--cover .cx-hero__meta{color:var(--ink)}cx-hero .cx-hero--cover .cx-hero__media{position:absolute;z-index:-2;grid-template-rows:minmax(0, 1fr);inset:0;height:100%;overflow:hidden;border-radius:var(--radius-none);background:var(--surface-alt)}cx-hero .cx-hero--cover .cx-hero__visual>[media],cx-hero .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{width:100%;height:100%;object-fit:cover}cx-hero .cx-hero--cover.cx-hero--parallax .cx-hero__media{transform:scale(1.18)}@supports(animation-timeline: view()){@media(prefers-reduced-motion: no-preference){cx-hero .cx-hero--cover.cx-hero--parallax{view-timeline:--cx-hero-parallax block;view-timeline-inset:0}cx-hero .cx-hero--cover.cx-hero--parallax .cx-hero__media{animation:cx-hero-parallax auto cubic-bezier(0.25, 0.2, 0.75, 0.8) both;animation-timeline:--cx-hero-parallax;animation-range:exit-crossing 0% exit-crossing 100%}}}@keyframes cx-hero-parallax{from{translate:0 0}to{translate:0 8%}}cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__visual>[media],cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{object-position:center top}cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__visual>[media],cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{object-position:center center}cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__visual>[media],cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__visual>[cxHeroMedia]{object-position:center bottom}@container (max-width: 719px){cx-hero .cx-hero--under-masthead{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-sm)*2)}cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:start;grid-column:1;grid-row:1}cx-hero .cx-hero--split .cx-hero__media{grid-column:1;grid-row:2}cx-hero .cx-hero--flush .cx-hero__copy,cx-hero .cx-hero--flush.cx-hero--media-start .cx-hero__copy{padding-inline:var(--gutter-page)}cx-hero .cx-hero--flush.cx-hero--under-masthead .cx-hero__copy{padding-top:calc(var(--space-2xl) + var(--controller-size-large) + var(--space-sm)*2)}}"] }]
        }], ctorParameters: () => [], propDecorators: { heading: [{
                type: Input,
                args: [{ required: true }]
            }], headingClass: [{
                type: Input
            }], layout: [{
                type: Input
            }], variant: [{
                type: Input
            }], mediaSide: [{
                type: Input
            }], align: [{
                type: Input
            }], mediaPosition: [{
                type: Input
            }], overlayOpacity: [{
                type: Input
            }], fadeBottom: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], parallax: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], underMasthead: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }] } });
function validateOption(name, value, supported) {
    if (!supported.includes(value)) {
        throw new Error(`[cx-hero] ${name} must be ${supported.join(", ")}.`);
    }
    return value;
}
