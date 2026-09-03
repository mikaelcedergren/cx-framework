import { EventEmitter } from '@angular/core';
import { type CxSliderRangeValue } from '../../inputs/cx-slider';
import { type CxColumnFilterDateSpanDefinition, type CxColumnFilterDateSpanValue, type CxColumnFilterDefinition, type CxColumnFilterMultiSelectDefinition, type CxColumnFilterNumberSpanDefinition, type CxColumnFilterRangeDefinition, type CxColumnFilterSearchDefinition, type CxColumnFilterSingleSelectDefinition, type CxColumnFilterTagFieldDefinition, type CxColumnFilterValue } from './cx-column-filter.types';
import * as i0 from "@angular/core";
export declare class CxColumnFilterEditorComponent {
    private readonly definitionState;
    private readonly valueState;
    protected readonly multiSelectQueryState: import("@angular/core").WritableSignal<string>;
    private readonly primaryControlRef?;
    set definition(value: CxColumnFilterDefinition);
    set value(value: CxColumnFilterValue | null | undefined);
    label: string;
    ariaLabel: string | undefined;
    disabled: boolean;
    loading: boolean;
    showClearAction: boolean;
    readonly valueChange: EventEmitter<CxColumnFilterValue | undefined>;
    readonly queryChange: EventEmitter<string>;
    readonly loadMore: EventEmitter<void>;
    protected readonly definition$: import("@angular/core").Signal<CxColumnFilterDefinition | undefined>;
    protected readonly searchDefinition$: import("@angular/core").Signal<CxColumnFilterSearchDefinition | undefined>;
    protected readonly multiSelectDefinition$: import("@angular/core").Signal<CxColumnFilterMultiSelectDefinition | undefined>;
    protected readonly singleSelectDefinition$: import("@angular/core").Signal<CxColumnFilterSingleSelectDefinition | undefined>;
    protected readonly tagFieldDefinition$: import("@angular/core").Signal<CxColumnFilterTagFieldDefinition | undefined>;
    protected readonly dateSpanDefinition$: import("@angular/core").Signal<CxColumnFilterDateSpanDefinition | undefined>;
    protected readonly numberSpanDefinition$: import("@angular/core").Signal<CxColumnFilterNumberSpanDefinition | undefined>;
    protected readonly rangeDefinition$: import("@angular/core").Signal<CxColumnFilterRangeDefinition | undefined>;
    protected readonly searchValue$: import("@angular/core").Signal<string>;
    protected readonly selectedValues$: import("@angular/core").Signal<any[]>;
    protected readonly singleSelectValue$: import("@angular/core").Signal<string | undefined>;
    protected readonly hasValue$: import("@angular/core").Signal<boolean>;
    protected readonly dateSpanValue$: import("@angular/core").Signal<Readonly<{
        start?: string;
        end?: string;
    }>>;
    protected readonly numericSpanValue$: import("@angular/core").Signal<Readonly<{
        min?: number;
        max?: number;
    }>>;
    protected readonly rangeValue$: import("@angular/core").Signal<CxSliderRangeValue>;
    protected resolvedAriaLabel(): string;
    protected readonly multiSelectOptions$: import("@angular/core").Signal<import("../../inputs/cx-dropdown").CxDropdownOption[]>;
    protected readonly singleSelectOptions$: import("@angular/core").Signal<import("../../inputs/cx-dropdown").CxDropdownOption[]>;
    protected readonly tagFieldTags$: import("@angular/core").Signal<import("../../inputs/cx-tag-field").CxTagFieldTag[]>;
    protected readonly dateSpanQuickRanges$: import("@angular/core").Signal<import("../../inputs/cx-date-span-picker").CxDateSpanQuickRange[]>;
    /**
     * Focuses the current editor without requiring its container to know which
     * concrete field renders for the column.
     */
    focus(): void;
    clear(): void;
    protected onSearchValueChange(value: string): void;
    protected onSelectedValuesChange(values: string[]): void;
    protected onSingleSelectValueChange(value: string | undefined): void;
    protected onSingleSelectOptionChange(optionId: string, selected: boolean): void;
    protected onSingleSelectKeydown(event: KeyboardEvent): void;
    protected isMultiSelectOptionSelected(optionId: string): boolean;
    protected onMultiSelectOptionChange(optionId: string, selected: boolean): void;
    protected onMultiSelectQueryChange(query: string): void;
    protected multiSelectStatusText(filter: CxColumnFilterMultiSelectDefinition): string;
    protected onDateSpanValueChange(value: CxColumnFilterDateSpanValue): void;
    protected onNumericSpanValueChange(edge: 'min' | 'max', value: number | undefined): void;
    protected onRangeValueChange(value: CxSliderRangeValue): void;
    protected readonly formatRangeValue: (value: number) => string;
    protected onLoadMore(): void;
    private commitValue;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxColumnFilterEditorComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxColumnFilterEditorComponent, "cx-column-filter-editor", never, { "definition": { "alias": "definition"; "required": true; }; "value": { "alias": "value"; "required": false; }; "label": { "alias": "label"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "showClearAction": { "alias": "showClearAction"; "required": false; }; }, { "valueChange": "valueChange"; "queryChange": "queryChange"; "loadMore": "loadMore"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-column-filter-editor.component.d.ts.map