import { InteractivityChecker } from "@angular/cdk/a11y";
/** Internal ownership of a content region's earned Tab stop. */
export declare class ContentFocusObserver {
    private readonly element;
    private readonly checker;
    private readonly scrollLabel?;
    private readonly keyboardManaged;
    private readonly resize;
    private readonly mutations;
    private frame;
    private ownsRegion;
    constructor(element: HTMLElement, checker: InteractivityChecker, scrollLabel?: (() => string) | undefined, keyboardManaged?: () => boolean);
    refresh(): void;
    disconnect(): void;
    private observeSizes;
    private schedule;
}
//# sourceMappingURL=content-focus.d.ts.map