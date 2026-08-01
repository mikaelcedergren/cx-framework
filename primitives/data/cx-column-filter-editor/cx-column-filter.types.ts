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
  | 'multi-select'
  | 'tag-field'
  | 'date-span';

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

/**
 * Add future built-in interactions as a new discriminated member. The table
 * surfaces consume this union and do not need column-type-specific inputs.
 */
export type CxColumnFilterDefinition =
  | CxColumnFilterSearchDefinition
  | CxColumnFilterMultiSelectDefinition
  | CxColumnFilterTagFieldDefinition
  | CxColumnFilterDateSpanDefinition;

export type CxColumnFilterDefinitionOf<TKind extends CxColumnFilterKind> =
  Extract<CxColumnFilterDefinition, { kind: TKind }>;

export type CxColumnFilterDateSpanValue = Readonly<{
  start?: string;
  end?: string;
}>;

export type CxColumnFilterValueByKind = {
  search: string;
  'multi-select': readonly string[];
  'tag-field': readonly string[];
  'date-span': CxColumnFilterDateSpanValue;
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
    case 'multi-select':
    case 'tag-field':
      return normalizeStableIds(value);
    case 'date-span':
      return normalizeDateSpanValue(value);
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

function normalizeSearchValue(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  return value;
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
  return isCxColumnFilterDateSpanValue(currentValue) &&
    isCxColumnFilterDateSpanValue(nextValue)
    ? currentValue.start === nextValue.start &&
        currentValue.end === nextValue.end
    : false;
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
