import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxNullControllerOption = {
    id: string;
    label: string;
    hint?: string;
};
type CxResolvedNullControllerOption = {
    id: string;
    label: string;
    hint?: string;
};
export declare class CxNullControllerComponent {
    private readonly optionsState;
    private readonly enabledState;
    private readonly selectedIdState;
    label: string;
    description: string | undefined;
    switchLabel: string;
    disabled: boolean;
    set options(value: readonly CxNullControllerOption[] | null | undefined);
    set enabled(value: boolean);
    set selectedId(value: string | undefined);
    readonly enabledChange: EventEmitter<boolean>;
    readonly selectedIdChange: EventEmitter<string>;
    protected readonly options$: import("@angular/core").Signal<CxResolvedNullControllerOption[]>;
    protected readonly enabled$: import("@angular/core").Signal<boolean>;
    protected readonly hasLabel$: import("@angular/core").Signal<boolean>;
    protected readonly hasDescription$: import("@angular/core").Signal<boolean>;
    protected readonly radiosDisabled$: import("@angular/core").Signal<boolean>;
    protected isSelected(optionId: string): boolean;
    protected onEnabledChange(value: boolean): void;
    protected onOptionCheckedChange(optionId: string, checked: boolean): void;
    private ensureValidSelection;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxNullControllerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxNullControllerComponent, "cx-null-controller", never, { "label": { "alias": "label"; "required": false; }; "description": { "alias": "description"; "required": false; }; "switchLabel": { "alias": "switchLabel"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "options": { "alias": "options"; "required": false; }; "enabled": { "alias": "enabled"; "required": false; }; "selectedId": { "alias": "selectedId"; "required": false; }; }, { "enabledChange": "enabledChange"; "selectedIdChange": "selectedIdChange"; }, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-null-controller.component.d.ts.map