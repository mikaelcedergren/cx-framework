import { type CxDropdownFilterMode, type CxDropdownOption, type CxDropdownTranslations } from '../../inputs/cx-dropdown';
import { type CxDateSpanDisabledDates, type CxDateSpanPickerWeekStart, type CxDateSpanQuickRange } from '../../inputs/cx-date-span-picker';
import { type CxTagFieldTag } from '../../inputs/cx-tag-field';
export type CxColumnFilterKind = 'search' | 'single-select' | 'multi-select' | 'tag-field' | 'date-span' | 'number-span' | 'range';
type CxColumnFilterDefinitionBase<TKind extends CxColumnFilterKind> = {
    kind: TKind;
    placeholder?: string;
    hint?: string;
};
export type CxColumnFilterSearchDefinition = CxColumnFilterDefinitionBase<'search'> & {
    autocomplete?: string;
};
export type CxColumnFilterMultiSelectDefinition = CxColumnFilterDefinitionBase<'multi-select'> & {
    options: readonly CxDropdownOption[];
    presentation?: 'checklist' | 'dropdown';
    searchable?: boolean;
    filterMode?: CxDropdownFilterMode;
    hasMore?: boolean;
    loadingMore?: boolean;
    translations?: CxDropdownTranslations;
};
export type CxColumnFilterSingleSelectDefinition = CxColumnFilterDefinitionBase<'single-select'> & {
    options: readonly CxDropdownOption[];
    presentation?: 'radio' | 'dropdown';
    searchable?: boolean;
    filterMode?: CxDropdownFilterMode;
    hasMore?: boolean;
    loadingMore?: boolean;
    translations?: CxDropdownTranslations;
};
export type CxColumnFilterTagFieldDefinition = CxColumnFilterDefinitionBase<'tag-field'> & {
    tags: readonly CxTagFieldTag[];
    emptyText?: string;
};
export type CxColumnFilterDateSpanDefinition = CxColumnFilterDefinitionBase<'date-span'> & {
    quickRanges?: readonly CxDateSpanQuickRange[];
    min?: number;
    max?: number;
    maxSpan?: number;
    disabledDates?: CxDateSpanDisabledDates;
    weekStart?: CxDateSpanPickerWeekStart;
    timeEnabled?: boolean;
    closeOnSelect?: boolean;
};
type CxColumnFilterNumericDefinitionBase<TKind extends 'number-span' | 'range'> = CxColumnFilterDefinitionBase<TKind> & {
    min: number;
    max: number;
    step?: number;
    prependText?: string;
    appendText?: string;
};
export type CxColumnFilterNumberSpanDefinition = CxColumnFilterNumericDefinitionBase<'number-span'>;
export type CxColumnFilterRangeDefinition = CxColumnFilterNumericDefinitionBase<'range'>;
/**
 * Add future built-in interactions as a new discriminated member. The table
 * surfaces consume this union and do not need column-type-specific inputs.
 */
export type CxColumnFilterDefinition = CxColumnFilterSearchDefinition | CxColumnFilterSingleSelectDefinition | CxColumnFilterMultiSelectDefinition | CxColumnFilterTagFieldDefinition | CxColumnFilterDateSpanDefinition | CxColumnFilterNumberSpanDefinition | CxColumnFilterRangeDefinition;
export type CxColumnFilterDefinitionOf<TKind extends CxColumnFilterKind> = Extract<CxColumnFilterDefinition, {
    kind: TKind;
}>;
export type CxColumnFilterDateSpanValue = Readonly<{
    start?: string;
    end?: string;
}>;
export type CxColumnFilterNumericSpanValue = Readonly<{
    min?: number;
    max?: number;
}>;
export type CxColumnFilterValueByKind = {
    search: string;
    'single-select': string;
    'multi-select': readonly string[];
    'tag-field': readonly string[];
    'date-span': CxColumnFilterDateSpanValue;
    'number-span': CxColumnFilterNumericSpanValue;
    range: CxColumnFilterNumericSpanValue;
};
export type CxColumnFilterValueFor<TKind extends CxColumnFilterKind> = CxColumnFilterValueByKind[TKind];
/**
 * Filter values are deliberately limited to JSON-safe data. Definitions own
 * rendering configuration; saved views and server requests persist only this.
 */
export type CxColumnFilterValue = CxColumnFilterValueByKind[CxColumnFilterKind];
/**
 * Active values are keyed by the stable column ID. Inactive entries are
 * omitted rather than stored as empty strings, empty arrays, or empty spans.
 */
export type CxColumnFilterValueMap = Readonly<Record<string, CxColumnFilterValue>>;
export type CxColumnFilterDefinitionMap = Readonly<Record<string, CxColumnFilterDefinition>>;
export interface CxColumnFilterQueryChangeEvent {
    columnId: string;
    query: string;
}
export interface CxColumnFilterLoadMoreEvent {
    columnId: string;
}
export declare function assertCxColumnFilterDefinition(value: unknown): asserts value is CxColumnFilterDefinition;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterSearchDefinition, value: unknown): string | undefined;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterSingleSelectDefinition, value: unknown): string | undefined;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterMultiSelectDefinition, value: unknown): readonly string[] | undefined;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterTagFieldDefinition, value: unknown): readonly string[] | undefined;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterDateSpanDefinition, value: unknown): CxColumnFilterDateSpanValue | undefined;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterNumberSpanDefinition | CxColumnFilterRangeDefinition, value: unknown): CxColumnFilterNumericSpanValue | undefined;
export declare function normalizeCxColumnFilterValue(definition: CxColumnFilterDefinition, value: unknown): CxColumnFilterValue | undefined;
export declare function isCxColumnFilterValueActive(definition: CxColumnFilterDefinition, value: unknown): boolean;
export declare function isCxColumnFilterDateSpanValue(value: unknown): value is CxColumnFilterDateSpanValue;
export declare function isCxColumnFilterNumericSpanValue(value: unknown): value is CxColumnFilterNumericSpanValue;
export declare function summarizeCxColumnFilterValue(definition: CxColumnFilterDefinition, value: unknown): string | undefined;
/**
 * Returns a new controlled state map with one column updated. Clearing a value
 * removes its key, so inactive filters cannot become orphaned state.
 */
export declare function withCxColumnFilterValue(values: CxColumnFilterValueMap | null | undefined, columnId: string, definition: CxColumnFilterDefinition, value: unknown): CxColumnFilterValueMap;
/**
 * Drops unknown columns and inactive values while retaining hidden columns
 * whose definitions remain present in the supplied definition map.
 */
export declare function normalizeCxColumnFilterValueMap(definitions: CxColumnFilterDefinitionMap, values: Readonly<Record<string, unknown>> | null | undefined): CxColumnFilterValueMap;
/**
 * Rendered height an editor is likely to need, for the pre-render placement
 * pass of a surface that hosts a single filter. Owned here because it depends
 * only on the filter definition; every surface that opens one editor — the
 * table's column header and the filter bar's active-filter tag — measures the
 * same way.
 */
export declare function estimateCxColumnFilterHeight(definition: CxColumnFilterDefinition | undefined): number;
export {};
//# sourceMappingURL=cx-column-filter.types.d.ts.map