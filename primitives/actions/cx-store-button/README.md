# Store button

A standalone app-store badge with available, disabled, and coming-soon states. It does not use or extend Button.

- `href`: required for an available link; may be omitted when `disabled` or `comingSoon`. When supplied, it must be an HTTPS listing at `apps.apple.com` or `play.google.com/store/apps/details?id=…`, matching `store`. Tracking query parameters are preserved. Invalid supplied destinations fail explicitly, including in unavailable states.
- `store`: `app-store` (default) or `google-play`.
- `size`: `default` (48px painted badge) or `large` (64px with the current tokens). Natural width, no shrinking or stretching.
- `language`: optional `en` or `sv`. Omission reads the document language, then Angular's locale. Unsupported page languages use English. Localized artwork and accessible wording change together.
- `appName`: optional accessible-name suffix. It never replaces the official visible wording.

Native same-tab link semantics preserve browser menus, modifier clicks and device store handoff. There are no loading, custom-label, colour, target or event options. The page owns availability and wrapping: place App Store first, with Google Play at the same painted height. Use the existing Inline with wrapping enabled for a pair.

## Availability

- `disabled`: boolean, default `false`. Makes the badge inactive. The component removes the
  destination, excludes the link from Tab navigation, announces `aria-disabled`, and dims the
  artwork with the shared disabled-visibility token. No pointer, keyboard, modifier-click, or
  context-menu navigation is possible without a destination.
- `comingSoon`: boolean, default `false`. Implies the same unavailable state and adds a readable
  “Coming soon” caption (“Kommer snart” in Swedish) inside the component, below the artwork.
  It takes precedence over `disabled="false"`. The accessible name identifies the upcoming store
  and optional app name. The original artwork is not rewritten or overprinted.
- An empty URL is valid only while unavailable. A supplied URL must always match the selected
  store. Returning to availability requires a valid URL.

```html
<cx-store-button comingSoon appName="My app" />
<cx-store-button disabled href="https://apps.apple.com/app/id123456789" />
```

## Artwork and geometry

Original vendor files retrieved 2026-09-15, embedded unchanged as image data URLs so consumers need no asset-copy step or external image connection:

- [Apple English](https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us.svg)
- [Apple Swedish](https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/sv-se.svg)
- [Google Play English](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png)
- [Google Play Swedish](https://play.google.com/intl/en_us/badges/static/images/badges/sv_badge_web_generic.png)

Apple's SVG canvas is 119.66407 × 40. Google's PNG canvases are 646 × 250, but their painted bounds differ: English (41, 41)–(605, 209), Swedish (0, 29)–(646, 221). Artwork metadata positions the full, unmodified image relative to its painted box. No crop, recolouring, corner treatment, font substitution, or image filter is applied.

Each link reserves one-quarter of its painted height on all sides. This accommodates the original transparent pixels and preserves a usable focus perimeter. Official artwork owns brand colours and proportions; existing global control-size, spacing and primary-focus tokens own the surrounding interaction. No new tokens or component-local styling variables.

Follow [Apple's marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/) and [Google's badge guidance](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/). These assets remain vendor artwork under their respective terms.
