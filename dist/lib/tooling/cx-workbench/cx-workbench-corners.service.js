import { DOCUMENT } from "@angular/common";
import { Injectable, inject, signal } from "@angular/core";
import * as i0 from "@angular/core";
/** Document-wide so portaled menus and dialogs use the same preview profile. */
export class CxWorkbenchCornersService {
    root = inject(DOCUMENT).documentElement;
    owners = 0;
    previouslySquare = false;
    square = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "square" }] : /* istanbul ignore next */ []));
    retain() {
        if (this.owners++ === 0) {
            this.previouslySquare = this.root.classList.contains("cx-corners-square");
        }
        return () => {
            if (--this.owners === 0)
                this.setSquare(false);
        };
    }
    setSquare(square) {
        this.square.set(square);
        this.root.classList.toggle("cx-corners-square", square || this.previouslySquare);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxWorkbenchCornersService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxWorkbenchCornersService, providedIn: "root" });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxWorkbenchCornersService, decorators: [{
            type: Injectable,
            args: [{ providedIn: "root" }]
        }] });
