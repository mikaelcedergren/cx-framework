import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, booleanAttribute, } from '@angular/core';
import { CX_THEMES, CX_THEME_ICONS, CX_THEME_LABELS, cxThemeStartsGroup, isCxThemeMode, } from '../../theme.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxMenuComponent, CxMenuTriggerDirective, } from '../../primitives/overlay/cx-menu/index.js';
import * as i0 from "@angular/core";
const THEME_MENU_ITEMS = CX_THEMES.map((theme, index) => ({
    id: theme.id,
    label: theme.label,
    prependIcon: theme.icon,
    type: 'choice',
    dividerBefore: cxThemeStartsGroup(index),
}));
export class CxUtilityBarComponent {
    static instanceCounter = 0;
    headingId = `cx-utility-bar-heading-${++CxUtilityBarComponent.instanceCounter}`;
    themeMenuItems = THEME_MENU_ITEMS;
    themeMenuPresentation = { kind: 'trigger' };
    heading = '';
    visible = false;
    themeMode;
    themeModeChange = new EventEmitter();
    resolvedHeading() {
        return this.heading.trim();
    }
    themeIcon(mode) {
        return CX_THEME_ICONS[mode];
    }
    themeTriggerLabel(mode) {
        return `Choose theme. Current theme: ${CX_THEME_LABELS[mode]}.`;
    }
    onThemeModeChange(value) {
        if (isCxThemeMode(value)) {
            this.themeModeChange.emit(value);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxUtilityBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxUtilityBarComponent, isStandalone: true, selector: "cx-utility-bar", inputs: { heading: "heading", visible: ["visible", "visible", booleanAttribute], themeMode: "themeMode" }, outputs: { themeModeChange: "themeModeChange" }, ngImport: i0, template: "@if (visible) {\n  <section\n    class=\"cx-utility-bar\"\n    [attr.aria-labelledby]=\"resolvedHeading() ? headingId : null\"\n    [attr.aria-label]=\"resolvedHeading() ? null : 'Internal utility bar'\"\n  >\n    <div class=\"cx-utility-bar__main\">\n      @if (resolvedHeading(); as title) {\n        <div class=\"cx-utility-bar__heading\" [id]=\"headingId\">{{ title }}</div>\n      }\n\n      <div class=\"cx-utility-bar__content\">\n        <ng-content />\n      </div>\n    </div>\n\n    <div class=\"cx-utility-bar__actions\">\n      <ng-content select=\"[actions]\" />\n    </div>\n\n    @if (themeMode; as mode) {\n      <div class=\"cx-utility-bar__theme\">\n        <cx-menu\n          [presentation]=\"themeMenuPresentation\"\n          [items]=\"themeMenuItems\"\n          [currentId]=\"mode\"\n          heading=\"Theme\"\n          ariaLabel=\"Theme\"\n          align=\"end\"\n          [width]=\"200\"\n          (currentIdChange)=\"onThemeModeChange($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            [icon]=\"themeIcon(mode)\"\n            [ariaLabel]=\"themeTriggerLabel(mode)\"\n            variant=\"transparent\"\n            size=\"small\"\n          />\n        </cx-menu>\n      </div>\n    }\n  </section>\n}\n", styles: [":root{--breakpoint-mobile: 720px}:host{display:contents}.cx-utility-bar{--link: var(--on-utility-bar);--cx-icon-button-transparent-color: var(--on-utility-bar);--cx-icon-button-transparent-hover-background: color-mix(in srgb, var(--on-utility-bar) 10%, transparent);display:flex;width:100%;min-width:0;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-md);background-color:var(--utility-bar-surface);background-image:repeating-linear-gradient(-45deg, transparent 0, transparent var(--space-sm), color-mix(in srgb, var(--on-ink) 4%, transparent) var(--space-sm), color-mix(in srgb, var(--on-ink) 4%, transparent) var(--space-md));color:var(--on-utility-bar);box-sizing:border-box;font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-utility-bar__main,.cx-utility-bar__content,.cx-utility-bar__actions,.cx-utility-bar__theme{display:flex;min-width:0;align-items:center}.cx-utility-bar__main{flex:1 1 auto;gap:var(--space-md)}.cx-utility-bar__heading{min-width:0;flex:0 1 auto;color:currentColor;font-weight:var(--font-weight-bold);overflow-wrap:anywhere;text-transform:uppercase}.cx-utility-bar__content{flex:1 1 auto;flex-wrap:wrap;gap:var(--space-md);overflow-wrap:anywhere}.cx-utility-bar__actions{flex:0 0 auto;gap:var(--space-xs);margin-inline-start:auto}.cx-utility-bar__theme{flex:0 0 auto}.cx-utility-bar__content:empty,.cx-utility-bar__actions:empty{display:none}@media(max-width: 719px){.cx-utility-bar{flex-wrap:wrap;row-gap:var(--space-xs)}.cx-utility-bar__main{order:1}.cx-utility-bar__theme{order:2;margin-inline-start:auto}.cx-utility-bar__actions{width:100%;flex:1 1 100%;order:3;justify-content:flex-end;margin-inline-start:0}}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxUtilityBarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-utility-bar', imports: [CxIconButtonComponent, CxMenuComponent, CxMenuTriggerDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (visible) {\n  <section\n    class=\"cx-utility-bar\"\n    [attr.aria-labelledby]=\"resolvedHeading() ? headingId : null\"\n    [attr.aria-label]=\"resolvedHeading() ? null : 'Internal utility bar'\"\n  >\n    <div class=\"cx-utility-bar__main\">\n      @if (resolvedHeading(); as title) {\n        <div class=\"cx-utility-bar__heading\" [id]=\"headingId\">{{ title }}</div>\n      }\n\n      <div class=\"cx-utility-bar__content\">\n        <ng-content />\n      </div>\n    </div>\n\n    <div class=\"cx-utility-bar__actions\">\n      <ng-content select=\"[actions]\" />\n    </div>\n\n    @if (themeMode; as mode) {\n      <div class=\"cx-utility-bar__theme\">\n        <cx-menu\n          [presentation]=\"themeMenuPresentation\"\n          [items]=\"themeMenuItems\"\n          [currentId]=\"mode\"\n          heading=\"Theme\"\n          ariaLabel=\"Theme\"\n          align=\"end\"\n          [width]=\"200\"\n          (currentIdChange)=\"onThemeModeChange($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            [icon]=\"themeIcon(mode)\"\n            [ariaLabel]=\"themeTriggerLabel(mode)\"\n            variant=\"transparent\"\n            size=\"small\"\n          />\n        </cx-menu>\n      </div>\n    }\n  </section>\n}\n", styles: [":root{--breakpoint-mobile: 720px}:host{display:contents}.cx-utility-bar{--link: var(--on-utility-bar);--cx-icon-button-transparent-color: var(--on-utility-bar);--cx-icon-button-transparent-hover-background: color-mix(in srgb, var(--on-utility-bar) 10%, transparent);display:flex;width:100%;min-width:0;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-md);background-color:var(--utility-bar-surface);background-image:repeating-linear-gradient(-45deg, transparent 0, transparent var(--space-sm), color-mix(in srgb, var(--on-ink) 4%, transparent) var(--space-sm), color-mix(in srgb, var(--on-ink) 4%, transparent) var(--space-md));color:var(--on-utility-bar);box-sizing:border-box;font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-utility-bar__main,.cx-utility-bar__content,.cx-utility-bar__actions,.cx-utility-bar__theme{display:flex;min-width:0;align-items:center}.cx-utility-bar__main{flex:1 1 auto;gap:var(--space-md)}.cx-utility-bar__heading{min-width:0;flex:0 1 auto;color:currentColor;font-weight:var(--font-weight-bold);overflow-wrap:anywhere;text-transform:uppercase}.cx-utility-bar__content{flex:1 1 auto;flex-wrap:wrap;gap:var(--space-md);overflow-wrap:anywhere}.cx-utility-bar__actions{flex:0 0 auto;gap:var(--space-xs);margin-inline-start:auto}.cx-utility-bar__theme{flex:0 0 auto}.cx-utility-bar__content:empty,.cx-utility-bar__actions:empty{display:none}@media(max-width: 719px){.cx-utility-bar{flex-wrap:wrap;row-gap:var(--space-xs)}.cx-utility-bar__main{order:1}.cx-utility-bar__theme{order:2;margin-inline-start:auto}.cx-utility-bar__actions{width:100%;flex:1 1 100%;order:3;justify-content:flex-end;margin-inline-start:0}}"] }]
        }], propDecorators: { heading: [{
                type: Input
            }], visible: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], themeMode: [{
                type: Input
            }], themeModeChange: [{
                type: Output
            }] } });
