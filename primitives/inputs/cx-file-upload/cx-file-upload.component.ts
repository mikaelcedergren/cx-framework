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
import { CxButtonComponent } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { type CxIconName } from '../../../icons/manifest';

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
  disabled: boolean;
  hasFile: boolean;
  fileName: string;
};

@Component({
  selector: 'cx-file-upload',
  imports: [CxButtonComponent, CxIconButtonComponent],
  templateUrl: './cx-file-upload.component.html',
  styleUrl: './cx-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFileUploadComponent {
  private readonly fileState = signal<CxFileUploadValue | undefined>(undefined);

  @ViewChild('nativeInput', { read: ElementRef })
  private nativeInputRef?: ElementRef<HTMLInputElement>;

  @Input() buttonText = 'Upload file';
  @Input() buttonIcon: CxIconName | undefined = 'upload';
  @Input() disabled = false;

  @Input()
  public set file(value: CxFileUploadValue | File | null | undefined) {
    this.fileState.set(value ? this.normalizeFile(value) : undefined);
  }

  @Output() readonly fileUpload = new EventEmitter<CxFileUpload>();

  protected readonly file$ = this.fileState.asReadonly();
  protected readonly hasFile$ = computed(() => this.file$() !== undefined);
  protected readonly fileName$ = computed(() => this.file$()?.name ?? '');
  protected readonly visibleButtonText$ = computed(() => this.buttonText?.trim() || 'Upload file');

  protected get clearAriaLabel(): string {
    const fileName = this.fileName$();
    return fileName ? `Clear ${fileName}` : 'Clear file';
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
    const fileList = target?.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    this.fileState.set(this.normalizeFile(fileList[0]));
    this.fileUpload.emit(this.snapshot());
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

  protected clearFile(): void {
    if (this.disabled) {
      return;
    }

    this.fileState.set(undefined);
    const nativeInput = this.nativeInputRef?.nativeElement;
    if (nativeInput) {
      nativeInput.value = '';
    }
    this.fileUpload.emit(this.snapshot());
  }

  private snapshot(): CxFileUpload {
    const file = this.fileState();
    return {
      buttonText: this.visibleButtonText$(),
      buttonIcon: this.buttonIcon,
      file,
      disabled: this.disabled,
      hasFile: file !== undefined,
      fileName: file?.name ?? '',
    };
  }
}
