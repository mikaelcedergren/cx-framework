import { EventEmitter, OnDestroy } from '@angular/core';
import { type CxFieldValidation, type CxFieldSize } from '../shared/field.types';
import * as i0 from "@angular/core";
export declare class CxSearchFieldComponent implements OnDestroy {
    private readonly valueState;
    private debounceTimer;
    label: string;
    ariaLabel: string | undefined;
    hint: string | undefined;
    optional: boolean;
    disabled: boolean;
    loading: boolean;
    clearable: boolean;
    size: CxFieldSize;
    validation: CxFieldValidation | null | undefined;
    set value(value: string | undefined);
    readonly valueChange: EventEmitter<string>;
    readonly focusChange: EventEmitter<boolean>;
    protected readonly value$: import("@angular/core").Signal<string>;
    protected onValueChange(value: string): void;
    protected onEscape(event: Event): void;
    protected clearSearch(): void;
    protected onFocusIn(): void;
    protected onFocusOut(event: FocusEvent): void;
    ngOnDestroy(): void;
    private scheduleValueChange;
    private clearDebounceTimer;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSearchFieldComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSearchFieldComponent, "cx-search-field", never, { "label": { "alias": "label"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "hint": { "alias": "hint"; "required": false; }; "optional": { "alias": "optional"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "clearable": { "alias": "clearable"; "required": false; }; "size": { "alias": "size"; "required": false; }; "validation": { "alias": "validation"; "required": false; }; "value": { "alias": "value"; "required": false; }; }, { "valueChange": "valueChange"; "focusChange": "focusChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-search-field.component.d.ts.map