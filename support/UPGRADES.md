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

## 0.8.6

- `cx-side-nav` — additive: `collapsible` renders a collapse toggle at the end of the
  header row, and `collapsed` (two-way via `collapsedChange`) switches the nav into an
  icon-only rail: instant right-side tooltips carry the labels, badges become a tone dot
  on the icon corner, an iconless top-level row shows its first letter, and clicking a
  parent row opens its section as a flyout menu beside the rail — headed by the section
  label, marking the active destination, navigating on select while the nav stays
  collapsed. Flyout rows are menu commands, not anchors, so in-flyout selection has no
  cmd-click/new-tab semantics; the expanded menu keeps real links. A collapsible nav
  clips labels to a single line to keep row geometry stable between states, and the nav
  fades slotted `[header]` content out itself while collapsed; slotted `[footer]` content
  must follow the state through its own API. Existing navs change nothing without opting
  in.
- `cx-account-control` — additive: `collapsed` shrinks the control to its avatar and
  moves the username into an instant tooltip on the right; the menu keeps working from
  the avatar. Bind it to the surrounding navigation's collapsed state.
- `cx-menu` and `cx-popover` — additive: `placement` (`'auto' | 'top' | 'right' |
  'bottom' | 'left'`, default `auto`) chooses which side of the anchor a menu surface
  opens on; explicit sides are honored and viewport-clamped, with `left`/`right` falling
  back to the opposite side only when the requested one has no room. A context
  presentation may now carry an `owner` element: tooltips on it stand down while the
  menu is open, focus returns to it on close, and a side placement hugs its rect.
  `cx-popover` accepts `left`/`right` in its `placement` input and animates the surface
  in along the matching axis. Menus that pass no placement keep their exact previous
  behavior; the root surface merely gained the same entry-origin treatment submenus
  always had.
- `cx-dialog` — the default size now grows with its content up to 640px instead of
  capping at 512px, and the built-in `description` paragraph caps its own line length
  for readability. Dialogs whose body content wants more room (chip rows, forms) get
  wider on their own; remove any consumer workaround that forced `size="large"` or
  patched dialog width to win space. Text-only confirms stay compact.
- `cx-labeled-row-group` — new pattern. Wrap a set of `cx-labeled-row` elements in it
  to share one label column sized to the longest label instead of each row reserving a
  fixed 160px. Rows must be direct children of the group; other direct children span
  the full width, and the group owns the vertical gap between rows. Standalone
  `cx-labeled-row` behavior is unchanged, so existing markup needs no migration.
- `cx-explorer` — new pattern. A content-management rail for one-level collections:
  folders hold items, and rows are created, renamed, restyled (icon and color from the
  shared `CxTagColor` palette), and deleted in place. The rail owns no data — it emits
  intents (`folderCreate`, `itemCreate`, `folderChange`, `itemChange`, `folderDelete`,
  `itemDelete`) for the consumer to persist and echo back through `folders`, and deletes
  are intents only, so the consumer owns confirmation. It is not navigation; `cx-side-nav`
  keeps app destinations. No existing markup is affected.
- `cx-icon` — breaking: the public `name` input is now `icon`, matching the thing the
  control chooses and the icon APIs used by the rest of the framework. Replace
  `name="settings"` with `icon="settings"` and `[name]="value"` with `[icon]="value"`.
  The old input is removed rather than retained as an alias.
- `cx-icon` — the spinner icon now remains still when the user prefers reduced motion.
  No consumer change is required.
- `cx-dropdown` — keyboard typeahead and Home/End now work reliably on virtualized lists
  (more than 80 options). The scroll jump no longer strands keyboard focus on the page
  body, and Enter or Space on the closed-looking field commits a pending single-select
  typeahead choice instead of silently discarding it. No consumer change is required.
- `cx-option` — `focus()` now accepts an optional standard `FocusOptions` argument
  (for example `{ preventScroll: true }`). Existing no-argument calls behave exactly as
  before; no migration is required.
- Fonts — the `elegant` heading voice now resolves to Plus Jakarta Sans;
  `fonts/Raleway.woff2` is replaced by `fonts/PlusJakartaSans.woff2` (variable 200–800).
  Products pointing `--font-family-heading` at `--typeface-elegant` render the new face
  with no markup change. Re-copy the package's `fonts/*.woff2` into the app's public
  assets and delete any stale `Raleway.woff2`.

