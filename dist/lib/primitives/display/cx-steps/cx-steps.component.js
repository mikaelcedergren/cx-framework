import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, inject, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { isHostVisible } from '../../shared/host-visibility.js';
import * as i0 from "@angular/core";
export class CxStepsComponent {
    document = inject(DOCUMENT);
    compactState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "compactState" }] : /* istanbul ignore next */ []));
    resizeObserver;
    frame;
    viewReady = false;
    revealCurrent = true;
    measureElement;
    viewport;
    set measureList(ref) {
        if (this.measureElement)
            this.resizeObserver?.unobserve(this.measureElement);
        this.measureElement = ref?.nativeElement;
        if (this.measureElement)
            this.resizeObserver?.observe(this.measureElement);
        this.scheduleLayout();
    }
    ngAfterViewInit() {
        this.viewReady = true;
        this.resizeObserver = new ResizeObserver(() => {
            this.revealCurrent = true;
            this.scheduleLayout();
        });
        this.resizeObserver.observe(this.viewport.nativeElement);
        if (this.measureElement)
            this.resizeObserver.observe(this.measureElement);
        this.scheduleLayout();
    }
    ngOnChanges(changes) {
        if (changes['index'] || changes['steps'] || changes['density'] || changes['layout']) {
            this.revealCurrent = true;
            this.scheduleLayout();
        }
    }
    ngOnDestroy() {
        this.viewReady = false;
        this.resizeObserver?.disconnect();
        if (this.frame !== undefined)
            this.document.defaultView?.cancelAnimationFrame(this.frame);
    }
    isCompact() {
        return this.density === 'compact' || (this.density === 'auto' && this.compactState());
    }
    scheduleLayout() {
        const window = this.document.defaultView;
        if (!this.viewReady || !window || this.frame !== undefined)
            return;
        this.frame = window.requestAnimationFrame(() => {
            this.frame = undefined;
            this.syncLayout();
        });
    }
    syncLayout() {
        const viewport = this.viewport?.nativeElement;
        if (!viewport || viewport.clientWidth <= 0 || !isHostVisible(viewport))
            return;
        if (this.density === 'auto' && this.measureElement) {
            // Measure the full presentation independently of the visible density. Compact
            // must never make itself appear to fit and immediately switch back to full.
            const compact = this.measureElement.getBoundingClientRect().width > viewport.clientWidth + 1;
            if (compact !== this.compactState()) {
                this.compactState.set(compact);
                this.revealCurrent = true;
                this.scheduleLayout();
                return;
            }
        }
        if (!this.revealCurrent)
            return;
        this.revealCurrent = false;
        const current = viewport.querySelector('[aria-current="step"]');
        if (!current)
            return;
        const marker = current.querySelector('.cx-step__number').getBoundingClientRect();
        const label = current.querySelector('.cx-step__name').getBoundingClientRect();
        const bounds = viewport.getBoundingClientRect();
        const left = Math.min(marker.left, label.left);
        const right = Math.max(marker.right, label.right);
        // Scroll only this row, never the dialog or the page. For an exceptionally
        // long current label, keep its marker and leading edge visible.
        const rtl = this.document.defaultView.getComputedStyle(viewport).direction === 'rtl';
        const delta = right - left > viewport.clientWidth
            ? (rtl ? marker.right - bounds.right : marker.left - bounds.left)
            : left < bounds.left ? left - bounds.left : right > bounds.right ? right - bounds.right : 0;
        if (delta)
            viewport.scrollBy({ left: delta, behavior: 'instant' });
    }
    stepsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stepsState" }] : /* istanbul ignore next */ []));
    set steps(value) {
        this.stepsState.set(this.normalizeSteps(value));
    }
    get steps() {
        return this.stepsState();
    }
    index = 0;
    density = 'default';
    layout = 'default';
    steps$ = this.stepsState.asReadonly();
    currentIndex() {
        if (this.steps.length === 0) {
            return -1;
        }
        const index = Number.isFinite(this.index) ? Math.trunc(this.index) : 0;
        return Math.max(0, Math.min(index, this.steps.length));
    }
    isCurrent(index) {
        return index === this.currentIndex();
    }
    isCompleted(step, index) {
        return !this.isPending(step) && (step.status === 'success' || index < this.currentIndex());
    }
    labelIsVisible(index) {
        return !this.isCompact() || this.isCurrent(index);
    }
    isDanger(step) {
        return step.mood === 'danger';
    }
    isPending(step) {
        return step.status === 'pending';
    }
    /**
     * The label a step would have shown at default density, for the tooltip that
     * stands in for it while compact. Includes the badge, since the badge is part
     * of the visible label the tooltip is replacing.
     */
    stepTooltip(step) {
        const badge = this.badgeText(step);
        return badge ? `${step.name} (${badge})` : step.name;
    }
    badgeText(step) {
        if (typeof step.badge === 'number') {
            return Number.isFinite(step.badge) ? String(step.badge) : '';
        }
        return step.badge?.trim() ?? '';
    }
    stepStatus(step, index) {
        const sequenceStatus = this.isCurrent(index)
            ? 'Current'
            : this.isPending(step)
                ? 'Pending'
                : this.isCompleted(step, index)
                    ? 'Completed'
                    : 'Upcoming';
        return [
            sequenceStatus,
            this.isCurrent(index) && this.isPending(step) ? 'pending' : '',
            this.isCurrent(index) && step.status === 'success' ? 'completed' : '',
            this.isDanger(step) ? 'needs attention' : '',
        ].filter(Boolean).join(', ');
    }
    normalizeSteps(value) {
        return (value ?? []).map(step => {
            const name = step?.name?.trim() ?? '';
            return { ...step, name };
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxStepsComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxStepsComponent, isStandalone: true, selector: "cx-steps", inputs: { steps: "steps", index: "index", density: "density", layout: "layout" }, host: { properties: { "class.cx-steps--compact": "isCompact()", "class.cx-steps--auto": "density === \"auto\"", "class.cx-steps--fill": "layout === \"fill\"" } }, viewQueries: [{ propertyName: "viewport", first: true, predicate: ["viewport"], descendants: true, read: ElementRef }, { propertyName: "measureList", first: true, predicate: ["measureList"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<div #viewport class=\"cx-steps__viewport\">\n@if (steps$(); as steps) {\n@if (steps.length > 0) {\n<ol class=\"cx-steps__list\" aria-label=\"Steps\">\n  @for (step of steps; track index; let index = $index) {\n    <li\n      class=\"cx-step\"\n      [class.cx-step--selected]=\"isCurrent(index)\"\n      [class.cx-step--completed]=\"isCompleted(step, index)\"\n      [class.cx-step--pending]=\"isPending(step)\"\n      [class.cx-step--danger]=\"isDanger(step)\"\n      [attr.aria-current]=\"isCurrent(index) ? 'step' : null\"\n    >\n      <!--\n        While compact, every step but the current one hides its name, leaving a\n        bare number; the tooltip restores that name on hover. It hangs on the\n        aria-hidden number deliberately: this is a visual stand-in only, and the\n        name stays readable to assistive tech through .cx-step__name below, so\n        nothing is announced twice.\n      -->\n      <span\n        class=\"cx-step__number\"\n        aria-hidden=\"true\"\n        [cxTooltip]=\"stepTooltip(step)\"\n        [cxTooltipDisabled]=\"labelIsVisible(index)\"\n        cxTooltipDelay=\"none\"\n      >\n        @if (isPending(step)) {\n          <cx-icon icon=\"exclamation\" [size]=\"14\" />\n        } @else if (isDanger(step)) {\n          <cx-icon icon=\"warning\" [size]=\"14\" />\n        } @else if (isCompleted(step, index)) {\n          <cx-icon icon=\"check\" [size]=\"14\" />\n        } @else {\n          {{ index + 1 }}\n        }\n      </span>\n\n      <span class=\"cx-step__name\" [class.cx-step__name--visually-hidden]=\"!labelIsVisible(index)\">\n        <span>{{ step.name }}</span>\n        @if (badgeText(step); as badge) {\n          <span class=\"cx-step__badge\">{{ badge }}</span>\n        }\n      </span>\n\n      <span class=\"cx-step__status\">{{ stepStatus(step, index) }}</span>\n\n      @if (index < steps.length - 1) {\n        <span class=\"cx-step__divider\" aria-hidden=\"true\"></span>\n      }\n    </li>\n  }\n</ol>\n}\n}\n\n</div>\n@if (density === 'auto' && steps$().length) {\n  <div class=\"cx-steps__measure\" aria-hidden=\"true\" inert>\n    <div #measureList class=\"cx-steps__measure-list\">\n      @for (step of steps$(); track $index) {\n        <div class=\"cx-steps__measure-item\" [class.cx-step--danger]=\"isDanger(step)\">\n          <span class=\"cx-steps__measure-number\"></span>\n          <span class=\"cx-steps__measure-name\">\n            <span>{{ step.name }}</span>\n            @if (badgeText(step); as badge) {\n              <span class=\"cx-step__badge\">{{ badge }}</span>\n            }\n          </span>\n          @if (!$last) { <span class=\"cx-steps__measure-divider\"></span> }\n        </div>\n      }\n    </div>\n  </div>\n}\n", styles: [":host{position:relative;min-width:0;max-width:100%;display:block;color:var(--opacity-high)}.cx-steps__list,.cx-steps__measure-list{display:flex;flex-direction:row;align-items:center;gap:var(--space-md);margin:0;padding:0;list-style:none}.cx-step,.cx-steps__measure-item{display:flex;flex-direction:row;align-items:center;gap:var(--space-sm);cursor:default;transition:color var(--motion-fast) ease}.cx-step__number,.cx-steps__measure-number{display:flex;width:var(--icon-size-md);height:var(--icon-size-md);min-width:var(--icon-size-md);min-height:var(--icon-size-md);align-items:center;justify-content:center;border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);color:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);transition:background-color var(--motion-base) ease,color var(--motion-base) ease}.cx-step__name,.cx-steps__measure-name{display:inline-flex;align-items:center;gap:var(--space-xs);width:max-content;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-step__name--visually-hidden,.cx-step__status{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0, 0, 0, 0);clip-path:inset(50%);border:0;white-space:nowrap}.cx-step__badge{padding:0 var(--space-xs);border-radius:var(--radius-pill);background:var(--opacity-low);color:var(--ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-small);white-space:nowrap}.cx-step--completed{color:var(--opacity-high)}.cx-step--completed .cx-step__number{background:var(--success);color:var(--surface)}.cx-step--selected{color:var(--ink)}.cx-step--selected .cx-step__number{background:var(--primary);color:var(--on-ink);font-weight:var(--font-weight-bold)}.cx-step--danger{color:var(--danger)}.cx-step--danger .cx-step__number{background:var(--danger);color:var(--on-ink)}.cx-step--danger .cx-step__name,.cx-step--danger .cx-steps__measure-name{font-weight:var(--font-weight-medium)}.cx-step__divider,.cx-steps__measure-divider{width:var(--icon-size-xl);min-width:var(--icon-size-xl);height:1px;margin-left:var(--space-sm);background:var(--opacity-mid)}:host(.cx-steps--fill),:host(.cx-steps--auto){width:100%;min-width:0}:host(.cx-steps--fill) .cx-steps__list{width:100%}:host(.cx-steps--fill) .cx-step:not(:last-child){min-width:min-content;flex:1 1 0}:host(.cx-steps--fill) .cx-step__number,:host(.cx-steps--fill) .cx-step__name{flex:0 0 auto}:host(.cx-steps--fill) .cx-step__divider{width:auto;min-width:var(--icon-size-xl);flex:1 1 var(--icon-size-xl)}@media(prefers-reduced-motion: reduce){.cx-step,.cx-step__number{transition:none}}.cx-steps__viewport{min-width:0;overflow-x:auto}.cx-steps__measure{position:absolute;inset:0;overflow:hidden;visibility:hidden;pointer-events:none}.cx-steps__measure-list{width:max-content}:host(.cx-steps--compact) .cx-steps__list{width:max-content;max-width:100%;min-width:min-content}:host(.cx-steps--compact.cx-steps--fill) .cx-steps__list{width:100%}:host(.cx-steps--compact) .cx-step:not(:last-child){flex:0 1 auto;min-width:min-content}:host(.cx-steps--compact.cx-steps--fill) .cx-step:not(:last-child){flex-grow:1}:host(.cx-steps--compact) .cx-step:last-child,:host(.cx-steps--compact) .cx-step__number,:host(.cx-steps--compact) .cx-step__name{flex:0 0 auto}:host(.cx-steps--compact) .cx-step__divider{flex:1 1 var(--icon-size-xl);min-width:var(--space-xs)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxStepsComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-steps', imports: [CxIconComponent, CxTooltipDirective], host: {
                        '[class.cx-steps--compact]': 'isCompact()',
                        '[class.cx-steps--auto]': 'density === "auto"',
                        '[class.cx-steps--fill]': 'layout === "fill"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div #viewport class=\"cx-steps__viewport\">\n@if (steps$(); as steps) {\n@if (steps.length > 0) {\n<ol class=\"cx-steps__list\" aria-label=\"Steps\">\n  @for (step of steps; track index; let index = $index) {\n    <li\n      class=\"cx-step\"\n      [class.cx-step--selected]=\"isCurrent(index)\"\n      [class.cx-step--completed]=\"isCompleted(step, index)\"\n      [class.cx-step--pending]=\"isPending(step)\"\n      [class.cx-step--danger]=\"isDanger(step)\"\n      [attr.aria-current]=\"isCurrent(index) ? 'step' : null\"\n    >\n      <!--\n        While compact, every step but the current one hides its name, leaving a\n        bare number; the tooltip restores that name on hover. It hangs on the\n        aria-hidden number deliberately: this is a visual stand-in only, and the\n        name stays readable to assistive tech through .cx-step__name below, so\n        nothing is announced twice.\n      -->\n      <span\n        class=\"cx-step__number\"\n        aria-hidden=\"true\"\n        [cxTooltip]=\"stepTooltip(step)\"\n        [cxTooltipDisabled]=\"labelIsVisible(index)\"\n        cxTooltipDelay=\"none\"\n      >\n        @if (isPending(step)) {\n          <cx-icon icon=\"exclamation\" [size]=\"14\" />\n        } @else if (isDanger(step)) {\n          <cx-icon icon=\"warning\" [size]=\"14\" />\n        } @else if (isCompleted(step, index)) {\n          <cx-icon icon=\"check\" [size]=\"14\" />\n        } @else {\n          {{ index + 1 }}\n        }\n      </span>\n\n      <span class=\"cx-step__name\" [class.cx-step__name--visually-hidden]=\"!labelIsVisible(index)\">\n        <span>{{ step.name }}</span>\n        @if (badgeText(step); as badge) {\n          <span class=\"cx-step__badge\">{{ badge }}</span>\n        }\n      </span>\n\n      <span class=\"cx-step__status\">{{ stepStatus(step, index) }}</span>\n\n      @if (index < steps.length - 1) {\n        <span class=\"cx-step__divider\" aria-hidden=\"true\"></span>\n      }\n    </li>\n  }\n</ol>\n}\n}\n\n</div>\n@if (density === 'auto' && steps$().length) {\n  <div class=\"cx-steps__measure\" aria-hidden=\"true\" inert>\n    <div #measureList class=\"cx-steps__measure-list\">\n      @for (step of steps$(); track $index) {\n        <div class=\"cx-steps__measure-item\" [class.cx-step--danger]=\"isDanger(step)\">\n          <span class=\"cx-steps__measure-number\"></span>\n          <span class=\"cx-steps__measure-name\">\n            <span>{{ step.name }}</span>\n            @if (badgeText(step); as badge) {\n              <span class=\"cx-step__badge\">{{ badge }}</span>\n            }\n          </span>\n          @if (!$last) { <span class=\"cx-steps__measure-divider\"></span> }\n        </div>\n      }\n    </div>\n  </div>\n}\n", styles: [":host{position:relative;min-width:0;max-width:100%;display:block;color:var(--opacity-high)}.cx-steps__list,.cx-steps__measure-list{display:flex;flex-direction:row;align-items:center;gap:var(--space-md);margin:0;padding:0;list-style:none}.cx-step,.cx-steps__measure-item{display:flex;flex-direction:row;align-items:center;gap:var(--space-sm);cursor:default;transition:color var(--motion-fast) ease}.cx-step__number,.cx-steps__measure-number{display:flex;width:var(--icon-size-md);height:var(--icon-size-md);min-width:var(--icon-size-md);min-height:var(--icon-size-md);align-items:center;justify-content:center;border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low);color:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);transition:background-color var(--motion-base) ease,color var(--motion-base) ease}.cx-step__name,.cx-steps__measure-name{display:inline-flex;align-items:center;gap:var(--space-xs);width:max-content;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-step__name--visually-hidden,.cx-step__status{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0, 0, 0, 0);clip-path:inset(50%);border:0;white-space:nowrap}.cx-step__badge{padding:0 var(--space-xs);border-radius:var(--radius-pill);background:var(--opacity-low);color:var(--ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-small);white-space:nowrap}.cx-step--completed{color:var(--opacity-high)}.cx-step--completed .cx-step__number{background:var(--success);color:var(--surface)}.cx-step--selected{color:var(--ink)}.cx-step--selected .cx-step__number{background:var(--primary);color:var(--on-ink);font-weight:var(--font-weight-bold)}.cx-step--danger{color:var(--danger)}.cx-step--danger .cx-step__number{background:var(--danger);color:var(--on-ink)}.cx-step--danger .cx-step__name,.cx-step--danger .cx-steps__measure-name{font-weight:var(--font-weight-medium)}.cx-step__divider,.cx-steps__measure-divider{width:var(--icon-size-xl);min-width:var(--icon-size-xl);height:1px;margin-left:var(--space-sm);background:var(--opacity-mid)}:host(.cx-steps--fill),:host(.cx-steps--auto){width:100%;min-width:0}:host(.cx-steps--fill) .cx-steps__list{width:100%}:host(.cx-steps--fill) .cx-step:not(:last-child){min-width:min-content;flex:1 1 0}:host(.cx-steps--fill) .cx-step__number,:host(.cx-steps--fill) .cx-step__name{flex:0 0 auto}:host(.cx-steps--fill) .cx-step__divider{width:auto;min-width:var(--icon-size-xl);flex:1 1 var(--icon-size-xl)}@media(prefers-reduced-motion: reduce){.cx-step,.cx-step__number{transition:none}}.cx-steps__viewport{min-width:0;overflow-x:auto}.cx-steps__measure{position:absolute;inset:0;overflow:hidden;visibility:hidden;pointer-events:none}.cx-steps__measure-list{width:max-content}:host(.cx-steps--compact) .cx-steps__list{width:max-content;max-width:100%;min-width:min-content}:host(.cx-steps--compact.cx-steps--fill) .cx-steps__list{width:100%}:host(.cx-steps--compact) .cx-step:not(:last-child){flex:0 1 auto;min-width:min-content}:host(.cx-steps--compact.cx-steps--fill) .cx-step:not(:last-child){flex-grow:1}:host(.cx-steps--compact) .cx-step:last-child,:host(.cx-steps--compact) .cx-step__number,:host(.cx-steps--compact) .cx-step__name{flex:0 0 auto}:host(.cx-steps--compact) .cx-step__divider{flex:1 1 var(--icon-size-xl);min-width:var(--space-xs)}"] }]
        }], propDecorators: { viewport: [{
                type: ViewChild,
                args: ['viewport', { read: ElementRef }]
            }], measureList: [{
                type: ViewChild,
                args: ['measureList', { read: ElementRef }]
            }], steps: [{
                type: Input
            }], index: [{
                type: Input
            }], density: [{
                type: Input
            }], layout: [{
                type: Input
            }] } });
