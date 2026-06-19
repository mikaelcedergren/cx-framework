import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxSnippetLanguage = 'ts' | 'html' | 'scss' | 'md' | 'json';
export type CxSnippet = {
  code: string;
  language: CxSnippetLanguage;
  label?: string;
};

const EMPTY_SNIPPET: CxSnippet = { code: '', language: 'ts' };
const SNIPPET_LABELS: Record<CxSnippetLanguage, string> = {
  ts: 'TypeScript',
  html: 'HTML',
  scss: 'SCSS',
  md: 'Markdown',
  json: 'JSON',
};

@Component({
  selector: 'cx-snippet',
  templateUrl: './cx-snippet.component.html',
  styleUrl: './cx-snippet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSnippetComponent {
  @Input() snippet: CxSnippet | null | undefined = EMPTY_SNIPPET;

  protected label(): string {
    const snippet = this.resolvedSnippet();
    return snippet.label?.trim() || SNIPPET_LABELS[snippet.language];
  }

  protected highlightedCode(): string {
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

  private resolvedSnippet(): CxSnippet {
    const snippet = this.snippet;
    if (!snippet?.code) {
      return EMPTY_SNIPPET;
    }
    return {
      code: snippet.code,
      language: this.normalizeLanguage(snippet.language),
      label: snippet.label,
    };
  }

  private normalizeLanguage(language: CxSnippetLanguage | null | undefined): CxSnippetLanguage {
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
