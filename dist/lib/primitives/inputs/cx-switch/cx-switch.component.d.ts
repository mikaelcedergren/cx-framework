import { EventEmitter } from '@angular/core';
import { type CxFieldValidation } from '../shared/field.types';
import * as i0 from "@angular/core";
export type CxSwitchSize = 'default' | 'small';
export declare class CxSwitchComponent {
    private static nextId;
    private readonly selectedState;
    private readonly validationState;
    protected readonly hintId: string;
    protected readonly messagesId: string;
    text: string;
    ariaLabel?: string;
    hint: string | undefined;
    size: CxSwitchSize;
    disabled: boolean;
    set validation(value: CxFieldValidation | null | undefined);
    set selected(value: boolean);
    readonly selectedChange: EventEmitter<boolean>;
    readonly focusChange: EventEmitter<boolean>;
    protected readonly selected$: import("@angular/core").Signal<boolean>;
    protected readonly validationMessages$: () => readonly import("../shared/field.types").CxRenderedValidationMessage[];
    protected readonly hasError$: () => boolean;
    protected readonly showHint$: () => boolean;
    protected readonly describedByIds$: import("@angular/core").Signal<string | undefined>;
    protected onNativeChange(event: Event): void;
    protected onFocusChange(focused: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSwitchComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSwitchComponent, "cx-switch", never, { "text": { "alias": "text"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "hint": { "alias": "hint"; "required": false; }; "size": { "alias": "size"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "validation": { "alias": "validation"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; }, { "selectedChange": "selectedChange"; "focusChange": "focusChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-switch.component.d.ts.map