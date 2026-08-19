# Upgrade notes for cx-framework consumers

This file records what changed about **using** the library, version by version, for the
agent working in a consuming product. Read the section for every version between the one
the product currently has and the one it is moving to.

Scope: public component APIs, defaults, required markup, and behaviour a consumer can
observe or must adapt to. Not internals, not visual refinement, not source-side tooling.
`components/guidance.json` remains the authority for how to use a component *now*; this
file only explains what moved and what to do about it.

Entries name the component, state the change, and give the action to take. Every shipped
version has a section, including one that only says nothing changed for consumers: a
forgotten note and a quiet release must not look the same from here. Packaging refuses to
apply a version whose section is missing.

## 0.8.4

- `cx-dialog`, `cx-wizard-dialog`, `cx-fullscreen-dialog`, and `cx-detail-panel` — gained
  the additive synchronous `dismissRequest` output for user Cancel and dismiss routes. Its
  `CxDismissRequest` carries semantic reason `cancel` or `dismiss`; call
  `preventDefault()` before the handler returns to keep the original surface's DOM, state,
  open value, and overlay stack entry intact and run no closing focus restoration or
  fallback. A prevented request emits no legacy action, `openChange`, or `dismissed`. The
  handler may open a nested confirmation, which then becomes the top surface and may own
  focus. An
  unhandled request keeps the previous close behavior. Programmatic `[open]=false`,
  destruction, and completion routes do not emit this request. Use it where changed work
  may need confirmation; no migration is required otherwise.

## 0.8.3

- All overlays coordinated by `CxOverlayStateService` — including `cx-dialog`,
  `cx-context-dialog`, `cx-fullscreen-dialog`, `cx-lightbox`, `cx-loading-overlay`,
  `cx-popover`, `cx-detail-panel`, `cx-wizard-dialog`, and direct integrations — now settle
  focus restoration after the closing child has torn down and the surviving parent's focus
  maintenance has finished. A newer top overlay still takes precedence; otherwise the exact
  connected, visible, and focusable invoker is the final focus target. If that invoker is no
  longer valid, focus moves to the established target inside its owning surviving parent.
  Remove close timers, manual parent refocus, and focus-containment workarounds; no API
  migration is required.

## 0.8.2

- `cx-tooltip` — the tooltip surface is click-through (`pointer-events: none`), so a tooltip
  can never swallow hovers or clicks meant for elements beneath it; hovering the surface no
  longer holds it open. Remove any consumer-side workaround that repositioned or suppressed
  tooltips to keep nearby controls clickable.
- `cx-tooltip` — focus raises a tooltip only when it is keyboard focus (`:focus-visible`).
  Clicking a trigger no longer opens or pins its tooltip; Tab still does.
- `cx-tooltip` — a tooltip now closes, and stays closed, while its own trigger has an overlay
  open (dropdown, menu — anything that registers an overlay `owner`). The stale trigger
  tooltip that used to sit over the first options of a freshly opened menu is gone; nothing
  to adapt unless a consumer relied on it staying open.
- `cx-popover` — gained `owner`, the element that opened the popover. Anchored surfaces
  (dropdown, menu) pass their trigger; pass it on direct popover use too so tooltips on the
  trigger stand down while the popover is open. Omitting it keeps the old behaviour.
- `cx-option` — overflow tooltips sit to the right of the clipped label instead of below the
  row, so a tooltip never visually covers the next options in a list. No API change.
- `cx-card` — gained `tabs`, `selectedTabId`, `tabsAriaLabel`, and `selectedTabIdChange`. Passing
  `tabs` (the same `CxTabItem[]` the tabs component uses) renders a flush tab row between the
  header and the content island — no content padding around it, matching the detail panel — and
  the content region becomes the accessible tab panel. The consumer switches the projected
  content on `selectedTabIdChange`. Tabs inside the content still work and keep the padded
  treatment. Do not combine `tabs` with `href` or `interactive`: the card reports a console error
  and ignores them. Replace consumer-side tab rows wedged into card bodies with this when the
  tabs belong at the top.
