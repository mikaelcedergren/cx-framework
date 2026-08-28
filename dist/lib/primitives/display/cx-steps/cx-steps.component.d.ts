import * as i0 from "@angular/core";
export interface CxStep {
    name: string;
    badge?: string | number;
    status?: CxStepStatus;
    mood?: CxStepMood;
}
export type CxStepStatus = 'pending';
export type CxStepMood = 'default' | 'danger';
export type CxStepsDensity = 'default' | 'compact';
export type CxStepsLayout = 'default' | 'fill';
export declare class CxStepsComponent {
    private readonly stepsState;
    set steps(value: readonly CxStep[] | undefined);
    get steps(): readonly CxStep[];
    index: number;
    density: CxStepsDensity;
    layout: CxStepsLayout;
    protected readonly steps$: import("@angular/core").Signal<readonly CxStep[]>;
    protected currentIndex(): number;
    protected isCurrent(index: number): boolean;
    protected isCompleted(step: CxStep, index: number): boolean;
    protected labelIsVisible(index: number): boolean;
    protected isDanger(step: CxStep): boolean;
    protected isPending(step: CxStep): boolean;
    /**
     * The label a step would have shown at default density, for the tooltip that
     * stands in for it while compact. Includes the badge, since the badge is part
     * of the visible label the tooltip is replacing.
     */
    protected stepTooltip(step: CxStep): string;
    protected badgeText(step: CxStep): string;
    protected stepStatus(step: CxStep, index: number): string;
    private normalizeSteps;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxStepsComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxStepsComponent, "cx-steps", never, { "steps": { "alias": "steps"; "required": false; }; "index": { "alias": "index"; "required": false; }; "density": { "alias": "density"; "required": false; }; "layout": { "alias": "layout"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-steps.component.d.ts.map