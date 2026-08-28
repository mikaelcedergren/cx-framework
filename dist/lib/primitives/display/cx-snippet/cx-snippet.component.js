import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
const EMPTY_SNIPPET = { code: '', language: 'ts' };
const SNIPPET_LABELS = {
    ts: 'TypeScript',
    html: 'HTML',
    scss: 'SCSS',
    md: 'Markdown',
    json: 'JSON',
};
export class CxSnippetComponent {
    snippet = EMPTY_SNIPPET;
    label() {
        const snippet = this.resolvedSnippet();
        return snippet.label?.trim() || SNIPPET_LABELS[snippet.language];
    }
    highlightedCode() {
        const snippet = this.resolvedSnippet();
        const escaped = this.escapeHtml(snippet.code);
        if (snippet.language === 'json') {
            return escaped
                .replace(/(&quot;[^&]+&quot;)(\s*:)/g, '<span class="cx-snippet__json-key">$1</span>$2')
                .replace(/:\s*(&quot;[^&]*&quot;)/g, ': <span class="cx-snippet__string">$1</span>')
                .replace(/:\s*(true|false|null|\d+(?:\.\d+)?)/g, ': <span class="cx-snippet__literal">$1</span>');
        }
        if (snippet.language === 'html') {
            return escaped
                .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="cx-snippet__tag">$2</span>')
                .replace(/\s([\w-]+)=/g, ' <span class="cx-snippet__attribute">$1</span>=')
                .replace(/=(&quot;[^&]*&quot;)/g, '=<span class="cx-snippet__string">$1</span>');
        }
        if (snippet.language === 'scss') {
            return escaped
                .replace(/([.#][\w-]+)(?=\s*\{)/g, '<span class="cx-snippet__tag">$1</span>')
                .replace(/([\w-]+)(\s*:)/g, '<span class="cx-snippet__attribute">$1</span>$2')
                .replace(/(var\(--[^)]+\)|#[\da-fA-F]{3,8})/g, '<span class="cx-snippet__string">$1</span>');
        }
        if (snippet.language === 'ts') {
            return escaped
                .replace(/\b(const|let|return|class|type|interface|import|export|from|if|else|new)\b/g, '<span class="cx-snippet__keyword">$1</span>')
                .replace(/(&quot;[^&]*&quot;|'[^']*')/g, '<span class="cx-snippet__string">$1</span>')
                .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="cx-snippet__type">$1</span>');
        }
        return escaped;
    }
    resolvedSnippet() {
        const snippet = this.snippet;
        if (!snippet?.code.trim()) {
            return EMPTY_SNIPPET;
        }
        return {
            code: snippet.code,
            language: this.normalizeLanguage(snippet.language),
            label: snippet.label,
        };
    }
    normalizeLanguage(language) {
        switch (language) {
            case 'html':
            case 'scss':
            case 'md':
            case 'json':
            case 'ts':
                return language;
            default:
                return 'ts';
        }
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSnippetComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSnippetComponent, isStandalone: true, selector: "cx-snippet", inputs: { snippet: "snippet" }, ngImport: i0, template: "  @if (label(); as snippetLabel) {\n    <div class=\"cx-snippet__label\">{{ snippetLabel }}</div>\n  }\n  <pre class=\"cx-snippet__pre\"><code [innerHTML]=\"highlightedCode()\"></code></pre>\n", styles: [":host{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--radius-sm);background:var(--opacity-darken);color:var(--ink)}.cx-snippet__pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.cx-snippet__pre code{font-family:var(--font-family-mono);font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-snippet__label{align-self:flex-end;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-snippet__keyword,.cx-snippet__tag{color:var(--pink)}.cx-snippet__type,.cx-snippet__json-key{color:var(--cyan-alt)}.cx-snippet__attribute{color:var(--green)}.cx-snippet__string{color:var(--orange)}.cx-snippet__literal{color:var(--purple)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSnippetComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-snippet', changeDetection: ChangeDetectionStrategy.OnPush, template: "  @if (label(); as snippetLabel) {\n    <div class=\"cx-snippet__label\">{{ snippetLabel }}</div>\n  }\n  <pre class=\"cx-snippet__pre\"><code [innerHTML]=\"highlightedCode()\"></code></pre>\n", styles: [":host{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--radius-sm);background:var(--opacity-darken);color:var(--ink)}.cx-snippet__pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.cx-snippet__pre code{font-family:var(--font-family-mono);font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-snippet__label{align-self:flex-end;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-snippet__keyword,.cx-snippet__tag{color:var(--pink)}.cx-snippet__type,.cx-snippet__json-key{color:var(--cyan-alt)}.cx-snippet__attribute{color:var(--green)}.cx-snippet__string{color:var(--orange)}.cx-snippet__literal{color:var(--purple)}"] }]
        }], propDecorators: { snippet: [{
                type: Input
            }] } });
