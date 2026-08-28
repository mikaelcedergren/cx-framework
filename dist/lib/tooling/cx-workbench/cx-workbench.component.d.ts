import { type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';
import * as i0 from "@angular/core";
export type CxWorkbenchAlign = 'top' | 'center' | 'bottom';
export type CxWorkbenchPreviewHeight = 'auto' | 'small' | 'medium' | 'large';
export type CxWorkbenchPreviewWidth = 'auto' | 'small' | 'medium' | 'large' | 'full';
export declare class CxWorkbenchComponent {
    protected readonly align$: import("@angular/core").WritableSignal<CxWorkbenchAlign>;
    protected readonly previewHeight$: import("@angular/core").WritableSignal<CxWorkbenchPreviewHeight>;
    protected readonly previewWidth$: import("@angular/core").WritableSignal<CxWorkbenchPreviewWidth>;
    protected readonly alignOptions: CxDropdownOption[];
    protected readonly previewHeightOptions: CxDropdownOption[];
    protected readonly previewWidthOptions: CxDropdownOption[];
    showPreviewHeightControl: boolean;
    showPreviewWidthControl: boolean;
    showAlignControl: boolean;
    set align(value: CxWorkbenchAlign | undefined);
    set previewHeight(value: CxWorkbenchPreviewHeight | undefined);
    set previewWidth(value: CxWorkbenchPreviewWidth | undefined);
    protected onAlignChange(value: string | undefined): void;
    protected onPreviewHeightChange(value: string | undefined): void;
    protected onPreviewWidthChange(value: string | undefined): void;
    private normalizePreviewHeight;
    private normalizePreviewWidth;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxWorkbenchComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxWorkbenchComponent, "cx-workbench", never, { "showPreviewHeightControl": { "alias": "showPreviewHeightControl"; "required": false; }; "showPreviewWidthControl": { "alias": "showPreviewWidthControl"; "required": false; }; "showAlignControl": { "alias": "showAlignControl"; "required": false; }; "align": { "alias": "align"; "required": false; }; "previewHeight": { "alias": "previewHeight"; "required": false; }; "previewWidth": { "alias": "previewWidth"; "required": false; }; }, {}, never, ["[cxWorkbenchPreview]", "[cxWorkbenchNote]", "[cxWorkbenchControls]"], true, never>;
    static ngAcceptInputType_showPreviewHeightControl: unknown;
    static ngAcceptInputType_showPreviewWidthControl: unknown;
    static ngAcceptInputType_showAlignControl: unknown;
}
//# sourceMappingURL=cx-workbench.component.d.ts.map