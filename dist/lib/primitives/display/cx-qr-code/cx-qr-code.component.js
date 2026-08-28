import { ChangeDetectionStrategy, Component, Input, ViewChild, effect, signal } from '@angular/core';
import { renderCxQrCodeSvg } from './cx-qr-code.encoder.js';
import * as i0 from "@angular/core";
export class CxQrCodeComponent {
    data$ = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "data$" }] : /* istanbul ignore next */ []));
    size$ = signal(192, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "size$" }] : /* istanbul ignore next */ []));
    errorCorrection$ = signal('M', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "errorCorrection$" }] : /* istanbul ignore next */ []));
    ariaLabel$ = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabel$" }] : /* istanbul ignore next */ []));
    renderError$ = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderError$" }] : /* istanbul ignore next */ []));
    svgHost;
    constructor() {
        effect(() => {
            const data = this.data$();
            const errorCorrection = this.errorCorrection$();
            const size = this.size$();
            if (!data) {
                this.svgHost.nativeElement.innerHTML = '';
                this.renderError$.set(undefined);
                return;
            }
            try {
                this.svgHost.nativeElement.innerHTML = renderCxQrCodeSvg(data, errorCorrection, size).svg;
                this.renderError$.set(undefined);
            }
            catch (error) {
                this.svgHost.nativeElement.innerHTML = '';
                this.renderError$.set(error instanceof Error ? error.message : 'QR render failed.');
            }
        });
    }
    set data(value) {
        this.data$.set(value ?? '');
    }
    set size(value) {
        const numericValue = Number.isFinite(value) ? value : 192;
        this.size$.set(Math.max(64, Math.min(1024, Math.floor(numericValue))));
    }
    set errorCorrection(value) {
        this.errorCorrection$.set(this.isErrorCorrection(value) ? value : 'M');
    }
    set ariaLabel(value) {
        this.ariaLabel$.set(value?.trim() || undefined);
    }
    isErrorCorrection(value) {
        return value === 'L' || value === 'M' || value === 'Q' || value === 'H';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxQrCodeComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxQrCodeComponent, isStandalone: true, selector: "cx-qr-code", inputs: { data: "data", size: "size", errorCorrection: "errorCorrection", ariaLabel: "ariaLabel" }, viewQueries: [{ propertyName: "svgHost", first: true, predicate: ["svgHost"], descendants: true, static: true }], ngImport: i0, template: "<div\n  class=\"cx-qr-code\"\n  [attr.role]=\"ariaLabel$() ? 'img' : null\"\n  [attr.aria-label]=\"ariaLabel$() ?? null\"\n>\n  @if (renderError$()) {\n    <svg\n      class=\"cx-qr-code__footprint\"\n      [attr.width]=\"size$()\"\n      [attr.height]=\"size$()\"\n      viewBox=\"0 0 1 1\"\n      aria-hidden=\"true\"\n    ></svg>\n    <div class=\"cx-qr-code__error\" role=\"status\">\n      <span class=\"cx-qr-code__error-label\">QR render failed</span>\n      <span class=\"cx-qr-code__error-detail\">{{ renderError$() }}</span>\n    </div>\n  } @else if (!data$()) {\n    <svg\n      class=\"cx-qr-code__footprint\"\n      [attr.width]=\"size$()\"\n      [attr.height]=\"size$()\"\n      viewBox=\"0 0 1 1\"\n      aria-hidden=\"true\"\n    ></svg>\n    <div class=\"cx-qr-code__placeholder\" aria-hidden=\"true\">No data</div>\n  }\n  <div #svgHost class=\"cx-qr-code__svg\" aria-hidden=\"true\"></div>\n</div>\n", styles: [":host{display:inline-block;color:var(--ink);line-height:0}.cx-qr-code{position:relative;display:inline-grid;place-items:center;overflow:hidden;border:var(--line);border-radius:var(--radius-sm);background:var(--surface)}.cx-qr-code__svg,.cx-qr-code__footprint{grid-area:1/1}.cx-qr-code__placeholder{position:absolute;inset:0;display:grid;place-items:center;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-qr-code__svg{display:grid;place-items:stretch}.cx-qr-code__svg svg,.cx-qr-code__footprint{display:block}.cx-qr-code__error{position:absolute;inset:0;display:grid;min-width:0;box-sizing:border-box;place-content:center;gap:var(--space-xs);padding:var(--space-md);background:var(--danger-opacity);color:var(--danger);text-align:center}.cx-qr-code__error-label{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-qr-code__error-detail{overflow-wrap:anywhere;color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxQrCodeComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-qr-code', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-qr-code\"\n  [attr.role]=\"ariaLabel$() ? 'img' : null\"\n  [attr.aria-label]=\"ariaLabel$() ?? null\"\n>\n  @if (renderError$()) {\n    <svg\n      class=\"cx-qr-code__footprint\"\n      [attr.width]=\"size$()\"\n      [attr.height]=\"size$()\"\n      viewBox=\"0 0 1 1\"\n      aria-hidden=\"true\"\n    ></svg>\n    <div class=\"cx-qr-code__error\" role=\"status\">\n      <span class=\"cx-qr-code__error-label\">QR render failed</span>\n      <span class=\"cx-qr-code__error-detail\">{{ renderError$() }}</span>\n    </div>\n  } @else if (!data$()) {\n    <svg\n      class=\"cx-qr-code__footprint\"\n      [attr.width]=\"size$()\"\n      [attr.height]=\"size$()\"\n      viewBox=\"0 0 1 1\"\n      aria-hidden=\"true\"\n    ></svg>\n    <div class=\"cx-qr-code__placeholder\" aria-hidden=\"true\">No data</div>\n  }\n  <div #svgHost class=\"cx-qr-code__svg\" aria-hidden=\"true\"></div>\n</div>\n", styles: [":host{display:inline-block;color:var(--ink);line-height:0}.cx-qr-code{position:relative;display:inline-grid;place-items:center;overflow:hidden;border:var(--line);border-radius:var(--radius-sm);background:var(--surface)}.cx-qr-code__svg,.cx-qr-code__footprint{grid-area:1/1}.cx-qr-code__placeholder{position:absolute;inset:0;display:grid;place-items:center;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-qr-code__svg{display:grid;place-items:stretch}.cx-qr-code__svg svg,.cx-qr-code__footprint{display:block}.cx-qr-code__error{position:absolute;inset:0;display:grid;min-width:0;box-sizing:border-box;place-content:center;gap:var(--space-xs);padding:var(--space-md);background:var(--danger-opacity);color:var(--danger);text-align:center}.cx-qr-code__error-label{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-qr-code__error-detail{overflow-wrap:anywhere;color:var(--opacity-high);font-size:var(--font-size-body-xs);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}"] }]
        }], ctorParameters: () => [], propDecorators: { svgHost: [{
                type: ViewChild,
                args: ['svgHost', { static: true }]
            }], data: [{
                type: Input
            }], size: [{
                type: Input
            }], errorCorrection: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }] } });
