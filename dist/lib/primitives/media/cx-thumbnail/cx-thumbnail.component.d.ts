import { OnChanges, OnDestroy } from "@angular/core";
import { type CxThumbnailFile, type CxThumbnailFit, type CxThumbnailVariant } from "./thumbnail.types";
import * as i0 from "@angular/core";
export declare class CxThumbnailComponent implements OnChanges, OnDestroy {
    file: CxThumbnailFile;
    previewSrc: string | undefined;
    variant: CxThumbnailVariant;
    fit: CxThumbnailFit;
    borderRadius: "default" | "none";
    loading: boolean;
    private readonly renderPdf;
    private controller?;
    private timer?;
    private objectUrl?;
    protected readonly state: import("@angular/core").WritableSignal<"loading" | "ready" | "unavailable" | "empty">;
    protected readonly imageSource: import("@angular/core").WritableSignal<string>;
    private readonly imageVersion;
    protected readonly images: import("@angular/core").Signal<{
        src: string;
        key: number;
    }[]>;
    protected readonly text: import("@angular/core").WritableSignal<string>;
    protected readonly rows: import("@angular/core").WritableSignal<string[][]>;
    protected get label(): string;
    protected get fileType(): string;
    ngOnChanges(): void;
    protected imageLoaded(key: number): void;
    protected imageFailed(key: number): void;
    private loadDocument;
    private finish;
    private release;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxThumbnailComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxThumbnailComponent, "cx-thumbnail", never, { "file": { "alias": "file"; "required": true; }; "previewSrc": { "alias": "previewSrc"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "fit": { "alias": "fit"; "required": false; }; "borderRadius": { "alias": "borderRadius"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; }, {}, never, never, true, never>;
    static ngAcceptInputType_loading: unknown;
}
//# sourceMappingURL=cx-thumbnail.component.d.ts.map