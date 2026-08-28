import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxCheckboxComponent } from '../../inputs/cx-checkbox/index.js';
import { CxDateSpanPickerComponent } from '../../inputs/cx-date-span-picker/index.js';
import { CxTagFieldComponent } from '../../inputs/cx-tag-field/index.js';
import { CxTextFieldComponent } from '../../inputs/cx-text-field/index.js';
import { assertCxColumnFilterDefinition, isCxColumnFilterDateSpanValue, normalizeCxColumnFilterValue, } from './cx-column-filter.types.js';
import * as i0 from "@angular/core";
export class CxColumnFilterEditorComponent {
    definitionState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "definitionState" }] : /* istanbul ignore next */ []));
    valueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    multiSelectQueryState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "multiSelectQueryState" }] : /* istanbul ignore next */ []));
    primaryControlRef;
    set definition(value) {
        assertCxColumnFilterDefinition(value);
        this.definitionState.set(value);
        this.valueState.set(normalizeCxColumnFilterValue(value, this.valueState()));
    }
    set value(value) {
        const definition = this.definitionState();
        this.valueState.set(definition
            ? normalizeCxColumnFilterValue(definition, value)
            : value ?? undefined);
    }
    label = '';
    ariaLabel;
    disabled = false;
    loading = false;
    showClearAction = true;
    valueChange = new EventEmitter();
    queryChange = new EventEmitter();
    loadMore = new EventEmitter();
    definition$ = this.definitionState.asReadonly();
    searchDefinition$ = computed(() => this.definitionState()?.kind === 'search'
        ? this.definitionState()
        : undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchDefinition$" }] : /* istanbul ignore next */ []));
    multiSelectDefinition$ = computed(() => this.definitionState()?.kind === 'multi-select'
        ? this.definitionState()
        : undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "multiSelectDefinition$" }] : /* istanbul ignore next */ []));
    tagFieldDefinition$ = computed(() => this.definitionState()?.kind === 'tag-field'
        ? this.definitionState()
        : undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagFieldDefinition$" }] : /* istanbul ignore next */ []));
    dateSpanDefinition$ = computed(() => this.definitionState()?.kind === 'date-span'
        ? this.definitionState()
        : undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dateSpanDefinition$" }] : /* istanbul ignore next */ []));
    searchValue$ = computed(() => {
        const value = this.valueState();
        return typeof value === 'string' ? value : '';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchValue$" }] : /* istanbul ignore next */ []));
    selectedValues$ = computed(() => {
        const value = this.valueState();
        return Array.isArray(value) ? [...value] : [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedValues$" }] : /* istanbul ignore next */ []));
    hasMultiSelectValue$ = computed(() => this.multiSelectDefinition$() !== undefined &&
        this.selectedValues$().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasMultiSelectValue$" }] : /* istanbul ignore next */ []));
    dateSpanValue$ = computed(() => {
        const value = this.valueState();
        if (isCxColumnFilterDateSpanValue(value)) {
            return { ...value };
        }
        return {};
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dateSpanValue$" }] : /* istanbul ignore next */ []));
    resolvedAriaLabel() {
        const explicitAriaLabel = this.ariaLabel?.trim();
        if (explicitAriaLabel) {
            return explicitAriaLabel;
        }
        const visibleLabel = this.label.trim();
        return visibleLabel ? `${visibleLabel} filter` : 'Filter';
    }
    multiSelectOptions$ = computed(() => {
        const definition = this.multiSelectDefinition$();
        if (!definition) {
            return [];
        }
        const options = [...definition.options];
        const query = this.multiSelectQueryState().trim().toLocaleLowerCase();
        if (!query ||
            definition.searchable !== true ||
            definition.filterMode === 'manual') {
            return options;
        }
        return options.filter(option => [option.label, option.description, ...(option.keywords ?? [])]
            .filter((value) => typeof value === 'string')
            .some(value => value.toLocaleLowerCase().includes(query)));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "multiSelectOptions$" }] : /* istanbul ignore next */ []));
    tagFieldTags$ = computed(() => [
        ...(this.tagFieldDefinition$()?.tags ?? []),
    ], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagFieldTags$" }] : /* istanbul ignore next */ []));
    dateSpanQuickRanges$ = computed(() => [
        ...(this.dateSpanDefinition$()?.quickRanges ?? []),
    ], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dateSpanQuickRanges$" }] : /* istanbul ignore next */ []));
    /**
     * Focuses the current editor without requiring its container to know which
     * concrete field renders for the column.
     */
    focus() {
        const primaryControl = this.primaryControlRef?.nativeElement;
        primaryControl
            ?.querySelector('input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])')
            ?.focus();
    }
    clear() {
        this.commitValue(undefined);
    }
    onSearchValueChange(value) {
        this.commitValue(value);
    }
    onSelectedValuesChange(values) {
        this.commitValue(values);
    }
    isMultiSelectOptionSelected(optionId) {
        return this.selectedValues$().includes(optionId);
    }
    onMultiSelectOptionChange(optionId, selected) {
        const currentValues = this.selectedValues$();
        const nextValues = selected
            ? [...currentValues, optionId]
            : currentValues.filter(value => value !== optionId);
        this.commitValue([...new Set(nextValues)]);
    }
    onMultiSelectQueryChange(query) {
        this.multiSelectQueryState.set(query);
        if (this.multiSelectDefinition$()?.filterMode === 'manual') {
            this.queryChange.emit(query);
        }
    }
    multiSelectStatusText(filter) {
        if (this.loading) {
            return filter.translations?.loading ?? 'Loading options';
        }
        if (this.multiSelectQueryState().trim()) {
            return filter.translations?.noResults ?? 'No results';
        }
        return filter.translations?.noOptions ?? 'No options';
    }
    onDateSpanValueChange(value) {
        this.commitValue(value);
    }
    onLoadMore() {
        this.loadMore.emit();
    }
    commitValue(value) {
        const definition = this.definitionState();
        if (!definition || this.disabled || this.loading) {
            return;
        }
        const normalizedValue = normalizeCxColumnFilterValue(definition, value);
        this.valueState.set(normalizedValue);
        this.valueChange.emit(normalizedValue);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxColumnFilterEditorComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxColumnFilterEditorComponent, isStandalone: true, selector: "cx-column-filter-editor", inputs: { definition: "definition", value: "value", label: "label", ariaLabel: "ariaLabel", disabled: "disabled", loading: "loading", showClearAction: "showClearAction" }, outputs: { valueChange: "valueChange", queryChange: "queryChange", loadMore: "loadMore" }, viewQueries: [{ propertyName: "primaryControlRef", first: true, predicate: ["primaryControl"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-column-filter-editor\"\n  [attr.data-filter-kind]=\"definition$()?.kind\"\n>\n  @if (label.trim() || (showClearAction && hasMultiSelectValue$())) {\n    <div class=\"cx-column-filter-editor__heading\">\n      @if (label.trim()) {\n        <div class=\"cx-column-filter-editor__label\">{{ label.trim() }}</div>\n      }\n      @if (showClearAction && hasMultiSelectValue$()) {\n        <button\n          type=\"button\"\n          class=\"cx-column-filter-editor__clear\"\n          [attr.aria-label]=\"'Clear ' + (label.trim() || 'column') + ' filter'\"\n          [disabled]=\"disabled || loading\"\n          (click)=\"clear()\"\n        >\n          Clear\n        </button>\n      }\n    </div>\n  }\n\n  @if (searchDefinition$(); as filter) {\n    <cx-text-field\n      #primaryControl\n      class=\"cx-column-filter-editor__control\"\n      label=\"\"\n      [ariaLabel]=\"resolvedAriaLabel()\"\n      [placeholder]=\"filter.placeholder ?? ''\"\n      [autocomplete]=\"filter.autocomplete\"\n      [disabled]=\"disabled\"\n      [loading]=\"loading\"\n      [clearable]=\"showClearAction\"\n      [prependIcon]=\"'search'\"\n      [hint]=\"filter.hint\"\n      [value]=\"searchValue$()\"\n      (valueChange)=\"onSearchValueChange($event)\"\n    />\n  }\n\n  @if (multiSelectDefinition$(); as filter) {\n    <div\n      #primaryControl\n      class=\"cx-column-filter-editor__multi-select\"\n      role=\"group\"\n      [attr.aria-label]=\"resolvedAriaLabel()\"\n      [attr.aria-busy]=\"loading || filter.loadingMore === true ? 'true' : null\"\n    >\n      @if (filter.searchable) {\n        <cx-text-field\n          class=\"cx-column-filter-editor__multi-select-search\"\n          label=\"\"\n          [ariaLabel]=\"filter.translations?.search ?? 'Search filter options'\"\n          [placeholder]=\"filter.placeholder ?? ''\"\n          [disabled]=\"disabled\"\n          [loading]=\"loading\"\n          [clearable]=\"true\"\n          [prependIcon]=\"'search'\"\n          [value]=\"multiSelectQueryState()\"\n          (valueChange)=\"onMultiSelectQueryChange($event)\"\n        />\n      }\n\n      @if (loading) {\n        <div\n          class=\"cx-column-filter-editor__status\"\n          role=\"status\"\n          aria-live=\"polite\"\n        >\n          {{ multiSelectStatusText(filter) }}\n        </div>\n      } @else {\n        <div class=\"cx-column-filter-editor__multi-select-options\">\n          @for (option of multiSelectOptions$(); track option.id) {\n            <cx-checkbox\n              class=\"cx-column-filter-editor__multi-select-option\"\n              [text]=\"option.label\"\n              [hint]=\"option.description\"\n              [selected]=\"isMultiSelectOptionSelected(option.id)\"\n              [disabled]=\"disabled || option.disabled === true\"\n              (selectedChange)=\"onMultiSelectOptionChange(option.id, $event)\"\n            />\n          } @empty {\n            <div\n              class=\"cx-column-filter-editor__status\"\n              role=\"status\"\n              aria-live=\"polite\"\n            >\n              {{ multiSelectStatusText(filter) }}\n            </div>\n          }\n        </div>\n      }\n\n      @if (filter.hint) {\n        <div class=\"cx-column-filter-editor__hint\">{{ filter.hint }}</div>\n      }\n\n      @if (filter.hasMore) {\n        <button\n          type=\"button\"\n          class=\"cx-column-filter-editor__load-more\"\n          [disabled]=\"disabled || loading || filter.loadingMore\"\n          (click)=\"onLoadMore()\"\n        >\n          {{\n            filter.loadingMore\n              ? (filter.translations?.loadingMore ?? 'Loading more options')\n              : 'Load more'\n          }}\n        </button>\n      }\n    </div>\n  }\n\n  @if (tagFieldDefinition$(); as filter) {\n    <cx-tag-field\n      #primaryControl\n      class=\"cx-column-filter-editor__control\"\n      label=\"\"\n      [ariaLabel]=\"resolvedAriaLabel()\"\n      [placeholder]=\"filter.placeholder ?? 'Select tags'\"\n      [disabled]=\"disabled\"\n      [loading]=\"loading\"\n      [optional]=\"true\"\n      [clearable]=\"showClearAction\"\n      [creatable]=\"false\"\n      [tags]=\"tagFieldTags$()\"\n      [values]=\"selectedValues$()\"\n      [emptyText]=\"filter.emptyText\"\n      [hint]=\"filter.hint\"\n      (valuesChange)=\"onSelectedValuesChange($event)\"\n    />\n  }\n\n  @if (dateSpanDefinition$(); as filter) {\n    <cx-date-span-picker\n      #primaryControl\n      class=\"cx-column-filter-editor__control\"\n      label=\"\"\n      [ariaLabel]=\"resolvedAriaLabel()\"\n      [placeholder]=\"filter.placeholder ?? 'Select date span'\"\n      [disabled]=\"disabled\"\n      [loading]=\"loading\"\n      [optional]=\"true\"\n      [clearable]=\"showClearAction\"\n      [hint]=\"filter.hint\"\n      [value]=\"dateSpanValue$()\"\n      [quickRanges]=\"dateSpanQuickRanges$()\"\n      [min]=\"filter.min\"\n      [max]=\"filter.max\"\n      [maxSpan]=\"filter.maxSpan\"\n      [disabledDates]=\"filter.disabledDates\"\n      [weekStart]=\"filter.weekStart ?? 'mon'\"\n      [timeEnabled]=\"filter.timeEnabled ?? false\"\n      [allDayEnabled]=\"false\"\n      [closeOnSelect]=\"filter.closeOnSelect ?? true\"\n      (valueChange)=\"onDateSpanValueChange($event)\"\n    />\n  }\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-column-filter-editor{display:grid;width:100%;min-width:0;gap:var(--space-xs)}.cx-column-filter-editor__heading{display:flex;min-width:0;align-items:baseline;justify-content:space-between;gap:var(--space-sm)}.cx-column-filter-editor__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-column-filter-editor__clear,.cx-column-filter-editor__load-more{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit}.cx-column-filter-editor__clear{flex:0 0 auto;font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-column-filter-editor__clear:hover,.cx-column-filter-editor__clear:focus-visible,.cx-column-filter-editor__load-more:hover,.cx-column-filter-editor__load-more:focus-visible{color:var(--ink)}.cx-column-filter-editor__clear:focus-visible,.cx-column-filter-editor__load-more:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-column-filter-editor__clear:disabled,.cx-column-filter-editor__load-more:disabled{opacity:var(--opacity-disabled, 0.45);pointer-events:none}.cx-column-filter-editor__control{display:block;width:100%;min-width:0}.cx-column-filter-editor__multi-select{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-column-filter-editor__multi-select-search{display:block;width:100%;min-width:0}.cx-column-filter-editor__multi-select-options{display:flex;max-height:min(320px,50vh);min-width:0;flex-direction:column;gap:var(--space-2xs);overflow-y:auto;overscroll-behavior:contain}.cx-column-filter-editor__multi-select-option{display:flex;width:100%;min-height:var(--controller-size-small);align-items:center}.cx-column-filter-editor__status,.cx-column-filter-editor__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-column-filter-editor__load-more{min-height:var(--controller-size);align-self:flex-start;font-size:var(--font-size-body-sm)}"], dependencies: [{ kind: "component", type: CxCheckboxComponent, selector: "cx-checkbox", inputs: ["text", "ariaLabel", "hint", "disabled", "selected", "value"], outputs: ["selectedChange", "valueChange", "focusChange"] }, { kind: "component", type: CxDateSpanPickerComponent, selector: "cx-date-span-picker", inputs: ["label", "ariaLabel", "placeholder", "hint", "disabled", "loading", "optional", "size", "timeEnabled", "allDayEnabled", "allDayStart", "allDayEnd", "min", "max", "maxSpan", "disabledDates", "weekStart", "clearable", "closeOnSelect", "quickRanges", "validation", "value"], outputs: ["valueChange", "allDayStartChange", "allDayEndChange"] }, { kind: "component", type: CxTagFieldComponent, selector: "cx-tag-field", inputs: ["label", "ariaLabel", "placeholder", "optional", "clearable", "size", "hint", "creatable", "disabled", "loading", "tags", "values", "validation", "emptyText"], outputs: ["valuesChange", "tagsChange", "createTag", "clear"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxColumnFilterEditorComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-column-filter-editor', imports: [
                        CxCheckboxComponent,
                        CxDateSpanPickerComponent,
                        CxTagFieldComponent,
                        CxTextFieldComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-column-filter-editor\"\n  [attr.data-filter-kind]=\"definition$()?.kind\"\n>\n  @if (label.trim() || (showClearAction && hasMultiSelectValue$())) {\n    <div class=\"cx-column-filter-editor__heading\">\n      @if (label.trim()) {\n        <div class=\"cx-column-filter-editor__label\">{{ label.trim() }}</div>\n      }\n      @if (showClearAction && hasMultiSelectValue$()) {\n        <button\n          type=\"button\"\n          class=\"cx-column-filter-editor__clear\"\n          [attr.aria-label]=\"'Clear ' + (label.trim() || 'column') + ' filter'\"\n          [disabled]=\"disabled || loading\"\n          (click)=\"clear()\"\n        >\n          Clear\n        </button>\n      }\n    </div>\n  }\n\n  @if (searchDefinition$(); as filter) {\n    <cx-text-field\n      #primaryControl\n      class=\"cx-column-filter-editor__control\"\n      label=\"\"\n      [ariaLabel]=\"resolvedAriaLabel()\"\n      [placeholder]=\"filter.placeholder ?? ''\"\n      [autocomplete]=\"filter.autocomplete\"\n      [disabled]=\"disabled\"\n      [loading]=\"loading\"\n      [clearable]=\"showClearAction\"\n      [prependIcon]=\"'search'\"\n      [hint]=\"filter.hint\"\n      [value]=\"searchValue$()\"\n      (valueChange)=\"onSearchValueChange($event)\"\n    />\n  }\n\n  @if (multiSelectDefinition$(); as filter) {\n    <div\n      #primaryControl\n      class=\"cx-column-filter-editor__multi-select\"\n      role=\"group\"\n      [attr.aria-label]=\"resolvedAriaLabel()\"\n      [attr.aria-busy]=\"loading || filter.loadingMore === true ? 'true' : null\"\n    >\n      @if (filter.searchable) {\n        <cx-text-field\n          class=\"cx-column-filter-editor__multi-select-search\"\n          label=\"\"\n          [ariaLabel]=\"filter.translations?.search ?? 'Search filter options'\"\n          [placeholder]=\"filter.placeholder ?? ''\"\n          [disabled]=\"disabled\"\n          [loading]=\"loading\"\n          [clearable]=\"true\"\n          [prependIcon]=\"'search'\"\n          [value]=\"multiSelectQueryState()\"\n          (valueChange)=\"onMultiSelectQueryChange($event)\"\n        />\n      }\n\n      @if (loading) {\n        <div\n          class=\"cx-column-filter-editor__status\"\n          role=\"status\"\n          aria-live=\"polite\"\n        >\n          {{ multiSelectStatusText(filter) }}\n        </div>\n      } @else {\n        <div class=\"cx-column-filter-editor__multi-select-options\">\n          @for (option of multiSelectOptions$(); track option.id) {\n            <cx-checkbox\n              class=\"cx-column-filter-editor__multi-select-option\"\n              [text]=\"option.label\"\n              [hint]=\"option.description\"\n              [selected]=\"isMultiSelectOptionSelected(option.id)\"\n              [disabled]=\"disabled || option.disabled === true\"\n              (selectedChange)=\"onMultiSelectOptionChange(option.id, $event)\"\n            />\n          } @empty {\n            <div\n              class=\"cx-column-filter-editor__status\"\n              role=\"status\"\n              aria-live=\"polite\"\n            >\n              {{ multiSelectStatusText(filter) }}\n            </div>\n          }\n        </div>\n      }\n\n      @if (filter.hint) {\n        <div class=\"cx-column-filter-editor__hint\">{{ filter.hint }}</div>\n      }\n\n      @if (filter.hasMore) {\n        <button\n          type=\"button\"\n          class=\"cx-column-filter-editor__load-more\"\n          [disabled]=\"disabled || loading || filter.loadingMore\"\n          (click)=\"onLoadMore()\"\n        >\n          {{\n            filter.loadingMore\n              ? (filter.translations?.loadingMore ?? 'Loading more options')\n              : 'Load more'\n          }}\n        </button>\n      }\n    </div>\n  }\n\n  @if (tagFieldDefinition$(); as filter) {\n    <cx-tag-field\n      #primaryControl\n      class=\"cx-column-filter-editor__control\"\n      label=\"\"\n      [ariaLabel]=\"resolvedAriaLabel()\"\n      [placeholder]=\"filter.placeholder ?? 'Select tags'\"\n      [disabled]=\"disabled\"\n      [loading]=\"loading\"\n      [optional]=\"true\"\n      [clearable]=\"showClearAction\"\n      [creatable]=\"false\"\n      [tags]=\"tagFieldTags$()\"\n      [values]=\"selectedValues$()\"\n      [emptyText]=\"filter.emptyText\"\n      [hint]=\"filter.hint\"\n      (valuesChange)=\"onSelectedValuesChange($event)\"\n    />\n  }\n\n  @if (dateSpanDefinition$(); as filter) {\n    <cx-date-span-picker\n      #primaryControl\n      class=\"cx-column-filter-editor__control\"\n      label=\"\"\n      [ariaLabel]=\"resolvedAriaLabel()\"\n      [placeholder]=\"filter.placeholder ?? 'Select date span'\"\n      [disabled]=\"disabled\"\n      [loading]=\"loading\"\n      [optional]=\"true\"\n      [clearable]=\"showClearAction\"\n      [hint]=\"filter.hint\"\n      [value]=\"dateSpanValue$()\"\n      [quickRanges]=\"dateSpanQuickRanges$()\"\n      [min]=\"filter.min\"\n      [max]=\"filter.max\"\n      [maxSpan]=\"filter.maxSpan\"\n      [disabledDates]=\"filter.disabledDates\"\n      [weekStart]=\"filter.weekStart ?? 'mon'\"\n      [timeEnabled]=\"filter.timeEnabled ?? false\"\n      [allDayEnabled]=\"false\"\n      [closeOnSelect]=\"filter.closeOnSelect ?? true\"\n      (valueChange)=\"onDateSpanValueChange($event)\"\n    />\n  }\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-column-filter-editor{display:grid;width:100%;min-width:0;gap:var(--space-xs)}.cx-column-filter-editor__heading{display:flex;min-width:0;align-items:baseline;justify-content:space-between;gap:var(--space-sm)}.cx-column-filter-editor__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-column-filter-editor__clear,.cx-column-filter-editor__load-more{padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit}.cx-column-filter-editor__clear{flex:0 0 auto;font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-column-filter-editor__clear:hover,.cx-column-filter-editor__clear:focus-visible,.cx-column-filter-editor__load-more:hover,.cx-column-filter-editor__load-more:focus-visible{color:var(--ink)}.cx-column-filter-editor__clear:focus-visible,.cx-column-filter-editor__load-more:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-column-filter-editor__clear:disabled,.cx-column-filter-editor__load-more:disabled{opacity:var(--opacity-disabled, 0.45);pointer-events:none}.cx-column-filter-editor__control{display:block;width:100%;min-width:0}.cx-column-filter-editor__multi-select{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-xs)}.cx-column-filter-editor__multi-select-search{display:block;width:100%;min-width:0}.cx-column-filter-editor__multi-select-options{display:flex;max-height:min(320px,50vh);min-width:0;flex-direction:column;gap:var(--space-2xs);overflow-y:auto;overscroll-behavior:contain}.cx-column-filter-editor__multi-select-option{display:flex;width:100%;min-height:var(--controller-size-small);align-items:center}.cx-column-filter-editor__status,.cx-column-filter-editor__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-column-filter-editor__load-more{min-height:var(--controller-size);align-self:flex-start;font-size:var(--font-size-body-sm)}"] }]
        }], propDecorators: { primaryControlRef: [{
                type: ViewChild,
                args: ['primaryControl', { read: ElementRef }]
            }], definition: [{
                type: Input,
                args: [{ required: true }]
            }], value: [{
                type: Input
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], showClearAction: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], queryChange: [{
                type: Output
            }], loadMore: [{
                type: Output
            }] } });
