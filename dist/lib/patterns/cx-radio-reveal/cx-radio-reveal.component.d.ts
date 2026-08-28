import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxRadioRevealOption = {
    id: string;
    label: string;
    hint?: string;
    revealHint?: string;
};
type CxResolvedRadioRevealOption = {
    id: string;
    label: string;
    hint?: string;
    revealHint?: string;
};
export declare class CxRadioRevealComponent {
    private readonly optionsState;
    private readonly selectedIdState;
    protected readonly revealValueState: import("@angular/core").WritableSignal<string>;
    label: string;
    disabled: boolean;
    set options(value: readonly CxRadioRevealOption[] | null | undefined);
    set selectedId(value: string | undefined);
    set revealValue(value: string | undefined);
    readonly selectedIdChange: EventEmitter<string>;
    readonly revealValueChange: EventEmitter<string>;
    protected readonly options$: import("@angular/core").Signal<CxResolvedRadioRevealOption[]>;
    protected readonly selectedId$: import("@angular/core").Signal<string>;
    protected readonly selectedRevealOption$: import("@angular/core").Signal<CxResolvedRadioRevealOption | undefined>;
    protected readonly hasLabel$: import("@angular/core").Signal<boolean>;
    protected onOptionCheckedChange(optionId: string, checked: boolean): void;
    protected onRevealValueChange(value: string): void;
    protected getRevealAriaLabel(option: CxResolvedRadioRevealOption): string;
    private ensureValidSelection;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxRadioRevealComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxRadioRevealComponent, "cx-radio-reveal", never, { "label": { "alias": "label"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "options": { "alias": "options"; "required": false; }; "selectedId": { "alias": "selectedId"; "required": false; }; "revealValue": { "alias": "revealValue"; "required": false; }; }, { "selectedIdChange": "selectedIdChange"; "revealValueChange": "revealValueChange"; }, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-radio-reveal.component.d.ts.map