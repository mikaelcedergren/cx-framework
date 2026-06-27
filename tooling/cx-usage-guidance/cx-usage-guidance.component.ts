import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';

@Component({
  selector: 'cx-usage-guidance',
  templateUrl: './cx-usage-guidance.component.html',
  styleUrl: './cx-usage-guidance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxUsageGuidanceComponent {
  private readonly textState = signal('');
  protected readonly draft$ = signal('');
  protected readonly editing$ = signal(false);

  @ViewChild('editor') private editor?: ElementRef<HTMLTextAreaElement>;

  @Input() componentName = '';
  @Input() saving = false;
  @Input() error = '';
  /** When false, guidance is read-only — no edit affordance, no editing. */
  @Input() editable = true;

  @Input()
  public set text(value: string | null | undefined) {
    const next = value ?? '';
    this.textState.set(next);
    if (!this.editing$()) {
      this.draft$.set(next);
    }
  }

  @Output() readonly textChange = new EventEmitter<string>();

  protected readonly displayText$ = computed(() => this.textState().trim());
  protected readonly hasText$ = computed(() => this.displayText$().length > 0);
  protected readonly editLabel$ = computed(() => {
    const name = this.componentName || 'component';
    return `Edit usage guidance for ${name}`;
  });

  protected startEditing(): void {
    if (!this.editable) return;
    this.draft$.set(this.textState());
    this.editing$.set(true);
    requestAnimationFrame(() => this.editor?.nativeElement.focus());
  }

  protected onDraftInput(event: Event): void {
    this.draft$.set((event.target as HTMLTextAreaElement).value);
  }

  protected onEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditing();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.commitEditing();
    }
  }

  protected commitEditing(): void {
    if (!this.editing$()) {
      return;
    }

    const next = this.draft$().trim();
    const previous = this.textState().trim();
    this.editing$.set(false);

    if (next === previous) {
      this.draft$.set(this.textState());
      return;
    }

    this.textState.set(next);
    this.draft$.set(next);
    this.textChange.emit(next);
  }

  protected cancelEditing(): void {
    this.draft$.set(this.textState());
    this.editing$.set(false);
  }
}
