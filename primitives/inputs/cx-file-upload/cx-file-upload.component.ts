import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CxButtonComponent } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { type CxValidationMessage } from '../shared/field.types';
import { type CxIconName } from '../../../icons/manifest';

export type CxFileUploadVariant = 'button' | 'zone';

export type CxFileUploadValue = {
  name: string;
  size?: number;
  type?: string;
  lastModified?: number;
  file?: File;
};

export type CxFileUpload = {
  buttonText: string;
  buttonIcon: CxIconName | undefined;
  file: CxFileUploadValue | undefined;
  files: readonly CxFileUploadValue[];
  disabled: boolean;
  hasFile: boolean;
  fileName: string;
};

const WRONG_TYPE_MESSAGE: CxValidationMessage = {
  type: 'error',
  message: "File type isn't supported. Choose a supported file type.",
};
const TOO_LARGE_MESSAGE: CxValidationMessage = {
  type: 'error',
  message: 'File is too large. Choose a smaller file.',
};
const SINGLE_FILE_MESSAGE: CxValidationMessage = {
  type: 'warning',
  message: 'Only one file can be added. Keeping the first.',
};

@Component({
  selector: 'cx-file-upload',
  imports: [
    NgTemplateOutlet,
    CxButtonComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-file-upload.component.html',
  styleUrl: './cx-file-upload.component.scss',
  host: {
    '[class.cx-file-upload--zone]': "variant === 'zone'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFileUploadComponent {
  private readonly filesState = signal<readonly CxFileUploadValue[]>([]);
  private readonly noticeState = signal<CxValidationMessage | undefined>(undefined);
  private readonly draggingState = signal(false);
  private dragDepth = 0;

  @ViewChild('nativeInput', { read: ElementRef })
  private nativeInputRef?: ElementRef<HTMLInputElement>;

  @Input() variant: CxFileUploadVariant = 'button';
  @Input() buttonText = 'Upload file';
  @Input() buttonIcon: CxIconName | undefined = 'upload';
  @Input() icon: CxIconName | undefined = 'upload';
  @Input() heading = '';
  @Input() hint: string | undefined;
  @Input() accept: string | undefined;
  @Input() maxSize: number | undefined;
  @Input() multiple = false;
  @Input() disabled = false;

  @Input()
  public set file(value: CxFileUploadValue | File | null | undefined) {
    this.filesState.set(value ? [this.normalizeFile(value)] : []);
  }

  @Input()
  public set files(value: ReadonlyArray<CxFileUploadValue | File> | null | undefined) {
    this.filesState.set((value ?? []).map(item => this.normalizeFile(item)));
  }

  @Output() readonly fileUpload = new EventEmitter<CxFileUpload>();

  protected readonly files$ = this.filesState.asReadonly();
  protected readonly dragging$ = this.draggingState.asReadonly();
  protected readonly visibleButtonText$ = computed(() => this.buttonText?.trim() || 'Upload file');

  protected readonly errorMessages$ = computed<readonly CxValidationMessage[]>(() => {
    const notice = this.noticeState();
    return notice ? [notice] : [];
  });

  /** Files shown and reported. A single-file control never surfaces more than the first. */
  protected get visibleFiles(): readonly CxFileUploadValue[] {
    const files = this.files$();
    return this.multiple ? files : files.slice(0, 1);
  }

  protected get hasFiles(): boolean {
    return this.visibleFiles.length > 0;
  }

  protected get firstFileName(): string {
    return this.visibleFiles[0]?.name ?? '';
  }

  protected get resolvedHeading(): string {
    if (this.dragging$()) {
      return this.multiple ? 'Drop files to upload' : 'Drop file to upload';
    }
    const heading = this.heading.trim();
    if (heading) {
      return heading;
    }
    return this.multiple ? 'Drag files here or click to browse' : 'Drag a file here or click to browse';
  }

  protected get hasHint(): boolean {
    return Boolean(this.hint?.trim());
  }

  protected get clearAriaLabel(): string {
    const fileName = this.firstFileName;
    return fileName ? `Remove ${fileName}` : 'Remove file';
  }

  protected removeAriaLabel(file: CxFileUploadValue): string {
    return `Remove ${file.name}`;
  }

  protected formatSize(size: number | undefined): string {
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

  protected onZoneClick(): void {
    this.openNativePicker();
  }

  protected openNativePicker(): void {
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

  protected onNativeInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.ingestFiles(target?.files ?? null);
  }

  protected onDragEnter(event: DragEvent): void {
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

  protected onDragOver(event: DragEvent): void {
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

  protected onDragLeave(): void {
    if (this.disabled) {
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
    if (this.disabled) {
      return;
    }
    this.ingestFiles(event.dataTransfer?.files ?? null);
  }

  private resetDrag(): void {
    this.dragDepth = 0;
    this.draggingState.set(false);
  }

  protected removeFile(target: CxFileUploadValue): void {
    if (this.disabled) {
      return;
    }
    this.filesState.set(this.files$().filter(file => file !== target));
    this.noticeState.set(undefined);
    this.resetNativeInput();
    this.fileUpload.emit(this.snapshot());
  }

  protected clearFile(): void {
    if (this.disabled) {
      return;
    }
    this.filesState.set([]);
    this.noticeState.set(undefined);
    this.resetNativeInput();
    this.fileUpload.emit(this.snapshot());
  }

  private ingestFiles(fileList: FileList | null): void {
    if (this.disabled || !fileList || fileList.length === 0) {
      return;
    }

    const incoming = Array.from(fileList).map(file => this.normalizeFile(file));
    const accepted: CxFileUploadValue[] = [];
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
      } else {
        this.filesState.set([accepted[0]]);
      }
    }

    if (rejectedType) {
      this.noticeState.set(WRONG_TYPE_MESSAGE);
    } else if (rejectedSize) {
      this.noticeState.set(TOO_LARGE_MESSAGE);
    } else if (!this.multiple && accepted.length > 1) {
      this.noticeState.set(SINGLE_FILE_MESSAGE);
    } else {
      this.noticeState.set(undefined);
    }

    if (accepted.length > 0 || rejectedType || rejectedSize) {
      this.fileUpload.emit(this.snapshot());
    }
  }

  private mergeFiles(
    current: readonly CxFileUploadValue[],
    additions: readonly CxFileUploadValue[],
  ): CxFileUploadValue[] {
    const merged = [...current];
    for (const addition of additions) {
      const isDuplicate = merged.some(file => file.name === addition.name && file.size === addition.size);
      if (!isDuplicate) {
        merged.push(addition);
      }
    }
    return merged;
  }

  private matchesAccept(file: CxFileUploadValue): boolean {
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

  private exceedsMaxSize(file: CxFileUploadValue): boolean {
    return this.maxSize !== undefined && file.size !== undefined && file.size > this.maxSize;
  }

  private hasFilePayload(event: DragEvent): boolean {
    const types = event.dataTransfer?.types;
    return types ? Array.from(types).includes('Files') : true;
  }

  private normalizeFile(file: CxFileUploadValue | File): CxFileUploadValue {
    const isNativeFile = typeof File !== 'undefined' && file instanceof File;
    const uploadValue = file as CxFileUploadValue;
    return {
      name: file.name.trim(),
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file: isNativeFile ? file : uploadValue.file,
    };
  }

  private resetNativeInput(): void {
    const nativeInput = this.nativeInputRef?.nativeElement;
    if (nativeInput) {
      nativeInput.value = '';
    }
  }

  private snapshot(): CxFileUpload {
    const files = this.visibleFiles;
    const first = files[0];
    return {
      buttonText: this.visibleButtonText$(),
      buttonIcon: this.buttonIcon,
      file: first,
      files,
      disabled: this.disabled,
      hasFile: files.length > 0,
      fileName: first?.name ?? '',
    };
  }
}
