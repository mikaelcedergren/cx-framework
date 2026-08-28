import * as i0 from "@angular/core";
export type CxSeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'recommended';
export type CxSeverityTagVariant = 'bars' | 'dot';
export type CxSeverityTagDisplay = 'severity' | 'grade' | 'recommended';
export type CxSeverityTagFavor = 'low' | 'high';
export type CxSeverityGrade = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
export declare function cxSeverityLevelForScore(score: number, favor?: CxSeverityTagFavor): Exclude<CxSeverityLevel, 'recommended'>;
export declare function cxSeverityGradeForScore(score: number, favor?: CxSeverityTagFavor): CxSeverityGrade;
export declare class CxSeverityTagComponent {
    private severityOverride;
    private scoreValue;
    variant: CxSeverityTagVariant;
    display: CxSeverityTagDisplay;
    favor: CxSeverityTagFavor;
    kev: boolean;
    set severity(value: CxSeverityLevel | undefined);
    set score(value: number | string | undefined);
    protected label(): string;
    protected filledBars(): number;
    protected bars(): number[];
    protected scoreText(): string | undefined;
    protected scoreVisible(): boolean;
    protected hasContent(): boolean;
    protected stateClass(): string;
    private barCount;
    private severityLevel;
    private gradeLabel;
    private normalizedScore;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSeverityTagComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSeverityTagComponent, "cx-severity-tag", never, { "variant": { "alias": "variant"; "required": false; }; "display": { "alias": "display"; "required": false; }; "favor": { "alias": "favor"; "required": false; }; "kev": { "alias": "kev"; "required": false; }; "severity": { "alias": "severity"; "required": false; }; "score": { "alias": "score"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-severity-tag.component.d.ts.map