import * as i0 from "@angular/core";
export type CxSpinnerSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
export type CxSpinnerMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
interface CxSpinnerSegment {
    index: number;
    dash: string;
    offset: string;
    filled: boolean;
}
export declare class CxSpinnerComponent {
    protected readonly size$: import("@angular/core").WritableSignal<CxSpinnerSize>;
    private readonly segmentsState;
    private readonly valueState;
    mood: CxSpinnerMood;
    /** Accessible label. Defaults to "Loading" for the indeterminate spinner. */
    ariaLabel: string | undefined;
    /**
     * When set to a positive integer, the spinner becomes a determinate ring
     * divided into this many segments — used for countdown timers. Leave unset
     * (null) for the default indeterminate loading spinner.
     */
    set segments(value: number | null | undefined);
    get segments(): number | null;
    /** Number of filled (remaining) segments in countdown mode, clamped to 0..segments. */
    set value(value: number | undefined);
    get value(): number;
    set size(value: CxSpinnerSize | undefined);
    get size(): CxSpinnerSize;
    protected readonly mode$: import("@angular/core").Signal<"spin" | "countdown">;
    protected readonly segmentArcs$: import("@angular/core").Signal<CxSpinnerSegment[]>;
    protected readonly resolvedAriaLabel$: import("@angular/core").Signal<string>;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSpinnerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSpinnerComponent, "cx-spinner", never, { "mood": { "alias": "mood"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "segments": { "alias": "segments"; "required": false; }; "value": { "alias": "value"; "required": false; }; "size": { "alias": "size"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-spinner.component.d.ts.map