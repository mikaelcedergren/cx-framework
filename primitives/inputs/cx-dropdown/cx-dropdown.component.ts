import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxTextFieldComponent } from '../cx-text-field';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxIconName } from '../../../icons/manifest';
import { CxOptionComponent, type CxOptionMood } from '../../overlay/cx-option';
import { CxOptionGroupComponent } from '../../overlay/cx-option-group';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../overlay/floating-surface-controller';
import { type CxFieldValidation, type CxFieldSize, normalizeCxValidation } from '../shared/field.types';
import { CxHostVisibilityObserver } from '../../shared/host-visibility';

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

export type CxDropdownOption = {
  id: string;
  label: string;
  /**
   * Options that share a group label render under one quiet header row.
   * A header appears wherever the label changes while reading the list top
   * to bottom, so consumers keep grouped options adjacent and place
   * ungrouped options before the first group.
   */
  group?: string;
  description?: string;
  prependIcon?: CxIconName;
  appendIcon?: CxIconName;
  mood?: CxOptionMood;
  shortcutParts?: readonly string[];
  keywords?: readonly string[];
  disabled?: boolean;
};

export type CxDropdownSize = CxFieldSize;
export type CxDropdownSelection = 'single' | 'multiple';
export type CxDropdownFilterMode = 'client' | 'manual';
export type CxDropdownSelectedCountTranslation = string | ((count: number) => string);
export type CxDropdownTranslations = Partial<{
  optional: string;
  search: string;
  clear: string;
  loading: string;
  loadingDescription: string;
  loadingMore: string;
  noResults: string;
  noResultsDescription: string;
  noOptions: string;
  noOptionsDescription: string;
  createLabel: string;
  selectedCount: CxDropdownSelectedCountTranslation;
}>;
type CxDropdownFocusTarget = 'search' | 'selected' | 'first' | 'last' | 'create' | 'none';
type CxDropdownRow =
  | { kind: 'group'; key: string; label: string }
  | { kind: 'option'; key: string; option: CxDropdownOption; optionIndex: number };
type CxDropdownRenderedRow = CxDropdownRow & { rowIndex: number };

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
} satisfies Required<CxDropdownTranslations>;

