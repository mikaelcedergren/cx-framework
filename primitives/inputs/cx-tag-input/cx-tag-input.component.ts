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
import { CxDialogComponent } from '../../overlay/cx-dialog';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxInputComponent } from '../cx-input';
import {
  CxColorPickerComponent,
  type CxColorPickerOption,
  type CxColorPickerValue,
} from '../cx-color-picker';
import { CxOptionComponent } from '../../overlay/cx-option';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import {
  CX_TAG_COLOR_PICKER_OPTIONS,
  CxTagComponent,
  type CxTagColor,
} from '../../display/cx-tag';
import { CxIconComponent } from '../../media/cx-icon';
import { measureCxFloatingSurface } from '../../overlay/floating-surface';
import {
  type CxFieldSize,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxTagInputTag = {
  id: string;
  name: string;
  key?: string;
  color?: string;
};

type CxTagPickerColor = Extract<CxTagColor, CxColorPickerValue>;

@Component({
  selector: 'cx-tag-input',
  imports: [
    CxColorPickerComponent,
    CxDialogComponent,
    CxIconComponent,
    CxInputComponent,
    CxOptionComponent,
    CxPopoverComponent,
    CxTagComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-tag-input.component.html',
  styleUrl: './cx-tag-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTagInputComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly tagsState = signal<CxTagInputTag[]>([]);
  private readonly selectedIdsState = signal<string[]>([]);
  private readonly errorMessageState = signal<string | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private readonly emptyTextState = signal('');
  private readonly searchQueryState = signal('');
  private readonly openState = signal(false);
  private readonly createDialogOpenState = signal(false);
  private readonly draftKeyState = signal('');
  private readonly draftValueState = signal('');
  private readonly draftColorState = signal<CxTagPickerColor>('violet');
  private readonly draftKeyErrorState = signal<string | undefined>(undefined);
  protected readonly colorPickerOptions: readonly CxColorPickerOption[] = CX_TAG_COLOR_PICKER_OPTIONS.map(color => ({
    value: color as CxTagPickerColor,
    label: this.toColorLabel(color),
  }));
  private readonly overlayWidthState = signal<number | undefined>(undefined);
  private readonly overlayMaxHeightState = signal<number | undefined>(undefined);
  private readonly overlayLeftState = signal<number | undefined>(undefined);
  private readonly overlayTopState = signal<number | undefined>(undefined);
  private readonly overlayBottomState = signal<number | undefined>(undefined);
  private readonly activePlacementState = signal<'bottom' | 'top'>('bottom');
  private fieldElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private searchFocusTimer?: number;
  protected readonly labelId = `cx-tag-input-label-${CxTagInputComponent.nextId}`;
  protected readonly messagesId = `cx-tag-input-messages-${CxTagInputComponent.nextId}`;
  protected readonly popoverId = `cx-tag-input-popover-${CxTagInputComponent.nextId++}`;

  @ViewChild('fieldButton', { read: ElementRef })
  private fieldButtonRef?: ElementRef<HTMLElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;
  @ViewChild('searchInput')
  private searchInputRef?: CxInputComponent;

  @Input() label = 'Tags';
  @Input() ariaLabel: string | undefined;
  @Input() ariaDescribedBy: string | undefined;
  @Input() placeholder = '';
  @Input() optional = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() size: CxFieldSize = 'default';
  @Input() searchable = false;
  @Input() hint: string | undefined;

  @Input()
  public set tags(value: CxTagInputTag[] | null | undefined) {
    this.tagsState.set((value ?? []).map(tag => this.normalizeTag(tag)));
  }

  @Input()
  public set values(value: string[] | null | undefined) {
    this.selectedIdsState.set(this.normalizeSelectedIds(value));
  }

  @Input()
  public set errorMessage(value: string | undefined) {
    this.errorMessageState.set(value);
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set emptyText(value: string | null | undefined) {
    this.emptyTextState.set(value ?? '');
  }

  @Output() readonly valuesChange = new EventEmitter<string[]>();
  @Output() readonly tagsChange = new EventEmitter<CxTagInputTag[]>();
  @Output() readonly createTag = new EventEmitter<CxTagInputTag>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly createDialogOpen$ = this.createDialogOpenState.asReadonly();
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidationMessages(this.validationMessagesState(), this.errorMessageState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly isInteractive$ = () => !this.disabled && !this.loading && !this.readOnly;
  protected readonly overlayWidth$ = this.overlayWidthState.asReadonly();
  protected readonly overlayMaxHeight$ = this.overlayMaxHeightState.asReadonly();
  protected readonly overlayLeft$ = this.overlayLeftState.asReadonly();
  protected readonly overlayTop$ = this.overlayTopState.asReadonly();
  protected readonly overlayBottom$ = this.overlayBottomState.asReadonly();
  protected readonly activePlacement$ = this.activePlacementState.asReadonly();
  protected readonly selectedTags$ = computed(() => {
    const tagsById = new Map(this.tagsState().map(tag => [tag.id, tag]));
    return this.selectedIdsState()
      .map(tagId => tagsById.get(tagId))
      .filter((tag): tag is CxTagInputTag => !!tag);
  });
  protected readonly filteredTags$ = computed(() => {
    const query = this.searchQueryState().trim().toLowerCase();
    if (!query) {
      return this.tagsState();
    }
    return this.tagsState().filter(tag => {
      const haystack = `${tag.name} ${tag.key ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  });
  protected readonly showPlaceholder$ = computed(
    () => this.selectedTags$().length === 0 && this.placeholder.trim().length > 0,
  );
  protected readonly hasClear$ = computed(
    () => this.clearable && this.selectedTags$().length > 0 && this.isInteractive$(),
  );
  protected readonly emptyText$ = computed(() => this.emptyTextState().trim() || 'No options');
  protected readonly createActionLabel = 'Create tag';
  protected readonly createDialogHeading = 'Create tag';
  protected readonly createDialogDescription = 'Add a tag name, optional key, and tag color.';
  protected readonly createDialogPrimaryLabel = 'Create';
  protected readonly createDialogSecondaryLabel = 'Cancel';
  protected readonly draftKey$ = this.draftKeyState.asReadonly();
  protected readonly draftValue$ = this.draftValueState.asReadonly();
  protected readonly draftColor$ = this.draftColorState.asReadonly();
  protected readonly draftKeyError$ = this.draftKeyErrorState.asReadonly();

  protected get resolvedFieldAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    if (this.label.trim()) {
      return undefined;
    }
    return this.placeholder.trim() || 'Tags';
  }

  protected get resolvedFieldAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
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

  public ngAfterViewInit(): void {
    this.fieldElement = this.fieldButtonRef?.nativeElement;
    this.syncPopoverMetrics();
    const field = this.fieldElement;
    if (!field || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.openState()) {
        this.syncPopoverMetrics();
      }
    });
    this.resizeObserver.observe(field);
  }

  public ngOnDestroy(): void {
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
      this.closePopover();
      return;
    }
    this.fieldElement = field ?? this.fieldElement;
    this.openState.set(true);
    queueMicrotask(() => {
      this.syncPopoverMetrics();
      this.focusSearchInput();
    });
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
      this.fieldElement = field ?? this.fieldElement;
      this.openState.set(true);
      queueMicrotask(() => {
        this.syncPopoverMetrics();
        this.focusSearchInput();
      });
      return;
    }
    if (event.key === 'Escape') {
      this.closePopover();
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQueryState.set(value);
    if (this.openState()) {
      queueMicrotask(() => {
        this.syncPopoverMetrics();
      });
    }
  }

  protected isTagSelected(tagId: string): boolean {
    return this.selectedIdsState().includes(tagId);
  }

  protected toggleTag(tagId: string): void {
    if (!this.isInteractive$()) {
      return;
    }
    const currentSelectedIds = this.selectedIdsState();
    const nextSelectedIds = currentSelectedIds.includes(tagId)
      ? currentSelectedIds.filter(selectedId => selectedId !== tagId)
      : [...currentSelectedIds, tagId];
    this.selectedIdsState.set(nextSelectedIds);
    this.valuesChange.emit(nextSelectedIds);
  }

  protected removeTag(tagId: string): void {
    if (!this.isInteractive$()) {
      return;
    }
    const nextSelectedIds = this.selectedIdsState().filter(selectedId => selectedId !== tagId);
    this.selectedIdsState.set(nextSelectedIds);
    this.valuesChange.emit(nextSelectedIds);
  }

  protected formatTagText(tag: CxTagInputTag): string {
    return tag.name;
  }

  protected formatTagInfo(tag: CxTagInputTag): string | undefined {
    const trimmedKey = tag.key?.trim();
    return trimmedKey || undefined;
  }

  protected formatOptionLabel(tag: CxTagInputTag): string {
    const trimmedKey = tag.key?.trim();
    return trimmedKey ? `${tag.name}: ${trimmedKey}` : tag.name;
  }

  protected toTagColor(color: string | undefined): CxTagColor {
    switch (color) {
      case 'blue':
      case 'cyan':
      case 'green':
      case 'orange':
      case 'pink':
      case 'purple':
      case 'red':
      case 'tangerine':
      case 'violet':
      case 'yellow':
        return color;
      default:
        return 'default';
    }
  }

  protected openCreateDialog(): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.closePopover();
    this.resetDraftTag();
    this.createDialogOpenState.set(true);
  }

  protected onCreateDialogOpenChange(open: boolean): void {
    this.createDialogOpenState.set(open);
    if (!open) {
      this.resetDraftTag();
    }
  }

  protected clearSelected(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.hasClear$()) {
      return;
    }
    this.selectedIdsState.set([]);
    this.valuesChange.emit([]);
    this.clear.emit();
  }

  protected onDraftKeyChange(value: string): void {
    this.draftKeyState.set(value);
    if (value.trim()) {
      this.draftKeyErrorState.set(undefined);
    }
  }

  protected onDraftValueChange(value: string): void {
    this.draftValueState.set(value);
  }

  protected onDraftColorChange(color: CxColorPickerValue | undefined): void {
    this.draftColorState.set(this.isTagColor(color) ? color : 'violet');
  }

  protected confirmCreateTag(): void {
    const trimmedName = this.draftKeyState().trim();
    const trimmedKey = this.draftValueState().trim();
    if (!trimmedName) {
      this.draftKeyErrorState.set('Name is required.');
      return;
    }

    const existingTag = this.findExistingTag(trimmedName, trimmedKey || undefined);
    if (existingTag) {
      this.ensureSelected(existingTag.id);
      this.createDialogOpenState.set(false);
      this.resetDraftTag();
      return;
    }

    const nextTag: CxTagInputTag = {
      id: this.createTagId(trimmedName, trimmedKey),
      name: trimmedName,
      key: trimmedKey || undefined,
      color: this.draftColorState(),
    };
    const nextTags = [...this.tagsState(), nextTag];
    this.tagsState.set(nextTags);
    this.tagsChange.emit(nextTags);
    this.ensureSelected(nextTag.id);
    this.createTag.emit(nextTag);
    this.createDialogOpenState.set(false);
    this.resetDraftTag();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.openState()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node) || !this.host.nativeElement.contains(target)) {
      this.closePopover();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.syncPopoverMetrics();
    }
  }

  protected closePopover(): void {
    this.searchQueryState.set('');
    this.openState.set(false);
  }

  private syncPopoverMetrics(): void {
    const field = this.fieldElement;
    if (!field || typeof window === 'undefined') {
      return;
    }

    const rect = field.getBoundingClientRect();
    const minWidth = Math.floor(Math.min(Math.max(rect.width, 320), window.innerWidth - 16));
    const popoverSurface = this.popoverRef?.surfaceElement();
    const measuredWidth = popoverSurface
      ? Math.ceil(popoverSurface.getBoundingClientRect().width)
      : minWidth;
    const estimatedHeight = Math.min(
      (this.searchable ? 60 : 0) + Math.max(this.tagsState().length, 1) * 48 + 48,
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

  private focusSearchInput(): void {
    if (!this.searchable) {
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

  private normalizeSelectedIds(value: string[] | null | undefined): string[] {
    return [...new Set(value ?? [])];
  }

  private normalizeTag(tag: CxTagInputTag): CxTagInputTag {
    return {
      id: tag.id,
      name: tag.name.trim(),
      key: tag.key?.trim() || undefined,
      color: tag.color?.trim() || undefined,
    };
  }

  private isTagColor(color: CxColorPickerValue | undefined): color is CxTagPickerColor {
    return !!color && (CX_TAG_COLOR_PICKER_OPTIONS as readonly string[]).includes(color);
  }

  private toColorLabel(color: CxTagColor): string {
    return color.charAt(0).toUpperCase() + color.slice(1);
  }

  private ensureSelected(tagId: string): void {
    if (this.selectedIdsState().includes(tagId)) {
      return;
    }
    const nextSelectedIds = [...this.selectedIdsState(), tagId];
    this.selectedIdsState.set(nextSelectedIds);
    this.valuesChange.emit(nextSelectedIds);
  }

  private findExistingTag(name: string, key: string | undefined): CxTagInputTag | undefined {
    const normalizedName = name.trim().toLowerCase();
    const normalizedKey = key?.trim().toLowerCase() || '';
    return this.tagsState().find(tag => {
      const tagName = tag.name.trim().toLowerCase();
      const tagKey = tag.key?.trim().toLowerCase() || '';
      return tagName === normalizedName && tagKey === normalizedKey;
    });
  }

  private createTagId(name: string, key: string): string {
    const baseId = `${name}-${key}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tag';
    let nextId = baseId;
    let suffix = 2;
    const existingIds = new Set(this.tagsState().map(tag => tag.id));
    while (existingIds.has(nextId)) {
      nextId = `${baseId}-${suffix}`;
      suffix += 1;
    }
    return nextId;
  }

  private resetDraftTag(): void {
    this.draftKeyState.set('');
    this.draftValueState.set('');
    this.draftColorState.set('violet');
    this.draftKeyErrorState.set(undefined);
  }
}
