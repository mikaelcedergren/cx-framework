# Upgrade notes for cx-framework consumers

This file records what changed about **using** the library, version by version, for the
agent working in a consuming product. Read the section for every version between the one
the product currently has and the one it is moving to.

Scope: public component APIs, defaults, required markup, and behaviour a consumer can
observe or must adapt to. Not internals, not visual refinement, not source-side tooling.
`components/guidance.json` remains the authority for how to use a component _now_; this
file only explains what moved and what to do about it.

Entries name the component, state the change, and give the action to take. Every shipped
version has a section, including one that only says nothing changed for consumers: a
forgotten note and a quiet release must not look the same from here. Packaging refuses to
apply a version whose section is missing.

## 0.9.31

- Durable jobs require an explicit `executionScope` when creating a store. Every enqueue,
  child job, claim, transition, recovery, and retention operation belongs to that store's scope.
  Queue idempotency, barriers, and concurrency are per scope. Keep product spending, provider
  limits, and deduplication of real external operations global.
- Append durable-job migration 5 after your product's issued migrations. Keep the first four
  issued migrations byte-stable; do not map the expanding array over old product version numbers.
  Preserve `rebuildReferencedTables: true` when mapping and fingerprinting migrations. The runner
  rebuilds referenced tables in a transaction and checks foreign keys before committing. Recreate
  any product-owned `cx_jobs` triggers in the same atomic product migration batch.
- Migration 5 preserves old jobs in the reserved `legacy` scope, which no worker may open.
  `assignLegacyDurableJobScopes` explicitly assigns terminal history or never-attempted queued
  work, with a synchronous transactional callback to align product request ownership. Attempted
  active work requires a product-specific outcome decision before reassignment; do not replay an
  ambiguous provider operation. Stop every old writer before migrating, prepare compatible web
  and worker artifacts for both environments, and never restart an old unscoped worker afterward.
- `resolveExecutionPolicy` requires trusted startup values for `CX_EXECUTION_SCOPE`, `CX_DATA_MODE`
  (`shared` or `isolated`), and `CX_SCHEDULE_OWNER` (`true` or `false`). Normal dev uses real data
  with scope `development` and schedules disabled; the production owner uses `production`.
  Tests and polish use isolated data; release validation uses isolated scope `validation`.
  Foundry keeps its independent owner-local scope `local`. Static products need no data policy.
  Shared-store startup must verify the existing schema; apply migrations only in a controlled
  storage upgrade. Only the declared owner starts schedules and global retention.

## 0.9.30

- Local verification replaces required GitHub Actions. Remove `.github/workflows/` after adopting
  this package; `cx-platform-check` validates product, toolchain, workspace, and local command
  contracts without requiring hosted workflows. Continue running `pnpm check` and `pnpm e2e`
  locally. This supersedes the workflow requirements in earlier upgrade entries.

- `cx-popover` now overlays its scrollbar without reserving content width. The thumb
  appears on hover, keyboard focus, or scrolling and supports dragging and keyboard
  navigation. Native wheel, touch, and focus scrolling remain available. No consumer
  changes are required.

- `cx-explorer` keeps Rename and inline renaming for folders only. Nested items
  are renamed in their open content heading; their menu retains Icon & color and
  Delete. `itemChange` now reports appearance changes only.

- `cx-explorer` no longer reserves an empty scrollbar gutter. Rows and the folder
  creation button keep equal side spacing when the content fits; native scrolling
  remains available when needed. No consumer changes are required.

- `cx-explorer` keeps its header alignment space and moves folder creation to a full-width
  plus below the folders. It appears while Explorer is hovered or the button has keyboard focus and stays visible on
  devices without hover. `folderCreate` and automatic renaming are unchanged.

- New `cx-launcher` provides a modal search-and-open collection with required item
  types (such as Page, Foundation, and Component), optional icons and keywords, ranked matching, keyboard selection,
  bounded scrolling, and focus restoration. Supply `items`, bind `open` /
  `openChange`, and handle `select`. Products own shortcuts, access, and navigation.
- `cx-text-field` accepts an optional `combobox` connection (`controls`, `expanded`,
  `activeDescendant`) for searchable composite controls. Ordinary fields are unchanged.
- `cx-option` accepts `controlId` and `tabIndex` for composite focus management,
  `size` for row scale, and `descriptionAlign="end"` for descriptions at the far
  edge. Ordinary option defaults are unchanged.

- `cx-explorer` now offers the complete icon library in a grouped popover: two full-width
  rows of rounded square color swatches, then a separate surface for icon search and results. The palette determines the popover width from
  the shared control-size and spacing tokens; filtering keeps that width stable. The top-right Reset action clears the icon and color
  together through `itemChange`, restoring the default appearance. Consumers need no changes;
  use `itemIcons` to restrict the available icons when that is a product requirement.

## 0.9.29

- The hermetic E2E runner permits an availability probe to close before a development
  server binds the same owned loopback port. Other ports and simultaneous listeners
  remain blocked. No consumer configuration changes are needed.
- Reloading a hot-update client closes interrupted proxy tunnels without terminating
  the test runner. The proxy still admits only the exact owned origin.

## 0.9.28

- `cx-tooltip` and `cxTooltip` now open after 500 ms on hover by default. Keyboard focus
  remains immediate. Consumers using the default delay need no changes.
- The hermetic E2E runner supports development servers that wrap their own listener,
  including Angular/Vite. The exact owned loopback port and single-listener limit
  remain enforced. No consumer configuration changes are needed.
- Portable date guidance uses `5 Sep 2026` or `5 Sep 2026 11:34` for human dates.

## 0.9.27

- `cx-tag-field` again accepts pointer clicks on option labels for selection and on
  “Create tag” to open its creation dialog. Keyboard interaction is unchanged. Consumers
  need no API changes.

## 0.9.26

- `cx-card` accepts optional footer content through `[slot=footer]` or `[cxCardFooter]`. The
  footer appears only when content is provided and gives quiet supporting context a consistent
  place below the card body.
- `cx-sidebar-layout` is a new two-region page layout. Project secondary content through the
  `[sidebar]` slot and primary content through the default slot; set `placement` to `start` or
  `end`. It keeps the secondary region sticky with one inward divider on wide layouts, then moves
  it into normal flow above the content with a horizontal divider below the mobile breakpoint.
  Use `--cx-sidebar-layout-width` and `--cx-sidebar-layout-offset` only when the page needs to
  override the 280px width or standard sticky inset.
