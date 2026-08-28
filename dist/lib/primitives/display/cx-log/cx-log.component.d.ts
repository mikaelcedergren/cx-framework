import { CxLogStep } from '../cx-log-step';
import * as i0 from "@angular/core";
/** Immutable complete log model. Entries own their visible detail; the model owns connector positions. */
export declare class CxLog {
    readonly entries: readonly CxLogEntry[];
    private static readonly emptyLog;
    private constructor();
    static empty(): CxLog;
    static of(entries: readonly CxLogEntry[]): CxLog;
    withEntries(entries: readonly CxLogEntry[]): CxLog;
    withEntry(index: number, entry: CxLogEntry): CxLog;
}
export interface CxLogEntry {
    readonly step: CxLogStep;
    readonly datestamp?: string;
    readonly description?: string;
    readonly author?: string;
}
interface CxLogRenderedEntry {
    step: CxLogStep;
    datestamp: string;
    description: string;
    author: string;
}
export declare class CxLogComponent {
    private logState;
    set log(log: CxLog | undefined);
    get log(): CxLog;
    protected renderedEntries(): readonly CxLogRenderedEntry[];
    static ɵfac: i0.ɵɵFactoryDeclaration<CxLogComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxLogComponent, "cx-log", never, { "log": { "alias": "log"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-log.component.d.ts.map