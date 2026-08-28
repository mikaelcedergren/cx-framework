export type CxFieldSize = 'small' | 'default' | 'large';
export type CxFieldUpdateOn = 'input' | 'blur' | 'debounced';
export type CxValidationMessageType = 'status' | 'info' | 'success' | 'warning' | 'error';
export type CxValidationMessage = {
    type?: CxValidationMessageType;
    message?: string | null;
};
export type CxFieldValidation = CxValidationMessage | string;
export type CxRenderedValidationMessage = {
    id: string;
    type: CxValidationMessageType;
    message: string;
};
export declare function normalizeCxValidation(validation: CxFieldValidation | null | undefined): ReadonlyArray<CxRenderedValidationMessage>;
export declare function normalizeCxValidationMessages(messages: ReadonlyArray<CxValidationMessage> | null | undefined, fallbackErrorMessage?: string | null): ReadonlyArray<CxRenderedValidationMessage>;
export declare function normalizeCxValidationMessageType(type: CxValidationMessageType | null | undefined): CxValidationMessageType;
//# sourceMappingURL=field.types.d.ts.map