/**
 * The heading menu: the faces `--font-family-heading` may point at.
 *
 * A product's identity is Inter plus exactly one of these — body and mono never
 * vary, and no page shows two heading faces at once. Everything here is named
 * by voice rather than by font, so replacing the file behind a voice never
 * makes the name lie; `condensed` is the deliberate exception, because width is
 * genuinely the reason that face gets picked.
 *
 * The values live in `tokens/_typography.scss` as `--typeface-*`. This file is
 * the same menu for code that has to name a face — a Playground project
 * declaring the one it opens in, say — so nothing has to hardcode the custom
 * property name or the font itself.
 */
export declare const CX_TYPEFACES: readonly [{
    readonly id: "editorial";
    readonly label: "Editorial";
    readonly voice: "Considered, print-derived, assertive at size";
}, {
    readonly id: "friendly";
    readonly label: "Friendly";
    readonly voice: "Warm, rounded, contemporary";
}, {
    readonly id: "elegant";
    readonly label: "Elegant";
    readonly voice: "Refined, geometric, quietly confident";
}, {
    readonly id: "condensed";
    readonly label: "Condensed";
    readonly voice: "Dense, journalistic, width-efficient";
}];
export type CxTypefaceDefinition = (typeof CX_TYPEFACES)[number];
export type CxTypeface = CxTypefaceDefinition['id'];
/** The face every product falls back to when it does not choose one. */
export declare const CX_TYPEFACE_DEFAULT: CxTypeface;
/**
 * The custom property holding `typeface`, for a caller pointing
 * `--font-family-heading` at it.
 */
export declare function cxTypefaceProperty(typeface: CxTypeface): string;
export declare function isCxTypeface(value: unknown): value is CxTypeface;
//# sourceMappingURL=typeface.d.ts.map