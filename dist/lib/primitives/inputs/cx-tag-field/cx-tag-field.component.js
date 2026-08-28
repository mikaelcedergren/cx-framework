import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, ViewChildren, computed, inject, signal, } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts.js';
import { CX_TAG_COLORS, CX_TAG_COLOR_PICKER_OPTIONS, CxTagComponent, } from '../../display/cx-tag/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxColorPickerComponent } from '../cx-color-picker/index.js';
import { CxTextFieldComponent } from '../cx-text-field/index.js';
import { CxDialogComponent } from '../../overlay/cx-dialog/index.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { CxOptionComponent } from '../../overlay/cx-option/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { normalizeCxValidation, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
const CX_TAG_FIELD_CREATE_SHORTCUT = ['Mod', 'Enter'];
export class CxTagFieldComponent {
    static nextId = 0;
    instanceId = ++CxTagFieldComponent.nextId;
    host = inject((ElementRef));
    tagsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tagsState" }] : /* istanbul ignore next */ []));
    selectedIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedIdsState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    emptyTextState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "emptyTextState" }] : /* istanbul ignore next */ []));
    creatableState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "creatableState" }] : /* istanbul ignore next */ []));
    queryState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "queryState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    activeTargetState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeTargetState" }] : /* istanbul ignore next */ []));
    statusState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "statusState" }] : /* istanbul ignore next */ []));
    createDialogOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "createDialogOpenState" }] : /* istanbul ignore next */ []));
    draftNameState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draftNameState" }] : /* istanbul ignore next */ []));
    draftKeyState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draftKeyState" }] : /* istanbul ignore next */ []));
    draftColorState = signal('violet', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draftColorState" }] : /* istanbul ignore next */ []));
    draftNameErrorState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draftNameErrorState" }] : /* istanbul ignore next */ []));
    disabledState = false;
    loadingState = false;
    dialogFocusTimer;
    inputId = `cx-tag-field-input-${this.instanceId}`;
    labelId = `cx-tag-field-label-${this.instanceId}`;
    messagesId = `cx-tag-field-messages-${this.instanceId}`;
    statusId = `cx-tag-field-status-${this.instanceId}`;
    listboxId = `cx-tag-field-listbox-${this.instanceId}`;
    popoverId = `cx-tag-field-popover-${this.instanceId}`;
    createOptionId = `cx-tag-field-create-${this.instanceId}`;
    popoverMaxWidth = 360;
    createShortcutParts = CX_TAG_FIELD_CREATE_SHORTCUT;
    createShortcutAria = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
        ? 'Meta+Enter'
        : 'Control+Enter';
    fieldShellRef;
    inputRef;
    popoverRef;
    draftNameInputRef;
    selectedTagRemoveRefs;
    overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport), () => this.popoverRef?.surfaceElement());
    label = 'Tags';
    ariaLabel;
    placeholder = '';
    optional = false;
    clearable = false;
    size = 'default';
    hint;
    set creatable(value) {
        const next = value !== false;
        if (this.creatableState() === next) {
            return;
        }
        this.creatableState.set(next);
        if (!next && this.createDialogOpenState()) {
            this.finishCreateDialog(false);
            return;
        }
        if (this.openState()) {
            this.refreshPopover();
            return;
        }
        this.syncActiveTarget('keep');
    }
    get creatable() {
        return this.creatableState();
    }
    set disabled(value) {
        this.disabledState = Boolean(value);
        if (this.disabledState) {
            this.lockInteractions();
        }
    }
    get disabled() {
        return this.disabledState;
    }
    set loading(value) {
        this.loadingState = Boolean(value);
        if (this.loadingState) {
            this.lockInteractions();
        }
    }
    get loading() {
        return this.loadingState;
    }
    set tags(value) {
        this.tagsState.set(this.normalizeTags(value ?? []));
        this.syncActiveTarget('keep');
        this.overlay.resetMeasurement();
    }
    set values(value) {
        this.selectedIdsState.set(this.normalizeSelectedIds(value));
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set emptyText(value) {
        this.emptyTextState.set(value ?? '');
    }
    valuesChange = new EventEmitter();
    tagsChange = new EventEmitter();
    createTag = new EventEmitter();
    clear = new EventEmitter();
    isOpen$ = this.openState.asReadonly();
    creatable$ = this.creatableState.asReadonly();
    query$ = this.queryState.asReadonly();
    status$ = this.statusState.asReadonly();
    createDialogOpen$ = this.createDialogOpenState.asReadonly();
    draftName$ = this.draftNameState.asReadonly();
    draftKey$ = this.draftKeyState.asReadonly();
    draftColor$ = this.draftColorState.asReadonly();
    draftNameError$ = this.draftNameErrorState.asReadonly();
    validationMessages$ = () => this.disabled
        ? []
        : normalizeCxValidation(this.validationState());
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => Boolean(this.hint?.trim()) && this.validationMessages$().length === 0;
    isLocked$ = () => this.disabled || this.loading;
    selectedTags$ = computed(() => {
        const tagsById = new Map(this.tagsState().map(tag => [tag.id, tag]));
        return this.selectedIdsState()
            .map(tagId => tagsById.get(tagId))
            .filter((tag) => Boolean(tag));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedTags$" }] : /* istanbul ignore next */ []));
    filteredTags$ = computed(() => {
        const query = this.normalizedText(this.queryState());
        if (!query) {
            return this.tagsState();
        }
        return this.tagsState().filter(tag => this.normalizedText(`${this.formatOptionLabel(tag)} ${tag.key ?? ''}`).includes(query));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filteredTags$" }] : /* istanbul ignore next */ []));
    showCreate$ = computed(() => {
        if (!this.creatableState()) {
            return false;
        }
        const query = this.queryState().trim();
        if (!query) {
            return true;
        }
        const normalizedQuery = this.normalizedText(query);
        return !this.tagsState().some(tag => this.normalizedText(this.formatOptionLabel(tag)) === normalizedQuery);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showCreate$" }] : /* istanbul ignore next */ []));
    createActionLabel$ = computed(() => {
        const query = this.queryState().trim();
        return query ? `Create “${query}”` : 'Create tag';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "createActionLabel$" }] : /* istanbul ignore next */ []));
    navigationTargets$ = computed(() => [
        ...this.filteredTags$().map(tag => this.tagTarget(tag.id)),
        ...(this.showCreate$() ? ['create'] : []),
    ], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "navigationTargets$" }] : /* istanbul ignore next */ []));
    activeDescendant$ = computed(() => {
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
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeDescendant$" }] : /* istanbul ignore next */ []));
    placeholderText$ = () => this.placeholder.trim() || this.defaultPlaceholderText();
    hasClear$ = () => this.clearable && this.selectedTags$().length > 0 && !this.isLocked$();
    emptyText$ = () => {
        const explicit = this.emptyTextState().trim();
        if (explicit) {
            return explicit;
        }
        const object = this.objectLabel();
        const query = this.queryState().trim();
        return query ? `No ${object} match “${query}”` : `No ${object} available`;
    };
    createDialogHeading = 'Create tag';
    createDialogDescription = 'Add a name, optional key, and color.';
    createDialogPrimaryLabel = 'Create tag';
    createDialogSecondaryLabel = 'Cancel';
    get resolvedFieldAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        return this.label.trim() ? undefined : 'Tags';
    }
    get resolvedFieldAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedFieldAriaDescribedBy() {
        const ids = [this.statusId];
        if (this.showHint$() || this.validationMessages$().length > 0) {
            ids.unshift(this.messagesId);
        }
        return ids.join(' ');
    }
    ngAfterViewInit() {
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
    ngOnDestroy() {
        this.overlay.destroy();
        if (typeof document !== 'undefined') {
            document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
        }
        if (typeof window !== 'undefined' && this.dialogFocusTimer !== undefined) {
            window.clearTimeout(this.dialogFocusTimer);
        }
    }
    optionDomId(index) {
        return `cx-tag-field-option-${this.instanceId}-${index}`;
    }
    isTagSelected(tagId) {
        return this.selectedIdsState().includes(tagId);
    }
    isTagActive(tagId) {
        return this.activeTargetState() === this.tagTarget(tagId);
    }
    isCreateActive() {
        return this.activeTargetState() === 'create';
    }
    setActiveTag(tagId) {
        this.activeTargetState.set(this.tagTarget(tagId));
    }
    setCreateActive() {
        if (this.showCreate$()) {
            this.activeTargetState.set('create');
        }
    }
    onFieldClick(event) {
        if (this.isLocked$()) {
            return;
        }
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('button')) {
            return;
        }
        if (!this.openState()) {
            this.openPopover('keep');
        }
        this.focusInput();
    }
    /**
     * Editable-combobox semantics: receiving focus never opens the popover.
     * Click, directional navigation, Enter, or typing expresses that intent.
     */
    onInput(event) {
        if (this.isLocked$()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const value = target.value;
        this.queryState.set(value);
        if (this.openState()) {
            this.syncActiveTarget('first');
            this.refreshPopover();
        }
        else {
            this.openPopover('first');
        }
        this.announceResults();
    }
    onInputKeydown(event) {
        if (this.isLocked$() || event.isComposing) {
            return;
        }
        if (eventMatchesShortcut(CX_TAG_FIELD_CREATE_SHORTCUT, event)) {
            if (!this.creatableState()) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (this.showCreate$()) {
                this.openCreateDialog();
            }
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (this.openState()) {
                this.moveActiveTarget(event.key === 'ArrowDown' ? 1 : -1);
            }
            else {
                this.openPopover(event.key === 'ArrowDown' ? 'first' : 'last');
            }
            return;
        }
        if ((event.key === ' ' || event.key === 'Spacebar')
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey
            && !event.shiftKey
            && this.openState()
            && !this.queryState()
            && this.activeTargetState()?.startsWith('tag:')) {
            event.preventDefault();
            this.commitActiveTarget();
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (this.openState()) {
                this.commitActiveTarget();
            }
            else {
                this.openPopover('first');
            }
            return;
        }
        if (event.key === 'Escape') {
            if (!this.openState()) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            this.closePopover(true);
            return;
        }
        if (event.key === 'Tab') {
            this.closePopover();
            return;
        }
        if ((event.key === 'Backspace' || event.key === 'ArrowLeft')
            && !this.queryState()
            && this.selectedTags$().length > 0) {
            event.preventDefault();
            this.focusSelectedTag(this.selectedTags$().length - 1);
        }
    }
    onSelectedTagFocus(tag) {
        this.announce(`${this.formatOptionLabel(tag)} selected. Press Backspace or Delete to remove.`);
    }
    onSelectedTagKeydown(event, tag, index) {
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
            }
            else {
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
            if (!this.openState()) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            this.closePopover();
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
    removeTagFromPointer(event, tag) {
        event.stopPropagation();
        this.removeTag(tag);
        if (this.openState()) {
            this.refreshPopover();
        }
        this.focusInput();
    }
    onOptionPointerDown(event) {
        event.preventDefault();
    }
    toggleTag(tag) {
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
    openCreateDialog() {
        if (this.isLocked$() || !this.showCreate$()) {
            return;
        }
        this.openState.set(false);
        this.activeTargetState.set(undefined);
        this.overlay.endSession();
        this.resetDraftTag();
        this.draftNameState.set(this.queryState().trim());
        this.createDialogOpenState.set(true);
        this.focusDraftName();
    }
    onCreateDialogOpenChange(open) {
        if (open) {
            this.createDialogOpenState.set(this.creatableState());
            return;
        }
        this.finishCreateDialog(false);
    }
    onDraftNameChange(value) {
        this.draftNameState.set(value);
        if (value.trim()) {
            this.draftNameErrorState.set(undefined);
        }
    }
    onDraftKeyChange(value) {
        this.draftKeyState.set(value);
    }
    onDraftColorChange(color) {
        this.draftColorState.set(this.isPickerColor(color) ? color : 'violet');
    }
    confirmCreateTag() {
        if (!this.creatableState()) {
            if (this.createDialogOpenState()) {
                this.finishCreateDialog(false);
            }
            return;
        }
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
        const nextTag = {
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
    clearSelected() {
        if (!this.hasClear$()) {
            return;
        }
        this.selectedIdsState.set([]);
        this.valuesChange.emit([]);
        this.clear.emit();
        this.announce('Tags cleared.');
        if (!this.openState()) {
            this.openPopover('first');
        }
        else {
            this.refreshPopover();
        }
        this.focusInput();
    }
    formatOptionLabel(tag) {
        const key = tag.key?.trim();
        return key ? `${tag.name}: ${key}` : tag.name;
    }
    toTagColor(color) {
        return this.isTagColor(color) ? color : 'default';
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
        const surface = this.popoverRef?.surfaceElement();
        if (surface?.contains(target)) {
            return;
        }
        this.closePopover();
    }
    onDocumentFocusIn(event) {
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
    onWindowResize() {
        if (this.openState()) {
            this.overlay.sync();
        }
    }
    closePopover(restoreFocus = false) {
        this.openState.set(false);
        this.activeTargetState.set(undefined);
        this.overlay.endSession();
        if (restoreFocus) {
            this.focusInput();
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
    openPopover(target) {
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
    moveActiveTarget(delta) {
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
    commitActiveTarget() {
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
    syncActiveTarget(preference) {
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
    scrollActiveTargetIntoView() {
        queueMicrotask(() => {
            const id = this.activeDescendant$();
            if (!id) {
                return;
            }
            const option = this.popoverRef?.surfaceElement()?.querySelector(`#${id}`);
            option?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        });
    }
    refreshPopover() {
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
    focusInput() {
        queueMicrotask(() => this.inputRef?.nativeElement.focus());
    }
    focusSelectedTag(index) {
        const refs = this.selectedTagRemoveRefs?.toArray() ?? [];
        refs[index]?.nativeElement.focus();
    }
    removeTagAndFocus(tag, index) {
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
    removeTag(tag) {
        if (this.isLocked$()) {
            return;
        }
        const next = this.selectedIdsState().filter(id => id !== tag.id);
        this.selectedIdsState.set(next);
        this.valuesChange.emit([...next]);
        this.announce(`${this.formatOptionLabel(tag)} removed.`);
    }
    finishCreateDialog(clearQuery) {
        this.createDialogOpenState.set(false);
        if (clearQuery) {
            this.queryState.set('');
        }
        this.resetDraftTag();
        const restoreField = () => {
            if (this.isLocked$()) {
                return;
            }
            this.openPopover('first');
            this.focusInput();
        };
        if (typeof window === 'undefined') {
            queueMicrotask(restoreField);
            return;
        }
        if (this.dialogFocusTimer !== undefined) {
            window.clearTimeout(this.dialogFocusTimer);
        }
        // Let Angular remove the modal and release its focus trap before returning
        // focus to the field. A microtask can run while the dialog still owns it.
        this.dialogFocusTimer = window.setTimeout(() => {
            this.dialogFocusTimer = undefined;
            restoreField();
        }, 0);
    }
    lockInteractions() {
        this.closePopover();
        if (this.createDialogOpenState()) {
            this.createDialogOpenState.set(false);
            this.resetDraftTag();
        }
    }
    focusDraftName() {
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
    announceResults() {
        const count = this.filteredTags$().length;
        const object = this.objectLabel();
        const countText = `${count} ${count === 1 ? this.singularize(object) : object} available.`;
        const createText = this.showCreate$() ? ' Create is available.' : '';
        this.announce(`${countText}${createText}`);
    }
    announce(message) {
        this.statusState.set('');
        queueMicrotask(() => this.statusState.set(message));
    }
    isPrintableKey(event) {
        return event.key.length === 1
            && event.key !== ' '
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey;
    }
    tagTarget(tagId) {
        return `tag:${tagId}`;
    }
    defaultPlaceholderText() {
        const object = this.objectLabel();
        return `Select ${object}`;
    }
    objectLabel() {
        const label = this.label.trim() || this.ariaLabel?.trim() || 'Tags';
        return label.toLocaleLowerCase();
    }
    singularize(value) {
        return value.endsWith('s') && value.length > 1 ? value.slice(0, -1) : value;
    }
    normalizedText(value) {
        return value.trim().toLocaleLowerCase();
    }
    measureOverlay(rect, viewport) {
        const viewportWidth = Math.max(viewport.width - 16, 0);
        const width = Math.floor(Math.min(Math.max(rect.width, 280), viewportWidth));
        const optionHeight = 44;
        const emptyHeight = this.filteredTags$().length === 0 ? 72 : 0;
        const createHeight = this.showCreate$() ? optionHeight : 0;
        const estimatedHeight = Math.min(this.filteredTags$().length * optionHeight + emptyHeight + createHeight + 8, 360);
        return {
            width,
            minWidth: width,
            estimatedHeight,
            align: 'start',
            maxHeightCap: estimatedHeight,
        };
    }
    normalizeTags(value) {
        const tags = new Map();
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
    normalizeSelectedIds(value) {
        return [...new Set((value ?? []).map(id => id.trim()).filter(Boolean))];
    }
    ensureSelected(tagId) {
        if (this.selectedIdsState().includes(tagId)) {
            return false;
        }
        const next = [...this.selectedIdsState(), tagId];
        this.selectedIdsState.set(next);
        this.valuesChange.emit([...next]);
        return true;
    }
    findExistingTag(name, key) {
        const normalizedName = this.normalizedText(name);
        const normalizedKey = this.normalizedText(key ?? '');
        return this.tagsState().find(tag => this.normalizedText(tag.name) === normalizedName
            && this.normalizedText(tag.key ?? '') === normalizedKey);
    }
    createTagId(name, key) {
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
    isTagColor(color) {
        return typeof color === 'string' && CX_TAG_COLORS.includes(color);
    }
    isPickerColor(color) {
        return Boolean(color) && CX_TAG_COLOR_PICKER_OPTIONS.includes(color);
    }
    resetDraftTag() {
        this.draftNameState.set('');
        this.draftKeyState.set('');
        this.draftColorState.set('violet');
        this.draftNameErrorState.set(undefined);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTagFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTagFieldComponent, isStandalone: true, selector: "cx-tag-field", inputs: { label: "label", ariaLabel: "ariaLabel", placeholder: "placeholder", optional: "optional", clearable: "clearable", size: "size", hint: "hint", creatable: "creatable", disabled: "disabled", loading: "loading", tags: "tags", values: "values", validation: "validation", emptyText: "emptyText" }, outputs: { valuesChange: "valuesChange", tagsChange: "tagsChange", createTag: "createTag", clear: "clear" }, host: { listeners: { "document:pointerdown": "onDocumentPointerDown($event)", "document:focusin": "onDocumentFocusIn($event)", "window:resize": "onWindowResize()" } }, viewQueries: [{ propertyName: "fieldShellRef", first: true, predicate: ["fieldShell"], descendants: true, read: ElementRef }, { propertyName: "inputRef", first: true, predicate: ["input"], descendants: true, read: ElementRef }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }, { propertyName: "draftNameInputRef", first: true, predicate: ["draftNameInput"], descendants: true }, { propertyName: "selectedTagRemoveRefs", predicate: ["selectedTagRemove"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-tag-field\"\n  [class.cx-tag-field--small]=\"size === 'small'\"\n  [class.cx-tag-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-tag-field__header\">\n      <label class=\"cx-tag-field__label\" [id]=\"labelId\" [for]=\"inputId\">{{ label.trim() }}</label>\n      @if (optional) {\n        <div class=\"cx-tag-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    #fieldShell\n    class=\"cx-tag-field__field-shell\"\n    [class.cx-tag-field__field-shell--open]=\"isOpen$()\"\n    [class.cx-tag-field__field-shell--disabled]=\"disabled\"\n    [class.cx-tag-field__field-shell--loading]=\"loading\"\n    [class.cx-tag-field__field-shell--error]=\"hasError$()\"\n    (click)=\"onFieldClick($event)\"\n  >\n    <div class=\"cx-tag-field__tokens\">\n      @for (tag of selectedTags$(); track tag.id; let index = $index) {\n        <span class=\"cx-tag-field__token\" [attr.data-selected-tag-id]=\"tag.id\">\n          <cx-tag\n            [text]=\"formatOptionLabel(tag)\"\n            [color]=\"toTagColor(tag.color)\"\n          />\n          <button\n            #selectedTagRemove\n            type=\"button\"\n            class=\"cx-tag-field__token-remove\"\n            tabindex=\"-1\"\n            [disabled]=\"isLocked$()\"\n            [attr.aria-label]=\"'Remove ' + formatOptionLabel(tag)\"\n            (focus)=\"onSelectedTagFocus(tag)\"\n            (keydown)=\"onSelectedTagKeydown($event, tag, index)\"\n            (click)=\"removeTagFromPointer($event, tag)\"\n          >\n            <cx-icon icon=\"remove\" [size]=\"12\" />\n          </button>\n        </span>\n      }\n\n      <input\n        #input\n        class=\"cx-tag-field__input\"\n        [id]=\"inputId\"\n        type=\"text\"\n        role=\"combobox\"\n        autocomplete=\"off\"\n        aria-autocomplete=\"list\"\n        aria-haspopup=\"listbox\"\n        [disabled]=\"isLocked$()\"\n        [value]=\"query$()\"\n        [attr.placeholder]=\"selectedTags$().length === 0 ? placeholderText$() : null\"\n        [attr.aria-label]=\"resolvedFieldAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n        [attr.aria-expanded]=\"isOpen$()\"\n        [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n        [attr.aria-activedescendant]=\"isOpen$() ? activeDescendant$() : null\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        [attr.aria-required]=\"optional ? null : 'true'\"\n        [attr.aria-disabled]=\"disabled ? 'true' : null\"\n        [attr.aria-busy]=\"loading ? 'true' : null\"\n        [attr.aria-keyshortcuts]=\"creatable$() ? createShortcutAria : null\"\n        (input)=\"onInput($event)\"\n        (keydown)=\"onInputKeydown($event)\"\n      />\n    </div>\n\n    <span class=\"cx-tag-field__actions\">\n      @if (hasClear$()) {\n        <span\n          class=\"cx-tag-field__clear\"\n          (pointerdown)=\"$event.preventDefault(); $event.stopPropagation()\"\n          (click)=\"$event.stopPropagation()\"\n        >\n          <cx-icon-button\n            icon=\"remove\"\n            ariaLabel=\"Clear tags\"\n            variant=\"transparent\"\n            size=\"small\"\n            (pressed)=\"clearSelected()\"\n          />\n        </span>\n      }\n      @if (loading) {\n        <span class=\"cx-tag-field__loading\" aria-hidden=\"true\">\n          <cx-spinner size=\"small\" mood=\"default\" />\n        </span>\n      }\n      <cx-icon\n        class=\"cx-tag-field__chevron\"\n        icon=\"chevron-down\"\n        [size]=\"size === 'small' ? 12 : 16\"\n        aria-hidden=\"true\"\n      />\n    </span>\n  </div>\n\n  <span class=\"cx-tag-field__sr-only\" [id]=\"statusId\" aria-live=\"polite\">{{ status$() }}</span>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-tag-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-tag-field__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n  @if (isOpen$() && !isLocked$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [showBackdrop]=\"false\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxWidth]=\"popoverMaxWidth\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover(true)\"\n    >\n      <div\n        class=\"cx-tag-field__surface\"\n        [id]=\"listboxId\"\n        role=\"listbox\"\n        [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n        [attr.aria-label]=\"resolvedFieldAriaLabel\"\n        aria-multiselectable=\"true\"\n      >\n        <div class=\"cx-tag-field__options\" data-cx-popover-scroll-container>\n          @if (filteredTags$().length > 0) {\n            @for (tag of filteredTags$(); track tag.id; let index = $index) {\n              <div\n                class=\"cx-tag-field__option\"\n                [class.cx-tag-field__option--active]=\"isTagActive(tag.id)\"\n                [id]=\"optionDomId(index)\"\n                role=\"option\"\n                [attr.aria-selected]=\"isTagSelected(tag.id)\"\n                (pointerenter)=\"setActiveTag(tag.id)\"\n                (pointerdown)=\"onOptionPointerDown($event)\"\n                (click)=\"toggleTag(tag)\"\n              >\n                <cx-option\n                  [clickable]=\"false\"\n                  [label]=\"formatOptionLabel(tag)\"\n                  [active]=\"isTagActive(tag.id)\"\n                  [selected]=\"isTagSelected(tag.id)\"\n                  [selectedHighlight]=\"false\"\n                  [showCheckbox]=\"true\"\n                />\n              </div>\n            }\n          } @else {\n            <div class=\"cx-tag-field__empty\" role=\"status\">\n              {{ emptyText$() }}\n            </div>\n          }\n        </div>\n\n        @if (showCreate$()) {\n          <div\n            class=\"cx-tag-field__create\"\n            [class.cx-tag-field__create--active]=\"isCreateActive()\"\n            [id]=\"createOptionId\"\n            role=\"option\"\n            aria-selected=\"false\"\n            [attr.aria-label]=\"createActionLabel$()\"\n            [attr.aria-keyshortcuts]=\"createShortcutAria\"\n            (pointerenter)=\"setCreateActive()\"\n            (pointerdown)=\"onOptionPointerDown($event)\"\n            (click)=\"openCreateDialog()\"\n          >\n            <cx-option\n              [clickable]=\"false\"\n              [label]=\"createActionLabel$()\"\n              [active]=\"isCreateActive()\"\n              [selected]=\"false\"\n              prependIcon=\"plus\"\n              [shortcutParts]=\"createShortcutParts\"\n            />\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n\n  @if (creatable$()) {\n    <cx-dialog\n      variant=\"confirm\"\n      [open]=\"createDialogOpen$()\"\n      [dismissible]=\"true\"\n      [heading]=\"createDialogHeading\"\n      [description]=\"createDialogDescription\"\n      [primaryText]=\"createDialogPrimaryLabel\"\n      [secondaryText]=\"createDialogSecondaryLabel\"\n      [closeOnPrimary]=\"false\"\n      (openChange)=\"onCreateDialogOpenChange($event)\"\n      (primary)=\"confirmCreateTag()\"\n    >\n      <div body class=\"cx-tag-field__dialog-body\">\n        <div class=\"cx-tag-field__dialog-name-row\">\n          <cx-text-field\n            #draftNameInput\n            label=\"Name\"\n            [value]=\"draftName$()\"\n            [validation]=\"draftNameError$()\"\n            (valueChange)=\"onDraftNameChange($event)\"\n          />\n          <div class=\"cx-tag-field__dialog-color-slot\">\n            <cx-color-picker\n              class=\"cx-tag-field__dialog-color-picker\"\n              [color]=\"draftColor$()\"\n              (colorChange)=\"onDraftColorChange($event)\"\n            />\n          </div>\n        </div>\n        <cx-text-field\n          label=\"Key\"\n          [optional]=\"true\"\n          [value]=\"draftKey$()\"\n          (valueChange)=\"onDraftKeyChange($event)\"\n        />\n      </div>\n    </cx-dialog>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-tag-field{width:100%}.cx-tag-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-tag-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-tag-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-tag-field__field-shell{display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);box-sizing:border-box;padding:var(--space-xs) var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);cursor:text}.cx-tag-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-tag-field__field-shell:hover:not(.cx-tag-field__field-shell--disabled):not(.cx-tag-field__field-shell--error){border-color:var(--border-hover)}.cx-tag-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-tag-field__field-shell:has(.cx-tag-field__input:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tag-field__field-shell--error,.cx-tag-field__field-shell--error:hover:not(.cx-tag-field__field-shell--disabled){border-color:var(--danger)}.cx-tag-field__field-shell--disabled{opacity:.55;cursor:default}.cx-tag-field__field-shell--loading{cursor:progress}.cx-tag-field__field-shell:hover:not(.cx-tag-field__field-shell--disabled):not(.cx-tag-field__field-shell--error),.cx-tag-field__field-shell:focus-within:not(.cx-tag-field__field-shell--disabled):not(.cx-tag-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-tag-field__field-shell--disabled{cursor:default}.cx-tag-field__tokens{display:flex;min-width:0;flex:1 1 auto;flex-wrap:wrap;align-items:center;align-content:center;gap:var(--space-xs)}.cx-tag-field__token{position:relative;display:inline-flex;min-width:0;max-width:100%;flex:0 1 auto;align-items:center}.cx-tag-field__token>cx-tag{--cx-tag-padding-inline-end: calc(var(--controller-size-small) + var(--space-2xs))}.cx-tag-field__token-remove{position:absolute;top:50%;right:var(--space-2xs);display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;padding:0;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:color-mix(in srgb, var(--surface) 82%, transparent);color:var(--ink);cursor:pointer;opacity:0;pointer-events:none;transform:translateY(-50%) scale(0.94);transition:opacity var(--motion-fast) var(--ease-out-in),transform var(--motion-fast) var(--ease-out-in),background-color var(--motion-fast) var(--ease-out-in),border-color var(--motion-fast) var(--ease-out-in)}.cx-tag-field__token:hover .cx-tag-field__token-remove,.cx-tag-field__token:has(.cx-tag-field__token-remove:focus-visible) .cx-tag-field__token-remove{opacity:1;pointer-events:auto;transform:translateY(-50%) scale(1)}.cx-tag-field__token-remove:hover{border-color:var(--opacity-mid);background:var(--opacity-low)}.cx-tag-field__token-remove:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tag-field__token-remove:disabled{cursor:default}@media(hover: none),(pointer: coarse){.cx-tag-field__token-remove{position:static;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);margin-inline-start:calc(0px - var(--controller-size-small) - var(--space-2xs));opacity:1;pointer-events:auto;transform:none}}.cx-tag-field__input{min-width:8ch;flex:1 1 8ch;align-self:stretch;padding:0;border:0;outline:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-tag-field__input::placeholder{color:var(--placeholder);opacity:1}.cx-tag-field--small .cx-tag-field__field-shell{min-height:var(--controller-size-small);padding-block:var(--space-2xs)}.cx-tag-field--small .cx-tag-field__input{font-size:var(--font-size-body-sm)}.cx-tag-field--large .cx-tag-field__field-shell{min-height:var(--controller-size-large);padding-block:var(--space-sm);border-radius:var(--radius-xl)}.cx-tag-field--large .cx-tag-field__input{font-size:var(--font-size-body-lg)}.cx-tag-field__actions{display:inline-flex;flex:0 0 auto;align-items:center;align-self:center;gap:var(--space-xs)}.cx-tag-field__clear,.cx-tag-field__loading,.cx-tag-field__chevron{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-tag-field__loading,.cx-tag-field__chevron{color:var(--opacity-high)}.cx-tag-field__chevron{pointer-events:none;transition:transform var(--motion-fast) var(--ease-out)}.cx-tag-field__field-shell--open .cx-tag-field__chevron{transform:rotate(180deg)}.cx-tag-field__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column}.cx-tag-field__options{min-width:0;min-height:0;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain}.cx-tag-field__option,.cx-tag-field__create{border-radius:var(--radius-sm);cursor:pointer;transition:background-color var(--motion-fast) ease}.cx-tag-field__option:hover,.cx-tag-field__option--active,.cx-tag-field__create:hover,.cx-tag-field__create--active{background:var(--primary-opacity)}.cx-tag-field__create{flex:0 0 auto;padding-top:var(--space-xs);border-top:var(--line)}.cx-tag-field__empty{display:flex;min-height:72px;align-items:center;box-sizing:border-box;padding:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}.cx-tag-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-tag-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-tag-field__sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}.cx-tag-field__dialog-body{display:flex;min-width:min(320px,100%);flex-direction:column;gap:var(--space-md)}.cx-tag-field__dialog-name-row{display:grid;align-items:start;grid-template-columns:minmax(0, 1fr) auto;gap:var(--space-md)}.cx-tag-field__dialog-color-slot{display:flex;flex-direction:column}.cx-tag-field__dialog-color-picker{width:fit-content}@media(max-width: 480px){.cx-tag-field__dialog-body{min-width:0}.cx-tag-field__dialog-name-row{grid-template-columns:minmax(0, 1fr)}}"], dependencies: [{ kind: "component", type: CxColorPickerComponent, selector: "cx-color-picker", inputs: ["label", "hint", "optional", "ariaLabel", "size", "color", "disabled", "loading", "clearable", "showValue", "validation"], outputs: ["colorChange"] }, { kind: "component", type: CxDialogComponent, selector: "cx-dialog", inputs: ["variant", "size", "dismissible", "dismissOnClickOutside", "heading", "description", "primaryText", "primaryDisabled", "primaryLoading", "mood", "secondaryText", "closeOnPrimary", "closeOnSecondary", "menuItems", "menuAriaLabel", "open"], outputs: ["openChange", "dismissRequest", "primary", "secondary", "dismiss", "menuItemSelect"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "component", type: CxTagComponent, selector: "cx-tag", inputs: ["text", "icon", "color", "outline", "dismissible", "interactive", "ariaLabel", "expanded", "controls"], outputs: ["dismiss", "pressed"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTagFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-tag-field', imports: [
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
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-tag-field\"\n  [class.cx-tag-field--small]=\"size === 'small'\"\n  [class.cx-tag-field--large]=\"size === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-tag-field__header\">\n      <label class=\"cx-tag-field__label\" [id]=\"labelId\" [for]=\"inputId\">{{ label.trim() }}</label>\n      @if (optional) {\n        <div class=\"cx-tag-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    #fieldShell\n    class=\"cx-tag-field__field-shell\"\n    [class.cx-tag-field__field-shell--open]=\"isOpen$()\"\n    [class.cx-tag-field__field-shell--disabled]=\"disabled\"\n    [class.cx-tag-field__field-shell--loading]=\"loading\"\n    [class.cx-tag-field__field-shell--error]=\"hasError$()\"\n    (click)=\"onFieldClick($event)\"\n  >\n    <div class=\"cx-tag-field__tokens\">\n      @for (tag of selectedTags$(); track tag.id; let index = $index) {\n        <span class=\"cx-tag-field__token\" [attr.data-selected-tag-id]=\"tag.id\">\n          <cx-tag\n            [text]=\"formatOptionLabel(tag)\"\n            [color]=\"toTagColor(tag.color)\"\n          />\n          <button\n            #selectedTagRemove\n            type=\"button\"\n            class=\"cx-tag-field__token-remove\"\n            tabindex=\"-1\"\n            [disabled]=\"isLocked$()\"\n            [attr.aria-label]=\"'Remove ' + formatOptionLabel(tag)\"\n            (focus)=\"onSelectedTagFocus(tag)\"\n            (keydown)=\"onSelectedTagKeydown($event, tag, index)\"\n            (click)=\"removeTagFromPointer($event, tag)\"\n          >\n            <cx-icon icon=\"remove\" [size]=\"12\" />\n          </button>\n        </span>\n      }\n\n      <input\n        #input\n        class=\"cx-tag-field__input\"\n        [id]=\"inputId\"\n        type=\"text\"\n        role=\"combobox\"\n        autocomplete=\"off\"\n        aria-autocomplete=\"list\"\n        aria-haspopup=\"listbox\"\n        [disabled]=\"isLocked$()\"\n        [value]=\"query$()\"\n        [attr.placeholder]=\"selectedTags$().length === 0 ? placeholderText$() : null\"\n        [attr.aria-label]=\"resolvedFieldAriaLabel\"\n        [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n        [attr.aria-expanded]=\"isOpen$()\"\n        [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n        [attr.aria-activedescendant]=\"isOpen$() ? activeDescendant$() : null\"\n        [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n        [attr.aria-required]=\"optional ? null : 'true'\"\n        [attr.aria-disabled]=\"disabled ? 'true' : null\"\n        [attr.aria-busy]=\"loading ? 'true' : null\"\n        [attr.aria-keyshortcuts]=\"creatable$() ? createShortcutAria : null\"\n        (input)=\"onInput($event)\"\n        (keydown)=\"onInputKeydown($event)\"\n      />\n    </div>\n\n    <span class=\"cx-tag-field__actions\">\n      @if (hasClear$()) {\n        <span\n          class=\"cx-tag-field__clear\"\n          (pointerdown)=\"$event.preventDefault(); $event.stopPropagation()\"\n          (click)=\"$event.stopPropagation()\"\n        >\n          <cx-icon-button\n            icon=\"remove\"\n            ariaLabel=\"Clear tags\"\n            variant=\"transparent\"\n            size=\"small\"\n            (pressed)=\"clearSelected()\"\n          />\n        </span>\n      }\n      @if (loading) {\n        <span class=\"cx-tag-field__loading\" aria-hidden=\"true\">\n          <cx-spinner size=\"small\" mood=\"default\" />\n        </span>\n      }\n      <cx-icon\n        class=\"cx-tag-field__chevron\"\n        icon=\"chevron-down\"\n        [size]=\"size === 'small' ? 12 : 16\"\n        aria-hidden=\"true\"\n      />\n    </span>\n  </div>\n\n  <span class=\"cx-tag-field__sr-only\" [id]=\"statusId\" aria-live=\"polite\">{{ status$() }}</span>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-tag-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-tag-field__hint\">{{ hint!.trim() }}</div>\n      }\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n\n  @if (isOpen$() && !isLocked$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [showBackdrop]=\"false\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxWidth]=\"popoverMaxWidth\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover(true)\"\n    >\n      <div\n        class=\"cx-tag-field__surface\"\n        [id]=\"listboxId\"\n        role=\"listbox\"\n        [attr.aria-labelledby]=\"resolvedFieldAriaLabelledBy\"\n        [attr.aria-describedby]=\"resolvedFieldAriaDescribedBy\"\n        [attr.aria-label]=\"resolvedFieldAriaLabel\"\n        aria-multiselectable=\"true\"\n      >\n        <div class=\"cx-tag-field__options\" data-cx-popover-scroll-container>\n          @if (filteredTags$().length > 0) {\n            @for (tag of filteredTags$(); track tag.id; let index = $index) {\n              <div\n                class=\"cx-tag-field__option\"\n                [class.cx-tag-field__option--active]=\"isTagActive(tag.id)\"\n                [id]=\"optionDomId(index)\"\n                role=\"option\"\n                [attr.aria-selected]=\"isTagSelected(tag.id)\"\n                (pointerenter)=\"setActiveTag(tag.id)\"\n                (pointerdown)=\"onOptionPointerDown($event)\"\n                (click)=\"toggleTag(tag)\"\n              >\n                <cx-option\n                  [clickable]=\"false\"\n                  [label]=\"formatOptionLabel(tag)\"\n                  [active]=\"isTagActive(tag.id)\"\n                  [selected]=\"isTagSelected(tag.id)\"\n                  [selectedHighlight]=\"false\"\n                  [showCheckbox]=\"true\"\n                />\n              </div>\n            }\n          } @else {\n            <div class=\"cx-tag-field__empty\" role=\"status\">\n              {{ emptyText$() }}\n            </div>\n          }\n        </div>\n\n        @if (showCreate$()) {\n          <div\n            class=\"cx-tag-field__create\"\n            [class.cx-tag-field__create--active]=\"isCreateActive()\"\n            [id]=\"createOptionId\"\n            role=\"option\"\n            aria-selected=\"false\"\n            [attr.aria-label]=\"createActionLabel$()\"\n            [attr.aria-keyshortcuts]=\"createShortcutAria\"\n            (pointerenter)=\"setCreateActive()\"\n            (pointerdown)=\"onOptionPointerDown($event)\"\n            (click)=\"openCreateDialog()\"\n          >\n            <cx-option\n              [clickable]=\"false\"\n              [label]=\"createActionLabel$()\"\n              [active]=\"isCreateActive()\"\n              [selected]=\"false\"\n              prependIcon=\"plus\"\n              [shortcutParts]=\"createShortcutParts\"\n            />\n          </div>\n        }\n      </div>\n    </cx-popover>\n  }\n\n  @if (creatable$()) {\n    <cx-dialog\n      variant=\"confirm\"\n      [open]=\"createDialogOpen$()\"\n      [dismissible]=\"true\"\n      [heading]=\"createDialogHeading\"\n      [description]=\"createDialogDescription\"\n      [primaryText]=\"createDialogPrimaryLabel\"\n      [secondaryText]=\"createDialogSecondaryLabel\"\n      [closeOnPrimary]=\"false\"\n      (openChange)=\"onCreateDialogOpenChange($event)\"\n      (primary)=\"confirmCreateTag()\"\n    >\n      <div body class=\"cx-tag-field__dialog-body\">\n        <div class=\"cx-tag-field__dialog-name-row\">\n          <cx-text-field\n            #draftNameInput\n            label=\"Name\"\n            [value]=\"draftName$()\"\n            [validation]=\"draftNameError$()\"\n            (valueChange)=\"onDraftNameChange($event)\"\n          />\n          <div class=\"cx-tag-field__dialog-color-slot\">\n            <cx-color-picker\n              class=\"cx-tag-field__dialog-color-picker\"\n              [color]=\"draftColor$()\"\n              (colorChange)=\"onDraftColorChange($event)\"\n            />\n          </div>\n        </div>\n        <cx-text-field\n          label=\"Key\"\n          [optional]=\"true\"\n          [value]=\"draftKey$()\"\n          (valueChange)=\"onDraftKeyChange($event)\"\n        />\n      </div>\n    </cx-dialog>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-tag-field{width:100%}.cx-tag-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-tag-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-tag-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-tag-field__field-shell{display:flex;width:100%;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);box-sizing:border-box;padding:var(--space-xs) var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);cursor:text}.cx-tag-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-tag-field__field-shell:hover:not(.cx-tag-field__field-shell--disabled):not(.cx-tag-field__field-shell--error){border-color:var(--border-hover)}.cx-tag-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-tag-field__field-shell:has(.cx-tag-field__input:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tag-field__field-shell--error,.cx-tag-field__field-shell--error:hover:not(.cx-tag-field__field-shell--disabled){border-color:var(--danger)}.cx-tag-field__field-shell--disabled{opacity:.55;cursor:default}.cx-tag-field__field-shell--loading{cursor:progress}.cx-tag-field__field-shell:hover:not(.cx-tag-field__field-shell--disabled):not(.cx-tag-field__field-shell--error),.cx-tag-field__field-shell:focus-within:not(.cx-tag-field__field-shell--disabled):not(.cx-tag-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-tag-field__field-shell--disabled{cursor:default}.cx-tag-field__tokens{display:flex;min-width:0;flex:1 1 auto;flex-wrap:wrap;align-items:center;align-content:center;gap:var(--space-xs)}.cx-tag-field__token{position:relative;display:inline-flex;min-width:0;max-width:100%;flex:0 1 auto;align-items:center}.cx-tag-field__token>cx-tag{--cx-tag-padding-inline-end: calc(var(--controller-size-small) + var(--space-2xs))}.cx-tag-field__token-remove{position:absolute;top:50%;right:var(--space-2xs);display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;padding:0;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:color-mix(in srgb, var(--surface) 82%, transparent);color:var(--ink);cursor:pointer;opacity:0;pointer-events:none;transform:translateY(-50%) scale(0.94);transition:opacity var(--motion-fast) var(--ease-out-in),transform var(--motion-fast) var(--ease-out-in),background-color var(--motion-fast) var(--ease-out-in),border-color var(--motion-fast) var(--ease-out-in)}.cx-tag-field__token:hover .cx-tag-field__token-remove,.cx-tag-field__token:has(.cx-tag-field__token-remove:focus-visible) .cx-tag-field__token-remove{opacity:1;pointer-events:auto;transform:translateY(-50%) scale(1)}.cx-tag-field__token-remove:hover{border-color:var(--opacity-mid);background:var(--opacity-low)}.cx-tag-field__token-remove:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tag-field__token-remove:disabled{cursor:default}@media(hover: none),(pointer: coarse){.cx-tag-field__token-remove{position:static;width:var(--controller-size-small);height:var(--controller-size-small);flex:0 0 var(--controller-size-small);margin-inline-start:calc(0px - var(--controller-size-small) - var(--space-2xs));opacity:1;pointer-events:auto;transform:none}}.cx-tag-field__input{min-width:8ch;flex:1 1 8ch;align-self:stretch;padding:0;border:0;outline:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-tag-field__input::placeholder{color:var(--placeholder);opacity:1}.cx-tag-field--small .cx-tag-field__field-shell{min-height:var(--controller-size-small);padding-block:var(--space-2xs)}.cx-tag-field--small .cx-tag-field__input{font-size:var(--font-size-body-sm)}.cx-tag-field--large .cx-tag-field__field-shell{min-height:var(--controller-size-large);padding-block:var(--space-sm);border-radius:var(--radius-xl)}.cx-tag-field--large .cx-tag-field__input{font-size:var(--font-size-body-lg)}.cx-tag-field__actions{display:inline-flex;flex:0 0 auto;align-items:center;align-self:center;gap:var(--space-xs)}.cx-tag-field__clear,.cx-tag-field__loading,.cx-tag-field__chevron{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-tag-field__loading,.cx-tag-field__chevron{color:var(--opacity-high)}.cx-tag-field__chevron{pointer-events:none;transition:transform var(--motion-fast) var(--ease-out)}.cx-tag-field__field-shell--open .cx-tag-field__chevron{transform:rotate(180deg)}.cx-tag-field__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column}.cx-tag-field__options{min-width:0;min-height:0;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain}.cx-tag-field__option,.cx-tag-field__create{border-radius:var(--radius-sm);cursor:pointer;transition:background-color var(--motion-fast) ease}.cx-tag-field__option:hover,.cx-tag-field__option--active,.cx-tag-field__create:hover,.cx-tag-field__create--active{background:var(--primary-opacity)}.cx-tag-field__create{flex:0 0 auto;padding-top:var(--space-xs);border-top:var(--line)}.cx-tag-field__empty{display:flex;min-height:72px;align-items:center;box-sizing:border-box;padding:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}.cx-tag-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-tag-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}.cx-tag-field__sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}.cx-tag-field__dialog-body{display:flex;min-width:min(320px,100%);flex-direction:column;gap:var(--space-md)}.cx-tag-field__dialog-name-row{display:grid;align-items:start;grid-template-columns:minmax(0, 1fr) auto;gap:var(--space-md)}.cx-tag-field__dialog-color-slot{display:flex;flex-direction:column}.cx-tag-field__dialog-color-picker{width:fit-content}@media(max-width: 480px){.cx-tag-field__dialog-body{min-width:0}.cx-tag-field__dialog-name-row{grid-template-columns:minmax(0, 1fr)}}"] }]
        }], propDecorators: { fieldShellRef: [{
                type: ViewChild,
                args: ['fieldShell', { read: ElementRef }]
            }], inputRef: [{
                type: ViewChild,
                args: ['input', { read: ElementRef }]
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], draftNameInputRef: [{
                type: ViewChild,
                args: ['draftNameInput']
            }], selectedTagRemoveRefs: [{
                type: ViewChildren,
                args: ['selectedTagRemove', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], optional: [{
                type: Input
            }], clearable: [{
                type: Input
            }], size: [{
                type: Input
            }], hint: [{
                type: Input
            }], creatable: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], tags: [{
                type: Input
            }], values: [{
                type: Input
            }], validation: [{
                type: Input
            }], emptyText: [{
                type: Input
            }], valuesChange: [{
                type: Output
            }], tagsChange: [{
                type: Output
            }], createTag: [{
                type: Output
            }], clear: [{
                type: Output
            }], onDocumentPointerDown: [{
                type: HostListener,
                args: ['document:pointerdown', ['$event']]
            }], onDocumentFocusIn: [{
                type: HostListener,
                args: ['document:focusin', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
