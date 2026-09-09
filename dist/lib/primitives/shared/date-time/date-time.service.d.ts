import { type CxDateTimeOptions, type CxDateTimeValue } from "./format-date-time";
import * as i0 from "@angular/core";
/** One visibility-aware clock for every date label in an Angular application. */
export declare class CxDateTimeService {
    private readonly currentTime;
    readonly now: import("@angular/core").Signal<number>;
    constructor();
    format(value: CxDateTimeValue, options?: Omit<CxDateTimeOptions, "now">): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxDateTimeService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<CxDateTimeService>;
}
//# sourceMappingURL=date-time.service.d.ts.map