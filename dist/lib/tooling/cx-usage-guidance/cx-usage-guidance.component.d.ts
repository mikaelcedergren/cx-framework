import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export declare class CxUsageGuidanceComponent {
    private readonly textState;
    protected readonly draft$: import("@angular/core").WritableSignal<string>;
    protected readonly editing$: import("@angular/core").WritableSignal<boolean>;
    private editor?;
    componentName: string;
    saving: boolean;
    error: string;
    /** When false, guidance is read-only — no edit affordance, no editing. */
    editable: boolean;
    set text(value: string | null | undefined);
    readonly textChange: EventEmitter<string>;
    protected readonly displayText$: import("@angular/core").Signal<string>;
    protected readonly hasText$: import("@angular/core").Signal<boolean>;
    protected readonly editLabel$: import("@angular/core").Signal<string>;
    protected startEditing(): void;
    protected onDraftInput(event: Event): void;
    protected onEditorKeydown(event: KeyboardEvent): void;
    protected commitEditing(): void;
    protected cancelEditing(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxUsageGuidanceComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxUsageGuidanceComponent, "cx-usage-guidance", never, { "componentName": { "alias": "componentName"; "required": false; }; "saving": { "alias": "saving"; "required": false; }; "error": { "alias": "error"; "required": false; }; "editable": { "alias": "editable"; "required": false; }; "text": { "alias": "text"; "required": false; }; }, { "textChange": "textChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-usage-guidance.component.d.ts.map