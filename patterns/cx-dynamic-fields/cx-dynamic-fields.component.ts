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
import { CxPasswordFieldComponent } from '../../primitives/inputs/cx-password-field';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';

export type CxDynamicFieldOption = {
  id: string;
  label: string;
  hint?: string;
  masked?: boolean;
};

export type CxDynamicFieldValue = {
  id: string;
  value: string;
};

type CxResolvedDynamicField = CxDynamicFieldValue & {
  label: string;
  hint: string;
  masked: boolean;
};

@Component({
  selector: 'cx-dynamic-fields',
  imports: [
    CxButtonComponent,
    CxIconButtonComponent,
    CxPasswordFieldComponent,
    CxTextFieldComponent,
  ],
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
    const ids = new Set<string>();
    const options = (value ?? []).map(option => {
      const id = option.id?.trim();
      const label = option.label?.trim();
      if (!id || !label) {
        throw new Error('[cx-dynamic-fields] every option requires a visible label and non-empty id.');
      }
      if (ids.has(id)) {
        throw new Error(`[cx-dynamic-fields] option ids must be unique; received "${id}" more than once.`);
      }
      ids.add(id);
      return { ...option, id, label };
    });
    this.optionsState.set(options);
  }

  @Input()
  public set fields(value: CxDynamicFieldValue[] | null | undefined) {
    const ids = new Set<string>();
    const fields = (value ?? []).map(field => {
      const id = field.id?.trim();
      if (!id) {
        throw new Error('[cx-dynamic-fields] every field requires a non-empty id.');
      }
      if (ids.has(id)) {
        throw new Error(`[cx-dynamic-fields] field ids must be unique; received "${id}" more than once.`);
      }
      ids.add(id);
      return { id, value: field.value ?? '' };
    });
    this.fieldsState.set(fields);
  }

  @Output() readonly fieldsChange = new EventEmitter<CxDynamicFieldValue[]>();

  protected readonly resolvedFields$ = computed(() => {
    const optionsById = new Map(
      this.optionsState().map(option => [
        option.id,
        {
          label: option.label,
          hint: option.hint?.trim() || '',
          masked: option.masked === true,
        },
      ]),
    );

    return this.fieldsState()
      .map(field => {
        const option = optionsById.get(field.id);
        if (!option) {
          throw new Error(`[cx-dynamic-fields] field "${field.id}" has no matching visible option.`);
        }
        return {
          ...field,
          ...option,
        } satisfies CxResolvedDynamicField;
      });
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
