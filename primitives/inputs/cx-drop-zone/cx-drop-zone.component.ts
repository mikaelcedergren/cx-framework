import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent } from '../../actions/cx-button';
import { CxProgressBarComponent } from '../../feedback/cx-progress-bar';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxValidationMessage } from '../shared/field.types';
import {
  cxFileSelectionMessage,
  formatCxAcceptedFileTypes,
  formatCxFileConstraints,
  formatCxFileSize,
  normalizeCxFileValue,
  selectCxFiles,
  type CxFileValue,
} from '../shared/file-selection';

export type CxDropZoneValue =
  | {
      readonly state: 'selected';
      readonly file: CxFileValue;
    }
  | {
      readonly state: 'uploading';
      readonly file: CxFileValue;
      readonly progress?: number;
      readonly message?: string;
    }
  | {
      readonly state: 'complete';
      readonly file: CxFileValue;
      readonly message?: string;
    }
  | {
      readonly state: 'failed';
      readonly file: CxFileValue;
      readonly message?: string;
    };

let nextDropZoneId = 0;

@Component({
  selector: 'cx-drop-zone',
  imports: [
    CxButtonComponent,
    CxIconComponent,
    CxProgressBarComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-drop-zone.component.html',
  styleUrl: './cx-drop-zone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDropZoneComponent implements OnChanges, OnDestroy {
  private readonly valueState = signal<CxDropZoneValue | null>(null);
  private readonly noticeState = signal<CxValidationMessage | undefined>(undefined);
  private readonly draggingState = signal(false);
  private readonly announcementState = signal('');
  private dragDepth = 0;
  private replacementNoticeRevealTimer: ReturnType<typeof setTimeout> | undefined;
  private replacementNoticeTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly instanceId = ++nextDropZoneId;
  protected readonly headingId = `cx-drop-zone-heading-${this.instanceId}`;
  protected readonly descriptionId = `cx-drop-zone-description-${this.instanceId}`;
  protected readonly constraintsId = `cx-drop-zone-constraints-${this.instanceId}`;
  protected readonly fileNameId = `cx-drop-zone-file-${this.instanceId}`;
  protected readonly noticeId = `cx-drop-zone-notice-${this.instanceId}`;

  @ViewChild('nativeInput', { read: ElementRef })
  private nativeInputRef?: ElementRef<HTMLInputElement>;

  @ViewChild('surface', { read: ElementRef })
  private surfaceRef?: ElementRef<HTMLDivElement>;

  @Input() heading = 'Add a file';
  @Input() description = 'Drag and drop a file here.';
  @Input() icon: CxIconName = 'upload';
  @Input() actionText = 'Choose file';
  @Input() replaceText = 'Replace file';
  @Input() accept: string | undefined;
  @Input() maxSize: number | undefined;
  @Input() readonly = false;
  @Input() disabled = false;

  @Input()
  public set value(value: CxDropZoneValue | null | undefined) {
    const normalized = this.normalizeValue(value);
    this.valueState.set(normalized);
    if (!normalized || normalized.state !== 'selected') {
      this.clearNotice();
    }
    if (!this.canSelect) {
      this.resetDrag();
    }
  }

  public get value(): CxDropZoneValue | null {
    return this.valueState();
  }

  @Output() readonly valueChange = new EventEmitter<CxDropZoneValue | null>();
  @Output() readonly retry = new EventEmitter<CxFileValue>();

  public ngOnChanges(changes: SimpleChanges): void {
    if ((changes['disabled'] && this.disabled) || (changes['readonly'] && this.readonly)) {
      this.resetDrag();
    }
    if (changes['accept'] || changes['maxSize'] || changes['readonly']) {
      this.clearNotice();
    }
  }

  public ngOnDestroy(): void {
    this.clearReplacementNoticeTimers();
  }

  protected readonly dragging$ = this.draggingState.asReadonly();
  protected readonly selectedValue$ = this.valueState.asReadonly();
  protected readonly notice$ = this.noticeState.asReadonly();
  protected readonly announcement$ = this.announcementState.asReadonly();

  protected readonly noticeMessages$ = computed<readonly CxValidationMessage[]>(() => {
    const notice = this.noticeState();
    return notice ? [notice] : [];
  });

  protected readonly lifecycleMessages$ = computed<readonly CxValidationMessage[]>(() => {
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
  });

  protected readonly measuredProgress$ = computed<number | undefined>(() => {
    const value = this.valueState();
    if (value?.state !== 'uploading') {
      return undefined;
    }
    const progress = value.progress;
    return Number.isFinite(progress) && progress !== undefined && progress >= 0 && progress <= 100
      ? progress
      : undefined;
  });

  protected get hasValue(): boolean {
    return this.selectedValue$() !== null;
  }

  protected get isUploading(): boolean {
    return this.selectedValue$()?.state === 'uploading';
  }

  protected get isFailed(): boolean {
    return this.selectedValue$()?.state === 'failed';
  }

  protected get canSelect(): boolean {
    return !this.disabled && !this.readonly && !this.isUploading;
  }

  protected get showMutationActions(): boolean {
    return this.hasValue && !this.readonly && !this.isUploading;
  }

  protected get surfaceLabelledBy(): string {
    return this.hasValue && !this.dragging$() ? this.fileNameId : this.headingId;
  }

  protected get nativeInputDescribedBy(): string | null {
    const ids: string[] = [];
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

  protected get visibleHeading(): string {
    if (this.dragging$()) {
      return this.hasValue ? 'Drop file to replace' : 'Drop file to add';
    }
    if (this.readonly && !this.hasValue) {
      return 'No file added';
    }
    return this.heading.trim() || 'Add a file';
  }

  protected get visibleDescription(): string {
    if (this.dragging$()) {
      return 'Release to use this file.';
    }
    if (this.readonly && !this.hasValue) {
      return '';
    }
    return this.description.trim();
  }

  protected get visibleConstraints(): string {
    if (this.dragging$() || this.readonly) {
      return '';
    }
    return formatCxFileConstraints(this.accept, this.maxSize);
  }

  protected get visibleActionText(): string {
    return this.actionText.trim() || 'Choose file';
  }

  protected get visibleReplaceText(): string {
    return this.replaceText.trim() || 'Replace file';
  }

  protected get selectedFile(): CxFileValue | null {
    return this.selectedValue$()?.file ?? null;
  }

  protected get selectedFileMetadata(): string {
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

  protected get selectedFileIcon(): CxIconName {
    const file = this.selectedFile;
    return file ? this.fileIcon(file) : 'document';
  }

  protected get uploadingLabel(): string {
    const value = this.selectedValue$();
    return value?.state === 'uploading'
      ? this.resolvedLifecycleMessage(value, 'Uploading file…')
      : 'Uploading file…';
  }

  protected get uploadProgressAriaLabel(): string {
    const name = this.selectedFile?.name;
    return name ? `Upload progress for ${name}` : 'Upload progress';
  }

  protected onSurfaceClick(): void {
    if (!this.hasValue) {
      this.openNativePicker();
    }
  }

  protected openNativePicker(): void {
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

  protected onNativeInputChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.ingestFiles(input?.files ?? null);
  }

  protected onDragEnter(event: DragEvent): void {
    if (!this.canSelect || !this.hasFilePayload(event)) {
      this.resetDrag();
      return;
    }
    event.preventDefault();
    this.dragDepth += 1;
    this.draggingState.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.canSelect || !this.hasFilePayload(event)) {
      this.resetDrag();
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  protected onDragLeave(): void {
    if (!this.canSelect) {
      this.resetDrag();
      return;
    }
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.draggingState.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.resetDrag();
    if (this.canSelect) {
      this.ingestFiles(event.dataTransfer?.files ?? null);
    }
  }

  protected removeValue(): void {
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

  protected retryUpload(): void {
    const value = this.selectedValue$();
    if (value?.state !== 'failed' || this.disabled || this.readonly) {
      return;
    }
    this.clearNotice();
    this.retry.emit(value.file);
    this.scheduleSurfaceFocus();
  }

  private ingestFiles(fileList: FileList | null): void {
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

    const nextValue: CxDropZoneValue = { state: 'selected', file: accepted };
    this.valueState.set(nextValue);
    this.resetNativeInput();

    if (replacing && !selectionNotice) {
      this.showReplacementNotice();
    } else {
      if (!selectionNotice) {
        this.clearNotice();
      }
      this.announcementState.set(
        replacing ? `${accepted.name} replaced.` : `${accepted.name} selected.`,
      );
    }
    this.valueChange.emit(nextValue);
    this.scheduleSurfaceFocus();
  }

  private normalizeValue(value: CxDropZoneValue | null | undefined): CxDropZoneValue | null {
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

  private resolvedLifecycleMessage(
    value: Exclude<CxDropZoneValue, { state: 'selected' }>,
    fallback: string,
  ): string {
    return value.message?.trim() || fallback;
  }

  private showReplacementNotice(): void {
    const restartVisibleNotice = this.noticeState()?.message === 'File replaced.';
    this.clearReplacementNoticeTimers();

    const revealNotice = (): void => {
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

  private clearNotice(): void {
    this.clearReplacementNoticeTimers();
    this.noticeState.set(undefined);
  }

  private clearReplacementNoticeTimers(): void {
    if (this.replacementNoticeRevealTimer !== undefined) {
      clearTimeout(this.replacementNoticeRevealTimer);
      this.replacementNoticeRevealTimer = undefined;
    }
    if (this.replacementNoticeTimer !== undefined) {
      clearTimeout(this.replacementNoticeTimer);
      this.replacementNoticeTimer = undefined;
    }
  }

  private resetDrag(): void {
    this.dragDepth = 0;
    this.draggingState.set(false);
  }

  private resetNativeInput(): void {
    const input = this.nativeInputRef?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private scheduleSurfaceFocus(): void {
    queueMicrotask(() => this.surfaceRef?.nativeElement.focus({ preventScroll: true }));
  }

  private hasFilePayload(event: DragEvent): boolean {
    const types = event.dataTransfer?.types;
    return types ? Array.from(types).includes('Files') : true;
  }

  private fileIcon(value: CxFileValue): CxIconName {
    const extension = value.name.split('.').pop()?.toLowerCase();
    const iconByExtension: Readonly<Record<string, CxIconName>> = {
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
}
