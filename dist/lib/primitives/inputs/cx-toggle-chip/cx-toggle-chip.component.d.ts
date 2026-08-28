import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxToggleChipSize = 'default' | 'small' | 'large';
export declare class CxToggleChipComponent {
    private readonly selectedState;
    text: string;
    size: CxToggleChipSize;
    ariaLabel: string | undefined;
    disabled: boolean;
    set selected(value: boolean);
    readonly selectedChange: EventEmitter<boolean>;
    protected readonly selected$: import("@angular/core").Signal<boolean>;
    protected toggle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxToggleChipComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxToggleChipComponent, "cx-toggle-chip", never, { "text": { "alias": "text"; "required": false; }; "size": { "alias": "size"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; }, { "selectedChange": "selectedChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-toggle-chip.component.d.ts.map