- `cx-option` accepts optional `tooltip` text for brief explanations on available or disabled
  options. Empty or omitted text keeps the existing behavior. An explicit tooltip takes priority
  over the automatic clipped-text preview, and a disabled option with tooltip text remains
  focusable for explanation while activation stays blocked.
- `cx-option` now gives trailing text and trailing elements different space priority. Supporting
  text truncates before the primary label, while tags, switches, shortcuts, icons, and independent
  actions keep their natural width and make the primary label truncate around them. Consumers do
  not need to choose a layout mode.

- `cx-labeled-row` — project non-empty content with `[infoContent]` to add the fixed
  discreet info button beside the label. It opens on click or keyboard activation and accepts
  formatted or composed content. Existing rows need no migration.

- `cx-dropdown` options accept an optional `group` label. Options sharing a label render under one
  quiet, non-selectable header row; a header appears wherever the label changes while reading the
  list top to bottom, so keep grouped options adjacent and place ungrouped options before the
  first group. Search hides a group's header when none of its options match. Existing consumers
  need no change.
- `cx-card` now uses one `opacity-low` plane with no border by default and owns one consistent
  internal padding treatment. Set `variant="border"` to make the complete card transparent without
  changing its spacing. The `background`, `border`, `shadow`, and `padding` inputs are removed:
  delete those bindings and replace a true `border` binding with the border variant. Cards with
  `href` or `interactive` provide their own hover lift and shadow, while passive cards stay flat.
  Expandable cards fade without painting a backing tile, so bordered cards remain transparent
  while collapsed.
- `cx-card` top-position tabs now use the standard divided treatment automatically. Existing
  `tabs` consumers need no additional binding.
- `cx-card` headings now stay on one line and truncate with an ellipsis when needed. Existing
  headings need no adjustment.
- `cx-card` action menus now rest at low opacity and become fully visible when the card is hovered
  or focused. Existing `menuItems` consumers need no adjustment.
- `cx-kpi` now uses the quiet `opacity-low` fill without a border. Existing consumers need no
  change.

## 0.9.25

- `cx-server-artifact` now accepts the already-published `cx-development-favicon` command in an
  installed framework package. Server products that previously stopped while sealing that package
  should refresh the framework dependency and rebuild; no application change is required.

## 0.9.24

- `cx-expansion-panel` now animates only its disclosure shell and chevron. Projected content no
  longer runs a separate fade during expansion, so controls remain visually anchored while the
  panel opens and closes; consumers need no adjustment.
- `cx-filter-bar` and `cx-table-view` query mode now renders `cx-query-field`. Supply
  `queryFields` and controlled `queryConditions`, apply `queryConditionsChange` to the collection,
  and pass the resulting rows back. Existing `queryValue` consumers remain compatible through one
  default `Search contains` condition; remote value sources can use `queryValueSearch` and
  `queryValueRetry`.
- Filter/query mode changes can now preserve one canonical view instead of keeping stale hidden
  states. Supply `filtersToQueryConditions` for the direct filter-to-query representation and
  `queryToFilterTranslation` for the reverse representation. Lossless query translations switch
  immediately. A translation with issues opens a confirmation dialog that shows the real query,
  highlights the unsupported parts, and applies only the compatible filters after confirmation.
- `cx-table`, `cx-table-view`, and `cx-filter-bar` now default to Comfortable density. The Table
  properties control presents Comfortable before Compact. Set `density="compact"` or
  `displayMode="compact"` explicitly where a deliberately dense table should stay compact.
- `cx-filter-bar` now moves focus into the first usable filter control when an accordion opens,
  matching column-header and active-filter-tag entry. Choice filters should present radio options
  or checkboxes directly inside these surfaces; searchable checklists keep search above their
  independently scrolling option list.
- `cx-menu` items can now declare `trailingActions` for an independent kebab beside the row's
  primary action or choice. Use it for compact row management such as Update view and Delete view;
  do not combine it with the same item's `items` submenu.
- `cx-menu` now resolves prepend-icon alignment within each divider-separated visual group. This
  lets an iconless choice list sit above a distinct icon-led action such as Save view without
  reserving empty icon space in the choices.
- `cx-popover` entry motion now fades without translating the surface. Anchored popovers and nested
  menu actions therefore remain fixed from their first painted frame; consumers need no adjustment.
- `cx-state-message` is now exported from the feedback primitives package area instead of patterns.
  Root-package imports stay unchanged; consumers importing its internal source path must move to
  `primitives/feedback/cx-state-message`.
- `cx-table` and `cx-table-view` replace `emptyText` and `noMatchesText` with structured
  `emptyState` and `noMatchesState` inputs. Use `emptyStateAction` plus
  `emptyStateActionSelect` for an unfiltered empty-state action. Filtered-empty tables use Reset view
  for recovery. Loading now keeps the real header and uses the shared table skeleton.
- `cx-table` now emits `resetTable` when its filtered-empty Reset view recovery is selected, without
  clearing an isolated filter slice first. Restore one owner-defined default state across quick and
  toggle filters, column filters, queries, visible and pinned columns, grouping, sorting, density,
  and pagination. `cx-table-view` relays the same event from both the table and filter bar.
- `cx-table` no longer applies active-row highlighting to folder rows. With
  `rowActivation="active"`, activating a folder clears the item highlight and emits
  `activeRowIdChange` with `undefined` before emitting the folder activation event.
- `cx-table` rows now use Arrow Up and Arrow Down for row-to-row keyboard movement, Space for
  item selection when multiple selection is enabled, and Enter for the row's primary activation.
  Folder rows remain focusable when navigable but never become selected or active-highlighted.
- Popover and menu headings now use small, regular-weight `opacity-high` text directly on the
  floating surface, without a separate background tile. Existing `heading` inputs inherit the
  quieter hierarchy.
- `cx-column-filter-editor`, `cx-table`, `cx-filter-bar`, and `cx-table-view` now accept
  `single-select`, `number-span`, and `range` filter definitions. Multi-select definitions can set
  `presentation: 'dropdown'` for long searchable sets; existing checklist behavior remains the
  default. Values remain controlled and JSON-safe.
- `cx-table` rows can now use additive `person`, `progress`, and `tags` cells. These compose the
  existing avatar, progress bar, and tag components inside table-owned cell layout.
- `cx-table` now auto-fits the column marked `key` instead of assuming the first column owns row
  identity, and respects an explicit fixed or `content` size on that key column. Tables without a
  declared key retain the first-column fallback.
