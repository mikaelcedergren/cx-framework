import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CxLabeledRowGroupComponent } from './cx-labeled-row-group.component';
import { CxValidationMessageComponent } from '../../primitives/feedback/cx-validation-message';
import { CxCheckboxComponent } from '../../primitives/inputs/cx-checkbox';
import {
  type CxFileUpload,
  CxFileUploadComponent,
  type CxFileUploadValue,
} from '../../primitives/inputs/cx-file-upload';
import { type CxIconName } from '../../icons/manifest';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio';
import { CxDropdownComponent, type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';
import { CxTextAreaComponent, type CxTextAreaSizing } from '../../primitives/inputs/cx-text-area';
import { type CxFieldValidation, normalizeCxValidation } from '../../primitives/inputs/shared/field.types';
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
      hint?: string;
      prependText?: string;
      appendText?: string;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'textarea';
      value?: string;
      hint?: string;
      minLines?: number;
      sizing?: CxTextAreaSizing;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'select';
      options: CxDropdownOption[];
      value?: string;
      values?: string[];
      placeholder?: string;
      searchable?: boolean;
      multiple?: boolean;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'radio-group';
      options: CxLabeledRowRadioOption[];
      value?: string;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'checkbox';
      label: string;
      checked?: boolean;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'switch';
      label: string;
      checked?: boolean;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'file-upload';
      files?: ReadonlyArray<CxFileUploadValue | File>;
      multiple?: boolean;
      buttonText?: string;
      buttonIcon?: CxIconName;
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
    CxTextFieldComponent,
    CxRadioComponent,
    CxDropdownComponent,
    CxSwitchComponent,
    CxTextAreaComponent,
  ],
  templateUrl: './cx-labeled-row.component.html',
  styleUrl: './cx-labeled-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLabeledRowComponent {
  private readonly radioValueState = signal<string | undefined>(undefined);
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly group = inject(CxLabeledRowGroupComponent, { optional: true });

  /** A row placed directly in a cx-labeled-row-group defers its label column to the group. */
  @HostBinding('class.cx-labeled-row--grouped')
  protected get grouped(): boolean {
    const parent = this.hostElement.parentElement;
    return parent !== null && (this.group?.isGridElement(parent) ?? false);
  }

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

  protected validationMessages(validation: CxFieldValidation | null | undefined) {
    return normalizeCxValidation(validation);
  }
}
