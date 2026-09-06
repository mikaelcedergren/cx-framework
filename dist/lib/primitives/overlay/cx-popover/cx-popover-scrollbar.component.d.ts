import * as i0 from "@angular/core";
/** Internal presentation for the popover's native scrolling surface. */
export declare class CxPopoverScrollbarComponent {
    readonly viewport: import("@angular/core").InputSignal<HTMLElement>;
    private readonly host;
    private readonly regionId;
    protected readonly metrics: import("@angular/core").WritableSignal<{
        maximum: number;
        position: number;
        height: number;
        top: number;
        travel: number;
    }>;
    protected readonly scrolling: import("@angular/core").WritableSignal<boolean>;
    protected readonly dragging: import("@angular/core").WritableSignal<boolean>;
    private drag?;
    constructor();
    protected startDrag(event: PointerEvent): void;
    protected moveDrag(event: PointerEvent): void;
    protected endDrag(event: PointerEvent): void;
    protected onKeydown(event: KeyboardEvent): void;
    protected onWheel(event: WheelEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxPopoverScrollbarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxPopoverScrollbarComponent, "cx-popover-scrollbar", never, { "viewport": { "alias": "viewport"; "required": true; "isSignal": true; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-popover-scrollbar.component.d.ts.map