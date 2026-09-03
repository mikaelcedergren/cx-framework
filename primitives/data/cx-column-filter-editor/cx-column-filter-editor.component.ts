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
import { CxDropdownComponent } from '../../inputs/cx-dropdown';
import { CxNumberFieldComponent } from '../../inputs/cx-number-field';
import { CxRadioComponent } from '../../inputs/cx-radio';
import { CxSliderComponent, type CxSliderRangeValue } from '../../inputs/cx-slider';
import { CxTagFieldComponent } from '../../inputs/cx-tag-field';
import { CxTextFieldComponent } from '../../inputs/cx-text-field';
import {
  assertCxColumnFilterDefinition,
  isCxColumnFilterDateSpanValue,
  isCxColumnFilterNumericSpanValue,
  isCxColumnFilterValueActive,
  normalizeCxColumnFilterValue,
  type CxColumnFilterDateSpanDefinition,
  type CxColumnFilterDateSpanValue,
  type CxColumnFilterDefinition,
  type CxColumnFilterMultiSelectDefinition,
  type CxColumnFilterNumberSpanDefinition,
  type CxColumnFilterNumericSpanValue,
  type CxColumnFilterRangeDefinition,
  type CxColumnFilterSearchDefinition,
  type CxColumnFilterSingleSelectDefinition,
  type CxColumnFilterTagFieldDefinition,
  type CxColumnFilterValue,
} from './cx-column-filter.types';

@Component({
  selector: 'cx-column-filter-editor',
  imports: [
    CxCheckboxComponent,
    CxDateSpanPickerComponent,
    CxDropdownComponent,
    CxNumberFieldComponent,
    CxRadioComponent,
    CxSliderComponent,
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
  protected readonly singleSelectDefinition$ = computed(() =>
    this.definitionState()?.kind === 'single-select'
      ? (this.definitionState() as CxColumnFilterSingleSelectDefinition)
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
  protected readonly numberSpanDefinition$ = computed(() =>
    this.definitionState()?.kind === 'number-span'
      ? (this.definitionState() as CxColumnFilterNumberSpanDefinition)
      : undefined,
  );
  protected readonly rangeDefinition$ = computed(() =>
    this.definitionState()?.kind === 'range'
      ? (this.definitionState() as CxColumnFilterRangeDefinition)
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
  protected readonly singleSelectValue$ = computed(() => {
    const value = this.valueState();
    return typeof value === 'string' ? value : undefined;
  });
  protected readonly hasValue$ = computed(() => {
    const definition = this.definitionState();
    return definition
      ? isCxColumnFilterValueActive(definition, this.valueState())
      : false;
  });
  protected readonly dateSpanValue$ = computed<CxColumnFilterDateSpanValue>(
    () => {
      const value = this.valueState();
      if (isCxColumnFilterDateSpanValue(value)) {
        return { ...value };
      }
      return {};
    },
  );
  protected readonly numericSpanValue$ = computed<CxColumnFilterNumericSpanValue>(
    () => {
      const value = this.valueState();
      return isCxColumnFilterNumericSpanValue(value) ? { ...value } : {};
    },
  );
  protected readonly rangeValue$ = computed<CxSliderRangeValue>(() => {
    const definition = this.rangeDefinition$();
    const value = this.numericSpanValue$();
    return [value.min ?? definition?.min ?? 0, value.max ?? definition?.max ?? 100];
  });
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
  protected readonly singleSelectOptions$ = computed(() => [
    ...(this.singleSelectDefinition$()?.options ?? []),
  ]);
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

  protected onSingleSelectValueChange(value: string | undefined): void {
    this.commitValue(value);
  }

  protected onSingleSelectOptionChange(optionId: string, selected: boolean): void {
    if (selected) {
      this.commitValue(optionId);
    }
  }

  protected onSingleSelectKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
      return;
    }
    const group = event.currentTarget;
    if (!(group instanceof HTMLElement)) return;
    const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')];
    const currentIndex = radios.indexOf(event.target as HTMLInputElement);
    if (currentIndex < 0 || radios.length < 2) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const next = radios[(currentIndex + direction + radios.length) % radios.length];
    next?.focus();
    next?.click();
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

  protected onNumericSpanValueChange(
    edge: 'min' | 'max',
    value: number | undefined,
  ): void {
    this.commitValue({ ...this.numericSpanValue$(), [edge]: value });
  }

  protected onRangeValueChange(value: CxSliderRangeValue): void {
    this.commitValue({ min: value[0], max: value[1] });
  }

  protected readonly formatRangeValue = (value: number): string => {
    const definition = this.rangeDefinition$();
    const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
    return `${definition?.prependText ?? ''}${number}${definition?.appendText ?? ''}`;
  };

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
