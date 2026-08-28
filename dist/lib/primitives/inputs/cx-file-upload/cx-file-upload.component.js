import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
const WRONG_TYPE_MESSAGE = {
    type: 'error',
    message: "File type isn't supported. Choose a supported file type.",
};
const TOO_LARGE_MESSAGE = {
    type: 'error',
    message: 'File is too large. Choose a smaller file.',
};
const SINGLE_FILE_MESSAGE = {
    type: 'warning',
    message: 'Only one file can be added. Keeping the first.',
};
export class CxFileUploadComponent {
    filesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filesState" }] : /* istanbul ignore next */ []));
    noticeState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "noticeState" }] : /* istanbul ignore next */ []));
    draggingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draggingState" }] : /* istanbul ignore next */ []));
    dragDepth = 0;
    nativeInputRef;
    variant = 'button';
    buttonText = 'Upload file';
    buttonIcon = 'upload';
    icon = 'upload';
    heading = '';
    hint;
    accept;
    maxSize;
    multiple = false;
    disabled = false;
    files = [];
    fileUpload = new EventEmitter();
    ngOnChanges(changes) {
        if (changes['files']) {
            this.filesState.set(this.limitFiles((this.files ?? []).map(item => this.normalizeFile(item))));
            return;
        }
        if (changes['multiple'] && !this.multiple) {
            this.filesState.update(files => this.limitFiles(files));
        }
    }
    files$ = this.filesState.asReadonly();
    dragging$ = this.draggingState.asReadonly();
    visibleButtonText$ = computed(() => this.buttonText?.trim() || 'Upload file', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleButtonText$" }] : /* istanbul ignore next */ []));
    errorMessages$ = computed(() => {
        const notice = this.noticeState();
        return notice ? [notice] : [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "errorMessages$" }] : /* istanbul ignore next */ []));
    /** Files shown and reported. A single-file control owns an array of zero or one item. */
    get visibleFiles() {
        return this.files$();
    }
    get hasFiles() {
        return this.visibleFiles.length > 0;
    }
    get firstFileName() {
        return this.visibleFiles[0]?.name ?? '';
    }
    get resolvedHeading() {
        if (this.dragging$()) {
            return this.multiple ? 'Drop files to upload' : 'Drop file to upload';
        }
        const heading = this.heading.trim();
        if (heading) {
            return heading;
        }
        return this.multiple ? 'Drag files here or click to browse' : 'Drag a file here or click to browse';
    }
    get hasHint() {
        return Boolean(this.hint?.trim());
    }
    get clearAriaLabel() {
        const fileName = this.firstFileName;
        return fileName ? `Remove ${fileName}` : 'Remove file';
    }
    removeAriaLabel(file) {
        return `Remove ${file.name}`;
    }
    formatSize(size) {
        if (size === undefined || size === null || Number.isNaN(size)) {
            return '';
        }
        if (size < 1024) {
            return `${size} B`;
        }
        if (size < 1024 * 1024) {
            return `${Math.round(size / 1024)} KB`;
        }
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    onZoneClick() {
        this.openNativePicker();
    }
    openNativePicker() {
        if (this.disabled) {
            return;
        }
        const nativeInput = this.nativeInputRef?.nativeElement;
        if (!nativeInput) {
            return;
        }
        nativeInput.value = '';
        nativeInput.click();
    }
    onNativeInputChange(event) {
        const target = event.target;
        this.ingestFiles(target?.files ?? null);
    }
    onDragEnter(event) {
        if (this.disabled) {
            this.resetDrag();
            return;
        }
        if (!this.hasFilePayload(event)) {
            return;
        }
        event.preventDefault();
        this.dragDepth += 1;
        this.draggingState.set(true);
    }
    onDragOver(event) {
        if (this.disabled) {
            this.resetDrag();
            return;
        }
        if (!this.hasFilePayload(event)) {
            return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }
    onDragLeave() {
        if (this.disabled) {
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
        if (this.disabled) {
            return;
        }
        this.ingestFiles(event.dataTransfer?.files ?? null);
    }
    resetDrag() {
        this.dragDepth = 0;
        this.draggingState.set(false);
    }
    removeFile(target) {
        if (this.disabled) {
            return;
        }
        this.filesState.set(this.files$().filter(file => file !== target));
        this.noticeState.set(undefined);
        this.resetNativeInput();
        this.fileUpload.emit(this.snapshot());
    }
    clearFile() {
        if (this.disabled) {
            return;
        }
        this.filesState.set([]);
        this.noticeState.set(undefined);
        this.resetNativeInput();
        this.fileUpload.emit(this.snapshot());
    }
    ingestFiles(fileList) {
        if (this.disabled || !fileList || fileList.length === 0) {
            return;
        }
        const incoming = Array.from(fileList).map(file => this.normalizeFile(file));
        const accepted = [];
        let rejectedType = false;
        let rejectedSize = false;
        for (const file of incoming) {
            if (!this.matchesAccept(file)) {
                rejectedType = true;
                continue;
            }
            if (this.exceedsMaxSize(file)) {
                rejectedSize = true;
                continue;
            }
            accepted.push(file);
        }
        if (accepted.length > 0) {
            if (this.multiple) {
                this.filesState.set(this.mergeFiles(this.files$(), accepted));
            }
            else {
                this.filesState.set(this.limitFiles(accepted));
            }
        }
        if (rejectedType) {
            this.noticeState.set(WRONG_TYPE_MESSAGE);
        }
        else if (rejectedSize) {
            this.noticeState.set(TOO_LARGE_MESSAGE);
        }
        else if (!this.multiple && accepted.length > 1) {
            this.noticeState.set(SINGLE_FILE_MESSAGE);
        }
        else {
            this.noticeState.set(undefined);
        }
        if (accepted.length > 0 || rejectedType || rejectedSize) {
            this.fileUpload.emit(this.snapshot());
        }
    }
    mergeFiles(current, additions) {
        const merged = [...current];
        for (const addition of additions) {
            const isDuplicate = merged.some(file => file.name === addition.name && file.size === addition.size);
            if (!isDuplicate) {
                merged.push(addition);
            }
        }
        return merged;
    }
    limitFiles(files) {
        return this.multiple ? files : files.slice(0, 1);
    }
    matchesAccept(file) {
        const accept = this.accept?.trim();
        if (!accept) {
            return true;
        }
        const tokens = accept
            .split(',')
            .map(token => token.trim().toLowerCase())
            .filter(Boolean);
        if (tokens.length === 0) {
            return true;
        }
        const name = file.name.toLowerCase();
        const type = (file.type ?? '').toLowerCase();
        return tokens.some(token => {
            if (token.startsWith('.')) {
                return name.endsWith(token);
            }
            if (!type) {
                return false;
            }
            if (token.endsWith('/*')) {
                return type.startsWith(token.slice(0, -1));
            }
            return type === token;
        });
    }
    exceedsMaxSize(file) {
        return this.maxSize !== undefined && file.size !== undefined && file.size > this.maxSize;
    }
    hasFilePayload(event) {
        const types = event.dataTransfer?.types;
        return types ? Array.from(types).includes('Files') : true;
    }
    normalizeFile(file) {
        const isNativeFile = typeof File !== 'undefined' && file instanceof File;
        const uploadValue = file;
        return {
            name: file.name.trim(),
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            file: isNativeFile ? file : uploadValue.file,
        };
    }
    resetNativeInput() {
        const nativeInput = this.nativeInputRef?.nativeElement;
        if (nativeInput) {
            nativeInput.value = '';
        }
    }
    snapshot() {
        const files = [...this.visibleFiles];
        return {
            buttonText: this.visibleButtonText$(),
            buttonIcon: this.buttonIcon,
            files,
            disabled: this.disabled,
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxFileUploadComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxFileUploadComponent, isStandalone: true, selector: "cx-file-upload", inputs: { variant: "variant", buttonText: "buttonText", buttonIcon: "buttonIcon", icon: "icon", heading: "heading", hint: "hint", accept: "accept", maxSize: "maxSize", multiple: "multiple", disabled: "disabled", files: "files" }, outputs: { fileUpload: "fileUpload" }, host: { properties: { "class.cx-file-upload--zone": "variant === 'zone'" } }, viewQueries: [{ propertyName: "nativeInputRef", first: true, predicate: ["nativeInput"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<input\n  #nativeInput\n  class=\"cx-file-upload__native-input\"\n  type=\"file\"\n  aria-label=\"File upload\"\n  [accept]=\"accept\"\n  [multiple]=\"multiple\"\n  [disabled]=\"disabled\"\n  (change)=\"onNativeInputChange($event)\"\n/>\n\n@if (variant === 'zone') {\n  <div\n    class=\"cx-file-upload__zone\"\n    [class.cx-file-upload__zone--dragging]=\"dragging$()\"\n    [class.cx-file-upload__zone--disabled]=\"disabled\"\n    (click)=\"onZoneClick()\"\n    (dragenter)=\"onDragEnter($event)\"\n    (dragover)=\"onDragOver($event)\"\n    (dragleave)=\"onDragLeave()\"\n    (drop)=\"onDrop($event)\"\n  >\n    @if (icon) {\n      <cx-icon class=\"cx-file-upload__zone-icon\" [icon]=\"icon\" size=\"32\" />\n    }\n\n    <div class=\"cx-file-upload__zone-heading\">{{ resolvedHeading }}</div>\n\n    @if (hasHint) {\n      <div class=\"cx-file-upload__zone-hint\">{{ hint }}</div>\n    }\n\n    <span class=\"cx-file-upload__zone-action\" (click)=\"$event.stopPropagation()\">\n      <cx-button [text]=\"visibleButtonText$()\" [disabled]=\"disabled\" (pressed)=\"openNativePicker()\" />\n    </span>\n  </div>\n\n  @if (errorMessages$().length) {\n    <cx-validation-message class=\"cx-file-upload__error\" [messages]=\"errorMessages$()\" />\n  }\n\n  @if (hasFiles) {\n    <ng-container [ngTemplateOutlet]=\"fileList\" />\n  }\n} @else {\n  @if (!hasFiles) {\n    <cx-button\n      class=\"cx-file-upload__button\"\n      [text]=\"visibleButtonText$()\"\n      [icon]=\"buttonIcon\"\n      [disabled]=\"disabled\"\n      (pressed)=\"openNativePicker()\"\n    />\n  } @else if (!multiple) {\n    <div class=\"cx-file-upload__selected\">\n      <div\n        class=\"cx-file-upload__name\"\n        [cxTooltip]=\"firstFileName\"\n        [cxTooltipOverflow]=\"true\"\n      >{{ firstFileName }}</div>\n      <cx-icon-button\n        icon=\"remove\"\n        mood=\"default\"\n        [disabled]=\"disabled\"\n        [ariaLabel]=\"clearAriaLabel\"\n        (pressed)=\"clearFile()\"\n      />\n    </div>\n  } @else {\n    <cx-button\n      class=\"cx-file-upload__button\"\n      [text]=\"visibleButtonText$()\"\n      [icon]=\"buttonIcon\"\n      [disabled]=\"disabled\"\n      (pressed)=\"openNativePicker()\"\n    />\n    <ng-container [ngTemplateOutlet]=\"fileList\" />\n  }\n\n  @if (errorMessages$().length) {\n    <cx-validation-message class=\"cx-file-upload__error\" [messages]=\"errorMessages$()\" />\n  }\n}\n\n<ng-template #fileList>\n  <ul class=\"cx-file-upload__list\" aria-live=\"polite\">\n    @for (file of visibleFiles; track $index) {\n      <li class=\"cx-file-upload__row\">\n        <cx-icon class=\"cx-file-upload__row-icon\" icon=\"document\" size=\"20\" />\n        <div\n          class=\"cx-file-upload__row-name\"\n          [cxTooltip]=\"file.name\"\n          [cxTooltipOverflow]=\"true\"\n        >{{ file.name }}</div>\n        @if (formatSize(file.size); as size) {\n          <div class=\"cx-file-upload__row-size\">{{ size }}</div>\n        }\n        <cx-icon-button\n          icon=\"remove\"\n          mood=\"default\"\n          variant=\"transparent\"\n          size=\"small\"\n          [disabled]=\"disabled\"\n          [ariaLabel]=\"removeAriaLabel(file)\"\n          (pressed)=\"removeFile(file)\"\n        />\n      </li>\n    }\n  </ul>\n</ng-template>\n", styles: [":host{display:flex;flex-direction:column;gap:var(--space-sm);width:100%}.cx-file-upload__native-input{display:none}.cx-file-upload__button{width:100%;--cx-button-width: 100%}.cx-file-upload__selected{display:flex;width:100%;align-items:center;gap:var(--space-sm)}.cx-file-upload__name{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-file-upload__zone{display:flex;flex-direction:column;align-items:center;gap:var(--space-xs);padding:var(--space-xl) var(--space-lg);border:var(--border-width) dashed var(--opacity-mid);border-radius:var(--radius-xl);background:rgba(0,0,0,0);text-align:center;cursor:pointer;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-file-upload__zone:hover{border-color:var(--border-hover);background:var(--opacity-low)}.cx-file-upload__zone:focus-within{border-color:var(--border-open)}.cx-file-upload__zone--dragging,.cx-file-upload__zone--dragging:hover{border-style:solid;border-color:var(--primary);background:var(--primary-opacity)}.cx-file-upload__zone--disabled{cursor:not-allowed;opacity:var(--opacity-disabled)}.cx-file-upload__zone--disabled:hover{border-color:var(--opacity-mid);background:rgba(0,0,0,0)}.cx-file-upload__zone-icon{color:var(--opacity-high)}.cx-file-upload__zone-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-file-upload__zone-hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-file-upload__zone-action{display:inline-flex;padding-top:var(--space-sm)}.cx-file-upload__list{display:flex;flex-direction:column;gap:var(--space-2xs);margin:0;padding:0;list-style:none}.cx-file-upload__row{display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-md);background:var(--opacity-low)}.cx-file-upload__row-icon{flex:0 0 auto;color:var(--opacity-mid)}.cx-file-upload__row-name{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-file-upload__row-size{flex:0 0 auto;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxFileUploadComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-file-upload', imports: [
                        NgTemplateOutlet,
                        CxButtonComponent,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxTooltipDirective,
                        CxValidationMessageComponent,
                    ], host: {
                        '[class.cx-file-upload--zone]': "variant === 'zone'",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<input\n  #nativeInput\n  class=\"cx-file-upload__native-input\"\n  type=\"file\"\n  aria-label=\"File upload\"\n  [accept]=\"accept\"\n  [multiple]=\"multiple\"\n  [disabled]=\"disabled\"\n  (change)=\"onNativeInputChange($event)\"\n/>\n\n@if (variant === 'zone') {\n  <div\n    class=\"cx-file-upload__zone\"\n    [class.cx-file-upload__zone--dragging]=\"dragging$()\"\n    [class.cx-file-upload__zone--disabled]=\"disabled\"\n    (click)=\"onZoneClick()\"\n    (dragenter)=\"onDragEnter($event)\"\n    (dragover)=\"onDragOver($event)\"\n    (dragleave)=\"onDragLeave()\"\n    (drop)=\"onDrop($event)\"\n  >\n    @if (icon) {\n      <cx-icon class=\"cx-file-upload__zone-icon\" [icon]=\"icon\" size=\"32\" />\n    }\n\n    <div class=\"cx-file-upload__zone-heading\">{{ resolvedHeading }}</div>\n\n    @if (hasHint) {\n      <div class=\"cx-file-upload__zone-hint\">{{ hint }}</div>\n    }\n\n    <span class=\"cx-file-upload__zone-action\" (click)=\"$event.stopPropagation()\">\n      <cx-button [text]=\"visibleButtonText$()\" [disabled]=\"disabled\" (pressed)=\"openNativePicker()\" />\n    </span>\n  </div>\n\n  @if (errorMessages$().length) {\n    <cx-validation-message class=\"cx-file-upload__error\" [messages]=\"errorMessages$()\" />\n  }\n\n  @if (hasFiles) {\n    <ng-container [ngTemplateOutlet]=\"fileList\" />\n  }\n} @else {\n  @if (!hasFiles) {\n    <cx-button\n      class=\"cx-file-upload__button\"\n      [text]=\"visibleButtonText$()\"\n      [icon]=\"buttonIcon\"\n      [disabled]=\"disabled\"\n      (pressed)=\"openNativePicker()\"\n    />\n  } @else if (!multiple) {\n    <div class=\"cx-file-upload__selected\">\n      <div\n        class=\"cx-file-upload__name\"\n        [cxTooltip]=\"firstFileName\"\n        [cxTooltipOverflow]=\"true\"\n      >{{ firstFileName }}</div>\n      <cx-icon-button\n        icon=\"remove\"\n        mood=\"default\"\n        [disabled]=\"disabled\"\n        [ariaLabel]=\"clearAriaLabel\"\n        (pressed)=\"clearFile()\"\n      />\n    </div>\n  } @else {\n    <cx-button\n      class=\"cx-file-upload__button\"\n      [text]=\"visibleButtonText$()\"\n      [icon]=\"buttonIcon\"\n      [disabled]=\"disabled\"\n      (pressed)=\"openNativePicker()\"\n    />\n    <ng-container [ngTemplateOutlet]=\"fileList\" />\n  }\n\n  @if (errorMessages$().length) {\n    <cx-validation-message class=\"cx-file-upload__error\" [messages]=\"errorMessages$()\" />\n  }\n}\n\n<ng-template #fileList>\n  <ul class=\"cx-file-upload__list\" aria-live=\"polite\">\n    @for (file of visibleFiles; track $index) {\n      <li class=\"cx-file-upload__row\">\n        <cx-icon class=\"cx-file-upload__row-icon\" icon=\"document\" size=\"20\" />\n        <div\n          class=\"cx-file-upload__row-name\"\n          [cxTooltip]=\"file.name\"\n          [cxTooltipOverflow]=\"true\"\n        >{{ file.name }}</div>\n        @if (formatSize(file.size); as size) {\n          <div class=\"cx-file-upload__row-size\">{{ size }}</div>\n        }\n        <cx-icon-button\n          icon=\"remove\"\n          mood=\"default\"\n          variant=\"transparent\"\n          size=\"small\"\n          [disabled]=\"disabled\"\n          [ariaLabel]=\"removeAriaLabel(file)\"\n          (pressed)=\"removeFile(file)\"\n        />\n      </li>\n    }\n  </ul>\n</ng-template>\n", styles: [":host{display:flex;flex-direction:column;gap:var(--space-sm);width:100%}.cx-file-upload__native-input{display:none}.cx-file-upload__button{width:100%;--cx-button-width: 100%}.cx-file-upload__selected{display:flex;width:100%;align-items:center;gap:var(--space-sm)}.cx-file-upload__name{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-file-upload__zone{display:flex;flex-direction:column;align-items:center;gap:var(--space-xs);padding:var(--space-xl) var(--space-lg);border:var(--border-width) dashed var(--opacity-mid);border-radius:var(--radius-xl);background:rgba(0,0,0,0);text-align:center;cursor:pointer;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-file-upload__zone:hover{border-color:var(--border-hover);background:var(--opacity-low)}.cx-file-upload__zone:focus-within{border-color:var(--border-open)}.cx-file-upload__zone--dragging,.cx-file-upload__zone--dragging:hover{border-style:solid;border-color:var(--primary);background:var(--primary-opacity)}.cx-file-upload__zone--disabled{cursor:not-allowed;opacity:var(--opacity-disabled)}.cx-file-upload__zone--disabled:hover{border-color:var(--opacity-mid);background:rgba(0,0,0,0)}.cx-file-upload__zone-icon{color:var(--opacity-high)}.cx-file-upload__zone-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-file-upload__zone-hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-file-upload__zone-action{display:inline-flex;padding-top:var(--space-sm)}.cx-file-upload__list{display:flex;flex-direction:column;gap:var(--space-2xs);margin:0;padding:0;list-style:none}.cx-file-upload__row{display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-md);background:var(--opacity-low)}.cx-file-upload__row-icon{flex:0 0 auto;color:var(--opacity-mid)}.cx-file-upload__row-name{min-width:0;flex:1 1 auto;overflow:hidden;color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-file-upload__row-size{flex:0 0 auto;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}"] }]
        }], propDecorators: { nativeInputRef: [{
                type: ViewChild,
                args: ['nativeInput', { read: ElementRef }]
            }], variant: [{
                type: Input
            }], buttonText: [{
                type: Input
            }], buttonIcon: [{
                type: Input
            }], icon: [{
                type: Input
            }], heading: [{
                type: Input
            }], hint: [{
                type: Input
            }], accept: [{
                type: Input
            }], maxSize: [{
                type: Input
            }], multiple: [{
                type: Input
            }], disabled: [{
                type: Input
            }], files: [{
                type: Input
            }], fileUpload: [{
                type: Output
            }] } });
