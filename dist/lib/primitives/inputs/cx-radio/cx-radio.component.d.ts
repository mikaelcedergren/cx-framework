import { EventEmitter } from '@angular/core';
import { type CxFieldValidation } from '../shared/field.types';
import * as i0 from "@angular/core";
export declare class CxRadioComponent {
    private static nextId;
    private readonly baseId;
    private readonly selectedState;
    private readonly validationState;
    text: string;
    hint: string | undefined;
    disabled: boolean;
    set validation(value: CxFieldValidation | null | undefined);
    set selected(value: boolean);
    readonly selectedChange: EventEmitter<boolean>;
    protected readonly selected$: import("@angular/core").Signal<boolean>;
    protected readonly validationMessages$: () => readonly import("../shared/field.types").CxRenderedValidationMessage[];
    protected readonly hasError$: () => boolean;
    protected readonly showHint$: () => boolean;
    protected readonly hasText$: () => boolean;
    protected readonly hintId: string;
    protected readonly messagesId: string;
    protected readonly describedBy$: () => string | null;
    protected activate(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxRadioComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxRadioComponent, "cx-radio", never, { "text": { "alias": "text"; "required": false; }; "hint": { "alias": "hint"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "validation": { "alias": "validation"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; }, { "selectedChange": "selectedChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-radio.component.d.ts.map