import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CxTextFieldComponent } from '../cx-text-field';
import {
  type CxFieldSize,
  type CxFieldUpdateOn,
  type CxValidationMessage,
} from '../shared/field.types';

@Component({
  selector: 'cx-search-field',
  imports: [CxTextFieldComponent],
  templateUrl: './cx-search-field.component.html',
  styleUrl: './cx-search-field.component.scss',
  host: { role: 'search' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSearchFieldComponent {
  private readonly valueState = signal('');

  @Input() label = 'Search';
  @Input() placeholder = '';
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() updateOn: CxFieldUpdateOn = 'blur';
  @Input() debounceMs = 300;
  @Input() size: CxFieldSize = 'default';
  @Input() validationMessages: ReadonlyArray<CxValidationMessage> | null | undefined;

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value ?? '');
  }

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly value$ = this.valueState.asReadonly();

  protected onValueChange(value: string): void {
    if (this.disabled || this.readOnly || this.loading) {
      return;
    }
    this.valueState.set(value);
    this.valueChange.emit(value);
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    this.clearSearch();
  }

  protected clearSearch(): void {
    if (this.disabled || this.readOnly || this.loading) {
      return;
    }
    this.valueState.set('');
    this.valueChange.emit('');
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
}