@Component({
  selector: 'cx-dropdown',
  imports: [
    CommonModule,
    CxValidationMessageComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxTextFieldComponent,
    CxOptionComponent,
    CxOptionGroupComponent,
    CxPopoverComponent,
    CxSpinnerComponent,
    CxTooltipDirective,
  ],
  templateUrl: './cx-dropdown.component.html',
  styleUrl: './cx-dropdown.component.scss',
  host: {
    '[class.cx-dropdown-host--small]': 'size === "small"',
    '[class.cx-dropdown-host--large]': 'size === "large"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDropdownComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly instanceId = CxDropdownComponent.nextId++;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly hostVisibility = new CxHostVisibilityObserver(this.host.nativeElement, visible => {
    if (!visible && this.openState()) {
      this.closePopover();
    }
  });
  private readonly optionsState = signal<CxDropdownOption[]>([]);
  private readonly selectionState = signal<CxDropdownSelection>('single');
  private readonly filterModeState = signal<CxDropdownFilterMode>('client');
  private readonly searchableState = signal(false);
  private readonly creatableState = signal(false);
  private readonly selectedValueState = signal<string | undefined>(undefined);
  private readonly selectedValuesState = signal<string[]>([]);
  // Options that were selected at some point. Keeps labels resolvable when
  // availableValues no longer contains a selected option (manual filtering,
  // paged loading), where the current snapshot is not the full option set.
  private readonly knownSelectedOptionsState = signal<ReadonlyMap<string, CxDropdownOption>>(new Map());
  private readonly clearableState = signal(false);
  private readonly hasMoreState = signal(false);
  private readonly loadingMoreState = signal(false);
  private readonly placeholderState = signal('');
  private readonly translationsState = signal<CxDropdownTranslations>({});
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly searchQueryState = signal('');
  private readonly openState = signal(false);
  private readonly activeOptionIdState = signal<string | undefined>(undefined);
  private readonly activeCreateState = signal(false);
  private readonly scrollTopState = signal(0);
  private readonly optionsViewportHeightState = signal(0);
  private readonly optionHeightState = signal(CX_DROPDOWN_OPTION_HEIGHT);
  protected readonly overlay = new CxFloatingSurfaceController(
    (rect, viewport) => this.measureOverlay(rect, viewport),
    () => this.popoverRef?.surfaceElement(),
  );
  protected readonly popoverMaxWidth = CX_DROPDOWN_POPOVER_MAX_WIDTH;
  private readonly focusedState = signal(false);
  private requiredValueValidationQueued = false;
  private reportedInvalidValue = false;
  private searchFocusTimer?: number;
  private openFocusTimer?: number;
  private typeaheadTimer?: number;
  private typeaheadBuffer = '';
  private optionFocusRetryTimer?: number;
  private pendingOptionFocusIndex?: number;
  private selectionMeasureFrame?: number;
  private optionMeasureFrame?: number;
  private loadMoreRequested = false;
  private openTracking = false;
  private selectionResizeObserver?: ResizeObserver;
  private selectionResizeElement?: HTMLElement;
  protected readonly labelId = `cx-dropdown-label-${this.instanceId}`;
  protected readonly messagesId = `cx-dropdown-messages-${this.instanceId}`;
  protected readonly popoverId = `cx-dropdown-popover-${this.instanceId}`;
  protected readonly listboxId = `cx-dropdown-listbox-${this.instanceId}`;

  @ViewChild('fieldButton', { read: ElementRef })
  private fieldButtonRef?: ElementRef<HTMLElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;
  @ViewChild('searchInput')
  private searchInputRef?: CxTextFieldComponent;
  @ViewChild('valueText', { read: ElementRef })
  private valueTextRef?: ElementRef<HTMLElement>;
  @ViewChild('selectionMeasure', { read: ElementRef })
  private selectionMeasureRef?: ElementRef<HTMLElement>;
  @ViewChildren('optionRow', { read: ElementRef })
  private optionRefs?: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('optionRow')
  private optionComponents?: QueryList<CxOptionComponent>;
  @ViewChild('createRow')
  private createRowComponent?: CxOptionComponent;
  @ViewChild('optionsScroller', { read: ElementRef })
  private optionsScrollerRef?: ElementRef<HTMLElement>;

  protected readonly isMultiple$ = computed(() => this.selectionState() === 'multiple');
  protected readonly selectedOption$ = computed(() => {
    const selectedValue = this.selectedValueState();
    if (!selectedValue) {
      return undefined;
    }
    return (
      this.optionsState().find(option => option.id === selectedValue) ??
      this.knownSelectedOptionsState().get(selectedValue)
    );
  });
  protected readonly selectedOptions$ = computed(() => {
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
      .filter((option): option is CxDropdownOption => option !== undefined);
    return [...fromOptions, ...fromKnown];
  });
  protected readonly placeholderText$ = computed(() => {
    const explicitPlaceholder = this.placeholderState().trim();
    if (explicitPlaceholder) {
      return explicitPlaceholder;
    }
    const subject = this.selectPlaceholderSubject();
    return subject ? `Select ${subject}` : 'Select';
  });
  protected readonly emptyDescription$ = computed(() => this.translation('noResultsDescription'));
  protected readonly showSearchEmptyState$ = computed(() => this.searchQueryState().trim().length > 0);
  protected readonly createLabel$ = computed(() => this.translation('createLabel'));
  protected readonly selectedLabelsText$ = computed(() =>
    this.selectedOptions$()
      .map(option => option.label)
      .join(', '),
  );
  protected readonly selectedCountText$ = computed(() => this.formatSelectedCount(this.selectedOptions$().length));
  protected readonly collapseSelectedText$ = signal(false);
  protected readonly emptyDisplayText$ = computed(() => this.placeholderText$());
  protected readonly displayText$ = computed(() => {
    if (this.isMultiple$()) {
      const selectedOptions = this.selectedOptions$();
      if (selectedOptions.length > 0) {
        return this.collapseSelectedText$() ? this.selectedCountText$() : this.selectedLabelsText$();
      }
      return this.emptyDisplayText$();
    }
    return this.selectedOption$()?.label || this.emptyDisplayText$();
  });
  protected readonly showPlaceholder$ = computed(() => {
    if (this.isMultiple$()) {
      return this.selectedOptions$().length === 0;
    }
    return !this.selectedOption$();
  });
  protected readonly filteredOptions$ = computed(() => {
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
  });
  // The scroll geometry (virtual window, scroll-into-view, overlay sizing)
  // counts rendered rows, while selection, focus, and typeahead keep counting
  // options; group headers exist only in the row layer.
  protected readonly rows$ = computed<CxDropdownRow[]>(() => {
    const rows: CxDropdownRow[] = [];
    let previousGroup: string | undefined;
    this.filteredOptions$().forEach((option, optionIndex) => {
      const group = option.group?.trim() || undefined;
      if (group && group !== previousGroup) {
        rows.push({ kind: 'group', key: `group:${optionIndex}`, label: group });
      }
      previousGroup = group;
      rows.push({ kind: 'option', key: option.id, option, optionIndex });
    });
    return rows;
  });
  private readonly optionRowIndexes$ = computed<number[]>(() => {
    const indexes: number[] = [];
    this.rows$().forEach((row, rowIndex) => {
      if (row.kind === 'option') {
        indexes[row.optionIndex] = rowIndex;
      }
    });
    return indexes;
  });
  protected readonly virtualizedOptions$ = computed(
    () => this.rows$().length > CX_DROPDOWN_VIRTUALIZATION_THRESHOLD,
  );
  protected readonly renderedRows$ = computed<CxDropdownRenderedRow[]>(() => {
    const rows = this.rows$();
    if (!this.virtualizedOptions$()) {
      return rows.map((row, rowIndex) => ({ ...row, rowIndex }));
    }

    const rowHeight = this.optionHeightState();
    const viewportHeight = this.optionsViewportHeightState() || 320;
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const start = Math.max(0, Math.floor(this.scrollTopState() / rowHeight) - CX_DROPDOWN_VIRTUAL_BUFFER);
    const end = Math.min(rows.length, start + visibleCount + CX_DROPDOWN_VIRTUAL_BUFFER * 2);
    return rows.slice(start, end).map((row, offset) => ({ ...row, rowIndex: start + offset }));
  });
  protected readonly virtualOptionsHeight$ = computed(() =>
    this.virtualizedOptions$() ? this.rows$().length * this.optionHeightState() : 0,
  );
  protected readonly virtualOptionsOffset$ = computed(() =>
    this.virtualizedOptions$()
      ? `translateY(${(this.renderedRows$()[0]?.rowIndex ?? 0) * this.optionHeightState()}px)`
      : 'translateY(0)',
  );
  protected readonly optionHeight$ = this.optionHeightState.asReadonly();
  protected readonly labelText$ = computed(() => {
    const trimmedLabel = this.label.trim();
    return trimmedLabel || '';
  });
  protected readonly searchEnabled$ = computed(() => this.searchableState() || this.creatableState());
  protected readonly createValue$ = computed(() => this.searchQueryState().trim());

  @Input() label = 'Entity';
  @Input() ariaLabel: string | undefined;
  @Input() name: string | undefined;
  @Input() transparent = false;

  @Input()
  public set translations(value: CxDropdownTranslations | null | undefined) {
    this.translationsState.set(value ?? {});
  }

  @Input()
  public set placeholder(value: string | undefined) {
    this.placeholderState.set(value ?? '');
    this.scheduleRequiredValueValidation();
  }
  @Input() size: CxDropdownSize = 'default';
  @Input() optional = false;
  @Input() disabled = false;
  @Input() loading = false;

  @Input()
  public set loadingMore(value: boolean | undefined) {
    const nextLoadingMore = value === true;
    this.loadingMoreState.set(nextLoadingMore);
    if (!nextLoadingMore) {
      this.loadMoreRequested = false;
    }
  }

  @Input()
  public set hasMore(value: boolean | undefined) {
    const nextHasMore = value === true;
    this.hasMoreState.set(nextHasMore);
    if (!nextHasMore) {
      this.loadMoreRequested = false;
    }
  }

  @Input()
  public set clearable(value: boolean | undefined) {
    this.clearableState.set(value === true);
    this.scheduleRequiredValueValidation();
    this.scheduleSelectionDisplayMeasurement();
  }

  @Input()
  public set selection(value: CxDropdownSelection | undefined) {
    this.selectionState.set(value === 'multiple' ? 'multiple' : 'single');
    this.scheduleRequiredValueValidation();
    this.scheduleSelectionDisplayMeasurement();
  }

  @Input()
  public set filterMode(value: CxDropdownFilterMode | undefined) {
    this.filterModeState.set(value === 'manual' ? 'manual' : 'client');
    this.resetOptionScroll();
  }

  @Input()
  public set searchable(value: boolean | undefined) {
    this.searchableState.set(value === true);
    if (!this.searchEnabled$()) {
      this.setSearchQuery('', false);
    }
  }

  @Input()
  public set creatable(value: boolean | undefined) {
    this.creatableState.set(value === true);
    if (!this.searchEnabled$()) {
      this.setSearchQuery('', false);
    }
  }
  @Input() hint: string | undefined;
  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }
  @Input()
  public set availableValues(value: CxDropdownOption[]) {
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

  @Input()
  public set value(value: string | undefined) {
    this.selectedValueState.set(value);
    this.rememberSelectedOptions();
    this.scheduleRequiredValueValidation();
    this.scheduleSelectionDisplayMeasurement();
  }

  @Input()
  public set values(value: string[] | undefined) {
    this.selectedValuesState.set(this.normalizeSelectedValues(value));
    this.rememberSelectedOptions();
    this.scheduleRequiredValueValidation();
    this.scheduleSelectionDisplayMeasurement();
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
  @Output() readonly valuesChange = new EventEmitter<string[]>();
  @Output() readonly create = new EventEmitter<string>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly clear = new EventEmitter<void>();
  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly loadMore = new EventEmitter<void>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly searchQuery$ = this.searchQueryState.asReadonly();
  protected readonly selection$ = this.selectionState.asReadonly();
  protected readonly filterMode$ = this.filterModeState.asReadonly();
  protected readonly creatable$ = this.creatableState.asReadonly();
  protected readonly hasMore$ = this.hasMoreState.asReadonly();
  protected readonly loadingMore$ = this.loadingMoreState.asReadonly();
  protected readonly activeOptionId$ = this.activeOptionIdState.asReadonly();
  protected readonly activeCreate$ = this.activeCreateState.asReadonly();
  protected readonly validationMessages$ = () => (this.disabled ? [] : normalizeCxValidation(this.validationState()));
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly isLocked$ = () => this.disabled;
  protected readonly isInteractive$ = () => !this.disabled;
  protected readonly canCommitSelection$ = () => !this.disabled && !this.loading;
  protected readonly hasClear$ = () =>
    this.clearableState() && this.canCommitSelection$() && this.selectedOptions$().length > 0;
  protected readonly formValues$ = computed(() =>
    this.isMultiple$() ? this.selectedValuesState() : [this.selectedValueState() ?? ''],
  );
  protected readonly isRequired$ = () => !this.optional;
  protected readonly optionalText$ = computed(() => this.translation('optional'));
  protected readonly searchAriaLabel$ = computed(() => this.translation('search'));
  protected readonly clearAriaLabel$ = computed(() => this.translation('clear'));
  protected readonly loadingText$ = computed(() => this.translation('loading'));
  protected readonly loadingDescriptionText$ = computed(() => this.translation('loadingDescription'));
  protected readonly loadingMoreText$ = computed(() => this.translation('loadingMore'));
  protected readonly noResultsText$ = computed(() => this.translation('noResults'));
  protected readonly noOptionsText$ = computed(() => this.translation('noOptions'));
  protected readonly noOptionsDescriptionText$ = computed(() => this.translation('noOptionsDescription'));

  protected get resolvedName(): string | null {
    return this.name?.trim() || null;
  }

  protected get resolvedFieldAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    if (this.labelText$()) {
      return undefined;
    }
    return this.placeholderText$() || 'Select';
  }

  protected get resolvedFieldAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.labelText$() ? this.labelId : undefined;
  }

  protected get resolvedFieldAriaDescribedBy(): string | undefined {
    const ids: string[] = [];
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.push(this.messagesId);
    }
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  ngAfterViewInit(): void {
    this.overlay.setTrigger(this.fieldButtonRef?.nativeElement);
    if (this.openState()) {
      this.stopOpenTracking();
      this.startOpenTracking();
      this.overlay.sync();
    }
    this.scheduleRequiredValueValidation();
    this.scheduleSelectionDisplayMeasurement();
  }

  ngOnDestroy(): void {
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

  protected toggleOpen(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (this.openState()) {
      this.closePopover();
      return;
    }
    this.openDropdown(field, this.searchEnabled$() ? 'search' : 'selected');
  }

  protected toggleOpenFromPointer(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (this.openState()) {
      this.closePopover();
      return;
    }
    this.openDropdown(field, 'none');
  }

  protected selectOption(option: CxDropdownOption, focusField = false): void {
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

  protected isOptionSelected(optionId: string): boolean {
    if (this.isMultiple$()) {
      return this.selectedValuesState().includes(optionId);
    }
    return this.selectedOption$()?.id === optionId;
  }

  protected isOptionDisabled(option: CxDropdownOption): boolean {
    return option.disabled === true;
  }

  protected onFieldKeydown(event: KeyboardEvent, field?: HTMLElement): void {
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

  protected onSearchKeydown(event: KeyboardEvent): void {
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

  protected onOptionKeydown(event: KeyboardEvent, option: CxDropdownOption): void {
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

  protected onCreateKeydown(event: KeyboardEvent): void {
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

  protected onSearchChange(value: string): void {
    this.setSearchQuery(value);
    this.clearActiveOption();
    if (this.openState()) {
      queueMicrotask(() => {
        this.resetOptionScroll();
        this.overlay.sync();
      });
    }
  }

  protected closePopover(): void {
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

  protected clearSelection(event?: Event): void {
    if (!this.hasClear$()) {
      return;
    }
    event?.preventDefault();
    event?.stopPropagation();
    if (this.isMultiple$()) {
      this.selectedValuesState.set([]);
      this.valuesChange.emit([]);
    } else {
      this.selectedValueState.set(undefined);
      this.valueChange.emit(undefined);
    }
    this.rememberSelectedOptions();
    this.closePopover();
    this.clear.emit();
    this.validateRequiredValueState();
    this.scheduleSelectionDisplayMeasurement();
  }

  protected onCreateOption(event: Event): void {
    if (!this.creatableState() || !this.canCommitSelection$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.create.emit(this.createValue$());
    this.closeAndFocusField();
  }

  protected onComponentFocusIn(): void {
    if (this.focusedState()) {
      return;
    }
    this.focusedState.set(true);
    this.focusChange.emit(true);
  }

  protected onComponentFocusOut(event: FocusEvent): void {
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

  private onDocumentPointerDown(event: PointerEvent): void {
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

  private onWindowResize(): void {
    if (!this.hostVisibility.check()) {
      return;
    }
    this.scheduleSelectionDisplayMeasurement();
    this.overlay.sync();
    this.updateOptionsViewport();
    this.maybeEmitLoadMore();
  }

  protected onOptionsScroll(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    this.scrollTopState.set(target.scrollTop);
    this.optionsViewportHeightState.set(target.clientHeight);
    this.scheduleOptionHeightMeasurement();
    this.maybeEmitLoadMore(target);
  }

  private readonly onCapturedDocumentScroll = (event: Event): void => {
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

  private setOpen(open: boolean): void {
    if (this.openState() === open) {
      return;
    }
    this.openState.set(open);
    if (open) {
      this.startOpenTracking();
    } else {
      this.stopOpenTracking();
    }
    this.openChange.emit(open);
    if (!open) {
      this.resetOptionScroll();
      this.overlay.endSession();
    }
  }

  private setSearchQuery(value: string, emit = true): void {
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

  private resetOptionScroll(): void {
    this.scrollTopState.set(0);
    const scroller = this.optionsScrollerRef?.nativeElement;
    if (scroller) {
      scroller.scrollTop = 0;
      this.optionsViewportHeightState.set(scroller.clientHeight);
    }
  }

  private scheduleOpenFocus(callback: () => void): void {
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

  private openDropdown(field?: HTMLElement, focusTarget: CxDropdownFocusTarget = 'search'): void {
    if (!this.isInteractive$()) {
      return;
    }
    const resolvedFocusTarget: CxDropdownFocusTarget = this.searchEnabled$() ? 'search' : focusTarget;
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

  private closeAndFocusField(): void {
    this.closePopover();
    queueMicrotask(() => {
      this.focusField();
    });
  }

  private focusField(): void {
    this.clearActiveOption();
    const field = this.overlay.trigger ?? this.fieldButtonRef?.nativeElement;
    field?.focus();
  }

  private focusOptionByTarget(target: CxDropdownFocusTarget): void {
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

    let nextIndex: number | undefined;
    if (target === 'last') {
      nextIndex = optionIndexes[optionIndexes.length - 1];
    } else if (target === 'selected') {
      nextIndex = this.selectedOptionIndex();
      if (nextIndex === undefined || !optionIndexes.includes(nextIndex)) {
        nextIndex = optionIndexes[0];
      }
    } else {
      nextIndex = optionIndexes[0];
    }

    if (nextIndex !== undefined) {
      this.focusOptionAtIndex(nextIndex);
    }
  }

  private focusNextOption(optionId: string, direction: 1 | -1): void {
    const optionIndexes = this.enabledOptionIndexes();
    if (optionIndexes.length === 0) {
      if (direction === 1 && this.creatableState()) {
        this.focusCreateOption();
      } else if (this.searchEnabled$()) {
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

  private focusOptionAtIndex(index: number): boolean {
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
  private parkFocusForVirtualJump(index: number): void {
    if (typeof document === 'undefined' || this.optionHostAtIndex(index)) {
      return;
    }
    if (this.currentFocusedOptionIndex() < 0) {
      return;
    }
    const field = this.overlay.trigger ?? this.fieldButtonRef?.nativeElement;
    field?.focus();
  }

  private scrollOpenTargetIntoView(focusTarget: CxDropdownFocusTarget): void {
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

  private scrollOptionIntoView(index: number, align: 'nearest' | 'center' = 'nearest'): void {
    const scroller = this.optionsScrollerRef?.nativeElement;
    if (!scroller) {
      return;
    }
    this.updateOptionsViewport(scroller);
    const optionHeight = this.optionHeightState();
    const rows = this.rows$();
    const rowIndex = this.optionRowIndexes$()[index] ?? index;
    // An option directly below its group header carries that header as
    // context: scrolling up to the option must reveal the header with it.
    const topRowIndex = rows[rowIndex - 1]?.kind === 'group' ? rowIndex - 1 : rowIndex;
    const optionTop = rowIndex * optionHeight;
    const optionBottom = optionTop + optionHeight;
    let nextScrollTop = scroller.scrollTop;
    if (align === 'center') {
      nextScrollTop = optionTop - Math.max((scroller.clientHeight - optionHeight) / 2, 0);
    } else if (optionTop < scroller.scrollTop) {
      nextScrollTop = topRowIndex * optionHeight;
    } else if (optionBottom > scroller.scrollTop + scroller.clientHeight) {
      nextScrollTop = optionBottom - scroller.clientHeight;
    }
    nextScrollTop = Math.max(0, Math.min(nextScrollTop, scroller.scrollHeight - scroller.clientHeight));
    scroller.scrollTop = nextScrollTop;
    this.scrollTopState.set(nextScrollTop);
  }

  private scheduleOptionFocus(index: number): void {
    this.pendingOptionFocusIndex = index;
    this.clearOptionFocusRetry();
    const tryFocus = (): boolean => {
      // preventScroll: the component owns scroll position. A browser
      // scroll-into-view here races the virtual window's offset update and
      // corrupts scrollTop, which re-renders the window and unmounts the
      // freshly focused option.
      this.optionComponentAtIndex(index)?.focus({ preventScroll: true });
      const optionHost = this.optionHostAtIndex(index);
      return Boolean(
        optionHost && typeof document !== 'undefined' && optionHost.contains(document.activeElement),
      );
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

  private clearOptionFocusRetry(): void {
    if (typeof window !== 'undefined' && this.optionFocusRetryTimer !== undefined) {
      window.clearTimeout(this.optionFocusRetryTimer);
      this.optionFocusRetryTimer = undefined;
    }
  }

  private optionHostAtIndex(index: number): HTMLElement | undefined {
    return this.optionRefs
      ?.toArray()
      .find(optionRef => Number(optionRef.nativeElement.dataset['cxDropdownOptionIndex']) === index)?.nativeElement;
  }

  private optionComponentAtIndex(index: number): CxOptionComponent | undefined {
    const refs = this.optionRefs?.toArray() ?? [];
    const position = refs.findIndex(
      optionRef => Number(optionRef.nativeElement.dataset['cxDropdownOptionIndex']) === index,
    );
    return position >= 0 ? this.optionComponents?.toArray()[position] : undefined;
  }

  private focusCreateOption(): boolean {
    this.activeOptionIdState.set(undefined);
    this.activeCreateState.set(true);
    this.createRowComponent?.focus();
    return Boolean(this.createRowComponent);
  }

  private clearActiveOption(): void {
    this.activeOptionIdState.set(undefined);
    this.activeCreateState.set(false);
  }

  private enabledOptionIndexes(): number[] {
    return this.filteredOptions$()
      .map((option, index) => (this.isOptionDisabled(option) ? -1 : index))
      .filter(index => index >= 0);
  }

  private selectedOptionIndex(): number | undefined {
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

  private handleTypeaheadKey(event: KeyboardEvent): boolean {
    if (
      this.searchEnabled$() ||
      event.key.length !== 1 ||
      event.key.trim().length === 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
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
  private handleSearchTypeaheadKey(event: KeyboardEvent, field?: HTMLElement): boolean {
    if (
      !this.searchEnabled$() ||
      event.key.length !== 1 ||
      event.key.trim().length === 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
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

  private commitActiveOption(): boolean {
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

  private commitSearchSelection(): void {
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

  private focusTypeaheadMatch(lastKey: string): void {
    // Extending a multi-character query must keep the option that already
    // matches it. Starting after that option would cycle to a longer sibling
    // (for example `check-square` after `check`) on the final keystroke.
    const activeOption = this.filteredOptions$().find(
      option => option.id === this.activeOptionIdState(),
    );
    if (
      this.typeaheadBuffer.length > 1 &&
      activeOption &&
      activeOption.label.toLocaleLowerCase().startsWith(this.typeaheadBuffer)
    ) {
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

  private focusMatchingOption(query: string): boolean {
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

  private currentFocusedOptionIndex(): number {
    if (typeof document === 'undefined') {
      return -1;
    }
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return -1;
    }
    const optionHost = activeElement.closest<HTMLElement>('[data-cx-dropdown-option-index]');
    const index = Number(optionHost?.dataset['cxDropdownOptionIndex']);
    return Number.isFinite(index) ? index : -1;
  }

  private updateOptionsViewport(scroller = this.optionsScrollerRef?.nativeElement): void {
    if (!scroller) {
      return;
    }
    this.optionsViewportHeightState.set(scroller.clientHeight);
    this.scrollTopState.set(scroller.scrollTop);
    this.scheduleOptionHeightMeasurement();
  }

  private maybeEmitLoadMore(scroller = this.optionsScrollerRef?.nativeElement): void {
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

  private measureOverlay(rect: DOMRect, viewport: CxFloatingSurfaceViewport): CxFloatingSurfaceRequest {
    const viewportMaxWidth = Math.max(viewport.width - 16, 0);
    // Floor only: the surface grows to its content between this floor and the
    // popover's max-width cap; the controller measures and locks the result.
    const minWidth = Math.floor(Math.min(Math.max(rect.width, CX_DROPDOWN_POPOVER_MIN_WIDTH), viewportMaxWidth));
    const optionHeight = this.optionHeightState();
    const searchHeight = this.searchEnabled$() ? 60 : 0;
    const createHeight = this.creatableState() && !this.loading ? optionHeight : 0;
    const loadingMoreHeight = this.loadingMoreState() ? optionHeight : 0;
    const stateHeight = this.loading || this.filteredOptions$().length === 0 ? 156 : 0;
    const estimatedContentHeight = Math.min(
      searchHeight +
        createHeight +
        loadingMoreHeight +
        Math.max(this.rows$().length, 1) * optionHeight +
        stateHeight,
      CX_DROPDOWN_POPOVER_MAX_HEIGHT,
    );
    const estimatedHeight = estimatedContentHeight + CX_DROPDOWN_POPOVER_FRAME_HEIGHT;
    return {
      width: minWidth,
      minWidth,
      estimatedHeight,
      align: 'start',
      maxHeightCap: estimatedHeight,
    };
  }

  private translation(key: Exclude<keyof CxDropdownTranslations, 'selectedCount'>): string {
    const value = this.translationsState()[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return CX_DROPDOWN_DEFAULT_TRANSLATIONS[key];
  }

  private formatSelectedCount(count: number): string {
    const translation = this.translationsState().selectedCount;
    if (typeof translation === 'function') {
      return translation(count);
    }
    const pattern =
      typeof translation === 'string' && translation.trim()
        ? translation.trim()
        : CX_DROPDOWN_DEFAULT_TRANSLATIONS.selectedCount;
    return pattern.replace(/\{count\}/g, `${count}`);
  }

  private normalizeSelectedValues(value: string[] | undefined): string[] {
    return [...new Set(value ?? [])];
  }

  private scheduleSelectionDisplayMeasurement(): void {
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

  private syncSelectionResizeObserver(): void {
    const valueElement = this.valueTextRef?.nativeElement;
    if (
      !valueElement ||
      !this.isMultiple$() ||
      this.selectedOptions$().length === 0 ||
      typeof ResizeObserver === 'undefined'
    ) {
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

  private startOpenTracking(): void {
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

  private stopOpenTracking(): void {
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

  private readonly onOpenDocumentPointerDown = (event: PointerEvent): void => {
    this.onDocumentPointerDown(event);
  };

  private readonly onOpenWindowResize = (): void => {
    this.onWindowResize();
  };

  private updateSelectionDisplayMode(): void {
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

  private scheduleOptionHeightMeasurement(): void {
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

  private updateOptionHeight(): void {
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

  private scheduleRequiredValueValidation(): void {
    if (this.requiredValueValidationQueued) {
      return;
    }
    this.requiredValueValidationQueued = true;
    queueMicrotask(() => {
      this.requiredValueValidationQueued = false;
      this.validateRequiredValueState();
    });
  }

  private rememberSelectedOptions(): void {
    const selectedIds = new Set<string>(this.selectedValuesState());
    const selectedValue = this.selectedValueState();
    if (selectedValue) {
      selectedIds.add(selectedValue);
    }
    const known = this.knownSelectedOptionsState();
    const next = new Map<string, CxDropdownOption>();
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

  private validateRequiredValueState(): void {
    const hasInvalidValue = this.hasInvalidSelectedValue();
    if (!hasInvalidValue) {
      this.reportedInvalidValue = false;
      return;
    }
    if (this.reportedInvalidValue) {
      return;
    }
    this.reportedInvalidValue = true;
    console.error(
      `[cx-dropdown] Selected value is not available (${this.validationTargetLabel()}). Provide a value/values entry that exists in availableValues.`,
    );
  }

  private hasInvalidSelectedValue(): boolean {
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
    return Boolean(value) && !optionIds.has(value!);
  }

  private validationTargetLabel(): string {
    return this.labelText$() || this.ariaLabel?.trim() || 'unlabelled dropdown';
  }

  private selectPlaceholderSubject(): string {
    const label = this.labelText$() || this.ariaLabel?.trim() || '';
    if (!label) {
      return '';
    }
    if (label === label.toUpperCase()) {
      return label;
    }
    return label.charAt(0).toLowerCase() + label.slice(1);
  }

  private focusSearchInput(): void {
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
}
