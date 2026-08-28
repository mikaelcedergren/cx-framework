import { formatCxDateSpanDisplay, formatCxDateValue, parseCxDateValue, } from '../../inputs/shared/cx-date.utils.js';
export function assertCxColumnFilterDefinition(value) {
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
            throw new Error(`cx-column-filter-editor does not support filter kind “${value['kind']}”.`);
    }
}
export function normalizeCxColumnFilterValue(definition, value) {
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
export function isCxColumnFilterValueActive(definition, value) {
    return normalizeCxColumnFilterValue(definition, value) !== undefined;
}
export function isCxColumnFilterDateSpanValue(value) {
    return isRecord(value);
}
export function summarizeCxColumnFilterValue(definition, value) {
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
                ? summarizeSelectedIds(normalizedValue, new Map(definition.options.map(option => [option.id, option.label])))
                : undefined;
        case 'tag-field':
            return isStringIdArray(normalizedValue)
                ? summarizeSelectedIds(normalizedValue, new Map(definition.tags.map(tag => [tag.id, tag.name])))
                : undefined;
        case 'date-span':
            if (isCxColumnFilterDateSpanValue(normalizedValue)) {
                return formatCxDateSpanDisplay(normalizedValue.start, normalizedValue.end, definition.timeEnabled === true);
            }
            return undefined;
    }
}
/**
 * Returns a new controlled state map with one column updated. Clearing a value
 * removes its key, so inactive filters cannot become orphaned state.
 */
export function withCxColumnFilterValue(values, columnId, definition, value) {
    if (!columnId.trim()) {
        throw new Error('Column filter values require a non-empty column ID.');
    }
    const normalizedValue = normalizeCxColumnFilterValue(definition, value);
    const currentValues = values ?? {};
    const currentValue = currentValues[columnId];
    if (cxColumnFilterValuesEqual(currentValue, normalizedValue)) {
        return currentValues;
    }
    const nextValues = {
        ...currentValues,
    };
    if (normalizedValue === undefined) {
        delete nextValues[columnId];
    }
    else {
        nextValues[columnId] = normalizedValue;
    }
    return nextValues;
}
/**
 * Drops unknown columns and inactive values while retaining hidden columns
 * whose definitions remain present in the supplied definition map.
 */
export function normalizeCxColumnFilterValueMap(definitions, values) {
    const normalizedValues = {};
    for (const [columnId, definition] of Object.entries(definitions)) {
        const normalizedValue = normalizeCxColumnFilterValue(definition, values?.[columnId]);
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
export function estimateCxColumnFilterHeight(definition) {
    if (!definition) {
        return 0;
    }
    if (definition.kind !== 'multi-select') {
        return 96;
    }
    const optionListHeight = Math.min(Math.max(definition.options.length, 1) * 36, 320);
    return (48 +
        optionListHeight +
        (definition.searchable ? 40 : 0) +
        (definition.hint ? 24 : 0) +
        (definition.hasMore ? 36 : 0));
}
function normalizeSearchValue(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return undefined;
    }
    return value;
}
function normalizeStableIds(value) {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const normalizedIds = [];
    const seenIds = new Set();
    for (const item of value) {
        if (typeof item !== 'string' || !item.trim() || seenIds.has(item)) {
            continue;
        }
        seenIds.add(item);
        normalizedIds.push(item);
    }
    return normalizedIds.length > 0 ? normalizedIds : undefined;
}
function normalizeDateSpanValue(value) {
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
function normalizeIsoDateValue(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalizedValue = value.trim();
    const parsedValue = parseCxDateValue(normalizedValue);
    if (!parsedValue) {
        return undefined;
    }
    const includeTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}$/.test(normalizedValue);
    return formatCxDateValue(parsedValue, includeTime);
}
function summarizeSelectedIds(selectedIds, labelsById) {
    if (selectedIds.length !== 1) {
        return `${selectedIds.length} selected`;
    }
    return labelsById.get(selectedIds[0] ?? '')?.trim() || '1 selected';
}
function cxColumnFilterValuesEqual(currentValue, nextValue) {
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
        return (isStringIdArray(currentValue) &&
            isStringIdArray(nextValue) &&
            currentValue.length === nextValue.length &&
            currentValue.every((item, index) => item === nextValue[index]));
    }
    return isCxColumnFilterDateSpanValue(currentValue) &&
        isCxColumnFilterDateSpanValue(nextValue)
        ? currentValue.start === nextValue.start &&
            currentValue.end === nextValue.end
        : false;
}
function assertStableOptionCollection(value, collectionName) {
    if (!Array.isArray(value)) {
        throw new Error(`cx-column-filter-editor requires ${collectionName} to be an array.`);
    }
    const seenIds = new Set();
    for (const item of value) {
        if (!isRecord(item) || typeof item['id'] !== 'string' || !item['id'].trim()) {
            throw new Error(`cx-column-filter-editor requires every ${collectionName} item to have a non-empty ID.`);
        }
        if (seenIds.has(item['id'])) {
            throw new Error(`cx-column-filter-editor requires unique ${collectionName} IDs; “${item['id']}” is duplicated.`);
        }
        seenIds.add(item['id']);
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStringIdArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}
