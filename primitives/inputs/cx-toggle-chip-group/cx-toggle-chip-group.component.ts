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
  private readonly availableValuesState = signal<readonly CxToggleChipGroupOption[]>([]);
  private readonly selectedValuesState = signal<string[]>([]);

  @Input()
  public set availableValues(values: readonly CxToggleChipGroupOption[] | undefined) {
    this.availableValuesState.set(this.normalizeOptions(values));
    this.selectedValuesState.set(this.normalize(this.selectedValuesState()));
  }

  public get availableValues(): readonly CxToggleChipGroupOption[] {
    return this.availableValuesState();
  }

  @Input() selection: CxToggleChipGroupSelection = 'multiple';
  @Input() size: CxToggleChipSize = 'default';
  @Input() disabled = false;
  @Input() allowEmpty = false;

  @Input()
  public set selectedValues(values: string[] | undefined) {
    this.selectedValuesState.set(this.normalize(values ?? []));
  }

  @Output() readonly selectedValuesChange = new EventEmitter<string[]>();

  protected readonly availableValues$ = this.availableValuesState.asReadonly();
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
    const ids = this.availableValuesState().map(option => option.id);
    const normalizedValues = values.map(value => value.trim()).filter(Boolean);
    const known = normalizedValues.filter((value, index) =>
      normalizedValues.indexOf(value) === index && (ids.length === 0 || ids.includes(value)),
    );
    return this.selection === 'single' ? known.slice(0, 1) : known;
  }

  private normalizeOptions(
    values: readonly CxToggleChipGroupOption[] | undefined,
  ): readonly CxToggleChipGroupOption[] {
    const ids = new Set<string>();
    return (values ?? []).map((option, index) => {
      const id = option?.id?.trim() ?? '';
      if (!id) {
        throw new Error(`[cx-toggle-chip-group] option at index ${index} requires a non-empty id.`);
      }
      if (ids.has(id)) {
        throw new Error(`[cx-toggle-chip-group] option id "${id}" must be unique.`);
      }
      ids.add(id);

      const label = option?.label?.trim() ?? '';
      return {
        ...option,
        id,
        label,
        ariaLabel: option.ariaLabel?.trim() || undefined,
      };
    });
  }
}
