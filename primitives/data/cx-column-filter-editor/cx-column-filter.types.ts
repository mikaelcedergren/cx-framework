import {
  type CxDropdownFilterMode,
  type CxDropdownOption,
  type CxDropdownTranslations,
} from '../../inputs/cx-dropdown';
import {
  type CxDateSpanDisabledDates,
  type CxDateSpanPickerWeekStart,
  type CxDateSpanQuickRange,
} from '../../inputs/cx-date-span-picker';
import { type CxTagFieldTag } from '../../inputs/cx-tag-field';
import {
  formatCxDateSpanDisplay,
  formatCxDateValue,
  parseCxDateValue,
} from '../../inputs/shared/cx-date.utils';

export type CxColumnFilterKind =
  | 'search'
  | 'single-select'
  | 'multi-select'
  | 'tag-field'
  | 'date-span'
  | 'number-span'
  | 'range';

type CxColumnFilterDefinitionBase<TKind extends CxColumnFilterKind> = {
  kind: TKind;
  placeholder?: string;
  hint?: string;
};

export type CxColumnFilterSearchDefinition =
  CxColumnFilterDefinitionBase<'search'> & {
    autocomplete?: string;
  };

export type CxColumnFilterMultiSelectDefinition =
  CxColumnFilterDefinitionBase<'multi-select'> & {
    options: readonly CxDropdownOption[];
    presentation?: 'checklist' | 'dropdown';
    searchable?: boolean;
    filterMode?: CxDropdownFilterMode;
    hasMore?: boolean;
    loadingMore?: boolean;
    translations?: CxDropdownTranslations;
  };

export type CxColumnFilterSingleSelectDefinition =
  CxColumnFilterDefinitionBase<'single-select'> & {
    options: readonly CxDropdownOption[];
    presentation?: 'radio' | 'dropdown';
    searchable?: boolean;
    filterMode?: CxDropdownFilterMode;
    hasMore?: boolean;
    loadingMore?: boolean;
    translations?: CxDropdownTranslations;
  };

export type CxColumnFilterTagFieldDefinition =
  CxColumnFilterDefinitionBase<'tag-field'> & {
    tags: readonly CxTagFieldTag[];
    emptyText?: string;
  };

export type CxColumnFilterDateSpanDefinition =
  CxColumnFilterDefinitionBase<'date-span'> & {
    quickRanges?: readonly CxDateSpanQuickRange[];
    min?: number;
    max?: number;
    maxSpan?: number;
    disabledDates?: CxDateSpanDisabledDates;
    weekStart?: CxDateSpanPickerWeekStart;
    timeEnabled?: boolean;
    closeOnSelect?: boolean;
  };

type CxColumnFilterNumericDefinitionBase<
  TKind extends 'number-span' | 'range',
> = CxColumnFilterDefinitionBase<TKind> & {
  min: number;
  max: number;
  step?: number;
  prependText?: string;
  appendText?: string;
};

export type CxColumnFilterNumberSpanDefinition =
  CxColumnFilterNumericDefinitionBase<'number-span'>;

export type CxColumnFilterRangeDefinition =
  CxColumnFilterNumericDefinitionBase<'range'>;

/**
 * Add future built-in interactions as a new discriminated member. The table
 * surfaces consume this union and do not need column-type-specific inputs.
 */
export type CxColumnFilterDefinition =
  | CxColumnFilterSearchDefinition
  | CxColumnFilterSingleSelectDefinition
  | CxColumnFilterMultiSelectDefinition
  | CxColumnFilterTagFieldDefinition
  | CxColumnFilterDateSpanDefinition
  | CxColumnFilterNumberSpanDefinition
  | CxColumnFilterRangeDefinition;

export type CxColumnFilterDefinitionOf<TKind extends CxColumnFilterKind> =
  Extract<CxColumnFilterDefinition, { kind: TKind }>;

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

export type CxColumnFilterValueFor<TKind extends CxColumnFilterKind> =
  CxColumnFilterValueByKind[TKind];

/**
 * Filter values are deliberately limited to JSON-safe data. Definitions own
 * rendering configuration; saved views and server requests persist only this.
 */
export type CxColumnFilterValue =
  CxColumnFilterValueByKind[CxColumnFilterKind];

/**
 * Active values are keyed by the stable column ID. Inactive entries are
 * omitted rather than stored as empty strings, empty arrays, or empty spans.
 */
