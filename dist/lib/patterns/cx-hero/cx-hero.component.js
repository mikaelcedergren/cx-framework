import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewEncapsulation, afterEveryRender, booleanAttribute, inject, } from "@angular/core";
import * as i0 from "@angular/core";
const HERO_VARIANTS = ["cover", "split", "stacked"];
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
    variantValue = "cover";
    alignValue = "start";
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
    /** Responsive composition. Split and cover require projected media. */
    set variant(value) {
        this.variantValue = validateOption("variant", value, HERO_VARIANTS);
    }
    get variant() {
        return this.variantValue;
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
    /** Smoothly blends the lower half of cover media into the default surface. */
    fadeBottom = false;
    ngAfterContentInit() {
        this.contentReady = true;
    }
    resolvedHeading() {
        return this.heading.trim();
    }
    validateComposition() {
        if (this.fadeBottom && this.variantValue !== "cover") {
            throw new Error('[cx-hero] fadeBottom requires variant="cover".');
        }
        if (this.variantValue === "split" && this.alignValue !== "start") {
            throw new Error('[cx-hero] split variant requires align="start".');
        }
        if ((this.variantValue === "split" || this.variantValue === "cover") &&
            !this.hasProjectedMedia()) {
            throw new Error(`[cx-hero] ${this.variantValue} variant requires the media slot.`);
        }
    }
    hasProjectedMedia() {
        const media = this.host.nativeElement.querySelector(":scope > .cx-hero > .cx-hero__media");
        return Boolean(media && (media.childElementCount > 0 || media.textContent?.trim()));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxHeroComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxHeroComponent, isStandalone: true, selector: "cx-hero", inputs: { heading: "heading", variant: "variant", align: "align", mediaPosition: "mediaPosition", fadeBottom: ["fadeBottom", "fadeBottom", booleanAttribute] }, host: { properties: { "attr.data-variant": "variant", "attr.data-align": "align", "attr.data-media-position": "mediaPosition" } }, ngImport: i0, template: "@if (resolvedHeading(); as title) {\n  <header\n    class=\"cx-hero\"\n    [class.cx-hero--stacked]=\"variant === 'stacked'\"\n    [class.cx-hero--split]=\"variant === 'split'\"\n    [class.cx-hero--cover]=\"variant === 'cover'\"\n    [class.cx-hero--center]=\"align === 'center'\"\n    [class.cx-hero--fade-bottom]=\"fadeBottom\"\n  >\n    <div class=\"cx-hero__copy\">\n      <div class=\"cx-hero__context\">\n        <ng-content select=\"[context], [cxHeroContext]\" />\n      </div>\n\n      <div class=\"cx-hero__message\">\n        <h1 class=\"cx-hero__heading\">{{ title }}</h1>\n        <div class=\"cx-hero__body\">\n          <ng-content select=\"[body], [cxHeroBody]\" />\n        </div>\n      </div>\n\n      <div class=\"cx-hero__actions\">\n        <ng-content select=\"[actions], [cxHeroActions]\" />\n      </div>\n\n      <div class=\"cx-hero__meta\">\n        <ng-content select=\"[meta], [cxHeroMeta]\" />\n      </div>\n    </div>\n\n    <div\n      class=\"cx-hero__media\"\n      [attr.aria-hidden]=\"variant === 'cover' ? 'true' : null\"\n    >\n      <ng-content select=\"[media], [cxHeroMedia]\" />\n    </div>\n  </header>\n}\n", styles: ["cx-hero{display:block;width:100%;min-width:0;container-type:inline-size}cx-hero .cx-hero{position:relative;isolation:isolate;display:grid;width:100%;min-width:0;align-items:center;gap:var(--space-2xl);overflow:clip;padding:var(--space-2xl) var(--gutter-page);background:var(--surface);color:var(--ink)}cx-hero .cx-hero__copy{position:relative;z-index:1;display:grid;width:min(100%,var(--measure-md));min-width:0;align-content:center;justify-self:start;gap:var(--space-lg)}cx-hero .cx-hero__message{display:grid;min-width:0;gap:var(--space-lg)}cx-hero .cx-hero__heading{max-width:16ch;color:var(--ink);font-family:var(--font-family-heading);font-size:var(--font-size-display);font-weight:var(--font-weight-editorial-heading);line-height:var(--line-height-display);overflow-wrap:anywhere;text-wrap:balance}cx-hero .cx-hero__context,cx-hero .cx-hero__actions,cx-hero .cx-hero__meta{display:flex;min-width:0;flex-wrap:wrap;align-items:center}cx-hero .cx-hero__context{gap:var(--space-sm);color:var(--accent);font-size:var(--font-size-body-lg);line-height:var(--line-height-body)}cx-hero .cx-hero__body{display:grid;max-width:var(--measure-lg);min-width:0;gap:var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-editorial-lead);line-height:var(--line-height-editorial-lead)}cx-hero .cx-hero__actions{gap:var(--space-sm)}cx-hero .cx-hero__meta{gap:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}cx-hero .cx-hero__context:empty,cx-hero .cx-hero__body:empty,cx-hero .cx-hero__actions:empty,cx-hero .cx-hero__meta:empty,cx-hero .cx-hero__media:empty{display:none}cx-hero .cx-hero__media{position:relative;display:grid;width:100%;min-width:0;overflow:hidden;border-radius:var(--radius-media-lg)}cx-hero .cx-hero__media>[media],cx-hero .cx-hero__media>[cxHeroMedia]{display:block;width:100%;max-width:100%;min-width:0}cx-hero .cx-hero--center .cx-hero__copy{justify-self:center;text-align:center}cx-hero .cx-hero--center .cx-hero__heading,cx-hero .cx-hero--center .cx-hero__body{margin-inline:auto}cx-hero .cx-hero--center .cx-hero__context,cx-hero .cx-hero--center .cx-hero__actions,cx-hero .cx-hero--center .cx-hero__meta{justify-content:center}cx-hero .cx-hero--stacked .cx-hero__media{max-width:var(--measure-xl);justify-self:center}cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr) minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:end}cx-hero .cx-hero--cover{min-height:clamp(var(--space-2xl)*6,60svh,var(--space-2xl)*10)}cx-hero .cx-hero--cover::after{position:absolute;z-index:-1;inset:0;background:color-mix(in srgb, var(--overlay-backdrop) 72%, transparent);content:\"\";pointer-events:none}cx-hero .cx-hero--cover.cx-hero--fade-bottom::before{position:absolute;z-index:0;inset:0;background:linear-gradient(to bottom, color-mix(in srgb, var(--surface) 0%, transparent) 50%, color-mix(in srgb, var(--surface) 4%, transparent) 58%, color-mix(in srgb, var(--surface) 12%, transparent) 66%, color-mix(in srgb, var(--surface) 28%, transparent) 75%, color-mix(in srgb, var(--surface) 50%, transparent) 84%, color-mix(in srgb, var(--surface) 76%, transparent) 92%, var(--surface) 100%);content:\"\";pointer-events:none}cx-hero .cx-hero--cover .cx-hero__copy{color:var(--on-ink)}cx-hero .cx-hero--cover .cx-hero__heading{color:var(--on-ink)}cx-hero .cx-hero--cover .cx-hero__context{color:color-mix(in srgb, var(--on-ink) 90%, transparent)}cx-hero .cx-hero--cover .cx-hero__body{color:color-mix(in srgb, var(--on-ink) 86%, transparent)}cx-hero .cx-hero--cover .cx-hero__meta{color:color-mix(in srgb, var(--on-ink) 70%, transparent)}cx-hero .cx-hero--cover .cx-hero__media{position:absolute;z-index:-2;inset:0;height:100%;overflow:hidden;border-radius:var(--radius-none);background:var(--surface-alt)}cx-hero .cx-hero--cover .cx-hero__media>[media],cx-hero .cx-hero--cover .cx-hero__media>[cxHeroMedia]{width:100%;height:100%;object-fit:cover}cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__media>[media],cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__media>[cxHeroMedia]{object-position:center top}cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__media>[media],cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__media>[cxHeroMedia]{object-position:center center}cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__media>[media],cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__media>[cxHeroMedia]{object-position:center bottom}@container (max-width: 719px){cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:start}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxHeroComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-hero", changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, host: {
                        "[attr.data-variant]": "variant",
                        "[attr.data-align]": "align",
                        "[attr.data-media-position]": "mediaPosition",
                    }, template: "@if (resolvedHeading(); as title) {\n  <header\n    class=\"cx-hero\"\n    [class.cx-hero--stacked]=\"variant === 'stacked'\"\n    [class.cx-hero--split]=\"variant === 'split'\"\n    [class.cx-hero--cover]=\"variant === 'cover'\"\n    [class.cx-hero--center]=\"align === 'center'\"\n    [class.cx-hero--fade-bottom]=\"fadeBottom\"\n  >\n    <div class=\"cx-hero__copy\">\n      <div class=\"cx-hero__context\">\n        <ng-content select=\"[context], [cxHeroContext]\" />\n      </div>\n\n      <div class=\"cx-hero__message\">\n        <h1 class=\"cx-hero__heading\">{{ title }}</h1>\n        <div class=\"cx-hero__body\">\n          <ng-content select=\"[body], [cxHeroBody]\" />\n        </div>\n      </div>\n\n      <div class=\"cx-hero__actions\">\n        <ng-content select=\"[actions], [cxHeroActions]\" />\n      </div>\n\n      <div class=\"cx-hero__meta\">\n        <ng-content select=\"[meta], [cxHeroMeta]\" />\n      </div>\n    </div>\n\n    <div\n      class=\"cx-hero__media\"\n      [attr.aria-hidden]=\"variant === 'cover' ? 'true' : null\"\n    >\n      <ng-content select=\"[media], [cxHeroMedia]\" />\n    </div>\n  </header>\n}\n", styles: ["cx-hero{display:block;width:100%;min-width:0;container-type:inline-size}cx-hero .cx-hero{position:relative;isolation:isolate;display:grid;width:100%;min-width:0;align-items:center;gap:var(--space-2xl);overflow:clip;padding:var(--space-2xl) var(--gutter-page);background:var(--surface);color:var(--ink)}cx-hero .cx-hero__copy{position:relative;z-index:1;display:grid;width:min(100%,var(--measure-md));min-width:0;align-content:center;justify-self:start;gap:var(--space-lg)}cx-hero .cx-hero__message{display:grid;min-width:0;gap:var(--space-lg)}cx-hero .cx-hero__heading{max-width:16ch;color:var(--ink);font-family:var(--font-family-heading);font-size:var(--font-size-display);font-weight:var(--font-weight-editorial-heading);line-height:var(--line-height-display);overflow-wrap:anywhere;text-wrap:balance}cx-hero .cx-hero__context,cx-hero .cx-hero__actions,cx-hero .cx-hero__meta{display:flex;min-width:0;flex-wrap:wrap;align-items:center}cx-hero .cx-hero__context{gap:var(--space-sm);color:var(--accent);font-size:var(--font-size-body-lg);line-height:var(--line-height-body)}cx-hero .cx-hero__body{display:grid;max-width:var(--measure-lg);min-width:0;gap:var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-editorial-lead);line-height:var(--line-height-editorial-lead)}cx-hero .cx-hero__actions{gap:var(--space-sm)}cx-hero .cx-hero__meta{gap:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}cx-hero .cx-hero__context:empty,cx-hero .cx-hero__body:empty,cx-hero .cx-hero__actions:empty,cx-hero .cx-hero__meta:empty,cx-hero .cx-hero__media:empty{display:none}cx-hero .cx-hero__media{position:relative;display:grid;width:100%;min-width:0;overflow:hidden;border-radius:var(--radius-media-lg)}cx-hero .cx-hero__media>[media],cx-hero .cx-hero__media>[cxHeroMedia]{display:block;width:100%;max-width:100%;min-width:0}cx-hero .cx-hero--center .cx-hero__copy{justify-self:center;text-align:center}cx-hero .cx-hero--center .cx-hero__heading,cx-hero .cx-hero--center .cx-hero__body{margin-inline:auto}cx-hero .cx-hero--center .cx-hero__context,cx-hero .cx-hero--center .cx-hero__actions,cx-hero .cx-hero--center .cx-hero__meta{justify-content:center}cx-hero .cx-hero--stacked .cx-hero__media{max-width:var(--measure-xl);justify-self:center}cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr) minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:end}cx-hero .cx-hero--cover{min-height:clamp(var(--space-2xl)*6,60svh,var(--space-2xl)*10)}cx-hero .cx-hero--cover::after{position:absolute;z-index:-1;inset:0;background:color-mix(in srgb, var(--overlay-backdrop) 72%, transparent);content:\"\";pointer-events:none}cx-hero .cx-hero--cover.cx-hero--fade-bottom::before{position:absolute;z-index:0;inset:0;background:linear-gradient(to bottom, color-mix(in srgb, var(--surface) 0%, transparent) 50%, color-mix(in srgb, var(--surface) 4%, transparent) 58%, color-mix(in srgb, var(--surface) 12%, transparent) 66%, color-mix(in srgb, var(--surface) 28%, transparent) 75%, color-mix(in srgb, var(--surface) 50%, transparent) 84%, color-mix(in srgb, var(--surface) 76%, transparent) 92%, var(--surface) 100%);content:\"\";pointer-events:none}cx-hero .cx-hero--cover .cx-hero__copy{color:var(--on-ink)}cx-hero .cx-hero--cover .cx-hero__heading{color:var(--on-ink)}cx-hero .cx-hero--cover .cx-hero__context{color:color-mix(in srgb, var(--on-ink) 90%, transparent)}cx-hero .cx-hero--cover .cx-hero__body{color:color-mix(in srgb, var(--on-ink) 86%, transparent)}cx-hero .cx-hero--cover .cx-hero__meta{color:color-mix(in srgb, var(--on-ink) 70%, transparent)}cx-hero .cx-hero--cover .cx-hero__media{position:absolute;z-index:-2;inset:0;height:100%;overflow:hidden;border-radius:var(--radius-none);background:var(--surface-alt)}cx-hero .cx-hero--cover .cx-hero__media>[media],cx-hero .cx-hero--cover .cx-hero__media>[cxHeroMedia]{width:100%;height:100%;object-fit:cover}cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__media>[media],cx-hero[data-media-position=top] .cx-hero--cover .cx-hero__media>[cxHeroMedia]{object-position:center top}cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__media>[media],cx-hero[data-media-position=center] .cx-hero--cover .cx-hero__media>[cxHeroMedia]{object-position:center center}cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__media>[media],cx-hero[data-media-position=bottom] .cx-hero--cover .cx-hero__media>[cxHeroMedia]{object-position:center bottom}@container (max-width: 719px){cx-hero .cx-hero--split{grid-template-columns:minmax(0, 1fr)}cx-hero .cx-hero--split .cx-hero__copy{justify-self:start}}"] }]
        }], ctorParameters: () => [], propDecorators: { heading: [{
                type: Input,
                args: [{ required: true }]
            }], variant: [{
                type: Input
            }], align: [{
                type: Input
            }], mediaPosition: [{
                type: Input
            }], fadeBottom: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }] } });
function validateOption(name, value, supported) {
    if (!supported.includes(value)) {
        throw new Error(`[cx-hero] ${name} must be ${supported.join(", ")}.`);
    }
    return value;
}
