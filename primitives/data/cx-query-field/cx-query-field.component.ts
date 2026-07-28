import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import {
  type CxFieldValidation,
  type CxFieldSize,
  type CxRenderedValidationMessage,
  normalizeCxValidation,
} from '../../inputs/shared/field.types';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../overlay/floating-surface-controller';
import { CxOptionComponent } from '../../overlay/cx-option';
import { CxOptionGroupComponent } from '../../overlay/cx-option-group';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxIconComponent } from '../../media/cx-icon';
import { CxQueryElementComponent, type CxQueryElementData } from '../cx-query-element';

const CX_QUERY_FIELD_POPOVER_MIN_WIDTH = 240;
const CX_QUERY_FIELD_POPOVER_MAX_WIDTH = 420;
const CX_QUERY_FIELD_POPOVER_MAX_HEIGHT = 360;
const CX_QUERY_FIELD_POPOVER_FRAME_HEIGHT = 8;
const CX_QUERY_FIELD_OPTION_HEIGHT = 40;

export type CxQueryFieldSize = CxFieldSize;
export type CxQueryFieldJoin = 'and' | 'or';
export type CxQueryFieldValue = string | number | readonly string[];
export type CxQueryFieldValueMode = 'none' | 'single' | 'multiple';
export type CxQueryFieldFilterMode = 'client' | 'manual';

export interface CxQueryFieldOption {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
}

export interface CxQueryFieldOperator extends CxQueryFieldOption {
  valueMode?: CxQueryFieldValueMode;
}

export type CxQueryFieldValueDefinition =
  | {
      kind: 'options';
      options: readonly CxQueryFieldOption[];
      filterMode?: CxQueryFieldFilterMode;
      loading?: boolean;
      error?: string;
    }
  | {
      kind: 'text';
    }
  | {
      kind: 'number';
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      kind: 'date';
      min?: string;
      max?: string;
    };

export interface CxQueryFieldDefinition extends CxQueryFieldOption {
  operators: readonly CxQueryFieldOperator[];
  value: CxQueryFieldValueDefinition;
}

export interface CxQueryFieldCondition {
  id: string;
  fieldId: string;
  operatorId: string;
  value?: CxQueryFieldValue;
  /** Join this condition to the condition before it. Ignored for the first condition. */
  join?: CxQueryFieldJoin;
}

export interface CxQueryFieldValueSearchEvent {
  fieldId: string;
  query: string;
}

export interface CxQueryFieldValueRetryEvent {
  fieldId: string;
  query: string;
}

type CxQueryFieldEditorStage = 'field' | 'operator' | 'value' | 'join';
type CxQueryFieldSuggestionKind = 'field' | 'operator' | 'value' | 'join' | 'custom';

interface CxQueryFieldDraft {
  targetId?: string;
  stage: CxQueryFieldEditorStage;
  fieldId?: string;
  operatorId?: string;
  value?: CxQueryFieldValue;
  join?: CxQueryFieldJoin;
}

type CxQueryFieldNavigationPart = CxQueryFieldEditorStage | 'tail';

interface CxQueryFieldNavigationDescriptor {
  conditionId?: string;
  part: CxQueryFieldNavigationPart;
}

interface CxQueryFieldSuggestion {
  key: string;
  kind: CxQueryFieldSuggestionKind;
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  selected?: boolean;
}

