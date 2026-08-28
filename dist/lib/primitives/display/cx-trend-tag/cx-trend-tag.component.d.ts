import * as i0 from "@angular/core";
export type CxTrendTagFavor = 'up' | 'down';
export type CxTrendTagUnit = 'percent' | 'none';
type CxTrendTagDirection = 'up' | 'flat' | 'down';
export declare class CxTrendTagComponent {
    private amountValue;
    private favorValue;
    private unitValue;
    set favor(value: CxTrendTagFavor | undefined);
    set unit(value: CxTrendTagUnit | undefined);
    set amount(value: number);
    protected iconName(): "arrow-right" | "trend-down" | "trend-up";
    protected trendClass(): CxTrendTagDirection;
    protected displayValue(): string;
    private roundedAmount;
    private formatAmount;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTrendTagComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTrendTagComponent, "cx-trend-tag", never, { "favor": { "alias": "favor"; "required": false; }; "unit": { "alias": "unit"; "required": false; }; "amount": { "alias": "amount"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-trend-tag.component.d.ts.map