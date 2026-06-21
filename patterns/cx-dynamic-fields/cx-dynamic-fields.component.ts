import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';

export type CxDynamicFieldOption = {
  id: string;
  label: string;
  placeholder?: string;
  masked?: boolean;
};

export type CxDynamicFieldValue = {
  id: string;
  value: string;
};

type CxResolvedDynamicField = CxDynamicFieldValue & {
  label: string;
  placeholder: string;
  masked: boolean;
};

@Component({
  selector: 'cx-dynamic-fields',
  imports: [CxButtonComponent, CxIconButtonComponent, CxTextFieldComponent],
  templateUrl: './cx-dynamic-fields.component.html',
  styleUrl: './cx-dynamic-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDynamicFieldsComponent {
  private readonly optionsState = signal<CxDynamicFieldOption[]>([]);
  private readonly fieldsState = signal<CxDynamicFieldValue[]>([]);

  @Input() disabled = false;

  @Input()
  public set options(value: CxDynamicFieldOption[] | null | undefined) {
    this.optionsState.set((value ?? []).map(option => ({ ...option })));
  }

  @Input()
  public set fields(value: CxDynamicFieldValue[] | null | undefined) {
    this.fieldsState.set((value ?? []).map(field => ({ id: field.id, value: field.value ?? '' })));
  }

  @Output() readonly fieldsChange = new EventEmitter<CxDynamicFieldValue[]>();

  protected readonly resolvedFields$ = computed(() => {
    const optionsById = new Map(
      this.optionsState().map(option => [
        option.id,
        {
          label: option.label,
          placeholder: option.placeholder?.trim() || '',
          masked: option.masked === true,
        },
      ]),
    );

    return this.fieldsState()
      .map(field => {
        const option = optionsById.get(field.id);
        if (!option) {
          return null;
        }
        return {
          ...field,
          ...option,
        } satisfies CxResolvedDynamicField;
      })
      .filter((field): field is CxResolvedDynamicField => field !== null);
  });
  protected readonly addableOptions$ = computed(() => {
    const activeIds = new Set(this.fieldsState().map(field => field.id));
    return this.optionsState().filter(option => !activeIds.has(option.id));
  });

  protected onFieldValueChange(fieldId: string, value: string): void {
    const nextFields = this.fieldsState().map(field => (field.id === fieldId ? { ...field, value } : field));
    this.fieldsState.set(nextFields);
    this.fieldsChange.emit(nextFields);
  }

  protected onRemoveField(fieldId: string): void {
    if (this.disabled) {
      return;
    }
    const nextFields = this.fieldsState().filter(field => field.id !== fieldId);
    this.fieldsState.set(nextFields);
    this.fieldsChange.emit(nextFields);
  }

  protected onAddField(fieldId: string): void {
    if (this.disabled || this.fieldsState().some(field => field.id === fieldId)) {
      return;
    }
    const nextFields = [...this.fieldsState(), { id: fieldId, value: '' }];
    this.fieldsState.set(nextFields);
    this.fieldsChange.emit(nextFields);
  }
}
