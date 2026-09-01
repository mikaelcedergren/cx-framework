/**
 * The heading menu: the faces `--font-family-heading` may point at.
 *
 * A product's identity is Inter plus exactly one of these — body and mono never
 * vary, and no page shows two heading faces at once. Everything here is named
 * by voice rather than by font, so replacing the file behind a voice never
 * makes the name lie; `condensed` and `slab` are deliberate exceptions, because
 * width and serif structure are genuinely why those faces get picked.
 *
 * The values live in `tokens/_typography.scss` as `--typeface-*`. This file is
 * the same menu for code that has to name a face — a Playground project
 * declaring the one it opens in, say — so nothing has to hardcode the custom
 * property name or the font itself.
 */
export const CX_TYPEFACES = [
  { id: 'editorial', label: 'Editorial', voice: 'Considered, print-derived, assertive at size' },
  { id: 'friendly', label: 'Friendly', voice: 'Open, welcoming, contemporary' },
  { id: 'elegant', label: 'Elegant', voice: 'Refined, geometric, quietly confident' },
  { id: 'condensed', label: 'Condensed', voice: 'Dense, journalistic, width-efficient' },
  { id: 'slab', label: 'Slab', voice: 'Characterful, sturdy, literary' },
] as const satisfies readonly { id: string; label: string; voice: string }[];

export type CxTypefaceDefinition = (typeof CX_TYPEFACES)[number];
export type CxTypeface = CxTypefaceDefinition['id'];

/** The face every product falls back to when it does not choose one. */
export const CX_TYPEFACE_DEFAULT: CxTypeface = 'editorial';

/**
 * The custom property holding `typeface`, for a caller pointing
 * `--font-family-heading` at it.
 */
export function cxTypefaceProperty(typeface: CxTypeface): string {
  return `--typeface-${typeface}`;
}

const CX_TYPEFACE_SET: ReadonlySet<string> = new Set(CX_TYPEFACES.map(typeface => typeface.id));

export function isCxTypeface(value: unknown): value is CxTypeface {
  return typeof value === 'string' && CX_TYPEFACE_SET.has(value);
}
