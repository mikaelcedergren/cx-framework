import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxRatingSize = 'small' | 'default' | 'large';
/**
 * A star (or custom-icon) rating. Interactive by default for capturing a score;
 * `readonly` turns it into a display that supports fractional values such as 3.5.
 */
export declare class CxRatingComponent {
    private readonly valueState;
    private readonly maxState;
    private readonly hoverState;
    private readonlyState;
    private disabledState;
    icon: CxIconName;
    size: CxRatingSize;
    ariaLabel: string;
    set readonly(value: boolean);
    get readonly(): boolean;
    set disabled(value: boolean);
    get disabled(): boolean;
    set value(value: number | null | undefined);
    set max(value: number | null | undefined);
    readonly valueChange: EventEmitter<number>;
    protected readonly value$: import("@angular/core").Signal<number>;
    protected readonly max$: import("@angular/core").Signal<number>;
    protected readonly stars$: import("@angular/core").Signal<number[]>;
    protected readonly displayValue$: import("@angular/core").Signal<number>;
    protected get iconSize(): number;
    protected get interactive(): boolean;
    protected get valueText(): string;
    protected fillPercent(index: number): number;
    protected onStarEnter(index: number): void;
    protected onLeave(): void;
    protected onStarClick(index: number): void;
    protected onKeydown(event: KeyboardEvent): void;
    private commit;
    private clamp;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxRatingComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxRatingComponent, "cx-rating", never, { "icon": { "alias": "icon"; "required": false; }; "size": { "alias": "size"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "value": { "alias": "value"; "required": false; }; "max": { "alias": "max"; "required": false; }; }, { "valueChange": "valueChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-rating.component.d.ts.map