## 0.8.5

- `cx-tooltip` — a visible tooltip now stays available while the pointer crosses the
  narrow placement gap or rests over the bubble, while both the bubble and its overlay
  hit area remain pointer-inert so the element underneath stays the native pointer target.
  Any pointer press dismisses a pending or visible tooltip before that underlying action
  continues. This completes click-through behavior without losing hover retention; no API
  or markup migration is required.
- `cx-state-message` — horizontal layout now remeasures the icon's ink offset when a
  heading appears or disappears dynamically, so the mark remains aligned with the heading
  cap line without requiring an icon or layout change. No API or markup migration is
  required.

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

- `cx-tooltip` — the rendered bubble stopped receiving pointer events and hovering it no
  longer held the tooltip open. The surrounding overlay hit area could still intercept an
  underlying target at this version, so 0.8.2 did not yet guarantee complete click-through.
  No API migration was required; 0.8.5 completes pass-through and restores hover retention
  through pointer geometry.
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
- `cx-dialog`, `cx-context-dialog`, and `cx-wizard-dialog` — nested overlays now consume Escape from the top down,
  one overlay per keypress, and later-opened layers now paint above their parents regardless of
  template order. A top overlay that cannot dismiss, including a loading wizard, still consumes
  Escape before any lower overlay or page handler. Remove consumer document listeners, guards,
  z-index patches, or propagation workarounds added to coordinate nested dismissal.
- `cx-dialog`, `cx-context-dialog`, and `cx-wizard-dialog` — closing restores the invoking
  control when it remains focusable, or a meaningful target in the surviving parent surface
  when it does not. A wizard step change that removes the focused control moves focus into the
  destination step after it renders without disturbing persistent controls. Remove consumer
  focus timers, step targets, and close handlers added solely to recover focus.
- `CxOverlayStateService.capture` — direct overlay integrations should provide `surface`, plus
  `layerSurfaces` when a backdrop and surface paint as sibling roots, so logical and visual
  order remain aligned. An active capture without `onEscape` intentionally consumes Escape
  without invoking a callback, so that keypress does not reach lower overlays or page handlers.
- `cx-log-step` — `CxLogStep` gained `withLink`, which turns the step text into a link:
  `withLink({ routerLink })` for a destination inside the product, `withLink({ href, target })`
  for one outside it. The text keeps its colour and gains an underline. Use it when the step
  names something that has its own page; leave it unlinked otherwise.

## 0.8.1

- `cx-dialog` — projected `[body]` content now always sits inside the dialog's padded,
  scrollable content region, whether or not `description` is set; the description is a
  conditional paragraph inside that region rather than the condition for creating it.
  Remove padding, margins, or scroll containers added to the projected wrapper to make up
  for the old edge-to-edge, non-scrolling behavior. No other consumer contract changed in
  this release.

## 0.8.0

- `cx-top-bar` — breaking: the flat `heading`, `description`, and
  `editableDescription` inputs were replaced by the discriminated `pageTitle` input. Migrate
  a text title to `{ kind: 'heading', heading, description?, editableDescription? }`, or use
  `{ kind: 'breadcrumbs', items, currentId?, ariaLabel? }` when the trail is the title. The
  breadcrumbs form also emits `breadcrumbSelect` and `breadcrumbOptionSelect`; it renders a
  hidden current-page `h1`, while an empty editable description shows “Add a description”.
- `cx-side-nav` — breaking: `defaultExpanded` was removed from `CxSideNavItem` and
  `CxSideNavGroup`; groups and nested parents always started closed in this version, even
  when they held the active route, and the collapsed parent carried the active treatment.
  Remove `defaultExpanded` and any assumption that route activation opens a branch (0.8.2
  later changed the active branch to start open). Nested items may no longer carry `icon`,
  because a tree guide marks their hierarchy, and every collapsible group must have a label
  that can act as its toggle. Fix either invalid shape before upgrading.
