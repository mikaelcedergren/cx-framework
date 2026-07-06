import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';
import { CxTextFieldComponent } from '../cx-text-field';
import {
  type CxFieldValidation,
  type CxFieldSize,
} from '../shared/field.types';

const SEARCH_FIELD_DEBOUNCE_MS = 300;

@Component({
  selector: 'cx-search-field',
  imports: [CxTextFieldComponent],
  templateUrl: './cx-search-field.component.html',
  styleUrl: './cx-search-field.component.scss',
  host: { role: 'search' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSearchFieldComponent implements OnDestroy {
  private readonly valueState = signal('');
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  @Input() label = 'Search';
  @Input() ariaLabel: string | undefined;
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() size: CxFieldSize = 'default';
  @Input() validation: CxFieldValidation | null | undefined;

  @Input()
  public set value(value: string | undefined) {
    this.clearDebounceTimer();
    this.valueState.set(value ?? '');
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly value$ = this.valueState.asReadonly();

  protected onValueChange(value: string): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.valueState.set(value);
    this.scheduleValueChange();
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    this.clearSearch();
  }

  protected clearSearch(): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.valueState.set('');
    this.scheduleValueChange();
  }

  protected onFocusIn(): void {
    this.focusChange.emit(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    this.focusChange.emit(false);
  }

  public ngOnDestroy(): void {
    this.clearDebounceTimer();
  }

  private scheduleValueChange(): void {
    this.clearDebounceTimer();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      if (this.disabled || this.loading) {
        return;
      }
      this.valueChange.emit(this.valueState());
    }, SEARCH_FIELD_DEBOUNCE_MS);
  }

  private clearDebounceTimer(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }
}