- `cx-table` column-action popovers now place the column label in the shared popover header rather
  than repeating it inside the filter editor. Active filters expose Clear in that header.
- `cx-table` selection checkbox cells now mirror their row's default, zebra, hover, and active
  surfaces while pinned, so selection and row state read as one continuous treatment.
- `cx-table` folder rows are now always excluded from selection. In multiple-selection tables they
  keep the shared selection-column alignment without rendering a checkbox; select all, partial
  selection, selected counts, and bulk selection operate on item rows only.
- `cx-table` person cells now use the standard close-content gap between the avatar and name so the
  two values remain visually distinct at compact table density.
- `cx-table` progress cells now place the compact track and a small percentage on one line. Existing
  progress cells inherit the denser scan pattern automatically; no row-data change is required.
- `cx-table` tags cells now preserve whole tags that fit and replace the hidden remainder with a
  passive `+N` tag. Continue passing the complete ordered tag collection; do not truncate it in the
  consumer.
- `cx-filter-bar` now opens `+N` active-filter overflow as a focused list of only the hidden active
  filters. Each row uses only the filter title and expands the shared filter editor inline; the
  main filter button remains the complete filter browser.
- `cx-filter-bar` filter entries can now set `recommended: true`. The filter browser separates the
  curated subset from the complete catalog with Recommended filters first and selected by default,
  followed by All filters. Search continues to refine the selected view.
- `cx-tag` dismiss actions no longer reserve a trailing lane. Dismissible and non-dismissible tags
  now have the same footprint, and the action overlays the label when revealed. Consumers inherit
  the quieter layout automatically; no markup or input change is required.
- `cx-tag-field` now renders each selected value directly through dismissible `cx-tag`. The field no
  longer reserves a private remove lane or recreates tag dismissal; empty-query Backspace removes
  the last value, and standard keyboard navigation reaches each tag's dismiss action.

## 0.9.23

- `cx-top-bar` descriptions now use the small body typography role and its matching line height.
  Consumers using the component inherit the quieter supporting-text hierarchy automatically; no
  markup or input change is required.

## 0.9.22

- Development favicons — added the dependency-free `cx-development-favicon` command. Public
  websites can now generate one fixed amber, notched development favicon plus an identical Safari
  mask and a development-only index derived from the production index. Add
  `cx-development-favicon.json`, generate the files with `--apply`, select the derived index only in
  the local Angular configuration, and run the read-only command from the canonical `check` gate.
- `cx-text-area` fill layout — `layout="fill"` now claims the remaining space in a bounded
  vertical flex layout, ignores line-based sizing and user resizing, and keeps long text scrollable
  inside the field. The parent still owns the bounded height and vertical composition.
- `cx-explorer` persistent selections — added the additive `rootItems` input (default `[]`).
  Use it for stable, browse-only collection destinations that must remain above the folder
  hierarchy, such as an inbox or pending list. Root and nested item ids must be unique across the explorer.
- `cx-explorer` search — added the opt-in `searchable`, `searchValue`, and `searchAriaLabel`
  inputs plus `searchValueChange`. Enable it instead of projecting a locally assembled search
  field; apply the emitted query to the consumer-owned view and echo it back through `searchValue`.
- `cx-explorer` folder creation — a default-size, standard plus icon button now sits at the top right.
  After `folderCreate`, echo exactly one new folder through `folders`; that row immediately enters
  rename mode so the user can name it and press Enter.
- `cx-explorer` folder disclosure and order — folders now start closed. Pass a stable
  `persistenceKey` to remember the one last-opened folder in browser-local storage. Editable folder
  rows can be dragged directly without a visible handle; persist `folderOrderChange` and echo the
  ordered folders back through `folders`.
- `cx-explorer` width — the rail is resizable from its end edge by default. Use `width`, `minWidth`,
  and `resizable` to constrain the behavior, and bind `widthChange` when the chosen size should
  survive recreation. Double-click resets to the supplied width or the 260px default. The resize
  indicator now sits directly on the rail boundary without adding extra inline content spacing.
- `cx-explorer` row labels — clipped root, folder, and nested item labels now truncate quietly;
  Explorer no longer opens overflow tooltips for them.
- Navigation rail rhythm — `cx-side-nav` and `cx-explorer` now use an exact 32px header followed by
  16px of space; Explorer search uses the same 16px space below it. Remove vertical padding from
  projected header content so its contents stay centered within the shared row.
- `cx-side-nav` active state — active rows no longer carry a resting background. Their stronger
  label and primary icon mood now communicate location without adding another filled surface.
  No consumer markup or styling change is required.
- `cx-detail-panel` motion — opening and closing now use translation only. The panel remains fully
  opaque throughout both slides.
- Dark theme surfaces — `--surface-alt` is slightly darker, giving recessed and grouped regions
  clearer separation from `--surface`. Consumers using the semantic token update automatically.
- Portable AI rule precedence — clarified that explicit product-owner decisions override applicable
  defaults only in the context they address, while every unaffected design rule remains in force.
- Ordinary production favicons, styles, and Node runtime behavior are unchanged in this
  version.

## 0.9.21

- Heading typefaces — the additive `slab` option resolves to Zilla Slab with real normal weights
  from 300 through 700. Select it with `--typeface-slab` or the public `CxTypeface` value `slab`.
  The existing `friendly` option now resolves to variable Raleway 100–900 instead of Rubik; products
  already selecting `friendly` change appearance without source changes. Re-copy the package's
  `fonts/*.woff2` assets and remove the retired `Rubik.woff2` file.
- Other Angular components, tokens, icons, styles, portable AI guidance, and Node runtime behavior
  are unchanged in this version.

## 0.9.20

- Mastheads — `[sticky]="true"` now pins the `cx-masthead` host, so it remains at the top of its
  scroll container instead of being constrained by its own one-row host. Remove positioning
  wrappers or CSS overrides added for the old behavior. The additive `variant="frosted"` surface
  uses theme-aware translucency and backdrop blur with an opaque fallback; the default remains
  unchanged, including for the collapsed mobile panel.
- Other Angular components, tokens, icons, styles, portable AI guidance, and Node runtime behavior
  are unchanged in this version.

## 0.9.19

- Operational roots — new shared `resolveOperationalRoot()` server primitive. Dynamic Node
  products must replace local `CX_RUNTIME_ROOT`/working-directory resolvers with this function so
  environment files, databases, browser releases, and logs share one canonical real directory.
