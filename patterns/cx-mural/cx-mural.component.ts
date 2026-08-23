import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxSearchFieldComponent } from '../../primitives/inputs/cx-search-field';
import { CxSpinnerComponent } from '../../primitives/feedback/cx-spinner';

/** Credit for the picture on display, shown quietly on the pane. */
export interface CxMuralAttribution {
  /** Who made the picture, e.g. the photographer. */
  name: string;
  /** Where the name links, e.g. the author's profile. */
  href?: string;
  /** Where the picture comes from, e.g. the provider. */
  source?: string;
  /** Where the source name links. */
  sourceHref?: string;
}

/** One picture the mural can show. */
export interface CxMuralImage {
  id: string;
  label: string;
  src: string;
  /** Smaller preview for the picker thumbnail; `src` paints when absent. */
  thumb?: string;
  /** Credit rendered on the pane while this picture is on display. */
  attribution?: CxMuralAttribution;
}

/**
 * A decorative image pane that fills its container and lets the user swap the
 * picture in place: hovering reveals a settings control, which turns the pane
 * into a picker. The picker browses the offered `images` and always carries a
 * search field: the query streams out through `search`, and the consumer
 * answers with `results` (plus `searchLoading`/`searchError` while it works).
 * Apply commits the choice through `valueChange`; Cancel or Escape leaves it
 * untouched.
 *
 * The mural is ornament, not content: the picture renders with an empty alt
 * and the container owns the pane's width, height, and placement. `value` is
 * the whole picture, so a committed choice paints without living in `images`
 * or `results`; while it is null the pane stays an empty frame with the
 * settings control held visible, so a first pick is always reachable. A
 * picture that carries `attribution` credits it on the pane, revealed with the
 * settings control. When the displayed picture fails to load the pane returns
 * to the empty frame and emits `imageError`, so the consumer can swap in a
 * fallback.
 */
@Component({
  selector: 'cx-mural',
  imports: [
    CxButtonComponent,
    CxIconButtonComponent,
    CxSearchFieldComponent,
    CxSpinnerComponent,
  ],
  templateUrl: './cx-mural.component.html',
  styleUrl: './cx-mural.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMuralComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The offered catalog, browsed while the search field is empty. */
  @Input() images: readonly CxMuralImage[] = [];
  /** Pictures answering the current `search` query. */
  @Input() results: readonly CxMuralImage[] = [];
  /** True while the consumer is answering the current query. */
  @Input() searchLoading = false;
  /** Why the current query cannot be answered; '' while search works. */
  @Input() searchError = '';

  private valueState: CxMuralImage | null = null;
  /** The picture on display; null keeps the pane an empty frame. */
  @Input()
  public set value(value: CxMuralImage | null) {
    this.valueState = value;
    this.displayFailed.set(false);
  }
  public get value(): CxMuralImage | null {
    return this.valueState;
  }

  /** Emits the picked picture when the user applies a different choice. */
  @Output() readonly valueChange = new EventEmitter<CxMuralImage>();
  /** Emits the picker's debounced search query, including '' when cleared. */
  @Output() readonly search = new EventEmitter<string>();
  /** Emits when the displayed picture fails to load; the pane falls back to the empty frame. */
  @Output() readonly imageError = new EventEmitter<void>();

  protected readonly pickerOpen = signal(false);
  protected readonly pending = signal<CxMuralImage | null>(null);
  protected readonly query = signal('');
  private readonly displayFailed = signal(false);

  protected get displayImage(): CxMuralImage | null {
    return this.displayFailed() ? null : this.valueState;
  }

  protected onOpenPicker(): void {
    this.pending.set(this.valueState);
    this.query.set('');
    this.pickerOpen.set(true);
    // The chosen thumbnail (or the first, or the search field when nothing is
    // offered) takes focus so keyboard users land inside the picker they just
    // opened.
    this.afterRender(() => {
      const selected = this.host.nativeElement.querySelector<HTMLElement>(
        '.cx-mural__option[aria-pressed="true"]',
      );
      const first = this.host.nativeElement.querySelector<HTMLElement>('.cx-mural__option');
      const field = this.host.nativeElement.querySelector<HTMLElement>('.cx-mural__search input');
      (selected ?? first ?? field)?.focus();
    });
  }

  protected onQueryChange(query: string): void {
    if (query === this.query()) return;
    this.query.set(query);
    this.search.emit(query);
  }

  protected onPick(option: CxMuralImage): void {
    this.pending.set(option);
  }

  protected onApply(): void {
    const pending = this.pending();
    const changed = pending !== null && pending.id !== (this.valueState?.id ?? '');
    this.closePicker();
    if (changed) {
      this.valueChange.emit(pending);
    }
  }

  protected onCancel(): void {
    this.closePicker();
  }

  protected onEscape(event: Event): void {
    // A prevented Escape was claimed by the search field to clear itself; only
    // an unclaimed one closes the picker.
    if (event.defaultPrevented) return;
    this.onCancel();
  }

  protected onImageError(): void {
    this.displayFailed.set(true);
    this.imageError.emit();
  }

  private closePicker(): void {
    this.pickerOpen.set(false);
    // Focus returns to the control that opened the picker.
    this.afterRender(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>('.cx-mural__change button')
        ?.focus();
    });
  }

  private afterRender(work: () => void): void {
    afterNextRender(work, { injector: this.injector });
  }
}
