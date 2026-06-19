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

  @Input()
  public set text(value: string | undefined) {
    this.markdownState.set(value ?? '');
  }

  @Input() assetBasePath: string | undefined;

  protected readonly renderedMarkdown$ = computed(() => {
    const raw = this.markdownState().trim();
    if (!raw) return '';
    return marked.parse(raw, { gfm: true }) as string;
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
