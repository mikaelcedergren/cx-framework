import {
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
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxInputComponent } from '../cx-input';
import { CxIconComponent } from '../../media/cx-icon';
import { CxOptionComponent } from '../../overlay/cx-option';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { measureCxFloatingSurface } from '../../overlay/floating-surface';
import { type CxIconName } from '../../../icons/manifest';
import {
  type CxFieldSize,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxSelectOption = {
  id: string;
  label: string;
  description?: string;
  icon?: CxIconName;
  disabled?: boolean;
};

export type CxSelectMode = 'single' | 'multiple' | 'combobox' | 'creatable';
export type CxSelectSize = CxFieldSize;
export type CxSelectVariant = 'default' | 'transparent' | 'inline-edit';

const CX_SELECT_SEARCH_THRESHOLD = 32;

@Component({
  selector: 'cx-select',
  imports: [
    CommonModule,
    CxValidationMessageComponent,
    CxIconComponent,
    CxInputComponent,
    CxOptionComponent,
    CxPopoverComponent,
    CxSpinnerComponent,
  ],
  templateUrl: './cx-select.component.html',
  styleUrl: './cx-select.component.scss',
  host: {
    '[class.cx-select-host--small]': 'size === "small"',
    '[class.cx-select-host--large]': 'size === "large"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSelectComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private fieldElement?: HTMLElement;
  private readonly optionsState = signal<CxSelectOption[]>([]);
  private readonly multipleState = signal(false);
  private readonly modeState = signal<CxSelectMode>('single');
  private readonly selectedValueState = signal<string | undefined>(undefined);
  private readonly selectedValuesState = signal<string[]>([]);
  private readonly displayValueState = signal<string | undefined>(undefined);
  private readonly placeholderState = signal('');
  private readonly emptyTextState = signal('No options');
  private readonly errorMessageState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private readonly searchQueryState = signal('');
  private readonly openState = signal(false);
  private readonly overlayWidthState = signal<number | undefined>(undefined);
  private readonly overlayMaxHeightState = signal<number | undefined>(undefined);
  private readonly overlayLeftState = signal<number | undefined>(undefined);
  private readonly overlayTopState = signal<number | undefined>(undefined);
  private readonly overlayBottomState = signal<number | undefined>(undefined);
  private readonly activePlacementState = signal<'bottom' | 'top'>('bottom');
  private resizeObserver?: ResizeObserver;
  private searchFocusTimer?: number;
  protected readonly labelId = `cx-select-label-${CxSelectComponent.nextId}`;
  protected readonly messagesId = `cx-select-messages-${CxSelectComponent.nextId}`;
  protected readonly popoverId = `cx-select-popover-${CxSelectComponent.nextId++}`;

  @ViewChild('fieldButton', { read: ElementRef })
  private fieldButtonRef?: ElementRef<HTMLElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;
  @ViewChild('searchInput')
  private searchInputRef?: CxInputComponent;

  protected readonly selectedOption$ = computed(() =>
    this.optionsState().find((option) => option.id === this.selectedValueState()),
  );
  protected readonly selectedOptions$ = computed(() => {
    const selectedValues = this.selectedValuesState();
    if (!this.multipleState()) {
      const selectedOption = this.selectedOption$();
      return selectedOption ? [selectedOption] : [];
    }
    return this.optionsState().filter(option => selectedValues.includes(option.id));
  });
  protected readonly displayValueText$ = computed(() => this.displayValueState()?.trim() || undefined);
  protected readonly selectedRawValueText$ = computed(() => {
    const value = this.selectedValueState()?.trim();
    return this.modeState() === 'creatable' && value ? value : undefined;
  });
  protected readonly placeholderText$ = computed(() => this.placeholderState().trim());
  protected readonly emptyText$ = computed(() => this.emptyTextState().trim() || 'No options');
  protected readonly displayText$ = computed(() => {
    if (this.multipleState()) {
      const selectedLabels = this.selectedOptions$().map(option => option.label);
      if (selectedLabels.length > 0) {
        return selectedLabels.join(', ');
      }
    }
    return this.selectedOption$()?.label || this.selectedRawValueText$() || this.displayValueText$() || this.placeholderText$();
  });
  protected readonly showPlaceholder$ = computed(() => {
    if (this.multipleState()) {
      return this.selectedOptions$().length === 0 && !this.displayValueText$();
    }
    return !this.selectedOption$() && !this.displayValueText$();
  });
  protected readonly filteredOptions$ = computed(() => {
    if (!this.searchEnabled$()) {
      return this.optionsState();
    }
    const query = this.searchQueryState().trim().toLowerCase();
    if (!query) {
      return this.optionsState();
    }
    return this.optionsState().filter((option) => {
      const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  });
  protected readonly labelText$ = computed(() => {
    const trimmedLabel = this.label.trim();
    return trimmedLabel || '';
  });
  protected readonly searchEnabled$ = computed(
    () => this.modeState() === 'combobox' || this.modeState() === 'creatable' || this.optionsState().length > CX_SELECT_SEARCH_THRESHOLD,
  );

  @Input() label = 'Severity';
  @Input() ariaLabel: string | undefined;
  @Input() ariaDescribedBy: string | undefined;
  @Input() variant: CxSelectVariant = 'default';
  @Input() grow = false;
  @Input()
  public set placeholder(value: string | undefined) {
    this.placeholderState.set(value ?? '');
  }
  @Input()
  public set emptyText(value: string | undefined) {
    this.emptyTextState.set(value ?? 'No options');
  }
  @Input() size: CxSelectSize = 'default';
  @Input() optional = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() icon: CxIconName | undefined;
  @Input() discreet = false;
  @Input() inline = false;
  @Input()
  public set mode(value: CxSelectMode | undefined) {
    const nextMode = this.normalizeMode(value);
    this.modeState.set(nextMode);
    this.multipleState.set(nextMode === 'multiple');
    if (!this.searchEnabled$()) {
      this.searchQueryState.set('');
    }
  }
  @Input() hint: string | undefined;
  @Input()
  public set errorMessage(value: string | undefined) {
    this.errorMessageState.set(value);
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }
  @Input()
  public set availableValues(value: CxSelectOption[]) {
    const nextOptions = value ?? [];
    this.optionsState.set(nextOptions);
    if (!this.searchEnabled$()) {
      this.searchQueryState.set('');
    }
  }

  protected options$ = this.optionsState.asReadonly();

  @Input()
  public set value(value: string | undefined) {
    this.selectedValueState.set(value);
  }

  @Input()
  public set values(value: string[] | undefined) {
    this.selectedValuesState.set(this.normalizeSelectedValues(value));
  }

  @Input()
  public set displayValue(value: string | undefined) {
    this.displayValueState.set(value);
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
  @Output() readonly valuesChange = new EventEmitter<string[]>();
  @Output() readonly focusChange = new EventEmitter<boolean>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly displayValue$ = this.displayValueState.asReadonly();
  protected readonly searchQuery$ = this.searchQueryState.asReadonly();
  protected readonly mode$ = this.modeState.asReadonly();
  protected readonly multiple$ = this.multipleState.asReadonly();
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidationMessages(this.validationMessagesState(), this.errorMessageState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly isInteractive$ = () => !this.disabled && !this.loading && !this.readOnly;
  protected readonly hasClear$ = () =>
    this.clearable &&
    this.isInteractive$() &&
    (this.selectedOptions$().length > 0 || !!this.displayValueState() || !!this.selectedRawValueText$());
  protected readonly overlayWidth$ = this.overlayWidthState.asReadonly();
  protected readonly overlayMaxHeight$ = this.overlayMaxHeightState.asReadonly();
  protected readonly overlayLeft$ = this.overlayLeftState.asReadonly();
  protected readonly overlayTop$ = this.overlayTopState.asReadonly();
  protected readonly overlayBottom$ = this.overlayBottomState.asReadonly();
  protected readonly activePlacement$ = this.activePlacementState.asReadonly();

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
    const external = this.ariaDescribedBy?.trim();
    if (external) {
      ids.push(external);
    }
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.push(this.messagesId);
    }
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  ngAfterViewInit(): void {
    this.fieldElement = this.fieldButtonRef?.nativeElement;
    this.syncPopoverMetrics();
    const field = this.fieldElement;
    if (!field || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.syncPopoverMetrics();
    });
    this.resizeObserver.observe(field);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (typeof window !== 'undefined' && this.searchFocusTimer) {
      window.clearTimeout(this.searchFocusTimer);
    }
  }

  protected toggleOpen(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (this.openState()) {
      this.openState.set(false);
      return;
    }
    this.fieldElement = field ?? this.fieldElement;
    this.openState.set(true);
    queueMicrotask(() => {
      this.syncPopoverMetrics(field);
      this.focusSearchInput();
    });
  }

  protected selectOption(option: CxSelectOption): void {
    if (!this.isInteractive$() || option.disabled) {
      return;
    }
    if (this.multipleState()) {
      const currentValues = this.selectedValuesState();
      const isSelected = currentValues.includes(option.id);
      if (!isSelected && this.isOptionDisabled(option)) {
        return;
      }
      const nextValues = isSelected
        ? currentValues.filter(selectedValue => selectedValue !== option.id)
        : [...currentValues, option.id];
      this.selectedValuesState.set(nextValues);
      this.valuesChange.emit(nextValues);
      return;
    }
    this.selectedValueState.set(option.id);
    this.valueChange.emit(option.id);
    this.searchQueryState.set('');
    this.openState.set(false);
  }

  protected isOptionSelected(optionId: string): boolean {
    if (this.multipleState()) {
      return this.selectedValuesState().includes(optionId);
    }
    return this.selectedOption$()?.id === optionId;
  }

  protected isOptionDisabled(option: CxSelectOption): boolean {
    return option.disabled === true;
  }

  protected onFieldKeydown(event: KeyboardEvent, field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleOpen(field);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.syncPopoverMetrics(field);
      this.openState.set(true);
      queueMicrotask(() => {
        this.focusSearchInput();
      });
      return;
    }
    if (event.key === 'Escape') {
      this.searchQueryState.set('');
      this.openState.set(false);
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQueryState.set(value);
    if (this.modeState() === 'creatable') {
      const nextValue = value.trim() ? value : undefined;
      this.selectedValueState.set(nextValue);
      this.valueChange.emit(nextValue);
    }
    if (this.openState()) {
      queueMicrotask(() => {
        this.syncPopoverMetrics();
      });
    }
  }

  protected closePopover(): void {
    this.searchQueryState.set('');
    this.openState.set(false);
  }

  protected clearSelection(event: MouseEvent): void {
    if (!this.hasClear$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (this.multipleState()) {
      this.selectedValuesState.set([]);
      this.valuesChange.emit([]);
    } else {
      this.selectedValueState.set(undefined);
      this.displayValueState.set(undefined);
      this.valueChange.emit(undefined);
    }
    this.searchQueryState.set('');
    this.openState.set(false);
    this.clear.emit();
  }

  protected onFocusChange(focused: boolean): void {
    this.focusChange.emit(focused);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
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
    // of the cx-select host. Treat clicks inside the surface as "inside" too —
    // otherwise WebKit closes the popover on pointerdown, the option is gone
    // by pointerup, and no click ever reaches selectOption.
    const surface = this.popoverRef?.surfaceElement();
    if (surface && surface.contains(target)) {
      return;
    }
    this.closePopover();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (!this.openState()) {
      return;
    }
    this.syncPopoverMetrics();
  }

  private syncPopoverMetrics(field?: HTMLElement): void {
    if (field) {
      this.fieldElement = field;
    }
    const activeField = this.fieldElement;
    if (!activeField || typeof window === 'undefined') {
      return;
    }

    const rect = activeField.getBoundingClientRect();
    const minWidth = Math.floor(Math.min(rect.width, window.innerWidth - 16));
    const popoverSurface = this.popoverRef?.surfaceElement();
    const measuredWidth = popoverSurface
      ? Math.ceil(popoverSurface.getBoundingClientRect().width)
      : minWidth;
    const searchHeight = this.searchEnabled$() ? 60 : 0;
    const estimatedHeight = Math.min(
      searchHeight + Math.max(this.optionsState().length, 1) * 48,
      360,
    );
    const surface = measureCxFloatingSurface({
      triggerRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      width: measuredWidth,
      minWidth,
      estimatedHeight,
      align: 'start',
    });

    this.overlayWidthState.set(surface.width);
    this.overlayMaxHeightState.set(surface.maxHeight);
    this.overlayLeftState.set(surface.left);
    this.overlayTopState.set(surface.top);
    this.overlayBottomState.set(surface.bottom);
    this.activePlacementState.set(surface.placement);
  }

  private normalizeSelectedValues(value: string[] | undefined): string[] {
    return [...new Set(value ?? [])];
  }

  private normalizeMode(value: CxSelectMode | undefined): CxSelectMode {
    return value === 'multiple' || value === 'combobox' || value === 'creatable' ? value : 'single';
  }

  private focusSearchInput(): void {
    if (!this.searchEnabled$()) {
      return;
    }
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
