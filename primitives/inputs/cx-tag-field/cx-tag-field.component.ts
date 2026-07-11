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
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts';
import {
  CX_TAG_COLORS,
  CX_TAG_COLOR_PICKER_OPTIONS,
  CxTagComponent,
  type CxTagColor,
} from '../../display/cx-tag';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxIconComponent } from '../../media/cx-icon';
import { CxColorPickerComponent, type CxColorPickerColor } from '../cx-color-picker';
import { CxTextFieldComponent } from '../cx-text-field';
import { CxDialogComponent } from '../../overlay/cx-dialog';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../overlay/floating-surface-controller';
import { CxOptionComponent } from '../../overlay/cx-option';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import {
  type CxFieldValidation,
  type CxFieldSize,
  normalizeCxValidation,
} from '../shared/field.types';

export type CxTagFieldTag = {
  id: string;
  name: string;
  key?: string;
  color?: CxTagColor;
};

type CxTagPickerColor = Extract<CxTagColor, CxColorPickerColor>;
type CxTagFieldOpenTarget = 'first' | 'last' | 'keep';
const CX_TAG_FIELD_CREATE_SHORTCUT = ['Mod', 'Enter'] as const;

@Component({
  selector: 'cx-tag-field',
  imports: [
    CxColorPickerComponent,
    CxDialogComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxOptionComponent,
    CxPopoverComponent,
    CxSpinnerComponent,
    CxTagComponent,
    CxTextFieldComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-tag-field.component.html',
  styleUrl: './cx-tag-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTagFieldComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly instanceId = ++CxTagFieldComponent.nextId;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly tagsState = signal<readonly CxTagFieldTag[]>([]);
  private readonly selectedIdsState = signal<readonly string[]>([]);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly emptyTextState = signal('');
  private readonly queryState = signal('');
  private readonly openState = signal(false);
  private readonly activeTargetState = signal<string | undefined>(undefined);
  private readonly statusState = signal('');
  private readonly createDialogOpenState = signal(false);
  private readonly draftNameState = signal('');
  private readonly draftKeyState = signal('');
  private readonly draftColorState = signal<CxTagPickerColor>('violet');
  private readonly draftNameErrorState = signal<string | undefined>(undefined);
  private disabledState = false;
  private loadingState = false;
  private focusTimer?: number;
  private dialogFocusTimer?: number;

  protected readonly inputId = `cx-tag-field-input-${this.instanceId}`;
  protected readonly labelId = `cx-tag-field-label-${this.instanceId}`;
  protected readonly messagesId = `cx-tag-field-messages-${this.instanceId}`;
  protected readonly statusId = `cx-tag-field-status-${this.instanceId}`;
  protected readonly listboxId = `cx-tag-field-listbox-${this.instanceId}`;
  protected readonly popoverId = `cx-tag-field-popover-${this.instanceId}`;
  protected readonly createOptionId = `cx-tag-field-create-${this.instanceId}`;
  protected readonly popoverMaxWidth = 360;
  protected readonly createShortcutParts = CX_TAG_FIELD_CREATE_SHORTCUT;
  protected readonly createShortcutAria = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
    ? 'Meta+Enter'
    : 'Control+Enter';

  @ViewChild('fieldShell', { read: ElementRef })
  private fieldShellRef?: ElementRef<HTMLElement>;
  @ViewChild('tagField', { read: ElementRef })
  private inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;
  @ViewChild('draftNameInput')
  private draftNameInputRef?: CxTextFieldComponent;
  @ViewChildren('selectedTagRemove', { read: ElementRef })
  private selectedTagRemoveRefs?: QueryList<ElementRef<HTMLButtonElement>>;

  protected readonly overlay = new CxFloatingSurfaceController(
    (rect, viewport) => this.measureOverlay(rect, viewport),
    () => this.popoverRef?.surfaceElement(),
  );

  @Input() label = 'Tags';
  @Input() ariaLabel: string | undefined;
  @Input() placeholder = '';
  @Input() optional = false;
  @Input() clearable = false;
  @Input() size: CxFieldSize = 'default';
  @Input() hint: string | undefined;

  @Input()
  public set disabled(value: boolean) {
    this.disabledState = Boolean(value);
    if (this.disabledState) {
      this.lockInteractions();
    }
  }
  public get disabled(): boolean {
    return this.disabledState;
  }

  @Input()
  public set loading(value: boolean) {
    this.loadingState = Boolean(value);
    if (this.loadingState) {
      this.lockInteractions();
    }
  }
  public get loading(): boolean {
    return this.loadingState;
  }

  @Input()
  public set tags(value: readonly CxTagFieldTag[] | null | undefined) {
    this.tagsState.set(this.normalizeTags(value ?? []));
    this.syncActiveTarget('keep');
    this.overlay.resetMeasurement();
  }

  @Input()
  public set values(value: readonly string[] | null | undefined) {
    this.selectedIdsState.set(this.normalizeSelectedIds(value));
  }

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Input()
  public set emptyText(value: string | null | undefined) {
    this.emptyTextState.set(value ?? '');
  }

  @Output() readonly valuesChange = new EventEmitter<string[]>();
  @Output() readonly tagsChange = new EventEmitter<CxTagFieldTag[]>();
  @Output() readonly createTag = new EventEmitter<CxTagFieldTag>();
  @Output() readonly clear = new EventEmitter<void>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly query$ = this.queryState.asReadonly();
  protected readonly status$ = this.statusState.asReadonly();
  protected readonly createDialogOpen$ = this.createDialogOpenState.asReadonly();
  protected readonly draftName$ = this.draftNameState.asReadonly();
  protected readonly draftKey$ = this.draftKeyState.asReadonly();
  protected readonly draftColor$ = this.draftColorState.asReadonly();
  protected readonly draftNameError$ = this.draftNameErrorState.asReadonly();
  protected readonly validationMessages$ = () => this.disabled
    ? []
    : normalizeCxValidation(this.validationState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => Boolean(this.hint?.trim()) && this.validationMessages$().length === 0;
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly selectedTags$ = computed(() => {
    const tagsById = new Map(this.tagsState().map(tag => [tag.id, tag]));
    return this.selectedIdsState()
      .map(tagId => tagsById.get(tagId))
      .filter((tag): tag is CxTagFieldTag => Boolean(tag));
  });
  protected readonly filteredTags$ = computed(() => {
    const query = this.normalizedText(this.queryState());
    if (!query) {
      return this.tagsState();
    }
    return this.tagsState().filter(tag =>
      this.normalizedText(`${this.formatOptionLabel(tag)} ${tag.key ?? ''}`).includes(query),
    );
  });
  protected readonly showCreate$ = computed(() => {
    const query = this.queryState().trim();
    if (!query) {
      return true;
    }
    const normalizedQuery = this.normalizedText(query);
    return !this.tagsState().some(tag =>
      this.normalizedText(this.formatOptionLabel(tag)) === normalizedQuery,
    );
  });
  protected readonly createActionLabel$ = computed(() => {
    const query = this.queryState().trim();
    return query ? `Create “${query}”` : 'Create tag';
  });
  protected readonly navigationTargets$ = computed(() => [
    ...this.filteredTags$().map(tag => this.tagTarget(tag.id)),
    ...(this.showCreate$() ? ['create'] : []),
  ]);
  protected readonly activeDescendant$ = computed(() => {
    const target = this.activeTargetState();
    if (target === 'create') {
      return this.createOptionId;
    }
    if (!target?.startsWith('tag:')) {
      return undefined;
    }
    const tagId = target.slice(4);
    const index = this.filteredTags$().findIndex(tag => tag.id === tagId);
    return index >= 0 ? this.optionDomId(index) : undefined;
  });
  protected readonly placeholderText$ = () => this.placeholder.trim() || this.defaultPlaceholderText();
  protected readonly inputPlaceholder$ = () =>
    this.selectedTags$().length === 0 ? this.placeholderText$() : '';
  protected readonly hasClear$ = () =>
    this.clearable && this.selectedTags$().length > 0 && !this.isLocked$();
  protected readonly emptyText$ = () => {
    const explicit = this.emptyTextState().trim();
    if (explicit) {
      return explicit;
    }
    const object = this.objectLabel();
    const query = this.queryState().trim();
    return query ? `No ${object} match “${query}”` : `No ${object} available`;
  };

  protected readonly createDialogHeading = 'Create tag';
  protected readonly createDialogDescription = 'Add a name, optional key, and color.';
  protected readonly createDialogPrimaryLabel = 'Create tag';
  protected readonly createDialogSecondaryLabel = 'Cancel';

  protected get resolvedFieldAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    return this.label.trim() ? undefined : 'Tags';
  }

  protected get resolvedFieldAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
  }

  protected get resolvedFieldAriaDescribedBy(): string {
    const ids = [this.statusId];
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.unshift(this.messagesId);
    }
    return ids.join(' ');
  }

  public ngAfterViewInit(): void {
    const field = this.fieldShellRef?.nativeElement;
    this.overlay.sync(field);
    this.overlay.observeTrigger(field, () => {
      if (this.openState()) {
        this.overlay.sync();
      }
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
    }
  }

  public ngOnDestroy(): void {
    this.overlay.destroy();
    if (typeof document !== 'undefined') {
      document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
    }
    if (typeof window !== 'undefined' && this.focusTimer !== undefined) {
      window.clearTimeout(this.focusTimer);
    }
    if (typeof window !== 'undefined' && this.dialogFocusTimer !== undefined) {
      window.clearTimeout(this.dialogFocusTimer);
    }
  }

  protected optionDomId(index: number): string {
    return `cx-tag-field-option-${this.instanceId}-${index}`;
  }

  protected isTagSelected(tagId: string): boolean {
    return this.selectedIdsState().includes(tagId);
  }

  protected isTagActive(tagId: string): boolean {
    return this.activeTargetState() === this.tagTarget(tagId);
  }

  protected isCreateActive(): boolean {
    return this.activeTargetState() === 'create';
  }

  protected setActiveTag(tagId: string): void {
    this.activeTargetState.set(this.tagTarget(tagId));
  }

  protected setCreateActive(): void {
    this.activeTargetState.set('create');
  }

  protected onFieldClick(event: MouseEvent): void {
    if (this.isLocked$()) {
      return;
    }
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('button')) {
      return;
    }
    this.openPopover('keep');
    this.focusInput();
  }

  protected onInputFocus(): void {
    if (!this.isLocked$() && !this.createDialogOpenState()) {
      this.openPopover('keep');
    }
  }

  protected onInput(event: Event): void {
    if (this.isLocked$()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.queryState.set(target.value);
    this.openPopover('first');
    this.announceResults();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.isLocked$() || event.isComposing) {
      return;
    }
    if (eventMatchesShortcut(CX_TAG_FIELD_CREATE_SHORTCUT, event)) {
      event.preventDefault();
      event.stopPropagation();
      if (this.showCreate$()) {
        this.openCreateDialog();
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.openState()) {
        this.openPopover(event.key === 'ArrowDown' ? 'first' : 'last');
      } else {
        this.moveActiveTarget(event.key === 'ArrowDown' ? 1 : -1);
      }
      return;
    }
    if (
      (event.key === ' ' || event.key === 'Spacebar')
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
      && !event.shiftKey
      && this.openState()
      && !this.queryState()
      && this.activeTargetState()?.startsWith('tag:')
    ) {
      event.preventDefault();
      this.commitActiveTarget();
      return;
    }
    if (event.key === 'Enter') {
      if (!this.openState()) {
        this.openPopover('first');
        return;
      }
      event.preventDefault();
      this.commitActiveTarget();
      return;
    }
    if (event.key === 'Escape') {
      if (this.openState()) {
        event.preventDefault();
        event.stopPropagation();
        this.closePopover();
      }
      return;
    }
    if (event.key === 'Tab') {
      this.closePopover();
      return;
    }
    if (
      (event.key === 'Backspace' || event.key === 'ArrowLeft')
      && !this.queryState()
      && this.inputAtStart()
      && this.selectedTags$().length > 0
    ) {
      event.preventDefault();
      this.focusSelectedTag(this.selectedTags$().length - 1);
    }
  }

  protected onSelectedTagFocus(tag: CxTagFieldTag): void {
    this.announce(`${this.formatOptionLabel(tag)} selected. Press Backspace or Delete to remove.`);
  }

  protected onSelectedTagKeydown(event: KeyboardEvent, tag: CxTagFieldTag, index: number): void {
    if (this.isLocked$() || event.isComposing) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focusSelectedTag(Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index >= this.selectedTags$().length - 1) {
        this.focusInput();
      } else {
        this.focusSelectedTag(index + 1);
      }
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.removeTagAndFocus(tag, index);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.openState()) {
        this.closePopover();
      }
      this.focusInput();
      return;
    }
    if (this.isPrintableKey(event)) {
      event.preventDefault();
      this.queryState.set(event.key);
      this.openPopover('first');
      this.focusInput();
      this.announceResults();
    }
  }

  protected removeTagFromPointer(event: MouseEvent, tag: CxTagFieldTag): void {
    event.stopPropagation();
    this.removeTag(tag);
    this.openPopover('keep');
    this.focusInput();
  }

  protected onOptionPointerDown(event: PointerEvent): void {
    event.preventDefault();
  }

  protected toggleTag(tag: CxTagFieldTag): void {
    if (this.isLocked$()) {
      return;
    }
    const selected = this.selectedIdsState();
    const removing = selected.includes(tag.id);
    const next = removing
      ? selected.filter(id => id !== tag.id)
      : [...selected, tag.id];
    this.selectedIdsState.set(next);
    this.valuesChange.emit([...next]);
    this.queryState.set('');
    this.activeTargetState.set(this.tagTarget(tag.id));
    this.announce(`${this.formatOptionLabel(tag)} ${removing ? 'removed' : 'added'}.`);
    this.refreshPopover();
    this.focusInput();
  }

  protected openCreateDialog(): void {
    if (this.isLocked$() || !this.showCreate$()) {
      return;
    }
    this.openState.set(false);
    this.activeTargetState.set(undefined);
    this.overlay.resetMeasurement();
    this.resetDraftTag();
    this.draftNameState.set(this.queryState().trim());
    this.createDialogOpenState.set(true);
    this.focusDraftName();
  }

  protected onCreateDialogOpenChange(open: boolean): void {
    if (open) {
      this.createDialogOpenState.set(true);
      return;
    }
    this.finishCreateDialog(false);
  }

  protected onDraftNameChange(value: string): void {
    this.draftNameState.set(value);
    if (value.trim()) {
      this.draftNameErrorState.set(undefined);
    }
  }

  protected onDraftKeyChange(value: string): void {
    this.draftKeyState.set(value);
  }

  protected onDraftColorChange(color: CxColorPickerColor | undefined): void {
    this.draftColorState.set(this.isPickerColor(color) ? color : 'violet');
  }

  protected confirmCreateTag(): void {
    if (this.isLocked$()) {
      this.lockInteractions();
      return;
    }

    const name = this.draftNameState().trim();
    const key = this.draftKeyState().trim();
    if (!name) {
      this.draftNameErrorState.set('Enter a tag name.');
      this.focusDraftName();
      return;
    }

    const existing = this.findExistingTag(name, key || undefined);
    if (existing) {
      const added = this.ensureSelected(existing.id);
      this.announce(`${this.formatOptionLabel(existing)} ${added ? 'added' : 'is already selected'}.`);
      this.finishCreateDialog(true);
      return;
    }

    const nextTag: CxTagFieldTag = {
      id: this.createTagId(name, key),
      name,
      key: key || undefined,
      color: this.draftColorState(),
    };
    const nextTags = [...this.tagsState(), nextTag];
    this.tagsState.set(nextTags);
    this.tagsChange.emit([...nextTags]);
    this.ensureSelected(nextTag.id);
    this.createTag.emit(nextTag);
    this.announce(`${this.formatOptionLabel(nextTag)} created and added.`);
    this.finishCreateDialog(true);
  }

  protected clearSelected(): void {
    if (!this.hasClear$()) {
      return;
    }
    this.selectedIdsState.set([]);
    this.valuesChange.emit([]);
    this.clear.emit();
    this.announce('Tags cleared.');
    this.openPopover('first');
    this.focusInput();
  }

  protected formatOptionLabel(tag: CxTagFieldTag): string {
    const key = tag.key?.trim();
    return key ? `${tag.name}: ${key}` : tag.name;
  }

  protected toTagColor(color: CxTagColor | undefined): CxTagColor {
    return this.isTagColor(color) ? color : 'default';
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
    const surface = this.popoverRef?.surfaceElement();
    if (surface?.contains(target)) {
      return;
    }
    this.closePopover();
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
    const surface = this.popoverRef?.surfaceElement();
    if (!this.host.nativeElement.contains(target) && !surface?.contains(target)) {
      this.closePopover();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.overlay.sync();
    }
  }

  protected closePopover(): void {
    this.openState.set(false);
    this.activeTargetState.set(undefined);
    this.overlay.resetMeasurement();
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

  private openPopover(target: CxTagFieldOpenTarget): void {
    if (this.isLocked$() || this.createDialogOpenState()) {
      return;
    }
    this.overlay.setTrigger(this.fieldShellRef?.nativeElement);
    this.openState.set(true);
    this.syncActiveTarget(target);
    queueMicrotask(() => {
      this.overlay.sync();
      this.scrollActiveTargetIntoView();
    });
  }

  private moveActiveTarget(delta: 1 | -1): void {
    const targets = this.navigationTargets$();
    if (targets.length === 0) {
      this.activeTargetState.set(undefined);
      return;
    }
    const currentIndex = targets.indexOf(this.activeTargetState() ?? '');
    const nextIndex = currentIndex < 0
      ? delta === 1 ? 0 : targets.length - 1
      : (currentIndex + delta + targets.length) % targets.length;
    this.activeTargetState.set(targets[nextIndex]);
    this.scrollActiveTargetIntoView();
  }

  private commitActiveTarget(): void {
    const target = this.activeTargetState();
    if (target === 'create') {
      this.openCreateDialog();
      return;
    }
    if (!target?.startsWith('tag:')) {
      this.syncActiveTarget('first');
      return;
    }
    const tagId = target.slice(4);
    const tag = this.filteredTags$().find(item => item.id === tagId);
    if (tag) {
      this.toggleTag(tag);
    }
  }

  private syncActiveTarget(preference: CxTagFieldOpenTarget): void {
    const targets = this.navigationTargets$();
    if (targets.length === 0) {
      this.activeTargetState.set(undefined);
      return;
    }
    if (preference === 'keep' && targets.includes(this.activeTargetState() ?? '')) {
      return;
    }
    this.activeTargetState.set(preference === 'last' ? targets[targets.length - 1] : targets[0]);
  }

  private scrollActiveTargetIntoView(): void {
    queueMicrotask(() => {
      const id = this.activeDescendant$();
      if (!id) {
        return;
      }
      const option = this.popoverRef?.surfaceElement()?.querySelector<HTMLElement>(`#${id}`);
      option?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  }

  private refreshPopover(): void {
    if (!this.openState()) {
      return;
    }
    this.syncActiveTarget('keep');
    queueMicrotask(() => {
      this.overlay.resetMeasurement();
      this.overlay.sync();
      this.scrollActiveTargetIntoView();
    });
  }

  private focusInput(): void {
    if (typeof window === 'undefined') {
      queueMicrotask(() => this.inputRef?.nativeElement.focus());
      return;
    }
    if (this.focusTimer !== undefined) {
      window.clearTimeout(this.focusTimer);
    }
    this.focusTimer = window.setTimeout(() => {
      this.focusTimer = undefined;
      const input = this.inputRef?.nativeElement;
      input?.focus();
      const end = input?.value.length ?? 0;
      input?.setSelectionRange(end, end);
    }, 0);
  }

  private focusSelectedTag(index: number): void {
    const refs = this.selectedTagRemoveRefs?.toArray() ?? [];
    refs[index]?.nativeElement.focus();
  }

  private removeTagAndFocus(tag: CxTagFieldTag, index: number): void {
    this.removeTag(tag);
    queueMicrotask(() => {
      const remaining = this.selectedTags$().length;
      if (remaining === 0) {
        this.focusInput();
        return;
      }
      this.focusSelectedTag(Math.max(0, Math.min(index - 1, remaining - 1)));
    });
  }

  private removeTag(tag: CxTagFieldTag): void {
    if (this.isLocked$()) {
      return;
    }
    const next = this.selectedIdsState().filter(id => id !== tag.id);
    this.selectedIdsState.set(next);
    this.valuesChange.emit([...next]);
    this.announce(`${this.formatOptionLabel(tag)} removed.`);
  }

  private finishCreateDialog(clearQuery: boolean): void {
    this.createDialogOpenState.set(false);
    if (clearQuery) {
      this.queryState.set('');
    }
    this.resetDraftTag();
    queueMicrotask(() => {
      if (this.isLocked$()) {
        return;
      }
      this.openPopover('first');
      this.focusInput();
    });
  }

  private lockInteractions(): void {
    this.closePopover();
    if (this.createDialogOpenState()) {
      this.createDialogOpenState.set(false);
      this.resetDraftTag();
    }
  }

  private focusDraftName(): void {
    if (typeof window === 'undefined') {
      queueMicrotask(() => this.draftNameInputRef?.focus());
      return;
    }
    if (this.dialogFocusTimer !== undefined) {
      window.clearTimeout(this.dialogFocusTimer);
    }
    this.dialogFocusTimer = window.setTimeout(() => {
      this.dialogFocusTimer = undefined;
      this.draftNameInputRef?.focus();
    }, 0);
  }

  private announceResults(): void {
    const count = this.filteredTags$().length;
    const object = this.objectLabel();
    const countText = `${count} ${count === 1 ? this.singularize(object) : object} available.`;
    const createText = this.showCreate$() ? ' Create is available.' : '';
    this.announce(`${countText}${createText}`);
  }

  private announce(message: string): void {
    this.statusState.set('');
    queueMicrotask(() => this.statusState.set(message));
  }

  private inputAtStart(): boolean {
    const input = this.inputRef?.nativeElement;
    return Boolean(input && input.selectionStart === 0 && input.selectionEnd === 0);
  }

  private isPrintableKey(event: KeyboardEvent): boolean {
    return event.key.length === 1
      && event.key !== ' '
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey;
  }

  private tagTarget(tagId: string): string {
    return `tag:${tagId}`;
  }

  private defaultPlaceholderText(): string {
    const object = this.objectLabel();
    return `Select ${object}`;
  }

  private objectLabel(): string {
    const label = this.label.trim() || this.ariaLabel?.trim() || 'Tags';
    return label.toLocaleLowerCase();
  }

  private singularize(value: string): string {
    return value.endsWith('s') && value.length > 1 ? value.slice(0, -1) : value;
  }

  private normalizedText(value: string): string {
    return value.trim().toLocaleLowerCase();
  }

  private measureOverlay(rect: DOMRect, viewport: CxFloatingSurfaceViewport): CxFloatingSurfaceRequest {
    const viewportWidth = Math.max(viewport.width - 16, 0);
    const width = Math.floor(Math.min(Math.max(rect.width, 280), viewportWidth));
    const optionHeight = 44;
    const emptyHeight = this.filteredTags$().length === 0 ? 72 : 0;
    const createHeight = this.showCreate$() ? optionHeight : 0;
    const estimatedHeight = Math.min(
      this.filteredTags$().length * optionHeight + emptyHeight + createHeight + 8,
      360,
    );
    return {
      width,
      minWidth: width,
      estimatedHeight,
      align: 'start',
      maxHeightCap: estimatedHeight,
    };
  }

  private normalizeTags(value: readonly CxTagFieldTag[]): readonly CxTagFieldTag[] {
    const tags = new Map<string, CxTagFieldTag>();
    for (const rawTag of value) {
      const id = rawTag.id?.trim();
      const name = rawTag.name?.trim();
      if (!id || !name || tags.has(id)) {
        continue;
      }
      tags.set(id, {
        id,
        name,
        key: rawTag.key?.trim() || undefined,
        color: this.isTagColor(rawTag.color) ? rawTag.color : undefined,
      });
    }
    return [...tags.values()];
  }

  private normalizeSelectedIds(value: readonly string[] | null | undefined): readonly string[] {
    return [...new Set((value ?? []).map(id => id.trim()).filter(Boolean))];
  }

  private ensureSelected(tagId: string): boolean {
    if (this.selectedIdsState().includes(tagId)) {
      return false;
    }
    const next = [...this.selectedIdsState(), tagId];
    this.selectedIdsState.set(next);
    this.valuesChange.emit([...next]);
    return true;
  }

  private findExistingTag(name: string, key: string | undefined): CxTagFieldTag | undefined {
    const normalizedName = this.normalizedText(name);
    const normalizedKey = this.normalizedText(key ?? '');
    return this.tagsState().find(tag =>
      this.normalizedText(tag.name) === normalizedName
      && this.normalizedText(tag.key ?? '') === normalizedKey,
    );
  }

  private createTagId(name: string, key: string): string {
    const baseId = `${name}-${key}`
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'tag';
    let id = baseId;
    let suffix = 2;
    const existingIds = new Set(this.tagsState().map(tag => tag.id));
    while (existingIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    return id;
  }

  private isTagColor(color: unknown): color is CxTagColor {
    return typeof color === 'string' && (CX_TAG_COLORS as readonly string[]).includes(color);
  }

  private isPickerColor(color: CxColorPickerColor | undefined): color is CxTagPickerColor {
    return Boolean(color) && (CX_TAG_COLOR_PICKER_OPTIONS as readonly string[]).includes(color!);
  }

  private resetDraftTag(): void {
    this.draftNameState.set('');
    this.draftKeyState.set('');
    this.draftColorState.set('violet');
    this.draftNameErrorState.set(undefined);
  }
}
