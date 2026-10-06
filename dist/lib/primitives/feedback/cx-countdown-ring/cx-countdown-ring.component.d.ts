import * as i0 from "@angular/core";
export type CxCountdownRingDirection = 'clockwise' | 'counterclockwise';
export type CxCountdownRingSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
export type CxCountdownRingMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
interface CxCountdownRingSegment {
    index: number;
    dash: string;
    offset: string;
    filled: boolean;
}
export declare class CxCountdownRingComponent {
    protected readonly size$: import("@angular/core").WritableSignal<CxCountdownRingSize>;
    private readonly segmentsState;
    private readonly remainingState;
    private readonly directionState;
    mood: CxCountdownRingMood;
    /** Optional accessible label. Otherwise exposes the number of pieces remaining. */
    ariaLabel: string | undefined;
    /** Direction in which pieces empty, starting at the top of the ring. */
    set direction(value: CxCountdownRingDirection);
    get direction(): CxCountdownRingDirection;
    /** Total pieces in the ring. Use a positive whole number. */
    set segments(value: number);
    get segments(): number;
    /** Pieces remaining. The consumer owns timing and supplies a whole number from 0 to segments. */
    set remaining(value: number);
    get remaining(): number;
    set size(value: CxCountdownRingSize | undefined);
    get size(): CxCountdownRingSize;
    protected readonly segmentArcs$: import("@angular/core").Signal<CxCountdownRingSegment[]>;
    protected resolvedAriaLabel$(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxCountdownRingComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxCountdownRingComponent, "cx-countdown-ring", never, { "mood": { "alias": "mood"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "direction": { "alias": "direction"; "required": false; }; "segments": { "alias": "segments"; "required": false; }; "remaining": { "alias": "remaining"; "required": false; }; "size": { "alias": "size"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-countdown-ring.component.d.ts.map