const CX_QUERY_FIELD_JOIN_OPTIONS: readonly CxQueryFieldOption[] = [
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

const CX_QUERY_FIELD_FINISH_SHORTCUT = ['Mod', 'Enter'] as const;

let cxQueryFieldId = 0;

@Component({
  selector: 'cx-query-field',
  imports: [
    NgTemplateOutlet,
    CxIconButtonComponent,
    CxIconComponent,
    CxOptionComponent,
    CxOptionGroupComponent,
    CxPopoverComponent,
    CxQueryElementComponent,
    CxShortcutKeyComponent,
    CxSpinnerComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-query-field.component.html',
  styleUrl: './cx-query-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxQueryFieldComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
  private readonly instanceId = ++cxQueryFieldId;
  private readonly conditionsState = signal<readonly CxQueryFieldCondition[]>([]);
  private readonly fieldsState = signal<readonly CxQueryFieldDefinition[]>([]);
  private readonly hintState = signal<string | undefined>(undefined);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly disabledState = signal(false);
  private readonly loadingState = signal(false);
  private readonly openState = signal(false);
  private readonly draftState = signal<CxQueryFieldDraft | undefined>(undefined);
  private readonly editorTextState = signal('');
  private readonly activeSuggestionIndexState = signal(-1);
  private readonly navigationStatusState = signal('');
  private readonly structuredCaretState = signal(false);
  private readonly knownValueOptionsState = signal<ReadonlyMap<string, ReadonlyMap<string, CxQueryFieldOption>>>(new Map());
  private readonly hasHiddenQueryBeforeState = signal(false);
  private readonly hasHiddenQueryAfterState = signal(false);
  private nextConditionId = 0;
  private tabCloseTimer: number | undefined;
  private editorFocusTimer: number | undefined;
  private overflowSyncFrame: number | undefined;
  private suppressNextFocusOpen = false;

  protected readonly inputId = `cx-query-field-input-${this.instanceId}`;
  protected readonly labelId = `cx-query-field-label-${this.instanceId}`;
  protected readonly messagesId = `cx-query-field-messages-${this.instanceId}`;
  protected readonly statusId = `cx-query-field-status-${this.instanceId}`;
  protected readonly popoverId = `cx-query-field-popover-${this.instanceId}`;
  protected readonly listboxId = `cx-query-field-listbox-${this.instanceId}`;
  protected readonly popoverMaxWidth = CX_QUERY_FIELD_POPOVER_MAX_WIDTH;
  protected readonly finishShortcutParts = CX_QUERY_FIELD_FINISH_SHORTCUT;
  protected readonly finishShortcutAria = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
    ? 'Meta+Enter'
    : 'Control+Enter';

  @ViewChild('fieldContainer', { read: ElementRef })
  private fieldContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('segments', { read: ElementRef })
  private segmentsRef?: ElementRef<HTMLElement>;
  @ViewChild('editorInput', { read: ElementRef })
  private editorInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('footerAction', { read: ElementRef })
  private footerActionRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;

  protected readonly overlay = new CxFloatingSurfaceController(
    (rect, viewport) => this.measureOverlay(rect, viewport),
    () => this.popoverRef?.surfaceElement(),
  );

  @Input() label = 'Filters';
  @Input()
  public set hint(value: string | null | undefined) {
    this.hintState.set(value?.trim() || undefined);
  }
  public get hint(): string | undefined {
    return this.hintState();
  }
  @Input() optional = false;
  @Input() size: CxQueryFieldSize = 'default';
  @Input() growVertically = true;
  @Input() clearable = true;
  @Input() ariaLabel: string | undefined;

  @Input()
  public set disabled(value: boolean) {
    this.disabledState.set(Boolean(value));
    if (value) {
      this.closeEditor(false);
    }
  }
  public get disabled(): boolean {
    return this.disabledState();
  }

  @Input()
  public set loading(value: boolean) {
    this.loadingState.set(Boolean(value));
    if (value) {
      this.closeEditor(false);
    }
  }
  public get loading(): boolean {
    return this.loadingState();
  }

  @Input()
  public set fields(value: readonly CxQueryFieldDefinition[] | null | undefined) {
    const fields = value ?? [];
    this.fieldsState.set(fields);
    this.rememberValueOptions(fields);
    this.refreshOpenSuggestions();
  }

  @Input()
  public set value(value: readonly CxQueryFieldCondition[] | null | undefined) {
    const conditions = this.normalizeConditions(value ?? []);
    this.conditionsState.set(conditions);
    const targetId = this.draftState()?.targetId;
    if (targetId && !conditions.some(condition => condition.id === targetId)) {
      this.closeEditor(false);
    }
  }

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Output() readonly valueChange = new EventEmitter<readonly CxQueryFieldCondition[]>();
  @Output() readonly valueSearch = new EventEmitter<CxQueryFieldValueSearchEvent>();
  @Output() readonly valueRetry = new EventEmitter<CxQueryFieldValueRetryEvent>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly conditions$ = this.conditionsState.asReadonly();
  protected readonly editorText$ = this.editorTextState.asReadonly();
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly draft$ = this.draftState.asReadonly();
  protected readonly hasConditions$ = computed(() => this.conditionsState().length > 0);
  protected readonly hasHiddenQueryBefore$ = this.hasHiddenQueryBeforeState.asReadonly();
  protected readonly hasHiddenQueryAfter$ = this.hasHiddenQueryAfterState.asReadonly();
  protected readonly invalidConditionIds$ = computed(() => {
    const invalidIds = new Set<string>();
    for (const [index, condition] of this.conditionsState().entries()) {
      if (!this.isConditionValid(condition, index)) {
        invalidIds.add(condition.id);
      }
    }
    return invalidIds;
  });
  protected readonly validationMessages$ = computed<readonly CxRenderedValidationMessage[]>(() => {
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
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly showHint$ = computed(() => Boolean(this.hintState()) && this.validationMessages$().length === 0);
  protected readonly suggestions$ = computed<readonly CxQueryFieldSuggestion[]>(() => this.buildSuggestions());

  public ngAfterViewInit(): void {
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

  public ngAfterViewChecked(): void {
    this.scheduleOverflowSync();
  }

  public ngOnDestroy(): void {
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

  protected isLocked(): boolean {
    return this.disabledState() || this.loadingState();
  }

  protected resolvedAriaLabelledBy(): string | null {
    return !this.ariaLabel?.trim() && this.label.trim() ? this.labelId : null;
  }

  protected resolvedAriaLabel(): string | null {
    return this.ariaLabel?.trim() || (!this.label.trim() ? 'Filters' : null);
  }

  protected resolvedAriaDescribedBy(): string {
    const ids = [this.statusId];
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.push(this.messagesId);
    }
    return ids.join(' ');
  }

  protected editorStatusText(): string {
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

  protected editorInputMode(): 'decimal' | null {
    const source = this.valueSourceForDraft();
    if (this.draftState()?.stage !== 'value' || !source) {
      return null;
    }
    return source.kind === 'number' ? 'decimal' : null;
  }

  protected isDateValueStage(): boolean {
    const source = this.valueSourceForDraft();
    return this.draftState()?.stage === 'value' && source?.kind === 'date';
  }

  protected editorWidth(): number {
    if (this.isDateValueStage()) {
      return 15;
    }
    return Math.min(Math.max(this.editorTextState().length + 1, 2), 28);
  }

  protected activeDescendant(): string | null {
    const index = this.normalizedActiveSuggestionIndex();
    return this.openState() && index >= 0 ? this.suggestionDomId(index) : null;
  }

  protected suggestionDomId(index: number): string {
    return `cx-query-field-option-${this.instanceId}-${index}`;
  }

  protected stageHeading(): string {
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

  protected listboxLabel(): string {
    return `${this.stageHeading()} for ${this.label.trim() || 'filters'}`;
  }

  protected currentSuggestionsLoading(): boolean {
    const source = this.valueSourceForDraft();
    return this.draftState()?.stage === 'value' && source?.kind === 'options' && source.loading === true;
  }

  protected currentSuggestionsError(): string | undefined {
    const source = this.valueSourceForDraft();
    if (this.draftState()?.stage !== 'value' || source?.kind !== 'options') {
      return undefined;
    }
    return source.error?.trim() || undefined;
  }

  protected emptyHeading(): string {
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

  protected emptyDescription(): string | undefined {
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

  protected onContainerClick(): void {
    if (this.isLocked()) {
      return;
    }
    if (!this.draftState()) {
      this.beginNewCondition();
      return;
    }
    this.focusEditor();
  }

  protected onSegmentsScroll(): void {
    this.scheduleOverflowSync();
  }

  protected onContainerFocusIn(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target instanceof HTMLInputElement) {
      this.navigationStatusState.set('');
      return;
    }
    const conditionElement = target.closest<HTMLElement>('[data-query-condition-id]');
    const conditionId = conditionElement?.dataset['queryConditionId'];
    const condition = conditionId
      ? this.conditionsState().find(item => item.id === conditionId)
      : undefined;
    this.navigationStatusState.set(condition
      ? `${this.conditionSummary(condition)}. Press Backspace to remove this filter.`
      : '');
  }

  protected onContainerKeydown(event: KeyboardEvent): void {
    if (
      this.isLocked()
      || event.isComposing
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
    ) {
      return;
    }
    const field = this.fieldContainerRef?.nativeElement;
    const eventTarget = event.target;
    if (!field || !(eventTarget instanceof HTMLElement)) {
      return;
    }
    if (event.key === 'Backspace' && !(eventTarget instanceof HTMLInputElement)) {
      const condition = eventTarget.closest<HTMLElement>('[data-query-condition-id]');
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
    const current = eventTarget.closest<HTMLElement>(
      '.cx-query-element, .cx-query-field__join, .cx-query-field__editor',
    );
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

  protected onEditorFocus(): void {
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

  protected onEditorInput(event: Event): void {
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

  protected onEditorKeydown(event: KeyboardEvent): void {
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
    if (
      (event.key === ' ' || event.key === 'Spacebar')
      && this.isMultipleValueStage()
      && this.isQueryFinishable()
      && !this.editorTextState()
    ) {
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
      if (
        this.structuredCaretState()
        && draft?.targetId
        && !this.hasUncommittedDraftChanges(draft)
      ) {
        this.deleteConditionFromCaret(draft.targetId);
        return;
      }
      this.handleBackspaceNavigation();
      return;
    }
  }

  protected openConditionPart(
    condition: CxQueryFieldCondition,
    stage: CxQueryFieldEditorStage,
    structuredNavigation = false,
  ): void {
    if (this.isLocked()) {
      return;
    }
    this.cancelScheduledTabClose();
    const draft: CxQueryFieldDraft = {
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

  protected openConditionPartFromPointer(
    condition: CxQueryFieldCondition,
    stage: CxQueryFieldEditorStage,
  ): void {
    const source = this.fieldForCondition(condition)?.value;
    const structuredNavigation = stage !== 'value' || source?.kind === 'options';
    this.openConditionPart(condition, stage, structuredNavigation);
  }

  protected openDraftPart(stage: 'join' | 'field' | 'operator'): void {
    const draft = this.draftState();
    if (
      !draft
      || this.isLocked()
      || (stage === 'join' && this.conditionsState().length === 0)
      || (stage === 'operator' && !draft.fieldId)
    ) {
      return;
    }
    this.cancelScheduledTabClose();
    this.draftState.set({ ...draft, stage });
    this.structuredCaretState.set(false);
    this.editorTextState.set('');
    this.openState.set(true);
    this.transitionEditorStage();
  }

  protected isEditingPart(conditionId: string, stage: CxQueryFieldEditorStage): boolean {
    const draft = this.draftState();
    return draft?.targetId === conditionId && draft.stage === stage;
  }

  protected isStructuredCaretVisible(): boolean {
    return this.structuredCaretState() && this.editorTextState().length === 0;
  }

  protected showStructuredNavigationTarget(
    conditionId: string,
    stage: CxQueryFieldEditorStage,
  ): boolean {
    const draft = this.draftState();
    if (
      !this.structuredCaretState()
      || this.editorTextState().length > 0
      || draft?.targetId !== conditionId
      || draft.stage !== stage
    ) {
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

  protected isDraftNew(): boolean {
    const draft = this.draftState();
    return Boolean(draft && !draft.targetId);
  }

  protected fieldElementData(condition: CxQueryFieldCondition): CxQueryElementData {
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

  protected operatorElementData(condition: CxQueryFieldCondition): CxQueryElementData {
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

  protected valueElementData(condition: CxQueryFieldCondition): CxQueryElementData {
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

  protected draftFieldElementData(): CxQueryElementData {
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

  protected draftOperatorElementData(): CxQueryElementData {
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

  protected draftValueSummary(): string {
    const draft = this.draftState();
    if (!draft || draft.stage !== 'value' || this.valueModeForDraft(draft) !== 'multiple') {
      return '';
    }
    return this.valueLabelsForDraft(draft).join(', ');
  }

  protected conditionNeedsValue(condition: CxQueryFieldCondition): boolean {
    const presentation = this.presentationCondition(condition);
    return this.valueModeForCondition(presentation) !== 'none';
  }

  protected conditionJoinLabel(condition: CxQueryFieldCondition): string {
    return condition.join === 'or' ? 'OR' : condition.join === 'and' ? 'AND' : 'JOIN';
  }

  protected draftJoinLabel(): string {
    return this.draftState()?.join === 'or' ? 'OR' : 'AND';
  }

  protected isConditionInvalid(conditionId: string): boolean {
    return this.invalidConditionIds$().has(conditionId);
  }

  protected isSuggestionActive(index: number): boolean {
    return this.normalizedActiveSuggestionIndex() === index;
  }

  protected suggestionAriaSelected(suggestion: CxQueryFieldSuggestion): string {
    return String(Boolean(suggestion.selected));
  }

  protected showSuggestionCheckbox(suggestion: CxQueryFieldSuggestion): boolean {
    return suggestion.kind === 'value' && this.valueModeForDraft() === 'multiple';
  }

  protected isMultipleValueStage(): boolean {
    return this.draftState()?.stage === 'value' && this.valueModeForDraft() === 'multiple';
  }

  protected onSuggestionPointerDown(event: PointerEvent): void {
    event.preventDefault();
  }

  protected setActiveSuggestion(index: number): void {
    const suggestion = this.suggestions$()[index];
    if (!suggestion?.disabled) {
      this.activeSuggestionIndexState.set(index);
    }
  }

  protected selectSuggestion(index: number): void {
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

  protected multipleSelectionCount(): number {
    const draft = this.draftState();
    return draft?.stage === 'value' && this.valueModeForDraft(draft) === 'multiple'
      ? this.draftSelectedValues(draft).length
      : 0;
  }

  protected isQueryFinishable(): boolean {
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

  protected finishQuery(): void {
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

  protected retryValues(): void {
    this.retryCurrentValues();
  }

  protected removeCurrentCondition(): void {
    const conditionId = this.draftState()?.targetId;
    if (conditionId) {
      this.deleteConditionFromCaret(conditionId);
    }
  }

  protected canRemoveCurrentCondition(): boolean {
    return Boolean(this.draftState()?.targetId);
  }

  protected onFooterActionKeydown(event: KeyboardEvent): void {
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

  protected onClear(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.isLocked() || !this.clearable || this.conditionsState().length === 0) {
      return;
    }
    this.closeEditor(true);
    this.emitValue([]);
    this.clear.emit();
  }

  protected cancelEditor(): void {
    this.closeEditor(true);
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.overlay.sync();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
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

  @HostListener('document:focusin', ['$event'])
  protected onDocumentFocusIn(event: FocusEvent): void {
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

  private readonly onCapturedDocumentScroll = (event: Event): void => {
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

  private beginNewCondition(): void {
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

  private queryNavigationTargets(field: HTMLElement): HTMLElement[] {
    return Array.from(field.querySelectorAll<HTMLElement>(
      '.cx-query-element:not(:disabled), .cx-query-field__join:not(:disabled), .cx-query-field__editor:not(:disabled)',
    ));
  }

  private navigationDescriptors(): CxQueryFieldNavigationDescriptor[] {
    const descriptors: CxQueryFieldNavigationDescriptor[] = [];
    for (const [index, condition] of this.conditionsState().entries()) {
      if (index > 0) {
        descriptors.push({ conditionId: condition.id, part: 'join' });
      }
      descriptors.push(
        { conditionId: condition.id, part: 'field' },
        { conditionId: condition.id, part: 'operator' },
      );
      if (this.valueModeForCondition(condition) !== 'none') {
        descriptors.push({ conditionId: condition.id, part: 'value' });
      }
    }
    descriptors.push({ part: 'tail' });
    return descriptors;
  }

  private navigationIndexForDraft(draft: CxQueryFieldDraft | undefined): number {
    const descriptors = this.navigationDescriptors();
    if (!draft?.targetId) {
      return descriptors.length - 1;
    }
    return descriptors.findIndex(descriptor =>
      descriptor.conditionId === draft.targetId && descriptor.part === draft.stage,
    );
  }

  private navigateToDescriptor(descriptor: CxQueryFieldNavigationDescriptor): void {
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

  private hasUncommittedDraftChanges(draft: CxQueryFieldDraft | undefined): boolean {
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

  private queryValuesEqual(
    first: CxQueryFieldValue | undefined,
    second: CxQueryFieldValue | undefined,
  ): boolean {
    if (Array.isArray(first) || Array.isArray(second)) {
      return Array.isArray(first)
        && Array.isArray(second)
        && first.length === second.length
        && first.every((value, index) => value === second[index]);
    }
    return first === second;
  }

  private conditionSummary(condition: CxQueryFieldCondition): string {
    const field = this.fieldForCondition(condition)?.label ?? condition.fieldId;
    const operator = this.operatorForCondition(condition)?.label ?? condition.operatorId;
    const value = this.valueLabelsForCondition(condition).join(', ');
    return [field, operator, value].filter(Boolean).join(' ');
  }

  private deleteConditionFromCaret(conditionId: string): void {
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
    } else if (next) {
      this.navigateToDescriptor({ conditionId: next.id, part: 'field' });
    } else {
      this.navigateToDescriptor({ part: 'tail' });
    }
  }

  private scheduleOverflowSync(): void {
    if (typeof window === 'undefined' || this.overflowSyncFrame !== undefined) {
      return;
    }
    this.overflowSyncFrame = window.requestAnimationFrame(() => {
      this.overflowSyncFrame = undefined;
      this.syncOverflowAffordance();
    });
  }

  private syncOverflowAffordance(): void {
    const segments = this.segmentsRef?.nativeElement;
    if (!segments || this.growVertically) {
      this.hasHiddenQueryBeforeState.set(false);
      this.hasHiddenQueryAfterState.set(false);
      return;
    }
    const maxScrollLeft = Math.max(segments.scrollWidth - segments.clientWidth, 0);
    const tolerance = 1;
    this.hasHiddenQueryBeforeState.set(maxScrollLeft > tolerance && segments.scrollLeft > tolerance);
    this.hasHiddenQueryAfterState.set(
      maxScrollLeft > tolerance && segments.scrollLeft < maxScrollLeft - tolerance,
    );
  }

  private selectField(fieldId: string): void {
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

  private selectOperator(operatorId: string): void {
    const draft = this.draftState();
    const field = this.fieldForDraft(draft);
    const operator = field?.operators.find(item => item.id === operatorId);
    if (!draft || !field || !operator || operator.disabled) {
      return;
    }
    const previousMode = this.valueModeForDraft(draft);
    const nextMode = this.valueModeForOperator(operator);
    const preserveValue = Boolean(draft.operatorId) && previousMode === nextMode;
    const nextDraft: CxQueryFieldDraft = {
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

  private selectOptionValue(valueId: string): void {
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

  private selectJoin(join: CxQueryFieldJoin): void {
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
    const next = this.conditionsState().map((condition, index) =>
      condition.id === draft.targetId
        ? { ...condition, join: index === 0 ? undefined : join }
        : condition,
    );
    this.emitValue(next);
    this.closeEditor(true);
  }

  private commitCustomValue(): void {
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

  private commitDraftCondition(finishQuery = false): void {
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
    const condition: CxQueryFieldCondition = {
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

  private retryCurrentValues(): void {
    const draft = this.draftState();
    if (!draft?.fieldId) {
      return;
    }
    this.valueRetry.emit({ fieldId: draft.fieldId, query: this.editorTextState() });
    this.focusEditor();
  }

  private hasFooterAction(): boolean {
    return Boolean(this.currentSuggestionsError())
      || this.isQueryFinishable()
      || this.canRemoveCurrentCondition();
  }

  private closeEditor(focus: boolean): void {
    this.cancelScheduledTabClose();
    this.openState.set(false);
    this.draftState.set(undefined);
    this.structuredCaretState.set(false);
    this.editorTextState.set('');
    this.activeSuggestionIndexState.set(-1);
    this.overlay.resetMeasurement();
    if (focus) {
      this.suppressNextFocusOpen = true;
      this.focusEditor();
    } else {
      this.suppressNextFocusOpen = false;
    }
  }

  private openPopoverAndFocus(): void {
    this.overlay.resetMeasurement();
    queueMicrotask(() => {
      this.overlay.sync(this.fieldContainerRef?.nativeElement);
      this.focusEditor();
    });
  }

  private transitionEditorStage(): void {
    this.overlay.resetMeasurement();
    this.structuredCaretState.set(this.editorTextState().length === 0);
    this.setActiveSuggestionToFirst(true);
    queueMicrotask(() => {
      this.overlay.sync(this.fieldContainerRef?.nativeElement);
      this.focusEditor();
    });
  }

  private focusEditor(): void {
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

  private scheduleTabClose(): void {
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

  private cancelScheduledTabClose(): void {
    if (typeof window === 'undefined' || this.tabCloseTimer === undefined) {
      return;
    }
    window.clearTimeout(this.tabCloseTimer);
    this.tabCloseTimer = undefined;
  }

  private handleBackspaceNavigation(): void {
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
      } else if (draft.targetId) {
        this.structuredCaretState.set(true);
      }
      return;
    }
    this.editPreviousCondition(draft.targetId);
  }

  private removeLastDraftValue(draft: CxQueryFieldDraft): boolean {
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

  private editPreviousCondition(beforeConditionId?: string): void {
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

  private buildSuggestions(): readonly CxQueryFieldSuggestion[] {
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
      const suggestions: CxQueryFieldSuggestion[] = options.map(option => ({
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

  private filterOptions<T extends CxQueryFieldOption>(options: readonly T[], query: string): readonly T[] {
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

  private optionMatchScore(option: CxQueryFieldOption, query: string): number {
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

  private moveActiveSuggestion(delta: 1 | -1): void {
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

  private scrollActiveSuggestionIntoView(): void {
    queueMicrotask(() => {
      const index = this.normalizedActiveSuggestionIndex();
      if (index < 0) {
        return;
      }
      const option = this.popoverRef?.surfaceElement()?.querySelector<HTMLElement>(`#${this.suggestionDomId(index)}`);
      option?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  }

  private setActiveSuggestionToFirst(preferSelected = false): void {
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

  private setActiveSuggestionToKey(key: string): void {
    const suggestions = this.suggestions$();
    const requestedIndex = suggestions.findIndex(suggestion => suggestion.key === key && !suggestion.disabled);
    const index = requestedIndex >= 0
      ? requestedIndex
      : suggestions.findIndex(suggestion => !suggestion.disabled);
    this.activeSuggestionIndexState.set(index);
    this.scrollActiveSuggestionIntoView();
  }

  private normalizedActiveSuggestionIndex(): number {
    const suggestions = this.suggestions$();
    const current = this.activeSuggestionIndexState();
    if (current >= 0 && current < suggestions.length && !suggestions[current].disabled) {
      return current;
    }
    return suggestions.findIndex(suggestion => !suggestion.disabled);
  }

  private presentationCondition(condition: CxQueryFieldCondition): CxQueryFieldCondition {
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

  private fieldForCondition(condition: CxQueryFieldCondition): CxQueryFieldDefinition | undefined {
    return this.fieldsState().find(field => field.id === condition.fieldId);
  }

  private operatorForCondition(condition: CxQueryFieldCondition): CxQueryFieldOperator | undefined {
    return this.fieldForCondition(condition)?.operators.find(operator => operator.id === condition.operatorId);
  }

  private fieldForDraft(draft = this.draftState()): CxQueryFieldDefinition | undefined {
    return this.fieldsState().find(field => field.id === draft?.fieldId);
  }

  private operatorForDraft(draft = this.draftState()): CxQueryFieldOperator | undefined {
    return this.fieldForDraft(draft)?.operators.find(operator => operator.id === draft?.operatorId);
  }

  private valueSourceForDraft(draft = this.draftState()): CxQueryFieldValueDefinition | undefined {
    return this.fieldForDraft(draft)?.value;
  }

  private valueModeForOperator(operator: CxQueryFieldOperator | undefined): CxQueryFieldValueMode {
    return operator?.valueMode ?? 'single';
  }

  private valueModeForDraft(draft = this.draftState()): CxQueryFieldValueMode {
    return this.valueModeForOperator(this.operatorForDraft(draft));
  }

  private valueModeForCondition(condition: CxQueryFieldCondition): CxQueryFieldValueMode {
    return this.valueModeForOperator(this.operatorForCondition(condition));
  }

  private scalarEditorText(draft: CxQueryFieldDraft): string {
    const source = this.valueSourceForDraft(draft);
    if (!source || source.kind === 'options' || draft.value === undefined || Array.isArray(draft.value)) {
      return '';
    }
    return String(draft.value);
  }

  private draftSelectedValues(draft: CxQueryFieldDraft): string[] {
    if (Array.isArray(draft.value)) {
      return [...draft.value];
    }
    return typeof draft.value === 'string' ? [draft.value] : [];
  }

  private valueLabelsForDraft(draft: CxQueryFieldDraft): string[] {
    if (!draft.fieldId) {
      return [];
    }
    return this.valueLabels(draft.fieldId, draft.value);
  }

  private valueLabelsForCondition(condition: CxQueryFieldCondition): string[] {
    return this.valueLabels(condition.fieldId, condition.value);
  }

  private valueLabels(fieldId: string, value: CxQueryFieldValue | undefined): string[] {
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

  private isDraftValueComplete(draft: CxQueryFieldDraft, mode: CxQueryFieldValueMode): boolean {
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

  private parseCustomValue(
    text: string,
    source: CxQueryFieldValueDefinition | undefined,
  ): string | number | undefined {
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

  private isConditionValid(condition: CxQueryFieldCondition, index: number): boolean {
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

  private isNumberWithinConstraints(
    value: number,
    source: Extract<CxQueryFieldValueDefinition, { kind: 'number' }>,
  ): boolean {
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

  private isDateWithinConstraints(
    value: string,
    source: Extract<CxQueryFieldValueDefinition, { kind: 'date' }>,
  ): boolean {
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
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) {
      return false;
    }
    return (source.min === undefined || value >= source.min)
      && (source.max === undefined || value <= source.max);
  }

  private emitValue(value: readonly CxQueryFieldCondition[]): void {
    const normalized = this.normalizeJoins(value);
    this.conditionsState.set(normalized);
    this.valueChange.emit(normalized);
  }

  private emitManualValueSearch(query: string, draft = this.draftState()): void {
    const source = this.valueSourceForDraft(draft);
    if (draft?.stage === 'value' && draft.fieldId && source?.kind === 'options' && source.filterMode === 'manual') {
      this.valueSearch.emit({ fieldId: draft.fieldId, query });
    }
  }

  private rememberValueOptions(fields: readonly CxQueryFieldDefinition[]): void {
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

  private normalizeConditions(value: readonly CxQueryFieldCondition[]): readonly CxQueryFieldCondition[] {
    const seenIds = new Set<string>();
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

  private normalizeJoins(value: readonly CxQueryFieldCondition[]): readonly CxQueryFieldCondition[] {
    return value.map((condition, index) => ({
      ...condition,
      join: index === 0
        ? undefined
        : condition.join === 'and' || condition.join === 'or'
          ? condition.join
          : undefined,
    }));
  }

  private cloneValue(value: CxQueryFieldValue | undefined): CxQueryFieldValue | undefined {
    return Array.isArray(value) ? [...value] : value;
  }

  private refreshOpenSuggestions(): void {
    if (!this.openState()) {
      return;
    }
    this.setActiveSuggestionToFirst(!this.editorTextState().trim());
    this.refreshPopoverMeasurement();
  }

  private refreshPopoverMeasurement(): void {
    if (!this.openState()) {
      return;
    }
    queueMicrotask(() => {
      this.overlay.resetMeasurement();
      this.overlay.sync(this.fieldContainerRef?.nativeElement);
    });
  }

  private measureOverlay(rect: DOMRect, viewport: CxFloatingSurfaceViewport): CxFloatingSurfaceRequest {
    const viewportMaxWidth = Math.max(viewport.width - 16, 0);
    const width = Math.floor(Math.min(
      Math.max(rect.width, CX_QUERY_FIELD_POPOVER_MIN_WIDTH),
      CX_QUERY_FIELD_POPOVER_MAX_WIDTH,
      viewportMaxWidth,
    ));
    const stateHeight = this.currentSuggestionsLoading() || this.currentSuggestionsError() || this.suggestions$().length === 0
      ? 132
      : 0;
    const footerHeight = this.hasFooterAction() ? CX_QUERY_FIELD_OPTION_HEIGHT : 0;
    const estimatedContentHeight = Math.min(
      36 + this.suggestions$().length * CX_QUERY_FIELD_OPTION_HEIGHT + stateHeight + footerHeight,
      CX_QUERY_FIELD_POPOVER_MAX_HEIGHT,
    );
    const estimatedHeight = estimatedContentHeight + CX_QUERY_FIELD_POPOVER_FRAME_HEIGHT;
    return {
      width,
      minWidth: width,
      estimatedHeight,
      align: 'start',
      maxHeightCap: estimatedHeight,
    };
  }
}
