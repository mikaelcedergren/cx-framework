import { EventEmitter } from '@angular/core';
import { type CxBreadcrumbItem, type CxBreadcrumbOptionSelectEvent } from '../../primitives/navigation/cx-breadcrumbs';
import { type CxMenuItem } from '../../primitives/overlay/cx-menu';
import * as i0 from "@angular/core";
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
export declare class CxTopBarComponent {
    private menuItemsValue;
    private titleValue;
    /**
     * Named `pageTitle` rather than `title`: a `title` attribute on any element
     * raises a native browser tooltip, which the framework bans outright.
     */
    set pageTitle(value: CxTopBarTitle);
    get pageTitle(): CxTopBarTitle;
    set menuItems(value: readonly CxMenuItem[] | undefined);
    get menuItems(): readonly CxMenuItem[] | undefined;
    menuAriaLabel: string | undefined;
    readonly descriptionChange: EventEmitter<string>;
    readonly menuItemSelect: EventEmitter<string>;
    readonly breadcrumbSelect: EventEmitter<string>;
    readonly breadcrumbOptionSelect: EventEmitter<CxBreadcrumbOptionSelectEvent>;
    protected headingTitle(): CxTopBarHeadingTitle | undefined;
    protected breadcrumbsTitle(): CxTopBarBreadcrumbsTitle | undefined;
    protected resolvedHeading(): string;
    protected hasDescription(title: CxTopBarHeadingTitle): boolean;
    protected hasMenuItems(): boolean;
    /**
     * The trail's current crumb, which is the page's own name. Falls back to the
     * last crumb when no `currentId` matches, mirroring how `cx-breadcrumbs`
     * itself resolves the current item.
     */
    protected currentCrumbLabel(): string;
    protected resolvedMenuAriaLabel(): string;
    protected onMenuItemSelect(itemId: string): void;
    protected commitDescription(title: CxTopBarHeadingTitle, next: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTopBarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTopBarComponent, "cx-top-bar", never, { "pageTitle": { "alias": "pageTitle"; "required": false; }; "menuItems": { "alias": "menuItems"; "required": false; }; "menuAriaLabel": { "alias": "menuAriaLabel"; "required": false; }; }, { "descriptionChange": "descriptionChange"; "menuItemSelect": "menuItemSelect"; "breadcrumbSelect": "breadcrumbSelect"; "breadcrumbOptionSelect": "breadcrumbOptionSelect"; }, never, ["[actions], [cxTopBarActions]"], true, never>;
}
//# sourceMappingURL=cx-top-bar.component.d.ts.map