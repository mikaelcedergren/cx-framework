import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxDynamicFieldOption = {
    id: string;
    label: string;
    hint?: string;
    masked?: boolean;
};
export type CxDynamicFieldValue = {
    id: string;
    value: string;
};
export declare class CxDynamicFieldsComponent {
    private readonly optionsState;
    private readonly fieldsState;
    disabled: boolean;
    set options(value: CxDynamicFieldOption[] | null | undefined);
    set fields(value: CxDynamicFieldValue[] | null | undefined);
    readonly fieldsChange: EventEmitter<CxDynamicFieldValue[]>;
    protected readonly resolvedFields$: import("@angular/core").Signal<{
        label: string;
        hint: string;
        masked: boolean;
        id: string;
        value: string;
    }[]>;
    protected readonly addableOptions$: import("@angular/core").Signal<CxDynamicFieldOption[]>;
    protected onFieldValueChange(fieldId: string, value: string): void;
    protected onRemoveField(fieldId: string): void;
    protected onAddField(fieldId: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxDynamicFieldsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxDynamicFieldsComponent, "cx-dynamic-fields", never, { "disabled": { "alias": "disabled"; "required": false; }; "options": { "alias": "options"; "required": false; }; "fields": { "alias": "fields"; "required": false; }; }, { "fieldsChange": "fieldsChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-dynamic-fields.component.d.ts.map