- Single-page browser serving — new `createSinglePageApplicationMiddlewareStack()` server
  composition. Products with an API plus an SPA fallback must mount this ordered stack instead of
  hand-composing static files, retained assets, missing-asset handling, and `index.html`. The
  shared fallback forwards synchronous file errors to the product's error middleware.
- Other Angular components, tokens, icons, styles, and visual defaults are unchanged in this
  version.

## 0.9.18

- Current architecture wording — documentation-only: the SQLite ledger and durable-job contracts
  now describe their ongoing ownership directly, without completed-adoption terminology. No
  consumer source change is required.

## 0.9.17

- SQLite migration ledgers — breaking cleanup: removed the unused one-time
  `adoptSqliteMigrationLedger` API and its adoption types. Every current product already owns a
  canonical framework ledger. Keep applying immutable append-only definitions through
  `applySqliteMigrations()` or `applySqliteMigrationsAtomically()`; do not recreate an adoption or
  compatibility path.

## 0.9.16

- Browser serving — breaking and required: `resolveBrowserDirectory()` and
  `createBrowserServing()` now take `defaultBrowserDir` instead of the retired
  `legacyBrowserDir` name, and the corresponding selection mode is `default` instead of `legacy`.
  Rename the option and any explicit mode checks; there is deliberately no compatibility alias.

## 0.9.15

- Cleaner working method — completed migrations and replacements now require forward-only closure:
  remove proven superseded implementations, compatibility surfaces, one-time operators, stale
  instructions, jobs, generated artifacts, and rollback targets, while retaining authoritative
  data, required schema history, current-architecture backups, and current recovery safeguards.
  Cleaner also performs a fresh purpose-and-ownership anti-drift audit after its planned work.
  Refresh the package so repository agents receive the current portable skill.

## 0.9.14

- `cx-explorer` browse mode — added the `editable` input (default `true`). Set it to `false`
  when the explorer is a read-only category browser; built-in create, rename, style, and delete
  controls disappear while selection, collapse, and consumer-supplied menus remain available.

## 0.9.13

- `cx-dropdown` typeahead — corrected: while a multi-character query is being extended, the
  currently focused matching option remains active instead of cycling to a longer sibling that
  shares the same prefix. Rebuild browser consumers; no markup or input change is required.
- Web-platform checks — required toolchain declaration: the root must declare exact `pnpm`
  `11.23.0` in `devDependencies`, matching the integrity-qualified `packageManager` locator. This
  gives sealed server-artifact builds a repository-contained pnpm CLI. Add the dependency, refresh
  the lockfile, and run the canonical check.
- Other Angular components, tokens, icons, styles, and server-runtime behavior are unchanged.

## 0.9.12

- Owned SQLite startup — corrected without an API change: the configured busy timeout now applies
  to the native database connection before an established database runs its read-only pre-write
  verification. This prevents legitimate lock contention from bypassing the product's declared
  wait policy during startup. Refresh the framework package and rebuild the server artifact;
  product source and migration definitions require no change.
- Angular components, tokens, icons, styles, and visual defaults are unchanged in this version.

## 0.9.11

- Server artifacts — deploy hardening with one required local-validation change: refresh the
  framework package.
  Products already using a Git or published framework dependency need no source or release-command
  change. Shared-lock deployment now consumes the existing store without writing side-effects,
  trusts only pnpm's generated deploy lock projection,
  makes dependency lifecycle execution fail closed by disabling pnpm's internal shell emulator and
  using a builder-owned absent external script shell, and rejects byte changes to every canonical
  package, workspace, lock, and product manifest input.
  Every dependency deploy freezes the store. Framework overrides now fail before any package
  command because pnpm 11.23.0 cannot materialize a physical tarball's rewritten path identity
  without opening the whole dependency graph for writes. Remove any temporary override, use the
  framework's Git or published package identity directly, and refresh the frozen lockfile. The
  existing framework-package containment and offline build boundaries remain unchanged.

## 0.9.10

- Server artifacts — breaking and required: keep using the same release-artifact command and add
  exact `pnpm: 11.23.0` to the product root's development dependencies. `cx-server-artifact`
  validates and runs that contained local CLI directly, so an isolated release build never depends
  on a Corepack home-directory cache. The existing framework-package containment and offline build
  boundaries remain unchanged.

## 0.9.9

- E2E network isolation — corrected without an API change: the inherited network guard now
  recognizes Node 26/Undici's own `path: undefined` connection option as the absence of a Unix
  socket while continuing to reject every non-nullish socket path and every destination outside
  the exact runner-owned origin. Consumers require no source change; refresh the package and run
  the canonical hermetic E2E suite through `scripts/run-e2e.mjs`.

## 0.9.8

- Production worker readiness — strengthened without an API change: a retained
  `acquireServerWorkerReadinessLease()` now keeps an otherwise-idle listener-free production worker
  on the event loop without a timer or network listener, while continuing to pin the exact release
  identity descriptor. Existing workers already retaining and closing the lease require no source
  change; refresh the package and rebuild the server artifact. Development and isolated release
  validation behavior is unchanged.

## 0.9.7

- Site gate presentation — validation tightened: `createSiteGatePresentation()` now parses the
  complete shell as a bounded, strictly nested passive HTML document before accepting it. Custom
  shells must keep the one form slot inside ordinary visible flow containers, use quoted
  attributes and unique non-framework IDs, and avoid inert/hidden/popover ancestry, browser
  reparsing contexts, comments, active attributes, and character-reference URL or ID aliases.
  Conforming default and branded gate presentations require no source change; rendered form markup,
  headers, and authentication behavior are unchanged.
- Site gate verification — additive: Node operations tooling may consume the frozen
  `SITE_GATE_CONTENT_SECURITY_POLICIES` and `SITE_GATE_SECURITY_HEADERS` exports from
  `server/gate` instead of duplicating the framework's exact default/presented content-security and
  shared security/noindex response-header values. Product runtimes require no change;
  `createSiteGate()` now uses these same exported values as their single source.

## 0.9.6

- SQLite exclusive first allocation — additive: a product-owned first-selection initializer that
  must create a wholly absent database family may pass `requireAbsent: true` to
  `openOwnedSqliteDatabase()`. The framework proves the main, rollback-journal, WAL, and
  shared-memory paths absent, then allocates each exclusively; a path that appears during that
  allocation is rejected rather than adopted. Existing web and worker runtimes require no change:
  keep `requireExisting: true` for an established authority, and do not use `requireAbsent` for
  ordinary multi-role startup or disposable release validation.

