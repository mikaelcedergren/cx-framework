import { type OnChanges, type OnDestroy, type SimpleChanges } from '@angular/core';
import * as i0 from "@angular/core";
export type CxBadgeMood = 'default' | 'accent' | 'success' | 'warning' | 'danger';
export type CxBadgePlacement = 'corner' | 'inline';
export declare class CxBadgeComponent implements OnChanges, OnDestroy {
    visible: boolean;
    placement: CxBadgePlacement;
    count: number | undefined;
    text: string | undefined;
    mood: CxBadgeMood;
    ariaLabel: string | undefined;
    private readonly measuredIndicatorWidth;
    private indicatorResizeObserver;
    private invalidValueCombination;
    private warnedInvalidValueCombination;
    private set indicatorRef(value);
    ngOnChanges(_changes: SimpleChanges): void;
    ngOnDestroy(): void;
    protected hasCount(): boolean;
    protected hasText(): boolean;
    protected showsIndicator(): boolean;
    protected showsCount(): boolean;
    protected showsText(): boolean;
    protected hasValue(): boolean;
    protected displayValue(): string;
    protected displayText(): string;
    protected indicatorWidth(): string;
    protected indicatorHeight(): string;
    private validateValueCombination;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxBadgeComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxBadgeComponent, "cx-badge", never, { "visible": { "alias": "visible"; "required": false; }; "placement": { "alias": "placement"; "required": false; }; "count": { "alias": "count"; "required": false; }; "text": { "alias": "text"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-badge.component.d.ts.map