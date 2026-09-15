import { DOCUMENT } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, inject, } from "@angular/core";
import { STORE_BUTTON_ARTWORK } from "./store-button-artwork.js";
import * as i0 from "@angular/core";
/** Validates the destination without requesting the listing or changing the supplied URL. */
export function isCxStoreButtonHref(href, store) {
    let url;
    try {
        url = new URL(href);
    }
    catch {
        return false;
    }
    if (url.protocol !== "https:" || url.username || url.password || url.port)
        return false;
    if (store === "app-store") {
        return (url.hostname === "apps.apple.com" &&
            /^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d+\/?$/.test(url.pathname));
    }
    return (store === "google-play" &&
        url.hostname === "play.google.com" &&
        url.pathname === "/store/apps/details" &&
        !!url.searchParams.get("id")?.trim());
}
const LABELS = {
    en: {
        "app-store": "Download on the App Store",
        "google-play": "Get it on Google Play",
    },
    sv: {
        "app-store": "Hämta i App Store",
        "google-play": "Ladda ned på Google Play",
    },
};
export class CxStoreButtonComponent {
    document = inject(DOCUMENT);
    locale = inject(LOCALE_ID);
    href = "";
    store = "app-store";
    size = "default";
    language = undefined;
    appName = "";
    ngOnChanges() {
        if (!isCxStoreButtonHref(this.href, this.store)) {
            throw new Error("cx-store-button: href must be an HTTPS app listing URL for the selected store.");
        }
        if (this.size !== "default" && this.size !== "large") {
            throw new Error("cx-store-button: size must be default or large.");
        }
        if (this.language !== undefined &&
            this.language !== "en" &&
            this.language !== "sv") {
            throw new Error("cx-store-button: language must be en, sv, or omitted for the page language.");
        }
    }
    get resolvedLanguage() {
        const language = this.language ?? (this.document.documentElement.lang || this.locale);
        return language.toLowerCase().split("-")[0] === "sv" ? "sv" : "en";
    }
    get artwork() {
        return STORE_BUTTON_ARTWORK[this.store][this.resolvedLanguage];
    }
    get accessibleName() {
        const label = LABELS[this.resolvedLanguage][this.store];
        return this.appName.trim() ? `${label} — ${this.appName.trim()}` : label;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStoreButtonComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxStoreButtonComponent, isStandalone: true, selector: "cx-store-button", inputs: { href: "href", store: "store", size: "size", language: "language", appName: "appName" }, usesOnChanges: true, ngImport: i0, template: "<a\n  class=\"cx-store-button\"\n  [class.cx-store-button--large]=\"size === 'large'\"\n  [href]=\"href\"\n  [attr.aria-label]=\"accessibleName\"\n  [attr.lang]=\"resolvedLanguage\"\n>\n  <span\n    class=\"cx-store-button__artwork\"\n    [style.aspect-ratio]=\"artwork.aspectRatio\"\n  >\n    <img\n      [src]=\"artwork.src\"\n      [attr.width]=\"artwork.width\"\n      [attr.height]=\"artwork.height\"\n      [style.height.%]=\"artwork.imageHeightPercent\"\n      [style.top.%]=\"artwork.imageTopPercent\"\n      [style.left.%]=\"artwork.imageLeftPercent\"\n      alt=\"\"\n      draggable=\"false\"\n    />\n  </span>\n</a>\n", styles: [":host{display:inline-flex;flex:0 0 auto;vertical-align:middle}.cx-store-button{display:inline-flex;padding:calc(var(--controller-size-large)/4);cursor:pointer;text-decoration:none;outline:none}.cx-store-button:focus-visible{outline:calc(var(--border-width)*2) solid var(--primary);outline-offset:var(--space-2xs)}.cx-store-button__artwork{position:relative;display:block;height:var(--controller-size-large);flex:0 0 auto}.cx-store-button__artwork img{position:absolute;display:block;width:auto;max-width:none;pointer-events:none}.cx-store-button--large{padding:calc((var(--controller-size-large) + var(--space-md))/4)}.cx-store-button--large .cx-store-button__artwork{height:calc(var(--controller-size-large) + var(--space-md))}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStoreButtonComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-store-button", changeDetection: ChangeDetectionStrategy.OnPush, template: "<a\n  class=\"cx-store-button\"\n  [class.cx-store-button--large]=\"size === 'large'\"\n  [href]=\"href\"\n  [attr.aria-label]=\"accessibleName\"\n  [attr.lang]=\"resolvedLanguage\"\n>\n  <span\n    class=\"cx-store-button__artwork\"\n    [style.aspect-ratio]=\"artwork.aspectRatio\"\n  >\n    <img\n      [src]=\"artwork.src\"\n      [attr.width]=\"artwork.width\"\n      [attr.height]=\"artwork.height\"\n      [style.height.%]=\"artwork.imageHeightPercent\"\n      [style.top.%]=\"artwork.imageTopPercent\"\n      [style.left.%]=\"artwork.imageLeftPercent\"\n      alt=\"\"\n      draggable=\"false\"\n    />\n  </span>\n</a>\n", styles: [":host{display:inline-flex;flex:0 0 auto;vertical-align:middle}.cx-store-button{display:inline-flex;padding:calc(var(--controller-size-large)/4);cursor:pointer;text-decoration:none;outline:none}.cx-store-button:focus-visible{outline:calc(var(--border-width)*2) solid var(--primary);outline-offset:var(--space-2xs)}.cx-store-button__artwork{position:relative;display:block;height:var(--controller-size-large);flex:0 0 auto}.cx-store-button__artwork img{position:absolute;display:block;width:auto;max-width:none;pointer-events:none}.cx-store-button--large{padding:calc((var(--controller-size-large) + var(--space-md))/4)}.cx-store-button--large .cx-store-button__artwork{height:calc(var(--controller-size-large) + var(--space-md))}"] }]
        }], propDecorators: { href: [{
                type: Input,
                args: [{ required: true }]
            }], store: [{
                type: Input
            }], size: [{
                type: Input
            }], language: [{
                type: Input
            }], appName: [{
                type: Input
            }] } });
