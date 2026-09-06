import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EnvironmentInjector,
  Injector,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { createListItemViews } from './markdown-editor-list-item-view';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

// The ProseMirror engine is heavy and only needed once an editor actually
// renders, so it stays behind a dynamic import and never lands in the eager
// bundle of apps that merely import the framework.
type MarkdownEditorEngine = typeof import('./markdown-editor-state') & {
  EditorView: typeof EditorView;
};

async function loadEngine(): Promise<MarkdownEditorEngine> {
  const [state, view] = await Promise.all([
    import('./markdown-editor-state'),
    import('prosemirror-view'),
  ]);
  return { ...state, EditorView: view.EditorView };
}

/**
 * `default` — compact UI markdown scale (notes, inline surfaces).
 * `document` — editorial reading scale shared with `.cx-article`.
 */
export type CxMarkdownEditorPresentation = 'default' | 'document';
export type CxMarkdownEditorLayout = 'default' | 'fill';

/**
 * Inline rich markdown editor. The value is always a markdown string, but the
 * user sees and edits the formatted result: typing markdown syntax (`### `,
 * `**bold**`, `- `, …) formats in place, and Backspace right after a
 * conversion restores the literal text.
 */
@Component({
  selector: 'cx-markdown-editor',
  templateUrl: './cx-markdown-editor.component.html',
  styleUrl: './cx-markdown-editor.component.scss',
  host: {
    '[class.cx-markdown-editor-host--document]': 'presentation === "document"',
    '[class.cx-markdown-editor-host--fill]': 'layout === "fill"',
    '[class.cx-markdown-editor-host--disabled]': 'disabledState()',
  },
  // ProseMirror owns the contenteditable DOM, which Angular's emulated
  // encapsulation never tags. All selectors stay under cx-markdown-editor.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMarkdownEditorComponent implements AfterViewInit, OnDestroy {
  private readonly listItemViews = createListItemViews(
    inject(EnvironmentInjector),
    inject(Injector),
  );
  private engine: MarkdownEditorEngine | undefined;
  private view: EditorView | undefined;
  private destroyed = false;
  private lastKnownValue = '';
  private ariaLabelState: string | undefined;
  private readonly changeDetector = inject(ChangeDetectorRef);

  protected readonly emptyState = signal(true);
  protected readonly disabledState = signal(false);

  @ViewChild('content', { static: true })
  private readonly contentRef!: ElementRef<HTMLElement>;

  @Input() placeholder: string | undefined;
  @Input() layout: CxMarkdownEditorLayout = 'default';

  private presentationState: CxMarkdownEditorPresentation = 'default';

  @Input()
  public set presentation(value: CxMarkdownEditorPresentation) {
    this.presentationState = value === 'document' ? 'document' : 'default';
    this.view?.setProps({ attributes: this.editorAttributes() });
  }

  public get presentation(): CxMarkdownEditorPresentation {
    return this.presentationState;
  }

  @Input()
  public set ariaLabel(value: string | undefined) {
    this.ariaLabelState = value;
    this.view?.setProps({ attributes: this.editorAttributes() });
  }

  @Input()
  public set disabled(value: boolean) {
    this.disabledState.set(!!value);
    this.view?.setProps({});
    this.listItemViews.refresh();
  }

  @Input()
  public set value(value: string | undefined) {
    const next = value ?? '';
    if (next === this.lastKnownValue) {
      return;
    }
    this.lastKnownValue = next;
    if (this.view && this.engine) {
      this.applyState(this.engine.createMarkdownEditorState(next));
    }
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly blurred = new EventEmitter<void>();

  public ngAfterViewInit(): void {
    void this.initializeEditor();
  }

  private async initializeEditor(): Promise<void> {
    const engine = await loadEngine();
    if (this.destroyed) {
      return;
    }
    this.engine = engine;
    const state = engine.createMarkdownEditorState(this.lastKnownValue);
    this.view = new engine.EditorView(this.contentRef.nativeElement, {
      state,
      nodeViews: this.listItemViews.nodeViews,
      editable: () => !this.disabledState(),
      attributes: this.editorAttributes(),
      dispatchTransaction: transaction => this.onTransaction(transaction),
      handleDOMEvents: {
        focus: () => {
          this.focusChange.emit(true);
          return false;
        },
        blur: () => {
          this.focusChange.emit(false);
          this.blurred.emit();
          return false;
        },
      },
    });
    this.emptyState.set(engine.isDocEmpty(state.doc));
    // The engine resolves outside Angular's synchronous init pass; nudge the
    // OnPush host so the placeholder state renders.
    this.changeDetector.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
    this.view?.destroy();
    this.view = undefined;
  }

  public focus(): void {
    this.view?.focus();
  }

  // Document mode edits inside the real `.cx-article` contract — the display
  // serif headings and reading scale come from the global article styles, not
  // a local imitation. `--start` keeps the article on the editor's own edge so
  // the placeholder overlay lines up with the caret.
  private editorAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-label': this.ariaLabelState ?? 'Editor',
    };
    if (this.presentationState === 'document') {
      attributes['class'] = 'cx-article cx-article--start';
    }
    return attributes;
  }

  private onTransaction(
    transaction: Parameters<NonNullable<EditorView['props']['dispatchTransaction']>>[0],
  ): void {
    const view = this.view;
    const engine = this.engine;
    if (!view || !engine) {
      return;
    }
    const state = view.state.apply(transaction);
    this.applyState(state);
    if (transaction.docChanged) {
      const markdown = engine.serializeMarkdown(state.doc);
      if (markdown !== this.lastKnownValue) {
        this.lastKnownValue = markdown;
        this.valueChange.emit(markdown);
      }
    }
  }

  private applyState(state: EditorState): void {
    this.view?.updateState(state);
    if (this.engine) {
      this.emptyState.set(this.engine.isDocEmpty(state.doc));
    }
  }

  protected showPlaceholder(): boolean {
    return this.emptyState() && !!this.placeholder?.trim();
  }
}
