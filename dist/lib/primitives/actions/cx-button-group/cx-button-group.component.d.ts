import { AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export interface CxButtonGroupOption {
    id: string;
    label?: string;
    icon?: CxIconName;
    disabled?: boolean;
}
export interface CxButtonGroupButton {
    id: string;
    name: string;
    icon?: CxIconName;
    disabled: boolean;
    selected: boolean;
}
export type CxButtonGroupSize = 'default' | 'small';
export declare class CxButtonGroupComponent implements AfterViewInit, OnDestroy {
    private readonly rowRef?;
    private readonly buttonRefs?;
    private readonly availableValuesState;
    private readonly valueState;
    private readonly sizeState;
    private readonly disabledState;
    private readonly fillState;
    protected readonly indicatorVisible$: import("@angular/core").WritableSignal<boolean>;
    private readonly indicatorX$;
    private readonly indicatorY$;
    private readonly indicatorWidth$;
    private readonly indicatorHeight$;
    private buttonChangesSubscription?;
    private resizeObserver?;
    private animationFrameId;
    /** Accessible name for the single-choice group. */
    ariaLabel: string | undefined;
    set availableValues(value: CxButtonGroupOption[] | undefined);
    set value(value: string | undefined);
    set size(value: CxButtonGroupSize | undefined);
    set disabled(value: boolean | undefined);
    /** Stretches the group to its container width, distributing buttons evenly. */
    set fill(value: boolean | undefined);
    readonly valueChange: EventEmitter<string>;
    protected get disabledHostClass(): boolean;
    protected get fillHostClass(): boolean;
    protected get indicatorX(): string;
    protected get indicatorY(): string;
    protected get indicatorWidth(): string;
    protected get indicatorHeight(): string;
    protected readonly size$: import("@angular/core").Signal<CxButtonGroupSize>;
    protected readonly disabled$: import("@angular/core").Signal<boolean>;
    protected readonly buttons$: import("@angular/core").Signal<CxButtonGroupButton[]>;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    protected select(event: MouseEvent, option: CxButtonGroupButton): void;
    protected onKeydown(event: KeyboardEvent, index: number): void;
    protected tabIndexFor(index: number): string;
    private nextEnabledIndex;
    private observeIndicatorTargets;
    private scheduleIndicatorRefresh;
    private refreshIndicator;
    private destroyIndicatorMeasurement;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxButtonGroupComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxButtonGroupComponent, "cx-button-group", never, { "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "availableValues": { "alias": "availableValues"; "required": false; }; "value": { "alias": "value"; "required": false; }; "size": { "alias": "size"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "fill": { "alias": "fill"; "required": false; }; }, { "valueChange": "valueChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-button-group.component.d.ts.map