import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../primitives/feedback/cx-validation-message';
import { CxCheckboxComponent } from '../../primitives/inputs/cx-checkbox';
import {
  type CxFileUpload,
  CxFileUploadComponent,
  type CxFileUploadValue,
} from '../../primitives/inputs/cx-file-upload';
import { CxInputComponent } from '../../primitives/inputs/cx-input';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio';
import { CxSelectComponent, type CxSelectOption } from '../../primitives/inputs/cx-select';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';
import { CxTextareaComponent } from '../../primitives/inputs/cx-textarea';
import {
  CxDynamicFieldsComponent,
  type CxDynamicFieldOption,
  type CxDynamicFieldValue,
} from '../cx-dynamic-fields';

export type CxLabeledRowRadioOption = {
  id: string;
  label: string;
};

export type CxLabeledRowSize = 'small' | 'default' | 'large';

export type CxLabeledRowContent =
  | {
      kind: 'text';
      text: string;
    }
  | {
      kind: 'input';
      value?: string;
      placeholder?: string;
      prependText?: string;
      appendText?: string;
      disabled?: boolean;
      errorMessage?: string;
    }
  | {
      kind: 'textarea';
      value?: string;
      placeholder?: string;
      rows?: number;
      autoGrow?: boolean;
      disabled?: boolean;
      errorMessage?: string;
    }
  | {
      kind: 'select';
      options: CxSelectOption[];
      value?: string;
      values?: string[];
      displayValue?: string;
      placeholder?: string;
      searchable?: boolean;
      multiple?: boolean;
      disabled?: boolean;
      errorMessage?: string;
    }
  | {
      kind: 'radio-group';
      options: CxLabeledRowRadioOption[];
      value?: string;
      disabled?: boolean;
      errorMessage?: string;
    }
  | {
      kind: 'checkbox';
      label: string;
      checked?: boolean;
      disabled?: boolean;
      errorMessage?: string;
    }
  | {
      kind: 'switch';
      label: string;
      checked?: boolean;
      disabled?: boolean;
      errorMessage?: string;
    }
  | {
      kind: 'file-upload';
      file?: CxFileUploadValue;
      buttonText?: string;
      buttonIcon?: CxFileUpload['buttonIcon'];
      disabled?: boolean;
    }
  | {
      kind: 'dynamic-fields';
      options: CxDynamicFieldOption[];
      fields?: CxDynamicFieldValue[];
      disabled?: boolean;
    };

@Component({
  selector: 'cx-labeled-row',
  imports: [
    CommonModule,
    CxValidationMessageComponent,
    CxCheckboxComponent,
    CxDynamicFieldsComponent,
    CxFileUploadComponent,
    CxInputComponent,
    CxRadioComponent,
    CxSelectComponent,
    CxSwitchComponent,
    CxTextareaComponent,
  ],
  templateUrl: './cx-labeled-row.component.html',
  styleUrl: './cx-labeled-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLabeledRowComponent {
  private readonly radioValueState = signal<string | undefined>(undefined);

  @Input() label = 'Label';
  @Input() size: CxLabeledRowSize = 'default';
  @Input() optional = false;

  protected get hasLabel(): boolean {
    return this.label.trim().length > 0;
  }

  @Input()
  public set content(value: CxLabeledRowContent) {
    this.contentInputBound = true;
    this.contentState = value;
    if (value.kind === 'radio-group') {
      this.radioValueState.set(value.value);
    }
  }

  public get content(): CxLabeledRowContent {
    return this.contentState;
  }

  @Output() readonly inputValueChange = new EventEmitter<string>();
  @Output() readonly selectValueChange = new EventEmitter<string | undefined>();
  @Output() readonly selectValuesChange = new EventEmitter<string[]>();
  @Output() readonly radioValueChange = new EventEmitter<string>();
  @Output() readonly checkboxCheckedChange = new EventEmitter<boolean>();
  @Output() readonly switchCheckedChange = new EventEmitter<boolean>();
  @Output() readonly fileUploadChange = new EventEmitter<CxFileUpload>();
  @Output() readonly dynamicFieldsChange = new EventEmitter<CxDynamicFieldValue[]>();

  protected contentInputBound = false;
  protected contentState: CxLabeledRowContent = {
    kind: 'text',
    text: 'Paste chaos here',
  };

  protected onInputValueChange(value: string): void {
    this.inputValueChange.emit(value);
  }

  protected onSelectValueChange(value: string | undefined): void {
    this.selectValueChange.emit(value);
  }

  protected onSelectValuesChange(value: string[]): void {
    this.selectValuesChange.emit(value);
  }

  protected onRadioSelect(value: string): void {
    this.radioValueState.set(value);
    this.radioValueChange.emit(value);
  }

  protected onCheckboxCheckedChange(value: boolean): void {
    this.checkboxCheckedChange.emit(value);
  }

  protected onSwitchCheckedChange(value: boolean): void {
    this.switchCheckedChange.emit(value);
  }

  protected onFileUpload(value: CxFileUpload): void {
    this.fileUploadChange.emit(value);
  }

  protected onDynamicFieldsChange(value: CxDynamicFieldValue[]): void {
    this.dynamicFieldsChange.emit(value);
  }

  protected isRadioSelected(optionId: string): boolean {
    return this.radioValueState() === optionId;
  }
}
