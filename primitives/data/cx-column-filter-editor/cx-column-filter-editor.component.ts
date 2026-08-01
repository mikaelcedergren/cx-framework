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
import { CxCheckboxComponent } from '../../inputs/cx-checkbox';
import { CxDateSpanPickerComponent } from '../../inputs/cx-date-span-picker';
import { CxTagFieldComponent } from '../../inputs/cx-tag-field';
import { CxTextFieldComponent } from '../../inputs/cx-text-field';
import {
  assertCxColumnFilterDefinition,
  isCxColumnFilterDateSpanValue,
  normalizeCxColumnFilterValue,
  type CxColumnFilterDateSpanDefinition,
  type CxColumnFilterDateSpanValue,
  type CxColumnFilterDefinition,
  type CxColumnFilterMultiSelectDefinition,
  type CxColumnFilterSearchDefinition,
  type CxColumnFilterTagFieldDefinition,
  type CxColumnFilterValue,
} from './cx-column-filter.types';

@Component({
  selector: 'cx-column-filter-editor',
  imports: [
    CxCheckboxComponent,
    CxDateSpanPickerComponent,
    CxTagFieldComponent,
    CxTextFieldComponent,
  ],
  templateUrl: './cx-column-filter-editor.component.html',
  styleUrl: './cx-column-filter-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxColumnFilterEditorComponent {
  private readonly definitionState =
    signal<CxColumnFilterDefinition | undefined>(undefined);
  private readonly valueState = signal<CxColumnFilterValue | undefined>(
    undefined,
  );
  protected readonly multiSelectQueryState = signal('');

  @ViewChild('primaryControl', { read: ElementRef })
  private readonly primaryControlRef?: ElementRef<HTMLElement>;

  @Input({ required: true })
  public set definition(value: CxColumnFilterDefinition) {
    assertCxColumnFilterDefinition(value);
    this.definitionState.set(value);
    this.valueState.set(normalizeCxColumnFilterValue(value, this.valueState()));
  }

  @Input()
  public set value(value: CxColumnFilterValue | null | undefined) {
    const definition = this.definitionState();
    this.valueState.set(
      definition
        ? normalizeCxColumnFilterValue(definition, value)
        : value ?? undefined,
    );
  }

  @Input() label = '';
  @Input() ariaLabel: string | undefined;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() showClearAction = true;

  @Output() readonly valueChange =
    new EventEmitter<CxColumnFilterValue | undefined>();
  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly loadMore = new EventEmitter<void>();

  protected readonly definition$ = this.definitionState.asReadonly();
  protected readonly searchDefinition$ = computed(() =>
    this.definitionState()?.kind === 'search'
      ? (this.definitionState() as CxColumnFilterSearchDefinition)
      : undefined,
  );
  protected readonly multiSelectDefinition$ = computed(() =>
    this.definitionState()?.kind === 'multi-select'
      ? (this.definitionState() as CxColumnFilterMultiSelectDefinition)
      : undefined,
  );
  protected readonly tagFieldDefinition$ = computed(() =>
    this.definitionState()?.kind === 'tag-field'
      ? (this.definitionState() as CxColumnFilterTagFieldDefinition)
      : undefined,
  );
  protected readonly dateSpanDefinition$ = computed(() =>
    this.definitionState()?.kind === 'date-span'
      ? (this.definitionState() as CxColumnFilterDateSpanDefinition)
      : undefined,
  );
  protected readonly searchValue$ = computed(() => {
    const value = this.valueState();
    return typeof value === 'string' ? value : '';
  });
  protected readonly selectedValues$ = computed(() => {
    const value = this.valueState();
    return Array.isArray(value) ? [...value] : [];
  });
  protected readonly hasMultiSelectValue$ = computed(
    () =>
      this.multiSelectDefinition$() !== undefined &&
      this.selectedValues$().length > 0,
  );
  protected readonly dateSpanValue$ = computed<CxColumnFilterDateSpanValue>(
    () => {
      const value = this.valueState();
      if (isCxColumnFilterDateSpanValue(value)) {
        return { ...value };
      }
      return {};
    },
  );
  protected resolvedAriaLabel(): string {
    const explicitAriaLabel = this.ariaLabel?.trim();
    if (explicitAriaLabel) {
      return explicitAriaLabel;
    }
    const visibleLabel = this.label.trim();
    return visibleLabel ? `${visibleLabel} filter` : 'Filter';
  }
  protected readonly multiSelectOptions$ = computed(() => {
    const definition = this.multiSelectDefinition$();
    if (!definition) {
      return [];
    }

    const options = [...definition.options];
    const query = this.multiSelectQueryState().trim().toLocaleLowerCase();
    if (
      !query ||
      definition.searchable !== true ||
      definition.filterMode === 'manual'
    ) {
      return options;
    }

    return options.filter(option =>
      [option.label, option.description, ...(option.keywords ?? [])]
        .filter((value): value is string => typeof value === 'string')
        .some(value => value.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly tagFieldTags$ = computed(() => [
    ...(this.tagFieldDefinition$()?.tags ?? []),
  ]);
  protected readonly dateSpanQuickRanges$ = computed(() => [
    ...(this.dateSpanDefinition$()?.quickRanges ?? []),
  ]);

  /**
   * Focuses the current editor without requiring its container to know which
   * concrete field renders for the column.
   */
  public focus(): void {
    const primaryControl = this.primaryControlRef?.nativeElement;
    primaryControl
      ?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
  }

  public clear(): void {
    this.commitValue(undefined);
  }

  protected onSearchValueChange(value: string): void {
    this.commitValue(value);
  }

  protected onSelectedValuesChange(values: string[]): void {
    this.commitValue(values);
  }

  protected isMultiSelectOptionSelected(optionId: string): boolean {
    return this.selectedValues$().includes(optionId);
  }

  protected onMultiSelectOptionChange(
    optionId: string,
    selected: boolean,
  ): void {
    const currentValues = this.selectedValues$();
    const nextValues = selected
      ? [...currentValues, optionId]
      : currentValues.filter(value => value !== optionId);
    this.commitValue([...new Set(nextValues)]);
  }

  protected onMultiSelectQueryChange(query: string): void {
    this.multiSelectQueryState.set(query);
    if (this.multiSelectDefinition$()?.filterMode === 'manual') {
      this.queryChange.emit(query);
    }
  }

  protected multiSelectStatusText(
    filter: CxColumnFilterMultiSelectDefinition,
  ): string {
    if (this.loading) {
      return filter.translations?.loading ?? 'Loading options';
    }
    if (this.multiSelectQueryState().trim()) {
      return filter.translations?.noResults ?? 'No results';
    }
    return filter.translations?.noOptions ?? 'No options';
  }

  protected onDateSpanValueChange(value: CxColumnFilterDateSpanValue): void {
    this.commitValue(value);
  }

  protected onLoadMore(): void {
    this.loadMore.emit();
  }

  private commitValue(value: unknown): void {
    const definition = this.definitionState();
    if (!definition || this.disabled || this.loading) {
      return;
    }

    const normalizedValue = normalizeCxColumnFilterValue(definition, value);
    this.valueState.set(normalizedValue);
    this.valueChange.emit(normalizedValue);
  }
}
