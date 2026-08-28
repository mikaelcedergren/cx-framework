import { type QrErrorCorrection } from './cx-qr-code.encoder';
import * as i0 from "@angular/core";
export type CxQrErrorCorrection = QrErrorCorrection;
export declare class CxQrCodeComponent {
    protected readonly data$: import("@angular/core").WritableSignal<string>;
    protected readonly size$: import("@angular/core").WritableSignal<number>;
    protected readonly errorCorrection$: import("@angular/core").WritableSignal<QrErrorCorrection>;
    protected readonly ariaLabel$: import("@angular/core").WritableSignal<string | undefined>;
    protected readonly renderError$: import("@angular/core").WritableSignal<string | undefined>;
    private readonly svgHost;
    constructor();
    set data(value: string | undefined);
    set size(value: number);
    set errorCorrection(value: CxQrErrorCorrection);
    set ariaLabel(value: string | undefined);
    private isErrorCorrection;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxQrCodeComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxQrCodeComponent, "cx-qr-code", never, { "data": { "alias": "data"; "required": false; }; "size": { "alias": "size"; "required": false; }; "errorCorrection": { "alias": "errorCorrection"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-qr-code.component.d.ts.map