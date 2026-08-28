import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
export class CxLogStep {
    position;
    text;
    size;
    icon;
    mood;
    link;
    constructor(position, text, size, icon, mood, link) {
        this.position = position;
        this.text = text;
        this.size = size;
        this.icon = icon;
        this.mood = mood;
        this.link = link;
    }
    static of(text) {
        return new CxLogStep('middle', text, 'default', undefined, 'default', undefined);
    }
    static empty() {
        return CxLogStep.of('');
    }
    withPosition(position) {
        return new CxLogStep(position, this.text, this.size, this.icon, this.mood, this.link);
    }
    withText(text) {
        return new CxLogStep(this.position, text, this.size, this.icon, this.mood, this.link);
    }
    withSize(size) {
        return new CxLogStep(this.position, this.text, size, this.icon, this.mood, this.link);
    }
    withIcon(icon) {
        return new CxLogStep(this.position, this.text, 'large', icon, this.mood, this.link);
    }
    withMood(mood) {
        return new CxLogStep(this.position, this.text, this.size, this.icon, mood, this.link);
    }
    withLink(link) {
        return new CxLogStep(this.position, this.text, this.size, this.icon, this.mood, link);
    }
}
const DEFAULT_STEP = CxLogStep.empty();
export class CxLogStepComponent {
    stepState = DEFAULT_STEP;
    logContentRef;
    set step(step) {
        this.stepState = step ?? DEFAULT_STEP;
    }
    get step() {
        return this.stepState;
    }
    datestamp = '';
    description = '';
    author = '';
    routerLink() {
        const link = this.step.link;
        return link && 'routerLink' in link ? link.routerLink : undefined;
    }
    href() {
        const link = this.step.link;
        return link && 'href' in link ? link.href : undefined;
    }
    target() {
        const link = this.step.link;
        return (link && 'href' in link ? link.target : undefined) ?? null;
    }
    rel() {
        const link = this.step.link;
        return link && 'href' in link && link.target === '_blank' ? 'noopener' : null;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLogStepComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLogStepComponent, isStandalone: true, selector: "cx-log-step", inputs: { step: "step", datestamp: "datestamp", description: "description", author: "author" }, host: { properties: { "class.cx-log-step--first": "step.position === \"first\"", "class.cx-log-step--middle": "step.position === \"middle\"", "class.cx-log-step--last": "step.position === \"last\"", "class.cx-log-step--single": "step.position === \"single\"", "class.cx-log-step--large": "step.size === \"large\"", "class.cx-log-step--colored": "step.mood !== \"default\"", "class.cx-log-step--mood-primary": "step.mood === \"primary\"", "class.cx-log-step--mood-accent": "step.mood === \"accent\"", "class.cx-log-step--mood-info": "step.mood === \"info\"", "class.cx-log-step--mood-success": "step.mood === \"success\"", "class.cx-log-step--mood-warning": "step.mood === \"warning\"", "class.cx-log-step--mood-danger": "step.mood === \"danger\"" }, classAttribute: "cx-log-step" }, viewQueries: [{ propertyName: "logContentRef", first: true, predicate: ["logContent"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div class=\"cx-log-step__indicator\">\n  <div class=\"cx-log-step__line\"></div>\n  @if (step.icon; as iconName) {\n    <div class=\"cx-log-step__icon-marker\">\n      <cx-icon [icon]=\"iconName\" size=\"auto\" shape=\"circle-outline\" [mood]=\"step.mood\" />\n    </div>\n  } @else {\n    <div class=\"cx-log-step__circle\">\n      <div class=\"cx-log-step__circle-inner\"></div>\n    </div>\n  }\n</div>\n<div #logContent class=\"cx-log-step__content\">\n  @if (step.text.trim()) {\n    <div class=\"cx-log-step__title-row\">\n      <div class=\"cx-log-step__text\">\n        @if (routerLink(); as routerLink) {\n          <a class=\"cx-log-step__link\" [routerLink]=\"routerLink\">{{ step.text }}</a>\n        } @else if (href(); as href) {\n          <a\n            class=\"cx-log-step__link\"\n            [href]=\"href\"\n            [attr.target]=\"target()\"\n            [attr.rel]=\"rel()\"\n            >{{ step.text }}</a\n          >\n        } @else {\n          {{ step.text }}\n        }\n        @if (author.trim()) {\n          <span class=\"cx-log-step__author\"> by {{ author }}</span>\n        }\n      </div>\n      @if (datestamp.trim()) {\n        <div class=\"cx-log-step__datestamp\">{{ datestamp }}</div>\n      }\n    </div>\n  }\n  @if (description.trim()) {\n    <div class=\"cx-log-step__description\">{{ description }}</div>\n  }\n  <ng-content />\n</div>\n", styles: [":host{display:flex;min-height:var(--controller-size);flex-direction:row;align-items:stretch;gap:var(--space-sm)}:host(.cx-log-step--first),:host(.cx-log-step--middle){padding-bottom:calc(var(--space-sm) + var(--space-xs))}.cx-log-step__indicator{position:relative;width:24px;min-height:24px;flex-shrink:0}.cx-log-step__line{position:absolute;left:11px;width:2px;background:var(--opacity-mid)}:host(.cx-log-step--first) .cx-log-step__line{top:12px;bottom:calc(0px - var(--space-sm) - var(--space-xs))}:host(.cx-log-step--middle) .cx-log-step__line{top:0;bottom:calc(0px - var(--space-sm) - var(--space-xs))}:host(.cx-log-step--last) .cx-log-step__line{top:0;height:12px}:host(.cx-log-step--single) .cx-log-step__line{display:none}.cx-log-step__icon-marker{position:absolute;top:0;left:0;width:24px;height:24px;background:var(--surface)}.cx-log-step__circle{position:absolute;top:7px;left:6px;display:flex;width:12px;height:12px;align-items:center;justify-content:center;border:2px solid var(--opacity-mid);border-radius:var(--radius-pill);corner-shape:round;background:var(--surface);color:var(--ink)}:host(.cx-log-step--large) .cx-log-step__circle{top:4px;left:4px;width:16px;height:16px}:host(.cx-log-step--colored) .cx-log-step__circle{border:0;background:currentColor}:host(.cx-log-step--mood-primary){color:var(--primary)}:host(.cx-log-step--mood-accent){color:var(--accent)}:host(.cx-log-step--mood-info){color:var(--info)}:host(.cx-log-step--mood-success){color:var(--success)}:host(.cx-log-step--mood-warning){color:var(--warning)}:host(.cx-log-step--mood-danger){color:var(--danger)}.cx-log-step__content{display:flex;min-height:24px;min-width:0;flex:1;flex-direction:column;gap:var(--space-xs)}.cx-log-step__title-row{display:flex;flex-direction:row;align-items:baseline;gap:var(--space-sm)}.cx-log-step__text{min-width:0;padding-top:var(--space-xs);color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-log-step__link{color:inherit;text-decoration:underline;text-decoration-thickness:var(--border-width);text-underline-offset:2px;transition:text-decoration-thickness var(--motion-fast) ease}.cx-log-step__link:hover{text-decoration-thickness:calc(var(--border-width)*2)}.cx-log-step__link:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-log-step__author,.cx-log-step__datestamp,.cx-log-step__description{color:var(--opacity-high)}.cx-log-step__author{font-weight:var(--font-weight-regular)}.cx-log-step__datestamp{flex-shrink:0;padding-top:var(--space-xs);font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-log-step__description{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "browserUrl", "routerLink"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLogStepComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-log-step', imports: [CxIconComponent, RouterLink], host: {
                        class: 'cx-log-step',
                        '[class.cx-log-step--first]': 'step.position === "first"',
                        '[class.cx-log-step--middle]': 'step.position === "middle"',
                        '[class.cx-log-step--last]': 'step.position === "last"',
                        '[class.cx-log-step--single]': 'step.position === "single"',
                        '[class.cx-log-step--large]': 'step.size === "large"',
                        '[class.cx-log-step--colored]': 'step.mood !== "default"',
                        '[class.cx-log-step--mood-primary]': 'step.mood === "primary"',
                        '[class.cx-log-step--mood-accent]': 'step.mood === "accent"',
                        '[class.cx-log-step--mood-info]': 'step.mood === "info"',
                        '[class.cx-log-step--mood-success]': 'step.mood === "success"',
                        '[class.cx-log-step--mood-warning]': 'step.mood === "warning"',
                        '[class.cx-log-step--mood-danger]': 'step.mood === "danger"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-log-step__indicator\">\n  <div class=\"cx-log-step__line\"></div>\n  @if (step.icon; as iconName) {\n    <div class=\"cx-log-step__icon-marker\">\n      <cx-icon [icon]=\"iconName\" size=\"auto\" shape=\"circle-outline\" [mood]=\"step.mood\" />\n    </div>\n  } @else {\n    <div class=\"cx-log-step__circle\">\n      <div class=\"cx-log-step__circle-inner\"></div>\n    </div>\n  }\n</div>\n<div #logContent class=\"cx-log-step__content\">\n  @if (step.text.trim()) {\n    <div class=\"cx-log-step__title-row\">\n      <div class=\"cx-log-step__text\">\n        @if (routerLink(); as routerLink) {\n          <a class=\"cx-log-step__link\" [routerLink]=\"routerLink\">{{ step.text }}</a>\n        } @else if (href(); as href) {\n          <a\n            class=\"cx-log-step__link\"\n            [href]=\"href\"\n            [attr.target]=\"target()\"\n            [attr.rel]=\"rel()\"\n            >{{ step.text }}</a\n          >\n        } @else {\n          {{ step.text }}\n        }\n        @if (author.trim()) {\n          <span class=\"cx-log-step__author\"> by {{ author }}</span>\n        }\n      </div>\n      @if (datestamp.trim()) {\n        <div class=\"cx-log-step__datestamp\">{{ datestamp }}</div>\n      }\n    </div>\n  }\n  @if (description.trim()) {\n    <div class=\"cx-log-step__description\">{{ description }}</div>\n  }\n  <ng-content />\n</div>\n", styles: [":host{display:flex;min-height:var(--controller-size);flex-direction:row;align-items:stretch;gap:var(--space-sm)}:host(.cx-log-step--first),:host(.cx-log-step--middle){padding-bottom:calc(var(--space-sm) + var(--space-xs))}.cx-log-step__indicator{position:relative;width:24px;min-height:24px;flex-shrink:0}.cx-log-step__line{position:absolute;left:11px;width:2px;background:var(--opacity-mid)}:host(.cx-log-step--first) .cx-log-step__line{top:12px;bottom:calc(0px - var(--space-sm) - var(--space-xs))}:host(.cx-log-step--middle) .cx-log-step__line{top:0;bottom:calc(0px - var(--space-sm) - var(--space-xs))}:host(.cx-log-step--last) .cx-log-step__line{top:0;height:12px}:host(.cx-log-step--single) .cx-log-step__line{display:none}.cx-log-step__icon-marker{position:absolute;top:0;left:0;width:24px;height:24px;background:var(--surface)}.cx-log-step__circle{position:absolute;top:7px;left:6px;display:flex;width:12px;height:12px;align-items:center;justify-content:center;border:2px solid var(--opacity-mid);border-radius:var(--radius-pill);corner-shape:round;background:var(--surface);color:var(--ink)}:host(.cx-log-step--large) .cx-log-step__circle{top:4px;left:4px;width:16px;height:16px}:host(.cx-log-step--colored) .cx-log-step__circle{border:0;background:currentColor}:host(.cx-log-step--mood-primary){color:var(--primary)}:host(.cx-log-step--mood-accent){color:var(--accent)}:host(.cx-log-step--mood-info){color:var(--info)}:host(.cx-log-step--mood-success){color:var(--success)}:host(.cx-log-step--mood-warning){color:var(--warning)}:host(.cx-log-step--mood-danger){color:var(--danger)}.cx-log-step__content{display:flex;min-height:24px;min-width:0;flex:1;flex-direction:column;gap:var(--space-xs)}.cx-log-step__title-row{display:flex;flex-direction:row;align-items:baseline;gap:var(--space-sm)}.cx-log-step__text{min-width:0;padding-top:var(--space-xs);color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-log-step__link{color:inherit;text-decoration:underline;text-decoration-thickness:var(--border-width);text-underline-offset:2px;transition:text-decoration-thickness var(--motion-fast) ease}.cx-log-step__link:hover{text-decoration-thickness:calc(var(--border-width)*2)}.cx-log-step__link:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-log-step__author,.cx-log-step__datestamp,.cx-log-step__description{color:var(--opacity-high)}.cx-log-step__author{font-weight:var(--font-weight-regular)}.cx-log-step__datestamp{flex-shrink:0;padding-top:var(--space-xs);font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-log-step__description{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}"] }]
        }], propDecorators: { logContentRef: [{
                type: ViewChild,
                args: ['logContent', { read: ElementRef }]
            }], step: [{
                type: Input
            }], datestamp: [{
                type: Input
            }], description: [{
                type: Input
            }], author: [{
                type: Input
            }] } });
