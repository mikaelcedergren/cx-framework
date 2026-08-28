import { type CxIconName } from '../../../icons/manifest';
import { type CxIconMood } from '../../media/cx-icon';
import * as i0 from "@angular/core";
export type CxLogStepPosition = 'first' | 'middle' | 'last' | 'single';
export type CxLogStepSize = 'default' | 'large';
/** A step whose text names something with its own destination. Route in-app, href outward. */
export type CxLogStepLink = {
    readonly routerLink: string | readonly unknown[];
} | {
    readonly href: string;
    readonly target?: string;
};
export declare class CxLogStep {
    readonly position: CxLogStepPosition;
    readonly text: string;
    readonly size: CxLogStepSize;
    readonly icon: CxIconName | undefined;
    readonly mood: CxIconMood;
    readonly link: CxLogStepLink | undefined;
    private constructor();
    static of(text: string): CxLogStep;
    static empty(): CxLogStep;
    withPosition(position: CxLogStepPosition): CxLogStep;
    withText(text: string): CxLogStep;
    withSize(size: CxLogStepSize): CxLogStep;
    withIcon(icon: CxIconName): CxLogStep;
    withMood(mood: CxIconMood): CxLogStep;
    withLink(link: CxLogStepLink): CxLogStep;
}
export declare class CxLogStepComponent {
    private stepState;
    private logContentRef?;
    set step(step: CxLogStep | undefined);
    get step(): CxLogStep;
    datestamp: string;
    description: string;
    author: string;
    protected routerLink(): string | readonly unknown[] | undefined;
    protected href(): string | undefined;
    protected target(): string | null;
    protected rel(): string | null;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxLogStepComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxLogStepComponent, "cx-log-step", never, { "step": { "alias": "step"; "required": false; }; "datestamp": { "alias": "datestamp"; "required": false; }; "description": { "alias": "description"; "required": false; }; "author": { "alias": "author"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-log-step.component.d.ts.map