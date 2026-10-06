import * as i0 from "@angular/core";
export type CxSpinnerSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
export type CxSpinnerMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export declare class CxSpinnerComponent {
    protected readonly size$: import("@angular/core").WritableSignal<CxSpinnerSize>;
    mood: CxSpinnerMood;
    /** Accessible label. Defaults to "Loading" for the indeterminate spinner. */
    ariaLabel: string | undefined;
    set size(value: CxSpinnerSize | undefined);
    get size(): CxSpinnerSize;
    protected resolvedAriaLabel$(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSpinnerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSpinnerComponent, "cx-spinner", never, { "mood": { "alias": "mood"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "size": { "alias": "size"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-spinner.component.d.ts.map