- Collection and model validation — `cx-action-bar`, `cx-detail-panel`, `cx-dynamic-fields`,
  `cx-masthead`, `cx-null-controller`, `cx-process`, `cx-radio-reveal`, `cx-side-nav`,
  `cx-top-bar`, `cx-wizard-dialog`, `cx-tree-view`, `cx-toggle-chip-group`, `cx-breadcrumbs`,
  `cx-tabs`, and `cx-menu` now reject malformed public models instead of silently filtering
  or accepting them. Fix non-array collections, blank or duplicate IDs, duplicate labels
  where the model requires them to be unique, invalid counts, missing option matches, and
  missing or duplicate wizard step templates at the call site. `cx-option` likewise throws
  when `showCheckbox` and `prependIcon` are combined; choose one affordance. Valid models
  need no migration.
- Framework base styles — importing `styles/base` now removes the user-agent margins from
  `h1`–`h6` and `p`, gives body text the semantic body line height, enables smooth anchor
  scrolling except under reduced motion, and clips document-level horizontal overflow.
  Put UI rhythm on layout gaps, keep prose in `.cx-article`, and give genuinely wide content
  its own bounded scroller; remove duplicate app resets that did the same work.
- Typography and articles — `--font-family-heading` became the semantic heading face, with
  `--font-family-fancy` retained as an alias. The public `typeface.ts` API and the
  `editorial`, `friendly`, `elegant`, and `condensed` typeface tokens were added with their
  packaged fonts; `.cx-article` gained the `--cx-article-measure` override. The default face
  remains editorial, so no migration is required unless a product selects or names a
  heading face; use the semantic token rather than a font-family literal.
- Themes and responsive mastheads — `aqua` joined `CX_THEMES` and the theme token set, and
  `cx-masthead` now collapses below the shared 720px mobile breakpoint instead of 500px.
  Accept `aqua` in exhaustive theme handling and remove consumer breakpoint compensation;
  products that neither enumerate themes nor patch the masthead need no migration.
- Truncation and overflow tooltips — framework-owned clipped text and `cx-truncate` now use
  native ellipsis rather than the direction-aware fade. Tooltip overflow measurement ignores
  small block-axis font overshoot but still detects real clipping, and its state marker is
  now `cx-overflow-clipped`. Remove styling or tests tied to `cx-overflow-fade--clipped`; do
  not apply the new marker for presentation because it is an inspection hook only.
- `cx-expansion-panel` — a collapsed body is now `inert`, so its controls are absent from
  pointer, keyboard, and accessibility interaction until expansion. The default heading
  changed from product-specific “Severity” to “Details”. Provide the intended heading where
  that default is not the right label; remove any consumer code that disabled descendants
  solely while the panel was closed.
- `cx-steps` — compact density now gives each hidden step label a no-delay tooltip, and the
  whole step remains passive rather than implying that it can be clicked or edited. No API
  or markup migration is required.
- Tables and split headers — `cx-table-view` gained the `[actions]` /
  `[cxTableViewActions]` projection beside its heading and filter bar, and that combined
  header wraps instead of squeezing controls. `cx-table` and `cx-table-view` accept readonly
  column and row arrays; `cx-split` gained additive `[wrap]` (default `false`); and the final
  table resize handle no longer creates a permanent horizontal scrollbar. Replace local
  table-header or wrapping workarounds with these contracts; otherwise no migration is
  required.
- `cx-dialog` and `cx-context-dialog` — empty heading, description, or action regions are
  omitted and accessible naming follows the meaningful content that remains. A headingless
  `cx-dialog` must have a non-empty description to name it; action-only context dialogs need
  a specific action label rather than only the generic defaults. Remove empty-chrome
  workarounds; no input rename was required.
- Feedback actions — `cx-banner`, `cx-toast`, and `cx-state-message` now render an action
  that has a visible leading or trailing icon even when its text is blank. Supply an
  `ariaLabel` for an icon-only action. Existing text actions need no migration.
- Utilities — the additive escape-hatch layer gained start-aligned measures, semantic surface
  backgrounds, full bleed, semantic font-family and line-height helpers, balanced headings,
  radius helpers, anchor scroll targets, and screen-reader-only text. Prefer a component or
  layout primitive first; these classes require no migration by themselves.
- Package support files — the empty `support/validation/composition.rules.json` and
  `support/validation/placement.rules.json` placeholders were removed. Stop importing or
  inspecting either path; they had no runtime replacement or rules to migrate.
