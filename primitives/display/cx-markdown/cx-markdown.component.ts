import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { marked } from 'marked';

export interface CxMarkdownLinkClick {
  href: string;
  event: MouseEvent;
}

/**
 * `default` — compact UI markdown (notes, inline copy).
 * `editorial` — the shared article and public-page reading treatment. Use when
 * reading is the surface's primary task, never for ordinary product UI.
 */
export type CxMarkdownVariant = 'default' | 'editorial';

@Component({
  selector: 'cx-markdown',
  templateUrl: './cx-markdown.component.html',
  styleUrl: './cx-markdown.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMarkdownComponent {
  private readonly markdownState = signal('');

  @Output() readonly linkClick = new EventEmitter<CxMarkdownLinkClick>();

  @Input()
  public set markdown(value: string | undefined) {
    this.markdownState.set(value ?? '');
  }

  @Input() variant: CxMarkdownVariant = 'default';

  protected readonly renderedMarkdown$ = computed(() => {
    const raw = this.markdownState().trim();
    if (!raw) return '';
    return marked.parse(raw, { gfm: true }) as string;
  });
  protected readonly hasVisibleContent$ = computed(() => {
    const rendered = this.renderedMarkdown$();
    const visibleMarkup = rendered
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(?:script|style|template|head)\b[^>]*>[\s\S]*?<\/(?:script|style|template|head)>/gi, '');
    const hasImage = /<img\b[^>]*\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(visibleMarkup);
    const hasNonEmptySvg = Array.from(visibleMarkup.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi))
      .some(([, body]) => Boolean(body?.trim()));
    const hasMedia = Array.from(visibleMarkup.matchAll(/<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>/gi))
      .some(([, , attributes, body]) =>
        /\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(attributes ?? '') ||
        /<source\b[^>]*\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(body ?? ''),
      );
    const hasVisualElement = hasImage || hasNonEmptySvg || hasMedia;
    const visibleText = visibleMarkup
      .replace(/<[^>]+>/g, ' ')
      .replace(/&(?:nbsp|ensp|emsp|thinsp|zwnj|zwj);/gi, ' ')
      .trim();
    return visibleText.length > 0 || hasVisualElement === true;
  });

  @HostListener('click', ['$event'])
  protected onClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a');
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const href = anchor.getAttribute('href')?.trim();
    if (!href) return;

    this.linkClick.emit({ href, event });
  }
}