## 0.9.5

- Typography authority — breaking: the obsolete `--font-family-fancy` compatibility alias is
  removed. Use `--font-family-heading`; all current framework consumers already use that semantic
  token, so only an older external consumer requires a text-only migration.
- Static-site startup — breaking and required: pass `entrypointUrl: import.meta.url` to
  `createStaticSiteApplication()` or `createStaticSiteServer()`. Ordinary production and
  `CX_RELEASE_VALIDATION=1` now require the exact selected server release identity and prove that
  the executing module is its declared web entrypoint before browser resources, Express
  construction, or listener startup. Ordinary production also requires a complete validated
  browser snapshot; release validation remains browserless. Do not substitute a working-directory
  path or a parsed identity object.
- Runtime modes — tightened: all shared web and worker startup policy now treats an absent
  `NODE_ENV` as `development` and otherwise accepts only exact `development`, `test`, or
  `production`. Empty, padded, case-changed, and invented values fail before private-file,
  production, release-validation, browser, or worker-readiness branches. Use exact
  `NODE_ENV=production` with exact `CX_RELEASE_VALIDATION=1`; remove product-local NODE_ENV
  normalizers and consume `nodeEnvironmentValue()` from `server/configuration`.
- Private role environment authority — breaking and required: pass the exact mode returned by
  `privateEnvironmentFileStartupMode()` to `loadPrivateEnvironmentFile()`. Ordinary production now
  requires the role-owned mode-0600 file and makes its complete allowlist authoritative: ambient
  allowed keys are replaced, and an ambient key omitted by the file is removed. A production
  `*_LOAD_ENV_FILE=false` bypass and malformed bypass values fail closed. Development retains the
  optional ambient-precedence workflow, exact test startup skips file I/O, and
  `CX_RELEASE_VALIDATION=1` must remove both owned and foreign private keys without reading a file.
- SQLite owning-open boundary — breaking and required for every long-lived file-backed product
  runtime authority:
  replace product-local directory creation, `DatabaseSync` opening, SQLite configuration, and
  filesystem ownership checks with `openOwnedSqliteDatabase()` from `server/sqlite`. Pass the
  explicit canonical operational root, the normalized absolute database path contained by that
  root, and WAL configuration; use the returned database and aggregate-safe close handle for the
  connection lifetime. Web and worker roles that share one database pass the same operational
  root and may open it concurrently. A caller that must verify a sealed pre-existing authority
  before any write sets `requireExisting: true` and supplies the synchronous read-only
  `beforeWrite` callback; the callback runs on the exact connection that later remains writable.
  SQLite `query_only` plus a native fail-closed authorizer enforce that read phase, and its scoped
  query surface expires immediately when the callback returns or throws. Do not retain the callback
  database or its methods for later use.
  Keep product schemas, migrations, capacity settings, and data policy in the product. A bounded
  one-shot cutover tool may retain a specialized read-only or staged rollback-journal connection
  only when its atomic publication proof cannot use the long-lived WAL lifecycle; document and test
  that migration-only exception, keep it unreachable from ordinary web or worker startup, and close
  it before activation. A deliberate `:memory:` test or schema fixture may continue to use an
  in-memory driver. No long-lived file-backed runtime path may bypass this boundary.
- E2E isolation — required: every browser product now launches Playwright through the canonical
  `node scripts/run-e2e.mjs` entrypoint and the Node-only
  `@mikaelcedergren/cx-framework/platform/e2e-runner` contract. Configure a repository-owned
  controller and let the runner select both dynamic listener ports; do not launch Playwright directly, allocate runtime
  roots from its config, inherit the operator shell, or use a host-wide loopback allowance. The
  runner owns exact-environment Playwright/controller process groups, an exact-origin allow-proxy,
  fixed `/healthz` readiness, bounded teardown, port-closure proof, and private runtime-root
  cleanup. Product configuration is synchronous, build subprocesses pin package-manager config to
  `/dev/null`, and fixed product E2E ports are rejected. Automatically selected app and proxy listeners stay within the
  lightweight `platform/e2e-contract` entrypoint's inclusive `49152..65535` E2E range, which the
  operating-layer port registry keeps free of active and prepared services. Configure Playwright
  through `createHermeticPlaywrightUse()`, declare the exact `testDirectory` in the product runner,
  and use the shared manual browser/API-context helpers when a fixture cannot provide the context.
  The runner pins the browser launch and context proxy, disables QUIC and non-proxied WebRTC UDP,
  blocks service workers, and rejects source-level network-control overrides before launch.
  Browser transport is forced through the exact-origin proxy, and Node test-process fetch, TCP,
  TLS, DNS, Unix-socket, and datagram transport fail closed outside the exact owned HTTP origin.
  The proxy accepts HTTP `CONNECT` only to that same owned authority for managed Playwright API
  requests. Dependency-created Angular build workers retain the guard while admitting only
  Angular's packaged render hook, the localhost host fence, source maps, and a Node compile-cache
  directory contained inside the private per-run runtime root; arbitrary worker environment and
  Node flag overrides remain blocked.
  This is a trusted-repository-source harness, not an operating-system sandbox: a deliberately
  malicious same-user process or a native non-Node subprocess can bypass JavaScript guards. The
  prelaunch source audit therefore rejects test-owned process/worker creation, while the thin
  repository controller remains reviewed trusted source. The root package that owns
  `scripts/run-e2e.mjs` must declare cx-framework directly, even when browser and server child
  workspaces already declare it; the runner supplies nested package scripts with a private
  per-run `pnpm` launcher bound to the integrity-pinned CLI rather than an ambient `PATH` command.
- pnpm workspace execution — breaking and required: set the exact root
  `pnpm-workspace.yaml` values `enableGlobalVirtualStore: false` and
  `verifyDepsBeforeRun: error`. The first keeps each product's dependency projection
  repository-owned; the second stops a stale or missing install before any package script instead
  of letting pnpm install implicitly. CI must assert both effective values before dependency
  installation. The hermetic E2E runner also pins the exact lowercase
  `pnpm_config_verify_deps_before_run=error` value in framework-owned child environments; remove
  product-owned pnpm/npm configuration from E2E subprocess environments, apart from the two exact
  `/dev/null` `NPM_CONFIG_*CONFIG` fences used by a reviewed nested build.
