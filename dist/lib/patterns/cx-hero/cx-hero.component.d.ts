import { AfterContentInit } from "@angular/core";
import * as i0 from "@angular/core";
export type CxHeroVariant = "cover" | "split" | "stacked";
export type CxHeroAlign = "start" | "center";
export type CxHeroMediaPosition = "top" | "center" | "bottom";
/**
 * Page introduction for a public, editorial, or marketing surface.
 *
 * The hero owns one h1, its supporting hierarchy, the placement of optional
 * projected content, and three complete responsive compositions. The parent
 * still owns where the hero sits and whether that region is full bleed.
 */
export declare class CxHeroComponent implements AfterContentInit {
    private readonly host;
    private contentReady;
    private variantValue;
    private alignValue;
    private overlayOpacityValue;
    private mediaPositionValue;
    constructor();
    /** Required page heading. Empty text removes the whole hero. */
    heading: string;
    /** Utility classes applied directly to the heading; empty keeps the default. */
    headingClass: string;
    /** Responsive composition. Split and cover require projected media. */
    set variant(value: CxHeroVariant);
    get variant(): CxHeroVariant;
    /** Copy alignment. Split heroes accept start only. */
    set align(value: CxHeroAlign);
    get align(): CxHeroAlign;
    /** Coarse vertical crop position for cover media. */
    set mediaPosition(value: CxHeroMediaPosition);
    get mediaPosition(): CxHeroMediaPosition;
    /** Theme-surface overlay percentage. Zero leaves cover media untreated. */
    set overlayOpacity(value: number);
    get overlayOpacity(): number;
    /** Smoothly blends the lower half of cover media into the default surface. */
    fadeBottom: boolean;
    /** Reserves space for an overlapping masthead while media extends behind it. */
    underMasthead: boolean;
    ngAfterContentInit(): void;
    protected resolvedHeading(): string;
    private validateComposition;
    private hasProjectedMedia;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxHeroComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxHeroComponent, "cx-hero", never, { "heading": { "alias": "heading"; "required": true; }; "headingClass": { "alias": "headingClass"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "align": { "alias": "align"; "required": false; }; "mediaPosition": { "alias": "mediaPosition"; "required": false; }; "overlayOpacity": { "alias": "overlayOpacity"; "required": false; }; "fadeBottom": { "alias": "fadeBottom"; "required": false; }; "underMasthead": { "alias": "underMasthead"; "required": false; }; }, {}, never, ["[context], [cxHeroContext]", "[body], [cxHeroBody]", "[actions], [cxHeroActions]", "[meta], [cxHeroMeta]", "[media], [cxHeroMedia]"], true, never>;
    static ngAcceptInputType_fadeBottom: unknown;
    static ngAcceptInputType_underMasthead: unknown;
}
//# sourceMappingURL=cx-hero.component.d.ts.map