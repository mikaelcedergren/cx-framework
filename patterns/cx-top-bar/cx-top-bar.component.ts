import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import {
  CxBreadcrumbsComponent,
  type CxBreadcrumbItem,
  type CxBreadcrumbOptionSelectEvent,
} from '../../primitives/navigation/cx-breadcrumbs';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../../primitives/overlay/cx-menu';

/** A page title with an optional supporting line beneath it. */
export interface CxTopBarHeadingTitle {
  kind: 'heading';
  heading: string;
  description?: string;
  /**
   * Edits the description in place. Only enable this when saving the edit is a
   * real product behavior; the bar emits `descriptionChange` on commit.
   */
  editableDescription?: boolean;
}

/**
 * A breadcrumb trail standing in for the page title. A single-item trail reads
 * as a smaller heading, which is the point of choosing it for a page that sits
 * inside a hierarchy. There is no description in this shape.
 */
export interface CxTopBarBreadcrumbsTitle {
  kind: 'breadcrumbs';
  items: readonly CxBreadcrumbItem[];
  currentId?: string;
  ariaLabel?: string;
}

/**
 * What the bar is titled with. The mode carries its own data, so a title can
 * never name one treatment while supplying another's fields — the compiler
 * rejects it at the call site under `strictTemplates`.
 */
export type CxTopBarTitle = CxTopBarHeadingTitle | CxTopBarBreadcrumbsTitle;

const DEFAULT_HEADING = 'Page title';

@Component({
  selector: 'cx-top-bar',
  imports: [CxBreadcrumbsComponent, CxIconButtonComponent, CxMenuComponent, CxMenuTriggerDirective],
  templateUrl: './cx-top-bar.component.html',
  styleUrl: './cx-top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTopBarComponent {
  private menuItemsValue: readonly CxMenuItem[] | undefined;
  private titleValue: CxTopBarTitle = { kind: 'heading', heading: DEFAULT_HEADING };

  /**
   * Named `pageTitle` rather than `title`: a `title` attribute on any element
   * raises a native browser tooltip, which the framework bans outright.
   */
  @Input()
  public set pageTitle(value: CxTopBarTitle) {
    this.titleValue = validateTopBarTitle(value);
  }
  public get pageTitle(): CxTopBarTitle {
    return this.titleValue;
  }

  @Input()
  public set menuItems(value: readonly CxMenuItem[] | undefined) {
    this.menuItemsValue = validateTopBarMenuItems(value);
  }
  public get menuItems(): readonly CxMenuItem[] | undefined {
    return this.menuItemsValue;
  }
  @Input() menuAriaLabel: string | undefined;

  @Output() readonly descriptionChange = new EventEmitter<string>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();
  @Output() readonly breadcrumbSelect = new EventEmitter<string>();
  @Output() readonly breadcrumbOptionSelect = new EventEmitter<CxBreadcrumbOptionSelectEvent>();

  // Narrowed views of the title union. A getter returning a union cannot be
  // narrowed by a template guard, so each shape is handed to the template
  // already resolved and bound through `@if (…; as …)`.
  protected headingTitle(): CxTopBarHeadingTitle | undefined {
    return this.titleValue.kind === 'heading' ? this.titleValue : undefined;
  }

  protected breadcrumbsTitle(): CxTopBarBreadcrumbsTitle | undefined {
    return this.titleValue.kind === 'breadcrumbs' ? this.titleValue : undefined;
  }

  protected resolvedHeading(): string {
    const title = this.headingTitle();
    return title?.heading.trim() || DEFAULT_HEADING;
  }

  protected hasDescription(title: CxTopBarHeadingTitle): boolean {
    return (title.description ?? '').trim().length > 0;
  }

  protected hasMenuItems(): boolean {
    return (this.menuItems?.length ?? 0) > 0;
  }

  /**
   * The trail's current crumb, which is the page's own name. Falls back to the
   * last crumb when no `currentId` matches, mirroring how `cx-breadcrumbs`
   * itself resolves the current item.
   */
  protected currentCrumbLabel(): string {
    const title = this.breadcrumbsTitle();
    if (!title) {
      return '';
    }

    const currentId = title.currentId?.trim();
    const current =
      (currentId ? title.items.find(item => item.id === currentId) : undefined) ?? title.items.at(-1);
    return current?.label?.trim() ?? '';
  }

  protected resolvedMenuAriaLabel(): string {
    const label = this.menuAriaLabel?.trim();
    if (label) return label;

    const name = this.breadcrumbsTitle() ? this.currentCrumbLabel() : this.resolvedHeading();
    return name ? `${name} actions` : 'Top bar actions';
  }

  protected onMenuItemSelect(itemId: string): void {
    this.menuItemSelect.emit(itemId);
  }

  protected commitDescription(title: CxTopBarHeadingTitle, next: string): void {
    const trimmed = next.trim();
    if (trimmed !== (title.description ?? '').trim()) {
      this.descriptionChange.emit(trimmed);
    }
  }
}

function validateTopBarTitle(value: CxTopBarTitle): CxTopBarTitle {
  if (!value || typeof value !== 'object') {
    throw new Error('[cx-top-bar] title must be a heading or breadcrumbs object.');
  }

  switch (value.kind) {
    case 'heading':
      if (typeof value.heading !== 'string') {
        throw new Error('[cx-top-bar] a heading title requires a heading string.');
      }
      return value;
    case 'breadcrumbs':
      if (!Array.isArray(value.items)) {
        throw new Error('[cx-top-bar] a breadcrumbs title requires an items array.');
      }
      return value;
    default:
      throw new Error(
        `[cx-top-bar] unknown title kind "${(value as { kind: string }).kind}". Use "heading" or "breadcrumbs".`,
      );
  }
}

function validateTopBarMenuItems(
  value: readonly CxMenuItem[] | undefined,
): readonly CxMenuItem[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('[cx-top-bar] menuItems must be an array.');
  }

  validateTopBarMenuLevel(value, 'menuItems', new Set<string>());
  return [...value];
}

function validateTopBarMenuLevel(
  items: readonly CxMenuItem[],
  path: string,
  ids: Set<string>,
): void {
  const labels = new Set<string>();
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    const id = typeof item?.id === 'string' ? item.id.trim() : '';
    if (!id) {
      throw new Error(`[cx-top-bar] ${itemPath} requires a non-empty id.`);
    }
    if (ids.has(id)) {
      throw new Error(`[cx-top-bar] menu item id "${id}" must be unique.`);
    }
    ids.add(id);

    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    const labelKey = label.toLowerCase();
    if (labels.has(labelKey)) {
      throw new Error(`[cx-top-bar] menu item label "${label}" must be unique within ${path}.`);
    }
    labels.add(labelKey);

    if (item.items !== undefined) {
      if (!Array.isArray(item.items)) {
        throw new Error(`[cx-top-bar] ${itemPath}.items must be an array.`);
      }
      validateTopBarMenuLevel(item.items, `${itemPath}.items`, ids);
    }
  });
}