- Server artifacts — defense in depth: `cx-server-artifact` now accepts only the declared
  installed cx-framework package surface beneath direct and pnpm virtual-store dependency trees.
  It rejects raw framework source, build controls, unapproved scripts, lookalike package paths,
  and escaping or ambiguously targeted direct-package links even if a future package transport
  were to expose them. Products keep using the same release-artifact command; no source migration
  is required.
- Platform package boundary — no change for conforming consumers: the broad `platform/*` export is
  removed. Public platform resources are now exactly `README.md`, `cx-product.schema.json`, and
  `web-standard.json`, alongside the named `platform/e2e-contract` and `platform/e2e-runner`
  entrypoints. This prevents encoded or query-suffixed package paths from exposing runner internals;
  consumers already using the named entrypoints require no change.
- Component authority — additive: packed installs now expose the generated, self-contained
  `support/components/authority.json` resource through
  `@mikaelcedergren/cx-framework/support/components/authority.json`. Tooling that needs exact
  selector, public input/output, projection-slot, default/transform, or source-evidence facts should
  consume this path-free, schema-bounded catalog instead of reaching into raw component source;
  those raw source trees remain excluded from installs. No component-template migration is
  required.
- Angular component runtime APIs, icons, styles, and visual defaults are otherwise unchanged in
  this version.

## 0.9.4

- Continuous integration — required: add or align `.github/workflows/ci.yml` with the canonical
  action identities in `platform/web-standard.json`. Reference every external GitHub Action by an
  immutable 40-character commit, use the exact standard-owned `actions/checkout` and
  `actions/setup-node` revisions, and set `persist-credentials: false` on every checkout step.
  `cx-platform-check` now rejects missing workflows, mutable external action refs, non-canonical
  checkout/setup-node revisions, and persisted checkout credentials.
- Angular components, tokens, icons, styles, server-runtime entrypoints, and visual defaults are
  unchanged in this version.

## 0.9.3

- Private role environment files — additive: replace product-local dotenv filesystem loaders with
  `loadPrivateEnvironmentFile()` from `server/private-environment`. Pass one absolute role-owned
  filename, that role's non-empty allowed-key set, and its startup environment. Only an initial
  `ENOENT` is optional; every other unsafe file condition fails closed. The shared primitive
  requires an owner-owned single-link mode-0600 regular non-symlink file, performs a bounded
  race-checked fatal-UTF-8 read, rejects NUL, `NODE_OPTIONS`, and unsupported keys before merging,
  and preserves ambient-value precedence. Keep role filename selection, cross-role ambient-secret
  removal, and product configuration outside the framework helper.
- Production worker readiness — additive: after an ordinary production worker has completed inert
  composition and bound shutdown signals, but before it starts recovery, maintenance, scheduling,
  claiming, or provider work, call `acquireServerWorkerReadinessLease()` with the exact release
  identity object returned by startup loading and the worker's declared key. Retain the returned lease for
  the worker lifetime and close it before runtime teardown. The lease reopens and verifies the
  configured immutable identity file, then keeps its descriptor open so shared operations can
  prove the listener-free process still runs the current release. Development acquires no lease;
  isolated `CX_RELEASE_VALIDATION=1` startup remains IPC-only. A parsed copy or identity loaded from
  another file is deliberately rejected.
- Angular components, tokens, icons, styles, and visual defaults are unchanged in this version.

## 0.9.2

- Site gate presentation — additive: use `createSiteGatePresentation()` with exactly one
  `SITE_GATE_FORM_SLOT` when a product needs a branded login shell. Pass the returned frozen value
  to `createSiteGate`; do not render from the request or fork the authentication flow. The
  framework inserts and escapes the only password form, pre-renders initial/error states, and keeps
  ownership of methods, cookies, rate limits, redirects, no-store/noindex, and CSP. Unlocked
  protected documents now remain `no-store`; shared static delivery preserves that stronger policy
  while cacheable assets retain their normal cache contract. Templates are
  bounded passive HTML: scripts, inline styles/handlers, embedded content, extra form controls,
  raw-text/RCDATA/table parsing contexts, malformed slot/document structure, external asset URLs,
  and URL character references fail at startup. List every exact same-origin
  stylesheet/image/font path needed while locked in `publicPaths`; presentation assets never
  become public implicitly.
- Server HTTP typing — fixed: framework middleware now remains directly assignable to Express 5
  under `exactOptionalPropertyTypes`; products should compose the published middleware without
  casts or local adapter wrappers.
- Worker validation lifecycle — fixed: `signalServerWorkerReadiness()` now references its validation
  IPC channel before publishing readiness, so a worker with no validation-time scheduler or other
  active handle cannot race from a valid receipt into natural process teardown before the
  validator's `SIGTERM`. Install graceful signal handlers before calling the helper and exit or
  disconnect cleanly from that handler. Ordinary development/production workers remain unchanged,
  and a failed IPC send releases the lifecycle reference before rejecting.
- Server testing — additive: clean-checkout tests that exercise browser-release switching may use
  `activateSyntheticBrowserReleaseFixture()` from `server/testing`. It creates one immutable,
  reader-valid release inside a caller-owned disposable repository and activates it without an
  operational `server-ops` checkout. Supply only safe relative fixture files and a new release ID
  for each switch; the helper refuses release reuse, unsafe filesystem layouts, traversal, and
  framework-owned metadata files. It is a test fixture, not a production publisher.
- Durable jobs — append-only replacement guard: append
  `durable_job_replacement_guard` after the three previously issued durable-job schema entries.
  It rejects insert and update conflicts on the job ID, type/idempotency pair, non-null lease
  token, and SQLite row ID before `OR REPLACE` can delete queued, running, or terminal history.
  It deliberately does not depend on recursive triggers. SQLite row IDs become framework-owned:
  retained rows must have positive row IDs, new inserts must leave numeric allocation to SQLite,
  and no `rowid`, `_rowid_`, or `oid` alias may change after enqueue. During upgrade it validates
  that rule and all retained recovery reserves against their job class and status without updating
  job rows or activating product update triggers; any pre-existing inconsistency aborts without
  repair or deletion.
- Angular components, tokens, icons, styles, and visual defaults are unchanged in this version.

## 0.9.1

- Runtime product manifest — additive: web and worker startup should load the sealed absolute
  `cx-product.json` through `server/product-manifest`. The strict bounded loader rejects duplicate
  or unknown fields, invalid UTF-8, symlinks, and incompatible profile/capability combinations,
  then returns one deeply frozen typed snapshot. Delete product-local manifest parsers; keep the
  immutable artifact path separate from mutable operational data paths.
