import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxCheckboxValue = 'deselected' | 'selected' | 'indeterminate';
export declare class CxCheckboxComponent {
    private static nextId;
    private readonly valueState;
    protected readonly hintId: string;
    text: string;
    ariaLabel: string | undefined;
    hint: string | undefined;
    disabled: boolean;
    set selected(value: boolean);
    set value(value: CxCheckboxValue | null | undefined);
    readonly selectedChange: EventEmitter<boolean>;
    readonly valueChange: EventEmitter<CxCheckboxValue>;
    readonly focusChange: EventEmitter<boolean>;
    protected readonly value$: import("@angular/core").Signal<CxCheckboxValue>;
    protected readonly selected$: () => boolean;
    protected readonly indeterminate$: () => boolean;
    protected readonly visibleText$: () => string;
    protected readonly visibleHint$: () => string | undefined;
    protected readonly hasContent$: () => boolean;
    protected readonly resolvedAriaLabel$: () => string | null;
    protected onNativeChange(event: Event): void;
    protected onFocus(focused: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxCheckboxComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxCheckboxComponent, "cx-checkbox", never, { "text": { "alias": "text"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "hint": { "alias": "hint"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; "value": { "alias": "value"; "required": false; }; }, { "selectedChange": "selectedChange"; "valueChange": "valueChange"; "focusChange": "focusChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-checkbox.component.d.ts.map