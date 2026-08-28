import { EventEmitter } from '@angular/core';
import { type CxToggleChipSize } from '../cx-toggle-chip';
import * as i0 from "@angular/core";
export type CxToggleChipGroupSelection = 'multiple' | 'single';
export interface CxToggleChipGroupOption {
    id: string;
    label: string;
    disabled?: boolean;
    ariaLabel?: string;
}
export declare class CxToggleChipGroupComponent {
    private readonly availableValuesState;
    private readonly selectedValuesState;
    set availableValues(values: readonly CxToggleChipGroupOption[] | undefined);
    get availableValues(): readonly CxToggleChipGroupOption[];
    selection: CxToggleChipGroupSelection;
    size: CxToggleChipSize;
    disabled: boolean;
    allowEmpty: boolean;
    set selectedValues(values: string[] | undefined);
    readonly selectedValuesChange: EventEmitter<string[]>;
    protected readonly availableValues$: import("@angular/core").Signal<readonly CxToggleChipGroupOption[]>;
    protected readonly selectedValues$: import("@angular/core").Signal<string[]>;
    protected readonly role$: import("@angular/core").Signal<"group" | "radiogroup">;
    protected isSelected(id: string): boolean;
    protected toggle(option: CxToggleChipGroupOption): void;
    private normalize;
    private normalizeOptions;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxToggleChipGroupComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxToggleChipGroupComponent, "cx-toggle-chip-group", never, { "availableValues": { "alias": "availableValues"; "required": false; }; "selection": { "alias": "selection"; "required": false; }; "size": { "alias": "size"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "allowEmpty": { "alias": "allowEmpty"; "required": false; }; "selectedValues": { "alias": "selectedValues"; "required": false; }; }, { "selectedValuesChange": "selectedValuesChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-toggle-chip-group.component.d.ts.map