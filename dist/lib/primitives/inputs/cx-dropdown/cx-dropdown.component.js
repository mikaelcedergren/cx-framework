import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewChildren, computed, inject, signal, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxTextFieldComponent } from '../cx-text-field/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxOptionComponent } from '../../overlay/cx-option/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { normalizeCxValidation } from '../shared/field.types.js';
import { CxHostVisibilityObserver } from '../../shared/host-visibility.js';
import * as i0 from "@angular/core";
const CX_DROPDOWN_POPOVER_MIN_WIDTH = 200;
const CX_DROPDOWN_POPOVER_MAX_WIDTH = 360;
const CX_DROPDOWN_POPOVER_MAX_HEIGHT = 360;
const CX_DROPDOWN_POPOVER_FRAME_HEIGHT = 8;
const CX_DROPDOWN_TYPEAHEAD_RESET_MS = 700;
const CX_DROPDOWN_OPTION_FOCUS_RETRIES = 12;
const CX_DROPDOWN_OPTION_FOCUS_RETRY_MS = 16;
const CX_DROPDOWN_OPTION_HEIGHT = 32;
const CX_DROPDOWN_VIRTUALIZATION_THRESHOLD = 80;
const CX_DROPDOWN_VIRTUAL_BUFFER = 4;
const CX_DROPDOWN_LOAD_MORE_DISTANCE = 96;
const CX_DROPDOWN_DEFAULT_TRANSLATIONS = {
    optional: 'Optional',
    search: 'Search options',
    clear: 'Clear selection',
    loading: 'Loading options',
    loadingDescription: 'Options will appear here.',
    loadingMore: 'Loading more options',
    noResults: 'No results',
    noResultsDescription: 'No matching options',
    noOptions: 'No options',
    noOptionsDescription: 'No options are available yet.',
    createLabel: 'Create option',
    selectedCount: '{count} selected',
};
export class CxDropdownComponent {
    static nextId = 0;
    instanceId = CxDropdownComponent.nextId++;
    host = inject((ElementRef));
    hostVisibility = new CxHostVisibilityObserver(this.host.nativeElement, visible => {
        if (!visible && this.openState()) {
            this.closePopover();
        }
    });
    optionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionsState" }] : /* istanbul ignore next */ []));
    selectionState = signal('single', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectionState" }] : /* istanbul ignore next */ []));
    filterModeState = signal('client', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filterModeState" }] : /* istanbul ignore next */ []));
    searchableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchableState" }] : /* istanbul ignore next */ []));
    creatableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "creatableState" }] : /* istanbul ignore next */ []));
    selectedValueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedValueState" }] : /* istanbul ignore next */ []));
    selectedValuesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedValuesState" }] : /* istanbul ignore next */ []));
    // Options that were selected at some point. Keeps labels resolvable when
    // availableValues no longer contains a selected option (manual filtering,
    // paged loading), where the current snapshot is not the full option set.
    knownSelectedOptionsState = signal(new Map(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "knownSelectedOptionsState" }] : /* istanbul ignore next */ []));
    clearableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "clearableState" }] : /* istanbul ignore next */ []));
    hasMoreState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasMoreState" }] : /* istanbul ignore next */ []));
    loadingMoreState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingMoreState" }] : /* istanbul ignore next */ []));
    placeholderState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "placeholderState" }] : /* istanbul ignore next */ []));
    translationsState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "translationsState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    searchQueryState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchQueryState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    activeOptionIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeOptionIdState" }] : /* istanbul ignore next */ []));
    activeCreateState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeCreateState" }] : /* istanbul ignore next */ []));
    scrollTopState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "scrollTopState" }] : /* istanbul ignore next */ []));
    optionsViewportHeightState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionsViewportHeightState" }] : /* istanbul ignore next */ []));
    optionHeightState = signal(CX_DROPDOWN_OPTION_HEIGHT, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionHeightState" }] : /* istanbul ignore next */ []));
    overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport), () => this.popoverRef?.surfaceElement());
    popoverMaxWidth = CX_DROPDOWN_POPOVER_MAX_WIDTH;
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    requiredValueValidationQueued = false;
    reportedInvalidValue = false;
    searchFocusTimer;
    openFocusTimer;
    typeaheadTimer;
    typeaheadBuffer = '';
    optionFocusRetryTimer;
    pendingOptionFocusIndex;
    selectionMeasureFrame;
    optionMeasureFrame;
    loadMoreRequested = false;
    openTracking = false;
    selectionResizeObserver;
    selectionResizeElement;
    labelId = `cx-dropdown-label-${this.instanceId}`;
    messagesId = `cx-dropdown-messages-${this.instanceId}`;
    popoverId = `cx-dropdown-popover-${this.instanceId}`;
    listboxId = `cx-dropdown-listbox-${this.instanceId}`;
    fieldButtonRef;
    popoverRef;
    searchInputRef;
    valueTextRef;
    selectionMeasureRef;
    optionRefs;
    optionComponents;
    createRowComponent;
    optionsScrollerRef;
    isMultiple$ = computed(() => this.selectionState() === 'multiple', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isMultiple$" }] : /* istanbul ignore next */ []));
    selectedOption$ = computed(() => {
        const selectedValue = this.selectedValueState();
        if (!selectedValue) {
            return undefined;
        }
        return (this.optionsState().find(option => option.id === selectedValue) ??
            this.knownSelectedOptionsState().get(selectedValue));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedOption$" }] : /* istanbul ignore next */ []));
    selectedOptions$ = computed(() => {
        const selectedValues = this.selectedValuesState();
        if (!this.isMultiple$()) {
            const selectedOption = this.selectedOption$();
            return selectedOption ? [selectedOption] : [];
        }
        const fromOptions = this.optionsState().filter(option => selectedValues.includes(option.id));
        const presentIds = new Set(fromOptions.map(option => option.id));
        const known = this.knownSelectedOptionsState();
        const fromKnown = selectedValues
            .filter(selectedValue => !presentIds.has(selectedValue))
            .map(selectedValue => known.get(selectedValue))
            .filter((option) => option !== undefined);
        return [...fromOptions, ...fromKnown];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedOptions$" }] : /* istanbul ignore next */ []));
    placeholderText$ = computed(() => {
        const explicitPlaceholder = this.placeholderState().trim();
        if (explicitPlaceholder) {
            return explicitPlaceholder;
        }
        const subject = this.selectPlaceholderSubject();
        return subject ? `Select ${subject}` : 'Select';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "placeholderText$" }] : /* istanbul ignore next */ []));
    emptyDescription$ = computed(() => this.translation('noResultsDescription'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "emptyDescription$" }] : /* istanbul ignore next */ []));
    showSearchEmptyState$ = computed(() => this.searchQueryState().trim().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showSearchEmptyState$" }] : /* istanbul ignore next */ []));
    createLabel$ = computed(() => this.translation('createLabel'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "createLabel$" }] : /* istanbul ignore next */ []));
    selectedLabelsText$ = computed(() => this.selectedOptions$()
        .map(option => option.label)
        .join(', '), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedLabelsText$" }] : /* istanbul ignore next */ []));
    selectedCountText$ = computed(() => this.formatSelectedCount(this.selectedOptions$().length), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedCountText$" }] : /* istanbul ignore next */ []));
    collapseSelectedText$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "collapseSelectedText$" }] : /* istanbul ignore next */ []));
    emptyDisplayText$ = computed(() => this.placeholderText$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "emptyDisplayText$" }] : /* istanbul ignore next */ []));
    displayText$ = computed(() => {
        if (this.isMultiple$()) {
            const selectedOptions = this.selectedOptions$();
            if (selectedOptions.length > 0) {
                return this.collapseSelectedText$() ? this.selectedCountText$() : this.selectedLabelsText$();
            }
            return this.emptyDisplayText$();
        }
        return this.selectedOption$()?.label || this.emptyDisplayText$();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayText$" }] : /* istanbul ignore next */ []));
    showPlaceholder$ = computed(() => {
        if (this.isMultiple$()) {
            return this.selectedOptions$().length === 0;
        }
        return !this.selectedOption$();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showPlaceholder$" }] : /* istanbul ignore next */ []));
    filteredOptions$ = computed(() => {
        if (!this.searchEnabled$() || this.filterModeState() === 'manual') {
            return this.optionsState();
        }
        const query = this.searchQueryState().trim().toLowerCase();
        if (!query) {
            return this.optionsState();
        }
        return this.optionsState().filter(option => {
            const haystack = [option.label, option.description, ...(Array.isArray(option.keywords) ? option.keywords : [])]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filteredOptions$" }] : /* istanbul ignore next */ []));
    virtualizedOptions$ = computed(() => this.filteredOptions$().length > CX_DROPDOWN_VIRTUALIZATION_THRESHOLD, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "virtualizedOptions$" }] : /* istanbul ignore next */ []));
    renderedOptions$ = computed(() => {
        const options = this.filteredOptions$();
        if (!this.virtualizedOptions$()) {
            return options.map((option, index) => ({ option, index }));
        }
        const optionHeight = this.optionHeightState();
        const viewportHeight = this.optionsViewportHeightState() || 320;
        const visibleCount = Math.ceil(viewportHeight / optionHeight);
        const start = Math.max(0, Math.floor(this.scrollTopState() / optionHeight) - CX_DROPDOWN_VIRTUAL_BUFFER);
        const end = Math.min(options.length, start + visibleCount + CX_DROPDOWN_VIRTUAL_BUFFER * 2);
        return options.slice(start, end).map((option, offset) => ({ option, index: start + offset }));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderedOptions$" }] : /* istanbul ignore next */ []));
    virtualOptionsHeight$ = computed(() => this.virtualizedOptions$() ? this.filteredOptions$().length * this.optionHeightState() : 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "virtualOptionsHeight$" }] : /* istanbul ignore next */ []));
    virtualOptionsOffset$ = computed(() => this.virtualizedOptions$()
        ? `translateY(${(this.renderedOptions$()[0]?.index ?? 0) * this.optionHeightState()}px)`
        : 'translateY(0)', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "virtualOptionsOffset$" }] : /* istanbul ignore next */ []));
    labelText$ = computed(() => {
        const trimmedLabel = this.label.trim();
        return trimmedLabel || '';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "labelText$" }] : /* istanbul ignore next */ []));
    searchEnabled$ = computed(() => this.searchableState() || this.creatableState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchEnabled$" }] : /* istanbul ignore next */ []));
    createValue$ = computed(() => this.searchQueryState().trim(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "createValue$" }] : /* istanbul ignore next */ []));
    label = 'Entity';
    ariaLabel;
    name;
    transparent = false;
    set translations(value) {
        this.translationsState.set(value ?? {});
    }
    set placeholder(value) {
        this.placeholderState.set(value ?? '');
        this.scheduleRequiredValueValidation();
    }
    size = 'default';
    optional = false;
    disabled = false;
    loading = false;
    set loadingMore(value) {
        const nextLoadingMore = value === true;
        this.loadingMoreState.set(nextLoadingMore);
        if (!nextLoadingMore) {
            this.loadMoreRequested = false;
        }
    }
    set hasMore(value) {
        const nextHasMore = value === true;
        this.hasMoreState.set(nextHasMore);
        if (!nextHasMore) {
            this.loadMoreRequested = false;
        }
    }
    set clearable(value) {
        this.clearableState.set(value === true);
        this.scheduleRequiredValueValidation();
        this.scheduleSelectionDisplayMeasurement();
    }
    set selection(value) {
        this.selectionState.set(value === 'multiple' ? 'multiple' : 'single');
        this.scheduleRequiredValueValidation();
        this.scheduleSelectionDisplayMeasurement();
    }
    set filterMode(value) {
        this.filterModeState.set(value === 'manual' ? 'manual' : 'client');
        this.resetOptionScroll();
    }
    set searchable(value) {
        this.searchableState.set(value === true);
        if (!this.searchEnabled$()) {
            this.setSearchQuery('', false);
        }
    }
    set creatable(value) {
        this.creatableState.set(value === true);
        if (!this.searchEnabled$()) {
            this.setSearchQuery('', false);
        }
    }
    hint;
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set availableValues(value) {
        const previousLength = this.optionsState().length;
        const nextOptions = value ?? [];
        this.optionsState.set(nextOptions);
        if (nextOptions.length !== previousLength) {
            this.loadMoreRequested = false;
            // The option set changed materially, so the locked surface width no
            // longer reflects the content; re-measure on the next sync.
            this.overlay.resetMeasurement();
            if (this.openState()) {
                queueMicrotask(() => {
                    this.overlay.sync();
                });
            }
        }
        if (!this.searchEnabled$()) {
            this.setSearchQuery('', false);
        }
        this.rememberSelectedOptions();
        this.scheduleRequiredValueValidation();
        this.scheduleSelectionDisplayMeasurement();
    }
    set value(value) {
        this.selectedValueState.set(value);
        this.rememberSelectedOptions();
        this.scheduleRequiredValueValidation();
        this.scheduleSelectionDisplayMeasurement();
    }
    set values(value) {
        this.selectedValuesState.set(this.normalizeSelectedValues(value));
        this.rememberSelectedOptions();
        this.scheduleRequiredValueValidation();
        this.scheduleSelectionDisplayMeasurement();
    }
    valueChange = new EventEmitter();
    valuesChange = new EventEmitter();
    create = new EventEmitter();
    focusChange = new EventEmitter();
    clear = new EventEmitter();
    openChange = new EventEmitter();
    queryChange = new EventEmitter();
    loadMore = new EventEmitter();
    isOpen$ = this.openState.asReadonly();
    searchQuery$ = this.searchQueryState.asReadonly();
    selection$ = this.selectionState.asReadonly();
    filterMode$ = this.filterModeState.asReadonly();
    creatable$ = this.creatableState.asReadonly();
    hasMore$ = this.hasMoreState.asReadonly();
    loadingMore$ = this.loadingMoreState.asReadonly();
    activeOptionId$ = this.activeOptionIdState.asReadonly();
    activeCreate$ = this.activeCreateState.asReadonly();
    validationMessages$ = () => (this.disabled ? [] : normalizeCxValidation(this.validationState()));
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
    isLocked$ = () => this.disabled;
    isInteractive$ = () => !this.disabled;
    canCommitSelection$ = () => !this.disabled && !this.loading;
    hasClear$ = () => this.clearableState() && this.canCommitSelection$() && this.selectedOptions$().length > 0;
    formValues$ = computed(() => this.isMultiple$() ? this.selectedValuesState() : [this.selectedValueState() ?? ''], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "formValues$" }] : /* istanbul ignore next */ []));
    isRequired$ = () => !this.optional;
    optionalText$ = computed(() => this.translation('optional'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "optionalText$" }] : /* istanbul ignore next */ []));
    searchAriaLabel$ = computed(() => this.translation('search'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchAriaLabel$" }] : /* istanbul ignore next */ []));
    clearAriaLabel$ = computed(() => this.translation('clear'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "clearAriaLabel$" }] : /* istanbul ignore next */ []));
    loadingText$ = computed(() => this.translation('loading'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingText$" }] : /* istanbul ignore next */ []));
    loadingDescriptionText$ = computed(() => this.translation('loadingDescription'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingDescriptionText$" }] : /* istanbul ignore next */ []));
    loadingMoreText$ = computed(() => this.translation('loadingMore'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingMoreText$" }] : /* istanbul ignore next */ []));
    noResultsText$ = computed(() => this.translation('noResults'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "noResultsText$" }] : /* istanbul ignore next */ []));
    noOptionsText$ = computed(() => this.translation('noOptions'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "noOptionsText$" }] : /* istanbul ignore next */ []));
    noOptionsDescriptionText$ = computed(() => this.translation('noOptionsDescription'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "noOptionsDescriptionText$" }] : /* istanbul ignore next */ []));
    get resolvedName() {
        return this.name?.trim() || null;
    }
    get resolvedFieldAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        if (this.labelText$()) {
            return undefined;
        }
        return this.placeholderText$() || 'Select';
    }
    get resolvedFieldAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.labelText$() ? this.labelId : undefined;
    }
    get resolvedFieldAriaDescribedBy() {
        const ids = [];
        if (this.showHint$() || this.validationMessages$().length > 0) {
            ids.push(this.messagesId);
        }
        return ids.length > 0 ? ids.join(' ') : undefined;
    }
    ngAfterViewInit() {
        this.overlay.setTrigger(this.fieldButtonRef?.nativeElement);
        if (this.openState()) {
            this.stopOpenTracking();
            this.startOpenTracking();
            this.overlay.sync();
        }
        this.scheduleRequiredValueValidation();
        this.scheduleSelectionDisplayMeasurement();
    }
    ngOnDestroy() {
        this.stopOpenTracking();
        this.selectionResizeObserver?.disconnect();
        this.selectionResizeObserver = undefined;
        this.selectionResizeElement = undefined;
        this.overlay.destroy();
        if (typeof window !== 'undefined' && this.selectionMeasureFrame !== undefined) {
            window.cancelAnimationFrame(this.selectionMeasureFrame);
        }
        if (typeof window !== 'undefined' && this.optionMeasureFrame !== undefined) {
            window.cancelAnimationFrame(this.optionMeasureFrame);
        }
        if (typeof window !== 'undefined' && this.searchFocusTimer) {
            window.clearTimeout(this.searchFocusTimer);
        }
        if (typeof window !== 'undefined' && this.openFocusTimer) {
            window.clearTimeout(this.openFocusTimer);
        }
        if (typeof window !== 'undefined' && this.typeaheadTimer) {
            window.clearTimeout(this.typeaheadTimer);
        }
        this.clearOptionFocusRetry();
    }
    toggleOpen(field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (this.openState()) {
            this.closePopover();
            return;
        }
        this.openDropdown(field, this.searchEnabled$() ? 'search' : 'selected');
    }
    toggleOpenFromPointer(field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (this.openState()) {
            this.closePopover();
            return;
        }
        this.openDropdown(field, 'none');
    }
    selectOption(option, focusField = false) {
        if (!this.canCommitSelection$() || option.disabled) {
            return;
        }
        if (this.isMultiple$()) {
            const currentValues = this.selectedValuesState();
            const isSelected = currentValues.includes(option.id);
            const nextValues = isSelected
                ? currentValues.filter(selectedValue => selectedValue !== option.id)
                : [...currentValues, option.id];
            this.selectedValuesState.set(nextValues);
            this.rememberSelectedOptions();
            this.valuesChange.emit(nextValues);
            this.validateRequiredValueState();
            this.scheduleSelectionDisplayMeasurement();
            return;
        }
        this.selectedValueState.set(option.id);
        this.rememberSelectedOptions();
        this.valueChange.emit(option.id);
        this.closePopover();
        if (focusField) {
            queueMicrotask(() => {
                this.focusField();
            });
        }
        this.validateRequiredValueState();
        this.scheduleSelectionDisplayMeasurement();
    }
    isOptionSelected(optionId) {
        if (this.isMultiple$()) {
            return this.selectedValuesState().includes(optionId);
        }
        return this.selectedOption$()?.id === optionId;
    }
    isOptionDisabled(option) {
        return option.disabled === true;
    }
    onFieldKeydown(event, field) {
        if (!this.isInteractive$()) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            // Typeahead can leave the popover open with a pending active option
            // while DOM focus is still on the field (the virtualized target had not
            // mounted yet); committing that choice beats silently discarding it.
            if (this.openState() && !this.isMultiple$() && this.commitActiveOption()) {
                return;
            }
            this.toggleOpen(field);
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.openDropdown(field, 'selected');
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.openDropdown(field, 'last');
            return;
        }
        if (event.key === 'Escape') {
            // Only consume Escape when it actually closes the popover; otherwise it
            // stays available to outer dismiss layers (dialogs, detail panels).
            if (this.openState()) {
                event.preventDefault();
                event.stopPropagation();
                this.closePopover();
            }
            return;
        }
        if (this.handleSearchTypeaheadKey(event, field)) {
            event.preventDefault();
            return;
        }
        if (this.handleTypeaheadKey(event)) {
            event.preventDefault();
        }
    }
    onSearchKeydown(event) {
        if (!this.isInteractive$()) {
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            this.commitSearchSelection();
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusOptionByTarget('selected');
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusOptionByTarget('last');
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeAndFocusField();
        }
    }
    onOptionKeydown(event, option) {
        if (!this.isInteractive$()) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.selectOption(option, true);
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusNextOption(option.id, 1);
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusNextOption(option.id, -1);
            return;
        }
        if (event.key === 'Home') {
            event.preventDefault();
            this.focusOptionByTarget('first');
            return;
        }
        if (event.key === 'End') {
            event.preventDefault();
            this.focusOptionByTarget(this.creatableState() ? 'create' : 'last');
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeAndFocusField();
            return;
        }
        if (event.key === 'Tab') {
            this.closePopover();
            return;
        }
        if (this.handleSearchTypeaheadKey(event)) {
            event.preventDefault();
            return;
        }
        if (this.handleTypeaheadKey(event)) {
            event.preventDefault();
        }
    }
    onCreateKeydown(event) {
        if (!this.creatableState() || !this.isInteractive$()) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.onCreateOption(event);
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusOptionByTarget('last');
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusOptionByTarget('first');
            return;
        }
        if (event.key === 'Home') {
            event.preventDefault();
            this.focusOptionByTarget('first');
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeAndFocusField();
            return;
        }
        if (event.key === 'Tab') {
            this.closePopover();
        }
    }
    onSearchChange(value) {
        this.setSearchQuery(value);
        this.clearActiveOption();
        if (this.openState()) {
            queueMicrotask(() => {
                this.resetOptionScroll();
                this.overlay.sync();
            });
        }
    }
    closePopover() {
        this.setSearchQuery('');
        this.clearActiveOption();
        this.typeaheadBuffer = '';
        if (typeof window !== 'undefined' && this.typeaheadTimer) {
            window.clearTimeout(this.typeaheadTimer);
            this.typeaheadTimer = undefined;
        }
        if (typeof window !== 'undefined' && this.openFocusTimer) {
            window.clearTimeout(this.openFocusTimer);
            this.openFocusTimer = undefined;
        }
        if (typeof window !== 'undefined' && this.searchFocusTimer) {
            window.clearTimeout(this.searchFocusTimer);
            this.searchFocusTimer = undefined;
        }
        this.setOpen(false);
    }
    clearSelection(event) {
        if (!this.hasClear$()) {
            return;
        }
        event?.preventDefault();
        event?.stopPropagation();
        if (this.isMultiple$()) {
            this.selectedValuesState.set([]);
            this.valuesChange.emit([]);
        }
        else {
            this.selectedValueState.set(undefined);
            this.valueChange.emit(undefined);
        }
        this.rememberSelectedOptions();
        this.closePopover();
        this.clear.emit();
        this.validateRequiredValueState();
        this.scheduleSelectionDisplayMeasurement();
    }
    onCreateOption(event) {
        if (!this.creatableState() || !this.canCommitSelection$()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.create.emit(this.createValue$());
        this.closeAndFocusField();
    }
    onComponentFocusIn() {
        if (this.focusedState()) {
            return;
        }
        this.focusedState.set(true);
        this.focusChange.emit(true);
    }
    onComponentFocusOut(event) {
        const target = event.relatedTarget;
        if (target instanceof Node) {
            const surface = this.popoverRef?.surfaceElement();
            if (this.host.nativeElement.contains(target) || surface?.contains(target)) {
                return;
            }
        }
        if (!this.focusedState()) {
            return;
        }
        this.focusedState.set(false);
        this.focusChange.emit(false);
    }
    onDocumentPointerDown(event) {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            this.closePopover();
            return;
        }
        if (this.host.nativeElement.contains(target)) {
            return;
        }
        // The popover surface is portaled to <body>, so options aren't descendants
        // of the cx-dropdown host. Treat clicks inside the surface as "inside" too —
        // otherwise WebKit closes the popover on pointerdown, the option is gone
        // by pointerup, and no click ever reaches selectOption.
        const surface = this.popoverRef?.surfaceElement();
        if (surface && surface.contains(target)) {
            return;
        }
        this.closePopover();
    }
    onWindowResize() {
        if (!this.hostVisibility.check()) {
            return;
        }
        this.scheduleSelectionDisplayMeasurement();
        this.overlay.sync();
        this.updateOptionsViewport();
        this.maybeEmitLoadMore();
    }
    onOptionsScroll(event) {
        const target = event.currentTarget;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        this.scrollTopState.set(target.scrollTop);
        this.optionsViewportHeightState.set(target.clientHeight);
        this.scheduleOptionHeightMeasurement();
        this.maybeEmitLoadMore(target);
    }
    onCapturedDocumentScroll = (event) => {
        if (!this.openState()) {
            return;
        }
        if (!this.hostVisibility.check()) {
            return;
        }
        const target = event.target;
        const surface = this.popoverRef?.surfaceElement();
        if (target instanceof Node && surface?.contains(target)) {
            return;
        }
        this.overlay.sync();
        this.updateOptionsViewport();
        this.maybeEmitLoadMore();
    };
    setOpen(open) {
        if (this.openState() === open) {
            return;
        }
        this.openState.set(open);
        if (open) {
            this.startOpenTracking();
        }
        else {
            this.stopOpenTracking();
        }
        this.openChange.emit(open);
        if (!open) {
            this.resetOptionScroll();
            this.overlay.endSession();
        }
    }
    setSearchQuery(value, emit = true) {
        if (this.searchQueryState() === value) {
            return;
        }
        this.searchQueryState.set(value);
        this.loadMoreRequested = false;
        this.resetOptionScroll();
        if (emit) {
            this.queryChange.emit(value);
        }
    }
    resetOptionScroll() {
        this.scrollTopState.set(0);
        const scroller = this.optionsScrollerRef?.nativeElement;
        if (scroller) {
            scroller.scrollTop = 0;
            this.optionsViewportHeightState.set(scroller.clientHeight);
        }
    }
    scheduleOpenFocus(callback) {
        if (typeof window === 'undefined') {
            queueMicrotask(callback);
            return;
        }
        if (this.openFocusTimer) {
            window.clearTimeout(this.openFocusTimer);
        }
        this.openFocusTimer = window.setTimeout(() => {
            this.openFocusTimer = undefined;
            callback();
        });
    }
    openDropdown(field, focusTarget = 'search') {
        if (!this.isInteractive$()) {
            return;
        }
        const resolvedFocusTarget = this.searchEnabled$() ? 'search' : focusTarget;
        this.overlay.setTrigger(field);
        this.setOpen(true);
        this.scheduleOpenFocus(() => {
            this.overlay.sync(field);
            this.updateOptionsViewport();
            this.scheduleOptionHeightMeasurement();
            this.scrollOpenTargetIntoView(resolvedFocusTarget);
            this.focusOptionByTarget(resolvedFocusTarget);
            this.maybeEmitLoadMore();
        });
    }
    closeAndFocusField() {
        this.closePopover();
        queueMicrotask(() => {
            this.focusField();
        });
    }
    focusField() {
        this.clearActiveOption();
        const field = this.overlay.trigger ?? this.fieldButtonRef?.nativeElement;
        field?.focus();
    }
    focusOptionByTarget(target) {
        if (target === 'none') {
            return;
        }
        if (target === 'search') {
            if (this.searchEnabled$()) {
                this.focusSearchInput();
                return;
            }
            target = 'selected';
        }
        if (target === 'create') {
            if (this.focusCreateOption()) {
                return;
            }
            target = 'last';
        }
        const optionIndexes = this.enabledOptionIndexes();
        if (optionIndexes.length === 0) {
            if (this.creatableState()) {
                this.focusCreateOption();
            }
            return;
        }
        let nextIndex;
        if (target === 'last') {
            nextIndex = optionIndexes[optionIndexes.length - 1];
        }
        else if (target === 'selected') {
            nextIndex = this.selectedOptionIndex();
            if (nextIndex === undefined || !optionIndexes.includes(nextIndex)) {
                nextIndex = optionIndexes[0];
            }
        }
        else {
            nextIndex = optionIndexes[0];
        }
        if (nextIndex !== undefined) {
            this.focusOptionAtIndex(nextIndex);
        }
    }
    focusNextOption(optionId, direction) {
        const optionIndexes = this.enabledOptionIndexes();
        if (optionIndexes.length === 0) {
            if (direction === 1 && this.creatableState()) {
                this.focusCreateOption();
            }
            else if (this.searchEnabled$()) {
                this.focusSearchInput();
            }
            return;
        }
        const currentOptionIndex = this.filteredOptions$().findIndex(option => option.id === optionId);
        const currentEnabledIndex = optionIndexes.indexOf(currentOptionIndex);
        if (currentEnabledIndex < 0) {
            this.focusOptionAtIndex(optionIndexes[0]);
            return;
        }
        const nextEnabledIndex = currentEnabledIndex + direction;
        if (nextEnabledIndex >= optionIndexes.length) {
            if (this.creatableState() && this.focusCreateOption()) {
                return;
            }
            this.focusOptionAtIndex(optionIndexes[0]);
            return;
        }
        if (nextEnabledIndex < 0) {
            if (this.searchEnabled$()) {
                this.focusSearchInput();
                return;
            }
            this.focusOptionAtIndex(optionIndexes[optionIndexes.length - 1]);
            return;
        }
        this.focusOptionAtIndex(optionIndexes[nextEnabledIndex]);
    }
    focusOptionAtIndex(index) {
        const option = this.filteredOptions$()[index];
        if (!option || this.isOptionDisabled(option)) {
            return false;
        }
        this.activeOptionIdState.set(option.id);
        this.activeCreateState.set(false);
        this.parkFocusForVirtualJump(index);
        this.scrollOptionIntoView(index);
        this.scheduleOptionFocus(index);
        return true;
    }
    /**
     * A far jump in a virtualized list unmounts the currently focused option
     * before the target renders; without a waypoint the browser drops focus to
     * <body> and every further key (typeahead, Enter) is lost. Parking on the
     * field keeps the keyboard conversation alive until the target mounts.
     */
    parkFocusForVirtualJump(index) {
        if (typeof document === 'undefined' || this.optionHostAtIndex(index)) {
            return;
        }
        if (this.currentFocusedOptionIndex() < 0) {
            return;
        }
        const field = this.overlay.trigger ?? this.fieldButtonRef?.nativeElement;
        field?.focus();
    }
    scrollOpenTargetIntoView(focusTarget) {
        if (this.loading || this.searchQueryState().trim()) {
            return;
        }
        const optionIndexes = this.enabledOptionIndexes();
        if (optionIndexes.length === 0) {
            return;
        }
        if (focusTarget === 'last') {
            this.scrollOptionIntoView(optionIndexes[optionIndexes.length - 1], 'center');
            return;
        }
        const selectedIndex = this.selectedOptionIndex();
        if (selectedIndex !== undefined && optionIndexes.includes(selectedIndex)) {
            this.scrollOptionIntoView(selectedIndex, 'center');
        }
    }
    scrollOptionIntoView(index, align = 'nearest') {
        const scroller = this.optionsScrollerRef?.nativeElement;
        if (!scroller) {
            return;
        }
        this.updateOptionsViewport(scroller);
        const optionHeight = this.optionHeightState();
        const optionTop = index * optionHeight;
        const optionBottom = optionTop + optionHeight;
        let nextScrollTop = scroller.scrollTop;
        if (align === 'center') {
            nextScrollTop = optionTop - Math.max((scroller.clientHeight - optionHeight) / 2, 0);
        }
        else if (optionTop < scroller.scrollTop) {
            nextScrollTop = optionTop;
        }
        else if (optionBottom > scroller.scrollTop + scroller.clientHeight) {
            nextScrollTop = optionBottom - scroller.clientHeight;
        }
        nextScrollTop = Math.max(0, Math.min(nextScrollTop, scroller.scrollHeight - scroller.clientHeight));
        scroller.scrollTop = nextScrollTop;
        this.scrollTopState.set(nextScrollTop);
    }
    scheduleOptionFocus(index) {
        this.pendingOptionFocusIndex = index;
        this.clearOptionFocusRetry();
        const tryFocus = () => {
            // preventScroll: the component owns scroll position. A browser
            // scroll-into-view here races the virtual window's offset update and
            // corrupts scrollTop, which re-renders the window and unmounts the
            // freshly focused option.
            this.optionComponentAtIndex(index)?.focus({ preventScroll: true });
            const optionHost = this.optionHostAtIndex(index);
            return Boolean(optionHost && typeof document !== 'undefined' && optionHost.contains(document.activeElement));
        };
        queueMicrotask(() => {
            if (this.pendingOptionFocusIndex !== index) {
                return;
            }
            if (tryFocus() || typeof window === 'undefined') {
                this.pendingOptionFocusIndex = undefined;
                return;
            }
            // A virtualized target may take a couple of change-detection passes to
            // mount — and on a cold popover the scroller itself may not exist yet,
            // dropping the scroll silently. Re-issue the scroll and retry briefly
            // instead of abandoning keyboard focus.
            let attempts = 0;
            const retry = () => {
                this.optionFocusRetryTimer = undefined;
                if (this.pendingOptionFocusIndex !== index || !this.openState()) {
                    return;
                }
                if (!this.optionHostAtIndex(index)) {
                    this.scrollOptionIntoView(index);
                }
                if (tryFocus()) {
                    this.pendingOptionFocusIndex = undefined;
                    return;
                }
                attempts += 1;
                if (attempts < CX_DROPDOWN_OPTION_FOCUS_RETRIES) {
                    this.optionFocusRetryTimer = window.setTimeout(retry, CX_DROPDOWN_OPTION_FOCUS_RETRY_MS);
                }
            };
            this.optionFocusRetryTimer = window.setTimeout(retry);
        });
    }
    clearOptionFocusRetry() {
        if (typeof window !== 'undefined' && this.optionFocusRetryTimer !== undefined) {
            window.clearTimeout(this.optionFocusRetryTimer);
            this.optionFocusRetryTimer = undefined;
        }
    }
    optionHostAtIndex(index) {
        return this.optionRefs
            ?.toArray()
            .find(optionRef => Number(optionRef.nativeElement.dataset['cxDropdownOptionIndex']) === index)?.nativeElement;
    }
    optionComponentAtIndex(index) {
        const refs = this.optionRefs?.toArray() ?? [];
        const position = refs.findIndex(optionRef => Number(optionRef.nativeElement.dataset['cxDropdownOptionIndex']) === index);
        return position >= 0 ? this.optionComponents?.toArray()[position] : undefined;
    }
    focusCreateOption() {
        this.activeOptionIdState.set(undefined);
        this.activeCreateState.set(true);
        this.createRowComponent?.focus();
        return Boolean(this.createRowComponent);
    }
    clearActiveOption() {
        this.activeOptionIdState.set(undefined);
        this.activeCreateState.set(false);
    }
    enabledOptionIndexes() {
        return this.filteredOptions$()
            .map((option, index) => (this.isOptionDisabled(option) ? -1 : index))
            .filter(index => index >= 0);
    }
    selectedOptionIndex() {
        const options = this.filteredOptions$();
        if (this.isMultiple$()) {
            const selectedValues = this.selectedValuesState();
            const index = options.findIndex(option => selectedValues.includes(option.id));
            return index >= 0 ? index : undefined;
        }
        const selectedValue = this.selectedValueState();
        const index = options.findIndex(option => option.id === selectedValue);
        return index >= 0 ? index : undefined;
    }
    handleTypeaheadKey(event) {
        if (this.searchEnabled$() ||
            event.key.length !== 1 ||
            event.key.trim().length === 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey) {
            return false;
        }
        const key = event.key.toLocaleLowerCase();
        this.typeaheadBuffer += key;
        if (typeof window !== 'undefined') {
            if (this.typeaheadTimer) {
                window.clearTimeout(this.typeaheadTimer);
            }
            this.typeaheadTimer = window.setTimeout(() => {
                this.typeaheadBuffer = '';
                this.typeaheadTimer = undefined;
            }, CX_DROPDOWN_TYPEAHEAD_RESET_MS);
        }
        if (!this.openState()) {
            this.setOpen(true);
            this.scheduleOpenFocus(() => {
                this.overlay.sync();
                this.updateOptionsViewport();
                this.focusTypeaheadMatch(key);
            });
            return true;
        }
        this.focusTypeaheadMatch(key);
        return true;
    }
    /**
     * Search-enabled counterpart to option typeahead: a printable key routes
     * to the search input instead — opening the popover when needed — so
     * typing on the field or an option always starts or continues a search.
     */
    handleSearchTypeaheadKey(event, field) {
        if (!this.searchEnabled$() ||
            event.key.length !== 1 ||
            event.key.trim().length === 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey) {
            return false;
        }
        if (!this.openState()) {
            this.openDropdown(field, 'search');
            this.onSearchChange(event.key);
            return true;
        }
        this.focusSearchInput();
        this.onSearchChange(this.searchQueryState() + event.key);
        return true;
    }
    commitActiveOption() {
        const activeId = this.activeOptionIdState();
        if (activeId === undefined || activeId === this.selectedValueState()) {
            return false;
        }
        const option = this.filteredOptions$().find(candidate => candidate.id === activeId);
        if (!option || this.isOptionDisabled(option)) {
            return false;
        }
        this.selectOption(option, true);
        return true;
    }
    commitSearchSelection() {
        const options = this.filteredOptions$();
        const activeId = this.activeOptionIdState();
        const activeOption = activeId
            ? options.find(option => option.id === activeId && !this.isOptionDisabled(option))
            : undefined;
        const targetOption = activeOption ?? options.find(option => !this.isOptionDisabled(option));
        if (targetOption) {
            this.selectOption(targetOption, true);
            return;
        }
        if (this.creatableState() && this.canCommitSelection$() && this.createValue$()) {
            this.create.emit(this.createValue$());
            this.closeAndFocusField();
        }
    }
    focusTypeaheadMatch(lastKey) {
        // Extending a multi-character query must keep the option that already
        // matches it. Starting after that option would cycle to a longer sibling
        // (for example `check-square` after `check`) on the final keystroke.
        const activeOption = this.filteredOptions$().find(option => option.id === this.activeOptionIdState());
        if (this.typeaheadBuffer.length > 1 &&
            activeOption &&
            activeOption.label.toLocaleLowerCase().startsWith(this.typeaheadBuffer)) {
            return;
        }
        if (this.focusMatchingOption(this.typeaheadBuffer)) {
            return;
        }
        if (this.typeaheadBuffer.length > 1) {
            this.typeaheadBuffer = lastKey;
            this.focusMatchingOption(this.typeaheadBuffer);
        }
    }
    focusMatchingOption(query) {
        const normalizedQuery = query.toLocaleLowerCase();
        const options = this.filteredOptions$();
        const currentIndex = this.currentFocusedOptionIndex();
        const startIndex = currentIndex >= 0 ? currentIndex : (this.selectedOptionIndex() ?? -1);
        for (let offset = 1; offset <= options.length; offset += 1) {
            const optionIndex = (startIndex + offset + options.length) % options.length;
            const option = options[optionIndex];
            if (this.isOptionDisabled(option)) {
                continue;
            }
            if (option.label.toLocaleLowerCase().startsWith(normalizedQuery)) {
                return this.focusOptionAtIndex(optionIndex);
            }
        }
        return false;
    }
    currentFocusedOptionIndex() {
        if (typeof document === 'undefined') {
            return -1;
        }
        const activeElement = document.activeElement;
        if (!(activeElement instanceof HTMLElement)) {
            return -1;
        }
        const optionHost = activeElement.closest('[data-cx-dropdown-option-index]');
        const index = Number(optionHost?.dataset['cxDropdownOptionIndex']);
        return Number.isFinite(index) ? index : -1;
    }
    updateOptionsViewport(scroller = this.optionsScrollerRef?.nativeElement) {
        if (!scroller) {
            return;
        }
        this.optionsViewportHeightState.set(scroller.clientHeight);
        this.scrollTopState.set(scroller.scrollTop);
        this.scheduleOptionHeightMeasurement();
    }
    maybeEmitLoadMore(scroller = this.optionsScrollerRef?.nativeElement) {
        if (!this.hasMoreState() || this.loading || this.loadingMoreState() || this.loadMoreRequested || !scroller) {
            return;
        }
        const remainingDistance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        if (remainingDistance > CX_DROPDOWN_LOAD_MORE_DISTANCE) {
            return;
        }
        this.loadMoreRequested = true;
        this.loadMore.emit();
    }
    measureOverlay(rect, viewport) {
        const viewportMaxWidth = Math.max(viewport.width - 16, 0);
        // Floor only: the surface grows to its content between this floor and the
        // popover's max-width cap; the controller measures and locks the result.
        const minWidth = Math.floor(Math.min(Math.max(rect.width, CX_DROPDOWN_POPOVER_MIN_WIDTH), viewportMaxWidth));
        const optionHeight = this.optionHeightState();
        const searchHeight = this.searchEnabled$() ? 60 : 0;
        const createHeight = this.creatableState() && !this.loading ? optionHeight : 0;
        const loadingMoreHeight = this.loadingMoreState() ? optionHeight : 0;
        const stateHeight = this.loading || this.filteredOptions$().length === 0 ? 156 : 0;
        const estimatedContentHeight = Math.min(searchHeight +
            createHeight +
            loadingMoreHeight +
            Math.max(this.filteredOptions$().length, 1) * optionHeight +
            stateHeight, CX_DROPDOWN_POPOVER_MAX_HEIGHT);
        const estimatedHeight = estimatedContentHeight + CX_DROPDOWN_POPOVER_FRAME_HEIGHT;
        return {
            width: minWidth,
            minWidth,
            estimatedHeight,
            align: 'start',
            maxHeightCap: estimatedHeight,
        };
    }
    translation(key) {
        const value = this.translationsState()[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
        return CX_DROPDOWN_DEFAULT_TRANSLATIONS[key];
    }
    formatSelectedCount(count) {
        const translation = this.translationsState().selectedCount;
        if (typeof translation === 'function') {
            return translation(count);
        }
        const pattern = typeof translation === 'string' && translation.trim()
            ? translation.trim()
            : CX_DROPDOWN_DEFAULT_TRANSLATIONS.selectedCount;
        return pattern.replace(/\{count\}/g, `${count}`);
    }
    normalizeSelectedValues(value) {
        return [...new Set(value ?? [])];
    }
    scheduleSelectionDisplayMeasurement() {
        if (typeof window === 'undefined') {
            queueMicrotask(() => {
                this.updateSelectionDisplayMode();
            });
            return;
        }
        if (this.selectionMeasureFrame !== undefined) {
            window.cancelAnimationFrame(this.selectionMeasureFrame);
        }
        this.selectionMeasureFrame = window.requestAnimationFrame(() => {
            this.selectionMeasureFrame = undefined;
            this.syncSelectionResizeObserver();
            this.updateSelectionDisplayMode();
        });
    }
    syncSelectionResizeObserver() {
        const valueElement = this.valueTextRef?.nativeElement;
        if (!valueElement ||
            !this.isMultiple$() ||
            this.selectedOptions$().length === 0 ||
            typeof ResizeObserver === 'undefined') {
            this.selectionResizeObserver?.disconnect();
            this.selectionResizeObserver = undefined;
            this.selectionResizeElement = undefined;
            return;
        }
        if (this.selectionResizeObserver && this.selectionResizeElement === valueElement) {
            return;
        }
        this.selectionResizeObserver?.disconnect();
        this.selectionResizeObserver = new ResizeObserver(() => this.scheduleSelectionDisplayMeasurement());
        this.selectionResizeElement = valueElement;
        this.selectionResizeObserver.observe(valueElement);
    }
    startOpenTracking() {
        if (this.openTracking) {
            return;
        }
        this.openTracking = true;
        this.hostVisibility.start();
        if (!this.openTracking) {
            return;
        }
        if (typeof document !== 'undefined') {
            document.addEventListener('pointerdown', this.onOpenDocumentPointerDown, true);
            document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this.onOpenWindowResize);
        }
        this.overlay.observeTrigger(this.overlay.trigger ?? this.fieldButtonRef?.nativeElement, () => {
            if (!this.hostVisibility.check()) {
                return;
            }
            this.overlay.sync();
            this.updateOptionsViewport();
            this.maybeEmitLoadMore();
        });
    }
    stopOpenTracking() {
        this.hostVisibility.stop();
        if (!this.openTracking) {
            return;
        }
        this.openTracking = false;
        if (typeof document !== 'undefined') {
            document.removeEventListener('pointerdown', this.onOpenDocumentPointerDown, true);
            document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.onOpenWindowResize);
        }
        this.overlay.stopObservingTrigger();
    }
    onOpenDocumentPointerDown = (event) => {
        this.onDocumentPointerDown(event);
    };
    onOpenWindowResize = () => {
        this.onWindowResize();
    };
    updateSelectionDisplayMode() {
        if (!this.isMultiple$() || this.selectedOptions$().length === 0) {
            this.collapseSelectedText$.set(false);
            return;
        }
        const valueElement = this.valueTextRef?.nativeElement;
        const measureElement = this.selectionMeasureRef?.nativeElement;
        if (!valueElement || !measureElement) {
            this.collapseSelectedText$.set(false);
            return;
        }
        const availableWidth = valueElement.clientWidth;
        if (availableWidth <= 0) {
            return;
        }
        this.collapseSelectedText$.set(Math.ceil(measureElement.scrollWidth) > Math.floor(availableWidth));
    }
    scheduleOptionHeightMeasurement() {
        if (!this.virtualizedOptions$() || typeof window === 'undefined') {
            return;
        }
        if (this.optionMeasureFrame !== undefined) {
            return;
        }
        this.optionMeasureFrame = window.requestAnimationFrame(() => {
            this.optionMeasureFrame = undefined;
            this.updateOptionHeight();
        });
    }
    updateOptionHeight() {
        const height = this.optionRefs?.first?.nativeElement.getBoundingClientRect().height;
        if (!height || !Number.isFinite(height)) {
            return;
        }
        const roundedHeight = Math.max(1, Math.round(height));
        if (roundedHeight === this.optionHeightState()) {
            return;
        }
        this.optionHeightState.set(roundedHeight);
        this.overlay.sync();
        this.updateOptionsViewport();
        this.maybeEmitLoadMore();
    }
    scheduleRequiredValueValidation() {
        if (this.requiredValueValidationQueued) {
            return;
        }
        this.requiredValueValidationQueued = true;
        queueMicrotask(() => {
            this.requiredValueValidationQueued = false;
            this.validateRequiredValueState();
        });
    }
    rememberSelectedOptions() {
        const selectedIds = new Set(this.selectedValuesState());
        const selectedValue = this.selectedValueState();
        if (selectedValue) {
            selectedIds.add(selectedValue);
        }
        const known = this.knownSelectedOptionsState();
        const next = new Map();
        for (const selectedId of selectedIds) {
            const option = this.optionsState().find(candidate => candidate.id === selectedId) ?? known.get(selectedId);
            if (option) {
                next.set(selectedId, option);
            }
        }
        if (next.size === known.size && [...next].every(([id, option]) => known.get(id) === option)) {
            return;
        }
        this.knownSelectedOptionsState.set(next);
    }
    validateRequiredValueState() {
        const hasInvalidValue = this.hasInvalidSelectedValue();
        if (!hasInvalidValue) {
            this.reportedInvalidValue = false;
            return;
        }
        if (this.reportedInvalidValue) {
            return;
        }
        this.reportedInvalidValue = true;
        console.error(`[cx-dropdown] Selected value is not available (${this.validationTargetLabel()}). Provide a value/values entry that exists in availableValues.`);
    }
    hasInvalidSelectedValue() {
        // In manual filter mode or while more pages exist, availableValues is a
        // partial snapshot, so an absent selected value is a legitimate state.
        // The known-selected cache is deliberately not consulted here: it keeps
        // labels stable for display, but in client mode a selected value missing
        // from availableValues is still a parent bug worth reporting.
        if (this.filterModeState() === 'manual' || this.hasMoreState() || this.loading || this.loadingMoreState()) {
            return false;
        }
        const optionIds = new Set(this.optionsState().map(option => option.id));
        if (this.isMultiple$()) {
            return this.selectedValuesState().some(value => !optionIds.has(value));
        }
        const value = this.selectedValueState();
        return Boolean(value) && !optionIds.has(value);
    }
    validationTargetLabel() {
        return this.labelText$() || this.ariaLabel?.trim() || 'unlabelled dropdown';
    }
    selectPlaceholderSubject() {
        const label = this.labelText$() || this.ariaLabel?.trim() || '';
        if (!label) {
            return '';
        }
        if (label === label.toUpperCase()) {
            return label;
        }
        return label.charAt(0).toLowerCase() + label.slice(1);
    }
    focusSearchInput() {
        if (!this.searchEnabled$()) {
            return;
        }
        this.clearActiveOption();
        if (typeof window === 'undefined') {
            this.searchInputRef?.focus();
            return;
        }
        if (this.searchFocusTimer) {
            window.clearTimeout(this.searchFocusTimer);
        }
        this.searchFocusTimer = window.setTimeout(() => {
            this.searchInputRef?.focus();
            this.searchFocusTimer = undefined;
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDropdownComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDropdownComponent, isStandalone: true, selector: "cx-dropdown", inputs: { label: "label", ariaLabel: "ariaLabel", name: "name", transparent: "transparent", translations: "translations", placeholder: "placeholder", size: "size", optional: "optional", disabled: "disabled", loading: "loading", loadingMore: "loadingMore", hasMore: "hasMore", clearable: "clearable", selection: "selection", filterMode: "filterMode", searchable: "searchable", creatable: "creatable", hint: "hint", validation: "validation", availableValues: "availableValues", value: "value", values: "values" }, outputs: { valueChange: "valueChange", valuesChange: "valuesChange", create: "create", focusChange: "focusChange", clear: "clear", openChange: "openChange", queryChange: "queryChange", loadMore: "loadMore" }, host: { properties: { "class.cx-dropdown-host--small": "size === \"small\"", "class.cx-dropdown-host--large": "size === \"large\"" } }, viewQueries: [{ propertyName: "fieldButtonRef", first: true, predicate: ["fieldButton"], descendants: true, read: ElementRef }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }, { propertyName: "searchInputRef", first: true, predicate: ["searchInput"], descendants: true }, { propertyName: "valueTextRef", first: true, predicate: ["valueText"], descendants: true, read: ElementRef }, { propertyName: "selectionMeasureRef", first: true, predicate: ["selectionMeasure"], descendants: true, read: ElementRef }, { propertyName: "createRowComponent", first: true, predicate: ["createRow"], descendants: true }, { propertyName: "optionsScrollerRef", first: true, predicate: ["optionsScroller"], descendants: true, read: ElementRef }, { propertyName: "optionRefs", predicate: ["optionRow"], descendants: true, read: ElementRef }, { propertyName: "optionComponents", predicate: ["optionRow"], descendants: true }], ngImport: i0, template: "<div\n  class=\"cx-dropdown\"\n  [class.cx-dropdown--small]=\"size === 'small'\"\n  [class.cx-dropdown--large]=\"size === 'large'\"\n  (focusin)=\"onComponentFocusIn()\"\n  (focusout)=\"onComponentFocusOut($event)\"\n>\n  @if (labelText$()) {\n    <div class=\"cx-dropdown__header\">\n      <div class=\"cx-dropdown__label\" [id]=\"labelId\">{{ labelText$() }}</div>\n      @if (optional) {\n        <div class=\"cx-dropdown__optional\">{{ optionalText$() }}</div>\n      }\n    </div>\n  }\n  <div\n    class=\"cx-dropdown__field\"\n    #fieldButton\n    [class.cx-dropdown__field--small]=\"size === 'small'\"\n    [class.cx-dropdown__field--large]=\"size === 'large'\"\n    [class.cx-dropdown__field--open]=\"isOpen$()\"\n    [class.cx-dropdown__field--disabled]=\"disabled\"\n    [class.cx-dropdown__field--loading]=\"loading\"\n    [class.cx-dropdown__field--error]=\"hasError$()\"\n    [class.cx-dropdown__field--transparent]=\"transparent\"\n    role=\"combobox\"\n    [attr.tabindex]=\"isLocked$() ? -1 : 0\"\n    [attr.aria-expanded]=\"isOpen$()\"\n    [attr.aria-haspopup]=\"'listbox'\"\n    [attr.aria-disabled]=\"disabled ? 'true' : null\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-required]=\"isRequired$() ? 'true' : null\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n    [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n    [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n    [attr.aria-label]=\"resolvedFieldAriaLabel\"\n    [cxTooltip]=\"displayText$()\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggleOpenFromPointer(fieldButton)\"\n    (keydown)=\"onFieldKeydown($event, fieldButton)\"\n  >\n    <span\n      #valueText\n      class=\"cx-dropdown__value\"\n      [class.cx-dropdown__value--placeholder]=\"showPlaceholder$()\"\n      data-cx-tooltip-overflow\n    >\n      {{ displayText$() }}\n    </span>\n    <span #selectionMeasure class=\"cx-dropdown__value-measure\" aria-hidden=\"true\">{{ selectedLabelsText$() }}</span>\n    <span class=\"cx-dropdown__actions\">\n      @if (hasClear$()) {\n        <span class=\"cx-dropdown__clear\" (pointerdown)=\"$event.stopPropagation()\" (click)=\"$event.stopPropagation()\">\n          <cx-icon-button\n            icon=\"remove\"\n            [ariaLabel]=\"clearAriaLabel$()\"\n            variant=\"transparent\"\n            size=\"small\"\n            (pressed)=\"clearSelection()\"\n          />\n        </span>\n      }\n      @if (loading) {\n        <span class=\"cx-dropdown__loading\" aria-hidden=\"true\">\n          <cx-spinner size=\"small\" mood=\"default\" />\n        </span>\n      }\n      <cx-icon class=\"cx-dropdown__chevron\" icon=\"chevron-down\" [size]=\"size === 'small' ? 12 : 16\" />\n    </span>\n  </div>\n\n  @if (!disabled) {\n    @if (resolvedName; as fieldName) {\n      @if (isMultiple$()) {\n        @for (formValue of formValues$(); track $index) {\n          @if (formValue) {\n            <input type=\"hidden\" [attr.name]=\"fieldName\" [value]=\"formValue\" />\n          }\n        }\n      } @else {\n        <input type=\"hidden\" [attr.name]=\"fieldName\" [value]=\"formValues$()[0]\" />\n      }\n    }\n  }\n\n  @if (isOpen$() && isInteractive$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [owner]=\"fieldButton\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxWidth]=\"popoverMaxWidth\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div class=\"cx-dropdown__surface\" (focusin)=\"onComponentFocusIn()\" (focusout)=\"onComponentFocusOut($event)\">\n        @if (searchEnabled$()) {\n          <div class=\"cx-dropdown__search\">\n            <cx-text-field\n              #searchInput\n              label=\"\"\n              [ariaLabel]=\"searchAriaLabel$()\"\n              prependIcon=\"search\"\n              [clearable]=\"true\"\n              [value]=\"searchQuery$()\"\n              (valueChange)=\"onSearchChange($event)\"\n              (keydown)=\"onSearchKeydown($event)\"\n            />\n          </div>\n        }\n\n        <div\n          #optionsScroller\n          class=\"cx-dropdown__options\"\n          data-cx-popover-scroll-container\n          role=\"listbox\"\n          [id]=\"listboxId\"\n          [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n          [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n          [attr.aria-label]=\"resolvedFieldAriaLabel\"\n          [attr.aria-multiselectable]=\"isMultiple$() ? 'true' : null\"\n          [attr.aria-required]=\"isRequired$() ? 'true' : null\"\n          [attr.aria-busy]=\"loading || loadingMore$() ? 'true' : null\"\n          (scroll)=\"onOptionsScroll($event)\"\n        >\n          @if (loading) {\n            <div class=\"cx-dropdown__empty cx-dropdown__empty--state\" role=\"status\" aria-live=\"polite\">\n              <span class=\"cx-dropdown__empty-spinner\" aria-hidden=\"true\">\n                <cx-spinner size=\"small\" mood=\"default\" />\n              </span>\n              <div class=\"cx-dropdown__empty-heading\">{{ loadingText$() }}</div>\n              <div class=\"cx-dropdown__empty-text\">{{ loadingDescriptionText$() }}</div>\n            </div>\n          } @else if (filteredOptions$().length > 0) {\n            <div\n              [class.cx-dropdown__virtual-spacer]=\"virtualizedOptions$()\"\n              [style.height.px]=\"virtualizedOptions$() ? virtualOptionsHeight$() : null\"\n            >\n              <div\n                [class.cx-dropdown__virtual-window]=\"virtualizedOptions$()\"\n                [style.transform]=\"virtualizedOptions$() ? virtualOptionsOffset$() : null\"\n              >\n                @for (entry of renderedOptions$(); track entry.option.id) {\n                  <cx-option\n                    #optionRow\n                    [attr.data-cx-dropdown-option-index]=\"entry.index\"\n                    [role]=\"'option'\"\n                    [label]=\"entry.option.label\"\n                    [description]=\"entry.option.description\"\n                    [prependIcon]=\"entry.option.prependIcon\"\n                    [appendIcon]=\"entry.option.appendIcon\"\n                    [mood]=\"entry.option.mood ?? 'default'\"\n                    [shortcutParts]=\"entry.option.shortcutParts\"\n                    [active]=\"activeOptionId$() === entry.option.id\"\n                    [selected]=\"isOptionSelected(entry.option.id)\"\n                    [selectedHighlight]=\"!isMultiple$()\"\n                    [showCheckbox]=\"isMultiple$()\"\n                    [disabled]=\"isOptionDisabled(entry.option)\"\n                    [ariaSetSize]=\"virtualizedOptions$() ? filteredOptions$().length : undefined\"\n                    [ariaPosInSet]=\"virtualizedOptions$() ? entry.index + 1 : undefined\"\n                    (click)=\"selectOption(entry.option, true)\"\n                    (keydown)=\"onOptionKeydown($event, entry.option)\"\n                  />\n                }\n              </div>\n            </div>\n            @if (loadingMore$()) {\n              <div class=\"cx-dropdown__loading-more\" role=\"status\" aria-live=\"polite\">\n                <cx-spinner size=\"small\" mood=\"default\" />\n                <span>{{ loadingMoreText$() }}</span>\n              </div>\n            }\n          } @else {\n            @if (showSearchEmptyState$()) {\n              <div class=\"cx-dropdown__empty cx-dropdown__empty--state\" role=\"status\" aria-live=\"polite\">\n                <cx-icon icon=\"search\" mood=\"primary\" shape=\"square-subtle\" size=\"32\" />\n                <div class=\"cx-dropdown__empty-heading\">{{ noResultsText$() }}</div>\n                <div class=\"cx-dropdown__empty-text\">{{ emptyDescription$() }}</div>\n              </div>\n            } @else {\n              <div class=\"cx-dropdown__empty cx-dropdown__empty--state\" role=\"status\" aria-live=\"polite\">\n                <cx-icon icon=\"info\" mood=\"primary\" shape=\"square-subtle\" size=\"32\" />\n                <div class=\"cx-dropdown__empty-heading\">{{ noOptionsText$() }}</div>\n                <div class=\"cx-dropdown__empty-text\">{{ noOptionsDescriptionText$() }}</div>\n              </div>\n            }\n          }\n        </div>\n\n        @if (creatable$() && !loading) {\n          <div class=\"cx-dropdown__create\" role=\"presentation\">\n            <cx-option\n              #createRow\n              [label]=\"createLabel$()\"\n              [active]=\"activeCreate$()\"\n              prependIcon=\"plus\"\n              [selected]=\"false\"\n              (click)=\"onCreateOption($event)\"\n              (keydown)=\"onCreateKeydown($event)\"\n            />\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-dropdown__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-dropdown__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message class=\"cx-dropdown__error\" [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n</div>\n", styles: [":host{display:block;width:100%}:host(.cx-dropdown-host--small){display:inline-flex;width:auto}:host(.cx-dropdown-host--large){display:block;width:100%}.cx-dropdown{box-sizing:border-box;contain:inline-size;width:100%}.cx-dropdown--small{display:inline-flex;contain:none;width:auto;flex-direction:column}.cx-dropdown--large{--cx-dropdown-font-size: var(--font-size-body-lg)}.cx-dropdown__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-dropdown__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-dropdown__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-dropdown__field{box-sizing:border-box;display:flex;position:relative;width:100%;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;text-align:left;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-dropdown__field:hover:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error):not(.cx-dropdown__field--small){border-color:var(--opacity-mid)}.cx-dropdown__field:hover:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error),.cx-dropdown__field:active:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error),.cx-dropdown__field--open:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error){outline:var(--outline-field-interaction)}.cx-dropdown__field--small{display:inline-flex;width:auto;min-height:var(--controller-size-small);gap:var(--space-sm);padding:0;border:0;background:rgba(0,0,0,0)}.cx-dropdown__field--large{min-height:var(--controller-size-large);padding-inline:var(--space-md);border-radius:var(--radius-xl)}.cx-dropdown__field--transparent{border-color:rgba(0,0,0,0);background:rgba(0,0,0,0);color:inherit}.cx-dropdown__field--transparent:hover:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error){border-color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.cx-dropdown__field--small:hover:not(.cx-dropdown__field--disabled){background:var(--opacity-low)}:host-context([data-cx-keyboard-navigation]) .cx-dropdown__field:focus{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-dropdown__field--open{border-color:var(--border-open)}.cx-dropdown__field--error,.cx-dropdown__field--error:hover:not(.cx-dropdown__field--disabled),.cx-dropdown__field--error.cx-dropdown__field--open{border-color:var(--danger)}.cx-dropdown__field--disabled{opacity:.55}.cx-dropdown__field--disabled,.cx-dropdown__field--loading{cursor:default}.cx-dropdown__value{flex:1 1 auto;min-width:0;color:inherit;font-size:var(--cx-dropdown-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cx-dropdown__loading,.cx-dropdown__actions,.cx-dropdown__clear{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-dropdown__actions{gap:0}.cx-dropdown__loading{width:var(--controller-size-small);height:var(--controller-size-small)}.cx-dropdown__clear{opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease}.cx-dropdown__clear cx-icon-button{--cx-icon-button-transparent-color: var(--opacity-high);--cx-icon-button-transparent-hover-background: var(--opacity-low)}.cx-dropdown__field:hover .cx-dropdown__clear,.cx-dropdown__field:focus-within .cx-dropdown__clear,.cx-dropdown__field--open .cx-dropdown__clear{opacity:1;pointer-events:auto}.cx-dropdown__field--small .cx-dropdown__value{flex:none;font-size:var(--font-size-body-sm)}.cx-dropdown__value--placeholder{color:var(--placeholder)}.cx-dropdown__value-measure{position:absolute;width:max-content;max-width:none;height:0;overflow:hidden;visibility:hidden;white-space:nowrap;pointer-events:none;color:inherit;font-size:var(--cx-dropdown-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-dropdown__chevron{flex:0 0 auto;transition:transform var(--motion-fast) ease}.cx-dropdown__field--open .cx-dropdown__chevron{transform:rotate(180deg)}.cx-dropdown__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow:hidden}.cx-dropdown__search{box-sizing:border-box;min-width:0;width:100%;padding:var(--space-sm) var(--space-sm) var(--space-xs) var(--space-sm)}.cx-dropdown__options{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;overflow-anchor:none}.cx-dropdown__virtual-spacer{position:relative;flex:0 0 auto}.cx-dropdown__virtual-window{position:absolute;inset:0 0 auto 0}.cx-dropdown__empty{display:flex;width:100%;align-items:center;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);color:var(--opacity-high)}.cx-dropdown__empty--state{box-sizing:border-box;min-height:156px;flex-direction:column;justify-content:center;gap:var(--space-sm);padding:var(--space-xl) var(--space-lg);text-align:center}.cx-dropdown__empty-spinner{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center}.cx-dropdown__loading-more{display:flex;min-height:var(--controller-size);flex:0 0 auto;align-items:center;justify-content:center;gap:var(--space-sm);padding:0 var(--space-sm);border-top:var(--line);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-dropdown__empty-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-dropdown__empty-text{max-width:28ch;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-dropdown__create{flex:0 0 auto;border-top:var(--line)}.cx-dropdown__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-dropdown__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDropdownComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-dropdown', imports: [
                        CommonModule,
                        CxValidationMessageComponent,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxTextFieldComponent,
                        CxOptionComponent,
                        CxPopoverComponent,
                        CxSpinnerComponent,
                        CxTooltipDirective,
                    ], host: {
                        '[class.cx-dropdown-host--small]': 'size === "small"',
                        '[class.cx-dropdown-host--large]': 'size === "large"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-dropdown\"\n  [class.cx-dropdown--small]=\"size === 'small'\"\n  [class.cx-dropdown--large]=\"size === 'large'\"\n  (focusin)=\"onComponentFocusIn()\"\n  (focusout)=\"onComponentFocusOut($event)\"\n>\n  @if (labelText$()) {\n    <div class=\"cx-dropdown__header\">\n      <div class=\"cx-dropdown__label\" [id]=\"labelId\">{{ labelText$() }}</div>\n      @if (optional) {\n        <div class=\"cx-dropdown__optional\">{{ optionalText$() }}</div>\n      }\n    </div>\n  }\n  <div\n    class=\"cx-dropdown__field\"\n    #fieldButton\n    [class.cx-dropdown__field--small]=\"size === 'small'\"\n    [class.cx-dropdown__field--large]=\"size === 'large'\"\n    [class.cx-dropdown__field--open]=\"isOpen$()\"\n    [class.cx-dropdown__field--disabled]=\"disabled\"\n    [class.cx-dropdown__field--loading]=\"loading\"\n    [class.cx-dropdown__field--error]=\"hasError$()\"\n    [class.cx-dropdown__field--transparent]=\"transparent\"\n    role=\"combobox\"\n    [attr.tabindex]=\"isLocked$() ? -1 : 0\"\n    [attr.aria-expanded]=\"isOpen$()\"\n    [attr.aria-haspopup]=\"'listbox'\"\n    [attr.aria-disabled]=\"disabled ? 'true' : null\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-required]=\"isRequired$() ? 'true' : null\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n    [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n    [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n    [attr.aria-label]=\"resolvedFieldAriaLabel\"\n    [cxTooltip]=\"displayText$()\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggleOpenFromPointer(fieldButton)\"\n    (keydown)=\"onFieldKeydown($event, fieldButton)\"\n  >\n    <span\n      #valueText\n      class=\"cx-dropdown__value\"\n      [class.cx-dropdown__value--placeholder]=\"showPlaceholder$()\"\n      data-cx-tooltip-overflow\n    >\n      {{ displayText$() }}\n    </span>\n    <span #selectionMeasure class=\"cx-dropdown__value-measure\" aria-hidden=\"true\">{{ selectedLabelsText$() }}</span>\n    <span class=\"cx-dropdown__actions\">\n      @if (hasClear$()) {\n        <span class=\"cx-dropdown__clear\" (pointerdown)=\"$event.stopPropagation()\" (click)=\"$event.stopPropagation()\">\n          <cx-icon-button\n            icon=\"remove\"\n            [ariaLabel]=\"clearAriaLabel$()\"\n            variant=\"transparent\"\n            size=\"small\"\n            (pressed)=\"clearSelection()\"\n          />\n        </span>\n      }\n      @if (loading) {\n        <span class=\"cx-dropdown__loading\" aria-hidden=\"true\">\n          <cx-spinner size=\"small\" mood=\"default\" />\n        </span>\n      }\n      <cx-icon class=\"cx-dropdown__chevron\" icon=\"chevron-down\" [size]=\"size === 'small' ? 12 : 16\" />\n    </span>\n  </div>\n\n  @if (!disabled) {\n    @if (resolvedName; as fieldName) {\n      @if (isMultiple$()) {\n        @for (formValue of formValues$(); track $index) {\n          @if (formValue) {\n            <input type=\"hidden\" [attr.name]=\"fieldName\" [value]=\"formValue\" />\n          }\n        }\n      } @else {\n        <input type=\"hidden\" [attr.name]=\"fieldName\" [value]=\"formValues$()[0]\" />\n      }\n    }\n  }\n\n  @if (isOpen$() && isInteractive$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [owner]=\"fieldButton\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxWidth]=\"popoverMaxWidth\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div class=\"cx-dropdown__surface\" (focusin)=\"onComponentFocusIn()\" (focusout)=\"onComponentFocusOut($event)\">\n        @if (searchEnabled$()) {\n          <div class=\"cx-dropdown__search\">\n            <cx-text-field\n              #searchInput\n              label=\"\"\n              [ariaLabel]=\"searchAriaLabel$()\"\n              prependIcon=\"search\"\n              [clearable]=\"true\"\n              [value]=\"searchQuery$()\"\n              (valueChange)=\"onSearchChange($event)\"\n              (keydown)=\"onSearchKeydown($event)\"\n            />\n          </div>\n        }\n\n        <div\n          #optionsScroller\n          class=\"cx-dropdown__options\"\n          data-cx-popover-scroll-container\n          role=\"listbox\"\n          [id]=\"listboxId\"\n          [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n          [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n          [attr.aria-label]=\"resolvedFieldAriaLabel\"\n          [attr.aria-multiselectable]=\"isMultiple$() ? 'true' : null\"\n          [attr.aria-required]=\"isRequired$() ? 'true' : null\"\n          [attr.aria-busy]=\"loading || loadingMore$() ? 'true' : null\"\n          (scroll)=\"onOptionsScroll($event)\"\n        >\n          @if (loading) {\n            <div class=\"cx-dropdown__empty cx-dropdown__empty--state\" role=\"status\" aria-live=\"polite\">\n              <span class=\"cx-dropdown__empty-spinner\" aria-hidden=\"true\">\n                <cx-spinner size=\"small\" mood=\"default\" />\n              </span>\n              <div class=\"cx-dropdown__empty-heading\">{{ loadingText$() }}</div>\n              <div class=\"cx-dropdown__empty-text\">{{ loadingDescriptionText$() }}</div>\n            </div>\n          } @else if (filteredOptions$().length > 0) {\n            <div\n              [class.cx-dropdown__virtual-spacer]=\"virtualizedOptions$()\"\n              [style.height.px]=\"virtualizedOptions$() ? virtualOptionsHeight$() : null\"\n            >\n              <div\n                [class.cx-dropdown__virtual-window]=\"virtualizedOptions$()\"\n                [style.transform]=\"virtualizedOptions$() ? virtualOptionsOffset$() : null\"\n              >\n                @for (entry of renderedOptions$(); track entry.option.id) {\n                  <cx-option\n                    #optionRow\n                    [attr.data-cx-dropdown-option-index]=\"entry.index\"\n                    [role]=\"'option'\"\n                    [label]=\"entry.option.label\"\n                    [description]=\"entry.option.description\"\n                    [prependIcon]=\"entry.option.prependIcon\"\n                    [appendIcon]=\"entry.option.appendIcon\"\n                    [mood]=\"entry.option.mood ?? 'default'\"\n                    [shortcutParts]=\"entry.option.shortcutParts\"\n                    [active]=\"activeOptionId$() === entry.option.id\"\n                    [selected]=\"isOptionSelected(entry.option.id)\"\n                    [selectedHighlight]=\"!isMultiple$()\"\n                    [showCheckbox]=\"isMultiple$()\"\n                    [disabled]=\"isOptionDisabled(entry.option)\"\n                    [ariaSetSize]=\"virtualizedOptions$() ? filteredOptions$().length : undefined\"\n                    [ariaPosInSet]=\"virtualizedOptions$() ? entry.index + 1 : undefined\"\n                    (click)=\"selectOption(entry.option, true)\"\n                    (keydown)=\"onOptionKeydown($event, entry.option)\"\n                  />\n                }\n              </div>\n            </div>\n            @if (loadingMore$()) {\n              <div class=\"cx-dropdown__loading-more\" role=\"status\" aria-live=\"polite\">\n                <cx-spinner size=\"small\" mood=\"default\" />\n                <span>{{ loadingMoreText$() }}</span>\n              </div>\n            }\n          } @else {\n            @if (showSearchEmptyState$()) {\n              <div class=\"cx-dropdown__empty cx-dropdown__empty--state\" role=\"status\" aria-live=\"polite\">\n                <cx-icon icon=\"search\" mood=\"primary\" shape=\"square-subtle\" size=\"32\" />\n                <div class=\"cx-dropdown__empty-heading\">{{ noResultsText$() }}</div>\n                <div class=\"cx-dropdown__empty-text\">{{ emptyDescription$() }}</div>\n              </div>\n            } @else {\n              <div class=\"cx-dropdown__empty cx-dropdown__empty--state\" role=\"status\" aria-live=\"polite\">\n                <cx-icon icon=\"info\" mood=\"primary\" shape=\"square-subtle\" size=\"32\" />\n                <div class=\"cx-dropdown__empty-heading\">{{ noOptionsText$() }}</div>\n                <div class=\"cx-dropdown__empty-text\">{{ noOptionsDescriptionText$() }}</div>\n              </div>\n            }\n          }\n        </div>\n\n        @if (creatable$() && !loading) {\n          <div class=\"cx-dropdown__create\" role=\"presentation\">\n            <cx-option\n              #createRow\n              [label]=\"createLabel$()\"\n              [active]=\"activeCreate$()\"\n              prependIcon=\"plus\"\n              [selected]=\"false\"\n              (click)=\"onCreateOption($event)\"\n              (keydown)=\"onCreateKeydown($event)\"\n            />\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-dropdown__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-dropdown__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message class=\"cx-dropdown__error\" [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n</div>\n", styles: [":host{display:block;width:100%}:host(.cx-dropdown-host--small){display:inline-flex;width:auto}:host(.cx-dropdown-host--large){display:block;width:100%}.cx-dropdown{box-sizing:border-box;contain:inline-size;width:100%}.cx-dropdown--small{display:inline-flex;contain:none;width:auto;flex-direction:column}.cx-dropdown--large{--cx-dropdown-font-size: var(--font-size-body-lg)}.cx-dropdown__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-dropdown__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-dropdown__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-dropdown__field{box-sizing:border-box;display:flex;position:relative;width:100%;min-height:var(--controller-size);align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;text-align:left;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-dropdown__field:hover:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error):not(.cx-dropdown__field--small){border-color:var(--opacity-mid)}.cx-dropdown__field:hover:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error),.cx-dropdown__field:active:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error),.cx-dropdown__field--open:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error){outline:var(--outline-field-interaction)}.cx-dropdown__field--small{display:inline-flex;width:auto;min-height:var(--controller-size-small);gap:var(--space-sm);padding:0;border:0;background:rgba(0,0,0,0)}.cx-dropdown__field--large{min-height:var(--controller-size-large);padding-inline:var(--space-md);border-radius:var(--radius-xl)}.cx-dropdown__field--transparent{border-color:rgba(0,0,0,0);background:rgba(0,0,0,0);color:inherit}.cx-dropdown__field--transparent:hover:not(.cx-dropdown__field--disabled):not(.cx-dropdown__field--error){border-color:rgba(0,0,0,0);background:rgba(0,0,0,0)}.cx-dropdown__field--small:hover:not(.cx-dropdown__field--disabled){background:var(--opacity-low)}:host-context([data-cx-keyboard-navigation]) .cx-dropdown__field:focus{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-dropdown__field--open{border-color:var(--border-open)}.cx-dropdown__field--error,.cx-dropdown__field--error:hover:not(.cx-dropdown__field--disabled),.cx-dropdown__field--error.cx-dropdown__field--open{border-color:var(--danger)}.cx-dropdown__field--disabled{opacity:.55}.cx-dropdown__field--disabled,.cx-dropdown__field--loading{cursor:default}.cx-dropdown__value{flex:1 1 auto;min-width:0;color:inherit;font-size:var(--cx-dropdown-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cx-dropdown__loading,.cx-dropdown__actions,.cx-dropdown__clear{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-dropdown__actions{gap:0}.cx-dropdown__loading{width:var(--controller-size-small);height:var(--controller-size-small)}.cx-dropdown__clear{opacity:0;pointer-events:none;transition:opacity var(--motion-fast) ease}.cx-dropdown__clear cx-icon-button{--cx-icon-button-transparent-color: var(--opacity-high);--cx-icon-button-transparent-hover-background: var(--opacity-low)}.cx-dropdown__field:hover .cx-dropdown__clear,.cx-dropdown__field:focus-within .cx-dropdown__clear,.cx-dropdown__field--open .cx-dropdown__clear{opacity:1;pointer-events:auto}.cx-dropdown__field--small .cx-dropdown__value{flex:none;font-size:var(--font-size-body-sm)}.cx-dropdown__value--placeholder{color:var(--placeholder)}.cx-dropdown__value-measure{position:absolute;width:max-content;max-width:none;height:0;overflow:hidden;visibility:hidden;white-space:nowrap;pointer-events:none;color:inherit;font-size:var(--cx-dropdown-font-size, var(--font-size-body));font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-dropdown__chevron{flex:0 0 auto;transition:transform var(--motion-fast) ease}.cx-dropdown__field--open .cx-dropdown__chevron{transform:rotate(180deg)}.cx-dropdown__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow:hidden}.cx-dropdown__search{box-sizing:border-box;min-width:0;width:100%;padding:var(--space-sm) var(--space-sm) var(--space-xs) var(--space-sm)}.cx-dropdown__options{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;overflow-anchor:none}.cx-dropdown__virtual-spacer{position:relative;flex:0 0 auto}.cx-dropdown__virtual-window{position:absolute;inset:0 0 auto 0}.cx-dropdown__empty{display:flex;width:100%;align-items:center;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);color:var(--opacity-high)}.cx-dropdown__empty--state{box-sizing:border-box;min-height:156px;flex-direction:column;justify-content:center;gap:var(--space-sm);padding:var(--space-xl) var(--space-lg);text-align:center}.cx-dropdown__empty-spinner{display:inline-flex;width:var(--controller-size-small);height:var(--controller-size-small);align-items:center;justify-content:center}.cx-dropdown__loading-more{display:flex;min-height:var(--controller-size);flex:0 0 auto;align-items:center;justify-content:center;gap:var(--space-sm);padding:0 var(--space-sm);border-top:var(--line);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-dropdown__empty-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-dropdown__empty-text{max-width:28ch;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-dropdown__create{flex:0 0 auto;border-top:var(--line)}.cx-dropdown__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-dropdown__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"] }]
        }], propDecorators: { fieldButtonRef: [{
                type: ViewChild,
                args: ['fieldButton', { read: ElementRef }]
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], searchInputRef: [{
                type: ViewChild,
                args: ['searchInput']
            }], valueTextRef: [{
                type: ViewChild,
                args: ['valueText', { read: ElementRef }]
            }], selectionMeasureRef: [{
                type: ViewChild,
                args: ['selectionMeasure', { read: ElementRef }]
            }], optionRefs: [{
                type: ViewChildren,
                args: ['optionRow', { read: ElementRef }]
            }], optionComponents: [{
                type: ViewChildren,
                args: ['optionRow']
            }], createRowComponent: [{
                type: ViewChild,
                args: ['createRow']
            }], optionsScrollerRef: [{
                type: ViewChild,
                args: ['optionsScroller', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], name: [{
                type: Input
            }], transparent: [{
                type: Input
            }], translations: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], size: [{
                type: Input
            }], optional: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], loadingMore: [{
                type: Input
            }], hasMore: [{
                type: Input
            }], clearable: [{
                type: Input
            }], selection: [{
                type: Input
            }], filterMode: [{
                type: Input
            }], searchable: [{
                type: Input
            }], creatable: [{
                type: Input
            }], hint: [{
                type: Input
            }], validation: [{
                type: Input
            }], availableValues: [{
                type: Input
            }], value: [{
                type: Input
            }], values: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], valuesChange: [{
                type: Output
            }], create: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], clear: [{
                type: Output
            }], openChange: [{
                type: Output
            }], queryChange: [{
                type: Output
            }], loadMore: [{
                type: Output
            }] } });
