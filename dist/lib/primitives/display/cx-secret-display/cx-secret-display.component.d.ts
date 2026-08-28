import { OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export declare class CxSecretDisplayComponent implements OnDestroy {
    private copyResetTimer;
    private valueState;
    private maskedState;
    private ariaLabelState;
    protected readonly revealed: import("@angular/core").WritableSignal<boolean>;
    protected readonly copyState: import("@angular/core").WritableSignal<"idle" | "copied" | "failed">;
    set value(value: string | null | undefined);
    get value(): string;
    set masked(value: boolean);
    get masked(): boolean;
    set ariaLabel(value: string | null | undefined);
    get ariaLabel(): string;
    ngOnDestroy(): void;
    protected displayValue(): string;
    protected valueAriaLabel(): string;
    protected revealLabel(): string;
    protected copyAriaLabel(): string;
    protected copyLabel(): string;
    protected isHidden(): boolean;
    protected toggleReveal(): void;
    protected copy(): Promise<void>;
    private flashCopyState;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSecretDisplayComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSecretDisplayComponent, "cx-secret-display", never, { "value": { "alias": "value"; "required": false; }; "masked": { "alias": "masked"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-secret-display.component.d.ts.map