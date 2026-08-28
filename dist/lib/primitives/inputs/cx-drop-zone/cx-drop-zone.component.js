import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { CxProgressBarComponent } from '../../feedback/cx-progress-bar/index.js';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { cxFileSelectionMessage, formatCxAcceptedFileTypes, formatCxFileConstraints, formatCxFileSize, normalizeCxFileValue, selectCxFiles, } from '../shared/file-selection.js';
import * as i0 from "@angular/core";
let nextDropZoneId = 0;
export class CxDropZoneComponent {
    valueState = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    noticeState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "noticeState" }] : /* istanbul ignore next */ []));
    draggingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draggingState" }] : /* istanbul ignore next */ []));
    announcementState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "announcementState" }] : /* istanbul ignore next */ []));
    dragDepth = 0;
    replacementNoticeRevealTimer;
    replacementNoticeTimer;
    instanceId = ++nextDropZoneId;
    headingId = `cx-drop-zone-heading-${this.instanceId}`;
    descriptionId = `cx-drop-zone-description-${this.instanceId}`;
    constraintsId = `cx-drop-zone-constraints-${this.instanceId}`;
    fileNameId = `cx-drop-zone-file-${this.instanceId}`;
    noticeId = `cx-drop-zone-notice-${this.instanceId}`;
    nativeInputRef;
    surfaceRef;
    heading = 'Add a file';
    description = 'Drag and drop a file here.';
    icon = 'upload';
    actionText = 'Choose file';
    replaceText = 'Replace file';
    accept;
    maxSize;
    readonly = false;
    disabled = false;
    set value(value) {
        const normalized = this.normalizeValue(value);
        this.valueState.set(normalized);
        if (!normalized || normalized.state !== 'selected') {
            this.clearNotice();
        }
        if (!this.canSelect) {
            this.resetDrag();
        }
    }
    get value() {
        return this.valueState();
    }
    valueChange = new EventEmitter();
    retry = new EventEmitter();
    ngOnChanges(changes) {
        if ((changes['disabled'] && this.disabled) || (changes['readonly'] && this.readonly)) {
            this.resetDrag();
        }
        if (changes['accept'] || changes['maxSize'] || changes['readonly']) {
            this.clearNotice();
        }
    }
    ngOnDestroy() {
        this.clearReplacementNoticeTimers();
    }
    dragging$ = this.draggingState.asReadonly();
    selectedValue$ = this.valueState.asReadonly();
    notice$ = this.noticeState.asReadonly();
    announcement$ = this.announcementState.asReadonly();
    noticeMessages$ = computed(() => {
        const notice = this.noticeState();
        return notice ? [notice] : [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "noticeMessages$" }] : /* istanbul ignore next */ []));
    lifecycleMessages$ = computed(() => {
        const value = this.valueState();
        if (!value || value.state === 'uploading') {
            return [];
        }
        switch (value.state) {
            case 'selected':
                return [{ type: 'status', message: 'Selected' }];
            case 'complete':
                return [{ type: 'success', message: this.resolvedLifecycleMessage(value, 'Uploaded') }];
            case 'failed':
                return [
                    { type: 'error', message: this.resolvedLifecycleMessage(value, 'Upload failed.') },
                ];
        }
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "lifecycleMessages$" }] : /* istanbul ignore next */ []));
    measuredProgress$ = computed(() => {
        const value = this.valueState();
        if (value?.state !== 'uploading') {
            return undefined;
        }
        const progress = value.progress;
        return Number.isFinite(progress) && progress !== undefined && progress >= 0 && progress <= 100
            ? progress
            : undefined;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "measuredProgress$" }] : /* istanbul ignore next */ []));
    get hasValue() {
        return this.selectedValue$() !== null;
    }
    get isUploading() {
        return this.selectedValue$()?.state === 'uploading';
    }
    get isFailed() {
        return this.selectedValue$()?.state === 'failed';
    }
    get canSelect() {
        return !this.disabled && !this.readonly && !this.isUploading;
    }
    get showMutationActions() {
        return this.hasValue && !this.readonly && !this.isUploading;
    }
    get surfaceLabelledBy() {
        return this.hasValue && !this.dragging$() ? this.fileNameId : this.headingId;
    }
    get nativeInputDescribedBy() {
        const ids = [];
        if (!this.hasValue && this.visibleDescription) {
            ids.push(this.descriptionId);
        }
        if (!this.hasValue && this.visibleConstraints) {
            ids.push(this.constraintsId);
        }
        if (this.notice$()) {
            ids.push(this.noticeId);
        }
        return ids.length ? ids.join(' ') : null;
    }
    get visibleHeading() {
        if (this.dragging$()) {
            return this.hasValue ? 'Drop file to replace' : 'Drop file to add';
        }
        if (this.readonly && !this.hasValue) {
            return 'No file added';
        }
        return this.heading.trim() || 'Add a file';
    }
    get visibleDescription() {
        if (this.dragging$()) {
            return 'Release to use this file.';
        }
        if (this.readonly && !this.hasValue) {
            return '';
        }
        return this.description.trim();
    }
    get visibleConstraints() {
        if (this.dragging$() || this.readonly) {
            return '';
        }
        return formatCxFileConstraints(this.accept, this.maxSize);
    }
    get visibleActionText() {
        return this.actionText.trim() || 'Choose file';
    }
    get visibleReplaceText() {
        return this.replaceText.trim() || 'Replace file';
    }
    get selectedFile() {
        return this.selectedValue$()?.file ?? null;
    }
    get selectedFileMetadata() {
        const file = this.selectedFile;
        if (!file) {
            return '';
        }
        const size = formatCxFileSize(file.size);
        if (size) {
            return size;
        }
        if (file.name.includes('.')) {
            return '';
        }
        return formatCxAcceptedFileTypes(file.type)[0] ?? '';
    }
    get selectedFileIcon() {
        const file = this.selectedFile;
        return file ? this.fileIcon(file) : 'document';
    }
    get uploadingLabel() {
        const value = this.selectedValue$();
        return value?.state === 'uploading'
            ? this.resolvedLifecycleMessage(value, 'Uploading file…')
            : 'Uploading file…';
    }
    get uploadProgressAriaLabel() {
        const name = this.selectedFile?.name;
        return name ? `Upload progress for ${name}` : 'Upload progress';
    }
    onSurfaceClick() {
        if (!this.hasValue) {
            this.openNativePicker();
        }
    }
    openNativePicker() {
        if (!this.canSelect) {
            return;
        }
        const input = this.nativeInputRef?.nativeElement;
        if (!input) {
            return;
        }
        input.value = '';
        input.click();
    }
    onNativeInputChange(event) {
        const input = event.target;
        this.ingestFiles(input?.files ?? null);
    }
    onDragEnter(event) {
        if (!this.canSelect || !this.hasFilePayload(event)) {
            this.resetDrag();
            return;
        }
        event.preventDefault();
        this.dragDepth += 1;
        this.draggingState.set(true);
    }
    onDragOver(event) {
        if (!this.canSelect || !this.hasFilePayload(event)) {
            this.resetDrag();
            return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }
    onDragLeave() {
        if (!this.canSelect) {
            this.resetDrag();
            return;
        }
        this.dragDepth = Math.max(0, this.dragDepth - 1);
        if (this.dragDepth === 0) {
            this.draggingState.set(false);
        }
    }
    onDrop(event) {
        event.preventDefault();
        this.resetDrag();
        if (this.canSelect) {
            this.ingestFiles(event.dataTransfer?.files ?? null);
        }
    }
    removeValue() {
        if (!this.showMutationActions || this.disabled) {
            return;
        }
        this.valueState.set(null);
        this.clearNotice();
        this.resetNativeInput();
        this.announcementState.set('File removed.');
        this.valueChange.emit(null);
        this.scheduleSurfaceFocus();
    }
    retryUpload() {
        const value = this.selectedValue$();
        if (value?.state !== 'failed' || this.disabled || this.readonly) {
            return;
        }
        this.clearNotice();
        this.retry.emit(value.file);
        this.scheduleSurfaceFocus();
    }
    ingestFiles(fileList) {
        if (!this.canSelect || !fileList || fileList.length === 0) {
            return;
        }
        const replacing = this.hasValue;
        const result = selectCxFiles(Array.from(fileList), {
            accept: this.accept,
            maxSize: this.maxSize,
            multiple: false,
        });
        const selectionNotice = cxFileSelectionMessage(result.issue, {
            accept: this.accept,
            maxSize: this.maxSize,
        });
        if (selectionNotice) {
            this.clearReplacementNoticeTimers();
            this.noticeState.set(selectionNotice);
        }
        const accepted = result.accepted[0];
        if (!accepted) {
            this.resetNativeInput();
            return;
        }
        const nextValue = { state: 'selected', file: accepted };
        this.valueState.set(nextValue);
        this.resetNativeInput();
        if (replacing && !selectionNotice) {
            this.showReplacementNotice();
        }
        else {
            if (!selectionNotice) {
                this.clearNotice();
            }
            this.announcementState.set(replacing ? `${accepted.name} replaced.` : `${accepted.name} selected.`);
        }
        this.valueChange.emit(nextValue);
        this.scheduleSurfaceFocus();
    }
    normalizeValue(value) {
        if (!value?.file) {
            return null;
        }
        const file = normalizeCxFileValue(value.file);
        if (!file.name) {
            return null;
        }
        switch (value.state) {
            case 'selected':
                return { state: 'selected', file };
            case 'uploading':
                return {
                    state: 'uploading',
                    file,
                    progress: value.progress,
                    message: value.message,
                };
            case 'complete':
                return { state: 'complete', file, message: value.message };
            case 'failed':
                return { state: 'failed', file, message: value.message };
        }
    }
    resolvedLifecycleMessage(value, fallback) {
        return value.message?.trim() || fallback;
    }
    showReplacementNotice() {
        const restartVisibleNotice = this.noticeState()?.message === 'File replaced.';
        this.clearReplacementNoticeTimers();
        const revealNotice = () => {
            this.noticeState.set({ type: 'success', message: 'File replaced.' });
            this.replacementNoticeRevealTimer = undefined;
            this.replacementNoticeTimer = setTimeout(() => {
                if (this.noticeState()?.message === 'File replaced.') {
                    this.noticeState.set(undefined);
                }
                this.replacementNoticeTimer = undefined;
            }, 3000);
        };
        if (restartVisibleNotice) {
            this.noticeState.set(undefined);
            this.replacementNoticeRevealTimer = setTimeout(revealNotice, 120);
            return;
        }
        revealNotice();
    }
    clearNotice() {
        this.clearReplacementNoticeTimers();
        this.noticeState.set(undefined);
    }
    clearReplacementNoticeTimers() {
        if (this.replacementNoticeRevealTimer !== undefined) {
            clearTimeout(this.replacementNoticeRevealTimer);
            this.replacementNoticeRevealTimer = undefined;
        }
        if (this.replacementNoticeTimer !== undefined) {
            clearTimeout(this.replacementNoticeTimer);
            this.replacementNoticeTimer = undefined;
        }
    }
    resetDrag() {
        this.dragDepth = 0;
        this.draggingState.set(false);
    }
    resetNativeInput() {
        const input = this.nativeInputRef?.nativeElement;
        if (input) {
            input.value = '';
        }
    }
    scheduleSurfaceFocus() {
        queueMicrotask(() => this.surfaceRef?.nativeElement.focus({ preventScroll: true }));
    }
    hasFilePayload(event) {
        const types = event.dataTransfer?.types;
        return types ? Array.from(types).includes('Files') : true;
    }
    fileIcon(value) {
        const extension = value.name.split('.').pop()?.toLowerCase();
        const iconByExtension = {
            csv: 'document-csv',
            doc: 'document-doc',
            docx: 'document-doc',
            json: 'document-json',
            pdf: 'document-pdf',
            txt: 'document-txt',
            xls: 'document-xls',
            xlsx: 'document-xls',
            xml: 'document-xml',
            zip: 'document-zip',
        };
        return extension ? iconByExtension[extension] ?? 'document' : 'document';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDropZoneComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxDropZoneComponent, isStandalone: true, selector: "cx-drop-zone", inputs: { heading: "heading", description: "description", icon: "icon", actionText: "actionText", replaceText: "replaceText", accept: "accept", maxSize: "maxSize", readonly: "readonly", disabled: "disabled", value: "value" }, outputs: { valueChange: "valueChange", retry: "retry" }, viewQueries: [{ propertyName: "nativeInputRef", first: true, predicate: ["nativeInput"], descendants: true, read: ElementRef }, { propertyName: "surfaceRef", first: true, predicate: ["surface"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<div\n  #surface\n  class=\"cx-drop-zone__surface\"\n  [class.cx-drop-zone__surface--empty]=\"!hasValue\"\n  [class.cx-drop-zone__surface--populated]=\"hasValue\"\n  [class.cx-drop-zone__surface--dragging]=\"dragging$()\"\n  [class.cx-drop-zone__surface--readonly]=\"readonly\"\n  [class.cx-drop-zone__surface--disabled]=\"disabled\"\n  [class.cx-drop-zone__surface--uploading]=\"isUploading\"\n  role=\"group\"\n  tabindex=\"-1\"\n  [attr.aria-labelledby]=\"surfaceLabelledBy\"\n  (click)=\"onSurfaceClick()\"\n  (dragenter)=\"onDragEnter($event)\"\n  (dragover)=\"onDragOver($event)\"\n  (dragleave)=\"onDragLeave()\"\n  (drop)=\"onDrop($event)\"\n>\n  @if (!readonly) {\n    <input\n      #nativeInput\n      class=\"cx-drop-zone__native-input\"\n      type=\"file\"\n      tabindex=\"-1\"\n      [accept]=\"accept\"\n      [disabled]=\"disabled || isUploading\"\n      [attr.aria-label]=\"hasValue ? visibleReplaceText : visibleActionText\"\n      [attr.aria-describedby]=\"nativeInputDescribedBy\"\n      [attr.aria-invalid]=\"notice$()?.type === 'error' ? 'true' : null\"\n      (change)=\"onNativeInputChange($event)\"\n    />\n  }\n\n  @if (dragging$()) {\n    <div class=\"cx-drop-zone__drag-prompt\" aria-hidden=\"true\">\n      <cx-icon icon=\"upload\" size=\"32\" mood=\"primary\" shape=\"circle-subtle\" />\n      <div class=\"cx-drop-zone__drag-copy\">\n        <span [id]=\"headingId\" class=\"cx-drop-zone__heading\">{{ visibleHeading }}</span>\n        <span [id]=\"descriptionId\" class=\"cx-drop-zone__description\">{{ visibleDescription }}</span>\n      </div>\n    </div>\n  } @else if (!hasValue) {\n    <div class=\"cx-drop-zone__empty-content\">\n      <cx-icon\n        class=\"cx-drop-zone__empty-icon\"\n        [icon]=\"icon\"\n        [size]=\"readonly ? '32' : '64'\"\n        mood=\"primary\"\n        shape=\"circle-subtle\"\n      />\n\n      <div class=\"cx-drop-zone__empty-copy\">\n        <span [id]=\"headingId\" class=\"cx-drop-zone__heading\">{{ visibleHeading }}</span>\n        @if (visibleDescription) {\n          <span [id]=\"descriptionId\" class=\"cx-drop-zone__description\">{{ visibleDescription }}</span>\n        }\n        @if (visibleConstraints) {\n          <span [id]=\"constraintsId\" class=\"cx-drop-zone__constraints\">{{ visibleConstraints }}</span>\n        }\n      </div>\n\n      @if (!readonly) {\n        <span class=\"cx-drop-zone__primary-action\" (click)=\"$event.stopPropagation()\">\n          <cx-button\n            [text]=\"visibleActionText\"\n            icon=\"upload\"\n            mood=\"primary\"\n            [disabled]=\"disabled\"\n            (pressed)=\"openNativePicker()\"\n          />\n        </span>\n      }\n    </div>\n  } @else if (selectedFile; as file) {\n    <div class=\"cx-drop-zone__file-row\">\n      <cx-icon\n        class=\"cx-drop-zone__file-icon\"\n        [icon]=\"selectedFileIcon\"\n        size=\"32\"\n        shape=\"square-subtle\"\n      />\n\n      <div class=\"cx-drop-zone__file-copy\">\n        <span [id]=\"fileNameId\" class=\"cx-drop-zone__file-name\">{{ file.name }}</span>\n        @if (selectedFileMetadata) {\n          <span class=\"cx-drop-zone__file-meta\">{{ selectedFileMetadata }}</span>\n        }\n      </div>\n\n      @if (lifecycleMessages$().length && !isFailed) {\n        <cx-validation-message\n          class=\"cx-drop-zone__file-state\"\n          [messages]=\"lifecycleMessages$()\"\n        />\n      }\n\n      @if (showMutationActions) {\n        <div class=\"cx-drop-zone__actions\" (click)=\"$event.stopPropagation()\">\n          @if (isFailed) {\n            <cx-button\n              text=\"Try again\"\n              icon=\"reload\"\n              mood=\"primary\"\n              [disabled]=\"disabled\"\n              (pressed)=\"retryUpload()\"\n            />\n          }\n          <cx-button\n            [text]=\"visibleReplaceText\"\n            icon=\"upload\"\n            [disabled]=\"disabled\"\n            [transparent]=\"isFailed\"\n            (pressed)=\"openNativePicker()\"\n          />\n          <cx-button\n            text=\"Remove file\"\n            icon=\"delete\"\n            [transparent]=\"true\"\n            [disabled]=\"disabled\"\n            (pressed)=\"removeValue()\"\n          />\n        </div>\n      }\n    </div>\n\n    @if (isFailed) {\n      <cx-validation-message\n        class=\"cx-drop-zone__failure\"\n        [messages]=\"lifecycleMessages$()\"\n      />\n    }\n\n    @if (isUploading) {\n      <div class=\"cx-drop-zone__progress\">\n        <cx-progress-bar\n          [label]=\"uploadingLabel\"\n          [ariaLabel]=\"uploadProgressAriaLabel\"\n          [value]=\"measuredProgress$() ?? 0\"\n          [indeterminate]=\"measuredProgress$() === undefined\"\n          [showValue]=\"measuredProgress$() !== undefined\"\n        />\n      </div>\n    }\n  }\n</div>\n\n<span class=\"cx-drop-zone__announcement\" role=\"status\" aria-live=\"polite\">{{ announcement$() }}</span>\n\n@if (noticeMessages$().length) {\n  <cx-validation-message\n    [id]=\"noticeId\"\n    class=\"cx-drop-zone__notice\"\n    [messages]=\"noticeMessages$()\"\n  />\n}\n", styles: [":host{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm);container-type:inline-size}.cx-drop-zone__surface{position:relative;display:flex;width:100%;min-width:0;flex-direction:column;border:var(--border-width) solid var(--opacity-mid);border-radius:var(--radius-xl);box-sizing:border-box;background:var(--surface);transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-drop-zone__surface--empty{min-height:calc(var(--controller-size)*6);border-style:dashed;background:rgba(0,0,0,0);cursor:pointer}.cx-drop-zone__surface--populated{padding:var(--space-md);gap:var(--space-md)}.cx-drop-zone__surface:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-drop-zone__surface--empty:not(.cx-drop-zone__surface--disabled):not(.cx-drop-zone__surface--readonly):hover{border-style:solid;border-color:var(--border-hover);background:var(--opacity-low)}.cx-drop-zone__surface--empty:not(.cx-drop-zone__surface--disabled):not(.cx-drop-zone__surface--readonly):focus-within{border-style:solid;outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-drop-zone__surface--dragging,.cx-drop-zone__surface--dragging:hover{border-style:solid;border-color:var(--primary);background:var(--primary-opacity);cursor:copy}.cx-drop-zone__surface--readonly{cursor:default}.cx-drop-zone__surface--empty.cx-drop-zone__surface--readonly{min-height:0;border-style:solid;background:var(--opacity-low)}.cx-drop-zone__surface--disabled{cursor:not-allowed;opacity:var(--opacity-disabled)}.cx-drop-zone__surface--uploading{cursor:default}.cx-drop-zone__native-input{display:none}.cx-drop-zone__empty-content{display:flex;min-height:inherit;min-width:0;align-items:center;justify-content:center;flex-direction:column;gap:var(--space-lg);padding:var(--space-xl) var(--space-lg);box-sizing:border-box;text-align:center}.cx-drop-zone__surface--empty.cx-drop-zone__surface--readonly .cx-drop-zone__empty-content{min-height:0;align-items:flex-start;flex-direction:row;justify-content:flex-start;padding:var(--space-md);text-align:start}.cx-drop-zone__empty-icon{flex:0 0 auto}.cx-drop-zone__empty-copy,.cx-drop-zone__drag-copy,.cx-drop-zone__file-copy{display:flex;min-width:0;flex-direction:column}.cx-drop-zone__empty-copy{align-items:center;gap:var(--space-xs)}.cx-drop-zone__surface--empty.cx-drop-zone__surface--readonly .cx-drop-zone__empty-copy{align-items:flex-start;align-self:center}.cx-drop-zone__heading,.cx-drop-zone__description,.cx-drop-zone__constraints,.cx-drop-zone__file-name,.cx-drop-zone__file-meta{max-width:100%;overflow-wrap:anywhere}.cx-drop-zone__heading{color:var(--ink);font-size:var(--font-size-body-lg);font-weight:var(--font-weight-bold);line-height:var(--line-height-body)}.cx-drop-zone__description,.cx-drop-zone__constraints{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-drop-zone__constraints{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-drop-zone__primary-action{display:inline-flex}.cx-drop-zone__drag-prompt{display:flex;min-height:inherit;min-width:0;align-items:center;justify-content:center;gap:var(--space-sm);padding:var(--space-lg);box-sizing:border-box;text-align:start}.cx-drop-zone__drag-copy{gap:var(--space-2xs)}.cx-drop-zone__file-row{display:grid;min-width:0;align-items:center;grid-template-columns:auto minmax(8rem, 1fr) auto auto;gap:var(--space-sm)}.cx-drop-zone__file-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-drop-zone__file-copy{gap:var(--space-2xs)}.cx-drop-zone__file-name{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-drop-zone__file-meta{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-drop-zone__file-state{min-width:0;justify-self:end}.cx-drop-zone__actions{display:flex;min-width:0;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:var(--space-xs);grid-column:4}.cx-drop-zone__progress,.cx-drop-zone__failure{min-width:0;padding-inline-start:calc(32px + var(--space-sm))}.cx-drop-zone__notice{min-width:0}.cx-drop-zone__announcement{position:absolute;width:1px;height:1px;padding:0;border:0;margin:-1px;clip-path:inset(50%);overflow:hidden;white-space:nowrap}@container (max-width: 640px){.cx-drop-zone__file-row{grid-template-columns:auto minmax(0, 1fr)}.cx-drop-zone__file-state{grid-column:2;justify-self:start}.cx-drop-zone__actions{grid-column:1/-1;justify-content:flex-start;padding-top:var(--space-xs)}.cx-drop-zone__progress,.cx-drop-zone__failure{padding-inline-start:0}}@container (max-width: 380px){.cx-drop-zone__surface--populated{padding:var(--space-sm)}.cx-drop-zone__actions{align-items:stretch;flex-direction:column}.cx-drop-zone__actions cx-button{width:100%;--cx-button-width: 100%}}@media(prefers-reduced-motion: reduce){.cx-drop-zone__surface{transition:none}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxProgressBarComponent, selector: "cx-progress-bar", inputs: ["label", "ariaLabel", "hint", "mood", "showValue", "indeterminate", "valueLabel", "value", "max"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDropZoneComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-drop-zone', imports: [
                        CxButtonComponent,
                        CxIconComponent,
                        CxProgressBarComponent,
                        CxValidationMessageComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  #surface\n  class=\"cx-drop-zone__surface\"\n  [class.cx-drop-zone__surface--empty]=\"!hasValue\"\n  [class.cx-drop-zone__surface--populated]=\"hasValue\"\n  [class.cx-drop-zone__surface--dragging]=\"dragging$()\"\n  [class.cx-drop-zone__surface--readonly]=\"readonly\"\n  [class.cx-drop-zone__surface--disabled]=\"disabled\"\n  [class.cx-drop-zone__surface--uploading]=\"isUploading\"\n  role=\"group\"\n  tabindex=\"-1\"\n  [attr.aria-labelledby]=\"surfaceLabelledBy\"\n  (click)=\"onSurfaceClick()\"\n  (dragenter)=\"onDragEnter($event)\"\n  (dragover)=\"onDragOver($event)\"\n  (dragleave)=\"onDragLeave()\"\n  (drop)=\"onDrop($event)\"\n>\n  @if (!readonly) {\n    <input\n      #nativeInput\n      class=\"cx-drop-zone__native-input\"\n      type=\"file\"\n      tabindex=\"-1\"\n      [accept]=\"accept\"\n      [disabled]=\"disabled || isUploading\"\n      [attr.aria-label]=\"hasValue ? visibleReplaceText : visibleActionText\"\n      [attr.aria-describedby]=\"nativeInputDescribedBy\"\n      [attr.aria-invalid]=\"notice$()?.type === 'error' ? 'true' : null\"\n      (change)=\"onNativeInputChange($event)\"\n    />\n  }\n\n  @if (dragging$()) {\n    <div class=\"cx-drop-zone__drag-prompt\" aria-hidden=\"true\">\n      <cx-icon icon=\"upload\" size=\"32\" mood=\"primary\" shape=\"circle-subtle\" />\n      <div class=\"cx-drop-zone__drag-copy\">\n        <span [id]=\"headingId\" class=\"cx-drop-zone__heading\">{{ visibleHeading }}</span>\n        <span [id]=\"descriptionId\" class=\"cx-drop-zone__description\">{{ visibleDescription }}</span>\n      </div>\n    </div>\n  } @else if (!hasValue) {\n    <div class=\"cx-drop-zone__empty-content\">\n      <cx-icon\n        class=\"cx-drop-zone__empty-icon\"\n        [icon]=\"icon\"\n        [size]=\"readonly ? '32' : '64'\"\n        mood=\"primary\"\n        shape=\"circle-subtle\"\n      />\n\n      <div class=\"cx-drop-zone__empty-copy\">\n        <span [id]=\"headingId\" class=\"cx-drop-zone__heading\">{{ visibleHeading }}</span>\n        @if (visibleDescription) {\n          <span [id]=\"descriptionId\" class=\"cx-drop-zone__description\">{{ visibleDescription }}</span>\n        }\n        @if (visibleConstraints) {\n          <span [id]=\"constraintsId\" class=\"cx-drop-zone__constraints\">{{ visibleConstraints }}</span>\n        }\n      </div>\n\n      @if (!readonly) {\n        <span class=\"cx-drop-zone__primary-action\" (click)=\"$event.stopPropagation()\">\n          <cx-button\n            [text]=\"visibleActionText\"\n            icon=\"upload\"\n            mood=\"primary\"\n            [disabled]=\"disabled\"\n            (pressed)=\"openNativePicker()\"\n          />\n        </span>\n      }\n    </div>\n  } @else if (selectedFile; as file) {\n    <div class=\"cx-drop-zone__file-row\">\n      <cx-icon\n        class=\"cx-drop-zone__file-icon\"\n        [icon]=\"selectedFileIcon\"\n        size=\"32\"\n        shape=\"square-subtle\"\n      />\n\n      <div class=\"cx-drop-zone__file-copy\">\n        <span [id]=\"fileNameId\" class=\"cx-drop-zone__file-name\">{{ file.name }}</span>\n        @if (selectedFileMetadata) {\n          <span class=\"cx-drop-zone__file-meta\">{{ selectedFileMetadata }}</span>\n        }\n      </div>\n\n      @if (lifecycleMessages$().length && !isFailed) {\n        <cx-validation-message\n          class=\"cx-drop-zone__file-state\"\n          [messages]=\"lifecycleMessages$()\"\n        />\n      }\n\n      @if (showMutationActions) {\n        <div class=\"cx-drop-zone__actions\" (click)=\"$event.stopPropagation()\">\n          @if (isFailed) {\n            <cx-button\n              text=\"Try again\"\n              icon=\"reload\"\n              mood=\"primary\"\n              [disabled]=\"disabled\"\n              (pressed)=\"retryUpload()\"\n            />\n          }\n          <cx-button\n            [text]=\"visibleReplaceText\"\n            icon=\"upload\"\n            [disabled]=\"disabled\"\n            [transparent]=\"isFailed\"\n            (pressed)=\"openNativePicker()\"\n          />\n          <cx-button\n            text=\"Remove file\"\n            icon=\"delete\"\n            [transparent]=\"true\"\n            [disabled]=\"disabled\"\n            (pressed)=\"removeValue()\"\n          />\n        </div>\n      }\n    </div>\n\n    @if (isFailed) {\n      <cx-validation-message\n        class=\"cx-drop-zone__failure\"\n        [messages]=\"lifecycleMessages$()\"\n      />\n    }\n\n    @if (isUploading) {\n      <div class=\"cx-drop-zone__progress\">\n        <cx-progress-bar\n          [label]=\"uploadingLabel\"\n          [ariaLabel]=\"uploadProgressAriaLabel\"\n          [value]=\"measuredProgress$() ?? 0\"\n          [indeterminate]=\"measuredProgress$() === undefined\"\n          [showValue]=\"measuredProgress$() !== undefined\"\n        />\n      </div>\n    }\n  }\n</div>\n\n<span class=\"cx-drop-zone__announcement\" role=\"status\" aria-live=\"polite\">{{ announcement$() }}</span>\n\n@if (noticeMessages$().length) {\n  <cx-validation-message\n    [id]=\"noticeId\"\n    class=\"cx-drop-zone__notice\"\n    [messages]=\"noticeMessages$()\"\n  />\n}\n", styles: [":host{display:flex;width:100%;min-width:0;flex-direction:column;gap:var(--space-sm);container-type:inline-size}.cx-drop-zone__surface{position:relative;display:flex;width:100%;min-width:0;flex-direction:column;border:var(--border-width) solid var(--opacity-mid);border-radius:var(--radius-xl);box-sizing:border-box;background:var(--surface);transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-drop-zone__surface--empty{min-height:calc(var(--controller-size)*6);border-style:dashed;background:rgba(0,0,0,0);cursor:pointer}.cx-drop-zone__surface--populated{padding:var(--space-md);gap:var(--space-md)}.cx-drop-zone__surface:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-drop-zone__surface--empty:not(.cx-drop-zone__surface--disabled):not(.cx-drop-zone__surface--readonly):hover{border-style:solid;border-color:var(--border-hover);background:var(--opacity-low)}.cx-drop-zone__surface--empty:not(.cx-drop-zone__surface--disabled):not(.cx-drop-zone__surface--readonly):focus-within{border-style:solid;outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-drop-zone__surface--dragging,.cx-drop-zone__surface--dragging:hover{border-style:solid;border-color:var(--primary);background:var(--primary-opacity);cursor:copy}.cx-drop-zone__surface--readonly{cursor:default}.cx-drop-zone__surface--empty.cx-drop-zone__surface--readonly{min-height:0;border-style:solid;background:var(--opacity-low)}.cx-drop-zone__surface--disabled{cursor:not-allowed;opacity:var(--opacity-disabled)}.cx-drop-zone__surface--uploading{cursor:default}.cx-drop-zone__native-input{display:none}.cx-drop-zone__empty-content{display:flex;min-height:inherit;min-width:0;align-items:center;justify-content:center;flex-direction:column;gap:var(--space-lg);padding:var(--space-xl) var(--space-lg);box-sizing:border-box;text-align:center}.cx-drop-zone__surface--empty.cx-drop-zone__surface--readonly .cx-drop-zone__empty-content{min-height:0;align-items:flex-start;flex-direction:row;justify-content:flex-start;padding:var(--space-md);text-align:start}.cx-drop-zone__empty-icon{flex:0 0 auto}.cx-drop-zone__empty-copy,.cx-drop-zone__drag-copy,.cx-drop-zone__file-copy{display:flex;min-width:0;flex-direction:column}.cx-drop-zone__empty-copy{align-items:center;gap:var(--space-xs)}.cx-drop-zone__surface--empty.cx-drop-zone__surface--readonly .cx-drop-zone__empty-copy{align-items:flex-start;align-self:center}.cx-drop-zone__heading,.cx-drop-zone__description,.cx-drop-zone__constraints,.cx-drop-zone__file-name,.cx-drop-zone__file-meta{max-width:100%;overflow-wrap:anywhere}.cx-drop-zone__heading{color:var(--ink);font-size:var(--font-size-body-lg);font-weight:var(--font-weight-bold);line-height:var(--line-height-body)}.cx-drop-zone__description,.cx-drop-zone__constraints{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-drop-zone__constraints{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-drop-zone__primary-action{display:inline-flex}.cx-drop-zone__drag-prompt{display:flex;min-height:inherit;min-width:0;align-items:center;justify-content:center;gap:var(--space-sm);padding:var(--space-lg);box-sizing:border-box;text-align:start}.cx-drop-zone__drag-copy{gap:var(--space-2xs)}.cx-drop-zone__file-row{display:grid;min-width:0;align-items:center;grid-template-columns:auto minmax(8rem, 1fr) auto auto;gap:var(--space-sm)}.cx-drop-zone__file-icon{flex:0 0 auto;color:var(--opacity-high)}.cx-drop-zone__file-copy{gap:var(--space-2xs)}.cx-drop-zone__file-name{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-drop-zone__file-meta{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-drop-zone__file-state{min-width:0;justify-self:end}.cx-drop-zone__actions{display:flex;min-width:0;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:var(--space-xs);grid-column:4}.cx-drop-zone__progress,.cx-drop-zone__failure{min-width:0;padding-inline-start:calc(32px + var(--space-sm))}.cx-drop-zone__notice{min-width:0}.cx-drop-zone__announcement{position:absolute;width:1px;height:1px;padding:0;border:0;margin:-1px;clip-path:inset(50%);overflow:hidden;white-space:nowrap}@container (max-width: 640px){.cx-drop-zone__file-row{grid-template-columns:auto minmax(0, 1fr)}.cx-drop-zone__file-state{grid-column:2;justify-self:start}.cx-drop-zone__actions{grid-column:1/-1;justify-content:flex-start;padding-top:var(--space-xs)}.cx-drop-zone__progress,.cx-drop-zone__failure{padding-inline-start:0}}@container (max-width: 380px){.cx-drop-zone__surface--populated{padding:var(--space-sm)}.cx-drop-zone__actions{align-items:stretch;flex-direction:column}.cx-drop-zone__actions cx-button{width:100%;--cx-button-width: 100%}}@media(prefers-reduced-motion: reduce){.cx-drop-zone__surface{transition:none}}"] }]
        }], propDecorators: { nativeInputRef: [{
                type: ViewChild,
                args: ['nativeInput', { read: ElementRef }]
            }], surfaceRef: [{
                type: ViewChild,
                args: ['surface', { read: ElementRef }]
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], icon: [{
                type: Input
            }], actionText: [{
                type: Input
            }], replaceText: [{
                type: Input
            }], accept: [{
                type: Input
            }], maxSize: [{
                type: Input
            }], readonly: [{
                type: Input
            }], disabled: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], retry: [{
                type: Output
            }] } });
