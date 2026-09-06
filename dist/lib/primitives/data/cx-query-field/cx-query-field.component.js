import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts.js';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { normalizeCxValidation, } from '../../inputs/shared/field.types.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { CxOptionComponent } from '../../overlay/cx-option/index.js';
import { CxOptionGroupComponent } from '../../overlay/cx-option-group/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxQueryElementComponent } from '../cx-query-element/index.js';
import * as i0 from "@angular/core";
const CX_QUERY_FIELD_POPOVER_MIN_WIDTH = 240;
const CX_QUERY_FIELD_POPOVER_MAX_WIDTH = 420;
const CX_QUERY_FIELD_POPOVER_MAX_HEIGHT = 360;
const CX_QUERY_FIELD_POPOVER_FRAME_HEIGHT = 8;
const CX_QUERY_FIELD_OPTION_HEIGHT = 40;
const CX_QUERY_FIELD_JOIN_OPTIONS = [
    {
        id: 'and',
        label: 'AND',
        description: 'Both conditions must match',
        keywords: ['&', '&&', 'all', 'both'],
    },
    {
        id: 'or',
        label: 'OR',
        description: 'Either condition can match',
        keywords: ['|', '||', 'any', 'either'],
    },
];
const CX_QUERY_FIELD_FINISH_SHORTCUT = ['Mod', 'Enter'];
let cxQueryFieldId = 0;
export class CxQueryFieldComponent {
    instanceId = ++cxQueryFieldId;
    conditionsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "conditionsState" }] : /* istanbul ignore next */ []));
    fieldsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fieldsState" }] : /* istanbul ignore next */ []));
    hintState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hintState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    loadingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    draftState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draftState" }] : /* istanbul ignore next */ []));
    editorTextState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "editorTextState" }] : /* istanbul ignore next */ []));
    activeSuggestionIndexState = signal(-1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeSuggestionIndexState" }] : /* istanbul ignore next */ []));
    navigationStatusState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "navigationStatusState" }] : /* istanbul ignore next */ []));
    structuredCaretState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "structuredCaretState" }] : /* istanbul ignore next */ []));
    knownValueOptionsState = signal(new Map(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "knownValueOptionsState" }] : /* istanbul ignore next */ []));
    hasHiddenQueryBeforeState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasHiddenQueryBeforeState" }] : /* istanbul ignore next */ []));
    hasHiddenQueryAfterState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasHiddenQueryAfterState" }] : /* istanbul ignore next */ []));
    nextConditionId = 0;
    tabCloseTimer;
    editorFocusTimer;
    overflowSyncFrame;
    suppressNextFocusOpen = false;
    inputId = `cx-query-field-input-${this.instanceId}`;
    labelId = `cx-query-field-label-${this.instanceId}`;
    messagesId = `cx-query-field-messages-${this.instanceId}`;
    statusId = `cx-query-field-status-${this.instanceId}`;
    popoverId = `cx-query-field-popover-${this.instanceId}`;
    listboxId = `cx-query-field-listbox-${this.instanceId}`;
    popoverMaxWidth = CX_QUERY_FIELD_POPOVER_MAX_WIDTH;
    finishShortcutParts = CX_QUERY_FIELD_FINISH_SHORTCUT;
    finishShortcutAria = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
        ? 'Meta+Enter'
        : 'Control+Enter';
    fieldContainerRef;
    segmentsRef;
    editorInputRef;
    footerActionRef;
    popoverRef;
    overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport), () => this.popoverRef?.surfaceElement());
    label = 'Filters';
    set hint(value) {
        this.hintState.set(value?.trim() || undefined);
    }
    get hint() {
        return this.hintState();
    }
    optional = false;
    size = 'default';
    growVertically = true;
    clearable = true;
    ariaLabel;
    set disabled(value) {
        this.disabledState.set(Boolean(value));
        if (value) {
            this.closeEditor(false);
        }
    }
    get disabled() {
        return this.disabledState();
    }
    set loading(value) {
        this.loadingState.set(Boolean(value));
        if (value) {
            this.closeEditor(false);
        }
    }
    get loading() {
        return this.loadingState();
    }
    set fields(value) {
        const fields = value ?? [];
        this.fieldsState.set(fields);
        this.rememberValueOptions(fields);
        this.refreshOpenSuggestions();
    }
    set value(value) {
        const conditions = this.normalizeConditions(value ?? []);
        this.conditionsState.set(conditions);
        const targetId = this.draftState()?.targetId;
        if (targetId && !conditions.some(condition => condition.id === targetId)) {
            this.closeEditor(false);
        }
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    valueChange = new EventEmitter();
    valueSearch = new EventEmitter();
    valueRetry = new EventEmitter();
    clear = new EventEmitter();
    conditions$ = this.conditionsState.asReadonly();
    editorText$ = this.editorTextState.asReadonly();
    isOpen$ = this.openState.asReadonly();
    draft$ = this.draftState.asReadonly();
    hasConditions$ = computed(() => this.conditionsState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasConditions$" }] : /* istanbul ignore next */ []));
    hasHiddenQueryBefore$ = this.hasHiddenQueryBeforeState.asReadonly();
    hasHiddenQueryAfter$ = this.hasHiddenQueryAfterState.asReadonly();
    invalidConditionIds$ = computed(() => {
        const invalidIds = new Set();
        for (const [index, condition] of this.conditionsState().entries()) {
            if (!this.isConditionValid(condition, index)) {
                invalidIds.add(condition.id);
            }
        }
        return invalidIds;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "invalidConditionIds$" }] : /* istanbul ignore next */ []));
    validationMessages$ = computed(() => {
        if (this.disabledState()) {
            return [];
        }
        const messages = [...normalizeCxValidation(this.validationState())];
        if (this.invalidConditionIds$().size > 0) {
            messages.unshift({
                id: 'error:query-unavailable',
                type: 'error',
                message: 'Some filters are no longer available. Edit or remove them.',
            });
        }
        return messages;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationMessages$" }] : /* istanbul ignore next */ []));
    hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasError$" }] : /* istanbul ignore next */ []));
    showHint$ = computed(() => Boolean(this.hintState()) && this.validationMessages$().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showHint$" }] : /* istanbul ignore next */ []));
    suggestions$ = computed(() => this.buildSuggestions(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "suggestions$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        const field = this.fieldContainerRef?.nativeElement;
        this.overlay.sync(field);
        this.overlay.observeTrigger(field, () => {
            this.scheduleOverflowSync();
            if (this.openState()) {
                this.overlay.sync();
            }
        });
        if (typeof document !== 'undefined') {
            document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
        }
        this.scheduleOverflowSync();
    }
    ngAfterViewChecked() {
        this.scheduleOverflowSync();
    }
    ngOnDestroy() {
        this.overlay.destroy();
        if (typeof document !== 'undefined') {
            document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
        }
        if (typeof window !== 'undefined' && this.tabCloseTimer !== undefined) {
            window.clearTimeout(this.tabCloseTimer);
        }
        if (typeof window !== 'undefined' && this.editorFocusTimer !== undefined) {
            window.clearTimeout(this.editorFocusTimer);
        }
        if (typeof window !== 'undefined' && this.overflowSyncFrame !== undefined) {
            window.cancelAnimationFrame(this.overflowSyncFrame);
        }
    }
    isLocked() {
        return this.disabledState() || this.loadingState();
    }
    resolvedAriaLabelledBy() {
        return !this.ariaLabel?.trim() && this.label.trim() ? this.labelId : null;
    }
    resolvedAriaLabel() {
        return this.ariaLabel?.trim() || (!this.label.trim() ? 'Filters' : null);
    }
    resolvedAriaDescribedBy() {
        const ids = [this.statusId];
        if (this.showHint$() || this.validationMessages$().length > 0) {
            ids.push(this.messagesId);
        }
        return ids.join(' ');
    }
    editorStatusText() {
        const navigationStatus = this.navigationStatusState();
        if (navigationStatus) {
            return navigationStatus;
        }
        const draft = this.draftState();
        if (!draft || !this.openState()) {
            return 'Type to add a filter.';
        }
        if (this.isQueryFinishable()) {
            return 'Query ready. Press Control or Command plus Enter to finish.';
        }
        return this.stageHeading();
    }
    editorInputMode() {
        const source = this.valueSourceForDraft();
        if (this.draftState()?.stage !== 'value' || !source) {
            return null;
        }
        return source.kind === 'number' ? 'decimal' : null;
    }
    isDateValueStage() {
        const source = this.valueSourceForDraft();
        return this.draftState()?.stage === 'value' && source?.kind === 'date';
    }
    editorWidth() {
        if (this.isDateValueStage()) {
            return 15;
        }
        return Math.min(Math.max(this.editorTextState().length + 1, 2), 28);
    }
    activeDescendant() {
        const index = this.normalizedActiveSuggestionIndex();
        return this.openState() && index >= 0 ? this.suggestionDomId(index) : null;
    }
    suggestionDomId(index) {
        return `cx-query-field-option-${this.instanceId}-${index}`;
    }
    stageHeading() {
        switch (this.draftState()?.stage) {
            case 'operator':
                return 'Choose an operator';
            case 'value':
                return this.valueModeForDraft() === 'multiple' ? 'Choose values' : 'Choose a value';
            case 'join':
                return this.draftState()?.targetId ? 'Choose how filters combine' : 'Add another condition';
            case 'field':
            default:
                return 'Choose a field';
        }
    }
    listboxLabel() {
        return `${this.stageHeading()} for ${this.label.trim() || this.ariaLabel?.trim() || 'filters'}`;
    }
    currentSuggestionsLoading() {
        const source = this.valueSourceForDraft();
        return this.draftState()?.stage === 'value' && source?.kind === 'options' && source.loading === true;
    }
    currentSuggestionsError() {
        const source = this.valueSourceForDraft();
        if (this.draftState()?.stage !== 'value' || source?.kind !== 'options') {
            return undefined;
        }
        return source.error?.trim() || undefined;
    }
    emptyHeading() {
        const draft = this.draftState();
        const query = this.editorTextState().trim();
        if (draft?.stage === 'value') {
            const source = this.valueSourceForDraft(draft);
            if (source?.kind === 'number') {
                return 'Enter a valid number';
            }
            if (source?.kind === 'date') {
                return 'Enter a valid date';
            }
            if (source?.kind === 'text') {
                return 'Enter a value';
            }
        }
        if (query) {
            const object = draft?.stage === 'field'
                ? 'fields'
                : draft?.stage === 'operator'
                    ? 'operators'
                    : draft?.stage === 'join'
                        ? 'connectors'
                        : 'values';
            return `No ${object} match “${query}”`;
        }
        if (draft?.stage === 'operator') {
            return `No operators are available for ${this.fieldForDraft(draft)?.label ?? 'this field'}`;
        }
        if (draft?.stage === 'join') {
            return 'No connectors are available';
        }
        if (draft?.stage === 'value') {
            return `No values are available for ${this.fieldForDraft(draft)?.label ?? 'this field'}`;
        }
        return 'No filter fields are available';
    }
    emptyDescription() {
        const source = this.valueSourceForDraft();
        if (source?.kind === 'text') {
            return 'Type a value, then press Enter.';
        }
        if (source?.kind === 'date') {
            if (source.min && source.max) {
                return `Use a date from ${source.min} to ${source.max}.`;
            }
            if (source.min) {
                return `Use ${source.min} or later.`;
            }
            if (source.max) {
                return `Use ${source.max} or earlier.`;
            }
            return 'Use a date in YYYY-MM-DD format.';
        }
        if (source?.kind === 'number') {
            const step = source.step !== undefined ? ` in increments of ${source.step}` : '';
            if (source.min !== undefined && source.max !== undefined) {
                return `Use a number from ${source.min} to ${source.max}${step}.`;
            }
            if (source.min !== undefined) {
                return `Use ${source.min} or more${step}.`;
            }
            if (source.max !== undefined) {
                return `Use ${source.max} or less${step}.`;
            }
            return source.step !== undefined ? `Use increments of ${source.step}.` : undefined;
        }
        if (this.editorTextState().trim()) {
            return 'Try another search.';
        }
        return undefined;
    }
    onContainerClick() {
        if (this.isLocked()) {
            return;
        }
        if (!this.draftState()) {
            this.beginNewCondition();
            return;
        }
        this.focusEditor();
    }
    onSegmentsScroll() {
        this.scheduleOverflowSync();
    }
    onContainerFocusIn(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement) || target instanceof HTMLInputElement) {
            this.navigationStatusState.set('');
            return;
        }
        const conditionElement = target.closest('[data-query-condition-id]');
        const conditionId = conditionElement?.dataset['queryConditionId'];
        const condition = conditionId
            ? this.conditionsState().find(item => item.id === conditionId)
            : undefined;
        this.navigationStatusState.set(condition
            ? `${this.conditionSummary(condition)}. Press Backspace to remove this filter.`
            : '');
    }
    onContainerKeydown(event) {
        if (this.isLocked()
            || event.isComposing
            || event.altKey
            || event.ctrlKey
            || event.metaKey
            || event.shiftKey) {
            return;
        }
        const field = this.fieldContainerRef?.nativeElement;
        const eventTarget = event.target;
        if (!field || !(eventTarget instanceof HTMLElement)) {
            return;
        }
        if (event.key === 'Backspace' && !(eventTarget instanceof HTMLInputElement)) {
            const condition = eventTarget.closest('[data-query-condition-id]');
            const conditionId = condition?.dataset['queryConditionId'];
            if (!condition || !conditionId || !field.contains(condition)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            this.deleteConditionFromCaret(conditionId);
            return;
        }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }
        const current = eventTarget.closest('.cx-query-element, .cx-query-field__join, .cx-query-field__editor');
        if (!current || !field.contains(current)) {
            return;
        }
        if (current instanceof HTMLInputElement) {
            if (current.selectionStart !== current.selectionEnd || (this.openState() && current.value.length > 0)) {
                return;
            }
            const atStart = current.selectionStart === 0;
            const atEnd = current.selectionEnd === current.value.length;
            if ((event.key === 'ArrowLeft' && !atStart) || (event.key === 'ArrowRight' && !atEnd)) {
                return;
            }
        }
        const targets = this.queryNavigationTargets(field);
        let currentIndex = targets.indexOf(current);
        if (current instanceof HTMLInputElement && this.openState()) {
            const draft = this.draftState();
            if (this.hasUncommittedDraftChanges(draft)) {
                return;
            }
            currentIndex = this.navigationIndexForDraft(draft);
        }
        if (currentIndex < 0) {
            return;
        }
        const nextIndex = currentIndex + (event.key === 'ArrowLeft' ? -1 : 1);
        const descriptors = this.navigationDescriptors();
        if (nextIndex < 0 || nextIndex >= descriptors.length) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.navigateToDescriptor(descriptors[nextIndex]);
    }
    onEditorFocus() {
        if (this.suppressNextFocusOpen) {
            this.suppressNextFocusOpen = false;
            return;
        }
        if (this.isLocked()) {
            return;
        }
        if (!this.draftState()) {
            this.beginNewCondition();
        }
    }
    onEditorInput(event) {
        if (this.isLocked()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        if (!this.draftState()) {
            this.beginNewCondition();
        }
        this.structuredCaretState.set(false);
        const draft = this.draftState();
        if (draft?.stage === 'value' && this.valueSourceForDraft(draft)?.kind !== 'options') {
            this.draftState.set({ ...draft, value: undefined });
        }
        this.editorTextState.set(target.value);
        this.emitManualValueSearch(target.value);
        this.setActiveSuggestionToFirst();
        this.refreshPopoverMeasurement();
    }
    onEditorKeydown(event) {
        if (this.isLocked() || event.isComposing) {
            return;
        }
        if (eventMatchesShortcut(CX_QUERY_FIELD_FINISH_SHORTCUT, event)) {
            event.preventDefault();
            event.stopPropagation();
            if (this.isQueryFinishable()) {
                this.finishQuery();
            }
            return;
        }
        if (event.key === 'Tab') {
            if (!event.shiftKey && this.hasFooterAction()) {
                event.preventDefault();
                queueMicrotask(() => this.footerActionRef?.nativeElement.focus());
                return;
            }
            this.scheduleTabClose();
            return;
        }
        if (event.key === 'Escape') {
            if (this.openState()) {
                event.preventDefault();
                event.stopPropagation();
                this.closeEditor(true);
            }
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!this.openState()) {
                this.beginNewCondition();
                if (event.key === 'ArrowUp') {
                    queueMicrotask(() => this.moveActiveSuggestion(-1));
                }
                return;
            }
            this.moveActiveSuggestion(event.key === 'ArrowDown' ? 1 : -1);
            return;
        }
        if (event.key === 'Enter') {
            if (!this.openState()) {
                return;
            }
            event.preventDefault();
            const index = this.normalizedActiveSuggestionIndex();
            if (index >= 0) {
                this.selectSuggestion(index);
            }
            return;
        }
        if ((event.key === ' ' || event.key === 'Spacebar')
            && this.isMultipleValueStage()
            && this.isQueryFinishable()
            && !this.editorTextState()) {
            const index = this.normalizedActiveSuggestionIndex();
            const suggestion = this.suggestions$()[index];
            if (suggestion?.kind === 'value' && !suggestion.disabled) {
                event.preventDefault();
                this.selectSuggestion(index);
            }
            return;
        }
        if (event.key === 'Backspace' && !this.editorTextState()) {
            event.preventDefault();
            const draft = this.draftState();
            if (this.structuredCaretState()
                && draft?.targetId
                && !this.hasUncommittedDraftChanges(draft)) {
                this.deleteConditionFromCaret(draft.targetId);
                return;
            }
            this.handleBackspaceNavigation();
            return;
        }
    }
    openConditionPart(condition, stage, structuredNavigation = false) {
        if (this.isLocked()) {
            return;
        }
        this.cancelScheduledTabClose();
        const draft = {
            targetId: condition.id,
            stage,
            fieldId: condition.fieldId,
            operatorId: condition.operatorId,
            value: this.cloneValue(condition.value),
            join: condition.join === 'and' || condition.join === 'or' ? condition.join : undefined,
        };
        this.draftState.set(draft);
        this.structuredCaretState.set(structuredNavigation);
        this.editorTextState.set(stage === 'value' && !structuredNavigation ? this.scalarEditorText(draft) : '');
        this.openState.set(true);
        if (stage === 'value') {
            this.emitManualValueSearch('', draft);
        }
        this.setActiveSuggestionToFirst(true);
        this.openPopoverAndFocus();
    }
    openConditionPartFromPointer(condition, stage) {
        const source = this.fieldForCondition(condition)?.value;
        const structuredNavigation = stage !== 'value' || source?.kind === 'options';
        this.openConditionPart(condition, stage, structuredNavigation);
    }
    openDraftPart(stage) {
        const draft = this.draftState();
        if (!draft
            || this.isLocked()
            || (stage === 'join' && this.conditionsState().length === 0)
            || (stage === 'operator' && !draft.fieldId)) {
            return;
        }
        this.cancelScheduledTabClose();
        this.draftState.set({ ...draft, stage });
        this.structuredCaretState.set(false);
        this.editorTextState.set('');
        this.openState.set(true);
        this.transitionEditorStage();
    }
    isEditingPart(conditionId, stage) {
        const draft = this.draftState();
        return draft?.targetId === conditionId && draft.stage === stage;
    }
    isStructuredCaretVisible() {
        return this.structuredCaretState() && this.editorTextState().length === 0;
    }
    showStructuredNavigationTarget(conditionId, stage) {
        const draft = this.draftState();
        if (!this.structuredCaretState()
            || this.editorTextState().length > 0
            || draft?.targetId !== conditionId
            || draft.stage !== stage) {
            return false;
        }
        switch (stage) {
            case 'field':
                return Boolean(draft.fieldId);
            case 'operator':
                return Boolean(draft.operatorId);
            case 'value':
                return draft.value !== undefined
                    && (!Array.isArray(draft.value) || draft.value.length > 0);
            case 'join':
                return Boolean(draft.join);
        }
    }
    isDraftNew() {
        const draft = this.draftState();
        return Boolean(draft && !draft.targetId);
    }
    fieldElementData(condition) {
        const presentation = this.presentationCondition(condition);
        const label = this.fieldForCondition(presentation)?.label ?? (presentation.fieldId || 'Unknown field');
        return {
            kind: 'field',
            label,
            grouped: true,
            tabIndex: this.showStructuredNavigationTarget(condition.id, 'field') ? -1 : 0,
            disabled: this.isLocked(),
            ariaLabel: `Edit field: ${label}`,
        };
    }
    operatorElementData(condition) {
        const presentation = this.presentationCondition(condition);
        const label = this.operatorForCondition(presentation)?.label ?? (presentation.operatorId || 'Unknown operator');
        return {
            kind: 'operator',
            label,
            grouped: true,
            tabIndex: this.showStructuredNavigationTarget(condition.id, 'operator') ? -1 : 0,
            disabled: this.isLocked(),
            ariaLabel: `Edit operator: ${label}`,
        };
    }
    valueElementData(condition) {
        const presentation = this.presentationCondition(condition);
        const labels = this.valueLabelsForCondition(presentation);
        return {
            kind: 'values',
            values: labels.length > 0 ? labels : ['Choose value'],
            grouped: true,
            tabIndex: this.showStructuredNavigationTarget(condition.id, 'value') ? -1 : 0,
            disabled: this.isLocked(),
            ariaLabel: `Edit value: ${labels.join(', ') || 'Choose value'}`,
        };
    }
    draftFieldElementData() {
        const draft = this.draftState();
        const label = this.fieldForDraft(draft)?.label ?? draft?.fieldId ?? 'Unknown field';
        return {
            kind: 'field',
            label,
            grouped: true,
            tabIndex: 0,
            disabled: this.isLocked(),
            ariaLabel: `Edit field: ${label}`,
        };
    }
    draftOperatorElementData() {
        const draft = this.draftState();
        const label = this.operatorForDraft(draft)?.label ?? draft?.operatorId ?? 'Unknown operator';
        return {
            kind: 'operator',
            label,
            grouped: true,
            tabIndex: 0,
            disabled: this.isLocked(),
            ariaLabel: `Edit operator: ${label}`,
        };
    }
    draftValueSummary() {
        const draft = this.draftState();
        if (!draft || draft.stage !== 'value' || this.valueModeForDraft(draft) !== 'multiple') {
            return '';
        }
        return this.valueLabelsForDraft(draft).join(', ');
    }
    conditionNeedsValue(condition) {
        const presentation = this.presentationCondition(condition);
        return this.valueModeForCondition(presentation) !== 'none';
    }
    conditionJoinLabel(condition) {
        return condition.join === 'or' ? 'OR' : condition.join === 'and' ? 'AND' : 'JOIN';
    }
    draftJoinLabel() {
        return this.draftState()?.join === 'or' ? 'OR' : 'AND';
    }
    isConditionInvalid(conditionId) {
        return this.invalidConditionIds$().has(conditionId);
    }
    isSuggestionActive(index) {
        return this.normalizedActiveSuggestionIndex() === index;
    }
    suggestionAriaSelected(suggestion) {
        return String(Boolean(suggestion.selected));
    }
    showSuggestionCheckbox(suggestion) {
        return suggestion.kind === 'value' && this.valueModeForDraft() === 'multiple';
    }
    isMultipleValueStage() {
        return this.draftState()?.stage === 'value' && this.valueModeForDraft() === 'multiple';
    }
    onSuggestionPointerDown(event) {
        event.preventDefault();
    }
    setActiveSuggestion(index) {
        const suggestion = this.suggestions$()[index];
        if (!suggestion?.disabled) {
            this.activeSuggestionIndexState.set(index);
        }
    }
    selectSuggestion(index) {
        const suggestion = this.suggestions$()[index];
        if (!suggestion || suggestion.disabled || this.isLocked()) {
            return;
        }
        switch (suggestion.kind) {
            case 'field':
                this.selectField(suggestion.id);
                break;
            case 'operator':
                this.selectOperator(suggestion.id);
                break;
            case 'value':
                this.selectOptionValue(suggestion.id);
                break;
            case 'join':
                this.selectJoin(suggestion.id === 'or' ? 'or' : 'and');
                break;
            case 'custom':
                this.commitCustomValue();
                break;
        }
    }
    multipleSelectionCount() {
        const draft = this.draftState();
        return draft?.stage === 'value' && this.valueModeForDraft(draft) === 'multiple'
            ? this.draftSelectedValues(draft).length
            : 0;
    }
    isQueryFinishable() {
        if (this.invalidConditionIds$().size > 0) {
            return false;
        }
        const draft = this.draftState();
        if (!draft || !this.openState()) {
            return false;
        }
        if (draft.stage === 'join') {
            return this.conditionsState().length > 0;
        }
        return draft.stage === 'value'
            && this.valueModeForDraft(draft) === 'multiple'
            && this.multipleSelectionCount() > 0;
    }
    finishQuery() {
        if (!this.isQueryFinishable()) {
            return;
        }
        const draft = this.draftState();
        if (draft?.stage === 'value' && this.valueModeForDraft(draft) === 'multiple') {
            this.commitDraftCondition(true);
            return;
        }
        this.closeEditor(true);
    }
    retryValues() {
        this.retryCurrentValues();
    }
    removeCurrentCondition() {
        const conditionId = this.draftState()?.targetId;
        if (conditionId) {
            this.deleteConditionFromCaret(conditionId);
        }
    }
    canRemoveCurrentCondition() {
        return Boolean(this.draftState()?.targetId);
    }
    onFooterActionKeydown(event) {
        if (eventMatchesShortcut(CX_QUERY_FIELD_FINISH_SHORTCUT, event)) {
            event.preventDefault();
            event.stopPropagation();
            this.finishQuery();
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeEditor(true);
            return;
        }
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                event.preventDefault();
                this.focusEditor();
                return;
            }
            this.scheduleTabClose();
        }
    }
    onClear(event) {
        event?.preventDefault();
        event?.stopPropagation();
        if (this.isLocked() || !this.clearable || this.conditionsState().length === 0) {
            return;
        }
        this.closeEditor(true);
        this.emitValue([]);
        this.clear.emit();
    }
    cancelEditor() {
        this.closeEditor(true);
    }
    onWindowResize() {
        if (this.openState()) {
            this.overlay.sync();
        }
    }
    onDocumentPointerDown(event) {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        const field = this.fieldContainerRef?.nativeElement;
        const surface = this.popoverRef?.surfaceElement();
        if (field?.contains(target) || surface?.contains(target)) {
            return;
        }
        this.closeEditor(false);
    }
    onDocumentFocusIn(event) {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        const field = this.fieldContainerRef?.nativeElement;
        const surface = this.popoverRef?.surfaceElement();
        if (!field?.contains(target) && !surface?.contains(target)) {
            this.closeEditor(false);
        }
    }
    onCapturedDocumentScroll = (event) => {
        if (!this.openState()) {
            return;
        }
        const target = event.target;
        const surface = this.popoverRef?.surfaceElement();
        if (target instanceof Node && surface?.contains(target)) {
            return;
        }
        this.overlay.sync();
    };
    beginNewCondition() {
        if (this.isLocked()) {
            return;
        }
        this.cancelScheduledTabClose();
        this.draftState.set({
            stage: this.conditionsState().length > 0 ? 'join' : 'field',
        });
        this.structuredCaretState.set(true);
        this.editorTextState.set('');
        this.openState.set(true);
        this.setActiveSuggestionToFirst();
        this.openPopoverAndFocus();
    }
    queryNavigationTargets(field) {
        return Array.from(field.querySelectorAll('.cx-query-element:not(:disabled), .cx-query-field__join:not(:disabled), .cx-query-field__editor:not(:disabled)'));
    }
    navigationDescriptors() {
        const descriptors = [];
        for (const [index, condition] of this.conditionsState().entries()) {
            if (index > 0) {
                descriptors.push({ conditionId: condition.id, part: 'join' });
            }
            descriptors.push({ conditionId: condition.id, part: 'field' }, { conditionId: condition.id, part: 'operator' });
            if (this.valueModeForCondition(condition) !== 'none') {
                descriptors.push({ conditionId: condition.id, part: 'value' });
            }
        }
        descriptors.push({ part: 'tail' });
        return descriptors;
    }
    navigationIndexForDraft(draft) {
        const descriptors = this.navigationDescriptors();
        if (!draft?.targetId) {
            return descriptors.length - 1;
        }
        return descriptors.findIndex(descriptor => descriptor.conditionId === draft.targetId && descriptor.part === draft.stage);
    }
    navigateToDescriptor(descriptor) {
        if (descriptor.part === 'tail') {
            this.closeEditor(false);
            this.beginNewCondition();
            return;
        }
        const condition = descriptor.conditionId
            ? this.conditionsState().find(item => item.id === descriptor.conditionId)
            : undefined;
        if (condition) {
            this.openConditionPart(condition, descriptor.part, true);
        }
    }
    hasUncommittedDraftChanges(draft) {
        if (!draft) {
            return false;
        }
        if (!draft.targetId) {
            return draft.join !== undefined
                || draft.fieldId !== undefined
                || draft.operatorId !== undefined
                || draft.value !== undefined;
        }
        const committed = this.conditionsState().find(condition => condition.id === draft.targetId);
        if (!committed) {
            return true;
        }
        return draft.fieldId !== committed.fieldId
            || draft.operatorId !== committed.operatorId
            || draft.join !== committed.join
            || !this.queryValuesEqual(draft.value, committed.value);
    }
    queryValuesEqual(first, second) {
        if (Array.isArray(first) || Array.isArray(second)) {
            return Array.isArray(first)
                && Array.isArray(second)
                && first.length === second.length
                && first.every((value, index) => value === second[index]);
        }
        return first === second;
    }
    conditionSummary(condition) {
        const field = this.fieldForCondition(condition)?.label ?? condition.fieldId;
        const operator = this.operatorForCondition(condition)?.label ?? condition.operatorId;
        const value = this.valueLabelsForCondition(condition).join(', ');
        return [field, operator, value].filter(Boolean).join(' ');
    }
    deleteConditionFromCaret(conditionId) {
        const conditions = this.conditionsState();
        const index = conditions.findIndex(condition => condition.id === conditionId);
        if (index < 0) {
            return;
        }
        const previous = conditions[index - 1];
        const next = conditions[index + 1];
        this.closeEditor(false);
        this.emitValue(conditions.filter(condition => condition.id !== conditionId));
        if (previous) {
            this.navigateToDescriptor({
                conditionId: previous.id,
                part: this.valueModeForCondition(previous) === 'none' ? 'operator' : 'value',
            });
        }
        else if (next) {
            this.navigateToDescriptor({ conditionId: next.id, part: 'field' });
        }
        else {
            this.navigateToDescriptor({ part: 'tail' });
        }
    }
    scheduleOverflowSync() {
        if (typeof window === 'undefined' || this.overflowSyncFrame !== undefined) {
            return;
        }
        this.overflowSyncFrame = window.requestAnimationFrame(() => {
            this.overflowSyncFrame = undefined;
            this.syncOverflowAffordance();
        });
    }
    syncOverflowAffordance() {
        const segments = this.segmentsRef?.nativeElement;
        if (!segments || this.growVertically) {
            this.hasHiddenQueryBeforeState.set(false);
            this.hasHiddenQueryAfterState.set(false);
            return;
        }
        const maxScrollLeft = Math.max(segments.scrollWidth - segments.clientWidth, 0);
        const tolerance = 1;
        this.hasHiddenQueryBeforeState.set(maxScrollLeft > tolerance && segments.scrollLeft > tolerance);
        this.hasHiddenQueryAfterState.set(maxScrollLeft > tolerance && segments.scrollLeft < maxScrollLeft - tolerance);
    }
    selectField(fieldId) {
        const draft = this.draftState();
        const field = this.fieldsState().find(item => item.id === fieldId);
        if (!draft || !field || field.disabled) {
            return;
        }
        const sameField = draft.fieldId === fieldId;
        const nextOperatorId = sameField && field.operators.some(operator => operator.id === draft.operatorId)
            ? draft.operatorId
            : undefined;
        this.draftState.set({
            ...draft,
            stage: 'operator',
            fieldId,
            operatorId: nextOperatorId,
            value: sameField ? this.cloneValue(draft.value) : undefined,
        });
        this.editorTextState.set('');
        this.transitionEditorStage();
    }
    selectOperator(operatorId) {
        const draft = this.draftState();
        const field = this.fieldForDraft(draft);
        const operator = field?.operators.find(item => item.id === operatorId);
        if (!draft || !field || !operator || operator.disabled) {
            return;
        }
        const previousMode = this.valueModeForDraft(draft);
        const nextMode = this.valueModeForOperator(operator);
        const preserveValue = Boolean(draft.operatorId) && previousMode === nextMode;
        const nextDraft = {
            ...draft,
            stage: nextMode === 'none' ? 'operator' : 'value',
            operatorId,
            value: preserveValue ? this.cloneValue(draft.value) : undefined,
        };
        this.draftState.set(nextDraft);
        this.editorTextState.set(nextMode === 'none' ? '' : this.scalarEditorText(nextDraft));
        if (nextMode === 'none') {
            this.commitDraftCondition();
            return;
        }
        this.emitManualValueSearch('');
        this.transitionEditorStage();
    }
    selectOptionValue(valueId) {
        const draft = this.draftState();
        if (!draft || draft.stage !== 'value') {
            return;
        }
        const source = this.valueSourceForDraft(draft);
        if (source?.kind !== 'options') {
            return;
        }
        const option = source.options.find(item => item.id === valueId) ?? this.knownValueOptionsState().get(draft.fieldId ?? '')?.get(valueId);
        if (option?.disabled) {
            return;
        }
        if (this.valueModeForDraft(draft) === 'multiple') {
            const selected = this.draftSelectedValues(draft);
            const nextValues = selected.includes(valueId)
                ? selected.filter(id => id !== valueId)
                : [...selected, valueId];
            this.draftState.set({ ...draft, value: nextValues });
            this.editorTextState.set('');
            this.emitManualValueSearch('');
            this.setActiveSuggestionToKey(`value:${valueId}`);
            this.refreshPopoverMeasurement();
            this.focusEditor();
            return;
        }
        this.draftState.set({ ...draft, value: valueId });
        this.commitDraftCondition();
    }
    selectJoin(join) {
        const draft = this.draftState();
        if (!draft || draft.stage !== 'join') {
            return;
        }
        if (!draft.targetId) {
            this.draftState.set({ ...draft, stage: 'field', join });
            this.editorTextState.set('');
            this.transitionEditorStage();
            return;
        }
        const next = this.conditionsState().map((condition, index) => condition.id === draft.targetId
            ? { ...condition, join: index === 0 ? undefined : join }
            : condition);
        this.emitValue(next);
        this.closeEditor(true);
    }
    commitCustomValue() {
        const draft = this.draftState();
        if (!draft || draft.stage !== 'value') {
            return;
        }
        const value = this.parseCustomValue(this.editorTextState(), this.valueSourceForDraft(draft));
        if (value === undefined) {
            return;
        }
        this.draftState.set({ ...draft, value });
        this.commitDraftCondition();
    }
    commitDraftCondition(finishQuery = false) {
        const draft = this.draftState();
        if (!draft?.fieldId || !draft.operatorId) {
            return;
        }
        const operator = this.operatorForDraft(draft);
        const mode = this.valueModeForOperator(operator);
        if (mode !== 'none' && !this.isDraftValueComplete(draft, mode)) {
            return;
        }
        const current = this.conditionsState();
        const targetIndex = draft.targetId ? current.findIndex(condition => condition.id === draft.targetId) : -1;
        if (targetIndex < 0 && current.length > 0 && !draft.join) {
            return;
        }
        const condition = {
            id: draft.targetId ?? `query-condition-${this.instanceId}-${++this.nextConditionId}`,
            fieldId: draft.fieldId,
            operatorId: draft.operatorId,
            value: mode === 'none' ? undefined : this.cloneValue(draft.value),
            join: (targetIndex >= 0 ? targetIndex : current.length) > 0 ? draft.join : undefined,
        };
        const editingExisting = targetIndex >= 0;
        const next = editingExisting
            ? current.map((item, index) => index === targetIndex ? condition : item)
            : [...current, condition];
        this.emitValue(next);
        if (editingExisting || finishQuery) {
            this.closeEditor(true);
            return;
        }
        this.beginNewCondition();
    }
    retryCurrentValues() {
        const draft = this.draftState();
        if (!draft?.fieldId) {
            return;
        }
        this.valueRetry.emit({ fieldId: draft.fieldId, query: this.editorTextState() });
        this.focusEditor();
    }
    hasFooterAction() {
        return Boolean(this.currentSuggestionsError())
            || this.isQueryFinishable()
            || this.canRemoveCurrentCondition();
    }
    closeEditor(focus) {
        this.cancelScheduledTabClose();
        this.openState.set(false);
        this.draftState.set(undefined);
        this.structuredCaretState.set(false);
        this.editorTextState.set('');
        this.activeSuggestionIndexState.set(-1);
        this.overlay.endSession();
        if (focus) {
            this.suppressNextFocusOpen = true;
            this.focusEditor();
        }
        else {
            this.suppressNextFocusOpen = false;
        }
    }
    openPopoverAndFocus() {
        this.overlay.endSession();
        queueMicrotask(() => {
            this.overlay.sync(this.fieldContainerRef?.nativeElement);
            this.focusEditor();
        });
    }
    transitionEditorStage() {
        this.overlay.resetMeasurement();
        this.structuredCaretState.set(this.editorTextState().length === 0);
        this.setActiveSuggestionToFirst(true);
        queueMicrotask(() => {
            this.overlay.sync(this.fieldContainerRef?.nativeElement);
            this.focusEditor();
        });
    }
    focusEditor() {
        if (typeof window === 'undefined') {
            queueMicrotask(() => this.editorInputRef?.nativeElement.focus());
            return;
        }
        if (this.editorFocusTimer !== undefined) {
            window.clearTimeout(this.editorFocusTimer);
        }
        this.editorFocusTimer = window.setTimeout(() => {
            this.editorFocusTimer = undefined;
            const input = this.editorInputRef?.nativeElement;
            input?.focus();
            queueMicrotask(() => {
                // focus() is synchronous when focus actually moves. If the input was
                // already focused, no focus event consumes the guard, so release it.
                this.suppressNextFocusOpen = false;
            });
        }, 0);
    }
    scheduleTabClose() {
        if (typeof window === 'undefined') {
            this.closeEditor(false);
            return;
        }
        if (this.tabCloseTimer !== undefined) {
            window.clearTimeout(this.tabCloseTimer);
        }
        this.tabCloseTimer = window.setTimeout(() => {
            this.tabCloseTimer = undefined;
            this.closeEditor(false);
        }, 0);
    }
    cancelScheduledTabClose() {
        if (typeof window === 'undefined' || this.tabCloseTimer === undefined) {
            return;
        }
        window.clearTimeout(this.tabCloseTimer);
        this.tabCloseTimer = undefined;
    }
    handleBackspaceNavigation() {
        const draft = this.draftState();
        if (!draft) {
            this.editPreviousCondition();
            return;
        }
        if (draft.stage === 'value') {
            if (this.valueModeForDraft(draft) === 'multiple' && this.removeLastDraftValue(draft)) {
                return;
            }
            this.draftState.set({ ...draft, stage: 'operator' });
            this.editorTextState.set('');
            this.transitionEditorStage();
            return;
        }
        if (draft.stage === 'operator') {
            this.draftState.set({ ...draft, stage: 'field' });
            this.editorTextState.set('');
            this.transitionEditorStage();
            return;
        }
        if (draft.stage === 'field') {
            if (!draft.targetId && this.conditionsState().length > 0) {
                this.draftState.set({ ...draft, stage: 'join' });
                this.editorTextState.set('');
                this.transitionEditorStage();
            }
            else if (draft.targetId) {
                this.structuredCaretState.set(true);
            }
            return;
        }
        this.editPreviousCondition(draft.targetId);
    }
    removeLastDraftValue(draft) {
        const selected = this.draftSelectedValues(draft);
        if (selected.length === 0) {
            return false;
        }
        this.draftState.set({ ...draft, value: selected.slice(0, -1) });
        this.editorTextState.set('');
        this.emitManualValueSearch('');
        this.setActiveSuggestionToFirst();
        this.refreshPopoverMeasurement();
        return true;
    }
    editPreviousCondition(beforeConditionId) {
        const conditions = this.conditionsState();
        const beforeIndex = beforeConditionId
            ? conditions.findIndex(condition => condition.id === beforeConditionId)
            : conditions.length;
        if (beforeIndex <= 0) {
            return;
        }
        const condition = conditions[beforeIndex - 1];
        this.openConditionPart(condition, this.conditionNeedsValue(condition) ? 'value' : 'operator', true);
    }
    buildSuggestions() {
        const draft = this.draftState();
        if (!this.openState() || !draft) {
            return [];
        }
        if (draft.stage === 'field') {
            return this.filterOptions(this.fieldsState(), this.editorTextState()).map(field => ({
                key: `field:${field.id}`,
                kind: 'field',
                id: field.id,
                label: field.label,
                description: field.description,
                disabled: field.disabled,
                selected: field.id === draft.fieldId,
            }));
        }
        if (draft.stage === 'operator') {
            const field = this.fieldForDraft(draft);
            return this.filterOptions(field?.operators ?? [], this.editorTextState()).map(operator => ({
                key: `operator:${operator.id}`,
                kind: 'operator',
                id: operator.id,
                label: operator.label,
                description: operator.description,
                disabled: operator.disabled,
                selected: operator.id === draft.operatorId,
            }));
        }
        if (draft.stage === 'join') {
            return this.filterOptions(CX_QUERY_FIELD_JOIN_OPTIONS, this.editorTextState()).map(option => ({
                key: `join:${option.id}`,
                kind: 'join',
                id: option.id,
                label: option.label,
                description: option.description,
                selected: draft.join === option.id,
            }));
        }
        const source = this.valueSourceForDraft(draft);
        if (!source) {
            return [];
        }
        if (source.kind === 'options') {
            if (source.loading) {
                return [];
            }
            if (source.error?.trim()) {
                return [];
            }
            const options = source.filterMode === 'manual'
                ? source.options
                : this.filterOptions(source.options, this.editorTextState());
            const selectedIds = this.draftSelectedValues(draft);
            const suggestions = options.map(option => ({
                key: `value:${option.id}`,
                kind: 'value',
                id: option.id,
                label: option.label,
                description: option.description,
                disabled: option.disabled,
                selected: selectedIds.includes(option.id),
            }));
            return suggestions;
        }
        const query = this.editorTextState().trim();
        const customValue = this.parseCustomValue(query, source);
        if (!query || customValue === undefined) {
            return [];
        }
        return [{
                key: `custom:${query}`,
                kind: 'custom',
                id: query,
                label: `Use “${query}”`,
            }];
    }
    filterOptions(options, query) {
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) {
            return options;
        }
        return options
            .map((option, index) => ({ option, index, score: this.optionMatchScore(option, normalized) }))
            .filter(entry => entry.score < Number.POSITIVE_INFINITY)
            .sort((a, b) => a.score - b.score || a.index - b.index)
            .map(entry => entry.option);
    }
    optionMatchScore(option, query) {
        const label = option.label.toLocaleLowerCase();
        if (label.startsWith(query)) {
            return 0;
        }
        if (label.split(/\s+/).some(word => word.startsWith(query))) {
            return 1;
        }
        if (label.includes(query)) {
            return 2;
        }
        const supporting = [option.id, option.description, ...(option.keywords ?? [])]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase();
        return supporting.includes(query) ? 3 : Number.POSITIVE_INFINITY;
    }
    moveActiveSuggestion(delta) {
        const suggestions = this.suggestions$();
        if (suggestions.length === 0) {
            this.activeSuggestionIndexState.set(-1);
            return;
        }
        const enabled = suggestions
            .map((suggestion, index) => ({ suggestion, index }))
            .filter(entry => !entry.suggestion.disabled)
            .map(entry => entry.index);
        if (enabled.length === 0) {
            this.activeSuggestionIndexState.set(-1);
            return;
        }
        const current = this.normalizedActiveSuggestionIndex();
        const position = enabled.indexOf(current);
        const nextPosition = position < 0
            ? delta === 1 ? 0 : enabled.length - 1
            : (position + delta + enabled.length) % enabled.length;
        this.activeSuggestionIndexState.set(enabled[nextPosition]);
        this.scrollActiveSuggestionIntoView();
    }
    scrollActiveSuggestionIntoView() {
        queueMicrotask(() => {
            const index = this.normalizedActiveSuggestionIndex();
            if (index < 0) {
                return;
            }
            const option = this.popoverRef?.surfaceElement()?.querySelector(`#${this.suggestionDomId(index)}`);
            option?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        });
    }
    setActiveSuggestionToFirst(preferSelected = false) {
        const suggestions = this.suggestions$();
        const selectedIndex = preferSelected
            ? suggestions.findIndex(suggestion => suggestion.selected && !suggestion.disabled)
            : -1;
        const index = selectedIndex >= 0
            ? selectedIndex
            : suggestions.findIndex(suggestion => !suggestion.disabled);
        this.activeSuggestionIndexState.set(index);
        this.scrollActiveSuggestionIntoView();
    }
    setActiveSuggestionToKey(key) {
        const suggestions = this.suggestions$();
        const requestedIndex = suggestions.findIndex(suggestion => suggestion.key === key && !suggestion.disabled);
        const index = requestedIndex >= 0
            ? requestedIndex
            : suggestions.findIndex(suggestion => !suggestion.disabled);
        this.activeSuggestionIndexState.set(index);
        this.scrollActiveSuggestionIntoView();
    }
    normalizedActiveSuggestionIndex() {
        const suggestions = this.suggestions$();
        const current = this.activeSuggestionIndexState();
        if (current >= 0 && current < suggestions.length && !suggestions[current].disabled) {
            return current;
        }
        return suggestions.findIndex(suggestion => !suggestion.disabled);
    }
    presentationCondition(condition) {
        const draft = this.draftState();
        if (!draft || draft.targetId !== condition.id || draft.stage === 'field' || draft.stage === 'join') {
            return condition;
        }
        return {
            ...condition,
            fieldId: draft.fieldId ?? condition.fieldId,
            operatorId: draft.operatorId ?? condition.operatorId,
            value: this.cloneValue(draft.value),
        };
    }
    fieldForCondition(condition) {
        return this.fieldsState().find(field => field.id === condition.fieldId);
    }
    operatorForCondition(condition) {
        return this.fieldForCondition(condition)?.operators.find(operator => operator.id === condition.operatorId);
    }
    fieldForDraft(draft = this.draftState()) {
        return this.fieldsState().find(field => field.id === draft?.fieldId);
    }
    operatorForDraft(draft = this.draftState()) {
        return this.fieldForDraft(draft)?.operators.find(operator => operator.id === draft?.operatorId);
    }
    valueSourceForDraft(draft = this.draftState()) {
        return this.fieldForDraft(draft)?.value;
    }
    valueModeForOperator(operator) {
        return operator?.valueMode ?? 'single';
    }
    valueModeForDraft(draft = this.draftState()) {
        return this.valueModeForOperator(this.operatorForDraft(draft));
    }
    valueModeForCondition(condition) {
        return this.valueModeForOperator(this.operatorForCondition(condition));
    }
    scalarEditorText(draft) {
        const source = this.valueSourceForDraft(draft);
        if (!source || source.kind === 'options' || draft.value === undefined || Array.isArray(draft.value)) {
            return '';
        }
        return String(draft.value);
    }
    draftSelectedValues(draft) {
        if (Array.isArray(draft.value)) {
            return [...draft.value];
        }
        return typeof draft.value === 'string' ? [draft.value] : [];
    }
    valueLabelsForDraft(draft) {
        if (!draft.fieldId) {
            return [];
        }
        return this.valueLabels(draft.fieldId, draft.value);
    }
    valueLabelsForCondition(condition) {
        return this.valueLabels(condition.fieldId, condition.value);
    }
    valueLabels(fieldId, value) {
        if (value === undefined) {
            return [];
        }
        const values = Array.isArray(value) ? value : [String(value)];
        const field = this.fieldsState().find(item => item.id === fieldId);
        const source = field?.value;
        if (source?.kind !== 'options') {
            return values.map(item => String(item));
        }
        const known = this.knownValueOptionsState().get(fieldId);
        return values.map(id => source.options.find(option => option.id === id)?.label ?? known?.get(id)?.label ?? id);
    }
    isDraftValueComplete(draft, mode) {
        if (mode === 'none') {
            return true;
        }
        if (mode === 'multiple') {
            return Array.isArray(draft.value) && draft.value.length > 0;
        }
        if (Array.isArray(draft.value) || draft.value === undefined) {
            return false;
        }
        return typeof draft.value === 'number'
            ? Number.isFinite(draft.value)
            : typeof draft.value === 'string' && draft.value.trim().length > 0;
    }
    parseCustomValue(text, source) {
        const value = text.trim();
        if (!source || source.kind === 'options' || !value) {
            return undefined;
        }
        if (source.kind === 'text') {
            return value;
        }
        if (source.kind === 'date') {
            return this.isDateWithinConstraints(value, source) ? value : undefined;
        }
        const number = Number(value);
        return this.isNumberWithinConstraints(number, source) ? number : undefined;
    }
    isConditionValid(condition, index) {
        if (index > 0 && condition.join !== 'and' && condition.join !== 'or') {
            return false;
        }
        const field = this.fieldForCondition(condition);
        const operator = this.operatorForCondition(condition);
        if (!field || !operator) {
            return false;
        }
        const mode = this.valueModeForOperator(operator);
        if (mode === 'none') {
            return true;
        }
        if (mode === 'multiple') {
            if (field.value.kind !== 'options' || !Array.isArray(condition.value) || condition.value.length === 0) {
                return false;
            }
            return field.value.filterMode === 'manual'
                || condition.value.every(id => field.value.kind === 'options' && field.value.options.some(option => option.id === id));
        }
        if (Array.isArray(condition.value) || condition.value === undefined) {
            return false;
        }
        if (field.value.kind === 'number') {
            return typeof condition.value === 'number' && this.isNumberWithinConstraints(condition.value, field.value);
        }
        if (typeof condition.value !== 'string' || !condition.value.trim()) {
            return false;
        }
        if (field.value.kind === 'date') {
            return this.isDateWithinConstraints(condition.value, field.value);
        }
        return field.value.kind !== 'options'
            || field.value.filterMode === 'manual'
            || field.value.options.some(option => option.id === condition.value);
    }
    isNumberWithinConstraints(value, source) {
        if (!Number.isFinite(value)) {
            return false;
        }
        if (source.min !== undefined && value < source.min) {
            return false;
        }
        if (source.max !== undefined && value > source.max) {
            return false;
        }
        if (source.step === undefined) {
            return true;
        }
        if (!Number.isFinite(source.step) || source.step <= 0) {
            return false;
        }
        const steps = (value - (source.min ?? 0)) / source.step;
        const tolerance = Number.EPSILON * Math.max(1, Math.abs(steps)) * 8;
        return Math.abs(steps - Math.round(steps)) <= tolerance;
    }
    isDateWithinConstraints(value, source) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) {
            return false;
        }
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        if (year < 1) {
            return false;
        }
        const date = new Date(0);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month - 1, day);
        if (date.getUTCFullYear() !== year
            || date.getUTCMonth() !== month - 1
            || date.getUTCDate() !== day) {
            return false;
        }
        return (source.min === undefined || value >= source.min)
            && (source.max === undefined || value <= source.max);
    }
    emitValue(value) {
        const normalized = this.normalizeJoins(value);
        this.conditionsState.set(normalized);
        this.valueChange.emit(normalized);
    }
    emitManualValueSearch(query, draft = this.draftState()) {
        const source = this.valueSourceForDraft(draft);
        if (draft?.stage === 'value' && draft.fieldId && source?.kind === 'options' && source.filterMode === 'manual') {
            this.valueSearch.emit({ fieldId: draft.fieldId, query });
        }
    }
    rememberValueOptions(fields) {
        const next = new Map(this.knownValueOptionsState());
        for (const field of fields) {
            if (field.value.kind !== 'options') {
                continue;
            }
            const known = new Map(next.get(field.id) ?? []);
            for (const option of field.value.options) {
                known.set(option.id, option);
            }
            next.set(field.id, known);
        }
        this.knownValueOptionsState.set(next);
    }
    normalizeConditions(value) {
        const seenIds = new Set();
        return value.map((condition, index) => {
            const requestedId = condition.id?.trim() || `query-condition-${this.instanceId}-external-${index + 1}`;
            let id = requestedId;
            let suffix = index + 1;
            while (seenIds.has(id)) {
                id = `${requestedId}-${suffix++}`;
            }
            seenIds.add(id);
            return {
                id,
                fieldId: condition.fieldId ?? '',
                operatorId: condition.operatorId ?? '',
                value: this.cloneValue(condition.value),
                join: index === 0
                    ? undefined
                    : condition.join === 'and' || condition.join === 'or'
                        ? condition.join
                        : undefined,
            };
        });
    }
    normalizeJoins(value) {
        return value.map((condition, index) => ({
            ...condition,
            join: index === 0
                ? undefined
                : condition.join === 'and' || condition.join === 'or'
                    ? condition.join
                    : undefined,
        }));
    }
    cloneValue(value) {
        return Array.isArray(value) ? [...value] : value;
    }
    refreshOpenSuggestions() {
        if (!this.openState()) {
            return;
        }
        this.setActiveSuggestionToFirst(!this.editorTextState().trim());
        this.refreshPopoverMeasurement();
    }
    refreshPopoverMeasurement() {
        if (!this.openState()) {
            return;
        }
        queueMicrotask(() => {
            this.overlay.resetMeasurement();
            this.overlay.sync(this.fieldContainerRef?.nativeElement);
        });
    }
    measureOverlay(rect, viewport) {
        const viewportMaxWidth = Math.max(viewport.width - 16, 0);
        const width = Math.floor(Math.min(Math.max(rect.width, CX_QUERY_FIELD_POPOVER_MIN_WIDTH), CX_QUERY_FIELD_POPOVER_MAX_WIDTH, viewportMaxWidth));
        const stateHeight = this.currentSuggestionsLoading() || this.currentSuggestionsError() || this.suggestions$().length === 0
            ? 132
            : 0;
        const footerHeight = this.hasFooterAction() ? CX_QUERY_FIELD_OPTION_HEIGHT : 0;
        const estimatedContentHeight = Math.min(36 + this.suggestions$().length * CX_QUERY_FIELD_OPTION_HEIGHT + stateHeight + footerHeight, CX_QUERY_FIELD_POPOVER_MAX_HEIGHT);
        const estimatedHeight = estimatedContentHeight + CX_QUERY_FIELD_POPOVER_FRAME_HEIGHT;
        return {
            width,
            minWidth: width,
            estimatedHeight,
            align: 'start',
            maxHeightCap: estimatedHeight,
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxQueryFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxQueryFieldComponent, isStandalone: true, selector: "cx-query-field", inputs: { label: "label", hint: "hint", optional: "optional", size: "size", growVertically: "growVertically", clearable: "clearable", ariaLabel: "ariaLabel", disabled: "disabled", loading: "loading", fields: "fields", value: "value", validation: "validation" }, outputs: { valueChange: "valueChange", valueSearch: "valueSearch", valueRetry: "valueRetry", clear: "clear" }, host: { listeners: { "window:resize": "onWindowResize()", "document:pointerdown": "onDocumentPointerDown($event)", "document:focusin": "onDocumentFocusIn($event)" } }, viewQueries: [{ propertyName: "fieldContainerRef", first: true, predicate: ["fieldContainer"], descendants: true, read: ElementRef }, { propertyName: "segmentsRef", first: true, predicate: ["segments"], descendants: true, read: ElementRef }, { propertyName: "editorInputRef", first: true, predicate: ["editorInput"], descendants: true, read: ElementRef }, { propertyName: "footerActionRef", first: true, predicate: ["footerAction"], descendants: true, read: ElementRef }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }], ngImport: i0, template: "<div\n  class=\"cx-query-field\"\n  [class.cx-query-field--small]=\"size === 'small'\"\n  [class.cx-query-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-query-field__header\">\n      <label class=\"cx-query-field__label\" [id]=\"labelId\" [for]=\"inputId\">{{ label }}</label>\n      @if (optional) {\n        <div class=\"cx-query-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <ng-template #editorTemplate>\n    <span\n      class=\"cx-query-field__editor-slot\"\n      [class.cx-query-field__editor-slot--caret]=\"isStructuredCaretVisible()\"\n    >\n      <input\n        #editorInput\n        class=\"cx-query-field__editor\"\n        [class.cx-query-field__editor--date]=\"isDateValueStage()\"\n        [id]=\"inputId\"\n        type=\"text\"\n        [value]=\"editorText$()\"\n        [style.width.ch]=\"isStructuredCaretVisible() ? null : editorWidth()\"\n        [disabled]=\"isLocked()\"\n        [attr.inputmode]=\"editorInputMode()\"\n        [attr.aria-label]=\"resolvedAriaLabel()\"\n        [attr.aria-labelledby]=\"resolvedAriaLabelledBy()\"\n        [attr.aria-describedby]=\"resolvedAriaDescribedBy()\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        [attr.aria-required]=\"optional ? null : 'true'\"\n        [attr.aria-disabled]=\"disabled ? 'true' : null\"\n        [attr.aria-busy]=\"loading || currentSuggestionsLoading() ? 'true' : null\"\n        [attr.aria-expanded]=\"isOpen$()\"\n        [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n        [attr.aria-activedescendant]=\"activeDescendant()\"\n        aria-autocomplete=\"list\"\n        aria-haspopup=\"listbox\"\n        role=\"combobox\"\n        autocomplete=\"off\"\n        spellcheck=\"false\"\n        data-shortcut-ignore=\"ArrowDown,ArrowUp,ArrowLeft,ArrowRight,Enter,Escape,Backspace,Delete\"\n        (focus)=\"onEditorFocus()\"\n        (input)=\"onEditorInput($event)\"\n        (keydown)=\"onEditorKeydown($event)\"\n      />\n    </span>\n  </ng-template>\n\n  <div\n    #fieldContainer\n    class=\"cx-query-field__container\"\n    [class.cx-query-field__container--disabled]=\"disabled\"\n    [class.cx-query-field__container--loading]=\"loading\"\n    [class.cx-query-field__container--error]=\"hasError$()\"\n    [class.cx-query-field__container--single-line]=\"!growVertically\"\n    (click)=\"onContainerClick()\"\n    (focusin)=\"onContainerFocusIn($event)\"\n    (keydown)=\"onContainerKeydown($event)\"\n  >\n    <span class=\"cx-query-field__prepend\" aria-hidden=\"true\">\n      <cx-icon icon=\"query\" [size]=\"16\" />\n    </span>\n\n    <div\n      #segments\n      class=\"cx-query-field__segments\"\n      [class.cx-query-field__segments--overflow-before]=\"hasHiddenQueryBefore$()\"\n      [class.cx-query-field__segments--overflow-after]=\"hasHiddenQueryAfter$()\"\n      (scroll)=\"onSegmentsScroll()\"\n    >\n      @for (condition of conditions$(); track condition.id; let index = $index) {\n        <div class=\"cx-query-field__condition\" [attr.data-query-condition-id]=\"condition.id\">\n          @if (index > 0) {\n            @if (isEditingPart(condition.id, 'join')) {\n              <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n            }\n            @if (!isEditingPart(condition.id, 'join') || showStructuredNavigationTarget(condition.id, 'join')) {\n              <button\n                type=\"button\"\n                class=\"cx-query-field__join\"\n                [disabled]=\"isLocked()\"\n                [attr.tabindex]=\"showStructuredNavigationTarget(condition.id, 'join') ? -1 : null\"\n                [attr.aria-label]=\"'Change ' + conditionJoinLabel(condition) + ' between filters'\"\n                (click)=\"$event.stopPropagation(); openConditionPartFromPointer(condition, 'join')\"\n              >\n                {{ conditionJoinLabel(condition) }}\n              </button>\n            }\n          }\n\n          <div\n            class=\"cx-query-field__clause\"\n            [class.cx-query-field__clause--editing]=\"isEditingPart(condition.id, 'field') || isEditingPart(condition.id, 'operator') || isEditingPart(condition.id, 'value')\"\n            [class.cx-query-field__clause--invalid]=\"isConditionInvalid(condition.id)\"\n          >\n            @if (isEditingPart(condition.id, 'field')) {\n              <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n            }\n            @if (!isEditingPart(condition.id, 'field') || showStructuredNavigationTarget(condition.id, 'field')) {\n              <cx-query-element\n                [data]=\"fieldElementData(condition)\"\n                (pressed)=\"openConditionPartFromPointer(condition, 'field')\"\n              />\n\n              @if (isEditingPart(condition.id, 'operator')) {\n                <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n              }\n              @if (!isEditingPart(condition.id, 'operator') || showStructuredNavigationTarget(condition.id, 'operator')) {\n                <cx-query-element\n                  [data]=\"operatorElementData(condition)\"\n                  (pressed)=\"openConditionPartFromPointer(condition, 'operator')\"\n                />\n\n                @if (conditionNeedsValue(condition)) {\n                  @if (isEditingPart(condition.id, 'value')) {\n                    @if (!showStructuredNavigationTarget(condition.id, 'value') && draftValueSummary()) {\n                      <span\n                        class=\"cx-query-field__draft-values\"\n                        [cxTooltip]=\"draftValueSummary()\"\n                        [cxTooltipOverflow]=\"true\"\n                      >{{ draftValueSummary() }}</span>\n                    }\n                    <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n                  }\n                  @if (!isEditingPart(condition.id, 'value') || showStructuredNavigationTarget(condition.id, 'value')) {\n                    <cx-query-element\n                      [data]=\"valueElementData(condition)\"\n                      (pressed)=\"openConditionPartFromPointer(condition, 'value')\"\n                    />\n                  }\n                }\n              }\n            }\n          </div>\n        </div>\n      }\n\n      @if (!draft$()) {\n        <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n      } @else if (isDraftNew()) {\n        <div class=\"cx-query-field__condition\">\n          @if (draft$()?.stage === 'join') {\n            <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n          } @else {\n            @if (conditions$().length > 0) {\n              <button\n                type=\"button\"\n                class=\"cx-query-field__join\"\n                [disabled]=\"isLocked()\"\n                [attr.aria-label]=\"'Change pending ' + draftJoinLabel() + ' connector'\"\n                (click)=\"$event.stopPropagation(); openDraftPart('join')\"\n              >\n                {{ draftJoinLabel() }}\n              </button>\n            }\n\n            @if (draft$()?.stage === 'field') {\n              <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n            } @else {\n              <div class=\"cx-query-field__clause cx-query-field__clause--editing\">\n                <cx-query-element [data]=\"draftFieldElementData()\" (pressed)=\"openDraftPart('field')\" />\n                @if (draft$()?.stage === 'operator') {\n                  <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n                } @else {\n                  <cx-query-element [data]=\"draftOperatorElementData()\" (pressed)=\"openDraftPart('operator')\" />\n                  @if (draftValueSummary()) {\n                    <span\n                      class=\"cx-query-field__draft-values\"\n                      [cxTooltip]=\"draftValueSummary()\"\n                      [cxTooltipOverflow]=\"true\"\n                    >{{ draftValueSummary() }}</span>\n                  }\n                  <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n                }\n              </div>\n            }\n          }\n        </div>\n      }\n    </div>\n\n    @if (loading) {\n      <cx-spinner class=\"cx-query-field__spinner\" size=\"small\" mood=\"default\" />\n    }\n\n    @if (hasConditions$() && clearable && !isLocked()) {\n      <span\n        class=\"cx-query-field__clear\"\n        (pointerdown)=\"$event.stopPropagation()\"\n        (click)=\"$event.stopPropagation()\"\n      >\n        <cx-icon-button\n          icon=\"remove\"\n          ariaLabel=\"Clear query\"\n          variant=\"transparent\"\n          size=\"small\"\n          (pressed)=\"onClear()\"\n        />\n      </span>\n    }\n  </div>\n\n  <span class=\"cx-query-field__sr-only\" [id]=\"statusId\" aria-live=\"polite\">{{ editorStatusText() }}</span>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-query-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-query-field__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n\n@if (isOpen$() && !isLocked()) {\n  <cx-popover\n    #popover\n    [open]=\"true\"\n    [showBackdrop]=\"false\"\n    [surfaceId]=\"popoverId\"\n    [minWidth]=\"overlay.minWidth$()\"\n    [width]=\"overlay.width$()\"\n    [maxWidth]=\"popoverMaxWidth\"\n    [maxHeight]=\"overlay.maxHeight$()\"\n    [left]=\"overlay.left$()\"\n    [top]=\"overlay.top$()\"\n    [bottom]=\"overlay.bottom$()\"\n    [placement]=\"overlay.placement$()\"\n    (backdropPressed)=\"cancelEditor()\"\n  >\n    <div class=\"cx-query-field__surface\">\n      <cx-option-group [label]=\"stageHeading()\" />\n\n      @if (currentSuggestionsLoading()) {\n        <div class=\"cx-query-field__state\" role=\"status\" aria-live=\"polite\">\n          <cx-spinner size=\"small\" mood=\"default\" />\n          <div class=\"cx-query-field__state-copy\">\n            <div class=\"cx-query-field__state-heading\">Loading values</div>\n            <div class=\"cx-query-field__state-text\">Available values will appear here.</div>\n          </div>\n        </div>\n      } @else if (currentSuggestionsError(); as error) {\n        <div class=\"cx-query-field__state cx-query-field__state--error\" role=\"status\" aria-live=\"polite\">\n          <div class=\"cx-query-field__state-copy\">\n            <div class=\"cx-query-field__state-heading\">Values couldn\u2019t load</div>\n            <div class=\"cx-query-field__state-text\">{{ error }}</div>\n          </div>\n        </div>\n      } @else if (suggestions$().length === 0) {\n        <div class=\"cx-query-field__state\" role=\"status\" aria-live=\"polite\">\n          <div class=\"cx-query-field__state-copy\">\n            <div class=\"cx-query-field__state-heading\">{{ emptyHeading() }}</div>\n            @if (emptyDescription(); as description) {\n              <div class=\"cx-query-field__state-text\">{{ description }}</div>\n            }\n          </div>\n        </div>\n      }\n\n      <div\n        class=\"cx-query-field__options\"\n        [id]=\"listboxId\"\n        role=\"listbox\"\n        [attr.aria-label]=\"listboxLabel()\"\n        [attr.aria-multiselectable]=\"isMultipleValueStage() ? 'true' : null\"\n        [attr.aria-busy]=\"currentSuggestionsLoading() ? 'true' : null\"\n        data-cx-popover-scroll-container\n      >\n        @if (!currentSuggestionsLoading() && !currentSuggestionsError()) {\n          @for (suggestion of suggestions$(); track suggestion.key; let index = $index) {\n            <div\n              class=\"cx-query-field__option\"\n              [class.cx-query-field__option--active]=\"isSuggestionActive(index)\"\n              [id]=\"suggestionDomId(index)\"\n              role=\"option\"\n              [attr.aria-label]=\"suggestion.disabled ? suggestion.label : null\"\n              [attr.aria-selected]=\"suggestionAriaSelected(suggestion)\"\n              [attr.aria-disabled]=\"suggestion.disabled ? 'true' : null\"\n              (pointerenter)=\"setActiveSuggestion(index)\"\n              (pointerdown)=\"onSuggestionPointerDown($event)\"\n              (click)=\"selectSuggestion(index)\"\n            >\n              <cx-option\n                [clickable]=\"false\"\n                [label]=\"suggestion.label\"\n                [description]=\"suggestion.description\"\n                [selected]=\"suggestion.selected ?? false\"\n                [selectedHighlight]=\"!showSuggestionCheckbox(suggestion)\"\n                [showCheckbox]=\"showSuggestionCheckbox(suggestion)\"\n                [disabled]=\"suggestion.disabled ?? false\"\n              />\n            </div>\n          }\n        }\n      </div>\n\n      @if (currentSuggestionsError()) {\n        <button\n          #footerAction\n          type=\"button\"\n          class=\"cx-query-field__footer-action\"\n          (pointerdown)=\"onSuggestionPointerDown($event)\"\n          (keydown)=\"onFooterActionKeydown($event)\"\n          (click)=\"retryValues()\"\n        >\n          Try again\n        </button>\n      } @else if (isQueryFinishable()) {\n        <button\n          #footerAction\n          type=\"button\"\n          class=\"cx-query-field__footer-action\"\n          aria-label=\"Done editing query\"\n          [attr.aria-keyshortcuts]=\"finishShortcutAria\"\n          (pointerdown)=\"onSuggestionPointerDown($event)\"\n          (keydown)=\"onFooterActionKeydown($event)\"\n          (click)=\"finishQuery()\"\n        >\n          <span>Done</span>\n          <cx-shortcut-key [parts]=\"finishShortcutParts\" />\n        </button>\n      } @else if (canRemoveCurrentCondition()) {\n        <button\n          #footerAction\n          type=\"button\"\n          class=\"cx-query-field__footer-action cx-query-field__footer-action--remove\"\n          (pointerdown)=\"onSuggestionPointerDown($event)\"\n          (keydown)=\"onFooterActionKeydown($event)\"\n          (click)=\"removeCurrentCondition()\"\n        >\n          Remove filter\n        </button>\n      }\n    </div>\n  </cx-popover>\n}\n", styles: [":host{display:block;width:100%}.cx-query-field{width:100%}.cx-query-field--small{--cx-query-field-font-size: var(--font-size-body-sm);--cx-query-field-row-min-height: calc(var(--controller-size-small) - 2px);--cx-query-element-block-padding: var(--space-2xs)}.cx-query-field--large{--cx-query-field-font-size: var(--font-size-body-lg)}.cx-query-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-query-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-query-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-query-field__container{--cx-query-element-font-size: var(--cx-query-field-font-size, var(--font-size-body));--cx-query-element-min-height: var(--cx-query-field-row-min-height, var(--controller-size-small));display:flex;width:100%;min-height:var(--controller-size);align-items:center;box-sizing:border-box;gap:var(--space-sm);padding:var(--space-2xs) var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:text}.cx-query-field__container{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-query-field__container:hover:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error){border-color:var(--border-hover)}.cx-query-field__container--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-query-field__container:has(.cx-query-field__editor:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__container--error,.cx-query-field__container--error:hover:not(.cx-query-field__container--disabled){border-color:var(--danger)}.cx-query-field__container--disabled{opacity:.55;cursor:default}.cx-query-field__container--loading{cursor:progress}.cx-query-field--small .cx-query-field__container{min-height:var(--controller-size-small);padding-block:0}.cx-query-field--large .cx-query-field__container{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-query-field__container:hover:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error),.cx-query-field__container:focus-within:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error){outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-query-field__container:focus-within:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__prepend{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}.cx-query-field__segments{display:flex;min-width:0;min-height:var(--cx-query-field-row-min-height, var(--controller-size-small));flex:1 1 auto;align-items:center;flex-wrap:wrap;gap:var(--space-2xs)}.cx-query-field__container--single-line .cx-query-field__segments{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;scroll-padding-inline:var(--space-lg);scrollbar-width:none}.cx-query-field__container--single-line .cx-query-field__segments--overflow-before:not(.cx-query-field__segments--overflow-after){mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 100%);mask-repeat:no-repeat;mask-size:100% 100%;-webkit-mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 100%);-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%}.cx-query-field__container--single-line .cx-query-field__segments--overflow-after:not(.cx-query-field__segments--overflow-before){mask-image:linear-gradient(to right, #000 0, #000 calc(100% - var(--space-lg)), transparent);mask-repeat:no-repeat;mask-size:100% 100%;-webkit-mask-image:linear-gradient(to right, #000 0, #000 calc(100% - var(--space-lg)), transparent);-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%}.cx-query-field__container--single-line .cx-query-field__segments--overflow-before.cx-query-field__segments--overflow-after{mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 calc(100% - var(--space-lg)), transparent);mask-repeat:no-repeat;mask-size:100% 100%;-webkit-mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 calc(100% - var(--space-lg)), transparent);-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%}.cx-query-field__container--single-line .cx-query-field__segments::-webkit-scrollbar{display:none}.cx-query-field__container--single-line .cx-query-field__condition{flex:0 0 auto}.cx-query-field__condition{display:inline-flex;min-width:0;max-width:100%;align-items:center;gap:var(--space-2xs)}.cx-query-field__clause{display:inline-flex;min-width:0;max-width:100%;align-items:center;overflow:hidden;border-radius:var(--radius-sm);background:var(--opacity-low);box-shadow:inset 0 0 0 1px rgba(0,0,0,0);transition:background-color var(--motion-fast) var(--ease-out),box-shadow var(--motion-fast) var(--ease-out)}.cx-query-field__clause--editing{background:var(--primary-opacity)}.cx-query-field__clause--invalid{box-shadow:inset 0 0 0 1px var(--danger)}.cx-query-field__condition:focus-within>.cx-query-field__clause:not(.cx-query-field__clause--editing):not(.cx-query-field__clause--invalid){background:var(--primary-opacity);box-shadow:inset 0 0 0 var(--border-width) var(--primary)}.cx-query-field__clause cx-query-element:focus-within,.cx-query-field__join:focus{position:relative;z-index:1}.cx-query-field__clause cx-query-element:focus-within::after,.cx-query-field__join:focus::after{position:absolute;inset-block:var(--space-2xs);inset-inline-end:0;width:var(--border-width);border-radius:var(--radius-xs);animation:cx-query-field-caret-blink 1s step-end infinite;background:var(--ink);content:\"\";pointer-events:none}.cx-query-field__join{display:inline-flex;min-height:var(--cx-query-field-row-min-height, var(--controller-size-small));align-items:center;padding:0 var(--space-2xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;font-size:var(--font-size-body-xs);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-query-field__join:hover:not(:disabled),.cx-query-field__join:focus-visible{background:var(--opacity-low);color:var(--ink)}.cx-query-field__join:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__join:disabled{cursor:default}.cx-query-field__editor-slot{position:relative;display:inline-flex;min-width:0;max-width:100%;flex:0 1 auto;align-items:center}.cx-query-field__editor{width:2ch;min-width:2ch;min-height:var(--cx-query-field-row-min-height, var(--controller-size-small));max-width:min(28ch,100%);flex:0 1 auto;box-sizing:border-box;padding:var(--space-xs) var(--space-2xs);border:0;outline:0;background:rgba(0,0,0,0);color:var(--ink);caret-color:var(--ink);font:inherit;font-size:var(--cx-query-field-font-size, var(--font-size-body));line-height:var(--line-height-small)}.cx-query-field--small .cx-query-field__editor{padding-block:var(--space-2xs)}.cx-query-field__editor--date{min-width:15ch}.cx-query-field__editor-slot--caret{width:calc(var(--border-width)*2);min-width:calc(var(--border-width)*2);flex:0 0 calc(var(--border-width)*2)}.cx-query-field__editor-slot--caret::after{position:absolute;inset-block:var(--space-2xs);inset-inline-start:0;width:calc(var(--border-width)*2);border-radius:var(--radius-xs);animation:cx-query-field-caret-blink 1s step-end infinite;background:var(--ink);content:\"\";pointer-events:none}.cx-query-field__editor-slot--caret .cx-query-field__editor{width:var(--border-width);min-width:var(--border-width);max-width:var(--border-width);padding-inline:0;caret-color:rgba(0,0,0,0)}.cx-query-field__editor:disabled{cursor:default}.cx-query-field__draft-values{display:block;min-width:0;max-width:22ch;overflow:hidden;padding-inline-start:var(--space-xs);color:var(--ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-query-field__spinner,.cx-query-field__clear{flex:0 0 auto}.cx-query-field__spinner{color:var(--opacity-high)}.cx-query-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-query-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-query-field__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;gap:var(--space-2xs)}.cx-query-field__options{min-width:0;min-height:0;flex:1 1 auto;overflow-y:auto}.cx-query-field__option{border-radius:var(--radius-sm);cursor:pointer;transition:background-color var(--motion-fast) var(--ease-out)}.cx-query-field__option--active{background:var(--primary-opacity)}.cx-query-field__option[aria-disabled=true]{cursor:default}.cx-query-field__footer-action{display:flex;min-height:var(--controller-size-small);align-items:center;justify-content:space-between;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:0;border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);cursor:pointer;font:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-small);text-align:left}.cx-query-field__footer-action:hover,.cx-query-field__footer-action:focus-visible{background:var(--primary-opacity)}.cx-query-field__footer-action--remove{background:rgba(0,0,0,0);color:var(--danger)}.cx-query-field__footer-action--remove:hover,.cx-query-field__footer-action--remove:focus-visible{background:var(--danger-opacity)}.cx-query-field__footer-action:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__state{display:flex;min-height:112px;align-items:center;justify-content:center;gap:var(--space-sm);box-sizing:border-box;padding:var(--space-lg);color:var(--opacity-high);text-align:center}.cx-query-field__state--error{min-height:auto;align-items:flex-start;justify-content:flex-start;padding-block:var(--space-sm);color:var(--danger);text-align:left}.cx-query-field__state-copy{display:flex;min-width:0;flex-direction:column;gap:var(--space-2xs)}.cx-query-field__state-heading{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-query-field__state--error .cx-query-field__state-heading{color:var(--danger)}.cx-query-field__state-text{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}.cx-query-field__sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}@keyframes cx-query-field-caret-blink{0%,45%{opacity:1}50%,100%{opacity:0}}@media(prefers-reduced-motion: reduce){.cx-query-field__clause cx-query-element:focus-within::after,.cx-query-field__join:focus::after,.cx-query-field__editor-slot--caret::after{animation:none}}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "descriptionAlign", "size", "tooltip", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "controlId", "tabIndex", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxOptionGroupComponent, selector: "cx-option-group", inputs: ["label", "description", "variant"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxQueryElementComponent, selector: "cx-query-element", inputs: ["data"], outputs: ["pressed"] }, { kind: "component", type: CxShortcutKeyComponent, selector: "cx-shortcut-key", inputs: ["parts"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxQueryFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-query-field', imports: [
                        NgTemplateOutlet,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxOptionComponent,
                        CxOptionGroupComponent,
                        CxPopoverComponent,
                        CxQueryElementComponent,
                        CxShortcutKeyComponent,
                        CxSpinnerComponent,
                        CxTooltipDirective,
                        CxValidationMessageComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-query-field\"\n  [class.cx-query-field--small]=\"size === 'small'\"\n  [class.cx-query-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-query-field__header\">\n      <label class=\"cx-query-field__label\" [id]=\"labelId\" [for]=\"inputId\">{{ label }}</label>\n      @if (optional) {\n        <div class=\"cx-query-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <ng-template #editorTemplate>\n    <span\n      class=\"cx-query-field__editor-slot\"\n      [class.cx-query-field__editor-slot--caret]=\"isStructuredCaretVisible()\"\n    >\n      <input\n        #editorInput\n        class=\"cx-query-field__editor\"\n        [class.cx-query-field__editor--date]=\"isDateValueStage()\"\n        [id]=\"inputId\"\n        type=\"text\"\n        [value]=\"editorText$()\"\n        [style.width.ch]=\"isStructuredCaretVisible() ? null : editorWidth()\"\n        [disabled]=\"isLocked()\"\n        [attr.inputmode]=\"editorInputMode()\"\n        [attr.aria-label]=\"resolvedAriaLabel()\"\n        [attr.aria-labelledby]=\"resolvedAriaLabelledBy()\"\n        [attr.aria-describedby]=\"resolvedAriaDescribedBy()\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        [attr.aria-required]=\"optional ? null : 'true'\"\n        [attr.aria-disabled]=\"disabled ? 'true' : null\"\n        [attr.aria-busy]=\"loading || currentSuggestionsLoading() ? 'true' : null\"\n        [attr.aria-expanded]=\"isOpen$()\"\n        [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n        [attr.aria-activedescendant]=\"activeDescendant()\"\n        aria-autocomplete=\"list\"\n        aria-haspopup=\"listbox\"\n        role=\"combobox\"\n        autocomplete=\"off\"\n        spellcheck=\"false\"\n        data-shortcut-ignore=\"ArrowDown,ArrowUp,ArrowLeft,ArrowRight,Enter,Escape,Backspace,Delete\"\n        (focus)=\"onEditorFocus()\"\n        (input)=\"onEditorInput($event)\"\n        (keydown)=\"onEditorKeydown($event)\"\n      />\n    </span>\n  </ng-template>\n\n  <div\n    #fieldContainer\n    class=\"cx-query-field__container\"\n    [class.cx-query-field__container--disabled]=\"disabled\"\n    [class.cx-query-field__container--loading]=\"loading\"\n    [class.cx-query-field__container--error]=\"hasError$()\"\n    [class.cx-query-field__container--single-line]=\"!growVertically\"\n    (click)=\"onContainerClick()\"\n    (focusin)=\"onContainerFocusIn($event)\"\n    (keydown)=\"onContainerKeydown($event)\"\n  >\n    <span class=\"cx-query-field__prepend\" aria-hidden=\"true\">\n      <cx-icon icon=\"query\" [size]=\"16\" />\n    </span>\n\n    <div\n      #segments\n      class=\"cx-query-field__segments\"\n      [class.cx-query-field__segments--overflow-before]=\"hasHiddenQueryBefore$()\"\n      [class.cx-query-field__segments--overflow-after]=\"hasHiddenQueryAfter$()\"\n      (scroll)=\"onSegmentsScroll()\"\n    >\n      @for (condition of conditions$(); track condition.id; let index = $index) {\n        <div class=\"cx-query-field__condition\" [attr.data-query-condition-id]=\"condition.id\">\n          @if (index > 0) {\n            @if (isEditingPart(condition.id, 'join')) {\n              <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n            }\n            @if (!isEditingPart(condition.id, 'join') || showStructuredNavigationTarget(condition.id, 'join')) {\n              <button\n                type=\"button\"\n                class=\"cx-query-field__join\"\n                [disabled]=\"isLocked()\"\n                [attr.tabindex]=\"showStructuredNavigationTarget(condition.id, 'join') ? -1 : null\"\n                [attr.aria-label]=\"'Change ' + conditionJoinLabel(condition) + ' between filters'\"\n                (click)=\"$event.stopPropagation(); openConditionPartFromPointer(condition, 'join')\"\n              >\n                {{ conditionJoinLabel(condition) }}\n              </button>\n            }\n          }\n\n          <div\n            class=\"cx-query-field__clause\"\n            [class.cx-query-field__clause--editing]=\"isEditingPart(condition.id, 'field') || isEditingPart(condition.id, 'operator') || isEditingPart(condition.id, 'value')\"\n            [class.cx-query-field__clause--invalid]=\"isConditionInvalid(condition.id)\"\n          >\n            @if (isEditingPart(condition.id, 'field')) {\n              <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n            }\n            @if (!isEditingPart(condition.id, 'field') || showStructuredNavigationTarget(condition.id, 'field')) {\n              <cx-query-element\n                [data]=\"fieldElementData(condition)\"\n                (pressed)=\"openConditionPartFromPointer(condition, 'field')\"\n              />\n\n              @if (isEditingPart(condition.id, 'operator')) {\n                <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n              }\n              @if (!isEditingPart(condition.id, 'operator') || showStructuredNavigationTarget(condition.id, 'operator')) {\n                <cx-query-element\n                  [data]=\"operatorElementData(condition)\"\n                  (pressed)=\"openConditionPartFromPointer(condition, 'operator')\"\n                />\n\n                @if (conditionNeedsValue(condition)) {\n                  @if (isEditingPart(condition.id, 'value')) {\n                    @if (!showStructuredNavigationTarget(condition.id, 'value') && draftValueSummary()) {\n                      <span\n                        class=\"cx-query-field__draft-values\"\n                        [cxTooltip]=\"draftValueSummary()\"\n                        [cxTooltipOverflow]=\"true\"\n                      >{{ draftValueSummary() }}</span>\n                    }\n                    <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n                  }\n                  @if (!isEditingPart(condition.id, 'value') || showStructuredNavigationTarget(condition.id, 'value')) {\n                    <cx-query-element\n                      [data]=\"valueElementData(condition)\"\n                      (pressed)=\"openConditionPartFromPointer(condition, 'value')\"\n                    />\n                  }\n                }\n              }\n            }\n          </div>\n        </div>\n      }\n\n      @if (!draft$()) {\n        <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n      } @else if (isDraftNew()) {\n        <div class=\"cx-query-field__condition\">\n          @if (draft$()?.stage === 'join') {\n            <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n          } @else {\n            @if (conditions$().length > 0) {\n              <button\n                type=\"button\"\n                class=\"cx-query-field__join\"\n                [disabled]=\"isLocked()\"\n                [attr.aria-label]=\"'Change pending ' + draftJoinLabel() + ' connector'\"\n                (click)=\"$event.stopPropagation(); openDraftPart('join')\"\n              >\n                {{ draftJoinLabel() }}\n              </button>\n            }\n\n            @if (draft$()?.stage === 'field') {\n              <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n            } @else {\n              <div class=\"cx-query-field__clause cx-query-field__clause--editing\">\n                <cx-query-element [data]=\"draftFieldElementData()\" (pressed)=\"openDraftPart('field')\" />\n                @if (draft$()?.stage === 'operator') {\n                  <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n                } @else {\n                  <cx-query-element [data]=\"draftOperatorElementData()\" (pressed)=\"openDraftPart('operator')\" />\n                  @if (draftValueSummary()) {\n                    <span\n                      class=\"cx-query-field__draft-values\"\n                      [cxTooltip]=\"draftValueSummary()\"\n                      [cxTooltipOverflow]=\"true\"\n                    >{{ draftValueSummary() }}</span>\n                  }\n                  <ng-container [ngTemplateOutlet]=\"editorTemplate\" />\n                }\n              </div>\n            }\n          }\n        </div>\n      }\n    </div>\n\n    @if (loading) {\n      <cx-spinner class=\"cx-query-field__spinner\" size=\"small\" mood=\"default\" />\n    }\n\n    @if (hasConditions$() && clearable && !isLocked()) {\n      <span\n        class=\"cx-query-field__clear\"\n        (pointerdown)=\"$event.stopPropagation()\"\n        (click)=\"$event.stopPropagation()\"\n      >\n        <cx-icon-button\n          icon=\"remove\"\n          ariaLabel=\"Clear query\"\n          variant=\"transparent\"\n          size=\"small\"\n          (pressed)=\"onClear()\"\n        />\n      </span>\n    }\n  </div>\n\n  <span class=\"cx-query-field__sr-only\" [id]=\"statusId\" aria-live=\"polite\">{{ editorStatusText() }}</span>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-query-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-query-field__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n\n@if (isOpen$() && !isLocked()) {\n  <cx-popover\n    #popover\n    [open]=\"true\"\n    [showBackdrop]=\"false\"\n    [surfaceId]=\"popoverId\"\n    [minWidth]=\"overlay.minWidth$()\"\n    [width]=\"overlay.width$()\"\n    [maxWidth]=\"popoverMaxWidth\"\n    [maxHeight]=\"overlay.maxHeight$()\"\n    [left]=\"overlay.left$()\"\n    [top]=\"overlay.top$()\"\n    [bottom]=\"overlay.bottom$()\"\n    [placement]=\"overlay.placement$()\"\n    (backdropPressed)=\"cancelEditor()\"\n  >\n    <div class=\"cx-query-field__surface\">\n      <cx-option-group [label]=\"stageHeading()\" />\n\n      @if (currentSuggestionsLoading()) {\n        <div class=\"cx-query-field__state\" role=\"status\" aria-live=\"polite\">\n          <cx-spinner size=\"small\" mood=\"default\" />\n          <div class=\"cx-query-field__state-copy\">\n            <div class=\"cx-query-field__state-heading\">Loading values</div>\n            <div class=\"cx-query-field__state-text\">Available values will appear here.</div>\n          </div>\n        </div>\n      } @else if (currentSuggestionsError(); as error) {\n        <div class=\"cx-query-field__state cx-query-field__state--error\" role=\"status\" aria-live=\"polite\">\n          <div class=\"cx-query-field__state-copy\">\n            <div class=\"cx-query-field__state-heading\">Values couldn\u2019t load</div>\n            <div class=\"cx-query-field__state-text\">{{ error }}</div>\n          </div>\n        </div>\n      } @else if (suggestions$().length === 0) {\n        <div class=\"cx-query-field__state\" role=\"status\" aria-live=\"polite\">\n          <div class=\"cx-query-field__state-copy\">\n            <div class=\"cx-query-field__state-heading\">{{ emptyHeading() }}</div>\n            @if (emptyDescription(); as description) {\n              <div class=\"cx-query-field__state-text\">{{ description }}</div>\n            }\n          </div>\n        </div>\n      }\n\n      <div\n        class=\"cx-query-field__options\"\n        [id]=\"listboxId\"\n        role=\"listbox\"\n        [attr.aria-label]=\"listboxLabel()\"\n        [attr.aria-multiselectable]=\"isMultipleValueStage() ? 'true' : null\"\n        [attr.aria-busy]=\"currentSuggestionsLoading() ? 'true' : null\"\n        data-cx-popover-scroll-container\n      >\n        @if (!currentSuggestionsLoading() && !currentSuggestionsError()) {\n          @for (suggestion of suggestions$(); track suggestion.key; let index = $index) {\n            <div\n              class=\"cx-query-field__option\"\n              [class.cx-query-field__option--active]=\"isSuggestionActive(index)\"\n              [id]=\"suggestionDomId(index)\"\n              role=\"option\"\n              [attr.aria-label]=\"suggestion.disabled ? suggestion.label : null\"\n              [attr.aria-selected]=\"suggestionAriaSelected(suggestion)\"\n              [attr.aria-disabled]=\"suggestion.disabled ? 'true' : null\"\n              (pointerenter)=\"setActiveSuggestion(index)\"\n              (pointerdown)=\"onSuggestionPointerDown($event)\"\n              (click)=\"selectSuggestion(index)\"\n            >\n              <cx-option\n                [clickable]=\"false\"\n                [label]=\"suggestion.label\"\n                [description]=\"suggestion.description\"\n                [selected]=\"suggestion.selected ?? false\"\n                [selectedHighlight]=\"!showSuggestionCheckbox(suggestion)\"\n                [showCheckbox]=\"showSuggestionCheckbox(suggestion)\"\n                [disabled]=\"suggestion.disabled ?? false\"\n              />\n            </div>\n          }\n        }\n      </div>\n\n      @if (currentSuggestionsError()) {\n        <button\n          #footerAction\n          type=\"button\"\n          class=\"cx-query-field__footer-action\"\n          (pointerdown)=\"onSuggestionPointerDown($event)\"\n          (keydown)=\"onFooterActionKeydown($event)\"\n          (click)=\"retryValues()\"\n        >\n          Try again\n        </button>\n      } @else if (isQueryFinishable()) {\n        <button\n          #footerAction\n          type=\"button\"\n          class=\"cx-query-field__footer-action\"\n          aria-label=\"Done editing query\"\n          [attr.aria-keyshortcuts]=\"finishShortcutAria\"\n          (pointerdown)=\"onSuggestionPointerDown($event)\"\n          (keydown)=\"onFooterActionKeydown($event)\"\n          (click)=\"finishQuery()\"\n        >\n          <span>Done</span>\n          <cx-shortcut-key [parts]=\"finishShortcutParts\" />\n        </button>\n      } @else if (canRemoveCurrentCondition()) {\n        <button\n          #footerAction\n          type=\"button\"\n          class=\"cx-query-field__footer-action cx-query-field__footer-action--remove\"\n          (pointerdown)=\"onSuggestionPointerDown($event)\"\n          (keydown)=\"onFooterActionKeydown($event)\"\n          (click)=\"removeCurrentCondition()\"\n        >\n          Remove filter\n        </button>\n      }\n    </div>\n  </cx-popover>\n}\n", styles: [":host{display:block;width:100%}.cx-query-field{width:100%}.cx-query-field--small{--cx-query-field-font-size: var(--font-size-body-sm);--cx-query-field-row-min-height: calc(var(--controller-size-small) - 2px);--cx-query-element-block-padding: var(--space-2xs)}.cx-query-field--large{--cx-query-field-font-size: var(--font-size-body-lg)}.cx-query-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-query-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-query-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-query-field__container{--cx-query-element-font-size: var(--cx-query-field-font-size, var(--font-size-body));--cx-query-element-min-height: var(--cx-query-field-row-min-height, var(--controller-size-small));display:flex;width:100%;min-height:var(--controller-size);align-items:center;box-sizing:border-box;gap:var(--space-sm);padding:var(--space-2xs) var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:text}.cx-query-field__container{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-query-field__container:hover:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error){border-color:var(--border-hover)}.cx-query-field__container--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-query-field__container:has(.cx-query-field__editor:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__container--error,.cx-query-field__container--error:hover:not(.cx-query-field__container--disabled){border-color:var(--danger)}.cx-query-field__container--disabled{opacity:.55;cursor:default}.cx-query-field__container--loading{cursor:progress}.cx-query-field--small .cx-query-field__container{min-height:var(--controller-size-small);padding-block:0}.cx-query-field--large .cx-query-field__container{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-query-field__container:hover:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error),.cx-query-field__container:focus-within:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error){outline:var(--outline-field-interaction);outline-offset:0}:host-context([data-cx-keyboard-navigation]) .cx-query-field__container:focus-within:not(.cx-query-field__container--disabled):not(.cx-query-field__container--error){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__prepend{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high)}.cx-query-field__segments{display:flex;min-width:0;min-height:var(--cx-query-field-row-min-height, var(--controller-size-small));flex:1 1 auto;align-items:center;flex-wrap:wrap;gap:var(--space-2xs)}.cx-query-field__container--single-line .cx-query-field__segments{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;scroll-padding-inline:var(--space-lg);scrollbar-width:none}.cx-query-field__container--single-line .cx-query-field__segments--overflow-before:not(.cx-query-field__segments--overflow-after){mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 100%);mask-repeat:no-repeat;mask-size:100% 100%;-webkit-mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 100%);-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%}.cx-query-field__container--single-line .cx-query-field__segments--overflow-after:not(.cx-query-field__segments--overflow-before){mask-image:linear-gradient(to right, #000 0, #000 calc(100% - var(--space-lg)), transparent);mask-repeat:no-repeat;mask-size:100% 100%;-webkit-mask-image:linear-gradient(to right, #000 0, #000 calc(100% - var(--space-lg)), transparent);-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%}.cx-query-field__container--single-line .cx-query-field__segments--overflow-before.cx-query-field__segments--overflow-after{mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 calc(100% - var(--space-lg)), transparent);mask-repeat:no-repeat;mask-size:100% 100%;-webkit-mask-image:linear-gradient(to right, transparent, #000 var(--space-lg), #000 calc(100% - var(--space-lg)), transparent);-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%}.cx-query-field__container--single-line .cx-query-field__segments::-webkit-scrollbar{display:none}.cx-query-field__container--single-line .cx-query-field__condition{flex:0 0 auto}.cx-query-field__condition{display:inline-flex;min-width:0;max-width:100%;align-items:center;gap:var(--space-2xs)}.cx-query-field__clause{display:inline-flex;min-width:0;max-width:100%;align-items:center;overflow:hidden;border-radius:var(--radius-sm);background:var(--opacity-low);box-shadow:inset 0 0 0 1px rgba(0,0,0,0);transition:background-color var(--motion-fast) var(--ease-out),box-shadow var(--motion-fast) var(--ease-out)}.cx-query-field__clause--editing{background:var(--primary-opacity)}.cx-query-field__clause--invalid{box-shadow:inset 0 0 0 1px var(--danger)}.cx-query-field__condition:focus-within>.cx-query-field__clause:not(.cx-query-field__clause--editing):not(.cx-query-field__clause--invalid){background:var(--primary-opacity);box-shadow:inset 0 0 0 var(--border-width) var(--primary)}.cx-query-field__clause cx-query-element:focus-within,.cx-query-field__join:focus{position:relative;z-index:1}.cx-query-field__clause cx-query-element:focus-within::after,.cx-query-field__join:focus::after{position:absolute;inset-block:var(--space-2xs);inset-inline-end:0;width:var(--border-width);border-radius:var(--radius-xs);animation:cx-query-field-caret-blink 1s step-end infinite;background:var(--ink);content:\"\";pointer-events:none}.cx-query-field__join{display:inline-flex;min-height:var(--cx-query-field-row-min-height, var(--controller-size-small));align-items:center;padding:0 var(--space-2xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;font-size:var(--font-size-body-xs);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-query-field__join:hover:not(:disabled),.cx-query-field__join:focus-visible{background:var(--opacity-low);color:var(--ink)}.cx-query-field__join:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__join:disabled{cursor:default}.cx-query-field__editor-slot{position:relative;display:inline-flex;min-width:0;max-width:100%;flex:0 1 auto;align-items:center}.cx-query-field__editor{width:2ch;min-width:2ch;min-height:var(--cx-query-field-row-min-height, var(--controller-size-small));max-width:min(28ch,100%);flex:0 1 auto;box-sizing:border-box;padding:var(--space-xs) var(--space-2xs);border:0;outline:0;background:rgba(0,0,0,0);color:var(--ink);caret-color:var(--ink);font:inherit;font-size:var(--cx-query-field-font-size, var(--font-size-body));line-height:var(--line-height-small)}.cx-query-field--small .cx-query-field__editor{padding-block:var(--space-2xs)}.cx-query-field__editor--date{min-width:15ch}.cx-query-field__editor-slot--caret{width:calc(var(--border-width)*2);min-width:calc(var(--border-width)*2);flex:0 0 calc(var(--border-width)*2)}.cx-query-field__editor-slot--caret::after{position:absolute;inset-block:var(--space-2xs);inset-inline-start:0;width:calc(var(--border-width)*2);border-radius:var(--radius-xs);animation:cx-query-field-caret-blink 1s step-end infinite;background:var(--ink);content:\"\";pointer-events:none}.cx-query-field__editor-slot--caret .cx-query-field__editor{width:var(--border-width);min-width:var(--border-width);max-width:var(--border-width);padding-inline:0;caret-color:rgba(0,0,0,0)}.cx-query-field__editor:disabled{cursor:default}.cx-query-field__draft-values{display:block;min-width:0;max-width:22ch;overflow:hidden;padding-inline-start:var(--space-xs);color:var(--ink);font-size:var(--font-size-body-sm);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-query-field__spinner,.cx-query-field__clear{flex:0 0 auto}.cx-query-field__spinner{color:var(--opacity-high)}.cx-query-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-query-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-query-field__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;gap:var(--space-2xs)}.cx-query-field__options{min-width:0;min-height:0;flex:1 1 auto;overflow-y:auto}.cx-query-field__option{border-radius:var(--radius-sm);cursor:pointer;transition:background-color var(--motion-fast) var(--ease-out)}.cx-query-field__option--active{background:var(--primary-opacity)}.cx-query-field__option[aria-disabled=true]{cursor:default}.cx-query-field__footer-action{display:flex;min-height:var(--controller-size-small);align-items:center;justify-content:space-between;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:0;border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);cursor:pointer;font:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-small);text-align:left}.cx-query-field__footer-action:hover,.cx-query-field__footer-action:focus-visible{background:var(--primary-opacity)}.cx-query-field__footer-action--remove{background:rgba(0,0,0,0);color:var(--danger)}.cx-query-field__footer-action--remove:hover,.cx-query-field__footer-action--remove:focus-visible{background:var(--danger-opacity)}.cx-query-field__footer-action:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-field__state{display:flex;min-height:112px;align-items:center;justify-content:center;gap:var(--space-sm);box-sizing:border-box;padding:var(--space-lg);color:var(--opacity-high);text-align:center}.cx-query-field__state--error{min-height:auto;align-items:flex-start;justify-content:flex-start;padding-block:var(--space-sm);color:var(--danger);text-align:left}.cx-query-field__state-copy{display:flex;min-width:0;flex-direction:column;gap:var(--space-2xs)}.cx-query-field__state-heading{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-query-field__state--error .cx-query-field__state-heading{color:var(--danger)}.cx-query-field__state-text{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}.cx-query-field__sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}@keyframes cx-query-field-caret-blink{0%,45%{opacity:1}50%,100%{opacity:0}}@media(prefers-reduced-motion: reduce){.cx-query-field__clause cx-query-element:focus-within::after,.cx-query-field__join:focus::after,.cx-query-field__editor-slot--caret::after{animation:none}}"] }]
        }], propDecorators: { fieldContainerRef: [{
                type: ViewChild,
                args: ['fieldContainer', { read: ElementRef }]
            }], segmentsRef: [{
                type: ViewChild,
                args: ['segments', { read: ElementRef }]
            }], editorInputRef: [{
                type: ViewChild,
                args: ['editorInput', { read: ElementRef }]
            }], footerActionRef: [{
                type: ViewChild,
                args: ['footerAction', { read: ElementRef }]
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], label: [{
                type: Input
            }], hint: [{
                type: Input
            }], optional: [{
                type: Input
            }], size: [{
                type: Input
            }], growVertically: [{
                type: Input
            }], clearable: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], fields: [{
                type: Input
            }], value: [{
                type: Input
            }], validation: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], valueSearch: [{
                type: Output
            }], valueRetry: [{
                type: Output
            }], clear: [{
                type: Output
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onDocumentFocusIn: [{
                type: HostListener,
                args: ['document:focusin', ['$event']]
            }] } });