export type CxColumnFilterValueMap =
  Readonly<Record<string, CxColumnFilterValue>>;

export type CxColumnFilterDefinitionMap =
  Readonly<Record<string, CxColumnFilterDefinition>>;

export interface CxColumnFilterQueryChangeEvent {
  columnId: string;
  query: string;
}

export interface CxColumnFilterLoadMoreEvent {
  columnId: string;
}

export function assertCxColumnFilterDefinition(
  value: unknown,
): asserts value is CxColumnFilterDefinition {
  if (!isRecord(value) || typeof value['kind'] !== 'string') {
    throw new Error('cx-column-filter-editor requires a filter definition.');
  }

  switch (value['kind']) {
    case 'search':
      return;
    case 'single-select':
      assertStableOptionCollection(value['options'], 'single-select options');
      return;
    case 'multi-select':
      assertStableOptionCollection(value['options'], 'multi-select options');
      return;
    case 'tag-field':
      assertStableOptionCollection(value['tags'], 'tag-field tags');
      return;
    case 'date-span':
      if (value['quickRanges'] !== undefined) {
        assertStableOptionCollection(value['quickRanges'], 'date-span quick ranges');
      }
      return;
    case 'number-span':
    case 'range':
      assertNumericFilterDefinition(value, value['kind']);
      return;
    default:
      throw new Error(
        `cx-column-filter-editor does not support filter kind “${value['kind']}”.`,
      );
  }
}

export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterSearchDefinition,
  value: unknown,
): string | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterSingleSelectDefinition,
  value: unknown,
): string | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterMultiSelectDefinition,
  value: unknown,
): readonly string[] | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterTagFieldDefinition,
  value: unknown,
): readonly string[] | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterDateSpanDefinition,
  value: unknown,
): CxColumnFilterDateSpanValue | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterNumberSpanDefinition | CxColumnFilterRangeDefinition,
  value: unknown,
): CxColumnFilterNumericSpanValue | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterDefinition,
  value: unknown,
): CxColumnFilterValue | undefined;
export function normalizeCxColumnFilterValue(
  definition: CxColumnFilterDefinition,
  value: unknown,
): CxColumnFilterValue | undefined {
  switch (definition.kind) {
    case 'search':
      return normalizeSearchValue(value);
    case 'single-select':
      return normalizeSingleSelectValue(definition, value);
    case 'multi-select':
    case 'tag-field':
      return normalizeStableIds(value);
    case 'date-span':
      return normalizeDateSpanValue(value);
    case 'number-span':
      return normalizeNumericSpanValue(definition, value, false);
    case 'range':
      return normalizeNumericSpanValue(definition, value, true);
  }
}

export function isCxColumnFilterValueActive(
  definition: CxColumnFilterDefinition,
  value: unknown,
): boolean {
  return normalizeCxColumnFilterValue(definition, value) !== undefined;
}

export function isCxColumnFilterDateSpanValue(
  value: unknown,
): value is CxColumnFilterDateSpanValue {
  return isRecord(value);
}

export function isCxColumnFilterNumericSpanValue(
  value: unknown,
): value is CxColumnFilterNumericSpanValue {
  return isRecord(value)
    && (typeof value['min'] === 'number' || typeof value['max'] === 'number');
}

export function summarizeCxColumnFilterValue(
  definition: CxColumnFilterDefinition,
  value: unknown,
): string | undefined {
  const normalizedValue = normalizeCxColumnFilterValue(definition, value);
  if (normalizedValue === undefined) {
    return undefined;
  }

  switch (definition.kind) {
    case 'search':
      return typeof normalizedValue === 'string'
        ? normalizedValue.trim()
        : undefined;
    case 'single-select':
      return typeof normalizedValue === 'string'
        ? definition.options.find(option => option.id === normalizedValue)?.label
          ?? normalizedValue
        : undefined;
    case 'multi-select':
      return isStringIdArray(normalizedValue)
        ? summarizeSelectedIds(
            normalizedValue,
            new Map(definition.options.map(option => [option.id, option.label])),
          )
        : undefined;
    case 'tag-field':
      return isStringIdArray(normalizedValue)
        ? summarizeSelectedIds(
            normalizedValue,
            new Map(definition.tags.map(tag => [tag.id, tag.name])),
          )
        : undefined;
    case 'date-span':
      if (isCxColumnFilterDateSpanValue(normalizedValue)) {
        return formatCxDateSpanDisplay(
          normalizedValue.start,
          normalizedValue.end,
          definition.timeEnabled === true,
        );
      }
      return undefined;
    case 'number-span':
    case 'range':
      return isCxColumnFilterNumericSpanValue(normalizedValue)
        ? summarizeNumericSpan(definition, normalizedValue)
        : undefined;
  }
}

