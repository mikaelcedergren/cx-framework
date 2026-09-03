import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import * as i0 from "@angular/core";
export class CxCodeBlockComponent {
    copyResetTimer;
    copyState = signal('idle', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "copyState" }] : /* istanbul ignore next */ []));
    code = '';
    heading;
    annotations = [];
    copyable = false;
    wrap = true;
    ngOnDestroy() {
        if (this.copyResetTimer) {
            clearTimeout(this.copyResetTimer);
        }
    }
    hasHeading() {
        return !!this.heading?.trim();
    }
    lines() {
        return this.code.split(/\r?\n/).map((text, index) => {
            const number = index + 1;
            const lineAnnotations = this.annotations.filter((annotation) => annotation.kind === 'line' && annotation.line === number);
            const rangeAnnotations = this.annotations.filter((annotation) => annotation.kind === 'range' && annotation.line === number);
            const mood = lineAnnotations[0]?.mood;
            return {
                number,
                mood,
                message: lineAnnotations.find(annotation => annotation.mood === mood)?.message,
                segments: this.segments(text, rangeAnnotations),
            };
        });
    }
    copyIcon() {
        const state = this.copyState();
        if (state === 'copied')
            return 'check';
        if (state === 'failed')
            return 'error';
        return 'copy';
    }
    copyAriaLabel() {
        const state = this.copyState();
        if (state === 'copied')
            return 'Copied';
        if (state === 'failed')
            return 'Copy failed';
        return 'Copy code';
    }
    copyDisabled() {
        return !this.copyable || !this.code.trim();
    }
    async copy() {
        if (this.copyDisabled())
            return;
        try {
            await navigator.clipboard.writeText(this.code);
            this.flashCopyState('copied');
        }
        catch {
            this.flashCopyState('failed');
        }
    }
    segments(text, annotations) {
        const sorted = [...annotations]
            .map(annotation => ({
            ...annotation,
            startIndex: Math.max(0, Math.min(text.length, annotation.startIndex)),
            endIndex: Math.max(0, Math.min(text.length, annotation.endIndex)),
        }))
            .filter(annotation => annotation.endIndex > annotation.startIndex)
            .sort((a, b) => a.startIndex - b.startIndex);
        const segments = [];
        let cursor = 0;
        for (const annotation of sorted) {
            if (annotation.startIndex > cursor) {
                segments.push({ text: text.slice(cursor, annotation.startIndex), startIndex: cursor });
            }
            segments.push({
                text: text.slice(annotation.startIndex, annotation.endIndex),
                startIndex: annotation.startIndex,
                mood: annotation.mood,
                message: annotation.message,
            });
            cursor = annotation.endIndex;
        }
        if (cursor < text.length) {
            segments.push({ text: text.slice(cursor), startIndex: cursor });
        }
        return segments.length ? segments : [{ text: text || ' ', startIndex: 0 }];
    }
    flashCopyState(copyState) {
        this.copyState.set(copyState);
        if (this.copyResetTimer) {
            clearTimeout(this.copyResetTimer);
        }
        this.copyResetTimer = setTimeout(() => this.copyState.set('idle'), 1500);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCodeBlockComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxCodeBlockComponent, isStandalone: true, selector: "cx-code-block", inputs: { code: "code", heading: "heading", annotations: "annotations", copyable: "copyable", wrap: "wrap" }, host: { properties: { "class.cx-code-block--has-heading": "hasHeading()", "class.cx-code-block--copyable": "copyable", "class.cx-code-block--no-wrap": "!wrap", "class.cx-code-block--copied": "copyState() === \"copied\"", "class.cx-code-block--failed": "copyState() === \"failed\"" } }, ngImport: i0, template: "<div class=\"cx-code-block__surface\">\n  @if (hasHeading()) {\n    <div class=\"cx-code-block__heading\">{{ heading!.trim() }}</div>\n  }\n\n  <div class=\"cx-code-block__box\">\n    <pre\n      class=\"cx-code-block__pre\"\n    ><code class=\"cx-code-block__code\">@for (line of lines(); track line.number) {<span class=\"cx-code-block__line\" [class.cx-code-block__line--default]=\"line.mood === 'default'\" [class.cx-code-block__line--info]=\"line.mood === 'info'\" [class.cx-code-block__line--success]=\"line.mood === 'success'\" [class.cx-code-block__line--warning]=\"line.mood === 'warning'\" [class.cx-code-block__line--danger]=\"line.mood === 'danger'\" [attr.aria-label]=\"line.message || null\">@for (segment of line.segments; track segment.startIndex) {@if (segment.mood) {<mark class=\"cx-code-block__segment\" [class.cx-code-block__segment--default]=\"segment.mood === 'default'\" [class.cx-code-block__segment--info]=\"segment.mood === 'info'\" [class.cx-code-block__segment--success]=\"segment.mood === 'success'\" [class.cx-code-block__segment--warning]=\"segment.mood === 'warning'\" [class.cx-code-block__segment--danger]=\"segment.mood === 'danger'\" [attr.aria-label]=\"segment.message || null\">{{ segment.text }}</mark>} @else {<span class=\"cx-code-block__segment\">{{ segment.text }}</span>}}</span>}</code></pre>\n\n    @if (copyable) {\n      <cx-icon-button\n        class=\"cx-code-block__copy\"\n        size=\"small\"\n        [icon]=\"copyIcon()\"\n        [ariaLabel]=\"copyAriaLabel()\"\n        [disabled]=\"copyDisabled()\"\n        (pressed)=\"copy()\"\n      />\n    }\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;color:var(--ink)}.cx-code-block__surface{display:flex;flex-direction:column;gap:var(--space-xs);width:100%}.cx-code-block__heading{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-code-block__copy{grid-area:content;justify-self:end;align-self:start;opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease}:host(:hover) .cx-code-block__copy,:host(:focus-within) .cx-code-block__copy{opacity:1;pointer-events:auto}.cx-code-block__box{display:grid;grid-template-areas:\"content\";overflow:hidden;padding:var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:var(--opacity-low)}.cx-code-block__pre{grid-area:content;min-width:0;margin:0}.cx-code-block__code{display:block;color:var(--ink);font-family:var(--font-family-mono);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);overflow-wrap:anywhere;tab-size:2;white-space:pre-wrap}:host(.cx-code-block--copyable) .cx-code-block__code{padding-inline-end:calc(var(--controller-size-small) + var(--space-sm))}:host(.cx-code-block--no-wrap) .cx-code-block__box{overflow-x:auto}:host(.cx-code-block--no-wrap) .cx-code-block__code{overflow-wrap:normal;white-space:pre}.cx-code-block__line{display:block;min-height:calc(var(--font-size-body)*var(--line-height-body));border-radius:var(--radius-xs)}.cx-code-block__line--default,.cx-code-block__segment--default{background:var(--opacity-mid)}.cx-code-block__line--info,.cx-code-block__segment--info{color:var(--info);background:var(--info-opacity)}.cx-code-block__line--success,.cx-code-block__segment--success{color:var(--success);background:var(--success-opacity)}.cx-code-block__line--warning,.cx-code-block__segment--warning{color:var(--warning);background:var(--warning-opacity)}.cx-code-block__line--danger,.cx-code-block__segment--danger{color:var(--danger);background:var(--danger-opacity)}.cx-code-block__segment{border-radius:var(--radius-xs)}mark.cx-code-block__segment{padding:0 var(--space-2xs)}"], dependencies: [{ kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxCodeBlockComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-code-block', imports: [CxIconButtonComponent], host: {
                        '[class.cx-code-block--has-heading]': 'hasHeading()',
                        '[class.cx-code-block--copyable]': 'copyable',
                        '[class.cx-code-block--no-wrap]': '!wrap',
                        '[class.cx-code-block--copied]': 'copyState() === "copied"',
                        '[class.cx-code-block--failed]': 'copyState() === "failed"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-code-block__surface\">\n  @if (hasHeading()) {\n    <div class=\"cx-code-block__heading\">{{ heading!.trim() }}</div>\n  }\n\n  <div class=\"cx-code-block__box\">\n    <pre\n      class=\"cx-code-block__pre\"\n    ><code class=\"cx-code-block__code\">@for (line of lines(); track line.number) {<span class=\"cx-code-block__line\" [class.cx-code-block__line--default]=\"line.mood === 'default'\" [class.cx-code-block__line--info]=\"line.mood === 'info'\" [class.cx-code-block__line--success]=\"line.mood === 'success'\" [class.cx-code-block__line--warning]=\"line.mood === 'warning'\" [class.cx-code-block__line--danger]=\"line.mood === 'danger'\" [attr.aria-label]=\"line.message || null\">@for (segment of line.segments; track segment.startIndex) {@if (segment.mood) {<mark class=\"cx-code-block__segment\" [class.cx-code-block__segment--default]=\"segment.mood === 'default'\" [class.cx-code-block__segment--info]=\"segment.mood === 'info'\" [class.cx-code-block__segment--success]=\"segment.mood === 'success'\" [class.cx-code-block__segment--warning]=\"segment.mood === 'warning'\" [class.cx-code-block__segment--danger]=\"segment.mood === 'danger'\" [attr.aria-label]=\"segment.message || null\">{{ segment.text }}</mark>} @else {<span class=\"cx-code-block__segment\">{{ segment.text }}</span>}}</span>}</code></pre>\n\n    @if (copyable) {\n      <cx-icon-button\n        class=\"cx-code-block__copy\"\n        size=\"small\"\n        [icon]=\"copyIcon()\"\n        [ariaLabel]=\"copyAriaLabel()\"\n        [disabled]=\"copyDisabled()\"\n        (pressed)=\"copy()\"\n      />\n    }\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;color:var(--ink)}.cx-code-block__surface{display:flex;flex-direction:column;gap:var(--space-xs);width:100%}.cx-code-block__heading{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-code-block__copy{grid-area:content;justify-self:end;align-self:start;opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease}:host(:hover) .cx-code-block__copy,:host(:focus-within) .cx-code-block__copy{opacity:1;pointer-events:auto}.cx-code-block__box{display:grid;grid-template-areas:\"content\";overflow:hidden;padding:var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:var(--opacity-low)}.cx-code-block__pre{grid-area:content;min-width:0;margin:0}.cx-code-block__code{display:block;color:var(--ink);font-family:var(--font-family-mono);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);overflow-wrap:anywhere;tab-size:2;white-space:pre-wrap}:host(.cx-code-block--copyable) .cx-code-block__code{padding-inline-end:calc(var(--controller-size-small) + var(--space-sm))}:host(.cx-code-block--no-wrap) .cx-code-block__box{overflow-x:auto}:host(.cx-code-block--no-wrap) .cx-code-block__code{overflow-wrap:normal;white-space:pre}.cx-code-block__line{display:block;min-height:calc(var(--font-size-body)*var(--line-height-body));border-radius:var(--radius-xs)}.cx-code-block__line--default,.cx-code-block__segment--default{background:var(--opacity-mid)}.cx-code-block__line--info,.cx-code-block__segment--info{color:var(--info);background:var(--info-opacity)}.cx-code-block__line--success,.cx-code-block__segment--success{color:var(--success);background:var(--success-opacity)}.cx-code-block__line--warning,.cx-code-block__segment--warning{color:var(--warning);background:var(--warning-opacity)}.cx-code-block__line--danger,.cx-code-block__segment--danger{color:var(--danger);background:var(--danger-opacity)}.cx-code-block__segment{border-radius:var(--radius-xs)}mark.cx-code-block__segment{padding:0 var(--space-2xs)}"] }]
        }], propDecorators: { code: [{
                type: Input
            }], heading: [{
                type: Input
            }], annotations: [{
                type: Input
            }], copyable: [{
                type: Input
            }], wrap: [{
                type: Input
            }] } });
