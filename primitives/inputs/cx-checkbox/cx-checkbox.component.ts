import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

export type CxCheckboxValue = 'deselected' | 'selected' | 'indeterminate';

const CHECKBOX_VALUES: readonly CxCheckboxValue[] = ['deselected', 'selected', 'indeterminate'];

@Component({
  selector: 'cx-checkbox',
  templateUrl: './cx-checkbox.component.html',
  styleUrl: './cx-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCheckboxComponent {
  private static nextId = 0;
  private readonly valueState = signal<CxCheckboxValue>('deselected');

  protected readonly hintId = `cx-checkbox-${++CxCheckboxComponent.nextId}-hint`;

  @Input() text = '';
  @Input() hint: string | undefined;
  @Input() disabled = false;
  @Input() custom = false;

  @Input()
  public set selected(value: boolean) {
    if (value) {
      this.valueState.set('selected');
    } else if (this.valueState() === 'selected') {
      this.valueState.set('deselected');
    }
  }

  @Input()
  public set value(value: CxCheckboxValue | null | undefined) {
    this.valueState.set(CHECKBOX_VALUES.includes(value as CxCheckboxValue) ? value! : 'deselected');
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();
  @Output() readonly valueChange = new EventEmitter<CxCheckboxValue>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly selected$ = () => this.valueState() === 'selected';
  protected readonly indeterminate$ = () => this.valueState() === 'indeterminate';
  protected readonly visibleText$ = () => this.text.trim();
  protected readonly visibleHint$ = () => this.hint?.trim();
  protected readonly hasContent$ = () => this.visibleText$().length > 0;

  protected toggleValue(event?: Event): void {
    if (this.disabled) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();

    const nextValue: CxCheckboxValue = this.selected$() ? 'deselected' : 'selected';
    this.valueState.set(nextValue);
    this.selectedChange.emit(nextValue === 'selected');
    this.valueChange.emit(nextValue);
  }

  protected onFocus(focused: boolean): void {
    this.focusChange.emit(focused);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== ' ') {
      return;
    }
    this.toggleValue(event);
  }
}