- `cx-card` — gained `expandable` and `previewHeight` (default 240). An expandable card clamps
  content taller than `previewHeight` behind a fade and a full-width chevron footer control that
  toggles the card between the preview and its natural height (announced as "Show more" / "Show
  less" to assistive tech); keyboard focus entering the clipped region expands it automatically.
  The control renders only when content actually overflows, so short content stays a completely
  normal card. Do not combine it with `href` or `interactive`: an activatable card cannot host an
  inner control, and the card reports a console error and ignores `expandable`. Replace
  consumer-side "show more" clamps around card content with this.
- `cx-side-nav` — a collapsible group or nested parent that holds the active route now
  starts open, so entering or reloading a sub page keeps its section unfolded. Everything
  else still starts closed, groups still collapse each other accordion-style, and an
  explicit toggle still wins. No API change; remove any consumer-side code that reopened
  the active section manually.
- `cx-side-nav` — `CxSideNavItem` gained `queryParams` and `queryParamsHandling`, and
  `routerLink` now also accepts a typed `UrlTree`. Use `routerLink` plus `queryParams` for an
  internal query-driven destination; `routerLinkActiveOptions.queryParams` chooses exact or
  subset matching, and the component now derives the link, active treatment, group state,
  and `aria-current="page"` from that same destination. Replace internal `href` links, click
  interception, redirects, and active-state overrides with the supported router definition.
  A `UrlTree` is already complete, so combining one with `queryParams`,
  `queryParamsHandling`, or `fragment` now throws a clear framework error. Keep `href` for
  genuinely external destinations.
- `cx-state-message` — action objects no longer accept `transparent`. Every action renders
  as a solid button. Remove the property; use `mood` to separate a primary action from a
  secondary one.
- `cx-state-message` — each `state` now supplies the icon that matches it, so a state
  message no longer needs an `icon` at all. Pass `icon` only to override that mark. Binding
  `icon` to `undefined` no longer hides it; use `visual="none"` to render no mark.
- `cx-state-message` — in `layout="horizontal"` the icon and the text block are aligned to
  the top, and the icon is lifted so its ink starts on the heading's cap line. Remove any
  local alignment or offset that compensated for the old centring.
- `cx-labeled-row` — built-in input, textarea, and select content now receives the row's
  visible label as its accessible name. No consumer change is required; remove any
  duplicate screen-reader-only label added solely to compensate for the missing name.
- `cx-dialog` — projected `[body]` content always sits inside the dialog's padded,
  scrollable content region, whether or not `description` is set. Remove padding, margins,
  or scroll containers added to the projected wrapper to make up for the old behaviour.
- `cx-dialog`, `cx-context-dialog`, and `cx-wizard-dialog` — nested overlays now consume Escape from the top down,
  one overlay per keypress, and later-opened layers now paint above their parents regardless of
  template order. A top overlay that cannot dismiss, including a loading wizard, still blocks
  every overlay and page behind it. Remove consumer document listeners, guards, z-index patches,
  or propagation workarounds added to coordinate nested dismissal.
- `cx-dialog`, `cx-context-dialog`, and `cx-wizard-dialog` — closing restores the invoking
  control when it remains focusable, or a meaningful target in the surviving parent surface
  when it does not. A wizard step change that removes the focused control moves focus into the
  destination step after it renders without disturbing persistent controls. Remove consumer
  focus timers, step targets, and close handlers added solely to recover focus.
- `CxOverlayStateService.capture` — direct overlay integrations should provide `surface`, plus
  `layerSurfaces` when a backdrop and surface paint as sibling roots, so logical and visual
  order remain aligned. An active capture without `onEscape` intentionally consumes Escape and
  blocks every lower overlay.
- `cx-log-step` — `CxLogStep` gained `withLink`, which turns the step text into a link:
  `withLink({ routerLink })` for a destination inside the product, `withLink({ href, target })`
  for one outside it. The text keeps its colour and gains an underline. Use it when the step
  names something that has its own page; leave it unlinked otherwise.