- Server process roles and worker readiness — additive: versioned web and worker entrypoints should
  use `server/process-role` to prove the executing module matches the exact role declared by the
  sealed release identity. Declared workers should use `server/worker-readiness` to emit the exact
  identity-bound IPC readiness receipt after real initialization when
  `CX_RELEASE_VALIDATION=1`. Normal development and production startup do not require an IPC parent
  or a mutable environment role label.
- Durable jobs — additive transaction surface: use the new synchronous
  `store.withTransaction()` callback when a product write and its required durable enqueue must
  commit or roll back together. Perform product writes through the same injected database adapter
  and enqueue only through the callback-scoped transaction surface; asynchronous callbacks are
  rejected.
- Durable jobs — additive job-local delay: return the `delay` disposition when a leased job is
  waiting on its own prerequisite and unrelated work may continue. The store restores the consumed
  attempt, persists the retry time and safe reason, and returns the job to ordinary queued state.
  Continue to use `defer` only for queue-wide resource barriers where later work must not overtake
  the blocked job.
- Durable jobs — append-only schema history and bounded barrier recovery: replace use of the former
  current-schema statement list with `DURABLE_JOB_SCHEMA_MIGRATIONS`. Keep the initial entry in the
  product migration where it was first adopted, then add each later framework entry as a new
  product-owned migration without changing any applied name, version, or statements.
  The current suffix seals the enqueued job ID, type, payload, idempotency key, execution class,
  attempt ceiling, original schedule, and creation time against direct SQL mutation, and prevents
  deletion of active obligations while continuing to allow bounded terminal pruning. Apply this
  suffix before using the current job store; do not recreate its triggers locally.
  `executionClass: 'barrier-recovery'` is an explicit exception for an obligation that can release
  a waiting queue-wide capacity barrier; enqueue it only in the same transaction that materializes
  bounded product state and product-owned recovery reserves. The framework reserve is rearmed on
  every nonterminal transition and cleared on terminal transition. All ordinary jobs remain
  `standard` and cannot pass a barrier.
- SQLite verified cutovers — additive: use `applySqliteMigrationsAtomically()` when a pending
  migration suffix transfers ownership of copied product data. Its required `captureState`
  callback records caller-owned evidence under one `BEGIN IMMEDIATE` lock before the first pending
  statement, and `verifyFinalState` may complete the caller-owned copy and sealing writes before it
  proves the complete result. A failed or asynchronous proof rolls back those writes, the entire
  pending suffix, and its ledger rows. Keep `captureState` read-only; keep both callbacks
  synchronous and deterministic so every process proves the same cutover before startup.
- HTTP rate limiting — additive: `server/rate-limit` now includes framework-owned Express-compatible
  middleware on top of the bounded limiter. Products should supply the request-key policy and use
  the shared JSON error contract instead of adding a separate rate-limit package.
- Dynamic health readiness — additive: products with an essential local dependency may pass a
  synchronous, side-effect-free readiness probe as the third argument to `healthMiddleware`.
  Exactly `true` preserves the standard successful payload; `false` or a thrown probe error returns
  the fixed no-store `503 { ok: false }` response. Keep remote, paid, asynchronous, and mutating
  work out of this probe.
- External provider responses — additive: use `server/bounded-response` to stream every untrusted
  Fetch body through an explicit byte ceiling before text or JSON decoding. Pass the active effect
  abort signal, then validate bounded domain fields and record counts in the product before writing
  them. Overflow, abort, invalid Content-Length, malformed UTF-8, malformed JSON, and stream errors
  fail with stable `BoundedResponseError` codes and cancel the upstream body.
- Angular components, tokens, icons, styles, and visual defaults are unchanged in this version.

## 0.9.0

- Package delivery — breaking install-contract change: the generated GitHub package now commits
  verified `dist/lib` and `dist/server` output and runs no install, postinstall, pack, or prepare
  lifecycle build. Under pnpm 11, remove the legacy `package.json#pnpm` build configuration, move
  the real dependency build permissions into the root `pnpm-workspace.yaml` `allowBuilds` map, and
  keep every exact, versioned, Git/tarball, and glob form of `@mikaelcedergren/cx-framework` absent
  from that map. Keep `strictDepBuilds`, `strictStorePkgContentCheck`, and `verifyStoreIntegrity`
  true; never enable `dangerouslyAllowAllBuilds`. Refresh the GitHub dependency lock and keep
  lifecycle scripts disabled in clean-install verification. Generated-package CI proves the
  checked-in output is usable before build, byte-identical after a fresh rebuild, and tracked
  without Git drift. The
  generated repository retains raw source for that CI proof, while packed and Git dependency
  installs now contain only immutable output, public resources, and runtime commands; do not import
  or inspect framework TypeScript through `node_modules`.
- Browser runtime ownership — breaking dependency-contract change: every Angular browser workspace
  must declare the complete cx-framework peer set directly in production dependencies: Angular
  CDK, Angular common/core/router, `ag-charts-community`, `marked`, all published `prosemirror-*`
  peers, RxJS, and `tslib`. The package keeps these peers optional at install time so a Node-only
  workspace declares none of them and receives no UI dependency closure. Do not reduce the browser
  list based on current component use: the single public Angular entrypoint re-exports the complete
  surface, and `cx-platform-check` enforces compatible majors. `cx-qr-code` uses its built-in
  encoder, so `qrcode` is not a framework peer; retain it only where product code imports it.
- Node web runtime — additive: the package now publishes strict Node 26 ESM entrypoints under
  `@mikaelcedergren/cx-framework/server/*` for configuration, health, security and caching,
  request IDs, safe JSON errors, cookies, origins, bounded rate limiting, full pre-launch gate,
  gate policy, graceful shutdown, cryptographic signing, opaque sessions, SQLite migrations,
  durable jobs, atomic
  browser-release reads, static files, static sites, and isolated server probes. These subpaths
  deliberately do not resolve through CommonJS or browser-oriented TypeScript resolution. Server
  code should import the smallest owning subpath, compile with NodeNext plus Node 26 types, and
  keep product routes, identity policy, data schemas, secrets, and external effects local.
  The complete browser peer set described above is optional at package-install time, so Node-only
  operational consumers install none of it; Angular products must still declare the full set
  directly, as the product contract requires.
- HTTP listener — additive: dynamic Express 5 entrypoints should await
  `listenHttpApplication()` from `server/listen` before announcing readiness or starting work that
  assumes the process is reachable. The promise rejects both a synchronous listen failure and an
  asynchronous bind error delivered through Express's callback. Close any product-owned resources
  opened before the await when it rejects.
