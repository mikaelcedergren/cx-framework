import { OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export type CxCodeBlockAnnotationMood = 'default' | 'info' | 'success' | 'warning' | 'danger';
export type CxCodeBlockLineAnnotation = {
    id?: string;
    kind: 'line';
    line: number;
    mood: CxCodeBlockAnnotationMood;
    message?: string;
};
export type CxCodeBlockRangeAnnotation = {
    id?: string;
    kind: 'range';
    line: number;
    startIndex: number;
    endIndex: number;
    mood: CxCodeBlockAnnotationMood;
    message?: string;
};
export type CxCodeBlockAnnotation = CxCodeBlockLineAnnotation | CxCodeBlockRangeAnnotation;
interface CxCodeBlockSegment {
    text: string;
    startIndex: number;
    mood?: CxCodeBlockAnnotationMood;
    message?: string;
}
interface CxCodeBlockLine {
    number: number;
    mood?: CxCodeBlockAnnotationMood;
    message?: string;
    segments: readonly CxCodeBlockSegment[];
}
export declare class CxCodeBlockComponent implements OnDestroy {
    private copyResetTimer;
    protected readonly copyState: import("@angular/core").WritableSignal<"idle" | "copied" | "failed">;
    code: string;
    heading: string | undefined;
    annotations: readonly CxCodeBlockAnnotation[];
    copyable: boolean;
    wrap: boolean;
    ngOnDestroy(): void;
    protected hasHeading(): boolean;
    protected lines(): readonly CxCodeBlockLine[];
    protected copyIcon(): 'copy' | 'check' | 'error';
    protected copyAriaLabel(): string;
    protected copyDisabled(): boolean;
    protected copy(): Promise<void>;
    private segments;
    private flashCopyState;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxCodeBlockComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxCodeBlockComponent, "cx-code-block", never, { "code": { "alias": "code"; "required": false; }; "heading": { "alias": "heading"; "required": false; }; "annotations": { "alias": "annotations"; "required": false; }; "copyable": { "alias": "copyable"; "required": false; }; "wrap": { "alias": "wrap"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-code-block.component.d.ts.map