import * as i0 from "@angular/core";
export type CxProgressBarMood = 'default' | 'accent' | 'success' | 'danger';
export declare class CxProgressBarComponent {
    private readonly valueState;
    private readonly maxState;
    private readonly instanceId;
    protected readonly labelId: string;
    protected readonly hintId: string;
    label: string;
    ariaLabel: string | undefined;
    hint: string | undefined;
    mood: CxProgressBarMood;
    showValue: boolean;
    indeterminate: boolean;
    valueLabel: string | undefined;
    set value(value: number);
    set max(value: number);
    protected readonly normalizedValue$: import("@angular/core").Signal<number>;
    protected readonly max$: import("@angular/core").Signal<number>;
    protected progressRatio(): number;
    protected progressPercent(): number;
    protected resolvedValueLabel(): string | undefined;
    protected visibleLabel(): string;
    protected visibleHint(): string;
    protected resolvedAriaLabel(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxProgressBarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxProgressBarComponent, "cx-progress-bar", never, { "label": { "alias": "label"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "hint": { "alias": "hint"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "showValue": { "alias": "showValue"; "required": false; }; "indeterminate": { "alias": "indeterminate"; "required": false; }; "valueLabel": { "alias": "valueLabel"; "required": false; }; "value": { "alias": "value"; "required": false; }; "max": { "alias": "max"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-progress-bar.component.d.ts.map