- Private API caching — additive: mount `noStoreHeader()` from `server/security` before a sensitive
  API router so its success and error responses carry `private, no-store`. Do not apply static asset
  caching policy to dynamic user or product data. The site gate preserves an upstream header that
  already contains `no-store`, including `private, no-store` on a locked API response.
- Durable jobs — breaking configuration and additive runtime change: every
  `createDurableJobStore` call must now set the database-wide `maxConcurrentJobs`. Use `1` when
  strict queue order or an attempt-neutral resource-capacity barrier is required, and configure the
  same value in every claim-capable store sharing `cx_jobs`. The new `blocked` status and `defer`
  disposition persist that barrier across restart without charging an attempt; later claims remain
  stopped until the blocked job succeeds or terminally fails. Retryable failures and expired leases
  preserve the barrier while charging the real failed attempt; repeated explicit deferrals remain
  attempt-neutral. `createDurableWorker` now schedules lease heartbeats automatically, aborts the
  active handler when ownership is lost, and propagates that loss without letting a stale attempt
  complete or fail the current claim. Products still own deterministic schedule keys and
  idempotency for email, payment, or other external effects.
- Static-site server — new shared entrypoint: `server/static-site` reads and validates an explicitly
  selected `cx-product.json`, requires the `static-site` capability profile, binds locally, injects
  the consumer's existing Express/compression implementations, serves one immutable browser-release
  snapshot per request, retains safe hash-addressed assets, owns standard health/security/cache/
  404 behavior, and installs removable graceful-shutdown signal bindings. Static consumers should
  replace sibling `server-ops/lib/site-server.mjs` imports with this published entrypoint after
  upgrading. Pass a required absolute `manifestFile` derived from the compiled entrypoint's
  `import.meta.url` (`server/dist/index.js` uses `../../cx-product.json`) so it selects the manifest
  sealed in the server artifact; keep `repoRoot: process.cwd()` separate for operational browser
  releases. There is no working-directory compatibility fallback.
- Server release identity — additive: `server/server-identity` strictly validates and pins one
  versioned server artifact at process startup. Configure its absolute metadata path once through
  `CX_SERVER_RELEASE_IDENTITY_FILE` (or the explicit static-site option); the static-site server
  then exposes the pinned identity as no-store JSON at `/cx-server.json`. A changed deployment
  pointer does not make an old process claim to be the new release: the endpoint changes only
  after the replacement process starts from and validates the selected artifact.
- Product contract — additive: `platform/cx-product.schema.json` and the dependency-free
  `cx-platform-check` command define the shared Node 26, integrity-qualified pnpm 11.23.0, Angular
  22, TypeScript 6.0.3, Playwright 1.60, canonical-command, and capability/profile contract. The
  complete Corepack identity must match exactly. Move non-auth pnpm settings from `.npmrc` and all
  `package.json#pnpm` settings into `pnpm-workspace.yaml`; replace the removed dependency-build
  settings with one explicit `allowBuilds` map. Keep `strictDepBuilds`,
  `strictStorePkgContentCheck`, and `verifyStoreIntegrity` true, and never enable
  `dangerouslyAllowAllBuilds`. Every web repo should keep its product choices in `cx-product.json`
  and run `cx-platform-check` through its canonical `check` command.
- Angular components, tokens, icons, styles, and visual defaults are unchanged in this version.

## 0.8.7

- `cx-mural` — new pattern: a decorative image pane that fills the container the consumer
  sizes and lets the user swap the picture in place. `images` (`CxMuralImage[]`) offers the
  browsable catalog; `value` is the picture on display — a whole `CxMuralImage | null`,
  painted from its own `src`, so it need not be present in `images`; null keeps a quiet
  empty frame. Hovering reveals a transparent settings control (held visible on touch and
  while no picture resolves) that swaps the pane into an in-place picker: it browses the
  catalog while its search field is empty, and typing streams the debounced query out
  through `search` (`''` included on clear) for the consumer to answer with `results`
  (`CxMuralImage[]`), `searchLoading`, and `searchError` — the component never fetches
  anything itself, and a consumer with no remote source should supply a standing
  `searchError` saying search is unavailable there. Apply commits the picked image through
  `valueChange` only when the choice changed; Cancel or Escape leaves it untouched, so wire
  `valueChange` straight to persistence. `CxMuralImage` carries optional `thumb` (picker
  preview) and `attribution` (`CxMuralAttribution`: `name`, `href`, `source`, `sourceHref`),
  rendered as a quiet credit on the pane with the settings control's reveal. A displayed
  picture that fails to load returns the pane to the empty frame and emits `imageError`, so
  the consumer can swap in a locally resolvable fallback. The pane contributes no intrinsic
  size (`contain: size`) and renders its picture decorative (empty alt): the container owns
  width, height, and placement outright — size it explicitly, and a tall picker scrolls
  inside the pane rather than inflating an auto-sized row.

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
`'bottom' | 'left'`, default `auto`) chooses which side of the anchor a menu surface
opens on; explicit sides are honored and viewport-clamped, with `left`/`right`falling
back to the opposite side only when the requested one has no room. A context
presentation may now carry an`owner`element: tooltips on it stand down while the
menu is open, focus returns to it on close, and a side placement hugs its rect.`cx-popover`accepts`left`/`right`in its`placement` input and animates the surface
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

## 0.9.32 — verified SQLite journal transitions

Owned SQLite opening rechecks integrity after a journal-mode change. A restored rollback-journal
database can therefore be verified before writes, enter WAL mode, and complete its offline
checkpoint without retaining the earlier integrity check's pager lock. Existing schemas and
execution-scope APIs are unchanged. Explicit offline operators use `verifyOwnedSqliteSnapshot` for
a private, descriptor-pinned, immutable read with no sidecars and an expiring read-only callback.

## 0.9.33 — read-only schema metadata

Owned SQLite verification permits the read-only `table_list` pragma, including its SQL table
function. Product verifiers can prove STRICT table metadata before shared startup or during an
immutable offline inspection. Mutation pragmas and writes remain denied.

## 0.9.34 — parameterized schema inspection

Owned SQLite verification accepts table, column, index, and foreign-key metadata queries with
object-name arguments, including parameterized SQL table functions. These arguments select schema
objects; they do not change database settings. Setting changes and writes remain denied in both
before-write and immutable snapshot verification. No product API or schema migration changes.
