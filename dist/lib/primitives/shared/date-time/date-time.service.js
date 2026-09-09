import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { DestroyRef, Injectable, NgZone, PLATFORM_ID, inject, signal, } from "@angular/core";
import { formatCxDateTime, } from "./format-date-time.js";
import * as i0 from "@angular/core";
/** One visibility-aware clock for every date label in an Angular application. */
export class CxDateTimeService {
    currentTime = signal(Date.now(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentTime" }] : /* istanbul ignore next */ []));
    now = this.currentTime.asReadonly();
    constructor() {
        const document = inject(DOCUMENT);
        const zone = inject(NgZone);
        const destroyRef = inject(DestroyRef);
        if (!isPlatformBrowser(inject(PLATFORM_ID)))
            return;
        let timer;
        const stop = () => {
            if (timer !== undefined)
                clearTimeout(timer);
            timer = undefined;
        };
        const refresh = () => {
            stop();
            if (document.visibilityState === "hidden")
                return;
            zone.run(() => this.currentTime.set(Date.now()));
            // Align to the wall clock so midnight labels change on the minute boundary.
            zone.runOutsideAngular(() => {
                timer = setTimeout(refresh, 60_000 - (Date.now() % 60_000));
            });
        };
        zone.runOutsideAngular(() => document.addEventListener("visibilitychange", refresh));
        refresh();
        destroyRef.onDestroy(() => {
            stop();
            document.removeEventListener("visibilitychange", refresh);
        });
    }
    format(value, options = {}) {
        return formatCxDateTime(value, {
            ...options,
            now: options.mode === "absolute" ? undefined : this.now(),
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDateTimeService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDateTimeService, providedIn: "root" });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxDateTimeService, decorators: [{
            type: Injectable,
            args: [{ providedIn: "root" }]
        }], ctorParameters: () => [] });
