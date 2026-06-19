import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxToggleChipComponent, type CxToggleChipSize } from '../cx-toggle-chip';

export type CxToggleChipGroupSelection = 'multiple' | 'single';

export interface CxToggleChipGroupOption {
  id: string;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
}

@Component({
  selector: 'cx-toggle-chip-group',
  imports: [CxToggleChipComponent],
  templateUrl: './cx-toggle-chip-group.component.html',
  styleUrl: './cx-toggle-chip-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxToggleChipGroupComponent {
  private readonly selectedValuesState = signal<string[]>([]);

  @Input() availableValues: CxToggleChipGroupOption[] = [];
  @Input() selection: CxToggleChipGroupSelection = 'multiple';
  @Input() size: CxToggleChipSize = 'default';
  @Input() disabled = false;
  @Input() allowEmpty = false;

  @Input()
  public set selectedValues(values: string[] | undefined) {
    this.selectedValuesState.set(this.normalize(values ?? []));
  }

  @Output() readonly selectedValuesChange = new EventEmitter<string[]>();

  protected readonly selectedValues$ = this.selectedValuesState.asReadonly();
  protected readonly role$ = computed(() => (this.selection === 'single' ? 'radiogroup' : 'group'));

  protected isSelected(id: string): boolean {
    return this.selectedValuesState().includes(id);
  }

  protected toggle(option: CxToggleChipGroupOption): void {
    if (this.disabled || option.disabled) {
      return;
    }

    const selected = this.isSelected(option.id);
    let next: string[];
    if (this.selection === 'single') {
      if (selected && !this.allowEmpty) {
        return;
      }
      next = selected ? [] : [option.id];
    } else {
      next = selected
        ? this.selectedValuesState().filter(value => value !== option.id)
        : [...this.selectedValuesState(), option.id];
    }

    this.selectedValuesState.set(this.normalize(next));
    this.selectedValuesChange.emit(this.selectedValuesState());
  }

  private normalize(values: string[]): string[] {
    const ids = this.availableValues.map(option => option.id);
    const known = values.filter((value, index) =>
      values.indexOf(value) === index && (ids.length === 0 || ids.includes(value)),
    );
    return this.selection === 'single' ? known.slice(0, 1) : known;
  }
}