/**
 * Returns a new controlled state map with one column updated. Clearing a value
 * removes its key, so inactive filters cannot become orphaned state.
 */
export function withCxColumnFilterValue(
  values: CxColumnFilterValueMap | null | undefined,
  columnId: string,
  definition: CxColumnFilterDefinition,
  value: unknown,
): CxColumnFilterValueMap {
  if (!columnId.trim()) {
    throw new Error('Column filter values require a non-empty column ID.');
  }

  const normalizedValue = normalizeCxColumnFilterValue(definition, value);
  const currentValues = values ?? {};
  const currentValue = currentValues[columnId];

  if (cxColumnFilterValuesEqual(currentValue, normalizedValue)) {
    return currentValues;
  }

  const nextValues: Record<string, CxColumnFilterValue> = {
    ...currentValues,
  };

  if (normalizedValue === undefined) {
    delete nextValues[columnId];
  } else {
    nextValues[columnId] = normalizedValue;
  }

  return nextValues;
}

/**
 * Drops unknown columns and inactive values while retaining hidden columns
 * whose definitions remain present in the supplied definition map.
 */
export function normalizeCxColumnFilterValueMap(
  definitions: CxColumnFilterDefinitionMap,
  values: Readonly<Record<string, unknown>> | null | undefined,
): CxColumnFilterValueMap {
  const normalizedValues: Record<string, CxColumnFilterValue> = {};

  for (const [columnId, definition] of Object.entries(definitions)) {
    const normalizedValue = normalizeCxColumnFilterValue(
      definition,
      values?.[columnId],
    );
    if (normalizedValue !== undefined) {
      normalizedValues[columnId] = normalizedValue;
    }
  }

  return normalizedValues;
}

/**
 * Rendered height an editor is likely to need, for the pre-render placement
 * pass of a surface that hosts a single filter. Owned here because it depends
 * only on the filter definition; every surface that opens one editor — the
 * table's column header and the filter bar's active-filter tag — measures the
 * same way.
 */
export function estimateCxColumnFilterHeight(
  definition: CxColumnFilterDefinition | undefined,
): number {
  if (!definition) {
    return 0;
  }
  if (definition.kind === 'single-select' && definition.presentation !== 'dropdown') {
    return 52 + Math.min(Math.max(definition.options.length, 1) * 36, 320);
  }
  if (definition.kind === 'multi-select' && definition.presentation !== 'dropdown') {
    const optionListHeight = Math.min(
      Math.max(definition.options.length, 1) * 36,
      320,
    );
    return (
      48 +
      optionListHeight +
      (definition.searchable ? 40 : 0) +
      (definition.hint ? 24 : 0) +
      (definition.hasMore ? 36 : 0)
    );
  }
  return definition.kind === 'number-span' ? 148 : 104;
}

function normalizeSearchValue(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  return value;
}

function normalizeSingleSelectValue(
  definition: CxColumnFilterSingleSelectDefinition,
  value: unknown,
): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  return definition.options.some(option => option.id === value)
    ? value
    : undefined;
}

function normalizeStableIds(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalizedIds: string[] = [];
  const seenIds = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim() || seenIds.has(item)) {
      continue;
    }
    seenIds.add(item);
    normalizedIds.push(item);
  }

  return normalizedIds.length > 0 ? normalizedIds : undefined;
}

function normalizeDateSpanValue(
  value: unknown,
): CxColumnFilterDateSpanValue | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const start = normalizeIsoDateValue(value['start']);
  const end = normalizeIsoDateValue(value['end']);
  if (!start && !end) {
    return undefined;
  }

  return {
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
  };
}

function normalizeNumericSpanValue(
  definition: CxColumnFilterNumberSpanDefinition | CxColumnFilterRangeDefinition,
  value: unknown,
  clearFullRange: boolean,
): CxColumnFilterNumericSpanValue | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const rawMin = normalizeFiniteNumber(value['min']);
  const rawMax = normalizeFiniteNumber(value['max']);
  if (rawMin === undefined && rawMax === undefined) {
    return undefined;
  }

  const boundedMin = rawMin === undefined
    ? undefined
    : Math.min(Math.max(rawMin, definition.min), definition.max);
  const boundedMax = rawMax === undefined
    ? undefined
    : Math.min(Math.max(rawMax, definition.min), definition.max);
  const min = boundedMin !== undefined && boundedMax !== undefined
    ? Math.min(boundedMin, boundedMax)
    : boundedMin;
  const max = boundedMin !== undefined && boundedMax !== undefined
    ? Math.max(boundedMin, boundedMax)
    : boundedMax;

  if (clearFullRange && min === definition.min && max === definition.max) {
    return undefined;
  }

  return {
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  };
}

function normalizeFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeIsoDateValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  const parsedValue = parseCxDateValue(normalizedValue);
  if (!parsedValue) {
    return undefined;
  }

  const includeTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}$/.test(
    normalizedValue,
  );
  return formatCxDateValue(parsedValue, includeTime);
}

function summarizeSelectedIds(
  selectedIds: readonly string[],
  labelsById: ReadonlyMap<string, string>,
): string {
  if (selectedIds.length !== 1) {
    return `${selectedIds.length} selected`;
  }

  return labelsById.get(selectedIds[0] ?? '')?.trim() || '1 selected';
}

function summarizeNumericSpan(
  definition: CxColumnFilterNumberSpanDefinition | CxColumnFilterRangeDefinition,
  value: CxColumnFilterNumericSpanValue,
): string {
  const format = (amount: number): string => {
    const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount);
    return `${definition.prependText ?? ''}${number}${definition.appendText ?? ''}`;
  };
  if (value.min !== undefined && value.max !== undefined) {
    return `${format(value.min)}–${format(value.max)}`;
  }
  if (value.min !== undefined) {
    return `From ${format(value.min)}`;
  }
  return `Up to ${format(value.max ?? definition.max)}`;
}

function cxColumnFilterValuesEqual(
  currentValue: CxColumnFilterValue | undefined,
  nextValue: CxColumnFilterValue | undefined,
): boolean {
  if (currentValue === nextValue) {
    return true;
  }
  if (currentValue === undefined || nextValue === undefined) {
    return false;
  }
  if (typeof currentValue === 'string' || typeof nextValue === 'string') {
    return false;
  }
  if (isStringIdArray(currentValue) || isStringIdArray(nextValue)) {
    return (
      isStringIdArray(currentValue) &&
      isStringIdArray(nextValue) &&
      currentValue.length === nextValue.length &&
      currentValue.every((item, index) => item === nextValue[index])
    );
  }
  if (
    isCxColumnFilterNumericSpanValue(currentValue)
    || isCxColumnFilterNumericSpanValue(nextValue)
  ) {
    return isCxColumnFilterNumericSpanValue(currentValue)
      && isCxColumnFilterNumericSpanValue(nextValue)
      && currentValue.min === nextValue.min
      && currentValue.max === nextValue.max;
  }
  return isCxColumnFilterDateSpanValue(currentValue)
    && isCxColumnFilterDateSpanValue(nextValue)
    && currentValue.start === nextValue.start
    && currentValue.end === nextValue.end;
}

function assertNumericFilterDefinition(
  value: Record<string, unknown>,
  kind: 'number-span' | 'range',
): void {
  const min = value['min'];
  const max = value['max'];
  const step = value['step'];
  if (
    typeof min !== 'number'
    || !Number.isFinite(min)
    || typeof max !== 'number'
    || !Number.isFinite(max)
    || max <= min
  ) {
    throw new Error(`cx-column-filter-editor requires ${kind} min and max with max greater than min.`);
  }
  if (step !== undefined && (typeof step !== 'number' || !Number.isFinite(step) || step <= 0)) {
    throw new Error(`cx-column-filter-editor requires ${kind} step to be greater than zero.`);
  }
}

function assertStableOptionCollection(
  value: unknown,
  collectionName: string,
): void {
  if (!Array.isArray(value)) {
    throw new Error(
      `cx-column-filter-editor requires ${collectionName} to be an array.`,
    );
  }

  const seenIds = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item['id'] !== 'string' || !item['id'].trim()) {
      throw new Error(
        `cx-column-filter-editor requires every ${collectionName} item to have a non-empty ID.`,
      );
    }
    if (seenIds.has(item['id'])) {
      throw new Error(
        `cx-column-filter-editor requires unique ${collectionName} IDs; “${item['id']}” is duplicated.`,
      );
    }
    seenIds.add(item['id']);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringIdArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
