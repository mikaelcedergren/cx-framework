export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export interface CxQrCodeSvg {
    readonly svg: string;
    readonly moduleCount: number;
    readonly version: number;
}
export declare function renderCxQrCodeSvg(data: string, errorCorrection: QrErrorCorrection, pixelSize?: number): CxQrCodeSvg;
//# sourceMappingURL=cx-qr-code.encoder.d.ts.map