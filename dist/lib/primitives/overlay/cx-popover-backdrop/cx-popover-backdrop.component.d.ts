import { EventEmitter, OnDestroy, OnInit } from '@angular/core';
import * as i0 from "@angular/core";
export declare class CxPopoverBackdropComponent implements OnInit, OnDestroy {
    private readonly document;
    private readonly host;
    private readonly ngZone;
    private readonly cleanupCallbacks;
    private lastTouchY;
    readonly pressed: EventEmitter<void>;
    ngOnInit(): void;
    ngOnDestroy(): void;
    protected onPointerDown(event: PointerEvent): void;
    protected onClick(event: MouseEvent): void;
    protected onWheel(event: WheelEvent): void;
    protected onTouchMove(event: TouchEvent): void;
    private applyScrollDelta;
    private resolveScrollContainer;
    private findScrollableAncestor;
    private findPreferredScrollContainer;
    private isScrollable;
    private isTopmostBackdrop;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxPopoverBackdropComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxPopoverBackdropComponent, "cx-popover-backdrop", never, {}, { "pressed": "pressed"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-popover-backdrop.component.d.ts.map