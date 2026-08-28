import { EventEmitter } from '@angular/core';
import { type CxFileUpload, type CxFileUploadValue } from '../../primitives/inputs/cx-file-upload';
import { type CxIconName } from '../../icons/manifest';
import { type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';
import { type CxTextAreaSizing } from '../../primitives/inputs/cx-text-area';
import { type CxFieldValidation } from '../../primitives/inputs/shared/field.types';
import { type CxDynamicFieldOption, type CxDynamicFieldValue } from '../cx-dynamic-fields';
import * as i0 from "@angular/core";
export type CxLabeledRowRadioOption = {
    id: string;
    label: string;
};
export type CxLabeledRowSize = 'small' | 'default' | 'large';
export type CxLabeledRowContent = {
    kind: 'text';
    text: string;
} | {
    kind: 'input';
    value?: string;
    hint?: string;
    prependText?: string;
    appendText?: string;
    disabled?: boolean;
    validation?: CxFieldValidation;
} | {
    kind: 'textarea';
    value?: string;
    hint?: string;
    minLines?: number;
    sizing?: CxTextAreaSizing;
    disabled?: boolean;
    validation?: CxFieldValidation;
} | {
    kind: 'select';
    options: CxDropdownOption[];
    value?: string;
    values?: string[];
    placeholder?: string;
    searchable?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    validation?: CxFieldValidation;
} | {
    kind: 'radio-group';
    options: CxLabeledRowRadioOption[];
    value?: string;
    disabled?: boolean;
    validation?: CxFieldValidation;
} | {
    kind: 'checkbox';
    label: string;
    checked?: boolean;
    disabled?: boolean;
    validation?: CxFieldValidation;
} | {
    kind: 'switch';
    label: string;
    checked?: boolean;
    disabled?: boolean;
    validation?: CxFieldValidation;
} | {
    kind: 'file-upload';
    files?: ReadonlyArray<CxFileUploadValue | File>;
    multiple?: boolean;
    buttonText?: string;
    buttonIcon?: CxIconName;
    disabled?: boolean;
} | {
    kind: 'dynamic-fields';
    options: CxDynamicFieldOption[];
    fields?: CxDynamicFieldValue[];
    disabled?: boolean;
};
export declare class CxLabeledRowComponent {
    private readonly radioValueState;
    private readonly hostElement;
    private readonly group;
    /** A row placed directly in a cx-labeled-row-group defers its label column to the group. */
    protected get grouped(): boolean;
    label: string;
    size: CxLabeledRowSize;
    optional: boolean;
    protected get hasLabel(): boolean;
    set content(value: CxLabeledRowContent);
    get content(): CxLabeledRowContent;
    readonly inputValueChange: EventEmitter<string>;
    readonly selectValueChange: EventEmitter<string | undefined>;
    readonly selectValuesChange: EventEmitter<string[]>;
    readonly radioValueChange: EventEmitter<string>;
    readonly checkboxCheckedChange: EventEmitter<boolean>;
    readonly switchCheckedChange: EventEmitter<boolean>;
    readonly fileUploadChange: EventEmitter<CxFileUpload>;
    readonly dynamicFieldsChange: EventEmitter<CxDynamicFieldValue[]>;
    protected contentInputBound: boolean;
    protected contentState: CxLabeledRowContent;
    protected onInputValueChange(value: string): void;
    protected onSelectValueChange(value: string | undefined): void;
    protected onSelectValuesChange(value: string[]): void;
    protected onRadioSelect(value: string): void;
    protected onCheckboxCheckedChange(value: boolean): void;
    protected onSwitchCheckedChange(value: boolean): void;
    protected onFileUpload(value: CxFileUpload): void;
    protected onDynamicFieldsChange(value: CxDynamicFieldValue[]): void;
    protected isRadioSelected(optionId: string): boolean;
    protected validationMessages(validation: CxFieldValidation | null | undefined): readonly import("../../public-api").CxRenderedValidationMessage[];
    static ɵfac: i0.ɵɵFactoryDeclaration<CxLabeledRowComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxLabeledRowComponent, "cx-labeled-row", never, { "label": { "alias": "label"; "required": false; }; "size": { "alias": "size"; "required": false; }; "optional": { "alias": "optional"; "required": false; }; "content": { "alias": "content"; "required": false; }; }, { "inputValueChange": "inputValueChange"; "selectValueChange": "selectValueChange"; "selectValuesChange": "selectValuesChange"; "radioValueChange": "radioValueChange"; "checkboxCheckedChange": "checkboxCheckedChange"; "switchCheckedChange": "switchCheckedChange"; "fileUploadChange": "fileUploadChange"; "dynamicFieldsChange": "dynamicFieldsChange"; }, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-labeled-row.component.d.ts.map