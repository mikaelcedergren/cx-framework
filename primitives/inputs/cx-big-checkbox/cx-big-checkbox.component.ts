import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

export type CxBigCheckboxValue = 'selected' | 'deselected' | 'indeterminate';
const BIG_CHECKBOX_VALUES: readonly CxBigCheckboxValue[] = ['selected', 'deselected', 'indeterminate'];

@Component({
  selector: 'cx-big-checkbox',
  templateUrl: './cx-big-checkbox.component.html',
  styleUrl: './cx-big-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBigCheckboxComponent {
  private readonly valueState = signal<CxBigCheckboxValue>('deselected');

  @Input() heading = '';
  @Input() text = '';
  @Input() custom = false;
  @Input() disabled = false;

  @Input()
  public set selected(selected: boolean) {
    if (selected) {
      this.valueState.set('selected');
    } else if (this.valueState() === 'selected') {
      this.valueState.set('deselected');
    }
  }

  @Input()
  public set value(value: CxBigCheckboxValue | undefined) {
    this.valueState.set(BIG_CHECKBOX_VALUES.includes(value as CxBigCheckboxValue) ? value! : 'deselected');
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();
  @Output() readonly valueChange = new EventEmitter<CxBigCheckboxValue>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected selected$(): boolean {
    return this.valueState() === 'selected';
  }

  protected indeterminate$(): boolean {
    return this.valueState() === 'indeterminate';
  }

  protected toggleChecked(): void {
    if (this.disabled) {
      return;
    }
    const nextValue: CxBigCheckboxValue = this.valueState() === 'selected' ? 'deselected' : 'selected';
    this.valueState.set(nextValue);
    this.selectedChange.emit(nextValue === 'selected');
    this.valueChange.emit(nextValue);
  }

  protected onFocus(focused: boolean): void {
    this.focusChange.emit(focused);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== ' ' && event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.toggleChecked();
  }
}
