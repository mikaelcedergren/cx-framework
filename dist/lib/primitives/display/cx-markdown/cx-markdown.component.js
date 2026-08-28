import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, ViewEncapsulation, computed, signal, } from '@angular/core';
import { marked } from 'marked';
import * as i0 from "@angular/core";
export class CxMarkdownComponent {
    markdownState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "markdownState" }] : /* istanbul ignore next */ []));
    linkClick = new EventEmitter();
    set markdown(value) {
        this.markdownState.set(value ?? '');
    }
    variant = 'default';
    align = 'center';
    renderedMarkdown$ = computed(() => {
        const raw = this.markdownState().trim();
        if (!raw)
            return '';
        return marked.parse(raw, { gfm: true });
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedMarkdown$" }] : /* istanbul ignore next */ []));
    hasVisibleContent$ = computed(() => {
        const rendered = this.renderedMarkdown$();
        const visibleMarkup = rendered
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<(?:script|style|template|head)\b[^>]*>[\s\S]*?<\/(?:script|style|template|head)>/gi, '');
        const hasImage = /<img\b[^>]*\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(visibleMarkup);
        const hasNonEmptySvg = Array.from(visibleMarkup.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi))
            .some(([, body]) => Boolean(body?.trim()));
        const hasMedia = Array.from(visibleMarkup.matchAll(/<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>/gi))
            .some(([, , attributes, body]) => /\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(attributes ?? '') ||
            /<source\b[^>]*\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(body ?? ''));
        const hasVisualElement = hasImage || hasNonEmptySvg || hasMedia;
        const visibleText = visibleMarkup
            .replace(/<[^>]+>/g, ' ')
            .replace(/&(?:nbsp|ensp|emsp|thinsp|zwnj|zwj);/gi, ' ')
            .trim();
        return visibleText.length > 0 || hasVisualElement === true;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasVisibleContent$" }] : /* istanbul ignore next */ []));
    onClick(event) {
        const target = event.target;
        if (!(target instanceof Element))
            return;
        const anchor = target.closest('a');
        if (!(anchor instanceof HTMLAnchorElement))
            return;
        const href = anchor.getAttribute('href')?.trim();
        if (!href)
            return;
        this.linkClick.emit({ href, event });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMarkdownComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxMarkdownComponent, isStandalone: true, selector: "cx-markdown", inputs: { markdown: "markdown", variant: "variant", align: "align" }, outputs: { linkClick: "linkClick" }, host: { listeners: { "click": "onClick($event)" } }, ngImport: i0, template: "@if (hasVisibleContent$()) {\n  <div\n    [class.cx-markdown]=\"variant !== 'article'\"\n    [class.cx-article]=\"variant === 'article'\"\n    [class.cx-article--start]=\"variant === 'article' && align === 'start'\"\n    [innerHTML]=\"renderedMarkdown$()\"\n  ></div>\n}\n", styles: [":host{display:block;min-width:0}.cx-markdown{color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-markdown>:first-child{margin-top:0}.cx-markdown>:last-child{margin-bottom:0}.cx-markdown h1,.cx-markdown h2,.cx-markdown h3,.cx-markdown h4{margin:var(--space-lg) 0 var(--space-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-markdown h1{font-size:var(--font-size-title-1)}.cx-markdown h2{font-size:var(--font-size-title-2)}.cx-markdown h3{font-size:var(--font-size-title-3)}.cx-markdown h4{font-size:var(--font-size-body)}.cx-markdown p{margin:0 0 var(--space-md)}.cx-markdown ul,.cx-markdown ol{margin:0 0 var(--space-md);padding-left:var(--space-lg)}.cx-markdown li{margin-bottom:var(--space-xs)}.cx-markdown li::marker{color:var(--primary)}.cx-markdown code{padding:1px 4px;border-radius:var(--radius-xs);background:var(--opacity-low);font-family:var(--font-family-mono);font-size:.95em}.cx-markdown pre{margin:0 0 var(--space-md);padding:var(--space-md);border-radius:var(--radius-sm);background:var(--opacity-low);overflow-x:auto}.cx-markdown pre code{padding:0;background:rgba(0,0,0,0)}.cx-markdown blockquote{margin:0 0 var(--space-md);padding-left:var(--space-md);border-left:2px solid var(--opacity-mid);color:var(--opacity-high)}.cx-markdown a,.cx-markdown a:visited,.cx-markdown a:hover,.cx-markdown a:active{color:var(--link);text-decoration:underline;text-underline-offset:2px}.cx-markdown hr{margin:var(--space-lg) 0;border:0;border-top:var(--line-discreet)}.cx-markdown table{width:100%;margin:0 0 var(--space-md);border-collapse:collapse;font-size:var(--font-size-body-sm)}.cx-markdown th,.cx-markdown td{padding:var(--space-sm);border-bottom:var(--line-discreet);text-align:left;vertical-align:top}.cx-markdown th{color:var(--ink);font-weight:var(--font-weight-bold)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMarkdownComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-markdown', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (hasVisibleContent$()) {\n  <div\n    [class.cx-markdown]=\"variant !== 'article'\"\n    [class.cx-article]=\"variant === 'article'\"\n    [class.cx-article--start]=\"variant === 'article' && align === 'start'\"\n    [innerHTML]=\"renderedMarkdown$()\"\n  ></div>\n}\n", styles: [":host{display:block;min-width:0}.cx-markdown{color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-markdown>:first-child{margin-top:0}.cx-markdown>:last-child{margin-bottom:0}.cx-markdown h1,.cx-markdown h2,.cx-markdown h3,.cx-markdown h4{margin:var(--space-lg) 0 var(--space-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-markdown h1{font-size:var(--font-size-title-1)}.cx-markdown h2{font-size:var(--font-size-title-2)}.cx-markdown h3{font-size:var(--font-size-title-3)}.cx-markdown h4{font-size:var(--font-size-body)}.cx-markdown p{margin:0 0 var(--space-md)}.cx-markdown ul,.cx-markdown ol{margin:0 0 var(--space-md);padding-left:var(--space-lg)}.cx-markdown li{margin-bottom:var(--space-xs)}.cx-markdown li::marker{color:var(--primary)}.cx-markdown code{padding:1px 4px;border-radius:var(--radius-xs);background:var(--opacity-low);font-family:var(--font-family-mono);font-size:.95em}.cx-markdown pre{margin:0 0 var(--space-md);padding:var(--space-md);border-radius:var(--radius-sm);background:var(--opacity-low);overflow-x:auto}.cx-markdown pre code{padding:0;background:rgba(0,0,0,0)}.cx-markdown blockquote{margin:0 0 var(--space-md);padding-left:var(--space-md);border-left:2px solid var(--opacity-mid);color:var(--opacity-high)}.cx-markdown a,.cx-markdown a:visited,.cx-markdown a:hover,.cx-markdown a:active{color:var(--link);text-decoration:underline;text-underline-offset:2px}.cx-markdown hr{margin:var(--space-lg) 0;border:0;border-top:var(--line-discreet)}.cx-markdown table{width:100%;margin:0 0 var(--space-md);border-collapse:collapse;font-size:var(--font-size-body-sm)}.cx-markdown th,.cx-markdown td{padding:var(--space-sm);border-bottom:var(--line-discreet);text-align:left;vertical-align:top}.cx-markdown th{color:var(--ink);font-weight:var(--font-weight-bold)}"] }]
        }], propDecorators: { linkClick: [{
                type: Output
            }], markdown: [{
                type: Input
            }], variant: [{
                type: Input
            }], align: [{
                type: Input
            }], onClick: [{
                type: HostListener,
                args: ['click', ['$event']]
            }] } });
