import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, } from '@angular/core';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxBreadcrumbsComponent, } from '../../primitives/navigation/cx-breadcrumbs/index.js';
import { CxMenuComponent, CxMenuTriggerDirective } from '../../primitives/overlay/cx-menu/index.js';
import * as i0 from "@angular/core";
const DEFAULT_HEADING = 'Page title';
export class CxTopBarComponent {
    menuItemsValue;
    titleValue = { kind: 'heading', heading: DEFAULT_HEADING };
    /**
     * Named `pageTitle` rather than `title`: a `title` attribute on any element
     * raises a native browser tooltip, which the framework bans outright.
     */
    set pageTitle(value) {
        this.titleValue = validateTopBarTitle(value);
    }
    get pageTitle() {
        return this.titleValue;
    }
    set menuItems(value) {
        this.menuItemsValue = validateTopBarMenuItems(value);
    }
    get menuItems() {
        return this.menuItemsValue;
    }
    menuAriaLabel;
    descriptionChange = new EventEmitter();
    menuItemSelect = new EventEmitter();
    breadcrumbSelect = new EventEmitter();
    breadcrumbOptionSelect = new EventEmitter();
    // Narrowed views of the title union. A getter returning a union cannot be
    // narrowed by a template guard, so each shape is handed to the template
    // already resolved and bound through `@if (…; as …)`.
    headingTitle() {
        return this.titleValue.kind === 'heading' ? this.titleValue : undefined;
    }
    breadcrumbsTitle() {
        return this.titleValue.kind === 'breadcrumbs' ? this.titleValue : undefined;
    }
    resolvedHeading() {
        const title = this.headingTitle();
        return title?.heading.trim() || DEFAULT_HEADING;
    }
    hasDescription(title) {
        return (title.description ?? '').trim().length > 0;
    }
    hasMenuItems() {
        return (this.menuItems?.length ?? 0) > 0;
    }
    /**
     * The trail's current crumb, which is the page's own name. Falls back to the
     * last crumb when no `currentId` matches, mirroring how `cx-breadcrumbs`
     * itself resolves the current item.
     */
    currentCrumbLabel() {
        const title = this.breadcrumbsTitle();
        if (!title) {
            return '';
        }
        const currentId = title.currentId?.trim();
        const current = (currentId ? title.items.find(item => item.id === currentId) : undefined) ?? title.items.at(-1);
        return current?.label?.trim() ?? '';
    }
    resolvedMenuAriaLabel() {
        const label = this.menuAriaLabel?.trim();
        if (label)
            return label;
        const name = this.breadcrumbsTitle() ? this.currentCrumbLabel() : this.resolvedHeading();
        return name ? `${name} actions` : 'Top bar actions';
    }
    onMenuItemSelect(itemId) {
        this.menuItemSelect.emit(itemId);
    }
    commitDescription(title, next) {
        const trimmed = next.trim();
        if (trimmed !== (title.description ?? '').trim()) {
            this.descriptionChange.emit(trimmed);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTopBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTopBarComponent, isStandalone: true, selector: "cx-top-bar", inputs: { pageTitle: "pageTitle", menuItems: "menuItems", menuAriaLabel: "menuAriaLabel" }, outputs: { descriptionChange: "descriptionChange", menuItemSelect: "menuItemSelect", breadcrumbSelect: "breadcrumbSelect", breadcrumbOptionSelect: "breadcrumbOptionSelect" }, ngImport: i0, template: "<header class=\"cx-top-bar\">\n  <div class=\"cx-top-bar__inner\">\n    <div class=\"cx-top-bar__copy\">\n      @if (breadcrumbsTitle(); as crumbs) {\n        <!--\n          Breadcrumbs are a nav landmark, not a heading, so the page would lose\n          its h1 outright. The current crumb is the page's own name, so it\n          carries the heading for assistive tech while the trail carries it\n          visually.\n        -->\n        @if (currentCrumbLabel(); as crumbLabel) {\n          <h1 class=\"cx-sr-only\">{{ crumbLabel }}</h1>\n        }\n\n        <cx-breadcrumbs\n          class=\"cx-top-bar__breadcrumbs\"\n          [items]=\"crumbs.items\"\n          [currentId]=\"crumbs.currentId\"\n          [ariaLabel]=\"crumbs.ariaLabel\"\n          (itemSelect)=\"breadcrumbSelect.emit($event)\"\n          (optionSelect)=\"breadcrumbOptionSelect.emit($event)\"\n        />\n      } @else if (headingTitle(); as headingCopy) {\n        <h1 class=\"cx-top-bar__heading\">{{ resolvedHeading() }}</h1>\n\n        @if (headingCopy.editableDescription) {\n          <p\n            #descriptionElement\n            class=\"cx-top-bar__description cx-top-bar__description--editable\"\n            [attr.contenteditable]=\"'plaintext-only'\"\n            [attr.data-placeholder]=\"'Add a description'\"\n            role=\"textbox\"\n            spellcheck=\"true\"\n            (blur)=\"commitDescription(headingCopy, descriptionElement.innerText)\"\n            (keydown.enter)=\"$event.preventDefault(); descriptionElement.blur()\"\n            (keydown.escape)=\"descriptionElement.innerText = headingCopy.description ?? ''; descriptionElement.blur()\"\n          >{{ headingCopy.description }}</p>\n        } @else if (hasDescription(headingCopy)) {\n          <p class=\"cx-top-bar__description\">{{ headingCopy.description }}</p>\n        }\n      }\n    </div>\n\n    <div class=\"cx-top-bar__actions\">\n      <ng-content select=\"[actions], [cxTopBarActions]\" />\n\n      @if (hasMenuItems()) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-top-bar__menu\"\n          [items]=\"menuItems ?? []\"\n          [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          align=\"end\"\n          (itemSelect)=\"onMenuItemSelect($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            variant=\"transparent\"\n            [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </div>\n</header>\n", styles: [":host{display:block;flex-shrink:0;position:sticky;top:0;z-index:var(--z-index-sticky)}.cx-top-bar{display:block;min-width:0;border-bottom:var(--line);background:var(--surface);box-sizing:border-box}.cx-top-bar__inner{display:flex;width:100%;min-width:0;align-items:flex-start;justify-content:space-between;gap:var(--space-lg);padding:var(--space-md);box-sizing:border-box}.cx-top-bar__copy{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--space-sm)}.cx-top-bar__heading{margin:0;color:var(--ink);font-size:var(--font-size-title-1);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);overflow-wrap:anywhere}.cx-top-bar__breadcrumbs{display:block;min-width:0}.cx-top-bar__description{max-width:720px;margin:0;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);overflow-wrap:anywhere}.cx-top-bar__description--editable{padding:2px 6px;margin-left:-6px;border-radius:var(--radius-sm);cursor:text;outline:none;transition:background-color var(--motion-fast) ease,outline-color var(--motion-fast) ease}.cx-top-bar__description--editable:hover{background:var(--opacity-low)}.cx-top-bar__description--editable:focus{background:var(--surface);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-top-bar__description--editable:empty::before{content:attr(data-placeholder);color:var(--placeholder)}.cx-top-bar__actions{display:inline-flex;min-width:0;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:var(--space-sm)}.cx-top-bar__actions:empty{display:none}.cx-top-bar__menu{display:inline-flex;flex:0 0 auto}@media(max-width: 640px){.cx-top-bar__inner{flex-direction:column;align-items:stretch;gap:var(--space-md)}.cx-top-bar__actions{justify-content:flex-start}}"], dependencies: [{ kind: "component", type: CxBreadcrumbsComponent, selector: "cx-breadcrumbs", inputs: ["ariaLabel", "items", "currentId"], outputs: ["itemSelect", "optionSelect"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTopBarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-top-bar', imports: [CxBreadcrumbsComponent, CxIconButtonComponent, CxMenuComponent, CxMenuTriggerDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<header class=\"cx-top-bar\">\n  <div class=\"cx-top-bar__inner\">\n    <div class=\"cx-top-bar__copy\">\n      @if (breadcrumbsTitle(); as crumbs) {\n        <!--\n          Breadcrumbs are a nav landmark, not a heading, so the page would lose\n          its h1 outright. The current crumb is the page's own name, so it\n          carries the heading for assistive tech while the trail carries it\n          visually.\n        -->\n        @if (currentCrumbLabel(); as crumbLabel) {\n          <h1 class=\"cx-sr-only\">{{ crumbLabel }}</h1>\n        }\n\n        <cx-breadcrumbs\n          class=\"cx-top-bar__breadcrumbs\"\n          [items]=\"crumbs.items\"\n          [currentId]=\"crumbs.currentId\"\n          [ariaLabel]=\"crumbs.ariaLabel\"\n          (itemSelect)=\"breadcrumbSelect.emit($event)\"\n          (optionSelect)=\"breadcrumbOptionSelect.emit($event)\"\n        />\n      } @else if (headingTitle(); as headingCopy) {\n        <h1 class=\"cx-top-bar__heading\">{{ resolvedHeading() }}</h1>\n\n        @if (headingCopy.editableDescription) {\n          <p\n            #descriptionElement\n            class=\"cx-top-bar__description cx-top-bar__description--editable\"\n            [attr.contenteditable]=\"'plaintext-only'\"\n            [attr.data-placeholder]=\"'Add a description'\"\n            role=\"textbox\"\n            spellcheck=\"true\"\n            (blur)=\"commitDescription(headingCopy, descriptionElement.innerText)\"\n            (keydown.enter)=\"$event.preventDefault(); descriptionElement.blur()\"\n            (keydown.escape)=\"descriptionElement.innerText = headingCopy.description ?? ''; descriptionElement.blur()\"\n          >{{ headingCopy.description }}</p>\n        } @else if (hasDescription(headingCopy)) {\n          <p class=\"cx-top-bar__description\">{{ headingCopy.description }}</p>\n        }\n      }\n    </div>\n\n    <div class=\"cx-top-bar__actions\">\n      <ng-content select=\"[actions], [cxTopBarActions]\" />\n\n      @if (hasMenuItems()) {\n        <cx-menu\n          [presentation]=\"{ kind: 'trigger' }\"\n          class=\"cx-top-bar__menu\"\n          [items]=\"menuItems ?? []\"\n          [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          align=\"end\"\n          (itemSelect)=\"onMenuItemSelect($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            variant=\"transparent\"\n            [ariaLabel]=\"resolvedMenuAriaLabel()\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </div>\n</header>\n", styles: [":host{display:block;flex-shrink:0;position:sticky;top:0;z-index:var(--z-index-sticky)}.cx-top-bar{display:block;min-width:0;border-bottom:var(--line);background:var(--surface);box-sizing:border-box}.cx-top-bar__inner{display:flex;width:100%;min-width:0;align-items:flex-start;justify-content:space-between;gap:var(--space-lg);padding:var(--space-md);box-sizing:border-box}.cx-top-bar__copy{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--space-sm)}.cx-top-bar__heading{margin:0;color:var(--ink);font-size:var(--font-size-title-1);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);overflow-wrap:anywhere}.cx-top-bar__breadcrumbs{display:block;min-width:0}.cx-top-bar__description{max-width:720px;margin:0;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);overflow-wrap:anywhere}.cx-top-bar__description--editable{padding:2px 6px;margin-left:-6px;border-radius:var(--radius-sm);cursor:text;outline:none;transition:background-color var(--motion-fast) ease,outline-color var(--motion-fast) ease}.cx-top-bar__description--editable:hover{background:var(--opacity-low)}.cx-top-bar__description--editable:focus{background:var(--surface);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-top-bar__description--editable:empty::before{content:attr(data-placeholder);color:var(--placeholder)}.cx-top-bar__actions{display:inline-flex;min-width:0;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:var(--space-sm)}.cx-top-bar__actions:empty{display:none}.cx-top-bar__menu{display:inline-flex;flex:0 0 auto}@media(max-width: 640px){.cx-top-bar__inner{flex-direction:column;align-items:stretch;gap:var(--space-md)}.cx-top-bar__actions{justify-content:flex-start}}"] }]
        }], propDecorators: { pageTitle: [{
                type: Input
            }], menuItems: [{
                type: Input
            }], menuAriaLabel: [{
                type: Input
            }], descriptionChange: [{
                type: Output
            }], menuItemSelect: [{
                type: Output
            }], breadcrumbSelect: [{
                type: Output
            }], breadcrumbOptionSelect: [{
                type: Output
            }] } });
function validateTopBarTitle(value) {
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
            throw new Error(`[cx-top-bar] unknown title kind "${value.kind}". Use "heading" or "breadcrumbs".`);
    }
}
function validateTopBarMenuItems(value) {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error('[cx-top-bar] menuItems must be an array.');
    }
    validateTopBarMenuLevel(value, 'menuItems', new Set());
    return [...value];
}
function validateTopBarMenuLevel(items, path, ids) {
    const labels = new Set();
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
